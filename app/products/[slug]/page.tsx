/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * The product detail page (/products/[slug]) — a pixel-exact implementation
 * of the Ready-for-dev shop二级 frame (node 1523:3971, 430×1616) from the
 * ELDREVE Figma file.
 * Every coordinate, size, color, and font value comes verbatim from the
 * Figma REST API; photo assets in /public/eldreve are exact 2x node renders.
 *
 * ONE DELIBERATE DEPARTURE FROM THE FRAME (owner, 2026-08-07): the strapline
 * box is two lines tall instead of one, because real `details` bullets do not
 * fit the frame's single line and truncating them to "…" loses content. That
 * adds 16px, so the info card is 182 tall (frame: 166), every section below it
 * sits 16px lower than the frame, and the stage is 1632 (frame: 1616). The
 * frame itself still says 1616 — Figma needs the same change.
 * AI-TAG(AI-036): OWNER-TODO — get frame 1523:3971 changed to match. See
 * /agent-delivery/sessions/branch-consolidation-08-07.md.
 *
 * Every product renders the same pixel design; the slug picks the product,
 * and the catalog row (lib/supabase/catalog) fills the designated boxes
 * (§14.2 Stage 9).
 *
 * WHAT COMES FROM THE DATABASE (owner, 2026-08-06 — the page used to draw
 * most of this as fixed art): the hero photo, the badge pill, the strapline
 * (first three `details` bullets), title, price, compare-at, the discount
 * pill (computed from the two prices, not a fixed "15% OFF"), the ABOUT
 * copy (`description`), and every number in the reviews band — average,
 * count, star fill, histogram and the quoted review, all from
 * product_reviews. With no reviews the band STAYS on the page (owner) and
 * reads as unrated; it no longer borrows the frame's "4.9 · 286 Reviews",
 * which would be a review claim the table cannot support.
 *
 * WHAT IS STILL THE FRAME'S OWN: the three shipping benefits (store policy,
 * not product data), the ABOUT slogan, and the unboxing gallery with its
 * "(1,354)" count — kept visible on the owner's instruction; there is no UGC
 * table behind it. `best_for` and any `details` past the third have no box
 * in this frame yet — they need a design slot.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConciergeChat } from "@/components/ConciergeChat";
import { SiteLegalFooter } from "@/components/SiteLegalFooter";
import { PromoBar, ScaleFrame, VHeader } from "@/components/chrome";
import { PdpOverlays } from "@/components/pdp/PdpOverlays";
import { abs, txt } from "@/lib/figma-layout";
import { cormorant, inter, notoSC } from "@/lib/fonts";
import { BuyButtons } from "@/components/BuyButtons";
import { getCatalog, getCatalogProduct } from "@/lib/supabase/catalog.ts";
import { getPromoSlogan } from "@/lib/content";
import { listPublishedReviews, reviewStats } from "@/lib/reviews/db.ts";
import { formatRelativeDay } from "@/lib/dates";
import { fileUrl } from "@/lib/files-url";
import { spotlightOf } from "@/lib/images/spotlight";
import { siteBaseUrl } from "@/lib/admin/settings";
import { formatMoney } from "@/lib/money";

// Re-check the DB catalog every 5 minutes so admin edits reach buyers
// without a redeploy (§8).
export const revalidate = 300;

export async function generateStaticParams() {
  // Handles come from the DB; a dead DB at build time degrades to on-demand
  // rendering (dynamicParams default true) — no redeploy needed to add a
  // product (§8).
  try {
    const catalog = await getCatalog();
    return catalog.map((product) => ({ slug: product.handle }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getCatalogProduct(slug);
    if (!product) return { title: "Product" };
    const image = product.images[0]
      ? fileUrl(product.images[0].path)
      : undefined;
    return {
      // Search engine listing (§9.5): seo fields with title/description fallback.
      title: product.short_name || product.title,
      description: product.description,
      alternates: { canonical: `/products/${product.handle}` },
      openGraph: {
        title: product.title,
        description: product.description,
        ...(image ? { images: [{ url: image }] } : {}),
      },
    };
  } catch {
    return { title: "Product" };
  }
}

/* ---------- Small building blocks ---------- */

/** White section card with the Figma INSIDE-aligned 1px stroke as an inset shadow. */
function Section({
  x,
  y,
  w,
  h,
  radius,
  stroke,
  strokeWidth = 1,
  background = "#FFFFFF",
  clip = false,
  className,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  radius: number;
  stroke?: string;
  strokeWidth?: number;
  background?: string;
  clip?: boolean;
  /** Optional hook class (e.g. the hover-zoom wrapper). */
  className?: string;
  /** Omitted by the hero, whose contents are drawn over it by PdpOverlays. */
  children?: React.ReactNode;
}) {
  return (
    <div
      className={className}
      style={{
        ...abs(x, y, w, h),
        background,
        borderRadius: radius,
        ...(stroke
          ? { boxShadow: `inset 0 0 0 ${strokeWidth}px ${stroke}` }
          : {}),
        ...(clip ? { overflow: "hidden" } : {}),
      }}
    >
      {children}
    </div>
  );
}

/* ---------- Page ---------- */

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Everything DB-backed degrades gracefully; the fixed design always renders.
  let catalogProduct: Awaited<ReturnType<typeof getCatalogProduct>> = null;
  let promo = { text: "", isDefault: true };
  try {
    const catalog = await getCatalog();
    catalogProduct = catalog.find((entry) => entry.handle === slug) ?? null;
    promo = await getPromoSlogan();
  } catch {
    catalogProduct = null;
  }
  if (!catalogProduct) notFound();
  const product = catalogProduct;
  // Real published reviews (pending/rejected never leave the server). An
  // empty table now reads as unrated rather than borrowing the frame's.
  let reviews: Awaited<ReturnType<typeof listPublishedReviews>> = [];
  try {
    reviews = await listPublishedReviews(product.id);
  } catch {
    reviews = [];
  }
  const stats = reviewStats(reviews);
  const hasReviews = stats.count > 0;
  /* How much of the star art is left unveiled. The band stays on the page
     with no reviews (owner, 2026-08-06) — it just reads as unrated instead
     of borrowing the frame's 4.9, which would be a review claim the table
     cannot support. */
  const starFill = hasReviews ? stats.average / 5 : 0;
  // 5★…1★ counts drive the band-10 histogram; the newest review is the one
  // the band quotes.
  const histogram = [5, 4, 3, 2, 1].map(
    (star) => reviews.filter((review) => review.rating === star).length,
  );
  const featured = reviews[0];
  const variantId =
    product.variants.find((v) => v.in_stock)?.id ??
    product.variants[0]?.id ??
    null;

  // Product + BreadcrumbList JSON-LD (§8.1) — the machine-readable layer
  // that compensates for the PNG-pixel design.
  const base = siteBaseUrl();
  const defaultVariant = product.variants[0];

  /* Values the frame draws as fixed art, resolved from the row the slug
     found. The frame's own words survive ONLY where the catalog has no
     column behind them — the ABOUT slogan and the three shipping benefits,
     which are store policy rather than product data. */
  // The gold pill: the frame says BEST SELLER, the catalog says what it is.
  const badge = (product.badge ?? "").trim().toUpperCase();
  // The frame's "Real Rose · Hand-Finished · Made to Last" strapline reads
  // exactly like the first detail bullets, so that is what fills it.
  const strapline = (product.details ?? []).slice(0, 3).join(" · ");
  const priceCents = defaultVariant?.price_cents ?? 0;
  const compareCents = defaultVariant?.compare_at_price_cents ?? null;
  // The frame prints a flat "15% OFF". The real saving is the two prices,
  // and printing less than the true discount costs sales.
  const discountPercent =
    compareCents != null && compareCents > priceCents
      ? Math.round(((compareCents - priceCents) / compareCents) * 100)
      : null;
  // The product's own photos, not the design's stock renders: the first
  // fills the hero, the second the ABOUT panel beside the copy.
  const heroImage = product.images[0] ? fileUrl(product.images[0].path) : null;
  const aboutImage = product.images[1]
    ? fileUrl(product.images[1].path)
    : heroImage;
  /* Every photo box here is object-fit: cover, so the browser would crop to
     the centre; the admin's 取景框 says which part actually matters
     (product_images.focal_x/y, migration 0008).

     The ABOUT panel below takes the POINT but not the zoom. A spotlight zoom
     is authored against the 398×250 viewer window, and this box is a nearly
     square 190×196 — replaying that zoom here would crop far past what the
     owner was looking at when they chose it. The viewer window, which the
     zoom belongs to, is drawn by PdpOverlays. */
  const focus = (image: (typeof product.images)[number] | undefined) =>
    `${image?.focal_x ?? 50}% ${image?.focal_y ?? 50}%`;

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.title,
      description: product.description,
      sku: defaultVariant?.sku,
      brand: { "@type": "Brand", name: "ELDREVE" },
      image: product.images.map((image) => fileUrl(image.path)),
      url: `${base}/products/${product.handle}`,
      offers: {
        "@type": "Offer",
        price: ((defaultVariant?.price_cents ?? 0) / 100).toFixed(2),
        priceCurrency: "USD",
        availability: product.variants.some((variant) => variant.in_stock)
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        url: `${base}/products/${product.handle}`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${base}/` },
        {
          "@type": "ListItem",
          position: 2,
          name: "Shop",
          item: `${base}/shop`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: product.title,
          item: `${base}/products/${product.handle}`,
        },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ScaleFrame
        height={1632}
        background="#FFF6EC"
        fontClass={inter.className}
      >
        <PromoBar
          slogan={promo.text}
          isDefault={promo.isDefault}
          variant="brown"
        />
        {/* 07-27 frames replace the wishlist heart with the search icon
          (SEARCH-OPEN entry point); the heart variant stays in chrome for
          when wishlist enters scope. */}
        <VHeader backHref="/shop" right="search" brand="eldreve" />

        {/* 03 · Hero — the card only. The photo track and its pagination dots
          are drawn by PdpOverlays' Carousel below: the tap target has to sit
          on top of the photo to open the media viewer, so it may as well BE
          the photo. Two stacked layers could never hold the same slide. */}
        <Section
          x={16}
          y={94}
          w={398}
          h={281}
          radius={15}
          background="#FFFBF6"
          clip
        />

        {/* 04 · Product info */}
        <div style={{ ...abs(16, 375, 398, 182), background: "#FFFBF6" }}>
          {/* The catalog's badge, in the frame's pill. A product with no
              badge gets no pill rather than a borrowed one. */}
          {badge ? (
            <div
              data-live-text
              style={{
                ...abs(0, 8, 91, 21),
                background: "#D4AF37",
                borderRadius: 99,
              }}
            >
              <div
                style={{
                  ...abs(10, 4, 71),
                  ...txt(11, 13.312, "#FFF6EC"),
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {badge}
              </div>
            </div>
          ) : null}
          <div
            className={cormorant.className}
            data-live-text
            style={{
              ...abs(0, 36, 398),
              ...txt(25, 32, "#3B2F2F"),
              fontWeight: 600,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {product.title}
          </div>
          {/* The catalog's first three detail bullets, in the frame's
              strapline box; the frame's own line covers a product that
              carries none. Real bullets are routinely longer than the frame's
              one line ("Genuine preserved rose · Rich ruby-red finish ·
              Gold-trimmed petal edges" is 71 characters against room for ~59),
              so the box is two lines tall and wraps instead of truncating
              (owner, 2026-08-07). Everything below it in the card moves down
              by the extra 16px, and so does every section on the page. A third
              line is clipped whole by the fixed height — never an ellipsis. */}
          <div
            data-live-text
            style={{
              ...abs(0, 75, 398, 31.466),
              ...txt(13, 15.733, "#B8A69A"),
              whiteSpace: "normal",
              overflow: "hidden",
            }}
          >
            {strapline || "Real Rose · Hand-Finished · Made to Last"}
          </div>
          {/* Same treatment as the reviews band: the art fills to the live
              average instead of always showing five stars. The art is the
              node export - real alpha, Figma's #D4AF37 - placed on its
              absoluteRenderBounds rather than its 24px-tall text box. */}
          <div
            data-live-text
            role="img"
            aria-label={
              hasReviews ? `${stats.average} out of 5 stars` : "No ratings yet"
            }
            style={abs(0.53, 116.51, 69, 13)}
          >
            <img
              src="/eldreve/screens/1523-3993.svg"
              alt=""
              width={69}
              height={13}
              style={{ ...abs(0, 0, 69, 13), display: "block" }}
            />
            <div
              style={{
                ...abs(starFill * 69, 0, 69 - starFill * 69, 13),
                background: "#FFFBF6",
                opacity: 0.74,
              }}
            />
          </div>
          {/* Width 130, not the frame's 112: a live count has to fit
              without painting outside its pixel-test mask. */}
          <div
            data-live-text
            style={{ ...abs(76, 115, 130), ...txt(12, 14.523, "#B8A69A") }}
          >
            {hasReviews
              ? `${stats.average} · ${stats.count} Review${stats.count === 1 ? "" : "s"} \u00A0›`
              : "No reviews yet \u00A0›"}
          </div>
          <div
            className={notoSC.className}
            data-live-text
            style={{
              ...abs(0, 138, 116, 36),
              ...txt(30, 36, "#3B2F2F"),
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            {formatMoney(defaultVariant?.price_cents ?? 0)}
          </div>
          {defaultVariant?.compare_at_price_cents != null ? (
            <div
              className={notoSC.className}
              data-live-text
              style={{
                ...abs(128, 147.5),
                ...txt(14, 16.8, "#B8A69A"),
                textDecoration: "line-through",
              }}
            >
              {formatMoney(defaultVariant.compare_at_price_cents)}
            </div>
          ) : null}
          {/* Computed from the two prices above it, so the pill can never
              disagree with them; no compare-at price, no pill. */}
          {discountPercent != null ? (
            <div
              data-live-text
              style={{
                ...abs(191, 144.5, 70, 23),
                background: "#F5EDDB",
                borderRadius: 99,
              }}
            >
              <div
                style={{
                  ...abs(10, 4, 50),
                  ...txt(12, 14.523, "#D4AF37"),
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                {discountPercent}% OFF
              </div>
            </div>
          ) : null}
        </div>

        {/* 05 · Benefits */}
        <Section
          x={16}
          y={557}
          w={398}
          h={156}
          radius={16}
          stroke="#E5D9C9"
          background="#FFFBF6"
        >
          {[
            // Icon geometry is each node's absoluteRenderBounds (the ink), not
            // its 24px-tall text box, so the glyph lands where Figma draws it.
            {
              glyph: "1523-4002",
              glyphX: 17.02,
              glyphY: 19.48,
              glyphW: 16,
              glyphH: 16,
              labelX: 46,
              label: "Ships from U.S. Warehouse 🇺🇸",
              y: 14,
            },
            {
              glyph: "1523-4006",
              glyphX: 17.02,
              glyphY: 73.34,
              glyphW: 13,
              glyphH: 13,
              labelX: 43,
              label: "Delivered in 3–5 Business Days",
              y: 66,
            },
            {
              glyph: "1523-4010",
              glyphX: 18,
              glyphY: 122.4,
              glyphW: 16,
              glyphH: 16,
              labelX: 48,
              label: "Premium Gift Box Included",
              y: 118,
            },
          ].map((row, i) => (
            <div key={row.label}>
              <img
                src={`/eldreve/screens/${row.glyph}.svg`}
                alt=""
                width={row.glyphW}
                height={row.glyphH}
                style={{
                  ...abs(row.glyphX, row.glyphY, row.glyphW, row.glyphH),
                  display: "block",
                }}
              />
              <div
                style={{
                  ...abs(row.labelX, row.y + 3, 213),
                  ...txt(15, 18.153, "#3B2F2F"),
                  fontWeight: 500,
                }}
              >
                {row.label}
              </div>
              {i < 2 && (
                <div
                  style={{
                    ...abs(16, row.y + 37, 364, 1),
                    background: "#E5D9C9",
                  }}
                />
              )}
            </div>
          ))}
        </Section>

        {/* 07 · Checkout actions — wired to the v2 cart (Stage 4) */}
        <Section
          x={16}
          y={1376}
          w={398}
          h={144}
          radius={18}
          stroke="#E5D9C9"
          background="#FFFBF6"
        >
          <BuyButtons
            variantId={variantId}
            priceLabel={formatMoney(defaultVariant?.price_cents ?? 0)}
          />
          <div
            style={{
              ...abs(16, 85, 342),
              ...txt(11, 13.312, "#B8A69A"),
              textAlign: "center",
            }}
          >
            Secure Checkout · Multiple Payment Options
          </div>
          <div
            style={{
              ...abs(75, 111, 62),
              ...txt(14, 16.943, "#5E4AE3"),
              fontWeight: 600,
            }}
          >
            shop Pay
          </div>
          <div
            style={{
              ...abs(154, 111, 48),
              ...txt(14, 16.943, "#111111"),
              fontWeight: 600,
            }}
          >
            Klarna.
          </div>
          <div
            style={{
              ...abs(219, 111, 46),
              ...txt(14, 16.943, "#1167B1"),
              fontWeight: 600,
            }}
          >
            PayPal
          </div>
          <div
            style={{
              ...abs(282, 111, 41),
              ...txt(14, 16.943, "#111111"),
              fontWeight: 600,
            }}
          >
            ● Pay
          </div>
        </Section>

        {/* 08 · Unboxing gallery */}
        <Section
          x={15}
          y={1208}
          w={398}
          h={165}
          radius={18}
          stroke="#E5D9C9"
          background="#FFFBF6"
        >
          <div
            style={{
              ...abs(16, 16, 206),
              ...txt(15, 18.153, "#D4AF37"),
              fontWeight: 700,
            }}
          >
            Unboxing Highlights (1,354)
          </div>
          <div style={{ ...abs(330, 18.5, 52), ...txt(11, 13.312, "#B8A69A") }}>
            {"View All \u00A0›"}
          </div>
          <img
            src="/eldreve/ugc-strip.png"
            alt="Customer unboxing photos"
            width={366}
            height={82}
            style={{ ...abs(16, 44, 366, 82), display: "block" }}
          />
          <div style={{ ...abs(16, 136, 366), ...txt(11, 13.312, "#B8A69A") }}>
            Shared by real customers · Every rose tells a story
          </div>
        </Section>

        {/* 09 · About */}
        <Section
          x={16}
          y={1005}
          w={398}
          h={196}
          radius={18}
          background="rgba(243, 198, 209, 0.26)"
          clip
        >
          <div
            style={{
              ...abs(18, 25.5, 185),
              ...txt(12, 14.523, "#D4AF37"),
              fontWeight: 500,
            }}
          >
            ABOUT THE ROSE
          </div>
          <div
            className={cormorant.className}
            style={{
              ...abs(18, 48.5, 185, 54),
              ...txt(17, 27, "#3B2F2F"),
              fontWeight: 600,
              whiteSpace: "pre-line",
            }}
          >
            {"Crafted to Last\nMade for Love"}
          </div>
          {/* The catalog description. The frame's box holds three lines, so
              a longer description clamps there instead of spilling over the
              art beside it — the whole text still ships in the meta
              description and the Product JSON-LD. */}
          <div
            data-live-text
            style={{
              ...abs(18, 110.5, 185, 60),
              ...txt(10.5, 20, "#4A403B"),
              whiteSpace: "normal",
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 3,
              overflow: "hidden",
            }}
          >
            {product.description ||
              "A real rose, expertly preserved and hand-finished in 24K gold to keep its beauty"}
          </div>
          {/* The product's second photo (its detail shot), falling back to
              the first and then to the frame's art. */}
          <img
            src={aboutImage ?? "/eldreve/about-rose.png"}
            alt={product.images[1]?.alt || product.title}
            width={190}
            height={196}
            style={{
              ...abs(217, 0, 190, 196),
              display: "block",
              objectFit: "cover",
              objectPosition: focus(product.images[1] ?? product.images[0]),
            }}
          />
        </Section>

        {/* 10 · Reviews */}
        <Section
          x={16}
          y={722}
          w={398}
          h={277}
          radius={18}
          stroke="#E5D9C9"
          background="#FFFBF6"
        >
          <div
            style={{
              ...abs(16, 18, 366),
              ...txt(16, 19.364, "#3B2F2F"),
              fontWeight: 700,
            }}
          >
            Customer Reviews
          </div>
          <div
            className={notoSC.className}
            data-live-text
            style={{
              ...abs(30, 66, 64, 50),
              ...txt(42, 50.4, "#3B2F2F"),
              fontWeight: 700,
            }}
          >
            {hasReviews ? stats.average : "—"}
          </div>
          {/* The star art fills to the real average once reviews exist, so it
              can never show five stars for a 4.5 score. */}
          <div
            data-live-text
            role="img"
            aria-label={
              hasReviews ? `${stats.average} out of 5 stars` : "No ratings yet"
            }
            style={abs(25.07, 123.69, 74, 14)}
          >
            <img
              src="/eldreve/screens/1523-4112.svg"
              alt=""
              width={74}
              height={14}
              style={{ ...abs(0, 0, 74, 14), display: "block" }}
            />
            {/* Stars past the average fade under a veil in the card's own
                colour. Carried over from the palette PNG this replaced; the
                node export has real alpha, so a clipped copy would work too.
                With no reviews the veil covers all five. */}
            <div
              style={{
                ...abs(starFill * 74, 0, 74 - starFill * 74, 14),
                background: "#FFFBF6",
                opacity: 0.74,
              }}
            />
          </div>
          <div
            data-live-text
            style={{
              ...abs(9.5, 144, 105),
              ...txt(10, 12.102, "#B8A69A", "center"),
            }}
          >
            {hasReviews
              ? `Based on ${stats.count} review${stats.count === 1 ? "" : "s"}`
              : "No reviews yet"}
          </div>
          {[
            {
              y: 67,
              label: "5 stars",
              labelW: 33,
              trackX: 171,
              pctX: 329,
            },
            {
              y: 86,
              label: "4 stars",
              labelW: 33,
              trackX: 171,
              pctX: 329,
            },
            {
              y: 105,
              label: "3 stars",
              labelW: 33,
              trackX: 171,
              pctX: 329,
            },
            {
              y: 124,
              label: "2 stars",
              labelW: 33,
              trackX: 171,
              pctX: 329,
            },
            {
              y: 143,
              label: "1 star",
              labelW: 26,
              trackX: 164,
              pctX: 322,
            },
          ].map((row, index) => {
            // Live share of this star band. With no reviews every band is
            // empty rather than carrying the frame's 91/7/1.4/0.4/0.2 —
            // those are review claims. A non-zero share keeps the design's
            // 2px minimum bar so it never disappears entirely.
            const share = hasReviews ? histogram[index] / stats.count : 0;
            const percent = share * 100;
            const fill = share > 0 ? Math.max(2, share * 150) : 0;
            const label =
              percent === 0
                ? "0%"
                : percent >= 10
                  ? `${Math.round(percent)}%`
                  : `${percent.toFixed(1)}%`;
            return (
              <div key={row.label}>
                <div
                  style={{
                    ...abs(130, row.y, row.labelW),
                    ...txt(10, 12.102, "#4A403B"),
                  }}
                >
                  {row.label}
                </div>
                <div
                  data-live-text
                  style={{
                    ...abs(row.trackX, row.y + 3, 150, 6),
                    background: "#E5D9C9",
                    borderRadius: 99,
                  }}
                >
                  <div
                    style={{
                      ...abs(0, 0, fill, 6),
                      background: "#D4AF37",
                      borderRadius: 99,
                    }}
                  />
                </div>
                <div
                  className={notoSC.className}
                  data-live-text
                  style={{
                    // Wider than the design's text node so a live percentage
                    // ("50%") still ends inside the box — the label is
                    // left-aligned at pctX, so nothing moves on screen.
                    ...abs(row.pctX, row.y, 34),
                    ...txt(10, 12, "#4A403B"),
                  }}
                >
                  {label}
                </div>
              </div>
            );
          })}
          <div
            style={{
              ...abs(16, 185, 366, 74),
              background: "#FFFBF6",
              borderRadius: 14,
            }}
          >
            <div
              style={{
                ...abs(14, 17, 40, 40),
                background: "#F3C6D1",
                borderRadius: "50%",
              }}
            />
            <div
              data-live-text
              style={{
                ...abs(64, 22.5, 288),
                ...txt(12, 14.523, "#3B2F2F"),
                fontWeight: 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {featured
                ? `“${featured.body}”`
                : "Be the first to review this rose."}
            </div>
            {/* "Verified Buyer" is a claim, so it is only made for reviews
                that carry the order they came from. */}
            <div
              data-live-text
              style={{ ...abs(64, 39.5, 288), ...txt(10, 12.102, "#B8A69A") }}
            >
              {featured
                ? `— ${featured.author_name ?? "ELDREVE Customer"}${featured.order_id ? " · Verified Buyer" : ""}`
                : ""}
            </div>
          </div>
        </Section>

        {/* Overlay triggers + drawers (reviews / colors / media / unboxing) —
          last child so the transparent hit-areas stack above every section. */}
        <PdpOverlays
          reviews={reviews.map((review) => ({
            author: review.author_name ?? "ELDREVE Customer",
            date: formatRelativeDay(review.created_at),
            body: review.body,
            rating: review.rating,
          }))}
          stats={stats}
          media={product.images.map((image) => ({
            src: fileUrl(image.path),
            spotlight: spotlightOf(image),
          }))}
          productTitle={product.title}
        />
      </ScaleFrame>

      {/* Outside the fixed canvas on purpose — see SiteLegalFooter. */}
      <SiteLegalFooter />

      {/* Chatbox (mascot + bar) floats fixed above the nav; opens the
          placeholder chat panel on click. Bar paints over the mascot here,
          matching the 详情页 layer order. */}
      <ConciergeChat
        navClearance={59}
        mascotOnTop={false}
        variant="brown"
        showMascot={false}
      />
    </>
  );
}
