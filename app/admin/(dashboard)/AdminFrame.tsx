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

import { useCallback, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Banner, Box, Frame, Navigation, Text, TopBar } from "@shopify/polaris";
import {
  ChartVerticalFilledIcon,
  ContentIcon,
  DiscountIcon,
  HomeIcon,
  NotificationIcon,
  OrderIcon,
  PersonIcon,
  ProductIcon,
  SettingsIcon,
} from "@shopify/polaris-icons";
import { setAdminLangAction, signOutAction } from "../actions";
import { useAdminLang, useAdminT } from "../PolarisShell";

export type PaymentMode = "mock" | "sandbox" | "live";

export function AdminFrame({
  email,
  paymentMode,
  children,
}: {
  email: string;
  paymentMode: PaymentMode;
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

  const toggleLang = useCallback(() => {
    startTransition(async () => {
      await setAdminLangAction(lang === "en" ? "zh" : "en");
      router.refresh();
    });
  }, [lang, router]);

  const logOut = useCallback(() => {
    startTransition(async () => {
      await signOutAction();
    });
  }, []);

  const selected = (url: string, exact = false) =>
    exact ? pathname === url : pathname === url || pathname.startsWith(`${url}/`);

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
              { url: "/admin/orders/drafts", label: t("nav.orders.drafts") },
              { url: "/admin/orders/abandoned", label: t("nav.orders.abandoned") },
            ],
          },
          {
            url: "/admin/products",
            label: t("nav.products"),
            icon: ProductIcon,
            selected: selected("/admin/products"),
            subNavigationItems: [
              { url: "/admin/products/inventory", label: t("nav.products.inventory") },
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
              { url: "/admin/content/files", label: t("nav.content.files") },
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
      detail="GoldRose"
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
      actions={[{ items: [{ content: t("topbar.notifications.empty") }] }]}
    />
  );

  const topBar = (
    <TopBar
      showNavigationToggle
      userMenu={userMenu}
      secondaryMenu={alertsMenu}
      searchField={
        <TopBar.SearchField
          placeholder={t("topbar.search.placeholder")}
          value={searchValue}
          onChange={setSearchValue}
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
      logo={{
        topBarSource: undefined,
        accessibilityLabel: "GoldRose",
      }}
    >
      <Box paddingBlockEnd="200" paddingInlineStart="400" paddingInlineEnd="400" paddingBlockStart="200">
        <Banner tone={bannerTone}>{bannerText}</Banner>
      </Box>
      {children}
    </Frame>
  );
}
