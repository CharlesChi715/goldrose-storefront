/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * Shared chrome for the pages imported from the ELDREVE Figma file
 * (file 3CXNpmuuyNyCW70qOci0oM): / (homepage redesign), /shop and
 * /products/[slug] (frame 详情页). All frames share a 430px-wide canvas,
 * promo bar, header, and the white bottom tab bar. All coordinates/colors
 * come verbatim from the Figma REST API. The bottom nav is fixed to the
 * viewport (per Charles's request) with Home/Shop tabs wired to routes.
 *
 * The `abs`/`txt` style helpers this file used to export are pure CSS math
 * with no JSX, so they now live in lib/figma-layout.ts. "eldreve" was the
 * Figma file's name, never the brand — hence chrome.tsx.
 */

import Link from "next/link";
import { FadeLink, PageFade } from "@/components/PageFade";
import { BackButton } from "@/components/BackButton";
import { WishlistButton } from "@/components/WishlistButton";
import { inter } from "@/lib/fonts";
import NoCalcScale from "@/components/NoCalcScale";
import { MenuButton } from "@/components/MenuButton";
import { SearchButton } from "@/components/SearchButton";
import { AccountTabArt } from "@/components/AccountTabArt";
import { abs } from "@/lib/figma-layout";

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

export const ListviewIcon = ({
  color = "#14142B",
}: { color?: string } = {}) => (
  <svg width="26" height="24" viewBox="0 0 26 24" fill="none">
    <g opacity="0.5">
      <path d="M12.7699 17H20.9011" stroke={color} strokeWidth="1.00221" />
      <path d="M12.794 6.99999H20.9252" stroke={color} strokeWidth="1.00221" />
      <rect
        x="2.60633"
        y="3.45509"
        width="7.37011"
        height="7.00001"
        stroke={color}
      />
      <rect
        x="2.60633"
        y="13.5144"
        width="7.37011"
        height="7.00001"
        stroke={color}
      />
    </g>
  </svg>
);

export const DownIcon = ({ color = "#1B362B" }: { color?: string } = {}) => (
  <svg width="21" height="20" viewBox="0 0 21 20" fill="none">
    <g opacity="0.5">
      <path
        d="M8.35172 11.6087L4.73531 6.72329L11.9681 6.72329L8.35172 11.6087Z"
        fill={color}
      />
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
    <path
      d="M4 4.00002L12.5161 12.5161"
      stroke={color}
      strokeLinejoin="round"
    />
    <path
      d="M4 12.5163L12.5161 4.00015"
      stroke={color}
      strokeLinejoin="round"
    />
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
      <div
        style={{
          ...abs(0, 0, 430, 32),
          background: brown ? "#3B2F2F" : "#06372E",
        }}
      />
      {isDefault || !slogan ? (
        // Default text → Figma's own rendered pixels: pixel-diff stays perfect (§11).
        <img
          src={brown ? "/eldreve/home/549-95.svg" : "/eldreve/glyph-promo.png"}
          alt={
            slogan ??
            "✦ TIMELESS CRAFT · LOVE THAT NEVER FADES · 24K GOLD · FOREVER TREASURED ✦"
          }
          width={brown ? 352 : 358}
          height={brown ? 10 : 20}
          style={{
            ...(brown ? abs(39, 11, 352, 10) : abs(36, 6, 358, 20)),
            display: "block",
          }}
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
      <img
        src="/top-nav/menu.png"
        alt=""
        style={{ ...abs(4.5, 50, 33, 26), objectFit: "contain" }}
      />
      <BackButton fallback={backHref} style={abs(83, 50, 14, 26)} />
      <Link
        href="/"
        style={{ ...abs(147, 43.5, 136, 39), display: "block" }}
        aria-label="Home"
      >
        <img
          src="/eldreve/brand/eldreve-136x40.png"
          alt="ELDREVE"
          width={136}
          height={39}
          style={{ display: "block", width: 136, height: 39 }}
        />
      </Link>
      {right === "search" ? (
        // 925:159 — the 07-27 detail-page frames replace the wishlist heart
        // with the search art (355b911e), which opens the SEARCH-OPEN overlay.
        <SearchButton style={abs(313, 41.5, 40, 43)} />
      ) : (
        <WishlistButton
          slug={wishlistSlug ?? ""}
          style={abs(322.5, 50.5, 35, 26)}
        />
      )}
      <Link
        href="/checkout"
        style={{ ...abs(392.5, 50, 33, 26), display: "block" }}
        aria-label="Cart"
      >
        <img
          src="/top-nav/cart.png"
          alt=""
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      </Link>
    </>
  );
}

/**
 * 02 · Header (redesign) — the 2026-07-25 homepage header: menu art,
 * centered logo, magnifier, cart. The magnifier slot was a static
 * placeholder until 07-27; it now opens the SEARCH-OPEN overlay like the
 * shop and detail headers (owner instruction — the art reads as search).
 */
export function HomeHeader() {
  return (
    <>
      <div style={{ ...abs(-1, 36, 430, 62), background: "#FFF6EC" }} />
      <MenuButton style={abs(6.5, 45.5, 40, 43)} />
      <Link
        href="/"
        style={{ ...abs(147, 47, 136, 40), display: "block" }}
        aria-label="Home"
      >
        <img
          src="/eldreve/brand/eldreve-136x40.png"
          alt="ELDREVE"
          width={136}
          height={40}
          style={{ display: "block", width: 136, height: 40 }}
        />
      </Link>
      {/* The magnifier art is a live search button here too (owner, 07-27):
          the homepage is where visitors actually look for it. */}
      <SearchButton style={abs(311.5, 45.5, 40, 43)} />
      {/* Cart art still goes to /checkout, which IS the live cart. /bag holds
          the B-1 design but shows the mock's own line items — repointing the
          icon there would hide the shopper's real basket. Swap once /bag reads
          lib/cart/store.ts.
          AI-TAG(AI-008): AGENT-DECISION — the 07-31 prototype wires this icon
          (and PDP Add to Cart) to /bag; kept on /checkout deliberately. See
          /agent-delivery/sessions/figma-sync-07-31-feat-figma-sync-0731.md. */}
      <Link
        href="/checkout"
        style={{ ...abs(381.5, 45.5, 40, 43), display: "block" }}
        aria-label="Cart"
      >
        <img
          src="/eldreve/screens/1523-1682.png"
          alt=""
          style={{ display: "block", width: "100%", height: "100%" }}
        />
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
      <MenuButton style={abs(7, 41.5, 40, 43)} />
      <BackButton
        fallback="/"
        src="/eldreve/home/56-71.png"
        style={abs(77, 41.5, 40, 43)}
      />
      <Link
        href="/"
        style={{ ...abs(147, 43, 136, 40), display: "block" }}
        aria-label="Home"
      >
        <img
          src="/eldreve/brand/eldreve-136x40.png"
          alt="ELDREVE"
          width={136}
          height={40}
          style={{ display: "block", width: 136, height: 40 }}
        />
      </Link>
      {/* Search art opens the SEARCH-OPEN overlay (914:114, 07-27). */}
      <SearchButton style={abs(313, 41.5, 40, 43)} />
      <Link
        href="/checkout"
        style={{ ...abs(383, 41.5, 40, 43), display: "block" }}
        aria-label="Cart"
      >
        <img
          src="/eldreve/screens/1523-1682.png"
          alt=""
          style={{ display: "block", width: "100%", height: "100%" }}
        />
      </Link>
    </>
  );
}

/* ---------- 13 · Bottom navigation (fixed overlay) ---------- */

// Tabs are identified by a stable id rather than by their label — the account
// tab has been labelled "Login" and "Me" across design revisions (currently
// "Me", 07-27 frames).
type TabId = "Home" | "Shop" | "Account";

type Tab = {
  id: TabId;
  href?: string;
  img: string;
  activeImg?: string;
  label: string;
};

// Nav art imported 2026-08-02 from the current frames' own tab renders
// (public/eldreve/nav/). THREE TABS: the design dropped 商务 / Wholesale —
// every screen frame under a Ready-for-dev section draws Home / Shop /
// account at x 18 / 179 / 340 (2024:276 login, 2024:284 dashboard, 2024:292
// PDP, 1523:1646 shop, 2380:812 home, 2436:368 the new auth screen), and the
// team's comment on the simplified homepage reads "企业这一块要删掉先不做机制".
// The business pages stay reachable through the menu drawer's FOR BUSINESS
// row → /business/partnerships → APPLY FOR WHOLESALE.
//
// The account tab is a client island (AccountTabArt): these frames restore the
// Login/Me session swap the 07-27 batch had dropped.
const TABS: Tab[] = [
  {
    id: "Home",
    href: "/",
    img: "nav/home",
    activeImg: "nav/home-active",
    label: "Home",
  },
  {
    id: "Shop",
    href: "/shop",
    img: "nav/shop",
    activeImg: "nav/shop-active",
    label: "Shop",
  },
  {
    id: "Account",
    href: "/account",
    img: "nav/login",
    activeImg: "nav/login-active",
    label: "Login",
  },
];

// Bare ids resolve against the 07-25 home render set; an id containing "/" is a
// path into a sibling set under /eldreve.
const tabArtSrc = (id: string) =>
  id.includes("/") ? `/eldreve/${id}.png` : `/eldreve/home/${id}.png`;

// Every tab's art sits at the same spot inside its 70×59 hit area.
const TAB_ART_STYLE: React.CSSProperties = {
  ...abs(10, 1, 50, 57),
  display: "block",
};

function TabContent({ tab, isActive }: { tab: Tab; isActive: boolean }) {
  // The account tab's face depends on the session, so it renders itself.
  if (tab.id === "Account") {
    return <AccountTabArt isActive={isActive} />;
  }
  return (
    <img
      src={tabArtSrc(isActive && tab.activeImg ? tab.activeImg : tab.img)}
      alt={tab.label}
      width={50}
      height={57}
      style={TAB_ART_STYLE}
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
  active?: TabId | (string & {});
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
            const x = [18, 179, 340][i];
            const style: React.CSSProperties = {
              ...abs(x, 0, 70, 59),
              display: "block",
            };
            const content = (
              <TabContent tab={tab} isActive={tab.id === active} />
            );
            return tab.href ? (
              // FadeLink, not Link: switching tabs cross-fades the canvas.
              <FadeLink key={tab.id} href={tab.href} style={style}>
                {content}
              </FadeLink>
            ) : (
              <div key={tab.id} style={style}>
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
  nav = true,
  children,
}: {
  height: number;
  background: string;
  fontClass: string;
  navGap?: number;
  navActive?: TabId | (string & {});
  /**
   * Opt out of the shared tab bar. B-3 (partnerships) and C-1/C-2 (tracking,
   * confirmation) draw their OWN nav band inside the frame, so the screen
   * component renders it and the shared bar would double up. Flagged to the
   * design team in docs/ixd. B-4 (wholesale) used to be in that list; as of
   * 2026-07-29 it renders the shared fixed bar like every other main page,
   * because an in-frame band scrolls away instead of staying reachable.
   */
  nav?: boolean;
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
      {nav ? <BottomNav active={navActive} bottomGap={navGap} /> : null}
      {/* Tab switches cross-fade the canvas above; the nav stays put. */}
      <PageFade />
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
