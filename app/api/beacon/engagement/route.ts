/**
 * ROLE OF THIS FILE
 * POST /api/beacon/engagement (engagement-tracking.md): the closing half of a
 * page view. The browser keeps the clock and sends ONE summary when the visit
 * ends, which updates the `page_views` row the arrival beacon already wrote —
 * so engagement costs no extra rows, and every existing analytics query is
 * untouched. Arrives via navigator.sendBeacon during unload; must therefore be
 * cheap, and must never reject in a way the page could notice.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getStore } from "@/lib/supabase/store.ts";

/** A day. Anything longer is a stuck clock, not a reader. */
const MAX_ACTIVE_MS = 24 * 60 * 60 * 1000;

const requestSchema = z.object({
  viewId: z.string().uuid(),
  // Matched alongside viewId so a caller must hold BOTH to write. Neither is
  // secret-grade, but together they make cross-visitor writes impractical.
  visitorId: z.string().trim().min(4).max(64),
  activeMs: z.number().int().min(0).max(MAX_ACTIVE_MS),
  scrollPct: z.number().int().min(0).max(100),
  // Section name -> active ms. Names follow the data-el grammar; the cap
  // stops a hostile client bloating the jsonb blob, and 64 sections is far
  // past any real page.
  sections: z
    .record(z.string().max(80), z.number().int().min(0).max(MAX_ACTIVE_MS))
    .nullable()
    .optional(),
  lastSection: z.string().trim().max(80).nullable().optional(),
});

export async function POST(request: Request) {
  let parsed: z.infer<typeof requestSchema>;
  try {
    parsed = requestSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const sections = parsed.sections ?? null;
  if (sections && Object.keys(sections).length > 64) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // The invariant the reports rely on: one section owns the clock at a time,
  // so per-section time can never exceed the page total. A payload that breaks
  // it is a bug or a forgery either way — drop the sections, keep the page
  // time, rather than poisoning the section report with impossible numbers.
  const sectionTotal = sections
    ? Object.values(sections).reduce((sum, ms) => sum + ms, 0)
    : 0;
  const sectionsAreSane = sectionTotal <= parsed.activeMs;

  try {
    await getStore().update(
      "page_views",
      { id: parsed.viewId, visitor_id: parsed.visitorId },
      {
        active_ms: parsed.activeMs,
        scroll_pct: parsed.scrollPct,
        sections: sectionsAreSane ? sections : null,
        last_section: parsed.lastSection ?? null,
      },
    );
  } catch (error) {
    console.error("[beacon:engagement]", error);
  }
  // Always 200 fast — analytics must never break browsing.
  return NextResponse.json({ ok: true });
}
