"use client";

/**
 * ROLE OF THIS FILE
 * The live preview that opens every section on Content → Home page: the real
 * home page, at the size the page-wide preview shows it, held still over this
 * one band.
 *
 * WHY IT IS A WINDOW AND NO LONGER A PICTURE OF A BAND
 * It used to load a route that drew one band alone and then shrank it until the
 * whole band fitted — which put Craft and Story on screen at 39%. Type at 39%
 * is not type you can judge, so the preview answered a question nobody had
 * ("what shape is this band?") and refused the one everybody has ("does my
 * wording look right?"). It is now the same document the page-wide preview
 * loads, at the same scale, in a shorter window: what you see is what a visitor
 * sees, including the seam where this band meets the ones around it.
 *
 * WHY YOU CANNOT SCROLL OUT OF THE SECTION
 * The lock is structural, not policed. Three boxes:
 *
 *   window   overflow-y: auto, a fixed height — the thing you scroll
 *   └ rail   exactly one band tall (plus slack), overflow: CLIP
 *     └ film the whole 5000px page, absolutely positioned, pulled up by filmTop
 *
 * Because the rail clips, the film's thousands of pixels never reach the
 * window's scrollable overflow: the window's scroll range IS the rail's height
 * minus its own, which is one band. The browser then refuses to scroll past
 * either end by itself. There is no scroll listener, so there is nothing to
 * lose a race with, nothing to snap back, and a hard trackpad fling stops dead
 * at the seam instead of bouncing. `overscrollBehavior: "contain"` keeps that
 * gesture from carrying on into the ~26,000px editor behind it, which is the
 * one way "you cannot leave the section" could still have been false.
 *
 * `clip` and not `hidden` is load-bearing, and it is the subtle half of this
 * design: `hidden` would clip just the same, while ALSO making the rail a
 * scroll container that the user cannot move and the browser still can. See the
 * note at the rail itself.
 *
 * THE FRAME IS SHUT: no pointer, no focus, no scrolling of its own.
 * `pointerEvents: "none"` puts the wheel on the window rather than on a
 * document that cannot scroll. It does NOT stop a keyboard, so `tabIndex={-1}`
 * does — otherwise Tab walks out of the window into 5,000 pixels of storefront
 * links, and a followed link would leave the frame showing a page that none of
 * this arithmetic describes. `scrolling="no"` closes the last one: the document
 * is taller than the stage, so the frame would otherwise scroll too.
 *
 * WHAT IT CANNOT SHOW
 * A switched-off section is not on the page: `HomeBand` draws nothing and
 * `homeLayout` closes the gap, so the offset it used to hold now belongs to the
 * next band. There is no honest window onto it, so the card says so instead of
 * showing the wrong section under the right name.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BlockStack,
  Box,
  Button,
  InlineStack,
  Text,
  Tooltip,
} from "@shopify/polaris";
import { homePreviewWindow } from "@/lib/home-content/preview";
import { useAdminT } from "../../../PolarisShell";
import { PickerLayer } from "./picker/PickerLayer";
import { usePickerPointer } from "./picker/usePicker";
import type { FieldScope } from "./picker/fieldIndex";

/** The design's own canvas width — the width every scale is measured against. */
const DESIGN_WIDTH = 430;

/**
 * How tall a section's window is, in admin pixels.
 *
 * Deliberately shorter than the page-wide preview's 620: this one answers "how
 * does this band read", which does not need a phone's whole screen, and nine
 * full-height frames would bury the fields between them. At 360 it is 58% of
 * the main preview — far enough apart to read as a decision rather than as a
 * rendering accident.
 *
 * Only the promo strip fits whole and so never scrolls: at 32 design pixels
 * plus both slacks it is 128, well inside 360. Every real band scrolls at the
 * design width, including the shortest — Ready to Ship is 327, which with its
 * slacks is 423 and leaves 63 pixels of travel.
 */
const WINDOW_HEIGHT = 360;

/**
 * How far past the band you may scroll, in DESIGN pixels.
 *
 * Stated in design pixels rather than admin ones so that the amount of PAGE you
 * can peek at is the same whatever width the slider is on — otherwise the lock
 * would quietly loosen as the phone got narrower.
 *
 * 48 because the thing you cannot judge from inside a band is where it meets
 * its neighbour: 48 design pixels is about a line and a half of body copy, so
 * the seam, the next band's background and its top edge are all plainly there,
 * and it is never enough to read the neighbour and mistake it for this section.
 * Two slacks come to 96, which is 29% of the shortest real band (Ready to Ship,
 * 327) — a peek rather than a second section. It is also 1.5× the promo strip's
 * own height and a multiple of 8, so nothing lands on a half pixel at 2×.
 */
const SLACK = 48;

/**
 * One section's live preview: the home page, held over this band.
 *
 * @param props.sectionId - The section this card opens.
 * @param props.y - The band's first pixel on the live stage, in design pixels.
 * @param props.h - The band's drawn height, in design pixels.
 * @param props.onPage - False when that band is not on the live page, so there
 *   is nothing to hold a window over.
 * @param props.borrowed - True when this section has nothing of its own and the
 *   window is held over another section's band (the rail speed).
 * @param props.hidden - True when the owner has switched THIS section off.
 * @param props.stale - True when this section has an unsaved edit, so the frame
 *   is showing something older than what the fields below it say.
 * @param props.width - The width the page-wide preview is set to; the section
 *   previews follow it, because a frame at another width is at another scale.
 * @param props.maxWidth - The widest selectable width, used to reserve the row.
 * @param props.frameHeight - The live stage height, from `homeLayout()`.
 * @param props.nonce - Bumped by the parent after every save, to reload.
 * @param props.scope - The field keys this section owns; the window offers no
 *   others, however much of a neighbouring band peeks into the slack.
 * @param props.selectedKey - The field being edited, when it is one of ours.
 * @param props.panelRef - The docked editor beside this window, for the curve.
 * @param props.onPick - Called with the keys of whatever is clicked.
 * @param props.onFrame - Told about this card's frame as it mounts and goes, so
 *   the screen can write drafts into it.
 * @returns The preview that opens the section.
 */
export function SectionPreview({
  sectionId,
  y,
  h,
  onPage,
  borrowed,
  hidden,
  stale,
  width,
  maxWidth,
  frameHeight,
  nonce,
  scope = null,
  selectedKey = null,
  panelRef,
  onPick,
  onFrame,
}: {
  sectionId: string;
  y: number;
  h: number;
  onPage: boolean;
  borrowed: boolean;
  hidden: boolean;
  stale: boolean;
  width: number;
  maxWidth: number;
  frameHeight: number;
  nonce: number;
  scope?: FieldScope;
  selectedKey?: string | null;
  panelRef?: React.RefObject<HTMLDivElement | null>;
  onPick?: (keys: string[]) => void;
  onFrame?: (frame: HTMLIFrameElement | null) => (() => void) | void;
}) {
  const t = useAdminT();
  // Reloading this one frame without disturbing the other eight.
  const [refreshed, setRefreshed] = useState(0);
  const key = `${nonce}-${refreshed}`;
  // Whether the window has keyboard focus, so it can show a ring — see below.
  const [focused, setFocused] = useState(false);

  /**
   * Whether this frame has come near the viewport yet — nothing is fetched
   * before it does.
   *
   * Nine of these sit on a ~26,000px page and the last is 25,000px down, so
   * mounting them all would open the screen with nine copies of the home page
   * at once, and would do it AGAIN on every save, because a save re-keys every
   * frame. `loading="lazy"` is on the iframe too, but it is only a hint: a
   * plain lazy iframe 30,000px down a test page was fetched immediately by the
   * browser this was checked in. This observer is the part that actually holds.
   * Once a frame has been reached it stays mounted, so scrolling back and forth
   * does not re-fetch, and a save still refreshes what the owner can see.
   */
  const stageRef = useRef<HTMLDivElement>(null);
  const [reached, setReached] = useState(false);
  useEffect(() => {
    const node = stageRef.current;
    if (!node || reached) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setReached(true);
          observer.disconnect();
        }
      },
      // Loaded a screenful early, so it is there by the time you arrive.
      { rootMargin: "800px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [reached]);

  /**
   * Whether this card is on screen NOW — which `reached` deliberately is not.
   *
   * `reached` latches, because a frame once fetched should stay. This does the
   * opposite job: it decides whether the picker's frame loop is worth running,
   * and there are up to nine of them down a ~26,000px page. Without it, arming
   * would start nine loops for the one or two windows a person can actually
   * see. No rootMargin: a card just off the edge is a card whose highlights
   * nobody is looking at.
   */
  const [onScreen, setOnScreen] = useState(false);
  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      setOnScreen(entries.some((entry) => entry.isIntersecting));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  /**
   * This card's frame, told to the screen as it comes and goes.
   *
   * The screen writes drafts straight into every mounted preview — that is how
   * typing shows up in the very window you pointed at — so it has to know which
   * frames exist. A ref callback is the only thing that knows both, and React
   * 19's cleanup form means the frame is dropped on the exact unmount rather
   * than on a later null call.
   */
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const holdFrame = useCallback(
    (node: HTMLIFrameElement | null) => {
      frameRef.current = node;
      // The screen hands back its own release, so it never has to work out
      // WHICH frame just went — this closure already knows.
      const release = onFrame?.(node);
      return () => {
        if (frameRef.current === node) frameRef.current = null;
        release?.();
      };
    },
    [onFrame],
  );

  /**
   * Pointing, on the WINDOW rather than on a layer over it.
   *
   * The film is already `pointer-events: none`, so a click here cannot reach
   * the storefront's links and needs no capture layer to stop it. Nothing calls
   * `preventDefault`, so the wheel is never taken off the browser: this window
   * scrolls natively, with momentum, chaining and touch intact.
   *
   * ALWAYS ON, NO ARMING (owner, 2026-08-08)
   * There used to be a screen-wide switch. It existed when arming installed a
   * transparent capture layer that had to swallow the wheel — turning that on
   * cost you the ability to scroll, so it had to be something you turned off
   * again. With the layer gone the switch guarded nothing: a click on this
   * window did nothing whatever while disarmed, and the only thing it achieved
   * was hiding the feature from anybody who did not know to look for it.
   *
   * What DID need a switch was the other half: outlining everything editable
   * covers the preview in dashes, and this card's whole job is to show how the
   * page actually looks. So that half follows the POINTER instead — the window
   * you are working in shows its outlines, and the eight you are not stay
   * clean. Both of the owner's original asks survive; neither needs a control.
   */
  const { pointer, onPointerDown, onPointerMove, onPointerLeave, onClick } =
    usePickerPointer({
      iframeRef: frameRef,
      scope,
      onPick: onPick ?? (() => {}),
    });
  const [hovered, setHovered] = useState(false);
  const pointing = onPage && reached;

  const scale = width / DESIGN_WIDTH;
  const { railHeight, filmTop, range, parkAt } = homePreviewWindow(
    { y, h },
    frameHeight,
    scale,
    WINDOW_HEIGHT,
    SLACK,
  );

  /**
   * Open the window on the band itself, with the slack above it out of sight.
   *
   * Set once per geometry rather than on every scroll: this is where the window
   * OPENS, not a rule about where it may stay. Re-running it when the width or
   * the reload key changes keeps the band under the eye after a save, which is
   * the moment a teammate is looking hardest.
   */
  const windowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = windowRef.current;
    if (node) node.scrollTop = parkAt;
  }, [parkAt, key, reached]);

  // Centred by arithmetic rather than by `justify-content`, so the offset is
  // always a whole pixel. Flex halves the free space, and the free space is odd
  // at about half the slider's positions — which would put the box's left edge,
  // its 1px border and the band's flush-left content on a half CSS pixel, and
  // alternating between the two on every step of a drag is a shimmer.
  const boxLeft = Math.round((maxWidth - width) / 2);

  return (
    <Box background="bg-surface-secondary" borderRadius="200" padding="200">
      {/* Every row here earns its height: the block repeats nine times, so a
          line of prose that reads well once is nine lines of scrolling on the
          screen. The explanation lives in the title's tooltip instead. */}
      <BlockStack gap="150">
        <InlineStack align="space-between" blockAlign="center" gap="200">
          <Tooltip content={t("home.sectionPreviewHelp")}>
            <Text as="h3" variant="bodySm" fontWeight="semibold" tone="subdued">
              {t("home.sectionPreview")}
            </Text>
          </Tooltip>
          <Button
            variant="plain"
            onClick={() => setRefreshed((count) => count + 1)}
          >
            {t("home.refreshPreview")}
          </Button>
        </InlineStack>

        {/* Only the exceptional states get a line of their own. */}
        {borrowed && onPage ? (
          <Text as="p" variant="bodySm" tone="subdued">
            {t("home.sectionPreviewBorrowed")}
          </Text>
        ) : null}
        {stale && onPage ? (
          <Text as="p" variant="bodySm" tone="caution">
            {t("home.sectionPreviewStale")}
          </Text>
        ) : null}

        {/* 1 · The stage: a constant size, so nothing below it moves. Its
            height no longer depends on the width at all, so dragging the
            page-wide slider cannot change this ~26,000px document's height —
            what the old fit-against-the-widest reservation existed to protect
            now holds by construction. It is also what the observer watches,
            which is why it is rendered while the frame inside it is not. */}
        <div
          ref={stageRef}
          style={{
            position: "relative",
            width: maxWidth,
            height: WINDOW_HEIGHT,
            maxWidth: "100%",
            margin: "0 auto",
          }}
        >
          {onPage ? (
            /* 2 · The window — the phone's own outline, and the only thing
               that scrolls.
               `outline` rather than `border`, which is not decoration but
               arithmetic: this app sets `box-sizing: border-box`, so a 1px
               border would come out of the CONTENT box and leave a 430-wide
               window showing 428 pixels of a page scaled to 430 — the right
               edge quietly clipped, on the one screen whose whole job is to be
               exact. An outline is painted outside the box and takes no layout
               space at all, so the viewport stays the width it claims. It is
               also on this box rather than on the film, because a scaled iframe
               would scale its own border too. */
            <div
              ref={windowRef}
              tabIndex={0}
              role="group"
              aria-label={`${t("home.sectionPreview")} — ${sectionId}`}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              {...(pointing
                ? {
                    "data-home-picker-window": sectionId,
                    onPointerEnter: () => setHovered(true),
                    onPointerDown,
                    onPointerMove,
                    onPointerLeave: () => {
                      setHovered(false);
                      onPointerLeave();
                    },
                    onClick,
                  }
                : null)}
              style={{
                position: "absolute",
                left: boxLeft,
                top: 0,
                width,
                height: WINDOW_HEIGHT,
                // Inert when the band already fits: a window with nowhere to go
                // should not answer the wheel at all.
                overflowY: range > 0 ? "auto" : "hidden",
                overflowX: "hidden",
                // Without this, hitting either end hands the gesture to the
                // editor behind — and "constrained to the section" would be
                // false in the one way that matters.
                overscrollBehavior: "contain",
                // The window's width IS the phone's viewport width, so a
                // scrollbar taking layout space inside it would narrow the page
                // being judged. Modern Chrome and Firefox honour this; Safari
                // overlays its scrollbar and takes no space either way.
                scrollbarWidth: "none",
                // The phone's outline — and, when focused, the focus ring.
                // An inline `outline` beats the user agent's own `:focus`
                // style, so a keyboard user would otherwise tab onto a
                // scrollable box with nothing at all to show they had arrived.
                // Stated here rather than left to the browser because that is
                // the property this box was already using for its edge.
                outline: focused ? "2px solid #005bd3" : "1px solid #e3e3e3",
                outlineOffset: focused ? 1 : 0,
                borderRadius: 8,
                background: "#FFF6EC",
                // Says "this is pointable" without a second toggle to explain.
                cursor: pointing ? "crosshair" : undefined,
              }}
            >
              {/* 3 · The rail: exactly one band tall, and clipping. This is
                  the whole lock — see the file header.

                  `clip` RATHER THAN `hidden`, and the difference is the bug.
                  `overflow: hidden` clips, but it also makes the box a scroll
                  container — one the user cannot scroll and the BROWSER still
                  can. This rail is the containing block of the film, so the
                  film's 5,000 pixels are inside that box's scrollable overflow:
                  1021px of travel, for Craft, that nothing here ever reads or
                  resets. Anything that asks the browser to bring a descendant
                  into view — tabbing into the framed page, find-in-page —
                  scrolls it, and the window is then clamped to [0, range] over
                  a film that has moved underneath it. The lock would still
                  hold; it would simply be holding the wrong band, under this
                  section's name.
                  `overflow: clip` clips without a scroll box, so there is no
                  scroll position for anything to move. */}
              <div
                style={{
                  position: "relative",
                  height: railHeight,
                  overflow: "clip",
                }}
              >
                {/* 4 · The film: the whole page, at the design's own width
                    forever, pulled up so this band is the part on show.
                    Mounted only once the card has been reached; until then the
                    window shows the page's own cream, already the right size
                    and place, so nothing moves when it arrives. */}
                {reached ? (
                  <iframe
                    key={key}
                    ref={holdFrame}
                    src={`/?adminPreview=${key}`}
                    title={`${t("home.sectionPreview")} — ${sectionId}`}
                    // Belt to the observer's braces; see the note on `reached`.
                    loading="lazy"
                    // NOT REACHABLE BY KEYBOARD, and not in the accessibility
                    // tree — the same treatment HomePageMap gives its own frame.
                    // `pointerEvents: none` stops the mouse but does nothing to
                    // sequential focus: without this, Tab walks out of the
                    // window into a 5,000px page of links, nine times over,
                    // between a teammate and the fields they are editing. Every
                    // number in this component also assumes the frame is still
                    // showing `/`, and a focused link can be followed.
                    // The page's own copy is not hidden from a screen reader by
                    // this: it is in the editable fields directly below, which
                    // is where it can be read AND changed.
                    tabIndex={-1}
                    aria-hidden
                    // The document is ~160px taller than the stage (the legal
                    // footer sits below it), so the frame would otherwise be a
                    // scroll container of its own — a second box the browser
                    // could move, and a scrollbar inside what is meant to be a
                    // phone's viewport. Same reason HomePageMap sets it.
                    scrolling="no"
                    style={{
                      display: "block",
                      position: "absolute",
                      top: filmTop,
                      left: 0,
                      width: DESIGN_WIDTH,
                      height: frameHeight,
                      border: 0,
                      // The wheel belongs to the window rather than to a
                      // document that cannot scroll.
                      pointerEvents: "none",
                      // Top left, so the scaled film lands in the rail's corner
                      // rather than being scaled about its centre.
                      transformOrigin: "top left",
                      transform: `scale(${scale})`,
                      // No `will-change` on purpose. Sweeping an iframe's
                      // transform by hand costs 13.89ms per frame against a
                      // 13.86ms idle frame, so the browser already composites
                      // this — while a standing promotion hint on nine
                      // cross-document iframes is a real cost against
                      // Chromium's layer budget, which de-promotes silently
                      // when exceeded and would take the actual fix with it.
                    }}
                  />
                ) : null}
              </div>
            </div>
          ) : (
            /* Nothing to hold a window over. The box keeps its shape so the
               card does not collapse and the sentence lands where the picture
               was. Dashed, because an empty solid frame reads as a preview that
               failed to load. */
            <div
              style={{
                position: "absolute",
                left: boxLeft,
                top: 0,
                width,
                height: WINDOW_HEIGHT,
                // Outlined rather than bordered for the same reason as the
                // window above, so the two boxes are exactly the same size and
                // the card does not change shape when a section is switched off.
                outline: "1px dashed #babec3",
                borderRadius: 8,
                background: "#FFF6EC",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
                textAlign: "center",
              }}
            >
              <Text as="p" variant="bodySm" tone="subdued">
                {hidden
                  ? t("home.sectionPreviewHidden")
                  : t("home.sectionPreviewLenderHidden")}
              </Text>
            </div>
          )}
        </div>
      </BlockStack>

      {/* Outside the BlockStack on purpose: it draws in fixed coordinates and
          has no height, and a zero-height child of a gapped stack would still
          take a gap — nine times down the page. Outside the window and the rail
          too, so the clip that holds the band cannot clip the highlights. */}
      {panelRef && (pointing || selectedKey !== null) ? (
        <PickerLayer
          iframeRef={frameRef}
          pointer={pointer}
          // Measuring is worth doing only where somebody is looking — and now
          // that means the ONE window under the pointer, not every window on
          // screen. A card you are not in keeps its selection ring and runs no
          // frame loop at all.
          armed={pointing && onScreen && hovered}
          selectedKey={selectedKey}
          panelRef={panelRef}
          scope={scope}
        />
      ) : null}
    </Box>
  );
}
