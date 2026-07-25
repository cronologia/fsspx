'use strict';
// Per-figure dossier pages (ADR-0003, ticket #50): the criterion, the permanent
// id scheme, the (page × locale) emission, and the drift check for the committed
// pages. Zero-dependency (node:test / node:assert).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  figurePages, figurePageMetrics, figurePageFailures, figurePageFlags, figureRoute,
  figureEvents, lineageOccurrences, allRoutes, renderFigurePage, renderPage, renderSitemap,
  routeDepth, upTo, stripGlossaryMarkers, metaSummary, FIGURE_ID_RE,
  FIGURE_PAGE_MIN_EVENTS, FIGURE_PAGE_MIN_SOURCES,
  siteBase, localizeData, loadDict, LOCALES, ROUTES, UI,
} = require('../build.js');

const ROOT = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'chronology.json'), 'utf8'));

function archives() {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'archives.json'), 'utf8')).snapshots || {};
  } catch { return {}; }
}

/* --- the criterion --------------------------------------------------------- */

test('every figure carrying an id clears the 3 × 3 criterion', () => {
  const withId = data.figures.filter((f) => f.id);
  assert.ok(withId.length > 0, 'no figure carries an id');
  for (const f of withId) {
    const m = figurePageMetrics(data, f);
    assert.ok(m.events >= FIGURE_PAGE_MIN_EVENTS,
      `${f.name}: ${m.events} linked events < ${FIGURE_PAGE_MIN_EVENTS}`);
    assert.ok(m.sources >= FIGURE_PAGE_MIN_SOURCES,
      `${f.name}: ${m.sources} distinct sources < ${FIGURE_PAGE_MIN_SOURCES}`);
    assert.deepEqual(figurePageFailures(data, f), [], `${f.name} should qualify`);
  }
});

test('the criterion actually rejects a thin figure', () => {
  const thin = {
    id: 'thin-figure', name: 'Thin Figure', role: 'r', sources: ['wikipedia-en'],
  };
  const fake = { figures: [thin], events: data.events, references: data.references };
  const why = figurePageFailures(fake, thin);
  assert.equal(why.length, 2, 'a figure with no linked events fails both thresholds');
  assert.match(why[0], /linked event/);
  assert.match(why[1], /distinct source/);
});

test('an id below the event threshold is rejected even with many sources', () => {
  const fig = { id: 'two-events', name: 'Two Events', role: 'r', sources: ['a', 'b', 'c', 'd'] };
  const fake = {
    figures: [fig], references: data.references,
    events: [
      { year: 1990, dateVerified: true, title: 'x', figures: ['two-events'], sources: ['a'] },
      { year: 1991, dateVerified: true, title: 'y', figures: ['two-events'], sources: ['b'] },
    ],
  };
  const why = figurePageFailures(fake, fig);
  assert.equal(why.length, 1);
  assert.match(why[0], /only 2 linked event/);
});

test('ids match the permanent-URL slug grammar and are unique', () => {
  const seen = new Set();
  for (const f of data.figures.filter((x) => x.id)) {
    assert.match(f.id, FIGURE_ID_RE, `${f.id} is not a valid slug`);
    assert.ok(!seen.has(f.id), `duplicate figure id ${f.id}`);
    seen.add(f.id);
  }
});

test('every figure id referenced by an event or a lineage node resolves', () => {
  const ids = new Set(data.figures.filter((f) => f.id).map((f) => f.id));
  data.events.forEach((ev, i) => {
    for (const fid of ev.figures || []) assert.ok(ids.has(fid), `events[${i}]: unknown figure id ${fid}`);
  });
  const walk = (node, at) => {
    if (!node) return;
    if (node.figure !== undefined) assert.ok(ids.has(node.figure), `${at}: unknown figure id ${node.figure}`);
    (node.children || []).forEach((c, j) => walk(c, `${at}.children[${j}]`));
  };
  data.episcopalLineage.trees.forEach((t, i) => walk(t.root, `trees[${i}].root`));
});

/* --- routes and the sitemap ------------------------------------------------ */

test('allRoutes appends one route per figure page and the sitemap lists them all', () => {
  const pages = figurePages(data);
  const routes = allRoutes(data);
  assert.equal(routes.length, ROUTES.length + pages.length);
  for (const p of pages) assert.ok(routes.includes(`figures/${p.id}.html`), `route missing for ${p.id}`);

  const base = siteBase(data.meta);
  const sitemap = renderSitemap(base, routes);
  for (const route of routes) for (const lang of LOCALES) {
    assert.ok(sitemap.includes(`<loc>${base}${lang}/${route}</loc>`), `sitemap missing ${lang}/${route}`);
  }
  // A page that is not in the sitemap is unindexable, which defeats the purpose.
  assert.equal((sitemap.match(/<loc>/g) || []).length, routes.length * LOCALES.length);
});

test('with no figure ids the feature disappears entirely (optional-renderer contract)', () => {
  const stripped = JSON.parse(JSON.stringify(data));
  for (const f of stripped.figures) delete f.id;
  assert.deepEqual(figurePages(stripped), []);
  assert.deepEqual(allRoutes(stripped), ROUTES);
});

test('route depth drives relative paths; depth 0 is unchanged', () => {
  assert.equal(routeDepth(''), 0);
  assert.equal(routeDepth('figures/x.html'), 1);
  assert.equal(upTo(''), '../');            // what the single-page build emitted
  assert.equal(upTo('figures/x.html'), '../../');
});

/* --- rendering ------------------------------------------------------------- */

test('every figure page renders in every locale with lang, SEO, hreflang and the disclaimer', () => {
  const base = siteBase(data.meta);
  for (const lang of LOCALES) {
    const localized = localizeData(data, loadDict(lang), lang);
    const pages = figurePages(localized);
    assert.ok(pages.length > 0, `${lang}: no figure pages`);
    for (const page of pages) {
      const route = figureRoute(page.id);
      const html = renderFigurePage(page, localized, archives(), { lang, base });
      assert.match(html, /<!DOCTYPE html>/);
      assert.match(html, new RegExp(`<html lang="${lang}"`), `${lang}/${page.id}: wrong <html lang>`);
      assert.ok(html.includes(`<link rel="canonical" href="${base}${lang}/${route}">`),
        `${lang}/${page.id}: canonical missing or wrong`);
      for (const l of LOCALES) {
        assert.ok(html.includes(`hreflang="${l}" href="${base}${l}/${route}"`),
          `${lang}/${page.id}: hreflang ${l} missing`);
      }
      assert.ok(html.includes('hreflang="x-default"'), `${lang}/${page.id}: x-default missing`);
      assert.ok(html.includes('application/ld+json'), `${lang}/${page.id}: JSON-LD missing`);
      assert.ok(html.includes('href="../../styles.css"'), `${lang}/${page.id}: stylesheet path not depth-aware`);
      assert.match(html, /G-R9LV1QZHVE/, `${lang}/${page.id}: analytics tag missing`);
      assert.ok(html.includes(`<title>${page.figure.name} — ${localized.meta.title}</title>`),
        `${lang}/${page.id}: per-locale title missing`);
      // the language switcher must climb out of figures/ to reach the sibling locale
      for (const l of LOCALES.filter((x) => x !== lang)) {
        assert.ok(html.includes(`href="../../${l}/${route}"`), `${lang}/${page.id}: switcher link to ${l} wrong`);
      }
      if (lang === 'en') assert.ok(!html.includes('i18n-disclaimer'), 'English figure page must not carry the disclaimer');
      else assert.match(html, /class="i18n-disclaimer"/, `${lang}/${page.id}: machine-translation disclaimer missing`);
      // every section the page promises
      for (const id of ['verification', 'dossier', 'events', 'references']) {
        assert.ok(html.includes(`id="${id}"`), `${lang}/${page.id}: section ${id} missing`);
      }
    }
  }
});

test('glossary [[term-id]] markers resolve on figure pages', () => {
  const base = siteBase(data.meta);
  const pages = figurePages(data);
  const lefebvre = pages.find((p) => p.id === 'marcel-lefebvre');
  assert.ok(lefebvre, 'marcel-lefebvre page missing');
  const html = renderFigurePage(lefebvre, data, archives(), { lang: 'en', base });
  assert.ok(html.includes('https://cronologia.github.io/glossary/suspension-a-divinis/'),
    'glossary link not expanded on the figure page');
  assert.ok(!html.includes('[['), 'a raw glossary marker leaked into the figure page');
});

test('open verification flags render visibly, and the empty case keeps its hedge', () => {
  const base = siteBase(data.meta);
  const ui = UI.en;

  // Lefebvre: single-source record + one unverified event date.
  const lefebvre = figurePages(data).find((p) => p.id === 'marcel-lefebvre');
  const lf = figurePageFlags(lefebvre, ui);
  assert.ok(lf.some((f) => f.kind === 'single-source'), 'single-source notice missing');
  assert.ok(lf.some((f) => f.kind === 'event-date'), 'unverified event date not flagged');
  const html = renderFigurePage(lefebvre, data, archives(), { lang: 'en', base });
  assert.match(html, /class="figure-flag figure-flag-single-source"/);
  assert.ok(html.includes(ui.figureFlagSingleSource), 'single-source text not rendered');
  assert.ok(html.includes('Lefebvre meets John Paul II'), 'the flagged event is not named');

  // Castro Mayer: an explicit datesVerified:false on the record.
  const cm = figurePages(data).find((p) => p.id === 'antonio-de-castro-mayer');
  assert.ok(figurePageFlags(cm, ui).some((f) => f.kind === 'dates'), 'datesVerified flag missing');
  const cmHtml = renderFigurePage(cm, data, archives(), { lang: 'en', base });
  assert.match(cmHtml, /class="figure-flag figure-flag-dates"/);

  // A page with nothing flagged still renders the panel, hedged.
  const clean = figurePages(data).find((p) => figurePageFlags(p, ui).length === 0);
  if (clean) {
    const cleanHtml = renderFigurePage(clean, data, archives(), { lang: 'en', base });
    assert.ok(cleanHtml.includes(ui.figureFlagsNone), 'empty-flag hedge missing');
    assert.match(ui.figureFlagsNone, /not that every date has been independently confirmed/);
  }
});

test('every unverified linked event surfaces on its figures’ pages', () => {
  const ui = UI.en;
  const pages = figurePages(data);
  for (const ev of data.events) {
    if (ev.dateVerified !== false || !Array.isArray(ev.figures)) continue;
    for (const fid of ev.figures) {
      const page = pages.find((p) => p.id === fid);
      if (!page) continue;
      assert.ok(figurePageFlags(page, ui).some((f) => f.event === ev),
        `${fid}: unverified event "${ev.title}" is not flagged on the page`);
    }
  }
});

test('page-local reference numbering starts at 1 and covers only cited sources', () => {
  const base = siteBase(data.meta);
  const page = figurePages(data).find((p) => p.id === 'davide-pagliarani');
  const html = renderFigurePage(page, data, archives(), { lang: 'en', base });
  assert.ok(html.includes('<li id="ref-1">'), 'page-local numbering does not start at 1');
  const refIds = (html.match(/<li id="ref-(\d+)">/g) || []).length;
  assert.ok(refIds > 0 && refIds < data.references.length,
    'the figure page should cite a subset of the bibliography, renumbered for itself');
});

test('the genealogy position renders consecrator, consecrated and the dated status', () => {
  const base = siteBase(data.meta);
  const williamson = figurePages(data).find((p) => p.id === 'richard-williamson');
  assert.ok(williamson.lineage.length >= 2, 'Williamson appears in the SSPX and Resistance branches');
  const html = renderFigurePage(williamson, data, archives(), { lang: 'en', base });
  assert.ok(html.includes(UI.en.figureLineageConsecrator));
  assert.ok(html.includes(UI.en.figureLineageConsecrated));
  assert.ok(html.includes(UI.en.figureLineageStatus));
  // status characterizations stay attributed, never asserted in the site's voice
  assert.ok(html.includes(UI.en.figureLineageAttrNote));
});

test('figure cards on the index link to the pages that exist, and only those', () => {
  const base = siteBase(data.meta);
  const html = renderPage(localizeData(data, loadDict('en'), 'en'), archives(), { lang: 'en', base, route: '' });
  for (const f of data.figures) {
    const link = `<a href="figures/${f.id}.html">`;
    if (f.id) assert.ok(html.includes(link), `index card for ${f.name} does not link to its page`);
  }
  const links = (html.match(/href="figures\/[^"]+"/g) || []).length;
  assert.equal(links, data.figures.filter((f) => f.id).length, 'unexpected figure-page links on the index');
});

/* --- helpers --------------------------------------------------------------- */

test('glossary markers are stripped, not rendered, in meta text', () => {
  assert.equal(stripGlossaryMarkers('a [[schism|schismatic]] act'), 'a schismatic act');
  assert.equal(stripGlossaryMarkers('a [[schism]] act'), 'a schism act');
  assert.equal(stripGlossaryMarkers('no marker'), 'no marker');
  const s = metaSummary('x '.repeat(400));
  assert.ok(s.length <= 241, 'meta description not truncated');
  assert.ok(s.endsWith('…'));
});

test('figureEvents is chronological and lineageOccurrences finds every branch', () => {
  const evs = figureEvents(data, 'richard-williamson');
  const years = evs.map((e) => e.year);
  assert.deepEqual(years, [...years].sort((a, b) => a - b), 'events are not chronological');
  const occ = lineageOccurrences(data.episcopalLineage, 'marcel-lefebvre');
  assert.equal(occ.length, 1);
  assert.equal(occ[0].parent, null, 'Lefebvre is the root of the SSPX line');
});

/* --- drift ----------------------------------------------------------------- */

test('committed docs/ figure pages are the current render in every locale', () => {
  const base = siteBase(data.meta);
  for (const lang of LOCALES) {
    const localized = localizeData(data, loadDict(lang), lang);
    for (const page of figurePages(localized)) {
      const f = path.join(ROOT, 'docs', lang, figureRoute(page.id));
      assert.ok(fs.existsSync(f), `docs/${lang}/${figureRoute(page.id)} missing — run node build.js`);
      assert.equal(
        fs.readFileSync(f, 'utf8'),
        renderFigurePage(page, localized, archives(), { lang, base }),
        `docs/${lang}/${figureRoute(page.id)} out of date — run node build.js`
      );
    }
  }
});

test('all three locale trees contain the same set of figure pages', () => {
  const expected = figurePages(data).map((p) => `${p.id}.html`).sort();
  for (const lang of LOCALES) {
    const dir = path.join(ROOT, 'docs', lang, 'figures');
    assert.deepEqual(fs.readdirSync(dir).sort(), expected, `docs/${lang}/figures/ does not match`);
  }
});
