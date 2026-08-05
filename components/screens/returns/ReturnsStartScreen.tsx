"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * /account/returns — pixel-exact implementation of the AFTER-SALES batch's
 * "/account/returns · default" (2030:189) and "· status" (2030:188),
 * imported 2026-08-02. One route, two tab states drawn to each frame's own
 * geometry (the two frames size the tab pill and cards differently);
 * ?tab=status deep-links the After-Sales Status tab (the /care ?tab=
 * precedent — internal switches stay local state). Replaces the 07-28
 * ACCOUNT-RETURNS-AFTER-SALES import (1230:119, ReturnsScreen — deleted).
 *
 * Everything shown is the design's mock — order, request ids, dates,
 * statuses; there is no returns backend. Wired: Start Return opens the
 * SELECT-RETURN-REASON sheet (2047:194 overlay per the prototype); View
 * Details → /account/orders/details; See all orders › → /account/orders;
 * the three request cards → this flow's approved / refund-issued /
 * request-not-approved pages (prototype wiring). Card 3's ring photo is the
 * frame's four loose vectors (2048:208…211), placed at natural export size
 * over their node boxes (center-stroke exports bleed past node bounds).
 * The frame stacks two identical Brand Navigation instances; drawn once.
 */

import { useState } from "react";
import Link from "next/link";
import { ScaleFrame } from "@/components/chrome";
import {
  card,
  LineGlyph,
  PAGE_BG,
  ReturnsHeader,
} from "@/components/screens/returns/returns-chrome";
import { ReturnReasonSheet } from "@/components/screens/returns/ReturnReasonSheet";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";

const A = "/eldreve/screens";
const TITLE_INK = "#171311";
const SUBTITLE_INK = "#2E2926";
const TAB_BG = "#FFF8F0";
const TAB_STROKE = "#E7D7C6";
const UNDERLINE_GOLD = "#E98B00";
const HEADING_INK = "#1A1412";
const BODY_GREY = "#453D38";
const LINK_GOLD = "#CC7503";
const BUTTON_INK = "#271F1B";

export type ReturnsTab = "start" | "status";

/** 2048:190/198/206 — the status tab's three mock requests, frame order. */
const REQUESTS = [
  {
    href: "/account/returns/approved",
    title: "24K Gold-Plated Rose ·\nGolden Memory",
    id: "Request ID: RR-GR202506150311",
    date: "Submitted on Jul 27, 2026",
    chip: "✓  Return Approved",
    chipBg: "#EAF7E5",
    chipInk: "#0C8A24",
    photo: "2048-191",
  },
  {
    href: "/account/returns/refund-issued",
    title: "Gold Heart Necklace ·\nTimeless Love",
    id: "Request ID: RR-GR202506080221",
    date: "Submitted on Jun 8, 2026",
    chip: "✓  Refund Completed",
    chipBg: "#EAF7E5",
    chipInk: "#0C8A24",
    photo: "2048-199",
  },
  {
    href: "/account/returns/request-not-approved",
    title: "Gold Eternal Ring ·\nForever Bond",
    id: "Request ID: RR-GR2025052100175",
    date: "Submitted on May 21, 2026",
    // The design's own copy — a ✓ prefix on the red chip too (2048:216).
    chip: "✓  Request Not Approved",
    chipBg: "#FFF0ED",
    chipInk: "#D10A0A",
    photo: null, // card 3 draws the loose ring vectors instead
  },
] as const;

export function ReturnsStartScreen({
  initialTab = "start",
}: {
  initialTab?: ReturnsTab;
}) {
  const [tab, setTab] = useState<ReturnsTab>(initialTab);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <ScaleFrame
      height={932}
      background={PAGE_BG}
      fontClass={notoSC.className}
      nav={false}
    >
      {/* 2024:345 Brand Navigation (instance at y−4; its twin 2024:350 is
          an identical duplicate in the frame — drawn once) */}
      <ReturnsHeader dy={-4} backFallback="/account" />

      {/* 2049:183/184 = 2048:183/184 — title + subtitle, same on both tabs */}
      <div
        className={playfair.className}
        style={{
          ...abs(20, 88, 390),
          ...txt(29, 38.7, TITLE_INK, "center"),
          fontWeight: 600,
        }}
      >
        {"Returns & After-Sales"}
      </div>
      <div
        style={{
          ...abs(20, 128, 390),
          ...txt(11, 13.2, SUBTITLE_INK, "center"),
        }}
      >
        Start a return, report an issue, or track your refund status.
      </div>

      {/* tab pill — each frame draws it with its own geometry */}
      {tab === "start" ? (
        <>
          {/* 2049:185…188 */}
          <div
            style={{
              ...abs(28, 166, 374, 50),
              background: TAB_BG,
              boxShadow: `inset 0 0 0 1px ${TAB_STROKE}`,
              borderRadius: 25,
            }}
          />
          <button
            type="button"
            aria-pressed
            onClick={() => setTab("start")}
            style={{
              ...abs(28, 166, 187, 50),
              background: "transparent",
              border: 0,
              padding: 0,
              cursor: "pointer",
            }}
          >
            <span
              style={{
                ...abs(0, 13, 187),
                ...txt(13, 15.6, "#1F1A17", "center"),
                fontWeight: 500,
                display: "block",
              }}
            >
              Start Return
            </span>
          </button>
          <button
            type="button"
            aria-pressed={false}
            onClick={() => setTab("status")}
            style={{
              ...abs(215, 166, 187, 50),
              background: "transparent",
              border: 0,
              padding: 0,
              cursor: "pointer",
            }}
          >
            <span
              style={{
                ...abs(0, 13, 187),
                ...txt(13, 15.6, SUBTITLE_INK, "center"),
                fontWeight: 500,
                display: "block",
              }}
            >
              After-Sales Status
            </span>
          </button>
          <div
            style={{
              ...abs(45, 211, 154, 3),
              background: UNDERLINE_GOLD,
              borderRadius: 2,
            }}
          />
        </>
      ) : (
        <>
          {/* 2048:185…188 */}
          <div
            style={{
              ...abs(16, 166, 398, 52),
              background: TAB_BG,
              boxShadow: `inset 0 0 0 1px ${TAB_STROKE}`,
              borderRadius: 26,
            }}
          />
          <button
            type="button"
            aria-pressed={false}
            onClick={() => setTab("start")}
            style={{
              ...abs(16, 166, 199, 52),
              background: "transparent",
              border: 0,
              padding: 0,
              cursor: "pointer",
            }}
          >
            <span
              style={{
                ...abs(0, 14, 199),
                ...txt(13, 15.6, "#292421", "center"),
                fontWeight: 500,
                display: "block",
              }}
            >
              Start Return
            </span>
          </button>
          <button
            type="button"
            aria-pressed
            onClick={() => setTab("status")}
            style={{
              ...abs(215, 166, 199, 52),
              background: "transparent",
              border: 0,
              padding: 0,
              cursor: "pointer",
            }}
          >
            <span
              style={{
                ...abs(0, 14, 199),
                ...txt(13, 15.6, "#1F1A17", "center"),
                fontWeight: 500,
                display: "block",
              }}
            >
              After-Sales Status
            </span>
          </button>
          <div
            style={{
              ...abs(238, 213, 154, 3),
              background: UNDERLINE_GOLD,
              borderRadius: 2,
            }}
          />
        </>
      )}

      {tab === "start" ? (
        <>
          {/* 2049:189…192 Before You Start — ink card */}
          <div
            style={{
              ...abs(28, 232, 374, 150),
              background: BUTTON_INK,
              borderRadius: 12,
            }}
          />
          <LineGlyph
            src="2049-190"
            x={44}
            y={258}
            w={42}
            lh={33.6}
            ink={[27, 27]}
          />
          <div
            className={playfair.className}
            style={{
              ...abs(100, 248, 280),
              ...txt(18, 24, "#FFFAF2"),
              fontWeight: 600,
            }}
          >
            Before You Start
          </div>
          <div
            style={{
              ...abs(100, 282, 284),
              ...txt(11, 28, "#EBE3D9"),
              whiteSpace: "pre-line",
            }}
          >
            {
              "✓  30-day return window for eligible items\n✓  Report damaged or wrong items within 7 days\n✓  Do not mail items before approval"
            }
          </div>

          {/* 2049:193/194 Eligible Orders + See all orders › */}
          <div
            className={playfair.className}
            style={{
              ...abs(28, 404, 250),
              ...txt(20, 26.7, HEADING_INK),
              fontWeight: 600,
            }}
          >
            Eligible Orders
          </div>
          <Link
            href="/account/orders"
            style={{
              ...abs(292, 407, 108),
              ...txt(10, 12, LINK_GOLD, "right"),
              fontWeight: 500,
              display: "block",
            }}
          >
            {"See all orders  ›"}
          </Link>

          {/* 2049:195…206 the one eligible-order card */}
          <div style={card(28, 442, 374, 292)} />
          <img
            src={`${A}/2049-196.png`}
            alt=""
            width={120}
            height={230}
            style={{
              ...abs(40, 458, 120, 230),
              borderRadius: 10,
              objectFit: "cover",
              display: "block",
            }}
          />
          <div
            className={playfair.className}
            style={{
              ...abs(176, 460, 210),
              ...txt(16, 22, HEADING_INK),
              fontWeight: 600,
              whiteSpace: "pre-line",
            }}
          >
            {"Gold Heart Necklace ·\nTimeless Love"}
          </div>
          <div style={{ ...abs(176, 520, 210), ...txt(10, 12, BODY_GREY) }}>
            Order #GR202507280642
          </div>
          <div style={{ ...abs(176, 548, 210), ...txt(10, 12, LINK_GOLD) }}>
            {"▣  Delivered Aug 02, 2025"}
          </div>
          <div
            className={playfair.className}
            style={{
              ...abs(176, 582, 100),
              ...txt(18, 24, "#14120F"),
              fontWeight: 600,
            }}
          >
            $89.00
          </div>
          {/* chip after the title so it covers the title's overflow, as the
              frame renders it */}
          <div
            style={{
              ...abs(304, 458, 82, 28),
              background: "#EEF9E8",
              borderRadius: 8,
            }}
          />
          <div
            style={{
              ...abs(304, 464, 82),
              ...txt(9, 10.8, "#1A7014", "center"),
              fontWeight: 500,
            }}
          >
            Eligible
          </div>

          {/* 2049:203 Start Return → the reason sheet (prototype overlay) */}
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            style={{
              ...abs(176, 624, 214, 42),
              background: BUTTON_INK,
              borderRadius: 8,
              border: 0,
              padding: 0,
              cursor: "pointer",
            }}
          >
            <span
              className={playfair.className}
              style={{
                ...abs(0, 10, 214),
                ...txt(14, 18.7, TAB_BG, "center"),
                fontWeight: 500,
                display: "block",
              }}
            >
              Start Return
            </span>
          </button>
          {/* 2049:205 View Details → the static order-detail view */}
          <Link
            href="/account/orders/details"
            style={{
              ...abs(176, 676, 214, 42),
              background: TAB_BG,
              boxShadow: "inset 0 0 0 1px #8D7663",
              borderRadius: 8,
              display: "block",
            }}
          >
            <span
              className={playfair.className}
              style={{
                ...abs(0, 10, 214),
                ...txt(14, 18.7, "#251E1A", "center"),
                fontWeight: 500,
                display: "block",
              }}
            >
              View Details
            </span>
          </Link>
        </>
      ) : (
        <>
          {/* 2048:189 Your Requests */}
          <div
            className={playfair.className}
            style={{
              ...abs(16, 238, 398),
              ...txt(21, 28, HEADING_INK),
              fontWeight: 600,
            }}
          >
            Your Requests
          </div>

          {REQUESTS.map((request, i) => {
            const y = 274 + i * 202; // cards at 274 / 476 / 678
            return (
              <div key={request.href}>
                <div style={card(16, y, 398, 186)} />
                {request.photo ? (
                  <img
                    src={`${A}/${request.photo}.png`}
                    alt=""
                    width={96}
                    height={142}
                    style={{
                      ...abs(28, y + 22, 96, 142),
                      borderRadius: 10,
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  <>
                    {/* 2048:207…211 — the ring "photo" is four loose vectors;
                        center-stroke exports bleed past the node boxes, so
                        each sits at natural size centred on its node */}
                    <img
                      src={`${A}/2048-208.svg`}
                      alt=""
                      width={96}
                      height={142}
                      style={{ ...abs(28, 700, 96, 142), display: "block" }}
                    />
                    <img
                      src={`${A}/2048-209.svg`}
                      alt=""
                      width={53}
                      height={67}
                      style={{ ...abs(41.5, 739.5, 53, 67), display: "block" }}
                    />
                    <img
                      src={`${A}/2048-210.svg`}
                      alt=""
                      width={53}
                      height={67}
                      style={{ ...abs(59.5, 734.5, 53, 67), display: "block" }}
                    />
                    <img
                      src={`${A}/2048-211.svg`}
                      alt=""
                      width={58}
                      height={10}
                      style={{ ...abs(49.5, 803.65, 58, 10), display: "block" }}
                    />
                  </>
                )}
                <div
                  className={playfair.className}
                  style={{
                    ...abs(138, y + 24, 246, 42),
                    ...txt(15, 21, HEADING_INK),
                    fontWeight: 600,
                    whiteSpace: "pre-line",
                  }}
                >
                  {request.title}
                </div>
                <div
                  style={{
                    ...abs(138, y + 86, 246),
                    ...txt(10, 12, BODY_GREY),
                  }}
                >
                  {request.id}
                </div>
                <div
                  style={{
                    ...abs(138, y + 111, 246),
                    ...txt(10, 12, BODY_GREY),
                  }}
                >
                  {request.date}
                </div>
                <div
                  style={{
                    ...abs(258, y + 144, 136, 30),
                    background: request.chipBg,
                    borderRadius: 8,
                  }}
                />
                <div
                  style={{
                    ...abs(258, y + 151, 136),
                    ...txt(9, 10.8, request.chipInk, "center"),
                    fontWeight: 500,
                  }}
                >
                  {request.chip}
                </div>
                <LineGlyph
                  src="2048-197"
                  x={378}
                  y={y + 68}
                  w={20}
                  lh={33.6}
                  ink={[6, 12]}
                />
                {/* whole card navigates (2048:190/198/206 prototype clicks) */}
                <Link
                  href={request.href}
                  aria-label={`${request.id} — open status`}
                  style={{
                    ...abs(16, y, 398, 186),
                    display: "block",
                    borderRadius: 14,
                  }}
                />
              </div>
            );
          })}
        </>
      )}

      <ReturnReasonSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </ScaleFrame>
  );
}
