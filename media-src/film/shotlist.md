# Shot list and beat grid

Music: `audio/track-a.mp3` (stable-audio-2.5). Measured grid **120.05 BPM**, beat 0.5 s, big taiko downbeat every **2.0 s** (measured low-band hits at 2.00, 4.00 … 14.0, then a breath 14–18, re-entry 18.00, roll 27.5–30.0, final hit 30.0). Every cut is on a beat; most on the 2 s downbeat. Source of truth: the `S` and `TYPE` tables in `tools/comp.py`.

| Time (s) | Shot (wide / tall) | Move | In | FX | Type beat |
|---|---|---|---|---|---|
| 0.0–2.0 | torii + moon (w-torii / t-torii) | pull 1.18→1.05 | fade from black | rain, lightning on 0.12 + 1.24 hits | – |
| 2.0–4.0 | ninja on roof (ninja_rain) | push 1.05→1.22 | flash | rain, shake | **LAUNCH** · 00 A LAUNCHPAD FOR STARTUPS, ON CHAIN |
| 4.0–6.0 | katana draw | pan across blade | whip | rain, glint sweep | LAUNCH |
| 6.0–8.0 | blade through rain (slash) | push | sword-slash wipe | sparks, shake | **FORM** · 01 FORM YOUR COMPANY ON CHAIN |
| 8.0–10.0 | ninja kneeling in dojo | pull | slash wipe | rain | FORM |
| 10.0–11.0 | blades clash (clash) | pull | flash | sparks, shake | **RAISE IN BSV + MNEE** · 02 |
| 11.0–12.0 | face-off at torii | push | slash wipe | rain | RAISE |
| 12.0–14.0 | neon alley | drift down | whip | rain | RAISE |
| 14.0–16.0 | blossom (breath) | slow push | crossfade | petals, soft rain | – |
| 16.0–18.0 | empty dojo | push 1.05→1.35, darkening riser | crossfade | soft rain, flicker | – |
| 18.0–20.0 | register book (ledger) | push | flash on re-entry | hanko seal stamp at 19.0 | **REGISTERED SHARES** · 03 YOUR REGISTER, KEPT IN bSHARES |
| 20.0–22.0 | hanko pressed | pull | slash wipe | shake | REGISTERED SHARES |
| 22.0–24.0 | bound box + two keys (lock) | pull | flash | shake | **AS TOKENS** · 04 HELD IN YOUR SHAREHOLDERS' OWN bWALLETX |
| 24.0–26.0 | torii path (site final-path) | push | slash wipe | rain | AS TOKENS |
| 26.0–28.0 | montage, 0.5 s each: ninja, clash, face-off, slash | hard zooms | whip / flash / whip / slash | sparks, rain | – |
| 28.0–30.0 | courtyard torii (site final-hero), blurring and darkening | pull | flash | torii mark rises with red glow | – |
| 30.0–32.0 | – | – | white flash on 30.0 hit | wordmark slams, BDOJOX.COM · A LAUNCHPAD FOR STARTUPS; fade to black 31.5–32 | **bDojoX** |

Mobile (720×1280) uses the tall stills where they exist (torii, ninja_rain, katana_draw, slash, kneel, faceoff, hanko, lock, blossom) and pans its own path across the wide ones (ledger, dojo, clash, alley, path, courtyard), with centred type.

## Review and fixes

Contact sheets were checked at each stage. The three worst defects, fixed:
1. **Finale clash:** the brand torii mark sat on top of the photographed torii and its white enso blobs. Fix: the background blurs and drops to about 30% from 28 s, and the glow layer is padded so it no longer shows a hard box.
2. **Mobile kanji overflow:** two-character ghost kanji ran off the 720 px frame and overlapped. Fix: kanji size scales by character count on the tall cut; long beat words get an extra 0.72 scale on mobile.
3. **Fake glyphs on the opening torii plaque:** flux drew pseudo-characters on the plaque. Fix: the plaque is painted as a blank dark plaque (a feathered mask, not a grey blur box).
Also after the repositioning: the beats changed from FORM/REGISTER/RAISE/LOCK to the launchpad story, and the shots were re-ordered so RAISE (the clash) comes before the register and hanko.

## Render

`tools/render.sh 1920 1080 8 work/master-169.mp4` and `tools/render.sh 720 1280 4 work/master-916.mp4` render in parallel frame chunks (the composition is seekable), then the encodes and posters are made with ffmpeg (commands in the commit message). Stills: `python3 tools/comp.py 1920 1080 x --still 6.1,18.8 /tmp/f`.
