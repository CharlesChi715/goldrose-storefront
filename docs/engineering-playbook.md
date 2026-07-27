# Engineering playbook

How work moves through this repository: branching, parallel sessions, test
ports, merge gates, and environments. Each section is marked **Adopted**
(in force now) or **Proposed** (needs Charles's sign-off before it is
enforced). Keep this file short; details live in the linked docs.

## Branching and merging — Adopted 2026-07-27

- One long-lived branch: `main`. It auto-deploys to the testing site via the
  GitHub → Vercel integration.
- Sizable or risky work happens on a short-lived branch:
  branch → push (Vercel builds a preview URL) → sync with `main` → PR →
  squash-merge → **delete the branch**. GitHub ends every cycle with `main`
  only — no branch sprawl.
- Allowance: trivial, low-risk documentation touches may commit directly to
  `main`.
- Run the full local gate before any merge or direct push:
  `npm run lint && npm run test:unit && npm run test:e2e`.
- Commits state what shipped and why; agent commits carry their
  `Co-Authored-By` trailer.

## Parallel sessions — Proposed

Two sessions collided on 2026-07-27 (shared `.next`, port 3001, and one
session nearly sweeping the other's uncommitted files into a commit). Rules:

- One session merges/pushes to `main` at a time; everyone else stays on
  their branch or worktree until it lands.
- A session commits **only files it changed**. Check `git status` before
  staging; foreign modified files are left alone and mentioned to the user.
- Long or overlapping tasks use a git worktree (an isolated checkout) so
  builds and file edits cannot interfere.

## Ports and local servers — Proposed

- `3000` — the owner's `npm run dev`. Never taken by tests or agents.
- `3001` — reserved for the Playwright e2e suite (its config owns it).
- Ad-hoc verification servers (pixel checks, manual smoke tests) use `3002+`
  and are killed when the task ends. Never run an ad-hoc server on 3001
  while the e2e suite may be running.

## CI and merge gates — Proposed

- Today CI runs lint, typecheck, and unit tests on push/PR (`ci.yml`).
- Proposed: add `npm run build` and the Playwright e2e suite to CI
  (needs a `npx playwright install --with-deps chromium` step), then turn on
  GitHub **branch protection** for `main`: merges only via PR with green CI.
  Prerequisite: refresh `gh auth login` (the current API token is invalid).
- Until protection is on, the local full gate above is the merge bar.

## Environments and data safety — Proposed

- Today: blank Supabase env = local file adapter (`.data/db.json`, safe);
  with Supabase keys, local dev reads and writes the **live hosted
  database** — one wrong seed/reset during development could destroy the
  data the owner is testing with.
- Proposed: a second (free) Supabase project as dev/staging. `.env.local`
  points at staging by default; the live project is touched only by the
  deployed site and by sessions explicitly told to work on live data.
- Existing money/live-mode gates stay as written in
  [`project-state.md`](project-state.md).

## Design intake — Proposed (needs the design team)

Per-batch checklist before frames are declared 已完成: interaction states
included (empty, signed-out, error), sign-out/back affordances present, real
copy (no template residue like "120 APPAREL"), mock artifacts removed
(status bars, home indicators), one visual language per surface, layer names
per the naming guide. Triage the accumulated conflicts in
[`ixd/README.md`](ixd/README.md) with the boss and design team; settle the
bottom-nav and palette questions once.

## Verification tooling — Planned

Promote the session-local Figma pixel-diff pipeline (frame renders →
Playwright screenshots → band diff) into `scripts/` so every session runs
identical checks. Until then the procedure lives in the import notes.

## Launch operations — Planned

Before real customers: error monitoring on the deployed site (checkout
failures must page someone, not wait to be noticed), plus
[database backups](features/backend/db-backups.md) — already in the
release queue.
