# BLUEPRINT — Agent-advisor

## 1. Design

Building an advisor for teammates/boss to talk with(chat only). 

- main topics about: (or any topics just i give the advisor whatever i allow it to know)
    - the info of this app (only the info i allow advisor to know)
    - how they improve their work 
    ...

- page in admin: /admin/advisor

- Always reply in the same language as the user's last message.

- **API key** — each admin pastes their own Anthropic key once, in admin
  settings, over HTTPS. The server looks it up per request from Supabase
  Vault, not a plain column — the decryption key lives outside the table, and
  RLS scopes each row to its owner so one admin can never read another's. It
  crosses the browser exactly once: never in the chat POST, never logged.

- **Key lifecycle** — an admin can overwrite their own key at any time. When a
  call fails the page names why in their language — invalid key, billing, rate
  limit, Anthropic down — and only the invalid case points at the key field.
  No key saved = plain refusal, never another admin's key.





## 2. ASCII chart

```
                  question in ZH or EN
                          │
                          v
        /admin/advisor ─── chat page, takes the question
                          │
                          │  POST { messages: [ ...whole history ] }
                          v
        our server ─────── looks up this admin's key
                           system   = app-info doc  (the allowlist)
                           messages = history + new question
                          │
                          v
        anthropic sdk ──── messages.create( claude-opus-5 )
                          │
                          │  answer, same language as the last message
                          v
        our server ------ receive the answer
                          │
                          │  better display
                          v
        /admin/advisor ─── shows it
```

## 3. Parked

