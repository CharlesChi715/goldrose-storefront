"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * The header back arrow. Behaves like a real app back button: navigates
 * browser history when there is somewhere to go back to, otherwise falls
 * back to the page's natural parent (product → /shop, shop → /).
 */

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// sessionStorage marker: set once this tab has rendered any page of ours, so
// "back" only walks history when the previous entry is our own site (a fresh
// tab that landed straight on a product page falls back to the parent page
// instead of escaping to about:blank or another site).
const VISITED_KEY = "goldrose-visited";

export function BackButton({
  fallback,
  src = "/top-nav/back.png",
  style,
}: {
  /** Where to go when there's no on-site history (e.g. the page was opened directly). */
  fallback: string;
  src?: string;
  style?: React.CSSProperties;
}) {
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(VISITED_KEY)) setCanGoBack(true);
      sessionStorage.setItem(VISITED_KEY, "1");
    } catch {
      // sessionStorage unavailable (privacy mode) — fallback link still works.
    }
  }, []);

  return (
    <button
      type="button"
      aria-label="Back"
      onClick={() => {
        if (canGoBack && window.history.length > 1) {
          router.back();
        } else {
          router.push(fallback);
        }
      }}
      style={{
        display: "block",
        border: "none",
        padding: 0,
        background: "transparent",
        cursor: "pointer",
        ...style,
      }}
    >
      <img src={src} alt="" style={{ display: "block", width: "100%", height: "100%", objectFit: "contain" }} />
    </button>
  );
}
