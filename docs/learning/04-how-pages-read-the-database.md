# Feature Learning 04 — How Pages Read the Database

Traced end to end per [learning-docs-guideline.md](learning-docs-guideline.md).
This doc covers the **read path** — how data gets *out* of the database and onto a page. The **write path** (how admin edits get *in*) is the companion doc, [03 — Admin product add/edit/delete](03-admin-product-crud.md); read its Step 0 first if the `TableStore` two-backend idea is new, because both docs stand on it.

## Feature Summary

**What it does**
A visitor opens `/shop` or `/products/gold-rose-24k` and sees live products — titles, prices, images, in-stock state — that the owner edited minutes ago in the admin. Meanwhile the owner's own screens (`/admin/products`, Inventory) read much richer data: costs, stock counts, draft products. Both are database reads, but they travel two deliberately different roads.

**Why it exists — the two-worlds design**
The interesting thing to learn here is that this repo has **two separate read paths on purpose**, split by trust:

1. **Storefront reads are public, minimal, and cached.** The shop pages query with the **anon key** — the API key that ships to every browser and must be assumed stolen. So the database is arranged so that this key can only see a purpose-built window called `catalog_products`: active products, safe columns, nothing else. Reads are also cached for up to 5 minutes, so a busy shop page costs almost no database traffic.
2. **Admin reads are private, complete, and fresh.** Admin screens go through the `TableStore` layer with the **service-role key** (server-only), fetch whole tables, and join them in TypeScript per request — drafts, costs, and stock included. No caching: the owner always sees current truth.

This is the industry principle of **least privilege**: each key can do exactly what its world needs and no more. A leaked anon key here leaks nothing you couldn't already see by browsing the shop.

**Key jargon used below**
- **SQL view**: a saved query that behaves like a read-only table. `catalog_products` is a view — asking it for rows *runs* its query against the real tables underneath.
- **Grant / revoke**: Postgres permissions. A role that was never granted `select` on an object cannot read it, full stop.
- **Server component** (Next.js): a page component that runs on the server, so it may query the database directly and send only finished HTML to the browser.
- **`revalidate` / ISR**: Next.js page caching. `export const revalidate = 300` means "serve the cached page; at most every 300 s, rebuild it in the background from fresh data."
- **React `cache()`**: request-scoped deduplication — if the same wrapped function is called five times while rendering one request, it runs once and the callers share the result.

## Code Trace

```text
 VISITOR                        SERVER (storefront world — anon key)
 ───────                        ─────────────────────────────────────
 opens /shop ─────────────────▶ app/shop/page.tsx   (server component, revalidate = 300)
                                 │ getCatalog()          lib/supabase/catalog.ts
                                 │   hosted?  ──────────────┬─────────────────┐
                                 │   yes ▼                  no ▼              │
                                 │  anon supabase client   getStore().all()   │
                                 │  .from("catalog_products")  ×3 tables,     │
                                 │  .select("*").order(...)    same shape     │
                                 │        │                    built in TS    │
                                 │        ▼                                   │
                                 │  Postgres runs the VIEW:                   │
                                 │   products WHERE status='active'           │
                                 │   + images/variants as nested JSON         │
                                 │   (no cost_cents, no stock counts,         │
                                 │    only in_stock true/false)               │
                                 ▼                                            │
                                 HTML, cached up to 300 s  ◀──────────────────┘
                                 (admin Save → revalidatePath → cache stamped stale)

 OWNER                          SERVER (admin world — service key)
 ─────                          ───────────────────────────────────
 opens /admin/products ───────▶ products/page.tsx → listProducts()
                                 │ getStore().all("products" | "product_variants" | "product_images")
                                 │ join / sort / aggregate in TypeScript, fresh every request
                                 ▼ full data: drafts, costs, stock counts
```

### Step 1 — Entry point: the shop pages are server components

[app/shop/page.tsx](../../app/shop/page.tsx) declares `export const revalidate = 300` ([shop/page.tsx:33](../../app/shop/page.tsx#L33)) and calls `await getCatalog()` in the page body ([shop/page.tsx:134](../../app/shop/page.tsx#L134)) to build the product cards — handle, short name, first variant's price. Note the shape of the call site ([shop/page.tsx:128-148](../../app/shop/page.tsx#L128-L148)): the database work sits inside a `try { … } catch { /* fixed design still renders */ }`. The page's layout is pixel-fixed Figma art; only designated text slots carry live data — so if the database is unreachable, the shop still renders, just without prices. A dead database degrades the page; it never crashes it.

[app/products/[slug]/page.tsx](../../app/products/%5Bslug%5D/page.tsx) leans harder on the same source: `getCatalog` feeds `generateStaticParams` (which product URLs exist, [:37-42](../../app/products/%5Bslug%5D/page.tsx#L37-L42)), `generateMetadata` (SEO tags, [:56](../../app/products/%5Bslug%5D/page.tsx#L56)), and the page body ([:130](../../app/products/%5Bslug%5D/page.tsx#L130)); an unknown or non-active handle gets `notFound()` ([:137](../../app/products/%5Bslug%5D/page.tsx#L137)). Three calls in one render — which is exactly why the next step wraps the function in `cache()`.

### Step 2 — [getCatalog()](../../lib/supabase/catalog.ts#L27-L87): one function, both backends

`getCatalog` is the storefront's *entire* read model — every public page gets its product data through this single function. The hosted branch ([catalog.ts:30-42](../../lib/supabase/catalog.ts#L30-L42)):

```ts
if (env.hosted && env.anonKey) {
  const anon = createClient(env.url, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await anon
    .from("catalog_products")
    .select("*")
    .order("position", { ascending: true });
```

Two things to notice:

- It builds its own client with the **anon key** — *not* `getStore()`, which holds the service key. This is deliberate self-restraint: the storefront could technically use the powerful key (this code runs on the server), but by using the public key it can never accidentally read more than the public surface, and the file's header comment states the payoff — "a leaked key can never see private columns."
- It reads **one object**, the `catalog_products` view, and trusts the database to have shaped the data (next step). No joins in this branch.

The fallback branch ([catalog.ts:44-86](../../lib/supabase/catalog.ts#L44-L86)) is the same result computed by hand: when no Supabase is configured, it pulls `products`, `product_variants`, and `product_images` from the local file store and rebuilds the *identical* projection in TypeScript — `status === "active"` filter, position sort, and the same `in_stock` formula. Keeping the two branches shape-identical is what lets every page and all 55 e2e tests run against the JSON file with zero code changes.

### Step 3 — The view: the database pre-shapes what the public may see

[catalog_products](../../supabase/migrations/0001_init.sql#L373-L405) in the schema is where the storefront's data contract actually lives:

```sql
create view catalog_products as
select
  p.id, p.handle, p.title, p.short_name, p.description,
  p.best_for, p.badge, p.details, p.tags, p.option_names, p.position,
  ... jsonb_agg(... images ...) as images,
  ... jsonb_agg(jsonb_build_object(
        'price_cents', v.price_cents,
        'in_stock', (not v.track_quantity) or v.continue_selling_when_oos
                    or v.inventory_on_hand > 0
      ) ...) as variants
from products p
where p.status = 'active';
```

Read it as a list of decisions:

- **`where p.status = 'active'`** — drafts and archived products don't exist as far as the public API is concerned. This one line is why "archive" in the admin (doc 03, step 5) instantly hides a product.
- **Column allowlist** — `cost_cents` (what the owner pays per item) is simply not selected; the schema even marks it "PRIVATE: must never appear in catalog_products" ([0001_init.sql:63-64](../../supabase/migrations/0001_init.sql#L63-L64)). Same for exact stock counts: competitors and scrapers can learn `in_stock: true/false`, never "3 left".
- **Nested JSON** — `jsonb_agg` folds each product's images and variants into JSON arrays inside the row, so one query returns the whole card-ready structure. The TypeScript type [CatalogProduct](../../lib/supabase/types.ts#L406-L420) mirrors this row shape exactly.

### Step 4 — Why the anon key can't wander off the path

The view alone wouldn't be safe — a curious client could try `.from("orders")` with the same anon key. The lock is the schema's last section ([0001_init.sql:407-439](../../supabase/migrations/0001_init.sql#L407-L439)):

1. **RLS on, no policies**: every base table has `enable row level security` and (with one exception) zero policies — through the public API, deny-by-default means deny, period.
2. **Grants stripped**: `revoke all on all tables … from anon, authenticated`, then exactly two grants back: `select` on `catalog_products` and on `site_content`.

So the anon key's universe is two read-only objects. Try to read `orders`, `customers`, or even raw `products` (with its drafts) and Postgres refuses — no application code involved. Views run with their *owner's* rights, which is how `catalog_products` can read the locked `products` table on the anon caller's behalf while exposing only its safe projection — a classic gatekeeper pattern.

### Step 5 — Three cache layers between the database and the visitor

A price edit travels through three distinct caches; knowing which is which is the practical skill here:

1. **React `cache()` — request-scoped.** `getCatalog` is wrapped in `cache()` ([catalog.ts:27](../../lib/supabase/catalog.ts#L27)) so the product page's three calls (params, metadata, body — step 1) hit the database once per render, not three times. Forgotten wrappers like this are a common real-world triple-query bug.
2. **`revalidate = 300` — page-level, up to 5 minutes.** Both storefront pages export it ([shop/page.tsx:33](../../app/shop/page.tsx#L33), [products/[slug]/page.tsx:35](../../app/products/%5Bslug%5D/page.tsx#L35)). Visitors get pre-built HTML; the database sees at most one catalog read per page per 5 minutes *no matter how much traffic arrives*. That's why a free-tier database can sit behind a marketing spike.
3. **`revalidatePath` — event-driven punch-through.** Five minutes would be an annoying wait for the owner checking their own edit, so every admin mutation ends with [revalidateStorefront()](../../lib/admin/products.ts#L46-L53), stamping the storefront pages stale immediately (doc 03, step 7). The 300 s timer is the safety net; the explicit revalidate is the fast path.

### Step 6 — The other world: how admin screens read

Admin reads skip the view and the anon key entirely — they need drafts, costs, and stock, so they go through [getStore()](../../lib/supabase/store.ts#L24-L32) (service key in hosted mode) and follow one repeating pattern, visible in [listProducts()](../../lib/admin/products.ts#L60-L82):

```ts
const [products, variants, images] = await Promise.all([
  store.all("products"),
  store.all("product_variants"),
  store.all("product_images"),
]);
```

Fetch whole tables in parallel, then join, sort, and aggregate in plain TypeScript. [getProductDetail](../../lib/admin/products.ts#L89-L109) (edit screen) and [listVariantInventory](../../lib/admin/products.ts#L419-L466) (the §7.2 Committed/Available math, joining four tables) are the same shape. Two things make this naive-looking pattern a considered choice rather than an accident:

- **It's the price of the two-backend design.** `TableStore` offers only primitive reads, so a join written in TypeScript runs identically against Postgres and the JSON file — one implementation, tested everywhere. The interface docstring owns the tradeoff: "Fine at this store's scale" ([types.ts:354-359](../../lib/supabase/types.ts#L354-L359)). At tens of products this costs milliseconds; at Amazon scale you'd push joins into SQL.
- **Growth is already accommodated where it matters.** `where()` pushes equality filters down into SQL in hosted mode "so hot paths don't drag whole growing tables over the wire" ([types.ts:365-367](../../lib/supabase/types.ts#L365-L367)), and the remote `all()` pages past Supabase's silent 1000-row cap ([remote.ts:41-64](../../lib/supabase/remote.ts#L41-L64)) so "all" stays honest as tables grow.

Unlike the storefront, none of this is cached — every admin page load recomputes from live rows. Freshness beats cheapness when the reader is the person editing the data.

### Recap — one edit, both worlds

The owner raises a price and presses Save (doc 03) → service key writes `product_variants.price_cents` → `revalidateStorefront()` stamps the shop pages stale → next visitor's request rebuilds `/shop`: `getCatalog()` → anon key → `catalog_products` view → fresh HTML, cached again for the next 5 minutes. The owner reloads `/admin/products` and sees the change instantly via `store.all()` — no cache in the way. Same database, two roads, each shaped by who's asking.
