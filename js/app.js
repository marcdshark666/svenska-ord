/* app.js – Svenska Ord. Nivåkarta A1–C2, lektioner, bosskamper, figurer, märken, egna ord och GitHub-sparning. */
(function () {
  'use strict';
  const { h, tom, blanda, hogtalare } = window.DOM;
  const Tal = window.Tal;
  const Ljud = window.Ljud;
  const Figurer = window.Figurer;
  const I18n = window.I18n;
  const t = I18n.t;

  // ---------------- Konstanter ----------------
  const LAGRING = 'svenskaord.v1';
  const TOKEN_NYCKEL = 'svenskaord.ghtoken';
  const MAX_HJARTAN = 5;
  const HJARTA_MIN = 20; // ett hjärta tillbaka var 20:e minut
  const STANDARD_REPO = 'marcdshark666/svenska-ord';
  const EGNA = 'mina';
  // Översättningsspråken för orden. Namnen följer gränssnittets språk (i18n.js).
  const SPRAK = {
    en: { flagga: '🇬🇧', get namn() { return t('sprak.en.namn'); } },
    pl: { flagga: '🇵🇱', get namn() { return t('sprak.pl.namn'); } }
  };
  const ORDKLASSER = ['substantiv', 'verb', 'adjektiv', 'adverb', 'pronomen', 'preposition',
    'konjunktion', 'interjektion', 'räkneord', 'fras'];

  // CEFR-nivåerna som platser i svensk natur på kartan.
  // Namn och plats (Blomsterängen …) översätts i i18n.js: niva.A1.namn, niva.A1.plats.
  const NIVAER = [
    ['A1', ['🌼', '🌷', '🐝', '🌾', '🦋', '🌸']],
    ['A2', ['🌲', '🍄', '🦔', '🌲', '🐿️', '🫐']],
    ['B1', ['🛶', '🐟', '🦆', '🌿', '🪨', '🐸']],
    ['B2', ['⛰️', '🦌', '🏔️', '🌲', '❄️', '🦅']],
    ['C1', ['✨', '🌌', '🦉', '🌠', '❄️', '🏕️']],
    ['C2', ['🏔️', '🚩', '👑', '✨', '🦅', '⭐']]
  ].map(([id, deko]) => ({ id, deko, get namn() { return t(`niva.${id}.namn`); }, get plats() { return t(`niva.${id}.plats`); } }));

  // Tips, beröm och tröst finns på tre språk i i18n.js (listor).
  const TIPS = () => I18n.lista('tips');
  const BERÖM = () => I18n.lista('berom');
  const TROST = () => I18n.lista('trost');

  // ---------------- Lagring (alltid try/catch) ----------------
  function lasLokalt(nyckel, reserv) {
    try {
      const t = window.localStorage.getItem(nyckel);
      return t ? JSON.parse(t) : reserv;
    } catch (e) { console.warn('Kunde inte läsa', nyckel, e); return reserv; }
  }
  function skrivLokalt(nyckel, varde) {
    try { window.localStorage.setItem(nyckel, JSON.stringify(varde)); return true; }
    catch (e) { console.warn('Kunde inte spara', nyckel, e); return false; }
  }

  function nyttTillstand() {
    return {
      xp: 0, streak: 0, sistaDag: null, hjartan: MAX_HJARTAN, hjartaTid: Date.now(),
      klara: {},        // lektionsId -> { ggr, stjarnor, bast }
      ordStat: {},      // ordId -> { r, f, sist }
      dagXp: { dag: null, xp: 0 },
      xpHist: {},       // 'YYYY-MM-DD' -> xp
      marken: {},       // märkesId -> datum
      rekord: { basta: 0, felfria: 0, bossar: 0, uttal: 0 },
      egnaOrd: [],
      inst: { sprak: 'en', rost: '', hastighet: 0.95, autoljud: true, uttal: true, ljud: true, dagsmal: 30, repo: STANDARD_REPO }
    };
  }

  let T = Object.assign(nyttTillstand(), lasLokalt(LAGRING, {}));
  T.inst = Object.assign(nyttTillstand().inst, T.inst || {});
  T.rekord = Object.assign(nyttTillstand().rekord, T.rekord || {});
  if (!Array.isArray(T.egnaOrd)) T.egnaOrd = [];
  if (!T.xpHist || typeof T.xpHist !== 'object') T.xpHist = {};
  if (!T.marken || typeof T.marken !== 'object') T.marken = {};
  function spara() { skrivLokalt(LAGRING, T); }

  // ---------------- Datum/streak/hjärtan ----------------
  function idag(d = new Date()) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function igar() { const d = new Date(); d.setDate(d.getDate() - 1); return idag(d); }
  function aktuellStreak() { return (T.sistaDag === idag() || T.sistaDag === igar()) ? T.streak : 0; }
  function dagensXp() { return T.dagXp && T.dagXp.dag === idag() ? T.dagXp.xp : 0; }

  function fyllHjartan() {
    if (T.hjartan >= MAX_HJARTAN) { T.hjartaTid = Date.now(); return; }
    const steg = Math.floor((Date.now() - (T.hjartaTid || Date.now())) / (HJARTA_MIN * 60000));
    if (steg > 0) {
      T.hjartan = Math.min(MAX_HJARTAN, T.hjartan + steg);
      T.hjartaTid = T.hjartan >= MAX_HJARTAN ? Date.now() : T.hjartaTid + steg * HJARTA_MIN * 60000;
      spara();
    }
  }
  function minTillHjarta() {
    return Math.max(1, Math.ceil((T.hjartaTid + HJARTA_MIN * 60000 - Date.now()) / 60000));
  }

  function geXp(n) {
    T.xp += n;
    if (!T.dagXp || T.dagXp.dag !== idag()) T.dagXp = { dag: idag(), xp: 0 };
    T.dagXp.xp += n;
    T.xpHist[idag()] = (T.xpHist[idag()] || 0) + n;
    // Behåll bara de senaste 60 dagarna.
    const nycklar = Object.keys(T.xpHist).sort();
    while (nycklar.length > 60) delete T.xpHist[nycklar.shift()];
  }
  function markeraDagKlar() {
    const d = idag();
    if (T.sistaDag === d) return false;
    T.streak = T.sistaDag === igar() ? T.streak + 1 : 1;
    T.sistaDag = d;
    return true;
  }

  // ---------------- Data ----------------
  let DATA = { lektioner: [], ord: [] };
  const ordPerId = new Map();

  function nyckel(sv) { return String(sv || '').trim().toLowerCase().replace(/\s+/g, ' '); }
  function slug(sv) {
    return nyckel(sv).replace(/[åä]/g, 'a').replace(/ö/g, 'o').replace(/é/g, 'e')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'ord';
  }

  function allaOrd() { return DATA.ord.concat(T.egnaOrd); }
  function lektion(id) { return DATA.lektioner.find(l => l.id === id); }
  function ordILektion(id) {
    const l = lektion(id);
    if (l && l.boss) return DATA.ord.filter(o => o.niva === l.niva);
    return allaOrd().filter(o => o.lektion === id);
  }
  /** Översättningsspråket i övningarna: engelskt gränssnitt → en, polskt → pl, svenskt → valet under ⚙️ Mer. */
  function sprak() {
    const ui = I18n.sprak;
    if (ui === 'en' || ui === 'pl') return ui;
    return T.inst.sprak === 'pl' ? 'pl' : 'en';
  }
  /** Översättningar som visas bredvid ett ord (en, pl eller båda i svenskt gränssnitt). */
  function visadeSprak() { return I18n.visadeSprak(); }
  function lektionsTitel(l) {
    if (!l) return '';
    if (l.boss && l.niva) return t('lekt.boss', { niva: l.niva });
    return I18n.har('lekt.' + l.id) ? t('lekt.' + l.id) : (l.titel || '');
  }
  function ordklassNamn(k) { return k && I18n.har('ordklass.' + k) ? t('ordklass.' + k) : (k || ''); }
  function antalOrd(n) { return t('antalOrd', { n }); }
  function overs(o, s = sprak()) { return o[s] || o.en || o.pl || ''; }

  /** Hela stigen A1 → C2 (inklusive bosskamper), utan egna ord. */
  function stigLektioner() { return DATA.lektioner.filter(l => l.id !== 'extra' && (l.boss || ordILektion(l.id).length)); }
  function arUpplast(l) {
    if (l.id === 'extra' || l.id === EGNA) return ordILektion(l.id).length > 0;
    const stig = stigLektioner();
    const i = stig.findIndex(x => x.id === l.id);
    return i <= 0 || !!T.klara[stig[i - 1].id];
  }
  function nastaLektion() { return stigLektioner().find(l => arUpplast(l) && !T.klara[l.id]) || null; }
  function nivaKlar(n) { const l = lektion('boss-' + n.toLowerCase()); return !!(l && T.klara[l.id]); }

  function byggIndex() {
    ordPerId.clear();
    for (const o of allaOrd()) ordPerId.set(o.id, o);
  }

  async function laddaData() {
    const svar = await fetch('words.json', { cache: 'no-cache' });
    if (!svar.ok) throw new Error(t('fel.hamta', { status: svar.status }));
    const d = await svar.json();
    if (!d || !Array.isArray(d.ord) || !Array.isArray(d.lektioner)) throw new Error(t('fel.format'));
    DATA = d;
    byggIndex();
  }

  // ---------------- Märken ----------------
  // Namn och text på märkena översätts i i18n.js (marke.<id>.namn / .text).
  function marke(id, ikon, test) {
    return { id, ikon, test, get namn() { return t(`marke.${id}.namn`); }, get text() { return t(`marke.${id}.text`); } };
  }
  const MARKEN = [
    marke('forsta', '🐣', () => Object.keys(T.klara).length >= 1),
    marke('streak3', '🔥', () => aktuellStreak() >= 3),
    marke('streak7', '🌋', () => aktuellStreak() >= 7),
    marke('streak30', '☄️', () => aktuellStreak() >= 30),
    marke('xp100', '⚡', () => T.xp >= 100),
    marke('xp500', '💫', () => T.xp >= 500),
    marke('xp2000', '🌟', () => T.xp >= 2000),
    marke('felfri', '🎯', () => T.rekord.felfria >= 1),
    marke('boss', '🏰', () => T.rekord.bossar >= 1),
    ...NIVAER.map(n => ({ id: 'niva' + n.id, ikon: n.deko[0], test: () => nivaKlar(n.id),
      get namn() { return t('marke.niva.namn', { niva: n.id }); },
      get text() { return t('marke.niva.text', { niva: n.id, plats: n.plats }); } })),
    marke('ord50', '📚', () => Object.values(T.ordStat).filter(s => s.r > 0).length >= 50),
    marke('ord250', '🧠', () => Object.values(T.ordStat).filter(s => s.r > 0).length >= 250),
    marke('samlare', '✍️', () => T.egnaOrd.length >= 5),
    marke('uttal', '🎙️', () => T.rekord.uttal >= 0.9),
    marke('uggla', '🦉', () => new Date().getHours() >= 22 && dagensXp() > 0),
    marke('morgon', '🌅', () => new Date().getHours() < 7 && dagensXp() > 0)
  ];

  /** Delar ut nya märken. Returnerar listan med nya. */
  function kollaMarken({ tyst = false } = {}) {
    const nya = [];
    for (const m of MARKEN) {
      if (T.marken[m.id]) continue;
      let ok = false;
      try { ok = m.test(); } catch (e) { ok = false; }
      if (ok) { T.marken[m.id] = idag(); nya.push(m); }
    }
    if (nya.length) {
      spara();
      if (!tyst) nya.forEach((m, i) => setTimeout(() => visaToast(t('marke.toast', { ikon: m.ikon, namn: m.namn })), 400 + i * 900));
    }
    return nya;
  }

  function visaToast(text) {
    const t = h('div', { class: 'toast', role: 'status' }, text);
    document.body.appendChild(t);
    if (T.inst.ljud) Ljud.marke();
    setTimeout(() => t.classList.add('ut'), 2600);
    setTimeout(() => t.remove(), 3200);
  }

  // ---------------- Topplist/statistik i huvudet ----------------
  function uppdateraHuvud() {
    fyllHjartan();
    const s = document.getElementById('stat');
    tom(s);
    const streak = aktuellStreak();
    const idagKlar = T.sistaDag === idag();
    s.append(
      h('span', { class: 'chip streak' + (streak && idagKlar ? ' eld' : '') + (streak && !idagKlar ? ' slocknar' : ''),
        title: t(idagKlar ? 'stat.streakKlar' : 'stat.streakEj') },
        h('span', { class: 'flamma', 'aria-hidden': 'true' }, '🔥'), ' ', String(streak)),
      h('span', { class: 'chip xp', title: t('stat.xp') }, '⚡ ', String(T.xp)),
      h('span', { class: 'chip hjartan', title: T.hjartan < MAX_HJARTAN ? t('stat.nyttHjarta', { min: minTillHjarta() }) : t('stat.fullaHjartan') }, '❤️ ', String(T.hjartan))
    );
  }

  // ---------------- Vyer ----------------
  const vy = () => document.getElementById('vy');

  function visa({ behallScroll = false } = {}) {
    const [sida, del] = (location.hash.replace(/^#\/?/, '') || 'hem').split('/');
    document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('aktiv', a.dataset.sida === sida));
    uppdateraHuvud();
    // Flashcards (js/kort.js): vid språkbyte ritas passet om utan att kön tappas.
    if (sida === 'kort' && behallScroll && window.Kort.omrita(vy())) return;
    const f = { hem: visaHem, ordlista: visaOrdlista, mina: visaMina, profil: visaProfil, installningar: visaInstallningar,
      kort: rot => window.Kort.visa(rot, del) }[sida] || visaHem;
    tom(vy());
    try { f(vy()); } catch (e) { console.error(e); vy().appendChild(felruta(t('fel.nagot', { fel: e.message }))); }
    if (!behallScroll) window.scrollTo(0, 0);
  }

  function felruta(text) { return h('div', { class: 'ruta fel' }, text); }

  /** XP-stapel som fylls med animation från "fran" till "till" procent. */
  function xpStapel(fran, till, etikett) {
    const fyll = h('div', { style: { width: Math.min(100, fran) + '%' } });
    const s = h('div', { class: 'stapel xp-stapel', role: 'progressbar', 'aria-label': etikett || t('framsteg'),
      'aria-valuenow': String(Math.round(till)), 'aria-valuemin': '0', 'aria-valuemax': '100' }, fyll);
    requestAnimationFrame(() => requestAnimationFrame(() => { fyll.style.width = Math.min(100, till) + '%'; }));
    return s;
  }

  // ---- Hem: välkomst + nivåkartan ----
  function visaHem(rot) {
    const mal = Number(T.inst.dagsmal) || 30;
    const xpIdag = dagensXp();
    const andel = Math.min(100, Math.round(xpIdag / mal * 100));
    const nasta = nastaLektion();
    const tips = TIPS();
    let tipsNr = Math.floor(Math.random() * tips.length);
    const halsning = xpIdag === 0
      ? t(T.xp === 0 ? 'hem.hej' : 'hem.valkommen')
      : andel >= 100 ? t('hem.malKlart') : tips[tipsNr];
    const bosse = Figurer.pratar('bosse', halsning, 'vinka', {
      storlek: 92,
      onclick: () => { const lista = TIPS(); tipsNr = (tipsNr + 1) % lista.length; bosse.saga(lista[tipsNr], 'glad'); if (T.inst.ljud) Ljud.klick(); }
    });
    bosse.title = t('hem.bosseTitel');
    rot.appendChild(bosse);

    rot.appendChild(h('section', { class: 'ruta dagsmal' },
      h('div', { class: 'rad-mellan' },
        h('div', null, h('h2', null, t('hem.dagensMal')), h('p', { class: 'dampad' }, t('hem.xpAv', { xp: xpIdag, mal }))),
        h('div', { class: 'stor-emoji' + (andel >= 100 ? ' studs' : ''), 'aria-hidden': 'true' }, andel >= 100 ? '🏆' : '🎯')),
      xpStapel(0, andel, t('hem.dagensMal')),
      h('div', { class: 'knapprad' },
        nasta ? h('button', { type: 'button', class: 'knapp gron', onclick: () => startaLektion(nasta.id) }, t('hem.fortsatt', { titel: lektionsTitel(nasta) })) : null,
        h('button', { type: 'button', class: 'knapp bla', onclick: () => startaRepetition() }, t('hem.repetera')),
        h('span', { class: 'dampad liten' }, t('hem.repInfo')))));

    if (!Tal.finnsUppläsning || !Tal.harSvenskRost) {
      rot.appendChild(h('div', { class: 'ruta varning', id: 'rost-varning' },
        Tal.finnsUppläsning
          ? t('hem.ingenRost')
          : t('hem.ingenUppl')));
    }

    const stig = stigLektioner();
    const antalKlara = stig.filter(l => T.klara[l.id]).length;
    rot.appendChild(h('h1', { class: 'karta-rubrik' }, t('hem.resan')));
    rot.appendChild(h('p', { class: 'dampad' }, t('hem.resaInfo', { klara: antalKlara, alla: stig.length, ord: DATA.ord.length })));
    for (const n of NIVAER) {
      const lekt = stig.filter(l => l.niva === n.id);
      if (lekt.length) rot.appendChild(nivaRegion(n, lekt, nasta));
    }

    const egna = [];
    const extra = lektion('extra');
    if (extra) egna.push(extra);
    egna.push({ id: EGNA, titel: 'Mina ord', emoji: '✍️' });
    rot.appendChild(h('h2', { class: 'niva-rubrik egna' }, t('hem.egnaOrd')));
    const el = h('div', { class: 'stig' });
    egna.forEach((l, i) => el.appendChild(lektionsNod(l, i)));
    rot.appendChild(el);
  }

  /** En nivå på kartan: en slingrande stig med lektionerna som stopp. */
  function nivaRegion(n, lekt, nasta) {
    const RAD = 118;
    const hojd = lekt.length * RAD + 40;
    const punkter = lekt.map((l, i) => ({ x: 50 + 30 * Math.sin(i * 1.05 + NIVAER.indexOf(n) * 0.7), y: 60 + i * RAD }));
    let d = `M ${punkter[0].x} ${punkter[0].y}`;
    for (let i = 1; i < punkter.length; i++) {
      const a = punkter[i - 1], b = punkter[i];
      d += ` C ${a.x} ${a.y + RAD / 2}, ${b.x} ${b.y - RAD / 2}, ${b.x} ${b.y}`;
    }
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 100 ${hojd}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('class', 'karta-stig');
    svg.setAttribute('aria-hidden', 'true');
    for (const [klass, bredd] of [['stig-kant', 26], ['stig-yta', 18], ['stig-streck', 3]]) {
      const p = document.createElementNS(svgNS, 'path');
      p.setAttribute('d', d);
      p.setAttribute('class', klass);
      p.setAttribute('stroke-width', String(bredd));
      p.setAttribute('vector-effect', 'non-scaling-stroke');
      svg.appendChild(p);
    }
    const karta = h('div', { class: 'karta', style: { height: hojd + 'px' } }, svg);
    lekt.forEach((l, i) => {
      const p = punkter[i];
      const upplast = arUpplast(l);
      const klar = T.klara[l.id];
      const nu = nasta && nasta.id === l.id;
      const stj = klar ? (klar.stjarnor || 1) : 0;
      const knapp = h('button', {
        type: 'button',
        class: 'stopp' + (l.boss ? ' boss' : '') + (upplast ? '' : ' last') + (klar ? ' klar' : '') + (nu ? ' nu' : ''),
        style: { left: p.x + '%', top: p.y + 'px' },
        disabled: !upplast,
        'aria-label': `${lektionsTitel(l)}${l.boss ? t('karta.bosskamp') : ''}, ${antalOrd(ordILektion(l.id).length)}${upplast ? '' : t('karta.last')}${klar ? t('karta.klarStj', { n: stj }) : ''}`,
        onclick: () => startaLektion(l.id)
      },
      h('span', { class: 'stopp-cirkel', 'aria-hidden': 'true' }, upplast ? (klar && !l.boss ? '✔' : (l.emoji || '📘')) : '🔒'),
      h('span', { class: 'stopp-namn' }, lektionsTitel(l),
        klar ? h('span', { class: 'stjarnor' }, '★'.repeat(stj) + '☆'.repeat(3 - stj)) : null));
      karta.appendChild(knapp);
      if (nu) {
        const pa = p.x > 50 ? 'vanster' : 'hoger';
        const mark = h('div', { class: 'du-ar-har ' + pa, style: { top: (p.y - 70) + 'px', left: (p.x > 50 ? p.x - 36 : p.x + 13) + '%' } },
          Figurer.figur('bosse', 'vinka', { storlek: 58 }), h('span', null, t('karta.duArHar')));
        karta.appendChild(mark);
      }
      // Dekoration på motsatt sida om stigen.
      const deko = n.deko[i % n.deko.length];
      karta.appendChild(h('span', { class: 'deko', 'aria-hidden': 'true', style: { left: (p.x > 50 ? 8 + (i % 3) * 5 : 80 - (i % 3) * 5) + '%', top: (p.y - 10 + (i % 2) * 24) + 'px' } }, deko));
    });

    const forsta = lekt[0];
    const lastNiva = !arUpplast(forsta);
    const index = NIVAER.indexOf(n);
    const huvud = h('div', { class: 'region-huvud' },
      h('span', { class: 'niva-bricka' }, n.id),
      h('div', null, h('h2', null, n.plats), h('span', { class: 'dampad liten' }, t('karta.lektionerBoss', { namn: n.namn, n: lekt.filter(l => !l.boss).length }))),
      nivaKlar(n.id) ? h('span', { class: 'region-klar', title: t('karta.nivaKlar') }, '🏅') : null);
    if (lastNiva && index > 0) {
      huvud.appendChild(h('button', { type: 'button', class: 'knapp liten', title: t('karta.hoppaTitel'),
        onclick: () => startaLektion('boss-' + NIVAER[index - 1].id.toLowerCase(), { hopp: true }) }, t('karta.hoppa')));
    }
    return h('section', { class: `region region-${n.id.toLowerCase()}` + (lastNiva ? ' region-last' : '') }, huvud, karta);
  }

  function lektionsNod(l, i) {
    const upplast = arUpplast(l);
    const klar = T.klara[l.id];
    const antal = ordILektion(l.id).length;
    const stjarnor = klar ? '★'.repeat(klar.stjarnor || 1) + '☆'.repeat(3 - (klar.stjarnor || 1)) : '';
    return h('button', {
      type: 'button',
      class: 'nod' + (upplast ? '' : ' last') + (klar ? ' klar' : '') + (i % 2 ? ' hoger' : ''),
      disabled: !upplast,
      'aria-label': `${lektionsTitel(l)}, ${antalOrd(antal)}${upplast ? '' : t('karta.last')}${klar ? t('nod.klar') : ''}`,
      onclick: () => startaLektion(l.id)
    },
    h('span', { class: 'nod-cirkel', 'aria-hidden': 'true' }, upplast ? (l.emoji || '📘') : '🔒'),
    h('span', { class: 'nod-text' },
      h('b', null, lektionsTitel(l)),
      h('small', null, antal ? antalOrd(antal) : t(l.id === EGNA ? 'nod.laggTill' : 'nod.ingaOrd')),
      stjarnor ? h('small', { class: 'stjarnor' }, stjarnor + (klar.ggr > 1 ? `  ×${klar.ggr}` : '')) : null));
  }

  // ---- Profil: statistik, XP-veckan och märken ----
  function visaProfil(rot) {
    const ordRatt = Object.values(T.ordStat).filter(s => s.r > 0).length;
    const klara = stigLektioner().filter(l => T.klara[l.id]).length;
    rot.appendChild(h('h1', null, t('profil.rubrik')));
    rot.appendChild(h('div', { class: 'statrutor' },
      h('div', { class: 'statruta' }, h('span', { class: 'flamma-stor' + (aktuellStreak() ? ' eld' : '') }, '🔥'), h('b', null, String(aktuellStreak())), h('small', null, t('profil.dagar'))),
      h('div', { class: 'statruta' }, h('span', null, '⚡'), h('b', null, String(T.xp)), h('small', null, t('profil.xp'))),
      h('div', { class: 'statruta' }, h('span', null, '📚'), h('b', null, String(ordRatt)), h('small', null, t('profil.ordKan'))),
      h('div', { class: 'statruta' }, h('span', null, '🗺️'), h('b', null, `${klara}`), h('small', null, t('profil.stopp')))));

    // XP de senaste 7 dagarna
    const dagar = [];
    for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); dagar.push(d); }
    const varden = dagar.map(d => T.xpHist[idag(d)] || 0);
    const max = Math.max(Number(T.inst.dagsmal) || 30, ...varden);
    const namn = I18n.lista('dagar.kort');
    const staplar = h('div', { class: 'veckostaplar', role: 'img', 'aria-label': t('profil.xpVeckaAria', { v: varden.join(', ') }) });
    dagar.forEach((d, i) => {
      const fyll = h('div', { class: 'vstapel-fyll' + (varden[i] >= (Number(T.inst.dagsmal) || 30) ? ' mal' : ''), style: { height: '0%' } });
      staplar.appendChild(h('div', { class: 'vstapel' }, h('small', null, String(varden[i])), h('div', { class: 'vstapel-ram' }, fyll), h('small', null, namn[d.getDay()])));
      requestAnimationFrame(() => requestAnimationFrame(() => { fyll.style.height = Math.round(varden[i] / max * 100) + '%'; }));
    });
    rot.appendChild(h('section', { class: 'ruta' }, h('h2', null, t('profil.xpVecka')), staplar,
      h('p', { class: 'dampad liten' }, t('profil.gronStapel', { mal: Number(T.inst.dagsmal) || 30 }))));

    const antal = MARKEN.filter(m => T.marken[m.id]).length;
    const galler = h('div', { class: 'marken' });
    for (const m of MARKEN) {
      const har = T.marken[m.id];
      galler.appendChild(h('div', { class: 'marke' + (har ? ' har' : ''), title: m.text },
        h('span', { class: 'marke-ikon', 'aria-hidden': 'true' }, har ? m.ikon : '🔒'),
        h('b', null, m.namn), h('small', null, har ? t('profil.tog', { datum: har }) : m.text)));
    }
    rot.appendChild(h('section', { class: 'ruta' }, h('h2', null, t('profil.marken', { n: antal, alla: MARKEN.length })), galler));

    rot.appendChild(h('section', { class: 'ruta figurgalleri' },
      h('h2', null, t('profil.reskamrater')),
      h('div', { class: 'figurer-rad' },
        ...['bosse', 'ella', 'lo'].map(v => h('div', { class: 'figurkort' }, Figurer.figur(v, 'glad', { storlek: 80 }), h('b', null, Figurer.NAMN[v]),
          h('small', { class: 'dampad' }, t(`fig.${v}.om`)))))));
  }

  // ---- Ordlista ----
  // Sökningen överlever ett språkbyte (vyn ritas om).
  const ordlistaVal = { q: '', lektion: '' };
  function visaOrdlista(rot) {
    const sok = h('input', { type: 'search', class: 'falt', placeholder: t('ordlista.sok'), 'aria-label': t('ordlista.sokAria'), value: ordlistaVal.q });
    const filter = h('select', { class: 'falt', 'aria-label': t('ordlista.valjLektion') },
      h('option', { value: '' }, t('ordlista.alla')),
      ...DATA.lektioner.map(l => h('option', { value: l.id, selected: ordlistaVal.lektion === l.id }, `${l.emoji || ''} ${lektionsTitel(l)}`)),
      h('option', { value: EGNA, selected: ordlistaVal.lektion === EGNA }, '✍️ ' + t('lekt.mina')));
    const lista = h('div', { class: 'ordlista' });
    const rakn = h('p', { class: 'dampad liten' });
    function rita() {
      ordlistaVal.q = sok.value; ordlistaVal.lektion = filter.value;
      const q = nyckel(sok.value);
      const traff = allaOrd().filter(o => (!filter.value || o.lektion === filter.value) &&
        (!q || [o.sv, o.en, o.pl].some(t => nyckel(t).includes(q))));
      tom(lista);
      rakn.textContent = antalOrd(traff.length);
      for (const o of traff.slice(0, 500)) {
        lista.appendChild(h('div', { class: 'ordrad', role: 'button', tabindex: '0',
          onclick: () => visaOrdkort(o), onkeydown: ev => { if (ev.key === 'Enter') visaOrdkort(o); } },
          hogtalare(o.sv, { liten: true }),
          h('div', { class: 'ordrad-text' },
            h('b', { lang: 'sv' }, o.sv),
            h('span', { class: 'dampad' }, ...oversSpann(o))),
          h('span', { class: 'ordklass' }, ordklassNamn(o.ordklass))));
      }
    }
    sok.addEventListener('input', rita);
    filter.addEventListener('change', rita);
    rot.append(h('h1', null, t('ordlista.rubrik')), h('div', { class: 'sokrad' }, sok, filter), rakn, lista);
    rita();
  }

  /** Översättningarna av ett ord som spann (en, pl eller båda) med " · " emellan. */
  function oversSpann(o) {
    const ut = [];
    visadeSprak().forEach((s, i) => { if (i) ut.push(' · '); ut.push(h('span', { lang: s }, o[s] || '')); });
    return ut;
  }

  // Dialogen ritas om vid språkbyte med den här funktionen (null = stängd).
  let dlgOmrita = null;

  // ---- Ordkort (modal) med uppläsning och inspelning ----
  function visaOrdkort(o) {
    const dlg = document.getElementById('ordkort');
    dlgOmrita = () => visaOrdkort(o);
    const inne = tom(dlg.querySelector('.dlg-inne'));
    inne.append(
      h('div', { class: 'rad-mellan' },
        h('span', { class: 'ordklass' }, ordklassNamn(o.ordklass)),
        h('button', { type: 'button', class: 'stang', 'aria-label': t('stang'), onclick: () => stangDialog(dlg) }, '×')),
      h('div', { class: 'kort-ord', lang: 'sv' }, o.sv),
      h('div', { class: 'knapprad centrerad' }, hogtalare(o.sv), hogtalare(o.sv, { langsam: true })),
      h('div', { class: 'overs-par' },
        ...visadeSprak().map(s => h('div', null, SPRAK[s].flagga + ' ', h('span', { lang: s }, o[s])))));
    if (o.ex && o.ex.sv) {
      inne.appendChild(h('div', { class: 'exempel' },
        h('div', { class: 'rad-mellan' }, h('b', { lang: 'sv' }, o.ex.sv),
          h('span', { class: 'knapprad' }, hogtalare(o.ex.sv, { liten: true }), hogtalare(o.ex.sv, { liten: true, langsam: true }))),
        ...visadeSprak().map(s => o.ex[s] ? h('div', { class: 'dampad', lang: s }, SPRAK[s].flagga + ' ' + o.ex[s]) : null)));
    }
    inne.appendChild(h('h3', null, t('ordkort.ovaUttal')));
    inne.appendChild(uttalsPanel(o.sv));
    if (o.ex && o.ex.sv) {
      inne.appendChild(h('details', { class: 'mer' }, h('summary', null, t('ordkort.ovaMening')), uttalsPanel(o.ex.sv)));
    }
    oppnaDialog(dlg);
  }

  function oppnaDialog(dlg) {
    if (typeof dlg.showModal === 'function') { if (!dlg.open) dlg.showModal(); }
    else dlg.setAttribute('open', '');
  }
  function stangDialog(dlg) {
    Tal.tyst();
    dlgOmrita = null;
    if (typeof dlg.close === 'function' && dlg.open) dlg.close(); else dlg.removeAttribute('open');
  }

  /**
   * Uttalspanel: förlaga (normal/långsam), spela in dig själv, lyssna jämsides,
   * och automatisk uttalskontroll där SpeechRecognition finns.
   * onResultat(poang 0..1 | null, hordText) anropas efter kontroll/självbedömning.
   */
  function uttalsPanel(text, { onResultat } = {}) {
    const status = h('div', { class: 'uttal-status', 'aria-live': 'polite' });
    const spelare = h('audio', { controls: true, class: 'min-inspelning', hidden: true });
    let inspelning = null;
    let minUrl = null;

    const inspelKnapp = h('button', { type: 'button', class: 'knapp rod' }, t('uttal.spelaIn'));
    const jamforKnapp = h('button', { type: 'button', class: 'knapp', disabled: true }, t('uttal.jamfor'));

    inspelKnapp.addEventListener('click', async () => {
      if (inspelning) {
        inspelKnapp.disabled = true;
        try {
          const { url } = await inspelning.stoppa();
          if (minUrl) URL.revokeObjectURL(minUrl);
          minUrl = url;
          spelare.src = url;
          spelare.hidden = false;
          jamforKnapp.disabled = false;
          status.textContent = t('uttal.lyssnaDig');
          if (!Tal.kanKanna() && onResultat) visaSjalvbedomning();
        } catch (e) {
          status.textContent = e.message;
        } finally {
          inspelning = null;
          inspelKnapp.disabled = false;
          inspelKnapp.textContent = t('uttal.spelaInIgen');
          inspelKnapp.classList.remove('pagar');
        }
        return;
      }
      try {
        Tal.tyst();
        inspelning = await Tal.spelaIn();
        inspelKnapp.textContent = t('uttal.stoppa');
        inspelKnapp.classList.add('pagar');
        status.textContent = t('uttal.spelarIn');
        inspelning.klar.then(() => {
          if (inspelning) { inspelning = null; inspelKnapp.textContent = t('uttal.spelaInIgen'); inspelKnapp.classList.remove('pagar'); }
        });
      } catch (e) {
        inspelning = null;
        status.textContent = e.message;
      }
    });

    jamforKnapp.addEventListener('click', async () => {
      if (!minUrl) return;
      status.textContent = t('uttal.forlagan');
      await Tal.saga(text);
      status.textContent = t('uttal.du');
      try {
        spelare.currentTime = 0;
        await spelare.play();
        await new Promise(r => { spelare.onended = r; setTimeout(r, 16000); });
      } catch (e) { /* uppspelning avbruten */ }
      status.textContent = t('uttal.latDet');
    });

    const sjalv = h('div', { class: 'knapprad', hidden: true });
    function visaSjalvbedomning() {
      tom(sjalv);
      sjalv.hidden = false;
      sjalv.append(
        h('span', { class: 'dampad liten' }, t('uttal.hurLat')),
        h('button', { type: 'button', class: 'knapp gron liten', onclick: () => onResultat(1, null) }, t('uttal.latRatt')),
        h('button', { type: 'button', class: 'knapp liten', onclick: () => onResultat(0.5, null) }, t('uttal.ovaMer')));
    }

    const delar = [
      h('div', { class: 'knapprad' },
        h('button', { type: 'button', class: 'knapp bla', onclick: () => Tal.saga(text) }, t('uttal.forlaga')),
        h('button', { type: 'button', class: 'knapp', onclick: () => Tal.saga(text, { langsam: true }) }, t('uttal.langsamt'))),
      h('div', { class: 'knapprad' }, inspelKnapp, jamforKnapp)
    ];
    if (!Tal.kanSpelaIn()) {
      inspelKnapp.disabled = true;
      delar.push(h('p', { class: 'dampad liten' }, t('uttal.ingenInspelning')));
    }
    delar.push(spelare);

    if (Tal.kanKanna()) {
      const kontroll = h('button', { type: 'button', class: 'knapp gron' }, t('uttal.kontroll'));
      kontroll.addEventListener('click', async () => {
        kontroll.disabled = true;
        Tal.tyst();
        status.textContent = t('uttal.lyssnar', { text });
        try {
          const res = await Tal.kanna({ lang: 'sv-SE' });
          const p = Tal.likhet(text, res.alternativ);
          const procent = Math.round(p * 100);
          if (p > (T.rekord.uttal || 0)) { T.rekord.uttal = p; spara(); kollaMarken(); }
          if (T.inst.ljud) { if (p >= 0.85) Ljud.ratt(); else if (p < 0.6) Ljud.fel(); }
          const dom = t(p >= 0.85 ? 'uttal.utmarkt' : p >= 0.6 ? 'uttal.nastan' : 'uttal.inteRiktigt');
          status.textContent = t('uttal.hordes', { text: res.text, procent, dom });
          status.className = 'uttal-status ' + (p >= 0.85 ? 'bra' : p >= 0.6 ? 'mellan' : 'daligt');
          if (onResultat) onResultat(p, res.text);
        } catch (e) {
          status.textContent = e.message;
          status.className = 'uttal-status';
        } finally {
          kontroll.disabled = false;
        }
      });
      delar.push(h('div', { class: 'knapprad' }, kontroll));
    } else {
      delar.push(h('p', { class: 'dampad liten' }, t('uttal.ingenKontroll')));
      if (onResultat && !Tal.kanSpelaIn()) visaSjalvbedomning();
    }
    delar.push(sjalv, status);
    return h('div', { class: 'uttal' }, ...delar);
  }

  // ---- Mina ord ----
  function visaMina(rot) {
    rot.appendChild(h('h1', null, t('mina.rubrik')));
    rot.appendChild(h('p', { class: 'dampad' }, t('mina.info')));

    const f = {
      sv: h('input', { class: 'falt', required: true, maxlength: '60', lang: 'sv', autocomplete: 'off' }),
      en: h('input', { class: 'falt', required: true, maxlength: '200', lang: 'en', autocomplete: 'off' }),
      pl: h('input', { class: 'falt', required: true, maxlength: '200', lang: 'pl', autocomplete: 'off' }),
      ordklass: h('select', { class: 'falt' }, ...ORDKLASSER.map(k => h('option', { value: k }, ordklassNamn(k)))),
      niva: h('select', { class: 'falt' }, ...NIVAER.map(n => h('option', { value: n.id }, `${n.id} – ${n.namn}`))),
      exsv: h('input', { class: 'falt', maxlength: '200', lang: 'sv', autocomplete: 'off' }),
      exen: h('input', { class: 'falt', maxlength: '200', lang: 'en', autocomplete: 'off' }),
      expl: h('input', { class: 'falt', maxlength: '200', lang: 'pl', autocomplete: 'off' })
    };
    const meddelande = h('div', { class: 'meddelande', 'aria-live': 'polite' });
    const etikett = (text, el) => h('label', { class: 'etikett' }, h('span', null, text), el);
    const form = h('form', { class: 'ruta formular', novalidate: true },
      h('h2', null, t('mina.laggTillRubrik')),
      etikett(t('mina.svenska'), f.sv), etikett(t('mina.engelska'), f.en), etikett(t('mina.polska'), f.pl),
      h('div', { class: 'tva-kol' }, etikett(t('mina.ordklass'), f.ordklass), etikett(t('mina.niva'), f.niva)),
      h('details', null, h('summary', null, t('mina.exempel')),
        etikett(t('mina.exSv'), f.exsv), etikett(t('mina.exEn'), f.exen), etikett(t('mina.exPl'), f.expl)),
      h('div', { class: 'knapprad' }, h('button', { type: 'submit', class: 'knapp gron' }, t('mina.laggTill'))),
      meddelande);
    form.addEventListener('submit', ev => {
      ev.preventDefault();
      const ord = {
        sv: f.sv.value.trim().replace(/\s+/g, ' '), en: f.en.value.trim(), pl: f.pl.value.trim(),
        ordklass: f.ordklass.value, niva: f.niva.value, lektion: EGNA
      };
      if (f.exsv.value.trim()) {
        ord.ex = { sv: f.exsv.value.trim() };
        if (f.exen.value.trim()) ord.ex.en = f.exen.value.trim();
        if (f.expl.value.trim()) ord.ex.pl = f.expl.value.trim();
      }
      const fel = valideraEgetOrd(ord);
      meddelande.className = 'meddelande ' + (fel ? 'fel' : 'ok');
      if (fel) { meddelande.textContent = fel; return; }
      ord.id = 'mina-' + slug(ord.sv) + '-' + Date.now().toString(36);
      T.egnaOrd.push(ord);
      spara();
      byggIndex();
      meddelande.textContent = t('mina.tillagt', { sv: ord.sv });
      if (T.inst.ljud) Ljud.ratt();
      kollaMarken();
      form.reset();
      ritaLista();
      f.sv.focus();
    });
    rot.appendChild(form);

    const lista = h('div', { class: 'ordlista' });
    function ritaLista() {
      tom(lista);
      if (!T.egnaOrd.length) { lista.appendChild(h('p', { class: 'dampad' }, t('mina.inga'))); return; }
      T.egnaOrd.slice().reverse().forEach(o => {
        lista.appendChild(h('div', { class: 'ordrad' },
          hogtalare(o.sv, { liten: true }),
          h('div', { class: 'ordrad-text', role: 'button', tabindex: '0', onclick: () => visaOrdkort(o) },
            h('b', { lang: 'sv' }, o.sv), h('span', { class: 'dampad' }, ...oversSpann(o))),
          h('button', { type: 'button', class: 'ikon-knapp', 'aria-label': t('mina.taBort', { sv: o.sv }), onclick: () => {
            if (!window.confirm(t('mina.taBortFraga', { sv: o.sv }))) return;
            T.egnaOrd = T.egnaOrd.filter(x => x.id !== o.id);
            spara(); byggIndex(); ritaLista();
          } }, '🗑️')));
      });
    }
    rot.append(
      h('div', { class: 'rad-mellan' }, h('h2', null, t('mina.dina')),
        h('button', { type: 'button', class: 'knapp bla liten', onclick: () => startaLektion(EGNA) }, t('mina.ova'))),
      lista);
    ritaLista();

    // Export / import
    const filval = h('input', { type: 'file', accept: 'application/json,.json', hidden: true });
    const impMedd = h('div', { class: 'meddelande', 'aria-live': 'polite' });
    filval.addEventListener('change', async () => {
      const fil = filval.files && filval.files[0];
      if (!fil) return;
      try {
        if (fil.size > 2 * 1024 * 1024) throw new Error(t('mina.forStor'));
        const d = JSON.parse(await fil.text());
        const inkommande = Array.isArray(d) ? d : (Array.isArray(d.ord) ? d.ord : null);
        if (!inkommande) throw new Error(t('mina.ingenLista'));
        let nya = 0, hoppade = 0;
        for (const x of inkommande) {
          const ord = {
            sv: String(x.sv || '').trim(), en: String(x.en || '').trim(), pl: String(x.pl || '').trim(),
            ordklass: ORDKLASSER.includes(x.ordklass) ? x.ordklass : 'substantiv',
            niva: NIVAER.some(n => n.id === x.niva) ? x.niva : 'A1', lektion: EGNA
          };
          if (x.ex && x.ex.sv) ord.ex = { sv: String(x.ex.sv).trim(), en: x.ex.en ? String(x.ex.en).trim() : undefined, pl: x.ex.pl ? String(x.ex.pl).trim() : undefined };
          if (valideraEgetOrd(ord)) { hoppade++; continue; }
          ord.id = 'mina-' + slug(ord.sv) + '-' + Date.now().toString(36) + nya;
          T.egnaOrd.push(ord); nya++;
        }
        spara(); byggIndex(); ritaLista();
        impMedd.className = 'meddelande ok';
        impMedd.textContent = t('mina.importerade', { n: nya }) + (hoppade ? t('mina.hoppade', { n: hoppade }) : '') + '.';
      } catch (e) {
        impMedd.className = 'meddelande fel';
        impMedd.textContent = t('mina.importFel', { fel: e.message });
      } finally { filval.value = ''; }
    });
    rot.appendChild(h('section', { class: 'ruta' },
      h('h2', null, t('mina.exportRubrik')),
      h('p', { class: 'dampad liten' }, t('mina.exportInfo')),
      h('div', { class: 'knapprad' },
        h('button', { type: 'button', class: 'knapp', onclick: exportera }, t('mina.exportera')),
        h('button', { type: 'button', class: 'knapp', onclick: () => filval.click() }, t('mina.importera')),
        filval),
      impMedd));

    rot.appendChild(githubRuta());
  }

  function valideraEgetOrd(o) {
    if (!o.sv || !o.en || !o.pl) return t('val.fyllI');
    if (o.sv.length > 60) return t('val.forLangt');
    for (const v of [o.sv, o.en, o.pl, o.ex && o.ex.sv, o.ex && o.ex.en, o.ex && o.ex.pl]) {
      if (v && /[<>]/.test(v)) return t('val.tecken');
      if (v && v.length > 200) return t('val.textForLang');
    }
    if (allaOrd().some(x => nyckel(x.sv) === nyckel(o.sv))) return t('val.finns', { sv: o.sv });
    return null;
  }

  function exportera() {
    try {
      const data = { app: 'Svenska Ord', exporterad: new Date().toISOString(), ord: T.egnaOrd.map(({ id, ...rest }) => rest) };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = h('a', { href: url, download: `mina-svenska-ord-${idag()}.json` });
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) { window.alert(t('mina.exportFel', { fel: e.message })); }
  }

  // ---- Spara till GitHub (token stannar i den här webbläsaren) ----
  function lasToken() { try { return window.localStorage.getItem(TOKEN_NYCKEL) || ''; } catch (e) { return ''; } }
  function skrivToken(t) {
    try { if (t) window.localStorage.setItem(TOKEN_NYCKEL, t); else window.localStorage.removeItem(TOKEN_NYCKEL); return true; }
    catch (e) { return false; }
  }

  function b64TillText(b64) {
    const bin = atob(String(b64).replace(/\s/g, ''));
    const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
  }
  function textTillB64(text) {
    const bytes = new TextEncoder().encode(text);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }

  /** Samma format som verktyg/ordfil.js (ett ord per rad). */
  function serialisera(data) {
    return '{\n' +
      `  "version": ${JSON.stringify(data.version || 1)},\n` +
      `  "uppdaterad": ${JSON.stringify(data.uppdaterad)},\n` +
      '  "lektioner": [\n' + data.lektioner.map(l => '    ' + JSON.stringify(l)).join(',\n') + '\n  ],\n' +
      '  "ord": [\n' + data.ord.map(o => '    ' + JSON.stringify(o)).join(',\n') + '\n  ]\n}\n';
  }

  async function sparaTillGithub(repo, token, logg) {
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error(t('gh.repoFormat'));
    if (!/^(gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})$/.test(token)) throw new Error(t('gh.ejToken'));
    if (!T.egnaOrd.length) throw new Error(t('gh.ingaOrd'));
    const url = `https://api.github.com/repos/${repo}/contents/words.json`;
    const huvuden = { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    for (let forsok = 1; forsok <= 2; forsok++) {
      logg(t('gh.hamtar'));
      const svar = await fetch(url + '?t=' + Date.now(), { headers: huvuden, cache: 'no-store' });
      if (svar.status === 401) throw new Error(t('gh.401'));
      if (svar.status === 404) throw new Error(t('gh.404'));
      if (!svar.ok) throw new Error(t('gh.svarade', { status: svar.status }));
      const fil = await svar.json();
      const data = JSON.parse(b64TillText(fil.content));
      if (!Array.isArray(data.ord) || !Array.isArray(data.lektioner)) throw new Error(t('gh.felFormat'));
      if (!data.lektioner.some(l => l.id === 'extra')) data.lektioner.push({ id: 'extra', titel: 'Tillagda ord', emoji: '➕', niva: 'egna' });
      const finns = new Set(data.ord.map(o => nyckel(o.sv)));
      const ids = new Set(data.ord.map(o => o.id));
      const nya = [];
      for (const o of T.egnaOrd) {
        if (finns.has(nyckel(o.sv))) continue;
        let id = slug(o.sv), i = 2;
        while (ids.has(id)) id = slug(o.sv) + '-' + (i++);
        ids.add(id); finns.add(nyckel(o.sv));
        const ny = { id, sv: o.sv, en: o.en, pl: o.pl, ordklass: o.ordklass, lektion: 'extra', niva: NIVAER.some(n => n.id === o.niva) ? o.niva : 'A1' };
        if (o.ex && o.ex.sv) ny.ex = JSON.parse(JSON.stringify(o.ex));
        nya.push(ny);
      }
      if (!nya.length) return { antal: 0 };
      data.ord.push(...nya);
      data.uppdaterad = new Date().toISOString();
      logg(t('gh.sparar', { n: nya.length }));
      const put = await fetch(url, {
        method: 'PUT',
        headers: Object.assign({ 'Content-Type': 'application/json' }, huvuden),
        body: JSON.stringify({
          message: `Nya ord från sajten: ${nya.map(o => o.sv).join(', ').slice(0, 200)}`,
          content: textTillB64(serialisera(data)),
          sha: fil.sha
        })
      });
      if (put.status === 409 && forsok === 1) { logg(t('gh.igen')); continue; }
      if (put.status === 403 || put.status === 404) throw new Error(t('gh.skrivratt'));
      if (!put.ok) throw new Error(t('gh.svaradeSpara', { status: put.status }));
      return { antal: nya.length, ord: nya };
    }
    throw new Error(t('gh.tvaForsok'));
  }

  function githubRuta() {
    const repo = h('input', { class: 'falt', value: T.inst.repo || STANDARD_REPO, autocomplete: 'off', spellcheck: false, 'aria-label': t('gh.repo') });
    const token = h('input', { class: 'falt', type: 'password', placeholder: lasToken() ? t('gh.sparadHar') : 'github_pat_…', autocomplete: 'off', spellcheck: false, 'aria-label': t('gh.tokenAria') });
    const logg = h('div', { class: 'meddelande', 'aria-live': 'polite' });
    const knapp = h('button', { type: 'button', class: 'knapp gron' }, t('gh.knapp'));
    knapp.addEventListener('click', async () => {
      const t = token.value.trim() || lasToken();
      if (!t) { logg.className = 'meddelande fel'; logg.textContent = t('gh.klistra'); return; }
      knapp.disabled = true;
      logg.className = 'meddelande';
      try {
        T.inst.repo = repo.value.trim(); spara();
        const res = await sparaTillGithub(T.inst.repo, t, m => { logg.textContent = m; });
        if (token.value.trim()) { skrivToken(t); token.value = ''; token.placeholder = t('gh.sparadHar'); }
        logg.className = 'meddelande ok';
        logg.textContent = res.antal
          ? t('gh.klart', { n: res.antal })
          : t('gh.allaFinns');
      } catch (e) {
        logg.className = 'meddelande fel';
        logg.textContent = e.message;
      } finally { knapp.disabled = false; }
    });
    return h('section', { class: 'ruta' },
      h('h2', null, t('gh.rubrik')),
      h('p', { class: 'dampad liten' },
        t('gh.info1'),
        h('a', { href: 'https://github.com/settings/personal-access-tokens/new', target: '_blank', rel: 'noopener' }, 'fine-grained token'),
        t('gh.info2')),
      h('label', { class: 'etikett' }, h('span', null, t('gh.repo')), repo),
      h('label', { class: 'etikett' }, h('span', null, t('gh.token')), token),
      h('div', { class: 'knapprad' }, knapp,
        h('button', { type: 'button', class: 'knapp liten', onclick: () => {
          skrivToken(''); token.value = ''; token.placeholder = 'github_pat_…';
          logg.className = 'meddelande ok'; logg.textContent = t('gh.borttagen');
        } }, t('gh.glom'))),
      logg);
  }

  // ---- Inställningar ----
  function visaInstallningar(rot) {
    rot.appendChild(h('h1', null, t('inst.rubrik')));
    const sprakVal = h('div', { class: 'segment', role: 'radiogroup', 'aria-label': t('inst.oversAria') },
      ...['en', 'pl'].map(s => h('button', {
        type: 'button', role: 'radio', 'aria-checked': String(sprak() === s), class: sprak() === s ? 'vald' : '',
        onclick: () => { T.inst.sprak = s; spara(); visa(); }
      }, `${SPRAK[s].flagga} ${SPRAK[s].namn}`)));

    const rostVal = h('select', { class: 'falt', 'aria-label': t('inst.svenskRost') });
    function fyllRoster() {
      tom(rostVal);
      const r = Tal.roster;
      if (!r.length) rostVal.appendChild(h('option', { value: '' }, t('inst.ingenRost')));
      r.forEach(x => rostVal.appendChild(h('option', { value: x.voiceURI, selected: Tal.valdRost && Tal.valdRost.voiceURI === x.voiceURI },
        `${x.name} (${x.lang})`)));
    }
    fyllRoster();
    Tal.narRosterAndras(fyllRoster);
    rostVal.addEventListener('change', () => { T.inst.rost = rostVal.value; Tal.setRost(rostVal.value); spara(); Tal.saga('Hej! Välkommen till Svenska Ord.'); });

    const hast = h('input', { type: 'range', min: '0.5', max: '1.3', step: '0.05', value: String(T.inst.hastighet), 'aria-label': t('inst.talhastighet') });
    hast.addEventListener('change', () => { T.inst.hastighet = Number(hast.value); Tal.setHastighet(hast.value); spara(); Tal.saga('Så här snabbt pratar jag.'); });

    const kryss = (namn, text) => {
      const c = h('input', { type: 'checkbox', checked: !!T.inst[namn] });
      c.addEventListener('change', () => {
        T.inst[namn] = c.checked; spara();
        if (namn === 'ljud') { Ljud.setPa(c.checked); if (c.checked) Ljud.ratt(); }
      });
      return h('label', { class: 'kryss' }, c, h('span', null, text));
    };
    const mal = h('select', { class: 'falt', 'aria-label': t('inst.dagsmal') },
      ...[10, 30, 60, 100].map(v => h('option', { value: String(v), selected: Number(T.inst.dagsmal) === v }, t('inst.mal' + v))));
    mal.addEventListener('change', () => { T.inst.dagsmal = Number(mal.value); spara(); });

    rot.append(
      h('section', { class: 'ruta' }, h('h2', null, t('inst.sidansSprak')), I18n.knapp({ klass: 'stor' }),
        h('p', { class: 'dampad liten' }, t('inst.sprakInfo'))),
      // Översättningsspråket väljs bara i svenskt gränssnitt – annars följer det sidans språk.
      I18n.sprak === 'sv' ? h('section', { class: 'ruta' }, h('h2', null, t('inst.oversattTill')), sprakVal) : null,
      h('section', { class: 'ruta' }, h('h2', null, t('inst.uppl')),
        h('label', { class: 'etikett' }, h('span', null, t('inst.svenskRost')), rostVal),
        h('label', { class: 'etikett' }, h('span', null, t('inst.hastighet')), hast),
        h('div', { class: 'knapprad' }, h('button', { type: 'button', class: 'knapp bla', onclick: () => Tal.saga('Hej! Hur mår du i dag?') }, t('inst.testa'))),
        kryss('autoljud', t('inst.autoljud')),
        kryss('uttal', t('inst.uttal')),
        kryss('ljud', t('inst.ljud'))),
      h('section', { class: 'ruta' }, h('h2', null, t('inst.dagsmal')), mal),
      h('section', { class: 'ruta' }, h('h2', null, t('inst.framsteg')),
        h('p', { class: 'dampad liten' }, t('inst.sparasBara')),
        h('button', { type: 'button', class: 'knapp rod', onclick: () => {
          if (!window.confirm(t('inst.nollstallFraga'))) return;
          const behall = { egnaOrd: T.egnaOrd, inst: T.inst };
          T = Object.assign(nyttTillstand(), behall);
          spara(); visa();
        } }, t('inst.nollstall'))),
      h('p', { class: 'dampad liten centrerad' }, t('inst.fot'), h('a', { href: 'https://github.com/' + STANDARD_REPO, target: '_blank', rel: 'noopener' }, t('inst.kallkod'))));
  }

  // ================= Lektionsmotorn =================
  let S = null; // aktiv session

  function valjOrd(lista, n) {
    // Nya och svaga ord först, sedan slump.
    const vikt = o => { const s = T.ordStat[o.id]; return s ? (s.f * 2 - s.r + Math.random() * 2) : 5 + Math.random(); };
    return lista.slice().sort((a, b) => vikt(b) - vikt(a)).slice(0, n);
  }

  function distraktorer(ratt, falt, antal) {
    const svar = falt === 'sv' ? ratt.sv : overs(ratt, falt);
    const set = new Set([nyckel(svar)]);
    const samma = allaOrd().filter(o => o.ordklass === ratt.ordklass && o.id !== ratt.id);
    const ovriga = allaOrd().filter(o => o.id !== ratt.id);
    const ut = [];
    for (const o of blanda(samma).concat(blanda(ovriga))) {
      const t = falt === 'sv' ? o.sv : overs(o, falt);
      if (!t || set.has(nyckel(t))) continue;
      set.add(nyckel(t)); ut.push(t);
      if (ut.length >= antal) break;
    }
    return ut;
  }

  function hittaIMening(o) {
    if (!o.ex || !o.ex.sv || o.sv.includes(' ')) return null;
    const re = new RegExp('(^|[^a-zåäöé])(' + o.sv.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(?=$|[^a-zåäöé])', 'i');
    const m = re.exec(o.ex.sv);
    if (!m) return null;
    const start = m.index + m[1].length;
    return { fore: o.ex.sv.slice(0, start), efter: o.ex.sv.slice(start + o.sv.length) };
  }

  function byggOvningar(ord, { repetition = false, boss = false } = {}) {
    const ov = [];
    const kanLyssna = Tal.finnsUppläsning;
    for (const o of ord) {
      const stat = T.ordStat[o.id];
      if (!stat && !repetition && !boss) ov.push({ typ: 'intro', o });
    }
    // Bosskampen är svårare: mer skriva och lyssna.
    const typer = boss ? ['val-mal', 'skriv', 'skriv', 'lucka', 'val-sv'] : ['val-sv', 'val-mal', 'skriv', 'lucka'];
    if (kanLyssna) typer.push('lyssna', 'lyssna');
    for (const o of blanda(ord)) {
      // Långa fraser skrivs inte för hand – de övas med val och lyssning.
      const mojliga = typer.filter(t => (t !== 'lucka' || hittaIMening(o)) && (t !== 'skriv' || o.sv.length <= 24) && (t !== 'lyssna' || o.sv.length <= 40));
      const valda = blanda(mojliga).slice(0, ord.length <= 5 ? 2 : 1);
      // Nya ord börjar alltid med det lättaste: känn igen.
      if (!boss && !T.ordStat[o.id] && !valda.includes('val-sv')) valda[0] = 'val-sv';
      for (const t of valda) ov.push({ typ: t, o });
    }
    const introer = ov.filter(x => x.typ === 'intro');
    const resten = blanda(ov.filter(x => x.typ !== 'intro'));
    // Varva: intro för ett ord, direkt följt av en övning på samma ord.
    const ordnade = [];
    for (const i of introer) {
      ordnade.push(i);
      const j = resten.findIndex(x => x.o.id === i.o.id);
      if (j >= 0) ordnade.push(resten.splice(j, 1)[0]);
    }
    ordnade.push(...resten);
    if (ord.length >= 3) {
      const paren = blanda(ord).slice(0, Math.min(5, ord.length));
      ordnade.splice(Math.min(ordnade.length, Math.max(3, Math.floor(ordnade.length / 2))), 0, { typ: 'para', ord: paren });
    }
    if (T.inst.uttal && (Tal.kanKanna() || Tal.kanSpelaIn())) {
      ordnade.push({ typ: 'uttal', o: blanda(ord)[0] });
    }
    return ordnade;
  }

  function startaLektion(id, { hopp = false } = {}) {
    fyllHjartan();
    const lekt = id === EGNA ? { id: EGNA } : lektion(id);
    if (!lekt) return;
    if (!hopp && id !== EGNA && !arUpplast(lekt)) return;
    const ord = ordILektion(id);
    if (!ord.length) { window.alert(t('lektion.ingaOrd')); return; }
    if (T.hjartan <= 0) { visaSlutPaHjartan(); return; }
    if (lekt.boss) {
      const valda = blanda(ord).slice(0, hopp ? 14 : 12);
      starta({ lektion: lekt, ovningar: byggOvningar(valda, { boss: true }), repetition: false, boss: true, hopp });
      return;
    }
    const valda = valjOrd(ord, 7);
    starta({ lektion: lekt, ovningar: byggOvningar(valda), repetition: false });
  }

  function startaRepetition() {
    const sedda = allaOrd().filter(o => T.ordStat[o.id]);
    let kalla = sedda.length >= 4 ? sedda : ordILektion(stigLektioner()[0].id);
    const valda = valjOrd(kalla, 6);
    starta({ lektion: { id: '_rep' }, ovningar: byggOvningar(valda, { repetition: true }).filter(x => x.typ !== 'uttal'), repetition: true });
  }

  function visaSlutPaHjartan() {
    const dlg = document.getElementById('ordkort');
    dlgOmrita = visaSlutPaHjartan;
    const inne = tom(dlg.querySelector('.dlg-inne'));
    inne.append(
      h('div', { class: 'centrerad stor-emoji' }, '💔'),
      h('h2', { class: 'centrerad' }, t('hjartan.slut')),
      h('p', { class: 'centrerad' }, t('hjartan.info', { min: minTillHjarta() })),
      h('div', { class: 'knapprad centrerad' },
        h('button', { type: 'button', class: 'knapp bla', onclick: () => { stangDialog(dlg); startaRepetition(); } }, t('hjartan.repNu')),
        h('button', { type: 'button', class: 'knapp', onclick: () => stangDialog(dlg) }, t('hjartan.senare'))));
    oppnaDialog(dlg);
  }

  function starta({ lektion, ovningar, repetition, boss = false, hopp = false }) {
    S = { lektion, ko: ovningar.slice(), totalt: ovningar.filter(x => x.typ !== 'intro').length, klara: 0,
      ratt: 0, fel: 0, repetition, boss, hopp, igen: new Set(), xp: 0, combo: 0, basta: 0,
      startXp: dagensXp(), start: Date.now() };
    const lager = document.getElementById('lektion');
    lager.hidden = false;
    document.body.classList.add('i-lektion');
    nastaOvning();
  }

  function avsluta() {
    Tal.tyst();
    S = null;
    document.getElementById('lektion').hidden = true;
    document.body.classList.remove('i-lektion');
    visa();
  }

  function lektionsRam() {
    const lager = tom(document.getElementById('lektion'));
    const andel = S.totalt ? Math.round(S.klara / S.totalt * 100) : 0;
    const topp = h('div', { class: 'lektion-topp' },
      h('button', { type: 'button', class: 'stang', 'aria-label': t('lektion.avsluta'), onclick: () => {
        if (S.klara === 0 || window.confirm(t('lektion.avslutaFraga'))) avsluta();
      } }, '×'),
      h('div', { class: 'stapel', role: 'progressbar', 'aria-label': t('framsteg'), 'aria-valuenow': String(andel), 'aria-valuemin': '0', 'aria-valuemax': '100' },
        h('div', { style: { width: andel + '%' } })),
      S.boss ? h('span', { class: 'chip boss-chip', title: t('lektion.bosskamp') }, '🏰') : null,
      h('span', { class: 'chip hjartan' }, S.repetition ? '∞' : '❤️ ' + T.hjartan),
      // Språkknappen syns även inne i lektionen.
      I18n.knapp({ klass: 'i-lektion' }));
    const kropp = h('div', { class: 'lektion-kropp' });
    const fot = h('div', { class: 'lektion-fot' });
    lager.append(topp, kropp, fot);
    return { kropp, fot };
  }

  function nastaOvning() {
    if (!S) return;
    if (!S.ko.length) { visaResultat(); return; }
    const ov = S.ko.shift();
    // Språkbyte innan svaret: rita samma övning igen på det nya språket.
    S.omrita = () => { S.ko.unshift(ov); nastaOvning(); };
    const { kropp, fot } = lektionsRam();
    const rit = {
      intro: ritaIntro, 'val-sv': ritaValSv, 'val-mal': ritaValMal, lyssna: ritaLyssna,
      skriv: ritaSkriv, lucka: ritaLucka, para: ritaPara, uttal: ritaUttal
    }[ov.typ];
    try { rit(ov, kropp, fot); } catch (e) { console.error('Övningen kunde inte visas', ov.typ, e); nastaOvning(); }
  }

  // Gemensam "Kontrollera"-fot. hamtaSvar() -> {ok, rattSvar, tillagg} eller null om inget valt.
  function kontrollFot(fot, ov, hamtaSvar, { hoppa = false } = {}) {
    const knapp = h('button', { type: 'button', class: 'knapp gron bred', disabled: true }, t('ov.kontrollera'));
    const rad = h('div', { class: 'fot-rad' });
    if (hoppa) rad.appendChild(h('button', { type: 'button', class: 'knapp', onclick: () => registrera(ov, null, fot) }, t('ov.hoppaOver')));
    rad.appendChild(knapp);
    fot.appendChild(rad);
    knapp.addEventListener('click', () => {
      const svar = hamtaSvar();
      if (svar) registrera(ov, svar, fot);
    });
    return { aktivera(p = true) { knapp.disabled = !p; }, knapp };
  }

  function uppdateraStat(o, ok) {
    if (!o || !o.id) return;
    const s = T.ordStat[o.id] || { r: 0, f: 0 };
    if (ok) s.r++; else s.f++;
    s.sist = Date.now();
    T.ordStat[o.id] = s;
  }

  /** svar: {ok, rattSvar, tillagg} eller null = hoppade över. */
  function registrera(ov, svar, fot) {
    tom(fot);
    const hoppad = !svar;
    const ok = hoppad ? true : svar.ok;
    if (!hoppad) {
      if (ov.o) uppdateraStat(ov.o, ok);
      if (ok) {
        S.ratt++; S.xp += 1; S.combo++; S.basta = Math.max(S.basta, S.combo);
        if (S.combo >= 3) S.xp += 1; // bonus för flera rätt i rad
      } else {
        S.fel++; S.combo = 0;
        if (!S.repetition) { T.hjartan = Math.max(0, T.hjartan - 1); if (T.hjartan < MAX_HJARTAN && T.hjartan === MAX_HJARTAN - 1) T.hjartaTid = Date.now(); }
      }
      spara();
      const chip = document.querySelector('.lektion-topp .hjartan');
      if (chip && !S.repetition) { chip.textContent = '❤️ ' + T.hjartan; if (!ok) { chip.classList.add('skak'); } }
    }
    if (ok) S.klara++;
    else if (!S.igen.has(ov)) { S.igen.add(ov); S.ko.push(ov); }
    else S.klara++;

    const o = ov.o;
    if (!hoppad && T.inst.ljud) { if (ok) Ljud.ratt(); else Ljud.fel(); }
    const vem = Math.random() < 0.6 ? 'bosse' : (Math.random() < 0.5 ? 'ella' : 'lo');
    // Slumpa replik en gång (index), så att samma replik visas på det nya språket vid språkbyte.
    const nr = Math.floor(Math.random() * 1000);
    const combo = S.combo;
    const replik = () => {
      if (hoppad) return t('fb.annanGang');
      if (ok) { if (combo >= 3) return t('fb.combo', { n: combo }); const b = BERÖM(); return b[nr % b.length]; }
      const tr = TROST(); return tr[nr % tr.length];
    };
    const ritaFeedback = () => {
      tom(fot);
      const ruta = h('div', { class: 'feedback ' + (hoppad ? 'neutral' : ok ? 'ratt' : 'fel'), role: 'status' },
        h('div', { class: 'feedback-topp' },
          Figurer.figur(vem, hoppad ? 'tank' : ok ? 'glad' : 'trost', { storlek: 58 }),
          h('div', null,
            h('div', { class: 'feedback-rubrik' }, hoppad ? t('fb.overhoppad') : ok ? (svar.tillagg ? t('fb.nastanRatt') : t('fb.ratt')) : t('fb.inteRiktigt')),
            h('div', { class: 'feedback-replik' }, `${Figurer.NAMN[vem]}: ${replik()}`))),
        !ok ? h('div', null, t('fb.rattSvar'), h('b', null, svar.rattSvar)) : null,
        svar && svar.tillagg ? h('div', { class: 'liten' }, t(svar.tillagg.nyckel, { mal: svar.tillagg.mal })) : null,
        o ? h('div', { class: 'knapprad' }, hogtalare(o.sv, { liten: true }), h('span', { lang: 'sv' }, o.sv), h('span', { class: 'dampad', lang: sprak() }, '= ' + overs(o))) : null,
        h('button', { type: 'button', class: 'knapp bred ' + (ok ? 'gron' : 'rod'), onclick: () => {
          if (!S.repetition && T.hjartan <= 0) { visaResultat(true); return; }
          nastaOvning();
        } }, t('fortsatt')));
      fot.appendChild(ruta);
      ruta.querySelector('button.bred').focus();
    };
    ritaFeedback();
    S.omrita = ritaFeedback;
    if (T.inst.autoljud && o && !hoppad && ov.typ !== 'uttal') Tal.saga(o.sv);
  }

  function rubrik(text) { return h('h2', { class: 'ovning-rubrik' }, text); }

  function autoLas(text) { if (T.inst.autoljud) setTimeout(() => Tal.saga(text), 250); }

  function alternativ(kropp, val, { onVal, lang, las = false }) {
    const grid = h('div', { class: 'alternativ' });
    let vald = null;
    val.forEach((t, i) => {
      const b = h('button', { type: 'button', class: 'alt', lang, 'data-nr': String(i + 1), onclick: () => {
        grid.querySelectorAll('.alt').forEach(x => x.classList.remove('vald'));
        b.classList.add('vald');
        vald = t;
        if (las) Tal.saga(t);
        onVal(t);
      } }, h('span', { class: 'nr', 'aria-hidden': 'true' }, String(i + 1)), t);
      grid.appendChild(b);
    });
    kropp.appendChild(grid);
    return () => vald;
  }

  function ritaIntro(ov, kropp, fot) {
    const o = ov.o;
    kropp.append(
      h('div', { class: 'etikett-ny' }, t('ov.nyttOrd')),
      h('div', { class: 'kort-ord', lang: 'sv' }, o.sv),
      h('div', { class: 'knapprad centrerad' }, hogtalare(o.sv), hogtalare(o.sv, { langsam: true })),
      // Engelskt/polskt gränssnitt: bara det språket. Svenskt: båda, det valda framhävt.
      h('div', { class: 'overs-par' },
        ...visadeSprak().map(s => h('div', { class: visadeSprak().length > 1 && sprak() === s ? 'framhavd' : '' }, SPRAK[s].flagga + ' ', h('span', { lang: s }, o[s])))),
      o.ex && o.ex.sv ? h('div', { class: 'exempel' },
        h('div', { class: 'rad-mellan' }, h('b', { lang: 'sv' }, o.ex.sv), hogtalare(o.ex.sv, { liten: true })),
        o.ex[sprak()] ? h('div', { class: 'dampad', lang: sprak() }, o.ex[sprak()]) : null) : null);
    autoLas(o.sv);
    const b = h('button', { type: 'button', class: 'knapp bla bred', onclick: () => nastaOvning() }, t('ov.harKoll'));
    fot.appendChild(h('div', { class: 'fot-rad' }, b));
    b.focus();
  }

  function ritaValSv(ov, kropp, fot) {
    const o = ov.o;
    const ratt = overs(o);
    kropp.append(rubrik(t('ov.betyder.' + sprak())),
      h('div', { class: 'fraga-ord' }, hogtalare(o.sv), h('span', { lang: 'sv' }, o.sv)));
    autoLas(o.sv);
    const k = kontrollFot(fot, ov, () => { const v = hamta(); return v && { ok: v === ratt, rattSvar: ratt }; });
    const hamta = alternativ(kropp, blanda([ratt, ...distraktorer(o, sprak(), 3)]), { lang: sprak(), onVal: () => k.aktivera() });
  }

  function ritaValMal(ov, kropp, fot) {
    const o = ov.o;
    kropp.append(rubrik(t('ov.valjSvenska')), h('div', { class: 'fraga-ord' }, h('span', { lang: sprak() }, overs(o))));
    const k = kontrollFot(fot, ov, () => { const v = hamta(); return v && { ok: nyckel(v) === nyckel(o.sv), rattSvar: o.sv }; });
    const hamta = alternativ(kropp, blanda([o.sv, ...distraktorer(o, 'sv', 3)]), { lang: 'sv', las: T.inst.autoljud, onVal: () => k.aktivera() });
  }

  function ritaLyssna(ov, kropp, fot) {
    const o = ov.o;
    kropp.append(rubrik(t('ov.lyssnaValj')),
      h('div', { class: 'lyssna-knappar' },
        h('button', { type: 'button', class: 'stor-hogtalare', 'aria-label': t('ov.spelaIgen'), onclick: () => Tal.saga(o.sv) }, '🔊'),
        h('button', { type: 'button', class: 'stor-hogtalare liten-variant', 'aria-label': t('ov.spelaLangsamt'), onclick: () => Tal.saga(o.sv, { langsam: true }) }, '🐢')));
    setTimeout(() => Tal.saga(o.sv), 300);
    const k = kontrollFot(fot, ov, () => { const v = hamta(); return v && { ok: nyckel(v) === nyckel(o.sv), rattSvar: o.sv }; }, { hoppa: true });
    const hamta = alternativ(kropp, blanda([o.sv, ...distraktorer(o, 'sv', 3)]), { lang: 'sv', onVal: () => k.aktivera() });
  }

  function utanAccenter(s) { return s.replace(/[åä]/g, 'a').replace(/ö/g, 'o').replace(/é/g, 'e'); }

  /** Bedömer ett skrivet svar: exakt, nästan (accent/1 bokstav) eller fel. */
  function bedomSkrivet(skrivet, mal) {
    const a = Tal.normalisera(skrivet), m = Tal.normalisera(mal);
    if (!a) return null;
    if (a === m) return { ok: true, rattSvar: mal };
    // tillagg översätts när feedbacken ritas (så att den följer ett språkbyte).
    if (utanAccenter(a) === utanAccenter(m)) return { ok: true, rattSvar: mal, tillagg: { nyckel: 'ov.prickarna', mal } };
    if (m.length >= 5 && Tal.levenshtein(a, m) === 1) return { ok: true, rattSvar: mal, tillagg: { nyckel: 'ov.stavfel', mal } };
    return { ok: false, rattSvar: mal };
  }

  function ritaSkriv(ov, kropp, fot) {
    const o = ov.o;
    const falt = h('input', { class: 'falt stort', lang: 'sv', autocomplete: 'off', autocapitalize: 'off', spellcheck: false, placeholder: t('ov.skrivHar'), 'aria-label': t('ov.dittSvar') });
    const bokstaver = h('div', { class: 'knapprad' }, ...['å', 'ä', 'ö'].map(b => h('button', {
      type: 'button', class: 'knapp liten bokstav', onclick: () => {
        const p = falt.selectionStart ?? falt.value.length;
        falt.value = falt.value.slice(0, p) + b + falt.value.slice(falt.selectionEnd ?? p);
        falt.focus(); falt.setSelectionRange(p + 1, p + 1); k.aktivera(!!falt.value.trim());
      } }, b)));
    kropp.append(rubrik(t('ov.skriv')), h('div', { class: 'fraga-ord' }, h('span', { lang: sprak() }, overs(o))), falt, bokstaver);
    const k = kontrollFot(fot, ov, () => bedomSkrivet(falt.value, o.sv));
    falt.addEventListener('input', () => k.aktivera(!!falt.value.trim()));
    falt.addEventListener('keydown', ev => { if (ev.key === 'Enter' && falt.value.trim()) k.knapp.click(); });
    setTimeout(() => falt.focus(), 50);
  }

  function ritaLucka(ov, kropp, fot) {
    const o = ov.o;
    const delar = hittaIMening(o);
    if (!delar) { ritaValSv(ov, kropp, fot); return; }
    kropp.append(rubrik(t('ov.lucka')),
      h('div', { class: 'mening', lang: 'sv' }, delar.fore, h('span', { class: 'lucka' }, '_____'), delar.efter),
      o.ex[sprak()] ? h('p', { class: 'dampad centrerad', lang: sprak() }, o.ex[sprak()]) : null);
    const k = kontrollFot(fot, ov, () => { const v = hamta(); return v && { ok: nyckel(v) === nyckel(o.sv), rattSvar: o.sv }; });
    const hamta = alternativ(kropp, blanda([o.sv, ...distraktorer(o, 'sv', 3)]), { lang: 'sv', onVal: () => k.aktivera() });
  }

  function ritaPara(ov, kropp, fot) {
    kropp.append(rubrik(t('ov.para')));
    const vanster = h('div', { class: 'para-kol' });
    const hoger = h('div', { class: 'para-kol' });
    kropp.appendChild(h('div', { class: 'para' }, vanster, hoger));
    let valdV = null, valdH = null, kvar = ov.ord.length, fel = 0;
    const kontrollera = () => {
      if (!valdV || !valdH) return;
      const v = valdV, hh = valdH;
      valdV = valdH = null;
      if (v.dataset.id === hh.dataset.id) {
        [v, hh].forEach(x => { x.classList.remove('vald'); x.classList.add('parad'); x.disabled = true; });
        uppdateraStat(ordPerId.get(v.dataset.id), true);
        kvar--;
        if (kvar === 0) {
          S.ratt++; S.xp += 2; S.klara++;
          if (fel === 0) S.xp += 1;
          spara();
          const ritaKlar = () => {
            const b = h('button', { type: 'button', class: 'knapp gron bred', onclick: () => nastaOvning() }, t('fortsatt'));
            tom(fot).appendChild(h('div', { class: 'feedback ratt' }, h('div', { class: 'feedback-rubrik' }, fel ? t('ov.klart') : t('ov.perfekt')), b));
            b.focus();
          };
          ritaKlar();
          S.omrita = ritaKlar;
        }
      } else {
        fel++;
        [v, hh].forEach(x => { x.classList.remove('vald'); x.classList.add('skak'); setTimeout(() => x.classList.remove('skak'), 450); });
      }
    };
    const knapp = (text, id, sida, lang) => {
      const b = h('button', { type: 'button', class: 'alt para-alt', lang, 'data-id': id, onclick: () => {
        if (b.disabled) return;
        if (sida === 'v') { if (valdV) valdV.classList.remove('vald'); valdV = b; Tal.saga(text); }
        else { if (valdH) valdH.classList.remove('vald'); valdH = b; }
        b.classList.add('vald');
        kontrollera();
      } }, text);
      return b;
    };
    blanda(ov.ord).forEach(o => vanster.appendChild(knapp(o.sv, o.id, 'v', 'sv')));
    blanda(ov.ord).forEach(o => hoger.appendChild(knapp(overs(o), o.id, 'h', sprak())));
    fot.appendChild(h('div', { class: 'fot-rad' }, h('span', { class: 'dampad' }, t('ov.paraInfo'))));
  }

  function ritaUttal(ov, kropp, fot) {
    const o = ov.o;
    kropp.append(rubrik(t('ov.sagHogt')),
      h('div', { class: 'fraga-ord' }, h('span', { lang: 'sv' }, o.sv)),
      h('p', { class: 'dampad centrerad', lang: sprak() }, overs(o)));
    let klar = false;
    const fortsatt = h('button', { type: 'button', class: 'knapp gron bred', disabled: true }, t('fortsatt'));
    const panel = uttalsPanel(o.sv, { onResultat: (p) => {
      if (p === null || p === undefined) return;
      if (p >= 0.6 && !klar) {
        klar = true;
        S.ratt++; S.xp += p >= 0.85 ? 3 : 2;
        uppdateraStat(o, true);
        spara();
      }
      fortsatt.disabled = false;
    } });
    kropp.appendChild(panel);
    fortsatt.addEventListener('click', () => { S.klara++; nastaOvning(); });
    fot.appendChild(h('div', { class: 'fot-rad' },
      h('button', { type: 'button', class: 'knapp', onclick: () => { S.klara++; nastaOvning(); } }, t('ov.hoppaOver')),
      fortsatt));
    autoLas(o.sv);
  }

  function visaResultat(slutPaHjartan = false) {
    Tal.tyst();
    const s = S;
    const forsok = s.ratt + s.fel;
    const trff = forsok ? Math.round(s.ratt / forsok * 100) : 100;
    const mal = Number(T.inst.dagsmal) || 30;
    // Rubrik och replik sparas som [nyckel, vars] så att de kan ritas om på ett nytt språk.
    let rubrikText, hum = 'fira', replik, lyckad = !slutPaHjartan;
    if (s.hopp && trff < 80) lyckad = false;

    if (!lyckad) {
      hum = 'trost';
      rubrikText = [slutPaHjartan ? 'hjartan.slut' : 'res.nastan'];
      replik = s.hopp ? ['res.hoppMiss', { p: trff }] : ['res.ingenFara'];
      if (T.inst.ljud) Ljud.fel();
    } else {
      rubrikText = [s.boss ? 'res.boss' : trff >= 90 ? 'res.fantastiskt' : trff >= 70 ? 'res.braJobbat' : 'res.klartOva'];
      const bonus = s.boss ? 30 : s.repetition ? 5 : 10;
      s.xp += bonus;
      geXp(s.xp);
      const nyDag = markeraDagKlar();
      if (s.repetition) T.hjartan = Math.min(MAX_HJARTAN, T.hjartan + 1);
      else {
        const stj = trff >= 95 ? 3 : trff >= 75 ? 2 : 1;
        const f = T.klara[s.lektion.id] || { ggr: 0, stjarnor: 0 };
        T.klara[s.lektion.id] = { ggr: f.ggr + 1, stjarnor: Math.max(f.stjarnor || 0, stj), bast: Math.max(f.bast || 0, trff) };
        if (s.fel === 0) T.rekord.felfria++;
        if (s.boss) T.rekord.bossar++;
        if (s.hopp) {
          // Hoppet lyckades: allt fram till och med den här bosskampen räknas som klart.
          for (const l of stigLektioner()) {
            if (!T.klara[l.id]) T.klara[l.id] = { ggr: 1, stjarnor: 1, bast: 0, hoppad: true };
            if (l.id === s.lektion.id) break;
          }
        }
      }
      T.rekord.basta = Math.max(T.rekord.basta || 0, s.basta);
      spara();
      replik = s.boss ? [s.hopp ? 'res.hoppade' : 'res.upplast']
        : nyDag ? ['res.elden', { n: aktuellStreak() }]
        : s.startXp < mal && dagensXp() >= mal ? ['res.malKlart']
        : s.basta >= 5 ? ['res.iRad', { n: s.basta }] : ['res.snyggt'];
      if (T.inst.ljud) Ljud.klar();
    }
    const nyaMarken = lyckad ? kollaMarken({ tyst: true }) : [];
    if (nyaMarken.length && T.inst.ljud) setTimeout(() => Ljud.marke(), 900);

    const res = {
      lyckad, hum, rubrikText, replik, trff, mal, nyaMarken, xp: s.xp, boss: s.boss, hopp: s.hopp,
      fore: Math.min(100, Math.round(s.startXp / mal * 100)),
      efter: Math.min(100, Math.round(dagensXp() / mal * 100))
    };
    ritaResultat(res);
    s.omrita = () => ritaResultat(res, { igen: true });
  }

  function ritaResultat(r, { igen = false } = {}) {
    const { kropp, fot } = lektionsRam();
    const { lyckad, mal, nyaMarken } = r;
    kropp.append(
      h('div', { class: 'resultat' },
        Figurer.pratar(r.boss && lyckad ? 'ella' : 'bosse', t(r.replik[0], r.replik[1]), r.hum, { storlek: 110, sida: 'mitten' }),
        h('h2', null, t(r.rubrikText[0], r.rubrikText[1])),
        h('div', { class: 'resultat-kort' },
          h('div', { class: 'pop' }, h('small', null, t('res.xp')), h('b', null, lyckad ? '+' + r.xp : '0')),
          h('div', { class: 'pop' }, h('small', null, t('res.traff')), h('b', null, r.trff + '%')),
          h('div', { class: 'pop' }, h('small', null, t('res.streak')), h('b', null, h('span', { class: 'flamma' + (aktuellStreak() ? ' eld' : '') }, '🔥'), ' ' + aktuellStreak()))),
        lyckad ? h('div', { class: 'ruta' }, h('div', { class: 'rad-mellan' }, h('b', null, t('hem.dagensMal')), h('span', { class: 'dampad' }, `${dagensXp()} / ${mal} XP`)), xpStapel(igen ? r.efter : r.fore, r.efter, t('hem.dagensMal'))) : null,
        nyaMarken.length ? h('div', { class: 'nya-marken' }, h('h3', null, t('res.nyaMarken')),
          ...nyaMarken.map(m => h('div', { class: 'marke har pop' }, h('span', { class: 'marke-ikon' }, m.ikon), h('b', null, m.namn), h('small', null, m.text)))) : null));
    if (lyckad && !igen) kropp.appendChild(h('div', { class: 'konfetti', 'aria-hidden': 'true' }, ...Array.from({ length: 36 }, (_, i) => h('i', { style: { left: ((i * 2.9) % 100) + '%', animationDelay: (i % 9) * 0.1 + 's', animationDuration: (1.8 + (i % 5) * 0.3) + 's' } }))));
    const knappar = h('div', { class: 'fot-rad' });
    if (!lyckad && !r.hopp) knappar.appendChild(h('button', { type: 'button', class: 'knapp bla', onclick: () => { startaRepetition(); } }, t('hem.repetera')));
    const b = h('button', { type: 'button', class: 'knapp gron bred', onclick: avsluta }, t('fortsatt'));
    knappar.appendChild(b);
    fot.appendChild(knappar);
    b.focus();
  }

  // Tangentbord: 1–4 väljer alternativ, Enter kontrollerar/fortsätter.
  document.addEventListener('keydown', ev => {
    if (!S || ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA') return;
    const lager = document.getElementById('lektion');
    if (/^[1-9]$/.test(ev.key)) {
      const b = lager.querySelector(`.alternativ .alt[data-nr="${ev.key}"]`);
      if (b) { b.click(); ev.preventDefault(); }
    } else if (ev.key === 'Enter') {
      const b = lager.querySelector('.lektion-fot button.bred:not([disabled])');
      if (b && document.activeElement !== b) { b.click(); ev.preventDefault(); }
    }
  });

  // ---------------- Självtest (?sjalvtest=1) ----------------
  async function sjalvtest() {
    const fel = [];
    let antal = 0;
    const synt = { saga: Tal.saga };
    Tal.saga = () => Promise.resolve(true); // tyst under testet
    try {
      const lektioner = DATA.lektioner.filter(l => ordILektion(l.id).length);
      for (const l of lektioner) {
        const ord = ordILektion(l.id);
        const ovningar = byggOvningar(valjOrd(ord, 7));
        // tvinga fram alla typer på lektionens första ord
        ovningar.push(...['val-sv', 'val-mal', 'lyssna', 'skriv', 'lucka', 'uttal'].map(t => ({ typ: t, o: ord[0] })));
        starta({ lektion: l, ovningar, repetition: true });
        let varv = 0;
        while (S && S.ko.length && varv++ < 200) {
          const ov = S.ko[0];
          nastaOvning();
          antal++;
          const lager = document.getElementById('lektion');
          if (ov.typ === 'intro') continue;
          if (ov.typ === 'para') {
            for (const o of ov.ord) {
              lager.querySelector(`.para-kol:first-child [data-id="${o.id}"]`).click();
              lager.querySelector(`.para-kol:last-child [data-id="${o.id}"]`).click();
            }
            if (!lager.querySelector('.feedback.ratt')) fel.push(`${l.id}: para blev inte klar`);
            continue;
          }
          if (ov.typ === 'uttal') { if (!lager.querySelector('.uttal')) fel.push(`${l.id}: uttalspanel saknas`); continue; }
          if (ov.typ === 'skriv') {
            const f = lager.querySelector('input.falt');
            f.value = ov.o.sv; f.dispatchEvent(new Event('input'));
          } else {
            const alt = Array.from(lager.querySelectorAll('.alternativ .alt'));
            const facit = ov.typ === 'val-sv' || (ov.typ === 'lucka' && !hittaIMening(ov.o)) ? overs(ov.o) : ov.o.sv;
            const ratt = alt.find(b => b.lastChild.textContent === facit);
            if (alt.length !== 4) fel.push(`${l.id}/${ov.o.sv}: ${ov.typ} har ${alt.length} alternativ`);
            if (!ratt) { fel.push(`${l.id}/${ov.o.sv}: ${ov.typ} saknar rätt svar`); continue; }
            ratt.click();
          }
          lager.querySelector('.lektion-fot button.bred').click();
          if (!lager.querySelector('.feedback.ratt')) fel.push(`${l.id}/${ov.o.sv}: ${ov.typ} bedömdes fel`);
        }
        avsluta();
      }
      // nivåkartan
      location.hash = '#/hem'; visa();
      const stopp = document.querySelectorAll('.karta .stopp').length;
      if (stopp !== stigLektioner().length) fel.push(`kartan visar ${stopp} stopp, väntade ${stigLektioner().length}`);
      if (document.querySelectorAll('.region').length !== 6) fel.push('kartan saknar nivåer');
      if (!document.querySelector('.figur svg')) fel.push('Bosse syns inte');
      // bokstavsraden
      const knappar = document.querySelectorAll('.alfa-knapp');
      if (knappar.length !== 29) fel.push('alfabetet har ' + knappar.length + ' bokstäver');
      knappar.forEach(k => { k.click(); if (document.getElementById('alfa-panel').hidden) fel.push('panel öppnas inte för ' + k.textContent); if (document.querySelectorAll('#alfa-panel .alfa-ex').length !== 2) fel.push('fel antal exempel för ' + k.textContent); k.click(); });
      // skrivbedömning
      if (!bedomSkrivet('forlat', 'förlåt').ok) fel.push('accentlös bedömning');
      if (bedomSkrivet('hund', 'katt').ok) fel.push('fel ord godkändes');
      ['ordlista', 'mina', 'profil', 'installningar', 'hem'].forEach(s => { location.hash = '#/' + s; visa(); });
      // Gränssnittets språk: alla tre språk, alla vyer, knappen i toppen och i lektionen, byte mitt i en övning.
      const forraSprak = I18n.sprak;
      I18n.rensaSaknade();
      const ordning = ['en', 'pl', 'sv'];
      for (const sp of ordning) {
        I18n.setSprak(sp);
        if (document.documentElement.lang !== sp) fel.push('html lang blev inte ' + sp);
        const tryckt = document.querySelector('.topp .sprakval button[aria-pressed="true"]');
        if (!tryckt || tryckt.dataset.sprak !== sp) fel.push('språkknappen i toppen visar inte ' + sp);
        const navText = document.querySelector('.nav [data-i18n="nav.hem"]');
        if (!navText || navText.textContent !== t('nav.hem')) fel.push('menyn översattes inte till ' + sp);
        ['ordlista', 'mina', 'profil', 'installningar', 'hem'].forEach(s => { location.hash = '#/' + s; visa(); });
        const l = stigLektioner()[0];
        const o = ordILektion(l.id)[0];
        if (sp !== 'sv' && sprak() !== sp) fel.push(`översättningsspråket följer inte gränssnittet (${sp})`);
        starta({ lektion: l, ovningar: [{ typ: 'val-sv', o }], repetition: true });
        const lager = document.getElementById('lektion');
        if (!lager.querySelector('.lektion-topp .sprakval')) fel.push('språkknappen saknas i lektionen');
        const alt = Array.from(lager.querySelectorAll('.alternativ .alt')).map(b => b.lastChild.textContent);
        if (!alt.includes(sp === 'sv' ? overs(o) : o[sp])) fel.push(`val-sv saknar rätt svar på ${sp}`);
        // Byt språk mitt i övningen: rubriken och alternativen ska följa med.
        const nasta = ordning[(ordning.indexOf(sp) + 1) % ordning.length];
        I18n.setSprak(nasta);
        const rub = lager.querySelector('.ovning-rubrik');
        if (!rub || rub.textContent !== t('ov.betyder.' + sprak())) fel.push(`rubriken följde inte språkbytet ${sp}→${nasta}`);
        if (!Array.from(lager.querySelectorAll('.alternativ .alt')).some(b => b.lastChild.textContent === overs(o))) fel.push(`alternativen följde inte språkbytet ${sp}→${nasta}`);
        I18n.setSprak(sp);
        avsluta();
      }
      // Flashcards: lekfilerna valideras, leklistan och ett pass i A1 spelas igenom.
      await window.Kort.sjalvtest(fel, async (hash, selektor) => {
        location.hash = hash; visa();
        for (let i = 0; i < 100 && !vy().querySelector(selektor); i++) await new Promise(r => setTimeout(r, 50));
        if (!vy().querySelector(selektor)) fel.push(`flashcards: ${hash} visade aldrig ${selektor}`);
        return vy();
      });
      if (I18n.saknade.length) fel.push('saknade översättningar: ' + I18n.saknade.join(', '));
      I18n.setSprak(forraSprak);
      location.hash = '#/hem'; visa();
    } catch (e) {
      fel.push('undantag: ' + (e && e.stack || e));
    } finally {
      Tal.saga = synt.saga;
      T = Object.assign(nyttTillstand(), {}); // skriv inte testets framsteg
      try { window.localStorage.removeItem(LAGRING); } catch (e) { /* ok */ }
    }
    document.body.dataset.sjalvtest = fel.length ? 'FEL' : 'OK';
    const ut = h('pre', { id: 'sjalvtest-resultat' }, `SJALVTEST ${fel.length ? 'FEL' : 'OK'} ovningar=${antal} ord=${DATA.ord.length} bredd=${window.innerWidth}/${document.documentElement.scrollWidth}\n` + fel.slice(0, 50).join('\n'));
    document.body.appendChild(ut);
  }

  // ---------------- Start ----------------
  async function init() {
    // Språkknappen i toppraden (skapas direkt så att den syns medan orden laddas).
    const plats = document.getElementById('sprakval-plats');
    if (plats) plats.replaceWith(I18n.knapp({ klass: 'i-topp' }));
    Tal.setRost(T.inst.rost);
    Tal.setHastighet(T.inst.hastighet);
    Ljud.setPa(T.inst.ljud !== false);
    window.Alfabet.init(document.getElementById('alfa-rad'), document.getElementById('alfa-panel'));
    const dlg = document.getElementById('ordkort');
    dlg.addEventListener('click', ev => { if (ev.target === dlg) stangDialog(dlg); });
    dlg.addEventListener('close', () => { Tal.tyst(); dlgOmrita = null; });
    try {
      await laddaData();
    } catch (e) {
      console.error(e);
      tom(vy()).appendChild(felruta(t('fel.ladda', { fel: e.message })));
      return;
    }
    window.addEventListener('hashchange', () => { if (!S) visa(); });
    // Språkbyte: rita om det som syns direkt, utan omladdning.
    I18n.narSprakAndras(() => {
      if (S) { uppdateraHuvud(); if (S.omrita) S.omrita(); }
      else visa({ behallScroll: true });
      const dlg = document.getElementById('ordkort');
      if (dlg.open && dlgOmrita) dlgOmrita();
    });
    // Rösterna laddas asynkront – ta bort varningen när en svensk röst dyker upp.
    Tal.narRosterAndras(() => {
      const v = document.getElementById('rost-varning');
      if (v && Tal.harSvenskRost) v.remove();
    });
    visa();
    setInterval(() => { if (!S) uppdateraHuvud(); }, 60000);
    document.body.dataset.klar = '1';
    if (/[?&]sjalvtest=1/.test(location.search)) sjalvtest();
  }

  window.addEventListener('error', ev => { document.body.dataset.fel = String(ev.message || 'fel'); });
  window.SvenskaOrd = { get data() { return DATA; }, get tillstand() { return T; }, bedomSkrivet };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
