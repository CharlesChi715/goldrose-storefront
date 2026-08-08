# figma-sync (newsletter + bag) · 2026-08-07 · `feat/figma-sync`

Scoped sync against file version `2384987526951212407`: Charles asked for two
areas only — the homepage newsletter control, and `/bag`. Scope reported **5
added, 42 modified, 1 removed**; the rest of that list is deliberately left
un-imported, so the baseline is **not** stamped and the next sync still sees
everything.

Two frames in the delivery are prototype **orphans** (`2974:359` "EE" and
`2976:375` "(NOTHING)"). That is expected rather than a reachability problem:
both are *state variants* of a screen that already has inbound links, not
destinations of their own.

`feat/figma-sync` had been deleted, so this recreated it off `main`. It is
still true-merge-only per the skill — never squash it.

---

## AI-040 · `AGENT-DECISION` · the welcome card's tap target, and its name

The signed-in newsletter card (`2974:359` → `Frame 115`) is a standalone spec
frame with **no prototype edges at all**, so the design records two things it
does not answer:

1. **Where it goes when tapped.** Decided: `/account`. A gold card naming the
   signed-in customer that does nothing reads as broken on a live site.
2. **What it says when the account has no name.** The card is 187px wide with
   the name in 20px Playfair. The owner's 2026-08-02 rule (recorded in
   `lib/account/data.ts#displayNameOf`) says to fall back to the **whole email
   address** — that fits the `/account` dashboard's full-width heading, but
   not this box. Decided: fall back to the email's **local part** only
   (`qiyaofu715@gmail.com` → "Hello, qiyaofu715"), then "there".

The second is the one worth a look: it is a deliberate, narrow deviation from
a rule the owner set, forced by the design's own box. `lib/account/greeting.ts`
is separate from the dashboard helper precisely so the dashboard's behaviour
is unchanged.

**Needed:** confirm or veto either choice. Both are one-line reversals.

Location: [`components/home/NewsletterJoin.tsx`](../../components/home/NewsletterJoin.tsx),
[`lib/account/greeting.ts`](../../lib/account/greeting.ts)

---

## AI-041 · `OWNER-DECISION` · `/bag` promises shipping we have not priced

Both new bag frames draw the same shipping card, unconditionally and with the
meter full:

> ●  COMPLIMENTARY SHIPPING UNLOCKED
> Order by 4:00 PM for same-day dispatch

It shows on an **empty** bag too, because the frames put it in the shared
header section. Two claims are made there — free shipping, and a same-day
dispatch cut-off — and neither has anything behind it: rest-of-world shipping
is still the `$19.95` placeholder of **OQ-2**, which SUMMARY lists as a hard
release gate, and no dispatch policy exists.

This predates the sync; it is carried over verbatim rather than quietly
reworded, because rewording a shipping promise is the owner's call, not an
importer's. Under the 08-07 "gradual de-mocking" rule a live placeholder may
never assert a price, delivery date or policy we cannot honour — so this is
one of the strings that must change **before the first real order**, not one
that can sit there looking unfinished.

**Needed:** either the real policy (then the copy becomes true), or a design
change removing the claims. The card is wired to nothing, so either is cheap.

Location: [`components/screens/BagScreen.tsx`](../../components/screens/BagScreen.tsx)

---

## AI-042 · `PLACEHOLDER` · "Move to Wishlist" has no feature behind it

The line-item card draws `Move to Wishlist     /     Remove` as one text node.
**Remove** is now wired to the real cart. **Move to Wishlist** is not, and
there is no wishlist anywhere in the build — so half of a control that looks
like two links does nothing.

Left as the design draws it rather than deleted, since removing half a text
node is a design change. `ASK AURI` on the concierge card is static in the
same way, exactly as it was before this sync.

**Needed:** a ruling — build a wishlist, drop the label, or accept it as
visibly inert until the wishlist exists.

Location: [`components/screens/BagScreen.tsx`](../../components/screens/BagScreen.tsx)

---

## Two older matters this branch settles — close them after it merges

Both are other sessions' matters, so they are left open rather than closed
here: closing archives them, and this branch is not merged yet.

- **`AI-017` (`AGENT-BLOCKED`)** — "nothing in the live site can change cart
  quantity or remove a line — wire `/bag` to the real cart." Done: the stepper
  and Remove now mutate the real cart.
- **`AI-025` (`AGENT-DECISION`)** — "the newsletter field is display-only,
  because no subscribe endpoint exists." Moot: the 08-07 frame **deleted the
  field**. Its in-place tag went with the markup it described, so
  `npm run agent-inbox:check` reports it as tag-less until it is closed.

```bash
npm run agent-inbox:close
```

(`AI-031` is also reported tag-less, but that predates this branch.)

## Delivered this session

- **Homepage newsletter control rebuilt as two states.** The email field is
  deleted at source; signed-out visitors get the JOIN pill (`143×42`, r4),
  signed-in ones the ACCOUNT-INFO welcome card (`187×71`, r15) naming them.
  Built as a client island on the `AccountTabArt` precedent, so `/` stays
  statically prerendered — verified in the build output: the card's copy
  appears only as an RSC prop, never as server-rendered markup.
- **`/bag` re-imported from `1523:3059` + `2976:375`.** The frame shrank
  1726 → 932 because the delivery deleted gift services, the product-story
  panel, the gift note, the order summary, the payment marks and the FAQ rows.
  New member-benefit copy and exports (`2978-434…436`).
- **`/bag` now reads the real cart.** The design's "Artisan Blue Rose"
  placeholder row is gone; lines resolve against the DB catalog through
  `useCart()`, the stepper and Remove mutate it, and the new empty frame shows
  when the bag is empty. The canvas grows one 284px pitch per extra line.
- **`newsletter_placeholder` retired from the home-content registry**, and
  `newsletter_welcome_text` / `newsletter_welcome_greeting` added, so the
  owner can still edit every string on the new card.
- **Not stamped:** `npm run figma:baseline` was deliberately NOT run — 40+
  changed frames (chiefly the homepage typography pass) are still un-imported,
  and stamping would hide them from the next sync.
