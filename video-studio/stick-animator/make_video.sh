#!/usr/bin/env bash
# Build the video: script.json -> vo.wav + timing.json -> out.mp4
set -euo pipefail
cd "$(dirname "$0")"
OUT="${1:-out.mp4}"
python3 voice.py
python3 anim.py "$OUT"
echo "Done: $OUT"
