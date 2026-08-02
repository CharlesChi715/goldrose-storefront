/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * /account/signup — pixel-exact implementation of "loginpage-Create a
 * shopping account", re-imported 2026-08-02 (second delivery of the day)
 * from 1523:3315. The frame stopped being a sign-up form and became a
 * unified email entry point: the hero now reads "Continue with your email",
 * the Full name field is gone at source (email + verification code only),
 * the button says CONTINUE, the canvas grew 932 → 974, and a bottom
 * navigation band was added — Charles's "加一下nav吧" comment, delivered.
 * Geometry, colors, fonts and copy verbatim from the Figma REST data; input
 * icons are Figma's own SVG exports (the ✉ is a crop of the frame render —
 * it SVG-exports as a .notdef box, C-2 precedent).
 *
 * ⚠️ Brand: the frame's header wordmark image reads "ELDREVE". Treated as a
 * placeholder until DQ-34 was answered on 2026-08-03 — ELDREVE IS the brand,
 * so the GoldRose substitution here is now wrong and retires with the rename
 * project (SUMMARY.md § OQ-4).
 *
 * 2026-08-03 — THE FORM IS LIVE. No longer a visual placeholder:
 *   • email  — real <input>, format-validated on blur (red hairline + a
 *     message in the card's status slot); typing retracts the verdict.
 *   • Send code — signInWithOtp({shouldCreateUser:true}). Disabled without a
 *     valid address and while a request is in flight, because each new code
 *     invalidates the previous one and a double-tap would email two.
 *   • code — real <input>, digits only, capped at 6 to match the project's
 *     mailer_otp_length (deliberately NOT maxLength: the browser truncates
 *     raw characters first, which would eat the digits out of a pasted
 *     "code: 123456").
 *   • consent — a real checkbox gating CONTINUE (owner rule). Only the plain
 *     words carry the <label>; the policy links are plain anchors, or
 *     tapping "Privacy Policy" would tick the box on the way out.
 *   • CONTINUE — verifyOtp, then /account. Consent is the only thing that
 *     disables it, so everything else is checked on click and answered in
 *     the status slot: a tap always produces a reply.
 *
 * The same email also carries a one-tap sign-in link (→ /auth/confirm →
 * /account), so the code is the different-device fallback, not the only way
 * in. The frame deleted its "Already have an account? Sign in ›" link, so
 * the page's other ways back are the header back arrow and the nav's Me tab.
 * The frame's own prototype gives CONTINUE a NAVIGATE with a null
 * destination; /account is our choice, matching the login screen (AI-020).
 *
 * AI-TAG(AI-019): AGENT-DECISION — the frame deleted the "Already have an
 * account? Sign in ›" link, so the build did too. See
 * /agent-delivery/sessions/figma-sync-signup-mepage-08-02-feat-figma-sync.md.
 */

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { ScaleFrame } from "@/components/chrome";
import { BrandWordmark } from "@/components/screens/account-chrome";
import { Glyph } from "@/components/screens/glyphs";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";
import { supabaseBrowserAuthClient } from "@/lib/supabase/browser-auth";

const INK = "#3B2F2F";
const SAND = "#E5D9C9";
const CREAM = "#FFF6EC";
const SHEET = "#FFFEFB";
const HINT = "#75665E";
const DANGER = "#B3261E";

/**
 * Deliberately loose: something, an @, something, a dot, something — no
 * spaces. Full RFC 5322 is a monster of a regex that still cannot tell you
 * whether an address exists, and the strict ones reject valid addresses
 * (plus-tags, new TLDs). This only catches the honest typo — "name@gmail",
 * "name gmail.com" — and the send step's own failure is what catches the
 * rest.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 1561:114/111 — the two remaining fields, frame order (08-02 second pass:
// Full name is gone at source, so email moved up to y400 and the code field
// to y474): box y, icon export (ink = SVG natural size; crop = the ✉
// render-crop's measured box), hint text.
const FIELDS: Array<{
  name: "email" | "code";
  y: number;
  icon: string;
  ink?: [number, number];
  crop?: [number, number, number, number];
  hint: string;
  sendCode?: boolean;
}> = [
  {
    name: "email",
    y: 400,
    icon: "1523-3325",
    crop: [50.5, 422.5, 21.5, 14.5],
    hint: "Enter your email address",
  },
  {
    name: "code",
    y: 474,
    icon: "1523-3328",
    ink: [22, 22],
    hint: "Verification code",
    sendCode: true,
  },
];

export function SignupScreen() {
  // One client per mounted screen: a fresh one per render would rebuild the
  // auth listener and its storage handles on every keystroke. Null in local
  // file mode, where there is no auth server at all.
  const supabase = useMemo(() => supabaseBrowserAuthClient(), []);
  const router = useRouter();
  const [email, setEmail] = useState("");
  // `touched` keeps the error quiet while someone is still typing their
  // address for the first time — validating on every keystroke shouts
  // "invalid" at a half-typed address, which reads as the form being broken.
  const [touched, setTouched] = useState(false);
  // "sending" locks the button for the round trip; "sent" records that a code
  // is on its way, and to which address — the address is part of the message,
  // because the commonest support question is "which one did you send it to?".
  const [phase, setPhase] = useState<"idle" | "sending" | "sent" | "verifying">(
    "idle",
  );
  const [sentTo, setSentTo] = useState("");
  // One error slot for both steps: they can never be in flight at once, so a
  // second variable would only create states where both could be set.
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [agreed, setAgreed] = useState(false);
  const emailValid = EMAIL_RE.test(email.trim());
  const emailError = touched && email.trim() !== "" && !emailValid;
  // The button needs a valid address AND no request already in the air —
  // without the second half, an impatient double-tap sends two codes and the
  // first one silently stops working.
  const sendReady = emailValid && phase !== "sending";

  async function sendCode() {
    const address = email.trim();
    setError(null);
    setPhase("sending");

    // Local file mode has no auth server. Say so plainly rather than failing
    // silently — this screen is reachable in local dev.
    if (!supabase) {
      setPhase("idle");
      setError("Sign-in isn’t switched on in this environment yet.");
      return;
    }

    const { error: sendError } = await supabase.auth.signInWithOtp({
      email: address,
      // This is the sign-up door, so an unknown address is the normal case.
      options: { shouldCreateUser: true },
    });

    if (sendError) {
      setPhase("idle");
      // Supabase's own wording leaks implementation detail and, for rate
      // limits, reads as a fault. One honest sentence covers both.
      setError(
        "We couldn’t email that address. Check it, or try again in a minute.",
      );
      return;
    }
    setSentTo(address);
    setPhase("sent");
  }

  /**
   * CONTINUE. Consent is the only thing gating the button (owner rule), so
   * everything else is checked here and answered in the status slot — a tap
   * always produces a reply.
   */
  async function continueWithCode() {
    if (!emailValid) {
      // touched alone is not enough: an EMPTY field shows no validation
      // error, so tapping CONTINUE would look like nothing happened.
      setTouched(true);
      setError(
        email.trim() === ""
          ? "Enter your email address first."
          : "Enter a valid email address, like name@example.com.",
      );
      return;
    }
    if (code.trim().length !== 6) {
      setError(
        phase === "sent"
          ? "Enter the 6-digit code from your email."
          : "Tap Send code first, then enter the 6 digits we email you.",
      );
      return;
    }

    setError(null);
    setPhase("verifying");

    if (!supabase) {
      setPhase("sent");
      setError("Sign-in isn’t switched on in this environment yet.");
      return;
    }

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });

    if (verifyError) {
      setPhase("sent");
      setError("That code didn’t match. Request a new one if it has expired.");
      return;
    }

    // verifyOtp wrote the session to cookies, so the server can already see
    // it — /account renders signed in on the very next request.
    router.push("/account");
  }

  // One message, one colour, one element. Order encodes priority: a wrong
  // address gets corrected before anyone is told what happens next. Send code
  // is disabled until the address is valid, so the guidance has to be on
  // screen BEFORE they reach for it — a disabled button never fires a click,
  // and so can never explain itself (owner's choice, 2026-08-02).
  //
  // The neutral line explains rather than instructs: the placeholder already
  // says "Enter your email address", and repeating it here would contradict
  // someone who has typed a half-finished address and not yet blurred.
  const status = error
    ? { text: error, tone: DANGER }
    : emailError
      ? {
          text: "Enter a valid email address, like name@example.com.",
          tone: DANGER,
        }
      : phase === "sending"
        ? { text: "Sending your code…", tone: HINT }
        : phase === "verifying"
          ? { text: "Signing you in…", tone: HINT }
          : phase === "sent"
            ? {
                text: `We emailed ${sentTo} a 6-digit code and a sign-in link — use either.`,
                tone: INK,
              }
            : !emailValid
              ? { text: "We’ll email you a 6-digit code.", tone: HINT }
              : null;

  return (
    // Canvas 974 = the frame's nav band top (915) + 59.
    <ScaleFrame
      height={974}
      background={CREAM}
      fontClass={notoSC.className}
      navActive="Account"
    >
      {/* The browser's default placeholder grey is not the design's hint
          colour, and ::placeholder cannot be set from an inline style. */}
      <style>{`
        #signup-email::placeholder,
        #signup-code::placeholder { color: ${HINT}; opacity: 1; }
        /* appearance:none removes the platform tick as well as the box, so
           the ✓ is drawn back in — the same system glyph the login band uses,
           recoloured to the frame's ink (07-31 owner decision). */
        #signup-agree:checked::after {
          content: "✓";
          position: absolute;
          inset: 0;
          color: ${INK};
          font-size: 14px;
          line-height: 18px;
          text-align: center;
        }
      `}</style>

      {/* Brand Navigation (1523:3343) — ‹ back; the owner's GoldRose art
          substituted for the frame's "ELDREVE" wordmark image at its box
          (see the file header) */}
      <BackButton
        fallback="/account"
        src="/veloria/screens/1523-3344.png"
        style={abs(0, 18, 40, 42)}
      />
      <BrandWordmark x={153} y={13.5} w={140} h={51} />

      <div
        className={playfair.className}
        style={{
          ...abs(28, 98, 195, 150),
          ...txt(36, 48, INK),
          fontWeight: 600,
          whiteSpace: "pre-line",
        }}
      >
        {"Continue\nwith your\nemail"}
      </div>
      <div
        style={{
          ...abs(28, 247.8, 225, 70),
          ...txt(14, 16.8, INK),
          whiteSpace: "pre-line",
        }}
      >
        {
          "View your orders, track deliveries,\nand manage your shopping details\nsecurely."
        }
      </div>
      <img
        src="/veloria/screens/1523-3318.png"
        alt="Sapphire blue gold-dipped rose"
        width={178}
        height={250}
        style={{ ...abs(236, 78, 178, 250), display: "block" }}
      />

      {/* form card — all fields are visual placeholders (see file header) */}
      <div
        style={{
          ...abs(16, 326, 398, 576),
          background: SHEET,
          boxShadow: `inset 0 0 0 1px ${SAND}`,
          borderRadius: 16,
        }}
      />
      <div
        style={{
          ...abs(32, 352.4, 350),
          ...txt(21, 25.2, INK),
          fontWeight: 700,
        }}
      >
        Enter your email to continue
      </div>

      {FIELDS.map((field) => (
        <div key={field.hint}>
          <div
            style={{
              ...abs(32, field.y, 366, 60),
              background: SHEET,
              // A bad address recolors the field's own hairline, so the error
              // is visible without adding a box the design never drew.
              boxShadow: `inset 0 0 0 1px ${
                field.name === "email" && emailError ? DANGER : SAND
              }`,
              borderRadius: 10,
            }}
          />
          {field.crop ? (
            <img
              src={`/veloria/screens/${field.icon}.png`}
              alt=""
              style={{ ...abs(...field.crop), display: "block" }}
            />
          ) : field.ink ? (
            <Glyph
              src={field.icon}
              x={44}
              y={field.y + 8}
              w={34}
              h={44}
              ink={field.ink}
            />
          ) : null}
          {field.name === "email" ? (
            // Live control — a real input drawn inside the frame's own field
            // box: transparent, borderless, same type ramp as the hint it
            // replaces, so the box stays pixel-exact (ShoppingLogin
            // precedent). The hint becomes the placeholder.
            <input
              id="signup-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                // Typing clears the verdict: nobody wants to be corrected
                // mid-word. Blur asks for it again.
                setTouched(false);
                // …and it retracts the last send. "We emailed a code to
                // old@address" must not sit there while a new one is typed.
                setError(null);
                if (phase === "sent") {
                  setPhase("idle");
                }
              }}
              onBlur={() => setTouched(true)}
              placeholder={field.hint}
              aria-label="Email address"
              aria-invalid={emailError}
              aria-describedby="signup-status"
              style={{
                ...abs(82, field.y + 8, 290, 44),
                border: "none",
                outline: "none",
                background: "transparent",
                ...txt(14, 16.8, INK),
              }}
            />
          ) : (
            // The 6-digit code. `one-time-code` is what lets iOS and Android
            // offer the digits straight from the notification, and the
            // numeric keypad is the difference between six taps and a hunt
            // through the alphabet keyboard.
            <input
              id="signup-code"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => {
                // Digits only, capped at 6 — so pasting "code: 123456"
                // straight out of the email still works. Deliberately NOT
                // maxLength: the browser truncates raw characters before
                // this handler runs, which would eat the digits instead.
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                setError(null);
              }}
              placeholder={field.hint}
              aria-label="Verification code"
              style={{
                ...abs(89, field.y + 8, 195, 44),
                border: "none",
                outline: "none",
                background: "transparent",
                ...txt(14, 16.8, INK),
              }}
            />
          )}
          {field.sendCode ? (
            <>
              <div
                style={{ ...abs(295, field.y + 10, 1, 40), background: SAND }}
              />
              <button
                type="button"
                disabled={!sendReady}
                onClick={sendCode}
                style={{
                  // Figma's AUTH-SIGNUP-SEND-CODE-BTN box: 84×48 at x307,
                  // not just the text — the whole box is the tap target.
                  ...abs(307, field.y + 6, 84, 48),
                  border: "none",
                  background: "transparent",
                  cursor: sendReady ? "pointer" : "default",
                  // The design ships no disabled state, so we borrow the frame's own
                  // hint colour rather than inventing a new one.
                  ...txt(13, 15.6, sendReady ? INK : HINT, "center"),
                  fontWeight: 500,
                }}
              >
                {/* "Resend" after a successful send: the same control, but
                    labelled for what it now does. */}
                {phase === "sending"
                  ? "Sending…"
                  : phase === "sent"
                    ? "Resend"
                    : "Send code"}
              </button>
            </>
          ) : null}
        </div>
      ))}

      {/* Status slot — the frame leaves the card empty between the code field
          (ends y534) and the checkbox (y772), so the card's messages live at
          the top of that gap. Carries the email guidance and validation today;
          the send/verify steps will report here too. */}
      <div
        id="signup-status"
        role="status"
        style={{
          ...abs(32, 546, 366),
          ...txt(12, 14.4, status?.tone ?? HINT),
          whiteSpace: "normal",
        }}
      >
        {status?.text ?? ""}
      </div>

      {/* Consent (1523:3338/3339) — a real checkbox at the frame's own 18×18
          box. `appearance: none` strips the platform control so the box stays
          the design's; the ✓ is drawn by CSS in the style block above, the
          same system glyph the login band uses (07-31 owner decision). */}
      <input
        id="signup-agree"
        type="checkbox"
        checked={agreed}
        onChange={(e) => setAgreed(e.target.checked)}
        style={{
          ...abs(32, 772, 18, 18),
          appearance: "none",
          margin: 0,
          background: SHEET,
          boxShadow: `inset 0 0 0 1px ${SAND}`,
          borderRadius: 2,
          cursor: "pointer",
        }}
      />
      {/* Only the plain words carry the <label>: a label forwards every click
          to its checkbox, so wrapping the links would tick the box on the way
          to the policy page. The links are plain anchors beside it. */}
      <div style={{ ...abs(58, 773.8, 315), ...txt(12, 14.4, INK) }}>
        <label htmlFor="signup-agree" style={{ cursor: "pointer" }}>
          I agree to the{" "}
        </label>
        <Link href="/policies/terms-of-service" style={{ color: INK }}>
          Terms
        </Link>
        <label htmlFor="signup-agree" style={{ cursor: "pointer" }}>
          {" "}
          &amp;{" "}
        </label>
        <Link href="/policies/privacy" style={{ color: INK }}>
          Privacy Policy
        </Link>
      </div>

      {/* CONTINUE (2436:377) — gated on consent (owner instruction). Its
          prototype action is a NAVIGATE with a null destination and the code
          field is not live yet, so tapping it has nothing to submit; the
          verify step is what gives this button its job. */}
      <button
        type="button"
        disabled={!agreed || phase === "verifying"}
        onClick={continueWithCode}
        style={{
          ...abs(32, 829, 366, 48),
          background: INK,
          borderRadius: 10,
          border: "none",
          cursor: agreed ? "pointer" : "default",
          // The design ships no disabled state for this button either; dimming
          // the whole pill reads as "not yet" without inventing a new colour.
          opacity: agreed ? 1 : 0.45,
        }}
      >
        <span
          style={{
            position: "absolute",
            left: 10,
            right: 10,
            top: 16.2,
            ...txt(13, 15.6, CREAM, "center"),
            fontWeight: 500,
          }}
        >
          {phase === "verifying" ? "SIGNING YOU IN…" : "CONTINUE"}
        </span>
      </button>
    </ScaleFrame>
  );
}
