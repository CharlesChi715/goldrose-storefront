<!-- Closed agent-inbox matter. Private working record — an AI agent
     must ask Charles before reading anything in this folder. -->

## AI-020 · `AGENT-UNSURE` · two working doors into the same sign-in

**Where:** [Signup route](../../app/account/signup/page.tsx)

*(Narrowed 08-03 — the CONTINUE-destination half is settled; the duplication
question is not.)*

The frame is a unified email entry point ("Continue with your email", no name
or password field), but its **name** still says
`loginpage-Create a shopping account` and the **route** is still
`/account/signup`. Its only prototype interaction — CONTINUE (2436:377) — was
a `NAVIGATE` with a **null destination**, so the design never said where
continuing goes; we wired it to `verifyOtp` → `/account`, matching the login
screen.

What remains open is the real problem: **`/account/signup` is now a fully
working email sign-in, and so is the signed-out `/account` screen**
(`ShoppingLogin`, frame 1523:2470). Two live doors into the same Supabase
flow, with separate copy, separate validation and separate error strings to
keep in sync.

**Recommendation:** ask the design team whether 1523:3315 supersedes
1523:2470. If it does, retire `ShoppingLogin`'s form and let `/account` render
this screen when signed out — one implementation, one set of copy. If it does
not, we need to know what distinguishes them, because today nothing does.
Their answer also decides whether the route gets renamed under the
[route rule](../../docs/ixd/naming/figma-route-rule.md).
- **Closed:** 2026-08-04
- **Why:** answered 2026-08-04 (owner): /account/signup is the ONLY login page. /account is signed-in only and redirects there; the second login screen (ShoppingLogin, frame 74:53) is deleted.
