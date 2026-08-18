/**
 * ROLE OF THIS FILE
 * /policies/contact-legal — the seller-of-record notice: who the company
 * legally is, where it is registered, and how to reach it.
 *
 * Deliberately NOT a pixel-exact import. It was built out on 2026-08-06 ahead
 * of its frame because the page is a payment-provider prerequisite and a US
 * disclosure obligation, shipping as plain typography in the shared
 * cream/Playfair palette — the same idiom as PolicyComingSoon.
 *
 * Its frame 2118:245 ("Policy J") IS Ready-for-dev as of the 2026-08-18 sync,
 * and it was deliberately NOT imported like its six siblings. The frame draws
 * the company's contact channels as static text; this page reads them from
 * the `store` setting so the owner maintains them at /admin/settings, and it
 * hides the legal block entirely rather than printing blanks (AI-033).
 * Importing the frame verbatim would hard-code details that are owner data
 * and re-open a gap that cost a rejected TikTok application. Recorded as a
 * sanctioned divergence in docs/ixd/README.md rather than as unfinished work.
 *
 * Every value comes from the `store` setting, so the owner fills it in at
 * /admin/settings without a deploy. Until the registered entity is supplied
 * the legal block is omitted entirely rather than rendered with blanks; the
 * contact email always shows, because it is always set.
 *
 * AI-TAG(AI-033): OWNER-DECISION — the registered entity details are blank
 * until the bosses supply them. See
 * /agent-delivery/sessions/company-legal-info-08-06-worktree-feat-company-legal-info.md.
 */

import Link from "next/link";
import { companyPostalLines, hasCompanyName } from "@/lib/company";
import type { SettingsShape } from "@/lib/admin/settings";
import { CREAM, INK, SAND } from "@/components/screens/account-chrome";
import { notoSC, playfair } from "@/lib/fonts";

/** One labelled block of the notice: small caps label over its value lines. */
function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginTop: 26 }}>
      <div
        style={{
          fontSize: 10,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          opacity: 0.55,
        }}
      >
        {label}
      </div>
      <div style={{ marginTop: 6, fontSize: 13.5, lineHeight: "22px" }}>
        {children}
      </div>
    </div>
  );
}

/**
 * The Contact & Legal Notice page body.
 *
 * @param store - The `store` setting: brand name, legal identity, contact.
 * @returns The rendered notice.
 */
export function ContactLegalScreen({
  store,
}: {
  store: SettingsShape["store"];
}) {
  // The entity name publishes on its own — the address is a separate field
  // and must not gate it (see hasCompanyName).
  const postal = companyPostalLines(store);
  const identified = hasCompanyName(store);
  const registration = store.registration_number.trim();

  return (
    <main
      className={notoSC.className}
      style={{ minHeight: "100vh", background: CREAM, color: INK }}
    >
      <div
        style={{ maxWidth: 430, margin: "0 auto", padding: "72px 26px 96px" }}
      >
        <h1
          className={playfair.className}
          style={{
            margin: 0,
            fontSize: 26,
            fontWeight: 500,
            lineHeight: "34px",
          }}
        >
          Contact &amp; Legal Notice
        </h1>
        <p
          style={{
            marginTop: 14,
            fontSize: 13,
            lineHeight: "21px",
            opacity: 0.8,
          }}
        >
          {store.name} is a direct-to-consumer gift brand. This page identifies
          the company behind the store and how to contact it.
        </p>

        {identified ? (
          <>
            <Row label="Seller of record">
              {postal.map((line, index) => (
                <div key={index}>{line}</div>
              ))}
            </Row>
            {registration ? (
              <Row label="Business registration number">{registration}</Row>
            ) : null}
          </>
        ) : (
          <Row label="Seller of record">
            <span style={{ opacity: 0.75 }}>
              Our registered company details are being finalised and will be
              published here before orders open to the public.
            </span>
          </Row>
        )}

        <Row label="Customer contact">
          <a
            href={`mailto:${store.contact_email}`}
            style={{ color: INK, textDecoration: "underline" }}
          >
            {store.contact_email}
          </a>
          <div style={{ marginTop: 4, opacity: 0.7, fontSize: 12.5 }}>
            We reply to every message within two business days.
          </div>
        </Row>

        <div
          style={{
            marginTop: 34,
            paddingTop: 22,
            borderTop: `1px solid ${SAND}`,
            fontSize: 12.5,
            lineHeight: "21px",
          }}
        >
          Full terms are set out in our{" "}
          <Link href="/policies/terms-of-service" style={{ color: INK }}>
            Terms of Service
          </Link>
          ,{" "}
          <Link href="/policies/privacy" style={{ color: INK }}>
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link
            href="/policies/returns-refunds-cancellations"
            style={{ color: INK }}
          >
            Returns &amp; Refunds
          </Link>{" "}
          policies.
        </div>

        <Link
          href="/account/policies-legal"
          style={{
            display: "inline-block",
            marginTop: 30,
            fontSize: 12.5,
            fontWeight: 500,
            color: INK,
            textDecoration: "none",
          }}
        >
          ‹&nbsp;&nbsp;Policies &amp; Legal
        </Link>
      </div>
    </main>
  );
}
