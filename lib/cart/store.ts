"use client";

/**
 * ROLE OF THIS FILE
 * The shared shopping cart, v2 (§8 cart refactor): lines are keyed by
 * VARIANT ID + quantity — never prices, never product data — stored in
 * localStorage under "goldrose-cart-v2". Product/price display resolves
 * against the DB-backed catalog passed into useCart(catalog) by a server
 * component, and the server re-prices everything again at checkout, so
 * stale or tampered localStorage can never change what a customer pays.
 */

import { useMemo, useSyncExternalStore } from "react";
import type { CatalogProduct, CatalogVariant } from "@/lib/supabase/types.ts";

export type CartLine = {
  variantId: string;
  quantity: number;
};

export type CartLineView = CartLine & {
  product: CatalogProduct;
  variant: CatalogVariant;
  lineTotal: number;
};

const STORAGE_KEY = "goldrose-cart-v2";
const CHANGE_EVENT = "goldrose-cart-change";
const MAX_QUANTITY = 20;

const EMPTY: CartLine[] = [];

function isCartLine(value: unknown): value is CartLine {
  if (!value || typeof value !== "object") {
    return false;
  }
  const maybe = value as Partial<CartLine>;
  return (
    typeof maybe.variantId === "string" &&
    typeof maybe.quantity === "number" &&
    Number.isFinite(maybe.quantity) &&
    maybe.quantity > 0
  );
}

function normalize(parsed: unknown): CartLine[] {
  if (!Array.isArray(parsed)) {
    return EMPTY;
  }
  const clean = parsed.filter(isCartLine).map((line) => ({
    variantId: line.variantId,
    quantity: Math.min(MAX_QUANTITY, Math.max(1, Math.floor(line.quantity))),
  }));
  return clean.length > 0 ? clean : EMPTY;
}

// getSnapshot must return a stable reference while storage is unchanged.
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

/** Add units of a variant (bumps quantity if it's already in the cart). */
export function addToCart(variantId: string, quantity = 1) {
  mutate((lines) => {
    const existing = lines.find((line) => line.variantId === variantId);
    return existing
      ? lines.map((line) =>
          line.variantId === variantId
            ? { ...line, quantity: Math.min(MAX_QUANTITY, line.quantity + quantity) }
            : line,
        )
      : [...lines, { variantId, quantity: Math.min(MAX_QUANTITY, Math.max(1, quantity)) }];
  });
}

function changeLineQuantity(variantId: string, amount: number) {
  mutate((lines) =>
    lines
      .map((line) =>
        line.variantId === variantId
          ? { ...line, quantity: Math.min(MAX_QUANTITY, line.quantity + amount) }
          : line,
      )
      .filter((line) => line.quantity > 0),
  );
}

function removeLine(variantId: string) {
  mutate((lines) => lines.filter((line) => line.variantId !== variantId));
}

function clearCart() {
  writeLines(EMPTY);
}

/**
 * Cart state resolved against the DB catalog (fetched server-side and passed
 * as props). Lines whose variant no longer exists in the catalog are hidden
 * from display but kept in rawLines; the server rejects them at checkout.
 */
export function useCart(catalog: CatalogProduct[]) {
  const lines = useSyncExternalStore(subscribe, readLines, () => EMPTY);
  const hydrated = useSyncExternalStore(subscribeHydration, () => true, () => false);

  const lineViews = useMemo<CartLineView[]>(
    () =>
      lines
        .map((line) => {
          for (const product of catalog) {
            const variant = product.variants.find((entry) => entry.id === line.variantId);
            if (variant) {
              return {
                ...line,
                product,
                variant,
                lineTotal: variant.price_cents * line.quantity,
              };
            }
          }
          return null;
        })
        .filter((line): line is CartLineView => Boolean(line)),
    [lines, catalog],
  );

  const subtotal = lineViews.reduce((sum, line) => sum + line.lineTotal, 0);
  const itemCount = lineViews.reduce((sum, line) => sum + line.quantity, 0);

  return {
    lines: lineViews,
    rawLines: lines,
    subtotal,
    itemCount,
    hydrated,
    add: addToCart,
    changeQuantity: changeLineQuantity,
    remove: removeLine,
    clear: clearCart,
  };
}
