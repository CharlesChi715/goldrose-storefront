# figma-sync (date wheels) · 2026-08-05 · `feat/figma-sync`

Second sync of the day. File version `2383842832809713066` — **unchanged**, so
no frames moved, and `unbuilt` is now **0** (the morning sync cleared the
backlog). The delivery was a **comment**: the thread count went 72 → 73.

The new comment is Charles's own reply in the design team's scroll-wheel
thread on `2053:207`:

> 苏苏白衣: 这个夫哥你那边能设置滚轮下拉框吗，还是我们必须把所有数据列完给到你
> CHARLES: **我试试**

Under the sync skill's ownership rule that is Charles's own to-do, delegated to
the agent, and he confirmed it in session ("yes do it, 我试试 part, do it in
frontend"). So this sync's work was building the wheel.

**What was actually missing.** The 08-02 note recorded the answer as "yes —
already built", because it read 滚轮下拉框 as "a dropdown that scrolls". The
menus did scroll, and the option lists were already generated in code rather
than drawn — which answers the team's *second* question ("must we list all the
data?"). But a 滚轮 is the iOS-style wheel: you spin it, and whatever rests
under a fixed indicator is the value. That did not exist; the menus were
tap-to-pick lists. It exists now.

---

## AI-032 · `AGENT-DECISION` · the wheel pins the drawn pill to the menu's centre

A wheel needs its selection indicator in one fixed place. The frames
(`2053:183` year, `2053:207` month, `2053:193` day) draw the dark `#493026`
pill wherever the selected row happens to fall in a static list — Aug sits at
y211 inside the 273-tall month window, which is simply `12 + 7 × 29`. A static
list has nowhere else to put it.

So the pill is now a **fixed centre band** and the rows scroll beneath it.
Everything else is verbatim: 126 width, 29/38 pitch, 116×25 pill at x5 r7,
Playfair 16/21 options at x16, all colours.

This is the only pixel difference from the three menu frames, and it is
inherent to the thing the team asked for — a wheel whose indicator moved with
the selection would not be a wheel.

**Needed:** the design team re-draws the three menu frames with the pill
centred (a one-frame change each), or tells us they prefer something else.

**Prepared reply for the Figma thread** (the repo token is read-only, so
Charles must paste it — the AI-011 constraint):

> 滚轮做好了，前端实现的，选项不用你们全画出来：日 1–31、月 Jan–Dec、年沿用
> 你们画的 2020–2027，都是代码里生成的。一个问题：滚轮的选中框必须固定在中
> 间，滚动的是选项本身，所以现在选中的深色 pill 固定在菜单正中间，而不是像
> 2053:207 那样跟着 Aug 走。麻烦把三个菜单帧（2053:183/207/193）的 pill 改到
> 正中间，其他都不用动。

Location: [`components/screens/ReminderEditModal.tsx`](../../components/screens/ReminderEditModal.tsx)

---

## Pending from design — noted, nothing changed

- **`/account/reminders · edit open`** — 苏苏白衣: "这个先设定为固定值，不能修改"
  (set this as a fixed value, not editable). Already honoured: the lead-time
  UNIT is fixed; only the number is editable, per the owner's 08-03 request.
  Unresolved in Figma, but nothing to do in the repo.
- **`/account/addresses`** (`2118:246`) and **`/gift-guide`** (`1942:182`) —
  still not Ready-for-dev. Unchanged for a third sync.
- **12 scaffold targets** unchanged; all already have coming-soon routes.

## Repo ↔ Figma drift

4 repo routes with no frame, 2 frames with no route — both of the latter are
the not-ready pages above. 3 further entries are suppressed by
[`scripts/figma/drift-allowlist.json`](../../scripts/figma/drift-allowlist.json)
as settled. Nothing deleted.

## Still not fixed — pre-existing

`tests/e2e/pixels.spec.ts` › "pixel baseline: product-detail" still fails, as
reported by the morning session (verified there against a stashed tree, so it
is not from either sync).

## Delivered this session

- `components/screens/ReminderEditModal.tsx` — the three date menus are now
  滚轮 wheels: scroll-snap rows, a fixed centre pill, value taken when the
  spin settles (debounced 90ms), the wheel staying open. A tap on a row remains
  the decisive gesture that takes the value and closes, so the 08-02 behaviour
  and its test survive unchanged. Opening centres the current value —
  `scrollTop === index × pitch` by construction of the half-window padding.
- `tests/e2e/screens.spec.ts` — one new test covering the wheel contract and
  the generated 31-day range; the whole file (14 tests) passes.
- AI-011 narrowed to its second, still-unposted reply.
