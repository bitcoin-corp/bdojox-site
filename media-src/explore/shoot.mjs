// node shoot.mjs <html> <out.png> [width]   screenshots a full page (needs PW=path to playwright)
const { chromium } = await import(process.env.PW || 'playwright'); import path from 'node:path'; import { pathToFileURL } from 'node:url';
const [, , file, out, w] = process.argv; const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +w || 2496, height: 1000 } });
p.on('pageerror', e => console.log('err', e.message));
await p.goto(pathToFileURL(path.resolve(file)).href); await p.waitForFunction('window.__ready', null, { timeout: 40000 }); await p.waitForTimeout(1500);
await p.screenshot({ path: out, fullPage: true }); await b.close();
