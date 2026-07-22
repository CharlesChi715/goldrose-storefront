"use client";

/**
 * ROLE OF THIS FILE
 * Client half of the customers list (§9.7).
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, IndexTable, Page, Text, TextField } from "@shopify/polaris";
import { formatMoney } from "@/lib/money";
import { useAdminT } from "../../PolarisShell";

export type CustomerListItem = {
  id: string;
  name: string;
  email: string;
  location: string;
  ordersCount: number;
  totalSpentCents: number;
};

export function CustomersList({ items }: { items: CustomerListItem[] }) {
  const t = useAdminT();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return items;
    }
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(needle) || item.email.toLowerCase().includes(needle),
    );
  }, [items, query]);

  return (
    <Page
      title={t("nav.customers")}
      secondaryActions={[{ content: t("customers.export"), url: "/api/admin/customers/export" }]}
    >
      <Card padding="0">
        <div style={{ padding: "12px 12px 8px" }}>
          <TextField
            label=""
            labelHidden
            placeholder={t("customers.search.placeholder")}
            value={query}
            onChange={setQuery}
            autoComplete="off"
            clearButton
            onClearButtonClick={() => setQuery("")}
          />
        </div>
        <IndexTable
          resourceName={{ singular: t("customers.column.name"), plural: t("nav.customers") }}
          itemCount={filtered.length}
          selectable={false}
          emptyState={
            <div style={{ padding: 24 }}>
              <Text as="p" tone="subdued" alignment="center">
                {t("customers.empty")}
              </Text>
            </div>
          }
          headings={[
            { title: t("customers.column.name") },
            { title: t("customers.column.location") },
            { title: t("customers.column.orders"), alignment: "end" },
            { title: t("customers.column.spent"), alignment: "end" },
          ]}
        >
          {filtered.map((item, index) => (
            <IndexTable.Row
              id={item.id}
              key={item.id}
              position={index}
              onClick={() => router.push(`/admin/customers/${item.id}`)}
            >
              <IndexTable.Cell>
                <Text as="span" fontWeight="semibold">
                  {item.name}
                </Text>
                <Text as="p" tone="subdued" variant="bodySm">
                  {item.email}
                </Text>
              </IndexTable.Cell>
              <IndexTable.Cell>{item.location || "—"}</IndexTable.Cell>
              <IndexTable.Cell>
                <Text as="span" alignment="end" numeric>
                  {item.ordersCount}
                </Text>
              </IndexTable.Cell>
              <IndexTable.Cell>
                <Text as="span" alignment="end" numeric>
                  {formatMoney(item.totalSpentCents)}
                </Text>
              </IndexTable.Cell>
            </IndexTable.Row>
          ))}
        </IndexTable>
      </Card>
    </Page>
  );
}
