/**
 * ROLE OF THIS FILE
 * Resolve a stored image path (product_images.path) to a browser-usable
 * URL, usable from client AND server code: "/..." paths (public assets or
 * the local /api/files route) pass through; bare keys become public
 * Supabase Storage URLs.
 */

const BUCKET = "product-images";

/**
 * Resolve a stored image path to a browser-usable URL. Paths starting with
 * "/" or "http" pass through unchanged; a bare key becomes a public
 * Supabase Storage URL in the product-images bucket, e.g.
 * "abc.jpg" → "<SUPABASE_URL>/storage/v1/object/public/product-images/abc.jpg".
 *
 * @param storedPath - The path as stored in product_images.path.
 * @returns A URL the browser can load directly.
 */
export function fileUrl(storedPath: string): string {
  if (storedPath.startsWith("/") || storedPath.startsWith("http")) {
    return storedPath;
  }
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  return `${base}/storage/v1/object/public/${BUCKET}/${storedPath}`;
}
