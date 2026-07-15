/**
 * ROLE OF THIS FILE
 * The root layout — the outer HTML shell every page renders inside. In the
 * Next.js App Router this is where the site-wide <html>/<body> tags, global
 * CSS import, and default SEO metadata live.
 */

import type { Metadata } from "next";
import "./globals.css";

// Exporting `metadata` is the App Router way to set <title>, description,
// and social-share (Open Graph) tags. The `template` makes child pages render
// as "Checkout | AUREÀ" etc. NOTE: metadataBase still uses the placeholder
// domain — swap it when the real production domain is connected.
export const metadata: Metadata = {
  metadataBase: new URL("https://aurea.example"),
  title: {
    default: "AUREÀ | 24K Gold Dipped Rose Gifts",
    template: "%s | AUREÀ",
  },
  description:
    "A luxury direct-to-consumer storefront for gift-ready 24K gold dipped rose keepsakes.",
  applicationName: "AUREÀ",
  keywords: [
    "gold rose",
    "24K gold dipped rose",
    "anniversary gift",
    "Valentine's Day gift",
    "Mother's Day gift",
  ],
  openGraph: {
    title: "AUREÀ | 24K Gold Dipped Rose Gifts",
    description:
      "Gift-ready preserved rose keepsakes for anniversaries, Valentine's Day, Mother's Day, and milestone moments.",
    type: "website",
    images: [
      {
        url: "/products/hero-valentine.png",
        width: 1120,
        height: 928,
        alt: "Gold and red rose gift arrangement",
      },
    ],
  },
};

/** Wrap every page in the shared <html>/<body>. `children` is the page itself. */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
