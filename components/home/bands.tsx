/**
 * ROLE OF THIS FILE
 * Which component draws which homepage band — stated once.
 *
 * The homepage (`app/page.tsx`) and the standalone section preview
 * (`app/preview/home/[section]/page.tsx`) both have to answer "what does the
 * `craft` section look like?", and they must never answer it differently: a
 * preview that renders its own idea of a band is a preview of nothing. So the
 * mapping lives here and both call it, which makes the preview the same JSX
 * tree the live page mounts — same components, same props, same DOM.
 *
 * POSITIONING IS NOT HERE ON PURPOSE
 * This returns the band's content only. Where it sits — the `HomeBand` wrapper
 * and its shift — differs between the two callers (the page re-stacks around
 * hidden sections; the preview slides one band to the top), so each applies its
 * own. Keeping the two concerns apart is what lets the untouched homepage still
 * render byte-identical DOM.
 */

import type { ReactNode } from "react";
import type { HomeSectionId, HomeText } from "@/lib/home-content";
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
 * @returns The band's content, or null for sections that are not bands
 *   (`promo` is chrome; `motion` is a settings group).
 */
export function homeBand(
  id: HomeSectionId,
  text: HomeText,
  timing: RailTiming,
): ReactNode {
  switch (id) {
    case "hero":
      return <A1 c={text.hero} />;
    case "featured":
      return <A2 timing={timing} c={text.featured} />;
    case "ready":
      return <A3 c={text.ready} />;
    case "occasion":
      return <A5 timing={timing} c={text.occasion} />;
    case "recipient":
      return <A6 timing={timing} c={text.recipient} />;
    case "craft":
      return <A9 c={text.craft} />;
    case "story":
      return <A11 c={text.story} />;
    default:
      return null;
  }
}
