"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * The header's menu button plus the slide-in navigation drawer it opens
 * (Figma "Homepage · Menu Open", node 765:114 — scrim 765:130 + drawer
 * 765:131). The button keeps the owner's own menu art and the exact box the
 * static header image occupied, so the header stays pixel-identical when the
 * drawer is closed.
 */

import { useState } from "react";
import { MenuDrawer } from "@/components/MenuDrawer";

export function MenuButton({
  src = "/veloria/home/549-88.png",
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
        aria-label="Open menu"
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
        <img src={src} alt="" style={{ display: "block", width: "100%", height: "100%" }} />
      </button>
      <MenuDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
