import { Storefront } from "@/components/Storefront";
import { formatMoney, heroProduct, products } from "@/lib/products";

export default function Home() {
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
        description: product.description,
        image: product.image,
      },
      price: (product.price / 100).toFixed(2),
      priceCurrency: "USD",
      availability: "https://schema.org/PreOrder",
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
