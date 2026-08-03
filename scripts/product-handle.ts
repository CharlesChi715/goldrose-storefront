/**
 * ROLE OF THIS FILE
 * Turn product titles into handles — `npm run handles`. Runs directly under
 * Node (type stripping; no build step).
 *
 * The handle is what names a product's image folder and fills the CSV's
 * Handle column, but on a first import the product does not exist yet, so
 * there is nothing to export and look it up from. This derives it from the
 * title instead, using the same `productHandle()` the admin writes with —
 * never a second implementation, because two implementations that disagree
 * would silently produce folders no import can match.
 *
 *   node scripts/product-handle.ts "24K Gold Dipped Eternal Rose"
 *   cat titles.txt | node scripts/product-handle.ts
 *   cat titles.txt | node scripts/product-handle.ts --folders
 *
 * Titles as arguments print one handle per line. Titles on stdin (one per
 * line, blanks skipped) print `title<TAB>handle`, ready to paste back into
 * the spreadsheet as the Handle column. `--folders` prints `mkdir -p` lines
 * instead, so the image tree can be created from the same list.
 *
 * Exits non-zero on any title that cannot produce a handle, and on any two
 * titles that collide — docs/ixd/naming/product-handles.md §3 forbids
 * inventing a `-2` suffix, so a collision is a naming decision for a human,
 * and finding it before an import beats finding it during one.
 */

import { productHandle } from "../lib/admin/product-handle.ts";

type Row = { title: string; handle: string | null; error: string | null };

function derive(title: string): Row {
  try {
    return { title, handle: productHandle(title), error: null };
  } catch (error) {
    return {
      title,
      handle: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function readStdin(): Promise<string[]> {
  if (process.stdin.isTTY) {
    return [];
  }
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks)
    .toString("utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

const args = process.argv.slice(2);
const wantFolders = args.includes("--folders");
const titles = args.filter((arg) => !arg.startsWith("--"));
const fromStdin = titles.length === 0;
const input = fromStdin ? await readStdin() : titles;

if (input.length === 0) {
  console.error(
    'Usage: node scripts/product-handle.ts "Product title" [...]\n' +
      "       cat titles.txt | node scripts/product-handle.ts [--folders]",
  );
  process.exit(2);
}

const rows = input.map(derive);

// Collision check across the whole batch, not just against the database:
// two titles in one import can normalise to the same handle, and the second
// insert would throw halfway through the run.
const seen = new Map<string, string[]>();
for (const row of rows) {
  if (row.handle) {
    seen.set(row.handle, [...(seen.get(row.handle) ?? []), row.title]);
  }
}
const collisions = [...seen.entries()].filter(([, list]) => list.length > 1);

for (const row of rows) {
  if (!row.handle) {
    continue;
  }
  if (wantFolders) {
    console.log(`mkdir -p "product-images/${row.handle}"`);
  } else if (fromStdin) {
    console.log(`${row.title}\t${row.handle}`);
  } else {
    console.log(row.handle);
  }
}

const failed = rows.filter((row) => row.error);
for (const row of failed) {
  console.error(`✗ ${row.error}`);
}
for (const [handle, list] of collisions) {
  console.error(
    `✗ Collision on "${handle}" — ${list.length} titles derive it: ${list.join(" | ")}. ` +
      "Revise a title or set a manual handle; never append -2.",
  );
}
if (failed.length > 0 || collisions.length > 0) {
  process.exit(1);
}
