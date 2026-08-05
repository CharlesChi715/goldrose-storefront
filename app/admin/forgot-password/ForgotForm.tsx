"use client";

/**
 * ROLE OF THIS FILE
 * The forgot-password card on its own page: email in, always the same
 * neutral confirmation out.
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
import { forgotPasswordAction, type ForgotState } from "../login/actions";

const FORGOT_INITIAL: ForgotState = { status: "idle" };

export function ForgotForm() {
  const t = useAdminT();
  const [state, formAction, pending] = useActionState(
    forgotPasswordAction,
    FORGOT_INITIAL,
  );
  const [email, setEmail] = useState("");

  return (
    <Box paddingBlockStart="3200">
      <div style={{ maxWidth: 400, margin: "0 auto", padding: 16 }}>
        <BlockStack gap="400">
          <BlockStack gap="100" inlineAlign="center">
            <Text as="h1" variant="headingLg">
              ELDREVE
            </Text>
            <Text as="p" tone="subdued">
              {t("login.forgot.title")}
            </Text>
          </BlockStack>

          {state.status === "sent" ? (
            <Banner tone="success">{t("login.forgot.done")}</Banner>
          ) : (
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
                  <Button submit variant="primary" loading={pending} fullWidth>
                    {t("login.forgot.submit")}
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
