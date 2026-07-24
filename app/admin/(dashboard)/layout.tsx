/**
 * ROLE OF THIS FILE
 * Layout for every authenticated admin screen: enforces requireAdmin()
 * (non-members 404 — §9.2) and mounts the Shopify-clone chrome (left nav +
 * top bar + payment-mode banner, §9.1). The login page lives outside this
 * route group.
 */

import { requireAdmin } from "@/lib/admin/auth";
import { adminAlerts } from "@/lib/admin/analytics";
import { getForumIdentity } from "@/lib/admin/forum";
import { getStore } from "@/lib/supabase/store.ts";
import type { ForumThreadActivity } from "@/lib/forum-unread";
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

  // Forum unread badge (owner request 2026-07-23): ship every thread's post
  // stamps to the frame; the client counts what this device hasn't read.
  const store = getStore();
  const [threads, posts] = await Promise.all([
    store.all("forum_threads"),
    store.all("forum_posts"),
  ]);
  const forumActivity: ForumThreadActivity[] = threads.map((thread) => ({
    threadId: thread.id,
    posts: posts
      .filter((post) => post.thread_id === thread.id)
      .map((post) => ({ at: post.created_at, by: post.nickname })),
  }));
  const forumIdentity = (await getForumIdentity()) ?? "";

  return (
    <AdminFrame
      email={session.email}
      paymentMode={currentPaymentMode()}
      alerts={alerts}
      forumActivity={forumActivity}
      forumIdentity={forumIdentity}
    >
      {children}
    </AdminFrame>
  );
}
