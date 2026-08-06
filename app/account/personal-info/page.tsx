/**
 * ROLE OF THIS FILE
 * /account/personal-info — Figma mepage-Account & Privacy-Personal
 * Information (1523:954), imported 2026-07-28, restyled 07-29.
 *
 * LIVE since 2026-08-06: the screen no longer renders "Olivia Carter". It
 * shows the signed-in customer's real name, email and language, and saves
 * changes through `lib/account/profile.ts`.
 *
 * A Server Component, unlike /account's client shell: this page runs no OAuth
 * or WebAuthn ceremony, so reading the session server-side and redirecting
 * here removes both the loading flash and the client-side session dance.
 * Signed out — which in the local file mode is always, there being no auth
 * server — it goes to /account/signup, the one login page (AI-020).
 */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PersonalInfoScreen } from "@/components/screens/PersonalInfoScreen";
import { getPersonalInfo } from "@/lib/account/profile.ts";
import { savePersonalInfoAction } from "./actions";

export const metadata: Metadata = {
  title: "Personal information — ELDREVE",
  robots: { index: false },
};

/** Somebody's name and email address: never prerendered, never cached. */
export const dynamic = "force-dynamic";

export default async function PersonalInfoPage() {
  const info = await getPersonalInfo();
  if (!info) {
    redirect("/account/signup");
  }
  return <PersonalInfoScreen initial={info} onSave={savePersonalInfoAction} />;
}
