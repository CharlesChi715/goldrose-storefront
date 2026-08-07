/**
 * ROLE OF THIS FILE
 * Smoke cover for the 2026-07-28 ACCOUNT-PRIVACY-SUPPORT screens (personal
 * info, preferences, security, privacy policy, log out, delete, returns,
 * support chat, keepsake card). Most are still static design imports, so the
 * checks are deliberately shallow — the route renders, the wired links point
 * where the route table says, the visual-only controls flip, and the
 * deliberately-inert placeholders stay inert (no live inputs, no live
 * destructive button). Pixel fidelity is the pixel-diff net's job.
 *
 * The suite always runs the file adapter with Supabase blanked, so the one
 * screen that stopped being a placeholder — personal info, live 2026-08-06 —
 * can only be checked for its signed-out behaviour here. The form itself
 * needs a real session and is exercised by hand against hosted Supabase, the
 * same footing as the rest of customer auth (see account.spec.ts).
 */

import { test, expect } from "@playwright/test";

test("personal info is signed-in only: no session, no form", async ({
  page,
}) => {
  await page.goto("/account/personal-info");
  // /account/signup is the one login page (AI-020), and this page holds the
  // visitor's real name and email — it must never render to a stranger.
  await expect(page).toHaveURL(/\/account\/signup$/);
  await expect(page.getByText("Continue with your email")).toBeVisible();
  // The mock it replaced is gone for good: no "Olivia Carter" anywhere.
  await expect(page.getByText("olivia@email.com")).toHaveCount(0);
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

test("the returns flow walks start → reason → photos → submitted (08-02 redesign)", async ({
  page,
}) => {
  await page.goto("/account/returns");
  await expect(page.getByText("Returns & After-Sales")).toBeVisible();
  // Start tab: eligible order → reason sheet → Continue carries the slug.
  await page.getByRole("button", { name: "Start Return" }).last().click();
  const sheet = page.getByRole("dialog");
  await expect(sheet).toBeVisible();
  await sheet.getByRole("radio", { name: "Received the wrong item" }).click();
  await sheet.getByRole("link", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/account\/returns\/add-photos\?reason=/);
  await expect(page.getByText("Received the wrong item")).toBeVisible();
  // Submit lands on the real request-submitted page (ex-AI-007 scaffold).
  await page.getByRole("link", { name: "Submit Request" }).click();
  await expect(page).toHaveURL(/\/account\/returns\/request-submitted$/);
  await expect(
    page.getByText("Request Submitted", { exact: true }),
  ).toBeVisible();
  // Track Status deep-links back into the status tab.
  await page.getByRole("link", { name: "Track Status" }).click();
  await expect(page).toHaveURL(/\/account\/returns\?tab=status$/);
  await expect(page.getByText("Your Requests")).toBeVisible();
});

test("the returns status cards open their per-request pages", async ({
  page,
}) => {
  await page.goto("/account/returns?tab=status");
  await page.getByRole("link", { name: /RR-GR202506150311/ }).click();
  await expect(page).toHaveURL(/\/account\/returns\/approved$/);
  await expect(page.getByText("Return Approved").first()).toBeVisible();
  // Not-approved page carries the Contact Support hand-off to the chat.
  await page.goto("/account/returns/request-not-approved");
  await page.getByRole("link", { name: /Contact Support/ }).click();
  await expect(page).toHaveURL(/\/care\/chat$/);
});

test("care's Chat with us reaches the support chat mock", async ({ page }) => {
  await page.goto("/care");
  await page.getByRole("link", { name: "Chat with us" }).click();
  await expect(page).toHaveURL(/\/care\/chat$/);
  await expect(
    page.getByText("ELDREVE Support", { exact: true }).first(),
  ).toBeVisible();
  // The composer is a styled div, not a live input (no chat backend).
  await expect(page.locator("input, textarea")).toHaveCount(0);
});

test("the keepsake card renders its mock milestone", async ({ page }) => {
  await page.goto("/account/keepsake");
  await expect(page.getByText("Share Your Keepsake Card")).toBeVisible();
  await expect(page.getByText("The 4th recipient")).toBeVisible();
});

/* ---------- /account/addresses — ADDRESS-BOOK 2118:247 (08-07) ---------- */

test("the address book renders its three mock addresses", async ({ page }) => {
  await page.goto("/account/addresses");
  await expect(
    page.getByRole("heading", { name: "Address Book" }),
  ).toBeVisible();
  await expect(page.getByText("Jessica Chen")).toBeVisible();
  await expect(page.getByText("Emma Wilson")).toBeVisible();
  await expect(page.getByText("Sophia Bennett")).toBeVisible();
  // Only the first card carries the Default badge.
  await expect(page.getByText("Default", { exact: true })).toHaveCount(1);
  // The 08-07 frame drops this screen's bottom-nav band.
  await expect(page.getByRole("link", { name: "Shop" })).toHaveCount(0);
});

test("Add New Address opens the sheet, Escape discards it", async ({
  page,
}) => {
  await page.goto("/account/addresses");
  await page.getByRole("button", { name: "Add New Address" }).click();
  const sheet = page.getByRole("dialog", { name: "Add New Address" });
  await expect(sheet).toBeVisible();
  // Typed input is discarded on close — nothing persists (no backend).
  await page.getByLabel("Full name").fill("Ada Lovelace");
  await page.keyboard.press("Escape");
  await expect(sheet).toHaveCount(0);
  await page.getByRole("button", { name: "Add New Address" }).click();
  await expect(page.getByLabel("Full name")).toHaveValue("");
});

test("a card's Edit opens the same sheet under the edit title", async ({
  page,
}) => {
  await page.goto("/account/addresses");
  await page
    .getByRole("button", { name: "Edit address for Emma Wilson" })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Edit Your Address" }),
  ).toBeVisible();
  // One sheet serves both frames, so the same fields are present.
  await expect(page.getByLabel("Street address")).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
