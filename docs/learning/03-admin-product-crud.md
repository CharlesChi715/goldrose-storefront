# Feature Learning 03 — Admin Product Add / Edit / Delete → Database

Traced end to end per [README.md](README.md).
This doc covers the **write path** — how a product the owner types into the admin becomes rows in the database. The **read path** (how `/shop` and the admin screens get data *out*) is the companion doc, [04 — How pages read the database](04-how-pages-read-the-database.md).

## Feature Summary

**What it does**
The owner opens `/admin/products`, sees the Shopify-style product list, and can: **Add product** (a blank form), **edit** an existing one (title, price, images, stock…), **archive/draft/activate** (bulk or per product), **duplicate**, or **Delete** (the red-confirm one). Pressing Save or Delete ends as real SQL against the hosted Supabase Postgres database — or, when no Supabase keys are configured, as writes to a local JSON file. Either way the storefront shows the change on the next page load.

**Why it exists**
This is the custom replacement for Shopify's product admin (spec §9.5/§9.6 in [admin-design.md](../admin-design.md)). Three design decisions shape the whole write path:

1. **One tiny database interface, two swappable backends.** Feature code never talks to Supabase directly. It talks to `TableStore` — five generic methods (`all`, `where`, `insert`, `update`, `remove`) plus two special operations (`adjustInventory`, `nextOrderNumber`). Env vars decide at runtime whether those methods hit hosted Supabase or a JSON file at `.data/db.json`. That's why all 55 e2e tests run with no cloud account at all.
2. **Nothing from the browser is trusted.** Every write crosses one trust boundary — a *server action* that first checks *who* is calling (`requireAdmin()`) and then *what* they sent (a `zod` schema). Below that boundary, the database itself is locked: row-level security denies everything by default, and only the server-side service key can write.
3. **Stock is never edited silently.** A quantity change is not a plain column write — it becomes a row in an append-only `inventory_movements` log, applied atomically by a SQL function. The owner can always answer "why is stock at 7?".

**Key jargon used below**
- **Server action** (Next.js): a function marked `"use server"` that a client component can call like a normal async function — Next.js turns the call into an HTTP request to the server behind the scenes. This repo uses them (not REST API routes) for all admin writes.
- **zod**: a validation library. A *schema* describes the allowed shape ("title: string, 1–255 chars"); `safeParse` checks an unknown payload against it before any logic runs.
- **Service-role key vs anon key** (Supabase): two API keys to the same database. The *service* key bypasses all security rules — it lives only in server env vars. The *anon* key is public (shipped to browsers) and can only see what security rules explicitly allow.
- **RLS (row-level security)**: Postgres feature — when enabled on a table with no policies, *every* query through the API is denied. This schema enables it on all 18 tables and adds only one read policy.
- **Upsert**: update the row if it exists, insert it if it doesn't.
- **Handle**: the URL slug of a product (`/products/gold-rose-24k`). Here the product's `id` *is* its first handle.

## Code Trace

```text
 ADMIN ACTION                  BROWSER (client)                       SERVER
 ────────────                  ────────────────                       ──────
 opens /admin/products ───────────────────────────────────▶ products/page.tsx
                                                             │ listProducts() ◀── DB (3 tables, joined in TS)
                               ◀── HTML: <ProductsList> ─────┘
 "Add product" ──────────────▶ /admin/products/new  (blank <ProductForm>)
 clicks a row ───────────────▶ /admin/products/[id]
                                                            [id]/page.tsx  getProductDetail(id) ◀── DB
                               ProductForm.tsx ("use client")
 presses "Save" ─────────────▶  saveProductAction(payload) ───────▶ actions.ts ("use server")
 (or Delete / Archive /                                              │ 1 requireAdmin()      → 404 if not admin
  Duplicate — same shape)                                            │ 2 zod safeParse       → error if malformed
                                                                     ▼
                                                            lib/admin/products.ts  saveProduct()
                                                                     │ create → store.insert("products", [row])
                                                                     │ edit   → store.update("products", {id}, row)
                                                                     │ variants: upsert kept, delete missing
                                                                     │ stock change → store.adjustInventory(...)
                                                                     │ images: remove all rows + insert fresh
                                                                     │ revalidateStorefront()
                                                                     ▼
                                                            lib/supabase/store.ts  getStore()
                                                                     │  hosted env vars set?
                                                            yes ◀────┴────▶ no
                                                   lib/supabase/remote.ts    lib/supabase/local.ts
                                                   RemoteStore               LocalStore
                                                   supabase-js client        one JSON file:
                                                   + SERVICE-ROLE key        .data/db.json
                                                   → Postgres (RLS           (writes serialized
                                                     bypassed on purpose)     through a queue)
```

### Step 0 — The floor everything stands on: `TableStore` and the two backends

Before tracing a click, meet the data layer, because every arrow below ends here.

[lib/supabase/types.ts:361-390](../../lib/supabase/types.ts#L361-L390) defines the `TableStore` interface — the *entire* vocabulary feature code has for the database: `all(table)`, `where(table, match)`, `insert(table, rows)`, `update(table, match, patch)`, `remove(table, match)`, plus two special operations `adjustInventory()` and `nextOrderNumber()`. `match` is always an equality filter (`{ id: "gold-rose" }`). Anything richer — joins, sorting, aggregation — is written once in plain TypeScript on top of `all()`, so it behaves identically on both backends. The interface comment says why this is acceptable: "Fine at this store's scale."

```ts
// lib/supabase/types.ts:361-390
export interface TableStore {
  /** Which backend is live — "supabase" (hosted) or "local" (file adapter). */
  backend: "supabase" | "local";
  all<T extends TableName>(table: T): Promise<DbTables[T][]>;
  where<T extends TableName>(table: T, match: Match<T>): Promise<DbTables[T][]>;
  insert<T extends TableName>(table: T, rows: DbTables[T][]): Promise<void>;
  update<T extends TableName>(
    table: T,
    match: Match<T>,
    patch: Partial<DbTables[T]>,
  ): Promise<number>;
  remove<T extends TableName>(table: T, match: Match<T>): Promise<number>;
  /** Atomic stock adjust + movement log (§7.3 adjust_inventory). */
  adjustInventory(input: {
    // …
  }): Promise<void>;
  /** Next value of the Shopify-style order number sequence (#1001…). */
  nextOrderNumber(): Promise<number>;
}
```

[lib/supabase/store.ts:24-32](../../lib/supabase/store.ts#L24-L32) is the switch. `getStore()` asks [env.ts](../../lib/supabase/env.ts#L24-L34) whether `NEXT_PUBLIC_SUPABASE_URL` **and** `SUPABASE_SERVICE_ROLE_KEY` are both set (`hosted: Boolean(url && serviceKey)`, [env.ts:32](../../lib/supabase/env.ts#L32)) and creates one store for the whole process, cached on `globalThis`:

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
// lib/supabase/env.ts:25-33
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  return {
    url,
    anonKey,
    serviceKey,
    hosted: Boolean(url && serviceKey),
  };
```

- **Hosted** → [lib/supabase/remote.ts](../../lib/supabase/remote.ts). Builds a `supabase-js` client with the **service-role key** ([remote.ts:36-38](../../lib/supabase/remote.ts#L36-L38)) — full database power, which is exactly why this file must never be imported by anything browser-shipped. Each interface method is a thin translation: `insert` → `client.from(table).insert(rows)` ([remote.ts:87-92](../../lib/supabase/remote.ts#L87-L92)), `update` → `.update(patch).match(match)` ([remote.ts:94-108](../../lib/supabase/remote.ts#L94-L108)), `remove` → `.delete().match(match)` ([remote.ts:110-120](../../lib/supabase/remote.ts#L110-L120)). One subtlety worth learning: `all()` pages through results 1000 at a time ([remote.ts:46-64](../../lib/supabase/remote.ts#L46-L64)) because Supabase's API **silently truncates** a bare select at 1000 rows — "all" must mean all.

  ```ts
  // lib/supabase/remote.ts:36-38
      this.client = createClient(env.url, env.serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
  ```

  ```ts
  // lib/supabase/remote.ts:87-92
    async insert<T extends TableName>(table: T, rows: DbTables[T][]): Promise<void> {
      const { error } = await this.client.from(table).insert(rows);
      if (error) {
        throw new Error(`supabase insert ${table}: ${error.message}`);
      }
    }
  ```

  ```ts
  // lib/supabase/remote.ts:47-63
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
  ```

- **Local** → [lib/supabase/local.ts](../../lib/supabase/local.ts). The whole database is one JSON file, `.data/db.json` ([local.ts:24-25](../../lib/supabase/local.ts#L24-L25)), auto-seeded on first use. Every read-modify-write goes through a promise queue ([local.ts:69-74](../../lib/supabase/local.ts#L69-L74)) so two concurrent server actions can't interleave file writes and corrupt the JSON. If the filesystem turns out to be read-only (a serverless deploy without Supabase), it flips to in-memory "ephemeral" mode instead of crashing ([local.ts:97-117](../../lib/supabase/local.ts#L97-L117)).

  ```ts
  // lib/supabase/local.ts:24-25
  const DATA_DIR = path.join(process.cwd(), ".data");
  const DB_FILE = path.join(DATA_DIR, "db.json");
  ```

  ```ts
  // lib/supabase/local.ts:69-74
    /** Serialize every read-modify-write so file state never interleaves. */
    private locked<R>(fn: () => Promise<R>): Promise<R> {
      const run = this.queue.then(fn, fn);
      this.queue = run.catch(() => undefined);
      return run;
    }
  ```

  ```ts
  // lib/supabase/local.ts:105-116
      try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        const tmp = `${DB_FILE}.tmp`;
        await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
        await fs.rename(tmp, DB_FILE);
      } catch (error) {
        // Read-only fs (serverless without Supabase): keep serving the seeded
        // in-memory copy so the site demos instead of erroring. Data written
        // here does not survive the instance — hosted Supabase is the fix.
        this.ephemeral = true;
        console.warn("[local-db] filesystem not writable — running in-memory:", error);
      }
  ```

Everything from here on is backend-agnostic: the code says `store.insert(...)` and doesn't know which world it's in.

### Step 1 — Entry point: the three admin screens

- **List** — [products/page.tsx:12](../../app/admin/%28dashboard%29/products/page.tsx#L12) is a server component: `await listProducts()` and hand the rows to the client `<ProductsList>`. [listProducts()](../../lib/admin/products.ts#L60-L82) shows the read pattern used all over the admin: fetch three whole tables in parallel (`products`, `product_variants`, `product_images`), then join/sort/aggregate in TypeScript — first image as thumbnail, variant count, summed stock.

  ```tsx
  // app/admin/(dashboard)/products/page.tsx:11-25
  export default async function ProductsPage() {
    const rows = await listProducts();
    const items: ProductListItem[] = rows.map((row) => ({
      id: row.product.id,
      title: row.product.title,
      // …
      thumbnailUrl: row.thumbnailPath ? fileUrl(row.thumbnailPath) : null,
      variantCount: row.variantCount,
      totalOnHand: row.totalOnHand,
      // …
    }));
    return <ProductsList items={items} />;
  ```

  ```ts
  // lib/admin/products.ts:60-81
  export async function listProducts(): Promise<ProductListRow[]> {
    const store = getStore();
    const [products, variants, images] = await Promise.all([
      store.all("products"),
      store.all("product_variants"),
      store.all("product_images"),
    ]);
    return products
      .sort((a, b) => a.position - b.position || a.title.localeCompare(b.title))
      .map((product) => {
        const own = variants.filter((variant) => variant.product_id === product.id);
        const thumb = images
          .filter((image) => image.product_id === product.id)
          .sort((a, b) => a.position - b.position)[0];
        return {
          product,
          thumbnailPath: thumb?.path ?? null,
          variantCount: own.length,
          totalOnHand: own.reduce((sum, variant) => sum + variant.inventory_on_hand, 0),
          tracked: own.some((variant) => variant.track_quantity),
        };
      });
  ```

- **Add** — the list's "Add product" button is just a link to `/admin/products/new` ([ProductsList.tsx:125](../../app/admin/%28dashboard%29/products/ProductsList.tsx#L125)), which renders `<ProductForm>` with empty initial values. No database work happens until Save.

  ```tsx
  // app/admin/(dashboard)/products/ProductsList.tsx:123-125
      <Page
        title={t("nav.products")}
        primaryAction={{ content: t("products.add"), url: "/admin/products/new" }}
  ```

- **Edit** — `/admin/products/[id]` loads the real rows: [\[id\]/page.tsx:22](../../app/admin/%28dashboard%29/products/%5Bid%5D/page.tsx#L22) calls [getProductDetail(id)](../../lib/admin/products.ts#L89-L109) (same fetch-3-tables-filter-in-TS pattern) and pre-fills the form.

  ```tsx
  // app/admin/(dashboard)/products/[id]/page.tsx:21-31
    const { id } = await params;
    const detail = await getProductDetail(id);
    if (!detail) {
      notFound();
    }

    const initial: ProductFormInitial = {
      id: detail.product.id,
      title: detail.product.title,
      description: detail.product.description,
      status: detail.product.status,
      // …
  ```

  ```ts
  // lib/admin/products.ts:100-108
    return {
      product,
      images: images
        .filter((image) => image.product_id === id)
        .sort((a, b) => a.position - b.position),
      variants: variants
        .filter((variant) => variant.product_id === id)
        .sort((a, b) => a.position - b.position),
    };
  ```

[ProductForm.tsx](../../app/admin/%28dashboard%29/products/ProductForm.tsx) is one big `"use client"` component. Its buttons call server actions directly, like local async functions: Save → `saveProductAction(payload)` ([ProductForm.tsx:290](../../app/admin/%28dashboard%29/products/ProductForm.tsx#L290)), Duplicate ([:311](../../app/admin/%28dashboard%29/products/ProductForm.tsx#L311)), status change ([:322](../../app/admin/%28dashboard%29/products/ProductForm.tsx#L322)), Delete ([:838](../../app/admin/%28dashboard%29/products/ProductForm.tsx#L838)). The list screen calls the same actions for bulk selections ([ProductsList.tsx:92-100](../../app/admin/%28dashboard%29/products/ProductsList.tsx#L92-L100), delete at [:210](../../app/admin/%28dashboard%29/products/ProductsList.tsx#L210)).

```tsx
// app/admin/(dashboard)/products/ProductForm.tsx:289-301
    startSaving(async () => {
      const result = await saveProductAction(payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setToast(t("form.saved"));
      if (isNew) {
        router.push(`/admin/products/${result.id}`);
      } else {
        router.refresh();
      }
    });
```

```tsx
// app/admin/(dashboard)/products/ProductsList.tsx:98-101 (bulk archive)
    {
      content: t("products.bulk.archive"),
      onAction: () => runBulk(() => setProductStatusAction(selectedResources, "archived")),
    },
```

### Step 2 — The trust boundary: [actions.ts](../../app/admin/%28dashboard%29/products/actions.ts)

The file opens with `"use server"` and its header comment names its job: "the trust boundary between the admin browser and the data layer." Every exported action has the same two-step preamble. Take `saveProductAction` ([actions.ts:70-82](../../app/admin/%28dashboard%29/products/actions.ts#L70-L82)):

```ts
// app/admin/(dashboard)/products/actions.ts:70-82
export async function saveProductAction(payload: unknown): Promise<SaveProductResult> {
  const session = await requireAdmin();
  const parsed = saveProductSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    const id = await saveProduct(parsed.data, session.email);
    return { ok: true, id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Save failed" };
  }
}
```

1. **Who?** [requireAdmin()](../../lib/admin/auth.ts#L214-L220) — anyone can *invoke* a server action (it's an HTTP endpoint under the hood), so each one re-checks the session. Hosted mode requires a valid Supabase login **and** a row in the `admin_users` allowlist ([auth.ts:197-199](../../lib/admin/auth.ts#L197-L199)) — having an account is not enough. Failures get a plain 404, so outsiders can't even learn the admin exists. In local mode with no password configured, everyone is the seeded owner — testing-phase open access ([auth.ts:54-59](../../lib/admin/auth.ts#L54-L59)).

   ```ts
   // lib/admin/auth.ts:214-220
   export async function requireAdmin(): Promise<AdminSession> {
     const session = await getAdminSession();
     if (!session) {
       notFound();
     }
     return session;
   }
   ```

   ```ts
   // lib/admin/auth.ts:194-199
     if (!user) {
       return null;
     }
     if (!(await isAllowlisted(user.id))) {
       return null; // logged in, but not an admin → treated as no session (404)
     }
   ```

   ```ts
   // lib/admin/auth.ts:54-59
   export function isOpenAccess(): boolean {
     // `!url`, not `!hosted`: a PARTIAL Supabase config (URL set, service key
     // missing/mis-scoped) must fail closed to a locked admin — never fall
     // open to the public because one env var didn't make it to the deploy.
     return !getSupabaseEnv().url && !process.env.ADMIN_DEV_PASSWORD?.trim();
   }
   ```

2. **What?** The payload is typed `unknown` on purpose — the browser could send anything. [saveProductSchema](../../app/admin/%28dashboard%29/products/actions.ts#L38-L64) pins every field: title 1–255 chars, status one of three values, prices integer cents 0–100,000,000, at most 100 variants, at most 20 images, handle matching `/^[a-z0-9-]*$/`. Malformed input dies here with a readable error, never reaching the data layer.

   ```ts
   // app/admin/(dashboard)/products/actions.ts:23-63
   const money = z.number().int().min(0).max(100_000_000);
   // …
   const saveProductSchema = z.object({
     id: z.string().trim().min(1).nullable(),
     title: z.string().trim().min(1).max(255),
     description: z.string().max(10_000),
     status: z.enum(["active", "draft", "archived"]),
     // …
     handle: z
       .string()
       .trim()
       .regex(/^[a-z0-9-]*$/)
       .max(120)
       .nullable(),
     // …
     images: z
       .array(z.object({ path: z.string().min(1).max(500), alt: z.string().max(500) }))
       .max(20),
     variants: z.array(variantSchema).min(1).max(100),
   ```

The other actions are the same shape, smaller: `deleteProductsAction` ([actions.ts:110-113](../../app/admin/%28dashboard%29/products/actions.ts#L110-L113)) validates "1–200 non-empty ids", `setProductStatusAction` ([:102-108](../../app/admin/%28dashboard%29/products/actions.ts#L102-L108)) likewise.

```ts
// app/admin/(dashboard)/products/actions.ts:100-113
const idsSchema = z.array(z.string().min(1)).min(1).max(200);

export async function setProductStatusAction(
  ids: string[],
  status: "active" | "draft" | "archived",
): Promise<void> {
  await requireAdmin();
  await setProductStatus(idsSchema.parse(ids), status);
}

export async function deleteProductsAction(ids: string[]): Promise<void> {
  await requireAdmin();
  await deleteProducts(idsSchema.parse(ids));
}
```

### Step 3 — [saveProduct()](../../lib/admin/products.ts#L191-L335): create and edit are one function

`lib/admin/products.ts` is server-only (`import "server-only"` at the top makes the build *fail* if it ever leaks into client code). `saveProduct` handles both Add and Edit — the form sends `id: null` to mean "create" ([products.ts:197](../../lib/admin/products.ts#L197)).

```ts
// lib/admin/products.ts:195-204
  const store = getStore();
  const now = new Date().toISOString();
  const isCreate = input.id === null;
  const products = await store.all("products");
  const existing = isCreate ? null : (products.find((row) => row.id === input.id) ?? null);
  if (!isCreate && !existing) {
    throw new Error(`Unknown product: ${input.id}`);
  }

  const id = existing?.id ?? handle;
```

1. **Identity.** On create, the product's `id` is the handle derived from the title by [productHandle()](../../lib/admin/product-handle.ts) — the deterministic algorithm in [docs/ixd/naming/product-handles.md](../ixd/naming/product-handles.md) ("Gold Rose 24K" → `gold-rose-24k`). So the id doubles as the first URL handle. On a collision the save **throws** with a readable error instead of appending `-2` — the handle rule forbids auto-disambiguation; the admin revises the title or sets a manual handle.

   ```ts
   // lib/admin/product-handle.ts
   const handle = title
     .normalize("NFKD")
     .replace(/[\u0300-\u036f]/g, "")
     .toLowerCase()
     .replace(/['\u2019]/g, "")
     .replace(/[^a-z0-9]+/g, "-")
     .replace(/^-+|-+$/g, "");

   if (handle.length > HANDLE_MAX_LENGTH || !HANDLE_PATTERN.test(handle)) {
     throw new Error(`Cannot derive a URL handle from "${title}" — set one manually.`);
   }
   ```

2. **The row.** One complete `ProductRow` object is assembled ([products.ts:228-251](../../lib/admin/products.ts#L228-L251)); fields the form doesn't own (like `position` and `created_at`) are carried over from the existing row or defaulted.

   ```ts
   // lib/admin/products.ts:228-251
     const row: ProductRow = {
       id,
       handle,
       title: input.title,
       short_name: existing?.short_name ?? input.title.slice(0, 40),
       description: input.description,
       // …
       best_for: existing?.best_for ?? "",
       badge: existing?.badge ?? "",
       details: existing?.details ?? [],
       option_names: input.option_names,
       status: input.status,
       position: existing?.position ?? maxPosition + 1,
       created_at: existing?.created_at ?? now,
       updated_at: now,
     };
   ```

   Then the create/edit fork — the whole difference between Add and Edit at the database level is these five lines ([products.ts:253-257](../../lib/admin/products.ts#L253-L257)):

   ```ts
   // lib/admin/products.ts:253-257
     if (existing) {
       await store.update("products", { id }, row);
     } else {
       await store.insert("products", [row]);
     }
   ```

3. **Variants: upsert kept, delete missing** ([products.ts:259-316](../../lib/admin/products.ts#L259-L316)). Each incoming variant with a known id is updated; ones without get a fresh UUID and are inserted. Any variant currently in the database but *absent from the form* is removed — the form is the full statement of what should exist. Note [products.ts:283](../../lib/admin/products.ts#L283): the update deliberately writes `current?.inventory_on_hand ?? 0`, i.e. the **old** stock number — because stock has its own path (next step).

   ```ts
   // lib/admin/products.ts:265-288
     for (const incoming of input.variants) {
       const current = incoming.id
         ? currentVariants.find((variant) => variant.id === incoming.id)
         : undefined;
       const variantId = current?.id ?? randomUUID();
       keptIds.add(variantId);
       const next: ProductVariantRow = {
         id: variantId,
         product_id: id,
         position,
         // …
         // On-hand changes go through adjustInventory below, not a raw write.
         inventory_on_hand: current?.inventory_on_hand ?? 0,
         // …
       };
       if (current) {
         await store.update("product_variants", { id: variantId }, next);
   ```

   ```ts
   // lib/admin/products.ts:312-316
     for (const variant of currentVariants) {
       if (!keptIds.has(variant.id)) {
         await store.remove("product_variants", { id: variant.id });
       }
     }
   ```

4. **Images: replace, don't diff** ([products.ts:318-331](../../lib/admin/products.ts#L318-L331)). All `product_images` rows for the product are removed, then re-inserted in form order. Simpler than computing a diff, and cheap at ≤20 rows. Only the *rows* (path + alt + position) live here — the files were already uploaded to storage by a separate action before Save.

   ```ts
   // lib/admin/products.ts:318-331
     // --- images: replace rows (files themselves live in storage) ---
     await store.remove("product_images", { product_id: id });
     if (input.images.length > 0) {
       await store.insert(
         "product_images",
         input.images.map((image, index) => ({
           id: randomUUID(),
           product_id: id,
           path: image.path,
           alt: image.alt,
           position: index,
         })),
       );
     }
   ```

### Step 4 — Inventory: never a raw write

If the form shows stock 5 and the database says 3, `saveProduct` does **not** write 5. It writes *the difference* through [store.adjustInventory({delta: +2, reason: "correction", …})](../../lib/admin/products.ts#L289-L297) (new variants log their initial stock as `reason: "received"`, [products.ts:300-308](../../lib/admin/products.ts#L300-L308)).

```ts
// lib/admin/products.ts:289-308
      if (current.inventory_on_hand !== incoming.inventory_on_hand) {
        await store.adjustInventory({
          variantId,
          delta: incoming.inventory_on_hand - current.inventory_on_hand,
          reason: "correction",
          note: "Edited on product form",
          createdBy: actor,
        });
      }
    } else {
      await store.insert("product_variants", [next]);
      if (incoming.inventory_on_hand !== 0) {
        await store.adjustInventory({
          variantId,
          delta: incoming.inventory_on_hand,
          reason: "received",
          note: "Initial quantity",
          createdBy: actor,
        });
      }
```

In hosted mode that becomes an RPC (a call to a function stored *inside* Postgres): [adjust_inventory](../../supabase/migrations/0001_init.sql#L88-L105) updates the stock counter and inserts the log row in one database transaction — no way to get one without the other, even if the server crashes mid-request:

```sql
-- supabase/migrations/0001_init.sql:100-104
  update product_variants
    set inventory_on_hand = inventory_on_hand + p_delta
    where id = p_variant_id;
  insert into inventory_movements (variant_id, delta, reason, note, created_by)
    values (p_variant_id, p_delta, p_reason, p_note, p_created_by);
```

The result is spec rule §7.3: [inventory_movements](../../supabase/migrations/0001_init.sql#L75-L86) is an append-only answer to "why is stock at this number" — every change has a delta, a reason from a fixed list (`correction`, `received`, `order`, `damaged`…), and who did it. The checkout path (doc [01](01-add-to-cart-checkout.md), step 6) uses the same function with `reason: "order"`.

```sql
-- supabase/migrations/0001_init.sql:75-86
create table inventory_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references product_variants(id) on delete cascade,
  delta int not null,
  reason text not null check (reason in (
    'correction', 'count', 'received', 'return_restock',
    'damaged', 'theft_or_loss', 'promotion_or_donation', 'order'
  )),
  note text,
  created_by text,
  created_at timestamptz not null default now()
);
```

### Step 5 — Delete vs archive: two different "remove" ideas

- **Archive is the soft one.** [setProductStatus(ids, "archived")](../../lib/admin/products.ts#L396-L403) just updates the `status` column. An archived product keeps every row; it merely stops matching the storefront's `where status = 'active'` filter, so it vanishes from the shop but is one click from coming back.

  ```ts
  // lib/admin/products.ts:396-403
  export async function setProductStatus(ids: string[], status: ProductStatus): Promise<void> {
    const store = getStore();
    const now = new Date().toISOString();
    for (const id of ids) {
      await store.update("products", { id }, { status, updated_at: now });
    }
    revalidateStorefront();
  }
  ```

- **Delete really deletes.** [deleteProducts()](../../lib/admin/products.ts#L412-L431) — the docstring calls it "Shopify's red-confirm Delete: really deletes":

  ```ts
  // lib/admin/products.ts:414-429
    for (const id of ids) {
      const variants = (await store.all("product_variants")).filter(
        (variant) => variant.product_id === id,
      );
      for (const variant of variants) {
        await store.update(
          "order_lines",
          { variant_id: variant.id },
          { variant_id: null },
        );
        await store.remove("inventory_movements", { variant_id: variant.id });
        await store.remove("product_variants", { id: variant.id });
      }
      await store.remove("product_images", { product_id: id });
      await store.remove("products", { id });
    }
  ```

  The `order_lines` update is the interesting one. Orders are never deleted in this system, but their lines point at variants via a *foreign key* (a column that must reference an existing row). Deleting the variant would break that link — so the code first sets `order_lines.variant_id` to null, matching the schema's `on delete set null` design ([0001_init.sql:188](../../supabase/migrations/0001_init.sql#L188)). History survives because order lines **snapshot** the name/sku/price at purchase time ([0001_init.sql:184-196](../../supabase/migrations/0001_init.sql#L184-L196)) — an order from March still shows "Gold Rose — $59.00" even if the product died in April.

  ```sql
  -- supabase/migrations/0001_init.sql:184-195
  create table order_lines (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null references orders(id) on delete cascade,
    -- Snapshot columns (sku/name/option) keep history intact if the product goes.
    variant_id uuid references product_variants(id) on delete set null,
    product_id text,
    sku text not null default '',
    name text not null,
    option text not null default '',
    quantity int not null check (quantity > 0),
    unit_amount_cents int not null,
    line_total_cents int not null
  ```

### Step 6 — What the database enforces on its own

Even if every TypeScript check above were bypassed, [0001_init.sql](../../supabase/migrations/0001_init.sql) has its own opinions — worth learning as the industry habit of *defense in depth* (don't rely on one layer being perfect):

- **Constraints**: `status` must be one of three values ([:39-40](../../supabase/migrations/0001_init.sql#L39-L40)), at most 3 option names ([:37-38](../../supabase/migrations/0001_init.sql#L37-L38)), `handle` unique ([:21](../../supabase/migrations/0001_init.sql#L21)). Bad data is rejected by Postgres itself.

  ```sql
  -- supabase/migrations/0001_init.sql:19-40
  create table products (
    id text primary key,
    handle text not null unique,
  -- …
    option_names text[] not null default '{}'
      check (coalesce(array_length(option_names, 1), 0) <= 3),
    status text not null default 'draft'
      check (status in ('active', 'draft', 'archived')),
  ```

- **Trigger**: `products_touch_updated_at` ([:449-459](../../supabase/migrations/0001_init.sql#L449-L459)) stamps `updated_at` on every update — code can forget, the database won't.

  ```sql
  -- supabase/migrations/0001_init.sql:449-459
  -- keep products.updated_at fresh on every edit
  create function touch_updated_at() returns trigger
  language plpgsql as $$
  begin
    new.updated_at = now();
    return new;
  end $$;

  create trigger products_touch_updated_at
    before update on products
    for each row execute function touch_updated_at();
  ```

- **Cascades**: `product_images.product_id … on delete cascade` ([:48](../../supabase/migrations/0001_init.sql#L48)) — orphan child rows are cleaned automatically if a product row goes.

  ```sql
  -- supabase/migrations/0001_init.sql:46-48
  create table product_images (
    id uuid primary key default gen_random_uuid(),
    product_id text not null references products(id) on delete cascade,
  ```

- **RLS**: enabled on every table, with exactly one policy in the whole schema (public read of `site_content`, [:431-433](../../supabase/migrations/0001_init.sql#L431-L433)). So the public anon key can write **nothing** and read almost nothing ([:437-439](../../supabase/migrations/0001_init.sql#L437-L439)) — the only reason admin writes work at all is that the service key bypasses RLS, and that key exists only server-side. The security of every write in this doc ultimately rests on that one fact.

  ```sql
  -- supabase/migrations/0001_init.sql:431-439
  -- No table policies exist except this one: anon may read site content slots.
  create policy site_content_public_read on site_content
    for select to anon, authenticated using (true);

  -- Views execute with their owner's rights, so these grants (not RLS) are the
  -- control. Lock the API roles down to exactly the safe surface.
  revoke all on all tables in schema public from anon, authenticated;
  grant select on catalog_products to anon, authenticated;
  grant select on site_content to anon, authenticated;
  ```

### Step 7 — After every write: tell the storefront

Each mutation ends with [revalidateStorefront()](../../lib/admin/products.ts#L46-L53) — it calls Next.js `revalidatePath` on `/`, `/shop`, `/products/[slug]`, plus `/sitemap.xml` and `/llms.txt`.

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

Every write path in this doc ends there — `saveProduct` at [products.ts:333](../../lib/admin/products.ts#L333), `setProductStatus` at [:402](../../lib/admin/products.ts#L402), `deleteProducts` at [:430](../../lib/admin/products.ts#L430). The storefront pages are cached (they don't query the database per visitor); this stamps those caches stale so the *next* visitor triggers a fresh database read and sees the edit immediately, instead of waiting out the normal 5-minute cache window. How that read side works — the view, the anon key, the three cache layers — is doc [04](04-how-pages-read-the-database.md).
