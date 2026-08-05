"use client";

/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * The client half of /checkout (§8, §10), wearing the 2026-08-02 two-step
 * checkout redesign: "/checkout · details-entry" (2157:239, 430×962) and
 * "/checkout · saved-address · payment confirmation" (2157:384, 430×1576).
 * The design deleted the old single-page B-2 frame (1523:421), so the flow is
 * now one route with two steps — step "details" collects contact + delivery
 * address and ends in CONTINUE TO PAYMENT; step "payment" shows the saved
 * address, shipping method, payment methods, live order summary, and a pay
 * bar **fixed to the viewport bottom** (the design team's "固定在底部"
 * answer — the bar overflows its own frame, i.e. it is sticky by intent).
 * The step lives in the ?step= query so browser Back returns to details.
 *
 * The checkout itself is unchanged: cart lines with quantity controls,
 * ship-to country (zone-priced shipping), optional gift message (→ the
 * order's Notes card), discount codes (§8), and payment. With PayPal
 * configured the real JS-SDK button drives /api/paypal/create + /capture
 * from inside the fixed pay bar's CTA slot; otherwise the payment section's
 * PayPal row and the local card wells drive /api/checkout — full
 * click-through, no money anywhere. With `skipPayment` (CHECKOUT_SKIP_PAYMENT,
 * §10.4) both are replaced by a single Place-order CTA in the pay bar.
 *
 * DEV BANDS (design's field language, flagged to the design team):
 * - Discount code: the design deleted the code-entry card again, but §8 keeps
 *   the feature, so the band sits above the Order Summary on the payment step.
 * - Gift message: no field in the design; the note is the order's Notes card,
 *   so its band stays on the details step.
 *
 * NO BASKET CONTROLS AND NO COUNTRY FIELD (owner decisions, 2026-08-02):
 * "keep the same with figma". The item card's "Qty 1" is static text with
 * only EDIT →, and the address card ends at CITY / STATE / ZIP as drawn.
 * Consequences, both filed with the agent inbox:
 * - Quantity and remove exist nowhere in the live site until /bag is wired
 *   to the real cart (AI-017).
 * - Shipping is still zone-priced, but the zone now comes solely from
 *   Vercel's geo-IP header (`x-vercel-ip-country`, "US" when absent) with no
 *   way for the customer to correct a wrong guess (AI-018). The PayPal
 *   branch is unaffected — PayPal collects the real address itself.
 *
 * AI-TAG(AI-017): AGENT-BLOCKED — no cart editing anywhere in the live site;
 * wire /bag to the real cart. See
 * /agent-delivery/sessions/figma-sync-08-02-feat-figma-sync.md.
 * AI-TAG(AI-018): OWNER-DECISION — shipping zone comes from geo-IP alone; is
 * the store US-only at launch? Same session file.
 *
 * Deliberately NOT imported: the shipping rows' mock prices ($14.99/$24.99) —
 * the picker is cosmetic by the owner's decision (per-method pricing has no
 * backend; the only charged figure is the summary's zone rate), so the rows
 * carry no prices, same as the 07-30 build. The PHONE (Optional) field is
 * inert art: /api/checkout's shipping payload has no phone. Apple Pay /
 * Afterpay rows, the marketing opt-in line and the three FAQ accordions stay
 * inert art (no backend / no expanded state designed).
 *
 * AI-TAG(AI-013): AGENT-DECISION — the dev bands and the stripped shipping
 * prices above are reversible calls for Charles/design to confirm. See
 * /agent-delivery/sessions/figma-sync-08-02-feat-figma-sync.md.
 */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScaleFrame } from "@/components/chrome";
import { abs } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";
import { formatMoney } from "@/lib/money";
import { useCart, type CartLine, type CartLineView } from "@/lib/cart/store";
import {
  computeShipping,
  zoneForCountry,
  type ShippingZone,
} from "@/lib/checkout/zones";
import { fileUrl } from "@/lib/files-url";
import { getVisitorId } from "@/components/Beacon";
import type { PaymentMethodId } from "@/lib/checkout/types";
import type { CatalogProduct } from "@/lib/supabase/types.ts";

const brandName = "ELDREVE";
const A = "/veloria/screens";

/** What /api/checkout accepts — "none" is the skip-payment testing flow. */
type SubmitMethod = PaymentMethodId | "none";
type Step = "details" | "payment";

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) {
    return digits;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

/* ---------- design tokens (2157:239 / 2157:384) ---------- */

const INK = "#3B2F2F";
const GREEN = "#09442E";
const MUTED = "#8C8075";
const RED = "#B82924";
const CREAM = "#FFF6EC";
const SAND = "#E5D9C9";
const GOLD = "#D4AF37"; // field labels, current-step ring, CTA arrows
const AMBER = "#C88217"; // done-step fill, EDIT/CHANGE links, small labels
const VISA_BLUE = "#144DB2";
const PINK = "#F3C6D1"; // DEFAULT badge
/** Credit-card panel fill: #FFF6EC @31% MULTIPLY flattened over white — CSS
    blend modes are GPU-composited and not bit-deterministic, so the panel
    ships the precomputed flat color instead. */
const PANEL = "#FFFCF9";
const HAIRLINE = `inset 0 0 0 1px ${SAND}`;

/** Field-value type (the redesign's 13px value line). */
const VALUE: React.CSSProperties = {
  appearance: "none",
  border: 0,
  outline: "none",
  background: "transparent",
  padding: 0,
  margin: 0,
  fontSize: 13,
  lineHeight: "15.6px",
  fontWeight: 400,
  color: INK,
};

/** Small-field value type (CITY/STATE/ZIP row) and the card wells (10/12). */
const SMALL_VALUE: React.CSSProperties = {
  ...VALUE,
  fontSize: 11,
  lineHeight: "13.2px",
};
const WELL_VALUE: React.CSSProperties = {
  ...VALUE,
  fontSize: 10,
  lineHeight: "12px",
};

function StageStyles() {
  return (
    <style>{`
      .b2-live::placeholder{color:${MUTED};opacity:1}
      .b2-live:focus-visible{outline:2px solid ${GREEN};outline-offset:2px}
    `}</style>
  );
}

/** One design TEXT box: exact absolute box + exact type. */
function Txt({
  x,
  y,
  w,
  size,
  lh,
  color,
  weight = 400,
  align,
  ls,
  serif,
  wrap,
  live,
  children,
}: {
  x: number;
  y: number;
  w: number;
  size: number;
  lh: number;
  color: string;
  weight?: number;
  align?: "center" | "right";
  ls?: number;
  /** Playfair Display (the design's serif) instead of Noto Sans SC. */
  serif?: boolean;
  wrap?: boolean;
  /** marks the box as carrying real data (`data-live-text`) */
  live?: boolean;
  children: React.ReactNode;
}) {
  const style: React.CSSProperties = {
    ...abs(x, y, w),
    fontSize: size,
    lineHeight: `${lh}px`,
    color,
    fontWeight: weight,
    margin: 0,
    ...(ls ? { letterSpacing: ls } : {}),
    ...(align ? { textAlign: align } : {}),
    ...(wrap ? {} : { whiteSpace: "nowrap" }),
  };
  const cls = serif ? playfair.className : notoSC.className;
  return live ? (
    <p data-live-text className={cls} style={style}>
      {children}
    </p>
  ) : (
    <p className={cls} style={style}>
      {children}
    </p>
  );
}

/** One live text control on a field's value line, plus its inline error. */
function LiveInput({
  id,
  x,
  y,
  w,
  label,
  value,
  onChange,
  error,
  errorY,
  placeholder,
  inputMode,
  autoComplete,
  small,
  well,
}: {
  id: string;
  x: number;
  y: number;
  w: number;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  /** absolute y of the inline error line */
  errorY?: number;
  placeholder?: string;
  inputMode?: "text" | "email" | "numeric";
  autoComplete?: string;
  /** 11/13.2 type for the CITY/STATE/ZIP row */
  small?: boolean;
  /** 10/12 type for the payment card's wells */
  well?: boolean;
}) {
  return (
    <>
      <input
        id={id}
        data-live-text
        className={`${notoSC.className} b2-live`}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        aria-invalid={error ? true : undefined}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        style={{
          ...abs(x, y, w),
          ...(well ? WELL_VALUE : small ? SMALL_VALUE : VALUE),
        }}
      />
      {error && errorY !== undefined ? (
        <Txt x={x} y={errorY} w={w} size={9} lh={10.8} color={RED} weight={500}>
          {error}
        </Txt>
      ) : null}
    </>
  );
}

/** A 1×1 transparent GIF: no product image must never show the design's rose. */
const BLANK_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

/* ---------- 01 · header + progress (shared by both steps) ---------- */

const STEP_X = [16, 118, 220, 322];
const STEP_LABELS = ["Bag", "Details", "Payment", "Delivery"];

/**
 * Header band (0…143): back raster, the ELDREVE wordmark raster, and the
 * four-step progress row. Step states verbatim from the frames: done = amber
 * fill + white ✓, current = cream + gold ring + gold label, upcoming = cream
 * + sand ring, and Delivery always draws white + amber ring (both frames).
 */
function CheckoutHeader({ step, onBack }: { step: Step; onBack: () => void }) {
  const current = step === "details" ? 1 : 2; // index into STEP_LABELS
  return (
    <div style={{ ...abs(0, 0, 430, 143), background: CREAM }}>
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        style={{
          ...abs(16, 14, 44, 44),
          background: "transparent",
          border: 0,
          padding: 0,
          cursor: "pointer",
        }}
      >
        <img
          src={`${A}/1523-425.png`}
          alt=""
          width={44}
          height={44}
          style={{ ...abs(0, 0, 44, 44), display: "block" }}
        />
      </button>
      {/* Brand, centred at the top. The 08-02 delivery replaced this header's
          text node with the same ELDREVE wordmark raster the rest of the
          file uses (2460:377/381, 140×51 at x145). */}
      <img
        src="/veloria/brand/eldreve-140x51.png"
        alt="ELDREVE"
        width={140}
        height={51}
        style={{ ...abs(145, 11, 140, 51), display: "block" }}
      />
      {STEP_LABELS.map((label, i) => {
        const x = STEP_X[i];
        const done = i < current;
        const active = i === current;
        const isDelivery = i === 3;
        const ring = done
          ? `inset 0 0 0 2px ${AMBER}`
          : active
            ? `inset 0 0 0 1.5px ${GOLD}`
            : isDelivery
              ? `inset 0 0 0 2px ${AMBER}`
              : `inset 0 0 0 1px ${SAND}`;
        const fill = done ? AMBER : isDelivery ? "#FFFFFF" : CREAM;
        const digit = active ? GOLD : isDelivery ? AMBER : INK;
        return (
          <div key={label} style={abs(x, 65, 92, 64)}>
            <div
              style={{
                ...abs(34, 12, 24, 24),
                background: fill,
                boxShadow: ring,
                borderRadius: 12,
              }}
            >
              {done ? (
                <img
                  src={`${A}/2157-248.svg`}
                  alt=""
                  style={{ ...abs(8, 6, 8, 12), display: "block" }}
                />
              ) : (
                <span
                  className={notoSC.className}
                  style={{
                    ...abs(0, 6, 24),
                    fontSize: 10,
                    lineHeight: "12px",
                    fontWeight: 500,
                    color: digit,
                    textAlign: "center",
                    display: "block",
                  }}
                >
                  {i + 1}
                </span>
              )}
            </div>
            <span
              className={notoSC.className}
              style={{
                ...abs(0, 40, 92),
                fontSize: 10,
                lineHeight: "12px",
                fontWeight: 500,
                color: active ? GOLD : INK,
                textAlign: "center",
                display: "block",
              }}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- 02 · order item + assurances (shared) ---------- */

function OrderItemModule({
  top,
  line,
  note,
  onEdit,
}: {
  top: number;
  line: CartLineView | null;
  note: string;
  onEdit: () => void;
}) {
  const image = line?.product.images[0] ?? null;
  return (
    <>
      <div
        style={{
          ...abs(16, top, 398, 142),
          background: "#FFFFFF",
          boxShadow: HAIRLINE,
          borderRadius: 14,
        }}
      />
      <img
        data-live-text
        src={image ? fileUrl(image.path) : BLANK_PIXEL}
        alt={image?.alt ?? ""}
        width={112}
        height={118}
        style={{
          ...abs(28, top + 12, 112, 118),
          objectFit: "contain",
          borderRadius: 8,
          display: "block",
        }}
      />
      <Txt
        x={152}
        y={top + 12}
        w={200}
        size={18}
        lh={24}
        color={INK}
        weight={500}
        serif
        live
      >
        {line?.product.short_name ?? ""}
      </Txt>
      <Txt x={152} y={top + 34} w={250} size={10} lh={12} color={INK} live>
        {line
          ? `${line.variant.option_values.join("  ·  ")}  ·  Qty ${line.quantity}`
          : ""}
      </Txt>
      <Txt x={152} y={top + 46} w={250} size={10} lh={12} color={INK} live>
        {note.trim() ? `Gift message  ·  ${note.trim()}` : ""}
      </Txt>
      <Txt x={152} y={top + 68} w={250} size={10} lh={12} color={INK} live>
        {line && line.quantity > 1
          ? `${formatMoney(line.variant.price_cents)} each`
          : ""}
      </Txt>
      <Txt
        x={152}
        y={top + 90}
        w={150}
        size={22}
        lh={29.3}
        color={GREEN}
        weight={500}
        serif
        live
      >
        {line ? formatMoney(line.lineTotal) : ""}
      </Txt>
      <button
        type="button"
        onClick={onEdit}
        aria-label="Edit item"
        className={notoSC.className}
        style={{
          ...abs(368, top + 90, 40, 35),
          background: "transparent",
          border: 0,
          padding: 0,
          cursor: "pointer",
          fontSize: 9,
          lineHeight: "10.8px",
          fontWeight: 500,
          color: AMBER,
          textAlign: "left",
        }}
      >
        {"EDIT  →"}
      </button>
      {/* Fulfillment assurances (2157:273) — Playfair 10, C-flow green */}
      <Txt
        x={16}
        y={top + 165.5}
        w={110}
        size={10}
        lh={13.3}
        color={GREEN}
        weight={500}
        serif
      >
        {"⌂  Ships from the U.S."}
      </Txt>
      <Txt
        x={178}
        y={top + 165.5}
        w={100}
        size={10}
        lh={13.3}
        color={GREEN}
        weight={500}
        serif
      >
        {"▱  3–5 day delivery"}
      </Txt>
      <Txt
        x={328}
        y={top + 165.5}
        w={90}
        size={10}
        lh={13.3}
        color={GREEN}
        weight={500}
        serif
      >
        {"♔  Free over $50"}
      </Txt>
    </>
  );
}

/* ---------- design field boxes ---------- */

/** A 374×52 checkout field (label + optional static value), the redesign's
    core "Checkout Field" component (2159:254 documentation frame). */
function FieldBox({
  x,
  y,
  label,
  value,
  valueMuted,
}: {
  x: number;
  y: number;
  label: string;
  /** static display text; omitted paints the box + label only */
  value?: string;
  valueMuted?: boolean;
}) {
  return (
    <>
      <div
        style={{
          ...abs(x, y, 374, 52),
          background: CREAM,
          boxShadow: HAIRLINE,
          borderRadius: 6,
        }}
      />
      <Txt
        x={x + 12}
        y={y + 8}
        w={336}
        size={10}
        lh={12}
        color={GOLD}
        weight={500}
      >
        {label}
      </Txt>
      {value ? (
        <Txt
          x={x + 12}
          y={y + 26}
          w={336}
          size={13}
          lh={15.6}
          color={valueMuted ? MUTED : INK}
        >
          {value}
        </Txt>
      ) : null}
    </>
  );
}

/** Real PayPal JS-SDK buttons (sandbox/live keys decide which world). */
function PayPalSdkButtons({
  clientId,
  buildPayload,
  onFail,
}: {
  clientId: string;
  buildPayload: () => {
    lines: Array<{ variantId: string; quantity: number }>;
    country: string;
    note?: string;
  };
  onFail: (message: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Latest-ref: the PayPal SDK callbacks below outlive any single render, so
  // they read the current payload builder through this ref.
  const payloadRef = useRef(buildPayload);
  useEffect(() => {
    payloadRef.current = buildPayload;
  });

  useEffect(() => {
    let cancelled = false;
    const scriptId = "paypal-sdk";

    function renderButtons() {
      const paypal = (
        window as unknown as {
          paypal?: {
            Buttons: (options: unknown) => {
              render: (el: HTMLElement) => void;
            };
          };
        }
      ).paypal;
      if (!paypal || !containerRef.current || cancelled) {
        return;
      }
      containerRef.current.innerHTML = "";
      paypal
        .Buttons({
          createOrder: async () => {
            const response = await fetch("/api/paypal/create", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payloadRef.current()),
            });
            const data = await response.json();
            if (!response.ok || !data.id) {
              throw new Error(data.error ?? "Could not start PayPal checkout.");
            }
            return data.id;
          },
          onApprove: async (data: { orderID: string }) => {
            const response = await fetch("/api/paypal/capture", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderID: data.orderID }),
            });
            const result = await response.json();
            if (!response.ok || !result.redirectUrl) {
              throw new Error(result.error ?? "Could not capture payment.");
            }
            window.localStorage.removeItem("goldrose-cart-v2");
            window.location.assign(result.redirectUrl);
          },
          onError: (error: unknown) => {
            onFail(
              error instanceof Error
                ? error.message
                : "PayPal checkout failed.",
            );
          },
        })
        .render(containerRef.current);
    }

    if (document.getElementById(scriptId)) {
      renderButtons();
    } else {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture`;
      script.onload = renderButtons;
      script.onerror = () => onFail("Could not load PayPal.");
      document.head.appendChild(script);
    }
    return () => {
      cancelled = true;
    };
  }, [clientId, onFail]);

  return <div ref={containerRef} />;
}

/**
 * The Secure Pay Bar (2157:526) — 430×75, fixed to the viewport bottom. In
 * the frame it overflows the canvas, i.e. the design pins it ("固定在底部").
 * position:fixed cannot live inside ScaleFrame's transform, so the bar is a
 * sibling overlay with the same scale math (the BottomNav pattern).
 */
function PayBar({
  total,
  label,
  onPay,
  payButtonSlot,
}: {
  total: string;
  label: string;
  onPay?: () => void;
  payButtonSlot?: React.ReactNode;
}) {
  return (
    <>
      <style>{`
        .figv-paybar { position: fixed; bottom: 0; width: 430px; height: 75px; left: calc((100% - 430px) / 2); z-index: 30; }
        @media (max-width: 480px) {
          .figv-paybar { transform: scale(calc(min(100vw, 480px) / 430px)); transform-origin: bottom center; }
        }
      `}</style>
      <div className={`figv-paybar ${notoSC.className}`}>
        <div style={{ ...abs(0, 0, 430, 75), background: CREAM }} />
        <Txt
          x={8}
          y={23.5}
          w={130}
          size={21}
          lh={28}
          color={INK}
          weight={500}
          serif
          live
        >
          {total}
        </Txt>
        {payButtonSlot ? (
          /* With PayPal live the SDK's own iframe button is the only thing
             that can start a payment; it fills the CTA's 276×48 box. */
          <div style={abs(150, 13.5, 276, 48)}>{payButtonSlot}</div>
        ) : (
          <button
            type="button"
            onClick={onPay}
            className={notoSC.className}
            style={{
              ...abs(150, 13.5, 276, 48),
              background: INK,
              borderRadius: 10,
              border: 0,
              padding: 0,
              cursor: "pointer",
              fontSize: 12,
              lineHeight: "48px",
              fontWeight: 500,
              letterSpacing: 1.1,
              color: CREAM,
              textAlign: "center",
            }}
          >
            {label}
            <span style={{ color: GOLD, marginLeft: 10, fontWeight: 500 }}>
              →
            </span>
          </button>
        )}
      </div>
    </>
  );
}

export function CheckoutClient({
  catalog,
  zones,
  countries,
  defaultCountry,
  paypalClientId,
  showDiscountField = true,
  skipPayment = false,
}: {
  catalog: CatalogProduct[];
  zones: ShippingZone[];
  countries: Array<{ code: string; name: string }>;
  defaultCountry: string;
  paypalClientId: string | null;
  showDiscountField?: boolean;
  skipPayment?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const step: Step =
    searchParams.get("step") === "payment" ? "payment" : "details";
  // No changeQuantity/remove here: the design draws no basket controls at
  // checkout and the owner confirmed it stays that way (08-02).
  const { lines, rawLines, subtotal, hydrated, clear } = useCart(catalog);

  const [email, setEmail] = useState("");
  // Read-only since 08-02: the design draws no country field, so the shipping
  // zone comes from the server's geo-IP default and nothing on the page can
  // change it (AI-018).
  const country = defaultCountry;
  const [note, setNote] = useState("");
  const [discountInput, setDiscountInput] = useState("");
  const [discount, setDiscount] = useState<{
    code: string;
    discountCents: number;
    shippingFree: boolean;
  } | null>(null);
  const [discountError, setDiscountError] = useState("");
  const [discountBusy, setDiscountBusy] = useState(false);
  const [shipping, setShipping] = useState({
    name: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    postalCode: "",
  });
  const [card, setCard] = useState({
    name: "",
    number: "",
    expiry: "",
    cvc: "",
  });
  /**
   * The Standard / Express / Next-Day picker (2157:456). Per-method shipping
   * pricing has no backend — every method ships at the zone rate — so on the
   * owner's explicit decision the control is cosmetic: this state moves the
   * selected ring and nothing else, and the rows carry none of the frame's
   * mock prices. The charged figure is always the summary's zone rate.
   */
  const [shipMethod, setShipMethod] = useState(0);

  const [pendingMethod, setPendingMethod] = useState<SubmitMethod | null>(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    function resetCheckoutState() {
      setPendingMethod(null);
    }
    window.addEventListener("pageshow", resetCheckoutState);
    return () => window.removeEventListener("pageshow", resetCheckoutState);
  }, []);

  // Each step opens at its top, like a page change.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const zone = useMemo(() => zoneForCountry(zones, country), [zones, country]);
  const discountCents = discount
    ? Math.min(discount.discountCents, subtotal)
    : 0;
  const shippingInfo = useMemo(() => {
    if (subtotal === 0 || !zone) {
      return { amount: 0, free: false };
    }
    // Display mirror of the server's rule: threshold on the discounted
    // subtotal; free-shipping codes zero it out. The server re-prices anyway.
    const base = computeShipping(zone, subtotal - discountCents);
    if (discount?.shippingFree) {
      return { amount: 0, free: true };
    }
    return base;
  }, [zone, subtotal, discountCents, discount]);
  const total = subtotal - discountCents + shippingInfo.amount;

  /** Server-validate the typed code against the live cart. */
  async function applyDiscount() {
    const code = discountInput.trim();
    if (!code || rawLines.length === 0) {
      return;
    }
    setDiscountBusy(true);
    setDiscountError("");
    try {
      const response = await fetch("/api/discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          lines: rawLines.map((line) => ({
            variantId: line.variantId,
            quantity: line.quantity,
          })),
          country,
          ...(email.trim() ? { email: email.trim() } : {}),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        setDiscount(null);
        setDiscountError(result.error ?? "Enter a valid discount code.");
        return;
      }
      setDiscount({
        code: result.code,
        discountCents: result.discountCents,
        shippingFree: result.shippingFree,
      });
    } catch {
      setDiscountError("Could not check that code. Please try again.");
    } finally {
      setDiscountBusy(false);
    }
  }

  function setShippingField(key: keyof typeof shipping, value: string) {
    setShipping((current) => ({ ...current, [key]: value }));
  }

  function goToStep(next: Step) {
    router.push(next === "payment" ? "/checkout?step=payment" : "/checkout");
  }

  function checkoutPayload(cartLines: CartLine[]) {
    return {
      lines: cartLines.map((line) => ({
        variantId: line.variantId,
        quantity: line.quantity,
      })),
      country,
      ...(note.trim() ? { note: note.trim() } : {}),
      ...(discount ? { discountCode: discount.code } : {}),
      ...(typeof window !== "undefined" && getVisitorId()
        ? { visitorId: getVisitorId() }
        : {}),
    };
  }

  /** Mock-mode submit for every method, including skip-payment (§10.4). */
  async function submitMockCheckout(method: SubmitMethod, withForm: boolean) {
    if (rawLines.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    setPendingMethod(method);
    setError("");
    setFieldErrors({});

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          ...checkoutPayload(rawLines),
          ...(withForm
            ? {
                email,
                shipping,
                card: {
                  name: card.name,
                  number: card.number,
                  expiry: card.expiry,
                  cvc: card.cvc,
                },
              }
            : {}),
          // Skip-payment collects nothing but an optional email, so the test
          // order still lands on a customer and in /account order history.
          ...(method === "none" && email.trim() ? { email: email.trim() } : {}),
        }),
      });
      const result = await response.json();
      if (!response.ok || result.ok === false) {
        setError(result.error ?? "Checkout could not be completed.");
        const errors: Record<string, string> = result.fieldErrors ?? {};
        setFieldErrors(errors);
        setPendingMethod(null);
        // Details-step fields live on the other step: jump back so the
        // customer sees what needs fixing.
        if (
          ["email", "name", "address1", "city", "state", "postalCode"].some(
            (key) => errors[key],
          )
        ) {
          goToStep("details");
        }
        return;
      }
      clear();
      router.push(result.redirectUrl);
    } catch {
      setError("Something went wrong starting checkout. Please try again.");
      setPendingMethod(null);
    }
  }

  const isBusy = pendingMethod !== null;

  if (hydrated && lines.length === 0) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4ede1] px-6 py-16 text-[#211a0e]">
        <div className="w-full max-w-md rounded-md border border-[#d9c48a] bg-[#fbf6ec] p-10 text-center shadow-[0_22px_60px_rgba(33,26,14,0.10)]">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-[#9a7826]">
            {brandName}
          </p>
          <h1 className="font-serif text-3xl font-medium text-[#211a0e]">
            Your cart is empty.
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#5c4f38]">
            Add a gold rose gift to start checkout.
          </p>
          <Link
            href="/shop"
            className="mt-7 inline-flex h-12 items-center justify-center rounded-[3px] bg-[#c9a24b] px-7 text-sm font-bold uppercase tracking-[0.16em] text-[#211706] shadow-[0_14px_34px_rgba(184,146,46,0.32)] transition-colors hover:bg-[#9a7826]"
          >
            Shop the edit
          </Link>
        </div>
      </main>
    );
  }

  /** The mock-card branch: the only branch whose form is actually submitted. */
  const mockForm = !skipPayment && !paypalClientId;
  const first = lines[0] ?? null;
  /** The item card shows line 1; any further lines are listed read-only. */
  const extraLines = lines.slice(1);
  const countryName =
    countries.find((entry) => entry.code === country)?.name ?? country;

  const payLabel = skipPayment
    ? pendingMethod === "none"
      ? "PLACING ORDER…"
      : `PLACE ORDER · ${formatMoney(total)}`
    : pendingMethod === "card"
      ? "PROCESSING…"
      : `PAY ${formatMoney(total)} SECURELY`;

  /* =========================== step 1 · details =========================== */

  if (step === "details") {
    // Cart-management band: the redesigned item card has no steppers, so every
    // Owner decision 2026-08-02: no quantity/remove controls at checkout —
    // keep the page as the design draws it. Extra cart lines still LIST
    // read-only (charging for an item the page never shows would be the real
    // bug), matching the payment step's treatment; a single-line cart — what
    // the frame draws — renders nothing extra at all.
    const LINES_H = extraLines.length ? 8 + extraLines.length * 24 + 4 : 0;
    const T_CONTACT = 355 + LINES_H; // contact card top (design 355)
    const T_ADDRESS = 483 + LINES_H; // address card top (design 483)
    const T_GIFT = T_ADDRESS + 314 + 8; // dev band: gift message + duties note
    const T_ACTION = T_GIFT + 116; // entry action card (design 809)
    const canvasHeight = T_ACTION + 141 + 12 + 96;

    return (
      <ScaleFrame
        height={canvasHeight}
        background={CREAM}
        fontClass={notoSC.className}
        nav={false}
      >
        <div style={abs(0, 0, 430, canvasHeight)}>
          <StageStyles />
          <h1 className="sr-only">Checkout</h1>
          <CheckoutHeader step="details" onBack={() => router.push("/shop")} />
          <OrderItemModule
            top={151}
            line={first}
            note={note}
            onEdit={() =>
              first && router.push(`/products/${first.product.handle}`)
            }
          />

          {/* ---------- Extra cart lines, read-only ---------- */}
          {/* The frame draws exactly one item card and no quantity or remove
              control; per the owner (08-02) the page keeps it that way. A cart
              with more than one line still lists the rest, because charging
              for an item the page never shows would be dishonest. Editing the
              basket belongs to /bag once it is wired to the live cart. */}
          {extraLines.map((line, index) => {
            const y = 353 + index * 24;
            return (
              <div key={line.variantId}>
                <Txt
                  x={28}
                  y={y + 4}
                  w={270}
                  size={10}
                  lh={12}
                  color={INK}
                  live
                >
                  {`${line.product.short_name} · Qty ${line.quantity}`}
                </Txt>
                <Txt
                  x={298}
                  y={y + 4}
                  w={104}
                  size={10}
                  lh={12}
                  color={GREEN}
                  weight={500}
                  align="right"
                  live
                >
                  {formatMoney(line.lineTotal)}
                </Txt>
              </div>
            );
          })}

          {/* ---------- Contact Information (2157:278) ---------- */}
          <div
            style={{
              ...abs(16, T_CONTACT, 398, 118),
              background: "#FFFFFF",
              boxShadow: HAIRLINE,
              borderRadius: 12,
            }}
          />
          <Txt
            x={28}
            y={T_CONTACT + 10}
            w={200}
            size={18}
            lh={24}
            color={INK}
            weight={500}
            serif
          >
            Contact Information
          </Txt>
          <FieldBox x={28} y={T_CONTACT + 40} label="EMAIL" />
          <LiveInput
            id="email"
            x={40}
            y={T_CONTACT + 66}
            w={350}
            label="Email"
            value={email}
            onChange={setEmail}
            error={fieldErrors.email}
            errorY={T_CONTACT + 121}
            placeholder="Email address"
            inputMode="email"
            autoComplete="email"
          />
          {/* Marketing opt-in — inert art (promotion-email consent is a
              documented later feature) */}
          <Txt
            x={28}
            y={T_CONTACT + 98}
            w={374}
            size={9}
            lh={10.8}
            color={GREEN}
          >
            {"☑  Send me private offers, gifting ideas and new arrivals."}
          </Txt>

          {/* ---------- Delivery Address (2157:284) ---------- */}
          <div
            style={{
              ...abs(16, T_ADDRESS, 398, 314),
              background: "#FFFFFF",
              boxShadow: HAIRLINE,
              borderRadius: 12,
            }}
          />
          <Txt
            x={28}
            y={T_ADDRESS + 10}
            w={200}
            size={18}
            lh={24}
            color={INK}
            weight={500}
            serif
          >
            Delivery Address
          </Txt>
          <FieldBox
            x={28}
            y={T_ADDRESS + 45}
            label="FULL NAME"
            {...(mockForm
              ? {}
              : { value: "Enter full name", valueMuted: true })}
          />
          {/* CITY / STATE / ZIP row (2201:332) */}
          {[
            { x: 28, w: 116, label: "CITY", ph: "City" },
            { x: 155, w: 75, label: "STATE", ph: "State" },
            { x: 241, w: 160, label: "ZIP CODE", ph: "ZIP / Postal code" },
          ].map((f) => (
            <div key={f.label}>
              <div
                style={{
                  ...abs(f.x, T_ADDRESS + 108, f.w, 48),
                  background: "#FFFFFF",
                  boxShadow: HAIRLINE,
                  borderRadius: 7,
                  overflow: "hidden",
                }}
              />
              <Txt
                x={f.x + 9}
                y={T_ADDRESS + 113}
                w={f.w - 18}
                size={8}
                lh={9.6}
                color={AMBER}
                weight={500}
              >
                {f.label}
              </Txt>
              {mockForm ? null : (
                <Txt
                  x={f.x + 9}
                  y={T_ADDRESS + 125}
                  w={f.w - 14}
                  size={11}
                  lh={13.2}
                  color={MUTED}
                >
                  {f.ph}
                </Txt>
              )}
            </div>
          ))}
          <FieldBox
            x={28}
            y={T_ADDRESS + 167}
            label="STREET ADDRESS"
            {...(mockForm
              ? {}
              : { value: "Enter street address", valueMuted: true })}
          />
          {/* PHONE stays inert art: /api/checkout's shipping payload has no
              phone field — collecting one that goes nowhere would be
              dishonest. */}
          <FieldBox
            x={28}
            y={T_ADDRESS + 230}
            label=" PHONE (Optional)"
            value="Enter phone number"
            valueMuted
          />
          {mockForm ? (
            <>
              <LiveInput
                id="ship-name"
                x={40}
                y={T_ADDRESS + 71}
                w={350}
                label="Recipient full name"
                value={shipping.name}
                onChange={(value) => setShippingField("name", value)}
                error={fieldErrors.name}
                errorY={T_ADDRESS + 97}
                placeholder="Enter full name"
                autoComplete="name"
              />
              <LiveInput
                id="ship-city"
                x={37}
                y={T_ADDRESS + 125}
                w={94}
                small
                label="City"
                value={shipping.city}
                onChange={(value) => setShippingField("city", value)}
                error={fieldErrors.city}
                errorY={T_ADDRESS + 157}
                placeholder="City"
                autoComplete="address-level2"
              />
              <LiveInput
                id="ship-state"
                x={164}
                y={T_ADDRESS + 125}
                w={57}
                small
                label="State / province"
                value={shipping.state}
                onChange={(value) => setShippingField("state", value)}
                error={fieldErrors.state}
                errorY={T_ADDRESS + 157}
                placeholder="State"
                autoComplete="address-level1"
              />
              <LiveInput
                id="ship-zip"
                x={250}
                y={T_ADDRESS + 125}
                w={140}
                small
                label="Postal code"
                value={shipping.postalCode}
                onChange={(value) => setShippingField("postalCode", value)}
                error={fieldErrors.postalCode}
                errorY={T_ADDRESS + 157}
                placeholder="ZIP / Postal code"
                inputMode="numeric"
                autoComplete="postal-code"
              />
              {/* The saved-address card reads "123 Rose Avenue · Apt 5B", so
                  the street line keeps both address fields, split at the
                  design's own separator. */}
              <LiveInput
                id="ship-address1"
                x={40}
                y={T_ADDRESS + 193}
                w={200}
                label="Street address"
                value={shipping.address1}
                onChange={(value) => setShippingField("address1", value)}
                error={fieldErrors.address1}
                errorY={T_ADDRESS + 219}
                placeholder="Enter street address"
                autoComplete="address-line1"
              />
              <Txt
                x={246}
                y={T_ADDRESS + 193}
                w={8}
                size={13}
                lh={15.6}
                color={MUTED}
              >
                ·
              </Txt>
              <LiveInput
                id="ship-address2"
                x={256}
                y={T_ADDRESS + 193}
                w={134}
                label="Apartment, suite (optional)"
                value={shipping.address2}
                onChange={(value) => setShippingField("address2", value)}
                placeholder="Apt, suite"
                autoComplete="address-line2"
              />
            </>
          ) : (
            /* Neither branch sends an address, so the design's boxes keep
               their placeholders rather than collecting one the request
               never carries. */
            <Txt
              x={28}
              y={T_ADDRESS + 292}
              w={374}
              size={9}
              lh={10.8}
              color={MUTED}
            >
              {paypalClientId
                ? "PayPal collects the delivery address in its own secure window."
                : "Test mode — no delivery address is collected."}
            </Txt>
          )}

          {/* ---------- Band · gift message + duties note ---------- */}
          <div
            style={{
              ...abs(16, T_GIFT + 8, 398, 76),
              background: "#FFFFFF",
              boxShadow: HAIRLINE,
              borderRadius: 12,
            }}
          />
          <Txt
            x={28}
            y={T_GIFT + 16}
            w={200}
            size={8}
            lh={9.6}
            color={AMBER}
            weight={500}
          >
            GIFT MESSAGE (OPTIONAL)
          </Txt>
          <textarea
            id="gift-note"
            data-live-text
            className={`${notoSC.className} b2-live`}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Add a note to the recipient…"
            aria-label="Gift message (optional)"
            style={{
              ...abs(28, T_GIFT + 28, 374, 48),
              ...VALUE,
              resize: "none",
            }}
          />
          <Txt
            x={16}
            y={T_GIFT + 90}
            w={398}
            size={9}
            lh={10.8}
            color={MUTED}
            wrap
          >
            Prices are in USD. Any import duties or taxes are the
            recipient&apos;s responsibility.
          </Txt>

          {/* ---------- Entry Action (2164:264) ---------- */}
          <div
            style={{
              ...abs(16, T_ACTION, 398, 141),
              background: CREAM,
              boxShadow: HAIRLINE,
              borderRadius: 14,
            }}
          />
          <Txt
            x={32}
            y={T_ACTION + 16}
            w={300}
            size={20}
            lh={26.7}
            color={INK}
            weight={500}
            serif
          >
            Ready for payment?
          </Txt>
          <Txt x={32} y={T_ACTION + 51} w={366} size={12} lh={14.4} color={INK}>
            Review your contact and delivery details before continuing.
          </Txt>
          <button
            type="button"
            onClick={() => goToStep("payment")}
            className={notoSC.className}
            style={{
              ...abs(32, T_ACTION + 77, 366, 48),
              background: INK,
              borderRadius: 10,
              border: 0,
              padding: 0,
              cursor: "pointer",
              fontSize: 12,
              lineHeight: "48px",
              fontWeight: 500,
              letterSpacing: 1.1,
              color: CREAM,
              textAlign: "center",
            }}
          >
            CONTINUE TO PAYMENT
            <span style={{ color: GOLD, marginLeft: 10 }}>→</span>
          </button>

          {error ? (
            <>
              <div
                style={{
                  ...abs(16, T_ACTION + 161, 398, 34),
                  background: "#FBEFEE",
                  boxShadow: `inset 0 0 0 1px ${RED}`,
                  borderRadius: 8,
                }}
              />
              <Txt
                x={26}
                y={T_ACTION + 170}
                w={378}
                size={10}
                lh={12}
                color={RED}
                weight={500}
                wrap
              >
                {error}
              </Txt>
            </>
          ) : null}
        </div>
      </ScaleFrame>
    );
  }

  /* =========================== step 2 · payment =========================== */

  // Read-only extra cart lines (the item card shows the first line).
  const EXTRA_H = extraLines.length ? 8 + extraLines.length * 24 + 4 : 0;
  const T_SAVED = 355 + EXTRA_H; // saved-address card (design 355, 398×230)
  const T_SHIP = 613 + EXTRA_H; // shipping card (design 613, 398×193)
  const T_PAYMENT = 816 + EXTRA_H; // payment card (design 816, 398×336)
  const feedbackRow = discountError || discount ? 1 : 0;
  const DISC_H = showDiscountField ? 54 + feedbackRow * 20 : 0;
  const T_DISC = T_PAYMENT + 336 + 2; // discount band under the payment card
  const T_SUMMARY = 1162 + EXTRA_H + DISC_H; // summary card (design 1162)
  const SUMMARY_H = discount ? 150 : 124; // no discount → row collapses
  const T_FAQ = T_SUMMARY + SUMMARY_H + 11; // design gap 1312 → 1323
  const canvasHeight2 = T_FAQ + 130 + 96 + 91; // FAQ + reserve + pay-bar room

  const savedCityLine = [
    [shipping.city, shipping.state].filter(Boolean).join(", "),
    shipping.postalCode,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <ScaleFrame
        height={canvasHeight2}
        background={CREAM}
        fontClass={notoSC.className}
        nav={false}
      >
        <div style={abs(0, 0, 430, canvasHeight2)}>
          <StageStyles />
          <h1 className="sr-only">Checkout</h1>
          <CheckoutHeader step="payment" onBack={() => goToStep("details")} />
          <OrderItemModule
            top={151}
            line={first}
            note={note}
            onEdit={() =>
              first && router.push(`/products/${first.product.handle}`)
            }
          />

          {/* read-only extra lines (management lives on the details step) */}
          {extraLines.map((line, index) => {
            const y = 353 + index * 24;
            return (
              <div key={line.variantId}>
                <Txt
                  x={28}
                  y={y + 4}
                  w={270}
                  size={10}
                  lh={12}
                  color={INK}
                  live
                >
                  {`${line.product.short_name} · Qty ${line.quantity}`}
                </Txt>
                <Txt
                  x={298}
                  y={y + 4}
                  w={104}
                  size={10}
                  lh={12}
                  color={GREEN}
                  weight={500}
                  align="right"
                  live
                >
                  {formatMoney(line.lineTotal)}
                </Txt>
              </div>
            );
          })}

          {/* ---------- Saved Delivery Address (2157:429) ---------- */}
          <div
            style={{
              ...abs(16, T_SAVED, 398, 230),
              background: "#FFFFFF",
              boxShadow: HAIRLINE,
              borderRadius: 12,
            }}
          />
          <Txt
            x={28}
            y={T_SAVED + 10}
            w={260}
            size={18}
            lh={24}
            color={INK}
            weight={500}
            serif
          >
            Saved Delivery Address
          </Txt>
          <div
            style={{
              ...abs(28, T_SAVED + 49, 374, 154),
              background: CREAM,
              boxShadow: HAIRLINE,
              borderRadius: 6,
            }}
          />
          {/* DEFAULT badge — design art; there is no saved-address backend,
              the card mirrors what the details step collected. */}
          <div
            style={{
              ...abs(42, T_SAVED + 64, 64, 22),
              background: PINK,
              borderRadius: 11,
            }}
          />
          <Txt
            x={55}
            y={T_SAVED + 69.5}
            w={50}
            size={9}
            lh={10.8}
            color={GOLD}
            weight={500}
          >
            DEFAULT
          </Txt>
          <button
            type="button"
            onClick={() => goToStep("details")}
            aria-label="Change delivery details"
            className={notoSC.className}
            style={{
              ...abs(335, T_SAVED + 69, 56, 12),
              background: "transparent",
              border: 0,
              padding: 0,
              cursor: "pointer",
              fontSize: 10,
              lineHeight: "12px",
              fontWeight: 500,
              color: GOLD,
              textAlign: "left",
            }}
          >
            {"CHANGE →"}
          </button>
          {mockForm ? (
            <>
              <Txt
                x={42}
                y={T_SAVED + 93}
                w={280}
                size={18}
                lh={24}
                color={INK}
                weight={500}
                serif
                live
              >
                {shipping.name || "Recipient"}
              </Txt>
              <Txt
                x={42}
                y={T_SAVED + 123}
                w={346}
                size={12}
                lh={14.4}
                color={INK}
                live
              >
                {[shipping.address1, shipping.address2]
                  .filter(Boolean)
                  .join(" · ") || "Add a street address in Details"}
              </Txt>
              <Txt
                x={42}
                y={T_SAVED + 147}
                w={346}
                size={12}
                lh={14.4}
                color={INK}
                live
              >
                {[savedCityLine, countryName].filter(Boolean).join(" · ")}
              </Txt>
              <Txt
                x={42}
                y={T_SAVED + 171}
                w={346}
                size={12}
                lh={14.4}
                color={MUTED}
                live
              >
                {email}
              </Txt>
            </>
          ) : (
            <>
              <Txt
                x={42}
                y={T_SAVED + 93}
                w={280}
                size={18}
                lh={24}
                color={INK}
                weight={500}
                serif
              >
                {skipPayment ? "Test order" : "PayPal checkout"}
              </Txt>
              <Txt
                x={42}
                y={T_SAVED + 123}
                w={346}
                size={12}
                lh={14.4}
                color={INK}
                wrap
              >
                {paypalClientId
                  ? "PayPal collects the delivery address in its own secure window."
                  : "Test mode — no delivery address is collected."}
              </Txt>
              <Txt
                x={42}
                y={T_SAVED + 171}
                w={346}
                size={12}
                lh={14.4}
                color={INK}
                live
              >
                {`Ships to · ${countryName}`}
              </Txt>
            </>
          )}

          {/* ---------- Shipping Method (2157:456) — cosmetic picker ---------- */}
          <div
            style={{
              ...abs(16, T_SHIP, 398, 193),
              background: "#FFFFFF",
              boxShadow: HAIRLINE,
              borderRadius: 12,
            }}
          />
          <Txt
            x={28}
            y={T_SHIP + 10}
            w={200}
            size={18}
            lh={24}
            color={INK}
            weight={500}
            serif
          >
            Shipping Method
          </Txt>
          {[
            { title: "Standard Delivery", sub: "3–5 business days" },
            { title: "Express Delivery", sub: "2–3 business days" },
            { title: "Next-Day Delivery", sub: "Order before 2 PM" },
          ].map((row, i) => {
            const y = T_SHIP + 40 + i * 50;
            const selected = shipMethod === i;
            return (
              <button
                key={row.title}
                type="button"
                onClick={() => setShipMethod(i)}
                aria-pressed={selected}
                className={notoSC.className}
                style={{
                  ...abs(28, y, 374, 44),
                  background: selected ? CREAM : "#FFFFFF",
                  boxShadow: selected ? `inset 0 0 0 1px ${GREEN}` : HAIRLINE,
                  borderRadius: 7,
                  border: 0,
                  padding: 0,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    ...abs(8, 14, 14),
                    fontSize: 13,
                    lineHeight: "15.6px",
                    fontWeight: 500,
                    color: selected ? GREEN : MUTED,
                    display: "block",
                  }}
                >
                  {selected ? "●" : "○"}
                </span>
                <span
                  style={{
                    ...abs(29, 5, 250),
                    fontSize: 10,
                    lineHeight: "12px",
                    fontWeight: 500,
                    color: INK,
                    display: "block",
                  }}
                >
                  {row.title}
                </span>
                <span
                  style={{
                    ...abs(29, 17, 250),
                    fontSize: 8,
                    lineHeight: "9.6px",
                    color: MUTED,
                    display: "block",
                  }}
                >
                  {row.sub}
                </span>
                {/* No per-method price: the picker is cosmetic (owner
                    decision); the only charged figure is the summary's
                    zone rate. */}
              </button>
            );
          })}

          {/* ---------- Payment (2157:493) ---------- */}
          <div
            style={{
              ...abs(16, T_PAYMENT, 398, 336),
              background: "#FFFFFF",
              boxShadow: HAIRLINE,
              borderRadius: 12,
            }}
          />
          <Txt
            x={28}
            y={T_PAYMENT + 10}
            w={120}
            size={18}
            lh={24}
            color={INK}
            weight={500}
            serif
          >
            Payment
          </Txt>
          <Txt
            x={320}
            y={T_PAYMENT + 10}
            w={82}
            size={10}
            lh={12}
            color={VISA_BLUE}
            weight={500}
          >
            {"VISA   ●●   AMEX"}
          </Txt>
          {/* Credit Card panel (2157:497) */}
          <div
            style={{
              ...abs(28, T_PAYMENT + 41, 374, 126),
              background: PANEL,
              boxShadow: `inset 0 0 0 1px ${GREEN}`,
              borderRadius: 8,
            }}
          />
          <Txt
            x={36}
            y={T_PAYMENT + 49}
            w={120}
            size={11}
            lh={13.2}
            color={GREEN}
            weight={500}
          >
            {"●  Credit Card"}
          </Txt>
          <div
            style={{
              ...abs(36, T_PAYMENT + 68, 358, 36),
              boxShadow: HAIRLINE,
              borderRadius: 6,
            }}
          />
          <div
            style={{
              ...abs(36, T_PAYMENT + 110, 171, 36),
              boxShadow: HAIRLINE,
              borderRadius: 6,
            }}
          />
          <div
            style={{
              ...abs(215, T_PAYMENT + 110, 179, 36),
              boxShadow: HAIRLINE,
              borderRadius: 6,
            }}
          />
          {mockForm ? (
            <>
              <LiveInput
                id="card-number"
                x={46}
                y={T_PAYMENT + 80}
                w={338}
                well
                label="Card number"
                value={card.number}
                onChange={(value) =>
                  setCard((c) => ({ ...c, number: formatCardNumber(value) }))
                }
                error={fieldErrors.cardNumber}
                placeholder="Card number"
                inputMode="numeric"
                autoComplete="cc-number"
              />
              <LiveInput
                id="card-name"
                x={46}
                y={T_PAYMENT + 122}
                w={151}
                well
                label="Name on card"
                value={card.name}
                onChange={(value) => setCard((c) => ({ ...c, name: value }))}
                error={fieldErrors.cardName}
                placeholder="Name on card"
                autoComplete="cc-name"
              />
              {/* The design's MM / YY well keeps expiry and CVV apart inside
                  it — the number is still required to charge a card. */}
              <LiveInput
                id="card-expiry"
                x={225}
                y={T_PAYMENT + 122}
                w={70}
                well
                label="Expiry (MM/YY)"
                value={card.expiry}
                onChange={(value) =>
                  setCard((c) => ({ ...c, expiry: formatExpiry(value) }))
                }
                error={fieldErrors.cardExpiry}
                placeholder="MM / YY"
                inputMode="numeric"
                autoComplete="cc-exp"
              />
              <LiveInput
                id="card-cvc"
                x={305}
                y={T_PAYMENT + 122}
                w={79}
                well
                label="CVC"
                value={card.cvc}
                onChange={(value) =>
                  setCard((c) => ({
                    ...c,
                    cvc: value.replace(/\D/g, "").slice(0, 4),
                  }))
                }
                error={fieldErrors.cardCvc}
                placeholder="CVV"
                inputMode="numeric"
                autoComplete="cc-csc"
              />
              {[
                fieldErrors.cardNumber,
                fieldErrors.cardName,
                fieldErrors.cardExpiry,
                fieldErrors.cardCvc,
              ].some(Boolean) ? (
                <Txt
                  x={36}
                  y={T_PAYMENT + 152}
                  w={358}
                  size={9}
                  lh={10.8}
                  color={RED}
                  weight={500}
                >
                  {[
                    fieldErrors.cardNumber,
                    fieldErrors.cardName,
                    fieldErrors.cardExpiry,
                    fieldErrors.cardCvc,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </Txt>
              ) : null}
            </>
          ) : (
            /* Deliberately no live card fields outside the mock branch: with
               PayPal live the card is collected in PayPal's own window, and a
               PAN typed into a field whose value goes nowhere is a
               PCI/security hazard. */
            <>
              <Txt
                x={46}
                y={T_PAYMENT + 80}
                w={338}
                size={10}
                lh={12}
                color={MUTED}
              >
                {paypalClientId
                  ? "Card and bank details are collected in PayPal's own window."
                  : "Test mode — no payment details are collected."}
              </Txt>
              <Txt
                x={46}
                y={T_PAYMENT + 122}
                w={151}
                size={10}
                lh={12}
                color={MUTED}
              >
                Name on card
              </Txt>
              <Txt
                x={225}
                y={T_PAYMENT + 122}
                w={100}
                size={10}
                lh={12}
                color={MUTED}
              >
                {"MM / YY"}
              </Txt>
            </>
          )}
          {/* PayPal / Apple Pay / Afterpay rows (2170:258/263/268) */}
          {[
            { label: "PayPal", meta: "PayPal", y: T_PAYMENT + 174 },
            { label: "Apple Pay", meta: " Pay", y: T_PAYMENT + 225 },
            { label: "Afterpay", meta: "afterpay ↗", y: T_PAYMENT + 276 },
          ].map((row) => (
            <div key={row.label}>
              <div
                style={{
                  ...abs(28, row.y, 374, 44),
                  background: CREAM,
                  boxShadow: HAIRLINE,
                  borderRadius: 6,
                }}
              />
              <div
                style={{
                  ...abs(40, row.y + 16, 12, 12),
                  boxShadow: HAIRLINE,
                  borderRadius: 6,
                }}
              />
              <Txt
                x={60}
                y={row.y + 14}
                w={120}
                size={13}
                lh={15.6}
                color={INK}
                weight={500}
              >
                {row.label}
              </Txt>
              <Txt
                x={302}
                y={row.y + 15.5}
                w={88}
                size={11}
                lh={13.2}
                color={INK}
                align="right"
              >
                {row.meta}
              </Txt>
            </div>
          ))}
          {/* In mock mode the PayPal row is the mock express entry — a
              transparent live twin sits on the row's own box. */}
          {mockForm ? (
            <button
              type="button"
              onClick={() => {
                if (!isBusy) {
                  submitMockCheckout("paypal", false);
                }
              }}
              aria-label="Pay with PayPal"
              style={{
                ...abs(28, T_PAYMENT + 174, 374, 44),
                appearance: "none",
                border: 0,
                margin: 0,
                padding: 0,
                background: "transparent",
                cursor: "pointer",
              }}
            />
          ) : null}

          {/* ---------- Band · discount code (§8 keeps the feature) ---------- */}
          {showDiscountField ? (
            <>
              <div
                style={{
                  ...abs(16, T_DISC + 4, 398, 46),
                  background: "#FFFFFF",
                  boxShadow: HAIRLINE,
                  borderRadius: 10,
                }}
              />
              <LiveInput
                id="discount-code"
                x={28}
                y={T_DISC + 20.5}
                w={294}
                small
                label="Discount code"
                value={discountInput}
                onChange={setDiscountInput}
                placeholder="Discount code"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => {
                  if (!discountBusy) {
                    applyDiscount();
                  }
                }}
                aria-label="Apply discount code"
                className={notoSC.className}
                style={{
                  ...abs(330, T_DISC + 10, 78, 34),
                  appearance: "none",
                  border: 0,
                  margin: 0,
                  padding: 0,
                  background: GREEN,
                  borderRadius: 8,
                  color: "#FFFFFF",
                  fontSize: 9,
                  lineHeight: "34px",
                  fontWeight: 500,
                  textAlign: "center",
                  cursor: "pointer",
                }}
              >
                {discountBusy ? "…" : "APPLY"}
              </button>
              {discountError ? (
                <Txt
                  x={16}
                  y={T_DISC + 56}
                  w={398}
                  size={11}
                  lh={13.2}
                  color={RED}
                  weight={500}
                  wrap
                >
                  {discountError}
                </Txt>
              ) : discount ? (
                <>
                  <Txt
                    x={16}
                    y={T_DISC + 56}
                    w={300}
                    size={11}
                    lh={13.2}
                    color={GREEN}
                    weight={500}
                    live
                  >
                    {`Code ${discount.code} applied.`}
                  </Txt>
                  <button
                    type="button"
                    onClick={() => {
                      setDiscount(null);
                      setDiscountInput("");
                    }}
                    className={notoSC.className}
                    style={{
                      ...abs(330, T_DISC + 56, 84, 14),
                      ...VALUE,
                      fontSize: 9,
                      lineHeight: "10.8px",
                      fontWeight: 500,
                      color: MUTED,
                      textAlign: "right",
                      cursor: "pointer",
                    }}
                  >
                    REMOVE
                  </button>
                </>
              ) : null}
            </>
          ) : null}

          {/* ---------- Final Order Summary (2157:479), priced live ---------- */}
          <div
            style={{
              ...abs(16, T_SUMMARY, 398, SUMMARY_H),
              background: "#FFFFFF",
              boxShadow: HAIRLINE,
              borderRadius: 12,
            }}
          />
          <Txt
            x={36}
            y={T_SUMMARY + 10}
            w={200}
            size={18}
            lh={24}
            color={INK}
            weight={500}
            serif
          >
            Order Summary
          </Txt>
          <Txt
            x={36}
            y={T_SUMMARY + 42.5}
            w={150}
            size={11}
            lh={13.2}
            color={INK}
          >
            Subtotal
          </Txt>
          <Txt
            x={244}
            y={T_SUMMARY + 42.5}
            w={150}
            size={11}
            lh={13.2}
            color={INK}
            weight={500}
            align="right"
            live
          >
            {formatMoney(subtotal)}
          </Txt>
          {discount ? (
            <>
              <Txt
                x={36}
                y={T_SUMMARY + 68.5}
                w={200}
                size={11}
                lh={13.2}
                color={INK}
                live
              >
                {`Discount (${discount.code})`}
              </Txt>
              <Txt
                x={244}
                y={T_SUMMARY + 68.5}
                w={150}
                size={11}
                lh={13.2}
                color={RED}
                weight={500}
                align="right"
                live
              >
                {`−${formatMoney(discountCents)}`}
              </Txt>
            </>
          ) : null}
          <Txt
            x={36}
            y={T_SUMMARY + (discount ? 94.5 : 68.5)}
            w={220}
            size={11}
            lh={13.2}
            color={INK}
            live
          >
            {`Shipping${zone ? ` (${zone.name})` : ""}`}
          </Txt>
          <Txt
            x={244}
            y={T_SUMMARY + (discount ? 94.5 : 68.5)}
            w={150}
            size={11}
            lh={13.2}
            color={shippingInfo.free ? GREEN : INK}
            weight={500}
            align="right"
            live
          >
            {shippingInfo.free ? "FREE" : formatMoney(shippingInfo.amount)}
          </Txt>
          <Txt
            x={36}
            y={T_SUMMARY + (discount ? 121.5 : 95.5)}
            w={150}
            size={17}
            lh={22.7}
            color={INK}
            weight={500}
            serif
          >
            Order Total
          </Txt>
          <Txt
            x={236}
            y={T_SUMMARY + (discount ? 117 : 91)}
            w={158}
            size={24}
            lh={32}
            color={INK}
            weight={500}
            align="right"
            serif
            live
          >
            {formatMoney(total)}
          </Txt>

          {/* ---------- FAQ accordions (2157:523/524/525) — inert art ----------
              AI-TAG(AI-023): AGENT-UNSURE — the details frame's parked, hidden
              06 block carries an "Ask Auri" help card (2157:372) linking to
              /care/chat; this visible block (2157:516) has no such card, so it
              was not built. See
              /agent-delivery/sessions/figma-sync-chatbot-08-03-feat-figma-sync.md. */}
          {[
            "Delivery & Returns",
            "Privacy & Security",
            "Frequently Asked Questions",
          ].map((q, i) => {
            const y = T_FAQ + i * 46;
            return (
              <div key={q}>
                <div
                  style={{
                    ...abs(16, y, 398, 38),
                    boxShadow: `inset 0 -1px 0 0 ${SAND}`,
                  }}
                />
                <Txt x={32} y={y + 12} w={280} size={12} lh={14.4} color={INK}>
                  {q}
                </Txt>
                <Txt
                  x={380}
                  y={y + 8}
                  w={18}
                  size={18}
                  lh={21.6}
                  color={GOLD}
                  weight={500}
                >
                  ＋
                </Txt>
              </div>
            );
          })}

          {/* error box + status line, in the reserve under the FAQ rows */}
          {error ? (
            <>
              <div
                style={{
                  ...abs(16, T_FAQ + 138, 398, 34),
                  background: "#FBEFEE",
                  boxShadow: `inset 0 0 0 1px ${RED}`,
                  borderRadius: 8,
                }}
              />
              <Txt
                x={26}
                y={T_FAQ + 147}
                w={378}
                size={10}
                lh={12}
                color={RED}
                weight={500}
                wrap
              >
                {error}
              </Txt>
            </>
          ) : null}
          <Txt
            x={16}
            y={T_FAQ + 180}
            w={398}
            size={9}
            lh={10.8}
            color={MUTED}
            align="center"
            wrap
          >
            {pendingMethod === "paypal"
              ? "Starting PayPal checkout…"
              : skipPayment
                ? "Testing phase — payment is switched off. The order is recorded in the admin with a test badge and no money moves."
                : mockForm
                  ? "Development mode — no real charge is taken and card numbers are never stored. Use a test number like 4242 4242 4242 4242."
                  : "PayPal collects shipping and payment in its own secure window."}
          </Txt>
        </div>
      </ScaleFrame>

      {/* The fixed Secure Pay Bar (2157:526) */}
      <PayBar
        total={formatMoney(total)}
        label={payLabel}
        {...(!skipPayment && paypalClientId
          ? {
              payButtonSlot: (
                <PayPalSdkButtons
                  clientId={paypalClientId}
                  buildPayload={() => checkoutPayload(rawLines)}
                  onFail={setError}
                />
              ),
            }
          : {
              onPay: skipPayment
                ? () => {
                    if (!isBusy) {
                      submitMockCheckout("none", false);
                    }
                  }
                : () => {
                    if (!isBusy) {
                      submitMockCheckout("card", true);
                    }
                  },
            })}
      />
    </>
  );
}
