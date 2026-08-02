"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * /account/delete — pixel-exact implementation of the 07-29 frame
 * "mepage-Account & Privacy-Delete Account" (1523:1226). Geometry, colors,
 * fonts and copy verbatim from the Figma REST data; icons are Figma's own
 * SVG exports.
 *
 * Visual placeholder, deliberately inert: account deletion is destructive
 * and has no backend flow (GDPR-style deletion touches orders, auth and
 * files — an owner decision, flagged in docs/ixd/README.md). The
 * type-DELETE field is a styled div (the live-input hazard rule), the
 * checkbox flips visually so the state can be reviewed, and the red
 * button does nothing.
 *
 * Unlike the settings frames' shared back/title pair (SettingsHeader), the
 * 07-29 confirm frames carry their own header: a brand band (1523:1263) and
 * an image back arrow (1523:1265, 返回 2) at y68 — so the header is drawn
 * here from the sheet.
 */

import { useState } from "react";
import { BackButton } from "@/components/BackButton";
import { ScaleFrame } from "@/components/chrome";
import {
  CREAM,
  INK,
  sCard,
  BrandWordmark,
} from "@/components/screens/account-chrome";
import { Glyph } from "@/components/screens/glyphs";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";

const RED = "#CC332B";

// 1523:1239…1250 — the four warning rows (cream chip, glyph, text), one
// every 61px from y342.
const WARNINGS: Array<{ icon: string; ink: [number, number]; text: string }> = [
  {
    icon: "1523-1240",
    ink: [15, 15],
    text: "You will lose access to order history",
  },
  {
    icon: "1523-1243",
    ink: [14, 14],
    text: "Saved designs and wishlist will be removed",
  },
  {
    icon: "1523-1246",
    ink: [10, 10],
    text: "Some requests may take time to process",
  },
  { icon: "1523-1249", ink: [16, 14], text: "This action cannot be undone" },
];

export function DeleteConfirmScreen() {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <ScaleFrame
      height={932}
      background={CREAM}
      fontClass={notoSC.className}
      nav={false}
    >
      {/* 1523:1263/1265/1227 — brand band, image back arrow, title */}
      <BrandWordmark x={148} y={0} w={140} h={51} />
      <BackButton
        fallback="/account"
        src="/veloria/screens/1523-1265.png"
        style={abs(15, 68, 40, 42)}
      />
      <div
        className={playfair.className}
        style={{
          ...abs(86, 69, 278),
          ...txt(25, 28, INK, "center"),
          fontWeight: 500,
        }}
      >
        Delete Account
      </div>

      {/* hero card */}
      <div style={sCard(16, 126, 398, 132)} />
      <div
        style={{
          ...abs(40, 168, 235),
          ...txt(14, 20, INK),
          whiteSpace: "pre-line",
        }}
      >
        {"Permanently close your account\nand remove associated data."}
      </div>
      <img
        src="/veloria/screens/1523-1230.svg"
        alt=""
        width={92}
        height={78}
        style={{ ...abs(310, 153, 92, 78), display: "block" }}
      />

      {/* warnings */}
      <div style={sCard(16, 270, 398, 324)} />
      <img
        src="/veloria/screens/1523-1235.svg"
        alt=""
        width={28}
        height={28}
        style={{ ...abs(36, 290, 28, 28), display: "block" }}
      />
      <div style={{ ...abs(76, 292, 300), ...txt(15, 20, INK) }}>
        Before you delete, please note:
      </div>
      {WARNINGS.map((warning, i) => {
        const y = 342 + i * 61;
        return (
          <div key={warning.icon}>
            <div
              style={sCard(34, y, 362, 52, { bg: CREAM, r: 9, shadow: false })}
            />
            <Glyph
              src={warning.icon}
              x={48}
              y={y + 15}
              w={28}
              h={20}
              ink={warning.ink}
            />
            <div style={{ ...abs(90, y + 17, 280), ...txt(11, 20, INK) }}>
              {warning.text}
            </div>
          </div>
        );
      })}

      {/* confirm card — styled div for the DELETE field, checkbox flips visually */}
      <div style={sCard(16, 606, 398, 196)} />
      <img
        src="/veloria/screens/1523-1252.svg"
        alt=""
        width={24}
        height={24}
        style={{ ...abs(34, 624, 24, 24), display: "block" }}
      />
      <div style={{ ...abs(68, 629, 280), ...txt(15, 20, INK) }}>
        Confirm deletion
      </div>
      <div style={{ ...abs(34, 664, 280), ...txt(10, 16, INK) }}>
        Type DELETE to confirm
      </div>
      <div
        style={sCard(34, 688, 362, 48, { bg: CREAM, r: 10, shadow: false })}
      />
      <div style={{ ...abs(46, 702, 330), ...txt(14, 20, INK) }}>DELETE</div>
      <button
        type="button"
        role="checkbox"
        aria-checked={acknowledged}
        aria-label="I understand the consequences"
        onClick={() => setAcknowledged((v) => !v)}
        style={{
          ...sCard(34, 754, 22, 22, { bg: CREAM, r: 4, shadow: false }),
          border: 0,
          padding: 0,
          cursor: "pointer",
        }}
      >
        {acknowledged ? (
          <span
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 1,
              ...txt(14, 20, INK, "center"),
            }}
          >
            ✓
          </span>
        ) : null}
      </button>
      <div style={{ ...abs(68, 757, 300), ...txt(11, 20, INK) }}>
        I understand the consequences
      </div>

      {/* Delete account — inert (no deletion backend; owner decision pending) */}
      <div style={sCard(16, 816, 398, 76, { bg: RED, r: 16, stroke: false })} />
      <div style={{ ...abs(163, 844, 160), ...txt(16, 20, CREAM) }}>
        Delete account
      </div>
    </ScaleFrame>
  );
}
