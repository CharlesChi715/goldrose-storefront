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

import type {
  DbTables,
  ProductRow,
  ProductVariantRow,
  ProductImageRow,
} from "./types.ts";

export const DEFAULT_PROMO_SLOGAN =
  "✦ TIMELESS CRAFT · LOVE THAT NEVER FADES · 24K GOLD · FOREVER TREASURED ✦";

/** The local dev owner account (hosted mode uses a real auth.users uid instead). */
export const LOCAL_OWNER = {
  user_id: "00000000-0000-4000-8000-000000000001",
  email: "owner@goldrose.local",
};

type SeedProduct = {
  product: Omit<ProductRow, "created_at" | "updated_at">;
  /**
   * Framing is left off the seed rows: seed photos are placeholders nobody
   * has framed, and the defaults filled in at insert (unframed, centre, no
   * zoom) are exactly what the Media card should keep asking about.
   */
  images: Omit<
    ProductImageRow,
    | "id"
    | "focal_zoom"
    | "card_focal_x"
    | "card_focal_y"
    | "card_zoom"
    | "framed"
  >[];
  variants: Array<
    Omit<ProductVariantRow, "product_id"> & { product_id?: never }
  >;
};

const SEED_PRODUCTS: SeedProduct[] = [
  {
    product: {
      id: "signature-gold-rose",
      handle: "signature-24k-gold-rose",
      title: "ELDREVE Signature 24K Gold Rose",
      short_name: "Signature Rose",
      description:
        "A genuine rose preserved with a luminous 24K gold dipped finish and clear display stand.",
      vendor: "ELDREVE",
      product_type: "Gold Dipped Rose",
      tags: ["signature", "anniversary", "valentines-day", "gift-ready"],
      charge_tax: true,
      requires_shipping: true,
      country_of_origin: "CN",
      hs_code: "7117.19",
      seo_title: null,
      seo_description: null,
      // Shop filter facets (lib/catalog/facets.ts). Placeholder merchandising
      // like the rest of the seed copy (OQ-3), but spread across the three
      // groups on purpose so the drawer has something to narrow.
      best_for: ["classic", "anniversary", "birthday", "wife", "girlfriend"],
      badge: "Save 44%",
      details: [
        "Real rose base",
        "Clear display stand",
        "Gift-ready presentation",
      ],
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
        focal_x: 50,
        focal_y: 50,
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
      title: "ELDREVE Boxed Keepsake Rose",
      short_name: "Boxed Keepsake",
      description:
        "The rose plus presentation packaging for a more finished gift moment.",
      vendor: "ELDREVE",
      product_type: "Gold Dipped Rose",
      tags: ["boxed", "mothers-day", "valentines-day", "keepsake"],
      charge_tax: true,
      requires_shipping: true,
      country_of_origin: "CN",
      hs_code: "7117.19",
      seo_title: null,
      seo_description: null,
      best_for: ["jewel", "valentines", "wedding", "mother", "girlfriend"],
      badge: "Gift-ready",
      details: [
        "Embossed keepsake box",
        "Message card option",
        "Premium visual finish",
      ],
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
        focal_x: 50,
        focal_y: 50,
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
      title: "ELDREVE Premium Gift Bundle",
      short_name: "Premium Bundle",
      description:
        "A higher-value bundle focused on material detail, presentation, and a stronger reveal.",
      vendor: "ELDREVE",
      product_type: "Gift Bundle",
      tags: ["bundle", "premium", "gift-ready", "high-aov"],
      charge_tax: true,
      requires_shipping: true,
      country_of_origin: "CN",
      hs_code: "7117.19",
      seo_title: null,
      seo_description: null,
      best_for: ["sparkle", "anniversary", "wedding", "wife", "friends"],
      badge: "Best value",
      details: [
        "Detail-focused finish",
        "Premium insert option",
        "Strongest gift presentation",
      ],
      option_names: ["Gift option"],
      status: "active",
      position: 3,
    },
    // Three photos, not one: a real product carries several (the live
    // catalog's rose has five), and the PDP hero only auto-plays and swipes
    // when there is more than one — the other two seed products stay
    // single-photo so both paths have a fixture.
    images: [
      {
        product_id: "premium-gift-bundle",
        path: "/products/gold-rose-detail.jpg",
        alt: "Close-up detail graphic of a gold dipped rose",
        position: 0,
        focal_x: 50,
        focal_y: 50,
      },
      {
        product_id: "premium-gift-bundle",
        path: "/products/gold-rose-box.jpg",
        alt: "The bundle's gift box, closed",
        position: 1,
        focal_x: 50,
        focal_y: 50,
      },
      {
        product_id: "premium-gift-bundle",
        path: "/products/gold-rose-stand.jpg",
        alt: "Gold dipped rose displayed beside a brown gift box",
        position: 2,
        focal_x: 50,
        focal_y: 50,
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
  store: {
    name: string;
    /** Registered entity behind the brand — the seller of record. Blank until the owner supplies it. */
    legal_name: string;
    /** Company/business registration number as issued. Blank until supplied. */
    registration_number: string;
    /** Registered postal address, one line per entry; last line carries the country. */
    address_lines: string[];
    contact_email: string;
    order_number_prefix: string;
  };
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
    name: "ELDREVE",
    // The entity named as Company Name on the TikTok Business API
    // application against eldreve.com (2026-08-06). It is published in the
    // site footer and on /policies/contact-legal so a platform reviewer can
    // match the application to the website — the exact check TikTok failed.
    legal_name: "Zhongshu Technology Worldwide Limited",
    // AI-TAG(AI-033): OWNER-DECISION — still needed: the registration number
    // and the registered postal address (US CAN-SPAM requires the address in
    // order emails). Blank ships safely — both stay hidden until supplied. See
    // /agent-delivery/sessions/company-legal-info-08-06-worktree-feat-company-legal-info.md.
    registration_number: "",
    address_lines: [],
    contact_email: "support@eldreve.com",
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
      // AI-TAG(AI-001): OWNER-DECISION — confirm the real rate. See /agent-delivery/sessions/initial-inbox-07-30.md.
      rate_cents: 1995,
      free_over_cents: null,
      placeholder: true,
    },
  ],
  tax: {
    rate_percent: 0,
    note: "0 while testing — real approach on the launch checklist",
  },
  checkout: { discount_field_enabled: true },
  low_stock_threshold: 50,
  notifications: {
    order_confirmation: true,
    shipping_confirmation: true,
    new_order_alert: true,
  },
  search_engine: {
    // AI-TAG(AI-035): OWNER-TODO — the HOSTED row still says "GoldRose"; seeds
    // only fill missing keys, so this value never reaches production. See
    // /agent-delivery/sessions/company-legal-info-08-06-worktree-feat-company-legal-info.md.
    home_title: "ELDREVE — 24K Gold Dipped Roses",
    home_description:
      "Real roses preserved in 24K gold. Timeless anniversary, Valentine's Day, and milestone gifts, shipped internationally.",
    social_image: "/products/gold-rose-stand.jpg",
    allow_ai_crawlers: true,
  },
};

/* ----------------------------------------------------------------------------
 * DEMO DATA (testing phase, owner request 2026-07-23): sample orders in every
 * state, customers, a discount, an abandoned checkout, and visitor sessions —
 * so the admin demonstrates end to end on a fresh seed (e.g. the live site
 * before Supabase activation). Order numbers 901–905 sit BELOW the real
 * sequence (#1001+), so demo rows can never collide with real orders. Hosted
 * activation seeds WITHOUT demo data.
 * ------------------------------------------------------------------------- */

const V_SIG = "0a2b1a10-4b7e-4d7a-9d24-000000000101"; // Signature / Gift box
const V_BOX = "0a2b1a10-4b7e-4d7a-9d24-000000000201"; // Boxed / Valentine card
const V_BND = "0a2b1a10-4b7e-4d7a-9d24-000000000301"; // Bundle / Gift message

// uuid columns accept hex only (0-9a-f) — Postgres rejects the mnemonic tail
// letters k/o/p/v (the local file adapter never validated, which is how
// "do01" reached the live db as an insert error on 2026-07-22). Each non-hex
// letter gets a fixed digit; the digit slots can't collide with the letter
// tails (k01→d101 vs c01→dc01).
const DEMO_TAIL_HEX: Record<string, string> = {
  k: "1",
  l: "2",
  o: "0",
  p: "9",
  v: "5",
};

/**
 * Build a deterministic uuid for a demo row from a 3-character mnemonic tail
 * (e.g. "o01" = order 1), mapping non-hex letters via DEMO_TAIL_HEX above.
 * Throws if the mapped tail still isn't valid hex.
 *
 * @param tail - Three-character mnemonic, lowercase letters/digits.
 * @returns A Postgres-safe uuid ending in "d" + the hex tail.
 */
function demoId(tail: string): string {
  const hexTail = tail.replace(/[a-z]/g, (ch) => DEMO_TAIL_HEX[ch] ?? ch);
  if (!/^[0-9a-f]{3}$/.test(hexTail)) {
    throw new Error(`demoId tail is not uuid-safe: "${tail}"`);
  }
  return `0a2b1a10-4b7e-4d7a-9d24-00000000d${hexTail}`;
}

/**
 * Build the demo dataset described above: three customers, orders #901–#905
 * covering every state (fulfilled/unfulfilled/refunded/cancelled/draft) with
 * their lines and events, checkouts, a discount, page views, feedback, and
 * the bilingual forum welcome threads. Pure — returns rows, writes nothing.
 *
 * @param now - ISO timestamp all relative "hours ago" times are computed from.
 * @returns The demo rows keyed by table name (demo tables only).
 */
function buildDemoRows(
  now: string,
): Pick<
  { [T in keyof DbTables]: DbTables[T][] },
  | "customers"
  | "customer_events"
  | "orders"
  | "order_lines"
  | "order_events"
  | "checkouts"
  | "discounts"
  | "page_views"
  | "feedback"
  | "forum_threads"
  | "forum_posts"
> {
  const ago = (hours: number) =>
    new Date(new Date(now).getTime() - hours * 60 * 60 * 1000).toISOString();

  const emily = {
    id: demoId("c01"),
    email: "emily.chen@example.com",
    first_name: "Emily",
    last_name: "Chen",
    phone: "+1 212 555 0117",
    default_address: {
      name: "Emily Chen",
      address1: "150 W 25th St",
      city: "New York",
      state: "NY",
      postal_code: "10001",
      country: "US",
    },
    note: "Repeat gift buyer — prefers discreet packaging.",
    tags: ["vip"],
    created_at: ago(24 * 6),
  };
  const james = {
    id: demoId("c02"),
    email: "james.wilson@example.com",
    first_name: "James",
    last_name: "Wilson",
    phone: null,
    default_address: {
      name: "James Wilson",
      address1: "22 Portobello Road",
      city: "London",
      state: "",
      postal_code: "W11 3DH",
      country: "GB",
    },
    note: "",
    tags: [],
    created_at: ago(24 * 3),
  };
  const mia = {
    id: demoId("c03"),
    email: "mia.tanaka@example.com",
    first_name: "Mia",
    last_name: "Tanaka",
    phone: null,
    default_address: {
      name: "Mia Tanaka",
      address1: "2-11-3 Meguro",
      city: "Tokyo",
      state: "",
      postal_code: "153-0063",
      country: "JP",
    },
    note: "",
    tags: [],
    created_at: ago(24 * 2),
  };

  type OrderSeed = DbTables["orders"];
  const orders: OrderSeed[] = [
    {
      // Fulfilled, discount applied, free US shipping.
      id: demoId("o01"),
      number: 901,
      name: "#901",
      source: "mock",
      customer_id: emily.id,
      payment_provider: "mock",
      provider_order_id: null,
      provider_capture_id: null,
      email: emily.email,
      phone: emily.phone,
      shipping_address: emily.default_address,
      billing_address: emily.default_address,
      subtotal_cents: 11498, // Signature 49.99 + Boxed 64.99
      discount_code: "GOLD10",
      discount_cents: 1150,
      shipping_cents: 0,
      shipping_free: true,
      tax_cents: 0,
      total_cents: 10348,
      currency: "USD",
      financial_status: "paid",
      refunded_cents: 0,
      fulfillment_status: "fulfilled",
      // Legacy shape: fulfilled before 0003 (URL only, no carrier) — must render.
      tracking_carrier: null,
      tracking_number: "DEMO-1Z999AA10123456784",
      tracking_url: "https://example.com/track/DEMO-1Z999AA10123456784",
      shipped_at: ago(24 * 5),
      cancelled_at: null,
      cancel_reason: null,
      visitor_id: "demo-visitor-emily",
      note: "Anniversary gift — please include a blank card.",
      tags: ["demo"],
      archived_at: null,
      placed_at: ago(24 * 6),
      raw: null,
    },
    {
      // Paid, awaiting fulfillment, international (Rest of world rate).
      id: demoId("o02"),
      number: 902,
      name: "#902",
      source: "mock",
      customer_id: james.id,
      payment_provider: "mock",
      provider_order_id: null,
      provider_capture_id: null,
      email: james.email,
      phone: null,
      shipping_address: james.default_address,
      billing_address: james.default_address,
      subtotal_cents: 7999,
      discount_code: null,
      discount_cents: 0,
      shipping_cents: 1995,
      shipping_free: false,
      tax_cents: 0,
      total_cents: 9994,
      currency: "USD",
      financial_status: "paid",
      refunded_cents: 0,
      fulfillment_status: "unfulfilled",
      tracking_carrier: null,
      tracking_number: null,
      tracking_url: null,
      shipped_at: null,
      cancelled_at: null,
      cancel_reason: null,
      visitor_id: "demo-visitor-james",
      note: "Gift wrap please — it's our anniversary!",
      tags: ["demo"],
      archived_at: null,
      placed_at: ago(24 * 3),
      raw: null,
    },
    {
      // Fulfilled, then partially refunded.
      id: demoId("o03"),
      number: 903,
      name: "#903",
      source: "mock",
      customer_id: mia.id,
      payment_provider: "mock",
      provider_order_id: null,
      provider_capture_id: null,
      email: mia.email,
      phone: null,
      shipping_address: mia.default_address,
      billing_address: mia.default_address,
      subtotal_cents: 12998, // Boxed ×2
      discount_code: null,
      discount_cents: 0,
      shipping_cents: 1995,
      shipping_free: false,
      tax_cents: 0,
      total_cents: 14993,
      currency: "USD",
      financial_status: "partially_refunded",
      refunded_cents: 2000,
      fulfillment_status: "fulfilled",
      tracking_carrier: "usps",
      tracking_number: "DEMO-RR123456785JP",
      tracking_url: null,
      shipped_at: ago(24),
      cancelled_at: null,
      cancel_reason: null,
      visitor_id: null,
      note: "",
      tags: ["demo"],
      archived_at: null,
      placed_at: ago(24 * 2),
      raw: null,
    },
    {
      // Cancelled + fully refunded.
      id: demoId("o04"),
      number: 904,
      name: "#904",
      source: "mock",
      customer_id: emily.id,
      payment_provider: "mock",
      provider_order_id: null,
      provider_capture_id: null,
      email: emily.email,
      phone: emily.phone,
      shipping_address: emily.default_address,
      billing_address: emily.default_address,
      subtotal_cents: 4999,
      discount_code: null,
      discount_cents: 0,
      shipping_cents: 595,
      shipping_free: false,
      tax_cents: 0,
      total_cents: 5594,
      currency: "USD",
      financial_status: "refunded",
      refunded_cents: 5594,
      fulfillment_status: "unfulfilled",
      tracking_carrier: null,
      tracking_number: null,
      tracking_url: null,
      shipped_at: null,
      cancelled_at: ago(20),
      cancel_reason: "Customer changed their mind",
      visitor_id: "demo-visitor-emily",
      note: "",
      tags: ["demo"],
      archived_at: null,
      placed_at: ago(22),
      raw: null,
    },
    {
      // Pending draft (shows under Orders → Drafts, "Mark as paid" works).
      id: demoId("o05"),
      number: 905,
      name: "#905",
      source: "draft",
      customer_id: james.id,
      payment_provider: "mock",
      provider_order_id: null,
      provider_capture_id: null,
      email: james.email,
      phone: null,
      shipping_address: null,
      billing_address: null,
      subtotal_cents: 7999,
      discount_code: null,
      discount_cents: 0,
      shipping_cents: 0,
      shipping_free: false,
      tax_cents: 0,
      total_cents: 7999,
      currency: "USD",
      financial_status: "pending",
      refunded_cents: 0,
      fulfillment_status: "unfulfilled",
      tracking_carrier: null,
      tracking_number: null,
      tracking_url: null,
      shipped_at: null,
      cancelled_at: null,
      cancel_reason: null,
      visitor_id: null,
      note: "Phone order — awaiting bank transfer.",
      tags: ["demo"],
      archived_at: null,
      placed_at: ago(4),
      raw: null,
    },
  ];

  const line = (
    tail: string,
    orderId: string,
    variantId: string,
    productId: string,
    sku: string,
    name: string,
    option: string,
    quantity: number,
    unit: number,
  ): DbTables["order_lines"] => ({
    id: demoId(tail),
    order_id: orderId,
    variant_id: variantId,
    product_id: productId,
    sku,
    name,
    option,
    quantity,
    unit_amount_cents: unit,
    line_total_cents: unit * quantity,
  });

  const event = (
    tail: string,
    orderId: string,
    kind: "system" | "comment",
    message: string,
    createdAt: string,
    createdBy: string | null = null,
  ): DbTables["order_events"] => ({
    id: demoId(tail),
    order_id: orderId,
    kind,
    message,
    created_by: createdBy,
    created_at: createdAt,
  });

  const view = (
    tail: string,
    visitorId: string,
    sessionId: string,
    path: string,
    createdAt: string,
    referrer: string | null,
    utm: Record<string, string> | null,
    country: string,
    // Engagement (engagement-tracking.md). Omitted on the two "right now"
    // rows below, so the demo store also shows what an in-flight visit looks
    // like: null active_ms means the closing beacon has not landed yet.
    engagement?: {
      activeMs: number;
      scrollPct: number;
      sections?: Record<string, number>;
    },
  ): DbTables["page_views"] => ({
    id: demoId(tail),
    visitor_id: visitorId,
    session_id: sessionId,
    path,
    referrer,
    utm,
    country,
    created_at: createdAt,
    active_ms: engagement?.activeMs ?? null,
    scroll_pct: engagement?.scrollPct ?? null,
    sections: engagement?.sections ?? null,
    last_section: engagement?.sections
      ? Object.keys(engagement.sections)[
          Object.keys(engagement.sections).length - 1
        ]
      : null,
  });

  return {
    customers: [emily, james, mia],
    customer_events: [
      {
        id: demoId("e01"),
        customer_id: emily.id,
        kind: "system",
        message: "Customer created",
        created_by: null,
        created_at: ago(24 * 6),
      },
      {
        id: demoId("e02"),
        customer_id: emily.id,
        kind: "system",
        message: "Placed order #901",
        created_by: null,
        created_at: ago(24 * 6),
      },
      {
        id: demoId("e03"),
        customer_id: emily.id,
        kind: "system",
        message: "Placed order #904",
        created_by: null,
        created_at: ago(22),
      },
      {
        id: demoId("e04"),
        customer_id: emily.id,
        kind: "comment",
        message: "Asked about engraving options for next order.",
        created_by: LOCAL_OWNER.email,
        created_at: ago(24 * 4),
      },
      {
        id: demoId("e05"),
        customer_id: james.id,
        kind: "system",
        message: "Customer created",
        created_by: null,
        created_at: ago(24 * 3),
      },
      {
        id: demoId("e06"),
        customer_id: james.id,
        kind: "system",
        message: "Placed order #902",
        created_by: null,
        created_at: ago(24 * 3),
      },
      {
        id: demoId("e07"),
        customer_id: mia.id,
        kind: "system",
        message: "Customer created",
        created_by: null,
        created_at: ago(24 * 2),
      },
      {
        id: demoId("e08"),
        customer_id: mia.id,
        kind: "system",
        message: "Placed order #903",
        created_by: null,
        created_at: ago(24 * 2),
      },
    ],
    orders,
    order_lines: [
      line(
        "l01",
        demoId("o01"),
        V_SIG,
        "signature-gold-rose",
        "GR-SIG-001-1",
        "ELDREVE Signature 24K Gold Rose",
        "Gift box included",
        1,
        4999,
      ),
      line(
        "l02",
        demoId("o01"),
        V_BOX,
        "boxed-keepsake-rose",
        "GR-BOX-002-1",
        "ELDREVE Boxed Keepsake Rose",
        "Valentine card",
        1,
        6499,
      ),
      line(
        "l03",
        demoId("o02"),
        V_BND,
        "premium-gift-bundle",
        "GR-BND-003-1",
        "ELDREVE Premium Gift Bundle",
        "Gift message",
        1,
        7999,
      ),
      line(
        "l04",
        demoId("o03"),
        V_BOX,
        "boxed-keepsake-rose",
        "GR-BOX-002-1",
        "ELDREVE Boxed Keepsake Rose",
        "Valentine card",
        2,
        6499,
      ),
      line(
        "l05",
        demoId("o04"),
        V_SIG,
        "signature-gold-rose",
        "GR-SIG-001-1",
        "ELDREVE Signature 24K Gold Rose",
        "Gift box included",
        1,
        4999,
      ),
      line(
        "l06",
        demoId("o05"),
        V_BND,
        "premium-gift-bundle",
        "GR-BND-003-1",
        "ELDREVE Premium Gift Bundle",
        "Gift message",
        1,
        7999,
      ),
    ],
    order_events: [
      event("v01", demoId("o01"), "system", "Order placed (mock)", ago(24 * 6)),
      event(
        "v02",
        demoId("o01"),
        "system",
        "Payment of $103.48 captured via mock",
        ago(24 * 6),
      ),
      event(
        "v03",
        demoId("o01"),
        "system",
        "Order fulfilled — tracking DEMO-1Z999AA10123456784",
        ago(24 * 5),
      ),
      event(
        "v04",
        demoId("o01"),
        "comment",
        "Included a handwritten thank-you note.",
        ago(24 * 5),
        LOCAL_OWNER.email,
      ),
      event("v05", demoId("o02"), "system", "Order placed (mock)", ago(24 * 3)),
      event(
        "v06",
        demoId("o02"),
        "system",
        "Payment of $99.94 captured via mock",
        ago(24 * 3),
      ),
      event("v07", demoId("o03"), "system", "Order placed (mock)", ago(24 * 2)),
      event(
        "v08",
        demoId("o03"),
        "system",
        "Payment of $149.93 captured via mock",
        ago(24 * 2),
      ),
      event(
        "v09",
        demoId("o03"),
        "system",
        "Order fulfilled — tracking DEMO-RR123456785JP",
        ago(24),
      ),
      event(
        "v10",
        demoId("o03"),
        "system",
        "Refunded $20.00",
        ago(12),
        LOCAL_OWNER.email,
      ),
      event("v11", demoId("o04"), "system", "Order placed (mock)", ago(22)),
      event(
        "v12",
        demoId("o04"),
        "system",
        "Payment of $55.94 captured via mock",
        ago(22),
      ),
      event(
        "v13",
        demoId("o04"),
        "system",
        "Order cancelled — Customer changed their mind, payment refunded, items restocked",
        ago(20),
        LOCAL_OWNER.email,
      ),
      event("v14", demoId("o05"), "system", "Order placed (draft)", ago(4)),
    ],
    checkouts: [
      {
        // Abandoned: open and 2 h old → shows on Orders → Abandoned checkouts.
        id: demoId("k01"),
        cart: { lines: [{ variant_id: V_SIG, quantity: 1 }], country: "US" },
        email: "sophie.brown@example.com",
        discount_code: null,
        subtotal_cents: 4999,
        total_cents: 5594,
        provider_order_id: null,
        status: "open",
        created_at: ago(2),
        completed_at: null,
      },
      {
        id: demoId("k02"),
        cart: {
          lines: [{ variant_id: V_BND, quantity: 1 }],
          country: "GB",
          visitor_id: "demo-visitor-james",
        },
        email: james.email,
        discount_code: null,
        subtotal_cents: 7999,
        total_cents: 9994,
        provider_order_id: null,
        status: "completed",
        created_at: ago(24 * 3),
        completed_at: ago(24 * 3),
      },
    ],
    // Testing-phase forum announcements (owner request 2026-07-22): pinned-by
    // -recency welcome threads so testers know how the forum works.
    forum_threads: [
      {
        id: demoId("a01"),
        title:
          "📢 Welcome to the ELDREVE testing forum · 欢迎来到 ELDREVE 测试论坛",
        nickname: "ELDREVE Team",
        created_at: ago(48),
      },
      {
        id: demoId("a02"),
        title: "📢 What to test — and what to expect · 测试内容与注意事项",
        nickname: "ELDREVE Team",
        created_at: ago(47),
      },
    ],
    forum_posts: [
      {
        id: demoId("b01"),
        thread_id: demoId("a01"),
        nickname: "ELDREVE Team",
        body: [
          "Welcome! This forum is for everyone helping test the ELDREVE store.",
          "",
          "How it works:",
          "• Sign up from the login page (Request access) with a nickname, email, and password — the owner approves new accounts.",
          "• Your nickname is bound to your account and is automatically your name here.",
          "• Start a discussion for anything: bugs, questions, ideas, opinions. Everyone can read and reply.",
          "",
          "欢迎！这里是 ELDREVE 测试论坛，供所有参与测试的伙伴使用。",
          "",
          "使用方法：",
          "• 在登录页点击「申请访问」，用昵称、邮箱和密码注册——新账号由店主批准。",
          "• 昵称与账号绑定，自动作为你在论坛上的名字。",
          "• 任何话题都可以发起讨论：Bug、疑问、想法、意见。所有人都能阅读和回复。",
        ].join("\n"),
        created_at: ago(48),
        edited_at: null,
      },
      {
        id: demoId("b02"),
        thread_id: demoId("a02"),
        nickname: "ELDREVE Team",
        body: [
          "A few things to know while we test:",
          "",
          "• The whole admin is open — click around, nothing here is real money.",
          "• Try the storefront too (home, shop, product pages, checkout). Payments are simulated; no card is ever charged.",
          "• On the live site, data (including forum posts) occasionally resets until the real database is activated — don't be surprised if something disappears.",
          "• Found a bug or have an idea? Post it here, or use the chat bubble on the storefront.",
          "",
          "测试须知：",
          "",
          "• 后台完全开放——随便点，这里不涉及真实资金。",
          "• 也请试试店面（首页、商店、产品页、结账）。付款是模拟的，绝不会真实扣款。",
          "• 正式数据库启用前，线上数据（包括论坛帖子）可能会不定期重置——内容消失属正常现象。",
          "• 发现 Bug 或有想法？在这里发帖，或使用店面的聊天气泡反馈。",
        ].join("\n"),
        created_at: ago(47),
        edited_at: null,
      },
    ],
    feedback: [
      {
        id: demoId("f01"),
        name: "Sophie",
        email: "sophie.brown@example.com",
        message: "Would love an option to add a handwritten card in Chinese!",
        path: "/products/signature-24k-gold-rose",
        created_at: ago(30),
      },
    ],
    discounts: [
      {
        id: demoId("d01"),
        code: "GOLD10",
        type: "percentage",
        value: 10,
        applies_to: null,
        min_purchase_cents: null,
        usage_limit: null,
        once_per_customer: false,
        used_count: 1,
        starts_at: ago(24 * 30),
        ends_at: null,
        created_at: ago(24 * 30),
      },
    ],
    page_views: [
      // Section names are the ones actually tagged in components/home today;
      // untagged bands are simply not measured.
      view(
        "p01",
        "demo-visitor-emily",
        "demo-session-e1",
        "/",
        ago(24 * 6 + 1),
        "https://www.google.com/",
        null,
        "US",
        {
          activeMs: 64_000,
          scrollPct: 82,
          sections: {
            "HOME-HERO-SECTION": 21_000,
            "HOME-FEATURED-SECTION": 26_000,
            "HOME-PROMISE-SECTION": 9_000,
          },
        },
      ),
      view(
        "p02",
        "demo-visitor-emily",
        "demo-session-e1",
        "/shop",
        ago(24 * 6 + 0.9),
        "https://www.google.com/",
        null,
        "US",
        { activeMs: 41_000, scrollPct: 55 },
      ),
      view(
        "p03",
        "demo-visitor-emily",
        "demo-session-e1",
        "/products/signature-24k-gold-rose",
        ago(24 * 6 + 0.8),
        null,
        null,
        "US",
        { activeMs: 96_000, scrollPct: 91 },
      ),
      view(
        "p04",
        "demo-visitor-emily",
        "demo-session-e1",
        "/checkout",
        ago(24 * 6 + 0.5),
        null,
        null,
        "US",
        { activeMs: 148_000, scrollPct: 100 },
      ),
      view(
        "p05",
        "demo-visitor-james",
        "demo-session-j1",
        "/shop",
        ago(24 * 3 + 1),
        null,
        {
          utm_source: "instagram",
          utm_campaign: "gifts",
          utm_acc: "rose_daily",
        },
        "GB",
        { activeMs: 18_000, scrollPct: 34 },
      ),
      view(
        "p06",
        "demo-visitor-james",
        "demo-session-j1",
        "/products/premium-gold-rose-gift-bundle",
        ago(24 * 3 + 0.8),
        null,
        {
          utm_source: "instagram",
          utm_campaign: "gifts",
          utm_acc: "rose_daily",
        },
        "GB",
        { activeMs: 73_000, scrollPct: 78 },
      ),
      view(
        "p07",
        "demo-visitor-james",
        "demo-session-j1",
        "/checkout",
        ago(24 * 3 + 0.4),
        null,
        null,
        "GB",
        { activeMs: 52_000, scrollPct: 88 },
      ),
      // A visit still in progress: engagement lands only when it ends.
      view(
        "p08",
        "demo-visitor-window",
        "demo-session-w1",
        "/",
        ago(5),
        null,
        null,
        "AU",
      ),
      view(
        "p09",
        "demo-visitor-window",
        "demo-session-w1",
        "/shop",
        ago(4.9),
        null,
        null,
        "AU",
      ),
    ],
  };
}

/**
 * Build a full set of seed tables: the three placeholder products with their
 * images and variants, default settings, the site-content slots, and
 * (optionally) the demo store. Pure — scripts/seed.ts and the local
 * adapter's first-run auto-seed do the actual writing.
 *
 * @param now - ISO timestamp stamped on created_at/updated_at columns.
 * @param options - `includeLocalAdmin` seeds the dev owner login row — local
 *   backend only; on hosted Supabase the admin_users row must reference a
 *   real auth.users uid (activation checklist). `includeDemo` (default true)
 *   adds the sample store above — hosted activation passes false so the real
 *   store starts clean.
 * @returns Every table's seed rows, keyed by table name.
 */
export function buildSeedTables(
  now: string,
  options: { includeLocalAdmin?: boolean; includeDemo?: boolean } = {},
): { [T in keyof DbTables]: DbTables[T][] } {
  const demo =
    (options.includeDemo ?? true)
      ? buildDemoRows(now)
      : {
          customers: [],
          customer_events: [],
          orders: [],
          order_lines: [],
          order_events: [],
          checkouts: [],
          discounts: [],
          page_views: [],
          feedback: [],
        };
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
        // The 0009 column defaults, written out because the local store is a
        // JSON file with no schema to supply them.
        focal_zoom: 100,
        card_focal_x: null,
        card_focal_y: null,
        card_zoom: null,
        framed: false,
      })),
    ),
    product_variants: SEED_PRODUCTS.flatMap(({ product, variants }) =>
      variants.map((variant) => ({ ...variant, product_id: product.id })),
    ),
    inventory_movements: [],
    forum_threads: [],
    forum_posts: [],
    // Reviews start empty everywhere: the PDP falls back to the design's
    // mock rows until real published reviews exist (pre-launch rule).
    product_reviews: [],
    ...demo,
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
    settings: Object.entries(SEED_SETTINGS).map(([key, value]) => ({
      key,
      value,
    })),
    admin_users: options.includeLocalAdmin ? [{ ...LOCAL_OWNER }] : [],
  };
}
