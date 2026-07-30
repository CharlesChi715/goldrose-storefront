# Component naming — purpose

|  |  |
| --- | --- |
| **What this is** | The single naming doc for **components**, in both senses used in this project: reusable Figma components (`GoldRose/Button`) and in-page components — the page bands and controls tagged `data-el` in code (`HOME-HERO-SECTION`). Successor to `docs/ixd/element-names.md` (removed 2026-07-30; old proposal in git history) — the vocabulary word is now **component**, never "element". |
| **Scope** | Component names in Figma and `data-el` component IDs in code. Frame/section naming is [`figma-route-rule.md`](figma-route-rule.md); product URL handles are [`product-handles.md`](product-handles.md). |
| **Status** | Draft — naming rules and vocabulary are not written yet |
| **Owner** | Charles |

---

## The two kinds

1. **A Figma component** is a reusable design piece the design team draws once
   and instances everywhere — `GoldRose/Button` — so its name describes a
   *role*, never the text or photo currently inside it.

2. **A `data-el` component** is one specific placement of such a piece on a
   real page, marked in code with a `data-el` attribute
   (`<section data-el="HOME-HERO-SECTION">`) so engagement tracking can report
   dwell time per section under a stable ID.

3. **They must share one vocabulary** — the same words, casing, and TYPE
   suffixes (`-SECTION`, `-BTN`) — because a designer, a developer, and an
   analytics dashboard all point at the same thing, and that consistency is
   what lets `HOME-HERO-SECTION` be traced from a chart to the Figma layer to
   the code in one lookup, `data-el` adding only the page/position prefix that
   makes each placement unique.

---

## Why component naming matters

1. **Reuse.** A component's name is how a designer finds the right piece to
   reuse: when every button is named `GoldRose/Button`, there is one button to
   maintain — but when copies are named after their text
   (`CTA / Secure Checkout`), each screen quietly grows its own look-alike fork.

2. **Design → code contract.** The name is also the contract with code: a
   developer implementing a screen maps `GoldRose/Button` straight to the
   `Button` component in the repository, with no guessing and no questions
   across the Sydney–China time gap.

3. **Durability.** Text and imagery change every time marketing edits copy, but
   a component's role never does — so naming by role is what lets a name stay
   true for the life of the design file.
