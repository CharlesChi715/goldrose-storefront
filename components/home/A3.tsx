/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * Module A-3 (Figma node 2380:422) of the simplified homepage frame: two
 * Ready-to-Ship rows and the Real Rose Promise strip. Coordinates/colors/fonts
 * are verbatim Figma REST values on the 430px stage; y-range 1405–1868.
 *
 * 2026-08-04 sync: the band still carries the design's "New Arrivals and Ready
 * to Ship" name but the New Arrivals half — hero image, copy card, the two
 * pendant cards and both rows of pagination dots — was deleted at source, so
 * the band went 933px → 463px. What is left has identical internals to the
 * previous revision; only the offsets moved.
 *
 * This one file draws TWO named bands — READY-TO-SHIP and PROMISE — as flat
 * siblings with no per-band wrapper element, so each band's `data-el` names
 * start at its heading.
 */

import Link from "next/link";
import { abs } from "@/lib/figma-layout";
import { playfair, notoSC } from "@/lib/fonts";

/* 2380:427…2380:438 · the four Real Rose Promise tiles. Identical structure,
   so only the icon render, its width and the two label lines differ; x/labelX
   are relative to the 382×52 strip and each tile's own 90×52 box. */
const PROMISE = [
  {
    x: 0,
    icon: "/veloria/home/159-84.svg",
    iconX: 38,
    iconW: 14,
    alt: "✿",
    labelX: 24.5,
    labelW: 41,
    label: "Made from\nReal Roses",
  },
  {
    x: 97,
    icon: "/veloria/home/159-87.svg",
    iconX: 38.5,
    iconW: 13,
    alt: "✦",
    labelX: 29,
    labelW: 32,
    label: "Hand\nFinished",
  },
  {
    x: 194,
    icon: "/veloria/home/159-90.svg",
    iconX: 38,
    iconW: 14,
    alt: "◇",
    labelX: 28.5,
    labelW: 33,
    label: "Quality\nChecked",
  },
  {
    x: 291,
    icon: "/veloria/home/159-93.svg",
    iconX: 38,
    iconW: 14,
    alt: "▣",
    labelX: 25.5,
    labelW: 39,
    label: "Gift-Ready\nPackaging",
  },
] as const;

/* 2380:439 / 2380:446 · the two Ready-to-Ship rows. Same card, same photo,
   same crop — the design repeats one product because the real catalogue is
   still OQ-3 placeholder content. */
const ROWS = [
  { x: 24, y: 1465, w: 386 },
  { x: 25, y: 1577, w: 385 },
] as const;

export function A3() {
  return (
    <>
      {/* 2380:422 · module background — decoration, deliberately unnamed */}
      <div style={{ ...abs(0, 1405, 430, 463), background: "#FFF6EC" }} />

      {/* 2380:423 · Ready to Ship heading */}
      <div
        data-el="HOME-READY-TO-SHIP-TITLE"
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
        Ready to Ship
      </div>
      {/* 2380:424 · "View all →" (rendered glyph strip) */}
      <Link
        data-el="HOME-READY-TO-SHIP-VIEW-ALL-LINK"
        href="/shop"
        style={{ ...abs(350, 1433, 80, 20), display: "block" }}
      >
        <img
          src="/veloria/home/159-70.svg"
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
          className="gr-card-zoom"
          href="/shop"
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
            {/* source crop, offsets are negative by design */}
            <img
              data-el={`HOME-READY-TO-SHIP-PRODUCT-IMG-${i + 1}`}
              className="gr-photo"
              src="/veloria/home/159-78.png"
              alt="Mini rose dome with light"
              width={588}
              height={896}
              style={{
                ...abs(-34, -689, 588, 896),
                display: "block",
                objectFit: "cover",
                maxWidth: "none",
              }}
            />
          </div>
          <div
            data-el={`HOME-READY-TO-SHIP-PRODUCT-TITLE-${i + 1}`}
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
            Mini Rose Dome + Light
          </div>
          {/* price/meta strip (rendered glyph strip) */}
          <img
            data-el={`HOME-READY-TO-SHIP-PRODUCT-META-${i + 1}`}
            src="/veloria/home/159-80.svg"
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

      {/* 2380:453 · "—   ✿   —" ornament (rendered glyph strip) */}
      <img
        data-el="HOME-PROMISE-ORNAMENT"
        src="/veloria/home/2380-453.svg"
        alt="— ✿ —"
        width={140}
        height={22}
        style={{
          ...abs(143, 1726, 140, 22),
          display: "block",
          objectFit: "none",
          objectPosition: "center center",
        }}
      />

      {/* 2380:425 · Real Rose Promise heading */}
      <div
        data-el="HOME-PROMISE-TITLE"
        className={playfair.className}
        style={{
          ...abs(85, 1763, 260),
          fontSize: 20,
          lineHeight: "26.66px",
          color: "#3B2F2F",
          fontWeight: 500,
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        Real Rose Promise
      </div>

      {/* 2380:426 · Real Rose Promise benefits row */}
      <div
        data-el="HOME-PROMISE-SECTION"
        style={{ ...abs(24, 1798, 382, 52), overflow: "hidden" }}
      >
        {PROMISE.map((p, i) => (
          <div
            key={p.x}
            data-el={`HOME-PROMISE-BENEFIT-CARD-${i + 1}`}
            style={{ ...abs(p.x, 0, 90, 52), overflow: "hidden" }}
          >
            <img
              data-el={`HOME-PROMISE-BENEFIT-ICON-${i + 1}`}
              src={p.icon}
              alt={p.alt}
              width={p.iconW}
              height={17}
              style={{
                ...abs(p.iconX, 6.5, p.iconW, 17),
                display: "block",
                objectFit: "none",
                objectPosition: "left center",
              }}
            />
            <div
              data-el={`HOME-PROMISE-BENEFIT-TEXT-${i + 1}`}
              className={notoSC.className}
              style={{
                ...abs(p.labelX, 25.5, p.labelW),
                fontSize: 8,
                lineHeight: "10px",
                color: "#3B2F2F",
                fontWeight: 400,
                textAlign: "center",
                whiteSpace: "pre-line",
              }}
            >
              {p.label}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
