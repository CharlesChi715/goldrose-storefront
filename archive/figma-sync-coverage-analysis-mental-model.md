# Diagnosing figma-sync under-import — a mental model

> **What this is.** A framework for analysing why a `figma-sync` pass leaves
> Figma updates un-imported, plus the preparation to do *before* analysing.
> Written 2026-08-03 in response to "a lot of updates in Figma don't get
> imported — give me a mental model before the analysis."
>
> It is a **method, not a finding**. No analysis had been run when this was
> written. English first, 中文 second — same document, translated.
>
> Grounded state at time of writing: four sync passes had recorded Figma file
> versions in prose inside `docs/ixd/README.md` — `2382365737…` (07-31 13:26),
> `2382387929…` (07-31 14:22), `2382879093…` (08-02 02:54) — with the file then
> at `2383085651…`. No `scripts/figma-*` existed, so enumeration was entirely
> model-driven.

---

# English

## 0. First, split the complaint in two

"Doesn't sync well" hides two different failures with different instruments:

- **Coverage** — the sync never *considered* something it should have.
- **Fidelity** — it considered and built it, but the result doesn't match the frame.

Don't investigate both at once. Everything below is coverage.

Then a second split that matters more, because getting it backwards makes
things worse:

**Deliberate omission vs silent drop.** This skill is *designed* to skip:
unmarked frames (§3), pending-from-design (§4), prototype links that would fake
live features (AI-008). `SUMMARY.md` is full of "**Not imported:**
BLOG-JOURNAL-PAGE… RETURNS-REQUEST-SUBMITTED…". If you tune the pipeline to
import more without separating these first, you'll start importing un-final
design — a worse failure, and one the design team will notice.

> **Insight.** This distinction is hard because **both produce identical
> evidence**: a frame in Figma, nothing in the repo. The only thing that tells
> them apart is the *paper trail* — a hand-off note saying "deliberately
> skipped, here's why." So the quality of your analysis is capped by the
> completeness of those notes. That's not incidental; it's why §4 mandates them.

## 1. Model A — the funnel

A frame must survive every stage to land in the repo. One symptom, eight drop
points:

```text
Exists in Figma
  └─▸ Retrieved        did my API read actually return this node?
      └─▸ Gated in     devStatus on it, or on an ancestor SECTION
          └─▸ Attended did the model actually look at it, in a long batch?
              └─▸ Scoped   policy said build (not "pending from design")
                  └─▸ Built      code written
                      └─▸ Verified   band-diff run
                          └─▸ Landed     merged to main, survived the merge
```

The discipline: **count survivors at each stage**, don't guess the cause. Same
technique as a checkout funnel — you don't theorise about why sales are low, you
find the step where the number collapses.

Two stages deserve flagging because they're non-obvious:

- **Retrieved** — a real, observed loss mechanism. `?depth=1` returns
  `"kids": 0` for a page: depth truncation silently returns a *valid response
  containing nothing*, with no error. If a sync reads shallow, whole subtrees
  are invisible and everything downstream is correct-but-empty.
- **Landed** — §0 of the skill warns a squash on `feat/figma-sync` causes
  phantom conflicts. Work can be genuinely built and then lost in the merge.
  Cheapest possible check: `git log main..feat/figma-sync`.

## 2. Model B — hypotheses have signatures

Each stage predicts a *different pattern* of misses. This converts debugging
from guessing into pattern-matching, and it's the part most people skip:

| If the drop is at… | Misses cluster… | Cheapest discriminating test |
| --- | --- | --- |
| **Retrieved** | in deep nesting; whole subtrees absent | re-fetch that subtree explicitly, see if it appears |
| **Gated** | *perfectly* correlated with unmarked `devStatus` — zero exceptions | one `jq` over `devStatus`, cross-tab against misses |
| **Attended** | late in batch order, or in the biggest frames; **differs between runs** | replay on frozen input (below) |
| **Scoped** | each miss has a hand-off note explaining it | grep the session files |
| **Built/Verified** | code exists but wrong — not this symptom | band-diff |
| **Landed** | present on `feat/figma-sync`, absent on `main` | `git log main..feat/figma-sync` |
| **Not stale-adjusted** | frame changed *after* the last sync version | version diff |

> **Insight.** A hypothesis that predicts the same evidence as every other
> hypothesis is worthless. "The AI missed it" predicts nothing — it's compatible
> with all seven rows. Force every candidate cause to commit to a
> *distinguishing* prediction before you look at the data, or you'll confirm
> whichever one you thought of first.

## 3. Model C — three structural properties that make this pipeline lose work

Worth betting on before seeing any data, because they're architectural rather
than incidental:

**1. There is no error channel.** A missed frame doesn't throw, log, or fail a
build. Compare `lib/email.ts`, which `SUMMARY.md` flags as "never throws by
design" — that's why a missing `RESEND_API_KEY` silently console-logs production
mail instead of sending it. **Same failure class.** Silent omission is invisible
until someone eyeballs the result. Industrial fix: have the pipeline emit a
manifest of *everything it considered and why it skipped each item* — omission
becomes loud.

**2. Enumeration and judgment are both done by the model.** There is no
`scripts/figma-*.mjs`, so enumeration is 100% model-driven. But enumeration is
mechanical and *deterministic* (list nodes, read devStatus, apply the section
cascade), while judgment (is this comment a directive or an acceptance?)
genuinely needs a model. Fusing them means enumeration inherits the model's
non-determinism: two runs over the same file can produce different worklists,
and nothing detects the difference. **Split them** — script the census, let the
model judge each row.

**3. The pipeline is stateless across passes.** Each pass decides scope afresh
in conversation. Skips don't accumulate into a durable queue — the
"pending from design" backlog exists, but as *prose*, spread across
`SUMMARY.md` and the session files. Prose can't be reconciled, so it decays.
Anything skipped in pass N is only reconsidered in pass N+1 if a human
remembers.

And the compounding one: **watermarks are recorded but never diffed against.**
Four versions sit in `docs/ixd/README.md`, yet every pass re-derives scope by
eyeball from the whole file instead of asking "what changed since
`2382879093…`?" Figma's REST API accepts `?version=<id>`, so an exact old-vs-new
diff is available and has never been taken.

## 4. The preparation

Build these artifacts *before* forming conclusions. Ordered by dependency:

**A. Freeze a snapshot.** Dump the full `/v1/files/:key` JSON to disk; record
`version` + `lastModified`. The team edits live — analysis against a moving
target is unfalsifiable, and "X wasn't imported" becomes indistinguishable from
"X changed after the sync." This is the step that makes everything else evidence
rather than anecdote.

**B. Reconstruct the watermark timeline.** Pull the versions out of
`docs/ixd/README.md` into a machine-readable table: pass date → version consumed
→ branch/commit.

**C. Take the version diff.** Fetch `?version=<last sync>` and diff the node
trees against the frozen snapshot. The first time there is an *actual, complete*
list of what changed since — rather than what someone noticed had changed.

**D. Build the census.** One row per candidate node: id, name, own `devStatus`,
inherited section status, expected-by-gate, repo artifact present, explained by
a hand-off note. This is the instrument; everything after is reading it.

**E. Inventory the repo side.** Routes and components, so the "present?" column
is mechanical rather than remembered. §5 of the skill already asks for the
reverse direction (repo-without-Figma drift), so it's dual-purpose.

**F. Cross-reference the paper trail.** `agent-delivery/sessions/*.md` +
`SUMMARY.md`. Every absent-but-expected frame either has a note (→ deliberate)
or doesn't (→ **silent drop, the real bug list**).

Then one experiment worth running above all others:

> **Replay on frozen input.** Re-run the sync's read + scope stage against the
> *frozen* snapshot from (A), and compare its worklist to the original pass's.
> Identical input, so any difference in coverage isolates non-determinism in
> enumeration — cleanly separating "the gate/policy excluded it" from "the model
> just didn't get to it."

## 5. The discipline that makes conclusions hold

- **Define "an update" precisely.** New frame? Changed frame? Changed comment?
  Changed prototype link? Each has a different detection mechanism, and only the
  first is easy.
- **Write predictions before looking.** "If it's the gate, then 100% of misses
  are unmarked." Then check. A prediction that survives is worth ten post-hoc
  explanations.
- **Decide the acceptance bar up front.** Is the goal 100% coverage, or "no
  silent drops, all skips explained"? The second is achievable and verifiable;
  the first isn't, because the Ready-for-dev gate is *supposed* to exclude
  things.

> **Insight.** What the preparation really produces is not an answer but a
> **reconciliation**: two independently-derived lists (what Figma says should
> exist, what the repo contains) compared row by row. Same instrument as a bank
> reconciliation, and the standard tool whenever a process has no error channel.
> You can't audit a silent pipeline; you can only reconcile it against ground
> truth.

**Recommended starting point:** (A) + (C) — freeze the snapshot and diff against
the last recorded version. One script, reusable at every future sync, and it
converts "a lot of updates don't get imported" into a concrete list of node ids.