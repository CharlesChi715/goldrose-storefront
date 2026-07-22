/**
 * ROLE OF THIS FILE
 * TypeScript row types for every table in supabase/migrations/0001_init.sql,
 * plus the shapes of the two read models the storefront uses (catalog +
 * inventory levels). Column names are snake_case, exactly as PostgREST
 * returns them, so the hosted-Supabase and local-file backends are
 * interchangeable row for row.
 *
 * NOTE: relative imports inside lib/supabase (and scripts/) carry an explicit
 * `.ts` extension so `node scripts/seed.ts` (Node type stripping) and the
 * Next bundler resolve the same files. All money is integer cents.
 */

export type ProductStatus = "active" | "draft" | "archived";

export type ProductRow = {
  id: string;
  handle: string;
  title: string;
  short_name: string;
  description: string;
  vendor: string;
  product_type: string;
  tags: string[];
  charge_tax: boolean;
  requires_shipping: boolean;
  country_of_origin: string | null;
  hs_code: string | null;
  seo_title: string | null;
  seo_description: string | null;
  best_for: string;
  badge: string;
  details: string[];
  option_names: string[];
  status: ProductStatus;
  position: number;
  created_at: string;
  updated_at: string;
};

export type ProductImageRow = {
  id: string;
  product_id: string;
  /** "/products/x.jpg" (public asset) or a Storage object key. */
  path: string;
  alt: string;
  position: number;
};

export type ProductVariantRow = {
  id: string;
  product_id: string;
  position: number;
  option_values: string[];
  sku: string;
  barcode: string;
  price_cents: number;
  compare_at_price_cents: number | null;
  /** PRIVATE — never exposed to the storefront (§7.2). */
  cost_cents: number | null;
  track_quantity: boolean;
  inventory_on_hand: number;
  continue_selling_when_oos: boolean;
  weight_oz: number | null;
};

export const INVENTORY_REASONS = [
  "correction",
  "count",
  "received",
  "return_restock",
  "damaged",
  "theft_or_loss",
  "promotion_or_donation",
  "order",
] as const;

export type InventoryReason = (typeof INVENTORY_REASONS)[number];

export type InventoryMovementRow = {
  id: string;
  variant_id: string;
  delta: number;
  reason: InventoryReason;
  note: string | null;
  created_by: string | null;
  created_at: string;
};

export type Address = {
  name?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string; // ISO-3166 alpha-2
};

export type OrderSource = "mock" | "site" | "draft";
export type FinancialStatus = "pending" | "paid" | "partially_refunded" | "refunded";
export type FulfillmentStatus = "unfulfilled" | "fulfilled";

export type OrderRow = {
  id: string;
  number: number;
  name: string;
  source: OrderSource;
  customer_id: string | null;
  payment_provider: string;
  provider_order_id: string | null;
  provider_capture_id: string | null;
  email: string | null;
  phone: string | null;
  shipping_address: Address | null;
  billing_address: Address | null;
  subtotal_cents: number;
  discount_code: string | null;
  discount_cents: number;
  shipping_cents: number;
  shipping_free: boolean;
  tax_cents: number;
  total_cents: number;
  currency: string;
  financial_status: FinancialStatus;
  refunded_cents: number;
  fulfillment_status: FulfillmentStatus;
  tracking_number: string | null;
  tracking_url: string | null;
  shipped_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  visitor_id: string | null;
  note: string;
  tags: string[];
  archived_at: string | null;
  placed_at: string;
  raw: unknown;
};

export type OrderLineRow = {
  id: string;
  order_id: string;
  variant_id: string | null;
  product_id: string | null;
  sku: string;
  name: string;
  option: string;
  quantity: number;
  unit_amount_cents: number;
  line_total_cents: number;
};

export type EventKind = "system" | "comment";

export type OrderEventRow = {
  id: string;
  order_id: string;
  kind: EventKind;
  message: string;
  created_by: string | null;
  created_at: string;
};

export type CustomerEventRow = {
  id: string;
  customer_id: string;
  kind: EventKind;
  message: string;
  created_by: string | null;
  created_at: string;
};

export type CheckoutCartLine = {
  variant_id: string;
  quantity: number;
};

export type CheckoutRow = {
  id: string;
  cart: {
    lines: CheckoutCartLine[];
    note?: string;
    country?: string;
    visitor_id?: string;
  };
  email: string | null;
  discount_code: string | null;
  subtotal_cents: number;
  total_cents: number;
  provider_order_id: string | null;
  status: "open" | "completed";
  created_at: string;
  completed_at: string | null;
};

export type CustomerRow = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  default_address: Address | null;
  note: string;
  tags: string[];
  created_at: string;
  /** Supabase Auth user this customer signed in as (Google/Apple/passkey
   * accounts, owner request 2026-07-23). Optional: rows written before the
   * column existed — and checkout-only customers — simply have none. */
  auth_user_id?: string | null;
};

export type DiscountType = "percentage" | "fixed_amount" | "free_shipping";

export type DiscountRow = {
  id: string;
  code: string;
  type: DiscountType;
  /** percent (0-100) for "percentage", cents for "fixed_amount", unused for "free_shipping". */
  value: number;
  applies_to: { product_ids: string[] } | null;
  min_purchase_cents: number | null;
  usage_limit: number | null;
  once_per_customer: boolean;
  used_count: number;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
};

export type PageViewRow = {
  id: string;
  visitor_id: string;
  session_id: string;
  path: string;
  referrer: string | null;
  utm: Record<string, string> | null;
  country: string | null;
  created_at: string;
};

export type SiteContentRow = {
  key: string;
  value: unknown;
  default_value: unknown;
  label: string;
  help: string;
  updated_at: string;
};

export type FeedbackRow = {
  id: string;
  name: string;
  email: string | null;
  message: string;
  path: string | null;
  created_at: string;
};

/**
 * Testing-phase discussion forum (owner request 2026-07-22): threads +
 * replies inside the admin, identified by nickname only (no credentials).
 * A thread's opening message is its first forum_posts row.
 */
export type ForumThreadRow = {
  id: string;
  title: string;
  nickname: string;
  created_at: string;
};

export type ForumAttachment = {
  /** Servable path (see lib/files-url fileUrl): local /api/files/… or a Storage key. */
  path: string;
  name: string;
  /** MIME type — image/* renders inline, everything else as a link. */
  type: string;
};

export type ForumPostRow = {
  id: string;
  thread_id: string;
  nickname: string;
  body: string;
  created_at: string;
  /** Set when the author edits the post; shows an "edited" marker. */
  edited_at: string | null;
  /** Pasted images / uploaded files (owner request 2026-07-22). Optional:
   * rows written before the column existed simply have none. */
  attachments?: ForumAttachment[];
};

export type SettingRow = {
  key: string;
  value: unknown;
};

export type AdminUserRow = {
  user_id: string;
  email: string;
};

/** Table name → row type, shared by both store backends. */
export type DbTables = {
  products: ProductRow;
  product_images: ProductImageRow;
  product_variants: ProductVariantRow;
  inventory_movements: InventoryMovementRow;
  customers: CustomerRow;
  customer_events: CustomerEventRow;
  orders: OrderRow;
  order_lines: OrderLineRow;
  order_events: OrderEventRow;
  checkouts: CheckoutRow;
  discounts: DiscountRow;
  page_views: PageViewRow;
  feedback: FeedbackRow;
  forum_threads: ForumThreadRow;
  forum_posts: ForumPostRow;
  site_content: SiteContentRow;
  settings: SettingRow;
  admin_users: AdminUserRow;
};

export type TableName = keyof DbTables;

export const TABLE_NAMES: TableName[] = [
  "products",
  "product_images",
  "product_variants",
  "inventory_movements",
  "customers",
  "customer_events",
  "orders",
  "order_lines",
  "order_events",
  "checkouts",
  "discounts",
  "page_views",
  "feedback",
  "forum_threads",
  "forum_posts",
  "site_content",
  "settings",
  "admin_users",
];

/** Equality filter: every provided key must match exactly. */
export type Match<T extends TableName> = Partial<DbTables[T]>;

/**
 * The primitive persistence interface both backends implement. Anything
 * richer (filtering, joins, aggregation) is plain TypeScript on top of
 * `all()` — written once, identical against hosted Supabase and the local
 * file store. Fine at this store's scale.
 */
export interface TableStore {
  /** Which backend is live — "supabase" (hosted) or "local" (file adapter). */
  backend: "supabase" | "local";
  all<T extends TableName>(table: T): Promise<DbTables[T][]>;
  insert<T extends TableName>(table: T, rows: DbTables[T][]): Promise<void>;
  update<T extends TableName>(
    table: T,
    match: Match<T>,
    patch: Partial<DbTables[T]>,
  ): Promise<number>;
  remove<T extends TableName>(table: T, match: Match<T>): Promise<number>;
  /** Atomic stock adjust + movement log (§7.3 adjust_inventory). */
  adjustInventory(input: {
    variantId: string;
    delta: number;
    reason: InventoryReason;
    note?: string | null;
    createdBy?: string | null;
  }): Promise<void>;
  /** Next value of the Shopify-style order number sequence (#1001…). */
  nextOrderNumber(): Promise<number>;
}

/* ---------- Storefront read models ---------- */

export type CatalogImage = { path: string; alt: string; position: number };

export type CatalogVariant = {
  id: string;
  option_values: string[];
  sku: string;
  position: number;
  price_cents: number;
  compare_at_price_cents: number | null;
  in_stock: boolean;
};

/** One row of the catalog_products view (§6.3) — safe columns only. */
export type CatalogProduct = {
  id: string;
  handle: string;
  title: string;
  short_name: string;
  description: string;
  best_for: string;
  badge: string;
  details: string[];
  tags: string[];
  option_names: string[];
  position: number;
  images: CatalogImage[];
  variants: CatalogVariant[];
};

/** One row of the variant_inventory view (§7.2 four-column math). */
export type VariantInventory = {
  variant_id: string;
  on_hand: number;
  committed: number;
  unavailable: number;
};
