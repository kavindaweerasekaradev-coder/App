// UI screens showcase (.shw): two endless rows drifting in opposite directions. Scrolling speeds
// them up and skews them a little in the scroll direction; hovering a row pauses it.
(function () {
  var shw = document.querySelector('.shw');
  if (!shw || !window.gsap || !window.ScrollTrigger) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.registerPlugin(ScrollTrigger);

  var rows = gsap.utils.toArray('.shw__row', shw).map(function (row) {
    var track = row.querySelector('.shw__track');
    var dir = +row.getAttribute('data-dir') || -1;
    var dur = row.classList.contains('shw__row--mobile') ? 42 : 60;
    var tween = dir < 0
      ? gsap.fromTo(track, { xPercent: 0 }, { xPercent: -50, duration: dur, ease: 'none', repeat: -1 })
      : gsap.fromTo(track, { xPercent: -50 }, { xPercent: 0, duration: dur, ease: 'none', repeat: -1 });
    var state = { tween: tween, dir: dir, track: track, hover: false };
    row.addEventListener('mouseenter', function () { state.hover = true; gsap.to(tween, { timeScale: 0, duration: 0.6, ease: 'power2.out', overwrite: true }); });
    row.addEventListener('mouseleave', function () { state.hover = false; gsap.to(tween, { timeScale: 1, duration: 0.8, ease: 'power2.in', overwrite: true }); });
    return state;
  });

  // Title: words rise in; rows slide in from opposite sides
  var title = shw.querySelector('.shw__title');
  gsap.from(title, { yPercent: 40, autoAlpha: 0, duration: 1.1, ease: 'power4.out', scrollTrigger: { trigger: title, start: 'top 85%', once: true } });
  rows.forEach(function (r, i) {
    gsap.from(r.track.parentNode, { xPercent: i % 2 ? 25 : -25, autoAlpha: 0, duration: 1.4, ease: 'power3.out',
      scrollTrigger: { trigger: shw.querySelector('.shw__rows'), start: 'top 85%', once: true } });
  });

  // Scroll velocity → speed boost + skew
  var skew = gsap.quickTo(shw.querySelector('.shw__rows'), 'skewX', { duration: 0.6, ease: 'power3.out' });
  ScrollTrigger.create({
    trigger: shw, start: 'top bottom', end: 'bottom top',
    onUpdate: function (self) {
      var v = self.getVelocity();
      skew(gsap.utils.clamp(-6, 6, v / -300));
      rows.forEach(function (r) {
        if (r.hover) return;
        var base = 1, boost = 1 + Math.min(Math.abs(v) / 250, 5);
        gsap.to(r.tween, { timeScale: base * boost, duration: 0.2, overwrite: true });
        gsap.to(r.tween, { timeScale: base, duration: 1.2, delay: 0.2, ease: 'power2.out' });
      });
    }
  });
})();
