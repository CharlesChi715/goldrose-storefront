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
import { homePreviewBand } from "@/lib/home-content/preview";
import {
  HomeSectionsEditor,
  type LibraryItem,
  type SectionView,
} from "./HomeSectionsEditor";

/**
 * What a section's own preview frame should show, or null when the section has
 * nothing to show. `borrowed` is true when the frame stands in with a different
 * band — see lib/home-content/preview.ts.
 *
 * @param sectionId - The section being listed.
 * @returns The frame's band height and whether it is a stand-in.
 */
function previewOf(sectionId: string): SectionView["preview"] {
  const band = homePreviewBand(sectionId);
  if (!band) return null;
  return { height: band.h, borrowed: band.from !== sectionId };
}

export default async function HomeContentPage() {
  const { text, visible, overridden } = await getHomeContent();
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
    // Resolved server-side, like `max`: the band geometry is registry data,
    // and the client only needs the one number that sizes the frame.
    preview: previewOf(section.id),
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

  return <HomeSectionsEditor sections={sections} library={library} />;
}
