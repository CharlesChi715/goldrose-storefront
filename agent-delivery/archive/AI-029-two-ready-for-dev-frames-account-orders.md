<!-- Closed agent-inbox matter. Private working record — an AI agent
     must ask Charles before reading anything in this folder. -->

## AI-029 · `OWNER-TODO` · two Ready-for-dev order frames have no route in the repo

The repo↔Figma reconciliation (sync rule §5) turned up two frames sitting under
the **Ready-for-dev** section `me二·级` (`1542:1380`) that the repo has never
built:

| Frame      | Name                                          | Repo route |
| ---------- | --------------------------------------------- | ---------- |
| `2439:369` | `/account/orders/delivered · mobile · iPhone 15 Pro Max` | missing    |
| `2439:370` | `/account/orders/review · mobile · iPhone 15 Pro Max`    | missing    |

`1523:3455` (the orders list's second "View details" button) already
prototype-links to `2439:369`, so `/account/orders` has a dead entry point
today.

They are outside a homepage sync, so nothing was built. Everything else
reconciled cleanly: `/account/addresses` and `/gift-guide` have frames that are
**not** Ready-for-dev (still pending, below), `/account/returns/select-reason`
is implemented as a sheet on `/account/returns` rather than a route, and
`/orders`, `/placeholder`, `/checkout/cancel` are the expected technical routes.

**Recommendation:** fold these two into the next `me二·级` pass.

Location: [`app/account/orders/page.tsx`](../../app/account/orders/page.tsx)
- **Closed:** 2026-08-05
- **Why:** done — both frames built 2026-08-05 as /account/orders/delivered (2439:369) and /account/orders/review (2439:370); the orders list's delivered card now reaches the first
