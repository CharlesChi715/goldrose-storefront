# figma-sync (home page `/`) · 2026-08-10 · `claude/figma-sync-home-page-75f37e`

Scoped sync against file version `2385751945240834559`: Charles asked for the
home page only. Scope reported **5 added, 42 modified, 1 removed**; only
`2380:370` was imported, so `npm run figma:baseline` is **not** stamped and the
next sync still sees the other 41 changed frames.

This is the delivery the 08-07 sync deferred as a whole — the **page-wide
typography pass** — plus seven further content deletions and one band that
changed shape. Almost every text node on the page grew: section headings
24/30/21 → 32/36, body and card copy 8–11 → 13, chip labels 9 → 13, craft
step numbers 8 → 12.

**The stage is 5074, and `band.trim` is gone.** On 08-07 the design had deleted
A-3's Real Rose Promise strip *without* re-stacking the frame, so the repo held
136px of coordinates the design no longer used and closed the gap at render
time. This frame has re-stacked: every band now sits at its own y, the repo
took those coordinates verbatim, and the compensation mechanism was deleted
along with its type field, its layout branch and its three unit tests. Net
5057 → 5074, all of it A-1 growing 732 → 749.

**One frame-level quirk, resolved silently.** The whole content group sits at
`y=4` inside a frame whose declared height did not grow to match, so the nav
would end at 5078 in a 5074 frame. Every imported coordinate therefore has 4px
subtracted, which makes the band stack close exactly on the frame's own
5074 — and keeps the promo bar at y=0 where the rest of the site's chrome
expects it.

---

## AI-043 · `AGENT-DECISION` · the frame put each rail card's ornament on top of its own button

Both card rails — A-5 "Shop by Occasion" and A-6 "Shop by Recipient" — draw
three cards with a rose ornament and a `SHOP WIFE GIFTS →` strip at the foot.
In this revision the design moved every ornament **down by ~12px, onto the
strip**, and deleted the strip outright on three of the six cards (A-5 card 2,
A-6 cards 1 and 2). Figma's own render of A-5 shows the result: cards that end
in an ornament and no call to action, and card 1 where the two overlap.

That reads as an editing accident rather than an intent — the six cards were
identical in every earlier revision, and a shop card losing its button is not a
neutral change.

**Decided:** keep all six CTAs and leave both ornaments at their 08-04
positions, so the two rails stay consistent with each other and every card
still says where it goes. Nothing else in either rail was held back.

**Needed:** if the design team meant it, say so and the strips come out in one
edit; more likely this wants fixing at source.

Location: [`components/home/OccasionRail.tsx`](../../components/home/OccasionRail.tsx),
[`components/home/RecipientRail.tsx`](../../components/home/RecipientRail.tsx)

---

## AI-045 · `OWNER-DECISION` · three of the deletions remove substance, not decoration

Seven things were deleted at source in this frame. Four are plainly layout —
the A-1 benefit tiles, the A-5 `—  ♡  —` eyebrow the 08-04 delivery had only
just added, the A-9 workshop caption, and the A-11 story paragraph. Three are
not:

1. **"Verified Purchase"** and its badge, on all three review cards. That is
   the only trust marker the homepage carried, and real reviews now exist
   (`product_reviews`, live since 08-06).
2. **All four certificate numbers** — `US 11,324,751 B2`, `EP 3 982 104 B1`,
   `ZL 2021 2 1234567.8`, `Quality Certified`. The panel keeps the names and
   the scans; a patent claim without its number is the part a buyer could
   check.
3. **The eight-line brand story paragraph** ("At ELDREVE, we believe the most
   meaningful gifts are more than beautiful…"), leaving the story block as a
   title, a two-line pull quote and a button.

All three were imported as deleted, and their nine registry fields removed with
them, because the alternative is a page that disagrees with its own design.
They are recorded here rather than quietly dropped.

**Needed:** confirm the deletions, or ask the design team to put any of the
three back. Restoring one is a small edit; each still has its copy in this
file's git history.

Location: [`components/home/ReviewsRail.tsx`](../../components/home/ReviewsRail.tsx),
[`components/home/A9.tsx`](../../components/home/A9.tsx),
[`components/home/A11.tsx`](../../components/home/A11.tsx)

---

## Pending from design

- **`/craft`, `/story` and `/blog` are still scaffold targets** — all three are
  linked from this Ready-for-dev frame and none is itself Ready-for-dev
  (AI-012 / AI-026 / AI-038 already cover them). No change.
- **A-5's chip still reads `Chritsmas`** in the frame; the build still ships
  "Christmas" (AI-024, open since 08-04).
- **Route drift, unchanged and unactioned:** `/account/business`,
  `/account/privacy-policy`, `/blog` and `/policies/email-sms-terms` have no
  frame; `/gift-guide` (frame `1942:182`) has no route.
- **Two unresolved comment threads**, neither the agent's: Charles's own
  "我试试" on the date-field dropdown, and the design team's "这个先设定为固定值"
  on the reminders edit modal.

## Delivered this session

- **The whole home page re-imported from `2380:370`** — all seven A-bands, the
  four card rails, the registry and the layout maths. Stage 5057 → **5074**;
  `band.trim` deleted (frame and repo agree on every band y again).
- **A-1 rebuilt.** Benefit tiles deleted; the photo window grew 317 → **405**
  and re-exported (`2380-386.png`, 430×405); the subtitle went 16px pink →
  **24px gold**; the CTA label went tracked-out 12px caps → **20px sentence
  case in Goudy** ("Shop Gold-Dipped Roses"); the four dots moved to the
  window's new lower edge.
- **Two things stopped being baked artwork and became editable**, because the
  frame rebuilt them out of real nodes: A-9's EXPLORE OUR CRAFT button
  (`craft.cta_label`, was `artwork`, was one 246×38 SVG) and A-11's FAQ `＋`
  markers.
- **Nine registry fields removed** with the content they described:
  `hero.benefit_1/2`, `recipient.reviews_verified_label`,
  `craft.workshop_copy`, `craft.cert_1…4_number`, `story.story_body`.
- **AI-044 raised and answered the same day, then closed.** The frame still
  carries the pre-rename name in three home nodes; the owner ruled **the frame
  wins**. So the hero eyebrow stays `— G O L D R O S E —`, and two defaults
  went BACK to the frame's wording: `craft.workshop_title` → "Inside the
  GoldRose Workshop", and `occasion.intro` → "Find a GoldRose for every
  meaningful moment." The concern — that this puts the retired name on
  eldreve.com and partly reverses the 08-05 rename (AI-021) — was raised
  before the decision and is recorded in the archived matter.
  AI-037 (the same name in three *other* frames) is untouched and still open.
- **Three wrapping fixes the typography pass forced.** At 13px the rail card
  copy and at 36px the workshop title no longer fit on one line, and the frame
  wraps all of them — so `white-space: nowrap` came off those three, matching
  Figma's own render rather than clipping mid-word.
- **Then band-diffed against Figma and closed the gap.** A throwaway harness
  screenshotted `/` at the design's own 430px width and 2× and compared each
  band with that band's Figma render, plus a text audit that matched all 123
  of the frame's TEXT nodes to the live DOM **by their own copy** and reported
  dx/dy/dw. Every text node on the page is now **within 1px** of the frame.
  What it caught, none of which the outline showed:
  - **Two italics** (`hero.subtitle`, `story.story_quote`) and four
    letter-spacings. `--outline` reports family and size but not style, so the
    only way to see these was `style.italic` in the raw node.
  - **A 1px gold stroke on the EXPLORE OUR CRAFT button**, the single largest
    pixel difference in A-9 while it was missing. Strokes are invisible in the
    outline too.
  - **Every chip label sat 1px low**, in both A-5 and A-6.
  - **Craft step 04's tile is a photo now**, not the flattened SVG it used to
    be, so it joined steps 01–03 as a replaceable `image` field.
  - **Per-certificate title boxes**: the design lets "European Patent" spill
    100px wide across its neighbours instead of staying in its 69px column.
  - **The active carousel dot is the design's bigger one.** Every rail here
    draws the current indicator a pixel or two larger; the rails had normalized
    that away, so no rail could ever rest on the frame's own picture. It is now
    a property of the position (`activeSize`), so the size travels with the
    slide instead of being pinned to dot 1.
  - ⚠️ **A 2× PNG strip must be sized explicitly.** `object-fit: none` — the
    idiom this page uses for its SVG glyph strips — draws a raster at its full
    intrinsic pixel size, i.e. twice too big. Both new PNG strips are given
    their CSS ink size and centred by hand.
- **What is left, and why.** ~2.0–2.7% of pixels per band still differ, and it
  is not position: it is font rasterisation (every glyph edge shows as a 1px
  outline in the diff), two places where Figma's text engine wraps a line
  earlier than Chrome does with the same font at the same size, and the two
  sanctioned divergences — A-2's uniform card 2 (owner, 08-07) and the six rail
  CTAs (AI-043). A-2 reads 8.3% for exactly that reason.
- **Verified:** 165 unit tests, 154/155 e2e, three pixel baselines. `/shop`
  and the PDP baselines are **byte-identical**; only `home-darwin.png` was
  regenerated, which is the expected blast radius for a home-only sync. The one
  failure (`shop-filters.spec.ts:158`) reproduces on stashed, pre-change code —
  it is not this delivery's.
  ⚠️ **Two environment traps cost most of the verification time, and will bite
  the next sync too.** Playwright's `reuseExistingServer: !CI` silently reuses a
  stale `next start` on port 3001 — so `--update-snapshots` can "pass" while
  regenerating a baseline from the OLD build (the tell is the runtime: ~2s means
  no build happened). Always use `CI=1` for a baseline. And `npm run seed --
  --reset` does NOT clear `site_content`, so an aborted run of
  "hiding a section…" leaves `home.craft.__visible = hidden` in `.data/db.json`
  — after which every later homepage test fails for want of a band, and a
  regenerated baseline bakes the missing band in.
- **Not stamped:** `npm run figma:baseline` deliberately NOT run — 41 changed
  frames remain un-imported and stamping would hide them from the next sync.
