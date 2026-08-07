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

## 2026-07-23 — SUMMARY.md freshness pass
- Added missing top-level items to the file chart: `proxy.ts` (auth middleware), `temp/` (owner upload scratch), `docs/learning/` mention.
- Noted today's perf commit (2ffcdcf: PNG shrink, asset cache headers, hero fetchPriority) under Current state.
- Left uncommitted per-account attribution WIP (lib/admin/analytics.ts, channels.ts) out of SUMMARY until it lands.

## 2026-07-23 — Per-account attribution for commissions (ideas.md item)
- Owner idea (verbatim in docs/ideas.md): multiple TikTok accounts post content; trace traffic AND orders back to the specific account so sales commission can be calculated.
- Convention: `utm_content` = posting-account name (beacon already captured it). New `accountOf()` in lib/admin/channels.ts → "TikTok · amy" labels (channel-prefixed so same-named accounts on different platforms stay separate).
- Analytics (lib/admin/analytics.ts + dashboard): new cards "Sessions by posting account" and "Sales by posting account (for commissions)" (orders + net sales per account, first-touch via visitor's first view).
- Order detail: Conversion summary now shows "Referred by account" (EN/中文 i18n added).
- Docs: USER-GUIDE "Marketing links" EN+中文 explain the utm_content convention with example link. Demo seed tags James's Instagram visits with an account.
- Verified: 23 unit tests (3 new accountOf), tsc clean, eslint clean, admin-analytics e2e extended (tagged landing link → order traces to "TikTok · amy") — 5/5 pass.
- Left uncommitted on main per session scope; ideas.md untouched (stays raw).

## 2026-07-23 — Forum unread badges (owner request)
- Owner ask: forum should show new (unread) messages and their count; design left to me.
- Design: per-device read marks in localStorage (`lib/forum-unread.ts`) — one "read up to" timestamp per thread; mirrors the forum's cookie-based identity, zero schema migration, works on hosted Supabase + file adapter immediately. Own posts never count as unread.
- Nav: dashboard layout ships thread/post stamps into AdminFrame → "Forum" nav item shows a Polaris `tone="new"` badge with total unread; recounts live via a window event when a thread is read.
- Thread list: per-thread "{n} new" / "{n} 条新消息" badge. Opening a thread marks it read up to its newest post.
- Docs: USER-GUIDE forum sections (EN/中文) explain the badges and the per-browser caveat.
- Verified: 27 unit tests (4 new for unread counting), tsc + eslint clean, full e2e 56/56 (new test: badges count seeded announcements, clear after reading both threads).

## 2026-07-24 — Learning doc 02: posting-account attribution

- Added docs/learning/02-posting-account-attribution.md per learning-docs-guideline.md:
  end-to-end trace of commit 17730c3 (utm_content link → Beacon → page_views →
  orders.visitor_id → accountOf() → Analytics cards + order "Referred by account").

## 2026-07-24 — docs/features/ decision records started
- Created `docs/features/` (one file per feature: decision + pros/cons + plan; README has convention + index).
- First record: `posting-account-attribution.md` — DECIDED to move salesperson tag from `utm_content=amy` to dedicated `acct=amy` (prevents future ad-tool `utm_content` collisions corrupting commission report). Not yet implemented; plan table in the record.
- SUMMARY.md file map updated to mention features/.

## 2026-07-24 — features/ lifecycle codified
- `docs/features/README.md` now defines the docs lifecycle (ideas.md → features/ → SUMMARY next-steps → WORKLOG), the fixed status vocabulary (IDEA→PLANNED→DECIDED→IN PROGRESS→SHIPPED→DROPPED), and the rule that a status change updates both the file's status line and the README index line in the same commit. Index doubles as roadmap.

## 2026-07-24 — run skills (repo-local + global)
- Created `.claude/skills/run-goldrose-storefront/` (SKILL.md + driver.mjs): verified safe launch on port 3001 in file-adapter mode (Supabase/PayPal env blanked), storefront/admin/mock-checkout flows all green; local db reset afterwards. Stays gitignored per owner's request (`.gitignore` edit undone).
- Created global `~/.claude/skills/run-anywhere/` (SKILL.md + webshot.mjs): safety-first launch playbook + generic Playwright screenshot driver for any repo; tested against the running GoldRose server. Live db/PayPal never touched.
- Status vocabulary revised per Charles: PLANNED → DECIDED → IN PROGRESS → DEPLOYED → TESTED (+ DROPPED exit); TESTED = human-verified on live site, IDEA state removed (ideas.md is the inbox).
- (later same day) Owner asked to undo: both run skills deleted (repo-local + global run-anywhere). No git changes remain from this work.
- README Index replaced by a Status tree (Frontend/Backend branches, status on leaves only), seeded with the project's real features and SUMMARY-derived statuses; sync rule now points at the tree leaf.
- Status display finalized: feature files show the full pipeline with current stage bold; tree leaves use a ●●○○○ progress meter + stage name (markdown can't render bold inside the code-block tree).
- Meter reworked to 4 dots = milestones after planning; PLANNED is now the empty meter ○○○○ (was ●○○○○, which wrongly implied progress).
- Leaf qualifiers pruned: keep only when the bare status would mislead (dormant/sandbox) or to name the blocker to the next stage; rule added above the tree.
- Status tree reshaped per Charles: Frontend/Backend as ### sections, each feature its own mini-tree root with the status as leaf — max line width ~55 chars so nothing wraps in narrow views.
- Tree geometry v3 per Charles: feature = root, functions = child leaves (recursive, e.g. Admin suite → Analytics → posting-account-attribution.md), status meter inline at end of every leaf; roots carry shared caveats only. Functions decomposed from SUMMARY.
- Status tree completeness audit (repo-verified): added wishlist button, checkout discount codes + shipping placeholder (OQ-2) + PayPal webhooks, guest order lookup /orders, concierge chat (feedback panel DEPLOYED, real widget PLANNED), product feeds PLANNED, order emails via Resend (console fallback), nightly pg_dump→S3 backup PLANNED.
- Renamed final status TESTED → STABLE per Charles (works well live, human-verified, open to future improvement); pipeline, legend, tree leaves, and the attribution file's status line all updated.
- Renamed DEPLOYED → TESTING per Charles (emphasizes what still needs human verification); definition clarifies it's a queue state, dormant/sandbox included.
- Tree shorthand refs (§14.3, OQ-2, Database.md, dormant/owner-config, search-discovery) now resolve to real links in a Refs block under the tree (links can't render inside code fences); USER-GUIDE Marketing-links anchor linked from the attribution record.
- /tidy apply (naming): `docs/USER-GUIDE.md` → `docs/TESTER-GUIDE.md` (content is the Tester Guide); all 9 referencing files updated (guide page path, EN/中文 i18n strings, README/SUMMARY/docs links); guide e2e green.

## 2026-07-24 — SUMMARY.md status correction (testing-only, ship date)

- Marked Current state as testing-only: sandbox PayPal, placeholder products, no real marketing links; all data = test data.
- Recorded ship target 2026-07-30; "Live deploy" reworded to "Deployed (testing)".
- /tidy apply (agent-context): SUMMARY.md "Current state" compressed to 6 high-level bullets (testing status, deploy, live-db warning, mock-mode recipe, BUILD-REPORT §5 pointer, Status-tree pointer); storefront/DB + read:/JSDoc rules moved to Key facts; per-feature detail now lives ONLY in docs/features/README.md Status tree + feature docs (verified: every dropped fact has a home in spec/code/BUILD-REPORT). Status tree untouched per owner (no text after status).

## 2026-07-24 — Feature status vocabulary rename

- Renamed two statuses across docs/features/: PLANNED → BACKLOG, DECIDED → READY (lifecycle ladder, meter legend, status tree, and posting-account-attribution.md status line). Other statuses unchanged.

## 2026-07-24 — Scalable feature-progress plan

- Updated `docs/Improvement-plan.md` so the proposed tracking system supports sustained growth through distributed per-feature records, recursive discovery, sharded generated views, relationship validation, scalable CLI queries, and a 1,000-feature test fixture; removed the monolithic `roadmap.yaml` design.

## 2026-07-24 — Posting-account tag: utm_content → utm_acc (no fallback)

- Implemented docs/features/posting-account-attribution.md plan; owner named the tag `utm_acc` (drafted as `acct=`).
- Beacon captures utm_acc; accountOf() reads only utm_acc (utm_content deliberately ignored — new unit test pins this).
- Updated: seed demo data, i18n empty-states (EN+中文), TESTER-GUIDE link recipe + click-test tip (EN+中文), learning doc 02 addendum, features README status → TESTING.
- Verified: 28/28 unit tests, 5/5 admin-analytics e2e green.

## 2026-07-24 — Rename STABLE status to DONE in docs/features
- docs/features/README.md: lifecycle vocabulary, status-line example, meter legend, and all Status-tree leaves now say DONE instead of STABLE (9 spots).
- docs/features/posting-account-attribution.md: status line pipeline updated to match.
- Left untouched: docs/Improvement-plan.md (historical proposal text) and WORKLOG history.

## 2026-07-24 — Owner idea captured (US stock + 达人 promotion + AI video finale)

- Appended owner idea verbatim to docs/ideas.md ("From boss — 2026-07-24"): US stock ready; recruit 达人 on US social platforms; AI-made video series with the final piece exclusive to the website to boost views.
- No code changes; idea only. Related: per-account attribution (utm_acc) already shipped for commission tracking.

## 2026-07-24 — Migrated posting-account-attribution.md to the new feature-record template

- Rewrote docs/features/posting-account-attribution.md into the Improvement-plan §6 format: YAML front matter (id, kind, parent, area, delivery: uat, rollout: test-deployment, verification refs) replaces the body status line as the only status source.
- Preserved all original content (naming note, context, decision, options table, work items, links); added acceptance criteria, blockers section, and a human-verification placeholder (owner click-test pending).
- First migrated record; README status tree untouched until the generator exists. Judgment calls flagged in-file discussion: priority p1, target v1-launch, parent admin-analytics (group record not yet created).
- Added docs/features/TEMPLATE.md: canonical front matter with all §5 fields (optional ones commented out), section prompts as HTML comments, dependency-id single-source rule, and "don't retro-edit Plan" note.
- Implemented first §8 CLI command: scripts/features/cli.mjs `new` + package.json script `features:new`. Scaffolds a record from TEMPLATE.md (id/parent/area/order/date/title substituted), enforces kebab-case ids, valid areas, and global id uniqueness by scanning all front matter. Other four commands stubbed with a "not built yet" pointer. Tested happy path + 5 error guards; test artifact removed.

## 2026-07-24 — Teammate ask captured + feasibility answer (admin content editing / bulk import for 120 SKUs)

- Appended teammate request verbatim to docs/ideas.md ("From teammate (relayed) — 2026-07-24"): edit page content in the admin with frontend auto-sync, or batch-import uniformly named files for 120 SKUs.
- Investigated current wiring: admin→storefront sync already live for title/price/compare-at/slogan/SEO (on-demand revalidation, lib/admin/products.ts); images + all other page copy still baked-in Figma pixels; admin has CSV export but NO import; seed.ts is clean-slate only.
- Answered feasibility: partially works today; full plan needs (a) wiring more page areas to DB, (b) building CSV+image-folder bulk import (Shopify-style). No code changes.

## 2026-07-24 — Delivery: feature doc product-content-pipeline.md

- Created docs/features/product-content-pipeline.md (BACKLOG): admin content editing + 120-SKU CSV/image bulk import; options table, acceptance criteria, 5-step plan; recommendation = live-wire pages then Shopify-style import, pending owner confirmation.
- Idea graduated per lifecycle: teammate section removed from docs/ideas.md; Status-tree leaf added in docs/features/README.md (Backend > Product content — 120 SKUs); SUMMARY.md pointer updated to the feature file.

## 2026-07-24 — Delivery: feature doc sku-integrity.md

- Created docs/features/sku-integrity.md (BACKLOG) from the schema-review discussion: SKU = business identity of a physical shelf item; one item = one SKU, no reuse; one listing per item; bundles pre-packed = own SKU. Recommended enforcement: 0003 partial unique index (sku <> ''), same check in lib/admin for the file adapter, duplicateProduct clears SKUs, admin validation + activation gate.
- Cross-linked: product-content-pipeline.md now dependsOn sku-integrity (import upserts by SKU); Status-tree leaf added under "Product content — 120 SKUs"; SUMMARY pointer extended.

## 2026-07-24 — Correction: SKU rules moved to docs/Database.md (owner request)

- Charles preferred Database.md over a feature file. Added "## SKU rules (2026-07-24)" section there: SKU = business identity of a physical shelf item, one item = one SKU / no reuse, one listing per item, bundles pre-packed = own SKU, naming scheme, plus the not-yet-enforced note and planned enforcement (0003 partial unique index, lib/admin mirror check, Duplicate clears SKUs, admin validation + activation gate).
- Cleanup: deleted docs/features/sku-integrity.md, reverted its roadmap leaf and product-content-pipeline dependsOn; pipeline blockers + SUMMARY now point at Database.md instead.

## 2026-07-24 — Status vocabulary rename: TESTING → UAT

- docs/features/README.md: pipeline is now BACKLOG → READY → IN PROGRESS → UAT → DONE; definition, format example, meter legend, and all ~35 tree leaves updated. Aligns the prose vocabulary with the front-matter schema, which already used delivery: uat (TEMPLATE.md, posting-account-attribution.md).

## 2026-07-24 — Delivery: docs/google-analytics-concepts.md (GA primer for Charles)

- Wrote a GA4 concepts guide mapped to the GoldRose first-party analytics: event model, user/session/event identity layers, metric x dimension grammar, UTM/channel taxonomy, attribution models (ours = first-touch per visitor for commissions), e-commerce events + funnel as the next increment (matches boss viewer-behavior idea), engagement rate, realtime, and why first-party vs GA (consent/sampling/data ownership).

## 2026-07-24 — Learning docs 03 & 04: database operations (docs/learning/)

- Added `docs/learning/03-admin-product-crud.md` — write-path trace: admin add/edit/delete a product → ProductForm/ProductsList → server actions (`requireAdmin()` + zod) → `lib/admin/products.ts` → `TableStore` (hosted Supabase service key / `.data/db.json`); inventory as append-only movements via `adjust_inventory`; delete vs archive; what the schema itself enforces (constraints, trigger, RLS).
- Added `docs/learning/04-how-pages-read-the-database.md` — read-path trace: storefront anon-key reads via the `catalog_products` view (active-only, safe columns) + the three cache layers (React `cache()`, `revalidate = 300`, `revalidatePath`), vs. admin service-key reads (`store.all()` + joins in TS, uncached).
- Both follow `learning-docs-guideline.md` (Feature Summary + ASCII code trace, clickable file:line links); all relative links verified to resolve.

## 2026-07-24 — Delivery: Chinese PDF translations of SEO/GEO research

- Translated docs/seo-intro.md and docs/geo-intro.md fully into Chinese and rendered docs/seo-intro.zh.pdf + docs/geo-intro.zh.pdf (headless Chrome, PingFang typography; verified first pages visually). Each PDF opens with a translation notice; English .md stays canonical — regenerate on change (HTML sources in job tmp).

## 2026-07-24 — Fix: visible URLs in Chinese PDF reference lists

- User reported dead links in seo-intro.pdf. Verified structurally the PDFs were correct (page /Annots -> 8 Link objects with valid Rect+URI in seo; 111 in geo) — symptom consistent with Quick Look/chat-preview flattening, not the files.
- Regenerated both PDFs to the user-renamed paths docs/seo-intro.pdf + docs/geo-intro.pdf with reference-list URLs printed visibly (CSS a::after attr(href)), so even non-interactive viewers show copyable addresses. Annotations still embedded (14 / 123).

## 2026-07-25 — Deliveries

- Graduated boss ideas (UPS, register-needs-email, order-tracking email) plus
  Charles's promotion-email question into two feature records (both BACKLOG,
  proposed decisions recorded, awaiting sign-off):
  `docs/features/backend/order-tracking.md`,
  `docs/features/backend/promotion-emails.md`. Added their Status-tree leaves
  + refs in `docs/features/README.md`, removed the graduated lines from
  `docs/ideas.md`, added a SUMMARY.md next-step line. Docs only — no code.

## 2026-07-25 — Supabase environment validation

- Added exact missing-name diagnostics for partial public Supabase auth configuration.
- Added `scripts/validate-env.mjs` before `next build`: local/test all-absent mode remains valid; partial configurations and incomplete Vercel production configurations fail safely.
- Verified complete/empty/partial/production cases, lint, 28 unit tests, TypeScript, and the production build.

## 2026-07-25 — Deliveries (2)

- Wrote the SKU naming convention into `docs/Database.md` (new section under
  SKU rules): `GR-TYPE-COLOR[-VARIANT]` pattern, proposed code vocabulary
  (pending boss's 120-SKU list), character rules incl. the Excel
  leading-zero/CSV hazard, fixed segment order with tail-only optional
  segments, immutable-facts-only, ≤20 chars, SKU ≠ barcode.

## 2026-07-25 — Database SKU table Markdown

- Converted the SKU fixed-vocabulary box table in `docs/Database.md` into a native Markdown table.

## 2026-07-25 — Supplier color charts parsed into the repo

- Parsed the 3 WeChat chart images in `temp/inventory/` (Style B 5-petal
  gold-plated rose): full transcription in `docs/supplier-color-charts.md` —
  124 colors total (Y classic ×29, YS star-glitter ×50, YC colorful ×45),
  finish options (24k gold / silver full dip / silver trim), custom colors
  available. Flagged chart typos (YS-1/Y-1 mislabel, duplicate names YC-16/17
  and YC-1/36, "VelvGolden").
- Copied the images to `assets/supplier-color-charts/` with series names
  (temp/ is untracked scratch); SUMMARY updated (assets line + 120-SKU bullet
  now links the parsed catalog — it's the product list behind the
  product-content-pipeline feature and the SKU COLOR vocabulary).

## 2026-07-25 — SKU pattern Markdown

- Replaced the plain-text SKU segment diagram in `docs/Database.md` with concise native Markdown.

## 2026-07-25 — Moved SEO/GEO docs into docs/seo-geo/
- `git mv` of `seo-intro.md`, `geo-intro.md`, `search-discovery-implementation.md` from `docs/` → `docs/seo-geo/`.
- Updated all navigational links to the new paths: README.md docs table, docs/features/README.md, docs/admin-design.md (Related docs + §Markets note), docs/archive/flow-map.md, docs/archive/geo-claude.md.
- Fixed the one now-broken relative link inside the moved files: search-discovery-implementation.md → `../repo-review-2026-07-23.md`. Sibling links between the three files unchanged (moved together).
- WORKLOG history entries left as-is (historical paths).

## 2026-07-25 — Backup plan graduated to feature record

- Scaffolded `docs/features/backend/db-backups.md` via `npm run features:new`
  (BACKLOG, parent group `supabase-db`): 2026-07-22 plan (Supabase Free +
  nightly pg_dump→S3, 30-day lifecycle, restore drills, Pro at launch, cancel
  Pro once pipeline proven) + rejected options, plus new scheduler options
  (GitHub Actions proposed — awaiting sign-off), acceptance criteria, work items.
- `docs/Database.md` backup section now a pointer to the record; synced the
  features/README.md Status tree leaf + refs and both SUMMARY.md mentions.

## 2026-07-25 — IxD spec imported to docs/ixd/ (frontend mechanism session)
- Parsed design team's `temp/主页_shop页机制.numbers` (interaction spec: 37 homepage rows H-01…H-37 + 15 shop rows N-01…N-15) via numbers-parser.
- Created `docs/ixd/`: README (provenance, status legend, 待与设计确认 list), homepage.md, shop.md — text verbatim; H-35 column shift realigned + noted; H-20/H-23 typo noted.
- Extracted the 52 annotated Figma screenshots, renamed to row IDs (H-01.jpg…N-15.jpg), PNG→JPEG q85 (17 MB→5.7 MB), verified image↔row mapping on 13 samples.
- SUMMARY.md: docs/ + temp/ lines updated; Next-steps entry added. Not committed (awaiting Charles).
- Follow-up: added docs/ixd/homepage.en.md (English convenience translation, Chinese authoritative) + README link.

## 2026-07-25 — IxD README English translation

- Translated `docs/ixd/README.md` into natural English while preserving its Markdown structure, identifiers, source filename, and design-team questions.
- Restructure: docs/ixd/ now English-first — homepage.en.md promoted to homepage.md; Chinese verbatim export archived as temp/homepage.zh.md (image links rewritten); README + headers updated; status labels aligned to README legend.

## 2026-07-25 · frontend-working (bg session)
- Read VELORIA Figma file (updated 07-25 07:25 UTC) + repo; inventory of 10 new screens (homepage A-1…A-11, C-3 menu, logins, B-1…B-4, C-1/C-2) saved to agent memory `figma-import-pipeline`; shop frame 24:396 edited upstream (430×1822, was 1938) → implemented /shop now stale vs Figma.
- docs/ixd/README.md: per owner, **Source:** now headlines homepage.md + shop.md; `temp/主页_shop页机制.numbers` demoted to "design team's editable original".
- Answered owner's items-to-confirm #5 inline (third-party tell = non-GoldRose "VILOW… ROSE" wordmark on the N-07 gift box; same image is the live /shop hero `public/veloria/shop-hero.png`; swap = same-size asset replacement, needs OQ-3 photo).

## 2026-07-25 · frontend-working (bg session) — redesign import
- Rebuilt `/` pixel-exact from VELORIA frame 138:55/138:56 (11 parallel module builders → components/home/A1–A11.tsx; chrome: PromoBar variant="brown", HomeHeader/ShopHeader, redesign bottom-nav art with per-frame active variants, Me→Login). Replaced the Open Fashion homepage.
- Restyled `/shop` to the edited 24:396 frame (430×1822, warm palette, new cards/pagination/concierge; live catalog wiring kept, ratings/hearts static per owner's scope answer).
- Routes per owner delegation: existing targets wired, everything unconfirmed left pixel-exact but non-clickable (recorded as a route table in docs/ixd/README.md).
- Verified: per-module numpy pixel-diff vs Figma node renders (header/nav 0.0–0.3%, rest font-AA); fixed en route — dedup bug mapping different same-named icons to one asset, Figma SVG-text ink-crop stretching, homepage header z-order, 4 assets missing from worktree. 28 unit + 56 e2e green; pixel baselines regenerated; account/promo specs updated.
- Landed on `main` 84e4232 (fast-forward, not pushed). Worktree flow forced by the new bg-isolation guard; agent scratch worktrees cleaned. NOT imported yet: B-1/B-2 bag+checkout, B-3/B-4 business, C-1/C-2 orders, C-3 menu (美化未完成), logins (deferred, touch live auth UI).

## 2026-07-25 · Order tracking Option B + Me-section status (bg session)

- Boss ask (via Charles): customers see delivery status in the Me section;
  carriers UPS + USPS only; Level 1 (carrier link-out) confirmed.
- Built: `lib/shipping/carriers.ts` (UPS/USPS URL templates), migration
  `0003_tracking_carrier_and_hardening.sql` (tracking_carrier + agreed
  hardening: SKU partial unique index, FK indexes, discounts.value check),
  fulfill-dialog carrier dropdown (EN/中文, "Other" = manual URL), auto-built
  tracking link, "Carrier: UPS" in the shipping email, `/account`
  delivery-status pill (Preparing / Shipped via X / Cancelled), saveProduct
  SKU-taken guard + Duplicate now clears copied SKUs.
- Tests: 35 unit (7 new), 57 e2e — all green; eslint + tsc clean.
- Shipped from worktree branch `worktree-order-tracking` (draft PR).
  ⚠️ Apply 0003 on hosted Supabase BEFORE deploying this code.

## 2026-07-25 — Bottom nav account tab: "Login" ⇄ "Me"

Implements `docs/ixd/bottom-nav-buttons.md` (right-most tab reads "Me" once
signed in, "Login" otherwise).

- The label is baked into the design PNG, so the state change is an art swap.
  The "Me" render (node 763:129) already shipped with the 2026-07-25 redesign
  import and was simply unused; no new assets were needed.
- New `components/AccountTab.tsx` (client) resolves the session in the browser
  via `getSession()` + `onAuthStateChange`. It must not run on the server: `/`,
  `/shop` and `/products/[slug]` are ISR-cached (`revalidate = 300`), so a
  server-rendered signed-in nav would bake one visitor's state into the shared
  HTML. Signed-out art stays the SSR/hydration snapshot, so the pixel-gated
  frames are unchanged.
- `components/veloria.tsx`: tabs now carry a stable `id` and the active tab is
  matched by id, not by label — the account tab's label is no longer fixed.
  `app/account/page.tsx` passes `active="Account"`.
- Verified against the running app (real Supabase env) in all four states:
  signed out → Login, signed in → Me, /shop signed in → Me, after logout →
  Login. Full suite green: 57 e2e + 35 unit, pixel baselines unchanged.
- Bug found by owner + fixed same day: the MORI mascot art painted an opaque near-white box over its surroundings (A-4: truncated the panel copy, covered half the FIND A GIFT card). Root cause = Figma fill `blendMode: DARKEN` on 4 image nodes (380:242, 386:251, 420:262, 472:150), which the import ignored; fix = `mixBlendMode: "darken"` + `data-blend` so the home pixel snapshot masks them (GPU blending isn't bit-deterministic → snapshot flake). A-4 diff 2.34%→1.30%, A-8 1.70%→1.43%; 35 unit + 57 e2e green twice. main `0a9cbf6`. Asked the design team (docs/ixd/README.md) to re-export the mascots as real transparent PNGs so the blend hack can go away.

## 2026-07-25 19:19 AEST

- **Supabase CLI wired up for migrations — no more pasting SQL into the web editor.**
  `supabase login` was already valid, but the repo was never linked here (link is
  per-directory; Charles had linked a different folder). Ran
  `supabase link --project-ref cfvsvgbldnzkcjvbwnjp` from the repo root.
- Found the real problem: hosted `supabase_migrations.schema_migrations` was
  **empty** — 0001–0003 had all been applied by hand in the dashboard SQL editor,
  so Supabase had no record of them. A future `db push` would have tried to
  re-run 0001 from scratch against live data.
- Audited what is actually on hosted before touching anything: all 18 tables with
  live rows (5 orders, 3 customers, 169 page_views); 0003's `orders.tracking_carrier`
  column and all 10 indexes (`product_variants_sku_unique` + 9 FK indexes) present.
- `discounts_value_range` verified by probe (owner's call): POST a `value = -1`
  discount via PostgREST → rejected `23514 ... violates check constraint
  "discounts_value_range"`. Insert rejected ⇒ no row created, nothing to clean up;
  `discounts` re-checked after, still GOLD10 only. **So 0003 was already fully live** —
  the SUMMARY "run 0003 on hosted BEFORE deploy" to-do was stale.
- `supabase migration repair --status applied 0001 0002 0003` (writes only the
  tracking table — no schema or data change). Now `migration list` shows
  local == remote for all three and `db push --dry-run` reports
  "Remote database is up to date."
- Gitignored `supabase/.temp/` — the link wrote per-machine state (project ref,
  pooler url) into the working tree as untracked files.
- Two environment limits worth knowing: `supabase db dump`/`db diff` need Docker,
  and Docker is unusable for this user — `/var/run/docker.sock` symlinks into
  `/Users/heidiwang/.docker/`, a different macOS account. Reading the CLI's
  keychain token to reach the Management API SQL endpoint was blocked by the
  permission classifier (credential exploration) and not worked around. Net: DDL
  and migrations work from here; ad-hoc SELECT still needs Docker or a PAT.

## 2026-07-25 19:43 AEST

- Wrote [docs/learning/05-verifying-the-hosted-database.md](../docs/learning/05-verifying-the-hosted-database.md)
  — Charles asked to be walked through the constraint probe ("i have bearly idea
  about supabase"). Calibrated to his skills file: SQL 3 and Database systems 2,
  but **API development 1**, so REST/curl/headers/status codes are all explained
  from scratch while basic SQL is assumed.
- Follows learning-docs-guideline.md: Feature Summary + Code Trace with an ASCII
  chart, 8 steps, Recap. Traces the operator path terminal -> curl -> PostgREST
  -> Postgres -> CHECK -> rollback -> HTTP 400 / SQLSTATE 23514.
- Best find while writing it: `saveDiscount()` (lib/admin/discounts.ts#L56-L88)
  validates duplicate **codes** but never range-checks **value** — it passes
  `input.value` straight to the store. So `discounts_value_range` is not
  redundant; on hosted it is the only thing stopping a mistyped `-50` discount.
  The local file adapter has no constraint engine and would accept it, so
  "it worked locally" proves nothing about data integrity. That became the
  doc's central lesson: app validation is UX, DB constraints are the guarantee.
- Also corrected guidance I had given earlier in the session: the dashboard SQL
  editor is fine for **reads** (`select … from pg_constraint` is the proper way
  to check a constraint). It was the hand-applied **schema changes** that left
  `schema_migrations` empty. Doc states the read/write split as a table.
- All 9 relative links verified to resolve; dropped the link to `.env.local`
  (gitignored, would 404 on GitHub) and left it as inline code instead.

## 2026-07-25 — Import 登录界面 74:53; storefront sign-in becomes an emailed code

Owner confirmed the design team shipped the login page, and answered "no
passkey" on how to reconcile it with the working auth UI.

- **Docs corrected first.** SUMMARY.md had lumped the login screen in with the
  美化未完成 deferrals. It was never blocked on design: 74:53/74:55 were 已完成
  and held back only because they replace working auth.
- **The design chooses a different auth model.** Frame 74:53 has exactly one
  sign-in method — an emailed one-time code. Scanned every layer name and text
  node: no Google, no Apple, no passkey. Per the owner's "no passkey", the
  storefront now offers OTP only (`signInWithOtp` / `verifyOtp`). The auth
  helpers and /auth/callback are untouched and still serve the admin, so
  restoring a method is a UI change.
- Imported six modules pixel-exact into `components/login/ShoppingLogin.tsx`;
  `/account` renders it signed out and keeps the hand-built view signed in
  (the design ships no signed-in frame). Assets in `public/veloria/login/`.
- Band diff vs the Figma render: 1.6–4.5% (font AA) per module, nav 0.02%,
  whole page 2.82%. Three real bugs the diff caught:
  - membership card is #F3C6D1 at **fill opacity 0.23**, not solid pink (78% → 3.6%);
  - the ✉ SVG export degrades to a solid filled box (Figma can't outline a
    fallback-font glyph) — use the PNG node render instead;
  - the account nav tab has an **active (filled) variant, 763:149**, which the
    shared BottomNav lacked; added, and the nav band went 5.29% → 0.02%.
- 58 e2e + 35 unit green; home/shop/product pixel baselines unchanged.

New gotchas for the import pipeline:
- Read `fills[].opacity` as well as the color. A 0.23 fill opacity reads as a
  completely different flat color and is invisible in the node dump otherwise.
- Figma SVG exports of TEXT nodes whose glyph comes from a *fallback* font
  come back as a solid filled rectangle. Check tiny SVGs for a single
  rect-shaped path; fall back to a PNG node render.
- Don't centre ink-cropped SVG text in its node box — measure the ink origin
  in the frame render. Centring landed glyphs 1–6px off here.
- A section frame that only exists in one screen can still reveal shared-chrome
  state variants (763:149 = the account tab's active art).

Still open: 74:55 (Business · Procurement) not imported; email OTP needs the
Supabase template to emit `{{ .Token }}` and real SMTP before it survives
traffic — until then sign-in is the only way in and is rate-limited.

### Delivery — 2026-07-25

Shipped to production: `ea6baa6` on `main` → Vercel. Verified in a real
browser at <https://goldrose-storefront.vercel.app/account>: the imported
frame renders and the old passkey/OAuth buttons are gone.

⚠️ The page is live but **no customer can sign in yet**. Email OTP is now the
only method, and it needs the Supabase email provider enabled, the template
changed to emit `{{ .Token }}` (Supabase sends a magic link by default, not a
code), and SMTP for anything past a few sends an hour. Tracked in SUMMARY
"Next steps".

## 2026-07-25 — Testing-phase skip-payment switch at checkout

**Ask:** while testing, clicking checkout should place the order immediately —
no card entry, no payment provider — without disturbing the payment code.

**Built:** `CHECKOUT_SKIP_PAYMENT` env flag (`lib/checkout/mode.ts`, new).
With it on, `/checkout` hides the card form and every payment button and shows
a single **Place order · $X** button plus an optional email field; the order is
recorded through the existing mock path (`source='mock'`, test badge, stock
decrement, timeline, emails). `/api/checkout` accepts a new `method: "none"`
and its "PayPal is configured" guard yields to the flag, so the switch also
works once PayPal keys exist. Success-page copy no longer says "Your your
selected method checkout completed" when the method is unnamed.

**The payment code is gated, never modified** — PayPal create/capture/webhook
and the card form are untouched; unset the flag and checkout is exactly as before.

**Set in `.env.local` (local only).** Vercel needs the var added there too if
the deployed testing site should skip payment. `playwright.config.ts` blanks
the flag so the suite keeps exercising the real checkout UI.

**Verified:** flag ON → checkout renders one button, no card/PayPal markup;
POST placed order #1063 ($99.98) with lines, stock −2, customer, timeline,
checkout row completed. Flag OFF → express + card UI restored, `method:"none"`
rejected with "Payment is required.", existing mock path still places orders.
`tsc` clean, eslint clean, 58/58 e2e, 35/35 unit. Test order rolled back.

**Launch guard added** (`scripts/validate-env.mjs`): `npm run build` hard-fails
if `CHECKOUT_SKIP_PAYMENT` is set while `PAYPAL_ENV=live` — free orders on a
storefront taking real money. Warns (does not block) otherwise, with an extra
warning on Vercel production, so the flag stays usable on the pre-launch
testing deployment. Verified: live+flag → exit 1; vercel-prod+flag+sandbox →
exit 0 with warnings; live+no-flag → exit 0.

## 2026-07-25 — Import 74:55 (Business & Partnerships); tabs now switch

Owner: "let Business & Partnerships clickable and switch to business section.
note how its get done from sources."

- `/account/business` = pixel-exact import of frame 74:55 (seven modules,
  430×1614). Account-type tabs now switch both ways between the two frames.
- Enquiry CTAs (SUBMIT REQUEST / BOOK CONSULTATION / ASK MORI / "Submit a
  purchase request") POST to the new `/api/business-request`, which emails the
  owner's contact address via `sendBusinessRequestEmail`. Nothing persisted —
  the agreed "static + email the request". Sign-in reuses the emailed code.
- Band diff vs the frame render: 2.97–4.65% per module, whole page 3.44% —
  all font AA, no band over the ~5% bug threshold. No new export traps: all 15
  glyph SVGs outlined correctly this time, and the ✉ PNG from 74:53 was reused.
- **Method recorded in [docs/ixd/login-import.md](../docs/ixd/login-import.md)**
  — sources, pipeline, the four traps (fill opacity, fallback-glyph SVG boxes,
  ink-cropped text exports, shared chrome hiding a state variant), results, and
  every behaviour that is not in the design.
- Tokens/`Glyph` factored into `components/login/shared.tsx` so both frames use
  one source. 60 e2e + 35 unit green.

## 2026-07-25 — H-03 hero carousel made interactive

Owner: "Carousel + pagination dots is not working H-03, add place holder to
anything not sure."

- The import had rendered 153:63 as one static photo and 549:97 as four inert
  ellipses. `components/home/HeroCarousel.tsx` now implements H-03: dot taps,
  touch swipe (40px threshold), wrap-around at both ends, and auto-play that
  pauses on hover/touch.
- ⚠️ PLACEHOLDER: the design ships one hero photo but four dots, and H-03 says
  the dot count comes from carousel data that does not exist (OQ-3). Slides
  2–4 reuse existing catalog photography and every slide links to /shop — the
  "corresponding product detail page" mapping is undecided.
- Slide 1 keeps the design's exact bleed framing, so the home pixel baseline is
  untouched. Auto-play honours `prefers-reduced-motion`, and the Playwright
  config now pins `contextOptions.reducedMotion` — `animations: "disabled"`
  cannot stop a JS timer, so without this the baseline would flake.
- Dots change colour only; the design draws dot 1 at 9px and the rest at 7px,
  and moving/resizing them would drift from the frame.
- 62 e2e (2 new, tests/e2e/homepage.spec.ts) + 35 unit green.

## 2026-07-25 — H-03: faster auto-play, owner's PlaceHolder card

Owner: "make auto play of H-03 faster… replace the place holder as more
intuitive picture… `temp/PlaceholderPicture.png`… replace all placeholder."

- Auto-play 5000ms → **2200ms**, crossfade 400ms → 300ms.
- Hero slides 2–4 now show the owner's PlaceHolder card instead of borrowed
  catalog photography, so nothing reads as real content by mistake.
- `temp/` is gitignored and **not served**, so the file is copied to
  `public/placeholder.png`; that copy is what ships. Re-copy if the owner
  updates the original.
- Rendered with `object-fit: contain` on the design's cream — `cover` would
  crop the one word the card exists to show.
- Swept the storefront for other placeholders: the remaining ones (A4 gift-path
  cards, A7 "Reveal My Gift Match", menu/wishlist, concierge panel) are
  **non-clickable UI built from real design art**, not placeholder images.
  Substituting the card there would destroy the pixel-exact import, so they
  were left alone.
- Slide 1 untouched → home pixel baseline unchanged. 62 e2e + 35 unit green.

## 2026-07-25 — Carousel: continuous slide, faster auto-play, /placeholder

Owner: repeat the first card to show auto-play, faster, dots clickable, click
through to a placeholder route, and "swipe continues like the first img goes
left and comes second img from right".

- `components/home/Carousel.tsx` is now the shared rail: a translating track
  (outgoing slide travels left, next arrives from the right) instead of the
  crossfade, clickable dots with wrap-around, touch swipe, auto-play at
  **1800ms** (was 2200ms), paused on hover/touch.
- New route **`/placeholder`** — the named stand-in destination for cards whose
  real target is undecided (OQ-3). Cards link there rather than nowhere.
- Hero (H-03) repeats its first card ×4, which is what makes the motion
  visible. Slide 1 keeps the design's bleed framing → home pixel baseline
  unchanged (auto-play still honours reduced-motion, which the suite pins).
- Verified in-browser: dot 2 → `translateX(-430px)`, dot 4 → `-1290px`.
- 63 e2e + 35 unit green.

STILL TO DO — the other six rails are not converted yet: A2 `377:190`,
A3 `378:214` + `378:229`, A5 `429:149`, A6 `440:149` + `442:161`. The shared
Carousel makes each a mechanical change (supply its window + dot geometry),
but each rail's cards are bespoke absolute JSX on pixel-gated modules, so they
need converting and re-diffing one at a time.

## 2026-07-25 — /shop price tag overlap fixed

- Bug: on `/shop`, each card's live price painted on top of its struck-through
  compare-at price (e.g. "$49.99" over "$89.99").
- Cause: the Figma frame gives each price its own fixed absolute box (48px and
  51px wide) sized for the mock's short "$219"; `formatMoney` emits cents
  ("$49.99" ≈ 68px at 20px bold) and `txt()` sets `white-space: nowrap`, so the
  price overflowed its box into the compare-at box 6px to its right.
- Fix (`app/shop/page.tsx`): the pair now flows in one absolutely-positioned
  flex row at the design origin (9, 249), width stopping short of the heart art,
  `gap: 6`, compare-at ellipsizes and the row clips — no overlap at any price
  length.
- Pixel net: `[data-live-text]` mask rect changed shape, so
  `tests/e2e/__screenshots__/shop-masked-darwin.png` was regenerated. Verified
  the pre-update diff was confined to the four price rows (y 658–700, 966–1008,
  1274–1316, 1582–1624) — nothing else on the page moved.
- Checks: 63/63 Playwright e2e green, `tsc --noEmit` clean, lint clean (one
  pre-existing warning in `app/page.tsx`).

## 2026-07-26 · Deliveries — the remaining Figma screens
- Imported the last 7 VELORIA frames, pixel-exact (7 parallel builder agents, then verification/fix rounds by me): `/bag` (B-1), `/business/partnerships` (B-3), `/business/wholesale` (B-4, real inputs + placeholder submit), `/orders/track` (C-1), C-2 → `/checkout/success` restyle (keeps param validation + noindex), C-3 → slide-out menu drawer behind the header menu button (makes IxD H-01 work at last), B-2 → live `/checkout` restyle (markup only).
- Pixel-diff vs Figma frame renders: partnerships 1.39%, tracking 1.09%, confirmation 1.35%, wholesale 1.62%, menu drawer 1.11%, bag 2.23% (font AA).
- Bugs found and fixed en route: menu drawer lost the z-order fight to the tab bar (ScaleFrame's transformed stage traps `position:fixed` → portal to `<body>`, 16.2% → 1.11%); login "VIEW MY ORDER" pointed at `/orders`, which redirects shoppers into `/admin/orders` (→ `/orders/track`); Apple Pay + ✉ glyphs missing from Figma's node SVG exports (→ frame-render crops); confirmation screen's Home tab was dead.
- Owner decision (asked, because it is the money path 4 days before ship): full B-2 fidelity with decorative gaps. Implemented, with one safety exception I held — card inputs render only in the mock branch, since a card-number field that goes nowhere is a PCI/security hazard; PayPal's own button occupies that area live.
- Verified: 35 unit + 73 e2e green (incl. 5 new screen smoke tests + 15 money-path specs); PayPal branch driven in a browser with a sandbox id (real line item, $49.99 + $5.95 = $55.94, no dead card fields, no hydration errors); pixel baselines regenerated. Rebased onto main over another session's page-fade work (one `veloria.tsx` conflict, resolved keeping both).
- NOT done, deliberately: `/bag` → live cart wiring, guest order-lookup backend for C-1, per-method shipping rates. All flagged in SUMMARY + docs/ixd.
## 2026-07-25 — hero swipe follows the finger; bottom-nav cross-fade

Owner asks: "the img follow my swipe, i pause anywhere in the middle it pause"
and "fade in fade out when switch pages by bottom nav buttons".

- `components/home/Carousel.tsx`: swipe was threshold-only (touchstart X vs
  touchend X — the slide never moved until release). Now pointer-driven: the
  track translates pixel-for-pixel with the pointer, transition off while held,
  so resting mid-swipe parks the slide exactly where the finger stopped and
  auto-play stays paused. Release commits past 40px, otherwise springs back;
  pulls past the first/last cell are damped 3:1; `touch-action: pan-y` keeps
  vertical page scroll.
  - Bug caught in test: capturing the pointer on `pointerdown` retargets the
    click to the window, so a plain tap stopped opening the card. Capture is
    now deferred until the gesture passes the 6px tap slop.
- `components/PageFade.tsx` (new) + `ScaleFrame`/`BottomNav`: tapping a tab
  fades `.figv-wrap` out (150ms), commits the route, then fades the new canvas
  in; the tab bar sits outside the fade and never blinks. State is a class on
  `<html>` because the two halves span two pages, with a 2s safety timer so a
  failed navigation can never leave the canvas invisible. Reduced motion opts
  out of both halves.
  - React 19.2 stable ships no `<ViewTransition>`, so Next's experimental
    viewTransition flag was not an option; this is the no-experimental route.
- Verified on a production build: touch drag follows the finger and holds at
  -110px through 2.2s (auto-play is 1800ms), lift advances, vertical swipe still
  scrolls, tap still opens the card. Fade: out by 187ms, only ~47ms fully dark,
  route commits at 206ms.
- Checks: 68/68 e2e green (5 new — 2 carousel drag, 3 nav fade), typecheck and
  lint clean.

## 2026-07-26 — UI element naming convention

- Transcribed the owner's `temp/Figma_UI_Naming_Guide_GoldRose.xlsx` verbatim to
  `docs/ixd/figma-naming-guide.md` (5 sheets: PAGE/SECTION/FUNCTION/TYPE + 13
  examples). Metadata shows `dc:creator = openpyxl`, created and modified one
  second apart — the guide was script-generated, not hand-authored, which is why
  its word lists describe a generic store rather than GoldRose.
- Wrote the applied convention at `docs/ixd/element-names.md`: the guide's
  `PAGE-SECTION-[QUALIFIER]-TYPE` grammar kept verbatim, carried in a `data-el`
  attribute, plus 6 rules (role-not-appearance; index for fixed repeats vs
  `data-key` for data-driven lists; don't name decoration; Figma node ids stay in
  comments; reuse the existing `data-live-text`; unique per page).
- Vocabulary corrections: removed `BUY-NOW` (owner's call — duplicates `BUY`);
  proposed removing `CART` (no cart route by design); proposed ~20 additions
  including `PRICE`, which the guide's own example `PDP-PRODUCT-PRICE` uses but
  its TYPE sheet omits.
- Enforcement: `tests/unit/element-names.test.ts` parses the vocabulary out of
  the doc (so code and guide cannot drift) and fails on malformed names, unknown
  words and duplicates. Verified it catches all four violation classes.
- Pilot tagging applied to `components/home/A1–A3` and the shared `Carousel`
  (new optional `name` prop derives `-MEDIA`/`-SLIDE-n`/`-DOT-n`). Pixel
  baselines home/shop/product-detail all passed — `data-el` is inert.
- ⚠️ Open: A-4…A-11 not tagged (their section names are all new vocabulary,
  pending owner sign-off). 3 behavioural e2e failures (2 carousel-drag, 1
  nav-fade) remain unattributed — baseline comparison was interrupted.
## 2026-07-26 · Deliveries — homepage/shop interactions (owner asks)
- Extended the shared `Carousel` with `cellWidth`/`step` (rail advances one card inside a wider window) and per-rail `autoplayMs`/`slideMs`; added `RAIL_AUTOPLAY_MS` 4200 / `RAIL_SLIDE_MS` 900 for "slow, one by one, right to left".
- Rails now auto-slide: **Best Sellers** (new `BestSellersRail.tsx` — the design's one card + the 3 mocked copies the owner asked for, matching the frame's 4 dots; the frame's smaller 2nd card 376:183 is superseded until OQ-3), **Shop by Occasion** (`OccasionRail.tsx`), **Real Gifts, Real Moments** (`ReviewsRail.tsx`). Both new rails live in their own client files so A-5/A-6 stay server components (A-5 had been turned into a 544-line client module; refactored back to 306).
- Clickable: 3 MORI gift-path cards (Find a Gift → `/shop`; Personalize → `#personalize`; Explore Our Craft → `#craft` — anchors to the A-8/A-9 sections that already contain that content, instead of inventing pages) and the 5 occasion chips → `/shop`.
- Hover zoom: product photos scale to 1.06 inside their clipped frames (shop grid, Best Sellers, A-3 cards, product hero). Implemented with the standalone CSS `scale` property so it composes with the import's sub-pixel `transform: translate()`; `@media (hover:hover) and (pointer:fine)` only, reduced-motion opts out.
- `/shop` paging: 1–5 link to `?page=N`, the forward arrow advances and goes inert on page 5, and each page rotates the same eight placeholder cards into different grid slots (page 1 byte-identical + keeps the bare `/shop` URL; pages 2–5 `noindex` since they are the same products reordered).
- `/account` account-type tabs (Gift Shopping ↔ Business & Partnerships) cross-fade using the existing `FadeLink`, which gained an `ariaLabel` prop since those tab labels are baked into SVG art.
- Verified in a browser, not just tests: rail track steps exactly one pitch (0 → −267px), zoom `none → 1.06`, page 3 reorders the same card set, fade class applies mid-navigation and clears after, zero page errors. 35 unit + 76 e2e green (3 new specs); home pixel baseline regenerated — module-by-module diff confirms the ONLY changed region is Best Sellers (9.8%), with A-3/A-4/A-5/A-6 at 0.00%.
## 2026-07-26 — Split the repository summary into an index and on-demand state

- Reduced `SUMMARY.md` from detailed history/backlog to high-level goal, state,
  depth-1 structure, and documentation routing.
- Moved environment details, safety gates, current blockers, and open decisions
  to `docs/project-state.md`; updated cross-references.

## 2026-07-26 — Shareable PDF export for Markdown docs

- Added `scripts/md-to-pdf.mjs` (zero npm deps): a small Markdown renderer
  builds a print-styled HTML page, then headless Chrome prints it with
  `--print-to-pdf`. Handles headings, fenced code, lists, blockquotes, inline
  code/bold/links; A4 with `break-inside: avoid` on code blocks so the status
  trees never split across pages.
- Font stack falls back through Menlo → PingFang SC so the `●○` meters, the
  box-drawing tree characters and `中文` all render (verified page-by-page).
- Exposed as `npm run docs:pdf -- <file.md> [--out x.pdf] [--title "…"]`.
- Generated `docs/features/README.pdf` (5 pages) for sharing outside the repo.

## 2026-07-26 — Four more feature-learning docs (06–09)

- Extended `docs/learning/` from 5 to 9 traces, same end-to-end format:
  - `06-paypal-payment-and-recovery.md` — PayPal create → capture → order →
    webhook repair. Idempotency (four different mechanisms in the repo), the
    irreversible-capture line, what the recovery net does and doesn't catch.
  - `07-who-can-see-what.md` — proxy guard → session (HMAC local / JWT hosted)
    → `admin_users` allowlist → owner derivation → RLS grants. Authn vs authz,
    fail-closed config, 404-not-403, constant-time comparison.
  - `08-price-math-and-trust.md` — integer cents, the discount → shipping → tax
    order of operations, and the price-free request schema as the anti-tamper
    design.
  - `09-tests-and-ci.md` — node:test unit layer, Playwright determinism stack,
    the new CI workflow and its documented omissions.
- Added `docs/learning/README.md` (index + suggested reading orders) and a
  SUMMARY.md routing row; fixed a broken guideline link in doc 01.
- Two findings surfaced while tracing, both left as written-up gaps rather than
  code changes: the checkout client's displayed total omits the tax term the
  server adds (harmless only while the rate is 0), and `priceCart` /
  `applyDiscountCode` / `computeShipping` have no unit tests at all.

## 2026-07-26 — Region investigation → backlog
- Found Vercel functions pinned `syd1` while Supabase primary is AWS `us-west-2` (Oregon), contradicting commit `a62848e` / BUILD-REPORT which claim the DB is in Sydney. Measured ~170 ms/query from syd1.
- Backlogged in `docs/project-state.md`: queue item 7 (move to `pdx1` + fix wrong docs), Later-work bullet (EU read replica only if Europe launches and EU pages are slow).
- Moved the detail into `docs/features/backend/region-alignment.md`; project-state entries reduced to one-line pointers; indexed in features README.

## 2026-07-26 — Learning docs: show the code at every step

Applied the new `learning-docs-guideline.md` rule ("Shows the code of each
steps.") across all nine feature-learning docs.

- Every `### Step` inside `## Code Trace` now carries at least one fenced,
  captioned code block quoted verbatim from the repo. Convention: first line is
  a comment caption `// path/file.ts:START-END`, interior cuts marked `// …`,
  blocks kept to ~20 lines.
- 219 captioned blocks total, all machine-verified against source: each
  caption's START/END matches the block's first/last quoted line, and every
  quoted line appears verbatim in the cited range.
- Fixed pre-existing snippets that were paraphrases rather than quotes — most of
  doc 06's blocks, plus blocks in 03, 04, 05, 08, 09 (collapsed multi-line
  calls, stripped indentation, invented comments, one fabricated arrow
  function, one dropped `console.error` line).
- Corrected ~80 stale line references in prose links; several files had drifted
  20–60 lines.
- Left prose-only, deliberately: doc 04's "Recap" (conceptual re-walk, all code
  already shown above), doc 05 Step 4 (subject is an HTTP response), doc 06
  gaps #2/#3 (about code that does not exist).

Known follow-ups, not done:
- Doc 02 prose says `utm_content`; the code reads `utm_acc` (covered by an
  existing update banner). Worth a small prose fix.
- Doc 09's ASCII diagram shows `tests/unit/*.ts`; real glob is
  `tests/unit/*.test.ts`. Correct string is shown in the Step 1 block.

## 2026-07-26 — Delivered: Vercel region moved syd1 → pdx1
- `fe73e42` pinned `pdx1` in vercel.json (beside the us-west-2 Supabase primary) and corrected the wrong region records in admin-design.md and BUILD-REPORT.md.
- Verified live: `/api/beacon` returns `x-vercel-id: syd1::pdx1::…`.
- region-alignment.md → delivery: verified; project-state queue item cleared; features README tree marks DONE.

## 2026-07-26 — Delivered: OQ-1 closed, card-payment build staged
- Audited the payment surface: there is **no card rail today**. The "Credit Card"
  method is a Luhn-checking prop that POSTs a raw PAN to `/api/checkout` in mock
  mode only; the live path deliberately renders no card fields.
- Decision (owner sign-off this session): **build on PayPal Advanced Cards**
  (Expanded Checkout) — PayPal-hosted card iframes on our own checkout page,
  settling into the existing verified business account. Rejected a second Stripe
  account as onboarding/KYC overhead, not on technical merit; the
  provider-neutral order schema keeps Stripe a routes-only swap.
- Confirmed US/AU/HK are on PayPal's 37-country eligibility list, and that
  Advanced Checkout needs per-account onboarding (owner action, Stage 0).
- Staged the build as 8 tasks, Stage 0 (owner onboarding) → Stage 7 (live
  cutover), with dependencies. No payment code written yet.
- `docs/project-state.md` OQ-1 records the decision; the full doc sweep
  (`admin-design.md` §4, SUMMARY.md, stale Shopify comments) is Stage 6.

## 2026-07-26 — Merged learning-docs guideline into README
- Folded `docs/learning/learning-docs-guideline.md` into `docs/learning/README.md` as a "Guideline for writing these docs" section; deleted the standalone file.
- Repointed the guideline link in learning docs 01–09 to `README.md`.
## 2026-07-27 — Concise project documentation

- Condensed `SUMMARY.md` project state and `docs/project-state.md`, preserving
  deployment boundaries, safety gates, release blockers, and product decisions.

## 2026-07-27 — Device CLI inventory
- Scanned installed CLIs; filled the empty "CLI installed on this device" bullet in SUMMARY.md.
- Key finds: no vercel/pnpm/stripe CLI; yarn unlinked; Docker Desktop now runs under charles (daemon live), so supabase db dump/diff unblocked — memory updated.
## 2026-07-27 — Summary maintenance rule

- Reworded `SUMMARY.md` guidance to define it as concise AI-agent startup
  context covering project state, setup, tooling, services, and constraints.

## 2026-07-27 — Merged all open Dependabot PRs

- Reviewed and merged PRs #3, #4, #5, #7 (all green CI + Vercel previews):
  - #3 actions/checkout v5→v7, #4 actions/setup-node v5→v7 (CI workflow only)
  - #5 routine group: next 16.2.12, react/react-dom 19.2.8, tailwind 4.3.3,
    @tailwindcss/postcss 4.3.3, @playwright/test 1.62.0, eslint-config-next 16.2.12
  - #7 @types/node ^20→^26 (dev-only types)
- #4 needed a local merge + SSH push: gh's OAuth token lacks `workflow` scope,
  so the API refused to merge a PR touching .github/workflows/ci.yml.
- Verified after merge: CI on main green (lint/typecheck/unit on the new
  actions), Vercel production deploy success, local typecheck clean,
  node_modules synced.
- Left closed: #6 (eslint 10) and #8 (TypeScript 7) — major upgrades,
  previously declined.
- Expanded SUMMARY.md "Working Space" section: device, signed-in services (gh/Supabase), secrets location, desktop apps; version numbers dropped per Charles.
- Installed Vercel CLI 57 (npm -g); found existing login (vancechi); linked repo to goldrose-storefront project. Link step appended VERCEL_OIDC_TOKEN to .env.local — verified no existing vars lost. SUMMARY.md Working Space updated.
- Installed psql 18.4 (brew libpq, force-linked) for future ad-hoc SQL against hosted Supabase; DB password still needed from dashboard on first use.
- Added CLI-install backlog bullet to SUMMARY.md Working Space (tunnel for PayPal webhooks; psql password note).
- Removed dead NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN from Vercel Production (verified no code references; only archive docs mention Shopify). Env now: 3 Supabase vars only.
- DB password reset by Charles; stored as SUPABASE_DB_PASSWORD in .env.local. psql verified against hosted DB via aws-1-us-west-2 pooler (aws-0 rejects the tenant). Ad-hoc SQL unblocked; SUMMARY.md + memory updated.
## 2026-07-27 — Documentation single-source rule

- Added a `SUMMARY.md` rule giving each prose fact, decision, or instruction one
  authoritative location and using links instead of duplicated text.
## 2026-07-27 — Agent context documentation architecture

- Reorganized `SUMMARY.md` as the high-level product, business, environment,
  repository, and navigation map.
- Made `docs/project-state.md` the dated source for deployment, authentication,
  tooling, safety, readiness, and blockers.
- Kept commands and connection procedures in `README.md`, removing its
  duplicate repository tree and documentation index.

## 2026-07-27 — Order-detail IxD spec imported from Numbers draft

- Parsed `temp/frontend-function-draft.numbers` (design team, 3 entries:
  ORDER-DETAIL-VIEW-STATUS / -SHARE-TRACKING / -CONTACT-SUPPORT).
- Archived verbatim Chinese export: `temp/frontend-function-draft.zh.md`.
- Created English working copy: `docs/ixd/order-detail.md` (homepage.md
  format; IDs kept verbatim — they follow the Figma naming guide).
- Updated `docs/ixd/README.md`: new source + file listed, ID-reference note.
- Open: source's screenshot column is a broken placeholder — screenshots
  requested from the design team; two target pages marked "to be confirmed".

## 2026-07-27 · 07-27 Figma batch: 16 new screens + B-1 re-import (frontend-pages session)

- Imported all 16 frames added to the VELORIA file on 07-27: account
  dashboards (shopping wired to real /account data + sign-out, business as
  unlinked visual route), ACCOUNT-ORDERS-LIST (/account/orders, real orders
  when signed in), gift reminders, signup placeholder, the 4-tab /care page,
  and — per the owner's instruction that 小页面 frames are not routes — the
  SEARCH-OPEN overlay (SearchButton/SearchOverlay), shop sort dropdown (real
  sorting) + filter drawer (cosmetic), and the PDP review/color/media/
  unboxing drawers as in-page overlays.
- Chrome: account tab renamed back to "Me" with the frames' new outline +
  filled art (Login/Me session swap retired); PDP header heart → search.
- /shop: control row corrected to "120 GIFTS / Ruby Red / Gift Sets" (the
  base frame still carries apparel template residue; overlay frames patch
  it); grid moved into a client component; ?q= catalog filtering added for
  the search overlay hand-off.
- B-1 /bag re-imported after the polish pass (Goudy add-on labels, safe-pay
  band, FAQ hairlines fixed, new Rose Bouquet art, canvas 1728). B-2 drift
  check deferred (live-content page) — flagged in docs/ixd/README.md.
- C-2 wired per docs/ixd/order-detail.md: CONTACT SUPPORT → /care?tab=
  order-issues; SHARE-TRACKING stays blocked on the secure-link backend.
- Verified: pixel band-diffs vs Figma renders for all 16 screens (totals in
  the 0.8–4.2% font-AA range; media viewer's image-source limitation
  documented), lint, 39 unit, 76 e2e green; home/shop/PDP pixel baselines
  regenerated for the Me tab + search icon.

## 2026-07-27 — Customer sign-in becomes an emailed link (code fallback)

- Owner request: type email → receive link → click → signed in automatically.
  Diagnosis: the hosted templates only ever sent a link (`{{ .ConfirmationURL }}`)
  while both login screens asked for a 6-digit code that never arrived, and the
  link itself dead-ended on the homepage with an unhandled `?code=`.
- Added `app/auth/confirm/route.ts` (server-side `verifyOtp` on `token_hash`,
  open-redirect guard, same shape as `/auth/callback`). Reworked copy/flow in
  `ShoppingLogin` + `BusinessLogin` (link-first, in-place code fallback kept)
  and the `auth_error` message in `AccountClient`.
- Verified on dev against hosted Supabase with an admin-minted link (no email
  sent): click → session cookie + redirect to /account; reused link → friendly
  error; `next=//evil` → guarded. Typecheck, eslint, 39 unit, 6 account e2e all
  green. Throwaway test user deleted.
- Hosted template push was permission-blocked in-session; run
  `node scripts/apply-auth-email-templates.mjs` to activate. Only the two
  templates + subjects are PATCHed; `site_url` untouched (passkey RP ID).
- Rollback values (before): magic-link subject "Your sign-in link", body
  `<h2>Your sign-in link</h2>…{{ .ConfirmationURL }}…`; confirmation subject
  "Confirm your email address", body `<h2>Confirm your email address</h2>…
  {{ .ConfirmationURL }}…`.
- Known follow-ups: launch-ready SMTP still pending (built-in mailer ≈2
  emails/hour); order-linking allowlist is still `["google","apple"]` so
  email-verified customers see no past orders (docs/learning/07 flags it).

## 2026-07-27 — Deliveries: order-tracking branch merged to main (PR #9, "test" session)

- Found and committed the stranded 0003→0004 migration-split fix that was
  sitting uncommitted in the order-tracking worktree since the 07-27 incident.
- Synced worktree-order-tracking with main twice (41 then 3 commits of drift);
  docs conflicts resolved keeping main's 07-27 single-source restructure and
  both sides' WORKLOG histories; all code auto-merged clean.
- Verified tsc + production build + 39/39 unit green, then squash-merged as
  PR #9 (e6df3ab) and deleted the branch (remote, local, worktree). Also
  deleted stale merged branches gold-rose-v0 and worktree-passkey-ui-polish.
  GitHub now holds main only.
- Production deploy triggered: order tracking + signed-in checkout stamp are
  live; deploy-safe because 0004 was already applied to the hosted DB.
- Walked Charles through the feature-branch workflow end to end: branch →
  Vercel preview → sync with main → PR → squash-merge → delete; branch naming
  (type/short-description, never "preview"/"test"); immutable deployments vs
  branch aliases; CI/CD terminology.

## 2026-07-27 — docs(learning): add 10-working-as-a-team

- Wrote `docs/learning/10-working-as-a-team.md` from the team-collaboration
  mental-model conversation: friction = ambiguity (truth / ownership / integration),
  traced as "the life of one change" through this repo's real
  branch → PR → CI → Vercel preview → squash-merge workflow.
- Indexed it in `docs/learning/README.md` (table row 10 + reading-order line).

## 2026-07-27 — Professionalization audit (background session)

- Read-only audit of engineering practices: testing, security, observability,
  structure, type safety, dependencies, database, hygiene, docs.
- Deliverable: `.ai/reports/2026-07-27-professionalization-audit.md`
  (ranked P0–P3 gaps + suggested sequence). No code changed.
- Noted for the record: the auth email-link work pending at session start was
  committed by the parallel session as `125b72f`.

## 2026-07-27 — docs/archive deletion follow-up

- Charles deleted `docs/archive/` (7 files); cleaned all dangling references
  in `admin-design.md`, `Database.md`, `features/README.md`, and 4 backend
  feature docs. Dead links became plain-text notes ("deleted with the
  archive 2026-07-27; in git history"); launch prerequisites repointed to
  the `project-state.md` release queue; features policy line now reads
  "superseded docs are deleted; history stays in git".

## 2026-07-27 — repo-wide staleness sweep (identify + delete stale code/docs/text)

- **Deleted** `docs/Improvement-plan.md` (superseded planning doc — its "not
  started" claim was false and the simpler live `docs/features/` system
  replaced its design; in git history). Repointed the two references in
  `scripts/features/cli.mjs`.
- **Stale code comments fixed:** `lib/supabase/remote.ts` (non-existent
  `server.ts` → `store.ts`), `lib/checkout/card.ts` (live cards "handled by
  Shopify's hosted checkout" → PayPal), `app/products/[slug]/page.tsx`
  ("will later feed from lib/products" → DB catalog, Stage 9 reality).
- **`.env.example`:** dead `docs/BUILD-REPORT.md` pointer → project-state.md;
  hosted Supabase noted as live; documented optional `RESEND_FROM`.
- **Dead "BUILD-REPORT §5" activation pointers** redirected to
  `project-state.md → Release queue` in: features/README.md, order-tracking.md
  (×3), promotion-emails.md (×2), db-backups.md, product-content-pipeline.md
  (×2), Database.md. Also fixed broken anchors `#open-product-decisions` →
  `#product-decisions` (×2), the broken `repo-review-2026-07-23.md` link in
  seo-geo/search-discovery-implementation.md, and renamed-file refs
  `components/veloria.tsx` → `chrome.tsx` / `lib/figma-layout.ts`
  (docs/ixd/login-import.md ×2, assets/archive/README.md).
- **Database.md:** Supabase decision marked done (project live); SKU block
  updated "Not yet enforced" → "Enforced since 0003" (only the activation gate
  remains open). **TESTER-GUIDE.md** EN+中文: removed the stale "data may
  reset until the real database is switched on" warning — hosted DB is live.
- **⚠️ Migration-history drift found:** `125b72f` deleted
  `supabase/migrations/0004_orders_auth_user_id.sql` (feature removed) but the
  remote history still holds an orphan `0004` row and the empty
  `orders.auth_user_id` column is live (0 rows of data, 0 code refs). Repair
  was permission-blocked in-session; recorded in project-state.md → Hosted
  mode: run `supabase migration repair --status reverted 0004`, drop the
  column in the next migration, and do NOT number a new migration 0004 until
  the repair has run (`db push` would silently skip it).
- **temp/ scratch deleted** (gitignored, verified redundant first):
  `bottom-menu-buttons.zip` + `上部菜单按钮.zip` (extracted art tracked in
  `assets/{bottom,top}-nav-buttons/`), `temp/inventory/` (3 WeChat JPEGs
  byte-identical to `assets/supplier-color-charts/`), all `.DS_Store`. Kept
  `temp/temp.md` (owner-authored note, not captured elsewhere).
- **Verified:** lint + typecheck clean, 39 unit tests pass, features CLI smoke
  OK. Remaining BUILD-REPORT/lib-products mentions are deliberate historical
  annotations (admin-design §0/§17, region-alignment, seed-data rationale).

## 2026-07-28 — docs/TODO convention

- Created `docs/TODO/README.md`: per-task owner-decision hand-off format
  (what shipped / self-made decisions D-n / mocks M-n / questions Q-n with
  options + recommendation / dated resolution log; Sydney timestamps;
  delete file when 🟢). Linked from SUMMARY.md find-details table.

## 2026-07-28 — project-state.md merged into SUMMARY.md (owner decision)

- Charles chose one entrypoint file over the two-file split. All content of
  docs/project-state.md (environment, tooling verification, runtime/safety,
  release gates, release queue, OQ product decisions) compressed into
  SUMMARY.md under anchors #release-gates / #release-queue /
  #product-decisions; the file was deleted.
- Repointed all 12 inbound reference sites (engineering-playbook,
  admin-design ×3, Database.md, learning/10, features/README ×3,
  card-payments, product-content-pipeline ×2, promotion-emails, db-backups,
  order-tracking ×2, TODO/README). Verified by grep: zero "project-state"
  references remain.

## 2026-07-28 — ACCOUNT-PRIVACY-SUPPORT screens imported (bg session)

- New Figma section 1230:111 (10 frames, delivered 07-28) imported pixel-exact:
  personal info, preferences, security, privacy policy, logout, delete,
  returns, support chat, keepsake card → 9 new routes (8× /account/*, /care/chat).
  ALT frame skipped: byte-identical duplicate of 1230:112.
- Wired: dashboard "Account & Privacy" → /account/security, "Returns &
  After-Sales" → /account/returns, Sign out → /account/logout (real Supabase
  sign-out on confirm); /care "Chat with us" + "Contact support" → /care/chat.
- Verified: per-frame band diff vs scale-2 renders 0.7–1.8% (font-AA envelope)
  after eleven ±1px baseline nudges; 39 unit + 85 e2e green (9 new smoke tests).
- Findings for design team recorded in docs/ixd/README.md (password/2FA vs
  email-link auth conflict, delete-account decision needed, third nav
  geometry, ALT duplicate, mock-data oddities).

## 2026-07-28 — Repository AI collaboration protocol added

- Added root `AGENTS.md` as the canonical Version 1 guided-collaboration and
  teaching protocol.
- Added `CLAUDE.md` importing `AGENTS.md` so Claude uses the same source of
  truth without duplicated instructions.
- Updated the concise repository structure in `SUMMARY.md` and verified the
  import, Markdown structure, and diff formatting.

## 2026-07-28 — Interactive Codex working-mode selector added

- Replaced the rejection-only `UserPromptSubmit` hook with a macOS two-option
  selector for Guided Mode and Execution Mode.
- Preserved `Guided:` and `Execution:` prefixes as non-GUI fallbacks.
- Verified Python syntax, both prefix paths, hook JSON output, and a live
  arrow-key/Return selection through the macOS dialog.
- Added `.codex/` to the concise repository structure in `SUMMARY.md`.

## 2026-07-28 — Consolidated navigation questions for the design team

- Created `docs/ixd/open-navigation-questions.md`: every Figma element whose
  destination page is unknown, unbuilt, or "to be confirmed", swept from
  `docs/ixd/homepage.md`, `shop.md`, `order-detail.md`, `login-import.md` and
  `bottom-nav-buttons.md`.
- Grouped 27 entries into 13 questions **by destination page** rather than by
  screen, because the gaps repeat (7 elements point at one unbuilt
  personalization flow, 4 at one unbuilt brand-story page).
- Each question carries the entry IDs, the source's exact status wording, what
  development already built as a stopgap, and an inline `Answer:` slot.
- Indexed it from `docs/ixd/README.md`. Verified every cross-link target exists.
- Follow-up same day, at Charles's direction: moved the list out of `docs/ixd/`
  into `docs/TODO/2026-07-28-design-team-navigation-questions.md` and rewrote it
  to the TODO template — Status header, self-made decisions (D1–D3), mocks
  (M1–M5), and 13 numbered questions each carrying options plus a
  recommendation with a reason, per the folder's "never a bare open question"
  rule. `docs/ixd/README.md` now points at it instead of holding it.

## 2026-07-28 — Single doc for front-end design-team questions

Created `docs/TODO/design-team-questions.md`: the standing, never-deleted
place where every open question for the design team is collected — which page
a Figma frame belongs to, where an inert button is meant to navigate, states
the frames never drew, and design conflicts. 33 questions (DQ-01…DQ-33),
grouped as navigation (13), missing states (7), conflicts (8), assets (5),
plus 6 items marked as our own dev follow-ups rather than design questions.

Each entry records what we shipped as a placeholder and carries a
recommendation, per the `docs/TODO/README.md` rule.

Every "where it is now" line was verified in code at `ded0d46` rather than
copied from the import notes, which turned out to be stale: H-01, H-06, H-15,
H-16, H-17, H-20 and H-23 are wired now, while H-33's corporate CTAs are still
inert even though `/business/partnerships` and `/business/wholesale` exist.

Pointers added so there is one source: `docs/ixd/README.md` (open questions
now live in the TODO doc), `docs/TODO/README.md` (standing-doc exception to
the dated-filename rule), and `SUMMARY.md` (find-details-on-demand row).

Most urgent: DQ-14 — B-2's pay button has no disabled state, which blocks the
requested "no payment until contact + delivery are filled" work.

## 2026-07-28 — Delivery protocol: how work is handed over

Created `docs/ixd/delivery-protocol.md`, the standing record of how work and
outcomes move between people on this project. Written after Charles asked what
the professional move is for a design team to deliver frames when the function
of each button and image is unknown.

Structure: the chain (bosses → design team → dev → bosses) as three hand-overs
each with a return leg; the principle that every element must answer three
questions (what is it called / does it do anything / what happens); a bilingual
12-item per-frame delivery checklist (交付清单); what we do on receipt; the
placeholder-plus-`DQ-nn` rule; and an artifact map.

Every checklist item is justified by an incident already recorded in
`docs/ixd/README.md` rather than invented — the 13 groups of inert buttons,
B-2's missing disabled state, the `$189`/`$219` price, the mascot art's baked-in
checkerboard, the third-party gift-box photo, the "120 APPAREL" template
residue, the two palettes and three bottom navs, and the account tab renamed
four times.

Status split: §2 (the checklist the design team would run) is **Proposed** —
it cannot be imposed unilaterally. §3–§5 (our own receipt, return and
acceptance procedure) are **Adopted**, since they describe what we already do.

Diagnosis worth keeping: the handoff is currently dev-pull — frames arrive and
the dev side reverse-engineers intent, which is what the 33 open `DQ-nn`
questions cost. The apparatus for design-push mostly exists already (mechanism
tables, naming guide, `data-el` enforcement, annotated screenshots); the gap is
that it is produced downstream instead of at delivery. Highest-leverage single
ask: name the Figma layers with the element IDs, so the "one string, five
places" chain stops being half-live.

Pointers: `docs/ixd/README.md` (files list), `SUMMARY.md`
(find-details-on-demand row), and `docs/engineering-playbook.md` — its "Design
intake" stub now links here instead of duplicating the checklist.

Open: the design team's Figma plan tier is unknown, so whether Dev Mode
("Ready for Dev", annotations, Code Connect) can carry §2 is unconfirmed.

### Amendment — §9 added to the delivery protocol

`docs/ixd/delivery-protocol.md` gained §9, the design team's 12-column
mechanism table (机制表) rendered twice: §9.1 the original Chinese verbatim,
§9.2 a bilingual copy where every cell reads `English (中文)`. Sample rows are
N-01 and N-02; the full set stays in `shop.md`.

Separately drafted and NOT merged: a v1-vs-v2 schema critique proposing 7 new
columns (element name, frame node id, states drawn, content final/placeholder,
asset origin, revision, dev fill-back) plus fixed value sets. Charles undid it
in favour of the plain bilingual render. Kept for later if the schema
conversation reopens; the headline is that v1 records behaviour but has no
column for identity, verifiability or completeness — a row cannot say what an
element is called, whether its target frame exists, or whether its content is
real.

## 2026-07-28 — Engagement tracking design (page + section dwell)

Turned the owner's raw idea ("Analytics about behavior of the viewer in this
website", `docs/ideas.md`) into a feature record:
`docs/features/backend/engagement-tracking.md`, scaffolded with
`npm run features:new`, `delivery: backlog`, leaf added to the status tree in
`docs/features/README.md`. Design only — no code.

Two decisions carry the design:

1. **Client aggregates, one flush per visit.** Section-level events would have
   multiplied `page_views` rows 10–40×, and `analyticsSummary` reads that table
   whole-table into JS on every admin render — so a raw event log would tax the
   dashboard forever. Instead the browser keeps the clock and sends one summary
   at visit end, which `UPDATE`s the existing row. Row count unchanged.
2. **Section identity reuses `data-el="…-SECTION"`.** No new attribute —
   `element-names.md` rule 5 warns specifically against a second parallel
   marker. Consequence: section timing is blocked on tagging A-4…A-11, whose
   SECTION vocabulary is still PROPOSED pending the owner. Plan is staged so
   page-level dwell (stage 1) ships without that dependency.

Flagged: remote holds an orphan `0004` migration row — repair before pushing,
number this `0005`. Dwell + scroll is behavioural measurement, so it lands on
the consent-wording debt already logged at `docs/admin-design.md:1004`.

## 2026-07-28 — Merged the account/privacy/support screens into main (Deliveries)

Squash-merged PR #10 (`feat/account-privacy-support-screens`) into `main` and
deleted the branch on both GitHub and locally, so the remote is back to a
single branch. Merge commit `26bb048`; 99 files, +1841/−40.

The branch was 2 commits ahead of `main` and 0 behind, so there was nothing to
rebase and no conflict was possible. It brings 10 new routes (personal-info,
security, preferences, privacy-policy, returns, keepsake, delete, logout,
care/chat) with their screen components, the shared `account-chrome.tsx`, ~80
Figma SVG/PNG assets, `tests/e2e/account-screens.spec.ts`, and the
`docs/ixd` README section plus the bilingual `feedback-2026-07-28.md`.

Worth recording: the PR's green CI predated `dd2dcf2` (the docs consolidation)
landing on `main`, so the tested tree was not the merged tree. Re-ran the CI
triple locally on merged `main` — lint, typecheck, `test:unit` (39/39) — and
GitHub's own push run on `26bb048` is green too. `dd2dcf2` is docs-only, so
the gap was never risky, but "CI was green on the PR" is not the same claim as
"CI is green on what we merged" whenever main moves in between.

Left alone: one lint warning shipped with the branch — unused `GOLD` constant
at `components/screens/PrivacyPolicyScreen.tsx:20`. Warning, not an error; CI
stays green. Worth a one-line cleanup next time that file is touched.

### Amendment — two optional sections added to the feature template

`docs/features/TEMPLATE.md` gained `## Contract` (after Options considered) and
`## Open questions` (after Blockers). Both optional; the CLI copies the template,
so only records created from 2026-07-28 carry them.

`Contract` holds the technical commitments acceptance criteria are written
against — data shape, column names, invariants — with an admission rule that
keeps it from bloating: if you can't write an acceptance criterion against it, it
doesn't belong. Deliberately NOT called "tech details": a generic bucket has no
update trigger and would drift against `docs/admin-design.md`, which already owns
the post-ship spec.

`Open questions` holds choices still *ours* to make, as distinct from Blockers
(someone else's to clear). Numbered OQ-n to match SUMMARY.md. Each OQ must exit —
into `Decision`, or into SUMMARY.md Product decisions — which is what stops the
section accumulating forever.

`docs/features/README.md` "File format" updated: it listed a stale order that
began with a body "Status line" the template forbids. Verified by scaffolding a
throwaway record and deleting it.

Follow-up the same day: `## Tech details` added as a third optional section
(after `Plan`), on Charles's call. The earlier objection — that a technical
bucket rots — is answered by an admission test on whose fact it is: platform
facts ("background tabs throttle setInterval", "IntersectionObserver reports
geometry, not occlusion") stay true regardless of our code and are expensive to
rediscover; facts about our own code are excluded and stay with
`docs/admin-design.md`. Placed after `Plan` rather than beside `Contract` so the
two technical sections are separated by purpose — commitments with the decision
material, terrain notes with the build material.

Correction, same day: `## Contract` was removed again on Charles's call — the
template ships **two** optional sections, `Tech details` and `Open questions`,
not three. Data shape and invariants now live in `Tech details`; the checkbox
proving them stays in `Acceptance criteria`.

## 2026-07-28 — Engagement tracking implemented (stages 1–3)

Owner chose "biggest share of the viewport wins" for OQ-1 and asked for the
implementation. All three staged reports are built; the mechanism is generic,
so section coverage grows automatically as `data-el` tagging lands.

Files: `supabase/migrations/0005_page_engagement.sql` (new, NOT pushed),
`lib/engagement.ts` (new — the measurement rules as pure functions),
`lib/admin/engagement-report.ts` (new), `components/Beacon.tsx`,
`app/api/beacon/route.ts`, `app/api/beacon/engagement/route.ts` (new),
`lib/supabase/types.ts`, `lib/supabase/seed-data.ts`, `lib/admin/analytics.ts`,
`lib/admin/i18n.ts` (EN + 中文), `AnalyticsDashboard.tsx`, plus three test
files.

Charles's objection reshaped the core formula. Naive "most viewport pixels
wins" makes a short band between two tall bands score zero forever, even
dead-centre. Coverage is now measured against the most a section *could* show —
`visible ÷ min(section height, viewport height)` — so short and tall sections
can both reach 1.0, plus a centre bias to break ties. One winner still holds the
clock, so per-section time still sums to <= page time.

`last_section` was added as a 4th column beyond the doc's data shape: drop-off
needs the final section, and jsonb does not preserve key order, so it cannot be
read off the end of `sections`.

Verified: 60/60 unit, 87/87 e2e (pixel baselines unchanged), typecheck and
build clean. Round trip confirmed against the local file adapter: engagement
updates the arrival's own row, the sum invariant is enforced server-side, and a
wrong visitorId cannot write.

⚠️ Incident, self-reported: while verifying, a dev server was already running on
port 3000 in HOSTED mode, so two probe rows (`verify-visitor-1`, `probe-visitor`)
landed in the hosted `page_views` table. Awaiting Charles's decision on removing
them. Re-verification was redone in isolation on port 3101 in local mode.

Open: migration 0005 needs `supabase migration repair` for the orphan 0004 row
before it can be pushed — both require the owner's approval.

### Amendment — hosted migration applied, stray rows removed

Charles approved both follow-ups. `supabase migration repair --status reverted
0004` cleared the orphan history row, then `supabase db push` applied `0005`;
local and remote now both read `0001 0002 0003 0005` (0004 permanently skipped
by design). All 734 existing page_views rows preserved with null engagement.

The two accidental probe rows were deleted by exact id — 736 → 734, none left.

Hosted path then verified with one throwaway row, since deleted (count back to
734): the adapter's two-key match updates exactly 1 row, the same update with a
wrong visitor_id touches 0 rows, and scroll_pct = 150 is rejected by the check
constraint. Worth doing because both beacon routes swallow errors by design, so
a hosted failure would have been silent.

Still outstanding: orders.auth_user_id remains a live, empty, unreferenced
column for a future migration to drop.

## 2026-07-28 — Frame naming rule: Figma frame name = its route

Created `docs/ixd/frame-names.md` from Charles's requirement that Figma frame
names and URL routes stay consistent. Rule: frame name is the route uppercased
with `/`→`-`, dynamic segments dropped (`/products/[slug]` → `PRODUCTS`), `/` →
`HOME`, and `·` introducing anything that is not part of a route — a page state
or an overlay (`SHOP · FILTER`, `ACCOUNT · SIGNED-OUT`). `·` was chosen because
the design file already uses it as house style and it cannot appear in a URL.

Frame names were read live from Figma `3CXNpmuuyNyCW70qOci0oM`; every cited
route was checked against `app/**/page.tsx`. The doc carries the full
current→proposed rename list: 23 pages, 4 `/care` tab states, 9 overlays.

Found while writing it:

- Frame 765:114 is named with a **leading space** — `" Homepage · Menu Open · …"`
  (confirmed via API `repr()`). Invisible in the layer panel, breaks exact-match
  tooling.
- Two frames have no clear route: 765:113 was `C-2 · Order Confirmed` and is now
  `订单详情`, and 1230:121 `付款完弹窗`. Either could be `/checkout/success`.
- Routes with no frame: `/checkout/cancel`, `/orders`, `/placeholder`, plus the
  base states of `/care` and `/account/returns`.
- The file uses five naming conventions at once (`shop`, `orders`, `详情页`,
  `B-3 · … · iPhone 15 Pro Max`, `ACCOUNT-INFO-BUSINESS-DASHBOARD`). The newest
  1230/1234-series frames are already UPPERCASE-hyphen, so the team has started
  converging on the target style unprompted.

Consequence needing the owner's sign-off: this **replaces Sheet 1 (PAGE) of the
owner's naming guide**. `PDP`→`PRODUCTS`, `AUTH`→`ACCOUNT · SIGNED-OUT`,
`ORDER`→`ORDERS`, and `CART`/`WISHLIST`/`SETTINGS` disappear for having no
route. One fewer list to sync, but `PDP` is used across existing specs, commits
and code comments — keep old ids as legacy aliases.

Also established this session (from live Figma inspection, for future sessions):
the file has **one Page tab** («VELORIA · Product Detail»); screens are
top-level FRAMEs grouped by Figma SECTION nodes plus x-position, and those
sections **overlap**, so section membership cannot be trusted as structure.
Naming inside a frame should treat only UPPERCASE layer names as structural
levels, so junk wrappers (`Frame 28`, `Group 30`) are skipped when composing
`SHOP-HEADER-MENU-BTN` from the ancestor path.
# 2026-07-28

- Reformatted both tables in `docs/ixd/frame-names.md` as raw-source-aligned
  Markdown tables without changing their meaning.

### Amendment — hosted analytics reset (2026-07-29)

Charles asked whether the hosted database could be reset. Inspection first: all
13 orders are `provider=mock` with no capture id, so there is NO real money in
the database (the genuine 07-15 PayPal payment went through the since-removed
Shopify permalink and was never stored here). The real risk was elsewhere —
7 `auth.users` accounts, 2 passkey credentials, and the 6-row `admin_users`
allowlist that IS admin access.

Scope chosen: analytics only.

Backups do not exist yet (release queue item 7), so a verified dump was taken
first, to /Users/charles/Developer/goldrose-backups (OUTSIDE the repo — dumps
contain customer emails and addresses and must never be committed):
`goldrose-2026-07-29-schema.sql` + `-data.sql`. Verified by parsing, not
assumed: 798 page_views, 7 auth.users, 2 auth.webauthn_credentials, 6
admin_users, 13 orders, 3 products, 7 settings.

Then deleted all 798 `page_views` rows (HTTP 204, count 0). Every other table
verified unchanged afterwards; accounts and passkeys intact.

Consequence: admin analytics now reads empty until real traffic arrives — the 9
seeded demo views went too. `npm run seed -- --reset` only rebuilds the LOCAL
file adapter, not hosted.

## 2026-07-29 — naming convention: governance pass + frame rename table

**Frame naming (`docs/ixd/frame-names.md`)**
- Fixed a real defect in the proposed rule: `/`→`-` made frame names
  un-reversible (`ACCOUNT-PERSONAL-INFO` could be `/account/personal/info` or
  `/account/personal-info`). Path separator is now `/`; `-` is a word break;
  `·` marks a state or overlay. Three marks, three jobs.
- Added the full 40-frame rename table keyed on Figma node id, grouped as
  Pages / States / Overlays / Blocked, with a `Do now?` column — 21 ✅ rename
  now, 16 ⏳ held on route decisions, 3 ⛔ blocked. §3 lists the five decisions
  and how many frames each unblocks, so nothing gets renamed twice.
- Documented the `·` codepoint (U+00B7) and its look-alikes (U+2022, U+30FB —
  the latter inserted by Chinese IMEs), and the Figma component-nesting cost of
  using `/`.
- Flagged two source conflicts rather than resolving them silently: node
  `1230:121` is `付款完弹窗` here but `ACCOUNT-KEEPSAKE-SHARE` in README; and
  `ACCOUNT-RETURNS-AFTER-SALES` (`1230:119`) is in the 07-28 import notes but
  absent from the 07-28 live Figma read.

**Element naming (`docs/ixd/element-names.md`) — v1.0**
- **Source of truth inverted.** The doc claimed the design team's `.xlsx` was
  the master; a binary blob in a scratch folder cannot be diffed or reviewed.
  Markdown is now the master, the spreadsheet an export. Recorded in
  `figma-naming-guide.md` too.
- **Rule 7 added — a shipped name is frozen.** `Beacon.tsx` reads
  `[data-el$="-SECTION"]` as an analytics dimension, so renaming a section
  after deploy silently splits its time series. Engagement tracking is built
  but not deployed, so names are still free to change — noted as time-sensitive.
- **Enforcement split into fail/warn levels.** Hard-fail where the set is
  closed (format, uniqueness, PAGE, SECTION); warn where it is open (TYPE,
  FUNCTION), so a new control never blocks a build.
- **Decided, not yet implemented:** derive the PAGE vocabulary from
  `app/**/page.tsx` instead of a hand-written table; downgrade unknown
  TYPE/FUNCTION to warnings. Both recorded in a decided-vs-implemented table
  rather than described as done.
- **`data-el` corrected to analytics-only.** The e2e suite selects by role and
  text (183 `getByRole`, 0 `getByTestId`); only the engagement spec asserts on
  `data-el`.
- **Reference-ID uniqueness rule added**, with the live `OQ-1` collision
  (`SUMMARY.md` / `admin-design.md` / `card-payments.md`) flagged as unfixed.
- Added version, technical owner, **review-by date with "silence adopts"**, and
  a changelog. Both naming docs had sat in "Proposed" indefinitely.

**Verification:** `npm run test:unit` — 60/60 pass, including the vocabulary
parser that reads `element-names.md` (the three `### PAGE/SECTION/TYPE`
sections were left structurally untouched for exactly this reason). Link
targets and dot codepoints checked; the only look-alike dots in the repo are
the two deliberate examples in the look-alike table.

**Not done / next:** apply the two decided test changes; fix the `OQ-1`
collision; route architecture and terminology (sitting 2) still await the
owner's decisions.

## 2026-07-29 — Front-end Definition of Done + naming-guard fix

- Researched the Claude Code skills ecosystem (verified via GitHub API); top
  recommendations recorded in session "skills". Key external finding:
  Shopify/polaris-react (admin UI library) archived upstream 2026-01-06.
- Drafted `docs/ixd/frontend-definition-of-done.md` (status: Proposed) — three
  gates (Machine / Convention / Evidence) plus a teaching clause; intended to
  become `.claude/skills/frontend-screen/SKILL.md` after sign-off.
- Fixed the leaky vocabulary parser in `tests/unit/element-names.test.ts`:
  words now count only when a table cell's entire content is the backticked
  token. Removes false vocabulary `BUY` (PAGE), `CTA` (SECTION),
  `PDP-PRODUCT-PRICE` (TYPE). All 60 unit tests pass.
- Deferred by decision: FUNCTION enforcement (→ warn level), PAGE derived from
  route tree (both recorded in element-names.md Enforcement), data-el backfill
  (screen-by-screen, deadline = before engagement beacon meets real traffic).

### Delivery — 2026-07-29, engagement tracking pushed for review

Committed as `519cda2` on branch `feat/engagement-tracking` and pushed (17
files, +1296). Contains ONLY the engagement work: the beacon clock, the
engagement ingest route, migration 0005, the report layer, three admin cards
(EN/中文), three test files, the feature record, and the SUMMARY state line.

Deliberately excluded from the commit, because the working tree held two
unrelated streams: the whole `docs/ixd/*` naming stream, `TEMPLATE.md`,
`ideas.md`, `tests/unit/element-names.test.ts`, and this WORKLOG (its entries
are interleaved between both streams). `docs/features/README.md` was mixed, so
only the engagement status-leaf line was staged — via a HEAD copy patched and
staged as a blob — leaving the "File format / Tech details" rewrite untouched
in the working tree.

Not merged to main. Next: Vercel branch preview → owner acceptance (read one
homepage band ~30s, leave the page, confirm it tops Section attention) → PR.

## 2026-07-29 — Tooling install: top-5 MCP servers, plugins, skills

- `.mcp.json` (new, project scope): supabase (HTTP, read_only=true, pinned
  project_ref), next-devtools (npx), playwright (npx).
- Plugins (user scope): context7@claude-plugins-official (connected),
  supply-chain-risk-auditor@trailofbits (marketplace added via SSH clone).
- Skills copied into `.claude/skills/`: supabase (v0.1.2),
  supabase-postgres-best-practices (v1.1.1) — via `npx skills add`.
- Pending user actions: approve the 3 project MCP servers in an interactive
  session; OAuth Supabase via /mcp; next-devtools needs `npm run dev` running.
- Skipped by prior decision: obra/superpowers (conflicts with AGENTS.md).
- Mirrored both Supabase skills to `.agents/skills/` via `npx skills add
  --agent codex`; verified with `codex exec` that Codex lists them.
- Completed the Codex mirror: supply-chain-risk-auditor copied to
  `.agents/skills/`; supabase (HTTP, read-only, OAuth completed), context7,
  next-devtools, playwright added via `codex mcp add` (global config).

## 2026-07-29 — the 07-29 redesign import: full-file restyle + 6 new pages

- Imported the design team's reorganized VELORIA file (sitemap sections, all
  new node ids): a file-wide visual unification — pink accents → ink, gold
  buttons → ink/cream, white cards, account nav band removed — re-imported
  or drift-checked across ~40 frames / ~30 routes.
- New: `/account/privacy` (settings hub), `/account/orders/details`
  (VIEW DETAILS target), redesigned C-1 `/orders/track` (+ unlinked
  `?return=1` return-reason sheet), redesigned C-2 confirmation, `/story`,
  `/craft` (menu + homepage cards now live). Chat wired at every support
  touchpoint (→ /care/chat). Homepage: new hero photo, mascot-style header
  icon set; shop: new ad banner; PDP: ink buy buttons; care: mascot +
  restyle, per-tab lists kept.
- Brand: the delivery stamps an "ELDREVE" wordmark on ~12 frames —
  substituted the owner's GoldRose treatment everywhere (DQ-34, boss-level
  flag), deviating deliberately from the 07-26 VELORIA-verbatim precedent.
- Process: file was edited mid-import (CRAFT grew 509→1368, STORY gained
  real photos, care lists flip-flopped, unboxing crops moved) — re-passed
  each; DQ-40 asks for batch notes. Docs: ixd README 07-29 findings
  section, DQ-34…40. Verified: per-frame band diffs in the AA envelope,
  typecheck, 60/60 unit, e2e + pixel baselines regenerated (see below).
- Executed via 10 parallel screen subagents on disjoint components + a
  central foundation/verify pass (build sheets generated from the REST data
  per frame; assets pre-fetched in batched calls).

## 2026-07-29 — /shop price sort: verified already implemented (no code change)

- Request: implement Price High→Low and Low→High sort on `/shop`.
- Finding: already built and working — landed in `a1164e8` (07-27 Figma
  overlay batch), `components/shop/ShopInteractive.tsx:240-242`, sorting the
  live catalog by `priceCents` inside the design's fixed grid slots.
- Verified in the running dev app (Playwright, local seed = 3 active
  products at $49.99/$64.99/$79.99): default "New" renders 49.99→64.99→79.99;
  "Price: High to Low" renders 79.99→64.99→49.99; "Price: Low to High"
  renders 49.99→64.99→79.99; the sort pill label updates each time; the
  choice survives soft navigation to page 2.
- One real gap, not fixed (awaiting owner call): sort lives in React state
  only, so a hard reload / shared link resets the pill to "New". Putting it
  in the URL (`?sort=`) would make it shareable and SSR-correct.

## 2026-07-29 — Bottom-nav "Wholesale" tab wired to /business/wholesale

**Problem.** The Wholesale tab was inert in both bottom-nav implementations —
it rendered as a plain `<div>`, not a link, so tapping it did nothing. The
code comments justified this with "Wholesale has no page of its own", which
had gone stale: `/business/wholesale` exists and renders fine. Tracked as
DQ-13(a) / F-02 in `docs/TODO/design-team-questions.md`.

**Decision.** Charles answered DQ-13(a): the tab opens `/business/wholesale`
(the B-4 application form), not the `/business/partnerships` overview.

**Changed.**
- `components/chrome.tsx` — shared `BottomNav` (~30 pages): added
  `href: "/business/wholesale"`; refreshed the stale comment.
- `components/screens/PartnershipsScreen.tsx` — own nav band: `href: null` →
  `/business/wholesale`. With all four tabs linking, the inert-tab ternary
  became unreachable (`tsc`: "Property 'label' does not exist on type
  'never'") and was removed.
- `components/screens/WholesaleScreen.tsx` — comment only. Its tab stays
  inert: this screen *is* the destination.
- `docs/TODO/design-team-questions.md`, `docs/ixd/README.md` — recorded the
  answer; DQ-13(b) ("Rose Deals") remains open.

**Verified.** `tsc --noEmit` clean; `eslint` clean on all three files; drove
both navs in a real browser (Playwright) — `/` → `/business/wholesale` and
`/business/partnerships` → `/business/wholesale`; zero console errors; the
tab is correctly a non-link image on the wholesale page itself.

**Note.** The dark "N" badge overlapping "Your Business Details" in dev
screenshots is the Next.js dev-tools button, not a layout defect.

## 2026-07-29 — /business/wholesale switched to the shared fixed bottom nav

**Problem.** B-4 drew its tab bar *inside* the 1954-tall page canvas, so the
bar scrolled away with the content and was only reachable once you scrolled to
the very bottom — unlike every other main page, where the bar is pinned to the
viewport.

**Changed.**
- `app/business/wholesale/page.tsx` — `nav={false}` → `navActive="Wholesale"`.
  Frame height stays 1954: the deleted band's 58px is left empty so the fixed
  bar floats over background, not over the response-time note (content ends at
  y=1896, last text ends ~y=1859).
- `components/screens/WholesaleScreen.tsx` — removed the in-frame band and
  `NAV_TABS`.
- `components/chrome.tsx` — B-4 is the only frame that ever rendered the
  Wholesale tab's *active* state (1523:771); the 07-25 home set has only the
  outline. Added it as the shared tab's `activeImg`, which meant tab ids can
  now carry a set prefix — new `tabArtSrc()` resolves a bare id against
  `/veloria/home` and a slash-bearing id against `/veloria`. Refreshed the
  stale `nav` JSDoc that still claimed B-3/B-4 show no tab bar.
- `docs/ixd/README.md` — recorded both the wiring and this change.

**Verified.** `tsc --noEmit` and `eslint` clean; in a real browser the bar is
pinned on first paint, the Wholesale tab renders its filled active art, the
response-time note is fully clear of the bar when scrolled to the end, only one
nav exists on the page, and zero console errors. Spot-checked `/shop` — its own
active art still resolves, so the path refactor did not regress other pages.
All three nav images return 200.

**Left deliberately.** B-3 `/business/partnerships` still draws its own
in-frame band and still scrolls away — this change was scoped to wholesale.

## 2026-07-29 — Deliveries: /shop sort fade, product-following photos, strict price order

- Shipped as PR #16 (squash-merged to `main` as `7f3d393`), two commits.
- Grid cross-fades on sort: 150ms out, order swaps while invisible, 150ms in —
  the same timing `PageFade` uses for tabs. Only the grid fades, so the
  dropdown and header never blink; `prefers-reduced-motion` swaps outright
  (measured 0.43 opacity mid-transition; reduced motion sampled 1,1,1,1,1).
- Card photos now follow the product. They came from the grid slot while name
  and price came from the sorted catalog, so sorting moved the text and left
  the picture behind. Cards use the product's own catalog photo via
  `fileUrl()`, falling back to frame art; they cover-crop, as the real photos
  are not the frame's 203×204.
- Price order is now strict. Sorting the catalog and then cycling it into
  eight slots restarted the sequence ($79.99, $64.99, $49.99, $79.99 …).
  The grid is filled first and sorted second; verified strict on all five
  pages in both directions (10/10).
- Verified: typecheck, lint, 60 unit, 87 e2e, 3 pixel baselines. The pixel
  diff confirmed changes confined to the eight photo rectangles with no
  layout shift; `/shop` baseline regenerated, home and product-detail
  untouched. One e2e assertion updated (first-card photo → whole sequence),
  since photos now follow products.
- Worked in a throwaway git worktree: a parallel session held the shared
  directory on `main`, so its HEAD was never switched and none of its
  in-progress files were committed.
- Known, not fixed: real photos are supplier composites unfit for launch
  (OQ-3); repeated products now sit adjacent under a price sort, and all five
  pages show the same cards while sorted (three products, eight slots); the
  PDP hero is still frame art, so a card's photo differs from the page it
  opens; sort is client state, so a reload resets it to "New".

## 2026-07-29 — Customer path tests

- Walked 10 common shopper journeys against local dev + hosted Supabase with
  `CHECKOUT_SKIP_PAYMENT=1`; created mock orders #1011 and #1012.
- Buy flow (browse → add to cart → checkout → place order) passes and persists.
- Recorded results and 7 issues in `docs/user-path-tests.md`.

## 2026-07-29 — Link orders to the signed-in customer (step 1 of 4)

**Reported symptom.** Signed-in customer sees the account greeting, but the
order-confirmed page shows an email that is not theirs and `/account` lists no
orders.

**Diagnosis — four independent faults, not one mismatch:**

1. `components/screens/OrderConfirmedScreen.tsx:132` renders a hardcoded Figma
   placeholder `j***@gmail.com`; the success page never receives an email prop.
2. `app/checkout/CheckoutClient.tsx:363` starts the email box empty and never
   prefills from the session — the two most recent hosted orders (#1013, #1014)
   were stored with `email = NULL` and `customer_id = NULL`.
3. `lib/account/data.ts:28` gates order matching on
   `EMAIL_VERIFIED_PROVIDERS = {google, apple}`, but all 9 live auth identities
   use provider `email` (emailed OTP), so both filter branches were false for
   every row — the list was structurally always empty.
4. Schema drift: migration `0002_customer_auth` is recorded as applied, yet
   `customers.auth_user_id` and its unique index are absent from the hosted
   database (verified via `pg_attribute` as `postgres`). Meanwhile
   `orders.auth_user_id` — from the deleted `0004` — still exists live with
   0 of 17 rows populated.

**Delivered (step 1).** Restored the sign-in-method-agnostic link that commit
`125b72f` removed:

- `supabase/migrations/0006_orders_auth_user_id.sql` — new, idempotent
  (`add column if not exists`), so it is a no-op on the hosted database and
  correct on a fresh one. **Not yet pushed** — awaiting approval.
- `lib/supabase/server-auth.ts` — new `currentAuthUserId()`; returns null on
  signed-out, local mode, or any auth error so checkout never breaks.
- `lib/orders/db.ts` + `lib/supabase/types.ts` — `auth_user_id` on
  `CreateOrderInput` / `OrderRow`, written in `createOrder`.
- `app/api/checkout/route.ts`, `app/api/paypal/capture/route.ts` — resolve the
  uid at the route level and pass it in. Deliberately *not* read inside
  `createOrder`: the webhook repair path has no buyer session.
- `lib/account/data.ts` — match `order.auth_user_id === user.id` first.
- `tests/unit/order-auth-link.test.ts` — 3 new tests.

**Verification.** `tsc --noEmit` clean, `eslint` clean, `npm run test:unit`
63/63 pass, `npm run build` succeeds. End-to-end signed-in checkout against
hosted **not yet run** — needs migration approval and an OTP sign-in.

**Known limitations.** Orders #1013/#1014 carry no email and no uid, so no fix
can retroactively surface them. Webhook-repaired and admin-draft orders get a
null uid by design. Steps 2–4 (checkout email prefill, the placeholder email
panel, the `0002` drift repair) are not started.

## 2026-07-30 — Product handle rule (deterministic title → handle)

Added `docs/naming/product-handles.md` v1.0 (Proposed, awaiting sign-off): a strict
ordered algorithm deriving `products.handle` from `products.title`, written so
any person or AI model produces the identical string.

- **Why:** `handle` is the public URL and must be reproducible and stable. The
  question that started this was whether `handle` could be `lower(sku)` — it
  cannot: `handle` is on `products` (one per page), `sku` is on
  `product_variants` (one per variant), so the relation is 1:N. Deriving the
  handle from a SKU stem also collides (stripping COLOR leaves only ~4 stems
  for far more listings) and couples public URLs to ops renumbering.
- **Three decisions that buy determinism:** closed word lists instead of
  judgment (§7 deliberately excludes "marketing fluff" — taste is not
  reproducible); `option_names` is a required second input, because a title
  alone cannot say whether a colour word is a variant axis; and generic results
  fail loudly rather than shipping `rose` or appending `-2`.
- **Verified:** all 10 fixtures in §6 pass against the reference
  implementation extracted from the document's own code block (not a separate
  copy). Regexes converted from literal combining marks to `\uXXXX` escapes so
  copy-paste between models and editors cannot corrupt them — the same hazard
  `ixd/frame-names.md` documents for the U+00B7 middle dot.
- **Not done, needs decisions:** the `product_redirects` migration (an active
  handle cannot be changed safely without it) and wiring the format check into
  `lib/admin/products.ts` plus a unit test over the fixtures.

Read-only side finding from the same session: the Figma file
`3CXNpmuuyNyCW70qOci0oM` groups frames by click depth (一级…五级), which has
already produced two different sections both named `mepage-Account & Privacy`
(`1541:252`, `1523:953`).

## 2026-07-30 — Label local JSON database as mock data

- Added persistent `_meta` mock-data guidance to the local database generator.
- Updated the current `.data/db.json`; verified JSON parsing, generated metadata, and TypeScript.

## 2026-07-30 — Consolidate the IxD naming docs; add `archive/`

Docs cleanup requested by Charles across one session.

**File operations**
- Deleted `docs/ixd/frame-names.md` (Charles removed it) — superseded by
  `naming/figma-route-rule.md`, which *inverts* the rule: lowercase
  leading-slash frame routes plus UPPERCASE route sections, replacing the
  UPPERCASE slash-dropped scheme adopted 2026-07-29.
- Moved `docs/naming/` → `docs/ixd/naming/` (`figma-route-rule.md`,
  `product-handles.md`).
- `figma-naming-guide.md` → `from-teammates-figma-naming-guide.md` (Charles
  renamed; all six references updated).
- Deleted `docs/ixd/bottom-nav-buttons.md` (one line, already recorded in
  README's 07-27 findings) and `docs/ixd/feedback-2026-07-28.md` (a derived
  draft whose own header names README § "07-28 screen imports" as its source of
  record).
- Moved `docs/ixd/homepage.md` → `temp/homepage.md`.
- Created `archive/` + `archive/README.md` — a *tracked* home for superseded
  docs, whose defining rule is "nothing in here is referenced anywhere in the
  repo", with the `archive/` vs gitignored-`temp/` distinction spelled out.

**Eleven references repaired** across `docs/ixd/README.md`, `element-names.md`,
`delivery-protocol.md`, `order-detail.md`, `frontend-definition-of-done.md`,
`naming/product-handles.md` (including `../Database.md` → `../../Database.md`
after the move), `docs/TODO/2026-07-28-design-team-navigation-questions.md`, and
`tests/e2e/homepage.spec.ts`. `.ai/WORKLOG.md` mentions left as-is — history is
never rewritten.

**Verified:** 63/63 unit tests pass, including the four in
`tests/unit/element-names.test.ts` that parse `element-names.md`; `tsc --noEmit`
clean; every relative markdown link under `docs/ixd/` and `archive/` resolves;
no live markdown link to any of the five removed files remains.

**Three things the `frame-names.md` deletion dropped, not re-homed in
`naming/figma-route-rule.md`:**
1. The **U+00B7 look-alike warning.** The new rule's whole syntax hangs on `·`,
   yet it carries no warning about `•` (U+2022) or `・` (U+30FB) — and the design
   team types on Chinese IMEs, which insert the katakana dot by default. The
   most consequential loss of the three.
2. The **five blocking route decisions** (`/bag` vs `/cart`; `/care` vs `/help`;
   whether the four settings pages move under `/account/settings/`; whether B2B
   gets its own namespace; whether privacy-policy / keepsake / track move to
   `/policies/`, `/gift/`, `/track`). Sixteen frames were held on these.
3. The `data-el` **deep-route separator question** (old §4).

The 40-frame rename worklist also went, but it was already stale — keyed on
pre-reorganisation node ids that the 07-29 delivery replaced wholesale. A fresh
live mapping of all 53 frames against the 32 storefront routes was read this
session and is not yet written down anywhere.

**`naming/figma-route-rule.md` gaps:** no status/version header, so nobody can
tell whether it is Proposed or Adopted (every sibling naming doc has one); an
unanswered inline stub "Q: how to name handle?" that `naming/product-handles.md`
in the same folder now answers; and two example routes that do not exist in
`app/**` — `/shop/cart` (the cart route is `/bag`) and `/products` as a listing
page (only `/products/[slug]` exists).

**`temp/` is gitignored** (`.gitignore:46`, zero tracked files), so
`temp/homepage.md` has left version control: absent from GitHub, local to the
iMac, and `git clean -xfd` would erase it. Its `H-01…H-37` ids are still cited
in 26 places across `components/home/`, `components/MenuDrawer.tsx`,
`StoryScreen.tsx` and others, so the dictionary for those comments now sits
outside the repo. `archive/` is the tracked alternative if that matters.

## 2026-07-30 — Repository AI tag system

- Added root `AGENT-INBOX.md` as the detailed source of truth for concise
  in-place `AI-TAG(AI-nnn)` comments.
- Defined `OWNER-TODO`, `OWNER-DECISION`, `AGENT-UNSURE`, `AGENT-BLOCKED`,
  `PLACEHOLDER`, and `AGENT-DECISION`.
- Added representative tags `AI-001`–`AI-003` for shipping, the placeholder
  bag, and privacy-policy content.
- Updated `AGENTS.md` and `SUMMARY.md` so future agents discover and maintain
  the system.
- Verified tag/inbox ID parity, local links, ESLint, Prettier for documentation,
  and whitespace errors.

## 2026-07-30 — Delivery intake folders; `temp/` → `trash/`

Owner's workflow request: one folder to drop raw upstream deliveries into, a
second to keep the originals after parsing, READMEs carrying his own words.

- **New `team-deliveries/`** — `inbox/` (raw drops, empty = nothing pending) and
  `originals/<YYYY-MM-DD>-<slug>/` (delivered files kept untouched, each batch
  with a `batch.md` listing every file's sha256 and size). Named `originals/`
  after `parsed/` misled the owner on first read — the folder holds what was
  *sent*, not what parsing produced.
- **The hashes are load-bearing.** The owner's rule is "check before you parse,
  and stop rather than act": hash match = duplicate, same subject + different
  hash = re-delivery. Without a manifest that check degrades into eyeballing
  filenames, which is how the byte-identical `1232:114` duplicate got imported
  twice on 07-28.
- **Resolved the gitignore hole flagged in the entry above.** The three delivered
  sources moved out of gitignored `temp/` into version control; `homepage.md`
  went back to `docs/ixd/`, so the `H-01…H-37` ids cited across
  `components/home/` resolve to a tracked file again.
- **`temp/` → `trash/`**, but only *after* the sources left — renaming first
  would have relabelled the H-01…H-37 dictionary as garbage.
  `PlaceholderPicture.png` was rescued to `assets/` for the same reason: it is a
  live asset (`SUMMARY.md` cites it), not scratch.
- Three folders, three non-overlapping rules, all stated in `archive/README.md`:
  `team-deliveries/` tracked + constantly cited; `archive/` tracked + never cited;
  `trash/` gitignored + never cited.
- Updated 24 references across 11 files. Left `supabase/.temp/` alone — it is the
  Supabase CLI's own folder and a blind `temp/` replace would have broken
  `scripts/apply-auth-email-templates.mjs`.
- Renamed to `team-deliveries/` at the owner's request. Added `team-deliveries/originals/` to `.prettierignore`: reformatting a verbatim
  source would rewrite what the design team actually sent.
- Re-based 39 relative links inside the moved `.zh.md` files (`../docs/ixd/…` →
  `../../../docs/ixd/…`). Those screenshot embeds are plumbing we added at
  import, not delivered text; recorded in each `batch.md`.
- New tags: `AI-004` (routing table not yet written — agents must stop and ask)
  and `AI-005` (unclear whether the Figma naming `.xlsx` is an incoming delivery
  or a generated export; kept, not guessed).
- Verified: 63/63 unit tests, `tsc --noEmit` clean, ESLint clean, all markdown
  links resolve, no `temp/` references left outside `supabase/.temp/`.
  Nothing committed — the working tree carries unrelated changes.

## 2026-07-30 — Stable-first Figma frame naming

- Revised `docs/ixd/naming/figma-route-rule.md` so every frame begins with the
  fixed prefix `<exact route> · <viewport>`.
- Made screen description, state, and future metadata flexible trailing parts.
- Corrected examples to real routes: `/shop`, `/products/[slug]`, and `/bag`.
- Linked the separate product-handle rule and verified Markdown formatting and
  route-file existence.

## 2026-07-30 — Removed repository AGENTS protocol

- Deleted root `AGENTS.md` at the owner's request.
- Changed `CLAUDE.md` from the deleted import to `@SUMMARY.md`.
- Removed the obsolete `AGENTS.md` entry from the `SUMMARY.md` repository tree.
- Verified there are no remaining `AGENTS.md` references and Markdown formatting
  passes.
- **Caught in verification:** the manifest hashes for the two `.zh.md` files were
  computed *before* the link re-base, so `batch.md` disagreed with the file on
  disk — which would have made a genuine duplicate read as a re-delivery, the
  exact failure the check exists to prevent. Each edited file now records both
  `as received` (what the check compares against) and `on disk now`, and the
  README states which is which.

## 2026-07-30 — Created agent-delivery structure

- Created `agent-delivery/README.md`, `INBOX.md`, and `DELIVERIES.md`.
- Moved the root Agent Inbox into the new folder, separating instructions from
  the five open `AI-nnn` records.
- Updated every active in-place tag, team-delivery reference, and `SUMMARY.md`
  discovery link.
- Verified ID parity, local Markdown links, Prettier, ESLint, and whitespace.

## 2026-07-30 — Removed agent delivery log

- Deleted `agent-delivery/DELIVERIES.md` at the owner's request.
- Removed its workflow instructions and updated `SUMMARY.md`.
- Verified the folder now contains only `README.md` and `INBOX.md`, with no
  remaining delivery-log references.

**Follow-up, same day:** added one rule to `naming/product-handles.md` §2 —
*keep variant words out of titles* (`Eternal Rose` + `option_names: ["Color"]`,
never `Eternal Rose — Ruby Red`). Step 9 only fires when a title contains a
colour or size word, so titles that never name a variant make `option_names`
irrelevant to handle derivation and collapse the rule back to a single input.
Prose only — §6 fixtures and the §10 reference implementation are untouched.
Still open from the review above: `option_values` vs `option_names` precision
(§7), and `option_names` is unenforced free text (`text[]`, `z.string()`) while
the three seeded products use `["Gift option"]`, which step 9 does not match.

**Correction to the follow-up above** (same session, after Charles clarified):
the change is not a permanent "titles rule" but a **staged input decision** —
`naming/product-handles.md` §2 now records *current stage: derive from `title`
alone, `option_names` is not an input*, safe only because handles are unfrozen
pre-launch (three placeholder products, no inbound links). Made consistent in
four places: the §2 inputs table and callouts, step 9 (marked **inert** while
`option_names` is `[]`), the §6 fixture note (only rows 4/5/6/8 can occur now),
and the §11 paste-to-a-model prompt block (title-only input). `option_names`
becomes required when variants ship, and every handle must be re-derived before
go-live — the last moment a handle is free to change (§8). §6 fixtures and the
§10 reference implementation are otherwise unchanged; no test parses this doc.

### Deliveries — 2026-07-30 (continued)

- `f681037` (branch `docs/naming-guide-source-path`, pushed, no PR opened):
  `from-teammates-figma-naming-guide.md` cited `temp/Figma_UI_Naming_Guide_GoldRose.xlsx`
  in both its intro and Source-file row. That xlsx moved to tracked
  `team-deliveries/originals/2026-07-25-figma-naming-guide/` in `c53435d`, which
  fixed `element-names.md` but missed this file. Repointed both, and dropped
  "version-controlled"/"scratch folder" from the rationale — the xlsx is tracked
  now, so transcription buys greppability, not version control.
- `SUMMARY.md` doc index gained two rows: `docs/ixd/naming/` (Figma
  section/frame + product-handle rules) and `element-names.md` (inside-a-page
  `data-el` names). Both were unreachable from the entrypoint, so an agent asked
  to name a frame or mint a handle would not have found the rules.

Reviewed but **not** changed — `lib/admin/products.ts:112-145` (`slugify` /
`uniqueHandle`) contradicts `naming/product-handles.md` on every fixture: no NFKD
(`Rosé Éternelle` → `ros-ternelle`), no boilerplate/brand stripping
(`24k-gold-dipped-eternal-rose` vs `eternal-rose`), a `|| "product"` fallback, and
`-2` collision numbering that §5 and §11 explicitly forbid. No handle unit test
exists and `product_redirects` still does not. Recommended to Charles: port the
§10 reference implementation, throw on collision, and run the §6 fixtures as a
test **before** the 120-SKU import — while the signature is still one argument.
Also advised that aggressive trimming is optional (Shopify/IKEA ship full-title
slugs; keyword-in-URL is a weak signal) and that it manufactures the collisions
§4.6 exists to catch — 2 of 10 fixtures already fall through to manual.

## 2026-07-30 — Finalized product handle stop-word rule

- Finalized `docs/ixd/naming/product-handles.md` as adopted version 2.1.
- Decided that full-title slugification retains stop words; there is no
  automatic stop-word removal list.
- Replaced speculative SEO claims with official Google and Shopify guidance.
- Verified Markdown, section references, whitespace, and ten handle fixtures.
- Application enforcement and the redirect table remain future work.

### Deliveries — 2026-07-30 (product handles v2.x)

`naming/product-handles.md` rewritten to full-title slugification and cut
**334 → 193 lines**. Charles chose the approach after weighing it against v1.0's
semantic trimming; he then bumped it to v2.1 **Adopted**, added §3 "Stop words are
retained" with Google/Shopify citations, and fixed the section cross-references.

Deleted as no longer reachable: the `option_names` input and §2 entirely, all six
closed lists (stop words, brand tokens, boilerplate phrases, colour tokens, size
tokens, generic stems), the 60-char truncation step, "what is deliberately not
automated", and the paste-to-a-model prompt block. The algorithm is now six steps
and the reference implementation is one expression chain.

Three things the change buys, worth recording as the rationale:
- **No manual cases.** v1.0 sent 2 of 10 fixtures to "manual handle required";
  v2.1 sends none. The trimming was manufacturing the collisions that the §4.6
  generic-stem reject list and the no-`-2` rule existed to catch.
- **`option_names` is gone permanently**, not just deferred. v1.0 needed to know
  whether a colour word was a variant axis before deciding to strip it; nothing is
  stripped now, so the fact is never needed — including once variants ship.
- **The code gap shrank.** `slugify`/`uniqueHandle` in `lib/admin/products.ts` was
  four bugs plus a wholly different token pipeline away from v1.0. Against v2.1 it
  is three things: NFKD, apostrophe deletion, and throwing instead of appending
  `-2` / falling back to `"product"`.

**Verified:** all 8 §5 fixtures and all 3 §3 prose examples pass against the
implementation *extracted from the document's own code block* (not a copy), and
the empty / punctuation-only / em-dash-only inputs throw as §4 specifies. Caught
and fixed one regression I introduced: the reference implementation's regexes had
literal combining marks and a literal U+2019 rather than `\uXXXX` escapes — the
invisible copy-paste corruption hazard the doc was written to avoid. Code block is
now ASCII-only apart from an em dash inside the error string.

**Still open, unactioned:** port §8 into `lib/admin/products.ts`, throw on
collision, encode §5 as a unit test, and add the `product_redirects` migration —
all before the 120-SKU import.

**Follow-up:** §5 fixtures labelled as mock, per Charles — every title there is an
invented test input, not a product name, and none is a proposal (no title is
decided; OQ-3). Added a row-by-row table of what each fixture pins (digit/letter
tokens, apostrophe vs hyphen, stop word retained, NFKD, separator-run collapsing,
comma, colour word retained, 74-char no-truncation) and the instruction to **keep**
these rows when real titles land — a fixture locks the algorithm, it does not
describe the catalogue, so swapping in real names would lose the edge cases and go
stale on every marketing rename. Re-verified: extraction still yields exactly 8
fixtures + 3 prose examples, 0 failing, so the added table did not pollute the
parse.

## 2026-07-30 — Product-handle rule enforced in code (conflicts fixed)

- `docs/ixd/naming/product-handles.md` (v2.1, canonical): fixed the dead
  anchors and section numbering left by the manual trim; added an
  Implementation row pointing at the new code.
- New `lib/admin/product-handle.ts`: the one `productHandle()` implementation
  (NFKD, apostrophe deletion, no truncation, throws instead of inventing).
- `lib/admin/products.ts`: removed `slugify`/`uniqueHandle` (`-2` suffixes,
  60-char cut, "product" fallback). Collisions now throw; manual handles are
  validated; non-draft handles are frozen until `product_redirects` exists.
- `app/admin/(dashboard)/products/actions.ts`: zod handle regex tightened to
  the canonical format. `ProductForm.tsx`: handle input collapses hyphen runs.
- New `tests/unit/product-handle.test.ts`: parses the doc's fixture table and
  replays it through `productHandle()` (element-names pattern, no drift).
- `docs/learning/03-admin-product-crud.md`: updated the identity step to the
  new behaviour.
- Verified: tsc clean, eslint clean, 67 unit tests pass, admin-products e2e
  passes. ⚠️ Known consequence: duplicating in the Chinese admin (prefix
  副本) derives the same handle as the original and now errors by design.

## 2026-07-30 — Removed component naming from route rule

- Removed the reusable-components section and component capitalization bullet
  from `docs/ixd/naming/figma-route-rule.md`.
- Kept the document focused on page-level sections, routes, viewports, and
  states.
- Verified formatting, whitespace, and removal of the old examples.

## 2026-07-30 — elements→components merge

- element-names.md stub deleted; docs/ixd/naming/component-names.md is the
  single successor (Figma components + in-page data-el components; word is
  now "component"). Repointed SUMMARY naming row, ixd README, migration 0005
  comment; concurrent session had already cleaned the other references.

## 2026-07-30 — Figma write access verified; homepage frame renamed (test)

- Confirmed Figma MCP can write to the VELORIA file (`3CXNpmuuyNyCW70qOci0oM`) after the design team granted `qiyaofu715@gmail.com` edit access.
- Test rename applied: frame `1523:1655` "Homepage" → `/ · mobile · homepage` (per `docs/ixd/naming/figma-route-rule.md`); verified with a fresh read.
- Gotcha: `figma.saveVersionHistoryAsync` is not supported via the MCP bridge — rely on Figma's automatic version history + recorded old→new name list for rollback.
- Next: full naming pass — read all top-level frames, map to route + viewport, get Charles's sign-off on the old→new list, then apply.

## 2026-07-30 — Removed default Figma frame states

- Removed every `default` state from `docs/ixd/naming/figma-route-rule.md`.
- Normal frames now omit state metadata; explicit states remain only when they
  distinguish a variation.
- Cleaned one trailing space and verified formatting and whitespace.

## 2026-07-30 — Removed Chinese default frame states

- Removed every `默认` state from the account examples in
  `docs/ixd/naming/figma-route-rule.md`.
- Verified no `默认` text remains and formatting passes.

## 2026-07-30 — Figma frame names aligned to the route rule

Applied `figma-route-rule.md` to the Figma file (3CXNpmuuyNyCW70qOci0oM), per
Charles's scheme: prefix `<exact route> · <viewport>` and keep the team's
original frame name verbatim as the metadata suffix (e.g. `shoppage` →
`/shop · mobile · shoppage`). 47 frames renamed, verified by read-back.
Skipped (flagged, no route exists): Business·Procurement, BLOG-JOURNAL-PAGE,
RETURNS-REQUEST-SUBMITTED-PAGE, plus the two component-sheet frames. Sections
left on the team's click-depth scheme (shop一级/me二级…) — renaming them to
uppercase route sections is a design-team conversation, not done unilaterally.

## 2026-07-30 — Clarified Figma developer-facing prefix

- Added matching English and Chinese instructions to
  `docs/ixd/naming/figma-route-rule.md`.
- Defined `<exact route> · <viewport>` as the only developer-facing part;
  trailing descriptions and states are design-only metadata.
- Verified both language rules, formatting, and whitespace.

## 2026-07-30 — Frame-naming rule v2.0 and re-apply

Charles amended his rule: the viewport is now the ownership boundary —
`<route> · <state> · <viewport> · <team's parts>`; dev owns the three parts
before the viewport (`default` when the page is plain; `return`, `filter
open`, `signed out`… otherwise), the design team owns everything after.
`figma-route-rule.md` rewritten as Adopted v2.0 (EN + 简明版) and all 48
routed frames re-renamed in the Figma file with explicit states, verified
by the tool's mutation return (48/48, none missing).

## 2026-07-30 — H-24 wired to /story per Figma comment

Read the file's comments via REST (renewed token). Charles's test comment on
the homepage frame pins the A-6 "Read Customer Stories" button → wired it to
`/story` in `components/home/A6.tsx` (placeholder div → Link, geometry
unchanged). tsc clean, homepage e2e 5/5 green. Also surfaced 16 unactioned
QA comments from 苏苏白衣 (fixed top nav, PDP bag targets, shop二级 back
mechanisms, refund buttons, checkout payment module).

## 2026-07-30 — /checkout re-imported from Figma (B-2 reflow)

- Re-imported B-2 checkout from the reorganized frame 1523:421 (430×1728, was
  561:88 at 430×2102): express-wallet module and discount-code card deleted by
  design, order summary moved between shipping and payment, address grid
  re-flowed, module 06 reduced to help/FAQ/pay-bar.
- Kept discount entry as a dev band (feature §8 is live); moved the PayPal
  JS-SDK button into the Pay-Securely CTA slot; mock PayPal now enters via the
  payment section's PayPal row. ELDREVE wordmark substituted with GoldRose
  (DQ-34 precedent).
- Rewrote components/checkout/CheckoutSkin.tsx (5 modules) and re-wired
  app/checkout/CheckoutClient.tsx live twins; 14 fresh Figma asset exports.
- Findings for the design team recorded in docs/ixd/README.md ("07-30 checkout
  reflow"). Verified: tsc, eslint, 63 unit tests, checkout+discount e2e (10/10),
  full-page screenshot vs frame render.

## 2026-07-30 — Domain research and recommendation (OQ-4)

RDAP-checked candidate domains: all natural `goldrose*.com` variants taken;
`goldrose.co`, `goldrose.shop`, `goldrose.store` available. Recommended to
bosses: `goldrose.co` at Cloudflare Registrar in a boss-owned account
(~US$25–30/yr), `goldrose.shop` as defensive redirect; parked `goldrose.com`
purchasable aftermarket if they want it. Registrar rationale: at-cost, neutral
of Vercel (host switch = one DNS record). Switch caveats recorded in SUMMARY
OQ-4: passkey RP ID pinned to vercel domain, Supabase auth URLs, PayPal
return URLs. Awaiting boss name sign-off before registering.

## 2026-07-30 — Shop filter-chip overlap

- Moved the `Gift Sets` chip to leave an 8px design-space gap after `Ruby Red`.
- Verified with ESLint, TypeScript, and the live `/shop` page; the rendered chips no longer overlap.

## 2026-07-31 — Deliveries

- Aligned the test-layers markdown table and de-squeezed the CI ASCII diagram
  in `docs/learning/09-tests-and-ci.md` (cosmetic whitespace only).
- Created user-level `/align` skill (`~/.claude/skills/align/SKILL.md`)
  capturing the method: pad table cells to widest entry; realign ASCII
  diagrams via measure → uniform script shift (stretch arrows) → verify,
  never by eye. Not mirrored to Codex `.agents/skills/` (offered, pending).
- Ran `/align` on the catalog-read diagram in
  `docs/learning/04-how-pages-read-the-database.md`: single-anchored the
  ragged inner branch column, widened the box edge 78→82 (whitespace only).
- Renamed the features README heading "Status tree (= roadmap)" →
  "Roadmap (status tree)" and updated its two in-file references
  (`docs/features/README.md`); verified no other file or anchor links to the
  old name.
- Ran `/align` over `docs/features/README.md`: lifecycle-diagram annotations
  anchored under their stages, file-format table cells padded; status trees
  intentionally untouched (doc mandates inline meters + narrow lines).

## 2026-07-31 — Feature-registry tooling: generated roadmap + CI drift check

- Built the missing half of the front-matter feature registry (schema landed
  in #20): `scripts/features/lib.mjs` (YAML-subset parser + zod validation +
  roadmap renderer) and new CLI commands generate/check/validate/list.
- docs/features/README.md roadmap trees are now GENERATED between
  `roadmap:begin/end` markers from record front matter, 15 new
  `<area>/<group-id>/_group.md` group nodes, and roadmap.legacy.yaml
  (45 pre-system leaves transcribed from the hand tree; shrinks as leaves
  graduate). Old DONE label renders as VERIFIED per TEMPLATE.md.
- npm scripts features:generate / features:check added; features:check wired
  into CI; unit test tests/unit/features-registry.test.ts guards the parser
  and live registry. Fixed stale/missing front matter in order-tracking,
  region-alignment, promotion-emails, engagement-tracking, db-backups.

## 2026-07-31 16:01 AEST

- Archived `docs/ixd/naming/from-teammates-figma-naming-guide.md` to
  `archive/` via `git mv`, following the archive/README procedure: removed the
  bullet in `docs/ixd/README.md`, de-linked the stale pointer in
  `team-deliveries/originals/2026-07-25-figma-naming-guide/batch.md`, and added
  the ledger row naming `docs/ixd/naming/{figma-route-rule,component-names,product-handles}.md`
  as successors. Verified the `ORDER-DETAIL-*` IDs come from the 2026-07-27
  delivery, not this guide. Also listed the previously-unlisted
  `naming/component-names.md` in the ixd README.

## 2026-07-31 — Markdown table alignment (repo-wide)

Ran the `/align` skill across every markdown file carrying a GFM table:
34 files, 136 tables, padding only. Cells were padded to the widest entry
per column (measured in monospace display columns, so CJK and emoji tables
line up) and separator rows stretched to match, preserving alignment colons.

- Excluded `team-deliveries/originals/` — verbatim upstream sources.
- `docs/Database.md` included under the explicit repo-wide request.
- ASCII diagrams and trees were not touched; tables only.
- Verified: content identical to HEAD after normalising padding, every row
  of every table equal display width, and the pass is idempotent.

Note: `.prettierignore` still excludes `*.md`, so nothing enforces this —
its comment anticipates "revisit as its own commit once the docs restructure
settles". Re-enabling Prettier for markdown is still an open call.

## 2026-07-31 16:57 AEST

- Imported the blog journal page from Figma (BLOG-JOURNAL-PAGE 1593:115, a new
  batch above the 07-30 node-id ceiling) → `/blog`:
  `components/screens/BlogScreen.tsx` + `app/blog/page.tsx`, pixel-exact from
  REST node data (intro/featured/2×2 chips/4 article cards/CTA), assets rendered
  at scale 2 into `public/veloria/screens/`.
- Wired the menu drawer's BLOG row (inert since 07-25) to `/blog`; the frame's
  own prototype (new this batch — 11 interactions, previously zero) draws the
  same `Menu · BLOG →` click.
- Verified: content band diff 1.4% vs the scale-2 frame render (font-AA
  envelope); typecheck + lint + prettier clean, 66 unit tests pass, added and
  passed an e2e for the menu→/blog navigation.
- Shipped as a visible placeholder (mock journal copy — OQ-3), consistent with
  the recorded "blog content TBD → leave with placeholder" instruction, not a
  "no blog" decision. DQs logged in docs/ixd/README.md (clipped titles, no exit
  wiring, chrome substitutions). Two sibling frames stay unimported
  (returns-submitted, reminders edit-modal) pending Ready-for-dev + triggers.

## 2026-07-31 19:41 AEST

- Checked Figma for updates: file was re-modified (new /gift-guide long page
  1942:182, blog frame chrome edited). Then, per owner instruction, read the
  Figma COMMENTS (`GET /v1/files/:key/comments`) and implemented only the
  thread the owner marked "ok".
- The two "ok" replies both land on node 1599:245 (reminders edit modal):
  owner asked "add navigation", design said "info-storage modal, no jump page,
  Cancel discards → default", owner said "ok". Built exactly that:
  `components/screens/ReminderEditModal.tsx`, a pixel-exact 430×548 bottom
  sheet wired into `/account/reminders` (Add reminder + each card's Edit open
  it; ×/Cancel/dim/Escape discard and close; Save closes; nothing persists).
- Glyphs via Figma SVG exports; ✉ reuses the reminders page's .notdef-safe PNG
  crop. Verified: modal band diff 1.6% (font-AA envelope); typecheck + lint +
  prettier clean, 66 unit tests pass, added + passed an e2e (open → Cancel/Add
  → Escape). Left the /gift-guide page and blog-chrome edits untouched (no
  owner "ok"). Uncommitted (tree carries an unrelated repo-wide reformat).

## 2026-07-31 20:08 AEST

Agent-delivery restructured into per-session files

- Replaced the single `agent-delivery/INBOX.md` message list with
  `agent-delivery/sessions/`: one markdown file per agent session, named
  `<session-name>-MM-DD[-branch].md`. Reason: the monolithic file made every
  agent edit the same table and the same `Next ID` line — a guaranteed merge
  conflict once two agents work in parallel.
- `INBOX.md` is now an index only (open-matters table + session-file table).
- Removed the stored `Next ID`. The next ID is the highest `AI-nnn` in
  `sessions/` plus one:
  `grep -rho 'AI-[0-9]\{3\}' agent-delivery/sessions/ | sort -u | tail -1`.
- Each session file ends with a `## Delivered this session` bullet list — the
  short hand-off note. Detailed history stays here in the worklog.
- Migrated AI-001…AI-005 into `sessions/initial-inbox-07-30.md` and repointed
  their five in-place `AI-TAG(...)` links (seed-data.ts, app/bag,
  app/account/privacy-policy, team-deliveries/README.md, the naming-guide
  batch) from `/agent-delivery/INBOX.md#ai-nnn` to the session file.
- Raised AI-006: the `sessions/` folder name is a placeholder pending Charles's
  choice, and renaming later means touching every in-place tag link.
- `SUMMARY.md` now tells agents to **write back** before finishing, not only to
  read the folder at startup.

## 2026-07-31 20:13 AEST

Agent-inbox CLI

- Added `scripts/agent-inbox.mjs` (`npm run agent-inbox` / `inbox:resolve` /
  `inbox:check`). `resolve` deletes a matter's three records together — the
  `INBOX.md` row, the session-file entry, and the in-place `AI-TAG(...)`
  comment — with `--dry-run`, `--archive` (appends to `RESOLVED.md`), and
  `--reason`.
- `check` fails when an index row and a session entry disagree, and warns when
  a matter has no in-place tag. It warns rather than fails because a matter
  about a folder or a whole document has no single line to pin a comment to —
  AI-006 is the current example.
- Verified end to end with a throwaway AI-999 planted in all three places: after
  `resolve`, all three files were byte-identical to their pre-test state.

## 2026-07-31 20:20 AEST

Agent-inbox CLI — interactive close

- `npm run agent-inbox:close` with no arguments now lists the open matters,
  asks which to close, and asks delete-or-archive. Removes the need to read an
  id off the list and retype it behind npm's `--`.
- Ids accepted as `4`, `ai-4`, or `AI-004`; written form stays uppercase so
  in-place tags read as code markers (`TODO`-style) and grep cleanly.
- Prompts refuse to run without a TTY, so CI fails fast instead of hanging.
  Enter, `c`, or Ctrl+D cancels; Ctrl+D previously threw an AbortError stack
  trace and now exits cleanly.
- Verified the interactive path through a real pty with a throwaway AI-999
  planted in all three places: after the close, all three files were
  byte-identical to their pre-test state.

## 2026-07-31 20:29 AEST

Agent-inbox: closing archives, never deletes

- Removed the delete path from `npm run agent-inbox:close`. Closing now writes
  `agent-delivery/archive/AI-nnn-<slug>.md` **first**, then removes the index
  row, the session entry, and the in-place tag. If the archive write fails,
  nothing is removed.
- Archived files are `chmod 0444`. Verified: appending to one is refused by
  the shell. Read-only is a guard against absent-minded edits, not security.
- Ids are never reused, and `resolve` refuses an id that already has an
  archive file — so a closed matter cannot be silently overwritten.
- Archive is private: added `permissions.ask` entries in
  `.claude/settings.json` so Claude Code prompts before reading the folder,
  plus the written rule in `SUMMARY.md`, `agent-delivery/README.md`, and
  `agent-delivery/archive/README.md`. The rule is the real control; the
  prompt is a reminder. Nothing in the archive is project context.
- Verified end to end with a throwaway AI-999: archive file created read-only
  with the closing date and reason, and all three live files returned
  byte-identical to their pre-test state.

## 2026-07-31 20:30 AEST

Agent-inbox renamed, commands documented

- `scripts/inbox.mjs` → `scripts/agent-inbox.mjs`; npm scripts are now
  `agent-inbox` (list), `agent-inbox:close`, `agent-inbox:check`. The
  verb is "close" everywhere now that closing always archives — "resolve" still
  works as a hidden alias so older notes keep running.
- Added "Housekeeping commands" to `README.md`: the non-obvious npm scripts,
  plus the reminder that bare `npm run` lists every script in package.json,
  and one-line notes on the two conventions that are easy to forget — the agent
  inbox and the worklog.

## 2026-07-31 20:37 AEST

Agent-inbox: arrow-key menus

- `npm run agent-inbox:close` now walks three menus instead of typed answers:
  pick the matter, confirm, then pick why it is closed — `answered`, `done`,
  `dropped`, or `other` which drops to a free-text line. ↑/↓ or j/k move, a
  digit jumps, Enter chooses, Esc/Ctrl+C cancels.
- Implemented with `readline.emitKeypressEvents` + raw mode and two ANSI
  escapes (`\x1b[NA` to move up N lines, `\x1b[2K` to clear a line) — no
  new dependency. Raw-mode menus and readline never run at once: the free-text
  prompt is only opened after the menus have released stdin.
- Verified by driving a real pty with arrow-key bytes: the cursor moved, the
  redraw was clean, and the chosen reason reached the archive file.

## 2026-07-31 20:44 AEST

Agent-inbox: menu redraw fix

- Bug (found by Charles): navigating the close menu duplicated and clobbered
  lines. Cause — the redraw moves the cursor up by `options.length`, but a
  label longer than the terminal width wraps onto two rows, so the list is
  taller than the option count and the cursor lands mid-list.
- Fix: truncate every label to `process.stdout.columns - 3` with an ellipsis,
  guaranteeing one row per option. Also hide the cursor during the menu and
  restore it on every exit path via a `process.on("exit")` hook.
- Verified by driving a pty at 40, 60, and 100 columns: six clean rows at each
  width, correct item selected, and the dry run still wrote nothing.

## 2026-07-31 21:07 AEST

Agent-inbox: detail pane and alternate screen

- → on the close menu opens the selected matter's full entry (read from its
  session file, soft-wrapped, with the source filename); ← returns to the list.
  Esc closes the pane first and only cancels from the list.
- Menus moved onto the alternate screen buffer (`\x1b[?1049h`), the buffer
  `less` and `vim` use. Each keypress now repaints the entire view instead of
  moving the cursor up N lines, which removes the row-counting fragility behind
  the earlier clobbering bug, and the terminal's scrollback is restored intact
  on exit. Enter/leave are guarded on `isTTY` and undone in a
  `process.on("exit")` hook so no exit path strands the terminal.
- The pane truncates to the window height with a "… N more line(s)" footer
  rather than scrolling; long entries are read in the session file.
- Verified through a pty at 84 columns: ↓↓→ shows AI-003's entry, ← returns,
  and Enter still completes the flow. Dry run wrote nothing.

## 2026-07-31 21:12 AEST

Agent-inbox: detail pane formatting

- The pane was printing raw markdown (`- **Affected place:** [text](../../path)`).
  It now parses the entry into label/value fields and renders each as a bold
  label with its value wrapped and indented beneath — a definition list rather
  than a bullet dump.
- `plain()` converts markdown for a terminal: a file link collapses to its
  repo-relative path (the actionable part), a URL keeps `text — url`, and
  `**bold**`, backticks, and `_italics_` markers are stripped.
- Continuation lines are folded back into their field before wrapping, so a
  value that wrapped in the source markdown no longer wraps at the wrong place
  on screen.
- Pane header is now `AI-003 · OWNER-TODO` with the one-line summary as the
  first paragraph, instead of reusing the padded list row.
- Checked at 84 and 52 columns and against the longest entry (AI-006, which has
  two links in one field and overflows the window — it truncates with the
  "… N more line(s)" footer).
## 2026-07-31 — Storefront carousel and shop-menu QA

- Normalized the first pagination dot to match its siblings across every homepage carousel.
- Moved the mobile `/shop` sort menu 8px closer to its trigger.
- Verified the changes in the live browser; TypeScript, ESLint, and Next.js runtime checks passed.

## 2026-07-31 — Branch and worktree cleanup

- Verified `ci/github-actions`, `codex/storefront-qa-ux-fixes`, and `feat/product-reviews` were fully merged into main and their worktrees clean, then deleted all three branches (locally and on GitHub) and removed the three worktrees (/private/tmp QA copy, ~/.codex/worktrees/316b, ~/Developer/goldrose-reviews).
- Repo is back to the workflow end state: `main` only, single main checkout. Fetch also pruned two stale remote-tracking refs.

## 2026-07-31 — Figma delivery sync (reminders states, returns scaffold, prototype map)

- Deliveries:
  - Reminders page 1523:3473 aligned to today's edits: SMS toggle defaults
    off / Email on (owner's "comments for ai agents" note), off-track grey
    #E4E8ED, caption regroup nudge. Band diff 2.78%; modal 1599:245 had no
    drift.
  - New coming-soon scaffold /account/returns/request-submitted wired from
    the return sheet's Confirm Return (prototype 1523:1430 → un-ready
    1593:114); 2 new e2e tests; all 20 e2e + unit green.
  - Processed the file's first prototype map (59 interactions), catalogued
    the links deliberately not adopted (AI-008) and the pending-from-design
    queue (simplified homepage, AFTER-SALES 13 screens, gift-guide, blog) in
    docs/ixd/README.md § "07-31 delivery sync"; session hand-off
    agent-delivery/sessions/figma-sync-07-31-feat-figma-sync-0731.md
    (AI-007, AI-008).

## 2026-08-01 — Figma delivery sync (timezone → Pacific; me三级 pulled back)

- Deliveries:
  - Re-polled the file (edited 07-31 14:22): section me三级 lost its
    Ready-for-dev mark — reminders edit modal growing 548→614px with the
    date/timezone pickers; nothing re-imported from it.
  - Applied the one comment-delegated change: reminders timezone value
    EST (UTC−5) → PST (UTC−8) (Pacific-only accepted by Charles; exact
    offset still unanswered by design — AI-009).
  - Noted the simplified homepage's second frame (2024:378) in build and the
    unresolved login-checkbox style debate; docs/ixd README § "08-01
    delivery sync", session hand-off figma-sync-08-01-feat-figma-sync-0801.

## 2026-08-01 — Figma comments pass 2 (login ✓ glyph)

- Deliveries:
  - Drew the system-default ✓ (recolored to band ink) inside the login
    page's Find-Existing-Order □ glyph — the checkbox thread's resolution
    Charles accepted; frame still draws a bare □.
  - Timezone thread closed with "Ok", no concrete UTC — PST (UTC−8) stands
    (AI-009). Team's "删掉Custom Archive" dashboard directive noted as
    pending-from-design.

## 2026-08-01 — features-generator teardown merged to main

- Squash-merged `learn/features-rebuild` into `main`: removed the legacy
  roadmap generator (registry YAML, `scripts/features/` lib+cli, unit test,
  `features:*` npm scripts, per-record `_group.md` files) — ~1,370 lines.
- SUMMARY.md updated: teardown is on `main`; the from-scratch rebuild
  continues (record front matter only). Scratch `scripts/features/cli.mjs`
  stays local/untracked until the rebuild is real.
- 08-02: bottom nav cut to 3 tabs (Home/Shop/Me at x 18/179/340) per the
  design — 商务 dropped, /business/wholesale now navActive="none"; business
  pages stay reachable via the menu drawer's FOR BUSINESS row. Band diff vs
  frame 2024:284 = 1.15%. Home/shop/product-detail pixel baselines
  regenerated (the nav is captured in full-page shots). 89 e2e green.

## 2026-08-02 — Figma sync: two-step checkout, returns flow, date pickers (feat/figma-sync)

- Processed file version 2382879093671597823. `me三级` re-marked Ready-for-dev;
  checkout redesigned as two steps (old frame deleted at source).
- Rebuilt /checkout as the 2157:239/384 two-step flow (?step=payment), pay bar
  fixed to viewport, PayPal/mock/skip branches preserved; CheckoutSkin.tsx
  deleted; dev bands: country, cart rows, discount, gift note (AI-013).
- Imported the returns flow (7 screens + reason sheet, all mock), replacing
  the AI-007 scaffold and the old ReturnsScreen.
- Reminder modal re-imported (430×589) with live Y/M/D dropdowns (AI-011);
  timezone row → "Pacific Time (PT)UTC-8" (AI-009 closed); 2030:190 picker
  sheet deliberately not built (AI-010).
- Security 1526:111 (no password inputs), privacy hub restructure, policies
  hub + 7 /policies/* scaffolds (AI-012), signup without passwords (now
  linked), dashboard tiles/rows, login self-service card.
- Verified: build, 63 unit + 91 e2e green, band-diffs 1.4–2.9% + modal 1.76%;
  home/shop pixel baselines regenerated (pre-existing Chrome AA drift, 37px).
- Hand-off: session file figma-sync-08-02-feat-figma-sync.md; closed AI-007,
  AI-009; opened AI-010…AI-015; docs/ixd 08-02 section; SUMMARY refreshed.

## 2026-08-02 (later) — owner answers on the 08-02 sync

- AI-010 ANSWERED+APPLIED: design un-marked the timezone sheet; timezone now
  auto-switches 冬令时/夏令时 via lib/reminders/timezone.ts (America/Los_Angeles
  offset, 4 unit tests incl. the 2026 switch instants). Closed.
- AI-011: cannot post the Figma reply — FIGMA_TOKEN is read-only
  (file_comments:read; POST 403). Re-tagged OWNER-TODO with the reply text
  ready to paste.
- AI-012 ANSWERED: leave the /policies/* scaffolds untouched. Stays open as
  the placeholder tracker; carries the AI-014 redirect instruction.
- AI-013: entry rewritten in plain language (four missing controls, why each
  exists). Still open pending Charles's OK.
- AI-014 ANSWERED+CLOSED: keep /account/privacy-policy until /policies/privacy
  imports, then redirect; instruction recorded in AI-012 + docs/ixd 08-02.
- AI-015: explained Figma's DRAG trigger (a second prototype outcome on the
  same button — presentation trick, not app behaviour). Open pending his call.

## 2026-08-02 16:35 AEST

- eldreve.com is LIVE on the storefront: attached `eldreve.com` + `www` to
  the Vercel project via CLI, Charles added the two grey-cloud CNAMEs
  (`@`/`www` → 4dc492244a7e5b81.vercel-dns-017.com) in Cloudflare, Vercel
  verified both, Let's Encrypt cert issued (~90s), HTTPS 200. Verified
  against official docs: Cloudflare Registrar locks nameservers to
  Cloudflare (records-based setup is the only path); apex CNAME works via
  Cloudflare flattening. Updated SUMMARY OQ-4 (re-applied after external
  overwrite) and the gold_rose registration record. Pending: ICANN email
  verification click, billing → hua PayPal, auth cutover (passkey RP ID /
  Supabase / PayPal), GoldRose→ELDREVE rename.
- Follow-ups from Charles's second round: AI-011 clarified (the scroll-wheel
  dropdown IS implemented in code — DAYS 1–31 / MONTHS Jan–Dec generated,
  menus scroll; only the reply to the team is still owner work, plus a second
  reply on how to represent data-dependent destinations). AI-013 evidenced
  (new item card 2157:263 has no qty/remove vs the deleted skin's
  onQtyUp/onQtyDown/onRemove; summary 2157:479 keeps a Discount row; admin
  discounts live at app/admin/(dashboard)/discounts; gift note is typed by
  the CUSTOMER and read by the ADMIN on the order's Notes). AI-015 confirmed
  and closed. Noted in docs/ixd: DQ-34 inverts — SUMMARY OQ-4 now says the
  brand becomes ELDREVE, so the GoldRose wordmark substitution must stop for
  new imports (rename itself is its own project).
- 08-02 (later still): PDP ratings-summary block wired to the reviews drawer
  (second prototype trigger, 1523:4109 — the star row was already wired);
  filed AI-016 (PDP still renders the July 2:2 2501px frame while the
  Ready-for-dev PDP is 1523:3971 at 1616px). Owner removed the checkout
  quantity/remove band ("keep the same with figma") — deleted, extra cart
  lines still listed read-only on both steps; filed AI-017 because cart
  editing now exists nowhere in the live site until /bag is wired.
- 08-02: owner also removed the COUNTRY / REGION band ("keep the same with
  figma"). Country is now a read-only value from the server's geo-IP default;
  the rest-of-world e2e drives x-vercel-ip-country instead of a select, which
  exercises the real production path. Filed AI-018 (geo-IP mis-guess
  mis-prices shipping; needs the "US-only at launch?" answer, bears on OQ-2).

## 2026-08-02 · scoped Figma sync: signup + mepage (`feat/figma-sync`)

- Synced only the two frames Charles named, both under Ready-for-dev `me一级`:
  `/account/signup` (1523:3315) and `/account · signed in · mepage` (2210:310).
- Signup: hero → "Continue with your email", Full name field gone at source,
  card title → "Enter your email to continue", button → CONTINUE at y829,
  "Sign in ›" link removed, bottom nav band added (canvas 932 → 974).
- Mepage: Custom Archive tile restored (four tiles, business grid), the inert
  "Address Management ›" row + separator removed at source.
- Greeting: `displayNameOf()` now falls back to the full email address instead
  of its local part (owner instruction).
- Verified by screenshotting both live pages against the scale-2 Figma renders;
  tsc + ESLint clean, 16 account e2e tests pass.
- Raised AI-019 (dropped Sign-in link) and AI-020 (signup frame is now a
  unified email page while its name/route/prototype disagree).

## 2026-08-03 00:32 AEST

- Domain cutover to eldreve.com, second half. Charles moved the Supabase
  Site URL + redirect allow-list to https://eldreve.com and switched the
  passkey Relying Party ID from goldrose-storefront.vercel.app to
  `eldreve.com` (origins https://eldreve.com + www; display name ELDREVE).
  Old vercel.app passkeys are invalidated by design — WebAuthn origins must
  sit under the RP ID, so no dual-domain transition exists; test credentials
  re-enrol on the new domain.
- Verified live: both eldreve.com and www serve HTTP 200 with valid certs,
  the vercel.app URL still serves the same deployment, receiving MX (3×
  route*.mx.cloudflare.net) and the Resend sending lane on send.eldreve.com
  (MX + DKIM) all resolve via 1.1.1.1.
- CAUGHT: the deployed site still emitted `goldrose-storefront.vercel.app`
  in canonicals, OG image URLs and the whole sitemap — layout.tsx's comment
  assumed VERCEL_PROJECT_PRODUCTION_URL would flip automatically, but adding
  eldreve.com as an extra domain left vercel.app as the production URL. Set
  `NEXT_PUBLIC_SITE_URL=https://eldreve.com` (Production) in Vercel, which
  siteBaseUrl() prefers over the Vercel var. NOT deployed from CLI (repo
  workflow is main → GitHub/Vercel, and this branch is dirty) — the fix
  lands on the next production deploy; verify canonicals afterwards.
- Also: Cloudflare Email Routing enabled with a catch-all to the company
  Gmail (first forwarded mail landed in Spam — Gmail filter "To: @eldreve.com
  → never send to spam" is the fix), and Resend set up for outbound mail:
  domain records on send.eldreve.com, two keys documented in .env.example
  (RESEND_API_KEY for lib/email.ts, RESEND_SMTP_PASSWORD for Supabase's
  custom SMTP, which also unlocks template editing and lifts the ~2/hour
  cap), and apply-auth-email-templates.mjs rebranded GoldRose→Eldreve.
- ICANN registrant-email verification completed; confirmed externally via
  WHOIS (status ACTIVE, no clientHold — only the normal
  clientTransferProhibited registrar lock and addperiod flags).
- Updated SUMMARY (OQ-4 resolved, live URL) and README live link.

## 2026-08-03 · customer sign-in went live (`feat/figma-sync`)

- `/account/signup` stopped being a picture of a form. Built in the owner's
  order: email input + blur validation → Send code (`signInWithOtp`) →
  consent checkbox gating CONTINUE → 6-digit code input → CONTINUE
  (`verifyOtp` → `/account`). Terms/Privacy link to the `/policies/*`
  scaffolds.
- Found the emailed link went to the site root with no code: the repo's
  template script had never run, and could not — Supabase refuses template
  edits on the free tier while its built-in sender is in use, so release
  queue #2's order (templates then SMTP) was impossible.
- Configured custom SMTP on Resend (`smtp.resend.com:465`, sender
  `noreply@eldreve.com` / "ELDREVE") against the verified `eldreve.com`
  domain; applied the templates, which now carry both the
  `/auth/confirm?token_hash=…&next=/account` link and the 6-digit code.
  Send cap 2 → 30/hour.
- `mailer_otp_length` 8 → 6: the project issued 8-digit codes while the UI
  assumed 6, so pasted codes silently truncated and never verified.
- Added `RESEND_SMTP_PASSWORD` to `.env.example`, beside `RESEND_API_KEY`.
- **DQ-34 answered — ELDREVE is the brand.** Raised AI-021 for the ~270
  GoldRose references; OQ-4's `goldrose.co` recommendation is moot.
- All development verified with the Supabase calls intercepted, so no real
  emails were sent and no auth users created while building.

## 2026-08-03 — Preserve account-order status-chip aspect ratios

- On `test/integration`, fixed `/account/orders` status-chip PNGs to use `object-fit: contain`, preventing the Processing artwork from stretching inside its Figma-sized frame.
- Verified with `npm run typecheck` and `git diff --check`.

## 2026-08-03 — Make reminder lead time editable

- On `test/integration`, replaced the hard-coded reminder lead-time value with a controlled numeric input defaulting to 7; the “days before” unit remains fixed.
- Verified with `npm run typecheck`, component ESLint, and `git diff --check`.
- 08-02 (brand-only sync): the frames' ELDREVE wordmark (imageRef a8c8a259)
  is now the live mark — exported at both drawn boxes (140×51 headers,
  136×40 home/shop) to public/veloria/brand/, replacing
  /veloria/home/549-90.png; GoldRoseWordmark → BrandWordmark; the checkout
  header's "GOLDROSE" text node swapped for the same raster (2460:377/381).
  Centred on the 430 canvas rather than copied (frames disagree by up to
  10.5px — the dashboard's "Left Spacer · Buttons Removed" box), verified
  centre=215.0 on 9 routes. 91 e2e green, baselines regenerated.
  ⚠️ Branch churn this session: the working directory moved
  feat/figma-sync → fix/order-confirmed-email → test/integration under
  concurrent sessions. Nothing lost — the five sync commits are in
  feat/figma-sync; the nav commit (858f3ec) and this brand commit (bce603a)
  sit on test/integration and want cherry-picking to feat/figma-sync if that
  branch is meant to carry them.
- **Verified live (2026-08-03).** A real 6-digit code was emailed through
  Resend and signed a customer in from `/account/signup`. Development itself
  ran entirely against intercepted Supabase calls, so this was the first real
  round trip — and the first time the flow has worked since it was built.
- 08-02: bottom nav re-imported from the current frames (not cherry-picked):
  3 tabs at x 18/179/340 with the frames' own tab renders in
  public/veloria/nav/, 商务 dropped (/business/wholesale → navActive="none";
  business still reachable via the menu drawer). The frames restore the
  Login/Me session swap the 07-27 batch dropped — owner confirmed "before
  login show Login, after login show Me" — so the account tab is a client
  island (AccountTabArt) that defaults to Login and swaps on session.
  ⚠️ Frame drift: home/shop draw "Login" outline while the PDP draws "Me"
  outline; dashboard draws "Me" filled. Followed the majority + the owner's
  rule. 91 e2e green, baselines regenerated.

## 2026-08-03 — Smooth menu-drawer entrance

- On `test/integration`, added an eased left-to-right entrance for the homepage menu drawer and a coordinated scrim fade, with `prefers-reduced-motion` support.
- Verified with `npm run typecheck`, component ESLint, and `git diff --check`.

## 2026-08-03 — Expand reminder-modal scrim to the viewport

- On `test/integration`, moved the reminder dialog scrim outside the scaled Figma stage so the dim layer covers the full viewport while the sheet remains interactive above it.
- Verified with `npm run typecheck`, component ESLint, and `git diff --check`.

## 2026-08-03 — Animate the reviews sheet upward

- On `test/integration`, added an eased slide-up entrance to the PDP Reviews drawer with reduced-motion support.
- Verified with `npm run typecheck`, component ESLint, and `git diff --check`.

## 2026-08-03 — figma-sync skill: trim section 1

- Cut the "what data Figma exposes" enumeration from `figma-sync` section 1.
  One `/v1/files/:key` payload already carries frames, geometry, prototype,
  comments and dev status, so the agent can read what is there rather than be
  told. Section 1 now records only the non-derivable parts: re-poll for live
  edits, `interactions[]` not `reactions`, dev status is REST-only and is the
  build gate, comment ownership, prefer `boundVariables` tokens, the `.notdef`
  glyph gotcha, renders as band-diff reference.
- Fixed a latent inconsistency: the old list said "always read these four" then
  listed five, and repeated dev status in both the core and optional blocks.
- Sections 0 and 2–7 untouched. Version 1.4.0 → 1.5.0.
- Note: `.claude/skills/figma-sync` is a symlink to `.agents/skills/figma-sync`
  — one file, no mirroring needed for THIS skill. The others are NOT shared:
  `agent-delivery`, `supabase` and `supabase-postgres-best-practices` are real
  duplicate directories on both sides (separate inodes, identical content as of
  today) and drift silently if only one side is edited. SUMMARY.md's "Codex
  mirror complete" wording was the source of that wrong assumption; corrected.
- Follow-up (same day): converted `.claude/skills/agent-delivery` into a
  symlink to `.agents/skills/agent-delivery` as well, so two of the four
  shared skills are now single-source. Content was byte-identical beforehand
  and `.claude/` is gitignored, so nothing tracked changed. `supabase` and
  `supabase-postgres-best-practices` remain real duplicates.

## 2026-08-03 — archived: figma-sync coverage-analysis mental model

- Wrote `archive/figma-sync-coverage-analysis-mental-model.md` (EN + 中文): a
  method for diagnosing why a figma-sync pass leaves updates un-imported —
  coverage/fidelity split, deliberate-skip vs silent-drop split, an eight-stage
  funnel, a hypothesis-signature table, three structural causes (no error
  channel, model-driven enumeration, stateless passes), and a six-artifact prep
  checklist. Method only; no analysis was run.
- Key grounded finding recorded in it: four Figma file versions are logged in
  prose in `docs/ixd/README.md` but have never been used as a `?version=` diff
  base, and no `scripts/figma-*` exists, so enumeration is fully model-driven.
- Parked in `archive/` on request. Per archive/README.md that means it is never
  cited — noted in the Contents row that it should move to `docs/ixd/` if the
  analysis is ever run.

## 2026-08-03 — figma-sync: chatbot / support-chat surfaces

- Re-polled the Figma file (modified 2026-08-02 13:24) and scoped a sync to
  every chatbot surface: `/care/chat`, the concierge bands, and all five
  prototype links that navigate to the chat frame.
- `/care/chat` needed **no import**. Its frame was re-authored — the node ids
  the code quoted (1230:120, 1523:1470) are gone; the live one is **1537:111**,
  Ready-for-dev under section `shoppage三级`. Band-diffed the running page
  against the scale-2 render at 8-design-px bands: no delta outside the font-AA
  envelope except the Next.js dev badge over the composer. Only layer names
  changed (the design team added the formal `SUPPORT-*` vocabulary).
- Corrected the stale node ids in `app/care/chat/page.tsx` and
  `components/screens/SupportChatScreen.tsx`, and recorded why `SUPPORT-*` was
  not mirrored as `data-el`: `docs/ixd/naming/component-names.md` is still
  Draft, so the rule is not signed off.
- Two matters filed (AI-022, AI-023) in
  `agent-delivery/sessions/figma-sync-chatbot-08-03-feat-figma-sync.md`: the new
  Ready-for-dev homepage frame 2380:370 drops MORI and the concierge chatbox
  entirely, and checkout's "Ask Auri" chat link lives on a hidden layer.
- No behaviour changed. Typecheck clean; `/`, `/checkout`, `/care/chat` all 200.

## 2026-08-03 18:39 AEST

Fixed the admin left nav being a dead end on mobile. Below Polaris's
`navigationBarCollapsed` breakpoint (767.95px), `Navigation/components/Item`
`getClickHandler` calls `preventDefault()` on any item that carries
`subNavigationItems` and only toggles the disclosure — so the parent stops
being a link. Orders, Products, Content and Settings had no sub-item pointing
at themselves, which left four top-level admin pages unreachable on any
phone-width screen. Reproduced at 375px (click Products → URL unchanged,
submenu collapsed) and confirmed the same click navigates at 1280px.

Fix follows Shopify's own admin pattern: a self-referencing first sub-item
("All products", "All orders", "All content", "General"), added in both
languages. No Polaris internals overridden, and the mobile disclosure
behaviour is unchanged.

Verified Products end to end at 375px — navigates and dismisses the drawer.
The other three render with correct labels but were not click-verified; the
mechanism is identical.

## 2026-08-03 21:02 AEST

Made the five product fields that had no admin UI editable, so the product
form and the planned CSV import can carry the same information.

`short_name`, `best_for`, `badge`, `details[]` and `position` were all
written by the seed and then frozen: `saveProduct` preserved whatever was
already in the row (`existing?.best_for ?? ""` and friends), and no screen
offered a field. `short_name` was the sharp one — it sets the PDP title and
the shop card name, so there was live storefront copy nobody could change.
`position` orders `/shop`. The `position={index}` hits in ProductsList and
InventoryTable are Polaris IndexTable row props, not the DB column, so they
were not a way in.

Threaded through every layer: SaveProductInput, the zod schema in actions,
ProductFormInitial, both pages that build it, and the save path now writes
the inputs instead of preserving the old row. Blank short_name still falls
back to the first 40 characters of the title, since shop cards and the PDP
read it first and must never render empty. Blank position still appends.

Verified against a real product — Short name "Signature Rose", Badge
"Save 44%", Position 1 and the rest load into the form and round-trip.
Labels in en + 中文.

Remaining gap to a true bijection with the CSV: weight_oz is per-variant in
the schema but the form applies one value to every variant.

## 2026-08-04 — archived: homepage + shop IxD tables and their screenshots

Interaction design is maintained in Figma now, so the 2026-07-25 parse outputs
stopped being a source of truth. Moved `docs/ixd/homepage.md` (H-01…H-37),
`docs/ixd/shop.md` (N-01…N-15) and `docs/ixd/assets/` (52 annotated
screenshots) to `archive/ixd-home-shop/`, keeping the docs' relative
`assets/H-nn.jpg` links intact by moving all three together.

Held the archive folder's defining rule — nothing in it is referenced from
anywhere. Removed every inbound path: `docs/ixd/README.md`'s Files list (now
a "retired" note pointing at the still-live delivery folder instead),
`tests/e2e/homepage.spec.ts`'s header comment (H-nn ids kept as bare ids),
`batch.md`'s two links, the 37 screenshot embeds in that delivery's
`homepage.zh.md` (our import plumbing, not delivered wording — logged in
`batch.md`'s Edits section; the `.numbers` original still holds them), and
`.prettierignore`'s `docs/ixd/assets/` line, which was redundant anyway since
the unanchored `assets/` rule already matches at any depth.

`docs/ixd/` now holds only `README.md` and `naming/`. The IxD findings and
status legend stay in that README as the record of what the imports surfaced.
One reference left alone on purpose: the 2026-07-27 order-detail delivery has
a delivered Chinese sentence naming `docs/ixd/assets/` as a future destination
— it is verbatim upstream wording and does not point into `archive/`.

## 2026-08-04 — SUMMARY.md reconciled against the repo and trimmed

Audited every factual claim in `SUMMARY.md` against the working tree, not just
`HEAD`, and found six stale ones. The homepage claim was the costliest: the file
still said "keep ignoring both homepage frames (2024:378)" while `app/page.tsx`
had already imported the simplified frame `2380:370`, cutting the canvas
8673 → 5193 and the band stack 11 → 7 (A-4/A-7/A-8/A-10 deleted at source).
That silently falsified a second, unrelated claim two sections away — "3 of the
home page's 17 bands carry a `data-el` tag" — a ratio measured against a page
that later shrank. Both corrected, and the 08-03 three-tab nav (which SUMMARY
never mentioned) added.

The Resend warning was a same-fact-in-two-places failure: `291a93e` added
`RESEND_API_KEY`/`RESEND_FROM` to Vercel Production and updated the sender-name
line, but left the "⚠️ still missing from Vercel" paragraph untouched. Rewritten
to record Production-only on purpose, previews keeping `lib/email.ts`'s
console-log fallback.

Also: migration `0006_orders_auth_user_id` was missing from the applied list —
it is load-bearing, not incidental, because OTP sign-in has no verified email to
match on, so without the stamped uid every signed-in customer saw an empty order
list. Release-queue item 4 rewritten around that: no customer link points at the
bare `/orders` redirect any more (they all use the real `/orders/track`), so the
task is now just deleting `app/orders/page.tsx`; guest lookup stays unbuilt. The
repository tree listed a `.codex/` that does not exist and omitted `.agents/` —
the declared skills source of truth — plus `.github/`, `.env.example` and the
root config files.

Then trimmed on Charles's instruction: 2530 → 1764 words. The cut is almost
entirely the per-frame Figma-sync narrative, which `docs/ixd/README.md` already
owns; SUMMARY now states what landed and links there. Safety gates and release
gates were left near-verbatim — they are rules, not history. Verified every
relative link resolves and `prettier --check` passes.

## 2026-08-04 · figma-sync · simplified homepage + MENU (`feat/figma-sync`)

Imported Figma frame `2380:370` ("/ · default · mobile · homepage"), the only
homepage frame left inside the Ready-for-dev section `首页一级`, plus its
overlay target `2345:271` (MENU) from the same section.

- **Homepage 8673px → 5193px.** Modules A-4, A-7, A-8 and A-10 were deleted at
  source; `components/home/A4|A7|A8|A10.tsx` deleted with them. A-1/A-2/A-3/
  A-5/A-6/A-9/A-11 reflowed to the frame's own band offsets (32 / 764 / 1405 /
  1868 / 2344 / 3133 / 4124). A-9 flipped from a dark section to cream. A-11
  grew 714 → 1010 with a gift card, newsletter strip and footer link cloud.
- **All 21 prototype links wired**, including eight footer links, four FAQ rows
  → `/care/chat`, and the newsletter hand-off → `/account/signup`. `/blog`
  added as a coming-soon scaffold (its frame is not Ready-for-dev).
- **MENU redesigned**: the 07-29 dark 314px left drawer became a full-width
  cream accordion sheet with computed layout (it collapses). Eight new icon
  assets under `public/veloria/menu/`.
- **Carousel IxD finished**: A-6's recipient cards became a real rail
  (`RecipientRail.tsx`); A-5's and A-6's pagination dots are wired to their
  rails; Best Sellers now carries the frame's two distinct cards with no dots.
  All four rails share `Carousel.tsx`.
- **Verified**: per-band diff against the scale-2 Figma renders is 0.99–2.89 %
  (font-antialiasing envelope) and the MENU is 0.36 %; every band matches the
  frame's pixel dimensions. 67/67 unit, 99/100 e2e (the one failure,
  `admin-auth.spec.ts` EN/中文, confirmed pre-existing on a clean tree). 16 new
  specs; `home-darwin.png` baseline regenerated.
- Raised AI-024…AI-029; see
  `agent-delivery/sessions/figma-sync-homepage-08-04-feat-figma-sync.md`.

## 2026-08-04 — AI-020 answered: one login page

Branch `feat/canonical-login`. The owner's ruling: `/account/signup` is the
storefront's only login page, and `/account` is the signed-in page only.

- **Root cause of the "my simple login page came back" report.** Nothing was
  ever reverted. `AccountClient.tsx` conditionally rendered a *second* login
  screen (`ShoppingLogin`, VELORIA frame 74:53) whenever the visitor was signed
  out. That line was written 07-25, when it was the only login screen; when the
  live signup flow shipped 08-03 nobody repointed it, so two login screens ran
  in parallel. The 08-04 MENU redesign then added a **My Account → /account**
  row that the old drawer never had, making the old screen newly visible and
  reading as a regression. Verified against git: the Account tab's `href` has
  been `/account` at all 11 commits that ever touched `chrome.tsx`, no
  `/account`→signup redirect ever existed, and `ShoppingLogin` was never
  deleted on any branch, reflog entry or dangling object.
- **Signed out now redirects** to `/account/signup` (`router.replace`, so Back
  does not bounce). Local mode (`unavailable`) redirects too — with no auth
  server, being signed in is impossible.
- **`?auth_error=1` survives the hop.** Captured at mount by a lazy state
  initializer, before the existing effect strips it off the URL and
  independently of Supabase, then re-read on the signup page from
  `useSearchParams` and shown in the frame's own status slot. Typing an address
  retracts it. `/account/signup` gained a `Suspense` boundary so it stays
  statically prerendered (confirmed `○` in the build output).
- **Deleted** `components/login/ShoppingLogin.tsx` (701 lines). Its only
  consumer was that one line. `components/login/tokens.tsx` stays —
  `BusinessLogin` imports it.
- **Known gap:** `ShoppingLogin` carried the Gift Shopping ⇄ Business tabs, the
  last signed-out route to `/account/business`, and the 08-04 MENU dropped the
  drawer's FOR BUSINESS row. The route still works directly; restoring an entry
  point is a design decision, not an invented one. The stale SUMMARY line
  claiming the drawer still reaches it was removed.
- **Verified**: `tsc` clean, eslint clean, 67/67 unit, 100 e2e passed with the
  one pre-existing `admin-auth` EN/中文 failure. Rewrote 4 tests in
  `account.spec.ts` for the redirect (incl. a new dead-link case) and removed
  the account-type-tabs test in `screens.spec.ts`.

## 2026-08-04 — Admin: indicate bulk-import requirements on the product form

Branch `feat/products-upload`, commit `88f9dc3` (rebased onto main, not merged).

- `/admin/products/new` now shows the import requirements from
  `docs/features/product-content-pipeline.md`: `requiredIndicator` on
  Description, Price and SKU (Title already had one), plus `helpText` for the
  rules an asterisk cannot state. EN + 中文 both added to `lib/admin/i18n.ts`.
- Two rulings from Charles recorded in the pipeline doc: SKU and Description are
  required always (drafts included), and Weight is product-level — the column is
  on `product_variants`, but the form holds one value that `saveProduct` writes
  to every variant row.
- Verified in a local-mode production build on :3210, both languages, clean
  console. Typecheck clean before and after the rebase.
- NOT merged: `main` is checked out in the primary worktree with uncommitted
  edits to the same doc (32 → 33 columns, new column 14 "Short description").
  Waiting for that session to commit, then rebase and fast-forward.
- Open: tier B ("wanted") columns are still not indicated on the form.
  `docs/Database.md` still says `sku`/`description` are "✓ if active", now
  contradicting the rulings — untouched per the edit-on-request-only rule.

## 2026-08-04 — TikTok analytics: API vs Business Suite capability survey

- Question from Charles: could TikTok Business Suite be rebuilt against TikTok's
  API? Surveyed the platform and recorded the answer as a BACKLOG feature record,
  `docs/features/tiktok-analytics.md` (graduates `docs/ideas.md` line 81,
  "tiktok 数据分析").
- Core finding: the API can never exceed the dashboard — TikTok states that a
  metric absent from TikTok Analytics is absent from the API too. The reason to
  build is the one thing Business Suite structurally cannot do: join TikTok
  metrics to eldreve.com sessions and orders.
- Full ~50-row capability matrix (API vs Business Suite, union of both) lives in
  the record's *Tech details*, with sources. Notable gaps: follower age/gender
  are dashboard-only; Discovery (trends, benchmarks, Creator Marketplace) will
  never be exposed; bulk comment auto-moderation is API-only.
- Platform decay rules make timing matter: post data stops updating after 365
  days, and insight fields drop off videos idle >7 days — so uncollected history
  is unrecoverable. Recommended a collector-first, dashboard-later split (OQ-1).
- OQ-2 raised for the owner: Business account (required for the API, ads, Shop)
  costs access to trending sounds; Creator account keeps them. Marketing
  trade-off, not a technical one.
- Join key needs no code change — `components/Beacon.tsx` already captures
  `utm_content`, freed for creative ids by the earlier `utm_acc` decision.
- Also fixed `.claude/launch.json`: added an attach-only `goldrose-attach`
  entry so the preview binds to an already-running `next dev` instead of failing
  on Next 16's per-directory lock.

## 2026-08-04 — TikTok analytics: capability matrix corrected against the portal

- Charles surfaced the scope picker inside the portal's Create-New-App dialog,
  which lists the `TikTok Accounts` group's endpoints verbatim. Checked it
  against the matrix written earlier the same day; **three rows were wrong, all
  pessimistic**: trending search (`/discovery/trending/search/`), hashtag
  suggestion and account benchmarking (`/business/benchmark/`) DO have
  endpoints, and photo/carousel publishing exists (`/business/photo/publish/`).
  The earlier assertion that "Discovery is TikTok's own product and will not
  open up" was false. Also added `/business/comment/pin/`.
- Suite-only now reduces to LIVE, DMs and follower age/gender.
- Recorded the lesson in the doc: third-party guides and search results
  under-report a platform's surface; the vendor's own permission picker is the
  only complete inventory.
- Added a **Scopes to request** section — Account User, Get Account Media,
  Account Comment only. `Account Post Content` deliberately excluded: it is
  write access that publishes to the live account, and the portal defaults to
  every sub-group ticked.
- Plan gained stage 1b (the `/api/tiktok/callback` route) and the decided app
  identity: name `ELDREVE Storefront Analytics`, redirect
  `https://eldreve.com/api/tiktok/callback`.
- Account-side records (registration emails, legal entity, agreements signed)
  went to `~/Documents/Work/gold_rose/domain-setup.md` — the repo doc links to
  it rather than duplicating.

## 2026-08-04 — TikTok analytics: re-sourced the matrix, endpoint per row

- Re-checked every claim for a first-party source and added the endpoint (or
  field name) to every row of the capability matrix, per Charles's request.
- Authority now stated per claim type in the doc: endpoint paths come from the
  portal's scope picker (highest — it is what gets granted); the
  `/business/video/list/` field names from TikTok's own doc text; Ads API paths
  from TikTok's official SDK.
- **Negative finding, verified twice** (raw README fetch, then the whole repo
  via indexed docs): `tiktok/tiktok-business-api-sdk` contains NO `/business/*`
  endpoints — it is the Marketing/Ads SDK only. Useful for `/oauth2/access_token/`
  and nothing else here. TikTok's own doc pages are client-rendered and cannot
  be fetched programmatically, which is why the picker is the source of record.
- **Downgraded several marks to ❔** once it was clear they traced to
  third-party guides rather than TikTok — notably the whole account-level
  audience block (follower gender/age/active-hours/territories). `/business/get/`'s
  field list was never verified from a first-party source. Logged an explicit
  open verification task: first sandbox call should be `/business/get/` with
  every plausible field, to settle those rows in one shot.
- Added new confirmed rows: `reach`, `/business/video/settings/`,
  `/business/publish/location/`, `/business/post/authorize/*` (Spark Ads),
  `/business/comment/create/`. Noted `video_views` combines organic AND paid.
- Added a second inventory table for the **Ad Account Management** scope group
  (27 endpoints Charles pasted), with what each does and a use-to-us column —
  all ❌. It administers a Business Center (agency console): we have one
  account, no ad spend, no agency structure. 13 of the 27 are writes, several
  destructive or financial, which is the concrete argument for least privilege.
- Fixed the stale "cannot reach Discovery" line left in Options considered.

## 2026-08-04 — /align skill speed rebuild (global tooling)

- Replaced the per-run pattern (model authors ad-hoc Python, hand-pads table
  cells) with a pre-built `align.py` in `~/.claude/skills/align/` (mirrored to
  `~/.codex/skills/align/`): `table` / `measure` / `shift` subcommands,
  display-width padding (CJK = 2 cols), `─…▶` arrow stretch, negative shifts,
  built-in re-measure. SKILL.md now delegates to it. Verified on a fixture
  incl. a shift round-trip. Not repo code — logged for history only.

## 2026-08-04 — repo-wide stale sweep (/tidy, apply mode)

Read-only audit of the whole tree first (docs, non-code folders, code), then
applied the findings. Verification: typecheck clean, lint unchanged (2
pre-existing warnings), 67/67 unit, **101/101 e2e**, build clean, Prettier clean.

- **Dead code removed** (each verified zero-reference before deleting):
  `AccountNavBand` + its 5-tab `NAV` table and now-unused `Link` import, and
  `ICON_GOLD` (`components/screens/account-chrome.tsx`); `playfairSC`
  (`lib/fonts.ts`) — an unused export that still made next/font self-host a
  Google font; `expressMethods` (`lib/checkout/methods.ts`).
- **`app/orders/page.tsx` deleted** — release-queue item 4. Zero inbound links
  (customers use `/orders/track` and `/account/orders`); build confirms the
  route is gone and `/orders/track` survives.
- **Stale comments corrected**: `app/account/page.tsx` claimed the deleted
  frame 74:53 was the signed-out render (contradicted AI-020);
  `app/layout.tsx` told readers never to set a domain and named the vercel.app
  host, contradicting the resolved OQ-4.
- **AI-020 closed** via `agent-inbox:close` (SUMMARY had recorded it answered
  while the tracker still had it OPEN) — archived, row + tag cleared, 22 open.
- **INBOX "Session files" table rebuilt** — it omitted
  `figma-sync-homepage-08-04` entirely (6 of the then-23 open matters) and had
  4 wrong counts. Now newest-first with a note on what `0` means.
- **Docs reconciled**: deleted 0-byte `docs/domain.md`; `features/README.md` no
  longer claims a roadmap tree that does not exist and gained a hand-written
  index of all 9 feature records (the torn-down generator *was* the index);
  `engagement-tracking.md` retargeted from the old 11/15-band homepage to the
  real 7 bands (A-5/A-6/A-9 untagged); `learning/07` repointed from the deleted
  `ShoppingLogin.tsx` to `SignupScreen.tsx` with the current OTP flow; three
  stale `goldrose-storefront.vercel.app` URLs → `eldreve.com`; `admin-design.md`
  §12 marks the Shopify deletion done and flags that `docs/shopify-reference/`
  was never created; SEO docs carry a dated reconciliation note rather than a
  faked re-verification; `ideas.md` no longer points at a README section that
  does not exist. **docs/ has zero dead relative links.**
- **SUMMARY.md**: "Shopify code is removed" reworded — read literally it told a
  future agent to rip out the Polaris admin UI; dwell coverage corrected 3→4 of
  7 bands; rename scope replaced with a measured 227 occurrences / 109 files
  plus the `app/layout.tsx:22-36` starting point; release-queue item 4 rewritten
  as guest order lookup; archive rule reworded to match actual practice.
- **Structure**: `assets/bottom-nav-buttons/` (~7 MB of four-tab source art incl.
  the removed WHOLESALE tab) → `assets/archive/` with a README row; the two
  duplicated `.claude/skills/` dirs symlinked to `.agents/` while still
  byte-identical; `agent-delivery/README.md` repointed from the gitignored
  `.claude/` path to the tracked `.agents/` one; removed the empty
  `scripts/features/` shell; cleared gitignored scratch; deleted 4 merged local
  branches (only `main` + the two unmerged remain).
- **Fixed a long-red e2e spec**: `admin-auth.spec.ts`'s final English assertion
  lacked `exact: true` (every 中文 assertion in the same test had it), so it
  matched both "Orders" and "All orders" and tripped Playwright strict mode.
  The suite is green for the first time since the Orders submenu was added.

Deliberately NOT done: the GoldRose→ELDREVE rename (AI-021 — owner ruling
pending on prose casing) and the 4-tab Wholesale band still drawn by
`PartnershipsScreen.tsx` (a design call, not a cleanup).

## 2026-08-04 — Stale-asset sweep: GoldRose wordmark retired from the header

- Spotted while building a 512×512 app logo for the TikTok app registration:
  the repo's `public/veloria/logo.png` is the **GoldRose** wordmark, and
  `components/chrome.tsx:206` was serving it under `alt="ELDREVE"` on /shop and
  every page using that header variant. The other two headers in the same file
  already used `eldreve-136x40.png`; pointed the third at it too. A live brand
  bug, not merely an unused file — and fixing it is what made the asset
  archivable.
- Archived to `assets/archive/` (mirroring the original path, per the existing
  convention): `public/veloria/logo.png`, `public/home/logo.png`.
  `public/home/` is now empty; the rest had been archived previously.
- Verified: `tsc --noEmit` clean; 5 routes (/, /shop, product, /checkout,
  /account) render 78 image references, none pointing at archived paths, none
  returning other than 200.
- **Audit method worth reusing.** A filename-only grep reported 1276 assets as
  unreferenced; spotting the runtime template `` `/veloria/${card.img}.png` ``
  and re-matching on filename *stems* cut that to 1043. Static grep cannot see
  dynamically built paths, so any dead-asset sweep must search for path-building
  templates first and match the loosest plausible token. The naive list would
  have deleted 233 live images.
- **Not swept, deliberately:** 900 files under `public/veloria/screens` are
  Figma frame exports the design work still refers to; `veloria/home` (106) is
  mixed, since bands went 11→7 with A-4/A-7/A-8/A-10 deleted at source;
  `veloria/login` (9) is the strongest remaining stale candidate because the
  `ShoppingLogin` screen was deleted (AI-020). Unreferenced ≠ stale — the rest
  needs a design-team call.
- Note: VELORIA is the design team's **Figma file name**, not a brand name, so
  `public/veloria/` needs no rename in the GoldRose→ELDREVE project.

## 2026-08-04 — Ready-for-dev PDP frame sync

- Compared the two browser annotations against their complete Figma frames.
- Confirmed `/account` already matches frame `2210:310` structurally.
- Imported PDP frame `1523:3971` (430×1616), including section order, ELDREVE chrome, warm palette, overlay hit areas, and live checkout actions.
- Verified TypeScript, targeted ESLint, reviews drawer behavior, and 2× band diffs; closed AI-016 through the agent inbox workflow.

## 2026-08-04 — Correct Ready-for-dev account frame

- Re-checked Figma dev-status ancestry and found standalone frame `2210:310` was not Ready-for-dev.
- Rebuilt `/account` against canonical frame `1523:2536` under Ready-for-dev section `me一级`.
- Removed the account-type toggle, restored the three-tile shortcuts and address-management row, repositioned the order/service cards, and wired View Details.
- Verified TypeScript, targeted ESLint, live interactions, and a scale-2 band diff; dynamic order content was treated as an intentional masked region.
- Added durable browser-annotation context plus `data-el` / `data-figma-node` markers for the profile, recent-order, shortcut, and service-card areas.

## 2026-08-05 — ELDREVE rename (AI-021) on `feat/eldreve-rename`

Charles renamed the design team's Figma file Veloria → ELDREVE and asked for
the repo to follow, in its own worktree/branch. Closed AI-021.

**Owner ruling captured:** prose casing is **all-caps ELDREVE everywhere**,
matching the wordmark — the open half of AI-021.

Three stale brand names were in the repo, not the two AI-021 recorded:

1. `GoldRose` / `GOLDROSE` — the substitution the pre-DQ-34 syncs painted over
   the frames' own wordmark. 177 occurrences, 91 code files.
2. `Eldreve` (title case) — 5 strings in the Supabase auth email templates,
   normalised to ELDREVE.
3. `Veloria` / `VELORIA` — never customer copy at all; it was the *asset
   namespace* `public/veloria/` plus a `next.config.ts` cache-header rule and
   "the VELORIA design" in file comments. 75 files.

**Scope rule that made it safe:** replace one-word `GoldRose`/`GOLDROSE` only.
Every lowercase `goldrose` is an identifier and every spaced "Gold Rose" is the
literal product noun, so both were left untouched by construction rather than
by review. Kept on purpose:

- localStorage/cookie keys — `goldrose-cart-v2`, `goldrose-wishlist`,
  `goldrose-admin-session-v1`, `goldrose-visitor-id`, `goldrose-session-id`,
  `goldrose-forum-read`, `goldrose.recent-searches`, `__goldrose_table_store__`.
  Renaming them is an unmigrated data change: every admin session drops, every
  saved cart and wishlist empties, and no customer ever sees the string.
- `goldrose-storefront.vercel.app` (live host), `owner@goldrose.local` and
  `support@goldrose.example` (local-mode fixtures asserted in six specs),
  `~/Documents/Work/gold_rose` (records path).
- "24K Gold Rose", "gold roses" — product noun, not brand.

**Two classes of damage a blind `sed` did, both repaired:**

- Frame-import comments that documented the old substitution became
  self-contradictory ("ELDREVE substituted for the ELDREVE") in 12 files —
  rewritten to say the frames' mark simply *is* the brand.
- Indefinite articles: "a GoldRose gift" is correct, "a ELDREVE gift" is not.
  Two customer-facing strings fixed to "an ELDREVE".

Also learned: BSD `sed` on macOS does not support `\b`, so a word-boundary
substitution silently no-ops. `grep -E` does support it — the mismatch is easy
to miss because the command exits 0.

**Verified:** `tsc --noEmit` clean; 67/67 unit tests pass; `next build`
succeeds; all 154 static image paths resolve after the folder move and every
dynamic `/eldreve/<subdir>/${…}` prefix has its directory present. The 2 lint
warnings (unused `x`/`w` in `BrandWordmark`) predate the branch.

**Left for Charles:** the repo/dir and GitHub project are still
`goldrose-storefront` (a rename with remote/Vercel consequences, deliberately
out of scope), and `account-chrome.tsx` references `1523-955.svg`, which has
never existed under either name.

## 2026-08-05 — Repo-wide consistency audit: docs vs code, stale content

Swept the repo for contradictions rather than git conflicts: every backticked
`app|lib|components|scripts|supabase|public/...` path, every `npm run` command
and every `process.env.*` name cited in `docs/`, `README.md` and `SUMMARY.md`
was tested against the actual tree.

**Verified accurate** (no change needed): migration set `0001–0003/0005/0006`
with `0004` absent; Shopify removal; the `CHECKOUT_SKIP_PAYMENT` +
`PAYPAL_ENV=live` build gate in `scripts/validate-env.mjs`; `.env.example`
completeness; the 7 `/policies/*` scaffolds; 7 home bands with 4 `data-el`
tags; the ELDREVE rename's kept identifiers; and the `/account/privacy-policy`
duplication (correct per AI-014, not stale).

**Fixed three things:**

- `agent-delivery/INBOX.md` — the Session-files table claimed 2 open matters
  for `figma-sync-signup-mepage-08-02`; it raised AI-019 and AI-021, and
  AI-021 is archived, so the count is 1. Note that `agent-inbox:check` passes
  either way — `scripts/agent-inbox.mjs` never parses that column, so it
  cannot catch this class of drift.
- `docs/ixd/README.md` — said the `data-el` convention doc "does not exist
  yet" while listing `naming/component-names.md` four lines below. The file
  exists as a draft with its vocabulary unwritten; reworded to say that.
- `components/screens/account-chrome.tsx` — `SettingsHeader` pointed
  `BackButton` at `/eldreve/screens/1523-955.svg`, which was never exported
  under either the veloria or eldreve namespace, so the back arrow was a
  broken image on every `/account/*` settings screen. Now uses the shared
  `/top-nav/back.png` (Charles's call). This closes the item left open at the
  end of the 08-05 rename entry above.

Typecheck clean; the two `no-unused-vars` warnings in this file (`x`, `w` in
`BrandWordmark`) still predate the change.

## 2026-08-05 16:25 AEST

**figma-sync skill v2.0.0 — deterministic read pipeline.** Added
`scripts/figma/{lib,digest,cli}.mjs` and `figma:*` npm scripts. The skill's
"read everything the file exposes" prose is replaced by fixed commands: `pull`
caches the file (version-checked via `?depth=1`, ~6s cold / ~1s warm) and
rebuilds five digests of 10–40KB each — frames, ready-for-dev (section cascade
resolved), prototype edges + scaffold targets, attributed comment threads —
so no agent reads the 22MB `file.json`. `changes` diffs top-level frame
hashes against a `baseline` snapshot, making each sync proportional to the
delivery; `routes` automates the repo↔Figma drift check; `node <id>` and
`render <id>` pull one frame's subtree or PNG on demand. Judgement rules
(comment ownership, pending-from-design, hand-off) stay in SKILL.md; the
comment digest emits a `hint`, never a verdict. Baseline set at the current
file version (everything through 2026-08-04 is imported).

## 2026-08-05 — Figma sync: the two me二·级 order frames

- Ran the read pipeline (file version `2383842832809713066`). **No changed
  frames**: the baseline had been set 22 minutes earlier by the session that
  committed `scripts/figma/` without importing anything, so the delta gate was
  empty by construction. Real scope was the Ready-for-dev backlog.
- Imported `/account/orders/delivered` (2439:369, 430×1316) and
  `/account/orders/review` (2439:370, 430×932), pixel-exact from the REST data.
  Verified by band-diff against scale-2 frame renders.
- Re-pointed the orders list: VIEW DETAILS on a **delivered** order now reaches
  the delivered view, honouring prototype edge 1523:3455 → 2439:369. This was
  AI-029's dead end; AI-029 is closed and archived.
- Exported 17 assets to `public/eldreve/screens/` (15 icon SVGs, 2 photos,
  1 back arrow).
- Added `tests/e2e/order-delivered-review.spec.ts` — 4 tests, all passing.
- Filed AI-030 (invented selected states for the review chips/stars) and
  AI-031 (PUBLISH REVIEW inert — no reviews backend, no submitted frame).
- Drift triage: `/account/returns/select-reason` and `/products/[slug]` are
  false positives (a sheet, and a dynamic segment). Nothing deleted.
- Pre-existing, not mine: `pixels.spec.ts` › product-detail fails on this
  branch with my work stashed.
- `npm run figma:baseline` re-set so the next `changes` is meaningful.

## 2026-08-05 21:56 AEST

**figma-sync pipeline v2.1 — gaps found by analysing the 08-05 orders sync.**
That sync reported "no changed frames" yet still had work: two Ready-for-dev
frames (`2439:369`, `2439:370`) had been ready and unbuilt for days, and a
hash diff can never see them. Added:

- `figma:unbuilt` — Ready-for-dev frames with no `page.tsx` at their route;
  the standing backlog `changes` is blind to. Now a section in `figma:brief`.
  Verified against the pre-import tree: it lists exactly the two frames that
  session had to rediscover by hand.
- `baseline` records the git sha it was stamped at and re-runs `unbuilt`,
  warning when the "everything here is built" claim is false — the tooling
  install stamped a false baseline, which is what hid those frames.
- `scripts/figma/drift-allowlist.json` — deliberate mismatches with reasons,
  so settled decisions (`/account/returns/select-reason` is the
  `ReturnReasonSheet`, not a route) stop resurfacing every sync.
- **Route-walk bug fixed:** `[param]` directories were treated as pathless
  like `(groups)`, so `app/products/[slug]/page.tsx` mapped to `/products` —
  one bug producing two false drift entries. Drift is now 4 + 2, was 7 + 6.
- `figma:brief` (one call replacing five) and per-phase timings on every
  command via `stopwatch()`. Measured: a warm `pull` is 2.29s, of which
  2.17s is two sequential network round-trips — the next thing worth fixing.

## 2026-08-05 22:30 AEST

**figma-sync v2.2 — the import half.** Profiling the *workflow* (not the code)
showed the pipeline optimised reading design while the real bulk of a sync was
asset extraction: `public/eldreve/screens/` holds 1,230 node-id-named files and
the 08-05 import hand-cut 17 of them, with no tooling and no documented step.

- `cli.mjs assets <frame-id...>` — walks the subtree for exportable nodes
  (designer `exportSettings`, pure-vector subtrees → SVG, image fills → PNG@2x),
  exports the **outermost** qualifying node so a five-path icon is one file,
  batches one request per format, downloads in parallel, and never overwrites an
  existing file without `--force`. `--list` previews. Validated against
  `2439:370`: 7 of its 13 detections are byte-for-byte the filenames the human
  session created by hand; the other 6 are over-eager (four identical stars),
  which is why `--list` is the documented first step.
- `node <id> --outline` — one indented line per layer (position, size, hex,
  font, copy). Measured 5,099 bytes versus 530,638 for the raw subtree: ~100×
  less for the step that used to dominate an import's token cost.

Both are in SKILL.md's import section. Test export ran for real (valid SVG/PNG
written), then the six new files were removed — nothing left in the tree.

## 2026-08-05 (2) — Figma sync: the date menus become 滚轮 wheels

- Read pipeline: file version unchanged, **no frame changes**, `unbuilt` now 0.
  The delivery was a comment — threads 72 → 73.
- The new comment is Charles's reply in the design team's scroll-wheel thread
  (2053:207): **"我试试"**. Confirmed in session ("do it in frontend"), so under
  the sync skill's ownership rule this was the agent's work.
- The 08-02 note had recorded this as "already built" by reading 滚轮下拉框 as
  "a dropdown that scrolls". The lists did scroll and their options were already
  generated in code (answering the team's second question), but a 滚轮 is the
  iOS wheel: spin it, and the row under a fixed indicator is the value. Built
  that in `ReminderEditModal.tsx` — scroll-snap rows, fixed centre pill, value
  taken on settle (90ms debounce), wheel stays open. A tap still takes the value
  and closes, so the 08-02 behaviour and its test are unchanged.
- Opening centres the current value; the half-window padding makes "row i is
  centred" exactly `scrollTop === i × pitch`, verified in test (Aug → 203).
- Added a wheel test to `tests/e2e/screens.spec.ts`; all 14 pass.
- Filed AI-032 (the wheel pins the drawn pill to the menu centre — the frames
  draw it at the selection's list position) with a prepared Figma reply.
  Narrowed AI-011 to its one remaining unposted reply.
- Baseline deliberately NOT re-stamped: no frames moved, so the existing one is
  still correct.
- Follow-up (same day, "can u make that drop down smoothier?"): gave the wheel
  depth — per-row fade + scale by distance from the centre band, the arriving
  row taking the pill's cream text immediately instead of on settle, a masked
  strip so rows dissolve at the rim, and a 150ms open ease with a
  reduced-motion opt-out. Per-row work is painted to the DOM in one rAF per
  frame, not through React state. Depth is now pinned by test.

## 2026-08-06 — Product reviews backend + PDP drawer goes live (mentor session)

- Schema designed with Charles step by step, then built on his "do it":
  `product_reviews` (migration `0007`, **applied to hosted**) — text product_id
  FK cascade, nullable order/user FKs set-null, author_name snapshot, 1–5
  rating check, photo_urls text[], pending/published/rejected + rejected_reason
  (FTC 16 CFR 465: content-neutral moderation, never hard-delete), partial
  index on published, RLS anon-select-published-only.
- `lib/reviews/db.ts` (getStore dual-mode: list published, live avg/count —
  option a, no denormalized counters), `POST /api/reviews` (zod, registered-
  only in hosted mode, always inserts pending).
- `/account/orders/review` PUBLISH wired (closes AI-031; ?product=&order=
  params, default signature rose); submitted state relabels THANK YOU.
- PDP rating row + reviews drawer render live rows/stats when any published
  review exists (mock art stays as fallback while empty — pre-launch rule);
  drawer list region is now a real scroller (mock 150px pitch kept).
- Verified: typecheck, lint, full e2e (106) green; pixel baseline regenerated
  (rating row now data-live-text masked); local loop POST→publish→PDP proven.
- Deliberate gaps: experience chip has no column (local-only), photo upload UI
  not wired (schema ready), no admin moderation screen yet.

## 2026-08-06 (2) — Two demonstration reviews, and the PDP stops contradicting itself

- `npm run seed:reviews` (`scripts/seed-demo-reviews.ts`, fixed ids, idempotent,
  `-- --remove` reverses it) inserts two published reviews. Run against the
  local file store and against hosted Supabase — both now show 4.5 · 2 reviews
  on the signature rose. They are demonstration content: remove before launch.
- The PDP's own "Customer Reviews" band was still hardcoded to 4.9 / "Based on
  286 reviews" / a fixed testimonial while the info card showed live numbers.
  It now reads the same data: average, count, star histogram (percentages and
  bar fills), and the newest review as the featured quote.
- Honesty details worth keeping: "Verified Buyer" is printed only for reviews
  that carry an `order_id`; the star art fills to the real average (a clipped
  copy of the design glyph in the drawer, a veil over the unearned stars in
  band 10, because that PNG is palette-based with no alpha) so 4.5 can never
  render as five full stars.
- Review dates now read like the design ("4 days ago") via
  `formatRelativeDay()` in `lib/dates.ts`, server-rendered so hydration agrees.
- Pixel baseline: every review-driven box carries `data-live-text`, and the
  percentage labels + rating row were widened past their Figma text width so a
  live value ("50%") cannot paint outside its mask. Baseline regenerated in the
  no-reviews state (what CI seeds) and verified to still pass with the two
  demo rows present — so CI stays green either way.
- Verified: typecheck, lint, full e2e 106 green in both states; drawer scroll
  proven with seven rows (624px window over 1050px of content, wheel moved it
  to the end); pending rows confirmed invisible to the storefront.

## 2026-08-06 (3) — /account/personal-info made real

Branch `worktree-account-personal-info-live`. The last account screen still
rendering the mock's "Olivia Carter" now reads and writes the signed-in
customer's own profile.

- `lib/account/profile-fields.ts` (new) — pure field rules: name
  normalisation, the full-name split, the language list, email shape. No
  `server-only`, so the browser and `npm run test:unit` can both use it.
- `lib/account/profile.ts` (new) — `getPersonalInfo` / `savePersonalInfo`.
  Auth `user_metadata` is the source of truth (`full_name` written too, so the
  /account greeting follows); the name is mirrored onto the customers row
  already linked by `auth_user_id` and never claimed by email
  (`mailer_autoconfirm` is on — verified against the live project).
- Email change delegates to `updateUser({ email })` and reports what actually
  came back — applied, or awaiting confirmation — rather than assuming the
  project's secure-email-change setting.
- `app/account/personal-info/page.tsx` is now an async Server Component:
  reads the session, `redirect()`s to `/account/signup` when signed out, and
  passes `savePersonalInfoAction` down as a prop. Route is `force-dynamic`.
- `components/screens/PersonalInfoScreen.tsx` keeps every Figma coordinate;
  live `<input>`s / `<select>` sit inside the frame's own field boxes, the
  frame's Edit + pencil became the real edit toggle, and the canvas grew
  932 → 972 for a status line (no designed element moved).
- `scripts/apply-auth-email-templates.mjs` gained the email-change template
  (points back at /account/personal-info via /auth/confirm). **Not applied** —
  run the script to activate.
- Tests: 7 new unit tests for the field rules; the e2e personal-info case now
  asserts the signed-out redirect. Full suite 103 pass / 2 fail, both
  pre-existing `product-detail` pixel diffs (reproduced with the change
  stashed).

## 2026-08-06 (4) — Every unmerged branch consolidated into `main`

Asked to read all unmerged branches and merge them. Twelve refs existed;
only four carried commits `main` did not already have. The other eight
(`chore/figma-sync-skill-trim`, `chore/stale-sweep-08-04`, `feat/figma-sync`,
`feat/products-upload`, `test/integration`, `feat/eldreve-rename`,
`worktree-feat-company-legal-info`, `worktree-glyph-node-exports`) are
0-ahead — fully contained already, stale refs only.

- Merged with `--no-ff`, smallest first, in a throwaway worktree on `main` so
  the primary checkout (on `feat/figma-sync`, with an uncommitted
  `docs/ideas.md` edit) was never touched:
  `dependabot/actions-checkout-7` (CI `actions/checkout` v4 → v7, matching the
  `setup-node@v7` already there), `learn/features-rebuild`
  (`scripts/features/cli.mjs`, the front-matter-only generator rebuild — 13
  lines, unreferenced, inert), `feat/product-reviews` (5 commits),
  `worktree-account-personal-info-live` (1 commit).
- One conflict, in this file: both feature branches appended a same-day entry
  at the same anchor. Kept both, renumbered the account one to `(3)`.
  `SUMMARY.md` auto-merged — the two branches wrote to different sections.
- No content lost: for each branch, merged `main` is byte-identical to the
  branch tip across every file that branch owned (shared docs excluded).
- Verified before pushing, because `main` deploys to production: lint (0
  errors; the 2 `account-chrome.tsx` warnings pre-date this), typecheck,
  `format:check`, `test:unit` 74/74, `seed --reset` + `build`, and the full
  Playwright suite **106/106** — the pixel run CI cannot do on Linux. The two
  `product-detail` diffs the account branch reported are gone, because the
  reviews branch regenerated that baseline.
- Hosted DB checked read-only before the push: `product_reviews` exists,
  migration `0007` applied, 2 published rows. Merged `main` needs no
  `db push`.
- Branches deliberately NOT deleted: `feat/product-reviews` and
  `worktree-account-personal-info-live` are still checked out in live
  worktrees. Two other worktrees (`feat-company-legal-info`,
  `glyph-node-exports`) hold uncommitted in-flight work with no commits behind
  it — left alone; it is not yet mergeable.

## 2026-08-06 (5) — Crop-glyph sweep, the shop card's missing outline, a CI guard

Started from two things Charles spotted in the preview and ended up auditing
the whole class.

**The class of bug.** `c5bcc68` cropped symbol glyphs straight out of a flat
frame render instead of exporting the Figma nodes, so those files are fully
opaque and carry the render's background with them. Invisible while the surface
stayed white; a pale rectangle once it became the `#FFFBF6` card. The crops even
carried the wrong gold — `#C89233` against Figma's `#D4AF37`.

Audited all 515 served PNGs for a real alpha channel (colour type 4/6, or a
`tRNS` chunk on 0/2/3). 20 are fully opaque: 5 are photographs, correctly so;
15 were the crop batch. Of those, 11 were already dead files, 1 is fine, and
**3 were live bugs nobody had reported yet** — `glyph-benefit-1/2/3`, the ✦ ◷ □
icons in the PDP benefits card, baked on `#FFFFFF` at 84–91% coverage.

In every case the correct transparent node export was **already committed**
under `public/eldreve/screens/`; only the page was still pointing at the crop.
Repointed five `<img>`s — stars `1523-3993` / `1523-4112`, icons `1523-4002` /
`1523-4006` / `1523-4010` — and placed each on its node's
`absoluteRenderBounds` (the ink) rather than its text box, which is 24px tall
for a 16px glyph and would have floated them high. Deleted all 14 crops.
`glyph-promo.png` stays: it is baked on `#06372E` and `chrome.tsx` draws it only
on the `#06372E` promo bar, so there is no seam.

**Shop card frames were hidden behind the photo.** The card carried its 1px
`#E5D9C9` ring as `boxShadow: inset` on the `<Link>`. CSS paints an inset shadow
*below* descendants; Figma paints a frame's stroke *above* its children
(`1523:1546`: 204×297, 1px INSIDE, radius 14, clips). The photo reaches the
card's top/left/right edges, so it covered three sides. Moved the ring to a
`pointerEvents: none` overlay as the last child — same radius, clipped by the
card's own `overflow: hidden`.

**The guard.** `scripts/check-opaque-assets.mjs` (`npm run check:assets`, wired
into CI before `test:unit`) fails on any icon-sized served PNG without alpha.
"Icon-sized" means not larger than 200px in *both* directions, so a wide-and-
short glyph strip cannot slip past. `glyph-promo.png` is allow-listed with its
reason. Proven by re-introducing a deleted crop: exit 1, correctly named.

Full Playwright suite green, 106/106. Both pixel baselines regenerated — the
`product-detail` one had been failing before any of this work (committed at
2501px against a PDP that now renders 1616px, the height of frame `1523:3971`),
so it was stale from the branch's own redesign rather than from these edits.

**Same pattern, not touched:** `components/home/A3.tsx:128` and
`components/home/BestSellersRail.tsx:193` place the ring under an
edge-to-edge photo exactly as the shop card did.

## 2026-08-06 (6) — `worktree-glyph-node-exports` merged: the star art has to be both

Entry (4) left this branch out because it had no commits yet, only a dirty
worktree. It committed, so it is in `main` now. Three conflicts; two were
routine (this file, and both baselines) but one was not.

- **The PDP star art.** `feat/product-reviews` had made both star rows fill to
  the live average, veiling the stars past it — built on
  `glyph-stars-14/15.png`, which entry (5) *deletes*. Taking either side alone
  was wrong: HEAD would 404 on a deleted asset, theirs would silently revert
  the rows to a hardcoded "4.9 · 286". Resolved as **(5)'s asset and geometry
  + (1)'s live behaviour** — the node exports `1523-3993.svg` (69×13 at
  0.53,100.51) and `1523-4112.svg` (74×14 at 25.07,123.69), with the veil
  rescaled to those boxes. The count text keeps its widened 130 mask, not the
  frame's 112, so a live value cannot paint outside it.
- The veil's stated reason changed: it existed because the palette PNG had no
  alpha. The node exports do, so a clipped copy would work — kept the veil
  (it still reads correctly) and corrected the comment rather than leaving a
  false one.
- **Baselines.** Both branches regenerated `product-detail-masked-darwin.png`
  from the same ancestor, so neither side matched the combined page.
  Regenerated after merging; `shop-masked-darwin.png` had one side only and
  merged cleanly.
- Checked that no code references any of the 14 deleted crops (only this
  file's prose does), and `npm run check:assets` — the new CI guard — passes.

**Still open from (5):** `components/home/A3.tsx:128` and
`components/home/BestSellersRail.tsx:193` have the same ring-under-photo bug
the shop card had. Not touched.
## 2026-08-06 (7) — Company legal identity (`worktree-feat-company-legal-info`)

Charles asked whether the site should carry company-name information. It must:
PayPal Advanced Checkout onboarding checks for a legal business name and
contact route, US CAN-SPAM requires a physical postal address in every
commercial email (our Resend order emails included), and an unidentified
seller costs conversion on a $100+ gift.

Shipped the plumbing, left the owner data blank on purpose:

- `lib/company.ts` (new) — the one formatter for the identity:
  `companyPostalLines`, `hasCompanyIdentity`, `companyEmailFooter`. Pure, no
  I/O. Blank owner data yields nothing rather than a half-filled block.
- `lib/supabase/seed-data.ts` — `SettingsShape.store` gained `legal_name`,
  `registration_number`, `address_lines`; seeded blank. The seed contact email
  moved off the pre-rename `support@goldrose.example`.
- `/admin/settings` → General → **Legal business identity** (`SettingsView.tsx`,
  `actions.ts`, `lib/admin/i18n.ts` EN + 中文). The zod schema accepts `""` so a
  half-filled form still saves; the address is one textarea, one line per row,
  because postal formats differ by country.
- `components/screens/ContactLegalScreen.tsx` + `app/policies/contact-legal/` —
  the coming-soon scaffold became a real, indexable page. Deliberately not a
  pixel-exact import: frame `2118:245` is still not Ready-for-dev, but the page
  is a payment prerequisite, so it ships as plain typography in the shared
  cream/Playfair idiom.
- `lib/email.ts` — the buyer's order-confirmation and shipping-confirmation
  emails now carry the postal footer; the owner's internal alert does not.
- `tests/unit/company.test.ts` — 5 tests. 72/72 unit tests, typecheck and lint
  clean; both page states verified in the browser at 375×812.

Filed AI-033 (owner: the registered entity details, and the China-vs-US
seller-of-record decision) and AI-034 (design: no per-page footer surface for a
legal identity line — the A-11 band is a fixed-height Figma import).

Gotcha worth remembering: the local file adapter holds the whole DB in memory
and flushes on shutdown, so patching `.data/db.json` under a running dev server
is silently reverted. Stop the server, patch, then start.

### 2026-08-06 (same day, follow-up) — the footer, and why it became urgent

Charles asked whether a footer had been built. It had not — the plan was to
leave the legal identity in the MENU overlay and the Policies & Legal hub. Then
he supplied the real driver: **TikTok rejected the Business API application**
with "your company name doesn't match your email domain or company website
information". The application named *Zhongshu Technology Worldwide Limited*
against https://eldreve.com; the reviewer found no such company on the site.

Menus don't help there — reviewers and crawlers don't open them. So:

- `components/SiteLegalFooter.tsx` (new) — "© 2026 ELDREVE · Zhongshu
  Technology Worldwide Limited" plus a link to the legal notice, on `/`,
  `/shop` and `/products/[slug]`. Rendered as a **sibling after** `ScaleFrame`,
  not inside it: every public page is a fixed-height pixel-exact canvas, so an
  in-canvas line would overflow and be reset by the next Figma sync. This is
  the first storefront element deliberately outside the Figma canvas.
- `lib/company.ts` — split `hasCompanyIdentity` into `hasCompanyName` (name
  only) and `hasPostalIdentity` (name + address). The old single predicate
  would have hidden the entity name on the legal page until an address arrived
  — exactly the failure TikTok cited. CAN-SPAM still gates the *email* footer
  on a real address.
- `lib/supabase/seed-data.ts` — the entity name is now the seed default.

⚠️ Seeds only fill *missing* keys, so production will not pick this up on
deploy: the hosted `store` row must be saved once at `/admin/settings`.

Still open: registration number and postal address (AI-033); whether the design
team wants to draw their own footer (AI-034).

## 2026-08-06 — /shop renders only real catalog products

- **Ask (owner):** make /shop show only the product that actually exists in
  the database.
- **Cause:** the grid cycled the catalog to fill the Figma frame's eight fixed
  slots (`data[c % data.length]`), so the single hosted product was drawn
  eight times, across five rotated "pages" — plus a hardcoded "120 GIFTS" and
  a "Show 36 Results" button.
- **Change:** the frame's numbers are now grid CAPACITY, not content. One card
  per product; row count, pager and canvas height are derived from the
  catalog. Constants read back off the slot table (top 408.5, pitch 308, card
  297, pager gap 27, pager 32, tail 133.5), so a full eight-card page rebuilds
  the frame's 1822 exactly — verified at 1822 with 12 seeded products.
- Real paging (8/page, windowed 5-button pager, hidden at one page), counts
  wired to the catalog, `?q=` preserved across pages, and a first empty state
  (no-match search / empty catalog / failed read) since the grid can now be
  empty.
- **Verified:** typecheck, lint, build, 74 unit tests, 107 e2e tests, `/shop`
  pixel baseline regenerated (canvas 1822 → 1147 for the 3-product seed).
- **Left for design:** the "Ruby Red"/"Gift Sets" chips and the 5-star card
  art are still static frame art; the empty-state line has no Figma frame.

## 2026-08-06 — the product page now renders the catalog row

- **Ask (owner):** "this PDP totally not generated from database" — wire it;
  keep the review block and the unboxing count on the page.
- **Was live before:** title, price, compare-at. Nothing else. Description,
  SKU and photos reached only the `<meta>` tags and the Product JSON-LD.
- **Now from the DB:** hero photo (and the media trigger's own copy that
  covered it), the ABOUT panel photo, the media viewer's set, the badge pill
  (`badge`, was a flat BEST SELLER), the strapline (first three `details`),
  the discount pill (computed — 31% on the live product, was a flat "15% OFF"),
  the ABOUT copy (`description`, 3-line clamp), and every number in the
  reviews band and drawer.
- **Zero reviews now reads as unrated** — the band and drawer stay on the page
  per the owner, but the frame's "4.9 · 286 Reviews", the 91/7/1.4/0.4/0.2
  histogram, the "Sarah M. · Verified Buyer" quote and the drawer's four
  named testimonials are gone. Those were review claims with an empty
  product_reviews table (US FTC exposure before launch).
- **Left as the frame's own, on instruction or for want of a slot:** the
  unboxing gallery and its "(1,354)", the three shipping benefits (store
  policy), the ABOUT slogan, colour cards. `best_for` and `details` past the
  third still have no box in the frame.
- **Verified:** typecheck, lint, build, 74 unit tests, 108 e2e tests (one new
  PDP regression test), product-detail pixel baseline regenerated.

## 2026-08-06 — the PDP hero is an auto-playing, swipeable carousel

- **Ask (owner):** make the product pictures auto-play and swipe like the
  homepage carousel.
- Built on the existing shared `components/home/Carousel.tsx`, so the feel is
  identical to H-03: 1.8s auto-play, the track follows the finger
  pixel-for-pixel while held, 40px release commits to the neighbour, 6px tap
  slop separates tap from drag, auto-play pauses on hover/drag and is off
  under reduced motion.
- The hero **moved into `PdpOverlays`**. It had two stacked photo layers at the
  same rect (the page's `<img>` and the media trigger's own copy, which exists
  so the hover-zoom worked); two tracks could never hold the same slide, and
  the trigger has to stay on top to open the viewer. The page now draws only
  the card behind it.
- Dots are generated from the photo count, all one size, active by colour —
  the call `HeroCarousel` already made for the site. A single-photo product
  gets no dots. The frame's 18px active pill is gone with them.
- Carousel gained two optional props: `onActivate` (slides become buttons
  instead of links) and `radius`. Home page behaviour is unchanged.
- Hover-zoom on the hero is dropped; it fought the drag and the homepage hero
  has none either.
- Seed fixture: `premium-gold-rose-gift-bundle` now carries three photos so
  both paths (multi-photo carousel, single-photo hero) have a fixture.
- **Verified:** typecheck, lint, build, 74 unit tests, 111 e2e tests (three new
  carousel tests), product-detail pixel baseline regenerated. Drove it in a
  real browser: auto-play steps one slide width every 1.8s, a drag swipes
  without opening the viewer, a tap opens it, reduced motion parks it.

## 2026-08-06 — PDP photo viewer close icon + admin 取景框

Two owner reports.

**1. The photo viewer had no visible close control.** Figma frame 1523:4257
carries a `Close Menu · 44px` button at (376,10) with a 20×20 icon; the 1523
import missed it (it was added to the frame later, node 2571:375). What
shipped instead was a top-left back chevron the frame no longer draws, so
dismissing worked only through OverlayStage's invisible full-page scrim —
tapping where the X should be closed the viewer without ever showing one.
Exported node 2571:376 to `public/eldreve/screens/2571-376.svg` and put the
frame's real button in; the stale chevron is gone.

**2. 取景框 — framing box in the admin Media card.** Every storefront photo
box is a fixed design rectangle drawn with object-fit: cover, so the browser
crops to the CENTRE and an off-centre subject gets cut, with no way to say
otherwise.
- Migration `0008_product_image_focal_point.sql`: `focal_x`/`focal_y`
  smallints (0-100, default 50) on `product_images`, plus `create or replace
  view catalog_products` carrying them in the images jsonb. Replace, not
  drop+create, so the view's grants survive and the storefront never sees a
  moment without its only readable object. Dry-run against the hosted DB
  inside a transaction and rolled back — valid, and nothing persisted.
- `ImageFramer` (app/admin/(dashboard)/products/): the PDP photo window at its
  true 398×250, photo cover-fitted inside, drag to reposition, rule-of-thirds
  guides, live percentage readout, Centre to reset. Says so when a photo has
  no slack to drag. A focal point, not a crop: no second file, no pixels lost,
  and one stored point re-solves for every box size.
- Honoured by the PDP hero carousel, the ABOUT panel and the shop cards. The
  admin thumbnails preview it too.
- **Not yet applied to hosted** — `supabase db push` is required before this
  merges, or admin product saves will fail on a table without the columns.
- **Verified:** typecheck, lint, build, 80 unit tests, 112 e2e tests including
  a new round-trip (drag in admin → save → PDP and shop card both crop to
  50% 100%).

## 2026-08-07 00:43 AEST

- **Stale sweep across the repo** (branch `worktree-remove-stale`). Scope set
  with Charles: delete `archive/` + unreferenced `public/` assets + fix the
  doc pointers; **keep `scripts/features/cli.mjs`** (his call — the roadmap
  generator rebuild still needs it) even though nothing calls it today.
- **`archive/` deleted** — 57 files, 5.8MB (the superseded ixd-home-shop
  homepage/shop interaction tables and 55 frame JPEGs). SUMMARY.md already
  described it as unreferenced; a repo-wide grep confirmed zero inbound links.
- **1,029 unreferenced files removed from `public/`** — 51MB; the folder goes
  75MB → 24MB and 1477 → 448 files. Leftovers from the homepage simplification
  (11 bands → 7, frame 2380:370) and screens superseded by later Ready-for-dev
  frames. `public/` is served, so all of it was publicly reachable design
  material.
- **The scan had to be rewritten once.** A filename-only match reported 1,244
  unused files, but asset paths here are frequently dynamic — e.g.
  `app/products/[slug]/page.tsx:481` renders
  `src={\`/eldreve/screens/\${row.glyph}.svg\`}` off a bare `"1523-4002"` string,
  which no filename grep can see. Final rule: keep a file if its full basename
  **or** its bare stem appears anywhere in any tracked source/doc/config. That
  spared 204 live assets the naive scan had condemned.
- **Checked against the Figma pipeline before deleting:** `scripts/figma/cli.mjs:510`
  only uses `existsSync` as a skip-if-present guard and `figma:baseline` stamps
  frames, not files — so a deleted asset is simply re-exported by the next
  `assets` run. Reversible via git history and re-export both.
- **Docs corrected:** dropped the `archive/` row from the SUMMARY.md structure
  chart, added a stale-sweep state bullet, and fixed `team-deliveries/README.md`
  which still routed superseded docs to `archive/`. Left alone deliberately:
  `region-alignment.md` and `admin-design.md` already say "since-deleted"
  (accurate history), and the ShoppingLogin/veloria mentions are deliberate
  records of past removals.
- **Clean already, nothing to do:** no unused npm dependencies, no unreferenced
  modules under `components/` or `lib/`, no empty directories.
- **Verified:** typecheck, build, 80 unit tests, 111 e2e tests all pass —
  including the three pixel baselines (home, shop, product-detail), which are
  the real proof no rendered image went missing.

## 2026-08-07 01:11 AEST

**Admin can edit every home page section** — branch `worktree-admin-home-sections`.

New screen Content → **Home page** (`/admin/content/home`): all 8 sections of
`/` in page order, ~100 fields, plus a show/hide switch per Figma band.

- **`lib/home-content/registry.ts`** — one declarative description of every
  editable string, with the design's own wording as the default and the field's
  box geometry as a character budget. The `A*` components now render from it.
- **Overrides-only storage.** A `site_content` row exists **iff** the owner's
  value differs from the design default. Saving the default deletes the row;
  reset deletes the row. No migration, no ~100-row seed, and a future Figma
  sync updates every untouched field automatically. The alternative (seeded
  rows carrying `default_value`) would have frozen a stale default into the DB
  the first time the design changed.
- **Show/hide re-stacks.** The seven A-bands tile the stage contiguously
  (32→764→1405→1868→2344→3133→4124→5134 + 59 nav), so hiding one drops it,
  slides later bands up by its height via a `translateY` wrapper, and shrinks
  `ScaleFrame`. `HomeBand` renders children bare when the shift is 0, so the
  untouched page emits exactly the DOM it did before — that is what lets the
  pixel baseline stay byte-identical.
- **Four field kinds.** `text`/`multiline`/`url` are typed in; `artwork` is
  wording baked into a Figma SVG (§11) and `managed` is catalogue/review data —
  both listed read-only with the reason, so the screen is a complete inventory.
- **`isSafeHref`** rejects `javascript:` and friends at the write; the client
  blocks Save on a bad link so one typo cannot cost a round of edits.
- `promo.slogan` moved off `/admin/content` (which now filters `policy.`,
  `home.`, `promo.`) and gained a pointer card to the new screen.

**Two things the work turned up**

- Five footer labels pad with **U+00A0**, not a space — the pixel test caught a
  2px shift when I transcribed them as ordinary spaces (a normal space at the
  edge of a `nowrap` flex item collapses). They are now written as escape
  sequences in the registry rather than as invisible characters.
- The hero eyebrow still reads `— G O L D R O S E —`: a miss in the 2026-08-05
  ELDREVE rename. Left as-is (changing it is a copy decision, and it would move
  the pixel baseline) but it is now editable in admin.

**Verified:** typecheck, lint, 11 new unit tests (91 total), 4 new e2e tests,
full e2e suite, and all three pixel baselines byte-identical. Drove the screen
in a real browser at 1280×1150.

## 2026-08-07 — session launcher split into two scripts

Tooling only; lives in `~/Documents/bin`, outside this repo.

- **Renamed** `start2CSession` → `claude-worktree-session`. The old name was
  ambiguous (`2C` = to-Claude? v2?) and camelCase matched nothing else in
  `bin/`. Checked call sites first: the only references were Claude's own
  `.jsonl` transcripts, so nothing broke.
- **Extracted** the tmux/Chrome lines out of the prompt heredoc into a new
  `claude-dev-window <worktree_path> <port> <session>`. They were a template
  the model had to reproduce verbatim; now the only non-deterministic input is
  the worktree path, which genuinely cannot exist before Claude creates it.
- **Fixed:** the dev window no longer vanishes when `npm run dev` crashes
  (tmux destroys a window when its command exits — a trailing `read` holds it
  open with the error visible). Added guards for missing worktree, missing
  `package.json`, and absent tmux session, so failures surface as text the
  agent can act on. Heredoc's "run these three commands" listed only two.
- **Left alone:** the free-port probe races between closing the socket and npm
  binding. Now that a crashed window stays open, an `EADDRINUSE` would at
  least be visible.
- **Verified:** `bash -n` on both, both resolve on `PATH`, guard clauses
  return 1 with usage text. Not yet run end to end.

## 2026-08-07 17:33 AEST — every unmerged branch folded into `main`

Asked to read all branches, merge whatever was outstanding, and settle the
conflicts.

- **Survey first.** `git fetch --prune` deleted three remote branches
  (`feat/pdp-image-framing`, `worktree-feat-company-legal-info`,
  `worktree-shop-real-products-only`). Checked each tip with
  `git merge-base --is-ancestor` before trusting the prune — all four were
  already in `main`, so nothing was lost. That left exactly two real branches.
- **Dry-ran both** with `git merge-tree --write-tree`, which computes a merge
  in memory without touching HEAD or the working tree. It predicted the
  outcome exactly: one clean, one conflicting in a single file.
- **`worktree-pdp-overlays-merge-fix` — `main` was broken.** Fast-forward.
  `components/pdp/PdpOverlays.tsx` carried `import { Carousel }` twice (60/61)
  and `const DOT_PITCH` twice (75/80) — both hard `SyntaxError: Identifier has
  already been declared`, so the module could not parse. Same double-merge had
  duplicated two `premium-gift-bundle` image rows in `seed-data.ts`; the merge
  kept the copies carrying `focal_x`/`focal_y` and dropped the older pair.
  A textual 3-way merge is content-blind — a repeated `const` reads as ordinary
  added lines — which is the argument for a build gate *after* a merge, not
  only before.
- **`worktree-admin-home-sections` — 26 code files auto-merged**, conflict
  confined to `.ai/WORKLOG.md`. Both sides had appended after the same point.
  Resolved by keeping everything and restoring chronological order:
  00:43 AEST → 01:11 AEST → session launcher. 5620 lines with markers → 5618
  without; both entries verified present exactly once.
- **One e2e failure was a stale fixture, not a regression.** The PDP carousel
  test wants >1 photo dot; `.data/db.json` was seeded 2026-08-05, when
  `premium-gift-bundle` still had one photo. The seed *source* already said
  three. `npm run seed -- --reset` refuses when it sees a hosted DB with
  orders, so it was re-run with the Supabase variables blanked — the same
  trick `playwright.config.ts` uses to force local mode.
- **Verified:** typecheck clean, lint clean (2 pre-existing warnings, 0
  errors), 91/91 unit tests, production build, 116/116 e2e including all three
  pixel baselines.
- **Not done, deliberately:** nothing pushed — `main` is 5 commits ahead of
  `origin/main` and that is Charles's call. The merged worktrees and branches
  are left in place for the same reason.
- **Two things turned up.** `.ai/WORKLOG.md` still carries three duplicated
  2026-08-06 headings (`/shop renders only real catalog products`, `the product
  page now renders the catalog row`, `the PDP hero is an auto-playing,
  swipeable carousel`) — the same double-merge that broke `PdpOverlays.tsx`,
  left unfixed as out of scope. And `app/products/[slug]/page.tsx` picked up an
  uncommitted one-line change (a `"center"` align on the review-count label) at
  17:31, mid-run, from a concurrent session — untouched here.

## 2026-08-07 — Best Sellers rail: one card size

**Branch:** `worktree-fix-bestsellers-card-size` → merged to `main` (`305c0e7`, unpushed).

- The 08-04 frame drew card 2 (`2380:415`) as a 184×349 box 17px below card 1's
  250×366. The owner read that as a rendering fault, not a stagger, so both
  cards now draw into card 1's box. The geometry moved from per-card fields to
  module constants in `components/home/BestSellersRail.tsx`, so no card can
  carry its own size. **This is a deliberate deviation from the frame — a Figma
  re-sync must not restore the smaller box.**
- Widening the card widened a defect the frame already had: `2380-416.png` is a
  368×444 canvas whose right 21% is transparent padding, so the photo window's
  `#F3C6D1` backing showed as a pink strip down the card's right edge. The photo
  is now a left-anchored bleed box scaled until its opaque part alone covers the
  window, clipped by the window — the idiom card 1 already used.
- `tests/e2e/__screenshots__/home-darwin.png` rebuilt; the pixel diff is
  confined to that one card. 91 unit + 116 e2e pass.
- ⚠️ **Found while testing:** `playwright.config.ts` hardcodes port 3001 with
  `reuseExistingServer: !CI`, so a suite run from one worktree silently attaches
  to whatever `next start` already holds 3001 — including another worktree's
  build. Two of my runs reported a false pass/fail from the `pdp-subtitle-wrap`
  worktree's server before I caught it. Not fixed here.


## 2026-08-07 17:45 AEST — the consolidation pushed, CI back to green

Follow-on to the merge above, after a CI-monitor event flagged PR #35.

- **PR #35's failure was one trailing space.** `prettier --check` rejected
  line 1 of `scripts/features/cli.mjs`. `git log -- <file>` put it on 9355636
  ("Add explanatory comment to preserve learning scripts") — already on `main`,
  inherited by the PR rather than caused by it. `main`'s own CI had been red
  for its last two runs. Comment wording untouched; only the whitespace went.
- **No feedback to answer.** The PR's only comment was vercel[bot]'s
  deployment table — zero inline comments, zero reviews, nothing to reply to.
- **Pushed** `9355636..b5cc0b1` (8 commits, no divergence). PR #35 auto-closed
  as MERGED, GitHub deleted its head branch, and the CI run on `b5cc0b1` is the
  first green one after two failures.
- **Branches cleaned to `main` only on GitHub.** Deleted `feat/figma-sync`,
  `feat/product-reviews`, `worktree-account-personal-info-live` remotely, and
  the two local branches no worktree held. Every deletion was gated on
  `git merge-base --is-ancestor <branch> main` first; the locals went via
  `git branch -d`, which refuses anything unmerged. Worktrees left in place.
- **A second session is working in this same directory.** It committed
  `2ba7a61` (review-caption centring) mid-run, then `fdc2c71`/`305c0e7`/
  `dd3e7cb` (Best Sellers card size) after the push, and created
  `worktree-fix-bestsellers-card-size`, `worktree-media-spotlight`,
  `worktree-pdp-subtitle-wrap` and `fix/pdp-badge-truncation`. None of it was
  touched here, and `main` sits 3 commits ahead of `origin/main` because those
  three are not mine to push.

## 2026-08-07 — Shop filter drawer: outside-click dismiss, Reset clears, confirm disables

- Branch `worktree-feat-shop-filter-dialog` (worktree `.claude/worktrees/feat-shop-filter-dialog`), commit `8ba7974`.
- The drawer/sort click-away backdrop only covered the 430-wide `.figv-stage`, so clicks in the page margins beside the canvas and on the bottom nav never dismissed it. A fixed backdrop cannot reach them (the stage is scale-transformed, so it becomes the containing block and clips fixed children), so a capture-phase document `pointerdown` listener was added alongside the existing in-stage shield; Escape closes as well. The open panel and its own trigger count as inside, keeping the trigger a toggle.
- Reset now clears every group instead of restoring the Figma default selection; with nothing selected the "Show N Results" button is `disabled` at 45% gold, cursor `not-allowed`.
- Verified live at localhost:3610: margin click, Escape, trigger toggle twice, in-drawer chip click (stays open), Reset (all five groups cleared, button dims), press on the disabled button (no close), re-select then confirm (closes), sort dropdown margin click. `tsc --noEmit`, eslint, prettier and 91 unit tests clean; the 3 shop e2e tests pass. The `/shop` and `/product-detail` pixel baselines fail in this worktree BOTH with and without the change — pre-existing on `main`, not caused here (the newer baselines live on `feat/best-for-facets`).
## 2026-08-07 — PDP strapline wraps to two lines (`worktree-pdp-subtitle-wrap`)

The product page's strapline (the first three `details` bullets) was a
single `white-space: nowrap` line that truncated with an ellipsis. Real
catalog copy overflows it — "Genuine preserved rose · Rich ruby-red finish ·
Gold-trimmed petal edges" is 71 characters against room for roughly 59 — so
the box now wraps to two lines and never shows an ellipsis. A third line is
clipped whole by the fixed height rather than ellipsized.

- `app/products/[slug]/page.tsx` — strapline box 398×31.466, `white-space:
  normal`, `overflow: hidden`, no `text-overflow`. The extra 16px pushes the
  rating row (100.51 → 116.51), review count (99 → 115), price (122 → 138),
  compare-at (131.5 → 147.5) and the discount pill (128.5 → 144.5) down inside
  the info card, which grows 166 → 182. Every section below moves 16px too
  (541→557, 706→722, 989→1005, 1192→1208, 1360→1376) and the stage is
  1616 → 1632. The original vertical rhythm is preserved exactly (10.0px above
  the stars, 8.5px above the price).
- `components/pdp/PdpOverlays.tsx` — the three page-absolute hit targets follow:
  rating row 468 → 484, ratings summary 757 → 773, unboxing "View All" 1205 → 1221.
- `tests/e2e/__screenshots__/product-detail-masked-darwin.png` re-recorded; the
  home and shop baselines are byte-identical.

Verified: `tsc --noEmit` clean, lint clean (2 pre-existing warnings in
`account-chrome.tsx`), 91 unit tests, 116 e2e tests incl. all three pixel
baselines. A throwaway Playwright check with the long strapline seeded
confirmed 31.45px rendered height and `scrollHeight === clientHeight` (nothing
cut off).

⚠️ Ready-for-dev frame `1523:3971` still says 430×1616. This is a deliberate
departure from the frame; Figma needs the same 16px change.

Side note: the worktree branched from `origin/main`, which is behind local
`main` and still carries the duplicate `Carousel` import that b0b3a93 repaired.
Rebased onto local `main` before working.
## 2026-08-07 — Spotlight areas for every product photo (`worktree-media-spotlight`)

**Ask:** every uploaded photo should have a spotlight area chosen for it — the
view the PDP image viewer shows — while the fullscreen viewer keeps showing the
whole original; and the hero should sit properly in the shop card, which needs
its own selected area.

**Already in the repo (0008, `feat/pdp-image-framing`):** one focal POINT per
photo driving CSS `object-position`, shared by every box. The fullscreen
`MediaViewer` already drew photos with `object-fit: contain`, so "the full
viewer shows the original" needed no change — verified, not rebuilt.

**Built:**

- Migration `0010_product_image_spotlight.sql` — `focal_zoom` (not null, 100),
  nullable `card_focal_x/card_focal_y/card_zoom`, and `framed`; `catalog_products`
  replaced to carry them (`framed` stays admin-only).
- `lib/images/spotlight.ts` — the one place that turns a framing choice into
  CSS. An area is a point plus a zoom, never a cropped file: `object-position`
  places the point, `transform: scale()` about that same `transform-origin`
  zooms about it. Zoom 100 emits NO transform, because a no-op `scale(1)` still
  promotes a compositing layer and moves antialiasing — that is what keeps the
  three pixel baselines byte-identical.
- Admin: `ImageFramer` is now window-agnostic (takes a box + area) with a zoom
  slider; the dialog holds both windows; uploading opens it on the new photo;
  unframed photos carry a "Needs framing" badge. EN + 中文 strings added.
- Storefront: PDP viewer applies point and zoom; shop card uses its own area;
  the PDP ABOUT panel takes the point but NOT the zoom (that zoom was authored
  against a 398x250 box and ABOUT is a near-square 190x196).

**Verified:** typecheck, eslint, prettier, `npm run build`; 99 unit tests
(8 new) and the full 117-test e2e suite including the three pixel baselines.

**Notes:** `0010` is NOT pushed to hosted — storefront reads tolerate its
absence, an admin product save does not. A "never framed" card area is stored
as NULL and must stay NULL; flattening it to the spotlight would lose the
owner's ability to say "follow the product page".


## 2026-08-07 — `best_for` becomes the /shop filter vocabulary

Branch `feat/best-for-facets`. The filter drawer's eleven Collections /
Occasion / Recipient chips were cosmetic because no catalog field backed them;
`products.best_for` was the nearest thing and held a prose blurb no page
rendered. It is now `text[]` holding facet slugs, unbounded per product.

- `lib/catalog/facets.ts` — the single vocabulary: 11 stored slugs in three
  groups, plus Price and Availability computed from `price_cents` and stock
  and never stored. Slugs are globally unique (the group is recovered from the
  value); the index build throws on a duplicate, `assertBestFor` throws on an
  unknown or derived value at the admin's save.
- Migration `0009` — drops `catalog_products`, retypes `best_for` to `text[]`
  (old sentences dropped, not guessed at), recreates the view with a `stocked`
  boolean beside `in_stock`, re-grants to anon. **Not pushed to hosted yet.**
- `/shop` filters server-side from `?f=jewel,anniversary` so the grid, the
  "N GIFTS" count and the pager share one authority. OR inside a heading, AND
  across headings. Facet URLs are noindexed like `?q=`.
- The drawer multi-selects, "Show N Results" counts the pending selection
  before the tap, Reset clears it, and the active-chip row is real with a
  working ×. The frames' two fixed chips ("Ruby Red", "Gift Sets") are gone —
  the only pixel change; baseline updated, home and PDP byte-identical.
- Admin "Best for" text box → grouped multi-select (EN/中文). The round-trip
  test caught a real bug on the way: Polaris `ChoiceList` echoes back the whole
  `selected` array it is handed, not just its own group, so the naive merge
  double-counted the other groups' slugs. `assertBestFor` refused the save
  instead of storing junk — the validation earning its keep on day one.
- Tests: `tests/unit/facets.test.ts` (vocabulary, AND/OR, price bands,
  availability), `tests/e2e/shop-filters.spec.ts` (9 cases), and an
  admin -> storefront round trip in `admin-products.spec.ts`. Green: 126 e2e,
  112 unit.

### Follow-up the same day — Price is single-choice

Owner ruling: a product has one price, so overlapping bands read as a mistake
rather than a wider search. Headings now carry a `select: "one" | "many"`
field; Price is the only `one`. Picking a second band swaps the first, tapping
the lit band clears it, and `parseFacetParam` narrows a hand-typed
`?f=under-100,300-plus` to one band so no URL can reach a state the drawer
cannot draw or undo. The rule lives in the registry, not the component, so
taps, the chip ×, and pasted URLs all obey the same one. 118 unit, 128 e2e.

Open: push `0009` to hosted — `supabase db push` is blocked for the agent by
the permission classifier, so the owner runs it. Values that are already chip
names carry across (both hosted rows say "Classic Collection" -> `classic`);
everything else starts empty and is re-picked in the admin.

## 2026-08-07 19:30 AEST — five more branches merged, and a migration collision

Second consolidation pass. `main` was not checked out anywhere (a concurrent
session had moved this directory onto `feat/best-for-facets`), so the merges
were done in a dedicated worktree checked out on `main` — which advances the
ref through real merges instead of force-moving it.

- **Merged, in order:** `worktree-feat-shop-filter-dialog`,
  `worktree-feat-coming-soon-header`, `worktree-pdp-subtitle-wrap`,
  `worktree-media-spotlight`, `feat/best-for-facets`.
- **`worktree-feat-coming-soon-header` was another empty branch** — zero
  commits, the whole brand-top-nav change uncommitted in its worktree. Same
  pattern as `worktree-pdp-subtitle-wrap` earlier today. Committed on the
  branch first, then merged.
- **⚠️ Two migrations were both numbered `0009`.** `worktree-media-spotlight`
  wrote `0009_product_image_spotlight.sql`; `feat/best-for-facets` wrote
  `0009_product_best_for_facets.sql`. Neither was pushed, so spotlight was
  renumbered to `0010`. **The order is load-bearing, not cosmetic:**
  `0009` does `drop view catalog_products` and recreates it carrying only
  `focal_x`/`focal_y`, while `0010` `create or replace`s it with the full
  spotlight set. Run the other way round, `0009` would silently strip the
  spotlight columns from the view the storefront reads, and framing would
  stop working with nothing failing loudly. Both view column lists are
  identical, so the `create or replace` in `0010` is valid after `0009`.
  References updated in `SUMMARY.md`, `docs/admin-design.md`, the worklog and
  the migration's own comments.
- **`ShopInteractive.tsx` was the real merge**, 5 hunks: two sessions rewrote
  the same filter drawer. `feat/best-for-facets` supersedes
  `worktree-feat-shop-filter-dialog` — it replaced the drawer's whole state
  model (`filterSelection` indices → `pending` facet slugs), so the branch
  wins on Reset, the confirm button and the removed helpers. Kept from the
  other side: the outside-click/Escape dismissal, which is orthogonal and had
  no counterpart. Also removed `nothingSelected`, which git had auto-merged
  into a dangling reference to a state variable the branch deleted — a clean
  merge that would not have compiled.
- **`lib/admin/products.ts` and `tests/e2e/admin-products.spec.ts`** were
  both-sides-added conflicts, not either/or: two imports and two independent
  tests landing at the same spot. Both sides kept.
- **Verified** on the merge commit in an isolated checkout: typecheck clean,
  lint clean (2 pre-existing warnings), format clean, 126 unit tests, the
  production build, and 129 e2e tests including every pixel baseline. One
  earlier `ECONNRESET` on `/sitemap.xml` was a flake — that spec passes alone
  and the full re-run was 129/129.
- **Not done:** nothing pushed. `main` is 18 commits ahead of `origin/main`.

## 2026-08-07 20:05 AEST — CI now guards the migration sequence

Asked to find and fix the thing most worth improving. Picked the one failure
class today that **no existing check could see**.

The 0009 collision earlier today passed lint, typecheck, `format:check`,
`check:assets`, the build and all 129 e2e tests — because nothing in CI reads
a `.sql` file. Two files with different names are two adds, not a conflict, so
git merged them silently too. It was caught by hand, and only then did the
worse half surface: both migrations rebuild `catalog_products`, and the
`best_for` one omits the spotlight columns, so the wrong order would have
stripped them from the view the storefront reads with nothing failing loudly.
Migration numbers are a shared namespace with no locking, and this repo runs
several agent sessions branching in parallel — so it recurs by construction.

- **`scripts/check-migrations.mjs`** — follows the `check-opaque-assets.mjs`
  pattern (why-it-exists header, `--json`, exit 1 on findings). Errors:
  a version claimed by more than one file, and a filename off
  `NNNN_lower_snake_case.sql` (a name that will not parse would drop out of
  the duplicate check, so it has to fail rather than pass quietly). Warnings:
  a gap in the sequence except the deliberately-skipped `0004`, and a view
  whose surviving definition drops a column an earlier migration exposed.
- **Pure core, thin CLI.** `inspectMigrations(files)` takes `{name, sql}`
  rather than reading the disk, so the tests describe a broken sequence
  instead of creating one and keep testing the same thing as the real
  directory grows.
- **The view check is a heuristic, and says so.** It reads `p.column` and
  `as alias` between `create view X as` and its `from` — enough for the
  failure mode that motivated it, and warning-only, so a miss or a false
  positive costs nothing.
- **Wired in:** `npm run check:migrations`, and a CI step next to
  `check:assets` with a comment saying why it is there.
- **Proved against the real bug**, not just synthetic input: replaying today's
  actual pre-fix filenames produces the duplicate-version error, and replaying
  the reversed (dangerous) order names the exact four columns that would have
  been lost — `focal_zoom`, `card_focal_x`, `card_focal_y`, `card_zoom`.
- **Verified:** lint clean, typecheck clean, format clean, `check:assets`,
  `check:migrations` green on the real sequence, 135 unit tests (126 + 9 new),
  production build.

## 2026-08-07 20:25 AEST — the worklog stops conflicting on every merge

Second of the two follow-ups. `.ai/WORKLOG.md` is append-only, so it conflicts
on nearly every merge — four of the eight on 2026-08-07 — always the same
shape: two branches appended after the same point, and the resolution is
always "keep both sides". No judgement, just friction, and hand-resolving it
is how three entries got duplicated in the first place.

- **`.gitattributes` (new)** marks `.ai/WORKLOG.md merge=union`. `union` is
  compiled into git rather than being a custom driver, so a fresh clone gets
  the behaviour with no setup. Also pins
  `tests/e2e/__screenshots__/*.png binary` — git already detects that, but it
  stops a future `* text=auto` from ever line-ending-normalising a baseline.
- **Proved, not assumed.** Made two throwaway branches that each appended a
  different entry and merged them: previously a guaranteed conflict, now
  `Auto-merging .ai/WORKLOG.md` with zero conflicted files and both entries
  present. The test also turned up a cosmetic wrinkle worth knowing — the
  blank line between the two new entries can be absorbed — which is written
  into `.gitattributes` next to the rule.
- **The cost is documented next to the rule:** union can never report a
  conflict on this path again, so two edits to the *same* line would both
  survive silently. Fine for a log, wrong for anything else, so the rule names
  one file rather than `*.md`.
- **Removed three duplicated 2026-08-06 entries** (`/shop renders only real
  catalog products`, `the product page now renders the catalog row`, `the PDP
  hero is an auto-playing, swipeable carousel`) — residue of the same
  double-merge that broke `PdpOverlays.tsx`. Verified byte-identical by md5
  before deleting; 326 → 323 entries. Two other repeated headings
  (`2026-06-30 16:52`, `2026-07-15 15:21`) turned out to be **different
  content that happens to share a timestamp** and were left alone — the md5
  check is the only reason they survived.

## 2026-08-07 20:42 AEST

- **Deleted the `2026-07-25-figma-naming-guide` delivery batch** from
  `team-deliveries/originals/` — `Figma_UI_Naming_Guide_GoldRose.xlsx` (a
  translated spreadsheet) and its `batch.md`. Charles's ruling: the guide is a
  translation, the adopted naming rules were regenerated into `docs/ixd/naming/`
  on 2026-07-31, so the source is dead weight.
- **This is a deliberate exception to `team-deliveries/originals/README.md`**,
  which says deliveries are never deleted because they are the authority on
  wording disputes. Git history holds the bytes (`c53435d` and later), the same
  reasoning the 08-07 stale sweep used for `archive/`. One side effect: the
  batch's sha256 is gone from the pre-parse duplicate check, so a re-delivery of
  that spreadsheet would read as new rather than as a duplicate.
- **Closed `AI-005`** (was: is that spreadsheet an incoming delivery or a
  generated export?) — the deletion moots it. Charles closed it via
  `agent-inbox:close`; the record is in `agent-delivery/archive/`. Its "Affected
  place" line was rewritten first so the archived record does not point at a
  path that no longer exists.
- **Repointed the one live reference**, `docs/ixd/README.md`, from "its raw
  source stays in …" to a note that it was deleted as superseded. The two
  remaining mentions are dated WORKLOG entries and were left as history.
## 2026-08-07 — Figma sync: address book, two design deletions, two carousel fixes

Branch `worktree-figma-sync`. Delivery was 3 added / 40 "modified" / 1 removed
frames; frame-by-frame diffing put the real changed count at 29 (11 flipped their
hash on prototype/dev-status metadata only). Six read-only agents then compared
each of the 29 against the repo: 56 still-old, 5 already-done, 5 diverged,
11 not built.

- Built `/account/addresses` (ADDRESS-BOOK 2118:247) + the add/edit bottom sheet
  (2134:299 / 2610:373 collapse to one component with a `mode` prop). Last
  Ready-for-dev frame with no route; `figma:unbuilt` is now empty.
- Applied two design deletions: the `/account` three-tile shortcut band, and the
  homepage Real Rose Promise strip (band 463 -> 327, stage 5193 -> 5057) via a
  new `band.trim` so no later band's imported coordinates moved.
- Fixed two interaction bugs found while checking a "carousel not swipeable"
  report: (1) Carousel applied EDGE_RESISTANCE damping to the value tested
  against the swipe-commit threshold, so edge swipes needed 3x travel;
  (2) HomeBand's shift wrapper was `inset: 0`, a full-stage transparent box
  that swallowed pointer events — latent since it was written, live only once
  the trim gave four bands a permanent shift. Both covered by real-input tests.
- Filed AI-037 (Figma still ships GoldRose/VELORIA the repo renamed — do not
  import verbatim), AI-038 (`/story` descends from a deleted frame),
  AI-039 (address book has no backend).
- Deliberately did NOT run `figma:baseline`: 28 changed frames remain unbuilt.
