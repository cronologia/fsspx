'use strict';
// Unit tests for build.js's pure helpers (zero-dependency; node --test).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  esc, formatArchiveTs, renderCites, renderVizChips, decadeOf,
  translator, siteBase, alternates, localizeData, langSwitcher, TRANSLATABLE_KEYS, UI, LOCALES,
  collectTranslatable,
} = require('../build.js');

test('esc escapes HTML metacharacters', () => {
  assert.equal(esc('<a href="x">&\'</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;');
  assert.equal(esc(null), '');
  assert.equal(esc(5), '5');
});

test('formatArchiveTs renders a Wayback timestamp as YYYY-MM-DD', () => {
  assert.equal(formatArchiveTs('20260714120000'), '2026-07-14');
  assert.equal(formatArchiveTs(''), '');
  assert.equal(formatArchiveTs(undefined), '');
});

test('renderCites links known ids, passes raw URLs through, drops unknowns', () => {
  const nums = new Map([['wiki', 1], ['official', 2]]);
  const html = renderCites(['wiki', 'official'], nums);
  assert.match(html, /#ref-1/);
  assert.match(html, /#ref-2/);
  assert.match(renderCites(['https://example.org/x'], nums), /\[web\]/);
  assert.equal(renderCites(['nope'], nums), '');
  assert.equal(renderCites([], nums), '');
  assert.equal(renderCites(undefined, nums), '');
});

test('renderVizChips renders header pill links, or nothing when undeclared', () => {
  const html = renderVizChips([{ href: '#chronology', label: '📜 Chronology' }]);
  assert.match(html, /class="viz-chips"/);
  assert.match(html, /<a href="#chronology">📜 Chronology<\/a>/);
  assert.equal(renderVizChips([]), '');
  assert.equal(renderVizChips(undefined), '');
  assert.match(renderVizChips([{ href: '#a"b', label: '<x>' }]), /#a&quot;b.*&lt;x&gt;/);
});

test('decadeOf groups years into decades', () => {
  assert.equal(decadeOf(1970), '1970s');
  assert.equal(decadeOf(1979), '1970s');
  assert.equal(decadeOf(2026), '2020s');
});

/* --- i18n helpers (adopted from the cronologia/core template) ------------ */

test('translator returns the translation when present, else the English source', () => {
  const t = translator({ Hello: 'Hola' });
  assert.equal(t('Hello'), 'Hola');
  assert.equal(t('Missing'), 'Missing');
  assert.equal(t(null), null);
});

test('siteBase normalizes to exactly one trailing slash', () => {
  assert.equal(siteBase({ siteUrl: 'https://x.io/fsspx' }), 'https://x.io/fsspx/');
  assert.equal(siteBase({ siteUrl: 'https://x.io/fsspx///' }), 'https://x.io/fsspx/');
  assert.match(siteBase({}), /\/$/);
});

test('alternates emits a self canonical + hreflang for every locale + x-default', () => {
  const html = alternates('https://x.io/fsspx/', 'a.html', 'pt');
  assert.match(html, /<link rel="canonical" href="https:\/\/x\.io\/fsspx\/pt\/a\.html">/);
  assert.match(html, /hreflang="en" href="https:\/\/x\.io\/fsspx\/en\/a\.html"/);
  assert.match(html, /hreflang="x-default" href="https:\/\/x\.io\/fsspx\/"/);
});

test('langSwitcher preserves the route and only swaps the locale segment', () => {
  const html = langSwitcher('', 'pt', UI.pt);
  assert.match(html, /class="lang-switch"/);
  assert.match(html, /<span class="lang-current" aria-current="true">PT<\/span>/);
  for (const l of LOCALES.filter((l) => l !== 'pt')) {
    assert.ok(html.includes(`href="../${l}/"`), `switcher missing ${l}`);
  }
});

test('localizeData translates whitelisted prose, sets lang, and never touches references', () => {
  const data = {
    meta: { title: 'T', description: 'Hello', language: 'en' },
    events: [{ year: 1970, title: 'Hello', place: 'Rome', date: '1970', dateVerified: true, sources: ['r'] }],
    figures: [{ name: 'Hello', role: 'Hello', sources: ['r'] }],
    episcopalLineage: { edgeLegend: { direct: 'Hello', indirect: 'Hello' }, trees: [] },
    references: [{ id: 'r', title: 'Hello', url: 'https://x', publisher: 'P', type: 'x' }],
  };
  const es = localizeData(data, { Hello: 'Hola' }, 'es');
  assert.equal(es.meta.language, 'es');
  assert.equal(es.meta.description, 'Hola');       // description: translated
  assert.equal(es.events[0].title, 'Hola');        // event title: translated
  assert.equal(es.figures[0].name, 'Hello');       // proper name: NOT translated
  assert.equal(es.references[0].title, 'Hello');   // reference title: NOT translated
  assert.equal(es.events[0].date, '1970');         // dates untouched
  assert.equal(es.episcopalLineage.edgeLegend.direct, 'Hola');   // typed-edge legend: translated
  assert.equal(es.episcopalLineage.edgeLegend.indirect, 'Hola');
  // English (empty dict) is the identity transform on content.
  const en = localizeData(data, {}, 'en');
  assert.equal(JSON.stringify(en.events), JSON.stringify(data.events));
});

// The test that used to sit here read translate.js's own TRANSLATABLE_KEYS
// literal and asserted it matched build.js's. It was a real guard, and it did
// hold — but it pinned the two KEY LISTS while leaving the two WALKS free to
// disagree, which is the half that actually went wrong elsewhere (the copy
// skipped `references` wholesale and mis-handled subtree enums). translate.js
// no longer has a literal to read: it imports collectTranslatable. The test
// below replaces it and is strictly stronger, comparing the strings the two
// code paths really visit rather than the keys they claim to. ADR-0008.

/**
 * Every string localizeData actually hands to the translator.
 *
 * The lookup is `Object.prototype.hasOwnProperty.call(dict, s)`, which on a
 * Proxy fires `getOwnPropertyDescriptor` -- not `has`, and not `get`. Trapping
 * the wrong one yields an empty list and the comparison would pass for the
 * wrong reason, so the trap is asserted to have fired. Empty strings are
 * dropped: localizeData passes them through harmlessly while
 * collectTranslatable filters them, because listing "" as awaiting translation
 * is noise in a coverage report.
 */
function stringsSeenByLocalize(data) {
  const seen = [];
  const dict = new Proxy({}, {
    getOwnPropertyDescriptor: (_t, k) => { if (typeof k === 'string') seen.push(k); return undefined; },
  });
  localizeData(data, dict, 'es');
  assert.ok(seen.length > 0, 'instrumentation failed: the translator lookup was never observed');
  return seen.filter((s) => s.trim());
}

test('collectTranslatable returns exactly the strings localizeData translates', () => {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'chronology.json'), 'utf8'));
  const collected = collectTranslatable(data);
  const localized = stringsSeenByLocalize(data);
  assert.deepEqual(new Set(collected), new Set(localized),
    'the coverage walk and the render walk disagree - one of them is lying about what gets translated');
  assert.equal(collected.length, new Set(collected).size, 'collectTranslatable must deduplicate');
  assert.ok(collected.length > 0, 'the dataset has translatable prose');
});
