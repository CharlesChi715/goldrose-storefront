/**
 * ROLE OF THIS FILE
 * /account/returns/add-photos — Figma "/account/returns/add-photos · edit"
 * (2030:186, AFTER-SALES batch, imported 2026-08-02). ?reason= carries the
 * slug picked in the SELECT-RETURN-REASON sheet so the Reason row can echo
 * it (default: Item arrived damaged). Visual placeholder: mock upload and
 * description; no returns backend.
 */

import type { Metadata } from "next";
import { AddPhotosScreen } from "@/components/screens/returns/AddPhotosScreen";

export const metadata: Metadata = {
  title: "Add photos & details — GoldRose",
  robots: { index: false },
};

export default async function AddPhotosPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const reason = (await searchParams).reason;
  return <AddPhotosScreen reasonSlug={reason} />;
}
