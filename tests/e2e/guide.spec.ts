/**
 * ROLE OF THIS FILE
 * The tester guide (owner request 2026-07-22): /admin/guide renders
 * docs/USER-GUIDE.md — both language sections — behind the normal admin
 * session (no forum nickname needed).
 */

import { test, expect } from "@playwright/test";
import { adminLogin, ADMIN_VIEWPORT } from "./helpers";

test.use({ viewport: ADMIN_VIEWPORT });

test("the guide page renders the markdown, EN and 中文", async ({ page }) => {
  await adminLogin(page);
  await page.getByRole("navigation").getByRole("link", { name: "Guide" }).click();
  await page.waitForURL(/\/admin\/guide$/);

  await expect(
    page.getByRole("heading", { name: "GoldRose Tester Guide" }),
  ).toBeVisible();
  await expect(page.getByText("Payments are simulated — no card is charged, ever.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "中文指南" })).toBeVisible();
  await expect(page.getByText(/付款是模拟的，绝不会真实扣款/)).toBeVisible();
});
