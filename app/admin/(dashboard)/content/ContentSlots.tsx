"use client";

/**
 * ROLE OF THIS FILE
 * Client half of Content → Slots (§9.8): text input, save, one-click
 * "Reset to original" (§7.9), with the §11 glyph-drift caveat inline.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Banner,
  BlockStack,
  Button,
  Card,
  InlineStack,
  Page,
  Text,
  TextField,
  Toast,
} from "@shopify/polaris";
import type { ContentSlot } from "@/lib/content";
import { useAdminT } from "../../PolarisShell";
import { resetSlotAction, saveSlotAction } from "./actions";

export function ContentSlots({ slots }: { slots: ContentSlot[] }) {
  const t = useAdminT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>(
    Object.fromEntries(slots.map((slot) => [slot.key, slot.text])),
  );

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      await action();
      setToast(t("content.saved"));
      router.refresh();
    });
  }

  return (
    <Page title={t("nav.content")}>
      <BlockStack gap="400">
        {/* Entry point to the homepage editor — the storefront's biggest body
            of owner-editable copy lives there, not in the slot list below. */}
        <Card>
          <BlockStack gap="200">
            <Text as="h2" variant="headingSm">
              {t("content.home.link.title")}
            </Text>
            <Text as="p" tone="subdued">
              {t("content.home.link.body")}
            </Text>
            <InlineStack align="end">
              <Button url="/admin/content/home">
                {t("content.home.link.action")}
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>
        <Text as="h2" variant="headingSm">
          {t("content.slots.title")}
        </Text>
        {slots.map((slot) => (
          <Card key={slot.key}>
            <BlockStack gap="300">
              <TextField
                label={slot.label}
                value={drafts[slot.key] ?? ""}
                onChange={(text) =>
                  setDrafts((current) => ({ ...current, [slot.key]: text }))
                }
                autoComplete="off"
                helpText={slot.help || t("content.slot.help.promo")}
              />
              {!slot.isDefault ? (
                <Banner tone="info">{t("content.slot.help.promo")}</Banner>
              ) : null}
              <InlineStack align="end" gap="200">
                {!slot.isDefault ? (
                  <Button
                    loading={pending}
                    onClick={() =>
                      run(async () => {
                        await resetSlotAction(slot.key);
                        setDrafts((current) => ({
                          ...current,
                          [slot.key]: slot.defaultText,
                        }));
                      })
                    }
                  >
                    {t("content.reset")}
                  </Button>
                ) : null}
                <Button
                  variant="primary"
                  loading={pending}
                  disabled={(drafts[slot.key] ?? "") === slot.text}
                  onClick={() =>
                    run(() => saveSlotAction(slot.key, drafts[slot.key] ?? ""))
                  }
                >
                  {t("common.save")}
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        ))}
      </BlockStack>
      {toast ? (
        <Toast content={toast} onDismiss={() => setToast(null)} />
      ) : null}
    </Page>
  );
}
