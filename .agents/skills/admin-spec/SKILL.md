---
name: admin-spec
description: "The authoritative ELDREVE requirements spec (docs/admin-design.md) and its § numbering. Use BEFORE building or changing anything in /admin, checkout, payments, the data model, or an editable-content slot — the § says what is required, what is deliberately out of scope, and which rules a screen must honour. Triggers: admin screen, Shopify clone, §9/§10/§7 reference, checkout flow, data model, product/order/customer/discount/content admin, acceptance criteria, what is the spec."
metadata:
  author: charles
  version: "1.0.0"
---

# The requirements spec

[`docs/admin-design.md`](../../../docs/admin-design.md) is **authoritative**. A
`§` reference anywhere in this repo — code comment, PR, feature record — points
into it. Read the § before implementing; write the § number in the change.

## What lives where in it

| §    | Contents                                                                                                            |
| ---- | ------------------------------------------------------------------------------------------------------------------- |
| 3    | Goals, constraints, and the deliberate **cut list** (non-goals)                                                     |
| 6    | Architecture: where data lives, system diagram, security rules                                                      |
| 7    | Data model — one subsection per table (`7.1` products … `7.13` RLS)                                                 |
| 8    | Storefront integration; `8.1` SEO/GEO                                                                               |
| 9    | The admin app, screen by screen (`9.4` orders, `9.5` products, `9.8` content, `9.8.1` Home page, `9.9` analytics …) |
| 10   | Checkout and payments, refunds, webhooks, environments                                                              |
| 11   | **Pixel-perfection vs editable content** — the rule for any Figma-imported string                                   |
| 13   | Environments and configuration                                                                                      |
| 14.3 | Final acceptance — the owner walkthrough that gates ACCEPTED                                                        |
| 16   | Future work (V2) — check here before proposing something "new"                                                      |

## Rules it imposes on any change

- Admin strings go through `t()` — English **and** Shopify-style Chinese.
- Every exported `lib/` function needs JSDoc.
- Money is integer cents; orders are **never** hard-deleted.
- The service-role key stays server-side; Supabase config is fully present or
  fully absent.
- §11 decides whether a string is pixel-frozen artwork or an editable slot —
  do not invent a third answer.

## Related

- Feature status for anything specified here: the `project-docs` skill.
- The Home page editor (§9.8.1) also has a record:
  `docs/features/home-content-admin.md`.
