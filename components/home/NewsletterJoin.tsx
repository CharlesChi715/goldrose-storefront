"use client";

/**
 * ROLE OF THIS FILE
 * The right-hand control of the homepage newsletter strip (A-11), which the
 * 2026-08-07 delivery split into two states and, in doing so, deleted the
 * email field that used to sit beside the button:
 *
 * - **signed out** — the JOIN pill alone (frame 2380:370, `Frame 100`
 *   143×42, r4 #D4AF37), linking to the sign-up page.
 * - **signed in** — the ACCOUNT-INFO welcome card instead (frame 2974:359
 *   `Frame 115`, 187×71, r15 #D4AF37): "Welcome back to ELDREVE" over
 *   "Hello, <name>".
 *
 * WHY A CLIENT ISLAND. `/` is statically rendered and revalidates on a timer;
 * reading the session on the server would make it dynamic for every visitor
 * to swap one 187px card. So this follows the AccountTabArt precedent: render
 * the signed-out state, ask Supabase after mount, swap if it answers with a
 * user. Most visitors are signed out, so the common case never flickers, and
 * in local mode (no Supabase configured) the client is null and it simply
 * stays the JOIN button.
 *
 * WHAT THE FRAME DOES NOT SAY. `2974:359` is a standalone spec frame with no
 * prototype edges, so the design records neither a tap target for the welcome
 * card nor what to show a customer whose account carries no name.
 * AI-TAG(AI-040): AGENT-DECISION — both are answered here rather than guessed
 * at silently. See
 * /agent-delivery/sessions/figma-sync-newsletter-bag-08-07-feat-figma-sync.md.
 * The JOIN button keeps the target the strip had before the redesign
 * (/account/signup); the 08-07 frame dropped that edge along with the field,
 * and there is still no subscribe endpoint to collect an address (AI-025).
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { abs } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";
import { greetingName } from "@/lib/account/greeting";
import { supabaseBrowserAuthClient } from "@/lib/supabase/browser-auth";

const CREAM = "#FFF6EC";
const GOLD = "#D4AF37";

/* Both states are centred in the strip the parent hands them, so the y is
   derived rather than copied: the frames centre a 42px pill and a 71px card
   in the same 105px column, and this strip is 97px until the homepage
   typography pass lands (see components/home/A11.tsx). */
const STRIP_HEIGHT = 97;
const PILL = { w: 143, h: 42 };
const CARD = { w: 187, h: 71 };

export function NewsletterJoin({
  href,
  buttonLabel,
  welcomeText,
  greeting,
}: {
  href: string;
  buttonLabel: string;
  welcomeText: string;
  greeting: string;
}) {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const supabase = supabaseBrowserAuthClient();
    if (!supabase) {
      return;
    }
    let cancelled = false;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!cancelled) {
        setName(user ? greetingName(user.user_metadata, user.email) : null);
      }
    });
    // Signing in or out in another tab of the app must move the card with it.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      setName(user ? greetingName(user.user_metadata, user.email) : null);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (name === null) {
    // 2380:801 / 2380:804 — the pill is the whole control now; the 122×42
    // cream input box beside it was deleted at source.
    return (
      <Link
        data-field="story.newsletter_href"
        data-el="HOME-NEWSLETTER-JOIN-BTN"
        href={href}
        aria-label="Join the ELDREVE mailing list"
        style={{
          ...abs(200, (STRIP_HEIGHT - PILL.h) / 2, PILL.w, PILL.h),
          display: "block",
          background: GOLD,
          borderRadius: 4,
        }}
      >
        <div
          data-field="story.newsletter_button"
          className={notoSC.className}
          style={{
            ...abs(0, 15, PILL.w),
            fontSize: 10,
            lineHeight: "12px",
            color: CREAM,
            fontWeight: 500,
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          {buttonLabel}
        </div>
      </Link>
    );
  }

  // 2974:374 · ACCOUNT-INFO-PROFILE-CARD
  return (
    <Link
      data-el="HOME-NEWSLETTER-ACCOUNT-CARD"
      href="/account"
      style={{
        ...abs(200, (STRIP_HEIGHT - CARD.h) / 2, CARD.w, CARD.h),
        display: "block",
        background: GOLD,
        borderRadius: 15,
      }}
    >
      <div
        data-field="story.newsletter_welcome_text"
        data-el="ACCOUNT-INFO-WELCOME-TEXT"
        className={notoSC.className}
        style={{
          ...abs(0, 15.5, CARD.w),
          fontSize: 13,
          lineHeight: "16px",
          color: CREAM,
          fontWeight: 400,
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        {welcomeText}
      </div>
      {/* A saved first name has no length limit, so the 187px box clips
          rather than spilling over the card's rounded edge. */}
      <div
        data-field="story.newsletter_welcome_greeting"
        data-el="ACCOUNT-INFO-WELCOME-TITLE"
        className={playfair.className}
        style={{
          ...abs(0, 31.5, CARD.w),
          fontSize: 20,
          lineHeight: "24px",
          color: CREAM,
          fontWeight: 600,
          textAlign: "center",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          paddingLeft: 8,
          paddingRight: 8,
        }}
      >
        {`${greeting} ${name}`}
      </div>
    </Link>
  );
}
