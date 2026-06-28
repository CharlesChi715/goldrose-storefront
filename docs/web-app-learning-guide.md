# How This Web App Works — A Top-to-Bottom Learning Guide

This guide is written for you: you understand the rough shape of a web store
(click a product → place an order → see a payment page → pay), but you want to
know what *actually gets built* to make that happen, layer by layer.

We'll start at the highest level (the big picture) and go down to the actual
code in *this* repo. Every section points at real files so you can read along.

> **One correction up front.** Your current mental model includes a step like
> "store the payment/card details in a JSON file." **Do not ever do this.**
> Storing raw card numbers is illegal-grade dangerous (it's governed by a
> standard called PCI-DSS) and no real store does it. Instead you hand the
> customer off to a payment company (Shopify or Stripe) that collects the card
> on their own secure page. We'll cover exactly how in
> [Level 6](#level-6-payments-done-properly). Keep reading — this is the single
> most important idea in the whole guide.

---

## Level 0: Your mental model, refined

Here's your model, and the corrected version side by side:

| Your version | What really happens |
|---|---|
| Click product | ✅ Correct — a click in the browser |
| Place order (jump page) | Partly — first the cart is built, then you *redirect* to a checkout page |
| Show payment page | ✅ But the payment page is **hosted by Shopify/Stripe**, not built by you |
| Store card details in JSON | ❌ **Never.** You never see or store the card. The payment company does. |
| Use an API to finalize payment | ✅ Mostly — but "finalizing" happens via a **webhook**, which we'll explain |

So three of your five steps are right. The two corrections (don't store cards;
the payment page isn't yours) are what this guide will make concrete.

---

## Level 1: What a web app fundamentally is

At the bottom, every web app is two computers talking:

- **The client** — the customer's web browser (Chrome, Safari…). It runs on
  *their* device.
- **The server** — a computer you control (or rent from Vercel, etc.). It runs
  *your* code.

They talk using **HTTP**, a request/response protocol:

```
Browser  ──── "GET me the homepage" ───────────────▶  Server
Browser  ◀──── "here's the HTML/CSS/JS" ───────────   Server

(later, when the customer clicks Checkout)

Browser  ──── "POST this cart to /api/shopify/cart" ▶  Server
Browser  ◀──── "here's a cart + a checkout URL" ────   Server
```

Key facts to internalize:

1. **Every interaction is a request and a response.** Loading a page, clicking
   checkout, submitting an email — each is a separate round trip.
2. **The browser and the server are different machines.** Code on the browser
   *cannot* directly read your database or your secret keys. That separation is
   not an inconvenience — it's the security model. (This is exactly why card
   handling lives on the server / on Shopify, never in browser code.)
3. **A "page jump" is just the browser making a new GET request** to a different
   URL and replacing what it shows. When you "redirect to checkout," you're
   telling the browser: go GET this other URL now.

---

## Level 2: Frontend vs backend — what runs where

People say "frontend" and "backend." Concretely:

- **Frontend (client-side):** HTML structure, CSS styling, and JavaScript that
  runs *in the browser*. It handles what the user sees and clicks: opening the
  cart drawer, changing quantities, showing a loading spinner. In this repo
  that's mostly `components/Storefront.tsx`.
- **Backend (server-side):** code that runs on *your* server. It does things the
  browser is not allowed/trusted to do: talk to Shopify with a secret token,
  validate input, talk to a database. In this repo that's the files under
  `app/api/…` and `lib/shopify/…`.

**Why split at all?** Two reasons that matter for your store:

1. **Trust.** Anything in the browser can be read and edited by the user (open
   dev tools → you can see all the frontend code and even change prices on
   screen). So the *real* price, the *real* secret keys, and the *real* order
   creation must happen on the server where the user can't touch them.
2. **Secrets.** Your Shopify access token (see `lib/shopify/config.ts`) must
   never reach the browser, or anyone could use it. So the call to Shopify is
   made from the server.

> **Beginner idea:** If something must be trusted or secret, it belongs on the
> server. If it's just about what the user sees and clicks, it can live in the
> browser.

---

## Level 3: The framework — Next.js (the App Router)

You *could* build all this with raw HTML files and a hand-written server. A
**framework** like Next.js gives you conventions so you don't reinvent
everything. This project uses Next.js with the "App Router." The three pieces
you need to know:

### 3a. Pages come from the `app/` folder
A file at `app/page.tsx` automatically becomes the homepage (`/`). A file at
`app/layout.tsx` is the shared wrapper (title, fonts, `<html>`/`<body>`). You
don't wire up routes manually — the folder structure *is* the routing.

### 3b. Server Components vs Client Components
This is the one Next.js concept that confuses everyone, so go slow:

- **Server Component (the default):** runs on the server, produces HTML, and
  ships *no interactivity*. Great for static content. `app/page.tsx` is one.
- **Client Component:** has `"use client"` at the very top. It runs in the
  browser and can use interactivity — React state, click handlers, etc.
  `components/Storefront.tsx` is a client component because the cart needs to
  react to clicks.

> **Beginner idea:** `"use client"` at the top of a file means "this code needs
> to run in the browser because it's interactive." No `"use client"` = it runs
> on the server and is just output.

### 3c. API Routes — your backend endpoints
A file named `route.ts` inside `app/api/…` becomes a backend URL. This project
has `app/api/shopify/cart/route.ts`, which creates the endpoint
`POST /api/shopify/cart`. The browser calls it; it runs on the server.

> ⚠️ **This repo runs a non-standard Next.js version.** `AGENTS.md` warns that
> APIs may differ from what you'll find in tutorials online. When in doubt, read
> the bundled docs in `node_modules/next/dist/docs/` rather than a random blog.

---

## Level 4: This project's map

Here's the whole store as a diagram, with the real files:

```
                       BROWSER (client)
   ┌───────────────────────────────────────────────────────┐
   │  app/page.tsx          → renders the homepage (server) │
   │  components/Storefront.tsx ("use client")              │
   │     • shows products (from lib/products.ts)            │
   │     • cart drawer, quantities, subtotal                │
   │     • "Shopify Checkout" button → handleShopifyCheckout│
   └───────────────────────────┬───────────────────────────┘
                               │  fetch("POST /api/shopify/cart", {cart})
                               ▼
                        SERVER (your backend)
   ┌───────────────────────────────────────────────────────┐
   │  app/api/shopify/cart/route.ts                         │
   │     • validates & sanitizes the request                │
   │     • calls createShopifyCart(...)                     │
   │                                                        │
   │  lib/shopify/client.ts  → mock OR live switch          │
   │     • mock → lib/shopify/mock.ts (fake cart, no money) │
   │     • live → calls Shopify Storefront API (real)       │
   │  lib/shopify/config.ts  → reads env vars & secrets     │
   │  lib/shopify/types.ts   → the data shapes              │
   │  lib/products.ts        → product data & prices        │
   │  lib/business.ts        → shipping/returns assumptions │
   └───────────────────────────┬───────────────────────────┘
                               │  (live mode only)
                               ▼
                  SHOPIFY (a third-party company)
   ┌───────────────────────────────────────────────────────┐
   │  • holds the real products & prices                    │
   │  • returns a checkoutUrl                                │
   │  • hosts the actual payment page                        │
   │  • collects the card, charges it, creates the order     │
   └───────────────────────────────────────────────────────┘
```

The big realization: **your app never handles money or cards.** Its job is to
build a cart and then hand the customer to Shopify. Shopify is the part that
does the scary, regulated work.

---

## Level 5: Trace one real checkout, click to redirect

Let's follow a single "Shopify Checkout" click through every layer, using the
actual code.

### Step 1 — The click (browser, `components/Storefront.tsx`)
The button calls `handleShopifyCheckout()`. Simplified:

```ts
async function handleShopifyCheckout() {
  if (lines.length === 0) { /* show error, stop */ return; }
  setIsCheckingOut(true);                       // show a loading state

  const response = await fetch("/api/shopify/cart", {   // call OUR backend
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lines: lines.map((line) => ({
        merchandiseId: line.product.shopifyVariantId,   // WHICH product variant
        quantity: line.quantity,
        attributes: [{ key: "Gift option", value: line.option }, ...],
      })),
      buyerIdentity: { countryCode: "US" },
    }),
  });

  const result = await response.json();
  if (result.mode === "live") {
    window.location.assign(result.cart.checkoutUrl);    // THE PAGE JUMP
    return;
  }
  // mock mode: just show a message, no redirect
}
```

Two things to notice:
- It sends only **what** the customer wants (variant IDs + quantities), *not*
  prices. Prices are decided on the trusted side. (Never trust prices sent from
  the browser.)
- `window.location.assign(checkoutUrl)` is your "page jump" — but it jumps to a
  URL **Shopify gave us**, i.e. Shopify's own payment page.

### Step 2 — The endpoint receives it (server, `app/api/shopify/cart/route.ts`)
```ts
export async function POST(request: Request) {
  const body = await request.json();                 // parse the JSON
  const checkoutRequest = sanitizeCheckoutRequest(body);  // VALIDATE everything
  if (!checkoutRequest) return NextResponse.json({error: "..."}, {status: 400});

  const result = await createShopifyCart(checkoutRequest);  // do the work
  return NextResponse.json(result);                  // send result back
}
```
Notice the heavy validation (`sanitizeLine`, quantity limits of 1–20, trimming
strings). **Rule:** the server never trusts incoming data. The browser could
send anything (a malicious user, a bug), so the server checks it all.

### Step 3 — Mock or live? (`lib/shopify/client.ts`)
```ts
export async function createShopifyCart(request) {
  const config = getShopifyConfig();
  if (config.mode === "mock") {
    return createMockShopifyCart(request.lines);     // fake cart, no money
  }
  return createLiveShopifyCart(request);             // real Shopify call
}
```
This is the safety switch. By default (`config.ts`) the mode is `"mock"` unless
the env var `SHOPIFY_MODE=live` is set. So today, nothing real happens.

### Step 4a — Mock path (`lib/shopify/mock.ts`)
It looks up each product locally, computes a fake subtotal, and returns a
cart-shaped object plus warnings like *"No Shopify store, payment, tax, order, or
inventory action happened."* This lets you build and test the whole flow with
zero risk and zero accounts.

### Step 4b — Live path (`lib/shopify/client.ts`, `createLiveShopifyCart`)
This is where it talks to Shopify for real:
```ts
const response = await fetch(
  `https://${config.storeDomain}/api/${config.apiVersion}/graphql.json`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": config.storefrontAccessToken, // SECRET
    },
    body: JSON.stringify({ query: cartCreateMutation, variables: {...} }),
  },
);
```
- It sends a **GraphQL** query (`cartCreate`) — GraphQL is just a style of API
  where you ask for exactly the fields you want.
- It includes the **secret token** — which is why this *must* run on the server.
- Shopify replies with a cart that has a `checkoutUrl`.

### Step 5 — The redirect
Back in the browser, `window.location.assign(result.cart.checkoutUrl)` sends the
customer to Shopify's hosted checkout. **Your app's job is now done.**

So the entire "place order" you imagined is really: *build a validated cart on a
trusted server → get a checkout URL → send the browser there.*

---

## Level 6: Payments, done properly

This is the part your mental model had backwards, so here's the truth in detail.

### You never touch the card
When the customer reaches Shopify's checkout page, **they type their card into
Shopify's page, on Shopify's servers.** Your code, your server, and your
database never see the card number. This is deliberate:

- **PCI-DSS** is a security standard for anyone who handles card data. Meeting it
  yourself is expensive and risky. By letting Shopify (or Stripe) collect the
  card, *they* carry that burden, not you.
- A leaked card database is a company-ending event. The safest card data is the
  card data you never have.

> So your earlier step "store the payment detail in a JSON file" becomes:
> **store nothing about the card. Ever.** At most you store a *token* or an
> *order ID* that the payment company gives you — a reference, not the card.

### How you find out the payment succeeded: webhooks
After the customer pays on Shopify, how does your app *know*? Not from the
redirect (the customer could close the tab). The reliable way is a **webhook**:

```
Customer pays on Shopify  ──▶  Shopify sends a POST to YOUR server
                               e.g.  POST /api/webhooks/shopify
                               body: "order #1234 was paid"
Your server                ──▶  records the order, emails a receipt,
                                tells the warehouse to ship
```

A webhook is just "the other company calls *your* API to notify you of an
event." It's the inverse of you calling them. This repo doesn't have a webhook
endpoint yet — it's a natural next thing to build when you go live.

### The real order lifecycle
```
cart  →  checkout (card entered on Shopify)  →  payment authorized
      →  payment captured (money moves)  →  order created
      →  webhook tells your app  →  fulfillment (ship it)  →  delivered
      →  (maybe) refund / return
```
Most of the middle steps are Shopify's job. Your job is the cart (before) and
reacting to the webhook (after).

---

## Level 7: Where data actually lives

Your instinct to "store it in a JSON file" points at a real question: **where
does an app keep data?** Three tiers, from simplest to real:

1. **Hardcoded in code** — like `lib/products.ts` today. Fine for a fixed,
   tiny catalog. Changing it means editing code and redeploying.
2. **A JSON file on the server** — works for a hobby project, but it breaks the
   moment you have more than one server, two people editing at once, or a host
   (like Vercel) where the filesystem is temporary. So: okay for notes, **not**
   for orders or customers.
3. **A database** (Postgres, SQLite, etc.) — the real answer for orders,
   customers, inventory. It handles many simultaneous writes, querying, and
   durability. When this store goes live, *orders live in a database* (or
   simply stay inside Shopify, which has its own).

And again — **never** any card data in any of these tiers.

> **Beginner idea:** "Where should this data live?" depends on how often it
> changes, who writes it, and how bad it is to lose it. Catalog that rarely
> changes → code. Real orders → a database (or Shopify).

---

## Level 8: How to keep learning, in this repo

The best way to learn is to poke the real thing. Safe experiments, easiest
first:

1. **Run it.** `npm run dev`, open `http://localhost:3000`, add to cart, click
   checkout. Watch the mock message appear.
2. **Watch the network.** Open browser dev tools → Network tab → click checkout
   → click the `cart` request. You'll *see* the JSON your browser sent and the
   JSON the server returned. This makes Level 1 concrete.
3. **Add a `console.log`** inside `POST` in `route.ts`, re-run, check the
   terminal. Now you've seen server code run.
4. **Change a price** in `lib/products.ts` and watch it update. Then notice you
   *can't* permanently change it from the browser — only from this trusted file.
5. **Trace one value** end to end: pick `shopifyVariantId`, and follow it from
   `lib/products.ts` → the `fetch` body in `Storefront.tsx` → `sanitizeLine` in
   `route.ts` → `findProductByVariant` in `mock.ts`. Seeing one piece of data
   travel the whole stack teaches more than any article.

When you're ready for "live": you'd create real Shopify products, fill in real
variant IDs in `lib/products.ts`, set the env vars in `.env.local` (see
`docs/shopify-integration.md`), set `SHOPIFY_MODE=live`, and add a webhook
endpoint to record paid orders.

---

## Glossary (plain-language)

- **Client / frontend** — code running in the customer's browser.
- **Server / backend** — code running on your machine/host that the user can't see or edit.
- **HTTP request/response** — one round trip of "ask" and "answer" between them.
- **GET / POST** — request types. GET = "give me a page/data." POST = "here's data, do something."
- **API route / endpoint** — a backend URL your frontend can call (e.g. `/api/shopify/cart`).
- **Server Component** — Next.js code that runs on the server and outputs HTML (no interactivity).
- **Client Component** — Next.js code marked `"use client"` that runs in the browser (interactive).
- **Environment variable** — a secret/config value (like a token) kept out of the code, read at runtime.
- **GraphQL** — an API style where you request exactly the fields you want; Shopify uses it.
- **Redirect** — telling the browser to go load a different URL (the "page jump").
- **Hosted checkout** — a payment page run by Shopify/Stripe where the card is entered, not by you.
- **PCI-DSS** — the security standard for handling card data; the reason you offload payments.
- **Webhook** — when an outside service calls *your* API to notify you an event happened (e.g. "order paid").
- **Mock mode** — this repo's safe default: simulate the flow with no real store, money, or orders.

---

### Where to read next in this repo
- `README.md` — the project map and current status.
- `docs/shopify-integration.md` — concrete steps to connect a real Shopify store.
- `docs/mock-business-decisions.md` — which placeholder assumptions need real decisions.
- The five files traced in Level 5 — read them in that order with this guide open.
