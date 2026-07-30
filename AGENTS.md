# AGENTS.md

Operating guide for AI coding agents (and humans) working in this repository.
Read this and [`context.md`](context.md) before making changes.

## What this project is

A **compiled static website** documenting the chronology of the **Fraternidade
Sacerdotal São Pio X** (Society of Saint Pius X, founded 1970) and its
relationship with the Holy See. A single JSON file is the source of truth; a
zero-dependency Node script compiles it into static HTML served by GitHub Pages.

It is the largest dataset in the family: **60 events, 22 figures, 7
organizations, 96 references**, plus an episcopal-genealogy section (four trees),
a divisions branch timeline (five branches), a chronology density spine, a
six-lane thread taxonomy rendered as swimlanes (#62), and **per-figure dossier
pages** for the figures that clear the criterion below.

The repo consumes the shared machinery in
[`cronologia/core`](https://github.com/cronologia/core) — the project template,
the working method as skills, and agent-side tooling. The architecture also
mirrors the older sibling project
[`cronologia/fsp`](https://github.com/cronologia/fsp), whose ADRs
(`fsp/docs/adrs/`) explain *why* things are built this way (zero dependencies,
JSON as single source of truth, publish from `docs/`, Wayback archiving,
sourcing policy). Follow them here too. This repo's own standing decisions are
in [`adr/0001-project-scope-and-adopted-template.md`](adr/0001-project-scope-and-adopted-template.md),
[`adr/0002-multilingual-pt-es.md`](adr/0002-multilingual-pt-es.md) and
[`adr/0003-per-figure-pages.md`](adr/0003-per-figure-pages.md).

## Repository map

```
data/chronology.json     SOURCE OF TRUTH — facts, events, figures, organizations,
                         episcopalLineage, branchTimeline, chronologySpine, disambiguation,
                         meta.threads + events[].threads (the lane taxonomy decided in #62 — an
                         EDITORIAL READING, not a neutral index; read meta.threads.note and the
                         lane bases before tagging a new event), references (hand-edited)
data/archives.json       Wayback snapshot cache (GENERATED — do not hand-edit; 32 snapshots)
data/glossary-terms.json VENDORED, PINNED list of cronologia/glossary term ids (written by scripts/sync-glossary-terms.js; committed) — validates [[term-id]] cross-links offline
data/i18n/{pt,es}.json   Machine-translation caches, English source string -> translation (GENERATED — do not hand-edit; managed by scripts/translate.js; 314/314 each)
src/styles.css           Stylesheet (copied into the build)
scripts/validate-data.js Schema check (runs in CI before the build) — also fails on unknown glossary [[term-id]] links
scripts/sync-glossary-terms.js  Refresh data/glossary-terms.json from cronologia/glossary (out-of-band; needs network)
scripts/archive-refs.js  Wayback preservation: references[] -> data/archives.json (out-of-band; needs network)
scripts/check-links.js   Link-health checker: reports dead/SUSPECT/inconclusive refs (out-of-band; never edits data)
scripts/translate.js     Translation-cache manager for data/i18n/*.json — `--stats` reports coverage (offline-safe no-op; no backend needed)
build.js                 Compiler: data/chronology.json -> docs/{en,pt,es}/ (index + figures/<id>.html)
                         + root redirect stub + sitemap.xml + robots.txt
test/                    node:test unit tests (build helpers, data invariants + drift check,
                         glossary links, viz renderers, link-health helpers, figure pages)
.github/workflows/deploy.yml        CI: validate, test, build, drift check, Pages deploy (opt-in)
.github/workflows/wayback.yml       CI: weekly Wayback run, commits archives.json + docs/
.github/workflows/link-health.yml   CI: weekly link check, opens/updates one "link health" issue
.claude/skills/          VENDORED, PINNED copies of the cronologia/core skills (GENERATED — see below)
KEYWORDS.md              SEARCH FINDING AID — what to grep for, and which obvious terms are dead
                         ends. Mechanical sections are GENERATED (core/tools/build-keywords.py,
                         between the markers); the hand-written "## Search traps" section outside
                         them survives regeneration. Documentation only — never affects the build.
adr/                     This repo's standing decisions (ADR-0001, ADR-0002, ADR-0003)
docs/                    COMPILED OUTPUT, served by GitHub Pages (committed) —
                         docs/index.html is a REDIRECT STUB; the real pages are docs/{en,pt,es}/index.html
                         and docs/{en,pt,es}/figures/<id>.html (one per figure that has an id)
```

## Common commands

```bash
node build.js                       # compile data/chronology.json -> docs/{en,pt,es}/ (+ stub, sitemap, robots)
node scripts/translate.js --stats   # i18n coverage: which strings still need a pt/es translation
node scripts/validate-data.js       # schema check (runs in CI before the build)
node --test                         # unit tests
python3 -m http.server -d docs 8000 # local preview at http://localhost:8000
```

There is **no `npm install`** — the toolchain is intentionally dependency-free
(see fsp ADR-0001). Don't add runtime dependencies.

## The operational loop

Every change that touches data or the renderer runs the same gate, in order:

```bash
node scripts/validate-data.js   # 1. schema + sources[] + glossary ids
node --test                     # 2. unit tests, including the docs/ drift check
node build.js                   # 3. regenerate docs/
git add data docs && git commit # 4. data + regenerated docs in ONE commit
```

Documentation-only changes must leave `docs/` byte-identical — if `git status`
shows `docs/` after a docs-only edit, something is wrong.

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
4. **Archive new sources.** The Wayback pipeline from `fsp` is now ported:
   `scripts/archive-refs.js` writes `data/archives.json`, `build.js` renders
   archived-fallback links, and `wayback.yml` re-runs it weekly. Prefer stable
   URLs anyway, and note volatile ones. `scripts/check-links.js` +
   `link-health.yml` report rot; neither script ever edits
   `data/chronology.json`.
5. **Never hand-edit generated files** — `docs/`, `data/archives.json`,
   `data/glossary-terms.json`, `data/i18n/*.json`, `.claude/skills/`.
   When English prose changes, re-author the affected `pt`/`es` strings
   (`node scripts/translate.js --stats` shows what is missing) so a locale does
   not drift stale. English is authoritative; translations never add, drop or
   change a claim, an attribution or a `[[term-id]]` marker (ADR-0002).
6. **One repo, one committer.** Exactly one agent owns this dataset at a time.
   Serialize instead of racing.

## Data quality & sourcing rules (important)

This is a reference work about a religiously and canonically contested subject.
Accuracy and neutrality matter more than completeness.

**The canonical rules are the `sourcing-rules` skill**, vendored here at
[`.claude/skills/sourcing-rules/SKILL.md`](.claude/skills/sourcing-rules/SKILL.md)
(canonical copy: `cronologia/core/skills/sourcing-rules/SKILL.md`). Load it
before editing any data file or writing site copy. Its five rules — cite or
flag; attribute, don't assert; sources span the spectrum by design; date
time-sensitive statuses; testimony is a perspective, not a fact source — govern
everything here. In addition, in this repo specifically:

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

## Which skills apply here, and when

The skills are **vendored, pinned copies** under `.claude/skills/`. They are
GENERATED: edit them in `cronologia/core/skills/` and re-sync — never in place.

```bash
python3 ../core/tools/sync-skills.py fsspx            # refresh the vendored copies
python3 ../core/tools/sync-skills.py fsspx --check    # drift check, writes nothing, exit 1 if stale
```

| Skill | Load it when |
|---|---|
| `sourcing-rules` | **Always, first**, before any data edit or site copy. |
| `data-edit` | Editing `data/chronology.json`: query first, then edit, then validate → test → build → commit data + `docs/` together. |
| `ingest-report` | Turning a research report or dossier into dataset entries — only what was marked verified-with-a-source; keep the report's exact attribution language; unverified items stay out and are reported on the ticket. |
| `net-access` | Any source that 403s, 406s or looks geoblocked (grupodepuebla.org, forodesaopaulo.org) or needs a desktop UA (sspx.org, fsspx.news, vatican.va). Check the local vault first; never route around the proxy. |
| `preserve-sources` | Running `archive-refs.js` / `check-links.js`, triaging link rot, or deciding whether a source is vaulted centrally. |
| `adopt-template` | Pulling a new renderer, validator rule or workflow down from `cronologia/core/template/`. |
| `release-work` | Branching, fast-forwarding, committing, pushing, and reporting what shipped and what was deferred. |
| `dossier-research` | Building a person dossier (the figures in `figures[]`). |
| `mine-video` | Mining an interview/testimony video into a transcript and then into candidate entries. |
| `bootstrap-project` | Only when standing up a *new* project repo — not for work here. |

## Agent-side tooling (cronologia/core/tools)

Python 3, stdlib only, read-only: these tools **never write anything in
`data/`**. Query before reading whole files — `data/chronology.json` is ~67 KB.

```bash
python3 ../core/tools/dataset-query.py fsspx stats                # size and shape
python3 ../core/tools/dataset-query.py fsspx find <keyword>       # locators, not a whole-file read
python3 ../core/tools/dataset-query.py fsspx event 1988           # or a range: 1970-1976
python3 ../core/tools/dataset-query.py fsspx figure "Lefebvre"
python3 ../core/tools/dataset-query.py fsspx refs --unarchived    # preservation gaps
python3 ../core/tools/dataset-query.py fsspx unverified           # the verification worklist
python3 ../core/tools/unverified-report.py fsspx --markdown       # paste-ready ticket checklist
python3 ../core/tools/mine-prep.py <transcript.txt> --lang pt     # transcript -> candidate sheet
python3 ../core/tools/xref.py --repos fsspx,tariqa,perennialism   # cross-repo consistency
python3 ../core/tools/build-keywords.py fsspx --out KEYWORDS.md   # refresh the search finding aid
```

**Before searching a corpus, mining a transcript or opening a dossier, read
[`KEYWORDS.md`](KEYWORDS.md)** — especially its hand-written `## Search traps`
section. The obvious term is frequently the wrong one here: `FSSPX` returns
**zero** hits across the 7.16M-word COF corpus (which writes *Sociedade de São
Pio X*), the correct spelling `Lefebvre` appears in only 2 of the 121 vaulted
auto-caption transcripts, and the Latin terms of art must not be translated.
When a mining session turns up a new dead term, naming variant, ASR mangling or
false friend, **add it to `## Search traps`** rather than leaving it in a closed
ticket — that section is outside the generated markers and survives
`build-keywords.py`. Never invent a variant: list only spellings you actually
observed, and say where.

`xref.py` prints every entity present in 2+ repos side by side and flags
`CONTRADICTION` / `DIFFERS`. Nothing is auto-resolved — the flags are review
candidates, and resolving one is a sourcing decision backed by citations.

## Where this repo sits in the family

The family map is [`cronologia/core/DEPENDENCIES.md`](https://github.com/cronologia/core/blob/main/DEPENDENCIES.md).
Read it before touching a shared entity. This repo's own boundaries:

- **fsspx owns Catholic traditionalism** — the SSPX, its splits (FSSP, SSPV,
  the Campos line, the "Resistance"), and the canonical-status story.
- **fsspx ↔ `tariqa` / `perennialism`.** Keep the three "traditionalisms"
  apart: Catholic traditionalism ≠ the Guénon–Schuon Traditionalist School
  (`tariqa` = the Maryamiyya **order**; `perennialism` = the **ideas**) ≠
  Evola's political Traditionalism. Where a figure or claim touches them — the
  Coomaraswamy and Guérard des Lauriers threads are the live ones — **cross-link,
  never duplicate**: the other repo owns its side of the material.
- **fsspx ↔ `fsp` / `tl`.** Out of scope here. `fsp` is the architectural
  ancestor, not a content dependency; CEBs and liberation theology belong to
  `tl`.
- **fsspx ↔ `glossary`.** A term more than one project needs is defined in the
  glossary and linked with `[[term-id]]`, not re-explained here.
- **fsspx ↔ `archive`.** A source cited by 2+ projects is vaulted centrally
  (archive ADR-0001), not copied in here. The archive is private: reader-facing
  citations are always the original URL plus its Wayback snapshot.

## Per-figure pages: who gets one, and what the id means

Full rationale in [`adr/0003-per-figure-pages.md`](adr/0003-per-figure-pages.md).
The short version, because **this rule is meant to be reused in the other repos**
(`celam` presidencies, `tariqa` figures, `perennialism` lineage figures):

> **The 3 × 3 rule.** A figure gets its own page — `figures/<id>.html`, emitted
> in all three locales — only if it (1) denotes a **single person**, (2) is a
> **subject of this chronology, not a counterparty** or an entity another repo
> owns, (3) is linked to **≥ 3 dated events**, and (4) those events plus the
> figure record cite **≥ 3 distinct references**. Everything below the bar stays
> a card. A stub page for a figure with two sourced lines is worse than a card.

Mechanics:

- A page exists because the figure record carries `"id"`. **The id is data, not
  derived from the name**, it matches the glossary slug grammar
  (`[a-z0-9][a-z0-9-]*`), and once a page has been built the id is a
  **permanent URL** — never rename it; retire it behind a redirect instead.
- Linkage is evidentiary: add a figure id to `events[].figures` only when the
  event's own text names the figure or the figure is its unambiguous actor, and
  when a figure has a page, link **every** such event, not just enough to clear
  the threshold.
- `scripts/validate-data.js` **fails the build** on an `id` that misses a
  threshold, on a duplicate id, and on an unknown id in `events[].figures` or an
  `episcopalLineage` node's `figure`. Clauses 1 and 2 are editorial and live in
  the ADR.
- `allRoutes(data)` drives both the build loop and `sitemap.xml`, so a figure
  page can never ship unindexable.
- Verification flags render **on the page, above the dossier**: unverified
  linked-event dates, an explicit `figures[].datesVerified: false`, and a
  derived notice when the record rests on a single source. Clearing a flag needs
  a citation — it is never a rendering decision.

Today the rule selects 7 of 21 figures. Licínio Rangel and Fernando Arêas Rifan
are the nearest misses (2 linked events each); a third and fourth dated event
apiece from the Campos material promotes them with no renderer change.

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
`archive-refs.js` / `check-links.js` / `sync-glossary-terms.js` scripts touch
the network). `scripts/validate-data.js` scans every string field for `[[…]]`
markers and **fails the build** on any id not in that pinned list. Refresh the
list after the glossary changes and commit the diff:

```
node scripts/sync-glossary-terms.js                       # sibling ../glossary or the published raw JSON
node scripts/sync-glossary-terms.js ../glossary/data/glossary.json   # explicit local source
```

## Git & PR conventions

- A merged PR is finished; never reuse its branch for new work — branch fresh
  from the default branch.
- Bring a branch current with `git merge --ff-only origin/main`. If it cannot
  fast-forward, **stop and report** — never reset, force or rebase published
  history.
- Keep `docs/` in sync with `data/` in every commit that touches data.
- Write descriptive commit messages explaining the *why*.
