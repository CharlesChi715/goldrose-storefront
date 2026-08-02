/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * The order-details / confirmation screen — pixel-exact implementation of
 * "shoppage-Product Details-Checkout-Order Details" (1541:362, 07-29
 * delivery; byte-identical twin "mepage-my orders-view details" 1523:3347).
 * The redesigned C-2: same green confirmation palette, condensed from 1540
 * to 1188, the icon chips now ride inside the cards, and the frame's own
 * glyph tab bar is gone. Serves /checkout/success (live order number/total/
 * method when the query carries them) and /account/orders/details (the
 * orders list's VIEW DETAILS target, all-mock).
 *
 * Wiring per the mechanism sheet: VIEW ORDER STATUS → /orders/track
 * (ORDER-DETAIL-VIEW-STATUS); the Help card → /care/chat, whole card
 * clickable (ORDER-DETAIL-CONTACT-SUPPORT — the 07-29 sitemap hangs the
 * support-chat frame off this screen, superseding /care?tab=order-issues);
 * SHARE GIFT TRACKING LINK stays static until the secure-token share
 * backend exists (ORDER-DETAIL-SHARE-TRACKING).
 *
 * ⚠️ Brand substitution: the frame's header wordmark is an image reading
 * "ELDREVE" — a placeholder brand this delivery stamps on several screens
 * (DQ raised; VELORIA → ELDREVE is the file's third brand string). The live
 * page keeps GoldRose in the frame's own Playfair treatment at the image's
 * box. Everything else ships verbatim, mock strings included.
 */

import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";

const A = "/veloria/screens";

const GREEN = "#09442E"; // brand green: headline, values, primary CTA
const INK = "#29211F";
const GOLD = "#D18005"; // the cards' small-caps labels
const GREY = "#616163";
const CANVAS = "#FFFBF6";
const CARD = "#FFFFFF";
const SAND = "#E0D6C9"; // 1px INSIDE card stroke
const HAIRLINE = "#EBE5DE"; // 1px dividers inside the cards
const MINT = "#EBF5F0"; // confirmation-email panel
const SHARE = "#FBF6F0"; // share-tracking panel

/**
 * A TEXT node's characters served as Figma's own SVG render (symbol glyphs
 * resolve to different fonts in Chrome). Exports crop to the ink, so the
 * image sits at the node box unstretched.
 */
function Glyph({
  src,
  alt,
  x,
  y,
  w,
  h,
}: {
  src: string;
  alt: string;
  x: number;
  y: number;
  w: number;
  h: number;
}) {
  return (
    <img
      src={src}
      alt={alt}
      width={w}
      height={h}
      style={{
        ...abs(x, y, w, h),
        display: "block",
        objectFit: "none",
        objectPosition: "left center",
      }}
    />
  );
}

/**
 * A card's 38-wide rounded label chip (ORDER / SHIP / PIN / CARD / GIFT /
 * HELP). The chip boxes vary in height; the label centres in boxes taller
 * than 38 and sits at the top of the 38×38 ones — verbatim from the frame.
 */
function IconBadge({
  x,
  y,
  h = 38,
  labelY = 0,
  label,
  bg = CANVAS,
}: {
  x: number;
  y: number;
  h?: number;
  labelY?: number;
  label: string;
  bg?: string;
}) {
  return (
    <div style={{ ...abs(x, y, 38, h), background: bg, borderRadius: 12 }}>
      <div
        className={notoSC.className}
        style={{
          ...abs(0, labelY, 38),
          ...txt(10, 12, GOLD, "center"),
          fontWeight: 500,
        }}
      >
        {label}
      </div>
    </div>
  );
}

/** A card's 354×1 hairline divider. */
function Divider({ y }: { y: number }) {
  return <div style={{ ...abs(38, y, 354, 1), background: HAIRLINE }} />;
}

export function OrderConfirmedScreen({
  orderName,
  total,
  method,
  mock,
  email = null,
  backFallback = "/",
}: {
  orderName: string;
  total: string | null;
  method: string | null;
  mock: boolean;
  /** The buyer's own address, read from the order row; null on the mock
   * /account/orders/details twin, which keeps the frame's placeholder. */
  email?: string | null;
  backFallback?: string;
}) {
  // Live values fall back to the frame's own placeholder strings, so a visit
  // without query params still renders the design exactly.
  const orderNumber = orderName.trim() || "#VL20250821";
  const totalText = total?.trim() || "$129.00";
  const methodText = method?.trim() || "Visa •••• 2345";
  // Real address when the order carries one; otherwise the frame's own
  // placeholder, so a param-less visit still renders the design exactly.
  const emailText = email?.trim() || "j***@gmail.com";

  return (
    <>
      {/* 1541:363 · the 1193-tall inner "C-2 / English Confirmation" frame,
          clipped by the 1188 outer frame. */}
      <div
        style={{
          ...abs(0, 0, 430, 1188),
          background: CANVAS,
          overflow: "hidden",
        }}
      >
        {/* ---------- 01 · Header + Success + Email ---------- */}

        {/* Brand Navigation — the frame's back arrow, served as its image. */}
        <BackButton
          fallback={backFallback}
          src={`${A}/1541-366.png`}
          style={abs(16, 8, 40, 42)}
        />
        {/* Wordmark box (147,3.5 140×51): GoldRose substituted for the
            frame's "ELDREVE" placeholder image — see the file header. */}
        <div
          className={playfair.className}
          style={{
            ...abs(147, 3.5, 140, 51),
            ...txt(24, 51, INK, "center"),
            fontWeight: 600,
          }}
        >
          GoldRose
        </div>

        {/* Success Check — 64×64 ring (2px inside stroke) + the ✓ export. */}
        <div
          style={{
            ...abs(183, 58, 64, 64),
            boxShadow: `inset 0 0 0 2px ${GREEN}`,
            borderRadius: 32,
          }}
        />
        <Glyph src={`${A}/1541-369.svg`} alt="" x={198} y={65} w={22} h={36} />

        <h1
          className={playfair.className}
          style={{
            ...abs(16, 130, 398),
            ...txt(28, 37.3, GREEN, "center"),
            fontWeight: 600,
            margin: 0,
          }}
        >
          Order Confirmed
        </h1>
        <div
          style={{
            ...abs(16, 178, 398),
            ...txt(12, 14.4, INK, "center"),
            whiteSpace: "normal",
          }}
        >
          Thank you for your trust. We are preparing your gift with care.
        </div>

        {/* Confirmation Email panel — the ✉ is a frame-render crop (the
            glyph SVG-exports as a .notdef box, C-2 precedent). */}
        <div
          style={{
            ...abs(16, 224, 398, 110),
            background: MINT,
            borderRadius: 12,
          }}
        />
        <img
          src={`${A}/1541-373.png`}
          alt=""
          width={25}
          height={25}
          style={{ ...abs(32, 266.5, 25, 25), display: "block" }}
        />
        <div
          style={{
            ...abs(71, 240, 135),
            ...txt(9, 10.8, GREEN),
            fontWeight: 500,
          }}
        >
          CONFIRMATION EMAIL SENT TO
        </div>
        <div
          style={{
            ...abs(71, 255, 322),
            ...txt(13, 15.6, INK),
            fontWeight: 500,
            // Real addresses run longer than the frame's placeholder, and
            // txt() is nowrap — clip inside the node box rather than spill
            // out of the mint panel.
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {emailText}
        </div>
        <div style={{ ...abs(71, 275, 322), ...txt(10, 12, GREEN) }}>
          Did not receive it? RESEND EMAIL →
        </div>

        {/* ---------- 02 · Order + Product ---------- */}
        <div
          style={{
            ...abs(20, 353, 390, 290),
            background: CARD,
            boxShadow: `inset 0 0 0 1px ${SAND}`,
            borderRadius: 16,
          }}
        />
        <IconBadge x={38} y={371} label="ORDER" />
        <div
          style={{
            ...abs(90, 371, 302),
            ...txt(10, 12, GOLD),
            fontWeight: 500,
          }}
        >
          ORDER NUMBER
        </div>
        <div
          data-order-name
          style={{
            ...abs(90, 386, 302),
            ...txt(18, 21.6, INK),
            fontWeight: 500,
          }}
        >
          {orderNumber}
        </div>
        <div style={{ ...abs(90, 411, 302), ...txt(11, 13.2, GREY) }}>
          Placed May 15, 2024 · 9:41 AM
        </div>
        <Divider y={451} />
        <img
          src={`${A}/1541-389.png`}
          alt=""
          width={116}
          height={126}
          style={{
            ...abs(38, 473, 116, 126),
            borderRadius: 12,
            display: "block",
            objectFit: "cover",
          }}
        />
        <div
          style={{
            ...abs(170, 474, 222),
            ...txt(17, 20.4, GREEN),
            fontWeight: 500,
          }}
        >
          24K Gold-Dipped Rose
        </div>
        <div style={{ ...abs(170, 504.9, 222), ...txt(12, 14.4, GREY) }}>
          Classic Collection
        </div>
        <div style={{ ...abs(170, 529.2, 222), ...txt(12, 14.4, GREY) }}>
          Quantity
        </div>
        <div
          style={{
            ...abs(227, 529.2, 100),
            ...txt(12, 14.4, INK),
            fontWeight: 500,
          }}
        >
          1
        </div>
        <div
          style={{
            ...abs(170, 561.2, 222),
            ...txt(20, 24, GREEN),
            fontWeight: 500,
          }}
        >
          {totalText}
        </div>

        {/* ---------- 03 · Delivery + Address + Payment ---------- */}
        <div
          style={{
            ...abs(20, 663, 390, 256),
            background: CARD,
            boxShadow: `inset 0 0 0 1px ${SAND}`,
            borderRadius: 16,
          }}
        />
        <IconBadge x={38} y={679} h={69} labelY={27.8} label="SHIP" />
        <div
          style={{
            ...abs(90, 679, 302),
            ...txt(10, 12, GOLD),
            fontWeight: 500,
          }}
        >
          ESTIMATED DELIVERY
        </div>
        <div
          style={{
            ...abs(90, 694, 302),
            ...txt(20, 24, GREEN),
            fontWeight: 500,
          }}
        >
          May 18–23
        </div>
        <div style={{ ...abs(90, 721, 302), ...txt(11, 13.2, GREY) }}>
          Free shipping · Trackable delivery
        </div>
        <Divider y={760} />
        <IconBadge x={38} y={775} h={63} labelY={24.8} label="PIN" />
        <div
          style={{
            ...abs(90, 775, 302),
            ...txt(10, 12, GOLD),
            fontWeight: 500,
          }}
        >
          SHIPPING ADDRESS
        </div>
        <div
          style={{
            ...abs(90, 790, 302),
            ...txt(14, 16.8, INK),
            fontWeight: 500,
          }}
        >
          Jessica Chen
        </div>
        <div
          style={{
            ...abs(90, 810, 290),
            ...txt(12, 14.4, GREY),
            whiteSpace: "normal",
          }}
        >
          123 Rose Ave, Apt 5B New York, NY 10012, USA
        </div>
        <Divider y={852} />
        <IconBadge x={38} y={867} label="CARD" labelY={12.3} />
        <div
          style={{
            ...abs(90, 867, 302),
            ...txt(10, 12, GOLD),
            fontWeight: 500,
          }}
        >
          PAYMENT METHOD
        </div>
        <div
          style={{
            ...abs(90, 882, 302),
            ...txt(14, 16.8, INK),
            fontWeight: 500,
          }}
        >
          {methodText}
        </div>

        {/* ---------- 04 · Actions + Help ---------- */}
        {/* implements ORDER-DETAIL-VIEW-STATUS — real tracking data pending,
            /orders/track is still the mock timeline. */}
        <Link
          href="/orders/track"
          aria-label="View order status"
          style={{
            ...abs(20, 941, 390, 58),
            background: GREEN,
            borderRadius: 13,
            display: "block",
          }}
        >
          <span
            className={notoSC.className}
            style={{
              ...abs(20, 19.6, 322),
              ...txt(14, 18.9, "#FFFFFF", "center"),
              fontWeight: 500,
              display: "block",
            }}
          >
            VIEW ORDER STATUS
          </span>
          <Glyph
            src={`${A}/1541-424.svg`}
            alt=""
            x={350}
            y={17}
            w={20}
            h={24}
          />
        </Link>

        {/* implements ORDER-DETAIL-SHARE-TRACKING — static until the secure
            share-token backend exists; disabled state per the sheet's note. */}
        <div
          style={{
            ...abs(20, 1011, 390, 74),
            background: SHARE,
            boxShadow: `inset 0 0 0 1px ${SAND}`,
            borderRadius: 14,
          }}
        />
        <IconBadge x={36} y={1029} label="GIFT" bg={SHARE} labelY={12.3} />
        <div
          style={{
            ...abs(86, 1033, 270),
            ...txt(12, 14.4, GREEN),
            fontWeight: 500,
          }}
        >
          SHARE GIFT TRACKING LINK
        </div>
        <div style={{ ...abs(86, 1051, 270), ...txt(10, 12, GREY) }}>
          Let the recipient follow the delivery.
        </div>
        <Glyph
          src={`${A}/1541-431.svg`}
          alt=""
          x={368}
          y={1036}
          w={20}
          h={24}
        />

        {/* implements ORDER-DETAIL-CONTACT-SUPPORT — whole card clickable
            (the sheet's change proposal), lands in the live-chat screen. */}
        <div
          style={{
            ...abs(20, 1097, 390, 78),
            background: CARD,
            boxShadow: `inset 0 0 0 1px ${SAND}`,
            borderRadius: 14,
          }}
        />
        <IconBadge x={36} y={1117} label="HELP" labelY={12.3} />
        <div
          style={{
            ...abs(86, 1108, 270),
            ...txt(14, 16.8, INK),
            fontWeight: 500,
          }}
        >
          Need help?
        </div>
        <div style={{ ...abs(86, 1129, 270), ...txt(10, 12, GREY) }}>
          Our concierge is here whenever you need us.
        </div>
        <div
          style={{
            ...abs(86, 1145, 270),
            ...txt(10, 12, GREEN),
            fontWeight: 500,
          }}
        >
          CONTACT SUPPORT →
        </div>
        <Link
          href="/care/chat"
          aria-label="Contact support"
          style={{ ...abs(20, 1097, 390, 78), display: "block" }}
        />

        {mock ? (
          // The mock-flow banner the pre-launch tests (and testers) look for.
          <div style={{ ...abs(20, 913, 390), ...txt(10, 12, GREY, "center") }}>
            TEST ORDER · MOCK MODE — no payment was captured.
          </div>
        ) : null}
      </div>
    </>
  );
}
