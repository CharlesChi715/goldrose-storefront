<!-- Closed agent-inbox matter. Private working record — an AI agent
     must ask Charles before reading anything in this folder. -->

## AI-044 · `OWNER-DECISION` · the home frame still says GoldRose in three places

The ELDREVE rename landed 2026-08-05, and AI-037 already records that the
Figma file kept the old name in three unrelated frames. The home frame is a
fourth, in three separate nodes:

| Node                      | Frame says                                    | The repo ships                     |
| ------------------------- | --------------------------------------------- | ---------------------------------- |
| A-1 hero eyebrow          | `—   G O L D R O S E   —`                     | the same — **this one is live**    |
| A-5 intro                 | "Find a GoldRose for every meaningful moment." | "Find an ELDREVE …"                |
| A-9 workshop title        | "Inside the GoldRose Workshop"                | "Inside the ELDREVE Workshop"      |

The last two were held at ELDREVE rather than re-imported verbatim, per
AI-037. The **hero eyebrow was not**, because it already read `GOLDROSE` in the
repo before this sync — a miss in the 08-05 rename that SUMMARY has flagged
since 08-07. It is the first line of type a visitor reads on eldreve.com.

**ANSWERED 2026-08-10 (owner): the frame wins.**

- **Hero eyebrow — leave it as `GOLDROSE`.** No change; it is an editable
  field, so this can be reversed with one save and no deploy.
- **A-9 workshop title — match the frame**, so the default went back from
  "Inside the ELDREVE Workshop" to **"Inside the GoldRose Workshop"**.
- **A-5 intro followed the same ruling** — "Find a **GoldRose** for every
  meaningful moment." It is the identical situation on the identical page, and
  leaving it at ELDREVE would have made two headings on one page disagree.
  Applied on the owner's stated principle rather than a separate answer, so
  say the word if that over-reached.

Recorded rather than argued: this puts the retired brand name on
eldreve.com in three places and partly reverses the 08-05 ELDREVE rename
(AI-021). The concern was raised before the decision; the decision stands.
AI-037 — the same stale name in three *other* frames — is unaffected and
still open.

Location: [`lib/home-content/registry.ts`](../../lib/home-content/registry.ts)
- **Closed:** 2026-08-10
- **Why:** answered 2026-08-10 — owner ruled the frame wins: hero eyebrow stays GOLDROSE, and the A-9 workshop title and A-5 intro reverted to the frame's GoldRose wording
