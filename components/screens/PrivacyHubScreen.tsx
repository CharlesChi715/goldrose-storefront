/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * /account/privacy — pixel-exact implementation of the "mepage-Account &
 * Privacy" hub (1523:3878), rebuilt 2026-08-02 (frame 1523:3878 restructure:
 * security card removed, Policies & Legal card added). The settings overview
 * screen: header, hero card, Personal Information and Preferences summary
 * cards, the Session card (Log out / Delete account rows), the Policies &
 * Legal card, and the reassurance banner. Cards are translucent white
 * (72–78%) over the cream page, per the frame.
 *
 * Wiring (the frame's own prototype targets): Personal Information →
 * /account/personal-info, Preferences → /account/preferences, Session's
 * Log out row → /account/logout, Delete account row → /account/delete
 * (1523:1226, the designed confirm screen), Policies & Legal →
 * /account/policies-legal. The old hub's Security summary card is gone from
 * this frame — /account/security is now reached from elsewhere, not here.
 * All values ("Olivia Carter", "Email & SMS") are the mock's own summary
 * strings.
 */

import Link from "next/link";
import { ScaleFrame } from "@/components/chrome";
import { BackButton } from "@/components/BackButton";
import { CREAM, INK, SAND } from "@/components/screens/account-chrome";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";

const ART = "/veloria/screens/";
/** Hairline color of the hub's row dividers (stroke #DED6CC at weight 0.7). */
const HAIR = "#DED6CC";

/** Translucent white card of this frame (white at the sheet's opacity). */
function hubCard(
  x: number,
  y: number,
  w: number,
  h: number,
  alpha: number,
): React.CSSProperties {
  return {
    ...abs(x, y, w, h),
    background: `rgba(255,255,255,${alpha})`,
    boxShadow: `inset 0 0 0 1px ${SAND}`,
    borderRadius: 14,
  };
}

/** Divider hairline; pointer-transparent so card links stay clickable. */
function hairline(x: number, y: number): React.CSSProperties {
  return {
    ...abs(x, y, 370, 1),
    background: HAIR,
    opacity: 0.7,
    pointerEvents: "none",
  };
}

/** A summary row's label (left) or value (right) text, over the card link. */
function rowText(
  x: number,
  y: number,
  w: number,
  align?: "right",
): React.CSSProperties {
  return {
    ...abs(x, y, w),
    ...txt(10, 13.5, INK, align),
    pointerEvents: "none",
  };
}

export function PrivacyHubScreen() {
  return (
    <ScaleFrame
      height={932}
      background={CREAM}
      fontClass={notoSC.className}
      nav={false}
    >
      {/* 1523:3879/3881 · header — back chevron + centred Playfair title */}
      <BackButton
        fallback="/account"
        src={`${ART}1523-3879.svg`}
        style={abs(20, 22, 24, 24)}
      />
      <div
        className={playfair.className}
        style={{
          ...abs(110, 14, 210),
          ...txt(25, 36.3, INK, "center"),
          fontWeight: 500,
        }}
      >
        {"Account & Privacy"}
      </div>

      {/* 1523:3882 · hero card */}
      <div style={hubCard(16, 58, 398, 88, 0.72)} />
      <div
        style={{
          ...abs(34, 78, 242),
          ...txt(13, 18.9, INK),
          whiteSpace: "pre-line",
        }}
      >
        {"Manage your personal details,\npreferences, and privacy controls."}
      </div>
      <img
        src={`${ART}1523-3884.svg`}
        alt=""
        width={82}
        height={58}
        style={{ ...abs(314, 73, 82, 58), display: "block" }}
      />

      {/* 1523:3889 · Personal Information summary — card opens the detail page */}
      <Link
        href="/account/personal-info"
        aria-label="Personal information"
        style={{ ...hubCard(16, 159, 398, 141, 0.78), display: "block" }}
      />
      <img
        src={`${ART}1523-3890.svg`}
        alt=""
        width={32}
        height={32}
        style={{
          ...abs(30, 169, 32, 32),
          display: "block",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          ...abs(71, 173, 220),
          ...txt(12, 16.2, INK),
          fontWeight: 500,
          pointerEvents: "none",
        }}
      >
        Personal Information
      </div>
      <img
        src={`${ART}1523-3895.svg`}
        alt=""
        width={16}
        height={16}
        style={{
          ...abs(382, 176, 16, 16),
          display: "block",
          pointerEvents: "none",
        }}
      />
      <div style={hairline(30, 207.5)} />
      <div style={rowText(34, 214, 120)}>Full name</div>
      <div style={rowText(256, 214, 140, "right")}>Olivia Carter</div>
      <div style={hairline(30, 238.5)} />
      <div style={rowText(34, 245, 130)}>Email address</div>
      <div style={rowText(231, 245, 165, "right")}>olivia@email.com</div>
      <div style={hairline(30, 269.5)} />
      <div style={rowText(34, 276, 150)}>Preferred language</div>
      <div style={rowText(286, 276, 110, "right")}>English</div>
      <div style={hairline(30, 299.5)} />

      {/* 1523:3924 · Preferences summary — card opens /account/preferences */}
      <Link
        href="/account/preferences"
        aria-label="Preferences"
        style={{ ...hubCard(17, 313, 398, 95, 0.78), display: "block" }}
      />
      <img
        src={`${ART}1523-3925.svg`}
        alt=""
        width={32}
        height={32}
        style={{
          ...abs(31, 321, 32, 32),
          display: "block",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          ...abs(72, 325, 180),
          ...txt(12, 16.2, INK),
          fontWeight: 500,
          pointerEvents: "none",
        }}
      >
        Preferences
      </div>
      <img
        src={`${ART}1523-3929.svg`}
        alt=""
        width={16}
        height={16}
        style={{
          ...abs(383, 329, 16, 16),
          display: "block",
          pointerEvents: "none",
        }}
      />
      <div style={hairline(31, 358.5)} />
      <div style={rowText(35, 365, 180)}>Marketing preferences</div>
      <div style={rowText(287, 365, 110, "right")}>{"Email & SMS"}</div>
      <div style={hairline(31, 383.5)} />
      <div style={rowText(35, 390, 160)}>Cookie preferences</div>
      <div style={rowText(317, 390, 80, "right")}>Manage</div>
      {/* (the dividers vector's third line, 408.5, sits on the card edge —
          clipped in Figma, so not drawn) */}

      {/* 1523:3954 · Session card — Log out and Delete account both leave */}
      <div style={hubCard(16, 421, 398, 98, 0.78)} />
      <img
        src={`${ART}1523-3955.svg`}
        alt=""
        width={30}
        height={30}
        style={{ ...abs(30, 428, 30, 30), display: "block" }}
      />
      <div
        style={{ ...abs(70, 431, 170), ...txt(12, 15.6, INK), fontWeight: 500 }}
      >
        Session
      </div>
      <div style={hairline(30, 460.5)} />
      <Link
        href="/account/logout"
        aria-label="Log out"
        style={{ ...abs(30, 461, 370, 29), display: "block" }}
      />
      <div
        style={{
          ...abs(34, 465, 120),
          ...txt(10, 13, INK),
          pointerEvents: "none",
        }}
      >
        Log out
      </div>
      <img
        src={`${ART}1523-3959.svg`}
        alt=""
        width={16}
        height={16}
        style={{
          ...abs(382, 468, 16, 16),
          display: "block",
          pointerEvents: "none",
        }}
      />
      <div style={hairline(30, 490.5)} />
      {/* Delete account (1523:3951/3952) — wired to the designed confirm
          screen; the frame's own chevron 1803:322 targets 1523:1226. */}
      <Link
        href="/account/delete"
        aria-label="Delete account"
        style={{ ...abs(30, 491, 370, 28), display: "block" }}
      />
      <img
        src={`${ART}1523-3952.svg`}
        alt=""
        width={16}
        height={18.4}
        style={{
          ...abs(34, 495.9, 16, 18.4),
          display: "block",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          ...abs(60, 498.2, 200),
          ...txt(10, 13.5, "#E0140F"),
          pointerEvents: "none",
        }}
      >
        Delete account
      </div>
      {/* 1803:322 chevron — no export of its own in this delivery; the
          session chevron 1523-3959 is the identical 16×16 art. */}
      <img
        src={`${ART}1523-3959.svg`}
        alt=""
        width={16}
        height={16}
        style={{
          ...abs(382, 501, 16, 16),
          display: "block",
          pointerEvents: "none",
        }}
      />

      {/* 1523:3937 · Policies & Legal — card opens /account/policies-legal */}
      <Link
        href="/account/policies-legal"
        aria-label="Policies and legal"
        style={{ ...hubCard(16, 535, 398, 73, 0.78), display: "block" }}
      />
      <img
        src={`${ART}1523-3938.svg`}
        alt=""
        width={32}
        height={32}
        style={{
          ...abs(30, 543, 32, 32),
          display: "block",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          ...abs(71, 547, 180),
          ...txt(12, 16.2, INK),
          fontWeight: 500,
          pointerEvents: "none",
        }}
      >
        {"Policies & Legal"}
      </div>
      <div style={hairline(30, 580.5)} />
      <img
        src={`${ART}1523-3948.svg`}
        alt=""
        width={16}
        height={16}
        style={{
          ...abs(40, 585, 16, 16),
          display: "block",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          ...abs(66, 587, 200),
          ...txt(11, 16, INK),
          pointerEvents: "none",
        }}
      >
        View all
      </div>
      <img
        src={`${ART}1523-3943.svg`}
        alt=""
        width={16}
        height={16}
        style={{
          ...abs(382, 587, 16, 16),
          display: "block",
          pointerEvents: "none",
        }}
      />

      {/* 1523:3964 · reassurance banner */}
      <div style={hubCard(17, 620, 398, 55, 0.72)} />
      <img
        src={`${ART}1523-3965.svg`}
        alt=""
        width={62}
        height={50}
        style={{ ...abs(25, 623, 62, 50), display: "block" }}
      />
      <div
        className={playfair.className}
        style={{
          ...abs(155, 629, 235),
          ...txt(11, 14.3, INK),
          fontWeight: 600,
        }}
      >
        Your privacy matters to us.
      </div>
      <div style={{ ...abs(155, 648, 235), ...txt(8, 10.4, INK) }}>
        We protect your data and keep you in control.
      </div>
    </ScaleFrame>
  );
}
