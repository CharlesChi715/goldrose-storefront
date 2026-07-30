/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * /account/privacy — pixel-exact implementation of the "mepage-Account &
 * Privacy" hub (1523:3878, 07-29 delivery). The settings overview screen:
 * summary cards for Personal Information / Security / Preferences, the
 * Privacy Tools rows, a Session card, and the reassurance banner. Cards are
 * translucent white (72–78%) over the cream page, per the frame.
 *
 * Wiring (dev-decided, owner-delegation precedent): the summary cards open
 * their detail pages (/account/personal-info, /account/security,
 * /account/preferences); Privacy policy → /account/privacy-policy; the
 * Session card's Log out row → /account/logout. "Delete account" stays
 * INERT — account deletion is an open owner decision (07-28 flag), so the
 * red row renders verbatim but goes nowhere. All values ("Olivia Carter",
 * "Off", "Email & SMS") are the mock's own summary strings.
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

function hairline(y: number): React.CSSProperties {
  return { ...abs(30, y, 370, 1), background: HAIR, opacity: 0.7 };
}

/** Right-aligned value text of a summary row. */
function rowValue(x: number, y: number, w: number, size = 10, lh = 13.5) {
  return { ...abs(x, y, w), ...txt(size, lh, INK, "right") };
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
          whiteSpace: "normal",
        }}
      >
        Manage your personal details, preferences, and privacy controls.
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
        style={{ ...hubCard(16, 159, 398, 144, 0.78), display: "block" }}
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
      <div style={hairline(207.5)} />
      <div style={{ ...abs(34, 214, 120), ...txt(10, 13.5, INK) }}>
        Full name
      </div>
      <div style={rowValue(256, 214, 140)}>Olivia Carter</div>
      <div style={hairline(238.5)} />
      <div style={{ ...abs(34, 245, 130), ...txt(10, 13.5, INK) }}>
        Email address
      </div>
      <div style={rowValue(231, 245, 165)}>olivia@email.com</div>
      <div style={hairline(269.5)} />
      <div style={{ ...abs(34, 276, 150), ...txt(10, 13.5, INK) }}>
        Preferred language
      </div>
      <div style={rowValue(286, 276, 110)}>English</div>
      <div style={hairline(299.5)} />

      {/* 1523:3905 · Security summary — card opens /account/security */}
      <Link
        href="/account/security"
        aria-label="Security"
        style={{ ...hubCard(16, 316, 398, 217, 0.78), display: "block" }}
      />
      <img
        src={`${ART}1523-3906.svg`}
        alt=""
        width={32}
        height={32}
        style={{
          ...abs(30, 325, 32, 32),
          display: "block",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          ...abs(71, 329, 180),
          ...txt(12, 16.2, INK),
          fontWeight: 500,
          pointerEvents: "none",
        }}
      >
        Security
      </div>
      <img
        src={`${ART}1523-3910.svg`}
        alt=""
        width={16}
        height={16}
        style={{
          ...abs(382, 333, 16, 16),
          display: "block",
          pointerEvents: "none",
        }}
      />
      <div style={hairline(362.5)} />
      <div style={{ ...abs(34, 369, 100), ...txt(10, 13.5, INK) }}>
        Password
      </div>
      <div style={rowValue(266, 368, 130, 11, 14.9)}>••••••••</div>
      <div style={hairline(392.5)} />
      <div style={{ ...abs(34, 399, 180), ...txt(10, 13.5, INK) }}>
        Two-step verification
      </div>
      <div style={rowValue(316, 399, 80)}>Off</div>
      <div style={hairline(422.5)} />
      <div style={{ ...abs(34, 429, 120), ...txt(10, 13.5, INK) }}>
        Login activity
      </div>
      <div style={rowValue(286, 429, 110)}>View details</div>
      <div style={hairline(452.5)} />
      {/* 1523:3920 · identity-verification note */}
      <div
        style={{
          ...abs(30, 461, 370, 25),
          background: "#FFF7EB",
          boxShadow: `inset 0 0 0 1px ${SAND}`,
          borderRadius: 7,
        }}
      />
      <img
        src={`${ART}1523-3921.svg`}
        alt=""
        width={14}
        height={14}
        style={{ ...abs(38, 466, 14, 14), display: "block" }}
      />
      <div style={{ ...abs(59, 467, 178), ...txt(8, 12, INK) }}>
        Some changes may require identity verification.
      </div>

      {/* 1523:3924 · Preferences summary — card opens /account/preferences */}
      <Link
        href="/account/preferences"
        aria-label="Preferences"
        style={{ ...hubCard(16, 546, 398, 99, 0.78), display: "block" }}
      />
      <img
        src={`${ART}1523-3925.svg`}
        alt=""
        width={32}
        height={32}
        style={{
          ...abs(30, 554, 32, 32),
          display: "block",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          ...abs(71, 558, 180),
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
          ...abs(382, 562, 16, 16),
          display: "block",
          pointerEvents: "none",
        }}
      />
      <div style={hairline(591.5)} />
      <div style={{ ...abs(34, 598, 180), ...txt(10, 13.5, INK) }}>
        Marketing preferences
      </div>
      <div style={rowValue(286, 598, 110)}>{"Email & SMS"}</div>
      <div style={hairline(616.5)} />
      <div style={{ ...abs(34, 623, 160), ...txt(10, 13.5, INK) }}>
        Cookie preferences
      </div>
      <div style={rowValue(316, 623, 80)}>Manage</div>
      <div style={hairline(641.5)} />

      {/* 1523:3937 · Privacy Tools */}
      <div style={hubCard(16, 658, 398, 105, 0.78)} />
      <img
        src={`${ART}1523-3938.svg`}
        alt=""
        width={32}
        height={32}
        style={{ ...abs(30, 666, 32, 32), display: "block" }}
      />
      <div
        style={{ ...abs(71, 670, 180), ...txt(12, 16.2, INK), fontWeight: 500 }}
      >
        Privacy Tools
      </div>
      <img
        src={`${ART}1523-3943.svg`}
        alt=""
        width={16}
        height={16}
        style={{ ...abs(382, 674, 16, 16), display: "block" }}
      />
      <div style={hairline(703.5)} />
      <Link
        href="/account/privacy-policy"
        aria-label="Privacy policy"
        style={{ ...abs(30, 706, 370, 24), display: "block" }}
      />
      <img
        src={`${ART}1523-3948.svg`}
        alt=""
        width={16}
        height={16}
        style={{
          ...abs(34, 708, 16, 16),
          display: "block",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          ...abs(60, 710, 200),
          ...txt(10, 13.5, INK),
          pointerEvents: "none",
        }}
      >
        Privacy policy
      </div>
      <div style={hairline(731.5)} />
      {/* Delete account — deliberately inert (open owner decision, 07-28 flag) */}
      <img
        src={`${ART}1523-3952.svg`}
        alt=""
        width={16}
        height={16}
        style={{ ...abs(34, 736, 16, 16), display: "block" }}
      />
      <div style={{ ...abs(60, 738, 200), ...txt(10, 13.5, "#E0140F") }}>
        Delete account
      </div>

      {/* 1523:3954 · Session card — the Log out row really leaves */}
      <Link
        href="/account/logout"
        aria-label="Log out"
        style={{ ...hubCard(15, 776, 398, 64, 0.78), display: "block" }}
      />
      <img
        src={`${ART}1523-3955.svg`}
        alt=""
        width={30}
        height={30}
        style={{
          ...abs(29, 783, 30, 30),
          display: "block",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          ...abs(69, 786, 170),
          ...txt(12, 15.6, INK),
          fontWeight: 500,
          pointerEvents: "none",
        }}
      >
        Session
      </div>
      <img
        src={`${ART}1523-3959.svg`}
        alt=""
        width={16}
        height={16}
        style={{
          ...abs(381, 789, 16, 16),
          display: "block",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          ...abs(29, 815, 370, 1),
          background: HAIR,
          opacity: 0.7,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          ...abs(33, 820, 120),
          ...txt(10, 13, INK),
          pointerEvents: "none",
        }}
      >
        Log out
      </div>

      {/* 1523:3964 · reassurance banner */}
      <div style={hubCard(16, 853, 398, 55, 0.72)} />
      <img
        src={`${ART}1523-3965.svg`}
        alt=""
        width={62}
        height={50}
        style={{ ...abs(24, 856, 62, 50), display: "block" }}
      />
      <div
        className={playfair.className}
        style={{
          ...abs(154, 862, 235),
          ...txt(11, 14.3, INK),
          fontWeight: 600,
        }}
      >
        Your privacy matters to us.
      </div>
      <div style={{ ...abs(154, 881, 235), ...txt(8, 10.4, INK) }}>
        We protect your data and keep you in control.
      </div>
    </ScaleFrame>
  );
}
