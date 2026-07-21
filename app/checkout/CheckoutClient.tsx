"use client";

/**
 * ROLE OF THIS FILE
 * The client half of /checkout (§8, §10): cart summary with quantity
 * controls, ship-to country selector (zone-priced shipping), optional gift
 * message (→ the order's Notes card), and payment. With PayPal configured
 * the real JS-SDK buttons drive /api/paypal/create + /capture; otherwise
 * the mock express button and the local card form drive /api/checkout —
 * full click-through, no money anywhere.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatMoney } from "@/lib/products";
import { useCart, type CartLine } from "@/lib/cart/store";
import { computeShipping, zoneForCountry, type ShippingZone } from "@/lib/checkout/zones";
import { expressMethods } from "@/lib/checkout/methods";
import { fileUrl } from "@/lib/files-url";
import type { PaymentMethodId } from "@/lib/checkout/types";
import type { CatalogProduct } from "@/lib/supabase/types.ts";

const brandName = "GoldRose";

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

/** One labelled text input with inline error display. */
function Field({
  id,
  label,
  value,
  onChange,
  error,
  placeholder,
  inputMode,
  autoComplete,
  className = "",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  inputMode?: "text" | "email" | "numeric";
  autoComplete?: string;
  className?: string;
}) {
  return (
    <div className={`grid gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-xs font-black uppercase tracking-[0.14em] text-[#6b5c3f]">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        className={`h-11 rounded-[3px] border bg-[#fffaf2] px-3 text-sm text-[#211a0e] outline-none transition focus:border-[#9a7826] ${
          error ? "border-[#b3473f]" : "border-[#d7c28a]"
        }`}
      />
      {error ? <p className="text-xs text-[#b3473f]">{error}</p> : null}
    </div>
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
  const payloadRef = useRef(buildPayload);
  payloadRef.current = buildPayload;

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
}: {
  catalog: CatalogProduct[];
  zones: ShippingZone[];
  countries: Array<{ code: string; name: string }>;
  defaultCountry: string;
  paypalClientId: string | null;
}) {
  const router = useRouter();
  const { lines, rawLines, subtotal, hydrated, changeQuantity, remove, clear } =
    useCart(catalog);

  const [email, setEmail] = useState("");
  const [country, setCountry] = useState(defaultCountry);
  const [note, setNote] = useState("");
  const [shipping, setShipping] = useState({
    name: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    postalCode: "",
  });
  const [card, setCard] = useState({ name: "", number: "", expiry: "", cvc: "" });

  const [pendingMethod, setPendingMethod] = useState<PaymentMethodId | null>(null);
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
  const shippingInfo = useMemo(() => {
    if (subtotal === 0 || !zone) {
      return { amount: 0, free: false };
    }
    return computeShipping(zone, subtotal);
  }, [zone, subtotal]);
  const total = subtotal + shippingInfo.amount;

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
    };
  }

  /** Mock-mode submit for both methods (§10.4). */
  async function submitMockCheckout(method: PaymentMethodId, withForm: boolean) {
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

  return (
    <main className="min-h-screen bg-[#f4ede1] text-[#211a0e]">
      <header className="border-b border-[#c9a24b]/25 bg-[#fbf6ec]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="font-serif text-2xl uppercase tracking-[0.22em] text-[#211a0e]">
            {brandName}
            <span className="text-[#b8922e]">.</span>
          </Link>
          <Link href="/shop" className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a6a22] hover:text-[#9a7826]">
            ← Continue shopping
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:py-14">
        {/* Payment column */}
        <section className="order-2 lg:order-1">
          <h1 className="font-serif text-4xl font-medium leading-tight text-[#211a0e]">Checkout</h1>
          <p className="mt-2 text-sm leading-6 text-[#5c4f38]">
            {paypalClientId
              ? "Pay securely with PayPal — balance, linked bank, or card."
              : "Pay with PayPal in one tap, or enter a card below."}
          </p>

          {/* Ship-to country: shipping is priced from its zone (§10.3) */}
          <div className="mt-6 grid gap-1.5">
            <label
              htmlFor="ship-country"
              className="text-xs font-black uppercase tracking-[0.14em] text-[#6b5c3f]"
            >
              Ship to
            </label>
            <select
              id="ship-country"
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              className="h-11 rounded-[3px] border border-[#d7c28a] bg-[#fffaf2] px-3 text-sm text-[#211a0e] outline-none focus:border-[#9a7826]"
            >
              {countries.map((entry) => (
                <option key={entry.code} value={entry.code}>
                  {entry.name}
                </option>
              ))}
            </select>
            <p className="text-xs leading-5 text-[#7c6e50]">
              Prices are in USD. Any import duties or taxes are the recipient&apos;s
              responsibility.
            </p>
          </div>

          {/* Gift message → the order's Notes card (§8) */}
          <div className="mt-5 grid gap-1.5">
            <label
              htmlFor="gift-note"
              className="text-xs font-black uppercase tracking-[0.14em] text-[#6b5c3f]"
            >
              Gift message (optional)
            </label>
            <textarea
              id="gift-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Add a note to the recipient…"
              className="rounded-[3px] border border-[#d7c28a] bg-[#fffaf2] p-3 text-sm text-[#211a0e] outline-none focus:border-[#9a7826]"
            />
          </div>

          {/* Express checkout */}
          <div className="mt-7">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9a7826]">Express checkout</p>
            <div className="mt-3 grid gap-3">
              {paypalClientId ? (
                <PayPalSdkButtons
                  clientId={paypalClientId}
                  buildPayload={() => checkoutPayload(rawLines)}
                  onFail={setError}
                />
              ) : (
                expressMethods.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    disabled={isBusy}
                    onClick={() => submitMockCheckout(method.id, false)}
                    style={{ background: method.background, color: method.color }}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-[4px] text-sm font-bold tracking-[0.04em] shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {pendingMethod === method.id ? "Starting…" : method.label}
                  </button>
                ))
              )}
            </div>
            <p className="mt-2 text-xs leading-5 text-[#7c6e50]">
              PayPal collects shipping and payment in its own secure window.
            </p>
          </div>

          {paypalClientId ? null : (
            <>
              <div className="my-7 flex items-center gap-4 text-xs font-bold uppercase tracking-[0.18em] text-[#a99a78]">
                <span className="h-px flex-1 bg-[#d7c28a]" />
                Or pay with card
                <span className="h-px flex-1 bg-[#d7c28a]" />
              </div>

              {/* Card form — mock/dev mode only */}
              <form
                className="grid gap-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  submitMockCheckout("card", true);
                }}
              >
                <div className="grid gap-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9a7826]">Contact</p>
                  <Field
                    id="email"
                    label="Email"
                    value={email}
                    onChange={setEmail}
                    error={fieldErrors.email}
                    placeholder="you@example.com"
                    inputMode="email"
                    autoComplete="email"
                  />
                </div>

                <div className="grid gap-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9a7826]">Shipping address</p>
                  <Field
                    id="ship-name"
                    label="Full name"
                    value={shipping.name}
                    onChange={(value) => setShippingField("name", value)}
                    error={fieldErrors.name}
                    autoComplete="name"
                  />
                  <Field
                    id="ship-address1"
                    label="Address"
                    value={shipping.address1}
                    onChange={(value) => setShippingField("address1", value)}
                    error={fieldErrors.address1}
                    autoComplete="address-line1"
                  />
                  <Field
                    id="ship-address2"
                    label="Apartment, suite (optional)"
                    value={shipping.address2}
                    onChange={(value) => setShippingField("address2", value)}
                    autoComplete="address-line2"
                  />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field
                      id="ship-city"
                      label="City"
                      value={shipping.city}
                      onChange={(value) => setShippingField("city", value)}
                      error={fieldErrors.city}
                      autoComplete="address-level2"
                    />
                    <Field
                      id="ship-state"
                      label="State / Province"
                      value={shipping.state}
                      onChange={(value) => setShippingField("state", value)}
                      error={fieldErrors.state}
                      autoComplete="address-level1"
                    />
                    <Field
                      id="ship-zip"
                      label="Postal code"
                      value={shipping.postalCode}
                      onChange={(value) => setShippingField("postalCode", value)}
                      error={fieldErrors.postalCode}
                      inputMode="numeric"
                      autoComplete="postal-code"
                    />
                  </div>
                </div>

                <div className="grid gap-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9a7826]">Card details</p>
                  <Field
                    id="card-name"
                    label="Name on card"
                    value={card.name}
                    onChange={(value) => setCard((c) => ({ ...c, name: value }))}
                    error={fieldErrors.cardName}
                    autoComplete="cc-name"
                  />
                  <Field
                    id="card-number"
                    label="Card number"
                    value={card.number}
                    onChange={(value) => setCard((c) => ({ ...c, number: formatCardNumber(value) }))}
                    error={fieldErrors.cardNumber}
                    placeholder="4242 4242 4242 4242"
                    inputMode="numeric"
                    autoComplete="cc-number"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      id="card-expiry"
                      label="Expiry (MM/YY)"
                      value={card.expiry}
                      onChange={(value) => setCard((c) => ({ ...c, expiry: formatExpiry(value) }))}
                      error={fieldErrors.cardExpiry}
                      placeholder="08/29"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                    />
                    <Field
                      id="card-cvc"
                      label="CVC"
                      value={card.cvc}
                      onChange={(value) => setCard((c) => ({ ...c, cvc: value.replace(/\D/g, "").slice(0, 4) }))}
                      error={fieldErrors.cardCvc}
                      placeholder="123"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                    />
                  </div>
                </div>

                {error ? (
                  <p className="rounded-[3px] border border-[#b3473f] bg-[#fbeae8] p-3 text-sm text-[#8a2f29]">{error}</p>
                ) : null}

                <button
                  type="submit"
                  disabled={isBusy}
                  className="inline-flex h-12 w-full items-center justify-center rounded-[3px] bg-[#c9a24b] px-7 text-sm font-bold uppercase tracking-[0.16em] text-[#211706] shadow-[0_14px_34px_rgba(184,146,46,0.32)] transition-colors hover:bg-[#9a7826] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pendingMethod === "card" ? "Processing…" : `Pay ${formatMoney(total)}`}
                </button>
                <p className="text-center text-xs leading-5 text-[#9c9277]">
                  Development mode — no real charge is taken and card numbers are never
                  stored. Use a test number like 4242 4242 4242 4242.
                </p>
              </form>
            </>
          )}

          {paypalClientId && error ? (
            <p className="mt-4 rounded-[3px] border border-[#b3473f] bg-[#fbeae8] p-3 text-sm text-[#8a2f29]">{error}</p>
          ) : null}
        </section>

        {/* Order summary column */}
        <aside className="order-1 h-fit rounded-md border border-[#d9c48a] bg-[#fbf6ec] p-6 shadow-[0_22px_60px_rgba(33,26,14,0.10)] lg:order-2 lg:sticky lg:top-6">
          <h2 className="font-serif text-2xl text-[#211a0e]">Order summary</h2>
          <div className="mt-5 grid gap-4">
            {lines.map((line) => (
              <article key={line.variantId} className="grid grid-cols-[64px_1fr] gap-3">
                <div className="relative h-16 overflow-hidden rounded-md bg-[#f2e7d4]">
                  {line.product.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={fileUrl(line.product.images[0].path)}
                      alt={line.product.images[0].alt}
                      className="h-full w-full object-contain p-1.5 mix-blend-multiply"
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-[#211a0e]">{line.product.short_name}</h3>
                      <p className="text-xs text-[#7c6e50]">
                        {line.variant.option_values.join(" / ")}
                      </p>
                    </div>
                    <strong className="whitespace-nowrap text-sm text-[#8a6a22]">
                      {formatMoney(line.lineTotal)}
                    </strong>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="grid grid-cols-[28px_28px_28px] overflow-hidden rounded-[3px] border border-[#d7c28a]">
                      <button
                        type="button"
                        onClick={() => changeQuantity(line.variantId, -1)}
                        className="h-7 bg-[#fffaf2] text-sm font-bold"
                        aria-label={`Decrease ${line.product.short_name} quantity`}
                      >
                        -
                      </button>
                      <span className="grid h-7 place-items-center text-xs font-black">{line.quantity}</span>
                      <button
                        type="button"
                        onClick={() => changeQuantity(line.variantId, 1)}
                        className="h-7 bg-[#fffaf2] text-sm font-bold"
                        aria-label={`Increase ${line.product.short_name} quantity`}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(line.variantId)}
                      className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a6a22] hover:text-[#b3473f]"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <dl className="mt-6 grid gap-2 border-t border-[#d7c28a] pt-4 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-[#5c4f38]">Subtotal</dt>
              <dd className="font-bold">{formatMoney(subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[#5c4f38]">
                Shipping{zone ? ` (${zone.name})` : ""}
              </dt>
              <dd className="font-bold">
                {shippingInfo.free ? "Free" : formatMoney(shippingInfo.amount)}
              </dd>
            </div>
            <div className="mt-1 flex items-center justify-between border-t border-[#d7c28a] pt-3 text-base">
              <dt className="font-black uppercase tracking-[0.14em] text-[#6b5c3f]">Total</dt>
              <dd className="font-serif text-2xl text-[#8a6a22]">{formatMoney(total)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </main>
  );
}
