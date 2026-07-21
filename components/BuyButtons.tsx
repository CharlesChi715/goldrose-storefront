"use client";

/**
 * ROLE OF THIS FILE
 * The product page's ADD TO CART / BUY NOW buttons, pixel-identical to the
 * previously-inert design divs but wired to the v2 cart (§8): both add the
 * product's default variant and continue to /checkout (the storefront has
 * no separate cart page — checkout's summary IS the cart). With no variant
 * available (product missing from the catalog) the buttons stay inert.
 */

import { useRouter } from "next/navigation";
import { abs, txt } from "@/components/veloria";
import { addToCart } from "@/lib/cart/store";

export function BuyButtons({ variantId }: { variantId: string | null }) {
  const router = useRouter();

  function buy() {
    if (!variantId) {
      return;
    }
    addToCart(variantId, 1);
    router.push("/checkout");
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-label="Add to cart"
        onClick={buy}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            buy();
          }
        }}
        style={{
          ...abs(16, 18, 178, 54),
          background: "#FFFFFF",
          borderRadius: 14,
          boxShadow: "inset 0 0 0 1.5px #17483F",
          cursor: variantId ? "pointer" : "default",
        }}
      >
        <div style={{ ...abs(38, 18, 102), ...txt(15, 18.153, "#173A33"), fontWeight: 500 }}>
          ADD TO CART
        </div>
      </div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Buy now"
        onClick={buy}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            buy();
          }
        }}
        style={{
          ...abs(204, 18, 178, 54),
          background: "#073A31",
          borderRadius: 14,
          boxShadow: "inset 0 0 0 1.5px #17483F",
          cursor: variantId ? "pointer" : "default",
        }}
      >
        <div style={{ ...abs(27, 19, 124), ...txt(13, 15.733, "#FFFFFF"), fontWeight: 500 }}>
          BUY NOW · $159.00
        </div>
      </div>
    </>
  );
}
