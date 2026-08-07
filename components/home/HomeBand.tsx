/**
 * ROLE OF THIS FILE
 * The wrapper that lets a homepage band be hidden or slid up the stage without
 * touching a single imported coordinate.
 *
 * The bands are absolutely positioned at their Figma y-offsets, so removing
 * one has to close the gap explicitly (lib/home-content/layout.ts does that
 * arithmetic). This component applies the result:
 *
 * - hidden → render nothing;
 * - shift 0 → render the children bare, so the untouched page produces exactly
 *   the DOM it produced before this feature existed (that is what keeps
 *   tests/e2e/pixels.spec.ts byte-identical);
 * - otherwise → one `position: absolute; inset: 0` box, which shares the
 *   stage's own origin so every child keeps its coordinate, moved by
 *   `translateY`.
 */

import type { ReactNode } from "react";

/**
 * Position one homepage band according to the computed layout.
 *
 * @param props.shift - Pixels to slide the band up (0 or negative).
 * @param props.hidden - True when the owner has switched this section off.
 * @param props.children - The band's imported content.
 * @returns The band, moved, or nothing when hidden.
 */
export function HomeBand({
  shift,
  hidden = false,
  children,
}: {
  shift: number;
  hidden?: boolean;
  children: ReactNode;
}) {
  if (hidden) return null;
  if (shift === 0) return <>{children}</>;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transform: `translateY(${shift}px)`,
      }}
    >
      {children}
    </div>
  );
}
