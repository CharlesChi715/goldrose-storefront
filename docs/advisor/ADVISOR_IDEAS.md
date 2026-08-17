# Agent-advisor — project notebook

> Help me complete my ideas step by step by modifying this file.

## 1. Raw ideas  (brain-dump — write freely here)

> How this works: brain-dump into section 1 whenever, messy is fine.
> Run /idea and the agent sorts it into the sections below.

- Original one-line claim in `docs/agent-advisor.md`: LLM business advisor over
  codebase + marketing copy + vendor + supply-chain (pgvector), answering a
  non-technical owner in business language, proposing changes only as a
  structured patch approved via visual diff, numeric questions routed to typed
  SQL tools. Written past-tense ("Shipped") but nothing is built. → §5, §4
- Build an advisor for teammates/boss to **talk with — chat only**. → §3
- Advisor gets app info **injected in context only when they ask**. Superseded:
  at MVP size the doc is small enough to sit in the system prompt every turn;
  on-demand fetching is deferred. → §3, §5
- Topics: info of this app (only what I allow it to know), how they improve
  their work, or any topic I choose to allow. → §3, §4
- Step 1 — how does the advisor get app info? (a) `GET /app-info` route
  (b) MCP server with `get-app-info` tool. ✔ Neither: chat lives inside the
  admin, so the info goes in the system prompt; both options parked. → §2, §5

## 2. ASCII Workflow map

```
 boss / teammate (China)            Charles (Sydney)
        │  question in ZH or EN             │
        └─────────────────┬─────────────────┘
                          v
        /admin/advisor  ── chat page; history in React state only
                          │  POST { messages: [ ...whole history ] }
                          v
        app/api/advisor/route.ts   ← proxy.ts already guards /admin
                          │
                          ├─ system   = curated app-info doc  (the allowlist)
                          └─ messages = full history + new question
                          │
                          v
        @anthropic-ai/sdk → messages.create   (claude-opus-4-8)
                          │
                          v
        answer in the same language as the question

 Stateless API: no session exists on Anthropic's side. Every turn re-sends
 the system prompt + the entire history. Prompt caching pays off only once
 the prefix exceeds 4,096 tokens (Opus 4.8 minimum).
```

## 3. Must do  (requirements, as they become clear)

- [ ] Chat-only advisor at `/admin/advisor`. It reads and answers; it never
      writes to the app, the database, or the repo.
- [ ] One hand-written, business-language doc is the **entire allowlist** of
      what the advisor may know. Deliberately non-technical — a different
      altitude from `SUMMARY.md` and the feature records, not a duplicate.
- [ ] Send that doc as the system prompt on **every turn** (the API is
      stateless — "session" is our concept, not Anthropic's).
- [ ] Reply in whatever language the question was asked in (ZH ↔ EN).
- [ ] Conversation history lives in browser React state only; lost on refresh.
- [ ] `@anthropic-ai/sdk` with `claude-opus-4-8`; adaptive thinking.
- [ ] `ANTHROPIC_API_KEY` server-side only — `.env.local`, documented in
      `.env.example`. Never reaches the browser.
- [ ] The advisor must say "that isn't in what I've been told" rather than
      guess. It must never state a price, stock level, or sales figure that
      isn't literally in the doc (live figures are parked — see §5).

## 4. Open questions  (things you haven't decided yet)

- Where does the curated doc live? (a) `docs/advisor/app-info.md`
- What does the doc actually cover on day one? "How they improve their work"
  is still too vague to build or test against — needs 3–5 real example
  questions the bosses would genuinely ask. parked.
- Who may open `/admin/advisor` — every admin user, or a separate role? every admin user
- Stream the answer token-by-token, or wait for the full response? token-by-token.
- Cost guard: any per-user or per-day cap? A long chat re-sends the whole
  history each turn, so cost grows with conversation length. each admin add their anthropic api. and shows the cost every turn.
- Does this graduate into `docs/features/agent-advisor.md` (the CI-validated
  status database) once it is real, and does `SUMMARY.md` then link it? not yet. 



## 5. Parked  (ideas set aside — kept, never deleted)

- **Typed SQL tools** for live sales/stock figures — the "figures are read,
  never generated" property. Highest-value next slice after the chat MVP.
- **pgvector retrieval** across codebase, marketing copy, vendor records and
  supply-chain data. Most infrastructure for the least immediate value.
- **Structured patch proposal + visual diff approval.** Flashiest, riskiest —
  it writes to the codebase, and needs retrieval to be useful.
- **MCP server** exposing `get-app-info`. Revisit if the chat client ever
  becomes Claude Desktop or Claude Code instead of our own admin page.
- **`GET /app-info` route.** Unnecessary while the chat runs inside the app —
  it would be our server calling our own server.
- **`get_app_info` tool / on-demand injection.** Revisit when the doc grows
  past roughly 100k tokens, or when topics need to be fetched selectively.
- **Persisting conversations in Supabase.** Revisit to learn what the bosses
  actually ask — that log is the real product research.
