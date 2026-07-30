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
  // Scope to the main pane — the top bar shows the owner email too.
  const main = page.locator("#AppFrameMain");
  await expect(main.getByText("owner@goldrose.local")).toBeVisible();
  await expect(main.getByText("Approved")).toBeVisible();
  // Owner rule (2026-07-22): the earliest approved account wears the badge.
  await expect(main.getByText("Owner", { exact: true })).toBeVisible();
});

test("request-access sign-up is not offered in local mode", async ({
  page,
}) => {
  await page.goto("/admin/login");
  await expect(page.getByText("Request access")).toHaveCount(0);
});
