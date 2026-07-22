/**
 * ROLE OF THIS FILE
 * Marketing-channel attribution (owner request 2026-07-22): resolve a page
 * view's traffic source and collapse it into the owner's channels — Google
 * ads plus content on Facebook / TikTok / Instagram / Pinterest / YouTube.
 * Standalone module (relative imports only) so `node --test` can load it
 * without the Next.js "@/" alias.
 */

import type { PageViewRow } from "../supabase/types.ts";

/** Raw source: utm_source ▸ referrer hostname ▸ "Direct". */
export function sourceOf(view: PageViewRow | undefined): string {
  if (!view) {
    return "Direct";
  }
  if (view.utm?.utm_source) {
    return view.utm.utm_source;
  }
  if (view.referrer) {
    try {
      const host = new URL(view.referrer).hostname;
      return host || "Direct";
    } catch {
      return view.referrer;
    }
  }
  return "Direct";
}

/**
 * Collapses utm_source spellings and referrer hostnames into one label per
 * platform so "fb", "facebook.com" and "l.facebook.com" count together.
 * YouTube must match before Google (both are Google-owned domains).
 */
const CHANNEL_PATTERNS: Array<{ pattern: RegExp; channel: string }> = [
  { pattern: /youtu\.?be|(^|\b)yt(\b|$)/, channel: "YouTube" },
  { pattern: /google|adwords|gclid/, channel: "Google" },
  { pattern: /facebook|fb\.com|(^|\b)fb(\b|$)|meta\.com/, channel: "Facebook" },
  { pattern: /instagram|(^|\b)ig(\b|$)/, channel: "Instagram" },
  { pattern: /tiktok/, channel: "TikTok" },
  { pattern: /pinterest|pin\.it/, channel: "Pinterest" },
  { pattern: /bing/, channel: "Bing" },
];

export function channelOf(view: PageViewRow | undefined): string {
  const raw = sourceOf(view);
  const needle = raw.toLowerCase();
  if (needle === "direct") {
    return "Direct";
  }
  for (const { pattern, channel } of CHANNEL_PATTERNS) {
    if (pattern.test(needle)) {
      return channel;
    }
  }
  return raw;
}
