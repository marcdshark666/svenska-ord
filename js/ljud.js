/* ljud.js – små feedbackljud med Web Audio (inga ljudfiler). Kan stängas av i inställningarna. */
(function () {
  'use strict';
  let ctx = null;
  let pa = true;

  function hamtaCtx() {
    if (!pa) return null;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      if (!ctx) ctx = new AC();
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      return ctx;
    } catch (e) { return null; }
  }

  function ton(frek, start, langd, { typ = 'sine', volym = 0.18 } = {}) {
    const c = hamtaCtx();
    if (!c) return;
    try {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = typ;
      o.frequency.setValueAtTime(frek, c.currentTime + start);
      g.gain.setValueAtTime(0.0001, c.currentTime + start);
      g.gain.exponentialRampToValueAtTime(volym, c.currentTime + start + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + langd);
      o.connect(g).connect(c.destination);
      o.start(c.currentTime + start);
      o.stop(c.currentTime + start + langd + 0.05);
    } catch (e) { /* ljud är bara pynt */ }
  }

  window.Ljud = {
    setPa(v) { pa = !!v; },
    get pa() { return pa; },
    ratt() { ton(660, 0, 0.12); ton(880, 0.1, 0.22); },
    fel() { ton(220, 0, 0.18, { typ: 'triangle', volym: 0.2 }); ton(180, 0.14, 0.25, { typ: 'triangle', volym: 0.18 }); },
    klick() { ton(520, 0, 0.05, { volym: 0.06 }); },
    klar() { [523, 659, 784, 1047].forEach((f, i) => ton(f, i * 0.12, 0.3)); ton(1319, 0.5, 0.5, { volym: 0.12 }); },
    marke() { [784, 988, 1175].forEach((f, i) => ton(f, i * 0.09, 0.25, { typ: 'triangle', volym: 0.14 })); }
  };
})();
