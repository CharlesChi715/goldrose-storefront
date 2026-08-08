/**
 * ROLE OF THIS FILE
 * Read and write the homepage's owner-editable copy and section visibility.
 *
 * THE ONE INVARIANT
 * A `site_content` row exists for a homepage field **if and only if** the
 * owner's value differs from the design default in registry.ts. Saving the
 * default back deletes the row; resetting deletes the row. Everything else
 * follows from that: "has this been edited?" is simply "is there a row?", a
 * later Figma sync that changes a default reaches the storefront immediately
 * for every untouched field, and the §11 rule (default → serve the original
 * render, edited → live text) needs no extra bookkeeping.
 *
 * Reads never throw: the homepage must still render its design defaults when
 * the database is unreachable or not configured at all (local mode).
 */

import { getStore } from "@/lib/supabase/store.ts";
import type { SiteContentRow } from "@/lib/supabase/types.ts";
import {
  CENTRE,
  FRAME_DEFAULT,
  formatFrame,
  frameKey,
  parseFrame,
  type SpotlightArea,
} from "./frames.ts";
import { homeLayout, type HomeLayout } from "./layout.ts";
import {
  HOME_SECTIONS,
  fieldError,
  findSection,
  isEditable,
  slotKey,
  visibilityKey,
  type HomeSectionId,
  type HomeText,
} from "./registry.ts";

export * from "./registry.ts";
export * from "./frames.ts";
export { homeLayout, HOME_FRAME_HEIGHT, type HomeLayout } from "./layout.ts";

/** The value stored in a visibility slot when a section is switched off. */
const HIDDEN = "hidden";

/** Everything the homepage and the admin screen need in one read. */
export type HomeContent = {
  /** Resolved copy for every section: overrides applied over design defaults. */
  readonly text: HomeText;
  /** Show/hide state per section; chrome sections are always true. */
  readonly visible: Readonly<Record<HomeSectionId, boolean>>;
  /** Band shifts and stage height once hidden sections are removed. */
  readonly layout: HomeLayout;
  /** Slot keys the owner has edited — drives "Reset" and the §11 render rule. */
  readonly overridden: ReadonlySet<string>;
  /**
   * How each image field's photo is framed, keyed `"<section>.<field>"`.
   *
   * Total rather than sparse: every image field has an entry, defaulting to the
   * centre crop, so a caller can never draw a photo by forgetting to look one
   * up. Only non-centre framings are actually stored.
   */
  readonly frames: ReadonlyMap<string, SpotlightArea>;
};

/**
 * Read the `text` of a site_content value, tolerating any shape.
 *
 * @param value - The row's jsonb value.
 * @returns The stored string, or null when the row holds no usable text.
 */
function textOf(value: unknown): string | null {
  const text = (value as { text?: unknown } | null)?.text;
  return typeof text === "string" ? text : null;
}

/**
 * Resolve the registry against a map of stored overrides.
 *
 * @param stored - Slot key → stored text, for every row currently in the table.
 * @returns Resolved copy, visibility, layout, and the set of edited keys.
 */
function resolve(stored: Map<string, string>): HomeContent {
  const text: Record<string, Record<string, string>> = {};
  const visible: Record<string, boolean> = {};
  const overridden = new Set<string>();
  const frames = new Map<string, SpotlightArea>();

  for (const section of HOME_SECTIONS) {
    const fields: Record<string, string> = {};
    for (const field of section.fields) {
      const key = slotKey(section.id, field);
      const override = isEditable(field) ? stored.get(key) : undefined;
      if (override !== undefined && override !== field.value) {
        overridden.add(key);
        fields[field.id] = override;
      } else {
        fields[field.id] = field.value;
      }
      if (field.kind === "image") {
        frames.set(
          `${section.id}.${field.id}`,
          parseFrame(stored.get(frameKey(key))),
        );
      }
    }
    text[section.id] = fields;
    visible[section.id] = section.band
      ? stored.get(visibilityKey(section.id)) !== HIDDEN
      : true;
  }

  return {
    text: text as unknown as HomeText,
    visible: visible as Record<HomeSectionId, boolean>,
    layout: homeLayout(visible as Record<HomeSectionId, boolean>),
    overridden,
    frames,
  };
}

/**
 * How one image field's photo is framed.
 *
 * @param content - The resolved homepage content.
 * @param sectionId - The section that owns the field.
 * @param fieldId - The image field's id.
 * @returns Its framing; the centre crop when the field is unknown or unframed.
 */
export function frameOf(
  content: HomeContent,
  sectionId: string,
  fieldId: string,
): SpotlightArea {
  return content.frames.get(`${sectionId}.${fieldId}`) ?? CENTRE;
}

/**
 * Load the homepage's copy, visibility and layout. Never throws — a missing or
 * unreachable store resolves to the design defaults, which is exactly what the
 * pixel-exact import renders.
 *
 * @returns The resolved homepage content.
 */
export async function getHomeContent(): Promise<HomeContent> {
  try {
    const rows = await getStore().all("site_content");
    const stored = new Map<string, string>();
    for (const row of rows) {
      const value = textOf(row.value);
      if (value !== null) stored.set(row.key, value);
    }
    return resolve(stored);
  } catch {
    return resolve(new Map());
  }
}

/**
 * Write one slot, or delete it when the value is back to the design default —
 * the invariant described in this file's header.
 *
 * @param key - The slot key to write.
 * @param value - The owner's text.
 * @param defaultValue - The design default this field falls back to.
 * @param label - Human label stored on the row, for the generic slot screens.
 */
async function writeSlot(
  key: string,
  value: string,
  defaultValue: string,
  label: string,
): Promise<void> {
  const store = getStore();
  const existing = await store.where("site_content", { key });

  if (value === defaultValue) {
    if (existing.length > 0) await store.remove("site_content", { key });
    return;
  }

  const now = new Date().toISOString();
  if (existing.length > 0) {
    await store.update(
      "site_content",
      { key },
      { value: { text: value }, updated_at: now },
    );
    return;
  }
  await store.insert("site_content", [
    {
      key,
      value: { text: value },
      default_value: { text: defaultValue },
      label,
      help: "",
      updated_at: now,
    } satisfies SiteContentRow,
  ]);
}

/**
 * Save one homepage field. Saving the design default deletes the override.
 *
 * @param sectionId - The section the field belongs to.
 * @param fieldId - The field id within that section.
 * @param value - The owner's new text.
 * @throws When the section or field is not in the registry, is not editable, or
 *   the value fails its kind's rule (unsafe href, off-site image, non-hex
 *   colour, out-of-range number).
 */
export async function saveHomeField(
  sectionId: string,
  fieldId: string,
  value: string,
): Promise<void> {
  const section = findSection(sectionId);
  const field = section?.fields.find((entry) => entry.id === fieldId);
  if (!section || !field || !isEditable(field)) {
    throw new Error(`Unknown editable home field: ${sectionId}.${fieldId}`);
  }
  // The admin blocks these inline too; this is the check that actually holds,
  // because a server action is reachable without the screen.
  const invalid = fieldError(field, value);
  if (invalid !== null) {
    throw new Error(`Invalid ${invalid} for ${sectionId}.${fieldId}: ${value}`);
  }
  await writeSlot(
    slotKey(section.id, field),
    value,
    field.value,
    `${section.title} — ${field.label}`,
  );
}

/**
 * Save how one image field's photo is framed. The centre crop is the design
 * default, so choosing it deletes the row like any other value.
 *
 * @param sectionId - The section the field belongs to.
 * @param fieldId - The image field's id.
 * @param area - The framing the owner chose.
 * @throws When the field is not an image field in the registry.
 */
export async function saveHomeImageFrame(
  sectionId: string,
  fieldId: string,
  area: SpotlightArea,
): Promise<void> {
  const section = findSection(sectionId);
  const field = section?.fields.find((entry) => entry.id === fieldId);
  if (!section || !field || field.kind !== "image") {
    throw new Error(`Not a home image field: ${sectionId}.${fieldId}`);
  }
  await writeSlot(
    frameKey(slotKey(section.id, field)),
    formatFrame(area),
    FRAME_DEFAULT,
    `${section.title} — ${field.label} framing`,
  );
}

/**
 * Reset one homepage field to the design default by deleting its override.
 *
 * An image field's framing goes with it: the frame describes a photo, so
 * keeping it after the photo has gone back to the design's would apply
 * somebody's crop to a picture they never chose.
 *
 * @param sectionId - The section the field belongs to.
 * @param fieldId - The field id within that section.
 */
export async function resetHomeField(
  sectionId: string,
  fieldId: string,
): Promise<void> {
  const section = findSection(sectionId);
  const field = section?.fields.find((entry) => entry.id === fieldId);
  if (!section || !field) return;
  const key = slotKey(section.id, field);
  const store = getStore();
  await store.remove("site_content", { key });
  if (field.kind === "image") {
    await store.remove("site_content", { key: frameKey(key) });
  }
}

/**
 * Show or hide a section. Hiding slides every later band up by its height
 * (see layout.ts); the design default — shown — deletes the slot.
 *
 * @param sectionId - The section to toggle.
 * @param visible - True to show the section, false to hide it.
 * @throws When the section is not in the registry or is page chrome.
 */
export async function setHomeSectionVisible(
  sectionId: string,
  visible: boolean,
): Promise<void> {
  const section = findSection(sectionId);
  if (!section?.band) {
    throw new Error(`Section cannot be hidden: ${sectionId}`);
  }
  await writeSlot(
    visibilityKey(section.id),
    visible ? "" : HIDDEN,
    "",
    `${section.title} — visibility`,
  );
}

/**
 * Reset a whole section: drop every field override and show it again.
 *
 * @param sectionId - The section to restore to the design.
 */
export async function resetHomeSection(sectionId: string): Promise<void> {
  const section = findSection(sectionId);
  if (!section) return;
  const store = getStore();
  for (const field of section.fields) {
    if (!isEditable(field)) continue;
    const key = slotKey(section.id, field);
    await store.remove("site_content", { key });
    // Framing belongs to the photo it frames, so it is dropped with it.
    if (field.kind === "image") {
      await store.remove("site_content", { key: frameKey(key) });
    }
  }
  if (section.band) {
    await store.remove("site_content", { key: visibilityKey(section.id) });
  }
}

/**
 * Reset the entire homepage to the design: every override in every section.
 */
export async function resetHomePage(): Promise<void> {
  for (const section of HOME_SECTIONS) {
    await resetHomeSection(section.id);
  }
}
