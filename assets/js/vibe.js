// Nature "vibe" layer for the home page, added on top of the existing layout:
// - hand-drawn orange brush strokes under section headings, drawn in as they scroll into view
// - illustrated plant clusters (generated SVG) that peek in at section edges and sway
// - a layered landscape above the footer with parallax depth
// Decorative only: everything is aria-hidden and ignores the pointer.
(function () {
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Brush underlines ---------- */
  var BRUSH = '<path class="vb-stroke" d="M6 18 C 60 8, 140 4, 214 12 S 300 20, 316 14" />' +
              '<path class="vb-stroke vb-stroke--2" d="M40 30 C 110 22, 190 21, 262 27" />';
  var targets = document.querySelectorAll(
    '#work .rw-title .soft, #shots .rw-title .soft, .pr-intro__title .soft, .exp-head__title .soft, .services__title'
  );
  var brushes = [];
  Array.prototype.forEach.call(targets, function (el) {
    var host = el.closest('h2') || el;
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'vb-brush');
    svg.setAttribute('viewBox', '0 0 320 40');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = BRUSH;
    host.appendChild(svg);
    brushes.push({ el: el, host: host, svg: svg });
  });
  function placeBrushes() {
    brushes.forEach(function (b) {
      var rects = b.el.getClientRects();
      if (!rects.length) return;
      // union of the rects on the phrase's last line (words may be separate inline boxes)
      var lastR = rects[rects.length - 1], hr = b.host.getBoundingClientRect();
      var L = Infinity, R = -Infinity, B = 0, H = 0;
      Array.prototype.forEach.call(rects, function (rc) {
        if (Math.abs(rc.top - lastR.top) < lastR.height / 2 && rc.width > 0) {
          L = Math.min(L, rc.left); R = Math.max(R, rc.right); B = Math.max(B, rc.bottom); H = Math.max(H, rc.height);
        }
      });
      var last = { left: L, width: R - L, bottom: B, height: H };
      var w = Math.min(last.width * 0.94, 560);
      b.svg.style.left = (last.left - hr.left + (last.width - w) / 2) + 'px';
      b.svg.style.top = (last.bottom - hr.top - last.height * 0.12) + 'px';
      b.svg.style.width = w + 'px';
      b.svg.style.height = Math.max(14, last.height * 0.32) + 'px';
    });
  }
  placeBrushes();
  window.addEventListener('resize', placeBrushes);
  window.addEventListener('load', placeBrushes);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeBrushes);

  brushes.forEach(function (b) {
    var paths = b.svg.querySelectorAll('.vb-stroke');
    Array.prototype.forEach.call(paths, function (p) {
      var len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = (hasGsap && !reduce) ? len : 0;
    });
    if (!hasGsap || reduce) return;
    gsap.to(paths, {
      strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut', stagger: 0.18,
      scrollTrigger: { trigger: b.host, start: 'top 82%', once: true, onEnter: placeBrushes }
    });
  });

  /* ---------- Plant illustrations ---------- */
  var GREENS = ['#1f6b4f', '#2a7f55', '#3a9a5f', '#56b870', '#7cc96f', '#9bd66b'];
  function r(a, b) { return a + Math.random() * (b - a); }
  function f(n) { return Math.round(n * 10) / 10; }
  function leaf(x, y, ang, l, w) {
    var tx = x + Math.cos(ang) * l, ty = y + Math.sin(ang) * l;
    var mx = x + Math.cos(ang) * l * 0.45, my = y + Math.sin(ang) * l * 0.45;
    var nx = -Math.sin(ang) * w, ny = Math.cos(ang) * w;
    return 'M' + f(x) + ',' + f(y) + ' Q' + f(mx + nx) + ',' + f(my + ny) + ' ' + f(tx) + ',' + f(ty) +
           ' Q' + f(mx - nx) + ',' + f(my - ny) + ' ' + f(x) + ',' + f(y) + 'Z';
  }
  function bez(p0, p1, p2, t) {
    var u = 1 - t;
    return { x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x, y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
             tx: 2 * u * (p1.x - p0.x) + 2 * t * (p2.x - p1.x), ty: 2 * u * (p1.y - p0.y) + 2 * t * (p2.y - p1.y) };
  }
  // Fern frond: a curved stem with tapering leaflets on both sides
  function fern(x, y, len, bend, color) {
    var p0 = { x: x, y: y }, p1 = { x: x + bend * 0.4, y: y - len * 0.6 }, p2 = { x: x + bend, y: y - len };
    var d = '', n = 16;
    for (var i = 1; i <= n; i++) {
      var t = 0.1 + (i / n) * 0.88, p = bez(p0, p1, p2, t), a = Math.atan2(p.ty, p.tx);
      var l = len * 0.3 * (1 - t * 0.78), w = l * 0.26, spread = 1.15 - t * 0.5;
      d += leaf(p.x, p.y, a - spread, l, w) + leaf(p.x, p.y, a + spread, l, w);
    }
    return '<g class="vb-sway" data-ox="' + x + '" data-oy="' + y + '">' +
      '<path d="M' + x + ',' + y + ' Q' + f(p1.x) + ',' + f(p1.y) + ' ' + f(p2.x) + ',' + f(p2.y) + '" fill="none" stroke="' + color + '" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="' + d + '" fill="' + color + '"/></g>';
  }
  // Broad tropical leaf with a lighter midrib
  function broad(x, y, ang, l, color, rib) {
    var tx = x + Math.cos(ang) * l, ty = y + Math.sin(ang) * l;
    return '<g class="vb-sway" data-ox="' + x + '" data-oy="' + y + '">' +
      '<path d="' + leaf(x, y, ang, l, l * 0.34) + '" fill="' + color + '"/>' +
      '<path d="M' + x + ',' + y + ' L' + f(tx) + ',' + f(ty) + '" stroke="' + rib + '" stroke-width="2" stroke-linecap="round" opacity=".7"/></g>';
  }
  // Grass tuft
  function grass(x, y, h, color) {
    var d = '';
    for (var i = 0; i < 7; i++) {
      var off = (i - 3) * 5, hh = h * r(0.55, 1), lean = (i - 3) * r(3, 7);
      d += 'M' + f(x + off - 3) + ',' + y + ' Q' + f(x + off + lean * 0.3) + ',' + f(y - hh * 0.6) + ' ' + f(x + off + lean) + ',' + f(y - hh) +
           ' Q' + f(x + off + lean * 0.3 + 4) + ',' + f(y - hh * 0.55) + ' ' + f(x + off + 3) + ',' + y + 'Z';
    }
    return '<g class="vb-sway" data-ox="' + x + '" data-oy="' + y + '"><path d="' + d + '" fill="' + color + '"/></g>';
  }
  // Torch-lily style flower spike: yellow at the base warming to orange-red at the tip
  function spike(x, y, h, lean) {
    var cols = ['#ffd24d', '#ffb13d', '#ff9a3d', '#ff7a45', '#f2553a'];
    var out = '<g class="vb-sway" data-ox="' + x + '" data-oy="' + y + '">' +
      '<path d="M' + x + ',' + y + ' Q' + f(x + lean * 0.3) + ',' + f(y - h * 0.5) + ' ' + f(x + lean) + ',' + f(y - h) + '" fill="none" stroke="#3a9a5f" stroke-width="2.4" stroke-linecap="round"/>';
    for (var i = 0; i < 9; i++) {
      var t = 0.62 + i * 0.045, px = x + lean * t * t, py = y - h * t;
      out += '<ellipse cx="' + f(px) + '" cy="' + f(py) + '" rx="' + f(5.4 - i * 0.35) + '" ry="' + f(7 - i * 0.3) + '" fill="' + cols[Math.min(4, Math.floor(i / 2))] + '"/>';
    }
    return out + '</g>';
  }

  function cluster(kind) {
    var g = '';
    if (kind === 'fern') {
      g += broad(120, 300, -2.05, 170, GREENS[1], GREENS[4]);
      g += fern(150, 300, 230, 60, GREENS[2]);
      g += fern(110, 300, 190, -70, GREENS[3]);
      g += spike(180, 300, 150, 18);
      g += spike(196, 300, 120, 30);
      g += broad(150, 300, -0.95, 140, GREENS[0], GREENS[3]);
      g += grass(90, 300, 70, GREENS[4]);
      g += grass(200, 300, 60, GREENS[5]);
    } else if (kind === 'palm') {
      g += broad(140, 300, -1.2, 190, GREENS[0], GREENS[3]);
      g += broad(140, 300, -1.75, 210, GREENS[2], GREENS[5]);
      g += broad(140, 300, -2.35, 170, GREENS[1], GREENS[4]);
      g += spike(100, 300, 140, -20);
      g += fern(170, 300, 170, 70, GREENS[3]);
      g += grass(140, 300, 64, GREENS[5]);
      g += grass(70, 300, 54, GREENS[4]);
    } else {
      g += fern(140, 300, 210, -50, GREENS[1]);
      g += fern(150, 300, 180, 80, GREENS[3]);
      g += spike(120, 300, 170, -14);
      g += spike(104, 300, 130, -30);
      g += spike(160, 300, 110, 22);
      g += grass(130, 300, 72, GREENS[4]);
      g += grass(180, 300, 50, GREENS[5]);
    }
    return g;
  }

  function addFlora(section, kind, pos, opts) {
    if (!section) return null;
    opts = opts || {};
    section.classList.add('vb-host');
    var wrap = document.createElement('div');
    wrap.className = 'vb-flora vb-flora--' + pos + (opts.mobile ? ' vb-flora--keep' : '') + (opts.front ? ' vb-flora--front' : '');
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML = '<svg viewBox="0 0 300 300" overflow="visible"' + (opts.flip ? ' style="transform:scaleX(-1)"' : '') + '>' + cluster(kind) + '</svg>';
    section.appendChild(wrap);
    return wrap;
  }

  var floras = [
    addFlora(document.getElementById('about'), 'fern', 'br'),
    addFlora(document.getElementById('services'), 'palm', 'bl', { flip: true }),
    addFlora(document.getElementById('experience'), 'spikes', 'tr'),
    addFlora(document.getElementById('beyond'), 'fern', 'bl', { flip: true }),
    addFlora(document.querySelector('#contact .container'), 'palm', 'cl', { flip: true, mobile: true, front: true }),
    addFlora(document.querySelector('#contact .container'), 'spikes', 'cr', { mobile: true, front: true })
  ].filter(Boolean);

  if (hasGsap && !reduce) {
    floras.forEach(function (w) {
      // grow in from the ground, then sway forever
      gsap.from(w.querySelectorAll('.vb-sway'), {
        scaleY: 0, transformOrigin: '50% 100%', duration: 1.2, ease: 'back.out(1.4)', stagger: 0.06,
        scrollTrigger: { trigger: w, start: 'top 95%', once: true }
      });
      w.querySelectorAll('.vb-sway').forEach(function (g) {
        gsap.to(g, { rotation: r(-4, 4) || 2, svgOrigin: g.dataset.ox + ' ' + g.dataset.oy, duration: r(2.4, 4.2),
          ease: 'sine.inOut', yoyo: true, repeat: -1, delay: r(0, 1.5) });
      });
      gsap.fromTo(w, { y: 40 }, { y: -30, ease: 'none', scrollTrigger: { trigger: w, start: 'top bottom', end: 'bottom top', scrub: 0.8 } });
    });
  }

  /* ---------- Landscape above the footer: day turns to dusk, then night, as you arrive ---------- */
  var footer = document.querySelector('.footer');
  if (footer) {
    var land = document.createElement('div');
    land.className = 'vb-land';
    land.setAttribute('aria-hidden', 'true');
    function trees(xs, base, col) {
      return xs.map(function (x, i) {
        var h = 46 + (i % 3) * 14;
        return '<path d="M' + x + ',' + (base - h) + ' L' + (x - h * 0.32) + ',' + base + ' L' + (x + h * 0.32) + ',' + base + 'Z" fill="' + col + '"/>' +
               '<rect x="' + (x - 2) + '" y="' + base + '" width="4" height="10" fill="#6b4a32"/>';
      }).join('');
    }
    function spikes(xs, base) {
      return xs.map(function (x, i) { return spike(x, base, 44 + (i % 3) * 12, (i % 2 ? 6 : -6)); }).join('');
    }
    var stars = '';
    for (var si = 0; si < 46; si++) {
      stars += '<circle class="vb-star" cx="' + Math.round(r(10, 1430)) + '" cy="' + Math.round(r(12, 190)) + '" r="' + f(r(0.8, 2)) + '" fill="#fff"/>';
    }
    var flies = '';
    for (var fi = 0; fi < 16; fi++) {
      flies += '<circle class="vb-fly" cx="' + Math.round(r(60, 1380)) + '" cy="' + Math.round(r(230, 300)) + '" r="2.6" fill="#e9ff8a" filter="url(#vbGlow)"/>';
    }
    land.innerHTML =
      '<svg viewBox="0 0 1440 360" preserveAspectRatio="xMidYMax slice">' +
        '<defs><linearGradient id="vbSky" x1="0" y1="0" x2="0" y2="1">' +
          '<stop class="vb-sky0" offset="0" stop-color="#ffffff"/><stop class="vb-sky1" offset="1" stop-color="#eef8f1"/></linearGradient>' +
          '<filter id="vbGlow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>' +
        '<rect width="1440" height="360" fill="url(#vbSky)"/>' +
        '<g class="vb-stars" opacity="0">' + stars + '</g>' +
        '<g class="vb-moon" opacity="0"><circle cx="300" cy="110" r="34" fill="#fff6d8"/><circle cx="314" cy="102" r="30" fill="#2a2f63" class="vb-moon-cut"/></g>' +
        '<g class="vb-l vb-l--sun"><circle cx="1110" cy="150" r="70" fill="#ffe2c2" opacity=".6"/><circle cx="1110" cy="150" r="44" fill="#ffc58a"/></g>' +
        '<g class="vb-l" data-d="70"><path class="vb-h1" d="M0,240 C160,170 300,190 420,210 S700,150 860,190 S1180,160 1440,210 L1440,360 L0,360Z" fill="#cfe8db"/></g>' +
        '<g class="vb-l" data-d="45"><path class="vb-h2" d="M0,270 C200,220 360,240 520,255 S820,210 1000,240 S1300,230 1440,255 L1440,360 L0,360Z" fill="#8fcaa6"/>' +
          trees([90, 130, 170, 1240, 1280, 1330, 1370], 254, '#5aa97c') + '</g>' +
        '<g class="vb-l" data-d="25"><path class="vb-h3" d="M0,300 C180,265 360,280 560,290 S900,260 1080,280 S1320,285 1440,290 L1440,360 L0,360Z" fill="#4f9d74"/>' +
          trees([260, 300, 980, 1020, 1062], 286, '#2f7d4f') +
          '<g transform="translate(640 246)"><rect x="0" y="12" width="64" height="34" fill="#f6f6f2"/><rect class="vb-win" x="10" y="22" width="44" height="18" fill="#2f6bff"/>' +
          '<path d="M-6,14 L32,-12 L70,14Z" fill="#d4f55c"/></g></g>' +
        '<g class="vb-l" data-d="8"><path class="vb-h4" d="M0,330 C220,308 420,322 720,324 S1200,310 1440,326 L1440,360 L0,360Z" fill="#2f7d4f"/>' +
          spikes([150, 166, 182, 1180, 1196, 1214, 1230], 332) + '</g>' +
        '<g class="vb-flies" opacity="0">' + flies + '</g>' +
      '</svg>';
    footer.parentNode.insertBefore(land, footer);
    footer.classList.add('footer--vb');

    if (hasGsap && !reduce) {
      var st = { trigger: land, start: 'top bottom', end: 'bottom bottom', scrub: 0.6 };
      land.querySelectorAll('.vb-l[data-d]').forEach(function (l) {
        gsap.fromTo(l, { y: +l.dataset.d }, { y: 0, ease: 'none', scrollTrigger: st });
      });
      // the day-to-night timeline, scrubbed by scroll
      var night = gsap.timeline({ scrollTrigger: { trigger: land, start: 'top 75%', end: 'bottom bottom', scrub: 0.8 } });
      night
        .to(land.querySelector('.vb-sky0'), { attr: { 'stop-color': '#ffb48c' }, duration: 1 }, 0)
        .to(land.querySelector('.vb-sky1'), { attr: { 'stop-color': '#ffe0b0' }, duration: 1 }, 0)
        .to(land.querySelector('.vb-l--sun'), { y: 200, duration: 2 }, 0)
        .to(land.querySelector('.vb-sky0'), { attr: { 'stop-color': '#1a2150' }, duration: 1 }, 1)
        .to(land.querySelector('.vb-sky1'), { attr: { 'stop-color': '#4a3f78' }, duration: 1 }, 1)
        .to(land.querySelector('.vb-h1'), { attr: { fill: '#3d4a7a' }, duration: 1 }, 1)
        .to(land.querySelector('.vb-h2'), { attr: { fill: '#2c4a5a' }, duration: 1 }, 1)
        .to(land.querySelector('.vb-h3'), { attr: { fill: '#1f3d36' }, duration: 1 }, 1)
        .to(land.querySelector('.vb-h4'), { attr: { fill: '#173528' }, duration: 1 }, 1)
        .to(land.querySelector('.vb-win'), { attr: { fill: '#ffd166' }, duration: 0.6 }, 1.2)
        .to(land.querySelector('.vb-stars'), { opacity: 1, duration: 0.8 }, 1.2)
        .fromTo(land.querySelector('.vb-moon'), { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.9 }, 1.1)
        .to(land.querySelector('.vb-flies'), { opacity: 1, duration: 0.6 }, 1.4)
        .to(footer, { backgroundColor: '#173528', duration: 1 }, 1);
      land.querySelectorAll('.vb-star').forEach(function (s) {
        gsap.to(s, { opacity: r(0.2, 0.6), duration: r(0.8, 2), yoyo: true, repeat: -1, ease: 'sine.inOut', delay: r(0, 2) });
      });
      land.querySelectorAll('.vb-fly').forEach(function (fl) {
        gsap.to(fl, { x: r(-40, 40), y: r(-30, 10), opacity: r(0.3, 1), duration: r(2, 4), yoyo: true, repeat: -1, ease: 'sine.inOut' });
      });
      land.querySelectorAll('.vb-sway').forEach(function (g) {
        gsap.to(g, { rotation: r(-5, 5), svgOrigin: g.dataset.ox + ' ' + g.dataset.oy, duration: r(2, 3.5), ease: 'sine.inOut', yoyo: true, repeat: -1 });
      });
    }
  }

  /* ---------- Scroll journey: a paper plane leaves the hero island and flies down the page ---------- */
  var journeyOK = hasGsap && !reduce && window.matchMedia('(min-width: 1200px) and (hover: hover)').matches;
  if (journeyOK) {
    var jWrap = document.createElement('div');
    jWrap.className = 'vb-journey';
    jWrap.setAttribute('aria-hidden', 'true');
    jWrap.innerHTML = '<svg><defs><mask id="vbTrailMask" maskUnits="userSpaceOnUse"><path class="vb-trail-reveal" fill="none" stroke="#fff" stroke-width="8"/></mask></defs>' +
      '<path class="vb-trail" fill="none" mask="url(#vbTrailMask)"/>' +
      '<g class="vb-plane"><path d="M0,0 L34,12 L0,24 L8,12Z" fill="#fff" stroke="#0e0e0e" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<path d="M8,12 L34,12 L12,19Z" fill="#ff7a45" stroke="#0e0e0e" stroke-width="1.6" stroke-linejoin="round"/></g></svg>';
    document.body.appendChild(jWrap);
    var jSvg = jWrap.querySelector('svg'), trail = jWrap.querySelector('.vb-trail'), reveal = jWrap.querySelector('.vb-trail-reveal'),
        plane = jWrap.querySelector('.vb-plane'), jTrig = null;

    function buildJourney() {
      if (jTrig) jTrig.kill();
      var W = document.documentElement.clientWidth, Hd = document.documentElement.scrollHeight;
      jSvg.setAttribute('width', W); jSvg.setAttribute('height', Hd); jSvg.setAttribute('viewBox', '0 0 ' + W + ' ' + Hd);
      var heroEl = document.querySelector('.hero'), band = document.querySelector('.hero-land');
      var top = function (el) { return el.getBoundingClientRect().top + window.scrollY; };
      var sx = W * 0.62, sy = band ? top(band) + band.offsetHeight * 0.45 : top(heroEl) + heroEl.offsetHeight - 200;
      var d = 'M' + f(sx) + ',' + f(sy), px = sx, py = sy, side = 1;
      var ids = ['about', 'work', 'shots', 'services', 'experience', 'beyond', 'contact'];
      var margin = Math.max(26, (W - Math.min(W, 1280)) / 4);
      ids.forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        var y0 = top(el) + 40, y1 = top(el) + el.offsetHeight - 40, x = side > 0 ? W - margin : margin;
        d += ' C' + f(px) + ',' + f(py + 160) + ' ' + f(x) + ',' + f(y0 - 160) + ' ' + f(x) + ',' + f(y0);
        var seg = Math.max(1, Math.round((y1 - y0) / 260)), step = (y1 - y0) / seg;
        for (var k = 1; k <= seg; k++) {
          var wob = (k % 2 ? 1 : -1) * Math.min(18, margin * 0.5) * side;
          d += ' Q' + f(x - wob) + ',' + f(y0 + step * (k - 0.5)) + ' ' + f(x) + ',' + f(y0 + step * k);
        }
        px = x; py = y1; side = -side;
      });
      var landEl = document.querySelector('.vb-land');
      if (landEl) {
        var ly = top(landEl) + landEl.offsetHeight * 0.55, lx = W * 0.47;
        d += ' C' + f(px) + ',' + f(py + 200) + ' ' + f(lx) + ',' + f(ly - 220) + ' ' + f(lx) + ',' + f(ly);
      }
      trail.setAttribute('d', d); reveal.setAttribute('d', d);
      var len = reveal.getTotalLength();
      reveal.style.strokeDasharray = len; reveal.style.strokeDashoffset = len;
      // sample the path so the plane can sit at the point matching the viewport, not a linear progress
      var samples = [], N = Math.ceil(len / 12);
      for (var q = 0; q <= N; q++) { var pt = trail.getPointAtLength((q / N) * len); samples.push(pt.y); }
      for (var q2 = 1; q2 < samples.length; q2++) samples[q2] = Math.max(samples[q2], samples[q2 - 1]);
      function lenForY(y) {
        var lo = 0, hi = samples.length - 1;
        if (y <= samples[0]) return 0;
        if (y >= samples[hi]) return len;
        while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (samples[mid] < y) lo = mid; else hi = mid; }
        return (hi / N) * len;
      }
      var cur = { l: 0 };
      function place() {
        var l = cur.l, p1 = trail.getPointAtLength(l), p2 = trail.getPointAtLength(Math.min(len, l + 2));
        var ang = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
        plane.setAttribute('transform', 'translate(' + f(p1.x) + ' ' + f(p1.y) + ') rotate(' + f(ang) + ') translate(-17 -12)');
        reveal.style.strokeDashoffset = len - l;
      }
      jTrig = ScrollTrigger.create({
        start: 0, end: 'max',
        onUpdate: function () {
          var target = lenForY(window.scrollY + window.innerHeight * 0.62);
          gsap.to(cur, { l: target, duration: 0.8, ease: 'power2.out', overwrite: true, onUpdate: place });
        }
      });
      cur.l = lenForY(window.scrollY + window.innerHeight * 0.62); place();
    }
    var jt;
    function queueJourney() { clearTimeout(jt); jt = setTimeout(buildJourney, 200); }
    window.addEventListener('load', queueJourney);
    window.addEventListener('resize', queueJourney);
    if ('ResizeObserver' in window) new ResizeObserver(queueJourney).observe(document.getElementById('main') || document.body);
    buildJourney();
  }

  if (hasGsap) window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
