"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * The Business & Partnerships screen, imported pixel-exact from VELORIA frame
 * 74:55 ("Business · Procurement", 430×1614, 已完成). Seven design modules
 * stack on a 430-wide canvas: 01 Procurement Hero, 02 Account Type Tabs,
 * 03 Procurement Sign In, 04 Procurement Services, 05 Purchasing Needs,
 * 06 Three-Step Process, 07 MORI Business Help. Module 13 (bottom nav) is the
 * shared BottomNav, with the account tab active exactly as in 74:53.
 *
 * B2B has no backend of its own. Per the owner (2026-07-25) the V1 is
 * "static + email the request": picking a need and pressing SUBMIT REQUEST or
 * BOOK CONSULTATION posts to /api/business-request, which emails the owner.
 * Sign-in reuses the storefront's emailed one-time code — there is no
 * separate procurement account system.
 *
 * See docs/ixd/login-import.md for how this was produced from the sources.
 */

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { abs, txt, ScaleFrame } from "@/components/veloria";
import { FadeLink } from "@/components/PageFade";
import { BackButton } from "@/components/BackButton";
import { cormorant, inter } from "@/lib/fonts";
import { supabaseBrowserAuthClient } from "@/lib/supabase/browser-auth";
import { INK, MUTED, CARD, HAIRLINE, CANVAS, NB, Glyph } from "@/components/login/shared";

const A = "/veloria/business";

/* ---------- 01 · Procurement Hero (77:53, 430×310) ---------- */

function ProcurementHero() {
  return (
    <>
      <img
        src={`${A}/77-56.png`}
        alt="GoldRose gift boxes for business orders"
        style={{ ...abs(220, 68, 210, 242), display: "block", objectFit: "cover" }}
      />
      <div
        className={cormorant.className}
        style={{ ...abs(22, 80, 192, 112), ...txt(34, 28, INK), whiteSpace: "pre-line", fontWeight: 600 }}
      >
        {"Better purchasing\nfor important moments"}
      </div>
      <div
        style={{ ...abs(24, 202, 180, 54), ...txt(11.5, 18, INK), fontWeight: 500, whiteSpace: "normal" }}
      >
        Bulk orders, corporate gifting, wedding events and wholesale partnerships.
      </div>
      <BackButton fallback="/account" src="/veloria/home/56-71.png" style={abs(16, 24, 40, 43)} />
      <Link href="/" style={{ ...abs(152, 24, 136, 40), display: "block" }} aria-label="GoldRose home">
        <img
          src="/veloria/home/549-90.png"
          alt="GoldRose"
          style={{ display: "block", width: 136, height: 40 }}
        />
      </Link>
    </>
  );
}

/* ---------- 02 · Account Type Tabs (77:59, 398×54 @ 16,324) ---------- */

function AccountTypeTabs() {
  return (
    <div style={{ ...abs(16, 324, 398, 54), background: CARD, borderRadius: 12 }}>
      {/* Cross-fades the canvas on the way back to the shopping frame, the
          same treatment the bottom-nav tabs get (owner, 2026-07-26). */}
      <FadeLink
        href="/account"
        style={{ ...abs(0, 0, 196, 54), background: CARD, borderRadius: 10, display: "block" }}
        ariaLabel="Gift Shopping"
      >
        <Glyph src={`${A}/77-61.svg`} left={48} top={22} width={100} height={13} />
      </FadeLink>
      {/* Business & Partnerships — the active tab on this frame. */}
      <div
        style={{ ...abs(202, 0, 196, 54), background: INK, borderRadius: 12 }}
        aria-current="page"
      >
        <Glyph src={`${A}/77-63.svg`} left={17} top={22} width={163} height={13} />
        <span className="sr-only">Business &amp; Partnerships</span>
      </div>
    </div>
  );
}

/* ---------- 04 · Procurement Services (77:86, 398×184 @ 16,676) ---------- */

// gx/gy/gw/gh are measured ink boxes (see Glyph), not the design's node boxes.
const SERVICES = [
  { x: 14, glyph: "77-90", gx: 46, gy: 66, gw: 23, gh: 23, title: "Dedicated Quotes", tx: 19, desc: "Pricing by volume and need", dx: 20 },
  { x: 108.67, glyph: "77-94", gx: 143, gy: 69, gw: 18, gh: 18, title: "Sample Requests", tx: 113.67, desc: "Apply for product samples", dx: 114.67 },
  { x: 203.33, glyph: "77-98", gx: 237, gy: 69, gw: 18, gh: 18, title: "Custom Service", tx: 208.33, desc: "Engraving, cards and packaging", dx: 209.33 },
  { x: 298, glyph: "77-102", gx: 331, gy: 68, gw: 20, gh: 20, title: "Business Support", tx: 303, desc: "Dedicated end-to-end service", dx: 304 },
];

function ProcurementServices() {
  return (
    <div style={{ ...abs(16, 676, 398, 184), background: CARD, borderRadius: 14 }}>
      <div style={{ ...abs(14, 16, 266, 18), ...txt(15, 18.15, INK), fontWeight: 700 }}>
        Procurement &amp; partnership services
      </div>
      {SERVICES.map((s) => (
        <div key={s.title}>
          <div style={{ ...abs(s.x, 46, 86, 122), background: CARD, borderRadius: 12 }} />
          <Glyph src={`${A}/${s.glyph}.svg`} left={s.gx} top={s.gy} width={s.gw} height={s.gh} />
          <div
            style={{ ...abs(s.tx, 97, 76, 26), ...txt(10.5, 12.71, INK, "center"), fontWeight: 600, whiteSpace: "normal" }}
          >
            {s.title}
          </div>
          <div
            style={{ ...abs(s.dx, 128, 74, 23), ...txt(8.3, 11.5, MUTED, "center"), fontWeight: 400, whiteSpace: "normal" }}
          >
            {s.desc}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- 05 · Purchasing Needs (77:105, 398×290 @ 16,874) ---------- */

const NEEDS = [
  { x: 14, y: 46, glyph: "77-109", gx: 63, gy: 65, gw: 15, gh: 15, label: "Corporate Gifts", tx: 19, ty: 88.5 },
  { x: 143, y: 46, glyph: "77-112", gx: 192, gy: 65, gw: 15, gh: 15, label: "Employee Benefits", tx: 148, ty: 88.5 },
  { x: 272, y: 46, glyph: "77-115", gx: 319, gy: 65, gw: 18, gh: 16, label: "Wedding Events", tx: 277, ty: 88.5 },
  { x: 14, y: 126, glyph: "77-119", gx: 62, gy: 145, gw: 16, gh: 15, label: "Client Appreciation", tx: 19, ty: 168.5 },
  { x: 143, y: 126, glyph: "77-122", gx: 192, gy: 145, gw: 15, gh: 15, label: "Retail Wholesale", tx: 148, ty: 168.5 },
  { x: 272, y: 126, glyph: "77-125", gx: 322, gy: 146, gw: 13, gh: 15, label: "Distribution", tx: 277, ty: 168.5 },
  { x: 14, y: 206, glyph: "77-129", gx: 63, gy: 225, gw: 18, gh: 17, label: "Creator Partnerships", tx: 19, ty: 248.5 },
  { x: 143, y: 206, glyph: "77-132", gx: 190, gy: 223, gw: 20, gh: 20, label: "Sample Orders", tx: 148, ty: 248.5 },
  { x: 272, y: 206, glyph: "77-135", gx: 314, gy: 231, gw: 28, gh: 7, label: "Other Needs", tx: 277, ty: 248.5 },
];

function PurchasingNeeds({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (need: string) => void;
}) {
  return (
    <div style={{ ...abs(16, 874, 398, 290), background: CARD, borderRadius: 14 }}>
      <div style={{ ...abs(14, 16, 329, 18), ...txt(15, 18.15, INK), fontWeight: 700 }}>
        Choose your purchasing or partnership need
      </div>
      {NEEDS.map((n) => {
        const isSelected = selected === n.label;
        return (
          <button
            key={n.label}
            type="button"
            onClick={() => onSelect(n.label)}
            aria-pressed={isSelected}
            style={{
              ...abs(n.x, n.y, 112, 68),
              background: CARD,
              borderRadius: 10,
              border: "none",
              padding: 0,
              cursor: "pointer",
              // The design has no selected state; a darker hairline is the
              // lightest possible way to show the choice took effect.
              boxShadow: `inset 0 0 0 ${isSelected ? 2 : 1}px ${isSelected ? INK : HAIRLINE}`,
            }}
          >
            <Glyph
              src={`${A}/${n.glyph}.svg`}
              left={n.gx - n.x}
              top={n.gy - n.y}
              width={n.gw}
              height={n.gh}
            />
            <span
              style={{
                position: "absolute",
                left: n.tx - n.x,
                top: n.ty - n.y,
                width: 102,
                ...txt(9.5, 11.5, INK, "center"),
                fontWeight: 500,
                whiteSpace: "normal",
              }}
            >
              {n.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- 06 · Three-Step Process (77:137, 398×204 @ 16,1178) ---------- */

const STEPS = [
  { x: 14, n: "1", ny: 64, title: "Submit needs", ty: 83, desc: "Basic details and quantity", dy: 100, dh: 10 },
  { x: 143, n: "2", ny: 59, title: "Discuss a plan", ty: 78, desc: "A specialist prepares options", dy: 95, dh: 20 },
  { x: 272, n: "3", ny: 59, title: "Launch service", ty: 78, desc: "Approved accounts get support", dy: 95, dh: 20 },
];

function ThreeStepProcess({
  busy,
  onSubmit,
}: {
  busy: null | "request" | "consultation";
  onSubmit: (kind: "request" | "consultation") => void;
}) {
  return (
    <div style={{ ...abs(16, 1178, 398, 204), background: CARD, borderRadius: 14 }}>
      <div style={{ ...abs(14, 16, 198, 18), ...txt(15, 18.15, INK), fontWeight: 700 }}>
        Three simple steps to start
      </div>
      {STEPS.map((s) => (
        <div key={s.n}>
          <div
            style={{ ...abs(s.x + 44, s.ny, 24, 15), ...txt(12, 14.52, "#D4AF37", "center"), fontWeight: 700 }}
          >
            {s.n}
          </div>
          <div
            style={{ ...abs(s.x + 2, s.ty, 108, 13), ...txt(11, 13.31, INK, "center"), fontWeight: 600 }}
          >
            {s.title}
          </div>
          <div
            style={{ ...abs(s.x + 2, s.dy, 108, s.dh), ...txt(8.5, 10.29, MUTED, "center"), fontWeight: 400, whiteSpace: "normal" }}
          >
            {s.desc}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onSubmit("request")}
        disabled={busy !== null}
        style={{
          ...abs(14, 140, 180, 48),
          background: INK,
          borderRadius: 10,
          border: "none",
          cursor: busy ? "default" : "pointer",
        }}
      >
        <span style={{ ...txt(12.5, 15.13, CANVAS), fontWeight: 600, display: "block", textAlign: "center" }}>
          {busy === "request" ? "SENDING…" : `SUBMIT REQUEST${NB}${NB}›`}
        </span>
      </button>
      <button
        type="button"
        onClick={() => onSubmit("consultation")}
        disabled={busy !== null}
        style={{
          ...abs(204, 140, 180, 48),
          background: CARD,
          borderRadius: 10,
          border: "none",
          boxShadow: `inset 0 0 0 1px ${INK}`,
          cursor: busy ? "default" : "pointer",
        }}
      >
        <span style={{ ...txt(12.5, 15.13, INK), fontWeight: 600, display: "block", textAlign: "center" }}>
          {busy === "consultation" ? "SENDING…" : `BOOK CONSULTATION${NB}${NB}›`}
        </span>
      </button>
    </div>
  );
}

/* ---------- 07 · MORI Business Help (77:157, 398×152 @ 16,1396) ---------- */

function MoriBusinessHelp({ onAsk }: { onAsk: () => void }) {
  return (
    <div
      style={{
        ...abs(16, 1396, 398, 152),
        background: CARD,
        borderRadius: 14,
        boxShadow: `inset 0 0 0 1px ${HAIRLINE}`,
      }}
    >
      <img
        src={`${A}/77-158.png`}
        alt=""
        style={{ ...abs(0, 0, 142, 152), display: "block", objectFit: "cover" }}
      />
      <div style={{ ...abs(150, 24, 230, 17), ...txt(14, 16.94, INK), fontWeight: 700 }}>
        Not sure which partnership fits?
      </div>
      <div
        style={{ ...abs(150, 52, 228, 32), ...txt(10.5, 16, INK), fontWeight: 400, whiteSpace: "normal" }}
      >
        MORI can recommend the right purchasing path and answer your questions.
      </div>
      <button
        type="button"
        onClick={onAsk}
        style={{
          ...abs(150, 103, 126, 38),
          background: CARD,
          borderRadius: 9,
          border: "none",
          boxShadow: `inset 0 0 0 1px ${INK}`,
          cursor: "pointer",
        }}
      >
        <span style={{ ...txt(11, 13.31, INK), fontWeight: 600, display: "block", textAlign: "center" }}>
          {`ASK MORI${NB}${NB}›`}
        </span>
      </button>
    </div>
  );
}

/* ---------- Page ---------- */

/**
 * The Business & Partnerships screen. Reached from the account-type tabs on
 * the sign-in screen; the Gift Shopping tab links back to /account.
 *
 * @returns The pixel-exact 430-wide procurement canvas.
 */
export function BusinessLogin() {
  const supabase = useMemo(() => supabaseBrowserAuthClient(), []);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState<null | "request" | "consultation">(null);
  const [need, setNeed] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const codeStep = phase === "code";

  async function submitAuth() {
    if (!supabase) {
      setError("Sign-in isn’t switched on in this environment yet.");
      return;
    }
    setBusy(true);
    setError(null);
    if (codeStep) {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: "email",
      });
      setBusy(false);
      if (verifyError) setError("That code didn’t match. Request a new one if it has expired.");
      return;
    }
    const { error: sendError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (sendError) {
      setError("We couldn’t send that code. Check the address and try again.");
      return;
    }
    setPhase("code");
  }

  /** Post the enquiry; the owner receives it by email (there is no B2B table). */
  async function sendEnquiry(kind: "request" | "consultation") {
    setNotice(null);
    setError(null);
    if (!email.trim()) {
      setError("Add your business email above so we can reply.");
      emailRef.current?.focus();
      return;
    }
    setSending(kind);
    try {
      const response = await fetch("/api/business-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), need: need ?? undefined, kind }),
      });
      const body = await response.json();
      if (!response.ok || !body.ok) {
        setError(body.error ?? "Could not send that just now — please try again.");
      } else {
        setNotice(
          kind === "consultation"
            ? "Thanks — we’ll be in touch to book your consultation."
            : "Thanks — your request is with our team.",
        );
      }
    } catch {
      setError("Could not send that just now — please try again.");
    }
    setSending(null);
  }

  return (
    <ScaleFrame height={1555} background={CANVAS} fontClass={inter.className} navActive="Account">
      <ProcurementHero />
      <AccountTypeTabs />

      {/* 03 · Procurement Sign In (77:64, 398×270 @ 16,392) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitAuth();
        }}
        style={{
          ...abs(16, 392, 398, 270),
          background: CARD,
          borderRadius: 14,
          boxShadow: `inset 0 0 0 1px ${HAIRLINE}`,
        }}
      >
        <div
          style={{ ...abs(16, 20, 274, 36), ...txt(15, 18.15, INK), fontWeight: 700, whiteSpace: "pre-line" }}
        >
          {codeStep
            ? "Enter your verification code"
            : "Have a procurement account?\nSign in for dedicated service"}
        </div>
        <div
          style={{
            ...abs(16, 72, 366, 52),
            background: CARD,
            borderRadius: 9,
            boxShadow: `inset 0 0 0 1px ${HAIRLINE}`,
          }}
        >
          {/* Same ✉ node as 74:53, same size — reuse rather than re-export. */}
          <img
            src="/veloria/login/76-69.png"
            alt=""
            style={{ ...abs(14, 16.5, 19, 19), display: "block" }}
          />
          <input
            ref={emailRef}
            type={codeStep ? "text" : "email"}
            inputMode={codeStep ? "numeric" : "email"}
            autoComplete={codeStep ? "one-time-code" : "email"}
            required
            disabled={busy}
            value={codeStep ? code : email}
            onChange={(e) => (codeStep ? setCode(e.target.value) : setEmail(e.target.value))}
            placeholder={codeStep ? "6-digit code" : "Enter your business email"}
            aria-label={codeStep ? "Verification code" : "Business email"}
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
        <button
          type="submit"
          disabled={busy}
          style={{
            ...abs(16, 138, 366, 50),
            background: INK,
            borderRadius: 10,
            border: "none",
            cursor: busy ? "default" : "pointer",
          }}
        >
          <span
            style={{ ...txt(12.5, 15.13, CANVAS), fontWeight: 600, display: "block", textAlign: "center" }}
          >
            {busy ? "SENDING…" : codeStep ? "VERIFY AND SIGN IN" : "SEND VERIFICATION CODE"}
          </span>
        </button>
        <div
          style={{
            ...abs(16, 202, 366, 12),
            ...txt(10, 12.1, error ? "#B3261E" : notice ? INK : MUTED, "center"),
            fontWeight: 400,
            whiteSpace: "normal",
          }}
        >
          {error ?? notice ?? "We’ll send a one-time verification code to your email."}
        </div>
        <div style={abs(16, 228, 366, 24)}>
          <span style={{ ...abs(29, 5.5, 135, 13), ...txt(11, 13.31, MUTED), fontWeight: 400 }}>
            No procurement account?
          </span>
          <button
            type="button"
            onClick={() => sendEnquiry("request")}
            style={{
              ...abs(170, 4.5, 167, 15),
              ...txt(12, 14.52, INK),
              fontWeight: 600,
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            {`Submit a purchase request${NB}${NB}›`}
          </button>
        </div>
      </form>

      <ProcurementServices />
      <PurchasingNeeds selected={need} onSelect={setNeed} />
      <ThreeStepProcess busy={sending} onSubmit={sendEnquiry} />
      <MoriBusinessHelp onAsk={() => sendEnquiry("consultation")} />
    </ScaleFrame>
  );
}
