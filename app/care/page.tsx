/**
 * ROLE OF THIS FILE
 * /care — the Customer Care page (Figma CARE-* frames 1097:116…119,
 * imported 2026-07-27). One route, four Help-Center tab states; ?tab=
 * deep-links a tab so other surfaces can land in context (the order
 * confirmation's CONTACT SUPPORT card uses ?tab=order-issues).
 */

import type { Metadata } from "next";
import { CareScreen, type CareTab } from "@/components/screens/CareScreen";

export const metadata: Metadata = {
  title: "Customer care — ELDREVE",
  description:
    "ELDREVE customer care: order help, promotions, returns and after-sales.",
};

const TAB_KEYS: CareTab[] = [
  "hot-topics",
  "order-issues",
  "promotions",
  "after-sales",
];

export default async function CarePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const requested = (await searchParams).tab;
  const tab = TAB_KEYS.includes(requested as CareTab)
    ? (requested as CareTab)
    : "hot-topics";
  return <CareScreen initialTab={tab} />;
}
