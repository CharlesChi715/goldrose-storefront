# Session: figma-sync · 2026-08-02 · branch feat/figma-sync

The 08-02 Figma delivery sync: `me三级` was re-marked Ready-for-dev (returns
flow + date pickers), checkout was redesigned as a two-step flow (the old
frame was deleted from the file), and the account cluster changed at source.
Full findings: `docs/ixd/README.md` § "08-02 delivery sync".

## AI-011 · `OWNER-TODO` · reply to the design team's scroll-wheel question in Figma

- **Where:** [`components/screens/ReminderEditModal.tsx`](../../components/screens/ReminderEditModal.tsx);
  Figma thread on node 2053:207 (comment id `1867810386`).
- **What:** the team asked whether dev can build a scrolling dropdown or
  whether they must draw every option
  ("这个夫哥你那边能设置滚轮下拉框吗，还是我们必须把所有数据列完给到你").
  Built as scrolling dropdowns with full ranges — days 1–31, months Jan–Dec,
  years verbatim from the drawn list (2027→2020). The lead-time number stays
  static (its chevron frame 2024:372 is an empty stub — picker not delivered)
  and the unit is pinned as a fixed value per the team's 08-01 comment.
- **Charles (08-02):** "can u do that claude?" — **no.** `FIGMA_TOKEN` is
  read-only (`file_comments:read`); posting needs `file_comments:write`, and
  the API refuses with 403. Two ways forward: paste the reply yourself, or
  issue a token with `file_comments:write` and an agent can post it.
- **Reply text, ready to paste:** 可以，滚轮下拉框我们前端自己实现，不用把所
  有选项都画出来 — 菜单画一个示意就行（几个选项 + 选中态）。年月日的完整范围
  我们在代码里生成：日 1–31、月 Jan–Dec、年沿用你们画的 2020–2027。

## AI-012 · `PLACEHOLDER` · seven /policies/* routes are coming-soon scaffolds

- **Where:** [`components/screens/PolicyComingSoon.tsx`](../../components/screens/PolicyComingSoon.tsx)
  and the routes under [`app/policies/`](../../app/policies).
- **What:** the Ready-for-dev POLICIES-LEGAL hub (1523:1136 →
  `/account/policies-legal`) links seven policy pages whose frames are NOT
  Ready-for-dev (2118:239/241/242/243/244/245, 2127:238). Per the scaffold
  rule each destination renders a quiet coming-soon state so the hub's
  navigation works without importing un-final design.
- **Resolution:** import each page when its frame is marked; the scaffold
  component then retires.
- **Charles (08-02):** "yes just leave it untouched." Confirmed — the
  scaffolds stay exactly as they are until the frames are marked.
- **⚠️ When `/policies/privacy` (2118:244) is imported:** point
  `/account/privacy-policy` at it with a redirect and retire the old
  accordion screen — decided with Charles 08-02 under AI-014.

## AI-013 · `AGENT-DECISION` · the checkout rebuild adds four controls the new design left out

- **Where:** [`app/checkout/CheckoutClient.tsx`](../../app/checkout/CheckoutClient.tsx).
- **Plain version:** the design team's new checkout screens are missing four
  things a working shop needs. Rather than drop the features or invent a new
  look, each one was rebuilt **as a copy of a box the designers already drew
  elsewhere on the page**, so it looks like it belongs:
  1. **Country picker** — the new address card has City, State and ZIP but no
     country, and shipping is priced by country (OQ-2). Without it we cannot
     price an order.
  2. **Quantity and Remove** — the new product card shows the item but lost
     the +/− buttons and the remove link, so a customer could not change
     their basket.
  3. **Discount code** — deleted from the design again, but the order summary
     still shows a Discount line and the admin can still create codes, so a
     customer with a code would have nowhere to type it.
  4. **Gift message** — never drawn, but it is what gets printed on the card
     and it is stored on the order.
- **Also decided (no design change needed):** the shipping options show no
  prices — they are decoration until per-method rates exist, and printing
  $14.99 next to something we never charge would mislead; the phone field is
  a picture only, because the order has nowhere to store a phone number; the
  card-number boxes appear only in test mode (a real card box that goes
  nowhere is a security problem); the pay bar is stuck to the bottom of the
  screen, following the design's own "固定在底部" note.
- **Recommendation:** show the design team the four additions next delivery
  and ask them to draw them properly, so we can delete our versions.

## AI-015 · `AGENT-DECISION` · returns-flow wiring where labels beat the prototype

- **Where:** [`components/screens/returns/RequestSubmittedScreen.tsx`](../../components/screens/returns/RequestSubmittedScreen.tsx)
  (representative; details in docs/ixd 08-02).
- **What:** three places where the built links differ from the clickable
  Figma prototype, each in the customer's favour:
  1. **"Back to Orders"** → `/account/orders`. The prototype sent it back to
     the returns start page, which contradicts its own label.
  2. **"Track Status"** → the after-sales status tab. In Figma this one
     button carries **two** triggers: a normal click opens "Return Approved",
     and a *drag* opens "Request Not Approved". A drag trigger fires when you
     press and pull on the element — designers use it to demo a second
     outcome without drawing a second button. It is a presentation trick, not
     a real interaction: in the shop, which of those two screens a customer
     sees is decided by our review of their request, not by how they touch
     the button. So the button goes to the status list, which shows whichever
     outcome is true.
  3. **"Track Package"** on the approved screen stays dead. It means the
     parcel the customer ships *back*, and nothing tracks return shipments —
     pointing it at `/orders/track` would show them an unrelated outbound
     delivery.
- **Charles (08-02):** asked what "drag" meant here — answered above; awaiting
  a keep-or-reverse call. Reversing any of the three is a one-line change.

## Delivered this session

- Checkout rebuilt as the two-step redesign (2157:239/384) on one route with
  `?step=payment`; PayPal SDK/mock/skip branches preserved; old
  `CheckoutSkin.tsx` deleted; e2e specs updated for the step flow.
- Returns flow imported: `/account/returns` (start/status tabs) +
  `add-photos`, `request-submitted` (replaces the AI-007 scaffold),
  `approved`, `refund-issued`, `request-not-approved` + shared reason sheet;
  old ReturnsScreen deleted.
- Reminder edit modal re-imported at 430×589 with live Year/Month/Day
  dropdown menus; the reminders timezone row now computes its own
  冬令时/夏令时 offset (`Pacific Time (PT)UTC-7` in summer, `…UTC-8` in
  winter) from `lib/reminders/timezone.ts`, with unit tests at both solstices
  and at the 2026 switch instants (AI-009 and AI-010 closed).
- `/account/security` re-imported from 1526:111 (password inputs removed at
  source); privacy hub rebuilt (Security card out, Policies & Legal card in);
  new `/account/policies-legal` hub + 7 `/policies/*` scaffolds; signup
  re-imported without password fields and linked from the login page;
  dashboard tiles/rows per the updated frame (Membership card removed at
  source, Addresses tile, inert Address Management row); login self-service
  card with the Policies & Legal row.
- Verified: production build, 63 unit + 91 e2e green (checkout/returns specs
  reworked), band-diffs 1.4–2.9 % on 12 screens + the modal (AA envelope);
  home/shop pixel baselines regenerated for pre-existing Chrome AA drift.
- Docs: `docs/ixd/README.md` § 08-02 (findings + per-screen notes),
  `SUMMARY.md` current-phase refresh.
