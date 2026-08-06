/**
 * ROLE OF THIS FILE
 * /policies/contact-legal — the seller-of-record notice. Was a coming-soon
 * scaffold for the un-ready Figma frame 2118:245; built out 2026-08-06
 * because payment-provider onboarding and US disclosure rules both need it
 * before launch. Reads the `store` setting so the owner supplies the
 * registered details at /admin/settings, not in code.
 *
 * Linked from the Policies & Legal hub (1523:1136). Indexable, unlike the
 * remaining scaffolds — this is a page search engines should see.
 */

import type { Metadata } from "next";
import { ContactLegalScreen } from "@/components/screens/ContactLegalScreen";
import { getSettingsMap } from "@/lib/admin/settings";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Contact & legal notice",
  description:
    "The registered company behind ELDREVE, its business address, and how to contact us.",
};

export default async function ContactLegalPage() {
  const settings = await getSettingsMap();
  return <ContactLegalScreen store={settings.store} />;
}
