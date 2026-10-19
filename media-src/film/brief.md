# bDojoX hero film: brief

**Ask (owner):** the hero image is liked, but make it a LOT more lively, like the bMintX hero (bmintx.com/media/hero-mashup-sound.mp4), only with ninjas, swords and music.

**Story (owner repositioning, 19 Oct):** "A launchpad for startups, on chain." Beats in capitals:
LAUNCH → FORM → RAISE IN BSV + MNEE → REGISTERED SHARES → AS TOKENS → bDojoX.

**Constraints:** no video-model spend. Built from still images (Replicate flux) plus motion in code. Original music from a Replicate music model. No real people's faces; no text in generated images (all type is in the composition). Hero plays muted and loops; /watch has the sound-on version; reduced motion shows the poster.

**Deliverables (site `media/`):**
- `hero-dojo.mp4` / `hero-dojo.webm`: 16:9, 1920×1080, 32 s, muted
- `hero-dojo-mobile.mp4` / `.webm`: 9:16, 720×1280, composed separately (tall stills, re-laid-out type)
- `hero-dojo-sound.mp4`: 16:9 with music, for `/watch`
- posters: `hero-dojo-poster.webp`, `hero-dojo-mobile-poster.webp`, `watch-poster.jpg`

**Approach (same as bMintX `media-src/tools/comp.py`):** a Python/numpy/PIL compositor that renders every frame as a pure function of the frame number (seekable, deterministic), piped to ffmpeg. Remotion wasn't used because the bMintX pipeline already covers this and needs no Node project.
