/**
 * ROLE OF THIS FILE
 * Unit tests for the browser recorder's ONE hard rule: a search typed inside
 * the admin's home-page preview iframes must never be recorded.
 *
 * WHY THIS IS TESTED HERE AND NOT ONLY IN PLAYWRIGHT
 * `tests/e2e/admin-home-content.spec.ts` asserts zero `/api/beacon*` requests
 * while the home-page editor is open, and it would NOT catch a regression in
 * this file — the search log posts to `/api/search-queries`, which that filter
 * does not match. So the guard is proved directly, against the same three
 * cases `components/Beacon.tsx` reasons about: a top-level document, a framed
 * one, and a cross-origin frame where reaching `window.top` throws.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { recordSearchQuery } from "../../lib/search/record.ts";

type Holder = Record<string, unknown>;

/**
 * Run `body` with a fake `window` and `fetch` in place, and report the URLs
 * that were posted. Globals are always restored, including on failure.
 *
 * @param window - The fake window this document should appear to have.
 * @param body - What to run inside it.
 * @returns Every URL `fetch` was called with.
 */
function withWindow(window: unknown, body: () => void): string[] {
  const holder = globalThis as Holder;
  const previousWindow = holder.window;
  const previousFetch = holder.fetch;
  const posted: string[] = [];
  holder.window = window;
  holder.fetch = (url: string) => {
    posted.push(url);
    return Promise.resolve({ ok: true });
  };
  try {
    body();
  } finally {
    holder.window = previousWindow;
    holder.fetch = previousFetch;
  }
  return posted;
}

const SEARCH = {
  raw: "Gold Rose",
  normalized: "gold rose",
  resultCount: 3,
  mode: "exact",
  facets: [],
} as const;

test("a shopper's own tab records the search", () => {
  // self === top: an ordinary top-level document.
  const top = {} as Holder;
  top.self = top;
  top.top = top;
  const posted = withWindow(top, () => recordSearchQuery(SEARCH));
  assert.deepEqual(posted, ["/api/search-queries"]);
});

test("a framed document records nothing", () => {
  // The admin's Content → Home page renders the storefront in eleven iframes,
  // where the search overlay is reachable and the pathname is genuinely "/".
  // A teammate proof-reading copy is not a shopper searching, and counting it
  // would invent the very demand the Trending chips get chosen from.
  const inner = {} as Holder;
  inner.self = inner;
  inner.top = {};
  const posted = withWindow(inner, () => recordSearchQuery(SEARCH));
  assert.deepEqual(posted, []);
});

test("a cross-origin frame, where reading window.top throws, records nothing", () => {
  const hostile = {
    get self() {
      return hostile;
    },
    get top(): unknown {
      throw new Error("cross-origin");
    },
  };
  const posted = withWindow(hostile, () => recordSearchQuery(SEARCH));
  // Not being able to see the top window is itself proof this is framed, so
  // the catch defaults to "do not record" rather than to "record anyway".
  assert.deepEqual(posted, []);
});

test("an empty submit is not a search", () => {
  const top = {} as Holder;
  top.self = top;
  top.top = top;
  const posted = withWindow(top, () =>
    recordSearchQuery({ ...SEARCH, raw: "   " }),
  );
  assert.deepEqual(posted, []);
});

test("a query the fold destroys is still recorded", () => {
  // 玫瑰 normalizes to "" — and is exactly the zero-result search worth most.
  const top = {} as Holder;
  top.self = top;
  top.top = top;
  const posted = withWindow(top, () =>
    recordSearchQuery({
      raw: "玫瑰",
      normalized: "",
      resultCount: 0,
      mode: "none",
      facets: [],
    }),
  );
  assert.deepEqual(posted, ["/api/search-queries"]);
});

test("a thrown fetch never reaches the caller", () => {
  // Analytics must never break browsing: submitting a search navigates to
  // /shop immediately afterwards, and that must happen regardless.
  const holder = globalThis as Holder;
  const previousWindow = holder.window;
  const previousFetch = holder.fetch;
  const top = {} as Holder;
  top.self = top;
  top.top = top;
  holder.window = top;
  holder.fetch = () => {
    throw new Error("offline");
  };
  try {
    assert.doesNotThrow(() => recordSearchQuery(SEARCH));
  } finally {
    holder.window = previousWindow;
    holder.fetch = previousFetch;
  }
});
