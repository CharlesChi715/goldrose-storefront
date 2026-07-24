#!/usr/bin/env node
// Feature-registry CLI — docs/Improvement-plan.md §8.
// Implemented: new. Planned: list, generate, check, validate.

import { parseArgs } from 'node:util'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const FEATURES_DIR = join(ROOT, 'docs', 'features')
const TEMPLATE = join(FEATURES_DIR, 'TEMPLATE.md')

const AREAS = ['frontend', 'backend']
const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/

function fail(message) {
  console.error(`✗ ${message}`)
  process.exit(1)
}

// Every .md under docs/features/ except TEMPLATE.md and generated views.
function* recordFiles(dir = FEATURES_DIR) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (entry.name !== 'generated') yield* recordFiles(join(dir, entry.name))
    } else if (entry.name.endsWith('.md') && join(dir, entry.name) !== TEMPLATE) {
      yield join(dir, entry.name)
    }
  }
}

// id from a file's front matter, or null when the file has none (pre-migration docs).
function frontMatterId(file) {
  const text = readFileSync(file, 'utf8')
  if (!text.startsWith('---\n')) return null
  const end = text.indexOf('\n---', 4)
  if (end === -1) return null
  const match = text.slice(4, end).match(/^id:[ \t]*(\S+)/m)
  return match ? match[1] : null
}

function cmdNew(argv) {
  const usage =
    'usage: npm run features:new -- <id> --area frontend|backend [--parent <group-id>] [--title "..."] [--dir <subfolder>] [--order <n>]'
  const { values, positionals } = parseArgs({
    args: argv,
    options: {
      id: { type: 'string' },
      area: { type: 'string' },
      parent: { type: 'string' },
      title: { type: 'string' },
      dir: { type: 'string' },
      order: { type: 'string' },
    },
    allowPositionals: true,
  })

  const id = values.id ?? positionals[0]
  if (!id) fail(`missing id\n${usage}`)
  if (!ID_RE.test(id))
    fail(`invalid id "${id}" — kebab-case only: lowercase letters, digits, hyphens (e.g. gift-wrapping)`)
  if (!values.area) fail(`missing --area\n${usage}`)
  if (!AREAS.includes(values.area))
    fail(`invalid area "${values.area}" — expected one of: ${AREAS.join(', ')}`)
  if (values.order && !/^\d+$/.test(values.order)) fail(`invalid --order "${values.order}" — expected a number`)

  for (const file of recordFiles()) {
    if (frontMatterId(file) === id)
      fail(`id "${id}" is already used by ${relative(ROOT, file)} — ids must be globally unique`)
  }

  const dest = join(FEATURES_DIR, values.area, values.dir ?? '', `${id}.md`)
  if (existsSync(dest)) fail(`${relative(ROOT, dest)} already exists`)

  const title = values.title ?? id[0].toUpperCase() + id.slice(1).replaceAll('-', ' ')
  const today = new Date().toISOString().slice(0, 10)
  const record = readFileSync(TEMPLATE, 'utf8')
    .replace(/^(id:[ \t]*)example-feature/m, `$1${id}`)
    .replace(/^(parent:[ \t]*)example-group/m, `$1${values.parent ?? values.area}`)
    .replace(/^(area:[ \t]*)frontend/m, `$1${values.area}`)
    .replace(/^(order:[ \t]*)10/m, `$1${values.order ?? '10'}`)
    .replace(/^(statusChangedAt:[ \t]*)\d{4}-\d{2}-\d{2}/m, `$1${today}`)
    .replace(/^# Feature name$/m, `# ${title}`)

  mkdirSync(dirname(dest), { recursive: true })
  writeFileSync(dest, record)

  console.log(`✓ created ${relative(ROOT, dest)}  (delivery: backlog)`)
  console.log('  next: fill in Context, then Decision + Options + Acceptance criteria to reach READY')
}

const PLANNED = ['list', 'generate', 'check', 'validate']
const COMMANDS = { new: cmdNew }

const [command, ...rest] = process.argv.slice(2)
if (!command) fail(`usage: cli.mjs <command>\navailable: ${Object.keys(COMMANDS).join(', ')} · planned: ${PLANNED.join(', ')}`)
if (PLANNED.includes(command))
  fail(`"${command}" is designed in docs/Improvement-plan.md §8 but not built yet — available: ${Object.keys(COMMANDS).join(', ')}`)
if (!COMMANDS[command]) fail(`unknown command "${command}"`)
COMMANDS[command](rest)
