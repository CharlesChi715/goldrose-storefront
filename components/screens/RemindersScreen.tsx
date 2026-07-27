"use client";
/**
 * ROLE OF THIS FILE
 * /account/reminders — pixel-exact implementation of ACCOUNT-GIFT-REMINDERS
 * (1097:120, 07-27). Geometry, colors, fonts and copy verbatim from the
 * Figma REST data; the ♧ ♢ ✉ ▱ ◷ ⓘ glyphs are Figma's own SVG exports.
 *
 * Everything is the mock's own content: the three reminders, the "3
 * upcoming" count and the EST time zone are design placeholders — there is
 * no reminders backend yet (promotion-email consent and scheduling are a
 * tracked later feature). The two notification toggles and the Upcoming/All
 * tabs flip visually so the control states can be reviewed; Add / Edit /
 * Delete stay inert placeholders (docs/ixd/README.md).
 */

import { useState } from "react";
import { BackButton } from "@/components/BackButton";
import { ScaleFrame } from "@/components/chrome";
import { Glyph } from "@/components/screens/glyphs";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";

const INK = "#3B2F2F";
const SAND = "#E5D9C9";
const CREAM = "#FFF6EC";
const SHEET = "#FFFEFB";
const ROSE = "#DB596B";
const ROSE_BG = "#FFEBEB";
const PINK = "#F3C6D1";

// 1110:128…160 — the mock's three reminders, frame order.
const REMINDERS = [
  { month: "AUG", day: "25", title: "Anniversary with Emma", date: "Aug 25, 2025", meta: "7 days before  •  Email + SMS" },
  { month: "SEP", day: "03", title: "Mom’s Birthday", date: "Sep 03, 2025", meta: "5 days before  •  Email" },
  { month: "FEB", day: "14", title: "Valentine’s Day", date: "Feb 14, 2026", meta: "14 days before  •  Email + SMS" },
];

function Toggle({ y, on, onFlip, label }: { y: number; on: boolean; onFlip: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onFlip}
      style={{ ...abs(338, y, 48, 20), background: on ? ROSE : SAND, borderRadius: 10, border: 0, padding: 0, cursor: "pointer" }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: on ? 28 : 4,
          width: 16,
          height: 16,
          background: SHEET,
          borderRadius: 8,
          display: "block",
          transition: "left 120ms ease",
        }}
      />
    </button>
  );
}

export function RemindersScreen() {
  const [tab, setTab] = useState<"Upcoming" | "All">("Upcoming");
  const [email, setEmail] = useState(true);
  const [sms, setSms] = useState(true);

  return (
    <ScaleFrame height={932} background={CREAM} fontClass={notoSC.className} nav={false}>
      {/* header — ‹ back, ♧ mark, GOLDROSE wordmark, divider */}
      <BackButton fallback="/account" src="/veloria/screens/1107-111.svg" style={abs(32, 44, 8, 16)} />
      <Glyph src="1110-112" x={193} y={14} w={44} h={30} ink={[18, 17]} />
      <div style={{ ...abs(125, 42, 180), ...txt(20, 24, INK, "center"), fontWeight: 500 }}>GOLDROSE</div>
      <div style={{ ...abs(0, 84, 430, 1), background: SAND }} />

      <div className={playfair.className} style={{ ...abs(26, 106.7, 300), ...txt(32, 42.66, INK), fontWeight: 600 }}>
        Gift Reminders
      </div>
      <div style={{ ...abs(26, 155.5, 370), ...txt(12.5, 15, INK) }}>
        Never miss meaningful moments with timely reminders.
      </div>

      {/* summary card + Add reminder (placeholder — no backend) */}
      <div style={{ ...abs(26, 186, 378, 84), background: SHEET, boxShadow: `inset 0 0 0 1px ${SAND}`, borderRadius: 12 }} />
      <div style={{ ...abs(40, 204, 54, 48), background: ROSE_BG, borderRadius: 24 }} />
      <Glyph src="1110-119" x={50} y={208} w={34} h={40} ink={[18, 23]} />
      <div className={playfair.className} style={{ ...abs(108, 199, 160), ...txt(21, 28, INK), fontWeight: 600 }}>
        3 upcoming
      </div>
      <div style={{ ...abs(108, 234, 174), ...txt(10, 12, INK) }}>Stay ready for every special moment.</div>
      <div style={{ ...abs(292, 208, 100, 42), background: ROSE, borderRadius: 9 }}>
        <span style={{ position: "absolute", left: 4, right: 4, top: 15, ...txt(10, 12, CREAM, "center"), fontWeight: 500 }}>
          +&nbsp; Add reminder
        </span>
      </div>

      {/* Upcoming / All tabs — visual filter over the same mock list */}
      <div style={{ ...abs(26, 282, 378, 44), background: SHEET, boxShadow: `inset 0 0 0 1px ${SAND}`, borderRadius: 12 }} />
      {(["Upcoming", "All"] as const).map((label, i) => {
        const active = tab === label;
        return (
          <button
            key={label}
            type="button"
            aria-pressed={active}
            onClick={() => setTab(label)}
            style={{ ...abs(29 + i * 189, 285, 154 + (i === 1 ? 32 : 0), 38), border: 0, padding: 0, background: "transparent", cursor: "pointer" }}
          >
            {active ? <span style={{ position: "absolute", inset: 0, background: ROSE_BG, borderRadius: 10, display: "block" }} /> : null}
            <span style={{ position: "absolute", left: 0, right: 0, top: 11, ...txt(13, 15.6, INK, "center"), fontWeight: 500 }}>{label}</span>
          </button>
        );
      })}

      {/* reminder cards — 112px pitch */}
      {REMINDERS.map((item, i) => {
        const y = 338 + i * 112;
        return (
          <div key={item.title}>
            <div style={{ ...abs(26, y, 378, 98), background: SHEET, boxShadow: `inset 0 0 0 1px ${SAND}`, borderRadius: 12 }} />
            <div style={{ ...abs(42, y + 15, 50, 66), background: SHEET, boxShadow: `inset 0 0 0 1px ${SAND}`, borderRadius: 8 }} />
            <div style={{ ...abs(42, y + 15, 50, 18), background: PINK, borderRadius: "8px 8px 0 0" }} />
            <div style={{ ...abs(47, y + 35.6, 40, 18), ...txt(9, 10.8, INK, "center") }}>{item.month}</div>
            <div style={{ ...abs(47, y + 52.4, 40, 24), ...txt(16, 19.2, INK, "center"), fontWeight: 500 }}>{item.day}</div>
            <div className={playfair.className} style={{ ...abs(110, y + 15.7, 190, 30), ...txt(17, 22.66, INK), fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis" }}>
              {item.title}
            </div>
            <div style={{ ...abs(110, y + 44.1, 160), ...txt(11.5, 13.8, "#6B615C") }}>{item.date}</div>
            <Glyph src="1110-112" x={110} y={y + 67} w={12} h={14} ink={[11, 10]} />
            <div style={{ ...abs(126, y + 67.7, 200), ...txt(10.5, 12.6, INK) }}>{item.meta}</div>
            <div style={{ ...abs(314, y + 14, 76, 30), background: ROSE_BG, borderRadius: 15 }}>
              <span style={{ position: "absolute", left: 4, right: 4, top: 9, ...txt(10.5, 12.6, ROSE, "center"), fontWeight: 500 }}>Upcoming</span>
            </div>
            {/* Edit | Delete — pixel placeholders (no backend) */}
            <div style={{ ...abs(300, y + 63.7, 94, 28), ...txt(10.5, 12.6, ROSE, "center"), fontWeight: 500 }}>
              Edit&nbsp;&nbsp; | &nbsp;&nbsp;Delete
            </div>
          </div>
        );
      })}

      {/* notification preferences — toggles flip visually */}
      <div style={{ ...abs(26, 684, 378, 132), background: SHEET, boxShadow: `inset 0 0 0 1px ${SAND}`, borderRadius: 12 }} />
      <div className={playfair.className} style={{ ...abs(40, 693.7, 260, 30), ...txt(17, 22.66, INK), fontWeight: 500 }}>
        Notification Preferences
      </div>
      <Glyph src="1110-163" x={42} y={722} w={30} h={26} ink={[17, 17]} />
      <div style={{ ...abs(76, 728, 180), ...txt(11.5, 13.8, INK) }}>Email reminders</div>
      <Toggle y={726} on={email} onFlip={() => setEmail((v) => !v)} label="Email reminders" />
      <Glyph src="1110-167" x={42} y={752} w={30} h={26} ink={[16, 7]} />
      <div style={{ ...abs(76, 758, 180), ...txt(11.5, 13.8, INK) }}>SMS reminders</div>
      <Toggle y={756} on={sms} onFlip={() => setSms((v) => !v)} label="SMS reminders" />
      <Glyph src="1110-171" x={42} y={782} w={30} h={26} ink={[11, 11]} />
      <div style={{ ...abs(76, 788, 180), ...txt(11.5, 13.8, INK) }}>Time zone</div>
      <div style={{ ...abs(272, 788, 114), ...txt(10.5, 12.6, INK, "right") }}>EST (UTC−5)&nbsp;&nbsp;›</div>

      {/* info note */}
      <div style={{ ...abs(26, 830, 378, 68), background: ROSE_BG, boxShadow: `inset 0 0 0 1px ${SAND}`, borderRadius: 12 }} />
      <Glyph src="1110-175" x={40} y={840} w={38} h={42} ink={[22, 22]} />
      <div style={{ ...abs(86, 847.2, 286, 46), ...txt(11.5, 13.8, INK), whiteSpace: "pre-line" }}>
        {"You control all reminders manually.\nAdd, edit, or delete dates anytime."}
      </div>
    </ScaleFrame>
  );
}
