/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * Module A-3 (Figma node 2380:422) of the simplified homepage frame: the two
 * Ready-to-Ship rows. Coordinates/colors/fonts are verbatim Figma REST values
 * on the 430px stage; y-range 1405–1732.
 *
 * 2026-08-04 sync: the band still carries the design's "New Arrivals and Ready
 * to Ship" name but the New Arrivals half — hero image, copy card, the two
 * pendant cards and both rows of pagination dots — was deleted at source, so
 * the band went 933px → 463px.
 *
 * 2026-08-07 sync: the **Real Rose Promise** half went the same way — the
 * "—   ✿   —" ornament, the heading and all four benefit tiles are deleted in
 * the new frame, taking the band 463px → 327px. That removed this file's
 * second named band (PROMISE), so only READY-TO-SHIP remains, and the strip's
 * four editable promise fields left the admin registry with it. The 136px is
 * given back to the stage by `band.trim` in lib/home-content/layout.ts rather
 * than by rewriting every later band's coordinates.
 */

import Link from "next/link";
import { abs } from "@/lib/figma-layout";
import { playfair } from "@/lib/fonts";
import { HomePhoto } from "@/components/home/HomePhoto";
import type { HomeText } from "@/lib/home-content/registry";

/* 2380:439 / 2380:446 · the two Ready-to-Ship rows. Same card, same photo,
   same crop — the design repeats one product because the real catalogue is
   still OQ-3 placeholder content. */
const ROWS = [
  { x: 24, y: 1465, w: 386 },
  { x: 25, y: 1577, w: 385 },
] as const;

export function A3({ c }: { c: HomeText["ready"] }) {
  return (
    <>
      {/* 2380:422 · module background — decoration, deliberately unnamed */}
      <div style={{ ...abs(0, 1405, 430, 327), background: "#FFF6EC" }} />

      {/* 2380:423 · Ready to Ship heading */}
      <div
        data-el="HOME-READY-TO-SHIP-TITLE"
        data-field="ready.title"
        className={playfair.className}
        style={{
          ...abs(26, 1423, 230),
          fontSize: 24,
          lineHeight: "30px",
          color: "#3B2F2F",
          fontWeight: 500,
          whiteSpace: "nowrap",
        }}
      >
        {c.title}
      </div>
      {/* 2380:424 · "View all →" (rendered glyph strip) */}
      <Link
        data-el="HOME-READY-TO-SHIP-VIEW-ALL-LINK"
        data-field="ready.view_all_href"
        href={c.view_all_href}
        style={{ ...abs(350, 1433, 80, 20), display: "block" }}
      >
        <img
          src="/eldreve/home/159-70.svg"
          alt="View all →"
          width={80}
          height={20}
          style={{
            display: "block",
            objectFit: "none",
            objectPosition: "left center",
          }}
        />
      </Link>

      {/* 2380:439 / 2380:446 · Ready-to-Ship rows */}
      {ROWS.map((row, i) => (
        <Link
          key={row.y}
          data-el={`HOME-READY-TO-SHIP-PRODUCT-CARD-${i + 1}`}
          data-field="ready.card_href"
          className="gr-card-zoom"
          href={c.card_href}
          style={{
            ...abs(row.x, row.y, row.w, 99),
            display: "block",
            background: "#FFF6EC",
            boxShadow: "inset 0 0 0 1px #E5D9C9",
            borderRadius: 10,
          }}
        >
          {/* image window — 15px corners on a 10px card, per design */}
          <div
            style={{
              ...abs(0, 0, 170, 99),
              borderRadius: "15px 0 0 15px",
              overflow: "hidden",
            }}
          >
            {/* Source crop, offsets negative by design — HomePhoto keeps them
                verbatim for the design's own photo and falls back to a plain
                cover fill once the owner uploads a different one. */}
            <HomePhoto
              section="ready"
              field="card_photo"
              value={c.card_photo}
              alt={c.card_photo_alt}
              box={{ w: 170, h: 99 }}
              design={{
                x: -34,
                y: -689,
                w: 588,
                h: 896,
                objectFit: "cover",
              }}
              dataEl={`HOME-READY-TO-SHIP-PRODUCT-IMG-${i + 1}`}
              className="gr-photo"
            />
          </div>
          <div
            data-el={`HOME-READY-TO-SHIP-PRODUCT-TITLE-${i + 1}`}
            data-field="ready.card_title"
            className={playfair.className}
            style={{
              ...abs(186, 12.5, 180),
              fontSize: 13,
              lineHeight: "19px",
              color: "#3B2F2F",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            {c.card_title}
          </div>
          {/* price/meta strip (rendered glyph strip) */}
          <img
            data-el={`HOME-READY-TO-SHIP-PRODUCT-META-${i + 1}`}
            data-field="ready.card_meta"
            src="/eldreve/home/159-80.svg"
            alt="$69.00 · Ships in 1–2 business days · View Product →"
            width={180}
            height={36}
            style={{
              ...abs(186, 50.5, 180, 36),
              display: "block",
              objectFit: "none",
              objectPosition: "left center",
            }}
          />
        </Link>
      ))}
    </>
  );
}
