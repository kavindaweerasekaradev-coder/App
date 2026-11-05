// Google Analytics 4 (gtag.js), loaded only after the visitor accepts the cookie notice,
// plus a few portfolio events: CV downloads, email clicks, case study opens and outbound links.
// Loaded with `defer` from every page's <head>. Any element with [data-cookie-settings] reopens the notice.
(function () {
  var ID = 'G-TQ4BFF0T7X';
  var KEY = 'ga-consent';
  if (window.__gaInit) return;
  window.__gaInit = true;

  function getChoice() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function setChoice(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  var loaded = false;
  function load() {
    if (loaded) return;
    loaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', ID);
  }

  function label(el) { var h = el.querySelector('h2, h3'); return (el.getAttribute('aria-label') || (h && h.textContent) || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 100); }

  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('a, button');
    if (!el) return;
    if (el.hasAttribute('data-cookie-settings')) { e.preventDefault(); showBanner(); return; }
    if (!loaded) return;
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

  // Cookie notice (self-contained styles so it also works on pages without style.css)
  var banner;
  function showBanner() {
    if (banner) { banner.hidden = false; banner.querySelector('button').focus(); return; }
    var css = document.createElement('style');
    css.textContent =
      '.cc{position:fixed;z-index:1000;left:16px;right:16px;bottom:16px;max-width:440px;margin-left:auto;padding:18px 18px 16px;border-radius:20px;' +
      'background:#0e0e0e;color:#fff;font:400 14px/1.5 Inter,system-ui,sans-serif;box-shadow:0 24px 60px rgba(14,14,14,.3);animation:cc-in .5s cubic-bezier(.2,.7,.2,1)}' +
      '.cc[hidden]{display:none}.cc p{margin:0;color:rgba(255,255,255,.78)}.cc strong{display:block;margin-bottom:4px;color:#fff;font-weight:600;font-size:15px}' +
      '.cc__row{display:flex;gap:8px;margin-top:14px}.cc button{flex:1;height:42px;border:0;border-radius:999px;font:500 13px Inter,system-ui,sans-serif;cursor:pointer}' +
      '.cc__yes{background:#d4f55c;color:#0e0e0e}.cc__no{background:rgba(255,255,255,.1);color:#fff}.cc button:hover{filter:brightness(1.08)}' +
      '.cc button:focus-visible{outline:2px solid #d4f55c;outline-offset:2px}' +
      '@keyframes cc-in{from{opacity:0;transform:translateY(16px)}}@media (prefers-reduced-motion:reduce){.cc{animation:none}}';
    document.head.appendChild(css);
    banner = document.createElement('div');
    banner.className = 'cc';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', 'Cookie preferences');
    banner.innerHTML = '<p><strong>Cookies, just for stats</strong>I use Google Analytics to see which projects people view, so I can make this portfolio better. No ads, no selling data.</p>' +
      '<div class="cc__row"><button type="button" class="cc__no">Decline</button><button type="button" class="cc__yes">Accept</button></div>';
    banner.querySelector('.cc__yes').addEventListener('click', function () { setChoice('granted'); banner.hidden = true; load(); });
    banner.querySelector('.cc__no').addEventListener('click', function () {
      setChoice('denied'); banner.hidden = true;
      if (loaded) location.reload(); // stop tracking that already started in this visit
    });
    document.body.appendChild(banner);
  }

  var choice = getChoice();
  if (choice === 'granted') load();
  else if (choice !== 'denied') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', showBanner);
    else showBanner();
  }
})();
