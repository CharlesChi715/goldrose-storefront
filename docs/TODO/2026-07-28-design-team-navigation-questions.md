# TODO: navigation questions for the design team

|                        |                                                       |
| ---------------------- | ----------------------------------------------------- |
| **Task (as assigned)** | "I need to generate the path question to a single doc. Like, if you have no idea how to navigate to a web page on Figma you build, just list it on that doc and I'll ask the front-end design team." |
| **Assigned**           | 2026-07-28                                            |
| **Work window**        | 2026-07-28                                            |
| **Agent / session**    | Claude Code background job                            |
| **Branch / commits**   | `main` · uncommitted                                  |
| **Status**             | 🔴 needs decisions                                     |

## 1. What shipped

- This file: every element in the imported Figma screens whose destination page
  is unknown, unbuilt, or marked "to be confirmed", swept from
  `docs/ixd/homepage.md`, `docs/ixd/shop.md`, `docs/ixd/order-detail.md`,
  `docs/ixd/login-import.md`, `docs/ixd/bottom-nav-buttons.md`.
- 27 unresolved entries grouped into **13 questions by destination page**, not
  by screen — the gaps repeat heavily (7 elements point at one undesigned
  personalization flow, 4 at one undesigned brand-story page). Ask once per
  group.
- Pointer added in `docs/ixd/README.md` so anyone reading the IxD specs finds
  this list.

**Current behaviour of every element listed here:** renders pixel-exact but is
**inert** — nothing happens on tap, per the standing "leave placeholder"
instruction. Nothing is broken; it is waiting on a destination.

Entry IDs are stable: search `### H-09` in the source files for the original
row and its annotated screenshot.

## 2. Decisions I made myself (veto window)

| #   | Decision | Why | Where |
| --- | -------- | --- | ----- |
| D1  | Grouped by destination page rather than by screen or by entry ID | 27 separate questions would return 27 shrugs; "is personalization in scope?" answers six buttons at once | this file |
| D2  | Included questions where dev already built a stopgap (Q4, Q8, Q11a) as *confirmations* rather than dropping them | Cheap to close, and stops the design team redesigning something that exists | Q4, Q8, Q11 |
| D3  | Split out Q5/Q6/Q9 as business decisions, not design ones | Whether a blog, gift finder or AI concierge exists at all is the bosses' call; the design team can only answer the "what does it look like" half | Q5, Q6, Q9 |

## 3. Mocked or halfway

| #   | What | Current state | What activates it |
| --- | ---- | ------------- | ----------------- |
| M1  | H-15 "FIND A GIFT" | Points at `/shop` — closest honest destination | A real gift-finder page (Q6) |
| M2  | H-16 / H-17 path cards | Scroll to homepage anchors `#personalize` / `#craft`, which are literally that content | Real personalization and craft pages (Q1, Q2) |
| M3  | `AUTH-SIGNUP` screen | Built from styled divs, unlinked, inert — a live password box going nowhere is a security hazard | Redesign around the emailed sign-in link (Q12a) |
| M4  | `ORDER-DETAIL-SHARE-TRACKING` | Static card | Secure share-token backend **and** a public stripped-tracking page design (Q11b) |
| M5  | SHOP-FILTER drawer, N-10 view toggle | Cosmetic — catalog has no recipient/occasion fields; no list layout designed | Product-data work (Q7) and a list-layout frame (Q10) |

## 4. Needs your decision

Each question is written to be forwarded to the design team as-is. The
recommendation is development's view, not a decision taken.

### Q1 — Personalization flow: in scope, or delete the buttons? (blocking: no)

- **Context:** the homepage sells personalization in three modules — H-08,
  H-16, H-28, H-29, H-30, H-37 — six tappable controls. All are marked *"Future
  iteration (not currently planned)"* and **no personalization screen has ever
  been designed**. H-30 additionally expects a "save and continue later" success
  state, which needs a saved-draft backend.
- **Options:** A) Confirm out of scope and **remove the six controls** from the
  homepage for launch. B) Confirm out of scope but ship them inert as today.
  C) Bring it into scope — then we need to know if it is one page or the
  four-step overlay flow H-28 implies.
- **Recommendation:** **A.** Six dead buttons on the highest-traffic page is
  the worst outcome of the three: a customer who taps "Personalize Your Rose"
  and gets nothing learns the site is broken. Removal is a layout change the
  design team must make, so it needs asking now, not at launch.
- **Your answer:** _(Charles writes here, with date)_

### Q2 — Brand story & craft page: one page or three? (blocking: no)

- **Context:** H-17, H-31, H-32, H-34 all point at story / craft /
  workshop-and-patents content. All marked *Not done*; H-32's route is flagged
  "suggestion, pending dev confirmation". The source hints H-34 "can reuse the
  brand story & craft page framework". No copy, no workshop or patent imagery
  exists in the repository.
- **Options:** A) One page with three anchored sections, all four CTAs landing
  on the right anchor. B) Separate story / craft / workshop pages. C) Defer
  past launch and remove the four CTAs.
- **Recommendation:** **A.** It is what the source implies, it is one design and
  one build, and anchors mean the four CTAs differ only by fragment. The real
  blocker is not design but **content** — someone must write the story and
  supply workshop/patent photos. Worth asking who owns that in the same message.
- **Your answer:** _(Charles writes here, with date)_

### Q3 — Search results: is filtered `/shop` enough? (blocking: no)

- **Context:** H-06 (*Not done*) and N-05 (*未做*) both name a search results
  page. Development already solved most of this: the SEARCH-OPEN overlay from
  the 07-27 batch is built and Enter hands off to `/shop?q=…`, which really
  filters the live catalog. H-06's own icon was dropped from the final header.
  But the overlay has **no empty state and no zero-results frame**.
- **Options:** A) Accept filtered `/shop` as the results page; ask only for the
  two missing states. B) Ask for a dedicated results screen (recent searches,
  suggestions, zero-results).
- **Recommendation:** **A.** The functional half already works against real
  data; a separate screen would duplicate `/shop`'s grid for no gain. The
  empty/zero-results frames are needed under either option, so request them
  regardless — a search that returns nothing and shows a blank page is the most
  likely bad first impression on the site.
- **Your answer:** _(Charles writes here, with date)_

### Q4 — Is the built C-3 drawer what H-01 and N-02 open? (blocking: no)

- **Context:** H-01 and N-02 (the homepage and shop menu icons) are both marked
  not-done, destination "side navigation drawer". But the C-3 menu-drawer frame
  from the 07-26 batch **is already built**. The interaction table predates it.
- **Options:** A) Yes, C-3 is that drawer — we wire both icons and this closes.
  B) No, a different drawer is intended — we need the frame.
- **Recommendation:** **A**, pending their confirmation. This is the cheapest
  win in the list: one sentence from them turns two dead icons into working
  navigation with no new design work.
- **Your answer:** _(Charles writes here, with date)_

### Q5 — Is there a blog at launch? (blocking: no) — *business decision*

- **Context:** H-20, H-23, H-35 (blog cards and article list) and H-24 ("Read
  Customer Stories") are all *Not done*. There is no blog list page, no detail
  template, and **no articles** — neither design nor content. Unclear whether
  customer stories are the same system or their own page.
- **Options:** A) No blog at launch — remove the four entry points. B) Blog at
  launch — needs a list page, a detail template, and someone writing articles.
  C) Ship the entry points inert and fill later.
- **Recommendation:** **A for launch.** A blog is a content commitment, not a
  build problem: an empty or three-stub blog reads worse than none, and nobody
  has been named as the writer. Revisit once marketing starts (release queue
  #8). Note this is really the bosses' call, not the design team's.
- **Your answer:** _(Charles writes here, with date)_

### Q6 — MORI gift finder: page, modal, or neither? (blocking: no) — *business decision*

- **Context:** H-15 ("FIND A GIFT", *To be confirmed*) names a Gift Finder page;
  H-26 ("See MORI's Picks", *Not done*) names a recommendation results modal.
  H-25's criteria chips already work in place on the homepage — but the button
  that consumes those choices has nowhere to go. The results modal is
  undesigned. Deeper problem: **nothing defines what MORI recommends.**
- **Options:** A) Homepage module + a results modal only (no separate page);
  recommendations are hand-picked product sets per criteria combination.
  B) Full gift-finder page. C) Drop for launch; H-15 keeps pointing at `/shop`.
- **Recommendation:** **A**, if and only if the bosses will supply the
  hand-picked sets. The design question ("what does the results modal look
  like") is unanswerable until the business question ("what makes a pick a
  pick") is settled — ask that first.
- **Your answer:** _(Charles writes here, with date)_

### Q7 — Recipient cards: collection pages or filtered `/shop`? (blocking: no)

- **Context:** H-22's recipient carousel is *To be confirmed*, destination
  "recipient collection page". Its occasion counterparts (H-18/H-19/H-21)
  resolve to `/shop` or filter in place. **The catalog has no recipient field**
  — the same reason the SHOP-FILTER drawer ships cosmetic.
- **Options:** A) `/shop` pre-filtered by recipient. B) A designed collection
  page per recipient (hero, curated copy, curated products).
- **Recommendation:** **A.** Either option needs the same product-data work
  (tagging every SKU with recipients, part of OQ-3); A needs no new design and
  no per-recipient copy. B is a good later upgrade for SEO. Flag to them that
  neither works until product data lands.
- **Your answer:** _(Charles writes here, with date)_

### Q8 — Confirm H-36 "Shop All" → `/shop` (blocking: no)

- **Context:** marked *To be confirmed*; already wired to `/shop`, which is the
  all-products list.
- **Options:** A) Confirm and close. B) Name a different destination.
- **Recommendation:** **A.** Included only so it gets an explicit yes rather
  than sitting "to be confirmed" forever.
- **Your answer:** _(Charles writes here, with date)_

### Q9 — AI Gifting Concierge: in scope? (blocking: no) — *business decision*

- **Context:** N-15 (客服入口) is *未做*, destination "Gifting Concierge 聊天界面".
  The chat screen does not exist and there is no chat backend.
- **Options:** A) Out of scope — point the entry at `/care` (built, four real
  tabs). B) Out of scope — remove the entry from the shop screen. C) In scope —
  needs a chat design, a backend, and a staffing/AI decision.
- **Recommendation:** **A.** The customer's intent behind that button is "I need
  help", and `/care` genuinely serves it today. Cheap, honest, and reversible
  when a real concierge exists.
- **Your answer:** _(Charles writes here, with date)_

### Q10 — Shop list-view toggle: design it or drop it? (blocking: no)

- **Context:** N-10's grid/list toggle is marked *目前先不做*. Not a missing page —
  a designed control with **no second layout designed**.
- **Options:** A) Remove the toggle from the shop header for launch. B) Supply
  a list-layout frame so we can build it.
- **Recommendation:** **A.** A visible toggle that does nothing is worse than no
  toggle, and a list view adds little on a small gift catalog. Trivially
  reversible if they later supply the frame.
- **Your answer:** _(Charles writes here, with date)_

### Q11 — Order-detail cards: confirm one, design the other (blocking: no)

- **Context:** two cards marked *To be confirmed*.
  `ORDER-DETAIL-CONTACT-SUPPORT` is **already wired** to `/care?tab=order-issues`
  with the whole card clickable, per their own change proposal.
  `ORDER-DETAIL-SHARE-TRACKING` is still static: sharing gift tracking with a
  third party needs a secure share-token backend **and a page design** — a
  stranger must not see the buyer's address, price, or other orders.
- **Options:** (a) confirm CONTACT-SUPPORT and close it. (b) For SHARE-TRACKING:
  A) design a public stripped-tracking page (status and ETA only) and we build
  the token backend; B) defer sharing past launch and leave the card static.
- **Recommendation:** confirm (a); **B for (b)** at launch. Sharing is a nice
  extra, but a public link to order data is a privacy surface that deserves its
  own design pass rather than a launch-week rush. Their "Copy Link" shortcut and
  "Online now / Reply within 24h" hint are both undesigned — request frames if
  they want them.
- **Your answer:** _(Charles writes here, with date)_

### Q12 — Sign-up screen contradicts the chosen auth method (blocking: **yes**, for AUTH-SIGNUP)

- **Context:** from `docs/ixd/login-import.md`. `AUTH-SIGNUP` asks for password
  + confirm-password, but customer auth is **decided** as the emailed sign-in
  link with a code fallback. There is also no "check your email" post-send
  screen, the dashboards ship **no sign-out control**, and the bottom-nav
  account label has changed Login → Me → Login → Me across four revisions
  (currently **Me**).
- **Options:** A) Redesign the sign-up screen around the email link and supply
  the post-send screen. B) Delete the sign-up screen — the email link needs no
  separate sign-up, since first sign-in creates the account.
- **Recommendation:** **B, plus the post-send screen from A.** With emailed
  links there is no password to set, so a sign-up form has nothing to collect
  that sign-in does not. The post-send screen is needed either way — right now a
  customer taps send and sees no confirmation. Ask them to settle the nav label
  permanently and to style a sign-out row (dev added a plain text one).
- **Blocking because:** the screen stays unlinked until answered. A live
  password field that goes nowhere is the same hazard as B-2's card fields.
- **Your answer:** _(Charles writes here, with date)_

### Q13 — Not questions, recorded so nobody re-raises them (blocking: no)

Inert **by design**, no answer needed: H-02 and N-01 (announcement bars,
deliberately not clickable), H-18 / H-21 / H-25 (filter and criteria chips that
act in place), `ORDER-DETAIL-VIEW-STATUS` (tracking page exists).

Also informational: H-33 corporate and B-3/B-4 partnership/wholesale pages are
built and wired, but their copy and imagery are placeholders and B-4's hero is
stock art — content, tracked as OQ-3, not navigation.

- **Your answer:** _(no decision required)_

## 5. Also worth raising in the same conversation

Not navigation questions, already logged in `docs/ixd/README.md`, but the design
team will likely be asked about them together: the two competing visual palettes
(homepage/shop vs the newer tracking/confirmation screens), the three different
bottom-nav bars, the mascot artwork needing transparent-PNG re-exports, the
third-party gift-box photo on the shop hero, and whether desktop layouts are
coming.

## 6. Resolution log

- _(empty — nothing answered yet)_
