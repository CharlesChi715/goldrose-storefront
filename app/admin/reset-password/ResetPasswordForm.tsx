"use client";

/**
 * ROLE OF THIS FILE
 * The set-a-new-password card. The @supabase/ssr browser client detects the
 * recovery code in the URL and exchanges it for a temporary session; until
 * that succeeds the form stays disabled, and if it never does (expired
 * link, different browser than the email was requested in) we say so.
 */

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Text,
  TextField,
} from "@shopify/polaris";
import { useAdminT } from "../PolarisShell";

type Phase = "checking" | "ready" | "expired" | "done";

export function ResetPasswordForm() {
  const t = useAdminT();
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
    return url && anonKey ? createBrowserClient(url, anonKey) : null;
  }, []);

  // No Supabase env (local file mode) → recovery links can't exist.
  const [phase, setPhase] = useState<Phase>(supabase ? "checking" : "expired");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!supabase) {
      return;
    }
    let cancelled = false;

    // Recovery links can arrive three ways depending on how the email was
    // generated: tokens in the hash (#access_token=…, implicit flow — ours,
    // since the server requests the email), a ?code= param (PKCE), or an
    // explicit error (#error_description=… when the link truly expired).
    // Handle all three instead of trusting auto-detection.
    async function establishSession() {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const query = new URLSearchParams(window.location.search);

      if (hash.get("error_description") || query.get("error_description")) {
        return false;
      }
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error } = await supabase!.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        return !error;
      }
      const code = query.get("code");
      if (code) {
        const { error } = await supabase!.auth.exchangeCodeForSession(code);
        return !error;
      }
      // Nothing in the URL — maybe auto-detection already stored a session.
      const {
        data: { session },
      } = await supabase!.auth.getSession();
      return Boolean(session);
    }

    establishSession().then((ok) => {
      if (!cancelled) {
        setPhase(ok ? "ready" : "expired");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function save() {
    if (!supabase) {
      return;
    }
    setError(null);
    if (password.length < 8) {
      setError(t("reset.error.short"));
      return;
    }
    if (password !== confirm) {
      setError(t("reset.error.mismatch"));
      return;
    }
    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setSaving(false);
      setError(updateError.message);
      return;
    }
    // Leave no half-logged-in state behind; they log in fresh.
    await supabase.auth.signOut();
    setSaving(false);
    setPhase("done");
  }

  return (
    <Box paddingBlockStart="3200">
      <div style={{ maxWidth: 400, margin: "0 auto", padding: 16 }}>
        <BlockStack gap="400">
          <BlockStack gap="100" inlineAlign="center">
            <Text as="h1" variant="headingLg">
              ELDREVE
            </Text>
            <Text as="p" tone="subdued">
              {t("reset.title")}
            </Text>
          </BlockStack>

          {phase === "checking" ? (
            <Card>
              <Text as="p" tone="subdued">
                {t("reset.checking")}
              </Text>
            </Card>
          ) : null}

          {phase === "expired" ? (
            <Banner tone="critical">{t("reset.error.expired")}</Banner>
          ) : null}

          {phase === "done" ? (
            <Banner tone="success">{t("reset.done")}</Banner>
          ) : null}

          {phase === "ready" ? (
            <Card>
              <BlockStack gap="400">
                {error ? <Banner tone="critical">{error}</Banner> : null}
                <TextField
                  label={t("reset.password")}
                  type="password"
                  value={password}
                  onChange={setPassword}
                  autoComplete="new-password"
                  helpText={t("login.signup.passwordHelp")}
                />
                <TextField
                  label={t("reset.confirm")}
                  type="password"
                  value={confirm}
                  onChange={setConfirm}
                  autoComplete="new-password"
                />
                <Button
                  variant="primary"
                  fullWidth
                  loading={saving}
                  onClick={save}
                >
                  {t("reset.submit")}
                </Button>
              </BlockStack>
            </Card>
          ) : null}

          {phase !== "checking" ? (
            <Text as="p" alignment="center">
              <a href="/admin/login">{t("reset.backToLogin")}</a>
            </Text>
          ) : null}
        </BlockStack>
      </div>
    </Box>
  );
}
