/**
 * ROLE OF THIS FILE
 * Stage 9 acceptance (§14.2): the designated text boxes render live catalog
 * data (seed values until the owner supplies real content — OQ-3); long
 * names ellipsize without layout shift (the masked pixel-diff still
 * matches); and a new product appears on the storefront without a redeploy.
 */

import { test, expect } from "@playwright/test";
import { adminLogin, ADMIN_VIEWPORT } from "./helpers";

test.describe.configure({ mode: "serial" });

test("shop cards and product page show live catalog values", async ({
  page,
}) => {
  await page.goto("/shop", { waitUntil: "networkidle" });
  // Seeded catalog values inside the designated boxes.
  await expect(page.getByText("Signature Rose").first()).toBeVisible();
  await expect(page.getByText("$49.99").first()).toBeVisible();
  await expect(page.getByText("$89.99").first()).toBeVisible(); // compare-at

  await page.goto("/products/signature-24k-gold-rose", {
    waitUntil: "networkidle",
  });
  await expect(
    page.getByText("ELDREVE Signature 24K Gold Rose").first(),
  ).toBeVisible();
  await expect(page.getByText("BUY NOW · $49.99")).toBeVisible();
});

test("the product page draws catalog values, not the frame's fixed art", async ({
  page,
}) => {
  await page.goto("/products/signature-24k-gold-rose", {
    waitUntil: "networkidle",
  });

  // Badge pill, strapline and discount all come off the catalog row now; the
  // discount is computed from the two prices rather than printed flat.
  await expect(page.getByText("SAVE 44%", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Real rose base · Clear display stand · Gift-ready"),
  ).toBeVisible();
  await expect(page.getByText("44% OFF", { exact: true })).toBeVisible();

  // Both hero layers — the page's photo and the media trigger's own copy that
  // covers it — are the product's image, not a /eldreve design render.
  const heroes = await page.$$eval(".gr-card-zoom .gr-photo", (els) =>
    els.map((el) => el.getAttribute("src")),
  );
  expect(heroes.length).toBeGreaterThan(0);
  for (const src of heroes) expect(src).not.toMatch(/^\/eldreve\//);

  // None of the values the frame invented may reappear: a fixed badge, a
  // fixed discount, or review claims the product_reviews table cannot back.
  for (const invented of [
    "BEST SELLER",
    "15% OFF",
    "286 Reviews",
    "Based on 286 reviews",
    "Sarah M.",
  ]) {
    await expect(
      page.getByText(invented, { exact: false }),
      `frame placeholder "${invented}" is back on the PDP`,
    ).toHaveCount(0);
  }
});

test("long names ellipsize without layout shift (masked diff still gates)", async ({
  page,
}) => {
  await page.setViewportSize(ADMIN_VIEWPORT);
  await adminLogin(page);

  const LONG_TITLE =
    "ELDREVE Signature 24K Gold Rose — Extraordinarily Long Anniversary Edition Title That Cannot Possibly Fit";
  async function setTitle(title: string) {
    await page.goto("/admin/products/signature-gold-rose");
    await page.getByRole("textbox", { name: /^Title\*?$/ }).fill(title);
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("Product saved")).toBeVisible();
  }

  await setTitle(LONG_TITLE);
  try {
    await page.setViewportSize({ width: 430, height: 932 });
    await page.goto("/products/signature-24k-gold-rose", {
      waitUntil: "networkidle",
    });
    // The long title renders (ellipsized) and the page still matches the
    // masked baseline — i.e. zero layout shift outside the designated boxes.
    await expect(
      page.getByText(/ELDREVE Signature 24K Gold Rose — Extra/).first(),
    ).toBeVisible();
    await page.evaluate(async () => {
      await document.fonts.ready;
      const step = window.innerHeight;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("product-detail-masked.png", {
      fullPage: true,
      mask: [page.locator("[data-live-text]")],
    });
  } finally {
    await page.setViewportSize(ADMIN_VIEWPORT);
    await setTitle("ELDREVE Signature 24K Gold Rose");
  }
});

test("a new product appears on the storefront without a redeploy", async ({
  page,
  request,
}) => {
  await page.setViewportSize(ADMIN_VIEWPORT);
  await adminLogin(page);

  const title = `Stage Nine Fresh Rose ${Date.now()}`;
  const handle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  await page.goto("/admin/products/new");
  await page.getByRole("textbox", { name: /^Title\*?$/ }).fill(title);
  await page.getByLabel("Price", { exact: true }).fill("99.00");
  await page.getByLabel("Status", { exact: true }).selectOption("active");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.waitForURL(/\/admin\/products\/(?!new)[a-z0-9-]+$/);

  try {
    // The never-built route renders on demand (dynamicParams, §8) with live
    // JSON-LD — no rebuild happened between save and this request.
    const response = await request.get(`/products/${handle}`);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain('"@type":"Product"');
    expect(html).toContain('"price":"99.00"');
    // And the sitemap lists it.
    expect(await (await request.get("/sitemap.xml")).text()).toContain(
      `/products/${handle}`,
    );
  } finally {
    await page.goto("/admin/products");
    const row = page.getByRole("row").filter({ hasText: title });
    await row.first().getByText(title).last().click();
    await page.waitForURL(/\/admin\/products\/[a-z0-9-]+$/);
    await page.getByRole("button", { name: "Delete product" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Delete", exact: true })
      .click();
    await page.waitForURL(/\/admin\/products$/);
  }
});
