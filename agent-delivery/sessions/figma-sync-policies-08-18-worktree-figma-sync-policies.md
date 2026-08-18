# figma-sync (policies) · 2026-08-18 · `worktree-figma-sync-policies`

Ran the read pipeline against file version `2385988852413855782`. Scope came
back **5 added, 42 modified, 1 removed** — the same numbers the 08-10 sync
saw, and for the same reason: the baseline is still stamped at 2026-08-05.

**There was no new delivery.** The file's `lastModified` is
`2026-08-10T07:01:35Z` and today's live version-check was a cache hit, so the
design team has not touched a frame since the last sync. Four of the five
"added" frames were already imported (the empty bag `2976:375` and both
address sheets `2134:299` / `2610:373` are named in `BagScreen.tsx` and
`AddressSheet.tsx`). What this sync did was clear backlog.

**What no command was reporting.** `figma:unbuilt` said 0 and `figma:routes`
was clean, yet **six Ready-for-dev policy frames had never been built**. Both
checks are satisfied by a route *existing*, and a `PolicyComingSoon` scaffold
is a route. The six frames — `2118:239`, `2118:241`, `2118:242`, `2118:243`,
`2118:244`, `2127:238`, between 932 and 1861 tall — were marked ready at some
point after 2026-08-02 and sat behind "This page is coming soon." The blind
spot is now written into the design-sync state; when a frame turns ready,
check what the route *renders*, not that it exists.

---

## AI-046 · `OWNER-DECISION` · the policy copy commits us to terms the bosses have not agreed

The six documents are not decoration. Imported verbatim, they bind ELDREVE to:

- a **30-day return window** from delivery, and a **7-day** window to report
  damage or missing items (Policy A §1, §4);
- **1–3 business days** processing for made-to-order items and **3–7** for
  standard ones, plus a 30-day delay-and-refund rule (Policy B §2, §5);
- a **one-year limited warranty** (Policy C §2);
- **arbitration** of disputes, with 30 days' notice before a claim (Policy D
  §16).

SUMMARY's own hard gate says a live page "may never state a price, stock
level, delivery date or policy we cannot honour", and none of these has been
agreed. So the pages are **built and reachable but every route still ships
`robots: { index: false }`** — a customer who follows a link sees the real
document; search engines and AI assistants do not index it yet.

The frames also arrived unfinished in ways only the business can close.
Sixteen bracketed placeholders across the six documents:
`[LEGAL ENTITY NAME]`, `[BUSINESS MAILING ADDRESS]`, `[WEBSITE URL]`,
`[SUPPORT EMAIL]` ×6, `[PRIVACY EMAIL]`, `[LEGAL NOTICE EMAIL]`, `[PHONE]` ×2
and `[STATE]`. The import answers what the repo owns from the `store` setting
(entity name, contact address, the website), so those stay owner-editable at
`/admin/settings` rather than baked into code. **Three have no answer** and
render as a visible italic "to be confirmed":

| Token             | Why it is unanswered                                              |
| ----------------- | ----------------------------------------------------------------- |
| `governingState`  | Which state's law governs arbitration — a legal choice (Policy D §16) |
| `phone`           | There is no phone number in the `store` setting, and inventing one on a policy page is a claim we cannot honour |
| `postalAddress`   | `address_lines` is still blank — the same gap as AI-033           |

Warranty-care additionally shipped `Last updated: [MAY 20, 2024]` — a
bracketed *fake* date, worse than an empty one because it looks real. No
document shows a design-supplied date; all six show the date the copy was
imported (`POLICIES_LAST_UPDATED`).

**Recommendation:** have the bosses read the six pages as built, confirm or
amend the four commitments above, answer the three tokens, and then the
`robots: { index: false }` line comes out of the six route files in one
commit. Until then this is a reachable, honest draft rather than a published
policy.

Location: [`lib/policies/documents.ts`](../../lib/policies/documents.ts),
[`lib/policies/tokens.ts`](../../lib/policies/tokens.ts),
[`app/policies/terms-of-service/page.tsx`](../../app/policies/terms-of-service/page.tsx)

---

## Pending from design

- **A scratch frame is marked Ready-for-dev.** `2974:359`, named "EE", is a
  430×228 offcut holding two fragments already built elsewhere — a newsletter
  title/body pair and an account welcome card. Nothing links to it and it is
  not a page, but because it carries the ready mark the pipeline will keep
  proposing it every sync. Ask the design team to un-mark or delete it. Not
  filed as a matter: there is no code it is about.
- **`2127:238` is named `SCROLL-CONTENT`, not its route.** It is
  `/policies/email-sms-terms` — titled "Email & SMS Terms", carrying the
  Policy G code — but the name breaks the route rule, so `figma:routes`
  reported it as drift in both directions. Added to the drift allowlist;
  remove that entry if the frame is ever renamed.
- **The design file is a version behind on brand strings** (AI-037): the six
  policy frames say "GoldRose" 24 times. Treated as stale, per the rule, and
  the import writes ELDREVE.
- **Policy F is missing.** The documents are coded A, B, C, D, E, G, and
  contact-legal is J. Either a document was cut or the codes are not a
  sequence; worth one question to the team.
- **`/craft`, `/story` and `/blog` are still scaffold targets** — linked from
  the Ready-for-dev homepage, none itself ready (AI-012's policy half is now
  closed; AI-026 and AI-038 still cover `/blog` and `/story`).
- **Route drift, unchanged and unactioned:** `/account/business`,
  `/account/privacy-policy` and `/blog` have no frame; `/gift-guide`
  (`1942:182`) has no route.
- **Two unresolved comment threads, neither the agent's:** Charles's own
  "我试试" on the date-field dropdown, and the design team's
  "这个先设定为固定值" on the reminders edit modal.

---

## Delivered this session

- **Six policy documents built** from their Ready-for-dev frames, replacing
  the coming-soon scaffolds: Returns/Refunds/Cancellations (Policy A, 9
  sections), Shipping & Delivery (B, 8), Limited Warranty & Care (C, 7), Terms
  of Service (D, 18), Privacy (E, 11), Email & SMS Terms (G, 4) — **57
  sections** in all.
- **The copy is generated, not transcribed.**
  [`scripts/figma/import-policies.mjs`](../../scripts/figma/import-policies.mjs)
  (`npm run figma:policies`) reads the cached frames and emits
  `lib/policies/documents.ts`; `--check` fails if the committed file has
  drifted from the design. For 57 sections of warranty and arbitration clauses
  this matters more than layout does: a hand-transcription drops a "not"
  somewhere and nobody diffs a legal clause. Regenerating after the script was
  committed produced **byte-identical copy**.
- **One renderer, six pages.** All six frames draw the same document, so
  `PolicyDocumentScreen` renders them from data: 26/31 Playfair title, the
  broken gold rule with its diamond, the "Policy X" pill, then 402-wide cards
  inset 14 with 10px padding, 7px gaps, a 28px gold disc, a 304 copy column
  and a 30px icon at x=376.
- **Deliberately NOT a `ScaleFrame`.** Every other imported screen declares a
  height and clips with `overflow: hidden`. These cannot: their height is the
  sum of wrapped body copy, which changes whenever a `{token}` resolves. A
  canvas one line too short would silently clip a warranty exclusion — the one
  failure mode a legal page must not have. The frames' metrics are reproduced
  exactly; only the heights flow.
- **37 section icons exported** from Figma's own renderer at 2× into
  `public/eldreve/screens/` (~45KB total). The `assets` detector descends into
  each icon's child vectors and would have split a two-path icon into two
  files, so `render` was used instead — one composed PNG per icon, drawn at
  its 30×30 ink size.
- **The 10.5px trap.** Body copy is **10.5/14**, which `--outline` rounds to 11
  and which reads visibly heavier if taken at face value — the same trap
  `AddressSheet` documents. Taken from the REST `style` block.
- **Two stale docblocks corrected.** `PolicyComingSoon` claimed "none is
  marked Ready-for-dev" (six now are; only `/blog` still uses it) and
  `ContactLegalScreen` claimed its frame was not ready (`2118:245` is ready,
  and was deliberately not imported — the page reads company details from
  settings and hides blanks, which a verbatim import would hard-code and
  re-open the gap that cost a rejected TikTok application).
- **AI-012 closed** — its premise, seven scaffolded `/policies/*` routes, no
  longer holds.
- **Verified:** 231 unit tests (10 new, asserting the dead brand name and the
  frames' brackets can never reach a reader, that every `{token}` is one the
  resolver knows, and that each section's icon file exists); 11 new e2e tests
  covering all six routes, the hub links, the mailto resolution, the
  "to be confirmed" mark and the noindex gate. Full suite **189/191**: the one
  failure, `admin-home-picker.spec.ts:210`, passes in isolation and touches
  admin home content, which this delivery does not. Typecheck and lint clean.
- ⚠️ **`npm run build` was broken before this session and still is elsewhere.**
  `@anthropic-ai/sdk` is declared in `package.json` and present in the
  lockfile but is not installed in this checkout, so the production build fails
  in `app/api/advisor/route.ts`. It was installed here with `--no-save` to
  allow verification; run `npm install` in the main checkout.
- **Not stamped:** `npm run figma:baseline` deliberately NOT run. ~36 changed
  frames are still un-imported — the page-wide typography pass has only reached
  `/` — and stamping would hide every one of them from the next sync.
