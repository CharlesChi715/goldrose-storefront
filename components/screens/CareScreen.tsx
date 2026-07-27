"use client";
/**
 * ROLE OF THIS FILE
 * /care — pixel-exact implementation of the four Customer Care frames
 * (CARE-HOT-TOPICS 1097:117, CARE-ORDER-ISSUES 1097:116, CARE-PROMOTIONS
 * 1097:119, CARE-AFTER-SALES 1097:118, 07-27). The four frames are one page
 * in four tab states: the active Help-Center tab, its 8 FAQ rows, and — on
 * every tab except Hot topics — a "Support request status" row that pushes
 * the Help Center down 52px. Geometry, colors, fonts and copy verbatim from
 * the Figma REST data; ornamental glyphs are Figma's own SVG exports.
 *
 * Wired: the Help-Center tabs switch for real (?tab= deep-links them, so
 * the order-confirmation "CONTACT SUPPORT" card can land on order issues —
 * implements ORDER-DETAIL-CONTACT-SUPPORT), and the "Track logistics"
 * shortcut goes to /orders/track. Everything else — chat, the other
 * shortcuts, the FAQ rows, "Support request status" — renders pixel-exact
 * but stays inert until its target exists (route-table rule; there is no
 * support backend yet).
 *
 * These frames draw their OWN five-tab glyph nav (Home / Shop / Rose Deals /
 * Wholesale / Me, "Me" active) instead of the shared mascot bar — same
 * situation as C-1/C-2, so the screen opts out of the shared bar and draws
 * the band verbatim; the conflict stays flagged in docs/ixd/README.md.
 * "Rose Deals" has no route and stays inert.
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

const TABS: Array<{ key: CareTab; label: string; x: number; w: number; indicator: [number, number] }> = [
  { key: "hot-topics", label: "Hot topics", x: 22, w: 100, indicator: [44, 52] },
  { key: "order-issues", label: "Order issues", x: 122, w: 100, indicator: [140, 62] },
  { key: "promotions", label: "Promotions", x: 222, w: 100, indicator: [244, 72] },
  { key: "after-sales", label: "After-sales", x: 322, w: 88, indicator: [350, 58] },
];

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
  { icon: "1108-125", ink: [24, 24], label: "Request\nafter-sales" },
  { icon: "1108-127", ink: [18, 18], label: "Change\naddress" },
  { icon: "1108-129", ink: [15, 15], label: "Track\nlogistics", href: "/orders/track" },
  { icon: "1108-131", ink: [20, 20], label: "Invoice\nservice" },
  { icon: "1108-133", ink: [16, 19], label: "Account\nsecurity" },
  { icon: "1108-135", ink: [13, 14], label: "Contact\nsupport" },
  { icon: "1108-137", ink: [24, 8], label: "Payment\nissue" },
];

// 1108:184…195 — the frames' own five-tab glyph nav band.
const NAV = [
  { icon: "1108-185", ink: [9, 10] as [number, number], label: "Home", href: "/" },
  { icon: "1108-187", ink: [13, 13] as [number, number], label: "Shop", href: "/shop" },
  { icon: "1108-189", ink: [14, 14] as [number, number], label: "Rose Deals" },
  { icon: "1108-191", ink: [12, 12] as [number, number], label: "Wholesale", href: "/business/wholesale" },
  { icon: "1108-194", ink: [13, 13] as [number, number], label: "Me", href: "/account", active: true },
];

export function CareScreen({ initialTab = "hot-topics" }: { initialTab?: CareTab }) {
  const [tab, setTab] = useState<CareTab>(initialTab);
  const hot = tab === "hot-topics";
  // Hot topics has no "Support request status" row; everything below the
  // shortcuts sits 52px higher there (frame diff).
  const shift = hot ? -52 : 0;

  return (
    <ScaleFrame height={932} background={CREAM} fontClass={notoSC.className} nav={false}>
      <BackButton fallback="/account" src="/veloria/screens/1107-111.svg" style={abs(30, 43, 8, 16)} />
      <div className={playfair.className} style={{ ...abs(100, 27, 230, 48), ...txt(29, 38.66, INK, "center"), fontWeight: 600, paddingTop: 5 }}>
        Customer Care
      </div>

      {/* hero card — chat is a placeholder until a support channel exists */}
      <div style={{ ...abs(16, 76, 398, 158), background: SHEET, boxShadow: `inset 0 0 0 1px ${SAND}`, borderRadius: 14 }} />
      <div className={playfair.className} style={{ ...abs(34, 90.7, 255), ...txt(29, 38.66, INK), fontWeight: 600 }}>
        How can we help?
      </div>
      <div style={{ ...abs(34, 136.4, 260, 52), ...txt(13, 15.6, INK), whiteSpace: "pre-line" }}>
        {"We’re here for you.\nOur support team is ready to assist."}
      </div>
      <Glyph src="1108-116" x={312} y={92} w={76} h={64} ink={[39, 23]} />
      <div style={{ ...abs(34, 182.5, 150), ...txt(12.5, 15, "#1F8533"), fontWeight: 500 }}>●&nbsp;&nbsp;Online now</div>
      <div style={{ ...abs(34, 204, 200), ...txt(10.5, 12.6, INK) }}>Average reply within a few minutes</div>
      <div style={{ ...abs(234, 180, 164, 38), background: INK, borderRadius: 8 }}>
        <span style={{ position: "absolute", left: 6, right: 6, top: 11, ...txt(13, 15.6, CREAM, "center"), fontWeight: 500 }}>Chat with us</span>
      </div>

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

      {/* support request status — absent on Hot topics, as the frames draw it */}
      {hot ? null : (
        <>
          <div style={{ ...abs(16, 478, 398, 44), background: SHEET, boxShadow: `inset 0 0 0 1px ${SAND}`, borderRadius: 12 }} />
          <Glyph src="1108-140" x={28} y={482} w={38} h={36} ink={[17, 17]} />
          <div className={playfair.className} style={{ ...abs(68, 491, 280), ...txt(14, 18.66, INK), fontWeight: 500 }}>
            Support request status
          </div>
          <div style={{ ...abs(370, 485, 26, 30), ...txt(25, 30, INK, "center") }}>›</div>
        </>
      )}

      {/* help center */}
      <div className={playfair.className} style={{ ...abs(20, 535 + shift, 200), ...txt(21, 27.99, INK), fontWeight: 600 }}>
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
            style={{ ...abs(t.x, 567 + shift, t.w, 32), border: 0, padding: 0, background: "transparent", cursor: "pointer" }}
          >
            <span style={{ position: "absolute", left: 0, right: 0, top: 7, ...txt(13, 17.33, active ? INK : DIM, "center"), fontWeight: active ? 600 : 500 }}>
              {t.label}
            </span>
          </button>
        );
      })}
      {(() => {
        const [ix, iw] = TABS.find((t) => t.key === tab)!.indicator;
        return <div style={{ ...abs(ix, 598 + shift, iw, 3), background: GOLD, borderRadius: 2 }} />;
      })()}

      <div style={{ ...abs(16, 606 + shift, 398, 220), background: SHEET, boxShadow: `inset 0 0 0 1px ${SAND}`, borderRadius: 14 }} />
      {FAQS[tab].map((question, i) => {
        const y = 610 + shift + i * 27;
        return (
          <div key={question}>
            <div style={{ ...abs(27, y, 24, 26), ...txt(12, 26, GOLD, "center"), fontWeight: 500 }}>?</div>
            <div style={{ ...abs(58, y + 6, 310), ...txt(10.5, 12.6, INK), overflow: "hidden", textOverflow: "ellipsis" }}>{question}</div>
            <div style={{ ...abs(378, y + 1, 24, 26), ...txt(19, 22.8, INK, "center") }}>›</div>
            {i < 7 ? <div style={{ ...abs(28, y + 26, 370, 1), background: SAND }} /> : null}
          </div>
        );
      })}

      {/* trust card */}
      <div style={{ ...abs(16, 838 + shift, 398, 54), background: SHEET, boxShadow: `inset 0 0 0 1px ${SAND}`, borderRadius: 14 }} />
      <Glyph src="1108-182" x={26} y={844 + shift} w={34} h={36} ink={[17, 17]} />
      <div style={{ ...abs(64, 850.4 + shift, 300, 42), ...txt(10.5, 12.6, INK), whiteSpace: "pre-line" }}>
        {"We appreciate your trust in GoldRose.\nYour satisfaction means everything to us."}
      </div>

      {/* the frames' own glyph nav band (shared mascot bar opted out) */}
      <div style={{ ...abs(0, 900, 430, 32), background: SHEET, boxShadow: `inset 0 0 0 1px ${SAND}` }} />
      {NAV.map((item, i) => {
        const x = [4, 90, 176, 262, 348][i];
        const body = (
          <>
            {item.active ? <span style={{ ...abs(0, 0, 78, 32), background: "#FAEDE0", borderRadius: 16, display: "block" }} /> : null}
            <Glyph src={item.icon} x={16} y={-1} w={46} h={18} ink={item.ink} />
            <span style={{ position: "absolute", left: 0, top: 17.3, width: 78, ...txt(9.5, 11.4, INK, "center"), display: "block" }}>{item.label}</span>
          </>
        );
        return item.href ? (
          <Link key={item.label} href={item.href} style={{ ...abs(x, 900, 78, 32), display: "block" }}>
            {body}
          </Link>
        ) : (
          <div key={item.label} style={abs(x, 900, 78, 32)}>
            {body}
          </div>
        );
      })}
    </ScaleFrame>
  );
}
