// Procedural SVG illustrations for each destination.
// Each scene is built from layers marked data-depth so cards can parallax them on hover.
(function () {
  let uid = 0;

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // jagged mountain ridge, closed to the bottom of the frame
  function ridge(base, amp, n, r, h = 280) {
    let d = `M-10 ${h} L-10 ${base}`;
    const step = 420 / n;
    for (let i = 0; i <= n; i++) {
      const x = -10 + i * step;
      const y = base - (i % 2 ? amp * (0.55 + r() * 0.45) : amp * r() * 0.35);
      d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d + ` L410 ${h} Z`;
  }
  // soft rolling hills
  function hills(base, amp, n, r, h = 280) {
    let d = `M-10 ${h} L-10 ${base}`;
    const step = 420 / n;
    let px = -10, py = base;
    for (let i = 1; i <= n; i++) {
      const x = -10 + i * step;
      const y = base - amp * (0.3 + r() * 0.7) * (i % 2 ? 1 : 0.4);
      d += ` Q${(px + step / 2).toFixed(1)} ${(y - amp * 0.3).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
      px = x; py = y;
    }
    return d + ` L410 ${h} Z`;
  }
  const pine = (x, y, s, c = '#2f8f4e') =>
    `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-1.5" y="0" width="3" height="8" fill="#5a3a22"/><path d="M0 -26 9 -8H5l7 9H-12l7-9h-4Z" fill="${c}"/></g>`;
  const palm = (x, y, s, flip) =>
    `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})"><path d="M0 0C2-14 6-28 14-40" stroke="#8a5a34" stroke-width="3.2" fill="none" stroke-linecap="round"/>
     <g fill="#3fa35a"><path d="M14-40c-10-6-22-4-28 4 10-2 18-2 28-4Z"/><path d="M14-40c4-10 14-14 24-10-8 2-16 6-24 10Z"/><path d="M14-40c10-2 20 4 22 14-6-6-14-10-22-14Z"/><path d="M14-40c-4-8-12-12-20-10 8 2 14 6 20 10Z" fill="#2f8f4e"/></g></g>`;
  const cloud = (x, y, s, o = 1) =>
    `<g transform="translate(${x} ${y}) scale(${s})" fill="#fff" opacity="${o}"><ellipse cx="0" cy="0" rx="22" ry="9"/><ellipse cx="-10" cy="-5" rx="11" ry="9"/><ellipse cx="8" cy="-8" rx="13" ry="11"/></g>`;
  const birds = (x, y) =>
    `<g fill="none" stroke="#244c58" stroke-width="1.6" stroke-linecap="round" opacity=".7"><path d="M${x} ${y}q4-4 8 0q4-4 8 0"/><path d="M${x + 22} ${y - 10}q3-3 6 0q3-3 6 0"/></g>`;

  function sky(id, top, bottom) {
    return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs><rect width="400" height="280" fill="url(#${id})"/>`;
  }
  const L = (depth, inner) => `<g data-depth="${depth}">${inner}</g>`;

  const scenes = {
    lake(r, id) {
      const houses = [[150, '#f5893b'], [172, '#fff'], [190, '#f7c35c'], [210, '#fff'], [232, '#e8505b'], [250, '#fff']]
        .map(([x, c], i) => `<g transform="translate(${x} ${178 - (i % 2) * 6})"><rect width="16" height="16" fill="${c}"/><path d="M-2 0 8-9l10 9Z" fill="#2f6fd6"/><rect x="5" y="6" width="5" height="5" fill="#bfe8ff"/></g>`).join('');
      return sky(id, '#bfe8ee', '#f2fbf8') +
        L(0.05, `<circle cx="300" cy="64" r="22" fill="#ffe2b8"/>${cloud(90, 60, 1.2)}${cloud(320, 40, .8, .8)}`) +
        L(0.12, `<path d="${ridge(120, 70, 9, r)}" fill="#a9d6de"/>`) +
        L(0.2, `<path d="${ridge(160, 80, 7, r)}" fill="#5aa6a0"/><path d="M-10 200 L410 200 410 280 -10 280Z" fill="#3fb3c0"/>`) +
        L(0.3, `${houses}<path d="M268 178h10v-24l-5-12-5 12Z" fill="#fff"/><path d="M268 154h10l-5-18Z" fill="#2f6fd6"/>
          <g fill="#fff" opacity=".55"><rect x="60" y="220" width="70" height="2.5" rx="1"/><rect x="200" y="236" width="90" height="2.5" rx="1"/><rect x="150" y="212" width="40" height="2" rx="1"/></g>`) +
        L(0.5, `<path d="M-10 280V230c40-14 70-6 90 10s40 40 40 40Z" fill="#6cc04a"/>${pine(18, 238, 1.4)}${pine(44, 246, 1.1, '#3fa35a')}${pine(330, 250, 1.3)}${pine(356, 244, 1.6, '#3fa35a')}${pine(384, 252, 1.2)}<path d="M300 280c20-18 60-28 110-26v26Z" fill="#4f9e36"/>`);
    },
    cove(r, id) {
      return sky(id, '#c9eef3', '#f6fbf7') +
        L(0.05, `<circle cx="90" cy="54" r="20" fill="#ffe2b8"/>${cloud(270, 50, 1)}${birds(160, 60)}`) +
        L(0.12, `<path d="M-10 130H410V280H-10Z" fill="#2aa7b8"/><path d="M-10 130H410v16H-10Z" fill="#7fd3da" opacity=".5"/>`) +
        L(0.22, `<path d="M240 280C230 220 250 160 300 120c40-10 80 0 110 20v140Z" fill="#d9b98a"/><path d="M300 120c40-10 80 0 110 20v16c-30-14-70-24-110-14-20 10-40 30-48 50 0-30 18-56 48-72Z" fill="#6cc04a"/><path d="M262 280c0-30 10-60 30-90" stroke="#c5a172" stroke-width="3" fill="none"/>`) +
        L(0.32, `<path d="M-10 160C30 150 70 150 100 170s40 60 30 110H-10Z" fill="#cfa877"/><path d="M-10 160c40-10 80-10 110 10-30-4-70 0-110 14Z" fill="#5fb447"/>
          <path d="M120 280c20-50 80-70 140-60 30 6 40 30 30 60Z" fill="#f6e2b0"/><path d="M120 280c22-44 76-62 136-56" stroke="#fff" stroke-width="3" fill="none" opacity=".8"/>
          <path d="M170 200c6-20 16-30 26-30s14 14 10 30Z" fill="#b99064"/><path d="M196 170c10 0 14 14 10 30h-6c2-10 0-20-4-30Z" fill="#9c774f"/>`) +
        L(0.5, `<g fill="#fff" opacity=".6"><rect x="40" y="200" width="40" height="2.5" rx="1"/><rect x="150" y="160" width="60" height="2.5" rx="1"/><rect x="320" y="180" width="30" height="2" rx="1"/></g>${palm(34, 280, 1.4)}${palm(380, 280, 1.2, true)}`);
    },
    peaks(r, id) {
      const peakPath = ridge(150, 110, 6, r);
      return sky(id, '#b8dff0', '#eef8fb') +
        L(0.05, `${cloud(110, 70, 1.1)}${cloud(300, 46, .9, .9)}`) +
        L(0.14, `<path d="${peakPath}" fill="#6e9fb8"/><path d="${peakPath}" fill="#fff" clip-path="url(#${id}c)"/><clipPath id="${id}c"><rect width="400" height="90"/></clipPath>`) +
        L(0.22, `<path d="${ridge(190, 60, 9, r)}" fill="#4a7f95"/>`) +
        L(0.32, `<path d="M-10 214H410V280H-10Z" fill="#48c6c8"/><g fill="#fff" opacity=".5"><rect x="140" y="232" width="80" height="2.5" rx="1"/><rect x="260" y="248" width="50" height="2.5" rx="1"/></g>
          ${Array.from({ length: 14 }, (_, i) => pine(i * 30 - 4, 214, 0.9 + r() * 0.5, i % 2 ? '#2a7f45' : '#2f8f4e')).join('')}`) +
        L(0.55, `<path d="M-10 280v-30c30-10 60-4 80 10s30 20 30 20Z" fill="#4f9e36"/>${pine(14, 270, 1.8)}${pine(46, 276, 1.3, '#3fa35a')}${pine(372, 276, 2)}<path d="M330 280c20-14 50-20 80-18v18Z" fill="#4f9e36"/>`);
    },
    lagoon(r, id) {
      const huts = [0, 1, 2, 3].map(i => `<g transform="translate(${236 + i * 34} ${150 + i * 4})"><path d="M2 14v16M20 14v16" stroke="#8a5a34" stroke-width="2"/><rect x="0" y="6" width="22" height="9" fill="#f4e6cf"/><path d="M-3 7 11-3 25 7Z" fill="#c98f5a"/></g>`).join('');
      return sky(id, '#a9e3ef', '#f3fbfb') +
        L(0.05, `<circle cx="80" cy="60" r="24" fill="#fff1d6"/>${cloud(250, 52, 1.1)}${cloud(360, 80, .7, .8)}`) +
        L(0.12, `<path d="M-10 140H410V280H-10Z" fill="#1d9bb0"/>`) +
        L(0.22, `<ellipse cx="200" cy="215" rx="260" ry="62" fill="#6fd8d6"/><ellipse cx="200" cy="220" rx="200" ry="40" fill="#9be6e0"/>${huts}<path d="M236 164h-60" stroke="#8a5a34" stroke-width="2"/>`) +
        L(0.35, `<path d="M40 230c30-24 120-30 170-10 10 6 0 16-20 18-50 6-120 6-150-8Z" fill="#f6e2b0"/>${palm(90, 226, 1.1)}${palm(140, 222, 1.3, true)}${palm(170, 228, .9)}`) +
        L(0.55, `<g fill="#fff" opacity=".7"><rect x="20" y="260" width="50" height="2.5" rx="1"/><rect x="260" y="250" width="70" height="2.5" rx="1"/></g><path d="M300 280c20-10 60-14 110-12v12Z" fill="#f6e2b0"/>${palm(380, 280, 1.4, true)}`);
    },
    terraces(r, id) {
      const bands = ['#9ed36a', '#86c85a', '#6cc04a', '#5fb447', '#4f9e36'];
      const tiers = bands.map((c, i) => {
        const y = 120 + i * 32;
        return `<path d="M-10 ${y + 40}C60 ${y - 6} 140 ${y + 22} 210 ${y + 4}S340 ${y - 10} 410 ${y + 10}V290H-10Z" fill="${c}"/><path d="M-10 ${y + 40}C60 ${y - 6} 140 ${y + 22} 210 ${y + 4}S340 ${y - 10} 410 ${y + 10}" stroke="#d8f0b8" stroke-width="1.6" fill="none" opacity=".8"/>`;
      });
      return sky(id, '#d4efe6', '#f7fbf2') +
        L(0.05, `<circle cx="310" cy="58" r="20" fill="#ffe2b8"/>${birds(70, 70)}`) +
        L(0.12, `<path d="${hills(110, 50, 5, r)}" fill="#a8d5b5"/>`) +
        L(0.2, tiers.slice(0, 2).join('') + `<ellipse cx="120" cy="140" rx="140" ry="12" fill="#fff" opacity=".45"/>`) +
        L(0.32, tiers.slice(2, 4).join('') + `<g transform="translate(250 170)"><rect width="34" height="20" fill="#f4e6cf"/><path d="M-8 2 17-16 42 2Z" fill="#8a5a34"/><rect x="13" y="8" width="8" height="12" fill="#5a3a22"/></g>`) +
        L(0.5, tiers[4] + `${palm(30, 280, 1.5)}${palm(370, 284, 1.3, true)}<ellipse cx="300" cy="250" rx="120" ry="8" fill="#fff" opacity=".3"/>`);
    },
    dunes(r, id) {
      return sky(id, '#ffe0b5', '#fff4e3') +
        L(0.05, `<circle cx="200" cy="120" r="46" fill="#ffb066" opacity=".9"/>${birds(280, 60)}`) +
        L(0.14, `<path d="M-10 170 30 120h40l20 30 30-40h30l20 60Z" fill="#c8754a"/><path d="M280 170l20-56h26l14 26 20-30h20l30 60Z" fill="#b8643a"/>`) +
        L(0.22, `<path d="M-10 200C80 150 160 170 220 190S340 160 410 170V280H-10Z" fill="#f0a65c"/>`) +
        L(0.35, `<path d="M-10 240C70 200 150 210 230 236S360 220 410 210V280H-10Z" fill="#e58c45"/>
          <g transform="translate(110 200)"><path d="M0 24 16 0l16 24Z" fill="#fff4e3"/><path d="M16 0l-4 24h8Z" fill="#c8754a"/></g><g transform="translate(150 206)"><path d="M0 20 13 0l13 20Z" fill="#fff4e3"/></g>
          <g transform="translate(300 214)" fill="#6b3d1f"><ellipse cx="0" cy="-8" rx="14" ry="7"/><path d="M10-10c6-4 8-12 6-18h4c2 8 0 16-6 20Z"/><rect x="-10" y="-4" width="3" height="14"/><rect x="6" y="-4" width="3" height="14"/></g>`) +
        L(0.55, `<path d="M-10 280c60-30 160-40 240-20s140 10 180-4v24Z" fill="#d9773a"/><g stroke="#f7c08a" stroke-width="2" fill="none" opacity=".7"><path d="M40 268c30-8 60-8 90 0"/><path d="M250 262c20-6 50-6 70 0"/></g>`);
    }
  };

  function sceneSVG(type, seed = 1, cls = '') {
    const id = 'g' + type + (++uid);
    const body = scenes[type](rng(seed), id);
    return `<svg class="${cls}" viewBox="0 0 400 280" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${body}</svg>`;
  }

  // illustrated avatar: face, hair and shirt in a colored circle
  function avatarSVG(color, seed = 1) {
    const r = rng(seed);
    const skins = ['#f2c9a0', '#d9a07a', '#a86f4c', '#7a4b31', '#f6d7b8'];
    const hairs = ['#2b1d16', '#5a3a22', '#1a1a1a', '#8a5a34', '#c98f5a'];
    const skin = skins[Math.floor(r() * skins.length)];
    const hair = hairs[Math.floor(r() * hairs.length)];
    const long = r() > 0.5;
    return `<svg viewBox="0 0 52 52" aria-hidden="true"><rect width="52" height="52" fill="${color}" opacity=".18"/>
      ${long ? `<path d="M14 26c0-12 5-17 12-17s12 5 12 17v12H14Z" fill="${hair}"/>` : ''}
      <path d="M8 52c2-10 9-14 18-14s16 4 18 14Z" fill="${color}"/>
      <rect x="22" y="30" width="8" height="9" rx="3" fill="${skin}"/>
      <ellipse cx="26" cy="24" rx="9" ry="10" fill="${skin}"/>
      <path d="M17 22c0-7 4-11 9-11s9 4 9 11c-3-3-7-5-13-4-2 1-4 2-5 4Z" fill="${hair}"/>
      <circle cx="22.5" cy="25" r="1.1" fill="#1a1a1a"/><circle cx="29.5" cy="25" r="1.1" fill="#1a1a1a"/>
      <path d="M23.5 29c1.5 1.2 3.5 1.2 5 0" stroke="#7a3b2a" stroke-width="1.2" fill="none" stroke-linecap="round"/></svg>`;
  }

  window.ILLO = { sceneSVG, avatarSVG };
})();
