/**
 * ROLE OF THIS FILE
 * Customer accounts, local-mode behavior (owner request 2026-07-23). The
 * suite always runs the file adapter with Supabase env blanked, so what's
 * testable here is the graceful degradation: the Me tab reaches /account,
 * the imported sign-in frame renders and says sign-in is off when used, and
 * the admin login shows no passkey button. The real emailed sign-in link
 * (/auth/confirm) only exists against hosted Supabase and is exercised by
 * hand there.
 */

import { test, expect } from "@playwright/test";

test.describe("customer account (local mode)", () => {
  test("the Me tab links to /account", async ({ page }) => {
    await page.goto("/");
    // The 07-27 frames rename the account tab back to "Me" (art 921:251).
    await page.getByRole("link", { name: "Me", exact: true }).click();
    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByText("Sign in and continue shopping")).toBeVisible();
  });

  test("/account renders the imported sign-in frame", async ({ page }) => {
    await page.goto("/account");
    // Frame 74:53 modules.
    await expect(page.getByText("Welcome to")).toBeVisible();
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByRole("button", { name: "EMAIL ME A SIGN-IN LINK" })).toBeVisible();
    await expect(page.getByText("Benefits after sign-in")).toBeVisible();
    // /orders redirects to the ADMIN list, so the shopper-facing button points
    // at the customer tracking screen (Figma C-1) instead.
    await expect(page.getByRole("link", { name: /VIEW MY ORDER/ })).toHaveAttribute(
      "href",
      "/orders/track",
    );
    // The owner dropped passkeys from the storefront; the design has no
    // Google/Apple buttons either.
    await expect(page.getByRole("button", { name: /passkey/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Continue with/ })).toHaveCount(0);
  });

  test("without Supabase, signing in says so instead of failing silently", async ({ page }) => {
    await page.goto("/account");
    await page.getByLabel("Email address").fill("shopper@example.com");
    await page.getByRole("button", { name: "EMAIL ME A SIGN-IN LINK" }).click();
    await expect(page.getByText(/isn’t switched on in this environment/)).toBeVisible();
  });

  test("the account-type tabs switch between the two imported frames", async ({ page }) => {
    await page.goto("/account");
    await page.getByLabel("Business & Partnerships").click();
    await expect(page).toHaveURL(/\/account\/business$/);
    // Frame 74:55 modules.
    await expect(page.getByText("Better purchasing")).toBeVisible();
    await expect(page.getByText("Procurement & partnership services")).toBeVisible();
    await expect(page.getByRole("button", { name: /SUBMIT REQUEST/ })).toBeVisible();
    // ...and back.
    await page.getByLabel("Gift Shopping").click();
    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByText("Sign in and continue shopping")).toBeVisible();
  });

  test("a business enquiry needs an email and then reports success", async ({ page }) => {
    await page.goto("/account/business");
    await page.getByRole("button", { name: /SUBMIT REQUEST/ }).click();
    await expect(page.getByText("Add your business email above")).toBeVisible();

    await page.getByLabel("Business email").fill("buyer@example.com");
    await page.getByRole("button", { name: "Corporate Gifts" }).click();
    await page.getByRole("button", { name: /SUBMIT REQUEST/ }).click();
    await expect(page.getByText("your request is with our team")).toBeVisible();
  });

  test("admin login hides the passkey option in local mode", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sign in with a passkey" }),
    ).toHaveCount(0);
  });
});
