// Collect real logo candidates for the Live products cards with a real browser.
// Runs in GitHub Actions (.github/workflows/fetch-logos.yml):
//   node scripts/fetch_logos.mjs
// Writes assets/data/logo-raw/<slug>/ with every icon/logo the site or App Store
// exposes, a header screenshot and index.json, so the best one can be picked by hand.

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const sites = [
  { slug: 'rjt', url: 'https://www.rjt.ac.lk/' },
];
const apps = [];
// Wikipedia infobox images (logos/seals) via the REST summary endpoint.
const wiki = [
  { slug: 'rjt', title: 'Rajarata_University_of_Sri_Lanka' },
];

const root = path.join('assets', 'data', 'logo-raw');
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
  locale: 'en-US',
});

function extFor(url, type) {
  const m = (type || '').match(/image\/(svg\+xml|png|jpe?g|webp|x-icon|vnd\.microsoft\.icon|gif)/);
  if (m) return { 'svg+xml': 'svg', 'x-icon': 'ico', 'vnd.microsoft.icon': 'ico', jpeg: 'jpg' }[m[1]] || m[1];
  const e = (url.split('?')[0].match(/\.(svg|png|jpe?g|webp|ico|gif)$/i) || [])[1];
  return e ? e.toLowerCase() : 'bin';
}

async function save(dir, name, url) {
  try {
    const r = await context.request.get(url, { timeout: 30000 });
    if (!r.ok()) return null;
    const file = `${name}.${extFor(url, r.headers()['content-type'])}`;
    fs.writeFileSync(path.join(dir, file), await r.body());
    return file;
  } catch (e) {
    console.log('  fail', url, e.message);
    return null;
  }
}

for (const s of sites) {
  const dir = path.join(root, s.slug);
  fs.mkdirSync(dir, { recursive: true });
  const index = { url: s.url, files: [] };
  const page = await context.newPage();
  try {
    const res = await page.goto(s.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log(s.slug, 'status', res && res.status());
    await page.waitForTimeout(5000);
    await page.screenshot({ path: path.join(dir, 'page.png') });
    const found = await page.evaluate(() => {
      const abs = (u) => { try { return new URL(u, location.href).href; } catch { return null; } };
      const icons = [...document.querySelectorAll('link[rel*="icon"], link[rel="mask-icon"]')]
        .map((l) => ({ kind: l.rel + (l.sizes && l.sizes.value ? ' ' + l.sizes.value : ''), url: abs(l.href) }));
      const og = document.querySelector('meta[property="og:image"]');
      const manifest = document.querySelector('link[rel="manifest"]');
      const isLogo = (el) => /logo|brand/i.test([el.id, el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className, el.getAttribute('alt'), el.getAttribute('aria-label'), el.closest('a') && el.closest('a').getAttribute('aria-label')].join(' '));
      const top = (el) => { const r = el.getBoundingClientRect(); return r.top < 220 && r.width > 16 && r.height > 10; };
      const imgs = [...document.querySelectorAll('img')].filter((i) => top(i) && (isLogo(i) || i.closest('header, nav, [class*="logo" i], [class*="brand" i]')))
        .map((i) => ({ kind: 'header img ' + (i.alt || ''), url: abs(i.currentSrc || i.src) }));
      const svgs = [...document.querySelectorAll('svg')].filter((v) => top(v) && (isLogo(v) || v.closest('a[href="/"], a[href="./"], [class*="logo" i], [class*="brand" i]')))
        .map((v) => v.outerHTML);
      const logoBox = [...document.querySelectorAll('header a, nav a, [class*="logo" i]')].find((a) => top(a) && (a.querySelector('img, svg') || /logo/i.test(a.className)));
      let box = null;
      if (logoBox) { const r = logoBox.getBoundingClientRect(); box = { x: r.x, y: r.y, width: r.width, height: r.height }; }
      return { icons, og: og && abs(og.content), manifest: manifest && abs(manifest.href), imgs, svgs, box, title: document.title };
    });
    index.title = found.title;
    let n = 0;
    for (const i of [...found.icons, ...found.imgs]) {
      if (!i.url) continue;
      const f = await save(dir, `cand-${String(++n).padStart(2, '0')}`, i.url);
      if (f) index.files.push({ file: f, kind: i.kind, url: i.url });
    }
    if (found.og) {
      const f = await save(dir, 'og-image', found.og);
      if (f) index.files.push({ file: f, kind: 'og:image', url: found.og });
    }
    if (found.manifest) {
      try {
        const m = await (await context.request.get(found.manifest)).json();
        for (const ic of m.icons || []) {
          const u = new URL(ic.src, found.manifest).href;
          const f = await save(dir, `cand-${String(++n).padStart(2, '0')}`, u);
          if (f) index.files.push({ file: f, kind: 'manifest ' + (ic.sizes || ''), url: u });
        }
      } catch (e) { console.log('  manifest fail', e.message); }
    }
    found.svgs.slice(0, 4).forEach((svg, k) => {
      const file = `inline-${k + 1}.svg`;
      fs.writeFileSync(path.join(dir, file), svg.includes('xmlns') ? svg : svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"'));
      index.files.push({ file, kind: 'inline header svg' });
    });
    if (found.box && found.box.width > 0) {
      const b = found.box, pad = 8;
      await page.screenshot({ path: path.join(dir, 'logo-shot.png'), clip: { x: Math.max(0, b.x - pad), y: Math.max(0, b.y - pad), width: b.width + pad * 2, height: b.height + pad * 2 } });
      index.files.push({ file: 'logo-shot.png', kind: 'screenshot of header logo' });
    }
  } catch (e) {
    console.log(s.slug, 'error', e.message);
    index.error = e.message;
  }
  await page.close();
  fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify(index, null, 2));
}

for (const a of apps) {
  const dir = path.join(root, a.slug);
  fs.mkdirSync(dir, { recursive: true });
  const q = a.id ? `https://itunes.apple.com/lookup?id=${a.id}&country=lk` : `https://itunes.apple.com/search?term=${encodeURIComponent(a.term)}&entity=software&limit=5`;
  try {
    const data = await (await context.request.get(q, { timeout: 30000 })).json();
    const results = (data.results || []).slice(0, a.id ? 1 : 5);
    const meta = [];
    for (const [k, r] of results.entries()) {
      const art = (r.artworkUrl512 || r.artworkUrl100 || '').replace(/\/\d+x\d+bb\./, '/1024x1024bb.');
      const f = art && await save(dir, `appstore-${k + 1}`, art);
      meta.push({ file: f, name: r.trackName, seller: r.sellerName, url: r.trackViewUrl });
    }
    fs.writeFileSync(path.join(dir, 'appstore.json'), JSON.stringify(meta, null, 2));
    console.log(a.slug, 'appstore', meta.map((m) => m.name).join(' | '));
  } catch (e) {
    console.log(a.slug, 'appstore error', e.message);
  }
}

for (const w of wiki) {
  const dir = path.join(root, w.slug);
  fs.mkdirSync(dir, { recursive: true });
  try {
    const sum = await (await context.request.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${w.title}`, { timeout: 30000 })).json();
    const img = sum.originalimage && sum.originalimage.source;
    const f = img && await save(dir, 'wiki-infobox', img);
    fs.writeFileSync(path.join(dir, 'wiki.json'), JSON.stringify({ file: f, src: img }, null, 2));
    console.log(w.slug, 'wiki', img);
  } catch (e) {
    console.log(w.slug, 'wiki error', e.message);
  }
}

await browser.close();
