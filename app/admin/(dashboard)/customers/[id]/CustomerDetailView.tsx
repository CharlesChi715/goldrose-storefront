"use client";

/**
 * ROLE OF THIS FILE
 * Client half of the customer profile (§9.7): last order, orders list,
 * Timeline (comments + system events from customer_events), Notes, Tags,
 * default address.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  BlockStack,
  Button,
  Card,
  Divider,
  InlineStack,
  Layout,
  Link as PolarisLink,
  Page,
  Text,
  TextField,
} from "@shopify/polaris";
import { formatMoney } from "@/lib/money";
import type { Address, CustomerRow } from "@/lib/supabase/types.ts";
import { useAdminT } from "../../../PolarisShell";
import { formatDateTime } from "@/lib/dates";
import {
  addCustomerCommentAction,
  saveCustomerNoteAction,
  saveCustomerTagsAction,
} from "../actions";

type OrderSummary = {
  id: string;
  name: string;
  placedAt: string;
  totalCents: number;
  financialStatus: string;
  fulfillmentStatus: string;
};

type EventView = {
  id: string;
  kind: string;
  message: string;
  created_by: string | null;
  created_at: string;
};

function AddressLines({ address }: { address: Address | null }) {
  if (!address) {
    return <Text as="p" tone="subdued">—</Text>;
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

export function CustomerDetailView({
  customer,
  orders,
  events,
  totalSpentCents,
}: {
  customer: CustomerRow;
  orders: OrderSummary[];
  events: EventView[];
  totalSpentCents: number;
}) {
  const t = useAdminT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState(customer.note);
  const [tagsText, setTagsText] = useState(customer.tags.join(", "));
  const [comment, setComment] = useState("");

  const name = `${customer.first_name} ${customer.last_name}`.trim() || customer.email;
  const lastOrder = orders[0];

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  return (
    <Page title={name} backAction={{ url: "/admin/customers" }} subtitle={customer.email}>
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            {lastOrder ? (
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingSm">
                    {t("customer.lastOrder.title")}
                  </Text>
                  <InlineStack align="space-between" blockAlign="center">
                    <BlockStack gap="050">
                      <PolarisLink url={`/admin/orders/${lastOrder.id}`}>
                        {lastOrder.name}
                      </PolarisLink>
                      <Text as="span" tone="subdued" variant="bodySm">
                        {formatDateTime(lastOrder.placedAt)}
                      </Text>
                    </BlockStack>
                    <Text as="span" fontWeight="semibold" numeric>
                      {formatMoney(lastOrder.totalCents)}
                    </Text>
                  </InlineStack>
                </BlockStack>
              </Card>
            ) : null}

            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingSm">
                  {t("customer.orders.title")}
                </Text>
                <Divider />
                <BlockStack gap="200">
                  {orders.map((order) => (
                    <InlineStack key={order.id} align="space-between" blockAlign="center">
                      <InlineStack gap="200" blockAlign="center">
                        <PolarisLink url={`/admin/orders/${order.id}`}>{order.name}</PolarisLink>
                        <Badge>{t(`orders.status.${order.financialStatus}` as never)}</Badge>
                        <Badge>{t(`orders.status.${order.fulfillmentStatus}` as never)}</Badge>
                      </InlineStack>
                      <Text as="span" numeric>
                        {formatMoney(order.totalCents)}
                      </Text>
                    </InlineStack>
                  ))}
                </BlockStack>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingSm">
                  {t("customer.timeline.title")}
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
                    loading={pending}
                    onClick={() =>
                      run(async () => {
                        if (comment.trim()) {
                          await addCustomerCommentAction(customer.id, comment.trim());
                          setComment("");
                        }
                      })
                    }
                  >
                    {t("order.timeline.post")}
                  </Button>
                </InlineStack>
                <Divider />
                <BlockStack gap="300">
                  {events.map((event) => (
                    <BlockStack key={event.id} gap="050">
                      <Text as="span" fontWeight={event.kind === "comment" ? "regular" : "medium"}>
                        {event.message}
                      </Text>
                      <Text as="span" tone="subdued" variant="bodySm">
                        {formatDateTime(event.created_at)}
                        {event.created_by ? ` · ${event.created_by}` : ""}
                      </Text>
                    </BlockStack>
                  ))}
                </BlockStack>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="100">
                <Text as="h2" variant="headingSm">
                  {t("customer.totalSpent")}
                </Text>
                <Text as="p" variant="headingLg">
                  {formatMoney(totalSpentCents)}
                </Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingSm">
                  {t("customer.notes.title")}
                </Text>
                <TextField
                  label=""
                  labelHidden
                  value={note}
                  onChange={setNote}
                  multiline={3}
                  autoComplete="off"
                />
                {note !== customer.note ? (
                  <Button
                    size="slim"
                    onClick={() => run(() => saveCustomerNoteAction(customer.id, note))}
                  >
                    {t("common.save")}
                  </Button>
                ) : null}
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingSm">
                  {t("customer.tags.title")}
                </Text>
                <TextField
                  label=""
                  labelHidden
                  value={tagsText}
                  onChange={setTagsText}
                  autoComplete="off"
                />
                {tagsText !== customer.tags.join(", ") ? (
                  <Button
                    size="slim"
                    onClick={() =>
                      run(() =>
                        saveCustomerTagsAction(
                          customer.id,
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
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingSm">
                  {t("customer.address.title")}
                </Text>
                <AddressLines address={customer.default_address} />
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
