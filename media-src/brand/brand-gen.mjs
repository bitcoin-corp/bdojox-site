// bDojoX brand family generator. Run: FONTS=<dir with chakra.ttf (Chakra Petch Bold 700 static) + shippori.ttf (Shippori Mincho 800 static)> OUT=<repo root> node media-src/brand/brand-gen.mjs
// Outputs filter-free, font-free SVGs (all text outlined) so they work as <img>, in the wallet theme PR, anywhere.
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const require = createRequire(process.env.TOOLS ? process.env.TOOLS + '/x.js' : import.meta.url); const opentype = require('opentype.js');
const FONTS = process.env.FONTS, OUT = process.env.OUT || process.cwd();
const load = n => { const b = fs.readFileSync(path.join(FONTS, n)); return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
const arch = load('chakra.ttf'), shi = load('shippori.ttf');
const f = n => (Math.round(n * 100) / 100).toString();
const C = { red: '#e0262f', redD: '#c8141c', ink: '#efece3', navy: '#07090f', blue: '#3a6bf0' };
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// ---------- ensō: filled brush polygon, roughness baked into the geometry (no filters)
function enso(cx = 100, cy = 100, R0 = 74) {
  seed = 5; const n = 260, out = [], inn = []; let j = 0, j2 = 0;
  for (let i = 0; i <= n; i++) {
    const t = i / n, th = (-52 + 338 * t) * Math.PI / 180;
    const w = t < .06 ? 3 + t / .06 * 20 : t < .72 ? 23 + Math.sin(t * 8) * 2.2 : 23 * Math.max(0, 1 - (t - .72) / .28) ** 1.15 + 2;
    j += (rnd() - .5) * .45; j *= .92; j2 = j2 * .6 + (rnd() - .5) * .8;
    const r = R0 - t * 11 + Math.sin(t * 5) * 1.8 + j;
    const dry = t > .78 ? (rnd() < .1 ? -(rnd() * 2) : 0) : 0; // dry-brush nicks near the tail
    const ro = r + w / 2 + j2 * .8, ri = r - w / 2 + (rnd() - .5) * .9 - dry;
    out.push([cx + ro * Math.cos(th), cy + ro * Math.sin(th)]); inn.push([cx + ri * Math.cos(th), cy + ri * Math.sin(th)]);
  }
  return 'M' + out.concat(inn.reverse()).map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z';
}
// ---------- hanko seal: rough rounded square + knocked-out 道 (mask)
function glyphPath(font, ch, size, cx, cy) { // centred outline
  const g = font.charToGlyph(ch), s = size / font.unitsPerEm, bb = g.getBoundingBox();
  const x = cx - (bb.x1 + bb.x2) / 2 * s, y = cy + (bb.y1 + bb.y2) / 2 * s; return g.getPath(x, y, size).toPathData(2);
}
function sealRect(x, y, w, h, r = 3.2) {
  seed = 21; const pts = [], step = 1.6, q = () => (rnd() - .5) * .9;
  const side = (x0, y0, x1, y1) => { const L = Math.hypot(x1 - x0, y1 - y0), k = Math.ceil(L / step); for (let i = 0; i < k; i++) { const t = i / k; pts.push([x0 + (x1 - x0) * t + q(), y0 + (y1 - y0) * t + q()]); } };
  side(x + r, y, x + w - r, y); side(x + w, y + r, x + w, y + h - r); side(x + w - r, y + h, x + r, y + h); side(x, y + h - r, x, y + r);
  // corners: chamfer-ish rounding
  return 'M' + pts.map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z';
}
let sid = 0;
function seal(x, y, s, rot = -5, fill = C.red, knock = true) { // s = side length
  const id = 'k' + (++sid), cx = x + s / 2, cy = y + s / 2, gp = glyphPath(shi, '道', s * .8, cx, cy + s * .02);
  return `<g transform="rotate(${rot} ${f(cx)} ${f(cy)})"><mask id="${id}" maskUnits="userSpaceOnUse" x="${f(x - 4)}" y="${f(y - 4)}" width="${f(s + 8)}" height="${f(s + 8)}"><rect x="${f(x - 4)}" y="${f(y - 4)}" width="${f(s + 8)}" height="${f(s + 8)}" fill="#fff"/><path d="${gp}" fill="#000"/></mask><path d="${sealRect(x, y, s, s)}" fill="${fill}" mask="url(#${id})"/></g>`;
}
// ---------- flat torii (reads as 3D: lit top face, shaded cylinders, brushed-blue nuki)
function torii(tx, ty, sc, o = {}) {
  const u = o.id || 't'; const mono = o.mono;
  const G = mono ? '' : `<defs><linearGradient id="${u}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff4a52"/><stop offset="1" stop-color="#c8141c"/></linearGradient><linearGradient id="${u}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fa0ff"/><stop offset="1" stop-color="#3a63e0"/></linearGradient></defs>`;
  const red = mono ? '#fff' : `url(#${u}r)`, blue = mono ? '#fff' : `url(#${u}b)`, navy = mono ? '#fff' : '#101a4a';
  const hi = mono ? '' : (d, c, op = 1) => `<path d="${d}" fill="${c}" fill-opacity="${op}"/>`; const H = mono ? () => '' : hi;
  let s = `<g transform="translate(${f(tx)} ${f(ty)}) scale(${sc})">${G}`;
  for (const [x0, x1] of [[18, 29], [71, 82]]) { // pillars
    s += mono ? `<path d="M${x0 + 1} 20H${x1 - 1}L${x1 - .6} 43.6H${x0 + .6}Z"/>`.replace('<path', `<path fill="#fff"`) + `<path fill="#fff" d="M${x0 + .4} 55.6H${x1 - .4}L${x1 + 1} 88H${x0 - 1}Z"/>` : `<path d="M${x0 + 1} 20H${x1 - 1}L${x1 + 1} 88H${x0 - 1}Z" fill="${red}"/>`;
    s += H(`M${x0 + 1} 20H${x0 + 3.6}L${x0 + 3} 88H${x0 - 1}Z`, '#ffb0b3', .55) + H(`M${x1 - 3} 20H${x1 - 1}L${x1 + 1} 88H${x1 - 2.6}Z`, '#6b070d', .55);
    s += `<path d="M${x0 - 3} 87H${x1 + 3}L${x1 + 4} 92H${x0 - 4}Z" fill="${mono ? '#fff' : '#0b0d16'}"/>`;
  }
  s += `<rect x="46.5" y="30" width="7" height="${mono ? 14 : 17}" fill="${blue}"/>`;
  s += `<rect x="8" y="46" width="84" height="7.5" fill="${blue}"/>` + H('M8 46H92V47.6H8Z', '#d6e2ff', .8) + H('M8 52.2H92V53.5H8Z', '#16307f', .6);
  s += mono ? `<path d="M7 21.6Q50 37.6 93 21.6V28Q50 44 7 28Z" fill="#fff"/>` : `<path d="M7 18Q50 34 93 18V27Q50 43 7 27Z" fill="${navy}"/>`;
  s += `<path d="M0 6Q50 28 100 6L96 20Q50 36 4 20Z" fill="${red}"/>`;
  s += H('M0 6Q50 28 100 6L100 2.2Q50 24 0 2.2Z', '#ff9a9e', .95) + H('M100 6L96 20L99 21.5L103.5 6.5Z', '#7a0a10', .9) + H('M0 6L4 20L1.2 21.5L-3.5 6.5Z', '#7a0a10', .5);
  if (mono) s += ''; return s + '</g>';
}
const ENSO = enso();
function mark({ mono = false, bg = null, id = 'm', rot = -5 } = {}) {
  const ink = mono ? '#fff' : C.ink;
  const carve = mono ? `<defs><mask id="cv${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200"><rect width="200" height="200" fill="#fff"/><rect x="121" y="119" width="62" height="62" rx="5" fill="#000" transform="rotate(${rot} 152 150)"/></mask></defs>` : '';
  return `${bg ? `<rect width="200" height="200" rx="${bg.r}" fill="${bg.fill}"/>` : ''}${carve}<path d="${ENSO}" fill="${ink}"${mono ? ` mask="url(#cv${id})"` : ''}/>${torii(57, 58, .86, { id, mono })}${seal(126, 124, 52, rot, mono ? '#fff' : C.red)}`;
}
const svg = (vb, body, extra = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${vb.split(' ')[2]}" height="${vb.split(' ')[3]}"${extra}>${body}</svg>\n`;
// ---------- wordmark: Chakra Petch Bold 700 caps, X split red/blue by a slash cut
function wordmark({ mono = false, cap = 80, x0 = 0, y0 = 0 } = {}) {
  const size = cap / (arch.tables.os2.sCapHeight / arch.unitsPerEm), tr = size * .075; let x = x0, body = '', cid = 'wx' + (++sid);
  const base = y0 + cap, ink = mono ? '#fff' : C.ink; let right = 0;
  for (const ch of 'BDOJOX') {
    const g = arch.charToGlyph(ch), adv = g.advanceWidth * size / arch.unitsPerEm, d = g.getPath(x, base, size).toPathData(2);
    if (ch === 'X') {
      if (mono) body += `<path d="${d}" fill="#fff"/>`;
      else { const m = x + adv / 2; body += `<defs><clipPath id="${cid}a"><path d="M${f(x - 4)} ${f(y0 - 4)}H${f(m + 6)}L${f(m - 6)} ${f(base + 4)}H${f(x - 4)}Z"/></clipPath><clipPath id="${cid}b"><path d="M${f(m + 9)} ${f(y0 - 4)}H${f(x + adv + 4)}V${f(base + 4)}H${f(m - 3)}Z"/></clipPath></defs><path d="${d}" fill="${C.red}" clip-path="url(#${cid}a)"/><path d="${d}" fill="${C.blue}" clip-path="url(#${cid}b)"/>`; }
    } else body += `<path d="${d}" fill="${ink}"/>`;
    right = x + adv; x += adv + tr;
  }
  return { body, w: right - x0, h: cap };
}
function lockup(mono) {
  const wm = wordmark({ mono, cap: 80, x0: 226, y0: 60 });
  return svg(`0 0 ${f(226 + wm.w + 4)} 200`, `${mark({ mono, id: mono ? 'lm' : 'l' })}${wm.body}`, ` role="img" aria-label="bDojoX"`);
}
const W = (n, s) => { fs.writeFileSync(path.join(OUT, n), s); console.log('wrote', n); };
W('logo.svg', svg('0 0 200 200', mark({ id: 'a' }), ' role="img" aria-label="bDojoX"'));
W('logo-mono.svg', svg('0 0 200 200', mark({ mono: true }), ' role="img" aria-label="bDojoX"'));
W('logo-hero.svg', svg('0 0 200 200', `<ellipse cx="100" cy="150" rx="46" ry="5" fill="#000" fill-opacity=".35"/>${mark({ id: 'h' })}`, ' role="img" aria-label="bDojoX"'));
W('logo-lockup.svg', lockup(false)); W('logo-lockup-mono.svg', lockup(true));
{ const wm = wordmark({ cap: 80, x0: 2, y0: 2 }), wmm = wordmark({ cap: 80, x0: 2, y0: 2, mono: true }); W('wordmark.svg', svg(`0 0 ${f(wm.w + 6)} 84`, wm.body, ' role="img" aria-label="bDojoX"')); W('wordmark-mono.svg', svg(`0 0 ${f(wm.w + 6)} 84`, wmm.body, ' role="img" aria-label="bDojoX"')); }
// ---------- tiles: combo candidates (B's red 道 seal tile + torii)
function tileSeal(id) { const gp = glyphPath(shi, '道', 156, 100, 104); return `<defs><mask id="${id}"><rect width="200" height="200" fill="#fff"/><path d="${gp}" fill="#000"/></mask></defs><rect x="12" y="12" width="176" height="176" rx="22" fill="${C.red}" mask="url(#${id})"/>`; }
const T = {
  // T1: B's tile as-is (red seal, 道 knocked out)
  T1: svg('0 0 200 200', `<rect width="200" height="200" fill="${C.navy}"/>` + tileSeal('s1')),
  // T2: seal tile with the torii above a smaller 道
  T2: (() => { const gp = glyphPath(shi, '道', 98, 100, 138); return svg('0 0 200 200', `<defs><mask id="s2"><rect width="200" height="200" fill="#fff"/><path d="${gp}" fill="#000"/><g transform="translate(46 30) scale(.8)"><path d="M0 6Q50 28 100 6L96 20Q50 36 4 20Z"/><rect x="8" y="42" width="84" height="8"/><rect x="18" y="20" width="11" height="60"/><rect x="71" y="20" width="11" height="60"/></g></mask></defs><rect width="200" height="200" fill="${C.navy}"/><rect x="12" y="12" width="176" height="176" rx="22" fill="${C.red}" mask="url(#s2)"/>`); })(),
  // T3: dark tile: ensō + flat torii + seal (the full mark)
  T3: svg('0 0 200 200', `<rect width="200" height="200" fill="${C.navy}"/><g transform="translate(14 14) scale(.86)">${mark({ id: 'z3' })}</g>`),
  // T4: red tile, ensō-white ring around the torii knocked out, seal-less (graphic)
  T4: (() => svg('0 0 200 200', `<defs><mask id="s4"><rect width="200" height="200" fill="#fff"/><path d="${enso(100, 98, 62).replace(/^/, '')}" fill="#000"/><g transform="translate(60 66) scale(.8)"><path d="M0 6Q50 28 100 6L96 20Q50 36 4 20Z"/><rect x="8" y="42" width="84" height="8"/><rect x="18" y="20" width="11" height="62"/><rect x="71" y="20" width="11" height="62"/></g></mask></defs><rect width="200" height="200" fill="${C.navy}"/><rect x="12" y="12" width="176" height="176" rx="22" fill="${C.red}" mask="url(#s4)"/>`))(),
};
// T5 (chosen): B's red tile with ensō + torii knocked out and a navy seal tile carrying a red 道
function tile5(full) {
  const gp = glyphPath(shi, '道', 46, 151, 153), body = 'M0 6Q50 28 100 6L96 20Q50 36 4 20Z';
  return svg('0 0 200 200', `${full ? `<rect width="200" height="200" fill="${C.red}"/>` : `<rect x="8" y="8" width="184" height="184" rx="26" fill="${C.red}"/>`}<g fill="${C.navy}"><path d="${enso(94, 92, 60)}"/><g transform="translate(54 58) scale(.8)"><path d="${body}"/><rect x="8" y="42" width="84" height="8"/><rect x="18" y="20" width="11" height="62"/><rect x="71" y="20" width="11" height="62"/></g></g><g transform="rotate(-5 151 151)"><path d="${sealRect(122, 122, 58, 58)}" fill="${C.navy}"/><path d="${gp}" fill="${C.red}"/></g>`, ' role="img" aria-label="bDojoX"');
}
fs.writeFileSync(path.join(OUT, 'favicon.svg'), tile5(false)); fs.writeFileSync(path.join(OUT, 'media-src/brand/tile5-full.svg'), tile5(true));
fs.mkdirSync(path.join(OUT, 'media-src/brand/tiles'), { recursive: true });
for (const [k, v] of Object.entries(T)) fs.writeFileSync(path.join(OUT, `media-src/brand/tiles/${k}.svg`), v);
// ink (dark) mono variants for light backgrounds
for (const n of ['logo-mono', 'logo-lockup-mono', 'wordmark-mono']) fs.writeFileSync(path.join(OUT, n.replace('mono', 'ink') + '.svg'), fs.readFileSync(path.join(OUT, n + '.svg'), 'utf8').replaceAll('<rect width="200" height="200" fill="#fff"/>', '@@M@@').replaceAll('#fff', C.navy).replaceAll('@@M@@', '<rect width="200" height="200" fill="#fff"/>'));
// reusable pieces for the composite hero render
fs.writeFileSync(path.join(OUT, 'media-src/brand/enso.svg'), svg('0 0 200 200', `<path d="${ENSO}" fill="${C.ink}"/>`));
fs.writeFileSync(path.join(OUT, 'media-src/brand/seal.svg'), svg('0 0 200 200', seal(126, 124, 52)));
