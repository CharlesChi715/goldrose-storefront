/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * /account/personal-info — pixel-exact implementation of
 * ACCOUNT-PERSONAL-INFO-DETAILS (1230:112, 07-28). Geometry, colors, fonts
 * and copy verbatim from the Figma REST data; icons are Figma's own SVG
 * exports. (The file also carries ACCOUNT-PERSONAL-INFO-DETAILS-ALT
 * 1232:114, a byte-identical duplicate — imported once, flagged in
 * docs/ixd/README.md.)
 *
 * Visual placeholder throughout: "Olivia Carter" and her email are the
 * mock's own values — there is no profile-update backend, so the name /
 * email / language fields are styled divs, and Edit / Save changes render
 * pixel-exact but stay inert (AUTH-SIGNUP precedent; live-looking inputs
 * that go nowhere are the flagged hazard).
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
import { abs, txt } from "@/lib/figma-layout";
import { notoSC } from "@/lib/fonts";

/** One field shell (sand inside-stroke + the batch shadow, radius 10). */
function field(x: number, y: number, w: number, h: number) {
  return sCard(x, y, w, h, { r: 10 });
}

export function PersonalInfoScreen() {
  return (
    <ScaleFrame height={932} background={CREAM} fontClass={notoSC.className} nav={false}>
      <SettingsHeader title="Personal Information" />

      {/* hero card */}
      <div style={sCard(16, 72, 398, 94)} />
      <div style={{ ...abs(36, 105, 245), ...txt(13, 20, INK) }}>Review and update your account details.</div>
      <img src="/veloria/screens/1231-116.svg" alt="" width={88} height={60} style={{ ...abs(310, 89, 88, 60), display: "block" }} />

      {/* form card — styled divs, not live inputs (no profile backend) */}
      <div style={sCard(16, 178, 398, 520)} />
      <img src="/veloria/screens/1231-122.svg" alt="" width={24} height={24} style={{ ...abs(34, 196, 24, 24), display: "block" }} />
      <div style={{ ...abs(72, 196, 260), ...txt(15, 20, INK) }}>Full name</div>
      <div style={{ ...abs(36, 234, 200), ...txt(11, 16, INK) }}>First name</div>
      <div style={field(34, 254, 362, 44)} />
      <div style={{ ...abs(46, 266, 330), ...txt(14, 20, INK) }}>Olivia</div>
      <div style={{ ...abs(36, 310, 200), ...txt(11, 16, INK) }}>Last name</div>
      <div style={field(34, 330, 362, 44)} />
      <div style={{ ...abs(46, 342, 330), ...txt(14, 20, INK) }}>Carter</div>
      <div style={{ ...abs(34, 394, 362, 1), background: SAND }} />

      <img src="/veloria/screens/1231-133.svg" alt="" width={24} height={24} style={{ ...abs(34, 410, 24, 24), display: "block" }} />
      <div style={{ ...abs(72, 410, 260), ...txt(15, 20, INK) }}>Email address</div>
      <div style={{ ...abs(36, 448, 200), ...txt(11, 16, INK) }}>Current email</div>
      <div style={field(34, 468, 362, 44)} />
      <div style={{ ...abs(46, 480, 230), ...txt(13, 20, INK) }}>olivia@email.com</div>
      <div style={{ ...abs(323, 480, 38), ...txt(12, 16, GOLD), fontWeight: 500, letterSpacing: 1.2 }}>Edit</div>
      <img src="/veloria/screens/1231-141.svg" alt="" width={20} height={20} style={{ ...abs(364, 480, 20, 20), display: "block" }} />
      <div style={sCard(34, 522, 362, 40, { bg: PINK, r: 10, stroke: false })} />
      <img src="/veloria/screens/1231-145.svg" alt="" width={24} height={24} style={{ ...abs(44, 530, 24, 24), display: "block" }} />
      <div style={{ ...abs(78, 533, 304), ...txt(10, 16, INK) }}>Changing your email may require verification.</div>
      <div style={{ ...abs(34, 580, 362, 1), background: SAND }} />

      <img src="/veloria/screens/1231-149.svg" alt="" width={24} height={24} style={{ ...abs(34, 598, 24, 24), display: "block" }} />
      <div style={{ ...abs(72, 598, 260), ...txt(15, 20, INK) }}>Preferred language</div>
      <div style={field(34, 640, 362, 44)} />
      <div style={{ ...abs(46, 652, 280), ...txt(14, 20, INK) }}>English</div>
      <img src="/veloria/screens/1231-155.svg" alt="" width={18} height={18} style={{ ...abs(360, 653, 18, 18), display: "block" }} />

      {/* security note */}
      <div style={sCard(16, 710, 398, 68, { bg: PINK })} />
      <img src="/veloria/screens/1231-158.svg" alt="" width={24} height={24} style={{ ...abs(32, 731, 24, 24), display: "block" }} />
      {/* 727 in the frame; −1 matches Figma's baseline rounding (render diff) */}
      <div style={{ ...abs(70, 726, 275), ...txt(11, 16, INK), whiteSpace: "pre-line" }}>
        {"Some profile changes may require confirmation\nto help keep your account secure."}
      </div>
      <img src="/veloria/screens/1231-162.svg" alt="" width={42} height={42} style={{ ...abs(354, 723, 42, 42), display: "block" }} />

      {/* Save changes — inert placeholder (nothing to save yet) */}
      <div style={sCard(16, 790, 398, 58, { bg: GOLD, r: 16, stroke: false })} />
      <img src="/veloria/screens/1231-165.svg" alt="" width={24} height={24} style={{ ...abs(153, 807, 24, 24), display: "block" }} />
      <div style={{ ...abs(185, 806, 150), ...txt(16, 20, CREAM) }}>Save changes</div>

      <AccountNavBand />
    </ScaleFrame>
  );
}
