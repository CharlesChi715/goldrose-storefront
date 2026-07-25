# Element naming — one string, three places

Every visible piece of the storefront (section, image, button, price…) carries
one stable, human-readable name. The same string appears in **three** places:

| Where | How it looks |
| --- | --- |
| Figma layer panel | layer named `HOME-HERO-SHOP-BTN` |
| Code | `data-el="HOME-HERO-SHOP-BTN"` |
| Tests / analytics | `[data-el="HOME-HERO-SHOP-BTN"]` |

The string is never transformed between them. That is the whole value: the owner
can point at a thing, the designer can find it in Figma, and it can be grepped in
the repo — with one word.

Source of the grammar and vocabulary: the owner's
`temp/Figma_UI_Naming_Guide_GoldRose.xlsx` (25 Jul 2026), transcribed verbatim to
[figma-naming-guide.md](figma-naming-guide.md).

**Division of labour between the two files:**

| File | Holds | Edit it when |
| --- | --- | --- |
| [figma-naming-guide.md](figma-naming-guide.md) | the owner's guide, **verbatim** | the owner changes the xlsx |
| this file | the convention we actually apply — grammar, rules, additions, removals | we decide something |

The vocabulary tables below are the **applied** set: the guide's words plus our
additions, minus our removals. The test parses them from this file.

---

## Grammar

```
PAGE - SECTION - [QUALIFIER] - TYPE  [-INDEX]
```

- Uppercase, hyphen-separated. No camelCase, no dots, no lowercase.
- `QUALIFIER` is optional — a FUNCTION verb (`SHOP`, `ADD-TO-CART`) or a
  descriptive noun (`PRODUCT`, `BENEFIT`, `EYEBROW`).
- `INDEX` only where the design fixes the count (see [Repeats](#repeats)).

```
HOME-HERO-SHOP-BTN            page  section  function  type
PDP-PRODUCT-TITLE             page  section            type
SHOP-PRODUCT-CARD             page  section            type
HOME-PROMISE-BENEFIT-CARD-2   page  section  noun      type  index
```

---

## Vocabulary

### PAGE 页面

| 中文 | 编号 | Meaning | Route |
| --- | --- | --- | --- |
| 首页 | `HOME` | Home Page | `/` |
| 商品列表页 | `SHOP` | Shopping/List Page | `/shop` |
| 商品详情页 | `PDP` | Product Detail Page | `/products/[slug]` |
| 购物车 | `CART` | Cart Page | ⚠️ not built |
| 结算页 | `CHECKOUT` | Checkout Page | `/checkout` |
| 登录注册页 | `AUTH` | Authentication | `/account` (signed out) |
| 账户中心 | `ACCOUNT` | User Account | `/account` (signed in) |
| 收藏页 | `WISHLIST` | Wishlist | ⚠️ not built |
| 搜索页 | `SEARCH` | Search Page | ⚠️ not built |
| 订单页 | `ORDER` | Order Page | `/orders` |
| 设置页 | `SETTINGS` | Settings Page | ⚠️ not built |
| 企业采购页 | `BUSINESS` | Business / Procurement | `/account/business` — **PROPOSED** |

**PROPOSED removal — `CART` (购物车):** there is no cart page. As
`components/BuyButtons.tsx` puts it, *"the storefront has no separate cart page —
checkout's summary IS the cart."* Both purchase buttons go straight to
`/checkout`. Like `BUY`, `CART` names nothing that exists.

> **`BUY` vs `CHECKOUT` — different dimensions, never in conflict.**
> `BUY` is a FUNCTION: a button that adds a variant and navigates. It takes no
> money. `CHECKOUT` is a PAGE: the route where money actually moves (PayPal SDK,
> card form, `POST /api/checkout`). The doorway and the room.
>
> ```
> PDP-ACTION-BUY-BTN            on the product page — sends you there
> CHECKOUT-ACTION-SUBMIT-BTN    on the checkout page — completes the sale
> ```

### SECTION 区域

| 中文 | 编号 | Meaning |
| --- | --- | --- |
| 导航栏 | `NAV` | Navigation |
| 顶部栏 | `HEADER` | Header |
| 顶部信息栏 | `TOPBAR` | Top Bar |
| 底部栏 | `FOOTER` | Footer |
| 标签栏 | `TABBAR` | Tab Bar |
| 菜单 | `MENU` | Menu |
| 左侧菜单抽屉 | `DRAWER` | Side Drawer |
| 首屏区域 | `HERO` | Hero Banner |
| 横幅 | `BANNER` | Banner |
| 产品展示区 | `PRODUCT` | Product Section |
| 分类区域 | `CATEGORY` | Category |
| 系列展示 | `COLLECTION` | Collection |
| 图片区域 | `MEDIA` | Product Images |
| 商品信息 | `INFO` | Product Information |
| 操作区域 | `ACTION` | Action Area |
| 评论 | `REVIEW` | Reviews |

**PROPOSED additions** — the homepage has ~15 bands; the list above names 3 of
them. One entry per module in `components/home/`:

| 中文 | 编号 | Module | Meaning |
| --- | --- | --- | --- |
| 精选礼品 | `FEATURED` | A-2 | Featured Rose Gifts (incl. Best Sellers row) |
| 新品 | `NEW-ARRIVALS` | A-3 | New Arrivals |
| 现货速发 | `READY-TO-SHIP` | A-3 | Ready to Ship |
| 真玫瑰承诺 | `PROMISE` | A-3 | Real Rose Promise |
| 品牌故事 | `STORY` | A-4, A-11 | Brand / real-rose story |
| 礼物顾问 | `GIFT-FINDER` | A-4, A-7 | MORI gift finder |
| 场合选购 | `OCCASION` | A-5 | Shop by Occasion |
| 对象选购 | `RECIPIENT` | A-6 | Shop by Recipient |
| 定制 | `PERSONALIZE` | A-8 | Personalized gifts |
| 工艺 | `CRAFT` | A-9 | Craft, workshop, patents |
| 企业合作 | `PARTNERSHIP` | A-10 | Corporate partnerships |
| 常见问题 | `FAQ` | A-11 | FAQ rows |
| 行动号召 | `FINAL-CTA` | A-11 | Final call-to-action band |

> `FINAL-CTA`, not `CTA`, because `CTA` is needed as a **TYPE** (the "View
> Product →" strip inside a card). One word must not mean two things.

### FUNCTION 功能

19 words — the guide's 20, minus `BUY-NOW` (removed 2026-07-26, see below).

| 中文 | 编号 | | 中文 | 编号 |
| --- | --- | --- | --- | --- |
| 打开 | `OPEN` | | 购买 | `BUY` |
| 关闭 | `CLOSE` | | 加入购物车 | `ADD-TO-CART` |
| 返回 | `BACK` | | 查看购物车 | `VIEW-CART` |
| 下一步 | `NEXT` | | 收藏 | `WISHLIST` |
| 确认 | `CONFIRM` | | 筛选 | `FILTER` |
| 提交 | `SUBMIT` | | 排序 | `SORT` |
| 保存 | `SAVE` | | 登录 | `SIGN-IN` |
| 删除 | `DELETE` | | 注册 | `SIGN-UP` |
| 编辑 | `EDIT` | | 退出登录 | `LOGOUT` |
| 分享 | `SHARE` | | | |

**PROPOSED additions:**

| 中文 | 编号 | Why |
| --- | --- | --- |
| 查看全部 | `VIEW-ALL` | the "View all →" link appears in nearly every band |
| 探索 | `EXPLORE` | "Explore New Arrivals →", "EXPLORE OUR CRAFT" |
| 验证 | `VERIFY` | storefront sign-in is an **emailed one-time code**, not a password — `SIGN-IN` alone can't name the Verify button |
| 重发验证码 | `RESEND` | "Resend code" link on the OTP form |
| 应用 | `APPLY` | discount-code field on `/checkout` |
| 查询物流 | `TRACK` | order tracking on `/account` |

**REMOVED — `BUY-NOW` (立即购买):** it duplicates `BUY` (购买). One purchase verb
is enough; `BUY` is the shorter and more general of the two. Owner's call,
2026-07-26.

> Note the consequence: the button is *labelled* "BUY NOW · $159.00" on screen,
> but is *named* `PDP-ACTION-BUY-BTN`. That is fine and in fact rule 1 working as
> intended — a name tracks the element's role, not its current copy, so changing
> the label to "Order now" later doesn't invalidate the name.

> Keep `ADD-TO-CART` and `BUY` as **separate** names even though
> `components/BuyButtons.tsx` wires both to the identical handler (add the
> variant, go to `/checkout` — this storefront has no cart page, so checkout's
> summary *is* the cart). They are two distinct buttons, side by side, with
> different labels. A name identifies **an element**, not a behaviour; collapsing
> them would make it impossible to say which button you mean.

### TYPE 类型

| 中文 | 编号 | Use |
| --- | --- | --- |
| 按钮 | `BTN` | Button |
| 卡片 | `CARD` | Card |
| 图片 | `IMG` | Image |
| 媒体 | `MEDIA` | Image/Video |
| 图标 | `ICON` | Icon |
| 输入框 | `INPUT` | Input |
| 文本 | `TEXT` | Text |
| 标题 | `TITLE` | Title |
| 标签 | `TAG` | Tag |
| 下拉菜单 | `DROPDOWN` | Dropdown |
| 选择器 | `SELECT` | Selector |
| 弹窗 | `MODAL` | Modal |
| 抽屉 | `DRAWER` | Drawer |
| 开关 | `TOGGLE` | Toggle |

**PROPOSED additions** — types this design uses constantly but the list omits:

| 中文 | 编号 | Use |
| --- | --- | --- |
| 价格 | `PRICE` | ⚠️ **the guide's own example `PDP-PRODUCT-PRICE` uses this type, but the TYPE sheet omits it** |
| 区块 | `SECTION` | a whole band's wrapper element |
| 链接 | `LINK` | a text link, **not** a button ("View all →") |
| 行动号召 | `CTA` | in-card call-to-action ("View Product →") |
| 副标题 | `SUBTITLE` | secondary heading under a `TITLE` |
| 筛选标签 | `CHIP` | the pill filters in A-5 / A-6 / A-7 |
| 轮播点 | `DOT` | carousel position indicator |
| 轮播页 | `SLIDE` | one cell of a carousel track |
| 装饰 | `ORNAMENT` | the `—  ✿  —` divider strips |
| 步骤 | `STEP` | numbered rows in A-8 / A-9 |
| 说明 | `NOTE` | small print under a price ("Personalization available") |
| 元信息 | `META` | combined price / shipping / CTA strip |

---

## Rules

### 1. Name the role, never the appearance or position

`HOME-HERO-SHOP-BTN`, not `GOLD-BUTTON` or `TOP-BUTTON`. The gold may go in a
redesign; the role won't. A name that describes styling dies at the next redesign
and takes every test and analytics event with it.

### 2. Repeats

**Fixed design repeats get an index.** The four Real Rose Promise tiles are part
of the design, not the data — they get `-1` … `-4`:

```jsx
data-el="HOME-PROMISE-BENEFIT-CARD-3"
```

**Data-driven lists do not get an index.** Every card in the `/shop` grid shares
one name; identity lives in a second attribute, so adding a product doesn't
renumber the map:

```jsx
data-el="SHOP-PRODUCT-CARD" data-key="Y-034"
```

### 3. Don't tag decoration

Background fills, gradient rects and spacer divs get no name. If nobody will ever
point at it, it doesn't need a handle.

Exception, by necessity: carousel dots are rendered as sibling `<div>`s with no
wrapper element, so they are indexed individually (`…-DOT-1` … `…-DOT-4`) rather
than sharing one group name. Adding a wrapper purely to hold a name would mean a
DOM change to pixel-locked code — not worth it.

### 4. Figma node ids stay in comments, not in the DOM

The existing `{/* 158:77 · … */}` comments already tie code to the Figma REST
data, and the import tooling reads source, not the rendered page. Don't add a
third attribute carrying the node id — it would ship to every visitor for no
runtime benefit.

### 5. Live database text uses the EXISTING `data-live-text` marker

⚠️ **Do not invent a new attribute for this.** `data-live-text` already exists
on 6 elements (`components/BuyButtons.tsx`, `app/products/[slug]/page.tsx`,
`app/shop/page.tsx`) and it is **load-bearing**: the pixel suite masks exactly
those boxes —

```ts
// tests/e2e/pixels.spec.ts, tests/e2e/stage9-live-data.spec.ts
mask: [page.locator("[data-live-text]")]
```

A second, parallel marker would be worse than none: the mask locator would catch
only one of them, and a live box tagged with the wrong marker would silently
start failing the pixel baseline whenever its content changed.

So a live box carries both — `data-el` to name it, `data-live-text` to mark it:

```jsx
<div data-el="PDP-PRODUCT-PRICE" data-live-text>{formatMoney(cents)}</div>
```

Why it matters beyond masking: the frames were sized around the mock's copy, and
live values can be longer. This already bit once — `/shop` card prices overlapped
their compare-at price because the Figma box was sized for `$219` and
`formatMoney` adds cents. The same risk is still latent on `/products/[slug]`
above `$1,000`.

**The homepage (A-1 … A-11) has no live boxes** — all its copy and prices are
literal strings from the design — so nothing there is marked.

### 6. Names are unique per page

Two elements answering to the same name make a selector ambiguous and a
conversation confusing. Guarded by a test (see below).

---

## What gets a name

| Tag it | Skip it |
| --- | --- |
| section / band wrappers | background fills, spacer divs |
| images and photos | decorative gradients |
| links and buttons | |
| headings, subtitles, body copy | |
| prices, badges, notes | |
| cards, chips, form fields | |
| anything reading live DB data (+ `data-live`) | |

---

## Worked example — A-1 hero

```jsx
<div data-el="HOME-HERO-SECTION">
  <div  data-el="HOME-HERO-EYEBROW-TEXT">—   G O L D R O S E   —</div>
  <div  data-el="HOME-HERO-TITLE">Gold-Dipped Roses…</div>
  <div  data-el="HOME-HERO-SUBTITLE">Eternal Beauty, Endless Love</div>
  <div  data-el="HOME-HERO-BODY-TEXT">Discover real preserved rose gifts…</div>

  <Link data-el="HOME-HERO-SHOP-BTN" href="/shop">SHOP GOLD-DIPPED ROSES</Link>
  <div  data-el="HOME-HERO-PERSONALIZE-BTN">CREATE A PERSONALIZED ROSE GIFT</div>

  <div  data-el="HOME-HERO-BENEFIT-CARD-1">
    <img data-el="HOME-HERO-BENEFIT-ICON-1" …/>
    <div data-el="HOME-HERO-BENEFIT-TEXT-1">Made from Real Roses</div>
  </div>
  …
</div>
```

---

## Enforcement

`tests/unit/element-names.test.ts` scans the source and fails on:

1. **duplicate names** within one page,
2. names that **don't match the grammar** (uppercase, hyphenated, 3+ segments),
3. segments **not in the vocabulary** above.

Rule 3 is what keeps this from rotting into free-form strings. To add a word,
add it to the owner's xlsx **and** to this file — not to the code.

---

## Status

- **Convention: agreed** (grammar and vocabulary from the owner's guide).
- **PROPOSED entries above need the owner's OK** before A-4 … A-11 are tagged —
  every section name those modules need is a new word, and renaming after
  tagging is 8 files of churn.
- **Tagged so far:** A-1, A-2, A-3 (+ `HeroCarousel`).
- **Not yet tagged:** A-4 … A-11, `/shop`, `/products/[slug]`, `/account`,
  `/account/business`, `/checkout`, nav and header chrome, admin.
