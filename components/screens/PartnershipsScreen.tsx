/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * B-3 "Business Partnerships" — pixel-exact import of VELORIA frame 561:89
 * (content frame 756:140): brand hero, 120+ colorway swatches, the partner
 * grid, four "Why GoldRose" advantage cards and the 4-step process with two
 * CTAs. Only "APPLY FOR WHOLESALE" (756:240) and the header back chevron are
 * wired; "CONTACT BUSINESS TEAM" (756:243) is a non-clickable placeholder.
 * Fragment only — the route supplies ScaleFrame and the bottom nav.
 */

import Link from "next/link";
import { abs } from "@/components/veloria";
import { notoSC, playfair } from "@/lib/fonts";

/* 756:165…756:176 — 12 colorway dots, 22×22 on a 32px pitch inside the
   398×52 swatch frame (all share the 1px inset gold ring). */
const SWATCHES = [
  "#AD0808",
  "#F58CAD",
  "#6B0F80",
  "#082E94",
  "#EDD6BA",
  "#DB910A",
  "#08858F",
  "#E5380A",
  "#0D0D0D",
  "#05752E",
  "#A385D6",
  "#EB4D57",
];

/* 756:181…756:198 — the six partner tiles, three per 398×88 row. `glyph`
   boxes are the TEXT nodes' own boxes, relative to the 126×88 tile. */
type Partner = {
  x: number;
  src: string;
  alt: string;
  glyph: { x: number; w: number; h: number };
  label: string;
};

const PARTNER_ROWS: readonly Partner[][] = [
  [
    { x: 0, src: "756-182", alt: "⌂", glyph: { x: 54, w: 18, h: 29 }, label: "Boutiques" },
    { x: 136, src: "756-185", alt: "▣", glyph: { x: 51, w: 24, h: 29 }, label: "E-commerce" },
    { x: 272, src: "756-188", alt: "✦", glyph: { x: 52.5, w: 21, h: 29 }, label: "Creators" },
  ],
  [
    { x: 0, src: "756-192", alt: "❀", glyph: { x: 51, w: 24, h: 29 }, label: "Florists" },
    { x: 136, src: "756-195", alt: "♔", glyph: { x: 51, w: 24, h: 29 }, label: "Corporate Gifts" },
    { x: 272, src: "756-198", alt: "⌘", glyph: { x: 51, w: 24, h: 29 }, label: "Distributors" },
  ],
];

/* 756:224…756:239 — process steps, 93×112 tiles on a 101px pitch. */
const STEPS = [
  { x: 0, n: "01", title: "Share Needs", body: "Tell us your market and goals." },
  { x: 101, n: "02", title: "Align", body: "Select products, colors and pricing." },
  { x: 202, n: "03", title: "Confirm", body: "Approve quantities and delivery." },
  { x: 303, n: "04", title: "Launch", body: "Quote, production and shipment." },
];

/* Both CTA arrows (I756:240;145:55 / I756:243;145:58) share one glyph render. */
const ARROW = "/veloria/screens/I753-116_145-55.svg";

/**
 * 756:201 / 756:206 / 756:211 / 756:216 — one advantage card: a 154×100 photo
 * on one side and a 216×100 copy frame on the other. Card 4 sets its own
 * title/body metrics (smaller title, 42px title box, taller body leading).
 */
function Advantage({
  top,
  background,
  img,
  imgSide,
  title,
  titleTop = 23,
  titleSize = 17,
  titleLine = "22.66px",
  titleHeight,
  body,
  bodyTop = 53,
  bodyLine = "12px",
  bodyHeight,
}: {
  top: number;
  background: string;
  img: { src: string; alt: string };
  imgSide: "left" | "right";
  title: string;
  titleTop?: number;
  titleSize?: number;
  titleLine?: string;
  titleHeight?: number;
  body: string;
  bodyTop?: number;
  bodyLine?: string;
  bodyHeight?: number;
}) {
  const imgX = imgSide === "left" ? 8 : 236;
  const copyX = imgSide === "left" ? 174 : 8;
  const photo = (
    <img
      src={`/veloria/screens/${img.src}.png`}
      alt={img.alt}
      width={154}
      height={100}
      style={{ ...abs(imgX, 8, 154, 100), display: "block", objectFit: "cover", borderRadius: 10 }}
    />
  );
  return (
    <div
      style={{
        ...abs(16, top, 398, 116),
        background,
        borderRadius: 14,
        boxShadow: "inset 0 0 0 1px #E5D9C9",
        overflow: "hidden",
      }}
    >
      {imgSide === "left" ? photo : null}
      {/* copy frame (756:203 / 208 / 213 / 218) — clips its two lines */}
      <div style={{ ...abs(copyX, 8, 216, 100), overflow: "hidden" }}>
        <div
          className={playfair.className}
          style={{
            ...abs(0, titleTop, 216, titleHeight),
            fontSize: titleSize,
            lineHeight: titleLine,
            fontWeight: 500,
            color: "#09442E",
          }}
        >
          {title}
        </div>
        <div
          className={notoSC.className}
          style={{
            ...abs(0, bodyTop, 216, bodyHeight),
            fontSize: 10,
            lineHeight: bodyLine,
            fontWeight: 400,
            color: "#3B2F2F",
          }}
        >
          {body}
        </div>
      </div>
      {imgSide === "right" ? photo : null}
    </div>
  );
}

export function PartnershipsScreen() {
  return (
    <>
      {/* 756:140 content frame — 1848 of the 1922px canvas; the 74px tail is
          the outer frame's own cream, left for the bottom nav. */}
      <div style={{ ...abs(0, 0, 430, 1848), background: "#FFF6EC" }} />

      {/* ---------- 756:141 · 01 / Brand Hero ---------- */}
      <div style={{ ...abs(0, 0, 430, 460), background: "#FFF6EC", overflow: "hidden" }}>
        {/* 756:153 header (back chevron + wordmark) served as one Figma render */}
        <img
          src="/veloria/screens/756-153.svg"
          alt="❀ GOLDROSE"
          width={398}
          height={44}
          style={{ ...abs(16, 14, 398, 44), display: "block" }}
        />
        {/* 756:154 back chevron — transparent hit area over the render */}
        <Link
          href="/"
          aria-label="Back to home"
          style={{ ...abs(16, 18, 10, 36), display: "block" }}
        />

        {/* 756:156 hero title */}
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
          {"Gifts Your Customers\nWill Always Remember"}
        </div>

        {/* 756:157 hero body — wraps inside its 398px box */}
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
          Memorable gifting for boutiques, florists, luxury retail, e-commerce and regional
          distribution partners.
        </div>

        {/* 756:158 hero photo — the Figma render bakes in the r=16 corners and
            the 0/6/16 drop shadow, so its box bleeds 16px each side and starts
            10px above the node (y 210 → 200); section 01 clips the last 10px. */}
        <img
          src="/veloria/screens/756-158.png"
          alt="Pink velvet GoldRose gift box beside a gold-dipped rose"
          width={430}
          height={270}
          style={{ ...abs(0, 200, 430, 270), display: "block" }}
        />
      </div>

      {/* ---------- 756:142 · 02 / Colorways ---------- */}
      <div style={{ ...abs(0, 460, 430, 188), background: "#FFFFFF", overflow: "hidden" }}>
        {/* 756:159 heading row */}
        <div style={{ ...abs(16, 14, 398, 30), overflow: "hidden" }}>
          <img
            src="/veloria/screens/756-160.svg"
            alt=""
            width={11}
            height={14}
            style={{
              ...abs(64.5, 0, 11, 14),
              display: "block",
              objectFit: "none",
              objectPosition: "left center",
            }}
          />
          <div
            className={playfair.className}
            style={{
              ...abs(83.5, 0, 231),
              fontSize: 21,
              lineHeight: "27.99px",
              fontWeight: 500,
              color: "#09442E",
              whiteSpace: "nowrap",
            }}
          >
            120+ Curated Colorways
          </div>
          <img
            src="/veloria/screens/756-160.svg"
            alt=""
            width={11}
            height={14}
            style={{
              ...abs(322.5, 0, 11, 14),
              display: "block",
              objectFit: "none",
              objectPosition: "left center",
            }}
          />
        </div>

        {/* 756:163 colour list */}
        <div
          className={notoSC.className}
          style={{
            ...abs(16, 52, 398),
            fontSize: 10,
            lineHeight: "12px",
            fontWeight: 400,
            color: "#3B2F2F",
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          Ruby · Blush · Violet · Sapphire · Ivory · Gold · Emerald and more
        </div>

        {/* 756:164 swatch row */}
        <div style={{ ...abs(16, 84, 398, 52), overflow: "hidden" }}>
          {SWATCHES.map((color, i) => (
            <div
              key={color + i}
              style={{
                ...abs(12 + i * 32, 15, 22, 22),
                background: color,
                borderRadius: 9999,
                boxShadow: "inset 0 0 0 1px #B86B1F",
              }}
            />
          ))}
        </div>

        {/* 756:177 caption */}
        <div
          className={notoSC.className}
          style={{
            ...abs(16, 144, 398),
            fontSize: 10,
            lineHeight: "12px",
            fontWeight: 500,
            color: "#B86B1F",
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          Curated for seasons, campaigns and every gifting occasion.
        </div>
      </div>

      {/* ---------- 756:143 · 03 / Partner Grid ---------- */}
      <div style={{ ...abs(0, 648, 430, 300), background: "#FFF6EC", overflow: "hidden" }}>
        {/* 756:178 heading */}
        <div
          className={playfair.className}
          style={{
            ...abs(16, 16, 398),
            fontSize: 23,
            lineHeight: "30.66px",
            fontWeight: 500,
            color: "#09442E",
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          Who We Partner With
        </div>
        {/* 756:179 subheading */}
        <div
          className={notoSC.className}
          style={{
            ...abs(16, 50, 398),
            fontSize: 11,
            lineHeight: "13.2px",
            fontWeight: 400,
            color: "#3B2F2F",
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          Flexible programs for retail, gifting and distribution.
        </div>

        {/* 756:180 / 756:190 partner rows (tiles are placeholders, not clickable) */}
        {PARTNER_ROWS.map((row, r) => (
          <div key={r} style={{ ...abs(16, 84 + r * 100, 398, 88), overflow: "hidden" }}>
            {row.map((p) => (
              <div
                key={p.label}
                style={{
                  ...abs(p.x, 0, 126, 88),
                  background: "#FFFFFF",
                  borderRadius: 12,
                  boxShadow: "inset 0 0 0 1px #E5D9C9",
                  overflow: "hidden",
                }}
              >
                <img
                  src={`/veloria/screens/${p.src}.svg`}
                  alt={p.alt}
                  width={p.glyph.w}
                  height={p.glyph.h}
                  style={{
                    ...abs(p.glyph.x, 16, p.glyph.w, p.glyph.h),
                    display: "block",
                    objectFit: "none",
                    objectPosition: "left center",
                  }}
                />
                <div
                  className={notoSC.className}
                  style={{
                    ...abs(7, 50, 112),
                    fontSize: 10,
                    lineHeight: "12px",
                    fontWeight: 500,
                    color: "#09442E",
                    textAlign: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.label}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ---------- 756:144 · 04 / Why GoldRose ---------- */}
      <div style={{ ...abs(0, 948, 430, 560), background: "#FFFFFF", overflow: "hidden" }}>
        {/* 756:200 heading */}
        <div
          className={playfair.className}
          style={{
            ...abs(16, 14, 398),
            fontSize: 24,
            lineHeight: "31.99px",
            fontWeight: 500,
            color: "#09442E",
            whiteSpace: "nowrap",
          }}
        >
          Why GoldRose
        </div>

        <Advantage
          top={48}
          background="rgba(247, 218, 225, 0.66)"
          img={{ src: "756-202", alt: "Gold-dipped rose against a bokeh backdrop" }}
          imgSide="left"
          title="120+ Curated Colors"
          body="Built for campaigns, seasons and distinct markets."
        />
        <Advantage
          top={174}
          background="#FFF6EC"
          img={{ src: "756-207", alt: "Preserved rose finished by hand in gold" }}
          imgSide="right"
          title="Authentic Rose Craft"
          body="Real preserved roses finished by hand in precious metal."
        />
        <Advantage
          top={300}
          background="rgba(247, 218, 225, 0.66)"
          img={{ src: "756-212", alt: "Pink velvet GoldRose gift box with a gold rose" }}
          imgSide="left"
          title="Premium Presentation"
          body="Gift-ready packaging designed for high-value retail."
        />
        <Advantage
          top={426}
          background="#FFF6EC"
          img={{ src: "756-217", alt: "GoldRose keepsake presentation" }}
          imgSide="right"
          title={"Patent & Copyright Protection"}
          titleTop={6}
          titleSize={16}
          titleLine="20px"
          titleHeight={42}
          body="A protected product story that gives partners confidence."
          bodyTop={54}
          bodyLine="15px"
          bodyHeight={40}
        />
      </div>

      {/* ---------- 756:145 · 05 / Partnership Process + CTA ---------- */}
      <div style={{ ...abs(0, 1508, 430, 340), background: "#FFF6EC", overflow: "hidden" }}>
        {/* 756:221 heading */}
        <div
          className={playfair.className}
          style={{
            ...abs(16, 16, 398),
            fontSize: 24,
            lineHeight: "31.99px",
            fontWeight: 500,
            color: "#09442E",
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          How Partnership Works
        </div>
        {/* 756:222 subheading */}
        <div
          className={notoSC.className}
          style={{
            ...abs(16, 52, 398),
            fontSize: 11,
            lineHeight: "13.2px",
            fontWeight: 400,
            color: "#3B2F2F",
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          A clear path from brief to delivery.
        </div>

        {/* 756:223 step row */}
        <div style={{ ...abs(16, 88, 398, 112), overflow: "hidden" }}>
          {STEPS.map((s) => (
            <div
              key={s.n}
              style={{
                ...abs(s.x, 0, 93, 112),
                background: "#FFFFFF",
                borderRadius: 10,
                boxShadow: "inset 0 0 0 1px #E5D9C9",
                overflow: "hidden",
              }}
            >
              <div
                className={playfair.className}
                style={{
                  ...abs(6, 8, 81),
                  fontSize: 22,
                  lineHeight: "29.33px",
                  fontWeight: 500,
                  color: "#B86B1F",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                {s.n}
              </div>
              <div
                className={notoSC.className}
                style={{
                  ...abs(6, 36, 81),
                  fontSize: 10,
                  lineHeight: "12px",
                  fontWeight: 500,
                  color: "#09442E",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                {s.title}
              </div>
              <div
                className={notoSC.className}
                style={{
                  ...abs(6, 64, 81),
                  fontSize: 8,
                  lineHeight: "9.6px",
                  fontWeight: 400,
                  color: "#3B2F2F",
                  textAlign: "center",
                }}
              >
                {s.body}
              </div>
            </div>
          ))}
        </div>

        {/* 756:240 CTA · Apply for Wholesale */}
        <Link
          href="/business/wholesale"
          style={{ ...abs(16, 212, 398, 48), display: "block", background: "#3B2F2F", borderRadius: 10 }}
        >
          <div
            className={notoSC.className}
            style={{
              ...abs(107.5, 17, 156),
              fontSize: 12,
              lineHeight: "14.4px",
              fontWeight: 500,
              letterSpacing: 1.1,
              color: "#FFF6EC",
              whiteSpace: "nowrap",
            }}
          >
            APPLY FOR WHOLESALE
          </div>
          <img
            src={ARROW}
            alt="→"
            width={15}
            height={18}
            style={{
              ...abs(275.5, 15, 15, 18),
              display: "block",
              objectFit: "none",
              objectPosition: "left center",
            }}
          />
        </Link>

        {/* 756:243 CTA · Contact Business Team (placeholder, not clickable) */}
        <div
          style={{
            ...abs(16, 272, 398, 44),
            background: "#FFF6EC",
            borderRadius: 10,
            boxShadow: "inset 0 0 0 1px #E5D9C9",
          }}
        >
          <div
            className={notoSC.className}
            style={{
              ...abs(99.5, 15, 172),
              fontSize: 12,
              lineHeight: "14.4px",
              fontWeight: 500,
              letterSpacing: 1.1,
              color: "#3B2F2F",
              whiteSpace: "nowrap",
            }}
          >
            CONTACT BUSINESS TEAM
          </div>
          <img
            src={ARROW}
            alt="→"
            width={15}
            height={18}
            style={{
              ...abs(283.5, 13, 15, 18),
              display: "block",
              objectFit: "none",
              objectPosition: "left center",
            }}
          />
        </div>
      </div>
    </>
  );
}
