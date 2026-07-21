/**
 * ROLE OF THIS FILE
 * The admin's bilingual dictionary (§9.12): one typed map of every
 * admin-authored string, in English and Shopify's own Simplified-Chinese
 * admin vocabulary. Pure data + lookup — importable from server and client
 * code alike. A missing zh key falls back to en, so a half-translated build
 * never crashes or shows blanks.
 *
 * BUILD RULE (§9.12): no hardcoded UI strings in admin components —
 * everything goes through t(), and each new screen adds both languages in
 * the same commit.
 */

export type AdminLang = "en" | "zh";

export const ADMIN_LANG_COOKIE = "admin_lang";

const en = {
  // Shell & navigation (§9.1 — Shopify's order, minus dropped items)
  "nav.home": "Home",
  "nav.orders": "Orders",
  "nav.orders.drafts": "Drafts",
  "nav.orders.abandoned": "Abandoned checkouts",
  "nav.products": "Products",
  "nav.products.inventory": "Inventory",
  "nav.customers": "Customers",
  "nav.content": "Content",
  "nav.content.files": "Files",
  "nav.analytics": "Analytics",
  "nav.discounts": "Discounts",
  "nav.settings": "Settings",

  // Top bar
  "topbar.search.placeholder": "Search",
  "topbar.notifications": "Alerts",
  "topbar.notifications.empty": "Nothing new right now",
  "topbar.account.language": "中文",
  "topbar.account.logout": "Log out",

  // Payment-mode banner (adapt — where Shopify shows trial banners)
  "banner.mock": "Test mode — checkout is simulated locally and no payment provider is connected.",
  "banner.sandbox": "PayPal sandbox mode — payments use sandbox money, nothing real is charged.",
  "banner.live": "Live payments are ON — real money moves at checkout.",

  // Login
  "login.title": "Log in",
  "login.subtitle": "Continue to GoldRose admin",
  "login.email": "Email",
  "login.password": "Password",
  "login.submit": "Log in",
  "login.error.invalid": "Your email or password is incorrect.",
  "login.devHint":
    "Local development login — no Supabase configured. Use any email with the dev password (ADMIN_DEV_PASSWORD).",

  // Shared bits
  "common.loading": "Loading",
  "common.cancel": "Cancel",
  "common.save": "Save",
  "common.comingSoon": "This screen ships in a later stage of the build.",
  "home.welcome.title": "Welcome to your GoldRose admin",
  "home.welcome.body":
    "Your store's products, orders, customers, and settings will all be managed from here.",

  // Products list (§9.5)
  "products.add": "Add product",
  "products.export": "Export",
  "products.tabs.all": "All",
  "products.tabs.active": "Active",
  "products.tabs.draft": "Draft",
  "products.tabs.archived": "Archived",
  "products.search.placeholder": "Filter products",
  "products.column.product": "Product",
  "products.column.status": "Status",
  "products.column.inventory": "Inventory",
  "products.column.category": "Category",
  "products.column.vendor": "Vendor",
  "products.status.active": "Active",
  "products.status.draft": "Draft",
  "products.status.archived": "Archived",
  "products.inventory.summary": "{available} in stock for {count} variants",
  "products.inventory.summaryOne": "{available} in stock",
  "products.inventory.untracked": "Inventory not tracked",
  "products.bulk.setActive": "Set as active",
  "products.bulk.setDraft": "Set as draft",
  "products.bulk.archive": "Archive",
  "products.bulk.delete": "Delete",
  "products.delete.title": "Delete product?",
  "products.delete.body":
    "This can't be undone. Order history keeps the product's name and SKU.",
  "products.delete.confirm": "Delete",
  "products.empty": "No products found",

  // Product form (§9.5 — Shopify's cards in Shopify's order)
  "form.new.title": "Add product",
  "form.title.label": "Title",
  "form.description.label": "Description",
  "form.media.title": "Media",
  "form.media.add": "Add images",
  "form.media.alt": "Alt text",
  "form.media.moveLeft": "Move left",
  "form.media.moveRight": "Move right",
  "form.media.remove": "Remove image",
  "form.pricing.title": "Pricing",
  "form.price": "Price",
  "form.compareAt": "Compare-at price",
  "form.chargeTax": "Charge tax on this product",
  "form.cost": "Cost per item",
  "form.costHelp": "Customers won't see this",
  "form.profit": "Profit",
  "form.margin": "Margin",
  "form.inventory.title": "Inventory",
  "form.sku": "SKU (Stock Keeping Unit)",
  "form.barcode": "Barcode (ISBN, UPC, GTIN, etc.)",
  "form.trackQty": "Track quantity",
  "form.quantity": "Quantity",
  "form.continueSelling": "Continue selling when out of stock",
  "form.shipping.title": "Shipping",
  "form.physical": "This is a physical product",
  "form.weight": "Weight (oz)",
  "form.customs.title": "Customs information",
  "form.origin": "Country/Region of origin (ISO code)",
  "form.hs": "Harmonized System (HS) code",
  "form.variants.title": "Variants",
  "form.variants.addOption": "Add option",
  "form.variants.help": "Add options like size or color (up to 3)",
  "form.option.name": "Option name",
  "form.option.values": "Option values (comma separated)",
  "form.option.remove": "Remove option",
  "form.seo.title": "Search engine listing",
  "form.seo.pageTitle": "Page title",
  "form.seo.metaDescription": "Meta description",
  "form.seo.handle": "URL handle",
  "form.seo.handleWarning":
    "Don't change the handle after launch — links and Google results point at it.",
  "form.status.title": "Status",
  "form.organization.title": "Product organization",
  "form.productType": "Type",
  "form.vendor": "Vendor",
  "form.tags": "Tags (comma separated)",
  "form.save": "Save",
  "form.duplicate": "Duplicate",
  "form.archive": "Archive",
  "form.unarchive": "Unarchive",
  "form.delete": "Delete product",
  "form.copyPrefix": "Copy of",
  "form.saved": "Product saved",

  // Inventory screen (§9.6)
  "inventory.column.product": "Product",
  "inventory.column.sku": "SKU",
  "inventory.column.unavailable": "Unavailable",
  "inventory.column.committed": "Committed",
  "inventory.column.available": "Available",
  "inventory.column.onHand": "On hand",
  "inventory.adjust": "Adjust",
  "inventory.adjustBy": "Adjust by",
  "inventory.reason": "Reason",
  "inventory.note": "Note (optional)",
  "inventory.history": "View adjustment history",
  "inventory.history.title": "Adjustment history",
  "inventory.history.empty": "No adjustments yet",
  "reason.correction": "Correction (default)",
  "reason.count": "Count",
  "reason.received": "Received",
  "reason.return_restock": "Return restock",
  "reason.damaged": "Damaged",
  "reason.theft_or_loss": "Theft or loss",
  "reason.promotion_or_donation": "Promotion or donation",
  "reason.order": "Order",

  // Content → Files (§9.8)
  "files.upload": "Upload files",
  "files.copyUrl": "Copy URL",
  "files.copied": "Copied",
  "files.delete": "Delete",
  "files.delete.title": "Delete file?",
  "files.delete.body": "The file will be removed from storage. This can't be undone.",
  "files.empty": "No files yet",
} as const;

export type AdminMessageKey = keyof typeof en;

/**
 * Shopify's own Simplified-Chinese admin terms (首页 · 订单 · 产品 · 库存 ·
 * 客户 · 内容 · 分析 · 折扣 · 设置 …) so the clone is exact in both languages.
 */
const zh: Partial<Record<AdminMessageKey, string>> = {
  "nav.home": "首页",
  "nav.orders": "订单",
  "nav.orders.drafts": "草稿订单",
  "nav.orders.abandoned": "弃单",
  "nav.products": "产品",
  "nav.products.inventory": "库存",
  "nav.customers": "客户",
  "nav.content": "内容",
  "nav.content.files": "文件",
  "nav.analytics": "分析",
  "nav.discounts": "折扣",
  "nav.settings": "设置",

  "topbar.search.placeholder": "搜索",
  "topbar.notifications": "提醒",
  "topbar.notifications.empty": "暂无新提醒",
  "topbar.account.language": "English",
  "topbar.account.logout": "退出",

  "banner.mock": "测试模式 — 结账在本地模拟，未连接任何支付服务商。",
  "banner.sandbox": "PayPal 沙盒模式 — 付款使用沙盒资金，不会产生真实扣款。",
  "banner.live": "正式收款已开启 — 结账将转移真实资金。",

  "login.title": "登录",
  "login.subtitle": "继续访问 GoldRose 后台",
  "login.email": "邮箱",
  "login.password": "密码",
  "login.submit": "登录",
  "login.error.invalid": "邮箱或密码不正确。",
  "login.devHint":
    "本地开发登录 — 未配置 Supabase。使用任意邮箱和开发密码（ADMIN_DEV_PASSWORD）。",

  "common.loading": "加载中",
  "common.cancel": "取消",
  "common.save": "保存",
  "common.comingSoon": "此页面将在构建的后续阶段上线。",
  "home.welcome.title": "欢迎使用 GoldRose 后台",
  "home.welcome.body": "商店的产品、订单、客户和设置都将在这里统一管理。",

  "products.add": "添加产品",
  "products.export": "导出",
  "products.tabs.all": "全部",
  "products.tabs.active": "活跃",
  "products.tabs.draft": "草稿",
  "products.tabs.archived": "已存档",
  "products.search.placeholder": "筛选产品",
  "products.column.product": "产品",
  "products.column.status": "状态",
  "products.column.inventory": "库存",
  "products.column.category": "类别",
  "products.column.vendor": "供应商",
  "products.status.active": "活跃",
  "products.status.draft": "草稿",
  "products.status.archived": "已存档",
  "products.inventory.summary": "{count} 个多属性有 {available} 件库存",
  "products.inventory.summaryOne": "{available} 件库存",
  "products.inventory.untracked": "不跟踪库存",
  "products.bulk.setActive": "设为活跃",
  "products.bulk.setDraft": "设为草稿",
  "products.bulk.archive": "存档",
  "products.bulk.delete": "删除",
  "products.delete.title": "要删除产品吗？",
  "products.delete.body": "此操作无法撤消。订单历史会保留产品名称和 SKU。",
  "products.delete.confirm": "删除",
  "products.empty": "未找到产品",

  "form.new.title": "添加产品",
  "form.title.label": "标题",
  "form.description.label": "描述",
  "form.media.title": "媒体文件",
  "form.media.add": "添加图片",
  "form.media.alt": "替代文本",
  "form.media.moveLeft": "左移",
  "form.media.moveRight": "右移",
  "form.media.remove": "移除图片",
  "form.pricing.title": "定价",
  "form.price": "价格",
  "form.compareAt": "原价",
  "form.chargeTax": "对此产品收税",
  "form.cost": "单件成本",
  "form.costHelp": "客户不会看到此信息",
  "form.profit": "利润",
  "form.margin": "利润率",
  "form.inventory.title": "库存",
  "form.sku": "SKU（库存单位）",
  "form.barcode": "条形码（ISBN、UPC、GTIN 等）",
  "form.trackQty": "跟踪数量",
  "form.quantity": "数量",
  "form.continueSelling": "缺货时继续销售",
  "form.shipping.title": "发货",
  "form.physical": "这是一件实体产品",
  "form.weight": "重量（盎司）",
  "form.customs.title": "海关信息",
  "form.origin": "原产国/地区（ISO 代码）",
  "form.hs": "协调制度 (HS) 代码",
  "form.variants.title": "多属性",
  "form.variants.addOption": "添加选项",
  "form.variants.help": "添加尺寸或颜色等选项（最多 3 个）",
  "form.option.name": "选项名称",
  "form.option.values": "选项值（用逗号分隔）",
  "form.option.remove": "移除选项",
  "form.seo.title": "搜索引擎详情",
  "form.seo.pageTitle": "页面标题",
  "form.seo.metaDescription": "元描述",
  "form.seo.handle": "URL 句柄",
  "form.seo.handleWarning": "上线后请勿更改句柄 — 链接和 Google 搜索结果会指向它。",
  "form.status.title": "状态",
  "form.organization.title": "产品分类",
  "form.productType": "类型",
  "form.vendor": "供应商",
  "form.tags": "标签（用逗号分隔）",
  "form.save": "保存",
  "form.duplicate": "复制",
  "form.archive": "存档",
  "form.unarchive": "取消存档",
  "form.delete": "删除产品",
  "form.copyPrefix": "副本",
  "form.saved": "产品已保存",

  "inventory.column.product": "产品",
  "inventory.column.sku": "SKU",
  "inventory.column.unavailable": "不可用",
  "inventory.column.committed": "已承诺",
  "inventory.column.available": "可用",
  "inventory.column.onHand": "现有库存",
  "inventory.adjust": "调整",
  "inventory.adjustBy": "调整量",
  "inventory.reason": "原因",
  "inventory.note": "备注（可选）",
  "inventory.history": "查看调整历史",
  "inventory.history.title": "调整历史",
  "inventory.history.empty": "暂无调整记录",
  "reason.correction": "更正（默认）",
  "reason.count": "盘点",
  "reason.received": "收货",
  "reason.return_restock": "退货入库",
  "reason.damaged": "损坏",
  "reason.theft_or_loss": "失窃或丢失",
  "reason.promotion_or_donation": "促销或捐赠",
  "reason.order": "订单",

  "files.upload": "上传文件",
  "files.copyUrl": "复制链接",
  "files.copied": "已复制",
  "files.delete": "删除",
  "files.delete.title": "要删除文件吗？",
  "files.delete.body": "文件将从存储中移除。此操作无法撤消。",
  "files.empty": "暂无文件",
};

const DICTIONARIES: Record<AdminLang, Record<string, string>> = {
  en,
  zh: zh as Record<string, string>,
};

/** Translate one key; zh falls back to en so blanks can never render. */
export function t(lang: AdminLang, key: AdminMessageKey): string {
  return DICTIONARIES[lang][key] ?? en[key];
}

/** Bind the language once, e.g. `const tr = makeT(lang); tr("nav.home")`. */
export function makeT(lang: AdminLang) {
  return (key: AdminMessageKey) => t(lang, key);
}

export function isAdminLang(value: unknown): value is AdminLang {
  return value === "en" || value === "zh";
}

/** Fill {name} placeholders: interpolate(t(lang, key), { name: "…" }). */
export function interpolate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    name in vars ? String(vars[name]) : match,
  );
}
