/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * /account/returns/request-not-approved — pixel-exact implementation of
 * "/account/returns/request-not-approved · closed" (2030:183, AFTER-SALES
 * batch, imported 2026-08-02, 430×1087). All data is the design's mock —
 * no returns backend.
 *
 * Wired: Contact Support → /care/chat (the repo-wide CONTACT SUPPORT
 * precedent), Back to Orders → /account/orders, View Return Policy › →
 * /policies/returns-refunds-cancellations (scaffold route landing in this
 * same batch — linked regardless). The ⓧ/◇/▤/ⓘ marks are Figma's own SVG
 * exports; the alert box's smaller ⓧ (2043:204) shipped NO export of its
 * own, so the banner's 30px twin (2043-186) renders scaled to the 24px
 * size — same glyph, same #B80A0A red (findings note).
 */

import Link from "next/link";
import { ScaleFrame } from "@/components/chrome";
import {
  card,
  LineGlyph,
  PAGE_BG,
  ReturnsHeader,
} from "@/components/screens/returns/returns-chrome";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";

const A = "/veloria/screens";
const TITLE_INK = "#171311";
const HEADING_INK = "#1A1412";
const LABEL_INK = "#211C1A";
const VALUE_GREY = "#403833";
const BUTTON_INK = "#271F1B";

export function ReturnNotApprovedScreen() {
  return (
    <ScaleFrame
      height={1087}
      background={PAGE_BG}
      fontClass={notoSC.className}
      nav={false}
    >
      {/* 2024:320 Brand Navigation (instance at y0) */}
      <ReturnsHeader backFallback="/account/returns" />

      {/* 2043:183/184 title + subtitle */}
      <div
        className={playfair.className}
        style={{
          ...abs(24, 88, 382),
          ...txt(28, 37.3, TITLE_INK, "center"),
          fontWeight: 600,
        }}
      >
        Request Not Approved
      </div>
      <div
        style={{
          ...abs(36, 128, 358),
          ...txt(13, 19, "#2E2926", "center"),
          whiteSpace: "pre-line",
        }}
      >
        {
          "We’re unable to approve this return request\nbased on the information provided."
        }
      </div>

      {/* 2043:185…188 not-approved banner */}
      <div
        style={{
          ...abs(16, 176, 398, 94),
          background: "#FFF2EF",
          boxShadow: "inset 0 0 0 1px #F1C2B9",
          borderRadius: 12,
        }}
      />
      <LineGlyph src="2043-186" x={32} y={199} w={44} lh={36} ink={[28, 28]} />
      <div
        className={playfair.className}
        style={{
          ...abs(86, 194, 300),
          ...txt(15, 20, "#301A14"),
          fontWeight: 600,
        }}
      >
        Return request not approved
      </div>
      <div
        style={{
          ...abs(86, 221, 300),
          ...txt(11, 18, "#3D332E"),
          whiteSpace: "pre-line",
        }}
      >
        {"Reviewed on Aug 21, 2026\nRequest ID: RR-GR202506150311"}
      </div>

      {/* 2043:189…200 product card */}
      <div style={card(16, 286, 398, 302)} />
      <img
        src={`${A}/2043-190.png`}
        alt=""
        width={126}
        height={124}
        style={{
          ...abs(30, 300, 126, 124),
          borderRadius: 10,
          objectFit: "cover",
          display: "block",
        }}
      />
      <div
        className={playfair.className}
        style={{
          ...abs(170, 304, 226),
          ...txt(16, 22, "#14120F"),
          fontWeight: 600,
          whiteSpace: "pre-line",
        }}
      >
        {"24K Gold-Plated Rose\n· Golden Memory"}
      </div>
      <div style={{ ...abs(170, 362, 220), ...txt(11, 13.2, "#473D38") }}>
        Order #GR202506150311
      </div>
      <div
        className={playfair.className}
        style={{
          ...abs(170, 392, 120),
          ...txt(20, 26.7, "#14120F"),
          fontWeight: 600,
        }}
      >
        $99.00
      </div>
      <div style={{ ...abs(30, 437, 370, 1), background: "#E8DBC9" }} />
      <LineGlyph src="2043-195" x={34} y={458} w={36} lh={24} ink={[20, 20]} />
      <div
        className={playfair.className}
        style={{
          ...abs(80, 455, 300),
          ...txt(14, 18.7, LABEL_INK),
          fontWeight: 600,
        }}
      >
        Return reason
      </div>
      <div style={{ ...abs(80, 480, 300), ...txt(11, 13.2, VALUE_GREY) }}>
        Item arrived damaged
      </div>
      <LineGlyph src="2043-198" x={34} y={517} w={36} lh={24} ink={[16, 16]} />
      <div
        className={playfair.className}
        style={{
          ...abs(80, 514, 300),
          ...txt(14, 18.7, LABEL_INK),
          fontWeight: 600,
        }}
      >
        Issue details
      </div>
      <div
        style={{
          ...abs(80, 537, 300),
          ...txt(11, 17, VALUE_GREY),
          whiteSpace: "pre-line",
        }}
      >
        {"The rose head arrived bent and the outer\nbox was dented."}
      </div>

      {/* 2043:201…206 why-not-approved card */}
      <div style={card(16, 604, 398, 176)} />
      <div
        className={playfair.className}
        style={{
          ...abs(32, 618, 360),
          ...txt(17, 22.7, HEADING_INK),
          fontWeight: 600,
        }}
      >
        Why this request was not approved
      </div>
      <div
        style={{
          ...abs(32, 652, 366, 116),
          background: "#FFF1EE",
          boxShadow: "inset 0 0 0 1px #F1C3BA",
          borderRadius: 12,
        }}
      />
      {/* 2043:204 — no export of its own; the banner ⓧ scaled 24/30 */}
      <LineGlyph
        src="2043-186"
        x={46}
        y={664}
        w={36}
        lh={28.8}
        ink={[28, 28]}
        scale={0.8}
      />
      <div
        style={{
          ...abs(90, 664, 290),
          ...txt(11, 17, "#3D2E2B"),
          whiteSpace: "pre-line",
        }}
      >
        {
          "The photos provided do not clearly show a\nproduct defect. Please review our Return\nPolicy for more details."
        }
      </div>
      <Link
        href="/policies/returns-refunds-cancellations"
        style={{
          ...abs(90, 736, 220),
          ...txt(11, 13.2, "#AD0A08"),
          fontWeight: 500,
          display: "block",
        }}
      >
        {"View Return Policy  ›"}
      </Link>

      {/* 2043:207…210 what-you-can-do-next card */}
      <div style={card(16, 796, 398, 132)} />
      <div
        className={playfair.className}
        style={{
          ...abs(32, 810, 360),
          ...txt(17, 22.7, HEADING_INK),
          fontWeight: 600,
        }}
      >
        What you can do next
      </div>
      <LineGlyph
        src="2043-209"
        x={34}
        y={851}
        w={36}
        lh={28.8}
        ink={[23, 23]}
      />
      <div
        style={{
          ...abs(78, 848, 306),
          ...txt(11, 18, "#3D3630"),
          whiteSpace: "pre-line",
        }}
      >
        {
          "This request is now closed. If you believe the decision\nwas made in error, please contact our support team."
        }
      </div>

      {/* 2043:211 Contact Support → live chat (CONTACT SUPPORT precedent) */}
      <Link
        href="/care/chat"
        style={{
          ...abs(16, 950, 398, 52),
          background: BUTTON_INK,
          borderRadius: 10,
          display: "block",
        }}
      >
        <span
          className={playfair.className}
          style={{
            ...abs(0, 13, 398),
            ...txt(17, 22.7, "#FFFAF2", "center"),
            fontWeight: 500,
            display: "block",
          }}
        >
          Contact Support
        </span>
      </Link>
      {/* 2043:213 Back to Orders */}
      <Link
        href="/account/orders"
        style={{
          ...abs(16, 1016, 398, 52),
          background: "#FFF9F2",
          boxShadow: "inset 0 0 0 1px #7B695B",
          borderRadius: 10,
          display: "block",
        }}
      >
        <span
          className={playfair.className}
          style={{
            ...abs(0, 13, 398),
            ...txt(17, 22.7, "#1F1A17", "center"),
            fontWeight: 500,
            display: "block",
          }}
        >
          Back to Orders
        </span>
      </Link>
    </ScaleFrame>
  );
}
