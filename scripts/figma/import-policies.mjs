#!/usr/bin/env node
// Regenerate lib/policies/documents.ts from the cached Figma file.
//
//   npm run figma:pull            # refresh the cache first
//   node scripts/figma/import-policies.mjs [--check]
//
// The six policy documents are LEGAL copy — 57 sections of return windows,
// warranty terms and arbitration clauses. Transcribing that by hand (or by
// model) silently drops a "not" or a "may" somewhere and nobody diffs a
// warranty clause, so the repo's copy is GENERATED from the frames instead.
// That makes "the site says what the design says" a property of this script
// rather than a promise in a commit message.
//
// `--check` regenerates into memory and exits non-zero if the committed file
// differs, which is how CI can catch a hand-edit of generated copy.
//
// Two departures from the frames are applied here, and only two — both are
// explained in the header this script writes into documents.ts:
//   1. GoldRose -> ELDREVE  (brand-name rule; the file is a version behind)
//   2. [BRACKET] -> {token} (unfilled editorial placeholders, resolved at
//      render from the `store` setting by lib/policies/tokens.ts)

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import * as prettier from "prettier";

const CACHE = ".data/figma/file.json";
const OUT = "lib/policies/documents.ts";
const check = process.argv.includes("--check");

/** Route segment -> the frame the design team marked Ready-for-dev. */
const FRAMES = {
  "returns-refunds-cancellations": "2118:239",
  "shipping-delivery": "2118:242",
  "warranty-care": "2118:243",
  "terms-of-service": "2118:241",
  privacy: "2118:244",
  "email-sms-terms": "2127:238",
};

/** The frames' fill-in-the-blank placeholders, mapped to the repo's names. */
const TOKENS = [
  ["[LEGAL ENTITY NAME]", "{legalName}"],
  ["[BUSINESS MAILING ADDRESS]", "{postalAddress}"],
  ["[WEBSITE URL]", "{websiteUrl}"],
  ["[SUPPORT EMAIL]", "{supportEmail}"],
  ["[PRIVACY EMAIL]", "{privacyEmail}"],
  ["[LEGAL NOTICE EMAIL]", "{legalNoticeEmail}"],
  ["[PHONE]", "{phone}"],
  ["[STATE]", "{governingState}"],
];

/**
 * The date the copy below was last set, written into documents.ts.
 *
 * The frames carry no usable one: five say `Last updated: [MONTH DAY, YEAR]`
 * and warranty-care says `[MAY 20, 2024]`, a bracketed placeholder rather
 * than a real revision. Bump this when the copy changes.
 */
const LAST_UPDATED = "2026-08-18";

if (!existsSync(CACHE)) {
  console.error(`no Figma cache at ${CACHE} — run \`npm run figma:pull\``);
  process.exit(1);
}

const file = JSON.parse(readFileSync(CACHE, "utf8"));
const byId = new Map();
(function index(node) {
  if (!node || typeof node !== "object") return;
  if (node.id) byId.set(node.id, node);
  for (const child of node.children ?? []) index(child);
})(file.document);

/** Frame copy -> repo copy: dead brand out, fill-in placeholders normalised. */
function copy(text) {
  let out = text.replace(/GoldRose/g, "ELDREVE");
  for (const [from, to] of TOKENS) out = out.split(from).join(to);
  return out;
}

/** Every TEXT node under `node`, in document order, whitespace collapsed. */
function textsUnder(node) {
  const out = [];
  (function walk(n) {
    if (n.type === "TEXT" && n.characters?.trim()) {
      out.push(n.characters.replace(/\s+/g, " ").trim());
    }
    for (const child of n.children ?? []) walk(child);
  })(node);
  return out;
}

const quote = (value) => JSON.stringify(value);
const documents = [];
const icons = new Map(); // icon name -> node id, for the asset filenames

for (const [slug, id] of Object.entries(FRAMES)) {
  const root = byId.get(id);
  if (!root) {
    console.error(`${slug}: frame ${id} is not in the cache — pull again?`);
    process.exit(1);
  }

  const flat = [];
  (function walk(n) {
    flat.push(n);
    for (const child of n.children ?? []) walk(child);
  })(root);

  const hero = flat.find((n) => /Policy Hero/i.test(n.name ?? ""));
  const heroTexts = hero ? textsUnder(hero) : [];
  // The hero is always title, document code, last-updated, intro.
  const [title, label, , intro] = heroTexts;
  if (!/^Policy [A-Z]$/.test(label ?? "")) {
    console.error(`${slug}: unexpected hero shape — label was ${label}`);
    process.exit(1);
  }

  const sections = flat
    .filter((n) => /^Policy Section \d+/i.test(n.name ?? ""))
    .map((card) => {
      const children = card.children ?? [];
      const numberFrame = children.find((c) => /Section Number/i.test(c.name));
      const copyFrame = children.find((c) => /Section Copy/i.test(c.name));
      const iconFrame = children.find((c) => /^Icon \//i.test(c.name));
      const lines = copyFrame ? textsUnder(copyFrame) : [];
      const icon = (iconFrame?.name ?? "").replace(/^Icon \//i, "").trim();
      if (icon && !icons.has(icon)) icons.set(icon, iconFrame.id);
      return {
        n: numberFrame ? textsUnder(numberFrame)[0] : null,
        heading: lines[0] ?? "",
        body: lines.slice(1).join("\n\n"),
        icon,
        iconAsset: (icons.get(icon) ?? "").replace(/[^\w-]/g, "-"),
      };
    });

  if (!sections.length) {
    console.error(`${slug}: no "Policy Section n" cards found in ${id}`);
    process.exit(1);
  }
  sections.forEach((section, index) => {
    if (section.n !== String(index + 1)) {
      console.error(`${slug}: section ${index + 1} is numbered ${section.n}`);
      process.exit(1);
    }
    if (!section.heading || !section.body) {
      console.error(`${slug}: section ${section.n} is missing heading or body`);
      process.exit(1);
    }
  });

  documents.push(`  ${quote(slug)}: {
    slug: ${quote(slug)},
    frame: ${quote(id)},
    frameHeight: ${root.absoluteBoundingBox?.height ?? 0},
    label: ${quote(label)},
    title: ${quote(copy(title))},
    intro: ${quote(copy(intro))},
    sections: [
${sections
  .map(
    (section) => `      {
        n: ${quote(section.n)},
        heading: ${quote(copy(section.heading))},
        body: ${quote(copy(section.body))},
        icon: ${quote(section.icon)},
        iconAsset: ${quote(section.iconAsset)},
      },`,
  )
  .join("\n")}
    ],
  },`);
}

const source = `/**
 * ROLE OF THIS FILE
 * The six ELDREVE policy documents, imported 2026-08-18 from the Figma frames
 * the design team marked Ready-for-dev (2118:239 / :241 / :242 / :243 / :244
 * and 2127:238).
 *
 * ⚠️ GENERATED — do not hand-edit. Run \`node scripts/figma/import-policies.mjs\`
 * after \`npm run figma:pull\`; \`--check\` fails if this file has drifted from
 * the frames. Every heading and body string below is the frame's own copy, so
 * the site and the design cannot silently disagree about legal wording.
 *
 * Two deliberate departures from the frames, and only two:
 *
 * 1. **The brand name.** The frames still say "GoldRose" 24 times. Per the
 *    brand-name rule (docs/ixd/naming/brand-name.md) and AI-037, the file is a
 *    version BEHIND the repo on brand strings, so its wording is treated as
 *    stale rather than as design: every occurrence reads ELDREVE.
 * 2. **The fill-in-the-blank tokens.** The frames ship unfilled editorial
 *    placeholders — \`[SUPPORT EMAIL]\`, \`[LEGAL ENTITY NAME]\`, \`[STATE]\` and
 *    five more, sixteen in all. They are normalised to \`{token}\` markers here
 *    and resolved at render from the \`store\` setting (lib/policies/tokens.ts),
 *    so the owner changes the support address in /admin/settings rather than
 *    by a deploy. A token with nothing behind it renders as a visible
 *    "to be confirmed" — never as an invented fact, never as a raw bracket.
 *
 * AI-TAG(AI-046): OWNER-DECISION — the copy binds ELDREVE to a 30-day return
 * window, a one-year warranty and stated processing times, so every route
 * ships \`robots: { index: false }\` until the bosses sign it off. See
 * /agent-delivery/sessions/figma-sync-policies-08-18-worktree-figma-sync-policies.md.
 */

/** A fill-in-the-blank token the frames left for the business to answer. */
export type PolicyToken =
  | "legalName"
  | "postalAddress"
  | "websiteUrl"
  | "supportEmail"
  | "privacyEmail"
  | "legalNoticeEmail"
  | "phone"
  | "governingState";

/** One numbered white card in the document. */
export interface PolicySection {
  /** The card's number, as the frame draws it in its gold disc. */
  n: string;
  heading: string;
  /** Body copy; may contain \`{token}\` markers. */
  body: string;
  /** The frame's icon name, kept so a future SVG swap can find it. */
  icon: string;
  /** The exported 2x render in /eldreve/screens, without extension. */
  iconAsset: string;
}

/** One policy page. */
export interface PolicyDocument {
  slug: string;
  /** The Figma frame this was imported from. */
  frame: string;
  /** The frame's own height, kept as the pixel-diff reference. */
  frameHeight: number;
  /** The design's document code, e.g. "Policy A". */
  label: string;
  title: string;
  intro: string;
  sections: PolicySection[];
}

/**
 * When this copy was last set, shown as the documents' "Last updated" line.
 *
 * The frames carry NO usable date — five say \`Last updated: [MONTH DAY, YEAR]\`
 * and warranty-care says \`[MAY 20, 2024]\`, a bracketed placeholder rather than
 * a real revision. Rather than print a blank or repeat a stale one, the line
 * states the date this text was imported, which is a fact the repo can stand
 * behind. It lives in scripts/figma/import-policies.mjs.
 */
export const POLICIES_LAST_UPDATED = ${quote(LAST_UPDATED)};

/** The six documents, keyed by their /policies/<slug> route segment. */
export const POLICY_DOCUMENTS: Record<string, PolicyDocument> = {
${documents.join("\n")}
};

/** The route segments, in the order the Policies & Legal hub lists them. */
export const POLICY_SLUGS = Object.keys(POLICY_DOCUMENTS);
`;

// Format exactly as `npm run format` would, so `--check` compares like with
// like instead of failing the moment prettier touches the generated file.
const formatted = await prettier.format(source, {
  ...(await prettier.resolveConfig(OUT)),
  parser: "typescript",
});

if (check) {
  const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
  if (current !== formatted) {
    console.error(
      `${OUT} differs from the frames — run \`node scripts/figma/import-policies.mjs\``,
    );
    process.exit(1);
  }
  console.log(`${OUT} matches the frames.`);
  process.exit(0);
}

mkdirSync("lib/policies", { recursive: true });
writeFileSync(OUT, formatted);
const sectionCount = documents.length;
console.log(
  `wrote ${OUT} — ${sectionCount} documents, ${icons.size} distinct icons.`,
);
console.log(
  "Icons are exported separately: `node scripts/figma/cli.mjs render <icon-id...> --scale 2`,",
);
console.log("then copied to public/eldreve/screens/<node-id>.png.");
