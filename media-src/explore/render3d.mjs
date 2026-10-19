// node media-src/explore/render3d.mjs <outDir>   (needs playwright resolvable; set PW=/path/to/playwright/index.mjs)
import { pathToFileURL } from 'node:url'; import path from 'node:path';
const { chromium } = await import(process.env.PW || 'playwright');
const out = process.argv[2], here = path.dirname(new URL(import.meta.url).pathname);
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const [mode, w, h, transparent, extra] of [['mark', 2400, 2000, true, ''], ['scene', 2400, 1350, false, ''], ['scene', 2400, 1260, false, '&notorii=1']]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p.on('console', m => console.log('page:', m.text())); p.on('pageerror', e => console.log('err:', e.message));
  await p.goto(pathToFileURL(path.join(here, 'torii3d.html')).href + `?mode=${mode}&w=${w}&h=${h}${extra}`);
  await p.waitForFunction('window.__done', null, { timeout: 60000 });
  await p.screenshot({ path: `${out}/torii3d-${mode}${extra ? '-rain' : ''}.png`, omitBackground: transparent });
  console.log('ok', mode);
}
await b.close();
