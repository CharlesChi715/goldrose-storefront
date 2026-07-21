/**
 * ROLE OF THIS FILE
 * /admin/content/files — Shopify's Content → Files, adapted (§9.8): browse
 * the storage bucket (or its local .data/uploads stand-in), preview, copy
 * URL, delete.
 */

import { fileUrl, listFiles } from "@/lib/admin/files";
import { FilesBrowser, type FileItem } from "./FilesBrowser";

export default async function FilesPage() {
  const files = await listFiles();
  const items: FileItem[] = files.map((file) => ({
    path: file.path,
    url: fileUrl(file.path),
    name: file.name,
    size: file.size,
    uploadedAt: file.uploadedAt,
  }));
  return <FilesBrowser items={items} />;
}
