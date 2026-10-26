// Import one Behance project (text and full-size images) with a real browser.
// Runs in GitHub Actions (.github/workflows/behance-project.yml):
//   node scripts/fetch_behance_project.mjs https://www.behance.net/gallery/<id>/<slug>
// Writes assets/data/behance-raw/<id>/project.json and images/NN.<ext>.

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const url = process.argv[2];
const m = url && url.match(/behance\.net\/gallery\/(\d+)/);
if (!m) { console.error('Usage: fetch_behance_project.mjs <behance gallery url>'); process.exit(1); }
const id = m[1];
const out = path.join('assets', 'data', 'behance-raw', id);
fs.mkdirSync(path.join(out, 'images'), { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
  locale: 'en-US',
});
const page = await context.newPage();
const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
console.log('status', res && res.status());
await page.waitForTimeout(4000);

// Scroll through the page so lazy-loaded modules render.
for (let y = 0, h = 1; y < h; y += 700) {
  h = await page.evaluate(() => document.body.scrollHeight);
  await page.evaluate((v) => window.scrollTo(0, v), y);
  await page.waitForTimeout(250);
}
await page.waitForTimeout(2000);
fs.writeFileSync(path.join(out, 'page.html'), await page.content());

const data = await page.evaluate(() => {
  const meta = (p) => document.querySelector(`meta[property="${p}"]`)?.content || null;
  const best = (img) => {
    const set = (img.getAttribute('srcset') || '').split(',').map((s) => s.trim().split(/\s+/));
    const ranked = set.filter((p) => p[0]).sort((a, b) => parseFloat(b[1] || 0) - parseFloat(a[1] || 0));
    return (ranked[0] && ranked[0][0]) || img.currentSrc || img.src;
  };
  // Walk the page in document order, keeping project images and text blocks.
  const items = [];
  const seen = new Set();
  const root = document.querySelector('main') || document.body;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  for (let el = walker.currentNode; el; el = walker.nextNode()) {
    if (el.tagName === 'IMG') {
      const src = best(el);
      if (/project_modules/.test(src) && !seen.has(src)) { seen.add(src); items.push({ type: 'image', src, alt: el.alt || '' }); }
    } else if (/^(H1|H2|H3|H4|P|LI|BLOCKQUOTE)$/.test(el.tagName) || (el.tagName === 'DIV' && /text/i.test(el.className) && !el.querySelector('div,p,img'))) {
      const text = el.innerText.trim();
      if (text && text.length > 1 && !seen.has('t:' + text)) { seen.add('t:' + text); items.push({ type: 'text', tag: el.tagName, text }); }
    }
  }
  return {
    title: meta('og:title') || document.title,
    description: meta('og:description'),
    cover: meta('og:image'),
    items,
  };
});

let n = 0;
for (const item of data.items) {
  if (item.type !== 'image') continue;
  n += 1;
  const ext = (item.src.split('?')[0].match(/\.(png|jpe?g|gif|webp)$/i) || ['', 'jpg'])[1].toLowerCase();
  const file = `images/${String(n).padStart(2, '0')}.${ext}`;
  try {
    const r = await context.request.get(item.src, { headers: { Referer: url } });
    if (r.ok()) { fs.writeFileSync(path.join(out, file), await r.body()); item.file = file; }
    else console.log('image failed', r.status(), item.src);
  } catch (err) { console.log('image error', item.src, err.message); }
}

fs.writeFileSync(path.join(out, 'project.json'), JSON.stringify({ url, ...data }, null, 2) + '\n');
console.log(`title: ${data.title}`);
console.log(`items: ${data.items.length}, images saved: ${data.items.filter((i) => i.file).length}`);
await browser.close();
