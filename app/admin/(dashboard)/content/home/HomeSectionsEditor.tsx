"use client";

/**
 * ROLE OF THIS FILE
 * Client half of Content → Home page (§9.8): one annotated section per band of
 * the storefront home page, in page order, with every editable string, its
 * "Edited" state and one-click reset, plus the section's show/hide switch.
 *
 * Three decisions worth knowing:
 * - Edits are held locally and published by ONE "Save changes" action, because
 *   the homepage revalidates as a whole — a save per field would republish the
 *   page a dozen times for one round of copy edits.
 * - Character budgets warn, never block. The design's boxes are fixed-width, so
 *   long copy is clipped on the live page, but only the design team can say
 *   what truly fits — an owner writing one character over should see a caution,
 *   not a wall.
 * - Fields the owner cannot type into are still listed (design artwork, data
 *   owned by another screen) with the reason, so this screen is a complete
 *   inventory of the page rather than a partial one with silent gaps.
 */

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  InlineStack,
  Layout,
  Link as PolarisLink,
  Modal,
  Page,
  Text,
  TextField,
  Toast,
} from "@shopify/polaris";
import { useAdminLang, useAdminT } from "../../../PolarisShell";
import {
  resetHomeFieldAction,
  resetHomePageAction,
  resetHomeSectionAction,
  saveHomeFieldsAction,
  setHomeSectionVisibleAction,
} from "./actions";

/** One field as the server flattened it — both languages, ready to render. */
export type FieldView = {
  id: string;
  label: string;
  labelZh: string;
  kind: "text" | "multiline" | "url" | "artwork" | "managed";
  value: string;
  defaultValue: string;
  edited: boolean;
  group: string | null;
  groupZh: string | null;
  max: number | null;
  lines: number | null;
  note: string | null;
  noteZh: string | null;
  managedAt: string | null;
};

/** One homepage section as the server flattened it. */
export type SectionView = {
  id: string;
  module: string;
  title: string;
  titleZh: string;
  blurb: string;
  blurbZh: string;
  hideable: boolean;
  visible: boolean;
  fields: FieldView[];
};

/** Which confirmation modal is open, if any. */
type Confirm = { kind: "page" } | { kind: "section"; id: string } | null;

/** Same rule as lib/home-content's isSafeHref, for inline feedback as you type. */
function isSafeHref(value: string): boolean {
  const href = value.trim();
  if (href.length === 0 || href.length > 2000) return false;
  if (href.startsWith("/") || href.startsWith("#")) return !href.includes(":");
  return /^(https?:\/\/|mailto:|tel:)/i.test(href);
}

export function HomeSectionsEditor({ sections }: { sections: SectionView[] }) {
  const t = useAdminT();
  const lang = useAdminLang();
  const zh = lang === "zh";
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  /** The live value of a field: the local draft if touched, else what is saved. */
  const valueOf = (section: SectionView, field: FieldView): string =>
    drafts[`${section.id}.${field.id}`] ?? field.value;

  const edits = useMemo(
    () =>
      sections.flatMap((section) =>
        section.fields
          .filter(
            (field) =>
              drafts[`${section.id}.${field.id}`] !== undefined &&
              drafts[`${section.id}.${field.id}`] !== field.value,
          )
          .map((field) => ({
            section: section.id,
            field: field.id,
            value: drafts[`${section.id}.${field.id}`] as string,
          })),
      ),
    [sections, drafts],
  );

  // A bad link would be rejected server-side anyway; blocking the save here
  // keeps the owner from losing a whole round of edits to one typo.
  const badLinks = useMemo(
    () =>
      sections.flatMap((section) =>
        section.fields
          .filter(
            (field) =>
              field.kind === "url" && !isSafeHref(valueOf(section, field)),
          )
          .map((field) => `${section.id}.${field.id}`),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sections, drafts],
  );

  function run(action: () => Promise<void>, message: string) {
    startTransition(async () => {
      try {
        await action();
        setToast(message);
        router.refresh();
      } catch {
        setToast(t("home.saveFailed"));
      }
    });
  }

  function save() {
    const payload = edits;
    run(async () => {
      await saveHomeFieldsAction(payload);
      setDrafts({});
    }, t("home.saved"));
  }

  /** Fields grouped by their optional sub-heading, in registry order. */
  function groupsOf(section: SectionView) {
    const groups: { label: string | null; fields: FieldView[] }[] = [];
    for (const field of section.fields) {
      const label = zh ? field.groupZh : field.group;
      const last = groups[groups.length - 1];
      if (last && last.label === (label ?? null)) last.fields.push(field);
      else groups.push({ label: label ?? null, fields: [field] });
    }
    return groups;
  }

  function renderField(section: SectionView, field: FieldView) {
    const key = `${section.id}.${field.id}`;
    const label = zh ? field.labelZh : field.label;
    const note = (zh ? field.noteZh : field.note) ?? null;
    const readOnly = field.kind === "artwork" || field.kind === "managed";
    const value = valueOf(section, field);
    const budget = field.max;
    const over = budget !== null && value.length > budget;
    const badLink = field.kind === "url" && !isSafeHref(value);
    const dirty = drafts[key] !== undefined && drafts[key] !== field.value;

    return (
      <BlockStack key={key} gap="150">
        <TextField
          label={
            <InlineStack gap="200" blockAlign="center">
              <Text as="span" variant="bodyMd">
                {label}
              </Text>
              {field.kind === "artwork" ? (
                <Badge tone="attention">{t("home.artwork")}</Badge>
              ) : null}
              {field.kind === "managed" ? (
                <Badge>{t("home.managed")}</Badge>
              ) : null}
              {field.edited || dirty ? (
                <Badge tone="info">{t("home.edited")}</Badge>
              ) : null}
            </InlineStack>
          }
          value={value}
          disabled={readOnly}
          multiline={
            field.kind === "multiline"
              ? Math.min(field.lines ?? 2, 8)
              : undefined
          }
          autoComplete="off"
          error={badLink ? t("home.badHref") : undefined}
          helpText={
            readOnly
              ? (note ??
                (field.kind === "artwork" ? t("home.artworkHelp") : undefined))
              : (note ?? undefined)
          }
          onChange={(next) =>
            setDrafts((current) => ({ ...current, [key]: next }))
          }
        />
        <InlineStack align="space-between" blockAlign="center" gap="200">
          <Box>
            {over ? (
              <Text as="span" variant="bodySm" tone="caution">
                {t("home.overBudget")}
              </Text>
            ) : budget !== null && !readOnly ? (
              <Text as="span" variant="bodySm" tone="subdued">
                {value.length} {t("home.charsOf")} {budget} {t("home.chars")}
              </Text>
            ) : null}
            {field.managedAt ? (
              <PolarisLink url={field.managedAt}>
                {t("home.managedOpen")}
              </PolarisLink>
            ) : null}
          </Box>
          {field.edited || dirty ? (
            <Button
              variant="plain"
              disabled={pending}
              onClick={() => {
                if (dirty && !field.edited) {
                  setDrafts((current) => {
                    const next = { ...current };
                    delete next[key];
                    return next;
                  });
                  return;
                }
                run(async () => {
                  await resetHomeFieldAction(section.id, field.id);
                  setDrafts((current) => {
                    const next = { ...current };
                    delete next[key];
                    return next;
                  });
                }, t("home.saved"));
              }}
            >
              {t("home.reset")}
            </Button>
          ) : null}
        </InlineStack>
      </BlockStack>
    );
  }

  const dirtyCount = edits.length;

  return (
    <Page
      title={t("home.title")}
      subtitle={t("home.subtitle")}
      primaryAction={{
        content: t("common.save"),
        disabled: dirtyCount === 0 || badLinks.length > 0,
        loading: pending,
        onAction: save,
      }}
      secondaryActions={[
        { content: t("home.preview"), url: "/", external: true },
        {
          content: t("home.resetAll"),
          destructive: true,
          onAction: () => setConfirm({ kind: "page" }),
        },
      ]}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            {dirtyCount > 0 ? (
              // Save lives only on the page header, so the screen never shows
              // two buttons that mean the same thing.
              <Banner
                tone="warning"
                title={`${t("home.unsaved")} (${dirtyCount})`}
                action={{
                  content: t("home.discard"),
                  onAction: () => setDrafts({}),
                }}
              >
                <p>{t("home.unsavedBody")}</p>
              </Banner>
            ) : null}
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingSm">
                  {t("home.jump")}
                </Text>
                <InlineStack gap="200" wrap>
                  {sections.map((section) => (
                    <PolarisLink
                      key={section.id}
                      url={`#home-section-${section.id}`}
                    >
                      {`${section.module} · ${zh ? section.titleZh : section.title}`}
                    </PolarisLink>
                  ))}
                </InlineStack>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>

        {sections.map((section) => (
          <Layout.AnnotatedSection
            key={section.id}
            title={zh ? section.titleZh : section.title}
            description={zh ? section.blurbZh : section.blurb}
          >
            {/* Plain wrapper because Polaris does not forward id/data-* to the
                DOM: this is both the "jump to section" anchor target and the
                handle the e2e suite uses to act on one section. */}
            <div
              id={`home-section-${section.id}`}
              data-home-section={section.id}
            >
              <Card>
                <BlockStack gap="400">
                  <InlineStack
                    align="space-between"
                    blockAlign="center"
                    gap="200"
                  >
                    <InlineStack gap="200" blockAlign="center">
                      <Badge>{section.module}</Badge>
                      {section.hideable && !section.visible ? (
                        <Badge tone="critical">{t("home.hidden")}</Badge>
                      ) : null}
                    </InlineStack>
                    {section.hideable ? (
                      <Button
                        disabled={pending}
                        onClick={() =>
                          run(
                            () =>
                              setHomeSectionVisibleAction(
                                section.id,
                                !section.visible,
                              ),
                            t("home.saved"),
                          )
                        }
                      >
                        {section.visible ? t("home.hide") : t("home.show")}
                      </Button>
                    ) : null}
                  </InlineStack>

                  {section.hideable && !section.visible ? (
                    <Banner tone="info">
                      <p>{t("home.hiddenNote")}</p>
                    </Banner>
                  ) : null}

                  {groupsOf(section).map((group, index) => (
                    <BlockStack key={group.label ?? `g${index}`} gap="300">
                      {group.label ? (
                        <Text as="h3" variant="headingSm" tone="subdued">
                          {group.label}
                        </Text>
                      ) : null}
                      {group.fields.map((field) => renderField(section, field))}
                    </BlockStack>
                  ))}

                  <InlineStack
                    align="space-between"
                    blockAlign="center"
                    gap="200"
                  >
                    <Text as="span" variant="bodySm" tone="subdued">
                      {section.hideable ? t("home.hideNote") : ""}
                    </Text>
                    <Button
                      variant="plain"
                      tone="critical"
                      disabled={
                        pending ||
                        (!section.fields.some((field) => field.edited) &&
                          section.visible)
                      }
                      onClick={() =>
                        setConfirm({ kind: "section", id: section.id })
                      }
                    >
                      {t("home.resetSection")}
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Card>
            </div>
          </Layout.AnnotatedSection>
        ))}
      </Layout>

      <Modal
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={
          confirm?.kind === "page"
            ? t("home.resetAll.title")
            : t("home.resetSection.title")
        }
        primaryAction={{
          content:
            confirm?.kind === "page"
              ? t("home.resetAll")
              : t("home.resetSection"),
          destructive: true,
          loading: pending,
          onAction: () => {
            const target = confirm;
            setConfirm(null);
            if (!target) return;
            run(async () => {
              if (target.kind === "page") await resetHomePageAction();
              else await resetHomeSectionAction(target.id);
              setDrafts({});
            }, t("home.saved"));
          },
        }}
        secondaryActions={[
          { content: t("common.cancel"), onAction: () => setConfirm(null) },
        ]}
      >
        <Modal.Section>
          <Text as="p">
            {confirm?.kind === "page"
              ? t("home.resetAll.body")
              : t("home.resetSection.body")}
          </Text>
        </Modal.Section>
      </Modal>

      {toast ? (
        <Toast content={toast} onDismiss={() => setToast(null)} />
      ) : null}
    </Page>
  );
}
