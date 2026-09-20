/**
 * ROLE OF THIS FILE
 * /admin/settings — Shopify's settings index, applicable pages only
 * (§9.11): General, Payments, Checkout, Shipping and delivery, Markets,
 * Taxes and duties, Notifications, Users and permissions, Policies,
 * Search engine & AI, Languages — one indexed page of section cards.
 */

import { requireAdmin } from "@/lib/admin/auth";
import { hasAdvisorKey } from "@/lib/advisor/keys";
import { getSettingsMap } from "@/lib/admin/settings";
import { getContentSlot } from "@/lib/content";
import { getStripeConfig } from "@/lib/stripe/client.ts";
import { getStore } from "@/lib/supabase/store.ts";
import { SettingsView } from "./SettingsView";

export default async function SettingsPage() {
  // Only whether a key exists — never the key itself. See lib/advisor/keys.ts.
  const session = await requireAdmin();
  const advisorKeySaved = await hasAdvisorKey(session.userId);

  const [settings, admins, refund, privacy, terms] = await Promise.all([
    getSettingsMap(),
    getStore().all("admin_users"),
    getContentSlot("policy.refund"),
    getContentSlot("policy.privacy"),
    getContentSlot("policy.terms"),
  ]);
  const stripe = getStripeConfig();

  return (
    <SettingsView
      settings={settings}
      payment={{
        mode: !stripe.configured ? "mock" : stripe.live ? "live" : "sandbox",
        webhookConfigured: Boolean(stripe.webhookSecret),
      }}
      advisor={{ keySaved: advisorKeySaved }}
      owners={admins.map((admin) => admin.email || admin.user_id)}
      policies={{
        refund: refund?.text ?? "",
        privacy: privacy?.text ?? "",
        terms: terms?.text ?? "",
      }}
    />
  );
}
