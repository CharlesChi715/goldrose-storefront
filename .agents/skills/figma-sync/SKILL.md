---
name: figma-sync
description: "Use when Charles asks you to process, parse, import, check, or apply a design-team delivery or update in Figma — new or changed frames, comments, or prototype. Runs the deterministic read pipeline (scripts/figma/cli.mjs) first, then applies the judgement rules: which comments are Charles's to act on, which frames are in build scope, and what to hand back. Triggers: Figma delivery, design delivery, process/parse/import Figma, Figma update, read the comments, read the prototype, design-team frames."
metadata:
  author: charles
  version: "2.0.0"
---

# Process a Figma delivery

A sync has two halves. **Reading the file is mechanical** — it is done by
`scripts/figma/cli.mjs`, and you run those commands rather than exploring the
API yourself. **Deciding what to act on is judgement** — that is sections 4–8.

Never fetch the Figma API by hand, and never read `.data/figma/file.json`: it
is ~22MB of node geometry. The commands below distil it into digests of a few
kilobytes each.

## 1. Branch setup — always work on `feat/figma-sync`

```bash
git checkout feat/figma-sync && git fetch origin && git merge main
```

**This branch is TRUE-MERGE ONLY — never squash.** Unlike the rest of the repo
(squash-merge PRs), `feat/figma-sync` is long-lived: its PRs into `main` must
use **"Create a merge commit"**. A single squash breaks the shared history and
causes phantom conflicts on every later sync.

## 2. The read pipeline — two commands

```bash
npm run figma:pull        # refresh cache + rebuild every digest  (~6s cold, ~1s warm)
npm run figma:brief       # the whole scoping report in one call  ← READ THIS
```

`brief` is one process printing scope (`changes`, with each added frame's
inbound links), unresolved comment threads, the scaffold targets, the
ready-but-not-built list, and the route drift. **Use it instead of running the
parts** — the parts cost ~0.03s each, so the expense of a sync is round-trips,
not compute. Every command reports its own timing to stderr, so if a step feels
slow you can say where the time went instead of guessing.

Drop to a single view only when the briefing is not enough:

```bash
npm run figma:ready       # full Ready-for-dev list with sizes and sections
npm run figma:proto       # every prototype edge, not just the scaffold list
npm run figma:comments    # full threads, including resolved ones
npm run figma:changes     # scope on its own
npm run figma:routes      # drift on its own
node scripts/figma/cli.mjs inbound <id...>   # what links TO a frame
```

Then, for the frames you are actually importing — **pass every id in one call**,
since a run is ~0.14s of which nearly all is parsing the cache, and the search
itself is free:

```bash
node scripts/figma/cli.mjs node <id> <id> --outline  # ← the layout, ~5KB/frame
node scripts/figma/cli.mjs assets <id> --list        # what art it needs
node scripts/figma/cli.mjs assets <id> <id>          # export it, batched
node scripts/figma/cli.mjs render <id> --scale 2     # PNG for the band-diff
node scripts/figma/cli.mjs node <id> --text          # just the copy, for wording
node scripts/figma/cli.mjs node <id>                 # raw subtree, ~500KB — last resort
```

**Read `--outline`, not the raw subtree.** One indented line per layer with
position, size, colour, font and copy — the same screen in ~5KB instead of
~500KB, because the raw node carries style tables, render bounds and constraint
objects that a Tailwind rewrite never consults. Fall back to the raw JSON only
when the outline genuinely lacks something.

**`assets` exports the frame's art** — vectors as SVG, image fills as PNG@2x,
batched into one request per format, named `<node-id>.<ext>` into
`public/eldreve/screens/` (the convention the 1,200 existing files follow).
Existing files are never overwritten without `--force`, since a committed asset
may have been hand-corrected.

Run `--list` first and prune: the detector is deliberately over-eager, so five
identical stars come back as five files when the component only needs one. It
is a proposal, not a verdict.

Every command takes `--json` for machine-shaped output.

**Scope is two lists, not one.**

- **`changes`** — what moved since the last import. A hash diff, so it is blind
  by construction to anything that was already ready and already unbuilt.
- **`unbuilt`** — Ready-for-dev frames with no route in the repo. The standing
  backlog. A delivery with **no changed frames is not an empty delivery** if
  this list is non-empty; that is exactly what happened on 2026-08-05.

Both are in `brief`. Import what they list; do not re-read unchanged frames.

**Close the loop:** after the import lands — and only then — run
`npm run figma:baseline`. It stamps "everything here is built", records the
commit it was stamped at, and re-runs `unbuilt` to warn you if that claim is
false. Never run it while merely testing tooling: a false baseline makes the
next sync look empty.

**Known mismatches live in [`scripts/figma/drift-allowlist.json`](../../../scripts/figma/drift-allowlist.json).**
When you decide a frame legitimately has no route (built as a sheet, a modal,
part of another page) or a route legitimately has no frame, add it there with a
reason — otherwise every future sync re-examines the same settled cases.

**Every added frame prints its inbound links.** Building the page is only half
of an import — the other half is the bridge to it. `changes` lists, under each
added frame, the frames and elements that navigate to it, which tells you:

- **Links from a page you already built** → re-point that link, and retire the
  "coming soon" placeholder if one stands there. This is also how a scaffolded
  target announces that it is finally buildable — no separate watchlist.
- **No inbound link at all** → the route would be unreachable. Say so in the
  hand-off rather than shipping an orphan page.

`node scripts/figma/cli.mjs inbound <id...>` runs the same lookup on demand.

### What the pipeline already handles

Do not redo these by hand — they are settled in code:

- **The Ready-for-dev cascade.** A mark on a SECTION applies to every frame
  under it; `ready` already resolves that.
- **Prototype from `interactions[]`**, not the legacy `reactions` field, which
  reads back stale or empty on this file.
- **Version-checked caching.** `pull` asks for `?depth=1` first and skips the
  full download when the file version is unchanged. Pass `--force` if you
  suspect a bad cache.
- **Comment threads** — assembled, ordered, attributed to Charles vs the team
  via `/v1/me`, and tagged with the frame the pin sits on.

### What still needs your eyes

- **Re-poll before importing.** The team edits live. If a frame you are about
  to build was touched recently, `npm run figma:pull -- --force` first.
- **Bound tokens over per-node hexes.** A fill's `boundVariables` names the
  shared token; resolving token *values* may need an enterprise plan.
- **Glyph export gotcha:** symbol glyphs that fall back export as SVG, and some
  (e.g. ✉) return a `.notdef` box — crop those from the frame render instead.

## 3. Ready for dev — the only frames you build

`npm run figma:ready` is the scope gate. "Ready for dev" means the design is
final and Charles is ready for it to be built. An explicit instruction from
Charles to build something un-marked overrides this default.

**Scaffold — don't skip — the frames a ready frame links to.** `figma:proto`
prints a **scaffold list**: prototype targets reachable from a ready frame that
are not themselves ready. Give each one a placeholder route rendering a simple
**"coming soon" state** — the link resolves, no real content or behaviour — and
flag it as a placeholder in the hand-off. The real frame replaces it once
marked Ready for dev.

## 4. Comment rule — whose task is it?

Everything Charles writes in Figma is him talking **to the design team**. The
`hint` field on each thread is a keyword guess, not a verdict — read the thread
and sort it yourself:

- **Charles's own to-dos and acceptances** — he says he will do something, or
  replies "ok" / "okay" / "好的" accepting something raised. Delegated to the
  agent → **the agent does it.**
- **Charles's directives to the team** — "do this", "add interaction", "add
  function", "add X". The team's job → **the agent does not act**; the change
  comes back later as an updated frame.
- **The design team's own comments** are teammate-to-teammate context, **not**
  agent instructions — _unless_ the comment is an explicit reply inside one of
  Charles's threads.

## 5. Pending-from-design note

For anything in a "does not act" bucket that describes a coming change, drop a
one-line **"pending from design"** note in the session hand-off — but change
nothing. When filing the hand-off, invoke the `agent-delivery` skill and follow
it; don't improvise the write-back.

## 6. Repo ↔ Figma drift

`npm run figma:routes` reports both directions: repo routes with no frame, and
frames whose route does not exist. Admin, API and technical routes are already
excluded; dynamic segments (`[slug]`) never match a literal frame name, so
check those by hand.

**Report drift in the hand-off; delete nothing** — Charles decides what each
one means.

## 7. After each import — verify

Band-diff the live render against the scale-2 frame render from
`cli.mjs render` (font-AA envelope), and cover new interactions with a test.

## 8. Finish — notify Charles and recommend the close-out

The sync ends with a hand-back, not a merge: run `npm run figma:baseline`,
**notify Charles to confirm the updates**, and give him the recommended
finishing steps — push → open a PR → **true-merge into `main`** ("Create a
merge commit"; never squash this branch, see section 1) → confirm the merge
landed. Do not open or merge the PR yourself unless Charles says so.
