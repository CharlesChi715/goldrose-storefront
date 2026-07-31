# Feature learning docs

End-to-end traces of how this repo actually works, written to be read in order
but usable standalone. Each one follows a single path from the first user
action to the final stored result, and stops along the way to explain *why* the
code is shaped the way it is — the industry practice behind the decision, not
just the mechanics.

The format is set by the guideline below.

| #   | Doc                                                                  | Traces                                                       | Central idea                                         |
| --- | -------------------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------- |
| 01  | [Add to cart → checkout → order](01-add-to-cart-checkout.md)         | product page → cart → `/checkout` → order row, emails, stock | The money path, mock-payment branch                  |
| 02  | [Posting, accounts, attribution](02-posting-account-attribution.md)  | forum post → identity → analytics channel                    | First-party attribution without cookies              |
| 03  | [Admin product CRUD](03-admin-product-crud.md)                       | admin form → server action → two backends                    | One `TableStore` interface, two implementations      |
| 04  | [How pages read the database](04-how-pages-read-the-database.md)     | server component → catalog view → browser                    | Anon key vs service key; what the public may see     |
| 05  | [Verifying the hosted database](05-verifying-the-hosted-database.md) | terminal → PostgREST → Postgres constraint                   | Trust, but verify — a rejection is a measurement     |
| 06  | [PayPal payment and recovery](06-paypal-payment-and-recovery.md)     | PayPal button → capture → order → webhook repair             | Idempotency, and what to do after money moves        |
| 07  | [Who can get in, who can see what](07-who-can-see-what.md)           | `/admin` request → proxy → session → allowlist → RLS         | Authentication ≠ authorization; fail closed          |
| 08  | [Price math, and who may do it](08-price-math-and-trust.md)          | cart → discount → shipping → tax → total                     | Integer cents; the server always re-prices           |
| 09  | [The safety net: tests and CI](09-tests-and-ci.md)                   | `npm test` → Playwright → GitHub Actions                     | Determinism is engineered, not hoped for             |
| 10  | [Working as a team](10-working-as-a-team.md)                         | idea → task → branch → PR → CI → squash-merge → `main`       | Ambiguity, not skill, is what makes teams feel "off" |

## Reading order

- **New to the repo:** 04 → 01 → 03. That is read, buy, manage.
- **Working on checkout or payments:** 01 → 08 → 06.
- **Working on the admin, auth, or anything hosted:** 07 → 05 → 03.
- **Changing anything at all:** 09, so you know what will and won't catch you.
- **Working with other people:** 10 — it explains the workflow every change here rides on.

Each doc ends with a "Recap" of transferable ideas — those are the parts worth
remembering after the specific code has changed.

## Guideline for writing these docs

Help me learn the project by tracing features end to end from the user entry point to the final result.

Goal:
- Understand how a feature is implemented.
- Follow the code path through UI, components, handlers, services, APIs, files, data, and tests.
- Add reason why designed like this as needed to better explain.

Format for each feature:

### Feature Summary
   - What the feature does
   - Why it exists

### Code Trace
From Entry Point, Trace to each downstream function or module
   - With ASCII chat.
   - Where the feature starts in the app. The first user action or route that triggers it. Follow the implementation path step by step. Shows the code of each steps.
