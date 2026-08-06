/**
 * ROLE OF THIS FILE
 * Unit coverage for the /account/personal-info field rules (live 2026-08-06).
 * These are the pure half of the profile save — everything that decides what
 * a stored name IS — and they carry two loads worth pinning:
 *
 *   1. Normalisation runs on READ as well as write, so it is what makes
 *      "nothing changed" detectable. If cleanName ever stopped being
 *      idempotent, every save would look like a real edit and every tap would
 *      write to auth metadata.
 *   2. It must not damage real names. Hyphens, apostrophes and non-Latin
 *      scripts are names, not noise.
 *
 * Runs under plain Node (`npm run test:unit`): this module deliberately has no
 * `server-only` import and no Supabase dependency.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  asText,
  cleanName,
  DEFAULT_PROFILE_LANGUAGE,
  isEmailShaped,
  isProfileLanguage,
  MAX_NAME_LENGTH,
  PROFILE_LANGUAGES,
  splitFullName,
} from "../../lib/account/profile-fields.ts";

test("cleanName tidies whitespace without touching the name itself", () => {
  assert.equal(cleanName("  Olivia  "), "Olivia");
  assert.equal(cleanName("Ana\t Maria"), "Ana Maria");
  // Real names keep their punctuation and their scripts.
  assert.equal(cleanName("Mary-Jane"), "Mary-Jane");
  assert.equal(cleanName("O'Neill"), "O'Neill");
  assert.equal(cleanName("李 明"), "李 明");
});

test("cleanName strips control characters, including a smuggled newline", () => {
  // A pasted value can carry these; a display name must never contain one.
  assert.equal(cleanName("Olivia\nCarter"), "Olivia Carter");
  assert.equal(cleanName("Olivia\u0000Carter"), "Olivia Carter");
  assert.equal(cleanName("Olivia\u007FCarter"), "Olivia Carter");
});

test("cleanName caps the length and is idempotent", () => {
  const long = "a".repeat(MAX_NAME_LENGTH + 40);
  const capped = cleanName(long);
  assert.equal(capped.length, MAX_NAME_LENGTH);
  // Idempotence is load-bearing: the same value read back must compare equal,
  // or the "nothing to save" check never fires.
  assert.equal(cleanName(capped), capped);
  assert.equal(cleanName(cleanName("  Ana   Maria  ")), "Ana Maria");
});

test("splitFullName keeps everything after the first space as the last name", () => {
  assert.deepEqual(splitFullName("Olivia Carter"), {
    firstName: "Olivia",
    lastName: "Carter",
  });
  // A middle name belongs to the person, not to the floor.
  assert.deepEqual(splitFullName("Ana Maria Silva"), {
    firstName: "Ana",
    lastName: "Maria Silva",
  });
  assert.deepEqual(splitFullName("Cher"), {
    firstName: "Cher",
    lastName: "",
  });
  assert.deepEqual(splitFullName("   "), { firstName: "", lastName: "" });
});

test("isProfileLanguage accepts only the listed codes", () => {
  for (const language of PROFILE_LANGUAGES) {
    assert.equal(isProfileLanguage(language.code), true);
  }
  assert.equal(isProfileLanguage(DEFAULT_PROFILE_LANGUAGE), true);
  // The select is a client control, so the server must refuse anything else.
  assert.equal(isProfileLanguage("fr"), false);
  assert.equal(isProfileLanguage(""), false);
  assert.equal(isProfileLanguage("EN"), false);
});

test("isEmailShaped catches the honest typo and lets real addresses through", () => {
  assert.equal(isEmailShaped("olivia@example.com"), true);
  assert.equal(isEmailShaped("  olivia+gifts@example.co.uk  "), true);
  assert.equal(isEmailShaped("olivia@example"), false);
  assert.equal(isEmailShaped("olivia example.com"), false);
  assert.equal(isEmailShaped(""), false);
});

test("asText refuses anything a server action's caller might smuggle in", () => {
  assert.equal(asText("Olivia"), "Olivia");
  assert.equal(asText(undefined), "");
  assert.equal(asText(null), "");
  assert.equal(asText(42), "");
  assert.equal(asText({ toString: () => "Olivia" }), "");
});
