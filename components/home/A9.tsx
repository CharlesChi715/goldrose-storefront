/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * Module A-9 · "Craft, Workshop and Patents" of the new GoldRose homepage
 * (Figma node 138:65 — 430×1011 dark section at y=6141): craft steps 01–04
 * with photo crops, the EXPLORE OUR CRAFT button, and the corrected lower
 * block (482:117) holding the workshop gallery, the Patents & Certificates
 * panel and the SEE HOW WE WORK button. Values verbatim from the Figma data.
 */

import { abs } from "@/components/veloria";
import { playfair, notoSC, goudy } from "@/lib/fonts";

const GOLD = "#D4AF37";
const CREAM = "#FFF6EC";
const CHAMPAGNE = "#F6E2A0";

// Craft steps 01–04 (165:140…165:159). Step 1's title is vertically centered
// in its 30px box (the others are top-aligned and wrap to two lines).
const CRAFT_STEPS = [
  {
    x: 20,
    num: "01",
    title: "Hand-Selected",
    titleW: 90,
    centerTitle: true,
    copy: "Only the most beautiful real roses at the perfect bloom.",
    alt: "Hand-selecting real roses at perfect bloom",
  },
  {
    x: 120,
    num: "02",
    title: "Expert Finishing",
    titleW: 92,
    centerTitle: false,
    copy: "Carefully finished by hand in pure 24k gold.",
    alt: "Rose being finished by hand in pure 24k gold",
  },
  {
    x: 220,
    num: "03",
    title: "Quality Checked",
    titleW: 90,
    centerTitle: false,
    copy: "Inspected for beauty, durability and perfection.",
    alt: "Gold-dipped rose under quality inspection",
  },
  {
    x: 320,
    num: "04",
    title: "Protected & Packaged",
    titleW: 90,
    centerTitle: false,
    copy: "Protected and packaged to arrive beautifully.",
    alt: "Gold rose protected and packaged for delivery",
  },
];

// Per-step craft photos for crops 1–3 (165:141 / 165:146 / 165:151); crop 4
// is baked into the 165-155.svg frame render below.
const CRAFT_PHOTOS = [
  "/veloria/home/165-141.png",
  "/veloria/home/165-146.png",
  "/veloria/home/165-151.png",
];

// Six workshop gallery crops (482:128…482:139), coords relative to the lower
// frame (0,6579); each shows an offset window into the same 430×913 source.
const WORKSHOP_CROPS = [
  { x: 12, y: 84, w: 150, h: 105, imgX: -11, imgY: -449, alt: "Careful preparation in the GoldRose workshop" },
  { x: 166, y: 84, w: 120, h: 105, imgX: -164, imgY: -449, alt: "Hand-finishing roses with precision" },
  { x: 290, y: 84, w: 130, h: 105, imgX: -289, imgY: -449, alt: "Thoughtful packaging of gold roses" },
  { x: 12, y: 196, w: 110, h: 106, imgX: -11, imgY: -565, alt: "Quality inspection of finished roses" },
  { x: 126, y: 196, w: 129, h: 106, imgX: -125, imgY: -565, alt: "Finished gold roses ready for delivery" },
  { x: 259, y: 196, w: 161, h: 106, imgX: -263, imgY: -565, alt: "Bulk orders prepared in the workshop" },
];

// Certificate columns (483:125…483:144), x relative to the 303×119 strip.
const CERTIFICATES = [
  { x: 0, imgX: -120, title: "US Patent", num: "US 11,324,751 B2" },
  { x: 76, imgX: -194, title: "European Patent", num: "EP 3 982 104 B1" },
  { x: 152, imgX: -268, title: "China Patent", num: "ZL 2021 2 1234567.8" },
  { x: 228, imgX: -341, title: "ISO 9001:2015", num: "Quality Certified" },
];

// Certification benefits row (484:115…484:135), x relative to the 406×44 strip.
const BENEFITS = [
  { x: 0, icon: "/veloria/home/484-116.svg", label: "Patented Preservation\nTechnology" },
  { x: 102, icon: "/veloria/home/484-121.svg", label: "International Patent\nProtection" },
  { x: 204, icon: "/veloria/home/484-127.svg", label: "Certified Quality\nManagement" },
  { x: 306, icon: "/veloria/home/484-132.svg", label: "Trusted Worldwide\nProtection" },
];

export function A9() {
  return (
    // id="craft" — scroll target for the A-4 "EXPLORE OUR CRAFT" card (H-17).
    <div id="craft" style={{ ...abs(0, 6141, 430, 1011), background: "#3B2F2F", overflow: "hidden" }}>
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
        {"—   REAL ROSES, FINISHED WITH CARE   —"}
      </div>

      {/* 165:138 · title */}
      <div
        className={playfair.className}
        style={{
          ...abs(24, 44, 382),
          fontSize: 31,
          lineHeight: "30px",
          color: CHAMPAGNE,
          fontWeight: 500,
          textAlign: "center",
        }}
      >
        Real Roses, Carefully
        <br />
        Preserved and Finished
      </div>

      {/* 165:139 · intro */}
      <div
        className={goudy.className}
        style={{ ...abs(50, 118, 330), fontSize: 11, lineHeight: "17px", color: CREAM, textAlign: "center" }}
      >
        Each rose is hand-selected, naturally preserved, and finished in pure 24k gold with meticulous care.
      </div>

      {/* 165:140/145/150 · craft photo crops 1–3: 90×96 windows into the full
          430×912.397 source photo (offset left by the card's own x). */}
      {CRAFT_STEPS.slice(0, 3).map((s, i) => (
        <div key={s.num} style={{ ...abs(s.x, 170, 90, 96), background: "#F3C6D1", borderRadius: 10, overflow: "hidden" }}>
          <img
            src={CRAFT_PHOTOS[i]}
            alt={s.alt}
            width={430}
            height={912}
            style={{ ...abs(-s.x, -170, 430, 912.397), maxWidth: "none", display: "block" }}
          />
        </div>
      ))}
      {/* 165:155 · craft crop 4 — the whole frame is served as one Figma SVG render */}
      <img
        src="/veloria/home/165-155.svg"
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
      {CRAFT_STEPS.map((s) => (
        <div
          key={s.num}
          className={playfair.className}
          style={{
            ...abs(s.x, 294, s.titleW, s.centerTitle ? 30 : undefined),
            fontSize: 13,
            lineHeight: "17.33px",
            color: CREAM,
            fontWeight: 500,
            textAlign: "center",
            ...(s.centerTitle ? { display: "flex", alignItems: "center", justifyContent: "center" } : {}),
          }}
        >
          {s.title}
        </div>
      ))}

      {/* 165:144/149/154/159 · step copy (vertically centered 82×42 boxes) */}
      {CRAFT_STEPS.map((s) => (
        <div
          key={s.num}
          className={goudy.className}
          style={{
            ...abs(s.x + 4, 326, 82, 42),
            fontSize: 8,
            lineHeight: "12px",
            color: CREAM,
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {s.copy}
        </div>
      ))}

      {/* 165:180 · EXPLORE OUR CRAFT — non-clickable placeholder, served as
          Figma's own render (button chrome + label baked into one SVG). */}
      <img
        src="/veloria/home/165-180.svg"
        alt="EXPLORE OUR CRAFT →"
        width={246}
        height={38}
        style={{ ...abs(93, 400, 246, 38), display: "block" }}
      />

      {/* 482:117 · corrected lower block — workshop gallery + certifications */}
      <div style={{ ...abs(0, 438, 430, 573), background: "#3B2F2F", overflow: "hidden" }}>
        {/* 482:118 · rose divider */}
        <img src="/veloria/home/482-118.svg" alt="" width={104} height={14} style={{ ...abs(163, 7, 104, 14), display: "block" }} />

        {/* 482:122 · workshop title */}
        <div
          className={playfair.className}
          style={{
            ...abs(20, 23, 390),
            fontSize: 25,
            lineHeight: "28px",
            color: CHAMPAGNE,
            fontWeight: 500,
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          Inside the GoldRose Workshop
        </div>

        {/* 482:123 · workshop copy */}
        <div
          className={goudy.className}
          style={{ ...abs(50, 54, 330), fontSize: 9, lineHeight: "10px", color: CREAM, textAlign: "center" }}
        >
          See where real roses are prepared, finished,
          <br />
          inspected and packed for delivery.
        </div>

        {/* 482:124 · six workshop gallery crops */}
        {WORKSHOP_CROPS.map((c) => (
          <div key={`${c.x}-${c.y}`} style={{ ...abs(c.x, c.y, c.w, c.h), borderRadius: 6, overflow: "hidden" }}>
            <img
              src="/veloria/home/482-129.png"
              alt={c.alt}
              width={430}
              height={913}
              style={{ ...abs(c.imgX, c.imgY, 430, 913), maxWidth: "none", objectFit: "cover", display: "block" }}
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

        {/* 482:125 · Patents & Certificates bordered panel */}
        <div
          style={{
            ...abs(5, 324, 422, 181),
            borderRadius: 5,
            overflow: "hidden",
            boxShadow: "inset 0 0 0 1px rgba(212, 175, 55, 0.75)",
          }}
        >
          {/* 483:115 · certification intro */}
          <div style={{ ...abs(8, 7, 99, 118), overflow: "hidden" }}>
            <img src="/veloria/home/483-116.svg" alt="" width={24} height={24} style={{ ...abs(4, 1, 24, 24), display: "block" }} />
            <div
              className={playfair.className}
              style={{ ...abs(2, 42, 97), fontSize: 8.5, lineHeight: "11px", color: CHAMPAGNE, fontWeight: 500, whiteSpace: "nowrap" }}
            >
              Patents & Certificates
            </div>
            <div
              className={goudy.className}
              style={{ ...abs(2, 60, 96), fontSize: 6.2, lineHeight: "8px", color: "rgba(255, 246, 236, 0.9)", whiteSpace: "pre-line" }}
            >
              {"Our craftsmanship and preservation\ntechniques are protected by\ninternational patents and certified\nfor quality and authenticity."}
            </div>
          </div>

          {/* 483:122 · four certificates */}
          <div style={{ ...abs(111, 7, 303, 119), overflow: "hidden" }}>
            {CERTIFICATES.map((c) => (
              <div key={c.title} style={{ ...abs(c.x, 0, 69, 119), overflow: "hidden" }}>
                <div style={{ ...abs(2.5, 0, 64, 88), borderRadius: 2, overflow: "hidden" }}>
                  <img
                    src="/veloria/home/482-129.png"
                    alt={`${c.title} certificate`}
                    width={430}
                    height={913}
                    style={{ ...abs(c.imgX, -684, 430, 913), maxWidth: "none", objectFit: "cover", display: "block" }}
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
                    color: CREAM,
                    fontWeight: 500,
                    textAlign: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.title}
                </div>
                <div
                  className={notoSC.className}
                  style={{
                    ...abs(0, 104, 69),
                    fontSize: 5,
                    lineHeight: "6px",
                    color: "rgba(255, 246, 236, 0.82)",
                    fontWeight: 400,
                    textAlign: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.num}
                </div>
              </div>
            ))}
          </div>

          {/* 483:123 · footer divider — zero-height line, 1px CENTER stroke,
              so the rendered strip sits 0.5px above the node's y */}
          <img src="/veloria/home/483-123.svg" alt="" width={406} height={1} style={{ ...abs(8, 128.5, 406, 1), display: "block" }} />

          {/* 483:124 · certification benefits */}
          <div style={{ ...abs(8, 133, 406, 44), overflow: "hidden" }}>
            {BENEFITS.map((b) => (
              <div key={b.label} style={{ ...abs(b.x, 0, 96, 44), overflow: "hidden" }}>
                {/* 484:116/121/127/132 · per-benefit icons */}
                <img src={b.icon} alt="" width={22} height={22} style={{ ...abs(0, 7, 22, 22), display: "block" }} />
                <div
                  className={notoSC.className}
                  style={{
                    ...abs(26, 7, 70),
                    fontSize: 5.6,
                    lineHeight: "8px",
                    color: "rgba(255, 246, 236, 0.78)",
                    fontWeight: 400,
                    whiteSpace: "pre-line",
                  }}
                >
                  {b.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 482:126 · SEE HOW WE WORK — non-clickable placeholder, served as
            Figma's own render */}
        <img
          src="/veloria/home/482-126.svg"
          alt="SEE HOW WE WORK →"
          width={240}
          height={32}
          style={{ ...abs(97, 527, 240, 32), display: "block" }}
        />
      </div>
    </div>
  );
}
