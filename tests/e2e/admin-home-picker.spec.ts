/**
 * ROLE OF THIS FILE
 * Acceptance for point-and-edit on Content → Home page: arming the picker,
 * clicking something in a SECTION'S OWN window, and editing it in the panel
 * that opens beside that window.
 *
 * WHY IT EXISTS
 * Nothing in the suite drove the picker until 2026-08-08. Every other home-page
 * test reaches a field through the search-and-list path, so a full green run
 * said nothing whatever about pointing, and two wrong diagnoses shipped behind
 * it.
 *
 * THE SCROLL TEST IS THE POINT OF THE FILE
 * Pointing used to live on the page-wide preview, which answers the pointer —
 * so it needed a transparent layer to keep clicks off the storefront's real
 * links, that layer swallowed the wheel, the scroll had to be re-issued
 * programmatically, and the storefront's own `scroll-behavior: smooth` turned
 * every wheel event into an eased animation the next event cancelled. Measured
 * by hand: a gesture asking for 2,000px moved 118. "Preview scrolls at a normal
 * speed" is therefore a real, checkable guarantee, and the last test here is the
 * one that keeps it.
 *
 * NOTHING HERE IS SAVED
 * Every edit stays a local draft — Save is never pressed — so no `site_content`
 * override is stored and pixels.spec.ts's byte-identical home baseline is
 * untouched.
 */

import { test, expect, type Page } from "@playwright/test";
import { adminLogin, ADMIN_VIEWPORT } from "./helpers";

test.use({ viewport: ADMIN_VIEWPORT });
test.describe.configure({ mode: "serial" });

/** The page-wide preview, told apart from the eight per-section windows. */
const PREVIEW = 'iframe[title="Live preview"]';

/** Open the editor and arm the picker for every section at once. */
async function armed(page: Page) {
  await adminLogin(page);
  await page.goto("/admin/content/home");
  await expect(page.getByRole("heading", { name: "Home page" })).toBeVisible();
  await page
    .getByRole("button", { name: "Point at something to edit it" })
    .click();
  await expect(
    page.getByRole("button", { name: "Done pointing" }),
  ).toBeVisible();
}

/**
 * Click a field where its own section's window is drawing it.
 *
 * Two things have to be true before a click means anything, and both are the
 * test's job rather than the app's: the card must be on screen (the windows are
 * lazily mounted), and the target must be inside the window's 360px view rather
 * than merely somewhere in the 5,000px film behind it. So this scrolls the
 * window by however much is missing, then clicks the middle of what is actually
 * showing — which is exactly the click a person makes.
 *
 * @param page - The Playwright page.
 * @param sectionId - The card to point in.
 * @param key - A `"<section>.<id>"` field key, as carried by `data-field`.
 */
async function pointAt(page: Page, sectionId: string, key: string) {
  const card = page.locator(`#home-section-${sectionId}`);
  // INSTANT, explicitly. The admin loads the storefront's globals.css, which
  // sets `html { scroll-behavior: smooth }` — so Playwright's own
  // scrollIntoViewIfNeeded animates, and every coordinate measured afterwards
  // is stale by the time the click lands. It fails as "the picker resolved
  // nothing", which is a lie about the app.
  await card.evaluate((el) =>
    el.scrollIntoView({ block: "start", behavior: "instant" }),
  );
  const window = page.locator(`[data-home-picker-window="${sectionId}"]`);
  await expect(window).toBeVisible();

  const target = page
    .frameLocator(`#home-section-${sectionId} iframe`)
    .locator(`[data-field~="${key}"]`);
  await expect(target).toBeVisible();

  // Bring it into the window's own view, in the window's own scroll.
  const at = await page.evaluate(
    ({ id, field }) => {
      const win = document.querySelector<HTMLElement>(
        `[data-home-picker-window="${id}"]`,
      );
      const frame = document.querySelector<HTMLIFrameElement>(
        `#home-section-${id} iframe`,
      );
      const node = frame?.contentDocument?.querySelector(
        `[data-field~="${field}"]`,
      );
      if (!win || !frame || !node) return null;
      const scale = frame.getBoundingClientRect().width / frame.offsetWidth;
      const inFilm = node.getBoundingClientRect();
      const onAdmin = {
        top: frame.getBoundingClientRect().top + scale * inFilm.top,
        height: scale * inFilm.height,
      };
      const box = win.getBoundingClientRect();
      // Centre it if it is not already wholly inside the window.
      const wanted =
        onAdmin.top + onAdmin.height / 2 - (box.top + box.height / 2);
      win.scrollTop += wanted;
      const after = node.getBoundingClientRect();
      return {
        x:
          frame.getBoundingClientRect().left +
          scale * (after.left + after.width / 2),
        y:
          frame.getBoundingClientRect().top +
          scale * (after.top + after.height / 2),
      };
    },
    { id: sectionId, field: key },
  );
  if (!at) throw new Error(`${key} is not in ${sectionId}'s window`);
  await page.mouse.click(at.x, at.y);
}

test("pointing in a section's window opens that field, in that card", async ({
  page,
}) => {
  await armed(page);
  await pointAt(page, "hero", "hero.title");

  // The editor docks INSIDE the card whose window was pointed at — that is what
  // "beside the thing you are editing" means now that there are nine of them.
  const panel = page.locator("#home-section-hero [data-home-editor-panel]");
  await expect(panel).toBeVisible();
  await expect(panel.getByText("A-1", { exact: true })).toBeVisible();
  await expect(panel.getByRole("textbox", { name: /Headline/ })).toBeVisible();
});

test("typing reaches every preview showing that field, not just one", async ({
  page,
}) => {
  await armed(page);
  await pointAt(page, "hero", "hero.title");

  const panel = page.locator("#home-section-hero [data-home-editor-panel]");
  await panel
    .getByRole("textbox", { name: /Headline/ })
    .fill("Pointed At This");

  // Its own section's window, which is the one being looked at...
  await expect(
    page
      .frameLocator("#home-section-hero iframe")
      .locator('[data-field~="hero.title"]'),
  ).toHaveText("Pointed At This");
  // ...and the page-wide preview above, which shows the same field. One of them
  // still saying yesterday's wording is how a teammate concludes the preview is
  // broken.
  await expect(
    page.frameLocator(PREVIEW).locator('[data-field~="hero.title"]'),
  ).toHaveText("Pointed At This");
});

test("a field you can point at is still listed, for anyone who cannot", async ({
  page,
}) => {
  await armed(page);
  const card = page.locator("#home-section-hero");
  await card.evaluate((el) =>
    el.scrollIntoView({ block: "start", behavior: "instant" }),
  );

  // The frames are aria-hidden and tabIndex=-1 on purpose, so pointing is a
  // mouse shortcut and never the only way in. Between 2026-08-08 and the move
  // to section windows it WAS the only way in for ~155 fields; this is the
  // assertion that stops that coming back.
  await expect(card.getByRole("textbox", { name: /Headline/ })).toBeVisible();
  await expect(card.getByRole("textbox", { name: /Eyebrow/ })).toBeVisible();
});

test("the page-wide preview scrolls at a normal speed", async ({ page }) => {
  await armed(page);

  // No capture layer anywhere, armed or not: that is the structural half of the
  // guarantee, and the reason the wheel is never taken off the browser.
  await expect(page.locator("[data-home-picker-capture]")).toHaveCount(0);

  const frame = page.locator(PREVIEW);
  await frame.evaluate((el) =>
    el.scrollIntoView({ block: "center", behavior: "instant" }),
  );
  const box = await frame.boundingBox();
  if (!box) throw new Error("the page-wide preview is not on screen");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  for (let i = 0; i < 10; i++) await page.mouse.wheel(0, 100);
  await page.waitForTimeout(300);

  const travelled = await page.evaluate(
    (sel) =>
      document.querySelector<HTMLIFrameElement>(sel)?.contentWindow?.scrollY ??
      0,
    PREVIEW,
  );
  // 1,000px was asked for. The threshold is set from measurement rather than
  // taste: through the old capture layer, thirty back-to-back ticks of 100px
  // moved the frame 664px — about a fifth of what was asked — so ten ticks
  // landed near 220. Native scrolling delivers the lot.
  expect(travelled).toBeGreaterThan(800);
});

test("framing a replaced photo reaches the live page, and resets with it", async ({
  page,
}) => {
  await adminLogin(page);
  await page.goto("/admin/content/home");
  await expect(page.getByRole("heading", { name: "Home page" })).toBeVisible();

  const card = page.locator("#home-section-featured");
  await card.evaluate((el) =>
    el.scrollIntoView({ block: "start", behavior: "instant" }),
  );

  // While the photo is still the design's own, there is nothing to frame: the
  // page draws Figma's traced geometry and a frame would be a second answer.
  await card.getByRole("button", { name: "Change photo" }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator('input[type="range"]')).toHaveCount(0);

  // Choose one of our own, and the framer appears against the REAL box.
  await dialog.locator("button img").first().click();
  await card.getByRole("button", { name: "Change photo" }).first().click();
  const zoom = page.getByRole("dialog").locator('input[type="range"]').first();
  await expect(zoom).toBeVisible();
  await zoom.focus();
  for (let i = 0; i < 30; i++) await page.keyboard.press("ArrowRight");

  // Live in the section's own window, before any save.
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const frame = document.querySelector<HTMLIFrameElement>(
          "#home-section-featured iframe",
        );
        const img = frame?.contentDocument?.querySelector<HTMLElement>(
          '[data-field~="featured.card_1_photo"]',
        );
        return img?.style.transform ?? "";
      }),
    )
    .toMatch(/scale\(/);

  // The photo AND its framing are both unsaved changes.
  await expect(page.getByText(/Unsaved changes \(2\)/)).toBeVisible();

  // Put it all back, so this test leaves no override for pixels.spec.ts.
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel" })
    .click();
  await page.getByRole("button", { name: "Discard" }).click();
  await expect(page.getByText(/Unsaved changes/)).toHaveCount(0);
});
