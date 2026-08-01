# GoldRose Agent Inbox

Index of every unresolved, actionable matter waiting on Charles. The detail
lives in the session file that raised it, under [`sessions/`](sessions). Read
[`README.md`](README.md) for the tag definitions and workflow.

## Open matters

| ID       | Tag              | Status | Short message                                                                               | Raised in                                                                     | Affected place                                                                               |
| -------- | ---------------- | ------ | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `AI-001` | `OWNER-DECISION` | `OPEN` | Confirm the real rest-of-world shipping rate.                                               | [initial-inbox-07-30](sessions/initial-inbox-07-30.md) | [Shipping seed setting](../lib/supabase/seed-data.ts#L331)                                   |
| `AI-002` | `PLACEHOLDER`    | `OPEN` | The `/bag` screen shows designed example items instead of the real cart.                    | [initial-inbox-07-30](sessions/initial-inbox-07-30.md) | [Bag route](../app/bag/page.tsx#L8)                                                          |
| `AI-003` | `OWNER-TODO`     | `OPEN` | Supply and approve the real privacy-policy content.                                         | [initial-inbox-07-30](sessions/initial-inbox-07-30.md) | [Privacy-policy route](../app/account/privacy-policy/page.tsx#L5)                            |
| `AI-004` | `OWNER-TODO`     | `OPEN` | The delivery routing table is empty, so agents cannot file a parse result.                  | [initial-inbox-07-30](sessions/initial-inbox-07-30.md) | [Team deliveries README](../team-deliveries/README.md#L50)                                   |
| `AI-005` | `AGENT-UNSURE`   | `OPEN` | Unclear whether the Figma naming spreadsheet is an incoming delivery or a generated export. | [initial-inbox-07-30](sessions/initial-inbox-07-30.md) | [Naming-guide batch](../team-deliveries/originals/2026-07-25-figma-naming-guide/batch.md#L16) |
| `AI-006` | `OWNER-DECISION` | `OPEN` | Confirm or rename the `sessions/` folder before its name spreads through the code. | [agent-delivery-restructure-07-31-feat-blog-journal-import](sessions/agent-delivery-restructure-07-31-feat-blog-journal-import.md) | [`agent-delivery/sessions/`](sessions) |
| `AI-007` | `PLACEHOLDER`    | `OPEN` | `/account/returns/request-submitted` is a coming-soon scaffold until its frame is Ready-for-dev. | [figma-sync-08-01-feat-figma-sync-0801](sessions/figma-sync-08-01-feat-figma-sync-0801.md) | 1    | 08-01 sync: timezone → Pacific; me三级 pulled back by design. |
| [figma-sync-07-31-feat-figma-sync-0731](sessions/figma-sync-07-31-feat-figma-sync-0731.md) | [Scaffold route](../app/account/returns/request-submitted/page.tsx#L1) |
| `AI-008` | `AGENT-DECISION` | `OPEN` | Prototype links that would fake live features (cart→/bag, pay→keepsake, inert Save/submit) were not adopted. | [figma-sync-07-31-feat-figma-sync-0731](sessions/figma-sync-07-31-feat-figma-sync-0731.md) | [Cart icon comment](../components/chrome.tsx#L269) |
| `AI-009` | `AGENT-DECISION` | `OPEN` | Reminders timezone shows `PST (UTC−8)` — Pacific accepted by Charles, exact offset unanswered by design. | [figma-sync-08-01-feat-figma-sync-0801](sessions/figma-sync-08-01-feat-figma-sync-0801.md) | [Reminders screen](../components/screens/RemindersScreen.tsx) |

## Session files

| Session file                                                             | Open | Delivered                                        |
| ------------------------------------------------------------------------ | ---- | ------------------------------------------------ |
| [figma-sync-07-31-feat-figma-sync-0731](sessions/figma-sync-07-31-feat-figma-sync-0731.md) | 2    | 07-31 Figma sync: reminders toggle states, returns scaffold, prototype-map review. |
| [agent-delivery-restructure-07-31-feat-blog-journal-import](sessions/agent-delivery-restructure-07-31-feat-blog-journal-import.md) | 1    | Split the inbox into per-session markdown files. |
| [initial-inbox-07-30](sessions/initial-inbox-07-30.md)                   | 5    | Seeded the first five matters and their tags.    |
