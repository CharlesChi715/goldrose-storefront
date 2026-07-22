"use server";

/**
 * ROLE OF THIS FILE
 * Server actions for the testing-phase forum (owner request 2026-07-22):
 * start a thread, reply, delete. Author identity is the nickname cookie —
 * no credentials during the open testing phase; still behind requireAdmin
 * like every admin action.
 */

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin, updateAccountNickname } from "@/lib/admin/auth";
import {
  cleanNickname,
  clearForumNickname,
  getForumIdentity,
  setForumNickname,
} from "@/lib/admin/forum";
import { getStore } from "@/lib/supabase/store.ts";

const id = z.string().min(1).max(64);
const titleSchema = z.string().trim().min(1).max(200);
const bodySchema = z.string().trim().min(1).max(5000);

export type ForumFormState = { error: string | null };

async function author(): Promise<string> {
  const nickname = await getForumIdentity();
  if (!nickname) {
    redirect("/admin/login");
  }
  return nickname;
}

export async function createThreadAction(
  _previous: ForumFormState,
  formData: FormData,
): Promise<ForumFormState> {
  await requireAdmin();
  const nickname = await author();

  const title = titleSchema.safeParse(formData.get("title"));
  const body = bodySchema.safeParse(formData.get("body"));
  if (!title.success || !body.success) {
    return { error: "empty" };
  }

  const threadId = randomUUID();
  const now = new Date().toISOString();
  const store = getStore();
  await store.insert("forum_threads", [
    { id: threadId, title: title.data, nickname, created_at: now },
  ]);
  await store.insert("forum_posts", [
    {
      id: randomUUID(),
      thread_id: threadId,
      nickname,
      body: body.data,
      created_at: now,
      edited_at: null,
    },
  ]);
  redirect(`/admin/forum/${threadId}`);
}

export async function replyAction(
  _previous: ForumFormState,
  formData: FormData,
): Promise<ForumFormState> {
  await requireAdmin();
  const nickname = await author();

  const threadId = id.safeParse(formData.get("threadId"));
  const body = bodySchema.safeParse(formData.get("body"));
  if (!threadId.success || !body.success) {
    return { error: "empty" };
  }

  await getStore().insert("forum_posts", [
    {
      id: randomUUID(),
      thread_id: threadId.data,
      nickname,
      body: body.data,
      created_at: new Date().toISOString(),
      edited_at: null,
    },
  ]);
  return { error: null };
}

/**
 * Edit your own post: the author check is nickname-vs-cookie — honest users
 * only, which is all the open testing phase promises. Editing another
 * nickname's post is silently refused.
 */
export async function updatePostAction(postId: string, body: string): Promise<void> {
  await requireAdmin();
  const nickname = await author();
  const parsedId = id.parse(postId);
  const parsedBody = bodySchema.safeParse(body);
  if (!parsedBody.success) {
    return;
  }
  await getStore().update(
    "forum_posts",
    { id: parsedId, nickname },
    { body: parsedBody.data, edited_at: new Date().toISOString() },
  );
}

/**
 * Change your nickname (the popup on /admin/forum). On hosted Supabase this
 * updates the ACCOUNT nickname (user_metadata) — permanent, shows on the
 * Team page too — and drops any old display-name override so the new value
 * is what renders. Local mode has no auth server → cookie fallback.
 */
export async function changeNicknameAction(nickname: string): Promise<void> {
  await requireAdmin();
  const clean = cleanNickname(nickname);
  if (!clean) {
    return;
  }
  if (await updateAccountNickname(clean)) {
    await clearForumNickname();
  } else {
    await setForumNickname(clean);
  }
}

export async function deleteThreadAction(threadId: string): Promise<void> {
  await requireAdmin();
  const parsed = id.parse(threadId);
  const store = getStore();
  await store.remove("forum_posts", { thread_id: parsed });
  await store.remove("forum_threads", { id: parsed });
  // Redirect server-side: a client router.push would race the re-render of
  // this now-deleted (404) thread route and hang the transition.
  redirect("/admin/forum");
}

export async function deletePostAction(postId: string): Promise<void> {
  await requireAdmin();
  await getStore().remove("forum_posts", { id: id.parse(postId) });
}
