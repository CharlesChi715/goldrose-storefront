# Feature Learning 05 — Verifying What's Really in the Hosted Database

Traced end to end per [README.md](README.md).
This doc is not about a screen the customer sees. It traces an **operator** path: you sitting at a terminal, asking the live database "is this rule actually in you?" — and getting a trustworthy answer without a SQL console. It leans on the two-backend `TableStore` idea from [03 — Admin product CRUD](03-admin-product-crud.md) Step 0 and the key-trust split from [04 — How pages read the database](04-how-pages-read-the-database.md).

## Feature Summary

**What it does**
Answers one question — *does the CHECK constraint [`discounts_value_range`](../../supabase/migrations/0003_tracking_carrier_and_hardening.sql#L31-L34) exist on the hosted database?* — by deliberately trying to insert a row that breaks it. Postgres rejects the row and names the constraint in the error. Rejection **is** the proof. Nothing is written.

**Why it exists — three reasons, all real**

1. **The migration was applied by hand, so nobody could be sure.** Migrations `0001`–`0003` were pasted into the Supabase dashboard SQL editor, which meant Postgres's own bookkeeping table `supabase_migrations.schema_migrations` was **empty**. The database had the tables but no record of *how* it got them. The repo's `.sql` files said what *should* be true; only the database knew what *was* true.
2. **No SQL console was reachable.** `supabase db dump` needs Docker, and Docker is unusable on this Mac (`/var/run/docker.sock` symlinks into another macOS user's home). The Management API needs a personal access token nobody had issued. So: no arbitrary `SELECT`.
3. **This particular constraint is load-bearing.** See Step 5 — the app does *not* validate discount values. The database is the only guard.

**The industry principle: trust, but verify.**
A migration file in git is a statement of *intent*. The running database is *fact*. Any time those two can drift — and hand-applied SQL guarantees drift — you need a cheap way to check fact against intent. That is all this technique is.

## Code Trace

### The path a probe takes

```text
YOU (terminal)                    NETWORK              SUPABASE (hosted)
──────────────                    ───────              ─────────────────
cd goldrose-storefront
set -a; . ./.env.local; set +a
  │ exports NEXT_PUBLIC_SUPABASE_URL
  │         SUPABASE_SERVICE_ROLE_KEY
  ▼
curl -X POST /rest/v1/discounts ──── HTTPS ─────▶ PostgREST
  -d '{"value": -1, ...}'                          │ auth: service_role key
                                                   │  → bypasses all RLS
                                                   │ translates REST → SQL
                                                   ▼
                                                 INSERT INTO discounts
                                                   (code, type, value)
                                                 VALUES (…, 'percentage', -1)
                                                   │
                                                   ▼
                                                 Postgres evaluates every
                                                 CHECK on the table
                                                   │
                                    ┌──────────────┴──────────────┐
                          constraint EXISTS              constraint MISSING
                                    │                             │
                                    ▼                             ▼
                          reject + ROLLBACK              row is committed ⚠
                          (row never existed)            (you must DELETE it)
                                    │                             │
                                    ▼                             ▼
  HTTP 400  ◀──────────────  SQLSTATE 23514              HTTP 201 + row echo
  {"code":"23514",           check_violation
   "message":"… violates
    check constraint
    \"discounts_value_range\""}
        │
        ▼
  ✅ PROOF: the rule is live
```

### Step 1 — Entry point: loading credentials into the shell

```bash
cd ~/Developer/goldrose-storefront
set -a; . ./.env.local; set +a
```

`.` is shorthand for `source` — run that file inside the *current* shell so its variables survive afterwards. `set -a` ("allexport") makes every variable defined from now on automatically exported, which is what lets a child process like `curl` see them; `set +a` switches that back off.

Confirm they loaded **without printing the secret**:

```bash
echo "url = $NEXT_PUBLIC_SUPABASE_URL"
echo "key length = ${#SUPABASE_SERVICE_ROLE_KEY}"     # ~200, never the value
```

`${#VAR}` yields a variable's *length*. Make this a reflex: secrets that reach your scrollback also reach your shell history and any screen share.

The three variables in `.env.local` (gitignored, so it exists only on your machine) are the same ones [lib/supabase/env.ts](../../lib/supabase/env.ts) validates at build time — blank them all and the app silently switches to the `.data/db.json` file adapter instead (that is how the e2e suite runs).

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

Two of those three are exactly what the `curl` probe below carries in its headers, so if the app can reach hosted Supabase, so can you.

### Step 2 — A harmless read first, to prove the pipe works

```bash
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/discounts?select=code,type,value" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```
```json
[{"code":"GOLD10","type":"percentage","value":10}]
```

Never fire a write at a live database before proving the read path works — otherwise a failure is ambiguous (wrong URL? bad key? or the thing you were testing?).

**What PostgREST is.** Supabase runs a service that exposes every table as a URL automatically. No API code was written for this; it is generated from the schema. The mapping is mechanical:

```
SELECT code, type, value FROM discounts;
        ↓
GET /rest/v1/discounts?select=code,type,value
```

`curl` fetches a URL from the command line. `-s` silences the progress meter. `-H` sets a **header** — metadata sent alongside the request, here carrying credentials.

⚠️ **`service_role` is the master key.** It bypasses Row Level Security entirely — every policy that protects customer data is simply skipped. It belongs only in `.env.local` (gitignored) and server-side code. The **anon** key is the one safe to ship to browsers, and per [04](04-how-pages-read-the-database.md) it can see nothing but the `catalog_products` view.

### Step 3 — The probe: break the rule on purpose

```bash
curl -s -w "\nHTTP %{http_code}\n" -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/discounts" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"code":"__ZZ_CONSTRAINT_PROBE__","type":"percentage","value":-1}'
```

`-X POST` switches from read to create. `-d` is the JSON body. `-w "…%{http_code}"` prints the response status code, which carries the verdict.

Only `code` and `type` are supplied because [0001_init.sql](../../supabase/migrations/0001_init.sql#L228-L241) declares everything else with a default. `value: -1` is the illegal part — that is the entire point.

```sql
-- supabase/migrations/0001_init.sql:228-241
create table discounts (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  type text not null check (type in ('percentage', 'fixed_amount', 'free_shipping')),
  value int not null default 0, -- percent (0-100) or cents, by type
  applies_to jsonb, -- null = whole order; { product_ids: [...] } otherwise
  min_purchase_cents int,
  usage_limit int,
  once_per_customer boolean not null default false,
  used_count int not null default 0,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now()
);
```

Note that `type` carries a CHECK of its own, written back in `0001` — so `'percentage'` in the probe body is a legal value and cannot be what the rejection is about.

The name `__ZZ_CONSTRAINT_PROBE__` is chosen so it is impossible to confuse with real data, trivial to grep for, and sorts to the end of any list.

### Step 4 — Reading the verdict

| Response                         | Meaning                                                                                      | Action                               |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `HTTP 400`, SQLSTATE `23514`     | ✅ Constraint **exists** — `23514` is Postgres's `check_violation`, and the message names it | none; nothing was written            |
| `HTTP 201` + the row echoed back | ❌ Constraint **missing** — a bad row now exists                                             | delete it, then apply the constraint |

The actual result on 2026-07-25:

```json
{"code":"23514",
 "details":"Failing row contains (4997cf32-…, __ZZ_CONSTRAINT_PROBE__, percentage, -1, …).",
 "message":"new row for relation \"discounts\" violates check constraint \"discounts_value_range\""}
HTTP 400
```

**Why "Failing row contains …" is not alarming.** Postgres is showing what it *refused* to write — including the UUID and timestamps it had already generated from defaults. A rejected `INSERT` is rolled back, so that row never existed for a single instant. That is **atomicity**: a statement either fully happens or not at all. It is precisely this guarantee that makes the technique safe.

### Step 5 — Why this particular constraint carries real weight

Look at [`saveDiscount()`](../../lib/admin/discounts.ts#L56-L88), which every admin discount edit flows through:

```ts
// lib/admin/discounts.ts:59-72
  const clash = discounts.find(
    (row) =>
      row.code.toLowerCase() === input.code.toLowerCase() && row.id !== input.id,
  );
  if (clash) {
    throw new Error(`The code "${input.code}" is already in use.`);
  }
  // …
    value: input.value,
```

Duplicate **codes** are rejected in TypeScript. The **value** is not validated anywhere — not for negatives, not for percentages above 100. So on hosted, `discounts_value_range` is not a redundant safety net; it is the *only* thing between a mistyped `-50` and a discount that pays customers to order.

That constraint, in full, is the rule the probe was measuring:

```sql
-- supabase/migrations/0003_tracking_carrier_and_hardening.sql:31-34
-- Percent discounts stay 0–100; every discount value is non-negative
-- (value is cents for fixed_amount, a percent for percentage — §7.8).
alter table discounts add constraint discounts_value_range
  check (value >= 0 and (type <> 'percentage' or value <= 100));
```

Read it aloud: value must be at least 0, **and** if the type is `percentage` it must also be at most 100. The probe's `-1` fails the first half — which is why Postgres answered with that constraint's name.

This is the general lesson, and it's why the audit added the constraint at all:

> **Application validation is a convenience; database constraints are the guarantee.**
> App checks give a friendly error message, but they can be bypassed by a bug, a
> script, a direct SQL edit, or a second client written later. A constraint cannot
> be bypassed by anything short of dropping it.

Worth knowing: in **local/mock mode** the file adapter ([lib/supabase/local.ts](../../lib/supabase/local.ts)) is a plain JSON store with no constraint engine, so it *will* happily accept `-50`. Its entire `insert` is a push onto an array:

```ts
// lib/supabase/local.ts:143-149
  insert<T extends TableName>(table: T, rows: DbTables[T][]): Promise<void> {
    return this.locked(async () => {
      const db = await this.load();
      db.tables[table].push(...structuredClone(rows));
      await this.persist(db);
    });
  }
```

There is no place in those five lines where a CHECK could even be consulted. Bad discount values are caught on hosted only. That asymmetry is a general property of the two-backend design, not a bug — but it means "it worked locally" proves nothing about data integrity.

### Step 6 — Cleanup, run unconditionally

```bash
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/discounts?select=code,value" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

Expect `GOLD10` alone. Run this **even when you expect rejection** — you are verifying the outcome you assumed, which is the entire spirit of the exercise. If the probe did succeed:

```bash
curl -s -X DELETE "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/discounts?code=eq.__ZZ_CONSTRAINT_PROBE__" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

`?code=eq.__ZZ_…` is PostgREST's filter syntax — `eq.` means `=`, so this is `WHERE code = '__ZZ_CONSTRAINT_PROBE__'`. **A `DELETE` with no filter deletes every row in the table**, so check the URL twice before pressing enter.

### Step 7 — When NOT to probe

The probe is safe on `discounts` because that table is **inert**: nothing observes it, and a stray row causes no side effect. "Nothing observes it" is a claim you can check rather than assume — triggers are the database's own way of reacting to a write, so grep the migrations for them:

```bash
grep -n "create trigger" supabase/migrations/*.sql
# supabase/migrations/0001_init.sql:457:create trigger products_touch_updated_at
```

One trigger in the whole schema, and it is on `products`, not `discounts`:

```sql
-- supabase/migrations/0001_init.sql:457-459
create trigger products_touch_updated_at
  before update on products
  for each row execute function touch_updated_at();
```

Do **not** probe a table where a *successful* insert triggers something irreversible — an `orders` row that sends a confirmation email, charges a card, or fires a webhook. The whole method rests on "if the constraint is missing, the write goes through." When the write going through sends an email, you cannot roll that back.

Checklist before probing any table:

- [ ] A successful insert here has **no side effects** (no email, payment, webhook, inventory move)
- [ ] The probe value is **obviously fake** and easy to find (`__ZZ_…`)
- [ ] You know the **exact DELETE** you would run, before you run the INSERT
- [ ] You verify afterwards **regardless** of the result

### Step 8 — The cleaner method, once a token exists

Probing is a workaround for having no SQL console. The direct method asks Postgres's own catalog — and **this already works today in the dashboard SQL editor**:

```sql
select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'discounts'::regclass;
```

`pg_constraint` is the system table listing every constraint; `'discounts'::regclass` converts the table name to the internal id it stores. This lists all constraints on the table with their definitions — no writes, no risk.

**Important distinction, because it caused the original mess:**

| In the dashboard SQL editor                   | Verdict                                              |
| --------------------------------------------- | ---------------------------------------------------- |
| `SELECT …` — reading, inspecting the catalog  | ✅ **Fine.** Harmless, often the fastest way to look |
| `CREATE TABLE`, `ALTER TABLE`, `CREATE INDEX` | ❌ **Don't.** Bypasses CLI tracking → history desync |

Schema changes belong in a numbered file under [supabase/migrations/](../../supabase/migrations/) applied with `supabase db push`. That is **infrastructure as code**: the schema lives in git, is reviewable in a PR, and can be replayed onto a fresh database in order. Clicking SQL into a dashboard leaves no trace of any of that — which is exactly why `schema_migrations` was empty and why this whole doc had to exist.

The history was repaired on 2026-07-25 with two commands — the first writes only the bookkeeping table (no schema or data change), the second asks Supabase what it *would* push and gets back nothing:

```bash
supabase migration repair --status applied 0001 0002 0003
supabase db push --dry-run     # → "Remote database is up to date."
```

## Recap — verifying without a console

```text
question:  is rule X live on the hosted database?
           │
           ├─ have SQL access?  ──yes──▶  select from pg_constraint     ← preferred
           │                              (dashboard editor is fine for reads)
           └─ no ──▶ probe: attempt the forbidden write
                       ├─ rejected (23514) ──▶ rule EXISTS, nothing written  ✅
                       └─ accepted (201)   ──▶ rule MISSING, delete the row  ⚠
                     …only on a table with no side effects, and always verify after
```

Three ideas worth carrying to other projects:

1. **A rejection is a measurement.** Making a system refuse you is a legitimate way to learn its rules when you cannot read them directly. Failed writes are safe *because* of transactional rollback.
2. **Constraints outrank app validation.** TypeScript checks are UX; the database is the guarantee. `saveDiscount()` never checks `value` — the constraint is the real defence.
3. **Fact drifts from intent whenever changes are applied by hand.** The cure is that every schema change goes through a tracked, replayable migration — and that the tracking table is never allowed to sit empty.
