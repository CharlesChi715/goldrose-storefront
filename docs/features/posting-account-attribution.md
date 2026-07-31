---
schemaVersion: 1
id: posting-account-attribution
kind: feature
parent: admin-analytics
area: backend
order: 30

delivery: uat
rollout: test-deployment
priority: p1
target: v1-launch
owner: charles
statusChangedAt: 2026-07-24

dependsOn: []
blockedBy: []

verification:
  automated:
    - tests/unit/channel-attribution.test.ts
    - tests/e2e/admin-analytics.spec.ts
  human: null
---

# Posting-account attribution — link tag for commissions

> Naming note: drafted as `acct=`; owner chose **`utm_acc`** at implementation
> time (2026-07-24) — same family look as the other tags, still not a standard
> UTM param, so ad tools won't touch it. Everything below reads `utm_acc`.

## Context

- Owner pays commission by which posting account (e.g. TikTok account "amy") brought the buyer.
- Built 2026-07-23: account name travels in the marketing link's `utm_content` tag; read only by our own beacon (`components/Beacon.tsx`) via `accountOf()` (`lib/admin/channels.ts`).
- Pre-launch, zero real traffic — switching the tag is free today, expensive after launch.

## Decision

Move the account name to a **dedicated `utm_acc=` query tag** (`...?utm_source=tiktok&utm_acc=amy`).
`utm_content` returns to its conventional "ad variant" meaning. Clean switch, **no fallback** to `utm_content`.

## Options considered

| Option                              | Pros                                                                                                                                                                                           | Cons                                                                                                                                                                                                                       | Verdict       |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| Keep `utm_content=amy` (as built)   | Zero work; standard UTM param, never stripped by apps                                                                                                                                          | `utm_content` conventionally = ad variant; future Google/Meta ad templates (`utm_content=banner_a`) create fake "salespeople" and silently corrupt the commission report; `accountOf()` can't tell a person from a variant | ❌            |
| Dedicated `acct=amy`                | Collision with ad tools impossible by construction; ~10-line change; rides in the beacon's existing `utm` JSON blob — no schema change, no migration; `utm_content` freed for real ad variants | Non-standard param — a rare link-sanitizing app could strip it where it keeps `utm_*` (mitigation: owner click-tests each new link once, checks it appears in Analytics)                                                   | ✅ **chosen** |
| `acct=` with `utm_content` fallback | Old links keep working                                                                                                                                                                         | Fallback re-opens the exact ad-variant corruption being fixed; there are no live links to preserve anyway                                                                                                                  | ❌            |

## Acceptance criteria

- [x] A visit via `...?utm_acc=amy` records `amy` as the posting account on the session and any resulting order.
- [x] `utm_content` is ignored for account attribution (pinned by a unit test).
- [x] Admin Analytics groups sales/commission figures by posting account.
- [x] The empty-account label in Analytics says `utm_acc` in both EN and 中文.
- [x] Owner's link recipe in TESTER-GUIDE reads `...&utm_acc=amy` with the click-test tip.
- [ ] Owner builds one real `utm_acc` link, clicks it, and sees the account appear in Analytics (human acceptance → VERIFIED).

## Plan

All done 2026-07-24 (tag named `utm_acc`):

| #   | File                                                                                                       | Change                                                                        |
| --- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1   | `components/Beacon.tsx` (~line 80)                                                                         | ✅ Added `"utm_acc"` to the captured query keys                               |
| 2   | `lib/admin/channels.ts` `accountOf()`                                                                      | ✅ Reads `utm.utm_acc` instead of `utm_content`; doc comment updated          |
| 3   | `lib/admin/orders.ts`, `lib/admin/analytics.ts`                                                            | ✅ Comment wording only — logic already goes through `accountOf()`            |
| 4   | `lib/admin/i18n.ts`                                                                                        | ✅ `analytics.emptyAccount` EN + 中文 now say `utm_acc`                       |
| 5   | `tests/unit/channel-attribution.test.ts`, `tests/e2e/admin-analytics.spec.ts`, `lib/supabase/seed-data.ts` | ✅ Switched to `utm_acc`; new unit test pins "utm_content is ignored"         |
| 6   | TESTER-GUIDE "Marketing links", `docs/learning/02-posting-account-attribution.md`, SUMMARY.md              | ✅ Owner's link recipe is `...&utm_acc=amy`; click-test tip added (EN + 中文) |
| 7   | —                                                                                                          | ✅ Unit tests + analytics e2e spec green                                      |

## Blockers and dependencies

None. The only step left is human acceptance (owner click-test), which is the UAT → VERIFIED gate, not a blocker.

## Verification evidence

- Automated: `tests/unit/channel-attribution.test.ts` and `tests/e2e/admin-analytics.spec.ts` green on 2026-07-24 (includes the "utm_content is ignored" pin).
- Human: pending — owner to click a real `utm_acc` link on the test deployment and confirm the account shows in Admin → Analytics. Record verifier, date, and environment here when done.

## Related links

- Walkthrough: [../learning/02-posting-account-attribution.md](../learning/02-posting-account-attribution.md)
- Owner instructions: the tester guide's "Marketing links" section (since retired, in git history)
