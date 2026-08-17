# Agent-advisor — project notebook

> Help me complete my ideas step by step by modifying this file.
> Every turn of edition of this file, at most 3 lines.

## 1. Raw ideas  (brain-dump — write freely here)

> How this works: brain-dump into section 1 whenever, messy is fine.
> Run /idea and the agent sorts it into the sections below.

- Shipped an LLM business advisor based on Anthropic APIs that retrieves across the codebase, marketing copy, vendor records and supply-chain data (pgvector) and answers a non-technical owner in business language — constrained to propose changes only as a structured patch approved via visual diff, with numeric questions routed to typed SQL tools so sales and stock figures are read, never generated.


--- Initial decision ----
Building an advisor for teammates/boss to talk with(chat only). 

main topics about: (or any topics just i give the advisor whatever i allow it to know)
    - the info of this app (only the info i allow advisor to know)
    - how they improve their work 
    ...



--- ALL draft ideas could be revised ----
Steps: 
1. how advisor get the info of this app? (right now on MVP where advisor get sent all the info of the app that i allow advisor to know)
   1. system prompt
   2. route? GET 
      1. GET /app-info : 
   3. mcp server
      1. tool: get-app-info


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
- **a chat widget** the floating button in the right side bar. it expands to a floating window(i can drag to resize it) after clicking.
and the advisor get info of app injected in context only when they ask to. 