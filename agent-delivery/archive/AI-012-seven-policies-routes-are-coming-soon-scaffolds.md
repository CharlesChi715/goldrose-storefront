<!-- Closed agent-inbox matter. Private working record — an AI agent
     must ask Charles before reading anything in this folder. -->

## AI-012 · `PLACEHOLDER` · seven /policies/* routes are coming-soon scaffolds

- **Where:** [`components/screens/PolicyComingSoon.tsx`](../../components/screens/PolicyComingSoon.tsx)
  and the routes under [`app/policies/`](../../app/policies).
- **What:** the Ready-for-dev POLICIES-LEGAL hub (1523:1136 →
  `/account/policies-legal`) links seven policy pages whose frames are NOT
  Ready-for-dev (2118:239/241/242/243/244/245, 2127:238). Per the scaffold
  rule each destination renders a quiet coming-soon state so the hub's
  navigation works without importing un-final design.
- **Resolution:** import each page when its frame is marked; the scaffold
  component then retires.
- **Charles (08-02):** "yes just leave it untouched." Confirmed — the
  scaffolds stay exactly as they are until the frames are marked.
- **⚠️ When `/policies/privacy` (2118:244) is imported:** point
  `/account/privacy-policy` at it with a redirect and retire the old
  accordion screen — decided with Charles 08-02 under AI-014.
- **Closed:** 2026-08-18
- **Why:** Six of the seven /policies/* routes were built from their now-Ready frames in the 2026-08-18 sync; /policies/contact-legal was built 2026-08-06. The only scaffold left is /blog, which AI-026 already owns.
