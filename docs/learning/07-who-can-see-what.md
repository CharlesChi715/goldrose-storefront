# Feature Learning 07 — Who Can Get In, and Who Can See What

Traced end to end per [learning-docs-guideline.md](learning-docs-guideline.md).
[04 — How pages read the database](04-how-pages-read-the-database.md) covered the *anon key vs service key* split from the data side. This doc traces the other half: a person arriving at `/admin`, and every gate between them and the store's orders. It is the security model of the whole project in one path.

## Feature Summary

**What it does**
Decides three separate questions, in this order:

1. **Who are you?** (authentication — a session)
2. **Are you allowed in here?** (authorization — the `admin_users` allowlist)
3. **What can you do once in?** (owner vs team member)

**Why it exists**
The admin can read every customer's address and every order. It is the highest-value surface in the repo, and it lives at a guessable URL on a public domain. Two design commitments shape everything:

- **The app runs in two modes** — hosted Supabase, or a local JSON file with no auth server at all ([03](03-admin-product-crud.md) Step 0). Both need a working login. They cannot share one.
- **Being logged in is not the same as being an admin.** Customers and admins share one Supabase user table. A valid session proves *identity*, never *permission*.

Key jargon:
- **Authentication (authn)** = proving who you are. **Authorization (authz)** = what you're allowed to do. Conflating them is the classic security bug.
- **HMAC** = a hash of `(secret, message)`. Anyone with the secret can verify the message wasn't altered; nobody without it can produce a valid hash.
- **RLS (Row Level Security)** = Postgres deciding, per row, whether the connecting role may see it.
- **Allowlist** = an explicit list of who's permitted. The opposite is a blocklist, which is always incomplete.

## Code Trace

```text
 REQUEST → /admin/orders
      │
      ▼
 ┌──────────────────────────────────────────────────────────────┐
 │ proxy.ts   (edge, matcher: /admin/*, /api/admin/*)           │
 │  public path (/admin/login, …)?           → let through      │
 │  hosted?  supabase.auth.getUser()                            │
 │    ├─ no user  → redirect /admin/login                       │
 │    └─ user     → next()      ← does NOT check the allowlist  │
 │  not hosted?                                                 │
 │    ├─ no dev password → next()   ← OPEN ACCESS (test mode)   │
 │    ├─ no cookie       → redirect /admin/login                │
 │    └─ cookie present  → next()   ← presence only, no verify  │
 └───────────────────────────┬──────────────────────────────────┘
                             ▼
 ┌──────────────────────────────────────────────────────────────┐
 │ app/admin/(dashboard)/layout.tsx   requireAdmin()            │
 │   lib/admin/auth.ts getAdminSession()                        │
 │     hosted:   getUser()  →  isAllowlisted(user.id)  ← authz  │
 │     local:    verifyLocalToken(cookie)   HMAC + expiry       │
 │   null → notFound()   ← 404, never 401/403                   │
 └───────────────────────────┬──────────────────────────────────┘
                             ▼
        every server action calls requireAdmin() AGAIN
        (actions are their own POST endpoints; the layout
         does not protect them)
                             ▼
 ┌──────────────────────────────────────────────────────────────┐
 │ owner-only operations: teamOwnerId(listTeam()) === you?      │
 └──────────────────────────────────────────────────────────────┘

 Second wall, independent of all the above:
   Postgres RLS — anon key can read exactly 2 objects, write nothing.
```

### Step 1 — The proxy: a redirect, not a lock

[proxy.ts](../../proxy.ts) is Next.js 16's renamed middleware (the file used to be `middleware.ts`; the exported function is now `proxy()`). It runs at the edge before any page does, and it matches only two path families:

```ts
export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
```

Narrow on purpose. Storefront routes stay statically optimised, and the PayPal webhook and analytics beacon are deliberately *unmatched* — they authenticate with a signature, not a session, so a session check there would only break them.

The part worth staring at, in the local branch ([proxy.ts:51](../../proxy.ts#L51)):

```ts
if (!request.cookies.get(SESSION_COOKIE)) { /* redirect to login */ }
return NextResponse.next();      // cookie present → through. Not verified.
```

**The proxy checks that a cookie exists. It does not check that the cookie is genuine.** The reason is stated at [proxy.ts:10-12](../../proxy.ts#L10-L12): the edge runtime has no filesystem, so it cannot read the signing secret from `.data/admin-secret`. Type `document.cookie = "admin_session=hello"` and you will sail past the proxy — and then get a flat 404 from the layout, which *does* verify.

Same shape in hosted mode: the proxy confirms you are *someone* (`getUser()`), never that you are an *admin*. A logged-in customer passes it.

This is worth internalising as a pattern rather than a flaw:

> **Middleware is for redirects and UX. The authorization boundary belongs next to the data.**
> A guard at the edge can be bypassed by any route that isn't matched, any new route someone adds tomorrow, and any direct call to a server action. A guard in the layout and in each action cannot.

### Step 2 — `getAdminSession()`: two modes, one return type

[lib/admin/auth.ts:173-208](../../lib/admin/auth.ts#L173-L208) is the fork.

**Hosted:** `supabase.auth.getUser()` — note `getUser()`, not `getSession()`. `getSession()` reads the cookie and believes it; `getUser()` round-trips to the auth server and validates the signature. Then, crucially:

```ts
if (!(await isAllowlisted(user.id))) { return null; }   // logged in ≠ admin
```

**Local:** there is no auth server, so the app mints its own token ([:123-128](../../lib/admin/auth.ts#L123-L128)):

```ts
const expires = Date.now() + LOCAL_SESSION_DAYS * 24 * 60 * 60 * 1000;
const payload = `${Buffer.from(email).toString("base64url")}.${expires}`;
return `${payload}.${sign(secret, payload)}`;
```

The format is `base64url(email) . expiryMs . HMAC-SHA256(secret, "email.expiry")`. That is a hand-rolled signed cookie — deliberately *not* a JWT. A JWT carries an algorithm field, which is the source of the infamous `alg: none` attack where an attacker declares "this token is unsigned, please trust it." With no header there is no algorithm to lie about. In hosted mode real JWTs are used, because there Supabase is a separate party that has to verify them.

Verification ([:136-152](../../lib/admin/auth.ts#L136-L152)) checks in the right order — **signature first, expiry second**:

```ts
if (!safeEqual(mac, sign(secret, payload))) { return null; }
if (Number(expires) < Date.now()) { return null; }
```

Order matters because the expiry lives *inside* the signed payload. Checking expiry first would mean reasoning about a number an attacker might have written.

And the comparison is `safeEqual`, not `===` ([:111-115](../../lib/admin/auth.ts#L111-L115)):

```ts
return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
```

`===` on strings stops at the first differing character, so a wrong guess that shares a longer prefix takes measurably longer to reject. Over enough requests that timing difference leaks the correct value one character at a time. `timingSafeEqual` always compares every byte. This is a **timing side channel**, and using the constant-time comparison for any secret is a reflex worth having — it costs nothing.

### Step 3 — 404, not 403

```ts
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) { notFound(); }
  return session;
}
```

Signed out, signed in but not allowlisted, forged cookie — all three produce an identical plain **404**, not `401 Unauthorized` or `403 Forbidden`.

`403` is an admission: *this page exists and you're not allowed*. `404` says nothing. A scanner sweeping the domain learns only that there is no page there. The cost is a slightly confusing experience for a legitimate admin who has been removed from the team — a trade this project accepts, and the sort of trade worth making consciously rather than by accident.

The same reasoning drives three other choices:

- Wrong password gives exactly `"Your email or password is incorrect."` — never "no such account", which would turn the login form into an email-address oracle.
- `sendPasswordReset()` returns `void` and the action always reports `"sent"` ([team.ts:124-135](../../lib/admin/team.ts#L124-L135)) — so it cannot be used to probe which addresses have accounts.
- The one intentional disclosure is `"pending"` (correct password, not yet approved), justified because only the account's real owner can reach that branch.

### Step 4 — The allowlist is the actual authorization

[auth.ts:161-164](../../lib/admin/auth.ts#L161-L164):

```ts
async function isAllowlisted(userId: string): Promise<boolean> {
  const admins = await getStore().all("admin_users");
  return admins.some((row) => row.user_id === userId);
}
```

`admin_users` is a two-column table ([0001_init.sql:339-342](../../supabase/migrations/0001_init.sql#L339-L342)) whose `user_id` references `auth.users(id) on delete cascade` — delete the auth account and admin access evaporates with it, automatically. Letting the database enforce that relationship beats remembering to clean up in application code.

This separation is the model's backbone. **Signing up creates an account with zero access.** [`signUpForApproval()`](../../lib/admin/team.ts#L151-L184) creates the auth user and writes *no* `admin_users` row; someone already inside must approve it. Notice it deliberately uses the **anon** key, not the service key:

```ts
// Anon client on purpose: sign-up is the one public operation.
const anon = createClient(env.url, env.anonKey, { ... });
```

Using service-role would have worked and would have quietly bypassed Supabase's own rate limits and captcha on sign-up. Reaching for the powerful key by default is how those protections get lost.

Passkeys make the separation unavoidable. WebAuthn runs entirely in the browser, so by the time the server hears about it the session cookie already exists — [`confirmPasskeySignIn()`](../../lib/admin/auth.ts#L280-L296) is a *post-hoc* check, and on failure it calls `signOut()` to revoke what the browser just obtained. The threat is named in the comment: a customer whose passkey also opens the storefront account. Same Supabase project, same user table, same relying-party ID — the WebAuthn layer literally cannot tell an admin's passkey from a customer's. Only the allowlist can.

### Step 5 — Failing closed

The single most instructive line in the file ([auth.ts:54-59](../../lib/admin/auth.ts#L54-L59)):

```ts
export function isOpenAccess(): boolean {
  // `!url`, not `!hosted`: a PARTIAL Supabase config (URL set, service key
  // missing/mis-scoped) must fail closed to a locked admin — never fall
  // open to the public because one env var didn't make it to the deploy.
  return !getSupabaseEnv().url && !process.env.ADMIN_DEV_PASSWORD?.trim();
}
```

"Open access" is the testing-phase mode where the admin has no login at all. The tempting condition is `!hosted`. But `hosted` means *URL and service key both present* — so a deploy where the service key didn't make it into Vercel would satisfy `!hosted`, and the admin would silently open to the entire internet.

Keying on `!url` instead means a half-configured deploy locks itself: `isOpenAccess()` is false, `getAdminSession()` returns null, everything 404s. Broken, loudly, instead of working insecurely and quietly.

> **Fail closed.** When configuration is ambiguous, the safe default is *no access*, not *all access*. Every predicate that gates a security decision deserves the question: "which way does this go when an env var is missing?"

There are three different "is this hosted?" tests in the codebase and they disagree on purpose:

| Predicate | Definition | Why |
| --- | --- | --- |
| [`env.hosted`](../../lib/supabase/env.ts#L32) | `url && serviceKey` | data layer — needs the write key |
| [proxy](../../proxy.ts#L36-L38) | `url && anonKey` | edge — only calls `getUser()` |
| [`isOpenAccess()`](../../lib/admin/auth.ts#L58) | `!url && !devPassword` | fails closed on partial config |

### Step 6 — Defence in depth: RLS as the second wall

Everything above is enforced in Node. If an attacker could talk to Postgres directly, none of it would apply. That is what [0001_init.sql:407-439](../../supabase/migrations/0001_init.sql#L407-L439) is for:

```sql
alter table products enable row level security;
... 18 tables ...

-- No table policies exist except this one: anon may read site content slots.
create policy site_content_public_read on site_content
  for select to anon, authenticated using (true);

-- Views execute with their owner's rights, so these grants (not RLS) are the
-- control. Lock the API roles down to exactly the safe surface.
revoke all on all tables in schema public from anon, authenticated;
grant select on catalog_products to anon, authenticated;
grant select on site_content to anon, authenticated;
```

Eighteen tables with RLS on and **one** policy between them. In Postgres, RLS enabled with no permissive policy means *deny everything* — so the anon key that ships to every visitor's browser can read exactly two objects and write nothing.

Two details are easy to miss and both are load-bearing:

1. **Views ignore the RLS of their underlying tables.** A view runs with its *owner's* privileges, so `catalog_products` would happily surface `products` rows despite RLS. The control is the `grant`, which is why the migration revokes everything first and then grants back precisely two reads.
2. **`catalog_products` is a curated surface, not a table.** It exposes `in_stock` as a boolean rather than the raw count, and omits `cost_cents` entirely ([:366-405](../../supabase/migrations/0001_init.sql#L366-L405)). Even a total compromise of the anon key leaks no margins and no stock levels.

Note the honest framing: the app's data layer uses the **service-role key**, which bypasses RLS completely. RLS here is not the primary authorization mechanism — it is the wall that still stands if the anon key leaks. That is exactly what defence in depth means: layers that don't depend on each other.

One gap worth knowing about: the `security definer` helper `adjust_inventory()` ([:88-105](../../supabase/migrations/0001_init.sql#L88-L105)) has no `revoke execute … from public`, so it remains callable by anon over PostgREST RPC. It has a pinned `search_path` (the standard hardening), but "deny by default" doesn't yet extend to functions.

### Step 7 — Every action re-checks

The dashboard layout calls `requireAdmin()` once ([layout.tsx:28](../../app/admin/%28dashboard%29/layout.tsx#L28)) — and then roughly thirty-five server actions each call it *again*.

That is not redundancy. A React server action compiles to its own addressable POST endpoint; it can be invoked directly with `curl`, without ever rendering the layout. **Layout protection protects rendering, not mutation.** Anywhere a framework gives you an implicit entry point, the guard has to sit on the entry point.

There is exactly one deliberate exception, and it documents itself ([app/admin/actions.ts:18-31](../../app/admin/actions.ts#L18-L31)): the language-toggle action skips the check because it only writes the caller's own display-language cookie against a whitelist, and the auth check cost a Supabase round trip per toggle. That is a defensible exception *because it was reasoned about and written down*.

### Step 8 — Owner: derived, never stored

There is no `role` column anywhere. Owner is computed ([lib/admin/team-owner.ts:26-36](../../lib/admin/team-owner.ts#L26-L36)): the **earliest-created approved account wins**. `auth.users.created_at` is immutable, so the answer cannot drift without a deliberate allowlist edit — and no migration was needed to add the concept.

The only owner-gated operation is removing a team member ([team/actions.ts:21-34](../../app/admin/%28dashboard%29/settings/team/actions.ts#L21-L34)), and its four checks run in a specific order:

```ts
const session = await requireRealAdmin();               // 1 authn
const parsed = id.parse(userId);                        // 2 input validation
if (parsed === session.userId) { throw … }              // 3 no self-removal
if (teamOwnerId(await listTeam()) !== session.userId) { throw … }   // 4 authz
```

Three things to take from it:

- **Approving is any-admin; removing is owner-only; self-removal is nobody.** Asymmetric on purpose — granting is cheap and reversible, revoking can lock everyone out. Check 3 exists purely to prevent the zero-admins state.
- The comment says the UI hiding the button is *cosmetic*. Correct: hiding a control is a courtesy to honest users, never a security measure.
- [`listTeam()`](../../lib/admin/team.ts#L47-L89) paginates `auth.admin.listUsers()` to exhaustion, and the comment explains why that is a security fix rather than a completeness nicety: storefront customers share `auth.users`, so a single page could drop the earliest admin — and with them, owner detection.

### Step 9 — The customer side, and one conservative decision

Storefront sign-in is an emailed one-time code ([ShoppingLogin.tsx:424-459](../../components/login/ShoppingLogin.tsx#L424-L459)) with `shouldCreateUser: true`, so signing in and signing up are one operation.

The interesting rule is in [lib/account/data.ts:9-14](../../lib/account/data.ts#L9-L14) — when is it safe to show someone the orders attached to their email address?

> "linking by email is only allowed for identities whose email the provider actually verified (Google / Apple OAuth). Password accounts are auto-confirmed while the admin's confirm-email stays off, so trusting their email would let anyone claim a stranger's order history by signing up with that address."

That is precisely right, and it is the sort of reasoning that separates a login screen from an access-control system: *an email address in a session is a claim, not a proof, unless someone verified it.*

Worth flagging, though: the allowlist is `["google", "apple"]`, and today's only live method is emailed OTP, whose provider string is `"email"`. So no current storefront user links to their orders — signed-in customers see an empty order list. Arguably an emailed code *does* prove control of the address, but the allowlist wasn't widened when OTP replaced OAuth. Erring conservative is the right direction to err; it's still a gap to close deliberately rather than by drift.

## Recap — the model in one page

```text
authn  "who are you"          session cookie (HMAC local / JWT hosted)
                              ↓  proves identity only
authz  "may you be here"      admin_users allowlist — a separate, granted fact
                              ↓  checked in the layout AND in every action
role   "what may you do"      owner = earliest approved account (derived)

wall 2 (independent)          Postgres RLS: anon reads 2 objects, writes none
```

Eight ideas that transfer to any project:

1. **Authenticated ≠ authorized.** One user table for customers and admins makes the distinction unavoidable — which is a feature, because it stops you assuming a session means permission.
2. **Guard at the data, not at the edge.** Middleware redirects; the layout and every action enforce. Actions are individually addressable endpoints and need their own check.
3. **Fail closed.** `isOpenAccess()` keys on `!url` so a half-deployed env var locks the admin instead of opening it.
4. **Say as little as possible when refusing.** 404 over 403; one vague login error; a password-reset that always claims success.
5. **Constant-time comparison for anything secret.** `timingSafeEqual`, never `===`.
6. **Verify the signature before you read the contents.** Expiry lives inside the signed payload, so it's only meaningful after the MAC checks out.
7. **Defence in depth means independent layers.** RLS protects nothing the app layer already protects — it protects against the app layer being bypassed.
8. **Make revocation harder than granting, and self-lockout impossible.** Destructive, irreversible directions deserve the stricter gate.
