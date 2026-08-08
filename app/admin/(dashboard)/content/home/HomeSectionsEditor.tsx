"use client";

/**
 * ROLE OF THIS FILE
 * Client half of Content → Home page (§9.8): one card per band of the
 * storefront home page, in page order — the band itself, live, with every
 * editable string, photo and timing beneath it, its "Edited" state and
 * one-click reset, and the section's show/hide switch.
 *
 * THREE WAYS TO REACH A FIELD, AND WHY THERE ARE THREE
 * - POINT AT IT in the section's own window. Armed from the card at the top of
 *   the screen, every window outlines what it owns and a click opens that field
 *   in an editor docked beside it. This is the fast path, and it is a MOUSE
 *   path: the preview frames are `aria-hidden` and `tabIndex={-1}` on purpose,
 *   so nothing here may be reachable only by pointing.
 * - SEARCH across every field on the page. With ~180 of them across 8 sections,
 *   finding "the gold caption on the second best-seller card" by scrolling is
 *   worse than typing "caption".
 * - READ THE LIST under each card. It is the complete inventory — including the
 *   fields the owner cannot type into, listed with the reason (§11) — and it is
 *   what a keyboard and a screen reader have.
 *
 * WHERE POINTING HAPPENS, AND WHERE IT DOES NOT (owner, 2026-08-08)
 * In the section windows; never in the page-wide preview above, which is
 * read-only. That preview answers the pointer, so pointing at it needed a
 * transparent capture layer, which swallowed the wheel, which meant re-issuing
 * the scroll programmatically — and the storefront's own `scroll-behavior:
 * smooth` then turned every wheel event into an eased animation cancelled by
 * the next one. A gesture asking for 2,000px moved 118, and scroll chaining and
 * touch were lost with it. The section windows never needed the layer: their
 * film is `pointer-events: none` inside a box that scrolls natively.
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

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
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
import { EditorPanel, type PickedField } from "./picker/EditorPanel";
import { patchField, patchFrame, whenPatchable } from "./picker/patch";
import {
  CENTRE,
  formatFrame,
  type SpotlightArea,
} from "@/lib/home-content/frames";
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

/**
 * How tall a section's preview row stands, in admin pixels.
 *
 * The editor that opens beside a preview is taken out of flow so it cannot push
 * the fields below it down the page — which means nothing stops it spilling
 * over them either, so it is capped at the row it belongs to and scrolls inside
 * that. 436 is SectionPreview's own arithmetic: the 360px window, its 24px
 * header row, the 6px stack gap and the 8px padding at each end of its Box.
 */
const PREVIEW_ROW_HEIGHT = 436;
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
  frames: savedFrames,
  frameHeight,
}: {
  sections: SectionView[];
  library: LibraryItem[];
  /** Saved framings, keyed `"<section>.<field>"` — a plain object so it can
   *  cross the server/client boundary, which a Map cannot. */
  frames: Record<string, SpotlightArea>;
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
  /** Photo framings the owner has changed but not yet saved. */
  const [frameDrafts, setFrameDrafts] = useState<Record<string, SpotlightArea>>(
    {},
  );
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

  /* --- Point-and-edit ---------------------------------------------------- */
  /**
   * Pointing happens in the SECTION WINDOWS, not here (owner, 2026-08-08).
   *
   * The page-wide preview above is read-only now. Pointing at it needed a
   * transparent layer to keep clicks off the storefront's real links, and that
   * layer had to swallow the wheel and re-issue the scroll — which the
   * storefront's own `scroll-behavior: smooth` turned into an eased animation
   * cancelled by the next wheel event. A gesture asking for 2,000px moved 118.
   * The section windows never needed any of it: their film is
   * `pointer-events: none` inside a box that scrolls natively.
   *
   * POINTING IS ALWAYS ON (owner, 2026-08-08). There was a screen-wide switch;
   * it existed only because arming used to install a capture layer that broke
   * scrolling, so it had to be something you could turn off again. With the
   * layer gone it guarded nothing — a click on a window did nothing at all
   * while disarmed — and its only real effect was hiding the feature. The
   * "outline everything editable" half now follows the pointer instead, in
   * SectionPreview, so the previews stay clean where you are not working.
   *
   * What stays HERE is only what must be shared: which single field is being
   * edited. Two panels open at once would be two answers to "what am I
   * changing", so picking in one card closes another.
   */
  const previewFrame = useRef<HTMLIFrameElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [picked, setPicked] = useState<PickedField[]>([]);
  const selectedKey = picked[0]?.key ?? null;
  const pickedSection = picked[0]?.section.id ?? null;

  /** Resolve the keys a clicked element carries back to registry fields. */
  const pickKeys = useCallback(
    (keys: string[]) => {
      const found: PickedField[] = [];
      for (const key of keys) {
        const [sectionId, ...rest] = key.split(".");
        const fieldId = rest.join(".");
        const section = sections.find((entry) => entry.id === sectionId);
        const field = section?.fields.find((entry) => entry.id === fieldId);
        if (section && field) found.push({ key, section, field });
      }
      setPicked(found);
    },
    [sections],
  );

  /**
   * The keys each section owns, so its window can offer those and nothing else.
   *
   * Every frame renders the WHOLE page, and each window shows its band plus 48
   * design pixels of slack — so a neighbouring band peeks in at both ends.
   * Without this a click on that peek would open another section's field in
   * this card's editor. Scoping by key rather than by pixels makes that
   * unrepresentable, and incidentally cuts each window's measuring from the
   * page's 176 tagged elements to its own ~20.
   */
  const scopes = useMemo(() => {
    const bySection = new Map<string, ReadonlySet<string>>();
    for (const section of sections) {
      bySection.set(
        section.id,
        new Set(section.fields.map((field) => `${section.id}.${field.id}`)),
      );
    }
    return bySection;
  }, [sections]);

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

  /** The framing to draw a field with: the local draft, else what is saved. */
  const frameDraft = useCallback(
    (sectionId: string, fieldId: string): SpotlightArea =>
      frameDrafts[`${sectionId}.${fieldId}`] ??
      savedFrames[`${sectionId}.${fieldId}`] ??
      CENTRE,
    [frameDrafts, savedFrames],
  );

  /** Framings that differ from what is stored — compared as their stored form,
   *  so a drag that lands back where it started is not an unsaved change. */
  const frameEdits = useMemo(
    () =>
      Object.entries(frameDrafts)
        .filter(
          ([key, area]) =>
            formatFrame(area) !== formatFrame(savedFrames[key] ?? CENTRE),
        )
        .map(([key, area]) => {
          const [section, ...rest] = key.split(".");
          return { section, field: rest.join("."), ...area };
        }),
    [frameDrafts, savedFrames],
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
    const framing = frameEdits;
    run(async () => {
      await saveHomeFieldsAction(payload, framing);
      setDrafts({});
      setFrameDrafts({});
    }, t("home.saved"));
  }

  /**
   * Every preview frame currently mounted — the page-wide one and up to nine
   * section windows.
   *
   * A ref rather than state: frames come and go as cards are reached and as
   * saves re-key them, and none of that should re-render ~180 fields. The
   * screen only ever iterates this to write into documents.
   */
  const frames = useRef(new Set<HTMLIFrameElement>());
  /** Read by callbacks that must stay stable; see `applyDrafts`. */
  const draftsRef = useRef(drafts);
  const frameDraftsRef = useRef(frameDrafts);
  const sectionsRef = useRef(sections);
  useEffect(() => {
    draftsRef.current = drafts;
    frameDraftsRef.current = frameDrafts;
    sectionsRef.current = sections;
  }, [drafts, frameDrafts, sections]);

  /**
   * Write every unsaved draft into a frame that has just finished loading.
   *
   * The rails are client components hydrating over server HTML, and a write
   * landing between `load` and hydration is a mismatch React 19 resolves by
   * re-rendering from its own props — silently reverting the edit. So each
   * frame is written to only once `whenPatchable` says so.
   *
   * Stable on purpose: it reads the drafts through a ref so that handing it to
   * nine section cards does not re-render them on every keystroke.
   */
  const applyDrafts = useCallback((frame: HTMLIFrameElement) => {
    const frameWindow = frame.contentWindow;
    if (!frameWindow) return;
    whenPatchable(frameWindow).then(() => {
      const doc = frame.contentDocument;
      if (!doc) return;
      for (const section of sectionsRef.current) {
        for (const field of section.fields) {
          const key = `${section.id}.${field.id}`;
          const draft = draftsRef.current[key];
          if (draft !== undefined) patchField(doc, field, key, draft);
          // After the photo, never before: framing acts on the element
          // `patchPhoto` has just rewritten to a plain fill of its box.
          const framing = frameDraftsRef.current[key];
          if (framing !== undefined) patchFrame(doc, key, framing);
        }
      }
    });
  }, []);

  /**
   * Take a frame into the set, and write the unsaved drafts into it — now, and
   * again every time it loads.
   *
   * The `load` listener is the load-bearing half, and leaving it out is a
   * silent bug rather than a loud one. A ref callback fires when the ELEMENT
   * attaches, which is before its document exists: at that moment
   * `contentWindow.document` is the initial `about:blank`, whose `readyState`
   * is ALREADY "complete", so `whenPatchable` resolves at once and the drafts
   * are written into a document that is about to be thrown away. The nine
   * section windows mount lazily, long after the drafts they need, so this is
   * the only path by which they ever get them.
   *
   * Returning the cleanup means the caller's ref closure remembers which frame
   * went, so this never has to identify it. Stable, so a card is not re-rendered
   * for holding one.
   */
  const holdFrame = useCallback(
    (frame: HTMLIFrameElement | null) => {
      if (!frame) return;
      const registry = frames.current;
      registry.add(frame);
      const onLoad = () => applyDrafts(frame);
      frame.addEventListener("load", onLoad);
      // In case it is already loaded — a re-registration, or a cached document.
      applyDrafts(frame);
      return () => {
        frame.removeEventListener("load", onLoad);
        registry.delete(frame);
      };
    },
    [applyDrafts],
  );

  /**
   * Record a draft AND show it in EVERY preview immediately.
   *
   * The write into the frames is the whole "live as you type" feature: each
   * preview is a server-rendered page in a same-origin iframe, so the parent
   * can set the text directly rather than re-rendering a route that reads
   * `site_content` in full on every keystroke.
   *
   * All of them, not just the one being pointed at: the same field is often on
   * screen twice — its own section's window and the page-wide preview above —
   * and one of them showing yesterday's wording is how a teammate concludes the
   * preview is broken. Kinds that cannot honestly be faked (a rail timing
   * resolved into a `setInterval`, a Figma-baked label) are refused by
   * `patchField`, and the card says "save to see this" instead.
   */
  const setDraft = useCallback(
    (key: string, next: string, field?: FieldView) => {
      setDrafts((current) => ({ ...current, [key]: next }));
      if (!field) return;
      for (const frame of frames.current) {
        const doc = frame.contentDocument;
        if (doc) patchField(doc, field, key, next);
      }
    },
    [],
  );

  /**
   * Record a photo's framing AND show it in every preview immediately.
   *
   * Framing is a draft like everything else, published by the same Save. It
   * has to be: a frame describes a photo, and until Save runs that photo is
   * itself only a draft — storing the crop of a picture that is not on the
   * page yet would be a promise about nothing.
   */
  const setFramed = useCallback((key: string, area: SpotlightArea) => {
    setFrameDrafts((current) => ({ ...current, [key]: area }));
    for (const frame of frames.current) {
      const doc = frame.contentDocument;
      if (doc) patchFrame(doc, key, area);
    }
  }, []);

  // The section windows register themselves through `holdFrame`. The page-wide
  // preview takes a plain ref object instead (it hands the same ref to nothing
  // else), so it is enrolled here — on the nonce, because a save re-keys it and
  // the frame that comes back is a different element with an empty document.
  useEffect(() => {
    const frame = previewFrame.current;
    if (!frame) return;
    return holdFrame(frame);
  }, [previewNonce, holdFrame]);

  /** Drop one field's local draft without touching what is saved. */
  function clearDraft(key: string) {
    setDrafts((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  /*
   * EVERY FIELD IS LISTED, INCLUDING THE ONES YOU CAN POINT AT.
   *
   * Between 2026-08-08 and the move to section windows, a field the picker
   * could reach was struck from the list — which cut ~180 rows to 25 and read
   * as a tidy win. It was not: the preview frames are `aria-hidden` and
   * `tabIndex={-1}` on purpose, so those 155 fields became reachable only by
   * pointing at them with a mouse, or by knowing a word to search for. Pointing
   * is a shortcut for people who can use it; the list is the screen's actual
   * inventory, and it is what a keyboard or a screen reader has.
   */

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
    const set = (next: string) => setDraft(key, next, field);

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

  // Framing counts as an unsaved change like any other, so the Save button
  // lights up and the warning banner counts it.
  const dirtyCount = edits.length + frameEdits.length;
  /**
   * Which sections are showing something OLDER than their fields say.
   *
   * Not simply "has an unsaved edit" any more: every draft is written straight
   * into every mounted frame, so an edited headline is on screen in its own
   * window before the keystroke finishes. What cannot be faked is a `number` —
   * the rail timings are resolved server-side into a `setInterval` and a
   * transition string React owns, so `patchField` refuses them and says so.
   * Warning about the rest would be the screen calling its own preview stale
   * while pointing at the new wording.
   */
  const staleSections = useMemo(() => {
    const kindOf = new Map<string, FieldView["kind"]>();
    for (const section of sections) {
      for (const field of section.fields) {
        kindOf.set(`${section.id}.${field.id}`, field.kind);
      }
    }
    return new Set(
      edits
        .filter(
          (edit) => kindOf.get(`${edit.section}.${edit.field}`) === "number",
        )
        .map((edit) => edit.section),
    );
  }, [edits, sections]);

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
                  onAction: () => {
                    setDrafts({});
                    setFrameDrafts({});
                    setPreviewNonce((n) => n + 1);
                  },
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

            {/* Find a field · point at one · jump to a section */}
            <Card>
              <BlockStack gap="300">
                {/* No toggle: pointing is always on. Said once here, because a
                    feature with no control is a feature nobody finds unless the
                    screen mentions it. */}
                <Text as="span" variant="bodySm" tone="subdued">
                  {t("home.picker.hint")}
                </Text>
                <Divider />
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

            {/* The page itself, at whatever phone width the owner picks — and
                READ-ONLY. Its own component so that dragging its slider
                re-renders one card rather than this screen's ~180 fields.
                Editing happens in the section windows below, each of which is
                already open on the band it belongs to. */}
            <MainPreview
              designWidth={DESIGN_WIDTH}
              min={PREVIEW_MIN_WIDTH}
              max={PREVIEW_MAX_WIDTH}
              nonce={previewNonce}
              onRefresh={() => setPreviewNonce((n) => n + 1)}
              onWidthSettled={setPreviewWidth}
              iframeRef={previewFrame}
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
          /* FULL WIDTH, not an annotated section (owner, 2026-08-08). The
             annotation gutter left the card 571px, and the window is 430 of
             them — 125px is not an editor. The window cannot give ground
             either: its width IS the phone's viewport, and narrowing it would
             make the one card whose job is to be exact start lying. So the
             title and blurb moved inside, and the card took the whole row. */
          <Layout.Section key={section.id}>
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
                  {/* Level 2, as Layout.AnnotatedSection rendered it — this is
                      the heading the section map and the e2e suite both name. */}
                  <BlockStack gap="100">
                    <Text as="h2" variant="headingMd">
                      {zh ? section.titleZh : section.title}
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {zh ? section.blurbZh : section.blurb}
                    </Text>
                  </BlockStack>

                  {/* The section's own preview opens the section, so what you
                      are editing is on screen before the first input — and the
                      editor for whatever you point at opens to the RIGHT of
                      that preview (owner, 2026-08-09).
                      `position: relative` so the editor can be anchored to it,
                      and note it is `relative` rather than anything that
                      establishes a containing block for FIXED descendants: the
                      picker's overlay is `position: fixed` and lives inside
                      this subtree, so a `transform`, `filter` or
                      `container-type` here would silently re-base every
                      highlight onto this card. */}
                  {section.preview ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 16,
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          flex: "0 0 auto",
                          width: PREVIEW_MAX_WIDTH + 32,
                          maxWidth: "100%",
                        }}
                      >
                        <SectionPreview
                          sectionId={section.id}
                          y={section.preview.y}
                          h={section.preview.h}
                          onPage={section.preview.onPage}
                          borrowed={section.preview.borrowed}
                          hidden={section.hideable && !section.visible}
                          stale={staleSections.has(section.id)}
                          width={previewWidth}
                          maxWidth={PREVIEW_MAX_WIDTH}
                          frameHeight={frameHeight}
                          nonce={previewNonce}
                          scope={scopes.get(section.id) ?? null}
                          selectedKey={
                            pickedSection === section.id ? selectedKey : null
                          }
                          panelRef={panelRef}
                          onPick={pickKeys}
                          onFrame={holdFrame}
                        />
                      </div>
                      {pickedSection === section.id ? (
                        /* PINNED TO THE PREVIEW'S RIGHT EDGE, at every width.
                           `left` is one rule doing two jobs: `488px` is the
                           preview's own width plus the gap, so on a roomy
                           screen the editor sits beside it exactly as a docked
                           column would; `100% - 324px` takes over once the card
                           is too narrow for that, sliding the editor left until
                           it is back inside the card and letting it overlap the
                           preview's right-hand side rather than fall below it.
                           Below about a 1060px viewport there is no third
                           option: a 430px phone and a 300px editor do not both
                           fit, and the owner would rather cover part of the
                           preview than hunt for the editor underneath it.
                           Out of flow, so it cannot push the fields down; the
                           height cap keeps it from spilling over them instead. */
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: "min(488px, calc(100% - 324px))",
                            width: 320,
                            maxWidth: "100%",
                            maxHeight: PREVIEW_ROW_HEIGHT,
                            overflowY: "auto",
                            zIndex: 6,
                          }}
                        >
                          <EditorPanel
                            picked={picked}
                            valueOf={valueOf}
                            errorOf={(field, value) => {
                              const reason = fieldError(field, value);
                              return reason
                                ? t(`home.bad.${reason}` as never)
                                : undefined;
                            }}
                            dirtyOf={(key) => drafts[key] !== undefined}
                            onChange={(key, next) => {
                              const entry = picked.find(
                                (one) => one.key === key,
                              );
                              setDraft(key, next, entry?.field);
                            }}
                            onOpenPhoto={(one) =>
                              setPhoto({
                                section: one.section,
                                field: one.field,
                              })
                            }
                            onReset={(one) => {
                              if (!one.field.edited) {
                                clearDraft(one.key);
                                return;
                              }
                              run(async () => {
                                await resetHomeFieldAction(
                                  one.section.id,
                                  one.field.id,
                                );
                                clearDraft(one.key);
                              }, t("home.saved"));
                            }}
                            onClose={() => setPicked([])}
                            pending={pending}
                            panelRef={panelRef}
                          />
                        </div>
                      ) : null}
                    </div>
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
          </Layout.Section>
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
          frame={frameDraft(photo.section.id, photo.field.id)}
          onChange={(path) => {
            const key = `${photo.section.id}.${photo.field.id}`;
            // Through setDraft, so the new photo appears in every preview at
            // once. It used to call setDrafts directly and skip the patch, so
            // a chosen photo did not show up until the next save — invisible
            // while framing was invisible too, and glaring now that it is not.
            setDraft(key, path, photo.field);
            // A frame describes ONE picture. Carrying it onto the next photo
            // would crop a different image by numbers chosen for the last one,
            // which is worse than starting from the centre. Ordered after the
            // photo: framing acts on the element `patchPhoto` just rewrote.
            setFramed(key, CENTRE);
          }}
          onFrameChange={(area) =>
            setFramed(`${photo.section.id}.${photo.field.id}`, area)
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

      {/* No overlay here any more: each section window draws its own, from a
          frame loop that lives in that card's leaf. See picker/PickerLayer. */}
      {toast ? (
        <Toast content={toast} onDismiss={() => setToast(null)} />
      ) : null}
    </Page>
  );
}
