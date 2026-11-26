#!/usr/bin/env bash
# Build one episode: voice -> timing -> animated video.
# Usage: ./make_video.sh episodes/ep02_texting [out.mp4]
set -euo pipefail
cd "$(dirname "$0")"
EP="${1:?usage: ./make_video.sh episodes/<episode> [out.mp4]}"
OUT="${2:-$EP/out.mp4}"
python3 studio.py "$EP" "$OUT"
echo "Done: $OUT"
