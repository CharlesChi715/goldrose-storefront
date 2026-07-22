/**
 * ROLE OF THIS FILE
 * /admin/reset-password — where the Supabase recovery email lands (owner
 * request 2026-07-22). Unauthenticated by design (the proxy lets it
 * through): the browser client exchanges the recovery code in the URL for
 * a temporary session, then the form sets the new password.
 */

import { ResetPasswordForm } from "./ResetPasswordForm";

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
