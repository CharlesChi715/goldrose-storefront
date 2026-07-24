"use client";

/**
 * ROLE OF THIS FILE
 * The first-party visitor beacon (§7.12): a tiny client component mounted
 * site-wide that POSTs path/referrer/UTM + an anonymous visitor id to
 * /api/beacon on every storefront page view. No cookies, no PII, no third
 * parties — the visitor id is a random localStorage value; the session id
 * lives in sessionStorage and rotates after 30 minutes of inactivity.
 * Renders nothing and skips /admin, /api, and checkout-success chrome.
 */

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const VISITOR_KEY = "goldrose-visitor-id";
const SESSION_KEY = "goldrose-session-id";
const SESSION_SEEN_KEY = "goldrose-session-seen";
const SESSION_GAP_MS = 30 * 60 * 1000;

function randomId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 24);
}

/** Anonymous visitor id (persistent) — also read by checkout (§8). */
export function getVisitorId(): string | null {
  try {
    let id = window.localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = randomId();
      window.localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

function getSessionId(): string | null {
  try {
    const now = Date.now();
    const lastSeen = Number(window.sessionStorage.getItem(SESSION_SEEN_KEY) ?? 0);
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id || now - lastSeen > SESSION_GAP_MS) {
      id = randomId();
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    window.sessionStorage.setItem(SESSION_SEEN_KEY, String(now));
    return id;
  } catch {
    return null;
  }
}

export function Beacon() {
  // 1. Next.js updates the router state
  // 2. React schedules Beacon to render again
  // 3. React calls Beacon()
  // 4. Beacon starts executing from top to bottom
  // 5. Beacon calls usePathname()
  // 6. usePathname() returns the updated pathname
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/api")) {
      return;
    }
    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    if (!visitorId || !sessionId) {
      return;
    }
    
    // For this URL:
    // https://goldrose.com/shop?utm_source=instagram&utm_medium=social
    // window.location.search is:
    // ?utm_source=instagram&utm_medium=social
    const params = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    // utm_acc is our own tag (posting account, for commissions) — not one of
    // the five standard UTM params, so ad tools will never overwrite it.
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_acc"]) {
      const value = params.get(key);
      if (value) {
        utm[key] = value.slice(0, 120);
      }
    }
    const body = JSON.stringify({
      visitorId,
      sessionId,
      path: pathname,
      referrer: document.referrer || null,
      utm: Object.keys(utm).length > 0 ? utm : null,
    });
    // Fire-and-forget after render — cached pages stay cached (§8).
    void fetch("/api/beacon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}
