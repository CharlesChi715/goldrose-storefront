/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * Shared chrome for the pages imported from the VELORIA Figma file
 * (file 3CXNpmuuyNyCW70qOci0oM): / (homepage redesign), /shop and
 * /products/[slug] (frame 详情页). All frames share a 430px-wide canvas,
 * promo bar, header, and the white bottom tab bar. All coordinates/colors
 * come verbatim from the Figma REST API. The bottom nav is fixed to the
 * viewport (per Charles's request) with Home/Shop tabs wired to routes.
 */

import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { WishlistButton } from "@/components/WishlistButton";
import { inter } from "@/lib/fonts";
import NoCalcScale from "@/components/NoCalcScale";

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

export const ListviewIcon = ({ color = "#14142B" }: { color?: string } = {}) => (
  <svg width="26" height="24" viewBox="0 0 26 24" fill="none">
    <g opacity="0.5">
      <path d="M12.7699 17H20.9011" stroke={color} strokeWidth="1.00221" />
      <path d="M12.794 6.99999H20.9252" stroke={color} strokeWidth="1.00221" />
      <rect x="2.60633" y="3.45509" width="7.37011" height="7.00001" stroke={color} />
      <rect x="2.60633" y="13.5144" width="7.37011" height="7.00001" stroke={color} />
    </g>
  </svg>
);

export const DownIcon = ({ color = "#1B362B" }: { color?: string } = {}) => (
  <svg width="21" height="20" viewBox="0 0 21 20" fill="none">
    <g opacity="0.5">
      <path d="M8.35172 11.6087L4.73531 6.72329L11.9681 6.72329L8.35172 11.6087Z" fill={color} />
    </g>
  </svg>
);

export const FilterIcon = ({ color = "#DD8560" }: { color?: string } = {}) => (
  <svg width="26" height="24" viewBox="0 0 26 24" fill="none">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3.13876 7.5V8.5H21.9715V7.5H3.13876ZM10.4626 16.5H14.6477V15.5H10.4626V16.5ZM18.8327 12.5H6.27755V11.5H18.8327V12.5Z"
      fill={color}
    />
  </svg>
);

export const CloseIcon = ({ color = "#555555" }: { color?: string } = {}) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 4.00002L12.5161 12.5161" stroke={color} strokeLinejoin="round" />
    <path d="M4 12.5163L12.5161 4.00015" stroke={color} strokeLinejoin="round" />
  </svg>
);

export const ForwardIcon = ({ color = "#14142B" }: { color?: string } = {}) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M9 5L15.9632 11.9632L9 18.9263" stroke={color} />
  </svg>
);

/* ---------- Shared page sections ---------- */

/**
 * 01 · Promo bar — strip at the very top of every frame. The default slogan
 * is served as Figma's own rendered pixels (SVG/PNG export) because the ✦
 * glyphs hit different fallback fonts in browsers. `variant`: "green" is the
 * original PDP styling; "brown" is the 2026-07-25 redesign palette used by
 * the homepage and /shop.
 */
export function PromoBar({
  slogan,
  isDefault = true,
  variant = "green",
}: {
  slogan?: string;
  isDefault?: boolean;
  variant?: "green" | "brown";
} = {}) {
  const brown = variant === "brown";
  return (
    <>
      <div style={{ ...abs(0, 0, 430, 32), background: brown ? "#3B2F2F" : "#06372E" }} />
      {isDefault || !slogan ? (
        // Default text → Figma's own rendered pixels: pixel-diff stays perfect (§11).
        <img
          src={brown ? "/veloria/home/549-95.svg" : "/veloria/glyph-promo.png"}
          alt={slogan ?? "✦ TIMELESS CRAFT · LOVE THAT NEVER FADES · 24K GOLD · FOREVER TREASURED ✦"}
          width={brown ? 352 : 358}
          height={brown ? 10 : 20}
          style={{ ...(brown ? abs(39, 11, 352, 10) : abs(36, 6, 358, 20)), display: "block" }}
        />
      ) : (
        // Owner-edited → real text in the same box; minor glyph drift
        // accepted (the admin shows the caveat inline, §11).
        <div
          className={inter.className}
          style={{
            ...(brown ? abs(39, 6, 352, 20) : abs(36, 6, 358, 20)),
            color: brown ? "#D4AF37" : "#FFFFFF",
            fontSize: brown ? 8.5 : 11,
            fontWeight: brown ? 500 : undefined,
            lineHeight: "20px",
            letterSpacing: brown ? 0 : 0.4,
            textAlign: "center",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {slogan}
        </div>
      )}
    </>
  );
}

/**
 * 02 · Header — menu, back arrow, logo, right-side icon (search on /shop,
 * heart on the product page), shopping bag.
 */
export function VHeader({
  backHref,
  right,
  wishlistSlug,
}: {
  backHref: string;
  right: "search" | "heart";
  /** Product handle for the heart's wishlist toggle (right="heart" only). */
  wishlistSlug?: string;
}) {
  return (
    <>
      <div style={{ ...abs(0, 32, 430, 62), background: "#FCF8F4" }} />
      {/* Owner-supplied top-nav art (public/top-nav/*), cropped to content;
          each box is centred on the old 24×24 Figma icon position. */}
      <img src="/top-nav/menu.png" alt="" style={{ ...abs(4.5, 50, 33, 26), objectFit: "contain" }} />
      <BackButton fallback={backHref} style={abs(83, 50, 14, 26)} />
      <Link href="/" style={{ ...abs(147, 43.5, 136, 39), display: "block" }} aria-label="Home">
        <img src="/veloria/logo.png" alt="VELORIA" width={136} height={39} style={{ display: "block", width: 136, height: 39 }} />
      </Link>
      {right === "search" ? (
        <img src="/top-nav/search.png" alt="" style={{ ...abs(324, 50, 32, 26), objectFit: "contain" }} />
      ) : (
        <WishlistButton slug={wishlistSlug ?? ""} style={abs(322.5, 50.5, 35, 26)} />
      )}
      <Link href="/checkout" style={{ ...abs(392.5, 50, 33, 26), display: "block" }} aria-label="Cart">
        <img src="/top-nav/cart.png" alt="" style={{ display: "block", width: "100%", height: "100%", objectFit: "contain" }} />
      </Link>
    </>
  );
}

/**
 * 02 · Header (redesign, "No Menu/Search" variant) — the 2026-07-25 homepage
 * header: menu art, centered logo, wishlist art, cart. Search and the back
 * arrow are gone; menu and wishlist are static placeholders until their
 * target designs leave 美化未完成 (IxD H-01) / wishlist enters scope.
 */
export function HomeHeader() {
  return (
    <>
      <div style={{ ...abs(-1, 36, 430, 62), background: "#FFF6EC" }} />
      <img src="/veloria/home/549-88.png" alt="" width={40} height={43} style={{ ...abs(6.5, 45.5, 40, 43), display: "block" }} />
      <Link href="/" style={{ ...abs(145.5, 47, 136, 40), display: "block" }} aria-label="Home">
        <img src="/veloria/home/549-90.png" alt="GoldRose" width={136} height={40} style={{ display: "block", width: 136, height: 40 }} />
      </Link>
      <img src="/veloria/home/549-91.png" alt="" width={40} height={43} style={{ ...abs(311.5, 45.5, 40, 43), display: "block" }} />
      <Link href="/checkout" style={{ ...abs(381.5, 45.5, 40, 43), display: "block" }} aria-label="Cart">
        <img src="/veloria/home/549-92.png" alt="" style={{ display: "block", width: "100%", height: "100%" }} />
      </Link>
    </>
  );
}

/**
 * 02 · Header (redesign) for /shop — same "No Menu/Search" family as
 * HomeHeader but keeps the back arrow between menu and logo (node 56:69).
 */
export function ShopHeader() {
  return (
    <>
      <div style={{ ...abs(0, 32, 430, 62), background: "#FFF6EC" }} />
      <img src="/veloria/home/549-88.png" alt="" width={40} height={43} style={{ ...abs(7, 41.5, 40, 43), display: "block" }} />
      <BackButton fallback="/" src="/veloria/home/56-71.png" style={abs(77, 41.5, 40, 43)} />
      <Link href="/" style={{ ...abs(147, 43, 136, 40), display: "block" }} aria-label="Home">
        <img src="/veloria/home/549-90.png" alt="GoldRose" width={136} height={40} style={{ display: "block", width: 136, height: 40 }} />
      </Link>
      <img src="/veloria/home/549-91.png" alt="" width={40} height={43} style={{ ...abs(313, 41.5, 40, 43), display: "block" }} />
      <Link href="/checkout" style={{ ...abs(383, 41.5, 40, 43), display: "block" }} aria-label="Cart">
        <img src="/veloria/home/549-92.png" alt="" style={{ display: "block", width: "100%", height: "100%" }} />
      </Link>
    </>
  );
}

/* ---------- 13 · Bottom navigation (fixed overlay) ---------- */

type Tab = {
  href?: string;
  img: string;
  activeImg?: string;
  label: string;
};

// Redesign nav art (2026-07-25): 2x renders of the frames' own tab images
// (nodes 763:113…763:129) — outline mascots, label baked in, "Login" on the
// account tab. The design ships active variants only for Home and Shop; the
// other tabs keep their single state when active.
const TABS: Tab[] = [
  { href: "/", img: "763-123", activeImg: "763-113", label: "Home" },
  { href: "/shop", img: "763-115", activeImg: "763-125", label: "Shop" },
  { img: "763-117", label: "Wholesale" },
  { href: "/account", img: "763-119", label: "Login" },
];

function TabContent({ tab, isActive }: { tab: Tab; isActive: boolean }) {
  return (
    <img
      src={`/veloria/home/${isActive && tab.activeImg ? tab.activeImg : tab.img}.png`}
      alt={tab.label}
      width={50}
      height={57}
      style={{ ...abs(10, 1, 50, 57), display: "block" }}
    />
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
  active = "Shop",
  bottomGap = 0,
}: {
  active?: "Home" | "Shop" | "Wholesale" | "Login" | (string & {});
  bottomGap?: number;
}) {
  return (
    <div className="figv-navfix">
      <style>{`
        .figv-navfix { position: fixed; left: 0; right: 0; bottom: 0; z-index: 10; pointer-events: none; }
        /* left calc, not margin:auto — auto margins pin an over-wide box to the
           left edge on narrow phones, drifting it right after the scale. */
        .figv-navstage { position: relative; width: 430px; left: calc((100% - 430px) / 2); pointer-events: auto; }
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
            const style: React.CSSProperties = { ...abs(x, 0, 70, 59), display: "block" };
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
      <NoCalcScale base={430} stage=".figv-navstage" origin="bottom center" />
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
  navActive = "Shop",
  children,
}: {
  height: number;
  background: string;
  fontClass: string;
  navGap?: number;
  navActive?: "Home" | "Shop" | "Wholesale" | "Login" | (string & {});
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
            left: "calc((100% - 430px) / 2)",
            overflow: "hidden",
            background,
          }}
        >
          {children}
        </div>
      </div>
      <BottomNav active={navActive} bottomGap={navGap} />
      {/* Fallback for browsers without calc() length division: apply the same
          scale via `zoom`/transform so narrow screens never scroll sideways. */}
      <NoCalcScale
        base={430}
        stage=".figv-stage"
        origin="top center"
        wrap=".figv-wrap"
        height={height}
      />
    </div>
  );
}
