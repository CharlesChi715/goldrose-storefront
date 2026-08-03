---
name: figma-sync
description: "Use when Charles asks you to process, parse, import, check, or apply a design-team delivery or update in Figma — new or changed frames, comments, or prototype. Defines what to read (frames + comments read AS Charles + prototype/interaction design) and which comments to act on (Charles's own to-dos and acceptances) versus leave alone (his directives to the team, and the team's teammate-to-teammate comments). Triggers: Figma delivery, design delivery, process/parse/import Figma, Figma update, read the comments, read the prototype, design-team frames."
metadata:
  author: charles
  version: "1.4.0"
---

# Process a Figma delivery

Use this to process a design delivery that lives in the shared **Figma file** —
its frames, comments, prototype, and everything else the file exposes. Read the
inputs in section 1, then act only on what Charles owns (sections 2–3).

## 0. Branch setup — always work on `feat/figma-sync`

All sync work happens on the permanent `feat/figma-sync` branch. First step,
before reading anything:

```bash
git checkout feat/figma-sync
git fetch origin && git merge main
```

**This branch is TRUE-MERGE ONLY — never squash.** Unlike the rest of the
repo (squash-merge PRs), `feat/figma-sync` is long-lived: its PRs into `main`
must use **"Create a merge commit"** on GitHub. A single squash breaks the
shared history and causes phantom conflicts on later syncs.

## 1. Read — everything the file exposes

Read via the Figma REST API. Credentials live in `.env.local`: `FIGMA_TOKEN`
(scope `file_content:read`) and `FIGMA_FILE_KEY` (the shared design file).
(Endpoint shapes and field names are in the Figma REST docs — look them up as
needed; only the gotchas below are recorded here.)

**Re-poll for stability.** The team edits the file live; a frame can change
mid-import. Re-fetch anything they touched recently before importing it.

**Core — always read these four; they drive the build:**

1. **Frames / node data** — geometry, fills, strokes, typography, hierarchy,
   and the frame/layer names.
2. **Rendered images** — the pixel source (photos, icons, glyphs) and the
   scale-2 band-diff reference. Gotcha: symbol glyphs that hit fallback fonts
   export as SVG; some (e.g. ✉) return a `.notdef` box — crop those from the
   frame render instead.
3. **Comments** — read them **impersonating Charles**: for each thread take his
   standpoint and ask "what did I mean here?" (an "ok" is an _acceptance_, not
   a new request). Apply the comment rule in section 2.
4. **Prototype** — all the interactions: the click wiring, transitions, and flows connecting the
   frames. Gotcha: read each node's `interactions[]` / `transitionNodeID`,
   **not** the legacy `reactions` field.
5. **dev status (`READY_FOR_DEV` / `COMPLETED`)** — the build gate, section 3.

**Also read when present:** dev status (`READY_FOR_DEV` / `COMPLETED` — the
build gate, section 3); section structure and component relationships; design
tokens/variables (prefer named tokens over per-node hexes; may need an
enterprise plan); version history for diffing against a prior delivery; raw
image-fill sources when the render is not enough; Figma MCP extras
(code-connect, motion, FigJam) if connected in Dev Mode.

## 2. Comment rule — whose task is it?

Everything Charles writes in Figma is him talking **to the design team**. Sort
each of his comments by ownership:

- **Charles's own to-dos and acceptances** — he says he will do something, or
  replies "ok" / "okay" accepting something that was raised. This is delegated
  to the agent → **the agent does it.**
- **Charles's directives to the team** — "do this", "add interaction", "add
  function", "add X". This is the team's job → **the agent does not act**; the
  change comes back later as an updated frame.
- **The design team's own comments** are teammate-to-teammate context, **not**
  agent instructions — _unless_ the comment is an explicit reply inside one of
  Charles's threads.

## 3. Ready for dev — the only frames you build

**"Ready for dev" is a Figma Dev Mode mark, and it is the scope gate.** It means
the design is final and Charles is ready for it to be built — so **build only
frames that carry it.** A mark on a **section cascades**: every frame under a
Ready-for-dev section counts as ready. (An explicit instruction from Charles to
build something un-marked overrides this default.)

**Reading it — REST only** (verified 2026-07; if the MCP gains dev-status
support later, prefer it and update this note). The Figma Plugin/MCP API
cannot read dev status (`node.devStatus` throws). Use the REST API:

```bash
# only marked nodes carry the field; an empty result means "nothing marked",
# NOT a read failure.
curl -s -H "X-Figma-Token: $TOKEN" "https://api.figma.com/v1/files/$KEY" \
  | jq '[.. | objects | select(has("devStatus")) | {id, name, type, status: .devStatus.type}]'
```

Values are `READY_FOR_DEV` or `COMPLETED`; SECTIONs carry it too, so treat a
frame as ready if it is marked **or** sits under a marked section.

**Scaffold — don't skip — the frames a ready frame links to.** When a
Ready-for-dev frame's prototype navigates to a frame that is **not** yet
Ready-for-dev, do not build that target in full. Create a **scaffold**: a
placeholder route at the destination that renders a simple **"coming soon"
state** — enough that the link resolves, with no real content or behaviour — and
flag it as a placeholder in the session hand-off. This keeps the ready frame's
navigation working without importing un-final design; the real frame replaces
the "coming soon" state once it is marked Ready-for-dev.

## 4. Pending-from-design note

For anything in a "does not act" bucket that describes a coming change, drop a
one-line **"pending from design"** note in the session hand-off — but change
nothing. When filing the hand-off, invoke the `agent-delivery` skill and
follow it — don't improvise the write-back.

## 5. Flag repo ↔ Figma inconsistencies

Reconcile the other direction too: **highlight any page/route that exists in the
repo but has no corresponding Figma frame.** These are drift — a design that was
removed, a page that went stale, or a dev-added placeholder the design never
covered. **Report them in the session hand-off; do not delete anything** —
Charles decides what each one means.

Expected non-design routes are **not** inconsistencies and should not be
flagged: admin pages, API endpoints, and technical routes (e.g.
`/checkout/cancel`, `/placeholder`). Focus the check on storefront / customer
pages, which are the ones a Figma frame is expected to back.

## 6. After each import — verify

Band-diff the live render against the scale-2 frame render (font-AA envelope),
and cover new interactions with a test.

## 7. Finish — notify Charles and recommend the close-out

The sync ends with a hand-back, not a merge: **notify Charles to confirm the
updates**, and give him the recommended finishing steps —
push → open a PR → **true-merge into `main`** ("Create a merge commit"; never
squash this branch, see section 0) → confirm the merge landed. Do not open or
merge the PR yourself unless Charles says so.
