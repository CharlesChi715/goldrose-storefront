# figma-sync · chatbot · 08-03 · `feat/figma-sync`

Agent session hand-off. Open matters first; what the session delivered is at
the bottom. See [`../README.md`](../README.md) for tag meanings and workflow.

---

## AI-022 · `OWNER-DECISION` · the new homepage frame drops MORI and the concierge chatbox

**The simplified homepage has landed Ready-for-dev, and it deletes the
concierge chatbot entry points.**

Section `首页一级` (1523:1525) now contains exactly **one** homepage frame —
the new `2380:370` — and the two frames the repo has been told to ignore
(1523:1655 and 2024:378) have been moved **out** of the marked section to the
page's top level. By the Ready-for-dev rule, 2380:370 is now the buildable
homepage.

Two things about it matter for the chatbot:

1. It contains **no MORI and no concierge modules at all** — no
   `A-4 · Real Rose Story and MORI Entry`, no `A-7 · MORI Gift Finder`, no
   `Concierge Chat` band. The repo still ships `components/home/A4.tsx`,
   `components/home/A7.tsx` and the floating `components/ConciergeChat.tsx`
   chatbox, all built from the older homepage.
2. It adds an **FAQ band** (`A11/02 FAQ`, 2380:777) whose four rows each
   prototype-link to `/care/chat` — a new, and now the *only*, chatbot entry
   from the homepage.

**Not imported.** This is a whole homepage redesign, far outside a chatbot
sync, and deleting the MORI mascot is a brand call, not an engineering one.

**Recommendation:** treat 2380:370 as its own sync pass, and before it runs,
confirm with the bosses/design whether the MORI mascot and the floating
concierge chatbox are genuinely retired or merely absent from this frame.
Answer that first — the rest of the homepage import is mechanical.

Location: [`components/ConciergeChat.tsx`](../../components/ConciergeChat.tsx)

---

## AI-023 · `AGENT-UNSURE` · checkout's "Ask Auri" chat link sits on a hidden layer

**Checkout's "Need help? Ask Auri." card links to the support chat but is
drawn on a hidden layer.**

In the details-entry frame (2157:239) the block
`06 / Summary + Help + Secure CTA + Nav` (2157:371) carries an
`Auri Checkout Help` card (2157:372 — "Need help? Ask Auri." /
"Expert checkout help, 24/7." / "ASK AURI →") whose prototype link navigates
to the support chat frame 1537:111. It is the only new chat entry point in
the checkout redesign.

But that whole block is `visible: false` — one of several parked layers
(05/06/pay-bar all stacked at local y=755) left over from the deleted
single-page checkout. The **visible** payment-confirmation frame (2157:384)
has its own 06 block (2157:516) that contains the three FAQ accordions and
**no Auri card**.

**Not built** — importing a hidden layer would put a control on the page that
the design does not draw.

**Recommendation:** ask the design team whether the Auri help card is meant to
appear on the payment step (where the FAQ rows already are). If yes, it is a
small addition above the existing accordions; if no, ask them to delete the
parked layers so future syncs stop finding phantom links.

Location: [`app/checkout/CheckoutClient.tsx`](../../app/checkout/CheckoutClient.tsx)

---

## Pending from design — no action taken

- **No designed "open" state for the floating concierge chatbox.** The
  `Concierge Chat` bands (1523:1528 shop, 1523:4169 / 2333:465 PDP,
  1523:3172 `Auri Concierge` on bag) are all still static art with **no
  prototype interaction**. `ConciergeChat.tsx` therefore still opens a
  placeholder panel, as it has since it was built.
- **`SUPPORT-*` component names not mirrored into code.** The design team
  re-authored the chat frame with a full formal vocabulary
  (`SUPPORT-SECURE-NOTICE`, `SUPPORT-ORDER-CONTEXT-CARD`,
  `SUPPORT-COMPOSER-BAR`, …). They were deliberately **not** added as
  `data-el` attributes: [`docs/ixd/naming/component-names.md`](../../docs/ixd/naming/component-names.md)
  is still marked **Draft**, so the rule is not signed off. Worth doing in one
  pass once it is.
- **Brand drift in the file itself.** The Figma file is now titled
  **VELORIA**, while the chat frame's own header text still reads
  "GoldRose Support" and SUMMARY records the brand as **ELDREVE** (DQ-34).
  Three names in one file. Folded into the rename project — see `AI-021`.

## Repo ↔ Figma drift — reported, nothing deleted

Storefront routes in the repo with **no** Figma frame:

| Route                       | Note                                                    |
| --------------------------- | ------------------------------------------------------- |
| `/account/business`         | only `/account/business/dashboard` has a frame          |
| `/account/privacy-policy`   | likely superseded by the `/policies/*` hub              |
| `/checkout/success`         | post-payment landing; may be intentionally dev-only     |
| `/orders`                   | the leftover admin redirect already in the release queue |
| `/policies/email-sms-terms` | eighth policy page; only 7 policy frames exist          |

Figma frames with **no** repo route:

| Figma route                     | Frame                              |
| ------------------------------- | ---------------------------------- |
| `/account/addresses`            | ADDRESS-BOOK / ADDRESS-BOOK-ADD-NEW |
| `/account/orders/delivered`     | (unnamed iPhone frame)             |
| `/account/orders/review`        | (unnamed iPhone frame)             |
| `/account/returns/select-reason`| SELECT-RETURN-REASON — built as a sheet on `/account/returns`, not a route |
| `/gift-guide`                   | gift guide long page               |

## Delivered this session

- Re-polled the file (last modified 2026-08-02 13:24) and scoped the sync to
  every chatbot surface: `/care/chat`, the concierge bands, and every
  prototype link pointing at the chat frame.
- **`/care/chat` needs no import.** Its frame was re-authored since 07-29 —
  the node ids the code quoted (1230:120, 1523:1470) no longer exist; the
  current frame is **1537:111**, Ready-for-dev under section `shoppage三级`.
  Band-diffed the live page against the scale-2 render: identical within the
  font-AA envelope, the only real delta being the Next.js dev badge sitting
  over the composer. Geometry, copy and colors unchanged — only the layer
  names are new.
- Corrected the stale Figma node ids in
  [`app/care/chat/page.tsx`](../../app/care/chat/page.tsx) and
  [`components/screens/SupportChatScreen.tsx`](../../components/screens/SupportChatScreen.tsx)
  so the next sync can find the frame, and recorded why the `SUPPORT-*` names
  are not yet `data-el`.
- Traced all five prototype links into the chat frame: `/care` chevron
  (already wired), checkout's Auri card (hidden layer — `AI-023`), and four
  homepage FAQ rows on the new homepage frame (`AI-022`).
- No behaviour changed. Typecheck clean.
