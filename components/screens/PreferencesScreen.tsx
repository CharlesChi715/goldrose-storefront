"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * /account/preferences — pixel-exact implementation of
 * ACCOUNT-PREFERENCES-CONTROLS (1234:111, 07-28). Geometry, colors, fonts
 * and copy verbatim from the Figma REST data; icons are Figma's own SVG
 * exports.
 *
 * The four toggles (email / SMS / push / cookies) flip visually so the
 * control states can be reviewed, but nothing persists — there is no
 * notification-preference or cookie-consent backend yet (both are tracked
 * follow-ups; the ⓘ notes are the mock's own copy).
 */

import { useState } from "react";
import { ScaleFrame } from "@/components/chrome";
import {
  AccountNavBand,
  CREAM,
  INK,
  PINK,
  sCard,
  SettingsHeader,
  SettingsToggle,
} from "@/components/screens/account-chrome";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";

// 1236:121…145 / 1236:150 — one preference row (icon, title, note, toggle).
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
      <div style={sCard(34, y, 362, 72, { r: 10, shadow: false })} />
      <img src={`/veloria/screens/${icon}.svg`} alt="" width={iw} height={ih} style={{ ...abs(ix, iy, iw, ih), display: "block" }} />
      <div style={{ ...abs(86, y + 15, 230), ...txt(13, 20, INK) }}>{title}</div>
      <div style={{ ...abs(86, y + 38, 250), ...txt(9, 16, INK) }}>{note}</div>
      <SettingsToggle x={342} y={y + 22} on={on} onFlip={onFlip} label={title} />
    </>
  );
}

export function PreferencesScreen() {
  const [email, setEmail] = useState(true);
  const [sms, setSms] = useState(true);
  const [push, setPush] = useState(true);
  const [cookies, setCookies] = useState(true);

  return (
    <ScaleFrame height={932} background={CREAM} fontClass={notoSC.className} nav={false}>
      <SettingsHeader title="Preferences" />

      {/* hero card */}
      <div style={sCard(16, 72, 398, 104)} />
      <div style={{ ...abs(36, 101, 255), ...txt(13, 20, INK), whiteSpace: "pre-line" }}>
        {"Manage how we communicate with you\nand personalize your experience."}
      </div>
      <img src="/veloria/screens/1236-113.svg" alt="" width={72} height={72} style={{ ...abs(312, 92, 72, 72), display: "block" }} />

      {/* marketing preferences */}
      <div style={sCard(16, 188, 398, 326)} />
      <div style={{ ...abs(34, 206, 300), ...txt(16, 20, INK) }}>Marketing preferences</div>
      <div style={{ ...abs(34, 234, 350), ...txt(10, 16, INK) }}>Choose how you want to receive updates and promotions.</div>
      <Row y={266} icon="1236-122" iconBox={[48, 290, 24, 24]} title="Email updates" note="Receive news, offers, and updates via email." on={email} onFlip={() => setEmail((v) => !v)} />
      <Row y={342} icon="1236-130" iconBox={[48, 366, 24, 24]} title="SMS notifications" note="Receive order updates and offers via SMS." on={sms} onFlip={() => setSms((v) => !v)} />
      <Row y={418} icon="1236-138" iconBox={[48, 442, 24, 24]} title="Push notifications" note="Get updates about orders and promotions." on={push} onFlip={() => setPush((v) => !v)} />
      {/* 498 in the frame; +1 matches Figma's baseline rounding (render diff) */}
      <div style={{ ...abs(36, 499, 330), ...txt(9, 16, INK) }}>ⓘ&nbsp;&nbsp;You can change these preferences at any time.</div>

      {/* cookie preferences */}
      <div style={sCard(16, 526, 398, 160)} />
      <div style={{ ...abs(34, 542, 300), ...txt(16, 20, INK) }}>Cookie preferences</div>
      <div style={{ ...abs(34, 569, 350), ...txt(10, 16, INK) }}>Manage how we use cookies and similar technologies.</div>
      <Row y={598} icon="1236-151" iconBox={[48, 622, 24, 24]} title="Cookie settings" note="Allow cookies to enhance your experience." on={cookies} onFlip={() => setCookies((v) => !v)} />
      <div style={{ ...abs(36, 672, 330), ...txt(9, 16, INK) }}>ⓘ&nbsp;&nbsp;Your choice will be saved on this device.</div>

      {/* privacy card */}
      <div style={sCard(16, 698, 398, 144, { bg: PINK })} />
      <img src="/veloria/screens/1236-163.svg" alt="" width={24} height={24} style={{ ...abs(34, 720, 24, 24), display: "block" }} />
      <div className={playfair.className} style={{ ...abs(72, 718, 270), ...txt(16, 28, INK), fontWeight: 500 }}>
        Your privacy matters
      </div>
      <div style={{ ...abs(72, 748, 270), ...txt(10, 16, INK), whiteSpace: "pre-line" }}>
        {"We’re committed to protecting your privacy and\ngiving you control over your data and experience."}
      </div>
      <img src="/veloria/screens/1236-168.svg" alt="" width={58} height={58} style={{ ...abs(342, 770, 58, 58), display: "block" }} />

      <AccountNavBand />
    </ScaleFrame>
  );
}
