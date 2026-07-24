/**
 * ROLE OF THIS FILE
 * Forum unread tracking (owner request 2026-07-23): show which discussions
 * have new messages and how many. Read marks live in localStorage — one
 * "read up to" timestamp per thread, per browser — mirroring the forum's
 * cookie-based identity: no schema change, works on every backend at once.
 * Pure counting helpers are separated from the storage helpers so
 * `node --test` can load them (relative imports, no browser APIs).
 */

/** One post's stamp: when it was posted and by whom (forum nickname). */
export type ForumPostStamp = { at: string; by: string };

/** A thread's posts, projected down to what unread counting needs. */
export type ForumThreadActivity = { threadId: string; posts: ForumPostStamp[] };

/** Per-thread read marks: thread id → ISO timestamp read up to. */
export type ReadMarks = Record<string, string>;

const STORAGE_KEY = "goldrose-forum-read";

/** Fired on window whenever a read mark changes, so the nav badge recounts. */
export const FORUM_READ_EVENT = "goldrose-forum-read-changed";

/**
 * Unread posts in one thread: posts by someone else, newer than the read
 * mark. With no mark the whole thread is unread (first visit on this device).
 *
 * @param posts - The thread's post stamps.
 * @param mark - ISO timestamp the thread was read up to; undefined = never.
 * @param self - The reader's forum nickname; own posts never count.
 */
export function unreadInThread(
  posts: ForumPostStamp[],
  mark: string | undefined,
  self: string,
): number {
  return posts.filter((post) => post.by !== self && (!mark || post.at > mark)).length;
}

/**
 * Total unread posts across all threads — the nav badge number.
 *
 * @param activity - Every thread's post stamps.
 * @param marks - The device's read marks.
 * @param self - The reader's forum nickname.
 */
export function totalUnread(
  activity: ForumThreadActivity[],
  marks: ReadMarks,
  self: string,
): number {
  return activity.reduce(
    (sum, thread) => sum + unreadInThread(thread.posts, marks[thread.threadId], self),
    0,
  );
}

/** The device's read marks; {} outside the browser or on storage errors. */
export function getReadMarks(): ReadMarks {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ReadMarks) : {};
  } catch {
    return {};
  }
}

/**
 * Records that a thread has been read up to `latestAt` and notifies
 * listeners (FORUM_READ_EVENT). Marks only move forward.
 *
 * @param threadId - The thread being read.
 * @param latestAt - created_at of the newest post on screen.
 */
export function markThreadRead(threadId: string, latestAt: string): void {
  try {
    const marks = getReadMarks();
    if (marks[threadId] && marks[threadId] >= latestAt) {
      return;
    }
    marks[threadId] = latestAt;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(marks));
    window.dispatchEvent(new Event(FORUM_READ_EVENT));
  } catch {
    // Storage unavailable (private mode) — the badge just stays put.
  }
}
