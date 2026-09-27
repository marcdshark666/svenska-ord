/* dom.js – små hjälpare. All text sätts med textContent, aldrig innerHTML. */
(function () {
  'use strict';

  /** h('div', {class:'x', onclick: fn}, 'text', barn...) */
  function h(tagg, attr, ...barn) {
    const el = document.createElement(tagg);
    if (attr) {
      for (const [k, v] of Object.entries(attr)) {
        if (v === undefined || v === null || v === false) continue;
        if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k in el && typeof v !== 'string') el[k] = v;
        else el.setAttribute(k, v === true ? '' : String(v));
      }
    }
    for (const b of barn.flat()) {
      if (b === undefined || b === null || b === false) continue;
      el.appendChild(b instanceof Node ? b : document.createTextNode(String(b)));
    }
    return el;
  }

  function tom(el) { while (el && el.firstChild) el.removeChild(el.firstChild); return el; }

  function blanda(lista) {
    const a = lista.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Högtalarknapp som läser upp text på svenska. */
  function hogtalare(text, { langsam = false, etikett, liten = false } = {}) {
    return h('button', {
      type: 'button',
      class: 'hogtalare' + (liten ? ' liten' : '') + (langsam ? ' langsam' : ''),
      'aria-label': etikett || ((langsam ? 'Läs upp långsamt: ' : 'Läs upp: ') + text),
      title: langsam ? 'Långsamt' : 'Lyssna',
      onclick: ev => { ev.stopPropagation(); window.Tal.saga(text, { langsam }); }
    }, langsam ? '🐢' : '🔊');
  }

  window.DOM = { h, tom, blanda, hogtalare };
})();
