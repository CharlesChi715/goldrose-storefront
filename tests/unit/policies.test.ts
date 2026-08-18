/**
 * ROLE OF THIS FILE
 * Unit coverage for the six imported policy documents (lib/policies/) — the
 * guards that matter for LEGAL copy rather than for layout.
 *
 * Three of them exist because of what the Figma frames actually shipped:
 * the frames still say "GoldRose" 24 times, they carry sixteen unfilled
 * `[BRACKET]` placeholders, and one of them carries a fake revision date. A
 * re-import that quietly reintroduced any of those onto a live policy page
 * would be a real defect, so each is asserted here rather than trusted to
 * the generator. Runs under plain Node: `npm run test:unit`.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import {
  POLICIES_LAST_UPDATED,
  POLICY_DOCUMENTS,
  POLICY_SLUGS,
} from "../../lib/policies/documents.ts";
import {
  policyTokenAnswers,
  splitPolicyText,
  unresolvedPolicyTokens,
} from "../../lib/policies/tokens.ts";

const STORE = {
  name: "ELDREVE",
  legal_name: "Zhongshu Technology Worldwide Limited",
  registration_number: "",
  address_lines: [] as string[],
  contact_email: "support@eldreve.com",
  order_number_prefix: "#",
};

/** Every string a customer can read, across all six documents. */
function everyString(): string[] {
  return POLICY_SLUGS.flatMap((slug) => {
    const doc = POLICY_DOCUMENTS[slug];
    return [
      doc.title,
      doc.intro,
      ...doc.sections.flatMap((s) => [s.heading, s.body]),
    ];
  });
}

test("all six documents imported, in hub order", () => {
  assert.deepEqual(POLICY_SLUGS, [
    "returns-refunds-cancellations",
    "shipping-delivery",
    "warranty-care",
    "terms-of-service",
    "privacy",
    "email-sms-terms",
  ]);
});

test("the dead brand name never reaches a policy page", () => {
  for (const text of everyString()) {
    assert.ok(
      !/goldrose/i.test(text),
      `policy copy still says GoldRose: ${text.slice(0, 60)}`,
    );
  }
});

test("no design-scaffolding bracket leaks into the copy", () => {
  for (const text of everyString()) {
    const brackets = text.match(/\[[A-Z][A-Z ,0-9]*\]/g);
    assert.equal(
      brackets,
      null,
      `unfilled frame placeholder left in copy: ${brackets?.join(", ")}`,
    );
  }
});

test("every {token} in the copy is one the resolver knows", () => {
  const known = new Set(Object.keys(policyTokenAnswers(STORE)));
  for (const text of everyString()) {
    for (const [, token] of text.matchAll(/\{(\w+)\}/g)) {
      assert.ok(known.has(token), `unknown policy token {${token}}`);
    }
  }
});

test("sections are numbered 1..n with copy and an exported icon", () => {
  for (const slug of POLICY_SLUGS) {
    const doc = POLICY_DOCUMENTS[slug];
    assert.ok(doc.sections.length > 0, `${slug} has no sections`);
    doc.sections.forEach((section, index) => {
      assert.equal(section.n, String(index + 1), `${slug} section order`);
      assert.ok(section.heading.length > 0, `${slug} §${section.n} heading`);
      assert.ok(section.body.length > 0, `${slug} §${section.n} body`);
      assert.ok(
        existsSync(`public/eldreve/screens/${section.iconAsset}.png`),
        `${slug} §${section.n} icon ${section.iconAsset}.png is missing`,
      );
    });
  }
});

test("the support address resolves from settings, not from code", () => {
  const parts = splitPolicyText("Email {supportEmail} today.", STORE);
  assert.deepEqual(
    parts.map((p) => (p.kind === "text" ? p.text : p.value)),
    ["Email ", "support@eldreve.com", " today."],
  );
  assert.ok(parts[1].kind === "token" && parts[1].email);
});

test("a token the business has not answered comes back empty, not invented", () => {
  // Blank is the signal PolicyDocumentScreen turns into "to be confirmed".
  const parts = splitPolicyText("under {governingState} law", STORE);
  assert.ok(parts[1].kind === "token" && parts[1].value === "");
  const unknown = splitPolicyText("{notARealToken}", STORE);
  assert.ok(unknown[1].kind === "token" && unknown[1].value === "");
});

test("the unresolved list is what the owner still owes", () => {
  assert.deepEqual(unresolvedPolicyTokens(STORE), [
    "postalAddress",
    "phone",
    "governingState",
  ]);
  const filled = {
    ...STORE,
    address_lines: ["1 Example Road", "Shenzhen 518000", "China"],
  };
  assert.deepEqual(unresolvedPolicyTokens(filled), ["phone", "governingState"]);
});

test("the last-updated date is a real date, not the frame's placeholder", () => {
  assert.match(POLICIES_LAST_UPDATED, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(
    !Number.isNaN(Date.parse(POLICIES_LAST_UPDATED)),
    "POLICIES_LAST_UPDATED must parse as a date",
  );
});

test("each document records the frame it came from", () => {
  const frames = POLICY_SLUGS.map((slug) => POLICY_DOCUMENTS[slug].frame);
  assert.deepEqual(frames, [
    "2118:239",
    "2118:242",
    "2118:243",
    "2118:241",
    "2118:244",
    "2127:238",
  ]);
  assert.equal(new Set(frames).size, frames.length, "frames must be distinct");
});
