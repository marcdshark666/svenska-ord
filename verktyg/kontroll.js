#!/usr/bin/env node
'use strict';
// Kontrollerar att words.json är giltig: format, dubbletter, nivåer och minst 300 ord.
// Kör: node verktyg/kontroll.js   (slutkod 0 = ok)
const of = require('./ordfil.js');

let data;
try { data = of.lasOrdfil(); } catch (e) { console.error('words.json går inte att läsa:', e.message); process.exit(1); }
const fel = of.valideraFil(data);
if (data.ord.length < 300) fel.push(`bara ${data.ord.length} ord (minst 300 krävs)`);
for (const n of of.NIVAER) {
  const antal = data.ord.filter(o => o.niva === n).length;
  if (antal < 40) fel.push(`nivå ${n} har bara ${antal} ord/fraser (minst 40)`);
  if (!data.lektioner.some(l => l.id === 'boss-' + n.toLowerCase())) fel.push(`nivå ${n} saknar bosskamp`);
}

// Gränssnittets översättningar (js/i18n.js): varje nyckel ska finnas på svenska, engelska och polska,
// med samma sorts värde och samma {platshållare} i alla tre språk. Alla lektioner ska ha översatta namn.
let ordbok = null;
try { ordbok = require('../js/i18n.js').ORDBOK; } catch (e) { fel.push('js/i18n.js går inte att läsa: ' + e.message); }
if (ordbok) {
  const SPRAK = ['sv', 'en', 'pl'];
  const platser = v => (String(v).match(/\{\w+\}/g) || []).sort().join(',');
  const typ = v => Array.isArray(v) ? 'lista' : typeof v;
  for (const [nyckel, post] of Object.entries(ordbok)) {
    if (!Array.isArray(post) || post.length !== 3) { fel.push(`i18n "${nyckel}": ska ha exakt tre värden [sv, en, pl]`); continue; }
    const sv = post[0];
    post.forEach((v, i) => {
      const s = SPRAK[i];
      if (v === undefined || v === null || v === '') fel.push(`i18n "${nyckel}": saknar ${s}`);
      else if (typ(v) !== typ(sv)) fel.push(`i18n "${nyckel}": ${s} har fel typ`);
      else if (Array.isArray(v)) {
        if (v.length !== sv.length) fel.push(`i18n "${nyckel}": ${s} har ${v.length} rader, svenska ${sv.length}`);
        if (v.some(x => !x)) fel.push(`i18n "${nyckel}": ${s} har tomma rader`);
      } else if (typeof v === 'object') {
        if (!v.one || !v.other) fel.push(`i18n "${nyckel}": ${s} saknar pluralformerna one/other`);
        if (Object.values(v).some(x => platser(x) !== platser(sv.other))) fel.push(`i18n "${nyckel}": ${s} har andra {platshållare}`);
      } else if (platser(v) !== platser(sv)) fel.push(`i18n "${nyckel}": ${s} har andra {platshållare} än svenska`);
    });
  }
  for (const l of data.lektioner) {
    if (!l.boss && !ordbok['lekt.' + l.id]) fel.push(`lektionen "${l.id}" saknar översatt namn (lekt.${l.id} i js/i18n.js)`);
  }
}

// Flashcards (data/kort-*.json): schema, dubbletter, tomma fält och minst 150 kort per nivålek.
// Medicinleken är valfri – saknas filen visar sajten "kommer snart".
const fs = require('fs');
const path = require('path');
const KortData = require('../js/kortdata.js');
const kortAntal = {};
for (const lek of KortData.LEKAR) {
  const fil = path.join(__dirname, '..', 'data', `kort-${lek}.json`);
  if (!fs.existsSync(fil)) {
    if (KortData.NIVALEKAR.includes(lek)) fel.push(`data/kort-${lek}.json saknas`);
    else kortAntal[lek] = 'saknas (kommer snart)';
    continue;
  }
  let lekData;
  try { lekData = JSON.parse(fs.readFileSync(fil, 'utf8').replace(/^﻿/, '')); }
  catch (e) { fel.push(`data/kort-${lek}.json går inte att läsa: ${e.message}`); continue; }
  fel.push(...KortData.validera(lekData, lek));
  kortAntal[lek] = Array.isArray(lekData.kort) ? lekData.kort.length : 0;
}
for (const lek of KortData.LEKAR) if (ordbok && !ordbok['kort.lek.' + lek]) fel.push(`leken ${lek} saknar namn (kort.lek.${lek} i js/i18n.js)`);

// Samtalsläget (data/samtal.json): schema, alla tre språk, förslagen godkänns och felalternativen gör det inte.
const SamtalData = require('../js/samtaldata.js');
let samtalAntal = 0;
try {
  const sd = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'samtal.json'), 'utf8').replace(/^﻿/, ''));
  fel.push(...SamtalData.validera(sd));
  samtalAntal = Array.isArray(sd.samtal) ? sd.samtal.length : 0;
} catch (e) { fel.push('data/samtal.json går inte att läsa: ' + e.message); }

if (fel.length) { console.error('FEL:\n  ' + fel.join('\n  ')); process.exit(1); }
console.log(`OK: ${data.ord.length} ord/fraser, ${data.lektioner.length} lektioner, ${ordbok ? Object.keys(ordbok).length : 0} gränssnittstexter på sv/en/pl.`);
for (const n of of.NIVAER) console.log(`  ${n}: ${data.ord.filter(o => o.niva === n).length}`);
console.log('Flashcards: ' + Object.entries(kortAntal).map(([l, n]) => `${l}=${n}`).join(', '));
console.log(`Samtal: ${samtalAntal}`);
