# Definition of Done — a GoldRose front-end screen

|                  |                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------ |
| **What this is** | The checklist a screen must pass before anyone — human or AI agent — may call it finished.                      |
| **Standing doc** | Not a per-task hand-off. Revise as the standard improves; do not delete.                                        |
| **Opened**       | 2026-07-29                                                                                                     |
| **Owns**         | The dev-side definition of "done". [`delivery-protocol.md`](delivery-protocol.md) owns the *design*-side one (交付清单, leg 1). |
| **Status**       | **Proposed** — awaiting Charles's sign-off. Once adopted, becomes `.claude/skills/frontend-screen/SKILL.md`.    |
| **Why it exists**| Our rules were true but scattered across five documents, so each new session rediscovered whichever ones happened to land in context. That is why agent output felt random. One list, loaded every time, is the fix. |

---

## How to read this

Three gates, in order. A screen is done when all three pass — not when it renders.

| Gate | Question | Who checks |
| --- | --- | --- |
| **A · Machine** | Would CI go red? | GitHub Actions, automatically |
| **B · Convention** | Does it look like the rest of this repo? | Human or agent review |
| **C · Evidence** | Did somebody actually *watch it work*? | The person claiming "done" |

Gate A is the only one a machine currently blocks. Gates B and C are honour-system
today — which is exactly why they must be written down.

---

## Gate A — machine-enforced (CI fails if broken)

These four already run on every push and pull request.

1. **Element names parse.** Every `data-el` literal in `components/**/*.tsx` and
   `app/**/*.tsx` matches `PAGE - SECTION - [QUALIFIER] - TYPE [-INDEX]`, drawn
   from the vocabulary tables in [`element-names.md`](element-names.md).
   Adding a new word means editing that doc, not the test.
2. **Element names are unique** across the whole repository.
3. **`npm run lint`** passes — stock `next/core-web-vitals` + TypeScript.
4. **`npm run typecheck`** passes. This is also what catches a mistyped
   `AdminMessageKey`, so admin i18n typos are a compile error, not a runtime one.

> Guarded by `tests/unit/element-names.test.ts`, run by `npm run test:unit`.
> **This is the only machine check that knows anything about our front-end
> conventions.** Everything below it is unguarded.

---

## Gate B — convention (100% consistent in the repo, enforced by nothing)

Every item here is followed by *every existing file*. An agent that skips one
produces code that is technically valid and visibly foreign.

### B1 · File and export shape

- New file opens with a `ROLE OF THIS FILE` JSDoc block naming the Figma node
  and stating plainly **what is real and what is placeholder**. 232 files have
  one; the count must stay at 100%.
- **Named exports only.** Never `export default`.
- Homepage bands: `components/home/A<n>.tsx` → `export function A<n>()`.
  Imported design screens: `components/screens/<Name>Screen.tsx` →
  `export function <Name>Screen()`.
- **Server component by default.** Add `"use client"` only when the screen owns
  state, effects, or event handlers — and put it on line 1, above the JSDoc.

### B2 · Naming

- Name the **role**, never the appearance or position.
  `HOME-HERO-SHOP-BTN` ✅ · `GOLD-BUTTON` ❌ · `TOP-BUTTON` ❌
- Do not tag decoration — backgrounds, gradients, spacers. Carousel dots are the
  one exception and are indexed individually.
- Figma node ids belong in JSX comments (`{/* 158:77 · … */}`), never in the DOM.
- The same string appears in three places and is **never transformed between
  them**: Figma layer name = `data-el` in code = `[data-el="…"]` in tests.

### B3 · Runtime-load-bearing markers — get these wrong and a *feature* breaks

- **`data-live-text`** on every box whose text comes from the database. The
  pixel tests mask these; an untagged live box makes `pixels.spec.ts` fail on
  the next price change.
- **`data-blend`** on blend-mode art, for the same reason.
- **A band wrapper must end in `-SECTION`.** `components/Beacon.tsx:32` selects
  `[data-el$="-SECTION"]`; a band named anything else **silently disappears from
  engagement analytics** — no error, just missing data.

### B4 · Styling

- Inline `style` objects with verbatim Figma hex. **No Tailwind utility classes
  in screen components** — Tailwind is installed but screens do not use it.
- `className` is reserved for font binding only: `className={notoSC.className}`
  and friends from `@/lib/fonts`.
- Layout via `abs()` / `txt()` from `@/lib/figma-layout`. Wrap in `<ScaleFrame>`.
  Account screens take shared tokens from `@/components/screens/account-chrome`.
- Images: raw `<img>` with explicit `width`/`height`, sourced from the Figma
  exports under `/public/veloria/…`, with
  `/* eslint-disable @next/next/no-img-element */` on line 1. Decorative art
  gets `alt=""`; glyph images get the glyph as alt.

### B5 · Placeholder honesty

- Mock fields are styled `<div>`s — **never live `<input>`s**.
- Inert controls must not render as `<button>`.
- Placeholder copy, prices, and imagery are marked as placeholder in the file
  header. Unknown images use `assets/PlaceholderPicture.png`.

### B6 · Admin screens only

- No hardcoded UI strings. Everything goes through `t()`.
- **Both languages in the same commit.** `zh` is typed `Partial<>`, so a missing
  Chinese string compiles fine and silently ships English to a Chinese user.
  Nothing catches this but you.
- Chinese follows Shopify's own Simplified-Chinese admin vocabulary.

### B7 · Anything exported from `lib/`

- JSDoc with a one-line "what", a sentence of **why it is shaped this way**, and
  `@param` per argument described **by meaning and unit**, not by type — the
  types are already in the signature. `lib/money.ts` is the model to copy.

---

## Gate C — evidence (nothing may be called done without this)

The rule: **do not claim it works because the code looks correct.**

1. **Add the smoke test.** A new screen adds to `tests/e2e/screens.spec.ts` (or
   `account-screens.spec.ts`):
   - the route renders — one exact-text visibility assertion
   - every wired link lands where the route table says — `toHaveURL`
   - every inert placeholder stays inert — `toHaveCount(0)`
   - if fields are mock — `await expect(page.locator("input")).toHaveCount(0)`
2. **Run it.** `npm run test:e2e` locally. It does **not** run in CI, so
   "the test exists" is not the same as "the test passes".
3. **Look at the screen.** Open the route in a browser and describe what you saw.
   A screenshot or a sentence — but the claim must come from observation.
4. **Report honestly.** If a step was skipped, say it was skipped. If a test
   fails, paste the output. A hedged "should work" is a failure to verify.

---

## The teaching clause

This repo is also how Charles learns production engineering. Building well and
explaining well are one job here, not two.

When working on a screen, the agent must:

- **Say the standard before applying it** — "this needs `data-live-text` because
  the pixel test masks live boxes" — not silently comply.
- **Name the industry practice** behind each rule once per session, in plain
  language, tied to this repo. Why pixel baselines are platform-specific. Why
  money is integer cents. Why `Partial<>` on a translation dictionary is a
  silent-failure trap.
- **Show the decision, not just the result** — options considered, why this one,
  what it would cost to reverse.
- **Flag what it did not verify.** Uncertainty stated is worth more than
  confidence performed.
- When a trace is worth keeping, offer to add it to
  [`docs/learning/`](../learning/README.md), which is where the durable version
  of this teaching lives.

This clause is the difference between an intern who finishes the ticket and a
senior engineer who leaves the team better than they found it.

---

## Known defects in the current guard rails

Found 2026-07-29 while writing this document. Each one weakens Gate A.

| # | Defect | Effect | Fix |
| --- | --- | --- | --- |
| 1 | ~~The vocabulary parser in `element-names.test.ts` scrapes backticked ALL-CAPS tokens out of prose, not just the tables. `BUY` leaked in as a valid PAGE word from a blockquote; bare `CTA` leaked in as a SECTION word from a note saying `CTA` must **not** be one; the full element name `PDP-PRODUCT-PRICE` was registered as a TYPE word.~~ | ~~The guard accepts names it should reject.~~ | **Fixed 2026-07-29** — a word now counts only as a table cell's entire content. |
| 2 | The QUALIFIER/FUNCTION segment is never checked — the test does not read the `### FUNCTION` section at all. | The 19-word FUNCTION vocabulary is decorative; anything between SECTION and TYPE passes. | Parse it, at the **warn** level [`element-names.md` Enforcement](element-names.md#enforcement) decided 2026-07-29. |
| 3 | Template literals beginning `${` are skipped entirely (`Carousel.tsx:156`). | Those names are unchecked. | Accept; document the hole. |
| 4 | `data-key` for data-driven lists (element-names rule 2) has **zero uses** anywhere in the repo. | The rule is aspirational, not real. | Apply it or drop it. |
| 5 | Only **6 of 77** component files carry any `data-el` at all. `A8.tsx` and every `components/screens/*Screen.tsx` have none. | Analytics, tests, and design traceability all stop at the homepage. | Backfill, screen by screen. |

Uniqueness is also enforced **globally** while rule 6 only asks for
*per-page* uniqueness — the test is stricter than the doc. Recommend keeping
the test and correcting the doc.

---

## What this document does not cover

- The design-team side of the hand-over — that is
  [`delivery-protocol.md`](delivery-protocol.md) §2.
- Frame and section naming, which lives in
  [`naming/figma-route-rule.md`](naming/figma-route-rule.md).
- Backend, schema, and payment work.
