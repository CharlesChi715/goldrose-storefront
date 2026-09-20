import { createHmac, timingSafeEqual } from "crypto";

/** How far a delivery's timestamp may sit from now before it is refused —
 * Stripe's own SDKs default to five minutes; older is a replay risk. */
const DEFAULT_TOLERANCE_SECONDS = 300;

/**
 * Verify a Stripe webhook delivery: parse `t` (timestamp) and every `v1`
 * signature out of the Stripe-Signature header, HMAC-SHA256 the string
 * "<t>.<rawBody>" with the endpoint's signing secret, and accept when any
 * v1 matches (constant-time compare) and the timestamp is within
 * tolerance. Any malformed input returns false — never throws.
 *
 * @param input - rawBody exactly as received; header is Stripe-Signature;
 *   secret is the whsec_… endpoint secret; toleranceSeconds and nowSeconds
 *   exist for tests.
 * @returns True only for a well-formed, fresh, correctly signed delivery.
 */
export function verifyStripeSignature(input: {
  rawBody: string;
  header: string | null;
  secret: string;
  toleranceSeconds?: number;
  nowSeconds?: number;
}): boolean {
  if (!input.header || !input.secret) {
    return false;
  }
  const parts = input.header.split(",").map((part) => part.trim());
  const timestamp = parts
    .find((part) => part.startsWith("t="))
    ?.slice("t=".length);
  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice("v1=".length));
  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) {
    return false;
  }
  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  const tolerance = input.toleranceSeconds ?? DEFAULT_TOLERANCE_SECONDS;
  if (Math.abs(now - timestampSeconds) > tolerance) {
    return false;
  }

  const expected = createHmac("sha256", input.secret)
    .update(`${timestamp}.${input.rawBody}`, "utf8")
    .digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return signatures.some((signature) => {
    const candidate = Buffer.from(signature, "utf8");
    return (
      candidate.length === expectedBuffer.length &&
      timingSafeEqual(candidate, expectedBuffer)
    );
  });
}
