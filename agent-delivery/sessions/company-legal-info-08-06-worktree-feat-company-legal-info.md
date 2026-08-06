# company legal info · 2026-08-06 · `worktree-feat-company-legal-info`

Charles asked whether the site should carry company-name information. It
should — and not only as a trust signal. Three separate forces require it
before launch:

- **PayPal.** Advanced Checkout onboarding (release-queue item 3) checks for a
  legal business name, a contact route, and visible policies. Missing them is a
  standard rejection, and a merchant-account/website mismatch triggers holds.
- **US law.** CAN-SPAM requires a valid **physical postal address** in every
  commercial email — which binds the order-confirmation and shipping emails we
  already send through Resend, not just the website. FTC rules require clear
  seller identity for online sales.
- **Conversion.** An unknown brand selling a $100+ gift with no identifiable
  company behind it reads as a dropship scam.

The plumbing shipped this session; the two things an agent must not invent are
below.

---

## AI-033 · `OWNER-DECISION` · registration number and postal address still blank

**The entity name is now known.** Charles's TikTok Business API application
names the company behind `eldreve.com` as **Zhongshu Technology Worldwide
Limited** (Primary Country of Operation: Australia), so that is what the site
publishes — in the footer of every public page and on
`/policies/contact-legal`.

`settings.store` also carries `registration_number` and `address_lines`,
editable at `/admin/settings` → General → **Legal business identity**. Those
two are still **empty**, and degrade quietly: the registration row is omitted
from the legal notice, and the order emails carry no postal footer rather than
a stub one.

**Still needed from the bosses:**

| Field                        | Note                                              |
| ---------------------------- | ------------------------------------------------- |
| Business registration number | As issued (ACN/ABN if the entity is Australian)   |
| Registered postal address    | One line per row, country last                    |
| Returns address              | Only if different from the registered address     |

**Confirm, don't assume:** the name above is the entity on the *advertising*
application. If a different entity is the seller of record for orders, change
it at `/admin/settings` — the site publishes whatever that field says.

⚠️ **Production needs a manual edit.** Seed defaults only fill keys that are
*missing*; the hosted `store` row already exists, so it will NOT pick up the
entity name on deploy. Someone must open `/admin/settings` on production and
save it, or eldreve.com still shows no company name.

**The real decision underneath it.** The entity is Chinese; the market is the
US. Two honest options:

1. **Disclose the Chinese entity.** Legal and safe. Some US buyers hesitate —
   mitigate with clear US delivery times and a plain returns policy.
2. **Register a US entity** (LLC, roughly $100–500 plus a registered agent) as
   seller of record. Better conversion and simpler US card processing, but a
   real business and tax decision — the bosses', not ours.

Hiding it is not a third option: PayPal knows the entity from the merchant
account, and a mismatch between that and the site is what triggers review.

**Recommendation:** option 1 now so onboarding is unblocked, and revisit option
2 only if conversion data justifies it.

**Also needs a decision, separately:** `store.contact_email` in the hosted
database is still `support@goldrose.example`, left over from before the
eldreve.com cutover. The seed default is now `support@eldreve.com`, but seed
defaults only fill *missing* keys — a row that already exists wins. Someone
must change it once at `/admin/settings`. It is the address the order emails
advertise and the one the new legal page publishes.

Location: [`lib/supabase/seed-data.ts`](../../lib/supabase/seed-data.ts) ·
[`components/screens/ContactLegalScreen.tsx`](../../components/screens/ContactLegalScreen.tsx)

---

## AI-034 · `AGENT-DECISION` · the legal footer is the agent's own, not the design's

**Why this stopped being optional.** TikTok rejected Charles's Business API
application with: *"your company name doesn't match your email domain or
company website information."* The application named Zhongshu Technology
Worldwide Limited against `https://eldreve.com`; a reviewer opened the site,
found no such company anywhere, and refused. The rejected fields were Company
Website, Primary Country of Operation, Business Verticals, Primary Use Case and
Description — i.e. the whole Additional Information block, on that one basis.

Routing the name through the MENU overlay and the Policies & Legal hub — the
plan this session started with — would not have fixed it. **Platform reviewers
and crawlers do not open hamburger menus.** The name has to be on the page.

**Where it went, and why not in Figma.** Every public page renders inside
`<ScaleFrame>` at a fixed height (home 5193, shop 1822, PDP 1616) with
absolutely-positioned bands. A line added *inside* one would overflow the frame
and be reset by the next sync — the homepage footer cloud in
[`components/home/A11.tsx`](../../components/home/A11.tsx) is eight
absolutely-positioned text boxes on a fixed 430×1010 band, with load-bearing
whitespace in the labels.

So [`components/SiteLegalFooter.tsx`](../../components/SiteLegalFooter.tsx)
renders as a **sibling after** the ScaleFrame: ordinary document flow at real
CSS pixels, no imported band touched, immune to syncs. It is on `/`, `/shop`
and `/products/[slug]`.

**What the design team may want to change:** this is our own footer, in our own
type, sitting under their canvas. If they would rather draw one, they can — the
component and its three call sites delete cleanly. Worth showing them, because
it is the first piece of the storefront that is deliberately outside the Figma
canvas.

**Not done:** the remaining public pages (`/care`, `/story`, `/craft`,
`/partnerships`, `/wholesale`, the policy pages) still have no footer. The
three built are the ones a reviewer or crawler actually lands on; extending it
is one import and one line each.

Location: [`components/SiteLegalFooter.tsx`](../../components/SiteLegalFooter.tsx)

---

## AI-035 · `OWNER-TODO` · eldreve.com still calls itself GoldRose

Found while verifying that the new footer would work in production. The
2026-08-05 rename (AI-021) changed code, copy and assets — but **not the two
hosted settings rows**, because settings live in the database, not the repo.
Verified against the live site and the hosted database on 2026-08-06:

| Hosted row                 | Live value                        | Should be                        |
| -------------------------- | --------------------------------- | -------------------------------- |
| `store.name`               | `GoldRose`                        | `ELDREVE`                        |
| `search_engine.home_title` | `GoldRose — 24K Gold Dipped Roses` | `ELDREVE — 24K Gold Dipped Roses` |

`curl https://eldreve.com/` returns **"GoldRose" 18 times**, including the
`<title>`, the OpenGraph/Twitter `content=` tags, and all three Schema.org
blocks (`Organization`, `WebSite`, `Store` — the machine-readable identity that
crawlers and AI assistants read).

**Why it matters beyond tidiness.** This compounds the TikTok rejection in
AI-034: the reviewer's checks see *three different names* — the application
says Zhongshu Technology Worldwide Limited, the domain says eldreve.com, and
the page's title and structured data say GoldRose. Publishing the entity name
in the footer fixes one leg; this fixes the other.

**The fix is data, not code — no deploy needed.** On production
`/admin/settings`: General → Store name → `ELDREVE`; Search engine & AI →
Homepage title → `ELDREVE — 24K Gold Dipped Roses`. Storefront pages revalidate
within 300s. The repo's seed already carries the right values; seeds only fill
*missing* keys, so they will never overwrite an existing row.

While in there, `store.contact_email` is still `support@goldrose.example` — set
it to `support@eldreve.com` (the Cloudflare catch-all already routes it).

Location: [`lib/supabase/seed-data.ts`](../../lib/supabase/seed-data.ts)

---

## Delivered this session

- `lib/company.ts` — new. The single formatter for the legal identity:
  `companyPostalLines`, `hasCompanyName`, `hasPostalIdentity`,
  `companyEmailFooter`. Pure, no I/O; blank owner data yields nothing at all
  rather than a half-filled block. The two predicates differ on purpose: a bare
  entity name is enough to **publish** (that is the TikTok check) but not
  enough to satisfy CAN-SPAM, which wants a physical address.
- `components/SiteLegalFooter.tsx` + `app/page.tsx`, `app/shop/page.tsx`,
  `app/products/[slug]/page.tsx` — the visible legal identity line, rendered
  outside the Figma canvas. See AI-034.
- `lib/supabase/seed-data.ts` — `SettingsShape.store` gained `legal_name`,
  `registration_number`, `address_lines`. Seeds blank on purpose; the seed
  contact email moved off the stale `support@goldrose.example`.
- `app/admin/(dashboard)/settings/` — a **Legal business identity** block in
  the General card (`actions.ts` zod schema allows `""` so a half-filled form
  still saves; the address is one textarea, one line per row, because postal
  formats differ by country).
- `lib/admin/i18n.ts` — seven new keys, EN + 中文.
- `components/screens/ContactLegalScreen.tsx` + `app/policies/contact-legal/` —
  the coming-soon scaffold became a real page, and is now indexable. It is
  **not** a pixel-exact import: frame `2118:245` is still not Ready-for-dev,
  but the page is a payment prerequisite, so it ships as plain typography in
  the shared cream/Playfair idiom and the frame replaces it later.
- `lib/email.ts` — the buyer's two emails (order confirmation, shipping
  confirmation) now carry the company postal footer. The owner's internal
  new-order alert deliberately does not.
- `tests/unit/company.test.ts` — 5 tests; 72/72 unit tests pass. Typecheck and
  lint clean. Both page states verified in the browser at 375×812.
