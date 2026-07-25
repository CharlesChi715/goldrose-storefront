/**
 * ROLE OF THIS FILE
 * The pixel regression net, Stage 9 edition (§14.2). Home keeps design text
 * (§8) so it snapshots everything except the [data-blend] mascot art: those
 * four images carry the design's DARKEN fill blend, and GPU-composited
 * blending is not bit-deterministic between runs (±1 on a few thousand
 * pixels), so they are masked to keep the net stable. /shop and the product
 * page render LIVE catalog values inside their designated text boxes, so
 * every [data-live-text] box is masked there. Everything else must stay
 * byte-identical to the Figma baseline: any pixel change outside a masked
 * box still fails here.
 */

import { test, expect, type Page } from "@playwright/test";

async function settlePage(page: Page) {
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
}

test("pixel baseline: home (masked blend-mode art)", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await settlePage(page);
  await expect(page).toHaveScreenshot("home.png", {
    fullPage: true,
    mask: [page.locator("[data-blend]")],
  });
});

for (const { path, name } of [
  { path: "/shop", name: "shop" },
  { path: "/products/signature-24k-gold-rose", name: "product-detail" },
] as const) {
  test(`pixel baseline: ${name} (masked live-text boxes)`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" });
    await settlePage(page);
    await expect(page).toHaveScreenshot(`${name}-masked.png`, {
      fullPage: true,
      mask: [page.locator("[data-live-text]")],
    });
  });
}
