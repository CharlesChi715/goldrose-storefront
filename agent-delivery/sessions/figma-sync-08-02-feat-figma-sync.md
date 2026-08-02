# Session: figma-sync · 2026-08-02 · branch feat/figma-sync

The 08-02 Figma delivery sync: `me三级` was re-marked Ready-for-dev (returns
flow + date pickers), checkout was redesigned as a two-step flow (the old
frame was deleted from the file), and the account cluster changed at source.
Full findings: `docs/ixd/README.md` § "08-02 delivery sync".

## AI-010 · `AGENT-DECISION` · timezone picker sheet deliberately not built

- **Where:** [`components/screens/RemindersScreen.tsx`](../../components/screens/RemindersScreen.tsx)
  (timezone row), un-built frame GIFT-REMINDERS-TIME-ZONE 2030:190.
- **What:** the re-marked `me三级` section contains a full timezone-picker
  sheet, but the comment thread Charles accepted (07-31 → 08-01) settled
  Pacific-only with automatic DST and **no manual setting** ("只用一个太平洋
  时间" → "不用人为设置" → "是的 我就打算这么弄"). The sheet directly
  contradicts that, so the accepted comment won: the row shows the frame's
  literal `Pacific Time (PT)UTC-8` and no picker opens.
- **Recommendation:** ask the design team to delete 2030:190 (or explicitly
  re-open the timezone question). If they insist on the picker, this decision
  reverses cleanly — the sheet is fully specced in the file.

## AI-011 · `AGENT-DECISION` · date-dropdown ranges answered in code; reply pending in Figma

- **Where:** [`components/screens/ReminderEditModal.tsx`](../../components/screens/ReminderEditModal.tsx).
- **What:** the team's open comment on the month menu asks whether dev can
  build a scrolling dropdown or whether they must draw every option
  ("这个夫哥你那边能设置滚轮下拉框吗，还是我们必须把所有数据列完给到你").
  Built as scrolling dropdowns with full ranges — days 1–31, months Jan–Dec,
  years verbatim from the drawn list (2027→2020). The lead-time number stays
  static (its chevron frame 2024:372 is an empty stub — picker not delivered)
  and the unit is pinned as a fixed value per the team's 08-01 comment.
- **To do (Charles):** reply "可以，滚轮下拉框我们自己做" (or equivalent) in
  the Figma thread on 2053:207 so the team stops drawing option lists.

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

## AI-013 · `AGENT-DECISION` · checkout two-step rebuild: dev bands + guard rails

- **Where:** [`app/checkout/CheckoutClient.tsx`](../../app/checkout/CheckoutClient.tsx).
- **What:** the redesign (2157:239/384) omits controls the live checkout
  needs, so they ride as dev bands in the design's field language: a
  COUNTRY / REGION selector (shipping is zone-priced — OQ-2), cart-management
  rows (the new item card has no steppers/remove), the discount-code band
  (§8 feature), and the gift-message band (order Notes). Also: the frame's
  shipping-method prices ($14.99/$24.99) were NOT imported (cosmetic picker
  per the owner's standing decision), PHONE (Optional) is inert art (the
  checkout payload has no phone), card wells stay mock-branch-only (PCI
  hazard rule), and the Secure Pay Bar is a fixed bottom overlay (it
  overflows its frame + the resolved "固定在底部" comment).
- **Recommendation:** confirm the bands with the design team next delivery;
  each maps 1:1 to a designed component they could adopt.

## AI-014 · `OWNER-DECISION` · /account/privacy-policy is orphaned by the policies hub

- **Where:** [`app/account/privacy-policy/page.tsx`](../../app/account/privacy-policy/page.tsx).
- **What:** its frame (1523:1136) was rebuilt at source into the
  POLICIES-LEGAL hub, and the designed privacy policy is now the unmarked
  `/policies/privacy` (2118:244). The old accordion screen still renders but
  no designed screen backs it, and once 2118:244 is marked there will be two
  privacy policies.
- **Options:** keep it until `/policies/privacy` is real, redirect it there,
  or retire the route now. Recommendation: keep until the policy page
  imports, then redirect.

## AI-015 · `AGENT-DECISION` · returns-flow wiring where labels beat the prototype

- **Where:** [`components/screens/returns/RequestSubmittedScreen.tsx`](../../components/screens/returns/RequestSubmittedScreen.tsx)
  (representative; details in docs/ixd 08-02).
- **What:** three divergences from the raw prototype map, all in the user's
  favor: "Back to Orders" → `/account/orders` (the prototype pointed it at
  the returns start page); "Track Status" → the status tab (the prototype's
  click→approved / drag→not-approved pair is a demo trick, not navigation);
  approved's "Track Package" stays inert (return-shipment tracking has no
  page — wiring it to `/orders/track` would show an unrelated outbound mock).
- **Recommendation:** veto-check only; reverse any of the three by pointing
  the link at the prototype target.

## Delivered this session

- Checkout rebuilt as the two-step redesign (2157:239/384) on one route with
  `?step=payment`; PayPal SDK/mock/skip branches preserved; old
  `CheckoutSkin.tsx` deleted; e2e specs updated for the step flow.
- Returns flow imported: `/account/returns` (start/status tabs) +
  `add-photos`, `request-submitted` (replaces the AI-007 scaffold),
  `approved`, `refund-issued`, `request-not-approved` + shared reason sheet;
  old ReturnsScreen deleted.
- Reminder edit modal re-imported at 430×589 with live Year/Month/Day
  dropdown menus; reminders timezone row now `Pacific Time (PT)UTC-8`
  (AI-009 closed).
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
