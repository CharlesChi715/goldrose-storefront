# 2026-07-25 · homepage + shop mechanism table (主页_shop页机制)

Received from the design team 2026-07-25. Parsed into `shop.md` (N-01…N-15) and
`homepage.md` (H-01…H-37, cited across `components/home/` and
`tests/e2e/homepage.spec.ts`). Both parse outputs, and the annotated
screenshots they embedded, were **retired from the docs tree 2026-08-04** —
interaction design is maintained in Figma now. This delivery folder remains the
authority on wording.

Came from the gitignored `temp/` on 2026-07-30.

## Files

- `主页_shop页机制.numbers` — 20 MB —
  `324ef147c4c67f41757f346ba3820e5ffc8cd9de9eaa391bd8a41d125ae32251`
  — the original the team sent; the authority on wording.
- `homepage.zh.md` — 28 KB — verbatim Chinese export.
  - as received: `f69b80521f320b1c558a695fbb0b155b50e2e1e31616572946a98426d7dfa0ce`
  - on disk now: `00ad0b9fc98712a5754f047b4d99a746eee56c8b18ea6e274df4b7ad1304efa3`
    (differs only by the link re-base recorded below)

The English working copy `homepage.md` is a parse **output**, so it never lived
here (it sat in `docs/ixd/`, now archived).

## Edits since receipt

2026-07-30 — `homepage.zh.md`: 38 relative links re-based (`../docs/ixd/…` →
`../../../docs/ixd/…`, and the README link) after the move out of `temp/`. The
screenshot embeds are plumbing we added during import; no delivered word
changed. The `.numbers` original is untouched.

2026-08-04 — `homepage.zh.md`: those same 37 screenshot embeds **removed**. The
screenshots they pointed at were retired with the parse outputs (interaction
design now lives in Figma), and the target folder must not be linked from
anywhere. Plumbing only; no delivered word changed. The `.numbers` original
still holds the screenshots.
