// Driftway — page behaviour and GSAP animation.
(function () {
  const { destinations, stories } = window.DRIFT;
  const { sceneSVG, avatarSVG } = window.ILLO;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
  const seedOf = (str) => [...str].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

  gsap.registerPlugin(ScrollTrigger, Flip, MotionPathPlugin, Draggable);

  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  };

  // ---------------------------------------------------------------- smooth scroll
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  function scrollToEl(el) {
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -70, duration: 1.4 });
    else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const el = id === '#top' ? document.body : $(id);
    if (!el) return;
    e.preventDefault();
    closeMenu();
    if (id === '#top' && lenis) lenis.scrollTo(0, { duration: 1.6 }); else scrollToEl(el);
  });

  // ---------------------------------------------------------------- text splitting
  function splitChars(el) {
    el.querySelectorAll('.line').forEach((line) => {
      const walk = (node) => {
        [...node.childNodes].forEach((n) => {
          if (n.nodeType === 3) {
            const frag = document.createDocumentFragment();
            n.textContent.split(/(\s+)/).forEach((w) => {
              if (!w) return;
              if (/^\s+$/.test(w)) { frag.append(' '); return; }
              const word = document.createElement('span');
              word.className = 'word';
              word.style.overflow = 'visible';
              [...w].forEach((ch) => { const c = document.createElement('span'); c.className = 'char'; c.textContent = ch; word.append(c); });
              frag.append(word);
            });
            n.replaceWith(frag);
          } else if (n.nodeType === 1 && !n.matches('svg')) walk(n);
        });
      };
      walk(line);
    });
    return $$('.char', el);
  }
  function splitWords(el) {
    const out = [];
    [...el.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((w) => {
          if (!w) return;
          if (/^\s+$/.test(w)) { frag.append(' '); return; }
          const word = document.createElement('span'); word.className = 'word';
          const inner = document.createElement('span'); inner.textContent = w;
          word.append(inner); frag.append(word); out.push(inner);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) {
        const word = document.createElement('span'); word.className = 'word';
        const inner = document.createElement('span');
        n.replaceWith(word); inner.append(n); word.append(inner); out.push(inner);
      }
    });
    return out;
  }

  // ---------------------------------------------------------------- loader + intro
  const heroChars = splitChars($('.hero__title'));
  const loaderBar = $('.loader__bar span'), loaderCount = $('.loader__count span');
  const prog = { v: 0 };
  const loadTween = gsap.to(prog, { v: 82, duration: 2.2, ease: 'power2.out', onUpdate: paintLoader });
  function paintLoader() { loaderBar.style.transform = `scaleX(${prog.v / 100})`; loaderCount.textContent = Math.round(prog.v); }

  gsap.set(heroChars, { yPercent: 110, opacity: 0 });
  gsap.set(['.hero__eyebrow', '.hero__lead', '.search', '.scroll-cue'], { y: 30, opacity: 0 });
  gsap.set('.nav', { y: -40, opacity: 0 });
  gsap.set('.foliage .leaf, .foliage .flower', { scale: 0, transformOrigin: 'bottom center' });

  let sceneReady = false, started = false, fontsGate = false;
  const fontsReady = (document.fonts ? document.fonts.ready : Promise.resolve()).catch(() => {});
  window.addEventListener('scene:ready', () => { sceneReady = true; tryStart(); }, { once: true });
  const minTime = new Promise((r) => setTimeout(r, reduce ? 200 : 1300));
  setTimeout(() => { sceneReady = true; tryStart(); }, 6000); // never hang on a slow GPU
  Promise.all([fontsReady, minTime]).then(() => { fontsGate = true; tryStart(); });

  function tryStart() {
    if (started || !sceneReady || !fontsGate) return;
    started = true;
    loadTween.kill();
    gsap.timeline()
      .to(prog, { v: 100, duration: .45, ease: 'power1.inOut', onUpdate: paintLoader })
      .to('.loader__inner', { y: -20, opacity: 0, duration: .4 }, '+=.1')
      .to('.loader', { clipPath: 'inset(0 0 100% 0)', duration: .9, ease: 'expo.inOut' }, '<.1')
      .add(() => { $('.loader').remove(); document.body.classList.remove('is-loading'); lenis && lenis.start(); window.DriftScene && window.DriftScene.intro(); ScrollTrigger.refresh(); }, '-=.5')
      .add(intro(), '-=.55');
  }

  function intro() {
    return gsap.timeline({ defaults: { ease: 'expo.out' } })
      .to('.nav', { y: 0, opacity: 1, duration: 1 })
      .to('.hero__eyebrow', { y: 0, opacity: 1, duration: 1 }, '<.1')
      .to(heroChars, { yPercent: 0, opacity: 1, duration: 1.1, stagger: { each: .025 } }, '<.05')
      .to('.brush path', { strokeDashoffset: 0, duration: 1, ease: 'power2.inOut' }, '-=.5')
      .to('.hero__lead', { y: 0, opacity: 1, duration: 1 }, '-=.9')
      .to('.search', { y: 0, opacity: 1, duration: 1.1 }, '-=.85')
      .to('.foliage .leaf, .foliage .flower', { scale: 1, duration: 1.4, stagger: .06, ease: 'elastic.out(1, .6)' }, '-=1.2')
      .to('.scroll-cue', { y: 0, opacity: 1, duration: 1 }, '-=1')
      .add(swayFoliage);
  }

  function swayFoliage() {
    if (reduce) return;
    $$('.foliage .leaf, .camp-leaf, .cta-leaf').forEach((l, i) => {
      gsap.to(l, { rotation: (i % 2 ? 1 : -1) * gsap.utils.random(2, 5), duration: gsap.utils.random(2.4, 3.6), ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * .1 });
    });
  }

  // hero content drifts away as the camera moves
  gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: '60% top', scrub: true } })
    .to('.hero__content', { yPercent: -18, opacity: 0, ease: 'none' }, 0)
    .to('.foliage--left', { xPercent: -40, yPercent: 20, ease: 'none' }, 0)
    .to('.foliage--right', { xPercent: 40, yPercent: 20, ease: 'none' }, 0)
    .to('.scroll-cue', { opacity: 0, ease: 'none' }, 0);

  // ---------------------------------------------------------------- nav
  const nav = $('#nav');
  let lastY = scrollY;
  function navState() {
    const y = scrollY;
    nav.classList.toggle('is-scrolled', y > innerHeight * .5 || document.body.classList.contains('menu-open'));
    if (Math.abs(y - lastY) > 4) {
      nav.classList.toggle('is-hidden', y > lastY && y > innerHeight && !document.body.classList.contains('menu-open'));
      lastY = y;
    }
  }
  addEventListener('scroll', navState, { passive: true });
  navState();
  const burger = $('.nav__burger'), menu = $('.mobile-menu');
  function closeMenu() { menu.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-hidden', 'true'); document.body.classList.remove('menu-open'); }
  burger.addEventListener('click', () => {
    const open = !menu.classList.contains('is-open');
    menu.classList.toggle('is-open', open); burger.setAttribute('aria-expanded', open); menu.setAttribute('aria-hidden', !open);
    document.body.classList.toggle('menu-open', open);
    nav.classList.add('is-scrolled');
    if (open) gsap.from('.mobile-menu a', { y: 40, opacity: 0, stagger: .06, duration: .7, ease: 'expo.out', delay: .15 });
  });

  // ---------------------------------------------------------------- toast
  const toastEl = $('.toast');
  function toast(msg) {
    toastEl.textContent = msg;
    gsap.killTweensOf(toastEl);
    gsap.timeline().to(toastEl, { opacity: 1, y: 0, duration: .5, ease: 'back.out(2)' }).to(toastEl, { opacity: 0, y: 20, duration: .4, delay: 2.4 });
  }

  // ---------------------------------------------------------------- saved items
  const saved = { trips: store.get('drift-trips', []), favs: store.get('drift-favs', []) };
  const badge = $('[data-trip-count]');
  function paintBadge(bump) {
    const n = saved.trips.length + saved.favs.length;
    badge.textContent = n;
    badge.classList.toggle('has', n > 0);
    if (bump && n) gsap.fromTo(badge, { scale: 1.8 }, { scale: 1, duration: .6, ease: 'elastic.out(1, .4)' });
  }
  paintBadge();
  $('.nav__trips').addEventListener('click', () => {
    const t = saved.trips.length, f = saved.favs.length;
    toast(t + f === 0 ? 'Nothing saved yet. Tap a heart or save an itinerary.' : `${t} saved trip${t === 1 ? '' : 's'} · ${f} favourite place${f === 1 ? '' : 's'}`);
  });

  // ---------------------------------------------------------------- search bar
  const sel = $('#search-destination');
  sel.innerHTML = destinations.map((d) => `<option value="${d.id}">${d.name}</option>`).join('');
  sel.value = 'nusa';
  const dateIn = $('#search-date');
  const inTwoWeeks = new Date(Date.now() + 14 * 864e5);
  dateIn.value = inTwoWeeks.toISOString().slice(0, 10);
  dateIn.min = new Date().toISOString().slice(0, 10);
  let people = 2;
  function setPeople(n) {
    people = Math.min(12, Math.max(1, n));
    $('#search-people').textContent = people;
    $('#planner-people').textContent = people;
  }
  $$('[data-step]').forEach((b) => b.addEventListener('click', () => setPeople(people + +b.dataset.step)));
  $$('[data-pstep]').forEach((b) => b.addEventListener('click', () => { setPeople(people + +b.dataset.pstep); plan(); }));
  $('#search').addEventListener('submit', (e) => {
    e.preventDefault();
    planner.dest = sel.value;
    paintPills();
    plan();
    scrollToEl($('#planner'));
  });

  // ---------------------------------------------------------------- destination cards
  const cardsEl = $('#cards');
  const star = '<svg viewBox="0 0 20 20" width="14" height="14"><path d="m10 1.5 2.6 5.6 6 .7-4.5 4.1 1.2 6L10 15l-5.3 2.9 1.2-6L1.4 7.8l6-.7Z" fill="currentColor"/></svg>';
  cardsEl.innerHTML = destinations.map((d, i) => `
    <article class="card" data-cat="${d.cat.join(' ')}" data-id="${d.id}">
      <div class="card__art">${sceneSVG(d.scene, 11 + i * 7)}
        <span class="card__tag">${d.cat[0]}</span>
        <button class="card__save ${saved.favs.includes(d.id) ? 'is-on' : ''}" type="button" aria-label="Save ${d.name}" aria-pressed="${saved.favs.includes(d.id)}">
          <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 21s-7.5-4.6-9.4-9.4C1.3 8.2 3.4 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.6 0 5.7 3.7 4.4 7.1C19.5 16.4 12 21 12 21Z" fill="none" stroke="currentColor" stroke-width="2"/></svg>
        </button>
      </div>
      <div class="card__body">
        <div class="card__title"><h3>${d.name}</h3><span class="card__rating">${star}${d.rating}</span></div>
        <div class="card__loc">${d.country}</div>
        <div class="card__foot"><span class="card__price"><b>${money(d.price)}</b> <small>/ person</small></span><button class="card__plan" type="button" data-plan="${d.id}">Plan this trip →</button></div>
      </div>
    </article>`).join('');
  const cards = $$('.card', cardsEl);

  function staggerCards() {
    const cols = getComputedStyle(cardsEl).gridTemplateColumns.split(' ').length;
    const step = cols === 3 ? 70 : cols === 2 ? 50 : 0;
    cards.filter((c) => c.style.display !== 'none').forEach((c, i) => { c.style.marginTop = (i % cols) * step + 'px'; });
  }
  staggerCards();
  addEventListener('resize', () => { staggerCards(); });

  // filtering with Flip
  $$('.chip').forEach((chip) => chip.addEventListener('click', () => {
    $$('.chip').forEach((c) => { c.classList.toggle('is-active', c === chip); c.setAttribute('aria-selected', c === chip); });
    const f = chip.dataset.filter;
    const state = Flip.getState(cards);
    cards.forEach((c) => { c.style.display = f === 'all' || c.dataset.cat.split(' ').includes(f) ? '' : 'none'; });
    staggerCards();
    Flip.from(state, {
      duration: reduce ? 0 : .8, ease: 'power3.inOut', absolute: true, stagger: .04,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: .85 }, { opacity: 1, scale: 1, duration: .6, delay: .2 }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: .85, duration: .4 }),
      onComplete: () => ScrollTrigger.refresh()
    });
  }));

  // entrance, tilt and layered parallax
  if (!reduce) {
    gsap.set(cards, { y: 90, opacity: 0, rotationX: -14, transformPerspective: 1000 });
    ScrollTrigger.batch(cards, {
      start: 'top 90%', once: true,
      onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, rotationX: 0, duration: 1.2, ease: 'expo.out', stagger: .14 })
    });
  }
  cards.forEach((card) => {
    const layers = $$('[data-depth]', card);
    if (fine && !reduce) {
      const rx = gsap.quickTo(card, 'rotationX', { duration: .6, ease: 'power3' });
      const ry = gsap.quickTo(card, 'rotationY', { duration: .6, ease: 'power3' });
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        rx(-y * 10); ry(x * 12);
        layers.forEach((l) => { const d = +l.dataset.depth; l.style.transform = `translate(${-x * d * 40}px, ${-y * d * 18}px)`; });
      });
      card.addEventListener('pointerleave', () => { rx(0); ry(0); layers.forEach((l) => { l.style.transform = ''; }); });
    }
  });
  cardsEl.addEventListener('click', (e) => {
    const save = e.target.closest('.card__save');
    const planBtn = e.target.closest('[data-plan]');
    if (save) {
      const id = save.closest('.card').dataset.id;
      const on = !saved.favs.includes(id);
      saved.favs = on ? [...saved.favs, id] : saved.favs.filter((x) => x !== id);
      store.set('drift-favs', saved.favs);
      save.classList.toggle('is-on', on); save.setAttribute('aria-pressed', on);
      gsap.fromTo(save, { scale: .6 }, { scale: 1, duration: .6, ease: 'elastic.out(1, .4)' });
      if (on) burst(save);
      paintBadge(on);
    }
    if (planBtn) { planner.dest = planBtn.dataset.plan; sel.value = planner.dest; paintPills(); plan(); scrollToEl($('#planner')); }
  });
  function burst(el) {
    const r = el.getBoundingClientRect();
    for (let i = 0; i < 8; i++) {
      const p = document.createElement('span');
      Object.assign(p.style, { position: 'fixed', left: r.left + r.width / 2 + 'px', top: r.top + r.height / 2 + 'px', width: '7px', height: '7px', borderRadius: '50%', background: i % 2 ? '#f6c445' : '#e8505b', zIndex: 90, pointerEvents: 'none' });
      document.body.append(p);
      const a = (i / 8) * Math.PI * 2;
      gsap.to(p, { x: Math.cos(a) * 34, y: Math.sin(a) * 34, opacity: 0, scale: .3, duration: .7, ease: 'power3.out', onComplete: () => p.remove() });
    }
  }

  // paper plane along the dashed flight path
  if (!reduce) {
    const path = $('#flight-path');
    const trail = path.cloneNode(); trail.removeAttribute('id');
    trail.setAttribute('stroke', '#f6c445'); trail.setAttribute('stroke-dasharray', '');
    trail.setAttribute('stroke-width', '3');
    path.after(trail);
    const len = trail.getTotalLength();
    gsap.set(trail, { strokeDasharray: len, strokeDashoffset: len });
    const tl = gsap.timeline({ scrollTrigger: { trigger: '.dest', start: 'top 70%', end: 'bottom 40%', scrub: 1.2 } });
    tl.to('.plane', { motionPath: { path, align: path, alignOrigin: [.5, .5], autoRotate: 45 }, ease: 'none' }, 0)
      .to(trail, { strokeDashoffset: 0, ease: 'none' }, 0);
  } else { $('.plane').style.display = 'none'; }

  // counters
  $$('[data-count]').forEach((el) => {
    const end = +el.dataset.count, dec = +(el.dataset.decimals || 0);
    const o = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: () => gsap.to(o, { v: end, duration: 2, ease: 'power3.out', onUpdate: () => { el.textContent = o.v.toFixed(dec); } })
    });
  });

  // ---------------------------------------------------------------- headings
  $$('.reveal-words').forEach((h) => {
    const words = splitWords(h);
    const marks = $$('.mark-text', h);
    if (reduce) { marks.forEach((m) => m.classList.add('is-in')); return; }
    gsap.set(words, { yPercent: 110 });
    ScrollTrigger.create({
      trigger: h, start: 'top 85%', once: true,
      onEnter: () => gsap.to(words, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: .06, onComplete: () => marks.forEach((m) => m.classList.add('is-in')) })
    });
  });
  if (!reduce) {
    $$('.section-head .muted, .dest__head .muted, .why__intro .muted, .why__intro .btn, .scribble, .filters, .toggle').forEach((el) => {
      gsap.from(el, { y: 30, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
  }

  // ---------------------------------------------------------------- why + campsite
  if (!reduce) {
    $$('.why__item').forEach((item, i) => {
      gsap.from(item, { x: 120, opacity: 0, rotation: 3, duration: 1.2, ease: 'expo.out', delay: i * .12, scrollTrigger: { trigger: '.why__list', start: 'top 80%', once: true } });
      gsap.from($('.why__num', item), { scale: 0, duration: .8, ease: 'back.out(2)', delay: .3 + i * .12, scrollTrigger: { trigger: '.why__list', start: 'top 80%', once: true } });
    });
  }
  // stars
  const starsG = $('.stars');
  const ns = 'http://www.w3.org/2000/svg';
  for (let i = 0; i < 70; i++) {
    const c = document.createElementNS(ns, 'circle');
    c.setAttribute('cx', Math.random() * 1440); c.setAttribute('cy', Math.random() * 260);
    c.setAttribute('r', Math.random() * 1.6 + .4); c.setAttribute('opacity', 0);
    starsG.append(c);
  }
  gsap.to('.stars circle', { opacity: () => gsap.utils.random(.3, 1), duration: 1, stagger: { each: .02, from: 'random' }, scrollTrigger: { trigger: '.camp', start: 'top 85%', once: true } });
  if (!reduce) {
    gsap.to('.stars circle', { opacity: .15, duration: () => gsap.utils.random(.8, 2), repeat: -1, yoyo: true, delay: 2, stagger: { each: .08, from: 'random', repeat: -1, yoyo: true } });
    $$('.camp__layer').forEach((l) => {
      gsap.fromTo(l, { y: () => +l.dataset.depth * 160 }, { y: 0, ease: 'none', scrollTrigger: { trigger: '.camp', start: 'top bottom', end: 'bottom bottom', scrub: true } });
    });
    gsap.fromTo('.moon', { y: 80 }, { y: 0, ease: 'none', scrollTrigger: { trigger: '.camp', start: 'top bottom', end: 'bottom bottom', scrub: true } });
    gsap.to('.flame--a', { scaleY: 1.18, scaleX: .9, transformOrigin: '50% 100%', duration: .18, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    gsap.to('.flame--b', { scaleY: .82, scaleX: 1.1, transformOrigin: '50% 100%', duration: .14, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    gsap.to('.fire-glow', { scale: 1.08, opacity: .8, transformOrigin: '50% 50%', duration: .5, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    gsap.to('.tent-light', { opacity: .7, duration: 1.4, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    $$('.smoke circle').forEach((c, i) => {
      gsap.fromTo(c, { y: 0, x: 0, scale: .5, opacity: .9 }, { y: -110, x: () => gsap.utils.random(-20, 20), scale: 2.4, opacity: 0, duration: 3.2, repeat: -1, delay: i * 1.05, ease: 'sine.out', transformOrigin: '50% 50%' });
    });
    gsap.to('.bulbs circle', { opacity: .35, duration: .9, repeat: -1, yoyo: true, stagger: { each: .25, repeat: -1, yoyo: true } });
  }

  // ---------------------------------------------------------------- planner
  const planner = { dest: 'nusa', days: 5, pace: 'balanced' };
  const pillsEl = $('#planner-dest');
  pillsEl.innerHTML = destinations.map((d) => `<button type="button" class="pill" data-dest="${d.id}">${d.name}</button>`).join('');
  function paintPills() { $$('.pill', pillsEl).forEach((p) => p.classList.toggle('is-active', p.dataset.dest === planner.dest)); }
  paintPills();
  pillsEl.addEventListener('click', (e) => { const p = e.target.closest('.pill'); if (!p) return; planner.dest = p.dataset.dest; sel.value = planner.dest; paintPills(); plan(); });

  const range = $('#days');
  function paintRange() { range.style.setProperty('--fill', ((range.value - range.min) / (range.max - range.min)) * 100 + '%'); $('#days-out').textContent = range.value + ' days'; }
  paintRange();
  let rangeTimer;
  range.addEventListener('input', () => { planner.days = +range.value; paintRange(); clearTimeout(rangeTimer); rangeTimer = setTimeout(plan, 180); });

  function moveThumb(group, active, instant) {
    const thumb = $('.segmented__thumb, .toggle__thumb', group);
    gsap.to(thumb, { x: active.offsetLeft - 4, width: active.offsetWidth, duration: instant ? 0 : .5, ease: 'expo.out' });
  }
  const paceEl = $('#pace');
  $$('button', paceEl).forEach((b) => b.addEventListener('click', () => {
    $$('button', paceEl).forEach((x) => x.classList.toggle('is-active', x === b));
    planner.pace = b.dataset.pace; moveThumb(paceEl, b); plan();
  }));
  $$('#interests input').forEach((i) => i.addEventListener('change', plan));
  $('#planner-form').addEventListener('submit', (e) => { e.preventDefault(); plan(true); });

  const slotColor = { morning: '#f7b733', midday: '#6cc04a', afternoon: '#5ec7d0', evening: '#2f6fd6' };
  const dayTitles = { nature: 'Into the wild', food: 'A day for the taste buds', culture: 'Stories & traditions', adventure: 'Adrenaline day', relax: 'Slow & easy' };

  function rng(seed) { let a = seed; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  function buildPlan(d, days, pace, interests) {
    const r = rng(seedOf(d.id + days + pace + interests.join()));
    const pool = d.acts.map(([name, slot, tag, cost]) => ({ name, slot, tag, cost, j: r() }));
    const used = new Set();
    const slots = pace === 'relaxed' ? ['morning', 'evening'] : pace === 'packed' ? ['morning', 'midday', 'afternoon', 'evening'] : ['morning', 'afternoon', 'evening'];
    const score = (a) => (interests.includes(a.tag) ? 3 : 0) + (pace === 'relaxed' && a.tag === 'relax' ? 1.5 : 0) + a.j;
    const pick = (slot) => {
      const want = slot === 'midday' ? 'afternoon' : slot;
      const cands = pool.filter((a) => !used.has(a)).sort((a, b) => score(b) - score(a));
      const best = cands.find((a) => a.slot === want) || cands[0];
      if (!best) return { name: 'Free time to wander', slot, tag: '', cost: 0 };
      used.add(best); return { ...best, slot };
    };
    const out = [];
    for (let i = 1; i <= days; i++) {
      let acts;
      if (i === 1) acts = [{ name: 'Arrive and check in', slot: 'afternoon', tag: '', cost: 0 }, pick('evening')];
      else if (i === days) acts = [pick('morning'), { name: 'Transfer and fly home', slot: 'afternoon', tag: '', cost: 0 }];
      else acts = slots.map(pick);
      const tags = acts.map((a) => a.tag).filter(Boolean);
      const top = tags.sort((a, b) => tags.filter((x) => x === b).length - tags.filter((x) => x === a).length)[0];
      const title = i === 1 ? 'Arrive & settle in' : i === days ? 'One last look' : dayTitles[top] || 'Free to roam';
      out.push({ title, acts });
    }
    return out;
  }

  let lastPlan = null;
  function plan(fromSubmit) {
    const d = destinations.find((x) => x.id === planner.dest);
    const interests = $$('#interests input:checked').map((i) => i.value);
    const days = planner.days;
    const itinerary = buildPlan(d, days, planner.pace, interests);
    const actCost = itinerary.flatMap((x) => x.acts).reduce((s, a) => s + a.cost, 0);
    const total = actCost * people + d.nightly * (days - 1) * Math.ceil(people / 2) + 35 * days * people;
    lastPlan = { id: d.id, name: d.name, days, total, people };

    $('#result-country').textContent = d.country;
    $('#result-title').textContent = `${days} days in ${d.name}`;
    $('#result-weather').textContent = d.temp + '°C';
    const art = $('#result-art');
    if (art.dataset.scene !== d.id) { art.innerHTML = sceneSVG(d.scene, 11 + destinations.indexOf(d) * 7); art.dataset.scene = d.id; gsap.fromTo(art, { scale: .85, opacity: 0, rotation: -4 }, { scale: 1, opacity: 1, rotation: 0, duration: .8, ease: 'back.out(1.6)' }); }
    tweenMoney($('#result-budget'), total);
    tweenMoney($('#result-pp'), total / people);

    const start = new Date(dateIn.value || inTwoWeeks);
    const fmt = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const tl = $('#timeline');
    tl.innerHTML = '<span class="timeline__line"></span>' + itinerary.map((day, i) => {
      const date = new Date(start.getTime() + i * 864e5);
      return `<li class="day"><span class="day__dot">${String(i + 1).padStart(2, '0')}</span><div class="day__card">
        <h4>${day.title}<small>${isNaN(date) ? '' : fmt.format(date)}</small></h4>
        <ul class="acts">${day.acts.map((a) => `<li class="act"><span class="act__time"><i style="background:${slotColor[a.slot]}"></i>${a.slot}</span>
          <span class="act__name">${a.name}${a.tag ? `<em>${a.tag === 'relax' ? 'slow' : a.tag}</em>` : ''}</span><span class="act__cost">${a.cost ? money(a.cost) : 'Free'}</span></li>`).join('')}</ul>
      </div></li>`;
    }).join('');
    if (!reduce) {
      gsap.timeline()
        .fromTo('.timeline__line', { scaleY: 0 }, { scaleY: 1, duration: 1.2, ease: 'power2.inOut' }, 0)
        .from('.day', { y: 30, opacity: 0, duration: .7, ease: 'expo.out', stagger: .07 }, 0)
        .from('.day__dot', { scale: 0, duration: .6, ease: 'back.out(2.5)', stagger: .07 }, .1);
    } else gsap.set('.timeline__line', { scaleY: 1 });
    if (fromSubmit === true) toast(`Itinerary ready: ${days} days in ${d.name}`);
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }
  function tweenMoney(el, to) {
    const from = +(el.dataset.v || 0);
    const o = { v: from };
    el.dataset.v = to;
    gsap.to(o, { v: to, duration: reduce ? 0 : .9, ease: 'power3.out', onUpdate: () => { el.textContent = money(o.v); } });
  }
  $('#save-trip').addEventListener('click', (e) => {
    if (!lastPlan) return;
    saved.trips = [...saved.trips.filter((t) => !(t.id === lastPlan.id && t.days === lastPlan.days)), { ...lastPlan, at: Date.now() }];
    store.set('drift-trips', saved.trips);
    paintBadge(true); burst(e.currentTarget);
    toast(`Saved: ${lastPlan.days} days in ${lastPlan.name}`);
  });
  plan();
  requestAnimationFrame(() => moveThumb(paceEl, $('.is-active', paceEl), true));

  // ---------------------------------------------------------------- packages
  const toggle = $('#price-toggle');
  requestAnimationFrame(() => moveThumb(toggle, $('.is-active', toggle), true));
  $$('button', toggle).forEach((b) => b.addEventListener('click', () => {
    $$('button', toggle).forEach((x) => x.classList.toggle('is-active', x === b));
    moveThumb(toggle, b);
    const m = +b.dataset.mult;
    $$('[data-price]').forEach((el) => {
      const o = { v: +el.textContent.replace(/,/g, '') };
      gsap.to(o, { v: Math.round(+el.dataset.price * m), duration: .8, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString('en-US'); } });
    });
  }));
  if (!reduce) {
    gsap.from('.price', { y: 100, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: { each: .12, from: 'center' }, clearProps: 'transform,opacity', scrollTrigger: { trigger: '.price-grid', start: 'top 85%', once: true } });
    $$('.price').forEach((p) => {
      const icon = $('.price__icon', p);
      p.addEventListener('pointerenter', () => gsap.fromTo(icon, { rotation: -12 }, { rotation: 0, duration: .9, ease: 'elastic.out(1, .35)' }));
    });
  }

  // ---------------------------------------------------------------- marquee (speeds up with scroll velocity)
  const track = $('.marquee__track');
  if (!reduce) {
    const loop = gsap.to(track, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
    const skew = gsap.quickTo(track, 'skewX', { duration: .4, ease: 'power3' });
    ScrollTrigger.create({
      onUpdate: (st) => {
        const v = st.getVelocity();
        loop.timeScale(1 + Math.min(Math.abs(v) / 400, 5) * (v < 0 ? -1 : 1));
        skew(gsap.utils.clamp(-8, 8, v / -300));
        gsap.to(loop, { timeScale: 1, duration: 1, overwrite: true, delay: .1 });
      }
    });
  }

  // ---------------------------------------------------------------- stories carousel
  const trackEl = $('#track'), dotsEl = $('#dots');
  trackEl.innerHTML = stories.map((s, i) => `
    <article class="story">
      <div class="story__who"><span class="story__avatar">${avatarSVG(s.color, 3 + i * 5)}</span><span><b>${s.name}</b><small>${s.from}</small></span></div>
      <blockquote>“${s.text}”</blockquote>
      <div class="story__foot"><span class="story__stars">★★★★★</span><span>${s.trip} · ${s.date}</span></div>
    </article>`).join('');
  dotsEl.innerHTML = stories.map((_, i) => `<button type="button" aria-label="Story ${i + 1}"></button>`).join('');
  const storyEls = $$('.story', trackEl), dots = $$('button', dotsEl);
  let current = 0, auto;
  const offsetFor = (i) => {
    const wrap = trackEl.parentElement.getBoundingClientRect();
    const el = storyEls[i];
    return -(el.offsetLeft - (wrap.width - el.offsetWidth) / 2);
  };
  function go(i, instant) {
    current = (i + stories.length) % stories.length;
    gsap.to(trackEl, { x: offsetFor(current), duration: instant || reduce ? 0 : .9, ease: 'expo.out' });
    storyEls.forEach((s, k) => s.classList.toggle('is-current', k === current));
    dots.forEach((d, k) => d.classList.toggle('is-active', k === current));
  }
  dots.forEach((d, k) => d.addEventListener('click', () => { go(k); restart(); }));
  $$('.carousel__nav [data-dir]').forEach((b) => b.addEventListener('click', () => { go(current + +b.dataset.dir); restart(); }));
  Draggable.create(trackEl, {
    type: 'x', inertia: false, dragClickables: true,
    onPress() { clearInterval(auto); },
    onDragEnd() {
      const x = this.x;
      let best = 0, dist = Infinity;
      storyEls.forEach((_, k) => { const d = Math.abs(offsetFor(k) - x); if (d < dist) { dist = d; best = k; } });
      if (best === current && Math.abs(this.x - offsetFor(current)) > 60) best += this.x < offsetFor(current) ? 1 : -1;
      go(Math.max(0, Math.min(stories.length - 1, best))); restart();
    }
  });
  function restart() { clearInterval(auto); if (!reduce) auto = setInterval(() => go(current + 1), 5500); }
  go(1, true); restart();
  addEventListener('resize', () => go(current, true));
  trackEl.addEventListener('pointerenter', () => clearInterval(auto));
  trackEl.addEventListener('pointerleave', restart);

  // ---------------------------------------------------------------- CTA scene
  if (!reduce) {
    $$('.f-layer').forEach((l) => {
      gsap.fromTo(l, { y: () => +l.dataset.depth * 220 }, { y: 0, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom bottom', scrub: true } });
    });
    gsap.from('.cta__content .btn', { y: 30, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.cta', start: 'top 70%', once: true } });
  }

  $('#newsletter').addEventListener('submit', (e) => { e.preventDefault(); e.target.reset(); toast('Thanks! Your first travel note lands on Friday.'); });

  // ---------------------------------------------------------------- magnetic buttons
  if (fine && !reduce) {
    $$('.magnetic').forEach((b) => {
      const xTo = gsap.quickTo(b, 'x', { duration: .5, ease: 'power3' }), yTo = gsap.quickTo(b, 'y', { duration: .5, ease: 'power3' });
      b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * .25); yTo((e.clientY - r.top - r.height / 2) * .35); });
      b.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  addEventListener('load', () => ScrollTrigger.refresh());
})();
