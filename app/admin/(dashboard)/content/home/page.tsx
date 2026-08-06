/**
 * ROLE OF THIS FILE
 * /admin/content/home — Content → Home page (§9.8). Reads the registry and the
 * owner's saved overrides once, flattens them into a serialisable view model,
 * and hands it to the client editor.
 *
 * Both language variants of every label travel to the client on purpose: the
 * admin's EN/中文 toggle is client-side state (PolarisShell), so the screen has
 * to be able to re-label itself without a server round trip.
 */

import {
  HOME_SECTION_LIST,
  fieldBudget,
  getHomeContent,
  slotKey,
  type HomeSectionId,
} from "@/lib/home-content";
import { HomeSectionsEditor, type SectionView } from "./HomeSectionsEditor";

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
    })),
  }));

  return <HomeSectionsEditor sections={sections} />;
}
