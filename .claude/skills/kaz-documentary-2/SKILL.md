---
name: kaz-documentary-2
description: Use when the user wants a narrated 9:16 documentary-style reel from a voiceover and script (business/biography/history explainers in the B&W photo-documentary or torn-paper article look), e.g. "make a Kaz documentary video", "here's my voiceover and script", "break this script down into images", or when they upload images for a shot sheet you gave them.
---

# Kaz Documentary 2

This skill makes 720x1280, 30fps shorts of 30-90s. A voiceover drives the picture: no narrator appears on screen. It includes everything here, ready to use:
- `scripts/docu_render.py`: the engine
- `scripts/textfx.py`: caption styles and highlights
- `scripts/article.py`: the torn-paper article look
- `scripts/cutout.py`: background removal
- `scripts/fonts/`: open-licence (OFL) fonts
- `examples/`: real shot builders

Copy `scripts/` into the working directory before starting. Its path is `${CLAUDE_PLUGIN_ROOT}/skills/kaz-documentary-2/scripts`. If that variable isn't set, find the folder next to this file.

## Two looks (mix them freely)

**A. Photo documentary** (the default):
- Full-frame stills, mostly black and white, with one accent colour kept (`bw_accent`). Use `warm` or `color` for hero shots.
- Every still moves: `push_in`, `pull_out`, `drift_up`, or `frame_pull` (a framed picture zooms until it fills the screen, good for openings).
- Pivot lines get paper, grid or dark cards. Years get a year stamp (a big number with a red underline).
- Real people appear as black-and-white cutouts with a soft shadow, optionally with a white outline.

**B. Torn-paper article** (`layout: "article"` and `"title"`):
- Graph-paper background.
- Serif paragraphs that ink in word by word, with yellow highlighter marks on `*spans*`.
- An orange duotone photo strip with a torn top edge at the bottom. It can swap photos mid-shot.
- Headings with a pink/yellow colour split. Title cards are set over a faded photo.
- Centred question cards (`center: true`).
- A tilted watermark tag on every frame (`"watermark": {"text": "..."}` at the top level). Ask the user what it should say.

**Pacing (both looks):**
- A new visual every 1.5-3s.
- Captions change every 0.3-1.5s and are timed to the voiceover.
- Structure: hook → setup (names and years) → turn (a pivot card) → proof (numbers highlighted) → strong typographic ending.

## Stage 1: Shot sheet (the user uploads the voiceover and script)

1. **Timing.**
   - Try faster-whisper (`base`, `word_timestamps=True`).
   - If the model download is blocked, map the pauses instead and match the speech segments between them to the script's phrases. ElevenLabs voiceovers match one to one:
     `ffmpeg -i vo.mp3 -af silencedetect=noise=-35dB:d=0.15 -f null - 2>&1 | grep -oE "silence_(start|end): [0-9.]+"`
   - Get the length with ffprobe.
2. **Beats.** One visual per clause. Decide for each beat whether it is a **photo** (the user supplies it), a **card** (paper, grid, dark, year stamp, title or question) or a **cutout** of a real person. Aim for about 60-70% photos. Reuse images where you can.
3. **Deliver the sheet in the reply.**
   - A table with these columns: File (`01.jpg`…), When, VO line, Prompt.
   - One shared prompt suffix: `vertical 9:16, photorealistic editorial photograph, cinematic, soft moody light, shallow depth of field, high detail, empty space in the upper third`
   - Mark the shots where a cutout will stand in front with ★ and add `empty centre foreground, no people` to their prompts.
   - Ask for colour images: the renderer converts them to black and white.
   - Tell the user to leave logos out of the prompts.
   - Below the table, list the card beats and a short text plan: the accent colour plus which words get which highlight.
4. **Real people.**
   - Ask for real photos (press photos or Creative Commons, such as Wikimedia), as PNG cutouts or normal photos. You remove the background with `cutout.py`.
   - Never generate, or ask the user to generate, photoreal images of a real person.
   - If the user sends AI-made images of a real person in staged scenes, don't use them in a factual video. Say so briefly and offer a card or cutout instead.
   - Check that each photo shows the person named. A relative or lookalike is a common mix-up.
5. **Stop and wait** for the images.

## Stage 2: Build (the user uploads the images)

1. **Copy the images.** The attachment message lists the sender's filenames in order next to the saved paths. Copy each one to `img/NN.jpg`.
2. **Handle gaps.** If an image is missing, use a card or reuse a nearby image, and say which ones you changed.
3. **Cut out people.** Run `python3 scripts/cutout.py in.jpg img/name.png` on each photo. It handles avif, webp and existing transparency.
4. **Write the shots.** Write a small `build.py` that holds the shots with **absolute** times and converts them to relative times (see `examples/`). It writes `shots.json`.
5. **Preview.** `python3 scripts/docu_render.py shots.json prev.mp4`, then make a contact sheet: `ffmpeg -i prev.mp4 -vf "fps=1/1.5,scale=140:-1,tile=13x3" -frames:v 1 sheet.png`. Read it and fix:
   - text that can't be read
   - text over a face
   - text running off the edge
   - highlights in the wrong place
6. **Final.** Run `python3 scripts/docu_render.py shots.json final.mp4 vo.mp3`, delete the `*_frames` folder, and send the MP4.
7. **Revisions.** Offer specific changes. For a change, edit build.py and re-render; no new breakdown is needed.

Rendering takes about 4-6s per second of video. Run it in the foreground with a long timeout.

## shots.json reference

Top level: `{"watermark": {...optional}, "shots": [ ... ]}`. Each shot has these keys:
- `dur` (seconds).
- `bg`: an image path, or `paper`, `grid`, `dark` or `wood`.
- `grade`: `bw`, `bw_accent`, `warm` or `color`.
- `move`: `push_in`, `pull_out`, `drift_up`, `frame_pull` or `static`.
- `transition`: `blur` (default), `cut`, `flash` or `whip`.
- `cutout`:
  - `src`: a transparent PNG
  - `h`: height as a fraction of the frame
  - `x`: horizontal centre (0-1)
  - `y`: bottom edge (1.02 sits it on the frame bottom)
  - `t`: start time
  - `grade`: `bw` or `color`
  - `outline`: true or false
- `year`: `{"t": 0.05, "text": "1984", "size": 120}`
- `tag`: `{"t", "text", "pos"}`, a yellow torn label.
- `caption`: a list of captions, each `{"t", "end"?, "text", "pos": [x, y], "style", ...}`. Times are relative to the start of the shot.
- Article layout:
  - `layout: "article"`, with `title`, `title_size`, `paras` (`[{"t", "text", "dur"}]`), `strips` (`[{"t", "src"}]`), `strip_tone` (`orange`, `sepia` or `grey`), `strip_top`, `center`, `cy`, `size`
  - `layout: "title"`, with `title` and `bg_img`
  - `no_wm: true` hides the watermark on that shot.

### Caption text system (textfx)
- `text`: `|` is a line break. `*span*` gets the accent colour and `~span~` gets the second accent. Spans can cover several words.
- `style`:
  - `serif`: Playfair italic, for narration.
  - `serif_big`: big DM Serif italic, for statements.
  - `type`: serif with a word-by-word typewriter reveal.
  - `sans`: Inter with a word-by-word reveal.
  - `glow`: Inter with glowing accent words, for dark cards.
  - `condensed`: Anton.
  - `bebas`: tall uppercase.
  - `heavy`: Archivo Black with an outline.
  - `box`: white text on a black bar.
  - `sticker`: a tilted torn label. Set its colour with `bg`.
  - `stack`: a small line over a huge accent word.
- `anim`: `pop`, `type`, `rise` or `slam`.
- `accent`, `accent2`: yellow, orange, red, gold, cream, cyan, green, pink, black, or a hex code.
- `ink: "dark"` for light photos. Paper and grid cards switch automatically.
- `size`, `tilt`.
- `hl`: one highlight or a list, `{"type", "word", "color", "t", "alpha"?}`. Types: `circle`, `underline`, `marker`, `box`, `strike`, `scribble`, `arrow`. The highlight finds the word's position automatically.

### Design rules
- Change the caption style every 2-3 shots, and never use one style more than 3 shots in a row.
- Pick one accent colour per video and keep it consistent:
  - gold for luxury
  - yellow for money
  - cyan for tech
  - red for danger, loss or the brand colour
- Use about 4-6 highlights per 35s, with varied types:
  - circle the money
  - box the stat
  - strike what was wrong
  - marker on the key word
  - underline the claim
- Put text over empty areas of the image, never over faces. Cutouts stand low in the frame, with text in the upper third.
- Brand roll-calls work best as fast `heavy` or `bebas` single words.
- End with `heavy`, `bebas` or `stack`, with the last word in the accent colour.
- In the article look, persistent text builds up across a section while the photo strip changes underneath.
