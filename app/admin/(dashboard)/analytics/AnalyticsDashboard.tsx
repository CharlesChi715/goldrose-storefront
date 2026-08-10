"use client";

/**
 * ROLE OF THIS FILE
 * Client half of /admin/analytics (§9.9): Shopify's dashboard grid with
 * compare-to-previous badges, the sales chart, the conversion funnel, and
 * the live "Visitors right now" card.
 */

import { useEffect } from "react";
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
import { formatMoney } from "@/lib/money";
import type {
  AnalyticsSummary,
  MetricPair,
  RangeKey,
} from "@/lib/admin/analytics";
import { useAdminLang, useAdminT } from "../../PolarisShell";
import { SalesChart } from "../SalesChart";

function DeltaBadge({ pair }: { pair: MetricPair }) {
  if (pair.previous === 0) {
    return null;
  }
  const delta = Math.round(
    ((pair.current - pair.previous) / pair.previous) * 100,
  );
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

/**
 * Milliseconds as a short human duration — "8s", "2m 14s".
 * Dwell numbers are read at a glance; raw ms would make the card unreadable.
 */
function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`;
}

function ListCard({
  title,
  rows,
  empty,
  caption,
}: {
  title: string;
  rows: Array<{ label: string; value: string }>;
  empty: string;
  /** One line under the title explaining what the row numbers mean. Engagement
   *  rows read like "42s · 73%", which is unreadable without a key. */
  caption?: string;
}) {
  return (
    <Card>
      <BlockStack gap="200">
        <Text as="h3" variant="headingSm">
          {title}
        </Text>
        {caption ? (
          <Text as="p" variant="bodySm" tone="subdued">
            {caption}
          </Text>
        ) : null}
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
  const lang = useAdminLang();
  const router = useRouter();

  // The beacon stores ISO country codes ("US"); seeds may hold full names,
  // which DisplayNames rejects — show those (and anything unparseable) as-is.
  const countryName = (code: string): string => {
    if (code === "Unknown") {
      return t("analytics.unknown");
    }
    try {
      return (
        new Intl.DisplayNames([lang === "zh" ? "zh-CN" : "en"], {
          type: "region",
        }).of(code) ?? code
      );
    } catch {
      return code;
    }
  };
  const channelName = (channel: string): string =>
    channel === "Direct" ? t("analytics.channel.direct") : channel;

  // Live attribution card: re-pull server data every 30s while the tab is
  // visible so "who is on the site right now" stays current without F5.
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }, 30_000);
    return () => clearInterval(id);
  }, [router]);

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
          <Card>
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm" tone="subdued">
                {t("analytics.card.visitorsNow")}
              </Text>
              <Text as="p" variant="headingLg">
                {String(summary.liveVisitors.total)}
              </Text>
              {summary.liveVisitors.total > 0 ? (
                <>
                  <Divider />
                  <BlockStack gap="100">
                    {summary.liveVisitors.byChannel.slice(0, 4).map((row) => (
                      <InlineStack key={row.channel} align="space-between">
                        <Text as="span" variant="bodySm">
                          {channelName(row.channel)}
                        </Text>
                        <Text as="span" variant="bodySm" numeric>
                          {row.visitors}
                        </Text>
                      </InlineStack>
                    ))}
                    {summary.liveVisitors.byCountry.slice(0, 4).map((row) => (
                      <InlineStack key={row.country} align="space-between">
                        <Text as="span" variant="bodySm">
                          {countryName(row.country)}
                        </Text>
                        <Text as="span" variant="bodySm" numeric>
                          {row.visitors}
                        </Text>
                      </InlineStack>
                    ))}
                  </BlockStack>
                </>
              ) : null}
              <Text as="p" variant="bodySm" tone="subdued">
                {t("analytics.live.autoRefresh")}
              </Text>
            </BlockStack>
          </Card>
        </InlineGrid>

        {/* Engagement (engagement-tracking.md): how long visits lasted and
            which named sections held attention. */}
        <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
          <ListCard
            title={t("analytics.card.timeOnPage")}
            caption={`${t("analytics.engagement.average")}: ${formatDuration(
              summary.engagement.averageActiveMs.current,
            )} · ${summary.engagement.measuredVisits} ${t(
              "analytics.engagement.measured",
            )}. ${t("analytics.engagement.captionTime")}`}
            empty={t("analytics.engagement.empty")}
            rows={summary.engagement.byPath.map((row) => ({
              label: `${row.path} (${row.visits})`,
              value: `${formatDuration(row.averageActiveMs)} · ${row.averageScrollPct}%`,
            }))}
          />
          <ListCard
            title={t("analytics.card.sectionAttention")}
            caption={t("analytics.engagement.captionSections")}
            empty={t("analytics.engagement.emptySections")}
            rows={summary.engagement.sections.map((row) => ({
              label: row.section,
              value: `${formatDuration(row.averageMs)} · ${row.reachRatePercent}%`,
            }))}
          />
          <ListCard
            title={t("analytics.card.dropOff")}
            caption={t("analytics.engagement.captionDropOff")}
            empty={t("analytics.engagement.emptySections")}
            rows={summary.engagement.dropOff.map((row) => ({
              label: row.section,
              value: `${row.visits} · ${row.sharePercent}%`,
            }))}
          />
        </InlineGrid>

        {/* Search (storefront-search.md OQ-1): what shoppers asked for, and
            what they asked for and did not find. The two lists are separate on
            purpose — a failing query is almost never a popular one, so ranked
            together it would sit below the fold, which is where nobody looks. */}
        <InlineGrid columns={{ xs: 1, sm: 2 }} gap="400">
          <StatCard
            title={t("analytics.card.searches")}
            value={String(summary.search.totalSearches.current)}
            pair={summary.search.totalSearches}
          />
          <StatCard
            title={t("analytics.card.zeroResultRate")}
            value={`${summary.search.zeroResultRatePercent.current}%`}
            pair={summary.search.zeroResultRatePercent}
          />
        </InlineGrid>
        <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
          <ListCard
            title={t("analytics.card.topQueries")}
            caption={`${summary.search.distinctQueries} ${t(
              "analytics.search.distinct",
            )}. ${t("analytics.search.captionTop")}`}
            empty={t("analytics.search.empty")}
            rows={summary.search.topQueries.map((row) => ({
              label: `${row.display} (${row.searches})`,
              value: `${row.averageResults}`,
            }))}
          />
          <ListCard
            title={t("analytics.card.zeroResultQueries")}
            caption={t("analytics.search.captionZero")}
            empty={
              summary.search.totalSearches.current > 0
                ? t("analytics.search.emptyZero")
                : t("analytics.search.empty")
            }
            rows={summary.search.zeroResultQueries.map((row) => ({
              label: row.display,
              value: String(row.searches),
            }))}
          />
        </InlineGrid>

        <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
          <ListCard
            title={t("analytics.card.sessionsByChannel")}
            empty={t("analytics.empty")}
            rows={summary.trafficByChannel.map((row) => ({
              label: channelName(row.channel),
              value: String(row.sessions),
            }))}
          />
          <ListCard
            title={t("analytics.card.sessionsByCountry")}
            empty={t("analytics.empty")}
            rows={summary.trafficByCountry.map((row) => ({
              label: countryName(row.country),
              value: String(row.sessions),
            }))}
          />
          <ListCard
            title={t("analytics.card.sessionsByCampaign")}
            empty={t("analytics.emptyCampaign")}
            rows={summary.trafficByCampaign.map((row) => ({
              label: row.campaign,
              value: String(row.sessions),
            }))}
          />
          <ListCard
            title={t("analytics.card.sessionsByAccount")}
            empty={t("analytics.emptyAccount")}
            rows={summary.trafficByAccount.map((row) => ({
              label: row.account,
              value: String(row.sessions),
            }))}
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
          <ListCard
            title={t("analytics.card.salesByAccount")}
            empty={t("analytics.emptyAccount")}
            rows={summary.salesByAccount.map((row) => ({
              label: `${row.account} (${row.orders})`,
              value: formatMoney(row.salesCents),
            }))}
          />
        </InlineGrid>
      </BlockStack>
    </Page>
  );
}
