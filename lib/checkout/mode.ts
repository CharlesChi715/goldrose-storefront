/**
 * ROLE OF THIS FILE
 * The testing-phase "skip payment" switch (§10.4). With CHECKOUT_SKIP_PAYMENT
 * on, /checkout drops the card form and every payment button and offers a
 * single Place order button that records the order straight away — no card,
 * no provider, no money. The real PayPal path is only GATED by this, never
 * modified: turn the flag off and checkout behaves exactly as before.
 *
 * Follows the house convention (lib/paypal/client.ts, lib/supabase/env.ts):
 * one function owns the process.env read, call sites read the function.
 */

/**
 * Whether checkout should bypass payment entirely and place the order on the
 * first click. Server-only — read it in a Server Component or route handler
 * and pass the result down, never from client code.
 *
 * @returns True when CHECKOUT_SKIP_PAYMENT is set to "1" or "true".
 */
export function skipPaymentEnabled(): boolean {
  const value = (process.env.CHECKOUT_SKIP_PAYMENT ?? "").trim().toLowerCase();
  return value === "1" || value === "true";
}
