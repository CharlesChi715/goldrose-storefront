/**
 * ROLE OF THIS FILE
 * The analytics engine (§9.3 Home, §9.9 Analytics): sales metrics from
 * orders, behavior metrics from the first-party page_views beacon (§7.12).
 * Every number is computed for a date range plus the equal-length previous
 * period, like Shopify's compare-to-previous.
 */

import { cache } from "react";
import { accountOf, channelOf } from "./channels.ts";
import { getStore } from "@/lib/supabase/store.ts";
import type {
  DbTables,
  OrderRow,
  PageViewRow,
  TableName,
} from "@/lib/supabase/types.ts";

/**
 * Per-request table reads (perf fix 2026-07-22): one dashboard render calls
 * analyticsSummary ×3 + homeFeed ×2 + adminAlerts, which used to fetch
 * `orders` six times and the unbounded `page_views` three times. React
 * cache() collapses identical reads within a single request.
 */
const cachedAllUntyped = cache((table: TableName) => getStore().all(table));
/** Typed wrapper over the cached table reader — same promise, narrowed row type. */
function cachedAll<T extends TableName>(table: T): Promise<DbTables[T][]> {
  return cachedAllUntyped(table) as Promise<DbTables[T][]>;
}

export type RangeKey = "today" | "7d" | "30d" | "90d";

export type DateRange = { start: Date; end: Date };

/**
 * Builds the date range for a preset key plus the equal-length previous
 * period immediately before it (Shopify's compare-to-previous).
 *
 * @param key - "today" (since local midnight) or a trailing 7/30/90-day window.
 * @param now - Range end; defaults to the current time (injectable for tests).
 * @returns The `current` range and the same-length `previous` range before it.
 */
export function rangesFor(key: RangeKey, now = new Date()): {
  current: DateRange;
  previous: DateRange;
} {
  const end = now;
  const start = new Date(now);
  if (key === "today") {
    start.setHours(0, 0, 0, 0);
  } else {
    const days = key === "7d" ? 7 : key === "30d" ? 30 : 90;
    start.setDate(start.getDate() - days);
  }
  const span = end.getTime() - start.getTime();
  return {
    current: { start, end },
    previous: { start: new Date(start.getTime() - span), end: start },
  };
}

/** True when the ISO timestamp falls in the range (start inclusive, end exclusive). */
function within(iso: string, range: DateRange): boolean {
  const time = new Date(iso).getTime();
  return time >= range.start.getTime() && time < range.end.getTime();
}

/** Orders that count toward sales: placed in range, not cancelled. */
function salesOrders(orders: OrderRow[], range: DateRange): OrderRow[] {
  return orders.filter(
    (order) =>
      within(order.placed_at, range) &&
      !order.cancelled_at &&
      order.financial_status !== "pending",
  );
}

/** Sum of order totals minus refunds, in cents. */
function netSales(orders: OrderRow[]): number {
  return orders.reduce((sum, order) => sum + order.total_cents - order.refunded_cents, 0);
}

export { channelOf, sourceOf } from "./channels.ts";

export type MetricPair = { current: number; previous: number };

export type AnalyticsSummary = {
  totalSalesCents: MetricPair;
  ordersCount: MetricPair;
  aovCents: MetricPair;
  returningRatePercent: MetricPair;
  sessions: MetricPair;
  conversion: {
    sessions: number;
    reachedCheckout: number;
    purchased: number;
    ratePercent: MetricPair;
  };
  topProducts: Array<{ name: string; quantity: number; salesCents: number }>;
  salesByCountry: Array<{ country: string; orders: number; salesCents: number }>;
  salesByDiscount: Array<{ code: string; orders: number; salesCents: number }>;
  salesBySource: Array<{ source: string; orders: number; salesCents: number }>;
  salesByAccount: Array<{ account: string; orders: number; salesCents: number }>;
  salesOverTime: Array<{ date: string; salesCents: number }>;
  visitorsRightNow: number;
  trafficByChannel: Array<{ channel: string; sessions: number }>;
  trafficByCountry: Array<{ country: string; sessions: number }>;
  trafficByCampaign: Array<{ campaign: string; sessions: number }>;
  trafficByAccount: Array<{ account: string; sessions: number }>;
  liveVisitors: {
    total: number;
    byChannel: Array<{ channel: string; visitors: number }>;
    byCountry: Array<{ country: string; visitors: number }>;
  };
};

/**
 * Computes every §9.9 analytics number for one date range: sales metrics
 * from orders, sessions/conversion/attribution from page_views, plus the
 * live-visitor snapshot (activity in the last 5 minutes). Every headline
 * metric is paired with the previous period's value.
 *
 * @param key - Date-range preset (today / 7d / 30d / 90d).
 * @param now - Range end; defaults to the current time (injectable for tests).
 */
export async function analyticsSummary(
  key: RangeKey,
  now = new Date(),
): Promise<AnalyticsSummary> {
  const [orders, lines, views] = await Promise.all([
    cachedAll("orders"),
    cachedAll("order_lines"),
    cachedAll("page_views"),
  ]);
  const { current, previous } = rangesFor(key, now);

  const currentOrders = salesOrders(orders, current);
  const previousOrders = salesOrders(orders, previous);

  // Returning customer rate: customers with 2+ orders in the period.
  function returningRate(rangeOrders: OrderRow[]): number {
    const byCustomer = new Map<string, number>();
    for (const order of rangeOrders) {
      if (order.customer_id) {
        byCustomer.set(order.customer_id, (byCustomer.get(order.customer_id) ?? 0) + 1);
      }
    }
    if (byCustomer.size === 0) {
      return 0;
    }
    const returning = [...byCustomer.values()].filter((count) => count > 1).length;
    return Math.round((returning / byCustomer.size) * 100);
  }

  function sessionsIn(range: DateRange): Set<string> {
    return new Set(
      views.filter((view) => within(view.created_at, range)).map((view) => view.session_id),
    );
  }
  const currentSessions = sessionsIn(current);
  const previousSessions = sessionsIn(previous);

  const checkoutSessions = new Set(
    views
      .filter((view) => within(view.created_at, current) && view.path.startsWith("/checkout"))
      .map((view) => view.session_id),
  );
  const purchased = currentOrders.filter((order) => order.visitor_id).length;

  function conversionRate(rangeOrders: OrderRow[], sessions: Set<string>): number {
    if (sessions.size === 0) {
      return 0;
    }
    const bought = rangeOrders.filter((order) => order.visitor_id).length;
    return Math.round((bought / sessions.size) * 1000) / 10;
  }

  // Top products by quantity in range.
  const currentOrderIds = new Set(currentOrders.map((order) => order.id));
  const byProduct = new Map<string, { quantity: number; salesCents: number }>();
  for (const line of lines) {
    if (currentOrderIds.has(line.order_id)) {
      const entry = byProduct.get(line.name) ?? { quantity: 0, salesCents: 0 };
      entry.quantity += line.quantity;
      entry.salesCents += line.line_total_cents;
      byProduct.set(line.name, entry);
    }
  }

  const byCountry = new Map<string, { orders: number; salesCents: number }>();
  const byDiscount = new Map<string, { orders: number; salesCents: number }>();
  for (const order of currentOrders) {
    const country = order.shipping_address?.country ?? "Unknown";
    const countryEntry = byCountry.get(country) ?? { orders: 0, salesCents: 0 };
    countryEntry.orders += 1;
    countryEntry.salesCents += order.total_cents - order.refunded_cents;
    byCountry.set(country, countryEntry);
    if (order.discount_code) {
      const discountEntry = byDiscount.get(order.discount_code) ?? {
        orders: 0,
        salesCents: 0,
      };
      discountEntry.orders += 1;
      discountEntry.salesCents += order.total_cents - order.refunded_cents;
      byDiscount.set(order.discount_code, discountEntry);
    }
  }

  // Sales by traffic source: attribute each order to its visitor's first view.
  // Landing view per session drives the traffic/attribution cards: the first
  // view of a session is the one that still carries the referrer / UTM tags.
  const firstViewByVisitor = new Map<string, PageViewRow>();
  const firstViewBySession = new Map<string, PageViewRow>();
  for (const view of [...views].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
    if (!firstViewByVisitor.has(view.visitor_id)) {
      firstViewByVisitor.set(view.visitor_id, view);
    }
    if (!firstViewBySession.has(view.session_id)) {
      firstViewBySession.set(view.session_id, view);
    }
  }
  const bySource = new Map<string, { orders: number; salesCents: number }>();
  // Sales by posting account (owner request 2026-07-23): trace each order back
  // to the specific account that brought the buyer (utm_content on the
  // visitor's first view) so per-salesperson commission can be worked out.
  const byAccountSales = new Map<string, { orders: number; salesCents: number }>();
  for (const order of currentOrders) {
    const firstView = order.visitor_id ? firstViewByVisitor.get(order.visitor_id) : undefined;
    const source = order.visitor_id ? channelOf(firstView) : "Unattributed";
    const entry = bySource.get(source) ?? { orders: 0, salesCents: 0 };
    entry.orders += 1;
    entry.salesCents += order.total_cents - order.refunded_cents;
    bySource.set(source, entry);
    const account = accountOf(firstView);
    if (account) {
      const accountEntry = byAccountSales.get(account) ?? { orders: 0, salesCents: 0 };
      accountEntry.orders += 1;
      accountEntry.salesCents += order.total_cents - order.refunded_cents;
      byAccountSales.set(account, accountEntry);
    }
  }

  // Traffic attribution (owner request 2026-07-22): sessions in range grouped
  // by marketing channel, visitor country (geo-IP header on the beacon), and
  // utm_campaign — so each posted creative can be measured by its campaign tag.
  const byChannel = new Map<string, number>();
  const byGeoCountry = new Map<string, number>();
  const byCampaign = new Map<string, number>();
  const byAccountSessions = new Map<string, number>();
  for (const sessionId of currentSessions) {
    const landing = firstViewBySession.get(sessionId);
    const channel = channelOf(landing);
    byChannel.set(channel, (byChannel.get(channel) ?? 0) + 1);
    const geo = landing?.country ?? "Unknown";
    byGeoCountry.set(geo, (byGeoCountry.get(geo) ?? 0) + 1);
    const campaign = landing?.utm?.utm_campaign;
    if (campaign) {
      byCampaign.set(campaign, (byCampaign.get(campaign) ?? 0) + 1);
    }
    const account = accountOf(landing);
    if (account) {
      byAccountSessions.set(account, (byAccountSessions.get(account) ?? 0) + 1);
    }
  }

  // Sales over time: one bucket per day of the current range.
  const buckets = new Map<string, number>();
  const cursor = new Date(current.start);
  cursor.setHours(0, 0, 0, 0);
  while (cursor.getTime() < current.end.getTime()) {
    buckets.set(cursor.toISOString().slice(0, 10), 0);
    cursor.setDate(cursor.getDate() + 1);
  }
  for (const order of currentOrders) {
    const bucket = order.placed_at.slice(0, 10);
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + order.total_cents - order.refunded_cents);
  }

  // Live view (owner request 2026-07-22): who is on the site right now,
  // split by channel and country. A visitor's channel comes from the landing
  // view of their latest session (the recent views themselves have no UTM).
  const fiveMinutesAgo = now.getTime() - 5 * 60 * 1000;
  const liveSessionByVisitor = new Map<string, PageViewRow>();
  for (const view of views) {
    if (new Date(view.created_at).getTime() < fiveMinutesAgo) {
      continue;
    }
    const seen = liveSessionByVisitor.get(view.visitor_id);
    if (!seen || view.created_at > seen.created_at) {
      liveSessionByVisitor.set(view.visitor_id, view);
    }
  }
  const liveByChannel = new Map<string, number>();
  const liveByCountry = new Map<string, number>();
  for (const view of liveSessionByVisitor.values()) {
    const landing = firstViewBySession.get(view.session_id) ?? view;
    const channel = channelOf(landing);
    liveByChannel.set(channel, (liveByChannel.get(channel) ?? 0) + 1);
    const geo = landing.country ?? view.country ?? "Unknown";
    liveByCountry.set(geo, (liveByCountry.get(geo) ?? 0) + 1);
  }
  const visitorsRightNow = liveSessionByVisitor.size;

  const currentAov =
    currentOrders.length > 0 ? Math.round(netSales(currentOrders) / currentOrders.length) : 0;
  const previousAov =
    previousOrders.length > 0
      ? Math.round(netSales(previousOrders) / previousOrders.length)
      : 0;

  return {
    totalSalesCents: { current: netSales(currentOrders), previous: netSales(previousOrders) },
    ordersCount: { current: currentOrders.length, previous: previousOrders.length },
    aovCents: { current: currentAov, previous: previousAov },
    returningRatePercent: {
      current: returningRate(currentOrders),
      previous: returningRate(previousOrders),
    },
    sessions: { current: currentSessions.size, previous: previousSessions.size },
    conversion: {
      sessions: currentSessions.size,
      reachedCheckout: checkoutSessions.size,
      purchased,
      ratePercent: {
        current: conversionRate(currentOrders, currentSessions),
        previous: conversionRate(previousOrders, previousSessions),
      },
    },
    topProducts: [...byProduct.entries()]
      .map(([name, entry]) => ({ name, ...entry }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5),
    salesByCountry: [...byCountry.entries()]
      .map(([country, entry]) => ({ country, ...entry }))
      .sort((a, b) => b.salesCents - a.salesCents),
    salesByDiscount: [...byDiscount.entries()]
      .map(([code, entry]) => ({ code, ...entry }))
      .sort((a, b) => b.salesCents - a.salesCents),
    salesBySource: [...bySource.entries()]
      .map(([source, entry]) => ({ source, ...entry }))
      .sort((a, b) => b.salesCents - a.salesCents),
    salesByAccount: [...byAccountSales.entries()]
      .map(([account, entry]) => ({ account, ...entry }))
      .sort((a, b) => b.salesCents - a.salesCents),
    salesOverTime: [...buckets.entries()].map(([date, salesCents]) => ({ date, salesCents })),
    visitorsRightNow,
    trafficByChannel: [...byChannel.entries()]
      .map(([channel, sessions]) => ({ channel, sessions }))
      .sort((a, b) => b.sessions - a.sessions),
    trafficByCountry: [...byGeoCountry.entries()]
      .map(([country, sessions]) => ({ country, sessions }))
      .sort((a, b) => b.sessions - a.sessions),
    trafficByCampaign: [...byCampaign.entries()]
      .map(([campaign, sessions]) => ({ campaign, sessions }))
      .sort((a, b) => b.sessions - a.sessions),
    trafficByAccount: [...byAccountSessions.entries()]
      .map(([account, sessions]) => ({ account, sessions }))
      .sort((a, b) => b.sessions - a.sessions),
    liveVisitors: {
      total: visitorsRightNow,
      byChannel: [...liveByChannel.entries()]
        .map(([channel, visitors]) => ({ channel, visitors }))
        .sort((a, b) => b.visitors - a.visitors),
      byCountry: [...liveByCountry.entries()]
        .map(([country, visitors]) => ({ country, visitors }))
        .sort((a, b) => b.visitors - a.visitors),
    },
  };
}

/* ---------- Home feed (§9.3) ---------- */

export type HomeFeed = {
  unfulfilledCount: number;
  lowStock: Array<{ productTitle: string; option: string; onHand: number }>;
  abandonedLastDay: number;
};

/**
 * The Home dashboard's "things to do" numbers: unfulfilled paid orders, the
 * 5 lowest-stock tracked variants at or under the low_stock_threshold
 * setting, and checkouts abandoned in the last day (open for 1–24 hours).
 *
 * @param now - Reference time; defaults to the current time.
 */
export async function homeFeed(now = new Date()): Promise<HomeFeed> {
  const [orders, variants, products, checkouts, settings] = await Promise.all([
    cachedAll("orders"),
    cachedAll("product_variants"),
    cachedAll("products"),
    cachedAll("checkouts"),
    cachedAll("settings"),
  ]);
  const threshold =
    (settings.find((row) => row.key === "low_stock_threshold")?.value as number) ?? 10;
  const titleById = new Map(products.map((product) => [product.id, product.title]));
  const dayAgo = now.getTime() - 24 * 60 * 60 * 1000;
  const hourAgo = now.getTime() - 60 * 60 * 1000;

  return {
    unfulfilledCount: orders.filter(
      (order) =>
        order.fulfillment_status === "unfulfilled" &&
        !order.cancelled_at &&
        order.financial_status !== "pending",
    ).length,
    lowStock: variants
      .filter((variant) => variant.track_quantity && variant.inventory_on_hand <= threshold)
      .sort((a, b) => a.inventory_on_hand - b.inventory_on_hand)
      .slice(0, 5)
      .map((variant) => ({
        productTitle: titleById.get(variant.product_id) ?? variant.product_id,
        option: variant.option_values.join(" / "),
        onHand: variant.inventory_on_hand,
      })),
    abandonedLastDay: checkouts.filter(
      (checkout) =>
        checkout.status === "open" &&
        new Date(checkout.created_at).getTime() >= dayAgo &&
        new Date(checkout.created_at).getTime() <= hourAgo,
    ).length,
  };
}

/* ---------- ⌘K global search (§9.1) ---------- */

export type SearchResults = {
  orders: Array<{ id: string; label: string; sublabel: string }>;
  products: Array<{ id: string; label: string; sublabel: string }>;
  customers: Array<{ id: string; label: string; sublabel: string }>;
};

/**
 * ⌘K global search: case-insensitive substring match over orders (name,
 * number, email), products (title or variant SKU), and customers (name or
 * email) — up to 5 hits per group.
 *
 * @param query - Raw search text; blank returns three empty lists.
 */
export async function searchAdmin(query: string): Promise<SearchResults> {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return { orders: [], products: [], customers: [] };
  }
  const [orders, products, variants, customers] = await Promise.all([
    cachedAll("orders"),
    cachedAll("products"),
    cachedAll("product_variants"),
    cachedAll("customers"),
  ]);

  const orderHits = orders
    .filter(
      (order) =>
        order.name.toLowerCase().includes(needle) ||
        String(order.number).includes(needle) ||
        order.email?.toLowerCase().includes(needle),
    )
    .slice(0, 5)
    .map((order) => ({
      id: order.id,
      label: order.name,
      sublabel: `${order.email ?? "—"} · $${((order.total_cents - order.refunded_cents) / 100).toFixed(2)}`,
    }));

  const skuMatch = new Set(
    variants
      .filter((variant) => variant.sku.toLowerCase().includes(needle))
      .map((variant) => variant.product_id),
  );
  const productHits = products
    .filter(
      (product) => product.title.toLowerCase().includes(needle) || skuMatch.has(product.id),
    )
    .slice(0, 5)
    .map((product) => ({
      id: product.id,
      label: product.title,
      sublabel: product.status,
    }));

  const customerHits = customers
    .filter(
      (customer) =>
        customer.email.toLowerCase().includes(needle) ||
        `${customer.first_name} ${customer.last_name}`.toLowerCase().includes(needle),
    )
    .slice(0, 5)
    .map((customer) => ({
      id: customer.id,
      label: `${customer.first_name} ${customer.last_name}`.trim() || customer.email,
      sublabel: customer.email,
    }));

  return { orders: orderHits, products: productHits, customers: customerHits };
}

/* ---------- Notifications bell (§9.1) ---------- */

export type AdminAlert = { message: string; url: string };

/**
 * Notification-bell feed: the 5 newest system order events (prefixed with
 * the order name) plus up to 3 low-stock warnings, capped at 8 alerts.
 */
export async function adminAlerts(): Promise<AdminAlert[]> {
  const [orders, events] = await Promise.all([
    cachedAll("orders"),
    cachedAll("order_events"),
  ]);
  const feed = await homeFeed();
  const orderById = new Map(orders.map((order) => [order.id, order]));

  const alerts: AdminAlert[] = events
    .filter((event) => event.kind === "system")
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 5)
    .map((event) => {
      const order = orderById.get(event.order_id);
      return {
        message: `${order?.name ?? ""} ${event.message}`.trim(),
        url: `/admin/orders/${event.order_id}`,
      };
    });

  for (const variant of feed.lowStock.slice(0, 3)) {
    alerts.push({
      message: `Low stock: ${variant.productTitle}${variant.option ? ` (${variant.option})` : ""} — ${variant.onHand} left`,
      url: "/admin/products/inventory",
    });
  }
  return alerts.slice(0, 8);
}
