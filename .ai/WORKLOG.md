# AI Worklog

Append concise timestamped entries here when agent work creates useful project history.

Use a minute-precision timestamp for each entry heading, in local time with the
timezone, formatted as `## YYYY-MM-DD HH:MM TZ` (for example `## 2026-06-25 12:28 AEST`).
Run `date "+%Y-%m-%d %H:%M %Z"` to get the current value.

This file is optional history. Agents should read `.ai/HANDOFF.md` at startup and search this file only when they need older context.

## scaffold

- Added shared agent memory scaffold: `AGENTS.md`, `CLAUDE.md`, `.ai/HANDOFF.md`, and `.ai/WORKLOG.md`.

## 2026-06-25

- Built the first dependency-free GoldRose DTC storefront prototype with
  `index.html`, `styles.css`, `script.js`, `README.md`, and `.gitignore`.
- Kept checkout as a demo flow and documented the next commerce integration
  choices for a beginner-friendly learning path.
- Replaced the default Next.js README with a project-specific learning map for
  the GoldRose DTC storefront and documented the current Next.js scaffold as the
  main build path.
- Built the first real Next.js storefront MVP: product data module, interactive
  cart drawer, product/occasion/story/FAQ sections, copied storefront images into
  `public/products/`, and verified with lint/build plus a local dev server.
- Rebranded the current storefront direction from GoldRose to display brand
  `GoldRose`, restyled the UI toward the bundled `temp/Gold Rose Landing.html`
  luxury visual direction, and documented the brand meaning and launch caveats.

## 2026-06-25 13:15 AEST

- Reread `.ai/HANDOFF.md` and `.ai/WORKLOG.md` on request.
- Confirmed the current direction: Next.js storefront MVP, visible brand
  `GoldRose`, luxury visual style based on `temp/Gold Rose Landing.html`, checkout
  intentionally not connected yet.

## 2026-06-25 15:46 AEST

- Added `.claude/` to `.gitignore` and removed the staged `.claude` worktree
  entry from git tracking with `git rm --cached -r -f .claude`, keeping local
  files on disk.

## 2026-06-25 18:54 AEST

- Added mock US-market business assumptions for the GoldRose storefront: China
  import origin, US inventory, Ontario CA warehouse placeholder, shipping/return
  policy placeholders, SKU/inventory/landed-cost fields, and an owner-review doc
  at `docs/mock-business-decisions.md`.
- Updated the storefront to display conservative origin and fulfillment copy,
  then verified with `npm run lint`, `npm run build`, and a local `200 OK` check.

## 2026-06-25 19:18 AEST

- On branch `shopify-checkout`, added Shopify mock/live cart creation: checkout
  UI posts to `POST /api/shopify/cart`, mock mode returns a Shopify-shaped cart,
  and live mode is ready to call Storefront API `cartCreate` after real Shopify
  credentials and variant IDs exist.
- Added `.env.example`, `lib/shopify/`, `docs/shopify-integration.md`, and
  updated README/business docs. Verified with lint, production build, homepage
  `200 OK`, and a mock Shopify cart POST.

## 2026-06-28 17:56 AEST

- Consolidated branches into `main`: merged the Shopify checkout path, folded in
  the ideas/learning docs, and archived the in-progress Stripe exploration on the
  `stripe-checkout` branch. Removed the stray worktrees and redundant branches.
- Built a unified checkout offering Shop Pay, credit card, and PayPal, all served
  by one Shopify checkout in live mode and fully mocked by default. Added
  `lib/cart/store.ts` (localStorage cart), `lib/checkout/*` (methods, Luhn card
  validation, mock order processor, express helper), `app/api/checkout`, and
  `app/checkout` (page + success + cancel). Card numbers are validated for format
  only and never stored.
- Refactored the storefront/cart drawer onto the shared cart hook with Shop Pay +
  PayPal express buttons and a Checkout · Credit Card button. Added `docs/checkout.md`.

## 2026-06-29 14:56 AEST

Reset local main to origin/main, discarding local edits

Synced the local working copy up to the published main branch at the
user's request.

- Ran `git reset --hard origin/main`, moving local `main` from 8fc5704 to
  d10b05b (7 commits forward) so the checkout now includes the Shopify
  cart/checkout integration, ideas/learning docs, and launch checklist.
- Discarded the only uncommitted changes (stale `.ai/WORKLOG.md` and
  `README.md` edits from earlier this session) as the user explicitly
  asked to drop local changes.
- Gitignored `.claude/` was untouched, so local settings (worktree
  bgIsolation "none") and the Stop hook survive the reset.
- README.md left unchanged; the upstream version already reflects the
  current Shopify-integrated state.

## 2026-06-29 15:03 AEST

Recommend lightweight terminal markdown readers

Answered a learning question about reading the project's markdown docs
(e.g. docs/web-app-learning-guide.md) with minimal Mac battery use.

- Recommended `glow` (`brew install glow`; `glow -p <file>`) as the
  primary low-energy terminal renderer, since it avoids the Electron
  overhead of VS Code / Typora / Obsidian.
- Listed `bat` and `mdcat` as terminal alternatives and native Quick
  Look (Spacebar in Finder, plus the QLMarkdown cask) as a zero-install
  option.
- No project code or docs changed; README left unchanged as it already
  reflects the current Shopify-integrated state.

## 2026-06-29 15:07 AEST

Explain headless commerce concept to learner

Answered a learning question about whether one backend serving multiple
frontends in a shopping project means "headless".

- Confirmed the project's Next.js storefront on top of Shopify's API is
  already a headless setup: backend (Shopify: products, cart, checkout)
  decoupled from the frontend (the GoldRose Next.js head) via API calls.
- Clarified that decoupling via API is the definition of headless, while
  serving many heads (web, app, kiosk) is a benefit, not the definition.
- No project code or docs changed; README left unchanged as it already
  reflects the current Shopify-integrated state.

## 2026-06-29 15:12 AEST

Explain why choose headless commerce

Answered a learning follow-up on why a project would need a headless
architecture, with trade-offs framed for the GoldRose storefront.

- Covered the wins: design freedom beyond Shopify themes, CDN/Next.js
  performance, one backend serving many frontends, best-tool-per-job,
  and brand differentiation for a luxury DTC product.
- Covered the costs: more to build and maintain, some Shopify features
  not free out of the box, and more moving parts to break.
- Concluded headless earns its keep here because the storefront
  experience is the brand's competitive advantage and a strong learning
  vehicle.
- No project code or docs changed; README left unchanged as it already
  reflects the current Shopify-integrated state.

## 2026-06-29 15:14 AEST

Clarify Shopify backend-only and alternatives

Answered a learning follow-up on whether Shopify must be the backend and
why it feels flexible.

- Explained Shopify supports headless backend-only use first-class via
  the Storefront API (Hydrogen/Oxygen), which is what this project does.
- Noted the backend is replaceable: Medusa, Vendure, Saleor, Swell,
  BigCommerce, Commerce.js, or just Stripe are alternatives, since
  headless is a pattern, not a Shopify-specific feature.
- Covered Shopify's two consumption modes (themes vs headless) and the
  caveats: paid hosted service and checkout/payment rules are theirs.
- No project code or docs changed; README left unchanged as it already
  reflects the current Shopify-integrated state.

## 2026-06-29 15:21 AEST

Explain headless vs full-Shopify using this repo

Read the repo and answered learning questions about whether to use
Shopify for both front and back, or keep this frontend headless.

- Confirmed current state from the code: Next.js storefront with
  lib/shopify + app/api/shopify/cart in mock mode; no real Shopify store
  connected yet (matches README "What Is Not Real Yet").
- Explained that going full-Shopify (theme) leaves the custom Next.js UI
  unused, while headless (Path B) keeps this repo as the frontend; the
  non-UI work (products, business rules, docs) survives either way.
- Noted connecting is the README M2 steps: real variant IDs, .env.local,
  SHOPIFY_MODE=live.
- Clarified Shopify plans are not cheaper for backend-only use; the
  Storefront API ships on paid plans and transaction fees still apply
  (flagged exact prices need verifying on shopify.com).
- Gave simplified product/cart/checkout flow examples for custom
  frontend talking to Shopify backend.
- No project code or docs changed; README verified accurate and left
  unchanged.

## 2026-06-29 15:39 AEST

Explain shopifyVariantId and where to source it

Answered a learning question about the shopifyVariantId placeholders in
lib/products.ts and how to obtain real values.

- Explained Shopify's product-vs-variant model and that checkout adds a
  variant (gid://shopify/ProductVariant/...), not a product.
- Pointed to the current fake placeholders in lib/products.ts (lines 31,
  55, 79) and the matching shopifyProductId fields.
- Described three ways to get real IDs: admin variant URL (wrap the
  number in gid:// form), the Storefront/Admin API (returns gid://
  directly), or a CSV export.
- Stressed sequence: real variant IDs only exist after the store and
  products are created (roadmap M1), then pasted in for M2 go-live.
- No project code or docs changed; README verified accurate and left
  unchanged.

## 2026-06-29 15:46 AEST

Explain purpose of lib/ and variant placement

Answered a beginner question on what lib/ is for and why the variant ID
lives in lib/products.ts.

- Explained lib/ is the conventional home for non-UI data and logic
  (products.ts, business.ts, shopify/), distinct from app/ pages and
  components/ UI.
- Gave the rationale for keeping shopifyVariantId in lib/products.ts:
  single source of truth, edit data without touching UI, UI stays about
  looks, and a clean seam to later fetch from Shopify's API.
- Framed the two worlds for a Shopify newbie: Shopify admin (clicking,
  no code) vs this repo, with lib/products.ts as the bridge via variant
  IDs; advised learning the admin side first.
- No project code or docs changed; README verified accurate and left
  unchanged.

## 2026-06-29 15:51 AEST

Explain what a SKU is

Answered a beginner question defining SKU (Stock Keeping Unit).

- Explained a SKU is a self-assigned, human-readable code for tracking
  inventory, and decoded the structure of the repo's existing SKUs in
  lib/products.ts (e.g. GR-SIG-001 = brand/product/variant/sequence).
- Contrasted SKU (you invent, for humans/inventory) with
  shopifyVariantId (Shopify generates, for the checkout API).
- Added a practical tip: keep SKUs short, structured, stable, and never
  reused so inventory reports stay trustworthy.
- No project code or docs changed; README verified accurate and left
  unchanged.

## 2026-06-29 15:53 AEST

Clarify one SKU per buyable variation

Answered a beginner follow-up confirming that even a size-only
difference means a separate SKU.

- Explained the rule "one SKU = one combination a customer can pick,"
  each with its own variant ID and stock count, and how it scales with
  options (size x color grids).
- Mapped it to the repo: the three roses are three products with one
  SKU/variant each, and the options field in lib/products.ts is
  display-only text today, not real variants.
- Flagged the real-store decision: any option that changes price or
  needs its own stock must become its own Shopify variant + SKU.
- No project code or docs changed; README verified accurate and left
  unchanged.

## 2026-06-29 15:54 AEST

Note 30-SKU catalog plan in ideas backlog

Captured the owner's plan to grow the catalog to around 30 SKUs.

- Added a new "Catalog plans" section to docs/ideas.md with a 🆕 idea to
  scale from the current 3 placeholder products to ~30 sellable SKUs.
- Recorded implications to triage when accepted: separate products vs
  variants, a variant ID per SKU in lib/products.ts at roadmap M1->M2,
  and storefront navigation/filtering for a larger catalog.
- README left unchanged: the 30 SKUs are a backlog plan, not current
  state; the README still accurately describes the 3-product MVP.

## 2026-06-29 15:55 AEST

Note autonomous-backend direction in ideas

Captured the owner's long-term plan to start headless and gradually
replace the Shopify backend to reach a fully autonomous stack.

- Added an "Architecture direction" section to docs/ideas.md describing
  the strangler-fig approach via the lib/shopify/ seam, with a tiered
  replacement order (catalog/cart first; inventory/orders/shipping/tax
  later; payments last or never, using Stripe rather than self-hosting
  card processing).
- Included guidance to launch on Shopify and earn real sales before
  peeling off any capability.
- Saved the same direction to project memory for future sessions.
- README left unchanged: this is a future direction, not current state;
  README still accurately describes the current headless MVP.

## 2026-06-29 15:57 AEST

Restrict ideas.md to owner's raw ideas only

Applied owner feedback that docs/ideas.md should contain only their own
ideas, without AI-generated elaboration.

- Added a rule at the top of docs/ideas.md: record ideas in the owner's
  own words, no AI descriptions, elaboration, or sub-bullets.
- Replaced my padded "Catalog plans" and "Architecture direction"
  entries with a "From me" section holding the two ideas as one-line
  owner statements (30 SKUs; custom frontend + Shopify backend, then
  gradually replace it to go fully autonomous).
- Left the attributed "From boss" section unchanged.
- Saved the preference to project memory so future sessions keep
  analysis in chat/WORKLOG rather than in ideas.md.
- README left unchanged: no current-state change; it still accurately
  describes the headless MVP.

## 2026-06-29 16:00 AEST

Clarify variant-ID fetch options give same value

Answered a learning question on whether the three ways to get a Shopify
variant ID differ substantially.

- Explained options A (admin URL), B (API), and C (CSV export) all
  return the same variant ID; only the fetch method and formatting
  differ (A/C give a raw number to wrap in gid://; B returns the full
  gid:// string).
- Framed the choice by scale: option A for the current 3 products,
  option B or C when scaling to ~30 SKUs (B natural once the .env.local
  token is set up for go-live).
- No project code or docs changed; README verified accurate and left
  unchanged.

## 2026-06-29 16:02 AEST

Guide beginner through Shopify login and setup

Walked the owner through getting started in Shopify after receiving an
account from their boss, aligned to docs/shopify-integration.md.

- Covered login: invite-email vs username/password paths, admin.shopify
  .com URL, and likely speed bumps (2FA, "no store found").
- Described the post-login admin dashboard/sidebar and advised exploring
  read-only first.
- Mapped the road ahead to the repo's admin checklist (add 3 products,
  set SKUs matching lib/products.ts, prices/inventory, payments/shipping
  /taxes, Storefront API token, copy variant IDs back).
- Added safety notes for working in the boss's real store (avoid
  payments/billing/deletions; ask before risky clicks) and asked which
  login type and store URL they have.
- No project code or docs changed; README verified accurate and left
  unchanged.

## 2026-06-29 16:29 AEST

Advise reusing existing Shopify store, not new

Answered whether the owner should create a new Shopify store after
seeing an existing Active store ("My Store 5", g0pe0h-x8.myshopify.com)
on the login screen.

- Advised against creating a new store: one is already Active, and a new
  one would be empty with its own billing ($1/mo offer is for new paid
  stores).
- Flagged that "My Store 5" looks like a default placeholder name and
  could be either the boss's real store or a leftover test/dev store.
- Recommended confirming with the boss which store is for the AUREA
  project, and inspecting Products + Settings -> Store details to judge
  whether it is fresh/test or the real store, since all later setup
  (products, payments, variant IDs) is tied to one store.
- No project code or docs changed; README verified accurate and left
  unchanged.

## 2026-06-30 15:19 AEST

Log Advanced Shopify plan choice and AUD flag

Recorded the owner's decision to take the Shopify Advanced plan and
surfaced a currency mismatch to confirm.

- Added a "Confirmed Decisions" section to docs/mock-business-decisions
  .md noting Shopify Advanced chosen 2026-06-30 on the $1/mo 3-month
  trial (~$575/mo AUD), with its feature/card-rate highlights.
- Flagged that plan pricing/card rates show in AUD while the storefront
  and docs assume USD and a US launch market; asked the owner to confirm
  store currency and launch market before further setup.
- Updated README "Storefront Decisions To Make" to mark the Shopify plan
  as chosen (Advanced) and add the AUD-vs-USD confirm note.
- Reflects a real decision/state change, hence the README edit.

## 2026-06-30 16:17 AEST

Outline next Shopify setup steps for owner

Answered "what's the next step" after the Advanced plan was chosen.

- Advised confirming the store currency first (Settings -> Store
  details) and checking with the boss whether AUREA sells in USD or AUD,
  since currency is hard to change later and lib/products.ts prices are
  USD today.
- Then add the three products under Products with SKUs matching the code
  (GR-SIG-001, GR-BOX-002, GR-BND-003).
- Restated the remaining roadmap: payments/shipping/tax, Storefront API
  token, copy real variant IDs into lib/products.ts, flip
  SHOPIFY_MODE=live and test.
- No project code or docs changed; README already reflects the plan
  choice and AUD/USD flag, so it was left unchanged.

## 2026-06-30 16:22 AEST

Open Shopify admin in browser; blocked at login

Attempted to drive the owner's Shopify admin via Chrome automation to
continue store setup (currency check, then products).

- Created an MCP browser tab and navigated to admin.shopify.com; it
  landed on the Shopify login screen (email prefilled
  shangrongjie5@gmail.com) because the automation tab is a separate
  session from the owner's already-logged-in tab.
- Did not proceed: entering passwords/verification codes is off-limits,
  especially on the boss's live store. Asked the owner to complete login
  by hand in the automation-opened tab, then report back.
- Set the plan once logged in: read-only check of Settings -> Store
  details currency first, confirm before any changes.
- No project code or docs changed; README verified accurate and left
  unchanged.

## 2026-06-30 16:24 AEST

Re-check Shopify tab; still on login screen

Re-screenshotted the automation tab to verify login state.

- Confirmed the automation-controlled tab still shows the Shopify login
  page; the owner's existing logged-in tab is a separate session the
  extension cannot control.
- Asked the owner to log in within that exact automation tab and to
  check whether their logged-in Shopify is under a different Chrome
  profile than the one the extension is attached to.
- No project code or docs changed; README verified accurate and left
  unchanged.

## 2026-06-30 16:32 AEST

Confirm automation cannot reach logged-in session

Investigated whether the extension could control the owner's existing
logged-in Shopify tab.

- Listed connected browsers: only one (Browser 1, local macOS); selected
  it. The MCP tab group still exposes only its own tab, not the owner's
  separately logged-in tab.
- Navigating the controllable tab to the store admin
  (admin.shopify.com/store/g0pe0h-x8) redirected back to login: the
  automation tab's session is isolated and not authenticated, and cookies
  are not shared with the owner's tab.
- Stopped retrying to avoid a loop; offered two paths: (A) owner logs in
  once in the automation tab so I can drive it, or (B) I guide by text
  while the owner clicks in their logged-in tab, starting with the
  Settings -> Store details currency check.
- No project code or docs changed; README verified accurate and left
  unchanged.

## 2026-06-30 16:36 AEST

Establish automation/login tab mismatch; pick path

Diagnosed why automation could not reach the goldrose admin and chose a
way forward.

- Confirmed the owner's logged-in "goldrose" tab and the automation's
  controllable tab (id 2052668844) are different tabs with separate
  sessions; a fresh screenshot of the automation tab still shows the
  Shopify login page despite the owner being logged in elsewhere.
- Stopped retrying to avoid a loop. Recommended Option B (text guidance
  while the owner clicks in their logged-in tab) over Option A (sign in
  within the exact automation tab).
- Next concrete step requested: read Settings -> Store details currency
  (USD vs AUD) to unblock product setup.
- No project code or docs changed; README verified accurate and left
  unchanged.

## 2026-06-30 16:40 AEST

Confirm extension session isolated from Shopify login

Verified the browser automation cannot share the owner's Shopify login.

- Owner deleted the tab they were viewing; the MCP tab group was gone,
  confirming that tab had been the automation's controllable tab.
- Recreated a fresh tab group and navigated directly to the goldrose
  admin (store g0pe0h-x8); it redirected to the Shopify login page
  again, proving the extension runs in an isolated session not logged
  into Shopify (login does not carry over from the owner's normal Chrome).
- Restated the two options: (A) sign in within the exact automation tab
  showing the login, or (B) text guidance in the owner's logged-in tab;
  recommended B to make progress, starting with the store currency.
- No project code or docs changed; README verified accurate and left
  unchanged.

## 2026-06-30 16:43 AEST

Verify automation tab still not logged in

Owner asked whether I am logged in; screenshotted to check rather than
assume.

- Confirmed the automation tab still shows the Shopify login page (email
  shangrongjie5@gmail.com prefilled); not authenticated.
- Reiterated that login must happen in this exact automation tab (I
  cannot enter credentials), or switch to text guidance starting with
  the store currency from Settings -> Store details.
- No project code or docs changed; README verified accurate and left
  unchanged.

## 2026-06-30 16:44 AEST

Handle browser page check with no open tab

Owner asked to check the page in the Chrome working group; verified
state before acting rather than assuming a tab existed.

- Loaded the claude-in-chrome tools and called tabs_context_mcp; no MCP
  tab group exists for this session, so there is no page to inspect.
- Did not auto-create a tab or guess a destination; asked the owner
  which URL to open (offered to start the local dev server if they want
  the storefront).
- No project code or docs changed; README verified accurate and left
  unchanged.

## 2026-06-30 16:48 AEST

Reopen Shopify admin; await owner login in tab

Owner asked me to work on the Shopify store and to ask for anything
needing login.

- Created a fresh MCP tab group and navigated to the goldrose admin
  (store g0pe0h-x8); it redirected to the Shopify login page with email
  shangrongjie5@gmail.com prefilled, confirming the automation session
  is still not authenticated.
- Cannot enter credentials or authenticate myself, so handed login back
  to the owner with step-by-step instructions to sign in within this
  exact automation tab (tabId 2052668862); login elsewhere will not
  carry over to the isolated automation session.
- Blocked pending owner login; no store work performed yet.
- No project code or docs changed; README verified accurate and left
  unchanged.

## 2026-06-30 16:50 AEST

Report login tab state; screenshots blocked on domain

Owner asked what I can currently see in the browser.

- Checked the automation tab (tabId 2052668862): still on the Shopify
  login page (accounts.shopify.com/lookup), not yet authenticated.
- Screenshot returned "Permission denied for this action on this
  domain" for accounts.shopify.com, so I have no visibility into the
  login screen itself; relayed this to the owner.
- Asked the owner to complete login until the tab reaches
  admin.shopify.com (where visibility worked before), and to grant the
  extension site permission for the Shopify domains if screenshots stay
  blocked after login.
- Still blocked pending owner login; no store work performed.
- No project code or docs changed; README verified accurate and left
  unchanged.

## 2026-06-30 16:52 AEST

Review project state and advise next step

Owner asked me to read everything and say what to do next. Read README,
.ai/HANDOFF.md, .ai/WORKLOG.md, and project memory; gave a prioritized
recommendation. No code or state change this session.

- Confirmed status: storefront + unified Shop Pay/card/PayPal checkout
  are built and passing in mock mode; the project is blocked at M1
  (stand up Shopify), a business/account task only the owner can do.
- Diagnosed the recent dead end: ~10 WORKLOG entries today were all the
  isolated browser-automation tab failing to reach the boss's
  logged-in Shopify session; advised stopping that approach in favor of
  text-guided clicks in the owner's own logged-in tab.
- Named the true blocker as a decision, not a task: confirm AUD vs USD
  currency with the boss before any store setup, since currency is hard
  to change after orders begin and lib/products.ts prices assume USD.
- Flagged 507 lines of uncommitted doc changes (mostly this WORKLOG)
  and offered to commit them.
- README left unchanged: it already reflects current state (mock-mode
  checkout, Advanced plan chosen, AUD/USD flag).

## 2026-06-30 16:52 AEST

Try goldrose-9372 admin; still bounced to login

Owner clarified their admin URL is the goldrose-9372 store and asked me
to continue with it.

- Navigated the automation tab (tabId 2052668862) to
  admin.shopify.com/store/goldrose-9372/; it redirected back to the
  Shopify login page, confirming the automation session is still not
  authenticated for this store either.
- Reiterated the root cause: the owner's normal-Chrome login does not
  carry into the isolated automation tab; login must be completed inside
  that exact tab. Screenshots remain blocked on accounts.shopify.com so
  I cannot assist during login itself.
- Still blocked pending owner login; no store work performed.
- No project code or docs changed; README verified accurate and left
  unchanged.

## 2026-06-30 16:56 AEST

Help owner locate hidden automation tab

Owner reported they cannot see/find the automation tab to log in.

- Confirmed via tabs_context that the tab still exists (tabId
  2052668862, "Log in — Shopify") inside the extension's colored tab
  group, just hidden behind other Chrome windows.
- Gave macOS steps to surface it: Cmd+Shift+A tab search for "Log in",
  the Chrome Window menu, or Cmd+` to cycle windows to the colored tab
  group; then complete login in that exact tab.
- Still blocked pending owner login; no store work performed.
- No project code or docs changed; README verified accurate and left
  unchanged.

## 2026-06-30 17:04 AEST

Confirm prior reset complete; no new work

Session opened after a context compaction with no new user request.

- Verified the previously requested `git reset --hard origin/main` and its
  WORKLOG entry were already complete; nothing further to do.
- Made no code or doc changes this session. Pre-existing uncommitted edits
  (README.md, docs/ideas.md, docs/mock-business-decisions.md,
  docs/web-app-learning-guide.md) are carried over from earlier sessions and
  were left untouched.
- README.md verified accurate and left unchanged.

## 2026-06-30 17:06 AEST

Attempt to reopen Shopify; extension disconnected

Owner asked to open the Shopify page in Chrome.

- tabs_context_mcp reported the Claude browser extension is not
  connected, so no tab could be created or controlled.
- Asked the owner to verify the extension is installed/running, that
  Chrome is logged into the same claude.ai account, and to restart
  Chrome if needed, then retry.
- Blocked pending extension reconnection; no store work performed.
- No project code or docs changed; README verified accurate and left
  unchanged.

## 2026-06-30 17:08 AEST

Reach authenticated goldrose Shopify admin

Owner asked to retry; the browser extension reconnected this time.

- Created a fresh MCP tab group, navigated to
  admin.shopify.com/store/goldrose-9372/, and it loaded the admin
  WITHOUT redirecting to login — the automation session is now
  authenticated for the goldrose store.
- Screenshot confirmed the admin home (UI in Chinese): nav for
  Orders/Products/Customers/Growth/Discounts/Content/Markets/Finance/
  Analytics, sales channels Online Store/Agentic/Point of Sale, and the
  goldrose account chip.
- Asked the owner which admin task to start with (e.g. Settings -> store
  currency, Products, Orders).
- No project code or docs changed; README verified accurate and left
  unchanged.

## 2026-06-30 17:10 AEST

Read store currency; flag USD vs AUD mismatch

Owner asked to do the next steps; per prior worklog that meant reading
Settings -> Store details currency to unblock product setup.

- Opened Settings -> General (常规) on the goldrose-9372 admin and read
  Store defaults: store currency is USD ($), while the business entity,
  store address (1B Vangelis Street, Rouse Hill NSW 2155), and backup
  region are all Australia.
- Surfaced the mismatch to the owner: USD currency on an AU-based store
  would price products in USD. Did not change the currency (account
  setting + Shopify locks base currency after first sale); asked the
  owner to decide USD vs AUD before product pricing setup.
- No project code or docs changed; README verified accurate and left
  unchanged.

## 2026-06-30 17:32 AEST

Create live GoldRose catalog in Shopify; confirm USD

Owner confirmed the store sells into the US (USD) and asked to push
toward a working MVP, then to publish products live.

- Settings -> General: read store defaults; base currency is USD ($)
  while the business entity/address/region are Australian. Owner
  confirmed USD is intentional. Recorded the decision in
  docs/mock-business-decisions.md (replaced the "currency to confirm"
  warning with a confirmed USD entry).
- Created all 3 GoldRose products in the live store (goldrose-9372) via the
  Shopify admin, each Active and on all 3 sales channels, using the
  catalog in lib/products.ts (names, USD price, compare-at, cost-per-
  item, SKU, inventory) plus the required origin copy "Imported from
  China. Ships from US inventory.":
  - GR-SIG-001 Signature 24K Gold Rose  $49.99 / qty 420 / id 7607585865774
  - GR-BOX-002 Boxed Keepsake Rose      $64.99 / qty 260 / id 7607586160686
  - GR-BND-003 Premium Gift Bundle      $79.99 / qty 140 / id 7607586193454
  Verified all three on the product list with correct stock/status.
- Recorded the real product IDs and a go-live checklist (Storefront API
  token, variant IDs, images, SHOPIFY_MODE flip) in
  docs/mock-business-decisions.md. Storefront still defaults to mock mode.
- Flagged that the "24K gold" wording and landed costs remain unverified
  per the doc; published as-is per the owner's explicit go-live choice.
- No app code changed (catalog/variant IDs in lib/products.ts untouched),
  so README remains accurate and was left unchanged.

## 2026-06-30 17:38 AEST

Verify product images; hit browser upload limitation

Owner asked to add the repo product images to the live Shopify products.

- Inspected public/products/: 9 images present. Per lib/products.ts the
  three product shots are gold-rose-stand.jpg (Signature),
  gold-rose-box.jpg (Boxed Keepsake), and gold-rose-detail.jpg (Premium
  Bundle); the rest are hero/lifestyle. Viewed all three to confirm fit.
- Noted the supplier imagery itself reads "Dipped in 24K Gold" and "24
  carat gold plated stem and leaves", which substantiates "24K gold
  dipped/plated" wording (real rose, gold-plated, not solid gold).
- Attempted to upload gold-rose-stand.jpg to the Signature product via
  the Chrome extension file_upload tool; it rejected host filesystem
  paths in this environment ("no longer accepts host filesystem paths"),
  including a copy placed in the session job dir. So programmatic upload
  of repo images is not possible here.
- Handed off to the owner: drag the 3 mapped files onto each product's
  media area (full quality), or share them into chat for a reduced-
  quality screenshot upload. Provided alt-text suggestions from the repo.
- No app code or docs changed this session; README left unchanged.

## 2026-06-30 17:45 AEST

Confirm no in-browser path for repo image upload

Owner asked whether there is any other way to upload the images.

- Tested navigating the automation tab to a file:// URL of a repo image;
  the extension blocks browser-internal/file URLs. Combined with the
  broken file_upload (host paths rejected) and the un-automatable native
  OS file picker, there is no way to push repo files into Shopify from
  the automation side directly.
- Identified the one working automated path: if the owner drags the 3
  images into the chat, they become session-owned files that upload_image
  can place into each product at full quality. Otherwise the owner can
  drag-drop them onto Shopify's media box (same quality).
- Awaiting the owner to share the images or upload them manually.
- No app code or docs changed this session; README left unchanged.

## 2026-06-30 17:50 AEST

Verify owner-uploaded product images in Shopify

Owner reported uploading the product images and said done.

- Checked the product list: all 3 products now have images attached, so
  the manual upload worked. Inventory/status unchanged (Active; 140/260/
  420 in stock).
- Zoomed the thumbnails to verify mapping. Signature looks like the
  intended gold-rose product shot, but Boxed Keepsake appears to show a
  Valentine lifestyle collage and Premium Bundle a candlelit-dinner shot
  rather than gold-rose-box.jpg / gold-rose-detail.jpg.
- Flagged the possible mismatch to the owner and asked whether the
  lifestyle images are intentional or should be swapped to the clean
  product shots; also offered to set alt text on all three.
- No app code or docs changed this session; README left unchanged.

## 2026-06-30 17:56 AEST

Demo full storefront workflow end to end locally

Owner wanted to prove the tech stack works so the boss can review;
accuracy/realness not required (mock mode acceptable).

- Confirmed owner-uploaded product images are attached to all 3 products
  (kept as-is per owner; mapping accuracy not required for the demo).
- Started the Next.js dev server (next dev, Next 16.2.9) and drove the
  storefront in the browser at http://localhost:3000:
  - Homepage renders GoldRose brand, hero, hero product, USD pricing
    ($89.99 -> $49.99, SAVE 44%) and origin copy.
  - Add to Cart opens the cart slide-out (Signature Rose, gift box, qty,
    $49.99 subtotal) with Shop Pay / PayPal / credit-card options.
  - Checkout page shows order summary with shipping ($5.95) and total
    ($55.94), express wallets, and card form; mock mode (no real charge).
- Left the dev server running and the tab on the homepage for the boss
  to review live; documented restart (npm run dev) and that live
  transacting still needs the Storefront API token + SHOPIFY_MODE flip.
- No app code or docs changed this session; README accurately describes
  the mock-mode app and was left unchanged.

## 2026-06-30 18:03 AEST

Check payments status; explain real money flow

Owner clarified "end to end" means a real customer pays and money lands
in the bank, and (being new) asked how the money flow works.

- Read Settings -> Payments on goldrose-9372: Shopify Payments is NOT
  set up (shows "Complete setup"); PayPal shows "Setup incomplete". So
  no payment provider is active and the store cannot take real money yet.
- Explained the 3-layer model: storefront (frontend) only collects the
  order and never touches money; Shopify's hosted Checkout takes the
  card; Shopify Payments charges it and pays out to the owner's bank.
  Clarified that money does not flow through the frontend.
- Laid out go-live order: (1) owner activates Shopify Payments (bank +
  identity; owner-only, I cannot enter financial credentials), (2) I
  publish/wire a storefront (Shopify native theme OR custom Next.js +
  live Shopify checkout), (3) test order then small real order to verify
  payout.
- No changes made (explanation only); README left unchanged.

## 2026-06-30 18:19 AEST

Explain the "Opening soon" page and launch path

Owner showed the Shopify "Opening soon" password page (goldrose-9372)
and asked how to launch the store.

- Clarified the two senses of "launch": (1) the literal Shopify
  password page is removed via Online Store -> Preferences -> Password
  protection, but advised against doing it yet because the live product
  is the custom AUREA storefront, not Shopify's default theme.
- Walked through the real launch path from docs/launch-checklist.md:
  confirm business facts (Phase 1), stand up Shopify as the headless
  checkout engine + Storefront API token (Phase 2), connect this site
  and flip SHOPIFY_MODE=live with a real test order (Phase 3), add
  required policy pages + compliance (Phase 4), swap the placeholder
  domain and deploy (Phase 5).
- Noted the store is still entirely in mock mode and offered next
  actionable steps (wire Shopify, build policy pages, or capture
  newsletter emails).
- Explanation only; no app code or docs changed. README still
  accurately describes the mock-mode app and was left unchanged.

## 2026-06-30 18:22 AEST

Advise on Shopify Payments country/entity eligibility

- Answered an owner question about Shopify's "Set up Shopify
  Payments" entity step (individual / registered business /
  non-profit) and why it pre-detected Australia.
- Explained detection comes mainly from the store's country
  setting, then account/billing country, then IP/locale.
- Flagged the key constraint: Shopify Payments is not available
  for mainland China, and eligibility follows the owning entity's
  country and payout bank account, not the customer market. Since
  the store is being built for a China-based boss, this determines
  whether Shopify Payments is usable at all.
- Held off on a recommendation pending which country/entity and
  bank account will own the store and receive payouts; noted
  changing store country later is costly (re-KYC / new store).
- No code or content changes this session; advisory only.

## 2026-06-30 18:27 AEST

Flag China payment-processor blocker in README

- Answered "what's left before real orders/money flow" by mapping
  the current state to docs/launch-checklist.md (M0–M5) and the
  mock vs live SHOPIFY_MODE go-live line.
- Surfaced that the launch checklist and README assumed Shopify
  Payments works, but it is unavailable for mainland China. Since
  the store is being built for a China-based owner, this is a
  blocker that sits above M1.
- Updated README.md to record the processor-eligibility decision:
  added it to "Storefront Decisions To Make" and to the M1
  milestone, noting Shop Pay can't be used if the owning entity /
  bank account is in mainland China.
- No code changes; documentation only.

## 2026-06-30 18:30 AEST

Clarify Shopify Payments is a merchant-side rule

- Answered whether "Shopify Payments not available for mainland
  China" refers to the paying customer or the receiving account.
- Clarified it is purely merchant-side: eligibility follows the
  owning entity's country and the payout bank account's country,
  not where the buyer is. Customers can be anywhere, including
  China; serving Chinese buyers is a separate question of offering
  international cards / Alipay / WeChat Pay.
- No project files changed; README already records the China
  processor blocker added in the prior session. Documentation and
  advisory only.

## 2026-06-30 20:06 AEST

Open Shopify Payments setup; flag merchant-entity issue

Owner asked to be guided through activating Shopify Payments (new to it).

- Opened the Shopify Payments setup interview from Settings -> Payments
  (URL shows legalEntityCountry=AU). A mis-aimed click also opened a
  PayPal business-signup tab; closed it without proceeding (account
  creation is owner-only).
- Owner asked why it detected Australia and noted the real situation:
  boss is in Hong Kong, products from China, selling to US customers.
- Explained: AU was auto-detected from the store's business address
  (Rouse Hill NSW) and AUD billing. Flagged that the "registered with
  the government of Australia" checkbox is a legal declaration and must
  be true. Shopify Payments is country-locked and pays out to a bank in
  the registered country; Hong Kong is not supported. Laid out the three
  honest paths (genuine AU business / new US entity / non-Shopify
  provider) and recommended confirming the legal merchant of record with
  the boss/accountant before continuing. Did not enter any data.
- Paused setup pending the owner's entity decision.
- No app code or docs changed this session; README left unchanged.

## 2026-06-30 20:40 AEST

Close the demo loop: capture orders and show them at /orders

Owner goal: let the boss see the tech stack functioning end to end — a
visitor can click, pay, and the order/money goes the right way. Not about
selling the real product yet.

- Recorded the goal in docs/demo-goal.md (demo script + real-vs-simulated)
  and linked it from a new README "Current Goal" section.
- New lib/orders/store.ts: file-backed (.data/orders.json, gitignored)
  capture of completed orders. Demo stand-in for a real Shopify order record.
- app/api/checkout/route.ts now saves the order on a successful mock result
  (card + mock express). Live external-redirect results are deliberately not
  captured (order not placed until Shopify checkout completes). Write failures
  never fail the checkout.
- New app/orders/page.tsx: noindex, force-dynamic order log with item lines,
  totals, method/last-four, timestamp, and a running order count + revenue.
- Checkout success page now links straight to /orders ("View order log →").
- Verified end to end against `npm run start`: POSTed a card order and a Shop
  Pay order; both persisted to .data/orders.json and rendered on /orders.
  `npm run lint` and `npm run build` both pass. Test .data/ removed after.

Open decision (not yet made): to make the *pay* step a real sandbox charge on
a provider dashboard, pick Shopify test mode (chosen backend, but blocked on
the merchant-entity question) or a payment sandbox like Stripe test mode
(fastest for a demo, not the production backend). Mock loop stands until then.

## 2026-07-08 15:59 AEST

Re-apply README checkout fixes lost to hard reset

Session summary: confirmed handleShopifyCheckout() existed only in
the old learning guide, rewrote the guide as function traces, then
the owner ran git reset --hard origin/main, which discarded that
uncommitted work (plus this session's earlier worklog entries) and
brought in remote 5524139 with its own top-down guide rewrite and
checkout code changes.

- Explained that hard-reset content that was never committed,
  stashed, or staged is unrecoverable through git; the trace-based
  guide survives only in this session and can be regenerated on
  request (owner has not yet decided).
- Re-applied the README corrections on top of the new remote README:
  structure tree now lists checkout/orders pages, api/checkout, all
  docs, and lib/cart|checkout|orders; /api/checkout documented as
  the active endpoint with app/api/shopify/cart marked as no longer
  called by the UI; MVP-assumptions and What Works Now checkout
  lines corrected; "shopify-checkout branch" wording updated to
  merged main.
- Noted current-state facts from 5524139 in the README: Shop Pay is
  built but hidden (expressMethods filter), and the signature rose
  is temporarily $1 for the live PayPal test.

## 2026-07-08 16:10 AEST

Verify learning guide alignment with current code

Owner asked to make sure docs/web-app-learning-guide.md (the
top-down rewrite from remote commit 5524139) matches the repo.

- Checked every factual claim against source: expressMethods snippet
  location (lib/checkout/methods.ts), live-mode card refusal in
  lib/checkout/mock.ts, TEMP $1 price comment in lib/products.ts,
  ld+json in app/page.tsx, SHOPIFY_MODE default in
  lib/shopify/config.ts, cartCreate mutation and secret token header
  in lib/shopify/client.ts, permalink format, quantity caps,
  saveOrder to .data/orders.json, and force-dynamic on /orders.
- All claims verified accurate; the guide was written against the
  same commit as the code, so no edits were needed.
- README.md unchanged this turn; it was re-corrected earlier today
  and still reflects the current checkout flow.

## 2026-07-08 16:17 AEST

Add deploy section to README; answer runtime questions

Owner asked where the storefront code runs and how updates reach
the live Vercel site.

- Confirmed the three-places mental model from the learning guide:
  browser (untrusted UI + localStorage cart), Next.js server on
  Vercel (trusted pricing, API routes, order log), and Shopify
  (hosted checkout in live mode only; not contacted in mock mode).
- Determined Vercel deploys via its GitHub integration: the only
  remote is github.com/CharlesChi715/goldrose-storefront, no local
  .vercel/ directory exists, so pushes to main auto-deploy to
  production and other branches get preview URLs.
- Added a "How To Deploy" section to README.md documenting the
  push-to-deploy workflow, dashboard-managed env vars, and the
  ephemeral /orders demo log resetting on each deploy — the README
  covered local run steps but not deployment.

## 2026-07-08 16:21 AEST

Confirm .vercel already ignored; no changes needed

Owner asked whether .vercel should be added to .gitignore on this
freshly cloned device.

- Verified .gitignore line 38 already ignores .vercel (part of the
  default Next.js template) and that no .vercel files are tracked;
  the ignore rule travels with every clone, so no action needed.
- Explained the folder only appears when the Vercel CLI links a
  machine (stores projectId/orgId) and is machine-specific state
  that Vercel docs say not to commit; GitHub-integration deploys
  never create it.
- No repo files changed this turn; README still accurate.

## 2026-07-08 16:25 AEST

Explain CLI-linked device; note CLI path in README

Owner revealed their original device has the Vercel CLI and a
.vercel folder and asked what that implies.

- Explained the folder means that machine ran `vercel link`/deploy
  once and can deploy or manage the project from the terminal
  (vercel --prod, env pull, logs) without going through GitHub;
  the GitHub push-to-deploy integration is unaffected and remains
  the primary path.
- Warned that `vercel --prod` ships the folder's current contents,
  including uncommitted code, so GitHub pushes are preferred for a
  production history that maps to commits.
- Updated README's How To Deploy section: replaced "there is no
  manual deploy step" with accurate wording and added a short note
  on the CLI-linked-machine deploy path and its caveat.

## 2026-07-08 16:33 AEST

Walk through price-tampering example of golden rule

Owner asked for a concrete example of the learning guide's golden
rule (server re-checks anything a customer could tamper with).

- Traced the rose price through three files: cart lines in
  lib/cart/store.ts deliberately carry no price field;
  sanitizeLines() in app/api/checkout/route.ts copies only
  productId/option/quantity so injected price fields are never
  read; resolveOrderLines() in lib/checkout/mock.ts re-prices every
  line from lib/products.ts.
- Showed a forged curl POST with "price": 1 and explained why it
  still yields a correctly priced order: the trusted side recomputes
  value rather than detecting lies.
- Teaching answer only; no repo files changed and README remains
  accurate.

## 2026-07-08 16:34 AEST

Explain intersection-type syntax behind CartLineView

Owner asked what the `export type CartLineView = CartLine & {...}`
syntax means.

- Explained TypeScript intersection types: `&` merges CartLine with
  the extra `product: Product` and `lineTotal: number` properties,
  producing an enriched "view" type for rendering cart lines.
- Noted the near-equivalent `interface ... extends` form and the
  trade-off (extends errors on conflicting property types, while an
  intersection silently collapses them to never).
- Teaching answer only; no repo files changed and README remains
  accurate.

## 2026-07-08 17:00 AEST

Explain sanitizeLines allowlist push line

Owner (in a new conversation branch) asked what
lines.push({ productId, option, quantity }) does in
app/api/checkout/route.ts.

- Explained the mechanics: .push appends to the clean array being
  built, and { productId, option, quantity } is object shorthand
  that constructs a fresh object from the three extracted-and-
  validated variables.
- Highlighted the security point: the customer's original object is
  never copied (no lines.push(entry)), so forged fields like
  "price" never cross into processCheckout — an allowlist
  (copy-what-you-allow) rather than delete-what-you-fear.
- Teaching answer only; no repo files changed and README remains
  accurate.

## 2026-07-08 17:02 AEST

Share editor shortcuts for finding function references

Owner asked for the keyboard shortcut to see all references to a
function from its definition in this repo.

- Listed VS Code/Cursor on macOS: Shift+F12 peeks references
  inline, Option+Shift+F12 opens the References panel, F12 jumps
  to definition, Ctrl+Minus jumps back.
- Mentioned JetBrains (Option+F7) and Vim/Neovim LSP (gr)
  equivalents, and noted results are type-aware via the TypeScript
  language server rather than text matches.
- Teaching answer only; no repo files changed and README remains
  accurate.

## 2026-07-08 17:05 AEST

Explain request direction of the POST route handler

Owner asked which end sends and which receives for
`export async function POST(request: Request)`.

- Clarified it is the receiving end: the browser sends the HTTP
  POST and the handler in app/api/checkout/route.ts runs on the
  server (Vercel function in production) to receive it.
- Located the sending ends in the repo: fetch("/api/checkout") in
  app/checkout/page.tsx:139 and lib/checkout/client.ts:43.
- Walked the round trip (click -> fetch -> handler -> Response back
  to the browser) and tied it to the learning guide's golden rule:
  this handler is the first code on trusted hardware.
- Teaching answer only; no repo files changed and README remains
  accurate.

## 2026-07-08 17:07 AEST

Explain what triggers the POST route handler

Owner asked what causes POST() in app/api/checkout/route.ts to run.

- Explained Next.js App Router routing: a route.ts file maps its
  folder path to a URL, and each exported HTTP-method-named
  function handles that verb; the framework calls POST() once per
  incoming POST to /api/checkout.
- Listed possible senders: the checkout page's fetch (intended) and
  any external client such as curl or Postman, since the endpoint
  is public.
- Tied this to the learning guide: you cannot control the trigger,
  only the handler's behavior, hence server-side re-validation;
  noted unexported methods get an automatic 405.
- Teaching answer only; no repo files changed and README remains
  accurate.

## 2026-07-08 17:09 AEST

Clarify route.ts and POST as framework contracts

Owner asked whether POST(request) and placing the handler in
route.ts are conventions.

- Explained they are enforced naming contracts (convention over
  configuration), verified against the docs bundled in this repo's
  Next.js at node_modules/next/dist/docs: only route.ts files
  become endpoints, and only the seven HTTP-method-named exports
  (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS) are routed.
- Separated the freely chosen parts: parameter name, the /api/ URL
  prefix, and the handler body; noted Next.js auto-implements
  OPTIONS with an Allow header when not exported.
- Teaching answer only; no repo files changed and README remains
  accurate.

## 2026-07-08 17:15 AEST

Confirm /api/checkout exists; untangle page vs route

Owner asked whether app/api/checkout exists in this repo.

- Confirmed app/api/checkout/route.ts serves POST /api/checkout,
  alongside the repo's other endpoint app/api/shopify/cart/route.ts.
- Untangled the two similarly named folders: app/checkout/page.tsx
  is the customer-facing /checkout screen, while
  app/api/checkout/route.ts is the data endpoint its JavaScript
  posts to -- the page.tsx vs route.ts naming contract in action.
- Teaching answer only; no repo files changed and README remains
  accurate.

## 2026-07-08 17:20 AEST

Map every reference to /api/checkout in the repo

Owner asked where app/api/checkout shows up across the repo.

- Grouped the seven files by role: the endpoint definition
  (app/api/checkout/route.ts), two call sites, and docs
  (README.md, docs/checkout.md, docs/web-app-learning-guide.md,
  .ai/HANDOFF.md, .ai/WORKLOG.md).
- Verified the two call sites are distinct purchase paths, not
  duplication: app/checkout/page.tsx:139 for the checkout page and
  lib/checkout/client.ts:43 (startExpressCheckout), imported by
  components/Storefront.tsx for the express button.
- Noted both paths converge on one handler, so server-side
  re-validation lives in a single place.
- Teaching answer only; no repo files changed and README remains
  accurate.

## 2026-07-08 17:23 AEST

Confirm fetch-to-route matching happens server-side

Owner confirmed understanding that fetch("/api/checkout") reaches
the route file under that folder; sharpened two details.

- Corrected the filename to route.ts (singular); routes.ts would be
  ignored and 404.
- Explained fetch knows nothing about folders: the relative URL is
  expanded by the browser against the current origin (localhost in
  dev, production domain live), and the Next.js server's router
  maps the path to app/api/checkout/route.ts at request time.
- Noted the URL is the contract between the two ends, which is what
  makes a future backend swap (per the autonomous-backend plan)
  invisible to the frontend.
- Teaching answer only; no repo files changed and README remains
  accurate.

## 2026-07-08 17:38 AEST

Explain where the route handler's server runs

Owner asked whether "the server" is Vercel by default.

- Split by environment: npm run dev runs a local Node server on
  the owner's Mac (localhost:3000); in production this repo's
  handlers run as Vercel serverless functions, spun up per request
  via the GitHub push-to-deploy setup.
- Stressed Next.js is not tied to Vercel: the same code can run on
  any Node host (next start, Docker, a VPS); Vercel is this
  project's hosting choice, not a code dependency.
- Reinforced the trust model: "trusted end" means hardware the
  customer does not control, in both dev and prod.
- Teaching answer only; no repo files changed and README remains
  accurate.

## 2026-07-08 17:41 AEST

Break sanitizers down into three golden-rule moves

Owner asked whether all the sanitize functions in
app/api/checkout/route.ts exist to obey the golden rule.

- Confirmed yes, then split the rule into three techniques the
  file uses: allowlist copying (fresh objects from known fields,
  so injected fields like price are never read), validation
  (quantity 1-20 integer, isPaymentMethodId, JSON checks -> 400),
  and bounding (str() trims and caps every string length).
- Pointed out the rule's other half lives downstream: re-pricing
  in resolveOrderLines() (lib/checkout/mock.ts) ignores customer
  claims about money entirely; sanitize cleans, re-compute trusts
  only the server catalog.
- Noted sanitization doubles as robustness: buggy or stale clients
  get a clean 400 instead of a crash.
- Teaching answer only; no repo files changed and README remains
  accurate.

## 2026-07-08 17:44 AEST

Define API route as data-for-programs endpoint

Owner asked to confirm that an API route is a URL returning data
(JSON) instead of a web page.

- Confirmed the working definition and refined it: the real split
  is audience -- page.tsx returns rendered HTML for humans, while
  route.ts returns whatever Response the handler builds, typically
  JSON consumed by page JavaScript.
- Grounded it in the repo: every exit in app/api/checkout/route.ts
  is NextResponse.json(body, {status}), and the checkout page turns
  ok:false into a human-facing error message.
- Added two refinements: JSON is customary, not mandatory (text,
  files, redirects, streams all work), and the status code is the
  machine-readable half of the answer (200/400/500, response.ok).
- Teaching answer only; no repo files changed and README remains
  accurate.

## 2026-07-08 17:46 AEST

Define the term API route from its two halves

Owner asked for a plain definition of "API route".

- Defined it by decomposing the term: API = interface for programs
  (URLs and JSON, versus a UI's buttons for humans); route = a path
  the server answers; so an API route is a route whose audience is
  code.
- Contrasted the repo's pair side by side: /checkout from
  app/checkout/page.tsx returns HTML for a human, /api/checkout
  from app/api/checkout/route.ts returns JSON for the page's fetch.
- Listed near-synonyms the owner will encounter: endpoint, backend
  route, and Next.js's own term route handler.
- Teaching answer only; no repo files changed and README remains
  accurate.

## 2026-07-08 17:47 AEST

Explain casual "API" usage and how the terms nest

Owner asked whether people just say "API" for simplicity.

- Confirmed the loose usage and laid out the nesting: the API is
  the whole set of callable URLs (here /api/checkout and
  /api/shopify/cart), an API route/endpoint is one URL, and an API
  call is one request.
- Noted precision matters only for locating problems ("API is
  down" vs "checkout endpoint returns 500").
- Added the other-side usage: "the Shopify API" names someone
  else's service, and /api/shopify/cart is both at once -- an
  endpoint in this repo's API whose job is to call Shopify's.
- Teaching answer only; no repo files changed and README remains
  accurate.

## 2026-07-15 12:01 AEST

Refresh README to match the real Shopify store state

Owner said the README should get updated; verified current facts
against code and worklog before editing.

- Replaced "What Is Not Real Yet" with "What Is Real vs Not Real
  Yet": a real store (goldrose-9372) with published products, real
  variant IDs in lib/products.ts, and a deployed PayPal cart-
  permalink hand-off are now facts; still-not-real items (Shopify
  Payments blocked on the entity decision, tax/shipping, email,
  policies, analytics, domain) kept.
- Corrected the roadmap intro (Shop Pay hidden, store partly stood
  up) and added Progress notes to M1 and M2, both flagging the ⚠️
  $1 test price still in lib/products.ts.
- Added the live PayPal hand-off to What Works Now and .data/ to
  the project-structure tree.
- Did not claim the $1 live PayPal payment completed (unverified on
  this device); worded as "hands the cart to Shopify checkout".
- .ai/HANDOFF.md (dated 2026-06-28) is now stale on the same points
  (still says mock variant IDs); not updated this turn.

## 2026-07-15 13:47 AEST

Record no-op session with no code changes

- Session consisted only of a greeting exchange; no code, docs, or
  config were touched.
- README.md reviewed against session scope: no work occurred that
  would make it stale, so it was left unchanged.

## 2026-07-15 14:09 AEST

Clean mock traces for live store; add learning comments

Store is live and receiving payments (owner-confirmed), so the
customer-facing mock apparatus and stale test artifacts were removed,
and every source file now documents its own role for the owner's
learning.

- Restore Signature Rose price from the $1 live-PayPal-test value to
  the normal 4999 cents ($49.99), as the old TEMP comment instructed.
- Rewrite customer-visible mock copy in components/Storefront.tsx:
  the "Mock operations / not enough to take money yet" section is now
  a Shipping & returns section; "Free Shipping Mock" / "Return Days
  Mock" stats, "30-day returns mocked", and internal builder notes in
  the Craft/real-roses/shop sections replaced with real customer copy;
  the internal launch-decision list no longer renders on the homepage.
- Delete dead endpoint app/api/shopify/cart/route.ts (nothing called
  it; checkout goes through /api/checkout in mock mode or a Shopify
  cart permalink in live mode).
- Rename lib/checkout/mock.ts to lib/checkout/process.ts — it is the
  whole checkout engine (mock AND live), not just a mock.
- Rename lib/business.ts mockLaunchDecisions to launchDecisions and
  update the stale Checkout entry to reflect live status.
- Reword mock-mode notices (success page, /orders, cart drawer,
  checkout page) as "development mode" text; refresh .env.example
  comments to frame mock as the safe dev default.
- Add "ROLE OF THIS FILE" headers plus per-function comments to every
  file in app/, components/, and lib/, calibrated for a TypeScript
  beginner (type guards, unions, useSyncExternalStore, Luhn, GraphQL
  notes explained in place).
- Update README (live-payment status, restored price, new structure)
  and fix stale file references in docs/checkout.md,
  docs/web-app-learning-guide.md, docs/shopify-integration.md, and
  docs/mock-business-decisions.md.
- Kept: mock dev mode itself, the /orders demo log, the Storefront API
  client (future token-based live path), and the root static prototype
  files (index.html, script.js, styles.css, src/) — deleting those
  needs owner confirmation.
- npm run lint and npm run build both pass.

## 2026-07-15 15:09 AEST

Answer git staging question; no repo changes

- Advised the owner on `git add .` vs adding specific files: prefer
  named files (or `git add -p` / `git add -u`) so each commit stays
  one coherent idea; `git add .` is fine when the whole working tree
  is one piece of work, as with today's mock-cleanup changes.
- No code or docs modified after the 14:09 entry; README.md remains
  accurate.

## 2026-07-15 15:21 AEST

Clarify git add -u behavior for untracked files

- Confirmed `git add -u` stages only tracked-file modifications and
  deletions; new untracked files are left alone on disk (skipped from
  staging, not removed).
- Noted for today's changes that the mock.ts -> process.ts rename was
  done with `git mv`, so it is already staged; `git add .` or named
  files remain the right way to stage the rest.
- No code or docs modified; README.md remains accurate.

## 2026-07-15 15:21 AEST

Explain git add -A vs -u vs . staging scopes

- Answered follow-up git question: `git add -A` stages modified,
  deleted, and new files repo-wide; `git add .` does the same but
  only for the current directory subtree; `git add -u` skips new
  untracked files.
- Also pointed to `git add -p` for reviewing hunks while staging and
  `git diff --staged` for checking what is queued before committing.
- No code or docs modified; README.md remains accurate.

## 2026-07-15 15:23 AEST

Advise when git add -p is worth the interaction cost

- Agreed `git add -p` is too slow for daily use; recommended
  `git add -A` + commit as the default, with `-p` reserved for
  splitting unrelated changes inside a single file.
- Suggested the cheaper habit: skim `git diff` once before staging,
  and commit small and often so mixed working trees rarely happen.
- No code or docs modified; README.md remains accurate.

## 2026-07-15 15:27 AEST

Clarify commits attach only to changed files

- Confirmed `git add -A` stages only files that differ, so a commit
  message is associated solely with the modified file(s); unchanged
  files keep their previous last-touched commit in GitHub's file
  browser, `git log <file>`, and `git blame`.
- Noted the internal snapshot model vs the per-file diff view tools
  present.
- No code or docs modified; README.md remains accurate.

## 2026-07-15 15:38 AEST

Explain subfolder scoping for git commands

- Continued the git staging Q&A: `git add .` behaves like `-A` for
  changed-files-only staging, differing only in directory scope.
- Explained when working from a subfolder matters: monorepos, tools
  that resolve the current directory (npm, scripts), or area-by-area
  commits — while noting path arguments from the root
  (`git add lib/`) achieve the same without cd, and that this repo
  is single-project so root is the right place to work.
- Warned that `git add .` from a subfolder silently misses changes
  elsewhere; `git status` always shows the whole repo.
- No code or docs modified; README.md remains accurate.

## 2026-07-15 15:41 AEST

Draft commit message for the mock-cleanup changes

- Provided a ready-to-use conventional commit message covering the
  session's working-tree changes: price restore, customer-facing mock
  copy removal, dead route deletion, mock.ts -> process.ts rename,
  learning comments, and README/docs updates.
- Offered to run the commit on request; nothing committed yet.
- No code or docs modified; README.md remains accurate.

## 2026-07-15 15:53 AEST

Refresh docs to reflect live-payment status

The owner flagged that docs/ still read as if the store could not
take money. Fixed the stale project-state claims while keeping
legitimate "mock" references (the local dev mode and still-
unconfirmed business assumptions).

- docs/checkout.md: replace "mocked by default" intro with live
  status; turn "Going live" into a progress list (store, products,
  real payments done; Shopify Payments and Storefront API token
  remaining).
- docs/launch-checklist.md: update the plain-language status, tick
  completed Phase 2/3 items (store, products, variant IDs, live
  PayPal order), and mark the "is it real yet?" test as passed
  2026-07-15.
- docs/mock-business-decisions.md: mark the variant-ID and go-live
  TODOs done, update What Works Now / What Does Not Work Yet to the
  current live state.
- docs/demo-goal.md: add an ACHIEVED/superseded banner; the demo
  phase it describes is history.
- docs/web-app-learning-guide.md left as is — its mock references
  teach the dev-mode mechanism and remain accurate.
- Markdown-only changes; README.md already reflects this state.

## 2026-07-15 17:06 AEST

Finish stalled rebase, commit docs refresh, push main

The owner asked to add/commit/push. Found the repo detached mid-
interactive-rebase: the session's code changes were already committed
by the owner (26419b5 "updated .ai/WORKLOG.md") and the rebase onto
origin's 888d801 was paused at an edit stop on its final commit.

- Committed the staged docs refresh + worklog entries as a new
  commit (b0ecaee "Refresh docs to reflect live-payment status") at
  the edit stop rather than amending the owner's commit (permission
  denied for history rewriting, and only add/commit/push was asked).
- Ran `git rebase --continue` — rebase completed and main updated.
- Pushed main to origin (888d801..b0ecaee); working tree clean and
  in sync. Vercel deploy applies the restored $49.99 price and the
  mock-copy cleanup to the live site.
- Advised: if `git status` ever shows "(no branch, rebasing main)",
  finish with `git rebase --continue` or back out with
  `git rebase --abort` before further work.

## 2026-07-15 17:08 AEST

Explain why mock code remains in lib/checkout

- Owner asked why a "Mock express" comment still exists in
  lib/checkout/process.ts. Explained the deliberate split: mock
  wording shown to customers and stale docs claims were removed,
  while the mock code path itself is kept as the local development
  sandbox (npm run dev with no env vars simulates checkout safely;
  the deployed site always uses the live permalink path).
- Offered the alternative of stripping mock mode entirely (live-only
  checkout) and its tradeoff: local testing would hit the real
  Shopify checkout. Awaiting owner preference; no changes made.
- No code or docs modified; README.md remains accurate.

## 2026-07-20 — Figma "Home page" imported as /shop (pixel-exact)
- Built `app/shop/page.tsx` from the Figma file (Open Fashion kit, GoldRose-customized), frame `418:616`, via the Figma REST API using a read-only token Charles created (he should now revoke it in Figma Settings → Security).
- All coordinates/colors/fonts taken from API data (font: Tenor Sans via next/font). Image assets are Figma-rendered node exports at 2x in `public/shop/`.
- Verified with an automated screenshot pixel-diff loop (Chrome @2x vs Figma's own 2x render): structural difference 0.0045% (113 px of 2.5M); remaining 0.95% is glyph antialiasing style only.
- Notable gotchas solved: image fill `imageTransform` crop matrix, Figma outside-aligned strokes on chips, Chrome rounding half-pixel positions (fixed with 0.5px translate), Hamming filter matches Figma downscaling.
- Design frame's empty bottom ~2,900px (blank background below the nav) was trimmed; page ends at y=1690.
- Pushed to main (0c43b50); live at https://goldrose-storefront.vercel.app/shop (kept off the home page until checkout is wired up).
- Added proportional scaling to /shop: canvas scales to viewport width (capped 480px); verified 360/375/430/desktop, no overflow; 375 render bit-identical.
- Bottom nav on /shop is now fixed to the viewport bottom (app tab-bar style), in a scaled overlay; 375 render still bit-identical.
- Added old-browser fallback to /shop scaling (zoom-based, via inline script) + overflow-x guard; fixes sideways scrolling on narrow phones with pre-2024 engines/in-app browsers.
- Reverted the /shop zoom lock (pinch-zoom allowed again) at Charles's request.

## 2026-07-21 — Project tracking system set up

- Created root `SUMMARY.md` — short single source of truth (goal, current
  state, constraints, next steps), per Charles's global agent rules.
- Created `docs/flow-map.md` — the buyer flow step by step, with each step's
  implementation files and status (✅ real / 🟡 mock / ⬜ not built / 💡 future).
- README now points to both.
- Recorded open item: uncommitted deletions of `docs/demo-goal.md` and
  `docs/mock-business-decisions.md` (launch checklist still references the
  latter); `docs/SEO.md` untracked. Owner chose to decide later.

## 2026-07-21 — VELORIA redesign: shop + product pages (Deliveries)

- `/` now serves the Figma home import (moved from /shop); old interactive
  storefront deleted (backup branch `gold-rose-v0`).
- New pixel-exact imports from VELORIA Figma file: `/shop` (Frame 26) and
  `/products/[slug]` (详情页 frame; placeholder design shared by all 3 products).
- Shared chrome: `components/veloria.tsx` (promo bar, header, fixed bottom nav
  with Home/Shop links), `lib/fonts.ts`, assets in `public/veloria/`.
- Home + shop cards link to product pages; back arrows and logo navigate.
- Playwright/numpy pixel-verify vs Figma renders: shop 1.29%, detail 3.28%
  residual (text AA). Pending: symbol-glyph SVG swap (Figma API rate limit),
  cart wiring, deploy/push.
- Follow-up: home page dark pill nav replaced with the shared VELORIA white tab bar (Home tab active) for cross-page consistency.
- Chatbox: mascot + concierge bar extracted into a fixed overlay above the nav (components/ConciergeChat.tsx); click opens a placeholder chat panel (real widget later).
- Chatbox added to the home page as well (same fixed overlay as /shop).
- Back button live on all headers: walks browser history when the previous page is ours, else falls back to the parent page (product→/shop, shop→/).
- Glyph polish: symbol/star/promo glyphs now served as exact pixel crops from the Figma frame render (public/veloria/glyph-*.png) — bypassed the rate-limited image API entirely. Shop 98.6% / detail 96.6% visually identical to design.
- Fixed iPhone right-drift: over-wide (430px) overlay stages cannot be centered by margin:auto on narrow screens (CSS pins them left, so the scale skews right). All stages now center via left: calc((100% - W)/2). Floating-nav experiment reverted (misdiagnosis of the same bug).
- Renamed public/shop → public/home (home-page assets were confusingly named after their old route); deleted unused fav-nav.png.

## 2026-07-21 — Custom admin design (Deliveries)

- Decision: Charles is dropping Shopify. Custom /admin + Supabase becomes system of record; Shopify stays only as a temporary payment rail; Phase B = PayPal-direct checkout.
- Delivered docs/admin-design.md: full design — schema (products/inventory movements/orders/site_content/admin_users + RLS view), admin screens, Shopify order webhook, pixel-vs-editable-content rule, Phase B exit plan, 8 build stages with acceptance criteria.
- Build not started per Charles (docs first). Waiting on: real product info, Supabase project.
- Rebrand: AUREÀ → GoldRose across code + docs (metadata, JSON-LD, checkout/orders pages, chatbox, product names, business profile, placeholder domains, internal keys + GR- SKU prefix — no live shoppers, so no legacy kept).
- Admin design: added bilingual EN/中文 requirement (§6.7) — cookie-persisted toggle, typed t() dictionary, full label coverage, en fallback; storefront stays English.
- Admin design Rev 2: cut the Shopify transition phase (no customers to protect). Single build = admin + native PayPal checkout (sandbox); Shopify code deleted in Stage 4; schema drops all Shopify/drift columns, orders keyed on paypal_order_id; webhook = PayPal capture verification.

## 2026-07-21 — admin-design.md Rev 3: Shopify-clone admin
- Owner directive: the custom admin must be "exactly the same as Shopify, as exact as possible", minus the useless appearance features.
- Rewrote docs/admin-design.md: admin UX = screen-for-screen Shopify admin clone (Polaris + polaris-viz), EN/中文 using Shopify's own zh-CN vocabulary; live Shopify admin kept as reference until final walkthrough (cancel last, screenshot first).
- Dropped (the cut list): Online Store/themes/pages/blog (the "appearance"), Apps, channels/POS, Marketing, Markets, Plan/Billing, Collections, gift cards, segments, fraud analysis, label buying.
- Schema grown for parity: product_variants (+options/media), customers, discounts, checkouts (abandoned), order_events (timeline), settings; orders gain #1001 numbering, tracking, cancel/refund fields.
- Stages renumbered 0–9; SUMMARY.md refreshed.

## 2026-07-22 — admin-design.md Rev 4: international, not US-only
- Owner decision: GoldRose sells internationally (was US-only).
- Un-dropped Shopify Markets (adapted): Settings → Markets lists countries served, grouped into shipping zones (seed: United States · Rest of world).
- Shipping goes zone-based (settings-driven, replaces flat rate); checkout gains ship-to country selector; capture verifies country is served.
- Products gain customs fields (country of origin, HS code); Analytics gains Sales by country.
- V1 keeps USD-only pricing (PayPal settles USD), duties on buyer, storefront English; per-market pricing/multi-currency/translations listed as V2.
- SUMMARY.md refreshed; waiting on country list + international rates from Charles.

## 2026-07-22 — admin-design.md Rev 4.1: parity tightening
- Owner confirmed pushing parity further after gap review.
- Added to V1: Duplicate product action; buyer gift message / checkout note → order Notes card (Shopify cart-note behavior); customer profile Timeline (customer_events) + customers CSV export; Supabase MFA (TOTP) on owner login; responsive/mobile note (email alert replaces Shopify app push).
- Named explicitly as V2 (were unstated): returns workflow, partial fulfillment, bulk editor, saved list views, editable email templates, Live View, mobile push.
- Stage 3/4/5 acceptance criteria extended accordingly.

## 2026-07-22 — admin-design.md Rev 4.2: visitor behavior into V1 (+ V2 list audit)
- Audited all inline V1/V2 mentions vs §15: added missing rich-text descriptions + inventory holds to the V2 list.
- Owner asked for user-behavior analytics in V1. Resolved the "provider decision" blocker by going first-party: page_views table + <Beacon /> on storefront pages + POST /api/beacon (service-key insert); anonymous localStorage visitor id, cookieless, no third parties.
- Unlocks Shopify-parity cards previously hidden: Sessions, Conversion rate funnel, Sales by traffic source, "Visitors right now", Home session/conversion cards, and the order-detail Conversion summary (orders.visitor_id).
- Full Live View globe screen stays V2; Stage 7 now builds the beacon; risk row added (ad-blocker undercount, consent wording at launch).

## 2026-07-22 — analytics decision recorded: first-party now, ad pixels when ads start
- Owner accepted recommendation: keep the first-party beacon as the admin's analytics foundation; no GA4/external trackers yet.
- Added to §15 Future: ad-platform tags (GA4/Google tag, Meta Pixel, TikTok) + consent banner are added when the first paid campaign launches — additive, coexists with the beacon.
- Cross-noted in §5.12; SUMMARY refreshed.

## 2026-07-22 — admin-design.md restructured as a formal design doc
- Owner asked for a professional structure, agent-implementable, rev history out of the preamble.
- New skeleton: metadata header + ToC; §2 "How to use this document" (agent execution rules); §4 Open questions (OQ-1 payment provider, OQ-2 countries/rates, OQ-3 product info, OQ-4 Supabase project); §5 Alternatives considered; webhook merged into §10 Checkout & payments; §17 Revision history table (Rev 1→4.2). All content preserved; cross-references renumbered.
- Payment provider formally reopened as OQ-1 ("not sure what payment we going to use", 2026-07-22): PayPal stays the working assumption; order schema made provider-neutral (payment_provider, provider_order_id, provider_capture_id).
- SUMMARY waiting-on now mirrors the OQ list; memory (checkout-backend-decision) updated.

## 2026-07-22 — admin-design.md Rev 4.3: SEO + GEO into V1
- Owner directive: "add SEO and GEO in V1".
- New §8.1: technical SEO (DB-driven app/sitemap.ts, app/robots.ts, canonicals, per-page metadata + OG/Twitter cards, Organization/WebSite/Product/BreadcrumbList JSON-LD with live-stock availability) — all DB-driven, no redeploy for new products.
- GEO (generative engine optimization): AI crawlers explicitly allowed with owner toggle, auto-generated /llms.txt from the DB, JSON-LD as the shared backbone, and the machine-readable-compensation rule (every PNG-pixel fact also exists in meta/JSON-LD/alt).
- Shopify Online Store → Preferences SEO fields adapted into Settings → Search engine & AI (cut-list exception noted).
- Bonus geo: checkout ship-to selector defaults to buyer country via Vercel geo-IP header.
- Stage 8 extended (key files + acceptance); risk row for PNG-text invisibility; V2 gets SEO/GEO extensions (FAQ/review schema, hreflang); changelog Rev 4.3.

## 2026-07-22 — admin-design.md Rev 4.4: §0 one-shot autonomous build directive
- Owner request: an agent should build the whole backend in one unattended run — no questions, no approvals; owner returns to a finished build.
- Added §0 (ToC item 0): decision authority (doc → live Shopify → closest-to-Shopify + record), OQs resolve to working assumptions, resource-fallback table (local Supabase via CLI/Docker or adapter; PayPal routes verified by mock + fixtures; console emails; build-with/without-DB-env), hard guardrails (sandbox/mock money only; owner-only actions → checklist, never performed; main never broken; no new paid deps; no secrets committed), execution order (stages 0→8 one commit each, stage 9 wired with seed data), deliverables (BUILD-REPORT.md with per-stage verification + decisions + mocks + owner activation checklist).
- Header Status/Audience/Version updated; §2 cross-ref; changelog 4.4. Preserved Charles's own header edits (Owner "store dev", Users "Charles' teammates").

## 2026-07-22 — One-shot autonomous admin build (stages 0–9)

- Restored accidentally-deleted §0.1–0.5 of docs/admin-design.md, then executed
  the §0 one-shot build: 10 stage commits on main (0 test baseline → 1 schema +
  data layer → 2 auth/Polaris shell → 3 products/inventory/files → 4 native
  checkout + Shopify removal → 5 orders/customers/webhook → 6 discounts/drafts/
  abandoned → 7 Home/Analytics/beacon/⌘K → 8 settings/content/SEO-GEO +
  catalog cutover → 9 live data in the designated pixel boxes).
- §0.2 fallbacks used: local file db behind lib/supabase (no Docker), dev admin
  login, console emails, fixture-tested PayPal (no sandbox credentials).
- Deleted: lib/shopify/*, permalink checkout, shop_pay, SHOPIFY_* env vars,
  lib/products.ts (storefront now reads the DB), stray Figma token line.
- Verification: 43 Playwright e2e (production build; home pixel-exact,
  shop/product masked) + 9 Node unit tests, all green at every stage commit.
- Deliverables: docs/BUILD-REPORT.md (decisions, mocks, gaps, owner activation
  checklist), refreshed SUMMARY.md.

## 2026-07-23 — Testing-phase polish + visitor ideas (Deliveries)

- Fixed the failed Vercel deploy (.npmrc legacy-peer-deps); live site now runs
  the admin build. Read-only-fs resilience: local store + auth degrade to
  in-memory demo mode on serverless.
- Security: default dev password disabled in production; then (owner decision)
  testing-phase OPEN ACCESS — /admin needs no login while no Supabase and no
  ADMIN_DEV_PASSWORD; auto-locks when either exists.
- Demo store seed (orders #901–905 in all states, 3 customers, GOLD10,
  abandoned checkout, page views) — local + live; hosted activation seeds clean.
- Visitor ideas: concierge panel form → /api/feedback → feedback table (added
  to migration/types/seed) → admin Content → Ideas (list + delete). e2e added.
- Cleared all Next dev-overlay issues; EN/中文 toggle as a white top-bar button;
  Playwright moved to port 3001 (no clash with the owner's dev server).

## 2026-07-22 — Testing forum + nickname login + Supabase decision

- Owner confirmed database choice: Supabase (docs/Database.md option 1) — no
  self-hosted Postgres; activation checklist unchanged (BUILD-REPORT §5).
- Forum in the admin (owner request): /admin/forum thread list + new-thread
  form, /admin/forum/[id] posts + reply + delete; nav item "Forum" (EN/中文).
  Tables forum_threads/forum_posts added to types, seed, and the SQL migration
  (RLS enabled, service-role only like feedback).
- Login page: nickname field added above the untouched email/password fields.
  Nickname-only submit (open-access testing phase only) sets a 90-day
  forum_nickname cookie and goes straight to the forum; with real auth active
  nickname-only is rejected. Forum pages redirect to /admin/login when no
  nickname is set.
- Tests: forum e2e spec (nickname gate, thread/reply/delete flow, nickname-only
  rejection under password gate); unit + full e2e suite green.

## 2026-07-22 — Bottom nav: owner's cat-button art

- Owner supplied 8 PNG buttons (zip in `temp/`, extracted + renamed to `temp/bottom-menu-buttons/`, git-ignored).
- Relocated into repo at `public/nav/` (downscaled 1733×1958 → 216px, ~25 KB each): `home|shop|wholesale|me.png` + `-active` colored variants.
- `components/veloria.tsx` BottomNav: tabs now render the PNG art (icon+label baked in); colored `-active` variant shows on the tab's own page. Tabs renamed Business→Wholesale, Account→Me (still no routes → non-links). Fixed latent case bug: default `active` was `"shop"` which never matched label `"Shop"`, so shop/product pages showed no active tab; now product+shop pages highlight Shop.
- Pixel baselines regenerated (home exact, shop/product masked). Lint clean for touched files (4 pre-existing errors elsewhere untouched); 9 unit + 48 e2e green.
- Follow-up (same day): two seeded 📢 announcement threads ("Welcome" + "What
  to test", EN + 中文, nickname "GoldRose Team") in the demo seed — appear
  locally and on live, excluded from clean hosted activation. Post editing
  added (owner question): Edit button on your own posts (nickname match,
  server-checked), edited_at column + "edited" marker; e2e extended.
- Follow-up: dev console error "Encountered a script tag while rendering React component" — the 4 inline no-calc-fallback `<script>` tags (home page, BottomNav, ScaleFrame, ConciergeChat) never execute after client-side navigation (now common via the tab bar). Replaced all with `components/NoCalcScale.tsx`, a client component running the same zoom/transform fit in a `useEffect`. Behavior identical on modern browsers (pure-CSS path); on pre-2024 engines the fit now lands post-hydration. tsc clean, 48 e2e green against unchanged pixel baselines (zero visual delta).
- Follow-up: tester guide (owner request) — docs/USER-GUIDE.md (EN + 中文,
  owner-editable markdown) rendered at /admin/guide via a tiny built-in
  parser (headings/bullets/paragraphs, no new dependency); "Guide" nav item;
  guide e2e spec added.
- Follow-up: "Change nickname" is now an in-place popup on /admin/forum
  (owner request; the old login-page link bounced already-identified
  visitors straight back). Announcement seeds made fully bilingual — titles
  and bodies EN + 中文 (owner request). e2e: nickname-popup test added.
- Follow-up: guide page now renders EN and 中文 as side-by-side columns
  (owner request) — one column per "# " heading in USER-GUIDE.md, stacking
  on narrow screens.
- Docs: backup plan recorded in docs/Database.md (owner request) — Supabase
  Free + nightly pg_dump→S3 with lifecycle + restore drills; Pro at launch;
  raw RDS/Azure and self-hosting rejected. (Discussion also settled: company
  -owned Supabase account, passkeys via Supabase beta after activation.)
- Housekeeping: cat-button source art moved from gitignored temp/ into
  tracked assets/nav-buttons/ (owner request — masters now backed up in git;
  public/nav/ keeps the optimized web copies).
- Supabase activation (with owner): project created on company guidance,
  0001_init.sql run, security-definer advisor warning triaged (by design),
  clean seed to hosted + one-off insert of the two forum announcements,
  verified anon sees only catalog/site_content (orders 401), bucket exists.
  Local .env.local switched to hosted. Remaining: owner auth user +
  admin_users row, Vercel env vars + redeploy, ADMIN_OPEN_ACCESS decision.
- ADMIN_OPEN_ACCESS=1 override (owner decision): admin + nickname forum stay
  open on hosted Supabase during testing; guest session on hosted, proxy
  skip, launch-checklist reminder in BUILD-REPORT §5.7. Playwright webServer
  env now blanks Supabase keys + override so e2e can never touch the real
  db. Verified against hosted: ON→200/forum works, OFF→redirect to login.
- Login-page fix: the "nickname only is enough" helper now shows only when
  open access is actually on; locked mode shows "optional display name,
  email+password required" (EN + 中文) — owner was misled locally.
- Login funnel (owner request): open-access visitors without a nickname are
  redirected to /admin/login; nickname enters the whole admin and shows in
  the top bar. Sign-up + approval (owner yes): "Request access" card on the
  login page (hosted only, Supabase signUp), "awaiting approval" login
  state, Settings → Team page to approve/remove (requireRealAdmin — the
  nickname guest 404s; verified vs hosted). e2e: team spec added.
- Mode decision (owner): live-like from now — no ADMIN_OPEN_ACCESS on
  Vercel; testers sign up + get approved. Forum no longer bounces logged-in
  accounts without a nickname — they post under their email name
  (getForumIdentity), nickname popup stays as optional display name. Forum
  e2e updated accordingly.
- Sign-up nickname now mandatory (owner request) — stored in auth
  user_metadata, shown on Team page, and used as the forum identity
  (cookie popup = optional override). Password recovery (owner request):
  forgot-password card on login (always-neutral reply), Supabase reset
  email → /admin/reset-password (proxy-exempt, PKCE code exchange in the
  browser client, 8+ char double-entry form, sign-out after update).
  Owner must add redirect URLs in Supabase Auth → URL Configuration.

## 2026-07-22 — Supabase activated + `--demo` seed flag

- Discovered (read-only checks): owner connected hosted Supabase — keys in `.env.local` and Vercel, live /admin auto-locked, `admin_users` has owner email, catalog + forum announcements already seeded hosted; orders/customers/etc. empty.
- `scripts/seed.ts`: new `--demo` flag for hosted seeding (plan-approved). Seeds the testing-phase demo store on an empty db OR tops up an existing catalog; hard-refuses if any orders exist; per-table skip-if-non-empty (idempotent, forum announcements survive). tsc + 9 unit tests green.
- Running `npm run seed -- --demo` against the live db was blocked by the permission classifier — owner to run it (`! npm run seed -- --demo`).
- Login screen decluttered (owner request): sign-up and forgot-password
  moved to their own pages (/admin/signup, /admin/forgot-password, hosted-
  only, proxy-exempt); login page keeps two plain links. Reset page fix:
  handles hash tokens / PKCE code / explicit error params (server-initiated
  recovery emails deliver tokens in the hash — page previously missed them).

## 2026-07-22 — Team access revocation is owner-only

- Settings → Team already gated mutations to real Supabase admins, but ANY approved member could remove any other (incl. the owner). Owner request: only the registered admin (owner) may revoke.
- New `lib/admin/team-owner.ts` (pure, unit-testable): owner = earliest-created APPROVED account; local adapter (no auth timestamps) falls back to the first allowlist row. Server-side gate in `removeMemberAction`; UI hides Remove for non-owners, shows an "Owner" badge + owner-only note (EN + 中文 keys added).
- Tests: 5 new unit tests (14 total green), team e2e asserts the Owner badge; full suite 52 e2e green. tsc + lint unchanged.
- Nickname entry removed from the login page (owner request): identity is
  the sign-up nickname bound to the account (field renders only in dormant
  open-access mode). USER-GUIDE "Getting in" + seeded welcome announcement
  rewritten for sign-up + approval flow; hosted welcome post updated
  in-place; forum e2e rewritten for account-identity behavior.
- ADMIN_OPEN_ACCESS override DELETED (owner choice, option 2): hosted
  Supabase now always means real accounts — guest identity, proxy nickname
  funnel, layout guest display, and the playwright env blank all removed;
  requireRealAdmin kept as the named gate (now = requireAdmin). Open access
  remains only in the local no-Supabase dev mode.
- Perf (owner report: language toggle very slow on live): vercel.json pins
  functions to syd1 (same region as the Supabase project — was iad1, ~250ms
  per query across the Pacific); getAdminSession wrapped in React cache()
  so layout/page/actions share one auth round trip per request. (Also:
  auto-approve toggle was started and fully reverted on owner's nvm.)
- Nickname change is now real (owner request): the forum popup updates the
  ACCOUNT nickname (auth.updateUser user_metadata) on hosted — permanent,
  visible on Team — and clears the old cookie override; local file mode
  keeps the cookie fallback.
- Forum attachments (owner request): paste images into the message box or
  "Attach files" (≤5 files, ≤5 MB each; images + common docs whitelist).
  Storage reuses product-images bucket under forum/ keys (local: .data/
  uploads via /api/files). forum_posts.attachments jsonb column (migration
  updated; LIVE DB needs one-line ALTER — owner). Images render inline,
  other files as links. serverActions bodySizeLimit raised to 30mb.
  e2e: reply-with-image coverage.
- Perf (language toggle seconds-slow): root cause = toggle did TWO
  sequential server round trips (action gated on requireAdmin, then
  router.refresh re-running the force-dynamic dashboard = auth + ~22
  full-table queries; orders ×6, page_views ×3). Fix: lang now lives in
  client state (PolarisShell useState + SetLangContext) so the flip is
  instant; cookie written fire-and-forget without auth gate; analytics
  reads deduped per request via React cache (cachedAll).

## 2026-07-22 — Header icon assets relocated
- Unzipped owner's `temp/上部菜单按钮.zip` (top-bar button art, 6 PNGs 349×375).
- Web copies → `public/header/`: back, search, wishlist, cart, menu, wishlist-active (= `color.png` gold heart, assumed active state).
- Raw originals archived → `assets/header-buttons/` (mirrors nav-buttons convention). Zip kept in `temp/`.
- Not wired into `VHeader` yet — awaiting owner's go-ahead.

## 2026-07-22 — Matched nav folder names (owner request)
- `public/nav/` → `public/bottom-nav/`, new header set → `public/top-nav/`;
  raw archives likewise `assets/bottom-nav-buttons/` + `assets/top-nav-buttons/`.
- Updated the single code reference in `components/veloria.tsx` (BottomNav img path).
- Grep confirms no stale `/nav/` or `/header/` references in app/components/lib/tests.

## 2026-07-22 — Product-page wishlist heart is now a real toggle

- `components/WishlistButton.tsx` (new): client button that swaps `public/top-nav/wishlist.png` ↔ `wishlist-active.png` (gold heart) on tap; list persisted in localStorage (`goldrose-wishlist`, per product handle) — no backend/account yet.
- `VHeader` heart branch now renders it (takes optional `wishlistSlug`); product page passes `product.handle`. Shop keeps the search icon.
- Idle state renders identical pixels → pixel baselines untouched. Verified: tsc clean, 14 unit + 52 e2e green (incl. 3 pixel baselines).

## 2026-07-22 — Idea captured: user login methods
- Added to `docs/ideas.md` (From me — 2026-07-22, verbatim): "User log in method: there should be diff login method for users."

## 2026-07-22 — Header wired to owner's top-nav art
- All storefront headers (home + VHeader on shop/product) now use `public/top-nav/` PNGs:
  menu, back (BackButton default), search, cart; product page heart = WishlistButton
  (built in a parallel session — outline↔gold toggle, localStorage).
- Public icons cropped to content +12px margin via sharp (sips --cropOffset silently
  center-crops — first attempt clipped the menu bow); raws untouched in assets/.
- Deleted superseded Figma icon SVGs (Menu/Search/Bag in page.tsx + veloria.tsx) and
  `public/home/back.png` + `public/veloria/back.png`.
- Pixel baselines regenerated (home exact, shop/product masked); 52 e2e + 14 unit green.

## 2026-07-22 — Marketing attribution in Analytics (owner request)

- Owner (via Charles): marketing = Google ads + content on FB/TikTok/Ins/Pinterest/YouTube; wants to see, moment to moment, how many users arrive per channel and per country to judge creative effectiveness.
- Beacon/DB already captured referrer + full UTM + geo country (`page_views.country` from `x-vercel-ip-country`) — the gap was read-side only.
- New `lib/admin/channels.ts`: `channelOf()` collapses utm_source spellings + referrer hostnames into canonical channels (YouTube before Google; l.facebook.com/fb/vm.tiktok.com/pin.it etc.). `sourceOf` moved here (alias-free so `node --test` loads it); analytics.ts re-exports.
- `analyticsSummary()` additions: `trafficByChannel` / `trafficByCountry` (geo-IP, session landing view) / `trafficByCampaign` (utm_campaign per creative) / `liveVisitors` {total, byChannel, byCountry} (5-min window, channel from the live session's landing view). `salesBySource` labels now normalized via `channelOf`.
- Dashboard: live card shows per-channel + per-country rows and auto-refreshes every 30 s (visible tab only); three new list cards (channel / visitor country / campaign); country codes localized via `Intl.DisplayNames` (EN/zh-CN); new i18n keys both languages.
- Tests: new `tests/unit/channel-attribution.test.ts` (5 cases); analytics e2e updated for the new cards. 20 unit + 52 e2e green vs production build.
- Docs: idea logged verbatim in docs/ideas.md; USER-GUIDE gains bilingual "Marketing links" section (UTM tagging is required — in-app browsers strip referrers, untagged = "Direct"); SUMMARY updated.

## 2026-07-23 — Login methods: passkeys (admin + customer) & customer Google/Apple sign-in
- Owner request: customer accounts with multiple login options — Google + Apple first — plus passkeys for both admins and customers.
- Storefront: new /account page (Me tab now links to it) — Continue with Google/Apple (OAuth PKCE via new /auth/callback route), passkey sign-in/enroll/remove, order history matched by provider-verified email. `customers.auth_user_id` link column (migration 0002_customer_auth.sql). Local mode degrades to a "sign-in unavailable" card.
- Admin: "Sign in with a passkey" on /admin/login (allowlist re-checked server-side after the WebAuthn ceremony; non-admins signed back out) + new Settings → Security page to add/rename/remove passkeys (EN/中文, hosted-only).
- Shared plumbing: lib/supabase/server-auth.ts (one cookie-bound server client), lib/supabase/browser-auth.ts (browser client with Supabase's experimental passkey flag + useWebAuthnSupported hook).
- Security note: password-account emails are NOT trusted for order linking (auto-confirm is on) — only Google/Apple-verified emails claim checkout history.
- Dormant until owner runs BUILD-REPORT §5 item 2 (enable Passkeys RP + Google/Apple providers + redirect URLs; Apple secret rotates 6-monthly; RP ID change breaks enrolled passkeys).
- Tests: 55 e2e + 20 unit green (new account.spec.ts); home pixel baseline still byte-exact.

## 2026-07-23 — docs cleanup: archive stale docs, compress SUMMARY, rewrite README

- Owner asked for docs/ + SUMMARY.md to be concise; redundant/stale content archived.
- Moved to docs/archive/ (git mv, ARCHIVED banners added): flow-map.md (Shopify-era,
  described deleted lib/products.ts) and BUILD-REPORT.md (§5 activation checklist
  still live, now tracked from SUMMARY → Next steps).
- SUMMARY.md compressed to short bullets + added the mandatory file-structure ASCII
  chart; merged the two overlapping Supabase-activation mega-bullets; all ⚠️ warnings
  (shared live db, RP ID, order-linking trust) kept.
- README.md rewritten from scratch — old one still described the deleted Shopify
  cart-permalink checkout end to end. Now a short current map (stack, run/test,
  deploy, structure, docs table). nextjs-agent-rules block preserved.
- Path-only link fixes: docs/Database.md + admin-design.md §0.5/§14 now point at
  docs/archive/ paths (no spec content or numbering touched).
- Left alone by design: admin-design.md (spec), ideas.md (verbatim), USER-GUIDE.md
  (rendered at /admin/guide), Database.md content, seo-roadmap.md.

## 2026-07-23 — Lint zeroed with real refactors (commit 88ffaed)

- Fixed all 11 eslint problems (8 errors, 3 warnings) with proper refactors, no rule disables:
  - `WishlistButton` → `useSyncExternalStore` (hearts now sync across components/tabs; privacy-mode fallback kept).
  - `BackButton` → ref instead of state (one less render); `SalesChart` → hydration idiom via `useSyncExternalStore`.
  - `AttachmentsField` → hook owns only `File[]` state; component mirrors it into the hidden input via effect.
  - `CheckoutClient` → latest-ref updated in an effect; escaped apostrophe in `ConciergeChat`; removed 3 dead vars/imports.
- Verified: eslint 0 problems, tsc clean, 20/20 unit, prod build green, 18/18 targeted e2e (incl. all 3 pixel baselines).
- Note: a concurrent session was editing `lib/` + `package.json` ("type": "module", deleted `lib/business.ts`) during this work; committed only my 9 files via `git commit -- <paths>`.

## 2026-07-23 — Repo health sweep: silent-truncation fix, auth fail-closed, perf (Charles: "find anything obviously improvable")

- **RemoteStore.all() paginates** (`lib/supabase/remote.ts`): PostgREST silently caps a bare select at ~1000 rows — analytics/orders would have gone quietly wrong once `page_views` passed 1000. Now pages via range() with a stable per-table order key. New `where()` on TableStore (both adapters) pushes equality filters down to SQL; order-detail `conversionFor` no longer drags the whole page_views table.
- **Auth fail-closed** (`lib/admin/auth.ts`): partial Supabase config (URL set, service key missing) used to fall OPEN to the no-login testing mode — now any configured URL locks the admin. Intentional no-env demo mode unchanged.
- **Team roster paginated** (`lib/admin/team.ts`): listUsers read only page 1 (200); storefront customer accounts share auth.users, so admins (and owner detection gating Remove) could silently drop off. Now loops all pages.
- **Perf**: map-indexed joins in listOrders/listCustomers (were O(n×m)); `getCatalog` wrapped in React cache() (metadata + page body fetched it twice per product render).
- **channelOf**: `fbclid` now buckets as Facebook (mirrors gclid→Google) + unit case.
- **Housekeeping**: deleted Shopify-era `lib/business.ts` (unimported; decisions preserved in docs/archive/launch-checklist.md) and unused `isCountryCode`; `"type": "module"` in package.json (kills node --test warnings; configs already ESM); SUMMARY test counts corrected (55 e2e + 20 unit).
- Verified: tsc clean, build clean, 20 unit + 55 e2e green (one flake retried clean).
- Reported-not-fixed (need owner/design decisions): PayPal capture amount-mismatch only logs; customer auto-link race (wants unique constraint); tax base vs discount apportionment (latent, tax=0); adminAlerts full-table reads on every admin navigation; page_views has no retention policy.

## 2026-07-23 — Dedupe assets/ vs public/
- Deleted `assets/product-photos/` (9 files, ~2 MB): every file was a byte-identical
  copy of a `public/products/` image. Verified zero code references (only an archived
  doc mention). `assets/` now holds only the raw nav-icon originals.
- Noted in SUMMARY.md that public/ is canonical.
- Known remaining dup: `public/home/logo.png` = `public/veloria/logo.png` (kept — each
  Figma-imported page references its own path).
## 2026-07-23 — AI-search product-recommendation research

- Deep-research run (105 agents; 23 sources; 25 claims adversarially verified → 20 confirmed / 5 refuted) on how AI search (ChatGPT, Google AI Overviews/AI Mode, Perplexity, Copilot) discovers & recommends products, and what a custom non-Shopify store must do.
- Delivered: [docs/geo.md](../docs/geo.md) — per-platform mechanisms, confirmed vs refuted ranking factors, GoldRose action plan (feed generator + 4 free merchant programs), agentic-commerce/PayPal landscape.
- SUMMARY.md updated (docs listing + current-state pointer).
## 2026-07-23 — AI product-discovery research

- Created `docs/geo-codex.md`: source-led explanation of AI product retrieval/recommendation, platform comparison, GoldRose storefront audit, myths, measurement plan, and phased merchant-feed/commerce roadmap.
- Verified 57 unique sources across OpenAI, Google, Microsoft, Perplexity, PayPal, Amazon, Anthropic, Meta, and independent research; updated `SUMMARY.md`.

## 2026-07-23 — Full-repo review (4-dimension audit)
- Ran parallel security / data-layer / code-quality / tests-tooling review; consolidated 22 findings into docs/repo-review-2026-07-23.md (tiered).
- Tier 1 (pre-activation): anon EXECUTE on adjust_inventory RPC, mock checkout mints paid orders when PayPal unset, refund double-spend race, oversell (no stock check), non-transactional order creation.
- Also: no CI/typecheck gate; PayPal + hosted-Supabase paths have zero test coverage (e2e runs file adapter only); JSON-LD stored XSS; CSV formula injection; unbounded page_views.
- No code changed — review only.

## 2026-07-23 — Merged second (Codex) review into repo-review doc
- Spot-verified Codex's unique finds: capture re-price mismatch (records total ≠ captured), inventory double-count (on_hand − committed after already decrementing), variant display/purchase mismatch, mock card PAN collection. All confirmed; added as Addendum A1–A10 to docs/repo-review-2026-07-23.md.
- Codex missed: refund double-spend race, JSON-LD stored XSS, file-adapter test masking, fulfill/cancel race. Both reviews agree on top 2 (anon RPC EXECUTE, mock checkout fail-open).

## 2026-07-23 — Unified SEO/GEO implementation documentation

- Added `docs/search-discovery-implementation.md` as the operational source of truth for search, AI discovery, merchant feeds, measurement, gates, and acceptance criteria.
- Verified and corrected `docs/seo-roadmap.md`; removed overclaims about page coverage, programmatic SEO, rich results, free listings, and setup timing.
- Reframed `docs/geo-intro.md` as research and replaced its duplicate implementation/checklist sections with a handoff to the unified plan.
- Updated documentation references in `README.md`, `SUMMARY.md`, and `docs/admin-design.md` for the `geo-intro.md` rename and the unified plan.

## 2026-07-23 18:10 AEST

docs: add first feature learning doc (trial)

- Create docs/learning/01-add-to-cart-checkout.md following the new
  docs/learning-docs-guideline.md: an end-to-end trace of Add to Cart →
  /checkout → mock order creation (BuyButtons → cart store →
  CheckoutClient → /api/checkout → priceCart → createOrder → success
  page), with an ASCII flow chart, file:line links, jargon notes
  calibrated to Charles's skill profile, the PayPal-branch contrast,
  and the e2e/unit tests covering the path.
- This is a sample for Charles to review the format before more
  features are generated. SUMMARY.md and README.md left untouched
  pending approval of the format.

## 2026-07-23 — Renamed seo-roadmap.md → seo-intro.md
- File itself was already renamed (staged); fixed all stale references:
  README.md, SUMMARY.md, docs/search-discovery-implementation.md,
  docs/archive/geo-claude.md, docs/archive/flow-map.md (link targets only —
  the historical `SEO.md → seo-roadmap.md` rename note kept as history).

## 2026-07-23 — Fixed stale .md cross-references after doc moves
- Scanned every tracked/untracked .md for file-path references that no longer resolve (script checked links, backticks, bare paths against repo root + each file's dir).
- Fixed 11 broken navigational links/pointers: admin-design "Related docs" (flow-map & launch-checklist → docs/archive/), BUILD-REPORT (admin-design link, flow-map + launch-checklist paths), geo-claude (geo-codex.md → ../geo-intro.md), flow-map "Related docs" (../admin-design.md, ../ideas.md, sibling checkout/shopify-integration), launch-checklist (../admin-design.md), archive/checkout (web-app-learning-guide → archive path), learning/01 (guideline now sibling in docs/learning/).
- Left intentionally-historical mentions untouched: deleted Shopify-era code (`lib/products.ts`, `lib/shopify/*`, `components/Storefront.tsx`…) in archive prose and the spec's before/after + stage tables; site routes like `/llms.txt` are not repo files. WORKLOG itself untouched (history).

## 2026-07-23 — "read:" comments pilot in types.ts (redone after accidental reset)
- Added 8 `// read: "…"` one-liners in `lib/supabase/types.ts` after TypeScript lines that can't be read left-to-right (generics, `(typeof X)[number]`, `Record`, `Partial`).
- Style per Charles: near-literal verbalization keeping the code's own words, minimal English glue; naturally-readable lines get no comment. Style rule saved to agent memory.
- First application was lost to a working-tree reset; re-applied and committed this time.

## 2026-07-23 — JSDoc pass over all of lib/
- Added `/** ... */` JSDoc to every exported function and significant helper across all of `lib/` (Charles approved scope "all of lib/"): admin/ 79, checkout+cart+paypal 38, root+account+orders 27, supabase/ 13 — ~157 symbols, 39 files changed.
- Style: one-sentence behavior summary (+ side effects: DB writes, emails, throws, cents units), `@param`/`@returns` without repeating TS types, tiny examples where helpful (4999 → "$49.99").
- Existing comments merged into the new blocks, no text lost; ROLE OF THIS FILE headers and `// read:` comments untouched; zero code changes (final combined check: `tsc --noEmit` clean, 20/20 unit tests pass, diff comment-only +949/-54 — every removed line was an old comment expanded into JSDoc).
- `lib/supabase/types.ts` untouched (types only, `read:` pilot preserved); `lib/checkout/countries.ts` and `checkout/types.ts` already adequately covered.

## 2026-07-23 — Obvious repo optimizations (perf pass)

- Losslessly recompressed all 51 PNGs in `public/` (sharp zlib pass + oxipng via @napi-rs/image, pixel-identity verified before each write): 5.46 MB → 4.79 MB (−12%). `assets/` originals untouched.
- `next.config.ts`: added `Cache-Control: public, max-age=604800, stale-while-revalidate=2592000` for `/veloria|home|products|top-nav|bottom-nav/*` (was default max-age=0 → revalidate every view).
- Added `fetchPriority="high"` to the three LCP hero `<img>`s (home banner, shop hero, product-detail hero).
- Verified: 20 unit tests green; pixel-diff + stage9 screenshot e2e green (6/6); production build clean. Tools installed with `--no-save`, node_modules restored after.
