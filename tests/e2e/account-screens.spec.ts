/**
 * ROLE OF THIS FILE
 * Smoke cover for the 2026-07-28 ACCOUNT-PRIVACY-SUPPORT screens (personal
 * info, preferences, security, privacy policy, log out, delete, returns,
 * support chat, keepsake card). These are static design imports, so the
 * checks are deliberately shallow — the route renders, the wired links point
 * where the route table says, the visual-only controls flip, and the
 * deliberately-inert placeholders stay inert (no live inputs, no live
 * destructive button). Pixel fidelity is the pixel-diff net's job.
 */

import { test, expect } from "@playwright/test";

test("personal info renders as an inert placeholder (no live inputs)", async ({
  page,
}) => {
  await page.goto("/account/personal-info");
  await expect(
    page.getByText("Personal Information", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("olivia@email.com")).toBeVisible();
  // The hazard rule: mock fields are styled divs, never live inputs.
  await expect(page.locator("input")).toHaveCount(0);
});

test("preference toggles flip visually", async ({ page }) => {
  await page.goto("/account/preferences");
  const toggle = page.getByRole("switch", { name: "Email updates" });
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", "false");
});

test("security ships placeholder password fields, a live Cancel, an inert Save", async ({
  page,
}) => {
  await page.goto("/account/security");
  await expect(page.getByText("Two-step verification")).toBeVisible();
  // Password change is design-only (email-link auth decision): no live inputs.
  await expect(page.locator("input")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Save changes/ })).toHaveCount(
    0,
  );
});

test("privacy policy renders the five collapsed sections", async ({ page }) => {
  await page.goto("/account/privacy-policy");
  await expect(page.getByText("Information we collect")).toBeVisible();
  await expect(page.getByText("Contact us")).toBeVisible();
});

test("log out confirms, then lands on the homepage", async ({ page }) => {
  await page.goto("/account/logout");
  await expect(
    page.getByText("Are you sure you want to log out?"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("delete account stays inert: no live input, no live delete button", async ({
  page,
}) => {
  await page.goto("/account/delete");
  await expect(page.getByText("Before you delete, please note:")).toBeVisible();
  await expect(page.locator("input")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Delete account/ }),
  ).toHaveCount(0);
  // The acknowledge checkbox flips visually.
  const box = page.getByRole("checkbox", {
    name: "I understand the consequences",
  });
  await box.click();
  await expect(box).toHaveAttribute("aria-checked", "true");
});

test("returns renders the mock cases and Contact Support reaches the chat", async ({
  page,
}) => {
  await page.goto("/account/returns");
  await expect(page.getByText("Returns & After-Sales")).toBeVisible();
  await expect(page.getByText("Order #GR202507280642")).toBeVisible();
  await page.getByRole("link", { name: /Contact Support/ }).click();
  await expect(page).toHaveURL(/\/care\/chat$/);
});

test("care's Chat with us reaches the support chat mock", async ({ page }) => {
  await page.goto("/care");
  await page.getByRole("link", { name: "Chat with us" }).click();
  await expect(page).toHaveURL(/\/care\/chat$/);
  await expect(
    page.getByText("GoldRose Support", { exact: true }).first(),
  ).toBeVisible();
  // The composer is a styled div, not a live input (no chat backend).
  await expect(page.locator("input, textarea")).toHaveCount(0);
});

test("the keepsake card renders its mock milestone", async ({ page }) => {
  await page.goto("/account/keepsake");
  await expect(page.getByText("Share Your Keepsake Card")).toBeVisible();
  await expect(page.getByText("The 4th recipient")).toBeVisible();
});
