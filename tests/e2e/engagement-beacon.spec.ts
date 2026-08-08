/**
 * ROLE OF THIS FILE
 * End-to-end proof that the engagement beacon works in a real browser
 * (docs/features/engagement-tracking.md). The unit tests pin the
 * clock's arithmetic; only this can show that the DOM wiring actually fires —
 * IntersectionObserver picking up `data-el` sections, the visibility flush,
 * and one summary that addresses the row the arrival beacon created.
 */

import { expect, test } from "@playwright/test";
import { promises as fs } from "fs";
import path from "path";
import { ADMIN_VIEWPORT, adminLogin } from "./helpers";

/**
 * The page_views row for one view id, straight from the local file adapter.
 *
 * The closing summary is asserted from storage rather than from the request
 * body on purpose: it travels via navigator.sendBeacon as a Blob, and
 * Playwright exposes no readable body for those. Storage is the better
 * assertion anyway — it proves the write landed, not merely that it was sent.
 */
async function storedView(
  viewId: string,
): Promise<Record<string, unknown> | undefined> {
  const raw = await fs.readFile(
    path.join(process.cwd(), ".data", "db.json"),
    "utf8",
  );
  const db = JSON.parse(raw) as {
    tables: { page_views: Array<Record<string, unknown>> };
  };
  return db.tables.page_views.find((row) => row.id === viewId);
}

type ArrivalPayload = { viewId?: string; path: string };

test("a real visit reports its time, its sections, and where it stopped", async ({
  page,
}) => {
  const arrivals: ArrivalPayload[] = [];

  page.on("request", (request) => {
    if (!request.url().endsWith("/api/beacon")) return;
    const raw = request.postData();
    if (raw) arrivals.push(JSON.parse(raw) as ArrivalPayload);
  });

  const engagementLanded = page.waitForResponse("**/api/beacon/engagement");
  await page.goto("/");
  await expect(page.locator('[data-el="HOME-HERO-SECTION"]')).toBeVisible();

  // Dwell in the hero. Longer than MIN_SECTION_MS (1s) so it earns the clock.
  await page.mouse.move(200, 400);
  await page.waitForTimeout(2_500);

  // Scroll down so a different band takes over, and dwell there too.
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(2_500);

  // Leaving the tab is the real-world end of a visit, and the one signal that
  // fires reliably on mobile. Faking it here exercises the exact handler.
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      value: "hidden",
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(500);

  /* ---------- arrival ---------- */

  const arrival = arrivals.find((entry) => entry.path === "/");
  expect(arrival, "the arrival beacon should have fired for /").toBeTruthy();
  expect(
    arrival?.viewId,
    "arrival must mint a viewId for the summary to address",
  ).toBeTruthy();

  /* ---------- the closing summary, as actually stored ---------- */

  await engagementLanded;
  await expect
    .poll(async () => (await storedView(arrival!.viewId!))?.active_ms ?? null, {
      message: "the engagement summary should reach the page_views row",
      timeout: 10_000,
    })
    .not.toBeNull();

  // Crucially the SAME row the arrival created — engagement costs no extra row.
  const row = (await storedView(arrival!.viewId!))!;
  expect(row.path).toBe("/");

  // ~5s of dwell above; generous slack for CI scheduling.
  const activeMs = row.active_ms as number;
  expect(activeMs).toBeGreaterThan(1_500);
  expect(activeMs).toBeLessThan(60_000);

  const scrollPct = row.scroll_pct as number;
  expect(scrollPct).toBeGreaterThanOrEqual(0);
  expect(scrollPct).toBeLessThanOrEqual(100);

  /* ---------- sections ---------- */

  const sections = row.sections as Record<string, number> | null;
  expect(sections, "a tagged page should report section time").toBeTruthy();
  const names = Object.keys(sections ?? {});
  expect(names.length).toBeGreaterThan(0);

  // Every measured name is a real tagged section, not a stray element.
  for (const name of names) {
    expect(name).toMatch(/-SECTION$/);
  }

  // The invariant the whole report rests on: one section owns the clock at a
  // time, so section time can never exceed the page total.
  const summed = Object.values(sections ?? {}).reduce((a, b) => a + b, 0);
  expect(summed).toBeLessThanOrEqual(activeMs);

  // Drop-off needs this, and it cannot be recovered from the jsonb blob.
  expect(row.last_section).toBeTruthy();
  expect(names).toContain(row.last_section);
});

test("the admin analytics page shows the engagement cards", async ({
  page,
}) => {
  await page.setViewportSize(ADMIN_VIEWPORT);
  await adminLogin(page);
  await page.goto("/admin/analytics?range=30d");
  // Match the card headings, not loose text: each card also carries a caption
  // explaining its numbers, and "Median time on page" contains the title.
  await expect(
    page.getByRole("heading", { name: "Time on page" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Section attention" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Where visits stop" }),
  ).toBeVisible();

  // The captions are the point of this card set — numbers like "42s · 73%" are
  // unreadable without them.
  await expect(
    page.getByText("visits measured", { exact: false }),
  ).toBeVisible();
});
