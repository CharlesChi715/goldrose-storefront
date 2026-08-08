"use client";

/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * B-1 · Shopping Bag — re-imported 2026-08-07 from the redesigned frames
 * `1523:3059` (has items) and `2976:375` (empty). Both are 430×932; the page
 * was 1726 before, because the delivery DELETED four of its six sections at
 * source:
 *
 *   03 / Gift Services   the four add-on cards        — gone
 *   04 / Product Story   "A Rose Made to Last" panel  — detached to a loose
 *                        canvas frame (1523:3132), not Ready for dev
 *   05 / Note + Summary  gift note, order summary,
 *                        "safe pay" bar, payment marks, FAQ rows — gone
 *
 * What survives is 01 (header, benefits, shipping meter), 02 (the line-item
 * card) and 06 (concierge + checkout bar). The line card's own geometry is
 * untouched; it only moved up 5px. The member-benefit labels are new copy
 * ("Secure Checkout / Gift-Ready Packaging / Fast Dispatch", exports
 * 2978-434…436), and the shipping line lost its "· $0 remaining" suffix.
 *
 * LIVE CART, NOT PLACEHOLDER ROWS. The old build drew the design's own
 * "Artisan Blue Rose" row because nothing was wired. The new delivery ships an
 * explicit empty state, which only means anything against a real cart, so this
 * screen now reads localStorage through useCart() — the same store /checkout
 * prices — and shows the empty frame when there is nothing in it.
 *
 * HOW THE CANVAS IS SIZED. `02 / Product Card` is 544 tall and holds ONE
 * 272px card at a 12px inset; a real bag can hold more, so each extra line
 * adds one 284px pitch and pushes section 06 (and the canvas) down with it.
 * At one line every coordinate is the frame's own. The canvas is the frame's
 * 932 plus the 59px tab bar, which is how the old build sized it too (the
 * frame's 10px tail is the gap before the bar) — the difference is that these
 * frames no longer draw a nav band of their own.
 *
 * STILL THE DESIGN'S OWN WORDS, NOT OURS. Both of these predate this sync and
 * are carried over verbatim rather than quietly reworded; see
 * /agent-delivery/sessions/figma-sync-newsletter-bag-08-07-feat-figma-sync.md.
 * AI-TAG(AI-041): OWNER-DECISION — the shipping card states COMPLIMENTARY
 * SHIPPING UNLOCKED and same-day dispatch unconditionally, on an empty bag
 * too. Real rates are OQ-2 and still unanswered, so this is a shipping
 * promise the store cannot yet honour.
 * AI-TAG(AI-042): PLACEHOLDER — "Move to Wishlist" has no feature behind it.
 * Only "Remove" is wired; the other half is inert text. ASK AURI is likewise
 * static, as it was before this sync.
 *
 * Brand: the header wordmark is an image reading "ELDREVE" — the brand itself
 * (DQ-34) — set as Playfair text at the image's box, per the OrderConfirmed
 * precedent. The concierge line says VELORIA in the frame; that is one of the
 * three stale names AI-037 says must not be imported verbatim, so it reads
 * ELDREVE here.
 */

import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { ScaleFrame } from "@/components/chrome";
import { abs } from "@/lib/figma-layout";
import { fileUrl } from "@/lib/files-url";
import { goudy, notoSC, playfair } from "@/lib/fonts";
import { formatMoney } from "@/lib/money";
import { useCart, type CartLineView } from "@/lib/cart/store";
import type { CatalogProduct } from "@/lib/supabase/types.ts";

const A = "/eldreve/screens";

const INK = "#3B2F2F";
const GREEN = "#09442E";
const GOLD_INK = "#C88217";
const CREAM = "#FFF6EC";
const HAIRLINE_RING = "inset 0 0 0 1px #E5D9C9";

/** A 1×1 transparent GIF, so a product with no photo shows nothing at all
 *  rather than the design's rose (the /checkout precedent). */
const BLANK_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

/* ---------- the frame's own vertical arithmetic ---------- */

/** `02 / Product Card` starts here; `01 / Header + Benefits` is 0…232. */
const SECTION_TWO_TOP = 232;
/** Height of `02` as drawn, holding one card inset 12px from its top. */
const SECTION_TWO_HEIGHT = 544;
/** Card top inside `02`, and the pitch each further line adds (272 + 12). */
const CARD_INSET = 12;
const CARD_PITCH = 284;
/** `06 / Concierge + Checkout`: card at +0, sticky bar at +78, 146 tall. */
const SECTION_SIX_HEIGHT = 146;
const STICKY_OFFSET = 78;
/** Cream tail the frame leaves below section 06 — the gap before the bar. */
const FRAME_TAIL = 10;
/** The viewport-fixed tab bar these frames no longer draw themselves. */
const NAV_HEIGHT = 59;

/** The frame's own height, 932, is what these add up to at one line. */
function layoutFor(lineCount: number) {
  const sectionTwo =
    SECTION_TWO_HEIGHT + Math.max(0, lineCount - 1) * CARD_PITCH;
  const sectionSixTop = SECTION_TWO_TOP + sectionTwo;
  return {
    sectionSixTop,
    stickyTop: sectionSixTop + STICKY_OFFSET,
    canvasHeight: sectionSixTop + SECTION_SIX_HEIGHT + FRAME_TAIL + NAV_HEIGHT,
  };
}

/** The empty frame has no section 06 at all, so it is simply 932 + the bar. */
const EMPTY_CANVAS_HEIGHT = 932 + NAV_HEIGHT;

// 2978:434 / 435 / 436 — member-benefit labels. Each is glyph-led (▣ ✦ ♔),
// so it is Figma's own SVG render placed at the TEXT node's box; the SVG is
// cropped to its ink, hence objectFit:none at natural size. x is card-relative.
const BENEFITS = [
  { x: 10, w: 95, src: "2978-434", alt: "▣  Secure Checkout" },
  { x: 152, w: 115, src: "2978-435", alt: "✦  Gift-Ready Packaging" },
  { x: 314, w: 74, src: "2978-436", alt: "♔  Fast Dispatch" },
];

// 1523:3083 / 3085 / 3087 — craft-tag pills, card-relative. Identical 62×24
// boxes; the design centres each label in its own pill.
const TAG_SLOTS = [176, 244, 312];

/* ---------- 01 · Header + Benefits (1523:3061 / 2976:377) ---------- */

function HeaderAndBenefits() {
  return (
    <>
      {/* 1523:3062 Brand Navigation — clips. The leading 40×42 image is the
          frame's back arrow (layer "返回 2"), wired as the flow's BackButton;
          / is the fallback when the bag is the first page of the visit. */}
      <div style={{ ...abs(16, 15, 398, 42), overflow: "hidden" }}>
        <BackButton
          fallback="/"
          src={`${A}/1523-3063.png`}
          style={abs(0, 0, 40, 42)}
        />
        {/* 1523:3064 wordmark box (nav-rel 122,−6 152×54.84): ELDREVE for the
            frame's "ELDREVE" placeholder image — see the file header. */}
        <div
          className={playfair.className}
          style={{
            ...abs(122, -6, 152, 54.84),
            fontSize: 26,
            lineHeight: "54.84px",
            fontWeight: 600,
            color: INK,
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          ELDREVE
        </div>
      </div>

      {/* 1523:3065 page title */}
      <div
        className={playfair.className}
        style={{
          ...abs(16, 63, 184),
          fontSize: 29,
          lineHeight: "38.66px",
          fontWeight: 600,
          color: GREEN,
          whiteSpace: "nowrap",
        }}
      >
        Shopping Bag
      </div>

      {/* 2978:433 Member Benefits strip — 72% pink so the labels stay opaque */}
      <div
        style={{
          ...abs(16, 108, 398, 42),
          background: "rgba(247, 218, 225, 0.72)",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        {BENEFITS.map((b) => (
          <img
            key={b.src}
            src={`${A}/${b.src}.svg`}
            alt={b.alt}
            width={b.w}
            height={12}
            style={{
              ...abs(b.x, 15, b.w, 12),
              display: "block",
              objectFit: "none",
              objectPosition: "left center",
            }}
          />
        ))}
      </div>

      {/* 1523:3070 Complimentary Shipping panel — see AI-041 in the header:
          the promise is the design's, carried over unchanged. */}
      <div
        style={{
          ...abs(16, 156, 398, 74),
          background: "#FFFFFF",
          borderRadius: 12,
          boxShadow: HAIRLINE_RING,
          overflow: "hidden",
        }}
      >
        <img
          src={`${A}/749-108.svg`}
          alt="●  COMPLIMENTARY SHIPPING UNLOCKED"
          width={223}
          height={13}
          style={{
            ...abs(12, 10, 223, 13),
            display: "block",
            objectFit: "none",
            objectPosition: "left center",
          }}
        />
        {/* 1523:3072 — the 08-07 frame drops the old "· $0 remaining" tail */}
        <div
          className={notoSC.className}
          style={{
            ...abs(12, 35, 185),
            fontSize: 10,
            lineHeight: "12px",
            fontWeight: 400,
            color: INK,
            whiteSpace: "nowrap",
          }}
        >
          {"Order by 4:00 PM for same-day dispatch  "}
        </div>
        {/* 1523:3073 shipping meter — drawn full, as the design draws it */}
        <div
          style={{
            ...abs(12, 59, 374, 4),
            background: GREEN,
            borderRadius: 2,
          }}
        />
      </div>
    </>
  );
}

/* ---------- 02 · Product Card (1523:3075), one per cart line ---------- */

function LineCard({
  line,
  top,
  onChangeQuantity,
  onRemove,
}: {
  line: CartLineView;
  top: number;
  onChangeQuantity: (variantId: string, amount: number) => void;
  onRemove: (variantId: string) => void;
}) {
  const { product, variant, quantity } = line;
  const image = product.images[0] ?? null;
  const href = `/products/${product.handle}`;

  // The design's "Color · Deep sapphire ●" line, from the product's own
  // option names. The trailing ● was a swatch for the mock colour; a real
  // variant carries no colour value to paint, so it is dropped rather than
  // guessed at.
  const options = product.option_names
    .map((name, i) =>
      variant.option_values[i] ? `${name}  ·  ${variant.option_values[i]}` : "",
    )
    .filter(Boolean)
    .join("     ");

  // The design's "Presentation · Signature black gift box" sat on mock copy.
  // Nothing in the catalog describes packaging, so the slot takes the
  // product's first detail bullet, unlabelled, or stays empty.
  const detail = product.details[0] ?? "";

  const tags = product.tags.slice(0, TAG_SLOTS.length);
  const compareAt = variant.compare_at_price_cents;
  const wasTotal =
    compareAt !== null && compareAt > variant.price_cents
      ? compareAt * quantity
      : null;

  return (
    <div
      style={{
        ...abs(16, top, 398, 272),
        background: "#FFFFFF",
        borderRadius: 14,
        boxShadow: `${HAIRLINE_RING}, 0 4px 12px rgba(59, 47, 47, 0.08)`,
        overflow: "hidden",
      }}
    >
      {/* 1523:3076 thumbnail. objectFit:contain, not cover — the frame's
          148×244 portrait box matches neither spotlight area authored on the
          photo (the PDP's 398×250 nor the shop card's 203×204), so cropping
          to it would use a focal point chosen for a different shape. */}
      <Link href={href} style={{ ...abs(14, 14, 148, 244), display: "block" }}>
        <img
          data-live-text
          src={image ? fileUrl(image.path) : BLANK_PIXEL}
          alt={image?.alt ?? product.title}
          width={148}
          height={244}
          style={{
            display: "block",
            width: 148,
            height: 244,
            objectFit: "contain",
            borderRadius: 10,
          }}
        />
      </Link>

      {/* 1523:3079 title */}
      <Link
        href={href}
        data-live-text
        className={playfair.className}
        style={{
          ...abs(176, 16, 208),
          display: "block",
          fontSize: 22,
          lineHeight: "29.33px",
          fontWeight: 500,
          color: INK,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {product.short_name}
      </Link>

      {/* 1523:3080 option line */}
      <div
        data-live-text
        className={notoSC.className}
        style={{
          ...abs(176, 55, 208),
          fontSize: 12,
          lineHeight: "14.4px",
          fontWeight: 400,
          color: INK,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {options}
      </div>

      {/* 1523:3081 detail line */}
      <div
        data-live-text
        className={notoSC.className}
        style={{
          ...abs(176, 84, 208),
          fontSize: 11,
          lineHeight: "13.2px",
          fontWeight: 400,
          color: INK,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {detail}
      </div>

      {/* 1523:3082 craft tags — the product's own tags, up to the three
          pills the design draws; a product with no tags shows none. */}
      {tags.map((tag, i) => (
        <div
          key={tag}
          data-live-text
          style={{
            ...abs(TAG_SLOTS[i]!, 112, 62, 24),
            borderRadius: 12,
            boxShadow: `inset 0 0 0 1px ${GOLD_INK}`,
            overflow: "hidden",
          }}
        >
          <div
            className={notoSC.className}
            style={{
              ...abs(0, 7, 62),
              fontSize: 8,
              lineHeight: "9.6px",
              fontWeight: 500,
              color: GOLD_INK,
              textAlign: "center",
              whiteSpace: "nowrap",
            }}
          >
            {tag.toUpperCase()}
          </div>
        </div>
      ))}

      {/* 1523:3090 price row. The frame hard-places the struck-through price
          at x=271 because "$159.00" ends there; live prices are not all that
          wide, so the two sit in a baseline-aligned row instead and the
          strike-through follows the price however long it is. */}
      <div
        style={{
          ...abs(176, 147, 208, 35),
          display: "flex",
          alignItems: "baseline",
          gap: 8,
        }}
      >
        <span
          data-live-text
          className={playfair.className}
          style={{
            fontSize: 26,
            lineHeight: "34.66px",
            fontWeight: 500,
            color: GREEN,
            whiteSpace: "nowrap",
          }}
        >
          {formatMoney(line.lineTotal)}
        </span>
        {wasTotal !== null ? (
          <span
            data-live-text
            className={notoSC.className}
            style={{
              fontSize: 11,
              lineHeight: "13.2px",
              fontWeight: 400,
              color: "#736B66",
              textDecoration: "line-through",
              whiteSpace: "nowrap",
            }}
          >
            {formatMoney(wasTotal)}
          </span>
        ) : null}
      </div>

      {/* 1523:3093 quantity stepper — now real. The frame draws only the
          glyphs, so each takes the half of the 132×36 box it sits in as its
          hit area. */}
      <div
        style={{
          ...abs(176, 198, 132, 36),
          borderRadius: 8,
          boxShadow: HAIRLINE_RING,
          overflow: "hidden",
        }}
      >
        <button
          type="button"
          aria-label={`Remove one ${product.short_name}`}
          onClick={() => onChangeQuantity(variant.id, -1)}
          style={{
            ...abs(0, 0, 44, 36),
            background: "transparent",
            border: 0,
            padding: 0,
            cursor: "pointer",
          }}
        >
          {/* 1523:3094 is a U+2212 minus; Figma crops its SVG to the 9×2 bar */}
          <img
            src={`${A}/1523-3094.svg`}
            alt=""
            width={11}
            height={22}
            style={{
              ...abs(33, 7, 11, 22),
              display: "block",
              objectFit: "none",
              objectPosition: "left center",
            }}
          />
        </button>
        <div
          data-live-text
          className={notoSC.className}
          style={{
            ...abs(44, 9.5, 44),
            fontSize: 14,
            lineHeight: "16.8px",
            fontWeight: 500,
            color: INK,
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          {quantity}
        </div>
        <button
          type="button"
          aria-label={`Add one ${product.short_name}`}
          onClick={() => onChangeQuantity(variant.id, 1)}
          className={notoSC.className}
          style={{
            ...abs(88, 0, 44, 36),
            background: "transparent",
            border: 0,
            padding: 0,
            cursor: "pointer",
            fontSize: 18,
            lineHeight: "21.6px",
            fontWeight: 500,
            color: INK,
            textAlign: "left",
            textIndent: 0,
            paddingLeft: 0,
          }}
        >
          <span style={{ ...abs(0, 7, 11) }}>+</span>
        </button>
      </div>

      {/* 1523:3097 line-item actions. The design pads the slash with five
          spaces on each side; only Remove does anything (AI-042). */}
      <div
        className={notoSC.className}
        style={{
          ...abs(176, 248, 208),
          fontSize: 10,
          lineHeight: "12px",
          fontWeight: 500,
          color: GOLD_INK,
          whiteSpace: "pre",
        }}
      >
        <span>{"Move to Wishlist     /     "}</span>
        <button
          type="button"
          onClick={() => onRemove(variant.id)}
          style={{
            background: "transparent",
            border: 0,
            padding: 0,
            font: "inherit",
            color: "inherit",
            cursor: "pointer",
          }}
        >
          Remove
        </button>
      </div>
    </div>
  );
}

/* ---------- 02 · the empty bag (2976:390) ---------- */

function EmptyBag() {
  return (
    <>
      {/* 2978:444 — 329×139 box, centred both ways; the copy wraps itself */}
      <div
        className={goudy.className}
        style={{
          ...abs(50, 398, 329, 139),
          fontSize: 36,
          lineHeight: "53.57px",
          fontWeight: 500,
          color: GREEN,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        Something beautiful belongs here.
      </div>

      {/* 2976:427 → /shop (the frame's own prototype target) */}
      <Link
        href="/shop"
        style={{
          ...abs(90, 599, 250, 48),
          display: "block",
          background: INK,
          borderRadius: 10,
        }}
      >
        <div
          className={notoSC.className}
          style={{
            ...abs(16, 16, 191),
            fontSize: 13,
            lineHeight: "15.6px",
            fontWeight: 500,
            letterSpacing: 1.1,
            color: CREAM,
            whiteSpace: "nowrap",
          }}
        >
          EXPLORE THE COLLECTION
        </div>
        <img
          src={`${A}/I1523-3187_1523-389.svg`}
          alt=""
          width={15}
          height={18}
          style={{
            ...abs(219, 15, 15, 18),
            display: "block",
            objectFit: "none",
            objectPosition: "left center",
          }}
        />
      </Link>
    </>
  );
}

/* ---------- 06 · Concierge + Checkout (1523:3171) ---------- */

function ConciergeAndCheckout({
  top,
  stickyTop,
  total,
  saved,
}: {
  top: number;
  stickyTop: number;
  total: number;
  saved: number;
}) {
  return (
    <>
      {/* 1523:3172 Auri concierge card (ASK AURI is static — see the header) */}
      <div
        style={{
          ...abs(16, top, 398, 70),
          background: "#FFFFFF",
          borderRadius: 12,
          boxShadow: HAIRLINE_RING,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            ...abs(12, 13, 44, 44),
            background: "#F7DAE1",
            borderRadius: 22,
            overflow: "hidden",
          }}
        >
          <img
            src={`${A}/1523-3174.svg`}
            alt="✦"
            width={21}
            height={31}
            style={{
              ...abs(11.5, 6.5, 21, 31),
              display: "block",
              objectFit: "none",
              objectPosition: "left center",
            }}
          />
        </div>
        <div
          className={playfair.className}
          style={{
            ...abs(66, 13, 140),
            fontSize: 15,
            lineHeight: "19.99px",
            fontWeight: 500,
            color: INK,
            whiteSpace: "nowrap",
          }}
        >
          Need help choosing?
        </div>
        <div
          className={notoSC.className}
          style={{
            ...abs(66, 35, 226),
            fontSize: 9,
            lineHeight: "10.8px",
            fontWeight: 400,
            color: INK,
            whiteSpace: "nowrap",
          }}
        >
          Auri, your ELDREVE concierge, is here 24/7.
        </div>
        <div
          style={{
            ...abs(302, 18, 86, 34),
            background: INK,
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <div
            className={notoSC.className}
            style={{
              ...abs(23, 11.5, 40),
              fontSize: 9,
              lineHeight: "10.8px",
              fontWeight: 500,
              color: "#FFFFFF",
              whiteSpace: "nowrap",
            }}
          >
            ASK AURI
          </div>
        </div>
      </div>

      {/* 1523:3183 sticky checkout bar */}
      <div
        style={{
          ...abs(16, stickyTop, 398, 68),
          background: CREAM,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div
          data-live-text
          className={playfair.className}
          style={{
            ...abs(10, 11, 120),
            fontSize: 22,
            lineHeight: "29.33px",
            fontWeight: 500,
            color: INK,
            whiteSpace: "nowrap",
          }}
        >
          {formatMoney(total)}
        </div>
        {saved > 0 ? (
          <div
            data-live-text
            className={notoSC.className}
            style={{
              ...abs(10, 41, 120),
              fontSize: 9,
              lineHeight: "10.8px",
              fontWeight: 500,
              color: GOLD_INK,
              whiteSpace: "nowrap",
            }}
          >
            {`You save ${formatMoney(saved)}`}
          </div>
        ) : null}

        {/* 1523:3187 primary CTA → /checkout */}
        <Link
          href="/checkout"
          style={{
            ...abs(142, 10, 250, 48),
            display: "block",
            background: INK,
            borderRadius: 10,
          }}
        >
          <div
            className={notoSC.className}
            style={{
              ...abs(43, 16, 138),
              fontSize: 13,
              lineHeight: "15.6px",
              fontWeight: 500,
              letterSpacing: 1.1,
              color: CREAM,
              whiteSpace: "nowrap",
            }}
          >
            SECURE CHECKOUT
          </div>
          {/* the arrow is gold (#D4AF37) in the export */}
          <img
            src={`${A}/I1523-3187_1523-389.svg`}
            alt=""
            width={15}
            height={18}
            style={{
              ...abs(193, 15, 15, 18),
              display: "block",
              objectFit: "none",
              objectPosition: "left center",
            }}
          />
        </Link>
      </div>
    </>
  );
}

/* ---------- the screen ---------- */

export function BagScreen({ catalog }: { catalog: CatalogProduct[] }) {
  const { lines, subtotal, hydrated, changeQuantity, remove } =
    useCart(catalog);

  // Before hydration localStorage is unreadable, so the frame renders with no
  // cards rather than guessing — the /checkout precedent. Only once the store
  // has actually answered does an empty result mean an empty bag.
  const showEmpty = hydrated && lines.length === 0;
  const { sectionSixTop, stickyTop, canvasHeight } = layoutFor(
    Math.max(1, lines.length),
  );

  const saved = lines.reduce((sum, line) => {
    const was = line.variant.compare_at_price_cents;
    return was !== null && was > line.variant.price_cents
      ? sum + (was - line.variant.price_cents) * line.quantity
      : sum;
  }, 0);

  return (
    <ScaleFrame
      height={showEmpty ? EMPTY_CANVAS_HEIGHT : canvasHeight}
      background={CREAM}
      fontClass={notoSC.className}
      navActive="Bag"
    >
      <HeaderAndBenefits />
      {showEmpty ? (
        <EmptyBag />
      ) : (
        <>
          {lines.map((line, i) => (
            <LineCard
              key={line.variantId}
              line={line}
              top={SECTION_TWO_TOP + CARD_INSET + i * CARD_PITCH}
              onChangeQuantity={changeQuantity}
              onRemove={remove}
            />
          ))}
          <ConciergeAndCheckout
            top={sectionSixTop}
            stickyTop={stickyTop}
            total={subtotal}
            saved={saved}
          />
        </>
      )}
    </ScaleFrame>
  );
}
