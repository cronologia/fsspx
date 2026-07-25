'use strict';
// Invariants over the real committed data + a smoke test of the full render.
// Zero-dependency (node:test / node:assert).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  renderPage, renderRootStub, renderSitemap, renderRobots,
  siteBase, localizeData, loadDict, LOCALES, allRoutes,
} = require('../build.js');

const ROOT = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'chronology.json'), 'utf8'));

test('every sources[] entry resolves to a reference id or a URL', () => {
  const ids = new Set(data.references.map((r) => r.id));
  const check = (sources, at) => {
    for (const s of sources || []) {
      assert.ok(ids.has(s) || /^https?:\/\//.test(s), `${at}: unknown source "${s}"`);
    }
  };
  data.facts.forEach((f, i) => check(f.sources, `facts[${i}]`));
  data.events.forEach((e, i) => check(e.sources, `events[${i}]`));
  data.figures.forEach((f, i) => check(f.sources, `figures[${i}]`));
  (data.organizations || []).forEach((o, i) => check(o.sources, `organizations[${i}]`));
});

test('reference ids are unique', () => {
  const seen = new Set();
  for (const r of data.references) {
    assert.ok(!seen.has(r.id), `duplicate reference id ${r.id}`);
    seen.add(r.id);
  }
});

test('events are dated plausibly and titled', () => {
  for (const e of data.events) {
    assert.ok(Number.isFinite(e.year) && e.year > 1500 && e.year < 2100, `bad year ${e.year}`);
    assert.ok(e.title && e.title.length > 3, `event ${e.year} missing title`);
    assert.equal(typeof e.dateVerified, 'boolean', `event "${e.title}" missing dateVerified`);
  }
});

function archives() {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'archives.json'), 'utf8')).snapshots || {};
  } catch { return {}; /* no archive cache yet */ }
}

test('every locale renders a full page with the right lang, SEO and disclaimer', () => {
  const base = siteBase(data.meta);
  for (const lang of LOCALES) {
    const html = renderPage(localizeData(data, loadDict(lang), lang), archives(), { lang, base, route: '' });
    assert.match(html, /<!DOCTYPE html>/);
    assert.match(html, /G-R9LV1QZHVE/, `${lang}: Google Analytics tag missing`);
    assert.match(html, new RegExp(`<html lang="${lang}"`), `${lang}: wrong <html lang>`);
    assert.match(html, new RegExp('id="chronology"'));
    assert.match(html, new RegExp('id="lineage"'), `${lang}: genealogy section missing`);
    assert.match(html, new RegExp('id="branch-timeline"'), `${lang}: branch timeline missing`);
    assert.match(html, new RegExp('id="references"'));
    assert.ok(html.includes(`<link rel="canonical" href="${base}${lang}/">`), `${lang}: canonical missing`);
    for (const l of LOCALES) assert.ok(html.includes(`hreflang="${l}"`), `${lang}: hreflang ${l} missing`);
    assert.ok(html.includes('hreflang="x-default"'), `${lang}: x-default missing`);
    assert.ok(html.includes('application/ld+json'), `${lang}: JSON-LD missing`);
    assert.ok(html.includes('href="../styles.css"'), `${lang}: stylesheet path not locale-relative`);
    assert.match(html, /class="lang-switch"/, `${lang}: language switcher missing`);
    if (lang === 'en') assert.ok(!html.includes('i18n-disclaimer'), 'English page must not carry the disclaimer');
    else assert.match(html, /class="i18n-disclaimer"/, `${lang}: machine-translation disclaimer missing`);
    for (const r of data.references) {
      assert.ok(html.includes(r.url.replace(/&/g, '&amp;')), `${lang}: reference ${r.id} not rendered`);
    }
  }
});

test('English render is the identity localization (content unchanged)', () => {
  const en = localizeData(data, loadDict('en'), 'en');
  assert.equal(JSON.stringify(en.events), JSON.stringify(data.events));
  assert.equal(JSON.stringify(en.figures), JSON.stringify(data.figures));
  assert.equal(JSON.stringify(en.references), JSON.stringify(data.references));
  assert.equal(JSON.stringify(en.episcopalLineage), JSON.stringify(data.episcopalLineage));
  assert.equal(JSON.stringify(en.branchTimeline), JSON.stringify(data.branchTimeline));
});

test('pt and es caches cover every translatable string and keep glossary markers', () => {
  const MARKER = /\[\[([a-z0-9][a-z0-9-]*)(?:\|([^\]|]*))?\]\]/g;
  for (const lang of LOCALES.filter((l) => l !== 'en')) {
    const dict = loadDict(lang);
    assert.ok(Object.keys(dict).length > 0, `${lang}: translation cache is empty`);
    for (const [src, translated] of Object.entries(dict)) {
      const a = [...src.matchAll(MARKER)].map((m) => m[1]).sort();
      const b = [...translated.matchAll(MARKER)].map((m) => m[1]).sort();
      assert.deepEqual(b, a, `${lang}: glossary marker ids changed in "${src.slice(0, 60)}…"`);
    }
    // Every string the localizer will look up must be in the cache (no fallback).
    const html = renderPage(localizeData(data, dict, lang), archives(), { lang, base: siteBase(data.meta), route: '' });
    assert.ok(html.includes(dict['Episcopal genealogy']), `${lang}: translated genealogy heading not rendered`);
  }
});

test('sitemap lists every route × locale with alternates; robots points to it', () => {
  const base = siteBase(data.meta);
  const routes = allRoutes(data);
  const sitemap = renderSitemap(base, routes);
  assert.match(sitemap, /<\?xml/);
  assert.match(sitemap, /xmlns:xhtml=/);
  for (const route of routes) for (const lang of LOCALES) {
    assert.ok(sitemap.includes(`<loc>${base}${lang}/${route}</loc>`), `sitemap missing ${lang}/${route}`);
  }
  assert.ok(renderRobots(base).includes(`Sitemap: ${base}sitemap.xml`));
});

test('root stub redirects and declares alternates (no page content)', () => {
  const stub = renderRootStub(siteBase(data.meta));
  assert.match(stub, /location\.replace/);
  assert.match(stub, /hreflang="x-default"/);
  assert.ok(!stub.includes('id="chronology"'), 'root stub should not contain page content');
});

test('committed docs/ is the current render for every locale (no drift)', () => {
  const docs = path.join(ROOT, 'docs');
  const base = siteBase(data.meta);
  assert.equal(fs.readFileSync(path.join(docs, 'index.html'), 'utf8'), renderRootStub(base), 'root stub drift — run node build.js');
  assert.equal(fs.readFileSync(path.join(docs, 'sitemap.xml'), 'utf8'), renderSitemap(base, allRoutes(data)), 'sitemap drift — run node build.js');
  assert.equal(fs.readFileSync(path.join(docs, 'robots.txt'), 'utf8'), renderRobots(base), 'robots drift — run node build.js');
  for (const lang of LOCALES) {
    const f = path.join(docs, lang, 'index.html');
    assert.equal(
      fs.readFileSync(f, 'utf8'),
      renderPage(localizeData(data, loadDict(lang), lang), archives(), { lang, base, route: '' }),
      `docs/${lang}/ out of date — run node build.js`
    );
  }
});
