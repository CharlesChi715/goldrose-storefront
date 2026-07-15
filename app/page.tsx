/**
 * ROLE OF THIS FILE
 * The homepage route: in the App Router, `app/page.tsx` IS the `/` URL.
 * It stays a Server Component (no "use client") and does the SEO work —
 * structured data and a <noscript> fallback — then hands the interactive UI
 * to the <Storefront> client component.
 */

import { Storefront } from "@/components/Storefront";
import { formatMoney, heroProduct, products } from "@/lib/products";

export default function Home() {
  // Schema.org "structured data": a JSON description of the store and its
  // offers that search engines read to show rich results (price, stock).
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: "AUREÀ",
    description: "Gift-ready 24K gold dipped rose keepsakes.",
    url: "https://aurea.example",
    makesOffer: products.map((product) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Product",
        name: product.name,
        sku: product.sku,
        description: product.description,
        image: product.image,
      },
      price: (product.price / 100).toFixed(2),
      priceCurrency: "USD",
      availability:
        product.inventoryOnHand > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Storefront />
      <noscript>
        <div className="border-t border-[#eadfd7] bg-white p-6 text-center text-sm text-[#6f6660]">
          AUREÀ products start at {formatMoney(heroProduct.price)}. Enable
          JavaScript to use the cart experience.
        </div>
      </noscript>
    </>
  );
}
