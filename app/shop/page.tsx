/**
 * ROLE OF THIS FILE
 * The /shop page — a pixel-exact implementation of the "Home page" frame
 * (node 418:616) from the GoldRose Figma file (Open Fashion UI kit, customized).
 * Every coordinate, size, color, and font value below is taken verbatim from
 * the Figma REST API data, not eyeballed. The design canvas is 375 CSS px wide;
 * the whole page is absolutely positioned inside that canvas and centered on
 * wider screens. Photo assets in /public/shop are pre-cropped to the exact
 * on-screen device-pixel size (2x) so browsers don't resample them.
 */

import type { Metadata } from "next";
import { Tenor_Sans } from "next/font/google";

const tenor = Tenor_Sans({ weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Shop",
  description: "GoldRose apparel and gift catalogue.",
};

/* ---------- Design constants (Figma values) ---------- */

const INK = "#1B362B"; // deep green (brand)
const ACCENT = "#DD8560"; // warm copper accent
const GREY = "#555555";

/* ---------- Inline SVG icons (exported from Figma, format=svg) ---------- */

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M0.306763 12H15.9824" stroke="#14142B" />
    <path d="M0.306641 5H23.6931" stroke="#14142B" />
    <path d="M0.306641 19H23.6931" stroke="#14142B" />
  </svg>
);

const SearchIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M11 20C15.9706 20 20 15.9706 20 11C20 6.02944 15.9706 2 11 2C6.02944 2 2 6.02944 2 11C2 15.9706 6.02944 20 11 20Z"
      stroke="#14142B"
    />
    <path d="M22 21.9999L18.7823 18.7822" stroke="#14142B" />
  </svg>
);

const BagIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M20.6592 6.7207L21.4756 23.2803H3.49512L4.31152 6.7207H20.6592Z" stroke="#14142B" />
    <path
      d="M8.1604 10.1491L8.1604 5.55139C8.1604 4.40438 8.61605 3.30434 9.42711 2.49328C10.2382 1.68221 11.3382 1.22656 12.4852 1.22656C13.6322 1.22656 14.7323 1.68221 15.5433 2.49328C16.3544 3.30434 16.8101 4.40438 16.8101 5.55139V10.1491"
      stroke="#14142B"
    />
  </svg>
);

const DownIcon = () => (
  <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
    <g opacity="0.5">
      <path d="M8.49998 11.8148L4.81937 6.84264L12.1806 6.84265L8.49998 11.8148Z" fill={INK} />
    </g>
  </svg>
);

const ListviewIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <g opacity="0.5">
      <path d="M10.171 14.1667H16.6474" stroke="#14142B" />
      <path d="M10.1902 5.83334H16.6667" stroke="#14142B" />
      <rect x="2.17767" y="2.96255" width="5.66667" height="5.66667" stroke="#14142A" />
      <rect x="2.17767" y="11.3453" width="5.66667" height="5.66667" stroke="#14142A" />
    </g>
  </svg>
);

const FilterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2.5 6.25V7.08333H17.5V6.25H2.5ZM8.33333 13.75H11.6667V12.9167H8.33333V13.75ZM15 10.4167H5V9.58333H15V10.4167Z"
      fill={ACCENT}
    />
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 4.00002L12.5161 12.5161" stroke="#555555" strokeLinejoin="round" />
    <path d="M4 12.5163L12.5161 4.00015" stroke="#555555" strokeLinejoin="round" />
  </svg>
);

const HeartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M1.84812 2.51477C0.272874 4.09002 0.272875 6.64401 1.84813 8.21926L7.95802 14.3292L8.00002 14.2872L8.04206 14.3292L14.152 8.21931C15.7272 6.64406 15.7272 4.09007 14.152 2.51482C12.5767 0.939572 10.0227 0.939573 8.44747 2.51482L8.35362 2.60867C8.15836 2.80393 7.84178 2.80393 7.64651 2.60867L7.55261 2.51477C5.97736 0.939521 3.42337 0.939521 1.84812 2.51477Z"
      stroke={ACCENT}
    />
  </svg>
);

const StarIcon = () => (
  <svg width="13.513" height="13.513" viewBox="0 0 13 13" fill="none">
    <path
      d="M6.49999 0L8.27962 4.38505L13 4.72252L9.37949 7.7701L10.5172 12.3637L6.49999 9.86217L2.48278 12.3637L3.6205 7.7701L3.85867e-06 4.72252L4.72037 4.38505L6.49999 0Z"
      fill={ACCENT}
    />
  </svg>
);

const ForwardIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M9 5L15.9632 11.9632L9 18.9263" stroke="#14142B" />
  </svg>
);

const NavHomeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M20.04 6.82006L14.28 2.79006C12.71 1.69006 10.3 1.75006 8.78999 2.92006L3.77999 6.83006C2.77999 7.61006 1.98999 9.21006 1.98999 10.4701V17.3701C1.98999 19.9201 4.05999 22.0001 6.60999 22.0001H17.39C19.94 22.0001 22.01 19.9301 22.01 17.3801V10.6001C22.01 9.25006 21.14 7.59006 20.04 6.82006ZM12.75 18.0001C12.75 18.4101 12.41 18.7501 12 18.7501C11.59 18.7501 11.25 18.4101 11.25 18.0001V15.0001C11.25 14.5901 11.59 14.2501 12 14.2501C12.41 14.2501 12.75 14.5901 12.75 15.0001V18.0001Z"
      fill="#FDFDFD"
    />
  </svg>
);

const NavCartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M8.40002 6.5H15.6C19 6.5 19.34 8.09 19.57 10.03L20.47 17.53C20.76 19.99 20 22 16.5 22H7.51003C4.00003 22 3.24002 19.99 3.54002 17.53L4.44003 10.03C4.66003 8.09 5.00002 6.5 8.40002 6.5Z"
      stroke="#FDFDFD"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 8V4.5C8 3 9 2 10.5 2H13.5C15 2 16 3 16 4.5V8"
      stroke="#FDFDFD"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M20.41 17.03H8" stroke="#FDFDFD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const NavProfileIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M12.16 10.87C12.06 10.86 11.94 10.86 11.83 10.87C9.45 10.79 7.56 8.84 7.56 6.44C7.56 3.99 9.54 2 12 2C14.45 2 16.44 3.99 16.44 6.44C16.43 8.84 14.54 10.79 12.16 10.87Z"
      stroke="#FDFDFD"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.15997 14.56C4.73997 16.18 4.73997 18.82 7.15997 20.43C9.90997 22.27 14.42 22.27 17.17 20.43C19.59 18.81 19.59 16.17 17.17 14.56C14.43 12.73 9.91997 12.73 7.15997 14.56Z"
      stroke="#FDFDFD"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ---------- Shared style helpers ---------- */

const abs = (left: number, top: number, width?: number, height?: number): React.CSSProperties => ({
  position: "absolute",
  left,
  top,
  ...(width !== undefined ? { width } : {}),
  ...(height !== undefined ? { height } : {}),
});

const text = (size: number, lineHeight: number, color: string): React.CSSProperties => ({
  fontSize: size,
  lineHeight: `${lineHeight}px`,
  color,
  whiteSpace: "nowrap",
});

/* ---------- Product card ---------- */

type CardData = {
  x: number;
  y: number;
  img: string;
  showSubtitle: boolean;
  showRating: boolean;
  bg: string;
};

// Figma card instances, in frame order. Cards without subtitle/rating and the
// one #F9F9F9 card match the design exactly (they differ card-to-card).
const CARDS: CardData[] = [
  { x: 16, y: 347, img: "/shop/rose-red.png", showSubtitle: true, showRating: true, bg: "#FFFFFF" },
  { x: 194, y: 347, img: "/shop/rose-gold.png", showSubtitle: false, showRating: false, bg: "#FFFFFF" },
  { x: 16, y: 641, img: "/shop/gift-box.png", showSubtitle: true, showRating: true, bg: "#FFFFFF" },
  { x: 195, y: 641, img: "/shop/rose-white.png", showSubtitle: true, showRating: true, bg: "#FFFFFF" },
  { x: 16, y: 935, img: "/shop/rose-red.png", showSubtitle: true, showRating: true, bg: "#FFFFFF" },
  { x: 194, y: 935, img: "/shop/rose-gold.png", showSubtitle: false, showRating: false, bg: "#FFFFFF" },
  { x: 16, y: 1229, img: "/shop/gift-box.png", showSubtitle: true, showRating: true, bg: "#FFFFFF" },
  { x: 195, y: 1229, img: "/shop/rose-white.png", showSubtitle: true, showRating: true, bg: "#F9F9F9" },
];

function ProductCard({ card }: { card: CardData }) {
  return (
    <div
      style={{
        ...abs(card.x, card.y, 165, 285),
        background: card.bg,
        border: "1px solid #FDF2E4",
        borderRadius: 15,
      }}
    >
      <div style={{ ...abs(-1, -1, 165, 220), borderRadius: 15, background: "#FDF2E4", overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={card.img}
          alt="redrei reversible angora cardigan"
          width={165}
          height={220}
          style={{ display: "block", width: 165, height: 220, objectFit: "cover" }}
        />
      </div>
      <span style={abs(139, 197, 16, 16)}>
        <HeartIcon />
      </span>
      <div style={{ ...abs(3, 227), ...text(12, 18, "#000000") }}>redrei</div>
      {card.showSubtitle && (
        <div style={{ ...abs(3, 240), ...text(12, 18, GREY) }}>reversible angora cardigan</div>
      )}
      <div style={{ ...abs(3, 260), ...text(15, 24, ACCENT) }}>$120</div>
      {card.showRating && (
        <>
          <span style={{ ...abs(73, 265.24), display: "block", height: 13.513 }}>
            <StarIcon />
          </span>
          <div style={{ ...abs(89.51, 265), ...text(12, 14, GREY) }}>4.8 Ratings</div>
        </>
      )}
    </div>
  );
}

/* ---------- Page ---------- */

export default function ShopPage() {
  return (
    <div className={tenor.className} style={{ minHeight: "100vh", background: "#FCFCFC" }}>
      {/* Proportional scaling: the 375-wide canvas scales to the viewport width
          (capped at 480px so desktop shows a phone-sized column). The wrapper
          reserves the scaled layout height, since transform doesn't affect
          layout. Browsers too old for length-division calc simply keep the
          unscaled centered canvas. */}
      <style>{`
        html, body { overflow-x: hidden; }
        .figshop-navfix { position: fixed; left: 0; right: 0; bottom: 0; z-index: 10; pointer-events: none; }
        .figshop-navstage { position: relative; width: 375px; height: 66px; margin: 0 auto; pointer-events: auto; }
        @supports (transform: scale(calc(100vw / 375px))) {
          .figshop-wrap { height: calc(min(100vw, 480px) * 4.5066667); overflow: hidden; }
          .figshop-stage { transform: scale(calc(min(100vw, 480px) / 375px)); transform-origin: top center; }
          .figshop-navstage { transform: scale(calc(min(100vw, 480px) / 375px)); transform-origin: bottom center; }
        }
      `}</style>
      <div className="figshop-wrap">
        <div
          className="figshop-stage"
          style={{ position: "relative", width: 375, height: 1690, margin: "0 auto", overflow: "hidden" }}
        >
        {/* Promo banner (sits underneath the header bar, exactly as in Figma) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/shop/banner.png"
          alt="This week's pick: Sapphire Blue Forever Rose — limited offer, 15% off"
          width={372}
          height={172}
          style={{ ...abs(0, 60, 372, 172), objectFit: "cover" }}
        />

        {/* Header. The .5px positions come straight from Figma; Chrome rounds
            a half-pixel `left` UP when painting, Figma doesn't, so each child
            sits at the integer position with a 0.5px translate (rasterized
            sub-pixel, i.e. exactly 1 device px at 2x) instead. */}
        <header style={{ ...abs(3, 4, 369, 62), background: "#FCF8F4" }}>
          <span style={{ ...abs(6, 19, 24, 24), transform: "translateX(0.5px)" }}>
            <MenuIcon />
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/shop/back.png"
            alt="Back"
            width={24}
            height={24}
            style={{ ...abs(61, 19, 24, 24), transform: "translateX(0.5px)", objectFit: "cover" }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/shop/logo.png"
            alt="GoldRose"
            width={136}
            height={39}
            style={{ ...abs(116, 11, 136, 39), transform: "translate(0.5px, 0.5px)", objectFit: "cover" }}
          />
          <span style={{ ...abs(283, 19, 24, 24), transform: "translateX(0.5px)" }}>
            <SearchIcon />
          </span>
          <span style={{ ...abs(338, 19, 24, 24), transform: "translateX(0.5px)" }}>
            <BagIcon />
          </span>
        </header>

        {/* Filter bar: count, sort pill, view/filter buttons */}
        {/* +1.5px vs Figma node y: Chrome's baseline placement in the tight
            14.84px line box sits 1.5px above Figma's — verified by pixel diff */}
        <div style={{ ...abs(15.75, 256.89), ...text(14, 14.84, INK) }}>4500 APPAREL</div>
        <div
          style={{
            ...abs(197.25, 242.89, 72.75, 36),
            background: "rgba(196,196,196,0.10)",
            borderRadius: 33,
          }}
        />
        <div style={{ ...abs(212.78, 253.23), ...text(13, 13.78, GREY) }}>New</div>
        <span style={abs(244.68, 252.11, 17, 17)}>
          <DownIcon />
        </span>
        <div style={{ ...abs(278, 243.11, 36, 36), background: "rgba(196,196,196,0.10)", borderRadius: "50%" }} />
        <span style={abs(286, 251.11, 20, 20)}>
          <ListviewIcon />
        </span>
        <div style={{ ...abs(323, 243.11, 36, 36), background: "rgba(196,196,196,0.10)", borderRadius: "50%" }} />
        <span style={abs(331, 253.11, 20, 20)}>
          <FilterIcon />
        </span>

        {/* Active filter chips. Figma strokes are OUTSIDE-aligned on these
            pills (verified against the render pixel profile), so the 1px ring
            is a child div sitting 1px outside the chip box — a CSS border
            would sit inside it. */}
        {[
          { x: 17, w: 95, label: "Women", closeX: 69 },
          { x: 119, w: 116, label: "All apparel", closeX: 90 },
        ].map((chip) => (
          <div key={chip.label} style={abs(chip.x, 293, chip.w, 32)}>
            <div
              style={{
                ...abs(-1, -1, chip.w + 2, 34),
                border: "1px solid #DEDEDE",
                borderRadius: 31,
              }}
            />
            <div style={{ ...abs(10, 9), ...text(14, 16, INK), letterSpacing: 0.14 }}>{chip.label}</div>
            <span style={abs(chip.closeX, 8, 16, 16)}>
              <CloseIcon />
            </span>
          </div>
        ))}

        {/* Product grid */}
        {CARDS.map((card, i) => (
          <ProductCard key={i} card={card} />
        ))}

        {/* Pagination */}
        {[
          { x: 64, label: "1", active: true },
          { x: 108, label: "2", active: false },
          { x: 152, label: "3", active: false },
          { x: 196, label: "4", active: false },
          { x: 240, label: "5", active: false },
        ].map((p) => (
          <div
            key={p.label}
            style={{
              ...abs(p.x, 1553, 32, 32),
              background: p.active ? INK : "rgba(136,136,136,0.10)",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 4.76,
                width: "100%",
                textAlign: "center",
                ...text(16, 24, p.active ? "#FCFCFC" : GREY),
              }}
            >
              {p.label}
            </div>
          </div>
        ))}
        <span style={abs(281.05, 1557.09, 24, 24)}>
          <ForwardIcon />
        </span>

        </div>
      </div>

      {/* Bottom navigation — fixed to the viewport bottom like an app tab bar.
          It lives outside the scrolling stage because position:fixed cannot
          escape a transformed (scaled) ancestor; its own overlay re-applies
          the same scale, anchored bottom-center. The 6px gap below the pill
          matches the design's gap between the nav and the canvas bottom. */}
      <div className="figshop-navfix">
        <div className="figshop-navstage">
          <nav style={{ ...abs(6, 0, 363, 60), background: INK, borderRadius: 20 }}>
          <div style={{ ...abs(16, 10, 40, 40), background: "rgba(255,255,255,0.05)", borderRadius: "50%" }}>
            <span style={abs(8, 8, 24, 24)}>
              <NavHomeIcon />
            </span>
            <div style={{ ...abs(18, 34, 4, 4), background: "#FFFFFF", borderRadius: "50%" }} />
          </div>
          <div style={{ ...abs(113, 10, 40, 40), background: "rgba(255,255,255,0.05)", borderRadius: "50%" }}>
            <span style={abs(8, 8, 24, 24)}>
              <NavCartIcon />
            </span>
            <div style={{ ...abs(22, 12, 8, 8), background: "#F13658", borderRadius: 7.5 }} />
          </div>
          <div style={{ ...abs(210, 10, 40, 40), background: "rgba(255,255,255,0.05)", borderRadius: "50%" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/shop/fav-nav.png" alt="Favourites" width={26} height={24} style={{ ...abs(7, 8, 26, 24), objectFit: "cover" }} />
          </div>
          <div style={{ ...abs(307, 10, 40, 40), background: "rgba(255,255,255,0.05)", borderRadius: "50%" }}>
            <span style={abs(8, 8, 24, 24)}>
              <NavProfileIcon />
            </span>
          </div>
          </nav>
        </div>
      </div>

      {/* Fallback for browsers without calc() length division (pre-~2024
          engines, e.g. old Android WebViews / in-app browsers): apply the same
          scale via `zoom` (or transform where zoom is unsupported) so narrow
          screens never scroll sideways. No-op on modern browsers. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "(function(){try{" +
            "if(window.CSS&&CSS.supports&&CSS.supports('transform','scale(calc(100vw / 375px))'))return;" +
            "var z='zoom' in document.documentElement.style;" +
            "function fit(){var s=Math.min(window.innerWidth,480)/375;" +
            "var st=document.querySelector('.figshop-stage');" +
            "var nv=document.querySelector('.figshop-navstage');" +
            "var wr=document.querySelector('.figshop-wrap');if(!st)return;" +
            "if(z){st.style.zoom=s;if(nv)nv.style.zoom=s;}" +
            "else{st.style.transform='scale('+s+')';st.style.transformOrigin='top center';" +
            "if(nv){nv.style.transform='scale('+s+')';nv.style.transformOrigin='bottom center';}" +
            "if(wr){wr.style.height=1690*s+'px';wr.style.overflow='hidden';}}}" +
            "fit();window.addEventListener('resize',fit);" +
            "}catch(e){}})();",
        }}
      />
    </div>
  );
}
