# figma-sync (addresses) · 2026-08-07 · `worktree-figma-sync`

Ran the Figma read pipeline against file version `2384895164224604107`. Scope
was **3 added frames, 40 "modified", 1 removed**. Two things had to be
established before any of that was actionable:

1. **11 of the 40 "modified" frames did not change visibly.** The fingerprint
   is `sha1(JSON.stringify(whole raw subtree))`, so prototype wiring, dev
   status or component-property edits flip it. Diffing the previous cached
   file against the new one frame-by-frame put the real count at **29**.
2. **`changes` compares Figma to Figma, so it cannot say what we owe.** Six
   read-only agents checked each of the 29 against the repo. Result: 56
   still-old, 5 already-done, **5 diverged**, 11 not built.

`feat/figma-sync` no longer exists (local or origin), so this ran on a
worktree branch off `main`. Whoever restores the long-lived branch should note
the skill still documents it as true-merge-only.

---

## AI-037 · `OWNER-DECISION` · the Figma file still ships the dead brand names

The 08-05 rename made **ELDREVE** the brand everywhere in the repo. The design
file did not follow, and three frames in this delivery still carry the old
names — so importing them verbatim would **reintroduce names we deliberately
killed**:

| Repo (correct)                    | Figma, old *and* new |
| --------------------------------- | -------------------- |
| `ELDREVE Support` ×4              | `GoldRose Support` → `MORI` |
| `Auri, your ELDREVE concierge`    | `Auri, your VELORIA concierge` |
| `32K+ real ELDREVE moments`       | `32K+ real GoldRose moments` |

The design file is not uniformly ahead of the repo: on brand strings it is a
version behind. This is a standing hazard for every future sync, not a one-off
— a pixel-faithful import is the *wrong* behaviour here.

Note the `/care/chat` row is doubly blocked: the new frame renames the support
persona to **MORI**, which is exactly the open question in AI-022.

**Needed:** the design team to run the ELDREVE rename through the Figma file,
or a standing ruling that brand strings are never imported from frames.

Location: [`components/screens/SupportChatScreen.tsx`](../../components/screens/SupportChatScreen.tsx),
[`components/screens/BagScreen.tsx`](../../components/screens/BagScreen.tsx),
[`components/pdp/PdpOverlays.tsx`](../../components/pdp/PdpOverlays.tsx)

---

## AI-038 · `OWNER-DECISION` · `/story` is orphaned from the design file

The shipped `/story` page declares its source frame as
`MESTORY-OUR-STORY-IMAGE-LED-PAGE (1573:106)`. That frame **no longer exists**
in the file — verified against the frame index (101 frames; `1573:106` absent).

Its replacement, `OUR-STORY-LONG-PAGE` (`2274:275`), is a different page at
**430×5807** and is **not marked Ready-for-dev**. This delivery also cut it
down further: the whole "OUR PROMISE" block, the gift-finder link, the closing
rose and the footer nav are gone (6330 → 5807).

So `/story` is live, but nothing in the design file describes what is on
screen. Rebuilding against 2274:275 is a full page build, not a delta, and is
out of scope until it is Ready-for-dev.

**Needed:** a ruling — leave `/story` as-is until 2274:275 is marked ready, or
ask the design team to mark it now and schedule the rebuild.

Location: [`components/screens/StoryScreen.tsx`](../../components/screens/StoryScreen.tsx)

---

## AI-039 · `PLACEHOLDER` · the address book has no backend

`/account/addresses` shipped this session, pixel-exact, but its three
addresses are the frame's own and nothing persists. The schema stores a single
`default_address` per customer, not a collection, so a real address book needs
a new one-to-many table before Add / Edit / "Set as default" can do anything.

The sheet's field list maps almost one-to-one onto checkout's existing shipping
form (`LiveInput` + `FieldBox`, with `COUNTRIES` already extracted), so the
data layer is the only missing piece.

**Needed:** nothing yet — this is the same visual-placeholder contract
`/account/reminders` ships under. It is recorded so the placeholder is not
mistaken for a working feature at owner acceptance.

Location: [`components/screens/AddressBookScreen.tsx`](../../components/screens/AddressBookScreen.tsx)

---

## Pending from design — no action taken

- **Reminders edit sheet, lead-time unit.** 苏苏白衣 on
  `REMINDERS-EDIT-OPEN-MODAL-PAGE`: 「这个先设定为固定值，不能修改」. Already
  matches the build (the unit is fixed, the number is editable), so nothing to
  do — recorded because it is an unresolved thread.
- **Month dropdown wheel.** The other unresolved thread asks whether dev can
  build a 滚轮 dropdown; Charles answered 「我试试」. **Already built** on
  2026-08-05 (`ReminderEditModal.DateDropdown`), so this thread can be closed
  in Figma.

## Evidence for the open AI-022

AI-022 asks whether the MORI mascot is retired. This delivery renames
`/care/chat`'s support persona from "GoldRose Support" to **MORI** in four
places — i.e. the design team is still using MORI, as the support voice rather
than a homepage module. Not an answer, but it should inform one.

## Not stamped

`npm run figma:baseline` was **deliberately not run**. Only part of the
delivery is imported; stamping now would mark all 29 changed frames as built
and the next sync would look empty.

## Delivered this session

- `/account/addresses` — ADDRESS-BOOK (2118:247) built pixel-exact, closing the
  last Ready-for-dev frame with no route (`figma:unbuilt` is now empty).
- The add / edit bottom sheet (2134:299 / 2610:373) as one component with a
  `mode` prop; keyed per open so Cancel genuinely discards.
- `/account` — the deleted three-tile ACCOUNT-ACTION-SHORTCUTS band removed and
  the service card lifted to y388; "Manage Addresses" wired to the new route.
- Homepage A-3 — the deleted Real Rose Promise ornament, heading and four tiles
  removed, and their five fields dropped from the admin registry. The 136px is
  returned by a new `band.trim`, so no later band's imported coordinates moved.
- **Carousel swipe bug fixed** (found while checking a report that the homepage
  carousel would not swipe). `EDGE_RESISTANCE` damped the drag at the first and
  last cell, and the *damped* value was compared against the commit threshold —
  so a swipe at either end needed 3× the travel and normally sprang back. Since
  the rails wrap and auto-play parks them on any slide, this affected every
  homepage rail and the PDP hero. The damping is now display-only.
- `lib/checkout/us-states.ts` for the sheet's state picker.
- Tests: 3 e2e for the address book, 1 e2e for the carousel wrap, and the
  home-content layout tests extended for `trim`.

Not built: the remaining 28 changed frames — most notably the homepage
typography pass and the seven other content deletions. See the scoping table in
the session transcript; none of it is blocked, it was simply not this
session's slice.
