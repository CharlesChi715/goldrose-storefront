/**
 * ROLE OF THIS FILE
 * Unit tests for the alerting rules in lib/observe.ts — the throttle above
 * all. An alerter that emails on every failure is one a reader mutes within a
 * day, and a muted alerter is worse than none, so "one email per event per
 * window, carrying the count of what it stood in for" is the behaviour that
 * has to hold. The clock and the sender are injected, so none of this waits.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createAlerter, describeError, logEvent } from "../../lib/observe.ts";

/** A sender that records instead of sending, plus a clock the test drives. */
function harness(windowMs = 15 * 60_000) {
  const sent: { subject: string; text: string }[] = [];
  let clock = 1_000_000;
  const alert = createAlerter({
    send: async (subject, text) => {
      sent.push({ subject, text });
      return true;
    },
    now: () => clock,
    windowMs,
  });
  return {
    sent,
    alert,
    advance: (ms: number) => {
      clock += ms;
    },
  };
}

/** Swallow the console while a block runs, returning what it wrote. */
async function captureConsole(run: () => Promise<void> | void) {
  const lines: string[] = [];
  const original = {
    log: console.log,
    warn: console.warn,
    error: console.error,
  };
  const record = (...args: unknown[]) => {
    lines.push(args.map(String).join(" "));
  };
  console.log = record;
  console.warn = record;
  console.error = record;
  try {
    await run();
  } finally {
    console.log = original.log;
    console.warn = original.warn;
    console.error = original.error;
  }
  return lines;
}

test("the first alert of its kind is logged and emailed", async () => {
  const { alert, sent } = harness();
  await captureConsole(() =>
    alert("paypal.capture.failed", "A capture failed.", { orderId: "abc" }),
  );
  assert.equal(sent.length, 1);
  assert.match(sent[0].subject, /paypal\.capture\.failed/);
  assert.match(sent[0].text, /A capture failed\./);
  assert.match(sent[0].text, /orderId/);
});

test("the same event inside the window is logged but not emailed again", async () => {
  const { alert, sent } = harness();
  const lines = await captureConsole(async () => {
    await alert("paypal.capture.failed", "one");
    await alert("paypal.capture.failed", "two");
    await alert("paypal.capture.failed", "three");
  });
  assert.equal(sent.length, 1, "only the first email goes out");
  assert.equal(lines.length, 3, "but every occurrence is still logged");
});

test("the next email says how many it stood in for", async () => {
  const { alert, sent, advance } = harness(1000);
  await captureConsole(async () => {
    await alert("db.unreachable", "first");
    await alert("db.unreachable", "second");
    await alert("db.unreachable", "third");
    advance(1001);
    await alert("db.unreachable", "fourth");
  });
  assert.equal(sent.length, 2);
  assert.match(sent[1].text, /2 more of the same/);
});

test("a quiet event is not silenced by a noisy neighbour", async () => {
  const { alert, sent } = harness();
  await captureConsole(async () => {
    await alert("paypal.capture.failed", "noisy");
    await alert("paypal.capture.failed", "noisy again");
    await alert("db.unreachable", "different event");
  });
  assert.equal(sent.length, 2);
  assert.match(sent[1].subject, /db\.unreachable/);
});

test("the window reopens once the quiet period has passed", async () => {
  const { alert, sent, advance } = harness(1000);
  await captureConsole(async () => {
    await alert("webhook.failed", "first");
    advance(999);
    await alert("webhook.failed", "still inside");
    advance(2);
    await alert("webhook.failed", "past it");
  });
  assert.equal(sent.length, 2);
});

test("a sender that throws never reaches the caller", async () => {
  const alert = createAlerter({
    send: async () => {
      throw new Error("Resend is down");
    },
  });
  const lines = await captureConsole(() =>
    alert("paypal.capture.failed", "the original problem"),
  );
  // The original event AND the failure to report it are both on the record.
  assert.ok(lines.some((line) => line.includes("paypal.capture.failed")));
  assert.ok(lines.some((line) => line.includes("alert.email.failed")));
});

test("an alert carries the cause's message, not [object Object]", async () => {
  const { alert, sent } = harness();
  await captureConsole(() =>
    alert("paypal.capture.failed", "capture blew up", {
      err: new Error("PayPal returned 502"),
    }),
  );
  assert.match(sent[0].text, /PayPal returned 502/);
});

test("a log line is one parseable JSON object carrying the event name", async () => {
  const lines = await captureConsole(() => {
    logEvent("info", "order.placed", { orderId: "GR-1001", cents: 12900 });
  });
  assert.equal(lines.length, 1);
  const parsed = JSON.parse(lines[0]) as Record<string, unknown>;
  assert.equal(parsed.event, "order.placed");
  assert.equal(parsed.level, "info");
  assert.equal(parsed.orderId, "GR-1001");
  assert.equal(parsed.cents, 12900);
  assert.equal(typeof parsed.ts, "string");
});

test("a field cannot rename the event it is attached to", async () => {
  // Regression: the fields used to be spread AFTER the reserved keys, so a
  // caller passing `event` renamed the line. The first casualty was the
  // alerter's own failure line, which then claimed to be the failure it was
  // reporting on — an alert about a broken alert, wearing the wrong name.
  const lines = await captureConsole(() => {
    logEvent("error", "alert.email.failed", {
      event: "paypal.capture.failed",
      level: "info",
      ts: "not a timestamp",
    });
  });
  const parsed = JSON.parse(lines[0]) as Record<string, unknown>;
  assert.equal(parsed.event, "alert.email.failed");
  assert.equal(parsed.level, "error");
  assert.notEqual(parsed.ts, "not a timestamp");
});

test("a thrown Error is logged as name, message and stack", () => {
  const shape = describeError(new TypeError("bad input"));
  assert.equal(shape.name, "TypeError");
  assert.equal(shape.message, "bad input");
  assert.equal(typeof shape.stack, "string");
});

test("a thrown non-Error still yields a readable message", () => {
  assert.equal(describeError("just a string").message, "just a string");
  assert.equal(describeError(undefined).message, "undefined");
  assert.equal(describeError({ code: 500 }).message, "[object Object]");
});
