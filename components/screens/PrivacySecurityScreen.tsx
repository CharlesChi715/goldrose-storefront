"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * /account/security — pixel-exact implementation of the 07-29 frame
 * "mepage-Account & Privacy-Security" (1523:1078, the file-wide visual
 * unification). Geometry, colors, fonts and copy verbatim from the Figma
 * REST data; icons are Figma's own SVG exports.
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
  CREAM,
  GOLD,
  INK,
  SAND,
  sCard,
  SettingsHeader,
  SettingsToggle,
  GoldRoseWordmark,
} from "@/components/screens/account-chrome";
import { Glyph } from "@/components/screens/glyphs";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC } from "@/lib/fonts";

// 1523:1113…1120 — the current-session label/value rows.
const SESSION_ROWS: Array<[string, string, boolean?]> = [
  ["Device", "iPhone 15 Pro"],
  ["Browser / App", "GoldRose App"],
  ["Location", "Tokyo, JP"],
  ["Status", "Active now", true],
];

// 1523:1123…1128 — the recent-activity rows.
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
      {/* 1523:1133 Brand Navigation — the frame's own wordmark art */}
      <GoldRoseWordmark x={145} y={0} w={140} h={51} />
      <SettingsHeader title="Account & Security" />

      {/* hero card (1523:1080) */}
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
        src="/veloria/screens/1523-1082.svg"
        alt=""
        width={76}
        height={76}
        style={{ ...abs(320, 135, 76, 76), display: "block" }}
      />

      {/* security card (1523:1086) */}
      <div style={sCard(16, 239, 398, 520)} />
      <img
        src="/veloria/screens/1523-1087.svg"
        alt=""
        width={22}
        height={22}
        style={{ ...abs(34, 253, 22, 22), display: "block" }}
      />
      <div style={{ ...abs(68, 253, 200), ...txt(15, 20, INK) }}>Security</div>

      {/* password block — styled divs, deliberately not live inputs */}
      <div style={{ ...abs(34, 293, 120), ...txt(10, 16, INK) }}>Password</div>
      <div style={{ ...abs(170, 293, 120), ...txt(13, 20, INK) }}>••••••••</div>
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
      <div style={{ ...abs(34, 331, 112), ...txt(10, 16, INK) }}>
        New password
      </div>
      <div
        style={sCard(164, 323, 234, 38, { bg: CREAM, r: 8, shadow: false })}
      />
      <div style={{ ...abs(176, 334, 180), ...txt(10, 16, INK) }}>
        Enter new password
      </div>
      <Glyph src="1523-1097" x={369} y={333} w={20} h={20} ink={[9, 9]} />
      <div style={{ ...abs(34, 377, 120), ...txt(10, 16, INK) }}>
        Confirm password
      </div>
      <div
        style={sCard(164, 369, 234, 38, { bg: CREAM, r: 8, shadow: false })}
      />
      <div style={{ ...abs(176, 380, 180), ...txt(10, 16, INK) }}>
        Confirm new password
      </div>
      <Glyph src="1523-1101" x={369} y={379} w={20} h={20} ink={[9, 9]} />
      <div style={{ ...abs(164, 409, 234), ...txt(8, 16, INK) }}>
        Use 8+ characters with letters, numbers, and symbols.
      </div>
      <div style={{ ...abs(34, 433, 364, 1), background: SAND }} />

      {/* two-step verification — flips visually only */}
      <div style={{ ...abs(34, 451, 220), ...txt(11, 20, INK) }}>
        Two-step verification
      </div>
      <div style={{ ...abs(34, 471, 250), ...txt(8, 16, INK) }}>
        Add an extra layer of security to your account.
      </div>
      <SettingsToggle
        x={336}
        y={449}
        w={42}
        on={twoStep}
        onFlip={() => setTwoStep((v) => !v)}
        label="Two-step verification"
      />
      <div style={{ ...abs(382, 453, 24), ...txt(9, 16, INK) }}>
        {twoStep ? "On" : "Off"}
      </div>

      {/* login activity — the mock's own data */}
      <div style={{ ...abs(34, 503, 200), ...txt(12, 20, INK) }}>
        Login activity
      </div>
      <div style={{ ...abs(34, 523, 250), ...txt(8, 16, INK) }}>
        Review recent devices and account access.
      </div>
      <Glyph src="1523-1112" x={34} y={550} w={20} h={20} ink={[8, 10]} />
      <div style={{ ...abs(60, 551, 180), ...txt(11, 20, INK) }}>
        Current session
      </div>
      {SESSION_ROWS.map(([label, value, gold], i) => (
        <div key={label}>
          <div style={{ ...abs(60, 575 + i * 22, 110), ...txt(9, 16, INK) }}>
            {label}
          </div>
          <div
            style={{
              ...abs(251, 575 + i * 22, 145),
              ...txt(9, 16, gold ? GOLD : INK, "right"),
            }}
          >
            {value}
          </div>
        </div>
      ))}
      <Glyph src="1523-1122" x={34} y={666} w={20} h={20} ink={[8, 8]} />
      <div style={{ ...abs(60, 667, 180), ...txt(11, 20, INK) }}>
        Recent activity
      </div>
      {RECENT_ROWS.map(([device, meta], i) => (
        <div key={device}>
          <div style={{ ...abs(36, 691 + i * 22, 190), ...txt(8, 16, INK) }}>
            {device}
          </div>
          <div
            style={{
              ...abs(230, 691 + i * 22, 166),
              ...txt(8, 16, INK, "right"),
            }}
          >
            {meta}
          </div>
        </div>
      ))}

      {/* Save (inert, 07-29 ink primary) / Cancel (back) */}
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
