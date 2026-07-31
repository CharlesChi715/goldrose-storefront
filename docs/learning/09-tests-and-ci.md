# Feature Learning 09 — The Safety Net: Tests, Determinism, and CI

Traced end to end per [README.md](README.md).
The other docs trace features a customer or an operator uses. This one traces the machinery that stops those features breaking silently — from `npm run test:unit` on this Mac to the green tick on a pull request. It is the least glamorous system in the repo and the one that most defines whether the others stay correct.

## Feature Summary

**What it does**
Three layers, each answering a different question:

| Layer            | Question                            | Command                             | Where it runs  |
| ---------------- | ----------------------------------- | ----------------------------------- | -------------- |
| Typecheck + lint | does it hold together?              | `npm run typecheck`, `npm run lint` | CI + local     |
| Unit tests       | is this rule correct in isolation?  | `npm run test:unit`                 | CI + local     |
| End-to-end       | does the whole thing actually work? | `npm run test:e2e`                  | **local only** |

**Why it exists**
Because "it worked when I tried it" doesn't survive the fiftieth change. Two design commitments shape all of it:

1. **The suite must be hermetic.** No network, no Docker, no external service, no money moving, no touching the owner's live Supabase. A test that needs the internet is a test that fails on a plane and gets ignored.
2. **Determinism is engineered, not hoped for.** Pixel-perfect screenshot comparison only works if a hundred sources of variation are pinned down first. Most of this doc is those hundred things.

Key jargon:
- **Unit test** = one function, no I/O. **End-to-end (e2e)** = drive the real app in a real browser.
- **CI (continuous integration)** = a server that runs the checks on every push, so the answer doesn't depend on anyone remembering.
- **Fixture** = fixed, known input data a test runs against.
- **Flake** = a test that passes and fails on the same code. Worse than no test, because it teaches you to ignore red.

## Code Trace

```text
 DEVELOPER MACHINE                                      GITHUB (every push / PR)
 ─────────────────                                      ────────────────────────
 npm run typecheck   tsc --noEmit  ──────────────────▶  .github/workflows/ci.yml
 npm run lint        eslint                               ubuntu-latest, Node 24
 npm run test:unit   node --test tests/unit/*.ts            ├─ npm ci
        │                                                   ├─ npm run lint
        │  9 files, node:test, zero deps                    ├─ npm run typecheck
        │  temp-dir chdir for DB isolation                  └─ npm run test:unit
        │
 npm run test:e2e    playwright                         ✗ e2e NOT run in CI
        │                                                 (baselines are -darwin)
        ├─ webServer: next build && next start -p 3001
        │    env: PAYPAL_* = ""     → mock checkout, no money
        │         SUPABASE_* = ""   → local .data/db.json, never the live DB
        │         ADMIN_DEV_PASSWORD = "stage2-test-password"
        │
        ├─ workers: 1, retries: 0     ← serial, no flake tolerance
        │
        └─ 17 specs → assert on the DOM *and* by reading .data/db.json directly
             pixels.spec.ts → byte-compare against __screenshots__/*-darwin.png
```

### Step 1 — The unit layer: no framework at all

```json
// package.json:17
    "test:unit": "node --test tests/unit/*.test.ts",
```

No Jest. No Vitest. No config file, no transpile step, no watch server. Node runs the TypeScript directly — modern Node strips the types and executes the JavaScript underneath. Every test file needs only:

```ts
// tests/unit/seed-uuid.test.ts:11-12
import { test } from "node:test";
import assert from "node:assert/strict";
```

This is worth pausing on, because the industry default is to reach for a framework. What a framework buys you here is mocking, snapshots, and a watch mode; what it costs is a config file, a transpiler, a dependency tree that needs patching, and a version that eventually fights your Node version. For nine files of pure-function tests, the standard library wins. **Add the dependency when the pain is real, not in anticipation of it.**

The cost is visible in CI, and documented there:

```yaml
# .github/workflows/ci.yml:29-34
      # Node 24: `npm run test:unit` runs `node --test` directly over .ts
      # files, which needs the unflagged type stripping added in Node 23.6.
      - uses: actions/setup-node@v5
        with:
          node-version: "24"
          cache: "npm"
```

That is the right way to record a constraint: at the line that depends on it, not in a wiki nobody opens.

### Step 2 — Isolating tests from the real database

Several unit tests exercise real database logic. They must not touch the repo's actual `.data/db.json`. The trick ([paypal-webhook.test.ts:16-21](../../tests/unit/paypal-webhook.test.ts#L16-L21)):

```ts
// tests/unit/paypal-webhook.test.ts:16-21
// The local file store roots itself at process.cwd() — isolate it FIRST,
// before any store import can cache a path.
process.chdir(mkdtempSync(path.join(tmpdir(), "goldrose-webhook-test-")));

const { handlePayPalEvent } = await import("../../lib/paypal/webhook.ts");
const { getStore } = await import("../../lib/supabase/store.ts");
```

The local adapter computes its file path from `process.cwd()` **when the module is first loaded**. A normal `import` at the top of the file would run before any test code and bind the real path. So: move to a fresh temp directory first, then load the modules dynamically. The store auto-seeds, and every test gets a pristine database that is deleted with the temp dir.

This is a general lesson about module-level side effects. **Anything a module computes at import time is effectively frozen before your code runs.** Dynamic `import()` is the escape hatch, and the comment explaining why is what stops someone "tidying" it back into a static import.

Two tests worth knowing individually:

- [seed-uuid.test.ts](../../tests/unit/seed-uuid.test.ts) is a regression test for a real incident: demo fixture ids contained non-hex characters that the JSON file adapter happily accepted and Postgres rejected mid-seed. It now regex-checks every id and foreign key in the seed data. This is the **fidelity gap between the two backends** made visible — the file adapter is more permissive than Postgres, so anywhere that matters gets an explicit test. (Same asymmetry as the CHECK constraint in [05](05-verifying-the-hosted-database.md).)

  ```ts
  // tests/unit/seed-uuid.test.ts:15-41
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  // …
  const UUID_FK_FIELDS = ["customer_id", "order_id", "thread_id", "variant_id"] as const;

  test("every demo row id and uuid foreign key is a well-formed uuid", () => {
    const tables = buildSeedTables(new Date().toISOString(), { includeDemo: true });
    for (const table of DEMO_TABLES) {
      for (const row of tables[table] as Array<Record<string, unknown>>) {
        assert.match(
          String(row.id),
          UUID,
          `${table} id "${row.id}" is not a valid uuid — Postgres would reject the seed`,
        );
        // …
  ```

- `element-names.test.ts` (since retired, in git history) was a *convention linter written as a test*. It parsed the allowed vocabulary out of a convention doc and checked every `data-el` attribute in the codebase against it. The doc isn't copied into the test — it's *parsed* — so the two cannot drift:

  ```ts
  // tests/unit/element-names.test.ts:33-41
    return [...body.matchAll(/`([A-Z][A-Z0-9-]*)`/g)].map((m) => m[1]);
  }

  const md = readFileSync(DOC, "utf8");
  const VOCAB = {
    PAGE: vocabulary(md, "PAGE"),
    SECTION: vocabulary(md, "SECTION"),
    TYPE: vocabulary(md, "TYPE"),
  };
  ```

  It also guards itself:

```ts
// tests/unit/element-names.test.ts:102-105
test("the scan actually found element names", () => {
  // Guards against a broken walk silently passing every assertion below.
  assert.ok(NAMES.length > 30, `only found ${NAMES.length} data-el names`);
});
```

That is a sharp idea. A test that scans a codebase passes trivially if the scan finds nothing. **Any test that validates "all of X" needs a companion assertion that X isn't empty.**

### Step 3 — The e2e layer, and the seven things that make it deterministic

[playwright.config.ts](../../playwright.config.ts) is where the hermetic guarantee is enforced. The environment block is the heart of it:

```ts
// playwright.config.ts:51-68
    env: {
      // Real process env beats .env.local, so blanking these guarantees the
      // suite runs mock checkout even on a machine with PayPal keys.
      PAYPAL_CLIENT_ID: "",
      PAYPAL_SECRET: "",
      NEXT_PUBLIC_PAYPAL_CLIENT_ID: "",
      // Same for the testing-phase skip-payment flag (.env.local): blank it so
      // the suite always exercises the real express/card checkout UI.
      CHECKOUT_SKIP_PAYMENT: "",
      // Likewise: never let the suite touch a hosted Supabase project (the
      // owner's .env.local carries real keys post-activation) — tests always
      // run against the local file adapter.
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
      SUPABASE_SERVICE_ROLE_KEY: "",
      // Known password for the local-adapter admin login tests.
      ADMIN_DEV_PASSWORD: "stage2-test-password",
    },
```

Read that as a threat model. The owner's `.env.local` holds **real production keys**. Without those blank lines, running the test suite would mutate the live store and could move real money. The suite doesn't ask the machine to be configured safely — it *forces* safety by blanking, because blanking is the state you can guarantee.

Note also `CHECKOUT_SKIP_PAYMENT: ""`. Blanking it turns the real card/express UI back **on**, so the tests exercise the actual checkout rather than the shortcut. And `ADMIN_DEV_PASSWORD` is *set*, which turns the admin login gate back on — otherwise the "logged-out visitor is redirected" test would be asserting nothing ([07](07-who-can-see-what.md) Step 5).

The rest of the determinism stack, each pinning one source of variation:

1. **Production build, not dev** — `npm run build && npx next start -p 3001`. Dev mode injects overlays and compiles on demand; both wreck screenshots and timeouts.
2. **Port 3001** so the suite never collides with the owner's `npm run dev` on 3000.
3. **`workers: 1`, `fullyParallel: false`** — tests write to a shared JSON database; parallel workers would race. The price is that spec files run in alphabetical order and that order is load-bearing.
4. **`retries: 0`** — flake is never masked. A red is a red. Retries are how a flaky suite becomes a suite nobody believes.
5. **Fixed viewport** 430×932 at scale factor 1 — the Figma mobile frame.
6. **`reducedMotion: "reduce"`** — the hero carousel advances on a JS timer that `animations: "disabled"` cannot stop.
7. **A settle ritual before every screenshot** ([pixels.spec.ts:16-27](../../tests/e2e/pixels.spec.ts#L16-L27)): `await document.fonts.ready`, then a scripted scroll down the whole page to force lazy images to load, then back to the top, then `networkidle`.

### Step 4 — Visual regression, and the masks

Three committed baseline PNGs in [tests/e2e/__screenshots__](../../tests/e2e/__screenshots__). Playwright compares pixel by pixel with **zero differing pixels allowed** — no `maxDiffPixels` override anywhere.

That is only survivable because two categories of pixel are explicitly excluded, and both are marked in the *product markup*:

- `[data-blend]` — mascot art using a DARKEN blend mode. GPU compositing is not bit-deterministic; the same page renders ±1 on a few thousand pixels between runs.
- `[data-live-text]` — boxes showing real catalog values, which change when the database does.

```ts
// tests/e2e/pixels.spec.ts:32-35
  await expect(page).toHaveScreenshot("home.png", {
    fullPage: true,
    mask: [page.locator("[data-blend]")],
  });
```

The `/shop` and product-detail baselines mask the other attribute instead ([pixels.spec.ts:45-48](../../tests/e2e/pixels.spec.ts#L45-L48)):

```ts
// tests/e2e/pixels.spec.ts:45-48
    await expect(page).toHaveScreenshot(`${name}-masked.png`, {
      fullPage: true,
      mask: [page.locator("[data-live-text]")],
    });
```

Two attributes in shipped HTML exist purely as test infrastructure. That's a legitimate trade — it's what lets a byte-strict pixel net coexist with a live database — but it is worth naming: **the masked regions have zero visual coverage.** Anything inside them can regress invisibly. A mask is a documented blind spot, not a fix.

And the naming: `home-darwin.png`. The `-darwin` suffix is macOS. Font rendering differs between operating systems, so a Linux runner would fail every pixel test. Which brings us to the honest bit of the CI config.

### Step 5 — CI, and what it deliberately leaves out

[.github/workflows/ci.yml](../../.github/workflows/ci.yml) runs four steps on every push to `main` and every pull request: `npm ci`, lint, typecheck, unit tests. Under a minute, no secrets, no services.

The header is the most valuable part of the file:

```yaml
# .github/workflows/ci.yml:5-10
# Deliberately NOT here yet, both for reasons that would make CI red on day one:
#   * `npm run build` — needs a seeded .data/db.json (that directory is
#     gitignored), so it wants a `npm run seed -- --reset` step first.
#   * `npm run test:e2e` — the pixel baselines in tests/e2e/__screenshots__ are
#     named `-darwin.png`; on a Linux runner every pixel spec fails. Adding e2e
#     means a macos-latest runner.
```

This is how to write down a gap. Not "TODO: add e2e" — the *reason*, the *symptom*, and the *fix*. Anyone can pick it up without re-deriving the problem.

The judgement behind it is also right, and worth stating as a principle:

> **A CI check that is red for reasons unrelated to the change is worse than no check.**
> People learn to ignore it within a week, and then they ignore the real failures too. Start with checks that are green on day one and stay green; add the harder ones with the work needed to make them reliable.

The concurrency block is a small thing that saves real money:

```yaml
# .github/workflows/ci.yml:19-21
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
```

Push twice in a minute and the first run is cancelled — it was testing code nobody will merge.

Two more decisions with their reasons attached: `cache: "npm"` keyed on the lockfile so installs are fast, and `npm ci` (not `npm install`) so the lockfile is honoured exactly — a build that quietly resolves a different dependency version than your machine is a category of bug that costs entire days.

What CI does **not** run: `npm run build`, `npm run format:check` (Prettier is a local convenience, never enforced), and the entire e2e suite. So the pixel net, the checkout flow, and the admin auth flow are all guarded only by whoever remembers to run them locally. That is the single biggest weakness of the current setup, and it is precisely documented.

### Step 6 — What the e2e specs actually assert

The strongest pattern in the suite: assert on the **UI and the database**, in the same test. From [checkout.spec.ts](../../tests/e2e/checkout.spec.ts) — the test reads the app's database file directly, because with the file adapter, server and test are on one machine:

```ts
// tests/e2e/checkout.spec.ts:16
const DB_FILE = path.join(process.cwd(), ".data", "db.json");
```

One test clicks all the way through checkout and then asserts: the order's `source`, `financial_status`, gift note, email, `subtotal_cents 4999 / shipping 595 / total 5594`, an `inventory_movements` row with `delta: -1` and `reason: "order"`, an auto-created customer row, and the `checkouts` row flipped to `completed`. A UI-only test would have confirmed a "Thank you" page appeared while stock silently failed to move.

This is safe only because the local adapter writes atomically — temp file plus rename ([local.ts:106-109](../../lib/supabase/local.ts#L106-L109)) — so a test reading mid-write never sees a truncated file. Determinism again, one layer down.

Three more idioms worth copying:

- **Self-cleaning tests.** The database persists across the whole run, so any spec that mutates state restores it in a `finally` — the price-edit test puts `49.99` back and *re-asserts* the original total. Without this, later specs (especially pixel ones) fail for reasons that have nothing to do with them.
- **Unique fixtures per run**: `` const TEST_TITLE = `E2E Test Product ${Date.now()}` `` — so a rerun against a dirty database doesn't collide with its own leftovers.
- **Negative assertions as documentation.** [screens.spec.ts:32-39](../../tests/e2e/screens.spec.ts#L32-L39) asserts the wholesale submit control does **not** exist as a `<button>`. It encodes "this has no backend yet" as an executable fact, so the day someone wires it up, the test fails and forces a conscious decision.

And the division of labour is written down where you'd look for it. Each unit test that exists *because* e2e can't reach something says so:

- [abandoned.test.ts](../../tests/unit/abandoned.test.ts) — "The e2e suite can't age a checkout, so the rule is verified here in an isolated temp store."
- [team-owner.test.ts](../../tests/unit/team-owner.test.ts) — "The e2e suite runs single-admin local mode and can't build a multi-member team."

**When you choose a test layer, write down why the other layer couldn't do it.** It's the note that stops the next person duplicating the coverage or deleting it as redundant.

### Step 7 — The one check that isn't a test

[scripts/validate-env.mjs](../../scripts/validate-env.mjs) runs before every `next build`:

```js
// scripts/validate-env.mjs:65-74
if (skipPayment && paypalLive) {
  console.error(
    "[env] CHECKOUT_SKIP_PAYMENT is set while PAYPAL_ENV=live — checkout would",
  );
  console.error(
    "[env] hand out orders for free on a storefront taking real money.",
  );
  console.error("[env] Remove CHECKOUT_SKIP_PAYMENT before going live.");
  process.exit(1);
}
```

Not a test — a **build-time gate**. The distinction matters: a test tells you something is wrong; a gate makes the wrong thing impossible to ship. For a configuration mistake whose blast radius is "free products on a live store", the gate is the correct instrument. Ask of any dangerous misconfiguration: can this be made unrepresentable, or at least unbuildable, rather than merely tested for?

### Step 8 — The honest gap list

Written plainly, because a safety net you overestimate is worse than one you understand:

- **CI runs no e2e, no build, no format check.** The reasons are documented; the exposure is real. The gap is visible in the job itself — these are *all* the steps that run:

  ```yaml
  # .github/workflows/ci.yml:38-48
        - name: Install dependencies
          run: npm ci

        - name: Lint
          run: npm run lint

        - name: Typecheck
          run: npm run typecheck

        - name: Unit tests
          run: npm run test:unit
  ```

- **One browser, one platform.** Chromium only, macOS baselines. No Firefox, no Safari, no real devices.
- **No accessibility checks** (no axe pass) and **no coverage measurement**.
- **Nothing between unit and full-stack** — no component tests, no route-handler tests outside e2e.
- **Hosted-Supabase paths are hand-tested only**: customer email-code sign-in, team sign-up, multi-member teams. All three are documented as such in the files that would otherwise be expected to cover them — the spec's own header says which part it cannot reach:

  ```ts
  // tests/e2e/account.spec.ts:7-8
   * the admin login shows no passkey button. The real emailed-code flow only
   * exists against hosted Supabase and is exercised by hand there.
  ```

- **Real PayPal is never contacted** — all fixtures. Signature verification is only smoke-covered.
- **Pricing has no unit tests at all** ([08](08-price-math-and-trust.md) Step 7) — `priceCart`, `applyDiscountCode` and `computeShipping` are pure functions with almost no I/O, and are the cheapest high-value tests available right now.

## Recap

```text
fast layer     tsc + eslint + node:test          ← in CI, under a minute
slow layer     playwright, prod build, 1 worker  ← local only, macOS baselines
gate           validate-env.mjs before build     ← makes a mistake unshippable

determinism =  blank the dangerous env vars   (never trust the machine)
             + production build                (no dev overlays)
             + serial, zero retries            (no masked flake)
             + fixed viewport, reduced motion  (no rendering drift)
             + fonts.ready + scroll + idle     (no timing drift)
             + masks for GPU art & live text   (documented blind spots)
             + self-cleaning specs             (no order dependence by accident)
```

Seven ideas that transfer:

1. **Hermetic beats thorough.** A suite that needs no network, no service and no credentials is a suite people actually run.
2. **Force safety, don't assume it.** Blanking the env vars is the difference between "tests shouldn't touch production" and "tests can't."
3. **Zero retries.** Tolerating flake trains everyone to ignore red.
4. **Assert the side effects, not just the screen.** The DOM said "Thank you"; only the database knows whether stock moved.
5. **Write down why a check is missing.** The CI header names the symptom and the fix, so the gap is a task rather than a mystery.
6. **A green-on-day-one CI beats an ambitious red one.** Credibility is the whole value of the signal.
7. **Prefer a gate to a test for unshippable mistakes.** `process.exit(1)` at build time is stronger than any assertion.
