/**
 * ROLE OF THIS FILE
 * /admin/forum/[id] — one forum thread: all posts oldest-first plus the
 * reply box. Nickname required, same as the forum index.
 */

import { notFound, redirect } from "next/navigation";
import { getForumNickname } from "@/lib/admin/forum";
import { getStore } from "@/lib/supabase/store.ts";
import { ThreadView, type PostItem } from "./ThreadView";

export const dynamic = "force-dynamic";

export default async function ForumThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const nickname = await getForumNickname();
  if (!nickname) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const store = getStore();
  const [threads, posts] = await Promise.all([
    store.all("forum_threads"),
    store.all("forum_posts"),
  ]);
  const thread = threads.find((row) => row.id === id);
  if (!thread) {
    notFound();
  }

  const items: PostItem[] = posts
    .filter((post) => post.thread_id === thread.id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((post) => ({
      id: post.id,
      nickname: post.nickname,
      body: post.body,
      createdAt: post.created_at,
      editedAt: post.edited_at ?? null,
    }));

  return (
    <ThreadView
      threadId={thread.id}
      title={thread.title}
      posts={items}
      nickname={nickname}
    />
  );
}
