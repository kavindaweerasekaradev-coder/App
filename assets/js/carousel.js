// Case study screen carousels (.sc): Web / Mobile tabs, centred slides with depth, drag/swipe,
// arrows, arrow keys, click-to-centre and autoplay with a progress bar. Uses GSAP when present;
// without it the track stays a swipeable scroll-snap row.
(function () {
  var carousels = document.querySelectorAll('.sc');
  if (!carousels.length || !window.gsap) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (window.Draggable) gsap.registerPlugin(Draggable);

  carousels.forEach(function (sc) {
    sc.classList.add('is-ready');
    var stage = sc.querySelector('.sc__stage');
    var tabs = sc.querySelectorAll('.sc__tab');
    var sets = sc.querySelectorAll('.sc__set');
    var countEl = sc.querySelector('.sc__count b');
    var totalEl = sc.querySelector('.sc__count');
    var capEl = sc.querySelector('.sc__caption');
    var bar = sc.querySelector('.sc__progress i');
    var clean = sc.classList.contains('sc--clean');
    var cur = 0, idx = 0, auto = null, dragging = false;

    function slides() { return sets[cur].querySelectorAll('.sc__slide'); }
    function track() { return sets[cur].querySelector('.sc__track'); }
    function offsetFor(i) {
      var s = slides()[i];
      return stage.clientWidth / 2 - (s.offsetLeft + s.offsetWidth / 2);
    }

    function go(i, instant) {
      var list = slides(), n = list.length;
      idx = ((i % n) + n) % n;
      var d = instant || reduce ? 0 : 0.9;
      gsap.to(track(), { x: offsetFor(idx), duration: d, ease: 'power3.inOut', overwrite: true });
      list.forEach(function (s, k) {
        var dist = Math.abs(k - idx);
        gsap.to(s, clean ? {
          scale: dist === 0 ? 1 : 0.86, autoAlpha: dist === 0 ? 1 : dist === 1 ? 0.35 : 0, duration: d, ease: 'power3.out', overwrite: true
        } : {
          scale: dist === 0 ? 1 : 0.84, autoAlpha: dist === 0 ? 1 : dist === 1 ? 0.5 : 0.22,
          rotationY: reduce ? 0 : (k < idx ? 16 : k > idx ? -16 : 0), duration: d, ease: 'power3.out', overwrite: true
        });
        s.classList.toggle('is-active', dist === 0);
      });
      if (clean && !instant && !reduce) {
        var img = list[idx].querySelector('img');
        gsap.fromTo(img, { clipPath: 'inset(6% 6% 6% 6% round 18px)', scale: 1.06 },
          { clipPath: 'inset(0% 0% 0% 0% round 0px)', scale: 1, duration: 1.1, ease: 'expo.out', overwrite: true, clearProps: 'clipPath' });
      }
      countEl.textContent = String(idx + 1).padStart(2, '0');
      totalEl.lastChild.textContent = ' / ' + String(n).padStart(2, '0');
      var text = list[idx].getAttribute('data-caption');
      if (reduce) capEl.textContent = text;
      else gsap.fromTo(capEl, { yPercent: 100, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.5, ease: 'power3.out', overwrite: true,
        onStart: function () { capEl.textContent = text; } });
      startAuto();
    }

    function startAuto() {
      if (auto) auto.kill();
      if (reduce) return;
      auto = gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 4, ease: 'none', paused: !inView, onComplete: function () { go(idx + 1); } });
      if (hovering || dragging) auto.pause();
    }

    function switchSet(n) {
      if (n === cur) return;
      var from = sets[cur], to = sets[n];
      tabs.forEach(function (t, k) { t.setAttribute('aria-selected', String(k === n)); });
      var swap = function () { from.hidden = true; to.hidden = false; cur = n; bindDrag(); go(0, true);
        if (!reduce) gsap.fromTo(to, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }); };
      if (reduce) swap();
      else gsap.to(from, { autoAlpha: 0, y: -20, duration: 0.3, ease: 'power2.in', onComplete: function () { gsap.set(from, { clearProps: 'all' }); swap(); } });
    }

    var drag = null, startX = 0, lastX = 0, lastT = 0, vel = 0;
    function bindDrag() {
      if (!window.Draggable) return;
      if (drag) drag.kill();
      drag = Draggable.create(track(), {
        type: 'x', trigger: stage, minimumMovement: 6, allowContextMenu: true,
        onPress: function () { gsap.killTweensOf(this.target); startX = this.x; lastX = this.x; lastT = performance.now(); vel = 0; },
        onDragStart: function () { dragging = true; sc.classList.add('is-grabbing'); auto && auto.pause(); },
        onDrag: function () { var now = performance.now(); vel = (this.x - lastX) / Math.max(now - lastT, 1); lastX = this.x; lastT = now; },
        onRelease: function () {
          sc.classList.remove('is-grabbing');
          if (!dragging) return;
          var target = this.x + vel * 220, best = idx, bestD = Infinity;
          slides().forEach(function (s, k) { var d = Math.abs(offsetFor(k) - target); if (d < bestD) { bestD = d; best = k; } });
          setTimeout(function () { dragging = false; }, 0);
          go(best);
        }
      })[0];
    }

    tabs.forEach(function (t, k) { t.addEventListener('click', function () { switchSet(k); }); });
    sc.querySelector('.sc__next').addEventListener('click', function () { go(idx + 1); });
    sc.querySelector('.sc__prev').addEventListener('click', function () { go(idx - 1); });
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(idx + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx - 1); }
    });
    sets.forEach(function (set) {
      set.querySelectorAll('.sc__slide').forEach(function (s, k) {
        s.addEventListener('click', function () { if (!dragging && k !== idx) go(k); });
      });
    });
    var hovering = false, inView = false;
    sc.addEventListener('mouseenter', function () { hovering = true; auto && auto.pause(); });
    sc.addEventListener('mouseleave', function () { hovering = false; if (auto && inView) auto.resume(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        inView = es[0].isIntersecting;
        if (!auto) return;
        if (inView && !hovering) auto.resume(); else auto.pause();
      }, { threshold: 0.35 }).observe(sc);
    }
    window.addEventListener('resize', function () { go(idx, true); });
    window.addEventListener('load', function () { go(idx, true); });

    bindDrag();
    go(0, true);
  });
})();
