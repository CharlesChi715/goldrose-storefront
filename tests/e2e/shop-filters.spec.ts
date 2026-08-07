/**
 * ROLE OF THIS FILE
 * The /shop filter drawer, end to end (2026-08-07). The unit tests already
 * pin the matching rules; what only a browser can prove is that the drawer,
 * the URL, the grid, the "N GIFTS" count and the chip row all describe the
 * SAME shop — the failure this feature is most exposed to is three of them
 * agreeing while the fourth quietly counts the unfiltered catalog.
 *
 * The three seed products carry (see lib/supabase/seed-data.ts):
 *   Signature Rose  classic  anniversary birthday  wife girlfriend
 *   Boxed Keepsake  jewel    valentines  wedding   mother girlfriend
 *   Premium Bundle  sparkle  anniversary wedding   wife friends
 */

import { test, expect, type Page } from "@playwright/test";

const openDrawer = async (page: Page) => {
  await page.getByRole("button", { name: "Filters" }).click();
  await expect(page.getByRole("dialog", { name: "Filters" })).toBeVisible();
};

const chip = (page: Page, label: string) =>
  page
    .getByRole("dialog", { name: "Filters" })
    .getByRole("button", { name: new RegExp(`^${label}`) });

const cards = (page: Page) => page.locator('a[href^="/products/"]');

test("the drawer starts empty and the shop starts whole", async ({ page }) => {
  await page.goto("/shop");
  await expect(page.getByText(/^3 GIFTS$/)).toBeVisible();
  // The frames draw two active-filter chips and five lit drawer chips; both
  // were a picture of a filtered shop, and an unfiltered one shows neither.
  await expect(
    page.getByRole("button", { name: /^Remove filter/ }),
  ).toHaveCount(0);
  await openDrawer(page);
  await expect(
    page
      .getByRole("dialog", { name: "Filters" })
      .locator("[aria-pressed=true]"),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /^Show 3 Results$/ }),
  ).toBeVisible();
});

test("picking a facet filters the grid, the count and the URL together", async ({
  page,
}) => {
  await page.goto("/shop");
  await openDrawer(page);
  await chip(page, "Jewel Collection").click();
  await expect(
    page.getByRole("button", { name: /^Show 1 Result$/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^Show 1 Result$/ }).click();

  await expect(page).toHaveURL(/\/shop\?f=jewel$/);
  await expect(cards(page)).toHaveCount(1);
  await expect(cards(page).first()).toHaveAttribute(
    "href",
    "/products/boxed-keepsake-gold-rose",
  );
  await expect(page.getByText(/^1 GIFT$/)).toBeVisible();
});

test("two chips in one group widen; two groups narrow", async ({ page }) => {
  // OR inside Collections — jewel or classic is two of the three products.
  await page.goto("/shop?f=jewel,classic");
  await expect(cards(page)).toHaveCount(2);
  await expect(page.getByText(/^2 GIFTS$/)).toBeVisible();

  // AND across headings — the jewel product's recipients are mother and
  // girlfriend, so adding Wife empties it rather than adding to it.
  await page.goto("/shop?f=jewel,wife");
  await expect(cards(page)).toHaveCount(0);
  await expect(page.getByText("No gifts match these filters")).toBeVisible();
});

test("the count in the button is the pending selection, before the tap", async ({
  page,
}) => {
  await page.goto("/shop?f=jewel,classic");
  await openDrawer(page);
  // Both applied chips come back lit.
  await expect(chip(page, "Jewel Collection")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(chip(page, "Classic Collection")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  // Adding a second group narrows the PENDING count while the grid still
  // shows two — the whole point of counting against the pre-facet catalog.
  await chip(page, "Wife").click();
  await expect(
    page.getByRole("button", { name: /^Show 1 Result$/ }),
  ).toBeVisible();
  await expect(cards(page)).toHaveCount(2);
});

test("a lit chip goes out again, and Reset clears the drawer", async ({
  page,
}) => {
  await page.goto("/shop?f=jewel");
  await openDrawer(page);
  await chip(page, "Jewel Collection").click();
  await expect(chip(page, "Jewel Collection")).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(
    page.getByRole("button", { name: /^Show 3 Results$/ }),
  ).toBeVisible();

  await chip(page, "Wedding").click();
  await page.getByRole("button", { name: /^Reset$/ }).click();
  await expect(
    page
      .getByRole("dialog", { name: "Filters" })
      .locator("[aria-pressed=true]"),
  ).toHaveCount(0);
  // Reset is pending-only: the shop is still filtered until Show is tapped.
  await expect(page).toHaveURL(/\/shop\?f=jewel$/);
});

test("abandoning the drawer does not leave a phantom selection", async ({
  page,
}) => {
  await page.goto("/shop?f=jewel");
  await openDrawer(page);
  await chip(page, "Wedding").click();
  // Tap the backdrop instead of Show.
  await page.getByRole("button", { name: "Close" }).click();
  await openDrawer(page);
  await expect(chip(page, "Wedding")).toHaveAttribute("aria-pressed", "false");
  await expect(chip(page, "Jewel Collection")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("an active chip's × drops only that facet", async ({ page }) => {
  await page.goto("/shop?f=jewel,girlfriend");
  await expect(cards(page)).toHaveCount(1);
  await page
    .getByRole("button", { name: "Remove filter Jewel Collection" })
    .click();
  await expect(page).toHaveURL(/\/shop\?f=girlfriend$/);
  await expect(cards(page)).toHaveCount(2);
  await expect(
    page.getByRole("button", { name: "Remove filter Girlfriend" }),
  ).toBeVisible();
});

test("derived facets read the catalog, not the product's own tags", async ({
  page,
}) => {
  // Every seed product is under $100 and on the shelf.
  await page.goto("/shop?f=under-100");
  await expect(cards(page)).toHaveCount(3);
  await page.goto("/shop?f=300-plus");
  await expect(cards(page)).toHaveCount(0);
  await page.goto("/shop?f=ready-to-ship");
  await expect(cards(page)).toHaveCount(3);
  await page.goto("/shop?f=pre-order");
  await expect(cards(page)).toHaveCount(0);
});

test("filters ride along with search, and junk in the URL is ignored", async ({
  page,
}) => {
  await page.goto("/shop?q=keepsake&f=jewel");
  await expect(cards(page)).toHaveCount(1);
  await openDrawer(page);
  await chip(page, "Sparkle Collection").click();
  await page.getByRole("button", { name: /^Show \d+ Results?$/ }).click();
  // The ?q= survives the filter change; page is dropped on purpose.
  await expect(page).toHaveURL(/q=keepsake/);
  await expect(page).toHaveURL(/f=jewel%2Csparkle|f=jewel,sparkle/);

  // A stale bookmark from a retired chip shows a wider shop, never an error.
  await page.goto("/shop?f=not-a-real-slug");
  await expect(cards(page)).toHaveCount(3);
  await expect(
    page.getByRole("button", { name: /^Remove filter/ }),
  ).toHaveCount(0);
});

test("Price takes one band at a time and swaps; other headings do not", async ({
  page,
}) => {
  await page.goto("/shop");
  await openDrawer(page);

  await chip(page, "Under \\$100").click();
  await expect(chip(page, "Under \\$100")).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  // A second band replaces the first rather than joining it (owner ruling).
  await chip(page, "\\$300\\+").click();
  await expect(chip(page, "\\$300\\+")).toHaveAttribute("aria-pressed", "true");
  await expect(chip(page, "Under \\$100")).toHaveAttribute(
    "aria-pressed",
    "false",
  );

  // Tapping the lit band clears it, so "any price" is still reachable.
  await chip(page, "\\$300\\+").click();
  await expect(chip(page, "\\$300\\+")).toHaveAttribute(
    "aria-pressed",
    "false",
  );

  // Availability is unaffected — two of its chips light together.
  await chip(page, "In Stock").click();
  await chip(page, "Pre-Order").click();
  await expect(chip(page, "In Stock")).toHaveAttribute("aria-pressed", "true");
  await expect(chip(page, "Pre-Order")).toHaveAttribute("aria-pressed", "true");
});

test("a URL carrying two price bands is narrowed to one", async ({ page }) => {
  await page.goto("/shop?f=under-100,300-plus");
  // The drawer has no way to draw or undo two bands, so the page must not be
  // in that state: the first in drawer order survives.
  await expect(
    page.getByRole("button", { name: "Remove filter Under $100" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Remove filter $300+" }),
  ).toHaveCount(0);
});
