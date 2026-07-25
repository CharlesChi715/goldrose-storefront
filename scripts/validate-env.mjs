/**
 * Validate the Supabase environment before a production build starts.
 *
 * GoldRose deliberately supports a no-Supabase local/test mode, so all three
 * variables may be absent outside Vercel production. A partial configuration
 * is always an error, and Vercel production requires the complete set.
 */

import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

// Standalone Node scripts do not automatically load Next.js .env files.
// Use Next's own loader so local `npm run build` sees the same values as
// `next build`; Vercel already injects its selected environment variables.
loadEnvConfig(process.cwd());

const requiredSupabaseEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  SUPABASE_SERVICE_ROLE_KEY:
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
};

const entries = Object.entries(requiredSupabaseEnv);
const present = entries
  .filter(([, value]) => Boolean(value))
  .map(([name]) => name);
const missing = entries
  .filter(([, value]) => !value)
  .map(([name]) => name);

const partiallyConfigured = present.length > 0 && missing.length > 0;
const vercelTarget =
  process.env.VERCEL_TARGET_ENV ?? process.env.VERCEL_ENV;
const productionVercel = vercelTarget === "production";

if (partiallyConfigured || (productionVercel && missing.length > 0)) {
  console.error(
    `[env] Missing required Supabase variable(s): ${missing.join(", ")}`,
  );
  console.error(
    `[env] Configured variable name(s): ${present.join(", ") || "none"}`,
  );
  process.exit(1);
}

console.log(
  missing.length === 0
    ? "[env] Hosted Supabase configuration is complete."
    : "[env] Supabase is unconfigured; local file mode will be used.",
);
