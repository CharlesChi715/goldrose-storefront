/**
 * ROLE OF THIS FILE
 * /admin/forum — testing-phase discussion board (owner request 2026-07-22):
 * thread list plus a new-thread form. Visitors without a forum nickname are
 * sent to /admin/login to pick one (nickname only, no credentials).
 */

import { redirect } from "next/navigation";
import { getForumNickname } from "@/lib/admin/forum";
import { getStore } from "@/lib/supabase/store.ts";
import { ForumList, type ThreadItem } from "./ForumList";

export const dynamic = "force-dynamic";

export default async function ForumPage() {
  const nickname = await getForumNickname();
  if (!nickname) {
    redirect("/admin/login");
  }

  const store = getStore();
  const [threads, posts] = await Promise.all([
    store.all("forum_threads"),
    store.all("forum_posts"),
  ]);

  const items: ThreadItem[] = threads
    .map((thread) => {
      const threadPosts = posts.filter((post) => post.thread_id === thread.id);
      const lastPostAt = threadPosts.reduce(
        (latest, post) => (post.created_at > latest ? post.created_at : latest),
        thread.created_at,
      );
      return {
        id: thread.id,
        title: thread.title,
        nickname: thread.nickname,
        createdAt: thread.created_at,
        // The opening message is a post too — replies are everything after it.
        replyCount: Math.max(0, threadPosts.length - 1),
        lastPostAt,
      };
    })
    .sort((a, b) => b.lastPostAt.localeCompare(a.lastPostAt));

  return <ForumList items={items} nickname={nickname} />;
}
