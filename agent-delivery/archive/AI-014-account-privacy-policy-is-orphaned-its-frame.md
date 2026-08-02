<!-- Closed agent-inbox matter. Private working record — an AI agent
     must ask Charles before reading anything in this folder. -->

## AI-014 · `OWNER-DECISION` · /account/privacy-policy is orphaned — `ANSWERED`

- **Where:** [`app/account/privacy-policy/page.tsx`](../../app/account/privacy-policy/page.tsx).
- **What:** its frame (1523:1136) was rebuilt at source into the
  POLICIES-LEGAL hub, and the designed privacy policy is now the unmarked
  `/policies/privacy` (2118:244). The old accordion screen still renders but
  no designed screen backs it, and once 2118:244 is marked there will be two
  privacy policies.
- **Charles (08-02):** "u r right" — keep the old route until
  `/policies/privacy` is really imported, then redirect it there and retire
  the accordion screen. The instruction is carried in AI-012's entry (the
  policy-pages tracker) and in `docs/ixd/README.md` § 08-02 so whoever
  imports 2118:244 does the redirect in the same change.
- **Closed:** 2026-08-02
- **Why:** answered — keep /account/privacy-policy until /policies/privacy (2118:244) imports, then redirect; instruction carried in AI-012 + docs/ixd 08-02
