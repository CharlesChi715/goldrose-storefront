# Delivery protocol — how work is handed over

|                      |                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| **What this is**     | The record of how work and outcomes move between the people on this project: what each hand-over must contain, and what happens when something is missing. |
| **Standing doc**     | Not a per-task hand-off. Revise it as the process improves; do not delete it.                      |
| **Opened**           | 2026-07-28                                                                                          |
| **Owns**             | Design intake. [`docs/engineering-playbook.md`](../engineering-playbook.md) links here instead of repeating it. |
| **Status**           | §2 checklist is **Proposed** — needs the design team's agreement. §3–§5 are **Adopted** (our side, in force now). |

---

## 1. The chain

```text
bosses ──decide──▶ design team ──frames + mechanism table──▶ Charles (dev)
   ▲                    ▲                                        │
   │                    │                                        │ implements
   │              questions (DQ-nn)                              ▼
   │                    │                              Vercel preview URL
   │                    └──────────design QA────────────────────┤
   └──────────────acceptance walkthrough─────────────────────────┘
```

Three hand-overs, each with a return leg:

| # | From → to | Carries | Return leg |
|---|---|---|---|
| 1 | Design team → dev | Figma frames + the mechanism table (机制表) | Questions in [`docs/TODO/design-team-questions.md`](../TODO/design-team-questions.md) |
| 2 | Dev → design team | A live preview URL of the implemented frames | Design QA: drift, mistakes, "that's not what I meant" |
| 3 | Dev → bosses | The deployed site + what is real vs placeholder | Acceptance, or a decision we were blocked on |

The recurring failure is leg 1 arriving incomplete, which turns leg 2 into
guesswork and leg 3 into a surprise. §2 exists to stop that.

---

## 2. Leg 1 — design team → dev  ·  **Proposed**

### The principle

Every visible element — every button, image, card, input — must answer three
questions before the frame counts as delivered:

1. **What is it called?** — a stable ID, e.g. `HOME-HERO-SHOP-BTN`
2. **Does it do anything?** — clickable, or display-only
3. **If yes, what happens?** — trigger → result (opens frame X, opens overlay
   Y, submits, or *deliberately* nothing yet)

Everything below is machinery for delivering those three answers reliably.

### 交付清单 · Frame delivery checklist

Run once per frame, before the frame moves to 已完成.

| # | 中文 | English | Prevents (real incident) |
|---|---|---|---|
| 1 | 画板命名符合命名规范 | Frame named per the [naming guide](from-teammates-figma-naming-guide.md) | Frames identified only by node id (`914:117`) |
| 2 | 每个元素图层名 = 元素编号 | Every element's Figma **layer name** is its ID | Names live only in code; nobody can point at a thing in Figma |
| 3 | 每个可点击元素已连原型线，或明确标注「暂无目标」 | Every clickable layer is prototype-linked to its target frame, or explicitly marked **no target yet** | 13 groups of inert buttons (DQ-01…DQ-10) |
| 4 | 状态齐全：默认 / 按下 / 禁用 / 加载中 / 空 / 错误 | All states drawn: default, pressed, disabled, loading, empty, error | B-2's pay button has no disabled state (DQ-14) |
| 5 | 占位内容已标注为占位 | Placeholder copy, prices and photos marked as placeholder | `$189` struck through above a `$219` price |
| 6 | 图片可直接导出：透明 PNG 或 SVG，不靠混合模式 | Assets export-ready: real transparent PNG or SVG, no blend-mode workarounds | Mascot art is an opaque bitmap with a checkerboard baked in, hidden by `DARKEN` |
| 7 | 图片来源已标注：自有 / 已授权 / 占位 | Every image tagged owned / licensed / placeholder | A third party's gift-box photo shipped to `/shop` |
| 8 | 无模拟残留：状态栏、9:41、Home 指示条、模板文字 | No mock artifacts: status bars, `9:41`, iOS home indicator, template residue | `"120 APPAREL / Women ×"` left in the shop frame |
| 9 | 同一界面只用一套视觉语言（配色、底部导航、字体） | One visual language per surface: palette, bottom nav, type | Two palettes and three different bottom nav bars are now live |
| 10 | 复用已发布组件，不复制图层 | Reuse published components rather than copying layers | Same component diverging between frames (FAQ hairline) |
| 11 | 重新交付的画板附一行变更说明 | A re-delivered frame carries a one-line changelog | The account tab was renamed Login → Me → Login → Me across four revisions |
| 12 | 机制表已补全新增/修改的元素 | The mechanism table covers every new or changed element | Elements shipped with no stated behaviour at all |

### Batch note

Each delivery batch arrives with one short note: **date · frame IDs included ·
what changed since last time · anything knowingly unfinished.** Two lines is
enough. Without it we cannot tell a new frame from a silently revised one.

### Definition of Ready

A batch is ready for development when items 1–12 pass for every frame in it and
the batch note exists. Anything short of that is a draft — we can look at it,
but we do not import it.

---

## 3. What we do on receipt  ·  **Adopted**

1. **Archive the source verbatim.** The design team's original file arrives in
   [`team-deliveries/inbox/`](../../team-deliveries/README.md) and, once parsed, is kept
   untouched in `team-deliveries/originals/<YYYY-MM-DD>-<slug>/` with its `batch.md`
   (every file, its sha256 and size). Chinese exports are archived beside them.
   **On wording disputes the Chinese source wins.** Before parsing anything,
   run the duplicate/re-delivery check in `team-deliveries/README.md` — a hash that
   already exists means stop and ask, not re-import.
2. **Transcribe, never paraphrase.** The English working copies in this folder
   ([shop.md](shop.md), [order-detail.md](order-detail.md)) are translations. Preserve the wording;
   problems found in the source are marked inline with `⚠️ Developer note`, not
   silently corrected.
3. **Give every entry a stable ID** (`H-09`, `ORDER-DETAIL-SHARE-TRACKING`) and
   an annotated screenshot in `assets/` with a red box on the element.
4. **Implement.** Reference the ID in commits and code comments —
   `implements H-09`.
5. **Tag the elements** with `data-el` per [element-names.md](element-names.md).
6. **Record the import findings** in [README.md](README.md) — what was
   inconsistent, what shipped verbatim anyway, what we changed and why.

### When something is missing

The design team's own instruction, from [README.md](README.md):
*"leave placeholder in unsure things."* Concretely:

> **Do not guess and do not silently invent.** Ship the safest placeholder,
> then add a numbered `DQ-nn` entry to
> [`docs/TODO/design-team-questions.md`](../TODO/design-team-questions.md)
> recording the question, what we shipped meanwhile, and a recommendation.

Safest placeholder, in order of preference: leave the element inert → point it
at the nearest honest existing page → use `assets/PlaceholderPicture.png` for
unknown imagery. Never a control that looks live but goes nowhere — a card
field that submits nothing is a security hazard, not a placeholder.

---

## 4. Leg 2 — dev → design team  ·  **Adopted**

Implemented frames go back as a **Vercel preview URL**, not screenshots — the
design team should exercise the real thing on a real phone. Send: the URL, the
frame IDs it covers, the `⚠️ Developer note` list, and the new `DQ-nn`
questions.

Pixel fidelity is machine-checked (Figma frame render → Playwright screenshot →
band diff), so leg 2 is about **intent**, not pixels: is this what the
interaction was supposed to do?

---

## 5. Leg 3 — dev → bosses  ·  **Adopted**

- The deployed testing site is the deliverable:
  <https://goldrose-storefront.vercel.app>.
- Every hand-over states plainly **what is real and what is placeholder** —
  `SUMMARY.md` carries the current line, the release queue carries what is left.
- Decisions we cannot make are written up in [`docs/TODO/`](../TODO/README.md)
  with a recommendation attached. Never a bare question.
- Final acceptance runs through the
  [owner walkthrough](../admin-design.md#143-final-acceptance).

---

## 6. One string, five places

The whole naming apparatus exists for this: an element carries **one** name,
never transformed, so the boss can point at it, the designer can find it, and
it can be grepped.

```text
Figma layer name  ─┐
mechanism table ID ├─▶  HOME-HERO-SHOP-BTN
data-el in code   ─┤
test selector     ─┤
analytics event   ─┘
```

Grammar, vocabulary and enforcement: [element-names.md](element-names.md)
(guarded by `tests/unit/element-names.test.ts`). The owner's source vocabulary:
[from-teammates-figma-naming-guide.md](from-teammates-figma-naming-guide.md).

⚠️ **Currently only half-live.** Code carries `data-el` and the test enforces
it, but the Figma layers are not yet named this way — which is why checklist
item 2 is the highest-leverage ask on the list.

---

## 7. Artifact map

| Artifact | Lives in | Owned by |
|---|---|---|
| Figma frames | the design team's Figma file | design team |
| Mechanism table (机制表), original | `team-deliveries/originals/<batch>/*.numbers` + `*.zh.md` | design team |
| Mechanism table, English working copy | `docs/ixd/{homepage,shop,order-detail}.md` | dev (translation) |
| Annotated screenshots | `docs/ixd/assets/` | design team's prototype, archived by dev |
| Naming vocabulary, owner's source | `docs/ixd/from-teammates-figma-naming-guide.md` | owner (verbatim transcription) |
| Naming convention as applied | `docs/ixd/element-names.md` | dev |
| Import findings and conflicts | `docs/ixd/README.md` | dev |
| Open questions for the design team | `docs/TODO/design-team-questions.md` | dev, answered by design team |
| This protocol | `docs/ixd/delivery-protocol.md` | dev |

---

## 8. Tooling note — Figma Dev Mode

If the design team's Figma plan includes **Dev Mode**, three features replace
most of §2's manual effort:

- **"Ready for Dev"** — a status flag on the frame. Not flagged = not
  delivered. Replaces the batch note.
- **Annotations** — designers pin behaviour notes onto layers directly, so the
  mechanism table stops being a separate file that drifts from the frames.
- **Code Connect** — maps a Figma component to the real React component, so
  opening `SHOP-PRODUCT-CARD` in Dev Mode shows `<ProductCard />` and its props
  instead of generated CSS.

**Unconfirmed:** we do not know the team's plan tier. Ask before assuming.
Nothing in §2 depends on it — the checklist works on the free plan in a shared
doc, just with more manual effort.

---

## 9. The mechanism table as delivered (机制表)

The design team's 12-column table, exactly as it arrives. Two renderings of the
same rows: the original, and a bilingual copy where every cell reads
**English (中文)**. Sample rows are N-01 and N-02 from the shop sheet; the full
set lives in [shop.md](shop.md) and [homepage.md](homepage.md).

### 9.1 Original (原表)

| 编号 | 局部截图 | 区域/模块 | 元素类型 | 布局属性 | 是否可点击/操作 | 触发方式 | 跳转/触发结果 | 目标页面/界面 | 状态与反馈 | 开发备注 | 目标页制作情况 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| N-01 | | 顶部促销条 | 公告条 | 页面顶部；吸顶固定 | 默认不可点击 | 无 | 仅展示品牌主张 | 无 | 文本可配置，不滚动 | 画面未见目标链接；不应擅自整条可点击。 | |
| N-02 | | 顶部导航栏 | 菜单图标按钮 | 顶部吸顶固定；居左 | 可点击 | 单击 | 打开侧边导航抽屉 | 侧边菜单栏（抽屉） | 打开后显示遮罩；再次点击/点遮罩关闭；页面滚动锁定 | 菜单内容含分类、账户、客服等入口 | 未做 |

### 9.2 Bilingual — English (中文)

| Row ID (编号) | Screenshot (局部截图) | Section (区域/模块) | Element type (元素类型) | Layout (布局属性) | Interactive? (是否可点击/操作) | Trigger (触发方式) | Result (跳转/触发结果) | Target (目标页面/界面) | States & feedback (状态与反馈) | Dev note (开发备注) | Target status (目标页制作情况) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| N-01 | — | Top promo bar (顶部促销条) | Announcement bar (公告条) | Top of page; sticky (页面顶部；吸顶固定) | Not clickable by default (默认不可点击) | None (无) | Displays the brand claim only (仅展示品牌主张) | None (无) | Text is configurable, does not scroll (文本可配置，不滚动) | No target link visible in the mock; do not make the whole bar clickable on your own initiative (画面未见目标链接；不应擅自整条可点击。) | — |
| N-02 | — | Top nav bar (顶部导航栏) | Menu icon button (菜单图标按钮) | Sticky at top; left-aligned (顶部吸顶固定；居左) | Clickable (可点击) | Single tap (单击) | Opens the side navigation drawer (打开侧边导航抽屉) | Side menu drawer (侧边菜单栏（抽屉）) | Shows a scrim when open; tap again or tap the scrim to close; page scroll locked (打开后显示遮罩；再次点击/点遮罩关闭；页面滚动锁定) | Menu holds category, account and customer-care entries (菜单内容含分类、账户、客服等入口) | Not done (未做) |

Two cells are blank in both rows — Screenshot (局部截图), because embedded
images do not survive the `.numbers` export, and N-01's Target status
(目标页制作情况). A blank cell cannot be read: not applicable, or forgotten?
