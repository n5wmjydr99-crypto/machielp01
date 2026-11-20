#!/usr/bin/env python3
"""Arma la narración del video de Vemquro y los tiempos de cada palabra.

Uso (con el entorno de voz): python narracion.py
Lee pedido_voz.json (audios ya generados por voz.py) y guion.json (texto que se muestra).
Escribe build/narracion.wav (48 kHz, mono) y tiempos.json:
  {"duracion": s, "lineas": [{"id", "texto", "inicio", "fin", "palabras": [{"w", "s", "e"}]}]}
"""

import difflib
import json
import re
import unicodedata
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy import signal

AQUI = Path(__file__).resolve().parent
SR = 48000
INICIO = 0.12          # el gancho arranca casi de inmediato
PAUSA = 0.16           # entre frases de la misma parte
PAUSA_PARTE = 0.38     # al cambiar de parte (intro, demo, precios, cierre)
FIN_DE_PARTE = {"l04", "l12", "l16"}
COLA = 0.9             # silencio al final para el cierre
MAX_SILENCIO_INTERNO = 0.20


def a_48k(wav, sr):
    if sr == SR:
        return wav
    g = np.gcd(sr, SR)
    return signal.resample_poly(wav, SR // g, sr // g).astype(np.float32)


def recortar(wav):
    """Quita silencio al principio y al final, y acorta pausas internas largas."""
    ventana = int(0.01 * SR)
    n = len(wav) // ventana
    rms = np.sqrt(np.mean(wav[: n * ventana].reshape(n, ventana) ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(rms / (rms.max() + 1e-12))
    voz = db > -38
    idx = np.flatnonzero(voz)
    ini = max(0, idx[0] - 3) * ventana            # 30 ms antes
    fin = min(n, idx[-1] + 9) * ventana           # 90 ms de cola
    # pausas internas: tramos sin voz de más de MAX_SILENCIO_INTERNO
    i = idx[0]
    out = []
    pos = ini
    while i <= idx[-1]:
        if not voz[i]:
            j = i
            while j <= idx[-1] and not voz[j]:
                j += 1
            largo = (j - i) * ventana / SR
            if largo > MAX_SILENCIO_INTERNO + 0.05:
                corte_ini = i * ventana + int(MAX_SILENCIO_INTERNO / 2 * SR)
                corte_fin = j * ventana - int(MAX_SILENCIO_INTERNO / 2 * SR)
                out.append(wav[pos:corte_ini])
                pos = corte_fin
            i = j
        else:
            i += 1
    out.append(wav[pos:fin])
    res = np.concatenate(out)
    f = int(0.008 * SR)                            # fundidos cortos para que no haya clics
    res[:f] *= np.linspace(0, 1, f)
    res[-f:] *= np.linspace(1, 0, f)
    return res


def normal(t):
    t = unicodedata.normalize("NFD", t.lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    t = t.replace("vemkuro", "vemquro").replace("bemkuro", "vemquro").replace("bemcro", "vemquro")
    return re.sub(r"[^a-z0-9]", "", t)


def tiempos_palabras(modelo, wav, texto_guion):
    """Tiempo de cada palabra del guion, alineando contra lo que oye Whisper."""
    w16 = signal.resample_poly(wav, 1, 3).astype(np.float32)
    segs, _ = modelo.transcribe(w16, language="es", beam_size=5, word_timestamps=True)
    oidas = [(p.word, p.start, p.end) for s in segs for p in (s.words or [])]
    # una "cadena" de letras de Whisper con el tiempo de cada letra
    letras_w, t_w = [], []
    for w, s, e in oidas:
        n = normal(w)
        for k, c in enumerate(n):
            letras_w.append(c)
            t_w.append(s + (e - s) * (k + 0.5) / max(1, len(n)))
    tokens = texto_guion.split()
    letras_g, dueno = [], []
    for i, tok in enumerate(tokens):
        for c in normal(tok):
            letras_g.append(c)
            dueno.append(i)
    sm = difflib.SequenceMatcher(None, "".join(letras_g), "".join(letras_w), autojunk=False)
    t_g = [None] * len(letras_g)
    for a, b, size in sm.get_matching_blocks():
        for k in range(size):
            t_g[a + k] = t_w[b + k]
    dur = len(wav) / SR
    palabras = []
    for i, tok in enumerate(tokens):
        ts = [t_g[k] for k in range(len(letras_g)) if dueno[k] == i and t_g[k] is not None]
        palabras.append({"w": tok, "s": min(ts) if ts else None, "e": max(ts) if ts else None})
    # palabras sin match (ej. un nombre raro): se reparten en partes iguales entre sus vecinas
    i = 0
    while i < len(palabras):
        if palabras[i]["s"] is not None:
            i += 1
            continue
        j = i
        while j < len(palabras) and palabras[j]["s"] is None:
            j += 1
        ant = palabras[i - 1]["e"] if i > 0 else 0.0
        sig = palabras[j]["s"] if j < len(palabras) else dur
        paso = max(0.08, (sig - ant) / (j - i))
        for k in range(i, j):
            palabras[k]["s"], palabras[k]["e"] = ant + paso * (k - i), ant + paso * (k - i + 1)
        i = j
    # inicio de palabra un poco antes (el oído espera ver la palabra al oírla)
    for p in palabras:
        p["s"] = max(0.0, p["s"] - 0.06)
        p["e"] = min(dur, p["e"] + 0.04)
    return palabras, " ".join(w for w, _, _ in oidas)


def main():
    from faster_whisper import WhisperModel
    modelo = WhisperModel("/home/user/hf-models/faster-whisper-small", device="cpu", compute_type="int8")
    pedido = json.loads((AQUI / "pedido_voz.json").read_text(encoding="utf-8"))
    guion = json.loads((AQUI / "guion.json").read_text(encoding="utf-8"))["lineas"]
    piezas, lineas, t = [np.zeros(int(INICIO * SR), np.float32)], [], INICIO
    for item, texto in zip(pedido, guion):
        wav, sr = sf.read(item["wav"], dtype="float32")
        if wav.ndim > 1:
            wav = wav.mean(axis=1)
        wav = recortar(a_48k(wav, sr))
        palabras, oido = tiempos_palabras(modelo, wav, texto)
        dur = len(wav) / SR
        lineas.append({"id": item["id"], "texto": texto, "inicio": round(t, 3), "fin": round(t + dur, 3),
                       "palabras": [{"w": p["w"], "s": round(t + p["s"], 3), "e": round(t + p["e"], 3)} for p in palabras],
                       "oido": oido})
        print(f'{item["id"]} {t:6.2f}-{t + dur:6.2f}  {texto}  | oído: {oido}', flush=True)
        piezas.append(wav)
        t += dur
        pausa = PAUSA_PARTE if item["id"] in FIN_DE_PARTE else PAUSA
        if item is not pedido[-1]:
            piezas.append(np.zeros(int(pausa * SR), np.float32))
            t += pausa
    piezas.append(np.zeros(int(COLA * SR), np.float32))
    total = np.concatenate(piezas)
    (AQUI / "build").mkdir(exist_ok=True)
    sf.write(AQUI / "build" / "narracion.wav", total, SR)
    dur_total = len(total) / SR
    (AQUI / "tiempos.json").write_text(json.dumps({"duracion": round(dur_total, 3), "lineas": lineas},
                                                  ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"narración: {dur_total:.2f} s")


if __name__ == "__main__":
    main()
