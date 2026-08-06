/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * Module A-9 · "Craft, Workshop and Patents" of the simplified ELDREVE
 * homepage (Figma node 2380:658 — 430×991 CREAM section at y=3133): craft
 * steps 01–04 with photo crops, the EXPLORE OUR CRAFT button, and the lower
 * block (2380:684) holding the workshop gallery and the Patents &
 * Certificates panel. Values verbatim from the Figma data.
 *
 * 2026-08-04 sync: the band flipped from a dark #3B2F2F section to cream, so
 * every body colour inverted to INK; the certificates panel lost its intro
 * column, footer divider and benefits row (the four certificates now span the
 * full 422px panel); and the "SEE HOW WE WORK" button was deleted at source.
 */

import Link from "next/link";
import { abs } from "@/lib/figma-layout";
import { playfair, notoSC, goudy } from "@/lib/fonts";
import type { HomeText } from "@/lib/home-content/registry";

const GOLD = "#D4AF37";
const CREAM = "#FFF6EC";
// Body colour on the cream band (was CREAM/CHAMPAGNE on the old dark band).
const INK = "#3B2F2F";

// Craft steps 01–04 (165:140…165:159). Step 1's title is vertically centered
// in its 30px box (the others are top-aligned and wrap to two lines).
const CRAFT_STEPS = [
  {
    x: 20,
    num: "01",
    titleW: 90,
    centerTitle: true,
    alt: "Hand-selecting real roses at perfect bloom",
  },
  {
    x: 120,
    num: "02",
    titleW: 92,
    centerTitle: false,
    alt: "Rose being finished by hand in pure 24k gold",
  },
  {
    x: 220,
    num: "03",
    titleW: 90,
    centerTitle: false,
    alt: "Gold-dipped rose under quality inspection",
  },
  {
    x: 320,
    num: "04",
    titleW: 90,
    centerTitle: false,
    alt: "Gold rose protected and packaged for delivery",
  },
];

// Per-step craft photos for crops 1–3 (165:141 / 165:146 / 165:151); crop 4
// is baked into the 165-155.svg frame render below.
const CRAFT_PHOTOS = [
  "/eldreve/home/165-141.png",
  "/eldreve/home/165-146.png",
  "/eldreve/home/165-151.png",
];

// Six workshop gallery crops (2380:692…2380:702), coords relative to the lower
// frame (0,3571); each shows an offset window into the same 430×913 source.
const WORKSHOP_CROPS = [
  {
    x: 12,
    y: 105,
    w: 150,
    h: 105,
    imgX: -11,
    imgY: -449,
    alt: "Careful preparation in the ELDREVE workshop",
  },
  {
    x: 166,
    y: 105,
    w: 120,
    h: 105,
    imgX: -164,
    imgY: -449,
    alt: "Hand-finishing roses with precision",
  },
  {
    x: 290,
    y: 105,
    w: 130,
    h: 105,
    imgX: -289,
    imgY: -449,
    alt: "Thoughtful packaging of gold roses",
  },
  {
    x: 12,
    y: 217,
    w: 110,
    h: 106,
    imgX: -11,
    imgY: -565,
    alt: "Quality inspection of finished roses",
  },
  {
    x: 126,
    y: 217,
    w: 129,
    h: 106,
    imgX: -125,
    imgY: -565,
    alt: "Finished gold roses ready for delivery",
  },
  {
    x: 259,
    y: 217,
    w: 161,
    h: 106,
    imgX: -263,
    imgY: -565,
    alt: "Bulk orders prepared in the workshop",
  },
];

// Certificate columns (2380:707…2380:726), x relative to the 422×116 strip.
const CERTIFICATES = [
  { x: 0, imgX: -120 },
  { x: 116, imgX: -194 },
  { x: 232, imgX: -268 },
  { x: 348, imgX: -341 },
];

export function A9({ c }: { c: HomeText["craft"] }) {
  const steps = [
    { title: c.step_1_title, copy: c.step_1_copy },
    { title: c.step_2_title, copy: c.step_2_copy },
    { title: c.step_3_title, copy: c.step_3_copy },
    { title: c.step_4_title, copy: c.step_4_copy },
  ];
  const certs = [
    { title: c.cert_1_title, num: c.cert_1_number },
    { title: c.cert_2_title, num: c.cert_2_number },
    { title: c.cert_3_title, num: c.cert_3_number },
    { title: c.cert_4_title, num: c.cert_4_number },
  ];
  return (
    // id="craft" — in-page anchor kept for deep links; the A-4 card that used
    // to target it was deleted at source in the 2026-08-04 sync.
    <div
      id="craft"
      style={{
        ...abs(0, 3133, 430, 991),
        background: CREAM,
        overflow: "hidden",
      }}
    >
      {/* 165:137 · eyebrow */}
      <div
        className={notoSC.className}
        style={{
          ...abs(24, 20, 382),
          fontSize: 9,
          lineHeight: "10.8px",
          color: GOLD,
          fontWeight: 500,
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        {c.eyebrow}
      </div>

      {/* 165:138 · title */}
      <div
        className={playfair.className}
        style={{
          ...abs(24, 44, 382),
          fontSize: 31,
          lineHeight: "30px",
          color: INK,
          fontWeight: 500,
          textAlign: "center",
          whiteSpace: "pre-line",
        }}
      >
        {c.title}
      </div>

      {/* 165:139 · intro */}
      <div
        className={goudy.className}
        style={{
          ...abs(50, 118, 330),
          fontSize: 11,
          lineHeight: "17px",
          color: INK,
          textAlign: "center",
        }}
      >
        {c.intro}
      </div>

      {/* 165:140/145/150 · craft photo crops 1–3: 90×96 windows into the full
          430×912.397 source photo (offset left by the card's own x). */}
      {CRAFT_STEPS.slice(0, 3).map((s, i) => (
        <div
          key={s.num}
          style={{
            ...abs(s.x, 170, 90, 96),
            background: "#F3C6D1",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <img
            src={CRAFT_PHOTOS[i]}
            alt={s.alt}
            width={430}
            height={912}
            style={{
              ...abs(-s.x, -170, 430, 912.397),
              maxWidth: "none",
              display: "block",
            }}
          />
        </div>
      ))}
      {/* 165:155 · craft crop 4 — the whole frame is served as one Figma SVG render */}
      <img
        src="/eldreve/home/165-155.svg"
        alt={CRAFT_STEPS[3].alt}
        width={90}
        height={96}
        style={{ ...abs(320, 170, 90, 96), borderRadius: 10, display: "block" }}
      />

      {/* 165:142/147/152/157 · step numbers */}
      {CRAFT_STEPS.map((s) => (
        <div
          key={s.num}
          className={notoSC.className}
          style={{
            ...abs(s.x, 274, 90),
            fontSize: 8,
            lineHeight: "9.6px",
            color: GOLD,
            fontWeight: 500,
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          {s.num}
        </div>
      ))}

      {/* 165:143/148/153/158 · step titles */}
      {CRAFT_STEPS.map((s, i) => (
        <div
          key={s.num}
          className={playfair.className}
          style={{
            ...abs(s.x, 294, s.titleW, s.centerTitle ? 30 : undefined),
            fontSize: 13,
            lineHeight: "17.33px",
            color: INK,
            fontWeight: 500,
            textAlign: "center",
            ...(s.centerTitle
              ? {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }
              : {}),
          }}
        >
          {steps[i].title}
        </div>
      ))}

      {/* 165:144/149/154/159 · step copy (vertically centered 82×42 boxes) */}
      {CRAFT_STEPS.map((s, i) => (
        <div
          key={s.num}
          className={goudy.className}
          style={{
            ...abs(s.x + 4, 326, 82, 42),
            fontSize: 8,
            lineHeight: "12px",
            color: INK,
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {steps[i].copy}
        </div>
      ))}

      {/* 2380:682 · EXPLORE OUR CRAFT — live since 2026-08-04: the frame's own
          prototype wires ON_CLICK → 1573:107 (/craft). Button chrome + label
          stay Figma's baked render; the Link only adds the hit area. */}
      <Link
        href={c.cta_href}
        aria-label="Explore our craft"
        style={{ ...abs(93, 380, 246, 38), display: "block" }}
      >
        <img
          src="/eldreve/home/165-180.svg"
          alt="EXPLORE OUR CRAFT →"
          width={246}
          height={38}
          style={{ ...abs(0, 0, 246, 38), display: "block" }}
        />
      </Link>

      {/* 2380:684 · lower block — workshop gallery + certifications */}
      <div
        style={{
          ...abs(0, 438, 430, 565),
          background: CREAM,
          overflow: "hidden",
        }}
      >
        {/* 482:118 · rose divider */}
        <img
          src="/eldreve/home/482-118.svg"
          alt=""
          width={104}
          height={14}
          style={{ ...abs(163, 7, 104, 14), display: "block" }}
        />

        {/* 482:122 · workshop title */}
        <div
          className={playfair.className}
          style={{
            ...abs(20, 30, 390),
            fontSize: 25,
            lineHeight: "28px",
            color: INK,
            fontWeight: 500,
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          {c.workshop_title}
        </div>

        {/* 482:123 · workshop copy */}
        <div
          className={goudy.className}
          style={{
            ...abs(50, 68, 330),
            fontSize: 9,
            lineHeight: "10px",
            color: INK,
            textAlign: "center",
            whiteSpace: "pre-line",
          }}
        >
          {c.workshop_copy}
        </div>

        {/* 482:124 · six workshop gallery crops */}
        {WORKSHOP_CROPS.map((c) => (
          <div
            key={`${c.x}-${c.y}`}
            style={{
              ...abs(c.x, c.y, c.w, c.h),
              borderRadius: 6,
              overflow: "hidden",
            }}
          >
            <img
              src="/eldreve/home/482-129.png"
              alt={c.alt}
              width={430}
              height={913}
              style={{
                ...abs(c.imgX, c.imgY, 430, 913),
                maxWidth: "none",
                objectFit: "cover",
                display: "block",
              }}
            />
            {/* stroke overlaid above the photo: an inset shadow on the frame
                itself would paint underneath the child image */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 6,
                boxShadow: "inset 0 0 0 1px rgba(212, 175, 55, 0.55)",
                pointerEvents: "none",
              }}
            />
          </div>
        ))}

        {/* 2380:704 · "— VERIFIED QUALITY —" heading above the panel */}
        <div
          className={playfair.className}
          style={{
            ...abs(97, 345, 240, 44),
            fontSize: 20,
            lineHeight: "26.7px",
            color: INK,
            fontWeight: 500,
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            whiteSpace: "nowrap",
          }}
        >
          {c.verified_title}
        </div>

        {/* 2380:705 · Patents & Certificates bordered panel. The design
            stripped its intro column, footer divider and benefits row in this
            revision, so the four certificates now span the full width. */}
        <div
          style={{
            ...abs(5, 400, 422, 126),
            borderRadius: 5,
            overflow: "hidden",
            boxShadow: "inset 0 0 0 1px rgba(212, 175, 55, 0.75)",
          }}
        >
          {/* 2380:706 · four certificates */}
          <div style={{ ...abs(0, 10, 422, 116), overflow: "hidden" }}>
            {CERTIFICATES.map((cert, i) => (
              <div
                key={cert.x}
                style={{ ...abs(cert.x, 0, 69, 116), overflow: "hidden" }}
              >
                <div
                  style={{
                    ...abs(2.5, 0, 64, 88),
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <img
                    src="/eldreve/home/482-129.png"
                    alt={`${certs[i].title} certificate`}
                    width={430}
                    height={913}
                    style={{
                      ...abs(cert.imgX, -684, 430, 913),
                      maxWidth: "none",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: 2,
                      boxShadow: "inset 0 0 0 1px rgba(212, 175, 55, 0.7)",
                      pointerEvents: "none",
                    }}
                  />
                </div>
                <div
                  className={notoSC.className}
                  style={{
                    ...abs(0, 92, 69),
                    fontSize: 6.5,
                    lineHeight: "8px",
                    color: INK,
                    fontWeight: 500,
                    textAlign: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  {certs[i].title}
                </div>
                <div
                  className={notoSC.className}
                  style={{
                    ...abs(0, 104, 69),
                    fontSize: 5,
                    lineHeight: "6px",
                    color: INK,
                    fontWeight: 400,
                    textAlign: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  {certs[i].num}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
