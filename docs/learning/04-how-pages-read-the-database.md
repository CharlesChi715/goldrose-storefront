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

[app/shop/page.tsx](../../app/shop/page.tsx) declares `export const revalidate = 300` ([shop/page.tsx:33](../../app/shop/page.tsx#L33)) and calls `await getCatalog()` in the page body ([shop/page.tsx:204](../../app/shop/page.tsx#L204)) to build the product cards — handle, short name, first variant's price.

```tsx
// app/shop/page.tsx:32-33
// DB-backed data (card links, promo slogan) refreshes without a redeploy (§8).
export const revalidate = 300;
```

Note the shape of the call site ([shop/page.tsx:198-218](../../app/shop/page.tsx#L198-L218)): the database work sits inside a `try { … } catch { /* fixed design still renders */ }`. The page's layout is pixel-fixed Figma art; only designated text slots carry live data — so if the database is unreachable, the shop still renders, just without prices. A dead database degrades the page; it never crashes it.

```tsx
// app/shop/page.tsx:198-218
  // Card links + promo slogan come from the DB; a dead DB degrades gracefully.
  let handles: string[] = [];
  let cardData: Array<{ handle: string; shortName: string; price: string; compareAt: string | null }> = [];
  let promo = { text: "", isDefault: true };
  try {
    // Card order = active products by position (§8); cards cycle the catalog.
    const catalog = await getCatalog();
    handles = catalog.map((product) => product.handle);
    cardData = catalog.map((product) => ({
      handle: product.handle,
      shortName: product.short_name || product.title,
      price: formatMoney(product.variants[0]?.price_cents ?? 0),
      // …
    }));
    promo = await getPromoSlogan();
  } catch {
    // fixed design still renders
  }
```

[app/products/[slug]/page.tsx](../../app/products/%5Bslug%5D/page.tsx) leans harder on the same source: `getCatalog` feeds `generateStaticParams` (which product URLs exist, [:32-42](../../app/products/%5Bslug%5D/page.tsx#L32-L42)), `generateMetadata` (SEO tags, [:56](../../app/products/%5Bslug%5D/page.tsx#L56)), and the page body ([:129](../../app/products/%5Bslug%5D/page.tsx#L129)); an unknown or non-active handle gets `notFound()` ([:136](../../app/products/%5Bslug%5D/page.tsx#L136)).

```tsx
// app/products/[slug]/page.tsx:32-42
export async function generateStaticParams() {
  // …
  try {
    const catalog = await getCatalog();
    return catalog.map((product) => ({ slug: product.handle }));
  } catch {
    return [];
  }
}
```

```tsx
// app/products/[slug]/page.tsx:50-57
  try {
    const product = await getCatalogProduct(slug);
    if (!product) return { title: "Product" };
    const image = product.images[0] ? fileUrl(product.images[0].path) : undefined;
    return {
      // Search engine listing (§9.5): seo fields with title/description fallback.
      title: product.short_name || product.title,
      description: product.description,
```

```tsx
// app/products/[slug]/page.tsx:128-137
  try {
    const catalog = await getCatalog();
    handles = catalog.map((entry) => entry.handle);
    catalogProduct = catalog.find((entry) => entry.handle === slug) ?? null;
    promo = await getPromoSlogan();
  } catch {
    catalogProduct = null;
  }
  if (!catalogProduct) notFound();
  const product = catalogProduct;
```

Three calls in one render — the metadata one arrives via `getCatalogProduct`, a thin wrapper that still goes through the same function — which is exactly why the next step wraps it in `cache()`.

```ts
// lib/supabase/catalog.ts:95-98
export async function getCatalogProduct(handle: string): Promise<CatalogProduct | null> {
  const catalog = await getCatalog();
  return catalog.find((product) => product.handle === handle) ?? null;
}
```

### Step 2 — [getCatalog()](../../lib/supabase/catalog.ts#L27-L87): one function, both backends

`getCatalog` is the storefront's *entire* read model — every public page gets its product data through this single function. The hosted branch ([catalog.ts:30-42](../../lib/supabase/catalog.ts#L30-L42)):

```ts
// lib/supabase/catalog.ts:30-41
  if (env.hosted && env.anonKey) {
    const anon = createClient(env.url, env.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await anon
      .from("catalog_products")
      .select("*")
      .order("position", { ascending: true });
    if (error) {
      throw new Error(`catalog_products: ${error.message}`);
    }
    return (data ?? []) as CatalogProduct[];
```

Two things to notice:

- It builds its own client with the **anon key** — *not* `getStore()`, which holds the service key. This is deliberate self-restraint: the storefront could technically use the powerful key (this code runs on the server), but by using the public key it can never accidentally read more than the public surface, and the file's header comment states the payoff — "a leaked key can never see private columns."
- It reads **one object**, the `catalog_products` view, and trusts the database to have shaped the data (next step). No joins in this branch.

The fallback branch ([catalog.ts:44-86](../../lib/supabase/catalog.ts#L44-L86)) is the same result computed by hand: when no Supabase is configured, it pulls `products`, `product_variants`, and `product_images` from the local file store and rebuilds the *identical* projection in TypeScript — `status === "active"` filter, position sort, and the same `in_stock` formula.

```ts
// lib/supabase/catalog.ts:44-56, 81-86
  // Local adapter: same projection as the SQL view, computed in TS.
  const store = getStore();
  const [products, variants, images] = await Promise.all([
    store.all("products"),
    store.all("product_variants"),
    store.all("product_images"),
  ]);

  return products
    .filter((product) => product.status === "active")
    .sort((a, b) => a.position - b.position)
    .map((product) => ({
      // …
          in_stock:
            !variant.track_quantity ||
            variant.continue_selling_when_oos ||
            variant.inventory_on_hand > 0,
        })),
    }));
```

Keeping the two branches shape-identical is what lets every page and all 55 e2e tests run against the JSON file with zero code changes.

### Step 3 — The view: the database pre-shapes what the public may see

[catalog_products](../../supabase/migrations/0001_init.sql#L373-L405) in the schema is where the storefront's data contract actually lives:

```sql
-- supabase/migrations/0001_init.sql:373-405
create view catalog_products as
select
  p.id,
  -- …
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'path', i.path, 'alt', i.alt, 'position', i.position
    ) order by i.position)
    from product_images i where i.product_id = p.id
  ), '[]'::jsonb) as images,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      -- …
      'price_cents', v.price_cents,
      'in_stock', (not v.track_quantity) or v.continue_selling_when_oos or v.inventory_on_hand > 0
    ) order by v.position)
    from product_variants v where v.product_id = p.id
  ), '[]'::jsonb) as variants
from products p
where p.status = 'active';
```

Read it as a list of decisions:

- **`where p.status = 'active'`** — drafts and archived products don't exist as far as the public API is concerned. This one line is why "archive" in the admin (doc 03, step 5) instantly hides a product.
- **Column allowlist** — `cost_cents` (what the owner pays per item) is simply not selected; the schema even marks it "PRIVATE: must never appear in catalog_products" ([0001_init.sql:63-64](../../supabase/migrations/0001_init.sql#L63-L64)). Same for exact stock counts: competitors and scrapers can learn `in_stock: true/false`, never "3 left".

  ```sql
  -- supabase/migrations/0001_init.sql:63-64
    -- "Cost per item" — PRIVATE: must never appear in catalog_products (§7.2).
    cost_cents int,
  ```

- **Nested JSON** — `jsonb_agg` folds each product's images and variants into JSON arrays inside the row, so one query returns the whole card-ready structure. The TypeScript type [CatalogProduct](../../lib/supabase/types.ts#L406-L421) mirrors this row shape exactly.

  ```ts
  // lib/supabase/types.ts:406-421
  /** One row of the catalog_products view (§6.3) — safe columns only. */
  export type CatalogProduct = {
    id: string;
    handle: string;
    title: string;
    // …
    position: number;
    images: CatalogImage[];
    variants: CatalogVariant[];
  };
  ```

### Step 4 — Why the anon key can't wander off the path

The view alone wouldn't be safe — a curious client could try `.from("orders")` with the same anon key. And that key really is public: its `NEXT_PUBLIC_` prefix is Next.js's marker for "ship this to the browser", whereas the service key has no prefix and never leaves the server.

```ts
// lib/supabase/env.ts:24-27
export function getSupabaseEnv(): SupabaseEnv {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
```

The lock is the schema's last section ([0001_init.sql:407-439](../../supabase/migrations/0001_init.sql#L407-L439)):

1. **RLS on, no policies**: every base table has `enable row level security` and (with one exception) zero policies — through the public API, deny-by-default means deny, period.

   ```sql
   -- supabase/migrations/0001_init.sql:412-433
   alter table products enable row level security;
   alter table product_images enable row level security;
   alter table product_variants enable row level security;
   -- …
   alter table admin_users enable row level security;

   -- No table policies exist except this one: anon may read site content slots.
   create policy site_content_public_read on site_content
     for select to anon, authenticated using (true);
   ```

2. **Grants stripped**: `revoke all on all tables … from anon, authenticated`, then exactly two grants back: `select` on `catalog_products` and on `site_content`.

   ```sql
   -- supabase/migrations/0001_init.sql:435-439
   -- Views execute with their owner's rights, so these grants (not RLS) are the
   -- control. Lock the API roles down to exactly the safe surface.
   revoke all on all tables in schema public from anon, authenticated;
   grant select on catalog_products to anon, authenticated;
   grant select on site_content to anon, authenticated;
   ```

So the anon key's universe is two read-only objects. Try to read `orders`, `customers`, or even raw `products` (with its drafts) and Postgres refuses — no application code involved. Views run with their *owner's* rights, which is how `catalog_products` can read the locked `products` table on the anon caller's behalf while exposing only its safe projection — a classic gatekeeper pattern.

### Step 5 — Three cache layers between the database and the visitor

A price edit travels through three distinct caches; knowing which is which is the practical skill here:

1. **React `cache()` — request-scoped.** `getCatalog` is wrapped in `cache()` ([catalog.ts:27](../../lib/supabase/catalog.ts#L27)) so the product page's three calls (params, metadata, body — step 1) hit the database once per render, not three times. Forgotten wrappers like this are a common real-world triple-query bug.

   ```ts
   // lib/supabase/catalog.ts:22-27
    * Wrapped in cache(): generateMetadata and the page body both call this
    * during one product render — dedupe to a single fetch per request.
    *
    * @returns Catalog products sorted by position.
    */
   export const getCatalog = cache(async (): Promise<CatalogProduct[]> => {
   ```

2. **`revalidate = 300` — page-level, up to 5 minutes.** Both storefront pages export it ([shop/page.tsx:33](../../app/shop/page.tsx#L33), [products/[slug]/page.tsx:30](../../app/products/%5Bslug%5D/page.tsx#L30)). Visitors get pre-built HTML; the database sees at most one catalog read per page per 5 minutes *no matter how much traffic arrives*. That's why a free-tier database can sit behind a marketing spike.

   ```tsx
   // app/products/[slug]/page.tsx:28-30
   // Re-check the DB catalog every 5 minutes so admin edits reach buyers
   // without a redeploy (§8).
   export const revalidate = 300;
   ```

3. **`revalidatePath` — event-driven punch-through.** Five minutes would be an annoying wait for the owner checking their own edit, so every admin mutation ends with [revalidateStorefront()](../../lib/admin/products.ts#L46-L53), stamping the storefront pages stale immediately (doc 03, step 7). The 300 s timer is the safety net; the explicit revalidate is the fast path.

   ```ts
   // lib/admin/products.ts:45-53
   /** Storefront caches to refresh after any catalog mutation (§8). */
   export function revalidateStorefront(): void {
     revalidatePath("/");
     revalidatePath("/shop");
     revalidatePath("/products/[slug]", "page");
     // The discovery layer regenerates with the catalog (§8.1).
     revalidatePath("/sitemap.xml");
     revalidatePath("/llms.txt");
   }
   ```

### Step 6 — The other world: how admin screens read

The entry point is the admin page itself — a server component that awaits its data before rendering:

```tsx
// app/admin/(dashboard)/products/page.tsx:11-12
export default async function ProductsPage() {
  const rows = await listProducts();
```

Admin reads skip the view and the anon key entirely — they need drafts, costs, and stock, so they go through [getStore()](../../lib/supabase/store.ts#L24-L32) (service key in hosted mode) and follow one repeating pattern, visible in [listProducts()](../../lib/admin/products.ts#L60-L82):

```ts
// lib/supabase/store.ts:24-32
export function getStore(): TableStore {
  const holder = globalThis as Record<string, unknown>;
  if (!holder[GLOBAL_KEY]) {
    holder[GLOBAL_KEY] = getSupabaseEnv().hosted
      ? createRemoteStore()
      : createLocalStore();
  }
  return holder[GLOBAL_KEY] as TableStore;
}
```

```ts
// lib/admin/products.ts:61-66
  const store = getStore();
  const [products, variants, images] = await Promise.all([
    store.all("products"),
    store.all("product_variants"),
    store.all("product_images"),
  ]);
```

Fetch whole tables in parallel, then join, sort, and aggregate in plain TypeScript. [getProductDetail](../../lib/admin/products.ts#L89-L109) (edit screen) and [listVariantInventory](../../lib/admin/products.ts#L438-L485) (the §7.2 Committed/Available math, joining four tables) are the same shape.

```ts
// lib/admin/products.ts:439-445
  const store = getStore();
  const [products, variants, orders, orderLines] = await Promise.all([
    store.all("products"),
    store.all("product_variants"),
    store.all("orders"),
    store.all("order_lines"),
  ]);
```

Two things make this naive-looking pattern a considered choice rather than an accident:

- **It's the price of the two-backend design.** `TableStore` offers only primitive reads, so a join written in TypeScript runs identically against Postgres and the JSON file — one implementation, tested everywhere. The interface docstring owns the tradeoff: "Fine at this store's scale" ([types.ts:355-359](../../lib/supabase/types.ts#L355-L359)). At tens of products this costs milliseconds; at Amazon scale you'd push joins into SQL.
- **Growth is already accommodated where it matters.** `where()` pushes equality filters down into SQL in hosted mode "so hot paths don't drag whole growing tables over the wire" ([types.ts:366-368](../../lib/supabase/types.ts#L366-L368)), and the remote `all()` pages past Supabase's silent 1000-row cap ([remote.ts:41-64](../../lib/supabase/remote.ts#L41-L64)) so "all" stays honest as tables grow.

```ts
// lib/supabase/types.ts:355-368
/**
 * The primitive persistence interface both backends implement. Anything
 * richer (filtering, joins, aggregation) is plain TypeScript on top of
 * `all()` — written once, identical against hosted Supabase and the local
 * file store. Fine at this store's scale.
 */
export interface TableStore {
  // …
  all<T extends TableName>(table: T): Promise<DbTables[T][]>;
  /** Rows matching an equality filter — pushed down to SQL in hosted mode,
   * so hot paths don't drag whole growing tables over the wire. */
  where<T extends TableName>(table: T, match: Match<T>): Promise<DbTables[T][]>;
  // …
```

```ts
// lib/supabase/remote.ts:41-64
  /**
   * PostgREST silently truncates a bare select at its max-rows cap (1000 by
   * default) — `all()` must mean ALL, so page through with range() until a
   * short page arrives.
   */
  async all<T extends TableName>(table: T): Promise<DbTables[T][]> {
    const pageSize = 1000;
    const rows: DbTables[T][] = [];
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await this.client
        .from(table)
        .select("*")
        .order(PAGE_ORDER[table] ?? "id", { ascending: true })
        .range(from, from + pageSize - 1);
      // …
      const page = (data ?? []) as DbTables[T][];
      rows.push(...page);
      if (page.length < pageSize) {
        return rows;
      }
    }
  }
```

Unlike the storefront, none of this is cached — every admin page load recomputes from live rows. Freshness beats cheapness when the reader is the person editing the data.

### Recap — one edit, both worlds

The owner raises a price and presses Save (doc 03) → service key writes `product_variants.price_cents` → `revalidateStorefront()` stamps the shop pages stale → next visitor's request rebuilds `/shop`: `getCatalog()` → anon key → `catalog_products` view → fresh HTML, cached again for the next 5 minutes. The owner reloads `/admin/products` and sees the change instantly via `store.all()` — no cache in the way. Same database, two roads, each shaped by who's asking.
