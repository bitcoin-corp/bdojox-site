#!/usr/bin/env python3
# bDojoX hero film compositor. Deterministic: frame n depends only on n (seekable: --frames a:b).
# usage: comp.py W H out.mp4 [--frames a:b] [--still t1,t2,... outprefix]
# Stills + motion only (Ken Burns, parallax rain, slash wipes, sparks, petals, leaks, kinetic type).
import sys, os, math, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
IMG = os.path.join(ROOT, 'img'); SITE_IMG = os.path.join(os.path.dirname(ROOT), 'img')
W, H = int(sys.argv[1]), int(sys.argv[2]); OUT = sys.argv[3]
V = H > W; U = min(W, H) / 1080.0; FPS = 30; DUR = 32.0; NF = int(DUR * FPS); BEAT = 0.5  # 120 BPM grid, downbeat every 2 s
RED = (224, 38, 47); BLUE = (58, 107, 240); WHITE = (255, 255, 255); NAVY = (7, 9, 15)
BIG = os.path.join(ROOT, 'fonts', 'BigShouldersDisplay[wght].ttf')
PLEX = os.path.join(ROOT, 'fonts', 'IBMPlexSansCondensed-SemiBold.ttf')
KANA = '/System/Library/Fonts/ヒラギノ角ゴシック W8.ttc'

def big(size):
    f = ImageFont.truetype(BIG, int(size))
    try: f.set_variation_by_axes([900])
    except Exception: pass
    return f
def plex(size): return ImageFont.truetype(PLEX, int(size))
def kana(size): return ImageFont.truetype(KANA, int(size))
def ease(t): t = min(max(t, 0.0), 1.0); return 1 - (1 - t) ** 3
def ease_io(t): t = min(max(t, 0.0), 1.0); return t * t * (3 - 2 * t)

# ---------------- shot list (mirrors shotlist.md) ----------------
# (t0, t1, wide_img, tall_img|None, move, transition-in, fx)
# move: (z0, z1, cx0, cy0, cx1, cy1) normalised centre in source; tall cut pans wide images with its own move if given as 8-tuple.
S = [
 (0.0, 2.0, 'w-torii', 't-torii', (1.18, 1.05, .5, .45, .5, .5), 'fadein', ['rain', 'lightning']),
 (2.0, 4.0, 'w-ninja_rain', 't-ninja_rain', (1.05, 1.22, .62, .45, .66, .42), 'flash', ['rain', 'shake']),
 (4.0, 6.0, 'w-katana_draw', 't-katana_draw', (1.25, 1.12, .40, .55, .62, .45), 'whip', ['rain', 'glint']),
 (6.0, 8.0, 'w-slash', 't-slash', (1.12, 1.28, .5, .5, .55, .45), 'slash', ['rain', 'shake', 'sparks']),
 (8.0, 10.0, 'w-kneel', 't-kneel', (1.25, 1.08, .5, .55, .5, .52), 'slash', ['rain']),
 (10.0, 11.0, 'w-clash', None, (1.25, 1.10, .5, .5, .5, .5, .45, .55), 'flash', ['shake', 'sparks']),
 (11.0, 12.0, 'w-faceoff', 't-faceoff', (1.05, 1.18, .5, .5, .5, .55), 'slash', ['rain']),
 (12.0, 14.0, 'w-alley', None, (1.30, 1.12, .5, .70, .5, .62, .5, .62), 'whip', ['rain']),
 (14.0, 16.0, 'w-blossom', 't-blossom', (1.08, 1.18, .45, .5, .55, .5), 'fade', ['petals', 'rain_soft']),
 (16.0, 18.0, 'w-dojo', None, (1.05, 1.35, .5, .55, .5, .5, .5, .5), 'fade', ['rain_soft', 'riser']),
 (18.0, 20.0, 'w-ledger', None, (1.10, 1.30, .45, .55, .5, .5, .30, .70), 'flash', ['stamp']),
 (20.0, 22.0, 'w-hanko', 't-hanko', (1.30, 1.10, .55, .45, .5, .5), 'slash', ['shake']),
 (22.0, 24.0, 'w-lock', 't-lock', (1.25, 1.08, .5, .5, .5, .5), 'flash', ['shake', 'keys']),
 (24.0, 26.0, 'site:final-path', None, (1.05, 1.30, .5, .5, .5, .5, .5, .5), 'slash', ['rain']),
 (26.0, 26.5, 'w-ninja_rain', 't-ninja_rain', (1.45, 1.55, .70, .40, .70, .40), 'whip', ['rain']),
 (26.5, 27.0, 'w-clash', None, (1.4, 1.6, .5, .5, .5, .5, .5, .5), 'flash', ['sparks']),
 (27.0, 27.5, 'w-faceoff', 't-faceoff', (1.5, 1.6, .5, .55, .5, .55), 'whip', ['rain']),
 (27.5, 28.0, 'w-slash', 't-slash', (1.5, 1.7, .5, .5, .5, .5), 'slash', ['rain']),
 (28.0, 32.0, 'site:final-hero', None, (1.25, 1.02, .58, .5, .62, .5, .66, .5), 'flash', ['rain', 'finale']),
]
# type beats: (t0, t1, word, kanji, label)  -- capitals per owner
TYPE = [
 (2.0, 6.0, 'LAUNCH', '発進', '00 · A LAUNCHPAD FOR STARTUPS, ON CHAIN'),
 (6.0, 10.0, 'FORM', '形', '01 · FORM YOUR COMPANY ON CHAIN'),
 (10.0, 14.0, 'RAISE IN BSV + MNEE', '資金', '02 · RAISE CAPITAL IN BSV AND MNEE'),
 (18.0, 22.0, 'REGISTERED SHARES', '株', '03 · YOUR REGISTER, KEPT IN bSHARES'),
 (22.0, 26.0, 'AS TOKENS', '株', '04 · HELD IN YOUR SHAREHOLDERS’ OWN bWALLETX'),
]

# ---------------- assets ----------------
_cache = {}
def src(name):
    if name in _cache: return _cache[name]
    p = os.path.join(SITE_IMG, name[5:] + '.webp') if name.startswith('site:') else os.path.join(IMG, name + '.png')
    im = Image.open(p).convert('RGB')
    if name == 'w-torii':  # defect fix: hide the generated plaque glyphs
        bx = (0.465, 0.24, 0.535, 0.36) if name == 'w-torii' else (0.40, 0.33, 0.60, 0.40)
        b = tuple(int(v * (im.width if i % 2 == 0 else im.height)) for i, v in enumerate(bx))
        m = Image.new('L', im.size, 0); ImageDraw.Draw(m).rectangle(b, fill=255); m = m.filter(ImageFilter.GaussianBlur(4))
        im = Image.composite(Image.new('RGB', im.size, (52, 12, 22)), im, m)  # blank dark plaque
    # cover-fit at 1.75x frame so zooms up to ~1.7 stay crisp-ish; unsharp to hide the upscale
    s = max(W / im.width, H / im.height) * 1.75
    im = im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS).filter(ImageFilter.UnsharpMask(2, 60, 2))
    _cache[name] = im; return im

def camera(im, z, cx, cy, dx=0, dy=0):
    # crop of size (W,H)*base/z around (cx,cy) of source
    base = min(im.width / W, im.height / H)  # source px per frame px at z=1 (cover)
    cw, ch = W * base / z, H * base / z
    x0 = min(max(cx * im.width - cw / 2, 0), im.width - cw) + dx * base / z
    y0 = min(max(cy * im.height - ch / 2, 0), im.height - ch) + dy * base / z
    return np.asarray(im.transform((W, H), Image.EXTENT, (x0, y0, x0 + cw, y0 + ch), Image.BILINEAR), np.float32)

def shot_frame(si, t):
    t0, t1, wn, tn, mv, _, fx = S[si]; p = (t - t0) / (t1 - t0)
    if V and tn: im = src(tn); z0, z1, a, b, c, d = mv[:6]
    elif V: im = src(wn); z0, z1, a, b = mv[:4]; c, d = (mv[6], mv[7]) if len(mv) > 6 else mv[4:6]
    else: im = src(wn); z0, z1, a, b, c, d = mv[:6]
    q = ease_io(p) * .6 + p * .4
    z = z0 + (z1 - z0) * q; cx = a + (c - a) * q; cy = b + (d - b) * q
    dx = dy = 0
    if 'shake' in fx:
        k = math.exp(-(t - t0) * 9); r = np.random.default_rng(int(t * FPS))
        dx, dy = r.normal(0, 18 * U * k), r.normal(0, 12 * U * k)
    f = camera(im, z, cx, cy, dx, dy)
    return f

# rain: two parallax layers of streaks, tiled vertically, deterministic
def rain_layer(seed, n, ln, wd, alpha):
    r = np.random.default_rng(seed); im = Image.new('L', (W, H * 2), 0); d = ImageDraw.Draw(im)
    for _ in range(n):
        x, y = r.uniform(0, W), r.uniform(0, H * 2); l = r.uniform(.6, 1.2) * ln
        d.line([(x, y), (x - l * .12, y + l)], fill=int(alpha * r.uniform(.4, 1)), width=wd)
    return np.asarray(im.filter(ImageFilter.GaussianBlur(.6)), np.float32) / 255
RAIN = [rain_layer(1, int(900 * (W * H) / (1920 * 1080)), 46 * U, max(1, int(1.2 * U)), 110),
        rain_layer(2, int(260 * (W * H) / (1920 * 1080)), 120 * U, max(2, int(2.4 * U)), 150)]
def rain(t, amt):
    out = np.zeros((H, W), np.float32)
    for k, (L, spd) in enumerate(zip(RAIN, (1900, 3200))):
        off = int(t * spd * U) % H
        out += L[H - off:2 * H - off] * (0.7 if k == 0 else 1.0)
    return out[..., None] * amt

y_, x_ = np.ogrid[:H, :W]
VIG = np.clip(1.12 - .55 * (((x_ - W / 2) / (W / 2)) ** 2 + ((y_ - H / 2) / (H / 2)) ** 2), .35, 1).astype(np.float32)[..., None]
def leak(col, cx, cy, rad):
    return np.exp(-(((x_ - cx) ** 2 + (y_ - cy) ** 2) / rad ** 2)).astype(np.float32)[..., None] * np.array(col, np.float32)
LEAK_R = leak(RED, -0.1 * W, 0.8 * H, 0.55 * max(W, H)); LEAK_B = leak(BLUE, 1.1 * W, 0.2 * H, 0.6 * max(W, H))
GRAIN = [np.random.default_rng(100 + k).normal(0, 7, (H // 2, W // 2)).astype(np.float32) for k in range(6)]
GRAIN = [np.asarray(Image.fromarray(g).resize((W, H), Image.NEAREST), np.float32)[..., None] for g in GRAIN]

def over(base, ov, x=0, y=0, a=1.0):
    o = np.asarray(ov, np.float32); h, w = o.shape[:2]
    x0, y0 = max(0, x), max(0, y); x1, y1 = min(W, x + w), min(H, y + h)
    if x1 <= x0 or y1 <= y0: return
    s = o[y0 - y:y1 - y, x0 - x:x1 - x]; al = s[..., 3:4] / 255 * a
    base[y0:y1, x0:x1] = base[y0:y1, x0:x1] * (1 - al) + s[..., :3] * al

def text(txt, font, col, track=0):
    b = font.getbbox(txt); w = int(b[2] + track * len(txt) + 8); h = int(b[3] + 8)
    im = Image.new('RGBA', (w, h)); d = ImageDraw.Draw(im); x = 4
    for ch in txt:
        d.text((x, 4), ch, font=font, fill=col + (255,)); x += font.getlength(ch) + track
    return im.crop(im.getbbox() or (0, 0, 1, 1))

LOGO = Image.open(os.path.join(IMG, 'logo.png')).convert('RGBA')
WORD = Image.open(os.path.join(IMG, 'wordmark-new.png')).convert('RGBA')  # end card: Chakra Petch wordmark (brand-gen.mjs)
MARK = Image.open(os.path.join(IMG, 'mark-new.png')).convert('RGBA')  # end card: 3D torii + brush ensō + 道 seal (brand/mark-3d.png)
def recolor(im, col):
    a = np.asarray(im).copy(); a[..., :3] = col; return Image.fromarray(a)

def make_stamp(S_):
    im = Image.new('RGBA', (S_, S_)); d = ImageDraw.Draw(im); c = S_ / 2; r = np.random.default_rng(5)
    d.ellipse([S_ * .04, S_ * .04, S_ * .96, S_ * .96], outline=RED + (255,), width=int(S_ * .07))
    lg = recolor(LOGO, RED); lw = int(S_ * .56); lg = lg.resize((lw, int(lw * LOGO.height / LOGO.width)), Image.LANCZOS)
    im.alpha_composite(lg, (int(c - lg.width / 2), int(c - lg.height / 2)))
    a = np.asarray(im).astype(np.float32); noise = r.uniform(0, 1, a.shape[:2])
    a[..., 3] *= np.where(noise < .12, .35, 1.0)  # ink texture
    return Image.fromarray(a.astype(np.uint8)).filter(ImageFilter.GaussianBlur(.7))
STAMP = make_stamp(int(380 * U))

def sparks(f, t, t0, ox, oy, seed, n=140):
    tt = t - t0
    if tt < 0 or tt > 1.4: return
    r = np.random.default_rng(seed); ang = r.uniform(0, 2 * np.pi, n); spd = r.uniform(400, 1700, n) * U
    life = r.uniform(.3, 1.2, n); ov = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(ov)
    for k in range(n):
        if tt > life[k]: continue
        g = 900 * U
        x = ox + math.cos(ang[k]) * spd[k] * tt; y = oy + math.sin(ang[k]) * spd[k] * tt + .5 * g * tt * tt
        vx = math.cos(ang[k]) * spd[k]; vy = math.sin(ang[k]) * spd[k] + g * tt
        a = int(255 * (1 - tt / life[k]))
        d.line([(x, y), (x - vx * .025, y - vy * .025)], fill=(255, 200 + int(55 * (1 - tt / life[k])), 120, a), width=max(2, int(3 * U)))
    over(f, ov.filter(ImageFilter.GaussianBlur(.8)))
    f += 0  # noqa

PET = np.random.default_rng(9)
PETALS = [(PET.uniform(0, 1), PET.uniform(-.2, 1), PET.uniform(.04, .12), PET.uniform(10, 26), PET.uniform(0, 6.28)) for _ in range(40)]
def petals(f, t):
    ov = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(ov)
    for (x0, y0, sp, sz, ph) in PETALS:
        y = ((y0 + t * sp * 2.2) % 1.25 - .1) * H; x = x0 * W + math.sin(t * 1.3 + ph) * 40 * U
        s = sz * U; sq = abs(math.sin(t * 2 + ph)) * .7 + .3
        d.ellipse([x - s, y - s * sq * .6, x + s, y + s * sq * .6], fill=(255, 140, 170, 210))
    over(f, ov.filter(ImageFilter.GaussianBlur(1.2)))

def hud(f, t):
    ov = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(ov); m = int(34 * U); L = int(36 * U); c = (255, 255, 255, 150)
    for (x, y, sx, sy) in [(m, m, 1, 1), (W - m, m, -1, 1), (m, H - m, 1, -1), (W - m, H - m, -1, -1)]:
        d.line([(x, y), (x + sx * L, y)], fill=c, width=2); d.line([(x, y), (x, y + sy * L)], fill=c, width=2)
    fs = plex(16 * U)
    d.text((m + 14 * U, m + 10 * U), 'bDOJOX  //  道場', font=fs, fill=(255, 255, 255, 210))
    d.text((W - m - 14 * U, m + 10 * U), f'REC  {t:05.2f}', font=fs, fill=(255, 255, 255, 170), anchor='ra')
    if int(t * 2) % 2 == 0:
        bb = d.textbbox((W - m - 14 * U, m + 10 * U), f'REC  {t:05.2f}', font=fs, anchor='ra')
        d.ellipse([bb[0] - 16 * U, bb[1] + 3 * U, bb[0] - 6 * U, bb[1] + 13 * U], fill=RED + (255,))
    beats = ['LAUNCH', 'FORM', 'RAISE', 'SHARES']
    cur = min(3, sum(1 for b in TYPE if t >= b[0]) - 1)
    x = m + 14 * U; y = H - m - 28 * U
    for k, b in enumerate(beats):
        col = (255, 255, 255, 235) if k == cur else (255, 255, 255, 90)
        d.text((x, y), b, font=fs, fill=col)
        if k == cur: d.line([(x, y + 22 * U), (x + d.textlength(b, font=fs), y + 22 * U)], fill=RED + (255,), width=max(2, int(3 * U)))
        x += d.textlength(b, font=fs) + 24 * U
    over(f, ov)

def type_beat(f, t):
    for (t0, t1, word, kj, label) in TYPE:
        tt = t - t0
        if tt < 0 or t >= t1: continue
        out = ease(max(0, (t - (t1 - .25)) / .25))  # exit
        # ghost kanji
        kim = text(kj, kana((560 if not V else 300 / max(1, len(kj))) * U), WHITE)
        kx = W - kim.width - int(90 * U) if not V else (W - kim.width) // 2
        ky = (H - kim.height) // 2 if not V else int(H * .16)
        over(f, kim, kx + int(40 * U * (1 - ease(tt * 1.5))), ky, .10 * ease(tt * 2) * (1 - out))
        size = (230 if not V else 150) * U
        if len(word) > 8: size *= (.78 if not V else .62)
        if len(word) > 14 and V: size *= .72
        s = 1 + .35 * (1 - ease(tt * 5))  # slam
        wim = text(word, big(size * s), WHITE, track=2 * U)
        x = int(110 * U) if not V else (W - wim.width) // 2
        y = int(H * .60 - wim.height / 2) if not V else int(H * .62)
        # red shadow offset on slam
        sh = recolor(wim, RED); off = int((14 + 30 * (1 - ease(tt * 4))) * U)
        over(f, sh, x + off, y + off // 2, .9 * (1 - out))
        over(f, wim, x - int(60 * U * out), y, 1 - out)
        # label + bar
        lim = text(label, plex(26 * U if not V else 24 * U), WHITE, track=3 * U)
        lp = ease((tt - .15) * 4)
        ly = y - lim.height - int(26 * U); lx = x if not V else (W - lim.width) // 2
        over(f, lim, lx, ly + int(10 * U * (1 - lp)), lp * (1 - out))
        bw = int((wim.width if not V else wim.width) * ease((tt - .1) * 3))
        f[y + wim.height + int(18 * U):y + wim.height + int(26 * U), x:x + bw] = np.array(RED, np.float32)
        
def finale(f, t):
    tl = t - 28.0
    if tl < 0: return
    # torii mark rises 28.0-30.0, wordmark slams at 30.0
    lh = int((390 if not V else 430) * U); lg = MARK.resize((lh, lh), Image.LANCZOS)
    p = ease(tl / 1.6)
    cx = W // 2; cy = int(H * (.38 if not V else .37))
    pad = int(120 * U); g = Image.new('RGBA', (lg.width + 2 * pad, lg.height + 2 * pad)); g.alpha_composite(recolor(lg, RED), (pad, pad))
    glow = g.filter(ImageFilter.GaussianBlur(40 * U))
    over(f, glow, cx - lg.width // 2 - pad, cy - lg.height // 2 - pad + int(60 * U * (1 - p)), .8 * p)
    over(f, lg, cx - lg.width // 2, cy - lg.height // 2 + int(60 * U * (1 - p)), p)
    if t >= 30.0:
        tw = t - 30.0; s = 1 + .3 * (1 - ease(tw * 5))
        ww = int((560 if not V else 600) * U * s); wm = WORD.resize((ww, int(ww * WORD.height / WORD.width)), Image.LANCZOS)
        over(f, wm, cx - wm.width // 2, cy + lh // 2 + int(40 * U), 1)
        url = text('BDOJOX.COM  ·  A LAUNCHPAD FOR STARTUPS', plex(26 * U), WHITE, track=3 * U)
        over(f, url, cx - url.width // 2, cy + lh // 2 + int(60 * U) + wm.height, ease((tw - .2) * 3))

def lightning(t):
    # flashes near the 0.10 and 1.24 hits
    v = 0
    for h in (0.12, 1.24, 1.34):
        dt = t - h
        if 0 <= dt < .12: v = max(v, 1 - dt / .12)
    return v

# ---------------- render one frame ----------------
_prev = {}
def frame(n):
    t = n / FPS
    si = max(i for i, s in enumerate(S) if s[0] <= t + 1e-6)
    t0, t1, wn, tn, mv, tr, fx = S[si]
    f = shot_frame(si, t); tt = t - t0
    # grade: contrast, navy lift, slight teal-red split
    f = (f - 120) * 1.12 + 118
    f = f * .94 + np.array(NAVY, np.float32) * .6
    # transitions in
    if si > 0 and tt < .2:
        prev = shot_frame(si - 1, t0 - 1e-3)
        prev = (prev - 120) * 1.12 + 118
        p = tt / .2
        if tr == 'slash':
            # diagonal blade wipe with hot edge
            d = (x_ / W) * (1 if not V else .6) + (y_ / H) * (.6 if not V else 1)
            edge = p * 2.2 - .3
            m = (d < edge).astype(np.float32)[..., None]
            f = f * m + prev * (1 - m)
            band = np.exp(-((d - edge) * (40)) ** 2).astype(np.float32)[..., None]
            f = f + band * np.array([255, 255, 255], np.float32) * 1.2 + band * np.array(RED, np.float32) * .5
        elif tr == 'whip':
            off = int(W * .4 * (1 - ease(p))) * (1 if si % 2 else -1)
            f = np.roll(f, off, axis=1)
            k = int(50 * U * (1 - p)) + 1
            if k > 2: f = np.asarray(Image.fromarray(np.clip(f, 0, 255).astype(np.uint8)).filter(ImageFilter.BoxBlur(k)), np.float32)
        elif tr == 'fade':
            f = f * p + prev * (1 - p)
    if tr == 'fadein': f *= ease(tt / 1.0)
    if tr == 'flash' and tt < .15: f = f + (1 - tt / .15) * 200
    if 'lightning' in fx: f = f + lightning(t) * np.array([150, 170, 255], np.float32)
    if 'glint' in fx:
        # light sweep along blade
        gx = (tt / 2.0) * 1.6 - .3
        band = np.exp(-(((x_ / W) - gx - (y_ / H) * .3) * 12) ** 2).astype(np.float32)[..., None]
        f = f + band * 70
    if 'riser' in fx: f = f * (1 - .45 * ease(tt / 2.0)) + (np.random.default_rng(n).uniform() > .8 and tt > 1.4) * 40
    if 'stamp' in fx and tt >= 1.0:
        ts = tt - 1.0; p = ease(ts * 6); sc = 1.8 - .8 * p
        st = STAMP.rotate(-12 + 4 * p, resample=Image.BICUBIC, expand=True)
        st = st.resize((max(2, int(st.width * sc)), max(2, int(st.height * sc))), Image.BICUBIC)
        sx, sy = (.74, .42) if not V else (.5, .30)
        over(f, st, int(sx * W - st.width / 2), int(sy * H - st.height / 2), min(1, ts * 8))
        if ts < .1: f = f + 60
    if 'sparks' in fx:
        ox, oy = (W * .5, H * .45)
        sparks(f, t, t0, ox, oy, si * 13)
    if 'petals' in fx: petals(f, t)
    if 'keys' in fx:
        pass
    # rain
    amt = 1.0 if 'rain' in fx else (.45 if 'rain_soft' in fx else 0)
    if amt: f = f + rain(t, amt) * np.array([170, 190, 255], np.float32)
    # leaks breathe with the bar
    bar = (t % 2.0) / 2.0
    f = f + LEAK_R * (.18 + .12 * math.sin(t * 1.7)) + LEAK_B * (.16 + .1 * math.cos(t * 1.3))
    # beat pulse
    f = f * (1 + .07 * math.exp(-((t % BEAT) / BEAT) * 6))
    f = f * VIG
    type_beat(f, t)
    if 'finale' in fx:
        k = ease((t - 28.0) / 1.5)  # defect fix: soften + darken photo so the mark doesn't fight the photographed torii
        if k > 0: f = f * (1 - k) + np.asarray(Image.fromarray(np.clip(f, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(28 * U)), np.float32) * k * .32
        finale(f, t)
        if 30.0 <= t < 30.12: f = f + (1 - (t - 30) / .12) * 255
    hud(f, t)
    f = f + GRAIN[n % 6]
    # loop: fade to black in the last 0.5 s (film opens from black)
    if t > DUR - .5: f = f * max(0, (DUR - t) / .5)
    return np.clip(f, 0, 255).astype(np.uint8)

if __name__ == '__main__':
    a = sys.argv[4:]
    if a and a[0] == '--still':
        for ts in a[1].split(','):
            Image.fromarray(frame(int(round(float(ts) * FPS)))).save(f'{a[2]}-{ts}.jpg', quality=88)
        sys.exit()
    fa, fb = 0, NF
    if a and a[0] == '--frames': fa, fb = map(int, a[1].split(':'))
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                            '-c:v', 'libx264', '-preset', 'medium', '-crf', '12', '-pix_fmt', 'yuv420p', OUT], stdin=subprocess.PIPE)
    for n in range(fa, fb):
        enc.stdin.write(frame(n).tobytes())
        if n % 60 == 0: print(f'{W}x{H} frame {n}/{fb}', file=sys.stderr, flush=True)
    enc.stdin.close(); enc.wait()
