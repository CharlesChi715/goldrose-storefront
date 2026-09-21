import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Every file under `dir` whose name matches, walked recursively.
 *
 * @param {string} dir - Directory to walk, relative to the repo root.
 * @param {string} name - Exact file name to match.
 * @returns {string[]} Repo-relative paths.
 */
function filesNamed(dir, name) {
  const found = [];
  const walk = (d) => {
    let entries;
    try {
      entries = readdirSync(join(ROOT, d));
    } catch {
      return;
    }
    for (const entry of entries) {
      const rel = join(d, entry);
      if (statSync(join(ROOT, rel)).isDirectory()) {
        walk(rel);
      } else if (entry === name) {
        found.push(rel);
      }
    }
  };
  walk(dir);
  return found;
}

/** Every `.sql` migration, by file name. */
function migrations() {
  return readdirSync(join(ROOT, "supabase/migrations")).filter((f) =>
    f.endsWith(".sql"),
  );
}

/** How many tables the migrations create, counted across every file. */
function tableCount() {
  let n = 0;
  for (const file of migrations()) {
    const sql = readFileSync(join(ROOT, "supabase/migrations", file), "utf8");
    n += (sql.match(/^\s*create table/gim) ?? []).length;
  }
  return n;
}

/**
 * The counts README states about this repository, each paired with the way to
 * recompute it. A number in prose is a promise; this is what keeps it.
 *
 * Adding a page, a route handler, a migration or a table changes one of these.
 * When that happens this check fails with the new value — paste it in.
 */
const CLAIMS = [
  {
    label: "storefront pages",
    actual: () =>
      filesNamed("app", "page.tsx").filter((f) => !f.startsWith("app/admin/"))
        .length,
    pattern: /\*\*Storefront\*\* — (\d+) pages/,
  },
  {
    label: "admin pages",
    actual: () => filesNamed("app/admin", "page.tsx").length,
    pattern: /\*\*Admin\*\* — (\d+) pages/,
  },
  {
    label: "pages (architecture diagram)",
    actual: () => filesNamed("app", "page.tsx").length,
    pattern: /app\/\s+(\d+) pages,/,
  },
  {
    label: "route handlers (architecture diagram)",
    actual: () => filesNamed("app", "route.ts").length,
    pattern: /app\/\s+\d+ pages, (\d+) route handlers/,
  },
  {
    label: "route handlers (layout)",
    actual: () => filesNamed("app", "route.ts").length,
    pattern: /32 admin pages, (\d+) handlers/,
  },
  {
    label: "tables (architecture diagram)",
    actual: tableCount,
    pattern: /(\d+) tables, \d+ migrations/,
  },
  {
    label: "migrations (architecture diagram)",
    actual: () => migrations().length,
    pattern: /\d+ tables, (\d+) migrations/,
  },
  {
    label: "migrations (layout)",
    actual: () => migrations().length,
    pattern: /supabase\/\s+(\d+) SQL migrations/,
  },
  {
    label: "tables (layout)",
    actual: tableCount,
    pattern: /\d+ SQL migrations — (\d+) tables/,
  },
];

const readme = readFileSync(join(ROOT, "README.md"), "utf8");
const problems = [];

for (const claim of CLAIMS) {
  const match = readme.match(claim.pattern);
  if (!match) {
    problems.push(
      `README no longer states the ${claim.label}\n` +
        `  detail: nothing matched ${claim.pattern}\n` +
        `  hint: restore the sentence, or delete this claim from scripts/check-counts.mjs`,
    );
    continue;
  }
  const stated = Number(match[1]);
  const actual = claim.actual();
  if (stated !== actual) {
    problems.push(
      `README says ${stated} ${claim.label}; the repository has ${actual}\n` +
        `  detail: matched "${match[0].trim()}"\n` +
        `  hint: change the number to ${actual}, or delete the claim — a count nobody maintains is worse than no count`,
    );
  }
}

for (const problem of problems) {
  console.error(`error: ${problem}`);
}
if (problems.length) {
  console.error(`\n${problems.length} stale count(s) in README.md`);
  process.exit(1);
}
console.log(`checked ${CLAIMS.length} counts in README.md: all match`);
