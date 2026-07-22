/**
 * ROLE OF THIS FILE
 * Settings → Team (owner request 2026-07-22): the accounts/approval screen
 * renders for a real admin. Sign-up ("Request access") is hosted-only, so
 * in this local-adapter suite the login page must NOT offer it.
 */

import { test, expect } from "@playwright/test";
import { adminLogin, ADMIN_VIEWPORT } from "./helpers";

test.use({ viewport: ADMIN_VIEWPORT });

test("team page lists the owner as approved", async ({ page }) => {
  await adminLogin(page);
  await page.goto("/admin/settings/team");
  await expect(page.getByRole("heading", { name: "Team" })).toBeVisible();
  await expect(page.getByText("owner@goldrose.local")).toBeVisible();
  await expect(page.getByText("Approved")).toBeVisible();
});

test("request-access sign-up is not offered in local mode", async ({ page }) => {
  await page.goto("/admin/login");
  await expect(page.getByText("Request access")).toHaveCount(0);
});
