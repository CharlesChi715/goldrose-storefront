// scripts for learning dont delete it.
//
// ── How the pros track features (research verdict, 2026-08-08) ──────────────
//
// Q: Is "one md file per feature + a generated status roadmap" professional?
// A: Yes — it IS the industry pattern. Kubernetes KEPs, Python PEPs, Rust
//    RFCs and TC39 proposals all converge on the same shape: one file per
//    feature, machine-readable status metadata in (or beside) it, and index
//    views GENERATED from that metadata — never hand-edited. No registry:
//    the files themselves are the database (KEPs run thousands this way).
//
// The one-sentence pro move:
//    The front matter is the only database — every roadmap view must be
//    generated from it, and CI must fail on invalid fields, unevidenced
//    terminal statuses, or a stale generated block; a status that no tool
//    can contradict is the only status anyone (human or agent) can trust.

// Also learned:
//   - The 2026-08-01 teardown was the right call: the registry + _group.md
//     files were a second source of truth beside the front matter — the
//     exact anti-pattern Backstage warns about (aggregate views must be
//     DERIVED, never authorable). Rebuild rule: front matter only.
//   - Freeze sections by MUTABILITY (ADR + Google design-doc practice):
//     Decision/Options are write-once — supersede with a link, never
//     rewrite; after accepted+live the body may legitimately go stale and
//     only the front matter must stay true. That cuts what agents must
//     keep consistent from every body to nine front-matter blocks.
//   - SUMMARY.md should LINK per-feature status, never restate it
//     (llms.txt / AGENTS.md: a small always-loaded index, pointers over
//     copies — restated status has already drifted once, 3/7 vs 4/7).
// ─────────────────────────────────────────────────────────────────────────────
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";

// ── Single definitions — every path and rule the tool enforces, named once ──
const FEATURES_DIR = "docs/features";
const TEMPLATE_PATH = join(FEATURES_DIR, "TEMPLATE.md");
const ID_RE = /^[a-z][a-z0-9-]*[a-z0-9]$/; // kebab-case, no leading/trailing hyphen
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// The closed key vocabulary (TEMPLATE.md illustrates it; this is the authority)
const KEYS = [
  "delivery",
  "rollout",
  "statusChangedAt",
  "priority",
  "blockedBy",
  "verification",
];
const BANNED_KEYS = {
  id: "the filename is the id",
  area: "grouping is a generated view, never a stored key",
};
const CUT_KEYS = ["owner", "target", "qualifier", "dependsOn", "tags"]; // trimmed 2026-08-08
const DELIVERY = [
  "backlog",
  "ready",
  "in-progress",
  "uat",
  "accepted",
  "dropped",
];
const ROLLOUT = ["not-deployed", "test-deployment", "live"];
const PRIORITY = ["p0", "p1", "p2"];
const ACTIVE_STATES = ["ready", "in-progress", "uat"]; // (a) presence tier

// Roadmap generation: the README block between these markers is ALWAYS
// generated from record front matter — never hand-edited (check enforces it).
const README_PATH = join(FEATURES_DIR, "README.md");
const ROADMAP_BEGIN = "<!-- BEGIN features:roadmap -->";
const ROADMAP_END = "<!-- END features:roadmap -->";
const METER = {
  backlog: "○○○○",
  ready: "●○○○",
  "in-progress": "●●○○",
  uat: "●●●○",
  accepted: "●●●●",
  dropped: "✕",
};

// ── Error reporting — message / detail / hint (the PostgreSQL trio) ─────────
// Exit codes: 0 = success · 1 = rule violation · 2 = CLI misuse.

/**
 * Print a structured error (one-line fact, optional evidence, optional
 * recovery advice) to stderr and terminate with the given exit code.
 * @param {string} message one-line fact of what failed (lowercase, no period)
 * @param {{detail?: string, hint?: string, code?: number}} [extra]
 * @returns {never}
 */
function fail(message, { detail, hint, code = 1 } = {}) {
  console.error(`error: ${message}`);
  if (detail) console.error(`  detail: ${detail}`);
  if (hint) console.error(`  hint: ${hint}`);
  process.exit(code);
}

/** Print how to call this tool, then exit 2 (CLI misuse). @returns {never} */
function usage() {
  console.error("Usage: node scripts/features/cli.mjs <command>");
  console.error("");
  console.error("Commands:");
  console.error(
    `  new <feature-id>   scaffold ${FEATURES_DIR}/<feature-id>.md born at backlog`,
  );
  console.error(
    "  check              validate all records; report every problem, exit 1 if any",
  );
  console.error(
    "  roadmap [--sync]   print the status table; --sync splices it into README.md",
  );
  process.exit(2);
}

/**
 * Parse a record's front matter into a flat object of string values.
 * Hand-rolled on purpose (this is the learning script): flat `key: value`
 * lines only — indented (nested) lines and valueless keys are skipped,
 * because absence is meaningful in this scheme. The future `check`
 * subcommand replaces this with a real YAML parse.
 * @param {string} text full file content, must start with `---` on line 1
 * @param {string} file path shown in error messages (GNU `file: message` style)
 * @returns {Record<string, string>}
 */
function parseFrontMatter(text, file) {
  if (!text.startsWith("---\n")) {
    fail(`${file}: front matter fence is not on line 1`, {
      detail: `the file starts with ${JSON.stringify(text.slice(0, 20))}…`,
      hint: "front matter only counts when `---` is the file's very first line",
    });
  }
  const end = text.indexOf("\n---", 4);
  if (end === -1) {
    fail(`${file}: front matter is never closed`, {
      hint: "add the closing `---` fence after the last key",
    });
  }
  const result = {};
  for (const line of text.slice(4, end).split("\n")) {
    if (line.startsWith(" ")) continue; // indented = nested child, not ours (yet)
    const [key, ...rest] = line.split(":");
    const value = rest.join(":").trim(); // re-join: values may contain ":"
    if (!key || !value) continue; // blank line, or valueless key (= absent)
    result[key.trim()] = value;
  }
  return result;
}

// ── new: scaffold a born-backlog record from TEMPLATE.md ────────────────────

/**
 * Create `docs/features/<id>.md`: minimal three-key front matter, H1 = id
 * (the filename rule), body copied from TEMPLATE.md after its closing fence
 * so the vocabulary comments never leak into records.
 * @param {string | undefined} id kebab-case feature id from argv
 */
function cmdNew(id) {
  if (!id) usage();
  if (!ID_RE.test(id)) {
    fail(`feature id "${id}" is invalid`, {
      detail: `expected kebab-case matching ${ID_RE}`,
      hint: 'start with a lowercase letter, end with a letter or digit, hyphens only in between — e.g. "gift-wrapping"',
    });
  }
  // collision-proof while backend/ still exists: compare basenames everywhere
  const taken = readdirSync(FEATURES_DIR, { recursive: true })
    .filter((f) => f.endsWith(".md"))
    .map((f) => basename(f, ".md"));
  if (taken.includes(id)) {
    fail(`feature "${id}" already exists`, {
      hint: "pick another id, or edit the existing record instead",
    });
  }

  const template = readFileSync(TEMPLATE_PATH, "utf8");
  if (!template.startsWith("---\n")) {
    fail(
      `${TEMPLATE_PATH}: template must start with the \`---\` fence on line 1`,
      {
        detail: `it starts with ${JSON.stringify(template.slice(0, 20))}…`,
        hint: "move anything above the front matter below it — records inherit this file's shape",
      },
    );
  }
  const fenceEnd = template.indexOf("\n---", 4);
  if (fenceEnd === -1) {
    fail(`${TEMPLATE_PATH}: front matter is never closed`, {
      hint: "add the closing `---` fence after the last key",
    });
  }

  // body = everything AFTER the closing fence (vocabulary comments stay behind)
  const body = template.slice(fenceEnd + 4).trim();
  // born-backlog front matter: only the three (r) keys, no comments
  const today = new Date().toISOString().slice(0, 10);
  const frontMatter = `---\ndelivery: backlog\nrollout: not-deployed\nstatusChangedAt: ${today}\n---`;
  const path = join(FEATURES_DIR, `${id}.md`);
  writeFileSync(path, `${frontMatter}\n\n# ${id}\n\n${body}\n`);
  console.log(`created ${path}`);
}

// ── check: validate every record; report ALL problems, then exit ────────────

/**
 * Every record file (all .md under docs/features/ except README/TEMPLATE at
 * any depth), as repo-root-relative paths.
 * @returns {string[]}
 */
function recordFiles() {
  return readdirSync(FEATURES_DIR, { recursive: true })
    .filter((f) => f.endsWith(".md"))
    .filter((f) => !["README.md", "TEMPLATE.md"].includes(basename(f)))
    .map((f) => join(FEATURES_DIR, f));
}

/**
 * Edit distance (Levenshtein): how many single-character edits turn `a`
 * into `b`. Powers the did-you-mean hint — hand-rolled because record ids
 * are short and this is the learning script.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function editDistance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [
    i,
    ...Array(b.length).fill(0),
  ]);
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // delete from a
        d[i][j - 1] + 1, // insert into a
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1), // substitute
      );
  return d[a.length][b.length];
}

/**
 * Validate all records and report EVERY violation before exiting — a
 * validator collects, it never fail-fasts: ten errors in one report cost
 * one fix round-trip, not ten. Every error is an agent playbook: where,
 * evidence, and the exact repair decision. Rules: file location (flat),
 * closed key vocabulary (banned/cut/unknown with did-you-mean), enum
 * values, state-conditional presence, evidence-gated ACCEPTED, H1 = id,
 * no template comments past backlog, and resolvable relative links.
 */
function cmdCheck() {
  const files = recordFiles();
  const problems = [];
  /** Push one trio-shaped problem (detail may be omitted). */
  const report = (file, message, detail, hint) =>
    problems.push(
      `error: ${file}: ${message}\n` +
        (detail ? `  detail: ${detail}\n` : "") +
        `  hint: ${hint}`,
    );

  // template guidance comments (body only) — may not survive past backlog
  const template = readFileSync(TEMPLATE_PATH, "utf8");
  const templateBody = template.slice(template.indexOf("\n---", 4) + 4);
  const guidanceComments = [...templateBody.matchAll(/<!--[\s\S]*?-->/g)].map(
    (m) => m[0],
  );

  for (const file of files) {
    const id = basename(file, ".md");
    const text = readFileSync(file, "utf8");

    // location: the directory is flat by decision (2026-08-08)
    if (dirname(file) !== FEATURES_DIR) {
      report(
        file,
        "record is not directly in docs/features/",
        `it lives under ${dirname(file)}/`,
        `run \`git mv ${file} ${join(FEATURES_DIR, basename(file))}\` — broken links that causes will appear in this report's next run`,
      );
    }

    // front matter must exist before any key rule can run
    if (!text.startsWith("---\n") || text.indexOf("\n---", 4) === -1) {
      report(
        file,
        "front matter fence missing or never closed",
        `the file starts with ${JSON.stringify(text.slice(0, 20))}…`,
        "make `---` the file's first line and close the block with a second `---`",
      );
      continue; // key rules are meaningless without a parsed block
    }
    const fmText = text.slice(4, text.indexOf("\n---", 4));
    const fm = parseFrontMatter(text, file);

    // closed vocabulary: banned, cut, then unknown (with did-you-mean)
    for (const key of Object.keys(fm)) {
      if (key in BANNED_KEYS) {
        report(
          file,
          `banned key "${key}"`,
          BANNED_KEYS[key],
          "delete the line — the information is derived, storing it again creates a second place to disagree",
        );
      } else if (CUT_KEYS.includes(key)) {
        report(
          file,
          `key "${key}" was cut from the vocabulary (2026-08-08)`,
          `its value here is "${fm[key]}"`,
          "delete the line; if the value states a fact still worth keeping, move it into the body prose first",
        );
      } else if (!KEYS.includes(key)) {
        const best = KEYS.map((k) => ({ k, d: editDistance(k, key) })).sort(
          (x, y) => x.d - y.d,
        )[0];
        report(
          file,
          `unknown key "${key}"`,
          `allowed keys: ${KEYS.join(", ")}`,
          best.d <= 2
            ? `did you mean "${best.k}"?`
            : "delete the line, or propose the key in TEMPLATE.md first — the vocabulary is closed",
        );
      }
    }

    // canonical key order — KEYS is the ordering authority; absent keys skip.
    // One error per file: a single reorder fixes every later violation too.
    let prevIdx = -1;
    let prevKey = "";
    for (const key of Object.keys(fm)) {
      const idx = KEYS.indexOf(key);
      if (idx === -1) continue; // unknown/banned keys already reported above
      if (idx < prevIdx) {
        report(
          file,
          `key "${key}" is out of canonical order`,
          `it appears after "${prevKey}"`,
          `reorder the front matter to: ${KEYS.join(" → ")}`,
        );
        break;
      }
      prevIdx = idx;
      prevKey = key;
    }

    // (r) always-required keys, with valid values
    if (!fm.delivery) {
      report(
        file,
        'missing required key "delivery"',
        undefined,
        `add \`delivery: <${DELIVERY.join("|")}>\` — judge the record's real stage`,
      );
    } else if (!DELIVERY.includes(fm.delivery)) {
      report(
        file,
        `delivery: "${fm.delivery}" is not in the vocabulary`,
        `allowed: ${DELIVERY.join("|")}`,
        "map the old value onto the current ladder (see TEMPLATE.md state glosses)",
      );
    }
    if (!fm.rollout) {
      report(
        file,
        'missing required key "rollout"',
        undefined,
        `add \`rollout: <${ROLLOUT.join("|")}>\` — where does this code actually run?`,
      );
    } else if (!ROLLOUT.includes(fm.rollout)) {
      report(
        file,
        `rollout: "${fm.rollout}" is not in the vocabulary`,
        `allowed: ${ROLLOUT.join("|")}`,
        "map the old value; note the site has been live since 2026-08-07 — judge what is true TODAY, not what was true when written",
      );
    }
    if (!fm.statusChangedAt) {
      report(
        file,
        'missing required key "statusChangedAt"',
        undefined,
        "add the date of the last delivery transition (YYYY-MM-DD); recover it from `git log` if unknown",
      );
    } else if (!DATE_RE.test(fm.statusChangedAt)) {
      report(
        file,
        `statusChangedAt: "${fm.statusChangedAt}" is not a date`,
        "expected YYYY-MM-DD",
        "rewrite as an ISO date, e.g. 2026-08-08",
      );
    }

    // (a) required while active; value must be in the enum whenever present
    if (ACTIVE_STATES.includes(fm.delivery) && !fm.priority) {
      report(
        file,
        `missing "priority" while delivery is ${fm.delivery}`,
        "priority is required in ready/in-progress/uat",
        `add \`priority: <${PRIORITY.join("|")}>\``,
      );
    }
    if (fm.priority && !PRIORITY.includes(fm.priority)) {
      report(
        file,
        `priority: "${fm.priority}" is not in the vocabulary`,
        `allowed: ${PRIORITY.join("|")}`,
        "pick the nearest tier",
      );
    }

    // (v) evidence gate: ACCEPTED requires populated verification.human
    if (
      fm.delivery === "accepted" &&
      (!/\bhuman:/.test(fmText) || /human:\s*null/.test(fmText))
    ) {
      report(
        file,
        "delivery is accepted but verification.human is empty",
        "accepted asserts a human signed off on the deployed site",
        "record by/date/environment/evidence (URL, commit SHA, or command output) under verification.human — or demote delivery to uat until someone actually verifies it",
      );
    }

    // H1 = filename (one name everywhere)
    const h1 = text.match(/^# (.+)$/m);
    if (!h1) {
      report(
        file,
        "no H1 heading",
        undefined,
        `add \`# ${id}\` right after the front matter`,
      );
    } else if (h1[1] !== id) {
      report(
        file,
        `H1 "${h1[1]}" does not equal the filename`,
        `expected \`# ${id}\``,
        "rename the H1; if the old title carries meaning the id does not, preserve it as the first Context sentence",
      );
    }

    // template guidance comments must not survive past backlog
    if (fm.delivery && fm.delivery !== "backlog") {
      for (const c of guidanceComments) {
        if (text.includes(c)) {
          report(
            file,
            "unfilled template guidance comment survives past backlog",
            c.split("\n")[0].slice(0, 60),
            "fill the section it belongs to and delete the comment — or delete the empty section if it has nothing to say",
          );
        }
      }
    }

    // relative links must resolve
    for (const [, target] of text.matchAll(/\]\(([^)\s]+)[^)]*\)/g)) {
      if (/^(https?:|mailto:|#)/.test(target)) continue;
      const resolved = join(dirname(file), target.split("#")[0]);
      if (!existsSync(resolved)) {
        const missing = basename(target.split("#")[0]);
        const best = files
          .filter((f) => f !== file)
          .map((f) => ({ f, d: editDistance(basename(f), missing) }))
          .sort((x, y) => x.d - y.d)[0];
        const hint =
          best && best.d <= 3
            ? `nearest existing record is "${relative(dirname(file), best.f)}" — read it: if it is the intended target, update this link to it; if it is unrelated, delete the link`
            : "no similar record exists — the target was likely removed; delete the link, or restore the file if it is still needed";
        report(
          file,
          `broken link "${target}"`,
          `resolves to ${resolved}, which does not exist`,
          hint,
        );
      }
    }
  }
  // roadmap freshness: the committed README block must equal what the
  // front matter generates right now — the table can never silently lie
  const readme = readFileSync(README_PATH, "utf8");
  const begin = readme.indexOf(ROADMAP_BEGIN);
  const end = readme.indexOf(ROADMAP_END);
  if (begin === -1 || end === -1) {
    report(
      README_PATH,
      "roadmap markers missing",
      `expected ${ROADMAP_BEGIN} … ${ROADMAP_END}`,
      "restore both marker comments under the Roadmap heading",
    );
  } else if (
    readme.slice(begin + ROADMAP_BEGIN.length, end).trim() !==
    renderRoadmap().trim()
  ) {
    report(
      README_PATH,
      "roadmap block is stale",
      "the committed table differs from what record front matter generates",
      "run `node scripts/features/cli.mjs roadmap --sync` and commit the result",
    );
  }

  for (const p of problems) console.error(p);
  if (problems.length) {
    console.error(`\n${problems.length} problem(s) in ${files.length} records`);
    process.exit(1);
  }
  console.log(`checked ${files.length} records: all rules pass`);
}

// ── roadmap: generate the README status table from record front matter ──────

/**
 * Render the roadmap table: one row per record, sorted by delivery stage
 * (ladder order) then id, with the dot meter beside each delivery value.
 * @returns {string} markdown table
 */
function renderRoadmap() {
  const rows = recordFiles()
    .map((f) => ({
      id: basename(f, ".md"),
      fm: parseFrontMatter(readFileSync(f, "utf8"), f),
    }))
    .sort(
      (a, b) =>
        DELIVERY.indexOf(a.fm.delivery) - DELIVERY.indexOf(b.fm.delivery) ||
        a.id.localeCompare(b.id),
    );
  const lines = [
    "| Record | Delivery | Rollout |",
    "| ------ | -------- | ------- |",
  ];
  for (const { id, fm } of rows) {
    lines.push(
      `| [${id}](${id}.md) | ${METER[fm.delivery] ?? "?"} ${fm.delivery} | ${fm.rollout} |`,
    );
  }
  return lines.join("\n");
}

/**
 * Print the roadmap table, or with --sync splice it into README.md between
 * the BEGIN/END markers (everything outside the markers is untouched).
 * @param {string | undefined} flag "--sync" to write, otherwise print
 */
function cmdRoadmap(flag) {
  const table = renderRoadmap();
  if (flag !== "--sync") {
    console.log(table);
    return;
  }
  const readme = readFileSync(README_PATH, "utf8");
  const begin = readme.indexOf(ROADMAP_BEGIN);
  const end = readme.indexOf(ROADMAP_END);
  if (begin === -1 || end === -1) {
    fail(`${README_PATH}: roadmap markers missing`, {
      detail: `expected ${ROADMAP_BEGIN} … ${ROADMAP_END}`,
      hint: "restore both marker comments under the Roadmap heading",
    });
  }
  const next =
    readme.slice(0, begin + ROADMAP_BEGIN.length) +
    `\n\n${table}\n\n` +
    readme.slice(end);
  writeFileSync(README_PATH, next);
  console.log(`synced roadmap into ${README_PATH}`);
}

// ── dispatch ────────────────────────────────────────────────────────────────

const [cmd, arg] = process.argv.slice(2); // argv[0] = node, argv[1] = script
if (cmd === "new") cmdNew(arg);
else if (cmd === "check") cmdCheck();
else if (cmd === "roadmap") cmdRoadmap(arg);
else usage();
