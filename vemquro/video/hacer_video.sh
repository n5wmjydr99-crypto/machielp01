#!/usr/bin/env bash
# Video de Vemquro: música, grabación de la web, render de la escena y MP4 final 1080x1920 a 60 fps.
#   ./hacer_video.sh web.json                         -> ../videos/vemquro-demo-nexustech.mp4 (completo)
#   ./hacer_video.sh web.json 0 800 vista-previa       -> solo los cuadros [0, 800)
set -euo pipefail
cd "$(dirname "$0")"
CFG="${1:-web.json}"
PY="${VEMQURO_PY:-/home/user/tts-venv/bin/python}"
mkdir -p build ../videos

[ -f build/narracion.wav ] || "$PY" narracion.py
TOTAL=$(node -e "const t=require('./tiempos.json'); console.log(Math.ceil((t.lineas.find(l=>l.id==='l18').fin+3.15)*60))")
DESDE="${2:-0}"; HASTA="${3:-$TOTAL}"; NOMBRE="${4:-vemquro-demo-nexustech}"
echo "cuadros $DESDE-$HASTA de $TOTAL"

# 1) la web, cuadro por cuadro (siempre desde el principio: así cada cuadro sale igual)
rm -rf build/web
node grabar_web.js "$CFG" build/web 0 "$HASTA"

# 2) música, efectos (con los clics reales) y mezcla
"$PY" musica.py

# 3) escena en paralelo
rm -rf build/fr && mkdir -p build/fr
N="${WORKERS:-3}"
PASO=$(( (HASTA - DESDE + N - 1) / N ))
for k in $(seq 0 $((N - 1))); do
  A=$(( DESDE + k * PASO )); B=$(( A + PASO )); [ "$B" -gt "$HASTA" ] && B="$HASTA"
  [ "$A" -lt "$B" ] && node render.js frames "web=build/web" "$A" "$B" build/fr &
done
wait

# 4) audio del tramo a -14 LUFS (dos pasadas) y MP4
INI=$(python3 -c "print($DESDE/60)"); DUR=$(python3 -c "print(($HASTA-$DESDE)/60)")
ffmpeg -y -v error -ss "$INI" -t "$DUR" -i build/mezcla.wav build/audio_tramo.wav
MED=$(ffmpeg -hide_banner -i build/audio_tramo.wav -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
FILTRO=$(python3 -c "
import json,sys; m=json.loads(sys.stdin.read())
print(f\"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true\")" <<< "$MED")
ffmpeg -y -hide_banner -loglevel error -framerate 60 -start_number "$DESDE" -i build/fr/f_%05d.jpg -i build/audio_tramo.wav \
  -c:v libx264 -preset slow -crf 17 -maxrate 16M -bufsize 32M -pix_fmt yuv420p -profile:v high -level 4.2 -g 120 \
  -c:a aac -b:a 192k -ar 48000 -af "$FILTRO" -movflags +faststart -shortest "../videos/$NOMBRE.mp4"
echo "listo: ../videos/$NOMBRE.mp4"
