# Figma Naming Standard

## Sections

Use uppercase section names matching the route’s first segment.

- `SHOP` contains `/shop` and every `/shop/...` route.
- `ACCOUNT` contains `/account` and every `/account/...` route.
- Sections organize frames and are not part of route extraction.

## Frames

Name every top-level frame using:

`<exact route> · <viewport> · <screen description> [· <state or additional metadata> ...]`

Examples:

- `/shop · desktop · product listing · default`
- `/shop · mobile · product listing · filter open`
- `/products/[slug] · desktop · product detail template · default`
- `/bag · mobile · shopping bag · empty`

The first two parts are the stable, already-decided prefix:

1. Everything before the first `·` is the exact application route.
2. The second part is the viewport: currently `desktop` or `mobile`.

Everything after the second `·` is flexible design-only metadata. Start with a
screen description, then add a state or other descriptive parts when useful.
Future metadata may be added at the end without changing the route or viewport.

## Dynamic Routes

Use the dynamic-route syntax from the application’s codebase:

- `[slug]`
- `[id]`

A frame such as
`/products/[slug] · desktop · product detail template · default` represents one
reusable design template for every matching product. Do not name the frame
after the sample product displayed inside it. Product URL handles follow the
separate [`product-handles.md`](product-handles.md) rule.

## Responsive Designs and States

Keep the route unchanged, put the viewport immediately after it, and record the
description and state afterward.

- `/shop · desktop · product listing · default`
- `/shop · mobile · product listing · default`
- `/products/[slug] · desktop · product detail template · in stock`
- `/products/[slug] · desktop · product detail template · out of stock`

`desktop` represents the PC or laptop layout, while `mobile` represents the phone layout.

## Components

Use lowercase slash-based hierarchy for reusable components:

- `button/primary/default`
- `button/primary/hover`
- `button/secondary/disabled`
- `icon/navigation/home`

The `/` separator organizes components in Figma’s Assets panel. It has no special hierarchy effect on ordinary frames.

## Capitalization

- **Sections:** uppercase
- **Frame routes:** lowercase
- **Frame metadata:** lowercase
- **Components:** lowercase
- **Visible interface text:** follow the product’s normal content and typography rules
