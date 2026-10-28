// Collect shots (title, link, full-size image) from a Dribbble profile with a real browser.
// Runs in GitHub Actions (.github/workflows/fetch-dribbble.yml):
//   node scripts/fetch_dribbble.mjs https://dribbble.com/<user>
// Writes assets/data/dribbble-raw/shots.json and images/NN.<ext>.

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const profile = process.argv[2] || 'https://dribbble.com/Kavindalakmal';
const out = path.join('assets', 'data', 'dribbble-raw');
fs.mkdirSync(path.join(out, 'images'), { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
  locale: 'en-US',
});
const page = await context.newPage();
const res = await page.goto(profile, { waitUntil: 'domcontentloaded', timeout: 60000 });
console.log('status', res && res.status());
await page.waitForTimeout(4000);
for (let i = 0; i < 12; i++) { await page.mouse.wheel(0, 1600); await page.waitForTimeout(700); }
await page.screenshot({ path: path.join(out, 'page.png') });

const shots = await page.evaluate(() => {
  const abs = (u) => { try { return new URL(u, location.href).href; } catch { return null; } };
  const seen = new Set();
  return [...document.querySelectorAll('li[id^="screenshot-"], li.shot-thumbnail, [data-thumbnail-id]')].map((li) => {
    const a = li.querySelector('a.shot-thumbnail-link, a[href*="/shots/"]');
    const img = li.querySelector('img');
    const href = a && abs(a.getAttribute('href'));
    if (!href || seen.has(href)) return null;
    seen.add(href);
    const srcset = img && (img.getAttribute('data-srcset') || img.getAttribute('srcset') || '');
    const cands = srcset.split(',').map((s) => s.trim().split(' ')[0]).filter(Boolean);
    const src = cands.length ? cands[cands.length - 1] : img && (img.getAttribute('data-src') || img.src);
    const title = (li.querySelector('.shot-title, [class*="title"]') || {}).textContent || (img && img.alt) || '';
    const video = li.querySelector('video source, video');
    return { href, title: title.trim(), img: abs(src), alt: img && img.alt, video: video && abs(video.getAttribute('src') || video.getAttribute('data-src')) };
  }).filter(Boolean);
});
console.log('found', shots.length);

for (const [i, s] of shots.entries()) {
  if (!s.img) continue;
  const url = s.img.replace(/\?.*$/, '') + '?resize=1600x1200&vertical=center';
  for (const u of [url, s.img]) {
    try {
      const r = await context.request.get(u, { timeout: 30000 });
      if (!r.ok()) continue;
      const type = r.headers()['content-type'] || '';
      const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : type.includes('gif') ? 'gif' : 'jpg';
      s.file = `images/${String(i + 1).padStart(2, '0')}.${ext}`;
      fs.writeFileSync(path.join(out, s.file), await r.body());
      break;
    } catch (e) { console.log('  fail', u, e.message); }
  }
}

// Each shot page has the full description
for (const s of shots) {
  try {
    await page.goto(s.href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(2500);
    const d = await page.evaluate(() => {
      const t = document.querySelector('h1');
      const desc = document.querySelector('.shot-description-container, [class*="description"]');
      const og = document.querySelector('meta[property="og:image"]');
      const tags = [...document.querySelectorAll('a[href*="/tags/"]')].map((a) => a.textContent.trim()).filter(Boolean);
      return { title: t && t.textContent.trim(), description: desc && desc.innerText.trim().slice(0, 1500), og: og && og.content, tags: [...new Set(tags)].slice(0, 8) };
    });
    Object.assign(s, { pageTitle: d.title, description: d.description, og: d.og, tags: d.tags });
  } catch (e) { console.log('  shot page fail', s.href, e.message); }
}

fs.writeFileSync(path.join(out, 'shots.json'), JSON.stringify({ profile, shots }, null, 2));
await browser.close();
