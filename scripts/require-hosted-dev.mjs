/**
 * Refuse to start `npm run dev` against the local file adapter.
 *
 * ELDREVE still HAS a no-Supabase local mode — the Playwright suite runs
 * entirely in it, and `npm run seed` maintains its data. What changed
 * (2026-08-07, owner) is that the development server may no longer reach it.
 * The site is going live, and a dev server silently backed by `.data/db.json`
 * shows a catalogue, an order history and an admin that look real and are not:
 * the 3-product seed is not the 2 products actually on sale. Every judgement
 * made in front of that screen — "the grid looks wrong", "this filter is
 * broken" — is made about the wrong data.
 *
 * So local mode sleeps rather than being deleted. It wakes only for the test
 * suite, which asks for it by name (playwright.config.ts blanks the Supabase
 * variables for its own server), or for someone who sets ALLOW_LOCAL_MODE=1
 * deliberately — offline work, or a hosted outage. It is never the state you
 * arrive in by forgetting to configure something.
 *
 * Wired as `predev`, so npm runs it before `next dev` with no way to skip it
 * accidentally. `npm run build` keeps its own, more permissive check
 * (scripts/validate-env.mjs): a build with no Supabase at all is exactly what
 * the test suite needs, and breaking that would break all 135 e2e tests.
 */

import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

// Standalone Node scripts do not read Next's .env files on their own; use
// Next's own loader so this sees precisely what `next dev` would see.
loadEnvConfig(process.cwd());

/** The three that must all be present for the app to talk to hosted Supabase. */
const REQUIRED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const missing = REQUIRED.filter((name) => !process.env[name]?.trim());

if (missing.length === 0) {
  console.log("[dev] Hosted Supabase configured — dev server uses live data.");
  process.exit(0);
}

// The deliberate wake-up. Loud on purpose: whoever reads the next screenshot
// needs to know it is not the real shop.
if (["1", "true"].includes((process.env.ALLOW_LOCAL_MODE ?? "").toLowerCase())) {
  console.warn(
    "[dev] ALLOW_LOCAL_MODE is set — starting against the LOCAL FILE ADAPTER.",
  );
  console.warn(
    "[dev] Catalogue, orders and admin data are .data/db.json seed data, NOT the live shop.",
  );
  process.exit(0);
}

console.error(
  `[dev] Refusing to start: ${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} unset.`,
);
console.error(
  "[dev] Without these the app falls back to .data/db.json, whose seed data is",
);
console.error(
  "[dev] not what the live shop sells — so nothing you see would be real.",
);
console.error("[dev]");
console.error("[dev] Fix: copy the Supabase values into .env.local (.env.example lists them).");
console.error(
  "[dev] Really want the file adapter? ALLOW_LOCAL_MODE=1 npm run dev",
);
process.exit(1);
