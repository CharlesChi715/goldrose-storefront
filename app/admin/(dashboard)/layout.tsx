/**
 * ROLE OF THIS FILE
 * Layout for every authenticated admin screen: enforces requireAdmin()
 * (non-members 404 — §9.2) and mounts the Shopify-clone chrome (left nav +
 * top bar + payment-mode banner, §9.1). The login page lives outside this
 * route group.
 */

import { OPEN_ACCESS_GUEST, requireAdmin } from "@/lib/admin/auth";
import { getForumNickname } from "@/lib/admin/forum";
import { adminAlerts } from "@/lib/admin/analytics";
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
  const alerts = await adminAlerts();
  // Testing-phase guests have no email — show their forum nickname instead.
  const display =
    session.email === OPEN_ACCESS_GUEST.email
      ? ((await getForumNickname()) ?? session.email)
      : session.email;
  return (
    <AdminFrame email={display} paymentMode={currentPaymentMode()} alerts={alerts}>
      {children}
    </AdminFrame>
  );
}
