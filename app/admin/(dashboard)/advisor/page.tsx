/**
 * ROLE OF THIS FILE
 * /admin/advisor — the business advisor chat page.
 *
 * Design lives in docs/advisor/BLUEPRINT-agent-advisor.md, not in
 * docs/admin-design.md: the advisor is new surface the spec does not cover,
 * so there is no § to cite yet.
 *
 * Chat only. The page reads and answers; it never writes to the app, the
 * database or the repo. Conversation history lives in browser React state
 * and is lost on refresh — nothing is persisted, by design.
 *
 * This file is the server shell. All behaviour is in AdvisorView (client),
 * which POSTs the whole history to /api/advisor on every turn.
 */

import { AdvisorView } from "./AdvisorView";

export default function AdvisorPage() {
  return <AdvisorView />;
}
