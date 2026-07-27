"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * B-2 · Checkout (Figma frame 561:88, content frame 747:102, 430×2102) as six
 * independently mountable, pixel-exact skins — 01 header+progress,
 * 02 order item+promo, 03 express checkout, 04 contact+delivery,
 * 05 shipping+payment, 06 summary+help+secure CTA. Every data string is a prop
 * defaulting to the design's own text (`data-live-text`); every control turns
 * into a real button/input/select only when its callback is passed, so the
 * prop-less render is a faithful static skin. Geometry is frame-absolute per
 * module: each piece paints its own module frame at `top` and positions its
 * children relative to that frame's origin. The frame's bottom nav is not in
 * the outline (shared <BottomNav> chrome supplies it).
 */

import { abs } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";

/** Figma render assets (public/veloria/screens). */
const A = "/veloria/screens";

/** HTML collapses the design's double spaces; nbsp + space keeps them. */
const NB = " ";

/** The 561:88 canvas height — 747:102 is 2077 tall, the frame reserves 2102. */
export const CHECKOUT_CANVAS_HEIGHT = 2102;

/* ---------- shared chrome ---------- */

const HAIRLINE = "inset 0 0 0 1px #E5D9C9";
const GREEN_RING = "inset 0 0 0 1px #09442E";
/** 755:137 / 756:121 etc. carry a bottom-only 1px stroke (individual weights). */
const BOTTOM_HAIRLINE = "inset 0 -1px 0 0 #E5D9C9";

/** White card + 1px inside hairline; radius varies per node. */
const CARD: React.CSSProperties = {
  background: "#FFFFFF",
  boxShadow: HAIRLINE,
  overflow: "hidden",
};

const INPUT_RESET: React.CSSProperties = {
  appearance: "none",
  border: 0,
  outline: "none",
  background: "transparent",
  padding: 0,
  margin: 0,
};

/** Field label type (753:188 etc.): Noto Sans SC 500 8/9.6 in #C88217. */
const FIELD_LABEL = { size: 8, lh: 9.6, weight: 500, color: "#C88217" } as const;
/** Field value type (753:189 etc.): Noto Sans SC 400 11/13.2 in #3B2F2F. */
const FIELD_VALUE = { size: 11, lh: 13.2, weight: 400, color: "#3B2F2F" } as const;

/**
 * The design paints empty boxes in #8C8075 and filled values in #3B2F2F;
 * ::placeholder cannot be set inline, so two scoped rules carry it.
 */
function FieldStyles() {
  return (
    <style>{`.b2-ph-dim::placeholder{color:#8C8075;opacity:1}.b2-ph-ink::placeholder{color:#3B2F2F;opacity:1}`}</style>
  );
}

/* ---------- primitives ---------- */

type Face = "playfair" | "noto";

type TxtProps = {
  x: number;
  y: number;
  w?: number;
  face?: Face;
  size: number;
  lh: number;
  color: string;
  weight?: number;
  ls?: number;
  /** marks the box as carrying real data (`data-live-text`) */
  live?: boolean;
  wrap?: boolean;
  children: React.ReactNode;
};

/** One design TEXT node: exact absolute box + exact type. */
function Txt({ x, y, w, face = "noto", size, lh, color, weight, ls, live, wrap, children }: TxtProps) {
  const className = (face === "playfair" ? playfair : notoSC).className;
  const style: React.CSSProperties = {
    ...abs(x, y, w),
    fontSize: size,
    lineHeight: `${lh}px`,
    color,
    ...(weight !== undefined ? { fontWeight: weight } : {}),
    ...(ls !== undefined ? { letterSpacing: ls } : {}),
    ...(wrap ? {} : { whiteSpace: "nowrap" as const }),
  };
  if (live) {
    return (
      <div data-live-text className={className} style={style}>
        {children}
      </div>
    );
  }
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

/**
 * A manifest glyph render placed at its TEXT node's own box. Figma crops glyph
 * SVGs to the ink, so the image is never stretched: objectFit none + the
 * node's HALIGN (every glyph node in 561:88 is LEFT).
 */
function Glyph({
  src,
  alt,
  x,
  y,
  w,
  h,
  pos = "left",
}: {
  src: string;
  alt: string;
  x: number;
  y: number;
  w: number;
  h: number;
  pos?: "left" | "center" | "right";
}) {
  return (
    <img
      src={`${A}/${src}`}
      alt={alt}
      style={{
        ...abs(x, y, w, h),
        display: "block",
        objectFit: "none",
        objectPosition: `${pos} center`,
      }}
    />
  );
}

type TapProps = {
  style: React.CSSProperties;
  children?: React.ReactNode;
  /** with a callback the box is a real <button>; without it, an inert div */
  onClick?: () => void;
  label?: string;
  role?: "radio" | "checkbox";
  checked?: boolean;
  expanded?: boolean;
};

/** The design box; a real button when its callback is supplied. */
function Tap({ style, children, onClick, label, role, checked, expanded }: TapProps) {
  if (!onClick) {
    return <div style={style}>{children}</div>;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      role={role}
      aria-checked={role ? checked : undefined}
      aria-expanded={expanded}
      style={{
        // no `outline: none` here — the focus ring stays for keyboard users
        appearance: "none",
        border: 0,
        margin: 0,
        padding: 0,
        background: "transparent",
        font: "inherit",
        color: "inherit",
        textAlign: "left",
        cursor: "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/* ---------- 01 / Checkout Header + Progress (747:103) ---------- */

/** 753:140 … 753:152 — the four progress steps, frame-absolute. */
const STEPS = [
  { marker: 50, labelX: 52.5, labelW: 19, label: "Bag" },
  { marker: 152, labelX: 147.5, labelW: 33, label: "Details" },
  { marker: 254, labelX: 246, labelW: 40, label: "Delivery" },
  { marker: 356, labelX: 346.5, labelW: 43, label: "Payment" },
] as const;

export type CheckoutHeaderProps = {
  /** module y in the 430-wide stage (747:103) */
  top?: number;
  /** 0-based; the design ships step 4 (Payment) current, 1–3 complete */
  activeStep?: number;
  onBack?: () => void;
  onStepClick?: (index: number) => void;
};

export function CheckoutHeader({ top = 0, activeStep = 3, onBack, onStepClick }: CheckoutHeaderProps) {
  return (
    <div style={{ ...abs(0, top, 430, 143), background: "#FFF6EC", overflow: "hidden" }}>
      {/* 786:177 Brand Navigation — clips the logo's 4.5px top bleed */}
      <div style={{ ...abs(16, 15, 398, 42), overflow: "hidden" }}>
        <Tap onClick={onBack} label="Back" style={{ ...abs(0, 0, 40, 42) }}>
          {/* 786:178 back chevron */}
          <img
            src={`${A}/786-176.png`}
            alt=""
            width={40}
            height={42}
            style={{ ...abs(0, 0, 40, 42), display: "block" }}
          />
        </Tap>
        {/* 786:179 wordmark — 51px tall in a 42px row, so y is negative */}
        <img
          src={`${A}/786-169.png`}
          alt="GoldRose"
          width={140}
          height={51}
          style={{ ...abs(131, -4.5, 140, 51), display: "block" }}
        />
      </div>

      {/* 753:139 Checkout Progress */}
      {STEPS.map((s, i) => {
        const done = i < activeStep;
        const current = i === activeStep;
        return (
          <Tap
            key={s.label}
            onClick={onStepClick ? () => onStepClick(i) : undefined}
            label={s.label}
            style={{ ...abs(s.marker - 34, 65, 92, 64) }}
          >
            {/* 753:141 Step Marker — 2px inside stroke, never a border */}
            <div
              style={{
                ...abs(34, 12, 24, 24),
                background: done ? "#C88217" : "#FFFFFF",
                boxShadow: "inset 0 0 0 2px #C88217",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              {done ? (
                <Glyph src="753-142.svg" alt="✓" x={8} y={6} w={8} h={12} />
              ) : (
                <Txt x={9} y={6} w={6} size={10} lh={12} weight={500} color="#C88217">
                  {String(i + 1)}
                </Txt>
              )}
            </div>
            {/* 753:143 step label */}
            <Txt
              x={s.labelX - (s.marker - 34)}
              y={40}
              w={s.labelW}
              size={10}
              lh={12}
              weight={500}
              color={current ? "#09442E" : "#3B2F2F"}
            >
              {s.label}
            </Txt>
          </Tap>
        );
      })}
    </div>
  );
}

/* ---------- 02 / Order Item + Promo (747:104) ---------- */

export type CheckoutOrderItemProps = {
  /** module y in the 430-wide stage (747:104) */
  top?: number;
  imageSrc?: string;
  imageAlt?: string;
  title?: string;
  /** 753:160 — colourway + quantity line */
  qtyLine?: string;
  /** 753:161 — engraving line */
  engravingLine?: string;
  /** 753:162 — gift-box line */
  giftLine?: string;
  price?: string;
  /** 753:165 EDIT → */
  onEdit?: () => void;
  /**
   * B-2 has no stepper/remove affordance (those live in B-1 · Bag). Passing
   * these opts into extra controls placed in the item column's free space —
   * additive geometry, absent from the outline, and off by default.
   */
  qty?: string;
  onQtyUp?: () => void;
  onQtyDown?: () => void;
  onRemove?: () => void;
  /** 753:167 — the promo box is empty in the design; its string is a placeholder */
  promoCode?: string;
  promoPlaceholder?: string;
  onPromoCodeChange?: (value: string) => void;
  onApplyPromo?: () => void;
  applyLabel?: string;
};

export function CheckoutOrderItem({
  top = 143,
  imageSrc = `${A}/753-157.png`,
  imageAlt = "Sapphire blue preserved rose in a gift box",
  title = "Artisan Blue Rose",
  qtyLine = `Sapphire blue${NB} ·${NB} Qty 1`,
  engravingLine = `Engraving${NB} ·${NB} Sophia${NB} ·${NB} 2026.07.24`,
  giftLine = `Gift box${NB} ·${NB} Signature presentation`,
  price = "$159.00",
  onEdit,
  qty = "1",
  onQtyUp,
  onQtyDown,
  onRemove,
  promoCode,
  promoPlaceholder = "Discount code",
  onPromoCodeChange,
  onApplyPromo,
  applyLabel = "APPLY",
}: CheckoutOrderItemProps) {
  const stepper = onQtyUp !== undefined || onQtyDown !== undefined;
  return (
    <div style={{ ...abs(0, top, 430, 258), background: "#FFF6EC", overflow: "hidden" }}>
      <FieldStyles />

      {/* 753:156 Checkout Item card */}
      <div style={{ ...abs(16, 8, 398, 142), ...CARD, borderRadius: 14 }}>
        {/* 753:157 product render (Figma IMAGE fill, scaleMode FIT) */}
        <img
          src={imageSrc}
          alt={imageAlt}
          width={112}
          height={118}
          style={{ ...abs(12, 12, 112, 118), display: "block", borderRadius: 8 }}
        />

        {/* 753:158 Checkout Item Details — clips the price row's 4px overhang */}
        <div style={{ ...abs(136, 12, 250, 118), overflow: "hidden" }}>
          <Txt x={0} y={0} w={250} face="playfair" size={18} lh={23.99} weight={500} color="#3B2F2F" live>
            {title}
          </Txt>
          <Txt x={0} y={26} w={109} size={10} lh={12} weight={400} color="#3B2F2F" live>
            {qtyLine}
          </Txt>
          <Txt x={0} y={42} w={250} size={10} lh={12} weight={400} color="#3B2F2F" live>
            {engravingLine}
          </Txt>
          <Txt x={0} y={68} w={250} size={10} lh={12} weight={400} color="#3B2F2F" live>
            {giftLine}
          </Txt>

          {/* Additive opt-in quantity stepper (not in the outline) */}
          {stepper ? (
            <>
              <Tap
                onClick={onQtyDown}
                label="Decrease quantity"
                style={{
                  ...abs(186, 22, 20, 20),
                  boxShadow: HAIRLINE,
                  borderRadius: 6,
                }}
              >
                <Txt x={0} y={4} w={20} size={10} lh={12} weight={500} color="#3B2F2F">
                  {"−"}
                </Txt>
              </Tap>
              <div data-live-text className={notoSC.className} style={{ ...abs(208, 26, 18), fontSize: 10, lineHeight: "12px", fontWeight: 500, color: "#3B2F2F", textAlign: "center", whiteSpace: "nowrap" }}>
                {qty}
              </div>
              <Tap
                onClick={onQtyUp}
                label="Increase quantity"
                style={{
                  ...abs(230, 22, 20, 20),
                  boxShadow: HAIRLINE,
                  borderRadius: 6,
                }}
              >
                <Txt x={0} y={4} w={20} size={10} lh={12} weight={500} color="#3B2F2F">
                  +
                </Txt>
              </Tap>
            </>
          ) : null}

          {/* 753:163 Item Price row — clips the 29px price line to 28px */}
          <div style={{ ...abs(0, 94, 250, 28), overflow: "hidden" }}>
            <Txt x={0} y={0} w={74} face="playfair" size={22} lh={29.33} weight={500} color="#09442E" live>
              {price}
            </Txt>
            {/* Additive opt-in remove link (not in the outline) */}
            {onRemove ? (
              <Tap onClick={onRemove} label="Remove item" style={{ ...abs(150, 0, 60, 11) }}>
                <Txt x={0} y={0} w={60} size={9} lh={10.8} weight={500} color="#8C8075">
                  REMOVE
                </Txt>
              </Tap>
            ) : null}
            {/* 753:165 EDIT → (one Figma render carrying the arrow glyph) */}
            <Tap onClick={onEdit} label="Edit this item" style={{ ...abs(216, 0, 34, 11) }}>
              <Glyph src="753-165.svg" alt={`EDIT${NB} →`} x={0} y={0} w={34} h={11} />
            </Tap>
          </div>
        </div>
      </div>

      {/* 753:166 Discount Code */}
      <div style={{ ...abs(16, 158, 398, 46), ...CARD, borderRadius: 10 }}>
        {/* 753:167 — the design's empty box, so a real (usable) input */}
        <input
          data-live-text
          className={`${notoSC.className} b2-ph-dim`}
          type="text"
          name="discount-code"
          autoComplete="off"
          aria-label="Discount code"
          placeholder={promoPlaceholder}
          {...(promoCode !== undefined ? { value: promoCode } : {})}
          {...(onPromoCodeChange
            ? { onChange: (e: React.ChangeEvent<HTMLInputElement>) => onPromoCodeChange(e.target.value) }
            : { readOnly: promoCode !== undefined })}
          style={{
            ...abs(12, 16.5, 294),
            ...INPUT_RESET,
            fontSize: 11,
            lineHeight: "13.2px",
            fontWeight: 400,
            color: "#3B2F2F",
          }}
        />
        {/* 753:168 Apply Code */}
        <Tap
          onClick={onApplyPromo}
          label="Apply discount code"
          style={{ ...abs(314, 6, 78, 34), background: "#09442E", borderRadius: 8, overflow: "hidden" }}
        >
          <Txt x={25.5} y={11.5} w={27} size={9} lh={10.8} weight={500} color="#FFFFFF">
            {applyLabel}
          </Txt>
        </Tap>
      </div>

      {/* 753:170 Fulfillment Assurances — one render (⌂ / ▱ / ♔ glyph copy) */}
      <img
        src={`${A}/753-170.svg`}
        alt="Ships from the U.S. · 3–5 day delivery · Free over $50"
        width={398}
        height={44}
        style={{ ...abs(16, 212, 398, 44), display: "block" }}
      />
    </div>
  );
}

/* ---------- 03 / Express Checkout (747:105) ---------- */

export type CheckoutExpressProps = {
  /** module y in the 430-wide stage (747:105) */
  top?: number;
  heading?: string;
  dividerLabel?: string;
  onShopPay?: () => void;
  onPayPal?: () => void;
  onApplePay?: () => void;
  /**
   * Rendered INSIDE the design's express button box instead of its own label —
   * for the PayPal SDK's own iframe button, which cannot be restyled.
   */
  payButtonSlot?: React.ReactNode;
  /** which express box `payButtonSlot` fills (default the PayPal box, 753:177) */
  payButtonSlotTarget?: "shopPay" | "paypal" | "applePay";
};

export function CheckoutExpress({
  top = 401,
  heading = "Express Checkout",
  dividerLabel = "OR CONTINUE BELOW",
  onShopPay,
  onPayPal,
  onApplePay,
  payButtonSlot,
  payButtonSlotTarget = "paypal",
}: CheckoutExpressProps) {
  // A filled slot owns its box: the provider's own button lives inside it, so
  // that box must stay a plain div (no interactive nesting).
  const slotTarget = payButtonSlot !== undefined ? payButtonSlotTarget : null;
  const slotFor = (target: CheckoutExpressProps["payButtonSlotTarget"]) =>
    slotTarget === target ? <div style={{ ...abs(0, 0, 398, 42) }}>{payButtonSlot}</div> : null;

  return (
    <div style={{ ...abs(0, top, 430, 230), background: "#FFF6EC", overflow: "hidden" }}>
      {/* 753:174 */}
      <Txt x={16} y={12} w={155} face="playfair" size={19} lh={25.33} weight={500} color="#3B2F2F">
        {heading}
      </Txt>

      {/* 753:175 Express / Shop Pay */}
      <Tap
        onClick={slotTarget === "shopPay" ? undefined : onShopPay}
        label="Pay with Shop Pay"
        style={{ ...abs(16, 45, 398, 42), background: "#4F26F2", borderRadius: 7, overflow: "hidden" }}
      >
        {slotFor("shopPay") ?? (
          <Txt x={165} y={12} w={68} size={15} lh={18} weight={500} color="#FFFFFF">
            {`shop${NB} Pay`}
          </Txt>
        )}
      </Tap>

      {/* 753:177 Express / PayPal */}
      <Tap
        onClick={slotTarget === "paypal" ? undefined : onPayPal}
        label="Pay with PayPal"
        style={{ ...abs(16, 95, 398, 42), background: "#FCB83B", borderRadius: 7, overflow: "hidden" }}
      >
        {slotFor("paypal") ?? (
          <Txt x={175} y={12} w={48} size={15} lh={18} weight={500} color="#0D478C">
            PayPal
          </Txt>
        )}
      </Tap>

      {/* 753:179 Express / Apple Pay */}
      <Tap
        onClick={slotTarget === "applePay" ? undefined : onApplePay}
        label="Pay with Apple Pay"
        style={{ ...abs(16, 145, 398, 42), background: "#0A0A0A", borderRadius: 7, overflow: "hidden" }}
      >
        {slotFor("applePay") ?? <Glyph src="753-180.svg" alt="Apple Pay" x={176.5} y={12} w={45} h={18} />}
      </Tap>

      {/* 753:181 Checkout Divider */}
      <div style={{ ...abs(16, 195, 398, 26), overflow: "hidden" }}>
        <div style={{ ...abs(0, 12.5, 112, 1), background: "#E5D9C9" }} />
        <Txt x={120} y={7.5} w={94} size={9} lh={10.8} weight={500} color="#8C8075">
          {dividerLabel}
        </Txt>
        <div style={{ ...abs(222, 12.5, 112, 1), background: "#E5D9C9" }} />
      </div>
    </div>
  );
}

/* ---------- 04 / Contact + Delivery Address (747:106) ---------- */

type FieldProps = {
  /** field frame, card-relative */
  x: number;
  y: number;
  w: number;
  label: string;
  labelW: number;
  /** the design's value-text box width */
  valueW: number;
  value: string;
  onChange?: (value: string) => void;
  name?: string;
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel" | "numeric";
};

/**
 * 753:187 etc. — label + value. The design fills these, so the static skin is
 * the value text; passing `onChange` swaps in a controlled input (the whole
 * 48px box becomes its label so the hit area is unchanged).
 */
function Field({
  x,
  y,
  w,
  label,
  labelW,
  valueW,
  value,
  onChange,
  name,
  autoComplete,
  inputMode = "text",
}: FieldProps) {
  const box: React.CSSProperties = { ...abs(x, y, w, 48), ...CARD, borderRadius: 7 };
  const labelEl = (
    <Txt x={9} y={5} w={labelW} {...FIELD_LABEL}>
      {label}
    </Txt>
  );
  if (!onChange) {
    return (
      <div style={box}>
        {labelEl}
        <Txt x={9} y={17} w={valueW} {...FIELD_VALUE} live>
          {value}
        </Txt>
      </div>
    );
  }
  return (
    <label style={box}>
      {labelEl}
      <input
        data-live-text
        className={`${notoSC.className} b2-ph-ink`}
        type="text"
        name={name}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-label={label}
        placeholder={value}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...abs(9, 17, valueW),
          ...INPUT_RESET,
          fontSize: FIELD_VALUE.size,
          lineHeight: `${FIELD_VALUE.lh}px`,
          fontWeight: FIELD_VALUE.weight,
          color: FIELD_VALUE.color,
        }}
      />
    </label>
  );
}

type SelectFieldProps = {
  x: number;
  y: number;
  w: number;
  label: string;
  labelW: number;
  valueW: number;
  value: string;
  /** the design string this node's Figma render bakes in (value + ⌄) */
  designValue: string;
  glyph: { src: string; w: number; h: number };
  options?: readonly string[];
  onChange?: (value: string) => void;
  name?: string;
  autoComplete?: string;
};

/**
 * 753:194 / 753:197 — Figma bakes "United States ⌄" into one glyph render, so
 * the untouched design state is that render. A callback (or a value the design
 * does not carry) switches to live text / a real <select>; the ⌄ is then the
 * right-hand crop of the same render, parked at the field's right inset.
 */
function SelectField({
  x,
  y,
  w,
  label,
  labelW,
  valueW,
  value,
  designValue,
  glyph,
  options,
  onChange,
  name,
  autoComplete,
}: SelectFieldProps) {
  const box: React.CSSProperties = { ...abs(x, y, w, 48), ...CARD, borderRadius: 7 };
  const labelEl = (
    <Txt x={9} y={5} w={labelW} {...FIELD_LABEL}>
      {label}
    </Txt>
  );
  const chevron = <Glyph src={glyph.src} alt="" x={w - 17} y={19} w={8} h={10} pos="right" />;

  if (onChange && options && options.length > 0) {
    return (
      <label style={box}>
        {labelEl}
        <select
          data-live-text
          className={notoSC.className}
          name={name}
          autoComplete={autoComplete}
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            ...abs(9, 17, valueW),
            ...INPUT_RESET,
            fontSize: FIELD_VALUE.size,
            lineHeight: `${FIELD_VALUE.lh}px`,
            fontWeight: FIELD_VALUE.weight,
            color: FIELD_VALUE.color,
          }}
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        {chevron}
      </label>
    );
  }
  if (onChange) {
    return (
      <label style={box}>
        {labelEl}
        <input
          data-live-text
          className={`${notoSC.className} b2-ph-ink`}
          type="text"
          name={name}
          autoComplete={autoComplete}
          aria-label={label}
          placeholder={value}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            ...abs(9, 17, valueW),
            ...INPUT_RESET,
            fontSize: FIELD_VALUE.size,
            lineHeight: `${FIELD_VALUE.lh}px`,
            fontWeight: FIELD_VALUE.weight,
            color: FIELD_VALUE.color,
          }}
        />
      </label>
    );
  }
  return (
    <div style={box}>
      {labelEl}
      {value === designValue ? (
        <Glyph
          src={glyph.src}
          alt={`${designValue} ⌄`}
          x={9}
          y={17}
          w={valueW}
          h={22}
        />
      ) : (
        <>
          <Txt x={9} y={17} w={valueW} {...FIELD_VALUE} live>
            {value}
          </Txt>
          {chevron}
        </>
      )}
    </div>
  );
}

export type CheckoutContactDeliveryProps = {
  /** module y in the 430-wide stage (747:106) */
  top?: number;
  contactHeading?: string;
  addressHeading?: string;
  email?: string;
  onEmailChange?: (value: string) => void;
  /** 753:190 is one Figma render (☑ + copy); the flag drives aria only */
  offersOptIn?: boolean;
  onToggleOffers?: () => void;
  country?: string;
  countryOptions?: readonly string[];
  onCountryChange?: (value: string) => void;
  state?: string;
  stateOptions?: readonly string[];
  onStateChange?: (value: string) => void;
  recipient?: string;
  onRecipientChange?: (value: string) => void;
  zip?: string;
  onZipChange?: (value: string) => void;
  street?: string;
  onStreetChange?: (value: string) => void;
  city?: string;
  onCityChange?: (value: string) => void;
  phone?: string;
  onPhoneChange?: (value: string) => void;
};

export function CheckoutContactDelivery({
  top = 631,
  contactHeading = "Contact Information",
  addressHeading = "Delivery Address",
  email = "sophia@example.com",
  onEmailChange,
  offersOptIn = true,
  onToggleOffers,
  country = "United States",
  countryOptions,
  onCountryChange,
  state = "California",
  stateOptions,
  onStateChange,
  recipient = "Sophia Chen",
  onRecipientChange,
  zip = "94103",
  onZipChange,
  street = "123 Rose Avenue · Apt 5B",
  onStreetChange,
  city = "San Francisco",
  onCityChange,
  phone = "+1 415 123 4567",
  onPhoneChange,
}: CheckoutContactDeliveryProps) {
  return (
    <div style={{ ...abs(0, top, 430, 410), background: "#FFF6EC", overflow: "hidden" }}>
      <FieldStyles />

      {/* 753:185 Contact Information */}
      <div style={{ ...abs(16, 10, 398, 108), ...CARD, borderRadius: 12 }}>
        <Txt x={12} y={10} w={167} face="playfair" size={18} lh={23.99} weight={500} color="#3B2F2F">
          {contactHeading}
        </Txt>
        <Field
          x={12}
          y={40}
          w={374}
          label="EMAIL"
          labelW={24}
          valueW={356}
          value={email}
          onChange={onEmailChange}
          name="email"
          autoComplete="email"
          inputMode="email"
        />
        {/* 753:190 — one render carrying the ☑ glyph and its copy */}
        <Tap
          onClick={onToggleOffers}
          role="checkbox"
          checked={offersOptIn}
          label="Send me private offers, gifting ideas and new arrivals."
          style={{ ...abs(12, 94, 374, 22) }}
        >
          <Glyph
            src="753-190.svg"
            alt="Send me private offers, gifting ideas and new arrivals."
            x={0}
            y={0}
            w={374}
            h={22}
          />
        </Tap>
      </div>

      {/* 753:191 Delivery Address */}
      <div style={{ ...abs(16, 128, 398, 270), ...CARD, borderRadius: 12 }}>
        <Txt x={12} y={10} w={138} face="playfair" size={18} lh={23.99} weight={500} color="#3B2F2F">
          {addressHeading}
        </Txt>
        <SelectField
          x={12}
          y={41}
          w={183}
          label="COUNTRY / REGION"
          labelW={74}
          valueW={165}
          value={country}
          designValue="United States"
          glyph={{ src: "753-196.svg", w: 75, h: 10 }}
          options={countryOptions}
          onChange={onCountryChange}
          name="country"
          autoComplete="country-name"
        />
        <SelectField
          x={203}
          y={41}
          w={183}
          label="STATE"
          labelW={24}
          valueW={165}
          value={state}
          designValue="California"
          glyph={{ src: "753-199.svg", w: 57, h: 10 }}
          options={stateOptions}
          onChange={onStateChange}
          name="state"
          autoComplete="address-level1"
        />
        <Field
          x={12}
          y={96}
          w={183}
          label="RECIPIENT"
          labelW={41}
          valueW={165}
          value={recipient}
          onChange={onRecipientChange}
          name="name"
          autoComplete="name"
        />
        <Field
          x={203}
          y={96}
          w={183}
          label="ZIP CODE"
          labelW={36}
          valueW={165}
          value={zip}
          onChange={onZipChange}
          name="postal-code"
          autoComplete="postal-code"
          inputMode="numeric"
        />
        <Field
          x={12}
          y={151}
          w={374}
          label="STREET ADDRESS"
          labelW={67}
          valueW={356}
          value={street}
          onChange={onStreetChange}
          name="address-line1"
          autoComplete="street-address"
        />
        <Field
          x={12}
          y={206}
          w={183}
          label="CITY"
          labelW={17}
          valueW={165}
          value={city}
          onChange={onCityChange}
          name="city"
          autoComplete="address-level2"
        />
        <Field
          x={203}
          y={206}
          w={183}
          label="PHONE"
          labelW={28}
          valueW={165}
          value={phone}
          onChange={onPhoneChange}
          name="tel"
          autoComplete="tel"
          inputMode="tel"
        />
      </div>
    </div>
  );
}

/* ---------- 05 / Shipping + Payment (747:107) ---------- */

/** 755:103 / 755:110 / 755:117 — card-relative geometry + design copy. */
const SHIP_ROWS = [
  { y: 50, name: "Standard Delivery", nameW: 86, sub: "3–5 business days", priceX: 341, priceW: 25, priceColor: "#09442E" },
  { y: 100, name: "Express Delivery", nameW: 78, sub: "2–3 business days", priceX: 334, priceW: 32, priceColor: "#3B2F2F" },
  { y: 150, name: "Next-Day Delivery", nameW: 85, sub: "Order before 2 PM", priceX: 334, priceW: 32, priceColor: "#3B2F2F" },
] as const;

export type PaymentMethod = "card" | "paypal" | "applePay" | "afterpay";

export type CheckoutShippingPaymentProps = {
  /** module y in the 430-wide stage (747:107) */
  top?: number;
  shippingHeading?: string;
  paymentHeading?: string;
  standardPrice?: string;
  expressPrice?: string;
  nextDayPrice?: string;
  /** 0-based; the design ships Standard selected */
  selectedShipping?: number;
  onSelectShipping?: (index: number) => void;
  /**
   * The design only ships the card-selected state and bakes the other rows'
   * ○ marks into their renders, so this drives aria state, not the art.
   */
  selectedPayment?: PaymentMethod;
  onSelectPayment?: (method: PaymentMethod) => void;
  cardNumber?: string;
  cardNumberPlaceholder?: string;
  onCardNumberChange?: (value: string) => void;
  cardName?: string;
  cardNamePlaceholder?: string;
  onCardNameChange?: (value: string) => void;
  cardExpiryCvv?: string;
  cardExpiryCvvPlaceholder?: string;
  onCardExpiryCvvChange?: (value: string) => void;
  /** 755:146 is one Figma render (☑ + copy); the flag drives aria only */
  savePayment?: boolean;
  onToggleSavePayment?: () => void;
};

/** 755:130 / 755:133 / 755:135 — empty-by-design card wells, so real inputs. */
function CardField({
  x,
  y,
  w,
  inputW,
  placeholder,
  name,
  autoComplete,
  value,
  onChange,
}: {
  x: number;
  y: number;
  w: number;
  inputW: number;
  placeholder: string;
  name: string;
  autoComplete: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label
      style={{
        ...abs(x, y, w, 36),
        boxShadow: HAIRLINE,
        borderRadius: 6,
        overflow: "hidden",
      }}
    >
      <input
        data-live-text
        className={`${notoSC.className} b2-ph-dim`}
        type="text"
        name={name}
        autoComplete={autoComplete}
        aria-label={placeholder}
        placeholder={placeholder}
        {...(value !== undefined ? { value } : {})}
        {...(onChange
          ? { onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value) }
          : { readOnly: value !== undefined })}
        style={{
          ...abs(10, 12, inputW),
          ...INPUT_RESET,
          fontSize: 10,
          lineHeight: "12px",
          fontWeight: 400,
          color: "#3B2F2F",
        }}
      />
    </label>
  );
}

export function CheckoutShippingPayment({
  top = 1041,
  shippingHeading = "Shipping Method",
  paymentHeading = "Payment",
  standardPrice = "FREE",
  expressPrice = "$14.99",
  nextDayPrice = "$24.99",
  selectedShipping = 0,
  onSelectShipping,
  selectedPayment = "card",
  onSelectPayment,
  cardNumber,
  cardNumberPlaceholder = "Card number",
  onCardNumberChange,
  cardName,
  cardNamePlaceholder = "Name on card",
  onCardNameChange,
  cardExpiryCvv,
  cardExpiryCvvPlaceholder = `MM / YY${NB} ${NB} ${NB} CVV`,
  onCardExpiryCvvChange,
  savePayment = true,
  onToggleSavePayment,
}: CheckoutShippingPaymentProps) {
  const prices = [standardPrice, expressPrice, nextDayPrice];
  return (
    <div style={{ ...abs(0, top, 430, 536), background: "#FFF6EC", overflow: "hidden" }}>
      <FieldStyles />

      {/* 755:101 Shipping Method */}
      <div style={{ ...abs(16, 10, 398, 178), ...CARD, borderRadius: 12 }}>
        <Txt x={12} y={10} w={140} face="playfair" size={18} lh={23.99} weight={500} color="#3B2F2F">
          {shippingHeading}
        </Txt>
        {SHIP_ROWS.map((r, i) => {
          const on = i === selectedShipping;
          return (
            <Tap
              key={r.name}
              onClick={onSelectShipping ? () => onSelectShipping(i) : undefined}
              role="radio"
              checked={on}
              label={`${r.name} — ${prices[i]}`}
              style={{
                ...abs(12, r.y, 374, 44),
                background: on ? "#FFF6EC" : "#FFFFFF",
                boxShadow: on ? GREEN_RING : HAIRLINE,
                borderRadius: 7,
                overflow: "hidden",
              }}
            >
              {/* 755:105 / 755:112 radio glyph */}
              <Glyph src={on ? "755-105.svg" : "755-112.svg"} alt="" x={8} y={14} w={13} h={16} />
              <Txt x={29} y={5} w={r.nameW} size={10} lh={12} weight={500} color="#3B2F2F">
                {r.name}
              </Txt>
              <Txt x={29} y={17} w={67} size={8} lh={9.6} weight={400} color="#8C8075">
                {r.sub}
              </Txt>
              <Txt x={r.priceX} y={16} w={r.priceW} size={10} lh={12} weight={500} color={r.priceColor} live>
                {prices[i]}
              </Txt>
            </Tap>
          );
        })}
      </div>

      {/* 755:124 Payment */}
      <div style={{ ...abs(16, 198, 398, 326), ...CARD, borderRadius: 12 }}>
        <Txt x={12} y={10} w={72} face="playfair" size={18} lh={23.99} weight={500} color="#3B2F2F">
          {paymentHeading}
        </Txt>
        {/* 755:127 VISA ●● AMEX */}
        <Glyph src="755-127.svg" alt="Visa, Mastercard and Amex accepted" x={304} y={10} w={82} h={12} />

        {/* 755:128 Credit Card Selected — stays a div: the card wells are real
            inputs and form controls cannot live inside a <button>, so the
            radio is the design's own "● Credit Card" label row. */}
        <div
          style={{
            ...abs(12, 41, 374, 126),
            background: "#FFF6EC",
            boxShadow: GREEN_RING,
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <Tap
            onClick={onSelectPayment ? () => onSelectPayment("card") : undefined}
            role="radio"
            checked={selectedPayment === "card"}
            label="Pay by credit card"
            style={{ ...abs(8, 8, 76, 13) }}
          >
            <Glyph src="755-129.svg" alt="Credit Card" x={0} y={0} w={76} h={13} />
          </Tap>
          <CardField
            x={8}
            y={27}
            w={358}
            inputW={338}
            placeholder={cardNumberPlaceholder}
            name="cc-number"
            autoComplete="cc-number"
            value={cardNumber}
            onChange={onCardNumberChange}
          />
          <CardField
            x={8}
            y={69}
            w={171}
            inputW={151}
            placeholder={cardNamePlaceholder}
            name="cc-name"
            autoComplete="cc-name"
            value={cardName}
            onChange={onCardNameChange}
          />
          <CardField
            x={187}
            y={69}
            w={179}
            inputW={159}
            placeholder={cardExpiryCvvPlaceholder}
            name="cc-exp"
            autoComplete="cc-exp"
            value={cardExpiryCvv}
            onChange={onCardExpiryCvvChange}
          />
        </div>

        {/* 755:137 Payment / PayPal — bottom-only 1px stroke */}
        <Tap
          onClick={onSelectPayment ? () => onSelectPayment("paypal") : undefined}
          role="radio"
          checked={selectedPayment === "paypal"}
          label="Pay with PayPal"
          style={{ ...abs(12, 174, 374, 36), boxShadow: BOTTOM_HAIRLINE, overflow: "hidden" }}
        >
          <Glyph src="755-138.svg" alt="PayPal" x={8} y={12} w={47} h={12} />
          <Txt x={334} y={12} w={32} size={10} lh={12} weight={500} color="#144DB2">
            PayPal
          </Txt>
        </Tap>

        {/* 755:140 — the whole row (○ mark, copy,  Pay and its rule) is one render */}
        <Tap
          onClick={onSelectPayment ? () => onSelectPayment("applePay") : undefined}
          role="radio"
          checked={selectedPayment === "applePay"}
          label="Pay with Apple Pay"
          style={{ ...abs(12, 217, 374, 36) }}
        >
          <img
            src={`${A}/755-140.svg`}
            alt="Apple Pay"
            width={374}
            height={36}
            style={{ ...abs(0, 0, 374, 36), display: "block" }}
          />
        </Tap>

        {/* 755:143 — likewise for Afterpay */}
        <Tap
          onClick={onSelectPayment ? () => onSelectPayment("afterpay") : undefined}
          role="radio"
          checked={selectedPayment === "afterpay"}
          label="Pay with Afterpay"
          style={{ ...abs(12, 260, 374, 36) }}
        >
          <img
            src={`${A}/755-143.svg`}
            alt="Afterpay"
            width={374}
            height={36}
            style={{ ...abs(0, 0, 374, 36), display: "block" }}
          />
        </Tap>

        {/* 755:146 — one render carrying the ☑ glyph and its copy */}
        <Tap
          onClick={onToggleSavePayment}
          role="checkbox"
          checked={savePayment}
          label="Save payment details for faster checkout next time."
          style={{ ...abs(12, 303, 374, 22) }}
        >
          <Glyph
            src="755-146.svg"
            alt="Save payment details for faster checkout next time."
            x={0}
            y={0}
            w={374}
            h={22}
          />
        </Tap>
      </div>
    </div>
  );
}

/* ---------- 06 / Summary + Help + Secure CTA (747:108) ---------- */

/** 756:121 / 756:124 / 756:127 — FAQ rows, module-relative. */
const FAQS = [
  { y: 234, q: "Delivery & Returns", w: 103 },
  { y: 280, q: "Privacy & Security", w: 101 },
  { y: 326, q: "Frequently Asked Questions", w: 156 },
] as const;

export type CheckoutSummaryCtaProps = {
  /** module y in the 430-wide stage (747:108) */
  top?: number;
  summaryHeading?: string;
  subtotalLabel?: string;
  subtotal?: string;
  discountLabel?: string;
  discount?: string;
  shippingLabel?: string;
  shipping?: string;
  /** 756:111 is green because the design's shipping is FREE — override if not */
  shippingColor?: string;
  totalLabel?: string;
  total?: string;
  /** 756:131 — the pay bar's own amount */
  barTotal?: string;
  /** 756:132 label — "PAY $159.00 SECURELY" */
  payLabel?: string;
  onPay?: () => void;
  /**
   * Rendered INSIDE the 276×48 CTA box instead of its label + arrow — for the
   * PayPal SDK's own iframe button, which cannot be restyled.
   */
  payButtonSlot?: React.ReactNode;
  helpTitle?: string;
  helpBody?: string;
  onAskAuri?: () => void;
  faqs?: readonly string[];
  /** index of the open row (aria + a 45° turn of the ＋ glyph) */
  expandedFaq?: number | null;
  onToggleFaq?: (index: number) => void;
};

export function CheckoutSummaryCta({
  top = 1577,
  summaryHeading = "Order Summary",
  subtotalLabel = "Subtotal",
  subtotal = "$189.00",
  discountLabel = "Discount (15%)",
  discount = "−$28.35",
  shippingLabel = "Shipping",
  shipping = "FREE",
  shippingColor = "#09442E",
  totalLabel = "Order Total",
  total = "$159.00",
  barTotal = "$159.00",
  payLabel = "PAY $159.00 SECURELY",
  onPay,
  payButtonSlot,
  helpTitle = "Need help? Ask Auri.",
  helpBody = "Expert checkout help, 24/7.",
  onAskAuri,
  faqs,
  expandedFaq = null,
  onToggleFaq,
}: CheckoutSummaryCtaProps) {
  return (
    <div style={{ ...abs(0, top, 430, 500), background: "#FFFFFF", overflow: "hidden" }}>
      {/* 756:101 Final Order Summary */}
      <div
        style={{
          ...abs(16, 10, 398, 150),
          background: "#FFF6EC",
          boxShadow: HAIRLINE,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <Txt x={20} y={10} w={133} face="playfair" size={18} lh={23.99} weight={500} color="#3B2F2F">
          {summaryHeading}
        </Txt>

        {/* 756:103 Total / Subtotal */}
        <Txt x={20} y={42.5} w={44} size={11} lh={13.2} weight={400} color="#3B2F2F">
          {subtotalLabel}
        </Txt>
        <Txt x={337} y={42.5} w={41} size={11} lh={13.2} weight={500} color="#3B2F2F" live>
          {subtotal}
        </Txt>

        {/* 756:106 Total / Discount */}
        <Txt x={20} y={68.5} w={78} size={11} lh={13.2} weight={400} color="#3B2F2F" live>
          {discountLabel}
        </Txt>
        {discount === "−$28.35" ? (
          // 756:108 — Figma bakes the U+2212 minus into a render; live values
          // fall through to DOM text below.
          <Glyph src="756-108.svg" alt={discount} x={337} y={68.5} w={41} h={13} />
        ) : (
          <Txt x={337} y={68.5} w={41} size={11} lh={13.2} weight={500} color="#B82924" live>
            {discount}
          </Txt>
        )}

        {/* 756:109 Total / Shipping */}
        <Txt x={20} y={94.5} w={46} size={11} lh={13.2} weight={400} color="#3B2F2F">
          {shippingLabel}
        </Txt>
        <Txt x={351} y={94.5} w={27} size={11} lh={13.2} weight={500} color={shippingColor} live>
          {shipping}
        </Txt>

        {/* 756:112 Total / Order Total */}
        <Txt x={20} y={121.5} w={89} face="playfair" size={17} lh={22.66} weight={500} color="#3B2F2F">
          {totalLabel}
        </Txt>
        <Txt x={297} y={117} w={81} face="playfair" size={24} lh={31.99} weight={500} color="#3B2F2F" live>
          {total}
        </Txt>
      </div>

      {/* 756:115 Auri Checkout Help */}
      <div
        style={{
          ...abs(16, 168, 398, 58),
          background: "#FFF6EC",
          boxShadow: HAIRLINE,
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <Glyph src="756-116.svg" alt="✦" x={12} y={13} w={21} h={32} />
        <Txt x={43} y={9} w={130} face="playfair" size={14} lh={18.66} weight={500} color="#3B2F2F">
          {helpTitle}
        </Txt>
        <Txt x={43} y={29} w={114} size={9} lh={10.8} weight={400} color="#3B2F2F">
          {helpBody}
        </Txt>
        <Tap onClick={onAskAuri} label="Ask Auri" style={{ ...abs(301, 23.5, 53, 11) }}>
          <Glyph src="756-120.svg" alt={`ASK AURI${NB} →`} x={0} y={0} w={53} h={11} />
        </Tap>
      </div>

      {/* 756:121 / 756:124 / 756:127 FAQ rows — bottom-only 1px stroke */}
      {FAQS.map((row, i) => {
        const open = expandedFaq === i;
        return (
          <Tap
            key={row.q}
            onClick={onToggleFaq ? () => onToggleFaq(i) : undefined}
            expanded={onToggleFaq ? open : undefined}
            style={{ ...abs(16, row.y, 398, 38), boxShadow: BOTTOM_HAIRLINE }}
          >
            <Txt x={16} y={12} w={row.w} size={12} lh={14.4} weight={400} color="#3B2F2F">
              {faqs?.[i] ?? row.q}
            </Txt>
            {/* ＋ render; the design has no open state, so it turns 45° */}
            <img
              src={`${A}/I753-103_151-55.svg`}
              alt={open ? "Collapse" : "Expand"}
              style={{
                ...abs(364, 8, 18, 22),
                display: "block",
                objectFit: "none",
                objectPosition: "left center",
                ...(open ? { transform: "rotate(45deg)" } : {}),
              }}
            />
          </Tap>
        );
      })}

      {/* 756:130 Secure Pay Bar */}
      <div style={{ ...abs(16, 372, 398, 58), overflow: "hidden" }}>
        <Txt x={8} y={15} w={71} face="playfair" size={21} lh={27.99} weight={500} color="#3B2F2F" live>
          {barTotal}
        </Txt>
        {/* 756:132 CTA / Pay Securely (clipsContent false — no overflow hidden).
            A filled slot owns the box: the provider's own button lives inside
            it, so the box stays a plain div (no interactive nesting). */}
        <Tap
          onClick={payButtonSlot !== undefined ? undefined : onPay}
          label={payLabel}
          style={{ ...abs(118, 5, 276, 48), background: "#3B2F2F", borderRadius: 10 }}
        >
          {payButtonSlot !== undefined ? (
            <div style={{ ...abs(0, 0, 276, 48) }}>{payButtonSlot}</div>
          ) : (
            <>
              <Txt x={49.5} y={17} w={150} size={12} lh={14.4} weight={500} ls={1.1} color="#FFF6EC" live>
                {payLabel}
              </Txt>
              <Glyph src="I753-116_145-55.svg" alt="" x={211.5} y={15} w={15} h={18} />
            </>
          )}
        </Tap>
      </div>
    </div>
  );
}
