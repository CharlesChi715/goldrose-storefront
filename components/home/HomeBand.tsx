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
 * - otherwise → one zero-sized box at the stage's own origin, so every child
 *   keeps its coordinate, moved by `translateY`.
 *
 * The wrapper is **0×0 on purpose**. It used to be `inset: 0`, which is the
 * same origin but also a full-stage rectangle — and a transparent full-stage
 * rectangle swallows every pointer event meant for the bands underneath it.
 * That stayed invisible while the only way to get a wrapper was to hide a
 * section, and surfaced on 2026-08-07 when A-3's trim gave four bands a
 * permanent shift: the homepage carousels stopped responding to swipes
 * because the finger was landing on the wrapper. A zero-sized box provides
 * the identical coordinate origin (children are positioned against its
 * padding box, at 0,0) while hit-testing reaches only the children.
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
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        transform: `translateY(${shift}px)`,
      }}
    >
      {children}
    </div>
  );
}
