"use client";

/**
 * ROLE OF THIS FILE
 * Client half of the drafts list (§9.4).
 */

import { useRouter } from "next/navigation";
import { Badge, Card, IndexTable, Page, Text } from "@shopify/polaris";
import { formatMoney } from "@/lib/money";
import { interpolate } from "@/lib/admin/i18n";
import { useAdminT } from "../../../PolarisShell";

export type DraftListItem = {
  id: string;
  name: string;
  placedAt: string;
  customerLabel: string;
  totalCents: number;
  financialStatus: string;
  itemCount: number;
};

export function DraftsList({ items }: { items: DraftListItem[] }) {
  const t = useAdminT();
  const router = useRouter();

  return (
    <Page
      title={t("nav.orders.drafts")}
      backAction={{ url: "/admin/orders" }}
      primaryAction={{ content: t("drafts.create"), url: "/admin/orders/drafts/new" }}
    >
      <Card padding="0">
        <IndexTable
          resourceName={{ singular: t("orders.column.order"), plural: t("nav.orders.drafts") }}
          itemCount={items.length}
          selectable={false}
          emptyState={
            <div style={{ padding: 24 }}>
              <Text as="p" tone="subdued" alignment="center">
                {t("drafts.empty")}
              </Text>
            </div>
          }
          headings={[
            { title: t("orders.column.order") },
            { title: t("orders.column.date") },
            { title: t("orders.column.customer") },
            { title: t("orders.column.total"), alignment: "end" },
            { title: t("orders.column.payment") },
            { title: t("orders.column.items") },
          ]}
        >
          {items.map((item, index) => (
            <IndexTable.Row
              id={item.id}
              key={item.id}
              position={index}
              onClick={() => router.push(`/admin/orders/${item.id}`)}
            >
              <IndexTable.Cell>
                <Text as="span" fontWeight="semibold">
                  {item.name}
                </Text>
              </IndexTable.Cell>
              <IndexTable.Cell>
                {new Date(item.placedAt).toLocaleDateString()}
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
                  {t(`orders.status.${item.financialStatus}` as never)}
                </Badge>
              </IndexTable.Cell>
              <IndexTable.Cell>
                {interpolate(t("orders.items.count"), { count: item.itemCount })}
              </IndexTable.Cell>
            </IndexTable.Row>
          ))}
        </IndexTable>
      </Card>
    </Page>
  );
}
