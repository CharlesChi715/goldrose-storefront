"use client";

/**
 * ROLE OF THIS FILE
 * The shared shopping cart. The cart lives in the browser's localStorage (so
 * it survives page reloads) and every page reads it through one React hook,
 * `useCart()` — the homepage drawer and the /checkout page always agree on
 * the contents because they are literally reading the same stored value.
 */

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

/**
 * A cart line enriched for display: the stored line plus the looked-up product
 * and computed line total. The `&` joins two types together ("intersection").
 */
export type CartLineView = CartLine & {
  product: Product;
  lineTotal: number;
};

const STORAGE_KEY = "aurea-cart-v1";
const CHANGE_EVENT = "aurea-cart-change";
const MAX_QUANTITY = 20;

const EMPTY: CartLine[] = [];

/**
 * The unique key for a cart line. The same product with two different gift
 * options counts as two separate lines, so the key combines both.
 */
export function getLineKey(productId: string, option: string) {
  return `${productId}::${option}`;
}

/** Look a product up in the catalog by id (undefined if it no longer exists). */
export function getProduct(productId: string) {
  return products.find((product) => product.id === productId);
}

/**
 * A TypeScript "type guard": it checks at runtime that a value parsed from
 * localStorage really has the CartLine shape. The `value is CartLine` return
 * type tells the compiler "if this returns true, treat it as a CartLine".
 * Needed because localStorage can contain anything (old versions, tampering).
 */
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

/**
 * Clean up whatever came out of localStorage: drop malformed lines and lines
 * whose product no longer exists, and clamp quantities into the 1-20 range.
 */
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

/** Read the current cart from localStorage (empty on the server, where there is no window). */
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

/** Save the cart to localStorage and tell every open useCart() hook to re-read it. */
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

/**
 * Tell React how to listen for cart changes: our own custom event covers
 * changes made in this tab, and the browser's "storage" event covers changes
 * made in OTHER tabs of the same site. Returns a cleanup function.
 */
function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

// A subscribe function that never fires — used by the `hydrated` flag below,
// which only needs to differ between server render (false) and client (true).
const subscribeHydration = () => () => {};

/** Helper: read the cart, apply a change function to it, save the result. */
function mutate(transform: (lines: CartLine[]) => CartLine[]) {
  writeLines(transform(readLines()));
}

/** Add one unit of a product+option, or bump the quantity if it's already in the cart. */
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

/** Adjust a line's quantity by +1/-1; a line that reaches 0 is removed entirely. */
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

/** Remove a line from the cart regardless of quantity. */
function removeLine(productId: string, option: string) {
  const key = getLineKey(productId, option);
  mutate((lines) => lines.filter((line) => getLineKey(line.productId, line.option) !== key));
}

/** Empty the cart (used after a completed mock checkout). */
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
