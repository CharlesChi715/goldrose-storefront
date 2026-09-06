/**
 * ROLE OF THIS FILE
 * Unit tests for lib/rate-limit.ts. The sliding window is the point: a fixed
 * window lets a client take double its allowance by firing either side of the
 * boundary, and this test file is what stops anyone "simplifying" it back.
 * Memory bounding is tested too — a limiter that an attacker can grow without
 * limit is a denial of service wearing a helmet.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  clientKey,
  createLimiter,
  LIMITS,
  type Limit,
} from "../../lib/rate-limit.ts";

/** A limiter whose clock the test drives. */
function at(start = 1_000_000) {
  let clock = start;
  const limiter = createLimiter({ now: () => clock });
  return {
    limiter,
    advance: (ms: number) => {
      clock += ms;
    },
  };
}

const THREE_PER_MINUTE: Limit = { limit: 3, windowMs: 60_000 };

test("a caller under the limit is allowed, and told what is left", () => {
  const { limiter } = at();
  assert.deepEqual(limiter.check("ip-1", THREE_PER_MINUTE), {
    allowed: true,
    remaining: 2,
    retryAfterSeconds: 0,
  });
  assert.equal(limiter.check("ip-1", THREE_PER_MINUTE).remaining, 1);
  assert.equal(limiter.check("ip-1", THREE_PER_MINUTE).remaining, 0);
});

test("the request past the limit is refused", () => {
  const { limiter } = at();
  for (let i = 0; i < 3; i++) limiter.check("ip-1", THREE_PER_MINUTE);
  const decision = limiter.check("ip-1", THREE_PER_MINUTE);
  assert.equal(decision.allowed, false);
  assert.equal(decision.remaining, 0);
});

test("one caller's flood does not touch another's allowance", () => {
  const { limiter } = at();
  for (let i = 0; i < 5; i++) limiter.check("noisy", THREE_PER_MINUTE);
  assert.equal(limiter.check("quiet", THREE_PER_MINUTE).allowed, true);
});

test("slots free one at a time, as each individual hit ages out", () => {
  // The property a fixed window does not have. Three hits spread a second
  // apart must free a slot a second apart, an hour later — not all at once
  // when some shared boundary passes.
  const { limiter, advance } = at();
  limiter.check("ip-1", THREE_PER_MINUTE); // t+0
  advance(1_000);
  limiter.check("ip-1", THREE_PER_MINUTE); // t+1s
  advance(1_000);
  limiter.check("ip-1", THREE_PER_MINUTE); // t+2s

  advance(57_500); // t+59.5s — nothing has aged out yet
  assert.equal(limiter.check("ip-1", THREE_PER_MINUTE).allowed, false);

  advance(1_000); // t+60.5s — only the first hit has expired
  assert.equal(
    limiter.check("ip-1", THREE_PER_MINUTE).allowed,
    true,
    "exactly one slot opened",
  );
  assert.equal(
    limiter.check("ip-1", THREE_PER_MINUTE).allowed,
    false,
    "and only one — the other two are still recent",
  );
});

test("a straddled boundary does not hand out a double allowance", () => {
  // The classic fixed-window flaw: burst at the end of one window, burst again
  // at the start of the next, and a naive counter permits 2× the limit in a
  // moment. Six hits inside three seconds must never all be allowed.
  const { limiter, advance } = at();
  let allowed = 0;
  for (let i = 0; i < 3; i++) {
    if (limiter.check("burst", THREE_PER_MINUTE).allowed) allowed++;
  }
  advance(59_000);
  for (let i = 0; i < 3; i++) {
    if (limiter.check("burst", THREE_PER_MINUTE).allowed) allowed++;
  }
  assert.equal(allowed, 3, "six attempts across the boundary, three allowed");
});

test("retry-after counts to when a slot actually frees, never zero", () => {
  const { limiter, advance } = at();
  for (let i = 0; i < 3; i++) limiter.check("ip-1", THREE_PER_MINUTE);
  advance(20_000);
  const decision = limiter.check("ip-1", THREE_PER_MINUTE);
  assert.equal(decision.allowed, false);
  assert.equal(decision.retryAfterSeconds, 40);
});

test("a refused request does not extend the block", () => {
  // Hammering while blocked must not keep pushing the window forward, or a
  // retrying client can never recover.
  const { limiter, advance } = at();
  for (let i = 0; i < 3; i++) limiter.check("ip-1", THREE_PER_MINUTE);
  advance(30_000);
  for (let i = 0; i < 50; i++) limiter.check("ip-1", THREE_PER_MINUTE);
  advance(30_001);
  assert.equal(limiter.check("ip-1", THREE_PER_MINUTE).allowed, true);
});

test("tracked keys are capped, so a key-per-request attack cannot grow memory", () => {
  const limiter = createLimiter({ maxKeys: 100 });
  for (let i = 0; i < 5_000; i++) {
    limiter.check(`attacker-${i}`, THREE_PER_MINUTE);
  }
  assert.ok(
    limiter.size() <= 100,
    `expected at most 100 keys, held ${limiter.size()}`,
  );
});

test("eviction drops the coldest key, not the busiest one", () => {
  const limiter = createLimiter({ maxKeys: 3 });
  limiter.check("regular", THREE_PER_MINUTE);
  limiter.check("a", THREE_PER_MINUTE);
  limiter.check("b", THREE_PER_MINUTE);
  // Touching "regular" again makes it the most recently used.
  limiter.check("regular", THREE_PER_MINUTE);
  limiter.check("c", THREE_PER_MINUTE);
  limiter.check("d", THREE_PER_MINUTE);
  // "regular" has been seen twice and must still be counted.
  assert.equal(limiter.check("regular", THREE_PER_MINUTE).remaining, 0);
});

test("every shipped limit is a positive count over a positive window", () => {
  for (const [name, limit] of Object.entries(LIMITS)) {
    assert.ok(limit.limit > 0, `${name} allows nothing`);
    assert.ok(limit.windowMs > 0, `${name} has no window`);
    assert.ok(
      Number.isInteger(limit.limit),
      `${name} has a fractional allowance`,
    );
  }
});

test("the caller key prefers x-real-ip and is scoped per route", () => {
  const headers = new Headers({ "x-real-ip": "203.0.113.7" });
  assert.equal(clientKey(headers, "reviews"), "reviews:203.0.113.7");
  assert.notEqual(
    clientKey(headers, "reviews"),
    clientKey(headers, "feedback"),
    "using up one route's allowance must not spend another's",
  );
});

test("only the first x-forwarded-for entry is taken, and it is trimmed", () => {
  const headers = new Headers({
    "x-forwarded-for": " 203.0.113.7 , 70.41.3.18, 150.172.238.178",
  });
  assert.equal(clientKey(headers, "feedback"), "feedback:203.0.113.7");
});

test("an unattributable request is bucketed, not exempted", () => {
  assert.equal(clientKey(new Headers(), "feedback"), "feedback:unknown");
});

test("the owner-emailing route is the tightest limit we ship", () => {
  // If a future edit loosens this, that is a decision worth making on purpose:
  // business-request is the only public route that reaches a human inbox.
  const others = Object.entries(LIMITS)
    .filter(([name]) => name !== "businessRequest")
    .map(([, limit]) => limit.limit / (limit.windowMs / 60_000));
  const businessRate =
    LIMITS.businessRequest.limit / (LIMITS.businessRequest.windowMs / 60_000);
  assert.ok(others.every((rate) => rate >= businessRate));
});
