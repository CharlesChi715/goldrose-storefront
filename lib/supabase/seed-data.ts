/**
 * ROLE OF THIS FILE
 * The seed rows: the three placeholder products (values carried over from
 * the hardcoded lib/products.ts catalog), default settings, and the site
 * content slots. Used by scripts/seed.ts against either backend and by the
 * local file adapter's first-run auto-seed.
 *
 * Deliberately self-contained (no import of lib/products.ts): Stage 8
 * retires the hardcoded catalog, and the seed must survive that.
 *
 * OQ-2 note: the "Rest of world" shipping rate is a clearly-labeled
 * placeholder — the owner supplies real rates before launch (§4).
 */

import type { DbTables, ProductRow, ProductVariantRow, ProductImageRow } from "./types.ts";

export const DEFAULT_PROMO_SLOGAN =
  "✦ TIMELESS CRAFT · LOVE THAT NEVER FADES · 24K GOLD · FOREVER TREASURED ✦";

/** The local dev owner account (hosted mode uses a real auth.users uid instead). */
export const LOCAL_OWNER = {
  user_id: "00000000-0000-4000-8000-000000000001",
  email: "owner@goldrose.local",
};

type SeedProduct = {
  product: Omit<ProductRow, "created_at" | "updated_at">;
  images: Omit<ProductImageRow, "id">[];
  variants: Array<
    Omit<ProductVariantRow, "product_id"> & { product_id?: never }
  >;
};

const SEED_PRODUCTS: SeedProduct[] = [
  {
    product: {
      id: "signature-gold-rose",
      handle: "signature-24k-gold-rose",
      title: "GoldRose Signature 24K Gold Rose",
      short_name: "Signature Rose",
      description:
        "A genuine rose preserved with a luminous 24K gold dipped finish and clear display stand.",
      vendor: "GoldRose",
      product_type: "Gold Dipped Rose",
      tags: ["signature", "anniversary", "valentines-day", "gift-ready"],
      charge_tax: true,
      requires_shipping: true,
      country_of_origin: "CN",
      hs_code: "7117.19",
      seo_title: null,
      seo_description: null,
      best_for: "Anniversaries, birthdays, and classic romantic gifting.",
      badge: "Save 44%",
      details: ["Real rose base", "Clear display stand", "Gift-ready presentation"],
      option_names: ["Gift option"],
      status: "active",
      position: 1,
    },
    images: [
      {
        product_id: "signature-gold-rose",
        path: "/products/gold-rose-stand.jpg",
        alt: "Gold dipped rose displayed beside a brown gift box",
        position: 0,
      },
    ],
    variants: [
      {
        id: "0a2b1a10-4b7e-4d7a-9d24-000000000101",
        position: 0,
        option_values: ["Gift box included"],
        sku: "GR-SIG-001-1",
        barcode: "",
        price_cents: 4999,
        compare_at_price_cents: 8999,
        cost_cents: 1425,
        track_quantity: true,
        inventory_on_hand: 140,
        continue_selling_when_oos: false,
        weight_oz: 12,
      },
      {
        id: "0a2b1a10-4b7e-4d7a-9d24-000000000102",
        position: 1,
        option_values: ["Valentine card"],
        sku: "GR-SIG-001-2",
        barcode: "",
        price_cents: 4999,
        compare_at_price_cents: 8999,
        cost_cents: 1425,
        track_quantity: true,
        inventory_on_hand: 140,
        continue_selling_when_oos: false,
        weight_oz: 12,
      },
      {
        id: "0a2b1a10-4b7e-4d7a-9d24-000000000103",
        position: 2,
        option_values: ["No message card"],
        sku: "GR-SIG-001-3",
        barcode: "",
        price_cents: 4999,
        compare_at_price_cents: 8999,
        cost_cents: 1425,
        track_quantity: true,
        inventory_on_hand: 140,
        continue_selling_when_oos: false,
        weight_oz: 12,
      },
    ],
  },
  {
    product: {
      id: "boxed-keepsake-rose",
      handle: "boxed-keepsake-gold-rose",
      title: "GoldRose Boxed Keepsake Rose",
      short_name: "Boxed Keepsake",
      description:
        "The rose plus presentation packaging for a more finished gift moment.",
      vendor: "GoldRose",
      product_type: "Gold Dipped Rose",
      tags: ["boxed", "mothers-day", "valentines-day", "keepsake"],
      charge_tax: true,
      requires_shipping: true,
      country_of_origin: "CN",
      hs_code: "7117.19",
      seo_title: null,
      seo_description: null,
      best_for: "Valentine's Day, Mother's Day, and milestone moments.",
      badge: "Gift-ready",
      details: ["Embossed keepsake box", "Message card option", "Premium visual finish"],
      option_names: ["Gift option"],
      status: "active",
      position: 2,
    },
    images: [
      {
        product_id: "boxed-keepsake-rose",
        path: "/products/gold-rose-box.jpg",
        alt: "Gold dipped rose shown with a presentation box",
        position: 0,
      },
    ],
    variants: [
      {
        id: "0a2b1a10-4b7e-4d7a-9d24-000000000201",
        position: 0,
        option_values: ["Valentine card"],
        sku: "GR-BOX-002-1",
        barcode: "",
        price_cents: 6499,
        compare_at_price_cents: 10999,
        cost_cents: 1780,
        track_quantity: true,
        inventory_on_hand: 87,
        continue_selling_when_oos: false,
        weight_oz: 18,
      },
      {
        id: "0a2b1a10-4b7e-4d7a-9d24-000000000202",
        position: 1,
        option_values: ["Anniversary card"],
        sku: "GR-BOX-002-2",
        barcode: "",
        price_cents: 6499,
        compare_at_price_cents: 10999,
        cost_cents: 1780,
        track_quantity: true,
        inventory_on_hand: 87,
        continue_selling_when_oos: false,
        weight_oz: 18,
      },
      {
        id: "0a2b1a10-4b7e-4d7a-9d24-000000000203",
        position: 2,
        option_values: ["Mother's Day card"],
        sku: "GR-BOX-002-3",
        barcode: "",
        price_cents: 6499,
        compare_at_price_cents: 10999,
        cost_cents: 1780,
        track_quantity: true,
        inventory_on_hand: 86,
        continue_selling_when_oos: false,
        weight_oz: 18,
      },
    ],
  },
  {
    product: {
      id: "premium-gift-bundle",
      handle: "premium-gold-rose-gift-bundle",
      title: "GoldRose Premium Gift Bundle",
      short_name: "Premium Bundle",
      description:
        "A higher-value bundle focused on material detail, presentation, and a stronger reveal.",
      vendor: "GoldRose",
      product_type: "Gift Bundle",
      tags: ["bundle", "premium", "gift-ready", "high-aov"],
      charge_tax: true,
      requires_shipping: true,
      country_of_origin: "CN",
      hs_code: "7117.19",
      seo_title: null,
      seo_description: null,
      best_for: "Customers who want the most complete gift option.",
      badge: "Best value",
      details: ["Detail-focused finish", "Premium insert option", "Strongest gift presentation"],
      option_names: ["Gift option"],
      status: "active",
      position: 3,
    },
    images: [
      {
        product_id: "premium-gift-bundle",
        path: "/products/gold-rose-detail.jpg",
        alt: "Close-up detail graphic of a gold dipped rose",
        position: 0,
      },
    ],
    variants: [
      {
        id: "0a2b1a10-4b7e-4d7a-9d24-000000000301",
        position: 0,
        option_values: ["Gift message"],
        sku: "GR-BND-003-1",
        barcode: "",
        price_cents: 7999,
        compare_at_price_cents: 13999,
        cost_cents: 2360,
        track_quantity: true,
        inventory_on_hand: 47,
        continue_selling_when_oos: false,
        weight_oz: 24,
      },
      {
        id: "0a2b1a10-4b7e-4d7a-9d24-000000000302",
        position: 1,
        option_values: ["Premium insert"],
        sku: "GR-BND-003-2",
        barcode: "",
        price_cents: 7999,
        compare_at_price_cents: 13999,
        cost_cents: 2360,
        track_quantity: true,
        inventory_on_hand: 47,
        continue_selling_when_oos: false,
        weight_oz: 24,
      },
      {
        id: "0a2b1a10-4b7e-4d7a-9d24-000000000303",
        position: 2,
        option_values: ["Standard insert"],
        sku: "GR-BND-003-3",
        barcode: "",
        price_cents: 7999,
        compare_at_price_cents: 13999,
        cost_cents: 2360,
        track_quantity: true,
        inventory_on_hand: 46,
        continue_selling_when_oos: false,
        weight_oz: 24,
      },
    ],
  },
];

export type SettingsShape = {
  store: { name: string; contact_email: string; order_number_prefix: string };
  shipping_zones: Array<{
    id: string;
    name: string;
    /** ISO country codes; "*" = everywhere else (Rest of world). */
    countries: string[];
    rate_cents: number;
    free_over_cents: number | null;
    /** Marked true until the owner supplies real rates (OQ-2). */
    placeholder?: boolean;
  }>;
  tax: { rate_percent: number; note: string };
  checkout: { discount_field_enabled: boolean };
  low_stock_threshold: number;
  notifications: {
    order_confirmation: boolean;
    shipping_confirmation: boolean;
    new_order_alert: boolean;
  };
  search_engine: {
    home_title: string;
    home_description: string;
    social_image: string;
    allow_ai_crawlers: boolean;
  };
};

export const SEED_SETTINGS: SettingsShape = {
  store: {
    name: "GoldRose",
    contact_email: "support@goldrose.example",
    order_number_prefix: "#",
  },
  shipping_zones: [
    {
      id: "zone-us",
      name: "United States",
      countries: ["US"],
      rate_cents: 595,
      free_over_cents: 7500,
    },
    {
      id: "zone-row",
      name: "Rest of world",
      countries: ["*"],
      rate_cents: 1995,
      free_over_cents: null,
      placeholder: true,
    },
  ],
  tax: { rate_percent: 0, note: "0 while testing — real approach on the launch checklist" },
  checkout: { discount_field_enabled: true },
  low_stock_threshold: 50,
  notifications: {
    order_confirmation: true,
    shipping_confirmation: true,
    new_order_alert: true,
  },
  search_engine: {
    home_title: "GoldRose — 24K Gold Dipped Roses",
    home_description:
      "Real roses preserved in 24K gold. Timeless anniversary, Valentine's Day, and milestone gifts, shipped internationally.",
    social_image: "/products/gold-rose-stand.jpg",
    allow_ai_crawlers: true,
  },
};

/**
 * Build a full set of seed tables. `includeLocalAdmin` seeds the dev owner
 * login row — local backend only; on hosted Supabase the admin_users row must
 * reference a real auth.users uid (activation checklist).
 */
export function buildSeedTables(
  now: string,
  options: { includeLocalAdmin?: boolean } = {},
): { [T in keyof DbTables]: DbTables[T][] } {
  return {
    products: SEED_PRODUCTS.map(({ product }) => ({
      ...product,
      created_at: now,
      updated_at: now,
    })),
    product_images: SEED_PRODUCTS.flatMap(({ images }, index) =>
      images.map((image, imageIndex) => ({
        ...image,
        id: `0a2b1a10-4b7e-4d7a-9d24-0000000009${index}${imageIndex}`,
      })),
    ),
    product_variants: SEED_PRODUCTS.flatMap(({ product, variants }) =>
      variants.map((variant) => ({ ...variant, product_id: product.id })),
    ),
    inventory_movements: [],
    customers: [],
    customer_events: [],
    orders: [],
    order_lines: [],
    order_events: [],
    checkouts: [],
    discounts: [],
    page_views: [],
    site_content: [
      {
        key: "promo.slogan",
        value: { text: DEFAULT_PROMO_SLOGAN },
        default_value: { text: DEFAULT_PROMO_SLOGAN },
        label: "Top banner slogan",
        help: "✦ symbols may look slightly different from the original design once edited",
        updated_at: now,
      },
    ],
    settings: Object.entries(SEED_SETTINGS).map(([key, value]) => ({ key, value })),
    admin_users: options.includeLocalAdmin ? [{ ...LOCAL_OWNER }] : [],
  };
}
