#!/usr/bin/env python3
"""Música original, efectos y mezcla final del video de Vemquro (todo generado por código: sin derechos de terceros).

Uso (con el entorno de voz): python musica.py [clics.json]
Lee tiempos.json y build/narracion.wav. Si existe build/web/meta.json, usa los tiempos reales de los clics.
Escribe build/mezcla.wav (48 kHz estéreo, sin normalizar) y la normalización final la hace hacer_video.sh.
"""

import json
import re
import sys
import unicodedata
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy import signal

AQUI = Path(__file__).resolve().parent
SR = 48000
RNG = np.random.default_rng(20261120)
BPM = 100
BEAT = 60 / BPM
COMPAS = 4 * BEAT


def normal(w):
    w = unicodedata.normalize("NFD", w.lower())
    return re.sub(r"[^a-z0-9]", "", "".join(c for c in w if unicodedata.category(c) != "Mn"))


def nota(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def poner(out, onda, t0, gain=1.0, pan=0.0):
    i = int(round(t0 * SR))
    if i >= out.shape[0] or i + len(onda) <= 0:
        return
    if i < 0:
        onda, i = onda[-i:], 0
    m = min(len(onda), out.shape[0] - i)
    l, r = np.sqrt(0.5 * (1 - pan)), np.sqrt(0.5 * (1 + pan))
    out[i:i + m, 0] += onda[:m] * gain * l * 1.414
    out[i:i + m, 1] += onda[:m] * gain * r * 1.414


def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(t / max(a, 1e-4), 1) * np.exp(-t / d)


# ------------------------------------------------------------------ instrumentos
def bombo(gain=1.0):
    t = np.arange(int(0.45 * SR)) / SR
    f = 42 + 95 * np.exp(-t / 0.035)
    cuerpo = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.2)
    clic = RNG.standard_normal(len(t)) * np.exp(-t / 0.004) * 0.25
    return (np.tanh(1.6 * (cuerpo + clic)) * gain).astype(np.float32)


def palmas():
    t = np.arange(int(0.35 * SR)) / SR
    ruido = RNG.standard_normal(len(t))
    b, a = signal.butter(2, [900 / (SR / 2), 6500 / (SR / 2)], btype="band")
    ruido = signal.lfilter(b, a, ruido)
    e = np.zeros_like(t)
    for k, d in enumerate((0.0, 0.011, 0.022)):            # tres golpes juntos = palmas
        e += np.where(t >= d, np.exp(-(t - d) / (0.012 if k < 2 else 0.09)), 0)
    return (ruido * e * 0.55).astype(np.float32)


def hat(abierto=False):
    t = np.arange(int((0.22 if abierto else 0.05) * SR)) / SR
    ruido = RNG.standard_normal(len(t))
    b, a = signal.butter(2, 7500 / (SR / 2), btype="high")
    return (signal.lfilter(b, a, ruido) * np.exp(-t / (0.07 if abierto else 0.014))).astype(np.float32)


def pad(notas, largo):
    n = int(largo * SR)
    t = np.arange(n) / SR
    o = np.zeros(n)
    for m in notas:
        for det in (-0.07, 0.0, 0.08):                       # tres sierras desafinadas
            f = nota(m) * 2 ** (det / 12)
            o += signal.sawtooth(2 * np.pi * f * t + RNG.uniform(0, 6.28))
    b, a = signal.butter(2, 1100 / (SR / 2), btype="low")
    o = signal.lfilter(b, a, o)
    e = np.minimum(t / 0.6, 1) * np.minimum((largo - t) / 0.5, 1)
    return (o * e / (3 * len(notas))).astype(np.float32)


def bajo(m, largo):
    n = int(largo * SR)
    t = np.arange(n) / SR
    o = np.sin(2 * np.pi * nota(m) * t) + 0.25 * np.sin(4 * np.pi * nota(m) * t)
    return (np.tanh(1.3 * o) * env(n, 0.008, largo * 0.8) * 0.9).astype(np.float32)


def pluck(m):
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = nota(m)
    o = signal.sawtooth(2 * np.pi * f * t, 0.5) * 0.7 + 0.3 * np.sin(2 * np.pi * 2 * f * t)
    return (o * env(n, 0.003, 0.11)).astype(np.float32)


# ------------------------------------------------------------------ efectos
def whoosh(largo=0.7, sube=True):
    n = int(largo * SR)
    t = np.arange(n) / SR
    ruido = RNG.standard_normal(n)
    out = np.zeros(n)
    trozos = 24
    for k in range(trozos):                                  # barrido de un pasabanda
        a_, b_ = k * n // trozos, (k + 1) * n // trozos
        x = k / trozos if sube else 1 - k / trozos
        fc = 300 + 5200 * x ** 1.6
        b, a = signal.butter(2, [fc * 0.6 / (SR / 2), min(0.95, fc * 1.4 / (SR / 2))], btype="band")
        out[a_:b_] = signal.lfilter(b, a, ruido[a_:b_])
    e = np.sin(np.pi * np.clip(t / largo, 0, 1)) ** 1.5
    return (out * e * 0.9).astype(np.float32)


def clic_mouse():
    n = int(0.05 * SR)
    t = np.arange(n) / SR
    ruido = RNG.standard_normal(n)
    b, a = signal.butter(2, [1800 / (SR / 2), 9000 / (SR / 2)], btype="band")
    s1 = signal.lfilter(b, a, ruido) * np.exp(-t / 0.0025)
    s2 = np.roll(signal.lfilter(b, a, RNG.standard_normal(n)) * np.exp(-t / 0.002), int(0.028 * SR)) * 0.6
    return ((s1 + s2) * 0.9).astype(np.float32)


def pop():
    n = int(0.16 * SR)
    t = np.arange(n) / SR
    f = 520 + 900 * np.exp(-t / 0.02)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.05) * 0.7).astype(np.float32)


def golpe():
    n = int(2.6 * SR)
    t = np.arange(n) / SR
    sub = np.sin(2 * np.pi * np.cumsum(38 + 70 * np.exp(-t / 0.06)) / SR) * np.exp(-t / 0.9)
    ruido = RNG.standard_normal(n)
    b, a = signal.butter(2, 3500 / (SR / 2), btype="high")
    plato = signal.lfilter(b, a, ruido) * np.exp(-t / 0.8) * 0.18
    return (np.tanh(1.4 * sub) * 0.9 + plato).astype(np.float32)


def reverb(x, segundos=1.6, mezcla=0.22):
    n = int(segundos * SR)
    t = np.arange(n) / SR
    ir = RNG.standard_normal(n) * np.exp(-t / (segundos / 6.5))
    b, a = signal.butter(1, 5000 / (SR / 2), btype="low")
    ir = signal.lfilter(b, a, ir)
    ir /= np.sqrt(np.sum(ir ** 2))
    wet = np.stack([signal.fftconvolve(x[:, c], ir)[: len(x)] for c in range(2)], axis=1)
    return x + wet * mezcla


# ------------------------------------------------------------------ armado
def main():
    tiempos = json.loads((AQUI / "tiempos.json").read_text(encoding="utf-8"))
    L = {l["id"]: l for l in tiempos["lineas"]}

    def T(i, palabra):
        return next(p["s"] for p in L[i]["palabras"] if normal(p["w"]) == normal(palabra))

    voz, sr = sf.read(AQUI / "build" / "narracion.wav", dtype="float32")
    assert sr == SR
    fin_total = L["l18"]["fin"] + 3.15
    n = int(fin_total * SR) + SR
    mus = np.zeros((n, 2), np.float32)

    corte = L["l13"]["inicio"] - 0.2          # pausa para los precios
    vuelta = L["l17"]["inicio"] - 0.1          # vuelve el ritmo para el cierre
    golpe_t = L["l18"]["fin"] + 0.2
    acordes = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]   # Am F C G
    raices = [45, 41, 36, 43]
    k_, c_, hc, ho = bombo(), palmas(), hat(), hat(True)
    compases = int(np.ceil(fin_total / COMPAS)) + 1
    for m in range(compases):
        t0 = m * COMPAS
        if t0 > golpe_t + 0.5:
            break
        ac, raiz = acordes[m % 4], raices[m % 4]
        en_corte = corte <= t0 < vuelta
        poner(mus, pad(ac, COMPAS * 1.15), t0, 0.5 if not en_corte else 0.62)
        poner(mus, bajo(raiz - 12 if raiz > 40 else raiz, COMPAS * 0.95), t0, 0.32 if not en_corte else 0.16)
        for b in range(8):                                    # arpegio en corcheas
            tt = t0 + b * BEAT / 2
            if en_corte and b % 2:
                continue
            nn = ac[(b * 2 + m) % 3] + (12 if b % 4 == 3 else 0)
            poner(mus, pluck(nn + 12), tt, 0.16, pan=0.35 if b % 2 else -0.35)
            poner(mus, pluck(nn + 12), tt + BEAT * 0.75, 0.05, pan=-0.6 if b % 2 else 0.6)    # eco
        if t0 < 2.35 or en_corte:
            for b in range(16):                               # solo hats en la intro y en la pausa
                poner(mus, hc, t0 + b * BEAT / 4, (0.05 if b % 2 else 0.08) * (0.6 if en_corte else 1), pan=0.2)
            continue
        for b in (0, 2, 2.75):
            poner(mus, k_, t0 + b * BEAT, 0.8)
        for b in (1, 3):
            poner(mus, c_, t0 + b * BEAT, 0.42, pan=0.05)
        for b in range(16):
            vel = (0.07 if b % 2 else 0.11) * RNG.uniform(0.8, 1.1)
            poner(mus, hc, t0 + b * BEAT / 4 + (0.012 if b % 2 else 0), vel, pan=0.25)
        poner(mus, ho, t0 + 3.5 * BEAT, 0.07, pan=-0.25)

    # subida antes del cierre y golpe final
    sube = whoosh(1.6, True)
    poner(mus, sube, golpe_t - 1.6, 0.5)
    poner(mus, golpe(), golpe_t, 0.9)
    poner(mus, pad(acordes[0], 3.2), golpe_t, 0.6)
    mus = reverb(mus)
    # fundido de entrada corto y salida
    nfin = int(fin_total * SR)
    mus[nfin - int(0.6 * SR):nfin] *= np.linspace(1, 0, int(0.6 * SR))[:, None]
    mus[nfin:] = 0

    # ---------------------------------------------------------- efectos sincronizados
    sfx = np.zeros_like(mus)
    meta_p = AQUI / "build" / "web" / "meta.json"
    clics = None
    if meta_p.exists():
        clics = json.loads(meta_p.read_text(encoding="utf-8")).get("clics")
    if not clics:
        clics = [T("l05", "Celulares") + 0.05, T("l06", "Samsung") + 0.05, T("l11", "clic") + 0.05]
    for t in clics:
        poner(sfx, clic_mouse(), t, 0.5, pan=0.1)
    for t, g in ((0.0, 0.25), (L["l13"]["inicio"] - 0.15, 0.4), (L["l18"]["fin"] + 0.05, 0.35)):
        poner(sfx, whoosh(0.75, False), t, g)
    for p in (T("l13", "20") - 0.15, L["l14"]["inicio"] + 0.05, L["l16"]["inicio"] + 0.05):
        poner(sfx, pop(), p, 0.3)
    poner(sfx, whoosh(0.35, True), T("l18", "WEB") - 0.12, 0.3)
    poner(sfx, pop(), T("l18", "WEB"), 0.4)

    # ---------------------------------------------------------- mezcla: la música baja cuando habla la voz
    v = np.zeros(n, np.float32)
    v[: len(voz)] = voz
    ventana = int(0.02 * SR)
    rms = np.sqrt(signal.lfilter(np.ones(ventana) / ventana, 1, v ** 2) + 1e-12)
    activo = np.clip((20 * np.log10(rms + 1e-9) + 50) / 20, 0, 1)        # 0 = silencio, 1 = voz
    sube_ = np.exp(-1 / (0.03 * SR)); baja_ = np.exp(-1 / (0.35 * SR))
    env_ = signal.lfilter([1 - baja_], [1, -baja_], activo)             # suelta despacio
    env_ = np.maximum(env_, signal.lfilter([1 - sube_], [1, -sube_], activo))
    duck = 1 - 0.7 * np.clip(env_, 0, 1)
    voz_proc = signal.lfilter(*signal.butter(2, 75 / (SR / 2), btype="high"), v)
    mezcla = mus * duck[:, None] * 0.55 + sfx + voz_proc[:, None] * 1.0
    pico = np.max(np.abs(mezcla))
    mezcla = mezcla / max(pico, 1e-6) * 0.89
    sf.write(AQUI / "build" / "mezcla.wav", mezcla[: int(fin_total * SR)], SR, subtype="PCM_24")
    print(f"mezcla: {fin_total:.2f} s, clics en {', '.join(f'{c:.2f}' for c in clics)}")


if __name__ == "__main__":
    main()
