#!/usr/bin/env node
// Agent-inbox CLI — format and workflow: agent-delivery/README.md.
// Commands: list, resolve, check.
//
// A matter lives in three places at once: a row in agent-delivery/INBOX.md, an
// entry in its session file, and an AI-TAG(...) comment beside the affected
// code. Resolving by hand means editing all three and silently rotting the one
// you forget, so `resolve` removes all three together or nothing at all.

import { parseArgs } from "node:util";
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  mkdirSync,
  chmodSync,
  existsSync,
} from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = new URL("..", import.meta.url).pathname;
const DELIVERY_DIR = join(ROOT, "agent-delivery");
const SESSIONS_DIR = join(DELIVERY_DIR, "sessions");
const INDEX = join(DELIVERY_DIR, "INBOX.md");
const ARCHIVE_DIR = join(DELIVERY_DIR, "archive");
const ID_RE = /^AI-\d{3}$/;

// A menu hides the cursor while it redraws; make sure no exit path leaves the
// terminal without one. Only ever emitted if a menu actually ran on a TTY —
// otherwise the escape code would show up in piped or redirected output.
let cursorHidden = false;
function showCursor() {
  if (!cursorHidden) return;
  cursorHidden = false;
  process.stdout.write("\x1b[?25h");
}

// Menus run on the alternate screen buffer so the terminal's scrollback comes
// back untouched when the menu closes. Both of these must be undone on every
// exit path, including a crash — otherwise the shell is left on a blank screen
// with an invisible cursor.
let altActive = false;
function enterAlt() {
  if (!process.stdout.isTTY || altActive) return;
  altActive = true;
  cursorHidden = true;
  process.stdout.write("\x1b[?1049h\x1b[?25l");
}
function leaveAlt() {
  if (!altActive) return;
  altActive = false;
  process.stdout.write("\x1b[?1049l");
}

process.on("exit", () => {
  leaveAlt();
  showCursor();
});

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

/** Reads every session file as { path, name, text }. */
function sessionFiles() {
  return readdirSync(SESSIONS_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => {
      const path = join(SESSIONS_DIR, f);
      return { path, name: f, text: readFileSync(path, "utf8") };
    });
}

/**
 * Finds the `## AI-nnn · ...` entry in a session file.
 * Returns { start, end } line indices, end exclusive, or null.
 */
function findEntry(lines, id) {
  const start = lines.findIndex(
    (l) => l.startsWith(`## ${id} `) || l.trim() === `## ${id}`,
  );
  if (start === -1) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (lines[i].startsWith("## ") || lines[i].trim() === "---") {
      end = i;
      break;
    }
  }
  // Drop the blank lines the entry left behind.
  while (end > start && lines[end - 1].trim() === "") end -= 1;
  return { start, end };
}

/** Files that may carry an in-place tag — tracked files only, delivery folder excluded. */
function trackedFiles() {
  const out = execFileSync("git", ["ls-files"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  return out
    .split("\n")
    .filter(Boolean)
    .filter((f) => !f.startsWith("agent-delivery/") && !f.startsWith(".ai/"));
}

/**
 * Locates an `AI-TAG(<id>)` comment, including continuation lines — a wrapped
 * tag is one sentence split across lines, so consume until it ends in a period.
 */
function findTag(id) {
  for (const rel of trackedFiles()) {
    const path = join(ROOT, rel);
    let text;
    try {
      text = readFileSync(path, "utf8");
    } catch {
      continue; // binary or unreadable — no tag possible
    }
    if (!text.includes(`AI-TAG(${id})`)) continue;
    const lines = text.split("\n");
    const start = lines.findIndex((l) => l.includes(`AI-TAG(${id})`));
    let end = start + 1;
    const bare = (l) => l.replace(/^\s*(\*|\/\/|<!--|#)?\s?/, "").trimEnd();
    while (end < lines.length && !bare(lines[end - 1]).endsWith(".")) end += 1;
    return { rel, path, lines, start, end };
  }
  return null;
}

function indexRow(lines, id) {
  return lines.findIndex((l) => l.trimStart().startsWith(`| \`${id}\``));
}

/** The raw entry body for a matter, plus the session file it came from. */
function entryText(id) {
  for (const file of sessionFiles()) {
    const lines = file.text.split("\n");
    const span = findEntry(lines, id);
    if (!span) continue;
    const body = lines
      .slice(span.start + 1, span.end)
      .join("\n")
      .trim();
    return { body, file: file.name };
  }
  return null;
}

/**
 * Markdown → readable terminal text. Links keep whatever is useful: a file
 * path resolved to repo-relative (it is where you go to act), a URL kept whole,
 * and the link text dropped since the surrounding sentence already says it.
 */
function plain(md) {
  return md
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
      if (/^https?:/.test(href)) return `${label.replace(/`/g, "")} — ${href}`;
      const path = href.replace(/^(\.\.\/)+/, "");
      return path.startsWith("#") ? label : path;
    })
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/_\((.+?)\)_/g, "($1)")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Splits an entry body into its `- **Label:** value` fields. Continuation
 * lines belong to the field above them, which is how the markdown wraps.
 */
function parseEntry(body) {
  const fields = [];
  const loose = [];
  let current = null;
  for (const raw of body.split("\n")) {
    const field = raw.match(/^-\s+\*\*(.+?):?\*\*\s*(.*)$/);
    if (field) {
      current = { label: field[1].replace(/:$/, ""), value: field[2] };
      fields.push(current);
    } else if (current && /^\s+\S/.test(raw)) {
      current.value += ` ${raw.trim()}`;
    } else if (raw.trim()) {
      current = null;
      loose.push(raw.trim());
    }
  }
  return { fields, loose };
}

/** The detail pane's styled lines for one matter: label, then indented value. */
function detailLines(matter) {
  const entry = entryText(matter.id);
  if (!entry) return [`${DIM}(no entry found under sessions/)${OFF}`];

  const { fields, loose } = parseEntry(entry.body);
  const out = [...wrap(matter.message), ""];
  for (const { label, value } of fields) {
    out.push(`${BOLD}${label}${OFF}`);
    for (const line of wrap(plain(value), 2)) out.push(`  ${line}`);
    out.push("");
  }
  for (const line of loose) out.push(...wrap(plain(line)));
  if (loose.length) out.push("");
  out.push(`${DIM}from sessions/${entry.file}${OFF}`);
  return out;
}

/** Every open matter as { id, tag, message }, in index order. */
function openMatters() {
  return readFileSync(INDEX, "utf8")
    .split("\n")
    .filter((l) => /^\|\s*`AI-\d{3}`/.test(l.trimStart()))
    .map((row) => {
      const cells = row.split("|").map((c) => c.trim().replace(/`/g, ""));
      return { id: cells[1], tag: cells[2], message: cells[4] };
    });
}

function cmdList() {
  const matters = openMatters();
  if (matters.length === 0) {
    console.log("Inbox is empty — nothing waiting on Charles.");
    return;
  }
  console.log(`${matters.length} open matter(s):\n`);
  matters.forEach((m, i) => {
    console.log(
      `  ${String(i + 1).padStart(2)}  ${m.id}  ${m.tag.padEnd(16)} ${m.message}`,
    );
  });
  console.log(
    `\nDetail: agent-delivery/sessions/  ·  close one: npm run agent-inbox:close`,
  );
}

const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const OFF = "\x1b[0m";

const cols = () => process.stdout.columns || 80;
const rows = () => process.stdout.rows || 24;

/** Truncates to one terminal row, so a list is never taller than its item count. */
function fit(text) {
  const room = Math.max(10, cols() - 3);
  return text.length > room ? `${text.slice(0, room - 1)}…` : text;
}

/** Soft-wraps a block of text to the terminal width, breaking on spaces. */
function wrap(text, indent = 0) {
  const room = Math.max(20, cols() - 4 - indent);
  return text.split("\n").flatMap((line) => {
    if (line.length <= room) return [line];
    const out = [];
    let rest = line;
    while (rest.length > room) {
      let cut = rest.lastIndexOf(" ", room);
      if (cut <= 0) cut = room;
      out.push(rest.slice(0, cut));
      rest = rest.slice(cut).trimStart();
    }
    out.push(rest);
    return out;
  });
}

/**
 * An arrow-key menu, written directly against the terminal rather than pulled
 * from a dependency. It runs on the alternate screen buffer — the same one
 * `less` and `vim` use — so each keypress can repaint the whole view instead of
 * doing cursor arithmetic, and the terminal's previous contents come back
 * untouched on exit.
 *
 * ↑/↓ or j/k move · a digit jumps · → opens the detail pane, ← closes it ·
 * Enter picks · Esc/Ctrl+C cancels. Returns the chosen option's `value`.
 * `detailOf(value)` is optional; without it the → key does nothing.
 */
async function select(title, options, detailOf) {
  const { emitKeypressEvents } = await import("node:readline");
  const stdin = process.stdin;
  const heading = title.replace(/^\n+/, "");

  return new Promise((resolve) => {
    let cursor = 0;
    let detail = false;

    const render = () => {
      let out = "\x1b[2J\x1b[H"; // clear, home — cheap on the alternate screen
      if (detail) {
        const lines = detailOf?.(options[cursor].value) ?? [];
        const room = Math.max(3, rows() - 6);
        out += `${BOLD}${fit(options[cursor].title ?? options[cursor].label)}${OFF}\n`;
        out += `${DIM}← back · Enter choose · Esc cancel${OFF}\n\n`;
        out += lines
          .slice(0, room)
          .map((l) => (l ? `  ${l}` : ""))
          .join("\n");
        if (lines.length > room)
          out += `\n${DIM}  … ${lines.length - room} more line(s) — read it in the session file${OFF}`;
        out += "\n";
      } else {
        out += `${heading}\n`;
        out += `${DIM}  ↑/↓ move${detailOf ? " · → details" : ""} · Enter choose · Esc cancel${OFF}\n`;
        for (const [i, o] of options.entries()) {
          const on = i === cursor;
          out += `${on ? "❯ " : "  "}${on ? BOLD : ""}${fit(o.label)}${OFF}\n`;
        }
      }
      process.stdout.write(out);
    };

    const done = (fn) => {
      stdin.off("keypress", onKey);
      process.stdout.off("resize", render);
      if (stdin.isTTY) stdin.setRawMode(false);
      leaveAlt();
      showCursor();
      stdin.pause();
      fn();
    };

    const onKey = (str, key = {}) => {
      const name = key.name;
      if (!detail && (name === "up" || name === "k"))
        cursor = (cursor - 1 + options.length) % options.length;
      else if (!detail && (name === "down" || name === "j"))
        cursor = (cursor + 1) % options.length;
      else if (
        !detail &&
        /^[1-9]$/.test(str ?? "") &&
        Number(str) <= options.length
      )
        cursor = Number(str) - 1;
      else if (!detail && detailOf && (name === "right" || name === "l"))
        detail = true;
      else if (detail && (name === "left" || name === "h")) detail = false;
      else if (name === "return" || name === "enter")
        return done(() => resolve(options[cursor].value));
      else if (name === "escape" || (key.ctrl && "cd".includes(name))) {
        if (detail) detail = false;
        else
          return done(() => {
            console.error("✗ cancelled");
            process.exit(1);
          });
      } else return;
      render();
    };

    emitKeypressEvents(stdin);
    if (stdin.isTTY) stdin.setRawMode(true);
    enterAlt();
    stdin.resume();
    stdin.on("keypress", onKey);
    process.stdout.on("resize", render);
    render();
  });
}

/** One free-text line. Kept separate so raw-mode menus and readline never overlap. */
async function prompt(question) {
  const { createInterface } = await import("node:readline/promises");
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(question)).trim();
  } catch {
    console.error("\n✗ cancelled");
    process.exit(1);
  } finally {
    rl.close();
  }
}

const REASONS = [
  {
    label: "answered — Charles gave the answer and it is applied",
    value: "answered",
  },
  { label: "done — the work it asked for is finished", value: "done" },
  { label: "dropped — decided not to act on it", value: "dropped" },
  { label: "other — type my own", value: null },
];

/**
 * Picks a matter interactively — the point is not having to retype an id you
 * just read off the list. Refuses to prompt without a terminal so CI fails fast
 * instead of hanging on a question nobody can answer.
 */
async function pickInteractively() {
  const matters = openMatters();
  if (matters.length === 0) fail("inbox is empty — nothing to close");
  if (!process.stdin.isTTY)
    fail(
      "no terminal to prompt on — pass an id: npm run agent-inbox:close -- AI-004",
    );

  const chosen = await select(
    `${matters.length} open matter(s) — which one is closed?`,
    matters.map((m) => ({
      label: `${m.id}  ${m.tag.padEnd(16)} ${m.message}`,
      title: `${m.id} · ${m.tag}`,
      value: m,
    })),
    detailLines,
  );

  const go = await select(`\nClose ${chosen.id}?`, [
    { label: "Yes — archive it and clear all three records", value: true },
    { label: "Cancel — change nothing", value: false },
  ]);
  if (!go) fail("cancelled");

  const picked = await select("\nWhy is it closed?", REASONS);
  const reason = picked ?? (await prompt("Reason: "));

  return { id: chosen.id, reason: reason || undefined };
}

function relFromRoot(path) {
  return path.slice(ROOT.length);
}

/** The index's one-line summary for an id, used to name the archive file. */
function matterMessage(id) {
  return openMatters().find((m) => m.id === id)?.message ?? "";
}

/** `AI-004` + "The routing table is empty" → `AI-004-the-routing-table-is-empty.md`. */
function archiveName(id, message) {
  const slug = message
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .split("-")
    .slice(0, 7)
    .join("-");
  return slug ? `${id}-${slug}.md` : `${id}.md`;
}

/**
 * Writes the closed matter to the archive and makes it read-only (0444).
 * Read-only is a guard against absent-minded edits, not real security — the
 * point is that closing a matter never destroys the record of why it existed.
 */
function writeArchive(path, id, session, reason) {
  const today = new Date().toISOString().slice(0, 10);
  const body = session
    ? session.lines
        .slice(session.span.start, session.span.end)
        .join("\n")
        .replace(/`OPEN`/, "`CLOSED`")
    : `## ${id}\n\n- (no session entry was found when this was closed)`;

  mkdirSync(ARCHIVE_DIR, { recursive: true });
  writeFileSync(
    path,
    [
      `<!-- Closed agent-inbox matter. Private working record — an AI agent`,
      `     must ask Charles before reading anything in this folder. -->`,
      ``,
      body,
      `- **Closed:** ${today}`,
      reason ? `- **Why:** ${reason}` : `- **Why:** _(not recorded)_`,
      ``,
    ].join("\n"),
    "utf8",
  );
  chmodSync(path, 0o444);
}

/** `4`, `ai-4`, `AI-004` → `AI-004`. Bare numbers are the common case. */
function normaliseId(raw) {
  const text = String(raw ?? "").trim();
  if (/^\d+$/.test(text)) return `AI-${text.padStart(3, "0")}`;
  const m = text.match(/^ai-?(\d+)$/i);
  return m ? `AI-${m[1].padStart(3, "0")}` : text.toUpperCase();
}

async function cmdResolve(argv) {
  const usage =
    'usage: npm run agent-inbox:close [-- <AI-nnn|n> [--reason "..."] [--dry-run]]';
  const { values, positionals } = parseArgs({
    args: argv,
    options: {
      reason: { type: "string" },
      "dry-run": { type: "boolean" },
    },
    allowPositionals: true,
  });

  // No id given: show the list and ask, rather than printing a usage error.
  const picked = positionals[0] ? null : await pickInteractively();

  const id = picked ? picked.id : normaliseId(positionals[0]);
  if (!ID_RE.test(id))
    fail(
      `invalid id "${positionals[0]}" — expected AI-007, ai-7, or just 7\n${usage}`,
    );

  if (picked?.reason) values.reason = picked.reason;

  const dryRun = values["dry-run"] ?? false;

  // --- Locate all three parts before changing anything ---

  const indexLines = readFileSync(INDEX, "utf8").split("\n");
  const rowAt = indexRow(indexLines, id);

  let session = null;
  for (const file of sessionFiles()) {
    const lines = file.text.split("\n");
    const span = findEntry(lines, id);
    if (span) {
      session = { ...file, lines, span };
      break;
    }
  }

  const tag = findTag(id);

  if (rowAt === -1 && !session && !tag)
    fail(`${id} not found — already resolved?`);

  const archivePath = join(ARCHIVE_DIR, archiveName(id, matterMessage(id)));
  if (existsSync(archivePath))
    fail(
      `${id} is already archived at ${relFromRoot(archivePath)} — ids are never reused`,
    );

  const plan = [
    `  archive ${relFromRoot(archivePath)} — write, then make read-only`,
    rowAt !== -1
      ? `  index   agent-delivery/INBOX.md — remove 1 row`
      : `  index   (no row found — skipping)`,
    session
      ? `  entry   agent-delivery/sessions/${session.name} — remove ${session.span.end - session.span.start} lines`
      : `  entry   (no session entry found — skipping)`,
    tag
      ? `  tag     ${tag.rel}:${tag.start + 1} — remove ${tag.end - tag.start} line(s)`
      : `  tag     (no in-place tag found — skipping)`,
  ];
  console.log(`${dryRun ? "Would close" : "Closing"} ${id}:`);
  console.log(plan.join("\n"));

  if (dryRun) {
    console.log("\nDry run — nothing written.");
    return;
  }

  // --- Archive first: nothing is removed until the record exists on disk ---

  writeArchive(archivePath, id, session, values.reason);
  console.log(`  archived ${relFromRoot(archivePath)}`);

  // --- Now remove the three live records ---

  if (rowAt !== -1) {
    indexLines.splice(rowAt, 1);
    writeFileSync(INDEX, indexLines.join("\n"), "utf8");
  }

  if (session) {
    session.lines.splice(
      session.span.start,
      session.span.end - session.span.start,
    );
    writeFileSync(
      session.path,
      session.lines.join("\n").replace(/\n{3,}/g, "\n\n"),
      "utf8",
    );
  }

  if (tag) {
    tag.lines.splice(tag.start, tag.end - tag.start);
    writeFileSync(
      tag.path,
      tag.lines.join("\n").replace(/\n{3,}/g, "\n\n"),
      "utf8",
    );
  }

  console.log(
    `\n✓ ${id} closed — record kept in ${relFromRoot(archivePath)} (read-only).` +
      `\n  Run \`npm run format\` and review with \`git diff\` before committing.`,
  );
}

function cmdCheck() {
  const indexLines = readFileSync(INDEX, "utf8").split("\n");
  const indexed = indexLines
    .map((l) => l.trimStart().match(/^\|\s*`(AI-\d{3})`/))
    .filter(Boolean)
    .map((m) => m[1]);

  const entries = new Map();
  for (const file of sessionFiles()) {
    for (const m of file.text.matchAll(/^## (AI-\d{3})\b/gm))
      entries.set(m[1], file.name);
  }

  const problems = [];
  // A missing tag only warns: some matters are about a folder or a whole
  // document, where there is no single line to pin a comment to.
  const warnings = [];

  for (const id of indexed) {
    if (!entries.has(id))
      problems.push(`${id}: indexed in INBOX.md but no entry in sessions/`);
  }
  for (const [id, file] of entries) {
    if (!indexed.includes(id))
      problems.push(`${id}: entry in ${file} but no row in INBOX.md`);
    if (!findTag(id))
      warnings.push(
        `${id}: no in-place AI-TAG(${id}) comment found in the repo`,
      );
  }

  const dupes = indexed.filter((id, i) => indexed.indexOf(id) !== i);
  for (const id of new Set(dupes))
    problems.push(`${id}: duplicated in the INBOX.md index`);

  if (warnings.length) {
    console.warn(`! ${warnings.map((w) => w).join("\n! ")}`);
  }
  if (problems.length) {
    console.error(
      `✗ inbox out of sync:\n${problems.map((p) => `  - ${p}`).join("\n")}`,
    );
    process.exit(1);
  }
  console.log(
    `✓ inbox in sync — ${indexed.length} matter(s), each indexed and detailed.`,
  );
}

const [command, ...argv] = process.argv.slice(2);
switch (command) {
  case "list":
  case undefined:
    cmdList();
    break;
  case "close":
  case "resolve":
    await cmdResolve(argv);
    break;
  case "check":
    cmdCheck();
    break;
  default:
    fail(`unknown command "${command}" — expected list, close, or check`);
}
