/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * /account/privacy-policy — pixel-exact implementation of the 07-29 frame
 * "mepage-Account & Privacy-Privacy Policy" (1523:1136, the file-wide
 * visual unification). Geometry, colors, fonts and copy verbatim from the
 * Figma REST data; icons are Figma's own SVG exports.
 *
 * Visual placeholder: the five accordion rows ship only their collapsed
 * state (the design draws no expanded state, so the ⌄ chevrons stay
 * inert), and the summaries are the mock's own copy — a real, legally
 * reviewed policy is owner content, tracked in the release queue. The
 * 07-28 "Last updated: May 2026" card is gone from this frame.
 */

import { ScaleFrame } from "@/components/chrome";
import {
  CREAM,
  INK,
  SAND,
  sCard,
  SettingsHeader,
  BrandWordmark,
} from "@/components/screens/account-chrome";
import { Glyph } from "@/components/screens/glyphs";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC } from "@/lib/fonts";

// 1523:1145…1186 — the five collapsed accordion rows. The 07-29 frame lays
// them out with per-row jitter (no uniform pitch), so each row carries its
// own sheet coordinates: divider y, icon box, title y, description y,
// chevron box origin.
const ROWS: Array<{
  divider?: number;
  icon: { src: string; x: number; y: number; w: number; h: number };
  titleY: number;
  title: string;
  descY: number;
  body: string;
  chev: { src: string; x: number; y: number };
}> = [
  {
    icon: { src: "1523-1146", x: 38, y: 355, w: 26, h: 26 },
    titleY: 338,
    title: "Information we collect",
    descY: 365,
    // The build sheet truncates this node's CHARS at ~80 chars; the render
    // shows the full 07-28 copy, kept verbatim.
    body: "We collect information you provide directly, including\nyour name, email address, and preferences.",
    chev: { src: "1523-1152", x: 367, y: 355 },
  },
  {
    divider: 424,
    icon: { src: "1523-1155", x: 38, y: 473, w: 26, h: 26 },
    titleY: 459,
    title: "How we use your data",
    descY: 486,
    body: "We use your information to provide, improve, and\npersonalize our services.",
    chev: { src: "1523-1161", x: 370, y: 475 },
  },
  {
    divider: 547,
    // 1523:1165 — the cloud group sits OUTSIDE its empty 26×26 icon frame
    // (frame at 38,575; group at 41,601 20.1×17.5, beside the description).
    // The render confirms the escaped position is what's drawn. The export
    // canvas is 22×20 (centred-stroke bleed), centred on the group box.
    icon: { src: "1523-1165", x: 40.05, y: 599.75, w: 22, h: 20 },
    titleY: 581,
    title: "Sharing and storage",
    descY: 608,
    body: "We do not sell your data. Trusted providers may\nsupport our operations.",
    chev: { src: "1523-1169", x: 370, y: 581 },
  },
  {
    divider: 670,
    icon: { src: "1523-1172", x: 38, y: 716, w: 26, h: 26 },
    titleY: 704,
    title: "Your privacy rights",
    descY: 731,
    body: "Access, update, or delete your personal information\nat any time.",
    chev: { src: "1523-1177", x: 367, y: 716 },
  },
  {
    divider: 793,
    icon: { src: "1523-1180", x: 38, y: 821, w: 26, h: 26 },
    titleY: 815,
    title: "Contact us",
    descY: 842,
    body: "Have questions about your data or this policy?\nWe’re here to help.",
    chev: { src: "1523-1186", x: 367, y: 832 },
  },
];

export function PrivacyPolicyScreen() {
  return (
    <ScaleFrame
      height={932}
      background={CREAM}
      fontClass={notoSC.className}
      nav={false}
    >
      {/* 1523:1187 Brand Navigation — the frame's own wordmark art */}
      <BrandWordmark x={145} y={0} w={140} h={51} />
      <SettingsHeader title="Privacy Policy" />

      {/* hero card (1523:1138) */}
      <div style={sCard(20, 129, 398, 151)} />
      <div
        style={{
          ...abs(44, 181, 235),
          ...txt(14, 20, INK),
          whiteSpace: "pre-line",
        }}
      >
        {"Learn how we collect, use, and\nprotect your information."}
      </div>
      <img
        src="/eldreve/screens/1523-1140.svg"
        alt=""
        width={78}
        height={78}
        style={{ ...abs(319, 166, 78, 78), display: "block" }}
      />

      {/* accordion card (1523:1144) — collapsed states only, as designed */}
      <div style={sCard(20, 301, 398, 600)} />
      {ROWS.map((row) => (
        <div key={row.title}>
          {row.divider !== undefined ? (
            <div
              style={{ ...abs(38, row.divider, 362, 1), background: SAND }}
            />
          ) : null}
          <img
            src={`/eldreve/screens/${row.icon.src}.svg`}
            alt=""
            width={Math.round(row.icon.w)}
            height={Math.round(row.icon.h)}
            style={{
              ...abs(row.icon.x, row.icon.y, row.icon.w, row.icon.h),
              display: "block",
            }}
          />
          <div style={{ ...abs(82, row.titleY, 255), ...txt(14, 20, INK) }}>
            {row.title}
          </div>
          <div
            style={{
              ...abs(82, row.descY, 285),
              ...txt(9, 16, INK),
              whiteSpace: "pre-line",
            }}
          >
            {row.body}
          </div>
          <Glyph
            src={row.chev.src}
            x={row.chev.x}
            y={row.chev.y}
            w={24}
            h={20}
            ink={[8, 7]}
          />
        </div>
      ))}
    </ScaleFrame>
  );
}
