"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * /account/logout — pixel-exact implementation of ACCOUNT-LOGOUT-CONFIRM
 * (1234:351, 07-28). Geometry, colors, fonts and copy verbatim from the
 * Figma REST data; icons are Figma's own SVG exports.
 *
 * This is the designed sign-out flow the dashboard was missing (its plain
 * "Sign out" text row was a dev addition, flagged 07-27 — that row now
 * lands here). Both buttons are real: Cancel goes back, "Log out" ends the
 * Supabase session and returns home. Signed out (or in local file mode)
 * the screen still renders, and "Log out" simply goes home.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ScaleFrame } from "@/components/chrome";
import {
  AccountNavBand,
  CREAM,
  GOLD,
  INK,
  sCard,
  SettingsHeader,
} from "@/components/screens/account-chrome";
import { Glyph } from "@/components/screens/glyphs";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";
import { supabaseBrowserAuthClient } from "@/lib/supabase/browser-auth";

// 1241:121…135 — the "Before you go" rows (icon, one- or two-line text).
const NOTES: Array<{ icon: string; text: string }> = [
  { icon: "1241-121", text: "Your cart and account details will remain saved" },
  { icon: "1241-126", text: "You can sign in again anytime" },
  { icon: "1241-132", text: "For shared devices, signing out helps\nprotect your privacy" },
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
    <ScaleFrame height={932} background={CREAM} fontClass={notoSC.className} nav={false}>
      <SettingsHeader title="Log Out" />

      {/* hero card */}
      <div style={sCard(16, 72, 398, 154)} />
      <div style={{ ...abs(40, 126, 235), ...txt(15, 20, INK), whiteSpace: "pre-line" }}>
        {"You’re about to sign out of\nyour account on this device."}
      </div>
      <img src="/veloria/screens/1241-113.svg" alt="" width={94} height={82} style={{ ...abs(308, 107, 94, 82), display: "block" }} />

      {/* before you go */}
      <div style={sCard(16, 238, 398, 316)} />
      <Glyph src="1240-161" x={36} y={262} w={28} h={20} ink={[19, 19]} />
      <div style={{ ...abs(78, 262, 250), ...txt(17, 20, INK) }}>Before you go</div>
      {NOTES.map((note, i) => {
        const y = [316, 392, 468][i];
        return (
          <div key={note.icon}>
            {i > 0 ? <div style={{ ...abs(40, y - 8, 350, 1), background: "#E5D9C9" }} /> : null}
            <img src={`/veloria/screens/${note.icon}.svg`} alt="" width={26} height={26} style={{ ...abs(40, y, 26, 26), display: "block" }} />
            <div style={{ ...abs(84, y + 3, 280), ...txt(12, 20, INK), whiteSpace: "pre-line" }}>{note.text}</div>
          </div>
        );
      })}

      {/* confirm card — both buttons are live */}
      <div style={sCard(16, 566, 398, 274)} />
      <div className={playfair.className} style={{ ...abs(36, 600, 358), ...txt(18, 28, INK, "center"), fontWeight: 500 }}>
        Are you sure you want to log out?
      </div>
      <button
        type="button"
        onClick={() => router.back()}
        style={{ ...abs(40, 664, 350, 58), background: CREAM, boxShadow: `inset 0 0 0 1px ${GOLD}`, borderRadius: 14, border: 0, padding: 0, cursor: "pointer" }}
      >
        <span style={{ position: "absolute", left: 0, right: 0, top: 18, ...txt(16, 20, GOLD, "center") }}>Cancel</span>
      </button>
      <button
        type="button"
        onClick={logOut}
        disabled={busy}
        style={{ ...sCard(40, 738, 350, 58, { bg: GOLD, r: 14, stroke: false }), border: 0, padding: 0, cursor: "pointer" }}
      >
        <span style={{ position: "absolute", left: 0, right: 0, top: 18, ...txt(16, 20, CREAM, "center") }}>
          {busy ? "Logging out…" : "Log out"}
        </span>
      </button>

      <AccountNavBand />
    </ScaleFrame>
  );
}
