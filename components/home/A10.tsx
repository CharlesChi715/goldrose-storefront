/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * Homepage module A-10 · Corporate Partnerships (Figma node 138:66,
 * y 7152–7900 of the 430-wide VELORIA homepage frame): hero heading,
 * numbered panels (partnerships, why-partner, results, audiences) and two
 * corporate CTAs. CTAs and the partner-logo strip are non-clickable
 * placeholders until the B-3/B-4 pages exist.
 */

import { abs } from "@/components/veloria";
import { playfair, notoSC, goudy } from "@/lib/fonts";

/* Replaceable placeholder photo shared by the three partnership slots; the
   430×708 source spans the whole module and each frame clips its own crop. */
const PARTNER_IMG = "/veloria/home/499-105.png";

const BENEFITS = [
  { x: 38, icon: "500-105", label: "Flexible Order\nQuantities" },
  { x: 110, icon: "500-109", label: "Personalized\nPackaging" },
  { x: 182, icon: "500-114", label: "Consistent\nQuality" },
  { x: 254, icon: "500-119", label: "Dedicated\nSupport" },
  { x: 326, icon: "500-124", label: "Wholesale\nPrice Tiers" },
];

const RESULTS = [
  { x: 35, icon: "501-105", value: "50K+", label: "Custom Gift Sets\nDelivered" },
  { x: 128, icon: "501-111", value: "90%+", label: "Repeat Order\nRate" },
  { x: 221, icon: "501-117", value: "1,200+", label: "Event & Corporate\nProjects" },
  { x: 314, icon: "501-123", value: "98%+", label: "On-Time Delivery\nRate" },
];

const AUDIENCES = [
  { x: 35, icon: "502-105", label: "Offline Stores" },
  { x: 129, icon: "502-110", label: "Corporate\nBuyers" },
  { x: 223, icon: "502-115", label: "Distributors" },
  { x: 317, icon: "502-120", label: "Influencers &\nCreators" },
];

export function A10() {
  return (
    <div style={{ ...abs(0, 7152, 430, 748), background: "#372B2A", overflow: "hidden" }}>
      {/* 496:115 · reference rebuild layer: solid + radial glow */}
      <div
        style={{
          ...abs(0, 0, 430, 748),
          background:
            "radial-gradient(250px 779.167px at 50% 66.6667%, rgba(51,33,14,0.52) 0%, rgba(9,6,3,0) 100%), #3B2F2F",
          overflow: "hidden",
        }}
      >
        {/* ---- A10/01 Hero (496:116) ---- */}
        <img
          src="/veloria/home/498-101.svg"
          alt=""
          width={122}
          height={22}
          style={{ ...abs(154, 6, 122, 22), display: "block" }}
        />
        <div
          className={playfair.className}
          style={{
            ...abs(42, 31, 346),
            fontSize: 25,
            lineHeight: "30px",
            color: "#E8B86B",
            fontWeight: 500,
            textAlign: "center",
            whiteSpace: "pre-line",
          }}
        >
          {"Corporate Rose Gifts and\nPartnership Opportunities"}
        </div>
        <div
          className={goudy.className}
          style={{
            ...abs(58, 99, 314),
            fontSize: 10.5,
            lineHeight: "15px",
            color: "#EDE5D6",
            textAlign: "center",
            whiteSpace: "pre-line",
          }}
        >
          {"Thoughtful rose gift solutions for retailers, corporate buyers,\nevents and custom orders—designed to delight and built to last."}
        </div>

        {/* ---- A10/02 Selected Partnerships (496:117) ---- */}
        <div
          style={{
            ...abs(25, 155, 380, 174),
            boxShadow: "inset 0 0 0 0.8px #D49629",
            borderRadius: 7,
          }}
        />
        <img
          src="/veloria/home/499-102.svg"
          alt=""
          width={270}
          height={18}
          style={{ ...abs(80, 146.5, 270, 18), display: "block" }}
        />
        <div
          className={notoSC.className}
          style={{
            ...abs(80, 146, 270),
            fontSize: 9.5,
            lineHeight: "18px",
            color: "#E5AD47",
            fontWeight: 500,
            letterSpacing: 1.15,
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          {"1.  SELECTED PARTNERSHIPS & PROJECTS"}
        </div>
        {/* Partner-logo strip: non-clickable placeholder (B-3/B-4 not built) */}
        <div style={{ ...abs(30, 170, 370, 39), borderRadius: 4, overflow: "hidden" }}>
          <img
            src={PARTNER_IMG}
            alt="Partner brand logos"
            width={430}
            height={708}
            // Full-module source image; negative offsets crop the strip.
            style={{ ...abs(-30, -166, 430, 708), display: "block", objectFit: "cover", maxWidth: "none" }}
          />
        </div>
        <div style={{ ...abs(31, 211, 181, 111), borderRadius: 4, overflow: "hidden" }}>
          <img
            src={PARTNER_IMG}
            alt="Appreciation gift project photo"
            width={430}
            height={708}
            style={{ ...abs(-31, -207, 430, 708), display: "block", objectFit: "cover", maxWidth: "none" }}
          />
        </div>
        <div style={{ ...abs(217, 211, 181, 111), borderRadius: 4, overflow: "hidden" }}>
          <img
            src={PARTNER_IMG}
            alt="Partnership gift project photo"
            width={430}
            height={708}
            style={{ ...abs(-217, -207, 430, 708), display: "block", objectFit: "cover", maxWidth: "none" }}
          />
        </div>

        {/* ---- A10/03 Why Partner (496:118) ---- */}
        <div
          style={{
            ...abs(25, 347, 380, 83),
            boxShadow: "inset 0 0 0 0.75px #D49629",
            borderRadius: 7,
            overflow: "hidden",
          }}
        />
        <img
          src="/veloria/home/500-102.svg"
          alt=""
          width={250}
          height={18}
          style={{ ...abs(90, 337, 250, 18), display: "block" }}
        />
        <div
          className={notoSC.className}
          style={{
            ...abs(90, 337, 250),
            fontSize: 9.4,
            lineHeight: "18px",
            color: "#EBB857",
            fontWeight: 500,
            letterSpacing: 1.4,
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          {"2.  WHY PARTNER WITH GOLDROSE"}
        </div>
        {BENEFITS.map((b) => (
          <div
            key={b.x}
            style={{
              ...abs(b.x, 359, 66, 65),
              background: "rgba(19,12,6,0.68)",
              boxShadow: "inset 0 0 0 0.65px #734D1A",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <img
              src={`/veloria/home/${b.icon}.svg`}
              alt=""
              width={25}
              height={25}
              style={{ ...abs(20.5, 4, 25, 25), display: "block" }}
            />
            <div
              className={goudy.className}
              style={{
                ...abs(3, 32, 60),
                fontSize: 8.6,
                lineHeight: "10.5px",
                color: "#F5EDDB",
                textAlign: "center",
                whiteSpace: "pre-line",
              }}
            >
              {b.label}
            </div>
          </div>
        ))}

        {/* ---- A10/04 Partnership Results (496:119) ---- */}
        <div
          style={{
            ...abs(25, 450, 380, 99),
            boxShadow: "inset 0 0 0 0.75px #D49629",
            borderRadius: 7,
            overflow: "hidden",
          }}
        />
        <div style={{ ...abs(105, 441, 220, 18), background: "#362B2A" }} />
        <div
          className={notoSC.className}
          style={{
            ...abs(105, 441, 220),
            fontSize: 9.4,
            lineHeight: "18px",
            color: "#EBB857",
            fontWeight: 500,
            letterSpacing: 1.35,
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          {"3.  PARTNERSHIP RESULTS"}
        </div>
        {RESULTS.map((r) => (
          <div
            key={r.x}
            style={{
              ...abs(r.x, 462, 82, 82),
              background: "rgba(19,12,6,0.62)",
              boxShadow: "inset 0 0 0 0.65px #734D1A",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <img
              src={`/veloria/home/${r.icon}.svg`}
              alt=""
              width={28}
              height={28}
              style={{ ...abs(27.5, 4, 28, 28), display: "block" }}
            />
            <div
              className={playfair.className}
              style={{
                ...abs(4, 31, 75),
                fontSize: 20,
                lineHeight: "24px",
                color: "#EBB857",
                fontWeight: 500,
                textAlign: "center",
                whiteSpace: "nowrap",
              }}
            >
              {r.value}
            </div>
            <div
              className={goudy.className}
              style={{
                ...abs(4, 57, 75),
                fontSize: 8.8,
                lineHeight: "10.5px",
                color: "#F5EDDB",
                textAlign: "center",
                whiteSpace: "pre-line",
              }}
            >
              {r.label}
            </div>
          </div>
        ))}

        {/* ---- A10/05 Who We Work With (496:120) ---- */}
        <div
          style={{
            ...abs(25, 570, 380, 73),
            boxShadow: "inset 0 0 0 0.75px #D49629",
            borderRadius: 7,
            overflow: "hidden",
          }}
        />
        <div style={{ ...abs(110, 559, 210, 18), background: "#332724" }} />
        <div
          className={notoSC.className}
          style={{
            ...abs(110, 559, 210),
            fontSize: 9.4,
            lineHeight: "18px",
            color: "#EBB857",
            fontWeight: 500,
            letterSpacing: 1.4,
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          {"4.  WHO WE WORK WITH"}
        </div>
        {AUDIENCES.map((a) => (
          <div
            key={a.x}
            style={{
              ...abs(a.x, 582, 81, 58),
              background: "rgba(19,12,6,0.52)",
              boxShadow: "inset 0 0 0 0.65px #5E4017",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <img
              src={`/veloria/home/${a.icon}.svg`}
              alt=""
              width={25}
              height={25}
              style={{ ...abs(29, 3, 25, 25), display: "block" }}
            />
            <div
              className={goudy.className}
              style={{
                ...abs(4, 30, 75),
                fontSize: 9.2,
                lineHeight: "10.5px",
                color: "#F5EDDB",
                textAlign: "center",
                whiteSpace: "pre-line",
              }}
            >
              {a.label}
            </div>
          </div>
        ))}

        {/* ---- A10/06 Actions (496:121) — corporate CTAs stay placeholders ---- */}
        <div
          style={{
            ...abs(25, 652, 380, 32),
            background: "linear-gradient(90deg, #94591F 0%, #C98530 50%, #94591F 100%)",
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          <div
            className={goudy.className}
            style={{
              ...abs(58, 0, 250),
              fontSize: 11,
              lineHeight: "27px",
              color: "#FAF0DB",
              letterSpacing: 1.8,
              textAlign: "center",
              whiteSpace: "nowrap",
            }}
          >
            EXPLORE BUSINESS PARTNERSHIPS
          </div>
          <img
            src="/veloria/home/504-103.svg"
            alt="→"
            width={28}
            height={27}
            style={{ ...abs(315, 0, 28, 27), display: "block", objectFit: "none", objectPosition: "center center" }}
          />
        </div>
        <div
          style={{
            ...abs(25, 691, 380, 32),
            boxShadow: "inset 0 0 0 0.75px #D49629",
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          <div
            className={goudy.className}
            style={{
              ...abs(83, 0, 220),
              fontSize: 11,
              lineHeight: "24px",
              color: "#FAF0DB",
              letterSpacing: 1.6,
              textAlign: "center",
              whiteSpace: "nowrap",
            }}
          >
            REQUEST PARTNER PRICING
          </div>
          <img
            src="/veloria/home/504-106.svg"
            alt="→"
            width={28}
            height={24}
            style={{ ...abs(306, 0, 28, 24), display: "block", objectFit: "none", objectPosition: "center center" }}
          />
        </div>
        <img
          src="/veloria/home/504-107.svg"
          alt=""
          width={142}
          height={13}
          style={{ ...abs(144, 727, 142, 13), display: "block" }}
        />
      </div>
    </div>
  );
}
