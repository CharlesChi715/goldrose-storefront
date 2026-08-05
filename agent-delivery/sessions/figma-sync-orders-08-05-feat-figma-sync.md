# figma-sync (orders) · 2026-08-05 · `feat/figma-sync`

Ran the Figma read pipeline against file version `2383842832809713066`. The
delivery had **no changed frames** — the baseline had been set 22 minutes
earlier by the session that installed `scripts/figma/`, which committed the
tooling without importing anything. The real scope was therefore the two
Ready-for-dev frames left unbuilt (AI-029, now closed), not a delta.

---

## AI-030 · `AGENT-DECISION` · the review page's selected states are ours, not the design's

`/account/orders/review` (2439:370) tells the customer to choose: three
"How did your gift feel?" chips and a "Tap a star to choose your rating" row.
The frame ships **only one visual state** for both controls — every chip is an
identical white pill, and all five stars are drawn solid gold.

Building the instruction with no selected art meant either shipping a dead
instruction or inventing the state. The page invents it, minimally:

| Control | Unselected            | Selected (ours)                       |
| ------- | --------------------- | ------------------------------------- |
| Chip    | 1px `#E5D9C9` stroke  | 1.4px `#3B2F2F` stroke                |
| Star    | full gold             | stars past the chosen one dim to 0.3  |

Both are one-line reversals if the design team rules differently, and both are
marked in the component header.

**Needed:** a selected state from the design team for each control, or an "ok"
on these. Reversible either way.

Location: [`components/screens/orders/WriteReviewScreen.tsx`](../../components/screens/orders/WriteReviewScreen.tsx)

---

## AI-031 · `OWNER-DECISION` · PUBLISH REVIEW has nowhere to publish to

The same frame's PUBLISH REVIEW button is the end of the flow, but there is
**no reviews backend** and **no frame for a submitted/thank-you state**. The
button is therefore built as verbatim art that does nothing — it is neither a
link nor a button, so it cannot fake an outcome, and an e2e test pins that.

Wiring it to a guess would be worse than leaving it inert: a customer who taps
it and sees a success screen would believe a review was published.

Two things are missing and they are different owners:

1. **Design:** a submitted / thank-you frame for after the tap.
2. **Owner/tech:** whether customer reviews are stored at all this release —
   they need a table, moderation, and a display surface on the PDP. Note that
   `docs/ideas.md` gained a raw "reviews" line during this session.

**Recommendation:** leave inert for pre-launch. Reviews are a feature, not a
screen; scope them after the owner walkthrough rather than inside a sync.

Location: [`components/screens/orders/WriteReviewScreen.tsx`](../../components/screens/orders/WriteReviewScreen.tsx)

---

## Pending from design — noted, nothing changed

- **Two unresolved Figma comment threads**, both standalone design-team
  comments (not replies inside Charles's threads), so under the sync skill's
  ownership rule neither was acted on:
  - `DATE-FIELD-MONTH-DROPDOWN-MENU` — 苏苏白衣 asks Charles whether dev can
    provide a scroll-wheel dropdown, or whether they must enumerate all the
    data. **This one is a question waiting on Charles**, not on the agent.
  - `/account/reminders · edit open` — "这个先设定为固定值，不能修改" (set as a
    fixed value for now, not editable). Describes a coming change to a frame
    already imported.
- **`/account/addresses`** (`2118:246`) and **`/gift-guide`** (`1942:182`) —
  still not Ready-for-dev, unchanged since the 08-04 sync.
- **12 scaffold targets** unchanged from 08-04; all already have coming-soon
  routes, so no new placeholder was needed.

## Repo ↔ Figma drift — reported, nothing deleted

`figma:routes` lists 7 repo routes with no frame and 6 frames with no route.
Two of the six resolved to false positives on inspection and need no action:

- `/account/returns/select-reason` (2047:194) is **built**, as the
  `ReturnReasonSheet` bottom sheet rather than a route — a deliberate 08-02
  decision recorded in that component's header.
- `/products/[slug]` is a dynamic segment, which never matches a literal frame
  name; the route exists.

The rest are the known pending items above, plus expected technical routes.

## Not fixed — pre-existing failure found while verifying

`tests/e2e/pixels.spec.ts` › "pixel baseline: product-detail (masked live-text
boxes)" **fails on this branch with my changes stashed**, so it predates this
session and was left alone. Everything else in the account, screens and pixel
suites passes. Worth someone's attention — it is the PDP's pixel guard.

## Delivered this session

- `/account/orders/delivered` — pixel-exact import of 2439:369 (430×1316),
  a static mock like `/account/orders/details`. Buttons: BUY AGAIN → `/shop`,
  WRITE A REVIEW → `/account/orders/review`, RETURNS AND AFTER-SALES and
  "Start a return" → `/account/returns`, "Contact support" → `/care`.
- `/account/orders/review` — pixel-exact import of 2439:370 (430×932), with
  live chips, stars and character counter (AI-030, AI-031).
- `components/screens/OrdersListScreen.tsx` — VIEW DETAILS on a **delivered**
  order now goes to `/account/orders/delivered`, honouring the frame's own
  prototype edge (1523:3455 → 2439:369) and closing AI-029's dead end.
- 17 new assets under `public/eldreve/screens/` (15 icon SVGs, 2 product PNGs,
  1 back-arrow PNG).
- `tests/e2e/order-delivered-review.spec.ts` — 4 passing smoke tests.
- Baseline re-set with `npm run figma:baseline` so the next `changes` is
  meaningful.
