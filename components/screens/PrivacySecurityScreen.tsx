"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * /account/security — pixel-exact implementation of "mepage-Account &
 * Privacy-Security", re-imported 2026-08-02 from the replacement frame
 * 1526:111 (password inputs removed at source; the old 1523:1078 design is
 * gone). Geometry, colors, fonts and copy verbatim from the Figma REST data;
 * icons are Figma's own SVG exports.
 *
 * The redesign resolves the old password-hazard note: the security card now
 * shows only a masked value (the frame's own "••••••••" glyph export) and an
 * inert "Change password" ghost button — no live password inputs anywhere.
 * The two-step toggle flips visually only and Save stays inert (no security
 * backend; live auth is the emailed link + passkeys). The login activity
 * list is the mock's own data. Cancel navigates back — the one safe control.
 *
 * Frame gotcha: the design left the toggle's raw COMPONENT_SET in the frame
 * (both variants + purple dashed border render in Figma's own image). The
 * intended UI is one toggle in the Default/off state at (334,352) — built
 * with the shared SettingsToggle.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScaleFrame } from "@/components/chrome";
import { BackButton } from "@/components/BackButton";
import {
  CREAM,
  GOLD,
  INK,
  SAND,
  sCard,
  SettingsToggle,
  BrandWordmark,
} from "@/components/screens/account-chrome";
import { Glyph } from "@/components/screens/glyphs";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";

// 1526:146…153 — the current-session label/value rows.
const SESSION_ROWS: Array<[string, string, boolean?]> = [
  ["Device", "iPhone 15 Pro"],
  ["Browser / App", "ELDREVE App"],
  ["Location", "Tokyo, JP"],
  ["Status", "Active now", true],
];

// 1526:156…161 — the recent-activity rows.
const RECENT_ROWS: Array<[string, string]> = [
  ["MacBook Pro · Chrome", "Tokyo, JP · Yesterday"],
  ["iPad Air · Safari", "Osaka, JP · 3 days ago"],
  ["Windows PC · Chrome", "New York, US · 8 days ago"],
];

export function PrivacySecurityScreen() {
  const router = useRouter();
  const [twoStep, setTwoStep] = useState(false);

  return (
    <ScaleFrame
      height={932}
      background={CREAM}
      fontClass={notoSC.className}
      nav={false}
    >
      {/* 1526:166/168 Brand Navigation — ELDREVE art at the frame's wordmark
          box (the frame's own mark, DQ-34) + the frame's pasted 返回 back art
          (same raster every me-screen uses) */}
      <BrandWordmark x={145} y={0} w={140} h={51} />
      <BackButton
        fallback="/account/privacy"
        src="/eldreve/screens/1523-1014.png"
        style={abs(14, 64, 40, 42)}
      />
      <div
        className={playfair.className}
        style={{
          ...abs(76, 66, 278),
          ...txt(25, 28, INK, "center"),
          fontWeight: 500,
        }}
      >
        {"Account & Security"}
      </div>

      {/* hero card (1526:113) */}
      <div style={sCard(16, 119, 398, 108)} />
      <div
        style={{
          ...abs(36, 144, 245),
          ...txt(12, 20, INK),
          whiteSpace: "pre-line",
        }}
      >
        {"Manage your personal details, preferences,\nand privacy controls."}
      </div>
      <img
        src="/eldreve/screens/1526-115.svg"
        alt=""
        width={76}
        height={76}
        style={{ ...abs(320, 135, 76, 76), display: "block" }}
      />

      {/* security card (1526:119) */}
      <div style={sCard(16, 239, 398, 427)} />
      <img
        src="/eldreve/screens/1526-120.svg"
        alt=""
        width={22}
        height={22}
        style={{ ...abs(34, 253, 22, 22), display: "block" }}
      />
      <div style={{ ...abs(68, 253, 200), ...txt(15, 20, INK) }}>Security</div>

      {/* password row — masked value (1526:124, the frame's own glyph
          export) + inert ghost button; no live inputs by design */}
      <div style={{ ...abs(34, 293, 120), ...txt(10, 16, INK) }}>Password</div>
      <img
        src="/eldreve/screens/1526-124.svg"
        alt="Password hidden"
        width={94}
        height={3}
        style={{ ...abs(170, 301.5, 94, 3), display: "block" }}
      />
      <div
        style={{
          ...abs(302, 283, 96, 34),
          background: CREAM,
          boxShadow: `inset 0 0 0 1px ${GOLD}`,
          borderRadius: 8,
        }}
      >
        <span
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 10,
            ...txt(9, 16, GOLD, "center"),
            fontWeight: 500,
            letterSpacing: 1.2,
          }}
        >
          Change password
        </span>
      </div>
      <div style={{ ...abs(32, 331, 364, 1), background: SAND }} />

      {/* two-step verification — flips visually only */}
      <div style={{ ...abs(32, 354, 220), ...txt(11, 20, INK) }}>
        Two-step verification
      </div>
      <div style={{ ...abs(32, 374, 250), ...txt(8, 16, INK) }}>
        Add an extra layer of security to your account.
      </div>
      <SettingsToggle
        x={334}
        y={352}
        w={42}
        on={twoStep}
        onFlip={() => setTwoStep((v) => !v)}
        label="Two-step verification"
      />
      <div style={{ ...abs(380, 356, 24), ...txt(9, 16, INK) }}>
        {twoStep ? "On" : "Off"}
      </div>

      {/* login activity — the mock's own data */}
      <div style={{ ...abs(32, 396, 200), ...txt(12, 20, INK) }}>
        Login activity
      </div>
      <div style={{ ...abs(32, 416, 250), ...txt(8, 16, INK) }}>
        Review recent devices and account access.
      </div>
      <Glyph src="1526-145" x={32} y={443} w={20} h={20} ink={[8, 10]} />
      <div style={{ ...abs(58, 444, 180), ...txt(11, 20, INK) }}>
        Current session
      </div>
      {SESSION_ROWS.map(([label, value, gold], i) => (
        <div key={label}>
          <div style={{ ...abs(58, 468 + i * 22, 110), ...txt(9, 16, INK) }}>
            {label}
          </div>
          <div
            style={{
              ...abs(249, 468 + i * 22, 145),
              ...txt(9, 16, gold ? GOLD : INK, "right"),
            }}
          >
            {value}
          </div>
        </div>
      ))}
      <Glyph src="1526-155" x={32} y={559} w={20} h={20} ink={[8, 8]} />
      <div style={{ ...abs(58, 560, 180), ...txt(11, 20, INK) }}>
        Recent activity
      </div>
      {RECENT_ROWS.map(([device, meta], i) => (
        <div key={device}>
          <div style={{ ...abs(38, 588 + i * 22, 190), ...txt(8, 16, INK) }}>
            {device}
          </div>
          <div
            style={{
              ...abs(232, 588 + i * 22, 166),
              ...txt(8, 16, INK, "right"),
            }}
          >
            {meta}
          </div>
        </div>
      ))}

      {/* Save (inert, ink primary) / Cancel (back) */}
      <div style={sCard(16, 782, 398, 54, { bg: INK, r: 14, stroke: false })} />
      <div style={{ ...abs(16, 798, 398), ...txt(15, 20, CREAM, "center") }}>
        ✓&nbsp;&nbsp;Save changes
      </div>
      <button
        type="button"
        onClick={() => router.back()}
        style={{
          ...sCard(16, 857, 398, 48, { r: 12, shadow: false }),
          border: 0,
          padding: 0,
          cursor: "pointer",
        }}
      >
        <span
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 14,
            ...txt(13, 20, INK, "center"),
          }}
        >
          Cancel
        </span>
      </button>
    </ScaleFrame>
  );
}
