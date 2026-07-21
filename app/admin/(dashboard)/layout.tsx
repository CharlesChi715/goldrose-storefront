/**
 * ROLE OF THIS FILE
 * Layout for every authenticated admin screen: enforces requireAdmin()
 * (non-members 404 — §9.2) and mounts the Shopify-clone chrome (left nav +
 * top bar + payment-mode banner, §9.1). The login page lives outside this
 * route group.
 */

import { requireAdmin } from "@/lib/admin/auth";
import { AdminFrame, type PaymentMode } from "./AdminFrame";

function currentPaymentMode(): PaymentMode {
  if (!process.env.PAYPAL_CLIENT_ID) {
    return "mock";
  }
  return process.env.PAYPAL_ENV === "live" ? "live" : "sandbox";
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();
  return (
    <AdminFrame email={session.email} paymentMode={currentPaymentMode()}>
      {children}
    </AdminFrame>
  );
}
