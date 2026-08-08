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
import { isAllowedImageName, uploadFile } from "@/lib/admin/files";
import { revalidateStorefront } from "@/lib/admin/products";
import {
  resetHomeField,
  resetHomePage,
  resetHomeSection,
  saveHomeField,
  saveHomeImageFrame,
  setHomeSectionVisible,
} from "@/lib/home-content";
import { MAX_ZOOM, NO_ZOOM } from "@/lib/images/spotlight";

const Id = z.string().min(1).max(64);
const Edit = z.object({
  section: Id,
  field: Id,
  value: z.string().max(2000),
});

/**
 * One photo's framing. Bounded here as well as at the store, because a server
 * action is reachable without the screen and a stray zoom would ship a page
 * scaled 40 times.
 */
const Frame = z.object({
  section: Id,
  field: Id,
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  zoom: z.number().min(NO_ZOOM).max(MAX_ZOOM),
});

/**
 * Save a batch of edited fields — the screen's single "Save changes" action.
 *
 * Framing rides along with the fields rather than saving on its own: a frame
 * describes a photo, and the photo it describes is itself an unsaved draft
 * until this runs. Saving one without the other would crop a picture that is
 * not on the page yet.
 *
 * @param edits - One entry per changed field.
 * @param frames - One entry per re-framed photo.
 */
export async function saveHomeFieldsAction(
  edits: { section: string; field: string; value: string }[],
  frames: {
    section: string;
    field: string;
    x: number;
    y: number;
    zoom: number;
  }[] = [],
): Promise<void> {
  await requireAdmin();
  for (const edit of z.array(Edit).max(200).parse(edits)) {
    await saveHomeField(edit.section, edit.field, edit.value);
  }
  for (const frame of z.array(Frame).max(50).parse(frames)) {
    await saveHomeImageFrame(frame.section, frame.field, {
      x: frame.x,
      y: frame.y,
      zoom: frame.zoom,
    });
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

/**
 * Upload one photo from the "Change photo" dialog into the same store Content →
 * Files uses, and hand back the path to put in the field.
 *
 * It returns an error rather than throwing so the dialog can show the reason
 * beside the button; an upload that fails silently would look like a photo that
 * simply did not appear.
 *
 * @param formData - A form carrying a single `file` entry.
 * @returns The stored path on success, or a message to show the owner.
 */
export async function uploadHomePhotoAction(
  formData: FormData,
): Promise<{ ok: boolean; path?: string; error?: string }> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No file" };
  }
  if (!isAllowedImageName(file.name)) {
    return { ok: false, error: "Unsupported image type" };
  }
  try {
    const stored = await uploadFile(file);
    return { ok: true, path: stored.path };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}
