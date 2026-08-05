"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * The menu overlay — Figma frame 2345:271 "/ · menu expanded · mobile · MENU"
 * from the Ready-for-dev 首页一级 section, imported 2026-08-04. Every
 * homepage/shop/PDP header's menu art opens it (the frame's own prototype:
 * ON_CLICK → 2345:271, navigation OVERLAY, 150ms DISSOLVE).
 *
 * This REPLACED the 07-29 left drawer (1523:3225 — a 314px dark panel with
 * seven flat rows). The redesign is a full-width cream sheet: brand header
 * with a close button, a MENU title, then four accordion groups. Coordinates,
 * colours and fonts are verbatim from the Figma REST data.
 *
 * Layout is COMPUTED rather than hard-coded, because the groups collapse: the
 * frame's own spacing (group 64 tall, link 48, 8px between siblings, 16px
 * before a new group) reproduces the frame exactly in its drawn state and
 * still lays out correctly once a group closes.
 *
 * AI-TAG(AI-028): AGENT-UNSURE — the design draws Shop and My Account
 * COLLAPSED but supplies no expanded state or child links for them, so both
 * are wired as plain links while keeping their chevron art. See
 * /agent-delivery/sessions/figma-sync-homepage-08-04-feat-figma-sync.md.
 */

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import NoCalcScale from "@/components/NoCalcScale";
import { abs } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";

/** One row inside an expanded group (2354:316 … 2354:377). */
type MenuLink = { id: string; label: string; href: string };

/** One accordion group (2354:283 / 292 / 301 / 331). */
type MenuGroup = {
  /** Figma node id of the group header, for traceability. */
  id: string;
  icon: string;
  title: string;
  /** Gap above this group: 8 inside a section, 16 before a new one. */
  gapBefore: number;
  /** Set on the two groups the design draws collapsed — they navigate. */
  href?: string;
  /** Set on the two groups the design draws expanded — they toggle. */
  links?: MenuLink[];
};

/*
 * The four groups verbatim from the frame. NOTE: the instance NAMES are stale
 * — "Contact Link · Contact Us" carries the label "Blog", "· Order Tracking"
 * carries "Our Story", "· Returns & After-Sales" carries "Our Craft". The
 * labels and the prototype targets agree with each other, so the labels win
 * and the names are ignored.
 */
const GROUPS: readonly MenuGroup[] = [
  {
    id: "2354:283",
    icon: "icon-shop",
    title: "Shop",
    gapBefore: 0,
    href: "/shop",
  },
  {
    id: "2354:292",
    icon: "icon-account",
    title: "My Account",
    gapBefore: 8,
    href: "/account",
  },
  {
    id: "2354:301",
    icon: "icon-contact",
    title: "Contact",
    gapBefore: 16,
    links: [
      // /blog is a coming-soon scaffold — BLOG-JOURNAL-PAGE is not Ready-for-dev.
      { id: "2354:316", label: "Blog", href: "/blog" },
      { id: "2354:321", label: "Our Story", href: "/story" },
      { id: "2354:326", label: "Our Craft", href: "/craft" },
    ],
  },
  {
    id: "2354:331",
    icon: "icon-legal",
    title: "Legal & Policies",
    gapBefore: 16,
    links: [
      {
        id: "2354:347",
        label: "Returns, Refunds & Cancellations",
        href: "/policies/returns-refunds-cancellations",
      },
      {
        id: "2354:352",
        label: "Shipping & Delivery",
        href: "/policies/shipping-delivery",
      },
      {
        id: "2354:357",
        label: "Limited Product Warranty & Care",
        href: "/policies/warranty-care",
      },
      {
        id: "2354:362",
        label: "Terms of Service",
        href: "/policies/terms-of-service",
      },
      { id: "2354:367", label: "Privacy Policy", href: "/policies/privacy" },
      {
        id: "2354:372",
        label: "Email & SMS Terms",
        href: "/policies/email-sms-terms",
      },
      {
        id: "2354:377",
        label: "Contact & Legal Notice",
        href: "/policies/contact-legal",
      },
    ],
  },
];

/** Frame metrics: the content column, and the two row heights. */
const COL_X = 16;
const COL_W = 398;
const GROUP_H = 64;
const LINK_H = 48;
/** 2352:275 ends at y=156; the first group starts at 172. */
const CONTENT_TOP = 172;
/** 2352:278's last link ends at 1028 and the frame is 1035 tall. */
const BOTTOM_PAD = 7;
const CARD_SHADOW = "0 4px 12px rgba(59,47,47,0.10)";
const BORDER = "inset 0 0 0 1px #E5D9C9";

const RESET: React.CSSProperties = {
  appearance: "none",
  background: "none",
  border: "none",
  padding: 0,
  margin: 0,
  cursor: "pointer",
};

// The portal may only render once we are on the client, or the server markup
// and the first client render disagree. Read that as an external "are we
// hydrated yet" store rather than a setState inside an effect: the snapshot is
// taken during render, so there is no second cascading render pass.
const subscribeToNothing = () => () => {};
const onTheClient = () => true;
const onTheServer = () => false;

/**
 * The full-screen menu sheet.
 *
 * @param open - Whether the overlay is showing.
 * @param onClose - Called by the close button, the scrim and Escape.
 * @returns A portal into `<body>`, or null while closed or pre-hydration.
 */
export function MenuDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  // The trigger lives inside ScaleFrame's `.figv-stage`, which is transformed.
  // A transform makes that stage the containing block AND the stacking context
  // for fixed descendants, so an in-place sheet would be scaled twice and
  // would lose the z-order fight to the tab bar (z-index 10 outside the stage
  // beats anything inside it). Portal to <body> so `fixed` means the viewport
  // and z-index 40 actually wins — same reason BottomNav sits outside the stage.
  const mounted = useSyncExternalStore(
    subscribeToNothing,
    onTheClient,
    onTheServer,
  );

  // Both groups the design draws expanded start expanded.
  const [openGroups, setOpenGroups] = useState<readonly string[]>([
    "2354:301",
    "2354:331",
  ]);

  // Escape closes, and the page behind must not scroll while the sheet is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  // Walk the groups once, assigning each row its y. In the drawn state this
  // reproduces 2345:271 exactly: 172, 244, 324, 396, 452, 508, 572, 644 …
  type Row =
    | { kind: "group"; y: number; group: MenuGroup; expanded: boolean }
    | { kind: "link"; y: number; link: MenuLink };
  const rows: Row[] = [];
  let y = CONTENT_TOP;
  for (const group of GROUPS) {
    y += group.gapBefore;
    const expanded = !!group.links && openGroups.includes(group.id);
    rows.push({ kind: "group", y, group, expanded });
    y += GROUP_H;
    if (expanded) {
      for (const link of group.links!) {
        y += 8;
        rows.push({ kind: "link", y, link });
        y += LINK_H;
      }
    }
  }
  const panelH = y + BOTTOM_PAD;
  const ratio = (panelH / 430).toFixed(7);

  const toggle = (id: string) =>
    setOpenGroups((current) =>
      current.includes(id)
        ? current.filter((each) => each !== id)
        : [...current, id],
    );

  return createPortal(
    <div className="figv-menufix">
      <style>{`
        /* Cream behind the sheet so a short panel still fills the screen. */
        .figv-menufix { position: fixed; inset: 0; z-index: 40; background: #FFF6EC; overflow-y: auto; overscroll-behavior: contain; }
        .figv-menupanel { animation: figv-menu-in 150ms ease-out both; }
        @keyframes figv-menu-in { from { opacity: 0; } to { opacity: 1; } }
        /* left calc, not margin:auto — auto margins pin an over-wide box to the
           left edge on narrow phones, drifting it right after the scale. */
        .figv-menuwrap { position: relative; }
        .figv-menustage { position: relative; width: 430px; height: ${panelH}px; left: calc((100% - 430px) / 2); }
        @supports (transform: scale(calc(100vw / 430px))) {
          /* Same wrap-height trick as ScaleFrame: a scaled box keeps its
             layout size, so the wrapper carries the scaled height instead. */
          .figv-menuwrap { height: calc(min(100vw, 480px) * ${ratio}); overflow: hidden; }
          .figv-menustage { transform: scale(calc(min(100vw, 480px) / 430px)); transform-origin: top center; }
        }
        @media (prefers-reduced-motion: reduce) { .figv-menupanel { animation: none; } }
      `}</style>

      <div className="figv-menuwrap">
        <div
          className="figv-menustage figv-menupanel"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          {/* 2361:339 · brand wordmark, the same art the page headers use */}
          <img
            src="/eldreve/brand/eldreve-140x51.png"
            alt="ELDREVE"
            width={140}
            height={51}
            style={{ ...abs(141, 24, 140, 51), display: "block" }}
          />

          {/* 2354:277 · close button — a 44px white disc, the design's own
              tap target (it already meets the 44px minimum). */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            style={{
              ...RESET,
              ...abs(365, 24, 44, 44),
              background: "#FFFFFF",
              borderRadius: 999,
            }}
          >
            <img
              src="/eldreve/menu/close.svg"
              alt=""
              width={20}
              height={20}
              style={{ ...abs(12, 12, 20, 20), display: "block" }}
            />
          </button>

          {/* 2354:280 · header divider */}
          <div style={{ ...abs(COL_X, 83, COL_W, 1), background: "#E5D9C9" }} />

          {/* 2354:281 / 2354:282 · title and subtitle */}
          <div
            className={playfair.className}
            style={{
              ...abs(COL_X, 92, COL_W),
              fontSize: 34,
              lineHeight: "40px",
              letterSpacing: -0.2,
              fontWeight: 500,
              color: "#3B2F2F",
              textAlign: "center",
            }}
          >
            MENU
          </div>
          <div
            className={notoSC.className}
            style={{
              ...abs(COL_X, 140, COL_W),
              fontSize: 12,
              lineHeight: "16px",
              fontWeight: 400,
              color: "#3B2F2F",
              opacity: 0.72,
              textAlign: "center",
            }}
          >
            Explore the world of ELDREVE.
          </div>

          {rows.map((row) => {
            if (row.kind === "link") {
              return (
                <Link
                  key={row.link.id}
                  data-el={`MENU-LINK-${row.link.id.replace(":", "-")}`}
                  href={row.link.href}
                  onClick={onClose}
                  style={{
                    ...abs(COL_X, row.y, COL_W, LINK_H),
                    display: "block",
                    background: "#FFFFFF",
                    boxShadow: BORDER,
                    borderRadius: 10,
                  }}
                >
                  <div
                    className={notoSC.className}
                    style={{
                      ...abs(56, 14, 296),
                      fontSize: 14,
                      lineHeight: "20px",
                      fontWeight: 400,
                      color: "#3B2F2F",
                    }}
                  >
                    {row.link.label}
                  </div>
                  <img
                    src="/eldreve/menu/chevron-right.svg"
                    alt=""
                    width={18}
                    height={18}
                    style={{ ...abs(364, 15, 18, 18), display: "block" }}
                  />
                </Link>
              );
            }

            const { group, expanded } = row;
            const box: React.CSSProperties = {
              ...abs(COL_X, row.y, COL_W, GROUP_H),
              // Expanded groups take the cream fill; collapsed ones stay white.
              background: expanded ? "#FFF6EC" : "#FFFFFF",
              boxShadow: `${BORDER}, ${CARD_SHADOW}`,
              borderRadius: 16,
            };
            const inner = (
              <>
                <img
                  src={`/eldreve/menu/${group.icon}.svg`}
                  alt=""
                  width={28}
                  height={28}
                  style={{ ...abs(16, 18, 28, 28), display: "block" }}
                />
                <div
                  className={notoSC.className}
                  style={{
                    ...abs(56, 22, 294),
                    fontSize: 14,
                    lineHeight: "20px",
                    fontWeight: 400,
                    color: "#3B2F2F",
                  }}
                >
                  {group.title}
                </div>
                <img
                  src={`/eldreve/menu/chevron-${expanded ? "up" : "down"}.svg`}
                  alt=""
                  width={20}
                  height={20}
                  style={{ ...abs(362, 22, 20, 20), display: "block" }}
                />
              </>
            );

            return group.href ? (
              <Link
                key={group.id}
                data-el={`MENU-GROUP-${group.id.replace(":", "-")}`}
                href={group.href}
                onClick={onClose}
                style={{ ...box, display: "block" }}
              >
                {inner}
              </Link>
            ) : (
              <button
                key={group.id}
                data-el={`MENU-GROUP-${group.id.replace(":", "-")}`}
                type="button"
                onClick={() => toggle(group.id)}
                aria-expanded={expanded}
                style={{
                  ...RESET,
                  ...box,
                  display: "block",
                  textAlign: "left",
                }}
              >
                {inner}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fallback for browsers without calc() length division: same scale via
          zoom/transform so the sheet still fits narrow screens. */}
      <NoCalcScale
        base={430}
        stage=".figv-menustage"
        origin="top center"
        wrap=".figv-menuwrap"
        height={panelH}
      />
    </div>,
    document.body,
  );
}
