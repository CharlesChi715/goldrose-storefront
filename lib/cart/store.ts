"use client";

import { useMemo, useSyncExternalStore } from "react";
import { products, type Product } from "@/lib/products";

/**
 * A single cart entry. We persist only the product id, the chosen gift option,
 * and the quantity — never the price. Prices are always re-resolved from the
 * catalog (here for display, and again server-side at checkout) so a stale or
 * tampered localStorage value can never change what a customer is charged.
 */
export type CartLine = {
  productId: string;
  option: string;
  quantity: number;
};

export type CartLineView = CartLine & {
  product: Product;
  lineTotal: number;
};

const STORAGE_KEY = "aurea-cart-v1";
const CHANGE_EVENT = "aurea-cart-change";
const MAX_QUANTITY = 20;

const EMPTY: CartLine[] = [];

export function getLineKey(productId: string, option: string) {
  return `${productId}::${option}`;
}

export function getProduct(productId: string) {
  return products.find((product) => product.id === productId);
}

function isCartLine(value: unknown): value is CartLine {
  if (!value || typeof value !== "object") {
    return false;
  }
  const maybe = value as Partial<CartLine>;
  return (
    typeof maybe.productId === "string" &&
    typeof maybe.option === "string" &&
    typeof maybe.quantity === "number" &&
    Number.isFinite(maybe.quantity) &&
    maybe.quantity > 0
  );
}

function normalize(parsed: unknown): CartLine[] {
  if (!Array.isArray(parsed)) {
    return EMPTY;
  }
  const clean = parsed
    .filter(isCartLine)
    .filter((line) => Boolean(getProduct(line.productId)))
    .map((line) => ({
      ...line,
      quantity: Math.min(MAX_QUANTITY, Math.max(1, Math.floor(line.quantity))),
    }));
  return clean.length > 0 ? clean : EMPTY;
}

// getSnapshot must return a stable reference while the underlying storage is
// unchanged, so we cache the parsed value keyed by the raw string.
let cachedRaw: string | null = null;
let cachedLines: CartLine[] = EMPTY;

function readLines(): CartLine[] {
  if (typeof window === "undefined") {
    return EMPTY;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) {
    return cachedLines;
  }
  cachedRaw = raw;
  if (!raw) {
    cachedLines = EMPTY;
    return cachedLines;
  }
  try {
    cachedLines = normalize(JSON.parse(raw));
  } catch {
    cachedLines = EMPTY;
  }
  return cachedLines;
}

function writeLines(next: CartLine[]) {
  if (typeof window === "undefined") {
    return;
  }
  cachedRaw = JSON.stringify(next);
  cachedLines = next;
  window.localStorage.setItem(STORAGE_KEY, cachedRaw);
  // Notify every mounted useCart() subscriber in this tab.
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

const subscribeHydration = () => () => {};

function mutate(transform: (lines: CartLine[]) => CartLine[]) {
  writeLines(transform(readLines()));
}

function addLine(productId: string, option: string) {
  if (!getProduct(productId)) {
    return;
  }
  mutate((lines) => {
    const key = getLineKey(productId, option);
    const existing = lines.find((line) => getLineKey(line.productId, line.option) === key);
    return existing
      ? lines.map((line) =>
          getLineKey(line.productId, line.option) === key
            ? { ...line, quantity: Math.min(MAX_QUANTITY, line.quantity + 1) }
            : line,
        )
      : [...lines, { productId, option, quantity: 1 }];
  });
}

function changeLineQuantity(productId: string, option: string, amount: number) {
  const key = getLineKey(productId, option);
  mutate((lines) =>
    lines
      .map((line) =>
        getLineKey(line.productId, line.option) === key
          ? { ...line, quantity: Math.min(MAX_QUANTITY, line.quantity + amount) }
          : line,
      )
      .filter((line) => line.quantity > 0),
  );
}

function removeLine(productId: string, option: string) {
  const key = getLineKey(productId, option);
  mutate((lines) => lines.filter((line) => getLineKey(line.productId, line.option) !== key));
}

function clearCart() {
  writeLines(EMPTY);
}

/**
 * Shared cart state backed by localStorage so the storefront and the dedicated
 * /checkout route read and write the same cart across client navigations.
 *
 * Built on `useSyncExternalStore`: the server snapshot is always empty and the
 * client reads localStorage, so there is no hydration mismatch and no
 * setState-in-effect. `hydrated` flips to true once mounted on the client, so
 * callers can defer cart-dependent UI (e.g. the empty-cart screen).
 */
export function useCart() {
  const lines = useSyncExternalStore(subscribe, readLines, () => EMPTY);
  const hydrated = useSyncExternalStore(subscribeHydration, () => true, () => false);

  const lineViews = useMemo<CartLineView[]>(
    () =>
      lines
        .map((line) => {
          const product = getProduct(line.productId);
          if (!product) {
            return null;
          }
          return { ...line, product, lineTotal: product.price * line.quantity };
        })
        .filter((line): line is CartLineView => Boolean(line)),
    [lines],
  );

  const subtotal = lineViews.reduce((sum, line) => sum + line.lineTotal, 0);
  const itemCount = lineViews.reduce((sum, line) => sum + line.quantity, 0);

  return {
    lines: lineViews,
    rawLines: lines,
    subtotal,
    itemCount,
    hydrated,
    add: addLine,
    changeQuantity: changeLineQuantity,
    remove: removeLine,
    clear: clearCart,
  };
}
