#!/usr/bin/env bash
# Genera los dos MP4 de un día: Instagram (cierre "te lo mando por DM") y TikTok/YouTube
# (cierre "pasos en el comentario fijado"), más la portada.
#   ./hacer_video.sh dia01.json 01
set -euo pipefail
cd "$(dirname "$0")"
GUION="${1:-dia01.json}"
DIA="${2:-01}"
SALIDA="../videos"
mkdir -p "$SALIDA" build/frames

python3 voces.py "$GUION"

leer() { python3 -c "import json,sys; d=json.load(open('$1')); print(eval(sys.argv[1]))" "$2"; }
CTA=$(leer build/timeline_ig.json "int((d['events']['cta']['start']-0.06)*d['fps'])")
FIN_IG=$(leer build/timeline_ig.json "d['frames']")
FIN_TT=$(leer build/timeline_tt.json "d['frames']")
MITAD=$(( CTA / 2 ))
echo "cuadros: común 0-$CTA, IG hasta $FIN_IG, TT hasta $FIN_TT"

rm -rf build/frames/*
node render.js frames build/timeline_ig.json 0 "$MITAD" build/frames/comun &
node render.js frames build/timeline_ig.json "$MITAD" "$CTA" build/frames/comun &
( node render.js frames build/timeline_ig.json "$CTA" "$FIN_IG" build/frames/ig &&
  node render.js frames build/timeline_tt.json "$CTA" "$FIN_TT" build/frames/tt ) &
wait

for V in ig tt; do
  rm -rf "build/seq_$V" && mkdir -p "build/seq_$V"
  ln -s "$PWD"/build/frames/comun/*.jpg "$PWD"/build/frames/$V/*.jpg "build/seq_$V/"
  # Volumen estándar de redes (-14 LUFS), en dos pasadas para que no "bombee".
  MED=$(ffmpeg -hide_banner -i "build/audio_$V.wav" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
  FILTRO=$(python3 -c "
import json,sys; m=json.loads(sys.stdin.read())
print(f\"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true\")" <<< "$MED")
  NOMBRE=$([ "$V" = ig ] && echo "instagram" || echo "tiktok-youtube")
  ffmpeg -y -hide_banner -loglevel error -framerate 30 -i "build/seq_$V/f_%05d.jpg" -i "build/audio_$V.wav" \
    -vf "hqdn3d=1.5:1.5:6:6" -c:v libx264 -preset slow -crf 19 -maxrate 9M -bufsize 18M \
    -pix_fmt yuv420p -profile:v high -level 4.1 -g 60 \
    -c:a aac -b:a 192k -ar 48000 -af "$FILTRO" -movflags +faststart -shortest \
    "$SALIDA/tekorei-dia$DIA-$NOMBRE.mp4"
  echo "listo: $SALIDA/tekorei-dia$DIA-$NOMBRE.mp4"
done

node render.js cover build/timeline_ig.json 40 "$SALIDA/tekorei-dia$DIA-portada.jpg"
echo "listo: $SALIDA/tekorei-dia$DIA-portada.jpg"
