// Google Analytics 4 (gtag.js) plus a few portfolio events: CV downloads, email clicks,
// case study opens and outbound links. Loaded with `defer` from every page's <head>.
(function () {
  var ID = 'G-TQ4BFF0T7X';
  if (window.__gaLoaded) return;
  window.__gaLoaded = true;

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', ID);

  function label(el) { var h = el.querySelector('h2, h3'); return (el.getAttribute('aria-label') || (h && h.textContent) || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 100); }

  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('a, button');
    if (!el) return;
    if (el.id === 'copy-email') { gtag('event', 'copy_email'); return; }
    var href = el.getAttribute('href') || '';
    if (!href) return;
    if (/\.pdf(\?|$)/i.test(href)) {
      gtag('event', 'cv_download', { link_text: label(el), page_path: location.pathname });
    } else if (href.indexOf('mailto:') === 0) {
      gtag('event', 'email_click', { link_text: label(el) });
    } else if (/case-studies\/[^/]+\.html/.test(href)) {
      gtag('event', 'case_study_open', { project: href.replace(/^.*case-studies\/|\.html.*$/g, ''), link_text: label(el) });
    } else if (/^https?:\/\//.test(href) && el.hostname !== location.hostname) {
      gtag('event', 'outbound_click', { link_domain: el.hostname, link_url: href, link_text: label(el) });
    }
  }, true);
})();
