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

  // Entrance: back button and heading slide in; the title rises word by word
  if (hasGsap && !reduce) {
    var h1 = document.querySelector('.ex-head h1');
    if (h1 && !h1.querySelector('.ex-word')) {
      h1.innerHTML = h1.textContent.trim().split(/\s+/).map(function (w) {
        return '<span class="ex-word"><span>' + w + '</span></span>';
      }).join(' ');
    }
    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .from('.ex-back', { x: -30, autoAlpha: 0, duration: 0.8 }, 0)
      .from('.ex-head', { autoAlpha: 0, scale: 0.92, duration: 0.7 }, 0.05)
      .from('.ex-word > span', { yPercent: 110, duration: 0.8, stagger: 0.08 }, 0.15)
      .from('.ex-head p', { y: 10, autoAlpha: 0, duration: 0.6 }, 0.45);

    // Tiles unmask from the bottom as they come into view, the image settling from a slight zoom
    gsap.set(tiles, { clipPath: 'inset(100% 0% 0% 0% round 16px)' });
    gsap.set(wall.querySelectorAll('.ex-tile img'), { scale: 1.25 });
    ScrollTrigger.batch(tiles, {
      start: 'top 96%', once: true,
      onEnter: function (batch) {
        gsap.to(batch, { clipPath: 'inset(0% 0% 0% 0% round 16px)', duration: 1.1, ease: 'expo.out', stagger: 0.07,
          onComplete: function () { gsap.set(this.targets(), { clearProps: 'clipPath' }); } });
        gsap.to(batch.map(function (t) { return t.querySelector('img'); }), { scale: 1, duration: 1.4, ease: 'expo.out', stagger: 0.07,
          clearProps: 'transform' });
      }
    });

    // Columns lean slightly with scroll speed, then spring back upright
    var proxy = { skew: 0 }, skewSet = gsap.quickSetter(wall, 'skewY', 'deg'), clampSkew = gsap.utils.clamp(-3, 3);
    ScrollTrigger.create({
      trigger: wall, start: 'top bottom', end: 'bottom top',
      onUpdate: function (self) {
        var sk = clampSkew(self.getVelocity() / -400);
        if (Math.abs(sk) > Math.abs(proxy.skew)) {
          proxy.skew = sk;
          gsap.to(proxy, { skew: 0, duration: 0.8, ease: 'power3', overwrite: true, onUpdate: function () { skewSet(proxy.skew); } });
        }
      }
    });
  }

  // Desktop pointer: tiles tilt toward the cursor and a "View" pill follows it
  if (hasGsap && !reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var pill = document.createElement('div');
    pill.className = 'ex-cursor'; pill.setAttribute('aria-hidden', 'true');
    pill.innerHTML = '<span>View</span><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg>';
    document.body.appendChild(pill);
    gsap.set(pill, { xPercent: -50, yPercent: -50, scale: 0, autoAlpha: 0 });
    var px = gsap.quickTo(pill, 'x', { duration: 0.35, ease: 'power3.out' });
    var py = gsap.quickTo(pill, 'y', { duration: 0.35, ease: 'power3.out' });
    window.addEventListener('mousemove', function (e) { px(e.clientX); py(e.clientY); });

    tiles.forEach(function (t) {
      var rx = gsap.quickTo(t, 'rotationX', { duration: 0.5, ease: 'power3.out' });
      var ry = gsap.quickTo(t, 'rotationY', { duration: 0.5, ease: 'power3.out' });
      t.addEventListener('mouseenter', function () {
        gsap.to(t, { y: -6, transformPerspective: 900, duration: 0.4, ease: 'power3.out' });
        gsap.to(pill, { scale: 1, autoAlpha: 1, duration: 0.35, ease: 'back.out(2)' });
      });
      t.addEventListener('mousemove', function (e) {
        var r = t.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 8);
        rx(((e.clientY - r.top) / r.height - 0.5) * -8);
      });
      t.addEventListener('mouseleave', function () {
        rx(0); ry(0);
        gsap.to(t, { y: 0, duration: 0.5, ease: 'power3.out' });
        gsap.to(pill, { scale: 0, autoAlpha: 0, duration: 0.25, ease: 'power2.in' });
      });
      t.addEventListener('click', function () { gsap.to(pill, { scale: 0, autoAlpha: 0, duration: 0.2 }); });
    });

    // Back button leans toward the cursor
    var back = document.querySelector('.ex-back');
    if (back) {
      var bx = gsap.quickTo(back, 'x', { duration: 0.4, ease: 'power3.out' });
      var by = gsap.quickTo(back, 'y', { duration: 0.4, ease: 'power3.out' });
      back.addEventListener('mousemove', function (e) {
        var r = back.getBoundingClientRect();
        bx((e.clientX - r.left - r.width / 2) * 0.25); by((e.clientY - r.top - r.height / 2) * 0.35);
      });
      back.addEventListener('mouseleave', function () { bx(0); by(0); });
    }
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
