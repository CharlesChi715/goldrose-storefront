"use client";

/**
 * ROLE OF THIS FILE
 * The advisor chat UI (design: docs/advisor/BLUEPRINT-agent-advisor.md).
 *
 * Holds the whole conversation in React state and re-sends it to
 * /api/advisor on every turn — the Anthropic API is stateless, so "session"
 * is our concept, not theirs. Nothing is persisted: a refresh starts over.
 *
 * The answer is read as a stream so text appears token-by-token; a route
 * that replies without streaming still works, arriving as a single chunk.
 *
 * WIRE CONTRACT with /api/advisor
 * - success: a non-2xx-free response whose body streams the answer as plain
 *   text, in the same language as the user's last message.
 * - failure: a non-2xx status with JSON `{ error: <kind> }`, where kind is a
 *   key of ERROR_KINDS below. The route never sends prose — Anthropic's own
 *   error text is English and technical, and every admin string must go
 *   through t() in both languages (§9.12). So it reports a kind and this file
 *   chooses the sentence.
 *
 * Message bubbles follow the forum's ThreadView pattern (pre-wrap body +
 * subdued byline) so the two chat-like admin surfaces read the same.
 */

import {
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  InlineStack,
  Page,
  Spinner,
  Text,
  TextField,
} from "@shopify/polaris";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAdminT } from "../../PolarisShell";

/** One turn, in the shape /api/advisor expects on the wire. */
type Message = { role: "user" | "assistant"; content: string };

type Translate = ReturnType<typeof useAdminT>;

/**
 * Failure kinds the route may report, each with its own remedy. Keyed by the
 * wire value so an unrecognised kind can be detected with `in`.
 */
const ERROR_KINDS = {
  noKey: "advisor.error.noKey",
  badKey: "advisor.error.badKey",
  billing: "advisor.error.billing",
  rateLimit: "advisor.error.rateLimit",
  busy: "advisor.error.busy",
} as const;

type ErrorKind = keyof typeof ERROR_KINDS;
type Failure = ErrorKind | "unknown";

/**
 * The only failures the admin fixes by saving a key. Billing, rate limits and
 * Anthropic outages must NOT point at the key field — the key is fine, and
 * sending someone to re-enter a working key wastes their time.
 */
const FIXED_BY_SAVING_A_KEY = new Set<Failure>(["noKey", "badKey"]);

/** Read the failure kind the route reported; "unknown" if the body isn't ours. */
async function readFailure(res: Response): Promise<Failure> {
  try {
    const body: unknown = await res.json();
    const kind = (body as { error?: unknown } | null)?.error;
    if (typeof kind === "string" && kind in ERROR_KINDS) {
      return kind as ErrorKind;
    }
  } catch {
    // Not our JSON shape (a proxy error page, an empty body) — fall through.
  }
  return "unknown";
}

/** One message: the boss's question tinted, the advisor's answer plain. */
function Bubble({ message, t }: { message: Message; t: Translate }) {
  const asked = message.role === "user";
  return (
    <Box
      background={asked ? "bg-surface-secondary" : "bg-surface"}
      borderRadius="200"
      padding="300"
    >
      <BlockStack gap="100">
        <div style={{ whiteSpace: "pre-wrap" }}>
          <Text as="p">{message.content}</Text>
        </div>
        <Text as="span" tone="subdued" variant="bodySm">
          {asked ? t("advisor.you") : t("advisor.name")}
        </Text>
      </BlockStack>
    </Box>
  );
}

export function AdvisorView() {
  const t = useAdminT();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  // Keep the newest turn in view while the answer streams in.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, busy]);

  const send = useCallback(async () => {
    const question = draft.trim();
    if (!question || busy) return;

    // Show the question immediately, plus an empty answer to stream into.
    const history: Message[] = [
      ...messages,
      { role: "user", content: question },
    ];
    setMessages([...history, { role: "assistant", content: "" }]);
    setDraft("");
    setFailure(null);
    setBusy(true);

    let failed: Failure | null = null;
    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok) {
        failed = await readFailure(res);
      } else if (!res.body) {
        failed = "unknown";
      } else {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let answer = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          answer += decoder.decode(value, { stream: true });
          setMessages([...history, { role: "assistant", content: answer }]);
        }
        if (!answer.trim()) failed = "unknown";
      }
    } catch {
      // Network failure, or the stream broke mid-answer.
      failed = "unknown";
    } finally {
      setBusy(false);
    }

    if (failed) {
      // Drop the placeholder answer so the transcript never shows a blank turn.
      setMessages(history);
      setFailure(failed);
    }
  }, [busy, draft, messages]);

  return (
    <Page title={t("advisor.title")} subtitle={t("advisor.subtitle")}>
      <BlockStack gap="400">
        {failure ? (
          <Banner
            tone="critical"
            onDismiss={() => setFailure(null)}
            action={
              FIXED_BY_SAVING_A_KEY.has(failure)
                ? { content: t("advisor.error.action"), url: "/admin/settings" }
                : undefined
            }
          >
            <p>
              {t(
                failure === "unknown"
                  ? "advisor.error.unknown"
                  : ERROR_KINDS[failure],
              )}
            </p>
          </Banner>
        ) : null}

        <Card>
          <BlockStack gap="300">
            {messages.length === 0 ? (
              <Box paddingBlock="800">
                <BlockStack gap="100" inlineAlign="center">
                  <Text as="p" tone="subdued">
                    {t("advisor.empty")}
                  </Text>
                </BlockStack>
              </Box>
            ) : (
              messages.map((message, i) => (
                <Bubble key={i} message={message} t={t} />
              ))
            )}
            {busy ? (
              <InlineStack gap="200" blockAlign="center">
                <Spinner
                  size="small"
                  accessibilityLabel={t("advisor.thinking")}
                />
                <Text as="span" tone="subdued">
                  {t("advisor.thinking")}
                </Text>
              </InlineStack>
            ) : null}
            <div ref={endRef} />
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <TextField
              label={t("advisor.composer")}
              value={draft}
              onChange={setDraft}
              multiline={3}
              autoComplete="off"
              placeholder={t("advisor.placeholder")}
              disabled={busy}
            />
            <InlineStack gap="200" align="end">
              {messages.length > 0 ? (
                <Button
                  disabled={busy}
                  onClick={() => {
                    setMessages([]);
                    setFailure(null);
                  }}
                >
                  {t("advisor.clear")}
                </Button>
              ) : null}
              <Button
                variant="primary"
                loading={busy}
                disabled={!draft.trim()}
                onClick={send}
              >
                {t("advisor.send")}
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
