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

test("the section map is the page drawn to scale, and jumps where it points", async ({
  page,
}) => {
  await openEditor(page);
  const map = page.locator("[data-home-map]");
  await expect(map).toBeVisible();

  // Every section is reachable from it: the seven bands, plus the two with no
  // band of their own — the promo bar above the map, slideshow speed below it.
  await expect(map.locator("[data-home-map-row]")).toHaveCount(9);

  // Each link is exactly as tall as its band at the map's scale, which is the
  // whole point: A-9 is 991px of page and A-3 is 327px after the 2026-08-07
  // trim, and a wrapped list of names cannot show that at all.
  const craft = await map.locator('[data-home-map-row="craft"]').boundingBox();
  const ready = await map.locator('[data-home-map-row="ready"]').boundingBox();
  expect(craft!.height / ready!.height).toBeGreaterThan(2.5);

  // A band's strip over the thumbnail starts where its link starts. Off by a
  // pixel here would mean the map and the page had drifted apart.
  const strip = await map
    .locator('[data-home-map-strip="craft"]')
    .boundingBox();
  expect(Math.abs(strip!.y - craft!.y)).toBeLessThan(1.5);

  // And it is navigation, not decoration — landing the section CLEAR of the
  // admin's fixed 56px top bar. `block: "start"` alone parks the section's
  // first line underneath it, which reads as having jumped slightly too far.
  await map.locator('[data-home-map-row="story"]').click();
  const anchor = page.locator('[data-home-section="story"]');
  await expect(anchor).toBeInViewport();
  const bar = (await page.locator(".Polaris-Frame__TopBar").boundingBox()) as {
    y: number;
    height: number;
  };
  await expect
    .poll(async () => (await anchor.boundingBox())!.y)
    .toBeGreaterThanOrEqual(bar.y + bar.height);
});

test("the previews of the home page are not recorded as visits", async ({
  page,
}) => {
  // Both the section map and the live preview are the REAL home page in an
  // iframe, so their pathname is `/` and the beacon's `/admin` guard does not
  // apply to them. Before this was handled, opening this one screen wrote two
  // home-page views plus a stream of engagement updates — analytics the shop
  // is judged on, for visits nobody made.
  const beacons: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("/api/beacon")) beacons.push(new URL(url).pathname);
  });

  await openEditor(page);
  // The assertion is only worth anything if the previews actually rendered:
  // a screen that failed to embed anything would pass it for the wrong reason.
  await expect.poll(() => page.frames().length).toBeGreaterThan(1);
  // A view posts on mount and engagement flushes on a timer, so give both room
  // to have happened.
  await page.waitForTimeout(2500);

  expect(beacons).toEqual([]);
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

/** The window element for one section — the box that scrolls. */
function windowOf(page: Page, id: string) {
  return page.locator(`[data-home-section="${id}"] [role="group"]`);
}

/** Bring a section's card to the top of the viewport so its frame mounts. */
async function reach(page: Page, id: string) {
  // `block: "start"` rather than scrollIntoViewIfNeeded: a section card is
  // taller than the viewport, so "if needed" is satisfied by any sliver of it
  // showing while the preview at its top is still far below.
  await page
    .locator(`[data-home-section="${id}"]`)
    .evaluate((el) => el.scrollIntoView({ block: "start" }));
}

test("every section opens with a window on the real page, fetched when reached", async ({
  page,
}) => {
  await openEditor(page);

  // Nothing far down the page has been fetched yet. Each frame is a whole copy
  // of the home page and a save re-keys every one of them, so mounting all nine
  // on open would make this screen nine home pages, twice over, for someone on
  // a slow link. `loading` alone is only a hint, so the frame is mounted on
  // intersection.
  await expect(page.locator('[data-home-section="story"] iframe')).toHaveCount(
    0,
  );

  // Every window is the SAME document the page-wide preview shows. That is the
  // whole point of the redesign: a section preview is not a re-rendering of a
  // band, so it cannot disagree with the live page about anything.
  for (const id of [
    "promo",
    "hero",
    "featured",
    "ready",
    "occasion",
    "recipient",
    "craft",
    "story",
    // The rail speed has nothing of its own on the page, so its window is held
    // over the Featured band — a still picture of a speed would be worthless.
    "motion",
  ]) {
    await reach(page, id);
    await expect(
      page.locator(`[data-home-section="${id}"] iframe`),
    ).toHaveAttribute("src", /^\/\?adminPreview=/);
  }
});

test("a section's window cannot be scrolled out of its own section", async ({
  page,
}) => {
  await openEditor(page);
  await reach(page, "craft");
  const craft = windowOf(page, "craft");
  await expect(craft).toHaveCount(1);
  // The window exists from the first render; the film inside it does not, and
  // waiting for the WINDOW is not waiting for the film. `reach()` only asks the
  // browser to scroll — the IntersectionObserver then has to fire and React has
  // to re-render before there is an iframe to measure.
  await expect(page.locator('[data-home-section="craft"] iframe')).toHaveCount(
    1,
  );

  // THE PROMISE THIS FEATURE MAKES. The lock is structural rather than policed:
  // the window's only child is a rail exactly one band tall that CLIPS the
  // 5000px page inside it, so the browser's own scroll range is the band. There
  // is no scroll handler, which is why a fling cannot outrun it.
  const measured = await craft.evaluate((el) => {
    const before = el.scrollTop;
    el.scrollTop = 999999;
    const atBottom = el.scrollTop;
    el.scrollTop = -999999;
    const atTop = el.scrollTop;
    return {
      before,
      atBottom,
      atTop,
      range: el.scrollHeight - el.clientHeight,
      clientHeight: el.clientHeight,
      railHeight: (el.firstElementChild as HTMLElement).offsetHeight,
      frameHeight: (el.querySelector("iframe") as HTMLElement).offsetHeight,
    };
  });

  // Craft is 991 design pixels; at the design width the window reveals it plus
  // 48 above and 48 below, and shows 360 of that at a time.
  expect(measured.clientHeight).toBe(360);
  expect(measured.railHeight).toBe(991 + 48 + 48);
  expect(measured.range).toBe(measured.railHeight - 360);
  // Asking to go far past either end lands exactly on the end. Note the frame
  // inside is the WHOLE page — an unclipped scroller would have run to 5057.
  expect(measured.frameHeight).toBeGreaterThan(5000);
  expect(measured.atBottom).toBe(measured.range);
  expect(measured.atTop).toBe(0);

  // And it opens on the band itself, with the slack above out of sight, so the
  // first thing you see is the thing you clicked.
  expect(measured.before).toBe(48);
});

test("a section that fits whole does not scroll at all", async ({ page }) => {
  await openEditor(page);
  await reach(page, "promo");
  const promo = windowOf(page, "promo");
  // The promo strip is 32 design pixels. There is nothing to scroll through, so
  // the window is inert rather than jiggling by a few pixels — and it shows the
  // strip against the header beneath it, which is the only way to judge it.
  const range = await promo.evaluate((el) => el.scrollHeight - el.clientHeight);
  expect(range).toBe(0);
  await expect(promo).toHaveCSS("overflow-y", "hidden");
});

test("one width slider drives every window, and placement stays whole-pixel", async ({
  page,
}) => {
  await openEditor(page);
  await reach(page, "ready");
  const ready = windowOf(page, "ready");
  await expect(ready).toHaveCount(1);

  // There is ONE width control on this screen now. A section frame at a
  // different width would be at a different scale, and would no longer be
  // showing what the page-wide preview shows — so the sliders that could
  // disagree, and the button that reconciled them, are gone.
  await expect(
    page.locator('[data-home-section="ready"] input[type=range]'),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Match the main preview" }),
  ).toHaveCount(0);

  await page.locator("input[type=range]").first().fill("360");
  await expect(ready).toHaveCSS("width", "360px");

  // The room reserved for the frame does NOT change with the width — the stage
  // is a constant height now, so a drag cannot re-compute this ~26,000px page's
  // scroll thumb. And the box sits at a WHOLE-pixel offset at every setting:
  // centring by halving odd free space would put its 1px border and the band's
  // flush-left content on a half CSS pixel, and alternating between the two on
  // every step of a drag is a shimmer down the left edge.
  for (const w of ["440", "437", "430", "421", "377", "320"]) {
    await page.locator("input[type=range]").first().fill(w);
    const box = await ready.evaluate((el) => ({
      left: (el as HTMLElement).offsetLeft,
      top: (el as HTMLElement).offsetTop,
      stage: (el.parentElement as HTMLElement).offsetHeight,
    }));
    expect(Number.isInteger(box.left)).toBe(true);
    expect(Number.isInteger(box.top)).toBe(true);
    expect(box.stage).toBe(360);
  }
});

test("a switched-off section says so rather than showing the wrong band", async ({
  page,
}) => {
  await openEditor(page);
  const craft = page.locator('[data-home-section="craft"]');
  await reach(page, "craft");
  await expect(craft.locator("iframe")).toHaveCount(1);

  await craft.getByRole("button", { name: "Hide section" }).click();
  await expect(page.getByText("Home page updated").first()).toBeVisible();

  try {
    // A hidden band is not merely invisible: homeLayout closes the gap, so the
    // offset it used to hold now belongs to the NEXT band. Opening a window
    // there anyway would show a teammate the wrong section under this section's
    // name, so no window is opened at all.
    await reach(page, "craft");
    await expect(craft.locator("iframe")).toHaveCount(0);
    await expect(
      craft.getByText("Switch it on to preview it", { exact: false }),
    ).toBeVisible();
  } finally {
    await page
      .locator('[data-home-section="craft"]')
      .getByRole("button", { name: "Show section" })
      .click();
    await expect(page.getByText("Home page updated").first()).toBeVisible();
  }
});
