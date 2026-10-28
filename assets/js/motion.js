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
        } else if (n.nodeType === 1 && n.tagName !== 'BR' && !n.hasAttribute('data-nosplit')) {
          walk(n);
        }
      });
    })(el);
    return el.querySelectorAll('.sw__i');
  }

  var mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: reduce)', function () {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-visible'); });
    document.querySelectorAll('.beyond__mark').forEach(function (el) { el.classList.add('is-built'); });
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
    document.querySelectorAll('main h2:not(.contact__title):not(.beyond__title)').forEach(function (h) {
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

    // Beyond the pixels: "builds." stacks itself, photos fan out from a pile on scroll, develop like
    // instant film, doodles ink themselves in, cards tilt in 3D with a glare and can be dragged around
    var wall = document.querySelector('.beyond__wall');
    if (wall) {
      var btitle = document.querySelector('.beyond__title');
      var mark = btitle.querySelector('.beyond__mark');
      btitle.setAttribute('aria-label', btitle.textContent.replace(/\s+/g, ' ').trim());
      var letters = mark.textContent.split('');
      mark.textContent = '';
      var chars = letters.map(function (ch) { var sp = document.createElement('span'); sp.className = 'ch'; sp.textContent = ch; mark.appendChild(sp); return sp; });
      var bwords = splitWords(btitle);
      gsap.timeline({ scrollTrigger: { trigger: btitle, start: 'top 85%', once: true } })
        .from(bwords, { yPercent: 115, duration: 0.9, ease: 'power4.out', stagger: 0.06 })
        .from(chars, { y: -140, rotation: function () { return gsap.utils.random(-40, 40); }, autoAlpha: 0, duration: 0.9, ease: 'bounce.out', stagger: 0.07 }, 0.25)
        .add(function () { mark.classList.add('is-built'); }, '-=0.35');

      var snaps = gsap.utils.toArray('.snap', wall);
      var imgs = wall.querySelectorAll('.snap__photo img');
      var desktop = window.matchMedia('(min-width: 1101px)').matches;
      var fine = window.matchMedia('(pointer: fine)').matches;

      // Instant-film developing
      gsap.set(imgs, { filter: 'grayscale(1) sepia(0.3) brightness(1.75) contrast(0.55) blur(3px)' });
      gsap.to(imgs, {
        filter: 'grayscale(0) sepia(0) brightness(1) contrast(1) blur(0px)', duration: 2.4, ease: 'power2.out', stagger: 0.3,
        scrollTrigger: { trigger: wall, start: desktop ? 'top 30%' : 'top 75%', once: true }
      });

      if (desktop) {
        // Fan out from a stacked pile in the middle of the wall, scrubbed to scroll
        snaps.forEach(function (snap, i) {
          gsap.fromTo(snap, {
            x: function () { var w = wall.getBoundingClientRect(), r = snap.getBoundingClientRect(); return (w.left + w.width / 2) - (r.left + r.width / 2) + i * 6; },
            y: function () { var w = wall.getBoundingClientRect(), r = snap.getBoundingClientRect(); return (w.top + w.height / 2) - (r.top + r.height / 2) + i * 4; },
            rotation: [-8, 6, -3, 9][i % 4]
          }, {
            x: 0, y: 0, rotation: 0, ease: 'power1.inOut', immediateRender: true,
            scrollTrigger: { trigger: wall, start: 'top 70%', end: 'top 15%', scrub: 0.8, invalidateOnRefresh: true }
          });
        });
        // Doodles ink themselves in once the photos have landed
        var paths = wall.querySelectorAll('.doodle path');
        paths.forEach(function (path) { var len = path.getTotalLength(); gsap.set(path, { strokeDasharray: len, strokeDashoffset: len }); });
        gsap.timeline({ scrollTrigger: { trigger: wall, start: 'top 20%', once: true } })
          .to(paths, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', stagger: 0.25 })
          .from(wall.querySelectorAll('.doodle text'), { autoAlpha: 0, x: -10, duration: 0.6 }, 0.2)
          .from(wall.querySelector('.doodle--star'), { scale: 0, rotation: -90, transformOrigin: '50% 50%', duration: 0.7, ease: 'back.out(3)' }, 0.5);
      } else {
        gsap.set(wall.querySelectorAll('.doodle path'), { strokeDashoffset: 0 });
        gsap.from(snaps, { y: 60, autoAlpha: 0, rotation: function () { return gsap.utils.random(-12, 12); }, duration: 0.9, ease: 'back.out(1.6)', stagger: 0.12,
          scrollTrigger: { trigger: wall, start: 'top 80%', once: true } });
      }

      if (fine && desktop) {
        // 3D tilt + glare following the cursor
        wall.querySelectorAll('.snap__card').forEach(function (card) {
          var glare = card.querySelector('.snap__glare');
          card.addEventListener('mousemove', function (e) {
            var r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
            gsap.to(card, { rotationY: (px - 0.5) * 18, rotationX: (0.5 - py) * 18, transformPerspective: 800, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
            glare.style.setProperty('--gx', (px * 100) + '%'); glare.style.setProperty('--gy', (py * 100) + '%'); glare.style.setProperty('--go', 1);
          });
          card.addEventListener('mouseleave', function () {
            gsap.to(card, { rotationX: 0, rotationY: 0, duration: 0.9, ease: 'elastic.out(1, 0.5)', overwrite: 'auto' });
            glare.style.setProperty('--go', 0);
          });
        });
        if (window.Draggable) {
          gsap.registerPlugin(Draggable);
          root.classList.add('has-drag');
          var zTop = 10;
          Draggable.create(wall.querySelectorAll('.snap__drag'), {
            bounds: wall, edgeResistance: 0.75,
            onPress: function () { var s = this.target.parentNode; s.style.zIndex = ++zTop; s.classList.add('is-dragging'); },
            onRelease: function () { this.target.parentNode.classList.remove('is-dragging'); }
          });
        }
      }
    }

    // Dribbble shots: 3D coverflow carousel (drag/swipe, arrows, keys, click, autoplay with progress)
    var dc = document.querySelector('.dc');
    if (dc) {
      var track = dc.querySelector('.dc__track');
      var cards = gsap.utils.toArray('.dc__card', dc);
      var n = cards.length, pos = { p: 0 }, wrapD = gsap.utils.wrap(-n / 2, n / 2);
      var count = dc.querySelector('.dc__count b'), titleLink = dc.querySelector('.dc__title'), titleText = titleLink.querySelector('span');
      var bar = dc.querySelector('.dc__progress i');
      dc.classList.add('is-3d');
      track.setAttribute('tabindex', '0');
      cards.forEach(function (card) { var sh = document.createElement('span'); sh.className = 'dc__shade'; card.querySelector('a').appendChild(sh); });
      var spacing = function () { return Math.min(window.innerWidth * 0.3, 470); };
      var current = -1;
      function render() {
        var sp = spacing();
        cards.forEach(function (card, i) {
          var d = wrapD(i - pos.p), ad = Math.abs(d);
          gsap.set(card, {
            xPercent: -50, yPercent: -50,
            x: d * sp * (1 - Math.min(ad, 3) * 0.08), z: -ad * 180, rotationY: gsap.utils.clamp(-48, 48, -d * 34),
            scale: 1 - Math.min(ad, 3) * 0.06, zIndex: 100 - Math.round(ad * 10), autoAlpha: ad > 2.6 ? 0 : 1
          });
          card.querySelector('.dc__shade').style.opacity = Math.min(ad * 0.32, 0.7);
        });
        var idx = ((Math.round(pos.p) % n) + n) % n;
        if (idx !== current) {
          current = idx;
          cards.forEach(function (c, i) { c.classList.toggle('is-active', i === idx); c.querySelector('a').tabIndex = i === idx ? 0 : -1; });
          var a = cards[idx].querySelector('a');
          count.textContent = String(idx + 1).padStart(2, '0');
          titleLink.href = a.href;
          gsap.fromTo(titleText, { yPercent: 100, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.5, ease: 'power3.out', overwrite: true,
            onStart: function () { titleText.textContent = a.querySelector('.dc__card-title').textContent; } });
        }
      }
      var auto;
      function startAuto() {
        if (auto) auto.kill();
        auto = gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 4, ease: 'none', onComplete: function () { go(1); } });
      }
      function go(step) {
        gsap.to(pos, { p: Math.round(pos.p) + step, duration: 0.9, ease: 'power3.inOut', onUpdate: render, overwrite: true });
        startAuto();
      }
      render();
      // Entrance: cards fly in from the depth
      gsap.from(cards, { autoAlpha: 0, z: -800, rotationY: 60, duration: 1.2, ease: 'power3.out', stagger: 0.06,
        scrollTrigger: { trigger: dc, start: 'top 75%', once: true }, onComplete: render });
      ScrollTrigger.create({ trigger: dc, start: 'top 75%', once: true, onEnter: startAuto });
      dc.querySelector('.dc__next').addEventListener('click', function () { go(1); });
      dc.querySelector('.dc__prev').addEventListener('click', function () { go(-1); });
      track.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); go(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); } });
      dc.addEventListener('mouseenter', function () { auto && auto.pause(); });
      dc.addEventListener('mouseleave', function () { auto && auto.resume(); });
      // Clicking a side card brings it to the centre instead of following the link
      cards.forEach(function (card, i) {
        card.querySelector('a').addEventListener('click', function (e) {
          if (moved) { e.preventDefault(); return; }
          var d = Math.round(wrapD(i - pos.p));
          if (d !== 0) { e.preventDefault(); go(d); }
        });
      });
      // Drag / swipe with a proxy so the cards themselves keep their 3D transforms
      var moved = false;
      if (window.Draggable) {
        gsap.registerPlugin(Draggable);
        var proxy = document.createElement('div'), startP = 0, lastX = 0, lastT = 0, vel = 0;
        Draggable.create(proxy, {
          type: 'x', trigger: track, allowContextMenu: true, minimumMovement: 6,
          onPress: function () { startP = pos.p; moved = false; gsap.killTweensOf(pos); auto && auto.pause(); },
          onDragStart: function () { moved = true; lastX = this.x; lastT = performance.now(); vel = 0; track.classList.add('is-grabbing'); },
          onDrag: function () { var now = performance.now(); vel = (this.x - lastX) / Math.max(now - lastT, 1); lastX = this.x; lastT = now; pos.p = startP - (this.x - this.startX) / spacing(); render(); },
          onRelease: function () {
            track.classList.remove('is-grabbing');
            if (moved) { gsap.to(pos, { p: Math.round(pos.p - gsap.utils.clamp(-2, 2, vel * 0.6)), duration: 0.8, ease: 'power3.out', onUpdate: render }); startAuto(); }
            else { auto && auto.resume(); }
            setTimeout(function () { moved = false; }, 0);
          }
        });
      }
      window.addEventListener('resize', render);
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
