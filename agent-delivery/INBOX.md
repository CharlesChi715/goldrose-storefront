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
| `AI-010` | `AGENT-DECISION` | `OPEN` | Timezone picker sheet (2030:190) not built — the accepted Pacific-only/no-manual-setting comment wins. | [figma-sync-08-02-feat-figma-sync](sessions/figma-sync-08-02-feat-figma-sync.md) | [Reminders screen](../components/screens/RemindersScreen.tsx) |
| `AI-011` | `AGENT-DECISION` | `OPEN` | Date dropdowns ship full day/month ranges — Charles should answer the scroll-wheel question in Figma. | [figma-sync-08-02-feat-figma-sync](sessions/figma-sync-08-02-feat-figma-sync.md) | [Reminder edit modal](../components/screens/ReminderEditModal.tsx) |
| `AI-012` | `PLACEHOLDER`    | `OPEN` | Seven `/policies/*` routes are coming-soon scaffolds until their frames are Ready-for-dev. | [figma-sync-08-02-feat-figma-sync](sessions/figma-sync-08-02-feat-figma-sync.md) | [Scaffold screen](../components/screens/PolicyComingSoon.tsx) |
| `AI-013` | `AGENT-DECISION` | `OPEN` | Two-step checkout carries dev bands (country, cart rows, discount, gift note) and strips the mock shipping prices. | [figma-sync-08-02-feat-figma-sync](sessions/figma-sync-08-02-feat-figma-sync.md) | [Checkout client](../app/checkout/CheckoutClient.tsx) |
| `AI-014` | `OWNER-DECISION` | `OPEN` | `/account/privacy-policy` is orphaned — its frame became the policies hub; decide keep/redirect/retire. | [figma-sync-08-02-feat-figma-sync](sessions/figma-sync-08-02-feat-figma-sync.md) | [Privacy-policy route](../app/account/privacy-policy/page.tsx) |
| `AI-015` | `AGENT-DECISION` | `OPEN` | Returns-flow wiring diverges from the prototype where labels won (Back to Orders, Track Status, Track Package). | [figma-sync-08-02-feat-figma-sync](sessions/figma-sync-08-02-feat-figma-sync.md) | [Request-submitted screen](../components/screens/returns/RequestSubmittedScreen.tsx) |

## Session files

| Session file                                                             | Open | Delivered                                        |
| ------------------------------------------------------------------------ | ---- | ------------------------------------------------ |
| [figma-sync-08-02-feat-figma-sync](sessions/figma-sync-08-02-feat-figma-sync.md) | 6    | 08-02 sync: two-step checkout, returns flow, date pickers, policies hub + scaffolds, security/signup/dashboard/login re-imports. |
| [figma-sync-08-01-feat-figma-sync-0801](sessions/figma-sync-08-01-feat-figma-sync-0801.md) | 1    | 08-01 sync: timezone → Pacific; me三级 pulled back by design. |
| [figma-sync-07-31-feat-figma-sync-0731](sessions/figma-sync-07-31-feat-figma-sync-0731.md) | 2    | 07-31 Figma sync: reminders toggle states, returns scaffold, prototype-map review. |
| [agent-delivery-restructure-07-31-feat-blog-journal-import](sessions/agent-delivery-restructure-07-31-feat-blog-journal-import.md) | 1    | Split the inbox into per-session markdown files. |
| [initial-inbox-07-30](sessions/initial-inbox-07-30.md)                   | 5    | Seeded the first five matters and their tags.    |
