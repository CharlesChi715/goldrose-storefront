/**
 * ROLE OF THIS FILE
 * The homepage (`/`) — a pixel-exact implementation of the redesigned
 * "Homepage · Layered Editable" frame (nodes 138:55/138:56, modules
 * A-1…A-11) from the VELORIA Figma file. Every coordinate, size, color, and
 * font value comes verbatim from the Figma REST API data; each A-module
 * lives in components/home/. The 430-wide canvas scales to the viewport
 * (ScaleFrame); photo assets in /public/veloria/home are exact 2× node
 * renders. It also carries the store's Schema.org structured data and the
 * admin-editable promo slogan. Route wiring follows docs/ixd/ — unconfirmed
 * targets stay pixel-exact but non-clickable.
 */

import type { Metadata } from "next";
import { ScaleFrame, PromoBar, HomeHeader } from "@/components/veloria";
import { playfair } from "@/lib/fonts";
import { A1 } from "@/components/home/A1";
import { A2 } from "@/components/home/A2";
import { A3 } from "@/components/home/A3";
import { A4 } from "@/components/home/A4";
import { A5 } from "@/components/home/A5";
import { A6 } from "@/components/home/A6";
import { A7 } from "@/components/home/A7";
import { A8 } from "@/components/home/A8";
import { A9 } from "@/components/home/A9";
import { A10 } from "@/components/home/A10";
import { A11 } from "@/components/home/A11";
import { getCatalog } from "@/lib/supabase/catalog.ts";
import { getSettingsMap, siteBaseUrl } from "@/lib/admin/settings";
import { getPromoSlogan } from "@/lib/content";
import { fileUrl } from "@/lib/files-url";

// DB-backed data (promo slogan, JSON-LD, search listing) refreshes without a redeploy (§8).
export const revalidate = 300;

/** Homepage search listing — editable in Settings → Search engine & AI (§8.1). */
export async function generateMetadata(): Promise<Metadata> {
  try {
    const { search_engine } = await getSettingsMap();
    return {
      title: { absolute: search_engine.home_title },
      description: search_engine.home_description,
      alternates: { canonical: "/" },
      openGraph: {
        title: search_engine.home_title,
        description: search_engine.home_description,
        images: [{ url: search_engine.social_image }],
      },
    };
  } catch {
    return { alternates: { canonical: "/" } };
  }
}

export default async function HomePage() {
  // Schema.org structured data from the LIVE catalog (§8.1): Organization +
  // WebSite + the store's offers, with price/availability from real stock.
  let catalog: Awaited<ReturnType<typeof getCatalog>> = [];
  let storeName = "GoldRose";
  let promo = { text: "", isDefault: true };
  try {
    catalog = await getCatalog();
    storeName = (await getSettingsMap()).store.name;
  } catch {
    // fixed design still renders with no DB
  }
  try {
    promo = await getPromoSlogan();
  } catch {
    // default slogan (Figma pixels) still renders with no DB
  }
  const base = siteBaseUrl();
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: storeName,
      url: `${base}/`,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: storeName,
      url: `${base}/`,
    },
    {
      "@context": "https://schema.org",
      "@type": "Store",
      name: storeName,
      description: "Gift-ready 24K gold dipped rose keepsakes.",
      url: `${base}/`,
      makesOffer: catalog.map((product) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Product",
          name: product.title,
          sku: product.variants[0]?.sku,
          description: product.description,
          image: product.images[0] ? fileUrl(product.images[0].path) : undefined,
          url: `${base}/products/${product.handle}`,
        },
        price: ((product.variants[0]?.price_cents ?? 0) / 100).toFixed(2),
        priceCurrency: "USD",
        availability: product.variants.some((variant) => variant.in_stock)
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      })),
    },
  ];

  return (
    <ScaleFrame height={8673} background="#FFF6EC" fontClass={playfair.className} navActive="Home">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <PromoBar slogan={promo.text} isDefault={promo.isDefault} variant="brown" />
      <A1 />
      <A2 />
      <A3 />
      <A4 />
      <A5 />
      <A6 />
      <A7 />
      <A8 />
      <A9 />
      <A10 />
      <A11 />
      {/* Header last: A-1's opaque module background covers y32-98, and the
          header (chrome, not part of any module) must paint above it. */}
      <HomeHeader />
    </ScaleFrame>
  );
}
