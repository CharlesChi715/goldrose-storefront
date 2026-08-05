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
 */

import { useState } from "react";
import { SearchOverlay } from "@/components/SearchOverlay";

export function SearchButton({
  src = "/eldreve/screens/1523-1681.png",
  style,
}: {
  src?: string;
  style?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label="Search"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
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
      <SearchOverlay open={open} onClose={() => setOpen(false)} />
    </>
  );
}
