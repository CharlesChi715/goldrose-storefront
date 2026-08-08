/**
 * ROLE OF THIS FILE
 * Unit tests for greetingName(), the one-word name the homepage welcome card
 * (Figma 2974:359) puts after "Hello,". The card is a 187px box at 20px
 * Playfair, so the interesting cases are all about picking ONE word: the
 * dashboard's rule (lib/account/data.ts) deliberately falls back to the whole
 * email address, and this must not.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { greetingName } from "../../lib/account/greeting.ts";

test("a saved first name wins over everything else", () => {
  assert.equal(
    greetingName(
      { first_name: "Jessica", full_name: "Someone Else", name: "nope" },
      "jess@example.com",
    ),
    "Jessica",
  );
});

test("a provider full name contributes only its first word", () => {
  assert.equal(greetingName({ full_name: "Mei Ling Chan" }, null), "Mei");
  // Any run of whitespace splits, not just a single space.
  assert.equal(greetingName({ name: "Mei\t Ling" }, null), "Mei");
  assert.equal(greetingName({ nickname: "roseluvr" }, null), "roseluvr");
});

test("metadata keys are ranked full_name → name → nickname", () => {
  assert.equal(
    greetingName({ name: "Second Choice", nickname: "third" }, null),
    "Second",
  );
});

test("with no name at all it uses the email account, never the address", () => {
  const name = greetingName({}, "qiyaofu715@gmail.com");
  assert.equal(name, "qiyaofu715");
  assert.ok(!name.includes("@"), "the domain must never reach the card");
});

test("blank and non-string metadata is ignored, not printed", () => {
  assert.equal(
    greetingName({ first_name: "   " }, "buyer@example.com"),
    "buyer",
  );
  assert.equal(greetingName({ first_name: 42 }, "buyer@example.com"), "buyer");
  assert.equal(greetingName(null, undefined), "there");
  assert.equal(greetingName({}, "   "), "there");
});
