// GSAP motion layer. Loads before main.js; if GSAP is missing, main.js falls back to the CSS reveal.
(function () {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  var root = document.documentElement;
  root.classList.add('gsap');

  // Wrap each word of a heading in a mask so it can slide up into view
  function splitWords(el) {
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var outer = document.createElement('span'), inner = document.createElement('span');
            outer.className = 'sw'; inner.className = 'sw__i'; inner.textContent = part;
            outer.appendChild(inner); frag.appendChild(outer);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          walk(n);
        }
      });
    })(el);
    return el.querySelectorAll('.sw__i');
  }

  var mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: reduce)', function () {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-visible'); });
  });

  mm.add('(prefers-reduced-motion: no-preference)', function () {
    var ease = 'power3.out';

    // Scroll progress bar
    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

    // Hero intro (home page)
    var hero = document.querySelector('.hero');
    if (hero) {
      var heroParts = hero.querySelectorAll('.hero__intro, .hero__lead, .hero__actions');
      heroParts.forEach(function (el) { el.classList.remove('reveal'); });
      var title = hero.querySelector('.hero__title');
      title.classList.remove('reveal');
      var words = splitWords(title);
      gsap.timeline({ defaults: { ease: 'power4.out' } })
        .from('.nav', { y: -24, autoAlpha: 0, duration: 0.8 })
        .from(heroParts[0], { y: 24, autoAlpha: 0, duration: 0.8 }, 0.1)
        .from(words, { yPercent: 115, duration: 1.1, stagger: 0.06 }, 0.2)
        .from([heroParts[1], heroParts[2]], { y: 30, autoAlpha: 0, duration: 0.9, stagger: 0.12, ease: ease }, 0.6);
    }

    // Case study hero
    var csTitle = document.querySelector('.cs-page-hero__title');
    if (csTitle) {
      gsap.from(splitWords(csTitle), { yPercent: 115, duration: 1.1, stagger: 0.05, ease: 'power4.out', delay: 0.1 });
    }

    // Section headings: words mask up on scroll
    document.querySelectorAll('main h2').forEach(function (h) {
      h.classList.remove('reveal');
      var w = splitWords(h);
      gsap.from(w, {
        yPercent: 115, duration: 1, ease: 'power4.out', stagger: Math.min(0.05, 0.6 / w.length),
        scrollTrigger: { trigger: h, start: 'top 88%', once: true }
      });
    });

    // Everything else marked .reveal fades up in staggered batches
    var reveals = gsap.utils.toArray('.reveal');
    reveals.forEach(function (el) { el.classList.add('is-tweening'); });
    gsap.set(reveals, { autoAlpha: 0, y: 40 });
    ScrollTrigger.batch(reveals, {
      start: 'top 90%',
      once: true,
      onEnter: function (batch) {
        batch.forEach(function (el) { el.classList.add('is-visible'); });
        gsap.to(batch, {
          autoAlpha: 1, y: 0, duration: 1, ease: ease, stagger: 0.08, overwrite: true,
          clearProps: 'transform,opacity,visibility',
          onComplete: function () { batch.forEach(function (el) { el.classList.remove('is-tweening'); }); }
        });
      }
    });

    // Images unclip as they enter
    gsap.utils.toArray('.rw-card__media, .cs-blk-image, .cs-page-cover, .cs-board').forEach(function (el) {
      gsap.fromTo(el,
        { clipPath: 'inset(7% 7% 7% 7% round 28px)' },
        {
          clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1.2, ease: 'power3.inOut', clearProps: 'clipPath',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true }
        });
    });

    // Case study images settle as you scroll
    gsap.utils.toArray('.cs-blk-image img, .cs-page-cover img').forEach(function (img) {
      gsap.fromTo(img, { scale: 1.08 }, {
        scale: 1, ease: 'none',
        scrollTrigger: { trigger: img, start: 'top bottom', end: 'center center', scrub: true }
      });
    });

    // Magnetic buttons (mouse only)
    if (window.matchMedia('(pointer: fine)').matches) {
      document.querySelectorAll('.btn').forEach(function (btn) {
        btn.addEventListener('mousemove', function (e) {
          var r = btn.getBoundingClientRect();
          gsap.to(btn, {
            '--mx': ((e.clientX - r.left - r.width / 2) * 0.25) + 'px',
            '--my': ((e.clientY - r.top - r.height / 2) * 0.35) + 'px',
            duration: 0.4, ease: 'power3.out', overwrite: 'auto'
          });
        });
        btn.addEventListener('mouseleave', function () {
          gsap.to(btn, { '--mx': '0px', '--my': '0px', duration: 0.7, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' });
        });
      });
    }

    // Layout changes (accordion, late images) move trigger points
    document.querySelectorAll('details').forEach(function (d) {
      d.addEventListener('toggle', function () { setTimeout(function () { ScrollTrigger.refresh(); }, 500); });
    });
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  });
})();
