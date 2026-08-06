/**
 * Flag served PNGs that carry a baked-in background instead of transparency.
 *
 * Why this exists: `c5bcc68` cropped symbol glyphs straight out of a flat frame
 * render rather than exporting the Figma nodes. A crop inherits whatever was
 * painted behind it, so those files arrived fully opaque — and once the surface
 * under them was a warm `#FFFBF6` card rather than the render's white, each one
 * showed as a pale rectangle. Two of them (the PDP star ratings) survived that
 * way until 2026-08-06.
 *
 * A photograph is legitimately opaque, so opacity alone is not the signal. The
 * check is: small (icon-sized) PNGs that are fully opaque are almost certainly
 * crops that should be node exports, and are reported. Only a file larger than
 * ICON_MAX_PX in BOTH directions is excused as photography.
 *
 *   node scripts/check-opaque-assets.mjs          # report, exit 1 on findings
 *   node scripts/check-opaque-assets.mjs --json   # machine-shaped output
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Photography is large in BOTH directions; a glyph strip can be wide and short
 * (the promo bar's is 716×40), so a file is only excused when neither side is
 * icon-sized.
 */
const ICON_MAX_PX = 200;

/**
 * Opaque on purpose: the baked colour provably matches the only surface the
 * asset is drawn on, so there is no seam to see. Keep the reason with it.
 */
const ALLOWED = new Map([
  [
    "public/eldreve/glyph-promo.png",
    "baked on #06372E; chrome.tsx draws it only on the #06372E promo bar " +
      "(the brown variant already uses the node export 549-95.svg)",
  ],
]);
const ROOT = new URL("..", import.meta.url).pathname;
const SERVED = join(ROOT, "public");

/** Every `.png` under `dir`, recursively. */
function pngsUnder(dir, found = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) pngsUnder(path, found);
    else if (entry.name.toLowerCase().endsWith(".png")) found.push(path);
  }
  return found;
}

/**
 * Read a PNG's header and chunk list — enough to answer "can this file express
 * transparency?" without decoding pixels. Colour types 4 and 6 carry an alpha
 * channel outright; types 0, 2 and 3 can only do so via a `tRNS` chunk.
 */
function inspect(path) {
  const bytes = readFileSync(path);
  if (bytes.subarray(1, 4).toString() !== "PNG") return null;
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  const colorType = bytes[25];
  let hasTrns = false;
  for (let i = 8; i + 8 <= bytes.length;) {
    const length = bytes.readUInt32BE(i);
    const type = bytes.subarray(i + 4, i + 8).toString();
    if (type === "tRNS") hasTrns = true;
    if (type === "IEND") break;
    i += 12 + length;
  }
  const transparent = colorType === 4 || colorType === 6 || hasTrns;
  return { width, height, colorType, transparent };
}

const findings = [];
for (const path of pngsUnder(SERVED)) {
  const png = inspect(path);
  if (!png || png.transparent) continue;
  if (png.width > ICON_MAX_PX && png.height > ICON_MAX_PX) continue;
  const file = relative(ROOT, path);
  if (ALLOWED.has(file)) continue;
  findings.push({
    file,
    size: `${png.width}x${png.height}`,
    colorType: png.colorType,
    kb: Math.round(statSync(path).size / 1024),
  });
}

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(findings, null, 2));
} else if (findings.length) {
  console.error(
    `\n${findings.length} icon-sized PNG(s) are fully opaque — they will paint\n` +
      `their baked background over any surface that is not the same colour.\n` +
      `Export the Figma node instead (SVG into public/eldreve/screens/), or\n` +
      `confirm the baked colour matches the surface and allow-list the file.\n`,
  );
  for (const f of findings) {
    console.error(
      `  ${f.size.padEnd(9)} ${String(f.kb).padStart(4)}KB  ${f.file}`,
    );
  }
  console.error("");
} else {
  console.log("no opaque icon-sized PNGs — every served glyph can blend.");
}

process.exit(findings.length ? 1 : 0);
