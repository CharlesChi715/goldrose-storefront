"use client";

/**
 * ROLE OF THIS FILE
 * The Polaris login card. Uses useActionState around the login server
 * action; the error message stays deliberately vague (§9.2).
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
import { loginAction, type LoginState } from "./actions";

const INITIAL_STATE: LoginState = { error: null };

export function LoginForm({ showDevHint }: { showDevHint: boolean }) {
  const t = useAdminT();
  const [state, formAction, pending] = useActionState(loginAction, INITIAL_STATE);
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
            <Banner tone="critical">{t("login.error.invalid")}</Banner>
          ) : null}

          <Card>
            <form action={formAction}>
              <BlockStack gap="400">
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
          </Card>

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
