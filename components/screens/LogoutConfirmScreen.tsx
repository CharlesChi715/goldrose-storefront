"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * /account/logout — pixel-exact implementation of the 07-29 frame
 * "mepage-Account & Privacy-Log Out" (1523:1190). Geometry, colors, fonts
 * and copy verbatim from the Figma REST data; icons are Figma's own SVG
 * exports.
 *
 * This is the designed sign-out flow the dashboard was missing (its plain
 * "Sign out" text row was a dev addition, flagged 07-27 — that row now
 * lands here). Both buttons are real: Cancel goes back, "Log out" ends the
 * Supabase session and returns home. Signed out (or in local file mode)
 * the screen still renders, and "Log out" simply goes home.
 *
 * Unlike the settings frames' shared back/title pair (SettingsHeader), the
 * 07-29 confirm frames carry their own header: a brand band (1523:1223) and
 * an image back arrow (1523:1225, 返回 2) at y70 — so the header is drawn
 * here from the sheet.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { ScaleFrame } from "@/components/chrome";
import {
  CREAM,
  GOLD,
  INK,
  SAND,
  sCard,
  BrandWordmark,
} from "@/components/screens/account-chrome";
import { Glyph } from "@/components/screens/glyphs";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";
import { supabaseBrowserAuthClient } from "@/lib/supabase/browser-auth";

// 1523:1202…1216 — the "Before you go" rows (divider, icon, one- or
// two-line text). Row geometry is irregular in this frame, so each row
// carries its own coordinates. The privacy shield (1523:1214) is a group
// export centred on its vector box — its 26×26 icon frame (1523:1213) is
// empty — hence the ink pair.
const NOTES: Array<{
  divider?: number;
  icon: string;
  box: [number, number, number, number];
  ink?: [number, number];
  textY: number;
  text: string;
}> = [
  {
    icon: "1523-1202",
    box: [38, 391, 26, 26],
    textY: 397,
    text: "Your cart and account details will remain saved",
  },
  {
    divider: 443,
    icon: "1523-1207",
    box: [39, 464, 26, 26],
    textY: 470,
    text: "You can sign in again anytime",
  },
  {
    divider: 519,
    icon: "1523-1214",
    box: [44, 559, 17.3, 19.5],
    ink: [20, 22],
    textY: 545,
    text: "For shared devices, signing out helps\nprotect your privacy",
  },
];

export function LogoutConfirmScreen() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowserAuthClient(), []);
  const [busy, setBusy] = useState(false);

  async function logOut() {
    if (busy) return;
    setBusy(true);
    try {
      await supabase?.auth.signOut();
    } finally {
      router.push("/");
    }
  }

  return (
    <ScaleFrame
      height={932}
      background={CREAM}
      fontClass={notoSC.className}
      nav={false}
    >
      {/* 1523:1223/1225/1191 — brand band, image back arrow, title */}
      <BrandWordmark x={145} y={0} w={140} h={51} />
      <BackButton
        fallback="/account"
        src="/veloria/screens/1523-1225.png"
        style={abs(12, 70, 40, 42)}
      />
      <div
        className={playfair.className}
        style={{
          ...abs(76, 70, 278),
          ...txt(25, 28, INK, "center"),
          fontWeight: 500,
        }}
      >
        Log Out
      </div>

      {/* hero card */}
      <div style={sCard(16, 131, 398, 154)} />
      <div
        style={{
          ...abs(40, 185, 235),
          ...txt(15, 20, INK),
          whiteSpace: "pre-line",
        }}
      >
        {"You’re about to sign out of\nyour account on this device."}
      </div>
      <img
        src="/veloria/screens/1523-1194.svg"
        alt=""
        width={94}
        height={82}
        style={{ ...abs(308, 166, 94, 82), display: "block" }}
      />

      {/* before you go */}
      <div style={sCard(16, 297, 398, 316)} />
      <Glyph src="1523-1200" x={36} y={321} w={28} h={20} ink={[19, 19]} />
      <div style={{ ...abs(78, 321, 250), ...txt(17, 20, INK) }}>
        Before you go
      </div>
      {NOTES.map((note) => (
        <div key={note.icon}>
          {note.divider !== undefined ? (
            <div
              style={{ ...abs(40, note.divider, 350, 1), background: SAND }}
            />
          ) : null}
          {note.ink ? (
            <Glyph
              src={note.icon}
              x={note.box[0]}
              y={note.box[1]}
              w={note.box[2]}
              h={note.box[3]}
              ink={note.ink}
            />
          ) : (
            <img
              src={`/veloria/screens/${note.icon}.svg`}
              alt=""
              width={note.box[2]}
              height={note.box[3]}
              style={{ ...abs(...note.box), display: "block" }}
            />
          )}
          <div
            style={{
              ...abs(84, note.textY, 280),
              ...txt(12, 20, INK),
              whiteSpace: "pre-line",
            }}
          >
            {note.text}
          </div>
        </div>
      ))}

      {/* confirm card — both buttons are live */}
      <div style={sCard(16, 625, 398, 274)} />
      <div
        className={playfair.className}
        style={{
          ...abs(36, 659, 358),
          ...txt(18, 28, INK, "center"),
          fontWeight: 500,
        }}
      >
        Are you sure you want to log out?
      </div>
      <button
        type="button"
        onClick={() => router.back()}
        style={{
          ...abs(40, 723, 350, 58),
          background: CREAM,
          boxShadow: `inset 0 0 0 1px ${GOLD}`,
          borderRadius: 14,
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
            top: 18,
            ...txt(16, 20, GOLD, "center"),
          }}
        >
          Cancel
        </span>
      </button>
      <button
        type="button"
        onClick={logOut}
        disabled={busy}
        style={{
          ...sCard(40, 797, 350, 58, { bg: INK, r: 14, stroke: false }),
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
            top: 18,
            ...txt(16, 20, CREAM, "center"),
          }}
        >
          {busy ? "Logging out…" : "Log out"}
        </span>
      </button>
    </ScaleFrame>
  );
}
