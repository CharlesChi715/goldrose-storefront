/**
 * ROLE OF THIS FILE
 * Product media / file storage behind one interface (§9.5 Media, §9.8
 * Files). Hosted mode uses the public Supabase Storage bucket
 * "product-images"; local mode (§0.2 fallback) writes to .data/uploads and
 * serves through /api/files/<key>.
 *
 * product_images.path stores a SERVABLE path: "/..." (public asset or the
 * local /api/files route) or a bare Storage object key, resolved by
 * fileUrl(). Server-only (fs + service key).
 */

import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env.ts";

const BUCKET = "product-images";
const UPLOADS_DIR = path.join(process.cwd(), ".data", "uploads");
const LOCAL_PREFIX = "/api/files/";

export type StoredFile = {
  /** Value to store in product_images.path (servable, see fileUrl). */
  path: string;
  name: string;
  size: number;
  uploadedAt: string;
};

const EXTENSION_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
};

/**
 * MIME type for an image filename by extension, e.g. "rose.png" →
 * "image/png"; unknown extensions get "application/octet-stream".
 *
 * @param fileName - File name or path to inspect.
 */
export function contentTypeFor(fileName: string): string {
  return EXTENSION_TYPES[path.extname(fileName).toLowerCase()] ?? "application/octet-stream";
}

/**
 * True when the filename's extension is an allowed image type
 * (.jpg/.jpeg/.png/.gif/.webp/.avif/.svg).
 *
 * @param fileName - File name to check.
 */
export function isAllowedImageName(fileName: string): boolean {
  return path.extname(fileName).toLowerCase() in EXTENSION_TYPES;
}

/** Forum attachments (owner request 2026-07-22): images + common documents. */
const ATTACHMENT_TYPES: Record<string, string> = {
  ...EXTENSION_TYPES,
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".csv": "text/csv",
  ".zip": "application/zip",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
};

/**
 * MIME type for a forum attachment, or null when the extension isn't in
 * the attachment whitelist (images + common documents + mp4/mov).
 *
 * @param fileName - File name to inspect.
 */
export function attachmentTypeFor(fileName: string): string | null {
  return ATTACHMENT_TYPES[path.extname(fileName).toLowerCase()] ?? null;
}

/**
 * Store a forum attachment. Same backends as product media, but a broader
 * type whitelist and a "forum/"-prefixed key so the bucket stays tidy.
 * Throws on an unsupported type or a failed Storage upload.
 *
 * @param file - The uploaded browser File.
 * @returns Servable path plus original name, byte size, and upload time.
 */
export async function uploadAttachment(file: File): Promise<StoredFile> {
  const contentType = attachmentTypeFor(file.name);
  if (!contentType) {
    throw new Error(`Unsupported file type: ${file.name}`);
  }
  const key = `forum/${safeKey(file.name)}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  if (getSupabaseEnv().hosted) {
    const { error } = await storageClient()
      .storage.from(BUCKET)
      .upload(key, bytes, { contentType });
    if (error) {
      throw new Error(`storage upload: ${error.message}`);
    }
    return { path: key, name: file.name, size: bytes.length, uploadedAt: new Date().toISOString() };
  }

  // Local: flatten the prefix into the filename (uploads dir is flat).
  const localKey = key.replace("/", "-");
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOADS_DIR, localKey), bytes);
  return {
    path: `${LOCAL_PREFIX}${localKey}`,
    name: file.name,
    size: bytes.length,
    uploadedAt: new Date().toISOString(),
  };
}

export { fileUrl } from "@/lib/files-url";

/** Service-role Supabase client for Storage calls — no session persistence. */
function storageClient() {
  const env = getSupabaseEnv();
  return createClient(env.url, env.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Collision-proof storage key: random 8-char prefix + sanitized basename,
 * e.g. "logo v2.png" → "3fa9c2d1-logo-v2.png".
 */
function safeKey(fileName: string): string {
  const base = path
    .basename(fileName)
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(-80);
  return `${randomUUID().slice(0, 8)}-${base}`;
}

/**
 * Stores a product image: the Supabase Storage bucket when hosted,
 * .data/uploads locally. Throws on a non-image extension or a failed
 * upload.
 *
 * @param file - The uploaded browser File.
 * @returns Servable path (bucket key, or /api/files/… locally) plus name, size, and upload time.
 */
export async function uploadFile(file: File): Promise<StoredFile> {
  if (!isAllowedImageName(file.name)) {
    throw new Error(`Unsupported file type: ${file.name}`);
  }
  const key = safeKey(file.name);
  const bytes = Buffer.from(await file.arrayBuffer());

  if (getSupabaseEnv().hosted) {
    const { error } = await storageClient()
      .storage.from(BUCKET)
      .upload(key, bytes, { contentType: contentTypeFor(file.name) });
    if (error) {
      throw new Error(`storage upload: ${error.message}`);
    }
    return { path: key, name: file.name, size: bytes.length, uploadedAt: new Date().toISOString() };
  }

  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOADS_DIR, key), bytes);
  return {
    path: `${LOCAL_PREFIX}${key}`,
    name: file.name,
    size: bytes.length,
    uploadedAt: new Date().toISOString(),
  };
}

/**
 * All stored files, newest first: the bucket listing (up to 1000) when
 * hosted, the .data/uploads contents locally (empty when the dir is missing).
 */
export async function listFiles(): Promise<StoredFile[]> {
  if (getSupabaseEnv().hosted) {
    const { data, error } = await storageClient()
      .storage.from(BUCKET)
      .list("", { limit: 1000, sortBy: { column: "created_at", order: "desc" } });
    if (error) {
      throw new Error(`storage list: ${error.message}`);
    }
    return (data ?? [])
      .filter((entry) => entry.name)
      .map((entry) => ({
        path: entry.name,
        name: entry.name,
        size: (entry.metadata as { size?: number } | null)?.size ?? 0,
        uploadedAt: entry.created_at ?? "",
      }));
  }

  try {
    const names = await fs.readdir(UPLOADS_DIR);
    const files = await Promise.all(
      names.map(async (name) => {
        const stat = await fs.stat(path.join(UPLOADS_DIR, name));
        return {
          path: `${LOCAL_PREFIX}${name}`,
          name,
          size: stat.size,
          uploadedAt: stat.mtime.toISOString(),
        };
      }),
    );
    return files.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  } catch {
    return [];
  }
}

/**
 * Deletes a stored file, dispatching on the stored path: local /api/files
 * uploads come off disk, repo public assets ("/…") are left alone, and
 * anything else is removed from the Storage bucket (throws on error).
 *
 * @param storedPath - The product_images.path-style value to delete.
 */
export async function deleteFile(storedPath: string): Promise<void> {
  if (storedPath.startsWith(LOCAL_PREFIX)) {
    const key = path.basename(storedPath.slice(LOCAL_PREFIX.length));
    await fs.rm(path.join(UPLOADS_DIR, key), { force: true });
    return;
  }
  if (storedPath.startsWith("/")) {
    return; // repo public asset — never deleted from the admin
  }
  const { error } = await storageClient().storage.from(BUCKET).remove([storedPath]);
  if (error) {
    throw new Error(`storage delete: ${error.message}`);
  }
}
