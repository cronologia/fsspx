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
scripts/validate-data.js Schema check (runs in CI before the build)
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

## Git & PR conventions

- A merged PR is finished; never reuse its branch for new work — branch fresh
  from the default branch.
- Keep `docs/` in sync with `data/` in every commit that touches data.
- Write descriptive commit messages explaining the *why*.
