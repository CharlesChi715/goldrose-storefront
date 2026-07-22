/**
 * ROLE OF THIS FILE
 * /admin/analytics — the cloned Shopify analytics grid (§9.9): sales cards
 * from orders, behavior cards from the first-party beacon, date-range
 * picker with compare-to-previous-period. Range comes from ?range=.
 */

import { analyticsSummary, type RangeKey } from "@/lib/admin/analytics";
import { AnalyticsDashboard } from "./AnalyticsDashboard";

const RANGE_KEYS: RangeKey[] = ["today", "7d", "30d", "90d"];

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range: RangeKey = RANGE_KEYS.includes(params.range as RangeKey)
    ? (params.range as RangeKey)
    : "30d";
  const summary = await analyticsSummary(range);
  return <AnalyticsDashboard range={range} summary={summary} />;
}
