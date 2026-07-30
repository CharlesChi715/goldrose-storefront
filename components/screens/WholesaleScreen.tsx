/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * B-4 · Wholesale Application — Figma frame 1523:672 (07-29 restyle,
 * 430×1954): application hero, three "Shape Your Partnership" direction
 * cards, the eight-field wholesale enquiry form and — new in the 07-29
 * frames — the mascot bottom-nav band drawn in-frame. Coordinates/colours are
 * verbatim from the Figma REST data. The eight text fields are real inputs,
 * but there is no backend: the SUBMIT CTA is a non-clickable placeholder and
 * the channel/volume chips are static (their selected states are the
 * design's). Fragment only — the route supplies ScaleFrame (nav={false}).
 */

import Link from "next/link";
import { abs } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";

const A = "/veloria/screens";

/** HTML collapses the design's double spaces; nbsp + space keeps them. */
const NB = " ";

// Shared field-box chrome: white card, 1px inside hairline, r=10.
const FIELD_BOX: React.CSSProperties = {
  background: "#FFFFFF",
  boxShadow: "inset 0 0 0 1px #E5D9C9",
  borderRadius: 10,
  overflow: "hidden",
};

// Shared label type for the numbered field captions (Noto Sans SC 500 10/12).
const FIELD_LABEL: React.CSSProperties = {
  fontSize: 10,
  lineHeight: "12px",
  fontWeight: 500,
  color: "#3B2F2F",
  whiteSpace: "nowrap",
};

// Shared inset-input chrome (1523:705 etc.): cream well, r=7, clipped.
const INPUT_WELL: React.CSSProperties = {
  background: "#FFF6EC",
  borderRadius: 7,
  overflow: "hidden",
};

// Typed text uses the design's ink; the empty state's #94857A lives on
// ::placeholder (see the scoped rule below).
const INPUT_TEXT: React.CSSProperties = {
  appearance: "none",
  border: 0,
  outline: "none",
  background: "transparent",
  padding: 0,
  fontSize: 10,
  lineHeight: "12px",
  fontWeight: 400,
  color: "#3B2F2F",
};

// 1523:683 / 1523:688 / 1523:693 — direction cards. Geometry is identical bar
// the side the 154×106 photo sits on; `top` is relative to the 02 section band.
const CARDS = [
  {
    top: 48,
    bg: "rgba(247, 218, 225, 0.62)", // #F7DAE1 at 62%
    img: "1523-684",
    alt: "Blue preserved rose with gold-trimmed petals",
    imgX: 8,
    textX: 174,
    title: "Target Products",
    body: "Choose rose colors, finishes and packaging for your market.",
  },
  {
    top: 180,
    bg: "#FFF6EC",
    img: "1523-692",
    alt: "Single 24K gold-dipped rose against bokeh lights",
    imgX: 236,
    textX: 8,
    title: "Estimated Volume",
    body: "Flexible starting quantities with tiered wholesale pricing.",
  },
  {
    top: 312,
    bg: "rgba(247, 218, 225, 0.62)",
    img: "1523-694",
    alt: "Boxed red preserved rose with its authenticity certificate",
    imgX: 8,
    textX: 174,
    title: "Sales Regions",
    body: "Global support for retail, gifting and distribution growth.",
  },
] as const;

// 1523:701 / 1523:707 / 1523:713 / 1523:719 — Part A field rows (398×64).
// `top` is relative to the 03 section band; glyph boxes keep each TEXT node's
// own size. 1523:709's ✉ is an emoji fallback whose SVG export is a solid
// box, so it ships as a frame-render PNG crop of the node box instead
// (raster: scale-to-fit, not the SVGs' ink-crop objectFit "none").
const ROWS = [
  {
    top: 84,
    glyph: {
      src: "1523-703.svg",
      alt: "○",
      y: 21,
      w: 18,
      h: 22,
      raster: false,
    },
    label: { x: 36, text: `01${NB} Contact Name` },
    input: {
      placeholder: "Your full name",
      type: "text",
      name: "contact-name",
      autoComplete: "name",
      aria: "Contact name",
    },
  },
  {
    top: 158,
    glyph: { src: "1523-709.png", alt: "✉", y: 23, w: 18, h: 18, raster: true },
    label: { x: 36, text: `02${NB} Work Email` },
    input: {
      placeholder: "name@company.com",
      type: "email",
      name: "work-email",
      autoComplete: "email",
      aria: "Work email",
    },
  },
  {
    top: 232,
    glyph: {
      src: "1523-715.svg",
      alt: "⌕",
      y: 21,
      w: 12,
      h: 22,
      raster: false,
    },
    label: { x: 30, text: `03${NB} Phone / WhatsApp` },
    input: {
      placeholder: "Country code + number",
      type: "tel",
      name: "phone",
      autoComplete: "tel",
      aria: "Phone or WhatsApp",
    },
  },
  {
    top: 306,
    glyph: {
      src: "1523-721.svg",
      alt: "▥",
      y: 21,
      w: 18,
      h: 22,
      raster: false,
    },
    label: { x: 36, text: `04${NB} Company / Store` },
    input: {
      placeholder: "Optional business name",
      type: "text",
      name: "company",
      autoComplete: "organization",
      aria: "Company or store",
    },
  },
] as const;

/** A selection chip: box x/w relative to the field row, text tx/tw to the chip. */
type Chip = {
  x: number;
  w: number;
  dark: boolean;
  label: string;
  tx: number;
  tw: number;
};

// 1523:729–1523:738 — sales-channel chips. `dark` is the design's own selected
// state, kept static (nothing here is interactive).
const CHANNEL_CHIPS: Chip[] = [
  { x: 10, w: 70, dark: true, label: "Gift Shop", tx: 17, tw: 36 },
  { x: 85, w: 62, dark: false, label: "Florist", tx: 18.5, tw: 25 },
  { x: 152, w: 76, dark: true, label: "E-commerce", tx: 14, tw: 48 },
  { x: 233, w: 82, dark: false, label: "Luxury Retail", tx: 16, tw: 50 },
  { x: 320, w: 68, dark: false, label: "Distributor", tx: 13, tw: 42 },
];

// 1523:742–1523:751 — first-order-volume chips.
const VOLUME_CHIPS: Chip[] = [
  { x: 10, w: 60, dark: false, label: "10–49", tx: 18.5, tw: 23 },
  { x: 75, w: 64, dark: true, label: "50–199", tx: 18, tw: 28 },
  { x: 144, w: 70, dark: false, label: "200–499", tx: 19, tw: 32 },
  { x: 219, w: 58, dark: false, label: "500+", tx: 19.5, tw: 19 },
  { x: 282, w: 68, dark: false, label: "Not sure", tx: 17.5, tw: 33 },
];

// Both CTA arrows (I1523:762;1523:389 / I1523:763;1523:392) export
// byte-identical; one file serves both.
const ARROW = `${A}/I1523-762_1523-389.svg`;

// 1523:766…1523:773 — this screen's own nav tabs are retired; the route renders
// the shared fixed BottomNav (2026-07-29). B-4's Wholesale active art (1523:771)
// lives on as the shared tab's activeImg — see TABS in components/chrome.tsx.

/** One static selection chip (r=16), positioned inside its field row. */
function ChipRow({ chips }: { chips: Chip[] }) {
  return (
    <>
      {chips.map((c) => (
        <div
          key={c.label}
          style={{
            ...abs(c.x, 42, c.w, 32),
            background: c.dark ? "#09442E" : "#FFFFFF",
            boxShadow: `inset 0 0 0 1px ${c.dark ? "#09442E" : "#E5D9C9"}`,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <div
            className={notoSC.className}
            style={{
              ...abs(c.tx, 11, c.tw),
              fontSize: 8,
              lineHeight: "9.6px",
              fontWeight: 500,
              color: c.dark ? "#FFFFFF" : "#3B2F2F",
              whiteSpace: "nowrap",
            }}
          >
            {c.label}
          </div>
        </div>
      ))}
    </>
  );
}

export function WholesaleScreen() {
  return (
    <>
      {/* The design paints every empty field in #94857A; ::placeholder cannot
          be set inline, so one scoped rule carries it. */}
      <style>{`.b4-field::placeholder { color: #94857A; opacity: 1; }`}</style>

      {/* ---- 1523:674 · 01 / Application Hero ---- */}
      <div
        style={{
          ...abs(0, 0, 430, 444),
          background: "#FFF6EC",
          overflow: "hidden",
        }}
      >
        {/* 1523:675 Brand Navigation — clips, and the wordmark (1523:677) sits
            4.5px above the band's top edge, cropped by design. */}
        <div style={{ ...abs(16, 14, 398, 42), overflow: "hidden" }}>
          <img
            src={`${A}/1523-676.png`}
            alt=""
            width={40}
            height={42}
            style={{
              ...abs(0, 0, 40, 42),
              display: "block",
              objectFit: "cover",
            }}
          />
          <img
            src={`${A}/1523-677.png`}
            alt="GoldRose"
            width={140}
            height={51}
            style={{
              ...abs(131, -4.5, 140, 51),
              display: "block",
              objectFit: "cover",
            }}
          />
        </div>
        {/* 1523:676 back button — transparent hit area over its art */}
        <Link
          href="/"
          aria-label="Back to home"
          style={{ ...abs(16, 14, 40, 42), display: "block" }}
        />

        {/* 1523:678 title */}
        <div
          className={playfair.className}
          style={{
            ...abs(16, 66, 398),
            fontSize: 30,
            lineHeight: "34px",
            fontWeight: 600,
            color: "#09442E",
            whiteSpace: "pre-line",
          }}
        >
          {"Wholesale Partnership\nApplication"}
        </div>

        {/* 1523:679 intro copy — wraps inside its 398px box */}
        <div
          className={notoSC.className}
          style={{
            ...abs(16, 152, 398),
            fontSize: 12,
            lineHeight: "18px",
            fontWeight: 400,
            color: "#3B2F2F",
          }}
        >
          Tell us about your business. Our team will review your goals and
          prepare a tailored proposal.
        </div>

        {/* 1523:680 hero image */}
        <img
          src={`${A}/1523-680.png`}
          alt="Pink velvet GoldRose gift box beside a gold-dipped rose"
          width={398}
          height={230}
          style={{
            ...abs(16, 204, 398, 230),
            display: "block",
            objectFit: "cover",
            borderRadius: 16,
          }}
        />
      </div>

      {/* ---- 1523:681 · 02 / Business Direction Cards ---- */}
      <div
        style={{
          ...abs(0, 444, 430, 440),
          background: "#FFFFFF",
          overflow: "hidden",
        }}
      >
        {/* 1523:682 section heading */}
        <div
          className={playfair.className}
          style={{
            ...abs(16, 14, 398),
            fontSize: 23,
            lineHeight: "30.7px",
            fontWeight: 500,
            color: "#09442E",
            whiteSpace: "nowrap",
          }}
        >
          Shape Your Partnership
        </div>

        {CARDS.map((c) => (
          <div
            key={c.title}
            style={{
              ...abs(16, c.top, 398, 122),
              background: c.bg,
              boxShadow: "inset 0 0 0 1px #E5D9C9",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <img
              src={`${A}/${c.img}.png`}
              alt={c.alt}
              width={154}
              height={106}
              style={{
                ...abs(c.imgX, 8, 154, 106),
                display: "block",
                objectFit: "cover",
                borderRadius: 10,
              }}
            />
            <div
              className={playfair.className}
              style={{
                ...abs(c.textX, 33, 216),
                fontSize: 18,
                lineHeight: "24px",
                fontWeight: 500,
                color: "#09442E",
                whiteSpace: "nowrap",
              }}
            >
              {c.title}
            </div>
            <div
              className={notoSC.className}
              style={{
                ...abs(c.textX, 65, 216),
                fontSize: 10,
                lineHeight: "12px",
                fontWeight: 400,
                color: "#3B2F2F",
              }}
            >
              {c.body}
            </div>
          </div>
        ))}
      </div>

      {/* ---- 1523:698 · 03 / Application Form Part A ---- */}
      <div
        style={{
          ...abs(0, 884, 430, 380),
          background: "#FFF6EC",
          overflow: "hidden",
        }}
      >
        {/* 1523:699 heading */}
        <div
          className={playfair.className}
          style={{
            ...abs(16, 16, 398),
            fontSize: 24,
            lineHeight: "32px",
            fontWeight: 500,
            color: "#09442E",
            whiteSpace: "nowrap",
          }}
        >
          Your Business Details
        </div>
        {/* 1523:700 sub-copy */}
        <div
          className={notoSC.className}
          style={{
            ...abs(16, 50, 398),
            fontSize: 11,
            lineHeight: "13.2px",
            fontWeight: 400,
            color: "#3B2F2F",
            whiteSpace: "nowrap",
          }}
        >
          Start with the best contact for your wholesale inquiry.
        </div>

        {ROWS.map((r) => (
          <div
            key={r.input.name}
            style={{ ...abs(16, r.top, 398, 64), ...FIELD_BOX }}
          >
            {/* 1523:703 etc. label glyph — Figma crops glyph exports to the
                ink, so SVGs sit unstretched at the TEXT node's own box; the ✉
                render crop is the node box itself and scales to fit. */}
            <img
              src={`${A}/${r.glyph.src}`}
              alt={r.glyph.alt}
              width={r.glyph.w}
              height={r.glyph.h}
              style={{
                ...abs(10, r.glyph.y, r.glyph.w, r.glyph.h),
                display: "block",
                objectFit: r.glyph.raster ? "cover" : "none",
                objectPosition: "left center",
              }}
            />
            <div
              className={notoSC.className}
              style={{ ...abs(r.label.x, 20, 112), ...FIELD_LABEL }}
            >
              {r.label.text}
            </div>
            {/* 1523:705 etc. input well */}
            <div style={{ ...abs(162, 11, 226, 42), ...INPUT_WELL }}>
              <input
                className={`${notoSC.className} b4-field`}
                type={r.input.type}
                name={r.input.name}
                autoComplete={r.input.autoComplete}
                placeholder={r.input.placeholder}
                aria-label={r.input.aria}
                style={{ ...abs(10, 9, 206, 24), ...INPUT_TEXT }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ---- 1523:725 · 04 / Application Form Part B ---- */}
      <div
        style={{
          ...abs(0, 1264, 430, 430),
          background: "#FFFFFF",
          overflow: "hidden",
        }}
      >
        {/* 1523:726 Field 05 / Sales Channels */}
        <div style={{ ...abs(16, 12, 398, 94), ...FIELD_BOX }}>
          <div
            className={notoSC.className}
            style={{ ...abs(10, 10, 378), ...FIELD_LABEL }}
          >
            {`05${NB} Sales Channels${NB} ·${NB} Select all that apply`}
          </div>
          <ChipRow chips={CHANNEL_CHIPS} />
        </div>

        {/* 1523:739 Field 06 / First Order Volume */}
        <div style={{ ...abs(16, 116, 398, 94), ...FIELD_BOX }}>
          <div
            className={notoSC.className}
            style={{ ...abs(10, 10, 378), ...FIELD_LABEL }}
          >
            {`06${NB} Estimated First Order Volume`}
          </div>
          <ChipRow chips={VOLUME_CHIPS} />
        </div>

        {/* 1523:752 Field 07 / Target Regions */}
        <div style={{ ...abs(16, 220, 398, 70), ...FIELD_BOX }}>
          <div
            className={notoSC.className}
            style={{ ...abs(10, 10, 378), ...FIELD_LABEL }}
          >
            {`07${NB} Target Sales Regions`}
          </div>
          <div style={{ ...abs(10, 42, 378, 34), ...INPUT_WELL }}>
            <input
              className={`${notoSC.className} b4-field`}
              type="text"
              name="target-regions"
              placeholder="Countries, regions or territories"
              aria-label="Target sales regions"
              style={{ ...abs(10, 5, 358, 24), ...INPUT_TEXT }}
            />
          </div>
        </div>

        {/* 1523:756 Field 08 / Additional Notes */}
        <div style={{ ...abs(16, 300, 398, 112), ...FIELD_BOX }}>
          <div
            className={notoSC.className}
            style={{ ...abs(10, 10, 378), ...FIELD_LABEL }}
          >
            {`08${NB} Additional Notes`}
          </div>
          <div style={{ ...abs(10, 42, 378, 64), ...INPUT_WELL }}>
            {/* The design's placeholder is a 358×24 (two-line) text node; the
                textarea keeps its origin and fills the well's remaining
                height (64 − 9 top − 9 bottom) so typing has room. */}
            <textarea
              className={`${notoSC.className} b4-field`}
              name="notes"
              rows={4}
              placeholder="Share product preferences, colors, campaign timing or other partnership needs."
              aria-label="Additional notes"
              style={{ ...abs(10, 9, 358, 46), ...INPUT_TEXT, resize: "none" }}
            />
          </div>
        </div>
      </div>

      {/* ---- 1523:760 · 05 / Submit + Bottom Navigation ---- */}
      <div
        style={{
          ...abs(0, 1694, 430, 202),
          background: "#FFF6EC",
          overflow: "hidden",
        }}
      >
        {/* 1523:761 consent line — a real TEXT node in the 07-29 frame (the old
            baked SVG is gone); wraps to two centred lines in its 398×24 box.
            The ♢ keeps the design's double space after it. */}
        <div
          className={notoSC.className}
          style={{
            ...abs(16, 14, 398, 24),
            fontSize: 9,
            lineHeight: "10.8px",
            fontWeight: 400,
            color: "#3B2F2F",
            textAlign: "center",
          }}
        >
          {`♢${NB} By submitting, you agree that the GoldRose business team may contact you about this inquiry.`}
        </div>

        {/* 1523:762 CTA · Submit Wholesale Application — non-submitting
            placeholder: there is no wholesale backend yet. */}
        <div
          style={{
            ...abs(16, 46, 398, 50),
            background: "#3B2F2F",
            borderRadius: 10,
          }}
        >
          <div
            className={notoSC.className}
            style={{
              ...abs(71, 18, 229),
              fontSize: 12,
              lineHeight: "14.4px",
              fontWeight: 500,
              letterSpacing: 1.1,
              color: "#FFF6EC",
              whiteSpace: "nowrap",
            }}
          >
            SUBMIT WHOLESALE APPLICATION
          </div>
          <img
            src={ARROW}
            alt="→"
            width={15}
            height={18}
            style={{
              ...abs(312, 16, 15, 18),
              display: "block",
              objectFit: "none",
              objectPosition: "left center",
            }}
          />
        </div>

        {/* 1523:763 CTA · Return to Partnership Details */}
        <Link
          href="/business/partnerships"
          style={{
            ...abs(16, 104, 398, 42),
            display: "block",
            background: "#FFF6EC",
            boxShadow: "inset 0 0 0 1px #E5D9C9",
            borderRadius: 10,
          }}
        >
          <div
            className={notoSC.className}
            style={{
              ...abs(70, 14, 231),
              fontSize: 12,
              lineHeight: "14.4px",
              fontWeight: 500,
              letterSpacing: 1.1,
              color: "#3B2F2F",
              whiteSpace: "nowrap",
            }}
          >
            RETURN TO PARTNERSHIP DETAILS
          </div>
          <img
            src={ARROW}
            alt="→"
            width={15}
            height={18}
            style={{
              ...abs(313, 12, 15, 18),
              display: "block",
              objectFit: "none",
              objectPosition: "left center",
            }}
          />
        </Link>

        {/* 1523:764 response-time note */}
        <div
          className={notoSC.className}
          style={{
            ...abs(16, 154, 398),
            fontSize: 9,
            lineHeight: "10.8px",
            fontWeight: 500,
            color: "#09442E",
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          GoldRose business specialists typically respond within 1–2 business
          days.
        </div>
      </div>

      {/* ---- 1523:765 · 13 · Bottom Navigation ---- */}
      {/* The 07-29 frame drew this band inside the page, so it scrolled away
          with the canvas. The route now renders the shared fixed BottomNav
          instead (2026-07-29), matching every other main page. The frame's
          1954 height is unchanged: the band's old 58px is left empty so the
          fixed bar floats over background, not over the response-time note. */}
    </>
  );
}
