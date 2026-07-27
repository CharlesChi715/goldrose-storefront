/**
 * ROLE OF THIS FILE
 * Pushes the customer sign-in email templates to the hosted Supabase project
 * (owner request 2026-07-27: sign-in is a clicked link, with the same mail's
 * 6-digit code as fallback). Run it once to activate, and again whenever the
 * wording changes — the templates live here in the repo, not in the
 * dashboard, so they are reviewable and repeatable.
 *
 *   node scripts/apply-auth-email-templates.mjs
 *
 * Auth: uses SUPABASE_ACCESS_TOKEN if set, else the Supabase CLI's token
 * from the macOS keychain (the CLI must be logged in). Only the two mail
 * templates and their subjects are PATCHed — never site_url (the passkey
 * RP ID depends on it) or any other auth setting.
 */

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const ref = readFileSync(new URL("../supabase/.temp/project-ref", import.meta.url), "utf8").trim();

const token =
  process.env.SUPABASE_ACCESS_TOKEN?.trim() ||
  execSync('security find-generic-password -s "Supabase CLI" -w', { encoding: "utf8" }).trim();

// The emailed link lands on /auth/confirm, which verifies the token_hash
// server-side and redirects signed in. {{ .Token }} is the fallback code the
// sign-in screens accept in place.
const confirmLink = '{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/account';
const codeFallback =
  "<p>Reading this on a different device? Enter this code on the sign-in page instead: <strong>{{ .Token }}</strong></p>\n" +
  "<p>If you didn’t request this email, you can safely ignore it.</p>";

const patch = {
  // Existing customers asking to sign in.
  mailer_subjects_magic_link: "Sign in to GoldRose",
  mailer_templates_magic_link_content:
    "<h2>Sign in to GoldRose</h2>\n\n" +
    "<p>Tap the button below and you’re in — the link works once and expires in about an hour.</p>\n" +
    `<p><a href="${confirmLink}">Sign in to GoldRose</a></p>\n` +
    codeFallback,
  // First-time addresses (signInWithOtp with shouldCreateUser sends the
  // confirmation template instead of the magic-link one).
  mailer_subjects_confirmation: "Welcome to GoldRose — confirm your email",
  mailer_templates_confirmation_content:
    "<h2>Welcome to GoldRose</h2>\n\n" +
    "<p>Tap the button below to confirm your email and sign in — the link works once and expires in about an hour.</p>\n" +
    `<p><a href="${confirmLink}">Confirm and sign in</a></p>\n` +
    codeFallback,
};

const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
  method: "PATCH",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify(patch),
});
if (!response.ok) {
  throw new Error(`PATCH failed: ${response.status} ${await response.text()}`);
}
const config = await response.json();
console.log("Applied. The project now sends:");
console.log(`  magic link   → "${config.mailer_subjects_magic_link}"`);
console.log(`  confirmation → "${config.mailer_subjects_confirmation}"`);
console.log(`  site_url (untouched): ${config.site_url}`);
