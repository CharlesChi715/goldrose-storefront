"use client";

/**
 * ROLE OF THIS FILE
 * Client half of the discounts list (§9.10).
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Card,
  IndexTable,
  Modal,
  Page,
  Text,
  useIndexResourceState,
} from "@shopify/polaris";
import { useAdminT } from "../../PolarisShell";
import { deleteDiscountsAction } from "./actions";

export type DiscountListItem = {
  id: string;
  code: string;
  type: "percentage" | "fixed_amount" | "free_shipping";
  appliesToProducts: boolean;
  value: number;
  status: "active" | "scheduled" | "expired";
  usedCount: number;
  usageLimit: number | null;
};

const STATUS_TONE = {
  active: "success",
  scheduled: "info",
  expired: undefined,
} as const;

export function DiscountsList({ items }: { items: DiscountListItem[] }) {
  const t = useAdminT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    selectedResources,
    allResourcesSelected,
    handleSelectionChange,
    clearSelection,
  } = useIndexResourceState(items as unknown as { [key: string]: unknown }[]);

  function typeLabel(item: DiscountListItem): string {
    if (item.type === "free_shipping") {
      return t("discounts.type.shipping");
    }
    const category = item.appliesToProducts
      ? t("discounts.type.products")
      : t("discounts.type.order");
    const value =
      item.type === "percentage"
        ? `${item.value}%`
        : `$${(item.value / 100).toFixed(2)}`;
    return `${category} · ${value}`;
  }

  return (
    <Page
      title={t("nav.discounts")}
      primaryAction={{
        content: t("discounts.create"),
        url: "/admin/discounts/new",
      }}
    >
      <Card padding="0">
        <IndexTable
          resourceName={{
            singular: t("discounts.column.code"),
            plural: t("nav.discounts"),
          }}
          itemCount={items.length}
          selectedItemsCount={
            allResourcesSelected ? "All" : selectedResources.length
          }
          onSelectionChange={handleSelectionChange}
          loading={pending}
          promotedBulkActions={[
            {
              content: t("discounts.delete.confirm"),
              onAction: () => setConfirmDelete(true),
            },
          ]}
          emptyState={
            <div style={{ padding: 24 }}>
              <Text as="p" tone="subdued" alignment="center">
                {t("discounts.empty")}
              </Text>
            </div>
          }
          headings={[
            { title: t("discounts.column.code") },
            { title: t("discounts.column.type") },
            { title: t("discounts.column.status") },
            { title: t("discounts.column.used"), alignment: "end" },
          ]}
        >
          {items.map((item, index) => (
            <IndexTable.Row
              id={item.id}
              key={item.id}
              position={index}
              selected={selectedResources.includes(item.id)}
              onClick={() => router.push(`/admin/discounts/${item.id}`)}
            >
              <IndexTable.Cell>
                <Text as="span" fontWeight="semibold">
                  {item.code}
                </Text>
              </IndexTable.Cell>
              <IndexTable.Cell>{typeLabel(item)}</IndexTable.Cell>
              <IndexTable.Cell>
                <Badge tone={STATUS_TONE[item.status]}>
                  {t(`discounts.status.${item.status}`)}
                </Badge>
              </IndexTable.Cell>
              <IndexTable.Cell>
                <Text as="span" alignment="end" numeric>
                  {item.usedCount}
                  {item.usageLimit !== null ? ` / ${item.usageLimit}` : ""}
                </Text>
              </IndexTable.Cell>
            </IndexTable.Row>
          ))}
        </IndexTable>
      </Card>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={t("discounts.delete.title")}
        primaryAction={{
          content: t("discounts.delete.confirm"),
          destructive: true,
          loading: pending,
          onAction: () =>
            startTransition(async () => {
              await deleteDiscountsAction(selectedResources);
              clearSelection();
              setConfirmDelete(false);
              router.refresh();
            }),
        }}
        secondaryActions={[
          {
            content: t("common.cancel"),
            onAction: () => setConfirmDelete(false),
          },
        ]}
      >
        <Modal.Section>
          <Text as="p">{t("discounts.delete.body")}</Text>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
