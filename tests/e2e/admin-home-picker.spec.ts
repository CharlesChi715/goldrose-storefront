/**
 * ROLE OF THIS FILE
 * Acceptance for point-and-edit on Content → Home page: arming the picker,
 * clicking a field in the live preview, typing into the panel that opens, and —
 * the part that actually broke — moving the preview while a field is selected.
 *
 * WHY IT EXISTS
 * Nothing in the suite drove the picker until 2026-08-08. Every other home-page
 * test reaches a field through the search-and-list path, so a full green run
 * said nothing whatever about pointing, and two wrong diagnoses shipped behind
 * it. The failure is a React update loop, which does not show up as a wrong
 * pixel or a missing element — it throws. So these tests watch `pageerror`
 * rather than the DOM: an assertion on what is on screen would pass right up
 * until the error boundary swallowed the screen.
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

/** The main live preview, told apart from the eight per-section windows. */
const PREVIEW = 'iframe[title="Live preview"]';

/**
 * Open the editor and arm the picker, with the preview loaded and pointable.
 *
 * The preview iframe is `loading="lazy"` — it is below the section map on
 * purpose — so it has to be scrolled to before anything inside it exists.
 *
 * @param page - The Playwright page.
 */
async function armed(page: Page) {
  await adminLogin(page);
  await page.goto("/admin/content/home");
  await expect(page.getByRole("heading", { name: "Home page" })).toBeVisible();

  const arm = page.getByRole("button", {
    name: "Point at something to edit it",
  });
  await arm.scrollIntoViewIfNeeded();
  // Lazy: reaching it is what loads the frame.
  await expect(page.frameLocator(PREVIEW).locator(".figv-stage")).toBeVisible();
  await arm.click();
  await expect(
    page.getByRole("button", { name: "Done pointing" }),
  ).toBeVisible();
}

/**
 * Click a field where it is drawn in the preview.
 *
 * The click has to land on the capture layer, not inside the frame — the
 * storefront's links are real and one click would navigate the preview away.
 * So this measures the element through the frame (Playwright reports iframe
 * content in main-frame coordinates, transforms included) and clicks that spot
 * on the layer covering it, which is exactly what a person does.
 *
 * @param page - The Playwright page.
 * @param key - A `"<section>.<id>"` field key, as carried by `data-field`.
 */
async function pointAt(page: Page, key: string) {
  // The whole preview has to be on screen first. `page.mouse` works in viewport
  // coordinates, so a target measured below the fold would be clicked at a
  // clamped position — landing on nothing, and looking exactly like a picker
  // that failed to resolve.
  await page.locator(PREVIEW).scrollIntoViewIfNeeded();
  const target = page.frameLocator(PREVIEW).locator(`[data-field~="${key}"]`);
  await expect(target).toBeVisible();
  const box = await target.boundingBox();
  if (!box) throw new Error(`${key} has no box in the preview`);
  const at = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const size = page.viewportSize();
  if (size && (at.y < 0 || at.y > size.height)) {
    throw new Error(
      `${key} is drawn at y=${at.y}, outside the ${size.height}px viewport`,
    );
  }
  await page.mouse.click(at.x, at.y);
}

/** Every uncaught page error, so a React throw cannot pass as a pass. */
function watchForThrows(page: Page): string[] {
  const thrown: string[] = [];
  page.on("pageerror", (error) => thrown.push(error.message));
  return thrown;
}

test("pointing at a headline opens it, and typing reaches the preview", async ({
  page,
}) => {
  const thrown = watchForThrows(page);
  await armed(page);

  await pointAt(page, "hero.title");

  // The panel opens on the field that was pointed at, badged with its own
  // section — scoped to the panel, because the section map above names A-1 too.
  const panel = page.locator("[data-home-editor-panel]");
  await expect(panel).toBeVisible();
  await expect(panel.getByText("A-1", { exact: true })).toBeVisible();
  const headline = panel.getByRole("textbox", { name: /Headline/ });
  await expect(headline).toBeVisible();

  await headline.fill("Pointed At This");
  // The preview is written into directly — that is the whole "live as you type"
  // feature — so the page itself must show it without a save or a reload.
  await expect(
    page.frameLocator(PREVIEW).locator('[data-field~="hero.title"]'),
  ).toHaveText("Pointed At This");

  expect(thrown).toEqual([]);
});

test("the screen survives the preview moving under a selected field", async ({
  page,
}) => {
  const thrown = watchForThrows(page);
  await armed(page);
  await pointAt(page, "hero.title");
  const panel = page.locator("[data-home-editor-panel]");
  await expect(panel.getByRole("textbox", { name: /Headline/ })).toBeVisible();

  // THE REGRESSION. While something is selected the picker re-measures every
  // frame, and a moving page means every frame really is different — so this is
  // the state that publishes sixty times a second. Typing was blamed for it
  // because typing is one re-render; scrolling is sixty of them.
  //
  // The ticks run BACK TO BACK on purpose. An earlier version of this test put
  // 50ms between them and passed against the very build that crashes by hand:
  // the gap is long enough for React to settle and reset its nested-update
  // count, so the storm never builds. A person spinning a wheel does not pause.
  const layer = page.locator("[data-home-picker-capture]");
  const box = await layer.boundingBox();
  if (!box) throw new Error("the picker's capture layer is not on screen");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  // Over the capture layer the wheel is swallowed and scrolls the PREVIEW.
  for (let i = 0; i < 30; i++) await page.mouse.wheel(0, 100);
  // Off it, the same gesture scrolls the ADMIN, which moves the selection just
  // as surely. Both paths reach the picker's loop; only one was ever tried.
  await page.mouse.move(box.x + box.width / 2, Math.max(1, box.y - 40));
  for (let i = 0; i < 30; i++) await page.mouse.wheel(0, 100);
  await page.waitForTimeout(500);

  // Editing must still work afterwards, which is the point of surviving.
  await panel.getByRole("textbox", { name: /Headline/ }).fill("Still Alive");
  await expect(
    page.frameLocator(PREVIEW).locator('[data-field~="hero.title"]'),
  ).toHaveText("Still Alive");

  expect(thrown).toEqual([]);
  // And the screen is still the screen, not the error boundary's apology.
  await expect(page.getByRole("heading", { name: "Home page" })).toBeVisible();
});
