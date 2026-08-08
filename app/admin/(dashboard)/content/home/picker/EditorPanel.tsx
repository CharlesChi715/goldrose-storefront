"use client";

/**
 * ROLE OF THIS FILE
 * The editor that opens beside the preview when something is picked.
 *
 * DOCKED, NOT FLOATING (owner, 2026-08-08)
 * A popover on the spot is nearer the finger but covers the very thing being
 * judged, which is the thing the owner opened it to look at. This sits in the
 * column beside the preview, aligned to the picked element's own height, and the
 * overlay draws a curve between the two so the pairing is never in doubt.
 *
 * IT SHOWS EVERY FIELD THE PICKED ELEMENT CARRIES
 * A footer link is both the word you see and the place it goes; a destination
 * has no pixels of its own to be picked by. `data-field` therefore names one or
 * more slots, most-visible first, and all of them open together — which is how a
 * no-pixel field gets edited at all.
 */

import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  InlineStack,
  Text,
  TextField,
} from "@shopify/polaris";
import { useAdminLang, useAdminT } from "../../../../PolarisShell";
import type { FieldView, SectionView } from "../HomeSectionsEditor";

/** One picked field, resolved back to its section. */
export type PickedField = {
  key: string;
  section: SectionView;
  field: FieldView;
};

export function EditorPanel({
  picked,
  valueOf,
  errorOf,
  dirtyOf,
  onChange,
  onOpenPhoto,
  onReset,
  onClose,
  pending,
  panelRef,
  top,
}: {
  picked: PickedField[];
  valueOf: (section: SectionView, field: FieldView) => string;
  errorOf: (field: FieldView, value: string) => string | undefined;
  dirtyOf: (key: string) => boolean;
  onChange: (key: string, value: string) => void;
  onOpenPhoto: (picked: PickedField) => void;
  onReset: (picked: PickedField) => void;
  onClose: () => void;
  pending: boolean;
  panelRef: React.RefObject<HTMLDivElement | null>;
  /** Where to sit, so the panel lines up with what it is editing. */
  top: number;
}) {
  const t = useAdminT();
  const zh = useAdminLang() === "zh";
  if (picked.length === 0) return null;

  const first = picked[0];

  return (
    <div
      ref={panelRef}
      data-home-editor-panel
      style={{
        position: "absolute",
        left: 0,
        // Follows the element down the preview, but never above its own column.
        top: Math.max(0, top),
        width: "100%",
        transition: "top 160ms ease",
        zIndex: 520,
      }}
    >
      <Card>
        <BlockStack gap="300">
          <InlineStack align="space-between" blockAlign="center" gap="200">
            <InlineStack gap="200" blockAlign="center">
              <Badge>{first.section.module}</Badge>
              <Text as="span" variant="bodySm" tone="subdued">
                {zh ? first.section.titleZh : first.section.title}
              </Text>
            </InlineStack>
            <Button variant="plain" onClick={onClose}>
              {t("home.picker.close")}
            </Button>
          </InlineStack>

          {picked.map(({ key, section, field }) => {
            const value = valueOf(section, field);
            const error = errorOf(field, value);
            const dirty = dirtyOf(key);
            const label = zh ? field.labelZh : field.label;
            const note = (zh ? field.noteZh : field.note) ?? undefined;
            const readOnly =
              field.kind === "artwork" || field.kind === "managed";

            /* Read-only: the owner asked that hovering a Figma-baked label
               answer rather than stay silent, so it opens and explains. */
            if (readOnly) {
              return (
                <BlockStack key={key} gap="150">
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="span" variant="bodyMd">
                      {label}
                    </Text>
                    <Badge tone="attention">
                      {field.kind === "artwork"
                        ? t("home.artwork")
                        : t("home.managed")}
                    </Badge>
                  </InlineStack>
                  <Banner tone="info">
                    <p>{note ?? t("home.artworkHelp")}</p>
                  </Banner>
                </BlockStack>
              );
            }

            if (field.kind === "image") {
              return (
                <BlockStack key={key} gap="200">
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="span" variant="bodyMd">
                      {label}
                    </Text>
                    {dirty || field.edited ? (
                      <Badge tone="info">{t("home.edited")}</Badge>
                    ) : null}
                  </InlineStack>
                  <InlineStack gap="200">
                    <Button
                      disabled={pending}
                      onClick={() =>
                        onOpenPhoto({ key, section, field } as PickedField)
                      }
                    >
                      {t("home.photo.change")}
                    </Button>
                    {dirty || field.edited ? (
                      <Button
                        variant="plain"
                        disabled={pending}
                        onClick={() =>
                          onReset({ key, section, field } as PickedField)
                        }
                      >
                        {t("home.reset")}
                      </Button>
                    ) : null}
                  </InlineStack>
                  {note ? (
                    <Text as="span" variant="bodySm" tone="subdued">
                      {note}
                    </Text>
                  ) : null}
                </BlockStack>
              );
            }

            const budget = field.max;
            const over = budget !== null && value.length > budget;

            return (
              <BlockStack key={key} gap="100">
                <TextField
                  label={
                    <InlineStack gap="200" blockAlign="center">
                      <Text as="span" variant="bodyMd">
                        {label}
                      </Text>
                      {dirty || field.edited ? (
                        <Badge tone="info">{t("home.edited")}</Badge>
                      ) : null}
                    </InlineStack>
                  }
                  value={value}
                  autoFocus={key === first.key}
                  multiline={
                    field.kind === "multiline"
                      ? Math.min(field.lines ?? 2, 6)
                      : undefined
                  }
                  type={field.kind === "number" ? "number" : undefined}
                  suffix={field.unit ?? undefined}
                  autoComplete="off"
                  error={error}
                  helpText={note}
                  onChange={(next) => onChange(key, next)}
                />
                <InlineStack align="space-between" blockAlign="center">
                  <Box>
                    {over ? (
                      <Text as="span" variant="bodySm" tone="caution">
                        {t("home.overBudget")}
                      </Text>
                    ) : budget !== null ? (
                      <Text as="span" variant="bodySm" tone="subdued">
                        {value.length} {t("home.charsOf")} {budget}{" "}
                        {t("home.chars")}
                      </Text>
                    ) : null}
                  </Box>
                  {dirty || field.edited ? (
                    <Button
                      variant="plain"
                      disabled={pending}
                      onClick={() =>
                        onReset({ key, section, field } as PickedField)
                      }
                    >
                      {dirty && !field.edited
                        ? t("home.undo")
                        : t("home.reset")}
                    </Button>
                  ) : null}
                </InlineStack>
                {field.kind === "number" ? (
                  <Banner tone="info">
                    <p>{t("home.picker.needsSave")}</p>
                  </Banner>
                ) : null}
              </BlockStack>
            );
          })}
        </BlockStack>
      </Card>
    </div>
  );
}
