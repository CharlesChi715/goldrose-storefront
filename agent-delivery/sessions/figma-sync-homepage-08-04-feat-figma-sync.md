# figma-sync · homepage · 08-04 · `feat/figma-sync`

Agent session hand-off. Open matters first; what the session delivered is at
the bottom. See [`../README.md`](../README.md) for tag meanings and workflow.

> **Context for AI-022.** The 08-03 session recommended answering AI-022 (is
> the MORI mascot retired?) *before* importing 2380:370. Charles instructed
> this session to import it anyway, so it ran ahead of that answer. AI-022
> stays **open and untouched**: the floating `ConciergeChat` is mounted only on
> `/shop` and `/products/[slug]`, never on the homepage, so nothing this
> session did decides the mascot's fate. What it did settle is that the
> homepage's MORI modules (A-4, A-7) are gone, because the frame deletes them.

---

## AI-024 · `OWNER-TODO` · the occasion chip in the frame is spelled "Chritsmas"

Node `2380:474` in A-5 "Shop by Occasion" is named `Chip · Graduation` but its
label text reads **`Chritsmas`** — two source errors in one node: a stale
instance name and a misspelling of "Christmas".

The build ships **"Christmas"**. A visible typo on the storefront homepage is a
defect, not a design decision, so it was corrected rather than transcribed;
this is the same treatment `docs/ixd/homepage.md` already gives the design
team's other typos (H-20/H-23's `客详情页` → `博客详情页`).

**Needed from you:** relay to the design team so the frame itself is fixed —
otherwise the next sync re-introduces it, and the band-diff will keep showing
this cell as a mismatch.

Location: [`components/home/A5.tsx`](../../components/home/A5.tsx)

---

## AI-025 · `AGENT-DECISION` · the homepage newsletter field is display-only

A-11 gained a "Keep Meaningful Moments Close" newsletter strip (`2380:797`)
with an email field and a gold **JOIN** button.

The frame's prototype puts **one** link on the whole input+JOIN group
(`2380:801` → `1523:3315`), i.e. tapping anywhere in it navigates to
`/account/signup`. It does not collect the address in place. It is built that
way — a link, not a live `<input>` — because:

- there is no newsletter subscribe endpoint in the repo, and
- promotion-email consent is an unstarted feature
  ([`promotion-emails.md`](../../docs/features/backend/promotion-emails.md)),
  so an address captured here would have nowhere lawful to go.

A real field that silently discards what a visitor types is worse than a field
that hands off to the sign-up page.

**Veto path:** if you want a working subscribe box on the homepage, that needs
the promotion-email consent work first, not a UI change.

Location: [`components/home/A11.tsx`](../../components/home/A11.tsx)

---

## AI-026 · `PLACEHOLDER` · `/blog` is a coming-soon scaffold

The Ready-for-dev homepage footer (`2380:855`) and the Ready-for-dev menu
(`2354:316`) both link to `BLOG-JOURNAL-PAGE` (`1593:115`) — a frame that is
**not** marked Ready-for-dev. Per the sync rule, the link resolves to a
scaffold rather than an invented page.

This page was built for real on 2026-07-31 and reverted the same day for
exactly this reason. The scaffold reuses `PolicyComingSoon` (now with an
overridable back link) so there is one placeholder screen, not two.

**Closes when:** `1593:115` is marked Ready-for-dev and the real page is
imported. The markup from the 07-31 build is in git history.

Location: [`app/blog/page.tsx`](../../app/blog/page.tsx)

---

## AI-027 · `AGENT-DECISION` · Best Sellers now shows two real cards, not one card × four

Since 2026-07-26 the Best Sellers rail was **one card repeated four times**,
against the four pagination dots the old frame drew — a documented choice made
because the design then specified a single card and you had asked for visible
movement.

Frame `2380:399` changed both halves of that premise:

- it **deleted the four dots**, and
- its second card (`2380:415`) now carries real distinct content —
  "Enchanted Rose with LED Light", `$119.00`, "Gift-ready packaging", its own
  photo, its own 184 × 349 box.

So the rail is now the design's two actual cards, with no dots; the peeking
second card is the affordance, which is exactly how A-3's rows work. Swipe and
the slow auto-advance are unchanged. This took the A-2 band-diff against the
Figma render from **10.4 % → 1.6 %**.

**Veto path:** say so and the four repeated copies come back — but the dots
cannot, because the frame no longer draws them.

Location: [`components/home/BestSellersRail.tsx`](../../components/home/BestSellersRail.tsx)

---

## AI-028 · `AGENT-UNSURE` · the menu's Shop and My Account groups have no expanded state

The redesigned menu (`2345:271`) is four accordion groups. Two of them —
**Contact** and **Legal & Policies** — are drawn *expanded*, with their child
rows and a chevron-up. The other two — **Shop** and **My Account** — are drawn
*collapsed*, with a chevron-down, and the file contains no expanded variant and
no child rows for either.

Built as: Shop and My Account are plain links (`/shop`, `/account`), keeping
their chevron-down art verbatim; Contact and Legal & Policies genuinely toggle.
Shop's own prototype (`2354:283` → `1523:1526` = `/shop`) backs the link
reading; My Account has no prototype at all, so `/account` is inferred.

**The ambiguity:** a chevron-down that navigates instead of expanding is a
small lie to the user. Either the design intends sub-menus it has not drawn
yet, or those two rows should lose their chevrons.

**Needed:** ask the design team which. If sub-menus are coming, the frames
should follow; if not, the chevrons should be dropped from those two rows.

Location: [`components/MenuDrawer.tsx`](../../components/MenuDrawer.tsx)

---

## AI-029 · `OWNER-TODO` · two Ready-for-dev order frames have no route in the repo

The repo↔Figma reconciliation (sync rule §5) turned up two frames sitting under
the **Ready-for-dev** section `me二·级` (`1542:1380`) that the repo has never
built:

| Frame      | Name                                          | Repo route |
| ---------- | --------------------------------------------- | ---------- |
| `2439:369` | `/account/orders/delivered · mobile · iPhone 15 Pro Max` | missing    |
| `2439:370` | `/account/orders/review · mobile · iPhone 15 Pro Max`    | missing    |

`1523:3455` (the orders list's second "View details" button) already
prototype-links to `2439:369`, so `/account/orders` has a dead entry point
today.

They are outside a homepage sync, so nothing was built. Everything else
reconciled cleanly: `/account/addresses` and `/gift-guide` have frames that are
**not** Ready-for-dev (still pending, below), `/account/returns/select-reason`
is implemented as a sheet on `/account/returns` rather than a route, and
`/orders`, `/placeholder`, `/checkout/cancel` are the expected technical routes.

**Recommendation:** fold these two into the next `me二·级` pass.

Location: [`app/account/orders/page.tsx`](../../app/account/orders/page.tsx)

---

## Pending from design — noted, nothing changed

- **`/account/addresses`** — the `ADDRESS-BOOK · 2 EDITABLE SCREENS` section
  (`2118:246`) is still not Ready-for-dev.
- **`/gift-guide`** (`1942:182`) — still not Ready-for-dev, still no owner
  sign-off.
- **`BLOG-JOURNAL-PAGE`** (`1593:115`) — not Ready-for-dev; scaffolded, AI-026.
- **`/policies/email-sms-terms`** — the frame exists but is named
  `SCROLL-CONTENT` (`2127:238`) instead of a route name, so it fails the
  [figma-route rule](../../docs/ixd/naming/figma-route-rule.md). Worth one line
  to the design team next time you are in the file.
- **Brand naming is now three-way inconsistent in the same file**: the file is
  titled *VELORIA*, the header wordmark art is *ELDREVE*, and the homepage body
  copy says *GoldRose* ("Inside the GoldRose Workshop", "At GoldRose, we
  believe…", the hero eyebrow). The build follows each frame verbatim. This is
  AI-021's rename project; no new matter raised.

## Deliberately not adopted

- **Cart icon → `/bag`.** The homepage header's cart art prototypes to
  `1523:3059` (`/bag`), but `/bag` still shows the design's mock line items
  while `/checkout` is the live cart. Kept on `/checkout` — the existing
  AI-008 decision, unchanged.
- **Bottom-nav "我的" tab → `/account/signup`.** The frame's prototype
  (`2380:817`) points there; the repo's shared `BottomNav` points at
  `/account`, which serves the dashboard when signed in and its own login
  screen when not. Keeping `/account` is strictly better for a returning
  customer.
- **`A5 Prompt` (`2380:464`) and `Button · Explore Occasion Gifts`
  (`2380:478`).** Both exist in A-5 but sit at y=511/547 inside a 476-tall
  clipping frame, so Figma renders neither. Not built — transcribing them
  would add UI the design does not show.

---

## Delivered this session

- **Imported the simplified homepage** (`2380:370`, the only frame left in the
  Ready-for-dev section `首页一级`). The page went **8673px → 5193px**, exactly
  matching the frame. Modules **A-4, A-7, A-8 and A-10 were deleted at source**
  and their files deleted with them; A-1/A-2/A-3/A-5/A-6/A-9/A-11 were reflowed
  to the frame's own band offsets. A-9 flipped from a dark section to cream.
- **Wired all 21 of the frame's prototype links** — hero CTA, header menu /
  search / cart, EXPLORE OUR CRAFT → `/craft`, READ OUR STORY → `/story`, the
  eight footer links, four FAQ rows + VIEW ALL FAQs → `/care/chat`, the
  newsletter hand-off, and SHOP GOLD ROSES.
- **Imported the redesigned menu** (`2345:271`, also Ready-for-dev in the same
  section) — a full-width cream accordion sheet replacing the 07-29 dark left
  drawer. Band-diff vs the Figma render: **0.36 %**.
- **Applied the carousel IxD** (H-09/H-19/H-22): A-6's recipient cards became a
  real swipeable rail (`RecipientRail.tsx`), and A-5's and A-6's pagination
  dots are now wired to their rails instead of being inert art. All four rails
  now share `Carousel.tsx`.
- **Verified**: per-band diff of the live render against the scale-2 Figma
  render is **0.99 %–2.89 %** across all seven bands (font-antialiasing
  envelope), and every band's pixel dimensions match the frame exactly.
  99/100 e2e pass — the one failure (`admin-auth.spec.ts` EN/中文 toggle) was
  confirmed pre-existing on a clean tree. 67/67 unit tests pass.
- **Tests added**: 14 homepage specs (footer link cloud, `/blog` scaffold, FAQ
  rows, newsletter, EXPLORE OUR CRAFT, H-22 and H-19 rails, the two-card Best
  Sellers rail) and 2 menu specs (accordion toggle, all ten policy rows). The
  `home-darwin.png` pixel baseline was regenerated at the new height.
- Scaffolded `/blog`; made `PolicyComingSoon`'s back link overridable.
- Made the menu's PERSONALIZE row inert — the `#personalize` anchor it targeted
  lived on the deleted A-4/A-8.
