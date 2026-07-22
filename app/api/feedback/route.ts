/**
 * ROLE OF THIS FILE
 * POST /api/feedback — visitor ideas/feedback from the storefront's
 * concierge panel. Server-side insert (service credentials; no anon write
 * policy), zod-capped lengths, always answers fast. Read in the admin under
 * Content → Ideas.
 */

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { getStore } from "@/lib/supabase/store.ts";

const requestSchema = z.object({
  message: z.string().trim().min(2).max(2000),
  name: z.string().trim().max(120).optional(),
  email: z.string().trim().email().max(254).optional().or(z.literal("")),
  path: z.string().trim().max(500).optional(),
});

export async function POST(request: Request) {
  let parsed: z.infer<typeof requestSchema>;
  try {
    parsed = requestSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { ok: false, error: "Please write a short message first." },
      { status: 400 },
    );
  }

  try {
    await getStore().insert("feedback", [
      {
        id: randomUUID(),
        name: parsed.name ?? "",
        email: parsed.email || null,
        message: parsed.message,
        path: parsed.path ?? null,
        created_at: new Date().toISOString(),
      },
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[feedback]", error);
    return NextResponse.json(
      { ok: false, error: "Could not save your idea — please try again." },
      { status: 500 },
    );
  }
}
