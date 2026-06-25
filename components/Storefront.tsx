"use client";

import Image from "next/image";
import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import { formatMoney, heroProduct, products, type Product } from "@/lib/products";

type CartLine = {
  productId: string;
  option: string;
  quantity: number;
};

type CartLineView = CartLine & {
  product: Product;
  lineTotal: number;
};

const brandName = "AUREÀ";

function getLineKey(productId: string, option: string) {
  return `${productId}::${option}`;
}

function getProduct(productId: string) {
  return products.find((product) => product.id === productId);
}

function GoldButton({
  children,
  onClick,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="inline-flex h-12 items-center justify-center rounded-[3px] bg-gradient-to-b from-[#f3d77c] to-[#b8922e] px-7 text-sm font-bold uppercase tracking-[0.16em] text-[#211706] shadow-[0_14px_34px_rgba(184,146,46,0.32)] transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-[#f3d77c] focus:ring-offset-2"
    >
      {children}
    </button>
  );
}

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

function CartDrawer({
  isOpen,
  lines,
  subtotal,
  onClose,
  onChangeQuantity,
  onRemove,
}: {
  isOpen: boolean;
  lines: CartLineView[];
  subtotal: number;
  onClose: () => void;
  onChangeQuantity: (productId: string, option: string, amount: number) => void;
  onRemove: (productId: string, option: string) => void;
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
        className={`grid h-full w-full max-w-[440px] grid-rows-[auto_1fr_auto] border-l border-[#3c2d14] bg-[#14100a] text-[#f7f1e6] shadow-2xl transition duration-200 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#3c2d14] p-5">
          <div>
            <h2 className="font-serif text-2xl text-[#f7f1e6]">Cart</h2>
            <p className="text-sm text-[#bdb39a]">Review your forever rose.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full border border-[#c9a24b]/35 text-lg font-bold text-[#f7f1e6] transition hover:bg-[#241a0d]"
            aria-label="Close cart"
          >
            x
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          {lines.length === 0 ? (
            <div className="rounded-md border border-dashed border-[#6b5425] bg-[#1c160d] p-6 text-center">
              <p className="font-bold text-[#f7f1e6]">Your cart is empty.</p>
              <p className="mt-2 text-sm text-[#bdb39a]">
                Add a rose gift to see cart totals here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {lines.map((line) => (
                <article
                  key={getLineKey(line.productId, line.option)}
                  className="grid grid-cols-[76px_1fr] gap-4 border-b border-[#3c2d14] pb-4"
                >
                  <div className="relative h-[76px] overflow-hidden rounded-md bg-[#f4ede1]">
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
                        <h3 className="font-bold text-[#f7f1e6]">{line.product.shortName}</h3>
                        <p className="text-sm text-[#bdb39a]">{line.option}</p>
                      </div>
                      <strong className="whitespace-nowrap text-sm text-[#f4dd9c]">
                        {formatMoney(line.lineTotal)}
                      </strong>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="grid grid-cols-[34px_34px_34px] overflow-hidden rounded-[3px] border border-[#6b5425]">
                        <button
                          type="button"
                          onClick={() => onChangeQuantity(line.productId, line.option, -1)}
                          className="h-9 bg-[#21180c] font-bold"
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
                          className="h-9 bg-[#21180c] font-bold"
                          aria-label={`Increase ${line.product.shortName} quantity`}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(line.productId, line.option)}
                        className="text-sm font-bold text-[#f4dd9c]"
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

        <div className="border-t border-[#3c2d14] p-5">
          <div className="mb-4 flex items-center justify-between text-lg">
            <span className="font-bold text-[#f7f1e6]">Subtotal</span>
            <strong className="text-[#f4dd9c]">{formatMoney(subtotal)}</strong>
          </div>
          <GoldButton
            onClick={() =>
              alert("Checkout is not connected yet. Next step: choose Stripe Checkout or Shopify.")
            }
          >
            Continue
          </GoldButton>
          <p className="mt-3 text-center text-xs leading-5 text-[#9c9277]">
            Payments stay paused until price, shipping, tax, and policies are confirmed.
          </p>
        </div>
      </aside>
    </div>
  );
}

export function Storefront() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  const lines = useMemo<CartLineView[]>(
    () =>
      cart
        .map((line) => {
          const product = getProduct(line.productId);

          if (!product) {
            return null;
          }

          return {
            ...line,
            product,
            lineTotal: product.price * line.quantity,
          };
        })
        .filter((line): line is CartLineView => Boolean(line)),
    [cart],
  );

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  function addToCart(productId: string, option: string) {
    setCart((currentCart) => {
      const key = getLineKey(productId, option);
      const existingLine = currentCart.find(
        (line) => getLineKey(line.productId, line.option) === key,
      );

      if (existingLine) {
        return currentCart.map((line) =>
          getLineKey(line.productId, line.option) === key
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        );
      }

      return [...currentCart, { productId, option, quantity: 1 }];
    });
    setIsCartOpen(true);
  }

  function changeQuantity(productId: string, option: string, amount: number) {
    const key = getLineKey(productId, option);

    setCart((currentCart) =>
      currentCart
        .map((line) =>
          getLineKey(line.productId, line.option) === key
            ? { ...line, quantity: line.quantity + amount }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }

  function removeLine(productId: string, option: string) {
    const key = getLineKey(productId, option);
    setCart((currentCart) =>
      currentCart.filter((line) => getLineKey(line.productId, line.option) !== key),
    );
  }

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
                Save 44%
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
              <span>Review section ready</span>
              <span>·</span>
              <span>Gift box included</span>
              <span>·</span>
              <span>Policy copy pending</span>
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
            ["100%", "Real Rose Base"],
            ["Gift", "Box & Stand"],
            ["MVP", "Checkout Pending"],
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
              The source assets focus on real rose material, gold finish, and gift
              presentation. The page should sell that premium feel clearly.
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
                    "The supplier imagery positions the rose as a real preserved bloom, not a plastic prop.",
                  ],
                  [
                    "Fine 24K Finish",
                    "The gold stem, leaves, and petals carry the premium visual signal.",
                  ],
                  [
                    "Gift Presentation",
                    "The box and stand matter because buyers want a ready-to-hand-over gift.",
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
                  "Carefully selected rose imagery supports a stronger premium story than generic gift copy.",
                  "The physical box and stand reduce buyer uncertainty because the gift feels complete.",
                  "Final claims should be checked against supplier documentation before launch.",
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
                Three offers are enough to test demand.
              </h2>
              <p className="mt-4 text-lg font-light leading-8 text-[#5c4f38]">
                The first version should stay focused: one signature rose, one
                stronger gift presentation, and one premium bundle.
              </p>
            </div>
            <div className="grid gap-5 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} onAdd={addToCart} />
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#16110a] px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-24">
          <SectionLabel dark>Trust before checkout</SectionLabel>
          <h2 className="font-serif text-4xl font-medium leading-tight text-[#f7f1e6] sm:text-5xl">
            What still needs to become real.
          </h2>
          <div className="mx-auto mt-10 grid max-w-6xl gap-5 text-left lg:grid-cols-3">
            {[
              [
                "Real policy copy",
                "Shipping, refunds, damage replacement, and delivery timing must be finalized before launch.",
              ],
              [
                "Real checkout",
                "Stripe Checkout or Shopify should handle payments, tax, order records, and customer receipts.",
              ],
              [
                "Real social proof",
                "Do not publish review counts or testimonials until they come from actual buyers.",
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
            The visual direction is ready. The next serious step is confirming
            price, policy, and checkout operations.
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
        onRemove={removeLine}
      />
    </div>
  );
}
