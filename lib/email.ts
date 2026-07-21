/**
 * ROLE OF THIS FILE
 * Order emails (§10.3, adapt of Shopify's notifications): order
 * confirmation + shipping confirmation to the buyer, new-order alert to the
 * owner. Sent through Resend's REST API when RESEND_API_KEY is set;
 * otherwise logged to the console (the §0.2 dev fallback). Notification
 * toggles live in settings (§9.11) and default to on.
 */

import { getStore } from "./supabase/store.ts";
import type { OrderLineRow, OrderRow } from "./supabase/types.ts";

type NotificationToggles = {
  order_confirmation: boolean;
  shipping_confirmation: boolean;
  new_order_alert: boolean;
};

async function getEmailSettings(): Promise<{
  toggles: NotificationToggles;
  storeName: string;
  ownerEmail: string;
}> {
  const settings = await getStore().all("settings");
  const notifications = settings.find((row) => row.key === "notifications")?.value as
    | Partial<NotificationToggles>
    | undefined;
  const store = settings.find((row) => row.key === "store")?.value as
    | { name?: string; contact_email?: string }
    | undefined;
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

async function deliver(to: string, subject: string, text: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.log(`[email:console-mode] To: ${to}\nSubject: ${subject}\n${text}\n`);
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
      console.error(`[email] Resend ${response.status}: ${await response.text()}`);
    }
  } catch (error) {
    // Email failures never break an order.
    console.error("[email] send failed:", error);
  }
}

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

/** Buyer confirmation + owner alert, right after an order lands (§10.1). */
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

/** Shipping confirmation with tracking, sent by the fulfill flow (§9.4). */
export async function sendShippingConfirmationEmail(
  order: OrderRow,
  lines: OrderLineRow[],
): Promise<void> {
  const { toggles, storeName } = await getEmailSettings();
  if (!toggles.shipping_confirmation || !order.email) {
    return;
  }
  const tracking = order.tracking_number
    ? `\nTracking number: ${order.tracking_number}${order.tracking_url ? `\nTrack it: ${order.tracking_url}` : ""}`
    : "";
  await deliver(
    order.email,
    `${storeName} — order ${order.name} is on its way`,
    `Good news — your order has shipped!${tracking}\n\n${orderSummaryText(order, lines)}`,
  );
}
