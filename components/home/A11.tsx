/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * Homepage module A-11 "A11 · Reference Rebuild" (Figma node 2380:727) of the
 * simplified homepage frame, [0,4124 430×1010]: the brand-story block with
 * photo and "READ OUR STORY" CTA, four FAQ rows with "VIEW ALL FAQs", a
 * second story photo beside the "Give Them a Rose" gift card, the newsletter
 * sign-up strip, and the footer link cloud.
 *
 * 2026-08-04 sync: the band grew 714px → 1010px. The old "A11/03 Final Gift
 * CTA" block (value icons + three stacked buttons, two of which were inert
 * placeholders) was replaced at source by the gift card + newsletter +
 * footer-links layout below, and both hairline dividers were deleted. Every
 * footer link and both CTAs now carry a real prototype target.
 *
 * 2026-08-06: the legal identity line customers and platform reviewers need
 * is NOT in this band — it renders after the ScaleFrame, in
 * components/SiteLegalFooter.tsx, precisely so this fixed-height import stays
 * untouched by it. Nothing to do here.
 */

import Link from "next/link";
import { abs } from "@/lib/figma-layout";
import { playfair, notoSC, goudy } from "@/lib/fonts";
import type { HomeText } from "@/lib/home-content/registry";

const INK = "#291A13";
const BROWN = "#3B2F2F";
const CTA_GRADIENT = "linear-gradient(90deg, #261209 0%, #3D1F0E 100%)";

/* 2380:727 · solid cream plus the radial glow, whose handles resolve to a
   250 × 722.7 ellipse centred at (244.5, 701.3) on the 430×1010 band. */
const GLOW =
  "radial-gradient(250px 722.7px at 244.5px 701.3px, rgba(255,254,250,0.78) 0%, rgba(245,214,196,0) 100%), #FFF6EC";

/* 2380:784/787/790/793 — identical 368×28 pills on a 39px pitch, y relative
   to the A11/02 FAQ frame. Every row's prototype goes to the same place: the
   concierge chat (1537:111 → /care/chat), which is where an unanswered
   question actually gets answered. */
const FAQ_ROWS = [{ y: 85 }, { y: 124 }, { y: 163 }, { y: 202 }] as const;

/* 2380:849…2380:865 · the footer link cloud. The design lays these out as
   eight individually-placed, centre-aligned text boxes rather than a row —
   the leading/trailing spaces in the labels are load-bearing, because they
   shift the centred text inside its own box, so they are kept verbatim. */
const FOOTER_LINKS = [
  { x: 148, y: 926, w: 82, h: 20 },
  { x: 215, y: 928, w: 65, h: 16 },
  { x: 196, y: 938, w: 160, h: 39 },
  { x: 183, y: 950, w: 67, h: 16 },
  { x: 141, y: 953, w: 46, h: 11 },
  { x: 156, y: 966, w: 121, h: 29 },
  { x: 96, y: 972, w: 68, h: 17 },
  { x: 287, y: 977, w: 39, h: 4 },
] as const;

export function A11({ c }: { c: HomeText["story"] }) {
  const faqs = [c.faq_1, c.faq_2, c.faq_3, c.faq_4];
  const footer = [
    { label: c.footer_1_label, href: c.footer_1_href },
    { label: c.footer_2_label, href: c.footer_2_href },
    { label: c.footer_3_label, href: c.footer_3_href },
    { label: c.footer_4_label, href: c.footer_4_href },
    { label: c.footer_5_label, href: c.footer_5_href },
    { label: c.footer_6_label, href: c.footer_6_href },
    { label: c.footer_7_label, href: c.footer_7_href },
    { label: c.footer_8_label, href: c.footer_8_href },
  ];
  return (
    // 2380:727 module frame — children are positioned relative to (0, 4124).
    <div
      data-el="HOME-STORY-SECTION"
      style={{
        ...abs(0, 4124, 430, 1010),
        background: GLOW,
        overflow: "hidden",
      }}
    >
      {/* ---- 2380:763 A11/01 Brand Story ---- */}
      <div style={{ ...abs(0, 0, 430, 287), overflow: "hidden" }}>
        {/* 2380:764 rose divider */}
        <img
          src="/eldreve/home/506-89.svg"
          alt=""
          width={88}
          height={20}
          style={{ ...abs(57, 10, 88, 20), display: "block" }}
        />
        {/* 2380:768 story photo */}
        <img
          src="/eldreve/home/508-90.png"
          alt="Gold-preserved rose with ELDREVE gift packaging"
          width={204}
          height={259}
          style={{ ...abs(226, 0, 204, 259), display: "block" }}
        />
        <div
          data-el="HOME-STORY-TITLE"
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
          {c.story_title}
        </div>
        <div
          data-el="HOME-STORY-BODY-TEXT"
          className={goudy.className}
          style={{
            ...abs(26, 82, 176),
            fontSize: 8,
            lineHeight: "11.5px",
            color: INK,
            whiteSpace: "pre-line",
          }}
        >
          {c.story_body}
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
          {c.story_quote}
        </div>
        {/* 2380:772 CTA · Read Our Story → 2274:275 (/story) */}
        <Link
          data-el="HOME-STORY-READ-BTN"
          href={c.story_cta_href}
          aria-label="Read our story"
          style={{
            ...abs(22, 227, 138, 28),
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
            {c.story_cta_label}
          </div>
          <img
            src="/eldreve/home/506-98.svg"
            alt="→"
            width={13}
            height={7}
            style={{ ...abs(117.02, 11.005, 13, 7), display: "block" }}
          />
        </Link>
      </div>

      {/* ---- 2380:777 A11/02 FAQ ---- */}
      <div style={{ ...abs(0, 286, 430, 233), overflow: "hidden" }}>
        {/* 2380:778 rose divider */}
        <img
          src="/eldreve/home/507-87.svg"
          alt=""
          width={100}
          height={20}
          style={{ ...abs(168, 7, 100, 20), display: "block" }}
        />
        <div
          data-el="HOME-FAQ-TITLE"
          className={playfair.className}
          style={{
            ...abs(31, 42, 360, 32),
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
          {c.faq_title}
        </div>
        {/* FAQ rows — every row's prototype target is /care/chat */}
        {FAQ_ROWS.map(({ y }, i) => (
          <Link
            key={y}
            data-el={`HOME-FAQ-ROW-${i + 1}`}
            href={c.faq_href}
            style={{
              ...abs(31, y, 368, 28),
              display: "block",
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
              {faqs[i]}
            </div>
            <img
              src="/eldreve/home/507-100.svg"
              alt="＋"
              width={11}
              height={11}
              style={{ ...abs(338.6, 8.945, 11, 11), display: "block" }}
            />
          </Link>
        ))}
      </div>

      {/* 2380:796 VIEW ALL FAQs — rendered strip; no prototype target of its
          own, so it follows the FAQ rows to the concierge chat. */}
      <Link
        data-el="HOME-FAQ-VIEW-ALL-LINK"
        href={c.faq_href}
        style={{ ...abs(131, 519, 190, 33), display: "block" }}
      >
        {/* Figma exports glyph strips at their INK bounds (104×9), not the
            node box, so the strip is drawn at natural size and centred rather
            than stretched to 190×33. */}
        <img
          src="/eldreve/home/2380-796.svg"
          alt="VIEW ALL FAQs →"
          width={190}
          height={33}
          style={{
            display: "block",
            objectFit: "none",
            objectPosition: "center center",
          }}
        />
      </Link>

      {/* 2380:775 · second story photo, beside the gift card */}
      <img
        src="/eldreve/home/2380-775.png"
        alt="Gold-dipped rose in its keepsake box"
        width={204}
        height={204}
        style={{ ...abs(19, 570, 204, 204), display: "block" }}
      />

      {/* ---- 2380:807 · "Give Them a Rose" gift card ---- */}
      <div
        data-el="HOME-GIFT-CTA-CARD"
        style={{
          ...abs(239, 573, 174, 207),
          background: "#FFF6EC",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <div
          data-el="HOME-GIFT-CTA-TITLE"
          className={playfair.className}
          style={{
            ...abs(11, 18, 152, 78),
            fontSize: 18.5,
            lineHeight: "24.7px",
            color: BROWN,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            whiteSpace: "pre-line",
          }}
        >
          {c.gift_title}
        </div>
        <div
          data-el="HOME-GIFT-CTA-BODY-TEXT"
          className={notoSC.className}
          style={{
            ...abs(11, 102, 150, 50),
            fontSize: 9.5,
            lineHeight: "11.4px",
            color: BROWN,
            fontWeight: 400,
            display: "flex",
            alignItems: "center",
            whiteSpace: "pre-line",
          }}
        >
          {c.gift_body}
        </div>
        {/* 2380:810 → 1523:1526 (/shop) */}
        <Link
          data-el="HOME-GIFT-CTA-SHOP-BTN"
          href={c.gift_cta_href}
          style={{
            ...abs(11, 158, 145, 26),
            display: "block",
            background: BROWN,
            borderRadius: 5,
          }}
        >
          <div
            className={notoSC.className}
            style={{
              ...abs(29.5, 7.5, 86),
              fontSize: 9.5,
              lineHeight: "11.4px",
              color: "#FFF6EC",
              fontWeight: 400,
              textAlign: "center",
              whiteSpace: "nowrap",
            }}
          >
            {c.gift_cta_label}
          </div>
        </Link>
      </div>

      {/* ---- 2380:797 · newsletter strip ---- */}
      <div style={{ ...abs(25, 808, 391, 97) }}>
        <div
          data-el="HOME-NEWSLETTER-TITLE"
          className={playfair.className}
          style={{
            ...abs(0, 0, 184, 52),
            fontSize: 19,
            lineHeight: "25.3px",
            color: BROWN,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
          }}
        >
          {c.newsletter_title}
        </div>
        <div
          data-el="HOME-NEWSLETTER-BODY-TEXT"
          className={notoSC.className}
          style={{
            ...abs(0, 53, 184, 44),
            fontSize: 10.5,
            lineHeight: "12.6px",
            color: BROWN,
            fontWeight: 400,
            display: "flex",
            alignItems: "center",
            whiteSpace: "pre-line",
          }}
        >
          {c.newsletter_body}
        </div>

        {/* 2380:801 · the whole input+JOIN group is one prototype link to
            1523:3315 (/account/signup) — the design does not collect the
            address here, it hands off to the sign-up page. Rendered as a link
            rather than a live <input> for exactly that reason.
            AI-TAG(AI-025): AGENT-DECISION — no newsletter subscribe endpoint is
            wired; the field is display-only. See
            /agent-delivery/sessions/figma-sync-homepage-08-04-feat-figma-sync.md. */}
        <Link
          data-el="HOME-NEWSLETTER-JOIN-BTN"
          href={c.newsletter_href}
          aria-label="Join the ELDREVE mailing list"
          style={{ ...abs(200, 27.5, 184, 42), display: "block" }}
        >
          <div
            style={{
              ...abs(0, 0, 122, 42),
              background: "#FFF6EC",
              boxShadow: "inset 0 0 0 1px #E5D9C9",
              borderRadius: 4,
            }}
          >
            <div
              className={notoSC.className}
              style={{
                ...abs(30.5, 15.5, 63),
                fontSize: 9.5,
                lineHeight: "11.4px",
                color: BROWN,
                fontWeight: 400,
                whiteSpace: "nowrap",
              }}
            >
              {c.newsletter_placeholder}
            </div>
          </div>
          <div
            style={{
              ...abs(122, 0, 62, 42),
              background: "#D4AF37",
              borderRadius: 4,
            }}
          >
            <div
              className={notoSC.className}
              style={{
                ...abs(19, 15, 24),
                fontSize: 10,
                lineHeight: "12px",
                color: "#FFF6EC",
                fontWeight: 500,
                textAlign: "center",
                whiteSpace: "nowrap",
              }}
            >
              {c.newsletter_button}
            </div>
          </div>
        </Link>
      </div>

      {/* ---- 2380:849…2380:865 · footer link cloud ---- */}
      {FOOTER_LINKS.map((l, i) => (
        <Link
          key={l.x}
          data-el={`HOME-FOOTER-LINK-${i + 1}`}
          href={footer[i].href}
          className={notoSC.className}
          style={{
            ...abs(l.x, l.y, l.w, l.h),
            fontSize: 8.5,
            lineHeight: "10.2px",
            color: BROWN,
            fontWeight: 400,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            whiteSpace: "nowrap",
          }}
        >
          {footer[i].label}
        </Link>
      ))}
    </div>
  );
}
