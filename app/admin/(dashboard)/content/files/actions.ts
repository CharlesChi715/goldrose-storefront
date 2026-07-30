"use server";

/**
 * ROLE OF THIS FILE
 * Server actions for Content → Files (§9.8): upload into and delete from
 * the storage bucket (or its local stand-in). Uploads for product media go
 * through products/actions.ts; this powers the standalone file browser.
 */

import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { deleteFile, fileUrl, uploadFile } from "@/lib/admin/files";

export async function uploadFilesAction(formData: FormData): Promise<{
  ok: boolean;
  error?: string;
}> {
  await requireAdmin();
  const files = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (files.length === 0) {
    return { ok: false, error: "No files" };
  }
  try {
    await Promise.all(files.map((file) => uploadFile(file)));
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

export async function deleteFileAction(path: string): Promise<void> {
  await requireAdmin();
  await deleteFile(z.string().min(1).max(500).parse(path));
}

export async function resolveFileUrlAction(path: string): Promise<string> {
  await requireAdmin();
  return fileUrl(z.string().min(1).max(500).parse(path));
}
