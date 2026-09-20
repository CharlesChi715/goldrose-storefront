/**
 * Validate the Supabase environment before a production build starts.
 *
 * ELDREVE deliberately supports a no-Supabase local/test mode, so all three
 * variables may be absent outside Vercel production. A partial configuration
 * is always an error, and Vercel production requires the complete set.
 */

import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

// Standalone Node scripts do not automatically load Next.js .env files.
// Use Next's own loader so local `npm run build` sees the same values as
// `next build`; Vercel already injects its selected environment variables.
loadEnvConfig(process.cwd());

const requiredSupabaseEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
};

const entries = Object.entries(requiredSupabaseEnv);
const present = entries
  .filter(([, value]) => Boolean(value))
  .map(([name]) => name);
const missing = entries.filter(([, value]) => !value).map(([name]) => name);

const partiallyConfigured = present.length > 0 && missing.length > 0;
const vercelTarget = process.env.VERCEL_TARGET_ENV ?? process.env.VERCEL_ENV;
const productionVercel = vercelTarget === "production";

if (partiallyConfigured || (productionVercel && missing.length > 0)) {
  console.error(
    `[env] Missing required Supabase variable(s): ${missing.join(", ")}`,
  );
  console.error(
    `[env] Configured variable name(s): ${present.join(", ") || "none"}`,
  );
  process.exit(1);
}

console.log(
  missing.length === 0
    ? "[env] Hosted Supabase configuration is complete."
    : "[env] Supabase is unconfigured; local file mode will be used.",
);

// Skip-payment is a testing-phase switch: it places orders with no payment at
// all. That is fine on the pre-launch testing deployment, and catastrophic
// once real money is switched on — so pairing it with PAYPAL_ENV=live (the
// owner-only launch switch) is a hard build failure. Everywhere else it is a
// loud warning, louder still on a Vercel production build.
const skipPayment = ["1", "true"].includes(
  (process.env.CHECKOUT_SKIP_PAYMENT ?? "").trim().toLowerCase(),
);
const paypalLive =
  (process.env.PAYPAL_ENV ?? "").trim().toLowerCase() === "live";

if (skipPayment && paypalLive) {
  console.error(
    "[env] CHECKOUT_SKIP_PAYMENT is set while PAYPAL_ENV=live — checkout would",
  );
  console.error(
    "[env] hand out orders for free on a storefront taking real money.",
  );
  console.error("[env] Remove CHECKOUT_SKIP_PAYMENT before going live.");
  process.exit(1);
}

// The webhook is the safety net under the browser-driven capture: it is what
// repairs an order when the buyer's browser dies between paying and our
// response. Without PAYPAL_WEBHOOK_ID the signature check cannot pass, so
// every delivery is rejected as unverifiable and the net is simply not there —
// silently, because a shop that never hits the failure looks identical to one
// that is protected. Loud whenever PayPal is configured at all, fatal when the
// money is real.
const paypalConfigured = Boolean(
  (process.env.PAYPAL_CLIENT_ID ?? "").trim() &&
  (process.env.PAYPAL_SECRET ?? "").trim(),
);
const webhookId = (process.env.PAYPAL_WEBHOOK_ID ?? "").trim();

if (paypalConfigured && !webhookId) {
  if (paypalLive) {
    console.error(
      "[env] PAYPAL_ENV=live with no PAYPAL_WEBHOOK_ID — the webhook that",
    );
    console.error(
      "[env] repairs an order when the buyer's browser dies cannot verify a",
    );
    console.error("[env] single delivery, so orders would be lost silently.");
    process.exit(1);
  }
  console.warn(
    "[env] ⚠ PayPal is configured but PAYPAL_WEBHOOK_ID is not — webhook",
  );
  console.warn(
    "[env] ⚠ deliveries will all be rejected as unverifiable, so the order-",
  );
  console.warn("[env] ⚠ repair safety net is off.");
}

// Stripe carries the card rail (card-payments.md). The key's own prefix says
// whether money is real; the same skip-payment and missing-webhook-secret
// hazards apply as for PayPal, with sk_live_ playing the PAYPAL_ENV=live role.
const stripeKey = (process.env.STRIPE_SECRET_KEY ?? "").trim();
const stripeLive = stripeKey.startsWith("sk_live_");
const stripeWebhookSecret = (process.env.STRIPE_WEBHOOK_SECRET ?? "").trim();

if (skipPayment && stripeLive) {
  console.error(
    "[env] CHECKOUT_SKIP_PAYMENT is set while STRIPE_SECRET_KEY is a LIVE key —",
  );
  console.error(
    "[env] checkout would hand out orders for free on a storefront taking real money.",
  );
  console.error("[env] Remove CHECKOUT_SKIP_PAYMENT before going live.");
  process.exit(1);
}

if (stripeKey && !stripeWebhookSecret) {
  if (stripeLive) {
    console.error(
      "[env] STRIPE_SECRET_KEY is a LIVE key with no STRIPE_WEBHOOK_SECRET —",
    );
    console.error(
      "[env] the webhook that repairs an order when the buyer's browser dies",
    );
    console.error(
      "[env] cannot verify a single delivery, so orders would be lost silently.",
    );
    process.exit(1);
  }
  console.warn(
    "[env] ⚠ Stripe is configured but STRIPE_WEBHOOK_SECRET is not — webhook",
  );
  console.warn(
    "[env] ⚠ deliveries will all be rejected as unverifiable, so the order-",
  );
  console.warn("[env] ⚠ repair safety net is off.");
}

if (skipPayment) {
  console.warn(
    "[env] ⚠ CHECKOUT_SKIP_PAYMENT is ON — checkout skips payment entirely and",
  );
  console.warn("[env] ⚠ places orders immediately. Testing only.");
  if (productionVercel) {
    console.warn(
      "[env] ⚠ This is a Vercel PRODUCTION build. Fine while pre-launch; it",
    );
    console.warn("[env] ⚠ MUST be removed before the storefront takes money.");
  }
}
