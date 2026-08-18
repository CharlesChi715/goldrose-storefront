/**
 * ROLE OF THIS FILE
 * Cover for the six /policies/* documents imported 2026-08-18 from the design
 * team's policy frames (2118:239 / :241 / :242 / :243 / :244, 2127:238).
 *
 * These are legal pages, so the checks are about what the page CLAIMS rather
 * than how it looks: that every route stopped being a coming-soon scaffold,
 * that no unfilled `[BRACKET]` from the frames reaches a reader, that the
 * dead brand name is gone, and that each page is still noindex while the
 * bosses have not signed the copy off (AI-046). Pixel fidelity is the
 * pixel-diff net's job.
 */

import { test, expect } from "@playwright/test";

/** slug → [document title, the design's document code, section count]. */
const DOCUMENTS = [
  [
    "returns-refunds-cancellations",
    "Returns, Refunds & Cancellations Policy",
    "Policy A",
    9,
  ],
  ["shipping-delivery", "Shipping & Delivery Policy", "Policy B", 8],
  ["warranty-care", "Limited Product Warranty & Care", "Policy C", 7],
  ["terms-of-service", "Terms of Service", "Policy D", 18],
  ["privacy", "Privacy Policy", "Policy E", 11],
  ["email-sms-terms", "Email & SMS Terms", "Policy G", 4],
] as const;

for (const [slug, title, label, sections] of DOCUMENTS) {
  test(`/policies/${slug} renders ${label} and its ${sections} sections`, async ({
    page,
  }) => {
    await page.goto(`/policies/${slug}`);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(page.locator('[data-el="POLICY-LABEL"]')).toHaveText(label);
    await expect(page.locator('[data-el="POLICY-SECTION"]')).toHaveCount(
      sections,
    );

    // The scaffold this replaced said exactly this, on every one of them.
    await expect(page.getByText("This page is coming soon.")).toHaveCount(0);
  });
}

test("no frame placeholder or dead brand name reaches a policy reader", async ({
  page,
}) => {
  for (const [slug] of DOCUMENTS) {
    await page.goto(`/policies/${slug}`);
    const body = (await page.locator("body").innerText()) ?? "";
    // The frames ship sixteen of these; none may survive the import.
    expect(body, `${slug} leaks a frame placeholder`).not.toMatch(
      /\[[A-Z][A-Z ,0-9]*\]/,
    );
    expect(body, `${slug} still says the pre-rename brand name`).not.toMatch(
      /GoldRose/i,
    );
  }
});

test("the support address comes from settings and is mailable", async ({
  page,
}) => {
  await page.goto("/policies/returns-refunds-cancellations");
  const mailto = page.locator('a[href^="mailto:"]').first();
  await expect(mailto).toHaveAttribute("href", /^mailto:.+@.+\..+/);
});

test("an unanswered token shows as 'to be confirmed', never as a blank", async ({
  page,
}) => {
  // Section 16 binds disputes to a governing-law state the frame never named.
  await page.goto("/policies/terms-of-service");
  const unresolved = page.locator('[data-policy-token="unresolved"]').first();
  await expect(unresolved).toHaveText("to be confirmed");
});

test("every policy page stays out of the index until the copy is signed off", async ({
  page,
}) => {
  for (const [slug] of DOCUMENTS) {
    await page.goto(`/policies/${slug}`);
    await expect(
      page.locator('meta[name="robots"]'),
      `${slug} must be noindex (AI-046)`,
    ).toHaveAttribute("content", /noindex/);
  }
});

test("the Policies & Legal hub reaches each built document", async ({
  page,
}) => {
  await page.goto("/account/policies-legal");
  for (const [slug, title] of DOCUMENTS) {
    await page.goto("/account/policies-legal");
    await page.locator(`a[href="/policies/${slug}"]`).first().click();
    await expect(page).toHaveURL(new RegExp(`/policies/${slug}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
  }
});
