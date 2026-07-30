# Order-Detail Interaction Spec (ORDER-DETAIL-…)

> English working copy, translated by the dev side 2026-07-27 from the design
> team's Chinese original. On wording disputes the design team's source wins:
> verbatim Chinese export archived at
> [`frontend-function-draft.zh.md`](../../team-deliveries/originals/2026-07-27-order-detail/frontend-function-draft.zh.md);
> editable source is `frontend-function-draft.numbers` in the
> [same batch](../../team-deliveries/originals/2026-07-27-order-detail/) (received
> 2026-07-27). Retranslate here after the source updates.

Source: design team's `frontend-function-draft.numbers`, Sheet 1 · Table 1.
Entry IDs follow the owner's Figma naming guide
([from-teammates-figma-naming-guide.md](from-teammates-figma-naming-guide.md)); reference them the same way
as H-xx entries, e.g. `implements ORDER-DETAIL-SHARE-TRACKING`. Citation
rules: see [README](README.md).

`⚠️ Developer note`: the source table's screenshot column (局部截图) contains
only a broken image placeholder — no usable screenshots survived in the file.
Ask the design team to re-attach them; once received, store them in `assets/`
named by entry ID, per convention.

## Index

| ID | Module | Element | Target-page status |
|---|---|---|---|
| ORDER-DETAIL-VIEW-STATUS | Help / order delivery info | Primary CTA button | Already exists (delivery tracking page) |
| ORDER-DETAIL-SHARE-TRACKING | Order-detail page / gift delivery sharing | Secondary feature card | To be confirmed |
| ORDER-DETAIL-CONTACT-SUPPORT | Order-detail page / order help | Support entry card | To be confirmed |

## Help / order delivery info

### ORDER-DETAIL-VIEW-STATUS · Primary CTA button

| Field | Content |
|---|---|
| Element type | Primary action button (CTA) |
| Layout | Full-width bar below the card; dark-green background; large corner radius; centered text; right-side arrow |
| Clickable/operable | Yes |
| Trigger | Single click/tap |
| Result | Carries the current order ID; enters order status and delivery details |
| Target page/surface | Delivery tracking page |
| States & feedback | Shows pressed and loading states; on failure, prompts to reload |
| Dev notes | Carry `orderId`; validate order ownership |
| Target-page status | Already exists (delivery tracking page) |
| Change proposal | — |

## Order-detail page / gift delivery sharing

### ORDER-DETAIL-SHARE-TRACKING · Secondary feature card

| Field | Content |
|---|---|
| Element type | Secondary feature card |
| Layout | Full-width horizontal card; GIFT label on the left; title and description in the middle; right-side arrow |
| Clickable/operable | Yes |
| Trigger | Click the card or the right-side arrow |
| Result | Generates a recipient-specific tracking link and invokes the system share sheet |
| Target page/surface | Gift Tracking share surface / system share sheet |
| States & feedback | Generating, share success, copy success, generation failed; disabled with a hint when there is no tracking info yet |
| Dev notes | Link uses a read-only secure token; shows only delivery progress and estimated arrival time — hides price, payment method, and full address; supports link expiry and revocation |
| Target-page status | To be confirmed |
| Change proposal | Suggest making the whole card clickable and adding a “Copy Link” shortcut |

## Order-detail page / order help

### ORDER-DETAIL-CONTACT-SUPPORT · Support entry card

| Field | Content |
|---|---|
| Element type | Support entry card |
| Layout | Full-width horizontal card; HELP label on the left; title, description, and text link in the middle |
| Clickable/operable | Yes |
| Trigger | Click the card or “CONTACT SUPPORT” |
| Result | Carries current order info into support-channel selection or live chat |
| Target page/surface | Customer Care / Contact Support |
| States & feedback | Shows support online status, connecting, message sent, and connection-failure feedback |
| Dev notes | Carry `orderId` and order status; auto–pre-fill the issue context; hide sensitive payment info; outside service hours, show the expected reply time |
| Target-page status | To be confirmed |
| Change proposal | Suggest making the whole card clickable and adding a service-status hint such as “Online now / Reply within 24h” |
