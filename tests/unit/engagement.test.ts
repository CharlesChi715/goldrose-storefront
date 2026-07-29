/**
 * ROLE OF THIS FILE
 * Unit tests for the engagement measurement rules
 * (docs/features/backend/engagement-tracking.md). These pin the decisions that
 * make the numbers mean something: hidden tabs count zero, idle time is cut,
 * a short section can still win the viewport contest, and per-section time can
 * never exceed the page total.
 *
 * Time is injected, so none of this needs a browser or fake timers.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  IDLE_MS,
  MIN_SECTION_MS,
  createEngagementClock,
  pickSection,
  sectionScore,
} from "../../lib/engagement.ts";

const VIEWPORT = 800;

/** Drive the clock forward in TICK-sized steps, as the browser interval does. */
function run(
  clock: ReturnType<typeof createEngagementClock>,
  from: number,
  ms: number,
  section: string | null,
  step = 500,
): number {
  let t = from;
  const end = from + ms;
  while (t < end) {
    t = Math.min(t + step, end);
    clock.tick(t, section);
  }
  return t;
}

/* ---------- the viewport contest ---------- */

test("a short centred section beats a tall one that owns more pixels", () => {
  // The objection that shaped the formula: a 120px band between two tall bands
  // occupies far fewer viewport pixels, yet it is what the visitor is looking
  // at. Scoring against "the most it could show" lets it win.
  const shortCentred = sectionScore({ name: "S", top: 340, bottom: 460 }, VIEWPORT);
  const tallPartial = sectionScore({ name: "T", top: 460, bottom: 2460 }, VIEWPORT);

  assert.ok(
    shortCentred > tallPartial,
    `short centred (${shortCentred}) should beat tall partial (${tallPartial})`,
  );
});

test("a fully visible section of any height can reach the top score", () => {
  const short = sectionScore({ name: "S", top: 350, bottom: 450 }, VIEWPORT);
  const exact = sectionScore({ name: "E", top: 0, bottom: VIEWPORT }, VIEWPORT);
  // Both are "as visible as they could possibly be", so both score ~1.
  assert.ok(short > 0.95, `short centred scored ${short}`);
  assert.ok(exact > 0.95, `full-screen scored ${exact}`);
});

test("an off-screen section scores zero", () => {
  assert.equal(sectionScore({ name: "A", top: -500, bottom: -10 }, VIEWPORT), 0);
  assert.equal(sectionScore({ name: "B", top: 900, bottom: 1400 }, VIEWPORT), 0);
});

test("a tall section still beats a sliver clinging to the edge", () => {
  const winner = pickSection(
    [
      { name: "SLIVER", top: 0, bottom: 20 },
      { name: "BAND", top: 20, bottom: 1200 },
    ],
    VIEWPORT,
  );
  assert.equal(winner, "BAND");
});

test("pickSection returns null when nothing is on screen", () => {
  assert.equal(pickSection([], VIEWPORT), null);
});

/* ---------- the clock ---------- */

test("a 40 second visit records ~40s of active time", () => {
  const clock = createEngagementClock(0);
  let t = 0;
  // A reader interacting occasionally, as a real one does.
  for (let i = 0; i < 4; i += 1) {
    t = run(clock, t, 10_000, "HOME-HERO-SECTION");
    clock.activity(t);
  }
  const snap = clock.snapshot(t);
  assert.ok(
    Math.abs(snap.activeMs - 40_000) <= 2_000,
    `expected ~40000ms, got ${snap.activeMs}`,
  );
});

test("a backgrounded tab adds zero active time", () => {
  const clock = createEngagementClock(0);
  let t = run(clock, 0, 5_000, "HOME-HERO-SECTION");
  const before = clock.snapshot(t).activeMs;

  clock.setVisible(false, t);
  t = run(clock, t, 60_000, "HOME-HERO-SECTION");   // 60s in the background
  clock.setVisible(true, t);

  assert.equal(clock.snapshot(t).activeMs, before);
});

test("idle time beyond the cut is dropped, and interaction resumes the clock", () => {
  const clock = createEngagementClock(0);
  // Ten minutes with no events at all.
  let t = run(clock, 0, 10 * 60_000, "HOME-HERO-SECTION");
  const idled = clock.snapshot(t).activeMs;
  assert.ok(
    Math.abs(idled - IDLE_MS) <= 1_000,
    `idle visit should bank ~${IDLE_MS}ms, got ${idled}`,
  );

  clock.activity(t);
  t = run(clock, t, 5_000, "HOME-HERO-SECTION");
  assert.ok(clock.snapshot(t).activeMs > idled, "interaction should restart the clock");
});

test("a section must lead for the minimum dwell before it earns any time", () => {
  const clock = createEngagementClock(0);
  let t = run(clock, 0, 10_000, "HOME-HERO-SECTION");

  // Flick past a band for less than the floor, then return.
  clock.tick(t + 200, "HOME-STORY-SECTION");
  t += 200;
  clock.tick(t + 200, "HOME-HERO-SECTION");
  t += 200;

  const snap = clock.snapshot(t);
  assert.equal(snap.sections["HOME-STORY-SECTION"], undefined);
  assert.ok(snap.sections["HOME-HERO-SECTION"] > 0);
});

test("a section that leads past the floor does take the clock", () => {
  const clock = createEngagementClock(0);
  let t = run(clock, 0, 5_000, "HOME-HERO-SECTION");
  clock.activity(t);
  t = run(clock, t, MIN_SECTION_MS + 5_000, "HOME-STORY-SECTION");

  const snap = clock.snapshot(t);
  assert.ok(snap.sections["HOME-STORY-SECTION"] > 0, "story section should have banked time");
});

test("per-section time never exceeds page active time — the invariant", () => {
  const clock = createEngagementClock(0);
  let t = 0;
  const bands = ["HOME-HERO-SECTION", "HOME-STORY-SECTION", "HOME-CRAFT-SECTION"];
  for (let i = 0; i < 12; i += 1) {
    t = run(clock, t, 3_000, bands[i % bands.length]);
    clock.activity(t);
    if (i % 4 === 3) {                 // duck out of the tab now and then
      clock.setVisible(false, t);
      t = run(clock, t, 9_000, bands[i % bands.length]);
      clock.setVisible(true, t);
    }
  }
  const snap = clock.snapshot(t);
  const summed = Object.values(snap.sections).reduce((a, b) => a + b, 0);

  assert.ok(
    summed <= snap.activeMs,
    `sections summed ${summed} but page total is ${snap.activeMs}`,
  );
  assert.ok(summed > 0, "sections should have banked something");
});

test("scroll depth only ever increases", () => {
  const clock = createEngagementClock(0);
  clock.reportScroll(64);
  clock.reportScroll(20);            // scrolled back up
  assert.equal(clock.snapshot(0).scrollPct, 64);
});

test("scroll depth is clamped to 0-100", () => {
  const clock = createEngagementClock(0);
  clock.reportScroll(140);
  assert.equal(clock.snapshot(0).scrollPct, 100);
});

test("time with no section on screen counts to the page but to no section", () => {
  const clock = createEngagementClock(0);
  const t = run(clock, 0, 5_000, null);
  const snap = clock.snapshot(t);
  assert.ok(snap.activeMs > 0);
  assert.equal(Object.keys(snap.sections).length, 0);
});
