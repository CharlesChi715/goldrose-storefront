/**
 * ROLE OF THIS FILE
 * Reflecting a keystroke in the preview without asking the server.
 *
 * The preview is a server-rendered page in a same-origin iframe, so the parent
 * can write into its DOM directly. That is the only way "live as you type" is
 * affordable: re-rendering the route per keystroke is a force-dynamic render
 * that reads `site_content` in full.
 *
 * WHAT MAKES THIS SAFE
 * Every band child is absolutely positioned at a traced Figma coordinate, so a
 * longer string can only overflow its own box — it can never re-stack the page.
 * And React will not undo the write: reconciliation only touches a DOM node when
 * its own vdom value changes, and these strings arrive as server props that never
 * change for the life of the frame. That holds even inside the carousels, which
 * re-render every 4.2 seconds.
 *
 * WHAT IS NOT SAFE, AND IS REFUSED
 * Three kinds cannot be faked and say so instead of lying:
 * - `number` — the rail timings are resolved server-side into a `setInterval` and
 *   a transition string React owns. Nudging the style survives one autoplay tick.
 * - section visibility — hiding a band recomputes a translateY for every later
 *   band and shrinks the stage; there is not even a wrapper element to move while
 *   nothing is hidden.
 * - `artwork` / `managed` — there is no value in the DOM to write.
 *
 * TWO SLOTS SWAP ELEMENT TYPE WHEN THEY STOP BEING THE DESIGN'S
 * The promo slogan renders as Figma's own image until it is edited and becomes
 * live text; `HomePhoto` draws Figma's traced bleed crop until the photo is
 * replaced and then fills its window. Writing only `textContent` or only `src`
 * would do nothing, or the wrong thing, on exactly the first keystroke that
 * matters. Both are handled below.
 */

import type { FieldView } from "../HomeSectionsEditor";

/** What a patch attempt did, so the caller can tell the owner the truth. */
export type PatchResult = "patched" | "needs-reload" | "no-target";

/**
 * Resolve a stored image path to a URL the browser can load. Mirrors
 * lib/files-url, which is client-safe but lives outside this folder.
 *
 * @param storedPath - The value held in an image field.
 * @returns A loadable URL.
 */
function fileUrl(storedPath: string): string {
  if (storedPath.startsWith("/") || storedPath.startsWith("http")) {
    return storedPath;
  }
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  return `${base}/storage/v1/object/public/product-images/${storedPath}`;
}

/**
 * Write a photo into an `<img>`, switching geometry the way HomePhoto does.
 *
 * HomePhoto draws Figma's traced crop while the value is still the design's — a
 * 588×896 picture slid to (-34,-689) behind a 170×99 window, say — and flips to
 * a plain cover fill of the window the moment it is not. So the first change
 * away from the default has to rewrite the geometry too, and changing back has
 * to restore it. The original values are stashed on the element the first time
 * it is touched, because they are the only record of the design's own crop.
 *
 * @param img - The image element in the preview.
 * @param field - The registry field, carrying its design box.
 * @param value - The owner's chosen path.
 */
function patchPhoto(img: HTMLImageElement, field: FieldView, value: string) {
  const design = img.dataset.designGeometry
    ? (JSON.parse(img.dataset.designGeometry) as Record<string, string>)
    : null;

  if (!design) {
    img.dataset.designGeometry = JSON.stringify({
      left: img.style.left,
      top: img.style.top,
      width: img.style.width,
      height: img.style.height,
      transform: img.style.transform,
      objectFit: img.style.objectFit,
      objectPosition: img.style.objectPosition,
      borderRadius: img.style.borderRadius,
    });
  }

  img.src = fileUrl(value);

  if (value === field.defaultValue) {
    // Back to the design: restore the crop exactly as it was traced.
    const saved = design ?? JSON.parse(img.dataset.designGeometry as string);
    for (const [property, css] of Object.entries(saved)) {
      img.style.setProperty(
        property.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`),
        css as string,
      );
    }
    return;
  }

  // Somebody's own photo: fill the window, centred, like HomePhoto does.
  if (field.box) {
    img.style.left = "0px";
    img.style.top = "0px";
    img.style.width = `${field.box.w}px`;
    img.style.height = `${field.box.h}px`;
    img.style.transform = "";
    img.style.objectFit = "cover";
    img.style.objectPosition = "center center";
    img.style.borderRadius = "";
  }
}

/**
 * The promo slogan swaps between Figma's rendered pixels and live text.
 *
 * While it equals the design it is an `<img>` of the frame's own strip; edited,
 * it becomes a `<div>` of text at slightly different coordinates. A live patch
 * therefore has to build the missing element the first time, rather than write
 * into one that cannot show text.
 *
 * @param element - Whichever of the two is currently on the page.
 * @param field - The registry field.
 * @param value - The owner's slogan.
 * @returns True when the preview now shows the new value.
 */
function patchSlogan(
  element: Element,
  field: FieldView,
  value: string,
): boolean {
  const doc = element.ownerDocument;
  if (element.tagName === "DIV") {
    element.textContent = value;
    return true;
  }

  // It is still Figma's image. Reverting to the design keeps it as it is.
  if (value === field.defaultValue) return true;

  const img = element as HTMLImageElement;
  const live = doc.createElement("div");
  live.setAttribute("data-field", "promo.slogan");
  live.className = img.className;
  // The design's own text box: same left/width, 6px from the top, 20 tall.
  live.style.cssText = img.style.cssText;
  live.style.top = `${parseFloat(img.style.top || "0") - 5}px`;
  live.style.height = "20px";
  live.style.color = "#D4AF37";
  live.style.fontSize = "8.5px";
  live.style.fontWeight = "500";
  live.style.lineHeight = "20px";
  live.style.textAlign = "center";
  live.style.whiteSpace = "nowrap";
  live.style.overflow = "hidden";
  live.style.textOverflow = "ellipsis";
  live.textContent = value;
  img.replaceWith(live);
  return true;
}

/**
 * Show a field's new value in the preview, if it can honestly be shown.
 *
 * @param doc - The preview's document.
 * @param field - The registry field being edited.
 * @param key - Its `"<section>.<id>"` key.
 * @param value - The draft value.
 * @returns What happened, so the caller can say "save to see this" when it must.
 */
export function patchField(
  doc: Document,
  field: FieldView,
  key: string,
  value: string,
): PatchResult {
  if (field.kind === "number") return "needs-reload";
  if (field.kind === "artwork" || field.kind === "managed") {
    return "needs-reload";
  }

  const elements = [...doc.querySelectorAll(`[data-field~="${key}"]`)];
  if (elements.length === 0) return "no-target";

  for (const element of elements) {
    if (key === "promo.slogan") {
      patchSlogan(element, field, value);
      continue;
    }
    if (field.kind === "image") {
      // The tag may sit on the img itself, or on a wrapper.
      const img =
        element.tagName === "IMG"
          ? (element as HTMLImageElement)
          : element.querySelector("img");
      if (img) patchPhoto(img, field, value);
      continue;
    }
    if (field.kind === "url") {
      // Cosmetic: these are next/link anchors and the router reads the href from
      // React props, so the click still goes to the saved destination. Written
      // anyway so hovering the preview shows the new target in the status bar.
      element.setAttribute("href", value);
      continue;
    }
    // text / multiline. textContent, never innerText: the design's boxes are
    // `white-space: pre-line`, so a literal newline must survive, and innerText
    // normalises whitespace differently. Several defaults also carry
    // load-bearing non-breaking spaces — nothing here trims.
    element.textContent = value;
  }
  return "patched";
}

/**
 * Whether the preview has hydrated enough to be written into.
 *
 * The rails are client components hydrating over server HTML. A text patch
 * applied in the window between `load` and hydration is a mismatch, and React 19
 * resolves a mismatch by re-rendering the subtree from its own props — silently
 * reverting the edit. There is no exposed "hydrated" signal, so this waits for
 * the document to be complete and then for two animation frames, which is after
 * React's first commit in practice.
 *
 * @param frameWindow - The preview's window.
 * @returns Resolves once patching is safe.
 */
export function whenPatchable(frameWindow: Window): Promise<void> {
  return new Promise((resolve) => {
    const settle = () =>
      frameWindow.requestAnimationFrame(() =>
        frameWindow.requestAnimationFrame(() => resolve()),
      );
    if (frameWindow.document.readyState === "complete") settle();
    else frameWindow.addEventListener("load", settle, { once: true });
  });
}
