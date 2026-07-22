/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * The product detail page (/products/[slug]) — a pixel-exact implementation
 * of the 详情页 frame (node 2:2, 430×2501) from the VELORIA Figma file.
 * Every coordinate, size, color, and font value comes verbatim from the
 * Figma REST API; photo assets in /public/veloria are exact 2x node renders.
 *
 * For now every product renders the same placeholder design (per Charles's
 * instruction); the slug only selects metadata and will later feed real
 * name/price/photos from lib/products.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConciergeChat } from "@/components/ConciergeChat";
import {
  abs,
  txt,
  PromoBar,
  ScaleFrame,
  VHeader,
} from "@/components/veloria";
import { cormorant, inter, notoSC } from "@/lib/fonts";
import { BuyButtons } from "@/components/BuyButtons";
import { getCatalog, getCatalogProduct } from "@/lib/supabase/catalog.ts";
import { getPromoSlogan } from "@/lib/content";
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
    const image = product.images[0] ? fileUrl(product.images[0].path) : undefined;
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
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        ...abs(x, y, w, h),
        background,
        borderRadius: radius,
        ...(stroke ? { boxShadow: `inset 0 0 0 ${strokeWidth}px ${stroke}` } : {}),
        ...(clip ? { overflow: "hidden" } : {}),
      }}
    >
      {children}
    </div>
  );
}

const SYMBOL_STYLE = { fontWeight: 500 } as const;

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
  let handles: string[] = [];
  try {
    const catalog = await getCatalog();
    handles = catalog.map((entry) => entry.handle);
    catalogProduct = catalog.find((entry) => entry.handle === slug) ?? null;
    promo = await getPromoSlogan();
  } catch {
    catalogProduct = null;
  }
  if (!catalogProduct) notFound();
  const product = catalogProduct;
  const variantId =
    product.variants.find((v) => v.in_stock)?.id ?? product.variants[0]?.id ?? null;

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
      brand: { "@type": "Brand", name: "GoldRose" },
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
        { "@type": "ListItem", position: 2, name: "Shop", item: `${base}/shop` },
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
      <ScaleFrame height={2501} background="#FCFAF7" fontClass={inter.className}>
      <PromoBar slogan={promo.text} isDefault={promo.isDefault} />
      <VHeader backHref="/shop" right="heart" />

      {/* 03 · Hero */}
      <Section x={16} y={94} w={398} h={281} radius={15} clip>
        <img
          src="/veloria/detail-hero.png"
          alt={product.images[0]?.alt ?? product.title}
          width={398}
          height={250}
          style={{ ...abs(0, 8, 398, 250), display: "block" }}
        />
        <div style={{ ...abs(0, 268, 18, 7), background: "#153C34", borderRadius: 3.5 }} />
        {[25, 39, 53].map((x) => (
          <div key={x} style={{ ...abs(x, 268, 7, 7), background: "#DED9D0", borderRadius: "50%" }} />
        ))}
      </Section>

      {/* 04 · Product info */}
      <div style={{ ...abs(16, 375, 398, 166), background: "#FFFFFF" }}>
        <div style={{ ...abs(0, 8, 91, 21), background: "#D7A64A", borderRadius: 99 }}>
          <div style={{ ...abs(10, 4, 71), ...txt(11, 13.312, "#FFFFFF"), fontWeight: 500 }}>
            BEST SELLER
          </div>
        </div>
        <div
          className={cormorant.className}
          data-live-text
          style={{
            ...abs(0, 36, 398),
            ...txt(25, 32, "#152C27"),
            fontWeight: 600,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {product.title}
        </div>
        <div style={{ ...abs(0, 75, 398), ...txt(13, 15.733, "#7C7369") }}>
          Real Rose · Hand-Finished · Made to Last
        </div>
        <img
          src="/veloria/glyph-stars-14.png"
          alt="5 stars"
          width={72}
          height={21}
          style={{ ...abs(0, 96, 72, 21), display: "block" }}
        />
        <div style={{ ...abs(76, 99, 112), ...txt(12, 14.523, "#6E6A64") }}>{"4.9 · 286 Reviews \u00A0›"}</div>
        <div
          className={notoSC.className}
          data-live-text
          style={{ ...abs(0, 122, 116, 36), ...txt(30, 36, "#073A31"), fontWeight: 700, whiteSpace: "nowrap" }}
        >
          {formatMoney(defaultVariant?.price_cents ?? 0)}
        </div>
        {defaultVariant?.compare_at_price_cents != null ? (
          <div
            className={notoSC.className}
            data-live-text
            style={{ ...abs(128, 131.5), ...txt(14, 16.8, "#918A83"), textDecoration: "line-through" }}
          >
            {formatMoney(defaultVariant.compare_at_price_cents)}
          </div>
        ) : null}
        <div style={{ ...abs(191, 128.5, 70, 23), background: "#F6EBDD", borderRadius: 99 }}>
          <div style={{ ...abs(10, 4, 50), ...txt(12, 14.523, "#B67923"), fontWeight: 500 }}>15% OFF</div>
        </div>
      </div>

      {/* 05 · Benefits */}
      <Section x={16} y={541} w={398} h={156} radius={16} stroke="#EAD9BC">
        {[
          { glyph: "glyph-benefit-1", glyphW: 24, labelX: 46, label: "Ships from U.S. Warehouse 🇺🇸", y: 14 },
          { glyph: "glyph-benefit-2", glyphW: 24, labelX: 43, label: "Delivered in 3–5 Business Days", y: 66 },
          { glyph: "glyph-benefit-3", glyphW: 26, labelX: 48, label: "Premium Gift Box Included", y: 118 },
        ].map((row, i) => (
          <div key={row.label}>
            <img
              src={`/veloria/${row.glyph}.png`}
              alt=""
              width={row.glyphW}
              height={28}
              style={{ ...abs(14, row.y - 2, row.glyphW, 28), display: "block" }}
            />
            <div style={{ ...abs(row.labelX, row.y + 3, 213), ...txt(15, 18.153, "#263530"), fontWeight: 500 }}>
              {row.label}
            </div>
            {i < 2 && <div style={{ ...abs(16, row.y + 37, 364, 1), background: "#EFE8DF" }} />}
          </div>
        ))}
      </Section>

      {/* 06 · Product configurator */}
      <Section x={16} y={697} w={398} h={624} radius={18} stroke="#EEE5DA">
        {/* 1 · Rose color */}
        <div style={{ ...abs(16, 18, 192), ...txt(15, 18.153, "#24342F"), fontWeight: 700 }}>
          1. Choose Your Rose Color
        </div>
        <div style={{ ...abs(272, 20.5, 110), ...txt(11, 13.312, "#8A8178") }}>
          {"View All 120 Colors \u00A0›"}
        </div>
        {[
          { x: 16, img: "swatch-gem-blue", label: "Gem Blue", labelX: 7.5, labelW: 39, selected: true },
          { x: 78.4, img: "swatch-classic-red", label: "Classic Red", labelX: 3.5, labelW: 47 },
          { x: 140.8, img: "swatch-blush-pink", label: "Blush Pink", labelX: 6, labelW: 42 },
          { x: 203.2, img: "swatch-champagne", label: "Champagne", labelX: 2.5, labelW: 49 },
          { x: 265.6, img: "swatch-violet", label: "Violet", labelX: 15.5, labelW: 23 },
          { x: 328, img: "swatch-more", label: "More", labelX: 16.5, labelW: 21 },
        ].map((tile) => (
          <div
            key={tile.label}
            style={{
              ...abs(tile.x, 48, 54, 72),
              background: "#FCFAF7",
              borderRadius: 12,
              boxShadow: tile.selected ? "inset 0 0 0 1.5px #D9A64C" : "inset 0 0 0 1px #F2ECE5",
            }}
          >
            <img
              src={`/veloria/${tile.img}.png`}
              alt={tile.label}
              width={30}
              height={30}
              style={{ ...abs(12, 13, 30, 30), display: "block" }}
            />
            <div
              style={{
                ...abs(tile.labelX, 49, tile.labelW),
                ...txt(8.5, 10.287, tile.selected ? "#B47520" : "#514B45"),
                fontWeight: tile.selected ? 500 : 400,
              }}
            >
              {tile.label}
            </div>
          </div>
        ))}

        {/* 2 · Presentation */}
        <div style={{ ...abs(16, 138, 366), ...txt(15, 18.153, "#24342F"), fontWeight: 700 }}>
          2. Choose a Presentation
        </div>
        {[
          {
            x: 16, y: 168, selected: true, iconBg: "#E9EDF6", glyph: "glyph-pres-1",
            name: "Classic Single Stem", nameY: 16, wrap: true,
            sub: "SELECTED", subY: 48, subNoto: false, subColor: "#B67722",
          },
          {
            x: 204, y: 168, selected: false, iconBg: "#ECE8E2", glyph: "glyph-pres-2",
            name: "Glass Dome", nameY: 23.5, wrap: false,
            sub: "+ $20", subY: 40.5, subNoto: true, subColor: "#7A736B",
          },
          {
            x: 16, y: 254, selected: false, iconBg: "#ECE8E2", glyph: "glyph-pres-3",
            name: "Gift Box", nameY: 23.5, wrap: false,
            sub: "+ $30", subY: 40.5, subNoto: true, subColor: "#7A736B",
          },
          {
            x: 204, y: 254, selected: false, iconBg: "#ECE8E2", glyph: "glyph-pres-4",
            name: "Luxury Set", nameY: 23.5, wrap: false,
            sub: "+ $15", subY: 40.5, subNoto: true, subColor: "#7A736B",
          },
        ].map((tile) => (
          <div
            key={tile.name}
            style={{
              ...abs(tile.x, tile.y, 178, 76),
              background: tile.selected ? "#FFFBF4" : "#F9F6F1",
              borderRadius: 14,
              boxShadow: tile.selected ? "inset 0 0 0 1.5px #D7A145" : "inset 0 0 0 1px #ECE5DD",
            }}
          >
            <div style={{ ...abs(12, 12, 48, 52), background: tile.iconBg, borderRadius: 10 }} />
            {/* Figma "Copy" frame — a solid white box behind the label text */}
            <div
              style={{
                ...abs(70, tile.wrap ? 16 : 23.5, 96, tile.wrap ? 44 : 29),
                background: "#FFFFFF",
              }}
            />
            <img
              src={`/veloria/${tile.glyph}.png`}
              alt=""
              width={30}
              height={36}
              style={{ ...abs(21, 20, 30, 36), display: "block" }}
            />
            <div
              style={{
                ...abs(70, tile.nameY, 96, tile.wrap ? 30 : undefined),
                ...txt(12, 14.523, "#2E3834"),
                fontWeight: 500,
                ...(tile.wrap ? { whiteSpace: "normal" } : {}),
              }}
            >
              {tile.name}
            </div>
            <div
              className={tile.subNoto ? notoSC.className : undefined}
              style={{ ...abs(70, tile.subY, 96), ...txt(10, tile.subNoto ? 12 : 12.102, tile.subColor) }}
            >
              {tile.sub}
            </div>
          </div>
        ))}

        {/* 3 · Personalization */}
        <div style={{ ...abs(16, 348, 366), ...txt(15, 18.153, "#24342F"), fontWeight: 700 }}>
          3. Personalize It (Optional)
        </div>
        {[
          { y: 376, glyph: "glyph-pers-1", glyphW: 24, labelX: 42, label: "Engraving (Name / Date)", value: "+ $15", valueX: 319, valueW: 33, valueNoto: true, valueColor: "#B87922" },
          { y: 436, glyph: "glyph-pers-2", glyphW: 24, labelX: 41, label: "Add a Gift Message Card", value: "FREE", valueX: 320, valueW: 32, valueNoto: false, valueColor: "#B87922" },
          { y: 496, glyph: "glyph-pers-3", glyphW: 24, labelX: 41, label: "Upgrade to Premium Gift Box", value: "+ $29", valueX: 319, valueW: 33, valueNoto: true, valueColor: "#B87922" },
          { y: 556, glyph: "glyph-pers-4", glyphW: 58, labelX: 75, label: "More Personalization Options", value: null, valueX: 0, valueW: 0, valueNoto: true, valueColor: "" },
        ].map((row) => (
          <div
            key={row.label}
            style={{
              ...abs(16, row.y, 366, 50),
              background: "#FFFEFC",
              borderRadius: 12,
              boxShadow: "inset 0 0 0 1px #EEE6DD",
            }}
          >
            <img
              src={`/veloria/${row.glyph}.png`}
              alt=""
              width={row.glyphW}
              height={28}
              style={{ ...abs(12, 11, row.glyphW, 28), display: "block" }}
            />
            <div style={{ ...abs(row.labelX, 17, 269), ...txt(13, 15.733, "#34423D"), fontWeight: 500 }}>
              {row.label}
            </div>
            {row.value ? (
              <div
                className={row.valueNoto ? notoSC.className : undefined}
                style={{
                  ...abs(row.valueX, 17, row.valueW),
                  ...txt(13, row.valueNoto ? 15.6 : 15.733, row.valueColor),
                  fontWeight: 500,
                }}
              >
                {row.value}
              </div>
            ) : (
              // The "＋" glyph, as design pixels (fallback fonts render it differently)
              <img
                src="/veloria/glyph-pers-plus.png"
                alt=""
                width={20}
                height={24}
                style={{ ...abs(337, 13, 20, 24), display: "block" }}
              />
            )}
          </div>
        ))}
      </Section>

      {/* 07 · Checkout actions — wired to the v2 cart (Stage 4) */}
      <Section x={16} y={1321} w={398} h={144} radius={18} stroke="#E8E0D7">
        <BuyButtons
          variantId={variantId}
          priceLabel={formatMoney(defaultVariant?.price_cents ?? 0)}
        />
        <div style={{ ...abs(16, 85, 232), ...txt(11, 13.312, "#8C857D") }}>
          Secure Checkout · Multiple Payment Options
        </div>
        <div style={{ ...abs(16, 111, 62), ...txt(14, 16.943, "#5E4AE3"), fontWeight: 600 }}>shop Pay</div>
        <div style={{ ...abs(95, 111, 48), ...txt(14, 16.943, "#111111"), fontWeight: 600 }}>Klarna.</div>
        <div style={{ ...abs(160, 111, 46), ...txt(14, 16.943, "#1167B1"), fontWeight: 600 }}>PayPal</div>
        <img
          src="/veloria/glyph-applepay.png"
          alt="Apple Pay"
          width={48}
          height={24}
          style={{ ...abs(220, 108, 48, 24), display: "block" }}
        />
      </Section>

      {/* 08 · Unboxing gallery */}
      <Section x={16} y={1465} w={398} h={165} radius={18} stroke="#EEE6DC">
        <div style={{ ...abs(16, 16, 206), ...txt(15, 18.153, "#A66B20"), fontWeight: 700 }}>
          Unboxing Highlights (1,354)
        </div>
        <div style={{ ...abs(330, 18.5, 52), ...txt(11, 13.312, "#8A8177") }}>{"View All \u00A0›"}</div>
        <img
          src="/veloria/ugc-strip.png"
          alt="Customer unboxing photos"
          width={366}
          height={82}
          style={{ ...abs(16, 44, 366, 82), display: "block" }}
        />
        <div style={{ ...abs(16, 136, 366), ...txt(11, 13.312, "#786F67") }}>
          Shared by real customers · Every rose tells a story
        </div>
      </Section>

      {/* 09 · About */}
      <Section x={16} y={1630} w={398} h={196} radius={18} background="#F8F1E7" clip>
        <div style={{ ...abs(18, 25.5, 185), ...txt(12, 14.523, "#B77A27"), fontWeight: 500 }}>
          ABOUT THE ROSE
        </div>
        <div
          className={cormorant.className}
          style={{ ...abs(18, 48.5, 185, 54), ...txt(17, 27, "#1E3831"), fontWeight: 600, whiteSpace: "pre-line" }}
        >
          {"Crafted to Last\nMade for Love"}
        </div>
        <div style={{ ...abs(18, 110.5, 185, 60), ...txt(10.5, 20, "#4F514C"), whiteSpace: "normal" }}>
          A real rose, expertly preserved and hand-finished in 24K gold to keep its beauty
        </div>
        <img
          src="/veloria/about-rose.png"
          alt="Gold dipped rose detail"
          width={190}
          height={196}
          style={{ ...abs(217, 0, 190, 196), display: "block" }}
        />
      </Section>

      {/* 10 · Reviews */}
      <Section x={16} y={1826} w={398} h={277} radius={18} stroke="#EEE6DD">
        <div style={{ ...abs(16, 18, 366), ...txt(16, 19.364, "#273732"), fontWeight: 700 }}>
          Customer Reviews
        </div>
        <div
          className={notoSC.className}
          style={{ ...abs(30, 66, 64, 50), ...txt(42, 50.4, "#0E352C"), fontWeight: 700 }}
        >
          4.9
        </div>
        <img
          src="/veloria/glyph-stars-15.png"
          alt="5 stars"
          width={80}
          height={22}
          style={{ ...abs(22, 119, 80, 22), display: "block" }}
        />
        <div style={{ ...abs(9.5, 144, 105), ...txt(10, 12.102, "#8C847B") }}>Based on 286 reviews</div>
        {[
          { y: 67, label: "5 stars", labelW: 33, trackX: 171, fill: 136.5, pct: "91%", pctX: 329, pctW: 21 },
          { y: 86, label: "4 stars", labelW: 33, trackX: 171, fill: 10.5, pct: "7%", pctX: 329, pctW: 15 },
          { y: 105, label: "3 stars", labelW: 33, trackX: 171, fill: 2.1, pct: "1.4%", pctX: 329, pctW: 24 },
          { y: 124, label: "2 stars", labelW: 33, trackX: 171, fill: 2, pct: "0.4%", pctX: 329, pctW: 24 },
          { y: 143, label: "1 star", labelW: 26, trackX: 164, fill: 2, pct: "0.2%", pctX: 322, pctW: 24 },
        ].map((row) => (
          <div key={row.label}>
            <div style={{ ...abs(130, row.y, row.labelW), ...txt(10, 12.102, "#5D5A55") }}>{row.label}</div>
            <div style={{ ...abs(row.trackX, row.y + 3, 150, 6), background: "#EEE9E2", borderRadius: 99 }}>
              <div style={{ ...abs(0, 0, row.fill, 6), background: "#C58A2D", borderRadius: 99 }} />
            </div>
            <div
              className={notoSC.className}
              style={{ ...abs(row.pctX, row.y, row.pctW), ...txt(10, 12, "#5D5A55") }}
            >
              {row.pct}
            </div>
          </div>
        ))}
        <div style={{ ...abs(16, 185, 366, 74), background: "#F8F3EC", borderRadius: 14 }}>
          <div style={{ ...abs(14, 17, 40, 40), background: "#143C78", borderRadius: "50%" }} />
          <div style={{ ...abs(64, 22.5, 288), ...txt(12, 14.523, "#35423D"), fontWeight: 500 }}>
            “Beautiful craftsmanship — perfect for gifting.”
          </div>
          <div style={{ ...abs(64, 39.5, 288), ...txt(10, 12.102, "#817970") }}>
            — Sarah M. · Verified Buyer
          </div>
        </div>
      </Section>

      {/* 11 · Recommendations */}
      <Section x={16} y={2103} w={398} h={251} radius={18} stroke="#EEE6DD">
        <div style={{ ...abs(16, 18, 141), ...txt(16, 19.364, "#273732"), fontWeight: 700 }}>
          You May Also Like
        </div>
        <div style={{ ...abs(330, 21, 52), ...txt(11, 13.312, "#817970") }}>{"View All \u00A0›"}</div>
        {[
          { x: 16, img: "rec-1", name: "Classic Red Eternal Rose", price: "$149" },
          { x: 141, img: "rec-2", name: "Violet Eternal Rose", price: "$159" },
          { x: 266, img: "rec-3", name: "Double Rose Gift Set", price: "$219" },
        ].map((card, i) => (
          <Link
            key={card.name}
            href={handles.length ? `/products/${handles[i % handles.length]}` : "/shop"}
            style={{
              ...abs(card.x, 49, 116, 184),
              display: "block",
              background: "#FBF8F4",
              borderRadius: 14,
              boxShadow: "inset 0 0 0 1px #EEE6DD",
              overflow: "hidden",
            }}
          >
            <img
              src={`/veloria/${card.img}.png`}
              alt={card.name}
              width={116}
              height={102}
              style={{ ...abs(0, 0, 116, 102), display: "block" }}
            />
            {/* Figma "Copy" frame — white box behind the card text */}
            <div style={{ ...abs(0, 109, 116, 63), background: "#FFFFFF" }} />
            <div style={{ ...abs(9, 109, 98, 32), ...txt(11, 16, "#35413D"), fontWeight: 500, whiteSpace: "normal" }}>
              {card.name}
            </div>
            <img
              src="/veloria/glyph-stars-9.png"
              alt="5 stars"
              width={60}
              height={15}
              style={{ ...abs(7, 142, 60, 15), display: "block" }}
            />
            <div
              className={notoSC.className}
              style={{ ...abs(9, 158, 98), ...txt(12, 14.4, "#123D34"), fontWeight: 700 }}
            >
              {card.price}
            </div>
          </Link>
        ))}
      </Section>

      </ScaleFrame>

      {/* Chatbox (mascot + bar) floats fixed above the nav; opens the
          placeholder chat panel on click. Bar paints over the mascot here,
          matching the 详情页 layer order. */}
      <ConciergeChat navClearance={59} mascotOnTop={false} />
    </>
  );
}
