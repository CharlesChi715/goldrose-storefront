"use client";

/**
 * ROLE OF THIS FILE
 * Client half of /admin/analytics (§9.9): Shopify's dashboard grid with
 * compare-to-previous badges, the sales chart, the conversion funnel, and
 * the live "Visitors right now" card.
 */

import { useRouter } from "next/navigation";
import {
  Badge,
  BlockStack,
  Card,
  Divider,
  InlineGrid,
  InlineStack,
  Page,
  Select,
  Text,
} from "@shopify/polaris";
import { formatMoney } from "@/lib/products";
import type { AnalyticsSummary, MetricPair, RangeKey } from "@/lib/admin/analytics";
import { useAdminT } from "../../PolarisShell";
import { SalesChart } from "../SalesChart";

function DeltaBadge({ pair }: { pair: MetricPair }) {
  if (pair.previous === 0) {
    return null;
  }
  const delta = Math.round(((pair.current - pair.previous) / pair.previous) * 100);
  return (
    <Badge tone={delta >= 0 ? "success" : "critical"}>
      {`${delta >= 0 ? "+" : ""}${delta}%`}
    </Badge>
  );
}

function StatCard({
  title,
  value,
  pair,
}: {
  title: string;
  value: string;
  pair?: MetricPair;
}) {
  return (
    <Card>
      <BlockStack gap="100">
        <Text as="h3" variant="headingSm" tone="subdued">
          {title}
        </Text>
        <InlineStack gap="200" blockAlign="center">
          <Text as="p" variant="headingLg">
            {value}
          </Text>
          {pair ? <DeltaBadge pair={pair} /> : null}
        </InlineStack>
      </BlockStack>
    </Card>
  );
}

function ListCard({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: Array<{ label: string; value: string }>;
  empty: string;
}) {
  return (
    <Card>
      <BlockStack gap="200">
        <Text as="h3" variant="headingSm">
          {title}
        </Text>
        {rows.length === 0 ? (
          <Text as="p" tone="subdued">
            {empty}
          </Text>
        ) : (
          <BlockStack gap="150">
            {rows.map((row, index) => (
              <InlineStack key={index} align="space-between">
                <Text as="span">{row.label}</Text>
                <Text as="span" numeric>
                  {row.value}
                </Text>
              </InlineStack>
            ))}
          </BlockStack>
        )}
      </BlockStack>
    </Card>
  );
}

export function AnalyticsDashboard({
  range,
  summary,
}: {
  range: RangeKey;
  summary: AnalyticsSummary;
}) {
  const t = useAdminT();
  const router = useRouter();

  return (
    <Page
      title={t("nav.analytics")}
      subtitle={t("analytics.compare")}
      primaryAction={
        <Select
          label={t("analytics.range.label")}
          labelHidden
          options={[
            { label: t("home.range.today"), value: "today" },
            { label: t("home.range.7d"), value: "7d" },
            { label: t("home.range.30d"), value: "30d" },
            { label: t("home.range.90d"), value: "90d" },
          ]}
          value={range}
          onChange={(value) => router.push(`/admin/analytics?range=${value}`)}
        />
      }
    >
      <BlockStack gap="400">
        <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
          <StatCard
            title={t("analytics.card.totalSales")}
            value={formatMoney(summary.totalSalesCents.current)}
            pair={summary.totalSalesCents}
          />
          <StatCard
            title={t("analytics.card.orders")}
            value={String(summary.ordersCount.current)}
            pair={summary.ordersCount}
          />
          <StatCard
            title={t("analytics.card.aov")}
            value={formatMoney(summary.aovCents.current)}
            pair={summary.aovCents}
          />
          <StatCard
            title={t("analytics.card.returning")}
            value={`${summary.returningRatePercent.current}%`}
            pair={summary.returningRatePercent}
          />
        </InlineGrid>

        <Card>
          <BlockStack gap="200">
            <Text as="h3" variant="headingSm">
              {t("analytics.card.totalSales")}
            </Text>
            <SalesChart data={summary.salesOverTime} />
          </BlockStack>
        </Card>

        <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
          <StatCard
            title={t("analytics.card.sessions")}
            value={String(summary.sessions.current)}
            pair={summary.sessions}
          />
          <Card>
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm" tone="subdued">
                {t("analytics.card.conversion")}
              </Text>
              <InlineStack gap="200" blockAlign="center">
                <Text as="p" variant="headingLg">
                  {summary.conversion.ratePercent.current}%
                </Text>
                <DeltaBadge pair={summary.conversion.ratePercent} />
              </InlineStack>
              <Divider />
              <BlockStack gap="100">
                <InlineStack align="space-between">
                  <Text as="span" variant="bodySm">
                    {t("analytics.funnel.sessions")}
                  </Text>
                  <Text as="span" variant="bodySm" numeric>
                    {summary.conversion.sessions}
                  </Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="span" variant="bodySm">
                    {t("analytics.funnel.checkout")}
                  </Text>
                  <Text as="span" variant="bodySm" numeric>
                    {summary.conversion.reachedCheckout}
                  </Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="span" variant="bodySm">
                    {t("analytics.funnel.purchased")}
                  </Text>
                  <Text as="span" variant="bodySm" numeric>
                    {summary.conversion.purchased}
                  </Text>
                </InlineStack>
              </BlockStack>
            </BlockStack>
          </Card>
          <StatCard
            title={t("analytics.card.visitorsNow")}
            value={String(summary.visitorsRightNow)}
          />
        </InlineGrid>

        <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
          <ListCard
            title={t("analytics.card.topProducts")}
            empty={t("analytics.empty")}
            rows={summary.topProducts.map((row) => ({
              label: `${row.name} × ${row.quantity}`,
              value: formatMoney(row.salesCents),
            }))}
          />
          <ListCard
            title={t("analytics.card.salesByCountry")}
            empty={t("analytics.empty")}
            rows={summary.salesByCountry.map((row) => ({
              label: `${row.country} (${row.orders})`,
              value: formatMoney(row.salesCents),
            }))}
          />
          <ListCard
            title={t("analytics.card.salesByDiscount")}
            empty={t("analytics.empty")}
            rows={summary.salesByDiscount.map((row) => ({
              label: `${row.code} (${row.orders})`,
              value: formatMoney(row.salesCents),
            }))}
          />
          <ListCard
            title={t("analytics.card.salesBySource")}
            empty={t("analytics.empty")}
            rows={summary.salesBySource.map((row) => ({
              label: `${row.source} (${row.orders})`,
              value: formatMoney(row.salesCents),
            }))}
          />
        </InlineGrid>
      </BlockStack>
    </Page>
  );
}
