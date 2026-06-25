export type Product = {
  id: string;
  sku: string;
  name: string;
  shortName: string;
  price: number;
  compareAtPrice?: number;
  landedCost: number;
  inventoryOnHand: number;
  reorderPoint: number;
  packageWeightOz: number;
  image: string;
  alt: string;
  description: string;
  bestFor: string;
  badge: string;
  options: string[];
  details: string[];
};

export const products: Product[] = [
  {
    id: "signature-gold-rose",
    sku: "AUR-GR-SIG-001",
    name: "AUREÀ Signature 24K Gold Rose",
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
  },
  {
    id: "boxed-keepsake-rose",
    sku: "AUR-GR-BOX-002",
    name: "AUREÀ Boxed Keepsake Rose",
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
  },
  {
    id: "premium-gift-bundle",
    sku: "AUR-GR-BND-003",
    name: "AUREÀ Premium Gift Bundle",
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
  },
];

export const heroProduct = products[0];

export function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function grossMarginPercent(product: Product) {
  return Math.round(((product.price - product.landedCost) / product.price) * 100);
}
