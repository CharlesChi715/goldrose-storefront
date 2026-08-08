/**
 * ROLE OF THIS FILE
 * Smoke cover for the screens imported from the Figma B/C frames: bag (B-1),
 * business partnerships + wholesale application (B-3/B-4), guest order
 * tracking (C-1) and the menu overlay (2345:271). Most of these pages are
 * static design imports, so the checks are deliberately shallow — they prove
 * the route renders, the wired links point where the route table says, and
 * the placeholder controls stay inert. Pixel fidelity is the pixel-diff net's
 * job. /bag is the exception since 2026-08-07: it reads the real cart, so its
 * two states and its stepper are checked against real catalog values.
 */

import { test, expect } from "@playwright/test";

// The 2026-08-07 frames give /bag an empty state (2976:375) beside the one
// with items (1523:3059), and the screen picks between them from the real
// localStorage cart — so both states need cover, and the cart has to be
// seeded to see the second. Same key and seeded variant as checkout.spec.ts.
const CART_KEY = "goldrose-cart-v2";
const SIGNATURE_VARIANT = "0a2b1a10-4b7e-4d7a-9d24-000000000101";

test("an empty bag shows the empty frame, which leads to /shop", async ({
  page,
}) => {
  await page.goto("/bag");
  await expect(page.getByText("Shopping Bag", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Something beautiful belongs here."),
  ).toBeVisible();
  await page.getByRole("link", { name: /EXPLORE THE COLLECTION/i }).click();
  await expect(page).toHaveURL(/\/shop$/);
});

test("a filled bag lists the real line and its CTA reaches /checkout", async ({
  page,
}) => {
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [
      CART_KEY,
      JSON.stringify([{ variantId: SIGNATURE_VARIANT, quantity: 1 }]),
    ] as const,
  );

  await page.goto("/bag");
  // The line is resolved against the DB catalog, not drawn from the frame.
  await expect(page.getByText("Signature Rose").first()).toBeVisible();
  await expect(page.getByText("$49.99").first()).toBeVisible();
  await expect(page.getByText("Something beautiful belongs here.")).toHaveCount(
    0,
  );

  await page.getByRole("link", { name: /SECURE CHECKOUT/i }).click();
  await expect(page).toHaveURL(/\/checkout$/);
});

test("the bag's stepper and Remove drive the real cart", async ({ page }) => {
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [
      CART_KEY,
      JSON.stringify([{ variantId: SIGNATURE_VARIANT, quantity: 1 }]),
    ] as const,
  );

  await page.goto("/bag");
  await page.getByRole("button", { name: /^Add one / }).click();
  // One line at $49.99 × 2 — the card shows the LINE total, not the unit price.
  await expect(page.getByText("$99.98").first()).toBeVisible();

  await page.getByRole("button", { name: "Remove" }).click();
  await expect(
    page.getByText("Something beautiful belongs here."),
  ).toBeVisible();
});

test("business partnerships links to the wholesale application", async ({
  page,
}) => {
  await page.goto("/business/partnerships");
  await page.getByRole("link", { name: /APPLY FOR WHOLESALE/i }).click();
  await expect(page).toHaveURL(/\/business\/wholesale$/);
});

test("the wholesale form takes input but does not submit", async ({ page }) => {
  await page.goto("/business/wholesale");
  const first = page.locator("input.b4-field").first();
  await first.fill("Rose & Co");
  await expect(first).toHaveValue("Rose & Co");
  // No backend yet: the submit control is a placeholder, not a <button>.
  await expect(page.getByRole("button", { name: /SUBMIT/i })).toHaveCount(0);
});

test("guest order tracking renders the C-1 timeline", async ({ page }) => {
  await page.goto("/orders/track");
  await expect(
    page.getByText("Track Your Order", { exact: true }),
  ).toBeVisible();
  // Nothing here is a real order yet — the frame ships placeholder tracking data.
  await expect(page.getByText("#VL20250821")).toBeVisible();
});

test("the header menu opens the sheet, navigates, and closes on Escape", async ({
  page,
}) => {
  await page.goto("/");
  const menu = page.getByRole("button", { name: "Open menu" });
  await menu.click();
  const sheet = page.getByRole("dialog", { name: "Menu" });
  await expect(sheet).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();

  // Wired rows navigate and close the sheet behind them.
  await menu.click();
  await sheet.getByRole("link", { name: "Shop", exact: true }).click();
  await expect(page).toHaveURL(/\/shop$/);
  await expect(page.getByRole("dialog", { name: "Menu" })).toHaveCount(0);
});

/*
 * 2345:271 · the menu overlay redesigned in the 2026-08-04 sync: four
 * accordion groups instead of seven flat rows. Contact and Legal & Policies
 * are drawn expanded, so they start expanded and toggle.
 */
test("the menu's accordion groups collapse and expand", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const sheet = page.getByRole("dialog", { name: "Menu" });

  const legal = sheet.getByRole("button", { name: "Legal & Policies" });
  await expect(legal).toHaveAttribute("aria-expanded", "true");
  await expect(
    sheet.getByRole("link", { name: "Privacy Policy" }),
  ).toBeVisible();

  await legal.click();
  await expect(legal).toHaveAttribute("aria-expanded", "false");
  await expect(sheet.getByRole("link", { name: "Privacy Policy" })).toHaveCount(
    0,
  );

  // Collapsing one group leaves the other alone.
  await expect(
    sheet.getByRole("button", { name: "Contact", exact: true }),
  ).toHaveAttribute("aria-expanded", "true");
  await expect(sheet.getByRole("link", { name: "Our Craft" })).toBeVisible();
});

test("every menu policy row reaches its policy route", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const sheet = page.getByRole("dialog", { name: "Menu" });
  // Seven policy rows plus Blog / Our Story / Our Craft under Contact.
  for (const [label, href] of [
    ["Blog", "/blog"],
    ["Our Story", "/story"],
    ["Our Craft", "/craft"],
    [
      "Returns, Refunds & Cancellations",
      "/policies/returns-refunds-cancellations",
    ],
    ["Shipping & Delivery", "/policies/shipping-delivery"],
    ["Limited Product Warranty & Care", "/policies/warranty-care"],
    ["Terms of Service", "/policies/terms-of-service"],
    ["Privacy Policy", "/policies/privacy"],
    ["Email & SMS Terms", "/policies/email-sms-terms"],
    ["Contact & Legal Notice", "/policies/contact-legal"],
  ] as const) {
    await expect(
      sheet.getByRole("link", { name: label, exact: true }),
      `menu row ${label}`,
    ).toHaveAttribute("href", href);
  }
});

test("the reminders Edit control opens the edit sheet; Cancel closes it", async ({
  page,
}) => {
  await page.goto("/account/reminders");
  // The sheet is an info-storage modal with no navigation (owner-confirmed) —
  // Edit opens it, Cancel/Escape discards and closes, the URL never changes.
  await page
    .getByRole("button", { name: /^Edit / })
    .first()
    .click();
  const sheet = page.getByRole("dialog", { name: "Edit reminder" });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByText("Anniversary with Emma")).toBeVisible();

  await sheet.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("dialog", { name: "Edit reminder" })).toHaveCount(
    0,
  );
  await expect(page).toHaveURL(/\/account\/reminders$/);

  // Add reminder opens the same sheet with the "Add" title; Escape closes it.
  await page.getByRole("button", { name: /Add reminder/ }).click();
  await expect(
    page.getByRole("dialog", { name: "Add reminder" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Add reminder" })).toHaveCount(
    0,
  );
});

test("the reminder sheet's date dropdowns select and close per the 08-02 design", async ({
  page,
}) => {
  await page.goto("/account/reminders");
  await page
    .getByRole("button", { name: /^Edit / })
    .first()
    .click();
  const sheet = page.getByRole("dialog", { name: "Edit reminder" });
  await expect(sheet).toBeVisible();

  // The three DATE fields open their dropdown menus (2052:202/207/212 →
  // 2053:183/207/193); picking an option updates the Playfair value.
  const yearField = sheet.getByRole("button", { name: "Year" });
  await expect(yearField).toContainText("2025");
  await yearField.click();
  const yearMenu = sheet.getByRole("listbox", { name: "Year options" });
  await expect(yearMenu).toBeVisible();
  await yearMenu.getByRole("option", { name: "2026" }).click();
  await expect(yearField).toContainText("2026");
  await expect(sheet.getByRole("listbox")).toHaveCount(0);

  // Only one menu opens at a time; Escape closes the menu first, the sheet
  // second.
  await sheet.getByRole("button", { name: "Month" }).click();
  await sheet.getByRole("button", { name: "Day" }).click();
  await expect(sheet.getByRole("listbox")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(sheet.getByRole("listbox")).toHaveCount(0);
  await expect(sheet).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Edit reminder" })).toHaveCount(
    0,
  );

  // Reopening resets to the frame's defaults (info-storage modal: nothing
  // persists).
  await page
    .getByRole("button", { name: /^Edit / })
    .first()
    .click();
  await expect(
    page
      .getByRole("dialog", { name: "Edit reminder" })
      .getByRole("button", { name: "Year" }),
  ).toContainText("2025");
});

test("the date menus are 滚轮 wheels: spinning sets the value and stays open", async ({
  page,
}) => {
  // The design team asked on 2053:207 whether dev could build a scroll-wheel
  // dropdown; Charles answered "我试试" (2026-08-05) and this is it. The
  // contract: the row resting under the fixed centre pill is the value.
  await page.goto("/account/reminders");
  await page
    .getByRole("button", { name: /^Edit / })
    .first()
    .click();
  const sheet = page.getByRole("dialog", { name: "Edit reminder" });
  const monthField = sheet.getByRole("button", { name: "Month" });
  await monthField.click();
  const wheel = sheet.getByRole("listbox", { name: "Month options" });

  // Opening centres the current value: Aug is index 7 at the 29px month pitch.
  await expect(wheel).toBeVisible();
  expect(await wheel.evaluate((el) => el.scrollTop)).toBe(7 * 29);

  // Spinning two rows down settles on Oct — and the wheel stays open, unlike a
  // tap, which is the decisive gesture that closes it.
  await wheel.evaluate((el) => {
    el.scrollTop += 29 * 2;
    el.dispatchEvent(new Event("scroll", { bubbles: true }));
  });
  await expect(monthField).toContainText("Oct");
  await expect(wheel).toBeVisible();

  // Days and years are generated in code, not drawn — the other half of the
  // team's question. 31 days, and the wheel can reach the last one.
  await sheet.getByRole("button", { name: "Day" }).click();
  const days = sheet.getByRole("listbox", { name: "Day options" });
  await expect(days.getByRole("option")).toHaveCount(31);

  // The wheel has depth: rows fade and shrink away from the centre band, so
  // it reads as a drum rather than a flat list. Painted per frame in JS.
  const depth = await days.evaluate((el) =>
    Array.from(el.querySelectorAll("button")).map((b) => {
      const face = b.firstElementChild as HTMLElement;
      return Number(face.style.opacity);
    }),
  );
  const centre = depth.indexOf(1); // the row under the pill (day 25)
  expect(centre).toBeGreaterThan(0);
  expect(depth[centre - 1]).toBeLessThan(1);
  expect(depth[centre - 2]).toBeLessThan(depth[centre - 1]);
  expect(depth[centre + 1]).toBeCloseTo(depth[centre - 1], 5);
});

test("the reminders notification toggles start Email on, SMS off", async ({
  page,
}) => {
  await page.goto("/account/reminders");
  // Owner's Figma note on 1523:3473: the Email switch starts on, the SMS
  // switch below it starts off (toggle-knob-open / toggle-knob-close).
  await expect(
    page.getByRole("switch", { name: "Email reminders" }),
  ).toHaveAttribute("aria-checked", "true");
  await expect(
    page.getByRole("switch", { name: "SMS reminders" }),
  ).toHaveAttribute("aria-checked", "false");
});

test("the return sheet's Confirm Return lands on the request-submitted page", async ({
  page,
}) => {
  await page.goto("/orders/track?return=1");
  // Prototype wiring 1523:1430 → the request-submitted route. Since the
  // 08-02 sync that route is the real AFTER-SALES confirmation screen
  // (2030:185) — the AI-007 coming-soon scaffold it replaced is retired.
  await page.getByRole("link", { name: "Confirm Return" }).click();
  await expect(page).toHaveURL(/\/account\/returns\/request-submitted$/);
  await expect(
    page.getByText("Request Submitted", { exact: true }),
  ).toBeVisible();
});

test("the shop grid shows one card per real product and nothing else", async ({
  page,
}) => {
  await page.goto("/shop");

  // The seed catalog is smaller than the frame's eight slots. The grid used to
  // cycle it to fill them all, drawing the same products several times over
  // five identical "pages"; it now draws each product exactly once.
  const links = await page.$$eval(".gr-card-zoom", (els) =>
    els.map((el) => el.getAttribute("href")),
  );
  expect(links.length).toBeGreaterThan(0);
  expect(new Set(links).size).toBe(links.length);
  for (const href of links) expect(href).toMatch(/^\/products\/[a-z0-9-]+$/);

  // The count above the grid is the same list, not the frame's flat "120".
  await expect(
    page.getByText(`${links.length} GIFTS`, { exact: true }),
  ).toBeVisible();

  // One page of results draws no pager at all — no page numbers, no arrow.
  await expect(page.getByRole("link", { name: /^Page \d+$/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Next page" })).toHaveCount(0);

  // An out-of-range page falls back to the canonical listing rather than
  // rendering an empty grid at full canvas height.
  await page.goto("/shop?page=5");
  expect(await page.$$eval(".gr-card-zoom", (els) => els.length)).toBe(
    links.length,
  );
});

/*
 * The PDP hero is an auto-playing, swipeable carousel over the product's own
 * photos (owner, 2026-08-06), on the same shared component as the homepage
 * hero. The suite pins reduced motion so pixel baselines stay parked on slide
 * 1 — auto-play only exists without it, so this block opts out.
 */
test.describe("the PDP hero carousel", () => {
  test.use({ contextOptions: { reducedMotion: "no-preference" } });

  const dots = (page: import("@playwright/test").Page) =>
    page.getByRole("button", { name: /^Show .+ photo \d+$/ });
  const activeDot = (page: import("@playwright/test").Page) =>
    dots(page).evaluateAll((els) =>
      els.findIndex((el) => el.getAttribute("aria-current") === "true"),
    );

  test("auto-plays through the product's photos", async ({ page }) => {
    await page.goto("/products/premium-gold-rose-gift-bundle");
    // One dot per catalog photo — the frame's fixed four are gone.
    await expect(dots(page).first()).toBeVisible();
    expect(await dots(page).count()).toBeGreaterThan(1);
    expect(await activeDot(page)).toBe(0);
    // Advances on its own, without touching anything.
    await expect.poll(() => activeDot(page), { timeout: 8000 }).not.toBe(0);
  });

  test("a drag swipes the track without opening the photo viewer", async ({
    page,
  }) => {
    await page.goto("/products/premium-gold-rose-gift-bundle");
    await page.mouse.move(300, 220);
    await page.mouse.down();
    for (const x of [260, 200, 150, 120]) await page.mouse.move(x, 220);
    await page.mouse.up();
    // The drag must not also count as a tap on the slide.
    await expect(
      page.getByRole("dialog", { name: "Product photos" }),
    ).toHaveCount(0);
  });

  test("a tap on the hero still opens the photo viewer", async ({ page }) => {
    await page.goto("/products/premium-gold-rose-gift-bundle");
    await page.mouse.click(215, 220);
    await expect(
      page.getByRole("dialog", { name: "Product photos" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("dialog", { name: "Product photos" }),
    ).toHaveCount(0);
  });

  /*
   * Until 2026-08-07 the edge damping was applied to the value the release
   * tested, so a swipe on the first or last slide needed three times the
   * travel and normally sprang back. Auto-play parks a rail on any slide, so
   * that read as "the carousel isn't swipeable". The wrap must now commit on
   * an ordinary swipe from either end.
   */
  test("a short swipe still advances at the wrap-around edges", async ({
    page,
  }) => {
    await page.goto("/products/premium-gold-rose-gift-bundle");
    const last = (await dots(page).count()) - 1;
    await dots(page).nth(last).click();
    await expect.poll(() => activeDot(page)).toBe(last);

    // 60px — comfortably over the 40px threshold, well under the 120px the
    // damped comparison used to demand.
    await page.mouse.move(300, 220);
    await page.mouse.down();
    for (const x of [280, 240]) await page.mouse.move(x, 220);
    await page.mouse.up();
    await expect.poll(() => activeDot(page)).toBe(0);

    // ...and backwards off the first slide, which wraps to the last.
    await page.mouse.move(150, 220);
    await page.mouse.down();
    for (const x of [170, 210]) await page.mouse.move(x, 220);
    await page.mouse.up();
    await expect.poll(() => activeDot(page)).toBe(last);
  });
});

test("a shop search that matches nothing shows no cards, not the whole catalog", async ({
  page,
}) => {
  await page.goto("/shop?q=zzzznotaproduct");
  expect(await page.$$eval(".gr-card-zoom", (els) => els.length)).toBe(0);
  await expect(page.getByText("0 GIFTS", { exact: true })).toBeVisible();
  await expect(page.getByText(/No gifts match/)).toBeVisible();
});

// The Gift Shopping ⇄ Business & Partnerships tabs lived on the second login
// screen, deleted 2026-08-04 when /account/signup became the only login page
// (AI-020). /account/business still exists and is covered by account.spec.ts;
// it has no signed-out entry point until the design team restores one — the
// 08-04 MENU redesign dropped the drawer's FOR BUSINESS row (DQ raised).

test("the homepage gift-path cards reach the shop and the on-page sections", async ({
  page,
}) => {
  await page.goto("/");
  // #craft stays as an anchor target. #personalize is gone since 2026-08-04:
  // frame 2380:370 deleted modules A-4/A-8, which carried that anchor.
  await expect(page.locator("#craft")).toHaveCount(1);
  await expect(page.locator("#personalize")).toHaveCount(0);
  // Two /craft links: A-9's EXPLORE OUR CRAFT button and the footer link.
  await expect(page.locator('a[href="/craft"]')).toHaveCount(2);
  // Two /story links: A-11's READ OUR STORY plus the footer link. A-6's Read
  // Customer Stories button is a third.
  await expect(page.locator('a[href="/story"]')).toHaveCount(3);
  await expect(
    page.getByRole("link", { name: /Valentine/i }).first(),
  ).toBeVisible();
});
