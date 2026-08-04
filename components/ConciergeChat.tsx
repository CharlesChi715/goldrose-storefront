"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * The concierge "chatbox" — the mascot sticker + dark green chat bar from the
 * VELORIA design, lifted out of the page canvas into a fixed overlay that
 * floats just above the bottom nav (same scaling technique as BottomNav).
 * Clicking it opens a PLACEHOLDER chat panel; a real chat widget will replace
 * the panel body later.
 *
 * Geometry preserved from the Figma frames (canvas coords): mascot 98×98 at
 * x=-3, 60px above the bar; bar 398×46 at x=16, sitting flush on the nav top.
 *
 * AI-TAG(AI-022): OWNER-DECISION — the new Ready-for-dev homepage frame
 * (2380:370) contains no MORI and no concierge modules at all; confirm
 * whether this chatbox is retired before importing it. See
 * /agent-delivery/sessions/figma-sync-chatbot-08-03-feat-figma-sync.md.
 */

import { useState } from "react";
import { inter } from "@/lib/fonts";
import { abs, txt } from "@/lib/figma-layout";
import NoCalcScale from "@/components/NoCalcScale";

const CHAT_H = 106; // mascot top → bar bottom

function ChatPanel({
  bottom,
  onClose,
}: {
  bottom: number;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-label="Gifting concierge chat"
      className={inter.className}
      style={{
        position: "absolute",
        left: 16,
        bottom,
        width: 398,
        background: "#FFFFFF",
        borderRadius: 18,
        boxShadow:
          "0 12px 40px rgba(6,55,46,0.28), 0 2px 8px rgba(6,55,46,0.12)",
        overflow: "hidden",
        pointerEvents: "auto",
      }}
    >
      <div style={{ position: "relative", height: 48, background: "#06372E" }}>
        <img
          src="/veloria/concierge-mascot.png"
          alt=""
          width={34}
          height={34}
          style={{
            position: "absolute",
            left: 12,
            top: 7,
            width: 34,
            height: 34,
          }}
        />
        <div
          style={{ ...abs(56, 9), ...txt(13, 16, "#FFFFFF"), fontWeight: 600 }}
        >
          Gifting Concierge
        </div>
        <div style={{ ...abs(56, 26), ...txt(10, 12, "#D9E3DE") }}>
          GoldRose · usually replies fast
        </div>
        <button
          type="button"
          aria-label="Close chat"
          onClick={onClose}
          style={{
            position: "absolute",
            right: 8,
            top: 8,
            width: 32,
            height: 32,
            border: "none",
            background: "rgba(255,255,255,0.08)",
            borderRadius: "50%",
            color: "#FFFFFF",
            fontSize: 16,
            lineHeight: "32px",
            cursor: "pointer",
            padding: 0,
          }}
        >
          ×
        </button>
      </div>
      <IdeaForm />
    </div>
  );
}

/**
 * Share-your-ideas form (owner request 2026-07-23): live chat is still
 * coming, so the panel collects visitor ideas/feedback instead — POSTed to
 * /api/feedback and read in the admin under Content → Ideas.
 */
function IdeaForm() {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState("");

  async function submit() {
    if (message.trim().length < 2 || state === "sending") {
      return;
    }
    setState("sending");
    setError("");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          ...(email.trim() ? { email: email.trim() } : {}),
          path: window.location.pathname,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        setError(result.error ?? "Could not send — please try again.");
        setState("error");
        return;
      }
      setState("sent");
    } catch {
      setError("Could not send — please try again.");
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div style={{ padding: "20px 18px 18px" }}>
        <div
          style={{
            background: "#F6F3EE",
            borderRadius: "14px 14px 14px 4px",
            padding: "10px 14px",
          }}
        >
          <div style={{ ...txt(12.5, 18, "#263530"), whiteSpace: "normal" }}>
            <strong>Thank you!</strong> Your idea is on its way to us — it truly
            helps us shape GoldRose. 🌹
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 18px 14px" }}>
      <div
        style={{
          background: "#F6F3EE",
          borderRadius: "14px 14px 14px 4px",
          padding: "10px 14px",
          maxWidth: 300,
        }}
      >
        <div style={{ ...txt(12.5, 18, "#263530"), whiteSpace: "normal" }}>
          Hi! Live chat is <strong>coming soon</strong> — meanwhile, we&apos;d
          love your
          <strong> ideas and feedback</strong>. What would make GoldRose better?
        </div>
      </div>
      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value.slice(0, 2000))}
        placeholder="Share an idea, a wish, or anything we should know…"
        rows={3}
        aria-label="Your idea"
        style={{
          marginTop: 12,
          width: "100%",
          boxSizing: "border-box",
          background: "#F6F3EE",
          border: "1px solid #E8E0D7",
          borderRadius: 12,
          padding: "10px 12px",
          resize: "none",
          outline: "none",
          fontFamily: "inherit",
          fontSize: 12.5,
          lineHeight: "18px",
          color: "#263530",
        }}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value.slice(0, 254))}
          placeholder="Email (optional)"
          inputMode="email"
          aria-label="Email (optional)"
          style={{
            flex: 1,
            minWidth: 0,
            height: 36,
            boxSizing: "border-box",
            background: "#F6F3EE",
            border: "1px solid #E8E0D7",
            borderRadius: 99,
            padding: "0 14px",
            outline: "none",
            fontFamily: "inherit",
            fontSize: 12,
            color: "#263530",
          }}
        />
        <button
          type="button"
          onClick={submit}
          disabled={state === "sending" || message.trim().length < 2}
          style={{
            height: 36,
            padding: "0 18px",
            background: "#C89236",
            border: "none",
            borderRadius: 99,
            color: "#FFFFFF",
            fontFamily: "inherit",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            opacity: state === "sending" || message.trim().length < 2 ? 0.6 : 1,
          }}
        >
          {state === "sending" ? "Sending…" : "Send"}
        </button>
      </div>
      {state === "error" ? (
        <div
          style={{
            ...txt(11, 15, "#B3473F"),
            whiteSpace: "normal",
            marginTop: 8,
          }}
        >
          {error}
        </div>
      ) : null}
      <div
        style={{
          ...txt(11, 15, "#7C7369"),
          whiteSpace: "normal",
          marginTop: 10,
        }}
      >
        Every rose ships with our gift guarantee.
      </div>
    </div>
  );
}

export function ConciergeChat({
  navClearance = 59,
  mascotOnTop = true,
  variant = "green",
  showMascot = true,
}: {
  /** Height of the fixed bottom nav (+gap) this floats above. */
  navClearance?: number;
  /** Paint order from the Figma frames: shop = mascot over bar, detail = bar over mascot. */
  mascotOnTop?: boolean;
  /** "green" = original palette; "brown" = the 2026-07-25 redesign palette. */
  variant?: "green" | "brown";
  /** Some Ready-for-dev frames use the chat bar without the mascot sticker. */
  showMascot?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const brown = variant === "brown";
  const stageH = CHAT_H + navClearance;

  const mascot = showMascot ? (
    // Clipped 3px on the left, exactly as the canvas clipped it in the design.
    <div
      key="mascot"
      style={{
        ...abs(0, 0, 95, 98),
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <img
        src="/veloria/concierge-mascot.png"
        alt=""
        width={98}
        height={98}
        style={{
          position: "absolute",
          left: -3,
          top: 0,
          width: 98,
          height: 98,
          maxWidth: "none",
        }}
      />
    </div>
  ) : null;

  const bar = (
    <button
      key="bar"
      type="button"
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={() => setOpen((v) => !v)}
      style={{
        ...abs(16, 60, 398, 46),
        display: "block",
        background: brown ? "#3B2F2F" : "#06372E",
        borderRadius: 18,
        border: "none",
        padding: 0,
        textAlign: "left",
        cursor: "pointer",
        pointerEvents: "auto",
      }}
    >
      <div
        className={inter.className}
        style={{
          ...abs(16, 8, 258),
          ...txt(12.5, 15.128, brown ? "#FFF6EC" : "#FFFFFF"),
          fontWeight: 500,
        }}
      >
        Need help choosing the perfect rose?
      </div>
      <div
        className={inter.className}
        style={{
          ...abs(16, brown ? 25 : 17, 258),
          ...txt(11, 13.312, brown ? "#FFF6EC" : "#D9E3DE"),
        }}
      >
        Ask our gifting concierge.
      </div>
      <div
        style={{
          ...abs(274, 2, 112, 42),
          background: brown ? "#D4AF37" : "#C89236",
          borderRadius: 99,
        }}
      >
        <div
          className={inter.className}
          style={{
            ...abs(14, 13, 84),
            ...txt(13, 15.733, brown ? "#FFF6EC" : "#FFFFFF"),
            fontWeight: 500,
          }}
        >
          {"CHAT NOW  ›"}
        </div>
      </div>
    </button>
  );

  return (
    <div className="figv-chatfix">
      <style>{`
        .figv-chatfix { position: fixed; left: 0; right: 0; bottom: 0; z-index: 11; pointer-events: none; }
        /* left calc, not margin:auto — see BottomNav: avoids right-drift on phones. */
        .figv-chatstage { position: relative; width: 430px; left: calc((100% - 430px) / 2); }
        @supports (transform: scale(calc(100vw / 430px))) {
          .figv-chatstage { transform: scale(calc(min(100vw, 480px) / 430px)); transform-origin: bottom center; }
        }
      `}</style>
      <div className="figv-chatstage" style={{ height: stageH }}>
        {open && (
          <ChatPanel bottom={stageH - 52} onClose={() => setOpen(false)} />
        )}
        {mascotOnTop ? [bar, mascot] : [mascot, bar]}
      </div>
      {/* No-calc fallback: scale the chat stage via zoom/transform. */}
      <NoCalcScale base={430} stage=".figv-chatstage" origin="bottom center" />
    </div>
  );
}
