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
import {
  forgotPasswordAction,
  loginAction,
  requestAccessAction,
  type ForgotState,
  type LoginState,
  type SignUpState,
} from "./actions";

const INITIAL_STATE: LoginState = { error: null };
const SIGNUP_INITIAL: SignUpState = { status: "idle", error: null };
const FORGOT_INITIAL: ForgotState = { status: "idle" };

/** "Forgot password?" — email in, always the same neutral confirmation. */
function ForgotPassword() {
  const t = useAdminT();
  const [state, formAction, pending] = useActionState(forgotPasswordAction, FORGOT_INITIAL);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");

  if (!open) {
    return (
      <Button variant="plain" onClick={() => setOpen(true)}>
        {t("login.forgot.open")}
      </Button>
    );
  }
  if (state.status === "sent") {
    return <Banner tone="success">{t("login.forgot.done")}</Banner>;
  }
  return (
    <Card>
      <form action={formAction}>
        <BlockStack gap="300">
          <Text as="h2" variant="headingSm">
            {t("login.forgot.title")}
          </Text>
          <TextField
            label={t("login.email")}
            type="email"
            name="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
          />
          <Button submit loading={pending} fullWidth>
            {t("login.forgot.submit")}
          </Button>
        </BlockStack>
      </form>
    </Card>
  );
}

/** "Request access" sign-up card (hosted only; owner approves in Team). */
function RequestAccess() {
  const t = useAdminT();
  const [state, formAction, pending] = useActionState(requestAccessAction, SIGNUP_INITIAL);
  const [open, setOpen] = useState(false);
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (!open) {
    return (
      <Button variant="plain" onClick={() => setOpen(true)}>
        {t("login.signup.open")}
      </Button>
    );
  }
  if (state.status === "done") {
    return <Banner tone="success">{t("login.signup.done")}</Banner>;
  }
  return (
    <Card>
      <form action={formAction}>
        <BlockStack gap="300">
          <Text as="h2" variant="headingSm">
            {t("login.signup.title")}
          </Text>
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
          <Button submit loading={pending} fullWidth>
            {t("login.signup.submit")}
          </Button>
        </BlockStack>
      </form>
    </Card>
  );
}

export function LoginForm({
  showDevHint,
  nicknameOnly,
  signupEnabled,
}: {
  showDevHint: boolean;
  nicknameOnly: boolean;
  signupEnabled: boolean;
}) {
  const t = useAdminT();
  const [state, formAction, pending] = useActionState(loginAction, INITIAL_STATE);
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
                <TextField
                  label={t("login.nickname")}
                  type="text"
                  name="nickname"
                  value={nickname}
                  onChange={setNickname}
                  autoComplete="nickname"
                  maxLength={40}
                  helpText={nicknameOnly ? t("login.nickname.help") : t("login.nickname.helpLocked")}
                />
                <Divider />
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

          {signupEnabled ? (
            <BlockStack gap="300" inlineAlign="center">
              <ForgotPassword />
              <RequestAccess />
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
