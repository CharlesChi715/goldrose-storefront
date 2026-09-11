# Wiring PayPal: sandbox, webhooks, card fields, live

**Last verified 2026-09-05.** Owning records: [card-payments](../features/card-payments.md)
(status of the card rail) and [paypal-wallet](../features/paypal-wallet.md) (status of the
wallet rail). This guide is the *procedure*; status lives in those two front matters.

**What you get.** At the end of this guide a stranger in the United States opens
`https://eldreve.com/checkout`, pays either with the yellow PayPal button or by typing a
Visa/Mastercard into card fields that PayPal hosts inside our page, the money lands in the
boss's one PayPal Business account, our server writes the order (stock, customer, timeline,
emails), PayPal's webhook independently confirms or repairs it, and `/admin` can refund it.
You get there in five phases that each end in something you can *see working* — sandbox
on the Mac, webhooks, sandbox on the live domain, the card-fields build, and a 30-minute
owner-plus-Charles cutover to real money. Nothing in Phases A–D can move real money.

```text
  THE FINISHED SYSTEM (after Phase E)

  BUYER'S BROWSER                         VERCEL — our code                        PAYPAL
  ───────────────                         ─────────────────                        ──────
  /checkout
  ┌───────────────────────────┐
  │ [ PayPal ] wallet button  │─createOrder─▶ POST /api/paypal/create ─────────▶ POST /v2/checkout/orders
  │                           │              re-price cart, INSERT checkouts row ◀── { id }
  │ Card number   [iframe]    │
  │ Expiry [ifr]  CVV [ifr]   │─submit()────────────────────────────────────────▶ card data goes straight
  │ [ PAY $x ]  our button    │                                                   into PayPal's iframes/3DS
  └───────────────────────────┘
            │ onApprove({orderID})
            └────────────────────────────▶ POST /api/paypal/capture ────────────▶ POST …/orders/{id}/capture 💰
                                           re-price again, drift check,           ◀── payment_source.card
                                           createOrder() → orders, order_lines,       {brand, last_digits …}
                                           order_events, inventory_movements, emails
                                                                                     │
                                           POST /api/webhooks/paypal ◀───────────────┘ PAYMENT.CAPTURE.*
                                           verify-webhook-signature → confirm /          CUSTOMER.DISPUTE.*
                                           repair / refund-sync / cancel / flag

  ONE PayPal Business account (the boss's) receives wallet AND card money.
  /admin refunds and cancels through the same account (lib/admin/orders.ts).
```

```text
  WHERE WE ARE TODAY (measured 2026-09-05)
  +----------------------------------------------+-------+---------------------------------------------+
  | Item                                         | State | Evidence                                    |
  +----------------------------------------------+-------+---------------------------------------------+
  | Wallet code: create / capture / webhook /    |  ✅   | lib/paypal/*, app/api/paypal/*,             |
  | refund, unit-tested with fixtures            |       | tests/unit/paypal-*.test.ts                 |
  | Sandbox credentials                          |  ❌   | none on this Mac, none in Vercel            |
  | Vercel Production PAYPAL_* variables         |  ❌   | `vercel env ls production` lists none       |
  | Live /checkout on eldreve.com                |  ⚠️   | shows the MOCK card form (Luhn-checked fake |
  |                                              |       | card, orders source='mock', no money)       |
  | Live keys                                    |  ❌   | never created; belong to the boss's account |
  | Card fields (ACDC) enablement                |  ❌   | not requested in sandbox or live            |
  | Card columns migration                       |  ❌   | 0004 skipped permanently → next free 0015   |
  | Business info for onboarding (AI-033)        |  ❌   | registration number + postal address blank  |
  +----------------------------------------------+-------+---------------------------------------------+
```

```text
  WHY THIS DESIGN — the argument lives in docs/features/card-payments.md (OQ-1, closed 2026-07-26)
  +-------------------------------+--------------------------------------------------------------------+
  | Question                      | Answer                                                             |
  +-------------------------------+--------------------------------------------------------------------+
  | Why PayPal for cards too?     | One business account, one payout, one refund path, one webhook;    |
  |                               | no second company KYC; PayPal is the PCI DSS service provider      |
  | Why not Stripe?               | The boss would need a second financial account; Stripe does not    |
  |                               | onboard China-registered entities; roughly double the money code   |
  | Why PayPal-HOSTED card fields?| The card number never touches our server or logs → the lightest    |
  |                               | PCI footprint (SAQ A); today's mock form is the opposite of this   |
  | Why provider-neutral columns? | payment_provider / provider_order_id / provider_capture_id and the |
  |                               | new payment_method_kind / card_brand / card_last4 outlive PayPal   |
  +-------------------------------+--------------------------------------------------------------------+
```

## Table of contents

```text
  0. Decisions this guide makes for you
  1. People and accounts
  2. Phase A — Sandbox on the Mac (no code change)
       A1 Create the sandbox REST app      A2 Sandbox test accounts      A3 Test cards
       A4 Fill .env.local                  A5 Start the dev server       A6 Buy something
       A7 Check the three places           A8 Refund from /admin
       A9 ⚠️ Sandbox orders land in the LIVE database
  3. Phase B — Webhooks in sandbox
  4. Phase C — Sandbox on Vercel (the safest interim for the live site)
  5. Phase D — Card fields (Advanced Checkout) build, stages 0–5
  6. Phase E — Go-live cutover (owner + Charles, 30 minutes)
  7. Operations after launch
  8. Troubleshooting
  9. Glossary
 10. Repo bookkeeping — what changes at each phase
  Appendix A — Environment-variable matrix
  Appendix B — Webhook event list (copy into the PayPal form)
```

Conventions: every command says **where it runs** — `[Mac terminal]`, `[PayPal Developer
Dashboard]`, `[PayPal business account]` (www.paypal.com, the boss's login), `[Vercel
dashboard]`, `[browser]`, `[/admin]`, `[psql]`. Secrets are placeholders in
`<ANGLE_BRACKETS>` — never paste a real value into a document. ⚠️ marks money,
irreversibility, or live customers. "Why (industry practice)" asides explain the habit the
step teaches.

Secrets never go on the command line (they land in `~/.zsh_history` in clear text). Load
them from `.env.local` into the current terminal tab first, then refer to them as `$VAR`.
Do **not** `source` the file: `.env.local` is dotenv format, not shell — an unquoted value
such as `RESEND_FROM=ELDREVE <orders@…>` is legal there but a parse error to zsh, and one
parse error aborts the whole `source`, so *nothing* gets exported and every later psql/curl
fails with an opaque auth error. Read the three keys we need instead:

```bash
# [Mac terminal] — once per terminal tab, before any curl/psql below. Reads keys out of
# .env.local WITHOUT executing it (dotenv allows unquoted <, &, spaces; `source` does not).
ENV_FILE=/Users/charles/Developer/goldrose-storefront/.env.local
envget() { grep -E "^$1=" "$ENV_FILE" | head -1 | cut -d= -f2- | sed -E 's/^"(.*)"$/\1/'; }
export SUPABASE_DB_PASSWORD="$(envget SUPABASE_DB_PASSWORD)"
export PAYPAL_CLIENT_ID="$(envget PAYPAL_CLIENT_ID)"
export PAYPAL_SECRET="$(envget PAYPAL_SECRET)"
[ -n "$SUPABASE_DB_PASSWORD" ] || echo "SUPABASE_DB_PASSWORD not found in $ENV_FILE"
```

This is "the envget block" wherever the guide refers to it.

---

## 0. Decisions this guide makes for you

You have to make these calls somewhere; here they are made once, with the alternative that
lost. Re-open one only when its reason stops being true.

```text
  +----+----------------------------------+------------------------------------+------------------------------------------+
  | #  | Decision                         | Alternative rejected               | One-line reason                          |
  +----+----------------------------------+------------------------------------+------------------------------------------+
  | D1 | Charles reaches the boss's LIVE  | Boss shares the account password   | Revocable, auditable, boss keeps 2FA;    |
  |    | dashboard as a secondary         | (or a shared login)                | PayPal built the "Developer" user type   |
  |    | "Developer" user                 |                                    | for exactly this (§1)                    |
  | D2 | Sandbox work starts TODAY under  | Wait for the boss's invite         | Sandbox belongs to any PayPal login;     |
  |    | Charles's own PayPal login       |                                    | nothing in Phases A–D needs the boss     |
  | D3 | Live site interim = sandbox keys | CHECKOUT_SKIP_PAYMENT=1 as the     | Only sandbox-on-Production exercises the |
  |    | on Vercel Production (Phase C),  | long-term interim                  | real routes and gives the webhook a      |
  |    | with SKIP_PAYMENT=1 for the few  |                                    | public URL; SKIP is a 10-minute stopgap  |
  |    | days until a sandbox app exists  |                                    | to remove the fake card form (§4.0)      |
  | D4 | Sandbox webhook = two webhooks:  | ngrok stable domain; Vercel        | ngrok needs an account; previews sit     |
  |    | cloudflared quick tunnel for     | Preview URL + bypass secret        | behind Vercel SSO on Hobby and the bypass|
  |    | local, https://eldreve.com for   |                                    | secret would sit in PayPal's UI in clear |
  |    | the deployed sandbox             |                                    | text (§3.1)                              |
  | D5 | JS SDK v5 (`/sdk/js`) with       | SDK v6 (web-sdk/v6); the           | Wallet already loads v5; one script does |
  |    | components=buttons,card-fields,  | @paypal/react-paypal-js package    | both; v5 CardFields needs NO client      |
  |    | plain script loader              |                                    | token; v5 "remains supported" (§5.1)     |
  | D6 | 3-D Secure = SCA_WHEN_REQUIRED   | SCA_ALWAYS                         | PayPal's default; US buyers rarely see a |
  |    | at launch                        |                                    | challenge; flip to SCA_ALWAYS if fraud   |
  |    |                                  |                                    | chargebacks appear (§5.3, §7.2)          |
  | D7 | Migration 0015 adds exactly      | Also columns for liability shift,  | Those live in orders.raw already (the    |
  |    | payment_method_kind, card_brand, | processor codes                    | capture JSON is stored); add columns     |
  |    | card_last4 (+ checkouts.status   |                                    | when a screen needs them (§5.2)          |
  |    | 'rejected' — SQL constraint AND  |                                    |                                          |
  |    | the CheckoutRow.status union in  |                                    |                                          |
  |    | lib/supabase/types.ts)           |                                    |                                          |
  | D8 | Amount drift → refund + reject   | Keep console.error and record the  | Hobby log retention is 1 hour; a paid    |
  |    | (hard stop)                      | order anyway (today's behaviour)   | order for the wrong amount is silent     |
  |    |                                  |                                    | data loss (§5.3)                         |
  | D9 | Pre-capture 3DS check via GET    | Capture, then refund on failure    | A refund does not return PayPal's fees;  |
  |    | /v2/checkout/orders/{id}         |                                    | checking before capture costs nothing    |
  | D10| Subscribe an explicit event list | "All events" (*)                   | Unhandled events still cost retries and  |
  |    | (Appendix B)                     |                                    | clutter the delivery log                 |
  | D11| Declined card = buyer clicks Pay | Retry the same PayPal order        | CardFields has no actions.restart(); a   |
  |    | again → a NEW PayPal order       |                                    | new order per attempt is the documented  |
  |    |                                  |                                    | path (§5.1)                              |
  | D12| Redeploy from the Vercel         | `vercel --prod` from the laptop;   | Local deploy ships local files, not main;|
  |    | dashboard "Redeploy" with "Use   | `vercel redeploy <url>` as the     | `vercel redeploy` has no build-cache     |
  |    | existing Build Cache" UNTICKED   | everyday path                      | switch (CLI 59.1.4) — dashboard only,    |
  |    |                                  |                                    | CLI only if the dashboard is down (§4.3) |
  | D13| Sandbox orders in the hosted DB: | Delete them                        | Orders are never hard-deleted (house     |
  |    | cancel + restock, tag `sandbox`, |                                    | rule); cancel returns the stock, archive |
  |    | archive — before go-live         |                                    | hides them (A9, §6.1)                    |
  | D14| Launch wallet + cards only if    | Delay launch until ACDC approved   | isEligible() hides the card form on its  |
  |    | ACDC is approved; otherwise      |                                    | own; wallet revenue starts sooner        |
  |    | wallet-only, cards follow        |                                    |                                          |
  | D15| Chargeback Protection add-on     | Buy it at launch                   | +0.7% (HK) / +0.40% (AU, US) on every    |
  |    | (HK 0.7%, AU/US 0.40% per card   |                                    | card sale for a store with no chargeback |
  |    | sale) NOT at launch              |                                    | history; revisit after 90 days of card   |
  |    |                                  |                                    | volume (§7.2, §7.3)                      |
  | D16| Stay on Vercel Hobby at launch;  | Vercel Pro ($20/seat/mo) for 1-day | Pro buys 23 more hours of logs, not a    |
  |    | live tail (`vercel logs          | log retention; a Log Drain         | record; the order timeline is permanent  |
  |    | --follow`) during every          |                                    | and free; revisit Pro when order volume  |
  |    | acceptance purchase; Phase D     |                                    | makes tailing impractical (§7.5)         |
  |    | writes every payment anomaly     |                                    |                                          |
  |    | (drift, reject, pending, dispute)|                                    |                                          |
  |    | into order_events so the DB, not |                                    |                                          |
  |    | Vercel, is the record            |                                    |                                          |
  | D17| Re-price and PATCH the PayPal    | Capture, then refund on amount     | A refund returns no fees and the buyer   |
  |    | order BEFORE capture, using the  | drift or an unserved country       | sees a misleading "prices changed";      |
  |    | ship-to country from the D9 GET  | (today's code re-prices AFTER      | capture-then-refund is the fallback      |
  |    |                                  | capture)                           | (D8), not the design (§5.3)              |
  +----+----------------------------------+------------------------------------+------------------------------------------+
```

---

## 1. People and accounts

```text
  WHO OWNS WHAT
  +---------------------------+---------------------------------+------------------------------------------------+
  | Thing                     | Owner / login                   | Notes                                          |
  +---------------------------+---------------------------------+------------------------------------------------+
  | LIVE PayPal Business      | The boss's existing PayPal      | Receives every dollar; the live REST app, live |
  | account                   | Business account (country: ask  | webhook, live client id + secret all live HERE.|
  |                           | him before Phase C — §1.1)      | HK / AU / US: identical procedure              |
  | Developer Dashboard       | Any PayPal login                | developer.paypal.com/dashboard — Sandbox for   |
  | (developer.paypal.com)    | (Charles's own for sandbox;     | anyone; Live only for the business account you |
  |                           | the boss's, via invite, for     | are "acting as"                                |
  |                           | live)                           |                                                |
  | Sandbox accounts          | Auto-created per developer      | Fake money; log in at www.sandbox.paypal.com   |
  |                           | login                           |                                                |
  | Vercel env vars           | Charles (CLI user `vancechi`)   | PAYPAL_ENV, PAYPAL_CLIENT_ID, PAYPAL_SECRET,   |
  |                           |                                 | PAYPAL_WEBHOOK_ID, NEXT_PUBLIC_PAYPAL_CLIENT_ID|
  | Hosted Supabase (orders)  | Charles (SUPABASE_DB_PASSWORD   | Sandbox test orders land here too (A9)         |
  |                           | in .env.local)                  |                                                |
  +---------------------------+---------------------------------+------------------------------------------------+
```

### 1.1 The boss's business account (receives money; live is owner-only)

- Which account: the boss's **existing** PayPal Business account. Before Phase C, ask him
  which country it is registered in — it is printed under `[PayPal business account]`
  *Account Settings → Business information → Address* (menu names vary by region — if it is
  not there, the country is also shown on the account's Profile page; ask the boss to read
  it aloud). That country decides which column of
  the §7.3 fee table and which legal-hub links apply; the procedure in this guide is
  identical for HK, AU and US.
- PayPal's rule: any PayPal login opens the Developer Dashboard and gets sandbox for free,
  but "You'll need a PayPal Business account to go live with integrations."
  <https://developer.paypal.com/api/rest/>
- Live credentials belong to **whichever PayPal account is logged in when the Live app is
  created**. A live app created under Charles's personal login would pay Charles. So the
  live app is created while acting as the boss's business account — check the account name
  in the dashboard header before clicking *Create App* under *Live*.
  (Inference from <https://www.paypal.com/us/cshelp/article/how-do-i-create-paypal-rest-api-credentials-ts1949>
  and <https://www.paypal.com/us/cshelp/article/what-is-a-paypal-developer-account-help1205>;
  PayPal has no single sentence stating it.)
- The account must be **Verified** (email confirmed + bank account confirmed via a small test
  deposit) before live payments flow freely. HK user agreement:
  <https://www.paypal.com/hk/legalhub/paypal/useragreement-full>; AU confirm-bank steps:
  <https://www.paypal.com/au/cshelp/article/how-do-i-confirm-my-bank-account-with-paypal-help185>.
- Per project rule, **only the boss flips live money on** (SUMMARY.md "Hard gates"). Charles
  prepares everything; the boss performs §6 with him.

### 1.2 How Charles gets sandbox access on his own (D2 — do this today)

1. `[browser]` If Charles has no PayPal account, create a personal one at
   <https://www.paypal.com/au/> — country **Australia**, your real Sydney address. It is the
   dashboard login today AND the buyer for the live acceptance purchase in §6.2, and PayPal
   never lets you change the country later. Link your real debit/credit card now and complete
   the card confirmation (PayPal may charge and refund a small amount; allow a few days) —
   otherwise the wallet test on launch day cannot be paid (§6.1 P11).
2. `[browser]` Go to <https://developer.paypal.com/dashboard/> → *Log in to Dashboard* with
   that login. PayPal auto-creates one sandbox **Business** (`sb-…@business.example.com`)
   and one sandbox **Personal** (`sb-…@personal.example.com`) account with generated
   passwords. <https://developer.paypal.com/tools/sandbox/accounts/>
3. Everything in Phases A, B, C and D runs on these. No boss involvement.

> **Why (industry practice).** Developers never test against the money account. A separate
> sandbox identity means a mistake in testing cannot touch the business's funds or its
> compliance status — and it means the developer can start before the business is ready.

### 1.3 How Charles gets LIVE credentials without the boss sharing a password (D1)

**Primary path — the boss adds Charles as a "Developer" user.**
`[PayPal business account]` (the boss, at www.paypal.com, not the developer site):
*Account Settings → Users → Add User → select **Developer** → enter Charles's email →
**Invite**.* PayPal emails Charles; the invitation **expires after 30 days** (resendable). Charles
accepts; afterwards, in the Developer Dashboard he opens his **profile menu → Switch Account
→ Shared accounts** and picks the boss's business account — the header then names that
account, which is the check §1.1 asks for before creating the Live app.
Revoke: the boss deletes the user on the Users page.
<https://www.paypal.com/us/cshelp/article/what-is-a-paypal-developer-account-help1205>

The generic secondary-user flow (*Account Settings → Manage users → Add user → privileges*)
also exists — up to 200 users with their own login and privilege set:
<https://www.paypal.com/us/cshelp/article/how-do-i-manage-users-on-my-business-account-help274>.
The generic Manage-users flow lists **no API privilege** (help274 names only: edit profile,
view balance, contact Customer Service, send/receive money, reporting-only, Transaction
History, Settlement Report — checked 2026-09-05); API and dashboard access is granted only
through the Developer invite (help1205), so use the primary path. If the boss's Add-user
screen shows an API-related privilege anyway, still prefer the Developer invite — it is the
documented, revocable one.

**Fallback path — if the invite flow is unavailable for the boss's account type/region.**
The boss creates the Live app himself during a screen-share (§6.1 step 2), pastes the
client id and secret into a **shared password-manager item** (1Password/Bitwarden shared
vault — never chat, never email), and Charles copies them into Vercel. The boss's PayPal
password is never typed where Charles can see it.

⚠️ Whatever path is used, the boss keeps two-factor authentication on the primary login.
PayPal's security guidelines: keep the secret server-side, store it in env vars/vaults,
rotate regularly, remove unused credentials.
<https://developer.paypal.com/security-guidelines>

### 1.4 Business information that is still missing (AI-033)

`agent-delivery/INBOX.md` row **AI-033**: the legal entity name is known ("Zhongshu
Technology Worldwide Limited", `lib/supabase/seed-data.ts`), but the **business registration
number** and **registered postal address** are blank. PayPal asks for them at two points:

```text
  +-----------------------------------------------+-------------------------------------------------------------+
  | Where PayPal asks                             | What it wants                                               |
  +-----------------------------------------------+-------------------------------------------------------------+
  | Business account sign-up (HK)                 | full legal name, email, password, business registration     |
  | https://www.paypal.com/hk/business/           | number, business description, business bank account whose   |
  | getting-started                               | name matches the PayPal account name                        |
  | Advanced Credit and Debit Card Payments       | a short business questionnaire (PayPal does not publish the |
  | request (§5.0, live) — the boss accepts the   | fields — have the registration number, registered address,  |
  | Online Card Payment Services Agreement        | website URL and a one-line description of goods ready)      |
  |                                               | https://www.paypal.com/hk/legalhub/paypal/pocpsa-full       |
  | Later, at volume                              | identity documents (ID/passport, BR certificate)            |
  +-----------------------------------------------+-------------------------------------------------------------+
```

The same two facts belong in `/admin` store settings so the legal footer and the privacy
policy (which must carry the PayPal disclosure paragraph, §5.1) are complete before §6.

---

## 2. Phase A — Sandbox on the Mac (no code change)

Goal: one fake purchase from `http://localhost:3000/checkout`, visible in `/admin` as a
paid order, refunded from `/admin`, visible in the sandbox business account. Nothing in this
phase can move real money.

Prerequisites: §1.2 done; the main repo checkout
`/Users/charles/Developer/goldrose-storefront` with its `.env.local` (git worktrees have no
`.env.local`; symlink it from the main repo if you work in one).

### A1 — Create the sandbox REST app

`[PayPal Developer Dashboard]` <https://developer.paypal.com/dashboard/applications/sandbox>

1. Toggle **Sandbox** (top right). A banner names the mode you are in.
2. *Apps & Credentials → Create App* (upper right).
3. **App Name** `eldreve-sandbox`; type **Merchant**; **Sandbox business account** = the
   default `sb-…@business.example.com`. → *Create App*.
4. The app page shows **Client ID** and **Secret** (click *Show*). Copy both into your
   password manager as "PayPal sandbox app".
   <https://www.paypal.com/us/cshelp/article/how-do-i-create-paypal-rest-api-credentials-ts1949>
5. Still on the app page: *Features → Accept payments* — confirm the checkbox **Advanced
   Credit and Debit Card Payments** (some pages now say *Expanded*) is ticked; tick it and
   *Save Changes* if not. Sandbox business accounts created from the Developer Dashboard
   have it on by default; ones created at sandbox.paypal.com may not.
   <https://developer.paypal.com/docs/checkout/advanced/integrate/>

> **Why (industry practice).** The client id is public (it ships in every visitor's HTML);
> the secret is what lets a server act as the account. Treat the pair like a username and a
> password, and store them in the password manager the moment they appear — dashboards hide
> secrets after the first view in many vendors.

### A2 — Sandbox test accounts

`[PayPal Developer Dashboard]` <https://developer.paypal.com/dashboard/accounts>
(*Testing Tools → Sandbox Accounts*)

- The default **Personal** account is **NOT** your buyer unless your developer login is US —
  PayPal creates it in your own country (AU per §1.2), and the capture route re-prices by the
  buyer's PayPal address (§5.3), so an AU buyer lands in a different shipping zone and the
  purchase is refused or re-priced. Create the US buyer below and use it everywhere. (⋯ →
  *View/Edit Account* → **Profile** tab shows any account's email and lets you *Change
  password*.)
- Create a realistic **US** buyer: *Create Account → click **Create Custom Account** in the
  dialog → Account type Personal → Country United States → Email = an inbox YOU control
  (e.g. `charles+paypalsandbox@…`) → set a password you can type → (optional) a starting
  balance and a card → Create*. The one-click *Create Account* path only lets you pick type
  and country and assigns a generated `sb-…@personal.example.com` address, which will bounce
  (A7). Country is fixed at creation; our customers are US, and the SDK/eligibility behaves
  per country. Using a real inbox means the order-confirmation e-mail lands somewhere you
  can read it (A7) instead of bouncing off `@personal.example.com` — every hard bounce
  through Resend counts against eldreve.com's sending reputation.
- Log in as the buyer at <https://www.sandbox.paypal.com/signin> in a **private browser
  window** (a real paypal.com session in the same window causes login loops, §8).
  <https://developer.paypal.com/tools/sandbox/accounts/>

### A3 — Test cards

`[PayPal Developer Dashboard]` <https://developer.paypal.com/dashboard/creditCardGenerator>
(*Testing Tools → Credit Card Generator*): choose brand + country → *Generate*. Any future
expiry, any 3-digit CVV (4 for Amex). Static numbers that always work in sandbox:
Visa `4005519200000004`, Mastercard `2223000048400011`, Amex `371449635398431`.
<https://developer.paypal.com/tools/sandbox/card-testing/>
In Phase A these are only needed if the sandbox buyer wallet has no funding; they matter in
Phase D.

### A4 — Fill `.env.local`

`[Mac terminal]` Edit `/Users/charles/Developer/goldrose-storefront/.env.local` — it is a
dotfile (hidden in Finder), so open it from the terminal:
`code /Users/charles/Developer/goldrose-storefront/.env.local` (VS Code) or
`nano /Users/charles/Developer/goldrose-storefront/.env.local` (Ctrl-O, Enter, Ctrl-X to
save). Never TextEdit — it rewrites quotes. Keep the Supabase, Resend and Figma lines as
they are. Quote any value that contains a space or `<` `>`, e.g.
`RESEND_FROM="ELDREVE <orders@…>"` — Next.js reads quoted values fine, and it keeps the file
readable by the envget block (Conventions). Add / change:

```bash
# --- PayPal sandbox (Phase A) ---
PAYPAL_ENV=sandbox
PAYPAL_CLIENT_ID=<SANDBOX_CLIENT_ID>
PAYPAL_SECRET=<SANDBOX_SECRET>
NEXT_PUBLIC_PAYPAL_CLIENT_ID=<SANDBOX_CLIENT_ID>     # SAME value as PAYPAL_CLIENT_ID
# PAYPAL_WEBHOOK_ID=                                 # Phase B
# CHECKOUT_SKIP_PAYMENT=1                            # comment OUT — it overrides PayPal even with keys set
```

Why both client-id variables: `app/checkout/page.tsx:46-51` mounts the PayPal buttons only
when **both** `PAYPAL_CLIENT_ID` and `NEXT_PUBLIC_PAYPAL_CLIENT_ID` are set and skip-payment
is off. Server-only pair without the `NEXT_PUBLIC_` one = the mock form shows *and*
`/api/checkout` refuses with "Mock checkout is disabled — PayPal is configured." — a dead
checkout. `PAYPAL_ENV` is read as the exact string `live` → live, anything else → sandbox
(`lib/paypal/client.ts:28`).

### A5 — Start the dev server

```bash
# [Mac terminal]
cd /Users/charles/Developer/goldrose-storefront
npm run dev
```

`npm run dev` first runs `scripts/require-hosted-dev.mjs` (the `predev` hook). If it stops
with a message about Supabase keys, your `.env.local` lost the `NEXT_PUBLIC_SUPABASE_*`
lines while you edited it — restore them and run again. If the server starts, the check
passed. Open `http://localhost:3000/admin` → the top banner reads **"PayPal sandbox mode —
payments use sandbox money, nothing real is charged."** and *Settings* shows **"PayPal
sandbox connected"** with the last six characters of the client id
(`app/admin/(dashboard)/settings/page.tsx:29-38`).

What each of those proves — and does not:

- The banner reads only `PAYPAL_CLIENT_ID` and `PAYPAL_ENV` (`app/admin/(dashboard)/layout.tsx:16-21`).
  A banner reading **"Test mode — checkout is simulated locally and no payment provider is
  connected."** (`banner.mock`, lib/admin/i18n.ts:52-53) means `PAYPAL_CLIENT_ID` is missing.
- *Settings* "PayPal sandbox connected" additionally proves `PAYPAL_SECRET`
  (`getPayPalConfig().configured` needs both, `settings/page.tsx:29-35`).
- **Neither checks `NEXT_PUBLIC_PAYPAL_CLIENT_ID`** — the "dead checkout" variable from A4.
  It is proven only by the yellow button in A6: if `/checkout` still shows the mock card
  wells while the banner says sandbox, that variable is the missing one, or you did not
  restart `npm run dev` after editing `.env.local`.

### A6 — Buy something

`[browser]` `http://localhost:3000/shop` → add a product → `/checkout`. The payment card
now says "Card and bank details are collected in PayPal's own window." and the pay bar is
the yellow **PayPal** SDK button (`CheckoutClient.tsx:2376-2385`).

1. Click the PayPal button → popup → sign in with the **US sandbox buyer** from A2
   (its email/password).
2. Approve. The popup closes; the browser calls `/api/paypal/capture`; you land on
   `/checkout/success?…&method=paypal&mock=0`.

What happened on the wire is traced in
[docs/learning/06-paypal-payment-and-recovery.md](../learning/06-paypal-payment-and-recovery.md).

### A7 — Check the three places

```text
  +--------------------------------+-------------------------------------------------------------------------+
  | Where                          | Expect                                                                  |
  +--------------------------------+-------------------------------------------------------------------------+
  | [/admin] Orders                | New order, badge **Online store** (not **Test**; source column = 'site',|
  |                                | lib/admin/i18n.ts:442-443; 在线商店 / 测试 in 中文), Payment card:      |
  |                                | financial status paid; "Capture reference: <id> (paypal)"; Seller       |
  |                                | protection line; Timeline: "Payment of $x captured via paypal";         |
  |                                | Customer created/linked                                                 |
  | [/admin] Products → variant    | Inventory movement with reason 'order' (inventory_movements.reason,     |
  |                                | lib/orders/db.ts:229-238) for the quantity bought                       |
  | [browser] sandbox.paypal.com   | Log in as the sandbox BUSINESS account → Activity shows the payment     |
  |                                | received (fake USD, fee line shown)                                     |
  | [your inbox]                   | Order confirmation e-mail to the A2 buyer address — sent from the FIRST |
  |                                | order, through Resend whenever RESEND_API_KEY is in .env.local (it is); |
  |                                | without the legal identity in /admin the mail still goes out, just with |
  |                                | no company footer (lib/email.ts:53-64). This is why A2 insists on a real|
  |                                | inbox. If RESEND_API_KEY is unset, the same e-mail is printed in the    |
  |                                | dev-server log as `[email:console-mode] …` instead.                     |
  | [Mac terminal] dev server log  | Nothing on success except `[email:console-mode] …` lines when           |
  |                                | RESEND_API_KEY is unset — the routes log only failures ([paypal/create],|
  |                                | [paypal/capture]). Silence is the pass.                                 |
  | [PayPal Developer Dashboard]   | Sandbox → Event Logs / API Calls: the /v2/checkout/orders POST and the  |
  |                                | /capture POST with PayPal Debug IDs (what PayPal support asks for)      |
  +--------------------------------+-------------------------------------------------------------------------+
```

Retention: PayPal keeps only the last **100 calls / 15 days** in the dashboard's API-call
history (PayPal's own description of the Sandbox API call history page,
<https://developer.paypal.com/developer/dashboard/sandbox>, login required). Rule: copy the
Debug ID (and the request/response) into the order's timeline comment the same day you test —
never rely on finding it later.

### A8 — Refund from `/admin`

`[/admin]` open the order → Payment card → **Refund** → amount → confirm.
`lib/admin/orders.ts:315-326` calls PayPal's refund API with `provider_capture_id`; the
order flips to `refunded`, timeline says "Refunded $x". `[browser]` the sandbox business
account's Activity shows the refund. (Phase B adds the webhook that would *also* sync this;
without it the admin's own write is the record — fine.)

### A9 — ⚠️ Sandbox orders land in the LIVE database

`.env.local` points at the hosted Supabase project (`cfvsvgbldnzkcjvbwnjp`), the same
database eldreve.com uses. A sandbox capture writes `source='site'`,
`payment_provider='paypal'` (`capture/route.ts:86-92`) — **indistinguishable from a real
order in the admin list**. Two consequences:

1. Stock was decremented by a fake sale. Cancel-with-restock returns it.
2. After the live flip, refunding one of these from `/admin` would send a *sandbox* capture
   id to the *live* API and fail (`lib/admin/orders.ts` → `refundPayPalCapture`).

Rule: until the §6.2 redeploy, **EVERY** order with `payment_provider = 'paypal'` is a
sandbox order — no live PayPal order can exist yet. Do not filter by e-mail (your A2 buyer
uses a real inbox, so an e-mail filter would miss exactly the orders this guide makes you
create). List them all:

```bash
# [Mac terminal] — read-only listing (after the envget block from Conventions)
PGPASSWORD="$SUPABASE_DB_PASSWORD" psql "postgresql://postgres.cfvsvgbldnzkcjvbwnjp@aws-1-us-west-2.pooler.supabase.com:5432/postgres" \
  -c "select name, email, provider_order_id, financial_status, cancelled_at, archived_at, placed_at
      from orders
      where payment_provider = 'paypal'
      order by placed_at desc;"
```

After go-live, write the §6.2 redeploy time next to the `sandbox` tag rule in
`docs/features/paypal-wallet.md`: any paypal order with `placed_at` before that timestamp is
sandbox. (`@personal.example.com` e-mails and `sandbox.paypal.com` links in `raw` are only a
secondary hint, §7.8.)

Clean-up rule (D13), done in `/admin` **while still in sandbox mode** so the refund call hits
the sandbox API: *Cancel* each order with **refund + restock** ticked → tag it `sandbox` →
*Archive*. Orders are never hard-deleted (house rule; the schema has no delete path). Doing
this before §6 is a checklist item there. Accepting them as pre-launch test data is also fine
*until* that point — the SUMMARY already says all orders are test data until the gates clear.

---

## 3. Phase B — Webhooks in sandbox

Goal: PayPal can reach `/api/webhooks/paypal`, a real sandbox purchase produces a verified
event (HTTP 200 in PayPal's log), and the repair path rebuilds an order whose browser "died".

Refresher — the route (`app/api/webhooks/paypal/route.ts`): read raw body → ask PayPal's
`verify-webhook-signature` API whether the delivery is genuine, using `PAYPAL_WEBHOOK_ID` →
401 if not → hand the event to `lib/paypal/webhook.ts` → 200 with `{"outcome": …}`.
`verifyWebhookSignature` returns `false` when `PAYPAL_WEBHOOK_ID` is empty
(`lib/paypal/client.ts:242-244`), so an unset id means **every** delivery is 401 — by design.

### 3.1 Get a public HTTPS URL (two ways, D4)

PayPal delivers to a public HTTPS endpoint that "listens on HTTPS port 443"
(<https://developer.paypal.com/api/rest/webhooks/rest/>; retries and the 10-URLs-per-app
limit are on <https://developer.paypal.com/api/rest/webhooks/>). `localhost` is not
reachable from PayPal, so:

```text
  +------------------------------+-----------------------------------------+----------------------------------------+
  | Option                       | Use it for                              | Gotchas                                |
  +------------------------------+-----------------------------------------+----------------------------------------+
  | cloudflared quick tunnel     | Local iteration on the handler          | URL is random and changes EVERY run →  |
  | (no account, free)           | (Phase B, Phase D stage 4)              | re-edit the webhook URL each session;  |
  |                              |                                         | max 200 in-flight requests; no SLA     |
  | https://eldreve.com          | The long-lived sandbox webhook once     | Only verifies while Production runs    |
  | (Phase C onward)             | Production runs sandbox keys            | sandbox keys + the sandbox webhook id  |
  | ngrok (rejected, D4)         | —                                       | account + authtoken; free tier 20k     |
  |                              |                                         | req/month; one stable dev domain       |
  | Vercel Preview URL (rejected)| —                                       | 302/401 from Vercel SSO on Hobby unless|
  |                              |                                         | ?x-vercel-protection-bypass=<secret>   |
  +------------------------------+-----------------------------------------+----------------------------------------+
```

Sources: quick tunnels <https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/>;
ngrok <https://ngrok.com/docs/share-localhost/quickstart>, <https://ngrok.com/pricing>;
Vercel Deployment Protection <https://vercel.com/docs/deployment-protection>,
bypass <https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation>.

```bash
# [Mac terminal] — one-time install (not on this Mac yet, checked 2026-09-05)
brew install cloudflared
# https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

# [Mac terminal, second tab] — while `npm run dev` runs in the first tab
cloudflared tunnel --url http://localhost:3000 --loglevel debug
# prints:  https://<random-words>.trycloudflare.com   ← copy this
# --loglevel debug makes cloudflared print each forwarded request (URL, method, headers);
# at the default `info` level it prints NOTHING per request — the per-request line you read
# in §3.3–3.5 is the Next.js dev server's own `POST /api/webhooks/paypal 401 in 120ms` in the
# `npm run dev` tab. https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/configure-tunnels/run-parameters/
```

### 3.2 Create the sandbox webhook

`[PayPal Developer Dashboard]` Sandbox → *Apps & Credentials → REST API apps → eldreve-sandbox
→ Webhooks → Add Webhook*.

- **Webhook URL**: `https://<random-words>.trycloudflare.com/api/webhooks/paypal`
- **Event types**: tick exactly the list in **Appendix B** (the two the code handles today
  plus the ones Phase D adds; ticking them now means the Phase D fixtures can be recorded
  from real deliveries). Up to 10 webhook URLs per app.
- *Save*. The list now shows a **Webhook ID** — that string is `PAYPAL_WEBHOOK_ID`.
  <https://www.paypal.com/us/cshelp/article/what-are-webhooks-and-how-do-i-subscribe--ts2306>
  <https://developer.paypal.com/api/rest/webhooks/rest/>

```bash
# [Mac terminal] .env.local
PAYPAL_WEBHOOK_ID=<SANDBOX_WEBHOOK_ID_FOR_TUNNEL>
```

Restart `npm run dev` (env is read at start).

⚠️ Sandbox and Live are different apps with different webhooks and **different Webhook
IDs**. `PAYPAL_WEBHOOK_ID` is therefore per environment (Appendix A).

Next session, when `cloudflared` prints a new URL: `[PayPal Developer Dashboard]` Sandbox →
app → *Webhooks* → pencil icon on the tunnel webhook → replace the host part of the URL →
*Save*. The **Webhook ID is unchanged** — PayPal updates a webhook in place
(`PATCH /v1/notifications/webhooks/{webhook_id}`,
<https://developer.paypal.com/api/rest/webhooks/rest/>), so `.env.local` needs no edit.

### 3.3 Test with the simulator — it proves reachability only

`[PayPal Developer Dashboard]` <https://developer.paypal.com/dashboard/webhooksSimulator/>:
paste the FULL webhook URL `https://<random-words>.trycloudflare.com/api/webhooks/paypal`
(host alone would POST to `/` and the expected line never appears), pick
`PAYMENT.CAPTURE.COMPLETED`, *Send Test*.

Expected: the `npm run dev` tab logs `POST /api/webhooks/paypal 401 in …ms` (the Next.js dev
server prints one line per request; cloudflared prints nothing per request unless started
with `--loglevel debug`, §3.1) and our route answers **401 `{"error":"Invalid signature"}`**.
That is correct. PayPal documents that simulator events
"cannot be verified by posting back to the PayPal verify-webhook-signature endpoint", are not
tied to any app and do not appear in the event dashboard.
<https://developer.paypal.com/api/rest/webhooks/simulator/>
Use the simulator only to see that PayPal's POST arrives at all.

### 3.4 Test with a real sandbox purchase

Repeat A6. Within seconds the `npm run dev` tab shows a second `POST /api/webhooks/paypal`,
this time answered **200** with `{"outcome":"duplicate"}` — normal: the capture route already wrote the order, so the
webhook found it paid (`lib/paypal/webhook.ts:93-107`).

`[PayPal Developer Dashboard]` <https://developer.paypal.com/dashboard/webhooks/sandbox>
(*Webhooks Events*): select the app; the `PAYMENT.CAPTURE.COMPLETED` row shows a green tick
(delivered). Click it for the request/response. A yellow `!` means pending retry; after 25
attempts over 3 days it becomes Failed and stays resendable by hand.
<https://developer.paypal.com/api/rest/webhooks/events-dashboard>
<https://developer.paypal.com/api/rest/webhooks/>

Then refund it from `/admin` (A8) and watch `PAYMENT.CAPTURE.REFUNDED` arrive →
`{"outcome":"refund_synced"}` and a second timeline line "PayPal refund <id> — $x (status
synced by webhook)".

### 3.5 Deliberately test the repair path

The repair path (`lib/paypal/webhook.ts:110-144`) covers "money moved, but our capture route
never finished writing the order" (buyer's browser died, server crashed after capture). To
reproduce it deterministically, make the capture happen **outside** our route:

1. `[browser, Chrome]` on `/checkout` press F12 → ⋮ (top-right of DevTools) → *More tools →
   Network request blocking* → tick **Enable network request blocking** → *+ Add pattern* →
   `*/api/paypal/capture*` → Enter. Leave DevTools open while you pay.
2. Click PayPal, approve in the popup. `onApprove` tries `/api/paypal/capture`, the browser
   blocks it, and the page shows a network error (Chrome: **"Failed to fetch"** — the blocked
   fetch rejects before our own "Could not capture payment." fallback at
   `CheckoutClient.tsx:641-642` can run). PayPal's order is now APPROVED, **not captured**;
   a `checkouts` row exists with its `provider_order_id`; no order exists.
3. Find the PayPal order id: DevTools *Network* → the blocked request's payload
   (`{"orderID":"…"}`), or:
   ```bash
   # [Mac terminal] — after the envget block from Conventions
   PGPASSWORD="$SUPABASE_DB_PASSWORD" psql "postgresql://postgres.cfvsvgbldnzkcjvbwnjp@aws-1-us-west-2.pooler.supabase.com:5432/postgres" \
     -c "select provider_order_id, total_cents, created_at from checkouts where status='open' order by created_at desc limit 1;"
   ```
4. Capture it by hand against the sandbox API (this is what "the server died after capture"
   looks like to PayPal):
   ```bash
   # [Mac terminal] — sandbox only; never run this shape against api-m.paypal.com by hand.
   # $PAYPAL_CLIENT_ID / $PAYPAL_SECRET come from the envget block (Conventions) — never paste them.
   TOKEN=$(curl -s -u "$PAYPAL_CLIENT_ID:$PAYPAL_SECRET" \
     -d grant_type=client_credentials https://api-m.sandbox.paypal.com/v1/oauth2/token | jq -r .access_token)
   curl -s -X POST "https://api-m.sandbox.paypal.com/v2/checkout/orders/<PAYPAL_ORDER_ID>/capture" \
     -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
     -H "PayPal-Request-Id: repair-test-<PAYPAL_ORDER_ID>" -d '{}' | jq .status
   # → "COMPLETED"
   ```
5. Within seconds the `npm run dev` tab shows `POST /api/webhooks/paypal 200` — that is the
   `PAYMENT.CAPTURE.COMPLETED` delivery, answered **200 `{"outcome":"repaired"}`** (the body is
   visible in PayPal's Webhooks Events row, §3.4).
6. `[/admin]` a new order exists, paid, with the timeline line **"Order repaired from PayPal
   webhook (capture completed)"**, no `auth_user_id` (no buyer session), stock decremented.
7. Remove the DevTools block. Refund the order from `/admin`.

> **Why (industry practice).** A payment is a distributed transaction across two companies.
> You test the *failure* between them on purpose, in the sandbox, because in production it
> happens at 3 a.m. with a real customer's money.

### 3.6 Handler speed and idempotency

PayPal retries any non-2xx up to 25 times over 3 days. Our handler answers fast and is
idempotent (redeliveries → `duplicate`), so retries are harmless. If the tunnel is down,
PayPal keeps retrying and the dashboard shows pending → that is why the long-lived sandbox
webhook moves to `eldreve.com` in Phase C.

---

## 4. Phase C — Sandbox on Vercel (the safest interim for the live site)

Goal: `https://eldreve.com/checkout` shows the **sandbox** PayPal button instead of the mock
card form; the real routes run on the real deployment; PayPal's sandbox webhook reaches a
stable public URL.

The four configurations the checkout can be in (`app/checkout/page.tsx:45-51`,
`CheckoutClient.tsx:997`):

```text
  +-----+------------------------------------+-------------------------------------------------------+
  | Cfg | Vercel Production env              | What a visitor sees                                   |
  +-----+------------------------------------+-------------------------------------------------------+
  | (a) | today: no PAYPAL_*, no SKIP flag   | MOCK card form — Luhn-checked fake card wells with    |
  |     |                                    | autoComplete="cc-number" (browsers offer REAL saved   |
  |     |                                    | cards), PAN POSTed to /api/checkout, then discarded;  |
  |     |                                    | anyone can create "paid" orders with 4242 4242 …      |
  | (b) | CHECKOUT_SKIP_PAYMENT=1            | "Test order" — no card wells, one PLACE ORDER button, |
  |     |                                    | order recorded with test badge, no money              |
  | (c) | PAYPAL_ENV=sandbox + 4 keys        | Sandbox PayPal button; strangers see a sandbox login   |
  |     |                                    | they cannot pass; no real money can move              |
  | (d) | PAYPAL_ENV=live + 4 live keys      | Live PayPal (+ card fields once built/approved) ⚠️    |
  +-----+------------------------------------+-------------------------------------------------------+
```

### 4.0 ⚠️ Do (b) TODAY — ten minutes, no PayPal account needed

The mock form is a real-looking card form on a real brand domain. Even though the code
discards the number (`app/api/checkout/route.ts:164-175` passes no card data to
`createOrder`, so `raw` defaults to null in `lib/orders/db.ts:209`; nothing is logged), the
*transmission* of a real PAN to a non-PCI server and the *habit* it trains in customers are
the problem — "your site asked for my card" is how a chargeback conversation starts.
Config (b) has every exposure of (a) *minus* the card form, so it is strictly safer.

```bash
# [Mac terminal] — from the MAIN repo dir (the worktree is not linked to Vercel)
cd /Users/charles/Developer/goldrose-storefront
vercel whoami                                    # expect vancechi
echo 1 | vercel env add CHECKOUT_SKIP_PAYMENT production --no-sensitive
```

Then **redeploy** (§4.3) — env changes never reach an existing deployment
(<https://vercel.com/docs/environment-variables/managing-environment-variables>). The build
log prints `[env] ⚠ CHECKOUT_SKIP_PAYMENT is ON …` + `This is a Vercel PRODUCTION build`
(`scripts/validate-env.mjs:73-84`) — expected. ⚠️ Free "paid" test orders remain possible in
(b); admins must not ship a **Test**-badged (source `'mock'`) order.

### 4.1 Create the eldreve.com sandbox webhook (before the variables — you need its ID)

In practice PayPal accepts a webhook URL without calling it at save time (observed; not
documented at <https://developer.paypal.com/api/rest/webhooks/rest/>), so create it now,
before the deployment can answer — you need its Webhook ID in the next step. If the
dashboard ever rejects an unreachable URL, do §4.2–4.3 first and come back. Signature verification on
eldreve.com only starts passing once the redeploy in §4.3 is Ready — at that point
Production runs sandbox keys, so the route calls the **sandbox** verify endpoint
(`lib/paypal/client.ts:28-37`) and a sandbox webhook there verifies. Production domains are
public on Hobby ("your production domain remains publicly accessible",
<https://vercel.com/docs/deployment-protection>), the route sits outside the admin auth
proxy matcher (`proxy.ts` matches `/admin/:path*`, `/api/admin/:path*` only), and an
unsigned POST is 401'd — measured today.

`[PayPal Developer Dashboard]` Sandbox → app → *Webhooks → Add Webhook* (a **second**
webhook — keep the tunnel one for local work):

- URL `https://eldreve.com/api/webhooks/paypal` — the custom domain, never a
  `goldrose-storefront-<hash>….vercel.app` deployment URL (those are SSO-protected → 302).
- Same event list (Appendix B). Save → copy its Webhook ID → that is
  `<SANDBOX_WEBHOOK_ID_FOR_ELDREVE>`, the value for `PAYPAL_WEBHOOK_ID` on Vercel
  **Production** (§4.2). The tunnel webhook's id stays in `.env.local`. Each webhook
  verifies only deliveries addressed to itself.

### 4.2 Add the five variables to Production (and Preview)

⚠️ **Live visitors are affected:** from this redeploy until §6, eldreve.com's checkout
shows a PayPal button that only sandbox accounts can pass (§4.5 explains why this is still
the right interim). Tell both bosses before you redeploy, and warn them that every sandbox
test purchase sends a real "new order" alert e-mail (`lib/email.ts` `new_order_alert`) —
they should ignore orders tagged `sandbox`.

`[Mac terminal]` from the main repo dir. `vercel env add` prompts for the value (not echoed
into shell history) and defaults to **Sensitive** on production/preview — accept that for the
secret and the webhook id; opt out for the public client ids so you can read them back later.
Have all five values open in the password manager before you start: each `vercel env add`
blocks on an interactive prompt, and Ctrl-C half-way leaves a half-set environment.
<https://vercel.com/docs/cli/env> · <https://vercel.com/docs/environment-variables/sensitive-environment-variables>

```bash
cd /Users/charles/Developer/goldrose-storefront

# Production — sandbox values (Phase C)
echo sandbox | vercel env add PAYPAL_ENV production --no-sensitive
vercel env add PAYPAL_CLIENT_ID production --no-sensitive        # paste <SANDBOX_CLIENT_ID>
vercel env add NEXT_PUBLIC_PAYPAL_CLIENT_ID production --no-sensitive   # paste the SAME <SANDBOX_CLIENT_ID>
vercel env add PAYPAL_SECRET production                           # paste <SANDBOX_SECRET>   (sensitive)
vercel env add PAYPAL_WEBHOOK_ID production                       # paste <SANDBOX_WEBHOOK_ID_FOR_ELDREVE> from §4.1 (NOT the tunnel id in .env.local)
vercel env rm CHECKOUT_SKIP_PAYMENT production --yes              # same edit session as adding the keys

# Preview — same sandbox values, so branch previews render the sandbox button too
echo sandbox | vercel env add PAYPAL_ENV preview --no-sensitive
vercel env add PAYPAL_CLIENT_ID preview --no-sensitive
vercel env add NEXT_PUBLIC_PAYPAL_CLIENT_ID preview --no-sensitive
vercel env add PAYPAL_SECRET preview
vercel env add PAYPAL_WEBHOOK_ID preview                          # any sandbox webhook id; previews cannot receive deliveries anyway

vercel env ls production                                          # names only; sensitive values never shown
```

Dashboard equivalent: `[Vercel dashboard]` Project *goldrose-storefront → Settings →
Environment Variables → Add* (Name, Value, tick Production/Preview, toggle Sensitive) → Save.

⚠️ Never put **live** values on Preview. Preview deployments are for branches; a branch
preview with live keys would capture real money from a test click.

`NEXT_PUBLIC_PAYPAL_CLIENT_ID` is inlined into the JavaScript at `next build`; server-only
variables are frozen into the deployment snapshot too. **Any PAYPAL_* change = save, then
redeploy; nothing changes until the new deployment is Ready.**
<https://nextjs.org/docs/app/guides/environment-variables#bundling-environment-variables-for-the-browser>

### 4.3 Redeploy without a code change (D12)

**Primary path** — `[Vercel dashboard]` *Deployments* → current Production deployment → ⋯ →
**Redeploy** → dialog "Redeploy to Production" → **untick "Use existing Build Cache"** →
Redeploy. <https://vercel.com/docs/deployments/managing-deployments#redeploy-a-project>

The CLI `vercel redeploy` has **no build-cache switch** (`vercel redeploy --help`, CLI
59.1.4: only `--target` and `--no-wait`), so use it only when the dashboard is unavailable,
and afterwards view-source `/checkout` to confirm the new client id was inlined:

```bash
# [Mac terminal] fallback only
vercel ls --environment production              # copy the current production URL
vercel redeploy https://<current-production-deployment>.vercel.app --target=production
# https://vercel.com/docs/cli/redeploy
```

(A pushed empty commit also redeploys, but it litters `main` — not used.) Avoid
`vercel --prod` from the laptop (deploys local files, not `main`).

### 4.4 Confirm

```bash
# [Mac terminal] — runtime probes, no secrets involved
curl -s -X POST https://eldreve.com/api/paypal/create -H 'content-type: application/json' -d '{}'
#  503 {"error":"PayPal is not configured."}   → keys did NOT reach the deployment
#  400 {"error":"Invalid request."}            → PayPal configured ✅   (create/route.ts:33-45)
curl -s -X POST https://eldreve.com/api/checkout -H 'content-type: application/json' -d '{}'
#  400 "Mock checkout is disabled — PayPal is configured."  → PayPal on AND skip off ✅ (checkout/route.ts:64-69)
curl -s -X POST https://eldreve.com/api/webhooks/paypal -H 'content-type: application/json' -d '{}'
#  401 {"error":"Invalid signature"}            → verification is closed to strangers ✅
```

`[browser]` `https://eldreve.com/checkout` with an item in the bag: the yellow PayPal
button renders, no card wells. *View source* → search `paypal.com/sdk/js?client-id=` → the
sandbox id. `[/admin]` banner "PayPal sandbox mode"; *Settings* "PayPal sandbox connected".

**Rollback (5 minutes) if anything above fails** (button missing, mock wells back, 503 from
the probe): `[Mac terminal]` from the main repo dir

```bash
echo 1 | vercel env add CHECKOUT_SKIP_PAYMENT production --no-sensitive --force
```

then redeploy with build cache OFF (§4.3). Config (b) is back: one PLACE ORDER button, no
card wells, no PayPal. Leave the five `PAYPAL_*` values in place — `page.tsx` never mounts
PayPal while the flag is set — and fix the cause with the §8 table before removing the flag
again (`vercel env rm CHECKOUT_SKIP_PAYMENT production --yes` + redeploy).

Then buy once with the sandbox buyer, and:

```bash
# [Mac terminal] — watch the deployment while you buy (Hobby keeps logs for ONE hour)
vercel logs --follow --deployment https://<current-production-deployment>.vercel.app
vercel logs --environment production --level error --since 1h --expand    # afterwards
# https://vercel.com/docs/cli/logs   ·   dashboard: Project → Logs → Route filter → Live mode
```

`[PayPal Developer Dashboard]` Webhooks Events (Sandbox) → the eldreve.com webhook's
`PAYMENT.CAPTURE.COMPLETED` shows a green tick with response `{"outcome":"duplicate"}`.

### 4.5 The trade-off, honestly

In (c) a stranger who clicks PayPal sees a **sandbox** login screen they cannot pass. They
cannot pay, and nothing tells them why. Per SUMMARY.md, until the hard gates clear the site
is test-only and no campaigns run, so this is acceptable for the days or weeks between now
and §6 — and it is the *only* configuration that exercises `/api/paypal/create`,
`/capture`, the webhook and the admin refund path on the real deployment before money is
involved. Option (b) is the second choice for a long interim because it exercises none of
that and still hands out free "paid" orders; it is the right *stopgap* (§4.0) only because
it needs no PayPal account.

> **Why (industry practice).** "Test in production, with test money" is how payment
> integrations are actually shaken down: same code, same hosting, same DNS, same TLS, only
> the credentials differ. The sandbox exists so that the first time your deployment talks to
> PayPal is not also the first time it holds a customer's money.

---

## 5. Phase D — Card fields (Advanced Checkout) build

Goal: Visa/Mastercard typed into PayPal-hosted fields on our page, captured through the same
account, recorded with brand and last four, with every card failure mode handled. Mapped to
`docs/features/card-payments.md` stages. Three corrections to that record, found by
research on 2026-09-05 (trust these over the record until it is updated, §10):

- Stage 2 names migration `0004` → it is **`0015`** (`0004` is permanently skipped,
  `scripts/check-migrations.mjs` `KNOWN_SKIPPED`).
- Stage 3 mentions "a client-token route" → **not needed**: v5 `CardFields` takes no
  `data-client-token` (that was the legacy v1 HostedFields). Do not add
  `/v1/identity/generate-token`. Sources: Checkout Studio integrate page (script tag
  `…&components=buttons,card-fields`, no `data-client-token`)
  <https://developer.paypal.com/studio/checkout/advanced/integrate>; v5 reference
  (CardFields options/methods, no client token) <https://developer.paypal.com/sdk/js/v5/reference>;
  official sample (client `index.html` has no `data-client-token`; `server.js` calls only
  `/v2/checkout/orders` and `…/capture`)
  <https://github.com/paypal-examples/docs-examples/tree/main/advanced-integration/v2>.
  ⚠️ <https://developer.paypal.com/docs/checkout/advanced/integrate/> currently shows the
  **platform-partner** variant (`merchant-id`, BN code, `data-client-token` from
  `/v1/identity/generate-token`) — ignore those three for a single-merchant integration.
- "individual card brands can need activation" → **no per-brand toggle exists**;
  Visa/Mastercard/Amex come with the capability for HK, AU and US accounts.
  <https://developer.paypal.com/docs/checkout/advanced/eligibility/>
- Also: no "Powered by PayPal" mark is required on the card form; a **disclosure sentence**
  is (§5.1). <https://developer.paypal.com/platforms/checkout/advanced>
- Deliberately NOT built here (record them as dropped in card-payments.md Plan when updating
  it, §10): record Stage 1 (`lib/payments/` provider-neutral layer — the
  `payment_provider === 'paypal'` checks stay), Stage 2's check constraint on
  `payment_provider`, and Stage 4's refund rows + `provider_order_id` index. D7 explains why
  0015 stays minimal. The sub-headings below use the record's stage numbers (Stage 3 = card
  fields, Stage 4a/4b = server/webhook hardening) so the record can be ticked line by line.

Naming: PayPal is mid-rename. "Advanced Credit and Debit Card Payments" (fee pages, most
docs, the dashboard checkbox), "Expanded Credit and Debit Card Payments" (Checkout Studio),
"Advanced/Expanded Checkout" (product line), "PayPal Online Card Payment Services" (legal
hub) are one thing. This guide says **ACDC**.

### 5.0 Stage 0 — Enablement: sandbox vs live

```text
  +----------+--------------------------------------------------------------------------------------------------+
  | Sandbox  | Already on for a Developer-Dashboard-created sandbox business account (A1 step 5 checked it).    |
  |          | https://developer.paypal.com/studio/checkout/advanced/getstarted                                 |
  | Live     | Prerequisites (do these WEEKS before launch, §6.0): §6.0 P3 (Charles added as Developer user     |
  |          | per §1.3, or the password-manager fallback agreed) and §6.0 P4 (the boss creates the live app    |
  |          | `eldreve-live`, Merchant type, while the dashboard header shows the BUSINESS account). Then, in  |
  |          | that live app:                                                                                   |
  |          | [PayPal Developer Dashboard] toggle Live → Apps & Credentials → eldreve-live → Features →        |
  |          | Accept payments → tick "Advanced Credit and Debit Card Payments" → Save Changes. This raises a   |
  |          | request: "complete production onboarding and request Advanced Credit and Debit Card Payments     |
  |          | for your business account" — a short questionnaire; the boss accepts the Online Card Payment     |
  |          | Services Agreement. Approval time is NOT documented by PayPal for ACDC (the 24–72 h on           |
  |          | /api/rest/production/ is for legacy NVP/SOAP Merchant API apps). Plan for a few business days;   |
  |          | check the request status under Features → Accept payments. Third-party platforms (Big Cartel)    |
  |          | report that a denied merchant may reapply after 90 days — unconfirmed by PayPal. START THIS      |
  |          | EARLY (it gates §6).                                                                             |
  |          | https://developer.paypal.com/docs/checkout/advanced/android/  (the onboarding sentences quoted)  |
  |          | https://developer.paypal.com/api/rest/production/                                                |
  | Runtime  | "The code checks eligibility so card fields only display when the production request is          |
  |          | successful" — cardFields.isEligible() is false on a live client id until approved; the wallet    |
  |          | button keeps working and our card form must hide itself (D14). Never fall back to the mock form. |
  +----------+--------------------------------------------------------------------------------------------------+
```

Eligibility: 37 countries and 22 currencies incl. USD; HK, AU and US accounts all qualify;
brands for HK and AU = Mastercard, Visa, American Express (US adds Discover/JCB/Diners/UnionPay, USD only).
<https://developer.paypal.com/docs/checkout/advanced/eligibility/>

### 5.1 Stage 3 — SDK script + CardFields render + our Pay button calling `submit()`

**Script tag.** Today `CheckoutClient.tsx:663` loads
`https://www.paypal.com/sdk/js?client-id=…&currency=USD&intent=capture` — no `components=`,
so only `Buttons` exists on `window.paypal`. Add `components=buttons,card-fields` (the
value PayPal's own integrate page uses:
<https://developer.paypal.com/studio/checkout/advanced/integrate>; the generic
`/sdk/js/v5/configuration` page does not list `card-fields` among its `components`
examples). The same URL serves sandbox and live; **the client id decides the environment**.
`buyer-country=US` is "only used in the sandbox. Don't pass this query parameter in
production" — we omit it. <https://developer.paypal.com/sdk/js/v5/configuration>
(also the reference for `data-page-type` and `data-csp-nonce`).

Because two components now share one script tag (`id="paypal-sdk"`), move the loader out of
`PayPalSdkButtons` into a tiny promise-returning helper both components call:

```ts
// app/checkout/paypal-sdk.ts  (new, client-only helper)
// One loader for the wallet Buttons AND the card fields. A second component that finds the
// tag already in <head> waits for it instead of adding another (the SDK refuses to load twice).

export type PayPalCardFieldsHandle = {
  isEligible: () => boolean;
  getState: () => Promise<{ isFormValid: boolean; errors: string[] }>;
  submit: (options: { billingAddress: Record<string, string | undefined> }) => Promise<void>;
  NameField: (opts?: unknown) => { render: (el: HTMLElement) => Promise<void> };
  NumberField: (opts?: unknown) => { render: (el: HTMLElement) => Promise<void> };
  ExpiryField: (opts?: unknown) => { render: (el: HTMLElement) => Promise<void> };
  CVVField: (opts?: unknown) => { render: (el: HTMLElement) => Promise<void> };
};

export type PayPalSdk = {
  Buttons: (options: unknown) => { render: (el: HTMLElement) => void };
  CardFields: (options: unknown) => PayPalCardFieldsHandle;
};

const SCRIPT_ID = "paypal-sdk";

/** Resolve with window.paypal once the v5 SDK (buttons + card-fields) is on the page. */
export function loadPayPalSdk(clientId: string): Promise<PayPalSdk> {
  return new Promise((resolve, reject) => {
    // Statements, not bare ternaries: CI lints with @typescript-eslint/no-unused-expressions.
    const ready = () => {
      const sdk = (window as unknown as { paypal?: PayPalSdk }).paypal;
      if (sdk) resolve(sdk);
      else reject(new Error("Could not load PayPal."));
    };
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if ((window as unknown as { paypal?: PayPalSdk }).paypal) ready();
      else existing.addEventListener("load", ready, { once: true });
      return;
    }
    const params = new URLSearchParams({
      "client-id": clientId,
      components: "buttons,card-fields",
      currency: "USD",
      intent: "capture",
    });
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
    script.setAttribute("data-page-type", "checkout");
    script.onload = ready;
    script.onerror = () => reject(new Error("Could not load PayPal."));
    document.head.appendChild(script);
  });
}
```

`PayPalSdkButtons` (`CheckoutClient.tsx:581-674`) then becomes
`loadPayPalSdk(clientId).then((paypal) => paypal.Buttons({...}).render(el))` — same callbacks
as today.

**Card fields component.** Verbatim API from PayPal's sample: `paypal.CardFields({createOrder,
onApprove, onError, onCancel, style, inputEvents})`, gate on `isEligible()`, render the four
fields into containers you size, then **your own** button calls `submit({billingAddress})`.
`onApprove(data)` receives `{ orderID, liabilityShift }`.
<https://developer.paypal.com/studio/checkout/advanced/integrate> ·
<https://developer.paypal.com/sdk/js/v5/reference> ·
<https://github.com/paypal-examples/docs-examples/tree/main/advanced-integration/v2> ·
<https://developer.paypal.com/docs/checkout/advanced/customize/card-fields-events/> ·
<https://developer.paypal.com/docs/checkout/advanced/customize/card-field-style/>

```tsx
// app/checkout/PayPalCardFields.tsx  (new, "use client")
// PayPal-hosted card fields (docs/features/card-payments.md stage 3). Each field is an iframe
// served by PayPal; the card number never reaches our page's JS or our server. Our Pay button
// only calls submit(); PayPal attaches the card to the order and, if required, runs 3-D Secure.

"use client";

import { useEffect, useRef, useState } from "react";
import type { Address } from "@/lib/supabase/types";
import { loadPayPalSdk, type PayPalCardFieldsHandle } from "./paypal-sdk";

export function PayPalCardFields({
  clientId,
  buildPayload,
  billingAddress,
  total,
  onFail,
  onIneligible,
}: {
  clientId: string;
  buildPayload: () => Record<string, unknown>;
  billingAddress: Address;
  total: string;
  onFail: (message: string) => void;
  /** Live account not yet approved for ACDC → the caller hides the card form (wallet stays). */
  onIneligible: () => void;
}) {
  const nameRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLDivElement>(null);
  const expiryRef = useRef<HTMLDivElement>(null);
  const cvvRef = useRef<HTMLDivElement>(null);
  const fieldsRef = useRef<PayPalCardFieldsHandle | null>(null);
  // Latest-ref, same reason as PayPalSdkButtons: SDK callbacks outlive renders.
  const payloadRef = useRef(buildPayload);
  useEffect(() => {
    payloadRef.current = buildPayload;
  });
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadPayPalSdk(clientId)
      .then(async (paypal) => {
        if (cancelled) return;
        const cardFields = paypal.CardFields({
          createOrder: async () => {
            const response = await fetch("/api/paypal/create", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...payloadRef.current(), source: "card" }),
            });
            const data = await response.json();
            if (!response.ok || !data.id) {
              throw new Error(data.error ?? "Could not start card payment.");
            }
            return data.id;
          },
          onApprove: async (data: { orderID: string; liabilityShift?: string }) => {
            const response = await fetch("/api/paypal/capture", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderID: data.orderID }),
            });
            const result = await response.json();
            if (!response.ok || !result.redirectUrl) {
              throw new Error(result.error ?? "Your card could not be charged.");
            }
            window.localStorage.removeItem("goldrose-cart-v2");
            window.location.assign(result.redirectUrl);
          },
          onCancel: () => setPaying(false), // buyer closed the 3-D Secure window
          onError: (error: unknown) => {
            setPaying(false);
            onFail(error instanceof Error ? error.message : "Card payment failed.");
          },
          style: {
            input: { "font-size": "16px", "font-family": "Helvetica, Arial, sans-serif", color: "#211a0e" },
            ".invalid": { color: "#b00020" },
          },
        });
        if (!cardFields.isEligible()) {
          onIneligible();
          return;
        }
        fieldsRef.current = cardFields;
        await Promise.all([
          cardFields.NameField().render(nameRef.current!),
          cardFields.NumberField().render(numberRef.current!),
          cardFields.ExpiryField().render(expiryRef.current!),
          cardFields.CVVField().render(cvvRef.current!),
        ]);
      })
      .catch((error: Error) => onFail(error.message));
    return () => {
      cancelled = true;
    };
  }, [clientId, onFail, onIneligible]);

  async function pay() {
    const fields = fieldsRef.current;
    if (!fields || paying) return;
    const state = await fields.getState();
    if (!state.isFormValid) {
      onFail("Please check the card details.");
      return;
    }
    setPaying(true);
    try {
      await fields.submit({
        billingAddress: {
          addressLine1: billingAddress.address1,
          addressLine2: billingAddress.address2,
          adminArea1: billingAddress.state,   // state / province
          adminArea2: billingAddress.city,
          countryCode: billingAddress.country, // ISO-2
          postalCode: billingAddress.postal_code,
        },
      });
      // Declined → onError fired; a new click creates a NEW PayPal order (D11).
    } catch (error) {
      setPaying(false);
      onFail(error instanceof Error ? error.message : "Card payment failed.");
    }
  }

  // Containers need a defined height — each renders a PayPal iframe.
  return (
    <div>
      <div ref={nameRef} className="h-11" />
      <div ref={numberRef} className="h-11" />
      <div className="grid grid-cols-2 gap-3">
        <div ref={expiryRef} className="h-11" />
        <div ref={cvvRef} className="h-11" />
      </div>
      <button type="button" onClick={pay} disabled={paying}>
        {paying ? "PROCESSING…" : `PAY ${total} SECURELY`}
      </button>
      <p>
        By paying with your card, you acknowledge that your data will be processed by PayPal
        subject to the PayPal Privacy Statement available at PayPal.com.
      </p>
    </div>
  );
}
```

Wiring in `CheckoutClient.tsx`: in the PayPal branch (`paypalClientId` set), render the
wallet `PayPalSdkButtons` **and** `PayPalCardFields`; `onIneligible` sets a state that hides
the card block. The card rail needs a billing address — reuse the details-step address
fields the mock branch already draws (the PayPal branch today shows "PayPal collects the
delivery address in its own secure window", `:1331-1332`, `:1681-1682`; with cards that text
applies to the wallet only). The mock card form (`mockForm`) stays for local dev with no
keys — the e2e suite runs on it. Only the **allowed CSS list** works inside the fields
(font, color, padding, border…; no custom fonts, no margins) — layout is normal CSS on the
containers.

**Mandatory disclosure** (that `<p>` above is PayPal's exact wording, option 1), and option
2 — a paragraph in the privacy policy — belongs in the `/policies/privacy` copy (AI-046):
"We use PayPal for payments and other services. If you wish to use one of these services and
pay on our website, PayPal may collect the personal data you provide, such as payment and
other identifying information. PayPal uses this information to operate and improve the
services it provides to us and others, including for fraud detection, harm and loss
prevention, authentication, analytics related to the performance of its services, and to
comply with applicable legal requirements. The processing of this information will be
subject to the PayPal Privacy Statement available at PayPal.com."
<https://developer.paypal.com/platforms/checkout/advanced>

**CSP.** The repo sets no Content-Security-Policy today (`next.config.ts` only sets
Cache-Control; live headers show only HSTS), so the SDK, popup and iframes load unchanged.
If a CSP is ever added, PayPal's documented allowlist is `*.paypal.com *.paypalobjects.com
*.venmo.com` on script-src, style-src, connect-src, frame-src, child-src, img-src (+ `data:`),
a nonce passed **twice** (`nonce=` and `data-csp-nonce=` on the script tag), and
`Cross-Origin-Opener-Policy: same-origin-allow-popups`.
<https://developer.paypal.com/sdk/js/best-practices/> — with hosted iframes and no card data
in our JS, we sit in **PCI SAQ A**; PCI DSS v4.0.1 adds a duty to protect the embedding page
from script attacks, which is why a strict CSP on `/checkout` becomes a compliance item, not
just hygiene.

### 5.2 Stage 2 — Migration 0015 + admin/receipt surfacing

`supabase/migrations/0015_card_payment_columns.sql` (D7). Provider-neutral names; the
`checkouts.status` value `rejected` is what §5.3's hard stop needs so the webhook repair
path cannot resurrect a rejected payment.

```sql
-- 0015 — card payment columns (docs/features/card-payments.md stage 2, 2026-09).
--
-- Provider-neutral on purpose: a future non-PayPal card processor fills the same three
-- columns. 0004 first proposed them and was abandoned (scripts/check-migrations.mjs
-- KNOWN_SKIPPED), so everything here is idempotent in case a hosted column survived.

alter table orders
  add column if not exists payment_method_kind text
    check (payment_method_kind is null or payment_method_kind in ('wallet', 'card'));

-- Brand exactly as the provider reports it ('VISA', 'MASTERCARD', 'AMEX' …), and the last
-- four digits — never more of the number than that, anywhere.
alter table orders add column if not exists card_brand text;
alter table orders
  add column if not exists card_last4 text
    check (card_last4 is null or card_last4 ~ '^[0-9]{4}$');

-- A checkout whose capture was refunded-and-rejected (amount drift, failed 3DS) must not be
-- rebuilt by the webhook repair path: give it a terminal state distinct from 'completed'.
alter table checkouts drop constraint if exists checkouts_status_check;
alter table checkouts
  add constraint checkouts_status_check
    check (status in ('open', 'completed', 'rejected'));
```

Apply, verify, record:

⚠️ `supabase db push` changes the **LIVE database** that eldreve.com reads. Take a dump
first so a mistake is recoverable: run the manual dump from `docs/guides/aws-backup.md`, or
the one-liner below (everything, including `supabase db push`, picks up the exported
`SUPABASE_DB_PASSWORD` — the CLI reads that variable and does not prompt,
<https://supabase.com/docs/reference/cli/supabase-db-push>; it prompts only in a tab where
the envget block was not run). **Rollback** if 0015 misbehaves: a NEW migration
`0016` that drops the three columns and restores `check (status in ('open','completed'))` —
never edit or delete 0015 after it is pushed; the CLI tracks applied files by name.

```bash
# [Mac terminal] — MAIN repo dir only; the CLI link lives in supabase/.temp/ and fails in a worktree
cd /Users/charles/Developer/goldrose-storefront
# run the envget block from Conventions first — it exports SUPABASE_DB_PASSWORD (never `source .env.local`)
PGPASSWORD="$SUPABASE_DB_PASSWORD" pg_dump --format=custom --schema=public \
  -d "postgresql://postgres.cfvsvgbldnzkcjvbwnjp@aws-1-us-west-2.pooler.supabase.com:5432/postgres" \
  -f ~/before-0015.dump                    # ⚠️ safety copy BEFORE the schema change
npm run check:migrations                 # numbering + view guard
supabase db push                         # uses $SUPABASE_DB_PASSWORD from the envget block, no prompt; NEVER the web SQL editor
PGPASSWORD="$SUPABASE_DB_PASSWORD" psql "postgresql://postgres.cfvsvgbldnzkcjvbwnjp@aws-1-us-west-2.pooler.supabase.com:5432/postgres" \
  -c "\d orders" | grep -E "payment_method_kind|card_brand|card_last4"
```

Then update the applied-state table in `docs/features/database-migrations.md` (§10).

Code that carries the new columns (snippets, by file):

```ts
// lib/supabase/types.ts:233 — CheckoutRow: the terminal state §5.3 writes and §5.4 guards on.
// Without this line `npm run typecheck` (a CI step, .github/workflows/ci.yml) fails on the
// string literal "rejected" — the migration widens the SQL constraint, not the TS type.
  status: "open" | "completed" | "rejected";
```

```ts
// lib/supabase/types.ts — OrderRow
  /** 'wallet' (PayPal account) or 'card' (hosted card fields); null for mock/draft. */
  payment_method_kind?: "wallet" | "card" | null;
  card_brand?: string | null;
  card_last4?: string | null;
```

```ts
// lib/orders/db.ts — CreateOrderInput (+ copy the three into the OrderRow literal at :174-211)
  payment_method_kind?: "wallet" | "card" | null;
  card_brand?: string | null;
  card_last4?: string | null;
```

```tsx
// app/admin/(dashboard)/orders/[id]/OrderDetailView.tsx — Payment card, after the capture-id line (:401-406)
{order.card_brand && order.card_last4 ? (
  <Text as="p" tone="subdued" variant="bodySm">
    {t("order.payment.card")}: {order.card_brand} •••• {order.card_last4}
  </Text>
) : null}
```

```ts
// lib/admin/i18n.ts — both dictionaries
  "order.payment.card": "Card",          // EN block near :466
  "order.payment.card": "银行卡",         // 中文 block near :1324
```

```ts
// lib/email.ts:167 — owner alert gains the instrument; the buyer receipt stays as is.
// Replace the whole third argument of deliver() — keep the summary block.
      `A new order just came in.\n\n${summary}\n\nSource: ${order.source} · Provider: ${order.payment_provider}${
        order.card_brand ? ` (${order.card_brand} •••• ${order.card_last4})` : ""
      }`,
```

The `/checkout/success` page labels the method from the `method` query param
(`app/checkout/success/page.tsx:46-48`, ids from `lib/checkout/methods.ts`): the capture
route should pass `method: mapped.paymentMethodKind === "card" ? "card" : "paypal"`.

### 5.3 Stage 4a — Server: create-order body, capture mapping, decision table, hard stops

**Create order.** The only card-specific thing the server ever sends is the 3DS preference;
the card data itself is attached by the SDK. Never put `payment_source.paypal` and
`payment_source.card` in one order. <https://developer.paypal.com/docs/checkout/advanced/customize/3d-secure/sdk/>

```ts
// lib/paypal/client.ts — createPayPalOrder(priced, options)
export async function createPayPalOrder(
  priced: PricedCart,
  options: { idempotencyKey: string; source?: "wallet" | "card" },
): Promise<{ id: string }> {
  // … existing purchase_units body …
  const body = {
    intent: "CAPTURE",
    purchase_units: [/* unchanged */],
    ...(options.source === "card"
      ? {
          payment_source: {
            card: {
              // SCA_WHEN_REQUIRED (PayPal default, D6): 3-D Secure only where a regulator
              // mandates it. SCA_ALWAYS = challenge every card → liability shift, more drop-off.
              attributes: { verification: { method: "SCA_WHEN_REQUIRED" } },
            },
          },
        }
      : {}),
  };
  // …
}

/** GET an order — used before capture to read the 3DS outcome AND the buyer's ship-to
 *  country without moving money (D9, D17). */
export async function getPayPalOrder(orderId: string): Promise<unknown> {
  return paypalFetch(getPayPalConfig(), `/v2/checkout/orders/${orderId}`, { method: "GET" });
}

/** PATCH the order amount to the re-priced total BEFORE capture (D17). PayPal answers 204.
 *  https://developer.paypal.com/docs/api/orders/v2/#orders_patch */
export async function patchPayPalOrderAmount(orderId: string, priced: PricedCart): Promise<void> {
  await paypalFetch(getPayPalConfig(), `/v2/checkout/orders/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify([
      {
        op: "replace",
        // createPayPalOrder sends no reference_id, so PayPal named the unit "default".
        path: "/purchase_units/@reference_id=='default'/amount",
        value: {
          currency_code: "USD",
          value: dollars(priced.total_cents),
          breakdown: {/* same item_total / shipping / tax_total / discount lines createPayPalOrder builds */},
        },
      },
    ]),
  });
}
```

`paypalFetch` does `response.json().catch(() => null)`, so the 204 No Content PATCH answer is
fine as is.

```ts
// app/api/paypal/create/route.ts — requestSchema gains the client's declared rail
  source: z.enum(["wallet", "card"]).default("wallet"),
// … and passes it on:
  const paypalOrder = await createPayPalOrder(priced, { idempotencyKey: checkoutId, source: parsed.source });
```

**Capture mapping.** The capture response for a card carries
`payment_source.card.{name,last_digits,brand,type,bin_details,authentication_result}`;
`authentication_result` is absent when 3DS did not run.
<https://developer.paypal.com/api/orders/v2/orders-capture> ·
<https://developer.paypal.com/api/orders/v2/definitions/order/>

```ts
// lib/paypal/mapping.ts — extend the response type and the mapped shape
export type PayPalCaptureResponse = {
  // … existing fields …
  payment_source?: {
    paypal?: { email_address?: string; account_id?: string };
    card?: {
      brand?: string;        // VISA | MASTERCARD | AMEX | … | UNKNOWN
      last_digits?: string;
      type?: string;         // CREDIT | DEBIT | PREPAID | STORE | UNKNOWN
      authentication_result?: {
        liability_shift?: string;                       // POSSIBLE | NO | UNKNOWN (docs also list YES)
        three_d_secure?: { enrollment_status?: string; authentication_status?: string };
      };
    };
  };
  purchase_units?: Array<{
    // … existing …
    payments?: {
      captures?: Array<{
        // … existing …
        status_details?: { reason?: string };           // only when PENDING / DECLINED (PayPal's text says "PENDING or DENIED")
        processor_response?: { avs_code?: string; cvv_code?: string; response_code?: string };
      }>;
    };
  }>;
};

export type MappedCapture = {
  // … existing fields …
  paymentMethodKind: "wallet" | "card" | null;
  cardBrand: string | null;
  cardLast4: string | null;
  liabilityShift: string | null;
  authenticationStatus: string | null;
  statusReason: string | null;
  processorResponseCode: string | null;
};

// inside mapCaptureResponse():
  const card = response.payment_source?.card;
  // …
    paymentMethodKind: card ? "card" : response.payment_source?.paypal ? "wallet" : null,
    cardBrand: card?.brand ?? null,
    cardLast4: card?.last_digits ?? null,
    liabilityShift: card?.authentication_result?.liability_shift ?? null,
    authenticationStatus: card?.authentication_result?.three_d_secure?.authentication_status ?? null,
    statusReason: capture?.status_details?.reason ?? null,
    processorResponseCode: capture?.processor_response?.response_code ?? null,
```

**The liability-shift decision table** (PayPal's, verbatim rows):
<https://developer.paypal.com/docs/checkout/advanced/customize/3d-secure/response-parameters/>

```text
  +--------------------+-----------------------+-----------------+----------------------------------+
  | enrollment_status  | authentication_status | liability_shift | Recommended action               |
  +--------------------+-----------------------+-----------------+----------------------------------+
  | Y                  | Y                     | POSSIBLE        | Continue with authorization      |
  | Y                  | N                     | NO              | Do not continue                  |
  | Y                  | R                     | NO              | Do not continue                  |
  | Y                  | A                     | POSSIBLE        | Continue with authorization      |
  | Y                  | U                     | UNKNOWN         | Do not continue — ask to retry   |
  | Y                  | U                     | NO              | Do not continue — ask to retry   |
  | Y                  | C                     | UNKNOWN         | Do not continue — ask to retry   |
  | Y                  | –                     | –               | Do not continue — ask to retry   |
  | N                  | –                     | NO              | Continue with authorization      |
  | U                  | –                     | NO              | Continue with authorization      |
  | U                  | –                     | UNKNOWN         | Do not continue — ask to retry   |
  | B                  | –                     | NO              | Continue with authorization      |
  | –                  | –                     | UNKNOWN         | Do not continue — ask to retry   |
  +--------------------+-----------------------+-----------------+----------------------------------+
  enrollment: Y ready · N not enrolled · U unavailable · B bypassed · – absent
  auth: Y success · N failed · R rejected · A attempted · U unable · C challenge required · D decoupled · I info only
  Our rule: liability_shift NO with auth N or R → do NOT capture. Absent / POSSIBLE → capture.
  UNKNOWN → capture and note it in the timeline (small orders; revisit with data).
  ⚠️ That last line is a DELIBERATE deviation from PayPal's table, which says "do not
  continue" for every UNKNOWN row: we accept the liability on small orders rather than lose
  the sale to a flaky 3DS server. It is a decision, not a misquote — revisit with data.
```

**Capture decision — pure module, unit-testable** (this is where D8 and D9 live):

```ts
// lib/paypal/capture-policy.ts  (new; no I/O — tested in tests/unit/paypal-capture-policy.test.ts)
import type { MappedCapture } from "./mapping.ts";

export type CaptureDecision =
  | { action: "create_paid" }
  | { action: "create_pending"; reason: string }
  | { action: "reject"; buyerMessage: string; refund: boolean; log: string };

/** Before capture: read the 3DS outcome from GET /v2/checkout/orders/{id}. Nothing charged yet. */
export function blockedByAuthentication(before: MappedCapture): boolean {
  return (
    before.liabilityShift === "NO" &&
    ["N", "R"].includes(before.authenticationStatus ?? "")
  );
}

/** After capture: decide what the capture response means for our order row. */
export function decideCapture(mapped: MappedCapture, pricedTotalCents: number): CaptureDecision {
  if (["DECLINED", "DENIED", "FAILED"].includes(mapped.captureStatus ?? "")) {
    return {
      action: "reject",
      buyerMessage: "Your card was declined. Please try another card.",
      refund: false,
      log: `capture ${mapped.captureStatus} (${mapped.processorResponseCode ?? "no code"})`,
    };
  }
  if (mapped.amountCents !== null && mapped.amountCents !== pricedTotalCents) {
    // Hard stop (D8): money moved for the wrong amount → give it back, record nothing as paid.
    return {
      action: "reject",
      buyerMessage: "Prices changed while you were paying. Nothing has been charged — please try again.",
      refund: mapped.completed,
      log: `amount mismatch: captured ${mapped.amountCents}, priced ${pricedTotalCents}`,
    };
  }
  if (mapped.captureStatus === "PENDING") {
    return { action: "create_pending", reason: mapped.statusReason ?? "unknown" };
  }
  if (mapped.completed) {
    return { action: "create_paid" };
  }
  return {
    action: "reject",
    buyerMessage: `Payment not completed (status: ${mapped.captureStatus ?? "unknown"}).`,
    refund: false,
    log: `unexpected status ${mapped.captureStatus}`,
  };
}
```

**Capture route** — replace the body of the `try` block at `app/api/paypal/capture/route.ts:40-116`:

```ts
// app/api/paypal/capture/route.ts (sketch of the new try-block)
    // 1. Pre-capture GET (D9 + D17). Free; nothing has moved yet. The response carries the
    //    3DS outcome AND the buyer's ship-to country (purchase_units[0].shipping.address.
    //    country_code — for a wallet payer that is the PayPal-ACCOUNT address, not the one
    //    typed in checkout).
    const before = mapCaptureResponse((await getPayPalOrder(parsed.orderID)) as PayPalCaptureResponse);
    if (blockedByAuthentication(before)) {
      return NextResponse.json(
        { error: "Card authentication failed. Please try another card." },
        { status: 402 },
      );
    }

    // 2. Re-price BEFORE capture with the country PayPal will ship to (D17). Today's code
    //    re-prices AFTER capturePayPalOrder (capture/route.ts:63-72): an unserved country
    //    makes priceCart throw "We don't ship to XX." → 500 to the buyer, real money taken,
    //    no order (§7.6); a served-but-different zone records the wrong amount. Here the
    //    same cases end with NO capture.
    const checkout = /* … find by provider_order_id, as today … */;
    const country = before.shipToCountry ?? checkout.cart.country ?? "US";
    let priced;
    try {
      priced = await priceCart({ /* lines, discountCode, email as today */ country });
    } catch (error) {
      console.error(`[paypal/capture] pre-capture re-price refused (paypal order ${parsed.orderID})`, error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : `We don't ship to ${country}.` },
        { status: 409 },
      );
    }
    if (priced.total_cents !== checkout.total_cents) {
      // The PayPal order still carries the create-time amount (= checkouts.total_cents):
      // PATCH it to the new price, then capture the right amount.
      await patchPayPalOrderAmount(parsed.orderID, priced);
    }

    // 3. Capture — money moves here.
    const response = (await capturePayPalOrder(parsed.orderID)) as PayPalCaptureResponse;
    const mapped = mapCaptureResponse(response);

    // 4. Decide. decideCapture's drift branch is now the LAST-RESORT D8 (a price edit in the
    //    window between the PATCH and the capture), not the design.
    const decision = decideCapture(mapped, priced.total_cents);
    if (decision.action === "reject") {
      console.error(`[paypal/capture] ${decision.log} (paypal order ${parsed.orderID})`);
      if (decision.refund && mapped.captureId) {
        // Full refund, idempotency-keyed; a retry cannot refund twice.
        await refundPayPalCapture(mapped.captureId, null, mapped.currency ?? "USD");
      }
      // Terminal state so the webhook repair path leaves this checkout alone (§5.4).
      await getStore().update("checkouts", { id: checkout.id }, {
        status: "rejected",
        completed_at: new Date().toISOString(),
      });
      return NextResponse.json({ error: decision.buyerMessage }, { status: 409 });
    }

    const order = await createOrder({
      priced,
      source: "site",
      payment_provider: "paypal",
      provider_order_id: mapped.providerOrderId ?? parsed.orderID,
      provider_capture_id: mapped.captureId,
      // PENDING = "payment initiation was successful but completion is still pending":
      // the row exists (stock held), nothing ships, no receipt; the webhook flips it to paid.
      financial_status: decision.action === "create_pending" ? "pending" : "paid",
      payment_method_kind: mapped.paymentMethodKind,
      card_brand: mapped.cardBrand,
      card_last4: mapped.cardLast4,
      email: mapped.email ?? checkout.email,
      phone: mapped.phone,
      shipping_address: mapped.shippingAddress,
      billing_address: mapped.billingAddress,
      note: checkout.cart.note ?? null,
      visitor_id: checkout.cart.visitor_id ?? null,
      checkout_id: checkout.id,
      auth_user_id: await currentAuthUserId(),
      raw: response,
    });
    if (decision.action === "create_pending") {
      // order_events insert — same shape as lib/paypal/webhook.ts addEvent()
      // "Payment pending at PayPal (<reason>) — do not ship until confirmed"
    }
    const params = new URLSearchParams({
      order: order.name,
      oid: order.id,
      method: mapped.paymentMethodKind === "card" ? "card" : "paypal",
      total: String(order.total_cents),
      mock: "0",
      ...(decision.action === "create_pending" ? { pending: "1" } : {}),
    });
    return NextResponse.json({ ok: true, redirectUrl: `/checkout/success?${params.toString()}` });
```

Note on `createOrder` with `financial_status: "pending"`: `lib/orders/db.ts:253-263` writes
the "Payment of $x captured" timeline line and `:280` sends emails **only when paid**, and
the existing webhook `confirmed` branch (`webhook.ts:93-106`) flips pending → paid. Today,
`mapped.completed === false` returns 400 and creates nothing, so a PENDING capture would
only appear via the repair path minutes later; the sketch makes it visible immediately.

**Error bodies.** `paypalFetch` throws `PayPal … failed (422): {"details":[{"issue":"INSTRUMENT_DECLINED"…` and
the route echoes `error.message` to the buyer. For cards, parse the JSON once and map the
`issue` to a human sentence — PayPal itself says it "cannot provide merchants with details
regarding buyer payment declines", so a generic message plus "try another card" is the
correct UX. Never auto-retry a `DECLINED`/`INSTRUMENT_DECLINED` capture; only network/5xx
errors may be retried, and then with the **same** `PayPal-Request-Id` (PayPal stores the key
for a per-API period; the only documented figure is 45 days for Payments v2 refunds, and the
Orders v2 reference publishes no duration — treat create/capture keys as valid only for the
immediate retry loop, not for a retry hours later) —
<https://developer.paypal.com/api/rest/requests/>.
<https://developer.paypal.com/api/rest/reference/orders/v2/errors/> ·
<https://developer.paypal.com/api/rest/troubleshooting/rest_unprocessable_entity>

```text
  Capture outcomes you will see (HTTP 201 + captures[0].status, or HTTP 422 details[0].issue)
  +----------------------------+---------------------------------------------------------------------------+
  | COMPLETED                  | money captured → create paid order, send receipt                          |
  | PENDING                    | PENDING_REVIEW (fraud hold), RECEIVING_PREFERENCE_MANDATES_MANUAL_ACTION  |
  |                            | (boss must Accept in PayPal, or change Account Settings → Payment         |
  |                            | preferences), UNILATERAL (payee e-mail unconfirmed) → pending order       |
  | DECLINED / FAILED          | issuer/PayPal refused after approval → reject, no order (*)               |
  | 422 INSTRUMENT_DECLINED    | "declined by the processor or bank" → tell buyer to use another card      |
  | 422 PAYER_ACTION_REQUIRED  | 3DS/SCA not finished → buyer re-runs the card form                        |
  | 422 ORDER_ALREADY_CAPTURED | idempotency hit → look up the existing order and return it                |
  | 422 PAYEE_ACCOUNT_RESTRICTED| the boss's account is limited → alert the owner immediately ⚠️            |
  | 422 MAX_NUMBER_OF_PAYMENT_ | buyer retried too often → stop; show "contact your bank"                  |
  |     ATTEMPTS_EXCEEDED      |                                                                           |
  +----------------------------+---------------------------------------------------------------------------+
  (*) The Orders v2 capture status enum is COMPLETED, DECLINED, PARTIALLY_REFUNDED, PENDING, REFUNDED,
      FAILED (https://developer.paypal.com/api/orders/v2/definitions/capture); DENIED survives as the
      Payments v1 webhook name AND in the same page's status_details.reason description ("PENDING or
      DENIED"), so decideCapture() accepts both.
```

### 5.4 Stage 4b — Webhook: DECLINED/DENIED, PENDING, REVERSED, disputes

Event names from the catalogue (<https://developer.paypal.com/api/rest/webhooks/event-names/>,
re-read 2026-09-05): under **Payments v2** the decline event is `PAYMENT.CAPTURE.DECLINED`;
`PAYMENT.CAPTURE.DENIED` is the **Payments v1** name. Our integration is v2; subscribe to
both (free) and treat them identically. Merchant actions per
<https://developer.paypal.com/payment-methods/webhooks>:

```text
  +------------------------------------+--------------------------------------------------------------------+
  | Event                              | Handler action                                                     |
  +------------------------------------+--------------------------------------------------------------------+
  | PAYMENT.CAPTURE.COMPLETED          | (today) confirm pending → paid; repair when no order; duplicate     |
  | PAYMENT.CAPTURE.REFUNDED           | (today) sync refunded_cents + status, dedupe by refund id          |
  | PAYMENT.CAPTURE.PENDING            | if order exists: timeline "Payment pending at PayPal (<reason>)",  |
  |                                    | e-mail owner; do NOT ship                                          |
  | PAYMENT.CAPTURE.DECLINED / DENIED  | order exists and not cancelled → cancelled_at + cancel_reason,     |
  |                                    | restock lines, timeline; e-mail owner; buyer told to pay again     |
  | PAYMENT.CAPTURE.REVERSED           | money pulled back (chargeback outcome / PayPal reversal) →         |
  |                                    | refunded_cents + status refunded/partially_refunded, tag           |
  |                                    | `reversed`, timeline, e-mail owner, stop shipment if unshipped     |
  | CHECKOUT.PAYMENT-APPROVAL.REVERSED | problem after approval, before capture — ours captures at once;    |
  |                                    | log only                                                           |
  | CUSTOMER.DISPUTE.CREATED           | find order by disputed_transactions[0].seller_transaction_id       |
  |                                    | (= provider_capture_id); tag `disputed`; timeline with dispute_id, |
  |                                    | reason, dispute_life_cycle_stage, seller_response_due_date; e-mail |
  |                                    | owner — respond in the Resolution Center before the due date       |
  | CUSTOMER.DISPUTE.UPDATED           | timeline: stage/status change (INQUIRY → CHARGEBACK matters)      |
  | CUSTOMER.DISPUTE.RESOLVED          | timeline with dispute_outcome.outcome_code; RESOLVED_SELLER_FAVOUR |
  |                                    | → remove tag; RESOLVED_BUYER_FAVOUR → expect/await REVERSED        |
  +------------------------------------+--------------------------------------------------------------------+
```

Dispute facts: stages INQUIRY (20 days, buyer↔seller) → CHARGEBACK (PayPal decides; seller
normally 10 days to respond) → PRE_ARBITRATION → ARBITRATION; buyers can file up to 180 days
after payment. <https://developer.paypal.com/docs/disputes/disputes-reference/> ·
<https://developer.paypal.com/docs/api/customer-disputes/v1/>

```ts
// lib/paypal/webhook.ts — additions (sketch). restockLines() moves from lib/admin/orders.ts
// into lib/orders/db.ts so the webhook does not import admin code.

export type PayPalWebhookEvent = {
  id?: string;
  event_type?: string;
  resource?: {
    // … existing …
    status_details?: { reason?: string };
    // disputes
    dispute_id?: string;
    reason?: string;
    status?: string;
    dispute_life_cycle_stage?: string;
    seller_response_due_date?: string;
    dispute_amount?: { value?: string; currency_code?: string };
    disputed_transactions?: Array<{ seller_transaction_id?: string }>;
    dispute_outcome?: { outcome_code?: string };
  };
};

export type WebhookOutcome =
  | "confirmed" | "repaired" | "refund_synced" | "duplicate" | "ignored"
  | "pending_noted" | "cancelled" | "reversed" | "dispute_noted";

async function handleCaptureDeclined(event: PayPalWebhookEvent): Promise<WebhookOutcome> {
  const providerOrderId = event.resource?.supplementary_data?.related_ids?.order_id;
  if (!providerOrderId) return "ignored";
  const store = getStore();
  const order = (await store.all("orders")).find((row) => row.provider_order_id === providerOrderId);
  if (!order) return "ignored";
  if (order.cancelled_at) return "duplicate";
  await store.update("orders", { id: order.id }, {
    cancelled_at: new Date().toISOString(),
    cancel_reason: `Payment ${event.event_type?.split(".").pop()?.toLowerCase()} by PayPal`,
  });
  await restockLines(order.id, order.name, "paypal-webhook");
  await addEvent(order.id, `Payment declined by PayPal (${event.resource?.status_details?.reason ?? "no reason"}) — order cancelled, stock returned`);
  return "cancelled";
}

async function handleDispute(event: PayPalWebhookEvent): Promise<WebhookOutcome> {
  const captureId = event.resource?.disputed_transactions?.[0]?.seller_transaction_id;
  if (!captureId) return "ignored";
  const store = getStore();
  const order = (await store.all("orders")).find((row) => row.provider_capture_id === captureId);
  if (!order) return "ignored";
  const marker = `Dispute ${event.resource?.dispute_id} · ${event.id}`;
  const events = await store.all("order_events");
  if (events.some((entry) => entry.order_id === order.id && entry.message.includes(marker))) return "duplicate";
  const resolved = event.event_type === "CUSTOMER.DISPUTE.RESOLVED";
  await store.update("orders", { id: order.id }, {
    tags: resolved
      ? order.tags.filter((tag) => tag !== "disputed")
      : Array.from(new Set([...order.tags, "disputed"])),
  });
  await addEvent(order.id,
    `${marker} — ${event.event_type?.split(".").pop()}: ${event.resource?.reason ?? ""} · stage ${event.resource?.dispute_life_cycle_stage ?? "?"}` +
    (event.resource?.seller_response_due_date ? ` · respond by ${event.resource.seller_response_due_date}` : "") +
    (event.resource?.dispute_outcome?.outcome_code ? ` · outcome ${event.resource.dispute_outcome.outcome_code}` : ""),
  );
  return "dispute_noted";
}

// in handlePayPalEvent():
    case "PAYMENT.CAPTURE.PENDING":   return handleCapturePending(event);
    case "PAYMENT.CAPTURE.DECLINED":
    case "PAYMENT.CAPTURE.DENIED":    return handleCaptureDeclined(event);
    case "PAYMENT.CAPTURE.REVERSED":  return handleCaptureReversed(event);   // mirrors handleCaptureRefunded with marker "PayPal reversal <id>" + tag
    case "CUSTOMER.DISPUTE.CREATED":
    case "CUSTOMER.DISPUTE.UPDATED":
    case "CUSTOMER.DISPUTE.RESOLVED": return handleDispute(event);
```

And the **repair guard** in `handleCaptureCompleted` (after finding the checkout at
`webhook.ts:112-117`): `if (checkout.status !== "open") return "ignored";` — a `rejected`
checkout (§5.3) is never rebuilt; a `completed` one always has an order already.

Owner e-mails from the handler: export a small `sendOwnerAlert(subject, text)` from
`lib/email.ts` (wraps the existing `deliver()` + `getEmailSettings()` owner address) and call
it for PENDING, DECLINED, REVERSED and DISPUTE. Mail failures never fail the webhook (200 is
still returned; the DB write is the record).

### 5.5 Stage 5 — Tests and the sandbox test matrix

**Unit fixtures** (`npm run test:unit`, plain Node, no PayPal):

- `tests/unit/paypal-mapping.test.ts`: add a recorded **card** capture fixture
  (`payment_source.card` with `brand: "VISA"`, `last_digits: "0004"`,
  `authentication_result.liability_shift: "POSSIBLE"`) → asserts `paymentMethodKind`,
  `cardBrand`, `cardLast4`, `liabilityShift`; and a `PENDING` fixture with
  `status_details.reason: "PENDING_REVIEW"`.
- `tests/unit/paypal-capture-policy.test.ts` (new): table-driven over `decideCapture` and
  `blockedByAuthentication` — completed/matching → `create_paid`; completed/drift →
  `reject` with `refund: true`; DECLINED → `reject`, `refund: false`; PENDING →
  `create_pending`; liability NO + auth N → blocked; POSSIBLE → not blocked.
- `tests/unit/paypal-webhook.test.ts`: add `PAYMENT.CAPTURE.DECLINED` (order cancelled,
  stock movement `return_restock` written, replay → `duplicate`),
  `PAYMENT.CAPTURE.REVERSED`, `CUSTOMER.DISPUTE.CREATED` (tag added, timeline line),
  and "completed event for a `rejected` checkout → `ignored`". Record the fixture JSON from
  real sandbox deliveries in PayPal's Webhooks Events dashboard (click the row → copy).

**The "one route test".** `node --test` cannot resolve the `@/` import alias the routes use
(`tsconfig.json` `paths`; no unit test imports from `app/` today), which is exactly why the
decision logic is extracted into `lib/paypal/capture-policy.ts` and tested there; the route
stays a thin adapter. The mock-mode Playwright spec `tests/e2e/checkout.spec.ts` keeps
covering the page; a card-fields e2e would need sandbox keys in CI and is deliberately out
of scope.

**Sandbox test matrix** — run every row in local (tunnel webhook) and once more on
eldreve.com (Phase C):

```text
  +----+---------------------------+-----------------------------------------------+------------------------------------------+
  | #  | Case                      | How                                           | Expect                                   |
  +----+---------------------------+-----------------------------------------------+------------------------------------------+
  | 1  | Approved Visa             | 4005519200000004, any future expiry, CVV 123  | paid order, card VISA •••• 0004, receipt |
  | 2  | Approved Mastercard       | 2223000048400011                              | same, MASTERCARD                         |
  | 3  | Declined card             | any test PAN, cardholder NAME =               | buyer sees "declined… try another card"; |
  |    |                           | CCREJECT-REFUSED (also -IF insufficient funds,| NO order; second click creates a new     |
  |    |                           | -EC expired, -SF fraud, -CVV_F) —             | PayPal order                             |
  |    |                           | case-sensitive                                |                                          |
  | 4  | 3DS challenge success     | PAYPAL_3DS_METHOD=SCA_ALWAYS (sandbox only);  | challenge modal → liability POSSIBLE →   |
  |    |                           | Visa 4868719166101368                         | paid                                     |
  | 5  | 3DS challenge failed      | same env var; Visa 4868719181895556           | 402 "Card authentication failed"; NO     |
  |    |                           |                                               | capture (check PayPal activity: none)    |
  | 6  | 3DS frictionless fail     | same env var; Visa 4868719158130060           | same as 5                                |
  | 7  | Wallet                    | the US sandbox buyer from A2 (never the       | paid order, payment_method_kind wallet   |
  |    |                           | default Personal account — its AU address     |                                          |
  |    |                           | re-prices the cart)                           |                                          |
  | 8  | Amount drift              | ⚠️ LIVE CATALOG: open PayPal popup / fill      | 409 "Prices changed…" (with §5.3 step 2  |
  |    |                           | card, THEN change the variant price in /admin | the PATCH normally absorbs the edit and  |
  |    |                           | in another tab, THEN approve. Pick the        | the order is simply paid at the new      |
  |    |                           | lowest-traffic product, write the old price   | price — the refund path fires only if    |
  |    |                           | down BEFORE editing, restore it immediately   | the edit lands between PATCH and         |
  |    |                           | after the capture, and confirm on /shop that  | capture); on refund: PayPal activity     |
  |    |                           | the old price shows again. Skip this row on   | shows capture + immediate full refund;   |
  |    |                           | eldreve.com if the site is open to visitors   | checkout status rejected; NO order;      |
  |    |                           | that day — the local run proves the same code | later COMPLETED webhook → ignored        |
  |    |                           | path.                                         |                                          |
  | 9  | Partial refund            | /admin Refund $5                              | partially_refunded; REFUNDED webhook →   |
  |    |                           |                                               | refund_synced line                       |
  | 10 | Full refund + close       | /admin Cancel → tick Refund payment AND       | refunded + cancelled + stock back.       |
  |    |                           | Restock items (use this for ANY test order)   | Refund WITHOUT ticking Restock items     |
  |    |                           |                                               | leaves stock down; Refund never closes   |
  |    |                           |                                               | the order — only Cancel does             |
  | 11 | Forced INSTRUMENT_DECLINED| server sends PayPal-Mock-Response header      | capture 422 → buyer message; NO order    |
  |    | on capture                | (see below)                                   |                                          |
  | 12 | Repair path               | §3.5 procedure with a card payment            | outcome repaired, card columns filled    |
  | 13 | Ineligible account        | temporarily untick ACDC on the sandbox app    | card form hidden, wallet button works    |
  +----+---------------------------+-----------------------------------------------+------------------------------------------+
```

Test numbers and decline names: <https://developer.paypal.com/tools/sandbox/card-testing/>;
3DS cards (all nine scenarios, Visa and Mastercard):
<https://developer.paypal.com/docs/checkout/advanced/customize/3d-secure/test/>. With
`SCA_WHEN_REQUIRED` and a US buyer no challenge appears in sandbox — expected (no mandate).
For rows 4–6 read the method from `PAYPAL_3DS_METHOD` (default `SCA_WHEN_REQUIRED`),
honoured only when `getPayPalConfig().env !== "live"` — the same pattern as
`PAYPAL_MOCK_CAPTURE_ISSUE` below; it is listed in Appendix A as `optional (§5.5) / never
live`. **Never edit the constant to test.**

Row 11 — **negative testing** is sandbox-only and server-side. Enable it first:
`[PayPal Developer Dashboard]` Sandbox Accounts → business account → ⋯ → *Settings →
Negative Testing → On*. Then send the header on the capture call — a sandbox-only env var
such as `PAYPAL_MOCK_CAPTURE_ISSUE=INSTRUMENT_DECLINED`, read in `capturePayPalOrder` only
when `getPayPalConfig().env !== "live"`, injects
`PayPal-Mock-Response: {"mock_application_codes":"INSTRUMENT_DECLINED"}`.
<https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/> ·
<https://developer.paypal.com/tools/sandbox/negative-testing/>

---

## 6. Phase E — Go-live cutover (owner + Charles, 30 minutes)

⚠️ **Everything in this section moves real money.** The boss performs the PayPal-side steps
(he owns the account); Charles performs the Vercel-side steps. Both are on a call with
screens shared for the whole 30 minutes.

### 6.0 Weeks before — the two items with a waiting time

These come first because everything in §5.0 (ACDC approval) and §6.1 hangs off them; the
ACDC review alone takes days. Same numbering as the pre-flight table so cross-references
(`P3`, `P4`) stay stable.

```text
  +----+---------+---------------------------------------------------------------------------------------------+
  | #  | Who     | Done when …                                                                                 |
  +----+---------+---------------------------------------------------------------------------------------------+
  | P3 | Boss +  | Charles is a "Developer" user on the business account (§1.3), or the password-manager       |
  |    | Charles | fallback is agreed                                                                          |
  | P4 | Boss    | LIVE app exists: [PayPal Developer Dashboard] header shows the BUSINESS account → toggle    |
  |    |         | Live → Apps & Credentials → Create App "eldreve-live", Merchant → client id + secret into   |
  |    |         | the shared password-manager item. Then request ACDC on it (§5.0 Live row) the same day.     |
  +----+---------+---------------------------------------------------------------------------------------------+
```

### 6.1 Pre-flight — days before, not on the day

```text
  +----+---------+---------------------------------------------------------------------------------------------+
  | #  | Who     | Done when …                                                                                 |
  +----+---------+---------------------------------------------------------------------------------------------+
  | P1 | Boss    | Business account is Verified (bank confirmed), AI-033 facts entered (registration number,   |
  |    |         | postal address) in the PayPal profile and in /admin store settings                          |
  | P2 | Boss    | ACDC requested on the LIVE app (§5.0, §6.0 P4) and the approval e-mail has arrived — or the |
  |    |         | team accepts a wallet-only launch (D14); card fields hide themselves either way             |
  | P5 | Boss    | LIVE webhook under the Live app: URL https://eldreve.com/api/webhooks/paypal, events =      |
  |    |         | Appendix B → the LIVE Webhook ID into the same password-manager item                        |
  | P6 | Charles | Other hard gates cleared: real shipping rates (OQ-2, shipping-rates.md), demo reviews       |
  |    |         | removed (`npm run seed:reviews -- --remove`), database backups on (status:                  |
  |    |         | docs/features/db-backups.md; procedure: docs/guides/aws-backup.md)                          |
  | P7 | Charles | Sandbox orders cancelled-with-restock, tagged `sandbox`, archived (A9) — while Production   |
  |    |         | still runs sandbox keys                                                                     |
  | P8 | Charles | Migration 0015 applied; Phase D merged to main and running in sandbox on eldreve.com with   |
  |    |         | the §5.5 matrix green; privacy policy carries the PayPal paragraph                          |
  | P9 | Charles | D16 in place: the `vercel logs --follow` command ready in a second terminal tab; Phase D    |
  |    |         | timeline writes for every payment anomaly merged (§5.3 / §5.4)                              |
  | P10| Charles | Rollback values (the five sandbox values) sit in the password manager, ready to paste       |
  | P11| Charles | Personal PayPal account (AU, §1.2) has a CONFIRMED card or bank so the wallet acceptance    |
  |    |         | purchase can actually be paid, AND Charles has checked which P6 shipping zone covers his    |
  |    |         | own Sydney PayPal address — §5.3 re-prices by the buyer's PayPal address, so the wallet     |
  |    |         | test is priced at that zone (no zone → the test stops with a 409, §6.2)                     |
  +----+---------+---------------------------------------------------------------------------------------------+
```

### 6.2 The 30 minutes

```text
  +-------+---------+------------------------------------------------------------------------------------------+
  | Min   | Who     | Step                                                                                     |
  +-------+---------+------------------------------------------------------------------------------------------+
  | 0–3   | Boss    | [PayPal Developer Dashboard] confirm header = business account, toggle = LIVE; read the  |
  |       |         | live client id, secret and Webhook ID from the "eldreve-live" app into the shared        |
  |       |         | password-manager item (or Charles reads them as Developer user)                          |
  | 3–8   | Charles | [Mac terminal] main repo dir — run the fenced block §6.2a below: all 5 PAYPAL_* values   |
  |       |         | in one sitting, then remove the flag. ⚠️ PAYPAL_ENV must be exactly lowercase `live`      |
  |       |         | (client.ts:28). Both client-id vars = the SAME live id. A half-set or mixed sandbox/live |
  |       |         | set = every capture fails.                                                               |
  | 8–12  | Charles | Redeploy with build cache OFF (§4.3). Watch the build log: `[env] Hosted Supabase        |
  |       |         | configuration is complete.` and NO skip-payment warning. If the build FAILS with         |
  |       |         | `[env] CHECKOUT_SKIP_PAYMENT is set while PAYPAL_ENV=live` — that is                     |
  |       |         | scripts/validate-env.mjs:62-71 doing its job: remove the flag, redeploy.                 |
  | 12–15 | Charles | Probes (§4.4): create → 400 Invalid request; checkout → 400 Mock disabled; webhook → 401.|
  |       |         | [browser] view-source of /checkout shows the LIVE client id. [/admin] the top banner     |
  |       |         | turns RED and reads "Live payments are ON — real money moves at checkout."               |
  |       |         | (AdminFrame.tsx:380-386, i18n `banner.live`) — the yellow sandbox notice is gone;        |
  |       |         | Settings says "PayPal LIVE connected".                                                   |
  | 15–22 | Charles | ⚠️ REAL PURCHASE. Start `vercel logs --follow --deployment <new-prod-url>` in a second    |
  |       |         | tab (the stream stops after 5 minutes, vercel.com/docs/cli/logs — restart it at minute   |
  |       |         | 20). Charles buys the cheapest real product with CHARLES'S own card via the card fields  |
  |       |         | (if P2 approved), else via his own PayPal wallet — the boss cannot pay himself. Do not   |
  |       |         | edit live prices to make a $1 item.                                                      |
  |       |         | ⚠️ Your PayPal account's address is in Sydney. PayPal ships to the address on the PayPal  |
  |       |         | account, not the one typed in checkout, so the wallet test is charged the zone rate the  |
  |       |         | owner set for AU in P6; if no zone covers AU the wallet test stops before any money      |
  |       |         | moves (§5.3 step 2 answers 409) — then test the wallet rail from a PayPal account with a |
  |       |         | US address, or accept a card-fields-only acceptance (the card rail's ship-to is the US   |
  |       |         | address typed in checkout). P11 settles this days before.                                |
  |       |         | Check: [PayPal business account] Activity → payment received, fee shown;                 |
  |       |         | [/admin] order paid, provider paypal, card brand + last4 (or wallet), timeline, stock    |
  |       |         | movement, customer; Charles's inbox → confirmation e-mail; boss's inbox → owner alert;   |
  |       |         | [PayPal Developer Dashboard] Live → Webhooks Events → COMPLETED delivered (200,          |
  |       |         | outcome duplicate). Second purchase via the OTHER rail if both exist (→ two orders to    |
  |       |         | cancel in the next step).                                                                |
  | 22–27 | Charles | ⚠️ CANCEL EVERY acceptance order (one per rail tested) from /admin: order → Cancel → tick |
  |       |         | BOTH `Refund payment` and `Restock items` → reason `launch acceptance test` → confirm.   |
  |       |         | (Cancel-with-refund calls the same PayPal refund API as Refund, and also returns the     |
  |       |         | unit to stock and closes the order. Refund WITHOUT ticking Restock items leaves stock    |
  |       |         | down; Refund never closes the order — only Cancel does.)                                 |
  |       |         | [PayPal business account] Activity shows the refund; [/admin] status refunded, cancelled,|
  |       |         | stock movement back + "PayPal refund … synced by webhook" line. Cost of the test:        |
  |       |         | PayPal's original fee (refunds return no fees, §7.3) — a few cents to a dollar.          |
  | 27–30 | Both    | Decide: keep live, or roll back (§6.3). [PayPal business account] Activity shows a       |
  |       |         | refund for EACH acceptance payment. Update the records (§10). Announce to the other      |
  |       |         | boss: "the site is open for real orders".                                                |
  +-------+---------+------------------------------------------------------------------------------------------+
```

**§6.2a — the variable swap (minute 3–8), as one copy-pasteable block.** `vercel env add
--force` overwrites an existing variable for the same target (CLI 59.1.4), so no `rm && add`
pairs and no half-set gap between the two. Each `add` without `echo` blocks on a prompt —
paste the value from the password manager, Enter, next line.

```bash
# [Mac terminal] §6.2a — main repo dir. Have the LIVE id, secret and webhook id open in the password manager.
cd /Users/charles/Developer/goldrose-storefront
vercel whoami                                                              # vancechi
echo live | vercel env add PAYPAL_ENV production --no-sensitive --force    # exactly lowercase live
vercel env add PAYPAL_CLIENT_ID production --no-sensitive --force          # paste LIVE client id
vercel env add NEXT_PUBLIC_PAYPAL_CLIENT_ID production --no-sensitive --force   # SAME live client id
vercel env add PAYPAL_SECRET production --force                            # paste LIVE secret
vercel env add PAYPAL_WEBHOOK_ID production --force                        # paste LIVE webhook id (P5)
vercel env rm CHECKOUT_SKIP_PAYMENT production --yes                       # no-op if already gone
vercel env ls production                                                   # five PAYPAL_* names, no CHECKOUT_SKIP_PAYMENT
```

Live go-live requirements per PayPal: a verified Business account, live client id/secret from
the Live toggle, API host `api-m.paypal.com` (already selected by `PAYPAL_ENV`), no domain
allowlisting for the JS SDK. <https://developer.paypal.com/api/rest/production/>

### 6.3 Rollback (5 minutes)

`[Mac terminal]` swap the **five** values back to the sandbox set from the password manager
(the §6.2a block with `echo sandbox` and the sandbox values — same `vercel env add … --force`
form), redeploy with cache off, re-run the probes, confirm the yellow `/admin` sandbox banner
is back, not the red live one. Do **not** just change `PAYPAL_ENV`: a
sandbox id with a live host (or vice versa) fails every call. If the failure is in our code
rather than in PayPal, the alternative rollback is `CHECKOUT_SKIP_PAYMENT=1` +
`PAYPAL_ENV=sandbox` (config b) — the build refuses the flag together with `live`.

Orders taken while live stay real: never delete them; refund from `/admin` if needed.

> **Why (industry practice).** A cutover is a checklist with owners and a rollback written
> *before* you start, run at a quiet hour, with one hand on the logs. The acceptance test is
> a real transaction with your own money, immediately reversed — because only a real
> transaction proves the whole chain (bank, PayPal, our code, e-mail, admin) at once.

---

## 7. Operations after launch

### 7.1 Refunds

- **From `/admin`** (normal path): order → Refund (partial or full) or Cancel with refund +
  restock. `lib/admin/orders.ts:315-326` calls PayPal, updates the order, writes the
  timeline. **For any test order (acceptance purchase, sandbox order) use Cancel with both
  `Refund payment` and `Restock items` ticked**: Refund WITHOUT ticking Restock items leaves
  stock down, and Refund never closes the order — only Cancel does (the Refund dialog has its
  own Restock tick, `lib/admin/orders.ts:337-343`). Seconds later `PAYMENT.CAPTURE.REFUNDED`
  arrives and the webhook re-syncs `refunded_cents` from PayPal's cumulative
  `total_refunded_amount` — the two agree.
- **From the PayPal dashboard instead**: the webhook still syncs the order's status and
  amount (`refund_synced`), but **no restock** happens (restock is an admin-only action) and
  no admin actor is recorded. Prefer `/admin`; if a refund was issued in PayPal, restock by
  hand in `/admin` Products → Inventory.
- ⚠️ Refunds return no fees: "there are no fees to make the refund, but the fees you
  originally paid to receive the payment are not returned to you" (all three regions).
  <https://www.paypal.com/hk/webapps/mpp/merchant-fees>

### 7.2 Disputes, chargebacks, Seller Protection

```text
  INQUIRY (dispute) ── up to 20 days, buyer↔seller in the Resolution Center ──┐
      │ buyer escalates (or auto-closes)                                       │
  CHARGEBACK (claim) ── PayPal decides; seller normally 10 days to respond ────┤ webhooks:
      │                                                                        │ CUSTOMER.DISPUTE.CREATED
  PRE_ARBITRATION ── appeal #1 ── ARBITRATION ── appeal #2                     │ .UPDATED / .RESOLVED
  money actually leaves the balance → PAYMENT.CAPTURE.REVERSED                 ┘
```

- Respond in `[PayPal business account]` *Resolution Center* before `seller_response_due_date`
  (the webhook puts it in the order timeline). Evidence = tracking with delivery confirmation
  to the address on PayPal's Transaction Details page.
  <https://developer.paypal.com/docs/disputes/disputes-reference/> ·
  <https://www.paypal.com/us/cshelp/article/whats-the-difference-between-a-dispute-and-a-claim-help238>
- Fees — which one depends on the rail: **wallet** payments incur the *dispute* fee when a
  claim/chargeback is filed (HK HKD 65, 130 high-volume; US USD 15/30; waived for unescalated
  inquiries, amicable settlements, unauthorised-transaction claims filed with PayPal, and
  Seller-Protection-eligible cases); **ACDC card** payments incur the *chargeback* fee instead
  (HK HKD 75, AU AUD 15 — waived when Seller-Protection eligible, US USD 20) because "the
  Dispute Fee does not apply to transactions processed through … Advanced credit and debit
  card processing". Rule: help349
  <https://www.paypal.com/us/cshelp/article/what-is-the-paypal-dispute-fee-and-why-was-i-charged-one-help349>;
  amounts: the regional fee pages linked under the §7.3 table.
- ⚠️ **Seller Protection exclusion for HK/AU sellers:** "Payments not processed through a
  buyer's PayPal account, including PayPal Guest Checkout payments and Standard Credit and
  Debit Card Payments where the seller's account is registered in … China, Hong Kong,
  Australia …" are NOT eligible. ACDC card payments fall instead under the Online Card
  Payment Services Agreement's chargeback/fraud protection tools; 3DS `liability_shift:
  POSSIBLE` shifts fraud liability to the issuer per transaction; the paid **Chargeback
  Protection** add-on (HK 0.7% — "Effortless" variant 1%; AU/US 0.40% per card sale) is
  the only way to have PayPal absorb fraud chargebacks on cards without 3DS (D15: NOT at
  launch, revisit after 90 days of volume). Confirm with PayPal before promising the boss
  anything.
  <https://www.paypal.com/hk/legalhub/paypal/seller-protection> ·
  <https://www.paypal.com/hk/legalhub/paypal/pocpsa-full>
- Add the carrier tracking number to the PayPal transaction after shipping (manually in
  PayPal, or via the Orders v2 tracking API later): it is evidence *and* it releases
  new-seller holds faster (§7.3).

### 7.3 Payouts to the HK/AU bank, currency, holds

- USD sits as a USD balance in an HK account. Withdraw **HKD only** to a Hong Kong bank
  (Standard 3–5 working days; free at ≥ HKD 1,000, else HKD 3.50; Instant 1%, min HKD 10,
  max HKD 100) or **USD** to a linked **US** bank at 3.00%. Converting to HKD costs 3.00%
  above the base rate. <https://www.paypal.com/hk/legalhub/paypal/useragreement-full> ·
  <https://www.paypal.com/hk/cshelp/article/how-do-i-withdraw-funds-from-my-paypal-account-help394>
- AU accounts opened after 11 Oct 2023 auto-convert incoming non-AUD payments unless the
  receiving preference is changed; conversion 3.0%; withdrawal to a US account 3.0%.
  <https://www.paypal.com/au/legalhub/paypal/cfsgpds-full>
- ⚠️ **New-seller holds:** "PayPal holds the initial payments you receive for up to 21
  days". Confirmed identity/bank/phone, tracking from an approved carrier (release ~24 h
  after delivery) and history shorten it; PayPal reviews monthly.
  <https://www.paypal.com/us/cshelp/article/new-paypal-account-%E2%80%93-payments-on-hold-and-accessing-your-money-quicker-help848>

```text
  FEES — receiving side is the boss's account country; a US buyer paying an HK/AU account is INTERNATIONAL
  +---------------------------+------------------------+------------------------+----------------------+
  |                           | HK (eff. 7 Aug 2025)   | AU (page eff. 23 Jul   | US (updated 1 Sep    |
  |                           |                        | 2026)                  | 2026) reference      |
  +---------------------------+------------------------+------------------------+----------------------+
  | Wallet, domestic          | 3.90% + fixed          | 2.90% + fixed          | 3.49% + 0.49 USD     |
  | Wallet, international     | +0.50%                 | +1.00%                 | +1.50%               |
  | ACDC card, domestic       | 3.40% + fixed          | 1.50% + fixed          | 2.89% + 0.29 USD (*) |
  | ACDC card, international  | +0.70%                 | +2.10%                 | +1.50%               |
  | Fixed fee, paid in USD    | 0.30 USD (2.35 HKD)    | 0.30 USD (0.30 AUD)    | see above            |
  | Currency conversion       | 3% (received) / 4%     | 3% / 4%                | 3% / 4%              |
  | Chargeback fee            | 75 HKD                 | 15 AUD                 | 20 USD               |
  | Dispute fee std / high-vol| 65 / 130 HKD           | not listed separately  | 15 / 30 USD          |
  | Withdraw to local bank    | free ≥ 1,000 HKD       | not listed as a fee    | —                    |
  | Withdraw USD to US bank   | 3.00%                  | 3.00%                  | —                    |
  | Chargeback Protection     | 0.7% / 1%              | 0.40%                  | 0.40% / 0.60%        |
  | (std / Effortless)        |                        |                        |                      |
  | Refund                    | no fee; original fees NOT returned (all regions)                       |
  +---------------------------+------------------------+------------------------+----------------------+
  HK https://www.paypal.com/hk/webapps/mpp/merchant-fees · AU https://www.paypal.com/au/business/paypal-business-fees
  US https://www.paypal.com/us/webapps/mpp/merchant-fees   (fee pages change without notice — re-read before quoting)
  (*) US fixed fee: 0.49 USD is for commercial (wallet) transactions; "PayPal Card Payment Services … Advanced Credit
      and Debit Card Payments and Virtual Terminal" carry 0.29 USD (US page, updated 1 Sep 2026).

  Worked example, HK account, US buyer pays USD 100 by wallet: (3.90 + 0.50)% + 0.30 = USD 4.70 fee → 95.30 held
  as USD; converting to HKD to withdraw costs a further 3% (~2.86) → ~92.4% reaches the HK bank.
  Same sale by card: (3.40 + 0.70)% + 0.30 = USD 4.40. AU by card: (1.50 + 2.10)% + 0.30 = USD 3.90.
```

### 7.4 Webhook failures and PayPal retries

- Any non-2xx → PayPal retries up to 25 times over 3 days, then marks the event Failed; the
  Webhooks Events dashboard (Live tab, 30-day filter) has **Resend**.
  <https://developer.paypal.com/api/rest/webhooks/> ·
  <https://developer.paypal.com/api/rest/webhooks/events-dashboard>
- Our 401 = signature not verified (wrong/missing `PAYPAL_WEBHOOK_ID`, wrong environment, or
  a simulator event). Our 500 = handler threw (`[webhooks/paypal]` in logs) — fix, then
  Resend; the handler is idempotent.
- Deliveries are unordered and may duplicate; every handler dedupes (order id, refund id,
  dispute id + event id).

### 7.5 Reading Vercel logs for `/api/paypal/*`

`[Vercel dashboard]` Project → *Logs* → Environment production → **Route** filter
`/api/paypal/create`, `/api/paypal/capture`, `/api/webhooks/paypal` → Level Error → *Live
mode* to tail. A row's panel shows Request Id, status, duration, **Outgoing Requests** (the
calls to `api-m.paypal.com`) and log messages. `console.error` → Error level; failed
signature checks are silent 401s (filter by status code). <https://vercel.com/docs/logs/runtime>

```bash
# [Mac terminal] main repo dir
vercel logs --environment production --level error --since 1h --expand
vercel logs --environment production --query "paypal/capture" --since 24h --expand
vercel logs --environment production --status-code 401 --since 1h        # rejected webhook posts
vercel logs --follow --deployment <current-production-deployment-url>     # live stream, 5 minutes
```

⚠️ **Hobby retention is 1 hour** (Pro 1 day). A problem you learn about tomorrow has no
logs. **D16 decides this:** we stay on Hobby at launch; `vercel logs --follow` runs in a
second tab during every acceptance purchase (the stream stops after 5 minutes — restart
it); and Phase D writes every payment anomaly (drift, reject, pending, dispute) into
`order_events`, so the **database, not Vercel, is the record**. Pro ($20/seat/mo) would buy
23 more hours of logs, not a record; revisit it — or a Log Drain
(<https://vercel.com/docs/drains>) — when order volume makes tailing impractical.

### 7.6 Playbook: money moved but there is no order

1. `[PayPal business account]` Activity shows a payment; `[/admin]` has no order for that
   buyer/amount.
2. `[PayPal Developer Dashboard]` Live → Webhooks Events → find `PAYMENT.CAPTURE.COMPLETED`
   for that capture. Pending/Failed? Click **Resend** → expect 200 `{"outcome":"repaired"}`
   → order appears with the "repaired" timeline line. Done.
3. Delivered but `{"outcome":"ignored"}`? Then no `checkouts` row matches the PayPal order id
   (the create route's DB write failed, or the row is `rejected` from a drift/3DS stop — in
   which case the refund already happened, check Activity). Check `vercel logs` for
   `[paypal/create]` / `[paypal/capture]` errors within the hour.
4. Still nothing: create a **draft order** in `/admin` for the buyer with the real lines,
   *Mark as paid*, and add a timeline comment with the PayPal capture id and Debug ID — the
   customer paid and must receive the goods. Refund from PayPal **only if the stock is
   gone**; then e-mail the buyer. Never leave money without a record.
5. If PayPal support is needed, give them the **Debug ID** from the dashboard API-call log.

### 7.7 Secret rotation

An app can hold at most **two** client secrets, each **Enabled** or **Disabled**; a deleted
secret "cannot be Enabled or recovered back". The process (PayPal Tech Blog):

1. `[PayPal Developer Dashboard]` app page → client-secret block → generate a **second**
   secret alongside the Enabled one (max two).
2. `[Mac terminal]` `vercel env add PAYPAL_SECRET production --force` (paste the new secret
   at the prompt; `--force` overwrites in place) → redeploy (§4.3) → confirm with a probe /
   purchase.
3. Set the **old** secret to **Disabled** (reversible — re-enable if anything breaks).
4. After a day, **delete** it (irreversible).

Button wording on the page changes; the states Enabled / Disabled / deleted are the
contract. `lib/paypal/client.ts` fetches a fresh OAuth token per call, so nothing is cached.
Rotate on any suspected leak, when a person with access leaves, and yearly.
<https://medium.com/@paypaltech/feature-release-credential-rotation-on-developer-portal-to-enhance-app-security-ba5d8d7e734b>
<https://developer.paypal.com/security-guidelines>

### 7.8 Sandbox-vs-live confusion guardrails

- `/admin` banner: "Test mode — …" when `PAYPAL_CLIENT_ID` is missing; "PayPal sandbox mode
  — …" when it is set and `PAYPAL_ENV` is not exactly `live`; red "Live payments are ON — …"
  when it is (`app/admin/(dashboard)/layout.tsx:16-21`, `AdminFrame.tsx:380-386`); *Settings*
  shows the mode and client-id tail.
- The reliable sandbox tell is **time**: every paypal order placed before the §6.2 redeploy
  is sandbox (A9). Buyer e-mails ending `@personal.example.com` and `raw` JSON linking to
  `sandbox.paypal.com` are only a secondary hint — the A2 buyer uses a real inbox.
- The five variables change **together**; Preview never gets live values; `.env.local` on the
  Mac never gets live values (a local dev server against live keys could charge a card).
- `PAYPAL_ENV` is trimmed then compared to the exact lowercase string `live`
  (`lib/paypal/client.ts:28`): `Live` and `LIVE` fall to sandbox, but `live ` (stray space)
  **IS live**. ⚠️ The `/admin` banner (`app/admin/(dashboard)/layout.tsx:20`) compares
  **without** trimming and the build gate (`scripts/validate-env.mjs:60`) lower-cases, so a
  value other than plain `live` / `sandbox` makes the three readers disagree — the banner
  can say sandbox while money is live. Always paste exactly `live` or `sandbox`;
  `vercel env ls` will not show whitespace, so re-add the variable if in doubt. Repo
  follow-up: make `layout.tsx` read `getPayPalConfig().env` instead of `process.env` itself.
- Mock header / negative testing / `buyer-country` are sandbox-only; expect nothing from them
  live. <https://developer.paypal.com/tools/sandbox/negative-testing/>

---

## 8. Troubleshooting

```text
  +------------------------------------------+------------------------------------------+-------------------------------------------------+
  | Symptom                                  | Cause                                    | Fix                                             |
  +------------------------------------------+------------------------------------------+-------------------------------------------------+
  | POST /api/paypal/create → 503 "PayPal is | PAYPAL_CLIENT_ID or PAYPAL_SECRET absent | Set both in THAT environment, redeploy          |
  | not configured."                         | in this deployment (create/route.ts:33)  | (§4.2–4.3); env changes need a new deployment   |
  | PayPal button never renders; mock card   | NEXT_PUBLIC_PAYPAL_CLIENT_ID missing, or | Set it (same value as PAYPAL_CLIENT_ID);        |
  | form shows                               | stale build (inlined at next build)      | redeploy with cache off; view-source to verify  |
  | Mock form shows AND /api/checkout says   | Server pair set, NEXT_PUBLIC_ missing →  | Same fix; this is the "dead checkout" trap      |
  | "Mock checkout is disabled"              | page.tsx:46-51 vs checkout/route.ts:64   | (page.tsx:46-51)                                |
  | Every webhook → 401 "Invalid signature"  | PAYPAL_WEBHOOK_ID empty; or it is the    | Copy the right app's Webhook ID into the right  |
  |                                          | other environment's id; or a simulator   | env; test with a real sandbox purchase, not the |
  |                                          | event                                    | simulator (§3.3)                                |
  | Webhook → 500 "Handler failed"           | Handler threw (DB down, unexpected body) | vercel logs → fix → PayPal retries / Resend     |
  | "Payment not completed (status: PENDING)"| Capture pending: fraud review, boss's    | Boss accepts in PayPal or changes Payment       |
  |                                          | receiving preference, unconfirmed e-mail | preferences; wait for COMPLETED/DECLINED        |
  |                                          |                                          | webhook; Phase D turns this into a pending order|
  | "PayPal auth failed (401)" in logs       | Secret wrong, or sandbox credentials with| Check PAYPAL_ENV against the credential set; all|
  |                                          | PAYPAL_ENV=live (or the reverse)         | five vars must be from the same environment     |
  | Sandbox buyer login loops / "Things      | Real paypal.com session in the same      | Private window; sandbox.paypal.com credentials; |
  | don't appear to be working"              | browser; pop-up blocked; wrong password  | reset password under Sandbox Accounts → Profile |
  | Card fields never appear, no error       | isEligible() false: ACDC not ticked on   | Tick Features → Accept payments (sandbox);      |
  |                                          | the sandbox app / live not approved; or  | wait for live approval; check components=       |
  |                                          | components=card-fields missing           | in the script URL                               |
  | Console: "Refused to load … Content      | A CSP was added without PayPal's hosts   | Add *.paypal.com *.paypalobjects.com            |
  | Security Policy"                         |                                          | *.venmo.com per §5.1; COOP same-origin-allow-   |
  |                                          |                                          | popups                                          |
  | Log line "[paypal/capture] amount        | Price edited between create and capture  | Today: compare order vs PayPal amount, refund   |
  | mismatch: captured X, priced Y"          | (today's code records the order anyway)  | the difference by hand. Phase D: re-price +     |
  |                                          |                                          | PATCH pre-capture (D17), refund only as fallback|
  | Two orders for one buyer                 | Buyer paid twice (two PayPal orders) —   | Refund one from /admin. A true duplicate for    |
  |                                          | idempotency is per provider_order_id     | ONE capture cannot happen (createOrder :160-168)|
  | "Unknown checkout." from capture         | checkouts row missing (create's DB write | Money was captured: refund from PayPal or       |
  |                                          | failed) or a different deployment/DB     | create a draft order; check vercel logs         |
  | Build fails "[env] CHECKOUT_SKIP_PAYMENT | The flag survived the live switch        | vercel env rm CHECKOUT_SKIP_PAYMENT production  |
  | is set while PAYPAL_ENV=live"            | (validate-env.mjs:62-71, deliberate)     | --yes → redeploy                                |
  | PayPal Webhooks Events: pending/Failed   | URL is a *.vercel.app deployment URL     | Use https://eldreve.com/…; Resend after fixing  |
  |                                          | (SSO-protected) or tunnel is down        |                                                 |
  | /admin refund: "PayPal is not configured | Running with no PayPal keys (local       | Refund from the deployment that has keys, or    |
  | — cannot refund a real payment."         | without .env.local vars)                 | set the sandbox vars locally                    |
  | /admin refund fails after the live flip  | Capture id belongs to sandbox            | It is a sandbox order: cancel/archive;          |
  | for an old order                         |                                          | never refund sandbox ids against live (A9)      |
  | vercel env: "not linked" / wrong project | Ran from a worktree                      | cd /Users/charles/Developer/goldrose-storefront |
  | cloudflared URL stopped working / 429    | Quick tunnel restarted (new URL) / 200   | Restart, paste the new URL into the sandbox     |
  |                                          | in-flight cap                            | webhook; move to eldreve.com for anything long  |
  | PayPal-Mock-Response header ignored      | Negative Testing not On for that sandbox | Sandbox Accounts → business → Settings →        |
  |                                          | business account; or sent from browser   | Negative Testing On; header is server-side only |
  | Card declines with CCREJECT-* not firing | NameField not rendered / name not passed | Keep NameField in the form; names are           |
  |                                          |                                          | case-sensitive                                  |
  | No 3DS challenge in sandbox              | SCA_WHEN_REQUIRED + US buyer = no mandate| Expected; PAYPAL_3DS_METHOD=SCA_ALWAYS (sandbox |
  |                                          |                                          | only) for rows 4–6 of §5.5                      |
  | Sandbox wallet purchase → 409 "Prices    | Buyer's PayPal address is outside the    | Use the US buyer from A2; live: see §6.2 min    |
  | changed…" / "We don't ship to AU." /     | zone the cart was priced for (the        | 15–22 and P11                                   |
  | amount-mismatch log                      | default Personal sandbox account is in   |                                                 |
  |                                          | YOUR country, A2)                        |                                                 |
  +------------------------------------------+------------------------------------------+-------------------------------------------------+
```

---

## 9. Glossary

```text
  +--------------------------+-------------------------------------------------------------------------------+
  | Term                     | Meaning here                                                                  |
  +--------------------------+-------------------------------------------------------------------------------+
  | Capture vs authorize     | Authorize = the bank promises the money; capture = actually take it. Our      |
  |                          | orders use intent CAPTURE: approval + capture in one step, in /api/paypal/    |
  |                          | capture. Money moves at capture and nowhere else.                             |
  | Idempotency              | Doing it twice has the effect of doing it once. PayPal-Request-Id on create/  |
  |                          | capture/refund (PayPal keeps the key for a per-API period; the only published |
  |                          | figure is 45 days for Payments v2 refunds — developer.paypal.com/api/rest/    |
  |                          | requests/) plus provider_order_id UNIQUE on orders make retries and           |
  |                          | redeliveries harmless.                                                        |
  | Webhook                  | PayPal calling US, unprompted, over HTTPS to report an event. Our safety net  |
  |                          | when the browser or our request path died. Verified by asking PayPal.         |
  | Webhook ID               | Identifier of one webhook subscription (URL + events) under one app; the      |
  |                          | verify call needs it. Sandbox and live webhooks have different ids.           |
  | Client id / secret       | Per-app credential pair. Id = public (in every page's HTML); secret = server- |
  |                          | only, exchanged for a short-lived OAuth token on each call.                   |
  | Sandbox / live           | Two separate PayPal worlds with separate apps, accounts, money (fake vs       |
  |                          | real), webhooks and API hosts (api-m.sandbox.paypal.com / api-m.paypal.com).  |
  |                          | The JS SDK URL is the same; the client id picks the world.                    |
  | ACDC                     | Advanced (a.k.a. Expanded) Credit and Debit Card Payments — PayPal's card     |
  |                          | processing with PayPal-hosted card fields; needs per-account approval live.   |
  | Card Fields / hosted     | Each card input is an <iframe> served by PayPal; the digits never exist in    |
  | fields                   | our page's JavaScript or on our server.                                       |
  | 3DS / SCA                | 3-D Secure = the card networks' buyer authentication (bank challenge). SCA =  |
  |                          | Strong Customer Authentication, the EU/UK rule that mandates it. We run       |
  |                          | SCA_WHEN_REQUIRED.                                                            |
  | Liability shift          | When 3DS succeeds (POSSIBLE), fraud-chargeback liability moves from us to the |
  |                          | card issuer. NO/UNKNOWN = it stays with us.                                   |
  | Chargeback / dispute     | Dispute = buyer opens a case with PayPal (inquiry → claim). Chargeback = the  |
  |                          | card issuer pulls the money back. Both arrive as CUSTOMER.DISPUTE.* events;   |
  |                          | the money leaving is PAYMENT.CAPTURE.REVERSED.                                |
  | Seller Protection        | PayPal's policy covering some wallet payments (unauthorized / not received)   |
  |                          | when you ship to the PayPal address with tracking. Excludes guest/standard    |
  |                          | card payments for HK/AU sellers.                                              |
  | PCI DSS / SAQ A          | The card industry's security standard. SAQ A is the lightest self-assessment, |
  |                          | for merchants whose page embeds the processor's hosted fields and never       |
  |                          | touches card data. Today's mock form would put us OUTSIDE it.                 |
  | PENDING capture          | PayPal accepted the payment but has not completed it (review, receiving       |
  |                          | preference, eCheck). Do not ship; wait for COMPLETED or DECLINED.             |
  | Repair path              | webhook.ts: a COMPLETED event with no matching order rebuilds it from the     |
  |                          | checkouts row saved before payment started.                                   |
  | Quick tunnel             | cloudflared's throwaway public HTTPS URL forwarding to localhost:3000.        |
  | Redeploy                 | Building a new immutable Vercel deployment from the same commit so new env    |
  |                          | values take effect.                                                           |
  | PAN                      | Primary Account Number — the full card number. Must never reach our server or |
  |                          | logs; only PayPal's iframes see it.                                           |
  | Luhn check               | A checksum that tells a well-formed card number from a typo; it proves        |
  |                          | nothing about whether the card exists or has money — the mock form only does  |
  |                          | this.                                                                         |
  | OAuth access token       | A short-lived bearer string PayPal issues in exchange for client id + secret; |
  |                          | our server gets a fresh one per call (§3.5 TOKEN=…).                          |
  | KYC                      | Know Your Customer — the identity/business checks PayPal runs on the account  |
  |                          | owner before releasing money.                                                 |
  | Vercel SSO / Deployment  | Login wall Vercel puts in front of *.vercel.app deployment URLs on Hobby; the |
  | Protection               | custom domain eldreve.com is never behind it.                                 |
  | Hobby / Pro              | Vercel's free and $20/seat plans; the difference that matters here is log     |
  |                          | retention (1 h vs 1 day).                                                     |
  | Debug ID                 | PayPal's per-request id shown in the dashboard API-call log and the           |
  |                          | PayPal-Debug-Id response header; the first thing PayPal support asks for.     |
  +--------------------------+-------------------------------------------------------------------------------+
```

---

## 10. Repo bookkeeping — what changes at each phase

Status lives in feature front matter (CI: `npm run features:check`, roadmap regenerated with
`npm run features:roadmap`). This guide never carries status; update these when a phase
completes.

```text
  +--------+------------------------------------------------------------------------------------------------+
  | Phase  | Records to touch                                                                               |
  +--------+------------------------------------------------------------------------------------------------+
  | A      | docs/features/paypal-wallet.md: Context — "sandbox credentials exist (Charles's developer      |
  |        | login); first sandbox purchase + refund on <date>". Password manager: sandbox app item.        |
  | B      | paypal-wallet.md: webhook id per environment noted (no values); the repair-path test date.     |
  |        | SUMMARY.md Environment: "cloudflared installed" (replaces "No cloudflared/ngrok").             |
  | C      | paypal-wallet.md front matter: rollout stays `test-deployment` but the Context note that       |
  |        | "no PAYPAL_* variable is set in Vercel" is now false — rewrite it: Production runs sandbox.    |
  |        | SUMMARY.md Release queue item 2 → done (sandbox configured, ACDC onboarding begun).            |
  | D      | card-payments.md: front matter delivery `in-progress`; Plan: stage 2 says 0004 → 0015; stage   |
  |        | 3 drop "client-token route"; Blockers: drop "individual card brands can need activation";      |
  |        | Options table: "Powered by PayPal mark" con → "disclosure sentence required".                  |
  |        | ⚠️ database-migrations.md: refresh the Applied-state table — correct the stale "0012 NOT        |
  |        | pushed" row (0012 is live), add rows for 0013 and 0014 (already in supabase/migrations/), then |
  |        | the 0015 row — only after the pre-push dump in §5.2 exists and `supabase db push` succeeded on |
  |        | the LIVE database. card-payments.md stage 6: mark OQ-1 closed in docs/admin-design.md §4 and   |
  |        | delete the Shopify-era comments in app/checkout/* and lib/paypal/* while Phase D is open.      |
  |        | .env.example: already lists PAYPAL_ENV/CLIENT_ID/SECRET/WEBHOOK_ID/NEXT_PUBLIC_…/SKIP —        |
  |        | add PAYPAL_MOCK_CAPTURE_ISSUE and PAYPAL_3DS_METHOD if §5.5 is implemented (sandbox-only).     |
  | E      | paypal-wallet.md: delivery `accepted`, rollout `live`, verification.human = date, person,      |
  |        | order name + refund evidence. card-payments.md: delivery `uat`/`accepted`, rollout `live`,     |
  |        | acceptance boxes ticked. SUMMARY.md Release queue item 5 → done; "Where things stand" updated. |
  |        | agent-delivery/INBOX.md AI-033 → closed via the agent-inbox CLI once the registration number   |
  |        | and postal address are in PayPal and /admin settings.                                          |
  | ops    | .ai/WORKLOG.md entry per phase (append only). Never edit docs/Database.md unless asked.        |
  +--------+------------------------------------------------------------------------------------------------+
```

---

## Appendix A — Environment-variable matrix

```text
  +----------------------------+-------------------+---------------------+---------------------+---------------------+
  | Variable                   | Mac .env.local    | Vercel Preview      | Vercel Production   | Vercel Production   |
  |                            | (Phases A–D)      | (from Phase C)      | Phase C (sandbox)   | Phase E (LIVE) ⚠️   |
  +----------------------------+-------------------+---------------------+---------------------+---------------------+
  | PAYPAL_ENV                 | sandbox           | sandbox             | sandbox             | live  (exact)       |
  | PAYPAL_CLIENT_ID           | sandbox id        | sandbox id          | sandbox id          | live id             |
  | NEXT_PUBLIC_PAYPAL_CLIENT_ID | = PAYPAL_CLIENT_ID | = PAYPAL_CLIENT_ID | = PAYPAL_CLIENT_ID | = live id          |
  | PAYPAL_SECRET (sensitive)  | sandbox secret    | sandbox secret      | sandbox secret      | live secret         |
  | PAYPAL_WEBHOOK_ID (sens.)  | tunnel webhook id | any sandbox id      | eldreve.com sandbox | eldreve.com LIVE    |
  |                            |                   | (never delivered to)| webhook id          | webhook id          |
  | CHECKOUT_SKIP_PAYMENT      | unset / commented | unset               | REMOVED             | REMOVED (build gate)|
  | PAYPAL_MOCK_CAPTURE_ISSUE  | optional (§5.5)   | optional            | never               | never (ignored live)|
  | PAYPAL_3DS_METHOD          | optional (§5.5)   | optional            | never               | never (ignored live)|
  +----------------------------+-------------------+---------------------+---------------------+---------------------+
  Rule: the five PAYPAL_* values in one column always come from the SAME PayPal app. Mixed = every capture fails.
```

## Appendix B — Webhook event list (copy into the PayPal form)

Tick these under *Event types* for **both** the sandbox webhooks and the live webhook
(<https://developer.paypal.com/api/rest/webhooks/event-names/>):

```text
  Payments v2                              Handled today
    PAYMENT.CAPTURE.COMPLETED                yes — confirm / repair
    PAYMENT.CAPTURE.REFUNDED                 yes — refund sync
    PAYMENT.CAPTURE.PENDING                  Phase D
    PAYMENT.CAPTURE.DECLINED                 Phase D  (v2 name)
    PAYMENT.CAPTURE.REVERSED                 Phase D
  Payments v1
    PAYMENT.CAPTURE.DENIED                   Phase D  (v1 name of DECLINED — tick it too; same handler)
  Orders v2 / Checkout
    CHECKOUT.PAYMENT-APPROVAL.REVERSED       Phase D  (log only)
  Disputes
    CUSTOMER.DISPUTE.CREATED                 Phase D
    CUSTOMER.DISPUTE.UPDATED                 Phase D
    CUSTOMER.DISPUTE.RESOLVED                Phase D

  Do NOT tick "All events": unhandled events return {"outcome":"ignored"} with 200 today, so
  they are harmless, but they bury the deliveries you need to read.
```
