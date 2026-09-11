/**
 * ROLE OF THIS FILE
 * Keep `.env.example` honest about what the code actually reads, and refuse to
 * let a secret be published to the browser by naming it wrongly.
 *
 * Why this exists: `.env.example` is the only map of this system's
 * credentials, and it is maintained by hand. Nothing checked it. Two drifts
 * were present the day this was written (2026-09-07) — `SUPABASE_ACCESS_TOKEN`,
 * read by a script and documented nowhere, and `ALERT_EMAIL`, added an hour
 * earlier by the change that needed this check. Both are small, and both are
 * the shape of the large one: a variable that must be set in Vercel for a
 * feature to work, that nobody knows exists until the feature quietly does
 * nothing in production.
 *
 * The second rule matters more than the first. `NEXT_PUBLIC_*` is compiled
 * into the JavaScript bundle at build time and shipped to every visitor, so a
 * secret behind that prefix is not a leak waiting to happen — it is a leak
 * already, on the next deploy, permanently, in a file anyone can read. Two
 * such names are legitimate and are listed with their reason; a third arriving
 * without one is a build failure, not a code review comment.
 *
 *   node scripts/check-env.mjs          # report, exit 1 on errors
 *   node scripts/check-env.mjs --json   # machine-shaped output
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Where our own code lives. Everything else is somebody else's env.
 *
 * `tests/` is deliberately absent: a test reading `TZ` to pin a clock is
 * configuring the test runner, not the shop, and listing it in `.env.example`
 * would tell a reader to set it in Vercel.
 */
const SOURCE_ROOTS = ["app", "lib", "components", "scripts"];
const SOURCE_FILES = ["proxy.ts", "next.config.ts", "playwright.config.ts"];
const SOURCE_EXT = /\.(ts|tsx|mjs|js)$/;

/**
 * Names the runtime supplies. They are read by our code and belong in nobody's
 * `.env.example`, because setting them by hand is either impossible or wrong.
 */
export const PLATFORM_PROVIDED = new Map([
  ["NODE_ENV", "set by node/next"],
  ["CI", "set by the CI runner"],
  ["VERCEL_ENV", "set by Vercel"],
  ["VERCEL_TARGET_ENV", "set by Vercel"],
  ["VERCEL_PROJECT_PRODUCTION_URL", "set by Vercel"],
]);

/**
 * Names read only by an operator running a script by hand, never by the
 * deployed app. They are documented in README.md, and adding them to
 * `.env.example` would wrongly imply Vercel needs them.
 */
export const OPERATOR_ONLY = new Map([
  [
    "SUPABASE_ACCESS_TOKEN",
    "scripts/apply-auth-email-templates.mjs; falls back to the Supabase CLI's own token",
  ],
]);

/**
 * Documented on purpose, read by our code on purpose never. `.env.example`
 * explains at length that this one is held by Supabase, and that adding it to
 * Vercel would be a mistake — our code is at neither end of that link.
 */
export const DOCUMENTED_NOT_READ = new Map([
  [
    "RESEND_SMTP_PASSWORD",
    "held by Supabase for SMTP; our code is not a party",
  ],
]);

/**
 * `NEXT_PUBLIC_*` names that may carry a credential-shaped word, each with the
 * reason it is safe to publish. Anything else matching that shape is an error.
 */
export const PUBLIC_BY_CONSTRUCTION = new Map([
  [
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "grants nothing by itself — Row Level Security decides what a request may do",
  ],
  [
    "NEXT_PUBLIC_PAYPAL_CLIENT_ID",
    "PayPal's public client id, required by the browser SDK",
  ],
]);

/** Words that mean "this is a credential" in an environment variable name. */
const SECRET_SHAPED = /(SECRET|PASSWORD|TOKEN|_KEY|APIKEY)/;

/**
 * Every file we consider "our code".
 *
 * @returns Absolute paths of source files.
 */
function sourceFiles() {
  const found = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      if (name === "node_modules" || name.startsWith(".")) continue;
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (SOURCE_EXT.test(name)) found.push(path);
    }
  };
  for (const root of SOURCE_ROOTS) {
    const path = join(ROOT, root);
    try {
      walk(path);
    } catch {
      // A source root that does not exist is not this check's problem.
    }
  }
  for (const file of SOURCE_FILES) {
    const path = join(ROOT, file);
    try {
      statSync(path);
      found.push(path);
    } catch {
      // Same.
    }
  }
  return found;
}

/**
 * Blank out comments, so a variable NAMED in prose is not mistaken for one
 * READ in code. This script's own header was its first false positive.
 *
 * Line comments are only stripped when the `//` is not part of a `://`, which
 * keeps a URL inside a string from swallowing the rest of its line. Block
 * comments are stripped outright. This is a heuristic and does not need to be
 * more: the worst case is a missed read inside an unusual string, which the
 * next reader notices, rather than a wrong name in the credential map.
 *
 * @param text - File contents.
 * @returns The same text with comment bodies replaced by spaces.
 */
export function withoutComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

/**
 * Environment variable names our code reads, and where.
 *
 * Matches dotted and bracketed access. It deliberately does NOT try to resolve
 * a computed name — that is rare, and a check that guesses is a check nobody
 * trusts.
 *
 * @returns Map of name to the repo-relative files reading it.
 */
export function readsInSource(files = sourceFiles()) {
  const reads = new Map();
  const pattern =
    /process\.env(?:\.([A-Z_][A-Z0-9_]*)|\[\s*["'`]([A-Z_][A-Z0-9_]*)["'`]\s*\])/g;
  for (const file of files) {
    const text = withoutComments(readFileSync(file, "utf8"));
    for (const match of text.matchAll(pattern)) {
      const name = match[1] ?? match[2];
      const where = file.slice(ROOT.length + 1);
      if (!reads.has(name)) reads.set(name, new Set());
      reads.get(name).add(where);
    }
  }
  return reads;
}

/**
 * Names documented in `.env.example`, in order.
 *
 * @returns The documented names.
 */
export function documentedNames(
  text = readFileSync(join(ROOT, ".env.example"), "utf8"),
) {
  return text
    .split("\n")
    .map((line) => /^([A-Z_][A-Z0-9_]*)=/.exec(line)?.[1])
    .filter((name) => name !== undefined);
}

/**
 * Compare the two and produce the findings.
 *
 * @param reads - Output of `readsInSource`.
 * @param documented - Output of `documentedNames`.
 * @returns `{ errors, warnings }`, both arrays of strings.
 */
export function compare(reads, documented) {
  const errors = [];
  const warnings = [];
  const documentedSet = new Set(documented);

  for (const [name, files] of [...reads].sort()) {
    if (documentedSet.has(name)) continue;
    if (PLATFORM_PROVIDED.has(name)) continue;
    if (OPERATOR_ONLY.has(name)) continue;
    const where = [...files].sort().slice(0, 3).join(", ");
    errors.push(
      `${name} is read by the code but documented nowhere (${where}). ` +
        `Add it to .env.example, or list it in PLATFORM_PROVIDED / ` +
        `OPERATOR_ONLY in this script with the reason.`,
    );
  }

  for (const name of documented) {
    if (reads.has(name)) continue;
    if (DOCUMENTED_NOT_READ.has(name)) continue;
    warnings.push(
      `${name} is documented in .env.example but nothing reads it — dead ` +
        `configuration, or a rename that left the old name behind.`,
    );
  }

  for (const name of new Set([...documented, ...reads.keys()])) {
    if (!name.startsWith("NEXT_PUBLIC_")) continue;
    if (!SECRET_SHAPED.test(name)) continue;
    if (PUBLIC_BY_CONSTRUCTION.has(name)) continue;
    errors.push(
      `${name} is NEXT_PUBLIC_ and named like a credential. Anything behind ` +
        `that prefix is compiled into the browser bundle and shipped to every ` +
        `visitor. Rename it, or add it to PUBLIC_BY_CONSTRUCTION with the ` +
        `reason it is safe to publish.`,
    );
  }

  const duplicates = documented.filter(
    (name, index) => documented.indexOf(name) !== index,
  );
  for (const name of new Set(duplicates)) {
    errors.push(`${name} is listed twice in .env.example.`);
  }

  return { errors, warnings };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const reads = readsInSource();
  const documented = documentedNames();
  const { errors, warnings } = compare(reads, documented);

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ errors, warnings }, null, 2));
  } else {
    for (const warning of warnings) console.warn(`  warning: ${warning}`);
    if (errors.length) {
      console.error(
        `\n${errors.length} problem(s) between the code and .env.example — ` +
          `the only map\nof this system's credentials.\n`,
      );
      for (const error of errors) console.error(`  ${error}`);
      console.error("");
    } else {
      console.log(
        `env ok — ${documented.length} documented, ${reads.size} read in code.`,
      );
    }
  }

  process.exit(errors.length ? 1 : 0);
}
