/**
 * ROLE OF THIS FILE
 * Unit tests for scripts/check-env.mjs. The rule worth protecting is the
 * NEXT_PUBLIC_ one: it is the difference between a secret in a vault and a
 * secret in every visitor's JavaScript bundle, and it has to keep failing for
 * names nobody has thought of yet.
 *
 * The comment-stripping tests exist because the check's first run reported its
 * own documentation as a finding.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  compare,
  documentedNames,
  withoutComments,
} from "../../scripts/check-env.mjs";

/** Build the reads map the way readsInSource would. */
const reads = (...names: string[]) =>
  new Map(names.map((name) => [name, new Set(["lib/example.ts"])]));

test("a variable read in code but documented nowhere is an error", () => {
  const { errors } = compare(reads("BRAND_NEW_KEY"), []);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /BRAND_NEW_KEY/);
  assert.match(errors[0], /documented nowhere/);
});

test("a platform-supplied variable needs no documentation", () => {
  const { errors } = compare(reads("VERCEL_ENV", "NODE_ENV", "CI"), []);
  assert.deepEqual(errors, []);
});

test("an operator-only variable needs no documentation", () => {
  const { errors } = compare(reads("SUPABASE_ACCESS_TOKEN"), []);
  assert.deepEqual(errors, []);
});

test("a documented variable nothing reads is a warning, not an error", () => {
  const { errors, warnings } = compare(new Map(), ["LEFTOVER_SETTING"]);
  assert.deepEqual(errors, []);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /LEFTOVER_SETTING/);
});

test("the SMTP password is documented and unread on purpose, so it is silent", () => {
  const { errors, warnings } = compare(new Map(), ["RESEND_SMTP_PASSWORD"]);
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
});

test("a secret-shaped NEXT_PUBLIC_ name is an error, however it arrives", () => {
  // Documented but unread…
  assert.equal(
    compare(new Map(), ["NEXT_PUBLIC_STRIPE_SECRET"]).errors.filter((e) =>
      /browser bundle/.test(e),
    ).length,
    1,
  );
  // …and read but undocumented.
  assert.equal(
    compare(reads("NEXT_PUBLIC_ADMIN_TOKEN"), []).errors.filter((e) =>
      /browser bundle/.test(e),
    ).length,
    1,
  );
});

test("the two legitimately public credentials are allowed, with a reason", () => {
  const { errors } = compare(
    reads("NEXT_PUBLIC_SUPABASE_ANON_KEY", "NEXT_PUBLIC_PAYPAL_CLIENT_ID"),
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "NEXT_PUBLIC_PAYPAL_CLIENT_ID"],
  );
  assert.deepEqual(errors, []);
});

test("a public name with no credential word in it is fine", () => {
  const { errors } = compare(reads("NEXT_PUBLIC_SITE_URL"), [
    "NEXT_PUBLIC_SITE_URL",
  ]);
  assert.deepEqual(errors, []);
});

test("a name listed twice in .env.example is an error", () => {
  const { errors } = compare(reads("DUPLICATED"), ["DUPLICATED", "DUPLICATED"]);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /listed twice/);
});

test("a variable named in a comment is not a variable that is read", () => {
  const source = `
    // process.env.MENTIONED_IN_A_LINE_COMMENT
    /* process.env.MENTIONED_IN_A_BLOCK_COMMENT */
    const real = process.env.ACTUALLY_READ;
  `;
  const stripped = withoutComments(source);
  assert.ok(!stripped.includes("MENTIONED_IN_A_LINE_COMMENT"));
  assert.ok(!stripped.includes("MENTIONED_IN_A_BLOCK_COMMENT"));
  assert.ok(stripped.includes("ACTUALLY_READ"));
});

test("a URL in a string does not swallow the rest of its line", () => {
  const source = `const u = "https://example.com"; const k = process.env.STILL_FOUND;`;
  assert.ok(withoutComments(source).includes("STILL_FOUND"));
});

test("the repo's own .env.example parses to a plausible list of names", () => {
  const names = documentedNames();
  assert.ok(names.length > 10, "expected the real file to document many names");
  assert.ok(names.includes("ALERT_EMAIL"));
  assert.ok(names.every((name) => /^[A-Z_][A-Z0-9_]*$/.test(name)));
});
