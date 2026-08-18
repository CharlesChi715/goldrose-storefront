/**
 * ROLE OF THIS FILE
 * POST /api/advisor — the advisor's server half
 * (design: docs/advisor/BLUEPRINT-agent-advisor.md).
 *
 * Reads the signed-in admin's own Anthropic key, sends the allowlist doc as
 * the system prompt plus the whole conversation, and streams the answer back
 * as plain text.
 *
 * Failures come back as { error: <kind> } with a non-2xx status, matching the
 * ERROR_KINDS union in the page. Never Anthropic's own message: it is English
 * and technical, and every admin string must go through t() (§9.12).
 */

import { requireAdmin } from "@/lib/admin/auth";
import { readAdvisorKey } from "@/lib/advisor/keys";

/** A failure the page knows how to explain, in the admin's language. */
function fail(kind: string, status: number): Response {
  return Response.json({ error: kind }, { status });
}

export async function POST(request: Request): Promise<Response> {
  const session = await requireAdmin();

  const key = await readAdvisorKey(session.userId);
  if (!key) {
    return fail("noKey", 400);
  }

  return fail("busy", 503); // replaced in the next chunk
}
