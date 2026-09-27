/* alfabet.js – hela svenska alfabetet A–Ö överst på sidan.
 * Klick = bokstavens namn läses upp + panel med två uttalsexempel:
 * vokaler: följd av EN konsonant (lång vokal) resp. TVÅ konsonanter (kort vokal),
 * konsonanter: enkel resp. dubbel konsonant. */
(function () {
  'use strict';
  const { h, tom, hogtalare } = window.DOM;
  const I18n = window.I18n;
  const t = I18n.t;
  const FLAGGA = { en: '🇬🇧', pl: '🇵🇱' };

  // namn = hur bokstaven uttalas när man säger den (skickas till talsyntesen).
  // Vokalerna: A E I O U Y Å Ä Ö.
  const ALFABET = [
    { b: 'A', namn: 'a', vokal: true, ex: [
      { sv: 'tak', en: 'roof', pl: 'dach' }, { sv: 'tack', en: 'thanks', pl: 'dziękuję' }] },
    { b: 'B', namn: 'be', ex: [
      { sv: 'bok', en: 'book', pl: 'książka' }, { sv: 'klubb', en: 'club', pl: 'klub' }] },
    { b: 'C', namn: 'se', not: 'C låter oftast som s. Dubbel-k skrivs ck.', ex: [
      { sv: 'cykel', en: 'bicycle', pl: 'rower' }, { sv: 'socker', en: 'sugar', pl: 'cukier' }] },
    { b: 'D', namn: 'de', ex: [
      { sv: 'bred', en: 'wide', pl: 'szeroki' }, { sv: 'bredd', en: 'width', pl: 'szerokość' }] },
    { b: 'E', namn: 'e', vokal: true, ex: [
      { sv: 'ben', en: 'leg; bone', pl: 'noga; kość' }, { sv: 'penna', en: 'pen', pl: 'długopis' }] },
    { b: 'F', namn: 'eff', ex: [
      { sv: 'fem', en: 'five', pl: 'pięć' }, { sv: 'kaffe', en: 'coffee', pl: 'kawa' }] },
    { b: 'G', namn: 'ge', ex: [
      { sv: 'dag', en: 'day', pl: 'dzień' }, { sv: 'bygga', en: 'to build', pl: 'budować' }] },
    { b: 'H', namn: 'hå', not: 'H dubbleras aldrig – här två vanliga ord med h.', ex: [
      { sv: 'hus', en: 'house', pl: 'dom' }, { sv: 'hand', en: 'hand', pl: 'ręka' }] },
    { b: 'I', namn: 'i', vokal: true, ex: [
      { sv: 'vit', en: 'white', pl: 'biały' }, { sv: 'vitt', en: 'white (ett-word)', pl: 'białe' }] },
    { b: 'J', namn: 'ji', not: 'J dubbleras aldrig – här två vanliga ord med j.', ex: [
      { sv: 'ja', en: 'yes', pl: 'tak' }, { sv: 'hej', en: 'hi', pl: 'cześć' }] },
    { b: 'K', namn: 'kå', not: 'Dubbel-k skrivs ck.', ex: [
      { sv: 'lök', en: 'onion', pl: 'cebula' }, { sv: 'lock', en: 'lid', pl: 'pokrywka' }] },
    { b: 'L', namn: 'ell', ex: [
      { sv: 'hal', en: 'slippery', pl: 'śliski' }, { sv: 'hall', en: 'hall', pl: 'hol, przedpokój' }] },
    { b: 'M', namn: 'emm', ex: [
      { sv: 'dam', en: 'lady', pl: 'pani, dama' }, { sv: 'damm', en: 'dust', pl: 'kurz' }] },
    { b: 'N', namn: 'enn', ex: [
      { sv: 'kan', en: 'can', pl: 'może, umie' }, { sv: 'kanna', en: 'jug', pl: 'dzbanek' }] },
    { b: 'O', namn: 'o', vokal: true, ex: [
      { sv: 'sol', en: 'sun', pl: 'słońce' }, { sv: 'boll', en: 'ball', pl: 'piłka' }] },
    { b: 'P', namn: 'pe', ex: [
      { sv: 'köpa', en: 'to buy', pl: 'kupować' }, { sv: 'kopp', en: 'cup', pl: 'filiżanka, kubek' }] },
    { b: 'Q', namn: 'ku', not: 'Q finns nästan bara i lånord och namn.', ex: [
      { sv: 'quiz', en: 'quiz', pl: 'quiz' }, { sv: 'squash', en: 'squash', pl: 'squash; kabaczek' }] },
    { b: 'R', namn: 'ärr', ex: [
      { sv: 'bar', en: 'bare; bar', pl: 'goły; bar' }, { sv: 'barr', en: 'pine needles', pl: 'igły (drzew)' }] },
    { b: 'S', namn: 'ess', ex: [
      { sv: 'glas', en: 'glass', pl: 'szkło, szklanka' }, { sv: 'glass', en: 'ice cream', pl: 'lody' }] },
    { b: 'T', namn: 'te', ex: [
      { sv: 'hat', en: 'hatred', pl: 'nienawiść' }, { sv: 'hatt', en: 'hat', pl: 'kapelusz' }] },
    { b: 'U', namn: 'u', vokal: true, ex: [
      { sv: 'ful', en: 'ugly', pl: 'brzydki' }, { sv: 'full', en: 'full', pl: 'pełny' }] },
    { b: 'V', namn: 've', not: 'V dubbleras nästan aldrig – här två vanliga ord med v.', ex: [
      { sv: 'vatten', en: 'water', pl: 'woda' }, { sv: 'liv', en: 'life', pl: 'życie' }] },
    { b: 'W', namn: 'dubbel-ve', not: 'W låter som v och finns mest i lånord.', ex: [
      { sv: 'webb', en: 'web', pl: 'sieć (www)' }, { sv: 'wok', en: 'wok', pl: 'wok' }] },
    { b: 'X', namn: 'eks', not: 'X låter som ks och dubbleras aldrig.', ex: [
      { sv: 'sex', en: 'six', pl: 'sześć' }, { sv: 'yxa', en: 'axe', pl: 'siekiera' }] },
    { b: 'Y', namn: 'y', vokal: true, ex: [
      { sv: 'flyta', en: 'to float', pl: 'unosić się (na wodzie)' }, { sv: 'flytta', en: 'to move (house)', pl: 'przeprowadzać się' }] },
    { b: 'Z', namn: 'säta', not: 'Z låter som s och finns mest i lånord.', ex: [
      { sv: 'zon', en: 'zone', pl: 'strefa' }, { sv: 'zoo', en: 'zoo', pl: 'zoo' }] },
    { b: 'Å', namn: 'å', vokal: true, ex: [
      { sv: 'hål', en: 'hole', pl: 'dziura' }, { sv: 'hålla', en: 'to hold', pl: 'trzymać' }] },
    { b: 'Ä', namn: 'ä', vokal: true, ex: [
      { sv: 'väg', en: 'road', pl: 'droga' }, { sv: 'vägg', en: 'wall', pl: 'ściana' }] },
    { b: 'Ö', namn: 'ö', vokal: true, ex: [
      { sv: 'dör', en: 'dies', pl: 'umiera' }, { sv: 'dörr', en: 'door', pl: 'drzwi' }] }
  ];

  // Etiketter och anteckningar översätts (i18n.js); den svenska anteckningen i ALFABET styr bara logiken.
  const ETIKETT_VOKAL = ['alfa.langVokal', 'alfa.kortVokal'];
  const ETIKETT_KONS = ['alfa.enkel', 'alfa.dubbel'];

  let vald = null;
  let panelEl = null;
  let radEl = null;

  function markera(ord, bokstav) {
    // Fetstil på bokstaven (och dubbelteckningen) i exempelordet.
    const liten = bokstav.toLowerCase();
    const i = ord.indexOf(liten);
    if (i < 0) return [ord];
    let slut = i + 1;
    while (slut < ord.length && ord[slut] === liten) slut++;
    if (liten === 'c' && ord[slut] === 'k') slut++;
    if (liten === 'k' && ord[i - 1] === 'c') return [ord.slice(0, i - 1), h('b', null, ord.slice(i - 1, slut)), ord.slice(slut)];
    return [ord.slice(0, i), h('b', null, ord.slice(i, slut)), ord.slice(slut)];
  }

  function visaPanel(panel, post) {
    tom(panel);
    const etiketter = post.vokal ? ETIKETT_VOKAL : ETIKETT_KONS;
    panel.appendChild(h('div', { class: 'alfa-huvud' },
      h('div', { class: 'alfa-stor', lang: 'sv' }, post.b, h('small', null, post.b.toLowerCase())),
      h('div', { class: 'alfa-namn' },
        h('div', null, t('alfa.uttalas'), h('b', { lang: 'sv' }, post.namn), ' ', hogtalare(post.namn, { liten: true, etikett: t('alfa.lasBokstav', { b: post.b }) })),
        h('div', { class: 'dampad' }, t(post.vokal ? 'alfa.vokal' : 'alfa.konsonant'))),
      h('button', { type: 'button', class: 'stang', 'aria-label': t('stang'), onclick: () => stang(panel) }, '×')));
    if (post.not) panel.appendChild(h('p', { class: 'alfa-not' }, I18n.har('alfa.not.' + post.b) ? t('alfa.not.' + post.b) : post.not));
    const lista = h('div', { class: 'alfa-exempel' });
    post.ex.forEach((e, i) => {
      lista.appendChild(h('div', { class: 'alfa-ex' },
        h('div', { class: 'alfa-etikett' }, post.not && !post.vokal && /aldrig|nästan bara|mest i/.test(post.not) ? t('alfa.exempel', { n: i + 1 }) : t(etiketter[i])),
        h('div', { class: 'alfa-ord', lang: 'sv' }, ...markera(e.sv, post.b)),
        h('div', { class: 'alfa-knappar' }, hogtalare(e.sv), hogtalare(e.sv, { langsam: true })),
        h('div', { class: 'alfa-overs' }, ...I18n.visadeSprak().map(s => h('span', { lang: s }, FLAGGA[s] + ' ' + e[s])))));
    });
    panel.appendChild(lista);
    panel.hidden = false;
  }

  function stang(panel) {
    panel.hidden = true;
    vald = null;
    document.querySelectorAll('.alfa-knapp[aria-pressed="true"]').forEach(k => k.setAttribute('aria-pressed', 'false'));
  }

  function init(rad, panel) {
    radEl = rad; panelEl = panel;
    tom(rad);
    for (const post of ALFABET) {
      const knapp = h('button', {
        type: 'button', class: 'alfa-knapp' + (post.vokal ? ' vokal' : ''), lang: 'sv',
        'aria-pressed': 'false', 'aria-label': t('alfa.bokstaven', { b: post.b }), 'data-b': post.b,
        onclick: () => {
          if (vald === post.b) { stang(panel); return; }
          document.querySelectorAll('.alfa-knapp[aria-pressed="true"]').forEach(k => k.setAttribute('aria-pressed', 'false'));
          knapp.setAttribute('aria-pressed', 'true');
          vald = post.b;
          window.Tal.saga(post.namn);
          visaPanel(panel, post);
        }
      }, post.b);
      rad.appendChild(knapp);
    }
    document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && !panel.hidden) stang(panel); });
  }

  // Språkbyte: nya etiketter på knapparna och rita om en öppen panel.
  I18n.narSprakAndras(() => {
    if (radEl) radEl.querySelectorAll('.alfa-knapp').forEach(k => k.setAttribute('aria-label', t('alfa.bokstaven', { b: k.dataset.b })));
    if (panelEl && !panelEl.hidden && vald) {
      const post = ALFABET.find(p => p.b === vald);
      if (post) visaPanel(panelEl, post);
    }
  });

  window.Alfabet = { ALFABET, init };
})();
