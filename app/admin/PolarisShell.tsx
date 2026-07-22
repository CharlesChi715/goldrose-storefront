"use client";

/**
 * ROLE OF THIS FILE
 * The client half of the admin root layout: Polaris AppProvider (with
 * Shopify's own locale files, so built-in component strings match the
 * chosen language) plus a tiny context that hands every admin client
 * component the current language and a bound t().
 */

import { createContext, useContext, useMemo, useState } from "react";
import { AppProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import zhTranslations from "@shopify/polaris/locales/zh-CN.json";
import { makeT, type AdminLang, type AdminMessageKey } from "@/lib/admin/i18n";

const LangContext = createContext<AdminLang>("en");
// Client-side setter (perf fix 2026-07-22): flipping the language is pure
// client state — instant — while the cookie write happens in the background
// for the NEXT server render. No router.refresh needed.
const SetLangContext = createContext<(lang: AdminLang) => void>(() => {});

export function useAdminLang(): AdminLang {
  return useContext(LangContext);
}

export function useSetAdminLang(): (lang: AdminLang) => void {
  return useContext(SetLangContext);
}

/** Bound translator for client components: `const t = useAdminT()`. */
export function useAdminT(): (key: AdminMessageKey) => string {
  const lang = useAdminLang();
  return useMemo(() => makeT(lang), [lang]);
}

export function PolarisShell({
  lang: initialLang,
  children,
}: {
  lang: AdminLang;
  children: React.ReactNode;
}) {
  const [lang, setLang] = useState(initialLang);
  return (
    <LangContext.Provider value={lang}>
      <SetLangContext.Provider value={setLang}>
        <AppProvider i18n={lang === "zh" ? zhTranslations : enTranslations}>
          {children}
        </AppProvider>
      </SetLangContext.Provider>
    </LangContext.Provider>
  );
}
