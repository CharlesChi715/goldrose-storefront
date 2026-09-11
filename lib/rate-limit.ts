/**
 * ROLE OF THIS FILE
 * A first layer of abuse protection for the public POST routes.
 *
 * WHAT THIS IS, AND HONESTLY IS NOT
 * The counter lives in this process's memory. On Vercel that means per running
 * instance: two instances mean roughly twice the allowance, and a cold start
 * forgets everything. It is therefore NOT a security boundary — a determined
 * attacker with many IPs walks past it.
 *
 * It is still worth having, because it stops the things that actually happen to
 * a small shop: a stuck client retrying forever, a scraper hammering search, a
 * bored visitor discovering that `business-request` emails the owner. Those are
 * one client repeating itself, which is exactly what a per-instance counter
 * catches. The limits below are set so no honest shopper can reach them.
 *
 * The store is deliberately behind `createLimiter`, so the day this needs to be
 * shared (Vercel's firewall, or a Redis counter) only that function changes.
 *
 * THE LIMITS ARE NOT ALL THE SAME SHAPE, ON PURPOSE
 * Three different answers to "what does exceeding this mean":
 *   - refuse (429)   — the caller is asking for something expensive or
 *                      irreversible: an email to the owner, a review, a
 *                      discount lookup.
 *   - drop (200)     — analytics. Losing a row is free; blocking a shopper's
 *                      page or search is not. The route lies cheerfully.
 *   - never limited  — /api/paypal/capture. A refused capture is money taken
 *                      with no order recorded. It is idempotent by design and
 *                      guarded by PayPal itself; it does not get a limiter.
 */

/** One rule: at most `limit` hits in a `windowMs` sliding window. */
export type Limit = { limit: number; windowMs: number };

/** What the limiter decided, and what the caller should tell the client. */
export type Decision = {
  allowed: boolean;
  /** Hits still available in the current window. */
  remaining: number;
  /** Whole seconds until the window has room again; 0 when allowed. */
  retryAfterSeconds: number;
};

export type Limiter = {
  check(key: string, limit: Limit): Decision;
  /** Keys currently tracked — for tests and for a memory sanity check. */
  size(): number;
};

const MINUTE = 60_000;

/**
 * The limits, by route. Named so a reader can see the whole policy at once
 * rather than hunting through ten files.
 *
 * Every number is "generous for a human, tight for a script". A shopper
 * searching hard makes maybe twenty searches a minute; a scraper makes
 * thousands.
 */
export const LIMITS = {
  /** Emails the owner. The most abusable route in the app. */
  businessRequest: { limit: 3, windowMs: 10 * MINUTE },
  /** Writes a row a human reads. */
  feedback: { limit: 5, windowMs: 10 * MINUTE },
  /** One review per order is already enforced; this stops the retry storm. */
  reviews: { limit: 10, windowMs: 10 * MINUTE },
  /** Guessing discount codes is the one brute-force worth naming. */
  discount: { limit: 20, windowMs: MINUTE },
  /**
   * Starts a PayPal order, or places a mock one. Deliberately loose: this is
   * the one limited route the e2e suite drives repeatedly, all of it from a
   * single localhost address, and a limiter that turns the test suite red is
   * a limiter somebody will delete. 60 checkouts in ten minutes from one
   * address is still far outside anything a shopper does.
   */
  checkoutStart: { limit: 60, windowMs: 10 * MINUTE },
  /** Analytics: dropped rather than refused. */
  beacon: { limit: 120, windowMs: MINUTE },
  /** Analytics: dropped rather than refused. */
  searchQueries: { limit: 120, windowMs: MINUTE },
} as const satisfies Record<string, Limit>;

/**
 * Build a limiter with its own memory.
 *
 * The store is a sliding window log: per key, the timestamps of recent hits,
 * pruned to the window on every read. That costs a little more memory than a
 * fixed-window counter and in exchange never lets a client take double the
 * allowance by straddling a window boundary.
 *
 * Memory is bounded two ways, because an attacker choosing a fresh key per
 * request is otherwise a way to exhaust the process: each key holds at most
 * `limit` timestamps, and the map holds at most `maxKeys` keys, evicting the
 * least recently used. Eviction is safe — a forgotten key simply gets a fresh
 * allowance, which is the same thing a new instance would give it.
 *
 * @param options - `maxKeys` caps tracked keys; `now` is injectable for tests.
 * @returns A limiter with its own independent memory.
 */
export function createLimiter({
  maxKeys = 10_000,
  now = Date.now,
}: { maxKeys?: number; now?: () => number } = {}): Limiter {
  const hits = new Map<string, number[]>();

  return {
    check(key, limit) {
      const at = now();
      const cutoff = at - limit.windowMs;

      const previous = hits.get(key);
      const recent = previous ? previous.filter((t) => t > cutoff) : [];

      // Re-inserting makes the map least-recently-used ordered, so the
      // eviction below drops the coldest key rather than an arbitrary one.
      hits.delete(key);

      if (recent.length >= limit.limit) {
        hits.set(key, recent);
        const oldest = recent[0];
        const freesAt = oldest + limit.windowMs;
        return {
          allowed: false,
          remaining: 0,
          // Always at least a second: "retry after 0" invites an instant retry.
          retryAfterSeconds: Math.max(1, Math.ceil((freesAt - at) / 1000)),
        };
      }

      recent.push(at);
      hits.set(key, recent);

      if (hits.size > maxKeys) {
        const coldest = hits.keys().next();
        if (!coldest.done) hits.delete(coldest.value);
      }

      return {
        allowed: true,
        remaining: limit.limit - recent.length,
        retryAfterSeconds: 0,
      };
    },
    size() {
      return hits.size;
    },
  };
}

/**
 * Collapse an address to the unit a person plausibly controls.
 *
 * IPv4 is returned as-is. IPv6 is truncated to its /64 prefix, because a home
 * connection is routinely handed a whole /64 — 18 quintillion addresses — and
 * a limiter keyed on the full address would give one attacker an unlimited
 * supply of fresh buckets, which is the entire thing it exists to prevent.
 *
 * IPv4-mapped forms (`::ffff:203.0.113.7`) are unwrapped rather than
 * truncated, since truncating one collapses EVERY mapped address into a single
 * bucket and would rate-limit the whole internet as one caller.
 *
 * @param ip - An address from a request header.
 * @returns The bucket identity for that address.
 */
export function ipBucket(ip: string): string {
  if (!ip.includes(":")) return ip;

  const [head, tail] = ip.split("::");
  const headGroups = head ? head.split(":") : [];
  const tailGroups = tail ? tail.split(":") : [];

  // An IPv4-mapped address ends in dotted-quad form; that IS the caller.
  const last = (tailGroups.length ? tailGroups : headGroups).at(-1);
  if (last?.includes(".")) return last;

  const missing = 8 - headGroups.length - tailGroups.length;
  const full = [
    ...headGroups,
    ...Array(Math.max(0, missing)).fill("0"),
    ...tailGroups,
  ];
  return full.slice(0, 4).join(":");
}

/**
 * Who is calling, as well as we can tell.
 *
 * Vercel terminates every request at its edge and sets `x-real-ip` from the
 * connection it actually accepted — the same header its own `ipAddress()`
 * helper reads — so that is the value to trust. `x-forwarded-for` is a
 * fallback, and only its FIRST entry is taken: on Vercel the platform
 * overwrites the header, so that entry is the real client.
 *
 * ⚠️ On a host that APPENDS rather than overwrites, the first entry is
 * whatever the client sent, and this becomes trivially evadable. That is
 * acceptable only because the value is used for one thing — a rate-limit
 * bucket — and never as an allowlist, an identity, or an authorisation.
 *
 * @param headers - The request headers.
 * @returns The caller's bucket, or null when the platform named nobody.
 */
export function clientIp(headers: Headers): string | null {
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return ipBucket(realIp);
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return ipBucket(forwarded);
  return null;
}

/**
 * The limiter key for one caller on one route, or null when there is no
 * caller to key on.
 *
 * Scoped by route, so a shopper who has spent their reviews allowance does not
 * thereby lose their search.
 *
 * @param headers - The request headers.
 * @param scope - A short route name, e.g. "reviews".
 * @returns The key, or null when the request carries no address.
 */
export function clientKey(headers: Headers, scope: string): string | null {
  const ip = clientIp(headers);
  return ip === null ? null : `${scope}:${ip}`;
}

/**
 * The process-wide limiter. Cached on `globalThis` for the same reason the
 * table store is: a dev-server hot reload must not hand out a fresh, empty
 * counter on every edit.
 */
const GLOBAL_KEY = "__eldreve_rate_limiter__";

/**
 * Hand out the process-wide limiter, creating it on first use.
 *
 * @returns The shared limiter.
 */
export function getLimiter(): Limiter {
  const holder = globalThis as Record<string, unknown>;
  if (!holder[GLOBAL_KEY]) {
    holder[GLOBAL_KEY] = createLimiter();
  }
  return holder[GLOBAL_KEY] as Limiter;
}

/**
 * The headers a 429 must carry.
 *
 * `Retry-After` tells a well-behaved client when to come back, which is the
 * difference between a client that backs off and one that hammers. RFC 6585 §4
 * is explicit about the other: "Responses with the 429 status code MUST NOT be
 * stored by a cache" — without it, a CDN can serve one shopper's refusal to
 * everybody behind the same edge node.
 *
 * @param decision - A refusing decision from `checkRequest`.
 * @returns Headers to spread into the 429 response.
 */
export function refusalHeaders(decision: Decision): Record<string, string> {
  return {
    "Retry-After": String(decision.retryAfterSeconds),
    "Cache-Control": "no-store",
  };
}

/** The answer given when there is nobody to count. */
const ALLOWED: Decision = {
  allowed: true,
  remaining: Number.POSITIVE_INFINITY,
  retryAfterSeconds: 0,
};

/**
 * The one call a route makes: work out who is asking and whether they may.
 *
 * Returns the decision rather than a response, because the routes disagree
 * about what exceeding a limit means — see the header. A route that refuses
 * answers 429 with `Retry-After: decision.retryAfterSeconds`; a route that
 * drops answers its usual 200 and simply does not write.
 *
 * ⚠️ **A request with no client address is always allowed.** Vercel sets
 * `x-real-ip` on every request it serves, so a missing address does not mean
 * an anonymous visitor — it means this is not running behind Vercel: local
 * development, or the Playwright suite. Bucketing those under one shared
 * "unknown" key would put an entire 191-test run, which fires a beacon on
 * every navigation, into a single 120-per-minute allowance, and the analytics
 * specs would start failing for reasons no one could reproduce.
 *
 * The cost of this choice is that a self-hosted deployment behind a proxy that
 * sets neither header is unlimited. That is the right trade for a first layer
 * whose header already concedes it is not a security boundary, and it is why
 * the real ceiling belongs at the edge (Vercel's firewall), where a blocked
 * request never reaches this code at all.
 *
 * @param headers - The incoming request's headers.
 * @param scope - Short route name; scopes the bucket.
 * @param limit - One of `LIMITS`.
 * @returns Whether to proceed, and what to tell the caller if not.
 */
export function checkRequest(
  headers: Headers,
  scope: string,
  limit: Limit,
): Decision {
  const key = clientKey(headers, scope);
  if (key === null) return ALLOWED;
  return getLimiter().check(key, limit);
}
