/**
 * ROLE OF THIS FILE
 * Guard the `supabase/migrations/` sequence against the mistakes that no other
 * check in this repo can see.
 *
 * Why this exists: on 2026-08-07 two branches were merged that had each added
 * a migration numbered `0009` — `0009_product_image_spotlight.sql` from
 * `worktree-media-spotlight` and `0009_product_best_for_facets.sql` from
 * `feat/best-for-facets`. Git saw two files with different names, so it merged
 * them cleanly. Nothing downstream noticed either: lint, typecheck, the build
 * and all 129 tests passed, because no check in CI reads a `.sql` file at all.
 * The collision was found by hand, and only then did the second, worse problem
 * surface — both migrations rebuild the `catalog_products` view, and the
 * `best_for` one recreates it WITHOUT the spotlight columns. Applied in the
 * wrong order it would have silently stripped columns the storefront reads,
 * with nothing failing loudly.
 *
 * A migration number is a shared namespace with no locking, so parallel
 * branches collide in it by construction — this is a matter of when, not if.
 *
 *   node scripts/check-migrations.mjs          # report, exit 1 on errors
 *   node scripts/check-migrations.mjs --json   # machine-shaped output
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MIGRATIONS = join(ROOT, "supabase", "migrations");

/**
 * Versions deliberately absent from the sequence, so a known gap is not
 * reported forever. `0004` was abandoned and its orphan history row repaired
 * on 2026-07-28; it is intentional, not a missing file (SUMMARY.md).
 */
export const KNOWN_SKIPPED = new Set(["0004"]);

/** `0009_product_best_for_facets.sql` → four digits, then lower_snake_case. */
const NAME_RE = /^(\d{4})_([a-z0-9]+(?:_[a-z0-9]+)*)\.sql$/;

/**
 * Split a migration filename into its version and slug.
 *
 * @param name - Bare filename, e.g. `0009_product_best_for_facets.sql`.
 * @returns `{ version, slug }`, or `null` when the name breaks the convention.
 */
export function parseMigrationName(name) {
  const match = NAME_RE.exec(name);
  return match ? { version: match[1], slug: match[2] } : null;
}

/**
 * The views a migration defines, with the column names each definition
 * exposes.
 *
 * This is a heuristic, not a SQL parser: it reads the `p.column` references
 * and `as alias` labels between `create view X as` and its `from`. That is
 * enough to catch a later definition dropping a column an earlier one added —
 * the failure mode that motivated this file — and it only ever produces
 * warnings, never a build failure, so a miss or a false positive is cheap.
 *
 * @param sql - The migration's full text.
 * @returns One entry per `create [or replace] view` found.
 */
export function viewDefinitions(sql) {
  const out = [];
  const create =
    /create\s+(?:or\s+replace\s+)?view\s+(?:public\.)?(\w+)\s+as\b/gi;
  let match;
  while ((match = create.exec(sql)) !== null) {
    const rest = sql.slice(match.index + match[0].length);
    // The select list ends at the first `from` on its own word boundary.
    const body = rest.split(/\bfrom\b/i)[0] ?? "";
    const columns = new Set();
    for (const [, col] of body.matchAll(/\b\w+\.(\w+)/g)) columns.add(col);
    for (const [, alias] of body.matchAll(/\bas\s+(\w+)/gi)) columns.add(alias);
    out.push({ view: match[1], columns });
  }
  return out;
}

/**
 * Inspect a whole migration set.
 *
 * Pure: it takes the files rather than reading the disk, so the unit tests can
 * describe a broken sequence without creating one.
 *
 * @param files - `{ name, sql }` per migration, in any order.
 * @returns `{ errors, warnings }` — each a list of human-readable strings.
 */
export function inspectMigrations(files) {
  const errors = [];
  const warnings = [];

  // 1. Filenames. A name that does not parse has no version, so every later
  //    check would silently skip it — this has to be an error.
  const parsed = [];
  for (const file of [...files].sort((a, b) => a.name.localeCompare(b.name))) {
    const info = parseMigrationName(file.name);
    if (!info) {
      errors.push(
        `${file.name}: filename must be NNNN_lower_snake_case.sql ` +
          `(four digits, underscore, lowercase words).`,
      );
      continue;
    }
    parsed.push({ ...file, ...info });
  }

  // 2. Duplicate versions — the 2026-08-07 bug. Two files claiming the same
  //    number leave the apply order undefined, and `supabase db push` has no
  //    way to choose.
  const byVersion = new Map();
  for (const file of parsed) {
    if (!byVersion.has(file.version)) byVersion.set(file.version, []);
    byVersion.get(file.version).push(file.name);
  }
  for (const [version, names] of [...byVersion].sort()) {
    if (names.length > 1) {
      errors.push(
        `version ${version} is claimed by ${names.length} files: ` +
          `${names.join(", ")}. Renumber all but one — and check the ORDER ` +
          `is right, not just that the clash is gone.`,
      );
    }
  }

  // 3. Gaps. Not fatal (0004 is skipped on purpose), but a new one usually
  //    means a file was deleted or misnumbered.
  const versions = [...byVersion.keys()].sort();
  if (versions.length) {
    const first = Number(versions[0]);
    const last = Number(versions[versions.length - 1]);
    for (let n = first; n <= last; n += 1) {
      const version = String(n).padStart(4, "0");
      if (byVersion.has(version) || KNOWN_SKIPPED.has(version)) continue;
      warnings.push(
        `version ${version} is missing from the sequence. If that is ` +
          `deliberate, add it to KNOWN_SKIPPED in this script.`,
      );
    }
  }

  // 4. A view rebuilt by several migrations: the highest-numbered definition
  //    is the one the database ends up with, so it must carry every column the
  //    earlier ones added. This is exactly what nearly shipped on 2026-08-07.
  const byView = new Map();
  for (const file of parsed) {
    for (const def of viewDefinitions(file.sql)) {
      if (!byView.has(def.view)) byView.set(def.view, []);
      byView.get(def.view).push({ version: file.version, ...def });
    }
  }
  for (const [view, defs] of [...byView].sort()) {
    if (defs.length < 2) continue;
    const ordered = [...defs].sort((a, b) =>
      a.version.localeCompare(b.version),
    );
    const winner = ordered[ordered.length - 1];
    for (const earlier of ordered.slice(0, -1)) {
      const dropped = [...earlier.columns].filter(
        (col) => !winner.columns.has(col),
      );
      if (dropped.length) {
        warnings.push(
          `view ${view}: ${winner.version} is the definition that survives, ` +
            `but ${earlier.version} exposed ${dropped.join(", ")} and ` +
            `${winner.version} does not. Confirm that is intended — a view ` +
            `the storefront reads can lose columns without anything failing.`,
        );
      }
    }
  }

  return { errors, warnings };
}

/** Read `supabase/migrations/` off disk as `inspectMigrations` input. */
function readMigrations() {
  return readdirSync(MIGRATIONS)
    .filter((name) => name.endsWith(".sql"))
    .map((name) => ({
      name,
      sql: readFileSync(join(MIGRATIONS, name), "utf8"),
    }));
}

// Run only when executed directly, so the tests can import the pure parts.
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const files = readMigrations();
  const { errors, warnings } = inspectMigrations(files);

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ errors, warnings }, null, 2));
  } else {
    for (const warning of warnings) console.warn(`  warning: ${warning}`);
    if (errors.length) {
      console.error(
        `\n${errors.length} problem(s) in supabase/migrations — a migration ` +
          `sequence\nthat does not apply cleanly is invisible to every other ` +
          `check here.\n`,
      );
      for (const error of errors) console.error(`  ${error}`);
      console.error("");
    } else {
      console.log(
        `migrations ok — ${files.length} files, no duplicate versions.`,
      );
    }
  }

  process.exit(errors.length ? 1 : 0);
}
