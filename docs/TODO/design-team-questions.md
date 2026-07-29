# TODO: questions for the front-end design team

|                     |                                                                       |
| ------------------- | --------------------------------------------------------------------- |
| **What this is**    | The single place where every open question for the design team is collected, so Charles can ask them in one batch. |
| **Standing doc**    | Not a per-task hand-off — it is never deleted, only emptied as answers land. |
| **Opened**          | 2026-07-28                                                            |
| **Last updated**    | 2026-07-29 (Claude Code background job — the 07-29 redesign import)   |
| **Verified against**| `main` @ `ded0d46` — every "where it is now" line below was read in the code, not assumed. |
| **Status**          | 🔴 40 open · 🟡 0 answered, not applied · 🟢 0 applied                 |

## How to use this doc

**For Charles.** Each question has a **Ask** line written to be copy-pasted
straight to the design team. Answers go under **Answer** with a date. You can
answer in any format — "DQ-04: B" is enough.

**For AI agents.** If you cannot work out from the Figma frames *where a
button goes*, *what page a frame belongs to*, or *what a missing state should
look like* — **do not guess and do not silently invent one.** Add a numbered
entry here, ship the safest placeholder, and record the placeholder in the
entry. This follows the design team's own instruction in
[`docs/ixd/README.md`](../ixd/README.md): *"leave placeholder in unsure
things."*

Rules:

- IDs are **stable and never reused**: `DQ-01`, `DQ-02`, … Append new ones at
  the end of their section with the next free number.
- Every question states **what we shipped meanwhile** and **a recommendation**
  — never a bare open question.
- When an answer is applied in code, mark the entry 🟢 and move its one-line
  record to [§7 Answer log](#7-answer-log), then delete the entry body.
- Legend: 🔴 open · 🟡 answered, not yet applied · 🟢 applied (move to log)

---

## 1. Navigation — buttons with no destination

These elements are imported pixel-exact and **visibly clickable-looking, but
inert**, because the page they should open does not exist in the Figma file.
Grouped by the missing destination, since one answer usually unlocks several
buttons.

The core question for every group is the same, so it is written once:

> **Ask (applies to DQ-01…DQ-10):** For each group below — does this page
> exist in the Figma file already? If yes, please send the frame name/ID and
> tell us which button opens it. If no, should we (a) leave the button inert,
> (b) point it at the nearest existing page, or (c) is the page planned for a
> later round?

### 🔴 DQ-01 — Personalization flow

| | |
|---|---|
| **Buttons waiting on it** | H-08 hero "CREATE A PERSONALIZED ROSE GIFT" (`components/home/A1.tsx:139`), H-28 four step rows (`A8.tsx:149`), H-29 "CONTINUE PERSONALIZING" (`A8.tsx:94`), H-30 "SAVE AND CONTINUE LATER" (`A8.tsx:118`), H-37 footer CTA (`A11.tsx:319`), menu drawer "PERSONALIZE" (`MenuDrawer.tsx:58`), the "Personalize" tab in the C-1 tracking and C-2 confirmation nav bars |
| **Shipped meanwhile** | All inert. H-16 "PERSONALIZE YOUR ROSE" is the exception — it scrolls to the `#personalize` block further down the homepage. |
| **Recommendation** | This is the single biggest hole: 8+ buttons across 6 screens point at a flow that has no frames. It reads as the most-promoted feature on the site and currently does nothing. Worth designing before launch, or removing the CTAs. |
| **Answer** | _(pending)_ |

### 🔴 DQ-02 — Craft / workshop page

| | |
|---|---|
| **Buttons waiting on it** | H-31 "EXPLORE OUR CRAFT" (`A9.tsx:219`), H-32 "SEE HOW WE WORK" (`A9.tsx:392`), menu drawer "OUR CRAFT" (`MenuDrawer.tsx:83`) |
| **Shipped meanwhile** | Inert. H-17's card scrolls to the `#craft` homepage block instead. |
| **Recommendation** | If the homepage craft block is the whole story, we keep the anchor and delete the extra CTAs. If a real page is coming, we need the frame. |
| **Answer** | _(pending)_ |

### 🔴 DQ-03 — Blog / journal

| | |
|---|---|
| **Buttons waiting on it** | The two "Just Because" story cards H-20 (`A5.tsx:318`) and H-23 (`A6.tsx:313`), menu drawer "BLOG" (`MenuDrawer.tsx:74`) |
| **Shipped meanwhile** | ⚠️ The two story cards currently open **`/shop`** — an honest destination but almost certainly not what the card promises. |
| **Recommendation** | Please confirm whether a blog/article page is planned. If not, these cards should become non-clickable rather than sending a reader to the catalogue. |
| **Answer** | _(pending)_ |

### 🔴 DQ-04 — FAQ page

| | |
|---|---|
| **Buttons waiting on it** | H-35's four FAQ rows and "VIEW ALL FAQs" (`A11.tsx:163` and `:196`) |
| **Shipped meanwhile** | Inert (the rows do not expand either — see DQ-19). |
| **Recommendation** | `/care` already ships four real FAQ tabs. Simplest answer: point "VIEW ALL FAQs" at `/care`. Confirm that is right rather than a separate FAQ page. |
| **Answer** | _(pending)_ |

### 🔴 DQ-05 — Customer stories page

| | |
|---|---|
| **Buttons waiting on it** | H-24 "Read Customer Stories" (`A6.tsx:395`) |
| **Shipped meanwhile** | Inert. |
| **Recommendation** | Low priority; the homepage already shows three reviews. Inert is acceptable for launch if no page is planned. |
| **Answer** | _(pending)_ |

### 🔴 DQ-06 — Brand story page

| | |
|---|---|
| **Buttons waiting on it** | H-34 "READ OUR STORY" (`A11.tsx:97`), menu drawer "OUR STORY" (`MenuDrawer.tsx:89`) |
| **Shipped meanwhile** | Inert. |
| **Recommendation** | Same as DQ-05 — needs either a frame or a decision to drop the CTA. |
| **Answer** | _(pending)_ |

### 🔴 DQ-07 — MORI gift finder

| | |
|---|---|
| **Buttons waiting on it** | H-15 "FIND A GIFT" (`A4.tsx:187`), H-26 "See MORI's Picks" (`A7.tsx:159`) |
| **Shipped meanwhile** | ⚠️ H-15 opens **`/shop`**; H-26 is inert. The MORI criteria chips (H-25) are static decoration. |
| **Recommendation** | The homepage sells MORI as a gift-matching assistant, but there is no matching screen. Either design the finder or soften the copy so `/shop` is an honest destination. |
| **Answer** | _(pending)_ |

### 🔴 DQ-08 — Wishlist, Custom Archive, Saved Addresses

| | |
|---|---|
| **Buttons waiting on it** | The account dashboard tiles (`components/screens/DashboardScreen.tsx:21`) |
| **Shipped meanwhile** | Inert; the tiles render but nothing opens. |
| **Recommendation** | These are drawn on the signed-in dashboard, so a customer will tap them. Please confirm whether frames exist or whether they should be hidden for launch. |
| **Answer** | _(pending)_ |

### 🔴 DQ-09 — Order detail page

| | |
|---|---|
| **Buttons waiting on it** | "VIEW DETAILS" on every order row (`components/screens/OrdersListScreen.tsx:212`) |
| **Shipped meanwhile** | Inert placeholder. |
| **Recommendation** | We already have the written spec ([`docs/ixd/order-detail.md`](../ixd/order-detail.md)) but its **screenshots are still pending from the design team**. This is a customer-facing dead end after purchase — please prioritise the frame. |
| **Answer** | _(pending)_ |

### 🔴 DQ-10 — Customer care service shortcuts

| | |
|---|---|
| **Buttons waiting on it** | 7 of the 8 shortcut tiles on `/care` (`components/screens/CareScreen.tsx:95`) |
| **Shipped meanwhile** | Only "Track logistics" is wired (→ `/orders/track`); the other seven are inert. |
| **Recommendation** | Please give the destination for each of the seven, or confirm they open a support form we have not seen yet. |
| **Answer** | _(pending)_ |

### 🔴 DQ-11 — Is `/bag` (B-1) a real step, or is checkout the basket?

| | |
|---|---|
| **The conflict** | B-1 is a full bag/cart screen and it is built (`/bag`), but **nothing links to it** — the header cart icon goes straight to `/checkout` (`components/chrome.tsx:193`), because B-2 checkout is where the live cart actually lives. B-1's line items are still the mock's own strings. |
| **Ask** | Should the cart icon open B-1 (bag) first, with a "checkout" button leading to B-2? Or is B-2 the basket and B-1 is dropped? |
| **Recommendation** | Wire the cart icon to B-1 and make B-1 the real cart — that is the conventional pattern and B-1 has features B-2 lacks (gift add-ons, FAQ). But it is real work: B-1 must be connected to live cart data first. Until then the current shortcut is the honest option. |
| **Answer** | _(pending)_ |

### 🔴 DQ-12 — How does a customer reach the **business** dashboard?

| | |
|---|---|
| **The gap** | `ACCOUNT-INFO-BUSINESS-DASHBOARD` is built at `/account/business/dashboard`, but **no link anywhere reaches it** — there is no sign-in path that produces a business session, and no switch between the shopping and business dashboards. |
| **Ask** | What is the entry path to the business account? Is there a separate business login frame, a toggle on the shopping dashboard, or is it reached only from the partnership/wholesale pages after approval? |
| **Recommendation** | This is the clearest "we cannot navigate to your page" case in the file. We need the entry-point frame before it can be linked; today it is a hidden URL. |
| **Answer** | _(pending)_ |

### 🔴 DQ-13 — Bottom-nav "Wholesale" tab and "Rose Deals" tab

| | |
|---|---|
| **The gap** | The shared bottom bar's **Wholesale** tab has no destination (`components/chrome.tsx:250` — no `href`), even though `/business/wholesale` now exists. Separately, the `/care` frames draw a **five**-tab bar including **"Rose Deals"**, which has no page at all. |
| **Ask** | (a) Should the Wholesale tab open the B-4 wholesale page? (b) What is "Rose Deals" and does it have a frame? |
| **Recommendation** | (a) Yes — we can wire this immediately once confirmed. (b) Rose Deals looks like a promotions page that was never designed; if it is not planned, it should come out of the CARE bar. See also DQ-21 (the three different bottom bars). |
| **Answer** | _(pending)_ |

---

## 2. Missing states — the frame shows one state, the real page needs more

A live page has states a static mock does not: a disabled button, an empty
cart, an error message, a "saving…" spinner. Where the design has none, we
invented one. **Every item here is a place where the site currently shows
something the design team never drew.**

### 🔴 DQ-14 — B-2 pay button has no **disabled** state (blocking)

| | |
|---|---|
| **Where** | B-2 checkout, pay CTA `756:132` |
| **Why it matters now** | We are about to make payment impossible until contact details and delivery address are filled in correctly. That needs a visibly "not yet available" button, and the frame only has the active gold state. |
| **Ask** | Please provide a disabled/inactive state for the pay button, plus how the "please complete the fields above" hint should look. |
| **Shipped meanwhile** | Nothing yet — this is the one question blocking current work. |
| **Recommendation** | Dim the button to ~40% opacity with the same geometry, and show a small helper line beneath it. We will use that if we do not hear back, and swap it for the real state later. |
| **Answer** | _(pending)_ |

### 🔴 DQ-15 — No error state for form fields

| | |
|---|---|
| **Where** | B-2 contact + delivery fields (`747:106`), payment card wells (`755:128`) |
| **Shipped meanwhile** | We invented one: 9px red `#B82924` text under the field. The card wells are only 36px tall with no room underneath, so **all four card errors are merged into one line** at the foot of the card. |
| **Recommendation** | Field-level errors need ~14px of reserved space under each field, which the current card wells do not have. Either add space or confirm the merged single error line is acceptable. |
| **Answer** | _(pending)_ |

### 🔴 DQ-16 — No empty-cart state

| | |
|---|---|
| **Where** | B-1 bag and B-2 checkout |
| **Shipped meanwhile** | We invented a plain card reading "Your cart is empty." with a "Shop the edit" button (`app/checkout/CheckoutClient.tsx:533`). It uses the older homepage palette and does not match either B frame. |
| **Recommendation** | A customer will hit this (arriving at checkout with nothing in the bag), so it deserves a real frame. |
| **Answer** | _(pending)_ |

### 🔴 DQ-17 — No loading / in-progress states

| | |
|---|---|
| **Where** | Checkout pay button, discount "APPLY" button |
| **Shipped meanwhile** | Text swaps only — "Processing…", "Placing order…", and the APPLY button becomes "…" while checking a code. No spinner exists in the design. |
| **Recommendation** | Text swap is acceptable for launch. Flag only if you want a spinner. |
| **Answer** | _(pending)_ |

### 🔴 DQ-18 — Dashboards have no sign-out control

| | |
|---|---|
| **Where** | Both account dashboard frames |
| **Shipped meanwhile** | We added a plain text "Sign out" row below the member card as a developer addition — it is unstyled by the design. |
| **Recommendation** | Every signed-in page needs a way out; please style one. |
| **Answer** | _(pending)_ |

### 🔴 DQ-19 — FAQ rows: do they expand?

| | |
|---|---|
| **Where** | H-35 homepage FAQ rows, `/care` FAQ rows |
| **Shipped meanwhile** | Static — no expanded/open state exists in any frame, so tapping a question does nothing. |
| **Ask** | Should FAQ rows expand in place (accordion)? If so we need the open state. |
| **Recommendation** | Accordion is the norm and cheap to build; we just need the open-state design. |
| **Answer** | _(pending)_ |

### 🔴 DQ-20 — Which bottom tab is highlighted on `/bag` and `/checkout`?

| | |
|---|---|
| **The gap** | `/bag` asks for a tab named "Bag" that does not exist in the bar (`app/bag/page.tsx:28` vs `components/chrome.tsx:249`), so **no tab lights up**. C-2 (order confirmed) marks **Help** as the active tab, which is unusual on a confirmation screen. C-1's own nav has the **Home** tab explicitly set to no destination even though the homepage exists (`TrackOrderScreen.tsx:85`) — this looks like an oversight. |
| **Ask** | Which tab should be active on bag, checkout, confirmation and tracking? And should C-1's Home tab link to the homepage? |
| **Recommendation** | Highlight nothing on bag/checkout (they are outside the four sections), and link C-1's Home tab to `/`. |
| **Answer** | _(pending)_ |

---

## 3. Conflicts — two parts of the design disagree

### 🔴 DQ-21 — Two visual languages, and three different bottom bars

| | |
|---|---|
| **The conflict** | B-1/B-2 use the palette the live homepage and shop use (`#FFF6EC` / `#3B2F2F` / `#D4AF37`, with the owner's logo art). C-1/C-2/C-3 use a newer one (`#FFFBF6` / `#09442E` / `#D18005`) and set the brand as **text**. Separately there are three bottom bars: the shared four-tab bar, the C-1/C-2 own-glyph bars, and the CARE five-tab bar. |
| **Effect today** | Everything shipped verbatim, so **the site changes character as you move between pages**, and pages with their own bar opt out of the shared one to avoid two bars stacking. |
| **Ask** | Which palette and which bottom bar is the target? |
| **Recommendation** | Pick the newer C-language or the older B-language and reconcile everything to it in one pass. This is already queued as release item #6, but it needs the design decision first. |
| **Answer** | _(pending)_ |

### 🔴 DQ-22 — The brand name reads "VELORIA" on C-1 and C-2

| | |
|---|---|
| **The conflict** | C-1 (tracking) and C-2 (confirmation) show **VELORIA** as the brand; C-3 shows GoldRose. Mock order numbers also use a `#VL…` prefix. |
| **Ask** | Confirm VELORIA is leftover template text and everything should read GoldRose. |
| **Recommendation** | Almost certainly template residue — but it is on two customer-facing screens including the post-purchase one, so we want it confirmed rather than assumed. |
| **Answer** | _(pending)_ |

### 🔴 DQ-23 — The account tab name has changed four times

| | |
|---|---|
| **The conflict** | Login → Me → Login → Me across four revisions. |
| **Shipped meanwhile** | **Me** is live, with a real active state. |
| **Ask** | Please settle it. |
| **Answer** | _(pending)_ |

### 🔴 DQ-24 — Sign-up screen asks for a password, but the site has no passwords

| | |
|---|---|
| **The conflict** | `AUTH-SIGNUP` draws password + confirm-password fields. Customer sign-in is decided as an **emailed sign-in link** (with a code fallback) — there is no password anywhere in the system. |
| **Shipped meanwhile** | The screen is built from styled non-functional boxes at `/account/signup` and **nothing links to it**. A live password box that goes nowhere is a security hazard, so it stays unlinked. |
| **Ask** | Please redraw the sign-up screen for the email-link flow (one email field, then a "check your inbox" state). |
| **Recommendation** | Blocking before any sign-up entry point can be linked. |
| **Answer** | _(pending)_ |

### 🔴 DQ-25 — CARE "Hot topics" tab is missing a row the other three tabs have

| | |
|---|---|
| **The conflict** | The Hot-topics tab omits the "Support request status" row, so everything below shifts up 52px. |
| **Shipped meanwhile** | Verbatim — we reproduced the difference exactly. |
| **Ask** | Intentional, or an oversight? |
| **Answer** | _(pending)_ |

### 🔴 DQ-26 — B-1 gift add-on images are still half-swapped

| | |
|---|---|
| **The conflict** | "Rose Bouquet" and "Personal Card" had swapped images. The 07-27 polish pass fixed Rose Bouquet, but **"Personal Card" still shows a boxed rose set**. |
| **Ask** | Please finish the swap in the source file. |
| **Answer** | _(pending)_ |

### 🔴 DQ-27 — B-1 and B-2 disagree on the FAQ divider line

| | |
|---|---|
| **The conflict** | The same component has a hairline colour with `strokeWeight: 0` in B-1 (no divider renders) and `bottom: 1` in B-2. One of the two is wrong. Reported 07-26; **fixed in B-1 at the source on 07-27**, so this may already be resolved. |
| **Ask** | Confirm B-2 matches. |
| **Answer** | _(pending)_ |

### 🔴 DQ-28 — Shipping method picker and card/Apple Pay/Shop Pay rows cannot work as drawn

| | |
|---|---|
| **The conflict** | B-2 offers Standard / Express / Next-Day, but shipping is priced by **destination country**, not by method — there are no per-method rates to show. The card, Shop Pay and Apple Pay rows are not live payment providers; PayPal is. |
| **Shipped meanwhile** | On the owner's decision the picker is **cosmetic** (it moves the selected ring and nothing else, and shows no prices); card fields appear only in developer test mode. |
| **Ask** | Either give us three real shipping rates, or confirm the picker should be removed. Same for the alternative payment rows. |
| **Recommendation** | Showing a customer a "Next-Day" option that does not change delivery or price is a complaint risk once real orders start. |
| **Answer** | _(pending)_ |

---

### 🔴 DQ-34 — The masthead reads "ELDREVE" on ~12 of the 07-29 frames

| | |
|---|---|
| **The conflict** | The 07-29 delivery stamps an **ELDREVE** wordmark image (one shared asset, plus an "E" monogram on the keepsake card that is literally a WeChat-saved file) into the headers of the settings, orders, returns, signup, search and keepsake frames — while the same delivery's homepage hero eyebrow still says **GOLDROSE**, the business frames carry real GoldRose art, and C-1/C-2 previously said VELORIA (DQ-22). That is a third brand string on customer-facing screens. |
| **What we shipped** | The owner's GoldRose wordmark/art substituted at every ELDREVE box (`GoldRoseWordmark` in account-chrome). Nothing on the live site says ELDREVE. |
| **Ask** | Is ELDREVE template residue, or is a brand rename being explored? If it is residue, please replace the shared image with the GoldRose wordmark so future imports stop carrying it. |
| **Recommendation** | Treat as residue; also worth telling the bosses a rename would touch every asset, domain and listing, so it should not arrive via a Figma image swap. |
| **Answer** | _(pending)_ |

### 🔴 DQ-35 — STORY and CRAFT draw two different bottom navs

| | |
|---|---|
| **The conflict** | MESTORY 1573:106 draws the owner-art 4-tab bar; its sibling MECRAFT 1573:107 draws the retired five-tab glyph-text bar with **Me active** (it is not a Me page). |
| **What we shipped** | The shared owner-art bar on both `/story` and `/craft`. |
| **Ask** | Confirm the owner-art bar is the target for both pages. |
| **Answer** | _(pending)_ |

### 🔴 DQ-36 — Nothing opens the return-reason sheet

| | |
|---|---|
| **The question** | "…track order_return" (1542:628) is the track page under a dim overlay with a return-reason bottom sheet — but no element on the track frame (1541:254) triggers it, and the file has no prototype links. |
| **What we shipped** | The sheet lives at `/orders/track?return=1`, fully built (visual radios, inert Confirm — no returns backend) but unlinked. |
| **Ask** | Which element starts a return — a button on the track page, a row on Returns & After-Sales, or the order-details page? |
| **Recommendation** | A "Start a return" action on `/account/returns`, which is where a customer already looks for it. |
| **Answer** | _(pending)_ |

### 🔴 DQ-37 — The 07-29 headers drop the search button for a wishlist heart

| | |
|---|---|
| **The conflict** | The shop/PDP/home headers now draw 菜单 + 返回 + wordmark + **收藏 (heart)** + cart. The live header's third slot is the **search button**, which really works (overlay → `/shop?q=`), and the team's own 07-27 answer declared wishlist out of scope. The A-1 header render also shows a magnifier at that slot, so the file disagrees with itself. Separately, 返回 back arrows now appear on tab-root pages (shop, bag). |
| **What we shipped** | The new mascot-style icon art, with search kept in the third slot; bag's back arrow ships wired to history-back. |
| **Ask** | Confirm search stays (and whether the heart was intentional), and whether tab-root pages should really carry a back arrow. |
| **Answer** | _(pending)_ |

### 🔴 DQ-38 — A password-less Security screen sits outside the delivered lane

| | |
|---|---|
| **The question** | Loose frame 1526:111 duplicates the Security screen minus the password-change fields — exactly the fix for the password/email-link conflict we flagged 07-28 — but it sits outside the 已完成 lane, so we treated it as a draft. |
| **What we shipped** | `/account/security` still follows the in-lane frame 1523:1078 (password fields as inert styled divs). |
| **Ask** | Is 1526:111 the intended replacement? If yes we swap it in next pass. |
| **Recommendation** | Yes — it resolves the conflict; move it into the lane and we will import it. |
| **Answer** | _(pending)_ |

### 🔴 DQ-39 — Duplicates and scratch frames to clean up in the file

| | |
|---|---|
| **The question** | The 07-29 file carries: 1523:1470 ≡ 1542:1551 (byte-identical chat frames — five chat copies total across the flows), 1542:628 ≡ 1523:1266 (return, 932 vs 908 crop), 1541:362 ≡ 1523:3347 and 1541:254 ≡ 1523:775 (checkout-flow vs me-flow twins), and the 07-28 ALT personal-info duplicate is still standing. |
| **What we shipped** | Each design imported once; twins serve both routes. |
| **Ask** | Are the flow-twins intentional sitemap notation (fine — say so), and can the scratch copies (1523:1266, 1526:111 if superseded, the 07-28 ALT) be deleted? |
| **Answer** | _(pending)_ |

### 🔴 DQ-40 — The file was edited while we imported (batch note, please)

| | |
|---|---|
| **The question** | During the 07-29 import: CRAFT grew 509→1368px, STORY's placeholder plates became real photos, the care FAQ lists flip-flopped, and the unboxing tile crops moved — all mid-batch. Each cost a re-pass. |
| **What we shipped** | The newest state of each frame (CRAFT imported after it stabilized). |
| **Ask** | Per the delivery protocol §2: a two-line batch note (date · frames · what changed · what is knowingly unfinished) with each delivery, and no edits to delivered frames until we confirm import. |
| **Answer** | _(pending)_ |

## 4. Assets and exports we need from the design team

### 🔴 DQ-29 — Mascot art needs real transparent PNGs

The four AI-generated illustrations (the MORI cat and the pink ribbon strip)
are **opaque bitmaps with a transparency checkerboard baked into the pixels**.
The Figma file hides it with a `DARKEN` blend mode and our import reproduces
that, so the pages match — but it is a workaround, not a cutout: the art only
works on light cream backgrounds, a faint checkerboard is still visible, and
those four boxes had to be excluded from our automated pixel checks.
**Ask:** please re-export with a real alpha channel and drop the blend mode.

### 🔴 DQ-30 — PDP media viewer needs the uncropped source photos

The full-screen media viewer uses the uncropped product source photo, but we
only have the cropped hero render, so the viewer letterboxes.
**Ask:** please export the source imagery.

### 🔴 DQ-31 — Two glyphs fail to export

C-2's `✉` and B-1's `Pay` mark export as an empty `.notdef` square / lose the
Apple glyph. We serve both as image crops of the Figma render instead.
**Ask:** supply them as SVG or confirm the crops are fine.

### 🔴 DQ-32 — GoldRose-branded replacement for the shop hero photo

The `/shop` hero banner uses a dark-green gift box carrying another brand's
crest and a partially visible "VILOW… ROSE" wordmark. Approved to stay for
development, but it needs a GoldRose photo before launch (ties to the real
product-content work). **Ask:** please supply a replacement at the same
dimensions — the banner is pixel-checked, so a same-size swap avoids a
re-crop.

### 🔴 DQ-33 — Desktop layouts

All prototypes use the iPhone 15 Pro Max frame. The owner has confirmed
desktop layouts will come **in a future round**, and that the current pages
must work on all phone sizes. **Ask:** no action now — logged so it is not
forgotten when desktop work starts.

---

## 5. Not questions for the design team — our own follow-ups

Recorded here so they are not lost, but **do not send these**; they are
development work with an obvious answer.

| # | Item | Action |
|---|---|---|
| F-01 | H-33's two corporate CTAs are inert although `/business/partnerships` and `/business/wholesale` both exist now | Wire "EXPLORE BUSINESS PARTNERSHIPS" → partnerships, "REQUEST PARTNER PRICING" → wholesale (`components/home/A10.tsx:345`) |
| F-02 | Bottom-nav Wholesale tab has no `href` although the page exists | Wire once DQ-13(a) is confirmed |
| F-03 | The PDP header still draws menu art as a bare image, so the drawer does not open there | Replace with the same `MenuButton` the homepage and shop use (`components/chrome.tsx:157`) |
| F-04 | `/checkout/cancel` is unreachable — nothing redirects to it | Point PayPal's cancel return at it, or delete the route |
| F-05 | `/orders` only redirects to the admin, but customer-facing order links may reach it | Already release-queue item #4 |
| F-06 | Homepage rail cards all open a stand-in `/placeholder` route | Point at real products once catalogue content lands |

---

## 6. Quick index

| Section | IDs | Count |
|---|---|---|
| Navigation — no destination | DQ-01 … DQ-13 | 13 |
| Missing states | DQ-14 … DQ-20 | 7 |
| Conflicts | DQ-21 … DQ-28 | 8 |
| Assets | DQ-29 … DQ-33 | 5 |
| **Total open** | | **33** |

Most urgent three: **DQ-14** (blocks the payment-gating work now),
**DQ-24** (blocks linking sign-up), **DQ-09** (customers have no order detail
page after buying).

## 7. Answer log

_Empty. When a question is answered and applied, record one line here:_
`2026-07-29 — DQ-04 answered "point at /care"; applied in abc1234.`
