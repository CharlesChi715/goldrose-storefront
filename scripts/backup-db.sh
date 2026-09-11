#!/usr/bin/env bash
#
# ROLE OF THIS FILE
# Take one logical backup of the hosted Supabase database.
#
# Run by .github/workflows/db-backup.yml every night, and by a human doing the
# restore drill. Same script both ways on purpose: a backup procedure that only
# exists inside a CI workflow is a procedure nobody can practise, and an
# unpractised restore is not a backup.
#
#   DATABASE_URL='postgresql://...' scripts/backup-db.sh ./out
#
# WHY THREE FILES AND NOT ONE
# Restoring a Supabase project is not restoring a plain Postgres database. The
# platform provisions `auth` and `storage` itself, with its own DDL, on every
# project — so a dump that carries THEIR table definitions collides with what
# is already there and the restore dies half-done. The split is what makes a
# restore into a fresh project actually work:
#
#   public.dump    schema AND data for our own tables. This is the shop.
#   platform.dump  data ONLY for auth.users and storage.objects — the rows,
#                  poured into the definitions Supabase has already made.
#   schema.sql     plain text, for reading and diffing. Never used to restore;
#                  it exists so a human can see what changed between two
#                  nights without a Postgres to hand.
#
# WHAT IT DOES NOT CAPTURE, SAID PLAINLY
# The Storage BUCKET CONTENTS. `storage.objects` holds the rows describing
# every product image; the image FILES live in S3 behind Supabase and no
# pg_dump reaches them. Restoring this alone gives a shop whose product photos
# are all broken links. Backing up the bucket is a separate job — see
# docs/features/db-backups.md.
set -euo pipefail

OUT_DIR="${1:-./backup}"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "backup-db: DATABASE_URL is unset." >&2
  echo "backup-db: use the SESSION pooler (port 5432), not the transaction" >&2
  echo "backup-db: pooler (6543) — pg_dump needs prepared statements, which" >&2
  echo "backup-db: the transaction pooler does not carry." >&2
  exit 2
fi

# The client must be at least the server's major version. Postgres supports
# dumping an OLDER server with a NEWER pg_dump and refuses the other way round,
# and the hosted project is 17.x — so a runner's default 16 client fails with a
# version mismatch that reads like a connection error if you are not looking
# for it.
client_major="$(pg_dump --version | sed -E 's/.*[^0-9]([0-9]+)\.[0-9]+.*/\1/')"
if [ "${client_major}" -lt 17 ]; then
  echo "backup-db: pg_dump is major ${client_major}; the server is 17." >&2
  echo "backup-db: install the 17 client (apt.postgresql.org) and retry." >&2
  exit 2
fi

mkdir -p "${OUT_DIR}"

# --no-owner / --no-privileges: the roles on the restore target are Supabase's
# own and are not the roles named in the dump. Keeping ownership statements
# guarantees a restore that fails on every single object.
common_flags=(--no-owner --no-privileges --no-comments)

echo "backup-db: dumping public schema (structure and rows)…"
pg_dump "${DATABASE_URL}" \
  "${common_flags[@]}" \
  --format=custom \
  --schema=public \
  --file="${OUT_DIR}/public.dump"

echo "backup-db: dumping auth and storage rows (data only)…"
pg_dump "${DATABASE_URL}" \
  "${common_flags[@]}" \
  --format=custom \
  --data-only \
  --schema=auth \
  --schema=storage \
  --file="${OUT_DIR}/platform.dump"

echo "backup-db: writing readable schema…"
pg_dump "${DATABASE_URL}" \
  "${common_flags[@]}" \
  --schema-only \
  --schema=public \
  --file="${OUT_DIR}/schema.sql"

# A dump that "succeeded" and holds nothing is the failure mode this whole
# pipeline exists to prevent, and it is silent by nature: pg_dump exits 0 when
# it connects to an empty database. So refuse to call a suspiciously small file
# a backup. The public dump of this shop is tens of KB and grows.
public_bytes="$(wc -c < "${OUT_DIR}/public.dump" | tr -d ' ')"
if [ "${public_bytes}" -lt 8192 ]; then
  echo "backup-db: public.dump is only ${public_bytes} bytes — refusing to" >&2
  echo "backup-db: call that a backup. Did it connect to the right database?" >&2
  exit 1
fi

# Table count is the second sanity check, and the more meaningful one: the
# right database has ~21 tables. `pg_restore --list` reads the dump itself, so
# this verifies the FILE rather than the database it came from.
tables="$(pg_restore --list "${OUT_DIR}/public.dump" | grep -c 'TABLE DATA' || true)"
if [ "${tables}" -lt 10 ]; then
  echo "backup-db: public.dump holds only ${tables} tables with data." >&2
  echo "backup-db: the shop has around 21. Refusing." >&2
  exit 1
fi

echo "backup-db: ok — ${tables} tables, $(du -h "${OUT_DIR}/public.dump" | cut -f1) public dump."
ls -la "${OUT_DIR}"
