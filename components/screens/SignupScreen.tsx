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
 * ⚠️ Brand substitution: the frame's header wordmark is an image reading
 * "ELDREVE" — the placeholder brand stamped on several screens (DQ-34). The
 * live page keeps the owner's GoldRose art at the image's box.
 *
 * The form stays a VISUAL PLACEHOLDER of styled divs, inert until
 * customer-auth activation (release queue #2) — live-looking inputs that go
 * nowhere are the flagged hazard. The frame also deleted its "Already have
 * an account? Sign in ›" link, so the page's live ways back are the header
 * back arrow (→ /account) and the shared nav's Me tab; CONTINUE carries a
 * prototype NAVIGATE action with a null destination, so there is nothing to
 * wire it to.
 *
 * AI-TAG(AI-019): AGENT-DECISION — the frame deleted the "Already have an
 * account? Sign in ›" link, so the build did too. See
 * /agent-delivery/sessions/figma-sync-signup-mepage-08-02-feat-figma-sync.md.
 */

import { BackButton } from "@/components/BackButton";
import { ScaleFrame } from "@/components/chrome";
import { GoldRoseWordmark } from "@/components/screens/account-chrome";
import { Glyph } from "@/components/screens/glyphs";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";

const INK = "#3B2F2F";
const SAND = "#E5D9C9";
const CREAM = "#FFF6EC";
const SHEET = "#FFFEFB";
const HINT = "#75665E";

// 1561:114/111 — the two remaining fields, frame order (08-02 second pass:
// Full name is gone at source, so email moved up to y400 and the code field
// to y474): box y, icon export (ink = SVG natural size; crop = the ✉
// render-crop's measured box), hint text.
const FIELDS: Array<{
  y: number;
  icon: string;
  ink?: [number, number];
  crop?: [number, number, number, number];
  hint: string;
  sendCode?: boolean;
}> = [
  {
    y: 400,
    icon: "1523-3325",
    crop: [50.5, 422.5, 21.5, 14.5],
    hint: "Enter your email address",
  },
  {
    y: 474,
    icon: "1523-3328",
    ink: [22, 22],
    hint: "Verification code",
    sendCode: true,
  },
];

export function SignupScreen() {
  return (
    // Canvas 974 = the frame's nav band top (915) + 59.
    <ScaleFrame
      height={974}
      background={CREAM}
      fontClass={notoSC.className}
      navActive="Account"
    >
      {/* Brand Navigation (1523:3343) — ‹ back; the owner's GoldRose art
          substituted for the frame's "ELDREVE" wordmark image at its box
          (see the file header) */}
      <BackButton
        fallback="/account"
        src="/veloria/screens/1523-3344.png"
        style={abs(0, 18, 40, 42)}
      />
      <GoldRoseWordmark x={153} y={13.5} w={140} h={51} />

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
              boxShadow: `inset 0 0 0 1px ${SAND}`,
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
          <div
            style={{
              ...abs(
                field.sendCode ? 89 : 82,
                field.y + 21.6,
                field.sendCode ? 195 : 290,
              ),
              ...txt(14, 16.8, HINT),
            }}
          >
            {field.hint}
          </div>
          {field.sendCode ? (
            <>
              <div
                style={{ ...abs(295, field.y + 10, 1, 40), background: SAND }}
              />
              <div
                style={{
                  ...abs(307, field.y + 22.2, 84),
                  ...txt(13, 15.6, INK, "center"),
                  fontWeight: 500,
                }}
              >
                Send code
              </div>
            </>
          ) : null}
        </div>
      ))}

      <div
        style={{
          ...abs(32, 772, 18, 18),
          background: SHEET,
          boxShadow: `inset 0 0 0 1px ${SAND}`,
          borderRadius: 2,
        }}
      />
      <div style={{ ...abs(58, 773.8, 315), ...txt(12, 14.4, INK) }}>
        I agree to the Terms &amp; Privacy Policy
      </div>

      {/* CONTINUE (2436:377) — inert placeholder: its prototype action is a
          NAVIGATE with a null destination, and the real email flow lives on
          /account until customer-auth activation */}
      <div
        style={{ ...abs(32, 829, 366, 48), background: INK, borderRadius: 10 }}
        aria-disabled="true"
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
          CONTINUE
        </span>
      </div>
    </ScaleFrame>
  );
}
