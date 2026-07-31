"use client";

/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * The gift-reminder edit bottom sheet of /account/reminders — the modal band
 * of "…reminders · edit open" (1599:245, delivered 2026-08 batch). Opened by
 * the reminders list's "Add reminder" button and each card's "Edit" control;
 * before this it was an inert placeholder.
 *
 * Behaviour is the design team's spec, confirmed by the owner in the Figma
 * comment thread (nodes 1599:245): this is an **information-storage modal with
 * no navigation / no jump page** — Cancel (and ×, and the dim area) discards
 * the entered info and returns to the defaults; Save closes it. There is no
 * reminders backend, so the fields show the mock's values and the email/SMS
 * toggles flip visually, resetting to defaults (email on, SMS off) each time
 * the sheet opens. The number-stepper / unit-dropdown / date-picker
 * interactions are still open design questions in the same threads, so those
 * fields ship as pixel-exact static controls for now.
 *
 * The exotic Noto glyphs (▣ ✉ ▤ and the ⌃⌄ ⌄ chevrons) are Figma's own SVG
 * text exports, placed left-aligned in their node boxes (they crop to ink).
 * Portalled to <body> and bottom-anchored — ScaleFrame's transform would
 * otherwise swallow position:fixed (the TrackReturnSheet pattern).
 */

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";

const A = "/veloria/screens";
const INK = "#3A2E2E";
const SAND = "#E4D9C8"; // field / card inside-stroke
const CARD = "#FFFDFB"; // sheet + field fill (also the toggle knob)
const CREAM2 = "#FFF6EB"; // cancel fill / save label
const ROSE = "#DB596B"; // active toggle + Save
const GREY_OFF = "#E4E7EC"; // inactive toggle track
const DIVIDER = "#DBCCBA";

const STAGE_H = 932;
const SHEET_H = 548;
const SHEET_TOP = STAGE_H - SHEET_H; // bottom-anchored

// SSR-safe mounted detection for the portal (the TrackReturnSheet pattern).
const subscribeToNothing = () => () => {};
const onTheClient = () => true;
const onTheServer = () => false;

/** A pill toggle (48×20) with a 16×16 knob; on = rose track, knob right. */
function Toggle({
  x,
  y,
  on,
  onFlip,
  label,
}: {
  x: number;
  y: number;
  on: boolean;
  onFlip: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onFlip}
      style={{
        ...abs(x, y, 48, 20),
        background: on ? ROSE : GREY_OFF,
        borderRadius: 10,
        border: 0,
        padding: 0,
        cursor: "pointer",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: on ? 28 : 4,
          width: 16,
          height: 16,
          background: CARD,
          borderRadius: 8,
          display: "block",
          transition: "left 120ms ease",
        }}
      />
    </button>
  );
}

/** A left-aligned, ink-cropped SVG text export placed in its node box. */
function GlyphText({
  src,
  x,
  y,
  w,
  h,
}: {
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
}) {
  return (
    <img
      src={`${A}/${src}.svg`}
      alt=""
      style={{
        ...abs(x, y, w, h),
        objectFit: "none",
        objectPosition: "left center",
        display: "block",
      }}
    />
  );
}

/** A labelled input field box (fill + inside stroke + radius). */
function field(x: number, y: number, w: number): React.CSSProperties {
  return {
    ...abs(x, y, w, 42),
    background: CARD,
    boxShadow: `inset 0 0 0 1px ${SAND}`,
    borderRadius: 10,
  };
}

export function ReminderEditModal({
  open,
  mode = "edit",
  onClose,
}: {
  open: boolean;
  /** "edit" reuses the frame verbatim; "add" only swaps the title. */
  mode?: "edit" | "add";
  onClose: () => void;
}) {
  const mounted = useSyncExternalStore(
    subscribeToNothing,
    onTheClient,
    onTheServer,
  );

  // Defaults are the frame's mock state. The parent keys this component by its
  // open mode, so each open remounts fresh — Cancel and Save both just close,
  // and nothing persists ("return to defaults"), no reset effect needed.
  const [emailOn, setEmailOn] = useState(true);
  const [smsOn, setSmsOn] = useState(false);

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
        .figv-reminderstage { position: fixed; bottom: 0; width: 430px; height: 932px; left: calc((100% - 430px) / 2); z-index: 40; }
        @media (max-width: 480px) {
          .figv-reminderstage { transform: scale(calc(min(100vw, 480px) / 430px)); transform-origin: bottom center; }
        }
      `}</style>
      <div className={`figv-reminderstage ${notoSC.className}`}>
        {/* dim overlay — tapping it discards and closes */}
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          style={{
            ...abs(0, 0, 430, 932),
            background: "rgba(15,14,13,0.64)",
            border: 0,
            padding: 0,
            cursor: "pointer",
            display: "block",
          }}
        />

        {/* the sheet (#FFFDFB, top corners 16) */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label={mode === "add" ? "Add reminder" : "Edit reminder"}
          style={{
            ...abs(0, SHEET_TOP, 430, SHEET_H),
            background: CARD,
            boxShadow: `inset 0 0 0 1px ${SAND}`,
            borderRadius: "16px 16px 0 0",
            overflow: "hidden",
          }}
        >
          {/* title + subtitle + close */}
          <div
            className={playfair.className}
            style={{
              ...abs(8, 24, 414),
              ...txt(24, 32, INK, "center"),
              fontWeight: 600,
            }}
          >
            {mode === "add" ? "Add reminder" : "Edit reminder"}
          </div>
          <div style={{ ...abs(0, 61, 430), ...txt(11, 13.2, INK, "center") }}>
            Update the date and notification settings.
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            style={{
              ...abs(388, 12, 28, 34),
              ...txt(28, 34, INK, "center"),
              background: "transparent",
              border: 0,
              padding: 0,
              cursor: "pointer",
            }}
          >
            ×
          </button>

          {/* reminder name */}
          <div style={{ ...abs(18, 92, 82), ...txt(11, 13.2, INK) }}>
            Reminder name
          </div>
          <div style={field(18, 114, 398)} />
          <div style={{ ...abs(30, 126, 300), ...txt(12, 14.4, INK) }}>
            Anniversary with Emma
          </div>

          {/* date */}
          <div style={{ ...abs(18, 168, 40), ...txt(11, 13.2, INK) }}>Date</div>
          <div style={field(18, 190, 398)} />
          <GlyphText
            src="reminders-edit-date-icon"
            x={30}
            y={199}
            w={16}
            h={19}
          />
          <div style={{ ...abs(60, 202, 120), ...txt(12, 14.4, INK) }}>
            Aug 25, 2025
          </div>

          {/* lead time */}
          <div style={{ ...abs(18, 244, 70), ...txt(11, 13.2, INK) }}>
            Remind me
          </div>
          <div style={field(18, 266, 159)} />
          <GlyphText
            src="reminders-edit-lead-number"
            x={30}
            y={278}
            w={38}
            h={14}
          />
          <div style={field(193, 266, 223)} />
          <GlyphText
            src="reminders-edit-lead-unit"
            x={205}
            y={278}
            w={93}
            h={14}
          />
          <div style={{ ...abs(18, 314, 300), ...txt(9, 10.8, INK) }}>
            Choose how long before the date to be reminded.
          </div>

          {/* notify by */}
          <div style={{ ...abs(18, 336, 90), ...txt(11, 13.2, INK) }}>
            Notify me by
          </div>
          <div
            style={{
              ...abs(18, 356, 398, 80),
              background: CARD,
              boxShadow: `inset 0 0 0 1px ${SAND}`,
              borderRadius: 10,
            }}
          />
          {/* ✉ reuses the reminders page's frame-render crop — it SVG-exports
              as a .notdef box (C-2 precedent), so "Email" is separate text. */}
          <img
            src={`${A}/1523-3523.png`}
            alt=""
            style={{ ...abs(30, 369, 17, 11), display: "block" }}
          />
          <div style={{ ...abs(50, 367, 60), ...txt(12, 14.4, INK) }}>
            Email
          </div>
          <Toggle
            x={358}
            y={368}
            on={emailOn}
            onFlip={() => setEmailOn((v) => !v)}
            label="Email reminders"
          />
          <div style={{ ...abs(18, 396, 398, 1), background: DIVIDER }} />
          <GlyphText
            src="reminders-edit-sms-label"
            x={30}
            y={407}
            w={45}
            h={14}
          />
          <Toggle
            x={358}
            y={408}
            on={smsOn}
            onFlip={() => setSmsOn((v) => !v)}
            label="SMS reminders"
          />
          <div style={{ ...abs(18, 442, 398), ...txt(9, 10.8, INK) }}>
            We’ll send a reminder using your selected methods.
          </div>

          {/* Cancel (discard → default) / Save (close) */}
          <button
            type="button"
            onClick={onClose}
            style={{
              ...abs(18, 466, 187, 40),
              background: CREAM2,
              boxShadow: `inset 0 0 0 1px ${SAND}`,
              borderRadius: 10,
              border: 0,
              cursor: "pointer",
              ...txt(12, 40, INK, "center"),
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              ...abs(220, 466, 196, 40),
              background: ROSE,
              borderRadius: 10,
              border: 0,
              cursor: "pointer",
              ...txt(12, 40, CREAM2, "center"),
              fontWeight: 500,
            }}
          >
            Save
          </button>

          {/* Delete reminder — inert placeholder (no reminders backend) */}
          <div
            style={{ ...abs(18, 520, 398), ...txt(11, 13.2, INK, "center") }}
          >
            Delete reminder
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
