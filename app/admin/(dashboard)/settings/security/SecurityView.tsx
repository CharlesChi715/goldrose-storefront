"use client";

/**
 * ROLE OF THIS FILE
 * Client half of Settings → Security: lists the account's passkeys via
 * Supabase's beta browser API and drives the WebAuthn add / rename / remove
 * ceremonies. Local file mode (and browsers without WebAuthn) see an info
 * banner instead — there is no auth server to register against.
 */

import { useEffect, useMemo, useState } from "react";
import {
  Banner,
  BlockStack,
  Button,
  Card,
  InlineStack,
  Page,
  Text,
  TextField,
} from "@shopify/polaris";
import { supabaseBrowserAuthClient, useWebAuthnSupported } from "@/lib/supabase/browser-auth";
import { useAdminT } from "../../../PolarisShell";

type PasskeyItem = {
  id: string;
  friendly_name?: string;
  created_at: string;
  last_used_at?: string;
};

export function SecurityView({ hosted }: { hosted: boolean }) {
  const t = useAdminT();
  const supabase = useMemo(
    () => (hosted ? supabaseBrowserAuthClient() : null),
    [hosted],
  );
  const supported = useWebAuthnSupported();
  const [passkeys, setPasskeys] = useState<PasskeyItem[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  useEffect(() => {
    if (!supabase) {
      return;
    }
    supabase.auth.passkey.list().then(({ data }) => setPasskeys(data ?? []));
  }, [supabase]);

  async function refresh() {
    if (!supabase) {
      return;
    }
    const { data } = await supabase.auth.passkey.list();
    setPasskeys(data ?? []);
  }

  async function add() {
    if (!supabase) {
      return;
    }
    setBusy("add");
    setError(false);
    const { error: registerError } = await supabase.auth.registerPasskey();
    if (registerError) {
      setError(true);
    } else {
      await refresh();
    }
    setBusy(null);
  }

  async function saveRename(passkeyId: string) {
    if (!supabase || !renameDraft.trim()) {
      setRenamingId(null);
      return;
    }
    setBusy(`rename:${passkeyId}`);
    setError(false);
    const { error: updateError } = await supabase.auth.passkey.update({
      passkeyId,
      friendlyName: renameDraft.trim().slice(0, 120),
    });
    if (updateError) {
      setError(true);
    } else {
      await refresh();
    }
    setRenamingId(null);
    setBusy(null);
  }

  async function remove(passkeyId: string) {
    if (!supabase) {
      return;
    }
    setBusy(`remove:${passkeyId}`);
    setError(false);
    const { error: deleteError } = await supabase.auth.passkey.delete({ passkeyId });
    if (deleteError) {
      setError(true);
    } else {
      setPasskeys((current) => current.filter((key) => key.id !== passkeyId));
    }
    setBusy(null);
  }

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString() : null;

  return (
    <Page title={t("security.title")} subtitle={t("security.subtitle")}>
      <BlockStack gap="400">
        {!hosted ? <Banner tone="info">{t("security.hostedOnly")}</Banner> : null}
        {hosted && !supported ? (
          <Banner tone="warning">{t("security.unsupported")}</Banner>
        ) : null}
        {error ? <Banner tone="critical">{t("security.error")}</Banner> : null}

        <Card>
          <BlockStack gap="400">
            <Text as="p" tone="subdued">
              {t("security.intro")}
            </Text>

            {hosted && supported ? (
              <>
                {passkeys.length === 0 ? (
                  <Text as="p">{t("security.empty")}</Text>
                ) : (
                  <BlockStack gap="300">
                    {passkeys.map((key) => (
                      <InlineStack
                        key={key.id}
                        align="space-between"
                        blockAlign="center"
                        gap="400"
                        wrap
                      >
                        {renamingId === key.id ? (
                          <InlineStack gap="200" blockAlign="end">
                            <TextField
                              label={t("security.renameLabel")}
                              labelHidden
                              value={renameDraft}
                              onChange={setRenameDraft}
                              autoComplete="off"
                              maxLength={120}
                            />
                            <Button
                              loading={busy === `rename:${key.id}`}
                              onClick={() => saveRename(key.id)}
                            >
                              {t("common.save")}
                            </Button>
                            <Button variant="plain" onClick={() => setRenamingId(null)}>
                              {t("common.cancel")}
                            </Button>
                          </InlineStack>
                        ) : (
                          <BlockStack gap="050">
                            <Text as="p" fontWeight="semibold">
                              {key.friendly_name || t("security.unnamed")}
                            </Text>
                            <Text as="p" tone="subdued" variant="bodySm">
                              {t("security.added")} {formatDate(key.created_at)}
                              {key.last_used_at
                                ? ` · ${t("security.lastUsed")} ${formatDate(key.last_used_at)}`
                                : ""}
                            </Text>
                          </BlockStack>
                        )}
                        {renamingId === key.id ? null : (
                          <InlineStack gap="200">
                            <Button
                              variant="plain"
                              onClick={() => {
                                setRenamingId(key.id);
                                setRenameDraft(key.friendly_name ?? "");
                              }}
                            >
                              {t("security.rename")}
                            </Button>
                            <Button
                              variant="plain"
                              tone="critical"
                              loading={busy === `remove:${key.id}`}
                              onClick={() => remove(key.id)}
                            >
                              {t("security.remove")}
                            </Button>
                          </InlineStack>
                        )}
                      </InlineStack>
                    ))}
                  </BlockStack>
                )}
                <InlineStack>
                  <Button variant="primary" loading={busy === "add"} onClick={add}>
                    {busy === "add" ? t("security.addBusy") : t("security.add")}
                  </Button>
                </InlineStack>
              </>
            ) : null}
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
