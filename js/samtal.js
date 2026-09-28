/* samtal.js – Prata med Bosse: skriptade samtal där Bosse talar svenska (speechSynthesis sv-SE),
 * du svarar med rösten (SpeechRecognition sv-SE) eller skriver/väljer, och Bosse rättar dig.
 * Vyer: #/samtal (listan) och #/samtal/<id> (samtalet). Data: data/samtal.json, bedömning: js/samtaldata.js.
 * Hjälpspråket (engelska/polska) sparas i localStorage (alltid try/catch). Allt körs gratis i webbläsaren. */
(function () {
  'use strict';
  const { h, tom, blanda } = window.DOM;
  const Tal = window.Tal;
  const I18n = window.I18n;
  const SD = window.SamtalData;
  const t = I18n.t;

  const LAGRING = 'svenskaord.samtal.v1';
  const NIVA_LEK = { A1: 'a1', A2: 'a2', B1: 'b1', B2: 'b2', C1: 'c1', C2: 'c2' };

  let testlage = false;
  let minnesLager = null;
  let C = null;     // pågående samtal
  let gen = 0;      // ökar när samtalet avbryts – gamla löften ignoreras

  // ---------------- Lagring ----------------
  function lasAllt() {
    if (testlage && minnesLager) return minnesLager;
    try {
      const s = window.localStorage.getItem(LAGRING);
      const v = s ? JSON.parse(s) : {};
      return v && typeof v === 'object' ? v : {};
    } catch (e) { console.warn('Kunde inte läsa samtalen', e); return minnesLager || {}; }
  }
  function skrivAllt(v) {
    minnesLager = v;
    if (testlage) return;
    try { window.localStorage.setItem(LAGRING, JSON.stringify(v)); }
    catch (e) { console.warn('Kunde inte spara samtalen', e); }
  }
  /** Hjälpspråket: engelska eller polska. Första gången följer det gränssnittet. */
  function hjalp() {
    const v = lasAllt().hjalp;
    if (v === 'en' || v === 'pl') return v;
    return I18n.sprak === 'pl' ? 'pl' : 'en';
  }
  function setHjalp(s) { const a = lasAllt(); a.hjalp = s; skrivAllt(a); }
  function bast(id) { const b = lasAllt().bast; return b && Number(b[id]) || 0; }
  function sparaBast(id, stj) {
    const a = lasAllt();
    a.bast = a.bast && typeof a.bast === 'object' ? a.bast : {};
    if (stj > (Number(a.bast[id]) || 0)) a.bast[id] = stj;
    skrivAllt(a);
  }

  // ---------------- Data ----------------
  let laddning = null;
  function ladda() {
    if (!laddning) {
      laddning = (async () => {
        try {
          const r = await fetch('data/samtal.json', { cache: 'no-cache' });
          if (!r.ok) throw new Error('HTTP ' + r.status);
          const data = await r.json();
          const lista = (data && Array.isArray(data.samtal) ? data.samtal : [])
            .filter(s => s && s.id && s.titel && Array.isArray(s.steg) && s.steg.length && s.steg.every(st => st && st.sv && st.svar && Array.isArray(st.godkant)));
          if (!lista.length) throw new Error('tom fil');
          return { ok: true, data, samtal: lista };
        } catch (e) {
          console.warn('Samtalen kunde inte laddas', e);
          laddning = null; // försök igen nästa gång
          return { ok: false, fel: e.message };
        }
      })();
    }
    return laddning;
  }

  const titel = s => (s.titel && (s.titel[I18n.sprak] || s.titel.sv)) || s.id;
  const stjarnor = n => '★'.repeat(n) + '☆'.repeat(3 - n);
  const vanta = ms => new Promise(r => setTimeout(r, testlage ? 0 : ms));

  // ---------------- Hjälpspråksknappen (EN | PL) ----------------
  function hjalpKnapp(efter) {
    const grupp = h('div', { class: 'sprakval hjalpval', role: 'group', 'aria-label': t('samtal.hjalpsprak') });
    for (const s of ['en', 'pl']) {
      const pa = hjalp() === s;
      grupp.appendChild(h('button', {
        type: 'button', class: pa ? 'vald' : '', 'data-hjalp': s, lang: s, 'aria-pressed': String(pa), title: I18n.SPRAK_INFO[s].namn,
        onclick: () => { setHjalp(s); efter(); }
      }, h('span', { class: 'sprak-flagga flagga-' + s, 'aria-hidden': 'true' }), h('span', { class: 'sprak-kod' }, I18n.SPRAK_INFO[s].kod)));
    }
    return h('div', { class: 'hjalprad' }, h('span', { class: 'dampad liten' }, t('samtal.hjalpsprak')), grupp);
  }

  // ---------------- Listan ----------------
  let listaVersion = 0;
  function visaLista(rot) {
    const version = ++listaVersion;
    const bosse = window.Figurer.pratar('bosse', t('samtal.info'), 'vinka', { storlek: 92 });
    rot.appendChild(h('h1', null, t('samtal.rubrik')));
    rot.appendChild(bosse);
    rot.appendChild(hjalpKnapp(() => { tom(rot); visaLista(rot); }));
    if (!Tal.kanKanna()) rot.appendChild(h('div', { class: 'ruta varning' }, t('samtal.ingenMik')));
    const plats = h('div', null, h('p', { class: 'dampad' }, t('laddar')));
    rot.appendChild(plats);
    ladda().then(r => {
      if (version !== listaVersion || !plats.isConnected) return;
      tom(plats);
      if (!r.ok) { plats.appendChild(h('div', { class: 'ruta fel' }, t('samtal.laddaFel', { fel: r.fel }))); return; }
      for (const n of SD.NIVAER) {
        const lista = r.samtal.filter(s => s.niva === n);
        if (!lista.length) continue;
        plats.appendChild(h('h2', { class: 'samtal-niva-rubrik' }, t('kort.lek.' + NIVA_LEK[n])));
        const grid = h('div', { class: 'lekar samtal-lista' });
        for (const s of lista) {
          const b = bast(s.id);
          grid.appendChild(h('a', { class: 'lek samtal-kort', href: '#/samtal/' + s.id, 'data-id': s.id },
            h('span', { class: 'lek-ikon', 'aria-hidden': 'true' }, s.ikon || '💬'),
            h('span', { class: 'lek-namn' }, titel(s)),
            I18n.sprak !== 'sv' ? h('span', { class: 'samtal-sv-titel', lang: 'sv' }, s.titel.sv) : null,
            h('span', { class: 'lek-antal' }, t('samtal.steg', { n: s.steg.length })),
            h('span', { class: 'samtal-stjarnor' + (b ? '' : ' tomma'), 'aria-label': t('samtal.bast', { s: b + '/3' }) }, stjarnor(b))));
        }
        plats.appendChild(grid);
      }
    });
  }

  // ---------------- Samtalet ----------------
  function visaSamtal(rot, id) {
    const version = ++listaVersion;
    rot.appendChild(h('p', { class: 'dampad' }, t('laddar')));
    ladda().then(r => {
      if (version !== listaVersion || !rot.isConnected) return;
      tom(rot);
      if (!r.ok) { rot.appendChild(h('div', { class: 'ruta fel' }, t('samtal.laddaFel', { fel: r.fel }))); return; }
      const s = r.samtal.find(x => x.id === id);
      if (!s) {
        rot.appendChild(h('div', { class: 'ruta fel' }, t('samtal.saknas')));
        rot.appendChild(h('a', { class: 'knapp bla', href: '#/samtal' }, t('samtal.tillbaka')));
        return;
      }
      C = { samtal: s, steg: 0, logg: [], forsok: 0, forstaRatt: 0, fas: 'start', lyssnar: false, panel: null, meddelande: '', pratar: false, hum: 'vinka', rot, gen: ++gen };
      ritaAllt();
    });
  }

  function ritaAllt() {
    if (!C) return;
    const rot = C.rot;
    tom(rot);
    const s = C.samtal;
    const fig = window.Figurer.figur('bosse', C.hum, { storlek: 150 });
    if (C.pratar) fig.classList.add('pratar');
    C.figEl = fig;
    const prickar = h('div', { class: 'samtal-prickar', 'aria-hidden': 'true' },
      s.steg.map((_, i) => h('span', { class: i < C.steg ? 'klar' : i === C.steg && C.fas !== 'klar' ? 'nu' : '' })));
    C.logEl = h('div', { class: 'samtal-logg', 'aria-live': 'polite' });
    C.kontrollEl = h('div', { class: 'samtal-kontroller' });
    const hjalpRad = hjalpKnapp(() => ritaAllt());
    const app = h('div', { class: 'samtal' },
      h('div', { class: 'samtal-topp' },
        h('a', { class: 'knapp liten', href: '#/samtal', 'aria-label': t('samtal.tillbaka'), title: t('samtal.tillbaka') }, '←'),
        h('span', { class: 'samtal-niva' }, s.niva),
        h('h1', { class: 'samtal-titel' }, titel(s)),
        hjalpRad),
      h('div', { class: 'samtal-scen' }, fig, prickar),
      C.logEl,
      C.kontrollEl);
    rot.appendChild(app);
    anpassaHojd();
    C.prickEl = prickar;
    C.logg.forEach(p => C.logEl.appendChild(bubbla(p, false)));
    ritaKontroller();
    rullaNer();
  }

  /** Samtalet fyller skärmen som en app: Bosse överst, loggen rullar, mikrofonen längst ner. */
  function anpassaHojd() {
    const el = C && C.rot && C.rot.querySelector('.samtal');
    if (!el) return;
    const topp = document.querySelector('.topp');
    el.style.setProperty('--samtal-ovan', (topp ? topp.offsetHeight : 0) + 'px');
  }
  window.addEventListener('resize', anpassaHojd);

  function rullaNer() {
    if (!C || !C.logEl) return;
    const l = C.logEl;
    try { l.scrollTo({ top: l.scrollHeight, behavior: testlage ? 'auto' : 'smooth' }); } catch (e) { l.scrollTop = l.scrollHeight; }
  }

  function uppdateraPrickar() {
    if (!C || !C.prickEl) return;
    Array.from(C.prickEl.children).forEach((el, i) => { el.className = i < C.steg ? 'klar' : i === C.steg && C.fas !== 'klar' ? 'nu' : ''; });
  }

  /** En pratbubbla i loggen: Bosse (svenska + översättning + tips) eller du (det som hördes + ✓/✗). */
  function bubbla(p, ny) {
    if (p.vem === 'du') {
      const ok = p.typ === 'ratt';
      return h('div', { class: 'samtal-rad du' + (ny ? ' ny' : '') },
        h('div', { class: 'samtal-bubbla du ' + (ok ? 'ratt' : 'fel') },
          h('span', { class: 'samtal-markering', role: 'img', 'aria-label': t(ok ? 'samtal.ratt' : 'samtal.fel') }, ok ? '✓' : '✗'),
          h('span', { lang: 'sv' }, p.text)));
    }
    const hj = hjalp();
    return h('div', { class: 'samtal-rad bosse' + (ny ? ' ny' : '') },
      h('div', { class: 'samtal-bubbla bosse' + (p.typ ? ' ' + p.typ : '') },
        h('div', { class: 'samtal-sv-rad' },
          h('span', { class: 'samtal-sv', lang: 'sv' }, p.sv),
          h('span', { class: 'samtal-ljud' },
            h('button', { type: 'button', class: 'hogtalare liten', 'aria-label': t('las.upp', { text: p.sv }), title: t('samtal.upprepa'), onclick: () => tala(p.sv) }, '🔊'),
            h('button', { type: 'button', class: 'hogtalare liten langsam', 'aria-label': t('las.langsamt', { text: p.sv }), title: t('langsamt'), onclick: () => tala(p.sv, true) }, '🐢'))),
        p.over && p.over[hj] ? h('div', { class: 'samtal-over', lang: hj }, p.over[hj]) : null,
        p.tips && p.tips[hj] ? h('div', { class: 'samtal-tips', lang: hj }, '💡 ', p.tips[hj]) : null));
  }

  function laggTill(p) {
    if (!C) return;
    C.logg.push(p);
    if (C.logEl && C.logEl.isConnected) { C.logEl.appendChild(bubbla(p, true)); rullaNer(); }
  }

  function humor(hum) {
    if (!C) return;
    C.hum = hum;
    if (C.figEl) window.Figurer.sattHumor(C.figEl, hum);
    if (C.figEl && C.pratar) C.figEl.classList.add('pratar');
  }

  /** Bosse säger något: munnen rör sig medan rösten läser. Utan röst rör sig munnen en stund ändå. */
  async function tala(text, langsam = false) {
    const g = C ? C.gen : -1;
    if (C) { C.pratar = true; if (C.figEl) C.figEl.classList.add('pratar'); }
    const start = Date.now();
    let ok = false;
    try { ok = await Tal.saga(String(text).replace(/[”“„]/g, ''), { langsam }); } catch (e) { ok = false; }
    if (!ok && !testlage) {
      const kvar = Math.min(3500, 600 + String(text).length * 55) - (Date.now() - start);
      if (kvar > 0) await vanta(kvar);
    }
    if (C && C.gen === g) { C.pratar = false; if (C.figEl) C.figEl.classList.remove('pratar'); }
    return C && C.gen === g;
  }

  async function bosseSager(post, hum) {
    if (!C) return false;
    const g = C.gen;
    laggTill(Object.assign({ vem: 'bosse' }, post));
    if (hum) humor(hum);
    const kvar = await tala(post.sv);
    return kvar && C && C.gen === g;
  }

  function sattFas(fas) { if (!C) return; C.fas = fas; ritaKontroller(); uppdateraPrickar(); }

  async function starta() {
    if (!C || C.fas !== 'start') return;
    if (window.Ljud) window.Ljud.klick();
    await stallFraga();
  }

  async function stallFraga() {
    if (!C) return;
    const st = C.samtal.steg[C.steg];
    C.forsok = 0; C.panel = null; C.meddelande = ''; C.valOrdning = blanda([st.svar.sv].concat(st.val || []));
    sattFas('bosse');
    if (!await bosseSager({ sv: st.sv, over: { en: st.en, pl: st.pl } }, 'glad')) return;
    sattFas('svara');
  }

  const slump = lista => lista[Math.floor(Math.random() * lista.length)];
  const fyll = (mall, svar) => mall.replace('{svar}', '”' + svar + '”');

  async function hanteraSvar(alternativ) {
    if (!C || C.fas !== 'svara') return;
    const g = C.gen;
    const st = C.samtal.steg[C.steg];
    const r = SD.bedom(st, alternativ);
    const hord = r.hord || (Array.isArray(alternativ) ? alternativ[0] : alternativ) || '…';
    C.panel = null; C.meddelande = '';
    laggTill({ vem: 'du', text: hord, typ: r.typ });
    sattFas('bosse');
    if (r.typ === 'ratt') {
      if (C.forsok === 0) C.forstaRatt++;
      if (window.Ljud) window.Ljud.ratt();
      const berom = slump(r.poang >= 0.95 ? SD.FRASER.perfekt : SD.FRASER.bra);
      const sen = st.sen ? ['sv', 'en', 'pl'].reduce((o, k) => {
        o[k] = r.namn ? st.sen[k].replace('{namn}', r.namn) : st.sen[k].replace(/,?\s*\{namn\}/, '');
        return o;
      }, {}) : null;
      const post = { sv: berom.sv + (sen ? ' ' + sen.sv : ''), over: { en: berom.en + (sen ? ' ' + sen.en : ''), pl: berom.pl + (sen ? ' ' + sen.pl : '') }, typ: 'beröm' };
      if (!await bosseSager(post, 'fira')) return;
      await vanta(350);
      if (!C || C.gen !== g) return;
      C.steg++;
      if (C.steg < C.samtal.steg.length) await stallFraga(); else await avsluta();
      return;
    }
    C.forsok++;
    if (window.Ljud) window.Ljud.fel();
    let post;
    if (r.typ === 'kant') {
      const f = SD.FRASER.nastan;
      post = { sv: fyll(f.sv, r.fel.ratt), over: { en: fyll(f.en, r.fel.ratt), pl: fyll(f.pl, r.fel.ratt) }, tips: { en: r.fel.en, pl: r.fel.pl }, typ: 'rattning' };
    } else if (r.typ === 'nastan' || C.forsok >= 2) {
      const f = r.typ === 'nastan' ? SD.FRASER.nastan : SD.FRASER.upprepa;
      post = { sv: fyll(f.sv, st.svar.sv), over: { en: fyll(f.en, st.svar.sv), pl: fyll(f.pl, st.svar.sv) }, tips: { en: st.svar.en, pl: st.svar.pl }, typ: 'rattning' };
    } else {
      const f = SD.FRASER.forstod;
      post = { sv: f.sv, over: { en: f.en, pl: f.pl }, typ: 'rattning' };
    }
    if (!await bosseSager(post, 'trost')) return;
    sattFas('svara');
  }

  async function hoppa() {
    if (!C || C.fas !== 'svara') return;
    const g = C.gen;
    C.panel = null;
    sattFas('bosse');
    const f = SD.FRASER.vidare;
    if (!await bosseSager({ sv: f.sv, over: { en: f.en, pl: f.pl } }, 'glad')) return;
    if (!C || C.gen !== g) return;
    C.steg++;
    if (C.steg < C.samtal.steg.length) await stallFraga(); else await avsluta();
  }

  async function avsluta() {
    if (!C) return;
    const s = C.samtal;
    const andel = C.forstaRatt / s.steg.length;
    C.stjarnor = andel >= 1 ? 3 : andel >= 0.5 ? 2 : 1;
    sparaBast(s.id, C.stjarnor);
    sattFas('bosse');
    if (window.Ljud) window.Ljud.klar();
    if (!await bosseSager({ sv: s.slut.sv, over: { en: s.slut.en, pl: s.slut.pl } }, 'fira')) return;
    sattFas('klar');
  }

  async function lyssna() {
    if (!C || C.fas !== 'svara' || C.lyssnar) return;
    const g = C.gen;
    Tal.tyst();
    C.lyssnar = true; C.meddelande = '';
    humor('tank');
    ritaKontroller();
    try {
      const r = await Tal.kanna({ lang: 'sv-SE', maxMs: 8000 });
      if (!C || C.gen !== g) return;
      C.lyssnar = false;
      humor('glad');
      await hanteraSvar(r.alternativ && r.alternativ.length ? r.alternativ : [r.text]);
    } catch (e) {
      if (!C || C.gen !== g) return;
      C.lyssnar = false;
      C.meddelande = e && e.message ? e.message : String(e);
      humor('glad');
      ritaKontroller();
    }
  }

  // ---------------- Kontrollerna längst ner ----------------
  function ritaKontroller() {
    if (!C || !C.kontrollEl) return;
    const k = tom(C.kontrollEl);
    const st = C.samtal.steg[Math.min(C.steg, C.samtal.steg.length - 1)];
    if (C.fas === 'start') {
      k.appendChild(h('p', { class: 'dampad centrerad liten' }, t('samtal.startInfo')));
      k.appendChild(h('button', { type: 'button', class: 'knapp gron bred samtal-start', onclick: starta }, '▶ ', t('samtal.starta')));
      if (!Tal.kanKanna()) k.appendChild(h('div', { class: 'ruta varning' }, t('samtal.ingenMik')));
      return;
    }
    if (C.fas === 'klar') {
      const s = C.samtal;
      k.appendChild(h('div', { class: 'ruta samtal-klar' },
        h('h2', null, '🎉 ', t('samtal.klar')),
        h('div', { class: 'samtal-stjarnor stora', 'aria-label': C.stjarnor + '/3' }, stjarnor(C.stjarnor)),
        h('p', null, t('samtal.resultat', { ratt: C.forstaRatt, alla: s.steg.length })),
        h('div', { class: 'knapprad' },
          h('button', { type: 'button', class: 'knapp gron', onclick: () => { C = null; gen++; const rot = document.getElementById('vy'); tom(rot); visaSamtal(rot, s.id); } }, t('samtal.igen')),
          h('a', { class: 'knapp bla', href: '#/samtal' }, t('samtal.fler')))));
      return;
    }
    requestAnimationFrame(rullaNer);
    const upptagen = C.fas !== 'svara';
    const mikFinns = Tal.kanKanna();
    if (mikFinns) {
      k.appendChild(h('button', {
        type: 'button', class: 'samtal-mik' + (C.lyssnar ? ' lyssnar' : ''), disabled: upptagen && !C.lyssnar,
        'aria-label': t(C.lyssnar ? 'samtal.lyssnar' : 'samtal.mik'), onclick: lyssna
      }, h('span', { class: 'samtal-mik-ikon', 'aria-hidden': 'true' }, '🎤')));
      k.appendChild(h('div', { class: 'samtal-status' }, t(C.lyssnar ? 'samtal.lyssnar' : upptagen ? 'samtal.vanta' : 'samtal.mik')));
    } else {
      k.appendChild(h('div', { class: 'samtal-status' }, t(upptagen ? 'samtal.vanta' : 'samtal.dinTur')));
    }
    if (C.meddelande) k.appendChild(h('div', { class: 'ruta varning liten' }, C.meddelande));
    const panel = C.panel || (mikFinns ? null : 'skriv');
    k.appendChild(h('div', { class: 'knapprad samtal-verktyg' },
      h('button', { type: 'button', class: 'knapp liten' + (panel === 'hjalp' ? ' bla' : ''), disabled: upptagen, 'data-panel': 'hjalp', onclick: () => { C.panel = panel === 'hjalp' ? null : 'hjalp'; ritaKontroller(); } }, '💡 ', t('samtal.hjalp')),
      h('button', { type: 'button', class: 'knapp liten' + (panel === 'skriv' ? ' bla' : ''), disabled: upptagen, 'data-panel': 'skriv', onclick: () => { C.panel = panel === 'skriv' && mikFinns ? null : 'skriv'; ritaKontroller(); } }, '⌨️ ', t('samtal.skriv')),
      h('button', { type: 'button', class: 'knapp liten' + (panel === 'valj' ? ' bla' : ''), disabled: upptagen, 'data-panel': 'valj', onclick: () => { C.panel = panel === 'valj' ? null : 'valj'; ritaKontroller(); } }, '☰ ', t('samtal.valj')),
      C.forsok >= 2 ? h('button', { type: 'button', class: 'knapp liten gul samtal-hoppa', disabled: upptagen, onclick: hoppa }, t('samtal.hoppa'), ' ➜') : null));
    if (upptagen) return;
    const hj = hjalp();
    if (panel === 'hjalp') {
      k.appendChild(h('div', { class: 'ruta samtal-hjalp' },
        h('div', { class: 'dampad liten' }, t('samtal.duKanSaga')),
        h('div', { class: 'samtal-sv-rad' }, h('b', { lang: 'sv' }, st.svar.sv), window.DOM.hogtalare(st.svar.sv, { liten: true })),
        h('div', { class: 'samtal-over', lang: hj }, st.svar[hj])));
    } else if (panel === 'skriv') {
      const falt = h('input', { class: 'falt', type: 'text', lang: 'sv', autocomplete: 'off', autocapitalize: 'sentences', spellcheck: 'false', 'aria-label': t('samtal.faltEtikett'), placeholder: t('samtal.faltEtikett') });
      const skicka = ev => { ev.preventDefault(); const v = falt.value.trim(); if (v) hanteraSvar([v]); };
      k.appendChild(h('form', { class: 'samtal-skriv', onsubmit: skicka },
        falt,
        h('div', { class: 'knapprad' },
          ...['å', 'ä', 'ö'].map(b => h('button', { type: 'button', class: 'knapp liten bokstav', onclick: () => { falt.value += b; falt.focus(); } }, b)),
          h('button', { type: 'submit', class: 'knapp gron bred' }, t('samtal.skicka')))));
      if (!testlage && mikFinns) setTimeout(() => { try { falt.focus(); } catch (e) { /* ok */ } }, 50);
    } else if (panel === 'valj') {
      k.appendChild(h('div', { class: 'alternativ samtal-val' },
        (C.valOrdning || []).map(v => h('button', { type: 'button', class: 'alt', lang: 'sv', onclick: () => hanteraSvar([v]) }, v))));
    }
  }

  // ---------------- Ingång från app.js ----------------
  function avbryt() { if (C) { gen++; C = null; } try { Tal.tyst(); } catch (e) { /* ok */ } }
  window.addEventListener('hashchange', () => { if (!/^#\/samtal\/./.test(location.hash)) avbryt(); });

  function visa(rot, id) {
    avbryt();
    if (id) visaSamtal(rot, id); else visaLista(rot);
  }
  /** Språkbyte mitt i ett samtal: rita om utan att tappa samtalet. */
  function omrita(rot) {
    if (C && C.rot) { C.rot = rot; ritaAllt(); return true; }
    return false;
  }

  // ---------------- Självtest ----------------
  async function vantaTills(fn, ms = 4000) {
    for (let i = 0; i < ms / 20; i++) { if (fn()) return true; await new Promise(r => setTimeout(r, 20)); }
    return !!fn();
  }

  /** Körs från app.js (?sjalvtest=1). gaTill(hash, selektor) byter vy och väntar tills selektorn syns. */
  async function sjalvtest(fel, gaTill) {
    testlage = true;
    minnesLager = { hjalp: 'en' };
    try {
      const raa = await (await fetch('data/samtal.json', { cache: 'no-cache' })).json();
      SD.validera(raa).slice(0, 10).forEach(f => fel.push('samtal: ' + f));
      const r = await ladda();
      if (!r.ok) { fel.push('samtal: kunde inte laddas ' + r.fel); return; }
      const rot = await gaTill('#/samtal', '.samtal-kort');
      if (rot.querySelectorAll('.samtal-kort').length !== r.samtal.length) fel.push('samtal: listan visar ' + rot.querySelectorAll('.samtal-kort').length + ' samtal');
      for (const s of r.samtal) {
        await gaTill('#/samtal/' + s.id, '.samtal-start');
        rot.querySelector('.samtal-start').click();
        if (!await vantaTills(() => C && C.fas === 'svara')) { fel.push(`samtal ${s.id}: kom aldrig till svara`); continue; }
        if (!rot.querySelector('.samtal-bubbla.bosse .samtal-over[lang="en"]')) fel.push(`samtal ${s.id}: engelsk översättning saknas`);
        // Fel svar via "Välj svar": samma steg, rättning visas.
        rot.querySelector('[data-panel="valj"]').click();
        const felKnapp = Array.from(rot.querySelectorAll('.samtal-val .alt')).find(b => b.textContent === s.steg[0].val[0]);
        if (!felKnapp || rot.querySelectorAll('.samtal-val .alt').length !== 3) { fel.push(`samtal ${s.id}: välj svar visar inte tre alternativ`); continue; }
        felKnapp.click();
        await vantaTills(() => C && C.fas === 'svara');
        if (C.steg !== 0 || !rot.querySelector('.samtal-bubbla.du.fel')) fel.push(`samtal ${s.id}: fel svar godkändes`);
        // Rätt svar skrivet: alla steg (första steget i "hej" med ett eget namn).
        for (let i = 0; i < s.steg.length; i++) {
          if (!await vantaTills(() => C && C.fas === 'svara' && C.steg === i)) { fel.push(`samtal ${s.id}: fastnade i steg ${i + 1}`); break; }
          rot.querySelector('[data-panel="skriv"]').click();
          const falt = rot.querySelector('.samtal-skriv input');
          falt.value = s.id === 'hej' && i === 0 ? 'Jag heter Marc' : s.steg[i].svar.sv;
          rot.querySelector('.samtal-skriv button[type="submit"]').click();
          if (s.id === 'hej' && i === 0) {
            await vantaTills(() => C && C.steg === 1);
            if (!Array.from(rot.querySelectorAll('.samtal-sv')).some(e => /Marc!/.test(e.textContent))) fel.push('samtal: namnet fångades inte');
          }
        }
        if (!await vantaTills(() => rot.querySelector('.samtal-klar'))) { fel.push(`samtal ${s.id}: blev aldrig klart`); continue; }
        if (C.forstaRatt !== s.steg.length - 1) fel.push(`samtal ${s.id}: räknade ${C.forstaRatt} rätt på första försöket`);
        // Hjälpspråket byts till polska och tillbaka.
        rot.querySelector('.hjalpval [data-hjalp="pl"]').click();
        if (!rot.querySelector('.samtal-over[lang="pl"]')) fel.push(`samtal ${s.id}: polska översättningen visas inte`);
        rot.querySelector('.hjalpval [data-hjalp="en"]').click();
      }
    } catch (e) {
      fel.push('samtal undantag: ' + (e && e.stack || e));
    } finally {
      avbryt();
      testlage = false;
      minnesLager = null;
    }
  }

  window.Samtal = { visa, omrita, sjalvtest };
})();
