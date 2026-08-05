# figma-sync · signup + mepage · 08-02 · `feat/figma-sync`

Agent session hand-off. Open matters first; what the session delivered is at
the bottom. See [`../README.md`](../README.md) for tag meanings and workflow.

---

## AI-019 · `AGENT-DECISION` · the signup page lost its "Sign in" link

**Where:** [Signup screen](../../components/screens/SignupScreen.tsx)

The redesigned frame (1523:3315) deletes the
`Already have an account?  Sign in  ›` link at the bottom of the card, so the
build deletes it too.

*(Updated 08-03: at the time this was raised that link was the page's only
live control. The page is now a working sign-in form, so the stakes are lower
— but the missing link still means a returning customer has no signposted
route to the `/account` login screen.)*

What remains as a way back to `/account`: the header back arrow (fallback
`/account`) and the shared bottom nav's Me tab, which the same frame added.

**Recommendation:** accept it. The frame now reads "Continue with your email",
i.e. one email box that serves both new and returning customers, so a separate
"already have an account" link is arguably the thing the redesign removed on
purpose. Say the word and I will put the link back as a deliberate deviation.

---

---

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

### 08-03 — customer sign-in activated (same branch)

- **`/account/signup` is a working sign-in**, built in the owner's order:
  email input + blur validation → Send code (`signInWithOtp`) → consent
  checkbox gating CONTINUE → 6-digit code input → CONTINUE (`verifyOtp` →
  `/account`). Terms / Privacy Policy link to the `/policies/*` scaffolds.
- **Mail infrastructure, which had to land first.** The emailed link went to
  the site root with nothing to exchange the token, and carried no code —
  because `scripts/apply-auth-email-templates.mjs` had never run, and *could
  not*: Supabase refuses template edits on the free tier while its built-in
  sender is in use. Release-queue #2's order was therefore impossible.
  Configured custom SMTP on Resend (`smtp.resend.com:465`, sender
  `noreply@eldreve.com` / "ELDREVE"), which unlocked templates and lifted the
  cap from ~2 to 30 mails/hour; applied the templates, which now carry both a
  `/auth/confirm?token_hash=…&next=/account` link and the 6-digit code.
- **`mailer_otp_length` 8 → 6.** The project issued 8-digit codes while the
  UI assumed 6, so pasted codes silently truncated and could never verify.
- Added `RESEND_SMTP_PASSWORD` to `.env.example` (held by Supabase, never read
  by our code) beside the existing `RESEND_API_KEY` (read by `lib/email.ts`).
- **DQ-34 answered → AI-021 raised**; OQ-4's `goldrose.co` recommendation is
  moot.
- Every step verified against a running dev server with the Supabase calls
  intercepted, so no real emails were sent and no auth users created during
  development. `tsc` and ESLint clean.
