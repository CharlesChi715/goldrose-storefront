"use client";

/**
 * ROLE OF THIS FILE
 * The first-party visitor beacon (§7.12): a tiny client component mounted
 * site-wide that POSTs path/referrer/UTM + an anonymous visitor id to
 * /api/beacon on every storefront page view. No cookies, no PII, no third
 * parties — the visitor id is a random localStorage value; the session id
 * lives in sessionStorage and rotates after 30 minutes of inactivity.
 * Renders nothing and skips /admin, /api, checkout-success chrome — and the
 * admin's own previews of the storefront, which are real pages but not visits.
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

/**
 * Whether this document is the admin looking at the storefront, rather than a
 * visitor browsing it — LATCHED, because the evidence is destroyed by the
 * first click.
 *
 * The pathname guard at the call site cannot catch this: inside Content → Home
 * page the pathname IS `/`, because the page genuinely is the home page — it is
 * simply rendered in an `<iframe>` so the owner can see their own edits.
 * Untreated, opening that one editor writes home-page views and a stream of
 * engagement updates for a visit nobody made, and an owner proof-reading copy
 * for twenty minutes lands in the same dwell numbers the shop is judged on.
 *
 * TWO TESTS, ONE PER KIND OF PREVIEW
 * `/preview/home/*` renders a single band in its own document — admin-only
 * (`requireAdmin()` 404s everyone else) and meant to work in its own tab, so
 * being framed is not something it can be asked to prove.
 * Everything else is framed: the whole-page preview and the section map both
 * embed `/` inside the admin. Nothing legitimately embeds this storefront, so
 * "inside a frame" is never a real visit — and stating it that broadly is what
 * makes the guard survive the NEXT preview someone adds.
 *
 * WHY `?adminPreview` IS NOT ONE OF THE TESTS
 * The admin's iframes carry that marker and it stays, as the declaration of
 * intent that makes the src readable. But it must never be sufficient on its
 * own: it would be a kill switch for our own analytics that anyone can type.
 * `https://eldreve.com/?adminPreview=1` would make that visitor invisible — no
 * page view, no dwell, no campaign attribution — and with the latch below, for
 * their whole visit rather than one page. It is exactly the URL a teammate gets
 * from "open frame in a new tab" and might paste to a boss or a supplier. The
 * frame test already covers every document the marker appears in, so dropping
 * it as a test costs the feature nothing and takes it away from the open web.
 *
 * WHY IT LATCHES
 * A preview's links are real: a tap on the bottom nav client-navigates to
 * `/shop`, and `/preview/…` is no longer the pathname. Re-testing per
 * navigation would arm the beacon for the rest of that document's life. The
 * flag is module scope, so it survives every client-side navigation in this
 * document and dies with it.
 *
 * @returns True once this document has been identified as a preview.
 */
function isAdminPreview(): boolean {
  if (previewLatch) return true;
  try {
    previewLatch =
      window.location.pathname.startsWith("/preview/") ||
      window.self !== window.top;
  } catch {
    // Reaching `window.top` across origins can throw. Not being able to see the
    // top window is itself proof this document is framed.
    previewLatch = true;
  }
  return previewLatch;
}
let previewLatch = false;

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
      pathname.startsWith("/api") ||
      // Admin previews are the storefront rendered INSIDE the admin: the
      // standalone section preview at /preview/home/*, and the whole home page
      // and its section map, both framed. A teammate proof-reading copy is not
      // a visit, and counting them would put fake traffic — and fake dwell
      // time — in the owner's own analytics.
      isAdminPreview()
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
