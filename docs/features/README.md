# docs/features/

One markdown file per feature ("record"). Status lives ONLY in each record's
front matter — never as prose in a body. [`TEMPLATE.md`](TEMPLATE.md) is the
authority for keys, vocabulary, state meanings, and body sections;
`scripts/features/cli.mjs` enforces it.

## Commands

- `node scripts/features/cli.mjs new <feature-id>` — scaffold
  `docs/features/<feature-id>.md` born at `delivery: backlog`. Kebab-case id
  = filename = H1; ids already taken are refused. Then read
  [`TEMPLATE.md`](TEMPLATE.md) (key vocabulary and section rules), fill
  Context, delete each guidance comment you fulfil, and add the record's row
  to the Roadmap table below.

- `node scripts/features/cli.mjs check` (`npm run features:check`, also in
  CI) — validate every record: key vocabulary and order, presence tiers,
  evidence-gated ACCEPTED, H1 = id, guidance-comment survival, relative
  links, roadmap freshness. Reports every problem at once, exits non-zero.
- `node scripts/features/cli.mjs roadmap --sync` (`npm run features:roadmap`)
  — regenerate the Roadmap block below from record front matter; `check`
  fails while the committed block is stale.

## Roadmap

Generated from record front matter — regenerate with
`node scripts/features/cli.mjs roadmap --sync`; never edit inside the
markers (`check` fails when the block is stale). Meter legend:

`○○○○ BACKLOG · ●○○○ READY · ●●○○ IN PROGRESS · ●●●○ UAT · ●●●● ACCEPTED · ✕ DROPPED`

<!-- BEGIN features:roadmap -->

| Record | Delivery | Rollout |
| ------ | -------- | ------- |
| [db-backups](db-backups.md) | ○○○○ backlog | not-deployed |
| [product-content-pipeline](product-content-pipeline.md) | ○○○○ backlog | not-deployed |
| [promotion-emails](promotion-emails.md) | ○○○○ backlog | not-deployed |
| [tiktok-analytics](tiktok-analytics.md) | ○○○○ backlog | not-deployed |
| [card-payments](card-payments.md) | ●○○○ ready | not-deployed |
| [shipping-rates](shipping-rates.md) | ●○○○ ready | not-deployed |
| [customer-accounts](customer-accounts.md) | ●●○○ in-progress | live |
| [database-migrations](database-migrations.md) | ●●○○ in-progress | live |
| [engagement-tracking](engagement-tracking.md) | ●●○○ in-progress | live |
| [feature-records](feature-records.md) | ●●○○ in-progress | not-deployed |
| [product-reviews](product-reviews.md) | ●●○○ in-progress | live |
| [checkout-screens](checkout-screens.md) | ●●●○ uat | live |
| [domain-and-email](domain-and-email.md) | ●●●○ uat | live |
| [home-content-admin](home-content-admin.md) | ●●●○ uat | live |
| [media-spotlight](media-spotlight.md) | ●●●○ uat | live |
| [order-tracking](order-tracking.md) | ●●●○ uat | live |
| [paypal-wallet](paypal-wallet.md) | ●●●○ uat | test-deployment |
| [posting-account-attribution](posting-account-attribution.md) | ●●●○ uat | live |
| [shop-facets](shop-facets.md) | ●●●○ uat | live |
| [storefront-search](storefront-search.md) | ●●●○ uat | live |
| [region-alignment](region-alignment.md) | ●●●● accepted | live |

<!-- END features:roadmap -->

