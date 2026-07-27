# How the account frames were imported from the Figma sources

Record of how `/account` and `/account/business` were produced from the
VELORIA file, so the next import does not rediscover the same traps. Written
2026-07-25, when 登录界面 74:53 and 74:55 were imported.

## Sources

| Frame | Node | Size | Route | Component |
|---|---|---|---|---|
| My · Shopping Account | `74:53` | 430×1232 | `/account` (signed out) | `components/login/ShoppingLogin.tsx` |
| Business · Procurement | `74:55` | 430×1614 | `/account/business` | `components/login/BusinessLogin.tsx` |

Figma file `3CXNpmuuyNyCW70qOci0oM`. Both frames sat in the 已完成 swim lane
and were deferred only because they replace working auth, not because the
design was unfinished.

Each frame is a stack of numbered modules plus the shared bottom nav, which is
**not** rebuilt — `BottomNav` from `components/veloria.tsx` already matches
both frames (verified: 0.02% band diff).

## Pipeline

1. **Node data** — `GET /v1/files/<key>/nodes?ids=74:53,74:55`, token from
   `FIGMA_TOKEN` in `.env.local`, scope must be exactly `file_content:read`.
2. **Frame render** — `GET /v1/images/...?format=png&scale=1` per frame. This
   is the pixel reference *and* the source of truth for glyph ink positions.
3. **Photos** — the `IMAGE`-fill nodes as `format=png&scale=2`.
4. **Glyphs** — symbol TEXT nodes as `format=svg` (they fall back to different
   fonts in Chrome than in Figma, so live text will not match).
5. **Build** — absolutely-positioned JSX at verbatim coordinates, using `abs()`
   and `txt()` from `components/veloria.tsx` and the tokens in
   `components/login/shared.tsx`.
6. **Verify** — screenshot at the design viewport, then a per-module band diff
   against the frame render. Chrome-vs-Figma font antialiasing costs 1.3–4.5%;
   **anything above ~5% on a band is a real bug**. Photos and nav should be
   ≈0%.

Assets are stored under `public/veloria/login/` and `public/veloria/business/`
with node-id filenames (`76-56.png` = node `76:56`), so any asset can be traced
back to its node.

## Traps this import hit

Four things cost real time; check them first next round.

### 1. Read `fills[].opacity`, not just the colour

The membership card reported `#F3C6D1` but rendered `#FCEBE5`. The fill carries
`opacity: 0.23` — it *tints* the cream page rather than painting solid pink.
Nothing in a plain colour dump reveals this, and it scored a **78% band diff**
until fixed. Scan every node for `opacity !== 1` on both the node and its fills
before building.

### 2. SVG exports of fallback-font glyphs come back as a solid box

The ✉ in the email field exported as a single filled rectangle:

```svg
<path d="M0 19H19V-1.72257e-05H0V19Z" fill="#B8A69A"/>
```

Figma rasterises that glyph from a *system fallback* font, and its outline
exporter cannot embed it. Every other symbol (□ ♡ ▣ ▢ ◇ ◉ ▥ ♧ ⌂ ☆) outlined
correctly. **Check small SVGs for a single rect-shaped path**; when one turns
up, re-render that node as PNG instead (`76-69.png`).

### 3. Figma crops TEXT exports to ink, not the node box

An exported label's intrinsic size is its *ink* extent, always smaller than the
design's node box — e.g. node `76:90` is 22×29 but its SVG is 18×18. Centring
the export inside the node box put glyphs **1–6px off**.

The reliable fix is to measure: find the ink bounding box in the frame render
(gold `#D4AF37` for icons, light-on-dark for active tab labels), then place the
export at that origin at its intrinsic size. That is what the `left`/`top`
props of `Glyph` mean, and why `BENEFITS`/`NEEDS` carry `gx/gy/gw/gh` separate
from the card coordinates.

### 4. A single frame can reveal shared-chrome state you were missing

74:53's nav uses `763:149` for the account tab — the **filled** mascot. Filled
= active (confirmed against the known `763:113`/`763:123` home pair). The
shared `BottomNav` had no active variant for that tab, so it stayed outlined on
`/account`. Fixing it took the nav band from 5.29% to 0.02%.

Lesson: when a new frame includes chrome you already built, diff it anyway —
it may carry a state the earlier frames never showed.

## Results

| Frame | Worst module | Whole page |
|---|---|---|
| 74:53 | 4.42% (06 Find Order) | 2.82% |
| 74:55 | 4.65% (04 Services) | 3.44% |

The residual is font antialiasing. The bottom-left corner of the nav band
differs only when screenshotting a **dev** server — that is the Next.js dev
indicator, absent in production.

## Behaviour that is not in the design

The frames are static mocks; these decisions fill the gaps.

- **No post-send screen.** 74:53 has a single send button ("SEND VERIFICATION
  CODE" in the frame; live label "EMAIL ME A SIGN-IN LINK" since the 07-27
  owner request) and no frame for what follows. The emailed link signs in by
  itself via /auth/confirm; for the fallback code in the same mail, the email
  field becomes the code field in place, reusing the frame's own input styling.
- **No signed-in frame.** Signed-in `/account` keeps the pre-existing
  hand-built view (orders, sign out).
- **B2B has no backend.** Per the owner (2026-07-25) V1 is "static + email the
  request": SUBMIT REQUEST / BOOK CONSULTATION / ASK MORI / "Submit a purchase
  request" all POST to `/api/business-request`, which emails the owner's
  contact address. Nothing is persisted.
- **No selected state for the nine need cards.** Selecting one thickens its
  hairline to `#3B2F2F` — the lightest available signal that the tap registered.
- **Sign-in is shared.** The procurement card uses the same emailed sign-in
  link flow; there is no separate procurement account system.
