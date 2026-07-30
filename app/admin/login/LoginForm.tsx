"use client";

/**
 * ROLE OF THIS FILE
 * The Polaris login card. Uses useActionState around the login server
 * action; the error message stays deliberately vague (§9.2). During the
 * testing phase a nickname field on top lets anyone join the forum with no
 * credentials (owner request 2026-07-22) — email + password stay as-is.
 */

import { useActionState, useState } from "react";
import {
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Divider,
  Text,
  TextField,
} from "@shopify/polaris";
import { useAdminT } from "../PolarisShell";
import { loginAction, type LoginState } from "./actions";
import { PasskeyLoginButton } from "./PasskeyLoginButton";

const INITIAL_STATE: LoginState = { error: null };

export function LoginForm({
  showDevHint,
  nicknameOnly,
  signupEnabled,
  passkeyEnabled,
}: {
  showDevHint: boolean;
  nicknameOnly: boolean;
  signupEnabled: boolean;
  /** Hosted Supabase only — passkeys need a real auth server. */
  passkeyEnabled: boolean;
}) {
  const t = useAdminT();
  const [state, formAction, pending] = useActionState(
    loginAction,
    INITIAL_STATE,
  );
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <Box paddingBlockStart="3200">
      <div style={{ maxWidth: 400, margin: "0 auto", padding: 16 }}>
        <BlockStack gap="400">
          <BlockStack gap="100" inlineAlign="center">
            <Text as="h1" variant="headingLg">
              GoldRose
            </Text>
            <Text as="p" tone="subdued">
              {t("login.subtitle")}
            </Text>
          </BlockStack>

          {state.error ? (
            <Banner tone={state.error === "pending" ? "warning" : "critical"}>
              {state.error === "nickname"
                ? t("login.error.nickname")
                : state.error === "pending"
                  ? t("login.error.pending")
                  : t("login.error.invalid")}
            </Banner>
          ) : null}

          <Card>
            <form action={formAction}>
              <BlockStack gap="400">
                {/* Nickname entry exists ONLY in open-access mode (the
                    dormant testing escape hatch). With real auth, the
                    nickname is bound to the account at sign-up (owner
                    request 2026-07-22) — nothing to retype here. */}
                {nicknameOnly ? (
                  <>
                    <TextField
                      label={t("login.nickname")}
                      type="text"
                      name="nickname"
                      value={nickname}
                      onChange={setNickname}
                      autoComplete="nickname"
                      maxLength={40}
                      helpText={t("login.nickname.help")}
                    />
                    <Divider />
                  </>
                ) : null}
                <TextField
                  label={t("login.email")}
                  type="email"
                  name="email"
                  value={email}
                  onChange={setEmail}
                  autoComplete="email"
                />
                <TextField
                  label={t("login.password")}
                  type="password"
                  name="password"
                  value={password}
                  onChange={setPassword}
                  autoComplete="current-password"
                />
                <Button submit variant="primary" loading={pending} fullWidth>
                  {t("login.submit")}
                </Button>
              </BlockStack>
            </form>
            {passkeyEnabled ? (
              <Box paddingBlockStart="400">
                <BlockStack gap="400">
                  <Divider />
                  <PasskeyLoginButton />
                </BlockStack>
              </Box>
            ) : null}
          </Card>

          {signupEnabled ? (
            // Sign-up and recovery live on their own pages (owner request:
            // keep the login screen clean) — plain links only.
            <BlockStack gap="200" inlineAlign="center">
              <a href="/admin/forgot-password">{t("login.forgot.open")}</a>
              <a href="/admin/signup">{t("login.signup.open")}</a>
            </BlockStack>
          ) : null}

          {showDevHint ? (
            <Text as="p" tone="subdued" variant="bodySm" alignment="center">
              {t("login.devHint")}
            </Text>
          ) : null}
        </BlockStack>
      </div>
    </Box>
  );
}
