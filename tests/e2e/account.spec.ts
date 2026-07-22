/**
 * ROLE OF THIS FILE
 * Customer accounts, local-mode behavior (owner request 2026-07-23). The
 * suite always runs the file adapter with Supabase env blanked, so what's
 * testable here is the graceful degradation: the Me tab reaches /account,
 * the page explains sign-in isn't available, and the admin login shows no
 * passkey button. The real Google/Apple/passkey flows only exist against
 * hosted Supabase (dashboard-configured) and are exercised by hand there.
 */

import { test, expect } from "@playwright/test";

test.describe("customer account (local mode)", () => {
  test("the Me tab links to /account", async ({ page }) => {
    await page.goto("/");
    // exact: "Me" would otherwise substring-match the "Home" tab too.
    await page.getByRole("link", { name: "Me", exact: true }).click();
    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByRole("heading", { name: "My account" })).toBeVisible();
  });

  test("without Supabase, /account explains sign-in is unavailable", async ({ page }) => {
    await page.goto("/account");
    await expect(
      page.getByText("Customer sign-in isn't switched on in this environment yet"),
    ).toBeVisible();
    // No sign-in buttons in local mode — there is no auth server.
    await expect(page.getByRole("button", { name: "Continue with Google" })).toHaveCount(0);
  });

  test("admin login hides the passkey option in local mode", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sign in with a passkey" }),
    ).toHaveCount(0);
  });
});
