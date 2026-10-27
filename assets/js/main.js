(function () {
  document.documentElement.classList.add('js');

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
    document.querySelectorAll('.reveal').forEach(function (el) { revealer.observe(el); });

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
