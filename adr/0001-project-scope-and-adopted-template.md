# ADR-0001 — Project scope, the adopted core template, and the subject boundary

- **Status:** accepted (2026-07-24)
- **Context repo:** `cronologia/fsspx`
- **Builds on:** `cronologia/fsp` ADR-0001/0004/0008 (zero dependencies, Wayback
  archiving, document vault); `cronologia/core` ADR-0001..0004;
  `cronologia/archive` ADR-0001 (shared sources) and ADR-0002 (network access)

## Context

This repo documents a religiously and canonically contested subject and is the
largest dataset in the family (50 events, 18 figures, 7 organizations, 61
references). It started as a copy of `fsp`'s architecture; since then the shared
machinery moved to `cronologia/core`, and several renderers that were *invented
here* (the episcopal-genealogy tree) were generalized upstream and pulled back
down. Three things needed recording so the next agent does not re-litigate them:
what this repo builds on, what is authoritative in it, and where its subject
ends.

## Decision

**1. This project consumes the `cronologia/core` template; it does not fork it.**
The following have been adopted and are kept in step with core's `template/`
(per the `adopt-template` skill and core ADR-0001):

- `build.js` — the zero-dependency compiler, with the shared renderers:
  `renderLineageSection` (episcopal genealogy, typed `direct`/`indirect` edges
  and legend), `renderBranchTimeline` + `layoutBranchTimeline` (divisions
  timeline), `renderVizChips`, `renderGlossaryLinks` (`[[term-id]]` markers),
  and archived-fallback rendering of `data/archives.json`.
- `scripts/validate-data.js` — schema check, non-empty `sources[]` enforcement,
  reference-id resolution, and offline glossary-id validation.
- `scripts/archive-refs.js` + `data/archives.json` + `.github/workflows/wayback.yml`
  — the Wayback preservation pipeline.
- `scripts/check-links.js` + `.github/workflows/link-health.yml` — link health;
  403/429/5xx/timeout are INCONCLUSIVE, only real 4xx are dead.
- `scripts/sync-glossary-terms.js` + `data/glossary-terms.json` — a pinned,
  vendored copy of the glossary's term ids (core ADR-0002).
- `.claude/skills/` — pinned, vendored copies of core's skills, written by
  `core/tools/sync-skills.py` (core ADR-0002).
- `src/styles.css`, the `test/` suites, and `.github/workflows/deploy.yml`
  (validate → test → build → `docs/` drift check → opt-in Pages deploy).

Every one of these features is **data-driven and optional**: with the key absent
from `data/chronology.json`, output is byte-identical to a build without the
feature. Fixes flow *up* to core, not sideways into a local fork.

**2. `data/chronology.json` is the single source of truth; `docs/` is generated.**
`docs/`, `data/archives.json`, `data/glossary-terms.json` and `.claude/skills/`
are generated artifacts — committed, never hand-edited. Any change to data is
committed together with the regenerated `docs/`, after
`node scripts/validate-data.js && node --test && node build.js`. CI fails on
drift. The build is **network-free**: only the out-of-band scripts
(`archive-refs.js`, `check-links.js`, `sync-glossary-terms.js`) touch the
network (core ADR-0003).

**3. Standing subject boundary.** This repo owns **Catholic traditionalism**:
the SSPX, its splits (FSSP, SSPV, the Campos line, the "Resistance"), and the
canonical-status story, told with every contested characterization attributed to
its author. It does **not** own, and never duplicates:

- the Guénon–Schuon **Traditionalist School** — the order belongs to `tariqa`,
  the ideas to `perennialism`; the Coomaraswamy and Guérard des Lauriers threads
  are cross-linked from here, not restated here;
- **CEBs and liberation theology**, which belong to `tl`; `fsp` is this repo's
  architectural ancestor, not a content dependency;
- **terms** more than one project needs — those are defined once in
  `cronologia/glossary` and linked with `[[term-id]]`;
- **sources cited by 2+ projects**, which are vaulted centrally per archive
  ADR-0001. The archive is private: reader-facing citations are always the
  original URL plus its Wayback snapshot.

Shared entities must not contradict the sibling datasets; divergence is checked
with `core/tools/xref.py` and resolved as a sourcing decision, never
automatically.

## Consequences

- Adopting a new core renderer is a mechanical port plus its validator rules,
  tests and styles — not a rewrite; and it must not change existing output.
- A local improvement to a shared renderer is a bug report against core. Local
  divergence is the failure mode this ADR exists to prevent.
- Contributors cannot "fix" the site by editing `docs/`; the drift check in CI
  will reject it.
- The subject boundary means some material a reader might expect here lives in a
  sibling repo. The cost is an extra hop; the benefit is that no two repos claim
  the same fact and drift apart.
- The preservation and link-health workflows keep running on GitHub runners
  regardless of any individual agent session's network access, which is why
  neither is allowed to write to `data/chronology.json`.
