// node navtype.mjs <outDir> : screenshots the live nav (served on :4960) with 6 type candidates, composes nav-type-options.png
const { chromium } = await import(process.env.PW || 'playwright');
const out = process.argv[2];
const O = [
 ['Archivo Expanded 700', 'Archivo:wdth,wght@62..125,100..900', "'Archivo'", '700', '11.5px', '.14em', 'uppercase', "font-stretch:125%;font-variation-settings:'wdth' 125"],
 ['Zen Kaku Gothic New 700', 'Zen+Kaku+Gothic+New:wght@700', "'Zen Kaku Gothic New'", '700', '13px', '.12em', 'uppercase', ''],
 ['Chakra Petch 600', 'Chakra+Petch:wght@600', "'Chakra Petch'", '600', '13px', '.14em', 'uppercase', ''],
 ['Unbounded 500', 'Unbounded:wght@500', "'Unbounded'", '500', '10.5px', '.1em', 'uppercase', ''],
 ['Syne 700', 'Syne:wght@700', "'Syne'", '700', '13px', '.12em', 'uppercase', ''],
 ['Inter Tight 600 (sentence case)', 'Inter+Tight:wght@600', "'Inter Tight'", '600', '15px', '-.005em', 'none', ''],
];
const b = await chromium.launch(); const shots = [];
for (const [i, o] of O.entries()) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('http://localhost:4960/', { waitUntil: 'load' });
  await p.addStyleTag({ content: `@import url('https://fonts.googleapis.com/css2?family=${o[1]}&display=swap');.nl a,.nav-cta,.bwx-strip a{font-family:${o[2]},sans-serif!important;font-weight:${o[3]}!important;font-size:${o[4]}!important;letter-spacing:${o[5]}!important;text-transform:${o[6]}!important;${o[7]}}` });
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(2500);
  const f = `${out}/nt-${i}.png`; await p.screenshot({ path: f, clip: { x: 0, y: 0, width: 1440, height: 130 } }); shots.push([o[0], f]); await p.close();
}
const p = await b.newPage({ viewport: { width: 1520, height: 900 } });
import('node:fs').then(()=>{});const fs=await import('node:fs');const html=`<body style="margin:0;background:#04050a;padding:30px;font:14px 'IBM Plex Sans',sans-serif;color:#efece3"><h2 style="font:600 20px monospace;letter-spacing:.2em;margin:0 0 24px">NAV TYPE OPTIONS - on the live nav</h2>${shots.map(([n, f], i) => `<div style="margin-bottom:26px"><div style="font:700 15px monospace;margin-bottom:8px"><span style="background:#ffd400;color:#000;padding:3px 10px;margin-right:12px">${i + 1}</span>${n}</div><img src="file://${f}" style="display:block;border:1px solid #232838;width:1440px"></div>`).join('')}</body>`;fs.writeFileSync(`${out}/nt.html`,html);await p.goto('file://'+out+'/nt.html');
await p.waitForTimeout(800); await p.screenshot({ path: `${out}/nav-type-options.png`, fullPage: true }); await b.close();
