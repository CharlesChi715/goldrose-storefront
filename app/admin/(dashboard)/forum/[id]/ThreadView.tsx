"use client";

/**
 * ROLE OF THIS FILE
 * Client half of a forum thread: posts oldest-first, per-post delete, a
 * reply box, and delete-thread in the page menu.
 */

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Banner,
  BlockStack,
  Button,
  Card,
  InlineStack,
  Page,
  Text,
  TextField,
} from "@shopify/polaris";
import { formatDateTime } from "@/lib/dates";
import { useAdminT } from "../../../PolarisShell";
import {
  deletePostAction,
  deleteThreadAction,
  replyAction,
  updatePostAction,
  type ForumFormState,
} from "../actions";

export type PostItem = {
  id: string;
  nickname: string;
  body: string;
  createdAt: string;
  editedAt: string | null;
};

const INITIAL_STATE: ForumFormState = { error: null };

function ReplyForm({ threadId }: { threadId: string }) {
  const t = useAdminT();
  const router = useRouter();
  const [state, formAction, pending] = useActionState(replyAction, INITIAL_STATE);
  const [body, setBody] = useState("");
  const submitted = useRef(false);

  // After a successful reply, clear the box and pull in the new post.
  useEffect(() => {
    if (!pending && submitted.current && !state.error) {
      submitted.current = false;
      setBody("");
      router.refresh();
    }
  }, [pending, state, router]);

  return (
    <Card>
      <form action={formAction} onSubmit={() => (submitted.current = true)}>
        <BlockStack gap="300">
          {state.error ? (
            <Banner tone="critical">{t("forum.error.emptyReply")}</Banner>
          ) : null}
          <input type="hidden" name="threadId" value={threadId} />
          <TextField
            label={t("forum.reply.label")}
            name="body"
            value={body}
            onChange={setBody}
            autoComplete="off"
            multiline={3}
            maxLength={5000}
          />
          <InlineStack align="end">
            <Button submit variant="primary" loading={pending}>
              {t("forum.reply.submit")}
            </Button>
          </InlineStack>
        </BlockStack>
      </form>
    </Card>
  );
}

export function ThreadView({
  threadId,
  title,
  posts,
  nickname,
}: {
  threadId: string;
  title: string;
  posts: PostItem[];
  nickname: string;
}) {
  const t = useAdminT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // Inline edit: which post is being edited, and its draft text.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  return (
    <Page
      title={title}
      subtitle={`${t("forum.postingAs")}: ${nickname}`}
      backAction={{ url: "/admin/forum" }}
      secondaryActions={[
        {
          content: t("forum.deleteThread"),
          destructive: true,
          onAction: () =>
            startTransition(async () => {
              // The action redirects to /admin/forum itself.
              await deleteThreadAction(threadId);
            }),
        },
      ]}
    >
      <BlockStack gap="400">
        <BlockStack gap="300">
          {posts.map((post) => (
            <Card key={post.id}>
              <BlockStack gap="200">
                {editingId === post.id ? (
                  <BlockStack gap="200">
                    <TextField
                      label={t("forum.edit")}
                      labelHidden
                      value={draft}
                      onChange={setDraft}
                      autoComplete="off"
                      multiline={3}
                      maxLength={5000}
                    />
                    <InlineStack align="end" gap="200">
                      <Button onClick={() => setEditingId(null)} disabled={pending}>
                        {t("common.cancel")}
                      </Button>
                      <Button
                        variant="primary"
                        loading={pending}
                        onClick={() =>
                          startTransition(async () => {
                            await updatePostAction(post.id, draft);
                            setEditingId(null);
                            router.refresh();
                          })
                        }
                      >
                        {t("common.save")}
                      </Button>
                    </InlineStack>
                  </BlockStack>
                ) : (
                  <div style={{ whiteSpace: "pre-wrap" }}>
                    <Text as="p">{post.body}</Text>
                  </div>
                )}
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="span" tone="subdued" variant="bodySm">
                    {post.nickname} · {formatDateTime(post.createdAt)}
                    {post.editedAt ? ` · ${t("forum.edited")}` : ""}
                  </Text>
                  <InlineStack gap="200">
                    {post.nickname === nickname && editingId !== post.id ? (
                      <Button
                        size="micro"
                        variant="plain"
                        onClick={() => {
                          setEditingId(post.id);
                          setDraft(post.body);
                        }}
                      >
                        {t("forum.edit")}
                      </Button>
                    ) : null}
                    <Button
                      size="micro"
                      tone="critical"
                      variant="plain"
                      loading={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await deletePostAction(post.id);
                          router.refresh();
                        })
                      }
                    >
                      {t("forum.delete")}
                    </Button>
                  </InlineStack>
                </InlineStack>
              </BlockStack>
            </Card>
          ))}
        </BlockStack>
        <ReplyForm threadId={threadId} />
      </BlockStack>
    </Page>
  );
}
