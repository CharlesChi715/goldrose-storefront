"use client";

/**
 * ROLE OF THIS FILE
 * Client half of /admin/settings (§9.11): every applicable Shopify
 * settings page as a section card with its own save. Dollar inputs convert
 * to integer cents on save.
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
  InlineGrid,
  InlineStack,
  Page,
  Text,
  TextField,
  Toast,
} from "@shopify/polaris";
import type { SettingsShape } from "@/lib/admin/settings";
import { useAdminT } from "../../PolarisShell";
import {
  saveCheckoutSettingsAction,
  saveLowStockAction,
  saveNotificationsAction,
  savePolicyAction,
  saveSearchEngineAction,
  saveShippingZonesAction,
  saveStoreSettingsAction,
  saveTaxAction,
} from "./actions";

type ZoneDraft = {
  id: string;
  name: string;
  countriesText: string;
  rate: string;
  freeOver: string;
  placeholder?: boolean;
};

function dollars(cents: number | null): string {
  return cents === null ? "" : (cents / 100).toFixed(2);
}

function toCents(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) && parsed >= 0
    ? Math.round(parsed * 100)
    : null;
}

export function SettingsView({
  settings,
  payment,
  owners,
  policies,
}: {
  settings: SettingsShape;
  payment: {
    mode: "mock" | "sandbox" | "live";
    clientIdTail: string | null;
    webhookConfigured: boolean;
  };
  owners: string[];
  policies: { refund: string; privacy: string; terms: string };
}) {
  const t = useAdminT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // General
  const [storeName, setStoreName] = useState(settings.store.name);
  const [contactEmail, setContactEmail] = useState(
    settings.store.contact_email,
  );
  const [orderPrefix, setOrderPrefix] = useState(
    settings.store.order_number_prefix,
  );

  // Legal identity — the registered entity behind the brand. Edited as one
  // textarea because postal formats differ per country; stored as one line
  // per array entry.
  const [legalName, setLegalName] = useState(settings.store.legal_name);
  const [registrationNumber, setRegistrationNumber] = useState(
    settings.store.registration_number,
  );
  const [addressText, setAddressText] = useState(
    settings.store.address_lines.join("\n"),
  );

  // Checkout
  const [discountField, setDiscountField] = useState(
    settings.checkout.discount_field_enabled,
  );

  // Shipping zones
  const [zones, setZones] = useState<ZoneDraft[]>(
    settings.shipping_zones.map((zone) => ({
      id: zone.id,
      name: zone.name,
      countriesText: zone.countries.join(", "),
      rate: dollars(zone.rate_cents),
      freeOver: dollars(zone.free_over_cents),
      placeholder: zone.placeholder,
    })),
  );

  // Tax
  const [taxRate, setTaxRate] = useState(String(settings.tax.rate_percent));

  // Notifications + low stock
  const [notifications, setNotifications] = useState(settings.notifications);
  const [lowStock, setLowStock] = useState(
    String(settings.low_stock_threshold),
  );

  // Policies
  const [refund, setRefund] = useState(policies.refund);
  const [privacy, setPrivacy] = useState(policies.privacy);
  const [terms, setTerms] = useState(policies.terms);

  // Search engine & AI
  const [homeTitle, setHomeTitle] = useState(settings.search_engine.home_title);
  const [homeDescription, setHomeDescription] = useState(
    settings.search_engine.home_description,
  );
  const [socialImage, setSocialImage] = useState(
    settings.search_engine.social_image,
  );
  const [allowAi, setAllowAi] = useState(
    settings.search_engine.allow_ai_crawlers,
  );

  function save(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
        setToast(t("settings.saved"));
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Save failed");
      }
    });
  }

  function updateZone(index: number, patch: Partial<ZoneDraft>) {
    setZones((current) =>
      current.map((zone, zoneIndex) =>
        zoneIndex === index ? { ...zone, ...patch } : zone,
      ),
    );
  }

  return (
    <Page title={t("nav.settings")}>
      <BlockStack gap="400">
        {error ? <Banner tone="critical">{error}</Banner> : null}

        {/* General — clone-lite */}
        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingSm">
              {t("settings.general.title")}
            </Text>
            <InlineGrid columns={{ xs: 1, md: 3 }} gap="300">
              <TextField
                label={t("settings.general.storeName")}
                value={storeName}
                onChange={setStoreName}
                autoComplete="off"
              />
              <TextField
                label={t("settings.general.contactEmail")}
                type="email"
                value={contactEmail}
                onChange={setContactEmail}
                autoComplete="off"
              />
              <TextField
                label={t("settings.general.orderPrefix")}
                value={orderPrefix}
                onChange={setOrderPrefix}
                autoComplete="off"
                maxLength={10}
              />
            </InlineGrid>

            <Divider />
            <Text as="h3" variant="headingSm">
              {t("settings.legal.title")}
            </Text>
            <Text as="p" tone="subdued" variant="bodySm">
              {t("settings.legal.help")}
            </Text>
            <InlineGrid columns={{ xs: 1, md: 2 }} gap="300">
              <TextField
                label={t("settings.legal.legalName")}
                value={legalName}
                onChange={setLegalName}
                autoComplete="off"
                maxLength={200}
              />
              <TextField
                label={t("settings.legal.registrationNumber")}
                value={registrationNumber}
                onChange={setRegistrationNumber}
                autoComplete="off"
                maxLength={80}
              />
            </InlineGrid>
            <TextField
              label={t("settings.legal.address")}
              helpText={t("settings.legal.addressHelp")}
              value={addressText}
              onChange={setAddressText}
              autoComplete="off"
              multiline={4}
            />
            <InlineStack align="end">
              <Button
                variant="primary"
                loading={pending}
                onClick={() =>
                  save(() =>
                    saveStoreSettingsAction({
                      name: storeName,
                      legal_name: legalName,
                      registration_number: registrationNumber,
                      address_lines: addressText
                        .split("\n")
                        .map((line) => line.trim())
                        .filter((line) => line.length > 0),
                      contact_email: contactEmail,
                      order_number_prefix: orderPrefix,
                    }),
                  )
                }
              >
                {t("common.save")}
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>

        {/* Payments — adapt: provider status */}
        <Card>
          <BlockStack gap="200">
            <Text as="h2" variant="headingSm">
              {t("settings.payments.title")}
            </Text>
            <InlineStack gap="200" blockAlign="center">
              <Text as="span">{t("settings.payments.provider")}: PayPal</Text>
              <Badge
                tone={
                  payment.mode === "live"
                    ? "critical"
                    : payment.mode === "sandbox"
                      ? "warning"
                      : "info"
                }
              >
                {t(`settings.payments.mode.${payment.mode}`)}
              </Badge>
            </InlineStack>
            {payment.clientIdTail ? (
              <Text as="p" tone="subdued" variant="bodySm">
                {t("settings.payments.clientId")}: {payment.clientIdTail}
              </Text>
            ) : null}
            <Text as="p" tone="subdued" variant="bodySm">
              {payment.webhookConfigured
                ? t("settings.payments.webhook.ok")
                : t("settings.payments.webhook.missing")}
            </Text>
          </BlockStack>
        </Card>

        {/* Checkout — adapt */}
        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingSm">
              {t("settings.checkout.title")}
            </Text>
            {payment.mode === "mock" ? (
              <Banner tone="info">{t("settings.checkout.mockNote")}</Banner>
            ) : null}
            <Checkbox
              label={t("settings.checkout.discountToggle")}
              checked={discountField}
              onChange={setDiscountField}
            />
            <InlineStack align="end">
              <Button
                variant="primary"
                loading={pending}
                onClick={() =>
                  save(() =>
                    saveCheckoutSettingsAction({
                      discount_field_enabled: discountField,
                    }),
                  )
                }
              >
                {t("common.save")}
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>

        {/* Shipping and delivery — zone-based rates */}
        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingSm">
              {t("settings.shipping.title")}
            </Text>
            {zones.map((zone, index) => (
              <BlockStack key={zone.id} gap="200">
                {index > 0 ? <Divider /> : null}
                {zone.placeholder ? (
                  <Banner tone="warning">
                    {t("settings.shipping.placeholderNote")}
                  </Banner>
                ) : null}
                <InlineGrid columns={{ xs: 1, md: 4 }} gap="300">
                  <TextField
                    label={t("settings.shipping.zone.name")}
                    value={zone.name}
                    onChange={(name) => updateZone(index, { name })}
                    autoComplete="off"
                  />
                  <TextField
                    label={t("settings.shipping.zone.countries")}
                    value={zone.countriesText}
                    onChange={(countriesText) =>
                      updateZone(index, { countriesText })
                    }
                    autoComplete="off"
                  />
                  <TextField
                    label={t("settings.shipping.zone.rate")}
                    prefix="$"
                    value={zone.rate}
                    onChange={(rate) => updateZone(index, { rate })}
                    autoComplete="off"
                    inputMode="decimal"
                  />
                  <TextField
                    label={t("settings.shipping.zone.freeOver")}
                    prefix="$"
                    value={zone.freeOver}
                    onChange={(freeOver) => updateZone(index, { freeOver })}
                    autoComplete="off"
                    inputMode="decimal"
                  />
                </InlineGrid>
                {zones.length > 1 ? (
                  <InlineStack align="start">
                    <Button
                      variant="plain"
                      tone="critical"
                      onClick={() =>
                        setZones((current) =>
                          current.filter((_, zoneIndex) => zoneIndex !== index),
                        )
                      }
                    >
                      {t("settings.shipping.zone.remove")}
                    </Button>
                  </InlineStack>
                ) : null}
              </BlockStack>
            ))}
            <InlineStack align="space-between">
              <Button
                variant="plain"
                onClick={() =>
                  setZones((current) => [
                    ...current,
                    {
                      id: `zone-${current.length + 1}-${current.map((z) => z.id).join("").length}`,
                      name: "",
                      countriesText: "",
                      rate: "0.00",
                      freeOver: "",
                    },
                  ])
                }
              >
                {t("settings.shipping.zone.add")}
              </Button>
              <Button
                variant="primary"
                loading={pending}
                onClick={() =>
                  save(() =>
                    saveShippingZonesAction(
                      zones.map((zone) => ({
                        id: zone.id,
                        name: zone.name,
                        countries: zone.countriesText
                          .split(/[,，\s]+/)
                          .map((code) => code.trim().toUpperCase())
                          .filter(Boolean)
                          .map((code) =>
                            code === "*" ? "*" : code.slice(0, 2),
                          ),
                        rate_cents: toCents(zone.rate) ?? 0,
                        free_over_cents: toCents(zone.freeOver),
                        ...(zone.placeholder !== undefined
                          ? { placeholder: zone.placeholder }
                          : {}),
                      })),
                    ),
                  )
                }
              >
                {t("common.save")}
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>

        {/* Markets — adapt */}
        <Card>
          <BlockStack gap="200">
            <Text as="h2" variant="headingSm">
              {t("settings.markets.title")}
            </Text>
            <Text as="p" tone="subdued">
              {t("settings.markets.note")}
            </Text>
            <BlockStack gap="100">
              {zones.map((zone) => (
                <Text as="p" key={zone.id} variant="bodySm">
                  <strong>{zone.name || "—"}</strong>:{" "}
                  {zone.countriesText || "—"}
                </Text>
              ))}
            </BlockStack>
          </BlockStack>
        </Card>

        {/* Taxes and duties — adapt */}
        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingSm">
              {t("settings.taxes.title")}
            </Text>
            <TextField
              label={t("settings.taxes.rate")}
              type="number"
              value={taxRate}
              onChange={setTaxRate}
              autoComplete="off"
              suffix="%"
              helpText={t("settings.taxes.note")}
            />
            <InlineStack align="end">
              <Button
                variant="primary"
                loading={pending}
                onClick={() =>
                  save(() =>
                    saveTaxAction({
                      rate_percent: Number.parseFloat(taxRate) || 0,
                      note: settings.tax.note,
                    }),
                  )
                }
              >
                {t("common.save")}
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>

        {/* Notifications — adapt */}
        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingSm">
              {t("settings.notifications.title")}
            </Text>
            <Checkbox
              label={t("settings.notifications.orderConfirmation")}
              checked={notifications.order_confirmation}
              onChange={(order_confirmation) =>
                setNotifications((current) => ({
                  ...current,
                  order_confirmation,
                }))
              }
            />
            <Checkbox
              label={t("settings.notifications.shippingConfirmation")}
              checked={notifications.shipping_confirmation}
              onChange={(shipping_confirmation) =>
                setNotifications((current) => ({
                  ...current,
                  shipping_confirmation,
                }))
              }
            />
            <Checkbox
              label={t("settings.notifications.newOrderAlert")}
              checked={notifications.new_order_alert}
              onChange={(new_order_alert) =>
                setNotifications((current) => ({ ...current, new_order_alert }))
              }
            />
            <Text as="p" tone="subdued" variant="bodySm">
              {t("settings.notifications.note")}
            </Text>
            <TextField
              label={t("settings.lowStock")}
              type="number"
              value={lowStock}
              onChange={setLowStock}
              autoComplete="off"
            />
            <InlineStack align="end">
              <Button
                variant="primary"
                loading={pending}
                onClick={() =>
                  save(async () => {
                    await saveNotificationsAction(notifications);
                    await saveLowStockAction(
                      Number.parseInt(lowStock, 10) || 0,
                    );
                  })
                }
              >
                {t("common.save")}
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>

        {/* Users and permissions — adapt */}
        <Card>
          <BlockStack gap="200">
            <Text as="h2" variant="headingSm">
              {t("settings.users.title")}
            </Text>
            {owners.map((owner) => (
              <InlineStack key={owner} gap="200" blockAlign="center">
                <Badge>{t("settings.users.owner")}</Badge>
                <Text as="span">{owner}</Text>
              </InlineStack>
            ))}
            <Text as="p" tone="subdued" variant="bodySm">
              {t("settings.users.note")}
            </Text>
          </BlockStack>
        </Card>

        {/* Policies — clone-lite (writes site_content, §7.9) */}
        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingSm">
              {t("settings.policies.title")}
            </Text>
            <TextField
              label={t("settings.policies.refund")}
              value={refund}
              onChange={setRefund}
              multiline={4}
              autoComplete="off"
            />
            <TextField
              label={t("settings.policies.privacy")}
              value={privacy}
              onChange={setPrivacy}
              multiline={4}
              autoComplete="off"
            />
            <TextField
              label={t("settings.policies.terms")}
              value={terms}
              onChange={setTerms}
              multiline={4}
              autoComplete="off"
            />
            <InlineStack align="end">
              <Button
                variant="primary"
                loading={pending}
                onClick={() =>
                  save(async () => {
                    await savePolicyAction("policy.refund", refund);
                    await savePolicyAction("policy.privacy", privacy);
                    await savePolicyAction("policy.terms", terms);
                  })
                }
              >
                {t("common.save")}
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>

        {/* Search engine & AI — the adapted Preferences SEO + GEO toggle (§8.1) */}
        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingSm">
              {t("settings.search.title")}
            </Text>
            <TextField
              label={t("settings.search.homeTitle")}
              value={homeTitle}
              onChange={setHomeTitle}
              autoComplete="off"
              maxLength={120}
              showCharacterCount
            />
            <TextField
              label={t("settings.search.homeDescription")}
              value={homeDescription}
              onChange={setHomeDescription}
              multiline={2}
              autoComplete="off"
              maxLength={320}
              showCharacterCount
            />
            <TextField
              label={t("settings.search.socialImage")}
              value={socialImage}
              onChange={setSocialImage}
              autoComplete="off"
            />
            <Checkbox
              label={t("settings.search.aiToggle")}
              checked={allowAi}
              onChange={setAllowAi}
              helpText={t("settings.search.aiHelp")}
            />
            <InlineStack align="end">
              <Button
                variant="primary"
                loading={pending}
                onClick={() =>
                  save(() =>
                    saveSearchEngineAction({
                      home_title: homeTitle,
                      home_description: homeDescription,
                      social_image: socialImage,
                      allow_ai_crawlers: allowAi,
                    }),
                  )
                }
              >
                {t("common.save")}
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>

        {/* Languages — note */}
        <Card>
          <BlockStack gap="200">
            <Text as="h2" variant="headingSm">
              {t("settings.languages.title")}
            </Text>
            <Text as="p" tone="subdued">
              {t("settings.languages.note")}
            </Text>
          </BlockStack>
        </Card>
      </BlockStack>

      {toast ? (
        <Toast content={toast} onDismiss={() => setToast(null)} />
      ) : null}
    </Page>
  );
}
