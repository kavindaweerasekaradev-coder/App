/*
 * Real portrait photos for the nestwork sample people.
 *
 * Photos come from Unsplash (https://unsplash.com/license: free to use, no
 * attribution required) and load straight from its image CDN, cropped to the
 * face. Any <img> pointing at assets/avatars/<name>.svg is upgraded to the
 * matching photo, including ones the pages add later. If a photo fails to
 * load, the illustrated portrait in assets/avatars/ stays as the fallback.
 */
(function () {
  var PHOTOS = {
    // Account owner and the 12 sample employees
    'kavinda-weerasekara': '1507003211169-0a1dd7228f2d',
    'amaya-silva': '1494790108377-be9c29b29330',
    'daniel-okafor': '1504257432389-52343af06ae3',
    'priya-nair': '1607746882042-944635dfe10e',
    'lucas-martin': '1500648767791-00dcc994a43e',
    'hana-kim': '1573497019940-1c28c88b4f3e',
    'ravi-jayasuriya': '1599566150163-29194dcaad36',
    'nadia-perera': '1580489944761-15a19d654956',
    'marcus-lee': '1472099645785-5658abf4ff4e',
    'ishan-fernando': '1506794778202-cad84cf45f1d',
    'sofia-rossi': '1438761681033-6461ffad8d80',
    'tomas-garcia': '1519085360753-af0119f7cbe7',
    'aisha-rahman': '1573496359142-b8d87734a5a2',
    // The 12 job candidates
    'leah-thompson': '1544005313-94ddf0286df2',
    'kenji-watanabe': '1539571696357-5a69c17a67c6',
    'zara-ahmed': '1534528741775-53994a69daeb',
    'mateo-costa': '1560250097-0b93528c311a',
    'chloe-dubois': '1517841905240-472988babdf9',
    'samuel-mensah': '1522075469751-3a6694fb2f61',
    'ananya-rao': '1531123897727-8f129e1688ce',
    'oliver-grant': '1527980965255-d3b416303d12',
    'mei-lin': '1554151228-14d9def656e4',
    'arjun-patel': '1557862921-37829c790f19',
    'ruth-alemu': '1508214751196-bcfd4ca60f91',
    'jonas-berg': '1570295999919-56ceb5ecca61'
  };

  function photoUrl(id, size) {
    var px = Math.min(400, Math.max(96, Math.round(size * (window.devicePixelRatio || 1) * 1.5)));
    return 'https://images.unsplash.com/photo-' + id + '?w=' + px + '&h=' + px + '&fit=crop&crop=faces&auto=format&q=75';
  }

  function upgrade(img) {
    if (img.dataset.photo) return;
    var m = /assets\/avatars\/([a-z-]+)\.svg/.exec(img.getAttribute('src') || '');
    if (!m || !PHOTOS[m[1]]) return;
    var fallback = img.getAttribute('src');
    var size = parseInt(img.getAttribute('width'), 10) || img.clientWidth || 48;
    img.dataset.photo = m[1];
    img.style.objectFit = 'cover';
    img.addEventListener('error', function onError() {
      img.removeEventListener('error', onError);
      img.src = fallback;
    });
    img.src = photoUrl(PHOTOS[m[1]], size);
  }

  function scan(root) {
    if (root.tagName === 'IMG') return upgrade(root);
    if (root.querySelectorAll) root.querySelectorAll('img[src*="assets/avatars/"]').forEach(upgrade);
  }

  scan(document);
  new MutationObserver(function (records) {
    records.forEach(function (r) {
      r.addedNodes.forEach(function (n) { if (n.nodeType === 1) scan(n); });
      if (r.type === 'attributes') upgrade(r.target);
    });
  }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
})();
