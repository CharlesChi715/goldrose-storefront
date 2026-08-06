/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * /account/personal-info — pixel-exact implementation of
 * mepage-Account & Privacy-Personal Information (1523:954, 07-29 unified
 * restyle). Geometry, colors, fonts and copy verbatim from the Figma REST
 * data; icons are Figma's own SVG exports. The 07-28 bottom nav band is gone
 * from this frame; the brand wordmark and the pasted back-arrow art now sit
 * at the top instead.
 *
 * 2026-08-06 — THE FORM IS LIVE. It was the last of the account screens still
 * showing "Olivia Carter" from the mock; every field now reads and writes the
 * signed-in customer's own profile (`lib/account/profile.ts`):
 *   • First / last name — real <input>s in the frame's own field boxes, saved
 *     to the auth user's metadata and mirrored onto their customers row, so
 *     the /account greeting and the admin's Customers list both follow.
 *   • Current email — read-only text until "Edit" is tapped, exactly the
 *     affordance the frame draws. Changing it asks Supabase to send the
 *     confirmation; the ink banner then names the address being waited on,
 *     which is what the frame's "may require verification" line was promising.
 *   • Preferred language — a real <select> over the frame's own field box and
 *     chevron. Stored on the account; the storefront is English-only until V2
 *     translations, so it does not switch the UI yet.
 *   • Save changes — one button for all of it, reporting into a status line
 *     below (see CANVAS below). A tap always produces a reply, including
 *     "nothing to save" (SignupScreen precedent).
 *
 * CANVAS: 932 in Figma, 972 here. The extra 40px is empty cream below the
 * Save button, holding the status line the frame has nowhere to put — no
 * designed element moved, and the frame had no bottom padding to give up.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScaleFrame } from "@/components/chrome";
import {
  CREAM,
  GOLD,
  INK,
  SAND,
  SHADOW,
  sCard,
  SettingsHeader,
  BrandWordmark,
} from "@/components/screens/account-chrome";
import {
  PROFILE_LANGUAGES,
  type PersonalInfo,
  type PersonalInfoInput,
  type SaveOutcome,
} from "@/lib/account/profile-fields";
import { abs, txt } from "@/lib/figma-layout";
import { inter, notoSC } from "@/lib/fonts";

/** The sign-in screen's two message colours, for the same two jobs. */
const MUTED = "#75665E";
const DANGER = "#B3261E";

/**
 * One field shell (cream fill, sand inside-stroke + the batch shadow, radius
 * 10). A rejected address recolours the frame's own hairline rather than
 * adding a box the design never drew — the SignupScreen convention.
 */
function field(
  x: number,
  y: number,
  w: number,
  h: number,
  invalid = false,
): React.CSSProperties {
  const base = sCard(x, y, w, h, { bg: CREAM, r: 10 });
  return invalid
    ? { ...base, boxShadow: `inset 0 0 0 1px ${DANGER}, ${SHADOW}` }
    : base;
}

/** Shared styling for the two live text inputs drawn inside a field box. */
function inputStyle(
  x: number,
  y: number,
  w: number,
  size: number,
): React.CSSProperties {
  return {
    ...abs(x, y, w, 44),
    border: "none",
    outline: "none",
    background: "transparent",
    // 12px inset reproduces the frame's own text origin (x+12), and the
    // browser centres the line in the 44px box exactly where Figma put it.
    padding: "0 12px",
    ...txt(size, 20, INK),
  };
}

/**
 * What to tell the visitor after a save. Reads the outcome rather than
 * assuming: an email change may apply at once or need confirming, and a save
 * can half-succeed (name written, address refused) — none of which should be
 * reported as a flat "Saved".
 *
 * @param result - What the server action reported.
 * @returns The status line's text and colour.
 */
function outcomeStatus(result: SaveOutcome): { text: string; tone: string } {
  if (result.error) {
    return {
      text:
        (result.savedProfile ? "Name and language saved. " : "") +
        result.error.message,
      tone: DANGER,
    };
  }
  if (result.emailPendingTo) {
    return {
      text: `Saved. To finish moving your account to ${result.emailPendingTo}, open the confirmation link we emailed there — and the one sent to ${result.info.email}.`,
      tone: INK,
    };
  }
  if (result.emailChangedTo) {
    return {
      text: `Saved. Your account email is now ${result.emailChangedTo}.`,
      tone: INK,
    };
  }
  return result.savedProfile
    ? { text: "Saved.", tone: INK }
    : {
        text: "Nothing to save — your details are already up to date.",
        tone: MUTED,
      };
}

export function PersonalInfoScreen({
  initial,
  onSave,
}: {
  initial: PersonalInfo;
  /** The `savePersonalInfoAction` server action, passed down by the page so
   * this component never imports from an app route. Null means the session
   * has gone. */
  onSave: (input: PersonalInfoInput) => Promise<SaveOutcome | null>;
}) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [language, setLanguage] = useState<string>(initial.language);
  const [email, setEmail] = useState(initial.email);
  // The frame draws the address as text with an "Edit" affordance beside it,
  // so that is the interaction: read-only until asked otherwise. It also
  // means an accidental keystroke can never start an email change.
  const [editingEmail, setEditingEmail] = useState(false);
  const [pendingEmail, setPendingEmail] = useState(initial.pendingEmail);
  const [emailInvalid, setEmailInvalid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ text: string; tone: string } | null>(
    null,
  );

  async function save() {
    setSaving(true);
    setStatus({ text: "Saving…", tone: MUTED });
    const result = await onSave({ firstName, lastName, language, email });
    setSaving(false);

    // The session expired mid-edit. /account/signup is the one login page.
    if (!result) {
      router.replace("/account/signup");
      return;
    }

    // Re-sync from server truth: names are normalised on the way in, and a
    // pending email change leaves `email` on the OLD address by design.
    setFirstName(result.info.firstName);
    setLastName(result.info.lastName);
    setLanguage(result.info.language);
    setPendingEmail(result.info.pendingEmail);
    setStatus(outcomeStatus(result));

    const addressRefused = result.error?.field === "email";
    setEmailInvalid(addressRefused);
    if (!addressRefused) {
      // Anything else: the field goes back to showing the live address. A
      // refused address stays in the box, still editable — retyping it from
      // scratch is the last thing someone wants after a typo.
      setEmail(result.info.email);
      setEditingEmail(false);
    }
  }

  const bannerPending = Boolean(pendingEmail);

  return (
    // 972, not the frame's 932 — see CANVAS in the file header.
    <ScaleFrame
      height={972}
      background={CREAM}
      fontClass={notoSC.className}
      nav={false}
    >
      {/* The browser's default placeholder grey is not the design's hint
          colour, and ::placeholder cannot be set from an inline style. */}
      <style>{`
        #pi-first::placeholder,
        #pi-last::placeholder,
        #pi-email::placeholder { color: ${MUTED}; opacity: 1; }
      `}</style>

      {/* 1523:1012/1013 Brand Navigation — the wordmark at the frame's own box */}
      <BrandWordmark x={145} y={2} w={140} h={51} />

      <SettingsHeader title="Personal Information" />
      {/* 1523:1014 返回 — the frame's pasted back-arrow art (its own back-icon
          frame 1523:955 is empty); pointer-events off so the SettingsHeader
          button underneath keeps the click. */}
      <img
        src="/eldreve/screens/1523-1014.png"
        alt=""
        width={40}
        height={42}
        style={{
          ...abs(26, 58, 40, 42),
          display: "block",
          pointerEvents: "none",
        }}
      />

      {/* hero card */}
      <div style={sCard(16, 114, 398, 104)} />
      <div style={{ ...abs(36, 159, 245), ...txt(13, 20, INK) }}>
        Review and update your account details.
      </div>
      <img
        src="/eldreve/screens/1523-959.svg"
        alt=""
        width={88}
        height={60}
        style={{ ...abs(307, 139, 88, 60), display: "block" }}
      />

      {/* form card */}
      <div style={sCard(16, 230, 398, 520)} />
      <img
        src="/eldreve/screens/1523-965.svg"
        alt=""
        width={24}
        height={24}
        style={{ ...abs(34, 248, 24, 24), display: "block" }}
      />
      <div style={{ ...abs(72, 248, 260), ...txt(15, 20, INK) }}>Full name</div>

      {/* The frame's field captions become real <label>s: same pixels, and
          tapping the caption now focuses the box under it. */}
      <label
        htmlFor="pi-first"
        style={{ ...abs(36, 286, 200), ...txt(11, 16, INK), cursor: "pointer" }}
      >
        First name
      </label>
      <div style={field(34, 306, 362, 44)} />
      <input
        id="pi-first"
        name="firstName"
        type="text"
        autoComplete="given-name"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        placeholder="First name"
        aria-describedby="pi-status"
        style={inputStyle(34, 306, 362, 14)}
      />

      <label
        htmlFor="pi-last"
        style={{ ...abs(36, 362, 200), ...txt(11, 16, INK), cursor: "pointer" }}
      >
        Last name
      </label>
      <div style={field(34, 382, 362, 44)} />
      <input
        id="pi-last"
        name="lastName"
        type="text"
        autoComplete="family-name"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        placeholder="Last name"
        aria-describedby="pi-status"
        style={inputStyle(34, 382, 362, 14)}
      />

      <div style={{ ...abs(34, 446, 362, 1), background: SAND }} />

      <img
        src="/eldreve/screens/1523-976.svg"
        alt=""
        width={24}
        height={24}
        style={{ ...abs(34, 462, 24, 24), display: "block" }}
      />
      <div style={{ ...abs(72, 462, 260), ...txt(15, 20, INK) }}>
        Email address
      </div>
      <label
        htmlFor="pi-email"
        style={{ ...abs(36, 500, 200), ...txt(11, 16, INK) }}
      >
        Current email
      </label>
      <div style={field(34, 520, 362, 44, emailInvalid)} />
      {editingEmail ? (
        // Stops at 310 so it never runs under the Cancel control at 315.
        <input
          id="pi-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            // Typing retracts the verdict; Save asks for it again.
            setEmailInvalid(false);
          }}
          placeholder="name@example.com"
          aria-invalid={emailInvalid}
          aria-describedby="pi-status"
          autoFocus
          style={inputStyle(34, 520, 276, 13)}
        />
      ) : (
        <div style={{ ...abs(46, 532, 230), ...txt(13, 20, INK) }}>{email}</div>
      )}
      {/* 1523:983/984 — the frame's gold "Edit" + pencil, promoted to the
          button they were drawn as. The whole 78×40 box is the tap target,
          not just the 38px word. Editing swaps it for Cancel and hides the
          pencil, which frees exactly the pencil's width for the longer word. */}
      <button
        type="button"
        onClick={() => {
          if (editingEmail) {
            setEmail(initial.email);
            setEmailInvalid(false);
          }
          setEditingEmail(!editingEmail);
        }}
        aria-label={
          editingEmail ? "Cancel email change" : "Change email address"
        }
        style={{
          ...abs(315, 522, 78, 40),
          border: "none",
          background: "transparent",
          padding: 0,
          cursor: "pointer",
        }}
      >
        <span
          style={{
            position: "absolute",
            left: 8,
            top: 10,
            ...txt(12, 16, GOLD),
            fontWeight: 500,
            letterSpacing: 1.2,
          }}
        >
          {editingEmail ? "Cancel" : "Edit"}
        </span>
        {editingEmail ? null : (
          <img
            src="/eldreve/screens/1523-984.svg"
            alt=""
            width={20}
            height={20}
            style={{
              position: "absolute",
              left: 49,
              top: 10,
              display: "block",
            }}
          />
        )}
      </button>
      {/* 1523:987 verify note — ink banner with cream text in this delivery.
          Its copy was a promise; with a change in flight it becomes the
          status of that change, and names the address being waited on. */}
      <div style={sCard(34, 574, 362, 40, { bg: INK, r: 10, stroke: false })} />
      <img
        src="/eldreve/screens/1523-988.svg"
        alt=""
        width={24}
        height={24}
        style={{ ...abs(44, 582, 24, 24), display: "block" }}
      />
      <div
        style={{
          // Two lines when it names an address, so nudge it up to stay
          // centred in the 40px band.
          ...abs(78, bannerPending ? 578 : 585, 304),
          ...txt(10, 16, CREAM),
          ...(bannerPending ? { whiteSpace: "normal" as const } : {}),
        }}
      >
        {bannerPending
          ? `Confirm the link emailed to ${pendingEmail} to finish the change.`
          : "Changing your email may require verification."}
      </div>
      <div style={{ ...abs(34, 632, 362, 1), background: SAND }} />

      <img
        src="/eldreve/screens/1523-992.svg"
        alt=""
        width={24}
        height={24}
        style={{ ...abs(34, 650, 24, 24), display: "block" }}
      />
      <div style={{ ...abs(72, 650, 260), ...txt(15, 20, INK) }}>
        Preferred language
      </div>
      <div style={field(34, 692, 362, 44)} />
      {/* The frame's own chevron stays the only one: the select is
          transparent with its native arrow stripped, and sits on top so the
          whole box — chevron included — opens the menu. */}
      <img
        src="/eldreve/screens/1523-998.svg"
        alt=""
        width={18}
        height={18}
        style={{
          ...abs(360, 705, 18, 18),
          display: "block",
          pointerEvents: "none",
        }}
      />
      <select
        id="pi-language"
        name="language"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        aria-label="Preferred language"
        style={{
          ...abs(34, 692, 362, 44),
          appearance: "none",
          WebkitAppearance: "none",
          border: "none",
          outline: "none",
          background: "transparent",
          // Right inset clears the frame's chevron.
          padding: "0 44px 0 12px",
          ...txt(14, 20, INK),
          cursor: "pointer",
        }}
      >
        {PROFILE_LANGUAGES.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>

      {/* security note — white card now (was pink in 07-28) */}
      <div style={sCard(16, 762, 398, 68)} />
      <img
        src="/eldreve/screens/1523-1001.svg"
        alt=""
        width={24}
        height={24}
        style={{ ...abs(32, 783, 24, 24), display: "block" }}
      />
      <div
        style={{
          ...abs(70, 779, 275),
          ...txt(11, 16, INK),
          whiteSpace: "pre-line",
        }}
      >
        {
          "Some profile changes may require confirmation\nto help keep your account secure."
        }
      </div>
      <img
        src="/eldreve/screens/1523-1005.svg"
        alt=""
        width={42}
        height={42}
        style={{ ...abs(354, 775, 42, 42), display: "block" }}
      />

      {/* Save changes — the frame's ink pill, promoted to a real button; its
          icon and Inter label (1523:1011 is the batch's one Inter text node)
          keep their pixels as children of the button box. */}
      <button
        type="button"
        disabled={saving}
        onClick={save}
        style={{
          ...sCard(16, 842, 398, 58, { bg: INK, r: 16, stroke: false }),
          border: "none",
          padding: 0,
          cursor: saving ? "default" : "pointer",
          // The design ships no disabled state, so dimming the whole pill
          // says "in progress" without inventing a colour (SignupScreen).
          opacity: saving ? 0.6 : 1,
        }}
      >
        <img
          src="/eldreve/screens/1523-1008.svg"
          alt=""
          width={24}
          height={24}
          style={{ position: "absolute", left: 137, top: 17, display: "block" }}
        />
        <span
          className={inter.className}
          style={{
            position: "absolute",
            left: 170,
            top: 19,
            ...txt(16, 20, CREAM),
          }}
        >
          {saving ? "Saving…" : "Save changes"}
        </span>
      </button>

      {/* Status slot — every save reports here, including "nothing to save".
          role="status" so it is announced, not just seen. */}
      <div
        id="pi-status"
        role="status"
        style={{
          ...abs(34, 908, 362),
          ...txt(12, 16, status?.tone ?? MUTED),
          whiteSpace: "normal",
        }}
      >
        {status?.text ?? ""}
      </div>
    </ScaleFrame>
  );
}
