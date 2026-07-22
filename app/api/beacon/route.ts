/**
 * ROLE OF THIS FILE
 * POST /api/beacon (§7.12): server-side insert of one page view. Sits
 * outside the auth middleware; there is deliberately no anon write policy —
 * this route (service credentials) is the only writer. `country` comes from
 * Vercel's geo-IP request header, never from the client.
 */

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { getStore } from "@/lib/supabase/store.ts";

const requestSchema = z.object({
  visitorId: z.string().trim().min(4).max(64),
  sessionId: z.string().trim().min(4).max(64),
  path: z.string().trim().min(1).max(500),
  referrer: z.string().trim().max(1000).nullable().optional(),
  utm: z.record(z.string(), z.string().max(200)).nullable().optional(),
});

export async function POST(request: Request) {
  let parsed: z.infer<typeof requestSchema>;
  try {
    parsed = requestSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Never track the admin, even if a client posts it.
  if (parsed.path.startsWith("/admin")) {
    return NextResponse.json({ ok: true });
  }

  try {
    await getStore().insert("page_views", [
      {
        id: randomUUID(),
        visitor_id: parsed.visitorId,
        session_id: parsed.sessionId,
        path: parsed.path,
        referrer: parsed.referrer ?? null,
        utm: parsed.utm ?? null,
        country: request.headers.get("x-vercel-ip-country"),
        created_at: new Date().toISOString(),
      },
    ]);
  } catch (error) {
    console.error("[beacon]", error);
  }
  // Always 200 fast — analytics must never break browsing.
  return NextResponse.json({ ok: true });
}
