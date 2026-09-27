/* lexikon.js – ordboksläget: tryck på ett svenskt ord på ett flashcard och få en ruta med grundform, ordklass,
 * översättning (pl/en), definition, andra exempelmeningar och länkar ut.
 * Källor: sajtens egna lekar (data/kort-*.json) + words.json, sedan engelska Wiktionary (REST, CORS öppen)
 * med cache i minnet, tidsgräns och tyst reserv. Inga översättningar hittas på – saknas en visas det och länkas ut. */
(function () {
  'use strict';
  const { h, tom } = window.DOM;
  const Tal = window.Tal;
  const I18n = window.I18n;
  const t = I18n.t;

  const WIKT_MS = 5000;
  const MAX_EXEMPEL = 6;
  const MAX_FRASER = 5;

  // ---------------- Böjning -> grundform ----------------
  // Oregelbundna former (verb, substantiv, adjektiv). Värdet är grundformen utan "att"/"en"/"ett".
  const OREGELBUNDNA = {};
  [
    ['vara', 'är var varit'], ['ha', 'har hade haft'], ['gå', 'går gick gått'], ['göra', 'gör gjorde gjort'],
    ['säga', 'säger sa sade sagt'], ['ta', 'tar tog tagit'], ['komma', 'kom kommit'], ['se', 'ser såg sett'],
    ['få', 'får fick fått'], ['dricka', 'drack druckit'], ['äta', 'äter åt ätit'], ['skriva', 'skrev skrivit'],
    ['sitta', 'satt suttit'], ['stå', 'står stod stått'], ['ligga', 'låg legat'], ['sova', 'sov sovit'],
    ['ge', 'ger gav gett givit'], ['veta', 'vet visste vetat'], ['kunna', 'kan kunde kunnat'],
    ['vilja', 'vill ville velat'], ['skola', 'ska skall skulle'], ['bli', 'blir blev blivit'], ['bära', 'bär bar burit'],
    ['dra', 'drar drog dragit'], ['finna', 'fann funnit'], ['flyga', 'flög flugit'], ['fara', 'for farit'],
    ['förstå', 'förstår förstod förstått'], ['gråta', 'grät gråtit'], ['hålla', 'håller höll hållit'],
    ['låta', 'låter lät låtit'], ['le', 'ler log lett'], ['sjunga', 'sjöng sjungit'], ['slå', 'slår slog slagit'],
    ['välja', 'väljer valde valt'], ['sälja', 'säljer sålde sålt'], ['lägga', 'lägger lade la lagt'],
    ['sätta', 'sätter satte'], ['be', 'ber bad bett'], ['falla', 'faller föll fallit'], ['springa', 'sprang sprungit'],
    ['hinna', 'hann hunnit'], ['vinna', 'vann vunnit'], ['försvinna', 'försvann försvunnit'], ['bjuda', 'bjöd bjudit'],
    ['frysa', 'frös frusit'], ['njuta', 'njöt njutit'], ['skjuta', 'sköt skjutit'], ['bryta', 'bröt brutit'],
    ['välja', 'väljer'], ['heta', 'hette'], ['glädja', 'gläder gladde glatt'], ['dö', 'dör dog dött'],
    ['bo', 'bor bodde bott'], ['tro', 'tror trodde trott'], ['må', 'mår mådde mått'], ['gråta', 'gråter'],
    ['bok', 'böcker böckerna'], ['man', 'män männen'], ['hand', 'händer händerna'], ['fot', 'fötter fötterna'],
    ['tand', 'tänder tänderna'], ['stad', 'städer städerna'], ['land', 'länder länderna'], ['mus', 'möss'],
    ['gås', 'gäss'], ['öga', 'ögon ögonen'], ['öra', 'öron öronen'], ['barn', 'barnen'], ['bror', 'bröder bröderna'],
    ['mor', 'mödrar'], ['far', 'fäder'], ['dotter', 'döttrar döttrarna'], ['natt', 'nätter nätterna'],
    ['bra', 'bättre bäst'], ['stor', 'större störst'], ['liten', 'litet lilla små mindre minst'],
    ['gammal', 'gammalt gamla äldre äldst'], ['dålig', 'sämre sämst'], ['många', 'fler flest'],
    ['mycket', 'mer mera mest'], ['ung', 'yngre yngst'], ['lång', 'längre längst'], ['hög', 'högre högst'],
    ['låg', 'lägre lägst'], ['tung', 'tyngre tyngst']
  ].forEach(([grund, former]) => former.split(' ').forEach(f => { if (!OREGELBUNDNA[f]) OREGELBUNDNA[f] = grund; }));
  const ANDELSER = ['arnas', 'ernas', 'ornas', 'arna', 'erna', 'orna', 'heten', 'ande', 'ende', 'aste', 'ade', 'are',
    'ast', 'ens', 'ets', 'nas', 'en', 'et', 'na', 'ar', 'er', 'or', 'de', 'te', 'da', 'ta', 'n', 't', 's', 'r', 'a', 'e'];

  function normalisera(s) { return String(s || '').toLowerCase().replace(/[’']/g, '').trim(); }
  /** Ta bort artikel/att/förklaringar: "ett hus" -> "hus", "att läsa" -> "läsa", "mjölk (en)" -> "mjölk". */
  function huvudord(sv) {
    return normalisera(sv).replace(/\s*\([^)]*\)/g, '').replace(/^(en|ett|att)\s+/, '').replace(/[?!.,]+$/, '').trim();
  }
  /** Tänkbara grundformer för en ordform, i ordning (exakt form först). */
  function grundformer(ord) {
    const w = normalisera(ord);
    const ut = [w];
    const lagg = x => { if (x && x.length >= 1 && !ut.includes(x)) ut.push(x); };
    if (OREGELBUNDNA[w]) lagg(OREGELBUNDNA[w]);
    for (const e of ANDELSER) {
      if (w.length - e.length < 2 || !w.endsWith(e)) continue;
      const stam = w.slice(0, -e.length);
      lagg(stam);
      if (OREGELBUNDNA[stam]) lagg(OREGELBUNDNA[stam]);
      lagg(stam + 'a');
      lagg(stam + 'e');
      if (/(.)\1$/.test(stam)) lagg(stam.slice(0, -1)); // grönt -> grön(n)? / hunnit
    }
    return ut;
  }

  // ---------------- Lexikonet ----------------
  let lexLofte = null;
  let LEX = null; // { poster: Map(grund -> post), meningar: [{sv, kalla}], meningIndex: Map(grund -> Set(i)) }

  function ordklassFran(sv, oklass) {
    const n = normalisera(sv);
    if (oklass) return oklass;
    if (/^(en|ett)\s/.test(n) || /\((en|ett)\)$/.test(n)) return 'substantiv';
    if (/^att\s/.test(n)) return 'verb';
    if (/\s/.test(huvudord(sv))) return 'fras';
    return '';
  }
  function genus(sv) {
    const n = normalisera(sv);
    const m = n.match(/^(en|ett)\s/) || n.match(/\((en|ett)\)$/);
    return m ? m[1] : '';
  }

  async function bygg() {
    const poster = new Map();
    const meningar = [];
    const lagg = (sv, { pl, en, oklass, kalla, ex }) => {
      const g = huvudord(sv);
      if (!g) return;
      let p = poster.get(g);
      if (!p) { p = { grund: g, visning: [], pl: [], en: [], ordklass: [], genus: '', kallor: [] }; poster.set(g, p); }
      const ok = ordklassFran(sv, oklass);
      const visa = /^(en|ett|att)\s/.test(normalisera(sv)) ? String(sv).replace(/\s*\([^)]*\)/g, '') :
        (genus(sv) ? `${genus(sv)} ${g}` : String(sv).replace(/\s*\([^)]*\)/g, ''));
      if (!p.visning.includes(visa)) p.visning.push(visa);
      if (pl && !p.pl.includes(pl)) p.pl.push(pl);
      if (en && !p.en.includes(en)) p.en.push(en);
      if (ok && !p.ordklass.includes(ok)) p.ordklass.push(ok);
      if (!p.genus && genus(sv)) p.genus = genus(sv);
      if (kalla && !p.kallor.includes(kalla)) p.kallor.push(kalla);
      if (ex) meningar.push({ sv: ex, kalla });
    };
    const data = window.SvenskaOrd && window.SvenskaOrd.data;
    if (data && Array.isArray(data.ord)) {
      for (const o of data.ord) lagg(o.sv, { pl: o.pl, en: o.en, oklass: o.ordklass, kalla: 'ordlista', ex: o.ex && o.ex.sv });
    }
    const lekar = window.Kort && window.Kort.laddaAlla ? await window.Kort.laddaAlla() : [];
    for (const [lek, r] of lekar) {
      if (!r.ok) continue;
      for (const k of r.data.kort) lagg(k.sv, { pl: k.pl, en: k.en, kalla: lek, ex: k.exempel_sv });
    }
    // Varje exempelmening indexeras på grundformerna av sina ord, så att "huset" hittar meningar med "husen".
    const meningIndex = new Map();
    meningar.forEach((m, i) => {
      for (const ord of tokens(m.sv)) {
        const g = slaUpp(ord, poster);
        if (!g) continue;
        if (!meningIndex.has(g)) meningIndex.set(g, new Set());
        meningIndex.get(g).add(i);
      }
    });
    return { poster, meningar, meningIndex };
  }
  function lexikon() {
    if (!lexLofte) lexLofte = bygg().then(l => { LEX = l; return l; }).catch(e => { console.warn('Lexikonet kunde inte byggas', e); lexLofte = null; throw e; });
    return lexLofte;
  }
  function tokens(mening) { return (String(mening).match(/[A-Za-zÅÄÖåäöÉéÜü-]+/g) || []).filter(w => /[a-zåäöéü]/i.test(w)); }
  /** Grundformen som finns i lexikonet, eller null. */
  function slaUpp(ord, poster = LEX && LEX.poster) {
    if (!poster) return null;
    for (const g of grundformer(ord)) if (poster.has(g)) return g;
    return null;
  }

  // ---------------- Wiktionary ----------------
  const wiktCache = new Map();
  let natAv = false; // sjalvtest: inga nätanrop
  function textUrHtml(html) {
    try { return (new DOMParser().parseFromString(String(html), 'text/html').body.textContent || '').replace(/\s+/g, ' ').trim(); }
    catch (e) { return String(html).replace(/<[^>]*>/g, ''); }
  }
  /** Svenska uppslag från engelska Wiktionary: [{ordklass, definitioner:[...]}]. Tyst reserv: []. */
  function wiktionary(ord) {
    if (natAv || typeof fetch !== 'function') return Promise.resolve([]);
    if (wiktCache.has(ord)) return wiktCache.get(ord);
    const p = (async () => {
      const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
      const tid = setTimeout(() => ctrl && ctrl.abort(), WIKT_MS);
      try {
        const r = await fetch('https://en.wiktionary.org/api/rest_v1/page/definition/' + encodeURIComponent(ord),
          { signal: ctrl ? ctrl.signal : undefined, headers: { Accept: 'application/json' } });
        if (!r.ok) return [];
        const j = await r.json();
        return (Array.isArray(j.sv) ? j.sv : []).map(d => ({
          ordklass: String(d.partOfSpeech || ''),
          definitioner: (d.definitions || []).map(x => textUrHtml(x.definition)).filter(Boolean).slice(0, 4)
        })).filter(d => d.definitioner.length).slice(0, 3);
      } catch (e) {
        return [];
      } finally { clearTimeout(tid); }
    })();
    wiktCache.set(ord, p);
    return p;
  }

  // ---------------- Rutan (dialog / bottom sheet) ----------------
  let dlg = null;
  function dialog() {
    if (dlg) return dlg;
    dlg = h('dialog', { id: 'lexikon', class: 'dlg lexikon', 'aria-label': t('lex.aria') }, h('div', { class: 'dlg-inne' }));
    // Tryck utanför (på bakgrunden) stänger. Klick inne i rutan får inte nå kortet bakom.
    dlg.addEventListener('click', ev => { ev.stopPropagation(); if (ev.target === dlg) stang(); });
    dlg.addEventListener('pointerdown', ev => ev.stopPropagation());
    dlg.addEventListener('keydown', ev => { ev.stopPropagation(); if (ev.key === 'Escape') { ev.preventDefault(); stang(); } });
    dlg.addEventListener('close', () => { Tal.tyst(); aktuellt = null; });
    document.body.appendChild(dlg);
    return dlg;
  }
  let aktuellt = null; // ordet som visas – ritas om vid språkbyte
  let ritning = 0;

  function spelaKnapp(text, sprak) {
    const lang = { sv: 'sv-SE', pl: 'pl-PL', en: 'en-GB' }[sprak];
    return h('button', {
      type: 'button', class: 'hogtalare liten', 'data-sprak': sprak, 'aria-label': t('kort.spela.' + sprak, { text }), title: t('kort.spela.' + sprak, { text }),
      onclick: async ev => {
        ev.stopPropagation();
        if (natAv) return;
        const r = await Tal.sagaSprak(text, lang);
        const hint = dlg && dlg.querySelector('.lex-hint');
        if (hint) { hint.textContent = !Tal.finnsUppläsning ? t('kort.ingenUppl') : (!r.harRost ? t('kort.ingenRost.' + sprak) : ''); hint.hidden = !hint.textContent; }
      }
    }, '🔊');
  }
  function lank(href, text) { return h('a', { href, target: '_blank', rel: 'noopener noreferrer' }, text); }
  function markera(mening, grund) {
    // Fetstil på ord i meningen som har samma grundform (bara textnoder, inget innerHTML).
    const delar = String(mening).split(/([A-Za-zÅÄÖåäöÉéÜü-]+)/);
    return delar.map(d => (/[a-zåäö]/i.test(d) && slaUpp(d) === grund) ? h('b', null, d) : d);
  }

  /** Öppnar rutan för ett ord (en ordform från en mening eller ett huvudord). */
  async function oppna(ord) {
    aktuellt = ord;
    const nr = ++ritning;
    const d = dialog();
    d.setAttribute('aria-label', t('lex.aria'));
    const inne = tom(d.querySelector('.dlg-inne'));
    inne.appendChild(h('p', { class: 'dampad centrerad' }, t('lex.laddar')));
    if (typeof d.showModal === 'function') { if (!d.open) d.showModal(); } else d.setAttribute('open', '');
    let lex = null;
    try { lex = await lexikon(); } catch (e) { /* visar ändå länkar */ }
    if (nr !== ritning) return;
    rita(inne, ord, lex, nr);
  }

  function rita(inne, ord, lex, nr) {
    tom(inne);
    const form = normalisera(ord).replace(/^(en|ett|att)\s+/, '');
    const grund = (lex && (lex.poster.has(huvudord(ord)) ? huvudord(ord) : slaUpp(form, lex.poster))) || null;
    const p = grund ? lex.poster.get(grund) : null;
    const uppslag = p ? grund : huvudord(ord);
    const visning = p ? p.visning[0] : uppslag;

    inne.appendChild(h('div', { class: 'rad-mellan' },
      h('h2', { class: 'lex-rubrik' }, t('lex.rubrik')),
      h('button', { type: 'button', class: 'stang', 'aria-label': t('stang'), onclick: stang }, '×')));
    inne.appendChild(h('div', { class: 'lex-huvud' },
      h('span', { class: 'lex-ord', lang: 'sv' }, visning), spelaKnapp(uppslag, 'sv')));
    const fakta = [];
    if (p && p.ordklass.length) fakta.push(h('span', { class: 'lex-etikett' }, p.ordklass.map(k => I18n.har('ordklass.' + k) ? t('ordklass.' + k) : k).join(' · ')));
    fakta.push(h('span', { class: 'dampad liten' }, t('lex.grundform'), ' ', h('b', { lang: 'sv' }, visning)));
    if (form && form !== uppslag && form !== huvudord(visning)) fakta.push(h('span', { class: 'dampad liten' }, t('lex.formen', { form })));
    inne.appendChild(h('div', { class: 'lex-fakta' }, fakta));
    inne.appendChild(h('p', { class: 'lex-hint dampad liten', role: 'status', hidden: true }));

    // Översättningar – bara det som finns i sajtens egna listor.
    const glosbe = sp => `https://glosbe.com/sv/${sp}/${encodeURIComponent(uppslag)}`;
    const oversRad = sp => {
      const lista = p ? p[sp] : [];
      return h('div', { class: 'lex-overs' },
        h('span', { class: 'sprak-etikett' }, h('span', { class: `sprak-flagga flagga-${sp}`, 'aria-hidden': 'true' }), sp.toUpperCase()),
        lista.length
          ? h('span', { class: 'lex-overs-lista' }, ...lista.slice(0, 4).map(x => h('span', { class: 'lex-overs-ord' }, h('span', { lang: sp }, x), spelaKnapp(x, sp))))
          : h('span', { class: 'dampad liten' }, t('lex.ingenOvers.' + sp), ' ', lank(glosbe(sp), 'Glosbe ↗')));
    };
    inne.appendChild(h('h3', null, t('lex.oversattning')));
    inne.appendChild(oversRad('pl'));
    inne.appendChild(oversRad('en'));

    // Definition: engelska från Wiktionary (live), svenska via svenska.se.
    inne.appendChild(h('h3', null, t('lex.definition')));
    const defRuta = h('div', { class: 'lex-def' }, h('p', { class: 'dampad liten' }, t('lex.hamtar')));
    inne.appendChild(defRuta);
    inne.appendChild(h('p', { class: 'liten' }, t('lex.defSv'), ' ', lank(`https://svenska.se/tre/?sok=${encodeURIComponent(uppslag)}&pz=1`, 'svenska.se (SAOL/SO) ↗')));
    wiktionary(uppslag).then(defs => {
      if (nr !== ritning || !defRuta.isConnected) return;
      tom(defRuta);
      if (!defs.length) { defRuta.appendChild(h('p', { class: 'dampad liten' }, t('lex.ingenDef'))); return; }
      for (const d of defs) {
        defRuta.appendChild(h('div', { class: 'lex-def-post' },
          d.ordklass ? h('span', { class: 'lex-etikett' }, d.ordklass) : null,
          h('ol', { lang: 'en' }, ...d.definitioner.map(x => h('li', null, x)))));
      }
      defRuta.appendChild(h('p', { class: 'dampad liten' }, t('lex.kallaWikt')));
    });

    // Användning: andra exempelmeningar och fraser med ordet.
    if (lex && grund) {
      const idx = Array.from(lex.meningIndex.get(grund) || []);
      const unika = [];
      for (const i of idx) { const m = lex.meningar[i]; if (!unika.some(u => u.sv === m.sv)) unika.push(m); if (unika.length >= MAX_EXEMPEL) break; }
      const fraser = [];
      for (const q of lex.poster.values()) {
        if (q.grund === grund || !/\s/.test(q.grund)) continue;
        if (q.grund.split(/\s+/).some(w => slaUpp(w, lex.poster) === grund || w === grund)) fraser.push(q);
        if (fraser.length >= MAX_FRASER) break;
      }
      inne.appendChild(h('h3', null, t('lex.anvandning')));
      if (unika.length) {
        inne.appendChild(h('ul', { class: 'lex-exempel' }, ...unika.map(m => h('li', null,
          h('span', { lang: 'sv' }, ...markera(m.sv, grund)), ' ', spelaKnapp(m.sv, 'sv'),
          h('span', { class: 'lex-kalla' }, kallNamn(m.kalla))))));
      } else inne.appendChild(h('p', { class: 'dampad liten' }, t('lex.ingaExempel')));
      if (fraser.length) {
        inne.appendChild(h('h3', null, t('lex.fraser')));
        inne.appendChild(h('ul', { class: 'lex-fraser' }, ...fraser.map(q => h('li', null,
          h('b', { lang: 'sv' }, q.visning[0]), q.en.length || q.pl.length ? ' – ' : '', [q.pl[0], q.en[0]].filter(Boolean).join(' · ')))));
      }
    } else {
      inne.appendChild(h('p', { class: 'ruta liten' }, t('lex.saknas')));
    }

    inne.appendChild(h('h3', null, t('lex.merOm')));
    inne.appendChild(h('div', { class: 'lex-lankar' },
      lank(`https://svenska.se/tre/?sok=${encodeURIComponent(uppslag)}&pz=1`, 'svenska.se ↗'),
      lank(glosbe('pl'), 'Glosbe sv→pl ↗'),
      lank(glosbe('en'), 'Glosbe sv→en ↗'),
      lank(`https://en.wiktionary.org/wiki/${encodeURIComponent(uppslag.replace(/ /g, '_'))}#Swedish`, 'Wiktionary ↗')));
    const s = inne.querySelector('.stang');
    if (s && !natAv) s.focus({ preventScroll: true });
  }
  function kallNamn(k) {
    if (!k) return '';
    if (k === 'ordlista') return t('nav.ordlista');
    return I18n.har('kort.lek.' + k) ? t('kort.lek.' + k).split(' – ')[0] : k;
  }

  function stang() {
    if (!dlg) return;
    Tal.tyst();
    aktuellt = null;
    if (typeof dlg.close === 'function' && dlg.open) dlg.close(); else dlg.removeAttribute('open');
  }
  I18n.narSprakAndras(() => { if (dlg && dlg.open && aktuellt) oppna(aktuellt); });

  /** Ett ord som knapp (inline). Tryck öppnar rutan och vänder inte kortet. */
  function ordKnapp(visa, uppslag) {
    const stopp = ev => ev.stopPropagation();
    return h('button', {
      type: 'button', class: 'ord-lank', lang: 'sv', title: t('lex.visa', { ord: visa }),
      onpointerdown: stopp, onkeydown: stopp,
      onclick: ev => { ev.stopPropagation(); ev.preventDefault(); oppna(uppslag || visa); }
    }, visa);
  }
  /** En mening där varje ord är tryckbart. Returnerar en lista av noder. */
  function klickbarMening(mening) {
    return String(mening).split(/([A-Za-zÅÄÖåäöÉéÜü-]+)/).filter(d => d !== '')
      .map(d => /[a-zåäö]/i.test(d) ? ordKnapp(d) : d);
  }

  // ---------------- Självtest ----------------
  async function sjalvtest(fel, rot) {
    natAv = true;
    try {
      const g = f => grundformer(f);
      if (!g('huset').includes('hus') || !g('husen').includes('hus')) fel.push('lexikon: huset/husen -> hus');
      if (!g('sprang').includes('springa')) fel.push('lexikon: sprang -> springa');
      if (!g('läser').includes('läsa')) fel.push('lexikon: läser -> läsa');
      if (!g('böckerna').includes('bok')) fel.push('lexikon: böckerna -> bok');
      const lex = await lexikon();
      if (lex.poster.size < 1000) fel.push('lexikon: bara ' + lex.poster.size + ' uppslag');
      if (slaUpp('huset') !== 'hus') fel.push('lexikon: slaUpp(huset) gav ' + slaUpp('huset'));
      // Tryck på huvudordet på baksidan: rutan öppnas, kortet vänds inte.
      const knapp = rot.querySelector('.flipkort .bak .ord-lank');
      if (!knapp) { fel.push('lexikon: huvudordet på baksidan går inte att trycka på'); return; }
      const vantFore = !!rot.querySelector('.flipkort.vand');
      knapp.click();
      for (let i = 0; i < 60 && !(dlg && dlg.querySelector('.lex-ord')); i++) await new Promise(r => setTimeout(r, 50));
      if (!dlg || !dlg.open) fel.push('lexikon: rutan öppnades inte');
      if (!!rot.querySelector('.flipkort.vand') !== vantFore) fel.push('lexikon: tryck på ordet vände kortet');
      if (dlg) {
        if (!dlg.querySelector('.lex-ord')) fel.push('lexikon: rutan saknar ordet');
        if (dlg.querySelectorAll('.lex-overs').length !== 2) fel.push('lexikon: rutan saknar pl/en');
        if (!dlg.querySelector('.lex-lankar a[href*="glosbe.com/sv/pl"]') || !dlg.querySelector('.lex-lankar a[href*="svenska.se"]')) fel.push('lexikon: länkar ut saknas');
        if (!dlg.querySelector('.lex-exempel li')) fel.push('lexikon: inga exempelmeningar');
        dlg.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        if (dlg.open) fel.push('lexikon: Esc stängde inte rutan');
      }
      // Ett ord i exempelmeningen.
      const iMening = rot.querySelector('.flipkort .kort-exempel .ord-lank');
      if (!iMening) fel.push('lexikon: orden i exempelmeningen går inte att trycka på');
      else {
        iMening.click();
        for (let i = 0; i < 60 && !(dlg && dlg.querySelector('.lex-ord')); i++) await new Promise(r => setTimeout(r, 50));
        if (!dlg.open) fel.push('lexikon: rutan öppnades inte från meningen');
        stang();
      }
    } catch (e) {
      fel.push('lexikon undantag: ' + (e && e.stack || e));
    } finally { natAv = false; stang(); }
  }

  window.Lexikon = { oppna, stang, ordKnapp, klickbarMening, grundformer, slaUpp, huvudord, sjalvtest, lexikon };
})();
