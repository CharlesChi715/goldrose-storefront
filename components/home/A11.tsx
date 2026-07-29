/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * Homepage module A-11 "Story, FAQ and Final CTA" (Figma node 138:67) of the
 * VELORIA homepage frame: brand-story block with photo and "READ OUR STORY"
 * CTA, four FAQ rows with "VIEW ALL FAQs", and the final gift CTA with value
 * icons and three buttons. Visible content is the "A11 · Reference Rebuild"
 * subtree (505:101); only "Shop All GoldRose Gifts" links (to /shop).
 */

import Link from "next/link";
import { abs } from "@/lib/figma-layout";
import { playfair, notoSC, goudy } from "@/lib/fonts";

const INK = "#291A13";
const CTA_GRADIENT = "linear-gradient(90deg, #261209 0%, #3D1F0E 100%)";

// FAQ rows (507:92/95/98/101) — identical 368×28 pills, y relative to 505:103.
const FAQ_ROWS = [
  { y: 65, q: "Are GoldRose gifts made from real roses?" },
  { y: 99, q: "Can I personalize a gift?" },
  { y: 133, q: "How are gifts protected during shipping?" },
  { y: 167, q: "Do you accept corporate and bulk orders?" },
];

export function A11() {
  return (
    <>
      {/* 138:67 module frame */}
      <div style={{ ...abs(0, 7900, 430, 714), background: "#FFF6EC", overflow: "hidden" }}>
        {/* 505:101 A11 · Reference Rebuild — solid #FFF6EC + radial glow */}
        <div
          style={{
            ...abs(-1, 0, 430, 737),
            background:
              "radial-gradient(268.75px 566.92px at 225.75px 510.23px, rgba(255,254,250,0.78) 0%, rgba(245,214,196,0) 100%), #FFF6EC",
            overflow: "hidden",
          }}
        >
          {/* ---- 505:102 A11/01 Brand Story ---- */}
          <div style={{ ...abs(0, 0, 430, 259), overflow: "hidden" }}>
            <img
              src="/veloria/home/506-89.svg"
              alt=""
              width={88}
              height={20}
              style={{ ...abs(57, 10, 88, 20), display: "block" }}
            />
            {/* 508:90 story photo */}
            <img
              src="/veloria/home/508-90.png"
              alt="Gold-preserved rose with GoldRose gift packaging"
              width={204}
              height={259}
              style={{ ...abs(226, 0, 204, 259), display: "block" }}
            />
            <div
              className={playfair.className}
              style={{
                ...abs(26, 32, 190),
                fontSize: 18,
                lineHeight: "22px",
                color: INK,
                fontWeight: 500,
                whiteSpace: "pre-line",
              }}
            >
              {"A Real Rose Made\nto Outlive the Moment"}
            </div>
            <div
              className={goudy.className}
              style={{
                ...abs(26, 82, 176),
                fontSize: 8,
                lineHeight: "11.5px",
                color: INK,
                whiteSpace: "pre-line",
              }}
            >
              {
                "At GoldRose, we believe the most meaningful\ngifts are more than beautiful — they’re personal.\nEach real rose is carefully preserved in 24K gold,\ncapturing not just a flower, but a memory,\na milestone, a feeling.\n\nWe don’t just preserve roses.\nWe preserve what matters."
              }
            </div>
            <div
              className={playfair.className}
              style={{
                ...abs(26, 184, 170),
                fontSize: 11.2,
                lineHeight: "15px",
                color: "#AD6152",
                fontWeight: 400,
                whiteSpace: "pre-line",
              }}
            >
              {"A flower may fade.\nThe story does not have to."}
            </div>
            {/* 506:96 CTA · Read Our Story — live since 07-29: /story exists */}
            <Link
              href="/story"
              aria-label="Read our story"
              style={{
                ...abs(25, 216, 138, 28),
                background: CTA_GRADIENT,
                borderRadius: 6,
                overflow: "hidden",
                display: "block",
              }}
            >
              <div
                className={goudy.className}
                style={{
                  ...abs(5, 0, 110, 28),
                  fontSize: 7.9,
                  lineHeight: "28px",
                  color: "#FAF0E0",
                  letterSpacing: 1.25,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                READ OUR STORY
              </div>
              <img
                src="/veloria/home/506-98.svg"
                alt="→"
                width={13}
                height={7}
                style={{ ...abs(117.02, 11.005, 13, 7), display: "block" }}
              />
            </Link>
            {/* 506:99 story divider (hairline sits just above the node's y) */}
            <img
              src="/veloria/home/506-99.svg"
              alt=""
              width={430}
              height={1}
              style={{ ...abs(0, 257.3, 430, 1), display: "block" }}
            />
          </div>

          {/* ---- 505:103 A11/02 FAQ ---- */}
          <div style={{ ...abs(0, 259, 430, 218), overflow: "hidden" }}>
            <img
              src="/veloria/home/507-87.svg"
              alt=""
              width={100}
              height={20}
              style={{ ...abs(165, 7, 100, 20), display: "block" }}
            />
            <div
              className={playfair.className}
              style={{
                ...abs(31, 27, 360, 32),
                fontSize: 24,
                lineHeight: "30px",
                color: INK,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                whiteSpace: "nowrap",
              }}
            >
              Frequently Asked Questions
            </div>
            {/* FAQ rows — placeholders, not clickable */}
            {FAQ_ROWS.map(({ y, q }) => (
              <div
                key={q}
                style={{
                  ...abs(31, y, 368, 28),
                  background: "rgba(255,250,244,0.82)",
                  borderRadius: 6,
                  boxShadow: "inset 0 0 0 0.65px rgba(212,178,156,0.55)",
                  overflow: "hidden",
                }}
              >
                <div
                  className={goudy.className}
                  style={{
                    ...abs(14, 0, 315, 28),
                    fontSize: 10.5,
                    lineHeight: "28px",
                    color: INK,
                    whiteSpace: "nowrap",
                  }}
                >
                  {q}
                </div>
                <img
                  src="/veloria/home/507-100.svg"
                  alt="＋"
                  width={11}
                  height={11}
                  style={{ ...abs(338.6, 8.945, 11, 11), display: "block" }}
                />
              </div>
            ))}
            {/* 507:104 VIEW ALL FAQs — rendered strip, placeholder */}
            <img
              src="/veloria/home/507-104.svg"
              alt="VIEW ALL FAQs →"
              width={104}
              height={9}
              style={{ ...abs(162.533, 202.629, 104, 9), display: "block" }}
            />
            <img
              src="/veloria/home/507-105.svg"
              alt=""
              width={430}
              height={1}
              style={{ ...abs(0, 216.3, 430, 1), display: "block" }}
            />
          </div>

          {/* ---- 505:104 A11/03 Final Gift CTA ---- */}
          <div style={{ ...abs(0, 477, 430, 222), overflow: "hidden" }}>
            {/* 509:87 image frame — full-page photo bled upward, frame clips */}
            <div style={{ ...abs(0, 0, 194, 222), overflow: "hidden" }}>
              <img
                src="/veloria/home/509-88.png"
                alt="Gold-dipped rose gift"
                width={430}
                height={722}
                // Bleed crop: 430×722 photo offset -462px; keep verbatim.
                style={{ ...abs(0, -462, 430, 722), display: "block", maxWidth: "none" }}
              />
            </div>
            <div
              className={playfair.className}
              style={{
                ...abs(199, 15, 214, 50),
                fontSize: 20.5,
                lineHeight: "23.5px",
                color: INK,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                whiteSpace: "pre-line",
              }}
            >
              {"Find a Gold Rose Gift\nThey’ll Remember"}
            </div>
            {/* Value icons + captions */}
            <img
              src="/veloria/home/509-90.svg"
              alt=""
              width={22}
              height={22}
              style={{ ...abs(226, 70, 22, 22), display: "block" }}
            />
            <img
              src="/veloria/home/509-94.svg"
              alt=""
              width={22}
              height={22}
              style={{ ...abs(293, 70, 22, 22), display: "block" }}
            />
            <img
              src="/veloria/home/509-97.svg"
              alt=""
              width={22}
              height={22}
              style={{ ...abs(360, 70, 22, 22), display: "block" }}
            />
            {["A real rose.", "A personal story.", "A gift made to last."].map((v, i) => (
              <div
                key={v}
                className={goudy.className}
                style={{
                  ...abs([200, 267, 334][i], 96, 74),
                  fontSize: 7.6,
                  lineHeight: "16px",
                  color: INK,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                {v}
              </div>
            ))}
            {/* 509:101/102 value dividers — 0.7px CSS hairlines (the exported
                SVG has a zero-width canvas, unusable) */}
            <div style={{ ...abs(266.65, 72, 0.7, 43), background: "rgba(194,143,97,0.55)" }} />
            <div style={{ ...abs(333.65, 72, 0.7, 43), background: "rgba(194,143,97,0.55)" }} />
            {/* 509:103 CTA · Shop All GoldRose Gifts → /shop */}
            <Link
              href="/shop"
              style={{
                ...abs(206, 122, 212, 28),
                display: "block",
                background: CTA_GRADIENT,
                borderRadius: 6,
                overflow: "hidden",
              }}
            >
              <div
                className={notoSC.className}
                style={{
                  ...abs(8, 0, 176, 28),
                  fontSize: 8.6,
                  lineHeight: "28px",
                  color: "#FFF7EB",
                  fontWeight: 500,
                  letterSpacing: 1.35,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                SHOP ALL GOLDROSE GIFTS
              </div>
              <img
                src="/veloria/home/509-105.svg"
                alt="→"
                width={13}
                height={7}
                style={{ ...abs(189.02, 11.005, 13, 7), display: "block" }}
              />
            </Link>
            {/* 509:106 CTA · Create a Personalized Gift — placeholder */}
            <div
              style={{
                ...abs(206, 158, 212, 28),
                background: "rgba(255,250,242,0.68)",
                boxShadow: "inset 0 0 0 0.7px rgba(191,125,59,0.75)",
                borderRadius: 6,
                overflow: "hidden",
              }}
            >
              <div
                className={notoSC.className}
                style={{
                  ...abs(8, 0, 176, 28),
                  fontSize: 8.6,
                  lineHeight: "28px",
                  color: INK,
                  fontWeight: 500,
                  letterSpacing: 1.35,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                CREATE A PERSONALIZED GIFT
              </div>
              <img
                src="/veloria/home/509-105.svg"
                alt="→"
                width={13}
                height={7}
                style={{ ...abs(189.02, 11.005, 13, 7), display: "block" }}
              />
            </div>
            {/* 509:109 CTA · Find a Gift with MORI — placeholder */}
            <div
              style={{
                ...abs(206, 193, 212, 28),
                background: "rgba(255,250,242,0.68)",
                boxShadow: "inset 0 0 0 0.7px rgba(191,125,59,0.75)",
                borderRadius: 6,
                overflow: "hidden",
              }}
            >
              <div
                className={notoSC.className}
                style={{
                  ...abs(31, 0, 146, 28),
                  fontSize: 8.6,
                  lineHeight: "28px",
                  color: INK,
                  fontWeight: 500,
                  letterSpacing: 1.35,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                FIND A GIFT WITH MORI
              </div>
              <img
                src="/veloria/home/509-105.svg"
                alt="→"
                width={13}
                height={7}
                style={{ ...abs(189.02, 11.005, 13, 7), display: "block" }}
              />
              <img
                src="/veloria/home/509-112.svg"
                alt=""
                width={18}
                height={18}
                style={{ ...abs(8, 5, 18, 18), display: "block" }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
