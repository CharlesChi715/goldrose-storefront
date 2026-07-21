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
