/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * B-3 "Business Partnerships" — pixel-exact import of VELORIA frame 1523:567
 * (07-29 restyle, 430×1907): brand hero, 120+ colorway swatches, the partner
 * grid, four "Why ELDREVE" advantage cards, the 4-step process with two CTAs
 * and — new in the 07-29 frames — the mascot bottom-nav band drawn in-frame.
 * Only "APPLY FOR WHOLESALE" (1523:661), the header back button and the nav
 * tabs are wired; "CONTACT BUSINESS TEAM" (1523:662) is a non-clickable
 * placeholder. Fragment only — the route supplies ScaleFrame (nav={false}).
 */

import Link from "next/link";
import { abs } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";

/* 1523:583…1523:594 — 12 colorway dots, 22×22 on a 32px pitch inside the
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

/* 1523:600…1523:618 — the six partner tiles, three per 398×88 row. `glyph`
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
    {
      x: 0,
      src: "1523-601",
      alt: "⌂",
      glyph: { x: 54, w: 18, h: 29 },
      label: "Boutiques",
    },
    {
      x: 136,
      src: "1523-604",
      alt: "▣",
      glyph: { x: 51, w: 24, h: 29 },
      label: "E-commerce",
    },
    {
      x: 272,
      src: "1523-607",
      alt: "✦",
      glyph: { x: 52.5, w: 21, h: 29 },
      label: "Creators",
    },
  ],
  [
    {
      x: 0,
      src: "1523-611",
      alt: "❀",
      glyph: { x: 51, w: 24, h: 29 },
      label: "Florists",
    },
    {
      x: 136,
      src: "1523-614",
      alt: "♔",
      glyph: { x: 51, w: 24, h: 29 },
      label: "Corporate Gifts",
    },
    {
      x: 272,
      src: "1523-617",
      alt: "⌘",
      glyph: { x: 51, w: 24, h: 29 },
      label: "Distributors",
    },
  ],
];

/* 1523:645…1523:660 — process steps, 93×112 tiles on a 101px pitch. */
const STEPS = [
  {
    x: 0,
    n: "01",
    title: "Share Needs",
    body: "Tell us your market and goals.",
  },
  {
    x: 101,
    n: "02",
    title: "Align",
    body: "Select products, colors and pricing.",
  },
  {
    x: 202,
    n: "03",
    title: "Confirm",
    body: "Approve quantities and delivery.",
  },
  { x: 303, n: "04", title: "Launch", body: "Quote, production and shipment." },
];

/* Both CTA arrows (I1523:661;1523:389 / I1523:662;1523:392) export
   byte-identical; one file serves both. */
const ARROW = "/veloria/screens/I1523-661_1523-389.svg";

/* 1523:664…1523:671 — nav tabs: mascot art (labels baked in, Wholesale ships
   its active state) on the shared 70-wide hit grid. Wholesale is drawn active
   because this page sits in that section, and it links on to the B-4
   application form (DQ-13(a), answered 2026-07-29). */
const NAV_TABS = [
  { x: 18, src: "1523-665", label: "Home", href: "/" },
  { x: 126, src: "1523-667", label: "Shop", href: "/shop" },
  { x: 234, src: "1523-669", label: "Wholesale", href: "/business/wholesale" },
  { x: 342, src: "1523-671", label: "Me", href: "/account" },
] as const;

/**
 * 1523:621 / 626 / 631 / 636 — one advantage card: a 154×100 photo on one
 * side and a 216×100 copy frame on the other. Card 4 sets its own title/body
 * metrics (smaller title, 42px title box, taller body leading).
 */
function Advantage({
  top,
  background,
  img,
  imgSide,
  title,
  titleTop = 23,
  titleSize = 17,
  titleLine = "22.7px",
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
      style={{
        ...abs(imgX, 8, 154, 100),
        display: "block",
        objectFit: "cover",
        borderRadius: 10,
      }}
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
      {/* copy frame (1523:623 / 627 / 633 / 637) — clips its two lines */}
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
      {/* ---------- 1523:569 · 01 / Brand Hero ---------- */}
      <div
        style={{
          ...abs(0, 0, 430, 460),
          background: "#FFF6EC",
          overflow: "hidden",
        }}
      >
        {/* 1523:570 Brand Navigation — clips, and the wordmark (1523:572) sits
            4.5px above the band's top edge, cropped by design. */}
        <div style={{ ...abs(16, 14, 398, 42), overflow: "hidden" }}>
          <img
            src="/veloria/screens/1523-571.png"
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
            src="/veloria/screens/1523-572.png"
            alt="ELDREVE"
            width={140}
            height={51}
            style={{
              ...abs(131, -4.5, 140, 51),
              display: "block",
              objectFit: "cover",
            }}
          />
        </div>
        {/* 1523:571 back button — transparent hit area over its art */}
        <Link
          href="/"
          aria-label="Back to home"
          style={{ ...abs(16, 14, 40, 42), display: "block" }}
        />

        {/* 1523:573 hero title */}
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
          {"Gifts Your Customers\nWill Always Remember"}
        </div>

        {/* 1523:574 hero body — wraps inside its 398px box */}
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
          Memorable gifting for boutiques, florists, luxury retail, e-commerce
          and regional distribution partners.
        </div>

        {/* 1523:575 hero photo — the Figma render bakes in the r=16 corners and
            the 0/6/16 drop shadow, so its box bleeds 16px each side and starts
            10px above the node (y 208 → 198); section 01 clips the tail. */}
        <img
          src="/veloria/screens/1523-575.png"
          alt="Pink velvet ELDREVE gift box beside a gold-dipped rose"
          width={430}
          height={270}
          style={{ ...abs(0, 198, 430, 270), display: "block" }}
        />
      </div>

      {/* ---------- 1523:576 · 02 / Colorways ---------- */}
      <div
        style={{
          ...abs(0, 460, 430, 188),
          background: "#FFF6EC",
          overflow: "hidden",
        }}
      >
        {/* 1523:577 heading row */}
        <div style={{ ...abs(16, 14, 398, 30), overflow: "hidden" }}>
          <img
            src="/veloria/screens/1523-578.svg"
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
              lineHeight: "28px",
              fontWeight: 500,
              color: "#09442E",
              whiteSpace: "nowrap",
            }}
          >
            120+ Curated Colorways
          </div>
          <img
            src="/veloria/screens/1523-580.svg"
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

        {/* 1523:581 colour list */}
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

        {/* 1523:582 swatch row */}
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

        {/* 1523:595 caption */}
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

      {/* ---------- 1523:596 · 03 / Partner Grid ---------- */}
      <div
        style={{
          ...abs(0, 648, 430, 300),
          background: "#FFF6EC",
          overflow: "hidden",
        }}
      >
        {/* 1523:597 heading */}
        <div
          className={playfair.className}
          style={{
            ...abs(16, 16, 398),
            fontSize: 23,
            lineHeight: "30.7px",
            fontWeight: 500,
            color: "#09442E",
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          Who We Partner With
        </div>
        {/* 1523:598 subheading */}
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

        {/* 1523:599 / 1523:609 partner rows (tiles are placeholders, not clickable) */}
        {PARTNER_ROWS.map((row, r) => (
          <div
            key={r}
            style={{ ...abs(16, 84 + r * 100, 398, 88), overflow: "hidden" }}
          >
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

      {/* ---------- 1523:619 · 04 / Why ELDREVE ---------- */}
      <div
        style={{
          ...abs(0, 948, 430, 560),
          background: "#FFF6EC",
          overflow: "hidden",
        }}
      >
        {/* 1523:620 heading */}
        <div
          className={playfair.className}
          style={{
            ...abs(16, 14, 398),
            fontSize: 24,
            lineHeight: "32px",
            fontWeight: 500,
            color: "#09442E",
            whiteSpace: "nowrap",
          }}
        >
          Why ELDREVE
        </div>

        <Advantage
          top={48}
          background="rgba(247, 218, 225, 0.66)"
          img={{
            src: "1523-622",
            alt: "Gold-dipped rose against a bokeh backdrop",
          }}
          imgSide="left"
          title="120+ Curated Colors"
          body="Built for campaigns, seasons and distinct markets."
        />
        <Advantage
          top={174}
          background="#FFFFFF"
          img={{
            src: "1523-630",
            alt: "Blue preserved rose with gold-trimmed petals",
          }}
          imgSide="right"
          title="Authentic Rose Craft"
          body="Real preserved roses finished by hand in precious metal."
        />
        <Advantage
          top={300}
          background="rgba(247, 218, 225, 0.66)"
          img={{
            src: "1523-632",
            alt: "Pink velvet ELDREVE gift box with a gold rose",
          }}
          imgSide="left"
          title="Premium Presentation"
          body="Gift-ready packaging designed for high-value retail."
        />
        <Advantage
          top={426}
          background="#FFFFFF"
          img={{
            src: "1523-640",
            alt: "Boxed red preserved rose with its authenticity certificate",
          }}
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

      {/* ---------- 1523:641 · 05 / Partnership Process + CTA ---------- */}
      <div
        style={{
          ...abs(0, 1508, 430, 340),
          background: "#FFF6EC",
          overflow: "hidden",
        }}
      >
        {/* 1523:642 heading */}
        <div
          className={playfair.className}
          style={{
            ...abs(16, 16, 398),
            fontSize: 24,
            lineHeight: "32px",
            fontWeight: 500,
            color: "#09442E",
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          How Partnership Works
        </div>
        {/* 1523:643 subheading */}
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

        {/* 1523:644 step row */}
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
                  lineHeight: "29.3px",
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

        {/* 1523:661 CTA · Apply for Wholesale */}
        <Link
          href="/business/wholesale"
          style={{
            ...abs(16, 212, 398, 48),
            display: "block",
            background: "#3B2F2F",
            borderRadius: 10,
          }}
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

        {/* 1523:662 CTA · Contact Business Team (placeholder, not clickable) */}
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

      {/* ---------- 1523:663 · 13 · Bottom Navigation ---------- */}
      {/* The 07-29 frame draws the nav band inside the business page (the
          route keeps the shared fixed BottomNav switched off). Tab art is the
          frames' own mascot images, Wholesale in its baked active state. */}
      <div
        style={{
          ...abs(0, 1848, 430, 59),
          background: "#FFFFFF",
          borderRadius: "15px 15px 0 0",
          boxShadow: "inset 0 0 0 1px #EEE6DD",
          overflow: "hidden",
        }}
      >
        {NAV_TABS.map((tab) => {
          const art = (
            <img
              src={`/veloria/screens/${tab.src}.png`}
              alt={tab.label}
              width={50}
              height={57}
              style={{ ...abs(10, 1, 50, 57), display: "block" }}
            />
          );
          const style: React.CSSProperties = {
            ...abs(tab.x, 0, 70, 59),
            display: "block",
          };
          // Every tab on this screen links out, so there is no inert fallback.
          return (
            <Link key={tab.label} href={tab.href} style={style}>
              {art}
            </Link>
          );
        })}
      </div>
    </>
  );
}
