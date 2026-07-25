# ADR-0003 — Per-figure pages: the substance threshold, the id scheme, the route

- **Status:** accepted (2026-07-25)
- **Context repo:** `cronologia/fsspx` (ticket #50; the last open deliverable of
  epic #7, deferred there with the condition *"once the dataset justifies it"*)
- **Builds on:** this repo's ADR-0001 (consume `cronologia/core/template`, do not
  fork it) and ADR-0002 (locales, per-locale SEO, machine-translation policy);
  core ADR-0001 (shared-renderer contract: new renderers are data-driven and
  optional); core#3 (print-friendly, book-series goal)

## Context

Ten bishop dossiers (#8–#17) landed in `data/chronology.json` as `figures[]`
records, `events[]` entries and `episcopalLineage` nodes. All of that renders on
a single page, so a reader searching for one person has nowhere to land, and the
material a dossier ticket produced — a dated canonical-status timeline, the
consecration relationships, the controversies with each characterization
attributed — is spread across four sections of one long document.

The obvious move is "a page per figure". The obvious failure mode is also
clear: **a stub page for a figure with two sourced lines is worse than a card.**
It gives a thin record the visual authority of a dossier, it competes with the
main page in search results, and it is a promise the dataset cannot keep. So the
question this ADR settles is not *whether* to emit per-figure pages but *which
figures earn one*, and it settles it as a written rule rather than a judgement
call, because the rule will be reused (`celam` presidencies, `tariqa` figures,
`perennialism` lineage figures all have the same need).

## Decision

### 1. The criterion — the "3 × 3 rule", plus the subject test

A figure gets its own page **iff** its record carries an explicit `id`, and a
figure may carry an `id` only when **all four** of the following hold:

1. **Single subject.** The record denotes one person. Composite cards (this
   dataset has one: the four 2026 consecrands on a single card) never get a
   page; split the record first if a page is wanted.
2. **Subject, not counterparty.** The person is a *subject* of this chronology —
   inside the boundary this repo declares in
   [`core/DEPENDENCIES.md`](https://github.com/cronologia/core/blob/main/DEPENDENCIES.md)
   — not an external counterparty, and not an entity another repo owns. fsspx
   owns Catholic traditionalism: the Society's bishops and superiors, and the
   figures of its splits. Popes and Roman dicastery heads appear here as the
   *Holy See side* of the story; their acts are already the events, and a page
   here would present a page-shaped biography this repo has done no dossier work
   to support. They keep a card. Likewise Rama P. Coomaraswamy, whose dossier
   `tariqa` and `perennialism` own — cross-link, never duplicate.
3. **Timeline depth ≥ 3.** At least three dated `events[]` entries link to the
   figure. A page whose body is a single paragraph is the stub failure above.
4. **Source breadth ≥ 3.** The figure record together with its linked events
   cites at least **three distinct `references[]` entries**. One-source
   biographies stay cards: on a standalone page the sourcing discipline's
   "sources span the spectrum by design" has to mean something.

**Linkage is evidentiary, not promotional.** An event links to a figure only
when the event's own text names the figure or the figure is its unambiguous
actor — the same standard as every other claim here. Linking loosely to clear
the threshold is the one way to break this rule, so linkage for a figure that
has a page is **exhaustive**: every event that meets the standard is linked, not
just the first three.

Thresholds 3 and 3 are conventions, not discoveries. They are set where they
are because two events and two sources is exactly the card this dataset already
renders well, and because at three the page acquires the two things a card
cannot show: a sequence, and disagreement between sources.

`scripts/validate-data.js` enforces clauses 1, 3 and 4 mechanically — an `id`
whose figure misses a threshold **fails the build**, with a message naming the
rule. Clause 2 is an editorial gate and is recorded here, not in code.

### 2. What the criterion selects today (7 of 21 figures)

| Figure | id | linked events | distinct refs |
|---|---|---:|---:|
| Marcel Lefebvre | `marcel-lefebvre` | 15 | 11 |
| Antônio de Castro Mayer | `antonio-de-castro-mayer` | 6 | 7 |
| Bernard Fellay | `bernard-fellay` | 7 | 10 |
| Bernard Tissier de Mallerais | `bernard-tissier-de-mallerais` | 5 | 8 |
| Richard Williamson | `richard-williamson` | 11 | 11 |
| Alfonso de Galarreta | `alfonso-de-galarreta` | 6 | 10 |
| Davide Pagliarani | `davide-pagliarani` | 4 | 5 |

The rule is applied, not steered. It excludes figures a "pages for the bishops"
instinct would have included, and those exclusions are the evidence it works:

- **Licínio Rangel** (2 linked events) and **Fernando Arêas Rifan** (2) — the
  Campos line, and this site's most Brazil-relevant bishops. They miss on
  timeline depth. They are the nearest misses and the clearest next dossier
  work: a third and fourth dated event apiece from the Campos material promotes
  both automatically, with no change to the renderer.
- **Franz Schmidberger** (1), **François Charrière** (1), **Pierre Mamie** (1),
  **Vitus Huonder** (1), **Athanasius Schneider** (1) — thin here by design.
- **Paul VI, John Paul II, Benedict XVI, Francis, Leo XIV** — several clear the
  3 × 3 thresholds on events and sources; they are excluded by clause 2.
- **The four 2026 consecrands** — one composite record, excluded by clause 1.

Note that `davide-pagliarani` is a priest, not a bishop, and the ticket asked
for "the bishops". The criterion is about substance, not office, and applying it
consistently means the sitting Superior General — the actor in the 2018 and 2026
events — gets the page his record supports.

### 3. The id scheme (permanent URLs, settled before the first build)

`figures[].id` is **explicit data, hand-assigned, and immutable once built**.
It is never derived from the display name at build time. Deriving it would make
every published URL hostage to a prose edit: fixing a diacritic or adding a
regnal name would silently move the page and break every inbound link.

Grammar: `^[a-z0-9][a-z0-9-]*$` — the same slug grammar the glossary uses for
`[[term-id]]`, so the two id spaces read alike and validate alike.

Construction, for the assignment of a *new* id only:

- the person's conventional full name as the record's `name` gives it,
- ASCII-folded (`Antônio` → `antonio`, `Licínio` → `licinio`, `Arêas` → `areas`),
- lower-cased, spaces to hyphens,
- no honorifics, titles, offices, regnal numbers or parentheticals,
- particles kept as written (`bernard-tissier-de-mallerais`,
  `alfonso-de-galarreta`).

Once a page has been built and published the id is frozen. A wrong or ugly id is
**not** renamed: it is lived with, or retired behind a redirect stub in a
separate, deliberate change. Ids are unique across `figures[]`; the validator
fails on a duplicate.

### 4. The route and the emitter

Per-figure pages use the template's existing route mechanism — one route per
`(page × locale)` — rather than any new infrastructure:

- Route: `figures/<id>.html`, relative to the locale root. Published URL:
  `https://cronologia.github.io/fsspx/{en,pt,es}/figures/<id>.html`.
- `ROUTES` stays the base `['']`; `allRoutes(data)` = `ROUTES` + the data-derived
  figure routes, and it is what drives the build loop **and** `sitemap.xml`. The
  two cannot drift apart, so a page cannot be emitted unindexable.
- `alternates()`/`seoHead()` already build absolute URLs from `meta.siteUrl`, so
  canonical + hreflang across all three locales come for free. Relative links
  (stylesheet, language switcher) became route-depth-aware; at depth 0 they
  render byte-identically to before.
- Every non-English figure page carries the same visible machine-translation
  disclaimer as the index, and the ADR-0002 translation policy binds the new
  page-level UI strings: attribution and hedging are preserved, never softened.
- `[[term-id]]` markers resolve on figure pages through the same `renderText()`
  the index uses.

Per core ADR-0001 the feature is **data-driven and optional**: with no
`figures[].id` in a dataset, `allRoutes()` returns `['']` and the output is
byte-identical to a build without the feature.

### 5. Verification flags are rendered, not buried

A dedicated page gives a claim more prominence than a card did, so it must give
the *doubt* the same prominence. Each figure page carries an **"Open
verification flags"** panel, above the dossier, listing:

- every linked event whose `dateVerified` is `false`;
- an explicit `figures[].datesVerified: false`, set where the dataset itself
  records that the biographical dates are unsettled (Antônio de Castro Mayer:
  the death date is 25 April 1991 per Wikipedia EN/PT and the SSPX obituary,
  26 April 1991 per catholic-hierarchy.org — the conflict is recorded at the
  death event and is not resolved here);
- a **single-source notice**, derived — not asserted — whenever the figure
  record cites exactly one reference, which is the ticket's concern about
  dossiers resting on a single Wikipedia or Catholic-Hierarchy biography
  (`marcel-lefebvre` is in that position today).

When a page has no flags the panel still renders, and says so in the hedged
form: no flag has been raised, which is **not** a claim that every date has been
independently confirmed. Clearing a flag needs a citation and is somebody's
sourcing decision, never a rendering decision.

## Consequences

- `node build.js` emits **7 figures × 3 locales = 21 new pages**, plus the three
  index pages, the root stub, `sitemap.xml` (24 URL entries) and `robots.txt`.
- Figure cards on the index link to the pages that exist; the 14 figures without
  an `id` render exactly as before.
- The drift test covers every figure page in every locale, so a data edit that
  changes a dossier fails CI until `docs/` is rebuilt.
- Print: the figure page is a book page — the panel, the status block and the
  event table avoid page breaks, and the navigation chrome is not printed
  (core#3).
- **Extraction to `core/template` is deliberately not done here.** Per the
  adopt-template pattern this ships working in one repo first. When it is
  extracted, the 3 × 3 rule and the explicit-id scheme go up with it: they are
  the reusable part, and clause 2 is re-stated per repo against that repo's
  declared boundary.
