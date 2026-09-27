'use strict';
/**
 * ordfil.js – gemensam läs/skriv/validering för words.json.
 * Används av lagg-till-ord.js och verktyg/kontroll.js (samma regler som sajten).
 */
const fs = require('fs');
const path = require('path');

const ORDFIL = path.join(__dirname, '..', 'words.json');

const ORDKLASSER = [
  'substantiv', 'verb', 'adjektiv', 'adverb', 'pronomen', 'preposition',
  'konjunktion', 'interjektion', 'räkneord', 'fras'
];

const MAX_LANGD = 200;

/** CEFR-nivåerna i ordning. Lektionen "extra" (tillagda ord) har nivån "egna". */
const NIVAER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/** Normaliserar för dubblettkoll: gemener, trimmat, enkla mellanslag. */
function nyckel(sv) {
  return String(sv || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Stabilt id av det svenska ordet (ASCII, bindestreck). */
function slug(sv) {
  return nyckel(sv)
    .replace(/[åä]/g, 'a').replace(/ö/g, 'o').replace(/é/g, 'e')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'ord';
}

function unikId(sv, ord) {
  const bas = slug(sv);
  const tagna = new Set(ord.map(o => o.id));
  if (!tagna.has(bas)) return bas;
  let i = 2;
  while (tagna.has(`${bas}-${i}`)) i++;
  return `${bas}-${i}`;
}

function lasOrdfil(fil = ORDFIL) {
  const text = fs.readFileSync(fil, 'utf8');
  return JSON.parse(text.replace(/^﻿/, ''));
}

/** Skriver ett ord per rad så att git-diffarna blir läsbara. */
function serialisera(data) {
  const rader = [];
  rader.push('{');
  rader.push(`  "version": ${JSON.stringify(data.version || 1)},`);
  rader.push(`  "uppdaterad": ${JSON.stringify(data.uppdaterad || new Date().toISOString())},`);
  rader.push('  "lektioner": [');
  rader.push(data.lektioner.map(l => '    ' + JSON.stringify(l)).join(',\n'));
  rader.push('  ],');
  rader.push('  "ord": [');
  rader.push(data.ord.map(o => '    ' + JSON.stringify(o)).join(',\n'));
  rader.push('  ]');
  rader.push('}');
  return rader.join('\n') + '\n';
}

function skrivOrdfil(data, fil = ORDFIL) {
  const tmp = fil + '.tmp';
  fs.writeFileSync(tmp, serialisera(data), 'utf8');
  fs.renameSync(tmp, fil);
}

function textFalt(v, namn, fel, { kravs = true } = {}) {
  if (v === undefined || v === null || v === '') {
    if (kravs) fel.push(`${namn} saknas`);
    return;
  }
  if (typeof v !== 'string') { fel.push(`${namn} måste vara text`); return; }
  if (v.trim() !== v) fel.push(`${namn} har mellanslag i början/slutet`);
  if (v.length > MAX_LANGD) fel.push(`${namn} är för lång (max ${MAX_LANGD})`);
  if (/[<>]/.test(v)) fel.push(`${namn} får inte innehålla < eller >`);
}

/** Validerar ett ord. Returnerar lista med fel (tom = ok). */
function valideraOrd(o, lektionsIds) {
  const fel = [];
  if (!o || typeof o !== 'object') return ['ordet är inte ett objekt'];
  textFalt(o.id, 'id', fel);
  textFalt(o.sv, 'sv', fel);
  textFalt(o.en, 'en', fel);
  textFalt(o.pl, 'pl', fel);
  if (o.sv && o.sv.length > 60) fel.push('sv är för långt (max 60)');
  if (!ORDKLASSER.includes(o.ordklass)) fel.push(`okänd ordklass "${o.ordklass}"`);
  if (lektionsIds && !lektionsIds.has(o.lektion)) fel.push(`okänd lektion "${o.lektion}"`);
  if (!NIVAER.includes(o.niva)) fel.push(`okänd nivå "${o.niva}" (ska vara ${NIVAER.join('/')})`);
  if (o.ex !== undefined) {
    if (typeof o.ex !== 'object' || o.ex === null) fel.push('ex måste vara ett objekt');
    else {
      textFalt(o.ex.sv, 'ex.sv', fel);
      textFalt(o.ex.en, 'ex.en', fel, { kravs: false });
      textFalt(o.ex.pl, 'ex.pl', fel, { kravs: false });
    }
  }
  return fel;
}

/** Validerar hela filen. Returnerar lista med fel. */
function valideraFil(data) {
  const fel = [];
  if (!data || !Array.isArray(data.lektioner) || !Array.isArray(data.ord)) {
    return ['words.json saknar "lektioner" eller "ord"'];
  }
  const lektionsIds = new Set();
  for (const l of data.lektioner) {
    if (!l.id || !l.titel) fel.push(`lektion utan id/titel: ${JSON.stringify(l)}`);
    if (lektionsIds.has(l.id)) fel.push(`dubblett av lektion ${l.id}`);
    if (!NIVAER.includes(l.niva) && !(l.id === 'extra' && l.niva === 'egna')) fel.push(`lektion ${l.id} har okänd nivå "${l.niva}"`);
    lektionsIds.add(l.id);
  }
  const ids = new Set();
  const sv = new Set();
  data.ord.forEach((o, i) => {
    for (const f of valideraOrd(o, lektionsIds)) fel.push(`ord #${i} (${o && o.sv}): ${f}`);
    if (o && ids.has(o.id)) fel.push(`dubblett av id ${o.id}`);
    if (o && sv.has(nyckel(o.sv))) fel.push(`dubblett av ordet "${o.sv}"`);
    if (o) { ids.add(o.id); sv.add(nyckel(o.sv)); }
  });
  return fel;
}

module.exports = {
  ORDFIL, ORDKLASSER, NIVAER, nyckel, slug, unikId, lasOrdfil, skrivOrdfil,
  serialisera, valideraOrd, valideraFil
};
