# Open bug — typing in a picked field crashes the screen

**Status: NOT FIXED.** Two attempts failed. `77b2e30`'s commit message claims
otherwise and is wrong; this file is the correction.

## What happens

1. Arm the picker on `/admin/content/home`
2. Click anything in the preview — the panel opens correctly
3. Type in it, or delete a character

→ `Maximum update depth exceeded`, and the screen dies to "This page couldn't
load". Reproduced on 2026-08-08 against `77b2e30`.

## Why the test suite does not catch it

It cannot. **Nothing in the e2e suite drives the picker** — the four tests
touched in `dbd7d5c` all reach fields through the search-and-list path instead.
So 146 green tests say nothing whatever about this, and reading them as
reassurance is the mistake that let two bad fixes ship.

## What was tried, and why each was not enough

- `95a57a6` — publish only real movement (half-pixel epsilon) on both frame
  loops. Necessary, not sufficient: two rAF loops at 60Hz whose inputs are each
  other's outputs still oscillate; an epsilon narrows the window rather than
  closing it.
- `77b2e30` — remove the panel's loop entirely, measuring it on a
  ResizeObserver plus scroll/resize instead. Removed one loop. The crash
  survived it, so the cycle does not depend on that loop.

## The remaining suspect

`setDraft` → `patchField` writes the new text into the iframe's DOM → the
element's rect changes → the picker's rAF loop measures it → `setView` →
the editor re-renders → the panel re-renders → repeat. Typing is the only
thing that feeds geometry back into React, which fits: nothing else crashes.

**Likely fix:** stop measuring `selected` rects on a loop at all. Freeze them
the way the panel's position is now frozen — captured when the selection is
made, refreshed only on scroll/resize — so a keystroke cannot become a
measurement. The hover rect still needs the loop; the selection does not.

## Do this first

Write the Playwright test before touching the code:

```
arm the picker → click [data-field="hero.title"] → type → assert no crash
```

Driving this by hand failed repeatedly, and every failure was a signal that the
path needed a test rather than more improvisation.
