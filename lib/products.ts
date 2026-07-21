/**
 * ROLE OF THIS FILE
 * The product catalog — the single source of truth for what the store sells.
 * Every part of the app (homepage, cart, checkout, order log) looks products
 * up here by `id`, so prices and names only ever need changing in one place.
 *
 * Prices are stored in CENTS (4999 = $49.99). Doing money math in whole
 * integers avoids floating-point rounding bugs like 0.1 + 0.2 = 0.30000000004.
 */

/**
 * The shape of one product. `type` in TypeScript declares what fields an
 * object must have; the compiler then catches typos like `product.pricee`.
 * A `?` after a field name (compareAtPrice?) means the field is optional.
 */
export type Product = {
  id: string; // internal id used in the cart and URLs, e.g. "signature-gold-rose"
  sku: string; // stock-keeping unit — the human-readable warehouse code
  handle: string; // URL slug matching the product's handle in Shopify admin
  shopifyProductId: string; // real Shopify GraphQL id (GID) of the product
  shopifyVariantId: string; // real Shopify GID of the variant — this is what checkout sends to Shopify
  name: string;
  shortName: string;
  price: number; // selling price in cents
  compareAtPrice?: number; // optional "was" price shown struck through
  landedCost: number; // what one unit costs the business, in cents (not shown to customers)
  inventoryOnHand: number; // stock count (maintained by hand — can drift from Shopify)
  reorderPoint: number; // when stock falls below this, the UI shows "Low stock"
  packageWeightOz: number;
  image: string;
  alt: string;
  description: string;
  bestFor: string;
  badge: string;
  options: string[];
  details: string[];
  tags: string[];
};

export const products: Product[] = [
  {
    id: "signature-gold-rose",
    sku: "GR-SIG-001",
    handle: "signature-24k-gold-rose",
    shopifyProductId: "gid://shopify/Product/7607585865774",
    shopifyVariantId: "gid://shopify/ProductVariant/42470616727598",
    name: "GoldRose Signature 24K Gold Rose",
    shortName: "Signature Rose",
    price: 4999,
    compareAtPrice: 8999,
    landedCost: 1425,
    inventoryOnHand: 420,
    reorderPoint: 90,
    packageWeightOz: 12,
    image: "/products/gold-rose-stand.jpg",
    alt: "Gold dipped rose displayed beside a brown gift box",
    description:
      "A genuine rose preserved with a luminous 24K gold dipped finish and clear display stand.",
    bestFor: "Anniversaries, birthdays, and classic romantic gifting.",
    badge: "Save 44%",
    options: ["Gift box included", "Valentine card", "No message card"],
    details: ["Real rose base", "Clear display stand", "Gift-ready presentation"],
    tags: ["signature", "anniversary", "valentines-day", "gift-ready"],
  },
  {
    id: "boxed-keepsake-rose",
    sku: "GR-BOX-002",
    handle: "boxed-keepsake-gold-rose",
    shopifyProductId: "gid://shopify/Product/7607586160686",
    shopifyVariantId: "gid://shopify/ProductVariant/42470645366830",
    name: "GoldRose Boxed Keepsake Rose",
    shortName: "Boxed Keepsake",
    price: 6499,
    compareAtPrice: 10999,
    landedCost: 1780,
    inventoryOnHand: 260,
    reorderPoint: 75,
    packageWeightOz: 18,
    image: "/products/gold-rose-box.jpg",
    alt: "Gold dipped rose shown with a presentation box",
    description:
      "The rose plus presentation packaging for a more finished gift moment.",
    bestFor: "Valentine's Day, Mother's Day, and milestone moments.",
    badge: "Gift-ready",
    options: ["Valentine card", "Anniversary card", "Mother's Day card"],
    details: ["Embossed keepsake box", "Message card option", "Premium visual finish"],
    tags: ["boxed", "mothers-day", "valentines-day", "keepsake"],
  },
  {
    id: "premium-gift-bundle",
    sku: "GR-BND-003",
    handle: "premium-gold-rose-gift-bundle",
    shopifyProductId: "gid://shopify/Product/7607586193454",
    shopifyVariantId: "gid://shopify/ProductVariant/42470699958318",
    name: "GoldRose Premium Gift Bundle",
    shortName: "Premium Bundle",
    price: 7999,
    compareAtPrice: 13999,
    landedCost: 2360,
    inventoryOnHand: 140,
    reorderPoint: 50,
    packageWeightOz: 24,
    image: "/products/gold-rose-detail.jpg",
    alt: "Close-up detail graphic of a gold dipped rose",
    description:
      "A higher-value bundle focused on material detail, presentation, and a stronger reveal.",
    bestFor: "Customers who want the most complete gift option.",
    badge: "Best value",
    options: ["Gift message", "Premium insert", "Standard insert"],
    details: ["Detail-focused finish", "Premium insert option", "Strongest gift presentation"],
    tags: ["bundle", "premium", "gift-ready", "high-aov"],
  },
];

/** The product featured in the big banner at the top of the homepage. */
export const heroProduct = products[0];

/**
 * Turn cents into a display string: 4999 -> "$49.99".
 * `Intl.NumberFormat` is the browser/Node built-in for locale-aware
 * formatting — it handles the $ sign, commas, and two decimals for us.
 */
export function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
