# How This Web App Works — A Top-Down Learning Guide

Written for someone who knows IT basics and front-end basics but nothing about
the backend, Shopify, Next.js, or Node.js. It goes top-down: the big-picture
mental model first, then the website's functions one by one, and for each one
*how it's implemented and where it runs*. Every section points at real files so
you can read along.

---

## 0. First, the one mental model you need

There is no separate "backend server" in this project. That's the biggest thing to unlearn. In a classic setup you'd have:

- a **front end** (React in the browser), and
- a **separate backend** (a Node/Java/Python server + a database) elsewhere.

**Next.js collapses both into one app.** The same project contains code that
runs in three different places, and the whole game is knowing *which code runsgit 
where*:

| Where it runs | What it is here | Example files |
|---|---|---|
| **The browser** (client) | React UI, cart state, buttons | `components/Storefront.tsx`, `lib/cart/store.ts` |
| **The Next.js server** — this is "the backend" | Runs on Node.js. Renders pages, answers API calls, does trusted logic like pricing | `app/api/**/route.ts`, `lib/checkout/process.ts`, `lib/orders/store.ts` |
| **Shopify** (external, someone else's servers) | Real payments, real orders. Contacted over the internet | reached from `lib/shopify/client.ts` |

"Node.js" is just the runtime — the program that executes JavaScript on the
server instead of in a browser. When this guide says "the Next.js server," it
means *your* JavaScript running under Node.js (on Vercel). When it says
"Shopify," it means a company's API you call over HTTPS.

**The golden rule this codebase lives by:** anything a customer could tamper
with (the price, the cart) must be re-checked on the *server* before it matters.
You'll see that rule enforced over and over — it's the heart of "backend
thinking."

Two vocabulary items you'll need:

- **API route** = a URL that returns data (JSON) instead of a web page. Here they
  live in `app/api/.../route.ts`. This *is* the backend endpoint.
- **Server Component vs Client Component** = a Next.js page file runs on the
  *server* by default (can read files, secrets, databases). If it has
  `"use client"` at the top, it ships to the *browser* instead (can use buttons,
  state, localStorage). That `"use client"` marker flags the boundary everywhere.

---

## 1. What the website actually does (the feature list)

GoldRose (a demo store selling gold-dipped roses) has six functions:

1. **Show the storefront** — hero, product grid, product details
2. **Manage a shopping cart** — add/remove/change quantity, remember it across page loads
3. **Check out** — pick a payment method (Credit Card / PayPal), enter details
4. **Process the payment** — either a fake "mock" payment or a real hand-off to Shopify
5. **Record the order** — save the completed order so it can be shown
6. **Show the order log** — a page listing every order that landed

The rest of this guide is how each one is implemented and, crucially, *where*.

---

## 2. Feature by feature

### Function 1 — Show the storefront
**Runs on: Next.js server → then the browser.**

`app/page.tsx` is the home page. It's a **Server Component** (no `"use client"`),
so Next.js runs it on the server, builds the HTML, and sends finished HTML to the
browser. That's good for SEO — Google sees real content, not a blank page waiting
for JavaScript.

Where does the product data come from? `lib/products.ts` — a plain hardcoded
array of products (name, price, SKU, Shopify IDs). **This is the "database" for
the catalog.** No real DB; just a TypeScript file. Notice:

```ts
// TEMP: $1 for a live PayPal payment test. Restore to 4999 after testing.
price: 100,
```

Prices are stored in **cents** (100 = $1.00) everywhere — a standard backend
habit to avoid floating-point money bugs. `formatMoney()` (bottom of that file)
turns cents into `$1.00` for display.

`app/page.tsx` also injects **structured data** (the `application/ld+json`
script) — a machine-readable description of the store for Google. That's the
SEO/GEO work.

The actual visual UI lives in `components/Storefront.tsx`, which *is*
`"use client"` — the interactive part (buttons, cart drawer) runs in the browser.

### Function 2 — The shopping cart
**Runs entirely in the browser. No server involved.**

`lib/cart/store.ts` is the cart. It lives in **`localStorage`** (a small
key-value store built into every browser), under the key `goldrose-cart-v1`. That's
why your cart survives a page refresh without any server or login.

The critical backend-security idea shows up right here, even in client code:

> We persist only the product id, the chosen gift option, and the quantity —
> never the price.

So the cart *never* stores a price. If it did, a customer could open dev tools,
edit localStorage, and "buy" a $1000 rose for $1. Instead the price is always
re-looked-up from `lib/products.ts` — on display here, and *again* on the server
at checkout. Same rule, enforced twice.

(Mechanism for later: it uses React's `useSyncExternalStore` to keep the UI in
sync with localStorage. Don't worry about that yet — just know "cart = browser
localStorage, price never trusted from it.")

### Function 3 — The checkout page
**Runs on: server (renders the page) + browser (the form).**

`app/checkout/page.tsx` renders the checkout. The payment options come from
`lib/checkout/methods.ts` — a **registry** ("a list of the allowed options with
their properties"). Look at:

```ts
export const expressMethods = paymentMethods.filter(
  (method) => method.kind === "express" && method.id !== "shop_pay",
);
```

That single line is the "first live test uses PayPal only" decision made real in
code — Shop Pay is filtered out. Delete `&& method.id !== "shop_pay"` and Shop
Pay comes back. A good example of how a *business decision* becomes *one line of
backend logic*.

### Function 4 — Processing the payment (the real backend core)
**Runs on: Next.js server. The most important flow to understand.**

When you click "Pay," the browser sends the cart to a server API. Two files
matter:

**The API route** `app/api/checkout/route.ts` — a true backend endpoint.
`export async function POST(request)` means "when the browser POSTs to
`/api/checkout`, run this." What it does:

1. **Never trusts the input.** Almost the entire file is `sanitize*` functions —
   checking the JSON is well-formed, quantities are integers 1–20, strings aren't
   5MB long. This defensive checking of untrusted input is most of what backend
   endpoints actually do.
2. Calls `processCheckout()` to do the real work.
3. If an order completed, calls `saveOrder()` to record it.
4. Returns JSON to the browser.

**The brain** `lib/checkout/process.ts`, function `processCheckout()`. Its comment
states the security rule plainly:

> Quantity and gift option come from the request; identity and unit price are
> looked up locally, so a tampered cart can never set its own price.

So `resolveOrderLines()` takes the customer's `productId` + `quantity`, throws
away whatever else they sent, and rebuilds each line using the *server's* price
from `lib/products.ts`. Then it computes subtotal, shipping (free over a
threshold — `lib/business.ts`), and total. **The customer's browser never
decides the price. The server does.** Tattoo this on your brain.

Then it branches on payment method and on **mock vs live mode**:

- **Credit Card, mock mode** → validates the card *format only*
  (`lib/checkout/card.ts` — the Luhn algorithm, brand detection). No real charge;
  the card number is reduced to "Visa ····4242" and thrown away. Never stored.
- **Credit Card, live mode** → *refuses*. A real card number must never touch
  your server (PCI-compliance law); it belongs on Shopify's secure fields.
- **PayPal/Shop Pay, mock mode** → fakes a success and redirects to an internal
  success page.
- **PayPal/Shop Pay, live mode** → calls Shopify to create a real cart, gets back
  a real checkout URL, and redirects the customer *out* to Shopify to pay.

**Mock vs live** is controlled by an **environment variable** (`SHOPIFY_MODE`),
read in `lib/shopify/config.ts`. An environment variable is a setting you set
*outside* the code (in Vercel's dashboard), so the same code behaves as a safe
demo locally and a real store in production without editing a line. Default is
`mock`, so nothing real ever happens by accident.

### The Shopify hand-off — a real external API call
**Runs on: Next.js server → calls Shopify over the internet.**

`lib/shopify/client.ts` is the only file that talks to a real external company.
Two things worth seeing:

- A big **GraphQL** string (`cartCreate`). GraphQL is just a query language for
  APIs — instead of many URLs, you send one query describing exactly the fields
  you want back. Here: "make me a cart, give me back its checkout URL."
- The actual `fetch()` — an HTTPS POST to
  `https://{yourstore}.myshopify.com/api/.../graphql.json`, authenticated with a
  **secret token** (`X-Shopify-Storefront-Access-Token`). That token lives in an
  env var and *only* exists on the server — never sent to the browser. That's
  *why* this call is on the server: to keep the secret secret.

There's a **second, simpler live path** too — and it's the one currently used for
the live test: `lib/shopify/permalink.ts`. Instead of the GraphQL API, it builds
a URL like `https://store.myshopify.com/cart/42470616727598:1` — landing on that
URL adds the item to Shopify's cart and jumps to checkout. It needs no secret
token, which is why it's the current live-test mechanism. `lib/checkout/client.ts`
(browser side) chooses this path when the public store domain is set.

And `lib/shopify/mock.ts` is the fake stand-in that returns a realistic-looking
cart object *without* calling Shopify at all — so the whole flow is testable
offline.

### Function 5 — Recording the order
**Runs on: Next.js server, writing to a file.**

`lib/orders/store.ts`. After a mock order completes, `saveOrder()` appends it to
**`.data/orders.json`** — a plain JSON file on disk. This is deliberately *not* a
database. For a demo, a JSON file "survives dev-server reloads and is trivial to
inspect." It uses Node.js's `fs` (filesystem) module —
`import { promises as fs } from "fs"` — which **only exists on the server**; you
cannot read files from a browser. That import is itself a signal "this is backend
code."

The honest caveat is in the file's comment: on Vercel's serverless filesystem
this file resets between deploys. Fine for a boss demo, wrong for production
(where the real order lives in Shopify). This is exactly the kind of trade-off
backend engineers reason about constantly: *is a file good enough, or do I need a
database?*

### Function 6 — The order log
**Runs on: Next.js server.**

`app/orders/page.tsx` is a Server Component that calls `listOrders()` (reads that
JSON file) and renders the list as HTML. Because it reads a file, it *must* run
on the server — and note `export const dynamic = "force-dynamic"`, which tells
Next.js "never cache this page, re-read the file every time," so a fresh order
shows up immediately.

---

## 3. The full click → pay → order loop (tying it together)

The entire lifecycle, with the "where it runs" column — this single trace is the
whole app:

1. **Browser**: click "Add to cart" → `lib/cart/store.ts` writes to localStorage.
2. **Browser**: click "Pay with PayPal" → `lib/checkout/client.ts`.
   - If **live**: build a Shopify permalink and send you to Shopify. Done — Shopify owns it from here.
   - If **mock**: `fetch("POST /api/checkout")` with `{ method, lines }`.
3. **Server** (`app/api/checkout/route.ts`): sanitize the input.
4. **Server** (`lib/checkout/process.ts`): re-price from the catalog, validate, build the order.
5. **Server** (`lib/orders/store.ts`): append the order to `.data/orders.json`.
6. **Server → Browser**: return JSON with a success URL.
7. **Browser**: clear the cart, navigate to `/checkout/success`.
8. **Anytime, Server**: `/orders` reads the JSON file and shows the order.

---

## 4. What to read next, in order

To internalize the backend half, read the files in this sequence — "most
backend" to "least":

1. `lib/checkout/process.ts` — the trusted pricing brain (re-read the comments)
2. `app/api/checkout/route.ts` — how an untrusted request is defended against
3. `lib/shopify/config.ts` — how one env var switches mock↔live safely
4. `lib/shopify/client.ts` — one real external API call, with a secret
5. `lib/orders/store.ts` — the "database that's just a file"

Then poke the real thing:

- **Run it.** `npm run dev`, open `http://localhost:3000`, add to cart, check out. Watch the mock success appear.
- **Watch the network.** Dev tools → Network tab → click checkout → click the `checkout` request. You'll *see* the JSON your browser sent and the JSON the server returned.
- **Add a `console.log`** inside `POST` in `route.ts`, re-run, check the terminal. Now you've seen server code run.
- **Change a price** in `lib/products.ts` and watch it update — then notice you *can't* permanently change it from the browser, only from this trusted file.

---

## Glossary (plain-language)

- **Client / frontend** — code running in the customer's browser.
- **Server / backend** — code running on your host that the user can't see or edit. Here, that's the Next.js server running on Node.js.
- **Node.js** — the runtime that executes JavaScript on the server instead of in a browser.
- **HTTP request/response** — one round trip of "ask" and "answer" between browser and server.
- **GET / POST** — request types. GET = "give me a page/data." POST = "here's data, do something."
- **API route / endpoint** — a backend URL your frontend can call (e.g. `/api/checkout`).
- **Server Component** — Next.js code that runs on the server and outputs HTML (no interactivity).
- **Client Component** — Next.js code marked `"use client"` that runs in the browser (interactive).
- **Environment variable** — a secret/config value (like a token or `SHOPIFY_MODE`) kept out of the code, read at runtime.
- **GraphQL** — an API style where you request exactly the fields you want; Shopify uses it.
- **Cart permalink** — a Shopify URL like `/cart/{variantId}:{qty}` that adds items and jumps straight to Shopify's checkout.
- **Redirect** — telling the browser to load a different URL (the "page jump").
- **Hosted checkout** — a payment page run by Shopify where the card is entered, not by you.
- **PCI-DSS** — the security standard for handling card data; the reason you offload payments to Shopify.
- **Mock mode** — this repo's safe default: simulate the flow with no real store, money, or orders.

---

The one thread running through all of it — remember only this sentence if
nothing else: **the browser is untrusted; the server re-decides anything that
matters (price, validity, secrets), and Shopify is the real system of record
that this demo stands in for.**

### Where to read next in this repo
- `README.md` — the project map and current status.
- `docs/admin-design.md` — the design for the custom admin + native checkout
  that replaces Shopify (the current direction).
- `docs/archive/shopify-integration.md` — historical: the Shopify-era setup.
