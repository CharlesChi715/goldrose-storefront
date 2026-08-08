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
  // The frame sits ABOVE the fields and is the server rendering saved content,
  // so while an edit is unsaved it has to say so — otherwise a teammate types a
  // heading, looks up at the old one, and concludes the preview is broken.
  await expect(
    page
      .locator('[data-home-section="featured"]')
      .getByText("Showing the saved version"),
  ).toBeVisible();
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

/* --- The per-section live previews (2026-08-08) ------------------------- */

test("every section opens with a live preview of itself, fetched when reached", async ({
  page,
}) => {
  await openEditor(page);

  // Nothing far down the page has been fetched yet. Each frame is a
  // force-dynamic storefront render that reads site_content in full, and a save
  // re-keys every one of them — mounting all nine on open would make this
  // screen nine of those, twice over, for someone on a slow link. `loading`
  // alone is only a hint, so the frame is mounted on intersection.
  await expect(page.locator('[data-home-section="story"] iframe')).toHaveCount(
    0,
  );

  // One frame per section, each pointed at that section's own route — the
  // screen's promise is that what you are editing is on screen before the
  // first input.
  for (const id of [
    "promo",
    "hero",
    "featured",
    "ready",
    "occasion",
    "recipient",
    "craft",
    "story",
    // The rail speed has nothing of its own on the page, so its frame borrows
    // the Featured band — a still picture of a speed would be worthless.
    "motion",
  ]) {
    const section = page.locator(`[data-home-section="${id}"]`);
    // `block: "start"` rather than scrollIntoViewIfNeeded: a section card is
    // taller than the viewport, so "if needed" is satisfied by any sliver of it
    // showing while the preview stage at its top is still far below.
    await section.evaluate((el) => el.scrollIntoView({ block: "start" }));
    await expect(section.locator("iframe")).toHaveAttribute(
      "src",
      new RegExp(`^/preview/home/${id}\\?`),
    );
  }
});

test("the standalone preview is the band alone — no promo bar, header or tab bar", async ({
  page,
}) => {
  await adminLogin(page);
  await page.goto("/preview/home/craft", { waitUntil: "networkidle" });

  // The band is there, at exactly its own height: A-9 is 991 design pixels.
  await expect(page.getByText("Inside the ELDREVE Workshop")).toBeVisible();
  const height = await page
    .locator(".figv-stage")
    .evaluate((el) => parseFloat(getComputedStyle(el).height));
  expect(height).toBe(991);

  // ...and nothing else is: no bottom tab bar, and none of the bands that sit
  // above or below it on the page.
  await expect(page.locator(".figv-navstage")).toHaveCount(0);
  await expect(page.getByText("Featured Rose Gifts")).toHaveCount(0);
  await expect(page.getByText("Frequently Asked Questions")).toHaveCount(0);
});

test("the standalone preview is admin-only", async ({ browser }) => {
  // This route lives in the STOREFRONT tree, and proxy.ts matches only /admin
  // and /api/admin — so one `await requireAdmin()` in the page is the entire
  // gate on something that deliberately renders sections the owner has HIDDEN,
  // i.e. copy the live site does not show. Every other test here signs in
  // first, so deleting that line would leave the whole suite green.
  const context = await browser.newContext();
  const page = await context.newPage();
  const response = await page.goto("/preview/home/craft");
  expect(response?.status()).toBe(404);
  await expect(page.getByText("Inside the ELDREVE Workshop")).toHaveCount(0);
  await context.close();
});

test("each width slider is the section's own, and Match reconciles it", async ({
  page,
}) => {
  await openEditor(page);
  const craft = page.locator('[data-home-section="craft"]');
  const story = page.locator('[data-home-section="story"]');
  // The frames mount on intersection, so bring both into view before measuring
  // them. Once reached they stay mounted, which is what lets the rest of this
  // test scroll freely.
  await craft.evaluate((el) => el.scrollIntoView({ block: "start" }));
  await story.evaluate((el) => el.scrollIntoView({ block: "start" }));
  await expect(craft.locator("iframe")).toHaveCount(1);
  await expect(story.locator("iframe")).toHaveCount(1);

  /**
   * The width of the BOX around a section's frame — what the eye actually
   * lands on, and the only honest measure here.
   *
   * Not the iframe's own width: that is pinned to the design's 430 forever and
   * the slider is applied as a transform, so the iframe's width says nothing
   * about what the control did. An earlier version of this test asserted
   * exactly that and passed straight through a bug where the visible box came
   * out identical at 320 and at 440 — the slider looked live and moved
   * nothing.
   */
  const boxWidth = (section: ReturnType<Page["locator"]>) =>
    section
      .locator("iframe")
      .evaluate((el) => (el.parentElement as HTMLElement).offsetWidth);

  // Everything starts at the design's own 430, so there is nothing to sync.
  // The control is present but dead rather than absent: it sits in the row
  // directly above the frame, and a button that mounts mid-drag moves it.
  const match = craft.getByRole("button", { name: "Match the main preview" });
  await expect(match).toBeDisabled();
  const craftAtDesign = await boxWidth(craft);
  const storyAtDesign = await boxWidth(story);

  // Move the PAGE-WIDE preview to a narrow phone. The sections do not follow —
  // that is the point of separate sliders — but each now offers to.
  await page.locator("input[type=range]").first().fill("360");
  await expect(page.locator('iframe[src^="/?adminPreview"]')).toHaveCSS(
    "width",
    "360px",
  );
  expect(await boxWidth(craft)).toBe(craftAtDesign);
  await expect(match).toBeEnabled();

  await match.click();
  await expect(match).toBeDisabled();
  const craftMatched = await boxWidth(craft);
  expect(craftMatched).toBeLessThan(craftAtDesign);
  // One section's slider never moves another's.
  expect(await boxWidth(story)).toBe(storyAtDesign);

  // Dragging further still shrinks it — and the room reserved for the frame
  // does NOT change, which is what stops this ~26,000px page re-computing its
  // scroll thumb on every frame of a drag.
  const stageBefore = await craft
    .locator("iframe")
    .evaluate(
      (el) => (el.parentElement!.parentElement as HTMLElement).offsetHeight,
    );
  await craft.locator("input[type=range]").fill("320");
  expect(await boxWidth(craft)).toBeLessThan(craftMatched);
  const stageAfter = await craft
    .locator("iframe")
    .evaluate(
      (el) => (el.parentElement!.parentElement as HTMLElement).offsetHeight,
    );
  expect(stageAfter).toBe(stageBefore);

  // And the frame sits at a WHOLE-pixel offset inside that stage at every
  // setting. Centring it with `justify-content: center` halves the free space,
  // which is odd at about half the slider's positions — putting the box's 1px
  // border and the band's flush-left content on a half CSS pixel, a whole
  // device pixel at 2×. Alternating between the two on every step of a drag is
  // a shimmer down the left edge, so the offset is rounded instead.
  const ready = page.locator('[data-home-section="ready"]');
  await ready.evaluate((el) => el.scrollIntoView({ block: "start" }));
  await expect(ready.locator("iframe")).toHaveCount(1);
  for (const w of ["440", "437", "430", "421", "377", "320"]) {
    await ready.locator("input[type=range]").fill(w);
    const offset = await ready.locator("iframe").evaluate((el) => {
      const box = el.parentElement as HTMLElement;
      return [box.offsetLeft, box.offsetTop];
    });
    expect(offset.every(Number.isInteger)).toBe(true);
  }
});
