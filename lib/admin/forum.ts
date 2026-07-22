/**
 * ROLE OF THIS FILE
 * Testing-phase forum identity (owner request 2026-07-22): who you are on
 * the forum is just a nickname in a signed-nothing cookie — no credentials,
 * because the whole admin is open during testing. The login page sets it;
 * forum pages and actions read it. Once real Supabase auth is active the
 * forum still sits behind requireAdmin like every other admin screen.
 */

import "server-only";
import { cookies } from "next/headers";

export const FORUM_NICKNAME_COOKIE = "forum_nickname";
export const NICKNAME_MAX = 40;
const NICKNAME_DAYS = 90;

export function cleanNickname(raw: unknown): string {
  return String(raw ?? "").trim().slice(0, NICKNAME_MAX);
}

/** The visitor's forum nickname, or null if they haven't picked one. */
export async function getForumNickname(): Promise<string | null> {
  const value = cleanNickname((await cookies()).get(FORUM_NICKNAME_COOKIE)?.value);
  return value || null;
}

export async function setForumNickname(nickname: string): Promise<void> {
  (await cookies()).set(FORUM_NICKNAME_COOKIE, cleanNickname(nickname), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: NICKNAME_DAYS * 24 * 60 * 60,
  });
}
