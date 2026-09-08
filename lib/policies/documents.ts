/**
 * ROLE OF THIS FILE
 * The six ELDREVE policy documents, imported 2026-08-18 from the Figma frames
 * the design team marked Ready-for-dev (2118:239 / :241 / :242 / :243 / :244
 * and 2127:238).
 *
 * ⚠️ GENERATED — do not hand-edit. Run `node scripts/figma/import-policies.mjs`
 * after `npm run figma:pull`; `--check` fails if this file has drifted from
 * the frames. Every heading and body string below is the frame's own copy, so
 * the site and the design cannot silently disagree about legal wording.
 *
 * Two deliberate departures from the frames, and only two:
 *
 * 1. **The brand name.** The frames still say "GoldRose" 24 times. Per the
 *    brand-name rule (docs/ixd/naming/brand-name.md) and AI-037, the file is a
 *    version BEHIND the repo on brand strings, so its wording is treated as
 *    stale rather than as design: every occurrence reads ELDREVE.
 * 2. **The fill-in-the-blank tokens.** The frames ship unfilled editorial
 *    placeholders — `[SUPPORT EMAIL]`, `[LEGAL ENTITY NAME]`, `[STATE]` and
 *    five more, sixteen in all. They are normalised to `{token}` markers here
 *    and resolved at render from the `store` setting (lib/policies/tokens.ts),
 *    so the owner changes the support address in /admin/settings rather than
 *    by a deploy. A token with nothing behind it renders as a visible
 *    "to be confirmed" — never as an invented fact, never as a raw bracket.
 *
 * AI-TAG(AI-046): OWNER-DECISION — the copy binds ELDREVE to a 30-day return
 * window, a one-year warranty and stated processing times, so every route
 * ships `robots: { index: false }` until the bosses sign it off. See
 * /agent-delivery/sessions/figma-sync-policies-08-18-worktree-figma-sync-policies.md.
 */

/** A fill-in-the-blank token the frames left for the business to answer. */
export type PolicyToken =
  | "legalName"
  | "postalAddress"
  | "websiteUrl"
  | "supportEmail"
  | "privacyEmail"
  | "legalNoticeEmail"
  | "phone"
  | "governingState";

/** One numbered white card in the document. */
export interface PolicySection {
  /** The card's number, as the frame draws it in its gold disc. */
  n: string;
  heading: string;
  /** Body copy; may contain `{token}` markers. */
  body: string;
  /** The frame's icon name, kept so a future SVG swap can find it. */
  icon: string;
  /** The exported 2x render in /eldreve/screens, without extension. */
  iconAsset: string;
}

/** One policy page. */
export interface PolicyDocument {
  slug: string;
  /** The Figma frame this was imported from. */
  frame: string;
  /** The frame's own height, kept as the pixel-diff reference. */
  frameHeight: number;
  /** The design's document code, e.g. "Policy A". */
  label: string;
  title: string;
  intro: string;
  sections: PolicySection[];
}

/**
 * When this copy was last set, shown as the documents' "Last updated" line.
 *
 * The frames carry NO usable date — five say `Last updated: [MONTH DAY, YEAR]`
 * and warranty-care says `[MAY 20, 2024]`, a bracketed placeholder rather than
 * a real revision. Rather than print a blank or repeat a stale one, the line
 * states the date this text was imported, which is a fact the repo can stand
 * behind. It lives in scripts/figma/import-policies.mjs.
 */
export const POLICIES_LAST_UPDATED = "2026-08-18";

/** The six documents, keyed by their /policies/<slug> route segment. */
export const POLICY_DOCUMENTS: Record<string, PolicyDocument> = {
  "returns-refunds-cancellations": {
    slug: "returns-refunds-cancellations",
    frame: "2118:239",
    frameHeight: 1200,
    label: "Policy A",
    title: "Returns, Refunds & Cancellations Policy",
    intro:
      "This policy applies to products purchased directly through ELDREVE official brand channels. Transactions completed on other retail platforms are subject to the respective seller policies.",
    sections: [
      {
        n: "1",
        heading: "Return Window",
        body: "Within 30 calendar days after the order is delivered, you may request a return for eligible products. Requests submitted after the return window is closed will not be accepted.",
        icon: "calendar",
        iconAsset: "2120-264",
      },
      {
        n: "2",
        heading: "Return Conditions",
        body: "Items must be unused, unmodified, and in their original condition. Accessories, gift packaging, authentication cards, manuals, protective materials, and undamaged proof of purchase must be included. Natural gemstone variations are normal and are not defects.",
        icon: "shield",
        iconAsset: "2120-273",
      },
      {
        n: "3",
        heading: "Non-Returnable Items",
        body: "Customized, engraved, altered, perishable, intimate or hygiene-related items, digital products, personalized gifts, limited-edition items, and products marked “Final Sale” are not eligible for return.",
        icon: "bag",
        iconAsset: "2120-282",
      },
      {
        n: "4",
        heading: "Damage, Defects, or Missing Items",
        body: "Contact us within 7 calendar days after delivery via {supportEmail}. Include your order number, a clear description, and photos of the product and packaging. If confirmed, we will arrange repair, replacement, or refund.",
        icon: "camera",
        iconAsset: "2120-291",
      },
      {
        n: "5",
        heading: "How to Request a Return",
        body: "Email {supportEmail} with your order number, purchaser name, items to be returned, and reason for return. We will respond within 14 calendar days with instructions and the applicable return address.",
        icon: "mail",
        iconAsset: "2120-300",
      },
      {
        n: "6",
        heading: "Return Shipping & Initial Costs",
        body: "Return shipping is generally the customer’s responsibility. If the return is due to our error, a defective product, wrong item, missing accessories, or damaged packaging, ELDREVE will cover return shipping.",
        icon: "truck",
        iconAsset: "2120-309",
      },
      {
        n: "7",
        heading: "Review & Refund Timeline",
        body: "Once received, returns are typically inspected within 3–5 business days. Refunds are issued within 10 business days via the original payment method.",
        icon: "clock",
        iconAsset: "2120-319",
      },
      {
        n: "8",
        heading: "Exchanges",
        body: "Return the original item and place a new order. For confirmed defects or wrong items, we may arrange a direct exchange. Inventory is limited and not guaranteed.",
        icon: "refresh",
        iconAsset: "2120-328",
      },
      {
        n: "9",
        heading: "Order Changes & Cancellations",
        body: "Contact us as soon as possible. Orders may be canceled before shipment; personalized orders only before production begins. Once shipped, the return policy applies.",
        icon: "doc",
        iconAsset: "2120-336",
      },
    ],
  },
  "shipping-delivery": {
    slug: "shipping-delivery",
    frame: "2118:242",
    frameHeight: 1088,
    label: "Policy B",
    title: "Shipping & Delivery Policy",
    intro:
      "This policy explains ELDREVE shipping coverage, processing time, methods, tracking, delivery issues, returns, lost packages, international orders, and related rules.",
    sections: [
      {
        n: "1",
        heading: "Scope of Delivery and Order Acceptance",
        body: "We deliver only to addresses available at checkout. We may refuse or cancel orders that violate inventory, address, payment, fraud-prevention, legal, or product-restriction policies.",
        icon: "location",
        iconAsset: "2124-351",
      },
      {
        n: "2",
        heading: "Processing Time",
        body: "Personalized or made-to-order items are typically processed in 1–3 business days; standard items in 3–7 business days. Orders are not processed on weekends or U.S. federal holidays. Processing and transit time are calculated separately.",
        icon: "box",
        iconAsset: "2124-354",
      },
      {
        n: "3",
        heading: "Shipping Methods, Costs & Estimated Delivery",
        body: "Available services, fees, and estimated delivery times are shown at checkout. Delivery dates are estimates only; expedited shipping usually shortens transit time but does not guarantee a specific delivery time.",
        icon: "truck",
        iconAsset: "2120-309",
      },
      {
        n: "4",
        heading: "Tracking & Address Accuracy",
        body: "Tracking information is provided once your order ships. Verify the shipping address at checkout; we cannot modify it once the order has shipped. Extra charges caused by incorrect addresses may apply.",
        icon: "map",
        iconAsset: "2124-361",
      },
      {
        n: "5",
        heading: "Delays",
        body: "If we cannot ship on time or deliver within 30 days of the shipping date, we will notify you of a new date and seek your consent to the delay or cancellation and refund. Weather, peak demand, customs, or force majeure may affect logistics.",
        icon: "clock",
        iconAsset: "2120-319",
      },
      {
        n: "6",
        heading: "Loss, Theft or Damage",
        body: "If tracking shows delivered but the item is missing, contact us. We may require up to 30 days after the estimated delivery date to investigate; if no update is found, we will initiate replacement or refund.",
        icon: "alert",
        iconAsset: "2124-368",
      },
      {
        n: "7",
        heading: "Split Shipments",
        body: "Items may ship in multiple packages or from different warehouses, with separate shipping fees. Some items may ship separately and may affect cancellation rights.",
        icon: "cubes",
        iconAsset: "2124-371",
      },
      {
        n: "8",
        heading: "Contact for Shipping Inquiries",
        body: "Shipping issues: {supportEmail}, {phone}.",
        icon: "headset",
        iconAsset: "2124-373",
      },
    ],
  },
  "warranty-care": {
    slug: "warranty-care",
    frame: "2118:243",
    frameHeight: 1124,
    label: "Policy C",
    title: "Limited Product Warranty & Care",
    intro:
      "This policy explains the materials used in ELDREVE products, the one-year limited warranty, remedial measures, exclusions, care requirements, available remedies, and your legal rights.",
    sections: [
      {
        n: "1",
        heading: "Materials",
        body: "Each product page describes materials and construction. Unless otherwise noted, gold color refers to gold-tone plating on a base-metal substrate and does not indicate solid gold; “24K” indicates 24-karat gold-tone plating. Natural pearls and gemstones may vary.",
        icon: "cubes",
        iconAsset: "2124-371",
      },
      {
        n: "2",
        heading: "One-Year Limited Warranty",
        body: "For one year from the purchase date, a product proven defective in workmanship or materials under normal room conditions and proper care may be eligible for repair or replacement at our discretion. This warranty applies only to products purchased directly from ELDREVE and is not transferable.",
        icon: "shield",
        iconAsset: "2120-273",
      },
      {
        n: "3",
        heading: "Remedial Measures",
        body: "After inspection and verification of proof of purchase, we may repair the product or provide an equivalent or comparable replacement. Specific remedies are determined by ELDREVE; natural gemstone variations are unique and may not be identical.",
        icon: "tools",
        iconAsset: "2125-356",
      },
      {
        n: "4",
        heading: "Exclusions",
        body: "This warranty does not cover normal wear, tarnish, scratches, bends, compression, glass breakage, gemstone loosening, loss, abuse, misuse, improper storage, chemicals, extreme heat or cold, sunlight, water immersion, high humidity, improper handling or polishing, or unauthorized repair or alteration.",
        icon: "doc",
        iconAsset: "2120-336",
      },
      {
        n: "5",
        heading: "Care",
        body: "Store in a cool, dry place away from direct sunlight, water, fragrance, cosmetics, fire, and high humidity. Handle delicate pieces with care; do not pull fragile chains. Clean with a soft, dry cloth and avoid ultrasonic or steam cleaners. Keep away from children and pets.",
        icon: "brush",
        iconAsset: "2125-361",
      },
      {
        n: "6",
        heading: "How to Get Warranty Service",
        body: "Email {supportEmail} with your order number, proof of purchase, issue details, and photos. Prior authorization is required. We will provide instructions and determine shipping responsibility based on the cause, location, legal rights, and timing.",
        icon: "mail",
        iconAsset: "2120-300",
      },
      {
        n: "7",
        heading: "Legal Rights",
        body: "This warranty gives you specific legal rights; you may also have other rights that vary by state or country. Any implied warranties are limited to the applicable warranty period to the extent permitted by law.",
        icon: "scales",
        iconAsset: "2125-366",
      },
    ],
  },
  "terms-of-service": {
    slug: "terms-of-service",
    frame: "2118:241",
    frameHeight: 1861,
    label: "Policy D",
    title: "Terms of Service",
    intro:
      "These Terms of Service apply to visits to the ELDREVE website and any purchases made through the website.",
    sections: [
      {
        n: "1",
        heading: "Acceptance of Terms",
        body: "By visiting {websiteUrl} or placing an order, you agree to be bound by these Terms of Service and our Privacy Policy.",
        icon: "doc",
        iconAsset: "2120-336",
      },
      {
        n: "2",
        heading: "Eligibility",
        body: "You must be of legal age to enter a contract. The website is not intended for children under 13. Do not use the site for unlawful or fraudulent purposes.",
        icon: "user",
        iconAsset: "2130-435",
      },
      {
        n: "3",
        heading: "Account",
        body: "You are responsible for accurate information and account security. Notify us immediately of suspected unauthorized access; we may suspend accounts.",
        icon: "lock",
        iconAsset: "2130-438",
      },
      {
        n: "4",
        heading: "Product Information and Natural Variations",
        body: "We strive to display products accurately, but colors, imagery, materials, and natural variations may affect appearance. Actual products prevail.",
        icon: "diamond",
        iconAsset: "2130-441",
      },
      {
        n: "5",
        heading: "Pricing, Taxes, and Promotions",
        body: "Prices use the displayed currency. Shipping fees, taxes, and charges appear at checkout. Promotions may have terms; we may correct errors and cancel orders if necessary.",
        icon: "tag",
        iconAsset: "2130-444",
      },
      {
        n: "6",
        heading: "Orders and Payments",
        body: "Placing an order is an offer to purchase. We may accept or decline due to stock or other reasons and may charge the payment method you provided.",
        icon: "cart",
        iconAsset: "2130-447",
      },
      {
        n: "7",
        heading: "Customization",
        body: "By placing a custom order, you confirm the design, date, and text are correct. We cannot accept changes or returns for issues resulting from content you provided.",
        icon: "pencil",
        iconAsset: "2130-449",
      },
      {
        n: "8",
        heading: "Shipping, Delivery, and Repairs",
        body: "Shipping policies and limited repair terms apply. In force-majeure events, we will prioritize solutions in accordance with applicable laws.",
        icon: "truck",
        iconAsset: "2120-309",
      },
      {
        n: "9",
        heading: "Intellectual Property",
        body: "Website content, images, text, logos, designs, software, and trademarks are owned by or licensed to ELDREVE and protected by intellectual-property laws.",
        icon: "copyright",
        iconAsset: "2130-455",
      },
      {
        n: "10",
        heading: "User Content and Reviews",
        body: "You retain ownership of content you submit, but grant us a worldwide, non-exclusive, royalty-free license to use, display, and share it for business purposes.",
        icon: "chat",
        iconAsset: "2130-458",
      },
      {
        n: "11",
        heading: "Prohibited Uses",
        body: "Do not upload malicious software, attempt unauthorized access, collect personal data, impersonate others, conduct security testing, place false orders, or use bots.",
        icon: "shield",
        iconAsset: "2120-273",
      },
      {
        n: "12",
        heading: "Third-Party Services and Links",
        body: "The website may use third-party payment, social-media, analytics, financing, shipping, or platform services. We do not control them and are not liable for their acts or omissions.",
        icon: "link",
        iconAsset: "2130-464",
      },
      {
        n: "13",
        heading: "Disclaimer",
        body: "To the fullest extent permitted by law, the website and products are provided “as is” and “as available.” Some jurisdictions may not allow limits on implied warranties.",
        icon: "alert",
        iconAsset: "2124-368",
      },
      {
        n: "14",
        heading: "Limitation of Liability",
        body: "To the fullest extent permitted by law, ELDREVE is not liable for indirect, incidental, special, or consequential losses exceeding US$100 arising from use of the website or products.",
        icon: "scales",
        iconAsset: "2125-366",
      },
      {
        n: "15",
        heading: "Indemnification",
        body: "You agree to indemnify and hold ELDREVE and its affiliates harmless from claims related to your website use, violation of these Terms, or infringement of third-party rights.",
        icon: "handshake",
        iconAsset: "2130-471",
      },
      {
        n: "16",
        heading: "Governing Law and Dispute Resolution",
        body: "Email {legalNoticeEmail} to provide notice 30 days before filing a claim. If unresolved, disputes will proceed by arbitration or small-claims court under {governingState} law.",
        icon: "mail",
        iconAsset: "2120-300",
      },
      {
        n: "17",
        heading: "Changes to Terms",
        body: "We may revise these Terms and update the effective date. Material changes will be notified; continued use after updates constitutes acceptance.",
        icon: "doc",
        iconAsset: "2120-336",
      },
      {
        n: "18",
        heading: "Contact Us",
        body: "{legalName}, ELDREVE Brand, {postalAddress}; {supportEmail}; {phone}.",
        icon: "mail",
        iconAsset: "2120-300",
      },
    ],
  },
  privacy: {
    slug: "privacy",
    frame: "2118:244",
    frameHeight: 1470,
    label: "Policy E",
    title: "Privacy Policy",
    intro:
      "This Privacy Policy explains how ELDREVE collects, uses, discloses, and protects your personal information when you visit our website, place orders, create an account, contact us, or interact with our advertising.",
    sections: [
      {
        n: "1",
        heading: "Scope and Controller",
        body: "This policy applies to {legalName} (doing business as ELDREVE) and activities on {websiteUrl} where we process personal information. It does not apply to independently provided third-party services.",
        icon: "globe",
        iconAsset: "2128-369",
      },
      {
        n: "2",
        heading: "Types of Information We Collect",
        body: "We may collect identifiers, contact details, account and shipping information, purchase history, returns, preferences, service records, payment details, transaction status, device and risk signals, IP address, cookies, page views, time spent, referral sources, and information you provide in reviews, photos, surveys, and collaborations.",
        icon: "id",
        iconAsset: "2128-372",
      },
      {
        n: "3",
        heading: "How We Use Information",
        body: "We use information to operate our website, process orders, manage shipping, returns and warranties, communicate with customers, detect fraud, maintain security, store records, improve products, measure performance, personalize content and advertising, and comply with legal obligations.",
        icon: "target",
        iconAsset: "2128-376",
      },
      {
        n: "4",
        heading: "Cookies and Similar Technologies",
        body: "We may use essential, functional, analytics, advertising, SDK, and local-storage technologies. Ad-tech partners may collect information across websites and apps. Applicable laws may allow opting out of sharing, sale, or targeted advertising.",
        icon: "cookie",
        iconAsset: "2128-380",
      },
      {
        n: "5",
        heading: "How We Disclose Information",
        body: "We may share with service providers, payment processors, logistics partners, advertisers, affiliates, warranty providers, and data processors; for legal purposes; to protect rights and safety; or during business transfers. We do not sell personal information for monetary value.",
        icon: "users",
        iconAsset: "2128-385",
      },
      {
        n: "6",
        heading: "Data Retention",
        body: "We retain information only as long as necessary. Order and tax records are typically kept for 7 years, service and warranty records for 4 years, and website or security logs for 13 months or less. Specific periods may vary by law, dispute, fraud-prevention, or backup requirements.",
        icon: "calendar",
        iconAsset: "2120-264",
      },
      {
        n: "7",
        heading: "Security",
        body: "We implement administrative, technical, and physical safeguards based on data sensitivity. No internet transmission is 100% secure; please protect your login credentials.",
        icon: "shield",
        iconAsset: "2120-273",
      },
      {
        n: "8",
        heading: "Your Choices",
        body: "You may unsubscribe from marketing emails, reply STOP to opt out of texts, manage Cookie Settings, and use Your Privacy Choices where available.",
        icon: "sliders",
        iconAsset: "2128-395",
      },
      {
        n: "9",
        heading: "California Privacy Rights",
        body: "Under the CCPA, you may request to know, access, correct, delete, or opt out of sale or sharing of personal information and targeted advertising. We will not discriminate against you for exercising lawful rights.",
        icon: "usa",
        iconAsset: "2128-400",
      },
      {
        n: "10",
        heading: "Additional Notices",
        body: "If you are under 16, follow Your Privacy Choices or applicable consent rules. ELDREVE honors qualifying Global Privacy Control signals and accepts California Shine the Light requests at {privacyEmail}.",
        icon: "notice",
        iconAsset: "2128-402",
      },
      {
        n: "11",
        heading: "Children and International Users",
        body: "This site is not intended for children under 13. We do not knowingly collect personal information from children. International users may be subject to cross-border transfers and local laws.",
        icon: "globe",
        iconAsset: "2128-369",
      },
    ],
  },
  "email-sms-terms": {
    slug: "email-sms-terms",
    frame: "2127:238",
    frameHeight: 932,
    label: "Policy G",
    title: "Email & SMS Terms",
    intro:
      "This policy explains the basic rules that apply to your subscription to ELDREVE marketing emails or SMS.",
    sections: [
      {
        n: "1",
        heading: "Email Subscription",
        body: "Subscribing means you are requesting ELDREVE marketing emails. Subscription is optional and not a purchase condition. Emails identify ELDREVE, include an unsubscribe link and valid physical address. You may opt out at any time; transactional order and service messages will still be sent.",
        icon: "mail",
        iconAsset: "2120-300",
      },
      {
        n: "2",
        heading: "SMS Consent",
        body: "If you opt in to SMS marketing, you consent to promotional text messages at the number provided. Consent is not a purchase condition; message frequency varies and message and data rates may apply.",
        icon: "chat",
        iconAsset: "2130-458",
      },
      {
        n: "3",
        heading: "Opt-Out & Help",
        body: "Reply STOP to cancel SMS, HELP for help, or contact {supportEmail}. You may also withdraw consent through other lawful means.",
        icon: "stop",
        iconAsset: "2127-359",
      },
      {
        n: "4",
        heading: "Other Information",
        body: "Carriers are not liable for delayed or undelivered messages. ELDREVE will not treat consent as a condition of purchase.",
        icon: "shield",
        iconAsset: "2120-273",
      },
    ],
  },
};

/** The route segments, in the order the Policies & Legal hub lists them. */
export const POLICY_SLUGS = Object.keys(POLICY_DOCUMENTS);
