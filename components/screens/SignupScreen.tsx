/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * /account/signup — pixel-exact implementation of "loginpage-Create a
 * shopping account", re-imported 2026-08-02 from 1523:3315: the password +
 * confirm-password fields were removed at source, so the form now matches
 * the email-code auth decision (Full name / email / verification code).
 * Geometry, colors, fonts and copy verbatim from the Figma REST data; input
 * icons are Figma's own SVG exports (the ✉ is a crop of the frame render —
 * it SVG-exports as a .notdef box, C-2 precedent).
 *
 * ⚠️ Brand substitution: the frame's header wordmark is an image reading
 * "ELDREVE" — the placeholder brand stamped on several screens (DQ-34). The
 * live page keeps the owner's GoldRose art at the image's box.
 *
 * The form stays a VISUAL PLACEHOLDER of styled divs, inert until
 * customer-auth activation (release queue #2) — live-looking inputs that go
 * nowhere are the flagged hazard. Only "Sign in ›" is live and goes to
 * /account, where the real link-based flow already works; the login page
 * now links here in return.
 */

import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { ScaleFrame } from "@/components/chrome";
import { GoldRoseWordmark } from "@/components/screens/account-chrome";
import { Glyph } from "@/components/screens/glyphs";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";

const INK = "#3B2F2F";
const SAND = "#E5D9C9";
const CREAM = "#FFF6EC";
const SHEET = "#FFFEFB";
const HINT = "#75665E";

// 1561:115/114/111 — the three fields, frame order (08-02: the two password
// fields are gone at source; Verification code moved up to y548): box y,
// icon export (ink = SVG natural size; crop = the ✉ render-crop's measured
// box), hint text.
const FIELDS: Array<{
  y: number;
  icon: string;
  ink?: [number, number];
  crop?: [number, number, number, number];
  hint: string;
  sendCode?: boolean;
}> = [
  { y: 400, icon: "1523-3322", ink: [14, 17], hint: "Full name" },
  {
    y: 474,
    icon: "1523-3325",
    crop: [50.5, 496.5, 21.5, 14.5],
    hint: "Enter your email address",
  },
  {
    y: 548,
    icon: "1523-3328",
    ink: [22, 22],
    hint: "Verification code",
    sendCode: true,
  },
];

export function SignupScreen() {
  return (
    <ScaleFrame
      height={932}
      background={CREAM}
      fontClass={notoSC.className}
      nav={false}
    >
      {/* Brand Navigation (1523:3343) — ‹ back; the owner's GoldRose art
          substituted for the frame's "ELDREVE" wordmark image at its box
          (see the file header) */}
      <BackButton
        fallback="/account"
        src="/veloria/screens/1523-3344.png"
        style={abs(0, 18, 40, 42)}
      />
      <GoldRoseWordmark x={153} y={13.5} w={140} h={51} />

      <div
        className={playfair.className}
        style={{
          ...abs(28, 98, 195, 150),
          ...txt(36, 48, INK),
          fontWeight: 600,
          whiteSpace: "pre-line",
        }}
      >
        {"Create a\nshopping\naccount"}
      </div>
      <div
        style={{
          ...abs(28, 256.2, 225, 70),
          ...txt(14, 16.8, INK),
          whiteSpace: "pre-line",
        }}
      >
        {"Save favorites, track orders,\nand enjoy effortless gifting."}
      </div>
      <img
        src="/veloria/screens/1523-3318.png"
        alt="Sapphire blue gold-dipped rose"
        width={178}
        height={250}
        style={{ ...abs(236, 78, 178, 250), display: "block" }}
      />

      {/* form card — all fields are visual placeholders (see file header) */}
      <div
        style={{
          ...abs(16, 326, 398, 576),
          background: SHEET,
          boxShadow: `inset 0 0 0 1px ${SAND}`,
          borderRadius: 16,
        }}
      />
      <div
        style={{
          ...abs(32, 352.4, 350),
          ...txt(21, 25.2, INK),
          fontWeight: 700,
        }}
      >
        Create your shopping account
      </div>

      {FIELDS.map((field) => (
        <div key={field.hint}>
          <div
            style={{
              ...abs(32, field.y, 366, 60),
              background: SHEET,
              boxShadow: `inset 0 0 0 1px ${SAND}`,
              borderRadius: 10,
            }}
          />
          {field.crop ? (
            <img
              src={`/veloria/screens/${field.icon}.png`}
              alt=""
              style={{ ...abs(...field.crop), display: "block" }}
            />
          ) : field.ink ? (
            <Glyph
              src={field.icon}
              x={44}
              y={field.y + 8}
              w={34}
              h={44}
              ink={field.ink}
            />
          ) : null}
          <div
            style={{
              ...abs(
                field.sendCode ? 89 : 82,
                field.y + 21.6,
                field.sendCode ? 195 : 290,
              ),
              ...txt(14, 16.8, HINT),
            }}
          >
            {field.hint}
          </div>
          {field.sendCode ? (
            <>
              <div
                style={{ ...abs(295, field.y + 10, 1, 40), background: SAND }}
              />
              <div
                style={{
                  ...abs(307, field.y + 22.2, 84),
                  ...txt(13, 15.6, INK, "center"),
                  fontWeight: 500,
                }}
              >
                Send code
              </div>
            </>
          ) : null}
        </div>
      ))}

      <div
        style={{
          ...abs(32, 772, 18, 18),
          background: SHEET,
          boxShadow: `inset 0 0 0 1px ${SAND}`,
          borderRadius: 2,
        }}
      />
      <div style={{ ...abs(58, 773.8, 315), ...txt(12, 14.4, INK) }}>
        I agree to the Terms &amp; Privacy Policy
      </div>

      {/* CREATE — inert placeholder (no password signup on the live flow) */}
      <div
        style={{ ...abs(32, 810, 366, 48), background: INK, borderRadius: 10 }}
        aria-disabled="true"
      >
        <span
          style={{
            position: "absolute",
            left: 10,
            right: 10,
            top: 16.2,
            ...txt(13, 15.6, CREAM, "center"),
            fontWeight: 500,
          }}
        >
          CREATE SHOPPING ACCOUNT
        </span>
      </div>

      <Link
        href="/account"
        style={{ ...abs(56, 862, 318, 28), display: "block" }}
      >
        <span
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 6.5,
            ...txt(12.5, 15, INK, "center"),
          }}
        >
          Already have an account?&nbsp;&nbsp;Sign in&nbsp;&nbsp;›
        </span>
      </Link>
    </ScaleFrame>
  );
}
