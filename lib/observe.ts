/**
 * ROLE OF THIS FILE
 * The one place that says "something went wrong" in a form somebody will
 * actually see.
 *
 * Until this existed every failure on the money path was a `console.error`
 * into Vercel's log stream, which expires and which nobody reads at 3 a.m.
 * Two things change here:
 *
 * 1. `logEvent` writes ONE JSON line per event — `level`, `event`, then the
 *    fields — so a log search for `paypal.capture.failed` finds every case,
 *    and an order id sits in a field rather than inside a sentence.
 * 2. `alert` does that AND emails the owner, through the same Resend link the
 *    order emails use (no new account, no new key). It is throttled to one
 *    email per event per 15 minutes per server instance, so a broken webhook
 *    at midnight is one message with a count, not four hundred.
 *
 * Event names are dotted, lowercase, past tense: `paypal.capture.failed`.
 * Alerts are for the money path and the health check only; everything else
 * is a log line. Neither function ever throws — reporting a failure must not
 * become a second failure.
 */

import { sendOwnerAlert } from "./email.ts";

export type LogLevel = "info" | "warn" | "error";

/** What an unknown thrown value looks like once it is a log field. */
export type ErrorShape = { name?: string; message: string; stack?: string };

/**
 * Reduce whatever was thrown to a JSON-safe shape. `Error` keeps its name,
 * message and stack; anything else is stringified.
 *
 * @param error - The caught value.
 * @returns A plain object safe to serialise.
 */
export function describeError(error: unknown): ErrorShape {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return { message: String(error) };
}

/**
 * Write one structured log line. `err` in the fields is normalised with
 * `describeError`; every other field is passed through as given.
 *
 * `ts`, `level` and `event` are reserved and always win: the caller's fields
 * are spread FIRST so a field that happens to be called `event` cannot rename
 * the event. Getting this backwards made this function's own error line claim
 * to be the error it was reporting on, which is the kind of bug that is only
 * ever found at 3 a.m.
 *
 * @param level - info, warn or error; picks the console stream.
 * @param event - Dotted event name, e.g. `paypal.webhook.failed`.
 * @param fields - Searchable context: ids, statuses, amounts. No secrets.
 */
export function logEvent(
  level: LogLevel,
  event: string,
  fields: Record<string, unknown> = {},
): void {
  const { err, ...rest } = fields;
  const line = JSON.stringify({
    ...rest,
    ...(err === undefined ? {} : { err: describeError(err) }),
    ts: new Date().toISOString(),
    level,
    event,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

/** How the alerter reaches the outside world; injectable for tests. */
export type AlerterDeps = {
  /** Deliver one alert email. Resolves false when nobody is configured. */
  send: (subject: string, text: string) => Promise<boolean>;
  /** Clock, so a test can move time instead of waiting. */
  now?: () => number;
  /** Quiet period per event after an email goes out. */
  windowMs?: number;
};

export type Alerter = (
  event: string,
  summary: string,
  fields?: Record<string, unknown>,
) => Promise<void>;

const DEFAULT_WINDOW_MS = 15 * 60_000;

/**
 * Build an `alert` function with its own throttle memory. The default export
 * below is the production one; tests build their own with a fake `send`.
 *
 * @param deps - Sender, clock and quiet period.
 * @returns The alert function.
 */
export function createAlerter({
  send,
  now = Date.now,
  windowMs = DEFAULT_WINDOW_MS,
}: AlerterDeps): Alerter {
  const last = new Map<string, { at: number; suppressed: number }>();

  return async function alert(event, summary, fields = {}) {
    logEvent("error", event, { ...fields, summary });

    const at = now();
    const previous = last.get(event);
    if (previous && at - previous.at < windowMs) {
      previous.suppressed += 1;
      return;
    }
    const suppressed = previous?.suppressed ?? 0;
    last.set(event, { at, suppressed: 0 });

    const detail = Object.entries(fields)
      .map(
        ([key, value]) =>
          `${key}: ${key === "err" ? describeError(value).message : JSON.stringify(value)}`,
      )
      .join("\n");
    const text = [
      summary,
      "",
      `Event: ${event}`,
      `Time: ${new Date(at).toISOString()}`,
      detail,
      suppressed > 0
        ? `\n${suppressed} more of the same in the last ${Math.round(windowMs / 60_000)} minutes were logged but not emailed.`
        : "",
      "",
      "What to do: docs/runbooks/README.md",
    ].join("\n");

    try {
      await send(`[ELDREVE alert] ${event}`, text);
    } catch (error) {
      // `forEvent`, not `event`: the field names what this alert was about,
      // while `event` names what is being logged now.
      logEvent("error", "alert.email.failed", { err: error, forEvent: event });
    }
  };
}

/**
 * Log at error level AND email the owner — throttled, never throwing. Use it
 * on the money path (capture, webhook, checkout) and the health check; use
 * `logEvent` for everything else.
 */
export const alert: Alerter = createAlerter({ send: sendOwnerAlert });
