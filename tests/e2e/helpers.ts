/**
 * ROLE OF THIS FILE
 * Shared e2e helpers: the local-adapter admin login used by every admin
 * suite (dev password comes from playwright.config.ts webServer env).
 */

import { type Page, expect } from "@playwright/test";

export const DEV_PASSWORD = "stage2-test-password";
export const ADMIN_VIEWPORT = { width: 1280, height: 900 };

export async function adminLogin(page: Page): Promise<void> {
  await page.goto("/admin");
  if (/\/admin\/login/.test(page.url()) === false) {
    await page.waitForURL(/\/admin(\/login)?/);
  }
  if (/\/admin\/login/.test(page.url())) {
    await page.getByLabel(/Email|邮箱/).fill("owner@goldrose.local");
    await page.getByLabel(/Password|密码/).fill(DEV_PASSWORD);
    await page.getByRole("button", { name: /Log in|登录/ }).click();
    await page.waitForURL(/\/admin$/);
  }
  await expect(page.getByRole("navigation")).toBeVisible();
}

/**
 * Wait until the viewport-fixed chrome has stopped moving.
 *
 * The chat bar and the bottom nav each scale themselves from JS after
 * hydration (NoCalcScale), and a full-page screenshot anchors fixed elements
 * to the page's FULL height — which the async SiteLegalFooter decides. Shoot
 * mid-settle and that chrome lands tens of pixels off, by a different amount
 * each run. Polling until two consecutive samples agree removes the race.
 *
 * @param page - The page about to be screenshotted.
 */
export async function settleFixedChrome(page: Page): Promise<void> {
  await page.locator("footer").first().waitFor({ state: "visible" });
  await page.waitForFunction(
    () => {
      const tops = [".figv-chatstage", ".figv-navstage"]
        .map((sel) => document.querySelector(sel))
        .filter((el): el is Element => el !== null)
        .map((el) => Math.round(el.getBoundingClientRect().top))
        .join(",");
      const store = window as unknown as { __fixedChromeTops?: string };
      const settled = store.__fixedChromeTops === tops;
      store.__fixedChromeTops = tops;
      return settled;
    },
    undefined,
    { polling: 120 },
  );
}
