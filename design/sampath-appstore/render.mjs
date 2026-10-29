// Exports each screen in screens.html to a 1290x2796 PNG (App Store 6.7") plus an overview strip.
// Usage: node design/sampath-appstore/render.mjs
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(dir, 'export');
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 2400, height: 1100 }, deviceScaleFactor: 3 });
await page.goto('file://' + path.join(dir, 'screens.html'));
await page.evaluate(() => document.fonts.ready);

const frames = await page.$$('.frame');
for (const [i, frame] of frames.entries()) {
  const file = path.join(out, `sampath-appstore-${i + 1}.png`);
  await frame.screenshot({ path: file });
  console.log('wrote', path.relative(dir, file));
}

await page.setViewportSize({ width: 2370, height: 1012 });
await page.evaluate(() => document.body.classList.add('preview'));
const preview = await browser.newPage({ viewport: { width: 2370, height: 1012 }, deviceScaleFactor: 1 });
await preview.goto('file://' + path.join(dir, 'screens.html'));
await preview.evaluate(() => { document.body.classList.add('preview'); return document.fonts.ready; });
await preview.screenshot({ path: path.join(out, 'sampath-appstore-overview.png') });
console.log('wrote export/sampath-appstore-overview.png');
await browser.close();
