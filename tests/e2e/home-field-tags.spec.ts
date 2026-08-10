/**
 * ROLE OF THIS FILE
 * The homepage's `data-field` attributes are what let the admin's picker turn a
 * pixel back into a registry slot. They are invisible, so nothing else would
 * ever notice them going missing — not a type error, not a pixel diff, not a
 * user. A Figma re-sync that rewrites a component drops them silently, and the
 * picker then has a hole in it that only shows up as "clicking that heading
 * does nothing".
 *
 * So this suite asserts the contract in the only place it is real: the rendered
 * DOM of `/`.
 *
 * WHY THE EXEMPTIONS ARE NAMED ONE BY ONE
 * A handful of editable fields genuinely reach no element of their own, and the
 * honest way to encode that is a list somebody had to write on purpose — not a
 * loosened rule. Each entry below carries the reason it is not addressable, so
 * adding to this list is a decision rather than a shortcut.
 */

import { test, expect } from "@playwright/test";
import {
  HOME_SECTION_LIST,
  isEditable,
} from "../../lib/home-content/registry.ts";

/**
 * Editable fields with no element of their own, and why.
 *
 * These are the fields the picker can never resolve from a pixel; the docked
 * editor reaches them through the section list instead.
 */
const NO_ELEMENT = new Map<string, string>([
  [
    "motion.rail_cycle_ms",
    "resolved server-side into a setInterval — nothing in the DOM carries it",
  ],
  [
    "motion.rail_glide_ms",
    "resolved server-side into a CSS transition string on a track React owns",
  ],
  [
    "story.newsletter_welcome_text",
    "the signed-IN half of the newsletter strip (NewsletterJoin's ACCOUNT-INFO card). It is tagged where it is drawn, but `/` renders signed out — and in local mode there is no Supabase to sign in to — so no pixel of it exists on this page to point at.",
  ],
  ["story.newsletter_welcome_greeting", "signed-in only — see above"],
  [
    "hero.photo_1_alt",
    "alt text: read aloud, never drawn. Reached via its photo's editor.",
  ],
  ["hero.photo_2_alt", "alt text — see hero.photo_1_alt"],
  ["hero.photo_3_alt", "alt text — see hero.photo_1_alt"],
  ["hero.photo_4_alt", "alt text — see hero.photo_1_alt"],
  ["featured.card_1_photo_alt", "alt text — see hero.photo_1_alt"],
  ["featured.card_2_photo_alt", "alt text — see hero.photo_1_alt"],
  ["ready.card_photo_alt", "alt text — see hero.photo_1_alt"],
  ["occasion.card_1_photo_alt", "alt text — see hero.photo_1_alt"],
  ["occasion.card_2_photo_alt", "alt text — see hero.photo_1_alt"],
  ["occasion.card_3_photo_alt", "alt text — see hero.photo_1_alt"],
  ["recipient.card_1_photo_alt", "alt text — see hero.photo_1_alt"],
  ["recipient.card_2_photo_alt", "alt text — see hero.photo_1_alt"],
  ["recipient.card_3_photo_alt", "alt text — see hero.photo_1_alt"],
  ["recipient.review_1_photo_alt", "alt text — see hero.photo_1_alt"],
  ["recipient.review_2_photo_alt", "alt text — see hero.photo_1_alt"],
  ["recipient.review_3_photo_alt", "alt text — see hero.photo_1_alt"],
  ["craft.step_1_photo_alt", "alt text — see hero.photo_1_alt"],
  ["craft.step_2_photo_alt", "alt text — see hero.photo_1_alt"],
  ["craft.step_3_photo_alt", "alt text — see hero.photo_1_alt"],
  ["craft.step_4_photo_alt", "alt text — see hero.photo_1_alt"],
  ["story.story_photo_alt", "alt text — see hero.photo_1_alt"],
  ["story.gift_photo_alt", "alt text — see hero.photo_1_alt"],
]);

/** Every `<section>.<field>` the registry says the owner can change. */
function editableKeys(): string[] {
  const keys: string[] = [];
  for (const section of HOME_SECTION_LIST) {
    for (const field of section.fields) {
      if (isEditable(field)) keys.push(`${section.id}.${field.id}`);
    }
  }
  return keys;
}

/** Every distinct field key stamped on the live page. */
async function taggedKeys(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const found = new Set<string>();
    for (const node of document.querySelectorAll("[data-field]")) {
      // One element may carry several slots, space separated — a footer link is
      // both the word you see and the place it goes.
      for (const key of (node.getAttribute("data-field") ?? "").split(/\s+/)) {
        if (key) found.add(key);
      }
    }
    return [...found];
  });
}

test("every editable field is reachable from a pixel, or named as an exception", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const tagged = new Set(await taggedKeys(page));

  const missing = editableKeys().filter(
    (key) => !tagged.has(key) && !NO_ELEMENT.has(key),
  );
  expect(
    missing,
    `These editable fields render nothing the picker can find. Either add\n` +
      `data-field="<section>.<id>" where the component draws them, or add them\n` +
      `to NO_ELEMENT in this file WITH the reason:\n  ${missing.join("\n  ")}`,
  ).toEqual([]);
});

test("every data-field on the page names a real editable field", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const known = new Set(editableKeys());
  // Read-only kinds are addressable on purpose: the owner decided hovering a
  // Figma-baked label must answer, not stay silent — so they count as known.
  for (const section of HOME_SECTION_LIST) {
    for (const field of section.fields) known.add(`${section.id}.${field.id}`);
  }

  const stray = (await taggedKeys(page)).filter((key) => !known.has(key));
  expect(
    stray,
    `These data-field values match no registry field — a typo, or a field that\n` +
      `has been renamed or deleted:\n  ${stray.join("\n  ")}`,
  ).toEqual([]);
});

test("a field rendered more than once is tagged on every one of its elements", async ({
  page,
}) => {
  // `ready.card_title` draws twice, `hero.photo_href` covers four slides. The
  // picker highlights all of a field's elements, so a half-tagged field makes
  // editing one row look like it silently changed another.
  await page.goto("/", { waitUntil: "networkidle" });
  const counts = await page.evaluate(() => {
    const out: Record<string, number> = {};
    for (const node of document.querySelectorAll("[data-field]")) {
      for (const key of (node.getAttribute("data-field") ?? "").split(/\s+/)) {
        if (key) out[key] = (out[key] ?? 0) + 1;
      }
    }
    return out;
  });

  // The design repeats one product across both Ready-to-Ship rows.
  expect(counts["ready.card_title"]).toBe(2);
  expect(counts["ready.card_href"]).toBe(2);
  // One destination behind all four hero slides.
  expect(counts["hero.photo_href"]).toBe(4);
  // Four FAQ rows plus the VIEW ALL link.
  expect(counts["story.faq_href"]).toBe(5);
  // Five occasion chips, one destination.
  expect(counts["occasion.chips_href"]).toBe(5);
});
