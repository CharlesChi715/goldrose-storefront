/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * Module A-8 "Personalized Gold Rose Gifts" of the VELORIA homepage frame
 * (Figma node 138:64, y 5336-6141 of the 430-wide canvas): ornamented title,
 * intro copy, mascot, cropped gift-box photo, four personalization step rows
 * and two CTA buttons. Steps and CTAs are non-clickable placeholders --
 * personalization ships in a future iteration. Values verbatim from Figma.
 */

import { abs } from "@/lib/figma-layout";
import { playfair, notoSC, goudy } from "@/lib/fonts";

// 465:149/162/175/186 -- the four step rows share one 382x46 geometry.
type Step = {
  n: string;
  icon: string;
  title: string;
  titleW: number;
  sub: string;
  subW: number;
};

const STEPS: Step[] = [
  {
    n: "1",
    icon: "/veloria/home/465-157.svg",
    title: "Write a Personal Message",
    titleW: 173,
    sub: "Add a heartfelt note they'll treasure forever.",
    subW: 202,
  },
  {
    n: "2",
    icon: "/veloria/home/465-170.svg",
    title: "Add a Name or Date",
    titleW: 135,
    sub: "Personalize the engraved plaque.",
    subW: 155,
  },
  {
    n: "3",
    icon: "/veloria/home/465-183.svg",
    title: "Choose Your Rose",
    titleW: 122,
    sub: "Select your perfect gold rose style.",
    subW: 160,
  },
  {
    n: "4",
    icon: "/veloria/home/465-194.svg",
    title: "Choose the Gift Packaging",
    titleW: 178,
    sub: "Pick your box, ribbon and finishing touches.",
    subW: 204,
  },
];

export function A8() {
  return (
    // 138:64 -- module root; children below are frame-absolute minus (0, 5336).
    // Eyebrow 165:99, tag 165:104 and steps-title 165:106 are HIDDEN in Figma.
    // id="personalize" — scroll target for the A-4 "PERSONALIZE YOUR ROSE" card (H-16).
    <div id="personalize" style={{ ...abs(0, 5336, 430, 805), background: "#FBF4EE", overflow: "hidden" }}>
      {/* 165:101 · A8 Intro */}
      <div
        className={goudy.className}
        style={{
          ...abs(41, 122, 242),
          fontSize: 10,
          lineHeight: "15px",
          color: "#3B2F2F",
          textAlign: "center",
          whiteSpace: "pre-line",
        }}
      >
        {
          "Create a one-of-a-kind gold rose gift with a name,\ndate, engraved plaque, message card, and\nbeautiful packaging—made to be cherished forever."
        }
      </div>

      {/* 165:102 · Image · Personalized GoldRose -- 382x264 window over a
          433x757 source; the negative offsets are the design's own crop. */}
      <div style={{ ...abs(23, 172, 382, 264), borderRadius: 10, overflow: "hidden" }}>
        <img
          src="/veloria/home/165-103.png"
          alt="Gold-dipped rose in a pink gift box with engraved plaque and message card, with Your Message, Name, Rose and Packaging callouts"
          width={433}
          height={757}
          style={{ ...abs(-27, -193, 433, 757), display: "block", objectFit: "cover", maxWidth: "none" }}
        />
      </div>

      {/* 466:121 · Button · Continue Personalizing -- placeholder, not wired */}
      <div style={{ ...abs(23, 679, 382, 50), background: "#351E10", borderRadius: 8 }}>
        <div
          className={goudy.className}
          style={{
            ...abs(68.5, 16, 216),
            fontSize: 12,
            lineHeight: "17.86px",
            letterSpacing: 2.1,
            color: "#FFF6EC",
            whiteSpace: "nowrap",
          }}
        >
          CONTINUE PERSONALIZING
        </div>
        <img
          src="/veloria/home/466-123.svg"
          alt="→"
          width={15}
          height={18}
          style={{ ...abs(298.5, 16, 15, 18), display: "block", objectFit: "none", objectPosition: "left center" }}
        />
      </div>

      {/* 466:124 · Button · Save and Continue Later -- placeholder, not wired */}
      <div
        style={{
          ...abs(23, 735, 382, 50),
          background: "#FBF4EE",
          boxShadow: "inset 0 0 0 0.8px #C98B3A",
          borderRadius: 8,
        }}
      >
        <div
          className={goudy.className}
          style={{
            ...abs(63.5, 16, 223),
            fontSize: 12,
            lineHeight: "17.86px",
            letterSpacing: 2.1,
            color: "#3B2F2F",
            whiteSpace: "nowrap",
          }}
        >
          SAVE AND CONTINUE LATER
        </div>
        <img
          src="/veloria/home/466-126.svg"
          alt="♡"
          width={18}
          height={22}
          style={{ ...abs(300.5, 14, 18, 22), display: "block", objectFit: "none", objectPosition: "left center" }}
        />
      </div>

      {/* 463:149 · Frame 46 -- four personalization step rows (placeholders) */}
      <div style={abs(24, 455, 382, 205)}>
        {STEPS.map((s, i) => (
          <div
            key={s.n}
            style={{
              ...abs(0, i * 53, 382, 46),
              background: "#FBF4EE",
              boxShadow: "inset 0 0 0 0.8px #DAB07D",
              borderRadius: 10,
            }}
          >
            {/* Step Badge */}
            <div
              style={{
                ...abs(24, 9, 28, 28),
                background: "#D4AF37",
                borderRadius: 14,
                overflow: "hidden",
              }}
            >
              <div
                className={notoSC.className}
                style={{
                  ...abs(10.5, 7, 7),
                  fontSize: 12,
                  lineHeight: "14.4px",
                  fontWeight: 500,
                  color: "#FFF6EC",
                  whiteSpace: "nowrap",
                }}
              >
                {s.n}
              </div>
            </div>
            <img src={s.icon} alt="" width={44} height={34} style={{ ...abs(62, 6, 44, 34), display: "block" }} />
            {/* Content */}
            <div style={{ ...abs(116, 6, 225, 34), overflow: "hidden" }}>
              <div
                className={playfair.className}
                style={{
                  ...abs(0, 0, s.titleW),
                  fontSize: 15,
                  lineHeight: "19.99px",
                  fontWeight: 500,
                  color: "#3B2F2F",
                  whiteSpace: "nowrap",
                }}
              >
                {s.title}
              </div>
              <div
                className={notoSC.className}
                style={{
                  ...abs(0, 22, s.subW),
                  fontSize: 10,
                  lineHeight: "12px",
                  fontWeight: 400,
                  color: "#3B2F2F",
                  whiteSpace: "nowrap",
                }}
              >
                {s.sub}
              </div>
            </div>
            <img
              src="/veloria/home/465-156.svg"
              alt="→"
              width={15}
              height={18}
              style={{ ...abs(351, 14, 15, 18), display: "block", objectFit: "none", objectPosition: "left center" }}
            />
          </div>
        ))}
      </div>

      {/* 461:149 / 461:156 · rose-and-lines ornaments above and below title */}
      <img
        src="/veloria/home/461-149.svg"
        alt=""
        width={96}
        height={23}
        style={{ ...abs(167, 7, 95.992, 22.984), display: "block" }}
      />
      <img
        src="/veloria/home/461-156.svg"
        alt=""
        width={96}
        height={23}
        style={{ ...abs(167, 96, 95.992, 22.984), display: "block" }}
      />

      {/* 165:100 · A8 Title */}
      <div
        className={playfair.className}
        style={{
          ...abs(24, 39, 382),
          fontSize: 25,
          lineHeight: "30px",
          fontWeight: 500,
          color: "#3B2F2F",
          textAlign: "center",
          whiteSpace: "pre-line",
        }}
      >
        {"Personalized Gold Rose Gifts,\nMade for Their Story"}
      </div>

      {/* 472:150 · mascot, painted above the intro/ornament layer. Figma fill
          blendMode DARKEN (see A4/A7) keys out the opaque near-white
          background baked into the source art. */}
      <img
        src="/veloria/home/472-150.png"
        data-blend
        alt="Mascot with a speech bubble reading 'Let's make it yours.'"
        width={109}
        height={84}
        style={{
          ...abs(283, 98, 109, 84),
          display: "block",
          objectFit: "cover",
          mixBlendMode: "darken",
        }}
      />
    </div>
  );
}
