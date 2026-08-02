# figma-sync · signup + mepage · 08-02 · `feat/figma-sync`

Agent session hand-off. Open matters first; what the session delivered is at
the bottom. See [`../README.md`](../README.md) for tag meanings and workflow.

---

## AI-019 · `AGENT-DECISION` · the signup page lost its "Sign in" link

**Where:** [Signup screen](../../components/screens/SignupScreen.tsx)

The redesigned frame (1523:3315) deletes the
`Already have an account?  Sign in  ›` link at the bottom of the card, so the
build deletes it too. That link was the page's **only live control** — the
page is otherwise an inert visual placeholder until customer-auth activation.

What remains as a way back to the working sign-in flow on `/account`: the
header back arrow (fallback `/account`) and the shared bottom nav's Me tab,
which the same frame just added.

**Recommendation:** accept it. The frame now reads "Continue with your email",
i.e. one email box that serves both new and returning customers, so a separate
"already have an account" link is arguably the thing the redesign removed on
purpose. Say the word and I will put the link back as a deliberate deviation.

---

## AI-020 · `AGENT-UNSURE` · the signup frame is no longer a signup page

**Where:** [Signup route](../../app/account/signup/page.tsx)

Three things now disagree with each other:

- The **frame content** is a unified email entry point: "Continue with your
  email" / "Enter your email to continue" / CONTINUE, with no name field and
  no password.
- The **frame name** still says `loginpage-Create a shopping account`, and the
  **route** is still `/account/signup` with the page title
  "Create account — GoldRose".
- The frame's **only prototype interaction** — CONTINUE (2436:377) — is a
  `NAVIGATE` action with a **null destination**, so the design has not said
  where continuing goes.

Left exactly as-is: route unchanged, button inert, nothing renamed. I did not
guess whether this page is meant to replace the `/account` sign-in screen or
sit beside it.

**Recommendation:** ask the design team two things — (1) where CONTINUE goes,
and (2) whether this frame supersedes the signed-out `/account` login frame
(1523:2470), which still has its own separate email + code form. If it does,
`/account/signup` should be re-pointed or merged rather than kept as a second
door into the same flow. Their answer decides whether the route gets renamed
under the [route rule](../../docs/ixd/naming/figma-route-rule.md).

---

## Delivered this session

- Scoped sync of exactly the two frames Charles named, both under the
  Ready-for-dev section `me一级` (1523:3313).
- **`/account/signup`** re-imported from 1523:3315: hero → "Continue with your
  email", subcopy replaced, card title → "Enter your email to continue", the
  **Full name field removed at source** (email + code only, moved up to
  y400/y474), button → **CONTINUE** at y829, the "Sign in ›" link dropped
  (AI-019), and a **bottom navigation band added** — Charles's "加一下nav吧"
  comment, delivered — so the canvas grew 932 → 974 and the screen renders the
  shared fixed tab bar.
- **`/account` (signed in)** re-imported from the frame's new id **2210:310**
  (it replaced 1523:2536 inside the marked section, which supersedes the
  morning pass's "left untouched" note): **Custom Archive is back**, so the
  tiles are four again on the x16/115.5/215/314.5 grid, and the inert
  **"Address Management ›" row and its separator are gone at source** and were
  removed from the build. This also retires the standing team directive
  "删掉Custom Archive这个框的内容" — the team put the tile back themselves.
- **Greeting now names the real visitor** (owner instruction, not the frame):
  `displayNameOf()` falls back to the **full email address** instead of the
  email's local part, so a customer with no profile name is greeted
  "Hello, name@example.com". Accounts made by the email-code flow carry no
  name metadata, so that is the common case; the greeting box already
  ellipsises and the avatar takes the address's first letter.
- Verified by driving the dev server and screenshotting both pages against the
  scale-2 Figma renders; `tsc --noEmit` and ESLint are clean.
- Details in [`docs/ixd/README.md`](../../docs/ixd/README.md) § "08-02 second
  sync (scoped) — signup + mepage".
