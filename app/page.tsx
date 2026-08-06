/**
 * ROLE OF THIS FILE
 * The homepage (`/`) — a pixel-exact implementation of the SIMPLIFIED
 * homepage frame `2380:370` ("/ · default · mobile · homepage") from the
 * Ready-for-dev section 首页一级, imported 2026-08-04. Every coordinate,
 * size, color and font value comes verbatim from the Figma REST API data;
 * each surviving A-module lives in components/home/. The 430-wide canvas
 * scales to the viewport (ScaleFrame); photo assets in /public/eldreve/home
 * are exact 2× node renders. It also carries the store's Schema.org
 * structured data and the admin-editable promo slogan.
 *
 * The 2026-08-04 sync cut the page from 8673px to 5193px: the design deleted
 * modules A-4 (Real Rose Story + MORI entry), A-7 (MORI Gift Finder), A-8
 * (Personalization) and A-10 (Corporate Partnerships) at source, and
 * re-stacked what remained. Band offsets below are the frame's own.
 */

import type { Metadata } from "next";
import { ScaleFrame, PromoBar, HomeHeader } from "@/components/chrome";
import { SiteLegalFooter } from "@/components/SiteLegalFooter";
import { playfair } from "@/lib/fonts";
import { A1 } from "@/components/home/A1";
import { A2 } from "@/components/home/A2";
import { A3 } from "@/components/home/A3";
import { A5 } from "@/components/home/A5";
import { A6 } from "@/components/home/A6";
import { A9 } from "@/components/home/A9";
import { A11 } from "@/components/home/A11";
import { HomeBand } from "@/components/home/HomeBand";
import { getCatalog } from "@/lib/supabase/catalog.ts";
import { getSettingsMap, siteBaseUrl } from "@/lib/admin/settings";
import { getHomeContent } from "@/lib/home-content";
import { fileUrl } from "@/lib/files-url";

// DB-backed data (promo slogan, JSON-LD, search listing) refreshes without a redeploy (§8).
export const revalidate = 300;

/** Homepage search listing — editable in Settings → Search engine & AI (§8.1). */
export async function generateMetadata(): Promise<Metadata> {
  try {
    const { search_engine } = await getSettingsMap();
    return {
      title: { absolute: search_engine.home_title },
      description: search_engine.home_description,
      alternates: { canonical: "/" },
      openGraph: {
        title: search_engine.home_title,
        description: search_engine.home_description,
        images: [{ url: search_engine.social_image }],
      },
    };
  } catch {
    return { alternates: { canonical: "/" } };
  }
}

export default async function HomePage() {
  // Schema.org structured data from the LIVE catalog (§8.1): Organization +
  // WebSite + the store's offers, with price/availability from real stock.
  let catalog: Awaited<ReturnType<typeof getCatalog>> = [];
  let storeName = "ELDREVE";
  try {
    catalog = await getCatalog();
    storeName = (await getSettingsMap()).store.name;
  } catch {
    // fixed design still renders with no DB
  }
  // Owner-editable copy, section visibility and the resulting band offsets
  // (§7.9). getHomeContent never throws: with no DB it returns the design.
  const { text, visible, layout, overridden } = await getHomeContent();
  const base = siteBaseUrl();
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: storeName,
      url: `${base}/`,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: storeName,
      url: `${base}/`,
    },
    {
      "@context": "https://schema.org",
      "@type": "Store",
      name: storeName,
      description: "Gift-ready 24K gold dipped rose keepsakes.",
      url: `${base}/`,
      makesOffer: catalog.map((product) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Product",
          name: product.title,
          sku: product.variants[0]?.sku,
          description: product.description,
          image: product.images[0]
            ? fileUrl(product.images[0].path)
            : undefined,
          url: `${base}/products/${product.handle}`,
        },
        price: ((product.variants[0]?.price_cents ?? 0) / 100).toFixed(2),
        priceCurrency: "USD",
        availability: product.variants.some((variant) => variant.in_stock)
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      })),
    },
  ];

  return (
    <>
      {/* 2380:370 is 5193 tall: A-11 ends at 5134 and the bottom nav fills
          the last 59px (it renders as a fixed overlay, outside this stage).
          Hiding a section in the admin shrinks the stage by that band's
          height — see lib/home-content/layout.ts. */}
      <ScaleFrame
        height={layout.frameHeight}
        background="#FFF6EC"
        fontClass={playfair.className}
        navActive="Home"
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <PromoBar
          slogan={text.promo.slogan}
          isDefault={!overridden.has("promo.slogan")}
          variant="brown"
        />
        {/* Band offsets are 2380:370's own: A-1 @32, A-2 @764, A-3 @1405,
          A-5 @1868, A-6 @2344, A-9 @3133, A-11 @4124. HomeBand is a no-op
          while every section is visible, which is what keeps the untouched
          page byte-identical to the import. */}
        <HomeBand shift={layout.shift.hero} hidden={!visible.hero}>
          <A1 c={text.hero} />
        </HomeBand>
        <HomeBand shift={layout.shift.featured} hidden={!visible.featured}>
          <A2 c={text.featured} />
        </HomeBand>
        <HomeBand shift={layout.shift.ready} hidden={!visible.ready}>
          <A3 c={text.ready} />
        </HomeBand>
        <HomeBand shift={layout.shift.occasion} hidden={!visible.occasion}>
          <A5 c={text.occasion} />
        </HomeBand>
        <HomeBand shift={layout.shift.recipient} hidden={!visible.recipient}>
          <A6 c={text.recipient} />
        </HomeBand>
        <HomeBand shift={layout.shift.craft} hidden={!visible.craft}>
          <A9 c={text.craft} />
        </HomeBand>
        <HomeBand shift={layout.shift.story} hidden={!visible.story}>
          <A11 c={text.story} />
        </HomeBand>
        {/* Header last: A-1's opaque module background covers y32-98, and the
          header (chrome, not part of any module) must paint above it. */}
        <HomeHeader />
      </ScaleFrame>
      {/* Outside the fixed 5193 canvas on purpose — see SiteLegalFooter. */}
      <SiteLegalFooter />
    </>
  );
}
