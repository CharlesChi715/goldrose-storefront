"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * /account/delete — pixel-exact implementation of ACCOUNT-DELETE-CONFIRM
 * (1234:431, 07-28). Geometry, colors, fonts and copy verbatim from the
 * Figma REST data; icons are Figma's own SVG exports.
 *
 * Visual placeholder, deliberately inert: account deletion is destructive
 * and has no backend flow (GDPR-style deletion touches orders, auth and
 * files — an owner decision, flagged in docs/ixd/README.md). The
 * type-DELETE field is a styled div (the live-input hazard rule), the
 * checkbox flips visually so the state can be reviewed, and the red
 * button does nothing.
 */

import { useState } from "react";
import { ScaleFrame } from "@/components/chrome";
import {
  AccountNavBand,
  CREAM,
  INK,
  sCard,
  SettingsHeader,
} from "@/components/screens/account-chrome";
import { Glyph } from "@/components/screens/glyphs";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC } from "@/lib/fonts";

const RED = "#CC332B";

// 1242:122…133 — the four warning rows (glyph, ink size, text).
const WARNINGS: Array<{ icon: string; ink: [number, number]; text: string }> = [
  { icon: "1242-123", ink: [15, 15], text: "You will lose access to order history" },
  { icon: "1242-126", ink: [14, 14], text: "Saved designs and wishlist will be removed" },
  { icon: "1242-129", ink: [10, 10], text: "Some requests may take time to process" },
  { icon: "1242-132", ink: [16, 14], text: "This action cannot be undone" },
];

export function DeleteConfirmScreen() {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <ScaleFrame height={932} background={CREAM} fontClass={notoSC.className} nav={false}>
      <SettingsHeader title="Delete Account" />

      {/* hero card */}
      <div style={sCard(16, 72, 398, 132)} />
      <div style={{ ...abs(40, 114, 235), ...txt(14, 20, INK), whiteSpace: "pre-line" }}>
        {"Permanently close your account\nand remove associated data."}
      </div>
      <img src="/veloria/screens/1242-113.svg" alt="" width={92} height={78} style={{ ...abs(310, 99, 92, 78), display: "block" }} />

      {/* warnings */}
      <div style={sCard(16, 216, 398, 324)} />
      <img src="/veloria/screens/1242-118.svg" alt="" width={28} height={28} style={{ ...abs(36, 236, 28, 28), display: "block" }} />
      <div style={{ ...abs(76, 238, 300), ...txt(15, 20, INK) }}>Before you delete, please note:</div>
      {WARNINGS.map((warning, i) => {
        const y = 288 + i * 58;
        return (
          <div key={warning.icon}>
            <div style={sCard(34, y, 362, 52, { r: 9, shadow: false })} />
            <Glyph src={warning.icon} x={48} y={y + 15} w={28} h={20} ink={warning.ink} />
            <div style={{ ...abs(90, y + 17, 280), ...txt(11, 20, INK) }}>{warning.text}</div>
          </div>
        );
      })}

      {/* confirm card — styled div for the DELETE field, checkbox flips visually */}
      <div style={sCard(16, 552, 398, 196)} />
      <img src="/veloria/screens/1242-135.svg" alt="" width={24} height={24} style={{ ...abs(34, 570, 24, 24), display: "block" }} />
      <div style={{ ...abs(72, 570, 280), ...txt(15, 20, INK) }}>Confirm deletion</div>
      <div style={{ ...abs(34, 610, 280), ...txt(10, 16, INK) }}>Type DELETE to confirm</div>
      <div style={sCard(34, 634, 362, 48, { r: 10, shadow: false })} />
      <div style={{ ...abs(46, 648, 330), ...txt(14, 20, INK) }}>DELETE</div>
      <button
        type="button"
        role="checkbox"
        aria-checked={acknowledged}
        aria-label="I understand the consequences"
        onClick={() => setAcknowledged((v) => !v)}
        style={{ ...sCard(34, 700, 22, 22, { r: 4, shadow: false }), border: 0, padding: 0, cursor: "pointer" }}
      >
        {acknowledged ? (
          <span style={{ position: "absolute", left: 0, right: 0, top: 1, ...txt(14, 20, INK, "center") }}>✓</span>
        ) : null}
      </button>
      <div style={{ ...abs(68, 702, 300), ...txt(11, 20, INK) }}>I understand the consequences</div>

      {/* Delete account — inert (no deletion backend; owner decision pending) */}
      <div style={sCard(16, 762, 398, 76, { bg: RED, r: 16, stroke: false })} />
      <Glyph src="1242-145" x={133} y={786} w={36} h={20} ink={[20, 19]} />
      <div style={{ ...abs(174, 787, 160), ...txt(16, 20, CREAM) }}>Delete account</div>

      <AccountNavBand />
    </ScaleFrame>
  );
}
