/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * /account/personal-info — pixel-exact implementation of
 * mepage-Account & Privacy-Personal Information (1523:954, 07-29 unified
 * restyle). Geometry, colors, fonts and copy verbatim from the Figma REST
 * data; icons are Figma's own SVG exports. The 07-28 bottom nav band is gone
 * from this frame; the brand wordmark and the pasted back-arrow art now sit
 * at the top instead.
 *
 * Visual placeholder throughout: "Olivia Carter" and her email are the
 * mock's own values — there is no profile-update backend, so the name /
 * email / language fields are styled divs, and Edit / Save changes render
 * pixel-exact but stay inert (AUTH-SIGNUP precedent; live-looking inputs
 * that go nowhere are the flagged hazard).
 */

import { ScaleFrame } from "@/components/chrome";
import {
  CREAM,
  GOLD,
  INK,
  SAND,
  sCard,
  SettingsHeader,
  BrandWordmark,
} from "@/components/screens/account-chrome";
import { abs, txt } from "@/lib/figma-layout";
import { inter, notoSC } from "@/lib/fonts";

/** One field shell (cream fill, sand inside-stroke + the batch shadow, radius 10). */
function field(x: number, y: number, w: number, h: number) {
  return sCard(x, y, w, h, { bg: CREAM, r: 10 });
}

export function PersonalInfoScreen() {
  return (
    <ScaleFrame
      height={932}
      background={CREAM}
      fontClass={notoSC.className}
      nav={false}
    >
      {/* 1523:1012/1013 Brand Navigation — the wordmark at the frame's own box */}
      <BrandWordmark x={145} y={2} w={140} h={51} />

      <SettingsHeader title="Personal Information" />
      {/* 1523:1014 返回 — the frame's pasted back-arrow art (its own back-icon
          frame 1523:955 is empty); pointer-events off so the SettingsHeader
          button underneath keeps the click. */}
      <img
        src="/veloria/screens/1523-1014.png"
        alt=""
        width={40}
        height={42}
        style={{
          ...abs(26, 58, 40, 42),
          display: "block",
          pointerEvents: "none",
        }}
      />

      {/* hero card */}
      <div style={sCard(16, 114, 398, 104)} />
      <div style={{ ...abs(36, 159, 245), ...txt(13, 20, INK) }}>
        Review and update your account details.
      </div>
      <img
        src="/veloria/screens/1523-959.svg"
        alt=""
        width={88}
        height={60}
        style={{ ...abs(307, 139, 88, 60), display: "block" }}
      />

      {/* form card — styled divs, not live inputs (no profile backend) */}
      <div style={sCard(16, 230, 398, 520)} />
      <img
        src="/veloria/screens/1523-965.svg"
        alt=""
        width={24}
        height={24}
        style={{ ...abs(34, 248, 24, 24), display: "block" }}
      />
      <div style={{ ...abs(72, 248, 260), ...txt(15, 20, INK) }}>Full name</div>
      <div style={{ ...abs(36, 286, 200), ...txt(11, 16, INK) }}>
        First name
      </div>
      <div style={field(34, 306, 362, 44)} />
      <div style={{ ...abs(46, 318, 330), ...txt(14, 20, INK) }}>Olivia</div>
      <div style={{ ...abs(36, 362, 200), ...txt(11, 16, INK) }}>Last name</div>
      <div style={field(34, 382, 362, 44)} />
      <div style={{ ...abs(46, 394, 330), ...txt(14, 20, INK) }}>Carter</div>
      <div style={{ ...abs(34, 446, 362, 1), background: SAND }} />

      <img
        src="/veloria/screens/1523-976.svg"
        alt=""
        width={24}
        height={24}
        style={{ ...abs(34, 462, 24, 24), display: "block" }}
      />
      <div style={{ ...abs(72, 462, 260), ...txt(15, 20, INK) }}>
        Email address
      </div>
      <div style={{ ...abs(36, 500, 200), ...txt(11, 16, INK) }}>
        Current email
      </div>
      <div style={field(34, 520, 362, 44)} />
      <div style={{ ...abs(46, 532, 230), ...txt(13, 20, INK) }}>
        olivia@email.com
      </div>
      <div
        style={{
          ...abs(323, 532, 38),
          ...txt(12, 16, GOLD),
          fontWeight: 500,
          letterSpacing: 1.2,
        }}
      >
        Edit
      </div>
      <img
        src="/veloria/screens/1523-984.svg"
        alt=""
        width={20}
        height={20}
        style={{ ...abs(364, 532, 20, 20), display: "block" }}
      />
      {/* 1523:987 verify note — ink banner with cream text in this delivery */}
      <div style={sCard(34, 574, 362, 40, { bg: INK, r: 10, stroke: false })} />
      <img
        src="/veloria/screens/1523-988.svg"
        alt=""
        width={24}
        height={24}
        style={{ ...abs(44, 582, 24, 24), display: "block" }}
      />
      <div style={{ ...abs(78, 585, 304), ...txt(10, 16, CREAM) }}>
        Changing your email may require verification.
      </div>
      <div style={{ ...abs(34, 632, 362, 1), background: SAND }} />

      <img
        src="/veloria/screens/1523-992.svg"
        alt=""
        width={24}
        height={24}
        style={{ ...abs(34, 650, 24, 24), display: "block" }}
      />
      <div style={{ ...abs(72, 650, 260), ...txt(15, 20, INK) }}>
        Preferred language
      </div>
      <div style={field(34, 692, 362, 44)} />
      <div style={{ ...abs(46, 704, 280), ...txt(14, 20, INK) }}>English</div>
      <img
        src="/veloria/screens/1523-998.svg"
        alt=""
        width={18}
        height={18}
        style={{ ...abs(360, 705, 18, 18), display: "block" }}
      />

      {/* security note — white card now (was pink in 07-28) */}
      <div style={sCard(16, 762, 398, 68)} />
      <img
        src="/veloria/screens/1523-1001.svg"
        alt=""
        width={24}
        height={24}
        style={{ ...abs(32, 783, 24, 24), display: "block" }}
      />
      <div
        style={{
          ...abs(70, 779, 275),
          ...txt(11, 16, INK),
          whiteSpace: "pre-line",
        }}
      >
        {
          "Some profile changes may require confirmation\nto help keep your account secure."
        }
      </div>
      <img
        src="/veloria/screens/1523-1005.svg"
        alt=""
        width={42}
        height={42}
        style={{ ...abs(354, 775, 42, 42), display: "block" }}
      />

      {/* Save changes — inert placeholder (nothing to save yet); ink fill,
          Inter label (1523:1011 is the batch's one Inter text node) */}
      <div style={sCard(16, 842, 398, 58, { bg: INK, r: 16, stroke: false })} />
      <img
        src="/veloria/screens/1523-1008.svg"
        alt=""
        width={24}
        height={24}
        style={{ ...abs(153, 859, 24, 24), display: "block" }}
      />
      <div
        className={inter.className}
        style={{ ...abs(186, 861, 150), ...txt(16, 20, CREAM) }}
      >
        Save changes
      </div>
    </ScaleFrame>
  );
}
