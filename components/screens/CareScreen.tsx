"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * /care — pixel-exact implementation of the four "mepage-customer care"
 * frames (care01 1523:3611 hot-topics, care02 1523:3540 order-issues,
 * care03 1523:3753 promotions, care04 1523:3682 after-sales; 07-29
 * delivery). One page, four Help-Center tab states: the active tab label,
 * the gold indicator, and that tab's 8 FAQ rows. ?tab= still deep-links a
 * tab (?tab=order-issues from the order flow keeps working — implements
 * ORDER-DETAIL-CONTACT-SUPPORT).
 *
 * Gone from the 07-27 import, per the 07-29 frames: the five-tab glyph nav
 * band (no nav at all now), and the "Support request status" row with its
 * 52px shift. New: the concierge mascot art in the hero, the 返回 back art,
 * and wired shortcuts — "Request after-sales" → /account/returns and
 * "Account security" → /account/security join "Track logistics" →
 * /orders/track and "Contact support" / "Chat with us" → /care/chat. The
 * remaining shortcuts and the FAQ rows stay inert (route-table rule).
 */

import { useState } from "react";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { ScaleFrame } from "@/components/chrome";
import { Glyph } from "@/components/screens/glyphs";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";

const INK = "#3B2F2F";
const SAND = "#E5D9C9";
const GOLD = "#D4AF37";
const CREAM = "#FFF6EC";
const SHEET = "#FFFEFB";
const DIM = "#7A737A";

export type CareTab = "hot-topics" | "order-issues" | "promotions" | "after-sales";

/** 1523:3638…3642 — labels at fixed x; the gold indicator is 52×3 and its
 * [x, y] comes from each frame (care04 sits 1px lower — verbatim). */
const TABS: Array<{ key: CareTab; label: string; x: number; w: number; indicator: [number, number] }> = [
  { key: "hot-topics", label: "Hot topics", x: 22, w: 100, indicator: [44, 557] },
  { key: "order-issues", label: "Order issues", x: 122, w: 100, indicator: [140, 557] },
  { key: "promotions", label: "Promotions", x: 222, w: 100, indicator: [236, 557] },
  { key: "after-sales", label: "After-sales", x: 322, w: 88, indicator: [331, 558] },
];

/**
 * Per-tab FAQ rows. The pinned 07-29 snapshot briefly showed one identical
 * list on all four frames; the live frames restored the per-tab lists the
 * same day (verified against fresh renders), so they stay per-tab.
 */
const FAQS: Record<CareTab, string[]> = {
  "hot-topics": [
    "The item I received is damaged",
    "Request an invoice",
    "Apply for a return",
    "How can I track my shipment?",
    "Check return policy",
    "Check return / exchange progress",
    "Contact logistics provider",
    "Payment verification timing",
  ],
  "order-issues": [
    "Where is my order?",
    "Change or cancel my order",
    "Order status not updated",
    "Wrong shipping address",
    "I didn’t receive an order confirmation",
    "Can I combine or split orders?",
    "Why was my order canceled?",
    "Delivered but not received",
  ],
  promotions: [
    "How do I use a promo code?",
    "Why isn’t my discount code working?",
    "Can I combine promotions?",
    "Why didn’t my gift with purchase appear?",
    "When will reward points update?",
    "How do member benefits work?",
    "Promotion terms and exclusions",
    "Can a discount be applied after checkout?",
  ],
  "after-sales": [
    "How do I request a return?",
    "Return policy and eligibility",
    "Do I need to pay return shipping?",
    "How long do refunds take?",
    "How do I exchange an item?",
    "Received a damaged or wrong item",
    "Check return / exchange progress",
    "Product care and warranty",
  ],
};

// 1108:123…138 — the eight service shortcuts (icons: Figma SVG exports).
const SHORTCUTS: Array<{ icon: string; ink: [number, number]; label: string; href?: string }> = [
  { icon: "1108-123", ink: [20, 20], label: "Shipping\nreminder" },
  { icon: "1108-125", ink: [24, 24], label: "Request\nafter-sales", href: "/account/returns" },
  { icon: "1108-127", ink: [18, 18], label: "Change\naddress" },
  { icon: "1108-129", ink: [15, 15], label: "Track\nlogistics", href: "/orders/track" },
  { icon: "1108-131", ink: [20, 20], label: "Invoice\nservice" },
  { icon: "1108-133", ink: [16, 19], label: "Account\nsecurity", href: "/account/security" },
  { icon: "1108-135", ink: [13, 14], label: "Contact\nsupport", href: "/care/chat" },
  { icon: "1108-137", ink: [24, 8], label: "Payment\nissue" },
];


export function CareScreen({ initialTab = "hot-topics" }: { initialTab?: CareTab }) {
  const [tab, setTab] = useState<CareTab>(initialTab);

  return (
    <ScaleFrame height={932} background={CREAM} fontClass={notoSC.className} nav={false}>
      <BackButton fallback="/account" src="/veloria/screens/1523-3679.png" style={abs(0, 16, 45, 48)} />
      <div className={playfair.className} style={{ ...abs(101, 20.7, 230), ...txt(29, 38.66, INK, "center"), fontWeight: 600 }}>
        Customer Care
      </div>

      {/* hero card — "Chat with us" lands on the CARE-SUPPORT-CHAT mock
          (07-28); a real support channel is still a tracked follow-up */}
      <div style={{ ...abs(16, 76, 398, 158), background: SHEET, boxShadow: `inset 0 0 0 1px ${SAND}`, borderRadius: 14 }} />
      <div className={playfair.className} style={{ ...abs(34, 90.7, 255), ...txt(29, 38.66, INK), fontWeight: 600 }}>
        How can we help?
      </div>
      <div style={{ ...abs(34, 136.4, 260, 52), ...txt(13, 15.6, INK), whiteSpace: "pre-line" }}>
        {"We’re here for you.\nOur support team is ready to assist."}
      </div>
      <img src="/veloria/screens/1523-3681.png" alt="" width={104} height={104} style={{ ...abs(288, 86, 104, 104), display: "block" }} />
      <div style={{ ...abs(34, 182.5, 150), ...txt(12.5, 15, "#1F8533"), fontWeight: 500 }}>●&nbsp;&nbsp;Online now</div>
      <div style={{ ...abs(34, 204, 200), ...txt(10.5, 12.6, INK) }}>Average reply within a few minutes</div>
      <Link href="/care/chat" style={{ ...abs(234, 180, 164, 38), background: INK, borderRadius: 8, display: "block" }}>
        <span style={{ position: "absolute", left: 6, right: 6, top: 11, ...txt(13, 15.6, CREAM, "center"), fontWeight: 500 }}>Chat with us</span>
      </Link>

      {/* service shortcuts */}
      <div style={{ ...abs(16, 246, 398, 220), background: SHEET, boxShadow: `inset 0 0 0 1px ${SAND}`, borderRadius: 14 }} />
      <div className={playfair.className} style={{ ...abs(30, 256, 210), ...txt(20, 26.66, INK), fontWeight: 500 }}>
        Service shortcuts
      </div>
      {SHORTCUTS.map((cut, i) => {
        const x = [24, 122, 220, 318][i % 4];
        const y = i < 4 ? 292 : 372;
        const body = (
          <>
            <Glyph src={cut.icon} x={0} y={0} w={88} h={34} ink={cut.ink} />
            <span style={{ position: "absolute", left: 0, top: 37.2, width: 88, ...txt(11.5, 13.8, INK, "center"), whiteSpace: "pre-line", display: "block" }}>
              {cut.label}
            </span>
          </>
        );
        return cut.href ? (
          <Link key={cut.label} href={cut.href} style={{ ...abs(x, y, 88, 72), display: "block" }}>
            {body}
          </Link>
        ) : (
          <div key={cut.label} style={abs(x, y, 88, 72)}>
            {body}
          </div>
        );
      })}

      {/* help center */}
      <div className={playfair.className} style={{ ...abs(20, 483, 200), ...txt(21, 27.99, INK), fontWeight: 600 }}>
        Help Center
      </div>
      {TABS.map((t) => {
        const active = tab === t.key;
        return (
          <button
            key={t.key}
            type="button"
            aria-pressed={active}
            onClick={() => setTab(t.key)}
            className={playfair.className}
            style={{ ...abs(t.x, 529, t.w, 26), border: 0, padding: 0, background: "transparent", cursor: "pointer" }}
          >
            <span style={{ position: "absolute", left: 0, right: 0, top: 5, ...txt(13, 17.33, active ? INK : DIM, "center"), fontWeight: active ? 600 : 500 }}>
              {t.label}
            </span>
          </button>
        );
      })}
      {(() => {
        const [ix, iy] = TABS.find((t) => t.key === tab)!.indicator;
        return <div style={{ ...abs(ix, iy, 52, 3), background: GOLD, borderRadius: 2 }} />;
      })()}

      <div style={{ ...abs(16, 577, 398, 242), background: SHEET, boxShadow: `inset 0 0 0 1px ${SAND}`, borderRadius: 14 }} />
      {FAQS[tab].map((question, i) => {
        const y = 594 + i * 27;
        return (
          <div key={question}>
            <div style={{ ...abs(31, y, 24, 26), ...txt(12, 26, GOLD, "center"), fontWeight: 500 }}>?</div>
            <div style={{ ...abs(62, y + 6.7, 310), ...txt(10.5, 12.6, INK), overflow: "hidden", textOverflow: "ellipsis" }}>{question}</div>
            <div style={{ ...abs(382, y, 24, 26), ...txt(19, 26, INK, "center") }}>›</div>
            {i < 7 ? <div style={{ ...abs(32, y + 26, 370, 1), background: SAND }} /> : null}
          </div>
        );
      })}

      {/* trust card */}
      <div style={{ ...abs(16, 840, 398, 54), background: SHEET, boxShadow: `inset 0 0 0 1px ${SAND}`, borderRadius: 14 }} />
      <Glyph src="1108-182" x={26} y={847} w={34} h={36} ink={[17, 17]} />
      <div style={{ ...abs(64, 852.4, 300, 42), ...txt(10.5, 12.6, INK), whiteSpace: "pre-line" }}>
        {"We appreciate your trust in GoldRose.\nYour satisfaction means everything to us."}
      </div>
    </ScaleFrame>
  );
}
