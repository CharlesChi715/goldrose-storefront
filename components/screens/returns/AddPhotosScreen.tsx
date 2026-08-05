"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * /account/returns/add-photos — pixel-exact implementation of
 * "/account/returns/add-photos · edit" (2030:186, AFTER-SALES batch,
 * imported 2026-08-02). All data is the design's mock — no returns backend.
 *
 * Live wiring: the Reason row echoes the reason picked in the
 * SELECT-RETURN-REASON sheet (?reason= slug from the page, default "Item
 * arrived damaged"); Change › reopens the sheet preselected; Submit Request
 * → /account/returns/request-submitted. Everything else is inert by rule:
 * the upload dropzone is visual-only — NO real file input (the repo's
 * live-input hazard rule: a working control that stores nothing would fake
 * a feature) — and the "Describe the issue" textarea is a styled div
 * showing the mock's text and 62/500 counter.
 */

import { useState } from "react";
import Link from "next/link";
import { ScaleFrame } from "@/components/chrome";
import {
  card,
  CARD_BG,
  LineGlyph,
  PAGE_BG,
  ReturnsHeader,
} from "@/components/screens/returns/returns-chrome";
import {
  reasonLabel,
  ReturnReasonSheet,
} from "@/components/screens/returns/ReturnReasonSheet";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";

const A = "/eldreve/screens";
const TITLE_INK = "#171311";
const HEADING_INK = "#1A1412";
const BUTTON_INK = "#271F1B";

export function AddPhotosScreen({ reasonSlug }: { reasonSlug?: string }) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <ScaleFrame
      height={932}
      background={PAGE_BG}
      fontClass={notoSC.className}
      nav={false}
    >
      {/* 2024:335 Brand Navigation (instance at y0) */}
      <ReturnsHeader backFallback="/account/returns" />

      {/* 2046:183/184 title + subtitle */}
      <div
        className={playfair.className}
        style={{
          ...abs(18, 82, 394),
          ...txt(29, 38.7, TITLE_INK, "center"),
          fontWeight: 600,
        }}
      >
        {"Add Photos & Details"}
      </div>
      <div
        style={{ ...abs(18, 121, 394), ...txt(12, 14.4, "#2E2926", "center") }}
      >
        Help us review your request faster.
      </div>

      {/* 2046:185…188 product card */}
      <div style={card(22, 154, 386, 124)} />
      <img
        src={`${A}/2046-186.png`}
        alt=""
        width={100}
        height={96}
        style={{
          ...abs(34, 168, 100, 96),
          borderRadius: 10,
          objectFit: "cover",
          display: "block",
        }}
      />
      <div
        className={playfair.className}
        style={{
          ...abs(148, 186, 246, 40),
          ...txt(15, 20, TITLE_INK),
          fontWeight: 600,
          whiteSpace: "normal",
        }}
      >
        24K Gold-Plated Rose · Golden Memory
      </div>
      <div style={{ ...abs(148, 220, 220), ...txt(10, 12, "#423B36") }}>
        Order #GR202506150311
      </div>

      {/* 2046:189…191 keep-everything note */}
      <div
        style={{
          ...abs(22, 292, 386, 74),
          background: "#FFF8EB",
          boxShadow: "inset 0 0 0 1px #F0D2A0",
          borderRadius: 12,
        }}
      />
      <LineGlyph
        src="2046-190"
        x={37}
        y={312}
        w={42}
        lh={31.2}
        ink={[25, 25]}
      />
      <div
        style={{
          ...abs(86, 308, 302),
          ...txt(11, 19, "#3B332E"),
          whiteSpace: "pre-line",
        }}
      >
        {
          "Please keep the product, shipping box, label, and\ninner packaging until the review is complete."
        }
      </div>

      {/* 2046:192…201 Add Photos card */}
      <div style={card(22, 380, 386, 250)} />
      <div
        className={playfair.className}
        style={{
          ...abs(36, 392, 350),
          ...txt(18, 24, HEADING_INK),
          fontWeight: 600,
        }}
      >
        Add Photos
      </div>
      <div style={{ ...abs(36, 419, 352), ...txt(10, 12, "#3D3630") }}>
        Upload one or more photos to support your request.
      </div>
      {/* 2046:195 dropzone — the render shows the 1px #DFA549 inside-stroke
          dashed; border (not boxShadow) is the only way to dash it, and the
          global border-box sizing keeps it inside the node box. Visual-only:
          no file input behind it (live-input hazard rule). */}
      <div
        style={{
          ...abs(36, 448, 358, 148),
          background: "#FFFCF8",
          border: "1px dashed #DFA549",
          borderRadius: 12,
        }}
      />
      <img
        src={`${A}/2046-196.svg`}
        alt=""
        width={42}
        height={42}
        style={{ ...abs(194, 472, 42, 42), display: "block" }}
      />
      <div
        className={playfair.className}
        style={{
          ...abs(36, 523, 358),
          ...txt(16, 21.3, "#1C1714", "center"),
          fontWeight: 500,
        }}
      >
        Upload photo
      </div>
      <div
        style={{ ...abs(36, 551, 358), ...txt(10, 12, "#615952", "center") }}
      >
        Tap to browse
      </div>
      <div
        style={{ ...abs(36, 605, 358), ...txt(10, 12, "#38332E", "center") }}
      >
        {"✣  You can upload multiple photos."}
      </div>

      {/* 2046:202/203 describe-the-issue heading */}
      <div
        className={playfair.className}
        style={{
          ...abs(22, 646, 230),
          ...txt(17, 22.7, HEADING_INK),
          fontWeight: 600,
        }}
      >
        Describe the issue
      </div>
      <div style={{ ...abs(185, 648, 100), ...txt(11, 13.2, "#615952") }}>
        (optional)
      </div>

      {/* 2046:204…206 textarea — styled div with the mock's text, per the
          live-input hazard rule */}
      <div style={{ ...card(22, 678, 386, 108), background: CARD_BG }} />
      <div style={{ ...abs(36, 692, 350), ...txt(11, 13.2, "#332E2B") }}>
        The rose head arrived bent and the outer box was dented.
      </div>
      <div style={{ ...abs(322, 756, 66), ...txt(10, 12, "#665E57", "right") }}>
        62/500
      </div>

      {/* 2046:207…210 reason row — echoes the sheet's pick */}
      <div
        style={{
          ...abs(22, 798, 386, 54),
          background: "#FFFCF8",
          boxShadow: "inset 0 0 0 1px #E9DFD3",
          borderRadius: 12,
        }}
      />
      <LineGlyph src="2046-208" x={34} y={812} w={40} lh={24} ink={[20, 20]} />
      <div
        className={playfair.className}
        style={{
          ...abs(80, 814, 240),
          ...txt(13, 17.3, "#241F1A"),
          fontWeight: 500,
        }}
      >
        {"Reason:  "}
        {reasonLabel(reasonSlug)}
      </div>
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        style={{
          ...abs(322, 814, 68),
          ...txt(12, 14.4, "#CC7503", "right"),
          fontWeight: 500,
          background: "transparent",
          border: 0,
          padding: 0,
          cursor: "pointer",
        }}
      >
        {"Change  ›"}
      </button>

      {/* 2046:211 Submit Request → the submitted confirmation */}
      <Link
        href="/account/returns/request-submitted"
        style={{
          ...abs(22, 864, 386, 50),
          background: BUTTON_INK,
          borderRadius: 12,
          display: "block",
        }}
      >
        <span
          className={playfair.className}
          style={{
            ...abs(0, 11, 386),
            ...txt(18, 24, "#FFFAF2", "center"),
            fontWeight: 600,
            display: "block",
          }}
        >
          Submit Request
        </span>
      </Link>

      {/* 2046:213 reassurance line */}
      <div
        style={{ ...abs(22, 920, 386), ...txt(10, 12, "#736B63", "center") }}
      >
        {"▣  Your information is safe and secure."}
      </div>

      <ReturnReasonSheet
        open={sheetOpen}
        initialSlug={reasonSlug}
        onClose={() => setSheetOpen(false)}
      />
    </ScaleFrame>
  );
}
