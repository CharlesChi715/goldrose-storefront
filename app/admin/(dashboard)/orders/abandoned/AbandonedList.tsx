"use client";

/**
 * ROLE OF THIS FILE
 * Client half of the abandoned-checkouts list (§9.4) — read-only.
 */

import { Banner, BlockStack, Card, IndexTable, Page, Text } from "@shopify/polaris";
import { formatMoney } from "@/lib/money";
import { useAdminT } from "../../../PolarisShell";

export type AbandonedItem = {
  id: string;
  createdAt: string;
  email: string | null;
  itemsLabel: string;
  totalCents: number;
  ageHours: number;
};

export function AbandonedList({ items }: { items: AbandonedItem[] }) {
  const t = useAdminT();

  return (
    <Page title={t("nav.orders.abandoned")} backAction={{ url: "/admin/orders" }}>
      <BlockStack gap="300">
        <Banner tone="info">{t("abandoned.recoveryNote")}</Banner>
        <Card padding="0">
          <IndexTable
            resourceName={{
              singular: t("nav.orders.abandoned"),
              plural: t("nav.orders.abandoned"),
            }}
            itemCount={items.length}
            selectable={false}
            emptyState={
              <div style={{ padding: 24 }}>
                <Text as="p" tone="subdued" alignment="center">
                  {t("abandoned.empty")}
                </Text>
              </div>
            }
            headings={[
              { title: t("abandoned.column.date") },
              { title: t("abandoned.column.email") },
              { title: t("abandoned.column.items") },
              { title: t("abandoned.column.total"), alignment: "end" },
            ]}
          >
            {items.map((item, index) => (
              <IndexTable.Row id={item.id} key={item.id} position={index}>
                <IndexTable.Cell>
                  {new Date(item.createdAt).toLocaleString()} ({item.ageHours}h)
                </IndexTable.Cell>
                <IndexTable.Cell>{item.email ?? "—"}</IndexTable.Cell>
                <IndexTable.Cell>{item.itemsLabel}</IndexTable.Cell>
                <IndexTable.Cell>
                  <Text as="span" alignment="end" numeric>
                    {formatMoney(item.totalCents)}
                  </Text>
                </IndexTable.Cell>
              </IndexTable.Row>
            ))}
          </IndexTable>
        </Card>
      </BlockStack>
    </Page>
  );
}
