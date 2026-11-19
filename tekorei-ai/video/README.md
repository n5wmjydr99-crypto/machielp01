# Fábrica de videos de tekorei.ai

Hace los Reels/Shorts de Nico y Kori sin servicios pagos: escena 3D low-poly en Three.js,
voces sintéticas locales, música lo-fi generada por código y subtítulos palabra por palabra.

## Requisitos (Ubuntu)

```bash
sudo apt-get install -y libttspico-utils espeak-ng mbrola mbrola-mx2 sox ffmpeg
pip install numpy scipy
npm install            # three + fuentes
# Playwright con Chromium (en este entorno ya viene instalado)
```

## Hacer un video

```bash
./hacer_video.sh dia01.json 01
```

Salida en `../videos/`:

- `tekorei-dia01-instagram.mp4`: cierra con “Comenta EXAMEN y te lo mando por DM”.
- `tekorei-dia01-tiktok-youtube.mp4`: cierra con “pasos en el comentario fijado”, porque TikTok y YouTube no tienen DM automático.
- `tekorei-dia01-portada.jpg`: portada sin subtítulos.

## Cómo está armado

| Archivo | Qué hace |
| --- | --- |
| `dia01.json` | Guion: quién habla, plano, expresión, texto para la voz (`tts`), texto en pantalla (`cap`) y palabras resaltadas. |
| `voces.py` | Voces (Kori: SVOX Pico con efecto robot; Nico: MBROLA mx2), tiempos de cada palabra, movimiento de boca, música, efectos y mezcla. |
| `escena.html` / `escena.js` | Cuarto, personajes, cámaras, subtítulos, pantallas de la terminal y cierre. `window.renderFrame(n)` dibuja el cuadro n. |
| `render.js` | Captura los cuadros con Chromium (`preview`, `frames`, `cover`). |
| `hacer_video.sh` | Todo junto: audio, cuadros en paralelo y codificación H.264 1080x1920 a -14 LUFS. |

Para revisar cuadros sueltos sin renderizar todo:

```bash
node render.js preview build/timeline_ig.json 0,120,300
```

Para otro día: copia `dia01.json`, cambia el guion y la palabra. Las pantallas de la terminal
(`INSERT_QUIZ`, `INSERT_CITE`) tienen el contenido del día 1 en `escena.html`; cámbialo para cada repo.
