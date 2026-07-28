"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * /account/security — pixel-exact implementation of ACCOUNT-PRIVACY-SECURITY
 * (1234:191, 07-28). Geometry, colors, fonts and copy verbatim from the
 * Figma REST data; icons are Figma's own SVG exports.
 *
 * Visual placeholder with a decision conflict flagged in docs/ixd/README.md:
 * the frame designs password change + two-step verification, but customer
 * auth is decided as the emailed sign-in link (code fallback) with passkeys —
 * there is no password to change. So the password fields are styled divs
 * (the AUTH-SIGNUP hazard rule: a live password box that goes nowhere), the
 * two-step toggle flips visually only, and Save stays inert. The login
 * activity list is the mock's own data (no session-history backend). Cancel
 * navigates back — the one safe control.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScaleFrame } from "@/components/chrome";
import {
  AccountNavBand,
  CREAM,
  GOLD,
  INK,
  PINK,
  SAND,
  sCard,
  SettingsHeader,
  SettingsToggle,
} from "@/components/screens/account-chrome";
import { Glyph } from "@/components/screens/glyphs";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC } from "@/lib/fonts";

// 1237:144…151 — the current-session label/value rows.
const SESSION_ROWS: Array<[string, string, boolean?]> = [
  ["Device", "iPhone 15 Pro"],
  ["Browser / App", "GoldRose App"],
  ["Location", "Tokyo, JP"],
  ["Status", "Active now", true],
];

// 1237:154…159 — the recent-activity rows.
const RECENT_ROWS: Array<[string, string]> = [
  ["MacBook Pro · Chrome", "Tokyo, JP · Yesterday"],
  ["iPad Air · Safari", "Osaka, JP · 3 days ago"],
  ["Windows PC · Chrome", "New York, US · 8 days ago"],
];

export function PrivacySecurityScreen() {
  const router = useRouter();
  const [twoStep, setTwoStep] = useState(false);

  return (
    <ScaleFrame height={932} background={CREAM} fontClass={notoSC.className} nav={false}>
      <SettingsHeader title="Account & Privacy" />

      {/* hero card */}
      <div style={sCard(16, 72, 398, 94)} />
      <div style={{ ...abs(36, 97, 245), ...txt(12, 20, INK), whiteSpace: "pre-line" }}>
        {"Manage your personal details, preferences,\nand privacy controls."}
      </div>
      <img src="/veloria/screens/1237-113.svg" alt="" width={76} height={76} style={{ ...abs(320, 88, 76, 76), display: "block" }} />

      {/* security card */}
      <div style={sCard(16, 178, 398, 520)} />
      <img src="/veloria/screens/1237-118.svg" alt="" width={22} height={22} style={{ ...abs(34, 192, 22, 22), display: "block" }} />
      <div style={{ ...abs(68, 192, 200), ...txt(15, 20, INK) }}>Security</div>

      {/* password block — styled divs, deliberately not live inputs */}
      <div style={{ ...abs(34, 232, 120), ...txt(10, 16, INK) }}>Password</div>
      <div style={{ ...abs(170, 232, 120), ...txt(13, 20, INK) }}>••••••••</div>
      <div style={{ ...abs(302, 222, 96, 34), boxShadow: `inset 0 0 0 1px ${GOLD}`, borderRadius: 8 }}>
        <span style={{ position: "absolute", left: 0, right: 0, top: 10, ...txt(9, 16, GOLD, "center"), fontWeight: 500, letterSpacing: 1.2 }}>
          Change password
        </span>
      </div>
      <div style={{ ...abs(34, 270, 112), ...txt(10, 16, INK) }}>New password</div>
      <div style={sCard(164, 262, 234, 38, { r: 8, shadow: false })} />
      <div style={{ ...abs(176, 273, 180), ...txt(10, 16, INK) }}>Enter new password</div>
      <Glyph src="1237-128" x={369} y={272} w={20} h={20} ink={[9, 9]} />
      <div style={{ ...abs(34, 316, 120), ...txt(10, 16, INK) }}>Confirm password</div>
      <div style={sCard(164, 308, 234, 38, { r: 8, shadow: false })} />
      <div style={{ ...abs(176, 319, 180), ...txt(10, 16, INK) }}>Confirm new password</div>
      <Glyph src="1237-128" x={369} y={318} w={20} h={20} ink={[9, 9]} />
      <div style={{ ...abs(164, 348, 234), ...txt(8, 16, INK) }}>Use 8+ characters with letters, numbers, and symbols.</div>
      <div style={{ ...abs(34, 372, 364, 1), background: SAND }} />

      {/* two-step verification — flips visually only */}
      <div style={{ ...abs(34, 390, 220), ...txt(11, 20, INK) }}>Two-step verification</div>
      <div style={{ ...abs(34, 410, 250), ...txt(8, 16, INK) }}>Add an extra layer of security to your account.</div>
      <SettingsToggle x={336} y={388} w={42} on={twoStep} onFlip={() => setTwoStep((v) => !v)} label="Two-step verification" />
      <div style={{ ...abs(382, 392, 24), ...txt(9, 16, INK) }}>{twoStep ? "On" : "Off"}</div>

      {/* login activity — the mock's own data */}
      <div style={{ ...abs(34, 442, 200), ...txt(12, 20, INK) }}>Login activity</div>
      <div style={{ ...abs(34, 462, 250), ...txt(8, 16, INK) }}>Review recent devices and account access.</div>
      <Glyph src="1245-128" x={34} y={489} w={20} h={20} ink={[8, 10]} />
      <div style={{ ...abs(60, 490, 180), ...txt(11, 20, INK) }}>Current session</div>
      {SESSION_ROWS.map(([label, value, gold], i) => (
        <div key={label}>
          <div style={{ ...abs(60, 514 + i * 22, 110), ...txt(9, 16, INK) }}>{label}</div>
          <div style={{ ...abs(251, 514 + i * 22, 145), ...txt(9, 16, gold ? GOLD : INK, "right") }}>{value}</div>
        </div>
      ))}
      <Glyph src="1237-153" x={34} y={605} w={20} h={20} ink={[8, 8]} />
      <div style={{ ...abs(60, 606, 180), ...txt(11, 20, INK) }}>Recent activity</div>
      {RECENT_ROWS.map(([device, meta], i) => (
        <div key={device}>
          <div style={{ ...abs(36, 630 + i * 22, 190), ...txt(8, 16, INK) }}>{device}</div>
          <div style={{ ...abs(230, 630 + i * 22, 166), ...txt(8, 16, INK, "right") }}>{meta}</div>
        </div>
      ))}

      {/* Save (inert) / Cancel (back) / note */}
      <div style={sCard(16, 710, 398, 54, { bg: GOLD, r: 14, stroke: false })} />
      <div style={{ ...abs(16, 726, 398), ...txt(15, 20, CREAM, "center") }}>✓&nbsp;&nbsp;Save changes</div>
      <button
        type="button"
        onClick={() => router.back()}
        style={{ ...sCard(16, 776, 398, 48, { r: 12, shadow: false }), border: 0, padding: 0, cursor: "pointer" }}
      >
        <span style={{ position: "absolute", left: 0, right: 0, top: 14, ...txt(13, 20, INK, "center") }}>Cancel</span>
      </button>
      <div style={sCard(16, 832, 398, 24, { bg: PINK, r: 8, stroke: false, shadow: false })} />
      <div style={{ ...abs(26, 839, 378), ...txt(8, 16, INK, "center") }}>Security changes may require identity verification.</div>

      <AccountNavBand />
    </ScaleFrame>
  );
}
