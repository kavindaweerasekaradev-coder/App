// Before/after compare (.ba): a range input over two stacked screens sets --pos, which clips the old
// screen. The first time each compare comes into view, the handle sweeps once to hint that it can be
// dragged (skipped with reduced motion or once the visitor has touched it).
(function () {
  var items = document.querySelectorAll('.ba');
  if (!items.length) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  items.forEach(function (ba) {
    var range = ba.querySelector('.ba__range');
    var touched = false;
    function set(v) { ba.style.setProperty('--pos', v + '%'); }
    range.addEventListener('input', function () { touched = true; if (hint) hint.kill(); set(range.value); });
    range.addEventListener('pointerdown', function () { touched = true; if (hint) hint.kill(); ba.classList.add('is-dragging'); });
    window.addEventListener('pointerup', function () { ba.classList.remove('is-dragging'); });
    set(range.value);

    var hint = null;
    if (reduce || !window.gsap || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      if (touched) return;
      var s = { v: 50 };
      hint = gsap.timeline({ delay: 0.3, onUpdate: function () { range.value = Math.round(s.v); set(s.v); } })
        .to(s, { v: 82, duration: 0.8, ease: 'power2.inOut' })
        .to(s, { v: 18, duration: 1.1, ease: 'power2.inOut' })
        .to(s, { v: 50, duration: 0.8, ease: 'power2.inOut' });
    }, { threshold: 0.6 });
    io.observe(ba);
  });
})();
