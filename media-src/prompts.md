# bDojoX imagery prompts

Model: black-forest-labs/flux-schnell (drafts, seeds 1 and 2) and black-forest-labs/flux-1.1-pro (finals), 16:9, webp.
Suffix on every prompt (S): "no text, no letters, no people, no faces, no logos, cinematic, premium editorial photography, deep navy night palette with vermilion red and cobalt blue accents, shallow depth of field, fine film grain"

- hero: A lone vermilion-red torii gate with a cobalt-blue crossbeam standing in shallow still water in a quiet dojo courtyard at night, soft rain, neon red and blue reflections on wet dark stone, a single large white ink enso brush circle glowing faintly in the mist behind the gate, torii placed right of centre, wide composition with calm empty dark space on the left, S
- doors: Close view of a dark wooden dojo sliding door with paper screens lit from within, rain dripping from the eaves, red and blue neon light reflecting on wet timber floor, minimal Japanese architecture, S (spare, not used on the page yet)
- enso: A bold white sumi-ink enso, an open hollow ring brush stroke with an empty dark centre, on near-black textured paper, a thin red line and a thin blue line crossing beneath it like a belt, vast negative space, abstract minimal, high contrast, S
- path: A long line of red torii gates receding into blue misty night, wet stone path with neon reflections, symmetrical depth, rain, quiet and monumental, S

Script: media-src/gen.py (reads REPLICATE_API_TOKEN from the environment; never commit it). Page images live in /img (resized to 1600px wide webp).
