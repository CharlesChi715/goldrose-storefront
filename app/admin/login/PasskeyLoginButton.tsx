"use client";

/**
 * ROLE OF THIS FILE
 * "Sign in with a passkey" on /admin/login (owner request 2026-07-23).
 * The WebAuthn ceremony must run in the browser, so this lives outside the
 * server-action form: Supabase's beta signInWithPasskey() sets the session
 * cookie, then a server action re-checks the allowlist before we enter the
 * dashboard (non-admins are signed back out and told they're pending).
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Banner, BlockStack, Button } from "@shopify/polaris";
import {
  supabaseBrowserAuthClient,
  useWebAuthnSupported,
} from "@/lib/supabase/browser-auth";
import { useAdminT } from "../PolarisShell";
import { confirmPasskeyLoginAction } from "./actions";

export function PasskeyLoginButton() {
  const t = useAdminT();
  const router = useRouter();
  const supported = useWebAuthnSupported();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<"failed" | "pending" | null>(null);

  if (!supported) {
    return null;
  }

  async function signIn() {
    const supabase = supabaseBrowserAuthClient();
    if (!supabase) {
      setError("failed");
      return;
    }
    setPending(true);
    setError(null);
    const { data, error: signInError } =
      await supabase.auth.signInWithPasskey();
    if (signInError || !data?.session) {
      setError("failed");
      setPending(false);
      return;
    }
    const result = await confirmPasskeyLoginAction();
    if (!result.ok) {
      setError(result.error === "pending" ? "pending" : "failed");
      setPending(false);
      return;
    }
    // /admin is rendered on demand, so this navigation fetches it fresh with
    // the session cookie the ceremony just set — no full reload needed.
    router.push("/admin");
  }

  return (
    <BlockStack gap="200">
      {error ? (
        <Banner tone={error === "pending" ? "warning" : "critical"}>
          {error === "pending"
            ? t("login.error.pending")
            : t("login.passkey.error")}
        </Banner>
      ) : null}
      <Button fullWidth loading={pending} onClick={signIn}>
        {t("login.passkey")}
      </Button>
    </BlockStack>
  );
}
