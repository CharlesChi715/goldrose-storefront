# team-deliveries/

Raw deliveries from the design team (and any other upstream source) enter here.

## Owner's instruction (verbatim)

> i am thinking of the workflow in the futuer: i put thte raw delivery directly
> into a folder(u name it) and whenveer i let agetn process that folder means to
> parse the all contetns in that folder and put the parse the result into
> cooresponding place in the repo( i will gvie instructin of how to do that in
> thet future). and move the parsed raw files into another dedciated folder to
> store them( u name it) add readme to each folder and put my original idea into
> it dont come up ideas urself.

> To solve the re-delivery, before the parse, you check if the contents are
> already included in this repo and if your suspicious is already included and
> prompt me, don't do things. And after all of that, do the parse.

## Folders

- `inbox/` — raw drops, not yet parsed. Empty = nothing pending.
- `originals/<YYYY-MM-DD>-<slug>/` — the delivered files, kept untouched after
  parsing. The parse **output** goes into the repo proper; this folder keeps the
  **originals** the output came from.

Superseded repo docs go to `archive/`. Scratch goes to `trash/`. Neither belongs
here.

## Running a parse

1. **Check first, do not act.** For every file in `inbox/`, compare its sha256
   against the **as received** hashes in `originals/*/batch.md` — never the
   "on disk now" ones, or a genuine duplicate reads as a re-delivery.
   - Hash matches an existing entry → already delivered. Stop.
   - Same subject, different hash → re-delivery. Stop and show the owner what
     changed.
   - Neither → new, continue.
2. **Parse** per the routing table below.
3. **Move** the raw files into `originals/<YYYY-MM-DD>-<slug>/` and write its
   `batch.md`: every file with its **as received** sha256 and size, what changed
   since last time, and anything knowingly unfinished. If a stored file is ever
   altered (only a link re-base is permitted — see `originals/README.md`),
   record the new "on disk now" hash **beside** the as-received one, never
   instead of it.

Nothing leaves `inbox/` until its parse output is committed.

## Routing table

AI-TAG(AI-004): OWNER-TODO — the routing rules are not written yet. See
/agent-delivery/sessions/initial-inbox-07-30.md.

Until this table is filled in, an agent must **not** choose a destination on its
own — stop and ask.

| Delivery contains   | Parse output goes to |
| ------------------- | -------------------- |
| _(not yet defined)_ | _(not yet defined)_  |

## Related

- `docs/ixd/README.md` — where parse output lands and how it is transcribed
  (verbatim mirror, `⚠️ Developer note` for problems).
