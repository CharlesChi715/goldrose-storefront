/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * Module A-6 "Shop by Recipient and Reviews" (Figma node 138:62) of the
 * VELORIA homepage frame: recipient filter chips, three recipient gift cards,
 * the "Just Because" note card, and the "Real Gifts, Real Moments" review
 * strip with carousel dots and the "Read Customer Stories" button. All
 * coordinates/colors are verbatim Figma REST data, homepage-frame absolute.
 */

import Link from "next/link";
import { ReviewsRail } from "@/components/home/ReviewsRail";
import { abs } from "@/components/veloria";
import { playfair, notoSC, goudy } from "@/lib/fonts";

/* Recipient filter chips (static, not clickable). "Wife" is the selected
   state: orange stroke + orange label; the rest share the neutral pair. */
const CHIPS = [
  { x: 12, w: 46, stroke: "#C76E29", labelX: 25.5, labelW: 19, label: "Wife", color: "#BD5C1A" },
  { x: 63, w: 58, stroke: "#E5D6C2", labelX: 72, labelW: 40, label: "Girlfriend", color: "#3B2E2E" },
  { x: 126, w: 42, stroke: "#E5D6C2", labelX: 136, labelW: 22, label: "Mom", color: "#3B2E2E" },
  { x: 173, w: 52, stroke: "#E5D6C2", labelX: 183.5, labelW: 31, label: "Friends", color: "#3B2E2E" },
  { x: 230, w: 54, stroke: "#E5D6C2", labelX: 240, labelW: 34, label: "Couples", color: "#3B2E2E" },
  { x: 289, w: 48, stroke: "#E5D6C2", labelX: 298.5, labelW: 29, label: "Clients", color: "#3B2E2E" },
  { x: 342, w: 62, stroke: "#E5D6C2", labelX: 350, labelW: 46, label: "Employees", color: "#3B2E2E" },
] as const;

export function A6() {
  return (
    <>
      {/* Module background (138:62) */}
      <div style={{ ...abs(0, 3762, 430, 844), background: "#FFF6EC" }} />

      {/* Header ornament · rose and lines (431:265) */}
      <img
        src="/veloria/home/424-150.svg"
        alt=""
        width={142}
        height={34}
        style={{ ...abs(144, 3762, 142, 34), display: "block" }}
      />

      {/* Title + intro (163:82, 163:83) */}
      <div
        className={playfair.className}
        style={{
          ...abs(24, 3793, 382),
          fontSize: 30,
          lineHeight: "36px",
          fontWeight: 500,
          color: "#3B2F2F",
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        Shop by Recipient
      </div>
      <div
        className={goudy.className}
        style={{
          ...abs(52, 3829, 326),
          fontSize: 10,
          lineHeight: "15px",
          color: "#3B2F2F",
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        Choose a rose gift for someone special.
      </div>

      {/* Recipient filter chips (163:105…191:152) — static */}
      {CHIPS.map((c) => (
        <div
          key={c.label}
          style={{
            ...abs(c.x, 3853, c.w, 30),
            background: "#FFF6EC",
            borderRadius: 999,
            boxShadow: `inset 0 0 0 1px ${c.stroke}`,
          }}
        >
          <div
            className={notoSC.className}
            style={{
              ...abs(c.labelX - c.x, 9.5, c.labelW),
              fontSize: 9,
              lineHeight: "10.8px",
              fontWeight: 400,
              color: c.color,
              whiteSpace: "nowrap",
            }}
          >
            {c.label}
          </div>
        </div>
      ))}

      {/* Arrow · more recipients (442:166) — decorative */}
      <img
        src="/veloria/home/442-166.svg"
        alt=""
        width={12}
        height={18}
        style={{ ...abs(414, 3859, 12, 18), display: "block" }}
      />

      {/* Recipient card 1 · Gifts for Wife (163:84) */}
      <Link
        href="/shop"
        style={{
          ...abs(15, 3897, 176, 257),
          display: "block",
          background: "#FFFBF6",
          borderRadius: 10,
          boxShadow: "inset 0 0 0 1px #E5D1B8",
          overflow: "hidden",
        }}
      >
        <div style={{ ...abs(0, 0, 176, 156), background: "#F3C6D1", borderRadius: 10, overflow: "hidden" }}>
          {/* Bleed crop: the shared photo extends far outside the 176×156 window */}
          <img
            src="/veloria/home/163-86.png"
            alt="Gold-dipped rose gift"
            width={546.1}
            height={911.9}
            style={{ ...abs(-25.4, -210.82, 546.1, 911.9), display: "block", objectFit: "cover", maxWidth: "none" }}
          />
        </div>
        <div
          className={playfair.className}
          style={{
            ...abs(12, 166, 152),
            fontSize: 16,
            lineHeight: "18px",
            fontWeight: 500,
            color: "#3B2F2F",
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          Gifts for Wife
        </div>
        <div
          className={goudy.className}
          style={{
            ...abs(27, 193, 122),
            fontSize: 8,
            lineHeight: "12px",
            color: "#3B2F2F",
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          For the one who means everything.
        </div>
        <img
          src="/veloria/home/436-283.svg"
          alt=""
          width={53.534}
          height={12.818}
          style={{ ...abs(61.2329, 214, 53.534, 12.818), display: "block" }}
        />
        <img
          src="/veloria/home/191-154.svg"
          alt="SHOP WIFE GIFTS →"
          width={152}
          height={13}
          style={{ ...abs(12, 235.82, 152, 13), display: "block", objectFit: "none", objectPosition: "center center" }}
        />
      </Link>

      {/* Recipient card 2 · Thoughtful Gifts She’ll Love (163:89) */}
      <Link
        href="/shop"
        style={{
          ...abs(201, 3897, 176, 257),
          display: "block",
          background: "#FFFBF6",
          borderRadius: 10,
          boxShadow: "inset 0 0 0 1px #E5D1B8",
          overflow: "hidden",
        }}
      >
        <div style={{ ...abs(0, 0, 176, 156), background: "#F3C6D1", borderRadius: 10, overflow: "hidden" }}>
          <img
            src="/veloria/home/163-86.png"
            alt="Gold-dipped rose gift"
            width={546.1}
            height={911.9}
            style={{ ...abs(-241.3, -210.82, 546.1, 911.9), display: "block", objectFit: "cover", maxWidth: "none" }}
          />
        </div>
        <div
          className={playfair.className}
          style={{
            ...abs(12, 161, 152),
            fontSize: 16,
            lineHeight: "18px",
            fontWeight: 500,
            color: "#3B2F2F",
            textAlign: "center",
            whiteSpace: "pre-line",
          }}
        >
          {"Thoughtful Gifts\nShe’ll Love"}
        </div>
        <div
          className={goudy.className}
          style={{
            ...abs(12, 202, 152),
            fontSize: 8,
            lineHeight: "12px",
            color: "#3B2F2F",
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          Romantic gifts to make her feel cherished.
        </div>
        <img
          src="/veloria/home/436-283.svg"
          alt=""
          width={53.534}
          height={12.818}
          style={{ ...abs(61.233, 219, 53.534, 12.818), display: "block" }}
        />
        <img
          src="/veloria/home/191-154.svg"
          alt="SHOP WIFE GIFTS →"
          width={152}
          height={13}
          style={{ ...abs(12, 236.82, 152, 13), display: "block", objectFit: "none", objectPosition: "center center" }}
        />
      </Link>

      {/* Recipient card 3 · Anniversary Gifts for Wife (163:94) — extends past
          x=430; the 430-wide stage clips it exactly as the Figma frame does */}
      <Link
        href="/shop"
        style={{
          ...abs(387, 3897, 176, 257),
          display: "block",
          background: "#FFFBF6",
          borderRadius: 10,
          boxShadow: "inset 0 0 0 1px #E5D1B8",
          overflow: "hidden",
        }}
      >
        <div style={{ ...abs(0, 0, 176, 156), background: "#F3C6D1", borderRadius: 10, overflow: "hidden" }}>
          <img
            src="/veloria/home/163-86.png"
            alt="Gold-dipped rose gift"
            width={546.1}
            height={911.9}
            style={{ ...abs(-457.2, -210.82, 546.1, 911.9), display: "block", objectFit: "cover", maxWidth: "none" }}
          />
        </div>
        <div
          className={playfair.className}
          style={{
            ...abs(12, 166, 152),
            fontSize: 16,
            lineHeight: "18px",
            fontWeight: 500,
            color: "#3B2F2F",
            textAlign: "center",
            whiteSpace: "pre-line",
          }}
        >
          {"Anniversary Gifts\nfor Wife"}
        </div>
        {/* Two-line natural wrap inside 148px (node is 24px tall at 12px lines) */}
        <div
          className={notoSC.className}
          style={{
            ...abs(14, 207, 148),
            fontSize: 9,
            lineHeight: "12px",
            fontWeight: 400,
            color: "#3B2F2F",
            textAlign: "center",
          }}
        >
          Celebrate your love with a timeless gift.
        </div>
        <img
          src="/veloria/home/436-283.svg"
          alt=""
          width={53.534}
          height={12.818}
          style={{ ...abs(61.233, 236, 53.534, 12.818), display: "block" }}
        />
        <img
          src="/veloria/home/191-154.svg"
          alt="SHOP WIFE GIFTS →"
          width={152}
          height={13}
          style={{ ...abs(12, 261, 152, 13), display: "block", objectFit: "none", objectPosition: "center center" }}
        />
      </Link>

      {/* Recipient carousel dots · five (440:149) */}
      <div style={{ ...abs(176, 4176, 80, 8), overflow: "hidden" }}>
        <div style={{ ...abs(0, 0, 8, 8), background: "#C46E29", borderRadius: 9999 }} />
        <div style={{ ...abs(19, 0.5, 7, 7), background: "#E0CCB2", borderRadius: 9999 }} />
        <div style={{ ...abs(37, 0.5, 7, 7), background: "#E0CCB2", borderRadius: 9999 }} />
        <div style={{ ...abs(55, 0.5, 7, 7), background: "#E0CCB2", borderRadius: 9999 }} />
        <div style={{ ...abs(73, 0.5, 7, 7), background: "#E0CCB2", borderRadius: 9999 }} />
      </div>

      {/* Just Because · recipient category card (192:150) */}
      <Link
        href="/shop"
        style={{
          ...abs(19, 4217, 394, 67),
          display: "block",
          background: "#FFFBF6",
          borderRadius: 11,
          boxShadow: "inset 0 0 0 1px #E5C9A8",
          overflow: "hidden",
        }}
      >
        {/* 192:151 "✦" note icon is HIDDEN in the design — not rendered */}
        <img
          src="/veloria/home/436-350.svg"
          alt=""
          width={32}
          height={32}
          style={{ ...abs(20, 16, 32, 32), display: "block" }}
        />
        <div
          className={playfair.className}
          style={{ ...abs(71, 16, 250), fontSize: 15, lineHeight: "18px", fontWeight: 500, color: "#3B2F2F", whiteSpace: "nowrap" }}
        >
          Just Because
        </div>
        <div
          className={notoSC.className}
          style={{ ...abs(71, 36, 280), fontSize: 9, lineHeight: "14px", fontWeight: 400, color: "#3B2F2F", whiteSpace: "nowrap" }}
        >
          Because meaningful moments don’t need a reason.
        </div>
        <img
          src="/veloria/home/192-154.svg"
          alt="›"
          width={12}
          height={43}
          style={{ ...abs(370, 6, 12, 43), display: "block", objectFit: "none", objectPosition: "left center" }}
        />
      </Link>

      {/* Reviews ornament + heading + subtitle (441:149, 163:104, 441:156) */}
      <img
        src="/veloria/home/436-337.svg"
        alt=""
        width={58.149}
        height={13.923}
        style={{ ...abs(187.926, 4306, 58.149, 13.923), display: "block" }}
      />
      <div
        className={playfair.className}
        style={{
          ...abs(26, 4327, 382),
          fontSize: 21,
          lineHeight: "27px",
          fontWeight: 500,
          color: "#3B2F2F",
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        Real Gifts, Real Moments
      </div>
      <div
        className={goudy.className}
        style={{
          ...abs(50, 4354, 330),
          fontSize: 9,
          lineHeight: "13px",
          color: "#3B2E2E",
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        Loved by thousands, given with meaning.
      </div>

      <ReviewsRail />

      {/* 442:165 · the design's fourth review dot — there is no fourth review,
          so it stays static art rather than pointing at a missing slide. */}
      <div style={{ ...abs(239, 4522.5, 7, 7), background: "#E0CCB2", borderRadius: 9999 }} />

      {/* Button · Read Customer Stories (163:111) — placeholder, not clickable */}
      <div style={{ ...abs(92, 4553, 246, 33), background: "#2E1C12", borderRadius: 7 }}>
        <div
          className={goudy.className}
          style={{
            ...abs(27, 6, 169),
            fontSize: 14,
            lineHeight: "20.83px",
            letterSpacing: 1.5,
            color: "#FFF6EC",
            whiteSpace: "nowrap",
          }}
        >
          Read Customer Stories
        </div>
        <img
          src="/veloria/home/I163-111_145-55.svg"
          alt="→"
          width={11}
          height={13}
          style={{ ...abs(208, 10, 11, 13), display: "block", objectFit: "none", objectPosition: "left center" }}
        />
      </div>
    </>
  );
}
