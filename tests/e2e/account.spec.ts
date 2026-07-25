/**
 * ROLE OF THIS FILE
 * Customer accounts, local-mode behavior (owner request 2026-07-23). The
 * suite always runs the file adapter with Supabase env blanked, so what's
 * testable here is the graceful degradation: the Login tab reaches /account,
 * the imported sign-in frame renders and says sign-in is off when used, and
 * the admin login shows no passkey button. The real emailed-code flow only
 * exists against hosted Supabase and is exercised by hand there.
 */

import { test, expect } from "@playwright/test";

test.describe("customer account (local mode)", () => {
  test("the Login tab links to /account", async ({ page }) => {
    await page.goto("/");
    // The redesign nav labels the account tab "Login" (art node 763:119).
    await page.getByRole("link", { name: "Login", exact: true }).click();
    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByText("Sign in and continue shopping")).toBeVisible();
  });

  test("/account renders the imported sign-in frame", async ({ page }) => {
    await page.goto("/account");
    // Frame 74:53 modules.
    await expect(page.getByText("Welcome to")).toBeVisible();
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByRole("button", { name: "SEND VERIFICATION CODE" })).toBeVisible();
    await expect(page.getByText("Benefits after sign-in")).toBeVisible();
    await expect(page.getByRole("link", { name: /VIEW MY ORDER/ })).toHaveAttribute(
      "href",
      "/orders",
    );
    // The owner dropped passkeys from the storefront; the design has no
    // Google/Apple buttons either.
    await expect(page.getByRole("button", { name: /passkey/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Continue with/ })).toHaveCount(0);
  });

  test("without Supabase, signing in says so instead of failing silently", async ({ page }) => {
    await page.goto("/account");
    await page.getByLabel("Email address").fill("shopper@example.com");
    await page.getByRole("button", { name: "SEND VERIFICATION CODE" }).click();
    await expect(page.getByText(/isn’t switched on in this environment/)).toBeVisible();
  });

  test("admin login hides the passkey option in local mode", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sign in with a passkey" }),
    ).toHaveCount(0);
  });
});
