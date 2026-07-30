"use client";

/**
 * ROLE OF THIS FILE
 * Client half of Content → Ideas: newest-first list of visitor feedback
 * with sender, source page, and delete.
 */

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BlockStack,
  Button,
  Card,
  InlineStack,
  Page,
  Text,
} from "@shopify/polaris";
import { formatDateTime } from "@/lib/dates";
import { useAdminT } from "../../../PolarisShell";
import { deleteIdeaAction } from "./actions";

export type IdeaItem = {
  id: string;
  name: string;
  email: string | null;
  message: string;
  path: string | null;
  createdAt: string;
};

export function IdeasList({ items }: { items: IdeaItem[] }) {
  const t = useAdminT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Page title={t("nav.content.ideas")} backAction={{ url: "/admin/content" }}>
      {items.length === 0 ? (
        <Card>
          <Text as="p" tone="subdued">
            {t("ideas.empty")}
          </Text>
        </Card>
      ) : (
        <BlockStack gap="300">
          {items.map((item) => (
            <Card key={item.id}>
              <BlockStack gap="200">
                <Text as="p">{item.message}</Text>
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="span" tone="subdued" variant="bodySm">
                    {[item.name, item.email].filter(Boolean).join(" · ") || "—"}
                    {item.path ? ` · ${item.path}` : ""} ·{" "}
                    {formatDateTime(item.createdAt)}
                  </Text>
                  <Button
                    size="micro"
                    tone="critical"
                    variant="plain"
                    loading={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await deleteIdeaAction(item.id);
                        router.refresh();
                      })
                    }
                  >
                    {t("ideas.delete")}
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          ))}
        </BlockStack>
      )}
    </Page>
  );
}
