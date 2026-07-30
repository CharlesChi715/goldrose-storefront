"use client";

/**
 * ROLE OF THIS FILE
 * Client half of Settings → Team: pending sign-ups first with an Approve
 * button, then approved members with Remove (never yourself).
 */

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  BlockStack,
  Button,
  Card,
  InlineStack,
  Page,
  Text,
} from "@shopify/polaris";
import { formatDateTime } from "@/lib/dates";
import { useAdminT } from "../../../PolarisShell";
import type { TeamMember } from "@/lib/admin/team";
import { approveMemberAction, removeMemberAction } from "./actions";

export function TeamView({
  members,
  selfUserId,
  ownerUserId,
  selfIsOwner,
}: {
  members: TeamMember[];
  selfUserId: string;
  ownerUserId: string | null;
  selfIsOwner: boolean;
}) {
  const t = useAdminT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Page
      title={t("team.title")}
      subtitle={t("team.subtitle")}
      backAction={{ url: "/admin/settings" }}
    >
      <BlockStack gap="300">
        {!selfIsOwner && members.some((member) => member.approved) ? (
          <Text as="p" tone="subdued">
            {t("team.ownerOnly")}
          </Text>
        ) : null}
        {members.length === 0 ? (
          <Card>
            <Text as="p" tone="subdued">
              {t("team.empty")}
            </Text>
          </Card>
        ) : (
          members.map((member) => (
            <Card key={member.userId}>
              <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="050">
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="span" fontWeight="semibold">
                      {member.nickname
                        ? `${member.nickname} · ${member.email}`
                        : member.email}
                    </Text>
                    {member.approved ? (
                      <Badge tone="success">{t("team.approved")}</Badge>
                    ) : (
                      <Badge tone="attention">{t("team.pending")}</Badge>
                    )}
                    {member.userId === ownerUserId ? (
                      <Badge tone="info">{t("team.owner")}</Badge>
                    ) : null}
                    {member.userId === selfUserId ? (
                      <Badge>{t("team.you")}</Badge>
                    ) : null}
                  </InlineStack>
                  {member.createdAt ? (
                    <Text as="span" tone="subdued" variant="bodySm">
                      {t("team.signedUp")}: {formatDateTime(member.createdAt)}
                    </Text>
                  ) : null}
                </BlockStack>
                {member.approved ? (
                  selfIsOwner && member.userId !== selfUserId ? (
                    <Button
                      tone="critical"
                      variant="plain"
                      loading={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await removeMemberAction(member.userId);
                          router.refresh();
                        })
                      }
                    >
                      {t("team.remove")}
                    </Button>
                  ) : null
                ) : (
                  <Button
                    variant="primary"
                    loading={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await approveMemberAction(member.userId, member.email);
                        router.refresh();
                      })
                    }
                  >
                    {t("team.approve")}
                  </Button>
                )}
              </InlineStack>
            </Card>
          ))
        )}
      </BlockStack>
    </Page>
  );
}
