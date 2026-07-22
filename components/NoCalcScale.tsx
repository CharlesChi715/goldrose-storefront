"use client";

import { useEffect } from "react";

/**
 * ROLE OF THIS FILE
 * JS fallback for browsers without calc() length division (pre-~2024 engines,
 * e.g. old Android WebViews / in-app browsers): re-applies the /base design
 * scale via `zoom` (or transform where zoom is unsupported) so narrow screens
 * never scroll sideways. No-op on modern browsers, which take the pure-CSS
 * @supports path. Replaces the old inline <script> fallbacks: React never
 * executes <script> tags it renders on the client, so after a client-side
 * navigation (e.g. tapping a bottom-nav tab) those scripts were dead code and
 * dev builds logged an error. An effect runs on every navigation. The cost is
 * that on the old engines the fit happens post-hydration instead of during
 * HTML parse — a brief mis-scale flash on first paint, fallback-only.
 */
export default function NoCalcScale({
  base,
  stage,
  origin,
  wrap,
  height,
}: {
  /** Design width the stage is authored at (scale = min(100vw, 480) / base). */
  base: number;
  /** Selector of the element to scale. */
  stage: string;
  origin: "top center" | "bottom center";
  /** Overflow wrapper whose height must track the transform-scaled stage. */
  wrap?: string;
  /** Unscaled stage height, for the wrap-height correction. */
  height?: number;
}) {
  useEffect(() => {
    if (window.CSS?.supports?.("transform", `scale(calc(100vw / ${base}px))`)) return;
    const el = document.querySelector<HTMLElement>(stage);
    if (!el) return;
    const zoomable = "zoom" in el.style;
    const fit = () => {
      const s = Math.min(window.innerWidth, 480) / base;
      if (zoomable) {
        (el.style as CSSStyleDeclaration & { zoom: string }).zoom = String(s);
      } else {
        // zoom affects layout size; transform doesn't — fix the wrapper height.
        el.style.transform = `scale(${s})`;
        el.style.transformOrigin = origin;
        if (wrap && height !== undefined) {
          const wr = document.querySelector<HTMLElement>(wrap);
          if (wr) {
            wr.style.height = `${height * s}px`;
            wr.style.overflow = "hidden";
          }
        }
      }
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [base, stage, origin, wrap, height]);
  return null;
}
