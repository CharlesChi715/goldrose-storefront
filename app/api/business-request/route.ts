/**
 * ROLE OF THIS FILE
 * POST /api/business-request — enquiries from the Business & Partnerships
 * screen (ELDREVE frame 74:55). The design's SUBMIT REQUEST / BOOK
 * CONSULTATION CTAs have no backend of their own; the agreed V1 is "static +
 * email the request" (owner, 2026-07-25), so this route just validates and
 * mails the owner. Nothing is persisted — when a B2B pipeline earns a table,
 * this is the one place to change.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { sendBusinessRequestEmail } from "@/lib/email.ts";
import { checkRequest, LIMITS } from "@/lib/rate-limit.ts";
import { logEvent } from "@/lib/observe.ts";

const requestSchema = z.object({
  email: z.string().trim().email().max(254),
  need: z.string().trim().max(120).optional(),
  kind: z.enum(["request", "consultation"]),
});

export async function POST(request: Request) {
  // This route puts a message in a human's inbox, which makes it the most
  // abusable one in the app — hence the tightest limit we ship.
  const gate = checkRequest(
    request.headers,
    "business-request",
    LIMITS.businessRequest,
  );
  if (!gate.allowed) {
    logEvent("warn", "ratelimit.refused", { route: "business-request" });
    return NextResponse.json(
      { ok: false, error: "That's a few too many — please try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(gate.retryAfterSeconds) },
      },
    );
  }

  let parsed: z.infer<typeof requestSchema>;
  try {
    parsed = requestSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { ok: false, error: "Please enter a valid business email first." },
      { status: 400 },
    );
  }

  try {
    await sendBusinessRequestEmail(parsed);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[business-request]", error);
    return NextResponse.json(
      { ok: false, error: "Could not send that just now — please try again." },
      { status: 500 },
    );
  }
}
