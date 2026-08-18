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
 * and technical, and every admin string must go through t() (§9.12). The
 * upstream error is not discarded — fail() logs it server-side, so the owner
 * sees a sentence in their language while we keep the detail we need.
 *
 * WHY THE FIRST EVENT IS AWAITED BEFORE REPLYING.
 * A status can only be sent once, before any body. So we pull one event off
 * the upstream stream inside the try: that proves Anthropic accepted the key
 * and the request, and lets a rejection become a proper 4xx instead of a
 * 200 whose body turns out to be empty. Everything after that point streams,
 * and a break mid-answer can only be logged — the page keeps what arrived.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import Anthropic from "@anthropic-ai/sdk";

import { requireAdmin } from "@/lib/admin/auth";
import { readAdvisorKey } from "@/lib/advisor/keys";

// Reads a file from the repo (the allowlist doc), so never the edge runtime.
export const runtime = "nodejs";

const MODEL = "claude-opus-5";

/**
 * A ceiling, not a target — unspent tokens cost nothing. Generous enough that
 * a long answer is never cut mid-sentence, which the page would show as a
 * truncated bubble with no way to ask for the rest.
 */
const MAX_TOKENS = 16_000;

/** Everything the advisor is allowed to know. Reviewed as a permission change. */
const ALLOWLIST_DOC = "docs/advisor/app-info.md";

/**
 * The allowlist doc, read fresh each turn. It is ~1 KB and served from the OS
 * page cache, which is nothing beside the API call it precedes — and reading
 * it per request means an edit to the doc takes effect immediately instead of
 * at the next deploy.
 */
function systemPrompt(): string {
  const allowlist = readFileSync(join(process.cwd(), ALLOWLIST_DOC), "utf8");
  return [
    "You are ELDREVE's in-house advisor. You answer the owner and the team:",
    "business people, not engineers. Answer in plain business language.",
    "",
    "Always reply in the same language as the user's last message.",
    "",
    "The notes below are everything you know about ELDREVE. When a question",
    "goes past them, say what you do not know and answer the general part —",
    "never fill the gap with a plausible guess about this business, because",
    "the reader cannot tell the two apart and may repeat it to a customer.",
    "",
    "Keep answers focused and brief. Lead with the answer, then the reasons.",
    "",
    "--- What you know about ELDREVE ---",
    allowlist,
  ].join("\n");
}

/**
 * A failure the page knows how to explain, in the admin's language.
 *
 * @param kind - One of the page's ERROR_KINDS keys. The whole response body.
 * @param status - HTTP status to send with it.
 * @param cause - The upstream error. Logged here, never sent: it can quote
 *   the admin's own key or a request id, neither of which belongs on screen.
 */
function fail(kind: string, status: number, cause?: unknown): Response {
  if (cause !== undefined) {
    console.error(`[advisor] ${kind}:`, cause);
  }
  return Response.json({ error: kind }, { status });
}

/** One turn, in the shape the page sends. */
type Turn = { role: "user" | "assistant"; content: string };

/**
 * The conversation, or null when the body is not the shape we agreed on.
 * Only our own page posts here, so a null is a bug on our side, not something
 * the admin typed — hence the "badRequest" kind, which the page has no
 * sentence for and shows as its generic failure.
 */
function readTurns(body: unknown): Turn[] | null {
  const turns = (body as { messages?: unknown } | null)?.messages;
  if (!Array.isArray(turns) || turns.length === 0) {
    return null;
  }
  for (const turn of turns) {
    const { role, content } = (turn ?? {}) as Partial<Turn>;
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string" || content.trim() === "") return null;
  }
  return turns as Turn[];
}

/**
 * Which of the page's kinds an Anthropic failure is, and the status to send.
 *
 * Only badKey sends the admin to the key field (§ the blueprint's key
 * lifecycle rule): a rate limit or an outage means the key is fine, and
 * asking someone to re-enter a working key wastes their time.
 *
 * `type` is checked before `status` because billing and permission failures
 * share 403 — the status alone cannot tell "out of credit" from "this key
 * may not use this model".
 */
function classify(error: unknown): { kind: string; status: number } {
  if (error instanceof Anthropic.APIError) {
    if (error.type === "billing_error") {
      return { kind: "billing", status: 402 };
    }
    if (error.status === 401 || error.status === 403) {
      return { kind: "badKey", status: 400 };
    }
    if (error.status === 429) {
      return { kind: "rateLimit", status: 429 };
    }
  }
  // 5xx, a timeout, a dropped connection, or something we have not met.
  return { kind: "busy", status: 503 };
}

export async function POST(request: Request): Promise<Response> {
  const session = await requireAdmin();

  const key = await readAdvisorKey(session.userId);
  if (!key) {
    return fail("noKey", 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    return fail("badRequest", 400, error);
  }
  const turns = readTurns(body);
  if (!turns) {
    return fail("badRequest", 400, body);
  }

  const client = new Anthropic({ apiKey: key });
  const stream = client.messages.stream(
    {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      // Thinking is on by default on this model. Medium effort keeps the
      // pause before the first word short without making the advice shallow.
      output_config: { effort: "medium" },
      system: systemPrompt(),
      messages: turns,
    },
    // The browser closing the tab aborts this request; passing the signal on
    // stops Anthropic generating (and billing) an answer nobody will read.
    { signal: request.signal },
  );

  const events = stream[Symbol.asyncIterator]();
  let first;
  try {
    first = await events.next();
  } catch (error) {
    stream.abort();
    const { kind, status } = classify(error);
    return fail(kind, status, error);
  }

  const encode = new TextEncoder();
  const answer = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for (let step = first; !step.done; step = await events.next()) {
          const event = step.value;
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encode.encode(event.delta.text));
          }
        }
      } catch (error) {
        // Past the headers: the status is already 200 and cannot be changed.
        // Log it and close, so the page keeps the words that did arrive; it
        // reports "unknown" itself if nothing did.
        console.error("[advisor] stream broke mid-answer:", error);
      } finally {
        // A cancelled stream has closed this controller already, and closing
        // it twice throws — which would surface as an unhandled rejection,
        // not as anything the caller could act on.
        if (controller.desiredSize !== null) {
          controller.close();
        }
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(answer, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      // An answer is generated once, for one admin, and is never re-fetched.
      "cache-control": "no-store",
    },
  });
}
