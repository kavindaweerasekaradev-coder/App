# Stick Animator

Makes short vertical explainer videos (720×1280, 30 fps) completely in code, with no paid AI services:

- **Characters and rooms:** original round-head characters and rooms (living room, study, kitchen), drawn with pycairo.
- **Metaphor effects:** speech bubbles, a puzzle brain that assembles itself, scribbled "pressure" bubbles, a personal-space bubble and a heart.
- **Voice:** the free Kokoro voice model, which runs locally.
- **Captions:** karaoke style, with the spoken word boxed and key words in yellow.

## Setup (once)

```bash
./setup.sh
```

Needs Python 3, ffmpeg and internet access to GitHub to download the voice model (~120 MB, saved to `models/`, not committed).

## Make the video

```bash
./make_video.sh out.mp4
```

1. `script.json`: the voiceover lines. `gap` is the pause after a line, in seconds.
2. `voice.py`: generates `vo.wav` and `timing.json` (when each line starts and ends). Pick another voice with `VOICE=af_heart ./make_video.sh` (`am_michael`, `af_heart`, `bm_george` and others).
3. `anim.py`: draws every frame and adds the captions and voiceover.

To preview one frame, run `python3 anim.py --still 4.8 frame.png` (after `voice.py` has run).

## Changing the story

The scenes and their start times are in `main()` in `anim.py` (the `S` list), and each scene is an `sc_*` function. If you change `script.json`, check the new line timings in `timing.json` and update the scene start times to match. Words that get the yellow box are listed in `HIGHLIGHT`.

The caption font comes from `.claude/skills/kaz-documentary-2/scripts/fonts/` (SIL Open Font License).
