/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * /account/policies-legal — pixel-exact implementation of the
 * POLICIES-LEGAL hub (1523:1136, imported 2026-08-02). A cream page listing
 * the seven policy documents: header (wordmark + back + Playfair title),
 * intro card with the frame's document/shield illustration, then seven
 * white entry cards (icon, title, two-line description, gold chevron).
 *
 * Wiring: each card links to its /policies/* route per the frame's own
 * prototype targets. None of the seven policy PAGES is Ready-for-dev yet,
 * so every target renders the shared PolicyComingSoon scaffold until its
 * frame is marked and imported. Reached from the privacy hub's Policies &
 * Legal card and the signed-out login's service row.
 *
 * Only entry A ships its own chevron export (2246-432); the other rows'
 * chevrons are the identical 16×16 art, so the one file serves all seven.
 */

import Link from "next/link";
import { ScaleFrame } from "@/components/chrome";
import { BackButton } from "@/components/BackButton";
import {
  CREAM,
  INK,
  sCard,
  BrandWordmark,
} from "@/components/screens/account-chrome";
import { abs, txt } from "@/lib/figma-layout";
import { notoSC, playfair } from "@/lib/fonts";

const ART = "/eldreve/screens/";

// 2246:427…329 — the seven policy entries, frame order (letters A–J are the
// design file's internal names, not visible text). Card pitch 84 from y309.
const ENTRIES: Array<{
  y: number;
  icon: string;
  title: string;
  desc: string;
  href: string;
}> = [
  {
    y: 309,
    icon: "2246-435",
    title: "Returns, Refunds & Cancellations",
    desc: "Return windows, eligibility, refunds, exchanges, and order cancellations.",
    href: "/policies/returns-refunds-cancellations",
  },
  {
    y: 393,
    icon: "2246-418",
    title: "Shipping & Delivery",
    desc: "Processing times, delivery methods, tracking, delays, and international orders.",
    href: "/policies/shipping-delivery",
  },
  {
    y: 477,
    icon: "2246-403",
    title: "Limited Product Warranty & Care",
    desc: "One-year warranty coverage, exclusions, remedies, and product care guidance.",
    href: "/policies/warranty-care",
  },
  {
    y: 561,
    icon: "2246-393",
    title: "Terms of Service",
    desc: "Rules for using our site, accounts, orders, payments, and legal obligations.",
    href: "/policies/terms-of-service",
  },
  {
    y: 645,
    icon: "2246-383",
    title: "Privacy Policy",
    desc: "How we collect, use, share, retain, and protect your personal information.",
    href: "/policies/privacy",
  },
  {
    y: 729,
    icon: "2246-371",
    title: "Email & SMS Terms",
    desc: "Marketing consent, subscriptions, opt-out choices, messaging rules, and help.",
    href: "/policies/email-sms-terms",
  },
  {
    y: 813,
    icon: "2246-324",
    title: "Contact & Legal Notice",
    desc: "Customer service, privacy, legal, business address, and returns contacts.",
    href: "/policies/contact-legal",
  },
];

export function PoliciesLegalScreen() {
  return (
    <ScaleFrame
      height={932}
      background={CREAM}
      fontClass={notoSC.className}
      nav={false}
    >
      {/* 1523:1187/1189 Brand Navigation — ELDREVE art at the frame's
          wordmark box (the frame's own mark, DQ-34) + the frame's pasted
          返回 back art */}
      <BrandWordmark x={145} y={0} w={140} h={51} />
      <BackButton
        fallback="/account/privacy"
        src="/eldreve/screens/1523-1014.png"
        style={abs(17, 69, 40, 42)}
      />
      <div
        className={playfair.className}
        style={{
          ...abs(76, 72, 278),
          ...txt(25, 28, INK, "center"),
          fontWeight: 500,
        }}
      >
        {"Policies & Legal"}
      </div>

      {/* 1523:1138 · intro card (the description keeps the frame's own
          double spaces and space-before-comma quirks, verbatim) */}
      <div style={sCard(20, 129, 398, 151)} />
      <div
        style={{
          ...abs(44, 170, 214, 59),
          ...txt(14, 20, INK),
          whiteSpace: "normal",
        }}
      >
        {
          "Browse  our  shipping , returns , warranty, privacy, terms, and contact policies."
        }
      </div>
      <img
        src={`${ART}1523-1140.svg`}
        alt=""
        width={78}
        height={78}
        style={{ ...abs(319, 166, 78, 78), display: "block" }}
      />

      {/* 2238:261 · entry list — each card is one link */}
      {ENTRIES.map((entry) => (
        <Link
          key={entry.href}
          href={entry.href}
          style={{
            ...sCard(20, entry.y, 398, 76, { r: 16 }),
            display: "block",
          }}
        >
          <img
            src={`${ART}${entry.icon}.svg`}
            alt=""
            width={28}
            height={28}
            style={{ ...abs(12, 24, 28, 28), display: "block" }}
          />
          <span style={{ ...abs(52, 12, 306), ...txt(14, 20, INK) }}>
            {entry.title}
          </span>
          <span
            style={{
              ...abs(52, 32, 306, 32),
              ...txt(12, 16, INK),
              whiteSpace: "normal",
              display: "block",
            }}
          >
            {entry.desc}
          </span>
          <img
            src={`${ART}2246-432.svg`}
            alt=""
            width={16}
            height={16}
            style={{ ...abs(370, 30, 16, 16), display: "block" }}
          />
        </Link>
      ))}
    </ScaleFrame>
  );
}
