#!/usr/bin/env node
// Feature-registry CLI — record format and lifecycle: docs/features/README.md.
// Commands: new, generate, check, validate, list.

import { parseArgs } from "node:util";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { FEATURES_DIR, ROOT, generate, loadRegistry } from "./lib.mjs";

const TEMPLATE = join(FEATURES_DIR, "TEMPLATE.md");
const AREAS = ["frontend", "backend"];
const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

function cmdNew(argv) {
  const usage =
    'usage: npm run features:new -- <id> --area frontend|backend [--parent <group-id>] [--title "..."] [--dir <subfolder>] [--order <n>]';
  const { values, positionals } = parseArgs({
    args: argv,
    options: {
      id: { type: "string" },
      area: { type: "string" },
      parent: { type: "string" },
      title: { type: "string" },
      dir: { type: "string" },
      order: { type: "string" },
    },
    allowPositionals: true,
  });

  const id = values.id ?? positionals[0];
  if (!id) fail(`missing id\n${usage}`);
  if (!ID_RE.test(id))
    fail(
      `invalid id "${id}" — kebab-case only: lowercase letters, digits, hyphens (e.g. gift-wrapping)`,
    );
  if (!values.area) fail(`missing --area\n${usage}`);
  if (!AREAS.includes(values.area))
    fail(
      `invalid area "${values.area}" — expected one of: ${AREAS.join(", ")}`,
    );
  if (values.order && !/^\d+$/.test(values.order))
    fail(`invalid --order "${values.order}" — expected a number`);

  let registry = [];
  try {
    registry = loadRegistry();
  } catch (e) {
    fail(`fix the existing registry before adding records:\n${e.message}`);
  }
  if (registry.some((n) => n.id === id))
    fail(
      `id "${id}" is already used — ids must be globally unique (see npm run features:check)`,
    );
  const parent = values.parent ?? values.area;
  if (
    !AREAS.includes(parent) &&
    !registry.some((n) => n.kind === "group" && n.id === parent)
  )
    fail(
      `parent "${parent}" is not a known group id — groups live in <area>/<group-id>/_group.md`,
    );

  // Default location: the parent group's folder when it exists, else the area folder.
  const groupDir = join(FEATURES_DIR, values.area, parent);
  const defaultDir =
    !values.dir && existsSync(groupDir)
      ? join(values.area, parent)
      : join(values.area, values.dir ?? "");
  const dest = join(FEATURES_DIR, defaultDir, `${id}.md`);
  if (existsSync(dest)) fail(`${relative(ROOT, dest)} already exists`);

  const title =
    values.title ?? id[0].toUpperCase() + id.slice(1).replaceAll("-", " ");
  const today = new Date().toISOString().slice(0, 10);
  const record = readFileSync(TEMPLATE, "utf8")
    .replace(/^(id:[ \t]*)example-feature/m, `$1${id}`)
    .replace(/^(parent:[ \t]*)example-group/m, `$1${parent}`)
    .replace(/^(area:[ \t]*)frontend/m, `$1${values.area}`)
    .replace(/^(order:[ \t]*)10/m, `$1${values.order ?? "10"}`)
    .replace(/^(statusChangedAt:[ \t]*)\d{4}-\d{2}-\d{2}/m, `$1${today}`)
    .replace(/^# Feature name$/m, `# ${title}`);

  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, record);

  console.log(`✓ created ${relative(ROOT, dest)}  (delivery: backlog)`);
  console.log(
    "  next: fill in Context, then Decision + Options + Acceptance criteria to reach READY",
  );
  try {
    if (generate())
      console.log(
        "✓ roadmap regenerated in docs/features/README.md — commit both files together",
      );
  } catch (e) {
    fail(`record created, but the roadmap could not regenerate:\n${e.message}`);
  }
}

function cmdGenerate() {
  console.log(
    generate()
      ? "✓ roadmap regenerated in docs/features/README.md"
      : "✓ roadmap already up to date",
  );
}

function cmdCheck() {
  if (generate({ write: false }))
    fail(
      "docs/features/README.md roadmap is stale — run `npm run features:generate` and commit the result",
    );
  console.log("✓ registry valid, roadmap up to date");
}

function cmdValidate() {
  const nodes = loadRegistry();
  console.log(
    `✓ registry valid — ${nodes.filter((n) => n.kind === "feature").length} records, ${nodes.filter((n) => n.kind === "group").length} groups, ${nodes.filter((n) => n.kind === "legacy").length} legacy leaves`,
  );
}

function cmdList() {
  for (const n of loadRegistry().filter((n) => n.kind !== "group"))
    console.log(
      `${n.id.padEnd(28)} ${n.delivery.padEnd(12)} ${(n.rollout ?? "-").padEnd(16)} ${n.area.padEnd(9)} ${n.file ?? "roadmap.legacy.yaml"}`,
    );
}

const COMMANDS = {
  new: cmdNew,
  generate: cmdGenerate,
  check: cmdCheck,
  validate: cmdValidate,
  list: cmdList,
};

const [command, ...rest] = process.argv.slice(2);
if (!command)
  fail(
    `usage: cli.mjs <command>\navailable: ${Object.keys(COMMANDS).join(", ")}`,
  );
if (!COMMANDS[command]) fail(`unknown command "${command}"`);
try {
  COMMANDS[command](rest);
} catch (e) {
  fail(e.message);
}
