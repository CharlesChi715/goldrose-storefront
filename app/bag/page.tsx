/**
 * ROLE OF THIS FILE
 * /bag — server half: loads the DB catalog (safe view) so the client screen
 * can resolve the localStorage cart's variant ids into products and prices.
 * The cart itself never stores prices, so this is what turns "two of variant
 * X" into a line worth $158.00; the server re-prices everything again at
 * checkout, so a tampered localStorage can never change what is charged.
 *
 * A dead or unreachable DB must degrade to the empty-bag frame, never a 500 —
 * the /checkout precedent.
 *
 * The canvas height is the client's to decide (it grows with the number of
 * lines), so BagScreen renders its own ScaleFrame — see that file's header.
 */

import type { Metadata } from "next";
import { getCatalog } from "@/lib/supabase/catalog.ts";
import { BagScreen } from "@/components/screens/BagScreen";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Shopping bag",
  description: "Review your ELDREVE gifts before checkout.",
  alternates: { canonical: "/bag" },
};

export default async function BagPage() {
  let catalog: Awaited<ReturnType<typeof getCatalog>> = [];
  try {
    catalog = await getCatalog();
  } catch {
    // fall through with an empty catalog: every line resolves to nothing and
    // the screen shows the empty-bag frame.
  }
  return <BagScreen catalog={catalog} />;
}
