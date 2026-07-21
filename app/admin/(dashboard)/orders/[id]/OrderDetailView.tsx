"use client";

/**
 * ROLE OF THIS FILE
 * Client half of the order detail (§9.4). Left: line items (+ fulfill
 * modal), payment card (+ refund modal), timeline with comments. Right:
 * notes (prefilled with the buyer's gift message, editable), customer,
 * contact information, shipping/billing addresses, tags, conversion
 * summary; seller-protection status replaces Shopify's fraud card (adapt).
 * Actions: refund, cancel (unfulfilled only), print packing slip, archive.
 * No delete — same as Shopify.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Banner,
  BlockStack,
  Button,
  Card,
  Checkbox,
  Divider,
  InlineStack,
  Layout,
  Link as PolarisLink,
  Modal,
  Page,
  Text,
  TextField,
  Toast,
} from "@shopify/polaris";
import { formatMoney } from "@/lib/products";
import { interpolate } from "@/lib/admin/i18n";
import type { Address, OrderEventRow, OrderLineRow, OrderRow } from "@/lib/supabase/types.ts";
import type { ConversionSummary } from "@/lib/admin/orders";
import { useAdminT } from "../../../PolarisShell";
import {
  addOrderCommentAction,
  archiveOrdersAction,
  cancelOrderAction,
  fulfillOrderAction,
  refundOrderAction,
  saveOrderNoteAction,
  saveOrderTagsAction,
} from "../actions";
import { markDraftPaidAction } from "../drafts/actions";

type CustomerSummary = {
  id: string;
  name: string;
  email: string;
  ordersCount: number;
} | null;

function AddressBlock({ address, none }: { address: Address | null; none: string }) {
  if (!address) {
    return (
      <Text as="p" tone="subdued">
        {none}
      </Text>
    );
  }
  return (
    <BlockStack gap="050">
      {[
        address.name,
        address.address1,
        address.address2,
        [address.city, address.state, address.postal_code].filter(Boolean).join(", "),
        address.country,
      ]
        .filter(Boolean)
        .map((line, index) => (
          <Text as="p" key={index}>
            {line}
          </Text>
        ))}
    </BlockStack>
  );
}

export function OrderDetailView({
  order,
  lines,
  events,
  customer,
  conversion,
  sellerProtection,
}: {
  order: OrderRow;
  lines: OrderLineRow[];
  events: OrderEventRow[];
  customer: CustomerSummary;
  conversion: ConversionSummary | null;
  sellerProtection: string | null;
}) {
  const t = useAdminT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [fulfillOpen, setFulfillOpen] = useState(false);
  const [tracking, setTracking] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");

  const [refundOpen, setRefundOpen] = useState(false);
  const remainingCents = order.total_cents - order.refunded_cents;
  const [refundAmount, setRefundAmount] = useState((remainingCents / 100).toFixed(2));
  const [refundRestock, setRefundRestock] = useState(false);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelRefund, setCancelRefund] = useState(true);
  const [cancelRestock, setCancelRestock] = useState(true);

  const [note, setNote] = useState(order.note);
  const [tagsText, setTagsText] = useState(order.tags.join(", "));
  const [comment, setComment] = useState("");

  const cancelled = Boolean(order.cancelled_at);
  const canFulfill = !cancelled && order.fulfillment_status === "unfulfilled";
  const canRefund =
    (order.financial_status === "paid" || order.financial_status === "partially_refunded") &&
    remainingCents > 0;

  function run(action: () => Promise<{ ok: boolean; error?: string } | void>, done?: string) {
    startTransition(async () => {
      setError(null);
      const result = await action();
      if (result && "ok" in result && !result.ok) {
        setError(result.error ?? "Action failed");
        return;
      }
      if (done) {
        setToast(done);
      }
      router.refresh();
    });
  }

  const secondaryActions = [
    {
      content: t("order.print"),
      onAction: () => window.open(`/admin/packing-slip/${order.id}`, "_blank"),
    },
    ...(canFulfill && !cancelled
      ? [{ content: t("order.cancel"), destructive: true, onAction: () => setCancelOpen(true) }]
      : []),
    {
      content: order.archived_at ? t("order.unarchive") : t("order.archive"),
      onAction: () =>
        run(() => archiveOrdersAction([order.id], !order.archived_at)),
    },
  ];

  // Shopify's draft flow (§9.4): "Mark as paid" converts the draft.
  const isPendingDraft = order.source === "draft" && order.financial_status === "pending";

  return (
    <Page
      title={order.name}
      backAction={{ url: "/admin/orders" }}
      subtitle={new Date(order.placed_at).toLocaleString()}
      primaryAction={
        isPendingDraft
          ? {
              content: t("drafts.markPaid"),
              loading: pending,
              onAction: () => run(() => markDraftPaidAction(order.id)),
            }
          : undefined
      }
      titleMetadata={
        <InlineStack gap="200">
          <Badge
            tone={order.financial_status === "paid" ? undefined : "warning"}
            progress={order.financial_status === "paid" ? "complete" : "partiallyComplete"}
          >
            {t(`orders.status.${order.financial_status}`)}
          </Badge>
          <Badge
            tone={order.fulfillment_status === "fulfilled" ? undefined : "attention"}
            progress={order.fulfillment_status === "fulfilled" ? "complete" : "incomplete"}
          >
            {t(`orders.status.${order.fulfillment_status}`)}
          </Badge>
          {cancelled ? <Badge tone="critical">{t("orders.status.cancelled")}</Badge> : null}
          <Badge tone={order.source === "mock" ? "info" : undefined}>
            {t(`orders.source.${order.source}`)}
          </Badge>
        </InlineStack>
      }
      secondaryActions={secondaryActions}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            {error ? <Banner tone="critical">{error}</Banner> : null}
            {cancelled ? (
              <Banner tone="warning">
                {t("orders.status.cancelled")}
                {order.cancel_reason ? ` — ${order.cancel_reason}` : ""}
              </Banner>
            ) : null}

            {/* Line items */}
            <Card>
              <BlockStack gap="300">
                <InlineStack align="space-between">
                  <InlineStack gap="200">
                    <Text as="h2" variant="headingSm">
                      {t("order.lineItems.title")}
                    </Text>
                    <Badge
                      tone={order.fulfillment_status === "fulfilled" ? undefined : "attention"}
                      progress={
                        order.fulfillment_status === "fulfilled" ? "complete" : "incomplete"
                      }
                    >
                      {t(`orders.status.${order.fulfillment_status}`)}
                    </Badge>
                  </InlineStack>
                  {canFulfill ? (
                    <Button variant="primary" onClick={() => setFulfillOpen(true)}>
                      {t("order.fulfill")}
                    </Button>
                  ) : null}
                </InlineStack>
                <Divider />
                <BlockStack gap="200">
                  {lines.map((line) => (
                    <InlineStack key={line.id} align="space-between" blockAlign="start">
                      <BlockStack gap="050">
                        <Text as="span" fontWeight="semibold">
                          {line.name}
                        </Text>
                        <Text as="span" tone="subdued" variant="bodySm">
                          {[line.option, line.sku].filter(Boolean).join(" · ")}
                        </Text>
                      </BlockStack>
                      <Text as="span" numeric>
                        {formatMoney(line.unit_amount_cents)} × {line.quantity} ={" "}
                        {formatMoney(line.line_total_cents)}
                      </Text>
                    </InlineStack>
                  ))}
                </BlockStack>
                {order.fulfillment_status === "fulfilled" && order.tracking_number ? (
                  <>
                    <Divider />
                    <Text as="p">
                      {t("order.fulfilled.trackingLabel")}:{" "}
                      {order.tracking_url ? (
                        <PolarisLink url={order.tracking_url} target="_blank">
                          {order.tracking_number}
                        </PolarisLink>
                      ) : (
                        order.tracking_number
                      )}
                    </Text>
                  </>
                ) : null}
              </BlockStack>
            </Card>

            {/* Payment */}
            <Card>
              <BlockStack gap="300">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingSm">
                    {t("order.payment.title")}
                  </Text>
                  {canRefund ? (
                    <Button
                      onClick={() => {
                        // Fresh remaining amount — props update on refresh but
                        // this state survives it.
                        setRefundAmount((remainingCents / 100).toFixed(2));
                        setRefundOpen(true);
                      }}
                    >
                      {t("order.refund")}
                    </Button>
                  ) : null}
                </InlineStack>
                <Divider />
                <BlockStack gap="150">
                  <InlineStack align="space-between">
                    <Text as="span">{t("order.payment.subtotal")}</Text>
                    <Text as="span" numeric>
                      {formatMoney(order.subtotal_cents)}
                    </Text>
                  </InlineStack>
                  {order.discount_cents > 0 ? (
                    <InlineStack align="space-between">
                      <Text as="span">
                        {t("order.payment.discount")}
                        {order.discount_code ? ` (${order.discount_code})` : ""}
                      </Text>
                      <Text as="span" numeric>
                        −{formatMoney(order.discount_cents)}
                      </Text>
                    </InlineStack>
                  ) : null}
                  <InlineStack align="space-between">
                    <Text as="span">{t("order.payment.shipping")}</Text>
                    <Text as="span" numeric>
                      {order.shipping_free
                        ? t("order.payment.shippingFree")
                        : formatMoney(order.shipping_cents)}
                    </Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="span">{t("order.payment.tax")}</Text>
                    <Text as="span" numeric>
                      {formatMoney(order.tax_cents)}
                    </Text>
                  </InlineStack>
                  <Divider />
                  <InlineStack align="space-between">
                    <Text as="span" fontWeight="semibold">
                      {t("order.payment.total")}
                    </Text>
                    <Text as="span" fontWeight="semibold" numeric>
                      {formatMoney(order.total_cents)}
                    </Text>
                  </InlineStack>
                  {order.refunded_cents > 0 ? (
                    <InlineStack align="space-between">
                      <Text as="span" tone="critical">
                        {t("order.payment.refunded")}
                      </Text>
                      <Text as="span" tone="critical" numeric>
                        −{formatMoney(order.refunded_cents)}
                      </Text>
                    </InlineStack>
                  ) : null}
                </BlockStack>
                {order.provider_capture_id ? (
                  <Text as="p" tone="subdued" variant="bodySm">
                    {t("order.payment.captureId")}: {order.provider_capture_id} (
                    {order.payment_provider})
                  </Text>
                ) : null}
                {sellerProtection ? (
                  <Text as="p" tone="subdued" variant="bodySm">
                    {t("order.payment.sellerProtection")}: {sellerProtection}
                  </Text>
                ) : null}
              </BlockStack>
            </Card>

            {/* Timeline */}
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingSm">
                  {t("order.timeline.title")}
                </Text>
                <InlineStack gap="200" blockAlign="end" wrap={false}>
                  <div style={{ flexGrow: 1 }}>
                    <TextField
                      label=""
                      labelHidden
                      placeholder={t("order.timeline.placeholder")}
                      value={comment}
                      onChange={setComment}
                      autoComplete="off"
                    />
                  </div>
                  <Button
                    onClick={() =>
                      run(async () => {
                        if (comment.trim()) {
                          await addOrderCommentAction(order.id, comment.trim());
                          setComment("");
                        }
                      })
                    }
                    loading={pending}
                  >
                    {t("order.timeline.post")}
                  </Button>
                </InlineStack>
                <Divider />
                <BlockStack gap="300">
                  {events.map((event) => (
                    <InlineStack key={event.id} align="space-between" blockAlign="start">
                      <BlockStack gap="050">
                        <Text
                          as="span"
                          fontWeight={event.kind === "comment" ? "regular" : "medium"}
                        >
                          {event.message}
                        </Text>
                        <Text as="span" tone="subdued" variant="bodySm">
                          {new Date(event.created_at).toLocaleString()}
                          {event.created_by ? ` · ${event.created_by}` : ""}
                        </Text>
                      </BlockStack>
                      {event.kind === "comment" ? <Badge>{t("order.timeline.title")}</Badge> : null}
                    </InlineStack>
                  ))}
                </BlockStack>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>

        {/* Right column */}
        <Layout.Section variant="oneThird">
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingSm">
                  {t("order.notes.title")}
                </Text>
                <TextField
                  label=""
                  labelHidden
                  value={note}
                  onChange={setNote}
                  multiline={3}
                  autoComplete="off"
                  placeholder={t("order.notes.empty")}
                />
                {note !== order.note ? (
                  <Button
                    size="slim"
                    onClick={() => run(() => saveOrderNoteAction(order.id, note))}
                  >
                    {t("common.save")}
                  </Button>
                ) : null}
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingSm">
                  {t("order.customer.title")}
                </Text>
                {customer ? (
                  <BlockStack gap="050">
                    <PolarisLink url={`/admin/customers/${customer.id}`}>
                      {customer.name || customer.email}
                    </PolarisLink>
                    <Text as="p" tone="subdued" variant="bodySm">
                      {interpolate(t("order.customer.ordersCount"), {
                        count: customer.ordersCount,
                      })}
                    </Text>
                  </BlockStack>
                ) : (
                  <Text as="p" tone="subdued">
                    {t("order.customer.none")}
                  </Text>
                )}
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingSm">
                  {t("order.contact.title")}
                </Text>
                <Text as="p">{order.email ?? t("order.contact.noEmail")}</Text>
                {order.phone ? <Text as="p">{order.phone}</Text> : null}
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingSm">
                  {t("order.shippingAddress.title")}
                </Text>
                <AddressBlock address={order.shipping_address} none={t("order.address.none")} />
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingSm">
                  {t("order.billingAddress.title")}
                </Text>
                <AddressBlock address={order.billing_address} none={t("order.address.none")} />
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingSm">
                  {t("order.conversion.title")}
                </Text>
                {conversion ? (
                  <BlockStack gap="050">
                    <Text as="p">
                      {interpolate(t("order.conversion.sessions"), {
                        count: conversion.sessionCount,
                      })}
                    </Text>
                    <Text as="p" tone="subdued" variant="bodySm">
                      {t("order.conversion.first")}: {conversion.firstSource}
                    </Text>
                    <Text as="p" tone="subdued" variant="bodySm">
                      {t("order.conversion.last")}: {conversion.lastSource}
                    </Text>
                  </BlockStack>
                ) : (
                  <Text as="p" tone="subdued">
                    {t("order.conversion.empty")}
                  </Text>
                )}
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingSm">
                  {t("order.tags.title")}
                </Text>
                <TextField
                  label=""
                  labelHidden
                  value={tagsText}
                  onChange={setTagsText}
                  autoComplete="off"
                />
                {tagsText !== order.tags.join(", ") ? (
                  <Button
                    size="slim"
                    onClick={() =>
                      run(() =>
                        saveOrderTagsAction(
                          order.id,
                          tagsText
                            .split(/[,，]/)
                            .map((tag) => tag.trim())
                            .filter(Boolean),
                        ),
                      )
                    }
                  >
                    {t("common.save")}
                  </Button>
                ) : null}
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>

      {/* Fulfill modal */}
      <Modal
        open={fulfillOpen}
        onClose={() => setFulfillOpen(false)}
        title={t("order.fulfill.title")}
        primaryAction={{
          content: t("order.fulfill.submit"),
          loading: pending,
          onAction: () =>
            run(async () => {
              const result = await fulfillOrderAction({
                id: order.id,
                trackingNumber: tracking,
                trackingUrl,
              });
              if (result.ok) {
                setFulfillOpen(false);
              }
              return result;
            }),
        }}
        secondaryActions={[{ content: t("common.cancel"), onAction: () => setFulfillOpen(false) }]}
      >
        <Modal.Section>
          <BlockStack gap="300">
            <TextField
              label={t("order.fulfill.tracking")}
              value={tracking}
              onChange={setTracking}
              autoComplete="off"
            />
            <TextField
              label={t("order.fulfill.trackingUrl")}
              value={trackingUrl}
              onChange={setTrackingUrl}
              autoComplete="off"
            />
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Refund modal */}
      <Modal
        open={refundOpen}
        onClose={() => setRefundOpen(false)}
        title={t("order.refund.title")}
        primaryAction={{
          content: t("order.refund.submit"),
          destructive: true,
          loading: pending,
          onAction: () =>
            run(async () => {
              const amount = Math.round(Number.parseFloat(refundAmount) * 100);
              const result = await refundOrderAction({
                id: order.id,
                amountCents: Number.isFinite(amount) ? amount : 0,
                restock: refundRestock,
              });
              if (result.ok) {
                setRefundOpen(false);
              }
              return result;
            }),
        }}
        secondaryActions={[{ content: t("common.cancel"), onAction: () => setRefundOpen(false) }]}
      >
        <Modal.Section>
          <BlockStack gap="300">
            <TextField
              label={t("order.refund.amount")}
              prefix="$"
              value={refundAmount}
              onChange={setRefundAmount}
              autoComplete="off"
              inputMode="decimal"
              helpText={`≤ ${formatMoney(remainingCents)}`}
            />
            <Checkbox
              label={t("order.refund.restock")}
              checked={refundRestock}
              onChange={setRefundRestock}
            />
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Cancel modal */}
      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title={t("order.cancel.title")}
        primaryAction={{
          content: t("order.cancel.submit"),
          destructive: true,
          loading: pending,
          onAction: () =>
            run(async () => {
              const result = await cancelOrderAction({
                id: order.id,
                reason: cancelReason,
                refund: cancelRefund,
                restock: cancelRestock,
              });
              if (result.ok) {
                setCancelOpen(false);
              }
              return result;
            }),
        }}
        secondaryActions={[{ content: t("order.cancel.keep"), onAction: () => setCancelOpen(false) }]}
      >
        <Modal.Section>
          <BlockStack gap="300">
            <TextField
              label={t("order.cancel.reason")}
              value={cancelReason}
              onChange={setCancelReason}
              autoComplete="off"
            />
            <Checkbox
              label={t("order.cancel.refund")}
              checked={cancelRefund}
              onChange={setCancelRefund}
            />
            <Checkbox
              label={t("order.cancel.restock")}
              checked={cancelRestock}
              onChange={setCancelRestock}
            />
          </BlockStack>
        </Modal.Section>
      </Modal>

      {toast ? <Toast content={toast} onDismiss={() => setToast(null)} /> : null}
    </Page>
  );
}
