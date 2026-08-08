/**
 * ROLE OF THIS FILE
 * Which component draws which homepage band — stated once.
 *
 * `app/page.tsx` is the only caller, and this exists so that its stack is one
 * uniform list — `homeBand(id, text, timing, frames)` seven times — rather than seven
 * bespoke call sites with different props. Hiding and shifting then apply the
 * same way to every band, which is the property the whole re-stacking rests on.
 *
 * It had a second caller until 2026-08-08: a route that drew one band on its
 * own for the admin's section previews. Those previews are now windows onto the
 * real page, so the question "does the preview draw the same tree as the live
 * page?" cannot be answered wrongly any more — it is literally the same
 * document.
 *
 * POSITIONING IS NOT HERE ON PURPOSE
 * This returns the band's content only. Where it sits — the `HomeBand` wrapper
 * and its shift — is the page's business, and keeping the two concerns apart is
 * what lets the untouched homepage still render byte-identical DOM.
 */

import type { ReactNode } from "react";
import type { HomeSectionId, HomeText } from "@/lib/home-content";
import type { HomeFrames } from "@/lib/home-content/frames";
import type { RailTiming } from "@/lib/home-content/rail-timing";
import { A1 } from "./A1";
import { A2 } from "./A2";
import { A3 } from "./A3";
import { A5 } from "./A5";
import { A6 } from "./A6";
import { A9 } from "./A9";
import { A11 } from "./A11";

/**
 * The content of one homepage band, at its own Figma coordinates.
 *
 * @param id - The section to draw.
 * @param text - Resolved copy for the whole page.
 * @param timing - The shared card-rail timing.
 * @param frames - How each replaced photo is framed. Passed as one opaque map
 *   and forwarded unchanged: `HomePhoto` knows which slot it is drawing, so no
 *   band has to resolve a photo's framing on its behalf.
 * @returns The band's content, or null for sections that are not bands
 *   (`promo` is chrome; `motion` is a settings group).
 */
export function homeBand(
  id: HomeSectionId,
  text: HomeText,
  timing: RailTiming,
  frames?: HomeFrames,
): ReactNode {
  switch (id) {
    case "hero":
      return <A1 c={text.hero} frames={frames} />;
    case "featured":
      return <A2 timing={timing} c={text.featured} frames={frames} />;
    case "ready":
      return <A3 c={text.ready} frames={frames} />;
    case "occasion":
      return <A5 timing={timing} c={text.occasion} frames={frames} />;
    case "recipient":
      return <A6 timing={timing} c={text.recipient} frames={frames} />;
    case "craft":
      return <A9 c={text.craft} frames={frames} />;
    case "story":
      return <A11 c={text.story} frames={frames} />;
    default:
      return null;
  }
}
