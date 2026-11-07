// Guided portfolio assistant: a launcher pill opens a small chat panel. Visitors tap suggested
// questions and get pre-written answers (no AI, no network calls), with links to case studies,
// the CV and contact options. Works on every page; paths resolve from this script's location.
(function () {
  if (window.__chatInit) return;
  window.__chatInit = true;
  var me = document.currentScript;
  var BASE = me ? new URL('../../', me.src).href : './';
  var V = me && /[?&]v=([^&]+)/.exec(me.src);
  var u = function (p) { return BASE + p; };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var G = function () { return window.gsap && !reduce ? window.gsap : null; };

  var css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = u('assets/css/chat.css' + (V ? '?v=' + V[1] : ''));
  document.head.appendChild(css);

  var EMAIL = 'kavindasekara@gmail.com';
  var cs = function (slug, name, note) { return { href: u('case-studies/' + slug + '.html'), label: name, note: note }; };
  var P = {
    dominos: cs('dominos', 'Domino’s Sri Lanka', 'Website redesign'),
    finance: cs('personal-finance-dashboard', 'Personal Finance Dashboard', 'Dashboard'),
    lumora: cs('lumora', 'Lumora', 'Gamified learning app'),
    wanderly: cs('wanderly', 'Wanderly', 'Travel planning web'),
    flowsync: cs('flowsync', 'FlowSync', 'Payments & invoicing SaaS'),
    travelsphere: cs('travelsphere', 'TravelSphere', 'Branding & mobile app'),
    corehr: cs('corehr', 'CoreHR', 'HR system dashboard')
  };

  // Each topic: bot messages, optional link cards, then follow-up chips (topic ids)
  var T = {
    start: { say: ['Hi! I’m Kavinda’s portfolio assistant 👋', 'What would you like to know?'],
      next: ['about', 'work', 'skills', 'experience', 'hire'] },
    about: { q: 'Who is Kavinda?', say: [
      'Kavinda Weerasekara is a Product & UI/UX Designer from Sri Lanka with 5+ years of experience designing web and mobile products.',
      'He turns complex problems into simple, human experiences, and specialises in UI/UX, design systems and prototyping, working closely with PMs, developers and clients.'],
      next: ['work', 'ai', 'experience', 'hire'] },
    work: { q: 'Show me his work', say: ['Here are his case studies. Want a specific type?'],
      links: [P.dominos, P.flowsync, P.corehr, P.lumora],
      next: ['fintech', 'travel', 'dashboards', 'mobile', 'explore'] },
    fintech: { q: 'Fintech projects', say: ['Two fintech pieces: a payments & invoicing platform, and a calm personal finance dashboard.'],
      links: [P.flowsync, P.finance], next: ['dashboards', 'work', 'hire'] },
    travel: { q: 'Travel projects', say: ['Two travel products: a trip planner for the web and a branded mobile app.'],
      links: [P.wanderly, P.travelsphere], next: ['mobile', 'work', 'hire'] },
    dashboards: { q: 'Dashboards & SaaS', say: ['Data-heavy products made easy to scan. At Axis Tech he also built a dashboard design system with 100+ components.'],
      links: [P.corehr, P.finance, P.flowsync], next: ['skills', 'work', 'hire'] },
    mobile: { q: 'Mobile apps', say: ['Mobile work spans gamified learning and travel, from branding to high-fidelity UI.'],
      links: [P.lumora, P.travelsphere], next: ['web', 'work', 'hire'] },
    web: { q: 'Websites', say: ['The newest one is the Domino’s Sri Lanka redesign. There’s a clickable live prototype too.'],
      links: [P.dominos, { href: 'https://dominos-mu.vercel.app/', label: 'Domino’s live prototype', note: 'Opens in a new tab', ext: true }, P.wanderly],
      next: ['mobile', 'work', 'hire'] },
    explore: { q: 'More visual explorations', say: ['His Explorations wall has 50+ UI shots and concepts. Tap any screen to see it full size.'],
      links: [{ href: u('explorations/'), label: 'Design explorations', note: 'Full gallery' },
        { href: 'https://dribbble.com/Kavindalakmal', label: 'Dribbble', note: 'Opens in a new tab', ext: true }],
      next: ['work', 'skills', 'hire'] },
    skills: { q: 'Skills & tools', say: [
      'Product & UI/UX design, design systems, UX research & usability testing, AI-assisted design, and prototyping with developer handoff.',
      'Toolkit: Figma at the core, plus Framer, Miro, Webflow, and Claude & Cursor for AI-assisted work.'],
      next: ['ai', 'process', 'work', 'hire'] },
    ai: { q: 'How does he use AI?', say: [
      'Claude, Figma AI and Cursor are part of his everyday workflow: research, UX copy and rapid prototyping, so he can explore more directions and ship faster.',
      'He also introduced AI-powered workflows at Axis Tech as part of their digital transformation. This website was built with Claude + Figma too.'],
      next: ['process', 'work', 'hire'] },
    process: { q: 'What’s his process?', say: [
      '1. Discover: requirements, research and user journeys.\n2. Define: personas, information architecture and flows.\n3. Design: wireframes to hi-fi UI and prototypes.\n4. Deliver: testing, handoff with tokens and specs, then iterate.'],
      next: ['skills', 'work', 'hire'] },
    experience: { q: 'Experience', say: [
      '• Senior UI/UX Designer, Axis Tech Lanka (2025–2026)\n• UI/UX Designer, Nimi Tech (2023–2025)\n• UI/UX Designer, Empite Solutions (2021–2023)\n• Intern UI/UX Designer, Arimac (2021)',
      'He holds a BSc (Hons) in ICT from Rajarata University of Sri Lanka.'],
      links: [{ href: u('assets/docs/Kavinda-Weerasekara-CV.pdf?v=4'), label: 'Download CV', note: 'PDF', download: true }],
      next: ['about', 'work', 'hire'] },
    hire: { q: 'Is he available?', say: ['Yes! Kavinda is open to full-time roles and freelance projects. The quickest way to reach him is email.'],
      links: [{ href: 'mailto:' + EMAIL, label: EMAIL, note: 'Send an email' },
        { href: 'https://www.linkedin.com/in/kavindaweerasekara/', label: 'LinkedIn', note: 'Opens in a new tab', ext: true },
        { href: u('assets/docs/Kavinda-Weerasekara-CV.pdf?v=4'), label: 'Download CV', note: 'PDF', download: true }],
      next: ['work', 'experience', 'restart'] },
    restart: { q: 'Start over', say: ['Sure, what else would you like to know?'], next: ['about', 'work', 'skills', 'experience', 'hire'] }
  };

  // ---------- DOM ----------
  var root = document.createElement('div');
  root.className = 'kc';
  root.innerHTML =
    '<div class="kc__nudge" hidden><span>Hi 👋 Questions about my work?</span><button type="button" aria-label="Dismiss">×</button></div>' +
    '<section class="kc__panel" id="kc-panel" role="dialog" aria-label="Portfolio assistant" hidden>' +
      '<header class="kc__head"><span class="kc__face"><img src="' + u('assets/img/kavinda-160.webp') + '" alt="" width="40" height="40" /><i></i></span>' +
        '<div><strong>Kavinda’s assistant</strong><small>Quick answers about my work</small></div>' +
        '<button type="button" class="kc__close" aria-label="Close assistant"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></header>' +
      '<div class="kc__log" aria-live="polite" data-lenis-prevent></div>' +
      '<div class="kc__chips" role="group" aria-label="Suggested questions"></div>' +
    '</section>' +
    '<button type="button" class="kc__launch" aria-expanded="false" aria-controls="kc-panel">' +
      '<span class="kc__face"><img src="' + u('assets/img/kavinda-160.webp') + '" alt="" width="32" height="32" /><i></i></span>' +
      '<span class="kc__launch-text">Ask me</span>' +
      '<svg class="kc__x" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
    '</button>';
  document.body.appendChild(root);

  var launch = root.querySelector('.kc__launch'), panel = root.querySelector('.kc__panel');
  var log = root.querySelector('.kc__log'), chips = root.querySelector('.kc__chips');
  var nudge = root.querySelector('.kc__nudge');
  var started = false, busy = false, isOpen = false;

  function track(name, params) { if (window.gtag) try { window.gtag('event', name, params || {}); } catch (e) {} }
  function scrollDown() { log.scrollTo({ top: log.scrollHeight, behavior: reduce ? 'auto' : 'smooth' }); }
  function pop(el, fromX) {
    var g = G();
    if (g) g.from(el, { y: 14, x: fromX || 0, autoAlpha: 0, scale: 0.94, transformOrigin: fromX > 0 ? '100% 100%' : '0% 100%', duration: 0.5, ease: 'back.out(1.6)' });
  }

  function bubble(text, who) {
    var b = document.createElement('div');
    b.className = 'kc__msg kc__msg--' + who;
    b.textContent = text;
    log.appendChild(b); pop(b, who === 'me' ? 20 : -10); scrollDown();
    return b;
  }

  function linkCards(list) {
    var wrap = document.createElement('div');
    wrap.className = 'kc__links';
    list.forEach(function (l) {
      var a = document.createElement('a');
      a.className = 'kc__link'; a.href = l.href;
      if (l.ext) { a.target = '_blank'; a.rel = 'noopener'; }
      if (l.download) a.setAttribute('download', '');
      a.innerHTML = '<span><b></b><small></small></span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' +
        (l.download ? 'M12 5v14M6 13l6 6 6-6' : 'M7 17 17 7M8 7h9v9') + '"/></svg>';
      a.querySelector('b').textContent = l.label;
      a.querySelector('small').textContent = l.note || '';
      wrap.appendChild(a);
    });
    log.appendChild(wrap);
    var g = G();
    if (g) g.from(wrap.children, { y: 16, autoAlpha: 0, duration: 0.45, ease: 'power3.out', stagger: 0.07 });
    scrollDown();
  }

  function typing() {
    var t = document.createElement('div');
    t.className = 'kc__msg kc__msg--bot kc__typing';
    t.setAttribute('aria-label', 'Typing');
    t.innerHTML = '<i></i><i></i><i></i>';
    log.appendChild(t); pop(t, -10); scrollDown();
    return t;
  }

  function setChips(ids) {
    chips.innerHTML = '';
    ids.forEach(function (id) {
      var c = document.createElement('button');
      c.type = 'button'; c.className = 'kc__chip'; c.textContent = T[id].q;
      c.addEventListener('click', function () { ask(id); });
      chips.appendChild(c);
    });
    var g = G();
    if (g) g.from(chips.children, { y: 10, autoAlpha: 0, duration: 0.4, ease: 'power3.out', stagger: 0.05 });
  }

  function play(id) {
    var topic = T[id], steps = topic.say.slice();
    busy = true; chips.classList.add('is-busy');
    (function step() {
      if (!steps.length) {
        if (topic.links) linkCards(topic.links);
        setChips(topic.next); busy = false; chips.classList.remove('is-busy');
        return;
      }
      var text = steps.shift();
      var t = reduce ? null : typing();
      setTimeout(function () {
        if (t) t.remove();
        bubble(text, 'bot'); step();
      }, reduce ? 0 : Math.min(400 + text.length * 6, 1100));
    })();
  }

  function ask(id) {
    if (busy) return;
    bubble(T[id].q, 'me');
    chips.innerHTML = '';
    track('chat_question', { topic: id });
    setTimeout(function () { play(id); }, reduce ? 0 : 250);
  }

  function open() {
    if (isOpen) return;
    isOpen = true; hideNudge(true);
    panel.hidden = false; root.classList.add('is-open');
    launch.setAttribute('aria-expanded', 'true');
    var g = G();
    if (g) {
      g.fromTo(panel, { autoAlpha: 0, y: 24, scale: 0.92, transformOrigin: '100% 100%' }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: 'expo.out' });
      g.from(panel.querySelector('.kc__head').children, { y: 10, autoAlpha: 0, duration: 0.4, stagger: 0.06, delay: 0.1 });
    }
    if (!started) { started = true; play('start'); track('chat_open'); }
    setTimeout(function () { (chips.querySelector('button') || panel.querySelector('.kc__close')).focus({ preventScroll: true }); }, 50);
  }

  function close() {
    if (!isOpen) return;
    isOpen = false; root.classList.remove('is-open');
    launch.setAttribute('aria-expanded', 'false');
    var g = G(), done = function () { panel.hidden = true; };
    if (g) g.to(panel, { autoAlpha: 0, y: 16, scale: 0.95, duration: 0.3, ease: 'power2.in', onComplete: done });
    else done();
    launch.focus({ preventScroll: true });
  }

  launch.addEventListener('click', function () { isOpen ? close() : open(); });
  panel.querySelector('.kc__close').addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen) close(); });

  // One gentle nudge per visit, home page only, after the visitor has looked around a bit
  function hideNudge(forever) {
    if (forever) try { sessionStorage.setItem('kc-nudged', '1'); } catch (e) {}
    if (nudge.hidden) return;
    var g = G();
    if (g) g.to(nudge, { autoAlpha: 0, y: 8, duration: 0.25, onComplete: function () { nudge.hidden = true; } });
    else nudge.hidden = true;
  }
  nudge.querySelector('button').addEventListener('click', function (e) { e.stopPropagation(); hideNudge(true); });
  nudge.addEventListener('click', function (e) { if (e.target === nudge || e.target.tagName === 'SPAN') open(); });
  var seen = false; try { seen = !!sessionStorage.getItem('kc-nudged'); } catch (e) {}
  if (!seen && document.querySelector('.hero')) {
    setTimeout(function () {
      if (isOpen || document.querySelector('.cc:not([hidden])')) return;
      nudge.hidden = false;
      var g = G();
      if (g) g.fromTo(nudge, { autoAlpha: 0, y: 12, scale: 0.9, transformOrigin: '100% 100%' }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.7)' });
      try { sessionStorage.setItem('kc-nudged', '1'); } catch (e) {}
      setTimeout(function () { hideNudge(false); }, 7000);
    }, 9000);
  }

})();
