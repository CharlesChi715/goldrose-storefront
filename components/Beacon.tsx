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
import {
  createEngagementClock,
  pickSection,
  type SectionBox,
} from "@/lib/engagement.ts";

const VISITOR_KEY = "goldrose-visitor-id";
const SESSION_KEY = "goldrose-session-id";
const SESSION_SEEN_KEY = "goldrose-session-seen";
const SESSION_GAP_MS = 30 * 60 * 1000; // Google Analytics defaults to a 30-minute inactivity timeout

/** How often the biggest-share contest is re-run. Cheap: it measures only the
 *  handful of sections the IntersectionObserver says are on screen. */
const TICK_MS = 500;

/** Sections are the elements already named for Figma/tests — no new attribute;
 *  the naming convention forbids a second parallel marker. */
const SECTION_SELECTOR = '[data-el$="-SECTION"]';

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
    const lastSeen = Number(
      window.sessionStorage.getItem(SESSION_SEEN_KEY) ?? 0,
    );
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
    if (
      !pathname ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/api")
    ) {
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
    for (const key of [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "utm_acc",
    ]) {
      const value = params.get(key);
      if (value) {
        utm[key] = value.slice(0, 120);
      }
    }
    // The client mints this view's row id so the closing engagement summary
    // can update this exact row instead of writing a second one.
    const viewId = crypto.randomUUID();
    const body = JSON.stringify({
      viewId,
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

    /* ---------- engagement: how long, and which sections ---------- */

    const clock = createEngagementClock(Date.now());
    // Sections currently touching the viewport, per the observer. Only these
    // get measured on each tick, so a 30-band page stays cheap.
    const onScreen = new Map<Element, string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const name = entry.target.getAttribute("data-el");
          if (!name) continue;
          if (entry.isIntersecting) onScreen.set(entry.target, name);
          else onScreen.delete(entry.target);
        }
      },
      // Any sliver counts as "on screen"; which one WINS is decided by score,
      // not by this threshold.
      { threshold: 0 },
    );
    for (const el of document.querySelectorAll(SECTION_SELECTOR)) {
      observer.observe(el);
    }

    const markActivity = () => clock.activity(Date.now());
    const onVisibility = () => {
      const visible = document.visibilityState === "visible";
      clock.setVisible(visible, Date.now());
      // Leaving the tab is the most reliable "visit over" signal there is on
      // mobile, where unload events are routinely skipped.
      if (!visible) flush();
    };

    const readScrollPct = (): number => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return 100; // page fits the screen: fully seen
      return ((window.scrollY || 0) / scrollable) * 100;
    };

    const timer = window.setInterval(() => {
      const viewportHeight = window.innerHeight;
      const boxes: SectionBox[] = [];
      for (const [el, name] of onScreen) {
        const rect = el.getBoundingClientRect();
        boxes.push({ name, top: rect.top, bottom: rect.bottom });
      }
      clock.reportScroll(readScrollPct());
      clock.tick(Date.now(), pickSection(boxes, viewportHeight));
    }, TICK_MS);

    let lastSentMs = -1;
    function flush(): void {
      const snap = clock.snapshot(Date.now());
      // Nothing new to say — skip. Repeat flushes are otherwise harmless: the
      // payload carries running totals and the server overwrites, so a later
      // send simply supersedes an earlier one.
      if (snap.activeMs <= 0 || snap.activeMs === lastSentMs) return;
      lastSentMs = snap.activeMs;
      const payload = JSON.stringify({
        viewId,
        visitorId,
        activeMs: snap.activeMs,
        scrollPct: snap.scrollPct,
        sections: Object.keys(snap.sections).length > 0 ? snap.sections : null,
        lastSection: snap.lastSection,
      });
      try {
        // sendBeacon, not fetch: during unload the browser is free to cancel
        // in-flight fetches, but is obliged to deliver a queued beacon.
        navigator.sendBeacon(
          "/api/beacon/engagement",
          new Blob([payload], { type: "application/json" }),
        );
      } catch {
        // Analytics must never break browsing.
      }
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush); // unload backstop
    for (const event of ["scroll", "pointerdown", "pointermove", "keydown"]) {
      window.addEventListener(event, markActivity, { passive: true });
    }

    return () => {
      // Client-side navigation away: this view is over, report it.
      flush();
      window.clearInterval(timer);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
      for (const event of ["scroll", "pointerdown", "pointermove", "keydown"]) {
        window.removeEventListener(event, markActivity);
      }
    };
  }, [pathname]);

  return null;
}
