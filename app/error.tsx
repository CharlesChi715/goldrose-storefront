"use client";

/**
 * ROLE OF THIS FILE
 * The screen a visitor sees when a page throws while rendering. Next.js
 * requires this to be a client component, and gives it `reset()` to re-render
 * the segment — worth offering, because a good share of these are a failed
 * data read that succeeds on the second attempt.
 *
 * WHAT IT DOES NOT SHOW
 * `error.message`. On a production build Next replaces it with a generic
 * string anyway, but the habit matters more than this instance: an error
 * message is written for us and can carry a table name, a column, or a
 * fragment of a query, and a shopper is the wrong audience for any of it. The
 * digest is shown instead, which is the id that ties this screen to the
 * server log line without saying anything about our internals.
 */

import { useEffect } from "react";
import { ErrorScreen } from "@/components/ErrorScreen";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Next has already logged this server-side; this is the browser's half,
    // and it is what makes a render failure visible in the same place as
    // everything else lib/observe.ts records.
    console.error(
      JSON.stringify({
        level: "error",
        event: "page.render.failed",
        digest: error.digest ?? null,
      }),
    );
  }, [error]);

  return (
    <ErrorScreen
      title="Something went wrong at our end"
      message={
        error.digest
          ? `Please try again in a moment. If it keeps happening, quoting reference ${error.digest} will help us find it.`
          : "Please try again in a moment. Nothing you were doing has been lost."
      }
      action={
        <button
          type="button"
          onClick={reset}
          style={{
            padding: "12px 26px",
            border: "1px solid #231f20",
            background: "#231f20",
            color: "#fffaf6",
            fontSize: 13,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      }
    />
  );
}
