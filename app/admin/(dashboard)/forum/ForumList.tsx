"use client";

/**
 * ROLE OF THIS FILE
 * Client half of /admin/forum: "posting as" banner, new-thread form, and
 * the thread list (newest activity first).
 */

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
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
import { useAdminT } from "../../PolarisShell";
import { changeNicknameAction, createThreadAction, type ForumFormState } from "./actions";
import { AttachmentsField, useAttachments } from "./AttachmentsField";

export type ThreadItem = {
  id: string;
  title: string;
  nickname: string;
  createdAt: string;
  replyCount: number;
  lastPostAt: string;
};

const INITIAL_STATE: ForumFormState = { error: null };

function NewThreadForm() {
  const t = useAdminT();
  const [state, formAction, pending] = useActionState(createThreadAction, INITIAL_STATE);

  return (
    <Card>
      <form action={formAction}>
        <BlockStack gap="300">
          <Text as="h2" variant="headingSm">
            {t("forum.newThread.title")}
          </Text>
          {state.error ? (
            <Banner tone="critical">
              {state.error === "files" ? t("forum.error.files") : t("forum.error.empty")}
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

export function ForumList({ items, nickname }: { items: ThreadItem[]; nickname: string }) {
  const t = useAdminT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // "Change nickname" popup (owner request 2026-07-22): in-place modal —
  // routing through the login page bounced already-identified visitors.
  const [nicknameOpen, setNicknameOpen] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState(nickname);

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
            {items.map((item) => (
              <Card key={item.id}>
                <BlockStack gap="100">
                  <Link href={`/admin/forum/${item.id}`} style={{ textDecoration: "none" }}>
                    <Text as="h3" variant="headingSm">
                      {item.title}
                    </Text>
                  </Link>
                  <Text as="span" tone="subdued" variant="bodySm">
                    {item.nickname} · {formatDateTime(item.createdAt)} · {item.replyCount}{" "}
                    {t("forum.replies")}
                  </Text>
                </BlockStack>
              </Card>
            ))}
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
          { content: t("common.cancel"), onAction: () => setNicknameOpen(false) },
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
