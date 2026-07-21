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

export function contentTypeFor(fileName: string): string {
  return EXTENSION_TYPES[path.extname(fileName).toLowerCase()] ?? "application/octet-stream";
}

export function isAllowedImageName(fileName: string): boolean {
  return path.extname(fileName).toLowerCase() in EXTENSION_TYPES;
}

/** Resolve a product_images.path to a browser-usable URL. */
export function fileUrl(storedPath: string): string {
  if (storedPath.startsWith("/")) {
    return storedPath; // public asset or local /api/files route
  }
  const env = getSupabaseEnv();
  return `${env.url}/storage/v1/object/public/${BUCKET}/${storedPath}`;
}

function storageClient() {
  const env = getSupabaseEnv();
  return createClient(env.url, env.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function safeKey(fileName: string): string {
  const base = path
    .basename(fileName)
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(-80);
  return `${randomUUID().slice(0, 8)}-${base}`;
}

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
