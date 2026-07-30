"use client";

/**
 * ROLE OF THIS FILE
 * The cloned Shopify product form (§9.5) for /admin/products/new and
 * /admin/products/[id]: Title/Description, Media (multi-image upload,
 * reorder, alt text), Pricing (price/compare-at/tax/cost with auto
 * profit+margin), Inventory, Shipping (weight + customs), Variants (up to 3
 * options, generated table with per-row price/qty/SKU), Search engine
 * listing (Google preview + handle warning), and the right-column Status +
 * Product organization cards. Duplicate / Archive / Delete actions match
 * Shopify's (red confirm on delete).
 *
 * Prices are edited in dollars and converted to integer cents on save.
 */

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  BlockStack,
  Box,
  Button,
  Card,
  Checkbox,
  Divider,
  InlineGrid,
  InlineStack,
  Layout,
  Modal,
  Page,
  Select,
  Text,
  TextField,
  Toast,
} from "@shopify/polaris";
import { DeleteIcon } from "@shopify/polaris-icons";
import { useAdminT } from "../../PolarisShell";
import {
  deleteProductsAction,
  duplicateProductAction,
  saveProductAction,
  setProductStatusAction,
  uploadImagesAction,
} from "./actions";

export type FormImage = { path: string; url: string; alt: string };

export type FormVariant = {
  id: string | null;
  option_values: string[];
  sku: string;
  barcode: string;
  price: string; // dollars, e.g. "49.99"
  compareAt: string;
  cost: string;
  trackQty: boolean;
  quantity: string;
  continueSelling: boolean;
};

export type ProductFormInitial = {
  id: string | null;
  title: string;
  description: string;
  status: "active" | "draft" | "archived";
  vendor: string;
  productType: string;
  tags: string[];
  handle: string;
  chargeTax: boolean;
  requiresShipping: boolean;
  origin: string;
  hs: string;
  seoTitle: string;
  seoDescription: string;
  weightOz: string;
  optionNames: string[];
  images: FormImage[];
  variants: FormVariant[];
};

export function emptyVariant(optionValues: string[] = []): FormVariant {
  return {
    id: null,
    option_values: optionValues,
    sku: "",
    barcode: "",
    price: "0.00",
    compareAt: "",
    cost: "",
    trackQty: true,
    quantity: "0",
    continueSelling: false,
  };
}

function toCents(dollars: string): number | null {
  const trimmed = dollars.trim();
  if (!trimmed) {
    return null;
  }
  const value = Number(trimmed);
  return Number.isFinite(value) && value >= 0 ? Math.round(value * 100) : null;
}

function splitCsv(text: string): string[] {
  return text
    .split(/[,，]/)
    .map((piece) => piece.trim())
    .filter(Boolean);
}

export function ProductForm({ initial }: { initial: ProductFormInitial }) {
  const t = useAdminT();
  const router = useRouter();
  const [saving, startSaving] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isNew = initial.id === null;
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [status, setStatus] = useState<string>(initial.status);
  const [vendor, setVendor] = useState(initial.vendor);
  const [productType, setProductType] = useState(initial.productType);
  const [tagsText, setTagsText] = useState(initial.tags.join(", "));
  const [handle, setHandle] = useState(initial.handle);
  const [chargeTax, setChargeTax] = useState(initial.chargeTax);
  const [requiresShipping, setRequiresShipping] = useState(initial.requiresShipping);
  const [origin, setOrigin] = useState(initial.origin);
  const [hs, setHs] = useState(initial.hs);
  const [seoTitle, setSeoTitle] = useState(initial.seoTitle);
  const [seoDescription, setSeoDescription] = useState(initial.seoDescription);
  const [weightOz, setWeightOz] = useState(initial.weightOz);
  const [images, setImages] = useState<FormImage[]>(initial.images);

  // Option editor: names + comma-separated values, mirrored from the loaded
  // variants so existing combos keep their ids and stock.
  const initialValuesByOption = useMemo(() => {
    return initial.optionNames.map((_, optionIndex) => {
      const seen: string[] = [];
      for (const variant of initial.variants) {
        const value = variant.option_values[optionIndex];
        if (value && !seen.includes(value)) {
          seen.push(value);
        }
      }
      return seen.join(", ");
    });
  }, [initial]);

  const [optionNames, setOptionNames] = useState<string[]>(initial.optionNames);
  const [optionValues, setOptionValues] = useState<string[]>(initialValuesByOption);
  const [variantEdits, setVariantEdits] = useState<Map<string, FormVariant>>(() => {
    const map = new Map<string, FormVariant>();
    for (const variant of initial.variants) {
      map.set(variant.option_values.join(" / "), variant);
    }
    return map;
  });
  // The "default variant" carries pricing/inventory/shipping card values when
  // no options exist (Shopify's optionless-product model, §7.2).
  const defaultVariant = initial.variants[0] ?? emptyVariant();
  const [base, setBase] = useState<FormVariant>({ ...defaultVariant });

  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const hasOptions = optionNames.length > 0;

  /** Cartesian product of option values → the generated variant rows. */
  const combos = useMemo(() => {
    if (!hasOptions) {
      return [] as string[][];
    }
    const lists = optionValues.map(splitCsv);
    if (lists.some((list) => list.length === 0)) {
      return [] as string[][];
    }
    let result: string[][] = [[]];
    for (const list of lists) {
      result = result.flatMap((combo) => list.map((value) => [...combo, value]));
    }
    return result;
  }, [hasOptions, optionValues]);

  function comboVariant(combo: string[]): FormVariant {
    const key = combo.join(" / ");
    return (
      variantEdits.get(key) ?? {
        ...emptyVariant(combo),
        price: base.price,
        trackQty: base.trackQty,
        continueSelling: base.continueSelling,
      }
    );
  }

  function editCombo(combo: string[], patch: Partial<FormVariant>) {
    const key = combo.join(" / ");
    setVariantEdits((current) => {
      const next = new Map(current);
      next.set(key, { ...comboVariant(combo), ...patch, option_values: combo });
      return next;
    });
  }

  const priceCents = toCents(base.price) ?? 0;
  const costCents = toCents(base.cost);
  const profit = costCents !== null ? priceCents - costCents : null;
  const margin =
    profit !== null && priceCents > 0 ? Math.round((profit / priceCents) * 100) : null;

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }
    const formData = new FormData();
    for (const file of Array.from(files)) {
      formData.append("files", file);
    }
    const result = await uploadImagesAction(formData);
    if (result.ok) {
      setImages((current) => [
        ...current,
        ...result.images.map((image) => ({ path: image.path, url: image.url, alt: "" })),
      ]);
    } else {
      setError(result.error ?? "Upload failed");
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function moveImage(index: number, direction: -1 | 1) {
    setImages((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) {
        return current;
      }
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function save() {
    setError(null);
    const variants = hasOptions
      ? combos.map((combo) => comboVariant(combo))
      : [{ ...base, option_values: [] }];
    if (variants.length === 0) {
      setError(t("form.variants.help"));
      return;
    }
    const payload = {
      id: initial.id,
      title: title.trim(),
      description,
      status: status as "active" | "draft" | "archived",
      vendor: vendor.trim(),
      product_type: productType.trim(),
      tags: splitCsv(tagsText),
      handle: handle.trim() || null,
      charge_tax: chargeTax,
      requires_shipping: requiresShipping,
      country_of_origin: origin.trim() || null,
      hs_code: hs.trim() || null,
      seo_title: seoTitle.trim() || null,
      seo_description: seoDescription.trim() || null,
      weight_oz: weightOz.trim() ? Number(weightOz) : null,
      option_names: optionNames.map((name) => name.trim()).filter(Boolean),
      images: images.map((image) => ({ path: image.path, alt: image.alt })),
      variants: variants.map((variant) => ({
        id: variant.id,
        option_values: variant.option_values,
        sku: variant.sku.trim(),
        barcode: variant.barcode.trim(),
        price_cents: toCents(variant.price) ?? 0,
        compare_at_price_cents: toCents(variant.compareAt),
        cost_cents: toCents(variant.cost),
        track_quantity: variant.trackQty,
        inventory_on_hand: Number.parseInt(variant.quantity, 10) || 0,
        continue_selling_when_oos: variant.continueSelling,
      })),
    };
    startSaving(async () => {
      const result = await saveProductAction(payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setToast(t("form.saved"));
      if (isNew) {
        router.push(`/admin/products/${result.id}`);
      } else {
        router.refresh();
      }
    });
  }

  const secondaryActions = isNew
    ? []
    : [
        {
          content: t("form.duplicate"),
          onAction: () =>
            startSaving(async () => {
              const result = await duplicateProductAction(initial.id!, t("form.copyPrefix"));
              if (result.ok) {
                router.push(`/admin/products/${result.id}`);
              }
            }),
        },
        {
          content: status === "archived" ? t("form.unarchive") : t("form.archive"),
          onAction: () =>
            startSaving(async () => {
              const next = status === "archived" ? "draft" : "archived";
              await setProductStatusAction([initial.id!], next);
              setStatus(next);
              router.refresh();
            }),
        },
        {
          content: t("form.delete"),
          destructive: true,
          onAction: () => setConfirmDelete(true),
        },
      ];

  return (
    <Page
      title={isNew ? t("form.new.title") : initial.title}
      backAction={{ url: "/admin/products" }}
      titleMetadata={
        isNew ? undefined : (
          <Badge tone={status === "active" ? "success" : status === "draft" ? "info" : undefined}>
            {t(`products.status.${status as "active" | "draft" | "archived"}`)}
          </Badge>
        )
      }
      primaryAction={{ content: t("form.save"), onAction: save, loading: saving }}
      secondaryActions={secondaryActions}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            {error ? (
              <Card>
                <Text as="p" tone="critical">
                  {error}
                </Text>
              </Card>
            ) : null}

            {/* Title · Description */}
            <Card>
              <BlockStack gap="400">
                <TextField
                  label={t("form.title.label")}
                  value={title}
                  onChange={setTitle}
                  autoComplete="off"
                  requiredIndicator
                />
                <TextField
                  label={t("form.description.label")}
                  value={description}
                  onChange={setDescription}
                  autoComplete="off"
                  multiline={6}
                />
              </BlockStack>
            </Card>

            {/* Media */}
            <Card>
              <BlockStack gap="300">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingSm">
                    {t("form.media.title")}
                  </Text>
                  <Button onClick={() => fileInputRef.current?.click()} variant="plain">
                    {t("form.media.add")}
                  </Button>
                </InlineStack>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(event) => handleUpload(event.target.files)}
                />
                {images.length > 0 ? (
                  <InlineGrid columns={{ xs: 2, md: 4 }} gap="300">
                    {images.map((image, index) => (
                      <BlockStack key={`${image.path}-${index}`} gap="150">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image.url}
                          alt={image.alt}
                          style={{
                            width: "100%",
                            aspectRatio: "1",
                            objectFit: "cover",
                            borderRadius: 8,
                            border: "1px solid var(--p-color-border)",
                          }}
                        />
                        <TextField
                          label={t("form.media.alt")}
                          labelHidden
                          placeholder={t("form.media.alt")}
                          value={image.alt}
                          onChange={(alt) =>
                            setImages((current) =>
                              current.map((entry, entryIndex) =>
                                entryIndex === index ? { ...entry, alt } : entry,
                              ),
                            )
                          }
                          autoComplete="off"
                        />
                        <InlineStack gap="100">
                          <Button
                            size="micro"
                            disabled={index === 0}
                            onClick={() => moveImage(index, -1)}
                            accessibilityLabel={t("form.media.moveLeft")}
                          >
                            ←
                          </Button>
                          <Button
                            size="micro"
                            disabled={index === images.length - 1}
                            onClick={() => moveImage(index, 1)}
                            accessibilityLabel={t("form.media.moveRight")}
                          >
                            →
                          </Button>
                          <Button
                            size="micro"
                            tone="critical"
                            icon={DeleteIcon}
                            accessibilityLabel={t("form.media.remove")}
                            onClick={() =>
                              setImages((current) =>
                                current.filter((_, entryIndex) => entryIndex !== index),
                              )
                            }
                          />
                        </InlineStack>
                      </BlockStack>
                    ))}
                  </InlineGrid>
                ) : null}
              </BlockStack>
            </Card>

            {/* Pricing (default variant; per-row prices live in the table) */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingSm">
                  {t("form.pricing.title")}
                </Text>
                <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
                  <TextField
                    label={t("form.price")}
                    prefix="$"
                    value={base.price}
                    onChange={(price) => setBase((current) => ({ ...current, price }))}
                    autoComplete="off"
                    inputMode="decimal"
                  />
                  <TextField
                    label={t("form.compareAt")}
                    prefix="$"
                    value={base.compareAt}
                    onChange={(compareAt) => setBase((current) => ({ ...current, compareAt }))}
                    autoComplete="off"
                    inputMode="decimal"
                  />
                </InlineGrid>
                <Checkbox
                  label={t("form.chargeTax")}
                  checked={chargeTax}
                  onChange={setChargeTax}
                />
                <Divider />
                <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
                  <TextField
                    label={t("form.cost")}
                    prefix="$"
                    value={base.cost}
                    onChange={(cost) => setBase((current) => ({ ...current, cost }))}
                    autoComplete="off"
                    inputMode="decimal"
                    helpText={t("form.costHelp")}
                  />
                  <TextField
                    label={t("form.profit")}
                    prefix="$"
                    value={profit !== null ? (profit / 100).toFixed(2) : "--"}
                    disabled
                    autoComplete="off"
                  />
                  <TextField
                    label={t("form.margin")}
                    suffix="%"
                    value={margin !== null ? String(margin) : "--"}
                    disabled
                    autoComplete="off"
                  />
                </InlineGrid>
              </BlockStack>
            </Card>

            {/* Inventory (default variant) */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingSm">
                  {t("form.inventory.title")}
                </Text>
                <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
                  <TextField
                    label={t("form.sku")}
                    value={base.sku}
                    onChange={(sku) => setBase((current) => ({ ...current, sku }))}
                    autoComplete="off"
                  />
                  <TextField
                    label={t("form.barcode")}
                    value={base.barcode}
                    onChange={(barcode) => setBase((current) => ({ ...current, barcode }))}
                    autoComplete="off"
                  />
                </InlineGrid>
                <Checkbox
                  label={t("form.trackQty")}
                  checked={base.trackQty}
                  onChange={(trackQty) => setBase((current) => ({ ...current, trackQty }))}
                />
                {!hasOptions && base.trackQty ? (
                  <TextField
                    label={t("form.quantity")}
                    type="number"
                    value={base.quantity}
                    onChange={(quantity) => setBase((current) => ({ ...current, quantity }))}
                    autoComplete="off"
                  />
                ) : null}
                <Checkbox
                  label={t("form.continueSelling")}
                  checked={base.continueSelling}
                  onChange={(continueSelling) =>
                    setBase((current) => ({ ...current, continueSelling }))
                  }
                />
              </BlockStack>
            </Card>

            {/* Shipping + customs */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingSm">
                  {t("form.shipping.title")}
                </Text>
                <Checkbox
                  label={t("form.physical")}
                  checked={requiresShipping}
                  onChange={setRequiresShipping}
                />
                {requiresShipping ? (
                  <>
                    <TextField
                      label={t("form.weight")}
                      type="number"
                      value={weightOz}
                      onChange={setWeightOz}
                      autoComplete="off"
                    />
                    <Divider />
                    <Text as="h3" variant="headingSm">
                      {t("form.customs.title")}
                    </Text>
                    <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
                      <TextField
                        label={t("form.origin")}
                        value={origin}
                        onChange={(value) => setOrigin(value.toUpperCase().slice(0, 2))}
                        autoComplete="off"
                        placeholder="CN"
                      />
                      <TextField
                        label={t("form.hs")}
                        value={hs}
                        onChange={setHs}
                        autoComplete="off"
                        placeholder="7117.19"
                      />
                    </InlineGrid>
                  </>
                ) : null}
              </BlockStack>
            </Card>

            {/* Variants */}
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingSm">
                    {t("form.variants.title")}
                  </Text>
                  {optionNames.length < 3 ? (
                    <Button
                      variant="plain"
                      onClick={() => {
                        setOptionNames((current) => [...current, ""]);
                        setOptionValues((current) => [...current, ""]);
                      }}
                    >
                      {t("form.variants.addOption")}
                    </Button>
                  ) : null}
                </InlineStack>
                <Text as="p" tone="subdued" variant="bodySm">
                  {t("form.variants.help")}
                </Text>
                {optionNames.map((name, index) => (
                  <InlineGrid key={index} columns={{ xs: 1, md: 3 }} gap="300">
                    <TextField
                      label={t("form.option.name")}
                      value={name}
                      onChange={(value) =>
                        setOptionNames((current) =>
                          current.map((entry, entryIndex) =>
                            entryIndex === index ? value : entry,
                          ),
                        )
                      }
                      autoComplete="off"
                    />
                    <TextField
                      label={t("form.option.values")}
                      value={optionValues[index] ?? ""}
                      onChange={(value) =>
                        setOptionValues((current) =>
                          current.map((entry, entryIndex) =>
                            entryIndex === index ? value : entry,
                          ),
                        )
                      }
                      autoComplete="off"
                    />
                    <Box paddingBlockStart="600">
                      <Button
                        tone="critical"
                        variant="plain"
                        onClick={() => {
                          setOptionNames((current) =>
                            current.filter((_, entryIndex) => entryIndex !== index),
                          );
                          setOptionValues((current) =>
                            current.filter((_, entryIndex) => entryIndex !== index),
                          );
                        }}
                      >
                        {t("form.option.remove")}
                      </Button>
                    </Box>
                  </InlineGrid>
                ))}
                {hasOptions && combos.length > 0 ? (
                  <BlockStack gap="200">
                    <Divider />
                    {combos.map((combo) => {
                      const variant = comboVariant(combo);
                      return (
                        <InlineGrid
                          key={combo.join(" / ")}
                          columns={{ xs: 1, md: 4 }}
                          gap="300"
                          alignItems="center"
                        >
                          <Text as="span" fontWeight="semibold">
                            {combo.join(" / ")}
                          </Text>
                          <TextField
                            label={`${t("form.price")} · ${combo.join(" / ")}`}
                            labelHidden
                            prefix="$"
                            value={variant.price}
                            onChange={(price) => editCombo(combo, { price })}
                            autoComplete="off"
                            inputMode="decimal"
                          />
                          <TextField
                            label={`${t("form.quantity")} · ${combo.join(" / ")}`}
                            labelHidden
                            type="number"
                            value={variant.quantity}
                            onChange={(quantity) => editCombo(combo, { quantity })}
                            autoComplete="off"
                          />
                          <TextField
                            label={`${t("form.sku")} · ${combo.join(" / ")}`}
                            labelHidden
                            placeholder="SKU"
                            value={variant.sku}
                            onChange={(sku) => editCombo(combo, { sku })}
                            autoComplete="off"
                          />
                        </InlineGrid>
                      );
                    })}
                  </BlockStack>
                ) : null}
              </BlockStack>
            </Card>

            {/* Search engine listing */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingSm">
                  {t("form.seo.title")}
                </Text>
                {/* Google-result preview */}
                <Box background="bg-surface-secondary" padding="300" borderRadius="200">
                  <BlockStack gap="050">
                    <Text as="p" variant="bodyLg">
                      <span style={{ color: "#1a0dab" }}>
                        {(seoTitle || title || t("form.title.label")).slice(0, 70)}
                      </span>
                    </Text>
                    <Text as="p" variant="bodySm">
                      <span style={{ color: "#006621" }}>
                        {`goldrose-storefront.vercel.app › products › ${handle || "…"}`}
                      </span>
                    </Text>
                    <Text as="p" tone="subdued" variant="bodySm">
                      {(seoDescription || description).slice(0, 160)}
                    </Text>
                  </BlockStack>
                </Box>
                <TextField
                  label={t("form.seo.pageTitle")}
                  value={seoTitle}
                  onChange={setSeoTitle}
                  autoComplete="off"
                  maxLength={70}
                  showCharacterCount
                />
                <TextField
                  label={t("form.seo.metaDescription")}
                  value={seoDescription}
                  onChange={setSeoDescription}
                  autoComplete="off"
                  multiline={2}
                  maxLength={160}
                  showCharacterCount
                />
                <TextField
                  label={t("form.seo.handle")}
                  value={handle}
                  onChange={(value) =>
                    setHandle(value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-"))
                  }
                  autoComplete="off"
                  helpText={t("form.seo.handleWarning")}
                />
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>

        {/* Right column */}
        <Layout.Section variant="oneThird">
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingSm">
                  {t("form.status.title")}
                </Text>
                <Select
                  label={t("form.status.title")}
                  labelHidden
                  options={[
                    { label: t("products.status.active"), value: "active" },
                    { label: t("products.status.draft"), value: "draft" },
                    { label: t("products.status.archived"), value: "archived" },
                  ]}
                  value={status}
                  onChange={setStatus}
                />
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingSm">
                  {t("form.organization.title")}
                </Text>
                <TextField
                  label={t("form.productType")}
                  value={productType}
                  onChange={setProductType}
                  autoComplete="off"
                />
                <TextField
                  label={t("form.vendor")}
                  value={vendor}
                  onChange={setVendor}
                  autoComplete="off"
                />
                <TextField
                  label={t("form.tags")}
                  value={tagsText}
                  onChange={setTagsText}
                  autoComplete="off"
                />
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={t("products.delete.title")}
        primaryAction={{
          content: t("products.delete.confirm"),
          destructive: true,
          loading: saving,
          onAction: () =>
            startSaving(async () => {
              await deleteProductsAction([initial.id!]);
              router.push("/admin/products");
            }),
        }}
        secondaryActions={[{ content: t("common.cancel"), onAction: () => setConfirmDelete(false) }]}
      >
        <Modal.Section>
          <Text as="p">{t("products.delete.body")}</Text>
        </Modal.Section>
      </Modal>

      {toast ? <Toast content={toast} onDismiss={() => setToast(null)} /> : null}
    </Page>
  );
}
