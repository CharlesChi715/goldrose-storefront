"use client";

/**
 * ROLE OF THIS FILE
 * Client half of the inventory screen (§9.6): the four-column table, the
 * per-row Adjust popover (delta + Shopify reason dropdown + note), and the
 * "View adjustment history" modal.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BlockStack,
  Button,
  Card,
  IndexTable,
  InlineStack,
  Modal,
  Page,
  Popover,
  Select,
  Text,
  TextField,
} from "@shopify/polaris";
import {
  INVENTORY_REASONS,
  type InventoryReason,
} from "@/lib/supabase/types.ts";
import { useAdminT } from "../../../PolarisShell";
import {
  adjustInventoryAction,
  movementsAction,
  type MovementView,
} from "../actions";
import { formatDateTime } from "@/lib/dates";

export type InventoryItem = {
  variantId: string;
  productTitle: string;
  optionLabel: string;
  sku: string;
  tracked: boolean;
  unavailable: number;
  committed: number;
  available: number;
  onHand: number;
};

export function InventoryTable({ items }: { items: InventoryItem[] }) {
  const t = useAdminT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [delta, setDelta] = useState("0");
  const [reason, setReason] = useState<InventoryReason>("correction");
  const [note, setNote] = useState("");

  const [historyFor, setHistoryFor] = useState<InventoryItem | null>(null);
  const [history, setHistory] = useState<MovementView[] | null>(null);

  function applyAdjustment(item: InventoryItem) {
    const parsed = Number.parseInt(delta, 10);
    if (!Number.isFinite(parsed) || parsed === 0) {
      setOpenPopover(null);
      return;
    }
    startTransition(async () => {
      await adjustInventoryAction({
        variantId: item.variantId,
        delta: parsed,
        reason,
        note: note.trim() || null,
      });
      setOpenPopover(null);
      setDelta("0");
      setNote("");
      setReason("correction");
      router.refresh();
    });
  }

  function openHistory(item: InventoryItem) {
    setHistoryFor(item);
    setHistory(null);
    startTransition(async () => {
      setHistory(await movementsAction(item.variantId));
    });
  }

  const reasonOptions = INVENTORY_REASONS.map((value) => ({
    value,
    label: t(`reason.${value}`),
  }));

  return (
    <Page
      title={t("nav.products.inventory")}
      backAction={{ url: "/admin/products" }}
    >
      <Card padding="0">
        <IndexTable
          resourceName={{
            singular: t("inventory.column.product"),
            plural: t("nav.products"),
          }}
          itemCount={items.length}
          selectable={false}
          headings={[
            { title: t("inventory.column.product") },
            { title: t("inventory.column.sku") },
            { title: t("inventory.column.unavailable"), alignment: "end" },
            { title: t("inventory.column.committed"), alignment: "end" },
            { title: t("inventory.column.available"), alignment: "end" },
            { title: t("inventory.column.onHand"), alignment: "end" },
            { title: "" },
          ]}
        >
          {items.map((item, index) => (
            <IndexTable.Row
              id={item.variantId}
              key={item.variantId}
              position={index}
            >
              <IndexTable.Cell>
                <BlockStack gap="050">
                  <Text as="span" fontWeight="semibold">
                    {item.productTitle}
                  </Text>
                  {item.optionLabel ? (
                    <Text as="span" tone="subdued" variant="bodySm">
                      {item.optionLabel}
                    </Text>
                  ) : null}
                </BlockStack>
              </IndexTable.Cell>
              <IndexTable.Cell>{item.sku}</IndexTable.Cell>
              <IndexTable.Cell>
                <Text as="span" alignment="end" numeric>
                  {item.tracked ? item.unavailable : "—"}
                </Text>
              </IndexTable.Cell>
              <IndexTable.Cell>
                <Text as="span" alignment="end" numeric>
                  {item.tracked ? item.committed : "—"}
                </Text>
              </IndexTable.Cell>
              <IndexTable.Cell>
                <Text as="span" alignment="end" numeric>
                  {item.tracked ? item.available : "—"}
                </Text>
              </IndexTable.Cell>
              <IndexTable.Cell>
                <Text as="span" alignment="end" numeric>
                  {item.tracked ? item.onHand : "—"}
                </Text>
              </IndexTable.Cell>
              <IndexTable.Cell>
                <InlineStack gap="200" align="end">
                  <Popover
                    active={openPopover === item.variantId}
                    onClose={() => setOpenPopover(null)}
                    activator={
                      <Button
                        size="slim"
                        disabled={!item.tracked}
                        onClick={() =>
                          setOpenPopover(
                            openPopover === item.variantId
                              ? null
                              : item.variantId,
                          )
                        }
                      >
                        {t("inventory.adjust")}
                      </Button>
                    }
                  >
                    <Box>
                      <div style={{ padding: 16, minWidth: 260 }}>
                        <BlockStack gap="300">
                          <TextField
                            label={t("inventory.adjustBy")}
                            type="number"
                            value={delta}
                            onChange={setDelta}
                            autoComplete="off"
                          />
                          <Select
                            label={t("inventory.reason")}
                            options={reasonOptions}
                            value={reason}
                            onChange={(value) =>
                              setReason(value as InventoryReason)
                            }
                          />
                          <TextField
                            label={t("inventory.note")}
                            value={note}
                            onChange={setNote}
                            autoComplete="off"
                          />
                          <Button
                            variant="primary"
                            loading={pending}
                            onClick={() => applyAdjustment(item)}
                          >
                            {t("common.save")}
                          </Button>
                        </BlockStack>
                      </div>
                    </Box>
                  </Popover>
                  <Button
                    size="slim"
                    variant="plain"
                    onClick={() => openHistory(item)}
                  >
                    {t("inventory.history")}
                  </Button>
                </InlineStack>
              </IndexTable.Cell>
            </IndexTable.Row>
          ))}
        </IndexTable>
      </Card>

      <Modal
        open={historyFor !== null}
        onClose={() => setHistoryFor(null)}
        title={`${t("inventory.history.title")} — ${historyFor?.productTitle ?? ""} ${historyFor?.optionLabel ?? ""}`}
      >
        <Modal.Section>
          {history === null ? (
            <Text as="p" tone="subdued">
              {t("common.loading")}…
            </Text>
          ) : history.length === 0 ? (
            <Text as="p" tone="subdued">
              {t("inventory.history.empty")}
            </Text>
          ) : (
            <BlockStack gap="300">
              {history.map((movement) => (
                <InlineStack
                  key={movement.id}
                  align="space-between"
                  blockAlign="start"
                >
                  <BlockStack gap="050">
                    <Text as="span" fontWeight="semibold">
                      {t(`reason.${movement.reason as InventoryReason}`)}
                    </Text>
                    <Text as="span" tone="subdued" variant="bodySm">
                      {formatDateTime(movement.created_at)}
                      {movement.created_by ? ` · ${movement.created_by}` : ""}
                      {movement.note ? ` · ${movement.note}` : ""}
                    </Text>
                  </BlockStack>
                  <Text as="span" numeric fontWeight="semibold">
                    {movement.delta > 0 ? `+${movement.delta}` : movement.delta}
                  </Text>
                </InlineStack>
              ))}
            </BlockStack>
          )}
        </Modal.Section>
      </Modal>
    </Page>
  );
}

/** Local convenience wrapper — Polaris Popover needs a plain element child. */
function Box({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
