#!/usr/bin/env python3
"""Voz fija del narrador de Vemquro con Qwen3-TTS (pesos Apache-2.0), en CPU.

Adaptado de tekorei-ai/video/voz_qwen.py: misma técnica (diseñar una vez, clonar siempre).

Se corre con el entorno que tiene qwen-tts y faster-whisper (por defecto /home/user/tts-venv).

1) Diseñar las voces UNA sola vez (voces inventadas, no son de ninguna persona real):
     python voz_qwen.py disenar [tomas]
   Genera varias tomas por personaje con el modelo VoiceDesign 1.7B (voces/candidatas/),
   las transcribe con Whisper y guarda la mejor como muestra maestra:
   voces/nico.wav + voces/nico.txt, voces/kori.wav + voces/kori.txt.
   Después de elegirlas, NO se vuelve a diseñar: así la voz nunca cambia.

2) Generar líneas clonando siempre esa muestra maestra (modelo Base 0.6B):
     python voz_qwen.py generar pedido.json carpeta_cache
   pedido.json = [{"id": "voz_00", "who": "nico", "text": "..."}, ...]
   Semilla fija por texto; si Whisper detecta que una toma no dice el texto, prueba otra semilla.
"""

import hashlib
import json
import os
import re
import shutil
import sys
import unicodedata
from pathlib import Path

os.environ.setdefault("HF_HUB_OFFLINE", "1")
import numpy as np
import soundfile as sf
import torch

AQUI = Path(__file__).resolve().parent
VOCES = AQUI / "voces"
MODELOS = Path(os.environ.get("VEMQURO_MODELOS", "/home/user/hf-models"))
DISENO = MODELOS / "Qwen3-TTS-12Hz-1.7B-VoiceDesign"
CLON = MODELOS / "Qwen3-TTS-12Hz-0.6B-Base"
WHISPER = MODELOS / "faster-whisper-small"
IDIOMA = "Spanish"

torch.set_num_threads(os.cpu_count() or 4)
PERSONAJES = json.loads((VOCES / "personajes.json").read_text(encoding="utf-8"))


def cargar(ruta):
    from qwen_tts import Qwen3TTSModel
    return Qwen3TTSModel.from_pretrained(str(ruta), device_map="cpu", dtype=torch.float32)


# ------------------------------------------------------------ revisión con Whisper

_whisper = None
NUMEROS = {"0": "cero", "1": "uno", "2": "dos", "3": "tres", "4": "cuatro", "5": "cinco",
           "6": "seis", "7": "siete", "8": "ocho", "9": "nueve", "10": "diez", "12": "doce",
           "20": "veinte", "40": "cuarenta"}
# Cómo puede escribir Whisper los nombres propios del guion (para no castigar una toma que está bien).
ALIAS = [(r"nexus ?tec?h?", "nexustech"), (r"\b[bv]e[nm] ?[ck]uro\b", "vemquro"), (r"\b(guasap|wasap|whats ?app)\b", "whatsapp")]


def palabras(texto):
    t = texto.lower().replace("pdf", "pe de efe")
    t = unicodedata.normalize("NFD", t)
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    t = re.sub(r"[^a-z0-9 ]+", " ", t)
    for patron, nombre in ALIAS:
        t = re.sub(patron, nombre, t)
    return [NUMEROS.get(w, w) for w in t.split()]


def wer(ref, hip):
    r, h = palabras(ref), palabras(hip)
    d = list(range(len(h) + 1))
    for i in range(1, len(r) + 1):
        prev, d[0] = d[0], i
        for j in range(1, len(h) + 1):
            prev, d[j] = d[j], min(d[j] + 1, d[j - 1] + 1, prev + (r[i - 1] != h[j - 1]))
    return d[len(h)] / max(1, len(r))


def transcribir(ruta):
    global _whisper
    if _whisper is None:
        from faster_whisper import WhisperModel
        _whisper = WhisperModel(str(WHISPER), device="cpu", compute_type="int8")
    import librosa
    audio, sr = sf.read(str(ruta), dtype="float32", always_2d=False)
    if audio.ndim > 1:
        audio = audio.mean(axis=1)
    audio = librosa.resample(audio, orig_sr=sr, target_sr=16000)  # Whisper espera 16 kHz en memoria
    segs, _ = _whisper.transcribe(audio, language="es", beam_size=5)
    return " ".join(s.text.strip() for s in segs)


def tono_mediano(wav, sr):
    import librosa
    f0 = librosa.yin(wav.astype(np.float32), fmin=60, fmax=600, sr=sr, frame_length=2048)
    rms = librosa.feature.rms(y=wav.astype(np.float32), frame_length=2048, hop_length=512)[0]
    n = min(len(f0), len(rms))
    return float(np.median(f0[:n][rms[:n] > rms.max() * 0.1]))


# ------------------------------------------------------------ 1) diseño (una sola vez)

def disenar(tomas=3):
    (VOCES / "candidatas").mkdir(parents=True, exist_ok=True)
    modelo = cargar(DISENO)
    elegidas = {}
    for nombre, p in PERSONAJES.items():
        candidatas = []
        for k in range(tomas):
            ruta = VOCES / "candidatas" / f"{nombre}_{k}.wav"
            if ruta.exists():  # misma semilla, misma toma: no hace falta generarla de nuevo
                wav, sr = sf.read(str(ruta), dtype="float32")
                wavs = [wav]
            else:
                torch.manual_seed(2000 + k)
                wavs, sr = modelo.generate_voice_design(text=p["texto_referencia"], instruct=p["descripcion"], language=IDIOMA)
                sf.write(ruta, wavs[0], sr)
            oido = transcribir(ruta)
            error = wer(p["texto_referencia"], oido)
            f0 = tono_mediano(wavs[0], sr)
            lo, hi = p["tono_hz"]
            fuera = 0 if lo <= f0 <= hi else min(abs(f0 - lo), abs(f0 - hi)) / lo  # cuánto se aleja del tono buscado
            castigo = 2 * fuera
            candidatas.append({"toma": k, "archivo": ruta.name, "segundos": round(len(wavs[0]) / sr, 2),
                               "wer": round(error, 3), "tono_hz": round(f0, 1), "puntaje": round(error + castigo, 3), "oido": oido})
            print(f"{nombre} toma {k}: {candidatas[-1]}", flush=True)
        mejor = min(candidatas, key=lambda c: c["puntaje"])
        shutil.copy(VOCES / "candidatas" / mejor["archivo"], VOCES / f"{nombre}.wav")
        (VOCES / f"{nombre}.txt").write_text(p["texto_referencia"] + "\n", encoding="utf-8")
        elegidas[nombre] = {"elegida": mejor, "candidatas": candidatas}
        print(f"{nombre}: elegida la toma {mejor['toma']}", flush=True)
    (VOCES / "eleccion.json").write_text(json.dumps(elegidas, ensure_ascii=False, indent=1), encoding="utf-8")


# ------------------------------------------------------------ 2) producción (siempre la misma voz)

def semilla(texto, intento=0):
    return int(hashlib.sha1(texto.encode("utf-8")).hexdigest()[:8], 16) + 7919 * intento


def generar(pedido_path, salida, intentos=3, aceptable=0.12):
    salida = Path(salida)
    salida.mkdir(parents=True, exist_ok=True)
    pedido = json.loads(Path(pedido_path).read_text(encoding="utf-8"))
    modelo, prompts = None, {}
    for item in pedido:
        who, texto = item["who"], item["text"]
        ref_wav = VOCES / f"{who}.wav"
        ref_txt = (VOCES / f"{who}.txt").read_text(encoding="utf-8").strip()
        huella = hashlib.sha1(CLON.name.encode() + ref_wav.read_bytes() + ref_txt.encode() + texto.encode()).hexdigest()[:16]
        cache = salida / f"{who}_{huella}.wav"
        if not cache.exists():
            if modelo is None:
                modelo = cargar(CLON)
            if who not in prompts:
                prompts[who] = modelo.create_voice_clone_prompt(ref_audio=str(ref_wav), ref_text=ref_txt)
            mejor = None
            for intento in range(intentos):
                torch.manual_seed(semilla(texto, intento))
                wavs, sr = modelo.generate_voice_clone(text=texto, language=IDIOMA, voice_clone_prompt=prompts[who])
                tmp = salida / f"_prueba_{intento}.wav"
                sf.write(tmp, wavs[0], sr)
                error = wer(texto, transcribir(tmp))
                print(f"{item['id']} {who} intento {intento}: {len(wavs[0]) / sr:.2f} s, WER {error:.2f}", flush=True)
                if mejor is None or error < mejor[0]:
                    mejor = (error, tmp.read_bytes())
                if error <= aceptable:
                    break
            cache.write_bytes(mejor[1])
            for tmp in salida.glob("_prueba_*.wav"):
                tmp.unlink()
        item["wav"] = str(cache)
    Path(pedido_path).write_text(json.dumps(pedido, ensure_ascii=False, indent=1), encoding="utf-8")


if __name__ == "__main__":
    if sys.argv[1] == "disenar":
        disenar(int(sys.argv[2]) if len(sys.argv) > 2 else 3)
    elif sys.argv[1] == "generar":
        generar(sys.argv[2], sys.argv[3])
