"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * /account/preferences — pixel-exact implementation of
 * mepage-Account & Privacy-Preferences (1523:1015, 07-29 unified restyle).
 * Geometry, colors, fonts and copy verbatim from the Figma REST data; icons
 * are Figma's own SVG exports. The 07-28 bottom nav band and the two ⓘ
 * footnotes are gone from this frame; the brand wordmark and the pasted
 * back-arrow art now sit at the top instead.
 *
 * The four toggles (email / SMS / push / cookies) flip visually so the
 * control states can be reviewed, but nothing persists — there is no
 * notification-preference or cookie-consent backend yet (both are tracked
 * follow-ups).
 */

import { useState } from "react";
import { ScaleFrame } from "@/components/chrome";
import {
  CREAM,
  INK,
  PINK,
  sCard,
  SettingsHeader,
  SettingsToggle,
  BrandWordmark,
} from "@/components/screens/account-chrome";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";

// 1523:1028…1052 / 1523:1056 — one preference row (icon, title, note, toggle):
// cream shell on the white card, no shadow.
function Row({
  y,
  icon,
  iconBox,
  title,
  note,
  on,
  onFlip,
}: {
  y: number;
  icon: string;
  iconBox: [number, number, number, number];
  title: string;
  note: string;
  on: boolean;
  onFlip: () => void;
}) {
  const [ix, iy, iw, ih] = iconBox;
  return (
    <>
      <div style={sCard(34, y, 362, 72, { bg: CREAM, r: 10, shadow: false })} />
      <img
        src={`/eldreve/screens/${icon}.svg`}
        alt=""
        width={iw}
        height={ih}
        style={{ ...abs(ix, iy, iw, ih), display: "block" }}
      />
      <div style={{ ...abs(86, y + 15, 230), ...txt(13, 20, INK) }}>
        {title}
      </div>
      <div style={{ ...abs(86, y + 38, 250), ...txt(9, 16, INK) }}>{note}</div>
      <SettingsToggle
        x={342}
        y={y + 22}
        on={on}
        onFlip={onFlip}
        label={title}
      />
    </>
  );
}

export function PreferencesScreen() {
  const [email, setEmail] = useState(true);
  const [sms, setSms] = useState(true);
  const [push, setPush] = useState(true);
  const [cookies, setCookies] = useState(true);

  return (
    <ScaleFrame
      height={932}
      background={CREAM}
      fontClass={notoSC.className}
      nav={false}
    >
      {/* 1523:1075/1076 Brand Navigation — the wordmark at the frame's own box */}
      <BrandWordmark x={141} y={0} w={140} h={51} />

      <SettingsHeader title="Preferences" />
      {/* 1523:1077 返回 — the frame's pasted back-arrow art (its own back-icon
          frame 1523:1016 is empty); pointer-events off so the SettingsHeader
          button underneath keeps the click. */}
      <img
        src="/eldreve/screens/1523-1077.png"
        alt=""
        width={40}
        height={42}
        style={{
          ...abs(22, 64, 40, 42),
          display: "block",
          pointerEvents: "none",
        }}
      />

      {/* hero card */}
      <div style={sCard(16, 118, 398, 120)} />
      <div
        style={{
          ...abs(36, 152, 255),
          ...txt(13, 20, INK),
          whiteSpace: "pre-line",
        }}
      >
        {"Manage how we communicate with you\nand personalize your experience."}
      </div>
      <img
        src="/eldreve/screens/1523-1020.svg"
        alt=""
        width={72}
        height={72}
        style={{ ...abs(314, 142, 72, 72), display: "block" }}
      />

      {/* marketing preferences */}
      <div style={sCard(16, 250, 398, 326)} />
      <div style={{ ...abs(34, 268, 300), ...txt(16, 20, INK) }}>
        Marketing preferences
      </div>
      <div style={{ ...abs(34, 296, 350), ...txt(10, 16, INK) }}>
        Choose how you want to receive updates and promotions.
      </div>
      <Row
        y={328}
        icon="1523-1029"
        iconBox={[48, 352, 24, 24]}
        title="Email updates"
        note="Receive news, offers, and updates via email."
        on={email}
        onFlip={() => setEmail((v) => !v)}
      />
      <Row
        y={404}
        icon="1523-1037"
        iconBox={[48, 428, 24, 24]}
        title="SMS notifications"
        note="Receive order updates and offers via SMS."
        on={sms}
        onFlip={() => setSms((v) => !v)}
      />
      <Row
        y={480}
        icon="1523-1045"
        iconBox={[48, 504, 24, 24]}
        title="Push notifications"
        note="Get updates about orders and promotions."
        on={push}
        onFlip={() => setPush((v) => !v)}
      />

      {/* cookie preferences */}
      <div style={sCard(16, 588, 398, 160)} />
      <div style={{ ...abs(34, 604, 300), ...txt(16, 20, INK) }}>
        Cookie preferences
      </div>
      <div style={{ ...abs(34, 631, 350), ...txt(10, 16, INK) }}>
        Manage how we use cookies and similar technologies.
      </div>
      <Row
        y={660}
        icon="1523-1057"
        iconBox={[48, 684, 24, 24]}
        title="Cookie settings"
        note="Allow cookies to enhance your experience."
        on={cookies}
        onFlip={() => setCookies((v) => !v)}
      />

      {/* privacy card */}
      <div style={sCard(16, 760, 398, 144, { bg: PINK })} />
      <img
        src="/eldreve/screens/1523-1068.svg"
        alt=""
        width={24}
        height={24}
        style={{ ...abs(34, 782, 24, 24), display: "block" }}
      />
      <div
        className={playfair.className}
        style={{ ...abs(72, 780, 270), ...txt(16, 28, INK), fontWeight: 500 }}
      >
        Your privacy matters
      </div>
      <div
        style={{
          ...abs(72, 810, 270),
          ...txt(10, 16, INK),
          whiteSpace: "pre-line",
        }}
      >
        {
          "We’re committed to protecting your privacy and\ngiving you control over your data and experience."
        }
      </div>
      <img
        src="/eldreve/screens/1523-1073.svg"
        alt=""
        width={58}
        height={58}
        style={{ ...abs(342, 832, 58, 58), display: "block" }}
      />
    </ScaleFrame>
  );
}
