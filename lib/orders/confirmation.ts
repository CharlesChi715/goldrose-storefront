/**
 * ROLE OF THIS FILE
 * The /checkout/success page's one read of the just-placed order. The
 * confirmation screen names the address the order confirmation went to, and
 * that address must come from the order row — never from the query string,
 * which the buyer can rewrite.
 *
 * The lookup key is the order's UUID, not its `#1001` name: names are
 * sequential, so a name-keyed lookup would let anyone walk the order list
 * and harvest buyers' email addresses. A UUID is unguessable, so holding
 * the redirect URL is itself the proof you placed the order.
 */

import { getStore } from "../supabase/store.ts";

/** Matches a canonical v4-shaped UUID; anything else never reaches the store. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Look up the email address recorded on a placed order, for display on the
 * confirmation screen.
 *
 * @param orderId - The order's UUID, as carried by the success redirect's
 *   `oid` param. Untrusted: rejected unless it is UUID-shaped.
 * @returns The order's email, or null when the id is malformed, matches no
 *   order, or the order was placed without an address (guest PayPal flows
 *   can land without one).
 */
export async function getOrderConfirmationEmail(
  orderId: string | undefined,
): Promise<string | null> {
  if (!orderId || !UUID.test(orderId)) {
    return null;
  }
  const [order] = await getStore().where("orders", { id: orderId });
  return order?.email?.trim() || null;
}
