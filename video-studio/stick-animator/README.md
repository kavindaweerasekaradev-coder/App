# Stick Animator

Makes short vertical explainer videos (720×1280, 30 fps, ready for Reels) completely in code, with no paid AI services:

- **Characters and rooms:** original round-head characters plus rooms (living room, study, kitchen, office), drawn with pycairo.
- **Props and effects:** phone chat screen, laptop, to-do clipboard, thought clouds, speech and scribble bubbles, a puzzle brain, storm cloud, hearts and broken hearts.
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

## Making a new episode

Copy an episode folder and edit `episode.py`:

- `LINES`: the voiceover, one entry per line. `gap` is the pause after a line, in seconds.
- `SCENES`: a list of `(line_index, scene_function)`. Each scene starts when its line is spoken, so changing the script re-times the video automatically.
- `HIGHLIGHT`: caption words that get the yellow box.
- `VOICE`: the Kokoro voice (`am_michael`, `af_heart`, `bm_george` and others).

Inside a scene function `fn(c, t, T)`: `t` is the video time, `T = (start, end)` is the scene's time span, and `ls(i)` / `le(i)` give the start and end of script line `i`. Use these to time bubbles, pop-ins and expressions to the voice.

The shared characters, rooms, props and effects all live in `studio.py`.

The caption font comes from `.claude/skills/kaz-documentary-2/scripts/fonts/` (SIL Open Font License).
