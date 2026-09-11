/**
 * ROLE OF THIS FILE
 * GET /api/health — the one URL that answers "is the shop actually working?"
 * for something that is not a human. The uptime probe
 * (.github/workflows/uptime.yml) reads it every fifteen minutes.
 *
 * WHAT IT CHECKS, AND WHY SO LITTLE
 * One thing: can we read the database. That is the dependency whose failure
 * takes the whole shop down while the homepage keeps serving a cached copy and
 * looks fine — precisely the outage a "GET / returns 200" probe misses.
 *
 * It deliberately does NOT call PayPal or Resend. A health check that calls a
 * third party turns their outage into our red alert, and turns our probe into
 * traffic against someone else's rate limit. Their failures surface where they
 * happen, through `alert()` on the money path.
 *
 * IT HAS NO SIDE EFFECTS, ON PURPOSE
 * No writes, no email, no alert() — one read and an answer. A public endpoint
 * that sends mail is a public endpoint that sends mail for anyone who curls it
 * in a loop. When this check fails, the thing that shouts is the probe
 * workflow going red, which mails the repository owner by GitHub's own rules.
 *
 * The body is thin for the same reason: enough for the probe to act on, not a
 * description of our internals for anyone who asks.
 */

import { NextResponse } from "next/server";
import { getStore } from "@/lib/supabase/store.ts";
import { logEvent } from "@/lib/observe.ts";

/** Never cached: a cached health check reports the health of the past. */
export const dynamic = "force-dynamic";

/**
 * How long the database gets to answer before we call it down. Well under the
 * probe's own timeout, so a hung database reports as "degraded" rather than as
 * a probe that timed out — the two look very different at 3 a.m.
 */
const PROBE_TIMEOUT_MS = 5_000;

export async function GET() {
  const startedAt = Date.now();

  // The cheapest honest read there is: an indexed single-row lookup, pushed
  // down to SQL in hosted mode. `all()` would drag a whole table over the wire
  // every fifteen minutes forever.
  const probe = getStore()
    .where("settings", { key: "store" })
    .then(() => true);

  let databaseOk = false;
  try {
    databaseOk = await Promise.race([
      probe,
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("database probe timed out")),
          PROBE_TIMEOUT_MS,
        ),
      ),
    ]);
  } catch (error) {
    // Logged, not alerted — see the file header.
    logEvent("error", "health.database.failed", { err: error });
    databaseOk = false;
  }

  const body = {
    status: databaseOk ? "ok" : "degraded",
    // Which backend answered, so a probe against a preview deployment cannot
    // be mistaken for a probe against the real shop.
    backend: getStore().backend,
    checks: { database: databaseOk ? "ok" : "fail" },
    ms: Date.now() - startedAt,
  };

  return NextResponse.json(body, {
    status: databaseOk ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
