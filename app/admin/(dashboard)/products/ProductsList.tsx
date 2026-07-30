"use client";

/**
 * ROLE OF THIS FILE
 * Client half of the products list (§9.5): All/Active/Draft/Archived tabs,
 * text filter, IndexTable with thumbnail/status/inventory columns, bulk
 * status/archive/delete (red-confirm modal), CSV export.
 */

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Card,
  IndexTable,
  Modal,
  Page,
  Tabs,
  Text,
  TextField,
  Thumbnail,
  useIndexResourceState,
} from "@shopify/polaris";
import { ImageIcon } from "@shopify/polaris-icons";
import { interpolate } from "@/lib/admin/i18n";
import { useAdminT } from "../../PolarisShell";
import { deleteProductsAction, setProductStatusAction } from "./actions";

export type ProductListItem = {
  id: string;
  title: string;
  status: "active" | "draft" | "archived";
  productType: string;
  vendor: string;
  thumbnailUrl: string | null;
  variantCount: number;
  totalOnHand: number;
  tracked: boolean;
  sku: string;
};

const STATUS_TONE = {
  active: "success",
  draft: "info",
  archived: undefined,
} as const;

export function ProductsList({ items }: { items: ProductListItem[] }) {
  const t = useAdminT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const tabs = [
    { id: "all", content: t("products.tabs.all") },
    { id: "active", content: t("products.tabs.active") },
    { id: "draft", content: t("products.tabs.draft") },
    { id: "archived", content: t("products.tabs.archived") },
  ];

  const filtered = useMemo(() => {
    const status = tabs[tab].id;
    return items.filter((item) => {
      if (status !== "all" && item.status !== status) {
        return false;
      }
      const needle = query.trim().toLowerCase();
      if (!needle) {
        return true;
      }
      return (
        item.title.toLowerCase().includes(needle) ||
        item.vendor.toLowerCase().includes(needle) ||
        item.productType.toLowerCase().includes(needle)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, tab, query]);

  const {
    selectedResources,
    allResourcesSelected,
    handleSelectionChange,
    clearSelection,
  } = useIndexResourceState(
    filtered as unknown as { [key: string]: unknown }[],
  );

  function runBulk(action: () => Promise<void>) {
    startTransition(async () => {
      await action();
      clearSelection();
      router.refresh();
    });
  }

  const bulkActions = [
    {
      content: t("products.bulk.setActive"),
      onAction: () =>
        runBulk(() => setProductStatusAction(selectedResources, "active")),
    },
    {
      content: t("products.bulk.setDraft"),
      onAction: () =>
        runBulk(() => setProductStatusAction(selectedResources, "draft")),
    },
    {
      content: t("products.bulk.archive"),
      onAction: () =>
        runBulk(() => setProductStatusAction(selectedResources, "archived")),
    },
    {
      content: t("products.bulk.delete"),
      destructive: true,
      onAction: () => setConfirmDelete(true),
    },
  ];

  function inventoryLabel(item: ProductListItem): string {
    if (!item.tracked) {
      return t("products.inventory.untracked");
    }
    if (item.variantCount <= 1) {
      return interpolate(t("products.inventory.summaryOne"), {
        available: item.totalOnHand,
      });
    }
    return interpolate(t("products.inventory.summary"), {
      available: item.totalOnHand,
      count: item.variantCount,
    });
  }

  return (
    <Page
      title={t("nav.products")}
      primaryAction={{ content: t("products.add"), url: "/admin/products/new" }}
      secondaryActions={[
        { content: t("products.export"), url: "/api/admin/products/export" },
      ]}
    >
      <Card padding="0">
        <Tabs tabs={tabs} selected={tab} onSelect={setTab} />
        <div style={{ padding: "0 12px 8px" }}>
          <TextField
            label=""
            labelHidden
            placeholder={t("products.search.placeholder")}
            value={query}
            onChange={setQuery}
            autoComplete="off"
            clearButton
            onClearButtonClick={() => setQuery("")}
          />
        </div>
        <IndexTable
          resourceName={{
            singular: t("products.column.product"),
            plural: t("nav.products"),
          }}
          itemCount={filtered.length}
          selectedItemsCount={
            allResourcesSelected ? "All" : selectedResources.length
          }
          onSelectionChange={handleSelectionChange}
          promotedBulkActions={bulkActions}
          loading={pending}
          emptyState={
            <div style={{ padding: 24 }}>
              <Text as="p" tone="subdued" alignment="center">
                {t("products.empty")}
              </Text>
            </div>
          }
          headings={[
            { title: "" },
            { title: t("products.column.product") },
            { title: t("products.column.status") },
            { title: t("products.column.inventory") },
            { title: t("products.column.category") },
            { title: t("products.column.vendor") },
          ]}
        >
          {filtered.map((item, index) => (
            <IndexTable.Row
              id={item.id}
              key={item.id}
              position={index}
              selected={selectedResources.includes(item.id)}
              onClick={() => router.push(`/admin/products/${item.id}`)}
            >
              <IndexTable.Cell>
                <Thumbnail
                  source={item.thumbnailUrl ?? ImageIcon}
                  alt={item.title}
                  size="small"
                />
              </IndexTable.Cell>
              <IndexTable.Cell>
                <Text as="span" fontWeight="semibold">
                  {item.title}
                </Text>
              </IndexTable.Cell>
              <IndexTable.Cell>
                <Badge tone={STATUS_TONE[item.status]}>
                  {t(`products.status.${item.status}`)}
                </Badge>
              </IndexTable.Cell>
              <IndexTable.Cell>{inventoryLabel(item)}</IndexTable.Cell>
              <IndexTable.Cell>{item.productType}</IndexTable.Cell>
              <IndexTable.Cell>{item.vendor}</IndexTable.Cell>
            </IndexTable.Row>
          ))}
        </IndexTable>
      </Card>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={t("products.delete.title")}
        primaryAction={{
          content: t("products.delete.confirm"),
          destructive: true,
          loading: pending,
          onAction: () =>
            runBulk(async () => {
              await deleteProductsAction(selectedResources);
              setConfirmDelete(false);
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
          <Text as="p">{t("products.delete.body")}</Text>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
