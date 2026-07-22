/**
 * ROLE OF THIS FILE
 * /admin — the cloned Shopify Home (§9.3): metric cards (today / 7 / 30
 * days), a sales chart, sessions + conversion cards from the first-party
 * beacon, and the "things to do" feed (unfulfilled orders, low stock,
 * abandoned checkouts).
 */

import { analyticsSummary, homeFeed } from "@/lib/admin/analytics";
import { HomeDashboard } from "./HomeDashboard";

export default async function AdminHomePage() {
  const [today, week, month, feed] = await Promise.all([
    analyticsSummary("today"),
    analyticsSummary("7d"),
    analyticsSummary("30d"),
    homeFeed(),
  ]);
  return (
    <HomeDashboard
      today={{ salesCents: today.totalSalesCents.current, orders: today.ordersCount.current }}
      week={{ salesCents: week.totalSalesCents.current, orders: week.ordersCount.current }}
      month={{ salesCents: month.totalSalesCents.current, orders: month.ordersCount.current }}
      sessions={week.sessions.current}
      conversionRate={week.conversion.ratePercent.current}
      salesOverTime={month.salesOverTime}
      feed={feed}
    />
  );
}
