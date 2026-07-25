"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * The bottom nav's right-most tab art, the one tab whose label depends on who
 * is looking: "Login" when signed out, "Me" once a customer session exists
 * (IxD spec, docs/ixd/bottom-nav-buttons.md). The design bakes the label into
 * the PNG, so switching label means switching art — the frames ship both.
 *
 * This resolves the session in the browser, not on the server, because every
 * page that hosts the nav is statically cached (revalidate = 300): rendering
 * the signed-in art on the server would bake the first visitor's state into
 * the shared HTML for everyone. The signed-out art is therefore also the
 * server/hydration snapshot, which keeps the pixel-gated frames unchanged.
 */

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowserAuthClient } from "@/lib/supabase/browser-auth";

/**
 * Render the account tab's image, swapping to the "Me" art once a customer
 * session exists and back to "Login" on sign-out.
 *
 * @param signedOutImg - Figma node id of the "Login" art.
 * @param signedInImg - Figma node id of the "Me" art.
 * @param activeImg - Filled "Login" art used while the account tab is the
 *   current section. The design ships no filled "Me", so a signed-in visitor
 *   keeps the outline art.
 * @param isActive - Whether the account tab is the current section.
 * @param style - Positioning styles supplied by the nav.
 * @returns The tab's `img` element.
 */
export function AccountTabArt({
  signedOutImg,
  signedInImg,
  activeImg,
  isActive,
  style,
}: {
  signedOutImg: string;
  signedInImg: string;
  activeImg: string;
  isActive: boolean;
  style: React.CSSProperties;
}) {
  const supabase = useMemo(() => supabaseBrowserAuthClient(), []);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    // Local file mode has no customer auth at all — stay "Login".
    if (!supabase) return;

    let live = true;
    // getSession() reads the cached session, so the nav costs no network
    // round-trip per page view; the subscription then keeps the label honest
    // across sign-in and sign-out without a reload.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (live) setSignedIn(Boolean(session?.user));
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session?.user));
    });

    return () => {
      live = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  const img = signedIn ? signedInImg : isActive ? activeImg : signedOutImg;

  return (
    <img
      src={`/veloria/home/${img}.png`}
      alt={signedIn ? "Me" : "Login"}
      width={50}
      height={57}
      style={style}
    />
  );
}
