"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * /account/orders — pixel-exact implementation of ACCOUNT-ORDERS-LIST
 * (1097:115, 07-27). Geometry, colors, fonts and copy verbatim from the
 * Figma REST data; the status chips (emoji + label) are served as Figma's
 * own PNG renders because emoji hit different fonts in browsers.
 *
 * Data: signed in on hosted Supabase, the visitor's real orders fill the
 * cards — number, date, delivery status and total are real; the photo stays
 * the neutral placeholder because the account feed has no line items
 * (explicit-unknown rule). Signed out or in local mode the mock's three
 * example orders render verbatim (visible-mock phase convention, like /bag).
 *
 * The status tabs filter for real. "Delivered" has no live signal yet
 * (fulfillment stops at "shipped"), so for real data that tab shows an
 * empty-state line — flagged in docs/ixd/README.md.
 *
 * Buttons: TRACK ORDER / VIEW STATUS → /orders/track (exists); BUY AGAIN →
 * /shop (nearest honest destination, H-15 precedent); VIEW DETAILS stays a
 * pixel placeholder until an order-detail surface exists
 * (ORDER-DETAIL-… spec, docs/ixd/order-detail.md).
 */

import { useState } from "react";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { ScaleFrame } from "@/components/chrome";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";

const INK = "#3B2F2F";
const SAND = "#E5D9C9";
const GOLD = "#D4AF37";
const CREAM = "#FFF6EC";
const SHEET = "#FFFEFB";
const PINK = "#F3C6D1";

type ChipKind = "shipped" | "delivered" | "processing";

export type OrdersListOrder = {
  date: string;
  title: string;
  status: string;
  statusColor: string;
  price: string;
  chip: ChipKind;
  photoSrc: string | null;
  primary: { label: string; href?: string };
};

// 1107:121…156 — the mock's three orders, frame order.
const MOCK_ORDERS: OrdersListOrder[] = [
  {
    date: "Aug 18, 2025",
    title: "24K Gold-Dipped Rose — Eternal Love",
    status: "SHIPPED  •  Arrives Aug 25",
    statusColor: GOLD,
    price: "$129.00",
    chip: "shipped",
    photoSrc: "/veloria/screens/1107-122.png",
    primary: { label: "TRACK ORDER", href: "/orders/track" },
  },
  {
    date: "Aug 11, 2025",
    title: "Sapphire Blue 24K Gold Rose",
    status: "DELIVERED  •  Delivered Aug 14",
    statusColor: "#4F9133",
    price: "$109.00",
    chip: "delivered",
    photoSrc: "/veloria/screens/1107-134.png",
    primary: { label: "BUY AGAIN", href: "/shop" },
  },
  {
    date: "Jul 29, 2025",
    title: "Rose Gift Set with Engraved Plaque",
    status: "PROCESSING  •  Preparing for shipment",
    statusColor: "#F07D14",
    price: "$149.00",
    chip: "processing",
    photoSrc: "/veloria/screens/1107-146.png",
    primary: { label: "VIEW STATUS", href: "/orders/track" },
  },
];

// Figma's own chip renders (emoji baked in), reused for real orders too.
const CHIP_ART: Record<ChipKind, string> = {
  shipped: "1107-128",
  delivered: "1107-140",
  processing: "1107-152",
};
const CHIP_BG: Record<ChipKind, string> = {
  shipped: "#FFF5C4",
  delivered: "#DEF0CC",
  processing: "#FFE3C7",
};

const TABS = ["All", "Processing", "Shipped", "Delivered"] as const;
type Tab = (typeof TABS)[number];

function matchesTab(order: OrdersListOrder, tab: Tab): boolean {
  if (tab === "All") return true;
  return order.chip === tab.toLowerCase();
}

export function OrdersListScreen({ orders }: { orders?: OrdersListOrder[] | null }) {
  const [tab, setTab] = useState<Tab>("All");
  const list = (orders ?? MOCK_ORDERS).filter((order) => matchesTab(order, tab));
  // 218px card pitch from y=248; keep at least the frame's height.
  const height = Math.max(932, 248 + Math.max(list.length, 1) * 218 + 40);

  return (
    <ScaleFrame height={height} background={CREAM} fontClass={notoSC.className} navActive="Account">
      {/* header — ‹ (1107:111, ink 8×16) + gold wordmark */}
      <BackButton fallback="/account" src="/veloria/screens/1107-111.svg" style={abs(32, 52, 8, 16)} />
      <div className={playfair.className} style={{ ...abs(115, 35.34, 200), ...txt(34, 45.32, GOLD, "center"), fontWeight: 500 }}>
        GoldRose
      </div>

      <div className={playfair.className} style={{ ...abs(24, 100, 240), ...txt(33, 44, INK), fontWeight: 600 }}>
        My Orders
      </div>
      <div style={{ ...abs(24, 149, 360), ...txt(13, 15.6, INK) }}>Track, review, and manage recent purchases.</div>

      {/* 1107:115 status tabs — real filters */}
      <div style={{ ...abs(22, 180, 386, 50), background: SHEET, boxShadow: `inset 0 0 0 1px ${SAND}`, borderRadius: 16 }} />
      {TABS.map((label, i) => {
        const x = [22, 118, 216, 294][i];
        const w = [96, 98, 78, 114][i];
        const active = tab === label;
        return (
          <button
            key={label}
            type="button"
            aria-pressed={active}
            onClick={() => setTab(label)}
            style={{ ...abs(x, 185, w, 40), border: 0, padding: 0, background: "transparent", cursor: "pointer" }}
          >
            {active ? <span style={{ ...abs(5, 0, w - 10, 40), background: PINK, borderRadius: 12, display: "block" }} /> : null}
            <span
              className={playfair.className}
              style={{ position: "absolute", left: 0, right: 0, top: 11, ...txt(13, 17.33, INK, "center"), fontWeight: 600 }}
            >
              {label}
            </span>
          </button>
        );
      })}

      {list.length === 0 ? (
        <div style={{ ...abs(24, 268, 380), ...txt(13, 18, INK) }}>
          {tab === "Delivered"
            ? "No delivered orders yet — delivery confirmation isn’t tracked for live orders yet."
            : "No orders here yet."}
        </div>
      ) : null}

      {list.map((order, i) => {
        const y = 248 + i * 218;
        return (
          <div key={`${order.title}-${i}`}>
            <div style={{ ...abs(22, y, 386, 202), background: SHEET, boxShadow: `inset 0 0 0 1px ${SAND}`, borderRadius: 14 }} />
            <img
              src={order.photoSrc ?? "/placeholder.png"}
              alt=""
              width={118}
              height={116}
              style={{ ...abs(36, y + 16, 118, 116), borderRadius: 12, objectFit: "cover", display: "block" }}
            />
            <div style={{ ...abs(168, y + 19, 116), ...txt(10, 12, INK) }} data-live-text>
              {order.date}
            </div>
            <div
              style={{ ...abs(168, y + 46, 214, 40), ...txt(15, 18, INK), fontWeight: 700, whiteSpace: "normal", overflow: "hidden" }}
              data-live-text
            >
              {order.title}
            </div>
            <div
              style={{ ...abs(168, y + 93.7, 214), ...txt(10.5, 12.6, order.statusColor), fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis" }}
              data-live-text
            >
              {order.status}
            </div>
            <div style={{ ...abs(168, y + 115.4, 120), ...txt(21, 25.2, INK), fontWeight: 700 }} data-live-text>
              {order.price}
            </div>
            {/* status chip — Figma render (emoji + label baked in) */}
            <div style={{ ...abs(292, y + 12, 100, 34), background: CHIP_BG[order.chip], boxShadow: `inset 0 0 0 1px ${SAND}`, borderRadius: 10 }}>
              <img
                src={`/veloria/screens/${CHIP_ART[order.chip]}.png`}
                alt={order.chip}
                width={88}
                height={32}
                style={{ ...abs(6, 1, 88, 32), display: "block" }}
              />
            </div>
            {order.primary.href ? (
              <Link href={order.primary.href} style={{ ...abs(36, y + 148, 166, 38), background: INK, borderRadius: 8, display: "block" }}>
                <span style={{ position: "absolute", left: 4, right: 4, top: 12, ...txt(11, 13.2, CREAM, "center"), fontWeight: 500 }}>
                  {order.primary.label}
                </span>
              </Link>
            ) : (
              <div style={{ ...abs(36, y + 148, 166, 38), background: INK, borderRadius: 8 }}>
                <span style={{ position: "absolute", left: 4, right: 4, top: 12, ...txt(11, 13.2, CREAM, "center"), fontWeight: 500 }}>
                  {order.primary.label}
                </span>
              </div>
            )}
            {/* VIEW DETAILS — pixel placeholder until an order-detail surface
                exists (docs/ixd/order-detail.md). */}
            <div style={{ ...abs(214, y + 148, 178, 38), background: SHEET, boxShadow: `inset 0 0 0 1px ${SAND}`, borderRadius: 8 }}>
              <span style={{ position: "absolute", left: 6, right: 6, top: 12, ...txt(11, 13.2, INK, "center"), fontWeight: 500 }}>
                VIEW DETAILS
              </span>
            </div>
          </div>
        );
      })}
    </ScaleFrame>
  );
}
