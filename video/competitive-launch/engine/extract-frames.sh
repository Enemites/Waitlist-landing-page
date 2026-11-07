#!/usr/bin/env bash
# Extract a numbered JPEG sequence (0001.jpg, 0002.jpg, ...) from a clip for ctx.sequence(),
# optionally pre-graded to the Realms amber/charcoal look.
#
#   engine/extract-frames.sh <in.mp4> <outdir> [--fps 30] [--from s] [--to s]
#                            [--grade amber|none] [--width 1920] [--height H]
#                            [--grain 7] [--contrast 1.15] [--lift 0] [--black 0] [--white 1]
#                            [--vignette 1|0]
#                            [--q 2] [--compare before-after.jpg] [--print-filter]
#
#  --fps        output frame rate (default 30, matches the film)
#  --from/--to  source range in seconds (default: whole clip)
#  --grade      amber: luminance -> duotone ramp #0b0c0e > #5a472f > #a37a42 > #f6d39f,
#               slight S contrast, edge vignette and fine luma grain. none: plain extract.
#  --width      output width (default 1920, aspect kept). --height H crops to WxH (cover).
#  --grain      luma grain strength 0..20 (default 7; deterministic seed)
#  --contrast   contrast around mid grey before the ramp (default 1.15); --lift adds offset
#  --black/--white  input levels 0..1 mapped to the ends of the ramp (default 0 / 1); use
#               e.g. --black 0.08 --white 0.9 to give flat archival footage real blacks
#  --q          JPEG quality, 2 = high (default)
#  --compare    also write a labelled before|after still from the middle of the range
#  --print-filter  print the ffmpeg -vf chain and exit
#
# The grade is a pure ffmpeg filter chain (colorchannelmixer -> lutrgb -> noise), so the
# result is reproducible. Frames are written as full-range BT.601 JPEG (what browsers expect).
set -euo pipefail

usage() { awk 'NR>1 && /^#/ { sub(/^# ?/, ""); print; next } NR>1 { exit }' "$0"; exit "${1:-1}"; }
[[ $# -lt 2 ]] && usage
IN="$1"; OUT="$2"; shift 2
[[ "$IN" == "-h" || "$IN" == "--help" ]] && usage 0

FPS=30; FROM=""; TO=""; GRADE="none"; WIDTH=1920; HEIGHT=""; GRAIN=7; CONTRAST=1.15; LIFT=0
BLACK=0; WHITE=1; VIGNETTE=1; Q=2; COMPARE=""; PRINT=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --fps) FPS="$2"; shift 2;;
    --from) FROM="$2"; shift 2;;
    --to) TO="$2"; shift 2;;
    --grade) GRADE="$2"; shift 2;;
    --width) WIDTH="$2"; shift 2;;
    --height) HEIGHT="$2"; shift 2;;
    --grain) GRAIN="$2"; shift 2;;
    --contrast) CONTRAST="$2"; shift 2;;
    --lift) LIFT="$2"; shift 2;;
    --black) BLACK="$2"; shift 2;;
    --white) WHITE="$2"; shift 2;;
    --vignette) VIGNETTE="$2"; shift 2;;
    --q) Q="$2"; shift 2;;
    --compare) COMPARE="$2"; shift 2;;
    --print-filter) PRINT=1; shift;;
    -h|--help) usage 0;;
    *) echo "unknown option: $1" >&2; usage;;
  esac
done
case "$GRADE" in amber|none) ;; *) echo "--grade must be amber or none" >&2; exit 1;; esac

# ---- geometry ---------------------------------------------------------------------------
if [[ -n "$HEIGHT" ]]; then
  GEOM="scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase:flags=lanczos,crop=${WIDTH}:${HEIGHT},setsar=1"
else
  GEOM="scale=${WIDTH}:-2:flags=lanczos,setsar=1"
fi

# ---- amber duotone grade ----------------------------------------------------------------
# Ramp stops (position, #rrggbb): 0 #0b0c0e, 0.40 #5a472f, 0.70 #a37a42, 1 #f6d39f
ramp_expr() { # $1 = channel values "v0 v1 v2 v3"
  local v0 v1 v2 v3; read -r v0 v1 v2 v3 <<<"$1"
  local P1=0.40 P2=0.70
  local T="clip(((val/255-${BLACK})/(${WHITE}-${BLACK})-0.5)*${CONTRAST}+0.5+${LIFT}\,0\,1)"
  # piecewise-linear interpolation between the four stops (no ';' so it is filtergraph-safe)
  echo "if(lt(${T}\,${P1})\,${v0}+(${v1}-${v0})*${T}/${P1}\,if(lt(${T}\,${P2})\,${v1}+(${v2}-${v1})*(${T}-${P1})/(${P2}-${P1})\,${v2}+(${v3}-${v2})*(${T}-${P2})/(1-${P2})))"
}
if [[ "$GRADE" == "amber" ]]; then
  R=$(ramp_expr "11 90 163 246"); G=$(ramp_expr "12 71 122 211"); B=$(ramp_expr "14 47 66 159")
  LUMA="colorchannelmixer=rr=0.2126:rg=0.7152:rb=0.0722:gr=0.2126:gg=0.7152:gb=0.0722:br=0.2126:bg=0.7152:bb=0.0722"
  VIG=""; [[ "$VIGNETTE" == "1" ]] && VIG=",vignette=angle=PI/4.6:mode=forward"
  NOISE=""; [[ "$GRAIN" != "0" ]] && NOISE=",noise=c0s=${GRAIN}:c0f=t+u:all_seed=271828"
  GRADEF="format=gbrp,${LUMA}${VIG},lutrgb=r=${R}:g=${G}:b=${B},scale=out_color_matrix=bt601:out_range=pc,format=yuvj420p${NOISE}"
else
  GRADEF="scale=out_color_matrix=bt601:out_range=pc,format=yuvj420p"
fi
VF="fps=${FPS},${GEOM},${GRADEF}"
if [[ "$PRINT" == "1" ]]; then echo "$VF"; exit 0; fi
[[ -f "$IN" ]] || { echo "input not found: $IN" >&2; exit 1; }

RANGE=()
[[ -n "$FROM" ]] && RANGE+=(-ss "$FROM")
[[ -n "$TO" ]] && RANGE+=(-to "$TO")

mkdir -p "$OUT"
find "$OUT" -maxdepth 1 -regextype posix-extended -regex '.*/[0-9]{4,6}\.jpg' -delete
ffmpeg -hide_banner -loglevel error -y "${RANGE[@]}" -i "$IN" -an -vf "$VF" \
  -q:v "$Q" -start_number 1 "$OUT/%04d.jpg"
COUNT=$(find "$OUT" -maxdepth 1 -regextype posix-extended -regex '.*/[0-9]{4,6}\.jpg' | wc -l)
IFS=',' read -r FW FH < <(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$OUT/0001.jpg")
cat > "$OUT/sequence.json" <<JSON
{ "source": "$(basename "$IN")", "count": $COUNT, "fps": $FPS, "width": $FW, "height": $FH, "grade": "$GRADE", "from": "${FROM:-0}", "to": "${TO:-end}", "pattern": "%04d", "ext": "jpg", "first": 1 }
JSON
echo "wrote $COUNT frames (${FW}x${FH}, ${FPS} fps, grade=$GRADE) to $OUT"
echo "use: ctx.sequence({ dir: '<path from comp/>', count: $COUNT, fps: $FPS })"

# ---- optional before/after still ---------------------------------------------------------
if [[ -n "$COMPARE" ]]; then
  MID=$(( (COUNT + 1) / 2 ))
  SS="${FROM:-0}"
  T=$(awk -v s="$SS" -v m="$MID" -v f="$FPS" 'BEGIN{ printf "%.4f", s + (m-1)/f }')
  # drawtext needs a TTF/OTF; woff2 is not readable by freetype, so fall back to a system font if any
  SYSFONT=$(fc-match -f '%{file}' 'DejaVu Sans Mono' 2>/dev/null || true)
  if [[ -n "$SYSFONT" && -f "$SYSFONT" ]]; then
    LBL_B=",drawtext=fontfile=${SYSFONT}:text='BEFORE':x=24:y=24:fontsize=28:fontcolor=white:box=1:boxcolor=black@0.55:boxborderw=8"
    LBL_A=",drawtext=fontfile=${SYSFONT}:text='AFTER  --grade ${GRADE}':x=24:y=24:fontsize=28:fontcolor=white:box=1:boxcolor=black@0.55:boxborderw=8"
  else
    LBL_B=""; LBL_A=""
  fi
  PLAIN="fps=${FPS},${GEOM},scale=out_color_matrix=bt601:out_range=pc,format=yuvj420p"
  ffmpeg -hide_banner -loglevel error -y -ss "$T" -i "$IN" -filter_complex \
    "[0:v]split=2[a][b];[a]${PLAIN},scale=960:-2${LBL_B}[l];[b]${VF},scale=960:-2${LBL_A}[r];[l][r]hstack=inputs=2" \
    -frames:v 1 -q:v 2 "$COMPARE"
  echo "wrote before/after still: $COMPARE (t=${T}s)"
fi
