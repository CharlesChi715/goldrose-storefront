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
- **Charles (08-02), on whether dev can build it:** **yes — already built,
  nothing further needed from the design team.** The menus scroll
  (`overflowY: auto`, and opening one scrolls the selected row into view) and
  the option lists are generated in code, not drawn: `DAYS` is `1…31` from a
  one-line generator and `MONTHS` is `Jan…Dec`
  ([`ReminderEditModal.tsx`](../../components/screens/ReminderEditModal.tsx)).
  Only the *look* came from the frames — 126×77 field, dark `#493026` selected
  pill, Playfair options — so one drawn menu was enough to style all three.
- **Charles (08-02), on whether an agent can post the reply:** **no.**
  `FIGMA_TOKEN` is read-only (`file_comments:read`); posting needs
  `file_comments:write`, and the API refuses with 403. Paste it yourself, or
  issue a token with `file_comments:write` and an agent can post next time.
- **Reply 1 — the scroll-wheel question (thread on 2053:207):** 可以，滚轮下
  拉框我们前端自己实现，不用把所有选项都画出来 — 菜单画一个示意就行（几个选
  项 + 选中态）。年月日的完整范围我们在代码里生成：日 1–31、月 Jan–Dec、年沿
  用你们画的 2020–2027。
- **Reply 2 — how to represent a data-dependent destination (see AI-015):**
  按钮跳到哪一页要看后台的真实状态（审核通过 / 未通过 / 已退款），不能用
  "拖拽" 触发去演示第二种结果。建议二选一：① 在按钮上写一条 Dev Mode 注释
  说明"跳转到该申请当前状态对应的页面"，不连线；② 用 Figma 的 variable +
  conditional 交互（if 状态 = 已通过 → A 页，否则 → B 页）。列表里每张卡片
  各自连到自己的状态页（你们在 2030:188 已经这么做了）就是最准确的表达。

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
  1. ~~**Country picker**~~ — **withdrawn by Charles 08-02:** "remove the
     country/region as well". The band is deleted; the address card ends at
     CITY / STATE / ZIP as drawn. Shipping is still zone-priced, but the zone
     now comes only from geo-IP. Consequence tracked as AI-018.
  2. ~~**Quantity and Remove**~~ — **withdrawn by Charles 08-02:** "remove
     that quantity selector, just keep the same with figma". The band is
     deleted; checkout matches the frame. Both steps still list any further
     cart lines read-only (charging for an unshown item would be dishonest).
     The consequence is tracked as AI-017.
  3. **Discount code** — deleted from the design again, yet the design's own
     Final Order Summary (2157:479) still prices a `Discount (15%) −$28.35`
     row (2157:484-486), and the admin really can create codes
     (`app/admin/(dashboard)/discounts/`, with `lib/admin/discounts.ts` and
     `lib/checkout/discounts.ts` behind it — an e2e test creates a code in
     the admin and redeems it at checkout). A customer holding a code would
     have nowhere to type it.
  4. **Gift message** — the **customer** types it at checkout; it travels as
     `note` through `/api/checkout` onto the order, and the admin order
     detail shows it as the order's Notes, prefilled and editable, so whoever
     packs the box can write the card. No frame in this delivery draws the
     field.
- **Also decided (no design change needed):** the shipping options show no
  prices — they are decoration until per-method rates exist, and printing
  $14.99 next to something we never charge would mislead; the phone field is
  a picture only, because the order has nowhere to store a phone number; the
  card-number boxes appear only in test mode (a real card box that goes
  nowhere is a security problem); the pay bar is stuck to the bottom of the
  screen, following the design's own "固定在底部" note.
- **Recommendation:** show the design team the four additions next delivery
  and ask them to draw them properly, so we can delete our versions.

## AI-016 · `AGENT-UNSURE` · the PDP page is still the July frame, not the Ready-for-dev redesign

- **Where:** [`app/products/[slug]/page.tsx`](../../app/products/%5Bslug%5D/page.tsx).
- **What:** the built page is a pixel-exact copy of the **July** frame
  (`2:2`, 430×**2501**) and still declares `height={2501}`. Figma's current
  Ready-for-dev PDP is `1523:3971` in `shop二级`, 430×**1616** — a shorter,
  re-flowed page (Add to Cart / Buy Now at y1378; the ratings summary at
  y757 where ours sits at y1886). The redesign was never imported: the
  07-29 batch restyled and re-imported the PDP *drawers* (1523:4185/4215
  etc.) but left the page body on the old canvas, and this sync drift-checked
  the account cluster without re-checking the PDP.
- **Consequence:** every prototype coordinate for this screen is quoted
  against a layout we do not render, so future wiring has to be translated by
  hand (as the second reviews trigger just was). A third PDP frame exists
  too — the unmarked `2333:280` (430×2501) — so the file itself has two.
- **Recommendation:** re-import `/products/[slug]` from 1523:3971 as its own
  focused pass, and settle with the design team which of 1523:3971 / 2333:280
  is canonical before spending the effort.

## AI-017 · `AGENT-BLOCKED` · nothing in the live site can edit the cart

- **Where:** [`app/checkout/CheckoutClient.tsx`](../../app/checkout/CheckoutClient.tsx)
  (controls removed), [`app/bag/page.tsx`](../../app/bag/page.tsx) (the screen
  that should own the job).
- **What:** with the checkout band deleted per Charles's 08-02 instruction,
  `changeQuantity` and `remove` are called from **nowhere** in the app. Two
  facts make that reachable rather than theoretical: `addToCart` **increments**
  on a repeat click, and the product page has no quantity picker or
  add-confirmation — so a customer can land on Qty 2 by accident and has no
  way back to 1, and a customer with two products cannot drop either. They
  would be charged for it.
- **Fix, in order:** wire `/bag` (the designed basket, B-1) to the live cart
  with its own quantity and remove controls — it is the screen the design
  intends for this — **then** nothing else is needed at checkout. `/bag` being
  mock is already AI-002; this matter is the sharper consequence of it.
- **Interim risk:** low while the store is pre-launch with test traffic only;
  it must not ship to real customers unfixed.

## AI-018 · `OWNER-DECISION` · shipping zone now comes from geo-IP with no way to correct it

- **Where:** [`app/checkout/CheckoutClient.tsx`](../../app/checkout/CheckoutClient.tsx)
  (country is read-only), [`app/checkout/page.tsx`](../../app/checkout/page.tsx)
  (reads `x-vercel-ip-country`, falls back to `US`).
- **What:** with the COUNTRY / REGION band removed per Charles's 08-02
  instruction, nothing on the page can set the destination country. Shipping
  is still priced per zone — the zone is just decided by Vercel's geo-IP
  header alone. A wrong guess (VPN, travelling customer, missing header)
  silently prices the wrong rate: US `$5.95` vs rest-of-world `$19.95`, so we
  either undercharge and absorb the difference or overcharge the customer.
  The PayPal branch is unaffected, since PayPal collects the real address.
- **Why it is an owner decision, not a dev one:** it trades money for design
  fidelity, and the size of the trade depends on a business fact only Charles
  and the bosses know — whether the store ships outside the US at launch.
- **Options:**
  1. **US-only at launch** — then removing the field is entirely correct;
     restrict `servedCountries` to US and the ambiguity disappears. This also
     resolves the OQ-2 placeholder rate.
  2. **Ask the design team for a country field** in the address card (they
     drew CITY / STATE / ZIP; a country row is the natural fourth).
  3. **Accept geo-IP** and absorb the occasional wrong rate as a cost of
     doing business.
- **Recommendation:** option 1 if the answer to "do we ship outside the US at
  launch?" is no; otherwise option 2.

## Pending from design · `/account/signup` becomes `/account` (owner, 2026-08-02)

Charles will rename the signup frame in Figma to `/account`, because it is now
designed as the single login **and** signup place: its copy changed to
"Continue with your email" / "Enter your email to continue" with one CONTINUE
button — email-first passwordless auth, the natural partner to the emailed-code
decision. No action taken; it arrives as a renamed frame.

Two things to settle before an importer can act on it:

1. **Two frames would claim `/account`.** The old `1523:2470 · /account ·
   signed out · loginpage` ("Welcome to GoldRose / Sign in and continue
   shopping") still exists. One of the two must be retired or renamed, or the
   route rule (one route, one frame) cannot resolve which is canonical.
2. **The old frame carries live entry points the new one does not:** the Gift
   Shopping / Business & Partnerships toggle, the benefits grid, the
   self-service rows (Returns & After-Sales, Customer Care, Policies & Legal)
   and "Already purchased? VIEW MY ORDER". If the combined screen replaces it,
   design should say where those go — otherwise the rename silently removes
   working navigation.

**Repo change when it lands:** `/account` signed-out renders the combined
screen; the live `signInWithOtp` flow moves onto it; `/account/signup` retires
or redirects; the "Create a shopping account ›" link (wired 08-02) is deleted,
since it would point at its own page.

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
