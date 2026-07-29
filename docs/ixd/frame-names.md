# Frame naming — one name for a page, in Figma and in the URL

|                  |                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------ |
| **What this is** | The rule for naming top-level Figma frames so a frame name and its route are the same string in two formats. |
| **Scope**        | The **frame** = one web page. Naming *inside* a page is [element-names.md](element-names.md). |
| **Opened**       | 2026-07-28                                                                                   |
| **Version**      | 1.0 — the page-level chapter of the convention in [element-names.md](element-names.md). |
| **Status**       | Rule **adopted 2026-07-29**. The rename list needs the design team's agreement and the owner's route decisions (see [§3](#3-what-is-blocking-the-16-held-rows)). |
| **Review by**    | **2026-08-05 — silence adopts.** A convention nobody answers is still a convention; it just wastes the wait. |
| **Owner**        | Charles (the rule) · design team (the renames) |
| **Verified**     | Frame names read live from Figma file `3CXNpmuuyNyCW70qOci0oM` on 2026-07-28; routes read from `app/**/page.tsx` on 2026-07-29. |
| **Rule changed** | 2026-07-29 — path separator is now `/`, not `-`. See [§1](#1-the-rule). |

---

## TODO

Proposed approach. Three sittings, ordered by cost-of-delay:

| Sitting | Decisions                                                        | Why first/later                                                            |
| ------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 1       | Page vocabulary + frame naming + element vocabulary              | Blocks the design team; every new frame batch arrives under the old scheme |
| 2       | Terminology (one word per concept), brand strings, design tokens | 844 raw hex literals, growing with every import                            |
| 3       | Code conventions, data-el purpose, reference IDs, comment format | Repo-internal only, no external party waiting                              |

Change:
1. ACCOUNT-PRIVACY-POLICY
2. 


## 1. The rule

```text
FRAME NAME  =  <ROUTE, UPPERCASED, LEADING "/" DROPPED>   [ · <STATE OR OVERLAY> ]
```

**Three marks, three jobs. Never mix them.**

| Mark | Means | Example |
| ---- | ----- | ------- |
| `/`  | a level of the path | `ACCOUNT/ORDERS` = `/account/orders` |
| `-`  | a word break *inside* one level | `ACCOUNT/PERSONAL-INFO` = `/account/personal-info` |
| `·`  | a state or overlay *of the page named before it* | `SHOP · FILTER` opens on `/shop` |

| Case              | Figma frame name        | Route                    | Rule                                                      |
| ----------------- | ----------------------- | ------------------------ | --------------------------------------------------------- |
| Simple page       | `SHOP`                  | `/shop`                  | Uppercase the route, drop the leading `/`                 |
| Nested page       | `BUSINESS/PARTNERSHIPS` | `/business/partnerships` | Keep `/` between levels                                   |
| Multi-word level  | `ACCOUNT/PERSONAL-INFO` | `/account/personal-info` | `-` stays inside the level                                |
| Dynamic route     | `PRODUCTS`              | `/products/[slug]`       | Drop `[dynamic]` segments                                 |
| Home              | `HOME`                  | `/`                      | The one special case                                      |
| Page state        | `ACCOUNT · SIGNED-OUT`  | `/account`               | `·` + the state. Route is unchanged — two frames, one URL |
| Query-param state | `CARE · ORDER-ISSUES`   | `/care?tab=order-issues` | `·` + the parameter value                                 |
| Overlay           | `SHOP · FILTER`         | opens on `/shop`         | `·` + the overlay. Its **host** route sits before the `·` |

The transform runs both ways, so a frame name is never ambiguous about which
page it is, and a route always tells you which frame to open.

### Why `/` and not `-` for path levels

The first draft of this rule turned `/` into `-`. It looked tidier and was
**wrong**: it made the name un-reversible. `ACCOUNT-PERSONAL-INFO` could be
`/account/personal/info` or `/account/personal-info` — you cannot tell, because
one mark is doing two jobs. A rule that needs a lookup table to resolve its own
output *is* the lookup table this document exists to avoid.

Keeping `/` costs nothing: the Figma file already carries five competing
conventions, so nearly every frame is being renamed regardless.

**Why `·`** — it is already the design team's own house style (`B-3 · …`,
`01 · Promo Bar`, `Tab · 首页`), it cannot appear in a URL, and it visually
separates "this is a real page" from "this is a state of one".

⚠️ **The dot must be U+00B7 MIDDLE DOT — `·` — and nothing else.** It has
look-alikes that are indistinguishable on screen and fatal to exact-match
tooling:

| Looks the same | Actually is | Where it comes from |
| --- | --- | --- |
| `·` | U+00B7 MIDDLE DOT | **the correct one** |
| `•` | U+2022 BULLET | pasted from a bulleted list |
| `・` | U+30FB KATAKANA MIDDLE DOT | inserted by Chinese and Japanese IMEs |

Since the design team types on Chinese input methods, the third one is a real
risk, not a theoretical one — and nobody will ever spot it by eye. Copy the dot
from this document rather than typing it, and the validator should reject the
look-alikes outright.

**A known cost of `/`, stated openly:** in Figma, a `/` inside a *component*
name creates nested folders in the Assets panel. These are frames, not
components, so it does nothing today — but if frames are ever converted to
components, the names will sprout phantom folder structure. The reversibility
gained is worth more than that risk, and the risk is written down here rather
than discovered later.

### Why not name frames freely and map them in a table

That is the status quo, and the file currently carries **five** conventions at
once: `shop`, `orders`, `详情页`, `B-3 · Business Partnerships · iPhone 15 Pro Max`,
`ACCOUNT-INFO-BUSINESS-DASHBOARD`. A lookup table can express anything, but it
has to be maintained, and it goes stale silently. A derivable name cannot.

---

## 2. The rename list

**40 frames.** 21 can be renamed today · 16 are waiting on a route decision ·
3 cannot be named at all yet.

**Read the `Do now?` column first** — it is the one that saves you work:

| Mark | Meaning |
| ---- | ------- |
| ✅ | **Rename now.** The route is settled; this name will not change again. |
| ⏳ | **Hold.** The route itself is still being decided — renaming now means renaming twice. |
| ⛔ | **Blocked.** We do not know what this page is. Needs an answer before it can be named. |

`Node` is the Figma node id — the stable handle. Paste it after `?node-id=`
in the file URL to jump straight to the frame.

### A · Pages — one frame, one route

| Node | Current Figma name | Rename to | Route | Do now? | Note |
| ---- | ------------------ | --------- | ----- | ------- | ---- |
| `138:55` | `Homepage · Layered Editable · iPhone 15 Pro Max · Scroll` | `HOME` | `/` | ✅ | |
| `24:396` | `shop` | `SHOP` | `/shop` | ✅ | |
| `2:2` | `详情页` | `PRODUCTS` | `/products/[slug]` | ✅ | `[slug]` dropped — one frame serves every product |
| `561:87` | `B-1 · Shopping Bag · iPhone 15 Pro Max` | `BAG` | `/bag` | ⏳ | becomes `CART` if the route does |
| `561:88` | `B-2 · Checkout · iPhone 15 Pro Max` | `CHECKOUT` | `/checkout` | ✅ | |
| `561:89` | `B-3 · Business Partnerships · iPhone 15 Pro Max` | `BUSINESS/PARTNERSHIPS` | `/business/partnerships` | ✅ | |
| `561:90` | `B-4 · Wholesale Application · iPhone 15 Pro Max` | `BUSINESS/WHOLESALE` | `/business/wholesale` | ✅ | |
| `765:112` | `C-1 · Order Tracking · iPhone 15 Pro Max` | `ORDERS/TRACK` | `/orders/track` | ⏳ | becomes `TRACK` if guest tracking moves to `/track` |
| `914:112` | `登录完成界面` | `ACCOUNT` | `/account` (signed in) | ✅ | |
| `1097:114` | `AUTH-SIGNUP-SHOPPING` | `ACCOUNT/SIGNUP` | `/account/signup` | ⏳ | `ACCOUNT/REGISTER` if we adopt the standard word |
| `1097:115` | `orders` | `ACCOUNT/ORDERS` | `/account/orders` | ✅ | |
| `1097:120` | `ACCOUNT-GIFT-REMINDERS` | `ACCOUNT/REMINDERS` | `/account/reminders` | ✅ | `GIFT-` dropped — the route does not carry it |
| `74:55` | `Business · Procurement · iPhone 15 Pro Max` | `ACCOUNT/BUSINESS` | `/account/business` | ⏳ | B2B namespace undecided |
| `914:113` | `ACCOUNT-INFO-BUSINESS-DASHBOARD` | `ACCOUNT/BUSINESS/DASHBOARD` | `/account/business/dashboard` | ⏳ | same decision |
| `1230:112` | `ACCOUNT-PERSONAL-INFO-DETAILS` | `ACCOUNT/PERSONAL-INFO` | `/account/personal-info` | ⏳ | may move under `ACCOUNT/SETTINGS/` |
| `1234:111` | `ACCOUNT-PREFERENCES-CONTROLS` | `ACCOUNT/PREFERENCES` | `/account/preferences` | ⏳ | may move under `ACCOUNT/SETTINGS/` |
| `1234:191` | `ACCOUNT-PRIVACY-SECURITY` | `ACCOUNT/SECURITY` | `/account/security` | ⏳ | may move under `ACCOUNT/SETTINGS/` |
| `1234:271` | `ACCOUNT-PRIVACY-POLICY` | `ACCOUNT/PRIVACY-POLICY` | `/account/privacy-policy` | ⏳ | ⚠️ should become `POLICIES/PRIVACY-POLICY` — a public legal page cannot live inside a signed-in account |
| `1234:351` | `ACCOUNT-LOGOUT-CONFIRM` | `ACCOUNT/LOGOUT` | `/account/logout` | ✅ | `-CONFIRM` dropped — it is the only logout screen, so the word adds nothing |
| `1234:431` | `ACCOUNT-DELETE-CONFIRM` | `ACCOUNT/DELETE` | `/account/delete` | ⏳ | may move under `ACCOUNT/SETTINGS/` |
| `1245:116` | `KEEPSAKE-CARD` | `ACCOUNT/KEEPSAKE` | `/account/keepsake` | ⏳ | ⚠️ should become `GIFT` — it is meant to be sent to someone who cannot sign in as you |
| `1230:119` | `ACCOUNT-RETURNS-AFTER-SALES` | `ACCOUNT/RETURNS` | `/account/returns` | ✅ | ⚠️ confirm in Figma — listed in the 07-28 import notes but absent from the 07-28 live frame read |
| `1230:120` | `客服页` | `CARE/CHAT` | `/care/chat` | ⏳ | becomes `HELP/CHAT` if `/care` → `/help` |

### B · States — several frames, one URL

The route does not change; only what the page is showing. `·` marks that.

| Node | Current Figma name | Rename to | URL | Do now? | Note |
| ---- | ------------------ | --------- | --- | ------- | ---- |
| `74:53` | `登录界面` | `ACCOUNT · SIGNED-OUT` | `/account` (signed out) | ✅ | same URL as `ACCOUNT`, different state |
| `1097:116` | `CARE-ORDER-ISSUES` | `CARE · ORDER-ISSUES` | `/care?tab=order-issues` | ⏳ | all four become `HELP · …` if `/care` → `/help` |
| `1097:117` | `CARE-HOT-TOPICS` | `CARE · HOT-TOPICS` | `/care?tab=hot-topics` | ⏳ | |
| `1097:118` | `CARE-AFTER-SALES` | `CARE · AFTER-SALES` | `/care?tab=after-sales` | ⏳ | |
| `1097:119` | `CARE-PROMOTIONS` | `CARE · PROMOTIONS` | `/care?tab=promotions` | ⏳ | |

⚠️ **No frame draws the bare `/care` default state.** Which tab opens first?

### C · Overlays — no route of their own

Per the owner's 2026-07-27 rule, 小页面 frames never get a dedicated route.
Their name now says which page they open on — information the old `PDP-REVIEW`
style did not carry.

| Node | Current Figma name | Rename to | Opens on | Do now? | Note |
| ---- | ------------------ | --------- | -------- | ------- | ---- |
| `914:114` | `SEARCH-OPEN` | `SHOP · SEARCH` | `/shop`, `/products/[slug]` | ✅ | |
| `914:115` | `SHOP-SORT-OPEN-DROPDOWN` | `SHOP · SORT` | `/shop` | ✅ | |
| `914:116` | `SHOP-FILTER-OPEN-DRAWER` | `SHOP · FILTER` | `/shop` | ✅ | |
| `914:117` | `PDP-REVIEW-OPEN-DRAWER` | `PRODUCTS · REVIEW` | `/products/[slug]` | ✅ | |
| `914:118` | `PDP-MEDIA-OPEN` | `PRODUCTS · MEDIA` | `/products/[slug]` | ✅ | |
| `1097:112` | `PDP-COLOR-OPEN-DRAWER` | `PRODUCTS · COLOR` | `/products/[slug]` | ✅ | |
| `1097:113` | `PDP-UNBOXING-OPEN-GALLERY` | `PRODUCTS · UNBOXING` | `/products/[slug]` | ✅ | |
| `765:114` | `` ` Homepage · Menu Open · iPhone 15 Pro Max` `` | `HOME · MENU` | `/` (drawer, reachable from every page) | ✅ | ⚠️ the current name **starts with a space** — invisible in the layer panel, breaks exact-match tooling |
| `1339:112` | `RETURNS-REASON-SELECT-OVERLAY` | `ACCOUNT/RETURNS · REASON` | `/account/returns` | ✅ | |

**`-OPEN-DRAWER` / `-OPEN-GALLERY` / `-OPEN-DROPDOWN` suffixes all disappear.**
Whether a state is drawn as a drawer, a dropdown or a gallery is *appearance*,
and [element-names.md](element-names.md) rule 1 says names track role, not
appearance. A drawer that later becomes a modal should not force a rename.

### D · Blocked — cannot be named until someone answers

| Node | Current Figma name | Rename to | Do now? | What we need |
| ---- | ------------------ | --------- | ------- | ------------ |
| `765:113` | `订单详情` | — | ⛔ | Was `C-2 · Order Confirmed`, now renamed "order detail" in Chinese. Is this `/checkout/success`, or a new order-detail page? The `ORDER-DETAIL-*` mechanism sheet suggests the latter. |
| `1230:121` | `付款完弹窗` | — | ⛔ | "Payment complete popup" — a state of `/checkout`, or the `/checkout/success` route? ⚠️ **Node-id conflict:** this file records `付款完弹窗` at `1230:121`; [`README.md`](README.md) records `ACCOUNT-KEEPSAKE-SHARE` at the same node. One of the two is wrong. |
| `1232:114` | `ACCOUNT-PERSONAL-INFO-DETAILS-ALT` | **delete the frame** | ⛔ | Byte-identical duplicate of `1230:112` (structural diff of every node = zero). Delete it, or differentiate it and tell us what it is. |

### E · Routes with no frame

Pages that exist in the site but nobody has drawn:

`/checkout/cancel` · `/checkout/success` · `/orders` · `/care` (base state) ·
`/placeholder`

---

## 3. What is blocking the 16 held rows

Every ⏳ traces back to one of five open decisions. Answer these and the holds clear:

| # | Decision | Frames waiting |
| - | -------- | -------------- |
| 1 | `/bag` or `/cart`? | 1 |
| 2 | `/care` or `/help`? | 5 |
| 3 | Do the four settings pages move under `/account/settings/`? | 4 |
| 4 | Is B2B part of `/account`, or its own namespace? | 2 |
| 5 | Do `/account/privacy-policy`, `/account/keepsake` and `/orders/track` move to `/policies/`, `/gift/` and `/track`? | 3 |

Decisions 1 and 2 are the cart/help terminology calls; 3–5 come out of the
target route architecture. **Do not rename a ⏳ row before its decision lands** —
the design team would do the work twice.

---

## 4. Open question this rule creates for `data-el`

Element names carry the page as a prefix
([element-names.md](element-names.md)), so a multi-level page raises the same
separator question one layer down:

```text
frame   ACCOUNT/PERSONAL-INFO
band    HEADER
leaf    TITLE
                  →  ACCOUNT/PERSONAL-INFO-HEADER-TITLE   ?
                  →  ACCOUNT-PERSONAL-INFO-HEADER-TITLE   ?
```

The first keeps the transform at zero but puts a `/` inside an HTML attribute
value (legal, and legal in a CSS selector, but unusual). The second is
conventional but reintroduces the ambiguity for anything parsing the string —
and `tests/unit/element-names.test.ts` does parse it.

**Undecided.** It only matters for pages more than one level deep, none of which
are tagged yet, so there is time. Recorded here so it is not discovered late.

---

## 5. Naming inside a frame

Naming *within* a frame — bands, buttons, images — is
[element-names.md](element-names.md). The two compose:

```text
frame   SHOP
band    HEADER
leaf    MENU-BTN
                  →  SHOP-HEADER-MENU-BTN
```

Only **UPPERCASE** layer names count as structural levels, so junk wrappers
(`Frame 28`, `Group 30`, `商品双瀑布`) can stay as they are and are simply
skipped when composing the path.

---

## 6. Consequences

**This replaces the PAGE vocabulary.** [figma-naming-guide.md](figma-naming-guide.md)
Sheet 1 lists 11 PAGE words; under this rule the route table is the source
instead, and several guide words change or disappear:

| Guide word | Becomes |
|---|---|
| `PDP` | `PRODUCTS` |
| `AUTH` | `ACCOUNT · SIGNED-OUT` |
| `CART` | gone — no such route ([element-names.md](element-names.md) already proposes removing it) |
| `WISHLIST` `SEARCH` `SETTINGS` | gone — routes not built; `SEARCH` returns as `SHOP · SEARCH` |
| `ORDER` | `ORDERS` (matches the real `/orders`) |

That is one fewer list to keep in sync, but it **needs the owner's sign-off**,
because Sheet 1 is the owner's own file and `PDP` is used throughout the
existing specs and code comments.

**Migration is not free.** `PDP-*` and `H-*` identifiers appear in commits,
in [`README.md`](README.md)'s route table, and in the `DQ-nn` entries. Keep the
old identifier as a legacy alias line in the spec files so historical references
still resolve; name everything new by this rule.
