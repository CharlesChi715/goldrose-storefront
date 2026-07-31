/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * Module A-3 (Figma node 138:59) of the VELORIA homepage frame: the
 * "New Arrivals and Ready to Ship" band — New Arrivals hero + pendant card
 * pair, two Ready-to-Ship rows, carousel dots, and the Real Rose Promise
 * strip. Coordinates/colors/fonts are verbatim Figma REST values on the
 * 430px stage; y-range 1484–2417.
 *
 * This one file draws THREE named bands — NEW-ARRIVALS, READY-TO-SHIP and
 * PROMISE — as flat siblings with no per-band
 * wrapper element, so each band's `data-el` names start at its heading.
 */

import Link from "next/link";
import { abs } from "@/lib/figma-layout";
import { playfair, notoSC } from "@/lib/fonts";

export function A3() {
  return (
    <>
      {/* 138:59 · module background — decoration, deliberately unnamed */}
      <div style={{ ...abs(0, 1484, 430, 933), background: "#FFF6EC" }} />

      {/* 158:69 · New Arrivals heading */}
      <div
        data-el="HOME-NEW-ARRIVALS-TITLE"
        className={playfair.className}
        style={{
          ...abs(24, 1488, 240),
          fontSize: 25,
          lineHeight: "30px",
          color: "#3B2F2F",
          fontWeight: 500,
          whiteSpace: "nowrap",
        }}
      >
        New Arrivals
      </div>
      {/* 158:70 · "View all →" (rendered glyph strip) */}
      <Link
        data-el="HOME-NEW-ARRIVALS-VIEW-ALL-LINK"
        href="/shop"
        style={{ ...abs(349, 1501, 78, 20), display: "block" }}
      >
        <img
          src="/veloria/home/158-70.svg"
          alt="View all →"
          width={78}
          height={20}
          style={{
            display: "block",
            objectFit: "none",
            objectPosition: "left center",
          }}
        />
      </Link>

      {/* 158:71 · New Arrivals hero image */}
      <div
        data-el="HOME-NEW-ARRIVALS-HERO-IMG"
        style={{
          ...abs(24, 1532, 384, 170),
          borderRadius: "15px 15px 0 0",
          overflow: "hidden",
        }}
      >
        {/* 378:195 · bleed crop, wider than the frame */}
        <img
          src="/veloria/home/378-195.png"
          alt="Gold-dipped roses from the new collection"
          width={525}
          height={192}
          style={{
            ...abs(-96, -10, 525, 192),
            display: "block",
            objectFit: "cover",
            maxWidth: "none",
          }}
        />
      </div>
      {/* 158:73 · New Arrivals hero copy */}
      <div
        data-el="HOME-NEW-ARRIVALS-HERO-CARD"
        style={{
          ...abs(24, 1702, 384, 95),
          background: "#FFF6EC",
          boxShadow: "inset 0 0 0 1px #E5D9C9",
          borderRadius: "0 0 10px 10px",
          overflow: "hidden",
        }}
      >
        {/* 158:74 */}
        <div
          data-el="HOME-NEW-ARRIVALS-EYEBROW-TEXT"
          className={notoSC.className}
          style={{
            ...abs(15, 10, 180),
            fontSize: 9,
            lineHeight: "12px",
            color: "#D4AF37",
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          NEW COLLECTION
        </div>
        {/* 158:75 */}
        <div
          data-el="HOME-NEW-ARRIVALS-HERO-TITLE"
          className={playfair.className}
          style={{
            ...abs(15, 24, 250),
            fontSize: 20,
            lineHeight: "24px",
            color: "#3B2F2F",
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          The Eternal Rose Edit
        </div>
        {/* 158:76 */}
        <div
          data-el="HOME-NEW-ARRIVALS-HERO-TEXT"
          className={notoSC.className}
          style={{
            ...abs(15, 52, 280),
            fontSize: 10,
            lineHeight: "15px",
            color: "#3B2F2F",
            fontWeight: 400,
            whiteSpace: "nowrap",
          }}
        >
          Discover new colors, forms and gift-ready designs.
        </div>
        {/* 158:77 · "Explore New Arrivals →" (rendered glyph strip) */}
        <Link
          data-el="HOME-NEW-ARRIVALS-EXPLORE-LINK"
          href="/shop"
          style={{ ...abs(15, 72, 180, 18), display: "block" }}
        >
          <img
            src="/veloria/home/158-77.svg"
            alt="Explore New Arrivals →"
            width={180}
            height={18}
            style={{
              display: "block",
              objectFit: "none",
              objectPosition: "left center",
            }}
          />
        </Link>
      </div>

      {/* 378:209 · pendant card 1 */}
      <Link
        data-el="HOME-NEW-ARRIVALS-PRODUCT-CARD-1"
        className="gr-card-zoom"
        href="/shop"
        style={{
          ...abs(24, 1808, 182, 148),
          display: "block",
          borderRadius: 15,
          boxShadow: "inset 0 0 0 1px #E5D9C9",
        }}
      >
        {/* 378:210 · image window */}
        <div
          style={{
            ...abs(0, 0, 182, 96),
            borderRadius: "15px 15px 0 0",
            overflow: "hidden",
          }}
        >
          {/* 378:211 · source crop, offsets are negative by design */}
          <img
            data-el="HOME-NEW-ARRIVALS-PRODUCT-IMG-1"
            className="gr-photo"
            src="/veloria/home/378-211.png"
            alt="Gold rose pendant necklace"
            width={639}
            height={817}
            style={{
              ...abs(-66, -313, 639, 817),
              display: "block",
              maxWidth: "none",
            }}
          />
        </div>
        {/* 378:212 */}
        <div
          data-el="HOME-NEW-ARRIVALS-PRODUCT-TEXT-1"
          className={notoSC.className}
          style={{
            ...abs(12, 100, 158),
            fontSize: 10,
            lineHeight: "15px",
            color: "#3B2F2F",
            fontWeight: 400,
            whiteSpace: "pre-line",
          }}
        >
          {"Gold Rose Pendant Necklace\n$89.00"}
        </div>
      </Link>
      {/* 378:203 · pendant card 2 */}
      <Link
        data-el="HOME-NEW-ARRIVALS-PRODUCT-CARD-2"
        className="gr-card-zoom"
        href="/shop"
        style={{
          ...abs(226, 1808, 182, 148),
          display: "block",
          borderRadius: 15,
          boxShadow: "inset 0 0 0 1px #E5D9C9",
        }}
      >
        {/* 378:204 · image window */}
        <div
          style={{
            ...abs(0, 0, 182, 96),
            borderRadius: "15px 15px 0 0",
            overflow: "hidden",
          }}
        >
          {/* 378:205 · source crop bleeds 20px above the window */}
          <img
            data-el="HOME-NEW-ARRIVALS-PRODUCT-IMG-2"
            className="gr-photo"
            src="/veloria/home/378-205.png"
            alt="Gold rose pendant necklace"
            width={182}
            height={116}
            style={{ ...abs(0, -20, 182, 116), display: "block" }}
          />
        </div>
        {/* 378:206 */}
        <div
          data-el="HOME-NEW-ARRIVALS-PRODUCT-TEXT-2"
          className={notoSC.className}
          style={{
            ...abs(12, 100, 158),
            fontSize: 10,
            lineHeight: "15px",
            color: "#3B2F2F",
            fontWeight: 400,
            whiteSpace: "pre-line",
          }}
        >
          {"Gold Rose Pendant Necklace\n$89.00"}
        </div>
      </Link>

      {/* 378:214 · New Arrivals carousel dots — siblings with no wrapper, so
          indexed individually rather than sharing one group name. */}
      <div
        data-el="HOME-NEW-ARRIVALS-DOT-1"
        style={{
          ...abs(186, 1974, 7, 7),
          background: "#D4AF37",
          borderRadius: 9999,
        }}
      />
      <div
        data-el="HOME-NEW-ARRIVALS-DOT-2"
        style={{
          ...abs(204, 1974, 7, 7),
          background: "#E5D9C9",
          borderRadius: 9999,
        }}
      />
      <div
        data-el="HOME-NEW-ARRIVALS-DOT-3"
        style={{
          ...abs(221, 1974, 7, 7),
          background: "#E5D9C9",
          borderRadius: 9999,
        }}
      />
      <div
        data-el="HOME-NEW-ARRIVALS-DOT-4"
        style={{
          ...abs(238, 1974, 7, 7),
          background: "#E5D9C9",
          borderRadius: 9999,
        }}
      />

      {/* 159:69 · Ready to Ship heading */}
      <div
        data-el="HOME-READY-TO-SHIP-TITLE"
        className={playfair.className}
        style={{
          ...abs(24, 1990, 230),
          fontSize: 24,
          lineHeight: "30px",
          color: "#3B2F2F",
          fontWeight: 500,
          whiteSpace: "nowrap",
        }}
      >
        Ready to Ship
      </div>
      {/* 159:70 · "View all →" (rendered glyph strip) */}
      <Link
        data-el="HOME-READY-TO-SHIP-VIEW-ALL-LINK"
        href="/shop"
        style={{ ...abs(348, 2000, 80, 20), display: "block" }}
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

      {/* 378:201 · Ready-to-Ship card 1 */}
      <Link
        data-el="HOME-READY-TO-SHIP-PRODUCT-CARD-1"
        className="gr-card-zoom"
        href="/shop"
        style={{
          ...abs(22, 2032, 386, 99),
          display: "block",
          background: "#FFF6EC",
          boxShadow: "inset 0 0 0 1px #E5D9C9",
          borderRadius: 10,
        }}
      >
        {/* 159:77 · image window (15px corners on a 10px card, per design) */}
        <div
          style={{
            ...abs(0, 0, 170, 99),
            borderRadius: "15px 0 0 15px",
            overflow: "hidden",
          }}
        >
          {/* 159:78 · source crop, offsets are negative by design */}
          <img
            data-el="HOME-READY-TO-SHIP-PRODUCT-IMG-1"
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
        {/* 159:79 */}
        <div
          data-el="HOME-READY-TO-SHIP-PRODUCT-TITLE-1"
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
        {/* 159:80 · price/meta strip (rendered glyph strip) */}
        <img
          data-el="HOME-READY-TO-SHIP-PRODUCT-META-1"
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
      {/* 378:221 · Ready-to-Ship card 2 */}
      <Link
        data-el="HOME-READY-TO-SHIP-PRODUCT-CARD-2"
        href="/shop"
        style={{
          ...abs(23, 2144, 385, 99),
          display: "block",
          background: "#FFF6EC",
          boxShadow: "inset 0 0 0 1px #E5D9C9",
          borderRadius: 10,
        }}
      >
        {/* 378:223 · image window */}
        <div
          style={{
            ...abs(0, 0, 170, 99),
            borderRadius: "15px 0 0 15px",
            overflow: "hidden",
          }}
        >
          {/* 378:224 · same source crop as card 1 */}
          <img
            data-el="HOME-READY-TO-SHIP-PRODUCT-IMG-2"
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
        {/* 378:226 */}
        <div
          data-el="HOME-READY-TO-SHIP-PRODUCT-TITLE-2"
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
        {/* 378:227 · price/meta strip (rendered glyph strip) */}
        <img
          data-el="HOME-READY-TO-SHIP-PRODUCT-META-2"
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

      {/* 378:229 · Ready-to-Ship carousel dots */}
      <div
        data-el="HOME-READY-TO-SHIP-DOT-1"
        style={{
          ...abs(182, 2268, 7, 7),
          background: "#D4AF37",
          borderRadius: 9999,
        }}
      />
      <div
        data-el="HOME-READY-TO-SHIP-DOT-2"
        style={{
          ...abs(200, 2268, 7, 7),
          background: "#E5D9C9",
          borderRadius: 9999,
        }}
      />
      <div
        data-el="HOME-READY-TO-SHIP-DOT-3"
        style={{
          ...abs(217, 2268, 7, 7),
          background: "#E5D9C9",
          borderRadius: 9999,
        }}
      />
      <div
        data-el="HOME-READY-TO-SHIP-DOT-4"
        style={{
          ...abs(234, 2268, 7, 7),
          background: "#E5D9C9",
          borderRadius: 9999,
        }}
      />

      {/* 378:235 · "—   ✿   —" ornament (rendered glyph strip) */}
      <img
        data-el="HOME-PROMISE-ORNAMENT"
        src="/veloria/home/378-235.svg"
        alt="— ✿ —"
        width={140}
        height={22}
        style={{
          ...abs(141, 2293, 140, 22),
          display: "block",
          objectFit: "none",
          objectPosition: "center center",
        }}
      />

      {/* 159:81 · Real Rose Promise heading */}
      <div
        data-el="HOME-PROMISE-TITLE"
        className={playfair.className}
        style={{
          ...abs(83, 2330, 260),
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

      {/* 159:82 · Real Rose Promise benefits row */}
      <div
        data-el="HOME-PROMISE-SECTION"
        style={{ ...abs(22, 2365, 382, 52), overflow: "hidden" }}
      >
        {/* 159:83 · Made from Real Roses */}
        <div
          data-el="HOME-PROMISE-BENEFIT-CARD-1"
          style={{ ...abs(0, 0, 90, 52), overflow: "hidden" }}
        >
          <img
            data-el="HOME-PROMISE-BENEFIT-ICON-1"
            src="/veloria/home/159-84.svg"
            alt="✿"
            width={14}
            height={17}
            style={{
              ...abs(38, 6.5, 14, 17),
              display: "block",
              objectFit: "none",
              objectPosition: "left center",
            }}
          />
          <div
            data-el="HOME-PROMISE-BENEFIT-TEXT-1"
            className={notoSC.className}
            style={{
              ...abs(24.5, 25.5, 41),
              fontSize: 8,
              lineHeight: "10px",
              color: "#3B2F2F",
              fontWeight: 400,
              textAlign: "center",
              whiteSpace: "pre-line",
            }}
          >
            {"Made from\nReal Roses"}
          </div>
        </div>
        {/* 159:86 · Hand Finished */}
        <div
          data-el="HOME-PROMISE-BENEFIT-CARD-2"
          style={{ ...abs(97, 0, 90, 52), overflow: "hidden" }}
        >
          <img
            data-el="HOME-PROMISE-BENEFIT-ICON-2"
            src="/veloria/home/159-87.svg"
            alt="✦"
            width={13}
            height={17}
            style={{
              ...abs(38.5, 6.5, 13, 17),
              display: "block",
              objectFit: "none",
              objectPosition: "left center",
            }}
          />
          <div
            data-el="HOME-PROMISE-BENEFIT-TEXT-2"
            className={notoSC.className}
            style={{
              ...abs(29, 25.5, 32),
              fontSize: 8,
              lineHeight: "10px",
              color: "#3B2F2F",
              fontWeight: 400,
              textAlign: "center",
              whiteSpace: "pre-line",
            }}
          >
            {"Hand\nFinished"}
          </div>
        </div>
        {/* 159:89 · Quality Checked */}
        <div
          data-el="HOME-PROMISE-BENEFIT-CARD-3"
          style={{ ...abs(194, 0, 90, 52), overflow: "hidden" }}
        >
          <img
            data-el="HOME-PROMISE-BENEFIT-ICON-3"
            src="/veloria/home/159-90.svg"
            alt="◇"
            width={14}
            height={17}
            style={{
              ...abs(38, 6.5, 14, 17),
              display: "block",
              objectFit: "none",
              objectPosition: "left center",
            }}
          />
          <div
            data-el="HOME-PROMISE-BENEFIT-TEXT-3"
            className={notoSC.className}
            style={{
              ...abs(28.5, 25.5, 33),
              fontSize: 8,
              lineHeight: "10px",
              color: "#3B2F2F",
              fontWeight: 400,
              textAlign: "center",
              whiteSpace: "pre-line",
            }}
          >
            {"Quality\nChecked"}
          </div>
        </div>
        {/* 159:92 · Gift-Ready Packaging */}
        <div
          data-el="HOME-PROMISE-BENEFIT-CARD-4"
          style={{ ...abs(291, 0, 90, 52), overflow: "hidden" }}
        >
          <img
            data-el="HOME-PROMISE-BENEFIT-ICON-4"
            src="/veloria/home/159-93.svg"
            alt="▣"
            width={14}
            height={17}
            style={{
              ...abs(38, 6.5, 14, 17),
              display: "block",
              objectFit: "none",
              objectPosition: "left center",
            }}
          />
          <div
            data-el="HOME-PROMISE-BENEFIT-TEXT-4"
            className={notoSC.className}
            style={{
              ...abs(25.5, 25.5, 39),
              fontSize: 8,
              lineHeight: "10px",
              color: "#3B2F2F",
              fontWeight: 400,
              textAlign: "center",
              whiteSpace: "pre-line",
            }}
          >
            {"Gift-Ready\nPackaging"}
          </div>
        </div>
      </div>
    </>
  );
}
