/**
 * ROLE OF THIS FILE
 * Root layout for /admin/* — loads Polaris styles, blocks indexing (§9.1:
 * all admin pages are noindex + force-dynamic), reads the language cookie
 * server-side (no flash), and mounts the Polaris AppProvider shell that the
 * login page and the authenticated frame both share.
 */

import "@shopify/polaris/build/esm/styles.css";
import type { Metadata } from "next";
import { getAdminLang } from "@/lib/admin/lang";
import { PolarisShell } from "./PolarisShell";

export const metadata: Metadata = {
  title: { default: "GoldRose admin", template: "%s · GoldRose admin" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = await getAdminLang();
  return <PolarisShell lang={lang}>{children}</PolarisShell>;
}
