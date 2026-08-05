# Figma Naming Standard

**Status: Adopted v2.0 (2026-07-30, decided by Charles).** v2 makes the
viewport the ownership boundary: everything before it (route, state) is set
by dev; everything after it belongs to the design team. Applied to the Figma
file on 2026-07-30.

## Sections

Use uppercase section names matching the route’s first segment.

- `SHOP` contains `/shop` and every `/shop/...` route.
- `ACCOUNT` contains `/account` and every `/account/...` route.
- Sections organize frames and are not part of route extraction.

## Frames

Name every top-level frame using:

`<exact route> · <state> · <viewport> · <design team’s parts ...>`

Examples:

- `/shop · default · mobile · shoppage`
- `/shop · filter open · mobile · shoppage-filter_drawer`
- `/orders/track · default · mobile · track order`
- `/orders/track · return · mobile · track order_return`
- `/products/[slug] · default · desktop · product detail template`

**Ownership — the viewport is the separator.** Everything **before** the
viewport is set by dev and must not be changed by the design team:

1. First part: the exact application route.
2. Second part: the state. Use `default` when the frame is just the plain
   page; use a short lowercase phrase for a special function or condition
   (`return`, `filter open`, `signed out`, `empty`, …).
3. Third part: the viewport — currently `desktop` or `mobile`.

Everything **after** the viewport belongs to the design team: their own name
for the frame plus any metadata they find useful. Dev never parses it and
never renames it; the design team never edits the three parts before it.

**Developer contract:** split the name on `·`; parts 1–3 are route, state,
viewport. Development reads only these three. Everything after the viewport
token is design-team territory.

## Dynamic Routes

Use the dynamic-route syntax from the application’s codebase:

- `[slug]` used in frontend route and figma
- `[id]` used in admin route as product ID is never going to change

A frame such as
`/products/[slug] · default · desktop · product detail template` represents
one reusable design template for every matching product. Do not name the
frame after the sample product displayed inside it. Product URL handles
follow the separate [`product-handles.md`](product-handles.md) rule.

## Responsive Designs and States

Keep the route unchanged, put the state next, then the viewport; the design
team’s parts follow.

- `/shop · default · desktop · product listing`
- `/shop · default · mobile · product listing`
- `/products/[slug] · in stock · desktop · product detail template`
- `/products/[slug] · out of stock · desktop · product detail template`

`desktop` represents the PC or laptop layout, while `mobile` represents the phone layout.

## Capitalization

- **Sections:** uppercase
- **Frame routes, states, viewports (dev side):** lowercase
- **Design team’s parts (after the viewport):** their choice — kept verbatim
- **Visible interface text:** follow the product’s normal content and typography rules

---

## 简明版（设计团队请读这一节）

给每个页面画板（frame）按下面的格式命名，开发就能直接知道它对应网站的哪个页面：

```
路由 · 状态 · 端 · 设计团队自己的部分（随意）
```
    路由解释：我们的网站是https://eldreve.com/，
    点击shop页面，网址变成：https://eldreve.com/shop
    多出来的/shop就是路由route（都以/开头）。

**归属规则（v2 核心）：「端」是分界线。**

- 端（`mobile`/`desktop`）**之前**的部分（路由、状态）由开发（Charles）设定，
  设计团队**不要改**。
- 端**之后**的部分完全归设计团队：你们自己的画板名、备注，随便写，
  开发不读取、也不依赖这些内容。

**分区（Section）规则：**

1. 分区名 = 路由的第一段，**全大写**：`/shop` → `SHOP`，`/account` → `ACCOUNT`。
2. 一个分区装下它的全部子路由：`SHOP` 里放 `/shop` 和所有 `/shop/...` 的画板，
   `ACCOUNT` 里放 `/account` 和所有 `/account/...` 的画板。
3. 分区只是整理画板用的"文件夹"，开发不从分区名读取路由 —— 路由永远以画板名的
   第一段为准。

**三个固定位：**

1. **路由**：这个页面在网站上的网址路径，全小写，如 `/shop`、`/bag`。
   商品详情这类模板页写成 `/products/[slug]`，**不要**写某个具体商品的名字。
2. **状态**：普通页面写 `default`；特殊功能或状态用小写短语，如 `return`
   （退货弹层）、`filter open`（筛选打开）、`signed out`（未登录）。
3. **端**：`desktop`（电脑）或 `mobile`（手机）。

**例子：**

- `/shop · default · mobile · shoppage`
- `/shop · filter open · mobile · shoppage-filter_drawer`
- `/orders/track · return · mobile · track order_return`
- `/account · signed out · mobile · loginpage`

**一个大分区的完整例子** —— `ACCOUNT` 分区装下所有 `/account` 开头的画板：

```
ACCOUNT（分区，全大写）
├── /account · signed in · mobile · mepage
├── /account · signed out · mobile · loginpage
├── /account/orders · default · mobile · mepage-my orders
├── /account/orders/details · default · mobile · mepage-my orders-view details
├── /account/personal-info · default · mobile · 个人信息
├── /account/security · default · mobile · 账户安全
├── /account/privacy · default · mobile · 隐私中心
├── /account/preferences · default · mobile · 偏好设置
└── /account/reminders · default · mobile · 送礼提醒
```

同一个页面的不同状态（已登录/未登录）、不同端（desktop/mobile）各画一张，
路由部分保持不变，只改状态和端。

**分区里面还有分区的例子**

Figma sections can contain other sections

- STOREFRONT AREA             ← parent classifier
├── SHOP                    ← route section
├── PRODUCTS
├── BAG
├── CHECKOUT
└── ACCOUNT
