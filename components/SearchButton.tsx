"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * The header's search button plus the full-screen SEARCH-OPEN overlay it
 * opens (Figma 914:114) — same pattern as MenuButton/MenuDrawer, per the
 * owner's 07-27 instruction that the 小页面 states are in-page components,
 * not routes. The button keeps the owner's search art and the exact box the
 * static header image occupied, so the header stays pixel-identical while
 * the overlay is closed.
 *
 * TWO THINGS HAPPEN AROUND THE OPEN
 * - Pointing at the button (or tabbing to it) starts fetching the search
 *   index, so the panel usually has the catalogue before the tap finishes.
 *   It is one cached request per tab and it is discarded silently if it
 *   fails — see lib/catalog/search-client.ts.
 * - Closing puts focus back on this button. Without it, dismissing the panel
 *   drops focus to the top of the document and a keyboard visitor has to tab
 *   through the whole header again to get back to where they were.
 */

import { useCallback, useRef, useState } from "react";
import { SearchOverlay } from "@/components/SearchOverlay";
import { prefetchSearchIndex } from "@/lib/catalog/search-client.ts";

export function SearchButton({
  src = "/eldreve/screens/1523-1681.png",
  style,
}: {
  src?: string;
  style?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => {
    setOpen(false);
    trigger.current?.focus();
  }, []);
  return (
    <>
      <button
        ref={trigger}
        type="button"
        aria-label="Search"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        onPointerEnter={prefetchSearchIndex}
        onFocus={prefetchSearchIndex}
        style={{
          border: "none",
          padding: 0,
          background: "transparent",
          cursor: "pointer",
          display: "block",
          ...style,
        }}
      >
        <img
          src={src}
          alt=""
          style={{ display: "block", width: "100%", height: "100%" }}
        />
      </button>
      {/* Mounted only while open, so closing genuinely resets the panel — a
          stale query and a stale highlight would otherwise be waiting behind
          the next tap. */}
      {open ? <SearchOverlay onClose={close} /> : null}
    </>
  );
}
