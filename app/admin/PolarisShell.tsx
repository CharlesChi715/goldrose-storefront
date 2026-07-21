"use client";

/**
 * ROLE OF THIS FILE
 * The client half of the admin root layout: Polaris AppProvider (with
 * Shopify's own locale files, so built-in component strings match the
 * chosen language) plus a tiny context that hands every admin client
 * component the current language and a bound t().
 */

import { createContext, useContext, useMemo } from "react";
import { AppProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import zhTranslations from "@shopify/polaris/locales/zh-CN.json";
import { makeT, type AdminLang, type AdminMessageKey } from "@/lib/admin/i18n";

const LangContext = createContext<AdminLang>("en");

export function useAdminLang(): AdminLang {
  return useContext(LangContext);
}

/** Bound translator for client components: `const t = useAdminT()`. */
export function useAdminT(): (key: AdminMessageKey) => string {
  const lang = useAdminLang();
  return useMemo(() => makeT(lang), [lang]);
}

export function PolarisShell({
  lang,
  children,
}: {
  lang: AdminLang;
  children: React.ReactNode;
}) {
  return (
    <LangContext.Provider value={lang}>
      <AppProvider i18n={lang === "zh" ? zhTranslations : enTranslations}>
        {children}
      </AppProvider>
    </LangContext.Provider>
  );
}
