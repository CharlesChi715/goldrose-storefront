# Homepage modules (A-1 … A-11)

`app/page.tsx` stacks these eleven bands, in order, inside one `ScaleFrame`.

The `A<n>` names are the **design team's** identifiers, not ours — they match
the Figma frame, the entries in [`docs/ixd/`](../../docs/ixd/README.md), and the
`implements H-09` style references used in commit messages. That shared
vocabulary is worth more than self-describing filenames, so this table carries
the meaning instead of a rename.

| File | Figma node | What the band is |
| --- | --- | --- |
| `A1.tsx` | 138:57 | Hero and intro — eyebrow/title/subtitle, two pill CTAs, three benefit tiles, hero gift-box photo |
| `A2.tsx` | 138:58 | Featured Rose Gifts — "Best Sellers" row, product cards, carousel dots |
| `A3.tsx` | 138:59 | New Arrivals and Ready to Ship — hero + pendant pair, two rows, Real Rose Promise |
| `A4.tsx` | 138:60 | Real Rose Story and MORI entry — three-step story strip, MORI gift-finder panel |
| `A5.tsx` | 138:61 | Shop by Occasion — occasion chips and an auto-sliding recipient rail |
| `A6.tsx` | 138:62 | Shop by Recipient and Reviews — recipient chips, gift cards, "Real Gifts, Real Moments" |
| `A7.tsx` | 138:63 | MORI Gift Finder — illustration, criteria chips, "See MORI's Picks" |
| `A8.tsx` | 138:64 | Personalized Gold Rose Gifts — the `#personalize` anchor |
| `A9.tsx` | 138:65 | Craft, Workshop and Patents — the `#craft` anchor |
| `A10.tsx` | 138:66 | Corporate Partnerships |
| `A11.tsx` | 138:67 | Story, FAQ and Final CTA |

## Shared pieces in this folder

| File | Role |
| --- | --- |
| `Carousel.tsx` | The one sliding-track implementation. Every rail below uses it — do not write a second one. |
| `HeroCarousel.tsx` | A-1's hero slider; brisk timings, drag-follows the pointer |
| `BestSellersRail.tsx` | A-2's rail |
| `OccasionRail.tsx` | A-5's rail |
| `ReviewsRail.tsx` | A-6's review strip |

Each module file opens with a `ROLE OF THIS FILE` comment giving its exact
Figma node, canvas coordinates, and which parts are wired versus pixel-exact
placeholders. Read that before changing a band.
