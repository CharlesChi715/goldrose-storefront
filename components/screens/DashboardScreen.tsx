/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * The two signed-in account dashboards from the 07-27 frames, one skeleton,
 * two variants:
 *
 *   "mepage" 1523:2536 (Ready for dev) → /account (signed in)
 *   ACCOUNT-INFO-BUSINESS-DASHBOARD 1523:885 (07-29) → /account/business/dashboard
 *
 * Geometry, colors, fonts and copy verbatim from the Figma REST data. With
 * no props the shopping variant renders the mock's own state ("Jessica",
 * order #GR202508180888) — that is what the business variant always shows,
 * since business accounts have no backend yet. /account passes the real
 * visitor: display name, avatar initials, and the latest order's number /
 * date / delivery status / total (the account data has no line items, so a
 * real order shows the neutral placeholder image, per the owner's
 * explicit-unknown rule). The 07-28 dev "Sign out" row is retired: the
 * designed path is now Account & Privacy → the hub's Session card →
 * /account/logout.
 *
 * Ready-for-dev 1523:2536 is the canonical shopping frame: no account-type
 * toggle, three quick tiles (My Orders / Gift Reminders / Addresses), and a
 * 165px service card ending with Manage Addresses. The business variant keeps
 * its separate 07-29 layout untouched.
 *
 * Wired: order tracking, order list/details, gift reminders, customer care,
 * and Account & Privacy. Addresses and business-side tiles remain inert until
 * their destinations are Ready-for-dev (route-table rule; the ADDRESS-BOOK
 * section 2118:246 is not Ready-for-dev). The shopping frame uses the ELDREVE
 * wordmark — the brand itself (DQ-34) — while keeping live customer/order
 * data in the designated boxes.
 */

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
const CARD = "#FFFBF6";
const PINK = "#F3C6D1";

export type DashboardRecentOrder = {
  /** Bold first line — the mock's product title / a real order's number. */
  title: string;
  /** Second line — the mock's "Order #…" / a real order's placed date. */
  line2: string;
  /** Gold status line, e.g. "SHIPPED · Arrives Aug 25". */
  status: string;
  price: string;
  /** null → the neutral placeholder image (real order, no line items). */
  photoSrc: string | null;
};

const MOCK_ORDER: DashboardRecentOrder = {
  title: "24K Gold-Dipped Rose · Eternal Love",
  line2: "Order #GR202508180888",
  status: "SHIPPED  ·  Arrives Aug 25",
  price: "$129.00",
  photoSrc: "/eldreve/screens/916-130.png",
};

type Tile = {
  x: number;
  icon: string;
  ink: [number, number];
  title: string;
  text: string;
  href?: string;
  titleX?: number;
  titleW?: number;
  figmaNode?: string;
};
type Row = { title: string; value: string; href?: string };

function card(
  x: number,
  y: number,
  w: number,
  h: number,
  bg = CARD,
): React.CSSProperties {
  return {
    ...abs(x, y, w, h),
    background: bg,
    boxShadow: `inset 0 0 0 1px ${SAND}`,
    borderRadius: 14,
  };
}

function DarkButton({
  x,
  y = 392,
  label,
  href,
}: {
  x: number;
  y?: number;
  label: string;
  href?: string;
}) {
  const style: React.CSSProperties = {
    ...abs(x, y, 176, 32),
    background: INK,
    boxShadow: `inset 0 0 0 1px ${SAND}`,
    borderRadius: 10,
    display: "block",
  };
  const text = (
    <span
      style={{
        position: "absolute",
        left: 8,
        right: 8,
        top: 8,
        ...txt(12, 16, CREAM, "center"),
        fontWeight: 500,
      }}
    >
      {label}
    </span>
  );
  return href ? (
    <Link href={href} style={style}>
      {text}
    </Link>
  ) : (
    <div style={style}>{text}</div>
  );
}

function LightButton({
  x,
  y = 392,
  label,
  href,
}: {
  x: number;
  y?: number;
  label: string;
  href?: string;
}) {
  const style: React.CSSProperties = {
    ...abs(x, y, 176, 32),
    background: CARD,
    boxShadow: `inset 0 0 0 1px ${SAND}`,
    borderRadius: 10,
    display: "block",
  };
  const text = (
    <span
      style={{
        position: "absolute",
        left: 8,
        right: 8,
        top: 8,
        ...txt(12, 16, INK, "center"),
        fontWeight: 500,
      }}
    >
      {label}
    </span>
  );
  return href ? (
    <Link href={href} style={style}>
      {text}
    </Link>
  ) : (
    <div style={style}>{text}</div>
  );
}

function Dashboard({
  variant,
  displayName,
  recentOrder,
}: {
  variant: "shopping" | "business";
  displayName?: string;
  /** undefined → mock card; null → real visitor with no orders yet. */
  recentOrder?: DashboardRecentOrder | null;
}) {
  const shopping = variant === "shopping";
  const backX = shopping ? 5.5 : 7;
  // The brand sits centred on the 430 canvas (owner, 08-02). Both frames draw
  // it a few px off — the shopping header keeps a "Left Spacer · Buttons
  // Removed" box that never re-centred after its buttons went — so the live
  // mark is centred rather than copied: (430 − 136) / 2.
  const logoX = 147;
  // Business member card y (08-02: the shopping frame dropped its member card).
  const memberY = 756;
  // Real visitors arrive as displayNameOf() in lib/account/data.ts: their
  // profile name, or the email address when they have none (08-02 owner
  // rule). Without props the frames' own mock names stand in. An email has
  // no spaces, so the avatar takes its first letter; the 240-wide greeting
  // box ellipsises anything longer than it.
  const name = displayName ?? (shopping ? "Jessica" : "David");
  const initials = name
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const order = recentOrder === undefined ? MOCK_ORDER : recentOrder;
  const recentY = shopping ? 161 : 218;
  const shortcutY = shopping ? 388 : 448;
  const serviceY = shopping ? 515 : 578;

  // Shopping: the Ready-for-dev frame has three evenly spaced tiles.
  // Business: the 07-29 four-tile layout remains untouched.
  const tiles: Tile[] = shopping
    ? [
        {
          x: 16,
          icon: "1523-2560",
          ink: [24, 24],
          title: "My Orders",
          text: "View all orders",
          href: "/account/orders",
          figmaNode: "1523:2559",
        },
        {
          x: 167,
          icon: "1523-2564",
          ink: [22, 22],
          title: "Gift Reminders",
          text: "3 upcoming",
          href: "/account/reminders",
          titleX: 0,
          titleW: 94,
          figmaNode: "1523:2563",
        },
        {
          x: 318,
          icon: "1523-2572",
          ink: [19, 19],
          title: "Addresses",
          text: "Manage delivery",
          figmaNode: "1523:2571",
        },
      ]
    : [
        {
          x: 16,
          icon: "916-141",
          ink: [24, 24],
          title: "Purchase Orders",
          text: "Approved orders",
        },
        {
          x: 115.5,
          icon: "916-145",
          ink: [22, 22],
          title: "Purchase Requests",
          text: "Quotes & pricing",
        },
        {
          x: 215,
          icon: "916-149",
          ink: [24, 17],
          title: "Sample Requests",
          text: "Samples & status",
        },
        {
          x: 314.5,
          icon: "916-153",
          ink: [19, 19],
          title: "Business Team",
          text: "Dedicated support",
        },
      ];

  const rows: Row[] = shopping
    ? [
        {
          title: "Dates & Gift Reminders",
          value: "3 upcoming  ›",
          href: "/account/reminders",
        },
        {
          title: "Customer Care",
          value: "Online now  ›",
          href: "/care",
        },
        {
          title: "Account & Privacy",
          value: "Personal settings  ›",
          href: "/account/privacy",
        },
        {
          title: "Manage Addresses",
          value: "Address Management  ›",
        },
      ]
    : [
        { title: "Procurement Contacts", value: "Manage contacts  ›" },
        { title: "Company & Store Profile", value: "Company credentials  ›" },
        { title: "Invoices & Payment", value: "Downloads & billing  ›" },
        { title: "Product Media & Sales", value: "Marketing assets  ›" },
      ];

  return (
    // Canvas 932 = the frames' nav band top (873) + 59.
    <ScaleFrame
      height={932}
      background={CREAM}
      fontClass={notoSC.className}
      navActive="Account"
    >
      {/* 939:155/162 header — back art + logo, no promo bar on this screen */}
      <BackButton
        fallback="/"
        src="/eldreve/home/56-71.png"
        style={abs(backX, 19.5, 40, 43)}
      />
      <Link
        href="/"
        style={{ ...abs(logoX, 21, 136, 40), display: "block" }}
        aria-label="Home"
      >
        <img
          src="/eldreve/brand/eldreve-136x40.png"
          alt="ELDREVE"
          width={136}
          height={40}
          style={{ display: "block", width: 136, height: 40 }}
        />
      </Link>

      {/* Ready frame 1523:2536 · ACCOUNT-INFO-PROFILE-CARD */}
      <div
        data-el="ACCOUNT-INFO-PROFILE-CARD"
        data-figma-node="1523:2537"
        style={card(16, 82, 398, 70)}
      />
      <div
        style={{ ...abs(28, 93, 48, 48), background: PINK, borderRadius: 24 }}
      />
      <div
        className={playfair.className}
        style={{
          ...abs(28, 101, 48),
          ...txt(26, 30, INK, "center"),
          fontWeight: 500,
        }}
      >
        {initials}
      </div>
      <div
        className={playfair.className}
        style={{
          ...abs(90, 94, 240),
          ...txt(20, 24, INK),
          fontWeight: 600,
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        Hello, {name}
      </div>
      <div style={{ ...abs(90, 120, 240), ...txt(13, 16, INK) }}>
        {shopping
          ? "Welcome back to ELDREVE"
          : "Manage procurement and partnerships"}
      </div>

      {/* Browser annotation (2026-08-04): “Business & Partnerships — match
          from Figma.” Scope: the shopping account dashboard. Ready-for-dev
          frame 1523:2536 removes this toggle entirely; it remains below only
          for the separate business-dashboard variant. */}
      {!shopping ? (
        <>
          <div
            style={{
              ...abs(16, 164, 398, 42),
              background: CARD,
              boxShadow: `inset 0 0 0 1px ${SAND}`,
              borderRadius: 10,
            }}
          />
          <div
            style={{
              ...abs(215, 164, 199, 42),
              background: PINK,
              borderRadius: 10,
            }}
          />
          <Link
            href="/account"
            style={{ ...abs(16, 164, 199, 42), display: "block" }}
          >
            <span
              style={{
                position: "absolute",
                left: 8,
                top: 12,
                width: 183,
                ...txt(12, 16, INK, "center"),
                fontWeight: 500,
              }}
            >
              Gift Shopping
            </span>
          </Link>
          <div
            style={{
              ...abs(223, 176, 183),
              ...txt(12, 16, INK, "center"),
              fontWeight: 500,
            }}
          >
            Business &amp; Partnerships
          </div>
        </>
      ) : null}

      {/* recent order / recent purchase request */}
      <div
        data-el={shopping ? "ACCOUNT-ORDER-RECENT-CARD" : undefined}
        data-figma-node={shopping ? "1523:2546" : undefined}
        style={card(16, recentY, 398, 218)}
      />
      <div
        className={playfair.className}
        style={{
          ...abs(30, recentY + 12, 260),
          ...txt(shopping ? 18 : 15, shopping ? 22 : 18, INK),
          fontWeight: 600,
        }}
      >
        {shopping ? "Recent Order" : "Recent Purchase Request"}
      </div>
      {shopping ? (
        <Link
          href="/account/orders"
          style={{ ...abs(316, recentY + 15, 84, 15), display: "block" }}
        >
          <span
            style={{
              ...txt(12, 15, INK, "right"),
              fontWeight: 500,
              display: "block",
            }}
          >
            View all&nbsp;&nbsp;›
          </span>
        </Link>
      ) : (
        <div
          style={{
            ...abs(316, recentY + 15, 84),
            ...txt(12, 15, INK, "right"),
            fontWeight: 500,
          }}
        >
          View all&nbsp;&nbsp;›
        </div>
      )}

      {shopping ? (
        order ? (
          <>
            <img
              src={order.photoSrc ?? "/placeholder.png"}
              alt=""
              width={122}
              height={118}
              style={{
                ...abs(30, recentY + 48, 122, 118),
                borderRadius: 12,
                objectFit: "cover",
                display: "block",
              }}
            />
            <div
              style={{
                ...abs(166, recentY + 48, 230, 36),
                ...txt(14, 18, INK),
                fontWeight: 700,
                whiteSpace: "normal",
                overflow: "hidden",
              }}
              data-live-text
            >
              {order.title}
            </div>
            <div
              style={{
                ...abs(166, recentY + 88, 230),
                ...txt(13, 16, INK),
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              data-live-text
            >
              {order.line2}
            </div>
            <div
              style={{
                ...abs(166, recentY + 110, 230),
                ...txt(13, 16, GOLD),
                fontWeight: 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              data-live-text
            >
              {order.status}
            </div>
            <div
              style={{
                ...abs(166, recentY + 136, 150),
                ...txt(20, 22, INK),
                fontWeight: 700,
              }}
              data-live-text
            >
              {order.price}
            </div>
            <DarkButton
              x={30}
              y={recentY + 174}
              label="TRACK ORDER"
              href="/orders/track"
            />
            <LightButton
              x={220}
              y={recentY + 174}
              label="VIEW DETAILS"
              href="/account/orders/details"
            />
          </>
        ) : (
          // Real visitor, no orders yet — the design has no empty state, so
          // the card keeps its typography and says so (docs/ixd/README.md).
          <>
            <div
              style={{
                ...abs(30, recentY + 68, 340),
                ...txt(14, 18, INK),
                fontWeight: 700,
              }}
            >
              No orders yet.
            </div>
            <div style={{ ...abs(30, recentY + 94, 340), ...txt(13, 16, INK) }}>
              Your first gold rose is waiting in the shop.
            </div>
            <DarkButton
              x={30}
              y={recentY + 174}
              label="BROWSE GIFTS"
              href="/shop"
            />
            <LightButton
              x={220}
              y={recentY + 174}
              label="TRACK ORDER"
              href="/orders/track"
            />
          </>
        )
      ) : (
        <>
          <div
            style={{
              ...abs(30, recentY + 48, 260, 21),
              ...txt(17, 21, INK),
              fontWeight: 700,
            }}
          >
            RFQ #GRB-20260821
          </div>
          <div style={{ ...abs(30, recentY + 82, 330), ...txt(13, 16, INK) }}>
            Corporate Gift Customization&nbsp; ·&nbsp; 500 units
          </div>
          <div
            style={{
              ...abs(30, recentY + 108, 330),
              ...txt(13, 16, GOLD),
              fontWeight: 500,
            }}
          >
            IN REVIEW&nbsp; ·&nbsp; Updated Aug 22, 2:30 PM
          </div>
          <div
            style={{
              ...abs(30, recentY + 136, 350),
              ...txt(12, 16, INK),
              fontWeight: 700,
            }}
          >
            Contact: David Zhang&nbsp; ·&nbsp; Business Manager
          </div>
          <DarkButton x={30} y={recentY + 174} label="VIEW PROGRESS" />
          <LightButton
            x={220}
            y={recentY + 174}
            label="NEW REQUEST"
            href="/business/wholesale"
          />
        </>
      )}

      {/* shortcut tiles */}
      {tiles.map((tile) => {
        const x = tile.x;
        const body = (
          <>
            <Glyph src={tile.icon} x={0} y={16} w={94} h={28} ink={tile.ink} />
            <span
              style={{
                position: "absolute",
                left: tile.titleX ?? 8,
                top: 52,
                width: tile.titleW ?? 78,
                ...txt(11, 14, INK, "center"),
                fontWeight: 700,
                whiteSpace: "normal",
              }}
            >
              {tile.title}
            </span>
            <span
              style={{
                position: "absolute",
                left: 8,
                top: 77,
                width: 78,
                ...txt(9, 12, INK, "center"),
              }}
            >
              {tile.text}
            </span>
          </>
        );
        return tile.href ? (
          <Link
            key={tile.title}
            href={tile.href}
            data-el={shopping ? "ACCOUNT-ACTION-SHORTCUT" : undefined}
            data-figma-node={shopping ? tile.figmaNode : undefined}
            style={{
              ...card(x, shortcutY, 94, 118),
              borderRadius: 12,
              display: "block",
            }}
          >
            {body}
          </Link>
        ) : (
          <div
            key={tile.title}
            data-el={shopping ? "ACCOUNT-ACTION-SHORTCUT" : undefined}
            data-figma-node={shopping ? tile.figmaNode : undefined}
            style={{ ...card(x, shortcutY, 94, 118), borderRadius: 12 }}
          >
            {body}
          </div>
        );
      })}

      {/* service rows — Ready-for-dev shopping uses a 165px card; business
          keeps the separate 07-29 geometry. */}
      <div
        data-el={shopping ? "ACCOUNT-INFO-SERVICE-CARD" : undefined}
        data-figma-node={shopping ? "1523:2575" : undefined}
        style={card(16, serviceY, 398, shopping ? 165 : 166)}
      />
      {rows.map((row, i) => {
        const y = shopping ? [526, 568, 609, 644][i] : [589, 630, 671, 712][i];
        const separators = shopping ? [555, 597, 638] : [618, 659, 700];
        const body = (
          <>
            <span
              style={{
                ...abs(16, 0, 230),
                ...txt(12, 16, INK),
                fontWeight: 500,
              }}
            >
              {row.title}
            </span>
            <span style={{ ...abs(248, 0, 132), ...txt(11, 16, INK, "right") }}>
              {row.value}
            </span>
          </>
        );
        return (
          <div key={row.title}>
            {row.href ? (
              <Link
                href={row.href}
                style={{ ...abs(16, y, 398, 30), display: "block" }}
              >
                {body}
              </Link>
            ) : (
              <div style={{ ...abs(16, y, 398, 30) }}>{body}</div>
            )}
            {i < 3 ? (
              <div
                style={{
                  ...abs(30, separators[i], 370, 1),
                  background: SAND,
                }}
              />
            ) : null}
          </div>
        );
      })}
      {/* member / security card — gone from the 08-02 shopping frame; the
          business frame still has it */}
      {shopping ? null : (
        <>
          <div
            style={{
              ...abs(16, memberY, 398, 94),
              background: "#EBF5EC",
              borderRadius: 14,
            }}
          />
          <div
            className={playfair.className}
            style={{
              ...abs(34, memberY + 24, 240),
              ...txt(15, 18, INK),
              fontWeight: 600,
            }}
          >
            Enterprise Account Protected
          </div>
          <div style={{ ...abs(34, 804, 250), ...txt(10, 14, INK) }}>
            Sensitive details are secured for your team.
          </div>
          <div
            style={{
              ...abs(290, memberY + 25, 108, 42),
              background: INK,
              boxShadow: `inset 0 0 0 1px ${SAND}`,
              borderRadius: 10,
            }}
          >
            <span
              style={{
                position: "absolute",
                left: 8,
                top: 13,
                width: 92,
                ...txt(12, 16, CREAM, "center"),
                fontWeight: 500,
              }}
            >
              SECURITY
            </span>
          </div>
        </>
      )}
    </ScaleFrame>
  );
}

/** 1523:2536 — the shopping dashboard (real data via props, mock without). */
export function AccountDashboardScreen(props: {
  displayName?: string;
  recentOrder?: DashboardRecentOrder | null;
}) {
  return <Dashboard variant="shopping" {...props} />;
}

/** 1523:885 — the business dashboard (mock; business auth has no backend). */
export function BusinessDashboardScreen() {
  return <Dashboard variant="business" />;
}
