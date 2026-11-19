# Fábrica de videos de tekorei.ai

Hace los Reels/Shorts de Nico y Kori sin servicios pagos: escena 3D low-poly en Three.js,
voces fijas y realistas con Qwen3-TTS, música lo-fi generada por código y subtítulos palabra por palabra.

## Voces fijas de Nico y Kori

Las voces son **inventadas** (no son de ninguna persona real) con Qwen3-TTS, cuyos pesos tienen
licencia Apache-2.0: se pueden usar gratis en videos monetizados. El porqué está en
`../../reports/Voces libres realistas en español.md`.

- `voces/personajes.json`: descripción de cada voz y frase de referencia.
- `voces/nico.wav` + `voces/nico.txt`, `voces/kori.wav` + `voces/kori.txt`: **muestras maestras**.
  Cada línea de cada video se clona desde estas muestras, así que las voces son siempre las mismas.
  No las borres ni las regeneres: si se rediseñan, la voz cambia.
- `voces/eleccion.json`: las tomas candidatas, con lo que entendió Whisper y el tono medido, y cuál se eligió.

Kori lleva además un efecto fijo: +1 semitono y 30 % de señal robotizada (filtro robotize de FFmpeg).

## Requisitos (Ubuntu)

```bash
sudo apt-get install -y sox ffmpeg
pip install numpy scipy
npm install            # three + fuentes
# Playwright con Chromium (en este entorno ya viene instalado)

# Entorno de voz (unos 6 GB con PyTorch)
python3 -m venv /home/user/tts-venv
/home/user/tts-venv/bin/pip install qwen-tts torch torchaudio faster-whisper
# Modelos (unos 7,5 GB). Con HF_HUB_DISABLE_XET=1 la descarga usa los servidores permitidos.
HF_HUB_DISABLE_XET=1 python3 -c "from huggingface_hub import snapshot_download as d
for m in ['Qwen/Qwen3-TTS-12Hz-0.6B-Base','Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign','Systran/faster-whisper-small']:
    d(m, local_dir='/home/user/hf-models/' + m.split('/')[1])"
```

Si el entorno de voz está en otra ruta: `TEKOREI_PY=/ruta/bin/python`. Los modelos: `TEKOREI_MODELOS=/ruta`.
Para usar las voces viejas (Pico y MBROLA) sin modelos: `TEKOREI_VOZ=clasico` (requiere `libttspico-utils espeak-ng mbrola mbrola-mx2`).

## Hacer un video

```bash
./hacer_video.sh dia01.json 01
```

Salida en `../videos/`:

- `tekorei-dia01-instagram.mp4`: cierra con “Comenta EXAMEN y te lo mando por DM”.
- `tekorei-dia01-tiktok-youtube.mp4`: cierra con “pasos en el comentario fijado”, porque TikTok y YouTube no tienen DM automático.
- `tekorei-dia01-portada.jpg`: portada sin subtítulos.

Cada línea se genera con una semilla fija y se revisa con Whisper; si la toma no dice el texto,
se prueba otra semilla. Las tomas quedan en `build/tts_cache/`, así que volver a renderizar no
cambia las voces.

## Cómo está armado

| Archivo | Qué hace |
| --- | --- |
| `dia01.json` | Guion: quién habla, plano, expresión, texto para la voz (`tts`), texto en pantalla (`cap`) y palabras resaltadas. |
| `voz_qwen.py` | `disenar`: crea las muestras maestras (una sola vez). `generar`: clona esas voces para cada línea. Corre en el entorno de voz. |
| `voces.py` | Llama a `voz_qwen.py`, aplica el efecto de cada personaje, calcula tiempos de palabras, boca, música, efectos y mezcla. |
| `escena.html` / `escena.js` | Cuarto, personajes, cámaras, subtítulos, pantallas de la terminal y cierre. `window.renderFrame(n)` dibuja el cuadro n. |
| `render.js` | Captura los cuadros con Chromium (`preview`, `frames`, `cover`). |
| `hacer_video.sh` | Todo junto: audio, cuadros en paralelo y codificación H.264 1080x1920 a -14 LUFS. |

Para revisar cuadros sueltos sin renderizar todo:

```bash
node render.js preview build/timeline_ig.json 0,120,300
```

Para otro día: copia `dia01.json`, cambia el guion y la palabra. Las pantallas de la terminal
(`INSERT_QUIZ`, `INSERT_CITE`) tienen el contenido del día 1 en `escena.html`; cámbialo para cada repo.
