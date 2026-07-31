---
name: process-figma-delivery
description: "Use when Charles asks you to process, parse, import, check, or apply a design-team delivery or update in Figma — new or changed frames, comments, or prototype. Defines what to read (frames + comments read AS Charles + prototype/interaction design) and which comments to act on (Charles's own to-dos and acceptances) versus leave alone (his directives to the team, and the team's teammate-to-teammate comments). Triggers: Figma delivery, design delivery, process/parse/import Figma, Figma update, read the comments, read the prototype, design-team frames."
metadata:
  author: charles
  version: "1.0.0"
---

# Process a Figma delivery

Use this to process a design delivery that lives in the shared **Figma file** —
its frames, comments, prototype, and everything else the file exposes. Read the
inputs in section 1, then act only on what Charles owns (sections 2–3).

## 1. Read — everything the file exposes

Read via the Figma REST API with the `file_content:read` token. Always read the
core four; read the rest when the file has them.

**Core — these drive the build:**

1. **Frames / node data** (`GET /v1/files/:key`, `/nodes`) — geometry (x/y/w/h),
   text (`characters`), fonts (family, size, weight, line-height, letter-spacing,
   align), fills (solid RGBA + image refs), strokes, effects, corner radius,
   blend mode, opacity, layer names, node types. Import pixel-exact per the
   established Figma import pipeline; transcribe interaction specs verbatim into
   `docs/ixd/` with `⚠️ Developer note` for problems found (see
   `docs/ixd/README.md`).
2. **Rendered images** (`GET /v1/images/:key`) — any node as PNG/SVG at a scale.
   This is the pixel source (photos, icons, glyphs) and the scale-2 band-diff
   reference. Symbol glyphs that hit fallback fonts export as SVG; some (e.g. ✉)
   return a `.notdef` box — crop those from the frame render instead.
3. **Comments** (`GET /v1/files/:key/comments`) — threads, authors, anchors,
   resolved status. Read them **impersonating Charles**: for each thread take his
   standpoint and ask "what did I mean here?" (an "ok" is an _acceptance_, not a
   new request). Apply the comment rule in section 2.
4. **Prototype** — the interaction design (click wiring, transitions, flows).
   Read `flowStartingPoints` and each node's `interactions[]` /
   `transitionNodeID` (not `reactions`); it defines how the frames connect.

**Scope & change detection:**

5. **Dev status** — `READY_FOR_DEV` / `COMPLETED` marks (the build gate; see
   section 3).
6. **File metadata** (`GET /v1/files/:key`) — `lastModified` and `version`.
   Compare against your last snapshot to catch updates and re-deliveries, and
   re-poll anything the team touched recently before importing it.
7. **Structure** — sections and nesting (the sitemap / click-depth org) and
   component/instance relationships.

**Design system & history — when present:**

8. **Design tokens** — local styles and variables (`variables/local`): the
   palette, type scale, spacing, and modes (light/dark). Prefer named tokens
   over hexes lifted per node. (Variables may need an enterprise plan/scope.)
9. **Version history** (`/versions`) — named checkpoints, to diff against a prior
   delivery.
10. **Raw image-fill sources** — the original uploaded asset behind an image
    fill, when the render is not enough.
11. **Figma MCP (if connected in Dev Mode)** — code-connect maps
    (component → code), motion/animation context, variable definitions, FigJam.

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

**Reading it — REST only.** The Figma Plugin/MCP API cannot read dev status
(`node.devStatus` throws). Use the REST API:

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
one-line **"pending from design"** note in the session hand-off
(`agent-delivery/sessions/`) so Charles has visibility — but change nothing.

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

## 6. Before you act

- **Re-poll for stability.** The team edits the file live; a frame can change
  mid-import. Re-fetch anything they touched recently before importing it.
- **Verify.** After importing a frame, band-diff the live render against the
  scale-2 frame render (font-AA envelope), and cover new interactions with a
  test.
