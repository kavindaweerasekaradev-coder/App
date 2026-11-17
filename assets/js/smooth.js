// Smooth scrolling for the whole site (Lenis), synced with GSAP ScrollTrigger.
// In-page links (#section) glide to their target below the sticky nav.
// Off when the visitor prefers reduced motion; touch devices keep native scrolling.
(function () {
  if (!window.Lenis) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var lenis = new Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true });
  window.lenis = lenis;

  if (window.gsap && window.ScrollTrigger) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  } else {
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
  }

  function navOffset() {
    var nav = document.querySelector('.nav');
    var bar = document.querySelector('.cs-chapters');
    return -((nav ? nav.offsetHeight : 0) + (bar ? bar.offsetHeight : 0) + 12);
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var url = new URL(a.href, location.href);
    if (!url.hash || url.pathname !== location.pathname || url.origin !== location.origin) return;
    var target = url.hash === '#top' ? 0 : document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (target === null) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: target === 0 ? 0 : navOffset() });
    history.replaceState(null, '', url.hash);
  });

  // Arriving with a #hash: land on it below the nav
  if (location.hash && location.hash.length > 1) {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.addEventListener('load', function () {
      // after ScrollTrigger's own load refresh, so it doesn't undo the jump
      setTimeout(function () {
        var t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (!t) return;
        lenis.scrollTo(t, { offset: navOffset(), immediate: true, force: true });
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      }, 120);
    });
  }
})();
