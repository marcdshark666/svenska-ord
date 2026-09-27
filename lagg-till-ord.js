#!/usr/bin/env node
'use strict';
/**
 * lagg-till-ord.js – lägger till ett ord i words.json, committar och pushar.
 *
 *   node lagg-till-ord.js "hund" --en "dog" --pl "pies" [--exempel "Hunden skäller."]
 *        [--exempel-en "The dog barks."] [--exempel-pl "Pies szczeka."]
 *        [--ordklass substantiv] [--niva A1|A2|B1|B2|C1|C2] [--lektion extra]
 *        [--ingen-push] [--torrkorning]
 *
 * Utan --exempel skapas ingen exempelmening (sajten klarar det).
 * Slutkoder: 0 ok, 1 fel indata/dubblett, 2 git-fel.
 */
const { execFileSync } = require('child_process');
const path = require('path');
const of = require('./verktyg/ordfil.js');

const MAPP = __dirname;

function hjalp(kod = 0) {
  console.log(`Användning:
  node lagg-till-ord.js "<svenskt ord>" --en "<engelska>" --pl "<polska>"
       [--exempel "<svensk mening>"] [--exempel-en "..."] [--exempel-pl "..."]
       [--ordklass ${of.ORDKLASSER.join('|')}] [--niva ${of.NIVAER.join('|')}] [--lektion <id>]
       [--ingen-push] [--torrkorning]`);
  process.exit(kod);
}

function tolkaArgument(argv) {
  const a = { flaggor: {}, fria: [] };
  const medVarde = ['en', 'pl', 'exempel', 'exempel-en', 'exempel-pl', 'ordklass', 'niva', 'lektion'];
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    if (x === '-h' || x === '--help' || x === '--hjalp') hjalp(0);
    if (x.startsWith('--')) {
      const namn = x.slice(2);
      if (medVarde.includes(namn)) {
        const v = argv[++i];
        if (v === undefined || v.startsWith('--')) throw new Error(`--${namn} kräver ett värde`);
        a.flaggor[namn] = v;
      } else if (namn === 'ingen-push' || namn === 'torrkorning') {
        a.flaggor[namn] = true;
      } else {
        throw new Error(`okänd flagga --${namn}`);
      }
    } else {
      a.fria.push(x);
    }
  }
  return a;
}

function git(args) {
  return execFileSync('git', args, { cwd: MAPP, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function main() {
  let a;
  try { a = tolkaArgument(process.argv.slice(2)); } catch (e) { console.error('Fel:', e.message); hjalp(1); }
  const f = a.flaggor;
  const sv = (a.fria.join(' ') || '').trim().replace(/\s+/g, ' ');
  if (!sv || !f.en || !f.pl) { console.error('Fel: ordet, --en och --pl krävs.'); hjalp(1); }

  let data;
  try { data = of.lasOrdfil(); } catch (e) { console.error('Kan inte läsa words.json:', e.message); process.exit(1); }

  const finns = data.ord.find(o => of.nyckel(o.sv) === of.nyckel(sv));
  if (finns) {
    console.error(`Dubblett: "${finns.sv}" finns redan (${finns.en} / ${finns.pl}, lektion ${finns.lektion}).`);
    process.exit(1);
  }

  const lektion = f.lektion || 'extra';
  if (!data.lektioner.some(l => l.id === lektion)) {
    if (lektion !== 'extra') { console.error(`Okänd lektion "${lektion}".`); process.exit(1); }
    data.lektioner.push({ id: 'extra', titel: 'Tillagda ord', emoji: '➕', niva: 'egna' });
  }
  const lekt = data.lektioner.find(l => l.id === lektion);
  const niva = (f.niva || (of.NIVAER.includes(lekt.niva) ? lekt.niva : 'A1')).toUpperCase();

  const ord = {
    id: of.unikId(sv, data.ord),
    sv,
    en: f.en.trim(),
    pl: f.pl.trim(),
    ordklass: f.ordklass || (sv.includes(' ') ? 'fras' : 'substantiv'),
    lektion,
    niva
  };
  if (f.exempel) {
    ord.ex = { sv: f.exempel.trim() };
    if (f['exempel-en']) ord.ex.en = f['exempel-en'].trim();
    if (f['exempel-pl']) ord.ex.pl = f['exempel-pl'].trim();
  }
  const fel = of.valideraOrd(ord, new Set(data.lektioner.map(l => l.id)));
  if (fel.length) { console.error('Ogiltigt ord:\n  ' + fel.join('\n  ')); process.exit(1); }

  data.ord.push(ord);
  data.uppdaterad = new Date().toISOString();
  const helaFel = of.valideraFil(data);
  if (helaFel.length) { console.error('words.json blev ogiltig:\n  ' + helaFel.join('\n  ')); process.exit(1); }

  if (f.torrkorning) {
    console.log('Torrkörning – skulle lägga till:', JSON.stringify(ord));
    return;
  }

  // Hämta senaste först så att ett ord som lagts till via sajten inte skrivs över.
  if (!f['ingen-push']) {
    try { git(['pull', '--rebase', '--autostash']); } catch (e) { console.warn('Varning: git pull misslyckades:', e.stderr || e.message); }
    try {
      data = of.lasOrdfil();
      if (data.ord.some(o => of.nyckel(o.sv) === of.nyckel(sv))) {
        console.error(`Dubblett efter pull: "${sv}" finns redan.`); process.exit(1);
      }
      if (!data.lektioner.some(l => l.id === lektion)) data.lektioner.push({ id: 'extra', titel: 'Tillagda ord', emoji: '➕', niva: 'egna' });
      ord.id = of.unikId(sv, data.ord);
      data.ord.push(ord);
      data.uppdaterad = new Date().toISOString();
    } catch (e) { console.error('Kan inte läsa words.json efter pull:', e.message); process.exit(2); }
  }

  of.skrivOrdfil(data);
  console.log(`Tillagt: ${ord.sv} = ${ord.en} / ${ord.pl} (lektion ${lektion}, totalt ${data.ord.length} ord)`);

  try {
    git(['add', 'words.json']);
    git(['commit', '-m', `Nytt ord: ${ord.sv} (${ord.en} / ${ord.pl})`]);
    if (f['ingen-push']) { console.log('Committat lokalt (ingen push).'); return; }
    git(['push']);
    console.log('Pushat. GitHub Pages uppdateras om ungefär en minut.');
  } catch (e) {
    console.error('Git-fel:', (e.stderr || e.message || '').toString().trim());
    process.exit(2);
  }
}

main();
