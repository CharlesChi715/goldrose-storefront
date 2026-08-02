"use client";

/**
 * ROLE OF THIS FILE
 * The SELECT-RETURN-REASON bottom sheet (2047:194, AFTER-SALES batch,
 * imported 2026-08-02). Not a route: an overlay opened by Start Return on
 * /account/returns and by Change › on /account/returns/add-photos. Ten
 * radio reasons with live visual selection (default: Item arrived damaged);
 * Continue navigates to /account/returns/add-photos?reason=<slug>. Escape,
 * the dim area and nothing else close it — the frame draws no × control.
 * Portalled to <body> and bottom-anchored (the ReminderEditModal stage
 * pattern — ScaleFrame's transform would swallow position:fixed). All copy,
 * geometry and colors verbatim from the Figma REST data; the radios are
 * plain CSS circles (the frame uses flat ellipses, no exported art).
 */

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";

const SHEET_BG = "#FFFEFC";
const SHEET_STROKE = "#E9DFD3";
const NUMBER_GOLD = "#D17D05"; // option numbers
const RADIO_GOLD = "#D68B00"; // selected radio disc
const RADIO_DOT = "#FFF9F1"; // selected radio inner dot
const RADIO_RING = "#24201D"; // unselected radio ring
const LABEL_INK = "#1F1A17";
const DIVIDER = "#EDE3D4";
const BUTTON_INK = "#271F1B";
const BUTTON_LABEL = "#FFFAF2";

const STAGE_H = 932;
const SHEET_H = 538;
const SHEET_TOP = STAGE_H - SHEET_H; // bottom-anchored

// SSR-safe mounted detection for the portal (the ReminderEditModal pattern).
const subscribeToNothing = () => () => {};
const onTheClient = () => true;
const onTheServer = () => false;

/**
 * The frame's ten reasons (2047:198…234), verbatim copy. The slug is ours —
 * it rides the ?reason= query so /account/returns/add-photos can echo the
 * picked reason without a backend.
 */
export const RETURN_REASONS = [
  { slug: "item-arrived-damaged", label: "Item arrived damaged" },
  { slug: "quality-issue", label: "Item has a quality issue" },
  { slug: "wrong-item", label: "Received the wrong item" },
  { slug: "missing-parts", label: "Missing parts or packaging" },
  { slug: "not-as-described", label: "Item was not as described" },
  { slug: "arrived-too-late", label: "Arrived too late" },
  { slug: "gift-not-wanted", label: "Gift recipient didn’t want it" },
  { slug: "ordered-by-mistake", label: "Ordered by mistake" },
  { slug: "changed-mind", label: "No longer needed / Changed my mind" },
  { slug: "other", label: "Other" },
] as const;

/**
 * Resolve a ?reason= slug to its display label; unknown or missing slugs
 * fall back to the frames' default, "Item arrived damaged".
 *
 * @param slug The ?reason= query value, if any.
 * @returns The matching reason label.
 */
export function reasonLabel(slug?: string): string {
  return (
    RETURN_REASONS.find((reason) => reason.slug === slug)?.label ??
    RETURN_REASONS[0].label
  );
}

export function ReturnReasonSheet({
  open,
  initialSlug,
  onClose,
}: {
  open: boolean;
  /** Preselects the row matching this slug (add-photos' Change ›). */
  initialSlug?: string;
  onClose: () => void;
}) {
  const mounted = useSyncExternalStore(
    subscribeToNothing,
    onTheClient,
    onTheServer,
  );

  const initialIndex = Math.max(
    RETURN_REASONS.findIndex((reason) => reason.slug === initialSlug),
    0,
  );
  const [selected, setSelected] = useState(initialIndex);

  // Each open starts from the caller's current reason (or the default) —
  // the render-time previous-state adjustment, not an effect.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setSelected(initialIndex);
  }

  // Escape closes; the page behind must not scroll while the sheet is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <>
      <style>{`
        .figv-returnreasonstage { position: fixed; bottom: 0; width: 430px; height: 932px; left: calc((100% - 430px) / 2); z-index: 40; }
        @media (max-width: 480px) {
          .figv-returnreasonstage { transform: scale(calc(min(100vw, 480px) / 430px)); transform-origin: bottom center; }
        }
      `}</style>
      <div className={`figv-returnreasonstage ${notoSC.className}`}>
        {/* dim overlay — tapping it closes without changing the reason */}
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          style={{
            ...abs(0, 0, 430, STAGE_H),
            background: "rgba(15,14,13,0.64)",
            border: 0,
            padding: 0,
            cursor: "pointer",
            display: "block",
          }}
        />

        {/* the sheet — 2047:194: #FFFEFC, 1px inside-stroke, radius 14 */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Select return reason"
          className={playfair.className}
          style={{
            ...abs(0, SHEET_TOP, 430, SHEET_H),
            background: SHEET_BG,
            boxShadow: `inset 0 0 0 1px ${SHEET_STROKE}`,
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          {/* 43px option rows from y9; radio (14,+2) 20×20, number (46,0)
              30 wide, label (88,0), divider (74,+33) on all but the last */}
          <div role="radiogroup" aria-label="Return reason">
            {RETURN_REASONS.map((reason, i) => {
              const top = 9 + i * 43;
              const isSelected = selected === i;
              return (
                <button
                  key={reason.slug}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelected(i)}
                  style={{
                    ...abs(0, top, 430, 43),
                    background: "transparent",
                    border: 0,
                    padding: 0,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      ...abs(14, 2, 20, 20),
                      borderRadius: 10,
                      display: "block",
                      ...(isSelected
                        ? { background: RADIO_GOLD }
                        : {
                            background: SHEET_BG,
                            boxShadow: `inset 0 0 0 1.5px ${RADIO_RING}`,
                          }),
                    }}
                  />
                  {isSelected ? (
                    <span
                      style={{
                        ...abs(20, 8, 8, 8),
                        borderRadius: 4,
                        background: RADIO_DOT,
                        display: "block",
                      }}
                    />
                  ) : null}
                  <span
                    style={{
                      ...abs(46, 0, 30),
                      ...txt(14, 18.7, NUMBER_GOLD, "center"),
                      fontWeight: 500,
                      display: "block",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span
                    style={{
                      ...abs(88, 0, 266),
                      ...txt(13, 17.3, LABEL_INK),
                      fontWeight: 500,
                      display: "block",
                    }}
                  >
                    {reason.label}
                  </span>
                  {i < RETURN_REASONS.length - 1 ? (
                    <span
                      style={{
                        ...abs(74, 33, 286, 1),
                        background: DIVIDER,
                        display: "block",
                      }}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* 2047:235 Continue → add-photos with the picked reason */}
          <Link
            href={`/account/returns/add-photos?reason=${RETURN_REASONS[selected].slug}`}
            onClick={onClose}
            style={{
              ...abs(22, 460, 386, 56),
              background: BUTTON_INK,
              borderRadius: 12,
              display: "block",
            }}
          >
            <span
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 14,
                ...txt(19, 25.3, BUTTON_LABEL, "center"),
                fontWeight: 500,
              }}
            >
              Continue
            </span>
          </Link>
        </div>
      </div>
    </>,
    document.body,
  );
}
