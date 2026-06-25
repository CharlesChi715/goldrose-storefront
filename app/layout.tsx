import type { Metadata } from "next";
import "./globals.css";

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
