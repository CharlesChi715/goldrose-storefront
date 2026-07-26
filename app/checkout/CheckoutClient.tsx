"use client";

/**
 * ROLE OF THIS FILE
 * The client half of /checkout (§8, §10), wearing the B-2 · Checkout design:
 * the six pixel-exact modules of components/checkout/CheckoutSkin are stacked at
 * their frame offsets and this file supplies every live value and control. The
 * checkout itself is unchanged — cart summary with quantity controls, ship-to
 * country selector (zone-priced shipping), optional gift message (→ the order's
 * Notes card), and payment. With PayPal configured the real JS-SDK buttons drive
 * /api/paypal/create + /capture; otherwise the mock express button and the
 * local card form drive /api/checkout — full click-through, no money anywhere.
 * With `skipPayment` (the testing CHECKOUT_SKIP_PAYMENT flag, §10.4) both of
 * those are replaced by a single Place order CTA; the payment code below is
 * untouched, only unrendered.
 *
 * WHY THE CONTROLS LIVE HERE AND NOT IN THE SKIN
 * The skin's fields take no `id`, and B-2 has no gift-message field, no
 * code-valued country picker, no split expiry/CVV pair and only one item card.
 * So each module paints its own card + label with an empty value and the real
 * control is rendered here at that field's own value-box coordinates
 * (frame-absolute, the house idiom); the skin's parked read-only inputs are
 * kept out of the tab order by one scoped rule in <StageStyles>. Everything the
 * design shows that has no backend (Shop Pay / Apple Pay / Afterpay, the
 * marketing and save-card opt-ins, the FAQ rows, Ask Auri) stays inert art.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScaleFrame } from "@/components/chrome";
import { abs } from "@/lib/figma-layout";
import {
  CHECKOUT_CANVAS_HEIGHT,
  CheckoutContactDelivery,
  CheckoutExpress,
  CheckoutHeader,
  CheckoutOrderItem,
  CheckoutShippingPayment,
  CheckoutSummaryCta,
} from "@/components/checkout/CheckoutSkin";
import { notoSC } from "@/lib/fonts";
import { formatMoney } from "@/lib/money";
import { useCart, type CartLine } from "@/lib/cart/store";
import { computeShipping, zoneForCountry, type ShippingZone } from "@/lib/checkout/zones";
import { fileUrl } from "@/lib/files-url";
import { getVisitorId } from "@/components/Beacon";
import type { PaymentMethodId } from "@/lib/checkout/types";
import type { CatalogProduct } from "@/lib/supabase/types.ts";

const brandName = "GoldRose";

/** What /api/checkout accepts — "none" is the skip-payment testing flow. */
type SubmitMethod = PaymentMethodId | "none";

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

/* ---------- B-2 design tokens + the live controls parked on the skin ---------- */

const INK = "#3B2F2F";
const GREEN = "#09442E";
const MUTED = "#8C8075";
const RED = "#B82924";
const HAIRLINE = "inset 0 0 0 1px #E5D9C9";

/** 753:189 field-value type, on a control stripped of its own chrome. */
const VALUE: React.CSSProperties = {
  appearance: "none",
  border: 0,
  outline: "none",
  background: "transparent",
  padding: 0,
  margin: 0,
  fontSize: 11,
  lineHeight: "13.2px",
  fontWeight: 400,
  color: INK,
};

/** 755:131 card-well type (the payment card's wells set 10/12, not 11/13.2). */
const WELL_VALUE: React.CSSProperties = { ...VALUE, fontSize: 10, lineHeight: "12px" };

function StageStyles() {
  return (
    <style>{`
      .b2-live::placeholder{color:${MUTED};opacity:1}
      .b2-live:focus-visible{outline:2px solid ${GREEN};outline-offset:2px}
      /* Each skin field paints the design's card + label with an empty value;
         its own input is parked read-only because the live twin next to it
         carries the id and the state, so keep the parked one out of the tab
         order (and out of the accessibility tree). */
      .b2-stage input[readonly]{display:none}
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
    ...(align ? { textAlign: align } : {}),
    ...(wrap ? {} : { whiteSpace: "nowrap" }),
  };
  return live ? (
    <p data-live-text className={notoSC.className} style={style}>
      {children}
    </p>
  ) : (
    <p className={notoSC.className} style={style}>
      {children}
    </p>
  );
}

/**
 * One live text control on a B-2 field's value line, plus the inline error the
 * old form showed under its field (each 48px field box keeps ~14px free under
 * its value line; the 36px card wells put theirs at the foot of the card).
 */
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
  /** absolute y of the inline error; omitted keeps it 15px under the value */
  errorY?: number;
  placeholder?: string;
  inputMode?: "text" | "email" | "numeric";
  autoComplete?: string;
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
        style={{ ...abs(x, y, w), ...(well ? WELL_VALUE : VALUE) }}
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

/** The extra-rows band's quantity control, in the skin's 20×20 stepper box. */
function StepperButton({
  x,
  y,
  label,
  onClick,
  children,
}: {
  x: number;
  y: number;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={notoSC.className}
      style={{
        ...abs(x, y, 20, 20),
        ...VALUE,
        fontSize: 10,
        lineHeight: "20px",
        fontWeight: 500,
        textAlign: "center",
        boxShadow: HAIRLINE,
        borderRadius: 6,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
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
      const paypal = (window as unknown as { paypal?: { Buttons: (options: unknown) => { render: (el: HTMLElement) => void } } }).paypal;
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
            onFail(error instanceof Error ? error.message : "PayPal checkout failed.");
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
  const { lines, rawLines, subtotal, hydrated, changeQuantity, remove, clear } =
    useCart(catalog);

  const [email, setEmail] = useState("");
  const [country, setCountry] = useState(defaultCountry);
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
  const [card, setCard] = useState({ name: "", number: "", expiry: "", cvc: "" });
  /**
   * B-2's Standard / Express / Next-Day picker (755:101). Per-method shipping
   * pricing has no backend yet — every method ships at the zone rate — so on
   * the owner's explicit decision the control is cosmetic: this state moves its
   * selected ring and nothing else. It never reaches a price, a total or a
   * request body; the summary's shipping line and the total keep coming from
   * `shippingInfo`/`total` below, and the rows show no per-method price.
   */
  const [shipMethod, setShipMethod] = useState(0);
  /** Scroll anchor on the express PayPal box (see the pay CTA in live mode). */
  const expressRef = useRef<HTMLDivElement>(null);

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

  const zone = useMemo(() => zoneForCountry(zones, country), [zones, country]);
  const discountCents = discount ? Math.min(discount.discountCents, subtotal) : 0;
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
        setFieldErrors(result.fieldErrors ?? {});
        setPendingMethod(null);
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
          <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-[#9a7826]">{brandName}</p>
          <h1 className="font-serif text-3xl font-medium text-[#211a0e]">Your cart is empty.</h1>
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

  /* ---------- B-2 stage geometry (747:103 … 747:108) ---------- */

  /** The mock-card branch: the only branch whose form is actually submitted. */
  const mockForm = !skipPayment && !paypalClientId;

  const first = lines[0] ?? null;
  const firstImage = first?.product.images[0] ?? null;
  /** B-2 draws ONE item card; a multi-line cart keeps its extra rows in a band. */
  const extraLines = lines.slice(1);
  const feedbackRow = discountError || discount ? 1 : 0;
  /** Discount feedback + extra item rows, inserted under the item module. */
  const bandA = feedbackRow || extraLines.length ? 12 + feedbackRow * 20 + extraLines.length * 40 : 0;
  /** Gift message + the USD/duties note — B-2 has no field for either. */
  const NOTE_BAND = 116;
  /** The four card fields share one error line (their wells have no room). */
  const cardErrorText = [
    fieldErrors.cardNumber,
    fieldErrors.cardName,
    fieldErrors.cardExpiry,
    fieldErrors.cardCvc,
  ]
    .filter(Boolean)
    .join(" · ");

  // Module heights come from the frame; each top is the previous module's foot,
  // so an inserted band (or the express module dropping out in skip-payment
  // mode, which has no express UI) moves everything below it as one piece.
  const T_ITEM = 143;
  const T_BAND_A = T_ITEM + 258;
  const T_EXPRESS = T_BAND_A + bandA;
  const T_CONTACT = T_EXPRESS + (skipPayment ? 0 : 230);
  const T_NOTE = T_CONTACT + 410;
  const T_SHIP_PAY = T_NOTE + NOTE_BAND;
  const T_SUMMARY = T_SHIP_PAY + 536;
  // 1577 is the summary module's own frame offset, so the tail (its 500px frame
  // plus the canvas's 25px reserve) stays exactly what 561:88 reserves.
  const canvasHeight = T_SUMMARY + (CHECKOUT_CANVAS_HEIGHT - 1577);

  return (
    <ScaleFrame height={canvasHeight} background="#FFF6EC" fontClass={notoSC.className} nav={false}>
      {/* One wrapper so the stage's own coordinates are also this file's. */}
      <div className="b2-stage" style={abs(0, 0, 430, canvasHeight)}>
        <StageStyles />
        {/* B-2 carries no page-title text (786:179 is the wordmark render and
            753:139 the step names), so the document keeps a real heading. */}
        <h1 className="sr-only">Checkout</h1>

        {/* ---------- 01 · Header + progress (747:103) ---------- */}
        {/* The design's back chevron replaces the old "Continue shopping" link. */}
        <CheckoutHeader top={0} onBack={() => router.push("/shop")} />

        {/* ---------- 02 · Order item + promo (747:104) ---------- */}
        <CheckoutOrderItem
          top={T_ITEM}
          {...(firstImage
            ? { imageSrc: fileUrl(firstImage.path), imageAlt: firstImage.alt }
            : { imageSrc: BLANK_PIXEL, imageAlt: "" })}
          title={first?.product.short_name ?? ""}
          qtyLine={first ? `${first.variant.option_values.join(" · ")} · Qty ${first.quantity}` : ""}
          engravingLine={note.trim() ? `Gift message · ${note.trim()}` : ""}
          giftLine={first && first.quantity > 1 ? `${formatMoney(first.variant.price_cents)} each` : ""}
          price={first ? formatMoney(first.lineTotal) : ""}
          qty={first ? String(first.quantity) : ""}
          {...(first
            ? {
                onQtyDown: () => changeQuantity(first.variantId, -1),
                onQtyUp: () => changeQuantity(first.variantId, 1),
                onRemove: () => remove(first.variantId),
                // 753:165 EDIT → the item's own product page (variant choice).
                onEdit: () => router.push(`/products/${first.product.handle}`),
              }
            : {})}
          // The promo well is parked empty; #discount-code is the live twin.
          promoCode=""
          promoPlaceholder=""
          applyLabel={discountBusy ? "…" : "APPLY"}
          {...(showDiscountField
            ? {
                onApplyPromo: () => {
                  if (!discountBusy) {
                    applyDiscount();
                  }
                },
              }
            : {})}
        />
        {showDiscountField ? (
          <LiveInput
            id="discount-code"
            x={28}
            y={T_ITEM + 174.5}
            w={294}
            label="Discount code"
            value={discountInput}
            onChange={setDiscountInput}
            placeholder="Discount code"
            autoComplete="off"
          />
        ) : (
          /* Settings → Checkout can switch the discount field off (§8); the
             design's card is painted over in the module's own fill. */
          <div style={{ ...abs(16, T_ITEM + 158, 398, 46), background: "#FFF6EC" }} />
        )}

        {/* ---------- Band · discount feedback + any extra item rows ---------- */}
        {discountError ? (
          <Txt x={16} y={T_BAND_A + 6} w={398} size={11} lh={13.2} color={RED} weight={500} wrap>
            {discountError}
          </Txt>
        ) : discount ? (
          <>
            <Txt x={16} y={T_BAND_A + 6} w={300} size={11} lh={13.2} color={GREEN} weight={500} live>
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
                ...abs(330, T_BAND_A + 6, 84, 14),
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
        {extraLines.map((line, index) => {
          const y = T_BAND_A + 6 + feedbackRow * 20 + index * 40;
          return (
            <div key={line.variantId}>
              <div
                style={{
                  ...abs(16, y, 398, 36),
                  background: "#FFFFFF",
                  boxShadow: HAIRLINE,
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              />
              <Txt x={28} y={y + 5} w={190} size={11} lh={13.2} color={INK} weight={500} live>
                {line.product.short_name}
              </Txt>
              <Txt x={28} y={y + 20} w={190} size={8} lh={9.6} color={MUTED} live>
                {`${line.variant.option_values.join(" · ")} · Qty ${line.quantity}`}
              </Txt>
              <StepperButton
                x={226}
                y={y + 8}
                label={`Decrease ${line.product.short_name} quantity`}
                onClick={() => changeQuantity(line.variantId, -1)}
              >
                {"−"}
              </StepperButton>
              <Txt x={248} y={y + 12} w={18} size={10} lh={12} color={INK} weight={500} align="center" live>
                {String(line.quantity)}
              </Txt>
              <StepperButton
                x={270}
                y={y + 8}
                label={`Increase ${line.product.short_name} quantity`}
                onClick={() => changeQuantity(line.variantId, 1)}
              >
                +
              </StepperButton>
              <Txt x={298} y={y + 11} w={56} size={11} lh={13.2} color={GREEN} weight={500} align="right" live>
                {formatMoney(line.lineTotal)}
              </Txt>
              <button
                type="button"
                onClick={() => remove(line.variantId)}
                aria-label={`Remove ${line.product.short_name}`}
                className={notoSC.className}
                style={{
                  ...abs(358, y + 12, 44),
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
            </div>
          );
        })}

        {/* ---------- 03 · Express checkout (747:105) ---------- */}
        {/* Skip-payment mode has no express UI at all, so the module drops out
            rather than showing three boxes that do nothing. */}
        {skipPayment ? null : (
          <>
            <CheckoutExpress
              top={T_EXPRESS}
              {...(paypalClientId
                ? {
                    /* The SDK's own iframe button fills 753:177 (the design's
                       PayPal box) — it cannot be restyled, and the box's own
                       clip keeps the SDK's vertical funding stack to its top
                       (PayPal) button. Shop Pay / Apple Pay have no backend in
                       any mode, so they stay design art. */
                    payButtonSlot: (
                      <PayPalSdkButtons
                        clientId={paypalClientId}
                        buildPayload={() => checkoutPayload(rawLines)}
                        onFail={setError}
                      />
                    ),
                  }
                : {
                    onPayPal: () => {
                      if (!isBusy) {
                        submitMockCheckout("paypal", false);
                      }
                    },
                  })}
            />
            {/* Scroll target for the pay bar when PayPal owns the payment. */}
            <div
              ref={expressRef}
              aria-hidden
              style={{ ...abs(16, T_EXPRESS + 95, 398, 42), pointerEvents: "none" }}
            />
          </>
        )}

        {/* ---------- 04 · Contact + delivery address (747:106) ---------- */}
        {/* Every value is passed empty: the module paints each card, label and
            chevron, and the live twins below carry the ids and the state. */}
        <CheckoutContactDelivery
          top={T_CONTACT}
          email=""
          country=""
          state=""
          recipient=""
          zip=""
          street=""
          city=""
          phone=""
        />
        <LiveInput
          id="email"
          x={37}
          y={T_CONTACT + 67}
          w={356}
          label="Email"
          value={email}
          onChange={setEmail}
          error={fieldErrors.email}
          errorY={T_CONTACT + 82}
          placeholder="you@example.com"
          inputMode="email"
          autoComplete="email"
        />
        {/* 753:194 — shipping is priced from this country's zone (§10.3), so the
            picker is a real <select> over the design's field (its options are
            ISO codes, which the skin's name-valued select cannot express). */}
        <select
          id="ship-country"
          data-live-text
          className={`${notoSC.className} b2-live`}
          value={country}
          onChange={(event) => setCountry(event.target.value)}
          aria-label="Country / region"
          autoComplete="country"
          style={{ ...abs(37, T_CONTACT + 186, 148), ...VALUE, cursor: "pointer" }}
        >
          {countries.map((entry) => (
            <option key={entry.code} value={entry.code}>
              {entry.name}
            </option>
          ))}
        </select>
        {mockForm ? (
          <>
            {/* 753:197 is a picker in the design, but there is no state list
                behind it, so the ⌄ is covered and the field is free text. */}
            <div style={{ ...abs(383, T_CONTACT + 186, 12, 14), background: "#FFFFFF" }} />
            <LiveInput
              id="ship-state"
              x={228}
              y={T_CONTACT + 186}
              w={165}
              label="State / province"
              value={shipping.state}
              onChange={(value) => setShippingField("state", value)}
              error={fieldErrors.state}
              errorY={T_CONTACT + 201}
              autoComplete="address-level1"
            />
            <LiveInput
              id="ship-name"
              x={37}
              y={T_CONTACT + 241}
              w={165}
              label="Recipient full name"
              value={shipping.name}
              onChange={(value) => setShippingField("name", value)}
              error={fieldErrors.name}
              errorY={T_CONTACT + 256}
              autoComplete="name"
            />
            <LiveInput
              id="ship-zip"
              x={228}
              y={T_CONTACT + 241}
              w={165}
              label="Postal code"
              value={shipping.postalCode}
              onChange={(value) => setShippingField("postalCode", value)}
              error={fieldErrors.postalCode}
              errorY={T_CONTACT + 256}
              inputMode="numeric"
              autoComplete="postal-code"
            />
            {/* 753:200's value reads "123 Rose Avenue · Apt 5B", so the street
                line keeps both of the checkout's address fields, split at the
                design's own separator. */}
            <LiveInput
              id="ship-address1"
              x={37}
              y={T_CONTACT + 296}
              w={226}
              label="Street address"
              value={shipping.address1}
              onChange={(value) => setShippingField("address1", value)}
              error={fieldErrors.address1}
              errorY={T_CONTACT + 311}
              autoComplete="address-line1"
            />
            <Txt x={269} y={T_CONTACT + 296} w={8} size={11} lh={13.2} color={MUTED}>
              ·
            </Txt>
            <LiveInput
              id="ship-address2"
              x={279}
              y={T_CONTACT + 296}
              w={114}
              label="Apartment, suite (optional)"
              value={shipping.address2}
              onChange={(value) => setShippingField("address2", value)}
              placeholder="Apt, suite"
              autoComplete="address-line2"
            />
            <LiveInput
              id="ship-city"
              x={37}
              y={T_CONTACT + 351}
              w={165}
              label="City"
              value={shipping.city}
              onChange={(value) => setShippingField("city", value)}
              error={fieldErrors.city}
              errorY={T_CONTACT + 366}
              autoComplete="address-level2"
            />
          </>
        ) : (
          /* Neither branch sends an address, so the design's boxes stay empty
             rather than collecting one the request never carries. */
          <Txt x={16} y={T_CONTACT + 400} w={398} size={9} lh={10.8} color={MUTED}>
            {paypalClientId
              ? "PayPal collects the delivery address in its own secure window."
              : "Test mode — no delivery address is collected."}
          </Txt>
        )}

        {/* ---------- Band · gift message + duties note ---------- */}
        {/* B-2 has no gift-message field (B-1 draws one in static art), but the
            note is the order's Notes card (§8) and every branch sends it, so it
            keeps a band of its own in the design's field language. */}
        <div
          style={{
            ...abs(16, T_NOTE + 8, 398, 76),
            background: "#FFFFFF",
            boxShadow: HAIRLINE,
            borderRadius: 12,
          }}
        />
        {/* 753:188 label type */}
        <Txt x={28} y={T_NOTE + 16} w={130} size={8} lh={9.6} color="#C88217" weight={500}>
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
          style={{ ...abs(28, T_NOTE + 28, 374, 48), ...VALUE, resize: "none" }}
        />
        <Txt x={16} y={T_NOTE + 90} w={398} size={9} lh={10.8} color={MUTED} wrap>
          Prices are in USD. Any import duties or taxes are the recipient&apos;s
          responsibility.
        </Txt>

        {/* ---------- 05 · Shipping method + payment (747:107) ---------- */}
        <CheckoutShippingPayment
          top={T_SHIP_PAY}
          selectedShipping={shipMethod}
          onSelectShipping={setShipMethod}
          // Cosmetic control (see `shipMethod`): the rows carry no prices, since
          // per-method pricing has no backend and the only shipping figure the
          // customer is charged is the summary's zone rate.
          standardPrice=""
          expressPrice=""
          nextDayPrice=""
          // The wells are parked empty in every branch; in the mock branch the
          // live twins below sit on top of them.
          cardNumber=""
          cardNumberPlaceholder=""
          cardName=""
          cardNamePlaceholder=""
          cardExpiryCvv=""
          cardExpiryCvvPlaceholder=""
        />
        {mockForm ? (
          <>
            <LiveInput
              id="card-number"
              x={46}
              y={T_SHIP_PAY + 278}
              w={338}
              well
              label="Card number"
              value={card.number}
              onChange={(value) => setCard((c) => ({ ...c, number: formatCardNumber(value) }))}
              error={fieldErrors.cardNumber}
              placeholder="4242 4242 4242 4242"
              inputMode="numeric"
              autoComplete="cc-number"
            />
            <LiveInput
              id="card-name"
              x={46}
              y={T_SHIP_PAY + 320}
              w={151}
              well
              label="Name on card"
              value={card.name}
              onChange={(value) => setCard((c) => ({ ...c, name: value }))}
              error={fieldErrors.cardName}
              placeholder="Name on card"
              autoComplete="cc-name"
            />
            {/* 755:135 is one MM / YY  CVV well; the checkout keeps them apart. */}
            <LiveInput
              id="card-expiry"
              x={225}
              y={T_SHIP_PAY + 320}
              w={70}
              well
              label="Expiry (MM/YY)"
              value={card.expiry}
              onChange={(value) => setCard((c) => ({ ...c, expiry: formatExpiry(value) }))}
              error={fieldErrors.cardExpiry}
              placeholder="MM / YY"
              inputMode="numeric"
              autoComplete="cc-exp"
            />
            <LiveInput
              id="card-cvc"
              x={305}
              y={T_SHIP_PAY + 320}
              w={79}
              well
              label="CVC"
              value={card.cvc}
              onChange={(value) => setCard((c) => ({ ...c, cvc: value.replace(/\D/g, "").slice(0, 4) }))}
              error={fieldErrors.cardCvc}
              placeholder="CVV"
              inputMode="numeric"
              autoComplete="cc-csc"
            />
            {/* The wells are 36px tall with no room under them, so the card's
                field errors share the foot of 755:128. */}
            {cardErrorText ? (
              <Txt x={36} y={T_SHIP_PAY + 348} w={358} size={9} lh={10.8} color={RED} weight={500}>
                {cardErrorText}
              </Txt>
            ) : null}
          </>
        ) : (
          /* Deliberately no live card fields outside the mock branch: with
             PayPal live the card is collected in PayPal's own window, and a PAN
             typed into a field whose value goes nowhere is a PCI/security
             hazard. The design's wells stay empty and say so. */
          <Txt x={16} y={T_SHIP_PAY + 524} w={398} size={9} lh={10.8} color={MUTED}>
            {paypalClientId
              ? "Card and bank details are collected in PayPal's own window."
              : "Test mode — no payment details are collected."}
          </Txt>
        )}

        {/* ---------- 06 · Summary + help + secure CTA (747:108) ---------- */}
        <CheckoutSummaryCta
          top={T_SUMMARY}
          subtotal={formatMoney(subtotal)}
          discountLabel={discount ? `Discount (${discount.code})` : ""}
          discount={discount ? `−${formatMoney(discountCents)}` : ""}
          shippingLabel={`Shipping${zone ? ` (${zone.name})` : ""}`}
          shipping={shippingInfo.free ? "FREE" : formatMoney(shippingInfo.amount)}
          shippingColor={shippingInfo.free ? GREEN : INK}
          total={formatMoney(total)}
          barTotal={formatMoney(total)}
          payLabel={
            skipPayment
              ? pendingMethod === "none"
                ? "Placing order…"
                : `Place order · ${formatMoney(total)}`
              : mockForm
                ? pendingMethod === "card"
                  ? "Processing…"
                  : `Pay ${formatMoney(total)} Securely`
                : "Continue to PayPal"
          }
          // 756:132 has no disabled state, so the guard the old button's
          // `disabled={isBusy}` gave it lives in the handler.
          onPay={
            skipPayment
              ? () => {
                  if (!isBusy) {
                    submitMockCheckout("none", false);
                  }
                }
              : mockForm
                ? () => {
                    if (!isBusy) {
                      submitMockCheckout("card", true);
                    }
                  }
                : // With PayPal live the SDK's own button is the only thing that
                  // can start a payment, so the CTA goes to it.
                  () => expressRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
          }
        />
        {error ? (
          <>
            <div
              style={{
                ...abs(16, T_SUMMARY + 428, 398, 34),
                background: "#FBEFEE",
                boxShadow: `inset 0 0 0 1px ${RED}`,
                borderRadius: 8,
              }}
            />
            <Txt x={26} y={T_SUMMARY + 437} w={378} size={10} lh={12} color={RED} weight={500} wrap>
              {error}
            </Txt>
          </>
        ) : null}
        <Txt x={16} y={T_SUMMARY + 466} w={398} size={9} lh={10.8} color={MUTED} align="center" wrap>
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
  );
}
