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
| `AI-008` | `AGENT-DECISION` | `OPEN` | Prototype links that would fake live features (cart→/bag, pay→keepsake, inert Save/submit) were not adopted. | [figma-sync-07-31-feat-figma-sync-0731](sessions/figma-sync-07-31-feat-figma-sync-0731.md) | [Cart icon comment](../components/chrome.tsx#L269) |
| `AI-011` | `OWNER-TODO`     | `OPEN` | Relay two prepared replies to the design team in Figma — the repo's read-only token cannot post them. | [figma-sync-08-02-feat-figma-sync](sessions/figma-sync-08-02-feat-figma-sync.md) | [Reminder edit modal](../components/screens/ReminderEditModal.tsx) |
| `AI-012` | `PLACEHOLDER`    | `OPEN` | Seven `/policies/*` routes are coming-soon scaffolds until their frames are Ready-for-dev. | [figma-sync-08-02-feat-figma-sync](sessions/figma-sync-08-02-feat-figma-sync.md) | [Scaffold screen](../components/screens/PolicyComingSoon.tsx) |
| `AI-013` | `AGENT-DECISION` | `OPEN` | The checkout rebuild adds four controls the new design left out (country, quantity/remove, discount, gift message). | [figma-sync-08-02-feat-figma-sync](sessions/figma-sync-08-02-feat-figma-sync.md) | [Checkout client](../app/checkout/CheckoutClient.tsx) |
| `AI-016` | `AGENT-UNSURE`   | `OPEN` | `/products/[slug]` still renders the July frame (2501px); the Ready-for-dev PDP redesign (1523:3971, 1616px) was never imported. | [figma-sync-08-02-feat-figma-sync](sessions/figma-sync-08-02-feat-figma-sync.md) | [PDP route](../app/products/%5Bslug%5D/page.tsx) |
| `AI-017` | `AGENT-BLOCKED`  | `OPEN` | Nothing in the live site can change cart quantity or remove a line — wire `/bag` to the real cart. | [figma-sync-08-02-feat-figma-sync](sessions/figma-sync-08-02-feat-figma-sync.md) | [Checkout client](../app/checkout/CheckoutClient.tsx) |

## Session files

| Session file                                                             | Open | Delivered                                        |
| ------------------------------------------------------------------------ | ---- | ------------------------------------------------ |
| [figma-sync-08-02-feat-figma-sync](sessions/figma-sync-08-02-feat-figma-sync.md) | 5    | 08-02 sync: two-step checkout, returns flow, date pickers, policies hub + scaffolds, security/signup/dashboard/login re-imports; auto 冬令时/夏令时 timezone. |
| [figma-sync-08-01-feat-figma-sync-0801](sessions/figma-sync-08-01-feat-figma-sync-0801.md) | 1    | 08-01 sync: timezone → Pacific; me三级 pulled back by design. |
| [figma-sync-07-31-feat-figma-sync-0731](sessions/figma-sync-07-31-feat-figma-sync-0731.md) | 2    | 07-31 Figma sync: reminders toggle states, returns scaffold, prototype-map review. |
| [agent-delivery-restructure-07-31-feat-blog-journal-import](sessions/agent-delivery-restructure-07-31-feat-blog-journal-import.md) | 1    | Split the inbox into per-session markdown files. |
| [initial-inbox-07-30](sessions/initial-inbox-07-30.md)                   | 5    | Seeded the first five matters and their tags.    |
