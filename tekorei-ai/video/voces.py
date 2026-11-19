#!/usr/bin/env python3
"""Voces, música, efectos y línea de tiempo de un video de tekorei.ai.

Uso:  python3 voces.py dia01.json
Salida en build/: audio_ig.wav, audio_tt.wav, timeline_ig.json, timeline_tt.json

Voces (gratis, licencia comercial):
- Por defecto (TEKOREI_VOZ=qwen): voces inventadas y fijas de Qwen3-TTS (Apache-2.0).
  Cada personaje clona siempre su muestra maestra de voces/<personaje>.wav (ver voz_qwen.py).
  Kori lleva +1 semitono y un 30 % de señal robotizada.
- Respaldo (TEKOREI_VOZ=clasico): SVOX Pico para Kori y MBROLA mx2 para Nico.
"""

import json
import os
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
FPS = 30
AQUI = Path(__file__).resolve().parent
BUILD = AQUI / "build"
RNG = np.random.default_rng(7)
MOTOR = os.environ.get("TEKOREI_VOZ", "qwen")
PY_TTS = os.environ.get("TEKOREI_PY", "/home/user/tts-venv/bin/python")


# ---------------------------------------------------------------- utilidades de audio

def run(cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def leer(path):
    sr, x = wavfile.read(path)
    if np.issubdtype(x.dtype, np.integer):
        x = x.astype(np.float32) / np.iinfo(x.dtype).max
    x = x.astype(np.float32)
    if x.ndim > 1:
        x = x.mean(axis=1)
    if sr != SR:
        x = signal.resample_poly(x, SR, sr).astype(np.float32)
    return x


def escribir(path, x):
    x = np.clip(x, -1, 1)
    wavfile.write(path, SR, (x * 32767).astype(np.int16))


def recortar_silencio(x, umbral_db=-42, margen=0.025):
    env = np.abs(x)
    thr = env.max() * 10 ** (umbral_db / 20)
    idx = np.where(env > thr)[0]
    if len(idx) == 0:
        return x
    a = max(0, idx[0] - int(margen * SR))
    b = min(len(x), idx[-1] + int(margen * SR))
    return x[a:b]


def igualar_rms(x, objetivo_db=-19):
    activo = x[np.abs(x) > np.abs(x).max() * 0.05]
    rms = np.sqrt(np.mean(activo ** 2)) if len(activo) else 1e-6
    return x * (10 ** (objetivo_db / 20) / rms)


# ---------------------------------------------------------------- voces

def voz_kori(texto, salida):
    crudo = salida.with_suffix(".pico.wav")
    run(["pico2wave", "-l", "es-ES", "-w", str(crudo), texto])
    run(["sox", str(crudo), "-r", str(SR), str(salida),
         "highpass", "150", "pitch", "320", "tempo", "-s", "1.14",
         "equalizer", "2800", "1.2q", "4", "equalizer", "300", "1q", "-3",
         "chorus", "0.6", "0.9", "25", "0.4", "0.25", "2", "-t",
         "reverb", "10", "50", "30", "50", "0", "-9", "gain", "-n", "-3"])
    x = leer(salida)
    t = np.arange(len(x)) / SR
    x = x * (0.88 + 0.12 * np.sin(2 * np.pi * 62 * t))  # brillo robótico sutil
    return x


def voz_nico(texto, salida):
    pho = salida.with_suffix(".pho")
    crudo = salida.with_suffix(".mbrola.wav")
    r = subprocess.run(["espeak-ng", "-v", "mb-mx2", "-s", "158", "-p", "58", "--pho", "-q", texto],
                       capture_output=True, text=True, check=True)
    # La base mx2 no trae las vocales marcadas como "e/" u "o/": se usan las normales.
    pho.write_text(re.sub(r"^([A-Za-z]+)/", r"\1", r.stdout, flags=re.M))
    run(["mbrola", "/usr/share/mbrola/mx2/mx2", str(pho), str(crudo)])
    run(["sox", str(crudo), "-r", str(SR), str(salida),
         "highpass", "80", "equalizer", "180", "1q", "-2", "equalizer", "3200", "1q", "4",
         "tempo", "-s", "1.07",
         "compand", "0.01,0.15", "-70,-70,-40,-24,-10,-8,0,-4", "-2",
         "reverb", "8", "50", "25", "50", "0", "-9", "gain", "-n", "-3"])
    return leer(salida)


def efecto_nico(entrada, salida):
    """Voz humana: solo limpieza y un compresor suave."""
    run(["sox", str(entrada), "-r", str(SR), str(salida),
         "highpass", "70", "equalizer", "3500", "1q", "2",
         "compand", "0.01,0.2", "-70,-70,-40,-30,-12,-10,0,-6", "-2", "gain", "-n", "-3"])
    return leer(salida)


def efecto_kori(entrada, salida):
    """+1 semitono y 30 % de señal robotizada (filtro robotize de FFmpeg), siempre igual."""
    alto = salida.with_suffix(".alto.wav")
    run(["sox", str(entrada), "-r", str(SR), str(alto), "highpass", "90", "pitch", "100"])
    run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(alto), "-filter_complex",
         "[0:a]asplit[a][b];"
         "[b]afftfilt=real='hypot(re,im)*sin(0)':imag='hypot(re,im)*cos(0)':win_size=512:overlap=0.75[r];"
         "[a][r]amix=inputs=2:weights='0.7 0.3':normalize=0[m]",
         "-map", "[m]", "-ar", str(SR), "-ac", "1", str(salida)])
    return leer(salida)


def voces_qwen(lineas, nombres):
    """Genera todas las líneas con las voces fijas (en el entorno de Qwen3-TTS) y aplica el efecto de cada personaje."""
    pedido = [{"id": n, "who": l["who"], "text": l["tts"]} for l, n in zip(lineas, nombres)]
    ruta = BUILD / "pedido_voces.json"
    ruta.write_text(json.dumps(pedido, ensure_ascii=False), encoding="utf-8")
    subprocess.run([PY_TTS, str(AQUI / "voz_qwen.py"), "generar", str(ruta), str(BUILD / "tts_cache")], check=True)
    pedido = json.loads(ruta.read_text(encoding="utf-8"))
    salida = []
    for item in pedido:
        destino = BUILD / f"{item['id']}.wav"
        salida.append(efecto_kori(item["wav"], destino) if item["who"] == "kori" else efecto_nico(item["wav"], destino))
    return salida


# ---------------------------------------------------------------- tiempos de palabras

def normalizar(w):
    return re.sub(r"[^\wáéíóúüñ]", "", w.lower())


ESPECIALES = {"pdf": 4, "1": 2, "dm": 2, "ia": 2}


def silabas(palabra):
    w = normalizar(palabra)
    if w in ESPECIALES:
        return ESPECIALES[w]
    grupos = re.findall(r"[aeiouáéíóúü]+", w)
    n = len(grupos)
    for g in grupos:  # hiatos: dos vocales fuertes o vocal débil con tilde
        for a, b in zip(g, g[1:]):
            if (a in "aeoáéó" and b in "aeoáéó") or a in "íú" or b in "íú":
                n += 1
    return max(1, n)


def segmentos_de_voz(x, hueco_min=0.14):
    hop = int(0.01 * SR)
    win = int(0.03 * SR)
    e = np.sqrt(np.convolve(x ** 2, np.ones(win) / win, mode="same"))[::hop]
    activo = e > e.max() * 0.07
    segs, ini = [], None
    for i, a in enumerate(activo):
        if a and ini is None:
            ini = i
        if not a and ini is not None:
            segs.append([ini, i])
            ini = None
    if ini is not None:
        segs.append([ini, len(activo)])
    unidos = []
    for s in segs:
        if unidos and (s[0] - unidos[-1][1]) * 0.01 < hueco_min:
            unidos[-1][1] = s[1]
        else:
            unidos.append(s)
    unidos = [s for s in unidos if (s[1] - s[0]) * 0.01 > 0.06]
    return [(a * 0.01, b * 0.01) for a, b in unidos]


def tiempos_palabras(palabras, segs):
    pesos = np.array([silabas(p) + 0.35 for p in palabras])
    cum = np.concatenate([[0], np.cumsum(pesos)]) / pesos.sum()
    voz_total = sum(b - a for a, b in segs)
    # A qué frontera entre palabras corresponde cada pausa detectada.
    fronteras = []
    acumulado = 0.0
    previo = 0
    for k in range(len(segs) - 1):
        acumulado += segs[k][1] - segs[k][0]
        f_hueco = acumulado / voz_total
        mejor, mejor_costo = None, 9
        for j in range(previo + 1, len(palabras)):
            costo = abs(cum[j] - f_hueco)
            if re.search(r"[,.…?!;:]$", palabras[j - 1]):
                costo -= 0.08
            if costo < mejor_costo:
                mejor, mejor_costo = j, costo
        if mejor is None:
            break
        fronteras.append(mejor)
        previo = mejor
    grupos = []
    inicio = 0
    for f in fronteras + [len(palabras)]:
        grupos.append(list(range(inicio, f)))
        inicio = f
    segs = segs[:len(grupos)]
    if len(segs) < len(grupos):  # pausas de más: todo a un segmento
        segs = [(segs[0][0], segs[-1][1])]
        grupos = [list(range(len(palabras)))]
    tiempos = [None] * len(palabras)
    for (a, b), idx in zip(segs, grupos):
        if not idx:
            continue
        w = pesos[idx]
        c = np.concatenate([[0], np.cumsum(w)]) / w.sum()
        for n, i in enumerate(idx):
            tiempos[i] = (a + c[n] * (b - a), a + c[n + 1] * (b - a))
    return tiempos


def armar_bloques(palabras, resaltar):
    """Grupos de 1 a 3 palabras para los subtítulos."""
    bloques, actual = [], []
    for i, p in enumerate(palabras):
        largo = sum(len(palabras[j]) + 1 for j in actual) + len(p)
        corta = actual and (len(actual) >= 3 or largo > 17 or re.search(r"[,.…?!;:]$", palabras[actual[-1]]))
        if corta:
            bloques.append(actual)
            actual = []
        actual.append(i)
    if actual:
        bloques.append(actual)
    return bloques


# ---------------------------------------------------------------- música y efectos

def nota(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def musica(dur):
    n = int(dur * SR)
    out = np.zeros(n, dtype=np.float32)
    bpm = 86
    beat = 60 / bpm
    compas = 4 * beat
    acordes = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]]  # Fmaj7 Em7 Dm7 Cmaj7
    bajos = [41, 40, 38, 36]

    def poner(onda, t0, gain=1.0):
        i = int(t0 * SR)
        if i >= n:
            return
        m = min(len(onda), n - i)
        out[i:i + m] += onda[:m] * gain

    def piano(f, largo, vel):
        t = np.arange(int(largo * SR)) / SR
        det = 1 + RNG.uniform(-0.002, 0.002)
        o = np.sin(2 * np.pi * f * det * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.08 * np.sin(6 * np.pi * f * t)
        env = np.minimum(t / 0.012, 1) * np.exp(-t / 1.1)
        trem = 1 + 0.12 * np.sin(2 * np.pi * 4.2 * t)
        return (o * env * trem * vel).astype(np.float32)

    def bombo():
        t = np.arange(int(0.35 * SR)) / SR
        f = 45 + 75 * np.exp(-t / 0.04)
        return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.12)).astype(np.float32)

    def caja():
        t = np.arange(int(0.25 * SR)) / SR
        ruido = RNG.standard_normal(len(t))
        b, a = signal.butter(2, [1200 / (SR / 2), 5000 / (SR / 2)], btype="band")
        ruido = signal.lfilter(b, a, ruido)
        return ((0.6 * ruido + 0.4 * np.sin(2 * np.pi * 185 * t)) * np.exp(-t / 0.07)).astype(np.float32)

    def platillo():
        t = np.arange(int(0.06 * SR)) / SR
        ruido = RNG.standard_normal(len(t))
        b, a = signal.butter(2, 7000 / (SR / 2), btype="high")
        return (signal.lfilter(b, a, ruido) * np.exp(-t / 0.018)).astype(np.float32)

    k, c, h = bombo(), caja(), platillo()
    total_compases = int(np.ceil(dur / compas)) + 1
    for m in range(total_compases):
        t0 = m * compas
        ac = acordes[m % 4]
        for nn in ac:
            poner(piano(nota(nn), compas * 1.1, 0.16), t0 + RNG.uniform(0, 0.012))
            poner(piano(nota(nn), compas * 0.6, 0.08), t0 + 2.5 * beat + RNG.uniform(0, 0.012))
        tb = np.arange(int(compas * SR)) / SR
        bajo = np.sin(2 * np.pi * nota(bajos[m % 4]) * tb)
        bajo = np.tanh(1.5 * bajo) * np.minimum(tb / 0.02, 1) * np.exp(-tb / 1.6) * 0.32
        poner(bajo.astype(np.float32), t0)
        for b_ in (0, 2.5):
            poner(k, t0 + b_ * beat, 0.55)
        for b_ in (1, 3):
            poner(c, t0 + b_ * beat, 0.22)
        for corchea in range(8):
            swing = 0.06 if corchea % 2 else 0.0
            poner(h, t0 + corchea * beat / 2 + swing, RNG.uniform(0.07, 0.13))
    # crujido de vinilo
    clicks = np.zeros(n, dtype=np.float32)
    pos = RNG.integers(0, n, size=int(dur * 9))
    clicks[pos] = RNG.uniform(0.05, 0.25, size=len(pos))
    b, a = signal.butter(2, [800 / (SR / 2), 6000 / (SR / 2)], btype="band")
    out += signal.lfilter(b, a, clicks).astype(np.float32) * 0.6
    b, a = signal.butter(2, 5200 / (SR / 2), btype="low")
    out = signal.lfilter(b, a, out).astype(np.float32)
    out = np.tanh(out * 1.4)
    fade = int(0.3 * SR)
    out[-fade:] *= np.linspace(1, 0, fade)
    return out / (np.abs(out).max() + 1e-9)


def sfx_whoosh():
    t = np.arange(int(0.38 * SR)) / SR
    ruido = RNG.standard_normal(len(t)).astype(np.float32)
    salida = np.zeros_like(ruido)
    for i in range(0, len(t), 256):
        frac = i / len(t)
        fc = 400 + 3800 * np.sin(np.pi * frac)
        b, a = signal.butter(2, [max(fc * 0.6, 80) / (SR / 2), min(fc * 1.6, 20000) / (SR / 2)], btype="band")
        salida[i:i + 256] = signal.lfilter(b, a, ruido[i:i + 256])
    return salida * np.sin(np.pi * t / t[-1]) ** 2 * 0.9


def sfx_pop():
    t = np.arange(int(0.12 * SR)) / SR
    f = 520 + 520 * np.exp(-t / 0.02)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.035)).astype(np.float32)


def sfx_ding():
    t = np.arange(int(0.9 * SR)) / SR
    return ((np.sin(2 * np.pi * 1046.5 * t) + 0.6 * np.sin(2 * np.pi * 1568 * t)) * np.exp(-t / 0.28) * 0.6).astype(np.float32)


def sfx_bip():
    """Bip-bup de Kori."""
    partes = []
    for f0, f1 in ((880, 1320), (1320, 990)):
        t = np.arange(int(0.07 * SR)) / SR
        f = np.linspace(f0, f1, len(t))
        partes.append(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / t[-1]))
        partes.append(np.zeros(int(0.025 * SR)))
    return (np.concatenate(partes) * 0.5).astype(np.float32)


def sfx_tecla():
    t = np.arange(int(0.03 * SR)) / SR
    ruido = RNG.standard_normal(len(t))
    b, a = signal.butter(2, [1800 / (SR / 2), 6000 / (SR / 2)], btype="band")
    return (signal.lfilter(b, a, ruido) * np.exp(-t / 0.006)).astype(np.float32)


# ---------------------------------------------------------------- armado

def boca_por_cuadro(x, inicio, cuadros, p90):
    """Apertura de boca 0..1 por cuadro, a partir del volumen de la voz."""
    valores = np.zeros(cuadros, dtype=np.float32)
    paso = SR / FPS
    for f in range(cuadros):
        t = f / FPS - inicio
        if t < -0.05 or t > len(x) / SR + 0.05:
            continue
        a = int(max(0, t * SR - paso * 0.6))
        b = int(min(len(x), t * SR + paso * 0.6))
        if b > a:
            valores[f] = np.sqrt(np.mean(x[a:b] ** 2))
    valores = np.clip(valores / (p90 + 1e-9), 0, 1.25) ** 0.8
    suave = np.zeros_like(valores)
    for f in range(cuadros):  # abre rápido, cierra más lento
        prev = suave[f - 1] if f else 0
        suave[f] = valores[f] if valores[f] > prev else prev * 0.55 + valores[f] * 0.45
    return np.round(np.clip(suave, 0, 1), 3)


def construir(guion_path):
    BUILD.mkdir(exist_ok=True)
    guion = json.loads(Path(guion_path).read_text(encoding="utf-8"))
    comunes = guion["lineas"]

    # Generar todas las voces una vez.
    todas = comunes + [guion["cierre"]["ig"], guion["cierre"]["tt"]]
    nombres = [f"voz_{i:02d}" for i in range(len(comunes))] + ["voz_cierre_ig", "voz_cierre_tt"]
    if MOTOR == "qwen":
        crudos = voces_qwen(todas, nombres)
    else:
        crudos = [voz_kori(l["tts"], BUILD / f"{n}.wav") if l["who"] == "kori" else voz_nico(l["tts"], BUILD / f"{n}.wav")
                  for l, n in zip(todas, nombres)]
    listos = [igualar_rms(recortar_silencio(x)) for x in crudos]
    audios = listos[:len(comunes)]
    cierres = {"ig": listos[-2], "tt": listos[-1]}

    for version in ("ig", "tt"):
        lineas = comunes + [guion["cierre"][version]]
        voces = audios + [cierres[version]]
        t = 0.12
        items = []
        for i, (l, x) in enumerate(zip(lineas, voces)):
            if i == len(lineas) - 1:
                t += 0.18
            dur = len(x) / SR
            palabras = l["cap"].split()
            segs = segmentos_de_voz(x)
            tw = tiempos_palabras(palabras, segs)
            hi = {h.lower() for h in l.get("hi", [])}
            words = [{"w": p, "s": round(t + a, 3), "e": round(t + b, 3), "hi": normalizar(p) in hi}
                     for p, (a, b) in zip(palabras, tw)]
            items.append({"who": l["who"], "shot": l["shot"], "expr": l["expr"], "start": round(t, 3),
                          "end": round(t + dur, 3), "words": words, "audio": x, "tarjeta": l.get("tarjeta")})
            pausa = 0.14 if l["cap"].endswith("?") else 0.2
            t += dur + pausa
        total = round(items[-1]["end"] + 1.35, 3)
        cuadros = int(np.ceil(total * FPS))

        # Subtítulos por bloques
        for k, it in enumerate(items):
            palabras = [w["w"] for w in it["words"]]
            bloques = armar_bloques(palabras, None)
            fin_linea = it["end"] + 0.2
            if k + 1 < len(items):
                fin_linea = min(fin_linea, items[k + 1]["start"] - 0.02)
            it["chunks"] = []
            for b, idx in enumerate(bloques):
                ini = it["words"][idx[0]]["s"]
                fin = it["words"][bloques[b + 1][0]]["s"] if b + 1 < len(bloques) else fin_linea
                it["chunks"].append({"s": ini, "e": round(fin, 3), "words": [it["words"][j] for j in idx]})

        # Planos: corte justo antes de cada línea
        shots = []
        for k, it in enumerate(items):
            ini = 0.0 if k == 0 else round(it["start"] - 0.06, 3)
            fin = total if k == len(items) - 1 else round(items[k + 1]["start"] - 0.06, 3)
            shots.append({"type": it["shot"], "start": ini, "end": fin, "line": k, "who": it["who"], "expr": it["expr"]})

        # Boca
        boca = {}
        for quien in ("kori", "nico"):
            propias = [it for it in items if it["who"] == quien]
            todo = np.concatenate([it["audio"] for it in propias])
            hop = SR // FPS
            rms = [np.sqrt(np.mean(todo[i:i + hop] ** 2)) for i in range(0, len(todo) - hop, hop)]
            p90 = np.percentile(rms, 90)
            curva = np.zeros(cuadros, dtype=np.float32)
            for it in propias:
                curva = np.maximum(curva, boca_por_cuadro(it["audio"], it["start"], cuadros, p90))
            boca[quien] = curva.tolist()

        # Eventos de las pantallas
        def palabra(it, objetivo):
            for w in it["words"]:
                if normalizar(w["w"]) == objetivo:
                    return w["s"]
            return it["start"]

        quiz = next(it for it in items if it["shot"] == "INSERT_QUIZ")
        cita = next(it for it in items if it["shot"] == "INSERT_CITE")
        cta = items[-1]
        eventos = {
            "quiz": {"start": quiz["start"], "type": round(quiz["start"] + 0.95, 3),
                     "ok": round(palabra(quiz, "tareas"), 3)},
            "cite": {"start": cita["start"], "chip": round(palabra(cita, "página") - 0.05, 3)},
            "cta": {"start": cta["start"], "word": round(palabra(cta, "examen"), 3), "tarjeta": cta["tarjeta"]},
        }

        # Mezcla
        n = int((total + 0.2) * SR)
        voz = np.zeros(n, dtype=np.float32)
        for it in items:
            i = int(it["start"] * SR)
            voz[i:i + len(it["audio"])] += it["audio"]
        sfx = np.zeros(n, dtype=np.float32)

        def poner(onda, t0, g):
            i = int(t0 * SR)
            if 0 <= i < n:
                m = min(len(onda), n - i)
                sfx[i:i + m] += onda[:m] * g

        poner(sfx_pop(), 0.02, 0.25)
        primera_kori = next(it for it in items if it["who"] == "kori")
        poner(sfx_bip(), primera_kori["start"] - 0.2, 0.18)
        for sh in shots:
            if sh["type"] in ("INSERT_QUIZ", "INSERT_CITE", "CTA"):
                poner(sfx_whoosh(), sh["start"] - 0.12, 0.22)
        for j in range(3):
            poner(sfx_tecla(), eventos["quiz"]["type"] + j * 0.09, 0.35)
        poner(sfx_ding(), eventos["quiz"]["ok"], 0.32)
        poner(sfx_ding(), eventos["cite"]["chip"], 0.18)
        poner(sfx_pop(), eventos["cta"]["start"] + 0.05, 0.4)
        poner(sfx_pop(), eventos["cta"]["word"], 0.3)

        mus = musica(n / SR)[:n]
        actividad = np.convolve(np.abs(voz), np.ones(int(0.25 * SR)) / int(0.25 * SR), mode="same")
        actividad = np.clip(actividad / (np.percentile(actividad, 95) + 1e-9), 0, 1)
        mus_gain = 0.16 - 0.08 * actividad
        mezcla = voz + mus * mus_gain + sfx
        mezcla = mezcla / (np.abs(mezcla).max() + 1e-9) * 0.89
        estereo = np.stack([mezcla, mezcla], axis=1)
        wavfile.write(BUILD / f"audio_{version}.wav", SR, (np.clip(estereo, -1, 1) * 32767).astype(np.int16))

        timeline = {
            "fps": FPS, "duration": total, "frames": cuadros, "version": version,
            "palabra": guion["palabra"], "gancho": guion["gancho"], "gancho_resaltar": guion["gancho_resaltar"],
            "shots": shots,
            "lines": [{k: v for k, v in it.items() if k != "audio"} for it in items],
            "mouth": boca, "events": eventos,
        }
        (BUILD / f"timeline_{version}.json").write_text(json.dumps(timeline, ensure_ascii=False), encoding="utf-8")
        print(f"{version}: {total:.2f} s, {cuadros} cuadros, cierre empieza en {cta['start']:.2f} s")


if __name__ == "__main__":
    construir(sys.argv[1] if len(sys.argv) > 1 else AQUI / "dia01.json")
