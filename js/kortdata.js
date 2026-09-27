/* kortdata.js – vilka flashcard-lekar som finns och hur en lekfil valideras.
 * Samma kod körs i webbläsaren (js/kort.js, ?sjalvtest=1) och i Node (verktyg/kontroll.js).
 * Lekfil: data/kort-<id>.json
 *   {"deck":"a1","titel":{"sv":"…","en":"…","pl":"…"},"kort":[{"id":"a1-001","pl":"…","en":"…","sv":"…","exempel_sv":"…","kategori":"…"}]} */
(function (rot) {
  'use strict';

  const NIVALEKAR = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
  const LEKAR = NIVALEKAR.concat(['medicin']);
  const MIN_KORT_NIVA = 150;
  const KRAVDA_FALT = ['id', 'pl', 'en', 'sv'];
  const VALFRIA_FALT = ['exempel_sv', 'kategori'];

  function arText(v) { return typeof v === 'string' && v.trim() !== ''; }
  function nyckel(s) { return String(s || '').trim().toLowerCase().replace(/\s+/g, ' '); }

  /** Returnerar en lista med fel (tom = giltig). */
  function validera(data, id, { minKort = NIVALEKAR.includes(id) ? MIN_KORT_NIVA : 1 } = {}) {
    const fel = [];
    const namn = `kort-${id}.json`;
    if (!data || typeof data !== 'object' || Array.isArray(data)) return [`${namn}: är inte ett JSON-objekt`];
    if (data.deck !== id) fel.push(`${namn}: "deck" ska vara "${id}" (är ${JSON.stringify(data.deck)})`);
    if (!data.titel || !['sv', 'en', 'pl'].every(s => arText(data.titel[s]))) fel.push(`${namn}: "titel" saknar sv/en/pl`);
    if (!Array.isArray(data.kort)) { fel.push(`${namn}: "kort" är ingen lista`); return fel; }
    if (data.kort.length < minKort) fel.push(`${namn}: bara ${data.kort.length} kort (minst ${minKort})`);
    const sedda = { id: new Map(), sv: new Map() };
    data.kort.forEach((k, i) => {
      const var_ = `${namn} kort ${i + 1}${k && k.id ? ' (' + k.id + ')' : ''}`;
      if (!k || typeof k !== 'object') { fel.push(`${var_}: är inget objekt`); return; }
      for (const f of KRAVDA_FALT) if (!arText(k[f])) fel.push(`${var_}: fältet "${f}" saknas eller är tomt`);
      for (const f of VALFRIA_FALT) if (f in k && !arText(k[f])) fel.push(`${var_}: fältet "${f}" är tomt`);
      for (const f of KRAVDA_FALT.concat(VALFRIA_FALT)) {
        if (arText(k[f]) && k[f] !== k[f].trim()) fel.push(`${var_}: "${f}" har mellanslag i början/slutet`);
      }
      for (const f of ['id', 'sv']) {
        if (!arText(k[f])) continue;
        const n = nyckel(k[f]);
        if (sedda[f].has(n)) fel.push(`${var_}: dubblett av ${f} "${k[f]}" (samma som kort ${sedda[f].get(n)})`);
        else sedda[f].set(n, i + 1);
      }
    });
    return fel;
  }

  const KortData = { NIVALEKAR, LEKAR, MIN_KORT_NIVA, validera, nyckel };
  if (typeof module !== 'undefined' && module.exports) module.exports = KortData;
  if (typeof window !== 'undefined') rot.KortData = KortData;
})(typeof window !== 'undefined' ? window : globalThis);
