(function () {
  document.documentElement.classList.add('js');

  // Logo: reload the home page from the very top (not the remembered scroll spot)
  try {
    if (sessionStorage.getItem('toTop')) {
      sessionStorage.removeItem('toTop');
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
      window.scrollTo(0, 0);
      window.addEventListener('load', function () { window.scrollTo(0, 0); });
    }
  } catch (e) {}
  var logo = document.getElementById('nav-logo');
  if (logo) {
    logo.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      try { sessionStorage.setItem('toTop', '1'); } catch (err) {}
      window.scrollTo(0, 0);
      window.location.href = window.location.pathname;
    });
  }

  // Buttons: wrap the label for the hover text roll, and mark download arrows
  document.querySelectorAll('.btn').forEach(function (btn) {
    Array.prototype.slice.call(btn.childNodes).forEach(function (n) {
      if (n.nodeType !== 3 || !n.textContent.trim()) return;
      var text = n.textContent.trim(), outer = document.createElement('span'), inner = document.createElement('span');
      outer.className = 'btn__label'; inner.textContent = text; inner.setAttribute('data-t', text);
      outer.appendChild(inner); btn.replaceChild(outer, n);
    });
    var c = btn.querySelector('.btn__circle path');
    if (c && /^M12 5v14/.test(c.getAttribute('d') || '')) c.closest('.btn__circle').classList.add('is-down');
  });

  // User flow tabs (case studies)
  var ufTabs = document.querySelectorAll('.uf-tab');
  function ufShow(i, focus) {
    ufTabs.forEach(function (t, k) {
      var on = k === i;
      t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      if (panel) panel.hidden = !on;
      if (on && panel && window.gsap && !window.matchMedia('(prefers-reduced-motion: reduce)').matches)
        gsap.fromTo(panel.querySelectorAll('.uf-node'), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out', stagger: 0.06 });
    });
    if (focus) ufTabs[i].focus();
  }
  ufTabs.forEach(function (t, i) {
    t.addEventListener('click', function () { ufShow(i); });
    t.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      ufShow((i + (e.key === 'ArrowRight' ? 1 : -1) + ufTabs.length) % ufTabs.length, true);
    });
  });

  // Mobile menu
  var burger = document.getElementById('nav-burger');
  var links = document.getElementById('nav-links');
  function setMenu(open) {
    links.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  burger.addEventListener('click', function () {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });
  links.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });

  // Nav border on scroll
  var nav = document.querySelector('.nav');
  function onScroll() {
    nav.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Reveal on scroll + active nav link
  if ('IntersectionObserver' in window) {
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    // With GSAP loaded, motion.js handles reveals
    if (!document.documentElement.classList.contains('gsap')) {
      document.querySelectorAll('.reveal').forEach(function (el) { revealer.observe(el); });
    }

    var navLinks = links.querySelectorAll('a[href^="#"]');
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main section[id]').forEach(function (s) { spy.observe(s); });

    // Case study chapter menu: highlight the chapter being read
    var chapterLinks = document.querySelectorAll('.cs-chapters a');
    if (chapterLinks.length) {
      var scroller = document.querySelector('.cs-chapters__scroll');
      var chapterSpy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          chapterLinks.forEach(function (a) {
            var on = a.getAttribute('href') === '#' + entry.target.id;
            a.classList.toggle('is-active', on);
            if (on) scroller.scrollTo({ left: a.offsetLeft - 16, behavior: 'smooth' });
          });
        });
      }, { rootMargin: '-40% 0px -55% 0px' });
      document.querySelectorAll('.cs-chapter[id]').forEach(function (s) { chapterSpy.observe(s); });
    }

    // Count stat numbers up when they come into view
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var counter = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        counter.unobserve(entry.target);
        var el = entry.target, end = +el.dataset.count, start = null;
        function step(t) {
          if (start === null) start = t;
          var k = Math.min(1, (t - start) / 1200);
          el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
          if (k < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    if (!reduceMotion) document.querySelectorAll('[data-count]').forEach(function (el) { counter.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-visible'); });
  }

  // Copy email
  var copyBtn = document.getElementById('copy-email');
  copyBtn.addEventListener('click', function () {
    var label = copyBtn.querySelector('.copy-label');
    var email = copyBtn.dataset.email;
    function done(text) {
      label.textContent = text;
      setTimeout(function () { label.textContent = 'Copy email'; }, 2000);
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(email).then(function () { done('Copied!'); }, function () { done(email); });
    } else {
      done(email);
    }
  });

  // Footer year
  document.getElementById('year').textContent = new Date().getFullYear();
})();
