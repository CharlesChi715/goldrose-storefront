/**
 * ROLE OF THIS FILE
 * /admin/content/home — Content → Home page (§9.8). Reads the registry and the
 * owner's saved overrides once, flattens them into a serialisable view model,
 * and hands it to the client editor.
 *
 * Both language variants of every label travel to the client on purpose: the
 * admin's EN/中文 toggle is client-side state (PolarisShell), so the screen has
 * to be able to re-label itself without a server round trip.
 *
 * The uploaded-file list travels with it for the same reason: the photo picker
 * has to show the library the moment it opens, and a teammate choosing a photo
 * should not wait on a round trip to find out what they already have. It is the
 * same list Content → Files shows.
 */

import { fileUrl, listFiles } from "@/lib/admin/files";
import {
  HOME_SECTION_LIST,
  fieldBudget,
  getHomeContent,
  slotKey,
  type HomeSectionId,
} from "@/lib/home-content";
import { homePreviewTarget } from "@/lib/home-content/preview";
import {
  HomeSectionsEditor,
  type LibraryItem,
  type SectionView,
} from "./HomeSectionsEditor";

/**
 * Which rectangle of the live page a section's preview window is held over, or
 * null when the section has nothing to show at all.
 *
 * `borrowed` is true when the window is held over a DIFFERENT section's band,
 * and `onPage` is false when that band is not on the live page — both decided
 * in lib/home-content/preview.ts, on the band actually shown rather than on the
 * id asked for.
 *
 * @param sectionId - The section being listed.
 * @param visible - Show/hide state per section.
 * @param shift - Per-band offsets from `homeLayout()`.
 * @returns The live rectangle for the window, and how to label it.
 */
function previewOf(
  sectionId: string,
  visible: Partial<Record<HomeSectionId, boolean>>,
  shift: Readonly<Record<HomeSectionId, number>>,
): SectionView["preview"] {
  const target = homePreviewTarget(sectionId, visible, shift);
  if (!target) return null;
  return {
    y: target.y,
    h: target.h,
    onPage: target.onPage,
    borrowed: target.from !== sectionId,
  };
}

export default async function HomeContentPage() {
  const { text, visible, layout, overridden } = await getHomeContent();
  const resolved = text as unknown as Record<string, Record<string, string>>;

  const sections: SectionView[] = HOME_SECTION_LIST.map((section) => ({
    id: section.id,
    module: section.module,
    title: section.title,
    titleZh: section.titleZh,
    blurb: section.blurb,
    blurbZh: section.blurbZh,
    hideable: section.band !== null,
    visible: visible[section.id as HomeSectionId],
    // Where this band actually lands on the live stage — its imported `y` plus
    // the shift that hiding or trimming an earlier band applied. Resolved here
    // rather than in the browser so the section map cannot disagree with the
    // page it is a picture of. A hidden band has no place on the stage at all.
    band:
      section.band && visible[section.id as HomeSectionId]
        ? {
            top: section.band.y + layout.shift[section.id as HomeSectionId],
            height: section.band.h,
          }
        : null,
    // Resolved server-side for the same reason, and like `max`: the band
    // geometry is registry data, and the window the client opens must be over
    // the same rectangle the live page draws.
    preview: previewOf(section.id, visible, layout.shift),
    fields: section.fields.map((field) => ({
      id: field.id,
      label: field.label,
      labelZh: field.labelZh,
      kind: field.kind,
      value: resolved[section.id][field.id],
      defaultValue: field.value,
      edited: overridden.has(slotKey(section.id, field)),
      group: field.group ?? null,
      groupZh: field.groupZh ?? null,
      // Resolved server-side so the formula lives in exactly one place.
      max: fieldBudget(field),
      lines: field.lines ?? null,
      note: field.note ?? null,
      noteZh: field.noteZh ?? null,
      managedAt: field.managedAt ?? null,
      box: field.box ?? null,
      fit: field.fit ?? null,
      numMin: field.numMin ?? null,
      numMax: field.numMax ?? null,
      unit: field.unit ?? null,
    })),
  }));

  // Never fatal: with no storage configured the picker still offers upload and
  // the design's own photos, which is better than a screen that will not load.
  let library: LibraryItem[] = [];
  try {
    library = (await listFiles()).map((file) => ({
      path: file.path,
      url: fileUrl(file.path),
      name: file.name,
    }));
  } catch {
    library = [];
  }

  return (
    <HomeSectionsEditor
      sections={sections}
      library={library}
      frameHeight={layout.frameHeight}
    />
  );
}
