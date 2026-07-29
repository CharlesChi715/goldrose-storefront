/**
 * ROLE OF THIS FILE
 * Guards the `data-el` element-naming convention (docs/ixd/element-names.md):
 * every name must be globally unique and must parse as
 * PAGE-SECTION-[QUALIFIER]-TYPE, with PAGE / SECTION / TYPE drawn from the
 * owner's controlled vocabulary.
 *
 * The vocabulary is PARSED OUT OF THE DOC rather than copied here, so the two
 * cannot drift: adding a word to the code without adding it to the doc fails.
 *
 * ⚠️ Names built from a prop at runtime (`data-el={name && `${name}-MEDIA`}`
 * in components/home/Carousel.tsx) cannot be read statically and are skipped —
 * the prefix passed at the call site is not checked.
 *
 * Runs under plain Node: `npm run test:unit`.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..");
const DOC = join(ROOT, "docs", "ixd", "element-names.md");

/** Pulls the vocabulary tokens out of one `### <dimension>` section's tables. */
function vocabulary(md: string, heading: string): string[] {
  const start = md.indexOf(`### ${heading}`);
  assert.notEqual(start, -1, `docs/ixd/element-names.md has no "### ${heading}" section`);
  const after = md.slice(start + 4);
  const end = after.search(/\n(?:### |## |---)/);
  const body = end === -1 ? after : after.slice(0, end);
  // A word counts only when it is a table cell's ENTIRE content — the 编号
  // column. Scraping every backticked ALL-CAPS string in the section let prose
  // leak into the vocabulary: `BUY` (a FUNCTION, discussed under PAGE), bare
  // `CTA` (from the note saying it must NOT be a SECTION), and the worked
  // example `PDP-PRODUCT-PRICE` (quoted inside a TYPE table cell's remark).
  const words: string[] = [];
  for (const line of body.split("\n")) {
    if (!line.trimStart().startsWith("|")) continue;
    for (const cell of line.split("|")) {
      const m = cell.trim().match(/^`([A-Z][A-Z0-9-]*)`$/);
      if (m) words.push(m[1]);
    }
  }
  return words;
}

const md = readFileSync(DOC, "utf8");
const VOCAB = {
  PAGE: vocabulary(md, "PAGE"),
  SECTION: vocabulary(md, "SECTION"),
  TYPE: vocabulary(md, "TYPE"),
};

/** Longest vocabulary word that `s` starts with, so `NEW-ARRIVALS` beats `NEW`. */
function leading(words: string[], s: string): string | null {
  return (
    words
      .filter((w) => s === w || s.startsWith(`${w}-`))
      .sort((a, b) => b.length - a.length)[0] ?? null
  );
}

/** Returns null if `name` is well-formed, else why it isn't. */
function complain(name: string): string | null {
  if (!/^[A-Z][A-Z0-9]*(-[A-Z0-9]+)*$/.test(name)) {
    return "must be UPPERCASE-HYPHENATED";
  }
  // A trailing -1/-2 (or -N from a .map) is an index, not part of the name.
  let rest = name.replace(/-(?:\d+|N)$/, "");

  const page = leading(VOCAB.PAGE, rest);
  if (!page) return `starts with no PAGE word (have: ${VOCAB.PAGE.join(", ")})`;
  rest = rest.slice(page.length + 1);

  const section = leading(VOCAB.SECTION, rest);
  if (!section) return `"${rest}" starts with no SECTION word`;
  rest = rest.slice(section.length + 1);

  if (!rest) return "ends with no TYPE word";
  if (!VOCAB.TYPE.some((t) => rest === t || rest.endsWith(`-${t}`))) {
    return `"${rest}" ends with no TYPE word`;
  }
  return null;
}

/** Every `data-el` in the tree, as [name, file]. Dynamic prefixes are skipped. */
function collect(): [string, string][] {
  const found: [string, string][] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) {
        if (entry !== "node_modules" && entry !== ".next") walk(path);
      } else if (entry.endsWith(".tsx")) {
        const src = readFileSync(path, "utf8");
        const rel = path.slice(ROOT.length + 1);
        for (const m of src.matchAll(/data-el="([^"]*)"/g)) found.push([m[1], rel]);
        for (const m of src.matchAll(/data-el=\{[^}]*`([^`]*)`/g)) {
          // `${name}-MEDIA` — prefix comes from a prop, unknowable here.
          if (m[1].startsWith("${")) continue;
          found.push([m[1].replace(/\$\{[^}]*\}/g, "N"), rel]);
        }
      }
    }
  };
  walk(join(ROOT, "components"));
  walk(join(ROOT, "app"));
  return found;
}

const NAMES = collect();

test("the scan actually found element names", () => {
  // Guards against a broken walk silently passing every assertion below.
  assert.ok(NAMES.length > 30, `only found ${NAMES.length} data-el names`);
});

test("the doc's vocabulary parsed", () => {
  assert.ok(VOCAB.PAGE.includes("HOME"));
  assert.ok(VOCAB.SECTION.includes("HERO"));
  assert.ok(VOCAB.TYPE.includes("BTN"));
});

test("every name matches PAGE-SECTION-[QUALIFIER]-TYPE", () => {
  const bad = NAMES.map(([name, file]) => [name, file, complain(name)] as const)
    .filter(([, , why]) => why !== null)
    .map(([name, file, why]) => `  ${name}  (${file}) — ${why}`);
  assert.equal(bad.length, 0, `malformed element names:\n${bad.join("\n")}`);
});

test("names are unique", () => {
  const seen = new Map<string, string>();
  const dupes: string[] = [];
  for (const [name, file] of NAMES) {
    const first = seen.get(name);
    if (first) dupes.push(`  ${name} — ${first} and ${file}`);
    else seen.set(name, file);
  }
  assert.equal(dupes.length, 0, `duplicate element names:\n${dupes.join("\n")}`);
});
