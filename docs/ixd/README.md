# Interaction Specifications · IxD Specs

Interaction drafts from the design team covering the mechanism layer:
clickability, triggers, navigation, and states. This directory is a read-only
mirror for developers. Preserve the wording verbatim; do not edit the body
manually. Mark problems found in the source inline with `⚠️ Developer note`.

**Source:** [homepage.md](homepage.md) (English working copy) and
[shop.md](shop.md). The design team's editable original is
`temp/主页_shop页机制.numbers` (received 2026-07-25); when it updates,
re-import into this directory. The verbatim Chinese export of the homepage
sheet is archived at `temp/homepage.zh.md` — on wording disputes, the Chinese
source wins. A second source, `temp/frontend-function-draft.numbers`
(received 2026-07-27), covers the order-detail page: verbatim Chinese export
at `temp/frontend-function-draft.zh.md`, English working copy at
[order-detail.md](order-detail.md); the same rules apply.

## Files

- [delivery-protocol.md](delivery-protocol.md) — **how work is handed over**:
  the three hand-overs (design team → dev → bosses), the per-frame delivery
  checklist (交付清单), what we do on receipt, and what to do when something is
  missing. Start here if you are asking "how does this get delivered?"
- [homepage.md](homepage.md) — 37 homepage entries (H-01…H-37), English
  translation of the archived Chinese export
- [shop.md](shop.md) — 15 Shop page entries (N-01…N-15), still verbatim
  Chinese (translation pending)
- [order-detail.md](order-detail.md) — 3 order-detail entries
  (ORDER-DETAIL-…), English translation of
  `temp/frontend-function-draft.zh.md`; IDs follow the Figma naming guide;
  screenshots pending from the design team
- `assets/` — 52 annotated screenshots (red box = the element for that entry);
  filename = entry ID; JPEG-compressed from the originals
- [figma-naming-guide.md](figma-naming-guide.md) — the owner's UI naming guide,
  transcribed **verbatim** from `temp/Figma_UI_Naming_Guide_GoldRose.xlsx`:
  the PAGE / SECTION / FUNCTION / TYPE vocabulary plus 13 worked examples
- [element-names.md](element-names.md) — the naming convention we actually
  apply: grammar, 6 rules, and the vocabulary with our additions and removals.
  Every visible element carries its name in `data-el`; guarded by
  `tests/unit/element-names.test.ts`
- [bottom-nav-buttons.md](bottom-nav-buttons.md), [login-import.md](login-import.md)
  — per-import notes for the nav art and the 登录界面 frame

## How to reference an entry

Entry IDs are stable. Write `implements H-09` in commits, PRs, and code
comments; search for `### H-09` within the documentation. Newer sources use
full naming-guide IDs (e.g. `implements ORDER-DETAIL-SHARE-TRACKING`);
reference them the same way.

## Status legend (target-page design progress)

| Label | Meaning |
|---|---|
| Incomplete / Not done | The target-page design is not ready |
| To be confirmed | Pending a decision from the design team |
| Future iteration (not currently planned) | Out of scope for this release, such as personalization |
| No separate page needed / Not currently planned | Inline interaction with no target page / deferred |
| — | Not marked in the source table, usually because the page already exists |

Message from me to ai agents: leave placeholder in unsure things

## Items to confirm with the design team

> **Open questions now live in one place:**
> [`docs/TODO/design-team-questions.md`](../TODO/design-team-questions.md).
> The findings below stay here as the record of what was discovered during
> each import; anything still unanswered has been carried over into that doc
> with a `DQ-nn` id. Add new questions there, not here.

> **Unresolved navigation targets** — every element whose destination page is
> unknown, unbuilt, or "to be confirmed" is collected as 13 grouped questions in
> [`docs/TODO/2026-07-28-design-team-navigation-questions.md`](../TODO/2026-07-28-design-team-navigation-questions.md).
> The list below is the older, narrower set of source-quality questions.

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

| Frame | Where it lives |
|---|---|
| SEARCH-OPEN | full-screen overlay, opened by the header search button on `/shop` + `/products/[slug]` (`SearchButton`/`SearchOverlay`, MenuDrawer pattern); Enter hands off to `/shop?q=…`, which really filters the catalog |
| SHOP-SORT dropdown | in-page overlay on `/shop`; sorting is REAL (New = catalog order, the two price rows sort by cents; Recommended aliases the default until merchandising rules exist) |
| SHOP-FILTER drawer | in-page overlay on `/shop`, cosmetic (catalog has no collection/occasion/recipient/availability fields; "Show 36 Results" is the mock's fixed count) |
| PDP-REVIEW / PDP-COLOR / PDP-MEDIA / PDP-UNBOXING | overlays on `/products/[slug]`, opened from the rating row / "View All 120 Colors ›" / the hero photo / unboxing "View All ›" |
| ACCOUNT-INFO-SHOPPING-DASHBOARD | the signed-in `/account` view (real name, initials, latest order number/date/status/total; mock "Jessica" state in local mode and design reviews) |
| ACCOUNT-INFO-BUSINESS-DASHBOARD | `/account/business/dashboard`, an unlinked visual route (`/bag` precedent) until business auth exists |
| ACCOUNT-ORDERS-LIST | `/account/orders` — real orders when signed in (number/date/status/total; neutral placeholder photo — the account feed has no line items), the mock's three cards otherwise; tabs filter for real |
| ACCOUNT-GIFT-REMINDERS | `/account/reminders`, visual placeholder (no reminders backend); toggles/tabs flip visually |
| AUTH-SIGNUP-SHOPPING | `/account/signup`, unlinked visual placeholder — see the password conflict below |
| CARE-* | `/care`, one route, four real tabs; `?tab=` deep-links (order confirmation's CONTACT SUPPORT lands on order-issues) |

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
