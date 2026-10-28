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
    document.querySelectorAll('main h2:not(.contact__title)').forEach(function (h) {
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

    // Contact card: grows in on scroll, 3D word flip, staggered content, drifting blobs and a cursor spotlight
    var contact = document.querySelector('.contact');
    if (contact) {
      gsap.fromTo(contact, { scale: 0.9, borderRadius: '72px' }, {
        scale: 1, borderRadius: '36px', ease: 'none',
        scrollTrigger: { trigger: contact, start: 'top bottom', end: 'top 35%', scrub: 0.6 }
      });
      var ctitle = contact.querySelector('.contact__title');
      var cwords = splitWords(ctitle);
      var rest = contact.querySelectorAll('.label, .contact__lead, .contact__actions .btn, .contact__links li, .contact__marquee');
      gsap.timeline({ scrollTrigger: { trigger: contact, start: 'top 70%', once: true } })
        .from(cwords, { yPercent: 110, rotationX: -85, transformOrigin: '50% 100%', duration: 1.1, ease: 'power4.out', stagger: 0.07 })
        .from(rest, { y: 26, autoAlpha: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08, clearProps: 'transform,opacity,visibility' }, 0.35);
      gsap.utils.toArray('.contact__blob', contact).forEach(function (blob) {
        gsap.to(blob, {
          xPercent: gsap.utils.random(-30, 30), yPercent: gsap.utils.random(-25, 25), scale: gsap.utils.random(0.85, 1.3),
          duration: gsap.utils.random(7, 11), ease: 'sine.inOut', repeat: -1, yoyo: true
        });
      });
      var spot = contact.querySelector('.contact__spot');
      if (spot && window.matchMedia('(pointer: fine)').matches) {
        contact.addEventListener('mousemove', function (e) {
          var r = contact.getBoundingClientRect();
          gsap.to(spot, { '--sx': (e.clientX - r.left) + 'px', '--sy': (e.clientY - r.top) + 'px', opacity: 1, duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
        });
        contact.addEventListener('mouseleave', function () { gsap.to(spot, { opacity: 0, duration: 0.6 }); });
      }
    }

    // Beyond the pixels: polaroids drop onto the wall, drift on scroll and can be dragged around
    var wall = document.querySelector('.beyond__wall');
    if (wall) {
      var snaps = gsap.utils.toArray('.snap', wall);
      gsap.from(snaps, {
        y: -160, autoAlpha: 0, rotation: function () { return gsap.utils.random(-28, 28); }, scale: 1.15,
        duration: 1.1, ease: 'back.out(1.6)', stagger: 0.14,
        scrollTrigger: { trigger: wall, start: 'top 75%', once: true },
        onComplete: function () { gsap.set(snaps, { clearProps: 'rotation,scale' }); }
      });
      if (window.Draggable && window.matchMedia('(pointer: fine)').matches && window.matchMedia('(min-width: 901px)').matches) {
        gsap.registerPlugin(Draggable);
        root.classList.add('has-drag');
        var top = 10;
        Draggable.create(snaps, {
          bounds: wall, edgeResistance: 0.75, inertia: false,
          onPress: function () { this.target.style.zIndex = ++top; this.target.classList.add('is-dragging'); },
          onRelease: function () { this.target.classList.remove('is-dragging'); }
        });
      }
    }

    // Toolkit chips: springy entrance, independent drifting, cursor parallax and orbiting rings
    var visual = document.querySelector('.services__visual');
    if (visual) {
      var chips = gsap.utils.toArray('.float-chip', visual);
      gsap.from(chips, {
        scale: 0.3, autoAlpha: 0, rotation: function () { return gsap.utils.random(-25, 25); },
        duration: 1.1, ease: 'back.out(2.2)', stagger: { each: 0.09, from: 'center' },
        scrollTrigger: { trigger: visual, start: 'top 75%', once: true },
        onComplete: function () {
          chips.forEach(function (chip, i) {
            gsap.to(chip, {
              x: gsap.utils.random(-14, 14), y: gsap.utils.random(-18, -8), rotation: gsap.utils.random(-5, 5),
              duration: gsap.utils.random(2.6, 4.2), ease: 'sine.inOut', repeat: -1, yoyo: true, delay: i * 0.15
            });
          });
        }
      });
      gsap.utils.toArray('.services__orbit', visual).forEach(function (ring, i) {
        gsap.to(ring, { rotation: i ? -360 : 360, duration: i ? 46 : 70, ease: 'none', repeat: -1 });
      });
      if (window.matchMedia('(pointer: fine)').matches) {
        var depth = [0.9, 0.5, 1.2, 0.7, 1, 0.6];
        visual.addEventListener('mousemove', function (e) {
          var r = visual.getBoundingClientRect();
          var dx = (e.clientX - r.left) / r.width - 0.5, dy = (e.clientY - r.top) / r.height - 0.5;
          chips.forEach(function (chip, i) {
            gsap.to(chip, { '--px': (dx * 46 * depth[i % depth.length]) + 'px', '--py': (dy * 46 * depth[i % depth.length]) + 'px', duration: 0.8, ease: 'power3.out', overwrite: 'auto' });
          });
        });
        visual.addEventListener('mouseleave', function () {
          gsap.to(chips, { '--px': '0px', '--py': '0px', duration: 1.2, ease: 'elastic.out(1, 0.5)', overwrite: 'auto' });
        });
        chips.forEach(function (chip) {
          chip.addEventListener('mouseenter', function () { gsap.to(chip, { scale: 1.08, duration: 0.35, ease: 'power3.out', overwrite: false }); });
          chip.addEventListener('mouseleave', function () { gsap.to(chip, { scale: 1, duration: 0.5, ease: 'power3.out', overwrite: false }); });
        });
      }
    }

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
