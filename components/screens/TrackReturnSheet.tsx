"use client";

/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * The return-reason bottom sheet of /orders/track?return=1 — the modal band
 * of "…track order_return" (1542:628, 07-29; absorbs the never-imported
 * RETURNS-REASON-SELECT-OVERLAY 1339:112). Dim overlay (#0F0E0D at 64%)
 * over the track page, cream sheet from y286 with the 10 return reasons.
 *
 * Interaction is the design's visual layer only: picking a reason fills its
 * radio (ink dot). Confirm Return follows the prototype wiring (1523:1430 →
 * 1593:114) to /account/returns/request-submitted — a coming-soon scaffold,
 * since that target frame is not Ready-for-dev and there is no returns
 * backend. Close (× or the dim area) returns to the plain track page. Portalled to <body> and
 * bottom-anchored (the PdpOverlays stage pattern — ScaleFrame's transform
 * would swallow position:fixed).
 *
 * NOTE the modal speaks the cream/ink account language while the track page
 * behind it stays in the C-flow green palette — verbatim from the frame
 * (findings note).
 */

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import NoCalcScale from "@/components/NoCalcScale";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";

const A = "/veloria/screens";
const INK = "#3B2F2F";
const SAND = "#E5D9C9";

/** 1542:749…788 · uniform 27px rows from y508; dividers at row bottom. */
// SSR-safe mounted detection for the portal (the PdpOverlays pattern).
const subscribeToNothing = () => () => {};
const onTheClient = () => true;
const onTheServer = () => false;

const REASONS = [
  "1.  Item arrived damaged",
  "2.  Item has a quality issue",
  "3.  Received the wrong item",
  "4.  Missing parts or packaging",
  "5.  Item was not as described",
  "6.  Arrived too late",
  "7.  Gift recipient didn't want it",
  "8.  Ordered by mistake",
  "9.  No longer needed / Changed my mind",
  "10. Other",
];

export function TrackReturnSheet() {
  const mounted = useSyncExternalStore(
    subscribeToNothing,
    onTheClient,
    onTheServer,
  );
  const [selected, setSelected] = useState<number | null>(null);
  if (!mounted) {
    return null;
  }

  return createPortal(
    <>
      <style>{`
        .figv-returnstage { position: fixed; bottom: 0; width: 430px; height: 932px; left: calc((100% - 430px) / 2); z-index: 40; }
        @media (max-width: 480px) {
          .figv-returnstage { transform: scale(calc(min(100vw, 480px) / 430px)); transform-origin: bottom center; }
        }
      `}</style>
      <div
        className={`figv-returnstage ${notoSC.className}`}
        role="dialog"
        aria-modal="true"
        aria-label="Return this order"
      >
        {/* 1542:736 · dim overlay — tapping it closes the sheet */}
        <Link
          href="/orders/track"
          aria-label="Close"
          style={{
            ...abs(0, 0, 430, 932),
            background: "rgba(15,14,13,0.64)",
            display: "block",
          }}
        />

        {/* 1542:737 · the sheet (#FFFEFB, top corners 16) */}
        <div
          style={{
            ...abs(0, 286, 430, 646),
            background: "#FFFEFB",
            borderRadius: "16px 16px 0 0",
          }}
        />
        <Link
          href="/orders/track"
          aria-label="Close"
          style={{ ...abs(340, 304, 26, 26), display: "block" }}
        >
          <img
            src={`${A}/1542-738.svg`}
            alt=""
            width={26}
            height={26}
            style={{ display: "block" }}
          />
        </Link>
        <img
          src={`${A}/1542-740.png`}
          alt=""
          width={104}
          height={90}
          style={{
            ...abs(28, 330, 104, 90),
            borderRadius: 9,
            boxShadow: `inset 0 0 0 1px ${SAND}`,
            display: "block",
            objectFit: "cover",
          }}
        />
        <div
          className={playfair.className}
          style={{
            ...abs(146, 348, 210),
            ...txt(20, 27, INK),
            fontWeight: 600,
          }}
        >
          Before you return it
        </div>
        <div
          style={{
            ...abs(146, 380, 205),
            ...txt(11, 14.9, INK),
            whiteSpace: "normal",
          }}
        >
          Select the reason that best describes your experience.
        </div>
        <div
          className={playfair.className}
          style={{
            ...abs(28, 436, 280),
            ...txt(15, 20.3, INK),
            fontWeight: 500,
          }}
        >
          Select a return reason
        </div>

        {/* 1542:744 · photo note */}
        <div
          style={{
            ...abs(28, 464, 326, 38),
            background: "#FFF7EB",
            boxShadow: `inset 0 0 0 1px ${SAND}`,
            borderRadius: 8,
          }}
        />
        <img
          src={`${A}/1542-745.svg`}
          alt=""
          width={16}
          height={16}
          style={{ ...abs(37, 474, 16, 16), display: "block" }}
        />
        <div
          style={{
            ...abs(59, 471, 288),
            ...txt(8, 11, INK),
            whiteSpace: "normal",
          }}
        >
          For damaged, quality, wrong item, or missing parts issues, you may be
          asked to upload 1–3 photos.
        </div>

        {REASONS.map((label, i) => {
          const y = 508 + i * 27;
          return (
            <div key={label}>
              <button
                type="button"
                role="radio"
                aria-checked={selected === i}
                aria-label={label.replace(/^\d+\.\s+/, "")}
                onClick={() => setSelected(i)}
                style={{
                  ...abs(28, y, 326, 27),
                  background: "none",
                  border: 0,
                  padding: 0,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    ...abs(2, 6, 300),
                    ...txt(9, 13, INK),
                    display: "block",
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    ...abs(307, 6, 13, 13),
                    borderRadius: 7,
                    boxShadow: `inset 0 0 0 1px ${INK}`,
                    background: selected === i ? INK : "transparent",
                    display: "block",
                  }}
                />
              </button>
              <div
                style={{
                  ...abs(28, y + 26, 326, 1),
                  background: SAND,
                  opacity: i >= 7 ? 0.75 : 1,
                }}
              />
            </div>
          );
        })}

        {/* 1542:789 · footer — sheet-verbatim 382-wide band with top hairline */}
        <div
          style={{
            ...abs(0, 789, 382, 119),
            background: "#FFFBF5",
            boxShadow: `inset 0 1px 0 0 ${SAND}`,
          }}
        />
        <div
          className={playfair.className}
          style={{ ...abs(28, 814, 88), ...txt(12, 16, INK), fontWeight: 500 }}
        >
          Refund amount:
        </div>
        <div
          className={playfair.className}
          style={{ ...abs(28, 840, 64), ...txt(18, 23, INK), fontWeight: 600 }}
        >
          $129.00
        </div>
        {/* Confirm Return — prototype 1523:1430 navigates to the un-ready
            RETURNS-REQUEST-SUBMITTED-PAGE (1593:114), so this lands on the
            coming-soon scaffold until that frame is marked Ready-for-dev. */}
        <Link
          href="/account/returns/request-submitted"
          style={{
            ...abs(174, 820, 180, 58),
            background: INK,
            boxShadow: "inset 0 0 0 1px #D4AF37",
            borderRadius: 9,
          }}
        >
          <div
            className={playfair.className}
            style={{
              ...abs(12, 17, 156),
              ...txt(17, 22, "#FFF6EC", "center"),
              fontWeight: 500,
            }}
          >
            Confirm Return
          </div>
        </Link>
      </div>
      <NoCalcScale
        base={430}
        stage=".figv-returnstage"
        origin="bottom center"
      />
    </>,
    document.body,
  );
}
