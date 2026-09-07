/**
 * ROLE OF THIS FILE
 * The 404. Reached by any unmatched URL and by `notFound()` — a product handle
 * that no longer exists, an old link from a search engine.
 *
 * Before this existed, a mistyped URL on a shop that sells gifts showed the
 * Next.js default page: an unstyled "404 | This page could not be found" with
 * no way back to the shop and nothing saying whose site it is.
 */

import type { Metadata } from "next";
import { ErrorScreen } from "@/components/ErrorScreen";

export const metadata: Metadata = {
  title: "Page not found",
  // A 404 must never be indexed as a page in its own right.
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <ErrorScreen
      title="We could not find that page"
      message="The link may be old, or the piece may no longer be part of the collection. Everything we currently make is in the shop."
    />
  );
}
