/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * The product detail page (/products/[slug]) — a pixel-exact implementation
 * of the Ready-for-dev shop二级 frame (node 1523:3971, 430×1616) from the
 * ELDREVE Figma file.
 * Every coordinate, size, color, and font value comes verbatim from the
 * Figma REST API; photo assets in /public/eldreve are exact 2x node renders.
 *
 * Every product renders the same pixel design; the slug picks the product,
 * and live name/price/photos come from the DB catalog (lib/supabase/catalog)
 * in the designated boxes (§14.2 Stage 9).
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConciergeChat } from "@/components/ConciergeChat";
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
  children: React.ReactNode;
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
  // Real published reviews (pending/rejected never leave the server); the
  // mock art stays as the visible fallback while the table is empty.
  let reviews: Awaited<ReturnType<typeof listPublishedReviews>> = [];
  try {
    reviews = await listPublishedReviews(product.id);
  } catch {
    reviews = [];
  }
  const stats = reviewStats(reviews);
  const hasReviews = stats.count > 0;
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
        height={1616}
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

        {/* 03 · Hero */}
        {/* The hero photo zooms inside its clipped frame on hover (gr-card-zoom
          + gr-photo, app/globals.css) — pointer devices only. */}
        <Section
          x={16}
          y={94}
          w={398}
          h={281}
          radius={15}
          background="#FFFBF6"
          clip
          className="gr-card-zoom"
        >
          <img
            className="gr-photo"
            src="/eldreve/detail-hero.png"
            alt={product.images[0]?.alt ?? product.title}
            width={398}
            height={250}
            fetchPriority="high"
            style={{ ...abs(0, 8, 398, 250), display: "block" }}
          />
          <div
            style={{
              ...abs(0, 268, 18, 7),
              background: "#153C34",
              borderRadius: 3.5,
            }}
          />
          {[25, 39, 53].map((x) => (
            <div
              key={x}
              style={{
                ...abs(x, 268, 7, 7),
                background: "#DED9D0",
                borderRadius: "50%",
              }}
            />
          ))}
        </Section>

        {/* 04 · Product info */}
        <div style={{ ...abs(16, 375, 398, 166), background: "#FFFBF6" }}>
          <div
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
              }}
            >
              BEST SELLER
            </div>
          </div>
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
          <div style={{ ...abs(0, 75, 398), ...txt(13, 15.733, "#B8A69A") }}>
            Real Rose · Hand-Finished · Made to Last
          </div>
          {/* Same treatment as the reviews band: the art fills to the live
              average instead of always showing five stars. */}
          <div
            data-live-text
            role="img"
            aria-label={
              hasReviews ? `${stats.average} out of 5 stars` : "5 stars"
            }
            style={abs(0, 96, 72, 21)}
          >
            <img
              src="/eldreve/glyph-stars-14.png"
              alt=""
              width={72}
              height={21}
              style={{ ...abs(0, 0, 72, 21), display: "block" }}
            />
            {hasReviews ? (
              <div
                style={{
                  ...abs(
                    (stats.average / 5) * 72,
                    0,
                    72 - (stats.average / 5) * 72,
                    21,
                  ),
                  background: "#FFFBF6",
                  opacity: 0.74,
                }}
              />
            ) : null}
          </div>
          <div
            data-live-text
            style={{ ...abs(76, 99, 130), ...txt(12, 14.523, "#B8A69A") }}
          >
            {stats.count > 0
              ? `${stats.average} · ${stats.count} Review${stats.count === 1 ? "" : "s"} \u00A0›`
              : "4.9 · 286 Reviews \u00A0›"}
          </div>
          <div
            className={notoSC.className}
            data-live-text
            style={{
              ...abs(0, 122, 116, 36),
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
                ...abs(128, 131.5),
                ...txt(14, 16.8, "#B8A69A"),
                textDecoration: "line-through",
              }}
            >
              {formatMoney(defaultVariant.compare_at_price_cents)}
            </div>
          ) : null}
          <div
            style={{
              ...abs(191, 128.5, 70, 23),
              background: "#F5EDDB",
              borderRadius: 99,
            }}
          >
            <div
              style={{
                ...abs(10, 4, 50),
                ...txt(12, 14.523, "#D4AF37"),
                fontWeight: 500,
              }}
            >
              15% OFF
            </div>
          </div>
        </div>

        {/* 05 · Benefits */}
        <Section
          x={16}
          y={541}
          w={398}
          h={156}
          radius={16}
          stroke="#E5D9C9"
          background="#FFFBF6"
        >
          {[
            {
              glyph: "glyph-benefit-1",
              glyphW: 24,
              labelX: 46,
              label: "Ships from U.S. Warehouse 🇺🇸",
              y: 14,
            },
            {
              glyph: "glyph-benefit-2",
              glyphW: 24,
              labelX: 43,
              label: "Delivered in 3–5 Business Days",
              y: 66,
            },
            {
              glyph: "glyph-benefit-3",
              glyphW: 26,
              labelX: 48,
              label: "Premium Gift Box Included",
              y: 118,
            },
          ].map((row, i) => (
            <div key={row.label}>
              <img
                src={`/eldreve/${row.glyph}.png`}
                alt=""
                width={row.glyphW}
                height={28}
                style={{
                  ...abs(14, row.y - 2, row.glyphW, 28),
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
          y={1360}
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
          y={1192}
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
          y={989}
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
          <div
            style={{
              ...abs(18, 110.5, 185, 60),
              ...txt(10.5, 20, "#4A403B"),
              whiteSpace: "normal",
            }}
          >
            A real rose, expertly preserved and hand-finished in 24K gold to
            keep its beauty
          </div>
          <img
            src="/eldreve/about-rose.png"
            alt="Gold dipped rose detail"
            width={190}
            height={196}
            style={{ ...abs(217, 0, 190, 196), display: "block" }}
          />
        </Section>

        {/* 10 · Reviews */}
        <Section
          x={16}
          y={706}
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
            {hasReviews ? stats.average : "4.9"}
          </div>
          {/* The star art fills to the real average once reviews exist, so it
              can never show five stars for a 4.5 score. */}
          <div
            data-live-text
            role="img"
            aria-label={
              hasReviews ? `${stats.average} out of 5 stars` : "5 stars"
            }
            style={abs(22, 119, 80, 22)}
          >
            <img
              src="/eldreve/glyph-stars-15.png"
              alt=""
              width={80}
              height={22}
              style={{ ...abs(0, 0, 80, 22), display: "block" }}
            />
            {/* The glyph is a palette PNG with no alpha, so the stars past
                the average fade under a veil in the card's own colour rather
                than under a second, clipped copy of the art. */}
            {hasReviews ? (
              <div
                style={{
                  ...abs(
                    (stats.average / 5) * 80,
                    0,
                    80 - (stats.average / 5) * 80,
                    22,
                  ),
                  background: "#FFFBF6",
                  opacity: 0.74,
                }}
              />
            ) : null}
          </div>
          <div
            data-live-text
            style={{ ...abs(9.5, 144, 105), ...txt(10, 12.102, "#B8A69A") }}
          >
            {hasReviews
              ? `Based on ${stats.count} review${stats.count === 1 ? "" : "s"}`
              : "Based on 286 reviews"}
          </div>
          {[
            {
              y: 67,
              label: "5 stars",
              labelW: 33,
              trackX: 171,
              fill: 136.5,
              pct: "91%",
              pctX: 329,
            },
            {
              y: 86,
              label: "4 stars",
              labelW: 33,
              trackX: 171,
              fill: 10.5,
              pct: "7%",
              pctX: 329,
            },
            {
              y: 105,
              label: "3 stars",
              labelW: 33,
              trackX: 171,
              fill: 2.1,
              pct: "1.4%",
              pctX: 329,
            },
            {
              y: 124,
              label: "2 stars",
              labelW: 33,
              trackX: 171,
              fill: 2,
              pct: "0.4%",
              pctX: 329,
            },
            {
              y: 143,
              label: "1 star",
              labelW: 26,
              trackX: 164,
              fill: 2,
              pct: "0.2%",
              pctX: 322,
            },
          ].map((row, index) => {
            // Live share of this star band; the design's own numbers stand in
            // until the product has reviews. A non-zero share keeps the
            // design's 2px minimum bar so it never disappears entirely.
            const share = hasReviews ? histogram[index] / stats.count : 0;
            const percent = share * 100;
            const fill = hasReviews
              ? share > 0
                ? Math.max(2, share * 150)
                : 0
              : row.fill;
            const label = hasReviews
              ? percent === 0
                ? "0%"
                : percent >= 10
                  ? `${Math.round(percent)}%`
                  : `${percent.toFixed(1)}%`
              : row.pct;
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
                : "“Beautiful craftsmanship — perfect for gifting.”"}
            </div>
            {/* "Verified Buyer" is a claim, so it is only made for reviews
                that carry the order they came from. */}
            <div
              data-live-text
              style={{ ...abs(64, 39.5, 288), ...txt(10, 12.102, "#B8A69A") }}
            >
              {featured
                ? `— ${featured.author_name ?? "ELDREVE Customer"}${featured.order_id ? " · Verified Buyer" : ""}`
                : "— Sarah M. · Verified Buyer"}
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
        />
      </ScaleFrame>

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
