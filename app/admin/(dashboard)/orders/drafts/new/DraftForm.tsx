"use client";

/**
 * ROLE OF THIS FILE
 * Client half of the draft-order form (§9.4): variant + quantity rows,
 * customer email, discount code, note.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Banner,
  BlockStack,
  Button,
  Card,
  InlineGrid,
  Page,
  Select,
  TextField,
} from "@shopify/polaris";
import { useAdminT } from "../../../../PolarisShell";
import { createDraftAction } from "../actions";

export type DraftVariantOption = { variantId: string; label: string };

type LineDraft = { variantId: string; quantity: string };

export function DraftForm({ variants }: { variants: DraftVariantOption[] }) {
  const t = useAdminT();
  const router = useRouter();
  const [saving, startSaving] = useTransition();

  const [lines, setLines] = useState<LineDraft[]>([
    { variantId: variants[0]?.variantId ?? "", quantity: "1" },
  ]);
  const [email, setEmail] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const options = variants.map((variant) => ({
    label: variant.label,
    value: variant.variantId,
  }));

  function save() {
    setError(null);
    startSaving(async () => {
      const result = await createDraftAction({
        lines: lines
          .filter((line) => line.variantId)
          .map((line) => ({
            variantId: line.variantId,
            quantity: Number.parseInt(line.quantity, 10) || 1,
          })),
        email: email.trim() || null,
        note: note.trim() || null,
        discountCode: discountCode.trim() || null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/admin/orders/${result.id}`);
    });
  }

  return (
    <Page
      title={t("drafts.create")}
      backAction={{ url: "/admin/orders/drafts" }}
      primaryAction={{
        content: t("drafts.form.save"),
        onAction: save,
        loading: saving,
      }}
    >
      <BlockStack gap="400">
        {error ? <Banner tone="critical">{error}</Banner> : null}
        <Card>
          <BlockStack gap="300">
            {lines.map((line, index) => (
              <InlineGrid key={index} columns={{ xs: 1, md: 3 }} gap="300">
                <Select
                  label={t("drafts.form.product")}
                  options={options}
                  value={line.variantId}
                  onChange={(variantId) =>
                    setLines((current) =>
                      current.map((entry, entryIndex) =>
                        entryIndex === index ? { ...entry, variantId } : entry,
                      ),
                    )
                  }
                />
                <TextField
                  label={t("drafts.form.quantity")}
                  type="number"
                  value={line.quantity}
                  onChange={(quantity) =>
                    setLines((current) =>
                      current.map((entry, entryIndex) =>
                        entryIndex === index ? { ...entry, quantity } : entry,
                      ),
                    )
                  }
                  autoComplete="off"
                />
                <div style={{ alignSelf: "end" }}>
                  {lines.length > 1 ? (
                    <Button
                      tone="critical"
                      variant="plain"
                      onClick={() =>
                        setLines((current) =>
                          current.filter(
                            (_, entryIndex) => entryIndex !== index,
                          ),
                        )
                      }
                    >
                      {t("form.option.remove")}
                    </Button>
                  ) : null}
                </div>
              </InlineGrid>
            ))}
            <Button
              variant="plain"
              onClick={() =>
                setLines((current) => [
                  ...current,
                  { variantId: variants[0]?.variantId ?? "", quantity: "1" },
                ])
              }
            >
              {t("drafts.form.addLine")}
            </Button>
          </BlockStack>
        </Card>
        <Card>
          <BlockStack gap="300">
            <TextField
              label={t("drafts.form.customerEmail")}
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="off"
            />
            <TextField
              label={t("drafts.form.discountCode")}
              value={discountCode}
              onChange={(next) => setDiscountCode(next.toUpperCase())}
              autoComplete="off"
            />
            <TextField
              label={t("drafts.form.note")}
              value={note}
              onChange={setNote}
              multiline={3}
              autoComplete="off"
            />
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
