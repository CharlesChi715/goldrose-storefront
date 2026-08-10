/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * Homepage module A-11 "A11 · Reference Rebuild" (Figma node 2380:727) of the
 * simplified homepage frame, [0,4005 430×1010]: the brand-story block with
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
 *
 * 2026-08-07 sync: the newsletter strip's email field is deleted at source and
 * the control now has two states — see components/home/NewsletterJoin.tsx.
 *
 * 2026-08-10 sync: the band moved 4124 → 4005 and the typography pass deferred
 * on 08-07 is applied — including the newsletter strip's own 19→20 / 10.5→13
 * and its reflow from 97px to 105px. The eight-line brand-story paragraph is
 * deleted at source, and the FAQ "＋" markers stopped being a glyph render and
 * became real text.
 */

import Link from "next/link";
import { abs } from "@/lib/figma-layout";
import { playfair, notoSC, goudy } from "@/lib/fonts";
import { HomePhoto } from "@/components/home/HomePhoto";
import { NewsletterJoin } from "@/components/home/NewsletterJoin";
import type { HomeFrames } from "@/lib/home-content/frames";
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
const FAQ_ROWS = [{ y: 88 }, { y: 127 }, { y: 166 }, { y: 205 }] as const;

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

export function A11({
  c,
  frames,
}: {
  c: HomeText["story"];
  frames?: HomeFrames;
}) {
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
    // 2380:727 module frame — children are positioned relative to (0, 4005).
    <div
      data-el="HOME-STORY-SECTION"
      style={{
        ...abs(0, 4005, 430, 1010),
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
        {/* 2380:768 story photo. The opening is its own box now, and clips:
            the design's file is exactly 204×259 so it never overflowed, but a
            framed replacement can be zoomed in and must be trimmed to fit. */}
        <div style={{ ...abs(226, 0, 204, 259), overflow: "hidden" }}>
          <HomePhoto
            section="story"
            field="story_photo"
            value={c.story_photo}
            alt={c.story_photo_alt}
            box={{ w: 204, h: 259 }}
            design={{ x: 0, y: 0, w: 204, h: 259 }}
            frames={frames}
          />
        </div>
        <div
          data-field="story.story_title"
          data-el="HOME-STORY-TITLE"
          className={playfair.className}
          style={{
            ...abs(26, 32, 195),
            fontSize: 32,
            lineHeight: "30px",
            color: INK,
            fontWeight: 500,
            whiteSpace: "pre-line",
          }}
        >
          {c.story_title}
        </div>
        {/* The eight-line story paragraph (2380:770) is deleted at source
            on 08-10; the title runs straight into the pull quote. */}
        <div
          data-field="story.story_quote"
          className={playfair.className}
          style={{
            ...abs(27, 173, 170),
            fontSize: 13,
            lineHeight: "15px",
            color: "#AD6152",
            fontWeight: 400,
            // Italic in the design — the only italic in A-11.
            fontStyle: "italic",
            whiteSpace: "pre-line",
          }}
        >
          {c.story_quote}
        </div>
        {/* 2380:772 CTA · Read Our Story → 2274:275 (/story) */}
        <Link
          data-field="story.story_cta_href"
          data-el="HOME-STORY-READ-BTN"
          href={c.story_cta_href}
          aria-label="Read our story"
          style={{
            ...abs(22, 227, 180, 28),
            background: CTA_GRADIENT,
            borderRadius: 6,
            overflow: "hidden",
            display: "block",
          }}
        >
          <div
            data-field="story.story_cta_label"
            className={goudy.className}
            style={{
              ...abs(10, 2, 139, 28),
              fontSize: 13,
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
            style={{ ...abs(158, 11.005, 13, 7), display: "block" }}
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
          data-field="story.faq_title"
          data-el="HOME-FAQ-TITLE"
          className={playfair.className}
          style={{
            ...abs(9, 33, 411, 32),
            fontSize: 32,
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
            data-field="story.faq_href"
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
              data-field={`story.faq_${i + 1}`}
              className={goudy.className}
              style={{
                ...abs(14, 0, 315, 28),
                fontSize: 13,
                lineHeight: "28px",
                color: INK,
                whiteSpace: "nowrap",
              }}
            >
              {faqs[i]}
            </div>
            {/* 08-10: the marker is a real text node in the frame now, at
                15px in the design's own gold — no longer a glyph render. */}
            <div
              className={notoSC.className}
              aria-hidden
              style={{
                ...abs(332, 0, 24, 28),
                fontSize: 15,
                lineHeight: "28px",
                color: "#C47829",
                textAlign: "center",
              }}
            >
              ＋
            </div>
          </Link>
        ))}
      </div>

      {/* 2380:796 VIEW ALL FAQs — rendered strip; no prototype target of its
          own, so it follows the FAQ rows to the concierge chat. */}
      <Link
        data-field="story.faq_href"
        data-el="HOME-FAQ-VIEW-ALL-LINK"
        href={c.faq_href}
        style={{ ...abs(131, 523, 190, 33), display: "block" }}
      >
        {/* Figma exports glyph strips at their INK bounds, not the node box —
            143×12 CSS here (286×24 at 2×). A 2× PNG must be sized explicitly
            and centred by hand; `object-fit: none` would draw it at its full
            intrinsic pixel size, twice too big (see A9.tsx). */}
        <img
          data-field="story.faq_view_all_label"
          src="/eldreve/home/2380-796.png"
          alt="VIEW ALL FAQs →"
          width={143}
          height={12}
          style={{ ...abs(23.5, 10.5, 143, 12), display: "block" }}
        />
      </Link>

      {/* 2380:775 · second story photo, beside the gift card. Clipped for the
          same reason as the one above. */}
      <div style={{ ...abs(19, 570, 204, 204), overflow: "hidden" }}>
        <HomePhoto
          section="story"
          field="gift_photo"
          value={c.gift_photo}
          alt={c.gift_photo_alt}
          box={{ w: 204, h: 204 }}
          design={{ x: 0, y: 0, w: 204, h: 204 }}
          frames={frames}
        />
      </div>

      {/* ---- 2380:807 · "Give Them a Rose" gift card ---- */}
      <div
        data-el="HOME-GIFT-CTA-CARD"
        style={{
          ...abs(242, 567, 174, 207),
          background: "#FFF6EC",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <div
          data-field="story.gift_title"
          data-el="HOME-GIFT-CTA-TITLE"
          className={playfair.className}
          style={{
            ...abs(11, 18, 181, 78),
            fontSize: 20,
            lineHeight: "27px",
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
          data-field="story.gift_body"
          data-el="HOME-GIFT-CTA-BODY-TEXT"
          className={notoSC.className}
          style={{
            ...abs(11, 115, 150, 50),
            fontSize: 13,
            lineHeight: "16px",
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
          data-field="story.gift_cta_href"
          data-el="HOME-GIFT-CTA-SHOP-BTN"
          href={c.gift_cta_href}
          style={{
            ...abs(11, 184, 145, 26),
            display: "block",
            background: BROWN,
            borderRadius: 5,
          }}
        >
          <div
            data-field="story.gift_cta_label"
            className={notoSC.className}
            style={{
              ...abs(27, 0, 92, 26),
              fontSize: 9.5,
              lineHeight: "26px",
              letterSpacing: -0.095,
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
      <div style={{ ...abs(25, 808, 391, 105) }}>
        <div
          data-field="story.newsletter_title"
          data-el="HOME-NEWSLETTER-TITLE"
          className={playfair.className}
          style={{
            ...abs(0, 0, 184, 52),
            fontSize: 20,
            lineHeight: "27px",
            color: BROWN,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
          }}
        >
          {c.newsletter_title}
        </div>
        <div
          data-field="story.newsletter_body"
          data-el="HOME-NEWSLETTER-BODY-TEXT"
          className={notoSC.className}
          style={{
            ...abs(0, 61, 184, 44),
            fontSize: 13,
            lineHeight: "16px",
            color: BROWN,
            fontWeight: 400,
            display: "flex",
            alignItems: "center",
            whiteSpace: "pre-line",
          }}
        >
          {c.newsletter_body}
        </div>

        {/* 2380:801 · the control, which the 08-07 delivery cut down to a
            single JOIN pill for signed-out visitors and swapped for the
            ACCOUNT-INFO welcome card (2974:359) for signed-in ones. The
            122×42 email box that used to sit left of the button is gone at
            source, so AI-025 — "the field collects nothing" — is now moot;
            there is simply no field. Both states live in a client island so
            this page stays statically rendered. */}
        <NewsletterJoin
          href={c.newsletter_href}
          buttonLabel={c.newsletter_button}
          welcomeText={c.newsletter_welcome_text}
          greeting={c.newsletter_welcome_greeting}
        />
      </div>

      {/* ---- 2380:849…2380:865 · footer link cloud ---- */}
      {FOOTER_LINKS.map((l, i) => (
        <Link
          key={l.x}
          data-el={`HOME-FOOTER-LINK-${i + 1}`}
          // TWO fields on one element, space separated: this box is both the
          // word you see and the place it goes, and a destination has no pixels
          // of its own to be picked by. Most-visible first.
          data-field={`story.footer_${i + 1}_label story.footer_${i + 1}_href`}
          href={footer[i].href}
          className={notoSC.className}
          style={{
            ...abs(l.x, l.y, l.w, l.h),
            fontSize: 9,
            lineHeight: "10px",
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
