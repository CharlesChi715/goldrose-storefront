"use client";

/**
 * ROLE OF THIS FILE
 * Temporary placeholder body for admin screens whose build stage hasn't
 * landed yet (§14.2). Each stage replaces its placeholders with the real
 * cloned screen — by Stage 8 no page renders this anymore.
 */

import { Card, Page, Text } from "@shopify/polaris";
import type { AdminMessageKey } from "@/lib/admin/i18n";
import { useAdminT } from "../PolarisShell";

export function ComingSoon({ titleKey }: { titleKey: AdminMessageKey }) {
  const t = useAdminT();
  return (
    <Page title={t(titleKey)}>
      <Card>
        <Text as="p" tone="subdued">
          {t("common.comingSoon")}
        </Text>
      </Card>
    </Page>
  );
}
