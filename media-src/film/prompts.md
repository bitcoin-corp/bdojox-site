# bDojoX hero film: generation prompts

All images: Replicate. Drafts `black-forest-labs/flux-schnell` (seed 3), finals `black-forest-labs/flux-1.1-pro` (seed 11, safety 2). Wide = 16:9 for the desktop cut, tall = 9:16 for the mobile cut. Every prompt ends with the shared style suffix. Reused from the site set (media-src/img): final-hero, final-path, final-doors, final-enso.

**Style suffix:** no text, no letters, no writing, no logos, no visible faces, cinematic still from a high-budget Japanese cyberpunk film, deep navy night palette with vermilion red (#e0262f) and cobalt blue (#3a6bf0) light, white highlights, anamorphic, fine film grain, sharp

## Images

- **ninja_rain** (wide + tall): A masked ninja in black, face fully covered by a hood and cloth mask, crouched on the edge of a tiled temple roof at night in heavy rain, katana on the back, red neon glow from below and cobalt blue rim light, city lights bokeh far below, figure on the right third, dark space left
- **katana_draw** (wide + tall): Extreme close-up of gloved hands drawing a katana from a black lacquered scabbard, three inches of polished steel revealed catching a sharp line of blue light, red silk handle wrap, rain droplets, dark background
- **slash** (wide + tall): A katana blade frozen mid-slash through falling rain, raindrops cut and scattered into glittering spray, a streak of white-blue light along the edge, red neon behind, motion, dramatic dark background
- **clash** (wide): Two katana blades clashing, bright orange-white sparks bursting from the point of contact, extreme close-up, rain, red and blue back light, black background
- **faceoff** (wide + tall, schnell draft first): Two masked ninjas in silhouette facing each other with drawn katanas on a wet stone courtyard at night, a red torii gate between them in the distance, rain, puddle reflections of red and blue neon, wide shot, symmetrical
- **kneel** (wide + tall): A masked ninja kneeling in seiza on the polished wooden floor of an empty dojo, a sheathed katana laid horizontally in front, seen from behind, tall paper shoji screens glowing red and blue, rain shadows, quiet and monumental
- **dojo** (wide): Interior of a large empty traditional dojo at night, polished wooden floor reflecting light, paper shoji screens glowing cobalt blue, one red lantern, rain visible through an open door, wide symmetrical
- **alley** (wide): A narrow rain-soaked alley in a Japanese city at night, puddles reflecting vermilion red and cobalt blue neon, steam, a small red torii shrine at the far end, empty, low camera near the wet ground
- **blossom** (wide + tall): Cherry blossom petals falling through darkness at night, a few petals lit red and blue by neon, shallow depth of field, rain streaks, deep navy background, abstract and calm
- **ledger** (wide, schnell draft first): An old open bound register book on a dark wooden desk, pages ruled with fine red and blue lines, rows of small abstract ink brush marks that are not readable, a sumi brush and inkstone beside it, candle and blue window light, overhead three-quarter view
- **hanko** (wide + tall, schnell draft first): Close-up of a hand pressing a red cinnabar hanko seal stamp onto thick cream paper in an open ledger, a fresh round vermilion ink impression with no characters, red ink paste dish beside it, dramatic low light, blue rim light
- **lock** (wide + tall): A black lacquered box bound with a thick red silk cord tied in a tight knot, two identical brass keys resting on the lid, two crossed katanas behind it, on dark wood, red and blue light, product still life
- **torii** (wide + tall): A single vermilion-red torii gate with a cobalt-blue crossbeam standing in shallow still water at night, heavy rain, neon red and blue reflections on the water, mist, a huge pale full moon behind, centred

## Music

Prompt (both models): Cinematic cyberpunk Japanese trailer music, 120 BPM, 4/4, driving taiko drum ensemble hits, fast shamisen riff and koto plucks, deep pulsing analog synth bass, sharp sword-swish risers, big taiko impacts on the downbeat every bar, builds to a huge final hit at 28 seconds then ringing tail, energetic, heroic, no vocals

- A: `stability-ai/stable-audio-2.5`, duration 34 s
- B: `meta/musicgen` stereo-large, duration 30 s (fallback)

Runner: `tools/rep.py tools/jobs.json` (reads REPLICATE_API_TOKEN from env).

## Used in the cut

Music A (stable-audio-2.5) was used: measured 120 BPM, taiko downbeat every 2 s, a breath at 14–18 s, a roll into a final hit at 30 s. It was trimmed to 32 s with a 1 s fade, loudness-normalised to -14 LUFS. B (musicgen) was flatter and quieter, so it wasn't used.
