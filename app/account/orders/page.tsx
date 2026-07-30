"use client";

/**
 * ROLE OF THIS FILE
 * /account/orders — the customer "My Orders" list (Figma ACCOUNT-ORDERS-LIST
 * 1097:115, imported 2026-07-27). A client page: it asks the account action
 * for the visitor's real orders and maps them into the screen's cards;
 * signed out / local mode falls back to the mock's three example orders
 * (visible-mock phase convention). This also supersedes the old customer
 * order links that pointed at the /orders admin redirect (release queue #4).
 */

import { useEffect, useState } from "react";
import { accountOverviewAction } from "@/app/account/actions";
import {
  OrdersListScreen,
  type OrdersListOrder,
} from "@/components/screens/OrdersListScreen";
import { carrierLabel } from "@/lib/shipping/carriers";
import { formatMoney } from "@/lib/money";
import type { AccountOrder } from "@/lib/account/data.ts";

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

/** Map one real order onto the design's card fields. */
function toCard(order: AccountOrder): OrdersListOrder {
  const carrier = carrierLabel(order.tracking_carrier);
  const shipped = order.fulfillment_status === "fulfilled";
  // Cancelled orders reuse the processing chip art tone; the status line
  // carries the real word (no cancelled chip in the design).
  const chip = shipped ? "shipped" : "processing";
  const status = order.cancelled
    ? "CANCELLED"
    : shipped
      ? `SHIPPED${carrier ? `  •  via ${carrier}` : ""}`
      : "PROCESSING  •  Preparing for shipment";
  return {
    date: formatDate(order.placed_at),
    title: order.name,
    status,
    statusColor: order.cancelled ? "#7C6E50" : shipped ? "#D4AF37" : "#F07D14",
    price: formatMoney(order.total_cents),
    chip,
    photoSrc: null,
    primary: shipped
      ? { label: "TRACK ORDER", href: "/orders/track" }
      : { label: "VIEW STATUS", href: "/orders/track" },
  };
}

export default function AccountOrdersPage() {
  // undefined = still asking; null = no session/local mode (mock renders).
  const [orders, setOrders] = useState<OrdersListOrder[] | null | undefined>(
    undefined,
  );

  useEffect(() => {
    let cancelled = false;
    accountOverviewAction()
      .then((overview) => {
        if (cancelled) return;
        setOrders(overview ? overview.orders.map(toCard) : null);
      })
      .catch(() => {
        if (!cancelled) setOrders(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // While loading, the mock renders (identical chrome), then real data
  // replaces the cards — no layout shift, same screen.
  return <OrdersListScreen orders={orders ?? undefined} />;
}
