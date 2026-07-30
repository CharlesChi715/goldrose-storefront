"use client";

/**
 * ROLE OF THIS FILE
 * Client half of /admin/forum: "posting as" banner, new-thread form, and
 * the thread list (newest activity first).
 */

import { useActionState, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Badge,
  BlockStack,
  Banner,
  Button,
  Card,
  InlineStack,
  Modal,
  Page,
  Text,
  TextField,
} from "@shopify/polaris";
import { formatDateTime } from "@/lib/dates";
import { interpolate } from "@/lib/admin/i18n";
import {
  FORUM_READ_EVENT,
  getReadMarks,
  unreadInThread,
  type ForumPostStamp,
  type ReadMarks,
} from "@/lib/forum-unread";
import { useAdminT } from "../../PolarisShell";
import {
  changeNicknameAction,
  createThreadAction,
  type ForumFormState,
} from "./actions";
import { AttachmentsField, useAttachments } from "./AttachmentsField";

export type ThreadItem = {
  id: string;
  title: string;
  nickname: string;
  createdAt: string;
  replyCount: number;
  lastPostAt: string;
  posts: ForumPostStamp[];
};

const INITIAL_STATE: ForumFormState = { error: null };

function NewThreadForm() {
  const t = useAdminT();
  const [state, formAction, pending] = useActionState(
    createThreadAction,
    INITIAL_STATE,
  );

  return (
    <Card>
      <form action={formAction}>
        <BlockStack gap="300">
          <Text as="h2" variant="headingSm">
            {t("forum.newThread.title")}
          </Text>
          {state.error ? (
            <Banner tone="critical">
              {state.error === "files"
                ? t("forum.error.files")
                : t("forum.error.empty")}
            </Banner>
          ) : null}
          <NewThreadFields pending={pending} />
        </BlockStack>
      </form>
    </Card>
  );
}

/* Polaris TextField is controlled; keep field state local to this child so
   the useActionState re-render doesn't clear what's being typed. */
function NewThreadFields({ pending }: { pending: boolean }) {
  const t = useAdminT();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const attachments = useAttachments();
  return (
    <>
      <TextField
        label={t("forum.newThread.titleField")}
        name="title"
        value={title}
        onChange={setTitle}
        autoComplete="off"
        maxLength={200}
      />
      {/* Pasting a screenshot while typing attaches it (bubbles up here). */}
      <div onPaste={attachments.onPaste}>
        <TextField
          label={t("forum.newThread.messageField")}
          name="body"
          value={body}
          onChange={setBody}
          autoComplete="off"
          multiline={3}
          maxLength={5000}
        />
      </div>
      <AttachmentsField attachments={attachments} />
      <InlineStack align="end">
        <Button submit variant="primary" loading={pending}>
          {t("forum.newThread.submit")}
        </Button>
      </InlineStack>
    </>
  );
}

export function ForumList({
  items,
  nickname,
}: {
  items: ThreadItem[];
  nickname: string;
}) {
  const t = useAdminT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // "Change nickname" popup (owner request 2026-07-22): in-place modal —
  // routing through the login page bounced already-identified visitors.
  const [nicknameOpen, setNicknameOpen] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState(nickname);

  // Unread badges (owner request 2026-07-23): read marks are localStorage,
  // so load them after mount (null = not loaded yet, render no badges).
  const [readMarks, setReadMarks] = useState<ReadMarks | null>(null);
  useEffect(() => {
    const load = () => setReadMarks(getReadMarks());
    load();
    window.addEventListener(FORUM_READ_EVENT, load);
    return () => window.removeEventListener(FORUM_READ_EVENT, load);
  }, []);

  const saveNickname = () =>
    startTransition(async () => {
      await changeNicknameAction(nicknameDraft);
      setNicknameOpen(false);
      router.refresh();
    });

  return (
    <Page
      title={t("nav.forum")}
      subtitle={`${t("forum.postingAs")}: ${nickname}`}
      secondaryActions={[
        {
          content: t("forum.changeNickname"),
          onAction: () => {
            setNicknameDraft(nickname);
            setNicknameOpen(true);
          },
        },
      ]}
    >
      <BlockStack gap="400">
        <NewThreadForm />
        {items.length === 0 ? (
          <Card>
            <Text as="p" tone="subdued">
              {t("forum.empty")}
            </Text>
          </Card>
        ) : (
          <BlockStack gap="300">
            {items.map((item) => {
              const unread = readMarks
                ? unreadInThread(item.posts, readMarks[item.id], nickname)
                : 0;
              return (
                <Card key={item.id}>
                  <BlockStack gap="100">
                    <Link
                      href={`/admin/forum/${item.id}`}
                      style={{ textDecoration: "none" }}
                    >
                      <InlineStack gap="200" blockAlign="center">
                        <Text as="h3" variant="headingSm">
                          {item.title}
                        </Text>
                        {unread > 0 ? (
                          <Badge tone="new">
                            {interpolate(t("forum.newCount"), {
                              count: unread,
                            })}
                          </Badge>
                        ) : null}
                      </InlineStack>
                    </Link>
                    <Text as="span" tone="subdued" variant="bodySm">
                      {item.nickname} · {formatDateTime(item.createdAt)} ·{" "}
                      {item.replyCount} {t("forum.replies")}
                    </Text>
                  </BlockStack>
                </Card>
              );
            })}
          </BlockStack>
        )}
      </BlockStack>

      <Modal
        open={nicknameOpen}
        onClose={() => setNicknameOpen(false)}
        title={t("forum.changeNickname")}
        primaryAction={{
          content: t("common.save"),
          loading: pending,
          disabled: !nicknameDraft.trim(),
          onAction: saveNickname,
        }}
        secondaryActions={[
          {
            content: t("common.cancel"),
            onAction: () => setNicknameOpen(false),
          },
        ]}
      >
        <Modal.Section>
          <TextField
            label={t("login.nickname")}
            value={nicknameDraft}
            onChange={setNicknameDraft}
            autoComplete="nickname"
            maxLength={40}
            autoFocus
          />
        </Modal.Section>
      </Modal>
    </Page>
  );
}
