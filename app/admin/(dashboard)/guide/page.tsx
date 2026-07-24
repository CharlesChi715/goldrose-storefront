/**
 * ROLE OF THIS FILE
 * /admin/guide — the tester-facing user guide (owner request 2026-07-22).
 * Content lives in docs/TESTER-GUIDE.md (plain markdown the owner edits);
 * this page reads and renders it. No nickname gate — it's documentation.
 */

import { promises as fs } from "fs";
import path from "path";
import { GuideView } from "./GuideView";

export const dynamic = "force-dynamic";

export default async function GuidePage() {
  let markdown = "";
  try {
    markdown = await fs.readFile(
      path.join(process.cwd(), "docs", "TESTER-GUIDE.md"),
      "utf8",
    );
  } catch {
    // Missing on this deployment — the page still renders with a notice.
  }
  return <GuideView markdown={markdown} />;
}
