/**
 * ROLE OF THIS FILE
 * /account/returns — Figma "/account/returns · default" (2030:189) and
 * "· status" (2030:188), AFTER-SALES batch, imported 2026-08-02. One route,
 * two tab states; ?tab=status deep-links the After-Sales Status tab (the
 * /care ?tab= precedent). Replaces the 07-28 ACCOUNT-RETURNS-AFTER-SALES
 * import (1230:119). Visual placeholder: the mock's own order and request
 * cases; reached from the dashboard's Returns & After-Sales row.
 */

import type { Metadata } from "next";
import { ReturnsStartScreen } from "@/components/screens/returns/ReturnsStartScreen";

export const metadata: Metadata = {
  title: "Returns & after-sales — ELDREVE",
  robots: { index: false },
};

export default async function ReturnsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const requested = (await searchParams).tab;
  return (
    <ReturnsStartScreen
      initialTab={requested === "status" ? "status" : "start"}
    />
  );
}
