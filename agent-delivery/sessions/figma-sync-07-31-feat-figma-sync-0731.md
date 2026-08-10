# figma-sync · 07-31 · `feat/figma-sync-0731`

Agent session hand-off. Open matters first; what the session delivered is at
the bottom. See [`../README.md`](../README.md) for tag meanings and workflow.

## AI-008 · `AGENT-DECISION` · `OPEN`

- **Affected place:** [cart icon in shared chrome](../../components/chrome.tsx#L269)
  (same reasoning at the PDP's Add to Cart and checkout CTA)
- **The choice:** The 07-31 prototype map wires cart icons and PDP
  "Add to Cart" → `/bag`, the checkout "Pay Securely" CTA → the keepsake
  share card, and Save/submit buttons on the inert account screens → other
  pages. None of it was adopted: `/bag` still shows mock line items (the live
  basket is `/checkout`), the pay CTA performs the real PayPal charge, and
  navigating from inert Save/submit controls would fake success (the
  live-input hazard rule).
- **Why reversible:** each is one link swap once the backing feature is real
  (live `/bag` cart, a designed post-payment share step, account backends).
- **Veto:** if the bosses want the design's flow verbatim anyway, say so and
  the links are repointed in one commit.
- **Update 2026-08-10 — the cart arm is resolved as foreseen.** `/bag` has read
  `lib/cart/store.ts` since 2026-08-07, so it is now the shopper's real basket
  and the reason for the deviation is gone. All five header cart icons
  (`chrome.tsx` ×3, `CraftScreen`, `returns-chrome`) go to `/bag`, matching the
  prototype and the PDP's ADD TO CART. The pay→keepsake and inert Save/submit
  arms stand unchanged.

---

## Delivered this session

- Read the full Figma file state (2026-07-31 13:26): 7 Ready-for-dev
  sections, 54 comments, and the file's first substantial prototype map
  (59 interactions, up from 11). Everything under the marked sections was
  already imported — this pass aligned drift and wired the one new exit.
- Reminders page: SMS toggle defaults off / Email on per Charles's
  "comments for ai agents" note on 1523:3473; off-track grey `#E4E8ED`;
  caption nudged to the regrouped position. Band diff 2.78%.
- Reminders edit modal re-checked: no drift (its toggles already matched).
- New scaffold `/account/returns/request-submitted` + Confirm Return wired
  (AI-007); two new e2e tests cover the toggle defaults and the scaffold hop.
- Prototype links that would fake live functionality were catalogued and not
  adopted (AI-008) — details in
  [`docs/ixd/README.md`](../../docs/ixd/README.md) § "07-31 delivery sync".
- Pending from design, no action taken: simplified homepage replacing the
  current frame (owner-acked "先不管" — do not re-import homepage until it
  lands); AFTER-SALES 13-screen section (returns flow + reminders
  date/timezone pickers) unmarked; `/gift-guide` (1942:182) and the edited
  blog frame unmarked; signup password removal, dashboard address management,
  and a keepsake back button announced in team comments.
- Repo ↔ Figma reconciliation: no storefront route lost its frame; unmatched
  frames are exactly the unmarked deliveries above.
