/**
 * ROLE OF THIS FILE
 * The one implementation of the product-handle rule
 * (docs/ixd/naming/product-handles.md): deriving the public
 * `/products/<handle>` URL segment from a product title. Pure and
 * dependency-free so both the server-only admin writes and the unit test
 * that replays the doc's fixture table can import it.
 */

/** Validation bounds from the doc (§3): format and a 120-char sanity cap. */
export const HANDLE_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const HANDLE_MAX_LENGTH = 120;

/**
 * Derives the public product handle from a product title, exactly as
 * docs/ixd/naming/product-handles.md §2 specifies: NFKD-normalise and strip
 * combining marks, lowercase, delete apostrophes, collapse every other
 * non-alphanumeric run to one hyphen, trim hyphens. The whole title is kept —
 * no stop-word stripping, no truncation, no collision suffixes.
 *
 * @param title - products.title; the only input.
 * @returns The handle, matching ^[a-z0-9]+(-[a-z0-9]+)*$ and ≤ 120 chars.
 * @throws {Error} When no valid handle can be derived — set one manually.
 */
export function productHandle(title: string): string {
  const handle = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (handle.length > HANDLE_MAX_LENGTH || !HANDLE_PATTERN.test(handle)) {
    throw new Error(
      `Cannot derive a URL handle from "${title}" — set one manually.`,
    );
  }
  return handle;
}
