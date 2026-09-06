/**
 * ROLE OF THIS FILE
 * Proof that the rate limiter is actually wired into a running server, not
 * merely unit-tested in isolation. lib/rate-limit.ts is covered thoroughly by
 * tests/unit/rate-limit.test.ts; what those cannot show is that a route calls
 * it, that the 429 carries a usable Retry-After, and that the analytics routes
 * really do stay quiet instead of refusing.
 *
 * `/api/business-request` is the subject because it is the tightest limit we
 * ship (3 per 10 minutes) and because nothing else in the suite touches it, so
 * spending its whole allowance here cannot make another spec flaky. It sends
 * mail through lib/email.ts, which logs to the console rather than sending
 * while RESEND_API_KEY is blank — and playwright.config.ts blanks it
 * deliberately, so this test cannot post real mail.
 */

import { test, expect } from "@playwright/test";

const ENQUIRY = {
  email: "rate-limit-probe@example.com",
  need: "wholesale",
  kind: "request" as const,
};

test("the owner's inbox cannot be flooded through the enquiry form", async ({
  request,
}) => {
  const statuses: number[] = [];
  // One past the limit of 3. The fourth is the one that must be refused.
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await request.post("/api/business-request", {
      data: ENQUIRY,
    });
    statuses.push(response.status());
    if (response.status() === 429) {
      // The header is the contract with any well-behaved client: it must be a
      // positive whole number of seconds, never 0, or a retrying client
      // hammers straight back.
      const retryAfter = Number(response.headers()["retry-after"]);
      expect(Number.isInteger(retryAfter)).toBe(true);
      expect(retryAfter).toBeGreaterThan(0);

      const body = (await response.json()) as { ok: boolean; error?: string };
      expect(body.ok).toBe(false);
      // A refusal a shopper might see has to read like a shop, not a stack
      // trace: no status codes, no jargon.
      expect(body.error ?? "").not.toMatch(/rate|limit|429/i);
    }
  }

  expect(statuses.slice(0, 3)).toEqual([200, 200, 200]);
  expect(statuses[3]).toBe(429);
});

test("analytics keeps answering 200 however hard it is pushed", async ({
  request,
}) => {
  // The opposite policy, and the reason both exist. The beacon is allowed 120
  // a minute; well past that it must still answer 200, because a 429 reaching
  // the storefront could break browsing for a shopper on a shared address
  // while a missing page view costs nobody anything.
  const statuses = new Set<number>();
  for (let attempt = 0; attempt < 140; attempt++) {
    const response = await request.post("/api/beacon", {
      data: {
        visitorId: "rate-limit-probe-visitor",
        sessionId: `rate-limit-probe-session-${attempt}`,
        path: "/",
      },
    });
    statuses.add(response.status());
  }
  expect([...statuses]).toEqual([200]);
});
