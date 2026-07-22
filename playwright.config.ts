/**
 * ROLE OF THIS FILE
 * Playwright config for the e2e regression net (design-doc §14.2 Stage 0).
 * Tests run against a PRODUCTION build (`next build && next start`) so pixel
 * snapshots never contain dev-mode overlays, and with the Shopify permalink
 * env forcibly blanked so checkout always runs in local mock mode — the
 * suite must stay green with no external service and no money moving.
 */

import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  // One shared screenshot dir: the Stage 9 spec gates against the SAME
  // masked baselines as pixels.spec.ts.
  snapshotPathTemplate: "{testDir}/__screenshots__/{arg}-{platform}{ext}",
  // The mock-checkout test writes to .data/orders.json; keep runs serial so
  // suites never race on shared server state.
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  retries: 0,
  expect: {
    timeout: 15_000,
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
    },
  },
  use: {
    baseURL: "http://localhost:3001",
    // The VELORIA design frames are authored at 430px wide (mobile). A fixed
    // viewport + scale factor keeps snapshots byte-stable across runs.
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 1,
    trace: "retain-on-failure",
  },
  webServer: {
    // Port 3001: the suite must never collide with (or reuse) the owner's
    // `npm run dev` on 3000 — dev-mode compiles blow the test timeouts.
    command: "npm run build && npx next start -p 3001",
    url: "http://localhost:3001",
    // Reuse a manually started `next start` during development; CI always
    // builds fresh.
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      // Real process env beats .env.local, so blanking these guarantees the
      // suite runs mock checkout even on a machine with PayPal keys.
      PAYPAL_CLIENT_ID: "",
      PAYPAL_SECRET: "",
      NEXT_PUBLIC_PAYPAL_CLIENT_ID: "",
      // Likewise: never let the suite touch a hosted Supabase project (the
      // owner's .env.local carries real keys post-activation) — tests always
      // run against the local file adapter.
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
      SUPABASE_SERVICE_ROLE_KEY: "",
      ADMIN_OPEN_ACCESS: "",
      // Known password for the local-adapter admin login tests.
      ADMIN_DEV_PASSWORD: "stage2-test-password",
    },
  },
});
