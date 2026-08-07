"use client";

/**
 * ROLE OF THIS FILE
 * The add / edit address bottom sheet of /account/addresses — imported
 * 2026-08-07 from ADD-NEW-ADDRESS-BOTTOM-SHEET (430×663).
 *
 * The delivery ships this as **two** frames, 2134:299 ("Add New Address",
 * reached from the page's Add New Address button) and 2610:373 ("Edit Your
 * Address", reached from a card's Edit). They are byte-identical apart from
 * the title, so they collapse to one component with a `mode` prop — the same
 * one-sheet-two-titles shape ReminderEditModal already uses. The frames also
 * replace the old ADDRESS-BOOK-ADD-NEW *page* (2118:248), which this delivery
 * deleted: adding an address is a sheet now, not a route.
 *
 * Behaviour follows the reminders sheet, which is the house precedent for an
 * unbacked modal: Cancel, ×, Escape and the scrim all discard and close; Save
 * closes. Nothing persists — there is no address backend (the customer row
 * carries a single `default_address`, not a collection), so the fields hold
 * their own state only. The two pickers are real `<select>`s because the frame
 * draws chevrons on them; the rest are real inputs so the form can be typed in
 * and reviewed.
 *
 * Portalled to <body> and bottom-anchored — ScaleFrame's transform would
 * otherwise swallow position:fixed (the ReminderEditModal / TrackReturnSheet
 * pattern).
 */

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Glyph } from "@/components/screens/glyphs";
import { COUNTRIES } from "@/lib/checkout/countries";
import { US_STATES } from "@/lib/checkout/us-states";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";

const INK = "#3B2F2F";
const SAND = "#E5D9C9"; // field stroke
const SHEET_BG = "#FFFBF7";
const CREAM = "#FFF6EC"; // Save label
const GOLD = "#D4AF37"; // Cancel
const PLACEHOLDER = "#736B66";
const HANDLE = "#B8B2AD";

const STAGE_H = 932;
const SHEET_H = 663;
const SHEET_TOP = STAGE_H - SHEET_H; // bottom-anchored

// SSR-safe mounted detection for the portal (the ReminderEditModal pattern).
const subscribeToNothing = () => () => {};
const onTheClient = () => true;
const onTheServer = () => false;

/**
 * The frame's two type roles. Field labels are 10.5/14 at weight 500 with
 * 1.2px tracking; every value, placeholder and body line is 11.5/16 at 400.
 * The sizes come from the REST `style` block — the outline rounds them to
 * 11 and 12, which reads visibly heavier.
 */
const LABEL: React.CSSProperties = {
  ...txt(10.5, 14, INK),
  letterSpacing: 1.2,
  fontWeight: 500,
};
const VALUE = (color: string): React.CSSProperties => txt(11.5, 16, color);

/** The frame's field box: 38 tall, 8-radius, 1px sand stroke, no fill. */
const fieldBox = (x: number, y: number, w: number): React.CSSProperties => ({
  ...abs(x, y, w, 38),
  boxShadow: `inset 0 0 0 1px ${SAND}`,
  borderRadius: 8,
});

/** Shared reset for the real controls drawn inside a field box. */
const control: React.CSSProperties = {
  background: "transparent",
  border: 0,
  outline: "none",
  padding: 0,
  fontFamily: "inherit",
};

/** A labelled text field: label at `y`, box at `y + 21`, text at `y + 31`. */
function TextField({
  x,
  y,
  w,
  label,
  placeholder,
  value,
  onChange,
}: {
  x: number;
  y: number;
  w: number;
  label: string;
  placeholder: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const id = `addr-${label.replace(/[^a-z]+/gi, "-").toLowerCase()}`;
  return (
    <>
      <label htmlFor={id} style={{ ...abs(x, y, w, 18), ...LABEL }}>
        {label}
      </label>
      <div style={fieldBox(x, y + 21, w)} />
      <input
        id={id}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...abs(x + 10, y + 31, w - 20, 18),
          ...VALUE(INK),
          ...control,
        }}
      />
    </>
  );
}

/**
 * A labelled picker: the same field box with the frame's chevron art at its
 * right edge and a real `<select>` filling the box.
 */
function PickerField({
  x,
  y,
  w,
  label,
  options,
  value,
  onChange,
}: {
  x: number;
  y: number;
  w: number;
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (next: string) => void;
}) {
  const id = `addr-${label.replace(/[^a-z]+/gi, "-").toLowerCase()}`;
  return (
    <>
      <label htmlFor={id} style={{ ...abs(x, y, w, 18), ...LABEL }}>
        {label}
      </label>
      <div style={fieldBox(x, y + 21, w)} />
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...abs(x + 10, y + 31, w - 44, 18),
          ...VALUE(value ? INK : PLACEHOLDER),
          ...control,
          appearance: "none",
          cursor: "pointer",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {/* Icon / Chevron Down — the caret sits 21px in from the field's right
          edge on both the full-width and the half-width fields. */}
      <Glyph
        src="2134-311"
        x={x + w - 21}
        y={y + 39}
        w={5}
        h={3}
        ink={[7, 4]}
      />
    </>
  );
}

const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({
  value: c.code,
  label: c.name,
}));
const STATE_OPTIONS = [
  { value: "", label: "Select state" },
  ...US_STATES.map((s) => ({ value: s.code, label: s.name })),
];

/**
 * The add / edit address bottom sheet.
 *
 * @param open Whether the sheet is showing.
 * @param mode `"add"` titles it "Add New Address" (2134:299); `"edit"` titles
 *   it "Edit Your Address" (2610:373). Nothing else differs between them.
 * @param onClose Called by Cancel, ×, Escape, the scrim and Save alike —
 *   nothing persists, so every exit is the same exit.
 * @returns The portalled sheet, or null while closed or before mount.
 */
export function AddressSheet({
  open,
  mode,
  onClose,
}: {
  open: boolean;
  mode: "add" | "edit";
  onClose: () => void;
}) {
  const mounted = useSyncExternalStore(
    subscribeToNothing,
    onTheClient,
    onTheServer,
  );

  const [country, setCountry] = useState("US");
  const [fullName, setFullName] = useState("");
  const [street, setStreet] = useState("");
  const [apartment, setApartment] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [phone, setPhone] = useState("");
  const [makeDefault, setMakeDefault] = useState(false);

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

  const title = mode === "add" ? "Add New Address" : "Edit Your Address";

  return createPortal(
    <>
      <style>{`
        .figv-addrstage { position: fixed; bottom: 0; width: 430px; height: ${STAGE_H}px; left: calc((100% - 430px) / 2); z-index: 41; pointer-events: none; }
        .figv-addrsheet { pointer-events: auto; }
        @media (max-width: 480px) {
          .figv-addrstage { transform: scale(calc(min(100vw, 480px) / 430px)); transform-origin: bottom center; }
        }
      `}</style>
      {/* The scrim lives outside the scaled 430×932 stage so it covers the
          whole viewport, including tall desktop canvases. */}
      <button
        type="button"
        aria-label="Close address dialog"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 40,
          background: "rgba(15,14,13,0.64)",
          border: 0,
          padding: 0,
          cursor: "pointer",
          display: "block",
        }}
      />
      <div className={`figv-addrstage ${notoSC.className}`}>
        <div
          className="figv-addrsheet"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          style={{
            ...abs(0, SHEET_TOP, 430, SHEET_H),
            background: SHEET_BG,
            borderRadius: "16px 16px 0 0",
            overflow: "hidden",
          }}
        >
          {/* Sheet Handle Row */}
          <div
            style={{
              ...abs(191, 10, 48, 4),
              background: HANDLE,
              borderRadius: 2,
            }}
          />

          {/* Sheet Title Row */}
          <div
            className={playfair.className}
            style={{
              ...abs(20, 23, 320, 36),
              ...txt(24, 32, INK),
              letterSpacing: -0.4,
              fontWeight: 600,
            }}
          >
            {title}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            style={{
              ...abs(388, 30, 22, 22),
              background: "transparent",
              border: 0,
              padding: 0,
              cursor: "pointer",
            }}
          >
            <Glyph src="2134-304" x={5} y={5} w={13} h={13} ink={[15, 15]} />
          </button>

          <div style={{ ...abs(20, 68, 390, 18), ...VALUE(INK) }}>
            Save a shipping address for faster checkout.
          </div>

          <PickerField
            x={20}
            y={93}
            w={390}
            label="Country / Region"
            options={COUNTRY_OPTIONS}
            value={country}
            onChange={setCountry}
          />
          <TextField
            x={20}
            y={159}
            w={390}
            label="Full name"
            placeholder="Enter full name"
            value={fullName}
            onChange={setFullName}
          />
          <TextField
            x={20}
            y={225}
            w={390}
            label="Street address"
            placeholder="Enter street address"
            value={street}
            onChange={setStreet}
          />
          <TextField
            x={20}
            y={291}
            w={390}
            label="Apartment, suite, unit, etc. (Optional)"
            placeholder="Enter apartment, suite, unit, etc."
            value={apartment}
            onChange={setApartment}
          />
          <TextField
            x={20}
            y={357}
            w={189}
            label="City"
            placeholder="Enter city"
            value={city}
            onChange={setCity}
          />
          <PickerField
            x={221}
            y={357}
            w={189}
            label="State"
            options={STATE_OPTIONS}
            value={state}
            onChange={setState}
          />
          <TextField
            x={20}
            y={423}
            w={390}
            label="ZIP code"
            placeholder="Enter ZIP code"
            value={zip}
            onChange={setZip}
          />
          <TextField
            x={20}
            y={489}
            w={390}
            label="Phone number (Optional)"
            placeholder="Enter phone number"
            value={phone}
            onChange={setPhone}
          />

          {/* Set Default Row — 18×18 box, 3-radius, ink stroke */}
          <input
            id="addr-default"
            type="checkbox"
            checked={makeDefault}
            onChange={(e) => setMakeDefault(e.target.checked)}
            style={{
              ...abs(20, 555, 18, 18),
              margin: 0,
              accentColor: INK,
              cursor: "pointer",
            }}
          />
          <label
            htmlFor="addr-default"
            style={{
              ...abs(46, 555, 350, 18),
              ...VALUE(INK),
              cursor: "pointer",
            }}
          >
            Set as default shipping address
          </label>

          <button
            type="button"
            onClick={onClose}
            style={{
              ...abs(20, 580, 390, 44),
              background: INK,
              borderRadius: 10,
              border: 0,
              padding: 0,
              cursor: "pointer",
            }}
          >
            <span
              style={{
                ...abs(70, 13, 250, 18),
                ...txt(14, 19, CREAM, "center"),
              }}
            >
              Save Address
            </span>
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              ...abs(20, 631, 390, 18),
              ...txt(12.5, 17, GOLD, "center"),
              background: "transparent",
              border: 0,
              padding: 0,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
