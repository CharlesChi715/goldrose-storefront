"use client";

/**
 * ROLE OF THIS FILE
 * /account/addresses — pixel-exact implementation of ADDRESS-BOOK (2118:247,
 * 430×932), imported 2026-08-07. Geometry, colours, fonts and copy verbatim
 * from the Figma REST data; the plus, chevron and lock marks are Figma's own
 * SVG exports.
 *
 * This frame had been Ready-for-dev with no route since the 08-05 sync; the
 * 08-07 delivery completed it by replacing the ADDRESS-BOOK-ADD-NEW page with
 * a bottom sheet (see AddressSheet). Two smaller changes arrived with it: the
 * "•••" overflow menu on each card became explicit "Set as default | Edit"
 * links, and the frame's bottom-nav band was dropped — so this screen renders
 * without one, unlike the other me-flow pages.
 *
 * Everything here is the mock's own content. The three addresses are design
 * placeholders: there is no address backend, and the schema stores a single
 * `default_address` per customer (lib/supabase/types.ts) rather than a
 * collection, so a real address book needs a one-to-many table first. Edit,
 * Add and "Set as default" therefore open or close the sheet and nothing
 * persists — the same visual-placeholder contract /account/reminders ships
 * under.
 *
 * The action links keep their Figma strings verbatim, trailing spaces and
 * all (`whiteSpace: "pre"`), because the frame right-aligns each label with
 * that padding baked in — trimming them would shift every link right.
 */

import { useState } from "react";
import { BackButton } from "@/components/BackButton";
import { ScaleFrame } from "@/components/chrome";
import { AddressSheet } from "@/components/screens/AddressSheet";
import { BrandWordmark } from "@/components/screens/account-chrome";
import { Glyph } from "@/components/screens/glyphs";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";

const A = "/eldreve/screens";
const INK = "#3B2F2F";
const SAND = "#E5D9C9";
const GOLD = "#D4AF37";
const CREAM = "#FFF6EC";
const BADGE_BG = "#FFF7E0";

/**
 * The frame's tracked small-caps caption ("DEFAULT ADDRESS", "OTHER
 * ADDRESSES"). Sizes throughout this screen come from the REST `style` block
 * rather than the outline, which rounds 10.5/11.5/12.5 to whole pixels and
 * reads visibly heavier.
 */
const CAPTION: React.CSSProperties = {
  ...txt(11, 15, INK),
  letterSpacing: 1.2,
  fontWeight: 500,
};

/** One drawn address card. `y` is the card's own top in frame coordinates. */
type AddressCard = {
  y: number;
  h: number;
  name: string;
  label: string;
  lines: string;
  phone: string;
  /** The default card carries the badge and drops the "Set as default" link. */
  isDefault: boolean;
};

// 2132:249…287 — the mock's three addresses, frame order.
const CARDS: AddressCard[] = [
  {
    y: 234,
    h: 163,
    name: "Jessica Chen",
    label: "Home",
    lines: "123 Rose Avenue, Apt 5B\nSan Francisco, CA 94103\nUnited States",
    phone: "+1 415 123 4567",
    isDefault: true,
  },
  {
    y: 435,
    h: 157,
    name: "Emma Wilson",
    label: "Gift recipient",
    lines: "27 Garden Street\nLos Angeles, CA 90012\nUnited States",
    phone: "+1 213 555 0182",
    isDefault: false,
  },
  {
    y: 601,
    h: 157,
    name: "Sophia Bennett",
    label: "Work",
    lines:
      "88 Market Street, Suite 400\nSan Francisco, CA 94105\nUnited States",
    phone: "+1 628 555 0147",
    isDefault: false,
  },
];

/**
 * The default card's header is 26 tall (it holds the badge) and the plain
 * cards' is 20, which shifts every row below it — hence two offset sets
 * rather than one.
 */
const OFFSETS = {
  default: { name: 14, label: 41, lines: 61, phone: 113, rule: 133, act: 137 },
  plain: { name: 11, label: 35, lines: 55, phone: 107, rule: 127, act: 131 },
};

/** A right-aligned gold action link, Figma string verbatim. */
function ActionLink({
  x,
  y,
  w,
  text,
  label,
  onClick,
}: {
  x: number;
  y: number;
  w: number;
  text: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{
        ...abs(x, y, w, 17),
        ...txt(12.5, 17, GOLD, "right"),
        whiteSpace: "pre",
        background: "transparent",
        border: 0,
        padding: 0,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      {text}
    </button>
  );
}

/**
 * The saved-address book.
 *
 * @returns The 430×932 screen, with the add / edit sheet mounted alongside.
 */
export function AddressBookScreen() {
  // null = closed; "add"/"edit" open the same sheet with a different title.
  const [sheet, setSheet] = useState<null | "add" | "edit">(null);

  return (
    <ScaleFrame
      height={932}
      background={CREAM}
      fontClass={notoSC.className}
      nav={false}
    >
      {/* Header (2207:293/294) — the frame paints a cream band the same colour
          as the page, so only the back arrow and wordmark are drawn. */}
      <BackButton
        fallback="/account"
        src={`${A}/2207-293.png`}
        style={abs(7, 20, 40, 43)}
      />
      <BrandWordmark x={143} y={21} w={136} h={40} />

      <h1
        className={playfair.className}
        style={{
          ...abs(16, 72, 398, 40),
          ...txt(30, 38, INK),
          letterSpacing: -0.4,
          fontWeight: 600,
          margin: 0,
        }}
      >
        Address Book
      </h1>
      <div style={{ ...abs(16, 121, 398, 18), ...txt(12.5, 17, INK) }}>
        Manage saved shipping addresses for faster checkout.
      </div>

      {/* Button / Add New Address — the icon and label are centred as a pair */}
      <button
        type="button"
        aria-label="Add New Address"
        onClick={() => setSheet("add")}
        style={{
          ...abs(16, 148, 398, 48),
          background: INK,
          borderRadius: 12,
          border: 0,
          padding: 0,
          cursor: "pointer",
        }}
      >
        <Glyph src="2132-248" x={97} y={17} w={14} h={14} ink={[16, 16]} />
        <span
          style={{
            ...abs(126, 13, 180, 22),
            ...txt(16, 22, CREAM, "center"),
            fontFamily: "inherit",
          }}
        >
          Add New Address
        </span>
      </button>

      <div style={{ ...abs(16, 205, 398, 20), ...CAPTION }}>
        DEFAULT ADDRESS
      </div>
      <div style={{ ...abs(16, 406, 398, 20), ...CAPTION }}>
        OTHER ADDRESSES
      </div>

      {CARDS.map((card) => {
        const o = card.isDefault ? OFFSETS.default : OFFSETS.plain;
        return (
          <div key={card.name}>
            <div
              style={{
                ...abs(16, card.y, 398, card.h),
                background: "rgba(255,255,255,0.78)",
                boxShadow: `inset 0 0 0 1px ${SAND}`,
                borderRadius: 12,
              }}
            />
            <div
              className={playfair.className}
              style={{
                ...abs(30, card.y + o.name, 245, 20),
                ...txt(17, 23, INK),
                fontWeight: 500,
              }}
            >
              {card.name}
            </div>
            {card.isDefault && (
              <>
                <div
                  style={{
                    ...abs(328, card.y + 11, 72, 26),
                    background: BADGE_BG,
                    boxShadow: `inset 0 0 0 1px ${GOLD}`,
                    borderRadius: 13,
                  }}
                />
                <div
                  style={{
                    ...abs(337, card.y + 14, 54, 20),
                    ...txt(11, 15, GOLD, "center"),
                    letterSpacing: 1.2,
                    fontWeight: 500,
                  }}
                >
                  Default
                </div>
              </>
            )}
            <div
              style={{
                ...abs(30, card.y + o.label, 370, 16),
                ...txt(11.5, 16, GOLD),
              }}
            >
              {card.label}
            </div>
            <div
              style={{
                ...abs(30, card.y + o.lines, 370, 48),
                ...txt(11.5, 16, INK),
                whiteSpace: "pre-line",
              }}
            >
              {card.lines}
            </div>
            <div
              style={{
                ...abs(30, card.y + o.phone, 370, 16),
                ...txt(11.5, 16, INK),
              }}
            >
              {card.phone}
            </div>
            <div
              style={{
                ...abs(30, card.y + o.rule, 370, 1),
                background: SAND,
              }}
            />
            {card.isDefault ? (
              <ActionLink
                x={367}
                y={card.y + o.act}
                w={33}
                text="Edit  "
                label={`Edit address for ${card.name}`}
                onClick={() => setSheet("edit")}
              />
            ) : (
              <>
                <ActionLink
                  x={199}
                  y={card.y + o.act}
                  w={134}
                  text="Set as default      "
                  label={`Set ${card.name}'s address as default`}
                  onClick={() => setSheet("edit")}
                />
                <div
                  aria-hidden="true"
                  style={{
                    ...abs(348, card.y + o.act, 8, 17),
                    ...txt(12.5, 17, GOLD, "right"),
                    whiteSpace: "pre",
                  }}
                >
                  {" | "}
                </div>
                <ActionLink
                  x={371}
                  y={card.y + o.act}
                  w={29}
                  text="  Edit"
                  label={`Edit address for ${card.name}`}
                  onClick={() => setSheet("edit")}
                />
              </>
            )}
          </div>
        );
      })}

      {/* Privacy Notice — outlined panel, lock mark, reassurance line */}
      <div
        style={{
          ...abs(16, 767, 398, 42),
          boxShadow: `inset 0 0 0 1px ${SAND}`,
          borderRadius: 10,
        }}
      />
      {/* Icon / Lock — body and shackle export as two vectors */}
      <Glyph src="2132-286" x={35} y={786} w={13} h={10} ink={[15, 12]} />
      <Glyph src="2132-287" x={37} y={780} w={7} h={6} ink={[9, 8]} />
      <div style={{ ...abs(62, 778, 340, 20), ...txt(10.5, 14, INK) }}>
        Saved addresses are private and available during checkout.
      </div>

      {/* Keyed on the open mode so each open remounts with empty fields —
          the sheet's own state would otherwise survive a Cancel, which is
          exactly what "Cancel discards" must not do (the reminders-sheet
          precedent). */}
      <AddressSheet
        key={sheet ?? "closed"}
        open={sheet !== null}
        mode={sheet === "edit" ? "edit" : "add"}
        onClose={() => setSheet(null)}
      />
    </ScaleFrame>
  );
}
