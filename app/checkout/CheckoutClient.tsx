"use client";

/**
 * ROLE OF THIS FILE
 * The client half of /checkout (§8, §10), wearing the B-2 · Checkout design
 * (1523:421, the 2026-07-30 reflow): the five pixel-exact modules of
 * components/checkout/CheckoutSkin are stacked at their frame offsets and this
 * file supplies every live value and control. The checkout itself is unchanged
 * — cart summary with quantity controls, ship-to country selector (zone-priced
 * shipping), optional gift message (→ the order's Notes card), and payment.
 * With PayPal configured the real JS-SDK button drives /api/paypal/create +
 * /capture from inside the Pay-Securely CTA's slot (the reflow removed the
 * express-wallet module that used to host it); otherwise the payment section's
 * PayPal row and the local card form drive /api/checkout — full click-through,
 * no money anywhere. With `skipPayment` (the testing CHECKOUT_SKIP_PAYMENT
 * flag, §10.4) both of those are replaced by a single Place order CTA; the
 * payment code below is untouched, only unrendered.
 *
 * WHY THE CONTROLS LIVE HERE AND NOT IN THE SKIN
 * The skin's fields take no `id`, and B-2 has no gift-message field, no
 * discount-code card (the reflow deleted it, but the summary still prices a
 * Discount row and §8 keeps the feature, so a band in the design's own field
 * language carries it — flagged to the design team), no code-valued country
 * picker and only one item card. So each module paints its own card + label
 * with an empty value and the real control is rendered here at that field's
 * own value-box coordinates (frame-absolute, the house idiom); the skin's
 * parked read-only inputs are kept out of the tab order by one scoped rule in
 * <StageStyles>. Everything the design shows that has no backend (Apple Pay /
 * Afterpay, the marketing and save-card opt-ins, the FAQ rows, Ask Auri)
 * stays inert art.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScaleFrame } from "@/components/chrome";
import { abs } from "@/lib/figma-layout";
import {
  CheckoutContactDelivery,
  CheckoutHeader,
  CheckoutHelpCta,
  CheckoutOrderItem,
  CheckoutShippingPayment,
} from "@/components/checkout/CheckoutSkin";
import { notoSC } from "@/lib/fonts";
import { formatMoney } from "@/lib/money";
import { useCart, type CartLine } from "@/lib/cart/store";
import {
  computeShipping,
  zoneForCountry,
  type ShippingZone,
} from "@/lib/checkout/zones";
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
  const [card, setCard] = useState({
    name: "",
    number: "",
    expiry: "",
    cvc: "",
  });
  /**
   * B-2's Standard / Express / Next-Day picker (755:101). Per-method shipping
   * pricing has no backend yet — every method ships at the zone rate — so on
   * the owner's explicit decision the control is cosmetic: this state moves its
   * selected ring and nothing else. It never reaches a price, a total or a
   * request body; the summary's shipping line and the total keep coming from
   * `shippingInfo`/`total` below, and the rows show no per-method price.
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

  /* ---------- B-2 stage geometry (1523:423 … 1523:553) ---------- */

  /** The mock-card branch: the only branch whose form is actually submitted. */
  const mockForm = !skipPayment && !paypalClientId;

  const first = lines[0] ?? null;
  const firstImage = first?.product.images[0] ?? null;
  /** B-2 draws ONE item card; a multi-line cart keeps its extra rows in a band. */
  const extraLines = lines.slice(1);
  const feedbackRow = discountError || discount ? 1 : 0;
  /** Discount feedback + extra item rows, inserted under the item module. */
  const bandA =
    feedbackRow || extraLines.length
      ? 12 + feedbackRow * 20 + extraLines.length * 40
      : 0;
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
  // so an inserted band moves everything below it as one piece.
  const T_ITEM = 143;
  const T_BAND_A = T_ITEM + 202;
  /** The reflow deleted the design's discount-code card; §8 keeps the feature,
      so the band repaints the old card in the design's field language. */
  const DISCOUNT_BAND = showDiscountField ? 54 : 0;
  const T_FEEDBACK = T_BAND_A + DISCOUNT_BAND;
  const T_CONTACT = T_FEEDBACK + bandA;
  const T_NOTE = T_CONTACT + 410;
  const T_SHIP_PAY = T_NOTE + NOTE_BAND;
  const T_TAIL = T_SHIP_PAY + 692;
  // The frame ends flush with module 06 (281px), so the error box and status
  // line that used to sit in the old tail's white space get their own reserve.
  const canvasHeight = T_TAIL + 281 + 96;

  return (
    <ScaleFrame
      height={canvasHeight}
      background="#FFF6EC"
      fontClass={notoSC.className}
      nav={false}
    >
      {/* One wrapper so the stage's own coordinates are also this file's. */}
      <div className="b2-stage" style={abs(0, 0, 430, canvasHeight)}>
        <StageStyles />
        {/* B-2 carries no page-title text (786:179 is the wordmark render and
            753:139 the step names), so the document keeps a real heading. */}
        <h1 className="sr-only">Checkout</h1>

        {/* ---------- 01 · Header + progress (747:103) ---------- */}
        {/* The design's back chevron replaces the old "Continue shopping" link. */}
        <CheckoutHeader top={0} onBack={() => router.push("/shop")} />

        {/* ---------- 02 · Order item + assurances (1523:444) ---------- */}
        <CheckoutOrderItem
          top={T_ITEM}
          {...(firstImage
            ? { imageSrc: fileUrl(firstImage.path), imageAlt: firstImage.alt }
            : { imageSrc: BLANK_PIXEL, imageAlt: "" })}
          title={first?.product.short_name ?? ""}
          qtyLine={
            first
              ? `${first.variant.option_values.join(" · ")} · Qty ${first.quantity}`
              : ""
          }
          engravingLine={note.trim() ? `Gift message · ${note.trim()}` : ""}
          giftLine={
            first && first.quantity > 1
              ? `${formatMoney(first.variant.price_cents)} each`
              : ""
          }
          price={first ? formatMoney(first.lineTotal) : ""}
          qty={first ? String(first.quantity) : ""}
          {...(first
            ? {
                onQtyDown: () => changeQuantity(first.variantId, -1),
                onQtyUp: () => changeQuantity(first.variantId, 1),
                onRemove: () => remove(first.variantId),
                // 1523:454 EDIT → the item's own product page (variant choice).
                onEdit: () => router.push(`/products/${first.product.handle}`),
              }
            : {})}
        />

        {/* ---------- Band · discount code ---------- */}
        {/* The reflow deleted this card from the frame, but the summary still
            prices a Discount row and §8 keeps the feature, so the old card
            (561:88's 753:166 geometry, the design's own field language) stays
            as a dev band. Settings → Checkout can switch it off. */}
        {showDiscountField ? (
          <>
            <div
              style={{
                ...abs(16, T_BAND_A + 4, 398, 46),
                background: "#FFFFFF",
                boxShadow: HAIRLINE,
                borderRadius: 10,
              }}
            />
            <LiveInput
              id="discount-code"
              x={28}
              y={T_BAND_A + 20.5}
              w={294}
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
                ...abs(330, T_BAND_A + 10, 78, 34),
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
          </>
        ) : null}

        {/* ---------- Band · discount feedback + any extra item rows ---------- */}
        {discountError ? (
          <Txt
            x={16}
            y={T_FEEDBACK + 6}
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
              y={T_FEEDBACK + 6}
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
                ...abs(330, T_FEEDBACK + 6, 84, 14),
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
          const y = T_FEEDBACK + 6 + feedbackRow * 20 + index * 40;
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
              <Txt
                x={28}
                y={y + 5}
                w={190}
                size={11}
                lh={13.2}
                color={INK}
                weight={500}
                live
              >
                {line.product.short_name}
              </Txt>
              <Txt
                x={28}
                y={y + 20}
                w={190}
                size={8}
                lh={9.6}
                color={MUTED}
                live
              >
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
              <Txt
                x={248}
                y={y + 12}
                w={18}
                size={10}
                lh={12}
                color={INK}
                weight={500}
                align="center"
                live
              >
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
              <Txt
                x={298}
                y={y + 11}
                w={56}
                size={11}
                lh={13.2}
                color={GREEN}
                weight={500}
                align="right"
                live
              >
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

        {/* ---------- 04 · Contact + delivery address (1523:459) ---------- */}
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
        {/* 1523:469 — shipping is priced from this country's zone (§10.3), so
            the picker is a real <select> over the design's field (its options
            are ISO codes, which the skin's name-valued select cannot express).
            The reflow gives the field 116px; the select stops short of the
            baked ⌄ at the field's right inset. */}
        <select
          id="ship-country"
          data-live-text
          className={`${notoSC.className} b2-live`}
          value={country}
          onChange={(event) => setCountry(event.target.value)}
          aria-label="Country / region"
          autoComplete="country"
          style={{
            ...abs(295, T_CONTACT + 190, 82),
            ...VALUE,
            cursor: "pointer",
          }}
        >
          {countries.map((entry) => (
            <option key={entry.code} value={entry.code}>
              {entry.name}
            </option>
          ))}
        </select>
        {mockForm ? (
          <>
            <LiveInput
              id="ship-name"
              x={37}
              y={T_CONTACT + 190}
              w={153}
              label="Recipient full name"
              value={shipping.name}
              onChange={(value) => setShippingField("name", value)}
              error={fieldErrors.name}
              errorY={T_CONTACT + 205}
              autoComplete="name"
            />
            {/* 1523:472 is a picker in the design, but there is no state list
                behind it, so the ⌄ is covered and the field is free text. */}
            <div
              style={{
                ...abs(262, T_CONTACT + 191, 12, 14),
                background: "#FFFFFF",
              }}
            />
            <LiveInput
              id="ship-state"
              x={214}
              y={T_CONTACT + 190}
              w={57}
              label="State / province"
              value={shipping.state}
              onChange={(value) => setShippingField("state", value)}
              error={fieldErrors.state}
              errorY={T_CONTACT + 205}
              autoComplete="address-level1"
            />
            <LiveInput
              id="ship-zip"
              x={37}
              y={T_CONTACT + 249}
              w={356}
              label="Postal code"
              value={shipping.postalCode}
              onChange={(value) => setShippingField("postalCode", value)}
              error={fieldErrors.postalCode}
              errorY={T_CONTACT + 264}
              inputMode="numeric"
              autoComplete="postal-code"
            />
            {/* 1523:484's value reads "123 Rose Avenue · Apt 5B", so the street
                line keeps both of the checkout's address fields, split at the
                design's own separator. */}
            <LiveInput
              id="ship-address1"
              x={37}
              y={T_CONTACT + 293}
              w={226}
              label="Street address"
              value={shipping.address1}
              onChange={(value) => setShippingField("address1", value)}
              error={fieldErrors.address1}
              errorY={T_CONTACT + 308}
              autoComplete="address-line1"
            />
            <Txt
              x={269}
              y={T_CONTACT + 293}
              w={8}
              size={11}
              lh={13.2}
              color={MUTED}
            >
              ·
            </Txt>
            <LiveInput
              id="ship-address2"
              x={279}
              y={T_CONTACT + 293}
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
              y={T_CONTACT + 352}
              w={165}
              label="City"
              value={shipping.city}
              onChange={(value) => setShippingField("city", value)}
              error={fieldErrors.city}
              errorY={T_CONTACT + 367}
              autoComplete="address-level2"
            />
          </>
        ) : (
          /* Neither branch sends an address, so the design's boxes stay empty
             rather than collecting one the request never carries. */
          <Txt
            x={16}
            y={T_CONTACT + 400}
            w={398}
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
        <Txt
          x={28}
          y={T_NOTE + 16}
          w={130}
          size={8}
          lh={9.6}
          color="#C88217"
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
          style={{ ...abs(28, T_NOTE + 28, 374, 48), ...VALUE, resize: "none" }}
        />
        <Txt
          x={16}
          y={T_NOTE + 90}
          w={398}
          size={9}
          lh={10.8}
          color={MUTED}
          wrap
        >
          Prices are in USD. Any import duties or taxes are the recipient&apos;s
          responsibility.
        </Txt>

        {/* ---------- 05 · Shipping + summary + payment (1523:492) ---------- */}
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
          // 1523:516 — the reflow's summary card, priced live.
          subtotal={formatMoney(subtotal)}
          discountLabel={discount ? `Discount (${discount.code})` : ""}
          discount={discount ? `−${formatMoney(discountCents)}` : ""}
          shippingLabel={`Shipping${zone ? ` (${zone.name})` : ""}`}
          shipping={
            shippingInfo.free ? "FREE" : formatMoney(shippingInfo.amount)
          }
          shippingColor={shippingInfo.free ? GREEN : INK}
          total={formatMoney(total)}
          // The wells are parked empty in every branch; in the mock branch the
          // live twins below sit on top of them.
          cardNumber=""
          cardNumberPlaceholder=""
          cardName=""
          cardNamePlaceholder=""
          cardExpiry=""
          cardExpiryPlaceholder=""
        />
        {/* 1523:543 — in mock mode the PayPal row is the mock express entry
            (the reflow removed the express module that used to carry it), so a
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
              ...abs(28, T_SHIP_PAY + 532, 374, 36),
              appearance: "none",
              border: 0,
              margin: 0,
              padding: 0,
              background: "transparent",
              cursor: "pointer",
            }}
          />
        ) : null}
        {mockForm ? (
          <>
            <LiveInput
              id="card-number"
              x={46}
              y={T_SHIP_PAY + 438}
              w={338}
              well
              label="Card number"
              value={card.number}
              onChange={(value) =>
                setCard((c) => ({ ...c, number: formatCardNumber(value) }))
              }
              error={fieldErrors.cardNumber}
              placeholder="4242 4242 4242 4242"
              inputMode="numeric"
              autoComplete="cc-number"
            />
            <LiveInput
              id="card-name"
              x={46}
              y={T_SHIP_PAY + 480}
              w={151}
              well
              label="Name on card"
              value={card.name}
              onChange={(value) => setCard((c) => ({ ...c, name: value }))}
              error={fieldErrors.cardName}
              placeholder="Name on card"
              autoComplete="cc-name"
            />
            {/* 1523:541 is one MM / YY well; the checkout keeps expiry and CVV
                apart inside it (the reflow dropped the CVV hint from the
                placeholder, not the need for the number). */}
            <LiveInput
              id="card-expiry"
              x={225}
              y={T_SHIP_PAY + 480}
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
              y={T_SHIP_PAY + 480}
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
            {/* The wells are 36px tall with no room under them, so the card's
                field errors share the foot of 1523:534. */}
            {cardErrorText ? (
              <Txt
                x={36}
                y={T_SHIP_PAY + 508}
                w={358}
                size={9}
                lh={10.8}
                color={RED}
                weight={500}
              >
                {cardErrorText}
              </Txt>
            ) : null}
          </>
        ) : (
          /* Deliberately no live card fields outside the mock branch: with
             PayPal live the card is collected in PayPal's own window, and a PAN
             typed into a field whose value goes nowhere is a PCI/security
             hazard. The design's wells stay empty and say so, at their own
             foot. */
          <Txt
            x={36}
            y={T_SHIP_PAY + 508}
            w={358}
            size={9}
            lh={10.8}
            color={MUTED}
          >
            {paypalClientId
              ? "Card and bank details are collected in PayPal's own window."
              : "Test mode — no payment details are collected."}
          </Txt>
        )}

        {/* ---------- 06 · Help + FAQ + secure CTA (1523:553) ---------- */}
        <CheckoutHelpCta
          top={T_TAIL}
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
                : "Pay with PayPal"
          }
          // 1523:565 has no disabled state, so the guard the old button's
          // `disabled={isBusy}` gave it lives in the handler.
          {...(!skipPayment && paypalClientId
            ? {
                /* With PayPal live the SDK's own iframe button is the only
                   thing that can start a payment; the reflow removed the
                   express module that used to host it, so it fills the CTA's
                   own 276×48 box. */
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
        {/* The frame ends flush with the pay bar, so the error box and status
            line live in the canvas's added reserve below module 06. */}
        {error ? (
          <>
            <div
              style={{
                ...abs(16, T_TAIL + 289, 398, 34),
                background: "#FBEFEE",
                boxShadow: `inset 0 0 0 1px ${RED}`,
                borderRadius: 8,
              }}
            />
            <Txt
              x={26}
              y={T_TAIL + 298}
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
          y={T_TAIL + 331}
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
  );
}
