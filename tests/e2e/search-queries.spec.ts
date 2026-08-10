/**
 * ROLE OF THIS FILE
 * End-to-end proof of search-query analytics (storefront-search.md OQ-1): a
 * submitted search reaches POST /api/search-queries, lands in the store, and
 * appears in the two /admin/analytics cards — the popular list and, separately,
 * the list of searches that found nothing.
 *
 * It also pins the two rules that are easy to break silently:
 *   - the endpoint ALWAYS answers 200 fast, even on rubbish input, because a
 *     shopper's search must run whether or not we manage to write it down; and
 *   - a query the fold destroys (玫瑰) is still recorded under its own name
 *     rather than being lost to a failed NOT NULL constraint.
 */

import { test, expect, type Page } from "@playwright/test";
import { promises as fs } from "fs";
import path from "path";
import { adminLogin, ADMIN_VIEWPORT } from "./helpers";

test.describe.configure({ mode: "serial" });

/** Rows written after `since`, straight off the local adapter's file. */
async function rowsSince(since: string) {
  const db = JSON.parse(
    await fs.readFile(path.join(process.cwd(), ".data", "db.json"), "utf8"),
  ) as {
    tables: {
      search_queries?: Array<{
        query: string;
        query_raw: string;
        result_count: number;
        mode: string;
        facets: string[];
        created_at: string;
      }>;
    };
  };
  return (db.tables.search_queries ?? []).filter(
    (row) => row.created_at >= since,
  );
}

/** Unique per run, so a re-run cannot read the previous run's rows. */
const STAMP = Date.now();
const POPULAR = `gold rose ${STAMP}`;
const MISSING = `sunflower ${STAMP}`;

test("a submitted search is stored, and the endpoint never fails the shopper", async ({
  request,
}) => {
  // `.data/db.json` survives between runs, and a query the fold destroys (玫瑰)
  // cannot carry a unique stamp — any digits would survive folding and defeat
  // the very case it exists to prove. So the assertions below are scoped by
  // time instead: only rows written after this moment belong to this run.
  const since = new Date().toISOString();

  // Three searches that found something; the commonest spelling is capitalised,
  // which is what the admin should display.
  for (const raw of [POPULAR, `Gold Rose ${STAMP}`, `Gold Rose ${STAMP}`]) {
    const response = await request.post("/api/search-queries", {
      data: {
        query: raw,
        queryNormalized: POPULAR,
        resultCount: 3,
        mode: "exact",
        // One real slug and one invented one: the invented slug must be
        // dropped, because the column is joinable against the filter drawer.
        facets: ["mother", "not-a-real-facet"],
      },
    });
    expect(response.status()).toBe(200);
  }

  // Two searches that found nothing at all.
  for (const raw of [MISSING, MISSING]) {
    const response = await request.post("/api/search-queries", {
      data: {
        query: raw,
        queryNormalized: MISSING,
        resultCount: 0,
        mode: "none",
        facets: [],
      },
    });
    expect(response.status()).toBe(200);
  }

  // A query the engine's fold reduces to "" — 玫瑰 keeps its own identity
  // instead of failing the length CHECK and disappearing into console.error.
  const cjk = await request.post("/api/search-queries", {
    data: {
      query: "玫瑰",
      queryNormalized: "",
      resultCount: 0,
      mode: "none",
      facets: [],
    },
  });
  expect(cjk.status()).toBe(200);

  const rows = await rowsSince(since);

  const popular = rows.filter((row) => row.query === POPULAR);
  expect(popular).toHaveLength(3);
  // Grouped on the folded key, but both spellings are preserved verbatim.
  expect(popular.map((row) => row.query_raw)).toContain(`Gold Rose ${STAMP}`);
  expect(popular.map((row) => row.query_raw)).toContain(POPULAR);
  // The unknown slug was dropped; the real one survived.
  expect(popular[0].facets).toEqual(["mother"]);

  expect(rows.filter((row) => row.query === MISSING)).toHaveLength(2);
  expect(rows.filter((row) => row.query === "玫瑰")).toHaveLength(1);
});

test("bad input is refused without ever throwing at the shopper", async ({
  request,
}) => {
  // Malformed body → 400, but instantly and without a stack reaching anyone.
  const bad = await request.post("/api/search-queries", {
    data: { query: "", resultCount: -1, mode: "sideways" },
  });
  expect(bad.status()).toBe(400);

  // "all" is a real engine mode but can never be SUBMITTED, so it is refused
  // rather than quietly recorded as a search nobody ran.
  const allMode = await request.post("/api/search-queries", {
    data: { query: "anything", resultCount: 3, mode: "all" },
  });
  expect(allMode.status()).toBe(400);
});

/* ---------- the real overlay, driven the way a shopper drives it ---------- */

/** Without `exact`, "Search" also matches the panel's "Clear search" button. */
async function openSearch(page: Page) {
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Search" })).toBeVisible();
}

test("pressing enter records the search, with what it actually found", async ({
  page,
}) => {
  const since = new Date().toISOString();
  await page.goto("/");
  await openSearch(page);

  const field = page.getByRole("combobox", { name: /Search products/ });
  // Typed one character at a time, which is the point: the panel matches on
  // every keystroke, and NONE of that may be recorded.
  await field.pressSequentially("rose", { delay: 30 });
  await page.waitForTimeout(400);
  expect(await rowsSince(since)).toHaveLength(0);

  await field.press("Enter");
  await page.waitForURL(/\/shop\?q=/);

  // Polled, not read once: the request being SENT is not the row being
  // written, and the local adapter serialises its writes behind a queue.
  await expect.poll(async () => (await rowsSince(since)).length).toBe(1);
  const rows = await rowsSince(since);
  // Exactly one row for four keystrokes plus a submit.
  expect(rows[0].query).toBe("rose");
  expect(rows[0].query_raw).toBe("rose");
  // The engine found the catalogue's roses, and said so honestly.
  expect(rows[0].result_count).toBeGreaterThan(0);
  expect(rows[0].mode).toBe("exact");
});

test("a trending chip is filed under what THAT chip finds, not the empty box", async ({
  page,
}) => {
  // The regression this pins: `results` is computed from what is TYPED, and a
  // chip submits its own label instead. Reusing the typed result would file
  // every chip tap as a search of an empty field.
  const since = new Date().toISOString();
  await page.goto("/");
  await openSearch(page);

  await page
    .getByRole("dialog", { name: "Search" })
    .getByRole("button", { name: /^For Mom/ })
    .click();
  await page.waitForURL(/\/shop\?q=/);

  await expect.poll(async () => (await rowsSince(since)).length).toBe(1);
  const rows = await rowsSince(since);
  expect(rows[0].query_raw).toBe("For Mom");
  // "for mom" names a facet, so the query resolves to the recipient slug and
  // is stored against the same closed vocabulary the filter drawer uses.
  expect(rows[0].facets).toEqual(["mother"]);
  expect(rows[0].result_count).toBeGreaterThan(0);
});

test("a search that finds nothing is recorded as the miss it is", async ({
  page,
}) => {
  const since = new Date().toISOString();
  await page.goto("/");
  await openSearch(page);

  const field = page.getByRole("combobox", { name: /Search products/ });
  await field.fill("zzzznotathing");
  await field.press("Enter");
  await page.waitForURL(/\/shop\?q=/);

  await expect.poll(async () => (await rowsSince(since)).length).toBe(1);
  const rows = await rowsSince(since);
  expect(rows[0].result_count).toBe(0);
  expect(rows[0].mode).toBe("none");
});

test.describe("the admin's report", () => {
  test.use({ viewport: ADMIN_VIEWPORT });

  test("shows top searches and, separately, the misses", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/analytics?range=30d");

    // Popular list: the commonest spelling, with its count.
    const topCard = page
      .locator("div")
      .filter({ hasText: /^Top searches/ })
      .first();
    await expect(topCard).toContainText(`Gold Rose ${STAMP}`);
    await expect(topCard).toContainText("(3)");

    // The failures get their OWN card — ranked among their own kind, so a
    // query asked twice is visible next to one asked a thousand times.
    const missCard = page
      .locator("div")
      .filter({ hasText: /^What shoppers could not find/ })
      .first();
    await expect(missCard).toContainText(MISSING);
    await expect(missCard).toContainText("玫瑰");
    // A successful query must never appear in the misses list.
    await expect(missCard).not.toContainText(`Gold Rose ${STAMP}`);
  });
});
