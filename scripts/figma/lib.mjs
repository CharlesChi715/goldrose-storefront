// Shared plumbing for the figma CLI (scripts/figma/cli.mjs).
//
// Everything here exists to make a sync cheap to repeat. The Figma file is a
// multi-megabyte JSON document, so it is fetched once into .data/figma/ and
// every later question is answered from that cache. `?depth=1` returns the
// file's `version` for a few kilobytes, which is how a re-pull decides whether
// the full download is needed at all.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { createHash } from "node:crypto";

export const ROOT = new URL("../..", import.meta.url).pathname;
export const CACHE = join(ROOT, ".data", "figma");
export const RAW_FILE = join(CACHE, "file.json");
export const RAW_COMMENTS = join(CACHE, "comments.json");
export const MANIFEST = join(CACHE, "manifest.json");
export const DIGEST = join(CACHE, "digest");
export const RENDERS = join(CACHE, "renders");
export const NODES = join(CACHE, "nodes");

/**
 * Read `.env.local` into `process.env` without clobbering anything already
 * set. The repo has no dotenv dependency and this is the only consumer, so a
 * five-line parser beats adding one.
 */
export function loadEnv() {
  const path = join(ROOT, ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    const value = m[2].trim().replace(/^["'](.*)["']$/, "$1");
    if (!(m[1] in process.env)) process.env[m[1]] = value;
  }
}

/** Figma credentials, with an actionable error instead of a 403 later. */
export function credentials() {
  loadEnv();
  const token = process.env.FIGMA_TOKEN;
  const key = process.env.FIGMA_FILE_KEY;
  if (!token || !key) {
    fail(
      "FIGMA_TOKEN and FIGMA_FILE_KEY must be set in .env.local " +
        "(token scope: file_content:read).",
    );
  }
  return { token, key };
}

export function fail(message) {
  console.error(`figma: ${message}`);
  process.exit(1);
}

/**
 * GET a Figma REST endpoint as JSON.
 *
 * Retries 429 and 5xx with backoff: the design team edits the file live, and a
 * sync that dies half-way through leaves a half-written cache that later
 * commands would read as truth.
 */
export async function api(path, { token, raw = false } = {}) {
  const url = `https://api.figma.com/v1${path}`;
  let lastError = "";
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt) await sleep(500 * 2 ** attempt);
    let res;
    try {
      res = await fetch(url, { headers: { "X-Figma-Token": token } });
    } catch (error) {
      lastError = error.message;
      continue;
    }
    if (res.ok) return raw ? res : res.json();
    lastError = `${res.status} ${res.statusText}`;
    if (res.status !== 429 && res.status < 500) {
      fail(`GET ${path} → ${lastError}`);
    }
  }
  fail(`GET ${path} failed after retries → ${lastError}`);
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function readJson(path, fallback = null) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf8"));
}

export function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n");
  return path;
}

export function digestPath(name) {
  return join(DIGEST, `${name}.json`);
}

export function hash(value) {
  return createHash("sha1")
    .update(typeof value === "string" ? value : JSON.stringify(value))
    .digest("hex")
    .slice(0, 12);
}

/** The cached file payload, or a pointer to the command that creates it. */
export function requireCache(path = RAW_FILE) {
  const data = readJson(path);
  if (!data) fail("no cache — run `npm run figma:pull` first.");
  return data;
}

/**
 * Phase timer for every command.
 *
 * Reports to **stderr**, so `--json` output stays pipeable into `jq` while the
 * timings still show up in a terminal. The point is that the next decision
 * about what to optimise is made from numbers: every run says where its
 * milliseconds went, so a slow sync can be attributed instead of guessed at.
 */
export function stopwatch() {
  const t0 = performance.now();
  let last = t0;
  const phases = [];
  return {
    mark(label) {
      const now = performance.now();
      phases.push([label, now - last]);
      last = now;
    },
    done(name) {
      const total = performance.now() - t0;
      const detail = phases.length
        ? ` (${phases.map(([l, ms]) => `${l} ${ms.toFixed(0)}ms`).join(" · ")})`
        : "";
      console.error(`⏱  ${name} ${(total / 1000).toFixed(2)}s${detail}`);
    },
  };
}

/** Human-readable byte count for the one-line summaries each command prints. */
export function kb(bytes) {
  return bytes > 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)}MB`
    : `${Math.round(bytes / 1024)}KB`;
}
