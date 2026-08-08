---
name: feature-new
description: "Create a new ELDREVE feature record. Use when Charles asks to add, create, or start tracking a feature, or types /feature-new <id>. Runs the deterministic scaffold (scripts/features/cli.mjs new), fills the record per docs/features/TEMPLATE.md, syncs the roadmap, and validates with check. The argument is the kebab-case feature id; if absent, derive one from the request and state it."
metadata:
  author: charles
  version: "1.0.0"
---

# Create a feature record

The deterministic parts run through the CLI; your judgment fills the content.
Every rule the record must satisfy is enforced by `check` — obey its error
hints, they are written as repair instructions.

1. Take the kebab-case id from the argument (`/feature-new gift-wrapping`);
   if none was given, derive one from the request and state your choice.
2. Run `node scripts/features/cli.mjs new <id>`. It refuses invalid or taken
   ids — follow the hint in any error.
3. Read `docs/features/TEMPLATE.md`: its front-matter comments are the key
   vocabulary (allowed keys, enums, state-conditional presence, canonical
   order) and its body comments are the section rules. Fill the record:
   Context in one sentence; the sections below it only on explicit demand;
   delete each guidance comment you fulfil. A record is born
   `delivery: backlog` — do not advance the state at creation; advancing is
   a later edit (priority required when active, human evidence at accepted).
4. Run `node scripts/features/cli.mjs roadmap --sync` so the README roadmap
   block includes the record, then `node scripts/features/cli.mjs check` and
   fix everything it reports until it prints `all rules pass`.
5. Commit the record and README together in one commit.
