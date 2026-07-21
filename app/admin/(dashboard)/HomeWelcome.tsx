"use client";

/**
 * ROLE OF THIS FILE
 * Stage 2 placeholder body for /admin Home — replaced by the cloned Shopify
 * Home dashboard in Stage 7 (§9.3).
 */

import { Card, Page, Text, BlockStack } from "@shopify/polaris";
import { useAdminT } from "../PolarisShell";

export function HomeWelcome() {
  const t = useAdminT();
  return (
    <Page title={t("nav.home")}>
      <Card>
        <BlockStack gap="200">
          <Text as="h2" variant="headingMd">
            {t("home.welcome.title")}
          </Text>
          <Text as="p" tone="subdued">
            {t("home.welcome.body")}
          </Text>
        </BlockStack>
      </Card>
    </Page>
  );
}
