/* samtaldata.js – samtalslägets bedömning och validering av data/samtal.json.
 * Samma kod körs i webbläsaren (js/samtal.js, ?sjalvtest=1) och i Node (verktyg/kontroll.js).
 *
 * Ett samtal: {"id","niva":"A1","ikon","titel":{sv,en,pl},"slut":{sv,en,pl},"steg":[…]}
 * Ett steg:  {"sv","en","pl"                       – det Bosse säger (och översättningen)
 *             "svar":{sv,en,pl}                    – förslaget ("Du kan säga: …")
 *             "godkant":["jag heter *", …]         – godkända svar; * = ett eller flera valfria ord
 *             "nyckel":[["tycker","anser"], …]     – valfritt: ett ord ur varje grupp räcker (om svaret liknar något godkänt)
 *             "fel":[{"m":"jag har * år","ratt":"Jag är tjugofem år.","en":"…","pl":"…"}]  – vanliga misstag med rättning
 *             "val":["…","…"]                      – två felaktiga alternativ till "Välj svar"
 *             "sen":{sv,en,pl}}                    – valfritt: Bosses kommentar efter rätt svar ({namn} = ordet i första *)
 */
(function (rot) {
  'use strict';

  const NIVAER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const SPRAK = ['sv', 'en', 'pl'];
  const GRANS_RATT = 0.8;      // likhet med ett godkänt svar som räcker
  const GRANS_NYCKEL = 0.4;    // med alla nyckelord räcker lägre likhet
  const GRANS_NASTAN = 0.5;    // "Nästan!" i stället för "Det förstod jag inte"
  const GRANS_FEL = 0.85;      // likhet med ett känt misstag

  /** Bosses fasta repliker (svenska, med översättning till hjälpspråket). */
  const FRASER = {
    perfekt: [
      { sv: 'Perfekt!', en: 'Perfect!', pl: 'Idealnie!' },
      { sv: 'Jättebra!', en: 'Great!', pl: 'Świetnie!' },
      { sv: 'Snyggt!', en: 'Nice!', pl: 'Pięknie!' },
      { sv: 'Utmärkt!', en: 'Excellent!', pl: 'Doskonale!' }],
    bra: [
      { sv: 'Bra!', en: 'Good!', pl: 'Dobrze!' },
      { sv: 'Det går bra!', en: 'That works!', pl: 'Może być!' }],
    nastan: { sv: 'Nästan! Säg: {svar}', en: 'Almost! Say: {svar}', pl: 'Prawie! Powiedz: {svar}' },
    forstod: { sv: 'Hmm, det förstod jag inte riktigt. Försök igen!', en: 'Hmm, I didn’t quite get that. Try again!', pl: 'Hmm, nie do końca zrozumiałem. Spróbuj jeszcze raz!' },
    upprepa: { sv: 'Lyssna och säg efter mig: {svar}', en: 'Listen and repeat after me: {svar}', pl: 'Posłuchaj i powtórz za mną: {svar}' },
    vidare: { sv: 'Ingen fara, vi går vidare.', en: 'No worries, let’s move on.', pl: 'Nie szkodzi, idziemy dalej.' }
  };

  function arText(v) { return typeof v === 'string' && v.trim() !== ''; }

  // ---------------- Normalisering och likhet ----------------
  function normalisera(s) {
    return String(s || '').toLowerCase().normalize('NFC')
      .replace(/[.,!?;:"'()¿¡–—\-/…“”„»«’‘]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function prickfri(s) { return String(s).replace(/[åä]/g, 'a').replace(/ö/g, 'o').replace(/é/g, 'e'); }
  function ord(s) { const n = normalisera(s); return n ? n.split(' ') : []; }

  function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    let fore = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const nu = [i];
      for (let j = 1; j <= b.length; j++) nu[j] = Math.min(fore[j] + 1, nu[j - 1] + 1, fore[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      fore = nu;
    }
    return fore[b.length];
  }

  /** Kostnad 0..1 för att två ord ska räknas som samma (1 = olika ord). Förlåtande för prickar och små hörfel. */
  function ordKostnad(a, b) {
    if (a === b) return 0;
    const pa = prickfri(a), pb = prickfri(b);
    if (pa === pb) return 0.1;
    const langd = Math.max(pa.length, pb.length);
    const tol = langd >= 7 ? 2 : langd >= 4 ? 1 : 0;
    return levenshtein(pa, pb) <= tol ? 0.25 : 1;
  }

  /** Likhet 0..1 mellan ett svar och ett mönster (ordnivå). "*" tar ett eller flera ord gratis. */
  function jamfor(monster, svar) {
    const P = ord(monster), U = ord(svar);
    const fasta = P.filter(p => p !== '*').length;
    if (!U.length) return { poang: 0, fasta };
    const INF = 1e9;
    // k[i][j] = minsta kostnad för P[0..i) mot U[0..j)
    const k = Array.from({ length: P.length + 1 }, () => new Array(U.length + 1).fill(INF));
    k[0][0] = 0;
    for (let i = 0; i <= P.length; i++) {
      for (let j = 0; j <= U.length; j++) {
        if (i === 0 && j === 0) continue;
        let b = INF;
        if (j > 0) b = Math.min(b, k[i][j - 1] + (i > 0 && P[i - 1] === '*' ? 0 : 1)); // extra ord (gratis inuti *)
        if (i > 0) {
          const p = P[i - 1];
          if (p === '*') {
            if (j > 0) b = Math.min(b, k[i - 1][j - 1]);   // * tar sitt första ord
            b = Math.min(b, k[i - 1][j] + 1);               // * utan ord kostar
          } else {
            if (j > 0) b = Math.min(b, k[i - 1][j - 1] + ordKostnad(p, U[j - 1]));
            b = Math.min(b, k[i - 1][j] + 1);               // ord saknas
          }
        }
        k[i][j] = b;
      }
    }
    return { poang: Math.max(0, 1 - k[P.length][U.length] / Math.max(1, fasta)), fasta };
  }

  function basta(monsterLista, svar) {
    let b = { poang: 0, fasta: 0, monster: null };
    for (const m of monsterLista || []) {
      const r = jamfor(m, svar);
      if (r.poang > b.poang || (r.poang === b.poang && r.fasta > b.fasta)) b = { poang: r.poang, fasta: r.fasta, monster: m };
    }
    return b;
  }

  function harNycklar(steg, svar) {
    if (!Array.isArray(steg.nyckel) || !steg.nyckel.length) return false;
    const U = ord(svar);
    return steg.nyckel.every(grupp => grupp.some(n => U.some(u => ordKostnad(normalisera(n), u) < 1)));
  }

  /** Ordet/orden som första * fångade (t.ex. namnet i "jag heter *"). */
  function fanga(monster, svar) {
    if (!monster || monster.indexOf('*') < 0) return '';
    const delar = normalisera(monster).split('*').map(d => d.trim().split(' ').filter(Boolean).map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join(' '));
    const re = new RegExp('^' + delar.map(d => d).join(' ?(.+?) ?') + '$');
    const m = normalisera(svar).match(re);
    if (!m || !m[1]) return '';
    return m[1].split(' ').slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  const RANG = { ratt: 3, kant: 2, nastan: 1, fel: 0 };

  /** Bedömer ett svar (en lista med alternativ från taligenkänningen, eller en rad text).
   *  typ: ratt | kant (känt misstag – fel.ratt/tips) | nastan | fel */
  function bedom(steg, alternativ) {
    const lista = (Array.isArray(alternativ) ? alternativ : [alternativ]).filter(arText);
    let bast = { typ: 'fel', poang: 0, hord: lista[0] || '' };
    for (const a of lista) {
      const g = basta(steg.godkant, a);
      const felLista = Array.isArray(steg.fel) ? steg.fel : [];
      const f = basta(felLista.map(x => x.m), a);
      let r;
      if (f.poang >= GRANS_FEL && (f.poang > g.poang || (f.poang === g.poang && f.fasta > g.fasta))) {
        r = { typ: 'kant', poang: f.poang, fel: felLista.find(x => x.m === f.monster) };
      } else if (g.poang >= GRANS_RATT) {
        r = { typ: 'ratt', poang: g.poang, namn: fanga(g.monster, a) };
      } else if (g.poang >= GRANS_NYCKEL && harNycklar(steg, a)) {
        r = { typ: 'ratt', poang: g.poang, namn: '' };
      } else {
        r = { typ: g.poang >= GRANS_NASTAN ? 'nastan' : 'fel', poang: g.poang };
      }
      r.hord = a;
      if (RANG[r.typ] > RANG[bast.typ] || (RANG[r.typ] === RANG[bast.typ] && r.poang > bast.poang)) bast = r;
    }
    return bast;
  }

  // ---------------- Validering ----------------
  function treSprak(v, var_, fel) {
    if (!v || typeof v !== 'object') { fel.push(`${var_}: saknas`); return; }
    for (const s of SPRAK) if (!arText(v[s])) fel.push(`${var_}: saknar ${s}`);
  }

  /** Returnerar en lista med fel (tom = giltig). Kontrollerar också att förslaget godkänns och att felalternativen inte gör det. */
  function validera(data) {
    const fel = [];
    if (!data || !Array.isArray(data.samtal)) return ['samtal.json: "samtal" ska vara en lista'];
    if (data.samtal.length < 6) fel.push(`samtal.json: bara ${data.samtal.length} samtal (minst 6)`);
    const idn = new Set();
    for (const [i, s] of data.samtal.entries()) {
      const namn = `samtal[${i}]${s && s.id ? ' ' + s.id : ''}`;
      if (!s || typeof s !== 'object') { fel.push(namn + ': inte ett objekt'); continue; }
      if (!arText(s.id) || !/^[a-z0-9-]+$/.test(s.id)) fel.push(namn + ': ogiltigt id');
      else if (idn.has(s.id)) fel.push(namn + ': dubblett av id'); else idn.add(s.id);
      if (!NIVAER.includes(s.niva)) fel.push(namn + ': ogiltig nivå ' + s.niva);
      if (!arText(s.ikon)) fel.push(namn + ': saknar ikon');
      treSprak(s.titel, namn + ' titel', fel);
      treSprak(s.slut, namn + ' slut', fel);
      if (!Array.isArray(s.steg) || s.steg.length < 3) { fel.push(namn + ': minst 3 steg'); continue; }
      s.steg.forEach((st, j) => {
        const sn = `${namn} steg ${j + 1}`;
        treSprak(st, sn, fel);
        treSprak(st.svar, sn + ' svar', fel);
        if (st.sen) treSprak(st.sen, sn + ' sen', fel);
        if (!Array.isArray(st.godkant) || !st.godkant.length || !st.godkant.every(arText)) { fel.push(sn + ': godkant saknas'); return; }
        if (!Array.isArray(st.val) || st.val.length !== 2 || !st.val.every(arText)) fel.push(sn + ': val ska ha två felaktiga alternativ');
        if (st.nyckel && (!Array.isArray(st.nyckel) || !st.nyckel.every(g => Array.isArray(g) && g.length && g.every(arText)))) fel.push(sn + ': nyckel ska vara en lista med ordlistor');
        if (st.fel && (!Array.isArray(st.fel) || !st.fel.every(f => f && arText(f.m) && arText(f.ratt) && arText(f.en) && arText(f.pl)))) fel.push(sn + ': fel ska ha m, ratt, en och pl');
        if (st.svar && arText(st.svar.sv)) {
          const r = bedom(st, [st.svar.sv]);
          if (r.typ !== 'ratt') fel.push(`${sn}: förslaget "${st.svar.sv}" godkänns inte (${r.typ})`);
        }
        (st.fel || []).forEach(f => {
          if (arText(f.ratt) && bedom(st, [f.ratt]).typ !== 'ratt') fel.push(`${sn}: rättningen "${f.ratt}" godkänns inte`);
        });
        (st.val || []).forEach(v => {
          if (arText(v) && bedom(st, [v]).typ === 'ratt') fel.push(`${sn}: felalternativet "${v}" godkänns`);
        });
      });
    }
    return fel;
  }

  const SamtalData = { NIVAER, FRASER, normalisera, jamfor, bedom, fanga, validera, levenshtein };
  if (typeof module !== 'undefined' && module.exports) module.exports = SamtalData;
  if (typeof window !== 'undefined') rot.SamtalData = SamtalData;
})(typeof window !== 'undefined' ? window : globalThis);
