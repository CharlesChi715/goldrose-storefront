/**
 * ROLE OF THIS FILE
 * Guards the feature registry (docs/features/README.md): the YAML-subset
 * parser in scripts/features/lib.mjs must read TEMPLATE.md's front matter
 * exactly, and the real registry on disk must always validate — so a broken
 * record fails `npm run test:unit`, not just `npm run features:check`.
 *
 * Runs under plain Node: `npm run test:unit`.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  loadRegistry,
  parseRecord,
  renderRoadmap,
} from "../../scripts/features/lib.mjs";

const TEMPLATE = join(
  import.meta.dirname,
  "..",
  "..",
  "docs",
  "features",
  "TEMPLATE.md",
);

test("the parser reads TEMPLATE.md's front matter exactly", () => {
  const { frontMatter } = parseRecord(
    readFileSync(TEMPLATE, "utf8"),
    "TEMPLATE.md",
  );
  assert.deepEqual(frontMatter, {
    schemaVersion: 1,
    id: "example-feature",
    kind: "feature",
    parent: "example-group",
    area: "frontend",
    order: 10,
    delivery: "backlog",
    rollout: "not-deployed",
    statusChangedAt: "2026-01-01",
    dependsOn: [],
    blockedBy: [],
    verification: { automated: [], human: null },
  });
});

test("the real registry on disk validates", () => {
  const nodes = loadRegistry() as Array<{ kind?: string }>;
  assert.ok(nodes.filter((n) => n.kind === "feature").length >= 8);
  assert.ok(nodes.filter((n) => n.kind === "group").length >= 10);
});

test("the rendered roadmap carries both areas and a meter per leaf", () => {
  const out = renderRoadmap(loadRegistry());
  assert.ok(out.includes("### Frontend (storefront)"));
  assert.ok(out.includes("### Backend (admin + data)"));
  assert.ok(out.includes("card-payments.md ●○○○ READY"));
  assert.ok(!out.includes("undefined"));
});
