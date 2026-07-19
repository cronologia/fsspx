# Fraternidade Sacerdotal São Pio X — Cronologia

A **compiled static website** documenting the chronology of the **Fraternidade
Sacerdotal São Pio X** (Society of Saint Pius X, SSPX/FSSPX) — the traditionalist
Catholic priestly society founded by Archbishop Marcel Lefebvre in 1970 — and its
relationship with the Holy See.

The site presents:

- The **founding** (1970, Fribourg, Switzerland) and historical context.
- A **chronology of key events** (1970–present), each cited to public sources.
- The **key figures** on both sides of the story.
- **Related organizations** (FSSP, splinter groups, districts — including Brazil).
- **References** to public sources, with disambiguation notes on contested points.

## How it works

This repo follows the architecture of its sibling project
[`cronologia/fsp`](https://github.com/cronologia/fsp): a tiny, **zero-dependency
static site generator**. A single JSON file is the source of truth; a Node script
compiles it into plain HTML/CSS that can be hosted anywhere.

```
fsspx/
├── data/
│   └── chronology.json       # SINGLE SOURCE OF TRUTH — facts, events, figures, references
├── src/
│   └── styles.css            # stylesheet (copied into the build)
├── scripts/
│   └── validate-data.js      # schema check (runs in CI before the build)
├── .github/workflows/
│   └── deploy.yml            # CI: validate, test, build, drift check, deploy
├── build.js                  # compiler: data/chronology.json -> docs/
├── docs/                     # COMPILED OUTPUT (served by GitHub Pages)
├── AGENTS.md                 # how AI agents/humans should work in this repo
├── context.md                # domain background
└── README.md
```

### Build

```bash
node build.js
```

This regenerates `docs/index.html` and copies static assets. No `npm install` needed.

### Preview

Open `docs/index.html` directly in a browser, or serve the folder:

```bash
python3 -m http.server -d docs 8000   # then visit http://localhost:8000
```

### Validate & test

```bash
node scripts/validate-data.js   # schema check for data/chronology.json
node --test                     # unit tests (build.js helpers, data invariants)
```

Both run in CI before the build. Tests use `node:test`/`node:assert` only — no dependencies.

### Publish (GitHub Pages)

CI handles this: [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
validates the data, runs the tests, rebuilds, and checks that committed `docs/`
is in sync on every push/PR. Deployment to GitHub Pages is **opt-in** so the
default branch stays green until you turn it on. To go live:

1. **Settings → Pages → Build and deployment → Source: GitHub Actions**
2. **Settings → Secrets and variables → Actions → Variables → `ENABLE_PAGES` = `true`**

(Alternatively, serve the committed `docs/` folder directly: Settings → Pages →
Source: `docs/` folder. `.nojekyll` disables Jekyll processing either way.)

## Editing the data

All content lives in [`data/chronology.json`](data/chronology.json). To add or
correct an event, figure, or reference, edit that file and re-run `node build.js`.
The data model:

- `facts[]` — `label`, `value`, `verified` (`false` shows a `?` flag), `sources[]`.
- `events[]` — `year`, `date`, `dateVerified`, `place`, `title`, `text`, `sources[]`.
  When `dateVerified` is `false`, the site shows a `?` flag next to the date.
- `figures[]` — `name`, `role`, `dates`, `country`, `notes`, `sources[]`.
- `organizations[]` — `name`, `founded`, `relation`, `url`, `notes`, `sources[]`.
- `episcopalLineage.trees[]` — episcopal-genealogy trees (`title`, `summary`,
  `separate`, recursive `root{name, detail, status, children[], sources[]}`),
  rendered as the "Episcopal genealogy" section: the Lefebvre line (1988/2026),
  the Williamson 'Resistance' line, and the separate Thục/Palmar de Troya line.
- `disambiguation.items[]` — `title`, `text`, `sources[]` (contested points, attributed).
- `references[]` — `id`, `title`, `url`, `publisher`, `type`. Facts cite via
  `sources: ["<id>", …]`; the build renders superscript `[n]` markers.

## Data quality

This is a **work in progress** compiled from public sources about a subject where
canonical status and interpretation are contested. Facts are cited; uncertain
dates are flagged; contested claims are attributed to their authors, never
asserted in the site's own voice. **Corrections against primary sources are
welcome** — open an issue or a PR.

Planned work (Wayback archiving of every reference, a document vault, deeper
dossiers) is tracked in GitHub issues, mirroring the pipeline the
[`fsp`](https://github.com/cronologia/fsp) project already runs.

## License

[MIT](LICENSE)
