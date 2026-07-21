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
  "common.comingSoon": "This screen ships in a later stage of the build.",
  "home.welcome.title": "Welcome to your GoldRose admin",
  "home.welcome.body":
    "Your store's products, orders, customers, and settings will all be managed from here.",
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
  "common.comingSoon": "此页面将在构建的后续阶段上线。",
  "home.welcome.title": "欢迎使用 GoldRose 后台",
  "home.welcome.body": "商店的产品、订单、客户和设置都将在这里统一管理。",
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
