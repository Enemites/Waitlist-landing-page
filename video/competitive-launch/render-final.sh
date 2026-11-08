#!/usr/bin/env bash
# Render the Realms Competitive launch film end to end:
#   1. picture: every frame of comp/ (engine/render.mjs, lossless-ish x264 master)
#   2. sound:   audio/film_cues.py -> audio/synth.py render (VO + score + SFX, -14 LUFS, -1 dBTP)
#   3. deliver: mux + encode H.264 High / yuv420p / AAC 48 kHz into out/
# Usage: ./render-final.sh [--skip-picture] [--skip-audio] [--crf 20]
set -euo pipefail
cd "$(dirname "$0")"
CRF=23; SKIP_PIC=0; SKIP_AUD=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-picture) SKIP_PIC=1; shift;;
    --skip-audio) SKIP_AUD=1; shift;;
    --crf) CRF="$2"; shift 2;;
    *) echo "unknown arg $1"; exit 2;;
  esac
done
mkdir -p .work/final out
if [[ $SKIP_PIC == 0 ]]; then
  node engine/render.mjs --out .work/final/picture.mp4 --crf 12 --preset medium
fi
if [[ $SKIP_AUD == 0 ]]; then
  python3 audio/film_cues.py
  python3 audio/synth.py render audio/cues.film.json -o .work/final/mix.wav --png .work/final/mix.png
fi
OUT=out/realms-competitive-launch.mp4
ffmpeg -v error -y -i .work/final/picture.mp4 -i .work/final/mix.wav \
  -map 0:v:0 -map 1:a:0 -vf "hqdn3d=0:0:2:2" \
  -c:v libx264 -preset slow -crf "$CRF" -profile:v high -level 4.1 -pix_fmt yuv420p \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -x264-params keyint=60:min-keyint=30 \
  -c:a aac -b:a 256k -ar 48000 \
  -movflags +faststart -metadata title="Realms Competitive: launch film" -shortest "$OUT"
ffprobe -v error -show_entries format=duration,size,bit_rate -show_entries stream=codec_name,width,height,r_frame_rate -of compact "$OUT"
echo "wrote $OUT"
# high-quality master for upload to video platforms (not committed: ~70 MB)
ffmpeg -v error -y -i .work/final/picture.mp4 -i .work/final/mix.wav -map 0:v:0 -map 1:a:0 -vf "hqdn3d=0:0:2:2" \
  -c:v libx264 -preset slow -crf 20 -profile:v high -level 4.1 -pix_fmt yuv420p \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -x264-params keyint=60:min-keyint=30 \
  -c:a aac -b:a 256k -ar 48000 -movflags +faststart -metadata title="Realms Competitive: launch film" -shortest out/realms-competitive-launch-master.mp4
echo "wrote out/realms-competitive-launch-master.mp4"
