# Retired assets

Files that used to be served from `public/` (or used by the test suite) and are
no longer referenced by any code. They are parked here rather than deleted so
they stay easy to find and restore; the paths below mirror where each file used
to live, so restoring is a plain `git mv` back.

Nothing here is served — Next.js only serves `public/`.

## Retired 2026-08-04

| Path here              | Came from                | Why it was retired                                                                                                                                                                                                     |
| ---------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bottom-nav-buttons/`  | `assets/bottom-nav-buttons/` | ~7 MB of raw source art for the **four-tab** bottom bar, `WHOLESALE.png`/`wholesalecolor.png` included. The bar became three tabs on 2026-08-03 (商务/Wholesale dropped) and the live icons are Figma SVG exports under `public/eldreve/nav/`. Nothing referenced these files. |

## Retired 2026-07-26

| Path here                                       | Came from            | Why it was retired                                                                                                                                                                                     |
| ----------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `public/bottom-nav/` (8 files)                  | `public/bottom-nav/` | Superseded by the 07-25 redesign. The live tab bar renders `/eldreve/home/763-*.png`; see the `TABS` table in `components/chrome.tsx`. No code referenced these.                                       |
| `public/home/` (5 files)                        | `public/home/`       | `banner`, `gift-box`, `rose-gold`, `rose-red`, `rose-white`. Unreferenced; only `logo.png` survived and stays in `public/home/`.                                                                       |
| `public/products/` (5 files)                    | `public/products/`   | `occasions`, `process`, `real-rose-comparison`, `romance-dinner`, `valentine-lifestyle`. Unreferenced by code, seed data, or the local file database. The four product photos still in use stayed put. |
| `public/*.svg` (5 files)                        | `public/`            | `next`, `vercel`, `globe`, `window`, `file` — untouched `create-next-app` scaffolding.                                                                                                                 |
| `tests/e2e/stage9-live-data.spec.ts-snapshots/` | same                 | Playwright's default snapshot layout, orphaned when `playwright.config.ts` set `snapshotPathTemplate` to share `tests/e2e/__screenshots__/`. The live baseline of the same name lives there.           |

## Before restoring anything

`next.config.ts` sends a 7-day cache header to `/eldreve`, `/home`, `/products`
and `/top-nav`. `bottom-nav` was dropped from that rule when the folder emptied
— put it back if those icons ever return.

## If you would rather delete

Git history holds every one of these, so deleting this folder loses nothing
that `git log --diff-filter=D` cannot recover.
