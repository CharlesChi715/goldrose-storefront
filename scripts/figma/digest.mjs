// Pure derivations over a cached Figma file payload.
//
// One walk of the document produces every index the sync needs. Nothing here
// touches the network or the filesystem, so the digests are reproducible: the
// same file version always yields byte-identical output, which is what makes
// the `changes` diff trustworthy.

import { hash } from "./lib.mjs";

const CONTAINER = new Set(["FRAME", "COMPONENT", "COMPONENT_SET", "INSTANCE"]);

/**
 * Walk the document once and index every node.
 *
 * Returns `nodes` (id → flat record) and `topFrames` (the direct children of a
 * page, i.e. the things the design team calls "a frame" and hands over).
 * `devStatus` is carried down: a mark on a SECTION cascades to everything
 * under it, which is the Ready-for-dev scope rule.
 */
export function indexDocument(file) {
  const nodes = new Map();
  const topFrames = [];

  const walk = (node, ctx) => {
    const inherited = node.devStatus?.type ?? ctx.devStatus;
    const record = {
      id: node.id,
      name: node.name,
      type: node.type,
      page: ctx.page,
      section: node.type === "SECTION" ? node.name : ctx.section,
      parent: ctx.parent,
      devStatus: node.devStatus?.type ?? null,
      // Effective status after the section cascade — the value section 3 of
      // the skill actually gates on.
      ready: inherited ?? null,
      width: node.absoluteBoundingBox?.width ?? null,
      height: node.absoluteBoundingBox?.height ?? null,
      interactions: normalizeInteractions(node),
      characters: node.type === "TEXT" ? node.characters : undefined,
    };
    nodes.set(node.id, record);
    if (ctx.isPageChild && CONTAINER.has(node.type)) {
      topFrames.push({ ...record, hash: hash(node) });
    }
    for (const child of node.children ?? []) {
      walk(child, {
        page: ctx.page,
        section: record.section,
        parent: node.id,
        devStatus: inherited,
        isPageChild: node.type === "CANVAS" || node.type === "SECTION",
      });
    }
  };

  for (const page of file.document.children ?? []) {
    walk(page, {
      page: page.name,
      section: null,
      parent: null,
      devStatus: null,
      isPageChild: false,
    });
  }
  return { nodes, topFrames };
}

/**
 * Prototype edges for one node.
 *
 * `reactions` reads back stale or empty on this file, so `interactions[]` is
 * the source of truth; the legacy field is only a last resort for old nodes
 * the newer field has not caught up with.
 */
function normalizeInteractions(node) {
  const source = node.interactions?.length ? node.interactions : node.reactions;
  if (!source?.length) return undefined;
  const edges = [];
  for (const entry of source) {
    const trigger = entry.trigger?.type ?? null;
    // A "none"/back action serialises as a null entry — real in this file.
    const actions = (entry.actions ?? [entry.action]).filter(Boolean);
    for (const action of actions) {
      const target = action.destinationId ?? entry.transitionNodeID ?? null;
      edges.push({
        trigger,
        action: action.type ?? null,
        navigation: action.navigation ?? null,
        target,
      });
    }
  }
  return edges.length ? edges : undefined;
}

/** Frames that are in build scope: marked Ready for dev, or under a mark. */
export function readyFrames({ topFrames }) {
  return topFrames
    .filter((f) => f.ready)
    .map(({ id, name, page, section, ready, width, height }) => ({
      id,
      name,
      page,
      section,
      status: ready,
      size:
        width && height ? `${Math.round(width)}×${Math.round(height)}` : null,
    }));
}

/**
 * Every prototype edge, plus the scaffold list: links out of a ready frame
 * into a frame that is not ready. Those get a "coming soon" placeholder route
 * rather than a real build.
 */
export function prototype({ nodes, topFrames }) {
  const owner = (id) => {
    let cur = nodes.get(id);
    const chain = [];
    while (cur) {
      chain.push(cur);
      cur = cur.parent ? nodes.get(cur.parent) : null;
    }
    return chain.reverse().find((n) => CONTAINER.has(n.type)) ?? null;
  };

  const edges = [];
  for (const node of nodes.values()) {
    for (const edge of node.interactions ?? []) {
      if (!edge.target) continue;
      const from = owner(node.id);
      const to = nodes.get(edge.target);
      edges.push({
        fromFrame: from?.name ?? null,
        fromFrameId: from?.id ?? null,
        via: node.name,
        viaId: node.id,
        trigger: edge.trigger,
        action: edge.action,
        toFrame: to?.name ?? "(unknown node)",
        toFrameId: edge.target,
        toReady: Boolean(to?.ready),
      });
    }
  }

  const readyIds = new Set(topFrames.filter((f) => f.ready).map((f) => f.id));
  const scaffold = [];
  const seen = new Set();
  for (const edge of edges) {
    if (!readyIds.has(edge.fromFrameId) || edge.toReady) continue;
    if (seen.has(edge.toFrameId)) continue;
    seen.add(edge.toFrameId);
    scaffold.push({
      target: edge.toFrame,
      targetId: edge.toFrameId,
      linkedFrom: edge.fromFrame,
    });
  }
  return { edges, scaffold };
}

// CJK characters are not `\w`, so a `\b` next to one never matches — the
// Chinese keywords are kept in their own boundary-free alternation.
const MINE_HINT =
  /^(?:(?:ok|okay|yes|agreed|done|will do)\b|好的|收到|我来|我会)/i;
const DIRECTIVE_HINT =
  /(?:\b(?:please|add|change|make|remove|fix|use|update)\b|需要|请|改一?下|加一?个)/i;

/**
 * Comment threads, grouped and attributed.
 *
 * The script does the mechanical half only — thread assembly, author identity,
 * resolved-state, which frame the pin sits on — and stops there. Deciding
 * whether one of Charles's comments is his own to-do or a directive to the
 * team is a judgement call, so each thread carries a `hint`, never a verdict.
 */
export function comments(raw, me, { nodes }) {
  const threads = new Map();
  for (const c of raw.comments ?? []) {
    const rootId = c.parent_id || c.id;
    if (!threads.has(rootId)) threads.set(rootId, []);
    threads.get(rootId).push(c);
  }

  const out = [];
  for (const [rootId, list] of threads) {
    list.sort((a, b) => a.created_at.localeCompare(b.created_at));
    const root = list.find((c) => c.id === rootId) ?? list[0];
    const frameId = root.client_meta?.node_id ?? null;
    const frame = frameId ? nodes.get(frameId) : null;
    const messages = list.map((c) => ({
      author: c.user?.handle ?? "?",
      mine: c.user?.id === me?.id,
      at: c.created_at,
      text: c.message,
    }));
    const mineOnly = messages.filter((m) => m.mine);
    const last = mineOnly.at(-1)?.text ?? "";
    out.push({
      id: rootId,
      resolved: Boolean(root.resolved_at),
      frame: frame?.name ?? null,
      frameId,
      page: frame?.page ?? null,
      ready: Boolean(frame?.ready),
      participants: [...new Set(messages.map((m) => m.author))],
      hint: !mineOnly.length
        ? "team-only"
        : MINE_HINT.test(last.trim())
          ? "charles-acceptance?"
          : DIRECTIVE_HINT.test(last)
            ? "charles-directive?"
            : "charles-other",
      messages,
    });
  }
  return out.sort((a, b) =>
    a.resolved === b.resolved ? 0 : a.resolved ? 1 : -1,
  );
}

const VECTORISH = new Set([
  "VECTOR",
  "BOOLEAN_OPERATION",
  "STAR",
  "ELLIPSE",
  "LINE",
  "REGULAR_POLYGON",
]);

const hasImageFill = (node) =>
  (node.fills ?? []).some((f) => f.type === "IMAGE" && f.visible !== false);

/** A subtree with no text and no image fill can be flattened into one SVG. */
function pureVector(node) {
  if (node.type === "TEXT" || hasImageFill(node)) return false;
  if (VECTORISH.has(node.type)) return true;
  const children = node.children ?? [];
  return children.length > 0 && children.every(pureVector);
}

/**
 * The nodes worth exporting as files from a frame.
 *
 * Exports the **outermost** node that qualifies and does not descend into it,
 * so a five-path icon comes out as one SVG rather than five fragments. Three
 * things qualify, in priority order: an explicit export setting from the
 * designer, a subtree that is entirely vector (an icon), and a node painted
 * with an image fill (a photo).
 *
 * Frames and groups that mix text with art fall through to their children —
 * that is how a whole screen avoids being exported as a single blob.
 */
export function exportableNodes(root) {
  const out = [];
  const visit = (node, depth) => {
    if (depth > 0) {
      if (node.exportSettings?.length) {
        const setting = node.exportSettings[0];
        out.push({
          id: node.id,
          name: node.name,
          format: (setting.format ?? "SVG").toLowerCase(),
          scale: setting.constraint?.value ?? 2,
          why: "exportSettings",
        });
        return;
      }
      if (pureVector(node)) {
        out.push({
          id: node.id,
          name: node.name,
          format: "svg",
          scale: 1,
          why: "vector",
        });
        return;
      }
      if (hasImageFill(node)) {
        out.push({
          id: node.id,
          name: node.name,
          format: "png",
          scale: 2,
          why: "image-fill",
        });
        return;
      }
    }
    for (const child of node.children ?? []) visit(child, depth + 1);
  };
  visit(root, 0);
  // Asked for a single icon rather than a screen: the root never qualifies
  // itself (or a whole frame would export as one blob), so allow it when the
  // scan came back empty.
  if (!out.length && (pureVector(root) || hasImageFill(root))) {
    out.push({
      id: root.id,
      name: root.name,
      format: pureVector(root) ? "svg" : "png",
      scale: pureVector(root) ? 1 : 2,
      why: "root",
    });
  }
  return out;
}

/**
 * A frame as an indented layout listing — name, geometry, text, fill.
 *
 * The raw subtree of one screen is ~500KB of style tables, render bounds and
 * constraint objects that a Tailwind rewrite never consults. This is the same
 * frame in a form a reader can hold: position and size relative to the frame,
 * the copy, and the colour.
 */
export function outline(root) {
  const originX = root.absoluteBoundingBox?.x ?? 0;
  const originY = root.absoluteBoundingBox?.y ?? 0;
  const lines = [];

  const paint = (node) => {
    const fill = (node.fills ?? []).find(
      (f) => f.visible !== false && f.type === "SOLID",
    );
    if (!fill) return hasImageFill(node) ? " image" : "";
    const { r, g, b } = fill.color;
    const hex = [r, g, b]
      .map((c) =>
        Math.round(c * 255)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("");
    const alpha =
      fill.opacity !== undefined && fill.opacity < 1 ? ` @${fill.opacity}` : "";
    return ` #${hex}${alpha}`;
  };

  const visit = (node, depth) => {
    const box = node.absoluteBoundingBox;
    const geometry = box
      ? ` ${Math.round(box.x - originX)},${Math.round(box.y - originY)} ` +
        `${Math.round(box.width)}×${Math.round(box.height)}`
      : "";
    const text =
      node.type === "TEXT" ? `  "${node.characters.replace(/\n/g, "⏎")}"` : "";
    const font =
      node.type === "TEXT" && node.style
        ? ` ${node.style.fontFamily} ${Math.round(node.style.fontSize)}/${Math.round(node.style.lineHeightPx ?? 0)}`
        : "";
    lines.push(
      `${"  ".repeat(depth)}${node.type} ${node.name}${geometry}${paint(node)}${font}${text}`,
    );
    for (const child of node.children ?? []) visit(child, depth + 1);
  };
  visit(root, 0);
  return lines;
}

/** Added / removed / modified top-level frames between two hash snapshots. */
export function diffFrames(previous, current) {
  const before = new Map((previous ?? []).map((f) => [f.id, f]));
  const after = new Map(current.map((f) => [f.id, f]));
  const added = [];
  const removed = [];
  const modified = [];
  for (const [id, frame] of after) {
    const old = before.get(id);
    if (!old) added.push(brief(frame));
    else if (old.hash !== frame.hash) modified.push(brief(frame));
  }
  for (const [id, frame] of before)
    if (!after.has(id)) removed.push(brief(frame));
  return { added, modified, removed };
}

const brief = (f) => ({
  id: f.id,
  name: f.name,
  page: f.page,
  status: f.ready ?? null,
});
