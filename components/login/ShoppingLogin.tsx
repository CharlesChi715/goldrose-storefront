"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * The signed-out storefront sign-in screen, imported pixel-exact from the
 * VELORIA frame 1523:2470 ("loginpage", now 430×1156 — 2026-08-02 re-sync).
 * Five design modules stack on a 430-wide canvas: 01 Welcome Hero,
 * 02 Account Type Tabs, 03 Sign In, 04 Member Benefits, and the self-service
 * card, then 06 Find Existing Order. Module 13 (bottom nav) is the shared
 * BottomNav — this main-flow frame keeps the nav band the account-settings
 * frames dropped.
 *
 * 08-02 re-sync: the 05 GoldRose Membership module is gone at source,
 * replaced by ACCOUNT-INFO-SERVICE-CARD (the dashboard's row card, here with
 * Returns & After-Sales / Customer Care / Policies & Legal); Find Existing
 * Order moved up to y1004 and the frame shrank 1232 → 1156. "Create a
 * shopping account ›" now really navigates to /account/signup — that frame
 * dropped its password fields, so the page may be linked (it stays inert).
 *
 * 07-29 restyle: the outer cards of modules 03/04/06 went WHITE on their sand
 * hairlines, and the inactive account-type tab went white too; inner tiles,
 * fields and the VIEW MY ORDER button stay CARD. The frame's glyph re-exports
 * came back byte-equivalent to the 76-* files, so those assets stay.
 *
 * Sign-in is an emailed link (owner request 2026-07-27): `signInWithOtp`
 * sends a mail whose link lands on /auth/confirm and signs the visitor in.
 * The same mail carries a 6-digit code as fallback — useful when the mail is
 * read on a different device — so after sending, the email field becomes the
 * code field in place, reusing the frame's own input styling, which is the
 * smallest possible deviation (the frame has no post-send state).
 *
 * Coordinates and colors come verbatim from the Figma REST API. Glyph icons
 * (✉ □ ♡ ▣ ▢) and the two tab labels are SVG exports of TEXT nodes, because
 * those symbols fall back to different fonts in Chrome than in Figma; SVG
 * exports crop to ink extents, so they are placed at intrinsic size.
 */

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ScaleFrame } from "@/components/chrome";
import { abs, txt } from "@/lib/figma-layout";
import { FadeLink } from "@/components/PageFade";
import { BackButton } from "@/components/BackButton";
import { cormorant, inter, notoSC } from "@/lib/fonts";
import { supabaseBrowserAuthClient } from "@/lib/supabase/browser-auth";
import {
  INK,
  MUTED,
  CARD,
  HAIRLINE,
  CANVAS,
  WHITE,
  Glyph,
} from "@/components/login/tokens";

const A = "/veloria/login";

/** Non-breaking spaces: HTML collapses the design's double/triple spaces. */
const NB = " ";

/* ---------- 01 · Welcome Hero (1523:2472, 430×310) ---------- */

function WelcomeHero() {
  return (
    <>
      <img
        src={`${A}/76-56.png`}
        alt="A GoldRose gold-dipped rose"
        style={{
          ...abs(225, 72, 205, 238),
          display: "block",
          objectFit: "cover",
        }}
      />
      <div
        className={cormorant.className}
        style={{
          ...abs(24, 102, 196, 74),
          ...txt(34, 37, INK),
          whiteSpace: "pre-line",
          fontWeight: 600,
        }}
      >
        {"Welcome to\nGoldRose"}
      </div>
      <div
        style={{
          ...abs(24, 196, 180, 76),
          ...txt(12, 19, INK),
          whiteSpace: "pre-line",
          fontWeight: 500,
        }}
      >
        {
          "Sign in to save every meaningful gift,\ntrack orders and continue personalizing anytime."
        }
      </div>
      <BackButton
        fallback="/"
        src="/veloria/home/56-71.png"
        style={abs(15, 20, 40, 43)}
      />
      {/* The frame's wordmark node (1523:2477, 144,22 152×40) ships an
          "ELDREVE" placeholder — a mock artifact; the business frame keeps
          GoldRose. The real wordmark stays, centred in the new box. */}
      <Link
        href="/"
        style={{ ...abs(147, 22, 136, 40), display: "block" }}
        aria-label="GoldRose home"
      >
        <img
          src="/veloria/brand/eldreve-136x40.png"
          alt="ELDREVE"
          style={{ display: "block", width: 136, height: 40 }}
        />
      </Link>
    </>
  );
}

/* ---------- 02 · Account Type Tabs (1523:2478, 398×54 @ 16,324) ---------- */

function AccountTypeTabs() {
  return (
    <div
      style={{ ...abs(16, 324, 398, 54), background: CARD, borderRadius: 12 }}
    >
      {/* Gift Shopping — the active tab on this frame. */}
      <div
        style={{ ...abs(0, 0, 196, 54), background: INK, borderRadius: 12 }}
        aria-current="page"
      >
        <Glyph
          src={`${A}/76-61.svg`}
          left={46}
          top={22}
          width={104}
          height={13}
        />
        <span className="sr-only">Gift Shopping</span>
      </div>
      {/* Cross-fades the canvas on the way to the business frame, the same
          treatment the bottom-nav tabs get (owner, 2026-07-26). */}
      <FadeLink
        href="/account/business"
        style={{
          ...abs(202, 0, 196, 54),
          background: WHITE,
          borderRadius: 12,
          display: "block",
        }}
        ariaLabel="Business & Partnerships"
      >
        <Glyph
          src={`${A}/76-63.svg`}
          left={14}
          top={22}
          width={168}
          height={13}
        />
      </FadeLink>
    </div>
  );
}

/* ---------- 03 · Sign In (1523:2483, 398×254 @ 16,392) ---------- */

function SignInCard({
  email,
  setEmail,
  code,
  setCode,
  phase,
  busy,
  error,
  onSend,
  onVerify,
  emailRef,
}: {
  email: string;
  setEmail: (v: string) => void;
  code: string;
  setCode: (v: string) => void;
  phase: "email" | "code";
  busy: boolean;
  error: string | null;
  onSend: () => void;
  onVerify: () => void;
  emailRef: React.RefObject<HTMLInputElement | null>;
}) {
  const codeStep = phase === "code";
  const disabled = busy;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (codeStep) onVerify();
        else onSend();
      }}
      style={{
        ...abs(16, 392, 398, 254),
        background: WHITE,
        borderRadius: 14,
        boxShadow: `inset 0 0 0 1px ${HAIRLINE}`,
      }}
    >
      <div
        style={{
          ...abs(16, 19.5, 251, 21),
          ...txt(17, 20.57, INK),
          fontWeight: 700,
        }}
      >
        {codeStep ? "Check your email" : "Sign in and continue shopping"}
      </div>

      {/* Email / code field (1523:2486). One box, two roles — the frame has
          no separate code-entry state. */}
      <div
        style={{
          ...abs(16, 56, 366, 52),
          background: CARD,
          borderRadius: 9,
          boxShadow: `inset 0 0 0 1px ${HAIRLINE}`,
        }}
      >
        {/* The ✉ is a PNG, not an SVG: Figma renders it from a fallback font
            and its SVG export degrades to a solid filled box — the 07-29
            re-export (1523-2487.svg) degrades the same way. */}
        <img
          src={`${A}/76-69.png`}
          alt=""
          style={{ ...abs(14, 16.5, 19, 19), display: "block" }}
        />
        <input
          ref={emailRef}
          id={codeStep ? "otp-code" : "otp-email"}
          name={codeStep ? "code" : "email"}
          type={codeStep ? "text" : "email"}
          inputMode={codeStep ? "numeric" : "email"}
          autoComplete={codeStep ? "one-time-code" : "email"}
          required
          disabled={disabled}
          value={codeStep ? code : email}
          onChange={(e) =>
            codeStep ? setCode(e.target.value) : setEmail(e.target.value)
          }
          placeholder={codeStep ? "6-digit code" : "Enter your email address"}
          aria-label={codeStep ? "Verification code" : "Email address"}
          style={{
            position: "absolute",
            left: 45,
            top: 0,
            width: 366 - 45 - 14,
            height: 52,
            border: "none",
            outline: "none",
            background: "transparent",
            ...txt(13, 15.73, INK),
            fontWeight: 400,
          }}
        />
      </div>

      {/* Primary button (1523:2489). The frame still labels it "SEND
          VERIFICATION CODE"; the live label matches the emailed-link flow
          (owner request 2026-07-27) and stays. */}
      <button
        type="submit"
        disabled={disabled}
        style={{
          ...abs(16, 122, 366, 50),
          background: INK,
          borderRadius: 10,
          border: "none",
          cursor: disabled ? "default" : "pointer",
          opacity: disabled && busy ? 0.7 : 1,
        }}
      >
        <span
          style={{
            ...txt(13, 15.73, CANVAS),
            fontWeight: 600,
            display: "block",
            textAlign: "center",
          }}
        >
          {busy
            ? codeStep
              ? "VERIFYING…"
              : "SENDING…"
            : codeStep
              ? "VERIFY AND SIGN IN"
              : "EMAIL ME A SIGN-IN LINK"}
        </span>
      </button>

      {/* Hint line (1523:2491) — doubles as the error/status slot. */}
      <div
        style={{
          ...abs(16, 186, 366, 12),
          ...txt(10, 12.1, error ? "#B3261E" : MUTED, "center"),
          fontWeight: 400,
          whiteSpace: "normal",
        }}
      >
        {error
          ? error
          : codeStep
            ? `We emailed a sign-in link to ${email} — tap it, or enter the 6-digit code from that email here.`
            : "We’ll email you a secure sign-in link. Click it and you’re in — no password needed."}
      </div>

      {/* Create account (1523:2492) — 08-02: the signup frame dropped its
          password fields, so this now really opens /account/signup. */}
      <div style={abs(16, 212, 366, 24)}>
        <span
          style={{
            ...abs(68.5, 5.5, 56, 13),
            ...txt(11, 13.31, MUTED),
            fontWeight: 400,
          }}
        >
          New here?
        </span>
        <Link
          href="/account/signup"
          style={{
            ...abs(130.5, 4.5, 167, 15),
            ...txt(12, 14.52, INK),
            fontWeight: 600,
            display: "block",
            textAlign: "left",
          }}
        >
          {`Create a shopping account${NB}${NB}›`}
        </Link>
      </div>
    </form>
  );
}

/* ---------- 04 · Member Benefits (1523:2495, 398×184 @ 16,660) ---------- */

// gx/gy/gw/gh are measured ink boxes (see Glyph), not the design's node boxes.
const BENEFITS = [
  {
    x: 14,
    glyph: "76-90",
    gx: 48,
    gy: 68,
    gw: 18,
    gh: 18,
    title: "Order Tracking",
    ty: 96.5,
    th: 26,
    tx: 20,
    desc: "Follow every delivery update",
    dy: 127.5,
    dh: 24,
    dx: 21,
  },
  {
    x: 108.67,
    glyph: "76-94",
    gx: 141,
    gy: 75,
    gw: 21,
    gh: 19,
    title: "Wishlists",
    ty: 103,
    th: 13,
    tx: 114.67,
    desc: "Save roses and gift sets",
    dy: 121,
    dh: 24,
    dx: 115.67,
  },
  {
    x: 203.33,
    glyph: "76-98",
    gx: 237,
    gy: 62,
    gw: 18,
    gh: 18,
    title: "Custom Archive",
    ty: 90.5,
    th: 26,
    tx: 209.33,
    desc: "Keep names, cards and designs",
    dy: 121.5,
    dh: 36,
    dx: 210.33,
  },
  {
    x: 298,
    glyph: "76-102",
    gx: 332,
    gy: 68,
    gw: 18,
    gh: 18,
    title: "Date Reminders",
    ty: 96.5,
    th: 26,
    tx: 304,
    desc: "Never miss a special moment",
    dy: 127.5,
    dh: 24,
    dx: 305,
  },
];

function MemberBenefits() {
  return (
    <div
      style={{ ...abs(16, 660, 398, 184), background: WHITE, borderRadius: 14 }}
    >
      <div
        style={{
          ...abs(14, 16, 156, 18),
          ...txt(15, 18.15, INK),
          fontWeight: 700,
        }}
      >
        Benefits after sign-in
      </div>
      {BENEFITS.map((b) => (
        <div key={b.title}>
          <div
            style={{
              ...abs(b.x, 46, 86, 122),
              background: CARD,
              borderRadius: 12,
            }}
          />
          <Glyph
            src={`${A}/${b.glyph}.svg`}
            left={b.gx}
            top={b.gy}
            width={b.gw}
            height={b.gh}
          />
          <div
            style={{
              ...abs(b.tx, b.ty, 74, b.th),
              ...txt(11, 13.31, INK, "center"),
              fontWeight: 600,
              whiteSpace: "normal",
            }}
          >
            {b.title}
          </div>
          <div
            style={{
              ...abs(b.dx, b.dy, 72, b.dh),
              ...txt(8.5, 12, MUTED, "center"),
              fontWeight: 400,
              whiteSpace: "normal",
            }}
          >
            {b.desc}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- self-service card (2210:378, 398×132 @ 16,858) ---------- */

// 08-02: this card replaced the 05 GoldRose Membership module at source. It
// is the dashboard's service-row card, in Noto Sans SC on this Inter frame.
const SERVICE_ROWS = [
  {
    y: 13,
    title: "Returns & After-Sales",
    value: `Self-service${NB}${NB}›`,
    href: "/account/returns",
  },
  {
    y: 54,
    title: "Customer Care",
    value: `Online now${NB}${NB}›`,
    href: "/care",
  },
  {
    y: 95,
    title: "Policies & Legal",
    value: `View all${NB}${NB}›`,
    href: "/account/policies-legal",
  },
];

function ServiceCard() {
  return (
    <div
      style={{
        ...abs(16, 858, 398, 132),
        background: CARD,
        borderRadius: 14,
        boxShadow: `inset 0 0 0 1px ${HAIRLINE}`,
      }}
    >
      {SERVICE_ROWS.map((row, i) => (
        <div key={row.title}>
          <Link
            href={row.href}
            className={notoSC.className}
            style={{ ...abs(0, row.y, 398, 30), display: "block" }}
          >
            <span
              style={{
                ...abs(16, 0, 230),
                ...txt(12, 16, INK),
                fontWeight: 500,
              }}
            >
              {row.title}
            </span>
            <span style={{ ...abs(248, 0, 132), ...txt(11, 16, INK, "right") }}>
              {row.value}
            </span>
          </Link>
          {i < SERVICE_ROWS.length - 1 ? (
            <div
              style={{
                ...abs(14, [42, 83][i], 370, 1),
                background: HAIRLINE,
              }}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

/* ---------- 06 · Find Existing Order (1523:2520, 398×82 @ 16,1004) ---------- */

function FindExistingOrder() {
  return (
    <div
      style={{ ...abs(16, 1004, 398, 82), background: WHITE, borderRadius: 14 }}
    >
      <Glyph
        src={`${A}/76-112.svg`}
        left={19}
        top={31}
        width={20}
        height={20}
      />
      {/* Checked style settled in the Figma thread on 1523:2470 (Charles's
          "Ok", 07-31): the system-default ✓ glyph, recolored to the band's
          ink instead of its default color. The frame still draws a bare □. */}
      <span
        aria-hidden
        style={{
          ...abs(19, 31, 20, 20),
          ...txt(13, 20, INK, "center"),
          fontWeight: 600,
        }}
      >
        ✓
      </span>
      <div
        style={{
          ...abs(53, 20, 192, 16),
          ...txt(13, 15.73, INK),
          fontWeight: 600,
        }}
      >
        Already purchased?
      </div>
      <div
        style={{
          ...abs(53, 40, 192, 22),
          ...txt(9.5, 11.5, MUTED),
          fontWeight: 400,
          whiteSpace: "normal",
        }}
      >
        Check an order with your order number and email.
      </div>
      {/* /orders redirects to the ADMIN order list — a shopper tapping this
          landed in the back office. Point it at the customer tracking screen
          (Figma C-1) instead. */}
      <Link
        href="/orders/track"
        style={{
          ...abs(257, 19, 136, 44),
          background: CARD,
          borderRadius: 10,
          boxShadow: `inset 0 0 0 1px ${INK}`,
          display: "block",
        }}
      >
        <span
          style={{
            ...txt(13, 15.73, INK),
            fontWeight: 600,
            display: "block",
            textAlign: "center",
            lineHeight: "44px",
          }}
        >
          {`VIEW MY ORDER${NB}${NB}›`}
        </span>
      </Link>
    </div>
  );
}

/* ---------- Page ---------- */

/**
 * The signed-out sign-in screen. Rendered by the account page whenever there
 * is no customer session; the signed-in account view is a separate, hand-built
 * screen (the design ships no signed-in frame).
 *
 * @returns The pixel-exact 430-wide login canvas.
 */
export function ShoppingLogin() {
  const supabase = useMemo(() => supabaseBrowserAuthClient(), []);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    // Local file mode has no auth server; the screen still renders as designed
    // and only says so when someone actually tries to sign in.
    if (!supabase) {
      setError("Sign-in isn’t switched on in this environment yet.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: sendError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (sendError) {
      setError("We couldn’t email that address. Check it and try again.");
      return;
    }
    setPhase("code");
  }

  async function verifyCode() {
    if (!supabase) {
      setError("Sign-in isn’t switched on in this environment yet.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });
    setBusy(false);
    if (verifyError) {
      setError("That code didn’t match. Request a new one if it has expired.");
      return;
    }
    // A valid code sets the session; the account page re-renders signed in.
    // (The emailed link signs in through /auth/confirm without this step.)
  }

  return (
    // Canvas 1097 = the frame's nav band top (1156 − 59).
    <ScaleFrame
      height={1097}
      background={CANVAS}
      fontClass={inter.className}
      navActive="Account"
    >
      <WelcomeHero />
      <AccountTypeTabs />
      <SignInCard
        email={email}
        setEmail={setEmail}
        code={code}
        setCode={setCode}
        phase={phase}
        busy={busy}
        error={error}
        onSend={sendCode}
        onVerify={verifyCode}
        emailRef={emailRef}
      />
      <MemberBenefits />
      <ServiceCard />
      <FindExistingOrder />
    </ScaleFrame>
  );
}
