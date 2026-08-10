/**
 * ROLE OF THIS FILE
 * The header search overlay, end to end (2026-08-10). The unit tests already
 * pin the matching rules; what only a browser can prove is that the panel a
 * shopper types into and the page they land on describe the SAME shop — the
 * failure this feature is most exposed to is a dropdown that previews one set
 * of products and an Enter key that delivers another.
 *
 * It also pins the two things that are invisible until they are gone: results
 * appearing WITHOUT a submit (the whole point of typing), and the panel not
 * firing a request per keystroke (which is what the fetched index buys).
 *
 * The three seed products carry (see lib/supabase/seed-data.ts):
 *   Signature Rose  classic  anniversary birthday  wife girlfriend  $49.99
 *   Boxed Keepsake  jewel    valentines  wedding   mother girlfriend $64.99
 *   Premium Bundle  sparkle  anniversary wedding   wife friends      $79.99
 */

import { test, expect, type Page } from "@playwright/test";

const RECENTS_KEY = "goldrose.recent-searches";

/** Without `exact`, "Search" also matches the panel's "Clear search" button. */
const openSearch = async (page: Page) => {
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Search" })).toBeVisible();
};

const panel = (page: Page) => page.getByRole("dialog", { name: "Search" });
const field = (page: Page) =>
  page.getByRole("combobox", { name: /Search products/ });
const results = (page: Page) => panel(page).locator('a[href^="/products/"]');

test("typing shows matching products without submitting anything", async ({
  page,
}) => {
  await page.goto("/");
  await openSearch(page);
  // The panel opens ready to type — a search box that needs a second tap
  // loses the visitor it just interrupted.
  await expect(field(page)).toBeFocused();

  await field(page).fill("keepsake");
  await expect(panel(page).getByText("1 Gift", { exact: true })).toBeVisible();
  await expect(results(page)).toHaveCount(1);
  await expect(results(page).first()).toHaveAttribute(
    "href",
    "/products/boxed-keepsake-gold-rose",
  );
  // The row is a real product row, not a bare string.
  await expect(results(page).first().getByText("$64.99")).toBeVisible();

  // Narrowing and widening both track the field, with no submit anywhere.
  await field(page).fill("rose");
  await expect(results(page)).toHaveCount(3);
  await field(page).fill("zzzznotaproduct");
  await expect(panel(page).getByText("No exact match")).toBeVisible();
});

test("the panel keeps the promise its own chips make", async ({ page }) => {
  // "For Mom" is a trending chip we ship. Until 2026-08-10 it, "Anniversary
  // Gift" and "Ready to Ship" all landed on an empty grid, because the engine
  // read titles only and no product is called "mom".
  await page.goto("/");
  await openSearch(page);
  await field(page).fill("For Mom");
  await expect(results(page)).toHaveCount(1);
  await expect(results(page).first()).toHaveAttribute(
    "href",
    "/products/boxed-keepsake-gold-rose",
  );

  await field(page).fill("Anniversary Gift");
  await expect(results(page)).toHaveCount(2);

  await field(page).fill("Ready to Ship");
  await expect(results(page)).toHaveCount(3);
});

test("the dropdown and /shop never disagree about what matched", async ({
  page,
}) => {
  await page.goto("/");
  await openSearch(page);
  await field(page).fill("For Mom");
  const previewed = await results(page).evaluateAll((nodes) =>
    nodes.map((node) => (node as HTMLAnchorElement).getAttribute("href")),
  );

  await field(page).press("Enter");
  await page.waitForURL(/\/shop\?q=/);
  const landed = await page
    .locator('a[href^="/products/"]')
    .evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLAnchorElement).getAttribute("href")),
    );
  expect(landed).toEqual(previewed);
  await expect(page.getByText(/^1 GIFT$/)).toBeVisible();
});

test("a trending chip searches, and the search is remembered", async ({
  page,
}) => {
  await page.goto("/");
  await openSearch(page);
  await panel(page)
    .getByRole("button", { name: /^For Mom/ })
    .click();
  await page.waitForURL(/\/shop\?q=For%20Mom/);
  await expect(page.locator('a[href^="/products/"]')).toHaveCount(1);

  // The chip's own words come back as history the next time the panel opens.
  // Asserted through the row's Remove button, because "For Mom" is now BOTH a
  // trending chip and a recent row — and only a recent row can be removed.
  await openSearch(page);
  await expect(panel(page).getByText("Recent Searches")).toBeVisible();
  await expect(
    panel(page).getByRole("button", { name: /^Remove “For Mom”/ }),
  ).toBeVisible();
});

test("a visitor with no history is offered the shop, not an empty half-panel", async ({
  page,
}) => {
  await page.goto("/");
  await openSearch(page);
  await expect(panel(page).getByText("All Gifts")).toBeVisible();
  await expect(results(page)).toHaveCount(3);
  // Trending is still there; the frame's second block is what changed.
  await expect(panel(page).getByText("Trending Searches")).toBeVisible();
  await expect(panel(page).getByText("Recent Searches")).toHaveCount(0);
});

test("history is shown, removable, and clearable", async ({ page }) => {
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [RECENTS_KEY, JSON.stringify(["gold rose", "for mom"])] as const,
  );
  await page.goto("/");
  await openSearch(page);
  await expect(panel(page).getByText("Recent Searches")).toBeVisible();
  await panel(page)
    .getByRole("button", { name: /^Remove “gold rose”/ })
    .click();
  await expect(
    panel(page).getByRole("button", { name: "gold rose", exact: true }),
  ).toHaveCount(0);
  await panel(page).getByRole("button", { name: "Clear all" }).click();
  // With the history gone the panel falls back to the shop itself.
  await expect(panel(page).getByText("All Gifts")).toBeVisible();
});

test("the keyboard drives the list without leaving the field", async ({
  page,
}) => {
  await page.goto("/");
  await openSearch(page);
  await field(page).fill("rose");
  await expect(results(page)).toHaveCount(3);

  // Focus must STAY in the field — the next character typed has to land.
  await field(page).press("ArrowDown");
  await expect(field(page)).toBeFocused();
  await expect(field(page)).toHaveAttribute(
    "aria-activedescendant",
    "search-result-0",
  );
  await field(page).press("ArrowDown");
  await expect(field(page)).toHaveAttribute(
    "aria-activedescendant",
    "search-result-1",
  );
  // Up from the first wraps to the last, as the sort dropdown's own lists do.
  await field(page).press("ArrowUp");
  await field(page).press("ArrowUp");
  await expect(field(page)).toHaveAttribute(
    "aria-activedescendant",
    "search-result-2",
  );

  await field(page).press("Enter");
  await page.waitForURL(/\/products\//);
});

test("Escape clears a typed query before it closes the panel", async ({
  page,
}) => {
  await page.goto("/");
  await openSearch(page);
  await field(page).fill("rose");
  await page.keyboard.press("Escape");
  // One press empties the field and the panel is still up.
  await expect(panel(page)).toBeVisible();
  await expect(field(page)).toHaveValue("");
  await page.keyboard.press("Escape");
  await expect(panel(page)).toHaveCount(0);
});

test("the index is fetched once, not once per keystroke", async ({ page }) => {
  const calls: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/search")) calls.push(request.url());
  });
  await page.goto("/");
  await openSearch(page);
  await field(page).pressSequentially("keepsake", { delay: 20 });
  await expect(results(page)).toHaveCount(1);
  // Eight characters typed. A request per letter is the bug this design
  // exists to avoid, and it would also make results arrive out of order.
  expect(calls.length).toBe(1);
});

test("the search index never loads while the overlay is closed", async ({
  page,
}) => {
  // The button prefetches on POINTER ENTER, so a page that merely renders the
  // header must not pull the catalogue: /, /shop and every product page carry
  // this button, and the three pixel baselines wait on network idle.
  const calls: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/search")) calls.push(request.url());
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(calls).toEqual([]);
});

test("the API answers with the catalog, and leaks nothing private", async ({
  request,
}) => {
  const response = await request.get("/api/search");
  expect(response.ok()).toBe(true);
  const body = await response.json();
  expect(body.ok).toBe(true);
  expect(body.products).toHaveLength(3);

  const raw = JSON.stringify(body);
  for (const secret of [
    "cost_cents",
    "inventory_on_hand",
    "track_quantity",
    "status",
    "vendor",
  ]) {
    expect(raw).not.toContain(secret);
  }
  // Availability arrives as the drawer's own wording, never as a count.
  expect(body.products[0].availability).toBe("Ready to Ship");
});

test("a search that cannot load says so, instead of reporting an empty shop", async ({
  page,
}) => {
  // A dead catalogue and a catalogue with nothing in it produce the same empty
  // array. They must never produce the same sentence: "no gifts match" during
  // an outage tells every shopper this store sells nothing.
  await page.route("**/api/search", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ ok: false, error: "nope", products: [] }),
    }),
  );
  await page.goto("/");
  await openSearch(page);
  await field(page).fill("rose");
  await expect(panel(page).getByText("Search is unavailable")).toBeVisible();
  await expect(panel(page).getByText("No exact match")).toHaveCount(0);

  // And the typed words are still carried to /shop, which matches server-side.
  await panel(page)
    .getByRole("button", { name: /Search in the shop/ })
    .click();
  await page.waitForURL(/\/shop\?q=rose/);
  await expect(page.locator('a[href^="/products/"]')).toHaveCount(3);
});

test("a query in a script we cannot read offers the shop, it does not claim a match", async ({
  page,
}) => {
  // 玫瑰 folds away to nothing, exactly as an empty box does. Showing the whole
  // catalogue as MATCHES for it would be a lie the shopper cannot detect.
  await page.goto("/");
  await openSearch(page);
  await field(page).fill("玫瑰");
  await expect(panel(page).getByText("No exact match")).toBeVisible();
  await expect(
    panel(page).getByText(/here is the whole collection/),
  ).toBeVisible();
  await expect(results(page)).toHaveCount(3);
});

test("results arrive on the second character", async ({ page }) => {
  await page.goto("/");
  await openSearch(page);
  await field(page).fill("ro");
  await expect(panel(page).getByText("3 Gifts", { exact: true })).toBeVisible();
  await expect(results(page)).toHaveCount(3);
});
