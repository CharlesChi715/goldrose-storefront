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
 */

import { useState } from "react";
import { inter } from "@/lib/fonts";
import { abs, txt, NAV_STAGE_H } from "@/components/veloria";

const CHAT_H = 106; // mascot top → bar bottom
// Sit 4px above the floating nav (which is lifted 8px off the screen edge).
const DEFAULT_CLEARANCE = NAV_STAGE_H + 4;

function ChatPanel({ bottom, onClose }: { bottom: number; onClose: () => void }) {
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
        boxShadow: "0 12px 40px rgba(6,55,46,0.28), 0 2px 8px rgba(6,55,46,0.12)",
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
          style={{ position: "absolute", left: 12, top: 7, width: 34, height: 34 }}
        />
        <div style={{ ...abs(56, 9), ...txt(13, 16, "#FFFFFF"), fontWeight: 600 }}>
          Gifting Concierge
        </div>
        <div style={{ ...abs(56, 26), ...txt(10, 12, "#D9E3DE") }}>AUREÀ · usually replies fast</div>
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
            Hi! Our concierge chat is <strong>coming soon</strong> — we're putting the finishing
            touches on it.
          </div>
        </div>
        <div
          style={{
            ...txt(11, 15, "#7C7369"),
            whiteSpace: "normal",
            marginTop: 10,
          }}
        >
          In the meantime, every rose ships with our gift guarantee.
        </div>
        {/* Mock composer — disabled until the real widget lands */}
        <div
          style={{
            marginTop: 14,
            height: 40,
            background: "#F6F3EE",
            borderRadius: 99,
            position: "relative",
          }}
        >
          <div style={{ ...abs(16, 12), ...txt(12, 16, "#A9A29A") }}>Type a message…</div>
          <div
            style={{
              ...abs(326, 4, 32, 32),
              background: "#C89236",
              borderRadius: "50%",
              color: "#FFFFFF",
              fontSize: 14,
              lineHeight: "32px",
              textAlign: "center",
            }}
          >
            ›
          </div>
        </div>
      </div>
    </div>
  );
}

export function ConciergeChat({
  navClearance = DEFAULT_CLEARANCE,
  mascotOnTop = true,
}: {
  /** Height of the fixed bottom nav (+gap) this floats above. */
  navClearance?: number;
  /** Paint order from the Figma frames: shop = mascot over bar, detail = bar over mascot. */
  mascotOnTop?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const stageH = CHAT_H + navClearance;

  const mascot = (
    // Clipped 3px on the left, exactly as the canvas clipped it in the design.
    <div key="mascot" style={{ ...abs(0, 0, 95, 98), overflow: "hidden", pointerEvents: "none" }}>
      <img
        src="/veloria/concierge-mascot.png"
        alt=""
        width={98}
        height={98}
        style={{ position: "absolute", left: -3, top: 0, width: 98, height: 98, maxWidth: "none" }}
      />
    </div>
  );

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
        background: "#06372E",
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
        style={{ ...abs(16, 8, 258), ...txt(12.5, 15.128, "#FFFFFF"), fontWeight: 500 }}
      >
        Need help choosing the perfect rose?
      </div>
      <div className={inter.className} style={{ ...abs(16, 17, 258), ...txt(11, 13.312, "#D9E3DE") }}>
        Ask our gifting concierge.
      </div>
      <div style={{ ...abs(274, 2, 112, 42), background: "#C89236", borderRadius: 99 }}>
        <div
          className={inter.className}
          style={{ ...abs(14, 13, 84), ...txt(13, 15.733, "#FFFFFF"), fontWeight: 500 }}
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
        .figv-chatstage { position: relative; width: 430px; margin: 0 auto; }
        @supports (transform: scale(calc(100vw / 430px))) {
          .figv-chatstage { transform: scale(calc(min(100vw, 480px) / 430px)); transform-origin: bottom center; }
        }
      `}</style>
      <div className="figv-chatstage" style={{ height: stageH }}>
        {open && <ChatPanel bottom={stageH - 52} onClose={() => setOpen(false)} />}
        {mascotOnTop ? [bar, mascot] : [mascot, bar]}
      </div>
      {/* No-calc fallback: scale the chat stage via zoom/transform. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "(function(){try{" +
            "if(window.CSS&&CSS.supports&&CSS.supports('transform','scale(calc(100vw / 430px))'))return;" +
            "var nv=document.querySelector('.figv-chatstage');if(!nv)return;" +
            "function fit(){var s=Math.min(window.innerWidth,480)/430;" +
            "if('zoom' in nv.style){nv.style.zoom=s;}" +
            "else{nv.style.transform='scale('+s+')';nv.style.transformOrigin='bottom center';}}" +
            "fit();window.addEventListener('resize',fit);" +
            "}catch(e){}})();",
        }}
      />
    </div>
  );
}
