/**
 * ROLE OF THIS FILE
 * /admin/content — Shopify's Content section, adapted to our slot system
 * (§9.8): a card per site_content slot with edit + "Reset to original", plus
 * the entry point to Content → Home page.
 *
 * The homepage's own slots (`home.*`, and the promo slogan it owns) are filtered
 * out here on purpose: they are edited section-by-section on /admin/content/home,
 * where each one sits next to the design context that explains it, and listing
 * them twice would give the owner two places to change one string.
 * Policy slots are edited in Settings → Policies, likewise not here.
 */

import { listContentSlots } from "@/lib/content";
import { ContentSlots } from "./ContentSlots";

/** Slot-key prefixes owned by another admin screen. */
const ELSEWHERE = ["policy.", "home.", "promo."];

export default async function ContentPage() {
  const slots = (await listContentSlots()).filter(
    (slot) => !ELSEWHERE.some((prefix) => slot.key.startsWith(prefix)),
  );
  return <ContentSlots slots={slots} />;
}
