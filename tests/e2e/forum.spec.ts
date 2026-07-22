/**
 * ROLE OF THIS FILE
 * Testing-phase forum (owner request 2026-07-22): nickname-gated access,
 * starting a discussion, replying, and the thread list. Runs with
 * ADMIN_DEV_PASSWORD set (playwright.config.ts), so the admin itself still
 * needs the dev login and nickname-only submits are rejected — the
 * nickname-only path is live only in open-access mode.
 */

import { test, expect, type Page } from "@playwright/test";
import { ADMIN_VIEWPORT, DEV_PASSWORD } from "./helpers";

test.use({ viewport: ADMIN_VIEWPORT });
test.describe.configure({ mode: "serial" });

const TITLE = `Shipping box ideas (e2e ${Date.now()})`;
const OPENING = "Should we use magnetic gift boxes?";
const REPLY = "Yes — magnetic lids feel premium.";
const EDITED = "Edit: brushed gold magnetic lids, even better.";

async function logIn(page: Page, nickname?: string) {
  await page.goto("/admin/login");
  if (nickname) {
    await page.getByLabel(/Nickname|昵称/).fill(nickname);
  }
  await page.getByLabel(/^Email$|邮箱/).fill("owner@goldrose.local");
  await page.getByLabel(/Password|密码/).fill(DEV_PASSWORD);
  await page.getByRole("button", { name: /Log in|登录/ }).click();
  await page.waitForURL(/\/admin$/);
}

test("a logged-in account without a nickname posts under its email name", async ({
  page,
}) => {
  await logIn(page);
  await page.goto("/admin/forum");
  // Everyone-logs-in mode (owner decision): no forced trip back to login —
  // the account's email name is the default forum identity.
  await expect(page.getByText("Posting as: owner")).toBeVisible();
});

test("start a discussion, reply, see it in the list, then delete it", async ({ page }) => {
  await logIn(page, "Charlie");

  await page.getByRole("navigation").getByRole("link", { name: "Forum" }).click();
  await page.waitForURL(/\/admin\/forum$/);
  await expect(page.getByText("Posting as: Charlie")).toBeVisible();

  // The seeded announcement threads greet testers.
  await expect(page.getByText("📢 Welcome to the GoldRose testing forum")).toBeVisible();
  await expect(page.getByText("📢 What to test — and what to expect")).toBeVisible();

  await page.getByLabel("Title").fill(TITLE);
  await page.getByLabel("Message").fill(OPENING);
  await page.getByRole("button", { name: "Post", exact: true }).click();
  await page.waitForURL(/\/admin\/forum\/[0-9a-f-]+$/);
  await expect(page.getByText(OPENING)).toBeVisible();

  await page.getByLabel("Reply").fill(REPLY);
  await page.getByRole("button", { name: "Reply", exact: true }).click();
  // The box clears after a successful reply; only then is the posted copy
  // unambiguous (while typing, the textarea itself matches the text too).
  await expect(page.getByLabel("Reply")).toHaveValue("");
  await expect(page.getByText(REPLY)).toBeVisible();

  // Edit your own post: both posts are Charlie's, take the reply (last).
  await page.getByRole("button", { name: "Edit", exact: true }).last().click();
  await page.getByLabel("Edit", { exact: true }).fill(EDITED);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText(EDITED)).toBeVisible();
  await expect(page.getByText(/Charlie · .+ · edited/).first()).toBeVisible();

  await page.goto("/admin/forum");
  await expect(page.getByText(TITLE)).toBeVisible();
  await expect(page.getByText(/Charlie · .+ · 1 replies/).first()).toBeVisible();

  // Clean up: delete the whole discussion from the thread page.
  await page.getByText(TITLE).click();
  await page.waitForURL(/\/admin\/forum\/[0-9a-f-]+$/);
  await page.getByRole("button", { name: "Delete discussion" }).click();
  await page.waitForURL(/\/admin\/forum$/);
  await expect(page.getByText(TITLE)).toHaveCount(0);
});

test("change nickname via the popup on the forum page", async ({ page }) => {
  await logIn(page, "Charlie");
  await page.goto("/admin/forum");

  await page.getByRole("button", { name: "Change nickname" }).click();
  const modal = page.getByRole("dialog");
  await modal.getByLabel("Nickname").fill("Chuck");
  await modal.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Posting as: Chuck")).toBeVisible();
});

test("nickname-only login is rejected while the password gate is on", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel(/Nickname|昵称/).fill("Visitor");
  await page.getByRole("button", { name: /Log in|登录/ }).click();
  await expect(page.getByText("Your email or password is incorrect.")).toBeVisible();
  expect(page.url()).toContain("/admin/login");
});
