"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * The search overlay (07-29 frame 1523:3266 " Homepage-serch" [sic]) — a
 * full-screen in-page state, NOT a route, per the owner's 07-27 instruction
 * that none of the 小页面 frames get dedicated routes. The header search
 * button (SearchButton, same pattern as MenuButton/MenuDrawer) opens it
 * wherever the visitor is. Geometry, colors, fonts and copy verbatim from the
 * Figma REST data; ornamental glyphs are Figma's own SVG exports (see
 * components/screens/glyphs).
 *
 * What is real:
 * - The panel SHOWS PRODUCTS AS YOU TYPE. The whole searchable catalogue is
 *   fetched once, the first time the overlay opens (`/api/search`), and every
 *   keystroke after that is a synchronous match in the browser — no request
 *   per letter, so results keep up with typing and can never arrive out of
 *   order. See lib/catalog/search-index.ts for why an index beats a query API.
 * - The matching is `lib/catalog/search.ts`, the SAME function `/shop?q=` runs
 *   on the server. A shopper can never pick a product out of this list and
 *   land on a grid that disagrees about what matched.
 * - Names, occasions, recipients and availability are all searched, so the
 *   hint's promise ("products, occasions, or recipients") and the trending
 *   chips are true: "For Mom" finds what the drawer's Mother chip finds. Until
 *   2026-08-10 the engine read titles only, and three of the five chips we
 *   ship returned an empty grid.
 * - Enter (or tapping a trending chip or a recent row) goes to /shop?q=…;
 *   tapping a RESULT goes straight to that product page.
 * - Recent searches are real, kept in localStorage; the row ×, "Clear all"
 *   and the input's clear button all work. The mock's four example rows are
 *   what an actual history looks like, not seeded content.
 *
 * Deliberate deviations (docs/ixd/README.md):
 * - The design draws no results state at all — it draws a TYPED field with
 *   trending chips still below it. Results are therefore ours, built in the
 *   frame's own language (its 25/30 Playfair headings, its 390-wide rows, its
 *   SAND hairline, its 84px-tall rows echoing the recent-row pitch). The IDLE
 *   panel is byte-identical to the import.
 * - The mock draws a TYPED state ("gold rose gift" in the field, so the
 *   input's × shows); the field starts empty, and the × appears once there
 *   is text. The 07-29 sheet names that node SEARCH-HEADER-INPUT-CLOSE-BTN,
 *   but it stays the clear-input affordance — closing lives on the back
 *   chevron and Escape (flagged to design).
 * - The frame is 948 tall against the 932 viewport; its content ends at
 *   y≈663 and the header hugs y=0, so the extra 16px is empty bottom slack,
 *   not top bleed. The overlay keeps the 932 mapping as a FLOOR: the stage
 *   grows only if a list ever outgrows it (lib/catalog/search-layout.ts).
 *
 * ACCESSIBILITY, AND WHY IT DEPARTS FROM THE CAROUSEL
 * This is the repo's first keyboard-navigable list. The Carousel uses a roving
 * tabindex, which is right for it and wrong here: moving DOM focus onto a
 * result would take it off the text field, and the next character typed would
 * go nowhere. So the input keeps focus and carries `aria-activedescendant`
 * (the W3C combobox pattern) while ↑/↓ move a highlight, Enter opens the
 * highlighted product, and Escape clears the field before it closes the panel.
 * Rows stay real links, so open-in-new-tab and the context menu still work.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NoCalcScale from "@/components/NoCalcScale";
import { Glyph } from "@/components/screens/glyphs";
import {
  loadSearchIndex,
  peekSearchIndex,
} from "@/lib/catalog/search-client.ts";
import type { SearchProduct } from "@/lib/catalog/search-index.ts";
import {
  FOOTER_GAP,
  FOOTER_H,
  LIST_TOP,
  MAX_IDLE_ROWS,
  MAX_RESULT_ROWS,
  RECENT_H,
  RECENT_PITCH,
  RECENTS_HEADING_TOP,
  RECENTS_TOP,
  RESULT_PHOTO,
  RESULT_PHOTO_INSET,
  RESULT_ROW_H,
  SECTION_HEADING_TOP,
  STAGE_WIDTH,
  listBottom,
  rowTop,
  stageHeight,
  wrapRatio,
} from "@/lib/catalog/search-layout.ts";
import {
  highlightRuns,
  normalizeSearchText,
  searchDocs,
} from "@/lib/catalog/search.ts";
import { recordSearchQuery } from "@/lib/search/record.ts";
import { spotlightStyle } from "@/lib/images/spotlight";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";

const INK = "#3B2F2F";
const INK_SOFT = "#4A403B";
const MUTED = "#B8A69A";
const SAND = "#E5D9C9";
const GOLD = "#D4AF37";
const CREAM = "#FFF6EC";
const FIELD_BG = "#FFFBF6";

const STORAGE_KEY = "goldrose.recent-searches";
const MAX_STORED = 8;
const MAX_SHOWN = 4; // the frame draws four rows

// 1523:3274 … 1523:3283 — trending chips. The 07-29 batch exported no text
// SVG for chip 1's "✦  24K Gold Rose"; the 07-27 export (920-124.svg) is the
// same string, face and #D4AF37 fill, so it still ships as the design pixels.
const TRENDING: Array<{
  x: number;
  y: number;
  w: number;
  label: string;
  svg?: { id: string; ink: [number, number]; textX: number; textW: number };
}> = [
  {
    x: 20,
    y: 231,
    w: 148,
    label: "24K Gold Rose",
    svg: { id: "920-124", ink: [93, 12], textX: 28, textW: 132 },
  },
  { x: 180, y: 231, w: 142, label: "Anniversary Gift" },
  { x: 20, y: 283, w: 132, label: "Rose Gift Set" },
  { x: 164, y: 283, w: 104, label: "For Mom" },
  { x: 280, y: 283, w: 130, label: "Ready to Ship" },
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
    return Array.isArray(parsed)
      ? parsed.filter((v) => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}

function writeRecents(list: string[]) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(list.slice(0, MAX_STORED)),
    );
  } catch {
    // privacy mode — search still works, history just doesn't persist
  }
  emitRecents();
}

const subscribeToNothing = () => () => {};
const onTheClient = () => true;
const onTheServer = () => false;

/** Ids for the combobox wiring; stable so `aria-activedescendant` can name one. */
const LISTBOX_ID = "search-results";
const optionId = (index: number) => `search-result-${index}`;

/* ---------- One product row ---------- */

/**
 * A result row, drawn in the frame's language: the recent-row hairline, a
 * 64px photo in a rounded opening, the name with the matched words bolded,
 * the availability word the filter drawer would use, and the price.
 */
function ResultRow({
  product,
  terms,
  top,
  index,
  active,
  onPick,
  onHover,
}: {
  product: SearchProduct;
  terms: readonly string[];
  top: number;
  index: number;
  active: boolean;
  onPick: () => void;
  onHover: () => void;
}) {
  const runs = highlightRuns(product.shortName, terms);
  return (
    <Link
      href={`/products/${product.handle}`}
      id={optionId(index)}
      role="option"
      aria-selected={active}
      onClick={onPick}
      onPointerMove={onHover}
      style={{
        ...abs(20, top, 390, RESULT_ROW_H),
        display: "block",
        textDecoration: "none",
        // The highlight is a wash rather than a border so the row does not
        // change size — a moving 1px edge under a fast ↓ repeat reads as jitter.
        background: active ? FIELD_BG : "transparent",
        borderRadius: 12,
      }}
    >
      <span
        style={{
          ...abs(0, RESULT_PHOTO_INSET, RESULT_PHOTO, RESULT_PHOTO),
          display: "block",
          borderRadius: 12,
          // Required by spotlightStyle: a zoomed photo is bigger than its box.
          overflow: "hidden",
          background: SAND,
        }}
      >
        {product.image ? (
          <img
            src={product.image}
            alt={product.imageAlt}
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              // Tailwind preflight clamps img to max-width:100%; a zoomed
              // photo is deliberately wider than its opening.
              maxWidth: "none",
              ...spotlightStyle(product.area),
            }}
          />
        ) : null}
      </span>
      <span
        className={playfair.className}
        style={{
          ...abs(76, 18, 196),
          ...txt(15, 20, INK),
          display: "block",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {runs.map((run, i) =>
          run.hit ? (
            <strong key={i} style={{ fontWeight: 700, color: INK }}>
              {run.text}
            </strong>
          ) : (
            <span key={i} style={{ fontWeight: 400 }}>
              {run.text}
            </span>
          ),
        )}
      </span>
      {product.availability ? (
        <span
          style={{
            ...abs(76, 44, 196),
            ...txt(11, 15, INK_SOFT),
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {product.availability}
        </span>
      ) : null}
      <span
        style={{
          ...abs(282, 18, 96),
          ...txt(15, 20, INK, "right"),
          display: "block",
          fontWeight: 500,
        }}
      >
        {product.price}
      </span>
      {product.compareAt ? (
        <span
          style={{
            ...abs(282, 44, 96),
            ...txt(11, 15, MUTED, "right"),
            display: "block",
            textDecoration: "line-through",
          }}
        >
          {product.compareAt}
        </span>
      ) : null}
      <span
        style={{ ...abs(0, RESULT_ROW_H - 1, 390, 1), background: SAND }}
        aria-hidden="true"
      />
    </Link>
  );
}

/* ---------- The overlay ---------- */

export function SearchOverlay({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const mounted = useSyncExternalStore(
    subscribeToNothing,
    onTheClient,
    onTheServer,
  );
  const [value, setValue] = useState("");
  // `peek` means a prefetch that already landed renders on the first frame
  // instead of flashing "Loading gifts…" for nothing.
  const [products, setProducts] = useState<SearchProduct[]>(
    () => peekSearchIndex() ?? [],
  );
  /**
   * Three states, not two. "Nothing matched what you typed" and "we could not
   * load the catalogue" produce the same empty list and must never produce the
   * same sentence — a database outage that reads as "this shop sells nothing"
   * is worse than one that says so.
   */
  const [status, setStatus] = useState<"loading" | "ready" | "failed">(() =>
    peekSearchIndex() ? "ready" : "loading",
  );
  const [active, setActive] = useState(-1);
  const recentsRaw = useSyncExternalStore(
    subscribeRecents,
    recentsSnapshot,
    recentsServerSnapshot,
  );
  const recents = useMemo(() => parseRecents(recentsRaw), [recentsRaw]);
  const inputRef = useRef<HTMLInputElement>(null);

  // The index: one fetch, the first time the panel is opened. `alive` guards
  // the late resolve of a panel the visitor already closed.
  useEffect(() => {
    let alive = true;
    loadSearchIndex()
      .then((list) => {
        if (!alive) return;
        setProducts(list);
        setStatus("ready");
      })
      .catch(() => {
        // The panel still works without an index: recents, trending and Enter
        // all still hand over to /shop, which does its own matching on the
        // server. Only the live preview is gone, and the copy says exactly
        // that rather than reporting an empty shop.
        if (alive) setStatus("failed");
      });
    return () => {
      alive = false;
    };
  }, []);

  // The field takes focus on open so the keyboard is already up on a phone —
  // a search panel that needs a second tap to type in loses the visitor it
  // just interrupted. (The panel is unmounted while closed, so this is also
  // where "a fresh search every time" comes from: there is no state to reset.)
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const typing = value.trim().length > 0;
  const results = useMemo(
    () => searchDocs(products, typing ? value : ""),
    [products, value, typing],
  );
  /** A visitor with history gets it; one without gets the shop itself. */
  const usingRecents = !typing && recents.length > 0;
  /**
   * The products actually drawn. ONE array, because the arrow keys index into
   * it: deriving the keyboard's list separately from the rendered list is how
   * ↓↓Enter opens a product the visitor was not looking at. When nothing
   * matched, the rows are the whole catalogue offered as suggestions — still
   * arrowable, since a suggestion you can see is one you should be able to
   * take.
   */
  const rows = useMemo(() => {
    if (typing) {
      const hits =
        results.mode === "none" ? products : results.hits.map((hit) => hit.doc);
      return hits.slice(0, MAX_RESULT_ROWS);
    }
    if (usingRecents) return [];
    return results.hits.map((hit) => hit.doc).slice(0, MAX_IDLE_ROWS);
  }, [products, results, typing, usingRecents]);

  const remember = useCallback(
    (term: string) => {
      const cleaned = term.trim();
      if (!cleaned) return;
      writeRecents([
        cleaned,
        ...recents.filter((t) => t.toLowerCase() !== cleaned.toLowerCase()),
      ]);

      // Search analytics (storefront-search.md OQ-1). THIS is the one funnel
      // every submit passes through — Enter, a trending chip, a recent row and
      // tapping a result all reach it — which is what keeps the log to
      // submitted searches and off every keystroke. Recording at the four call
      // sites instead would be four chances to forget.
      //
      // The engine is re-run for `cleaned` rather than reusing `results`: a
      // chip and a recent row submit a term that is NOT what is in the field,
      // so reusing the typed result would file that tap under the result count
      // of an empty box. It is one extra pass over the same small index the
      // panel already searches on every keystroke.
      const outcome = searchDocs(products, cleaned);
      recordSearchQuery({
        raw: cleaned,
        normalized: normalizeSearchText(cleaned),
        resultCount: outcome.hits.length,
        // "all" cannot occur — `cleaned` is non-empty by the guard above — but
        // it is narrowed rather than cast, so a future engine change fails the
        // typecheck here instead of the CHECK constraint in production.
        mode: outcome.mode === "all" ? "exact" : outcome.mode,
        facets: outcome.facets,
      });
    },
    [products, recents],
  );

  const submit = useCallback(
    (term: string) => {
      const cleaned = term.trim();
      if (!cleaned) return;
      remember(cleaned);
      onClose();
      router.push(`/shop?q=${encodeURIComponent(cleaned)}`);
    },
    [onClose, remember, router],
  );

  /** Tapping a product records the search that found it, then leaves. */
  const pick = useCallback(() => {
    remember(value);
    onClose();
  }, [onClose, remember, value]);

  function removeRecent(term: string) {
    writeRecents(recents.filter((t) => t !== term));
  }

  // The page behind must not scroll while the overlay is up. Kept in its OWN
  // effect with no dependencies: folded into the Escape effect below it would
  // re-run per keystroke, capture its own "hidden" as the value to restore,
  // and leave the document permanently locked after the panel closed.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Escape is handled in ONE place, on the document. A second handler on the
  // field could not cooperate with it: React's listener and this one both sit
  // on `document`, and stopPropagation does not stop a sibling listener on the
  // same node — the panel would clear the field and close on one keypress.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // A shopper midway through a wrong word wants the word gone, not the
      // search: Escape clears first and only closes an already-empty field.
      if (value) {
        setValue("");
        setActive(-1);
        return;
      }
      onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [value, onClose]);

  /** ↑/↓ move the highlight through `rows`; Enter takes the highlighted one. */
  function onFieldKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    // While an IME is open, these keys belong to the IME: Enter commits the
    // candidate and the arrows move through it. Acting on them here would
    // send a shopper typing 玫瑰 to a product page instead of finishing their
    // word. The panel ships Noto Sans SC, so this is not hypothetical.
    if (event.nativeEvent.isComposing) return;
    if (rows.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current) => (current + 1) % rows.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => (current <= 0 ? rows.length - 1 : current - 1));
    } else if (event.key === "Enter" && active >= 0 && active < rows.length) {
      event.preventDefault();
      const product = rows[active];
      pick();
      router.push(`/products/${product.handle}`);
    }
  }

  /* ---------- Geometry: every panel states where it ends ---------- */

  const idleRows = usingRecents ? Math.min(recents.length, MAX_SHOWN) : 0;
  const contentBottom = typing
    ? listBottom(LIST_TOP, rows.length) + FOOTER_GAP + FOOTER_H
    : usingRecents
      ? listBottom(RECENTS_TOP, idleRows, RECENT_PITCH, RECENT_H)
      : listBottom(RECENTS_TOP, rows.length);
  const height = stageHeight(contentBottom);
  const ratio = wrapRatio(height);

  const found = results.hits.length;
  /** True when the panel is already showing everything that matched. */
  const showingAll = found <= rows.length;

  /** The line under the heading, or "" when the result speaks for itself. */
  const note =
    status === "failed"
      ? "We could not load the catalogue. Press enter to search the shop instead."
      : status === "loading"
        ? ""
        : results.mode === "none"
          ? "Nothing matches those words — here is the whole collection."
          : results.mode === "relaxed"
            ? "The closest gifts we have."
            : "";

  /**
   * What the screen reader is told after each keystroke. Silent until the
   * index has actually answered: announcing "no gifts match" while the
   * catalogue is still in flight tells a shopper the opposite of the truth.
   */
  const announcement =
    !typing || status !== "ready"
      ? ""
      : results.mode === "none"
        ? `No gifts match “${value.trim()}”.`
        : `${found} ${found === 1 ? "gift matches" : "gifts match"} “${value.trim()}”.`;

  if (!mounted) return null;
  return createPortal(
    <div
      className={`figv-searchfix ${notoSC.className}`}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <style>{`
        .figv-searchfix { position: fixed; inset: 0; z-index: 40; background: ${CREAM}; overflow-y: auto; overflow-x: hidden; overscroll-behavior: contain; }
        .figv-searchwrap { height: ${height}px; }
        .figv-searchstage { position: relative; width: ${STAGE_WIDTH}px; height: ${height}px; left: calc((100% - ${STAGE_WIDTH}px) / 2); }
        /* WebKit draws its own cancel × inside type="search"; the frame has no
        such control and 1523:3270 is already the clear affordance. */
        .figv-searchinput::-webkit-search-cancel-button,
        .figv-searchinput::-webkit-search-decoration { -webkit-appearance: none; appearance: none; display: none; }
        @supports (transform: scale(calc(100vw / ${STAGE_WIDTH}px))) {
          .figv-searchwrap { height: calc(min(100vw, 480px) * ${ratio}); }
          .figv-searchstage { transform: scale(calc(min(100vw, 480px) / ${STAGE_WIDTH}px)); transform-origin: top center; }
        }
      `}</style>
      <div className="figv-searchwrap">
        <div className="figv-searchstage">
          {/* 1523:3307 SHOP-HEADER — the 07-29 header block (its frame sits at
          x-11 in the sheet; the children below are at their own absolute
          boxes). It replaces the 07-27 "Search" title and "Close" text
          button: closing now lives on the back chevron (and Escape). */}
          {/* 1523:3308 back chevron — an image-fill rectangle, retina PNG at the
          sheet's 40×43 box; tapping it closes the overlay. */}
          <button
            type="button"
            aria-label="Back"
            onClick={onClose}
            style={{
              ...abs(10.5, 9.5, 40, 43),
              border: 0,
              padding: 0,
              background: "transparent",
              cursor: "pointer",
            }}
          >
            <img
              src="/eldreve/screens/1523-3308.png"
              alt=""
              style={{ display: "block", width: 40, height: 43 }}
            />
          </button>
          {/* 1523:3309 brand wordmark image — the ELDREVE mark, shipped
          pixel-exact (the dialog keeps its "Search" aria-label). */}
          <img
            src="/eldreve/brand/eldreve-136x40.png"
            alt="ELDREVE"
            width={136}
            height={40}
            style={{ ...abs(147, 11, 136, 40), display: "block" }}
          />

          {/* 1523:3267 input capsule */}
          <div
            style={{
              ...abs(20, 65, 390, 58),
              background: FIELD_BG,
              boxShadow: `inset 0 0 0 1px ${SAND}`,
              borderRadius: 28,
            }}
          />
          {/* 1523:3268 ⌕ — 26px/30 line box; the sheet's collapsed 10px text-box
          heights don't position the ink, the line box does (07-27 treatment). */}
          <Glyph src="1523-3268" x={36} y={76} w={34} h={30} ink={[14, 15]} />
          <form
            style={abs(80, 80, 250, 30)}
            onSubmit={(event) => {
              event.preventDefault();
              // Same IME rule as the key handler: the Enter that commits a
              // candidate must not also submit the half-typed word.
              if (
                (event.nativeEvent as SubmitEvent & { isComposing?: boolean })
                  .isComposing
              ) {
                return;
              }
              submit(value);
            }}
          >
            <input
              ref={inputRef}
              className="figv-searchinput"
              type="search"
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                // A new query means the old highlight names a different
                // product; nothing is preselected until ↓ is pressed.
                setActive(-1);
              }}
              onKeyDown={onFieldKeyDown}
              aria-label="Search products, occasions, or recipients"
              role="combobox"
              // Both of these name the listbox, which only exists when there
              // are rows to put in it — the idle panel with recent searches
              // has none. An aria-controls pointing at nothing is a promise
              // to a screen reader that the page does not keep.
              aria-expanded={rows.length > 0}
              aria-controls={rows.length > 0 ? LISTBOX_ID : undefined}
              aria-autocomplete="list"
              // Clamped against the RENDERED list, not just against -1: the
              // index can finish loading and change `rows` under a highlight
              // no keystroke reset, and naming an id that is not on the page
              // tells a screen reader to announce nothing at all.
              aria-activedescendant={
                active >= 0 && active < rows.length
                  ? optionId(active)
                  : undefined
              }
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="search"
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
          {/* 1523:3270 — named SEARCH-HEADER-INPUT-CLOSE-BTN in the sheet, kept
          as the clear-input affordance (see the deviations note above). */}
          {value ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setValue("");
                setActive(-1);
                inputRef.current?.focus();
              }}
              style={{
                ...abs(354, 74, 40, 40),
                background: "#F7F2ED",
                borderRadius: 20,
                border: 0,
                padding: 0,
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 7,
                  ...txt(22, 24, INK, "center"),
                }}
              >
                ×
              </span>
            </button>
          ) : null}
          {/* 1523:3272 hint */}
          <div style={{ ...abs(28, 137, 374), ...txt(11, 15, INK, "center") }}>
            Search products, occasions, or
            recipients&nbsp;&nbsp;·&nbsp;&nbsp;Press enter to search
          </div>

          {/* Live count, for screen readers only. Always mounted with a stable
          id so the announcement is a text change, not a new region. */}
          <div
            id="search-status"
            role="status"
            aria-live="polite"
            style={{
              position: "absolute",
              width: 1,
              height: 1,
              overflow: "hidden",
              clip: "rect(0 0 0 0)",
              whiteSpace: "nowrap",
            }}
          >
            {announcement}
          </div>

          {typing ? (
            /* ---------- Results ---------- */
            <>
              <div
                className={playfair.className}
                style={{
                  ...abs(20, SECTION_HEADING_TOP, 390),
                  ...txt(25, 30, INK),
                  fontWeight: 600,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {status === "loading"
                  ? "Searching…"
                  : status === "failed"
                    ? "Search is unavailable"
                    : results.mode === "none"
                      ? "No exact match"
                      : `${found} ${found === 1 ? "Gift" : "Gifts"}`}
              </div>
              {/* The engine says which reading it used, so the panel can admit
              a loose match instead of passing it off as an exact one. Nothing
              is said for an exact match, and nothing for "all" — a query of
              pure stop words ("gifts for the") is answered with the whole
              shop, which is right, but it is not a CLOSE match. */}
              {note ? (
                <div
                  style={{
                    ...abs(20, 213, 390),
                    ...txt(11, 15, INK_SOFT),
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {note}
                </div>
              ) : null}
              <div
                id={LISTBOX_ID}
                role="listbox"
                aria-label="Search results"
                style={abs(0, 0, STAGE_WIDTH, 0)}
              >
                {rows.map((product, i) => (
                  <ResultRow
                    key={product.handle}
                    product={product}
                    terms={results.terms}
                    top={rowTop(LIST_TOP, i)}
                    index={i}
                    active={i === active}
                    onPick={pick}
                    onHover={() => setActive(i)}
                  />
                ))}
              </div>
              {/* The panel shows the best few; /shop is the page built to show
              a grid, and it runs the same engine on the same words. When
              nothing matched there is no query worth carrying over, so the
              button offers the shop itself rather than a /shop?q= that would
              land on the same emptiness. */}
              {/* Only "nothing matched" drops the query. While the index is
                  still loading, or after it failed, the shopper's words are
                  the one thing we do have — carrying them to /shop, which
                  matches on the SERVER, is the whole fallback. */}
              <button
                type="button"
                onClick={() => {
                  if (status === "ready" && results.mode === "none") {
                    onClose();
                    router.push("/shop");
                    return;
                  }
                  submit(value);
                }}
                className={playfair.className}
                style={{
                  ...abs(
                    20,
                    listBottom(LIST_TOP, rows.length) + FOOTER_GAP,
                    390,
                    FOOTER_H,
                  ),
                  background: FIELD_BG,
                  boxShadow: `inset 0 0 0 1px ${SAND}`,
                  borderRadius: 24,
                  border: 0,
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: 12,
                    right: 12,
                    top: 15,
                    ...txt(14, 18, GOLD, "center"),
                    display: "block",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {/* "See all 1 gift" under a list of one is noise. The
                      count is worth saying only when there is more to see. */}
                  {status !== "ready"
                    ? "Search in the shop"
                    : results.mode === "none"
                      ? "Browse all gifts"
                      : showingAll
                        ? "Open in the shop"
                        : `See all ${found} gifts`}
                </span>
              </button>
            </>
          ) : (
            /* ---------- Idle: the imported frame, unchanged ---------- */
            <>
              {/* 1523:3273 trending */}
              <div
                className={playfair.className}
                style={{
                  ...abs(20, 181, 390),
                  ...txt(25, 30, INK),
                  fontWeight: 600,
                }}
              >
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
                    <Glyph
                      src={chip.svg.id}
                      x={chip.svg.textX - chip.x}
                      y={11}
                      w={chip.svg.textW}
                      h={16}
                      ink={chip.svg.ink}
                    />
                  ) : (
                    <span
                      className={playfair.className}
                      style={{
                        position: "absolute",
                        left: 8,
                        right: 8,
                        top: 11,
                        ...txt(12, 16, INK, "center"),
                        fontWeight: 500,
                      }}
                    >
                      {chip.label}
                    </span>
                  )}
                </button>
              ))}

              {/* 1523:3284 separator */}
              <div style={{ ...abs(20, 351, 390, 1), background: SAND }} />

              {/* 1523:3285 recent searches (real history) — or, for a visitor
              with none, the shop itself: the frame's own answer to an empty
              history was a dead half-panel. */}
              <div
                className={playfair.className}
                style={{
                  ...abs(20, RECENTS_HEADING_TOP, 260),
                  ...txt(25, 30, INK),
                  fontWeight: 600,
                }}
              >
                {usingRecents ? "Recent Searches" : "All Gifts"}
              </div>
              {/* 1523:3286 Clear all */}
              {usingRecents ? (
                <button
                  type="button"
                  onClick={() => writeRecents([])}
                  className={playfair.className}
                  style={{
                    ...abs(326, 389, 84, 18),
                    border: 0,
                    padding: 0,
                    background: "transparent",
                    cursor: "pointer",
                  }}
                >
                  <span
                    style={{
                      ...txt(14, 18, GOLD, "right"),
                      display: "block",
                    }}
                  >
                    Clear all
                  </span>
                </button>
              ) : null}
              {usingRecents ? (
                /* 1523:3287 … 1523:3306 — the four mock rows' geometry, on a
                     58px pitch */
                recents.slice(0, MAX_SHOWN).map((term, i) => {
                  const y = rowTop(RECENTS_TOP, i, RECENT_PITCH);
                  return (
                    <div key={term} style={abs(20, y, 390, 50)}>
                      <Glyph
                        src="1523-3288"
                        x={0}
                        y={12}
                        w={30}
                        h={22}
                        ink={[13, 13]}
                      />
                      <button
                        type="button"
                        onClick={() => submit(term)}
                        className={playfair.className}
                        style={{
                          ...abs(42, 12, 300, 26),
                          border: 0,
                          padding: 0,
                          background: "transparent",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <span
                          style={{
                            ...txt(15, 20, INK),
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {term}
                        </span>
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove “${term}” from recent searches`}
                        onClick={() => removeRecent(term)}
                        style={{
                          ...abs(354, 8, 30, 30),
                          border: 0,
                          padding: 0,
                          background: "transparent",
                          cursor: "pointer",
                        }}
                      >
                        <span
                          style={{
                            ...txt(20, 22, INK, "center"),
                            display: "block",
                            marginTop: 3,
                          }}
                        >
                          ×
                        </span>
                      </button>
                      <div
                        style={{ ...abs(0, 49, 390, 1), background: SAND }}
                      />
                    </div>
                  );
                })
              ) : (
                /* The same listbox as the results panel, with the same id and
                     the same option ids. It is arrow-navigable — so it MUST be
                     announced: rendering these rows outside a listbox left the
                     input's aria-activedescendant naming ids that were not in
                     the document, which tells a screen reader nothing at all
                     while a sighted visitor watches the highlight move. */
                <div
                  id={LISTBOX_ID}
                  role="listbox"
                  aria-label="All gifts"
                  style={abs(0, 0, STAGE_WIDTH, 0)}
                >
                  {rows.map((product, i) => (
                    <ResultRow
                      key={product.handle}
                      product={product}
                      terms={[]}
                      top={rowTop(RECENTS_TOP, i)}
                      index={i}
                      active={i === active}
                      onPick={pick}
                      onHover={() => setActive(i)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
          {/* The 07-27 footer ("Your search history is private and secure.") is
          not in the 07-29 frame — removed. */}
        </div>
      </div>
      <NoCalcScale
        base={STAGE_WIDTH}
        stage=".figv-searchstage"
        origin="top center"
        wrap=".figv-searchwrap"
        height={height}
      />
    </div>,
    document.body,
  );
}
