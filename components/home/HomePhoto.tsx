/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * One `<img>` that renders the DESIGN's photo exactly as Figma traced it, and
 * an OWNER's replacement sensibly — from the same registry slot.
 *
 * WHY THIS EXISTS
 * Most homepage photos are not "a picture in a box". They are a hand-picked
 * rectangle of a much larger source, shown through a small opening: A-3's row
 * photo is a 588×896 picture slid to (-34, -689) behind a 170×99 window, and
 * the occasion and recipient cards are three different windows onto ONE 546×912
 * sprite. Those offsets were traced from the frame, and they are meaningless
 * for any other image — a teammate who uploads a normal photo would get a blank
 * corner of it, which is a worse outcome than not being able to edit at all.
 *
 * So the fit is chosen by whether the value is still the design's:
 * - still the design → draw Figma's geometry verbatim, down to the negative
 *   offsets, so the untouched page stays byte-identical to the import and the
 *   pixel baselines (tests/e2e/pixels.spec.ts) keep passing;
 * - replaced by the owner → ignore that geometry and fill the opening with
 *   `object-fit: cover`, which is what "put my photo here" means to everyone
 *   who is not holding the Figma file.
 *
 * This is the same shape as the promo bar's `isDefault` switch (design SVG
 * until edited, live text afterwards) — see components/chrome.tsx.
 */

import { abs } from "@/lib/figma-layout";
import { fileUrl } from "@/lib/files-url";
import { homeDefault } from "@/lib/home-content/registry";

/** Figma's own placement of the design photo, relative to its opening. */
export type PhotoDesign = {
  /** Offsets and size verbatim from the frame; x/y are negative when it bleeds. */
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  /** Omitted where the design stretches the render to its box. */
  readonly objectFit?: "cover" | "none";
  readonly objectPosition?: string;
  readonly borderRadius?: number | string;
};

/**
 * A homepage photo that follows the registry.
 *
 * @param section - The registry section that owns the slot, e.g. `"ready"`.
 * @param field - The image field's id, e.g. `"card_photo"`.
 * @param value - The resolved value: the design default, or the owner's path.
 * @param alt - The resolved photo description.
 * @param box - The opening the photo is seen through, in stage pixels.
 * @param design - Figma's placement, used only while `value` is the default.
 * @param dataEl - Optional `data-el` name for the element-naming convention.
 * @param className - Optional class, e.g. the shared `gr-photo` zoom.
 * @returns The image, placed the design's way or the owner's way.
 */
export function HomePhoto({
  section,
  field,
  value,
  alt,
  box,
  design,
  dataEl,
  className,
}: {
  section: string;
  field: string;
  value: string;
  alt: string;
  box: { readonly w: number; readonly h: number };
  design: PhotoDesign;
  dataEl?: string;
  className?: string;
}) {
  const isDesign = value === homeDefault(section, field);

  // `maxWidth: none` on both branches: the design renders are wider than their
  // opening on purpose, and Tailwind preflight's `img { max-width: 100% }`
  // would otherwise shrink them and move the crop.
  const style = isDesign
    ? {
        ...abs(design.x, design.y, design.w, design.h),
        display: "block" as const,
        objectFit: design.objectFit,
        objectPosition: design.objectPosition,
        borderRadius: design.borderRadius,
        maxWidth: "none" as const,
      }
    : {
        ...abs(0, 0, box.w, box.h),
        display: "block" as const,
        objectFit: "cover" as const,
        objectPosition: "center center",
        maxWidth: "none" as const,
      };

  return (
    <img
      data-el={dataEl}
      className={className}
      src={fileUrl(value)}
      alt={alt}
      width={isDesign ? design.w : box.w}
      height={isDesign ? design.h : box.h}
      style={style}
    />
  );
}
