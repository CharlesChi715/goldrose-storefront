/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * /account/privacy-policy — pixel-exact implementation of
 * ACCOUNT-PRIVACY-POLICY (1234:271, 07-28). Geometry, colors, fonts and
 * copy verbatim from the Figma REST data; icons are Figma's own SVG
 * exports.
 *
 * Visual placeholder: the five accordion rows ship only their collapsed
 * state (the design draws no expanded state, so the ⌄ chevrons stay
 * inert), and the summaries plus "Last updated: May 2026" are the mock's
 * own copy — a real, legally reviewed policy is owner content, tracked in
 * the release queue.
 */

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
} from "@/components/screens/account-chrome";
import { Glyph } from "@/components/screens/glyphs";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC } from "@/lib/fonts";

// 1240:118…159 — the five collapsed accordion rows, 101px pitch.
const ROWS: Array<{ icon: string; title: string; body: string }> = [
  {
    icon: "1240-119",
    title: "Information we collect",
    body: "We collect information you provide directly, including\nyour name, email address, and preferences.",
  },
  {
    icon: "1240-128",
    title: "How we use your data",
    body: "We use your information to provide, improve, and\npersonalize our services.",
  },
  {
    icon: "1240-137",
    title: "Sharing and storage",
    body: "We do not sell your data. Trusted providers may\nsupport our operations.",
  },
  {
    icon: "1240-145",
    title: "Your privacy rights",
    body: "Access, update, or delete your personal information\nat any time.",
  },
  {
    icon: "1240-153",
    title: "Contact us",
    body: "Have questions about your data or this policy?\nWe’re here to help.",
  },
];

export function PrivacyPolicyScreen() {
  return (
    <ScaleFrame height={932} background={CREAM} fontClass={notoSC.className} nav={false}>
      <SettingsHeader title="Privacy Policy" />

      {/* hero card */}
      <div style={sCard(16, 72, 398, 108)} />
      <div style={{ ...abs(40, 101, 235), ...txt(14, 20, INK), whiteSpace: "pre-line" }}>
        {"Learn how we collect, use, and\nprotect your information."}
      </div>
      <img src="/veloria/screens/1240-113.svg" alt="" width={78} height={78} style={{ ...abs(314, 90, 78, 78), display: "block" }} />

      {/* accordion card — collapsed states only, as designed */}
      <div style={sCard(16, 192, 398, 508)} />
      {ROWS.map((row, i) => {
        const y = 192 + i * 101;
        return (
          <div key={row.title}>
            {i > 0 ? <div style={{ ...abs(34, y, 362, 1), background: SAND }} /> : null}
            <img src={`/veloria/screens/${row.icon}.svg`} alt="" width={26} height={26} style={{ ...abs(34, y + 28, 26, 26), display: "block" }} />
            <div style={{ ...abs(78, y + 22, 255), ...txt(14, 20, INK) }}>{row.title}</div>
            <div style={{ ...abs(78, y + 49, 285), ...txt(9, 16, INK), whiteSpace: "pre-line" }}>{row.body}</div>
            <Glyph src="1240-125" x={366} y={y + 34} w={24} h={20} ink={[8, 7]} />
          </div>
        );
      })}

      {/* update note */}
      <div style={sCard(16, 712, 398, 130, { bg: PINK })} />
      <Glyph src="1240-161" x={36} y={760} w={30} h={20} ink={[19, 19]} />
      <div style={{ ...abs(82, 764, 220), ...txt(13, 20, INK) }}>Last updated: May 2026</div>
      <img src="/veloria/screens/1240-163.svg" alt="" width={56} height={56} style={{ ...abs(342, 760, 56, 56), display: "block" }} />

      <AccountNavBand />
    </ScaleFrame>
  );
}
