/**
 * ROLE OF THIS FILE
 * The shared renderer behind the six /policies/* documents, imported
 * 2026-08-18 from the design's policy-page family (2118:239 / :241 / :242 /
 * :243 / :244 and 2127:238). All six frames draw the identical page — cream
 * canvas, centred Playfair title, gold ornament, "Policy X" pill, intro,
 * then a stack of numbered white cards — so they collapse to one component
 * fed by lib/policies/documents.ts.
 *
 * ⚠️ NOT a fixed 430 canvas, deliberately. Every other imported screen wraps
 * itself in ScaleFrame, which declares a height and sets overflow:hidden.
 * These documents cannot: their height is the sum of wrapped body copy, and
 * that copy changes length whenever the owner edits the support address or a
 * {token} resolves. A ScaleFrame one line too short would silently CLIP a
 * warranty exclusion, which is the one failure mode a legal page must not
 * have. So the frames' metrics are reproduced exactly — 430 column, 402 cards
 * inset 14, 10px padding, 7px gaps, 304 copy column, 30px icon at x=376 —
 * while the heights flow. Same call PolicyComingSoon and ContactLegalScreen
 * already made for this page family.
 *
 * The type sizes come from the REST `style` block, not from `--outline`:
 * body copy is 10.5/14, which the outline rounds up to 11 and which reads
 * visibly heavier if taken at face value (the AddressSheet trap).
 */

import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import type { PolicyDocument } from "@/lib/policies/documents";
import { POLICIES_LAST_UPDATED } from "@/lib/policies/documents";
import { splitPolicyText } from "@/lib/policies/tokens";
import type { SettingsShape } from "@/lib/supabase/seed-data";
import { notoSC, playfair } from "@/lib/fonts";

const CREAM = "#FFF6EC";
const INK = "#3B2F2F";
const GOLD = "#D4AF37"; // the pill and the numbered discs
const ORNAMENT = "#C88916"; // the divider, a shade deeper than the pill
const CARD_STROKE = "#E5D9C9";
const ASSETS = "/eldreve/screens";

/**
 * Policy copy with its `{token}` markers answered from the `store` setting.
 *
 * A token with nothing behind it draws a visible, italic "to be confirmed"
 * rather than a blank or an invented fact — see lib/policies/tokens.ts.
 */
function Copy({
  text,
  store,
}: {
  text: string;
  store: SettingsShape["store"];
}) {
  return (
    <>
      {splitPolicyText(text, store).map((part, index) => {
        if (part.kind === "text") {
          return <span key={index}>{part.text}</span>;
        }
        if (!part.value) {
          return (
            <span
              key={index}
              style={{ fontStyle: "italic", opacity: 0.65 }}
              data-policy-token="unresolved"
            >
              to be confirmed
            </span>
          );
        }
        if (part.email) {
          return (
            <a
              key={index}
              href={`mailto:${part.value}`}
              style={{ color: "inherit", textDecoration: "underline" }}
            >
              {part.value}
            </a>
          );
        }
        return <span key={index}>{part.value}</span>;
      })}
    </>
  );
}

/**
 * The frame's 150x12 rule: two hairline segments with a diamond between them.
 *
 * The node reads as one 150x0 vector, but it renders as a BROKEN rule — two
 * 60px segments with a 30px gap centred on the diamond. Drawing it as one
 * continuous line (with the diamond masking its middle) is visibly wrong: the
 * line touches the diamond's corners instead of standing clear of them.
 */
function Ornament() {
  return (
    <div
      aria-hidden
      style={{ position: "relative", width: 150, height: 12, margin: "0 auto" }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 6,
          width: 60,
          height: 1,
          background: ORNAMENT,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 6,
          width: 60,
          height: 1,
          background: ORNAMENT,
        }}
      />
      {/* 2118:242's 10x10 outline diamond — a square rotated 45 degrees has a
          bounding box of side x sqrt(2), so 7.07 is what draws 10 wide. */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 6,
          width: 7.07,
          height: 7.07,
          marginLeft: -3.535,
          marginTop: -3.535,
          border: `1px solid ${ORNAMENT}`,
          transform: "rotate(45deg)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 6,
          width: 2.4,
          height: 2.4,
          marginLeft: -1.2,
          marginTop: -1.2,
          background: ORNAMENT,
          transform: "rotate(45deg)",
        }}
      />
    </div>
  );
}

/** "2026-08-18" as the frames' own "Last updated" phrasing renders it. */
function formatUpdated(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const name = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ][month - 1];
  return `${name} ${day}, ${year}`;
}

/** One numbered white card: gold disc, heading, body, icon. */
function Section({
  section,
  store,
}: {
  section: PolicyDocument["sections"][number];
  store: SettingsShape["store"];
}) {
  return (
    <li
      data-el="POLICY-SECTION"
      style={{
        position: "relative",
        listStyle: "none",
        background: "rgba(255,255,255,0.86)",
        border: `1px solid ${CARD_STROKE}`,
        borderRadius: 9,
        // box-sizing is border-box globally, so the 1px border eats into the
        // padding box: 47/9 land the content on the frame's own 48/10 inset.
        padding: "9px 9px 9px 47px",
        marginTop: 7,
        minHeight: 48,
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: 9,
          top: 9,
          width: 28,
          height: 28,
          borderRadius: 14,
          background: GOLD,
          color: "#FFFFFF",
          fontSize: 11,
          lineHeight: "28px",
          fontWeight: 500,
          letterSpacing: 1.2,
          textAlign: "center",
        }}
      >
        {section.n}
      </span>
      {/* The frame's copy column is exactly 304 wide at x=62, which leaves a
          10px gutter before the icon at x=376. Keep it at 304 and nothing
          else: a narrower box re-wraps every body line earlier than Figma. */}
      <div style={{ maxWidth: 304 }}>
        <h2
          className={playfair.className}
          style={{
            margin: 0,
            fontSize: 15,
            lineHeight: "19px",
            fontWeight: 500,
            color: INK,
          }}
        >
          {section.heading}
        </h2>
        <div
          style={{
            marginTop: 2,
            fontSize: 10.5,
            lineHeight: "14px",
            color: INK,
          }}
        >
          {section.body.split(/\n{2,}/).map((para, index) => (
            <p key={index} style={{ margin: index === 0 ? 0 : "8px 0 0" }}>
              <Copy text={para} store={store} />
            </p>
          ))}
        </div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${ASSETS}/${section.iconAsset}.png`}
        alt=""
        aria-hidden
        width={30}
        height={30}
        style={{
          position: "absolute",
          right: 9,
          top: 9,
          width: 30,
          height: 30,
        }}
      />
    </li>
  );
}

/**
 * One policy document, drawn to its frame's metrics.
 *
 * @param document - The imported document from lib/policies/documents.ts.
 * @param store - The `store` setting, which resolves the frames' {token}s.
 * @returns The rendered policy page.
 */
export function PolicyDocumentScreen({
  document,
  store,
}: {
  document: PolicyDocument;
  store: SettingsShape["store"];
}) {
  return (
    <main
      data-el="POLICY-DOCUMENT"
      data-policy={document.slug}
      data-frame={document.frame}
      className={notoSC.className}
      style={{ minHeight: "100vh", background: CREAM, color: INK }}
    >
      {/* Same fluid top nav as every other page in this family — the frames
          draw a 40x43 back arrow at x=7 and a 136x40 wordmark at x=143. */}
      <header
        style={{
          position: "relative",
          maxWidth: 430,
          margin: "0 auto",
          height: 82,
        }}
      >
        <BackButton
          fallback="/account/policies-legal"
          style={{
            position: "absolute",
            left: 36,
            top: 46,
            width: 24,
            height: 24,
          }}
        />
        <Link
          href="/"
          aria-label="Home"
          style={{
            position: "absolute",
            left: "50%",
            top: 21,
            width: 136,
            height: 40,
            transform: "translateX(-50%)",
            display: "block",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/eldreve/brand/eldreve-136x40.png"
            alt="ELDREVE"
            width={136}
            height={40}
            style={{ display: "block", width: 136, height: 40 }}
          />
        </Link>
      </header>

      <div style={{ maxWidth: 430, margin: "0 auto", padding: "0 14px 96px" }}>
        <div style={{ padding: "17px 4px 0", textAlign: "center" }}>
          <h1
            className={playfair.className}
            style={{
              margin: 0,
              fontSize: 26,
              lineHeight: "31px",
              fontWeight: 600,
              letterSpacing: -0.4,
              color: INK,
            }}
          >
            {document.title}
          </h1>
          <div style={{ marginTop: 7 }}>
            <Ornament />
          </div>
          <div
            data-el="POLICY-LABEL"
            style={{
              display: "inline-block",
              marginTop: 7,
              minWidth: 124,
              padding: "4px 17px",
              border: `1px solid ${GOLD}`,
              borderRadius: 13,
              fontSize: 12,
              lineHeight: "16px",
              fontWeight: 500,
              letterSpacing: 1.2,
              color: GOLD,
            }}
          >
            {document.label}
          </div>
          <p style={{ margin: "7px 0 0", fontSize: 12, lineHeight: "16px" }}>
            Last updated: {formatUpdated(POLICIES_LAST_UPDATED)}
          </p>
          <p style={{ margin: "7px 0 0", fontSize: 11, lineHeight: "15px" }}>
            <Copy text={document.intro} store={store} />
          </p>
        </div>

        <ul style={{ margin: "9px 0 0", padding: 0 }}>
          {document.sections.map((section) => (
            <Section key={section.n} section={section} store={store} />
          ))}
        </ul>
      </div>
    </main>
  );
}
