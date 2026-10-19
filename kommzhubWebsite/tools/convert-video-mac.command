#!/bin/bash
# Converts assets/video/AHTS.MOV into a web-ready AHTS.mp4 (H.264 + AAC),
# which plays in every browser and on every phone.
# Needs ffmpeg. Install once with:  brew install ffmpeg
cd "$(dirname "$0")/../assets/video" || exit 1
IN="AHTS.MOV"
OUT="AHTS.mp4"
if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg is not installed. Open Terminal and run:  brew install ffmpeg"
  echo "(No Homebrew? Use HandBrake instead: handbrake.fr)"
  read -n 1 -s -r -p "Press any key to close"; exit 1
fi
if [ ! -f "$IN" ]; then
  echo "Could not find $IN in assets/video/"; read -n 1 -s -r -p "Press any key to close"; exit 1
fi
echo "Converting $IN to $OUT ..."
ffmpeg -y -i "$IN" -c:v libx264 -profile:v high -level 4.1 -crf 24 -preset slow \
  -vf "scale='min(1920,iw)':-2,fps=30" -pix_fmt yuv420p \
  -c:a aac -b:a 128k -movflags +faststart "$OUT"
echo ""
echo "Done: assets/video/$OUT ($(du -h "$OUT" | cut -f1))"
read -n 1 -s -r -p "Press any key to close"
