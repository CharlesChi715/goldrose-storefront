/**
 * ROLE OF THIS FILE
 * Homepage interaction specs. The H-nn ids below come from the 2026-07-25 IxD
 * table; the design is now maintained in Figma, not in a repo doc. The
 * pixel baselines in pixels.spec.ts already gate the homepage's appearance;
 * these cover behaviour the static import was missing.
 */

import { test, expect } from "@playwright/test";

test.describe("H-03 · hero carousel and pagination dots", () => {
  test("dots select slides, highlight the current one, and wrap around", async ({
    page,
  }) => {
    await page.goto("/");
    const dots = page.getByRole("button", { name: /^Show hero slide / });
    await expect(dots).toHaveCount(4);

    // Rests on the first slide (which is also what the pixel baseline shows).
    await expect(dots.nth(0)).toHaveAttribute("aria-current", "true");

    await dots.nth(2).click();
    await expect(dots.nth(2)).toHaveAttribute("aria-current", "true");
    await expect(dots.nth(0)).toHaveAttribute("aria-current", "false");

    // Wrap-around: the last dot then the first is a legal round trip.
    await dots.nth(3).click();
    await expect(dots.nth(3)).toHaveAttribute("aria-current", "true");
    await dots.nth(0).click();
    await expect(dots.nth(0)).toHaveAttribute("aria-current", "true");
  });

  test("cards lead to the shop, and the owner can redirect them", async ({
    page,
  }) => {
    await page.goto("/");
    // Until 2026-08-07 the hero passed no href at all, so every slide fell
    // through to the Carousel's own /placeholder default — a dead end for a
    // real visitor. It now reads `hero.photo_href` from the registry, which
    // ships as /shop and is editable in Content → Home page. H-03's eventual
    // want, the matching product detail page, still depends on OQ-3.
    await page.getByRole("link", { name: "hero slide 1" }).click();
    await expect(page).toHaveURL(/\/shop$/);
  });

  test("the track follows the finger and holds wherever it pauses", async ({
    page,
  }) => {
    await page.goto("/");
    const card = page.getByRole("link", { name: "hero slide 1" });
    const track = card.locator("..");
    const box = (await card.boundingBox())!;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    await page.mouse.move(cx, cy);
    await page.mouse.down();
    // The track is the finger: pixel-for-pixel, no easing, no snapping.
    await page.mouse.move(cx - 60, cy, { steps: 6 });
    await expect(track).toHaveCSS("transform", "matrix(1, 0, 0, 1, -60, 0)");
    await page.mouse.move(cx - 137, cy, { steps: 8 });
    await expect(track).toHaveCSS("transform", "matrix(1, 0, 0, 1, -137, 0)");

    // Paused mid-swipe it stays parked — nothing snaps it to a slide edge.
    await page.waitForTimeout(1200);
    await expect(track).toHaveCSS("transform", "matrix(1, 0, 0, 1, -137, 0)");

    // Only the release commits, and the drag must not also open the card.
    await page.mouse.up();
    await expect(track).toHaveCSS("transform", "matrix(1, 0, 0, 1, -430, 0)");
    await expect(page).toHaveURL(/\/$/);
  });

  test("a short drag springs back, and the first slide resists a rightward pull", async ({
    page,
  }) => {
    await page.goto("/");
    const card = page.getByRole("link", { name: "hero slide 1" });
    const track = card.locator("..");
    const box = (await card.boundingBox())!;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx - 20, cy, { steps: 4 });
    await expect(track).toHaveCSS("transform", "matrix(1, 0, 0, 1, -20, 0)");
    await page.mouse.up();
    // Under the 40px commit threshold, so it returns to the slide it left.
    await expect(track).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");

    // Pulling right off the first slide is damped 3:1 — there is no cell there.
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 30, cy, { steps: 4 });
    await expect(track).toHaveCSS("transform", "matrix(1, 0, 0, 1, 10, 0)");
    await page.mouse.up();
    await expect(track).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
  });

  test("the track slides horizontally rather than crossfading", async ({
    page,
  }) => {
    await page.goto("/");
    const track = page
      .getByRole("link", { name: "hero slide 1" })
      .locator("..");
    await expect(track).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
    await page.getByRole("button", { name: "Show hero slide 2" }).click();
    // One window width to the left — the outgoing slide travels off, the next
    // arrives from the right.
    await expect(track).toHaveCSS("transform", "matrix(1, 0, 0, 1, -430, 0)");
  });
});

/*
 * The 2026-08-04 simplified-homepage import (frame 2380:370). Every link
 * below comes from that frame's own prototype, and the two rails below were
 * static art before the import.
 */

test.describe("2380:370 · the simplified homepage's prototype links", () => {
  // Each row is [visible link name, expected href] straight off the frame.
  const FOOTER: [string, string][] = [
    ["SHOP", "/shop"],
    ["OUR CRAFT", "/craft"],
    ["OUR STORY", "/story"],
    ["FAQ", "/care"],
    ["BLOG", "/blog"],
    ["SHIPPING & RETURNS", "/policies/returns-refunds-cancellations"],
    ["PRIVACY", "/policies/privacy"],
    ["TERMS", "/policies/terms-of-service"],
  ];

  test("the footer link cloud reaches all eight destinations", async ({
    page,
  }) => {
    await page.goto("/");
    for (const [name, href] of FOOTER) {
      await expect(
        page.locator(`[data-el^="HOME-FOOTER-LINK-"][href="${href}"]`),
        `footer link ${name}`,
      ).toHaveCount(1);
    }
  });

  test("BLOG lands on the coming-soon scaffold, not a 404", async ({
    page,
  }) => {
    await page.goto("/blog");
    await expect(page.getByRole("heading", { name: "Journal" })).toBeVisible();
    await expect(page.getByText("This page is coming soon.")).toBeVisible();
  });

  test("every FAQ row and VIEW ALL FAQs opens the concierge chat", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator('[data-el^="HOME-FAQ-ROW-"]')).toHaveCount(4);
    await expect(
      page.locator('[data-el^="HOME-FAQ-"][href="/care/chat"]'),
    ).toHaveCount(5); // four rows plus VIEW ALL FAQs
  });

  test("the newsletter strip hands off to sign-up", async ({ page }) => {
    await page.goto("/");
    await page.locator('[data-el="HOME-NEWSLETTER-JOIN-BTN"]').click();
    await expect(page).toHaveURL(/\/account\/signup$/);
  });

  test("EXPLORE OUR CRAFT reaches the craft page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Explore our craft" }).click();
    await expect(page).toHaveURL(/\/craft$/);
  });
});

test.describe("H-22 · the Shop by Recipient rail", () => {
  test("dots select slides and highlight the current one", async ({ page }) => {
    await page.goto("/");
    const dots = page.getByRole("button", { name: /^Show recipient / });
    // Three wired dots; the design draws five, so two stay inert art.
    await expect(dots).toHaveCount(3);
    await expect(dots.nth(0)).toHaveAttribute("aria-current", "true");
    await dots.nth(2).click();
    await expect(dots.nth(2)).toHaveAttribute("aria-current", "true");
    await expect(dots.nth(0)).toHaveAttribute("aria-current", "false");
  });

  test("the track slides one card's pitch per step", async ({ page }) => {
    await page.goto("/");
    const track = page.getByRole("link", { name: "recipient 1" }).locator("..");
    await expect(track).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
    await page.getByRole("button", { name: "Show recipient 2" }).click();
    // 186px pitch, verbatim from the design's card origins (15 → 201 → 387).
    await expect(track).toHaveCSS("transform", "matrix(1, 0, 0, 1, -186, 0)");
  });
});

test.describe("H-19 · the Shop by Occasion rail", () => {
  test("its dots are wired to slides", async ({ page }) => {
    await page.goto("/");
    const dots = page.getByRole("button", { name: /^Show occasion / });
    // Three wired dots; the design draws seven, so four stay inert art.
    await expect(dots).toHaveCount(3);
    await dots.nth(1).click();
    await expect(dots.nth(1)).toHaveAttribute("aria-current", "true");
  });
});

test.describe("H-09 · Best Sellers", () => {
  test("the rail carries the design's two distinct cards", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.locator('[data-el="HOME-FEATURED-PRODUCT-TITLE-1"]'),
    ).toHaveText("Personalized Gold-Dipped Rose");
    await expect(
      page.locator('[data-el="HOME-FEATURED-PRODUCT-TITLE-2"]'),
    ).toHaveText("Enchanted Rose with LED Light");
    await expect(
      page.locator('[data-el="HOME-FEATURED-PRODUCT-PRICE-2"]'),
    ).toHaveText("$119.00");
    // The design deleted this rail's dots in 2380:399.
    await expect(
      page.getByRole("button", { name: /^Show best seller / }),
    ).toHaveCount(0);
  });
});
