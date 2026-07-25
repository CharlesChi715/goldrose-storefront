/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * B-4 · Wholesale Application — Figma frame 561:90 (430×1954): application
 * hero, three "Shape Your Partnership" direction cards, and the eight-field
 * wholesale enquiry form. Coordinates/colours are verbatim from the Figma REST
 * data. The eight text fields are real inputs, but there is no backend: the
 * SUBMIT CTA is a non-clickable placeholder and the channel/volume chips are
 * static (their selected states are the design's). The frame's own bottom nav
 * (758:149) is dropped — the route wraps this fragment in ScaleFrame + the
 * shared fixed BottomNav.
 */

import Link from "next/link";
import { abs } from "@/components/veloria";
import { notoSC, playfair } from "@/lib/fonts";

const A = "/veloria/screens";

/** HTML collapses the design's double spaces; nbsp + space keeps them. */
const NB = " ";

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

// Shared inset-input chrome (757:135 etc.): cream well, r=7, clipped.
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

// 757:114 / 757:119 / 757:124 — direction cards. Geometry is identical bar the
// side the 154×106 photo sits on; `top` is relative to the 02 section band.
const CARDS = [
  {
    top: 48,
    bg: "rgba(247, 218, 225, 0.62)", // #F7DAE1 at 62%
    img: "757-115",
    alt: "Blue preserved rose with gold-trimmed petals",
    imgX: 8,
    textX: 174,
    title: "Target Products",
    body: "Choose rose colors, finishes and packaging for your market.",
  },
  {
    top: 180,
    bg: "#FFF6EC",
    img: "757-120",
    alt: "Single 24K gold-dipped rose against bokeh lights",
    imgX: 236,
    textX: 8,
    title: "Estimated Volume",
    body: "Flexible starting quantities with tiered wholesale pricing.",
  },
  {
    top: 312,
    bg: "rgba(247, 218, 225, 0.62)",
    img: "757-125",
    alt: "Boxed red preserved rose with its authenticity certificate",
    imgX: 8,
    textX: 174,
    title: "Sales Regions",
    body: "Global support for retail, gifting and distribution growth.",
  },
] as const;

// 757:131 / 757:137 / 757:143 / 757:149 — Part A field rows (398×64). `top` is
// relative to the 03 section band; glyph boxes keep each TEXT node's own size.
const ROWS = [
  {
    top: 84,
    glyph: { src: "757-133", alt: "○", y: 21, w: 18, h: 22 },
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
    glyph: { src: "757-139", alt: "✉", y: 23, w: 18, h: 18 },
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
    glyph: { src: "757-145", alt: "⌕", y: 21, w: 12, h: 22 },
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
    glyph: { src: "757-151", alt: "▥", y: 21, w: 18, h: 22 },
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
type Chip = { x: number; w: number; dark: boolean; label: string; tx: number; tw: number };

// 758:110–758:119 — sales-channel chips. `dark` is the design's own selected
// state, kept static (nothing here is interactive).
const CHANNEL_CHIPS: Chip[] = [
  { x: 10, w: 70, dark: true, label: "Gift Shop", tx: 17, tw: 36 },
  { x: 85, w: 62, dark: false, label: "Florist", tx: 18.5, tw: 25 },
  { x: 152, w: 76, dark: true, label: "E-commerce", tx: 14, tw: 48 },
  { x: 233, w: 82, dark: false, label: "Luxury Retail", tx: 16, tw: 50 },
  { x: 320, w: 68, dark: false, label: "Distributor", tx: 13, tw: 42 },
];

// 758:123–758:132 — first-order-volume chips.
const VOLUME_CHIPS: Chip[] = [
  { x: 10, w: 60, dark: false, label: "10–49", tx: 18.5, tw: 23 },
  { x: 75, w: 64, dark: true, label: "50–199", tx: 18, tw: 28 },
  { x: 144, w: 70, dark: false, label: "200–499", tx: 19, tw: 32 },
  { x: 219, w: 58, dark: false, label: "500+", tx: 19.5, tw: 19 },
  { x: 282, w: 68, dark: false, label: "Not sure", tx: 17.5, tw: 33 },
];

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

      {/* ---- 756:148 · 01 / Application Hero ---- */}
      <div style={{ ...abs(0, 0, 430, 444), background: "#FFF6EC", overflow: "hidden" }}>
        {/* 757:107 brand header — one Figma render carrying ‹ and ❀ GOLDROSE */}
        <img
          src={`${A}/756-153.svg`}
          alt="GoldRose"
          width={398}
          height={44}
          style={{ ...abs(16, 14, 398, 44), display: "block" }}
        />
        {/* 757:108 ‹ — the back arrow's own box, overlaid on that render */}
        <Link href="/" aria-label="Back to home" style={{ ...abs(16, 18, 10, 36), display: "block" }} />

        {/* 757:110 title */}
        <div
          className={playfair.className}
          style={{
            ...abs(16, 68, 398),
            fontSize: 30,
            lineHeight: "34px",
            fontWeight: 600,
            color: "#09442E",
            whiteSpace: "pre-line",
          }}
        >
          {"Wholesale Partnership\nApplication"}
        </div>

        {/* 757:111 intro copy — wraps inside its 398px box */}
        <div
          className={notoSC.className}
          style={{
            ...abs(16, 154, 398),
            fontSize: 12,
            lineHeight: "18px",
            fontWeight: 400,
            color: "#3B2F2F",
          }}
        >
          Tell us about your business. Our team will review your goals and prepare a tailored
          proposal.
        </div>

        {/* 757:112 hero image */}
        <img
          src={`${A}/757-112.png`}
          alt="Blush velvet keepsake box beside a 24K gold-dipped rose"
          width={398}
          height={230}
          style={{ ...abs(16, 206, 398, 230), display: "block", objectFit: "cover", borderRadius: 16 }}
        />
      </div>

      {/* ---- 756:149 · 02 / Business Direction Cards ---- */}
      <div style={{ ...abs(0, 444, 430, 440), background: "#FFFFFF", overflow: "hidden" }}>
        {/* 757:113 section heading */}
        <div
          className={playfair.className}
          style={{
            ...abs(16, 14, 398),
            fontSize: 23,
            lineHeight: "30.66px",
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
                lineHeight: "23.99px",
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

      {/* ---- 756:150 · 03 / Application Form Part A ---- */}
      <div style={{ ...abs(0, 884, 430, 380), background: "#FFF6EC", overflow: "hidden" }}>
        {/* 757:129 heading */}
        <div
          className={playfair.className}
          style={{
            ...abs(16, 16, 398),
            fontSize: 24,
            lineHeight: "31.99px",
            fontWeight: 500,
            color: "#09442E",
            whiteSpace: "nowrap",
          }}
        >
          Your Business Details
        </div>
        {/* 757:130 sub-copy */}
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
          <div key={r.input.name} style={{ ...abs(16, r.top, 398, 64), ...FIELD_BOX }}>
            {/* 757:132 etc. label glyph — Figma crops glyph exports to the ink,
                so it is placed unstretched at the TEXT node's own box. */}
            <img
              src={`${A}/${r.glyph.src}.svg`}
              alt={r.glyph.alt}
              width={r.glyph.w}
              height={r.glyph.h}
              style={{
                ...abs(10, r.glyph.y, r.glyph.w, r.glyph.h),
                display: "block",
                objectFit: "none",
                objectPosition: "left center",
              }}
            />
            <div className={notoSC.className} style={{ ...abs(r.label.x, 20, 112), ...FIELD_LABEL }}>
              {r.label.text}
            </div>
            {/* 757:135 etc. input well */}
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

      {/* ---- 756:151 · 04 / Application Form Part B ---- */}
      <div style={{ ...abs(0, 1264, 430, 430), background: "#FFFFFF", overflow: "hidden" }}>
        {/* 758:107 Field 05 / Sales Channels */}
        <div style={{ ...abs(16, 12, 398, 94), ...FIELD_BOX }}>
          <div className={notoSC.className} style={{ ...abs(10, 10, 378), ...FIELD_LABEL }}>
            {`05${NB} Sales Channels${NB} ·${NB} Select all that apply`}
          </div>
          <ChipRow chips={CHANNEL_CHIPS} />
        </div>

        {/* 758:120 Field 06 / First Order Volume */}
        <div style={{ ...abs(16, 116, 398, 94), ...FIELD_BOX }}>
          <div className={notoSC.className} style={{ ...abs(10, 10, 378), ...FIELD_LABEL }}>
            {`06${NB} Estimated First Order Volume`}
          </div>
          <ChipRow chips={VOLUME_CHIPS} />
        </div>

        {/* 758:133 Field 07 / Target Regions */}
        <div style={{ ...abs(16, 220, 398, 70), ...FIELD_BOX }}>
          <div className={notoSC.className} style={{ ...abs(10, 10, 378), ...FIELD_LABEL }}>
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

        {/* 758:137 Field 08 / Additional Notes */}
        <div style={{ ...abs(16, 300, 398, 112), ...FIELD_BOX }}>
          <div className={notoSC.className} style={{ ...abs(10, 10, 378), ...FIELD_LABEL }}>
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

      {/* ---- 756:152 · 05 / Submit + Bottom Navigation ---- */}
      <div style={{ ...abs(0, 1694, 430, 260), background: "#FFF6EC", overflow: "hidden" }}>
        {/* 758:141 consent line — served as the frame's own render (♢ glyph) */}
        <img
          src={`${A}/758-141.svg`}
          alt="♢ By submitting, you agree that the GoldRose business team may contact you about this inquiry."
          width={398}
          height={24}
          style={{
            ...abs(16, 14, 398, 24),
            display: "block",
            objectFit: "none",
            objectPosition: "center center",
          }}
        />

        {/* 758:142 CTA · Submit Wholesale Application — non-submitting
            placeholder: there is no wholesale backend yet. */}
        <div style={{ ...abs(16, 46, 398, 50), background: "#3B2F2F", borderRadius: 10 }}>
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
            src={`${A}/I753-116_145-55.svg`}
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

        {/* 758:145 CTA · Return to Partnership Details */}
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
            src={`${A}/I753-116_145-55.svg`}
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

        {/* 758:148 response-time note */}
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
          GoldRose business specialists typically respond within 1–2 business days.
        </div>

        {/* 758:149 the frame's own bottom nav (⌂ / ♧ / ▣ / ○) is intentionally
            not rebuilt: the route supplies the shared fixed BottomNav. */}
      </div>
    </>
  );
}
