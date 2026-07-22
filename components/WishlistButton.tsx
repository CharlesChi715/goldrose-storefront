"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * The product-page header heart (owner's top-nav art). Tapping it toggles the
 * product in/out of a device-local wishlist and swaps the outline heart for
 * the gold active version — same idle/active pattern as the bottom nav.
 * No account or backend yet: the list lives in localStorage only.
 */

import { useEffect, useState } from "react";

const KEY = "goldrose-wishlist";

function readList(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function WishlistButton({
  slug,
  style,
}: {
  /** Product handle — the localStorage list stores these. */
  slug: string;
  style?: React.CSSProperties;
}) {
  // Render the idle heart on the server / first paint, then reflect storage
  // after mount (keeps SSR markup deterministic and the pixel baseline idle).
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(readList().includes(slug));
  }, [slug]);

  const toggle = () => {
    const next = !saved;
    setSaved(next);
    try {
      const list = readList().filter((s) => s !== slug);
      if (next) list.push(slug);
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch {
      // localStorage unavailable (privacy mode) — the heart still toggles
      // visually for this page view.
    }
  };

  return (
    <button
      type="button"
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={saved}
      onClick={toggle}
      style={{
        display: "block",
        border: "none",
        padding: 0,
        background: "transparent",
        cursor: "pointer",
        ...style,
      }}
    >
      <img
        src={saved ? "/top-nav/wishlist-active.png" : "/top-nav/wishlist.png"}
        alt=""
        style={{ display: "block", width: "100%", height: "100%", objectFit: "contain" }}
      />
    </button>
  );
}
