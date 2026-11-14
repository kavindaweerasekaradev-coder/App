// Design systems playground (home): the token controls change CSS variables on .ds-lab, so the
// preview components update live; the code panel shows the current token values.
(function () {
  var lab = document.querySelector('.ds-lab');
  if (!lab) return;
  var ACCENTS = { lime: ['#d4f55c', '#0e0e0e'], indigo: ['#5a5ede', '#ffffff'], coral: ['#ff6b5a', '#ffffff'], teal: ['#14b8a6', '#ffffff'] };
  var DENSITY = { compact: 6, comfortable: 8 };
  function flash(key, text) {
    var el = lab.querySelector('[data-token="' + key + '"]');
    if (!el) return;
    el.textContent = text; el.classList.remove('is-flash'); void el.offsetWidth; el.classList.add('is-flash');
  }
  function set(kind, value) {
    if (kind === 'accent') { var a = ACCENTS[value]; lab.style.setProperty('--ds-accent', a[0]); lab.style.setProperty('--ds-on', a[1]); flash('accent', a[0]); }
    if (kind === 'radius') { lab.style.setProperty('--ds-r', value + 'px'); flash('radius', value === '999' ? '999px' : value + 'px'); }
    if (kind === 'density') { lab.style.setProperty('--ds-u', DENSITY[value] + 'px'); flash('density', DENSITY[value] + 'px'); }
    lab.querySelectorAll('[data-set="' + kind + '"]').forEach(function (b) {
      var on = b.dataset.value === value; b.classList.toggle('is-on', on); b.setAttribute('aria-checked', String(on));
    });
    if (window.gsap && !window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      gsap.fromTo(lab.querySelectorAll('.ds-piece'), { scale: 0.98 }, { scale: 1, duration: 0.5, ease: 'back.out(2)', stagger: 0.04 });
  }
  lab.querySelectorAll('[data-set]').forEach(function (b) {
    b.addEventListener('click', function () { set(b.dataset.set, b.dataset.value); });
  });
  // arrow keys inside each radio group
  lab.querySelectorAll('[role="radiogroup"]').forEach(function (g) {
    g.addEventListener('keydown', function (e) {
      if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].indexOf(e.key) < 0) return;
      var items = Array.prototype.slice.call(g.querySelectorAll('[data-set]'));
      var i = items.indexOf(document.activeElement); if (i < 0) return;
      e.preventDefault();
      var n = items[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length];
      n.focus(); n.click();
    });
  });
  var sw = lab.querySelector('.ds-switch');
  if (sw) sw.addEventListener('click', function () { var on = !sw.classList.contains('is-on'); sw.classList.toggle('is-on', on); sw.setAttribute('aria-checked', String(on)); });
  lab.querySelectorAll('.ds-chip').forEach(function (c) { c.addEventListener('click', function () { c.classList.toggle('is-on'); }); });

  // Entrance and a short self-demo the first time the section is seen
  if (!window.gsap || !window.ScrollTrigger || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.registerPlugin(ScrollTrigger);
  var pieces = lab.querySelectorAll('.ds-piece'), layers = document.querySelectorAll('.ds-layer'), stats = document.querySelectorAll('.ds-stat');
  gsap.set(pieces, { autoAlpha: 0, y: 30, scale: 0.94 });
  gsap.set(layers, { autoAlpha: 0, y: 40 });
  gsap.set(stats, { autoAlpha: 0, y: 30 });
  var touched = false;
  lab.addEventListener('pointerdown', function () { touched = true; }, { once: true });
  ScrollTrigger.create({ trigger: lab, start: 'top 70%', once: true, onEnter: function () {
    gsap.to(pieces, { autoAlpha: 1, y: 0, scale: 1, duration: 0.8, ease: 'back.out(1.6)', stagger: 0.1 });
    var demo = [['accent', 'indigo'], ['radius', '999'], ['accent', 'coral'], ['radius', '8'], ['accent', 'lime'], ['radius', '16']];
    demo.forEach(function (d, i) { gsap.delayedCall(1.4 + i * 0.9, function () { if (!touched) set(d[0], d[1]); }); });
  } });
  // Anatomy: the button lands, then each token tag snaps to it; principles rise
  var tags = document.querySelectorAll('.ds-tag'), abtn = document.querySelector('.ds-anatomy__btn'), sts = document.querySelectorAll('.ds-state'), prs = document.querySelectorAll('.ds-pr');
  if (abtn) {
    gsap.set(abtn, { autoAlpha: 0, scale: 0.7 });
    gsap.set(tags, { autoAlpha: 0, y: function (i) { return i < 2 ? -14 : 14; } });
    gsap.set(sts, { autoAlpha: 0, y: 10 });
    ScrollTrigger.create({ trigger: '.ds-anatomy', start: 'top 72%', once: true, onEnter: function () {
      gsap.timeline()
        .to(abtn, { autoAlpha: 1, scale: 1, duration: 0.7, ease: 'back.out(2)' })
        .to(tags, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'back.out(2.5)', stagger: 0.15 }, '-=0.1')
        .to(sts, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power3.out', stagger: 0.07 }, '-=0.2');
    } });
  }
  gsap.set(prs, { autoAlpha: 0, y: 40 });
  ScrollTrigger.create({ trigger: '.ds-principles', start: 'top 82%', once: true, onEnter: function () {
    gsap.to(prs, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.12 });
  } });
  ScrollTrigger.create({ trigger: '.ds-layers', start: 'top 82%', once: true, onEnter: function () {
    gsap.to(layers, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.12 });
  } });
  ScrollTrigger.create({ trigger: '.ds-proof', start: 'top 85%', once: true, onEnter: function () {
    gsap.to(stats, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.1 });
    stats.forEach(function (s) {
      var b = s.querySelector('b[data-count]'); if (!b) return;
      var o = { v: 0 }, to = +b.dataset.count;
      gsap.to(o, { v: to, duration: 1.4, ease: 'power2.out', onUpdate: function () { b.textContent = Math.round(o.v); } });
    });
  } });
})();
