# Stick Animator

Makes short vertical explainer videos (720×1280, 30 fps, ready for Reels) completely in code, with no paid AI services:

- **Characters and rooms:** original round-head characters plus rooms (living room, study, kitchen, office), drawn with pycairo.
- **Props and effects:** phone chat screen, laptop, to-do clipboard, battery meter, door, armchair, mug, shopping bags, wrench, calendar, theatre mask, feeling blobs, shield, spotlight, thought clouds, speech and scribble bubbles, a puzzle brain, storm cloud, hearts and broken hearts.
- **Poses:** sitting and standing, walking, and arms that wave, carry, give, use a tool or hold a mask. `HANDS` holds the last-drawn man's hand positions, so props can be attached to his hands.
- **Voice:** the free Kokoro voice model, which runs locally.
- **Captions:** karaoke style, with the spoken word boxed and key words in yellow.

## Setup (once)

```bash
./setup.sh
```

Needs Python 3, ffmpeg and internet access to GitHub to download the voice model (~120 MB, saved to `models/`, not committed).

## Make a video

```bash
./make_video.sh episodes/ep02_texting
```

The video is saved as `episodes/ep02_texting/out.mp4`. Each run regenerates the voice and timing.

To preview a single frame, run `python3 studio.py episodes/ep02_texting --still 4.5 frame.png`. This reuses the saved timing.

## Episodes

| Folder | Topic |
|---|---|
| `episodes/ep01_quiet` | Why does he go quiet when something is wrong? |
| `episodes/ep02_texting` | Why does he stop texting back? |
| `episodes/ep03_alone` | Why does he need time alone? |
| `episodes/ep04_jokes` | Why does he joke when things get serious? |
| `episodes/ep05_iloveyou` | Why doesn't he say "I love you" very often? |
| `episodes/buddha01_dream` | The Path to Awakening, Ep 1: Queen Maha Maya's dream (painted illustrations) |

## Silhouette style (Buddha series)

`silhouette.py` is a second, respectful art style: dark silhouettes against glowing skies, with lotuses, light rays and sacred symbols. People have no cartoon faces, and sacred moments are shown with light and symbols. It includes skies (`SUNSET`, `NIGHT`, `DAWN`, `HEAVEN`), moon, sun, stars, mountains, palace, palms, lake reflections, clouds, birds, figures (king, queen, sage, guardian), seated sages, bed, a glowing white elephant, lotus, petals, a crown, the Dharma wheel, a Bodhi leaf and title cards.

Episodes in this style also set:
- `CAPTION_STYLE = "soft"`: serif captions where the spoken key word turns gold, on a soft dark band.
- `MUSIC = "ambient"`: a generated calm drone with singing-bowl strikes, mixed under the voice.
- `VOICE = "bm_george"`, with `"speed": 0.9` per line for calm narration.

## Painted illustrations

`gen_images.py` generates scene paintings with the free Pollinations image API (no key; the host `image.pollinations.ai` must be allowed in the environment's network settings):

```bash
python3 gen_images.py episodes/buddha01_dream/prompts.json            # all images
python3 gen_images.py episodes/buddha01_dream/prompts.json only=02,10 seed=60   # redo some
```

`prompts.json` holds a shared style line, character descriptions (`[QUEEN]`, `[KING]`) and one prompt per image. Images are saved in the episode's `img/` folder. In a scene, `painting(c, path, z, fx, fy)` draws an image with a slow zoom and pan and keeps the generator's watermark corner out of frame. `motes`, `mist`, `light_rays`, `petals` and `lotus` add life on top.

The free model is inconsistent between images and tends to dress women immodestly. For sacred stories, show people from behind or in wide shots, and check every image before using it.

## Making a new episode

Copy an episode folder and edit `episode.py`:

- `LINES`: the voiceover, one entry per line. `gap` is the pause after a line, in seconds.
- `SCENES`: a list of `(line_index, scene_function)`. Each scene starts when its line is spoken, so changing the script re-times the video automatically.
- `HIGHLIGHT`: caption words that get the yellow box.
- `VOICE`: the Kokoro voice (`am_michael`, `af_heart`, `bm_george` and others).

Inside a scene function `fn(c, t, T)`: `t` is the video time, `T = (start, end)` is the scene's time span, and `ls(i)` / `le(i)` give the start and end of script line `i`. Use these to time bubbles, pop-ins and expressions to the voice.

The shared characters, rooms, props and effects all live in `studio.py`.

The caption font comes from `.claude/skills/kaz-documentary-2/scripts/fonts/` (SIL Open Font License).
