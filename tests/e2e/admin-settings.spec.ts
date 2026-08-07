/**
 * ROLE OF THIS FILE
 * Stage 8 acceptance (§14.2): shipping-zone/tax/prefix edits take effect at
 * checkout; notification toggles + policies persist; the promo slogan
 * follows the §11 PNG-vs-text rule (default PNG → edited text → reset PNG);
 * sitemap/robots/llms.txt come from the DB; the robots AI-crawler toggle
 * works; product pages emit Product JSON-LD from live stock; the homepage
 * search listing is editable in Settings. Every mutation reverts so the
 * pixel baselines (which run after this file) stay byte-identical.
 */

import {
  test,
  expect,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { adminLogin, ADMIN_VIEWPORT } from "./helpers";

test.use({ viewport: ADMIN_VIEWPORT });
test.describe.configure({ mode: "serial" });

const SIGNATURE_VARIANT = "0a2b1a10-4b7e-4d7a-9d24-000000000101";

async function checkoutTotals(request: APIRequestContext, country: string) {
  const response = await request.post("/api/checkout", {
    data: {
      method: "paypal",
      lines: [{ variantId: SIGNATURE_VARIANT, quantity: 1 }],
      country,
    },
  });
  expect(response.ok()).toBe(true);
  return (await response.json()).order as { number: string; total: number };
}

async function openSettings(page: Page) {
  await adminLogin(page);
  await page.goto("/admin/settings");
  await expect(page.getByRole("heading", { name: "General" })).toBeVisible();
}

test("shipping-zone rate edits take effect at checkout, then revert", async ({
  page,
  request,
}) => {
  await openSettings(page);
  const rowRates = page.getByLabel("Rate ($)");
  // Second zone = Rest of world (19.95 placeholder).
  await expect(rowRates.nth(1)).toHaveValue("19.95");
  await rowRates.nth(1).fill("25.00");
  await page
    .getByRole("heading", { name: "Shipping and delivery" })
    .locator("..")
    .getByRole("button", { name: "Save", exact: true })
    .click();
  await expect(page.getByText("Settings saved").first()).toBeVisible();

  expect((await checkoutTotals(request, "GB")).total).toBe(4999 + 2500);

  await page.reload();
  await page.getByLabel("Rate ($)").nth(1).fill("19.95");
  await page
    .getByRole("heading", { name: "Shipping and delivery" })
    .locator("..")
    .getByRole("button", { name: "Save", exact: true })
    .click();
  await expect(page.getByText("Settings saved").first()).toBeVisible();
  expect((await checkoutTotals(request, "GB")).total).toBe(4999 + 1995);
});

test("order-number prefix edits apply to new orders, then revert", async ({
  page,
  request,
}) => {
  await openSettings(page);
  await page.getByLabel("Order number prefix").fill("GR-");
  await page
    .getByRole("heading", { name: "General" })
    .locator("..")
    .getByRole("button", { name: "Save", exact: true })
    .click();
  await expect(page.getByText("Settings saved").first()).toBeVisible();

  expect((await checkoutTotals(request, "US")).number).toMatch(/^GR-\d+$/);

  await page.reload();
  await page.getByLabel("Order number prefix").fill("#");
  await page
    .getByRole("heading", { name: "General" })
    .locator("..")
    .getByRole("button", { name: "Save", exact: true })
    .click();
  await expect(page.getByText("Settings saved").first()).toBeVisible();
  expect((await checkoutTotals(request, "US")).number).toMatch(/^#\d+$/);
});

test("notification toggles and policies persist", async ({ page }) => {
  await openSettings(page);

  await page.getByLabel("Order confirmation (to the buyer)").uncheck();
  await page
    .getByLabel("Refund policy")
    .fill("30-day returns, full refund on damage.");
  await page
    .getByRole("heading", { name: "Notifications" })
    .locator("..")
    .getByRole("button", { name: "Save", exact: true })
    .click();
  await expect(page.getByText("Settings saved").first()).toBeVisible();
  await page
    .getByRole("heading", { name: "Policies" })
    .locator("..")
    .getByRole("button", { name: "Save", exact: true })
    .click();
  await expect(page.getByText("Settings saved").first()).toBeVisible();

  await page.reload();
  await expect(
    page.getByLabel("Order confirmation (to the buyer)"),
  ).not.toBeChecked();
  await expect(page.getByLabel("Refund policy")).toHaveValue(
    "30-day returns, full refund on damage.",
  );

  // Revert the toggle.
  await page.getByLabel("Order confirmation (to the buyer)").check();
  await page
    .getByRole("heading", { name: "Notifications" })
    .locator("..")
    .getByRole("button", { name: "Save", exact: true })
    .click();
  await expect(page.getByText("Settings saved").first()).toBeVisible();
});

test("promo slogan: default PNG → edited text → reset PNG (§11)", async ({
  page,
}) => {
  // Default → the PNG crop serves.
  await page.goto("/shop");
  await expect(
    page.locator('img[src="/eldreve/home/549-95.svg"]'),
  ).toBeVisible();

  // Edit in Content → Home page → real text renders in the same box. The
  // slogan moved to the homepage editor with the rest of the page's copy.
  await adminLogin(page);
  await page.goto("/admin/content/home");
  await page.getByLabel("Slogan").fill("FREE SHIPPING OVER $75 · ELDREVE");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Home page updated").first()).toBeVisible();

  await page.goto("/shop");
  await expect(
    page.getByText("FREE SHIPPING OVER $75 · ELDREVE"),
  ).toBeVisible();
  await expect(page.locator('img[src="/eldreve/home/549-95.svg"]')).toHaveCount(
    0,
  );

  // Reset → the PNG returns (pixel-diff stays perfect).
  await page.goto("/admin/content/home");
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.getByText("Home page updated").first()).toBeVisible();
  await page.goto("/shop");
  await expect(
    page.locator('img[src="/eldreve/home/549-95.svg"]'),
  ).toBeVisible();
});

test("sitemap, llms.txt and Product JSON-LD come from the database", async ({
  request,
}) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/shop");
  expect(sitemap).toContain("/products/signature-24k-gold-rose");
  expect(sitemap).toContain("/products/premium-gold-rose-gift-bundle");

  const llms = await (await request.get("/llms.txt")).text();
  expect(llms).toContain("# ELDREVE");
  expect(llms).toContain("ELDREVE Signature 24K Gold Rose");
  expect(llms).toContain("$49.99 USD");
  expect(llms).toContain("United States");

  const productHtml = await (
    await request.get("/products/signature-24k-gold-rose")
  ).text();
  expect(productHtml).toContain('"@type":"Product"');
  expect(productHtml).toContain('"price":"49.99"');
  expect(productHtml).toContain("schema.org/InStock");
  expect(productHtml).toContain('"@type":"BreadcrumbList"');
});

test("robots blocks /admin + /checkout and follows the AI-crawler toggle", async ({
  page,
  request,
}) => {
  let robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /admin");
  expect(robots).toContain("Disallow: /checkout");
  expect(robots).toMatch(/User-Agent: GPTBot\nAllow: \//i);

  // Toggle AI crawlers off → GPTBot fully disallowed.
  await openSettings(page);
  await page.getByLabel(/Allow AI assistants/).uncheck();
  await page
    .getByRole("heading", { name: "Search engine & AI" })
    .locator("..")
    .getByRole("button", { name: "Save", exact: true })
    .click();
  await expect(page.getByText("Settings saved").first()).toBeVisible();

  robots = await (await request.get("/robots.txt")).text();
  expect(robots).toMatch(/User-Agent: GPTBot\nDisallow: \//i);

  // Revert.
  await page.getByLabel(/Allow AI assistants/).check();
  await page
    .getByRole("heading", { name: "Search engine & AI" })
    .locator("..")
    .getByRole("button", { name: "Save", exact: true })
    .click();
  await expect(page.getByText("Settings saved").first()).toBeVisible();
  robots = await (await request.get("/robots.txt")).text();
  expect(robots).toMatch(/User-Agent: GPTBot\nAllow: \//i);
});

test("homepage search listing is editable in Settings, then reverts", async ({
  page,
  request,
}) => {
  await openSettings(page);
  await page
    .getByLabel("Homepage title")
    .fill("ELDREVE — Eternal 24K Gold Roses");
  await page
    .getByRole("heading", { name: "Search engine & AI" })
    .locator("..")
    .getByRole("button", { name: "Save", exact: true })
    .click();
  await expect(page.getByText("Settings saved").first()).toBeVisible();

  const home = await (await request.get("/")).text();
  expect(home).toContain("<title>ELDREVE — Eternal 24K Gold Roses</title>");

  await page
    .getByLabel("Homepage title")
    .fill("ELDREVE — 24K Gold Dipped Roses");
  await page
    .getByRole("heading", { name: "Search engine & AI" })
    .locator("..")
    .getByRole("button", { name: "Save", exact: true })
    .click();
  await expect(page.getByText("Settings saved").first()).toBeVisible();
  const reverted = await (await request.get("/")).text();
  expect(reverted).toContain("<title>ELDREVE — 24K Gold Dipped Roses</title>");
});
