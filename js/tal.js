/* tal.js – uppläsning (speechSynthesis), inspelning (MediaRecorder) och
 * uttalskontroll (SpeechRecognition). Allt degraderar snällt när API saknas. */
(function () {
  'use strict';
  const t = (k, v) => (window.I18n ? window.I18n.t(k, v) : k);

  const synth = ('speechSynthesis' in window) ? window.speechSynthesis : null;
  const Igenkanning = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  let roster = [];
  let valdRost = null;
  let onskadRostURI = '';
  let hastighet = 0.95;
  const lyssnare = [];

  // Högre poäng = bättre. Neurala/online-röster låter mycket naturligare.
  function rostPoang(r) {
    let p = 0;
    const n = (r.name || '').toLowerCase();
    if (/^sv[-_]se/i.test(r.lang)) p += 50;
    if (/natural|neural|online/.test(n)) p += 40;
    if (/google/.test(n)) p += 30;
    if (/sofie|mattias|hillevi|alva|klara|oskar/.test(n)) p += 15;
    if (/microsoft/.test(n)) p += 5;
    if (r.localService) p += 2;
    return p;
  }

  function laddaRoster() {
    if (!synth) return;
    const alla = synth.getVoices() || [];
    roster = alla.filter(r => /^sv([-_]|$)/i.test(r.lang)).sort((a, b) => rostPoang(b) - rostPoang(a));
    valdRost = roster.find(r => r.voiceURI === onskadRostURI) || roster[0] || null;
    lyssnare.forEach(f => { try { f(roster); } catch (e) { console.error(e); } });
  }

  if (synth) {
    laddaRoster();
    if (typeof synth.addEventListener === 'function') synth.addEventListener('voiceschanged', laddaRoster);
    else synth.onvoiceschanged = laddaRoster;
    // Vissa webbläsare fyller listan sent utan händelse.
    setTimeout(laddaRoster, 800);
    setTimeout(laddaRoster, 2500);
  }

  /** Läser upp text på svenska. Returnerar ett löfte som löses när uppläsningen är klar. */
  function saga(text, { langsam = false, lang = 'sv-SE' } = {}) {
    return new Promise(resolve => {
      if (!synth || !text) { resolve(false); return; }
      try {
        synth.cancel();
        const u = new SpeechSynthesisUtterance(String(text));
        u.lang = lang;
        if (lang.startsWith('sv') && valdRost) u.voice = valdRost;
        u.rate = langsam ? Math.max(0.45, hastighet * 0.6) : hastighet;
        u.pitch = 1;
        let klar = false;
        const slut = ok => { if (!klar) { klar = true; resolve(ok); } };
        u.onend = () => slut(true);
        u.onerror = () => slut(false);
        // Säkerhetsnät om onend aldrig kommer (händer i vissa Chrome-versioner).
        setTimeout(() => slut(true), 1500 + String(text).length * (langsam ? 200 : 110));
        synth.speak(u);
      } catch (e) {
        console.error('Uppläsning misslyckades', e);
        resolve(false);
      }
    });
  }

  function tyst() { try { if (synth) synth.cancel(); } catch (e) { /* inget att göra */ } }

  // ---------- Inspelning ----------
  function kanSpelaIn() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  }

  function valjMime() {
    const kandidater = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
    for (const m of kandidater) {
      try { if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) return m; } catch (e) { /* prova nästa */ }
    }
    return '';
  }

  /** Startar inspelning. Returnerar { stoppa(): Promise<{url, blob}> }. */
  async function spelaIn() {
    if (!kanSpelaIn()) throw new Error(t('tal.kanInteSpelaIn'));
    let strom;
    try {
      strom = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (e) {
      if (e && (e.name === 'NotAllowedError' || e.name === 'SecurityError')) {
        throw new Error(t('tal.mikBlockerad'));
      }
      if (e && e.name === 'NotFoundError') throw new Error(t('tal.ingenMik'));
      throw new Error(t('tal.mikFel', { fel: e && e.message ? e.message : String(e) }));
    }
    const mime = valjMime();
    const rec = mime ? new MediaRecorder(strom, { mimeType: mime }) : new MediaRecorder(strom);
    const bitar = [];
    rec.ondataavailable = ev => { if (ev.data && ev.data.size) bitar.push(ev.data); };
    rec.start();
    const maxTimer = setTimeout(() => { if (rec.state === 'recording') rec.stop(); }, 15000);
    const klar = new Promise(resolve => {
      rec.onstop = () => {
        clearTimeout(maxTimer);
        strom.getTracks().forEach(t => t.stop());
        const blob = new Blob(bitar, { type: rec.mimeType || mime || 'audio/webm' });
        resolve({ blob, url: URL.createObjectURL(blob) });
      };
    });
    return {
      stoppa() { if (rec.state === 'recording') rec.stop(); return klar; },
      klar
    };
  }

  // ---------- Taligenkänning ----------
  function kanKanna() { return !!Igenkanning; }

  /** Lyssnar efter svenska. Löses med { text, alternativ[] } eller kastar fel med begripligt meddelande. */
  function kanna({ lang = 'sv-SE', maxMs = 7000 } = {}) {
    return new Promise((resolve, reject) => {
      if (!Igenkanning) { reject(new Error(t('tal.saknas'))); return; }
      let r;
      try { r = new Igenkanning(); } catch (e) { reject(new Error(t('tal.kundeInteStarta'))); return; }
      r.lang = lang;
      r.interimResults = false;
      r.maxAlternatives = 5;
      r.continuous = false;
      let fardig = false;
      const timer = setTimeout(() => { try { r.stop(); } catch (e) { /* redan stoppad */ } }, maxMs);
      r.onresult = ev => {
        const res = ev.results && ev.results[0];
        const alt = [];
        if (res) for (let i = 0; i < res.length; i++) alt.push(res[i].transcript.trim());
        fardig = true;
        clearTimeout(timer);
        resolve({ text: alt[0] || '', alternativ: alt });
      };
      r.onerror = ev => {
        if (fardig) return;
        fardig = true;
        clearTimeout(timer);
        const kod = ev && ev.error;
        const nyckel = {
          'not-allowed': 'tal.notAllowed',
          'service-not-allowed': 'tal.serviceNotAllowed',
          'no-speech': 'tal.noSpeech',
          'audio-capture': 'tal.ingenMik',
          'network': 'tal.network',
          'language-not-supported': 'tal.langNotSupported'
        }[kod];
        reject(new Error(nyckel ? t(nyckel) : t('tal.misslyckades', { kod })));
      };
      r.onend = () => {
        clearTimeout(timer);
        if (!fardig) { fardig = true; reject(new Error(t('tal.hordeInget'))); }
      };
      try { r.start(); } catch (e) { clearTimeout(timer); reject(new Error(t('tal.kundeInteStarta'))); }
    });
  }

  function normalisera(s) {
    return String(s || '').toLowerCase().normalize('NFC')
      .replace(/[.,!?;:"'()¿¡–—-]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    let fore = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const nu = [i];
      for (let j = 1; j <= b.length; j++) {
        nu[j] = Math.min(fore[j] + 1, nu[j - 1] + 1, fore[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      fore = nu;
    }
    return fore[b.length];
  }

  /** Likhet 0..1 mellan det användaren sa och målet. Tar bästa alternativet. */
  function likhet(mal, alternativ) {
    const m = normalisera(mal);
    let bast = 0;
    for (const a of alternativ || []) {
      const s = normalisera(a);
      if (!s) continue;
      if (s === m || s.split(' ').includes(m)) return 1;
      const d = levenshtein(s, m);
      bast = Math.max(bast, 1 - d / Math.max(s.length, m.length));
    }
    return bast;
  }

  window.Tal = {
    get finnsUppläsning() { return !!synth; },
    get harSvenskRost() { return roster.length > 0; },
    get roster() { return roster.slice(); },
    get valdRost() { return valdRost; },
    saga, tyst, kanSpelaIn, spelaIn, kanKanna, kanna, likhet, normalisera, levenshtein,
    setRost(uri) { onskadRostURI = uri || ''; laddaRoster(); },
    setHastighet(v) { const n = Number(v); if (n >= 0.4 && n <= 1.5) hastighet = n; },
    narRosterAndras(f) { lyssnare.push(f); }
  };
})();
