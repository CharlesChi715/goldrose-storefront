export const storeProfile = {
  brandName: "AUREÀ",
  fallbackBrandName: "Aurea",
  market: "United States",
  currency: "USD",
  language: "en-US",
  customerSegment: "US gift buyers shopping for anniversaries, Valentine's Day, Mother's Day, and romantic milestones.",
  productOriginCountry: "China",
  inventoryCountry: "United States",
  originDisclosure: "Imported from China. Ships from US inventory.",
  madeInUsaClaimAllowed: false,
  supportEmail: "support@aurea.example",
  placeholderDomain: "https://aurea.example",
};

export const warehouse = {
  label: "US warehouse",
  city: "Ontario",
  state: "CA",
  country: "US",
  timezone: "America/Los_Angeles",
  orderCutoff: "2:00 PM PT",
};

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

export const returnPolicy = {
  returnWindowDays: 30,
  damageReportWindowDays: 7,
  condition: "Unused, in original packaging, with photo proof for damage claims.",
  refundTiming: "5-10 business days after the returned item is inspected.",
};

export const mockLaunchDecisions = [
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
    decision: "Offer Shop Pay, credit card, and PayPal through one Shopify checkout behind the custom Next.js storefront. All three run in mock mode until live Shopify credentials are added.",
    status: "Mocked in code",
    ownerCheck: "Choose Shopify plan, enable Shop Pay + PayPal in Shopify Payments, set tax settings, and add real product variant IDs.",
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
