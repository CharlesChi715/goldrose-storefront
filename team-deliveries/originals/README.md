# originals/

The delivered files, kept untouched after parsing. This folder holds **what was
sent**, not what parsing produced — the parse output lives in the repo proper
(`docs/ixd/`, components, tests).

One folder per batch, `<YYYY-MM-DD>-<slug>/`, each carrying a `batch.md` that
lists every file with its sha256 and size.

These files are the authority — on wording disputes the Chinese source wins.
Do not delete them, and never change a delivered word.

One mechanical exception: a batch that moves may have its **relative link paths**
re-based so the file still opens. That touches plumbing we added during import,
never the delivered text, and it must be recorded in that batch's `batch.md`.

The hashes in each `batch.md` are what the pre-parse check reads to tell a
duplicate from a re-delivery.
