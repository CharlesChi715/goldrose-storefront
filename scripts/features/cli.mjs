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
//
// What separates the pro versions from a hand-maintained table (all CI-side):
//
//   1. VALIDATE — closed enum vocabulary + required-fields-per-state,
//      checked on every PR so a bad doc is a red PR, not a quiet lie.
//      (k8s `kepval` presubmit, Python `check-peps.py`, Astro's Zod-parsed
//      front matter.) → this script's future `check` subcommand: real YAML
//      parse (not the slice below), id from RELATIVE PATH (basename lets
//      backend/x.md collide with x.md), exit non-zero on violation.
//
//   2. GENERATE + VERIFY — the README roadmap table lives between
//      <!-- BEGIN/END features:roadmap --> markers; `--write` splices it,
//      `--verify` regenerates in-memory and fails CI on any diff, so the
//      committed table is PROVEN equal to the front matter. (k8s
//      update-toc/verify-toc pair; PEP 0 is never hand-edited.) This repo
//      already proved hand-maintenance fails: README claimed a nonexistent
//      roadmap for four days, and a qualifier carried wrong numbers.
//
//   3. EVIDENCE-TYPED terminal statuses — `accepted`/`live` require a URL,
//      commit SHA, or command output, not a bare assertion. An AI agent can
//      hallucinate `delivery: accepted` but cannot hallucinate a clickable
//      CI-run link. (Rust: no stabilization without a report + closing PR;
//      PEP: `Resolution:` header links WHERE it was decided.)
//
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
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { basename } from "node:path";

// const files = readdirSync("docs/features", { recursive: true })
//   .filter((f) => f.endsWith(".md"))
//   .filter((f) => !["README.md", "TEMPLATE.md"].includes(f));

// for (const f of files) {
//   const id = basename(f, ".md"); // strips folder AND the .md suffix
//   const text = readFileSync(`docs/features/${f}`, "utf8");
// }


function parseFrontMatter(text) {
  // 1. isolate the block between the first "---" and the next "---"
  const fm = text.slice(4, text.indexOf("\n---", 4));
  // 2. for each line: key = everything before the FIRST ":",
  //    value = the rest — both .trim()ed

  let result = {};
  for (const line of fm.split("\n")) {
    const [key, ...rest] = line.split(":");
    const value = rest.join(":").trim();
    if (!key || !value) {
      continue;
    }
    result[key.trim()] = value;
  }
  // 3. return the object, e.g. { id: "card-payments", delivery: "ready", ... }
  return result;
}

// ── CLI: node scripts/features/cli.mjs new <feature-id> ────────────────

// console.log("argv:", process.argv.slice(2));

// const [cmd, id] = process.argv.slice(2); // argv[0]=node, argv[1]=script path
// if (cmd === "new") {
//   if (!id) {
//     console.error("Usage: node cli.mjs new <feature-id>");
//     process.exit(1);
//   }
//   if (existsSync(`docs/features/${id}.md`)) {
//     console.error(`Feature "${id}" already exists.`);
//     process.exit(1);
//   }
//   if (!/^[a-z][a-z0-9-]*[a-z0-9]$/.test(id)) {
//     console.error(`Feature id "${id}" is invalid. Start with a lowercase letter, then use lowercase letters, numbers, and hyphens.`);
//     process.exit(1);
//   }
//   console.log("would create:", id);
// }

// ── CLI: node scripts/features/cli.mjs new <feature-id> ────────────────

const template = readFileSync("docs/features/TEMPLATE.md", "utf8");
// 1. cut the example front-matter block (--- to ---) — you have that slice logic already
const fm = template.slice(4, template.indexOf("\n---")); 
console.log("fm:");
console.log(fm);

const body = template.slice(template.indexOf("\n---",4)).trim(); // the rest of the file after the front matter
// 2. build a born-backlog block: delivery: backlog, rollout: not-deployed,
//    statusChangedAt: <today — new Date().toISOString().slice(0, 10)>
// 3. replace the H1 with `# ${id}`  (your H1-equals-filename rule)
// 4. writeFileSync the joined result to `docs/features/${id}.md`
