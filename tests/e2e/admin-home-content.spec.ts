/**
 * ROLE OF THIS FILE
 * Acceptance for Content → Home page (§9.8): the owner can edit any section's
 * copy and see it on `/`, reset it back to the design, and switch a whole
 * section off — which must close the gap rather than leave a hole, because the
 * homepage is one fixed-height absolutely-positioned stage.
 *
 * Every mutation is reverted before the test ends. This file runs before
 * pixels.spec.ts, whose home baseline is byte-identical ONLY while no override
 * is stored — a leaked edit here fails that suite instead of this one.
 */

import { test, expect, type Page } from "@playwright/test";
import { adminLogin, ADMIN_VIEWPORT } from "./helpers";

test.use({ viewport: ADMIN_VIEWPORT });
test.describe.configure({ mode: "serial" });

/**
 * The homepage stage's height in DESIGN pixels, read from the live DOM.
 * ScaleFrame scales the stage to the viewport, so boundingBox() would return
 * the scaled box; the computed height is the pre-transform layout height, which
 * is the number lib/home-content/layout.ts actually decides.
 */
async function stageHeight(page: Page): Promise<number> {
  await page.goto("/", { waitUntil: "networkidle" });
  return page
    .locator(".figv-stage")
    .evaluate((el) => parseFloat(getComputedStyle(el).height));
}

async function openEditor(page: Page) {
  await adminLogin(page);
  await page.goto("/admin/content/home");
  await expect(page.getByRole("heading", { name: "Home page" })).toBeVisible();
}

test("every homepage section is listed, in page order", async ({ page }) => {
  await openEditor(page);
  for (const title of [
    "Promo bar",
    "Hero",
    "Featured Rose Gifts",
    // The Real Rose Promise half of this band was deleted by the design team
    // on 2026-08-07, taking its five editable fields with it.
    "Ready to Ship",
    "Shop by Occasion",
    "Shop by Recipient & Reviews",
    "Craft, Workshop & Patents",
    "Story, FAQ, Gift card, Newsletter & Footer",
  ]) {
    // Level 2 is the section heading; a field group inside it can carry the
    // same words (A-3's sole remaining group is also "Ready to Ship").
    await expect(
      page.getByRole("heading", { name: title, exact: true, level: 2 }),
    ).toBeVisible();
  }
  // Figma-baked labels are listed but not typeable, so the screen is a
  // complete inventory rather than a partial one with silent gaps.
  await expect(page.getByLabel("“View all” label").first()).toBeDisabled();
});

test("editing a section heading reaches the live home page, and resets", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("Featured Rose Gifts")).toBeVisible();

  await openEditor(page);
  await page.getByLabel("Section title").first().fill("Our Favourite Gifts");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Home page updated").first()).toBeVisible();

  await page.goto("/");
  await expect(page.getByText("Our Favourite Gifts")).toBeVisible();
  await expect(page.getByText("Featured Rose Gifts")).toHaveCount(0);

  // Reset restores the design wording and removes the override row.
  await page.goto("/admin/content/home");
  await page.getByLabel("Section title").first().scrollIntoViewIfNeeded();
  await page
    .getByRole("button", { name: "Reset", exact: true })
    .first()
    .click();
  await expect(page.getByText("Home page updated").first()).toBeVisible();

  await page.goto("/");
  await expect(page.getByText("Featured Rose Gifts")).toBeVisible();
});

test("an unsafe link is refused before it can reach an anchor", async ({
  page,
}) => {
  await openEditor(page);
  const link = page.getByLabel("Button link").first();
  await link.fill("javascript:alert(1)");
  // The inline error blocks Save, so the value can never be persisted.
  await expect(page.getByText(/Links must start with/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Discard" }).click();
  await expect(link).toHaveValue("/shop");
});

test("hiding a section removes its band and shortens the page", async ({
  page,
}) => {
  const fullHeight = await stageHeight(page);
  // The imported stage is 5193; A-3's Real Rose Promise strip was deleted on
  // 2026-08-07 and its 136px comes off permanently (band.trim), so nothing
  // hidden still renders 5057.
  expect(fullHeight).toBe(5193 - 136);

  await openEditor(page);
  // "Craft, Workshop & Patents" is the A-9 band: 991px tall.
  const craft = page.locator('[data-home-section="craft"]');
  await craft.getByRole("button", { name: "Hide section" }).click();
  await expect(page.getByText("Home page updated").first()).toBeVisible();

  await page.goto("/");
  await expect(page.getByText("Inside the ELDREVE Workshop")).toHaveCount(0);
  // The band is gone AND the gap is closed: the stage is exactly 991 shorter,
  // and the band below it has moved up to fill the space.
  expect(await stageHeight(page)).toBe(fullHeight - 991);
  await expect(page.getByText("Frequently Asked Questions")).toBeVisible();

  // Restore.
  await page.goto("/admin/content/home");
  await page
    .locator('[data-home-section="craft"]')
    .getByRole("button", { name: "Show section" })
    .click();
  await expect(page.getByText("Home page updated").first()).toBeVisible();

  expect(await stageHeight(page)).toBe(fullHeight);
  await expect(page.getByText("Inside the ELDREVE Workshop")).toBeVisible();
});
