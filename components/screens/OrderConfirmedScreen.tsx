/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * C-2 · Order Confirmed — a pixel-exact import of Figma frame 765:113
 * (430×1386). Its inner frame 765:120 is 1540 tall and the outer frame clips
 * the overflow; the 1386-tall page canvas reproduces that crop. Only the order
 * number and the order total carry live data (`data-live-text`); the email,
 * product row, ETA, address and card digits are the design's placeholder copy.
 * Every CTA except VIEW ORDER STATUS and the Shop tab has no destination yet,
 * so those stay non-interactive. Coordinates/colors are verbatim Figma values.
 */

import Link from "next/link";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";

/** 2× node renders / glyph exports of this frame's own nodes. */
const A = "/veloria/screens";

/* Palette, verbatim from the frame. */
const GREEN = "#09442E"; // brand green: logo, headline, values, primary CTA
const INK = "#29211F";
const GOLD = "#D18005"; // the cards' small caps labels
const GREY = "#616163";
const CANVAS = "#FFFBF6";
const CARD = "#FFFFFF";
const SAND = "#E0D6C9"; // 1px INSIDE card stroke
const HAIRLINE = "#EBE5DE"; // 1px dividers inside the cards
const MINT = "#EBF5F0"; // confirmation-email panel
const SHARE = "#FBF6F0"; // share-tracking panel

/**
 * A TEXT node whose characters are served as Figma's own SVG render (the
 * design's symbol glyphs resolve to different fonts in Chrome). Figma crops
 * these exports to the ink, so the image is placed at the node's own box
 * without stretching; every glyph on this frame is left-aligned.
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
 * One of the cards' 38×38 rounded label chips (ORDER / SHIP / PIN / CARD /
 * GIFT / HELP). The design's label is top-aligned inside the chip rather than
 * centred vertically — verbatim from the frame.
 */
function IconBadge({
  x,
  y,
  label,
  bg = CANVAS,
}: {
  x: number;
  y: number;
  label: string;
  bg?: string;
}) {
  return (
    <div style={{ ...abs(x, y, 38, 38), background: bg, borderRadius: 12 }}>
      <div
        className={notoSC.className}
        style={{ ...abs(0, 0, 38), ...txt(10, 12, GOLD, "center"), fontWeight: 500 }}
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
}: {
  orderName: string;
  total: string | null;
  method: string | null;
  mock: boolean;
}) {
  // Live values fall back to the frame's own placeholder strings, so a visit
  // without query params still renders the design exactly.
  const orderNumber = orderName.trim() || "#VL20250821";

  return (
    <>
      {/* 765:120 · the 1540-tall inner frame. The page canvas is the design's
          1386-tall outer frame, which clips the last 154px. */}
      <div style={{ ...abs(0, 0, 430, 1540), background: CANVAS, overflow: "hidden" }}>
        {/* 765:121–765:124 are pure layout groups: each carries the same
            #FFFBF6 fill as this frame and no child crosses its bounds, so the
            children sit straight on this canvas at verbatim frame coords. */}

        {/* ---------- 01 · Header + Success + Email (765:121) ---------- */}

        {/* 769:114 Confirmation Header */}
        <Glyph src={`${A}/769-115.svg`} alt="Menu" x={16} y={19} w={21} h={26} />
        <div
          className={playfair.className}
          style={{ ...abs(86, 13, 250), ...txt(27, 35.99, GREEN, "center"), fontWeight: 600 }}
        >
          VELORIA
        </div>
        <Glyph src={`${A}/766-117.svg`} alt="Bag, 1 item" x={385} y={20} w={29} h={24} />

        {/* 769:118 Success Check — the ringed ✓ is one 64×64 node render. */}
        <img
          src={`${A}/769-118.svg`}
          alt=""
          width={64}
          height={64}
          style={{ ...abs(183, 64, 64, 64), display: "block" }}
        />

        <h1
          className={playfair.className}
          style={{ ...abs(16, 136, 398), ...txt(28, 37.32, GREEN, "center"), fontWeight: 600 }}
        >
          Order Confirmed
        </h1>
        {/* 769:121 — fixed 398-wide box, so the copy wraps where Figma wraps it. */}
        <div
          className={notoSC.className}
          style={{
            ...abs(16, 184, 398),
            fontSize: 12,
            lineHeight: "14.4px",
            color: INK,
            textAlign: "center",
          }}
        >
          Thank you for your trust. We are preparing your gift with care.
        </div>

        {/* 769:122 Confirmation Email */}
        <div style={{ ...abs(16, 230, 398, 110), background: MINT, borderRadius: 12, overflow: "hidden" }} />
        {/* 769:123 ✉ — the node-level SVG export degrades to a solid .notdef
            square, but Figma's frame render draws a real envelope, so this is a
            crop of that render (full box, no objectFit). */}
        <img
          src={`${A}/769-123.png`}
          alt=""
          width={25}
          height={25}
          style={{ ...abs(32, 272.5, 25, 25), display: "block" }}
        />
        <div
          className={notoSC.className}
          style={{ ...abs(71, 246, 135), ...txt(9, 10.8, GREEN), fontWeight: 500 }}
        >
          CONFIRMATION EMAIL SENT TO
        </div>
        <div
          className={notoSC.className}
          style={{ ...abs(71, 261, 101), ...txt(13, 15.6, INK), fontWeight: 500 }}
        >
          j***@gmail.com
        </div>
        {/* 769:127 — the node box is a fixed 322×24 holding one 12px line at
            the top, so the glyph sits in that first line box (not centred in
            24, which would drop it ~6px). RESEND EMAIL has no route yet. */}
        <Glyph
          src={`${A}/769-127.svg`}
          alt="Did not receive it? RESEND EMAIL →"
          x={71}
          y={281}
          w={322}
          h={12}
        />

        {/* Mock-mode notice — not in the design (the frame has no slot for
            one); it only renders for ?mock=1 test orders, so the real flow
            stays pixel-exact. Sits in the frame's empty 340–410 band. */}
        {mock ? (
          <>
            <div
              style={{
                ...abs(20, 356, 390, 38),
                background: SHARE,
                boxShadow: `inset 0 0 0 1px ${SAND}`,
                borderRadius: 14,
              }}
            />
            <div
              className={notoSC.className}
              style={{ ...abs(20, 369, 390), ...txt(10, 12, GOLD, "center"), fontWeight: 500 }}
            >
              TEST ORDER · MOCK MODE · NO PAYMENT WAS TAKEN
            </div>
          </>
        ) : null}

        {/* ---------- 02 · Order + Product (765:122) ---------- */}

        {/* 770:111 Order Summary Card */}
        <div
          style={{
            ...abs(20, 410, 390, 290),
            background: CARD,
            boxShadow: `inset 0 0 0 1px ${SAND}`,
            borderRadius: 16,
          }}
        />
        <IconBadge x={38} y={428} label="ORDER" />
        <div
          className={notoSC.className}
          style={{ ...abs(90, 428, 79), ...txt(10, 12, GOLD), fontWeight: 500 }}
        >
          ORDER NUMBER
        </div>
        {/* Live order number. The design's box is 114 wide because its mock
            string is short; real names are longer, so the box runs to the
            parent Order Number frame's 302 — left-aligned, so the design
            string still starts and renders in exactly the same place. */}
        <div
          className={notoSC.className}
          data-live-text
          data-order-name
          style={{
            ...abs(90, 443, 302),
            ...txt(18, 21.6, INK),
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {orderNumber}
        </div>
        <div className={notoSC.className} style={{ ...abs(90, 468, 158), ...txt(11, 13.2, GREY) }}>
          Placed May 15, 2024 · 9:41 AM
        </div>

        <Divider y={508} />

        {/* 770:120 Product */}
        <img
          src={`${A}/770-121.png`}
          alt="24K gold-dipped rose"
          width={116}
          height={126}
          style={{ ...abs(38, 530, 116, 126), display: "block", objectFit: "cover", borderRadius: 12 }}
        />
        <div
          className={notoSC.className}
          style={{ ...abs(170, 531, 222), ...txt(17, 20.4, GREEN), fontWeight: 500 }}
        >
          24K Gold-Dipped Rose
        </div>
        <div className={notoSC.className} style={{ ...abs(170, 561.95, 222), ...txt(12, 14.4, GREY) }}>
          Classic Collection
        </div>
        <div className={notoSC.className} style={{ ...abs(170, 586.15, 49), ...txt(12, 14.4, GREY) }}>
          Quantity
        </div>
        <div
          className={notoSC.className}
          style={{ ...abs(227, 586.15, 7), ...txt(12, 14.4, INK), fontWeight: 500 }}
        >
          1
        </div>
        {/* Live order total — same widening as the order number (the design's
            75px box fits only its own "$129.00"). */}
        <div
          className={notoSC.className}
          data-live-text
          style={{
            ...abs(170, 618.15, 222),
            ...txt(20, 24, GREEN),
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {total ?? "$129.00"}
        </div>

        {/* ---------- 03 · Delivery + Address + Payment (765:123) ---------- */}

        {/* 770:129 Delivery Details Card */}
        <div
          style={{
            ...abs(20, 720, 390, 310),
            background: CARD,
            boxShadow: `inset 0 0 0 1px ${SAND}`,
            borderRadius: 16,
          }}
        />
        <IconBadge x={38} y={736} label="SHIP" />
        <div
          className={notoSC.className}
          style={{ ...abs(90, 736, 102), ...txt(10, 12, GOLD), fontWeight: 500 }}
        >
          ESTIMATED DELIVERY
        </div>
        <div
          className={notoSC.className}
          style={{ ...abs(90, 751, 100), ...txt(20, 24, GREEN), fontWeight: 500 }}
        >
          May 18–23
        </div>
        <div className={notoSC.className} style={{ ...abs(90, 778, 179), ...txt(11, 13.2, GREY) }}>
          Free shipping · Trackable delivery
        </div>

        <Divider y={815} />

        <IconBadge x={38} y={828} label="PIN" />
        <div
          className={notoSC.className}
          style={{ ...abs(90, 828, 94), ...txt(10, 12, GOLD), fontWeight: 500 }}
        >
          SHIPPING ADDRESS
        </div>
        <div
          className={notoSC.className}
          style={{ ...abs(90, 843, 86), ...txt(14, 16.8, INK), fontWeight: 500 }}
        >
          Jessica Chen
        </div>
        <div
          className={notoSC.className}
          style={{
            ...abs(90, 863, 290),
            fontSize: 12,
            lineHeight: "14.4px",
            color: GREY,
            whiteSpace: "pre-line",
          }}
        >
          {"123 Rose Ave, Apt 5B\nNew York, NY 10012, USA"}
        </div>

        <Divider y={944} />

        <IconBadge x={38} y={957} label="CARD" />
        <div
          className={notoSC.className}
          style={{ ...abs(90, 957, 90), ...txt(10, 12, GOLD), fontWeight: 500 }}
        >
          PAYMENT METHOD
        </div>
        {/* 770:151 — the design's card digits are placeholder art, so they are
            not announced; the real method (when the URL names a known one)
            rides in the visually-hidden line below it. */}
        <Glyph src={`${A}/770-151.svg`} alt="" x={90} y={972} w={125} h={17} />
        {method ? <p className="sr-only">{`Paid with ${method}.`}</p> : null}

        {/* ---------- 04 · Actions + Help + Nav (765:124) ---------- */}

        {/* 770:152 Button · VIEW ORDER STATUS → the order-tracking screen. */}
        <Link
          href="/orders/track"
          style={{ ...abs(20, 1052, 390, 58), display: "block", background: GREEN, borderRadius: 13 }}
        >
          <div
            className={notoSC.className}
            style={{ ...abs(20, 19.55, 322), ...txt(14, 16.8, "#FFFFFF", "center"), fontWeight: 500 }}
          >
            VIEW ORDER STATUS
          </div>
          <Glyph src={`${A}/770-154.svg`} alt="" x={350} y={17} w={20} h={24} />
        </Link>

        {/* 770:155 Share Tracking Link — no share backend yet, static. */}
        <div
          style={{
            ...abs(20, 1122, 390, 74),
            background: SHARE,
            boxShadow: `inset 0 0 0 1px ${SAND}`,
            borderRadius: 14,
          }}
        />
        <IconBadge x={36} y={1140} label="GIFT" bg={SHARE} />
        <div
          className={notoSC.className}
          style={{ ...abs(86, 1133, 160), ...txt(12, 14.4, GREEN), fontWeight: 500 }}
        >
          SHARE GIFT TRACKING LINK
        </div>
        <div className={notoSC.className} style={{ ...abs(86, 1151, 167), ...txt(10, 12, GREY) }}>
          Let the recipient follow the delivery.
        </div>
        <Glyph src={`${A}/770-161.svg`} alt="" x={368} y={1147} w={20} h={24} />

        {/* 770:162 Help Card — CONTACT SUPPORT has no route yet, static. */}
        <div
          style={{
            ...abs(20, 1208, 390, 78),
            background: CARD,
            boxShadow: `inset 0 0 0 1px ${SAND}`,
            borderRadius: 14,
          }}
        />
        <IconBadge x={36} y={1228} label="HELP" />
        <div
          className={notoSC.className}
          style={{ ...abs(86, 1219, 75), ...txt(14, 16.8, INK), fontWeight: 500 }}
        >
          Need help?
        </div>
        <div className={notoSC.className} style={{ ...abs(86, 1240, 207), ...txt(10, 12, GREY) }}>
          Our concierge is here whenever you need us.
        </div>
        <Glyph src={`${A}/770-168.svg`} alt="CONTACT SUPPORT →" x={86} y={1256} w={106} h={12} />

        {/* 770:169 Bottom Navigation — this frame draws its own nav card (the
            shared fixed BottomNav is switched off for this route). Home and Shop
            are wired; Personalize and Help have no page yet. Help is the
            design's active tab. */}
        <div
          style={{
            ...abs(20, 1298, 390, 88),
            background: CARD,
            boxShadow: `inset 0 0 0 1px ${SAND}`,
            borderRadius: 16,
            overflow: "hidden",
          }}
        />
        <Link href="/" style={{ ...abs(32, 1313, 84, 58), display: "block" }}>
          <Glyph src={`${A}/770-171.svg`} alt="" x={34.5} y={9} w={15} h={24} />
          <div className={notoSC.className} style={{ ...abs(27.5, 37, 29), ...txt(10, 12, INK) }}>
            Home
          </div>
        </Link>
        <Link href="/shop" style={{ ...abs(126, 1313, 84, 58), display: "block" }}>
          <Glyph src={`${A}/770-174.svg`} alt="" x={32} y={9} w={20} h={24} />
          <div className={notoSC.className} style={{ ...abs(29.5, 37, 25), ...txt(10, 12, INK) }}>
            Shop
          </div>
        </Link>
        <Glyph src={`${A}/770-177.svg`} alt="" x={253} y={1322} w={18} h={24} />
        <div className={notoSC.className} style={{ ...abs(235, 1350, 54), ...txt(10, 12, INK) }}>
          Personalize
        </div>
        <Glyph src={`${A}/770-180.svg`} alt="" x={347} y={1322} w={18} h={24} />
        <div
          className={notoSC.className}
          style={{ ...abs(344.5, 1350, 23), ...txt(10, 12, GOLD), fontWeight: 500 }}
        >
          Help
        </div>
      </div>
    </>
  );
}
