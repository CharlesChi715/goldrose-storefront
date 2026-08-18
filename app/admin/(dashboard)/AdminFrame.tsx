"use client";

/**
 * ROLE OF THIS FILE
 * The Shopify-admin chrome (§9.1): Polaris Frame with the cloned left nav
 * (Home · Orders · Products · Customers · Content · Analytics · Discounts,
 * Settings pinned last), the top bar (search placeholder until the ⌘K modal
 * ships in Stage 7, alerts bell, account menu with EN/中文 + log out), and
 * the persistent sandbox/live payment-mode banner (adapt — where Shopify
 * shows trial banners).
 */

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Frame,
  InlineStack,
  Modal,
  Navigation,
  Text,
  TextField,
  TopBar,
} from "@shopify/polaris";
import {
  ChartVerticalFilledIcon,
  ChatIcon,
  ContentIcon,
  DiscountIcon,
  HomeIcon,
  MagicIcon,
  NotificationIcon,
  OrderIcon,
  PersonIcon,
  ProductIcon,
  QuestionCircleIcon,
  SettingsIcon,
} from "@shopify/polaris-icons";
import {
  searchAdminAction,
  setAdminLangAction,
  signOutAction,
} from "../actions";
import { useAdminLang, useAdminT, useSetAdminLang } from "../PolarisShell";
import type { AdminAlert } from "@/lib/admin/analytics";
import type { SearchResults } from "@/lib/admin/analytics";
import {
  FORUM_READ_EVENT,
  getReadMarks,
  totalUnread,
  type ForumThreadActivity,
} from "@/lib/forum-unread";

export type PaymentMode = "mock" | "sandbox" | "live";

const EMPTY_RESULTS: SearchResults = {
  orders: [],
  products: [],
  customers: [],
};

export function AdminFrame({
  email,
  paymentMode,
  alerts = [],
  forumActivity = [],
  forumIdentity = "",
  children,
}: {
  email: string;
  paymentMode: PaymentMode;
  alerts?: AdminAlert[];
  forumActivity?: ForumThreadActivity[];
  forumIdentity?: string;
  children: React.ReactNode;
}) {
  const t = useAdminT();
  const lang = useAdminLang();
  const pathname = usePathname() ?? "/admin";
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // ⌘K global search (§9.1): modal opened by the shortcut or the top-bar field.
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] =
    useState<SearchResults>(EMPTY_RESULTS);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const runSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }
    searchTimer.current = setTimeout(async () => {
      if (!query.trim()) {
        setSearchResults(EMPTY_RESULTS);
        return;
      }
      setSearchResults(await searchAdminAction(query));
    }, 200);
  }, []);

  function openResult(url: string) {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults(EMPTY_RESULTS);
    router.push(url);
  }

  // Forum unread badge: read marks are localStorage, so count only after
  // mount (server render shows no badge — no hydration mismatch) and recount
  // whenever a thread page records a read.
  const [forumUnread, setForumUnread] = useState(0);
  useEffect(() => {
    const recount = () =>
      setForumUnread(totalUnread(forumActivity, getReadMarks(), forumIdentity));
    recount();
    window.addEventListener(FORUM_READ_EVENT, recount);
    return () => window.removeEventListener(FORUM_READ_EVENT, recount);
  }, [forumActivity, forumIdentity]);

  const setLang = useSetAdminLang();
  const toggleLang = useCallback(() => {
    const next = lang === "en" ? "zh" : "en";
    // Instant client flip (perf fix 2026-07-22): every admin string renders
    // from LangContext, so no server round trip is needed to switch. The
    // cookie write runs in the background for future page loads.
    setLang(next);
    void setAdminLangAction(next);
  }, [lang, setLang]);

  const logOut = useCallback(() => {
    startTransition(async () => {
      await signOutAction();
    });
  }, []);

  const selected = (url: string, exact = false) =>
    exact
      ? pathname === url
      : pathname === url || pathname.startsWith(`${url}/`);

  const navigation = (
    <Navigation location={pathname}>
      <Navigation.Section
        items={[
          {
            url: "/admin",
            label: t("nav.home"),
            icon: HomeIcon,
            selected: selected("/admin", true),
          },
          {
            url: "/admin/orders",
            label: t("nav.orders"),
            icon: OrderIcon,
            selected: selected("/admin/orders"),
            subNavigationItems: [
              // Self-referencing first child (Shopify's own pattern). Polaris
              // turns any parent that has sub-items into a pure disclosure
              // toggle below 768px — it calls preventDefault() on the parent's
              // own link — so without this row the parent page is unreachable
              // on mobile. See Navigation/components/Item getClickHandler.
              { url: "/admin/orders", label: t("nav.orders.all") },
              { url: "/admin/orders/drafts", label: t("nav.orders.drafts") },
              {
                url: "/admin/orders/abandoned",
                label: t("nav.orders.abandoned"),
              },
            ],
          },
          {
            url: "/admin/products",
            label: t("nav.products"),
            icon: ProductIcon,
            selected: selected("/admin/products"),
            subNavigationItems: [
              { url: "/admin/products", label: t("nav.products.all") },
              {
                url: "/admin/products/inventory",
                label: t("nav.products.inventory"),
              },
            ],
          },
          {
            url: "/admin/customers",
            label: t("nav.customers"),
            icon: PersonIcon,
            selected: selected("/admin/customers"),
          },
          {
            url: "/admin/content",
            label: t("nav.content"),
            icon: ContentIcon,
            selected: selected("/admin/content"),
            subNavigationItems: [
              { url: "/admin/content", label: t("nav.content.all") },
              { url: "/admin/content/home", label: t("nav.content.home") },
              { url: "/admin/content/files", label: t("nav.content.files") },
              { url: "/admin/content/ideas", label: t("nav.content.ideas") },
            ],
          },
          {
            url: "/admin/analytics",
            label: t("nav.analytics"),
            icon: ChartVerticalFilledIcon,
            selected: selected("/admin/analytics"),
          },
          {
            url: "/admin/discounts",
            label: t("nav.discounts"),
            icon: DiscountIcon,
            selected: selected("/admin/discounts"),
          },
          {
            url: "/admin/forum",
            label: t("nav.forum"),
            icon: ChatIcon,
            selected: selected("/admin/forum"),
            badge:
              forumUnread > 0 ? (
                <Badge tone="new">{String(forumUnread)}</Badge>
              ) : undefined,
          },
          {
            url: "/admin/guide",
            label: t("nav.guide"),
            icon: QuestionCircleIcon,
            selected: selected("/admin/guide"),
          },
          {
            url: "/admin/advisor",
            label: t("nav.advisor"),
            icon: MagicIcon,
            selected: selected("/admin/advisor"),
          },
        ]}
      />
      <Navigation.Section
        fill
        separator
        items={[
          {
            url: "/admin/settings",
            label: t("nav.settings"),
            icon: SettingsIcon,
            selected: selected("/admin/settings"),
            subNavigationItems: [
              { url: "/admin/settings", label: t("nav.settings.general") },
              { url: "/admin/settings/team", label: t("nav.settings.team") },
              {
                url: "/admin/settings/security",
                label: t("nav.settings.security"),
              },
            ],
          },
        ]}
      />
    </Navigation>
  );

  const userMenu = (
    <TopBar.UserMenu
      actions={[
        {
          items: [
            { content: t("topbar.account.language"), onAction: toggleLang },
            { content: t("topbar.account.logout"), onAction: logOut },
          ],
        },
      ]}
      name={email}
      detail="ELDREVE"
      initials={(email[0] ?? "G").toUpperCase()}
      open={userMenuOpen}
      onToggle={() => setUserMenuOpen((open) => !open)}
    />
  );

  const alertsMenu = (
    <TopBar.Menu
      activatorContent={
        <span>
          <NotificationIcon width={20} height={20} fill="currentColor" />
          <Text as="span" visuallyHidden>
            {t("topbar.notifications")}
          </Text>
        </span>
      }
      open={alertsOpen}
      onOpen={() => setAlertsOpen(true)}
      onClose={() => setAlertsOpen(false)}
      actions={[
        {
          items:
            alerts.length > 0
              ? alerts.map((alert) => ({
                  content: alert.message,
                  onAction: () => {
                    setAlertsOpen(false);
                    router.push(alert.url);
                  },
                }))
              : [{ content: t("topbar.notifications.empty") }],
        },
      ]}
    />
  );

  // Owner request (2026-07-23): the EN/中文 switch lives visibly in the top
  // bar (and stays in the account menu too).
  const secondaryMenu = (
    <InlineStack gap="100" blockAlign="center" wrap={false}>
      {/* Native button: Polaris Button text is dark and vanishes on the dark
          top bar — white text + subtle hover to match the bell. */}
      <button
        type="button"
        onClick={toggleLang}
        style={{
          background: "transparent",
          border: "none",
          color: "#FFFFFF",
          fontSize: 13,
          fontWeight: 600,
          padding: "6px 12px",
          borderRadius: 8,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.background = "rgba(255,255,255,0.12)";
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.background = "transparent";
        }}
      >
        {t("topbar.account.language")}
      </button>
      {alertsMenu}
    </InlineStack>
  );

  const topBar = (
    <TopBar
      showNavigationToggle
      userMenu={userMenu}
      secondaryMenu={secondaryMenu}
      searchField={
        <TopBar.SearchField
          placeholder={`${t("topbar.search.placeholder")} (⌘K)`}
          value={searchValue}
          onChange={setSearchValue}
          onFocus={() => setSearchOpen(true)}
        />
      }
      onNavigationToggle={() => setMobileNavOpen((open) => !open)}
    />
  );

  const bannerTone = paymentMode === "live" ? "critical" : "warning";
  const bannerText =
    paymentMode === "live"
      ? t("banner.live")
      : paymentMode === "sandbox"
        ? t("banner.sandbox")
        : t("banner.mock");

  return (
    <Frame
      topBar={topBar}
      navigation={navigation}
      showMobileNavigation={mobileNavOpen}
      onNavigationDismiss={() => setMobileNavOpen(false)}
    >
      <Box
        paddingBlockEnd="200"
        paddingInlineStart="400"
        paddingInlineEnd="400"
        paddingBlockStart="200"
      >
        <Banner tone={bannerTone}>{bannerText}</Banner>
      </Box>
      {children}

      {/* ⌘K search modal (§9.1) — results grouped like Shopify's */}
      <Modal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        title={t("topbar.search.placeholder")}
      >
        <Modal.Section>
          <BlockStack gap="300">
            <TextField
              label={t("topbar.search.placeholder")}
              labelHidden
              autoFocus
              placeholder={t("topbar.search.placeholder")}
              value={searchQuery}
              onChange={runSearch}
              autoComplete="off"
              clearButton
              onClearButtonClick={() => runSearch("")}
            />
            {(
              [
                ["search.group.orders", searchResults.orders, "/admin/orders/"],
                [
                  "search.group.products",
                  searchResults.products,
                  "/admin/products/",
                ],
                [
                  "search.group.customers",
                  searchResults.customers,
                  "/admin/customers/",
                ],
              ] as const
            ).map(([labelKey, hits, prefix]) =>
              hits.length > 0 ? (
                <BlockStack key={labelKey} gap="150">
                  <Text as="h3" variant="headingSm" tone="subdued">
                    {t(labelKey)}
                  </Text>
                  {hits.map((hit) => (
                    <button
                      key={hit.id}
                      type="button"
                      onClick={() => openResult(`${prefix}${hit.id}`)}
                      style={{
                        textAlign: "left",
                        background: "none",
                        border: "none",
                        padding: "6px 4px",
                        cursor: "pointer",
                        borderRadius: 8,
                      }}
                    >
                      <Text as="span" fontWeight="semibold">
                        {hit.label}
                      </Text>{" "}
                      <Text as="span" tone="subdued" variant="bodySm">
                        {hit.sublabel}
                      </Text>
                    </button>
                  ))}
                </BlockStack>
              ) : null,
            )}
            {searchQuery.trim() &&
            searchResults.orders.length === 0 &&
            searchResults.products.length === 0 &&
            searchResults.customers.length === 0 ? (
              <Text as="p" tone="subdued">
                {t("search.empty")}
              </Text>
            ) : null}
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Frame>
  );
}
