// ReadyMe case study motion. Everything plays once when it comes into view (nothing is scroll-scrubbed);
// with reduced motion or without GSAP the page shows its final, static state.
(function () {
  // Audit hotspots <-> issue list highlighting works with or without GSAP
  var pins = document.querySelectorAll('.rm-pin'), issues = document.querySelectorAll('.rm-issue');
  function activate(i) {
    pins.forEach(function (p) { p.classList.toggle('is-active', p.dataset.i === String(i)); });
    issues.forEach(function (it) { it.classList.toggle('is-active', it.dataset.i === String(i)); });
  }
  function clear() { activate(-1); }
  pins.forEach(function (p) {
    p.addEventListener('mouseenter', function () { activate(p.dataset.i); });
    p.addEventListener('focus', function () { activate(p.dataset.i); });
    p.addEventListener('click', function () { activate(p.dataset.i); });
    p.addEventListener('mouseleave', clear); p.addEventListener('blur', clear);
  });
  issues.forEach(function (it) {
    it.addEventListener('mouseenter', function () { activate(it.dataset.i); });
    it.addEventListener('mouseleave', clear);
  });

  // Keep the journey line running through the step numbers at any width (desktop layout only)
  var jwrap = document.querySelector('.rm-journey-wrap');
  function placeLine() {
    if (!jwrap) return;
    var n = jwrap.querySelector('.rm-step__n'), line = jwrap.querySelector('.rm-journey__line');
    if (window.matchMedia('(max-width: 980px)').matches) { line.style.removeProperty('--jline'); return; }
    var wr = jwrap.getBoundingClientRect(), nr = n.getBoundingClientRect();
    line.style.setProperty('--jline', (nr.top - wr.top + nr.height / 2 - 1) + 'px');
  }
  placeLine();
  window.addEventListener('load', placeLine);
  window.addEventListener('resize', placeLine);

  // Key flows tabs (authoring tool)
  var ajTabs = document.querySelectorAll('.aj-tab');
  function showFlow(i, animate) {
    ajTabs.forEach(function (t, k) { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
    document.querySelectorAll('.aj-flow').forEach(function (f, k) {
      f.hidden = k !== i;
      if (k === i && animate && window.gsap && !window.matchMedia('(prefers-reduced-motion: reduce)').matches)
        gsap.fromTo(f.querySelectorAll('.aj-node'), { autoAlpha: 0, x: -24, scale: 0.94 }, { autoAlpha: 1, x: 0, scale: 1, duration: 0.5, ease: 'back.out(1.6)', stagger: 0.08 });
    });
  }
  ajTabs.forEach(function (t, i) {
    t.addEventListener('click', function () { showFlow(i, true); });
    t.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var n = (i + (e.key === 'ArrowRight' ? 1 : -1) + ajTabs.length) % ajTabs.length;
      showFlow(n, true); ajTabs[n].focus();
    });
  });
  if (ajTabs.length) showFlow(0, false);

  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  var mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', function () {
    var once = function (trigger, fn, start) { ScrollTrigger.create({ trigger: trigger, start: start || 'top 78%', once: true, onEnter: fn }); };

    // Hero stage: the old screen lands, then the new screens fan out around it; chips pop and float
    var stage = document.querySelector('.rm-stage');
    if (stage) {
      var old = stage.querySelector('.rm-dev--old'), news = stage.querySelectorAll('.rm-dev--l, .rm-dev--c, .rm-dev--r');
      var chips = stage.querySelectorAll('.rm-chip');
      var stageTl = gsap.timeline({ paused: true });
      stageTl
        .from(stage, { autoAlpha: 0, y: 40, duration: 0.9, ease: 'power3.out' })
        .from(old, { y: 140, autoAlpha: 0, duration: 0.9, ease: 'power3.out' }, 0.2)
        .from(news, { y: 220, autoAlpha: 0, scale: 0.85, duration: 1.1, ease: 'expo.out', stagger: { each: 0.12, from: 'center' } }, 0.55)
        .from(chips, { scale: 0, autoAlpha: 0, duration: 0.6, ease: 'back.out(2.2)', stagger: 0.1 }, 1.1)
        .add(function () {
          chips.forEach(function (c, i) {
            gsap.to(c, { y: i % 2 ? 8 : -8, duration: 2.4 + i * 0.3, ease: 'sine.inOut', yoyo: true, repeat: -1 });
          });
        });
      once(stage, function () { stageTl.play(); }, 'top 88%');
      // depth parallax with the cursor
      var depths = { 'rm-dev--old': 8, 'rm-dev--l': 14, 'rm-dev--c': 22, 'rm-dev--r': 14 };
      var movers = Array.prototype.map.call(stage.querySelectorAll('.rm-dev'), function (d) {
        var k = Object.keys(depths).filter(function (c) { return d.classList.contains(c); })[0];
        return { x: gsap.quickTo(d, 'x', { duration: 0.8, ease: 'power3.out' }), y: gsap.quickTo(d, 'y', { duration: 0.8, ease: 'power3.out' }), z: depths[k] || 10 };
      });
      stage.addEventListener('mousemove', function (e) {
        var r = stage.getBoundingClientRect(), dx = (e.clientX - r.left) / r.width - 0.5, dy = (e.clientY - r.top) / r.height - 0.5;
        movers.forEach(function (m) { m.x(dx * m.z); m.y(dy * m.z * 0.6); });
      });
      stage.addEventListener('mouseleave', function () { movers.forEach(function (m) { m.x(0); m.y(0); }); });
    }

    // Stats count up
    gsap.utils.toArray('.rm-stat').forEach(function (s, i) {
      var n = s.querySelector('.rm-stat__n'), to = +n.dataset.count, o = { v: 0 };
      gsap.set(s, { autoAlpha: 0, y: 30 });
      once(s, function () {
        gsap.to(s, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: i * 0.08 });
        gsap.to(o, { v: to, duration: 1.4, ease: 'power2.out', delay: i * 0.08, onUpdate: function () { n.textContent = Math.round(o.v) + (n.dataset.suffix || ''); } });
      }, 'top 85%');
    });

    // Audit: pins pop one by one, issues slide in, then each issue is highlighted briefly in turn
    var audit = document.querySelector('.rm-audit');
    if (audit) {
      gsap.set(pins, { scale: 0 });
      gsap.set(issues, { autoAlpha: 0, x: 30 });
      once(audit, function () {
        var tl = gsap.timeline();
        tl.to(pins, { scale: 1, duration: 0.5, ease: 'back.out(3)', stagger: 0.12 }, 0.2)
          .to(issues, { autoAlpha: 1, x: 0, duration: 0.6, ease: 'power3.out', stagger: 0.1 }, 0.2);
        issues.forEach(function (_, i) { tl.call(activate, [i], 1.2 + i * 0.55); });
        tl.call(clear, null, 1.2 + issues.length * 0.55);
      }, 'top 70%');
    }

    // Navigation: old tabs get struck out, new tabs slide in
    var ia = document.querySelector('.rm-ia');
    if (ia) {
      var olds = ia.querySelectorAll('.rm-ia__col--old li'), newsIa = ia.querySelectorAll('.rm-ia__col--new li');
      gsap.set(newsIa, { autoAlpha: 0, x: 40 });
      once(ia, function () {
        gsap.timeline()
          .to(olds, { '--strike': 1, color: '#9a9a9a', duration: 0.5, ease: 'power2.inOut', stagger: 0.15 }, 0.4)
          .to(ia.querySelector('.rm-ia__arrow'), { rotate: 360, duration: 0.8, ease: 'power3.inOut' }, 0.8)
          .to(newsIa, { autoAlpha: 1, x: 0, duration: 0.6, ease: 'back.out(1.6)', stagger: 0.12 }, 1);
      });
    }

    // Journey: the line draws across and each step pops in as it is reached
    var jw = document.querySelector('.rm-journey-wrap');
    if (jw) {
      var steps = jw.querySelectorAll('.rm-step'), line = jw.querySelector('.rm-journey__line i');
      var vertical = window.matchMedia('(max-width: 980px)').matches;
      gsap.set(line, vertical ? { scaleY: 0 } : { scaleX: 0 });
      gsap.set(steps, { autoAlpha: 0, y: 50 });
      once(jw, function () {
        var tl = gsap.timeline();
        tl.to(line, vertical ? { scaleY: 1, duration: 2, ease: 'none' } : { scaleX: 1, duration: 2, ease: 'none' }, 0);
        steps.forEach(function (s, i) {
          tl.to(s, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'back.out(1.5)' }, i * 0.4)
            .from(s.querySelector('.rm-step__n'), { scale: 0, duration: 0.5, ease: 'back.out(3)' }, i * 0.4 + 0.15);
        });
      }, 'top 72%');
    }

    // Palette swatches flip in, components float in and settle
    var pal = document.querySelector('.rm-palette');
    if (pal) {
      var sw = pal.querySelectorAll('.rm-swatch');
      gsap.set(sw, { autoAlpha: 0, rotationX: -80, transformPerspective: 600, transformOrigin: '50% 0%' });
      once(pal, function () { gsap.to(sw, { autoAlpha: 1, rotationX: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08 }); });
    }
    var comps = document.querySelector('.rm-comps');
    if (comps) {
      var cs = comps.querySelectorAll('.rm-comp');
      gsap.set(cs, { autoAlpha: 0, y: 60, rotation: function () { return gsap.utils.random(-6, 6); } });
      once(comps, function () { gsap.to(cs, { autoAlpha: 1, y: 0, rotation: 0, duration: 1, ease: 'elastic.out(1, 0.7)', stagger: 0.08 }); });
    }

    // Before/after: each phone tilts up into place as it appears
    gsap.utils.toArray('.rm-pair').forEach(function (pair) {
      var ba = pair.querySelector('.ba'), num = pair.querySelector('.rm-pair__num');
      ba.classList.remove('reveal');
      gsap.set(ba, { autoAlpha: 0, y: 80, rotationY: pair.classList.contains('rm-pair--flip') ? 18 : -18, transformPerspective: 1000 });
      once(pair, function () {
        gsap.to(ba, { autoAlpha: 1, y: 0, rotationY: 0, duration: 1.1, ease: 'power3.out' });
        if (num) gsap.from(num, { scale: 0.4, autoAlpha: 0, duration: 0.6, ease: 'back.out(2.5)', delay: 0.2 });
      }, 'top 75%');
    });

    // Authoring tool: browser windows slide in from opposite sides, chips pop and float, cursor parallax
    var ats = document.querySelector('.at-stage:not(.aj-stage)');
    if (ats) {
      var wOld = ats.querySelector('.at-win--old'), wNew = ats.querySelector('.at-win--new'), aChips = ats.querySelectorAll('.rm-chip');
      var atl = gsap.timeline({ paused: true })
        .from(ats, { autoAlpha: 0, y: 40, duration: 0.8, ease: 'power3.out' })
        .from(wOld, { x: -160, autoAlpha: 0, duration: 1, ease: 'power3.out' }, 0.15)
        .from(wNew, { x: 200, y: 60, autoAlpha: 0, scale: 0.92, duration: 1.2, ease: 'expo.out' }, 0.45)
        .from(aChips, { scale: 0, autoAlpha: 0, duration: 0.6, ease: 'back.out(2.2)', stagger: 0.12 }, 1)
        .add(function () { aChips.forEach(function (c, i) { gsap.to(c, { y: i % 2 ? 8 : -8, duration: 2.4 + i * 0.3, ease: 'sine.inOut', yoyo: true, repeat: -1 }); }); });
      once(ats, function () { atl.play(); }, 'top 88%');
      var px = [[wOld, 10], [wNew, 22]].map(function (w) { return { x: gsap.quickTo(w[0], 'x', { duration: 0.8, ease: 'power3.out' }), y: gsap.quickTo(w[0], 'y', { duration: 0.8, ease: 'power3.out' }), z: w[1] }; });
      ats.addEventListener('mousemove', function (e) {
        var r = ats.getBoundingClientRect(), dx = (e.clientX - r.left) / r.width - 0.5, dy = (e.clientY - r.top) / r.height - 0.5;
        if (atl.progress() < 1) return;
        px.forEach(function (m) { m.x(dx * m.z); m.y(dy * m.z * 0.6); });
      });
      ats.addEventListener('mouseleave', function () { px.forEach(function (m) { m.x(0); m.y(0); }); });
    }

    // Path creation: the old form fades to the side, then the three steps build up along a line
    var steps3 = document.querySelector('.at-steps-wrap');
    if (steps3) {
      var sItems = steps3.querySelectorAll('.at-step'), sLine = steps3.querySelector('.at-steps__line i');
      gsap.set(sLine, { scaleY: 0 });
      gsap.set(sItems, { autoAlpha: 0, x: 40 });
      once(steps3, function () {
        var tl = gsap.timeline();
        tl.to(sLine, { scaleY: 1, duration: 1.4, ease: 'power1.inOut' }, 0.2);
        sItems.forEach(function (it, i) {
          tl.to(it, { autoAlpha: 1, x: 0, duration: 0.6, ease: 'back.out(1.6)' }, 0.2 + i * 0.4)
            .from(it.querySelector('.at-step__n'), { scale: 0, rotation: -90, duration: 0.5, ease: 'back.out(3)' }, 0.3 + i * 0.4);
        });
      }, 'top 75%');
    }

    // What's new: cards rise in a wave, icons spin into place
    var feats = gsap.utils.toArray('.at-feat');
    if (feats.length) {
      gsap.set(feats, { autoAlpha: 0, y: 50 });
      once('.at-feats', function () {
        gsap.to(feats, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: { each: 0.08, grid: 'auto', from: 'start' } });
        gsap.from(document.querySelectorAll('.at-feat__i'), { rotation: -120, scale: 0, duration: 0.7, ease: 'back.out(2.5)', stagger: 0.08, delay: 0.2 });
      });
    }

    // Authoring journey: hero window rises with the menu floating in
    var ajs = document.querySelector('.aj-stage');
    if (ajs) {
      var mw = ajs.querySelector('.aj-win--main'), fm = ajs.querySelector('.aj-float--menu') || ajs.querySelector('.aj-float--phone'), ch = ajs.querySelectorAll('.rm-chip');
      var jtl = gsap.timeline({ paused: true })
        .from(ajs, { autoAlpha: 0, y: 40, duration: 0.8, ease: 'power3.out' })
        .from(mw, { y: 160, autoAlpha: 0, scale: 0.94, duration: 1.1, ease: 'expo.out' }, 0.2)
        .from(fm, { x: -120, rotation: -20, autoAlpha: 0, duration: 0.9, ease: 'back.out(1.4)' }, 0.7)
        .from(ch, { scale: 0, autoAlpha: 0, duration: 0.6, ease: 'back.out(2.2)', stagger: 0.12 }, 1)
        .add(function () {
          ch.forEach(function (c, i) { gsap.to(c, { y: i % 2 ? 8 : -8, duration: 2.4 + i * 0.3, ease: 'sine.inOut', yoyo: true, repeat: -1 }); });
          gsap.to(fm, { y: -10, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1 });
        });
      once(ajs, function () { jtl.play(); }, 'top 88%');
    }

    // Ecosystem: lines draw, content chips flow from tutors into the tool, nodes pop
    var eco = document.querySelector('.aj-eco');
    if (eco) {
      var lines = eco.querySelectorAll('.aj-eco__line i'), nodes = eco.querySelectorAll('.aj-eco__node'), eChips = eco.querySelectorAll('.aj-eco__chip');
      gsap.set(lines, { scaleX: 0 }); gsap.set(nodes, { autoAlpha: 0, scale: 0.8 }); gsap.set(eChips, { autoAlpha: 0, x: -30 });
      once(eco, function () {
        gsap.timeline()
          .to(nodes[0], { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(2)' })
          .to(lines[0], { scaleX: 1, duration: 0.7, ease: 'power2.inOut' })
          .to(eChips, { autoAlpha: 1, x: 0, duration: 0.45, ease: 'power3.out', stagger: 0.08 }, '<0.1')
          .to(nodes[1], { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'back.out(2)' }, '-=0.2')
          .to(lines[1], { scaleX: 1, duration: 0.5, ease: 'power2.inOut' })
          .to(nodes[2], { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(2)' })
          .add(function () { gsap.to(eco.querySelector('.aj-eco__node--tool .aj-eco__i'), { scale: 1.08, duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: -1 }); });
      });
    }

    // Process: the line draws and each phase lands in turn
    var proc = document.querySelector('.aj-process');
    if (proc) {
      var pl = proc.querySelector('.aj-process__line i'), ph = proc.querySelectorAll('.aj-phase');
      gsap.set(pl, { scaleX: 0 }); gsap.set(ph, { autoAlpha: 0, y: 40 });
      once(proc, function () {
        var tl = gsap.timeline();
        tl.to(pl, { scaleX: 1, duration: 2, ease: 'none' }, 0);
        ph.forEach(function (x, i) {
          tl.to(x, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }, i * 0.32)
            .from(x.querySelector('.aj-phase__n'), { scale: 0, rotation: -90, duration: 0.5, ease: 'back.out(3)' }, i * 0.32 + 0.05);
        });
      });
    }

    // IA: each level drops in under the root, items stagger
    var ia2 = document.querySelector('.aj-ia');
    if (ia2) {
      var lv = ia2.querySelectorAll('.aj-ia__level'), root = ia2.querySelector('.aj-ia__root span');
      gsap.set(lv, { autoAlpha: 0, y: -20 });
      once(ia2, function () {
        var tl = gsap.timeline();
        tl.from(root, { scale: 0.6, autoAlpha: 0, duration: 0.6, ease: 'back.out(2)' });
        lv.forEach(function (l) {
          tl.to(l, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power3.out' })
            .from(l.querySelectorAll('li'), { autoAlpha: 0, y: 16, scale: 0.9, duration: 0.4, ease: 'back.out(2)', stagger: 0.05 }, '<');
        });
      });
    }

    // Flows: the first tab's nodes build in on view
    var fl = document.querySelector('.aj-flows');
    if (fl) once(fl, function () { var f = fl.querySelector('.aj-flow:not([hidden])'); if (f) gsap.fromTo(f.querySelectorAll('.aj-node'), { autoAlpha: 0, x: -24, scale: 0.94 }, { autoAlpha: 1, x: 0, scale: 1, duration: 0.5, ease: 'back.out(1.6)', stagger: 0.1, delay: 0.2 }); });

    // Decisions and states
    gsap.utils.toArray('.aj-dec').forEach(function (d) {
      gsap.set(d, { autoAlpha: 0, y: 60 });
      once(d, function () {
        gsap.to(d, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out' });
        var ic = d.querySelector('.aj-dec__i'); if (ic) gsap.from(ic, { rotation: -90, scale: 0, duration: 0.7, ease: 'back.out(2.5)', delay: 0.2 });
      }, 'top 85%');
    });
    var st = document.querySelectorAll('.aj-state');
    if (st.length) { gsap.set(st, { autoAlpha: 0, scale: 0.6 }); once('.aj-states', function () { gsap.to(st, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'back.out(2.5)', stagger: 0.05 }); }, 'top 88%'); }

    // Core moments: text rises, the main screen lifts in, secondary screens and the detail crop slide in after
    gsap.utils.toArray('.am').forEach(function (m) {
      var txt = m.querySelectorAll('.am__num, .am__eyebrow, .am__title, .am__need, .am__label, .am__points li');
      var main = m.querySelector('.am-shot--main'), subs = m.querySelectorAll('.am-shot--sub'), det = m.querySelector('.am-detail');
      var flip = m.classList.contains('am--flip') ? -1 : 1;
      gsap.set(txt, { autoAlpha: 0, y: 24 });
      gsap.set(main, { autoAlpha: 0, y: 60, scale: 0.96 });
      gsap.set(subs, { autoAlpha: 0, x: 80 * flip, y: 30 });
      if (det) gsap.set(det, { autoAlpha: 0, scale: 0.6, rotation: 6 * flip });
      once(m, function () {
        var tl = gsap.timeline();
        tl.to(txt, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.06 }, 0)
          .to(main, { autoAlpha: 1, y: 0, scale: 1, duration: 0.9, ease: 'expo.out' }, 0.1)
          .to(subs, { autoAlpha: 1, x: 0, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.15 }, 0.4);
        if (det) tl.to(det, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.8, ease: 'back.out(1.8)' }, 0.75)
          .to(det, { y: -8, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      }, 'top 75%');
    });
  });
})();
