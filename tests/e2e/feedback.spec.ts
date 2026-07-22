/**
 * ROLE OF THIS FILE
 * Visitor ideas flow (owner request 2026-07-23): the concierge panel's idea
 * form submits to /api/feedback and shows up in the admin under Content →
 * Ideas, where it can be deleted. The closed chat bubble is part of the
 * pixel baselines — this only exercises the opened panel.
 */

import { test, expect } from "@playwright/test";
import { adminLogin, ADMIN_VIEWPORT } from "./helpers";

test.describe.configure({ mode: "serial" });

const IDEA = `Add rose engraving please! (e2e ${Date.now()})`;

test("a visitor shares an idea from the concierge panel", async ({ page }) => {
  await page.goto("/shop", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Ask our gifting concierge." }).click();

  const panel = page.getByRole("dialog", { name: "Gifting concierge chat" });
  await expect(panel).toBeVisible();
  await panel.getByLabel("Your idea").fill(IDEA);
  await panel.getByLabel("Email (optional)").fill("idea-fan@example.com");
  await panel.getByRole("button", { name: "Send" }).click();
  await expect(panel.getByText("Thank you!")).toBeVisible();
});

test("the idea appears in Content → Ideas and can be deleted", async ({ page }) => {
  await page.setViewportSize(ADMIN_VIEWPORT);
  await adminLogin(page);
  await page.goto("/admin/content/ideas");

  await expect(page.getByText(IDEA)).toBeVisible();
  await expect(page.getByText(/idea-fan@example\.com · \/shop/).first()).toBeVisible();

  // Clean up: delete our test idea.
  const card = page.locator(".Polaris-Card, [class*=Card]").filter({ hasText: IDEA }).first();
  await card.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText(IDEA)).toHaveCount(0);
});
