/**
 * ROLE OF THIS FILE
 * Business facts and policies in one place: who we sell to, where stock ships
 * from, shipping/return promises, and the launch-decision checklist. The UI
 * reads these values instead of hard-coding them into page markup, so a policy
 * change is a one-line edit here.
 *
 * Several values are still provisional defaults awaiting owner confirmation —
 * see `launchDecisions` at the bottom for what still needs review.
 */

/** Brand identity and market assumptions used across the site and metadata. */
export const storeProfile = {
  brandName: "GoldRose",
  fallbackBrandName: "GoldRose",
  market: "United States",
  currency: "USD",
  language: "en-US",
  customerSegment: "US gift buyers shopping for anniversaries, Valentine's Day, Mother's Day, and romantic milestones.",
  productOriginCountry: "China",
  inventoryCountry: "United States",
  originDisclosure: "Imported from China. Ships from US inventory.",
  madeInUsaClaimAllowed: false,
  supportEmail: "support@goldrose.example",
  placeholderDomain: "https://goldrose.example",
};

/** Where orders ship from — shown on product cards and the operations copy. */
export const warehouse = {
  label: "US warehouse",
  city: "Ontario",
  state: "CA",
  country: "US",
  timezone: "America/Los_Angeles",
  orderCutoff: "2:00 PM PT",
};

/** Shipping promise. Prices are in cents (595 = $5.95, 7500 = $75 threshold). */
export const shippingPolicy = {
  processingTime: "1-2 business days",
  standardTransit: "3-5 business days",
  expeditedTransit: "2 business days",
  standardShippingPrice: 595,
  freeShippingThreshold: 7500,
  carriers: ["USPS Ground Advantage", "UPS Ground"],
  launchRegions: ["Contiguous United States"],
  excludedRegions: ["Alaska", "Hawaii", "US territories", "PO boxes for expedited shipping"],
};

/** Return promise shown in the storefront copy. */
export const returnPolicy = {
  returnWindowDays: 30,
  damageReportWindowDays: 7,
  condition: "Unused, in original packaging, with photo proof for damage claims.",
  refundTiming: "5-10 business days after the returned item is inspected.",
};

/**
 * The launch-decision checklist: each operating assumption, its current
 * status, and what the owner still has to verify before trusting it.
 * This is internal planning data — it is documented in
 * docs/mock-business-decisions.md and is no longer rendered on the
 * customer-facing storefront.
 */
export const launchDecisions = [
  {
    area: "Sourcing",
    decision: "Product is imported from China and already stocked in the United States.",
    status: "Mocked from owner input",
    ownerCheck: "Confirm supplier invoice, country-of-origin marking, and actual stock count.",
  },
  {
    area: "Origin claims",
    decision: "Use 'Imported from China. Ships from US inventory.' Do not use 'Made in USA'.",
    status: "Conservative default",
    ownerCheck: "Confirm packaging and product markings with supplier/import paperwork.",
  },
  {
    area: "Fulfillment",
    decision: "Mock warehouse is Ontario, CA. Process orders in 1-2 business days.",
    status: "Mocked",
    ownerCheck: "Replace with real 3PL, storage location, cutoff time, and SLA.",
  },
  {
    area: "Shipping",
    decision: "Free standard shipping over $75; otherwise $5.95 standard shipping.",
    status: "Mocked",
    ownerCheck: "Verify carrier rates and margin impact before launch.",
  },
  {
    area: "Returns",
    decision: "30-day returns; damage claims within 7 days with photo proof.",
    status: "Mocked",
    ownerCheck: "Confirm whether return shipping is customer-paid or merchant-paid.",
  },
  {
    area: "Checkout",
    decision: "Live: the storefront hands the real cart to Shopify's hosted checkout via a cart permalink, and real payments are accepted there. Shop Pay stays hidden until Shopify Payments is enabled.",
    status: "Live",
    ownerCheck: "Verify tax and shipping-rate settings in Shopify, and enable Shopify Payments to unlock card + Shop Pay natively.",
  },
  {
    area: "Tax",
    decision: "Use Shopify tax setup or a tax provider; do not calculate sales tax manually.",
    status: "Recommended",
    ownerCheck: "Confirm nexus obligations with accountant or tax tool.",
  },
  {
    area: "Email",
    decision: "Email capture remains UI-only until Klaviyo, Shopify Email, or another provider is connected.",
    status: "Mocked",
    ownerCheck: "Pick provider and add privacy/consent language.",
  },
];
