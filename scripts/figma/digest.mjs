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
