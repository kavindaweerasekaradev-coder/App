/*
 * Notifications panel for the nestwork app pages.
 *
 * Hooks onto the header's bell button (aria-label starting "Notifications"),
 * adds an unread badge, and opens a panel: a dropdown on wide screens, a
 * bottom sheet on phones. Read state, actions and settings last for the visit
 * (sessionStorage). Icons are Lucide; portraits are upgraded by people.js.
 */
(function () {
  var bell = document.querySelector('button[aria-label^="Notifications"]');
  if (!bell) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var KEY = 'nestwork:notifications';
  var MIN = 60000, HOUR = 60 * MIN, DAY = 24 * HOUR;

  function icon(inner, size, sw) {
    return '<svg width="' + (size || 16) + '" height="' + (size || 16) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 2) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
  }
  var I = {
    leave: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/>', recruit: '<path d="M12 12h.01"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M22 13a18.15 18.15 0 0 1-20 0"/><rect width="20" height="14" x="2" y="6" rx="2"/>', payroll: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>', time: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>', mention: '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>',
    check: '<path d="M20 6 9 17l-5-5"/>', checks: '<path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/>', x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', gear: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>', back: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>', inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>', mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>', phone: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>', party: '<path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/><path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17"/><path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7"/><path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z"/>', bellOff: '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M17 17H4a1 1 0 0 1-.74-1.673C4.59 13.956 6 12.499 6 8a6 6 0 0 1 .258-1.742"/><path d="m2 2 20 20"/><path d="M8.668 3.01A6 6 0 0 1 18 8c0 2.687.77 4.653 1.707 6.05"/>'
  };
  var TYPES = {
    leave: { label: 'Leave requests', bg: '#EDE3FF', fg: '#5B3BA8', icon: I.leave },
    recruit: { label: 'Recruitment', bg: '#DCE8FF', fg: '#1D4ED8', icon: I.recruit },
    payroll: { label: 'Payroll', bg: '#DDF1E2', fg: '#2D6B43', icon: I.payroll },
    time: { label: 'Attendance', bg: '#FDEBD3', fg: '#9A4A00', icon: I.time },
    mention: { label: 'Mentions', bg: '#FCE4EE', fg: '#A3265C', icon: I.mention }
  };

  // Sample notifications, consistent with the rest of the prototype
  var now = Date.now();
  var seed = [
    { id: 1, type: 'leave', who: 'Nadia Perera', html: '<b>Nadia Perera</b> asked for <b>3 days</b> of annual leave', note: '“Family visit” · waiting for your approval', at: now - 12 * MIN, unread: true, href: 'attendance.html#leave', act: 'leave' },
    { id: 2, type: 'recruit', who: 'Kenji Watanabe', html: '<b>Kenji Watanabe</b> applied for <b>Frontend Engineer</b>', at: now - 48 * MIN, unread: true, href: 'recruitment.html#cand-2', act: 'link', label: 'View candidate' },
    { id: 3, type: 'payroll', sys: true, html: 'The <b>November pay run</b> has <b>2 issues</b> to fix before pay day', at: now - 2 * HOUR, unread: true, href: 'payroll.html#run', act: 'link', label: 'Fix issues' },
    { id: 4, type: 'time', who: 'Hana Kim', html: '<b>Hana Kim</b> checked in late at <b>09:47</b>', at: now - 3 * HOUR, unread: false, href: 'attendance.html#emp-5' },
    { id: 5, type: 'mention', who: 'Ravi Jayasuriya', html: '<b>Ravi Jayasuriya</b> mentioned you on <b>Mateo Costa</b>', quote: '“@Kavinda strong portfolio, can we fast-track the interview?”', at: now - 20 * HOUR, unread: true, href: 'recruitment.html#cand-4' },
    { id: 6, type: 'recruit', who: 'Leah Thompson', html: 'Interview with <b>Leah Thompson</b> is booked for the next working day at <b>10:00</b>', at: now - 26 * HOUR, unread: false, href: 'recruitment.html#cand-1' },
    { id: 7, type: 'recruit', who: 'Chloé Dubois', html: '<b>Chloé Dubois</b> accepted the offer for <b>Data Analyst</b>', at: now - 2 * DAY, unread: false, href: 'recruitment.html#cand-5' },
    { id: 8, type: 'payroll', sys: true, html: '<b>October pay</b> reached <b>246 people</b>. Payslips were emailed.', at: now - 7 * DAY, unread: false, href: 'payroll.html' },
    { id: 9, type: 'leave', who: 'Ishan Fernando', html: '<b>Ishan Fernando</b> started <b>parental leave</b>', at: now - 8 * DAY, unread: false, href: 'attendance.html#emp-9' }
  ];

  var state = { items: seed, tab: 'all', view: 'list', prefs: { leave: true, recruit: true, payroll: true, time: true, mention: true, email: true, push: false } };
  try {
    var saved = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (saved && saved.items) { state.items = saved.items; state.prefs = saved.prefs || state.prefs; }
  } catch (e) {}
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify({ items: state.items, prefs: state.prefs })); } catch (e) {} }

  function slug(name) { return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]+/g, '-'); }
  function ago(t) {
    var d = Date.now() - t;
    if (d < MIN) return 'Just now';
    if (d < HOUR) return Math.round(d / MIN) + ' min ago';
    if (d < DAY) return Math.round(d / HOUR) + ' h ago';
    if (d < 2 * DAY) return 'Yesterday';
    return Math.round(d / DAY) + ' days ago';
  }
  function group(t) {
    var start = new Date(); start.setHours(0, 0, 0, 0);
    if (t >= start.getTime()) return 'Today';
    if (t >= start.getTime() - DAY) return 'Yesterday';
    return 'Earlier';
  }
  function visible() { return state.items.filter(function (n) { return state.prefs[n.type] !== false; }); }
  function unreadCount() { return visible().filter(function (n) { return n.unread; }).length; }

  // ---------- Bell and badge ----------
  var oldDot = bell.querySelector('.ping'); if (oldDot) oldDot.remove();
  bell.classList.add('nw-bell');
  bell.setAttribute('aria-haspopup', 'dialog');
  bell.setAttribute('aria-expanded', 'false');
  bell.setAttribute('aria-controls', 'nwPanel');
  var badge = document.createElement('span');
  badge.className = 'nw-badge'; badge.setAttribute('aria-hidden', 'true');
  bell.appendChild(badge);
  function updateBadge() {
    var n = unreadCount();
    badge.hidden = !n; badge.textContent = n > 9 ? '9+' : n;
    bell.setAttribute('aria-label', n ? 'Notifications, ' + n + ' unread' : 'Notifications');
  }

  // ---------- Panel ----------
  var scrim = document.createElement('div'); scrim.className = 'nw-scrim'; scrim.hidden = true;
  var panel = document.createElement('section');
  panel.className = 'nw-panel'; panel.id = 'nwPanel'; panel.hidden = true;
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Notifications');
  document.body.appendChild(scrim); document.body.appendChild(panel);

  function avatar(n) {
    var t = TYPES[n.type];
    var main = n.sys
      ? '<span class="nw-sys" style="background:' + t.bg + ';color:' + t.fg + '">' + icon(t.icon, 20) + '</span>'
      : '<img src="assets/avatars/' + slug(n.who) + '.svg" alt="" width="42" height="42">';
    return '<span class="nw-ava">' + main + (n.sys ? '' : '<span class="nw-type" style="background:' + t.bg + ';color:' + t.fg + '">' + icon(t.icon, 11, 2.4) + '</span>') + '</span>';
  }
  function itemHtml(n, i) {
    var extra = '';
    if (n.act === 'leave' && !n.decided) extra = '<div class="nw-acts"><button type="button" class="nw-btn dark" data-nw-decide="Approved" data-nw-id="' + n.id + '">' + icon(I.check, 14, 2.6) + 'Approve</button><button type="button" class="nw-btn" data-nw-decide="Declined" data-nw-id="' + n.id + '">' + icon(I.x, 14, 2.4) + 'Decline</button></div>';
    else if (n.act === 'leave') extra = '<span class="nw-done ' + (n.decided === 'Approved' ? 'ok' : 'no') + '">' + icon(n.decided === 'Approved' ? I.check : I.x, 12, 2.6) + n.decided + '</span>';
    else if (n.act === 'link') extra = '<div class="nw-acts"><a class="nw-btn" href="' + n.href + '" data-nw-go="' + n.id + '" style="text-decoration:none;color:#1F2933">' + n.label + icon(I.arrow, 14, 2.4) + '</a></div>';
    if (n.id === 7) extra = '<span class="nw-done ok">' + icon(I.party, 12, 2.4) + 'Offer accepted</span>';
    return '<li class="nw-item' + (n.unread ? ' unread' : '') + '" data-nw-id="' + n.id + '" style="animation-delay:' + (reduced ? 0 : i * 35) + 'ms">' +
      '<button type="button" class="nw-open" data-nw-open="' + n.id + '" aria-label="' + (n.unread ? 'Unread: ' : '') + n.html.replace(/<[^>]+>/g, '') + '. ' + ago(n.at) + '"></button>' +
      avatar(n) +
      '<div class="nw-text"><p>' + n.html + '</p>' + (n.quote ? '<p class="nw-quote">' + n.quote + '</p>' : '') +
        '<div class="nw-meta"><span>' + ago(n.at) + '</span><i></i><span>' + TYPES[n.type].label + '</span>' + (n.note ? '<i></i><span class="nw-note">' + n.note + '</span>' : '') + '</div>' + extra + '</div>' +
      '<div class="nw-side">' + (n.unread ? '<span class="nw-dot" aria-hidden="true"></span><button type="button" class="nw-mark" data-nw-read="' + n.id + '" aria-label="Mark as read" title="Mark as read">' + icon(I.check, 14, 2.4) + '</button>' : '') + '</div></li>';
  }
  function renderList() {
    var list = visible().filter(function (n) { return state.tab === 'all' || n.unread; }).sort(function (a, b) { return b.at - a.at; });
    var unread = unreadCount();
    var groups = {};
    list.forEach(function (n) { (groups[group(n.at)] = groups[group(n.at)] || []).push(n); });
    var body = '', i = 0;
    ['Today', 'Yesterday', 'Earlier'].forEach(function (g) {
      if (!groups[g]) return;
      body += '<div class="nw-group">' + g + '</div><ul class="nw-list">' + groups[g].map(function (n) { return itemHtml(n, i++); }).join('') + '</ul>';
    });
    if (!list.length) body = '<div class="nw-empty"><div class="nw-empty-ic">' + icon(state.tab === 'unread' ? I.checks : I.inbox, 30) + '</div><strong>' + (state.tab === 'unread' ? 'You’re all caught up' : 'No notifications') + '</strong><span>' + (state.tab === 'unread' ? 'New activity from your team will show up here.' : 'Turn categories back on in settings to see more.') + '</span></div>';
    panel.innerHTML =
      '<div class="nw-head"><h2>Notifications' + (unread ? '<span class="nw-count">' + unread + '</span>' : '') + '</h2><div class="nw-head-actions">' +
        '<button type="button" class="nw-text-btn" id="nwReadAll" aria-label="Mark all read"' + (unread ? '' : ' disabled') + '>' + icon(I.checks, 16) + '<span class="nw-hide-sm">Mark all read</span></button>' +
        '<button type="button" class="nw-icon-btn" id="nwGear" aria-label="Notification settings">' + icon(I.gear, 18) + '</button>' +
        '<button type="button" class="nw-icon-btn" id="nwClose" aria-label="Close notifications">' + icon(I.x, 18) + '</button></div></div>' +
      '<div class="nw-tabs" role="tablist" aria-label="Show"><button type="button" role="tab" data-nw-tab="all" aria-selected="' + (state.tab === 'all') + '">All</button>' +
        '<button type="button" role="tab" data-nw-tab="unread" aria-selected="' + (state.tab === 'unread') + '">Unread' + (unread ? '<span class="nw-pill">' + unread + '</span>' : '') + '</button></div>' +
      '<div class="nw-body" role="tabpanel">' + body + '</div>' +
      '<div class="nw-foot"><span>Showing ' + list.length + ' of ' + visible().length + '</span><button type="button" class="nw-text-btn" id="nwGear2">' + icon(I.gear, 14) + 'Settings</button></div>';
    updateBadge();
  }
  function renderSettings() {
    var row = function (key, label, sub, bg, fg, ic) {
      return '<label class="nw-toggle"><span class="nw-tic" style="background:' + bg + ';color:' + fg + '">' + icon(ic, 16) + '</span><span class="nw-tl">' + label + '<small>' + sub + '</small></span>' +
        '<span class="nw-switch"><input type="checkbox" data-nw-pref="' + key + '"' + (state.prefs[key] !== false ? ' checked' : '') + '><i aria-hidden="true"></i></span></label>';
    };
    panel.innerHTML =
      '<div class="nw-head"><h2><button type="button" class="nw-icon-btn" id="nwBack" aria-label="Back to notifications">' + icon(I.back, 18) + '</button>Settings</h2><div class="nw-head-actions">' +
        '<button type="button" class="nw-icon-btn" id="nwClose" aria-label="Close notifications">' + icon(I.x, 18) + '</button></div></div>' +
      '<div class="nw-body"><div class="nw-settings"><h3>What to show</h3>' +
        Object.keys(TYPES).map(function (k) {
          var t = TYPES[k], sub = { leave: 'Requests and approvals', recruit: 'Applications, interviews, offers', payroll: 'Pay runs and issues', time: 'Late check-ins and absences', mention: 'When someone tags you' }[k];
          return row(k, t.label, sub, t.bg, t.fg, t.icon);
        }).join('') +
        '<h3>How to reach you</h3>' + row('email', 'Daily email digest', 'A summary every morning at 8:00', '#F1F5F8', '#4A5863', I.mail) + row('push', 'Push notifications', 'On your phone, as it happens', '#F1F5F8', '#4A5863', I.phone) +
      '</div></div>';
  }
  function render() { if (state.view === 'settings') renderSettings(); else renderList(); }

  // ---------- Open / close ----------
  function position() {
    if (window.innerWidth <= 640) { panel.style.top = panel.style.left = panel.style.right = ''; return; }
    var r = bell.getBoundingClientRect();
    panel.style.top = (r.bottom + 12) + 'px';
    panel.style.right = Math.max(12, window.innerWidth - r.right - 8) + 'px';
    panel.style.left = 'auto';
  }
  function open() {
    state.view = 'list'; render(); position();
    panel.hidden = false; scrim.hidden = false;
    bell.setAttribute('aria-expanded', 'true');
    if (window.innerWidth <= 640) document.body.style.overflow = 'hidden';
    setTimeout(function () { var f = panel.querySelector('[role="tab"][aria-selected="true"]'); if (f) f.focus(); }, 30);
  }
  function close(focusBell) {
    if (panel.hidden) return;
    panel.hidden = true; scrim.hidden = true;
    bell.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (focusBell !== false) bell.focus();
  }
  bell.addEventListener('click', function (ev) { ev.stopPropagation(); if (panel.hidden) open(); else close(); });
  scrim.addEventListener('click', function () { close(); });
  window.addEventListener('resize', function () { if (!panel.hidden) position(); });
  document.addEventListener('keydown', function (ev) {
    if (panel.hidden) return;
    if (ev.key === 'Escape') { ev.preventDefault(); close(); }
    if (ev.key === 'Tab') {
      var f = Array.prototype.filter.call(panel.querySelectorAll('button:not([disabled]), a[href], input'), function (n) { return n.offsetParent !== null; });
      if (!f.length) return;
      if (ev.shiftKey && document.activeElement === f[0]) { ev.preventDefault(); f[f.length - 1].focus(); }
      else if (!ev.shiftKey && document.activeElement === f[f.length - 1]) { ev.preventDefault(); f[0].focus(); }
    }
  });

  // ---------- Actions ----------
  function find(id) { for (var i = 0; i < state.items.length; i++) if (state.items[i].id === id) return state.items[i]; return null; }
  panel.addEventListener('click', function (ev) {
    var t = ev.target.closest('button, a'); if (!t) return;
    if (t.id === 'nwClose') return close();
    if (t.id === 'nwGear' || t.id === 'nwGear2') { state.view = 'settings'; render(); var b = panel.querySelector('#nwBack'); if (b) b.focus(); return; }
    if (t.id === 'nwBack') { state.view = 'list'; render(); var g = panel.querySelector('#nwGear'); if (g) g.focus(); return; }
    if (t.id === 'nwReadAll') { state.items.forEach(function (n) { n.unread = false; }); save(); renderList(); ring(); panel.querySelector('[role="tab"][aria-selected="true"]').focus(); return; }
    if (t.dataset.nwTab) { state.tab = t.dataset.nwTab; renderList(); panel.querySelector('[data-nw-tab="' + state.tab + '"]').focus(); return; }
    if (t.dataset.nwRead) {
      var n = find(+t.dataset.nwRead), li = t.closest('.nw-item');
      n.unread = false; save();
      if (state.tab === 'unread' && li && !reduced) { li.classList.add('gone'); setTimeout(renderList, 250); } else renderList();
      var next = panel.querySelector('.nw-mark') || panel.querySelector('[role="tab"]'); if (next) next.focus();
      return;
    }
    if (t.dataset.nwDecide) {
      var m = find(+t.dataset.nwId);
      m.decided = t.dataset.nwDecide; m.unread = false; m.note = m.decided + ' by you'; save(); renderList();
      var done = panel.querySelector('.nw-item[data-nw-id="' + m.id + '"] .nw-open'); if (done) done.focus();
      return;
    }
    if (t.dataset.nwOpen || t.dataset.nwGo) {
      var k = find(+(t.dataset.nwOpen || t.dataset.nwGo)); k.unread = false; save();
      if (t.tagName === 'A') return; // let the link navigate
      var here = location.pathname.split('/').pop() || 'index.html', dest = k.href.split('#');
      if (dest[0] === here) { close(false); if (dest[1]) { history.replaceState(null, '', '#' + dest[1]); window.dispatchEvent(new HashChangeEvent('hashchange')); } }
      else window.location.href = k.href;
      renderList();
    }
  });
  panel.addEventListener('change', function (ev) {
    var input = ev.target.closest('[data-nw-pref]'); if (!input) return;
    state.prefs[input.dataset.nwPref] = input.checked; save(); updateBadge();
  });

  function ring() {
    if (reduced) return;
    bell.classList.remove('ring'); void bell.offsetWidth; bell.classList.add('ring');
  }

  updateBadge();
  if (unreadCount()) setTimeout(ring, 900);
})();
