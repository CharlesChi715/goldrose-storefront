/**
 * ROLE OF THIS FILE
 * Order emails (§10.3, adapt of Shopify's notifications): order
 * confirmation + shipping confirmation to the buyer, new-order alert to the
 * owner. Sent through Resend's REST API when RESEND_API_KEY is set;
 * otherwise logged to the console (the §0.2 dev fallback). Notification
 * toggles live in settings (§9.11) and default to on.
 */

import { carrierLabel } from "./shipping/carriers.ts";
import { getStore } from "./supabase/store.ts";
import type { OrderLineRow, OrderRow } from "./supabase/types.ts";

type NotificationToggles = {
  order_confirmation: boolean;
  shipping_confirmation: boolean;
  new_order_alert: boolean;
};

/**
 * Read the notification toggles, store name, and owner contact email from
 * the settings table, defaulting every toggle to on and the store name to
 * "GoldRose" when unset.
 *
 * @returns The toggles plus storeName and ownerEmail.
 */
async function getEmailSettings(): Promise<{
  toggles: NotificationToggles;
  storeName: string;
  ownerEmail: string;
}> {
  const settings = await getStore().all("settings");
  const notifications = settings.find((row) => row.key === "notifications")
    ?.value as Partial<NotificationToggles> | undefined;
  const store = settings.find((row) => row.key === "store")?.value as
    { name?: string; contact_email?: string } | undefined;
  return {
    toggles: {
      order_confirmation: notifications?.order_confirmation ?? true,
      shipping_confirmation: notifications?.shipping_confirmation ?? true,
      new_order_alert: notifications?.new_order_alert ?? true,
    },
    storeName: store?.name ?? "GoldRose",
    ownerEmail: store?.contact_email ?? "",
  };
}

function money(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Send one plain-text email via Resend's REST API, or log it to the console
 * when RESEND_API_KEY is unset (the §0.2 dev fallback). Never throws — send
 * failures are logged so an email problem can't break an order.
 *
 * @param to - Recipient email address.
 * @param subject - Email subject line.
 * @param text - Plain-text body.
 */
async function deliver(
  to: string,
  subject: string,
  text: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.log(
      `[email:console-mode] To: ${to}\nSubject: ${subject}\n${text}\n`,
    );
    return;
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? "GoldRose <onboarding@resend.dev>",
        to: [to],
        subject,
        text,
      }),
    });
    if (!response.ok) {
      console.error(
        `[email] Resend ${response.status}: ${await response.text()}`,
      );
    }
  } catch (error) {
    // Email failures never break an order.
    console.error("[email] send failed:", error);
  }
}

/**
 * Build the plain-text order summary shared by every order email: one line
 * per item, then subtotal, discount (if any), shipping, tax, and total.
 *
 * @param order - The order row with the money totals.
 * @param lines - The order's snapshot line items.
 * @returns The multi-line summary text.
 */
function orderSummaryText(order: OrderRow, lines: OrderLineRow[]): string {
  const rows = lines
    .map(
      (line) =>
        `  ${line.quantity} × ${line.name}${line.option ? ` (${line.option})` : ""} — ${money(line.line_total_cents)}`,
    )
    .join("\n");
  const discount = order.discount_cents
    ? `\nDiscount${order.discount_code ? ` (${order.discount_code})` : ""}: −${money(order.discount_cents)}`
    : "";
  return `Order ${order.name}\n\n${rows}\n\nSubtotal: ${money(order.subtotal_cents)}${discount}\nShipping: ${order.shipping_free ? "Free" : money(order.shipping_cents)}\nTax: ${money(order.tax_cents)}\nTotal: ${money(order.total_cents)} ${order.currency}`;
}

/**
 * Send the buyer's order confirmation and the owner's new-order alert,
 * right after an order lands (§10.1). Each email is skipped when its
 * settings toggle is off or the recipient address is missing.
 *
 * @param order - The freshly created order row.
 * @param lines - The order's snapshot line items.
 */
export async function sendOrderPlacedEmails(
  order: OrderRow,
  lines: OrderLineRow[],
): Promise<void> {
  const { toggles, storeName, ownerEmail } = await getEmailSettings();
  const summary = orderSummaryText(order, lines);

  if (toggles.order_confirmation && order.email) {
    await deliver(
      order.email,
      `${storeName} — order ${order.name} confirmed`,
      `Thank you for your order!\n\n${summary}\n\nWe'll email you again when it ships.`,
    );
  }
  if (toggles.new_order_alert && ownerEmail) {
    await deliver(
      ownerEmail,
      `New order ${order.name} — ${money(order.total_cents)}`,
      `A new order just came in.\n\n${summary}\n\nSource: ${order.source} · Provider: ${order.payment_provider}`,
    );
  }
}

/**
 * Send the buyer's shipping confirmation with carrier, tracking number and
 * link when present, triggered by the fulfill flow (§9.4). Skipped when the
 * toggle is off or the order has no email.
 *
 * @param order - The order row, including any tracking fields.
 * @param lines - The order's snapshot line items.
 */
export async function sendShippingConfirmationEmail(
  order: OrderRow,
  lines: OrderLineRow[],
): Promise<void> {
  const { toggles, storeName } = await getEmailSettings();
  if (!toggles.shipping_confirmation || !order.email) {
    return;
  }
  const carrier = carrierLabel(order.tracking_carrier);
  const tracking = order.tracking_number
    ? `${carrier ? `\nCarrier: ${carrier}` : ""}\nTracking number: ${order.tracking_number}${order.tracking_url ? `\nTrack it: ${order.tracking_url}` : ""}`
    : "";
  await deliver(
    order.email,
    `${storeName} — order ${order.name} is on its way`,
    `Good news — your order has shipped!${tracking}\n\n${orderSummaryText(order, lines)}`,
  );
}

/**
 * Email the owner a business/procurement enquiry from the B2B sign-in screen
 * (frame 74:55). The design's request CTAs have no backend of their own — the
 * agreed V1 is "static + email the request" — so this is the whole pipeline.
 * Stored nowhere: if the owner email is unset the enquiry is logged, never
 * silently dropped.
 *
 * @param enquiry - The visitor's email, the chosen need, and which CTA sent it.
 * @returns True when an email was addressed to the owner, false when no owner
 *   contact email is configured (the caller still reports success to the
 *   visitor; the console fallback keeps the enquiry).
 */
export async function sendBusinessRequestEmail(enquiry: {
  email: string;
  need?: string;
  kind: "request" | "consultation";
}): Promise<boolean> {
  const { storeName, ownerEmail } = await getEmailSettings();
  const heading =
    enquiry.kind === "consultation"
      ? "Consultation booking"
      : "Purchase request";
  const text = [
    `${heading} from the ${storeName} Business & Partnerships page.`,
    "",
    `From: ${enquiry.email}`,
    `Need: ${enquiry.need ?? "(not specified)"}`,
    "",
    "Reply directly to this address to follow up.",
  ].join("\n");

  if (!ownerEmail) {
    console.warn(
      `[email] no owner contact email set — business enquiry not delivered:\n${text}`,
    );
    return false;
  }
  await deliver(ownerEmail, `${heading} — ${enquiry.email}`, text);
  return true;
}
