/* figurer.js – egenritade figurer (inline SVG): Bosse Bäver, Ella Älg och Lilla Lo (lodjursunge).
 * SVG-koden är konstant (ingen användartext), så den sätts via innerHTML i en mall.
 * Humör styrs med CSS-klasser: glad, trost, fira, vinka, tank. Klassen pratar öppnar och stänger munnen (samtalsläget). */
(function () {
  'use strict';
  const { h } = window.DOM;

  const MUN = `
    <path class="mun-glad" d="M52 62 Q60 70 68 62" fill="none" stroke="#3a2414" stroke-width="2.5" stroke-linecap="round"/>
    <path class="mun-ledsen" d="M53 67 Q60 61 67 67" fill="none" stroke="#3a2414" stroke-width="2.5" stroke-linecap="round"/>`;

  const SVG = {
    bosse: `<svg viewBox="0 0 120 124" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g class="svans"><ellipse cx="92" cy="104" rx="22" ry="11" fill="#5b3a1e" transform="rotate(-25 92 104)"/>
        <path d="M78 100 L104 94 M80 106 L106 100 M84 111 L106 106" stroke="#46301a" stroke-width="1.5"/></g>
      <g class="kropp">
        <ellipse cx="60" cy="88" rx="31" ry="28" fill="#a0643a"/>
        <ellipse cx="60" cy="93" rx="19" ry="18" fill="#d9a877"/>
        <ellipse cx="46" cy="116" rx="10" ry="6" fill="#7a4a26"/><ellipse cx="74" cy="116" rx="10" ry="6" fill="#7a4a26"/>
        <g class="arm-v"><ellipse cx="33" cy="86" rx="7" ry="13" fill="#8a5530" transform="rotate(20 33 86)"/></g>
        <g class="arm-h"><ellipse cx="87" cy="86" rx="7" ry="13" fill="#8a5530" transform="rotate(-20 87 86)"/></g>
      </g>
      <g class="huvud">
        <circle cx="38" cy="25" r="8" fill="#7a4a26"/><circle cx="82" cy="25" r="8" fill="#7a4a26"/>
        <circle cx="38" cy="25" r="4" fill="#d9a877"/><circle cx="82" cy="25" r="4" fill="#d9a877"/>
        <circle cx="60" cy="46" r="28" fill="#a0643a"/>
        <ellipse cx="60" cy="58" rx="16" ry="12" fill="#e2b98a"/>
        <circle cx="43" cy="56" r="4.5" fill="#f08c8c" opacity=".45"/><circle cx="77" cy="56" r="4.5" fill="#f08c8c" opacity=".45"/>
        <g class="ogon"><circle cx="49" cy="42" r="5" fill="#1d1d1d"/><circle cx="71" cy="42" r="5" fill="#1d1d1d"/>
          <circle cx="50.6" cy="40.4" r="1.7" fill="#fff"/><circle cx="72.6" cy="40.4" r="1.7" fill="#fff"/></g>
        <g class="bryn"><path d="M43 36 L54 31" stroke="#3a2414" stroke-width="2.5" stroke-linecap="round"/><path d="M77 36 L66 31" stroke="#3a2414" stroke-width="2.5" stroke-linecap="round"/></g>
        <ellipse cx="60" cy="52" rx="6.5" ry="4.5" fill="#3a2414"/>
        ${MUN}
        <g class="mun-prat"><ellipse cx="60" cy="67" rx="9" ry="6.5" fill="#3a1a10"/><ellipse cx="60" cy="71" rx="5.5" ry="2.6" fill="#e0707a"/></g>
        <rect class="tand" x="55" y="62" width="10" height="9" rx="1.5" fill="#fff" stroke="#d6d0c4"/>
        <line class="tand" x1="60" y1="62" x2="60" y2="71" stroke="#d6d0c4"/>
      </g></svg>`,
    ella: `<svg viewBox="0 0 120 124" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g class="huvud">
        <g fill="#d8c29d" stroke="#b39c72" stroke-width="1.5">
          <path d="M40 34 C24 30 14 16 16 6 L22 14 L24 4 L30 14 L34 5 L38 17 L44 12 L46 28 Z"/>
          <path d="M80 34 C96 30 106 16 104 6 L98 14 L96 4 L90 14 L86 5 L82 17 L76 12 L74 28 Z"/>
        </g>
        <ellipse cx="34" cy="44" rx="11" ry="6" fill="#6b4a2f" transform="rotate(-25 34 44)"/>
        <ellipse cx="86" cy="44" rx="11" ry="6" fill="#6b4a2f" transform="rotate(25 86 44)"/>
        <path d="M40 40 C40 26 80 26 80 40 L84 86 C84 104 36 104 36 86 Z" fill="#7b5534"/>
        <ellipse cx="60" cy="92" rx="23" ry="15" fill="#5e3f26"/>
        <ellipse cx="52" cy="93" rx="3.5" ry="4.5" fill="#2a1a0e"/><ellipse cx="68" cy="93" rx="3.5" ry="4.5" fill="#2a1a0e"/>
        <path d="M58 106 Q60 114 62 106" fill="#5e3f26"/>
        <g class="ogon"><circle cx="49" cy="52" r="5" fill="#1d1d1d"/><circle cx="71" cy="52" r="5" fill="#1d1d1d"/>
          <circle cx="50.6" cy="50.4" r="1.7" fill="#fff"/><circle cx="72.6" cy="50.4" r="1.7" fill="#fff"/></g>
        <g class="bryn"><path d="M43 46 L54 41" stroke="#2a1a0e" stroke-width="2.5" stroke-linecap="round"/><path d="M77 46 L66 41" stroke="#2a1a0e" stroke-width="2.5" stroke-linecap="round"/></g>
        <path class="mun-glad" d="M52 100 Q60 106 68 100" fill="none" stroke="#2a1a0e" stroke-width="2.5" stroke-linecap="round"/>
        <path class="mun-ledsen" d="M53 104 Q60 99 67 104" fill="none" stroke="#2a1a0e" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="42" cy="64" r="4" fill="#f08c8c" opacity=".35"/><circle cx="78" cy="64" r="4" fill="#f08c8c" opacity=".35"/>
      </g></svg>`,
    lo: `<svg viewBox="0 0 120 124" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g class="kropp"><ellipse cx="60" cy="100" rx="26" ry="20" fill="#d9a066"/>
        <circle cx="50" cy="98" r="2.5" fill="#8a5a2b"/><circle cx="66" cy="104" r="2.5" fill="#8a5a2b"/><circle cx="70" cy="94" r="2" fill="#8a5a2b"/>
        <g class="arm-h"><ellipse cx="84" cy="96" rx="6" ry="11" fill="#c98f58" transform="rotate(-20 84 96)"/></g>
        <g class="arm-v"><ellipse cx="36" cy="96" rx="6" ry="11" fill="#c98f58" transform="rotate(20 36 96)"/></g></g>
      <g class="huvud">
        <path d="M30 40 L34 8 L50 30 Z" fill="#c98f58"/><path d="M90 40 L86 8 L70 30 Z" fill="#c98f58"/>
        <path d="M34 8 L32 0 M86 8 L88 0" stroke="#222" stroke-width="3" stroke-linecap="round"/>
        <path d="M35 30 L36 16 L45 28 Z M85 30 L84 16 L75 28 Z" fill="#f3d9b8"/>
        <path d="M24 58 C24 30 96 30 96 58 C96 70 88 80 74 84 L60 80 L46 84 C32 80 24 70 24 58 Z" fill="#d9a066"/>
        <path d="M24 58 L14 66 L28 66 M96 58 L106 66 L92 66" fill="#f3d9b8"/>
        <ellipse cx="60" cy="68" rx="15" ry="11" fill="#f3d9b8"/>
        <circle cx="42" cy="44" r="2" fill="#8a5a2b"/><circle cx="78" cy="44" r="2" fill="#8a5a2b"/><circle cx="60" cy="38" r="2" fill="#8a5a2b"/>
        <g class="ogon"><ellipse cx="48" cy="54" rx="5.5" ry="6" fill="#2f5d3a"/><ellipse cx="72" cy="54" rx="5.5" ry="6" fill="#2f5d3a"/>
          <ellipse cx="48" cy="54" rx="2" ry="4.5" fill="#111"/><ellipse cx="72" cy="54" rx="2" ry="4.5" fill="#111"/>
          <circle cx="49.5" cy="51.5" r="1.4" fill="#fff"/><circle cx="73.5" cy="51.5" r="1.4" fill="#fff"/></g>
        <g class="bryn"><path d="M42 48 L53 43" stroke="#5a3a1a" stroke-width="2.5" stroke-linecap="round"/><path d="M78 48 L67 43" stroke="#5a3a1a" stroke-width="2.5" stroke-linecap="round"/></g>
        <path d="M56 64 L64 64 L60 69 Z" fill="#c0506a"/>
        <path class="mun-glad" d="M52 72 Q56 76 60 72 Q64 76 68 72" fill="none" stroke="#5a3a1a" stroke-width="2" stroke-linecap="round"/>
        <path class="mun-ledsen" d="M53 76 Q60 71 67 76" fill="none" stroke="#5a3a1a" stroke-width="2" stroke-linecap="round"/>
        <path d="M44 68 L30 66 M44 71 L30 73 M76 68 L90 66 M76 71 L90 73" stroke="#8a5a2b" stroke-width="1.2"/>
      </g></svg>`
  };

  // Namnen följer sidans språk (getters läses vid varje användning).
  const NAMN = {
    get bosse() { return window.I18n.t('fig.bosse'); },
    get ella() { return window.I18n.t('fig.ella'); },
    get lo() { return window.I18n.t('fig.lo'); }
  };

  /** Returnerar ett element med figuren. hum: glad | trost | fira | vinka | tank */
  function figur(vem = 'bosse', hum = 'glad', { storlek = 96 } = {}) {
    const mall = document.createElement('template');
    mall.innerHTML = (SVG[vem] || SVG.bosse).trim();
    const el = h('div', { class: `figur figur-${vem} hum-${hum}`, role: 'img', 'aria-label': NAMN[vem] || window.I18n.t('fig.figur'), style: { width: storlek + 'px' } });
    el.appendChild(mall.content.firstChild);
    return el;
  }

  function sattHumor(el, hum) {
    if (!el) return;
    el.className = el.className.replace(/\bhum-\w+/g, '') + ' hum-' + hum;
    // Starta om animationen.
    el.classList.remove('studs'); void el.offsetWidth; el.classList.add('studs');
  }

  /** Figur + pratbubbla. */
  function pratar(vem, text, hum = 'glad', { storlek = 84, sida = 'vanster', onclick } = {}) {
    const bubbla = h('div', { class: 'pratbubbla', 'aria-live': 'polite' }, h('b', null, NAMN[vem] + ': '), h('span', null, text));
    const f = figur(vem, hum, { storlek });
    const wrap = h('div', { class: 'maskot maskot-' + sida + (onclick ? ' klickbar' : ''), onclick }, f, bubbla);
    wrap.saga = (ny, nyttHum) => { bubbla.lastChild.textContent = ny; if (nyttHum) sattHumor(f, nyttHum); };
    return wrap;
  }

  window.Figurer = { figur, pratar, sattHumor, NAMN };
})();
