For agents: keep this file concise. 

1. Current Supabase. based on postgreSQL which is free and open source.
    Free tier ($0/month) covers your current scale comfortably — 500 MB of database is literally years of orders for a gift store. The next tier is ~US$25/month, and you'd only need it once traffic is real. Compare that to the Shopify subscription you're replacing (Advanced runs ~US$399/month): even the paid tier is a rounding error.

2. Rent a small server (~US$5–10/month) and install Postgres yourself

---

**DECISION (owner, 2026-07-22): Option 1 — Supabase.** No self-hosted
Postgres. The code already targets it (hosted Supabase backend + local file
fallback); what remains is the activation checklist in
[BUILD-REPORT.md](BUILD-REPORT.md) §5 step 1 (create the Supabase project and
set the env vars).