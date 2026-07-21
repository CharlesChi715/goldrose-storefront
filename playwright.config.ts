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
    baseURL: "http://localhost:3000",
    // The VELORIA design frames are authored at 430px wide (mobile). A fixed
    // viewport + scale factor keeps snapshots byte-stable across runs.
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 1,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run build && npm run start",
    url: "http://localhost:3000",
    // Reuse a manually started `next start` during development; CI always
    // builds fresh.
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      // Real process env beats .env.local in Next, so blanking these here
      // guarantees mock checkout even on a machine configured for live.
      NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN: "",
      SHOPIFY_MODE: "",
      // Known password for the local-adapter admin login tests.
      ADMIN_DEV_PASSWORD: "stage2-test-password",
    },
  },
});
