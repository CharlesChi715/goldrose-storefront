"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { shippingPolicy } from "@/lib/business";
import { formatMoney } from "@/lib/products";
import { useCart } from "@/lib/cart/store";
import { buildCartPermalink, isLiveCheckout } from "@/lib/shopify/permalink";
import { paymentMethods } from "@/lib/checkout/methods";
import type { PaymentMethodId } from "@/lib/checkout/types";

const brandName = "AUREÀ";

// PayPal-only first round: Shop Pay isn't configured yet, so it's excluded.
const expressMethods = paymentMethods.filter(
  (method) => method.kind === "express" && method.id !== "shop_pay",
);

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

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, rawLines, subtotal, hydrated, changeQuantity, remove, clear } = useCart();

  const [email, setEmail] = useState("");
  const [shipping, setShipping] = useState({
    name: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
  });
  const [card, setCard] = useState({ name: "", number: "", expiry: "", cvc: "" });

  const [pendingMethod, setPendingMethod] = useState<PaymentMethodId | null>(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Clear the loading state if the page is restored from the back/forward cache
  // (e.g. shopper taps a pay button, then hits "back" from Shopify/PayPal) so
  // the buttons don't stay frozen on "Processing…"/"Starting…".
  useEffect(() => {
    function resetCheckoutState() {
      setPendingMethod(null);
    }
    window.addEventListener("pageshow", resetCheckoutState);
    return () => window.removeEventListener("pageshow", resetCheckoutState);
  }, []);

  const shippingAmount = useMemo(() => {
    if (subtotal === 0) {
      return 0;
    }
    return subtotal >= shippingPolicy.freeShippingThreshold ? 0 : shippingPolicy.standardShippingPrice;
  }, [subtotal]);
  const total = subtotal + shippingAmount;

  function setShippingField(key: keyof typeof shipping, value: string) {
    setShipping((current) => ({ ...current, [key]: value }));
  }

  async function submitCheckout(method: PaymentMethodId, withForm: boolean) {
    if (rawLines.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    // Live mode: every method hands off to Shopify's hosted checkout, where
    // PayPal is the enabled payment method for the first-round test.
    if (isLiveCheckout()) {
      const permalink = buildCartPermalink(rawLines);
      if (permalink) {
        setPendingMethod(method);
        window.location.assign(permalink);
        return;
      }
      setError("Checkout is not available right now. Please try again later.");
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
          lines: rawLines,
          ...(withForm
            ? {
                contact: { email },
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

      const order = result.order;

      // Live express wallets hand off to Shopify's hosted checkout — keep the
      // cart, the order is not placed until the customer finishes there.
      if (typeof result.redirectUrl === "string" && /^https?:\/\//.test(result.redirectUrl)) {
        window.location.assign(result.redirectUrl);
        return;
      }

      // Mock express returns an internal success URL; card returns no redirect.
      clear();
      const target =
        typeof result.redirectUrl === "string"
          ? result.redirectUrl
          : `/checkout/success?order=${encodeURIComponent(order.number)}&method=${order.method}&total=${order.total}&mock=${result.mode === "mock" ? "1" : "0"}`;
      router.push(target);
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
            href="/#shop"
            className="mt-7 inline-flex h-12 items-center justify-center rounded-[3px] bg-gradient-to-b from-[#f3d77c] to-[#b8922e] px-7 text-sm font-bold uppercase tracking-[0.16em] text-[#211706] shadow-[0_14px_34px_rgba(184,146,46,0.32)] transition hover:brightness-105"
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
          <Link href="/#shop" className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a6a22] hover:text-[#9a7826]">
            ← Continue shopping
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:py-14">
        {/* Payment column */}
        <section className="order-2 lg:order-1">
          <h1 className="font-serif text-4xl font-medium leading-tight text-[#211a0e]">Checkout</h1>
          <p className="mt-2 text-sm leading-6 text-[#5c4f38]">
            Pay with PayPal in one tap, or enter a card below.
          </p>

          {/* Express checkout */}
          <div className="mt-7">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9a7826]">Express checkout</p>
            <div className="mt-3 grid gap-3">
              {expressMethods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  disabled={isBusy}
                  onClick={() => submitCheckout(method.id, false)}
                  style={{ background: method.background, color: method.color }}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-[4px] text-sm font-bold tracking-[0.04em] shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pendingMethod === method.id ? "Starting…" : method.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs leading-5 text-[#7c6e50]">
              PayPal collects shipping and payment in its own secure window.
            </p>
          </div>

          <div className="my-7 flex items-center gap-4 text-xs font-bold uppercase tracking-[0.18em] text-[#a99a78]">
            <span className="h-px flex-1 bg-[#d7c28a]" />
            Or pay with card
            <span className="h-px flex-1 bg-[#d7c28a]" />
          </div>

          {/* Card form */}
          <form
            className="grid gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              submitCheckout("card", true);
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
                  label="State"
                  value={shipping.state}
                  onChange={(value) => setShippingField("state", value)}
                  error={fieldErrors.state}
                  autoComplete="address-level1"
                />
                <Field
                  id="ship-zip"
                  label="ZIP"
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
              className="inline-flex h-12 w-full items-center justify-center rounded-[3px] bg-gradient-to-b from-[#f3d77c] to-[#b8922e] px-7 text-sm font-bold uppercase tracking-[0.16em] text-[#211706] shadow-[0_14px_34px_rgba(184,146,46,0.32)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendingMethod === "card" ? "Processing…" : `Pay ${formatMoney(total)}`}
            </button>
            <p className="text-center text-xs leading-5 text-[#9c9277]">
              {isLiveCheckout()
                ? "You'll complete payment securely on Shopify with PayPal. A real charge is taken."
                : "Runs in mock mode — no real charge is taken and card numbers are never stored. Use a test number like 4242 4242 4242 4242."}
            </p>
          </form>
        </section>

        {/* Order summary column */}
        <aside className="order-1 h-fit rounded-md border border-[#d9c48a] bg-[#fbf6ec] p-6 shadow-[0_22px_60px_rgba(33,26,14,0.10)] lg:order-2 lg:sticky lg:top-6">
          <h2 className="font-serif text-2xl text-[#211a0e]">Order summary</h2>
          <div className="mt-5 grid gap-4">
            {lines.map((line) => (
              <article key={`${line.productId}::${line.option}`} className="grid grid-cols-[64px_1fr] gap-3">
                <div className="relative h-16 overflow-hidden rounded-md bg-[#f2e7d4]">
                  <Image
                    src={line.product.image}
                    alt={line.product.alt}
                    fill
                    sizes="64px"
                    className="object-contain p-1.5 mix-blend-multiply"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-[#211a0e]">{line.product.shortName}</h3>
                      <p className="text-xs text-[#7c6e50]">{line.option}</p>
                    </div>
                    <strong className="whitespace-nowrap text-sm text-[#8a6a22]">
                      {formatMoney(line.lineTotal)}
                    </strong>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="grid grid-cols-[28px_28px_28px] overflow-hidden rounded-[3px] border border-[#d7c28a]">
                      <button
                        type="button"
                        onClick={() => changeQuantity(line.productId, line.option, -1)}
                        className="h-7 bg-[#fffaf2] text-sm font-bold"
                        aria-label={`Decrease ${line.product.shortName} quantity`}
                      >
                        -
                      </button>
                      <span className="grid h-7 place-items-center text-xs font-black">{line.quantity}</span>
                      <button
                        type="button"
                        onClick={() => changeQuantity(line.productId, line.option, 1)}
                        className="h-7 bg-[#fffaf2] text-sm font-bold"
                        aria-label={`Increase ${line.product.shortName} quantity`}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(line.productId, line.option)}
                      className="text-xs font-bold text-[#8a6a22] hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <dl className="mt-6 grid gap-2 border-t border-[#d7c28a] pt-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-[#5c4f38]">Subtotal</dt>
              <dd className="font-semibold text-[#211a0e]">{formatMoney(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#5c4f38]">Shipping</dt>
              <dd className="font-semibold text-[#211a0e]">
                {shippingAmount === 0 ? "Free" : formatMoney(shippingAmount)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#5c4f38]">Tax</dt>
              <dd className="text-[#7c6e50]">Calculated at payment</dd>
            </div>
            <div className="mt-2 flex justify-between border-t border-[#d7c28a] pt-3 text-lg">
              <dt className="font-bold text-[#211a0e]">Total</dt>
              <dd className="font-serif text-[#8a6a22]">{formatMoney(total)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </main>
  );
}
