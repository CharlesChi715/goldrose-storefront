"use client";

/**
 * ROLE OF THIS FILE
 * Client half of Content → Home page (§9.8): one annotated section per band of
 * the storefront home page, in page order, with every editable string, photo
 * and timing, its "Edited" state and one-click reset, plus the section's
 * show/hide switch — beside a live preview of the page itself.
 *
 * WHO THIS SCREEN IS FOR
 * Not only the owner. It is used by teammates who did not build the site and do
 * not have the Figma file open, so several choices here trade compactness for
 * being unmistakable:
 * - A LIVE PREVIEW sits beside the editor, on a width slider spanning the
 *   narrowest phone still in use to the widest sold today, so a teammate can
 *   see the page at the size a customer actually holds. Save, and it reloads.
 *   Be careful what you claim for it: ScaleFrame scales the whole 430 stage as
 *   ONE, so a narrower width shrinks everything rather than re-wrapping any
 *   text. It answers "is this legible on a small phone", NOT "does this copy
 *   still fit its box" — that is what the per-field character budgets are for.
 * - SEARCH spans every field on the page. With ~180 fields across 8 sections,
 *   finding "the gold caption on the second best-seller card" by scrolling is
 *   worse than typing "caption".
 * - Fields the owner CANNOT type into are still listed with the reason, so the
 *   screen is a complete inventory of the page rather than a partial one with
 *   silent gaps (§11).
 *
 * Three older decisions still hold:
 * - Edits are held locally and published by ONE "Save changes" action, because
 *   the homepage revalidates as a whole — a save per field would republish the
 *   page a dozen times for one round of copy edits.
 * - Character budgets warn, never block. The design's boxes are fixed-width, so
 *   long copy is clipped on the live page, but only the design team can say
 *   what truly fits — an owner writing one character over should see a caution,
 *   not a wall.
 * - Show/hide, and every reset, save IMMEDIATELY. They are whole-section
 *   actions with a visible confirmation of their own, and batching them behind
 *   the same button as copy edits made "Hide" look like it had not worked.
 */

import { useMemo, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Banner,
  BlockStack,
  Box,
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
import { useAdminLang, useAdminT } from "../../../PolarisShell";
import { HomePageMap } from "./HomePageMap";
import { MainPreview } from "./MainPreview";
import { PhotoPicker, type LibraryItem } from "./PhotoPicker";
import { SectionPreview } from "./SectionPreview";
import {
  resetHomeFieldAction,
  resetHomePageAction,
  resetHomeSectionAction,
  saveHomeFieldsAction,
  setHomeSectionVisibleAction,
} from "./actions";

export type { LibraryItem };

/** One field as the server flattened it — both languages, ready to render. */
export type FieldView = {
  id: string;
  label: string;
  labelZh: string;
  kind:
    "text" | "multiline" | "url" | "image" | "number" | "artwork" | "managed";
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
  /** `image`: the design box, in stage pixels. */
  box: { w: number; h: number } | null;
  /** `image`: how the photo is fitted into that box. */
  fit: "cover" | "stretch" | "window" | null;
  /** `number`: bounds and unit. */
  numMin: number | null;
  numMax: number | null;
  unit: string | null;
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
  /** Its span on the live stage, for the section map; null when it has none. */
  band: { top: number; height: number } | null;
  /**
   * The rectangle of the LIVE page this section's preview window is held over,
   * or null when the section has nothing to show at all. `borrowed` marks a
   * section that has no band of its own and is being illustrated with another
   * one; `onPage` is false when that band is switched off, so there is nothing
   * to hold a window over — see lib/home-content/preview.ts.
   */
  preview: { y: number; h: number; onPage: boolean; borrowed: boolean } | null;
  fields: FieldView[];
};

/** Which confirmation modal is open, if any. */
type Confirm = { kind: "page" } | { kind: "section"; id: string } | null;

/** Which field's photo dialog is open, if any. */
type PhotoTarget = { section: SectionView; field: FieldView } | null;

/** Remembers that the owner has dismissed the "how this screen works" note. */
const INTRO_KEY = "goldrose-admin-home-intro-dismissed";

/**
 * How far above a section the page must stop when jumping to it.
 *
 * The admin's top bar (`.Polaris-Frame__TopBar`) is 56px and `position: fixed`,
 * so it is not part of the scrollable flow: landing a section at viewport top
 * lands its first line UNDER the bar. Declared as `scroll-margin-top` on the
 * anchor rather than as arithmetic at the call site, because it then also
 * applies to a plain `#home-section-…` link — a pasted URL, a restored hash, a
 * keyboard activation — and not only to the section map's own scroll.
 */
const ADMIN_TOP_BAR = 56;
const JUMP_CLEARANCE = ADMIN_TOP_BAR + 16;

/**
 * The preview's width range, in CSS pixels — the width a website actually sees,
 * which is not the phone's physical size or its megapixel screen width.
 *
 * The ends are real phones rather than round numbers: 320 is the narrowest
 * viewport still in circulation (the original iPhone SE and compact budget
 * Androids) and 440 is the iPhone 16 Pro Max, the widest mainstream phone. In
 * between sit 360 (most Androids), 375 (iPhone SE 3), 393 (iPhone 15/16), 412
 * (Pixel 8 Pro) and 430 — the design's own canvas.
 *
 * Worth knowing before trusting this control: ScaleFrame scales the fixed 430
 * stage by `min(100vw, 480px) / 430`, so the whole page scales as ONE. Dragging
 * narrower makes everything smaller; it never re-wraps a line. The slider
 * answers "is this readable on a small phone", not "does this text fit".
 */
const PREVIEW_MIN_WIDTH = 320;
const PREVIEW_MAX_WIDTH = 440;
/** The frame's own canvas width — where the slider starts and resets to. */
const DESIGN_WIDTH = 430;

/** Nothing else writes this key, so there is no external change to subscribe to. */
const noopSubscribe = () => () => {};

/**
 * Whether the "how this screen works" note has already been dismissed.
 *
 * Read through `useSyncExternalStore` rather than in an effect: localStorage
 * does not exist while the page is rendered on the server, and the server
 * snapshot below reports "dismissed" so the note cannot flash in and out during
 * hydration. React re-renders once with the real value after hydrating.
 *
 * @returns True when the note should stay hidden.
 */
function useIntroDismissed(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => window.localStorage.getItem(INTRO_KEY) === "1",
    () => true,
  );
}

/* --- Mirrors of lib/home-content/registry.ts, for inline feedback as you type.
   Duplicated on purpose: these run on every keystroke in the browser, and the
   server re-checks the same rules at the write, which is the check that holds
   (a server action is reachable without this screen). ---------------------- */

/** Same rule as the registry's isSafeHref. */
function isSafeHref(value: string): boolean {
  const href = value.trim();
  if (href.length === 0 || href.length > 2000) return false;
  if (href.startsWith("/") || href.startsWith("#")) return !href.includes(":");
  return /^(https?:\/\/|mailto:|tel:)/i.test(href);
}

/** Same rule as the registry's isSafeImagePath. */
function isSafeImagePath(value: string): boolean {
  const path = value.trim();
  if (path.length === 0 || path.length > 500) return false;
  if (path.includes("..") || /\s/.test(path)) return false;
  if (path.startsWith("//")) return false;
  if (path.startsWith("/")) return !path.includes(":");
  return /^[A-Za-z0-9][A-Za-z0-9._/-]*\.[A-Za-z0-9]+$/.test(path);
}

/**
 * The reason a value is unacceptable, or null. Mirrors the registry's
 * `fieldError` so the reason code — and therefore the message — is the same one
 * the server would give.
 *
 * @param field - The field being edited.
 * @param value - The current draft value.
 * @returns A reason code, or null when the value is fine.
 */
function fieldError(
  field: FieldView,
  value: string,
): "href" | "image" | "number" | null {
  if (field.kind === "url") return isSafeHref(value) ? null : "href";
  if (field.kind === "image") return isSafeImagePath(value) ? null : "image";
  if (field.kind === "number") {
    const parsed = Number(value.trim());
    if (!Number.isInteger(parsed)) return "number";
    if (field.numMin !== null && parsed < field.numMin) return "number";
    if (field.numMax !== null && parsed > field.numMax) return "number";
  }
  return null;
}

/**
 * Resolve a stored path to something the browser can show. Mirrors
 * lib/files-url so the picker's thumbnails work without a round trip.
 *
 * @param storedPath - The value held in an image field.
 * @returns A URL the preview can load.
 */
function fileUrl(storedPath: string): string {
  if (storedPath.startsWith("/") || storedPath.startsWith("http")) {
    return storedPath;
  }
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  return `${base}/storage/v1/object/public/product-images/${storedPath}`;
}

export function HomeSectionsEditor({
  sections,
  library,
  frameHeight,
}: {
  sections: SectionView[];
  library: LibraryItem[];
  /** The live stage height, hidden bands already removed — the map's ruler. */
  frameHeight: number;
}) {
  const t = useAdminT();
  const lang = useAdminLang();
  const zh = lang === "zh";
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [photo, setPhoto] = useState<PhotoTarget>(null);
  const [query, setQuery] = useState("");
  const [onlyEdited, setOnlyEdited] = useState(false);
  // Dismissal is remembered across visits; `justDismissed` closes it now.
  const introDismissed = useIntroDismissed();
  const [justDismissed, setJustDismissed] = useState(false);
  const showIntro = !introDismissed && !justDismissed;
  // Bumped after every save so the preview iframe reloads; a plain reload()
  // is not available across the frame boundary once it has navigated.
  const [previewNonce, setPreviewNonce] = useState(0);
  // Which phone width the preview is standing in for. Session-local: it is a
  // way of looking at the page, not a setting that belongs to the store.
  const [previewWidth, setPreviewWidth] = useState(DESIGN_WIDTH);
  // Each section's own preview width is deliberately NOT here: it lives in the
  // SectionPreview that owns it, so dragging one slider does not re-render this
  // screen's ~180 fields on every pixel. See that file for the measurements.

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

  // A bad value would be rejected server-side anyway; blocking the save here
  // keeps the owner from losing a whole round of edits to one typo.
  const invalid = useMemo(
    () =>
      sections.flatMap((section) =>
        section.fields
          .filter(
            (field) => fieldError(field, valueOf(section, field)) !== null,
          )
          .map((field) => `${section.id}.${field.id}`),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sections, drafts],
  );

  /** How many fields in a section differ from the design, drafts included. */
  function editedCount(section: SectionView): number {
    return section.fields.filter(
      (field) => field.edited || valueOf(section, field) !== field.value,
    ).length;
  }

  /**
   * Whether a field matches the current search box.
   *
   * The section's own name is deliberately NOT searched. It reads like a
   * helpful addition and is the opposite: A-11 is called "Story, FAQ, Gift
   * card, Newsletter & Footer", so typing "gift card" would return all forty of
   * its fields instead of the four that are about the gift card. Finding a
   * whole section is what "Jump to a section" above is for.
   */
  function matches(section: SectionView, field: FieldView): boolean {
    if (onlyEdited && !field.edited) return false;
    const needle = query.trim().toLowerCase();
    if (needle.length === 0) return true;
    return [
      field.label,
      field.labelZh,
      field.group ?? "",
      field.groupZh ?? "",
      valueOf(section, field),
    ]
      .join(" ")
      .toLowerCase()
      .includes(needle);
  }

  /** Sections that still have at least one field to show, and their fields. */
  const filtered = useMemo(
    () =>
      sections
        .map((section) => ({
          section,
          fields: section.fields.filter((field) => matches(section, field)),
        }))
        .filter((entry) => entry.fields.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sections, drafts, query, onlyEdited],
  );

  const filtering = query.trim().length > 0 || onlyEdited;

  function run(action: () => Promise<void>, message: string) {
    startTransition(async () => {
      try {
        await action();
        setToast(message);
        setPreviewNonce((n) => n + 1);
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

  /** Drop one field's local draft without touching what is saved. */
  function clearDraft(key: string) {
    setDrafts((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  /** Fields grouped by their optional sub-heading, in registry order. */
  function groupsOf(fields: FieldView[]) {
    const groups: { label: string | null; fields: FieldView[] }[] = [];
    for (const field of fields) {
      const label = zh ? field.groupZh : field.group;
      const last = groups[groups.length - 1];
      if (last && last.label === (label ?? null)) last.fields.push(field);
      else groups.push({ label: label ?? null, fields: [field] });
    }
    return groups;
  }

  /** The badges that sit beside a field's label. */
  function labelFor(field: FieldView, dirty: boolean) {
    return (
      <InlineStack gap="200" blockAlign="center">
        <Text as="span" variant="bodyMd">
          {zh ? field.labelZh : field.label}
        </Text>
        {field.kind === "artwork" ? (
          <Badge tone="attention">{t("home.artwork")}</Badge>
        ) : null}
        {field.kind === "managed" ? <Badge>{t("home.managed")}</Badge> : null}
        {field.edited || dirty ? (
          <Badge tone="info">{t("home.edited")}</Badge>
        ) : null}
      </InlineStack>
    );
  }

  /** The "Reset" / "Undo" control, shown only once a field differs. */
  function resetControl(
    section: SectionView,
    field: FieldView,
    dirty: boolean,
  ) {
    if (!field.edited && !dirty) return null;
    return (
      <Button
        variant="plain"
        disabled={pending}
        onClick={() => {
          const key = `${section.id}.${field.id}`;
          // An unsaved draft is only in this browser, so dropping it needs no
          // server call — and must not touch what is published.
          if (dirty && !field.edited) {
            clearDraft(key);
            return;
          }
          run(async () => {
            await resetHomeFieldAction(section.id, field.id);
            clearDraft(key);
          }, t("home.saved"));
        }}
      >
        {dirty && !field.edited ? t("home.undo") : t("home.reset")}
      </Button>
    );
  }

  function renderField(section: SectionView, field: FieldView) {
    const key = `${section.id}.${field.id}`;
    const note = (zh ? field.noteZh : field.note) ?? null;
    const value = valueOf(section, field);
    const dirty = drafts[key] !== undefined && drafts[key] !== field.value;
    const error = fieldError(field, value);
    const errorText = error ? t(`home.bad.${error}` as never) : undefined;
    const set = (next: string) =>
      setDrafts((current) => ({ ...current, [key]: next }));

    /* --- Photo ---------------------------------------------------------- */
    if (field.kind === "image") {
      return (
        <BlockStack key={key} gap="200">
          {labelFor(field, dirty)}
          <InlineStack gap="300" blockAlign="start" wrap={false}>
            <Box
              background="bg-surface-secondary"
              borderRadius="200"
              padding="150"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fileUrl(value)}
                alt=""
                style={{
                  display: "block",
                  width: 96,
                  height: 96,
                  objectFit: "contain",
                }}
              />
            </Box>
            <BlockStack gap="150">
              <InlineStack gap="200">
                <Button
                  disabled={pending}
                  onClick={() => setPhoto({ section, field })}
                >
                  {t("home.photo.change")}
                </Button>
                {resetControl(section, field, dirty)}
              </InlineStack>
              {field.box ? (
                <Text as="span" variant="bodySm" tone="subdued">
                  {t("home.photo.size")} {field.box.w} × {field.box.h}
                  {zh ? " 像素" : " px"}
                </Text>
              ) : null}
              {note ? (
                <Text as="span" variant="bodySm" tone="subdued">
                  {note}
                </Text>
              ) : null}
              {errorText ? (
                <Text as="span" variant="bodySm" tone="critical">
                  {errorText}
                </Text>
              ) : null}
            </BlockStack>
          </InlineStack>
        </BlockStack>
      );
    }

    /* --- Number --------------------------------------------------------- */
    if (field.kind === "number") {
      return (
        <BlockStack key={key} gap="150">
          <InlineStack gap="300" blockAlign="center" wrap={false}>
            <Box width="180px">
              <TextField
                label={labelFor(field, dirty)}
                type="number"
                value={value}
                suffix={field.unit ?? undefined}
                min={field.numMin ?? undefined}
                max={field.numMax ?? undefined}
                autoComplete="off"
                error={errorText}
                helpText={note ?? undefined}
                onChange={(next) => set(next)}
              />
            </Box>
            {resetControl(section, field, dirty)}
          </InlineStack>
        </BlockStack>
      );
    }

    /* --- Text, multiline, link, and the read-only kinds ----------------- */
    const readOnly = field.kind === "artwork" || field.kind === "managed";
    const budget = field.max;
    const over = budget !== null && value.length > budget;

    return (
      <BlockStack key={key} gap="150">
        <TextField
          label={labelFor(field, dirty)}
          value={value}
          disabled={readOnly}
          multiline={
            field.kind === "multiline"
              ? Math.min(field.lines ?? 2, 8)
              : undefined
          }
          autoComplete="off"
          error={errorText}
          helpText={
            readOnly
              ? (note ??
                (field.kind === "artwork" ? t("home.artworkHelp") : undefined))
              : (note ?? undefined)
          }
          onChange={(next) => set(next)}
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
          {resetControl(section, field, dirty)}
        </InlineStack>
      </BlockStack>
    );
  }

  const dirtyCount = edits.length;
  // Which sections have an unsaved edit. The preview frames are the server
  // rendering SAVED content, so each one says so while its own fields differ —
  // the frame sits above the inputs, and a teammate who types a new headline,
  // looks up and sees the old one concludes the preview is broken.
  const dirtySections = useMemo(
    () => new Set(edits.map((edit) => edit.section)),
    [edits],
  );

  return (
    <Page
      title={t("home.title")}
      subtitle={t("home.subtitle")}
      primaryAction={{
        content: t("common.save"),
        disabled: dirtyCount === 0 || invalid.length > 0,
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
            {showIntro ? (
              <Banner
                tone="info"
                title={t("home.intro.title")}
                onDismiss={() => {
                  window.localStorage.setItem(INTRO_KEY, "1");
                  setJustDismissed(true);
                }}
              >
                <BlockStack gap="100">
                  <Text as="p">{t("home.intro.body")}</Text>
                  <Text as="p">{t("home.intro.safety")}</Text>
                </BlockStack>
              </Banner>
            ) : null}

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

            {invalid.length > 0 ? (
              <Banner tone="critical" title={t("home.blocked")}>
                <p>{t("home.blockedBody")}</p>
              </Banner>
            ) : null}

            {/* Find a field · jump to a section */}
            <Card>
              <BlockStack gap="300">
                <TextField
                  label={t("home.search")}
                  value={query}
                  placeholder={t("home.searchPlaceholder")}
                  autoComplete="off"
                  clearButton
                  onClearButtonClick={() => setQuery("")}
                  onChange={setQuery}
                />
                <Checkbox
                  label={t("home.onlyEdited")}
                  checked={onlyEdited}
                  onChange={setOnlyEdited}
                />
                {filtering ? (
                  <Text as="p" variant="bodySm" tone="subdued">
                    {filtered.reduce(
                      (total, entry) => total + entry.fields.length,
                      0,
                    )}{" "}
                    {t("home.matches")}
                  </Text>
                ) : (
                  <>
                    <Divider />
                    <Text as="h2" variant="headingSm">
                      {t("home.jump")}
                    </Text>
                    {/* The links are the page: see HomePageMap. It shares the
                        preview's nonce, so a save redraws both together. */}
                    <HomePageMap
                      frameHeight={frameHeight}
                      nonce={previewNonce}
                      sections={sections.map((section) => ({
                        id: section.id,
                        module: section.module,
                        title: section.title,
                        titleZh: section.titleZh,
                        band: section.band,
                        hideable: section.hideable,
                        visible: section.visible,
                        edited: editedCount(section),
                      }))}
                    />
                  </>
                )}
              </BlockStack>
            </Card>

            {/* The page itself, at whatever phone width the owner picks.
                Its own component so that dragging its slider re-renders one
                card rather than this screen's ~180 fields — see MainPreview. */}
            <MainPreview
              designWidth={DESIGN_WIDTH}
              min={PREVIEW_MIN_WIDTH}
              max={PREVIEW_MAX_WIDTH}
              nonce={previewNonce}
              onRefresh={() => setPreviewNonce((n) => n + 1)}
              onWidthSettled={setPreviewWidth}
            />
          </BlockStack>
        </Layout.Section>

        {filtered.length === 0 ? (
          <Layout.Section>
            <Card>
              <Text as="p" tone="subdued">
                {t("home.noMatches")}
              </Text>
            </Card>
          </Layout.Section>
        ) : null}

        {filtered.map(({ section, fields }) => (
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
              style={{ scrollMarginTop: JUMP_CLEARANCE }}
            >
              <Card>
                <BlockStack gap="400">
                  {/* The section's own preview opens the section, so what you
                      are editing is on screen before the first input. */}
                  {section.preview ? (
                    <SectionPreview
                      sectionId={section.id}
                      y={section.preview.y}
                      h={section.preview.h}
                      onPage={section.preview.onPage}
                      borrowed={section.preview.borrowed}
                      hidden={section.hideable && !section.visible}
                      stale={dirtySections.has(section.id)}
                      width={previewWidth}
                      maxWidth={PREVIEW_MAX_WIDTH}
                      frameHeight={frameHeight}
                      nonce={previewNonce}
                    />
                  ) : null}

                  <InlineStack
                    align="space-between"
                    blockAlign="center"
                    gap="200"
                  >
                    <InlineStack gap="200" blockAlign="center">
                      <Badge>{section.module}</Badge>
                      {editedCount(section) > 0 ? (
                        <Badge tone="info">
                          {`${editedCount(section)} ${t("home.editedCount")}`}
                        </Badge>
                      ) : null}
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

                  {/* Keyed by position, not by label: a section may open a
                      group, break into per-card groups, and come back to the
                      first one, so labels are not unique within a section. */}
                  {groupsOf(fields).map((group, index) => (
                    <BlockStack key={`${index}-${group.label ?? ""}`} gap="300">
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

      {photo ? (
        <PhotoPicker
          // Keyed by field so opening a different photo remounts the dialog
          // with that field's value, rather than re-using the last one's.
          key={`${photo.section.id}.${photo.field.id}`}
          open
          label={zh ? photo.field.labelZh : photo.field.label}
          value={valueOf(photo.section, photo.field)}
          defaultValue={photo.field.defaultValue}
          previewUrl={fileUrl(valueOf(photo.section, photo.field))}
          box={photo.field.box}
          fit={photo.field.fit}
          library={library}
          onChange={(path) =>
            setDrafts((current) => ({
              ...current,
              [`${photo.section.id}.${photo.field.id}`]: path,
            }))
          }
          onClose={() => setPhoto(null)}
          onUploaded={() => router.refresh()}
        />
      ) : null}

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
