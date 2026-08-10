# Homepage modules (A-1 … A-11)

`app/page.tsx` stacks these seven bands, in order, inside one `ScaleFrame`.

The `A<n>` names are the **design team's** identifiers, not ours — they match
the Figma frame, the entries in [`docs/ixd/`](../../docs/ixd/README.md), and the
`implements H-09` style references used in commit messages. That shared
vocabulary is worth more than self-describing filenames, so this table carries
the meaning instead of a rename. The gaps in the numbering are the design's
own: A-4, A-7, A-8 and A-10 were **deleted at source** in the 2026-08-04
simplified frame, and their files went with them.

| File      | Figma node | Band offset | What the band is                                                                        |
| --------- | ---------- | ----------- | ----------------------------------------------------------------------------------------- |
| `A1.tsx`  | 2380:374   | 32          | Hero and intro — gift-box photo + dots, eyebrow/title/subtitle, one pill CTA |
| `A2.tsx`  | 2380:399   | 781         | Featured Rose Gifts — "Best Sellers" row and the two product cards                  |
| `A3.tsx`  | 2380:422   | 1422        | Ready to Ship — two product rows                        |
| `A5.tsx`  | 2380:454   | 1749        | Shop by Occasion — occasion chips and an auto-sliding recipient rail                    |
| `A6.tsx`  | 2380:523   | 2225        | Shop by Recipient and Reviews — recipient chips, gift cards, "Real Gifts, Real Moments" |
| `A9.tsx`  | 2380:658   | 3014        | Craft, Workshop and Patents (cream since 08-04) — the `#craft` anchor                   |
| `A11.tsx` | 2380:727   | 4005        | Story, FAQ, gift CTA, newsletter and the footer link cloud                              |

## Shared pieces in this folder

| File                  | Role                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------- |
| `Carousel.tsx`        | The one sliding-track implementation. Every rail below uses it — do not write a second one. |
| `HeroCarousel.tsx`    | A-1's hero slider; brisk timings, drag-follows the pointer                                  |
| `BestSellersRail.tsx` | A-2's rail                                                                                  |
| `OccasionRail.tsx`    | A-5's rail                                                                                  |
| `ReviewsRail.tsx`     | A-6's review strip                                                                          |

Each module file opens with a `ROLE OF THIS FILE` comment giving its exact
Figma node, canvas coordinates, and which parts are wired versus pixel-exact
placeholders. Read that before changing a band.
