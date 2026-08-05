/**
 * ROLE OF THIS FILE
 * Forum flows (owner requests 2026-07-22): identity comes from the account
 * (sign-up nickname, else email name) — the login page carries no nickname
 * field outside open-access mode. Covers posting, replying, editing,
 * deleting, and the display-name popup. Runs with ADMIN_DEV_PASSWORD set
 * (playwright.config.ts), i.e. locked mode on the local file adapter.
 */

import { test, expect, type Page } from "@playwright/test";
import { ADMIN_VIEWPORT, DEV_PASSWORD } from "./helpers";

test.use({ viewport: ADMIN_VIEWPORT });
test.describe.configure({ mode: "serial" });

const TITLE = `Shipping box ideas (e2e ${Date.now()})`;
const OPENING = "Should we use magnetic gift boxes?";
const REPLY = "Yes — magnetic lids feel premium.";
const EDITED = "Edit: brushed gold magnetic lids, even better.";

async function logIn(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel(/^Email$|邮箱/).fill("owner@goldrose.local");
  await page.getByLabel(/Password|密码/).fill(DEV_PASSWORD);
  await page.getByRole("button", { name: /Log in|登录/ }).click();
  await page.waitForURL(/\/admin$/);
}

test("the login page has no nickname field outside open-access mode", async ({
  page,
}) => {
  await page.goto("/admin/login");
  await expect(page.getByLabel(/Nickname|昵称/)).toHaveCount(0);
});

test("a logged-in account posts under its account name — nothing to retype", async ({
  page,
}) => {
  await logIn(page);
  await page.goto("/admin/forum");
  // Identity is bound to the account (sign-up nickname, else email name).
  await expect(page.getByText("Posting as: owner")).toBeVisible();
});

test("start a discussion, reply, edit, see it in the list, then delete it", async ({
  page,
}) => {
  await logIn(page);

  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Forum" })
    .click();
  await page.waitForURL(/\/admin\/forum$/);
  await expect(page.getByText("Posting as: owner")).toBeVisible();

  // The seeded announcement threads greet testers.
  await expect(
    page.getByText("📢 Welcome to the ELDREVE testing forum"),
  ).toBeVisible();
  await expect(
    page.getByText("📢 What to test — and what to expect"),
  ).toBeVisible();

  await page.getByLabel("Title").fill(TITLE);
  await page.getByLabel("Message").fill(OPENING);
  await page.getByRole("button", { name: "Post", exact: true }).click();
  await page.waitForURL(/\/admin\/forum\/[0-9a-f-]+$/);
  await expect(page.getByText(OPENING)).toBeVisible();

  // Attach an image to the reply (the hidden files input drives uploads).
  await page.locator('input[name="files"]').setInputFiles({
    name: "screenshot.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64",
    ),
  });
  await expect(page.getByText("📎 screenshot.png")).toBeVisible();

  await page.getByLabel("Reply").fill(REPLY);
  await page.getByRole("button", { name: "Reply", exact: true }).click();
  // The box clears after a successful reply; only then is the posted copy
  // unambiguous (while typing, the textarea itself matches the text too).
  await expect(page.getByLabel("Reply")).toHaveValue("");
  await expect(page.getByText(REPLY)).toBeVisible();
  // The uploaded image renders inline on the posted reply.
  await expect(page.getByRole("img", { name: "screenshot.png" })).toBeVisible();

  // Edit your own post: both posts are the owner's, take the reply (last).
  await page.getByRole("button", { name: "Edit", exact: true }).last().click();
  await page.getByLabel("Edit", { exact: true }).fill(EDITED);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText(EDITED)).toBeVisible();
  await expect(page.getByText(/owner · .+ · edited/).first()).toBeVisible();

  await page.goto("/admin/forum");
  await expect(page.getByText(TITLE)).toBeVisible();
  await expect(page.getByText(/owner · .+ · 1 replies/).first()).toBeVisible();

  // Clean up: delete the whole discussion from the thread page.
  await page.getByText(TITLE).click();
  await page.waitForURL(/\/admin\/forum\/[0-9a-f-]+$/);
  await page.getByRole("button", { name: "Delete discussion" }).click();
  await page.waitForURL(/\/admin\/forum$/);
  await expect(page.getByText(TITLE)).toHaveCount(0);
});

test("unread badges count new messages and clear after reading", async ({
  page,
}) => {
  await logIn(page);

  // Fresh browser context = nothing read yet on this device, so the seeded
  // announcement threads (posted by "ELDREVE Team") are unread: the Forum
  // nav item carries a count badge.
  const forumNavLink = page
    .getByRole("navigation")
    .getByRole("link", { name: /Forum/ });
  const navBadge = forumNavLink.getByText(/^\d+$/);
  await expect(navBadge).toBeVisible();
  const initialUnread = Number(await navBadge.innerText());
  expect(initialUnread).toBeGreaterThan(0);

  // The thread list shows a per-thread "n new" badge.
  await forumNavLink.click();
  await page.waitForURL(/\/admin\/forum$/);
  await expect(page.getByText(/\d+ new/).first()).toBeVisible();

  // Read every thread: opening a thread marks it read on this device.
  const threadTitles = [
    "📢 Welcome to the ELDREVE testing forum",
    "📢 What to test — and what to expect",
  ];
  for (const title of threadTitles) {
    await page.getByText(title).click();
    await page.waitForURL(/\/admin\/forum\/[0-9a-f-]+$/);
    await page.goto("/admin/forum");
  }

  // Everything read: no per-thread badges, no nav count.
  await expect(page.getByText(/\d+ new/)).toHaveCount(0);
  await expect(forumNavLink.getByText(/^\d+$/)).toHaveCount(0);
});

test("the display-name popup overrides the account identity", async ({
  page,
}) => {
  await logIn(page);
  await page.goto("/admin/forum");

  await page.getByRole("button", { name: "Change nickname" }).click();
  const modal = page.getByRole("dialog");
  await modal.getByLabel("Nickname").fill("Chuck");
  await modal.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Posting as: Chuck")).toBeVisible();
});
