/**
 * ROLE OF THIS FILE
 * Guards the reminders' automatic 冬令时/夏令时 switch (owner instruction
 * 2026-08-02): the Pacific label must follow the US daylight-saving rules on
 * its own, and must not depend on the machine's own time zone — the storefront
 * renders it on a server in one zone and hydrates it in a browser in another.
 *
 * Runs under plain Node: `npm run test:unit`.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  pacificOffsetHours,
  pacificTimeLabel,
} from "../../lib/reminders/timezone.ts";

test("winter (冬令时) is UTC-8 and summer (夏令时) is UTC-7", () => {
  assert.equal(pacificOffsetHours(new Date("2026-01-15T12:00:00Z")), -8);
  assert.equal(pacificOffsetHours(new Date("2026-07-15T12:00:00Z")), -7);
});

test("the switch lands on the US DST dates, not on fixed months", () => {
  // 2026: DST starts Sun 8 Mar at 02:00 local (10:00 UTC) and ends
  // Sun 1 Nov at 02:00 local (09:00 UTC).
  assert.equal(pacificOffsetHours(new Date("2026-03-08T09:59:00Z")), -8);
  assert.equal(pacificOffsetHours(new Date("2026-03-08T10:01:00Z")), -7);
  assert.equal(pacificOffsetHours(new Date("2026-11-01T08:59:00Z")), -7);
  assert.equal(pacificOffsetHours(new Date("2026-11-01T09:01:00Z")), -8);
});

test("the label keeps the frame's exact wording and spacing", () => {
  assert.equal(
    pacificTimeLabel(new Date("2026-01-15T12:00:00Z")),
    "Pacific Time (PT)UTC-8",
  );
  assert.equal(
    pacificTimeLabel(new Date("2026-07-15T12:00:00Z")),
    "Pacific Time (PT)UTC-7",
  );
});

test("the result does not depend on the machine's own time zone", () => {
  const instant = new Date("2026-07-15T12:00:00Z");
  const expected = pacificTimeLabel(instant);
  const original = process.env.TZ;
  for (const tz of ["UTC", "Australia/Sydney", "Asia/Shanghai"]) {
    process.env.TZ = tz;
    assert.equal(pacificTimeLabel(instant), expected, `TZ=${tz}`);
  }
  process.env.TZ = original;
});
