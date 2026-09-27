/* kort.js – Flashcards: framsidan polska + engelska, baksidan svenska.
 * Lekar A1–C2 + Medicin (data/kort-*.json). Leitner-lådor 1–5 sparas i localStorage (alltid try/catch).
 * Vyer: #/kort (leklistan) och #/kort/<lek> (övning). */
(function () {
  'use strict';
  const { h, tom, blanda } = window.DOM;
  const Tal = window.Tal;
  const I18n = window.I18n;
  const KortData = window.KortData;
  const t = I18n.t;

  const LAGRING = 'svenskaord.kort.v1';
  const DAG = 24 * 60 * 60 * 1000;
  // Låda -> tid tills kortet kommer tillbaka. Låda 1 = samma pass.
  const INTERVALL = [0, 0, DAG, 3 * DAG, 7 * DAG, 21 * DAG];
  const MAX_LADA = 5;
  const IKON = { a1: '🌼', a2: '🌲', b1: '🛶', b2: '⛰️', c1: '🌌', c2: '👑', medicin: '🩺' };
  const SVEP = 70; // px

  let testlage = false;   // sjalvtest: inget sparas
  let minnesLager = {};   // används när localStorage inte går (eller i testläge)

  // ---------------- Lagring ----------------
  function lasAllt() {
    if (testlage) return minnesLager;
    try {
      const s = window.localStorage.getItem(LAGRING);
      const v = s ? JSON.parse(s) : {};
      return v && typeof v === 'object' ? v : {};
    } catch (e) { console.warn('Kunde inte läsa flashcards', e); return minnesLager; }
  }
  function skrivAllt(v) {
    minnesLager = v;
    if (testlage) return;
    try { window.localStorage.setItem(LAGRING, JSON.stringify(v)); }
    catch (e) { console.warn('Kunde inte spara flashcards', e); }
  }
  function lekStatus(lek) { const a = lasAllt(); return (a[lek] && typeof a[lek] === 'object') ? a[lek] : {}; }
  function sparaKort(lek, id, post) { const a = lasAllt(); a[lek] = a[lek] || {}; a[lek][id] = post; skrivAllt(a); }
  function nollstall(lek) { const a = lasAllt(); delete a[lek]; skrivAllt(a); }

  // ---------------- Data ----------------
  const cache = {};
  /** Laddar en lek. Löses med {ok:true, data} eller {ok:false, saknas, fel}. Kraschar aldrig. */
  function laddaLek(lek) {
    if (!cache[lek]) {
      cache[lek] = (async () => {
        try {
          const r = await fetch(`data/kort-${lek}.json`, { cache: 'no-cache' });
          if (!r.ok) return { ok: false, saknas: true, fel: 'HTTP ' + r.status };
          const data = await r.json();
          const fel = KortData.validera(data, lek, { minKort: 1 });
          const kort = Array.isArray(data.kort) ? data.kort.filter(k => k && k.id && k.sv && (k.pl || k.en)) : [];
          if (!kort.length) return { ok: false, saknas: true, fel: fel[0] || 'tom lek' };
          if (fel.length) console.warn(`kort-${lek}.json:`, fel.slice(0, 5));
          return { ok: true, data: Object.assign({}, data, { kort }) };
        } catch (e) {
          console.warn('Leken kunde inte laddas', lek, e);
          return { ok: false, saknas: true, fel: e.message };
        }
      })();
    }
    return cache[lek];
  }
  function laddaAlla() { return Promise.all(KortData.LEKAR.map(l => laddaLek(l).then(r => [l, r]))); }

  function lekTitel(lek, data) {
    const s = I18n.sprak;
    return (data && data.titel && data.titel[s]) || t('kort.lek.' + lek);
  }
  function rakna(lek, kort) {
    const st = lekStatus(lek);
    const nu = Date.now();
    let kan = 0, nu_ = 0, nya = 0;
    for (const k of kort) {
      const p = st[k.id];
      if (!p) { nya++; continue; }
      if (p.b >= 3) kan++;
      if (p.d <= nu) nu_++;
    }
    return { kan, repetera: nu_, nya, alla: kort.length };
  }

  /** Det som läses upp: utan förklaringar inom parentes, t.ex. "mjölk (en)" -> "mjölk". */
  function uttal(sv) { return String(sv).replace(/\s*\([^)]*\)/g, '').trim() || sv; }

  // Play-knapp per ord: läser upp på rätt språk (tal.js väljer bästa rösten). Vänder inte kortet.
  const ROSTSPRAK = { pl: 'pl-PL', en: 'en-GB', sv: 'sv-SE' };
  function spela(text, sprak, { liten = false } = {}) {
    const lang = ROSTSPRAK[sprak];
    return h('button', {
      type: 'button', class: 'hogtalare kort-spela' + (liten ? ' liten' : ''), 'data-sprak': sprak,
      'aria-label': t('kort.spela.' + sprak, { text }), title: t('kort.spela.' + sprak, { text }),
      onpointerdown: ev => ev.stopPropagation(),
      onkeydown: ev => ev.stopPropagation(),
      onclick: async ev => {
        ev.stopPropagation();
        if (testlage) return;
        const r = await Tal.sagaSprak(sprak === 'sv' ? uttal(text) : text, lang);
        visaHint(!Tal.finnsUppläsning ? t('kort.ingenUppl') : (!r.harRost ? t('kort.ingenRost.' + sprak) : ''));
      }
    }, '🔊');
  }
  function visaHint(text) {
    const el = P && P.rot && P.rot.querySelector('.kort-hint');
    if (!el) return;
    el.textContent = text;
    el.hidden = !text;
  }

  // ---------------- Leklistan ----------------
  let listaVersion = 0;
  function visaLista(rot) {
    const version = ++listaVersion;
    rot.appendChild(h('h1', null, t('kort.rubrik')));
    rot.appendChild(h('p', { class: 'dampad' }, t('kort.info')));
    const grid = h('div', { class: 'lekar' });
    rot.appendChild(grid);
    for (const lek of KortData.LEKAR) {
      grid.appendChild(h('div', { class: 'lek laddar', 'data-lek': lek },
        h('span', { class: 'lek-ikon', 'aria-hidden': 'true' }, IKON[lek]),
        h('span', { class: 'lek-namn' }, t('kort.lek.' + lek)),
        h('span', { class: 'dampad liten' }, t('laddar'))));
    }
    laddaAlla().then(res => {
      if (version !== listaVersion || !grid.isConnected) return;
      tom(grid);
      for (const [lek, r] of res) grid.appendChild(lekRuta(lek, r));
    });
  }

  function lekRuta(lek, r) {
    if (!r.ok) {
      return h('div', { class: 'lek snart', 'data-lek': lek, 'aria-disabled': 'true' },
        h('span', { class: 'lek-ikon', 'aria-hidden': 'true' }, IKON[lek]),
        h('span', { class: 'lek-namn' }, t('kort.lek.' + lek)),
        h('span', { class: 'lek-snart' }, t('kort.snart')));
    }
    const kort = r.data.kort;
    const s = rakna(lek, kort);
    const andel = Math.round(s.kan / s.alla * 100);
    const nollKnapp = h('button', {
      type: 'button', class: 'lek-noll', title: t('kort.nollstall'), 'aria-label': t('kort.nollstallLek', { lek: lekTitel(lek, r.data) }),
      onclick: ev => {
        ev.preventDefault(); ev.stopPropagation();
        if (!window.confirm(t('kort.nollstallFraga', { lek: lekTitel(lek, r.data) }))) return;
        nollstall(lek);
        ruta.replaceWith(lekRuta(lek, r));
      }
    }, '↺');
    const ruta = h('a', { class: 'lek', href: '#/kort/' + lek, 'data-lek': lek },
      h('span', { class: 'lek-ikon', 'aria-hidden': 'true' }, IKON[lek]),
      h('span', { class: 'lek-namn' }, lekTitel(lek, r.data)),
      h('span', { class: 'lek-antal' }, t('kort.antal', { n: s.alla })),
      h('span', { class: 'lek-kan' }, t('kort.kanAv', { kan: s.kan, alla: s.alla })),
      h('span', { class: 'stapel', 'aria-hidden': 'true' }, h('span', { style: { width: andel + '%' } })),
      h('span', { class: 'dampad liten' }, s.repetera ? t('kort.attRepetera', { n: s.repetera }) : t('kort.nyaKort', { n: s.nya })),
      s.alla - s.nya > 0 ? nollKnapp : null);
    return ruta;
  }

  // ---------------- Övningen ----------------
  let P = null; // aktuellt pass

  function byggKo(lek, kort, { alla = false } = {}) {
    const st = lekStatus(lek);
    const nu = Date.now();
    if (alla) return blanda(kort.slice());
    const forfallna = kort.filter(k => st[k.id] && st[k.id].d <= nu).sort((a, b) => st[a.id].d - st[b.id].d);
    const nya = kort.filter(k => !st[k.id]);
    return forfallna.concat(nya);
  }

  function visaLek(rot, lek) {
    rot.appendChild(h('p', { class: 'dampad centrerad' }, t('laddar')));
    const version = ++listaVersion;
    laddaLek(lek).then(r => {
      if (version !== listaVersion || !rot.isConnected) return;
      tom(rot);
      if (!r.ok) {
        rot.appendChild(tillbaka());
        rot.appendChild(h('div', { class: 'ruta' }, h('h2', null, t('kort.lek.' + lek)), h('p', null, t('kort.snartInfo'))));
        return;
      }
      P = { lek, data: r.data, ko: byggKo(lek, r.data.kort), vand: false, gjorda: 0, rot };
      ritaPass();
    });
  }

  function tillbaka() {
    return h('a', { class: 'knapp liten', href: '#/kort' }, '← ', t('kort.allaLekar'));
  }

  function ritaPass() {
    const { rot, data, lek } = P;
    tom(rot);
    const s = rakna(lek, data.kort);
    rot.appendChild(h('div', { class: 'kort-topp' },
      tillbaka(),
      h('h1', { class: 'kort-titel' }, IKON[lek] + ' ' + lekTitel(lek, data))));
    rot.appendChild(h('p', { class: 'dampad kort-rad' },
      t('kort.kvar', { n: P.ko.length }), ' · ', t('kort.kanAv', { kan: s.kan, alla: s.alla })));

    if (!P.ko.length) {
      rot.appendChild(h('div', { class: 'ruta centrerad kort-klart' },
        h('div', { class: 'stor-emoji', 'aria-hidden': 'true' }, '🎉'),
        h('h2', null, t('kort.klartIdag')),
        h('p', { class: 'dampad' }, t('kort.klartInfo')),
        h('div', { class: 'knapprad centrerad-rad' },
          h('button', { type: 'button', class: 'knapp bla', onclick: () => { P.ko = byggKo(lek, data.kort, { alla: true }); P.vand = false; ritaPass(); } }, t('kort.ovaAnda')),
          h('a', { class: 'knapp', href: '#/kort' }, t('kort.allaLekar')))));
      return;
    }

    const k = P.ko[0];
    const lada = (lekStatus(lek)[k.id] || {}).b || 0;
    const fram = h('div', { class: 'sida fram', 'aria-hidden': P.vand ? 'true' : 'false' },
      h('span', { class: 'kort-lada' }, lada ? t('kort.lada', { n: lada }) : t('kort.nytt')),
      h('div', { class: 'kort-rad-sprak' }, h('span', { class: 'sprak-etikett pl' }, h('span', { class: 'sprak-flagga flagga-pl', 'aria-hidden': 'true' }), 'PL'),
        h('span', { class: 'kort-ord-rad' }, h('span', { class: 'kort-ord', lang: 'pl' }, k.pl || '–'), k.pl ? spela(k.pl, 'pl', { liten: true }) : null)),
      h('div', { class: 'kort-rad-sprak' }, h('span', { class: 'sprak-etikett en' }, h('span', { class: 'sprak-flagga flagga-en', 'aria-hidden': 'true' }), 'EN'),
        h('span', { class: 'kort-ord-rad' }, h('span', { class: 'kort-ord', lang: 'en' }, k.en || '–'), k.en ? spela(k.en, 'en', { liten: true }) : null)),
      h('span', { class: 'kort-tips dampad' }, t('kort.vandTips')));
    const bak = h('div', { class: 'sida bak', 'aria-hidden': P.vand ? 'false' : 'true' },
      h('span', { class: 'kort-lada' }, h('span', { class: 'sprak-flagga flagga-sv', 'aria-hidden': 'true' }), ' SV'),
      h('div', { class: 'kort-sv-rad' }, h('span', { class: 'kort-sv', lang: 'sv' }, k.sv), spela(k.sv, 'sv')),
      k.exempel_sv ? h('div', { class: 'kort-exempel' }, h('span', { lang: 'sv' }, k.exempel_sv), spela(k.exempel_sv, 'sv', { liten: true })) : null,
      h('span', { class: 'kort-sma dampad' }, [k.pl, k.en].filter(Boolean).join(' · ')),
      k.kategori ? h('span', { class: 'kort-kategori' }, k.kategori) : null);
    const inre = h('div', { class: 'flip-inre' }, fram, bak);
    const kortEl = h('div', {
      class: 'flipkort' + (P.vand ? ' vand' : ''), role: 'button', tabindex: '0',
      'aria-label': P.vand ? k.sv : `PL: ${k.pl}. EN: ${k.en}. ${t('kort.vandTips')}`,
      'aria-pressed': P.vand ? 'true' : 'false'
    }, inre);
    kopplaSvep(kortEl);
    kortEl.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); vand(); } });
    rot.appendChild(h('div', { class: 'flip-scen' }, kortEl));
    rot.appendChild(h('p', { class: 'kort-hint dampad liten', role: 'status', hidden: true }));

    const betyg = h('div', { class: 'betyg' + (P.vand ? '' : ' dold') },
      h('button', { type: 'button', class: 'knapp rod', 'data-betyg': '1', onclick: () => betygsatt(1) }, t('kort.kanInte')),
      h('button', { type: 'button', class: 'knapp gul', 'data-betyg': '2', onclick: () => betygsatt(2) }, t('kort.svart')),
      h('button', { type: 'button', class: 'knapp gron', 'data-betyg': '3', onclick: () => betygsatt(3) }, t('kort.kan')));
    const vandKnapp = h('button', { type: 'button', class: 'knapp bla bred vand-knapp' + (P.vand ? ' dold' : ''), onclick: () => vand() }, t('kort.vand'));
    rot.appendChild(h('div', { class: 'kort-fot' }, vandKnapp, betyg));
    rot.appendChild(h('div', { class: 'knapprad kort-verktyg' },
      h('button', { type: 'button', class: 'knapp liten', onclick: () => { P.ko = blanda(P.ko); P.vand = false; ritaPass(); } }, '🔀 ', t('kort.blanda')),
      h('span', { class: 'dampad liten' }, t('kort.tangenter'))));
    P.kortEl = kortEl;
    P.betygEl = betyg;
    P.vandKnapp = vandKnapp;
  }

  function vand(till) {
    if (!P || !P.kortEl) return;
    P.vand = typeof till === 'boolean' ? till : !P.vand;
    P.kortEl.classList.toggle('vand', P.vand);
    P.kortEl.setAttribute('aria-pressed', P.vand ? 'true' : 'false');
    const k = P.ko[0];
    P.kortEl.setAttribute('aria-label', P.vand ? k.sv : `PL: ${k.pl}. EN: ${k.en}. ${t('kort.vandTips')}`);
    P.kortEl.querySelector('.fram').setAttribute('aria-hidden', P.vand ? 'true' : 'false');
    P.kortEl.querySelector('.bak').setAttribute('aria-hidden', P.vand ? 'false' : 'true');
    P.betygEl.classList.toggle('dold', !P.vand);
    P.vandKnapp.classList.toggle('dold', P.vand);
    if (P.vand && !testlage) Tal.saga(uttal(k.sv));
  }

  /** 1 = kan inte, 2 = svårt, 3 = kan. Leitner: kan -> nästa låda, kan inte -> låda 1, svårt -> kvar. */
  function betygsatt(v) {
    if (!P || !P.ko.length) return;
    const k = P.ko.shift();
    const st = lekStatus(P.lek);
    const gammal = st[k.id] || { b: 0 };
    const nu = Date.now();
    let b;
    if (v === 3) b = Math.min(MAX_LADA, Math.max(1, gammal.b) + 1);
    else if (v === 2) b = Math.max(1, Math.min(gammal.b || 1, 2));
    else b = 1;
    sparaKort(P.lek, k.id, { b, d: nu + INTERVALL[b], n: (gammal.n || 0) + 1 });
    // Kan inte / svårt: kortet kommer tillbaka senare i samma pass.
    if (v === 1) P.ko.splice(Math.min(3, P.ko.length), 0, k);
    else if (v === 2) P.ko.splice(Math.min(8, P.ko.length), 0, k);
    P.gjorda++;
    P.vand = false;
    Tal.tyst();
    ritaPass();
    const nytt = P.rot.querySelector('.flipkort');
    if (nytt && !testlage) nytt.focus({ preventScroll: true });
  }

  // Svep: vänster = kan inte, höger = kan (när kortet är vänt). Kort tryck vänder.
  function kopplaSvep(el) {
    let x0 = null, y0 = 0, dx = 0, id = null;
    el.addEventListener('pointerdown', ev => {
      if (ev.target.closest('button')) return;
      x0 = ev.clientX; y0 = ev.clientY; dx = 0; id = ev.pointerId;
    });
    el.addEventListener('pointermove', ev => {
      if (x0 === null || ev.pointerId !== id) return;
      dx = ev.clientX - x0;
      if (P.vand && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(ev.clientY - y0)) {
        el.style.transition = 'none';
        el.style.transform = `translateX(${dx}px) rotate(${dx / 25}deg)`;
        el.classList.toggle('svep-v', dx < -SVEP);
        el.classList.toggle('svep-h', dx > SVEP);
      }
    });
    const slut = ev => {
      if (x0 === null || (ev && ev.pointerId !== id)) return;
      const d = dx;
      x0 = null;
      el.style.transition = '';
      el.style.transform = '';
      el.classList.remove('svep-v', 'svep-h');
      if (Math.abs(d) < 10) { if (ev && ev.type === 'pointerup' && !ev.target.closest('button')) vand(); return; }
      if (P.vand && d > SVEP) betygsatt(3);
      else if (P.vand && d < -SVEP) betygsatt(1);
    };
    el.addEventListener('pointerup', slut);
    el.addEventListener('pointercancel', slut);
    el.addEventListener('pointerleave', ev => { if (x0 !== null && ev.pointerType === 'mouse') slut(ev); });
  }

  document.addEventListener('keydown', ev => {
    if (!P || !P.kortEl || !P.kortEl.isConnected) return;
    if (ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA' || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (ev.key === ' ' || ev.key === 'Spacebar') { ev.preventDefault(); vand(); }
    else if (P.vand && (ev.key === '1' || ev.key === 'ArrowLeft')) { ev.preventDefault(); betygsatt(1); }
    else if (P.vand && ev.key === '2') { ev.preventDefault(); betygsatt(2); }
    else if (P.vand && (ev.key === '3' || ev.key === 'ArrowRight')) { ev.preventDefault(); betygsatt(3); }
  });

  // ---------------- Ingång från app.js ----------------
  function visa(rot, lek) {
    if (P && P.kortEl) Tal.tyst();
    P = null;
    if (lek && KortData.LEKAR.includes(lek)) visaLek(rot, lek);
    else visaLista(rot);
  }
  /** Språkbyte mitt i ett pass: rita om utan att tappa kön. */
  function omrita(rot) {
    if (P && P.data && P.kortEl && P.kortEl.isConnected) { P.rot = rot; ritaPass(); return true; }
    return false;
  }

  // ---------------- Självtest ----------------
  /** Körs från app.js (?sjalvtest=1). gaTill(hash, selektor) byter vy via appen och väntar tills selektorn syns. */
  async function sjalvtest(fel, gaTill) {
    testlage = true;
    minnesLager = {};
    try {
      const res = await laddaAlla();
      for (const [lek, r] of res) {
        if (!r.ok) {
          if (KortData.NIVALEKAR.includes(lek)) fel.push(`flashcards: leken ${lek} kunde inte laddas (${r.fel})`);
          continue;
        }
        // Validera den råa filen (inte den filtrerade).
        const raa = await (await fetch(`data/kort-${lek}.json`, { cache: 'no-cache' })).json();
        KortData.validera(raa, lek).slice(0, 10).forEach(f => fel.push('flashcards: ' + f));
      }
      // Leklistan: alla lekar syns, laddade eller "kommer snart".
      const rot = await gaTill('#/kort', '.lekar .lek:not(.laddar)');
      if (rot.querySelectorAll('.lek').length !== KortData.LEKAR.length) fel.push('flashcards: leklistan visar ' + rot.querySelectorAll('.lek').length + ' lekar');
      // Ett pass i A1: vänd, betygsätt på alla tre sätt.
      await gaTill('#/kort/a1', '.flipkort');
      const kortEl = rot.querySelector('.flipkort');
      if (!kortEl || !P) { fel.push('flashcards: inget kort visas i A1'); return; }
      if (!kortEl.querySelector('.fram [lang="pl"]') || !kortEl.querySelector('.fram [lang="en"]')) fel.push('flashcards: framsidan saknar PL eller EN');
      if (!kortEl.querySelector('.bak [lang="sv"]')) fel.push('flashcards: baksidan saknar svenska');
      if (!kortEl.querySelector('.fram .kort-spela[data-sprak="pl"]') || !kortEl.querySelector('.fram .kort-spela[data-sprak="en"]') || !kortEl.querySelector('.bak .kort-spela[data-sprak="sv"]')) fel.push('flashcards: play-knapp saknas för pl/en/sv');
      kortEl.querySelector('.fram .kort-spela[data-sprak="pl"]').click();
      if (P.vand) fel.push('flashcards: play-knappen vände kortet');
      const fore = P.ko.length;
      const forst = P.ko[0].id;
      vand();
      if (!rot.querySelector('.flipkort.vand')) fel.push('flashcards: kortet vändes inte');
      if (rot.querySelector('.betyg.dold')) fel.push('flashcards: betygsknapparna syns inte efter vändning');
      betygsatt(3);
      if (P.ko.length !== fore - 1) fel.push('flashcards: "Kan" tog inte bort kortet ur kön');
      if (!lekStatus('a1')[forst] || lekStatus('a1')[forst].b !== 2) fel.push('flashcards: "Kan" flyttade inte kortet till låda 2');
      const andra = P.ko[0].id;
      vand(); betygsatt(1);
      if (P.ko[3] && P.ko[3].id !== andra) fel.push('flashcards: "Kan inte" lade inte tillbaka kortet i kön');
      vand(); betygsatt(2);
      if (rakna('a1', P.data.kort).nya !== P.data.kort.length - 3) fel.push('flashcards: räkningen av nya kort stämmer inte');
      // Språkbyte mitt i passet: knapparna följer med och kön finns kvar.
      const ko = P.ko.length;
      const forraSprak = I18n.sprak;
      for (const sp of ['en', 'pl', 'sv']) {
        I18n.setSprak(sp);
        vand(true);
        const b = rot.querySelector('.betyg [data-betyg="3"]');
        if (!b || b.textContent !== t('kort.kan')) fel.push('flashcards: knapparna följde inte språkbytet till ' + sp);
        if (!P || P.ko.length !== ko) fel.push('flashcards: språkbytet tappade kön (' + sp + ')');
      }
      I18n.setSprak(forraSprak);
      nollstall('a1');
      if (Object.keys(lekStatus('a1')).length) fel.push('flashcards: återställningen tömde inte leken');
    } catch (e) {
      fel.push('flashcards undantag: ' + (e && e.stack || e));
    } finally {
      P = null;
      testlage = false;
      minnesLager = {};
    }
  }

  window.Kort = { visa, omrita, sjalvtest };
})();
