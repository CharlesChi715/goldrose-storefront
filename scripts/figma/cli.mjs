#!/usr/bin/env node
// Figma sync CLI — the deterministic half of the `figma-sync` skill.
//
//   npm run figma:pull        refresh the cache and rebuild every digest
//   npm run figma:brief       ONE call: scope + comments + scaffold + drift
//   npm run figma:ready       frames in build scope (Ready for dev + cascade)
//   npm run figma:changes     what moved since the last import baseline
//   npm run figma:proto       prototype edges + the scaffold list
//   npm run figma:comments    comment threads, attributed
//   npm run figma:routes      repo routes ↔ Figma frames drift check
//   npm run figma:unbuilt     Ready-for-dev frames with no route yet
//   node scripts/figma/cli.mjs inbound <id...>   what links TO these frames
//   node scripts/figma/cli.mjs node <id...> [--outline|--text]
//   node scripts/figma/cli.mjs assets <frame-id...> [--list|--force]
//   node scripts/figma/cli.mjs render <id...> [--scale 2]
//   node scripts/figma/cli.mjs baseline          mark the current state imported
//
// Every command reads the cache written by `pull`; only `pull` and `render`
// touch the network. Read the digest files the commands print — never the raw
// file.json, which is megabytes of node geometry.

import { parseArgs } from "node:util";
import {
  writeFileSync,
  mkdirSync,
  readdirSync,
  statSync,
  existsSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import {
  api,
  credentials,
  digestPath,
  fail,
  kb,
  readJson,
  requireCache,
  stopwatch,
  writeJson,
  DIGEST,
  MANIFEST,
  NODES,
  RAW_COMMENTS,
  RAW_FILE,
  RENDERS,
  ROOT,
} from "./lib.mjs";
import {
  comments as buildComments,
  diffFrames,
  exportableNodes,
  indexDocument,
  outline,
  prototype,
  readyFrames,
} from "./digest.mjs";

const { values: flags, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    force: { type: "boolean", default: false },
    text: { type: "boolean", default: false },
    json: { type: "boolean", default: false },
    unresolved: { type: "boolean", default: false },
    outline: { type: "boolean", default: false },
    list: { type: "boolean", default: false },
    scale: { type: "string", default: "2" },
  },
});

// Routes a Figma frame is never expected to back: admin, API, and the
// technical endpoints (auth callbacks, the placeholder page).
// Reads: "/admin" or "/api" or "/placeholder" or "/auth", then "/" or end.
const IGNORED_ROUTE = /^\/(admin|api)(\/|$)|^\/(placeholder|auth)(\/|$)/;

// Where imported art lands, and how a component references it. Assets are
// named for their node id — the convention the 1,200 existing files follow.
const ASSET_URL = "/eldreve/screens";
const ASSETS = join(ROOT, "public", "eldreve", "screens");

// Deliberate design↔repo mismatches, with reasons; see allowlist().
const ALLOWLIST = join(ROOT, "scripts", "figma", "drift-allowlist.json");

// First positional is the command ("pull" when absent); the rest go to it.
const [command = "pull", ...args] = positionals;
const commands = {
  pull,
  brief,
  unbuilt,
  ready,
  frames,
  changes,
  proto,
  comments,
  node: nodeDump,
  assets,
  render,
  routes,
  inbound,
  baseline,
};
if (!commands[command]) fail(`unknown command "${command}".`);
// Every run reports where its time went — see stopwatch() in lib.mjs.
const clock = stopwatch();
await commands[command](args, clock);
clock.done(command);

// ---------------------------------------------------------------- pull

/**
 * Refresh the cache, then rebuild every digest from it.
 *
 * `?depth=1` costs a few kilobytes and returns the file `version`; if it
 * matches the cached one the multi-megabyte download is skipped entirely. That
 * check is what makes re-running this between edits nearly free.
 */
async function pull(_args, clock) {
  const { token, key } = credentials();
  const manifest = readJson(MANIFEST, {});
  const head = await api(`/files/${key}?depth=1`, { token });
  clock.mark("version-check");

  let file = readJson(RAW_FILE);
  const stale = flags.force || !file || head.version !== manifest.version;
  if (stale) {
    // No `geometry=paths`: vector path data triples the payload and nothing in
    // the sync reads it — renders come from the image export instead.
    file = await api(`/files/${key}`, { token });
    clock.mark("download");
    writeJson(RAW_FILE, file);
  }
  clock.mark(stale ? "cache-write" : "cache-read");
  const [raw, me] = await Promise.all([
    api(`/files/${key}/comments`, { token }),
    api(`/me`, { token }),
  ]);
  writeJson(RAW_COMMENTS, raw);
  clock.mark("comments+me");

  const index = indexDocument(file);
  clock.mark("index");
  const previous = readJson(digestPath("frames"))?.frames;
  const current = index.topFrames.map(
    ({ id, name, page, section, ready, width, height, hash }) => ({
      id,
      name,
      page,
      section,
      ready,
      size:
        width && height ? `${Math.round(width)}×${Math.round(height)}` : null,
      hash,
    }),
  );

  writeJson(digestPath("frames"), { version: head.version, frames: current });
  writeJson(digestPath("ready"), readyFrames(index));
  writeJson(digestPath("prototype"), prototype(index));
  writeJson(digestPath("comments"), buildComments(raw, me, index));
  if (previous) writeJson(digestPath("previous"), previous);
  clock.mark("digests");

  writeJson(MANIFEST, {
    version: head.version,
    name: head.name,
    lastModified: head.lastModified,
    pulledAt: new Date().toISOString(),
    me: { id: me.id, handle: me.handle },
    fromCache: !stale,
  });

  const readyCount = readJson(digestPath("ready")).length;
  const base = readJson(digestPath("baseline"));
  const diff = base ? diffFrames(base.frames, current) : null;
  console.log(
    [
      `${stale ? "fetched" : "cache hit"} · version ${head.version} · ` +
        `${kb(statSync(RAW_FILE).size)}`,
      `frames ${current.length} · ready-for-dev ${readyCount} · ` +
        `threads ${raw.comments?.length ?? 0}`,
      diff
        ? `since baseline: +${diff.added.length} ~${diff.modified.length} ` +
          `-${diff.removed.length}`
        : "no baseline yet — run `npm run figma:baseline` after this import",
      `digests in ${rel(DIGEST)}/`,
    ].join("\n"),
  );
}

// ---------------------------------------------------------------- reads

function ready() {
  const list = load("ready");
  if (flags.json) return print(list);
  console.log(`${list.length} frame(s) in build scope:`);
  for (const f of list) {
    console.log(
      `  ${f.id.padEnd(12)} ${f.status.padEnd(14)} ${(f.size ?? "—").padEnd(10)} ` +
        `${f.name}   [${f.page}${f.section ? ` / ${f.section}` : ""}]`,
    );
  }
}

function frames() {
  const { frames: list } = load("frames");
  if (flags.json) return print(list);
  for (const f of list) {
    console.log(
      `  ${f.id.padEnd(12)} ${(f.ready ?? "—").padEnd(14)} ${f.name} [${f.page}]`,
    );
  }
  console.log(`${list.length} top-level frame(s).`);
}

/**
 * What the design team changed since the last import.
 *
 * Compares against `baseline` (written by the `baseline` command at the end of
 * a sync) and falls back to the previous pull. This is the command that keeps
 * a sync proportional to the delivery instead of re-reading the whole file.
 *
 * Added frames print their inbound links inline. Building the page is only
 * half of an import — the other half is the bridge to it, and an added frame
 * is either reached from a page you already built (re-point that link, and
 * retire the "coming soon" placeholder if one stands there) or reached from
 * nowhere, which is worth noticing before you ship an unreachable route.
 */
function changes() {
  const { frames: current } = load("frames");
  const baselineDigest = readJson(digestPath("baseline"));
  const previous = baselineDigest?.frames ?? readJson(digestPath("previous"));
  if (!previous) {
    return console.log(
      "no baseline yet — this is the first pull. Run `baseline` after importing.",
    );
  }
  const diff = diffFrames(previous, current);
  if (flags.json) return print(diff);
  const since = baselineDigest
    ? `baseline ${baselineDigest.markedAt}`
    : "the previous pull";
  console.log(`Changes since ${since}:`);
  const byTarget = inboundIndex();
  for (const [label, list] of Object.entries(diff)) {
    if (!list.length) continue;
    console.log(`\n${label} (${list.length}):`);
    for (const f of list) {
      console.log(
        `  ${f.id.padEnd(12)} ${(f.status ?? "—").padEnd(14)} ${f.name}`,
      );
      if (label !== "added") continue;
      const links = byTarget.get(f.id) ?? [];
      if (!links.length) {
        console.log("      ← nothing links here — check it is reachable");
      }
      for (const e of links) {
        console.log(`      ← ${e.fromFrame}  via "${e.via}" (${e.trigger})`);
      }
    }
  }
  const total = diff.added.length + diff.modified.length + diff.removed.length;
  if (!total) console.log("  nothing changed.");
}

/**
 * Everything an agent needs to scope a sync, in one run.
 *
 * The individual read commands cost ~0.03s each, so this saves almost no CPU —
 * what it saves is round-trips. Five separate commands means five tool calls,
 * each a multi-second exchange with the model; this is one. It deliberately
 * prints summaries and defers the long listings (`proto`, `ready`, full
 * comment threads) to their own commands, so the briefing stays small enough
 * to read in full.
 */
function brief(_args, clock) {
  const manifest = readJson(MANIFEST, {});
  console.log(
    `FIGMA BRIEF · ${manifest.name ?? "?"} · version ${manifest.version} ` +
      `· pulled ${manifest.pulledAt ?? "never"}`,
  );

  console.log("\n── SCOPE ────────────────────────────────");
  changes();
  clock.mark("scope");

  const readyList = load("ready");
  console.log(`\n${readyList.length} frame(s) Ready for dev in total.`);

  console.log("\n── COMMENTS ─────────────────────────────");
  const threads = load("comments");
  const open = threads.filter((t) => !t.resolved);
  console.log(
    `${open.length} unresolved of ${threads.length} thread(s). ` +
      `Apply the ownership rule (skill section 4) before acting:`,
  );
  for (const t of open) {
    const last = t.messages.at(-1);
    console.log(
      `  [${t.hint}] ${t.frame ?? "no frame"}\n` +
        `      ${last.mine ? "CHARLES" : last.author}: ` +
        `${last.text.replace(/\n/g, " ").slice(0, 120)}`,
    );
  }

  clock.mark("comments");
  console.log("\n── SCAFFOLD ─────────────────────────────");
  const { scaffold } = load("prototype");
  console.log(
    `${scaffold.length} "coming soon" target(s) — ready frames linking out to ` +
      `un-ready ones:`,
  );
  for (const s of scaffold) {
    console.log(`  ${s.targetId.padEnd(12)} ${s.target}  ← ${s.linkedFrom}`);
  }

  clock.mark("scaffold");
  console.log("\n── READY BUT NOT BUILT ──────────────────");
  unbuilt();
  clock.mark("unbuilt");
  console.log("\n── DRIFT ────────────────────────────────");
  routes();
  clock.mark("drift");
  console.log(
    "\nNext: `node scripts/figma/cli.mjs node <id...>` for the frames you are " +
      "importing, then `npm run figma:baseline` when the import lands.",
  );
}

function proto() {
  const data = load("prototype");
  if (flags.json) return print(data);
  console.log(`${data.edges.length} prototype edge(s).`);
  for (const e of data.edges) {
    console.log(
      `  ${e.fromFrame ?? "?"} — ${e.via} (${e.trigger}/${e.action}) → ` +
        `${e.toFrame}${e.toReady ? "" : "  ⚠ not ready"}`,
    );
  }
  if (data.scaffold.length) {
    console.log(
      `\nScaffold ("coming soon") targets — ${data.scaffold.length}:`,
    );
    for (const s of data.scaffold) {
      console.log(`  ${s.targetId.padEnd(12)} ${s.target}  ← ${s.linkedFrom}`);
    }
  }
}

function comments() {
  let list = load("comments");
  if (flags.unresolved) list = list.filter((t) => !t.resolved);
  if (flags.json) return print(list);
  for (const t of list) {
    console.log(
      `\n[${t.hint}]${t.resolved ? " (resolved)" : ""} ${t.frame ?? "no frame"}` +
        `${t.ready ? " · ready-for-dev" : ""}`,
    );
    for (const m of t.messages) {
      console.log(
        `  ${m.mine ? "CHARLES" : m.author}: ${m.text.replace(/\n/g, " ")}`,
      );
    }
  }
  console.log(`\n${list.length} thread(s). Ownership rule: skill section 2.`);
}

/**
 * Dump node subtrees to their own files so the import step reads a few hundred
 * kilobytes instead of the whole document.
 *
 * Takes any number of ids and resolves them in a single pass. Measured on this
 * file, a run costs ~0.14s of which almost all is parsing 22MB of JSON — the
 * search itself is noise. So the thing worth avoiding is re-running the
 * command, not the linear scan: ask for every id you need at once.
 */
function nodeDump(ids) {
  if (!ids.length) fail("usage: node <node-id...> [--text]");
  const file = requireCache();
  const wanted = new Set(ids);
  const found = new Map();
  collect(file.document, wanted, found);

  for (const id of ids) {
    if (!found.has(id)) console.log(`  ${id}: not in the cache — re-run pull?`);
  }
  if (flags.text) {
    const texts = [];
    for (const node of found.values()) collectText(node, texts);
    return print(texts);
  }
  if (flags.outline) {
    for (const node of found.values()) {
      console.log(outline(node).join("\n"));
    }
    return;
  }
  mkdirSync(NODES, { recursive: true });
  for (const [id, node] of found) {
    // Filename-safe id: anything not a word char or "-" becomes "_".
    const out = join(NODES, `${id.replace(/[^\w-]/g, "_")}.json`);
    writeFileSync(out, JSON.stringify(node, null, 2));
    console.log(
      `  ${node.name} (${node.type}) → ${rel(out)} · ${kb(statSync(out).size)}`,
    );
  }
}

/**
 * Who navigates TO these frames — the reverse of the prototype graph.
 *
 * A frame arriving in `changes` says what to build; this says where it is
 * reached from, which is the other half of the job. Without it an import can
 * add a page that nothing links to, or leave a "coming soon" placeholder in
 * place after the real design has landed. Every edge already carries
 * `toFrameId`, so the lookup is a filter over the prototype digest.
 */
function inbound(ids) {
  if (!ids.length) fail("usage: inbound <node-id...>");
  const byTarget = inboundIndex();
  const result = {};
  for (const id of ids) result[id] = byTarget.get(id) ?? [];
  if (flags.json) return print(result);
  for (const [id, edges] of Object.entries(result)) {
    console.log(`\n${id}:`);
    if (!edges.length) {
      console.log(
        "  no inbound link — orphan, or reached outside the prototype.",
      );
    }
    for (const e of edges) {
      console.log(`  ← ${e.fromFrame}  via "${e.via}" (${e.trigger})`);
    }
  }
}

/** Prototype edges keyed by the frame they point at. */
function inboundIndex() {
  const index = new Map();
  for (const edge of load("prototype").edges) {
    if (!index.has(edge.toFrameId)) index.set(edge.toFrameId, []);
    index.get(edge.toFrameId).push(edge);
  }
  return index;
}

// ---------------------------------------------------------------- render

/** Export PNG renders — the pixel source and the band-diff reference. */
async function render(ids) {
  if (!ids.length) fail("usage: render <node-id...> [--scale 2]");
  const { token, key } = credentials();
  const query = new URLSearchParams({
    ids: ids.join(","),
    scale: flags.scale,
    format: "png",
  });
  const { images, err } = await api(`/images/${key}?${query}`, { token });
  if (err) fail(`image export failed: ${err}`);
  mkdirSync(RENDERS, { recursive: true });
  for (const [id, url] of Object.entries(images)) {
    if (!url) {
      console.log(`  ${id}: no render returned`);
      continue;
    }
    const res = await fetch(url);
    const out = join(
      RENDERS,
      // Same filename-safe id rule as nodeDump, plus the scale suffix.
      `${id.replace(/[^\w-]/g, "_")}@${flags.scale}x.png`,
    );
    writeFileSync(out, Buffer.from(await res.arrayBuffer()));
    console.log(`  ${id} → ${rel(out)}`);
  }
}

// ---------------------------------------------------------------- assets

/**
 * Export a frame's icons and photos straight into `public/eldreve/screens/`.
 *
 * This was the biggest manual cost in a sync: the 08-05 import alone hand-cut
 * 17 files, and the directory holds over a thousand. Nothing about it needs
 * judgement — the node id IS the filename by existing convention — so it is
 * two batched API calls (one per format) and a write loop.
 *
 * Existing files are left alone unless `--force`: an asset already committed
 * may have been hand-corrected, and silently overwriting it would undo that.
 */
async function assets(ids, clock) {
  if (!ids.length) fail("usage: assets <frame-id...> [--list] [--force]");
  const file = requireCache();
  const found = new Map();
  collect(file.document, new Set(ids), found);
  if (!found.size) fail("none of those ids are in the cache — re-run pull?");

  const wanted = [];
  for (const node of found.values()) wanted.push(...exportableNodes(node));
  clock.mark("scan");
  console.log(`${wanted.length} exportable node(s) in ${found.size} frame(s).`);

  mkdirSync(ASSETS, { recursive: true });
  const jobs = wanted
    .map((asset) => ({
      ...asset,
      file: join(ASSETS, `${assetFilename(asset)}`),
    }))
    .filter((job) => {
      const exists = existsSync(job.file);
      if (exists && !flags.force)
        console.log(`  skip (exists) ${rel(job.file)}`);
      return !exists || flags.force;
    });

  if (flags.list) {
    for (const job of jobs) {
      console.log(
        `  ${job.id.padEnd(12)} ${job.format} ${job.why}  ${job.name}`,
      );
    }
    return;
  }
  if (!jobs.length) return console.log("nothing new to export.");

  const { token, key } = credentials();
  // One request per (format, scale) group — the images endpoint takes many ids.
  const groups = new Map();
  for (const job of jobs) {
    const bucket = `${job.format}@${job.scale}`;
    if (!groups.has(bucket)) groups.set(bucket, []);
    groups.get(bucket).push(job);
  }
  const urls = new Map();
  await Promise.all(
    [...groups].map(async ([bucket, group]) => {
      const [format, scale] = bucket.split("@");
      const query = new URLSearchParams({
        ids: group.map((j) => j.id).join(","),
        format,
        scale,
      });
      const { images, err } = await api(`/images/${key}?${query}`, { token });
      if (err) fail(`export failed for ${bucket}: ${err}`);
      for (const [id, url] of Object.entries(images ?? {})) urls.set(id, url);
    }),
  );
  clock.mark("export");

  // Downloads are independent; run them together rather than one at a time.
  const written = await Promise.all(
    jobs.map(async (job) => {
      const url = urls.get(job.id);
      if (!url) {
        console.log(`  ${job.id}: no render returned`);
        return null;
      }
      const res = await fetch(url);
      writeFileSync(job.file, Buffer.from(await res.arrayBuffer()));
      return job;
    }),
  );
  clock.mark("download");
  for (const job of written.filter(Boolean)) {
    console.log(`  ${job.id.padEnd(12)} → ${rel(job.file)}  (${job.why})`);
  }
  console.log(
    `\n${written.filter(Boolean).length} file(s) written. Reference them as ` +
      `\`${ASSET_URL}/<name>\`.`,
  );
}

/** `2439:369` → `2439-369.svg`, matching the 1,200 files already there. */
function assetFilename(asset) {
  return `${asset.id.replace(/[^\w-]/g, "-")}.${asset.format}`;
}

// ---------------------------------------------------------------- routes

/**
 * Drift check, both directions: storefront routes with no Figma frame, and
 * frames whose route does not exist in the repo. Admin, API and technical
 * routes are expected to have no design and are excluded.
 *
 * The match relies on the frame-naming rule (docs/ixd/naming/figma-route-rule.md):
 * a frame is named for its exact route, optionally followed by `·` metadata.
 */
function routes() {
  const repoRoutes = repoRouteSet();
  const frameRoutes = frameRouteMap();
  const allow = allowlist();

  const missingDesign = [...repoRoutes]
    .filter(
      (r) =>
        !IGNORED_ROUTE.test(r) && !frameRoutes.has(r) && !allow.routes.has(r),
    )
    .sort();
  const missingRoute = [...frameRoutes.keys()]
    .filter((r) => !repoRoutes.has(r) && !allow.frames.has(r))
    .sort();

  if (flags.json) return print({ missingDesign, missingRoute });
  console.log(`Repo routes with no Figma frame (${missingDesign.length}):`);
  for (const r of missingDesign) console.log(`  ${r}`);
  console.log(`\nFigma frames with no repo route (${missingRoute.length}):`);
  for (const r of missingRoute) {
    const f = frameRoutes.get(r);
    console.log(`  ${(f.ready ?? "—").padEnd(14)} ${r}  ← ${f.name}`);
  }
  if (allow.count) {
    console.log(`\n${allow.count} known non-drift entr(ies) suppressed — see`);
    console.log(`  ${rel(ALLOWLIST)}`);
  }
}

/**
 * Ready for dev, but no `page.tsx` at its route.
 *
 * `changes` answers "what moved since last time" and is blind by construction
 * to a frame that was already ready and already unbuilt — the 08-05 sync had
 * to rediscover two of those by hand. This is the standing set-difference that
 * catches them: design says build it, the repo has no route.
 */
function unbuilt() {
  const repoRoutes = repoRouteSet();
  const allow = allowlist();
  const missing = load("ready")
    .map((f) => ({ ...f, route: f.name.split("·")[0].trim() }))
    .filter(
      (f) =>
        f.route.startsWith("/") &&
        !repoRoutes.has(f.route.replace(/\/$/, "") || "/") &&
        !allow.frames.has(f.route),
    );
  if (flags.json) return print(missing);
  console.log(
    `${missing.length} Ready-for-dev frame(s) with no route in the repo:`,
  );
  for (const f of missing) {
    console.log(`  ${f.id.padEnd(12)} ${f.route}   ← ${f.name}`);
  }
  return missing;
}

/**
 * Freeze the current frame hashes as "imported", so `changes` means something.
 *
 * The commit it was stamped at is recorded too. A baseline set by a commit
 * that touched no product code is a lie — it says "everything here is built"
 * when nothing was — and that is exactly what happened when this tooling was
 * installed, hiding two ready frames from the next sync. Recording the sha
 * makes the claim auditable instead of implicit.
 */
function baseline() {
  const { frames: current, version } = load("frames");
  writeJson(digestPath("baseline"), {
    version,
    markedAt: new Date().toISOString(),
    commit: gitHead(),
    frames: current,
  });
  console.log(
    `baseline set: ${current.length} frame(s) at version ${version}.`,
  );
  const left = unbuilt();
  if (left.length) {
    console.log(
      "\n⚠ Those are still unbuilt — only run `baseline` when an import has\n" +
        "  actually landed, or the next `changes` will look empty.",
    );
  }
}

// ---------------------------------------------------------------- helpers

/**
 * Every route the repo serves, from `app/**‍/page.tsx`.
 *
 * Only `(groups)` and `@slots` are pathless. A `[param]` directory IS a path
 * segment — treating it as pathless (the first version of this) mapped
 * `app/products/[slug]/page.tsx` to `/products`, which then reported both
 * `/products` and `/products/[slug]` as drift. Two false positives, one bug.
 */
function repoRouteSet() {
  const routes = new Set();
  const walk = (dir, segments) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        const pathless = /^[(@]/.test(entry.name);
        walk(path, pathless ? segments : [...segments, entry.name]);
      } else if (/^page\.(tsx|ts|jsx|js)$/.test(entry.name)) {
        routes.add("/" + segments.join("/"));
      }
    }
  };
  walk(join(ROOT, "app"), []);
  return routes;
}

/**
 * Frame route → frame, per the naming rule
 * (docs/ixd/naming/figma-route-rule.md): a frame is named for its exact route,
 * optionally followed by `·`-separated design metadata.
 */
function frameRouteMap() {
  const map = new Map();
  for (const f of load("frames").frames) {
    const route = f.name.split("·")[0].trim();
    // Drop a trailing "/"; if that leaves "" (the root), it is "/" again.
    if (route.startsWith("/")) map.set(route.replace(/\/$/, "") || "/", f);
  }
  return map;
}

/**
 * Deliberate mismatches, so a settled decision is not re-litigated every sync.
 *
 * Each entry needs a reason: the point is that the next reader can tell a
 * decision from an oversight.
 */
function allowlist() {
  const raw = readJson(ALLOWLIST, {
    framesWithoutRoute: [],
    routesWithoutFrame: [],
  });
  return {
    frames: new Set(raw.framesWithoutRoute.map((e) => e.route)),
    routes: new Set(raw.routesWithoutFrame.map((e) => e.route)),
    count: raw.framesWithoutRoute.length + raw.routesWithoutFrame.length,
  };
}

/** Short sha of HEAD, or null outside a git checkout. */
function gitHead() {
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      cwd: ROOT,
      encoding: "utf8",
    }).trim();
  } catch {
    return null;
  }
}

function load(name) {
  const data = readJson(digestPath(name));
  if (!data) fail(`digest "${name}" missing — run \`npm run figma:pull\`.`);
  return data;
}

/**
 * Resolve many ids in one descent, stopping as soon as all are found.
 *
 * A found node is not descended into: any id nested inside it comes back with
 * the parent's subtree anyway.
 */
function collect(node, wanted, found) {
  if (found.size === wanted.size) return;
  if (wanted.has(node.id)) {
    found.set(node.id, node);
    return;
  }
  for (const child of node.children ?? []) collect(child, wanted, found);
}

function collectText(node, out) {
  if (node.type === "TEXT")
    out.push({ id: node.id, name: node.name, text: node.characters });
  for (const child of node.children ?? []) collectText(child, out);
}

// Declarations, not const arrows: the command dispatch above is a top-level
// await, so anything it calls must already be hoisted past the TDZ.
function print(value) {
  console.log(JSON.stringify(value, null, 2));
}

function rel(path) {
  // Path with the ROOT prefix removed, then any leading "/" removed.
  return path.replace(ROOT, "").replace(/^\//, "");
}
