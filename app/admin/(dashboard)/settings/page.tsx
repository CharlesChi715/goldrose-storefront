/**
 * ROLE OF THIS FILE
 * /admin/settings — Shopify's settings index, applicable pages only
 * (§9.11): General, Payments, Checkout, Shipping and delivery, Markets,
 * Taxes and duties, Notifications, Users and permissions, Policies,
 * Search engine & AI, Languages — one indexed page of section cards.
 */

import { getSettingsMap } from "@/lib/admin/settings";
import { getContentSlot } from "@/lib/content";
import { getPayPalConfig } from "@/lib/paypal/client";
import { getStore } from "@/lib/supabase/store.ts";
import { SettingsView } from "./SettingsView";

export default async function SettingsPage() {
  const [settings, admins, refund, privacy, terms] = await Promise.all([
    getSettingsMap(),
    getStore().all("admin_users"),
    getContentSlot("policy.refund"),
    getContentSlot("policy.privacy"),
    getContentSlot("policy.terms"),
  ]);
  const paypal = getPayPalConfig();

  return (
    <SettingsView
      settings={settings}
      payment={{
        mode: paypal.configured ? paypal.env : "mock",
        clientIdTail: paypal.clientId ? `…${paypal.clientId.slice(-6)}` : null,
        webhookConfigured: Boolean(paypal.webhookId),
      }}
      owners={admins.map((admin) => admin.email || admin.user_id)}
      policies={{
        refund: refund?.text ?? "",
        privacy: privacy?.text ?? "",
        terms: terms?.text ?? "",
      }}
    />
  );
}
