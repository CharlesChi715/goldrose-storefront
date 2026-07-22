"use client";

/**
 * ROLE OF THIS FILE
 * Client half of the orders list (§9.4): tabs (All/Unfulfilled/Unpaid/
 * Archived), text filter, IndexTable with payment/fulfillment badges and
 * the mock/site/draft source badge, bulk archive/unarchive, CSV export.
 */

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Card,
  IndexTable,
  Page,
  Tabs,
  Text,
  TextField,
  useIndexResourceState,
} from "@shopify/polaris";
import { formatMoney } from "@/lib/money";
import { interpolate } from "@/lib/admin/i18n";
import { useAdminT } from "../../PolarisShell";
import { archiveOrdersAction } from "./actions";

export type OrderListItem = {
  id: string;
  name: string;
  placedAt: string;
  customerLabel: string;
  totalCents: number;
  financialStatus: "pending" | "paid" | "partially_refunded" | "refunded";
  fulfillmentStatus: "unfulfilled" | "fulfilled";
  cancelled: boolean;
  archived: boolean;
  source: "mock" | "site" | "draft";
  itemCount: number;
};

export function OrdersList({ items }: { items: OrderListItem[] }) {
  const t = useAdminT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState("");

  const tabs = [
    { id: "all", content: t("orders.tabs.all") },
    { id: "unfulfilled", content: t("orders.tabs.unfulfilled") },
    { id: "unpaid", content: t("orders.tabs.unpaid") },
    { id: "archived", content: t("orders.tabs.archived") },
  ];

  const filtered = useMemo(() => {
    const mode = tabs[tab].id;
    return items.filter((item) => {
      if (mode === "archived") {
        if (!item.archived) return false;
      } else {
        if (item.archived) return false;
        if (mode === "unfulfilled" && (item.fulfillmentStatus !== "unfulfilled" || item.cancelled)) {
          return false;
        }
        if (mode === "unpaid" && item.financialStatus !== "pending") return false;
      }
      const needle = query.trim().toLowerCase();
      if (!needle) return true;
      return (
        item.name.toLowerCase().includes(needle) ||
        item.customerLabel.toLowerCase().includes(needle)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, tab, query]);

  const { selectedResources, allResourcesSelected, handleSelectionChange, clearSelection } =
    useIndexResourceState(filtered as unknown as { [key: string]: unknown }[]);

  const showingArchived = tabs[tab].id === "archived";

  return (
    <Page
      title={t("nav.orders")}
      secondaryActions={[{ content: t("orders.export"), url: "/api/admin/orders/export" }]}
    >
      <Card padding="0">
        <Tabs tabs={tabs} selected={tab} onSelect={setTab} />
        <div style={{ padding: "0 12px 8px" }}>
          <TextField
            label=""
            labelHidden
            placeholder={t("orders.search.placeholder")}
            value={query}
            onChange={setQuery}
            autoComplete="off"
            clearButton
            onClearButtonClick={() => setQuery("")}
          />
        </div>
        <IndexTable
          resourceName={{ singular: t("orders.column.order"), plural: t("nav.orders") }}
          itemCount={filtered.length}
          selectedItemsCount={allResourcesSelected ? "All" : selectedResources.length}
          onSelectionChange={handleSelectionChange}
          loading={pending}
          promotedBulkActions={[
            {
              content: showingArchived ? t("orders.bulk.unarchive") : t("orders.bulk.archive"),
              onAction: () =>
                startTransition(async () => {
                  await archiveOrdersAction(selectedResources, !showingArchived);
                  clearSelection();
                  router.refresh();
                }),
            },
          ]}
          emptyState={
            <div style={{ padding: 24 }}>
              <Text as="p" tone="subdued" alignment="center">
                {t("orders.empty")}
              </Text>
            </div>
          }
          headings={[
            { title: t("orders.column.order") },
            { title: t("orders.column.date") },
            { title: t("orders.column.customer") },
            { title: t("orders.column.total"), alignment: "end" },
            { title: t("orders.column.payment") },
            { title: t("orders.column.fulfillment") },
            { title: t("orders.column.items") },
            { title: t("orders.column.source") },
          ]}
        >
          {filtered.map((item, index) => (
            <IndexTable.Row
              id={item.id}
              key={item.id}
              position={index}
              selected={selectedResources.includes(item.id)}
              onClick={() => router.push(`/admin/orders/${item.id}`)}
            >
              <IndexTable.Cell>
                <Text as="span" fontWeight="semibold">
                  {item.name}
                </Text>
              </IndexTable.Cell>
              <IndexTable.Cell>
                {new Date(item.placedAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </IndexTable.Cell>
              <IndexTable.Cell>{item.customerLabel}</IndexTable.Cell>
              <IndexTable.Cell>
                <Text as="span" alignment="end" numeric>
                  {formatMoney(item.totalCents)}
                </Text>
              </IndexTable.Cell>
              <IndexTable.Cell>
                <Badge
                  tone={item.financialStatus === "paid" ? undefined : "warning"}
                  progress={item.financialStatus === "paid" ? "complete" : "partiallyComplete"}
                >
                  {t(`orders.status.${item.financialStatus}`)}
                </Badge>
              </IndexTable.Cell>
              <IndexTable.Cell>
                {item.cancelled ? (
                  <Badge tone="critical">{t("orders.status.cancelled")}</Badge>
                ) : (
                  <Badge
                    tone={item.fulfillmentStatus === "fulfilled" ? undefined : "attention"}
                    progress={item.fulfillmentStatus === "fulfilled" ? "complete" : "incomplete"}
                  >
                    {t(`orders.status.${item.fulfillmentStatus}`)}
                  </Badge>
                )}
              </IndexTable.Cell>
              <IndexTable.Cell>
                {interpolate(t("orders.items.count"), { count: item.itemCount })}
              </IndexTable.Cell>
              <IndexTable.Cell>
                <Badge tone={item.source === "mock" ? "info" : undefined}>
                  {t(`orders.source.${item.source}`)}
                </Badge>
              </IndexTable.Cell>
            </IndexTable.Row>
          ))}
        </IndexTable>
      </Card>
    </Page>
  );
}
