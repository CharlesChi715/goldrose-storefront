/**
 * ROLE OF THIS FILE
 * The /shop route. TEMPORARY: redirects to the homepage until the real shop
 * page (Figma "Frame 26" from the VELORIA file) is imported here.
 */

import { redirect } from "next/navigation";

export default function ShopPage() {
  redirect("/");
}
