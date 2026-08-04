/**
 * ROLE OF THIS FILE
 * Customer accounts, local-mode behavior (owner request 2026-07-23). The
 * suite always runs the file adapter with Supabase env blanked, so what's
 * testable here is the graceful degradation: the Login tab reaches the one
 * login page, that page says sign-in is off when used, and the admin login
 * shows no passkey button. The real emailed sign-in link (/auth/confirm)
 * only exists against hosted Supabase and is exercised by hand there.
 *
 * AI-020 answered 2026-08-04: /account/signup is the ONLY login page, so
 * /account redirects there whenever nobody is signed in — which in local mode
 * is always, there being no auth server to be signed in to.
 */

import { test, expect } from "@playwright/test";

test.describe("customer account (local mode)", () => {
  test("the Login tab lands on the one login page", async ({ page }) => {
    await page.goto("/");
    // The 08-02 frames restore the Login/Me session swap: signed out the tab
    // reads "Login" (55ec9c1e / 71fa0136), signed in it reads "Me". The tab
    // still points at /account — /account is what redirects.
    await page.getByRole("link", { name: "Login", exact: true }).click();
    await expect(page).toHaveURL(/\/account\/signup$/);
    await expect(page.getByText("Continue with your email")).toBeVisible();
  });

  test("/account redirects to the login page when nobody is signed in", async ({
    page,
  }) => {
    await page.goto("/account");
    await expect(page).toHaveURL(/\/account\/signup$/);
    // Frame 1523:3315 — the only login surface left. Email + emailed code,
    // no password and no full-name field.
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByLabel("Verification code")).toBeVisible();
    await expect(page.getByRole("button", { name: "Send code" })).toBeVisible();
    // The owner dropped passkeys from the storefront; the design has no
    // Google/Apple buttons either.
    await expect(page.getByRole("button", { name: /passkey/i })).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /Continue with/ }),
    ).toHaveCount(0);
  });

  test("a dead sign-in link explains itself after the redirect", async ({
    page,
  }) => {
    // /auth/confirm sends expired/used links back to /account?auth_error=1;
    // the reason has to survive the hop to the login page.
    await page.goto("/account?auth_error=1");
    await expect(page).toHaveURL(/\/account\/signup\?auth_error=1$/);
    await expect(page.getByText(/expired or was already used/)).toBeVisible();
    // Typing the address that fixes it retracts the message.
    await page.getByLabel("Email address").fill("shopper@example.com");
    await expect(page.getByText(/expired or was already used/)).toHaveCount(0);
  });

  test("without Supabase, signing in says so instead of failing silently", async ({
    page,
  }) => {
    await page.goto("/account/signup");
    await page.getByLabel("Email address").fill("shopper@example.com");
    await page.getByRole("button", { name: "Send code" }).click();
    await expect(
      page.getByText(/isn’t switched on in this environment/),
    ).toBeVisible();
  });

  test("a business enquiry needs an email and then reports success", async ({
    page,
  }) => {
    await page.goto("/account/business");
    await page.getByRole("button", { name: /SUBMIT REQUEST/ }).click();
    await expect(page.getByText("Add your business email above")).toBeVisible();

    await page.getByLabel("Business email").fill("buyer@example.com");
    await page.getByRole("button", { name: "Corporate Gifts" }).click();
    await page.getByRole("button", { name: /SUBMIT REQUEST/ }).click();
    await expect(page.getByText("your request is with our team")).toBeVisible();
  });

  test("admin login hides the passkey option in local mode", async ({
    page,
  }) => {
    await page.goto("/admin/login");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sign in with a passkey" }),
    ).toHaveCount(0);
  });
});
