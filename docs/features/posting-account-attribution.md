# Posting-account attribution — link tag for commissions

Status: PLANNED → **DECIDED** → IN PROGRESS → TESTING → STABLE · 2026-07-24, not yet implemented (current code still reads `utm_content`).

## Context

- Owner pays commission by which posting account (e.g. TikTok account "amy") brought the buyer.
- Built 2026-07-23: account name travels in the marketing link's `utm_content` tag; read only by our own beacon (`components/Beacon.tsx`) via `accountOf()` (`lib/admin/channels.ts`).
- Pre-launch, zero real traffic — switching the tag is free today, expensive after launch.

## Decision

Move the account name to a **dedicated `acct=` query tag** (`...?utm_source=tiktok&acct=amy`).
`utm_content` returns to its conventional "ad variant" meaning. Clean switch, **no fallback** to `utm_content`.

## Options considered

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| Keep `utm_content=amy` (as built) | Zero work; standard UTM param, never stripped by apps | `utm_content` conventionally = ad variant; future Google/Meta ad templates (`utm_content=banner_a`) create fake "salespeople" and silently corrupt the commission report; `accountOf()` can't tell a person from a variant | ❌ |
| Dedicated `acct=amy` | Collision with ad tools impossible by construction; ~10-line change; rides in the beacon's existing `utm` JSON blob — no schema change, no migration; `utm_content` freed for real ad variants | Non-standard param — a rare link-sanitizing app could strip it where it keeps `utm_*` (mitigation: owner click-tests each new link once, checks it appears in Analytics) | ✅ **chosen** |
| `acct=` with `utm_content` fallback | Old links keep working | Fallback re-opens the exact ad-variant corruption being fixed; there are no live links to preserve anyway | ❌ |

## Plan (work items)

| # | File | Change |
|---|---|---|
| 1 | `components/Beacon.tsx` (~line 80) | Add `"acct"` to the captured query keys |
| 2 | `lib/admin/channels.ts` `accountOf()` | Read `utm.acct` instead of `utm_content`; update doc comment |
| 3 | `lib/admin/orders.ts`, `lib/admin/analytics.ts` | Comment wording only — logic already goes through `accountOf()` |
| 4 | `lib/admin/i18n.ts` | Update any `utm_content` mention in admin strings (EN + 中文) |
| 5 | `tests/unit/channel-attribution.test.ts`, `tests/e2e/admin-analytics.spec.ts`, `lib/supabase/seed-data.ts` | Switch test/demo links to `acct=` |
| 6 | USER-GUIDE "Marketing links", `docs/learning/02-posting-account-attribution.md`, SUMMARY.md | Owner's link recipe becomes `...&acct=amy`; add click-test tip |
| 7 | — | Run unit tests + analytics e2e spec, confirm green |

## Related

- Walkthrough: [../learning/02-posting-account-attribution.md](../learning/02-posting-account-attribution.md)
- Owner instructions: [USER-GUIDE → "Marketing links"](../USER-GUIDE.md#marketing-links-for-the-owner)
