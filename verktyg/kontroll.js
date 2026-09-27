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
if (fel.length) { console.error('FEL:\n  ' + fel.join('\n  ')); process.exit(1); }
console.log(`OK: ${data.ord.length} ord/fraser, ${data.lektioner.length} lektioner.`);
for (const n of of.NIVAER) console.log(`  ${n}: ${data.ord.filter(o => o.niva === n).length}`);
