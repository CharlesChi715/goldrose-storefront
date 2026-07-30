"use client";
/**
 * ROLE OF THIS FILE
 * The cross-fade between bottom-nav tabs (owner, 2026-07-25). Tapping a tab
 * fades the page canvas out, commits the route, then fades the new canvas in;
 * the tab bar sits outside the fade and never blinks, the way a native tab bar
 * behaves.
 *
 * The fade is a class on <html> rather than React state because the two halves
 * happen on different pages: `FadeLink` adds it before navigating, and
 * `PageFade` — mounted once per page by ScaleFrame — drops it once the new
 * route has painted. A safety timer clears it if a navigation never lands, so
 * a failed route can never leave the canvas invisible.
 *
 * Reduced motion opts out of both halves: the link navigates immediately and
 * the CSS keeps the canvas opaque.
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

/** Fade-out duration; also how long the tap waits before the route commits. */
const FADE_MS = 150;

/** Class on <html> while the canvas is faded out. */
const FADING = "figv-fading";

/** Last resort: never leave the canvas hidden if a navigation never lands. */
const SAFETY_MS = 2000;

const wantsMotion = () =>
  !globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * The fade's CSS plus the effect that ends it when a new route paints.
 *
 * Rendered once per page by ScaleFrame, outside the faded canvas.
 *
 * @returns The fade stylesheet (the fade-in itself is a class removal).
 */
export function PageFade() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    // Two frames: the incoming canvas must paint at opacity 0 before the class
    // drops, or the browser has nothing to transition from and it snaps in.
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => root.classList.remove(FADING));
    });
    const safety = globalThis.setTimeout(
      () => root.classList.remove(FADING),
      SAFETY_MS,
    );
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
      globalThis.clearTimeout(safety);
    };
  }, [pathname]);

  return (
    <style>{`
      .figv-wrap { transition: opacity ${FADE_MS}ms ease; }
      html.${FADING} .figv-wrap { opacity: 0; }
      @media (prefers-reduced-motion: reduce) {
        .figv-wrap { transition: none; }
        html.${FADING} .figv-wrap { opacity: 1; }
      }
    `}</style>
  );
}

/**
 * A tab link that fades the canvas out before it navigates. Used by the
 * bottom-nav tabs and by the /account account-type tabs (Gift Shopping ↔
 * Business & Partnerships), which are two routes rather than one toggle.
 *
 * Falls back to a plain `Link` for same-tab taps, modified clicks (new tab,
 * new window) and reduced motion.
 *
 * @param href - Tab destination.
 * @param style - Positioning for the tab's hit area.
 * @param ariaLabel - Accessible name, for tabs whose label is baked into art.
 * @param children - The tab's art.
 * @returns The tab link.
 */
export function FadeLink({
  href,
  style,
  ariaLabel,
  children,
}: {
  href: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Link
      href={href}
      style={style}
      aria-label={ariaLabel}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)
          return;
        if (href === pathname || !wantsMotion()) return;
        e.preventDefault();
        document.documentElement.classList.add(FADING);
        globalThis.setTimeout(() => router.push(href), FADE_MS);
      }}
    >
      {children}
    </Link>
  );
}
