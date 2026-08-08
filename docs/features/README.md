# docs/features/

One markdown file per feature ("record"). Status lives ONLY in each record's
front matter — never as prose in a body. [`TEMPLATE.md`](TEMPLATE.md) is the
authority for keys, vocabulary, state meanings, and body sections;
`scripts/features/cli.mjs` enforces it.

## Commands

- `node scripts/features/cli.mjs new <feature-id>` — scaffold
  `docs/features/<feature-id>.md` born at `delivery: backlog`. Kebab-case id
  = filename = H1; ids already taken are refused. Then read
  [`TEMPLATE.md`](TEMPLATE.md) (key vocabulary and section rules), fill
  Context, delete each guidance comment you fulfil, and add the record's row
  to the Roadmap table below.

Still being rebuilt after the 2026-08-01 teardown: `check` (validate every
record's front matter, exit non-zero on violations — in progress) and the
generated Roadmap block (`--write` / `--verify` for CI).

## Roadmap

The block below is generated from record front matter by
`node scripts/features/cli.mjs roadmap --write` (not built yet — until it
lands, list records with `ls docs/features/`); never edit inside the markers.

Status meter vocabulary, kept for the rebuild:

`○○○○ BACKLOG · ●○○○ READY · ●●○○ IN PROGRESS · ●●●○ UAT · ●●●● ACCEPTED · ✕ DROPPED`

<!-- BEGIN features:roadmap -->

_Not generated yet._

<!-- END features:roadmap -->

