"use server";

/**
 * ROLE OF THIS FILE
 * Server actions for Content → Home page (§9.8): save the owner's edits to the
 * homepage's section copy, reset a field / a section / the whole page to the
 * design, and switch a section on or off. Every action re-checks admin auth and
 * revalidates the storefront, so a save is visible on `/` without a redeploy.
 *
 * Validation is deliberately thin here: the registry is the schema. `saveHomeField`
 * rejects anything that is not a known editable field, and link fields go through
 * `isSafeHref` before they can reach an anchor.
 */

import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { revalidateStorefront } from "@/lib/admin/products";
import {
  resetHomeField,
  resetHomePage,
  resetHomeSection,
  saveHomeField,
  setHomeSectionVisible,
} from "@/lib/home-content";

const Id = z.string().min(1).max(64);
const Edit = z.object({
  section: Id,
  field: Id,
  value: z.string().max(2000),
});

/**
 * Save a batch of edited fields — the screen's single "Save changes" action.
 *
 * @param edits - One entry per changed field.
 */
export async function saveHomeFieldsAction(
  edits: { section: string; field: string; value: string }[],
): Promise<void> {
  await requireAdmin();
  for (const edit of z.array(Edit).max(200).parse(edits)) {
    await saveHomeField(edit.section, edit.field, edit.value);
  }
  revalidateStorefront();
}

/**
 * Reset one field to the design default.
 *
 * @param section - The section id.
 * @param field - The field id within that section.
 */
export async function resetHomeFieldAction(
  section: string,
  field: string,
): Promise<void> {
  await requireAdmin();
  await resetHomeField(Id.parse(section), Id.parse(field));
  revalidateStorefront();
}

/**
 * Reset a whole section: every field override, and its visibility.
 *
 * @param section - The section id to restore to the design.
 */
export async function resetHomeSectionAction(section: string): Promise<void> {
  await requireAdmin();
  await resetHomeSection(Id.parse(section));
  revalidateStorefront();
}

/** Reset every homepage section to the design. */
export async function resetHomePageAction(): Promise<void> {
  await requireAdmin();
  await resetHomePage();
  revalidateStorefront();
}

/**
 * Show or hide a section. Hiding closes the gap: every band below slides up.
 *
 * @param section - The section id to toggle.
 * @param visible - True to show, false to hide.
 */
export async function setHomeSectionVisibleAction(
  section: string,
  visible: boolean,
): Promise<void> {
  await requireAdmin();
  await setHomeSectionVisible(Id.parse(section), z.boolean().parse(visible));
  revalidateStorefront();
}
