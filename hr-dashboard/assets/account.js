/*
 * Account menu for the nestwork app pages. Opens from the profile photo
 * button (aria-label "Account menu") with the signed-in name and email, links
 * to the project overview and flow map, and Sign out. Icons are Lucide.
 */
(function () {
  var btn = document.querySelector('button[aria-label="Account menu"]');
  if (!btn) return;
  function icon(inner) { return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>'; }
  var I = { overview: '<path d="M2 3h20"/><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/><path d="m7 21 5-5 5 5"/>', flow: '<rect width="8" height="8" x="3" y="3" rx="2"/><path d="M7 11v4a2 2 0 0 0 2 2h4"/><rect width="8" height="8" x="13" y="13" rx="2"/>', out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>' };

  // The name and email from log in or sign-up, else the account owner
  var first = 'Kavinda', email = 'kavinda@nestwork.co';
  try { first = sessionStorage.getItem('nestwork:name') || first; email = sessionStorage.getItem('nestwork:email') || email; } catch (e) {}
  var name = first === 'Kavinda' ? 'Kavinda Weerasekara' : first;

  btn.classList.add('ac-btn');
  btn.setAttribute('aria-haspopup', 'menu');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'acMenu');
  var menu = document.createElement('div');
  menu.className = 'ac-menu'; menu.id = 'acMenu'; menu.hidden = true;
  menu.setAttribute('role', 'menu'); menu.setAttribute('aria-label', 'Account');
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  menu.innerHTML =
    '<div class="ac-who"><img src="assets/avatars/kavinda-weerasekara.svg" alt="" width="44" height="44"><div style="min-width:0"><strong>' + esc(name) + '</strong><span>' + esc(email) + '</span><span class="ac-role">HR admin</span></div></div>' +
    '<a role="menuitem" href="overview.html"><span class="ac-ic">' + icon(I.overview) + '</span><span>Project overview<small>What nestwork is</small></span></a>' +
    '<a role="menuitem" href="flow.html"><span class="ac-ic">' + icon(I.flow) + '</span><span>App flow map<small>Every page and step</small></span></a>' +
    '<div class="ac-sep" role="separator"></div>' +
    '<a role="menuitem" href="login.html" class="ac-out"><span class="ac-ic">' + icon(I.out) + '</span><span>Sign out</span></a>';
  document.body.appendChild(menu);

  function items() { return Array.prototype.slice.call(menu.querySelectorAll('[role="menuitem"]')); }
  function place() {
    var r = btn.getBoundingClientRect();
    menu.style.top = (r.bottom + 10) + 'px';
    menu.style.right = Math.max(12, window.innerWidth - r.right) + 'px';
    menu.style.left = 'auto';
  }
  function open() {
    var bell = document.querySelector('.nw-bell[aria-expanded="true"]'); if (bell) bell.click();
    place(); menu.hidden = false; btn.setAttribute('aria-expanded', 'true');
    items()[0].focus();
  }
  function close(focusBtn) {
    if (menu.hidden) return;
    menu.hidden = true; btn.setAttribute('aria-expanded', 'false');
    if (focusBtn) btn.focus();
  }
  btn.addEventListener('click', function (ev) { ev.stopPropagation(); if (menu.hidden) open(); else close(true); });
  document.addEventListener('click', function (ev) { if (!menu.hidden && !menu.contains(ev.target)) close(false); });
  window.addEventListener('resize', function () { if (!menu.hidden) place(); });
  menu.addEventListener('keydown', function (ev) {
    var list = items(), i = list.indexOf(document.activeElement);
    if (ev.key === 'Escape') { ev.preventDefault(); close(true); }
    else if (ev.key === 'ArrowDown') { ev.preventDefault(); list[(i + 1) % list.length].focus(); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); list[(i - 1 + list.length) % list.length].focus(); }
    else if (ev.key === 'Home') { ev.preventDefault(); list[0].focus(); }
    else if (ev.key === 'End') { ev.preventDefault(); list[list.length - 1].focus(); }
    else if (ev.key === 'Tab') close(false);
  });
})();
