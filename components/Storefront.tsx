"use client";

/**
 * ROLE OF THIS FILE
 * The whole customer-facing homepage: header, hero banner, story sections,
 * product grid, footer, and the slide-in cart drawer. `app/page.tsx` renders
 * this one component.
 *
 * The `"use client"` directive above marks this as a Client Component in the
 * Next.js App Router: it ships JavaScript to the browser so it can hold state
 * (useState) and react to clicks. Server Components (the default) cannot.
 */

import Image from "next/image";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  returnPolicy,
  shippingPolicy,
  storeProfile,
  warehouse,
} from "@/lib/business";
import { formatMoney, heroProduct, products, type Product } from "@/lib/products";
import { getLineKey, useCart, type CartLineView } from "@/lib/cart/store";
import { startExpressCheckout } from "@/lib/checkout/client";
import { buildCartPermalink, isLiveCheckout } from "@/lib/shopify/permalink";
import { expressMethods } from "@/lib/checkout/methods";
import type { PaymentMethodId } from "@/lib/checkout/types";

const brandName = "AUREÀ";

/** Turn raw stock numbers into the small "In stock" / "Low stock" label. */
function stockLabel(product: Product) {
  return product.inventoryOnHand > product.reorderPoint ? "In stock" : "Low stock";
}

/**
 * The brand's primary gold call-to-action button, reused everywhere so all
 * CTAs look identical. `children` is whatever you put between the tags.
 */
function GoldButton({
  children,
  onClick,
  type = "button",
  disabled = false,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-12 items-center justify-center rounded-[3px] bg-[#c9a24b] px-7 text-sm font-bold uppercase tracking-[0.16em] text-[#211706] shadow-[0_14px_34px_rgba(184,146,46,0.32)] transition-colors hover:bg-[#9a7826] focus:outline-none focus:ring-2 focus:ring-[#f3d77c] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[#c9a24b] ${className}`}
    >
      {children}
    </button>
  );
}

/** The small gold uppercase "eyebrow" heading that introduces each section. */
function SectionLabel({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <p
      className={`mb-4 text-xs font-black uppercase tracking-[0.24em] ${
        dark ? "text-[#c9a24b]" : "text-[#9a7826]"
      }`}
    >
      {children}
    </p>
  );
}

/**
 * One card in the product grid: image, price, gift-option dropdown, and an
 * Add to Cart button. It owns one piece of state — the currently selected
 * gift option — and reports upward via the `onAdd` callback prop when the
 * customer adds the product (React data flows down, events flow up).
 */
function ProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: (productId: string, option: string) => void;
}) {
  const [option, setOption] = useState(product.options[0]);

  return (
    <article className="grid overflow-hidden rounded-md border border-[#d9c48a] bg-[#fbf6ec] shadow-[0_22px_60px_rgba(33,26,14,0.10)]">
      <div className="relative aspect-square bg-[#f2e7d4]">
        <Image
          src={product.image}
          alt={product.alt}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-contain p-5 mix-blend-multiply"
        />
        <span className="absolute left-4 top-4 rounded-[2px] bg-[#b8922e] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#fbf6ec]">
          {product.badge}
        </span>
      </div>

      <div className="grid gap-5 p-5">
        <div className="grid gap-3">
          <div className="flex items-start justify-between gap-5">
            <div>
              <h3 className="font-serif text-2xl leading-tight text-[#211a0e]">
                {product.name}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#5c4f38]">{product.description}</p>
            </div>
            <div className="text-right">
              <strong className="block font-serif text-2xl font-medium text-[#8a6a22]">
                {formatMoney(product.price)}
              </strong>
              {product.compareAtPrice ? (
                <span className="text-sm text-[#a99a78] line-through">
                  {formatMoney(product.compareAtPrice)}
                </span>
              ) : null}
            </div>
          </div>
          <p className="text-sm font-semibold text-[#7a5d1c]">{product.bestFor}</p>
          <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#7c6e50]">
            <span>{stockLabel(product)}</span>
            <span>·</span>
            <span>{warehouse.label}</span>
            <span>·</span>
            <span>{storeProfile.productOriginCountry} origin</span>
          </div>
        </div>

        <div className="grid gap-2">
          <label
            className="text-xs font-black uppercase tracking-[0.16em] text-[#6b5c3f]"
            htmlFor={`${product.id}-option`}
          >
            Gift option
          </label>
          <select
            id={`${product.id}-option`}
            value={option}
            onChange={(event) => setOption(event.target.value)}
            className="h-11 rounded-[3px] border border-[#d7c28a] bg-[#fffaf2] px-3 text-sm text-[#211a0e] outline-none transition focus:border-[#9a7826]"
          >
            {product.options.map((productOption) => (
              <option key={productOption}>{productOption}</option>
            ))}
          </select>
        </div>

        <ul className="grid gap-2 text-sm text-[#5c4f38]">
          {product.details.map((detail) => (
            <li key={detail} className="flex gap-3">
              <span className="mt-2 text-[#b8922e]" aria-hidden="true">
                ◆
              </span>
              <span>{detail}</span>
            </li>
          ))}
        </ul>

        <GoldButton onClick={() => onAdd(product.id, option)}>Add to Cart</GoldButton>
      </div>
    </article>
  );
}

/**
 * The slide-in cart panel. It is a "controlled" component: it holds no cart
 * state of its own — everything (lines, subtotal, open/closed) comes in as
 * props and every user action goes back out through an `on...` callback.
 * Clicking the dark backdrop closes it; clicks inside stopPropagation so
 * they don't bubble up to that backdrop handler.
 */
function CartDrawer({
  isOpen,
  lines,
  subtotal,
  onClose,
  onChangeQuantity,
  onRemove,
  onCheckout,
  onExpress,
  pendingMethod,
  expressError,
}: {
  isOpen: boolean;
  lines: CartLineView[];
  subtotal: number;
  onClose: () => void;
  onChangeQuantity: (productId: string, option: string, amount: number) => void;
  onRemove: (productId: string, option: string) => void;
  onCheckout: () => void;
  onExpress: (method: PaymentMethodId) => void;
  pendingMethod: PaymentMethodId | null;
  expressError: string;
}) {
  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end bg-[#100d09]/0 transition ${
        isOpen ? "pointer-events-auto bg-[#100d09]/70" : "pointer-events-none"
      }`}
      aria-hidden={!isOpen}
      onClick={onClose}
    >
      <aside
        className={`grid h-full w-full max-w-[440px] grid-rows-[auto_1fr_auto] border-l border-[#d9c48a] bg-[#fbf6ec] text-[#211a0e] shadow-2xl transition duration-200 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#d7c28a] p-5">
          <div>
            <h2 className="font-serif text-2xl text-[#211a0e]">Cart</h2>
            <p className="text-sm text-[#7c6e50]">Review your forever rose.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full border border-[#d7c28a] text-lg font-bold text-[#8a6a22] transition hover:bg-[#f2e7d4]"
            aria-label="Close cart"
          >
            x
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          {lines.length === 0 ? (
            <div className="rounded-md border border-dashed border-[#d7c28a] bg-[#fffaf2] p-6 text-center">
              <p className="font-bold text-[#211a0e]">Your cart is empty.</p>
              <p className="mt-2 text-sm text-[#7c6e50]">
                Add a rose gift to see cart totals here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {lines.map((line) => (
                <article
                  key={getLineKey(line.productId, line.option)}
                  className="grid grid-cols-[76px_1fr] gap-4 border-b border-[#e3d4ab] pb-4"
                >
                  <div className="relative h-[76px] overflow-hidden rounded-md bg-[#f2e7d4]">
                    <Image
                      src={line.product.image}
                      alt={line.product.alt}
                      fill
                      sizes="76px"
                      className="object-contain p-2 mix-blend-multiply"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-[#211a0e]">{line.product.shortName}</h3>
                        <p className="text-sm text-[#7c6e50]">{line.option}</p>
                      </div>
                      <strong className="whitespace-nowrap text-sm text-[#8a6a22]">
                        {formatMoney(line.lineTotal)}
                      </strong>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="grid grid-cols-[34px_34px_34px] overflow-hidden rounded-[3px] border border-[#d7c28a]">
                        <button
                          type="button"
                          onClick={() => onChangeQuantity(line.productId, line.option, -1)}
                          className="h-9 bg-[#fffaf2] font-bold"
                          aria-label={`Decrease ${line.product.shortName} quantity`}
                        >
                          -
                        </button>
                        <span className="grid h-9 place-items-center text-sm font-black">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onChangeQuantity(line.productId, line.option, 1)}
                          className="h-9 bg-[#fffaf2] font-bold"
                          aria-label={`Increase ${line.product.shortName} quantity`}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(line.productId, line.option)}
                        className="text-sm font-bold text-[#8a6a22] hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-[#d7c28a] p-5">
          <div className="mb-4 flex items-center justify-between text-lg">
            <span className="font-bold text-[#211a0e]">Subtotal</span>
            <strong className="font-serif text-[#8a6a22]">{formatMoney(subtotal)}</strong>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {expressMethods.map((method) => (
              <button
                key={method.id}
                type="button"
                disabled={lines.length === 0 || pendingMethod !== null}
                onClick={() => onExpress(method.id)}
                style={{ background: method.background, color: method.color }}
                className="inline-flex h-12 items-center justify-center rounded-[4px] text-sm font-bold tracking-[0.04em] shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pendingMethod === method.id ? "Starting…" : method.label}
              </button>
            ))}
          </div>
          <GoldButton
            onClick={onCheckout}
            disabled={lines.length === 0 || pendingMethod !== null}
            className="mt-3 w-full"
          >
            Checkout · Credit Card
          </GoldButton>
          {expressError ? (
            <p className="mt-3 rounded-[3px] border border-[#b3473f] bg-[#fbeae8] p-3 text-xs leading-5 text-[#8a2f29]">
              {expressError}
            </p>
          ) : null}
          <p className="mt-3 text-center text-xs leading-5 text-[#9c9277]">
            {isLiveCheckout()
              ? "Secure checkout powered by Shopify · PayPal accepted."
              : "Development mode — no real charge is taken."}
          </p>
        </div>
      </aside>
    </div>
  );
}

/**
 * The top-level homepage component. It wires everything together: the shared
 * cart hook, the page sections, and the cart drawer, plus the small pieces of
 * page state (is the drawer open, which express button is loading, the
 * newsletter form message).
 */
export function Storefront() {
  const router = useRouter();
  const { lines, rawLines, subtotal, itemCount, add, changeQuantity, remove, clear } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [pendingMethod, setPendingMethod] = useState<PaymentMethodId | null>(null);
  const [expressError, setExpressError] = useState("");

  // When the shopper taps an express/checkout button we set a loading state and
  // immediately navigate to Shopify. If they then hit "back", the browser can
  // restore this page from its back/forward cache with that loading state still
  // frozen on (button stuck on "Starting…", all checkout buttons disabled).
  // `pageshow` fires on every restore — clear the loading state so the buttons
  // are clickable again.
  useEffect(() => {
    function resetCheckoutState() {
      setPendingMethod(null);
      setExpressError("");
    }
    window.addEventListener("pageshow", resetCheckoutState);
    return () => window.removeEventListener("pageshow", resetCheckoutState);
  }, []);

  /** Add a product to the cart and pop the drawer open so the customer sees it. */
  function addToCart(productId: string, option: string) {
    add(productId, option);
    setExpressError("");
    setIsCartOpen(true);
  }

  /**
   * Start a PayPal / Shop Pay express checkout from the cart drawer. Shows a
   * loading state on the tapped button; on failure the error is shown inline.
   */
  async function handleExpress(method: PaymentMethodId) {
    setPendingMethod(method);
    setExpressError("");
    const error = await startExpressCheckout({
      method,
      lines: rawLines,
      router,
      clearCart: clear,
    });
    if (error) {
      setExpressError(error);
      setPendingMethod(null);
    }
  }

  function goToCheckout() {
    // Live mode: skip the local /checkout page and hand off to Shopify's
    // hosted checkout (PayPal) directly from the cart.
    if (isLiveCheckout()) {
      const permalink = buildCartPermalink(rawLines);
      if (permalink) {
        window.location.assign(permalink);
        return;
      }
    }
    router.push("/checkout");
  }

  /**
   * Footer "launch list" form. Email capture is UI-only for now — no provider
   * is connected, so we just validate the shape and show a local message.
   */
  function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.includes("@")) {
      setEmailMessage("Enter a valid email address.");
      return;
    }

    setEmail("");
    setEmailMessage("Thanks. Email capture is UI-only until a provider is connected.");
  }

  return (
    <div className="min-h-screen bg-[#f4ede1] text-[#211a0e]">
      <header className="sticky top-0 z-40 border-b border-[#c9a24b]/25 bg-[#fbf6ec]/92 backdrop-blur-xl">
        <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <a
            href="#top"
            className="font-serif text-2xl uppercase tracking-[0.22em] text-[#211a0e]"
            aria-label={`${brandName} home`}
          >
            {brandName}
            <span className="text-[#b8922e]">.</span>
          </a>
          <nav
            className="hidden justify-center gap-8 text-xs font-bold uppercase tracking-[0.18em] text-[#6b5c3f] md:flex"
            aria-label="Primary navigation"
          >
            <a className="hover:text-[#9a7826]" href="#rose">
              The Rose
            </a>
            <a className="hover:text-[#9a7826]" href="#craft">
              Craft
            </a>
            <a className="hover:text-[#9a7826]" href="#occasions">
              Occasions
            </a>
            <a className="hover:text-[#9a7826]" href="#shop">
              Shop
            </a>
          </nav>
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="justify-self-end rounded-[3px] border border-[#b8922e] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#8a6a22] transition hover:bg-[#f4ead6]"
            aria-label={`Open cart with ${itemCount} items`}
          >
            Cart <span className="ml-2">{itemCount}</span>
          </button>
        </div>
      </header>

      <main id="top">
        <section
          id="rose"
          className="relative grid min-h-[calc(100vh-73px)] overflow-hidden bg-[radial-gradient(120%_90%_at_76%_35%,#fbf6ec_0%,#f4ede1_56%,#eadbc1_100%)] lg:grid-cols-[1.02fr_0.98fr]"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(58%_60%_at_78%_45%,rgba(201,162,75,0.20),transparent_70%)]" />
          <div className="relative flex flex-col justify-center px-4 py-16 sm:px-6 lg:px-12 xl:px-20">
            <div className="mb-7 inline-flex w-fit rounded-full border border-[#b8922e]/55 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-[#8a6a22]">
              Real Rose · Dipped in 24K Gold
            </div>
            <h1 className="max-w-[12ch] font-serif text-6xl font-medium leading-[1.02] text-[#211a0e] sm:text-7xl xl:text-8xl">
              A love that{" "}
              <em className="bg-gradient-to-r from-[#7a5d1c] via-[#c9a23e] to-[#7a5d1c] bg-clip-text font-serif italic text-transparent">
                never wilts
              </em>
            </h1>
            <p className="mt-6 max-w-xl text-lg font-light leading-8 text-[#5c4f38]">
              A genuine blooming rose, selected and preserved in a luminous gold
              finish. The fleeting beauty of fresh flowers, turned into a keepsake
              she can display for years.
            </p>
            <div className="mt-7 flex flex-wrap items-baseline gap-4">
              <span className="font-serif text-5xl font-medium text-[#8a6a22]">
                {formatMoney(heroProduct.price)}
              </span>
              {heroProduct.compareAtPrice ? (
                <span className="text-xl text-[#a99a78] line-through">
                  {formatMoney(heroProduct.compareAtPrice)}
                </span>
              ) : null}
              <span className="rounded-[2px] bg-[#b8922e] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#fbf6ec]">
                {heroProduct.badge}
              </span>
            </div>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <GoldButton onClick={() => addToCart(heroProduct.id, heroProduct.options[0])}>
                Add to Cart
              </GoldButton>
              <a
                href="#shop"
                className="inline-flex h-12 items-center justify-center rounded-[3px] border border-[#b8922e]/60 px-7 text-sm font-bold uppercase tracking-[0.16em] text-[#8a6a22] transition hover:bg-[#f7ecd6]"
              >
                Gift It
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#7c6e50]">
              <span className="text-[#b8922e]">★★★★★</span>
              <span>{storeProfile.originDisclosure}</span>
              <span>·</span>
              <span>Ships from {warehouse.city}, {warehouse.state}</span>
              <span>·</span>
              <span>{returnPolicy.returnWindowDays}-day returns</span>
            </div>
          </div>

          <div className="relative min-h-[430px] lg:min-h-full">
            <div className="absolute inset-[-8%_-4%] bg-[radial-gradient(circle_at_55%_45%,rgba(244,221,156,0.45),transparent_62%)] blur-2xl" />
            <Image
              src="/products/gold-rose-stand.jpg"
              alt="24K gold dipped rose with clear display stand and gift box"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="relative object-contain p-8 mix-blend-multiply lg:p-12"
            />
          </div>
        </section>

        <section className="grid border-y border-[#b8922e]/25 bg-[#f7f1e6] sm:grid-cols-4">
          {[
            ["24K", "Gold Dipped Finish"],
            ["US", "Ships From US Stock"],
            ["$75+", "Free US Shipping"],
            ["30", "Day Returns"],
          ].map(([value, label]) => (
            <div
              key={label}
              className="border-b border-[#b8922e]/20 px-5 py-7 text-center sm:border-b-0 sm:border-r sm:last:border-r-0"
            >
              <div className="font-serif text-3xl font-medium text-[#8a6a22]">{value}</div>
              <div className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-[#7c6e50]">
                {label}
              </div>
            </div>
          ))}
        </section>

        <section id="craft" className="bg-[#f4ede1] px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <SectionLabel>Craftsmanship</SectionLabel>
            <h2 className="font-serif text-4xl font-medium leading-tight text-[#211a0e] sm:text-5xl">
              Detail you can hold.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg font-light leading-8 text-[#5c4f38]">
              Every rose starts as a real bloom, is preserved at its peak, and is
              finished in a luminous layer of gold — then boxed, ready to give.
            </p>
            <div className="mx-auto mt-12 grid max-w-6xl items-center gap-10 text-left lg:grid-cols-[1.1fr_0.9fr]">
              <div className="relative aspect-square overflow-hidden rounded-md bg-[#fbf6ec]">
                <Image
                  src="/products/gold-rose-detail.jpg"
                  alt="Gold rose material detail"
                  fill
                  sizes="(max-width: 1024px) 100vw, 52vw"
                  className="object-contain p-3 mix-blend-multiply"
                />
              </div>
              <div className="grid gap-8">
                {[
                  [
                    "Quality Material",
                    "A real preserved rose at the core — not a plastic imitation.",
                  ],
                  [
                    "Fine 24K Finish",
                    "Stem, leaves, and petals carry a luminous 24K gold dipped finish.",
                  ],
                  [
                    "Gift Presentation",
                    "Arrives with a display stand and gift box, ready to hand over.",
                  ],
                ].map(([title, copy]) => (
                  <div key={title} className="border-t border-[#b8922e]/30 pt-7 first:border-t-0 first:pt-0">
                    <h3 className="font-serif text-3xl font-medium text-[#8a6a22]">{title}</h3>
                    <p className="mt-2 font-light leading-7 text-[#5c4f38]">{copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid bg-[#faf5ec] lg:grid-cols-2">
          <div className="flex items-center px-4 py-16 sm:px-6 lg:px-12 xl:px-20">
            <div className="max-w-xl">
              <SectionLabel>Made from real roses</SectionLabel>
              <h2 className="font-serif text-4xl font-medium leading-tight text-[#211a0e] sm:text-5xl">
                The real thing, made to stay.
              </h2>
              <div className="mt-7 grid gap-5 text-[#4a3f2a]">
                {[
                  storeProfile.originDisclosure,
                  "Ships complete with a display stand and gift box — nothing to assemble or wrap.",
                  "No water, no wilting, no maintenance — made to be displayed for years.",
                ].map((item) => (
                  <div key={item} className="flex gap-4 font-light leading-7">
                    <span className="text-[#b8922e]" aria-hidden="true">
                      ◆
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="relative min-h-[420px]">
            <Image
              src="/products/real-rose-comparison.jpg"
              alt="Real rose comparison graphic"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover mix-blend-multiply"
            />
          </div>
        </section>

        <section className="bg-[radial-gradient(120%_100%_at_50%_0%,#221a0f,#14100a_70%)] px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-24">
          <SectionLabel dark>The Making</SectionLabel>
          <h2 className="font-serif text-4xl font-medium leading-tight text-[#f7f1e6] sm:text-5xl">
            Six steps, by hand.
          </h2>
          <div className="mx-auto mt-12 grid max-w-6xl gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {[
              "Picking Roses",
              "Selecting Petals",
              "Drying Petals",
              "Assembling",
              "Gold Plating",
              "Finish",
            ].map((step, index) => (
              <div key={step} className="px-3">
                <div className="font-serif text-4xl font-medium text-[#c9a24b]">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="mt-2 text-sm tracking-[0.08em] text-[#e6dcc4]">{step}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="occasions" className="bg-[#f4ede1] px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-24">
          <SectionLabel>For every moment</SectionLabel>
          <h2 className="font-serif text-4xl font-medium leading-tight text-[#211a0e] sm:text-5xl">
            A gift for the ones you love.
          </h2>
          <div className="mx-auto mt-10 max-w-6xl overflow-hidden rounded-md">
            <Image
              src="/products/occasions.jpg"
              alt="Occasions for gifting gold roses"
              width={1714}
              height={1280}
              className="w-full mix-blend-multiply"
            />
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-x-7 gap-y-3 font-serif text-2xl text-[#8a6a22]">
            <span>Valentine&apos;s Day</span>
            <span className="text-[#c4b48f]">·</span>
            <span>Mother&apos;s Day</span>
            <span className="text-[#c4b48f]">·</span>
            <span>Christmas</span>
            <span className="text-[#c4b48f]">·</span>
            <span>Anniversary</span>
          </div>
        </section>

        <section className="grid min-h-[520px] lg:grid-cols-2">
          <div className="relative min-h-[360px]">
            <Image
              src="/products/romance-dinner.jpg"
              alt="Romantic candlelit dinner with a gold rose"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="flex items-center bg-[radial-gradient(120%_100%_at_30%_30%,#2a2013,#100d09)] px-4 py-16 sm:px-6 lg:px-12 xl:px-20">
            <div className="max-w-xl">
              <SectionLabel dark>More than flowers</SectionLabel>
              <h2 className="font-serif text-4xl font-medium leading-tight text-[#f7f1e6] sm:text-5xl">
                Say it once. Let it last.
              </h2>
              <p className="mt-5 text-lg font-light leading-8 text-[#bdb39a]">
                Fresh roses fade quickly. This offer is about turning the rose
                into a display piece that keeps reminding the recipient of the
                moment it was given.
              </p>
              <div className="mt-8">
                <a
                  href="#shop"
                  className="inline-flex h-12 items-center justify-center rounded-[3px] bg-gradient-to-b from-[#f4dd9c] to-[#c9a24b] px-8 text-sm font-bold uppercase tracking-[0.16em] text-[#1a1408]"
                >
                  Make it hers
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="shop" className="bg-[#faf5ec] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 max-w-3xl">
              <SectionLabel>Shop the edit</SectionLabel>
              <h2 className="font-serif text-4xl font-medium leading-tight text-[#211a0e] sm:text-5xl">
                Three ways to give the rose.
              </h2>
              <p className="mt-4 text-lg font-light leading-8 text-[#5c4f38]">
                One signature rose, one boxed keepsake presentation, and one
                premium bundle — each one arrives gift-ready.
              </p>
            </div>
            <div className="grid gap-5 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} onAdd={addToCart} />
              ))}
            </div>
          </div>
        </section>

        {/* Shipping & returns: the practical promises, pulled from lib/business.ts
            so the numbers here always match the checkout math. */}
        <section className="bg-[#16110a] px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-24">
          <SectionLabel dark>Shipping &amp; returns</SectionLabel>
          <h2 className="font-serif text-4xl font-medium leading-tight text-[#f7f1e6] sm:text-5xl">
            From our shelf to her hands, fast.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg font-light leading-8 text-[#bdb39a]">
            Every rose is stocked in the United States and ships within{" "}
            {shippingPolicy.processingTime} — no overseas wait between you and
            the moment.
          </p>
          <div className="mx-auto mt-10 grid max-w-6xl gap-5 text-left lg:grid-cols-3">
            {[
              [
                "US fulfillment",
                `${warehouse.label}: ${warehouse.city}, ${warehouse.state}. Processing ${shippingPolicy.processingTime}; standard transit ${shippingPolicy.standardTransit}.`,
              ],
              [
                "Shipping offer",
                `Standard shipping is ${formatMoney(shippingPolicy.standardShippingPrice)}, free over ${formatMoney(shippingPolicy.freeShippingThreshold)}.`,
              ],
              [
                "Return promise",
                `${returnPolicy.returnWindowDays}-day return window; damaged items should be reported within ${returnPolicy.damageReportWindowDays} days.`,
              ],
            ].map(([title, copy]) => (
              <article key={title} className="rounded-md border border-[#c9a24b]/20 bg-[#1c160d] p-7">
                <h3 className="font-serif text-2xl font-medium text-[#f4dd9c]">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#bdb39a]">{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-[radial-gradient(120%_100%_at_50%_0%,#2e2313,#100d09_70%)] px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-28">
          <h2 className="mx-auto max-w-4xl font-serif text-5xl font-medium leading-tight text-[#f7f1e6] sm:text-6xl">
            Give a rose that outlasts{" "}
            <em className="text-[#f4dd9c]">the moment</em>.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg font-light leading-8 text-[#bdb39a]">
            Fresh flowers fade in a week. A gold rose stays on her shelf for
            years — still saying what you meant the day you gave it.
          </p>
          <div className="mt-7 flex flex-wrap items-baseline justify-center gap-4">
            <span className="font-serif text-5xl text-[#f4dd9c]">
              {formatMoney(heroProduct.price)}
            </span>
            {heroProduct.compareAtPrice ? (
              <span className="text-lg text-[#7d7058] line-through">
                {formatMoney(heroProduct.compareAtPrice)}
              </span>
            ) : null}
          </div>
          <div className="mt-8">
            <GoldButton onClick={() => addToCart(heroProduct.id, heroProduct.options[0])}>
              Add to Cart
            </GoldButton>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#c9a24b]/15 bg-[#0a0806] px-4 py-10 text-[#7d7058] sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1fr_0.8fr] lg:items-center">
          <div className="font-serif text-2xl uppercase tracking-[0.22em] text-[#c9bfa6]">
            {brandName}
            <span className="text-[#c9a24b]">.</span>
          </div>
          <nav className="flex flex-wrap gap-5 text-sm" aria-label="Footer navigation">
            <a href="#craft">Craft</a>
            <a href="#occasions">Occasions</a>
            <a href="#shop">Shop</a>
            <button type="button" onClick={() => setIsCartOpen(true)}>
              Cart
            </button>
          </nav>
          <form className="grid gap-3" onSubmit={handleEmailSubmit}>
            <label className="text-sm font-bold text-[#c9bfa6]" htmlFor="email">
              Launch list
            </label>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="h-11 rounded-[3px] border border-[#3c2d14] bg-[#14100a] px-3 text-[#f7f1e6] outline-none transition placeholder:text-[#7d7058] focus:border-[#c9a24b]"
              />
              <button
                type="submit"
                className="h-11 rounded-[3px] border border-[#c9a24b]/60 px-4 text-xs font-bold uppercase tracking-[0.16em] text-[#f4dd9c]"
              >
                Join
              </button>
            </div>
            {emailMessage ? <p className="text-sm text-[#9c9277]">{emailMessage}</p> : null}
          </form>
        </div>
      </footer>

      <CartDrawer
        isOpen={isCartOpen}
        lines={lines}
        subtotal={subtotal}
        onClose={() => setIsCartOpen(false)}
        onChangeQuantity={changeQuantity}
        onRemove={remove}
        onCheckout={goToCheckout}
        onExpress={handleExpress}
        pendingMethod={pendingMethod}
        expressError={expressError}
      />
    </div>
  );
}
