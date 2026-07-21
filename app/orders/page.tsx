/**
 * ROLE OF THIS FILE
 * The old public demo order log. Orders now live in the admin (§9.4) — this
 * route just forwards there.
 */

import { redirect } from "next/navigation";

export default function OrdersRedirect() {
  redirect("/admin/orders");
}
