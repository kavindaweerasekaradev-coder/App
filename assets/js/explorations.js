// Explorations wall: tiles are packed into columns (6/4/3/2 by width), each column drifts at its own
// speed as you scroll, tiles rise in on load, and clicking a tile opens it full size in a viewer.
(function () {
  var wall = document.querySelector('.ex-wall');
  if (!wall) return;
  var tiles = Array.prototype.slice.call(wall.querySelectorAll('.ex-tile'));
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  function colCount() {
    var w = window.innerWidth;
    return w >= 1400 ? 6 : w >= 1100 ? 5 : w >= 800 ? 4 : w >= 560 ? 3 : 2;
  }

  var current = 0, triggers = [];
  function build() {
    var n = colCount();
    if (n === current) return;
    current = n;
    triggers.forEach(function (t) { t.kill(); });
    triggers = [];
    wall.innerHTML = '';
    wall.classList.add('is-columns');
    var cols = [], heights = [];
    for (var i = 0; i < n; i++) {
      var c = document.createElement('div');
      c.className = 'ex-col';
      wall.appendChild(c); cols.push(c); heights.push(0);
    }
    tiles.forEach(function (t) {
      var img = t.querySelector('img');
      var ratio = (+img.getAttribute('height') || 1) / (+img.getAttribute('width') || 1);
      var k = heights.indexOf(Math.min.apply(null, heights));
      cols[k].appendChild(t); heights[k] += ratio + 0.08;
    });
    if (!hasGsap || reduce) return;
    // each column drifts: odd columns move against the scroll, even ones with it, at varied speeds
    cols.forEach(function (c, k) {
      var amp = (k % 2 ? -1 : 1) * (60 + (k % 3) * 45) * (n <= 2 ? 0.25 : n <= 3 ? 0.5 : 1);
      var tween = gsap.fromTo(c, { y: amp }, { y: -amp, ease: 'none',
        scrollTrigger: { trigger: wall, start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
      triggers.push(tween.scrollTrigger);
    });
    ScrollTrigger.refresh();
  }

  build();
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(build, 150); });

  // Entrance: header slides in, tiles rise column by column
  if (hasGsap && !reduce) {
    gsap.from('.ex-back, .ex-head', { y: -20, autoAlpha: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1 });
    gsap.utils.toArray('.ex-col').forEach(function (c, k) {
      gsap.from(c.querySelectorAll('.ex-tile'), { y: 80, autoAlpha: 0, scale: 0.94, duration: 1, ease: 'power3.out',
        stagger: 0.08, delay: 0.15 + k * 0.07, clearProps: 'transform,opacity,visibility' });
    });
  }

  // Viewer
  var viewer = document.querySelector('.ex-viewer');
  var vBg = viewer.querySelector('.ex-viewer__bg'), vFig = viewer.querySelector('.ex-viewer__fig');
  var vImg = vFig.querySelector('img'), vTitle = viewer.querySelector('.ex-viewer__title');
  var vLink = viewer.querySelector('.ex-viewer__link'), vClose = viewer.querySelector('.ex-viewer__close');
  var openTile = null, lastFocus = null;

  function targetBox(fw, fh) {
    var maxW = window.innerWidth * 0.9, maxH = window.innerHeight * 0.82;
    var s = Math.min(maxW / fw, maxH / fh, 1.4);
    return { w: fw * s, h: fh * s };
  }

  function open(tile) {
    openTile = tile; lastFocus = document.activeElement;
    var thumb = tile.querySelector('img'), r = thumb.getBoundingClientRect();
    var fw = +tile.dataset.fw, fh = +tile.dataset.fh, box = targetBox(fw, fh);
    vImg.src = thumb.currentSrc || thumb.src;
    var full = new Image(); full.onload = function () { if (openTile === tile) vImg.src = full.src; }; full.src = tile.dataset.full;
    vImg.alt = tile.dataset.title; vTitle.textContent = tile.dataset.title;
    var ext = /^https?:/.test(tile.getAttribute('href'));
    vLink.href = tile.href; vLink.textContent = ext ? 'View on Dribbble ↗' : 'View case study →';
    if (ext) { vLink.target = '_blank'; } else { vLink.removeAttribute('target'); }
    viewer.hidden = false; viewer.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('ex-lock');
    if (window.lenis) window.lenis.stop();
    gsap.set(vImg, { width: box.w, height: box.h });
    if (!hasGsap || reduce) { vClose.focus(); return; }
    var sx = r.width / box.w, x = r.left + r.width / 2 - window.innerWidth / 2, y = r.top + r.height / 2 - (window.innerHeight / 2 - 18);
    thumb.style.visibility = 'hidden';
    gsap.timeline()
      .fromTo(vBg, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: 'power2.out' }, 0)
      .fromTo(vFig, { x: x, y: y, scale: sx }, { x: 0, y: 0, scale: 1, duration: 0.7, ease: 'expo.out' }, 0)
      .fromTo([vFig.querySelector('figcaption'), vClose], { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.06 }, 0.35);
    vClose.focus();
  }

  function close() {
    if (!openTile) return;
    var tile = openTile, thumb = tile.querySelector('img');
    var finish = function () {
      viewer.hidden = true; viewer.setAttribute('aria-hidden', 'true'); thumb.style.visibility = '';
      document.documentElement.classList.remove('ex-lock');
      if (window.lenis) window.lenis.start();
      openTile = null; if (lastFocus) lastFocus.focus();
    };
    if (!hasGsap || reduce) return finish();
    var r = thumb.getBoundingClientRect(), box = vImg.getBoundingClientRect();
    gsap.timeline({ onComplete: finish })
      .to([vFig.querySelector('figcaption'), vClose], { autoAlpha: 0, duration: 0.2 }, 0)
      .to(vFig, { x: r.left + r.width / 2 - window.innerWidth / 2, y: r.top + r.height / 2 - (window.innerHeight / 2 - 18),
        scale: r.width / box.width, duration: 0.55, ease: 'expo.inOut' }, 0)
      .to(vBg, { autoAlpha: 0, duration: 0.45 }, 0.1);
  }

  tiles.forEach(function (t) {
    t.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault(); open(t);
    });
  });
  vBg.addEventListener('click', close);
  vClose.addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (!openTile) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      var i = tiles.indexOf(openTile) + (e.key === 'ArrowRight' ? 1 : -1);
      var next = tiles[(i + tiles.length) % tiles.length];
      openTile.querySelector('img').style.visibility = '';
      var thumb = next.querySelector('img'), box = targetBox(+next.dataset.fw, +next.dataset.fh);
      openTile = next; vImg.src = thumb.currentSrc || thumb.src;
      var full = new Image(); full.onload = function () { if (openTile === next) vImg.src = full.src; }; full.src = next.dataset.full;
      vTitle.textContent = next.dataset.title; vImg.alt = next.dataset.title; vLink.href = next.href;
      gsap.set(vImg, { width: box.w, height: box.h });
      if (hasGsap && !reduce) gsap.fromTo(vFig, { autoAlpha: 0, x: e.key === 'ArrowRight' ? 40 : -40 }, { autoAlpha: 1, x: 0, duration: 0.45, ease: 'power3.out' });
    }
  });
})();
