# ELDREVE storefront — repository summary

Start here: goal, current state, safety gates, release queue, doc index.
Open linked resources only when the task needs them.

## How to update this file

- Concise startup context only — goal, state, structure, environment, tooling.
- This file owns **current project state**. Every other topic has one owning
  doc: state the short version here, link to the owner, never repeat it.
- Keep implementation details, history, and long instructions out.

## Goal

- Sell the ELDREVE 24K gold-dipped rose gift line direct to consumers.
  (Repo/dir name `goldrose-storefront` predates the rename — see OQ-4.)

## Business and team

- Two bosses decide everything (China).
- Frontend UI design team designs appearance and interaction (China); Charles
  oversees their work.
- Charles (Sydney) owns all IT and every technical implementation decision.
- No influencer found yet (to be located with the target customer).
- Market: United States first, Europe possibly later.

## Product map

- **Storefront:** home, shop (search/sort/filter overlays), product pages
  (review/color/photo/unboxing overlays), bag, checkout, confirmation, tracking.
- **Customer/business:** account (dashboard, orders, returns, gift reminders),
  care, partnership and wholesale enquiry.
- **Admin:** products/inventory, orders, customers, discounts, content, files,
  analytics, team, security.
- **Marketing:** SEO/GEO, analytics, campaign/UTM attribution.

## Current phase — reconciled 2026-08-04

- Pre-launch testing on <https://eldreve.com> (the vercel.app URL serves the
  same deployment). No real customers or campaigns; all orders and analytics
  are test data; uncertain public content stays visibly mocked.
- **Built:** storefront, admin, accounts, catalog, checkout/order flow,
  analytics, SEO/GEO baseline. PayPal Orders v2 wallet checkout works in sandbox.
- **Customer sign-in is live end to end (2026-08-03).** `/account/signup` does
  real email validation → `signInWithOtp` → 6-digit code → consent-gated
  CONTINUE → `verifyOtp` → `/account`. The same email carries a one-tap link.
- **`/account/personal-info` is live (2026-08-06).** Real name, email and
  language, saved via `lib/account/profile.ts` to the auth user's
  `user_metadata` (source of truth) and mirrored onto the linked `customers`
  row — never linked by email. Email changes go through
  `updateUser({ email })`; the project has secure email change on, so both
  addresses confirm. Signed-in only; signed out it redirects to
  `/account/signup`. ⚠️ The repo now carries an email-change mail template
  that is **not yet applied** — run
  `node scripts/apply-auth-email-templates.mjs` so the link returns to the
  page instead of the homepage.
- **AI-020 answered 2026-08-04 (owner): `/account/signup` is the ONLY login
  page.** `/account` is signed-in only and redirects there otherwise; the
  second login screen (`ShoppingLogin`, frame 74:53) is deleted. It carried the
  Gift Shopping ⇄ Business tabs, so `/account/business` now has **no
  signed-out entry** — the 08-04 MENU also dropped its FOR BUSINESS row. Needs
  a design ruling; the route still works directly.
- **Figma imports** are current through 2026-08-05 on `feat/figma-sync`; the
  per-frame history and prototype-link decisions live in the per-session
  write-backs under [`agent-delivery/sessions/`](agent-delivery/README.md)
  (`docs/ixd/` is now only the naming rules). The 08-05 sync found **no changed
  frames** and instead built the Ready-for-dev leftovers
  `/account/orders/delivered` (`2439:369`) and `/account/orders/review`
  (`2439:370`), closing AI-029's dead "View details". Landed so far: the two-step
  checkout redesign, the full returns flow, reminder date pickers and edit
  sheet, the restructured privacy hub, `/account/policies-legal` → 7
  `/policies/*` coming-soon scaffolds, the unified signup page, and the
  `/account` dashboard (frame `1523:2536`; its three-tile shortcut band was
  deleted by the design team on 08-07). The PDP now matches
  Ready-for-dev frame `1523:3971` (430×1616); its live catalog data and cart
  actions remain wired.
- **Simplified homepage imported 2026-08-04** (frame `2380:370`, section
  首页一级), replacing the earlier "ignore the homepage frames" hold. Canvas
  8673 → 5193; bands 11 → 7 (A-4/A-7/A-8/A-10 deleted at source). The homepage
  and shop IxD tables were retired — interaction design is maintained in Figma
  now.
- **Three-tab bottom nav** replaced the four-tab bar (2026-08-03): 商务/Wholesale
  removed per the design team; Login/Me session swap restored.
- **DQ-34 answered 2026-08-03:** the ELDREVE wordmark was never a placeholder —
  it is the brand. The repo's GoldRose substitution is retired: the rename
  landed 2026-08-05 (see OQ-4 / AI-021).
- **Pending from design:** the 7 policy pages, MENU/story-long redesigns,
  `/gift-guide` (frame 1942:182 — no route built).
- **Figma sync 2026-08-07** (`worktree-figma-sync`). `/account/addresses`
  (ADDRESS-BOOK `2118:247`) is built with its add/edit bottom sheet
  (`2134:299` / `2610:373`, one component, two titles) — the last Ready-for-dev
  frame with no route, so `figma:unbuilt` is now empty. Addresses are the
  frame's own: no backend, and the schema holds one `default_address` rather
  than a collection (AI-039). The same delivery deleted the `/account`
  three-tile shortcut band and the homepage's Real Rose Promise strip; both are
  applied, the latter via a new `band.trim` that returns its 136px to the stage
  without moving any later band's imported coordinates (5193 → 5057). **The
  other 28 changed frames are not imported** — chiefly the homepage typography
  pass and seven further content deletions; the baseline is deliberately
  un-stamped so the next sync still sees them.
  ⚠️ The Figma file still carries **GoldRose**/**VELORIA** in three frames the
  repo already renamed, so those frames must not be imported verbatim
  (AI-037), and `/story` descends from a frame that no longer exists (AI-038).
- **Product reviews are real (2026-08-06, PR #30, `feat/product-reviews`).**
  `product_reviews` table live on hosted (migration `0007`; content-neutral
  moderation, never hard-deleted), `lib/reviews/db.ts` + `POST /api/reviews`,
  the `/account/orders/review` PUBLISH button wired (closes AI-031), PDP
  rating row/drawer show live stats and scroll; design mock stays the visible
  fallback while no review is published. Two demonstration reviews are seeded
  on hosted and locally (`npm run seed:reviews`; `-- --remove` reverses it) —
  they are not customer content and must go before launch. Missing on purpose:
  photo-upload UI (column ready) and an admin moderation screen (publish needs
  a manual DB update for now).
- **The whole home page is admin-editable (2026-08-07, `worktree-admin-home-sections`).**
  Content → **Home page** (`/admin/content/home`) lists all 8 sections in page
  order with ~100 fields — headings, copy, button labels, links, chips, FAQ
  rows, certificates, footer links — plus a show/hide switch per Figma band.
  `lib/home-content/registry.ts` holds the design defaults; `site_content`
  stores **only overrides** (a row exists iff the value differs from the
  design), so there is no migration and no seed, and a Figma re-sync updates
  every untouched field. Hiding a band re-stacks the page and shrinks the
  stage; with nothing hidden the render is byte-identical (all 3 pixel
  baselines pass). Figma-baked labels and catalogue/review data are listed
  read-only with the reason. `promo.slogan` moved here from `/admin/content`.
  Spec: [`admin-design.md` §9.8.1](docs/admin-design.md#981-content--home-page).
  ⚠️ The hero eyebrow still reads `— G O L D R O S E —`, a miss in the 08-05
  ELDREVE rename; it is now editable, so it is an owner decision, not a deploy.
- **Photos, the two hidden rails and rail speed followed (2026-08-07,
  `worktree-admin-home-customization`).** New field kinds `image` (21 photos,
  each paired with a description) and `number` (one shared card-rail speed,
  bounded so the glide can never outlast the cycle). `components/home/HomePhoto.tsx`
  is the load-bearing piece: most homepage photos are a hand-picked rectangle of
  a much larger source seen behind a small opening, so it draws Figma's traced
  geometry while the value is still the design's and switches to a plain
  `object-fit: cover` fill once replaced — the promo bar's `isDefault` idiom.
  Photo paths must point at this site (remote origins, `data:` and
  protocol-relative `//host` are refused at the write). `BestSellersRail` and
  `ReviewsRail` took no props at all, so 2 product titles, 2 prices, 3 review
  quotes and "Verified Purchase" were literals no screen could reach while the
  registry claimed they were "managed elsewhere" — both wired, both pointers
  corrected. The hero's four dots now back four real slides (all defaulting to
  the design's one photo) and no longer fall through to `/placeholder`. The
  screen itself is built for teammates: live preview beside the editor, search
  across ~180 fields, "only what I changed", per-section counts, first-run
  guidance, and a photo dialog leading with upload + the existing library.
  **"Jump to a section" is the page itself** (2026-08-08,
  `worktree-home-page-map`): the whole home page rendered small, each section's
  link exactly as tall as the band it opens and labelled with its share of the
  page, off the same `homeLayout` maths as the live render — so a teammate
  navigates by sight rather than by module code.
  **Colours were declined** — the owner ruled appearance stays with the design
  team, and the brand gold and ink are painted into the exported ornament SVGs,
  so a token change would leave a half-recoloured page.
- **Every section previews itself, as a window on the real page (2026-08-08,
  `worktree-admin-home-customization`).** Content → Home page opens each section
  with the SAME document the page-wide preview shows — `/` in an iframe, at the
  same scale — in a shorter window (360 vs 620) held still over that section's
  band. There is no second rendering path, so a section preview cannot disagree
  with the live page about anything. The lock is **structural**: the window's
  only child is a rail exactly one band tall that clips the ~5,000px page, so
  the browser's own scroll range is the band and there is no scroll listener to
  fight. Slack is 48 **design** px each end, so the peek is the same amount of
  page at every width; `overscroll-behavior: contain` stops the gesture reaching
  the editor behind. One width slider now drives every window (a frame at
  another width is at another scale), so the per-section sliders and "Match the
  main preview" are gone, as is the zoom-to-fit that put Craft and Story on
  screen at 39%. Geometry in [`lib/home-content/preview.ts`](lib/home-content/preview.ts),
  unit-tested. ⚠️ **Cost, accepted by the owner:** the standalone
  `/preview/home/[section]` route is deleted, so a switched-off section can no
  longer be previewed without switching it on — and the switch publishes
  immediately. The card says so instead of showing the wrong band.
  With the route went its robots rule, its `/api/beacon` guard and the
  `/preview/*` arm of the Beacon test, which is now the single durable rule
  "is this document framed" — no latch needed, since being framed cannot be
  destroyed by a click the way a URL can. `?adminPreview` stays on the iframes
  as a readable marker but is deliberately **not** the test: on its own it would
  be an analytics kill switch anyone could type into the URL bar.
- **You edit the home page by pointing at each section's own window (2026-08-08,
  `worktree-admin-home-customization`).** Every editable node on `/` carries a
  `data-field` naming its registry slot. **There is no switch** — pointing is
  always on, and the "outline everything editable" half follows the pointer, so
  the window you are in shows what it owns and the eight you are not stay clean
  enough to judge the design by. A click opens that field in an editor docked
  beside that window, joined by a curve. (The switch existed only while arming
  installed the capture layer that broke scrolling; with the layer gone it
  guarded nothing and merely hid the feature. A press that moves more than 5px
  is a drag, not a pick, so a window can still be dragged to scroll.)
  Typing is written straight into every mounted preview (`picker/patch.ts`), so a section window can never show
  something older than its own fields say; kinds that cannot honestly be faked
  (rail timings) still say "save to see this". Section cards went full-width to
  make room — the annotation gutter left 571px and the window is 430 of them,
  and the window cannot narrow because its width IS the phone's viewport.
  - **The page-wide preview is read-only, and that is what fixed the scroll.**
    Pointing at it needed a capture layer over the frame (its links are real),
    the layer swallowed the wheel, the scroll was re-issued programmatically,
    and the storefront's own `scroll-behavior: smooth` turned each wheel event
    into an eased animation the next one cancelled: **a gesture asking for
    2,000px moved 118**, scroll chaining was gone and touch panned the admin.
    The section windows never needed the layer — their film is
    `pointer-events: none` inside a natively scrolling box — so the fix was to
    delete it, not tune it.
  - **A card offers only its own fields**, filtered by key ownership rather than
    pixels: every window shows 48 design px of its neighbours, and a geometric
    filter would let a click on that peek open another section's field.
  - **Every field is still listed** under its card. An earlier pass struck
    pointable fields from the list (~180 rows → 25); the frames are
    `aria-hidden`/`tabIndex={-1}` on purpose, so that left ~155 fields reachable
    only by mouse. Pointing is a shortcut; the list is the inventory.
  - ⚠️ **The rule that must not be broken:** the frame loop lives in a LEAF
    (`picker/PickerLayer.tsx`), never on the screen itself. Polaris' `Page`
    re-measures its header actions from a `useEffect` on every render and
    `setState`s inside it, and cannot be stopped from outside — so a 60Hz
    publisher above it is the nested-update storm that killed this screen with
    "Maximum update depth exceeded" whenever a page scrolled under a selection.
  - Covered by `tests/e2e/admin-home-picker.spec.ts`, including a travel
    threshold on the page-wide preview that the old capture layer would fail.
- **Replaced photos can be framed (2026-08-08,
  `worktree-admin-home-customization`).** All 21 homepage photo slots were
  centre-cropped with no say in it (`object-position: center center`), and the
  dialog previewed with `object-fit: contain` — the whole photo, letterboxed —
  so you approved one picture and published another. A replaced photo now
  carries a **frame**: the same point-plus-zoom `SpotlightArea` a product photo
  already stores (`lib/images/spotlight.ts`), chosen with the same
  `ImageFramer`, which was already window-agnostic. The dialog shows the box at
  its true size with the photo cover-fitted in it; what stays inside is what
  ships. Framing is a draft like everything else and rides the same Save —
  a frame describes a photo, and until Save that photo is a draft too.
  - **No schema change.** The frame lives in its own `site_content` slot
    (`home.<section>.<field>.__frame`, `"x,y,zoom"`), so the "a row exists iff
    it differs from the design" invariant still holds: an unframed photo stores
    nothing, emits exactly the `cover` it always did, and every reset drops
    framing with the photo it describes. Not a registry field on purpose —
    21 companions would have to be excluded from the list, the search, the
    edited counts and the picker.
  - **`stretch` slots now cover instead (owner ruling, option a).** The hero's
    four slides and the two story photos stretched a replacement to the box.
    The design's own file is exactly that shape; nobody else's is, and
    "squashed" was never an intent. Their design render is untouched.
  - ⚠️ **One pixel baseline moved, on purpose.** Routing the review photos
    through `HomePhoto` applied its `maxWidth: none` rule, and review card 1's
    132×170 bleed had been silently clamped to its 122px opening by Tailwind
    preflight. It now renders at the width Figma traced. Its registry `box`
    was also corrected 132×170 → 122×69 — that is the opening, and it is what
    the framer frames against.
- **Every photo is framed twice (2026-08-07, `worktree-media-spotlight`).**
  Migration `0010` gives `product_images` two **spotlight areas** — a point
  plus a zoom each — one framed against the PDP viewer window (398×250), one
  against the shop card photo (203×204), because a single crop cannot serve
  two differently-shaped boxes. Uploading a photo opens the framing dialog on
  it, and anything nobody has framed keeps a "Needs framing" badge. Nothing is
  ever cropped to a file: `object-position` for the point and
  `transform: scale()` about it for the zoom (`lib/images/spotlight.ts`), so
  the PDP's fullscreen viewer still shows the whole original. Defaults
  reproduce the old crop exactly and zoom 100 emits no transform, so all three
  pixel baselines pass unchanged. Spec:
  [`admin-design.md` §9.5](docs/admin-design.md#95-products-adminproducts--clone).
  The PDP ABOUT panel takes the point but not the zoom — that zoom was
  authored against a wide box and this one is nearly square.
- **The /shop filter drawer is real (2026-08-07, `feat/best-for-facets`).**
  `products.best_for` changed from a dormant prose blurb to `text[]` holding
  filter slugs (migration `0009` — **written, not yet pushed to hosted**), and
  a product may carry any number of them. The vocabulary is one closed list in
  [`lib/catalog/facets.ts`](lib/catalog/facets.ts): eleven stored slugs under
  Collections/Occasion/Recipient, plus Price and Availability computed from
  `price_cents` and stock and never stored. Slugs are globally unique so the
  group is recovered from the value; a duplicate throws at import. Selection
  lives in the URL (`?f=jewel,anniversary`, noindexed) so the grid, the count
  and the pager cannot disagree — OR inside a heading, AND across headings.
  Headings multi-select except **Price, which takes one band at a time and
  swaps** (owner, 2026-08-07); the rule is a `select` field on the group, so a
  hand-typed URL is narrowed to one band too. The
  admin's "Best for" text box became a grouped multi-select. ⚠️ The frames'
  two fixed active-filter chips ("Ruby Red", "Gift Sets") are gone: an
  unfiltered shop now correctly shows none, which is the only pixel change
  (baseline updated; home and PDP byte-identical).
- **Dwell tracking** is merged to `main` (PR #11) with schema `0005` live.
  Coverage is partial: 4 of the home page's 7 bands carry `data-el="…-SECTION"`
  (A-1/A-2/A-3/A-11; A-5/A-6/A-9 untagged);
  the rest waits on a signed-off section vocabulary
  ([`engagement-tracking.md`](docs/features/backend/engagement-tracking.md)).
- **Product-handle rule** ([`product-handles.md`](docs/ixd/naming/product-handles.md)
  v2.1) is adopted and enforced: `lib/admin/product-handle.ts` derives handles,
  collisions throw (no `-2`), non-draft handles are frozen. ⚠️ Duplicate in the
  Chinese admin (副本 prefix) now errors by design; `product_redirects` doesn't exist.
- **Feature-roadmap generator** was torn down 2026-08-01; a from-scratch rebuild
  (front matter only, no registry, no groups) is in progress. Its first piece,
  `scripts/features/cli.mjs`, reached `main` 2026-08-06 but nothing calls it:
  [`docs/features/README.md`](docs/features/README.md) still has no generated
  block and there are no `features:*` scripts or CI check.
- `/bag` items, tracking timeline, shipping choices and card fields are visual
  placeholders; the real cart enters through `/checkout`.
- The [owner walkthrough](docs/admin-design.md#143-final-acceptance) is pending.
  The Shopify *store integration* is removed (no `lib/shopify/`, no `SHOPIFY_*`
  vars); the `@shopify/polaris` UI framework is the admin's own and stays.
  Cancel the subscription only after acceptance.
- **Stale sweep 2026-08-07.** `archive/` deleted (git history is the archive
  now), and 1,029 unreferenced files removed from `public/` — 75MB → 24MB,
  1477 → 448 files. Those were Figma exports nothing renders, left by the
  homepage simplification and superseded screens; `public/` is served, so they
  were publicly reachable. Verified by build, 80 unit and 111 e2e tests
  (incl. the three pixel baselines). A deleted asset is re-exported by the
  next `npm run figma:assets`. Kept on purpose: `scripts/features/cli.mjs`
  (owner ruling — the generator rebuild still needs it).
- **Next:** owner activation/UAT → real shipping and product content → card
  integration → launch hardening.

## Environment and tooling — verified 2026-07-27

- Apple-silicon iMac, Sydney; macOS, zsh, Homebrew. CLIs: Git/`gh`, Node/npm,
  Supabase, Vercel, `psql`, Docker, Python 3/`uv`, `jq`, ripgrep, Claude, Codex.
- Production deploys `main` → GitHub/Vercel integration, **not** CLI deploys.
  Hosted Supabase project `cfvsvgbldnzkcjvbwnjp`; local dev uses it too when
  the Supabase variables are set.
- Secrets in `.env.local` (gitignored); `.env.example` lists every variable.
- Auth: `gh` SSH works as `CharlesChi715` but its API token is invalid — run
  `gh auth login` before `gh` API work. Vercel CLI linked as `vancechi`;
  Supabase CLI linked; `psql` works ([`README.md`](README.md)); Docker reachable.
  No `cloudflared`/`ngrok` — install one before PayPal webhook testing.
  `FIGMA_TOKEN` has `file_content:read`; revoke after design-import work.
  **Re-verify tool auth before environment-dependent work.**
- Agent tooling: `.mcp.json` declares supabase (read-only, pinned),
  next-devtools and playwright — all need one-time approval, Supabase needs
  `/mcp` OAuth. All four are global in `~/.codex/config.toml`. Skills live
  twice: `.agents/skills/` is the **source of truth** and `.claude/skills/`
  symlinks all four into it — `figma-sync`, `agent-delivery`, and, since
  2026-08-04, `supabase` + `supabase-postgres-best-practices` (they were still
  byte-identical copies when converged, so nothing was lost).
  `supply-chain-risk-auditor` exists only
  under `.agents/`. `.claude/` is gitignored, so the tracked path for any skill
  is always `.agents/…`.

## Runtime and safety

- **Local mode** (blank Supabase and PayPal variables): data in `.data/db.json`;
  e2e tests use this mode. `npm run seed -- --reset` restores it. Admin is open
  unless `ADMIN_DEV_PASSWORD` is set; customer sign-in is unavailable.
- **Hosted mode:** add migrations as `supabase/migrations/000N_*.sql` and apply
  with `supabase db push` — never the web SQL editor. `0001`–`0003` and
  `0005`–`0008` applied (verified 2026-08-07); `0004` is permanently skipped
  (its orphan history row was repaired 2026-07-28 — intentional, not a gap).
  ⚠️ **`0009` (best_for facets) and `0010` (image spotlight) are written but
  NOT pushed** — hosted still has `best_for` as text, no variant `stocked` and
  no spotlight columns. Both were authored as `0009` on separate branches;
  spotlight was renumbered to `0010` when they merged, and **the order is
  load-bearing**: `0009` drops and recreates `catalog_products` without the
  spotlight columns, so `0010` must run after it to put them back. Storefront
  *reads* survive without either (missing columns read as the old centre
  crop), but an admin product *save* would fail — push both before the next
  admin save. `npm run check:migrations` guards the sequence in CI — duplicate
  numbers fail, and a rebuilt view that drops an earlier migration's column
  warns. Use `psql` for read-only
  ad-hoc queries; `supabase db dump` needs Docker.

### Release gates

- `CHECKOUT_SKIP_PAYMENT=1` is test-only and records uncharged mock orders.
  Remove before launch; builds reject it with `PAYPAL_ENV=live`.
- Only the owner may enable live PayPal.
- Supabase configuration must be fully present or absent; the service-role key
  stays server-side.
- Money uses integer cents; orders are never hard-deleted.
- Storefront data revalidates every 300 seconds.
- Admin strings use `t()` for English and Shopify-style Chinese; every exported
  `lib/` function requires JSDoc.
- [`docs/admin-design.md`](docs/admin-design.md) is the authoritative spec. Keep
  [`docs/ideas.md`](docs/ideas.md) verbatim; change
  [`docs/Database.md`](docs/Database.md) only on explicit request.

## Release queue

1. Owner activation + [acceptance walkthrough](docs/admin-design.md#143-final-acceptance).
2. ~~Customer sign-in activation~~ — **done 2026-08-03.** Custom SMTP live on
   Resend (`smtp.resend.com:465`, sender `noreply@eldreve.com` / "ELDREVE");
   templates applied from `scripts/apply-auth-email-templates.mjs` carrying both
   the `/auth/confirm` link and the 6-digit code; `mailer_otp_length` 6; send cap
   30/hour. Verified end to end. Remaining: watch Resend's free tier
   (~3k/month) against real volume.
3. Configure PayPal sandbox, begin Advanced Checkout onboarding; install
   `cloudflared`/`ngrok` when webhook testing starts.
4. Build guest order lookup. `0006` stamps `orders.auth_user_id` so OTP-signed-in
   customers already see their orders at `/account`; guests still have only
   `/orders/track`. (The leftover `/orders` → `/admin/orders` redirect was
   deleted 2026-08-04.)
5. Enter real shipping rates (OQ-2) and product content (OQ-3).
6. Replace third-party/dev imagery; reconcile palettes and tabs. (Wordmarks
   are done — the ELDREVE rename landed 2026-08-05, see OQ-4.)
7. Launch checks (incl. `npm run seed:reviews -- --remove`) + [database
   backups](docs/features/backend/db-backups.md).
8. After acceptance: capture screenshots, cancel Shopify, revoke the Figma
   token, begin marketing.

Later: promotion email consent
([`promotion-emails.md`](docs/features/backend/promotion-emails.md)), 120-SKU
imports ([`product-content-pipeline.md`](docs/features/product-content-pipeline.md)),
supplier colors ([`supplier-color-charts.md`](docs/supplier-color-charts.md)),
campaign ideas ([`ideas.md`](docs/ideas.md)), EU read replica
([`region-alignment.md`](docs/features/backend/region-alignment.md)).

## Product decisions

- **OQ-1 — decided 2026-07-26:** use
  [PayPal Advanced Cards](docs/features/card-payments.md) for Visa/Mastercard at
  checkout. Card processing is not built; Stage 0 is owner onboarding.
- **OQ-2 — open:** rest-of-world shipping at `$19.95` is a placeholder.
- **OQ-3 — open:** seed product details and some imagery are placeholders.
  `/shop` cards show real catalog photos, but they are supplier composites with
  English text baked in — replace before launch. Three products fill an
  eight-card grid, so cards repeat.
- **OQ-4 — resolved 2026-08-03:** the brand is **ELDREVE**; `goldrose.co` is
  superseded and **`eldreve.com` is registered and live** (Cloudflare Registrar,
  boss-owned account). Wired 08-02/08-03: domain + `www` on Vercel, cert issued;
  Supabase Site URL/redirects moved; **passkey RP ID switched to `eldreve.com`**
  — old vercel.app passkeys are dead by design, re-enrol on the new domain;
  Cloudflare Email Routing catch-all → company Gmail; Resend for outbound
  (DNS on `send.eldreve.com`). `NEXT_PUBLIC_SITE_URL=https://eldreve.com` is live
  (canonical, `og:image`, sitemap all verified). Resend uses two keys
  (`.env.example`): `RESEND_API_KEY` for our code, `RESEND_SMTP_PASSWORD` for
  Supabase SMTP — both live; `RESEND_API_KEY`/`RESEND_FROM` added to Vercel
  **Production only** on 2026-08-03, so previews still take `lib/email.ts`'s
  console-log fallback on purpose. Records:
  `~/Documents/Work/gold_rose/{eldreve-domain-registration,domain-setup}.md`.
  **Still pending:** billing → hua's PayPal.
- **Rename done 2026-08-05 (AI-021), branch `feat/eldreve-rename`.** Prose
  casing is **all-caps ELDREVE everywhere** (owner ruling). Three stale names
  went: `GoldRose`/`GOLDROSE` in all copy, titles, alt text and admin i18n;
  the title-case "Eldreve" in the Supabase auth email templates; and the
  `public/veloria/` asset namespace → `public/eldreve/`. Kept on purpose
  because they are identifiers, not copy: the lowercase `goldrose-*`
  localStorage/cookie keys (renaming them drops every admin session and
  empties every saved cart), `goldrose-storefront.vercel.app`, the
  `owner@goldrose.local` test fixture, and the literal noun "24K Gold Rose".
  Not attempted: renaming the repo/dir and the GitHub project.
- Use `assets/PlaceholderPicture.png` for explicitly unknown images.
- Path `~/Documents/Work/gold_rose` for company or additional info. 

## Repository structure

```text
goldrose-storefront/
├── app/                  # Next.js routes, pages, and API endpoints
├── components/           # Storefront, screen, and shared React UI
├── lib/                  # Domain logic and data/payment/auth adapters
├── public/               # Browser-served images and static assets
├── assets/               # Raw owner/source art; not served directly
├── supabase/             # Hosted database migrations
├── scripts/              # Seed, validation, and feature utilities
├── tests/                # Playwright end-to-end and unit tests
├── docs/                 # Specs, roadmaps, guides
├── agent-delivery/       # Agent workflow rules, INBOX, session write-backs
├── team-deliveries/      # Upstream deliveries: inbox/ + originals/ (kept)
├── trash/                # Scratch, gitignored, deletable; never referenced
├── .agents/              # Skills source of truth (.claude/ symlinks into it)
├── .ai/                  # Optional work history; never startup context
├── .data/                # Local file-adapter database and uploads
├── .github/              # CI workflows
├── .mcp.json             # Project MCP servers (supabase, next-devtools, playwright)
├── .env.example          # Every environment variable, documented
├── proxy.ts              # Admin route/API authentication guard
├── package.json          # Dependencies and runnable commands
├── CLAUDE.md             # Claude entry point importing SUMMARY.md
├── README.md             # Setup, stack, run, test, and deploy guide
└── SUMMARY.md            # This entrypoint: context, state, and doc index
```

Config at the root: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`,
`playwright.config.ts`, `postcss.config.mjs`, `vercel.json`, `.prettierrc.json`,
`.prettierignore`, `.npmrc`, `skills-lock.json`.

## Find details on demand

| Need                                                             | Open                                                                                                 |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Agent instructions and open messages (`npm run agent-inbox`)     | [`agent-delivery/`](agent-delivery/README.md)                                                        |
| Feature status and roadmap (generator rebuild in progress)       | [`docs/features/README.md`](docs/features/README.md)                                                 |
| Authoritative admin/product requirements (`§` references)        | [`docs/admin-design.md`](docs/admin-design.md)                                                       |
| Figma imports, route decisions, interactions, design issues      | [`agent-delivery/sessions/`](agent-delivery/README.md) (per sync); [`docs/ixd/README.md`](docs/ixd/README.md) keeps the findings record |
| Naming rules — Figma sections/frames, `data-el`, product handles | [`docs/ixd/naming/`](docs/ixd/naming/figma-route-rule.md)                                            |
| Where raw deliveries land, and how to parse one                  | [`team-deliveries/README.md`](team-deliveries/README.md)                                             |
| Database decisions and SKU rules                                 | [`docs/Database.md`](docs/Database.md)                                                               |
| SEO/GEO implementation and research                              | [`docs/seo-geo/search-discovery-implementation.md`](docs/seo-geo/search-discovery-implementation.md) |
| End-to-end feature traces, written to learn from                 | [`docs/learning/README.md`](docs/learning/README.md)                                                 |
| Owner ideas, kept verbatim                                       | [`docs/ideas.md`](docs/ideas.md)                                                                     |
