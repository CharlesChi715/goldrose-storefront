"use client";

/**
 * ROLE OF THIS FILE
 * The Request-access card (nickname + email + password → awaits owner
 * approval), on its own page since the login screen stays minimal.
 */

import { useActionState, useState } from "react";
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
import { requestAccessAction, type SignUpState } from "../login/actions";

const SIGNUP_INITIAL: SignUpState = { status: "idle", error: null };

export function SignupForm() {
  const t = useAdminT();
  const [state, formAction, pending] = useActionState(
    requestAccessAction,
    SIGNUP_INITIAL,
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
              {t("login.signup.title")}
            </Text>
          </BlockStack>

          {state.status === "done" ? (
            <Banner tone="success">{t("login.signup.done")}</Banner>
          ) : (
            <Card>
              <form action={formAction}>
                <BlockStack gap="400">
                  {state.error ? (
                    <Banner tone="critical">
                      {state.error === "exists"
                        ? t("login.signup.error.exists")
                        : state.error === "nickname"
                          ? t("login.signup.error.nickname")
                          : t("login.signup.error.invalid")}
                    </Banner>
                  ) : null}
                  <TextField
                    label={t("login.nickname")}
                    type="text"
                    name="nickname"
                    value={nickname}
                    onChange={setNickname}
                    autoComplete="nickname"
                    maxLength={40}
                    requiredIndicator
                    helpText={t("login.signup.nicknameHelp")}
                  />
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
                    autoComplete="new-password"
                    helpText={t("login.signup.passwordHelp")}
                  />
                  <Button submit variant="primary" loading={pending} fullWidth>
                    {t("login.signup.submit")}
                  </Button>
                </BlockStack>
              </form>
            </Card>
          )}

          <Text as="p" alignment="center">
            <a href="/admin/login">{t("reset.backToLogin")}</a>
          </Text>
        </BlockStack>
      </div>
    </Box>
  );
}
