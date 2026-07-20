# AGENTS.md

Operating guide for AI coding agents (and humans) working in this repository.
Read this and [`context.md`](context.md) before making changes.

## What this project is

A **compiled static website** documenting the chronology of the **Fraternidade
Sacerdotal São Pio X** (Society of Saint Pius X, founded 1970). A single JSON
file is the source of truth; a zero-dependency Node script compiles it into
static HTML served by GitHub Pages.

The architecture deliberately mirrors the sibling project
[`cronologia/fsp`](https://github.com/cronologia/fsp) — its ADRs
(`fsp/docs/adrs/`) explain *why* things are built this way (zero dependencies,
JSON as single source of truth, publish from `docs/`, Wayback archiving,
sourcing policy). Follow them here too.

## Repository map

```
data/chronology.json     SOURCE OF TRUTH — facts, events, figures, organizations, references (hand-edited)
data/archives.json       Wayback snapshot cache (GENERATED — do not hand-edit; not yet populated)
src/styles.css           Stylesheet (copied into the build)
data/glossary-terms.json VENDORED, PINNED list of cronologia/glossary term ids (written by scripts/sync-glossary-terms.js; committed) — validates [[term-id]] cross-links offline
scripts/validate-data.js Schema check (runs in CI before the build) — also fails on unknown glossary [[term-id]] links
scripts/sync-glossary-terms.js  Refresh data/glossary-terms.json from cronologia/glossary (out-of-band; needs network)
build.js                 Compiler: data/chronology.json -> docs/
test/                    node:test unit tests (helpers + data invariants + drift check)
.github/workflows/deploy.yml  CI: validate, test, build, drift check, Pages deploy (opt-in)
docs/                    COMPILED OUTPUT, served by GitHub Pages (committed)
```

## Common commands

```bash
node build.js                       # compile data/chronology.json -> docs/
node scripts/validate-data.js       # schema check (runs in CI before the build)
node --test                         # unit tests
python3 -m http.server -d docs 8000 # local preview at http://localhost:8000
```

There is **no `npm install`** — the toolchain is intentionally dependency-free
(see fsp ADR-0001). Don't add runtime dependencies.

## Working agreements

1. **Edit data, not output.** Change `data/chronology.json`, then run
   `node build.js` and commit the regenerated `docs/` in the same change.
   Never hand-edit `docs/index.html`.
2. **Keep the build green.** After any change, `node scripts/validate-data.js`,
   `node --test` and `node build.js` must all succeed. CI also fails if `docs/`
   drifts from the data.
3. **Cite every fact.** Every `facts[]`, `events[]`, `figures[]` and
   `organizations[]` entry must carry a non-empty `sources[]` array of
   reference ids (the validator enforces this).
4. **Archive new sources** (planned). The Wayback archiving pipeline from
   `fsp` (`scripts/archive-refs.js` + `data/archives.json`) is not yet ported;
   until it is, prefer stable URLs and note volatile ones. The build already
   renders archived-fallback links whenever `data/archives.json` exists.

## Data quality & sourcing rules (important)

This is a reference work about a religiously and canonically contested subject.
Accuracy and neutrality matter more than completeness.

- **Never fabricate.** If a date or claim is uncertain, mark it unverified
  (`dateVerified: false`, `verified: false`) rather than guessing.
- **Attribute contested claims.** The Society's canonical status is described
  differently by the Holy See, the SSPX itself, and its critics. Attribute each
  characterization to its author ("the Vatican stated…", "the SSPX holds…");
  never assert one side in the site's own voice.
- **Do not conflate the SSPX with sedevacantism** — the SSPX recognizes the
  reigning pope. Splinter groups (SSPV, the "Resistance") are distinct. See
  `context.md`.
- **Stay neutral.** Describe; don't advocate or editorialize. Sources span
  official (vatican.va), the Society's own (sspx.org, fsspx.com.br), and
  independent/critical perspectives by design.

## Glossary cross-links (optional, off by default)

Prose fields can link into the shared **Cronologia glossary**
(`https://cronologia.github.io/glossary/<term-id>/`) instead of re-explaining a
term, using an inline marker:

- `[[term-id]]` — link whose visible text is the id (e.g. `[[schism]]`).
- `[[term-id|visible text]]` — link with custom visible text
  (e.g. `[[latae-sententiae|latae sententiae]]`).

`term-id` is a glossary slug (`[a-z0-9]` then `[a-z0-9-]*`). Markers are
expanded **after** HTML-escaping and only when a `[[` is present, so a field
with no marker renders byte-for-byte identically to a build without the feature
(the same opt-in contract as the visualizations). Markers are honored in the
main prose fields: `facts[].value`, `events[].text`, `figures[].role` /
`.notes`, `organizations[].relation` / `.notes`, and `disambiguation.items[].text`.
Link the first or most salient mention of a term, not every occurrence.

**Validation is offline and deterministic.** `data/glossary-terms.json` is a
*pinned, vendored* copy of the glossary's term-id list — the build never fetches
it, matching this repo's no-network-in-build rule (only the out-of-band
`archive-refs.js` / `sync-glossary-terms.js` scripts touch the network).
`scripts/validate-data.js` scans every string field for `[[…]]` markers and
**fails the build** on any id not in that pinned list. Refresh the list after
the glossary changes and commit the diff:

```
node scripts/sync-glossary-terms.js                       # sibling ../glossary or the published raw JSON
node scripts/sync-glossary-terms.js ../glossary/data/glossary.json   # explicit local source
```

## Git & PR conventions

- A merged PR is finished; never reuse its branch for new work — branch fresh
  from the default branch.
- Keep `docs/` in sync with `data/` in every commit that touches data.
- Write descriptive commit messages explaining the *why*.
