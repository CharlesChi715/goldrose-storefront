"use client";

/**
 * ROLE OF THIS FILE
 * The product page's ADD TO CART / BUY NOW buttons, pixel-identical to the
 * previously-inert design divs but wired to the v2 cart (§8). Both add the
 * product's default variant; they differ in where they go next, per the
 * Figma prototype on section shop二级 (READY_FOR_DEV):
 *   - ADD TO CART (1523:4085) -> 1523:3059 "/bag"      — keep shopping
 *   - BUY NOW    (1523:4087) -> 2157:239  "/checkout"  — express lane
 * /bag is not itself Ready-for-dev, so it stays a placeholder screen until
 * the design team marks it. With no variant available (product missing from
 * the catalog) the buttons stay inert.
 */

import { useRouter } from "next/navigation";
import { abs, txt } from "@/lib/figma-layout";
import { addToCart } from "@/lib/cart/store";

export function BuyButtons({
  variantId,
  priceLabel,
}: {
  variantId: string | null;
  /** Live price for the BUY NOW label; null keeps the design text. */
  priceLabel?: string | null;
}) {
  const router = useRouter();

  function add(destination: string) {
    if (!variantId) {
      return;
    }
    addToCart(variantId, 1);
    router.push(destination);
  }

  const addToBag = () => add("/bag");
  const buyNow = () => add("/checkout");

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-label="Add to cart"
        onClick={addToBag}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            addToBag();
          }
        }}
        style={{
          ...abs(16, 18, 178, 54),
          background: "#FFFBF6",
          borderRadius: 14,
          boxShadow: "inset 0 0 0 1.5px #3B2F2F",
          cursor: variantId ? "pointer" : "default",
        }}
      >
        <div
          style={{
            ...abs(38, 18, 102),
            ...txt(15, 18.153, "#3B2F2F"),
            fontWeight: 500,
          }}
        >
          ADD TO CART
        </div>
      </div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Buy now"
        onClick={buyNow}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            buyNow();
          }
        }}
        style={{
          ...abs(204, 18, 178, 54),
          background: "#3B2F2F",
          borderRadius: 14,
          boxShadow: "inset 0 0 0 1.5px #3B2F2F",
          cursor: variantId ? "pointer" : "default",
        }}
      >
        <div
          data-live-text
          style={{
            ...abs(27, 19, 124),
            ...txt(13, 15.733, "#FFF6EC"),
            fontWeight: 500,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {priceLabel ? `BUY NOW · ${priceLabel}` : "BUY NOW · $159.00"}
        </div>
      </div>
    </>
  );
}
