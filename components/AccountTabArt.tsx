"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * The bottom bar's account tab, which the design draws as two different tabs
 * depending on who is looking (2026-08-02 nav import):
 *
 * - **signed out** the art reads **Login** — outline on home/shop, filled on
 *   the auth screens themselves (imageRefs 55ec9c1e / 71fa0136)
 * - **signed in** it reads **Me** — outline on the PDP, filled on the account
 *   dashboard (61faa8ad / 352bf654)
 *
 * That session swap existed in the build until the 07-27 frames dropped it;
 * these frames bring it back, consistently across five screens, so the tab
 * follows the session again. The rest of the bar is static art in a server
 * component, so only this one tab is a client island.
 *
 * It renders the signed-out art first and swaps once Supabase answers: most
 * visitors are signed out, so the common case never flickers, and in local
 * mode (no Supabase configured) the client is null and it simply stays
 * "Login".
 */

import { useEffect, useState } from "react";
import { supabaseBrowserAuthClient } from "@/lib/supabase/browser-auth";

export function AccountTabArt({ isActive }: { isActive: boolean }) {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const supabase = supabaseBrowserAuthClient();
    if (!supabase) {
      return;
    }
    let cancelled = false;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!cancelled) {
        setSignedIn(Boolean(user));
      }
    });
    // Signing in or out elsewhere in the tab must move the label with it.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session?.user));
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const face = signedIn ? "me" : "login";
  return (
    <img
      src={`/eldreve/nav/${face}${isActive ? "-active" : ""}.png`}
      alt={signedIn ? "Me" : "Login"}
      width={50}
      height={57}
      style={{ position: "absolute", left: 10, top: 1, display: "block" }}
    />
  );
}
