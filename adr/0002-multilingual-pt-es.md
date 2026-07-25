# ADR-0002 — Portuguese + Spanish locales, per-locale SEO, machine translation

- **Status:** accepted (2026-07-25)
- **Context repo:** `cronologia/fsspx` (ticket #38)
- **Builds on:** `cronologia/core` ADR-0001 (`template/adrs/0001-multilingual.md`)
  and core#9; this repo's ADR-0001 (consume the template, do not fork it)

## Context

The site was English-only while its primary audience is Brazilian. Reaching
Portuguese- and Spanish-speaking readers means being *found in those languages*,
not merely offering a toggle. The subject is canonically and politically
contested, so every claim on a translated page must keep the attribution and
the hedging of the English original, and the reader must know the page was
machine-translated.

## Decision

Adopt the core template's multilingual design **as built** — the decisions in
core ADR-0001 apply here verbatim and are not restated:

1. Locales `en` (authoritative, hand-written) + `pt` + `es`; locale is a path
   segment **after** the project: `/fsspx/{en,pt,es}/`. `docs/index.html` is a
   redirect stub, so every existing `/fsspx/` link keeps working; canonical
   English moves to `/fsspx/en/`.
2. `meta.siteUrl` is `https://cronologia.github.io/fsspx/`; `ROUTES = ['']`
   (single-page site) drives sitemap + hreflang completeness.
3. Data-level localization (`TRANSLATABLE_KEYS` walk) covers every renderer this
   site has — chronology, episcopal genealogy (including the typed-edge legend),
   the divisions branch timeline, glossary `[[term-id]]` links — automatically.
   The SVG geometry is computed from years, not labels, so the figures render
   identically in all three locales.
4. `data/i18n/{pt,es}.json` are **generated** caches (`scripts/translate.js`),
   pre-authored and committed; no translation backend at build or run time.
   Missing strings fall back to English. Both locales are at 302/302.
5. Every non-English page carries a visible machine-translation disclaimer.

### Two deviations from the template, to be ported back up (core)

- **`TRANSLATABLE_KEYS` adds `direct` and `indirect`** — this site is the one
  with a typed-edge genealogy, and `episcopalLineage.edgeLegend.{direct,indirect}`
  is data-driven legend text that would otherwise render in English on `/pt/`
  and `/es/`.
- **The UI table adds `founded`** — `renderOrgCard` hardcodes the English word
  "Founded" before `organizations[].founded`; all seven organization cards
  showed it untranslated.

### Translation policy (binding on whoever refreshes the caches)

Translate faithfully; never soften, sharpen or editorialize. Attributed claims
stay attributed and keep their strength ("per Sedgwick, never a formal member"
does not become "was not a member"; "declared excommunicated" does not become
"excommunicated"). Proper names, place names, organization names, reference
titles/publishers, URLs, ids and Latin terms of art (*latae sententiae*,
*motu proprio*, *pia unio*, *suspension a divinis*) are rendered as the target
language conventionally does — usually unchanged. Quoted primary sources stay in
their original language, with the gloss translated. `[[term-id]]` markers are
preserved exactly: the id is a URL and is never translated; in the
`[[id|visible text]]` form only the visible text is translated.
`scripts/validate-data.js` fails the build on an unknown id.

## Consequences

- `node build.js` emits `docs/{en,pt,es}/index.html` + the root stub +
  `sitemap.xml` + `robots.txt`. The drift test covers every locale.
- English output is unchanged in content: with the empty dictionary
  `localizeData` is the identity transform, so `/en/` differs from the previous
  `docs/index.html` only by the SEO head, the locale-relative stylesheet path
  and the language switcher.
- The caches are generated data. When the English content changes, re-author the
  affected strings (`node scripts/translate.js --stats` reports coverage) rather
  than letting a locale drift stale.
