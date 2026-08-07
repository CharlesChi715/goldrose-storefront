# Recheck list — after the design team ships a new home page frame

Paused 2026-08-07 on `worktree-admin-home-customization` (commit `c2004bd`) at
Charles's request: the frontend designer is updating the home page, and much of
this branch is traced from the **current** frame `2380:370`. Work through this
list when the new frame lands.

## Why this branch is frame-sensitive

`lib/home-content/registry.ts` now stores, per photo, the **design box** (`box`)
and **how the photo is fitted** (`fit`), and `components/home/HomePhoto.tsx`
carries each photo's traced crop geometry. A new frame can change all of it.

## What a new frame invalidates, in priority order

1. **Band `y`/`h` in the registry.** `lib/home-content/layout.ts` re-stacks hidden
   sections from these, and they are declared TWICE — once here and once in each
   component's `abs()` call — with nothing tying them together. The unit test
   `the bands tile the stage with no gaps and no overlap` catches a registry-side
   mistake; it cannot catch the component drifting from it.
   → Also worth fixing properly: derive one from the other.
2. **Every `box: { w, h }` on an `image` field.** These are what the admin shows a
   teammate as "Designed size", and what `HomePhoto` fills once a photo is
   replaced. Wrong numbers here mislead silently.
3. **Every `design={{ x, y, w, h }}` in a `HomePhoto` call.** These are the
   negative crop offsets. If the new frame re-crops or replaces a photo, these
   must be re-traced or the DESIGN render (not the owner's) shows the wrong
   region. Sites: `A3.tsx`, `A9.tsx`, `OccasionRail.tsx`, `RecipientRail.tsx`.
4. **Registry `value` defaults** — every string, and every photo path. The
   invariant is that an untouched field renders byte-identically to the import.
5. **`budget()` character caps**, which are computed from the frame's box widths
   and font sizes.
6. **Whether the artwork fields are still artwork.** Seven+ labels are baked into
   Figma SVG/PNG renders. If the new frame ships any of them as live text, they
   should stop being `kind: "artwork"` and become editable.

## Known-good state at the pause

- `npx tsc --noEmit` — clean.
- `npm run lint` — 0 errors (2 pre-existing warnings in `components/screens/account-chrome.tsx`).
- `npm run test:unit` — 98/98.
- `npx playwright test admin-home-content.spec.ts` — 4/4.

## ⚠️ The pixel baselines are UNVERIFIED on this branch

`npx playwright test pixels.spec.ts` fails all three **on the untouched branch
base**, with none of this branch's changes applied — so the drift is pre-existing
here, not caused by this work. Cause: this worktree is based on `origin/main`
(`b5cc0b1`), while the main checkout carries unpushed commits that change the
pages the baselines pin (notably `e30f9b8 fix(pdp): wrap the strapline to two
lines instead of truncating`, which changes the PDP's height — the failure
reports 1776px expected vs 1792px received).

Beware: `playwright.config.ts` sets `reuseExistingServer: !process.env.CI` on port
3001. If any other worktree session is serving 3001, the suite silently tests
THAT code and the baselines can appear green when they are not. Check with
`lsof -nP -iTCP:3001 -sTCP:LISTEN` before trusting a pixel run.

**Before merging:** rebase onto the real `main`, confirm nothing is on 3001, and
re-run `pixels.spec.ts`. Only then is "the untouched page is byte-identical to
the import" a claim this branch can make.

## Open items not done

- The unused `color` field kind is **dead code** — the owner ruled on 2026-08-07
  that colours stay with the design team (verified: the brand gold `#D4AF37` and
  ink `#3B2F2F` are painted into the exported ornament SVGs, so a token change
  would leave a half-recoloured page). Remove `color` from `HomeFieldKind`, the
  `EDITABLE` set, `fieldError`, `isHexColor`, the editor's colour branch, the
  `home.bad.color` / `home.color.baked` i18n keys, and the colour unit test.
- `A-9`'s six workshop gallery tiles and four certificate thumbnails are still
  ten crops of ONE picture and are not editable.
- The `$69.00` price in `A-3`'s meta strip is baked into `159-80.svg`, so the
  home page will keep stating that price whatever the catalogue says. This is a
  launch risk, not an editability gap — raise it separately.
