"use client";

/**
 * ROLE OF THIS FILE
 * The "Jump to a section" control on Content → Home page (§9.8), drawn as the
 * page itself: the whole storefront home page rendered small, beside a column
 * of section links in which each link occupies exactly the vertical span of the
 * band it opens.
 *
 * WHY A PICTURE INSTEAD OF A LIST
 * The wrapped list this replaces named eight sections in words — "A-6 · Shop by
 * Recipient & Reviews" — which only helps someone who already knows what that
 * band looks like. A teammate without the Figma file open recognises a band by
 * sight long before they recognise its name, so here the link IS the band: same
 * order, same proportions, same top edge, and it says how tall a slice of the
 * page each section really is. Two sections carry a third of the page between
 * them; that is invisible in a list and obvious here.
 *
 * HOW THE ALIGNMENT HOLDS
 * The homepage is one fixed 430-wide stage whose seven module bands tile it
 * contiguously, so a band's true position is its imported `y` plus the shift
 * that hiding or trimming an earlier band applied — the same arithmetic
 * lib/home-content/layout.ts does for the live page, resolved server-side and
 * handed here. ONE scale factor turns stage pixels into map pixels and is
 * applied to the iframe, to the strips over it and to the link rows alike, so
 * none of the three can drift apart.
 *
 * TWO SECTIONS HAVE NO BAND, and neither is an oversight:
 * - The promo bar is the 32px strip of chrome at the very top. Real, but 4px
 *   tall at map scale — too small to hold a link — so its link sits above the
 *   map and tints that top edge instead.
 * - Slideshow speed is not an area of the page at all: it governs how fast the
 *   four card rails move. It sits below the map, with hidden bands, which
 *   genuinely have no area left to point at.
 */

import { useState, useSyncExternalStore } from "react";
import { Badge, BlockStack, InlineStack, Text } from "@shopify/polaris";
import { useAdminLang, useAdminT } from "../../../PolarisShell";

/** One section as the map needs it: where it is, and how to label it. */
export type MapSection = {
  id: string;
  module: string;
  title: string;
  titleZh: string;
  /**
   * Where the band sits on the live stage, in stage pixels, with hidden bands
   * and trims already taken out. `null` for page chrome, for the motion
   * settings, and for a band the owner has switched off.
   */
  band: { top: number; height: number } | null;
  hideable: boolean;
  visible: boolean;
  /** How many of the section's fields differ from the design, drafts included. */
  edited: number;
};

/** The design canvas width every homepage coordinate is measured against. */
const STAGE_WIDTH = 430;

/**
 * How tall the map is allowed to be, and how wide.
 *
 * The page is 430 × ~5057, so "the whole thing at once" is necessarily a narrow
 * ribbon — about 51px wide at the height below. That is the honest shape of the
 * page and it is what makes the ribbon readable as a page rather than as a
 * chart. The width cap only bites when enough bands are hidden that fitting the
 * remainder into MAP_HEIGHT would blow the map up to a wide column; then the
 * map gets shorter instead of wider.
 */
const MAP_HEIGHT = 600;
const MAP_MAX_WIDTH = 120;

/** Room above the map for the promo bar's link, which cannot fit on it. */
const TOP_CAP_HEIGHT = 34;

const LINE = "#e3e3e3";
const ACCENT = "#005bd3";

/**
 * How the hover response moves. Short enough to feel like the row answering the
 * pointer rather than playing an animation at it, and the nudge is HORIZONTAL —
 * the row leans the 3px towards its own band on the map. Nothing may move
 * vertically here: the rows sit on their bands' exact top edges, and that
 * agreement is the only thing the map is claiming.
 */
const EASE = "120ms cubic-bezier(0.4, 0, 0.2, 1)";
const NUDGE = 3;

/**
 * Whether the viewer has asked their system for reduced motion.
 *
 * Subscribed rather than read once, so turning the setting on takes effect
 * without a reload. The server snapshot says "reduced": it cannot know, and
 * assuming stillness means nothing can animate in the instant before hydration
 * tells us otherwise.
 *
 * @returns True when transitions and the nudge should be dropped.
 */
function useStillness(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true,
  );
}

/**
 * Scroll a section's editor card into view.
 *
 * The anchor is kept on the `<a>` as a real href so the row behaves like a
 * link — middle-click, copy link address, keyboard activation — and only the
 * jump itself is taken over here, to make it a smooth scroll for anyone who has
 * not asked the system for reduced motion.
 */
function jumpTo(id: string) {
  const target = document.getElementById(`home-section-${id}`);
  if (!target) return;
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({
    behavior: still ? "auto" : "smooth",
    block: "start",
  });
}

export function HomePageMap({
  sections,
  frameHeight,
  nonce,
}: {
  sections: MapSection[];
  /** The live stage height, hidden bands already removed. */
  frameHeight: number;
  /** Bumped on every save so the map reloads with what was just published. */
  nonce: number;
}) {
  const t = useAdminT();
  const zh = useAdminLang() === "zh";
  // One id, so hovering a link lights up its band and hovering a band lights up
  // its link. Focus sets it too, which is what makes the pairing usable from
  // the keyboard rather than only under a mouse.
  const [active, setActive] = useState<string | null>(null);
  const still = useStillness();

  const scale = Math.min(MAP_HEIGHT / frameHeight, MAP_MAX_WIDTH / STAGE_WIDTH);
  const mapWidth = STAGE_WIDTH * scale;
  const mapHeight = frameHeight * scale;

  const bands = sections.filter(
    (
      section,
    ): section is MapSection & { band: { top: number; height: number } } =>
      section.band !== null,
  );
  // Chrome that sits above the first band — today only the promo bar. Hiding
  // every band would leave nothing to be above, which is why this is an index
  // test rather than a lookup: the map still renders, with every link below it.
  const firstBand = sections.findIndex((section) => section.band !== null);
  const above = sections.filter(
    (section, index) =>
      section.band === null && firstBand !== -1 && index < firstBand,
  );
  // Everything with no area on the page: the motion settings, plus any band the
  // owner has switched off.
  const below = sections.filter(
    (section) => section.band === null && !above.includes(section),
  );
  /** The promo strip runs from the top of the stage to the first band. */
  const chromeHeight = bands.length > 0 ? bands[0].band.top * scale : mapHeight;

  const name = (section: MapSection) =>
    `${section.module} · ${zh ? section.titleZh : section.title}`;

  /** The row that stands for one section: badges, name, and its own state. */
  function row(section: MapSection, note: string | null) {
    const lit = active === section.id;
    return (
      <a
        href={`#home-section-${section.id}`}
        data-home-map-row={section.id}
        onClick={(event) => {
          event.preventDefault();
          jumpTo(section.id);
        }}
        onMouseEnter={() => setActive(section.id)}
        onMouseLeave={() => setActive(null)}
        onFocus={() => setActive(section.id)}
        onBlur={() => setActive(null)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          height: "100%",
          minHeight: 28,
          padding: "0 10px",
          border: `1px solid ${lit ? ACCENT : LINE}`,
          borderRadius: 8,
          background: lit ? "#f2f7fe" : "#ffffff",
          // Two shadows doing different jobs: the inset one thickens the border
          // to the accent without changing the box's size, the outer one lifts
          // the row off the card. Both fade from "none"'s transparent, so the
          // lift arrives with the colour rather than snapping in ahead of it.
          boxShadow: lit
            ? `inset 0 0 0 1px ${ACCENT}, 0 1px 4px rgba(0, 0, 0, 0.10)`
            : "inset 0 0 0 1px transparent, 0 1px 4px rgba(0, 0, 0, 0)",
          // The lean towards its band. A transform, so it cannot disturb the
          // row's position — the alignment with the map survives the motion.
          transform: lit && !still ? `translateX(-${NUDGE}px)` : "none",
          transition: still
            ? "none"
            : `transform ${EASE}, background-color ${EASE}, border-color ${EASE}, box-shadow ${EASE}`,
          textDecoration: "none",
          color: "inherit",
          overflow: "hidden",
        }}
      >
        <Badge tone={section.visible ? undefined : "critical"}>
          {section.module}
        </Badge>
        <span
          style={{
            flex: "1 1 auto",
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          <Text
            as="span"
            variant="bodyMd"
            fontWeight={lit ? "semibold" : "regular"}
          >
            {zh ? section.titleZh : section.title}
          </Text>
        </span>
        {note ? (
          <Text as="span" variant="bodySm" tone="subdued">
            {note}
          </Text>
        ) : null}
        {section.hideable && !section.visible ? (
          <Badge tone="critical">{t("home.hidden")}</Badge>
        ) : null}
        {section.edited > 0 ? (
          <Badge tone="info">{`${section.edited} ${t("home.editedCount")}`}</Badge>
        ) : null}
      </a>
    );
  }

  return (
    <BlockStack gap="200">
      <Text as="p" variant="bodySm" tone="subdued">
        {t("home.map.hint")}
      </Text>

      <div
        data-home-map
        style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
      >
        {/* The page, small. */}
        <div style={{ flex: "0 0 auto", paddingTop: TOP_CAP_HEIGHT }}>
          <div
            style={{
              position: "relative",
              width: mapWidth,
              height: mapHeight,
              overflow: "hidden",
              // Drawn as an inset shadow rather than a border: a border would
              // push the strips 1px down from the box's top edge while the link
              // column beside it started at the edge, and the two would no
              // longer line up. A shadow takes no layout space at all.
              boxShadow: `inset 0 0 0 1px ${LINE}`,
              borderRadius: 6,
              background: "#FFF6EC",
            }}
          >
            <iframe
              key={nonce}
              src={`/?adminPreview=${nonce}`}
              title={t("home.map.title")}
              // The stage's own size, then scaled as one picture: the page
              // inside sees a 430-wide viewport, so ScaleFrame renders it at
              // exactly 1:1 and every band lands on its imported coordinate.
              // `scrolling="no"` matters — a scrollbar inside would narrow that
              // viewport and shrink the stage out of alignment.
              width={STAGE_WIDTH}
              height={frameHeight}
              scrolling="no"
              tabIndex={-1}
              aria-hidden
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                border: 0,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                pointerEvents: "none",
              }}
            />
            {/* The promo bar's own strip: 4px, labelled from above. */}
            {above.map((section) => (
              <div
                key={section.id}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  height: Math.max(chromeHeight, 2),
                  background:
                    active === section.id
                      ? "rgba(0,91,211,0.28)"
                      : "rgba(0,91,211,0)",
                  borderBottom: `1px dashed rgba(0,0,0,0.28)`,
                  pointerEvents: "none",
                  transition: still ? "none" : `background-color ${EASE}`,
                }}
              />
            ))}
            {bands.map((section, index) => (
              <a
                key={section.id}
                href={`#home-section-${section.id}`}
                aria-label={name(section)}
                data-home-map-strip={section.id}
                onClick={(event) => {
                  event.preventDefault();
                  jumpTo(section.id);
                }}
                onMouseEnter={() => setActive(section.id)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(section.id)}
                onBlur={() => setActive(null)}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: section.band.top * scale,
                  height: section.band.height * scale,
                  display: "block",
                  background:
                    active === section.id
                      ? "rgba(0,91,211,0.28)"
                      : "rgba(0,91,211,0)",
                  // Always outlined, only the colour changes: `none` → `1px
                  // solid` is not a transition the browser can interpolate, so
                  // the band would flash rather than answer the pointer.
                  outline: `1px solid ${active === section.id ? ACCENT : "transparent"}`,
                  outlineOffset: -1,
                  borderBottom:
                    index === bands.length - 1
                      ? "none"
                      : `1px dashed rgba(0,0,0,0.28)`,
                  transition: still
                    ? "none"
                    : `background-color ${EASE}, outline-color ${EASE}`,
                }}
              />
            ))}
          </div>
        </div>

        {/* The links, each one as tall as the band it opens. */}
        <div style={{ flex: "1 1 auto", minWidth: 0 }}>
          {above.map((section) => (
            <div
              key={section.id}
              style={{ height: TOP_CAP_HEIGHT, paddingBottom: 4 }}
            >
              {row(section, t("home.map.top"))}
            </div>
          ))}
          <div style={{ position: "relative", height: mapHeight }}>
            {bands.map((section) => (
              <div
                key={section.id}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: section.band.top * scale,
                  height: section.band.height * scale,
                  // A hairline of breathing room, taken from inside the row so
                  // the row's top edge stays exactly on the band's top edge.
                  paddingBottom: 3,
                }}
              >
                {/* How much of the page this section is. The point of a map is
                    the thing a list cannot say: two of these eight sections are
                    two fifths of the page between them. */}
                {row(
                  section,
                  `${Math.round((section.band.height / frameHeight) * 100)}%${t("home.map.share")}`,
                )}
              </div>
            ))}
          </div>
          {below.length > 0 ? (
            <BlockStack gap="150">
              <div style={{ height: 8 }} />
              {below.map((section) => (
                <div key={section.id} style={{ height: 32 }}>
                  {row(
                    section,
                    section.hideable
                      ? t("home.map.notShown")
                      : t("home.map.noArea"),
                  )}
                </div>
              ))}
            </BlockStack>
          ) : null}
        </div>
      </div>

      <InlineStack gap="200">
        <Text as="p" variant="bodySm" tone="subdued">
          {t("home.map.scale")} {Math.round(frameHeight)}
          {zh ? " 像素" : " px tall"}
        </Text>
      </InlineStack>
    </BlockStack>
  );
}
