<!-- Closed agent-inbox matter. Private working record — an AI agent
     must ask Charles before reading anything in this folder. -->

## AI-050 · `OWNER-TODO` · three refunded sandbox orders hold 4 units of live stock

The 2026-09-20 walkthrough placed three real sandbox orders in the **live
database** — `#1018`, `#1019`, `#1021`. Every payment was refunded in full at
Stripe and the webhook synced each to `refunded`, so no money is outstanding.
The stock is: `GR-ROSE-RED-SOL-RUBY` is **down 4 units** on three `order`
movements, and refunding never restocks.

House rule D13 (sandbox orders are cancelled and restocked, tagged `sandbox`,
then archived — never hard-deleted) needs an admin session, which an agent
does not have. In `/admin` → each order → **Cancel**, tick *Restock items*,
then tag `sandbox` and archive.

Location: [`docs/features/card-payments.md`](../../docs/features/card-payments.md)
(walkthrough evidence).
- **Closed:** 2026-09-20
- **Why:** done 2026-09-20: Charles cancelled, restocked, tagged and archived all three sandbox orders in /admin — verified against the hosted database, four return_restock movements matching the four order movements, net stock zero
