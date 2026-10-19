// PW=<playwright/index.mjs> TOOLS=<dir with node_modules/sharp> node media-src/brand/render.mjs   -> brand/*.png|webp, og-bdojox.png, tiles -> png
import path from 'node:path'; import fs from 'node:fs'; import { createRequire } from 'node:module'; import { pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.PW); const here = path.dirname(new URL(import.meta.url).pathname), root = path.resolve(here, '../..');
const sharp = createRequire(process.env.TOOLS + '/x.js')('sharp'); fs.mkdirSync(path.join(root, 'brand'), { recursive: true });
const b = await chromium.launch();
async function shot(file, q, w, h, out, transparent = false) {
  const p = await b.newPage({ viewport: { width: w, height: h } }); p.on('pageerror', e => console.log('err', e.message));
  await p.goto(pathToFileURL(path.join(here, file)).href + q); await p.waitForFunction('window.__ready', null, { timeout: 30000 }); await p.waitForTimeout(1200);
  await p.screenshot({ path: out, omitBackground: transparent }); await p.close();
}
await shot('composite.html', '?mode=mark', 2000, 2000, path.join(root, 'brand/mark-3d.png'), true);
await shot('composite.html', '?mode=scene', 2400, 1350, path.join(root, 'brand/scene-3d.png'));
await shot('../og-bdojox.html', '', 1200, 630, path.join(root, 'og-bdojox.png'));
for (const [n, w, q] of [['mark-3d', 1400, 90], ['scene-3d', 2000, 84]]) await sharp(path.join(root, `brand/${n}.png`)).resize(w).webp({ quality: q, alphaQuality: 100 }).toFile(path.join(root, `brand/${n}.webp`));
await b.close();
