// Generates the bDojoX 3D logo family (pseudo-3D: swept extrusion faces + gradients).
// Run from repo root: node media-src/logo-gen.mjs
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const f = n => (Math.round(n * 100) / 100).toString();
const SK = Math.tan(14 * Math.PI / 180);          // forward slant
const D = [7.5, -5];                               // depth vector (back and up-right)
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
const L = [-0.38, -0.925]; // direction toward the light (screen coords, y down)

const PAL = {
  red:  { dark: '#4c070d', lite: '#ff8a8e', f0: '#ff4d55', f1: '#c8141c' },
  blue: { dark: '#10215a', lite: '#b4c8ff', f0: '#86a5ff', f1: '#3a6bf0' },
  mono: { dark: '#4a4a4f', lite: '#d9d9de', f0: '#ffffff', f1: '#f2f2f2' },
};

const bez = (p0, p1, p2, p3, n = 14) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n, u = 1 - t; return [u*u*u*p0[0]+3*u*u*t*p1[0]+3*u*t*t*p2[0]+t*t*t*p3[0], u*u*u*p0[1]+3*u*u*t*p1[1]+3*u*t*t*p2[1]+t*t*t*p3[1]]; });
const skew = ([x, y]) => [x - SK * (y - 62), y];
const kasa = [...bez([-2, 9], [12, 20], [52, 20], [66, 9]), ...bez([63, 19.5], [50, 28], [14, 28], [1, 19.5]).slice(0)];
const PIECES = [ // paint order: back to front
  { id: 'pl', pal: 'red',  pts: [[12, 24], [21.5, 24], [20.5, 61], [10.5, 61]] },
  { id: 'pr', pal: 'red',  pts: [[42.5, 24], [52, 24], [53.5, 61], [44, 61]] },
  { id: 'gk', pal: 'blue', pts: [[28.5, 23], [35.5, 23], [35.5, 32], [28.5, 32]] },
  { id: 'nk', pal: 'blue', pts: [[5, 31], [59, 31], [59, 37], [5, 37]] },
  { id: 'ks', pal: 'red',  pts: kasa, rim: true },
];
const area = p => p.reduce((s, [x, y], i) => { const [a, b] = p[(i + 1) % p.length]; return s + (x * b - a * y); }, 0);

function mark(id, { mono = false, depth = 1 } = {}) {
  const d = [D[0] * depth, D[1] * depth];
  let defs = '', body = '', xs = [], ys = [];
  for (const k of Object.keys(PAL)) {
    const p = PAL[mono ? 'mono' : k];
    defs += `<linearGradient id="${id}${k}" gradientUnits="userSpaceOnUse" x1="0" y1="10" x2="0" y2="62"><stop offset="0" stop-color="${p.f0}"/><stop offset="1" stop-color="${p.f1}"/></linearGradient>`;
  }
  for (const pc of PIECES) {
    let pts = pc.pts.map(skew);
    if (area(pts) < 0) pts = pts.reverse(); // y-down: positive area = clockwise on screen
    const pal = PAL[mono ? 'mono' : pc.pal];
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      const ex = b[0] - a[0], ey = b[1] - a[1], len = Math.hypot(ex, ey) || 1;
      const nx = ey / len, ny = -ex / len; // outward normal for clockwise-on-screen polygon
      if (nx * d[0] + ny * d[1] <= 0.001) continue; // only faces turned toward the extrusion are visible
      const lit = Math.min(1, Math.max(0, 0.5 + 0.5 * (nx * L[0] + ny * L[1])));
      const col = mix(pal.dark, pal.lite, Math.pow(lit, 1.15));
      body += `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}L${f(b[0] + d[0])} ${f(b[1] + d[1])}L${f(a[0] + d[0])} ${f(a[1] + d[1])}Z" fill="${col}" stroke="${col}" stroke-width=".35" stroke-linejoin="round"/>`;
    }
    body += `<path d="M${pts.map(p => f(p[0]) + ' ' + f(p[1])).join('L')}Z" fill="url(#${id}${mono ? 'mono' : pc.pal})"/>`;
    if (!mono && pc.rim) { // red rim light along the kasagi's top edge
      const top = pts.slice(0, 15);
      body += `<path d="M${top.map(p => f(p[0]) + ' ' + f(p[1] + 0.5)).join('L')}" fill="none" stroke="#ffc2c4" stroke-opacity=".75" stroke-width=".7" stroke-linecap="round"/>`;
    }
    for (const p of pts) { xs.push(p[0], p[0] + d[0]); ys.push(p[1], p[1] + d[1]); }
  }
  return { defs, body, bb: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] };
}

// ---- wordmark: katakana-style strokes, slanted, with stacked extrusion ----
const WM = `<path d="M9.5 2V46.5H29.5V20H9.5"/><path d="M47.5 6.5H64L76.5 16V37L64 46.5H47.5Z"/><path d="M91.5 23.5H109.5V43H91.5Z"/><path d="M129.5 20V53.5H115"/><path d="M147.5 23.5H165.5V43H147.5Z"/><path d="M181 4L209 46"/>`;
const WMX = `<path d="M209 4L181 46"/>`;
const DOT = `<rect x="126" y="3" width="8" height="8"/>`;
function wordmark(id, { mono = false, depth = 1 } = {}) {
  const N = 18, sx = 6.2 * depth / N, sy = -4.4 * depth / N;
  const defs = `<defs><g id="${id}a"><g fill="none">${WM}</g>${DOT}</g><g id="${id}x" fill="none">${WMX}</g></defs>`;
  let g = defs;
  const sw = 'stroke-width="5.5" stroke-linejoin="miter" stroke-miterlimit="4"';
  for (let i = N; i >= 1; i--) { // far to near
    const t = Math.pow((N - i) / (N - 1), 0.9), tr = `transform="translate(${f(sx * i)} ${f(sy * i)})"`;
    const col = mono ? mix('#4a4a4f', '#b9b9bf', t) : mix('#232a4a', '#8a93bd', t);
    const rc = mono ? col : mix('#4c070d', '#a3141c', t);
    g += `<use href="#${id}a" ${tr} fill="${col}" stroke="${col}" ${sw}/><use href="#${id}x" ${tr} stroke="${rc}" ${sw}/>`;
  }
  const front = mono ? '#ffffff' : '#f4f1e8', red = mono ? '#ffffff' : '#ff3640';
  g += `<use href="#${id}a" fill="${front}" stroke="${front}" ${sw}/><use href="#${id}x" stroke="${red}" ${sw}/>`;
  if (!mono) g += `<g fill="none" stroke="#ffffff" stroke-opacity=".55" stroke-width=".7"><path d="M47.5 3.7H64L76.5 13.2"/></g>`;
  const slant = `translate(${f(SK * 46.5)} 0) matrix(1 0 ${f(-SK)} 1 0 0)`;
  return { body: `<g transform="${slant}">${g}</g>`, bb: [3.5, -4.5 - 4.4 * depth, 212.5 + 6.2 * depth + SK * 46.5, 57] };
}

const svg = (vb, inner, extra = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.map(f).join(' ')}"${extra}>${inner}</svg>\n`;
const pad = (bb, p) => [bb[0] - p, bb[1] - p, bb[2] - bb[0] + 2 * p, bb[3] - bb[1] + 2 * p];
const write = (n, s) => { fs.writeFileSync(path.join(root, n), s); console.log(n, s.length + 'b'); };

function lockup(id, o = {}) {
  const m = mark(id, o), w = wordmark(id, o);
  const mw = m.bb[2] - m.bb[0], gap = 12;
  const mx = -m.bb[0], my = 0;               // mark base (y=61) sits on the letters' baseline (46.5)
  const wx = mx + mw + gap - w.bb[0] + 0;
  const mscale = 1, dy = 46.5 - 61;
  const inner = `<defs>${m.defs}</defs><g transform="translate(${f(mx)} ${f(dy)})">${m.body}</g><g transform="translate(${f(wx)} 0)">${w.body}</g>`;
  const x1 = wx + w.bb[2], y0 = Math.min(m.bb[1] + dy, w.bb[1]), y1 = w.bb[3];
  return { inner, bb: [0, y0, x1, y1], m, w, wx, mx, dy };
}

// 1) mark only
{ const m = mark('m'); write('logo.svg', svg(pad(m.bb, 1.5), `<defs>${m.defs}</defs>${m.body}`, ' role="img" aria-label="bDojoX"')); }
// 2) wordmark only
{ const w = wordmark('w'); write('wordmark.svg', svg(pad(w.bb, 1.5), w.body, ' role="img" aria-label="bDojoX"')); }
// 3) full lockup
{ const l = lockup('l'); write('logo-lockup.svg', svg(pad(l.bb, 2), l.inner, ' role="img" aria-label="bDojoX"')); }
// 4) mono white
{ const l = lockup('o', { mono: true }); write('logo-lockup-mono.svg', svg(pad(l.bb, 2), l.inner, ' role="img" aria-label="bDojoX"')); }
{ const m = mark('om', { mono: true }); write('logo-mono.svg', svg(pad(m.bb, 1.5), `<defs>${m.defs}</defs>${m.body}`, ' role="img" aria-label="bDojoX"')); }
// 5) hero / OG: stacked, deeper extrusion, glow and floor shadow
{
  const m = mark('h', { depth: 1.5 }), w = wordmark('hw', { depth: 1.4 });
  const mw = m.bb[2] - m.bb[0], ww = w.bb[2] - w.bb[0];
  const s = ww / mw * 0.5;           // mark is half the wordmark's width
  const mxp = (ww - mw * s) / 2 - m.bb[0] * s, myp = -m.bb[3] * s;
  const wy = 18 - w.bb[1];
  const inner = `<defs>${m.defs}<filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9"/></filter><radialGradient id="floor"><stop offset="0" stop-color="#e0262f" stop-opacity=".55"/><stop offset="1" stop-color="#e0262f" stop-opacity="0"/></radialGradient></defs>
<ellipse cx="${f(ww / 2 + 8)}" cy="${f(myp + m.bb[3] * s + 4)}" rx="${f(mw * s * 0.8)}" ry="9" fill="url(#floor)"/>
<ellipse cx="${f(ww / 2 + 6)}" cy="${f(myp + (m.bb[1] + m.bb[3]) / 2 * s)}" rx="${f(mw * s * 1.1)}" ry="${f((m.bb[3]-m.bb[1]) * s * 0.9)}" fill="url(#floor)" opacity=".55"/>
<g transform="translate(${f(mxp)} ${f(myp)}) scale(${f(s)})">${m.body}</g>
<g transform="translate(${f(-w.bb[0])} ${f(wy - 18)})">${w.body}</g>`;
  const bb = [0, myp + m.bb[1] * s, ww, wy - 18 + w.bb[3]];
  write('logo-hero.svg', svg(pad(bb, 14), inner, ' role="img" aria-label="bDojoX"'));
}
// 6) favicon + touch icon (mark on navy)
{
  const m = mark('f', { depth: 1.1 });
  const w = m.bb[2] - m.bb[0], h = m.bb[3] - m.bb[1], s = 44 / Math.max(w, h);
  const tx = (64 - w * s) / 2 - m.bb[0] * s, ty = (64 - h * s) / 2 - m.bb[1] * s + 1;
  const g = `<defs>${m.defs}</defs><g transform="translate(${f(tx)} ${f(ty)}) scale(${f(s)})">${m.body}</g>`;
  write('favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#07090f"/>${g}</svg>\n`);
  write('media-src/apple-icon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="180" height="180"><rect width="64" height="64" fill="#07090f"/>${g}</svg>\n`);
}
