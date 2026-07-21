/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * Shared chrome for the pages imported from the VELORIA Figma file
 * (file 3CXNpmuuyNyCW70qOci0oM): /shop (Frame 26) and /products/[slug]
 * (frame 详情页). Both frames share a 430px-wide canvas, promo bar, header,
 * and the white bottom tab bar. All coordinates/colors come verbatim from the
 * Figma REST API. The bottom nav is fixed to the viewport (per Charles's
 * request) with Home/Shop tabs wired to routes.
 */

import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { inter, notoSC } from "@/lib/fonts";

/* ---------- Style helpers ---------- */

// Absolute positioning at integer coordinates, with any fractional part
// applied via transform. Chrome rounds fractional left/top when painting
// (Figma doesn't); a translate() keeps true sub-pixel placement.
export const abs = (
  left: number,
  top: number,
  width?: number,
  height?: number,
): React.CSSProperties => {
  const li = Math.floor(left);
  const ti = Math.floor(top);
  const fx = Math.round((left - li) * 1000) / 1000;
  const fy = Math.round((top - ti) * 1000) / 1000;
  const s: React.CSSProperties = { position: "absolute", left: li, top: ti };
  if (fx || fy) s.transform = `translate(${fx}px, ${fy}px)`;
  if (width !== undefined) s.width = width;
  if (height !== undefined) s.height = height;
  return s;
};

export const txt = (
  size: number,
  lineHeight: number,
  color: string,
  align?: "center" | "right",
): React.CSSProperties => ({
  fontSize: size,
  lineHeight: `${lineHeight}px`,
  color,
  whiteSpace: "nowrap",
  ...(align ? { textAlign: align } : {}),
});

/* ---------- Inline SVG icons (Figma node renders, format=svg) ---------- */

export const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M0.306763 12H15.9824" stroke="#14142B" />
    <path d="M0.306641 5H23.6931" stroke="#14142B" />
    <path d="M0.306641 19H23.6931" stroke="#14142B" />
  </svg>
);

export const SearchIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M11 20C15.9706 20 20 15.9706 20 11C20 6.02944 15.9706 2 11 2C6.02944 2 2 6.02944 2 11C2 15.9706 6.02944 20 11 20Z"
      stroke="#14142B"
    />
    <path d="M22 21.9999L18.7823 18.7822" stroke="#14142B" />
  </svg>
);

export const BagIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M20.6592 6.7207L21.4756 23.2803H3.49512L4.31152 6.7207H20.6592Z" stroke="#14142B" />
    <path
      d="M8.1604 10.1491L8.1604 5.55139C8.1604 4.40438 8.61605 3.30434 9.42711 2.49328C10.2382 1.68221 11.3382 1.22656 12.4852 1.22656C13.6322 1.22656 14.7323 1.68221 15.5433 2.49328C16.3544 3.30434 16.8101 4.40438 16.8101 5.55139V10.1491"
      stroke="#14142B"
    />
  </svg>
);

// 24×24 heart node; the export canvas is 25×26 because the centred 1px
// stroke bleeds past the node bounds — place at (x-0.5, y-0.5).
export const HeartIcon = () => (
  <svg width="25" height="26" viewBox="0 0 25 26" fill="none">
    <path
      d="M2.43326 2.68181C-0.14442 5.59089 -0.144418 10.3074 2.43326 13.2165L12.4312 24.4999L12.5 24.4223L12.5688 24.5L22.5667 13.2166C25.1444 10.3075 25.1444 5.59098 22.5667 2.6819C19.9891 -0.227175 15.8098 -0.227173 13.2322 2.68191L12.8743 3.0858C12.6753 3.31034 12.3248 3.31034 12.1258 3.0858L11.7678 2.68181C9.19017 -0.22727 5.01093 -0.227269 2.43326 2.68181Z"
      stroke="#DD8560"
    />
  </svg>
);

export const ListviewIcon = () => (
  <svg width="26" height="24" viewBox="0 0 26 24" fill="none">
    <g opacity="0.5">
      <path d="M12.7699 17H20.9011" stroke="#14142B" strokeWidth="1.00221" />
      <path d="M12.794 6.99999H20.9252" stroke="#14142B" strokeWidth="1.00221" />
      <rect x="2.60633" y="3.45509" width="7.37011" height="7.00001" stroke="#14142A" />
      <rect x="2.60633" y="13.5144" width="7.37011" height="7.00001" stroke="#14142A" />
    </g>
  </svg>
);

export const DownIcon = () => (
  <svg width="21" height="20" viewBox="0 0 21 20" fill="none">
    <g opacity="0.5">
      <path d="M8.35172 11.6087L4.73531 6.72329L11.9681 6.72329L8.35172 11.6087Z" fill="#1B362B" />
    </g>
  </svg>
);

export const FilterIcon = () => (
  <svg width="26" height="24" viewBox="0 0 26 24" fill="none">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3.13876 7.5V8.5H21.9715V7.5H3.13876ZM10.4626 16.5H14.6477V15.5H10.4626V16.5ZM18.8327 12.5H6.27755V11.5H18.8327V12.5Z"
      fill="#DD8560"
    />
  </svg>
);

export const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 4.00002L12.5161 12.5161" stroke="#555555" strokeLinejoin="round" />
    <path d="M4 12.5163L12.5161 4.00015" stroke="#555555" strokeLinejoin="round" />
  </svg>
);

export const ForwardIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M9 5L15.9632 11.9632L9 18.9263" stroke="#14142B" />
  </svg>
);

/* ---------- Shared page sections ---------- */

/** 01 · Promo bar — dark green strip at the very top of both frames. */
export function PromoBar() {
  return (
    <>
      <div style={{ ...abs(0, 0, 430, 32), background: "#06372E" }} />
      <div
        className={inter.className}
        style={{ ...abs(39, 11, 352), ...txt(8.5, 10.287, "#E8C477", "center"), fontWeight: 500 }}
      >
        ✦ TIMELESS CRAFT · LOVE THAT NEVER FADES · 24K GOLD · FOREVER TREASURED ✦
      </div>
    </>
  );
}

/**
 * 02 · Header — menu, back arrow, logo, right-side icon (search on /shop,
 * heart on the product page), shopping bag.
 */
export function VHeader({ backHref, right }: { backHref: string; right: "search" | "heart" }) {
  return (
    <>
      <div style={{ ...abs(0, 32, 430, 62), background: "#FCF8F4" }} />
      <span style={abs(9, 51, 24, 24)}>
        <MenuIcon />
      </span>
      <BackButton fallback={backHref} style={abs(78, 51, 24, 24)} />
      <Link href="/" style={{ ...abs(147, 43.5, 136, 39), display: "block" }} aria-label="Home">
        <img src="/veloria/logo.png" alt="VELORIA" width={136} height={39} style={{ display: "block", width: 136, height: 39 }} />
      </Link>
      {right === "search" ? (
        <span style={abs(328, 51, 24, 24)}>
          <SearchIcon />
        </span>
      ) : (
        <span style={abs(327.5, 50.5, 25, 26)}>
          <HeartIcon />
        </span>
      )}
      <Link href="/checkout" style={{ ...abs(397, 51, 24, 24), display: "block" }} aria-label="Cart">
        <BagIcon />
      </Link>
    </>
  );
}

/* ---------- 13 · Bottom navigation (fixed overlay) ---------- */

type Tab = {
  href?: string;
  icon: string;
  iconX: number;
  iconW: number;
  label: string;
  labelX: number;
  labelW: number;
};

// Geometry from the Figma nav frame: tabs are 70×54 at x 18/126/234/342,
// sitting 2.5px above the nav frame top (clipped by it, as in Figma).
const TABS: Tab[] = [
  { href: "/", icon: "⌂", iconX: 27.5, iconW: 15, label: "Home", labelX: 19.5, labelW: 31 },
  { href: "/shop", icon: "◆", iconX: 25, iconW: 20, label: "Shop", labelX: 21, labelW: 28 },
  { icon: "□", iconX: 25, iconW: 20, label: "Business", labelX: 11.5, labelW: 47 },
  { icon: "○", iconX: 25, iconW: 20, label: "Account", labelX: 13, labelW: 44 },
];

function TabContent({ tab, isActive }: { tab: Tab; isActive: boolean }) {
  const color = isActive ? "#0A3B31" : "#66706B";
  return (
    <>
      <div
        className={notoSC.className}
        style={{ ...abs(tab.iconX, 7, tab.iconW, 24), ...txt(20, 24, color), fontWeight: 500 }}
      >
        {tab.icon}
      </div>
      <div
        className={inter.className}
        style={{
          ...abs(tab.labelX, 34, tab.labelW, 13),
          ...txt(11, 13.312, color),
          fontWeight: isActive ? 700 : 400,
        }}
      >
        {tab.label}
      </div>
    </>
  );
}

/**
 * Self-contained fixed bottom tab bar, usable on any page (it carries its own
 * scaling CSS + no-calc fallback, anchored bottom-center at /430 scale).
 * `active` highlights the current section's tab. `bottomGap` reserves N
 * transparent px below the nav — the shop canvas ends 1px below the nav frame
 * in the design, the detail canvas is flush.
 */
export function BottomNav({
  active = "shop",
  bottomGap = 0,
}: {
  active?: "Home" | "Shop" | (string & {});
  bottomGap?: number;
}) {
  return (
    <div className="figv-navfix">
      <style>{`
        .figv-navfix { position: fixed; left: 0; right: 0; bottom: 0; z-index: 10; pointer-events: none; }
        .figv-navstage { position: relative; width: 430px; margin: 0 auto; pointer-events: auto; }
        @supports (transform: scale(calc(100vw / 430px))) {
          .figv-navstage { transform: scale(calc(min(100vw, 480px) / 430px)); transform-origin: bottom center; }
        }
      `}</style>
      <div className="figv-navstage" style={{ height: 59 + bottomGap }}>
        <nav
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 430,
            height: 59,
            background: "#FFFFFF",
            borderRadius: "15px 15px 0 0",
            boxShadow: "inset 0 0 0 1px #EEE6DD",
            overflow: "hidden",
          }}
        >
          {TABS.map((tab, i) => {
            const x = [18, 126, 234, 342][i];
            const style: React.CSSProperties = { ...abs(x, -2.5, 70, 54), display: "block" };
            const content = <TabContent tab={tab} isActive={tab.label === active} />;
            return tab.href ? (
              <Link key={tab.label} href={tab.href} style={style}>
                {content}
              </Link>
            ) : (
              <div key={tab.label} style={style}>
                {content}
              </div>
            );
          })}
        </nav>
      </div>
      {/* No-calc fallback: scale the nav stage via zoom/transform. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "(function(){try{" +
            "if(window.CSS&&CSS.supports&&CSS.supports('transform','scale(calc(100vw / 430px))'))return;" +
            "var nv=document.querySelector('.figv-navstage');if(!nv)return;" +
            "function fit(){var s=Math.min(window.innerWidth,480)/430;" +
            "if('zoom' in nv.style){nv.style.zoom=s;}" +
            "else{nv.style.transform='scale('+s+')';nv.style.transformOrigin='bottom center';}}" +
            "fit();window.addEventListener('resize',fit);" +
            "}catch(e){}})();",
        }}
      />
    </div>
  );
}

/* ---------- Canvas scaffolding ---------- */

/**
 * Proportional scaling wrapper, same technique as the homepage: the 430-wide
 * canvas scales to the viewport width (capped at 480px). The bottom nav lives
 * in its own fixed overlay because position:fixed cannot escape a transformed
 * ancestor; the overlay re-applies the same scale anchored bottom-center.
 */
export function ScaleFrame({
  height,
  background,
  fontClass,
  navGap = 0,
  children,
}: {
  height: number;
  background: string;
  fontClass: string;
  navGap?: number;
  children: React.ReactNode;
}) {
  const ratio = (height / 430).toFixed(7);
  return (
    <div className={fontClass} style={{ minHeight: "100vh", background }}>
      <style>{`
        html, body { overflow-x: hidden; }
        @supports (transform: scale(calc(100vw / 430px))) {
          .figv-wrap { height: calc(min(100vw, 480px) * ${ratio}); overflow: hidden; }
          .figv-stage { transform: scale(calc(min(100vw, 480px) / 430px)); transform-origin: top center; }
        }
      `}</style>
      <div className="figv-wrap">
        <div
          className="figv-stage"
          style={{
            position: "relative",
            width: 430,
            height,
            margin: "0 auto",
            overflow: "hidden",
            background,
          }}
        >
          {children}
        </div>
      </div>
      <BottomNav bottomGap={navGap} />
      {/* Fallback for browsers without calc() length division: apply the same
          scale via `zoom`/transform so narrow screens never scroll sideways. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "(function(){try{" +
            "if(window.CSS&&CSS.supports&&CSS.supports('transform','scale(calc(100vw / 430px))'))return;" +
            "var z='zoom' in document.documentElement.style;" +
            "function fit(){var s=Math.min(window.innerWidth,480)/430;" +
            "var st=document.querySelector('.figv-stage');" +
            "var wr=document.querySelector('.figv-wrap');if(!st)return;" +
            "if(z){st.style.zoom=s;}" +
            "else{st.style.transform='scale('+s+')';st.style.transformOrigin='top center';" +
            `if(wr){wr.style.height=${height}*s+'px';wr.style.overflow='hidden';}}}` +
            "fit();window.addEventListener('resize',fit);" +
            "}catch(e){}})();",
        }}
      />
    </div>
  );
}
