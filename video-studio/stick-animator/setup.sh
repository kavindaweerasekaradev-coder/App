#!/usr/bin/env bash
# One-time setup: Python packages + the free Kokoro voice model (~120 MB, not committed).
set -euo pipefail
cd "$(dirname "$0")"
pip install --break-system-packages -q pycairo numpy pillow kokoro-onnx soundfile
command -v ffmpeg >/dev/null || { echo "Please install ffmpeg first"; exit 1; }
mkdir -p models
BASE=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
[ -f models/voices-v1.0.bin ]        || curl -fL -o models/voices-v1.0.bin "$BASE/voices-v1.0.bin"
[ -f models/kokoro-v1.0.int8.onnx ]  || curl -fL -o models/kokoro-v1.0.int8.onnx "$BASE/kokoro-v1.0.int8.onnx"
echo "Setup done."
