/**
 * ROLE OF THIS FILE
 * `/preview/home/[section]` — ONE homepage band, drawn on its own, with no
 * promo bar above it, no header over it and no bottom tab bar under it. The
 * admin's Content → Home page screen frames this in an iframe at the top of
 * every section, so a teammate editing the Craft copy sees the Craft band
 * rather than having to find it inside a 5000px page.
 *
 * WHY IT IS A STOREFRONT ROUTE AND NOT AN ADMIN ONE
 * `/admin/*` loads Polaris' stylesheet and mounts the admin shell. A band
 * rendered under that would be a band rendered with a different global CSS
 * reset — which is exactly the thing a pixel-exact preview cannot afford. Here
 * it inherits the same root layout, the same globals.css and the same fonts the
 * live homepage does, so what it shows IS what `/` shows.
 *
 * IT IS STILL ADMIN-ONLY
 * `requireAdmin()` (the same check every admin server action uses) 404s anyone
 * else, because this route deliberately renders a section EVEN WHEN THE OWNER
 * HAS HIDDEN IT — you have to be able to see what you are about to switch back
 * on. The proxy's matcher covers only `/admin` and `/api/admin`, so this call
 * is the whole guard, and it is the one that actually holds.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ScaleFrame, PromoBar } from "@/components/chrome";
import { HomeBand } from "@/components/home/HomeBand";
import { homeBand } from "@/components/home/bands";
import { requireAdmin } from "@/lib/admin/auth";
import { playfair } from "@/lib/fonts";
import { getHomeContent } from "@/lib/home-content";
import { homePreviewBand } from "@/lib/home-content/preview";
import { railTiming } from "@/lib/home-content/rail-timing";

/** Never cached and never indexed: it is a tool, not a page of the site. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Section preview" },
  robots: { index: false, follow: false },
};

export default async function HomeSectionPreviewPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  await requireAdmin();
  const { section } = await params;
  const band = homePreviewBand(section);
  if (!band) notFound();

  const { text, overridden } = await getHomeContent();
  const timing = railTiming(
    text.motion.rail_cycle_ms,
    text.motion.rail_glide_ms,
  );

  return (
    // The stage is the band's own height, and the band slides up by its own
    // y-offset — so every element inside keeps the imported coordinate it has
    // on the live page. `nav={false}` drops the shared bottom tab bar.
    <ScaleFrame
      height={band.h}
      background="#FFF6EC"
      fontClass={playfair.className}
      nav={false}
    >
      <HomeBand shift={-band.y}>
        {band.from === "promo" ? (
          <PromoBar
            slogan={text.promo.slogan}
            isDefault={!overridden.has("promo.slogan")}
            variant="brown"
          />
        ) : (
          homeBand(band.from, text, timing)
        )}
      </HomeBand>
    </ScaleFrame>
  );
}
