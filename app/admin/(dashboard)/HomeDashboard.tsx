"use client";

/**
 * ROLE OF THIS FILE
 * Client half of the Home dashboard (§9.3): metric cards + polaris-viz
 * sales chart + "things to do" feed.
 */

import {
  BlockStack,
  Card,
  InlineGrid,
  InlineStack,
  Link as PolarisLink,
  Page,
  Text,
} from "@shopify/polaris";
import { formatMoney } from "@/lib/money";
import { interpolate } from "@/lib/admin/i18n";
import type { HomeFeed } from "@/lib/admin/analytics";
import { useAdminT } from "../PolarisShell";
import { SalesChart } from "./SalesChart";

type Metric = { salesCents: number; orders: number };

function MetricCard({
  title,
  metric,
  t,
}: {
  title: string;
  metric: Metric;
  t: ReturnType<typeof useAdminT>;
}) {
  return (
    <Card>
      <BlockStack gap="100">
        <Text as="h3" variant="headingSm" tone="subdued">
          {title}
        </Text>
        <Text as="p" variant="headingLg">
          {formatMoney(metric.salesCents)}
        </Text>
        <Text as="p" tone="subdued" variant="bodySm">
          {interpolate(t("home.metric.orders"), { count: metric.orders })}
        </Text>
      </BlockStack>
    </Card>
  );
}

export function HomeDashboard({
  today,
  week,
  month,
  sessions,
  conversionRate,
  salesOverTime,
  feed,
}: {
  today: Metric;
  week: Metric;
  month: Metric;
  sessions: number;
  conversionRate: number;
  salesOverTime: Array<{ date: string; salesCents: number }>;
  feed: HomeFeed;
}) {
  const t = useAdminT();

  const todoItems: Array<{ message: string; url: string }> = [];
  if (feed.unfulfilledCount > 0) {
    todoItems.push({
      message: interpolate(t("home.todo.unfulfilled"), {
        count: feed.unfulfilledCount,
      }),
      url: "/admin/orders",
    });
  }
  for (const item of feed.lowStock) {
    todoItems.push({
      message: interpolate(t("home.todo.lowStock"), {
        label: `${item.productTitle}${item.option ? ` (${item.option})` : ""}`,
        count: item.onHand,
      }),
      url: "/admin/products/inventory",
    });
  }
  if (feed.abandonedLastDay > 0) {
    todoItems.push({
      message: interpolate(t("home.todo.abandoned"), {
        count: feed.abandonedLastDay,
      }),
      url: "/admin/orders/abandoned",
    });
  }

  return (
    <Page title={t("nav.home")}>
      <BlockStack gap="400">
        <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
          <MetricCard title={t("home.range.today")} metric={today} t={t} />
          <MetricCard title={t("home.range.7d")} metric={week} t={t} />
          <MetricCard title={t("home.range.30d")} metric={month} t={t} />
        </InlineGrid>

        <Card>
          <BlockStack gap="200">
            <Text as="h3" variant="headingSm">
              {t("analytics.card.totalSales")} — {t("home.range.30d")}
            </Text>
            <SalesChart data={salesOverTime} />
          </BlockStack>
        </Card>

        <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
          <Card>
            <BlockStack gap="100">
              <Text as="h3" variant="headingSm" tone="subdued">
                {t("analytics.card.sessions")} — {t("home.range.7d")}
              </Text>
              <Text as="p" variant="headingLg">
                {sessions}
              </Text>
            </BlockStack>
          </Card>
          <Card>
            <BlockStack gap="100">
              <Text as="h3" variant="headingSm" tone="subdued">
                {t("analytics.card.conversion")} — {t("home.range.7d")}
              </Text>
              <Text as="p" variant="headingLg">
                {conversionRate}%
              </Text>
            </BlockStack>
          </Card>
        </InlineGrid>

        <Card>
          <BlockStack gap="200">
            <Text as="h3" variant="headingSm">
              {t("home.todo.title")}
            </Text>
            {todoItems.length === 0 ? (
              <Text as="p" tone="subdued">
                {t("home.todo.none")}
              </Text>
            ) : (
              <BlockStack gap="150">
                {todoItems.map((item, index) => (
                  <InlineStack key={index} gap="200">
                    <PolarisLink url={item.url}>{item.message}</PolarisLink>
                  </InlineStack>
                ))}
              </BlockStack>
            )}
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
