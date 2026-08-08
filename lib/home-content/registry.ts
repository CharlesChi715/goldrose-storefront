/**
 * ROLE OF THIS FILE
 * The homepage content registry — the single declarative description of every
 * editable string on `/`, section by section, in page order.
 *
 * WHY A REGISTRY AND NOT SEEDED ROWS
 * The homepage is a pixel-exact import of Figma frame `2380:370`: every text
 * node sits in a fixed box at fixed coordinates. The *default* of each field
 * is therefore not owner data — it is the design, and it changes only when the
 * design team ships a new frame. Keeping the defaults here (beside the
 * components that render them) means a Figma re-sync updates the default and
 * "Reset to original" in exactly one place. `site_content` stores only the
 * owner's OVERRIDES: a row appears the first time a field is edited and is
 * removed again on reset. No migration, no 100-row seed, no drift (§7.9/§9.8).
 *
 * FIELD KINDS
 * - `text` / `multiline` / `url` — a live text node; the owner can type here.
 * - `artwork` — the label is baked into a Figma SVG/PNG render (glyph strips,
 *   whole button chrome). Shown read-only with the reason, so the owner sees
 *   the complete inventory of the page rather than a silent gap (§11).
 * - `managed` — real data that belongs to another admin screen (catalog,
 *   reviews). Shown read-only with a link to where it IS edited.
 *
 * CHARACTER BUDGETS
 * Most boxes are `white-space: nowrap` at a fixed width, so over-long copy is
 * clipped rather than wrapped. `max` is a rough PER-LINE budget derived from the
 * box width and font size by `budget()`; `fieldBudget()` turns it into the
 * whole-field number the admin shows. It warns, never blocks — only the design
 * team can say what actually fits.
 */

/** How a field is edited — see FIELD KINDS in the file header. */
export type HomeFieldKind =
  "text" | "multiline" | "url" | "artwork" | "managed";

/** One editable (or explained) string inside a homepage section. */
export type HomeField = {
  /** Field id; the slot key is `home.<section>.<id>` unless `key` overrides it. */
  readonly id: string;
  /** English admin label. */
  readonly label: string;
  /** Chinese admin label (§9 — the admin is bilingual). */
  readonly labelZh: string;
  readonly kind: HomeFieldKind;
  /** The design default, verbatim from the Figma import. */
  readonly value: string;
  /** Optional sub-heading that groups fields inside one section's card. */
  readonly group?: string;
  readonly groupZh?: string;
  /**
   * Rough character budget for ONE line of this box — advisory only. Read it
   * through `fieldBudget()`, never directly.
   */
  readonly max?: number;
  /** Designed line count; 1 when omitted. Drives the budget and the input size. */
  readonly lines?: number;
  /** Why this field is read-only, or what to watch out for when editing. */
  readonly note?: string;
  readonly noteZh?: string;
  /** Slot-key override, for fields that predate this registry. */
  readonly key?: string;
  /** For `managed` fields: the admin screen that owns this data. */
  readonly managedAt?: string;
};

/** One homepage section — a Figma module band, or the promo bar chrome. */
export type HomeSection = {
  readonly id: string;
  /** The design team's module name, e.g. "A-1". */
  readonly module: string;
  readonly title: string;
  readonly titleZh: string;
  readonly blurb: string;
  readonly blurbZh: string;
  /**
   * The band's y-offset and height on the 430×5193 stage. `null` means the
   * section is page chrome rather than a band, so it cannot be hidden — see
   * lib/home-content/layout.ts.
   *
   * `trim` is height the design team has since deleted from *inside* the band
   * while the elements below it keep their original imported coordinates. The
   * layout treats it as permanently removed: later bands slide up by it and
   * the stage shrinks by it, exactly as for a hidden band, so an in-band
   * deletion never requires rewriting the rest of the page's pixel values.
   * `h` is the band's height after the trim.
   */
  readonly band: {
    readonly y: number;
    readonly h: number;
    readonly trim?: number;
  } | null;
  readonly fields: readonly HomeField[];
};

/**
 * Rough character budget for a fixed-width Figma text box.
 *
 * @param widthPx - The design box width in stage pixels.
 * @param fontSize - The design font size in stage pixels.
 * @param factor - Average glyph advance as a fraction of the font size —
 *   ~0.5 for mixed-case serif copy, ~0.62 for tracked-out uppercase.
 * @returns The advisory maximum character count, never below 4.
 */
function budget(widthPx: number, fontSize: number, factor = 0.5): number {
  return Math.max(4, Math.floor(widthPx / (fontSize * factor)));
}

/* -------------------------------------------------------------------------
   The sections, in the order they appear down the page.
   Every `value` below is byte-identical to what components/home/* rendered
   before this registry existed — that is what keeps the pixel baseline
   (tests/e2e/pixels.spec.ts) green with no overrides saved.
   ------------------------------------------------------------------------- */

export const HOME_SECTIONS = [
  {
    id: "promo",
    module: "Chrome",
    title: "Promo bar",
    titleZh: "顶部促销条",
    blurb:
      "The 32px strip above the header. Always visible — it is part of the frame's chrome, not a band.",
    blurbZh:
      "页眉上方 32px 的横条。始终显示——它属于页面框架，不是可隐藏的板块。",
    band: null,
    fields: [
      {
        id: "slogan",
        key: "promo.slogan",
        label: "Slogan",
        labelZh: "标语",
        kind: "text",
        value:
          "✦ TIMELESS CRAFT · LOVE THAT NEVER FADES · 24K GOLD · FOREVER TREASURED ✦",
        max: budget(352, 8.5, 0.55),
        note: "Shown as the design's own render until you edit it; ✦ symbols may look slightly different afterwards.",
        noteZh: "未编辑前显示设计稿原图；编辑后 ✦ 符号可能与原设计略有差异。",
      },
    ],
  },
  {
    id: "hero",
    module: "A-1",
    title: "Hero",
    titleZh: "首屏",
    blurb:
      "The gift-box photo, the headline block under it, the main shop button and the two benefit tiles.",
    blurbZh: "礼盒照片、下方标题区、主购物按钮，以及两个卖点小卡片。",
    band: { y: 32, h: 732 },
    fields: [
      {
        id: "eyebrow",
        label: "Eyebrow",
        labelZh: "眉标",
        kind: "text",
        // The design pads the rule with non-breaking spaces so the browser
        // cannot collapse the run — written as escapes so they stay visible.
        value: "\u2014\u00a0\u00a0 G O L D R O S E\u00a0\u00a0 \u2014",
        max: budget(200, 9, 0.62),
        note: "Letter-spaced by hand with real spaces — keep the spacing pattern if you change the word.",
        noteZh: "字间距由空格手动拉开——修改文字时请保留同样的空格排布。",
      },
      {
        id: "title",
        label: "Headline",
        labelZh: "主标题",
        kind: "multiline",
        value: "Gold-Dipped Roses\nMade from Real Roses",
        lines: 2,
        max: budget(362, 34),
        note: "Two lines by design.",
        noteZh: "设计稿为两行。",
      },
      {
        id: "subtitle",
        label: "Subheadline",
        labelZh: "副标题",
        kind: "text",
        value: "Eternal Beauty, Endless Love",
        max: budget(294, 16),
      },
      {
        id: "body",
        label: "Intro paragraph",
        labelZh: "引导文案",
        kind: "multiline",
        value:
          "Discover real preserved rose gifts for anniversaries, birthdays, weddings and meaningful moments.",
        lines: 2,
        max: budget(306, 11),
        note: "Wraps inside a 306px box — this one can breathe.",
        noteZh: "在 306px 宽度内自动换行——这一处可以稍长。",
      },
      {
        id: "cta_label",
        group: "Shop button",
        groupZh: "购物按钮",
        label: "Button label",
        labelZh: "按钮文字",
        kind: "text",
        value: "SHOP GOLD-DIPPED ROSES",
        max: budget(181, 12, 0.62),
      },
      {
        id: "cta_href",
        group: "Shop button",
        groupZh: "购物按钮",
        label: "Button link",
        labelZh: "按钮链接",
        kind: "url",
        value: "/shop",
      },
      {
        id: "benefit_1",
        group: "Benefit tiles",
        groupZh: "卖点卡片",
        label: "Tile 1",
        labelZh: "卡片 1",
        kind: "multiline",
        value: "Made from\nReal Roses",
        lines: 2,
        max: budget(46, 9),
      },
      {
        id: "benefit_2",
        group: "Benefit tiles",
        groupZh: "卖点卡片",
        label: "Tile 2",
        labelZh: "卡片 2",
        kind: "multiline",
        value: "Gift-Ready\nPackaging",
        lines: 2,
        max: budget(44, 9),
      },
    ],
  },
  {
    id: "featured",
    module: "A-2",
    title: "Featured Rose Gifts",
    titleZh: "精选玫瑰礼物",
    blurb:
      "Section heading plus the Best Sellers rail. The rail's cards are design placeholders until the real catalogue lands (OQ-3).",
    blurbZh:
      "板块标题与畅销榜滑动栏。滑动栏中的卡片在真实商品内容上线前仍为设计占位（OQ-3）。",
    band: { y: 764, h: 641 },
    fields: [
      {
        id: "title",
        label: "Section title",
        labelZh: "板块标题",
        kind: "text",
        value: "Featured Rose Gifts",
        max: budget(354, 34),
      },
      {
        id: "subtitle",
        label: "Section subtitle",
        labelZh: "板块副标题",
        kind: "text",
        value: "Timeless roses for meaningful moments.",
        max: budget(322, 12),
      },
      {
        id: "rail_title",
        label: "Rail heading",
        labelZh: "滑动栏标题",
        kind: "text",
        value: "Best Sellers",
        max: budget(220, 24),
      },
      {
        id: "view_all_href",
        label: "“View all” link",
        labelZh: "“View all” 链接",
        kind: "url",
        value: "/shop",
      },
      {
        id: "view_all_label",
        label: "“View all” label",
        labelZh: "“View all” 文字",
        kind: "artwork",
        value: "View all →",
        note: "Baked into the design's own SVG render (157-61.svg) — the design team changes this one.",
        noteZh: "该文字已烘焙进设计稿 SVG（157-61.svg）——需由设计团队修改。",
      },
      {
        id: "rail_cards",
        label: "Best Sellers cards",
        labelZh: "畅销榜卡片",
        kind: "managed",
        value: "Personalized Gold-Dipped Rose · Enchanted Rose with LED Light",
        managedAt: "/admin/products",
        note: "Placeholder product cards from the design. They become live catalogue data with the real product content (OQ-3).",
        noteZh:
          "来自设计稿的占位商品卡。真实商品内容上线后将改为读取商品目录（OQ-3）。",
      },
    ],
  },
  {
    id: "ready",
    module: "A-3",
    title: "Ready to Ship",
    titleZh: "现货速发",
    blurb:
      "Two in-stock product rows. The four-icon Real Rose Promise strip that used to close this band was deleted by the design team on 2026-08-07, along with its five editable fields.",
    blurbZh:
      "两行现货商品。此板块原有的「真玫瑰承诺」四图标条已于 2026-08-07 由设计团队删除，其五个可编辑字段一并移除。",
    // 08-07: the promise strip's 136px left the band; `trim` gives them back to
    // the stage so no later band's imported coordinates have to be rewritten.
    band: { y: 1405, h: 327, trim: 136 },
    fields: [
      {
        id: "title",
        group: "Ready to Ship",
        groupZh: "现货速发",
        label: "Section title",
        labelZh: "板块标题",
        kind: "text",
        value: "Ready to Ship",
        max: budget(230, 24),
      },
      {
        id: "view_all_href",
        group: "Ready to Ship",
        groupZh: "现货速发",
        label: "“View all” link",
        labelZh: "“View all” 链接",
        kind: "url",
        value: "/shop",
      },
      {
        id: "view_all_label",
        group: "Ready to Ship",
        groupZh: "现货速发",
        label: "“View all” label",
        labelZh: "“View all” 文字",
        kind: "artwork",
        value: "View all →",
        note: "Baked into the design's own SVG render (159-70.svg).",
        noteZh: "已烘焙进设计稿 SVG（159-70.svg）。",
      },
      {
        id: "card_title",
        group: "Ready to Ship",
        groupZh: "现货速发",
        label: "Row title",
        labelZh: "商品行标题",
        kind: "text",
        value: "Mini Rose Dome + Light",
        max: budget(180, 13),
        note: "The design repeats one product across both rows.",
        noteZh: "设计稿两行使用同一个商品。",
      },
      {
        id: "card_href",
        group: "Ready to Ship",
        groupZh: "现货速发",
        label: "Row link",
        labelZh: "商品行链接",
        kind: "url",
        value: "/shop",
      },
      {
        id: "card_meta",
        group: "Ready to Ship",
        groupZh: "现货速发",
        label: "Row price and shipping line",
        labelZh: "价格与配送信息",
        kind: "artwork",
        value: "$69.00 · Ships in 1–2 business days · View Product →",
        note: "Baked into the design's own SVG render (159-80.svg). It becomes live catalogue data with the real product content (OQ-3).",
        noteZh:
          "已烘焙进设计稿 SVG（159-80.svg）。真实商品内容上线后将改为读取商品目录（OQ-3）。",
      },
    ],
  },
  {
    id: "occasion",
    module: "A-5",
    title: "Shop by Occasion",
    titleZh: "按场合选购",
    blurb:
      "Occasion chips and the sliding occasion-card rail. Per-occasion filtering does not exist yet, so every chip lands on the full shop.",
    blurbZh:
      "场合筛选标签与滑动卡片栏。目前尚无按场合筛选功能，所有标签均指向完整商店页。",
    band: { y: 1868, h: 476 },
    fields: [
      {
        id: "title",
        label: "Section title",
        labelZh: "板块标题",
        kind: "text",
        value: "Shop by Occasion",
        max: budget(382, 30),
      },
      {
        id: "intro",
        label: "Section intro",
        labelZh: "板块引导语",
        kind: "text",
        value: "Find an ELDREVE for every meaningful moment.",
        max: budget(326, 10),
      },
      {
        id: "chips_href",
        group: "Occasion chips",
        groupZh: "场合标签",
        label: "Chip link (all chips)",
        labelZh: "标签链接（全部）",
        kind: "url",
        value: "/shop",
        note: "All five chips share one destination until per-occasion filtering exists.",
        noteZh: "在按场合筛选功能上线前，五个标签共用同一目标地址。",
      },
      {
        id: "chip_1",
        group: "Occasion chips",
        groupZh: "场合标签",
        label: "Chip 1",
        labelZh: "标签 1",
        kind: "text",
        value: "Valentine's Day",
        max: budget(64, 9),
      },
      {
        id: "chip_2",
        group: "Occasion chips",
        groupZh: "场合标签",
        label: "Chip 2",
        labelZh: "标签 2",
        kind: "text",
        value: "Mother's Day",
        max: budget(55, 9),
      },
      {
        id: "chip_3",
        group: "Occasion chips",
        groupZh: "场合标签",
        label: "Chip 3",
        labelZh: "标签 3",
        kind: "text",
        value: "Birthday",
        max: budget(37, 9),
      },
      {
        id: "chip_4",
        group: "Occasion chips",
        groupZh: "场合标签",
        label: "Chip 4",
        labelZh: "标签 4",
        kind: "text",
        value: "Christmas",
        max: budget(43, 9),
      },
      {
        id: "chip_5",
        group: "Occasion chips",
        groupZh: "场合标签",
        label: "Chip 5",
        labelZh: "标签 5",
        kind: "text",
        value: "Anniversary",
        max: budget(50, 9),
      },
      {
        id: "card_href",
        group: "Occasion cards",
        groupZh: "场合卡片",
        label: "Card link (all cards)",
        labelZh: "卡片链接（全部）",
        kind: "url",
        value: "/shop",
      },
      {
        id: "card_1_title",
        group: "Occasion cards",
        groupZh: "场合卡片",
        label: "Card 1 title",
        labelZh: "卡片 1 标题",
        kind: "multiline",
        value: "Valentine's Day\nGifts",
        lines: 2,
        max: budget(148, 22),
      },
      {
        id: "card_1_copy",
        group: "Occasion cards",
        groupZh: "场合卡片",
        label: "Card 1 copy",
        labelZh: "卡片 1 文案",
        kind: "text",
        value: "For the one who means everything.",
        max: budget(122, 8),
      },
      {
        id: "card_2_title",
        group: "Occasion cards",
        groupZh: "场合卡片",
        label: "Card 2 title",
        labelZh: "卡片 2 标题",
        kind: "multiline",
        value: "Valentine's Day\nGifts",
        lines: 2,
        max: budget(148, 22),
        note: "The design repeats card 1's title here — safe to make it distinct.",
        noteZh: "设计稿此处与卡片 1 标题重复——可以改成不同文案。",
      },
      {
        id: "card_2_copy",
        group: "Occasion cards",
        groupZh: "场合卡片",
        label: "Card 2 copy",
        labelZh: "卡片 2 文案",
        kind: "text",
        value: "Romantic gifts to make her feel cherished.",
        max: budget(152, 8),
      },
      {
        id: "card_3_title",
        group: "Occasion cards",
        groupZh: "场合卡片",
        label: "Card 3 title",
        labelZh: "卡片 3 标题",
        kind: "multiline",
        value: "Anniversary Gifts\nfor Wife",
        lines: 2,
        max: budget(148, 22),
      },
      {
        id: "card_3_copy",
        group: "Occasion cards",
        groupZh: "场合卡片",
        label: "Card 3 copy",
        labelZh: "卡片 3 文案",
        kind: "text",
        value: "Celebrate your love with a timeless gift.",
        max: budget(148, 9),
      },
      {
        id: "card_cta_label",
        group: "Occasion cards",
        groupZh: "场合卡片",
        label: "Card button label",
        labelZh: "卡片按钮文字",
        kind: "artwork",
        value: "SHOP WIFE GIFTS →",
        note: "Baked into the design's own SVG render, shared by all three cards.",
        noteZh: "已烘焙进设计稿 SVG，三张卡片共用。",
      },
    ],
  },
  {
    id: "recipient",
    module: "A-6",
    title: "Shop by Recipient & Reviews",
    titleZh: "按收礼人选购 与 顾客评价",
    blurb:
      "Recipient chips, the recipient-card rail, and the “Real Gifts, Real Moments” review strip. One Figma band, so they show and hide together.",
    blurbZh:
      "收礼人标签、卡片滑动栏，以及“Real Gifts, Real Moments”评价条。三者属于同一个设计板块，一起显示或隐藏。",
    band: { y: 2344, h: 789 },
    fields: [
      {
        id: "title",
        label: "Section title",
        labelZh: "板块标题",
        kind: "text",
        value: "Shop by Recipient",
        max: budget(382, 30),
      },
      {
        id: "intro",
        label: "Section intro",
        labelZh: "板块引导语",
        kind: "text",
        value: "Choose a rose gift for someone special.",
        max: budget(326, 10),
      },
      {
        id: "chip_1",
        group: "Recipient chips",
        groupZh: "收礼人标签",
        label: "Chip 1 (selected)",
        labelZh: "标签 1（选中态）",
        kind: "text",
        value: "Wife",
        max: budget(19, 9),
        note: "Chips are decoration in this design — they carry no link.",
        noteZh: "本设计中的标签仅为装饰，没有链接。",
      },
      {
        id: "chip_2",
        group: "Recipient chips",
        groupZh: "收礼人标签",
        label: "Chip 2",
        labelZh: "标签 2",
        kind: "text",
        value: "Girlfriend",
        max: budget(40, 9),
      },
      {
        id: "chip_3",
        group: "Recipient chips",
        groupZh: "收礼人标签",
        label: "Chip 3",
        labelZh: "标签 3",
        kind: "text",
        value: "Mom",
        max: budget(22, 9),
      },
      {
        id: "chip_4",
        group: "Recipient chips",
        groupZh: "收礼人标签",
        label: "Chip 4",
        labelZh: "标签 4",
        kind: "text",
        value: "Friends",
        max: budget(31, 9),
      },
      {
        id: "chip_5",
        group: "Recipient chips",
        groupZh: "收礼人标签",
        label: "Chip 5",
        labelZh: "标签 5",
        kind: "text",
        value: "Couples",
        max: budget(34, 9),
      },
      {
        id: "card_href",
        group: "Recipient cards",
        groupZh: "收礼人卡片",
        label: "Card link (all cards)",
        labelZh: "卡片链接（全部）",
        kind: "url",
        value: "/shop",
      },
      {
        id: "card_1_title",
        group: "Recipient cards",
        groupZh: "收礼人卡片",
        label: "Card 1 title",
        labelZh: "卡片 1 标题",
        kind: "multiline",
        value: "Gifts for Wife",
        lines: 2,
        max: budget(148, 22),
      },
      {
        id: "card_1_copy",
        group: "Recipient cards",
        groupZh: "收礼人卡片",
        label: "Card 1 copy",
        labelZh: "卡片 1 文案",
        kind: "text",
        value: "For the one who means everything.",
        max: budget(122, 8),
      },
      {
        id: "card_2_title",
        group: "Recipient cards",
        groupZh: "收礼人卡片",
        label: "Card 2 title",
        labelZh: "卡片 2 标题",
        kind: "multiline",
        value: "Thoughtful Gifts\nShe’ll Love",
        lines: 2,
        max: budget(148, 22),
      },
      {
        id: "card_2_copy",
        group: "Recipient cards",
        groupZh: "收礼人卡片",
        label: "Card 2 copy",
        labelZh: "卡片 2 文案",
        kind: "text",
        value: "Romantic gifts to make her feel cherished.",
        max: budget(152, 8),
      },
      {
        id: "card_3_title",
        group: "Recipient cards",
        groupZh: "收礼人卡片",
        label: "Card 3 title",
        labelZh: "卡片 3 标题",
        kind: "multiline",
        value: "Anniversary Gifts\nfor Wife",
        lines: 2,
        max: budget(148, 22),
      },
      {
        id: "card_3_copy",
        group: "Recipient cards",
        groupZh: "收礼人卡片",
        label: "Card 3 copy",
        labelZh: "卡片 3 文案",
        kind: "text",
        value: "Celebrate your love with a timeless gift.",
        max: budget(148, 9),
      },
      {
        id: "card_cta_label",
        group: "Recipient cards",
        groupZh: "收礼人卡片",
        label: "Card button label",
        labelZh: "卡片按钮文字",
        kind: "artwork",
        value: "SHOP WIFE GIFTS →",
        note: "Baked into the design's own SVG render, shared by all three cards.",
        noteZh: "已烘焙进设计稿 SVG，三张卡片共用。",
      },
      {
        id: "reviews_title",
        group: "Reviews strip",
        groupZh: "评价条",
        label: "Strip title",
        labelZh: "评价条标题",
        kind: "text",
        value: "Real Gifts, Real Moments",
        max: budget(382, 21),
      },
      {
        id: "reviews_intro",
        group: "Reviews strip",
        groupZh: "评价条",
        label: "Strip intro",
        labelZh: "评价条引导语",
        kind: "text",
        value: "Loved by thousands, given with meaning.",
        max: budget(330, 9),
      },
      {
        id: "reviews_cta_label",
        group: "Reviews strip",
        groupZh: "评价条",
        label: "Button label",
        labelZh: "按钮文字",
        kind: "text",
        value: "Read Customer Stories",
        max: budget(169, 14),
      },
      {
        id: "reviews_cta_href",
        group: "Reviews strip",
        groupZh: "评价条",
        label: "Button link",
        labelZh: "按钮链接",
        kind: "url",
        value: "/story",
      },
      {
        id: "reviews_quotes",
        group: "Reviews strip",
        groupZh: "评价条",
        label: "Review quotes",
        labelZh: "评价内容",
        kind: "managed",
        value: "Three design placeholder reviews",
        managedAt: "/admin/content",
        note: "Placeholder quotes from the design. Real customer reviews live in the product_reviews table and surface on product pages.",
        noteZh:
          "来自设计稿的占位评价。真实顾客评价存放在 product_reviews 表中，显示在商品详情页。",
      },
    ],
  },
  {
    id: "craft",
    module: "A-9",
    title: "Craft, Workshop & Patents",
    titleZh: "工艺、工坊 与 专利",
    blurb:
      "The four craft steps, the workshop gallery, and the patents and certificates panel.",
    blurbZh: "四个工艺步骤、工坊图集，以及专利与证书面板。",
    band: { y: 3133, h: 991 },
    fields: [
      {
        id: "eyebrow",
        label: "Eyebrow",
        labelZh: "眉标",
        kind: "text",
        value:
          "\u2014\u00a0\u00a0 REAL ROSES, FINISHED WITH CARE\u00a0\u00a0 \u2014",
        max: budget(382, 9, 0.62),
      },
      {
        id: "title",
        label: "Section title",
        labelZh: "板块标题",
        kind: "multiline",
        value: "Real Roses, Carefully\nPreserved and Finished",
        lines: 2,
        max: budget(382, 31),
      },
      {
        id: "intro",
        label: "Section intro",
        labelZh: "板块引导语",
        kind: "multiline",
        value:
          "Each rose is hand-selected, naturally preserved, and finished in pure 24k gold with meticulous care.",
        lines: 2,
        max: budget(330, 11),
      },
      {
        id: "step_1_title",
        group: "Craft steps",
        groupZh: "工艺步骤",
        label: "Step 01 title",
        labelZh: "步骤 01 标题",
        kind: "text",
        value: "Hand-Selected",
        max: budget(90, 13),
      },
      {
        id: "step_1_copy",
        group: "Craft steps",
        groupZh: "工艺步骤",
        label: "Step 01 copy",
        labelZh: "步骤 01 文案",
        kind: "multiline",
        value: "Only the most beautiful real roses at the perfect bloom.",
        lines: 3,
        max: budget(82, 8),
      },
      {
        id: "step_2_title",
        group: "Craft steps",
        groupZh: "工艺步骤",
        label: "Step 02 title",
        labelZh: "步骤 02 标题",
        kind: "text",
        value: "Expert Finishing",
        max: budget(92, 13),
      },
      {
        id: "step_2_copy",
        group: "Craft steps",
        groupZh: "工艺步骤",
        label: "Step 02 copy",
        labelZh: "步骤 02 文案",
        kind: "multiline",
        value: "Carefully finished by hand in pure 24k gold.",
        lines: 3,
        max: budget(82, 8),
      },
      {
        id: "step_3_title",
        group: "Craft steps",
        groupZh: "工艺步骤",
        label: "Step 03 title",
        labelZh: "步骤 03 标题",
        kind: "text",
        value: "Quality Checked",
        max: budget(90, 13),
      },
      {
        id: "step_3_copy",
        group: "Craft steps",
        groupZh: "工艺步骤",
        label: "Step 03 copy",
        labelZh: "步骤 03 文案",
        kind: "multiline",
        value: "Inspected for beauty, durability and perfection.",
        lines: 3,
        max: budget(82, 8),
      },
      {
        id: "step_4_title",
        group: "Craft steps",
        groupZh: "工艺步骤",
        label: "Step 04 title",
        labelZh: "步骤 04 标题",
        kind: "text",
        value: "Protected & Packaged",
        max: budget(90, 13),
      },
      {
        id: "step_4_copy",
        group: "Craft steps",
        groupZh: "工艺步骤",
        label: "Step 04 copy",
        labelZh: "步骤 04 文案",
        kind: "multiline",
        value: "Protected and packaged to arrive beautifully.",
        lines: 3,
        max: budget(82, 8),
      },
      {
        id: "cta_href",
        group: "Craft steps",
        groupZh: "工艺步骤",
        label: "Button link",
        labelZh: "按钮链接",
        kind: "url",
        value: "/craft",
      },
      {
        id: "cta_label",
        group: "Craft steps",
        groupZh: "工艺步骤",
        label: "Button label",
        labelZh: "按钮文字",
        kind: "artwork",
        value: "EXPLORE OUR CRAFT →",
        note: "The whole button — background, border and label — is one Figma render (165-180.svg). Only its link is editable.",
        noteZh:
          "整个按钮（底色、描边、文字）是一张设计稿图片（165-180.svg），仅链接可编辑。",
      },
      {
        id: "workshop_title",
        group: "Workshop gallery",
        groupZh: "工坊图集",
        label: "Gallery title",
        labelZh: "图集标题",
        kind: "text",
        value: "Inside the ELDREVE Workshop",
        max: budget(390, 25),
      },
      {
        id: "workshop_copy",
        group: "Workshop gallery",
        groupZh: "工坊图集",
        label: "Gallery copy",
        labelZh: "图集文案",
        kind: "multiline",
        value:
          "See where real roses are prepared, finished,\ninspected and packed for delivery.",
        lines: 2,
        max: budget(330, 9),
      },
      {
        id: "verified_title",
        group: "Patents & certificates",
        groupZh: "专利与证书",
        label: "Panel heading",
        labelZh: "面板标题",
        kind: "text",
        value: "—  VERIFIED QUALITY  —",
        max: budget(240, 20),
      },
      {
        id: "cert_1_title",
        group: "Patents & certificates",
        groupZh: "专利与证书",
        label: "Certificate 1 name",
        labelZh: "证书 1 名称",
        kind: "text",
        value: "US Patent",
        max: budget(69, 6.5),
      },
      {
        id: "cert_1_number",
        group: "Patents & certificates",
        groupZh: "专利与证书",
        label: "Certificate 1 number",
        labelZh: "证书 1 编号",
        kind: "text",
        value: "US 11,324,751 B2",
        max: budget(69, 5),
      },
      {
        id: "cert_2_title",
        group: "Patents & certificates",
        groupZh: "专利与证书",
        label: "Certificate 2 name",
        labelZh: "证书 2 名称",
        kind: "text",
        value: "European Patent",
        max: budget(69, 6.5),
      },
      {
        id: "cert_2_number",
        group: "Patents & certificates",
        groupZh: "专利与证书",
        label: "Certificate 2 number",
        labelZh: "证书 2 编号",
        kind: "text",
        value: "EP 3 982 104 B1",
        max: budget(69, 5),
      },
      {
        id: "cert_3_title",
        group: "Patents & certificates",
        groupZh: "专利与证书",
        label: "Certificate 3 name",
        labelZh: "证书 3 名称",
        kind: "text",
        value: "China Patent",
        max: budget(69, 6.5),
      },
      {
        id: "cert_3_number",
        group: "Patents & certificates",
        groupZh: "专利与证书",
        label: "Certificate 3 number",
        labelZh: "证书 3 编号",
        kind: "text",
        value: "ZL 2021 2 1234567.8",
        max: budget(69, 5),
      },
      {
        id: "cert_4_title",
        group: "Patents & certificates",
        groupZh: "专利与证书",
        label: "Certificate 4 name",
        labelZh: "证书 4 名称",
        kind: "text",
        value: "ISO 9001:2015",
        max: budget(69, 6.5),
      },
      {
        id: "cert_4_number",
        group: "Patents & certificates",
        groupZh: "专利与证书",
        label: "Certificate 4 number",
        labelZh: "证书 4 编号",
        kind: "text",
        value: "Quality Certified",
        max: budget(69, 5),
      },
    ],
  },
  {
    id: "story",
    module: "A-11",
    title: "Story, FAQ, Gift card, Newsletter & Footer",
    titleZh: "品牌故事、常见问题、礼物卡、订阅 与 页脚",
    blurb:
      "The whole closing band: brand story, four FAQ rows, the gift card, the newsletter strip and the footer link cloud.",
    blurbZh:
      "页面结尾的整个板块：品牌故事、四条常见问题、礼物卡、订阅条，以及页脚链接组。",
    band: { y: 4124, h: 1010 },
    fields: [
      {
        id: "story_title",
        group: "Brand story",
        groupZh: "品牌故事",
        label: "Story title",
        labelZh: "故事标题",
        kind: "multiline",
        value: "A Real Rose Made\nto Outlive the Moment",
        lines: 2,
        max: budget(190, 18),
      },
      {
        id: "story_body",
        group: "Brand story",
        groupZh: "品牌故事",
        label: "Story paragraph",
        labelZh: "故事正文",
        kind: "multiline",
        value:
          "At ELDREVE, we believe the most meaningful\ngifts are more than beautiful — they’re personal.\nEach real rose is carefully preserved in 24K gold,\ncapturing not just a flower, but a memory,\na milestone, a feeling.\n\nWe don’t just preserve roses.\nWe preserve what matters.",
        lines: 8,
        max: budget(176, 8),
        note: "Line breaks are the design's own — keep it to eight lines so it clears the CTA below.",
        noteZh: "换行位置来自设计稿——请保持八行，以免压到下方按钮。",
      },
      {
        id: "story_quote",
        group: "Brand story",
        groupZh: "品牌故事",
        label: "Pull quote",
        labelZh: "引言",
        kind: "multiline",
        value: "A flower may fade.\nThe story does not have to.",
        lines: 2,
        max: budget(170, 11.2),
      },
      {
        id: "story_cta_label",
        group: "Brand story",
        groupZh: "品牌故事",
        label: "Button label",
        labelZh: "按钮文字",
        kind: "text",
        value: "READ OUR STORY",
        max: budget(110, 7.9, 0.62),
      },
      {
        id: "story_cta_href",
        group: "Brand story",
        groupZh: "品牌故事",
        label: "Button link",
        labelZh: "按钮链接",
        kind: "url",
        value: "/story",
      },
      {
        id: "faq_title",
        group: "FAQ",
        groupZh: "常见问题",
        label: "FAQ title",
        labelZh: "常见问题标题",
        kind: "text",
        value: "Frequently Asked Questions",
        max: budget(360, 24),
      },
      {
        id: "faq_1",
        group: "FAQ",
        groupZh: "常见问题",
        label: "Question 1",
        labelZh: "问题 1",
        kind: "text",
        value: "Are ELDREVE gifts made from real roses?",
        max: budget(315, 10.5),
      },
      {
        id: "faq_2",
        group: "FAQ",
        groupZh: "常见问题",
        label: "Question 2",
        labelZh: "问题 2",
        kind: "text",
        value: "Can I personalize a gift?",
        max: budget(315, 10.5),
      },
      {
        id: "faq_3",
        group: "FAQ",
        groupZh: "常见问题",
        label: "Question 3",
        labelZh: "问题 3",
        kind: "text",
        value: "How are gifts protected during shipping?",
        max: budget(315, 10.5),
      },
      {
        id: "faq_4",
        group: "FAQ",
        groupZh: "常见问题",
        label: "Question 4",
        labelZh: "问题 4",
        kind: "text",
        value: "Do you accept corporate and bulk orders?",
        max: budget(315, 10.5),
      },
      {
        id: "faq_href",
        group: "FAQ",
        groupZh: "常见问题",
        label: "Question link",
        labelZh: "问题链接",
        kind: "url",
        value: "/care/chat",
        note: "Every row and the “View all FAQs” button share this destination.",
        noteZh: "所有问题行与“View all FAQs”按钮共用此目标地址。",
      },
      {
        id: "faq_view_all_label",
        group: "FAQ",
        groupZh: "常见问题",
        label: "“View all FAQs” label",
        labelZh: "“View all FAQs” 文字",
        kind: "artwork",
        value: "VIEW ALL FAQs →",
        note: "Baked into the design's own SVG render (2380-796.svg).",
        noteZh: "已烘焙进设计稿 SVG（2380-796.svg）。",
      },
      {
        id: "gift_title",
        group: "Gift card",
        groupZh: "礼物卡",
        label: "Card title",
        labelZh: "卡片标题",
        kind: "multiline",
        value: "Give Them a Rose\nThey Will Remember",
        lines: 2,
        max: budget(152, 18.5),
      },
      {
        id: "gift_body",
        group: "Gift card",
        groupZh: "礼物卡",
        label: "Card copy",
        labelZh: "卡片文案",
        kind: "multiline",
        value: "Choose a classic design\nand let your message last.",
        lines: 2,
        max: budget(150, 9.5),
      },
      {
        id: "gift_cta_label",
        group: "Gift card",
        groupZh: "礼物卡",
        label: "Button label",
        labelZh: "按钮文字",
        kind: "text",
        value: "SHOP GOLD ROSES",
        max: budget(86, 9.5, 0.62),
      },
      {
        id: "gift_cta_href",
        group: "Gift card",
        groupZh: "礼物卡",
        label: "Button link",
        labelZh: "按钮链接",
        kind: "url",
        value: "/shop",
      },
      {
        id: "newsletter_title",
        group: "Newsletter",
        groupZh: "订阅",
        label: "Title",
        labelZh: "标题",
        kind: "text",
        value: "Keep Meaningful Moments Close",
        lines: 2,
        max: budget(184, 19),
      },
      {
        id: "newsletter_body",
        group: "Newsletter",
        groupZh: "订阅",
        label: "Copy",
        labelZh: "文案",
        kind: "multiline",
        value: "New stories, gifting inspiration,\nand occasional updates.",
        lines: 2,
        max: budget(184, 10.5),
      },
      {
        id: "newsletter_button",
        group: "Newsletter",
        groupZh: "订阅",
        label: "Button label",
        labelZh: "按钮文字",
        kind: "text",
        value: "JOIN",
        max: budget(24, 10, 0.62),
        note: "Signed-out visitors see this button. Signed-in ones see the welcome card below instead — the 08-07 frames replaced the email field with those two states, so nothing is collected here either way.",
        noteZh:
          "未登录访客看到此按钮；已登录访客改为看到下方的欢迎卡片。08-07 设计稿以这两种状态取代了原邮箱输入框，两种状态都不在此收集邮箱。",
      },
      {
        id: "newsletter_href",
        group: "Newsletter",
        groupZh: "订阅",
        label: "Button link",
        labelZh: "按钮链接",
        kind: "url",
        value: "/account/signup",
      },
      {
        id: "newsletter_welcome_text",
        group: "Newsletter",
        groupZh: "订阅",
        label: "Welcome card line",
        labelZh: "欢迎卡片说明",
        kind: "text",
        value: "Welcome back to ELDREVE",
        max: budget(187, 13),
        note: "Shown to signed-in visitors in place of the JOIN button (frame 2974:359).",
        noteZh: "已登录访客看到的内容，替代 JOIN 按钮（设计稿 2974:359）。",
      },
      {
        id: "newsletter_welcome_greeting",
        group: "Newsletter",
        groupZh: "订阅",
        label: "Welcome card greeting",
        labelZh: "欢迎卡片称呼",
        kind: "text",
        value: "Hello,",
        max: budget(120, 20),
        note: "The customer's own name is appended after this, so keep the trailing comma and no name here.",
        noteZh:
          "系统会在这句话后面自动接上顾客的名字，请保留结尾逗号，不要在此填写姓名。",
      },
      {
        id: "footer_1_label",
        group: "Footer links",
        groupZh: "页脚链接",
        label: "Link 1 label",
        labelZh: "链接 1 文字",
        kind: "text",
        value: "SHOP",
        max: budget(82, 8.5, 0.62),
        note: "The footer labels sit in hand-placed, centre-aligned boxes. Five of them pad the label with a NON-BREAKING space to nudge the centred text sideways; an ordinary space collapses and the label jumps. Copy the padding as-is.",
        noteZh:
          "页脚文字位于手工摆放的居中文本框内。其中五条用不换行空格（NBSP）微调居中位置；换成普通空格会被浏览器折叠，文字会跳位。请原样保留。",
      },
      {
        id: "footer_1_href",
        group: "Footer links",
        groupZh: "页脚链接",
        label: "Link 1 target",
        labelZh: "链接 1 地址",
        kind: "url",
        value: "/shop",
      },
      {
        id: "footer_2_label",
        group: "Footer links",
        groupZh: "页脚链接",
        label: "Link 2 label",
        labelZh: "链接 2 文字",
        kind: "text",
        value: "OUR CRAFT\u00a0",
        max: budget(65, 8.5, 0.62),
      },
      {
        id: "footer_2_href",
        group: "Footer links",
        groupZh: "页脚链接",
        label: "Link 2 target",
        labelZh: "链接 2 地址",
        kind: "url",
        value: "/craft",
      },
      {
        id: "footer_3_label",
        group: "Footer links",
        groupZh: "页脚链接",
        label: "Link 3 label",
        labelZh: "链接 3 文字",
        kind: "text",
        value: "OUR STORY",
        max: budget(160, 8.5, 0.62),
      },
      {
        id: "footer_3_href",
        group: "Footer links",
        groupZh: "页脚链接",
        label: "Link 3 target",
        labelZh: "链接 3 地址",
        kind: "url",
        value: "/story",
      },
      {
        id: "footer_4_label",
        group: "Footer links",
        groupZh: "页脚链接",
        label: "Link 4 label",
        labelZh: "链接 4 文字",
        kind: "text",
        value: "FAQ\u00a0",
        max: budget(67, 8.5, 0.62),
      },
      {
        id: "footer_4_href",
        group: "Footer links",
        groupZh: "页脚链接",
        label: "Link 4 target",
        labelZh: "链接 4 地址",
        kind: "url",
        value: "/care",
      },
      {
        id: "footer_5_label",
        group: "Footer links",
        groupZh: "页脚链接",
        label: "Link 5 label",
        labelZh: "链接 5 文字",
        kind: "text",
        value: "BLOG\u00a0",
        max: budget(46, 8.5, 0.62),
      },
      {
        id: "footer_5_href",
        group: "Footer links",
        groupZh: "页脚链接",
        label: "Link 5 target",
        labelZh: "链接 5 地址",
        kind: "url",
        value: "/blog",
      },
      {
        id: "footer_6_label",
        group: "Footer links",
        groupZh: "页脚链接",
        label: "Link 6 label",
        labelZh: "链接 6 文字",
        kind: "text",
        value: "SHIPPING & RETURNS",
        max: budget(121, 8.5, 0.62),
      },
      {
        id: "footer_6_href",
        group: "Footer links",
        groupZh: "页脚链接",
        label: "Link 6 target",
        labelZh: "链接 6 地址",
        kind: "url",
        value: "/policies/returns-refunds-cancellations",
      },
      {
        id: "footer_7_label",
        group: "Footer links",
        groupZh: "页脚链接",
        label: "Link 7 label",
        labelZh: "链接 7 文字",
        kind: "text",
        value: "\u00a0PRIVACY",
        max: budget(68, 8.5, 0.62),
      },
      {
        id: "footer_7_href",
        group: "Footer links",
        groupZh: "页脚链接",
        label: "Link 7 target",
        labelZh: "链接 7 地址",
        kind: "url",
        value: "/policies/privacy",
      },
      {
        id: "footer_8_label",
        group: "Footer links",
        groupZh: "页脚链接",
        label: "Link 8 label",
        labelZh: "链接 8 文字",
        kind: "text",
        value: "\u00a0TERMS",
        max: budget(39, 8.5, 0.62),
      },
      {
        id: "footer_8_href",
        group: "Footer links",
        groupZh: "页脚链接",
        label: "Link 8 target",
        labelZh: "链接 8 地址",
        kind: "url",
        value: "/policies/terms-of-service",
      },
    ],
  },
] as const satisfies readonly HomeSection[];

/**
 * The registry widened to its declared type. `HOME_SECTIONS` is `as const`, so
 * each entry is narrowed to exactly the keys it spells out and the optional
 * ones (`group`, `max`, `note` …) are absent from the type — great for deriving
 * `HomeText`, useless for iterating. Code that walks the registry uses this;
 * code that wants typed field ids uses `HOME_SECTIONS`.
 */
export const HOME_SECTION_LIST: readonly HomeSection[] = HOME_SECTIONS;

type Sections = typeof HOME_SECTIONS;

/** A homepage section id, e.g. `"hero"` — narrowed from HOME_SECTIONS. */
export type HomeSectionId = Sections[number]["id"];

/**
 * The resolved copy for the whole page: `text.hero.title`, `text.faq.faq_1` …
 * Derived from HOME_SECTIONS, so a new field is typed the moment it is added.
 */
export type HomeText = {
  readonly [S in Sections[number] as S["id"]]: {
    readonly [F in S["fields"][number] as F["id"]]: string;
  };
};

/** Kinds whose value the owner can actually type into. */
const EDITABLE: ReadonlySet<HomeFieldKind> = new Set([
  "text",
  "multiline",
  "url",
]);

/**
 * Whether a field's value is owner-editable (as opposed to design artwork or
 * data owned by another admin screen).
 *
 * @param field - The registry field to test.
 * @returns True when the admin renders a writable input for this field.
 */
export function isEditable(field: HomeField): boolean {
  return EDITABLE.has(field.kind);
}

/**
 * The advisory character budget for a whole field: the per-line budget times
 * the box's designed line count — but never less than what the design itself
 * already puts in that box.
 *
 * That floor matters. `budget()` estimates from an average glyph width, and at
 * the small sizes this page uses it runs 10–25% tight, so a bare estimate would
 * flag a dozen of the design's own strings the moment the screen opens — and an
 * alarm that is always on is an alarm nobody reads. The design's own wording is
 * by definition something that fits; the estimate only governs how much MORE
 * the owner can add.
 *
 * @param field - The registry field.
 * @returns The total character budget, or null when the field has none.
 */
export function fieldBudget(field: HomeField): number | null {
  if (field.max === undefined) return null;
  return Math.max(
    field.max * Math.max(field.lines ?? 1, 1),
    field.value.length,
  );
}

/**
 * Whether a link value is safe to place in an `href`. Every homepage link the
 * owner types is rendered into an anchor, so schemes that execute — most
 * obviously `javascript:` — are rejected at the write, not at the render.
 *
 * @param value - The link the owner typed.
 * @returns True for in-site paths, fragments, and http/https/mailto/tel links.
 */
export function isSafeHref(value: string): boolean {
  const href = value.trim();
  if (href.length === 0 || href.length > 2000) return false;
  // Relative paths and fragments: in-site, and cannot carry a scheme.
  if (href.startsWith("/") || href.startsWith("#")) return !href.includes(":");
  return /^(https?:\/\/|mailto:|tel:)/i.test(href);
}

/**
 * The `site_content` key a field is stored under. Fields carry an explicit
 * `key` only when they predate this registry (the promo slogan).
 *
 * @param sectionId - The owning section's id.
 * @param field - The registry field.
 * @returns The slot key, e.g. `"home.hero.title"`.
 */
export function slotKey(sectionId: string, field: HomeField): string {
  return field.key ?? `home.${sectionId}.${field.id}`;
}

/**
 * The `site_content` key holding a section's show/hide state.
 *
 * @param sectionId - The section id, e.g. `"craft"`.
 * @returns The visibility slot key, e.g. `"home.craft.__visible"`.
 */
export function visibilityKey(sectionId: string): string {
  return `home.${sectionId}.__visible`;
}

/**
 * Look up one section in the registry.
 *
 * @param sectionId - The section id to find.
 * @returns The section, or undefined when the id is not in the registry.
 */
export function findSection(sectionId: string): HomeSection | undefined {
  return HOME_SECTIONS.find((section) => section.id === sectionId);
}

/**
 * Every slot key this registry owns, for bulk reads and the "reset the whole
 * page" action.
 *
 * @returns The content keys and visibility keys of every section.
 */
export function allHomeKeys(): string[] {
  const keys: string[] = [];
  for (const section of HOME_SECTIONS) {
    if (section.band) keys.push(visibilityKey(section.id));
    for (const field of section.fields) {
      if (isEditable(field)) keys.push(slotKey(section.id, field));
    }
  }
  return keys;
}
