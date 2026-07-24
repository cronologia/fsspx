# Project context

Domain background for anyone (human or AI) working on this repository. Pair this
with [`AGENTS.md`](AGENTS.md) (how to work) and
[`adr/0001-project-scope-and-adopted-template.md`](adr/0001-project-scope-and-adopted-template.md)
(what was decided). Shared architecture rationale lives in
[`cronologia/core/adr/`](https://github.com/cronologia/core/tree/main/adr) and,
historically, in the sibling project's ADRs (`cronologia/fsp` → `docs/adrs/`).

## The subject: Fraternidade Sacerdotal São Pio X (FSSPX / SSPX)

The **Society of Saint Pius X** (Latin: *Fraternitas Sacerdotalis Sancti Pii X*;
Portuguese: *Fraternidade Sacerdotal São Pio X*) is an international priestly
society of the traditionalist Catholic movement.

- **Founded:** 1 November 1970, in Fribourg, Switzerland, by the French
  Archbishop **Marcel Lefebvre** (1905–1991), former Superior General of the
  Holy Ghost Fathers and Archbishop of Dakar.
- **Approved at founding** by Bishop François Charrière of Lausanne, Geneva and
  Fribourg as a *pia unio* (pious union) — i.e. the Society began with
  diocesan approval, a point central to its self-understanding.
- **Mission (as stated by the Society):** the formation of priests and the
  preservation of the traditional Latin Mass (the 1962 Roman Missal) and of
  pre-conciliar doctrine and practice, in opposition to what it regards as
  errors following the Second Vatican Council (notably on religious liberty,
  ecumenism, and the reformed liturgy).
- **Seminary:** the International Seminary of Saint Pius X in **Écône**,
  Switzerland (opened 1970–71), is the Society's symbolic heart; other
  seminaries followed (including **La Reja, Argentina**, serving Latin America).
- **The rupture:** approval was withdrawn in 1975; Lefebvre was suspended
  *a divinis* in 1976 after ordaining priests without authorization; in **1988**
  he consecrated four bishops at Écône without papal mandate, which the Holy
  See declared a schismatic act carrying automatic excommunication
  (*Ecclesia Dei*). The Society disputes that characterization.
- **Partial reconciliation:** Benedict XVI liberalized the traditional Mass
  (*Summorum Pontificum*, 2007) and lifted the four bishops' excommunications
  (2009); doctrinal talks (2009–2012) did not produce a canonical settlement.
  Pope Francis granted the Society's priests faculties to absolve sins (2015,
  made indefinite 2016) and provisions for witnessing marriages (2017), while
  restricting the wider use of the old rite for regular diocesan communities
  (*Traditionis Custodes*, 2021) — a restriction that does not bind the SSPX.
- **The 2026 rupture:** on **1 July 2026** the Society consecrated four new
  bishops at Écône without papal mandate, despite warnings from the Dicastery
  for the Doctrine of the Faith and appeals from Pope Leo XIV; on **2 July
  2026** a DDF decree declared the six bishops involved excommunicated *latae
  sententiae*, described the Society's clergy as being in schism, and revoked
  the 2015–2017 confession and marriage provisions. The SSPX rejects the
  decree as "objectively unjust and invalid". Both positions are attributed.
- **Status today:** until July 2026, canonically **irregular but repeatedly
  described by Vatican officials as not formally schismatic**; since the
  2 July 2026 decree, the Holy See describes the Society's clergy as in
  schism, which the Society disputes. The Society reports presence in ~77
  countries, with a significant Brazilian presence (Casa Autônoma do Brasil
  since 2017; Portuguese-language site `fsspx.com.br`).

## Project goal

Produce an **open, source-referenced chronology** as a static website:

- Every key event 1970–present (founding, Écône, 1974 Declaration, 1975–76
  sanctions, 1988 consecrations, 2000s rapprochement, 2021– developments,
  the 2026 consecrations and decree), cited to public sources.
- The key figures on **both sides** — the Society's superiors general and
  bishops, and the popes and Vatican officials who dealt with it.
- Related organizations kept distinct (see disambiguation below).
- Both the Society's **own account** and **external/critical** accounts, so the
  same event is describable from more than one side.

The project values **verifiability and neutrality** over completeness. It must
describe rather than advocate, and flag what is uncertain. Canonical
characterizations are **attributed** ("the Holy See stated…", "the SSPX
holds…"), never asserted in the site's own voice.

**Audience:** Portuguese- and English-reading general readers, journalists and
researchers looking for a dated, cited sequence of events — including the
Society's Brazilian public, which is why the District of Brazil and the Campos
story get first-class treatment. The site is a reference work, not an apologia
and not an exposé.

## State of the dataset (July 2026)

`data/chronology.json` is the single source of truth and currently holds:

- **7 facts** (identity card: what it is, founding, founder, headquarters,
  self-reported scale, Brazil, canonical status),
- **50 events**, spanning **1970–2026**,
- **18 figures** (Lefebvre, the four 1988 and four 2026 consecrated bishops,
  the superiors general, the Campos line — Castro Mayer, Rangel, Rifan — plus
  the popes and Vatican officials on the other side of the story),
- **7 organizations** (FSSP, the Institute of the Good Shepherd, SSPV, CMRI,
  the "Resistance", the Campos union/Apostolic Administration, Casa Autônoma
  do Brasil),
- a **disambiguation** section for the contested points below,
- **61 references**, cross-spectrum by design.

It is a **work in progress**: uncertain dates carry `dateVerified: false` and
render with a `?` flag; the standing verification worklist is
`python3 ../core/tools/unverified-report.py fsspx --markdown`.

### Visualizations

Two data-driven sections sit above the chronology, reachable from the chips in
the header:

- **Divisions timeline** (`branchTimeline`) — a metro-map style diagram of the
  SSPX trunk and five branches: SSPV (1983), FSSP (1988), the Campos union
  (1988–2002, ending in the Apostolic Administration), the "Resistance" (2012)
  and the 2026 rupture.
- **Episcopal genealogy** (`episcopalLineage`) — four trees: the SSPX line from
  Lefebvre (1988 and 2026), the Campos line from Castro Mayer, the Williamson
  "Resistance" line, and — rendered **visually separate**, with typed
  `indirect` edges and a legend, so it is never read as connected — the
  Thục / Palmar de Troya line.

Both are **optional top-level keys**: remove the key and the page renders
byte-identically to a build without the feature.

### Glossary cross-links

Prose links into the shared [`cronologia/glossary`](https://github.com/cronologia/glossary)
with `[[term-id]]` markers instead of re-explaining terms. Currently linked:
`canonical-irregularity`, `cdf-ddf`, `excommunication`, `latae-sententiae`,
`motu-proprio`, `pia-unio`, `schism`, `sedeprivationism`, `sedevacantism`,
`suspension-a-divinis`. Validation is offline against the pinned
`data/glossary-terms.json`.

### Preservation pipeline

Fully ported from `fsp` and running:

- `scripts/archive-refs.js` → `data/archives.json` (**32 of 61** references
  currently carry a Wayback snapshot), rendered by the build as "archived"
  fallback links; `wayback.yml` re-runs it weekly.
- `scripts/check-links.js` + `link-health.yml` report dead / SUSPECT /
  inconclusive URLs weekly into a single tracking issue. 403/429/5xx and
  timeouts are **inconclusive, never dead**. Neither script edits the dataset.

Remaining planned work (deeper dossiers, a document vault for sources Wayback
cannot capture) is tracked in GitHub issues.

## Important disambiguations

- **SSPX ≠ sedevacantism.** The SSPX recognizes the reigning pope and prays
  for him; sedevacantists hold the papal see is vacant. Groups such as the
  **SSPV** (Society of Saint Pius V, split 1983) and **CMRI** are sedevacantist
  and are *not* the SSPX.
- **SSPX ≠ FSSP.** The **Priestly Fraternity of Saint Peter (FSSP)** was founded
  in 1988 *by priests who left the SSPX* after the Écône consecrations, in full
  communion with Rome. The **Institute of the Good Shepherd** (2006) is a
  similar later case.
- **SSPX ≠ the "Resistance".** Bishop Richard Williamson was expelled from the
  SSPX in 2012 and founded a looser network (SSPX-Resistance / *fidelity*
  groups) that rejects any accord with Rome.
- **"Excommunicated" needs a date qualifier.** The 1988 excommunications
  applied to the six bishops involved (not to every SSPX priest or faithful)
  and were lifted in 2009; a new set of excommunications was declared on
  2 July 2026 for the six bishops involved in the 2026 consecrations, with
  press summaries differing on how the decree treats priests and laity.
  Statements about status must be dated and attributed.
- **Catholic traditionalism ≠ the Traditionalist School.** The Guénon–Schuon
  perennialists (sibling repos `tariqa` and `perennialism`) and Evola's
  political Traditionalism are different movements that share a word. Where a
  figure or thread genuinely touches both worlds — the Coomaraswamy and
  Guérard des Lauriers threads — this repo **cross-links** rather than
  duplicating the other repo's material.

## Glossary

- **Écône** — Swiss village, site of the Society's mother seminary; "the Écône
  consecrations" = the 30 June 1988 episcopal consecrations.
- **Suspension *a divinis*** — canonical penalty (1976, on Lefebvre) forbidding
  the exercise of orders.
- ***Ecclesia Dei*** — John Paul II's 1988 motu proprio responding to the
  consecrations; also the name of the pontifical commission (1988–2019) for
  dialogue with traditionalist groups.
- ***Summorum Pontificum* / *Traditionis Custodes*** — Benedict XVI's 2007
  liberalization and Francis's 2021 restriction of the pre-1970 Roman Rite.
- **District** — the Society's national/regional administrative unit (the
  **District of Brazil** covers this site's primary audience).
- **Superior General** — head of the Society: Lefebvre (1970–1982), Franz
  Schmidberger (1982–1994), Bernard Fellay (1994–2018), Davide Pagliarani
  (elected 2018 for a 12-year term).
- **Sedeprivationism (the "Thục thesis")** — the *materialiter/formaliter*
  position associated with Guérard des Lauriers; distinct from both
  sedevacantism proper and the SSPX's own position, and the reason the Thục
  line is rendered as a separate tree.

## Primary / key sources

- **The Society's own:** `sspx.org` (general house / US district),
  `fsspx.news` (news service), `fsspx.com.br` (District of Brazil, PT),
  `laportelatine.org` (District of France).
- **The Holy See:** `vatican.va` — *Ecclesia Dei* (1988), the 2009 decree
  lifting the excommunications and Benedict XVI's letter of 10 March 2009,
  *Summorum Pontificum* (2007), *Misericordia et Misera* §12 (2016),
  *Traditionis Custodes* (2021), the 2 July 2026 DDF decree.
- **Cross-spectrum:** Wikipedia (EN/PT), mainstream and religious press
  (National Catholic Register/Reporter, Catholic News Agency, The Pillar,
  La Croix), academic work on Catholic traditionalism, and critical coverage
  (e.g. of the Williamson affair).

Several of these hosts filter by User-Agent (`sspx.org`, `fsspx.news`,
`vatican.va` all return header artifacts or 406s to a default client) — the
`net-access` skill and archive ADR-0002 hold the standing ladder for that.

All cited sources live in `data/chronology.json` → `references[]`, with their
Wayback snapshots in `data/archives.json`.
