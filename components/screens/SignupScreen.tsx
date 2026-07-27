/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * /account/signup — pixel-exact implementation of AUTH-SIGNUP-SHOPPING
 * (1097:114, 07-27). Geometry, colors, fonts and copy verbatim from the
 * Figma REST data; input icons are Figma's own SVG exports.
 *
 * The whole form is a VISUAL PLACEHOLDER, deliberately built from styled
 * divs rather than real inputs: the design asks for password fields, but
 * live customer auth is the emailed one-time code (release queue #2) — a
 * password box that goes nowhere is the same hazard as B-2's dead card
 * fields, and a real <input type=password> would also invite password
 * managers to fill it. Until the design and the auth decision are
 * reconciled (flagged in docs/ixd/README.md), only "Sign in ›" is live and
 * goes to /account, where the real code-based flow already works.
 */

import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { ScaleFrame } from "@/components/chrome";
import { Glyph } from "@/components/screens/glyphs";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";

const INK = "#3B2F2F";
const SAND = "#E5D9C9";
const GOLD = "#D4AF37";
const CREAM = "#FFF6EC";
const SHEET = "#FFFEFB";
const HINT = "#75665E";

// 1105:118…134 — the five fields: box y, icon export, ink size, hint text.
const FIELDS: Array<{ y: number; icon: string; ink: [number, number]; hint: string; sendCode?: boolean }> = [
  { y: 398, icon: "1105-119", ink: [14, 17], hint: "Full name" },
  { y: 472, icon: "1105-122", ink: [22, 22], hint: "Enter your email address" },
  { y: 546, icon: "1105-125", ink: [22, 22], hint: "Verification code", sendCode: true },
  { y: 620, icon: "1105-130", ink: [21, 21], hint: "Create password" },
  { y: 694, icon: "1105-130", ink: [21, 21], hint: "Confirm password" },
];

export function SignupScreen() {
  return (
    <ScaleFrame height={932} background={CREAM} fontClass={notoSC.className} nav={false}>
      <BackButton fallback="/account" src="/veloria/screens/1107-111.svg" style={abs(32, 50, 8, 16)} />
      <div className={playfair.className} style={{ ...abs(118, 35.7, 194, 58), ...txt(35, 46.65, GOLD, "center"), fontWeight: 500 }}>
        GoldRose
      </div>

      <div className={playfair.className} style={{ ...abs(28, 98, 195, 150), ...txt(36, 48, INK), fontWeight: 600, whiteSpace: "pre-line" }}>
        {"Create a\nshopping\naccount"}
      </div>
      <div style={{ ...abs(28, 256.2, 225, 70), ...txt(14, 16.8, INK), whiteSpace: "pre-line" }}>
        {"Save favorites, track orders,\nand enjoy effortless gifting."}
      </div>
      <img
        src="/veloria/screens/1105-115.png"
        alt="Sapphire blue gold-dipped rose"
        width={178}
        height={250}
        style={{ ...abs(236, 78, 178, 250), display: "block" }}
      />

      {/* form card — all fields are visual placeholders (see file header) */}
      <div style={{ ...abs(16, 326, 398, 576), background: SHEET, boxShadow: `inset 0 0 0 1px ${SAND}`, borderRadius: 16 }} />
      <div style={{ ...abs(34, 352, 350), ...txt(21, 25.2, INK), fontWeight: 700 }}>Create your shopping account</div>

      {FIELDS.map((field) => (
        <div key={field.hint}>
          <div style={{ ...abs(32, field.y, 366, 60), background: SHEET, boxShadow: `inset 0 0 0 1px ${SAND}`, borderRadius: 10 }} />
          <Glyph src={field.icon} x={44} y={field.y + 8} w={34} h={44} ink={field.ink} />
          <div style={{ ...abs(82, field.y + 22, 195), ...txt(14, 16.8, HINT) }}>{field.hint}</div>
          {field.sendCode ? (
            <>
              <div style={{ ...abs(300, field.y + 10, 1, 40), background: SAND }} />
              <div style={{ ...abs(306, field.y + 22, 84), ...txt(13, 15.6, INK, "center"), fontWeight: 500 }}>Send code</div>
            </>
          ) : null}
        </div>
      ))}

      <div style={{ ...abs(32, 772, 18, 18), background: SHEET, boxShadow: `inset 0 0 0 1px ${SAND}`, borderRadius: 2 }} />
      <div style={{ ...abs(58, 773.8, 315), ...txt(12, 14.4, INK) }}>I agree to the Terms &amp; Privacy Policy</div>

      {/* CREATE — inert placeholder (no password signup on the live flow) */}
      <div style={{ ...abs(32, 810, 366, 48), background: INK, borderRadius: 10 }} aria-disabled="true">
        <span style={{ position: "absolute", left: 10, right: 10, top: 16, ...txt(13, 15.6, CREAM, "center"), fontWeight: 500 }}>
          CREATE SHOPPING ACCOUNT
        </span>
      </div>

      <Link href="/account" style={{ ...abs(56, 862, 318, 28), display: "block" }}>
        <span style={{ position: "absolute", left: 0, right: 0, top: 6, ...txt(12.5, 15, INK, "center") }}>
          Already have an account?&nbsp;&nbsp;Sign in&nbsp;&nbsp;›
        </span>
      </Link>
    </ScaleFrame>
  );
}
