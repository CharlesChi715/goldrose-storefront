"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * The product-page header heart (owner's top-nav art). Tapping it toggles the
 * product in/out of a device-local wishlist and swaps the outline heart for
 * the gold active version — same idle/active pattern as the bottom nav.
 * No account or backend yet: the list lives in localStorage only.
 */

import { useMemo, useSyncExternalStore } from "react";

const KEY = "goldrose-wishlist";

// Same-tab writes don't fire the browser's `storage` event, so hearts notify
// each other through this set; cross-tab updates still arrive via `storage`.
const listeners = new Set<() => void>();
// In-memory copy so the heart still toggles when localStorage is unavailable
// (privacy mode) — the list then only lasts for this page view.
let memoryRaw = "[]";

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readRaw(): string {
  try {
    return localStorage.getItem(KEY) ?? memoryRaw;
  } catch {
    return memoryRaw;
  }
}

function parseList(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeList(list: string[]) {
  memoryRaw = JSON.stringify(list);
  try {
    localStorage.setItem(KEY, memoryRaw);
  } catch {
    // Privacy mode — the in-memory copy above still updates.
  }
  for (const listener of listeners) listener();
}

export function WishlistButton({
  slug,
  style,
}: {
  /** Product handle — the localStorage list stores these. */
  slug: string;
  style?: React.CSSProperties;
}) {
  // Server snapshot is always the empty list, so SSR / first paint shows the
  // idle heart (keeps markup deterministic and the pixel baseline idle);
  // storage is reflected right after hydration.
  const raw = useSyncExternalStore(subscribe, readRaw, () => "[]");
  const saved = useMemo(() => parseList(raw).includes(slug), [raw, slug]);

  const toggle = () => {
    const list = parseList(readRaw()).filter((s) => s !== slug);
    if (!saved) list.push(slug);
    writeList(list);
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
