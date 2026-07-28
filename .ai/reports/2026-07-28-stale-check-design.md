# Stale-reference system — design for sign-off

Written 2026-07-28, after the 07-27 manual staleness sweep. Scope agreed:
**Option A — checker script + CI gate + `/stale-sweep` skill.** Open decision:
CI blocking vs report-only (recommendation below). Nothing here is built yet.

## Goal

Make stale references (links/paths/anchors/env vars) impossible to accumulate,
for zero tokens — and make the remaining judgment work (claims that contradict
reality) cheap by scoping it to what changed since the last sweep.

## Component 1 — `scripts/check-stale.mjs` (zero dependencies)

House style: same as `scripts/features/cli.mjs` — shebang, ESM,
`node:util` `parseArgs`, `fail()` helper, `✓`/`✗` output, `ROOT` from
`import.meta.url`, findings printed as `relative(ROOT, file)`. Pure check
functions are **exported** (so unit tests can import them, mirroring how
`lib/shipping/carriers.ts` exposes its helpers); `main()` runs only when
invoked directly.

### Checks (each has an id; findings print as `✗ file:line → detail (id)`)

| id | What it verifies | Would have caught (07-27 sweep) |
|---|---|---|
| `md-link` | Every relative link in every tracked `.md` file resolves to an existing file | all `docs/archive/*` links, `repo-review-2026-07-23.md` |
| `md-anchor` | Every `file.md#fragment` link matches a real heading in the target (GitHub slug rules: lowercase, punctuation stripped, spaces→hyphens) | the two `#open-product-decisions` anchors |
| `path-ref` | Backtick-quoted path-like tokens (`x/y.ext`) in docs **and code comments** point at files that exist | `veloria.tsx` ×3, `lib/supabase/server.ts`, `docs/BUILD-REPORT.md` in `.env.example` |
| `env-drift` | `.env.example` names ⊆ vars the code reads, and vice versa (ignoring NODE_ENV/VERCEL*/CI/npm_*) | missing `RESEND_FROM` |
| `pkg-scripts` | Every `package.json` script's `scripts/...` target exists | (clean today) |
| `migrations` | Local migration files are strictly sequential, no gaps/duplicates. With `--remote`: also run `supabase migration list` and diff local vs applied | the orphan remote `0004` (via `--remote`) |
| `junk` | No `.DS_Store` etc. in the working tree (local-only check) | the 4 deleted `.DS_Store` |

### False-positive control (critical — a noisy checker gets ignored)

1. **Historical-mention idiom:** any line containing `in git history` is
   skipped by `path-ref` — this is the repo's established way of naming
   deleted files on purpose (`admin-design.md`, `region-alignment.md` use it
   today).
2. **Allowlist file** `scripts/check-stale-allow.txt`: one pattern per line,
   `#` comments, matched as substring against `file:token`. Starts near-empty;
   every addition is a reviewed line in git.
3. **Gitignored targets** (links into `temp/`, `.data/`): verified locally,
   **skipped under `--ci`** — those files legitimately don't exist on a CI
   runner (e.g. `docs/ixd/README.md` → `temp/homepage.zh.md`).
4. Acceptance bar: the script must report **exactly zero findings on the
   current repo** (post-07-27-sweep) before the CI step lands. Tuning the
   heuristics to that bar is part of the build, not an afterthought.

### Interface

```
node scripts/check-stale.mjs            # local full run (incl. junk, gitignored targets)
node scripts/check-stale.mjs --ci       # CI mode: repo-reproducible checks only
node scripts/check-stale.mjs --remote   # adds the Supabase migration-history diff
node scripts/check-stale.mjs --json     # machine-readable findings (for the skill)
```

Exit 0 + `✓ no stale references` when clean; exit 1 + grouped findings list
otherwise. New npm script: `"check:stale": "node scripts/check-stale.mjs"`.

## Component 2 — CI step

`.github/workflows/ci.yml`, fourth step after Unit tests:

```yaml
- name: Stale references
  run: node scripts/check-stale.mjs --ci
```

No new dependencies, adds ~1s. **Recommendation: blocking** (a finding turns
the PR red) — the repo starts at zero findings so the gate starts green, and
warnings nobody must fix historically get ignored. If report-only is preferred
for a trial period, the flip is one line (`continue-on-error: true`) and can
be reverted any time.

## Component 3 — `/stale-sweep` project skill

`.claude/skills/stale-sweep/SKILL.md` (net-new directory; user-invocable).
The procedure it fixes in writing:

1. **Mechanical pass (cheap):** run `check-stale.mjs --json --remote`; fix
   every finding (renames resolved via `git log --follow`; deletions get the
   "in git history" idiom or the reference removed).
2. **Semantic pass (scoped — this is the token saver):** read
   `.ai/last-stale-sweep` (a one-line marker file holding the commit hash of
   the previous sweep); `git diff --name-only <hash>..HEAD` to list docs and
   code changed since; read **only** those docs plus the two ground-truth
   files (`SUMMARY.md`, `docs/project-state.md`); flag and fix claims that
   contradict ground truth or the code. No repo-wide agent exploration.
3. **Guardrails** (lessons from 07-27, stated in the skill): never edit an
   applied migration; `docs/ideas.md` stays verbatim; `docs/Database.md` stays
   concise; deletions under gitignored dirs (`temp/`) require byte-verified
   duplicates elsewhere; owner-authored files are never deleted, only
   reported.
4. **Verify + record:** rerun the script (must be clean), run
   lint/typecheck/unit, append a WORKLOG entry, write the new commit hash to
   `.ai/last-stale-sweep`.

Expected cost per run: script output + changed-files reading only — small for
a normal week of commits, vs. the 07-27 whole-repo exploration.

## Component 4 — tests + docs

- `tests/unit/check-stale.test.ts` (house pattern: `node:test`,
  `assert/strict`, imports the exported check functions with explicit
  extension): slugify cases, link extraction, path-token extraction,
  allowlist matching, env-name parsing.
- `docs/engineering-playbook.md` → "Verification tooling" section: record the
  checker (this design implements that section's stated principle); note the
  new CI gate under "CI and merge gates".
- `README.md` command list: add `npm run check:stale`.

## Build order (each step verified before the next)

1. Script + allowlist + unit tests → tune until **zero findings** on current
   repo; deliberately break one link on a scratch branch to prove detection.
2. CI step → confirm green on a real PR (feature-branch workflow).
3. Skill → dry-run `/stale-sweep` on the live repo; confirm it reports
   "nothing to do" cheaply.
4. Playbook/README notes.

Estimated effort: one session. Estimated token cost thereafter: mechanical
staleness ≈ 0 (CI catches at PR time); semantic sweep ≈ proportional to
commits since last sweep.
