/**
 * ROLE OF THIS FILE
 * /admin/content — Shopify's Content section, adapted to our slot system
 * (§9.8): one card per site_content slot with edit + "Reset to original".
 * The promo-slogan slot drives the §11 PNG-vs-text rule. Policy slots are
 * edited in Settings → Policies, not here.
 */

import { listContentSlots } from "@/lib/content";
import { ContentSlots } from "./ContentSlots";

export default async function ContentPage() {
  const slots = (await listContentSlots()).filter(
    (slot) => !slot.key.startsWith("policy."),
  );
  return <ContentSlots slots={slots} />;
}
