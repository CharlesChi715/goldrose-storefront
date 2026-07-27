"use client";
/**
 * ROLE OF THIS FILE
 * The SEARCH-OPEN overlay (914:114, 07-27, 已完成 lane) — a full-screen
 * in-page state, NOT a route, per the owner's 07-27 instruction that none of
 * the 小页面 frames get dedicated routes. The header search button
 * (SearchButton, same pattern as MenuButton/MenuDrawer) opens it wherever
 * the visitor is. Geometry, colors, fonts and copy verbatim from the Figma
 * REST data; ornamental glyphs are Figma's own SVG exports (see
 * components/screens/glyphs).
 *
 * What is real:
 * - The input is a live search box: Enter (or tapping a trending chip or a
 *   recent row) goes to /shop?q=…, which filters the catalog by title.
 * - Recent searches are real, kept in localStorage; the row ×, "Clear all"
 *   and the input's clear button all work. The mock's four example rows are
 *   what an actual history looks like, not seeded content.
 *
 * Deliberate deviations (docs/ixd/README.md):
 * - The mock draws a TYPED state ("gold rose gift" in the field, so the
 *   clear button shows); the field starts empty, and the clear button
 *   appears once there is text.
 * - The mock's iPhone status bar ("9:41", 920:111) is not implemented —
 *   C-3 precedent.
 */

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import NoCalcScale from "@/components/NoCalcScale";
import { Glyph } from "@/components/screens/glyphs";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";

const INK = "#3B2F2F";
const SAND = "#E5D9C9";
const GOLD = "#D4AF37";
const CREAM = "#FFF6EC";
const FIELD_BG = "#FFFBF6";

const STORAGE_KEY = "goldrose.recent-searches";
const MAX_STORED = 8;
const MAX_SHOWN = 4; // the frame draws four rows

// 920:123…132 — trending chips (chip 1's ✦ label ships as design pixels).
const TRENDING: Array<{ x: number; y: number; w: number; label: string; svg?: { id: string; ink: [number, number]; textX: number; textW: number } }> = [
  { x: 20, y: 278, w: 148, label: "24K Gold Rose", svg: { id: "920-124", ink: [93, 12], textX: 28, textW: 132 } },
  { x: 180, y: 278, w: 142, label: "Anniversary Gift" },
  { x: 20, y: 330, w: 132, label: "Rose Gift Set" },
  { x: 164, y: 330, w: 104, label: "For Mom" },
  { x: 280, y: 330, w: 130, label: "Ready to Ship" },
];

// The history lives in localStorage, read as an external store (server
// snapshot = empty, so SSR and the first client paint agree). `emit` bumps
// subscribers after our own writes; the storage event covers other tabs.
const recentsListeners = new Set<() => void>();

function emitRecents() {
  for (const listener of recentsListeners) listener();
}

function subscribeRecents(listener: () => void) {
  recentsListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    recentsListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function recentsSnapshot(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

const recentsServerSnapshot = () => "[]";

function parseRecents(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function writeRecents(list: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_STORED)));
  } catch {
    // privacy mode — search still works, history just doesn't persist
  }
  emitRecents();
}

const subscribeToNothing = () => () => {};
const onTheClient = () => true;
const onTheServer = () => false;

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const mounted = useSyncExternalStore(subscribeToNothing, onTheClient, onTheServer);
  const [value, setValue] = useState("");
  const recentsRaw = useSyncExternalStore(subscribeRecents, recentsSnapshot, recentsServerSnapshot);
  const recents = useMemo(() => parseRecents(recentsRaw), [recentsRaw]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Escape closes; the page behind must not scroll while the overlay is up.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  function submit(term: string) {
    const cleaned = term.trim();
    if (!cleaned) return;
    const next = [cleaned, ...recents.filter((t) => t.toLowerCase() !== cleaned.toLowerCase())];
    writeRecents(next);
    onClose();
    router.push(`/shop?q=${encodeURIComponent(cleaned)}`);
  }

  function removeRecent(term: string) {
    writeRecents(recents.filter((t) => t !== term));
  }

  if (!open || !mounted) return null;
  return createPortal(
    <div className={`figv-searchfix ${notoSC.className}`} role="dialog" aria-modal="true" aria-label="Search">
      <style>{`
        .figv-searchfix { position: fixed; inset: 0; z-index: 40; background: ${CREAM}; overflow-y: auto; overflow-x: hidden; }
        .figv-searchwrap { height: 932px; }
        .figv-searchstage { position: relative; width: 430px; height: 932px; left: calc((100% - 430px) / 2); }
        @supports (transform: scale(calc(100vw / 430px))) {
          .figv-searchwrap { height: calc(min(100vw, 480px) * 2.1674419); }
          .figv-searchstage { transform: scale(calc(min(100vw, 480px) / 430px)); transform-origin: top center; }
        }
      `}</style>
      <div className="figv-searchwrap">
      <div className="figv-searchstage">
      {/* 920:112 header — ‹ back (920:113 ink 7×14 in its 36-wide box), title, Close */}
      <button type="button" aria-label="Back" onClick={onClose} style={{ ...abs(18, 46, 36, 36), border: 0, padding: 0, background: "transparent", cursor: "pointer" }}>
        <Glyph src="920-113" x={14.5} y={11} w={7} h={14} ink={[7, 14]} />
      </button>
      <div className={playfair.className} style={{ ...abs(66, 47, 200), ...txt(30, 36, INK), fontWeight: 600 }}>
        Search
      </div>
      <button
        type="button"
        onClick={onClose}
        className={playfair.className}
        style={{ ...abs(338, 53, 74, 18), border: 0, padding: 0, background: "transparent", cursor: "pointer" }}
      >
        <span style={{ ...txt(14, 18, GOLD, "right"), display: "block" }}>Close</span>
      </button>

      {/* 920:116 input capsule */}
      <div style={{ ...abs(20, 112, 390, 58), background: FIELD_BG, boxShadow: `inset 0 0 0 1px ${SAND}`, borderRadius: 28 }} />
      <Glyph src="920-117" x={36} y={123} w={34} h={30} ink={[14, 15]} />
      <form
        style={abs(80, 127, 250, 30)}
        onSubmit={(event) => {
          event.preventDefault();
          submit(value);
        }}
      >
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-label="Search products, occasions, or recipients"
          style={{
            position: "absolute",
            inset: 0,
            border: 0,
            outline: "none",
            background: "transparent",
            ...txt(18, 24, INK),
            fontFamily: "inherit",
            padding: 0,
          }}
        />
      </form>
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setValue("");
            inputRef.current?.focus();
          }}
          style={{ ...abs(354, 121, 40, 40), background: "#F7F2ED", borderRadius: 20, border: 0, padding: 0, cursor: "pointer" }}
        >
          <span style={{ position: "absolute", left: 0, right: 0, top: 7, ...txt(22, 24, INK, "center") }}>×</span>
        </button>
      ) : null}
      <div style={{ ...abs(28, 184, 374), ...txt(11, 15, INK, "center") }}>
        Search products, occasions, or recipients&nbsp;&nbsp;·&nbsp;&nbsp;Press enter to search
      </div>

      {/* 920:122 trending */}
      <div className={playfair.className} style={{ ...abs(20, 228, 390), ...txt(25, 30, INK), fontWeight: 600 }}>
        Trending Searches
      </div>
      {TRENDING.map((chip) => (
        <button
          key={chip.label}
          type="button"
          onClick={() => submit(chip.label)}
          style={{
            ...abs(chip.x, chip.y, chip.w, 40),
            background: FIELD_BG,
            boxShadow: `inset 0 0 0 1px ${SAND}`,
            borderRadius: 20,
            border: 0,
            padding: 0,
            cursor: "pointer",
          }}
        >
          {chip.svg ? (
            <Glyph src={chip.svg.id} x={chip.svg.textX - chip.x} y={11} w={chip.svg.textW} h={16} ink={chip.svg.ink} />
          ) : (
            <span
              className={playfair.className}
              style={{ position: "absolute", left: 8, right: 8, top: 11, ...txt(12, 16, INK, "center"), fontWeight: 500 }}
            >
              {chip.label}
            </span>
          )}
        </button>
      ))}

      <div style={{ ...abs(20, 398, 390, 1), background: SAND }} />

      {/* 920:134 recent searches (real history) */}
      <div className={playfair.className} style={{ ...abs(20, 430, 260), ...txt(25, 30, INK), fontWeight: 600 }}>
        Recent Searches
      </div>
      {recents.length ? (
        <button
          type="button"
          onClick={() => writeRecents([])}
          className={playfair.className}
          style={{ ...abs(326, 436, 84, 18), border: 0, padding: 0, background: "transparent", cursor: "pointer" }}
        >
          <span style={{ ...txt(14, 18, GOLD, "right"), display: "block" }}>Clear all</span>
        </button>
      ) : null}
      {recents.slice(0, MAX_SHOWN).map((term, i) => {
        const y = 486 + i * 58;
        return (
          <div key={term} style={abs(20, y, 390, 50)}>
            <Glyph src="920-137" x={0} y={12} w={30} h={22} ink={[13, 13]} />
            <button
              type="button"
              onClick={() => submit(term)}
              className={playfair.className}
              style={{ ...abs(42, 12, 300, 26), border: 0, padding: 0, background: "transparent", cursor: "pointer", textAlign: "left" }}
            >
              <span style={{ ...txt(15, 20, INK), display: "block", overflow: "hidden", textOverflow: "ellipsis" }}>{term}</span>
            </button>
            <button
              type="button"
              aria-label={`Remove “${term}” from recent searches`}
              onClick={() => removeRecent(term)}
              style={{ ...abs(354, 8, 30, 30), border: 0, padding: 0, background: "transparent", cursor: "pointer" }}
            >
              <span style={{ ...txt(20, 22, INK, "center"), display: "block", marginTop: 3 }}>×</span>
            </button>
            <div style={{ ...abs(0, 49, 390, 1), background: SAND }} />
          </div>
        );
      })}

      {/* 920:156 footer */}
      <Glyph src="920-156" x={140} y={886} w={24} h={18} ink={[15, 15]} />
      <div className={playfair.className} style={{ ...abs(170, 889, 240), ...txt(12, 17, INK), fontWeight: 500 }}>
        Your search history is private and secure.
      </div>
      </div>
      </div>
      <NoCalcScale base={430} stage=".figv-searchstage" origin="top center" wrap=".figv-searchwrap" height={932} />
    </div>,
    document.body,
  );
}
