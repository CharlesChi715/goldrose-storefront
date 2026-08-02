<!-- Closed agent-inbox matter. Private working record — an AI agent
     must ask Charles before reading anything in this folder. -->

## AI-010 · `AGENT-DECISION` · timezone picker sheet not built — `ANSWERED`, applied

- **Where:** [`components/screens/RemindersScreen.tsx`](../../components/screens/RemindersScreen.tsx)
  (timezone row), un-built frame GIFT-REMINDERS-TIME-ZONE 2030:190.
- **What:** the re-marked `me三级` section contained a full timezone-picker
  sheet, but the comment thread Charles accepted (07-31 → 08-01) settled
  Pacific-only with automatic DST and **no manual setting**. The sheet
  contradicted that, so the accepted comment won and no picker was built.
- **Charles (08-02):** "we removed … GIFT-REMINDERS-TIME-ZONE from ready for
  dev. right now just fix the timezone and autoset it 冬令时和夏令时 (for US
  customer)."
- **Applied:** the row no longer prints a fixed string. `pacificTimeLabel()`
  ([`lib/reminders/timezone.ts`](../../lib/reminders/timezone.ts)) derives the
  offset from the IANA zone `America/Los_Angeles`, so the label reads
  `Pacific Time (PT)UTC-7` during 夏令时 and `…UTC-8` during 冬令时 with no
  edit and no picker — including future rule changes, which ship with the
  platform's time-zone database. Unit-tested at both solstices and at the
  2026 switch instants, and proven independent of the server's own time zone
  (server render and browser hydration must agree).
- **Closed:** 2026-08-02
- **Why:** answered + applied — design un-marked the picker sheet; the timezone row now auto-switches 冬令时/夏令时 via lib/reminders/timezone.ts (unit-tested)
