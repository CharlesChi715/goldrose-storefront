"use client";

/**
 * ROLE OF THIS FILE
 * The discount create/edit form (§9.10): Shopify's three code-method types
 * (Amount off products / Amount off order / Free shipping), value as % or
 * fixed, minimum purchase, usage limits, once-per-customer, active dates.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Banner,
  BlockStack,
  Card,
  Checkbox,
  ChoiceList,
  InlineGrid,
  Layout,
  Page,
  Select,
  Text,
  TextField,
  Toast,
} from "@shopify/polaris";
import { useAdminT } from "../../PolarisShell";
import { saveDiscountAction } from "./actions";

export type DiscountFormInitial = {
  id: string | null;
  code: string;
  category: "products" | "order" | "shipping";
  valueType: "percentage" | "fixed_amount";
  value: string; // "10" (%) or "5.00" ($)
  productIds: string[];
  minPurchase: string;
  usageLimit: string;
  oncePerCustomer: boolean;
  startsAt: string; // datetime-local value
  endsAt: string;
};

export type ProductOption = { id: string; title: string };

export function DiscountForm({
  initial,
  products,
}: {
  initial: DiscountFormInitial;
  products: ProductOption[];
}) {
  const t = useAdminT();
  const router = useRouter();
  const [saving, startSaving] = useTransition();

  const [code, setCode] = useState(initial.code);
  const [category, setCategory] = useState(initial.category);
  const [valueType, setValueType] = useState(initial.valueType);
  const [value, setValue] = useState(initial.value);
  const [productIds, setProductIds] = useState<string[]>(initial.productIds);
  const [minPurchase, setMinPurchase] = useState(initial.minPurchase);
  const [usageLimit, setUsageLimit] = useState(initial.usageLimit);
  const [oncePerCustomer, setOncePerCustomer] = useState(
    initial.oncePerCustomer,
  );
  const [startsAt, setStartsAt] = useState(initial.startsAt);
  const [endsAt, setEndsAt] = useState(initial.endsAt);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function save() {
    setError(null);
    const isShipping = category === "shipping";
    const numericValue = isShipping
      ? 0
      : valueType === "percentage"
        ? Number.parseInt(value, 10) || 0
        : Math.round((Number.parseFloat(value) || 0) * 100);
    const payload = {
      id: initial.id,
      code: code.trim().toUpperCase(),
      type: isShipping ? "free_shipping" : valueType,
      value: numericValue,
      appliesToProductIds: category === "products" ? productIds : null,
      minPurchaseCents: minPurchase.trim()
        ? Math.round((Number.parseFloat(minPurchase) || 0) * 100)
        : null,
      usageLimit: usageLimit.trim()
        ? Number.parseInt(usageLimit, 10) || null
        : null,
      oncePerCustomer,
      startsAt: startsAt
        ? new Date(startsAt).toISOString()
        : new Date().toISOString(),
      endsAt: endsAt ? new Date(endsAt).toISOString() : null,
    };
    startSaving(async () => {
      const result = await saveDiscountAction(payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setToast(t("discounts.saved"));
      if (initial.id === null) {
        router.push(`/admin/discounts/${result.id}`);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <Page
      title={initial.id ? initial.code : t("discounts.create")}
      backAction={{ url: "/admin/discounts" }}
      primaryAction={{
        content: t("common.save"),
        onAction: save,
        loading: saving,
      }}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            {error ? <Banner tone="critical">{error}</Banner> : null}
            <Card>
              <BlockStack gap="400">
                <TextField
                  label={t("discounts.form.code")}
                  value={code}
                  onChange={(next) => setCode(next.toUpperCase())}
                  autoComplete="off"
                  helpText={t("discounts.form.codeHelp")}
                />
                <ChoiceList
                  title={t("discounts.column.type")}
                  choices={[
                    { label: t("discounts.type.products"), value: "products" },
                    { label: t("discounts.type.order"), value: "order" },
                    { label: t("discounts.type.shipping"), value: "shipping" },
                  ]}
                  selected={[category]}
                  onChange={(selected) =>
                    setCategory(
                      selected[0] as "products" | "order" | "shipping",
                    )
                  }
                />
                {category !== "shipping" ? (
                  <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
                    <Select
                      label={t("discounts.column.type")}
                      labelHidden
                      options={[
                        {
                          label: t("discounts.form.valueType.percentage"),
                          value: "percentage",
                        },
                        {
                          label: t("discounts.form.valueType.fixed"),
                          value: "fixed_amount",
                        },
                      ]}
                      value={valueType}
                      onChange={(next) =>
                        setValueType(next as "percentage" | "fixed_amount")
                      }
                    />
                    <TextField
                      label={t("discounts.form.value")}
                      labelHidden
                      prefix={valueType === "fixed_amount" ? "$" : undefined}
                      suffix={valueType === "percentage" ? "%" : undefined}
                      value={value}
                      onChange={setValue}
                      autoComplete="off"
                      inputMode="decimal"
                    />
                  </InlineGrid>
                ) : null}
                {category === "products" ? (
                  <BlockStack gap="200">
                    <Text as="h3" variant="headingSm">
                      {t("discounts.form.appliesTo.products")}
                    </Text>
                    {products.map((product) => (
                      <Checkbox
                        key={product.id}
                        label={product.title}
                        checked={productIds.includes(product.id)}
                        onChange={(checked) =>
                          setProductIds((current) =>
                            checked
                              ? [...current, product.id]
                              : current.filter((id) => id !== product.id),
                          )
                        }
                      />
                    ))}
                  </BlockStack>
                ) : null}
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <TextField
                  label={t("discounts.form.minPurchase")}
                  prefix="$"
                  value={minPurchase}
                  onChange={setMinPurchase}
                  autoComplete="off"
                  inputMode="decimal"
                />
                <TextField
                  label={t("discounts.form.usageLimit")}
                  type="number"
                  value={usageLimit}
                  onChange={setUsageLimit}
                  autoComplete="off"
                />
                <Checkbox
                  label={t("discounts.form.oncePerCustomer")}
                  checked={oncePerCustomer}
                  onChange={setOncePerCustomer}
                />
              </BlockStack>
            </Card>

            <Card>
              <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
                <TextField
                  label={t("discounts.form.startsAt")}
                  type="datetime-local"
                  value={startsAt}
                  onChange={setStartsAt}
                  autoComplete="off"
                />
                <TextField
                  label={t("discounts.form.endsAt")}
                  type="datetime-local"
                  value={endsAt}
                  onChange={setEndsAt}
                  autoComplete="off"
                />
              </InlineGrid>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
      {toast ? (
        <Toast content={toast} onDismiss={() => setToast(null)} />
      ) : null}
    </Page>
  );
}
