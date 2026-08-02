"use client";

/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * The gift-reminder edit bottom sheet of /account/reminders — the modal band
 * of "…reminders · edit open" (1599:245; re-imported 2026-08-02 at 430×589
 * after the me三级 section was re-marked Ready-for-dev with the date-picker
 * work). Opened by the reminders list's "Add reminder" button and each card's
 * "Edit" control.
 *
 * Behaviour is the design team's spec, confirmed by the owner in the Figma
 * comment threads on 1599:245: an **information-storage modal with no
 * navigation** — Cancel (and ×, and the dim area) discards the entered info
 * and returns to the defaults; Save closes it. There is no reminders backend,
 * so nothing persists.
 *
 * The 08-01/08-02 delivery resolved the date-field question: the single date
 * row became three dropdown fields (2052:202/207/212) whose menus are the
 * DATE-FIELD-*-DROPDOWN-MENU frames (2053:183/207/193) — Playfair options,
 * dark #493026 selected pill, scrolling list. They are live selection
 * controls here (visual only; the chosen date goes nowhere without a
 * backend). The drawn day menu shows the 20–31 scroll window and the team's
 * open question asks dev to supply the full ranges, so days run 1–31 and
 * months Jan–Dec; years keep the drawn 2027→2020 list.
 *
 * Still static by design: the lead-time NUMBER (its chevron frame 2024:372 is
 * an empty stub — selection UI not delivered yet) and the UNIT, which the
 * team pinned as a fixed value ("这个先设定为固定值，不能修改", 08-01).
 * "Delete reminder" stays an inert caption (no backend, no designed target).
 *
 * The ✉ glyph SVG-exports as a `.notdef` box (C-2 precedent) so it reuses the
 * reminders page's frame-render crop; ▤ is the existing SVG text export.
 * Portalled to <body> and bottom-anchored — ScaleFrame's transform would
 * otherwise swallow position:fixed (the TrackReturnSheet pattern).
 */

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";

const A = "/veloria/screens";
const INK = "#3B2F2F";
const SAND = "#E5D9C9"; // field / card inside-stroke
const CARD = "#FFFEFB"; // sheet + field fill
const CREAM2 = "#FFF6EC"; // cancel fill / save label
const ROSE = "#DB596B"; // active toggle + Save
const GREY_OFF = "#E4E8ED"; // inactive toggle track
const DIVIDER = "rgba(219,204,186,0.75)";
// Date dropdown fields (2052:202/207/212)
const FIELD_BG = "#FFFEFC";
const FIELD_STROKE = "#DFD0BE";
const FIELD_STROKE_OPEN = "#A9815C";
const LABEL_GREY = "#6B696E";
const VALUE_INK = "#261F1A";
// Dropdown menus (2053:183/207/193)
const MENU_STROKE = "#E3D6C7";
const MENU_SHADOW = "0 6px 14px rgba(36,26,18,0.14)";
const PILL = "#493026";
const PILL_TEXT = "#FFF9F2";
const OPTION_INK = "#2A211D";

const STAGE_H = 932;
const SHEET_H = 589;
const SHEET_TOP = STAGE_H - SHEET_H; // bottom-anchored

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
// The drawn year menu runs 2027 down to 2020 (2053:183) — kept verbatim.
const YEARS = ["2027", "2026", "2025", "2024", "2023", "2022", "2021", "2020"];
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));

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
          background: "#FFFEFB",
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

/**
 * One Date dropdown field (126×77) plus its floating menu. The pill/label
 * geometry is the 2052/2053 frames' own: label at +14,+14, Playfair value at
 * +14,+43, chevron export at +96,+36; menu below the field, 126 wide,
 * options at x16 on the drawn pitch, selected pill 116 wide at x5, r7.
 */
function DateDropdown({
  x,
  label,
  options,
  value,
  open,
  onToggle,
  onPick,
  pitch,
  pillH,
  menuMaxH,
}: {
  x: number;
  label: string;
  options: string[];
  value: string;
  open: boolean;
  onToggle: () => void;
  onPick: (v: string) => void;
  /** Row pitch of the drawn menu: 38 for the year list, 29 for month/day. */
  pitch: number;
  pillH: number;
  menuMaxH: number;
}) {
  const Y = 193;
  const listRef = useRef<HTMLDivElement | null>(null);

  // Scroll the selected option into view when the menu opens.
  useEffect(() => {
    if (!open || !listRef.current) return;
    const idx = options.indexOf(value);
    if (idx < 0) return;
    const target = 12 + idx * pitch - (menuMaxH - pitch) / 2;
    listRef.current.scrollTop = Math.max(0, target);
  }, [open, options, value, pitch, menuMaxH]);

  const contentH = 12 * 2 + options.length * pitch - (pitch - pillH);
  return (
    <>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={onToggle}
        style={{
          ...abs(x, Y, 126, 77),
          background: FIELD_BG,
          boxShadow: `inset 0 0 0 ${open ? 1.6 : 1.4}px ${
            open ? FIELD_STROKE_OPEN : FIELD_STROKE
          }`,
          borderRadius: 14,
          border: 0,
          padding: 0,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span
          style={{
            position: "absolute",
            left: 14,
            top: 14,
            width: 80,
            ...txt(12, 14.4, LABEL_GREY),
            fontWeight: 500,
            display: "block",
          }}
        >
          {label}
        </span>
        <span
          className={playfair.className}
          style={{
            position: "absolute",
            left: 14,
            top: 43,
            width: 76,
            ...txt(20, 26.7, VALUE_INK),
            fontWeight: 500,
            display: "block",
          }}
        >
          {value}
        </span>
        <img
          src={`${A}/2052-205.svg`}
          alt=""
          width={20}
          height={20}
          style={{ ...abs(96, 36, 20, 20), display: "block" }}
        />
      </button>
      {open ? (
        <div
          ref={listRef}
          role="listbox"
          aria-label={`${label} options`}
          style={{
            ...abs(x, Y + 77 + 6, 126, Math.min(contentH, menuMaxH)),
            background: FIELD_BG,
            boxShadow: `inset 0 0 0 1px ${MENU_STROKE}, ${MENU_SHADOW}`,
            borderRadius: 12,
            overflowY: contentH > menuMaxH ? "auto" : "hidden",
            zIndex: 5,
          }}
        >
          <div style={{ position: "relative", height: contentH }}>
            {options.map((opt, i) => {
              const selected = opt === value;
              return (
                <button
                  key={opt}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => onPick(opt)}
                  style={{
                    ...abs(0, 12 + i * pitch - 4, 126, pillH + 8),
                    background: "transparent",
                    border: 0,
                    padding: 0,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  {selected ? (
                    <span
                      style={{
                        ...abs(5, 0, 116, pillH),
                        background: PILL,
                        borderRadius: 7,
                        display: "block",
                      }}
                    />
                  ) : null}
                  <span
                    className={playfair.className}
                    style={{
                      position: "absolute",
                      left: 16,
                      top: 4,
                      ...txt(16, 21.3, selected ? PILL_TEXT : OPTION_INK),
                      fontWeight: 500,
                      display: "block",
                    }}
                  >
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </>
  );
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

  // Defaults are the frame's mock state (Aug 25, 2025). The parent keys this
  // component by its open mode, so each open remounts fresh — Cancel and Save
  // both just close, and nothing persists ("return to defaults").
  const [emailOn, setEmailOn] = useState(true);
  const [smsOn, setSmsOn] = useState(false);
  const [year, setYear] = useState("2025");
  const [month, setMonth] = useState("Aug");
  const [day, setDay] = useState("25");
  const [openMenu, setOpenMenu] = useState<"year" | "month" | "day" | null>(
    null,
  );

  // Escape closes the open dropdown first, then the sheet; the page behind
  // must not scroll while the sheet is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpenMenu((menu) => {
        if (menu === null) onClose();
        return null;
      });
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

        {/* the sheet (#FFFEFB, top corners 16) */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label={mode === "add" ? "Add reminder" : "Edit reminder"}
          onClick={() => setOpenMenu(null)}
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

          {/* date — three dropdown fields (2052:202/207/212); clicks must not
              bubble to the sheet's close-menus handler.
              AI-TAG(AI-011): AGENT-DECISION — full day/month ranges supplied
              in code; Charles should answer the team's scroll-wheel question
              in the Figma thread. See
              /agent-delivery/sessions/figma-sync-08-02-feat-figma-sync.md. */}
          <div style={{ ...abs(18, 168, 40), ...txt(11, 13.2, INK) }}>Date</div>
          <div onClick={(e) => e.stopPropagation()}>
            <DateDropdown
              x={16}
              label="Year"
              options={YEARS}
              value={year}
              open={openMenu === "year"}
              onToggle={() =>
                setOpenMenu((m) => (m === "year" ? null : "year"))
              }
              onPick={(v) => {
                setYear(v);
                setOpenMenu(null);
              }}
              pitch={38}
              pillH={34}
              menuMaxH={273}
            />
            <DateDropdown
              x={152}
              label="Month"
              options={MONTHS}
              value={month}
              open={openMenu === "month"}
              onToggle={() =>
                setOpenMenu((m) => (m === "month" ? null : "month"))
              }
              onPick={(v) => {
                setMonth(v);
                setOpenMenu(null);
              }}
              pitch={29}
              pillH={25}
              menuMaxH={273}
            />
            <DateDropdown
              x={288}
              label="Day"
              options={DAYS}
              value={day}
              open={openMenu === "day"}
              onToggle={() => setOpenMenu((m) => (m === "day" ? null : "day"))}
              onPick={(v) => {
                setDay(v);
                setOpenMenu(null);
              }}
              pitch={29}
              pillH={25}
              menuMaxH={277}
            />
          </div>

          {/* lead time — number is static (its chevron frame is an empty stub
              in the file: selection UI not delivered), unit pinned as a fixed
              value by the team's 08-01 comment */}
          <div style={{ ...abs(16, 288, 70), ...txt(11, 13.2, INK) }}>
            Remind me
          </div>
          <div style={field(16, 310, 159)} />
          <div style={{ ...abs(28, 322, 60), ...txt(12, 14.4, INK) }}>7</div>
          <div style={field(191, 310, 223)} />
          <div style={{ ...abs(203, 322, 120), ...txt(12, 14.4, INK) }}>
            days before
          </div>
          <div style={{ ...abs(16, 358, 300), ...txt(9, 10.8, INK) }}>
            Choose how long before the date to be reminded.
          </div>

          {/* notify by */}
          <div style={{ ...abs(16, 380, 90), ...txt(11, 13.2, INK) }}>
            Notify me by
          </div>
          <div
            style={{
              ...abs(16, 400, 398, 80),
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
            style={{ ...abs(28, 413, 17, 11), display: "block" }}
          />
          <div style={{ ...abs(48, 411, 60), ...txt(12, 14.4, INK) }}>
            Email
          </div>
          <Toggle
            x={356}
            y={412}
            on={emailOn}
            onFlip={() => setEmailOn((v) => !v)}
            label="Email reminders"
          />
          <div style={{ ...abs(16, 440, 398, 1), background: DIVIDER }} />
          <GlyphText
            src="reminders-edit-sms-label"
            x={28}
            y={451}
            w={45}
            h={14}
          />
          <Toggle
            x={356}
            y={452}
            on={smsOn}
            onFlip={() => setSmsOn((v) => !v)}
            label="SMS reminders"
          />
          <div style={{ ...abs(16, 486, 398), ...txt(9, 10.8, INK) }}>
            We’ll send a reminder using your selected methods.
          </div>

          {/* Cancel (discard → default) / Save (close) */}
          <button
            type="button"
            onClick={onClose}
            style={{
              ...abs(16, 510, 187, 40),
              background: CREAM2,
              boxShadow: `inset 0 0 0 1px ${SAND}`,
              borderRadius: 10,
              border: 0,
              cursor: "pointer",
              ...txt(12, 40, INK, "center"),
              fontWeight: 500,
              letterSpacing: 1.1,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              ...abs(218, 510, 196, 40),
              background: ROSE,
              borderRadius: 10,
              border: 0,
              cursor: "pointer",
              ...txt(12, 40, CREAM2, "center"),
              fontWeight: 500,
              letterSpacing: 1.1,
            }}
          >
            Save
          </button>

          {/* Delete reminder — inert placeholder (no reminders backend) */}
          <div
            style={{ ...abs(16, 564, 398), ...txt(11, 13.2, INK, "center") }}
          >
            Delete reminder
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
