# Interaction Specifications · IxD Specs

Interaction drafts from the design team covering the mechanism layer:
clickability, triggers, navigation, and states. This directory is a read-only
mirror for developers. Preserve the wording verbatim; do not edit the body
manually. Mark problems found in the source inline with `⚠️ Developer note`.

**Source:** [shop.md](shop.md) and [homepage.md](homepage.md) (English working
copies; `homepage.md` carries the `H-01…H-37` ids cited throughout
`components/home/`). The design team's editable original is
[`主页_shop页机制.numbers`](../../team-deliveries/originals/2026-07-25-home-shop-mechanism/)
(received 2026-07-25), kept with its verbatim Chinese export; when it updates,
re-import into this directory. On wording disputes, the Chinese source wins. A
second source,
[`frontend-function-draft.numbers`](../../team-deliveries/originals/2026-07-27-order-detail/)
(received 2026-07-27), covers the order-detail page: verbatim Chinese export
beside it (no English working copy — translate from the archived source if
needed); the same rules apply.

Originals live under [`team-deliveries/originals/`](../../team-deliveries/README.md) and
are version-controlled — until 2026-07-30 they sat in the gitignored scratch
folder (since renamed `trash/`), outside version control entirely.

## Files

- [shop.md](shop.md) — 15 Shop page entries (N-01…N-15), still verbatim
  Chinese (translation pending)
- [homepage.md](homepage.md) — homepage entries (H-01…H-37), English working
  copy; the ids cited across `components/home/` and `tests/e2e/homepage.spec.ts`
  resolve here
- `assets/` — 52 annotated screenshots (red box = the element for that entry);
  filename = entry ID; JPEG-compressed from the originals

**Naming.** An element-level convention doc (the `data-el` grammar and
vocabulary) does not exist yet — Charles will author it; the `data-el`
attributes themselves are in code. Current naming docs:

- [naming/figma-route-rule.md](naming/figma-route-rule.md) — the **page-level
  chapter**: an UPPERCASE section per top-level route segment, and a frame named
  for its exact route followed by `·`-separated design metadata (screen,
  viewport, state). Replaced the deleted `frame-names.md` on 2026-07-30.
  ⚠️ Unlike the other naming docs it carries no status/version header, so it is
  not yet clear whether it is Proposed or Adopted
- [naming/product-handles.md](naming/product-handles.md) — the deterministic
  algorithm deriving a product's `/products/<handle>` URL segment from its
  title, so any person or model produces the identical string
- [naming/component-names.md](naming/component-names.md) — the `data-el`
  attribute vocabulary tying a rendered element back to its design component

The 2026-07-25 design-team naming guide was archived on 2026-07-31; the three
docs above supersede it. Its raw source stays in
[`team-deliveries/originals/2026-07-25-figma-naming-guide/`](../../team-deliveries/originals/2026-07-25-figma-naming-guide/).

## How to reference an entry

Entry IDs are stable. Write `implements H-09` in commits, PRs, and code
comments; search for `### H-09` within the documentation. Newer sources use
full naming-guide IDs (e.g. `implements ORDER-DETAIL-SHARE-TRACKING`);
reference them the same way.

## Status legend (target-page design progress)

| Label                                           | Meaning                                                                 |
| ----------------------------------------------- | ----------------------------------------------------------------------- |
| Incomplete / Not done                           | The target-page design is not ready                                     |
| To be confirmed                                 | Pending a decision from the design team                                 |
| Future iteration (not currently planned)        | Out of scope for this release, such as personalization                  |
| No separate page needed / Not currently planned | Inline interaction with no target page / deferred                       |
| —                                               | Not marked in the source table, usually because the page already exists |

Message from me to ai agents: leave placeholder in unsure things

## Items to confirm with the design team

> The `DQ-nn` question docs are not kept in the repo (git history has them).
> The findings below stay here as the record of what was discovered during
> each import.

1. **Routes:** H-06, H-08, H-17, H-28, H-29, H-32, and H-37 are marked
   “suggested route, pending developer confirmation.” Finalize them after
   development provides the route table.
2. **Desktop:** All prototypes use the iPhone 15 Pro Max frame. Will separate
   desktop layouts be provided? in the future yes. and the prototypes with this 
   smartphone but the page currently should be usable in all smartphones.
3. **Scope:** The Shop page mock includes a wishlist heart and star ratings,
   but the table has no corresponding entries. Are these in scope for this
   release? (The repository already has an initial `WishlistButton`.)
   no.
4. **Price display:** In the N-13 mock, the struck-through price of $189 is
   lower than the current price of $219. The promotion price should be less
   than or equal to the original price; confirm that the mock uses placeholder
   data. - yes placeholder data
5. **Assets:** The mock contains third-party brand imagery, such as the gift
   box in the N-07 banner. Replace all of it with GoldRose assets before
   launch. -- how did you tell its from third-party? yes just do it for current dev.
   `⚠️ Developer note`: the tell is the dark-green gift box in the photo — it
   carries a gold crest and a partially visible wordmark (reads "VILOW… ROSE",
   not GoldRose), so the photo is another brand's (or AI-mocked) product shot.
   The same image is already live on the deployed `/shop` hero
   (`public/veloria/shop-hero.png`). Swapping it needs a GoldRose-branded
   replacement photo (ties into OQ-3 real product content); the banner is
   pixel-diff-guarded, so the swap is an asset replacement at the same size,
   not a re-crop.
6. **Content:** Sources for the copy and images on target pages such as the
   blog, brand story, customer stories, and corporate partnerships remain to
   be determined. -- leave with placeholder.

## Route table (decided by dev 2026-07-25, per owner delegation)

Implemented in the 2026-07-25 homepage/shop import. Wired now (target exists):
H-04 cart → `/checkout` · H-05 logo → `/` · H-07 hero CTA, H-09/H-12/H-14
homepage product cards, H-10/H-13 view-all, H-19/H-22 occasion & recipient
cards, H-27 Browse All Gifts, H-36 Shop All → `/shop` · shop grid cards (N-13)
→ `/products/[slug]` (live catalog) · bottom nav Home `/`, Shop `/shop`,
Login `/account`. Everything else — H-01 menu, H-06 search (dropped from the
final header), H-08/H-16/H-28/H-29/H-30/H-37 personalization, H-15/H-26 MORI,
H-17/H-31 craft, H-20/H-23/H-35 blog/FAQ, H-24 stories, H-32 workshop,
H-33 corporate, H-34 story, Wholesale tab — renders pixel-exact but is
**not clickable** until its target page exists (per the "leave placeholder"
instruction above).

**Update 2026-07-30 — H-24 Read Customer Stories is now wired.** Charles's
Figma comment on the homepage frame (1523:1655, pin at the A-6 button)
directed it to `/story`; the placeholder button in `components/home/A6.tsx`
is now a link there (geometry unchanged, A-11 CTA pattern).

**Update 2026-07-29 — the bottom-nav Wholesale tab is now wired.** Its target
page exists, so the "until its target page exists" condition above is spent:
the tab opens `/business/wholesale` (DQ-13(a), answered by Charles). This
covers both bottom-nav implementations — the shared `BottomNav`
(`components/chrome.tsx`) and the band the business pages draw for themselves
(`PartnershipsScreen`).

**Update 2026-07-29 — B-4 now uses the shared fixed bar.** The B-4 frame drew
its tab bar *inside* the 1954-tall page, so it scrolled away with the canvas
and was only reachable at the very bottom. `/business/wholesale` now renders
the shared fixed `BottomNav` (`navActive="Wholesale"`) like every other main
page; the in-frame band was deleted from `WholesaleScreen`. The frame height
is unchanged — the band's old 58px is left empty so the fixed bar floats over
background rather than over the response-time note.

One asset note: B-4 is the only frame that ever rendered the Wholesale tab's
**active** state (1523:771); the 07-25 home set has just the outline. That art
is now the shared tab's `activeImg`, so tab ids may carry a set prefix
(`screens/1523-771`) — see `tabArtSrc` in `components/chrome.tsx`.

⚠️ **B-3 (`/business/partnerships`) still draws its own in-frame band** and so
still scrolls away. Left as-is deliberately (this change was scoped to
wholesale); worth aligning — see DQ-21 on the disagreeing tab bars.

**Update 2026-07-26 — the three A-4 MORI gift-path cards are now wired.**
H-15 "FIND A GIFT" → `/shop` (no gift-finder page yet; the catalogue is the
closest honest destination). H-16 "PERSONALIZE YOUR ROSE" → `#personalize` and
H-17 "EXPLORE OUR CRAFT" → `#craft` — in-page anchors that scroll to modules
A-8 ("Personalized Gold Rose Gifts") and A-9 ("Craft, Workshop and Patents")
further down the same homepage, which are literally that content. All three
still count as **pending real pages**: a dedicated MORI gift finder,
personalization flow and craft page supersede these when they exist. The
remaining H-16/H-17 siblings (H-08/H-28/H-29/H-30/H-37, H-31) and H-26 stay
inert. No coordinates or styles changed — the cards are pixel-identical.

## `⚠️ Developer note` · mascot artwork needs transparent PNGs

The four AI-generated illustrations on the homepage (the MORI cat and the
pink ribbon strip) are **opaque bitmaps with a transparency checkerboard
baked into the pixels**. The Figma file hides that background with a
`DARKEN` fill blend mode, and the import now reproduces it, so the pages
match the mock — but DARKEN is a workaround, not a cutout:

- Anything lighter than the backdrop is darkened, so the same art breaks on
  any dark or coloured section (it can only ever be placed on light cream).
- A faint grey checkerboard is still visible in the mock and on the page.
- Browsers composite blend modes on the GPU, so those four boxes are not
  bit-reproducible and had to be excluded from the pixel-regression net.

**Ask:** please re-export the mascot art as real transparent PNGs (alpha
channel, no checkerboard) and drop the blend mode. Then the art can sit on
any background, the checkerboard disappears, and the pixel net can cover it
again. Same applies to any new mascot art in the screens still in progress.

## B/C screen imports — 2026-07-26 developer findings

All seven remaining frames are now implemented (B-1 bag, B-2 checkout, B-3
partnerships, B-4 wholesale, C-1 tracking, C-2 confirmation, C-3 menu drawer).
Things found while transcribing them, for the design team to decide on:

**Two visual languages are now in the codebase.** B-1/B-2 use the palette the
live homepage and shop already use (`#FFF6EC` / `#3B2F2F` / `#D4AF37`, the
owner's logo art). C-1/C-2/C-3 use a newer one (`#FFFBF6` / `#09442E` /
`#D18005`) and set the brand as *text* — "VELORIA" on C-1/C-2, "GoldRose" on
C-3 — instead of the logo image. Which one is the target? Everything shipped
verbatim, so the site currently changes character between pages.

**Tab bars disagree.** The live bar is Home / Shop / Wholesale / Login (the
owner's art). C-1 and C-2 each draw their own glyph bar, and C-2 marks *Help*
as the active tab on a confirmation screen. B-3/B-4 have no bar at all. Those
routes therefore opt out of the shared bar to avoid two bars stacking.

**Mockup artifacts / asset bugs** (all left verbatim except where noted):
- C-3 contains an iPhone status bar ("9:41"). Not implemented — it would put a
  fake clock on the site.
- C-2's `✉` and B-1's `Pay` mark export as a `.notdef` square / lose the
  Apple glyph. Both are served as crops of Figma's frame render instead.
- B-1's GoldRose wordmark starts 4.5px above its clipping parent, so its top
  row is cut off in the design itself.
- B-1 FAQ rows carry a hairline colour with `strokeWeight: 0` (no divider
  renders); the same component in B-2 has `individualStrokeWeights.bottom: 1`.
  One of the two is wrong.
- B-1's gift add-ons look swapped: "Rose Bouquet" shows a gift card, "Personal
  Card" shows a boxed rose set.
- B-4's hero image is a "MORI'S RECOMMENDATION" box and its product photo is a
  blue rose — stock/dev art on a wholesale application.
- C-2's chip labels (ORDER/SHIP/PIN/CARD/GIFT/HELP) sit at the top of their
  38px badges rather than centred.

**B-2 checkout has controls with nothing behind them.** The Standard /
Express / Next-Day picker cannot price per method (shipping is zone-priced
from the country), and the card / Shop Pay / Apple Pay rows are not live
providers — PayPal is. Per the owner's decision the picker ships as a cosmetic
control; card inputs are shown only in mock/dev mode, because a card-number
field that goes nowhere is a security hazard. To make either real, the design
needs backend work: per-method shipping rates, and a card provider.

**Placeholder data.** B-1's line items, C-1's whole tracking timeline
(#VL20250821, the UPS number, the dates) and C-2's product/address rows are
the mocks' own strings. `/bag` is not yet wired to the live cart, so the cart
icon still points at `/checkout`, which is the real basket.

## 07-27 screen imports — developer findings

Sixteen new frames landed in the file on 2026-07-27 and are all implemented:
the two account dashboards (914:112/113), the five 小页面 states (SEARCH-OPEN
914:114, SHOP-SORT 914:115, SHOP-FILTER 914:116, PDP-REVIEW 914:117,
PDP-MEDIA 914:118) and the nine MORE-SCREENS frames (PDP-COLOR 1097:112,
PDP-UNBOXING 1097:113, AUTH-SIGNUP 1097:114, ACCOUNT-ORDERS 1097:115, the
four CARE tabs 1097:116…119, ACCOUNT-GIFT-REMINDERS 1097:120). B-1 (561:87)
was re-imported after its polish pass (购买流程 moved to the 已完成 lane).

**Routes vs in-page states (owner instruction 2026-07-27: none of the 小页面
frames get dedicated routes):**

| Frame                                             | Where it lives                                                                                                                                                                                                 |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEARCH-OPEN                                       | full-screen overlay, opened by the header search button on `/shop` + `/products/[slug]` (`SearchButton`/`SearchOverlay`, MenuDrawer pattern); Enter hands off to `/shop?q=…`, which really filters the catalog |
| SHOP-SORT dropdown                                | in-page overlay on `/shop`; sorting is REAL (New = catalog order, the two price rows sort by cents; Recommended aliases the default until merchandising rules exist)                                           |
| SHOP-FILTER drawer                                | in-page overlay on `/shop`, cosmetic (catalog has no collection/occasion/recipient/availability fields; "Show 36 Results" is the mock's fixed count)                                                           |
| PDP-REVIEW / PDP-COLOR / PDP-MEDIA / PDP-UNBOXING | overlays on `/products/[slug]`, opened from the rating row / "View All 120 Colors ›" / the hero photo / unboxing "View All ›"                                                                                  |
| ACCOUNT-INFO-SHOPPING-DASHBOARD                   | the signed-in `/account` view (real name, initials, latest order number/date/status/total; mock "Jessica" state in local mode and design reviews)                                                              |
| ACCOUNT-INFO-BUSINESS-DASHBOARD                   | `/account/business/dashboard`, an unlinked visual route (`/bag` precedent) until business auth exists                                                                                                          |
| ACCOUNT-ORDERS-LIST                               | `/account/orders` — real orders when signed in (number/date/status/total; neutral placeholder photo — the account feed has no line items), the mock's three cards otherwise; tabs filter for real              |
| ACCOUNT-GIFT-REMINDERS                            | `/account/reminders`, visual placeholder (no reminders backend); toggles/tabs flip visually                                                                                                                    |
| AUTH-SIGNUP-SHOPPING                              | `/account/signup`, unlinked visual placeholder — see the password conflict below                                                                                                                               |
| CARE-*                                            | `/care`, one route, four real tabs; `?tab=` deep-links (order confirmation's CONTACT SUPPORT lands on order-issues)                                                                                            |

**Wired beyond the routes:** tab bar renamed back to **Me** (the 07-27 frames
finally ship both states — outline 921:251, filled 939:174 — so the
Login/Me session swap is retired); PDP header heart → search art; dashboard
rows → `/account/orders`, `/account/reminders`, `/care`; C-2's help card →
`/care?tab=order-issues` (ORDER-DETAIL-CONTACT-SUPPORT, whole card clickable
per the spec's change proposal). ORDER-DETAIL-SHARE-TRACKING stays static —
it needs the secure-token share backend. TRACK ORDER buttons reach
`/orders/track`; carrying `orderId` waits for real tracking data (C-1 is
still the mock timeline).

**Things found while transcribing, for the design team:**

- The base shop frame (24:396) still says "120 APPAREL / Women × / All
  apparel ×" — template residue; both overlay frames patch the row to
  "120 GIFTS / Ruby Red / Gift Sets". The corrected labels are what ships.
- The account tab has now been Login → Me → Login → Me across four
  revisions. Me is live (with a real active state); please settle it.
- The new PDP frames keep nudging fills the live page predates (promo copy,
  ink shades). Palette reconciliation is already release-queue #6; nothing
  re-imported for color alone.
- AUTH-SIGNUP asks for password + confirm-password, but customer auth is
  decided as the emailed sign-in link (code fallback). The screen ships as an unlinked
  visual placeholder built from styled divs — a live password box that goes
  nowhere is the B-2 card-field hazard again. Reconcile the flow before it
  gets linked.
- The dashboards ship no sign-out control. A plain "Sign out" text row sits
  below the member card as a dev addition; style one properly.
- CARE's Hot-topics tab omits the "Support request status" row the other
  three tabs have (everything shifts up 52px). Shipped verbatim; flag if
  unintended.
- The CARE frames draw a five-tab glyph nav (Home / Shop / **Rose Deals** /
  Wholesale / Me) — a third bottom-nav language. `/care` draws it verbatim
  (shared bar opted out, C-1/C-2 precedent); Rose Deals has no route and
  stays inert.
- PDP-MEDIA's viewer uses the uncropped product source photo; the repo only
  has the cropped hero render, so the viewer letterboxes the crops. Please
  export the source imagery if the viewer should match exactly.
- Mock artifacts not implemented: SEARCH-OPEN's "9:41" status bar and
  PDP-MEDIA's iOS home indicator (C-3 precedent).
- The 12 colors in PDP-COLOR are not product variants; selection is visual
  and Confirm closes the sheet. Same for unboxing chips/tabs (one media set).
- B-1 polish notes: gift add-on labels moved to Goudy, the ADD buttons
  shrank, a dark "safe pay" band appeared in the summary, the FAQ rows'
  missing hairline is fixed at the source, and Rose Bouquet finally shows a
  bouquet — but Personal Card still shows a boxed rose set (half of the
  swap flagged on 07-26 remains).
- B-2 (checkout) also moved to 已完成 but its skin wraps the live cart, so a
  pixel drift check needs a focused pass — follow-up, not attempted here.

## 07-28 screen imports — developer findings

Ten frames landed on 2026-07-28 in a new `ACCOUNT-PRIVACY-SUPPORT-IPHONE-15-
PRO-MAX` section (x 12450…17780 — outside both swim-lane banners, treated as
delivered per the owner's hand-off). Nine are unique and all are implemented;
the tenth (`ACCOUNT-PERSONAL-INFO-DETAILS-ALT` 1232:114) is a **byte-identical
duplicate** of ACCOUNT-PERSONAL-INFO-DETAILS (structural diff of every node =
zero) and was imported once — please delete or differentiate the duplicate.

**Routes (dev-decided, owner-delegation precedent):**

| Frame                                  | Where it lives                                                                                                                                                                                           |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ACCOUNT-PERSONAL-INFO-DETAILS 1230:112 | `/account/personal-info` — visual placeholder ("Olivia Carter" is the mock's data; no profile-update backend, so fields are styled divs and Edit/Save stay inert)                                        |
| ACCOUNT-PREFERENCES-CONTROLS 1234:111  | `/account/preferences` — the four toggles flip visually; no notification/cookie-consent backend yet                                                                                                      |
| ACCOUNT-PRIVACY-SECURITY 1234:191      | `/account/security`, reached from the dashboard's "Account & Privacy" row (previously inert)                                                                                                             |
| ACCOUNT-PRIVACY-POLICY 1234:271        | `/account/privacy-policy` — collapsed accordion only (the design draws no expanded state); mock copy, not a reviewed legal policy                                                                        |
| ACCOUNT-LOGOUT-CONFIRM 1234:351        | `/account/logout` — the dashboard's dev "Sign out" row now lands here; **Log out really ends the Supabase session** and returns home, Cancel goes back. This closes the 07-27 "no sign-out control" flag |
| ACCOUNT-DELETE-CONFIRM 1234:431        | `/account/delete` — unlinked visual route (`/bag` precedent), see the deletion note below                                                                                                                |
| ACCOUNT-RETURNS-AFTER-SALES 1230:119   | `/account/returns` — the dashboard's "Returns & After-Sales" row re-pointed here (was `/care?tab=after-sales`); tabs flip visually, both cases are mock                                                  |
| CARE-SUPPORT-CHAT 1230:120             | `/care/chat` — wired from /care's "Chat with us" + "Contact support" shortcut and the returns "Contact Support" item; the whole conversation is the mock's                                               |
| ACCOUNT-KEEPSAKE-SHARE 1230:121        | `/account/keepsake` — unlinked visual route; a real card needs order data plus a share/image-render backend                                                                                              |

**Things found while transcribing, for the design team:**

- **Password + two-step verification conflict (AUTH-SIGNUP redux).** The
  security screen designs password change and 2FA, but customer auth is
  decided as the emailed sign-in link (code fallback) — there is no password.
  The fields ship as styled divs (the live-input hazard rule), the 2FA toggle
  flips visually, Save is inert. Reconcile the flow before any of it goes
  live.
- **Delete Account needs an owner decision.** Account deletion is
  destructive and touches orders, auth and files; nothing exists behind it,
  so the screen is a deliberately inert placeholder (type-DELETE field is a
  styled div, the red button does nothing) on an unlinked route.
- **A third bottom-nav geometry.** These frames draw the CARE five-tab glyph
  language at a new 72px band (22px icons, no active pill) — vs CARE's 32px
  band with a pill highlight, vs the owner-art bar on the main pages. Six
  settings screens carry it; returns/chat/keepsake draw **no** nav at all.
  Rose Deals still has no route and stays inert everywhere.
- **Mock-data oddities, shipped verbatim:** the security screen puts the
  session in "Tokyo, JP" on a "GoldRose App" (US-first store, no app);
  returns dates are 2025; the chat's order #GRB-**2026**0821 ships
  "May 18–23"; the keepsake was "Purchased on: Aug 21, 2026" (the future).
  Fine as visible mocks, worth fixing at source.
- **The composer ☺ can't be exported.** Figma renders it as a color emoji
  and SVG-exports a .notdef box (C-2 ✉ precedent) — served as a crop of the
  frame render.
- **First italics in the system.** The keepsake card sets "Classic
  Collection" and the message line in Playfair Display *italic*; the italic
  style was added to the font load.
- Small-text baselines in this batch round ±1px between Figma and Chrome
  (9–11px Noto Sans SC); eleven single-pixel nudges match the renders, noted
  inline in the components. Band diffs land at 0.7–1.8% overall (font-AA
  envelope), verified per-frame against scale-2 renders.

## 07-30 checkout reflow — developer findings

The B-2 checkout frame (now `1523:421 "/checkout · default · mobile"`,
430×1728 — was 561:88 at 430×2102) was re-delivered as **"B-2 / Redesigned
English / 430"**: the express-wallet module (Shop Pay / PayPal / Apple Pay
buttons) and the discount-code card were deleted, the order summary moved
between shipping and payment (its card is now white), the address grid became
recipient + state + country / full-width ZIP / street / city + phone, the item
card's text rows tightened, module 06 shrank to help + FAQ + pay bar on cream,
and the fulfillment assurances became three Playfair text nodes. Re-imported
2026-07-30; all e2e green.

**Dev decisions, for the design team to confirm:**

- **Discount entry kept as a dev band.** The reflow deleted the code-entry
  card, but the Order Summary still prices a Discount row and the admin
  feature (§8) is live — a customer with a code would have nowhere to type
  it. The old card's geometry ships as a dev-added band between modules 02
  and 04, in the design's own field language. Delete it only if discounts
  are being dropped as a feature.
- **The live PayPal button moved into the Pay-Securely CTA.** The express
  module that hosted the PayPal JS-SDK button no longer exists, so with
  PayPal configured the SDK's iframe button fills the CTA's 276×48 box; in
  mock mode the payment section's PayPal row is the mock entry.
- **ELDREVE again:** the frame's wordmark image reads ELDREVE — the GoldRose
  treatment was substituted at the same box (DQ-34 precedent).

**Mock-data / geometry oddities, shipped verbatim:**

- The summary's math is wrong: $189.00 − $28.35 + FREE ≠ $159.00 (placeholder
  data; the live page prices from the real cart anyway).
- The STATE (75px) and COUNTRY (116px) fields both carry 165px-wide value
  texts — the design clips "California ⌄" / "United States ⌄" at the field
  edge.
- The Shipping Method card (178px) clips the Next-Day row's bottom 6px
  (rows at 40/90/140 + 44 > 178).
- ZIP CODE is the one 33px-tall field in a grid of 48s.
- The MM / YY well dropped the CVV hint; the live checkout still collects
  CVV inside that well (the number is still required to charge a card).

## 07-29 screen imports — developer findings

The design team reorganized the whole file into a click-depth sitemap
(首页/shop/me 一级–五级 sections, plus `business`, a fixed-nav section and
`STORY-CRAFT-REDESIGN-IMAGE-LED`) and re-delivered every screen under new
node ids. The batch is a **file-wide visual unification** — the answer to
delivery-checklist item 9 and DQ-21: pink accent cards/pills/chips became
ink `#3B2F2F`, gold primary buttons became ink with cream text, cards went
white (or translucent white) with the sand inside-stroke, and the 07-28
five-tab glyph nav band was removed from every account/me screen. The C-flow
(order confirmation + tracking) keeps its green palette but was condensed
and lost its own tab bar. All ~40 frames were re-imported or drift-checked;
band diffs sit in the AA envelope on every screen (worst bands are live-data
or fixed-overlay screenshot artifacts, noted below).

**New pages this batch:**

| Frame                                                       | Where it lives                                                                                                                                                                                            |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| mepage-Account & Privacy 1523:3878                          | `/account/privacy` — the settings hub; the dashboard's "Account & Privacy" row lands here (was `/account/security`); Delete row stays inert (owner decision pending)                                      |
| Order Details 1541:362 (≡ my-orders view-details 1523:3347) | the redesigned C-2 serves `/checkout/success` AND the new `/account/orders/details` (orders list "VIEW DETAILS" target, static mock — the `/orders/track` precedent)                                      |
| track order 1541:254 (≡ 1523:775)                           | the redesigned C-1 at `/orders/track` (430×1519; vector route map served as one render)                                                                                                                   |
| track order_return 1542:628 (≡ loose 1523:1266)             | `/orders/track?return=1` — dim + bottom-sheet return-reason modal (absorbs the never-imported RETURNS-REASON-SELECT-OVERLAY 1339:112). **No element triggers it in the design** — unlinked state, DQ-36   |
| MESTORY 1573:106                                            | `/story` — wired from the menu drawer's OUR STORY row and A-11's READ OUR STORY CTA (live for the first time)                                                                                             |
| MECRAFT 1573:107                                            | `/craft` — wired from the menu OUR CRAFT row and A-4's EXPLORE OUR CRAFT card (was the `#craft` anchor). Imported from the live frame after it stabilized — it grew 509→657→1184→1368 px during the batch |

**Wiring changes:** order-details/track "CONTACT SUPPORT" cards → `/care/chat`
(the sitemap hangs the chat frame off every support touchpoint — five
byte-identical chat frames; supersedes `/care?tab=order-issues`); orders-list
VIEW DETAILS buttons → `/account/orders/details`; menu drawer grew
PERSONALIZE (→ `/#personalize`), FOR BUSINESS (→ `/business/partnerships`),
BLOG (inert — no blog), OUR CRAFT, OUR STORY rows; care shortcuts wired
where honest targets exist (after-sales → `/account/returns`, security →
`/account/security`); the dashboard's dev "Sign out" row retired — the
designed path is the hub's Session card → `/account/logout`.

**Things found while transcribing, for the design team:**

- **The header wordmark image reads "ELDREVE" on ~12 frames** (settings,
  orders, returns, signup, search, keepsake — which also carries an ELDREVE
  "E" monogram saved from WeChat). The same delivery's hero eyebrow still
  says GOLDROSE and the business frames kept real GoldRose art. Everything
  shipped with the owner's GoldRose treatment substituted at the image's box
  (deviating from the 07-26 "VELORIA verbatim" precedent — a masthead is not
  a mock string). DQ-34; DQ-22 now has a third brand string.
- **Layer names now carry element IDs** (`ACCOUNT-FIRST-NAME-INPUT`…) —
  checklist item 2 executed at last. Frame names did NOT adopt our frame-naming
  rule (a sixth naming convention instead); no prototype
  links anywhere (item 3 still unmet).
  **Update 2026-07-30 — resolved for frames:** all 48 routed frames were
  renamed in the file to `<exact route> · <state> · <viewport> · <original
  team name>` (rule v2.0: the viewport is the ownership boundary — dev sets
  everything before it, the team keeps everything after it verbatim).
  Not prefixed (no route exists yet): Business·Procurement (imported anyway →
  `/account/business`, `BusinessLogin.tsx`), BLOG-JOURNAL-PAGE (built 2026-07-31
  then reverted — never marked Ready-for-dev), RETURNS-REQUEST-SUBMITTED-PAGE.
  Sections keep the team's click-depth scheme (`shop一级`…) pending a design-team
  conversation.
- **The file was edited while we imported.** CRAFT grew during the batch;
  STORY's placeholder plates became real photos the same day (re-imported);
  the care frames briefly showed one identical FAQ list on all four tabs
  before the per-tab lists returned (kept per-tab); the unboxing tile crops
  moved between snapshots (the app carries the newest exports). A batch
  note per the delivery protocol would have prevented three re-passes.
- **Sibling inconsistencies, shipped as drawn unless noted:** STORY draws
  the owner-art nav, CRAFT draws a five-tab glyph-text nav with "Me" active
  (both get the shared owner-art bar — DQ-35); the shopping dashboard's
  member card moved +6px, the business one didn't; header back-arrows are
  pasted "返回" raster screenshots at per-frame jitter positions (no vector
  back icon exists in the delivery); the return modal's footer band is 382
  wide on a 430 sheet; care04's indicator sits 1px lower; per-frame brand
  bands drift 1–4px.
- **Design regressions kept out:** the shop base frame again says
  "120 Apparel" (the corrected GIFTS/Ruby Red/Gift Sets row still exists in
  the overlay frames and stays live); the shop/PDP headers drew a wishlist
  heart where the live search button sits (search is real functionality,
  wishlist was declared out of scope — search stays, DQ-37); back arrows on
  tab-root pages (bag ships one wired to history-back).
- **Screenshot-artifact notes for future drift passes:** fullPage shots
  capture the fixed nav/concierge at the first viewport, the sort/filter/
  overlay diffs are dominated by live-catalog data vs the mocks' repeated
  cards, and scale-1 frame renders pad asymmetrically (home: 36px left,
  **20px top**).
- B-2 checkout's deferred drift check closed: only the buy-button palette
  moved (green → ink, swapped); the skin's geometry is unchanged.

## 07-31 blog — built then reverted

BLOG-JOURNAL-PAGE (1593:115 / 1596:115, 430×1360) was imported to `/blog` on
2026-07-31 and **reverted the same day**, because its frame was never marked
Ready-for-dev in Figma. Nothing for it remains in the repo; the menu BLOG row is
inert again. If it is re-imported once the frame is marked ready, note the DQs
found the first time: the article card titles/subtitles clip to a 145px
"Content" frame (cut off mid-word); the article and featured cards have no
prototype exits (no blog-detail frame exists); and the ✉ / cart glyphs need the
frame-render-crop and shared-SVG workarounds (blog's own raster export was
`.notdef` / null).

## 07-31 delivery sync — developer findings

Processed the full file state as of 2026-07-31 13:26 (version 2382365737171469532).
Seven sections carry Ready-for-dev; everything under them was already imported,
so this pass was drift-alignment plus the file's first real prototype map
(59 interactions; was 11).

**Imported/changed:**

- **Reminders page (1523:3473):** the SMS toggle now defaults **off** and the
  Email toggle **on** — set by the owner's comment for AI agents on the frame
  ("the switch right here is 'on', and switch below is 'off'"); the off-state
  track is the design's cool grey `#E4E8ED` (component `toggle-knob-close`),
  not sand; the summary caption moved up 6px in the `bottom-add-bin` regroup.
  Item 1's Edit/Delete became two separate text nodes (a pipe still renders) —
  visually identical, shipped unchanged. Band diff 2.78% (AA envelope).
- **`/account/returns/request-submitted` (coming-soon scaffold):** the
  Ready-for-dev return sheet's Confirm Return (1523:1430) prototype-navigates
  to RETURNS-REQUEST-SUBMITTED-PAGE (1593:114), which is **not** Ready-for-dev
  — so the button now lands on a scaffold route (no real content) until that
  frame is marked and imported. This also closes DQ-36's "no entry trigger"
  gap in the other direction: the sheet now has an exit.

**Prototype wiring checked, deliberately not adopted (live behavior wins):**

- Cart icons and PDP "Add to Cart" → `/bag` (1523:3059): `/bag` still shows
  the mock's line items; the live basket is `/checkout`. Kept as-is (AI-008).
- Checkout "Pay Securely" CTA → keepsake share card (1523:1432): the CTA
  performs the real PayPal payment; a design-flow jump would fake success.
- Signup submit → login, Delete-account submit → login, Personal-info /
  Privacy Save → hub: all sit on deliberately inert screens (live-input
  hazard rule); navigating would fake a save/submit/deletion.
- Menu BLOG row → BLOG-JOURNAL-PAGE (1593:115): the frame is still not
  Ready-for-dev (owner had the 07-31 import reverted); the row stays inert.

**Pending from design (owner-acked or team-announced in comments):**

- **Homepage:** the team is replacing it with a simplified version ("首页重新
  换精简版") and told Charles to ignore the current frame — he ok'd. The 8673
  → 6582px frame shrink is that edit in progress; nothing re-imported.
- **AFTER-SALES · 13 EDITABLE SCREENS (2030:181):** a whole returns flow
  (`/account/returns/*`) plus the reminders date/timezone/unit pickers —
  answers to the modal's open dropdown threads. Not Ready-for-dev yet; the
  modal's date/number/unit fields stay static until it is.
- Signup: password fields being deleted at source ("删掉密码") — converging on
  the email-code decision. Dashboard: address management coming ("增加地址
  管理"). Keepsake: back button coming ("缺少返回键"). `/gift-guide`
  (1942:182) and the edited blog frame remain unmarked.

## 08-01 delivery sync — developer findings

Re-polled the file (version 2382387929276592531, edited 2026-07-31 14:22 —
56 minutes after the previous sync's snapshot).

- **`me三级` lost its Ready-for-dev mark.** The team pulled the reminders
  cluster back into work: the edit modal grew 548→614px and the date/timezone
  picker frames moved inside the section as `DATE-CONTROL-GROUP` variants.
  Nothing re-imported — an un-marked section is out of scope until re-marked.
- **Timezone → Pacific only (comment-delegated change).** On the reminders
  page's timezone thread the team asked Charles ("夫哥") to use only Pacific
  Time; he accepted ("好的") and asked which UTC — no concrete answer yet
  ("问了一下gpt"). The built page now shows `PST (UTC−8)`, following the
  frame's own standard-offset convention (EST=−5 ⇒ PST=−8); the frame itself
  still says EST, so this row intentionally diverges until design updates it
  (AI-009).
- **The simplified homepage is being built:** a second `/ · default · mobile ·
  homepage` frame (2024:378, 430×6087) now sits in 首页一级 beside the old
  6582px one. Still unmarked; still ignored per the owner-acked instruction.
- **Login check mark settled (afternoon comments, file unchanged):** the
  thread on the loginpage's "Find Existing Order" □ glyph ended with "换个
  颜色，这个就行了" and Charles's "Ok" — so the built band now draws the
  system-default ✓ inside the □, recolored to the band's ink. The frame still
  shows a bare □. The timezone thread also closed with "Ok" and no concrete
  UTC — `PST (UTC−8)` stands (AI-009).
- **New team directive, no action:** "删掉Custom Archive这个框的内容" on the
  signed-in dashboard (1523:2536) — a design change to arrive as an updated
  frame; nothing removed from the built dashboard yet.

## Reminders edit modal — developer findings (owner-directed via comments)

The gift-reminder edit sheet (REMINDERS-EDIT-OPEN-MODAL-PAGE 1599:245,
430×548) is now imported → a bottom sheet on `/account/reminders`
(`components/screens/ReminderEditModal.tsx`), opened by the list's "Add
reminder" button and each card's "Edit" control (both were inert placeholders).
Band diff 1.6% (font-AA envelope); e2e covers open + Cancel/Escape close.

**Why now — the owner resolved the interaction in Figma comments.** The frame
had zero prototype wiring, which earlier read as an unresolved gap. The Figma
comment thread on 1599:245 settles it: Charles asked "add navigation", the
design team replied it is an **info-storage modal with no jump page — Cancel =
the entered info is not saved, return to default values**, and Charles replied
"ok". So the sheet is bottom-anchored with a dim scrim, and ×/Cancel/dim-area
all discard and close (Save just closes; nothing persists without a backend).

**Still open in the same threads (shipped as static, pixel-exact):** whether
the lead-time unit is a dropdown, whether the number is stepper vs typed, and
the date-picker/timezone click states — the design team is "still considering",
so the number/unit/date fields render as static controls, not live inputs.

**Glyphs:** ▣ (date) ▤ (SMS) and the ⌃⌄/⌄ chevrons are Figma SVG text exports;
the ✉ SVG-exports as a `.notdef` box (C-2 precedent), so it reuses the
reminders page's own frame-render crop (`1523-3523.png`) with "Email" as text.
