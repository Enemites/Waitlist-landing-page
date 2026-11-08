#!/usr/bin/env python3
"""Procedural trailer sound design + score synth, and a cue-sheet mixer (48 kHz stereo).

Library:   import synth; y = synth.render("impact", size=1.2)      -> (n, 2) float64
CLI:
  python3 audio/synth.py list                                   # generators and their params
  python3 audio/synth.py one impact -p size=1.2 -o hit.wav [--png hit.png]
  python3 audio/synth.py render audio/cues.example.json -o mix.wav [--stems DIR] [--png mix.png]
  python3 audio/synth.py pack -o sfx_pack.wav [--gap 1.0] [--dir DIR]   # every one-shot, 1 s apart

DSP: polyBLEP band-limited saw/square, ADSR + breakpoint envelopes, TPT state-variable filters with
per-sample cutoff (12/24 dB), RBJ biquad EQ, oversampled tanh saturation, convolution reverb from
generated decaying-noise IRs (frequency-dependent decay + early reflections), M/S width,
feed-forward compressor, VO-keyed sidechain ducking, 4x-oversampled true-peak lookahead limiter,
BS.1770 loudness normalisation (pyloudnorm). Everything is seeded and deterministic.
See audio/README.md for the cue-sheet format.
"""
from __future__ import annotations

import argparse
import inspect
import json
import math
import os
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
WORK = ROOT / ".work"
os.environ.setdefault("NUMBA_CACHE_DIR", str(WORK / "numba-cache"))

import numpy as np  # noqa: E402
import soundfile as sf  # noqa: E402
from scipy.ndimage import maximum_filter1d, minimum_filter1d  # noqa: E402
from scipy.signal import butter, lfilter, oaconvolve, resample_poly, sosfilt  # noqa: E402

try:
    from numba import njit
except ImportError:  # pure-python fallback (slow but identical results)
    def njit(*a, **k):
        if a and callable(a[0]):
            return a[0]
        return lambda f: f

SR = 48000
TAU = 2 * np.pi
GENERATORS: dict[str, dict] = {}


def gen(kind: str, hit: str = "start"):
    """Register a generator. kind: 'oneshot' | 'layer'. hit: where its sync point is ('start'|'end')."""
    def deco(fn):
        GENERATORS[fn.__name__] = {"fn": fn, "kind": kind, "hit": hit,
                                   "doc": (fn.__doc__ or "").strip().split("\n")[0]}
        return fn
    return deco


# =============================================================================
# music theory
# =============================================================================
NOTE = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6,
        "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}
QUALITY = {"": [0, 4, 7], "maj": [0, 4, 7], "m": [0, 3, 7], "min": [0, 3, 7], "5": [0, 7],
           "sus2": [0, 2, 7], "sus4": [0, 5, 7], "m7": [0, 3, 7, 10], "7": [0, 4, 7, 10],
           "maj7": [0, 4, 7, 11], "madd9": [0, 3, 7, 14], "add9": [0, 4, 7, 14], "m9": [0, 3, 7, 10, 14],
           "dim": [0, 3, 6], "aug": [0, 4, 8], "6": [0, 4, 7, 9], "m6": [0, 3, 7, 9]}


def midi(name: str | int | float) -> float:
    """'D2' -> 38. Numbers pass through."""
    if isinstance(name, (int, float)):
        return float(name)
    m = re.fullmatch(r"([A-G][#b]?)(-?\d)", name.strip())
    if not m:
        raise ValueError(f"bad note {name!r}")
    return float(NOTE[m.group(1)] + 12 * (int(m.group(2)) + 1))


def mtof(m) -> np.ndarray | float:
    return 440.0 * 2 ** ((np.asarray(m, float) - 69) / 12)


def parse_chord(sym: str) -> tuple[int, list[int], int]:
    """'Dm' / 'Bb' / 'A7' / 'Dm(add9)' / 'Dm/F' -> (root pc, intervals, bass pc)."""
    s = sym.replace("(", "").replace(")", "").strip()
    m = re.fullmatch(r"([A-G][#b]?)([^/]*)(?:/([A-G][#b]?))?", s)
    if not m:
        raise ValueError(f"bad chord {sym!r}")
    root = NOTE[m.group(1)]
    q = m.group(2)
    q = {"madd9": "madd9", "add9": "add9"}.get(q, q)
    if q not in QUALITY:
        raise ValueError(f"unknown chord quality {q!r} in {sym!r}")
    bass = NOTE[m.group(3)] if m.group(3) else root
    return root, QUALITY[q], bass


def voice_chord(sym: str, low: int = 50) -> list[int]:
    """Close voicing with every tone in [low, low+12): smooth voice-leading for free."""
    root, ivs, _ = parse_chord(sym)
    out = set()
    for iv in ivs:
        pc = (root + iv) % 12
        n = low + ((pc - low) % 12)
        out.add(n)
    return sorted(out)


def bass_note(sym: str, low: int = 31) -> int:
    _, _, bass = parse_chord(sym)
    return low + ((bass - low) % 12)


# =============================================================================
# DSP primitives
# =============================================================================

def _n(sec: float) -> int:
    return max(1, int(round(sec * SR)))


def _t(n: int) -> np.ndarray:
    return np.arange(n) / SR


def _rng(seed) -> np.random.Generator:
    return np.random.default_rng(seed)


def st(x: np.ndarray) -> np.ndarray:
    """Mono -> (n, 2)."""
    x = np.asarray(x, float)
    return x if x.ndim == 2 else np.stack([x, x], 1)


def mono(x: np.ndarray) -> np.ndarray:
    return x if x.ndim == 1 else x.mean(axis=1)


def _farr(f, n: int) -> np.ndarray:
    if np.isscalar(f):
        return np.full(n, float(f))
    f = np.asarray(f, float)
    if len(f) == n:
        return f
    return np.interp(np.linspace(0, len(f) - 1, n), np.arange(len(f)), f)


def _phase(f, n, ph0=0.0):
    dt = _farr(f, n) / SR
    ph = (ph0 + np.concatenate(([0.0], np.cumsum(dt[:-1])))) % 1.0
    return ph, np.clip(np.abs(dt), 1e-9, 0.5)


def _blep(t, dt):
    y = np.zeros_like(t)
    m = t < dt
    x = t[m] / dt[m]
    y[m] = x + x - x * x - 1.0
    m = t > 1.0 - dt
    x = (t[m] - 1.0) / dt[m]
    y[m] = x * x + x + x + 1.0
    return y


def sine(f, n, ph0=0.0):
    p, _ = _phase(f, n, ph0)
    return np.sin(TAU * p)


def saw(f, n, ph0=0.0):
    """polyBLEP band-limited sawtooth (f may be an array for glides)."""
    p, dt = _phase(f, n, ph0)
    return 2.0 * p - 1.0 - _blep(p, dt)


def square(f, n, pw=0.5, ph0=0.0):
    """polyBLEP band-limited pulse."""
    p, dt = _phase(f, n, ph0)
    y = np.where(p < pw, 1.0, -1.0)
    return y + _blep(p, dt) - _blep((p - pw) % 1.0, dt)


def tri(f, n, ph0=0.0):
    p, _ = _phase(f, n, ph0)
    return 2.0 * np.abs(2.0 * p - 1.0) - 1.0


def supersaw(f, n, voices=5, detune=12.0, spread=0.8, rng=None, vib=None):
    """Detuned saw stack spread across the stereo field -> (n, 2). detune in cents (total +-)."""
    rng = rng or _rng(0)
    fa = _farr(f, n)
    if vib is not None:
        fa = fa * vib
    L = np.zeros(n)
    R = np.zeros(n)
    for i in range(voices):
        d = 0.0 if voices == 1 else (i - (voices - 1) / 2) / ((voices - 1) / 2)
        s = saw(fa * 2 ** (d * detune / 1200), n, rng.random())
        th = (d * spread + 1) * np.pi / 4
        L += s * np.cos(th)
        R += s * np.sin(th)
    return np.stack([L, R], 1) * (np.sqrt(2) / np.sqrt(voices))


def white(n, rng):
    return rng.standard_normal(n)


def _colored(n, rng, power):
    X = np.fft.rfft(rng.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / SR)
    f[0] = f[1] if n > 1 else 1.0
    X /= f ** (power / 2)
    X[f < 12] *= (f[f < 12] / 12) ** 2
    y = np.fft.irfft(X, n)
    return y / (np.std(y) + 1e-12)


def pink(n, rng):
    return _colored(n, rng, 1.0)


def brown(n, rng):
    return _colored(n, rng, 2.0)


def smooth_random(n, rng, rate=1.0, smooth=0.5):
    """Band-limited random control signal in about [-1, 1] at `rate` Hz."""
    k = max(2, int(n / SR * rate) + 3)
    knots = rng.uniform(-1, 1, k)
    y = np.interp(np.linspace(0, k - 1, n), np.arange(k), knots)
    if smooth > 0:
        c = math.exp(-1.0 / (smooth / max(rate, 1e-3) * SR))
        y = lfilter([1 - c], [1, -c], y)
        y = lfilter([1 - c], [1, -c], y[::-1])[::-1]
    return y / (np.max(np.abs(y)) + 1e-12)


# ---------------------------------------------------------------- envelopes

def seg(n, v0, v1, curve=0.0):
    """Segment from v0 to v1. curve>0: fast start (exponential-like), <0: slow start."""
    x = np.linspace(0, 1, n, endpoint=False)
    if abs(curve) > 1e-6:
        x = (1 - np.exp(-curve * x)) / (1 - math.exp(-curve))
    return v0 + (v1 - v0) * x


def adsr(n, a=0.005, d=0.1, s=0.7, r=0.3, gate=None, curve=4.0):
    """ADSR envelope of n samples. gate = seconds until release (default: n - r)."""
    gate = (n / SR - r) if gate is None else gate
    na, nd = _n(a), _n(d)
    ng = max(1, _n(gate))
    e = np.empty(0)
    e = np.concatenate([seg(na, 0, 1, curve * 0.5), seg(nd, 1, s, curve)])
    if len(e) < ng:
        e = np.concatenate([e, np.full(ng - len(e), s)])
    e = e[:ng]
    lvl = e[-1] if len(e) else s
    rel = seg(max(1, n - ng), lvl, 0, curve)
    return np.concatenate([e, rel])[:n]


def ad(t, attack=0.001, t60=0.5):
    """Linear attack, exponential decay (t60 = time to -60 dB)."""
    return np.minimum(1.0, t / max(attack, 1e-6)) * np.exp(-6.9078 * np.maximum(0, t - attack) / t60)


def env(points, n, curve=0.0):
    """Breakpoint envelope [(t_sec, value), ...] -> n samples (holds the last value)."""
    out = np.full(n, float(points[-1][1]))
    for (t0, v0), (t1, v1) in zip(points[:-1], points[1:]):
        a, b = _n(t0) if t0 > 0 else 0, min(n, _n(t1))
        if b > a:
            out[a:b] = seg(b - a, v0, v1, curve)
    if points[0][0] > 0:
        out[:_n(points[0][0])] = points[0][1]
    return out


# ---------------------------------------------------------------- filters

@njit(cache=True)
def _svf_core(x, fc, q, mode, sr):
    """Zavalishin/Simper TPT state-variable filter with per-sample cutoff."""
    n = x.shape[0]
    y = np.empty(n)
    ic1 = 0.0
    ic2 = 0.0
    k = 1.0 / q
    for i in range(n):
        g = math.tan(math.pi * fc[i] / sr)
        a1 = 1.0 / (1.0 + g * (g + k))
        a2 = g * a1
        a3 = g * a2
        v3 = x[i] - ic2
        v1 = a1 * ic1 + a2 * v3
        v2 = ic2 + a2 * ic1 + a3 * v3
        ic1 = 2.0 * v1 - ic1
        ic2 = 2.0 * v2 - ic2
        if mode == 0:
            y[i] = v2
        elif mode == 1:
            y[i] = x[i] - k * v1 - v2
        elif mode == 2:
            y[i] = k * v1
        else:
            y[i] = x[i] - k * v1
    return y


_SVF_MODES = {"lp": 0, "hp": 1, "bp": 2, "notch": 3}


def svf(x, fc, q=0.707, mode="lp", stages=1):
    """State-variable filter; fc scalar or per-sample array (filter envelopes). bp has unity peak."""
    x = np.asarray(x, float)
    if x.ndim == 2:
        return np.stack([svf(x[:, c], fc, q, mode, stages) for c in range(x.shape[1])], 1)
    fca = np.ascontiguousarray(np.clip(_farr(fc, len(x)), 8.0, SR * 0.47))
    y = np.ascontiguousarray(x)
    for _ in range(stages):
        y = _svf_core(y, fca, float(q), _SVF_MODES[mode], float(SR))
    return y


def biquad_coefs(kind, f0, q=0.707, gain_db=0.0):
    """RBJ audio-EQ-cookbook biquad."""
    A = 10 ** (gain_db / 40)
    w0 = TAU * f0 / SR
    cw, sw = math.cos(w0), math.sin(w0)
    alpha = sw / (2 * q)
    if kind == "peak":
        b = [1 + alpha * A, -2 * cw, 1 - alpha * A]
        a = [1 + alpha / A, -2 * cw, 1 - alpha / A]
    elif kind in ("lowshelf", "highshelf"):
        sa = 2 * math.sqrt(A) * alpha
        if kind == "lowshelf":
            b = [A * ((A + 1) - (A - 1) * cw + sa), 2 * A * ((A - 1) - (A + 1) * cw), A * ((A + 1) - (A - 1) * cw - sa)]
            a = [(A + 1) + (A - 1) * cw + sa, -2 * ((A - 1) + (A + 1) * cw), (A + 1) + (A - 1) * cw - sa]
        else:
            b = [A * ((A + 1) + (A - 1) * cw + sa), -2 * A * ((A - 1) + (A + 1) * cw), A * ((A + 1) + (A - 1) * cw - sa)]
            a = [(A + 1) - (A - 1) * cw + sa, 2 * ((A - 1) - (A + 1) * cw), (A + 1) - (A - 1) * cw - sa]
    elif kind == "lp":
        b = [(1 - cw) / 2, 1 - cw, (1 - cw) / 2]
        a = [1 + alpha, -2 * cw, 1 - alpha]
    elif kind == "hp":
        b = [(1 + cw) / 2, -(1 + cw), (1 + cw) / 2]
        a = [1 + alpha, -2 * cw, 1 - alpha]
    elif kind == "bp":
        b = [alpha, 0, -alpha]
        a = [1 + alpha, -2 * cw, 1 - alpha]
    else:
        raise ValueError(kind)
    b, a = np.array(b) / a[0], np.array(a) / a[0]
    return b, a


def eq(x, kind, f0, q=0.707, gain_db=0.0):
    b, a = biquad_coefs(kind, f0, q, gain_db)
    return lfilter(b, a, x, axis=0)


def hpf(x, f, order=2):
    return sosfilt(butter(order, f, "highpass", fs=SR, output="sos"), x, axis=0)


def lpf(x, f, order=2):
    return sosfilt(butter(order, min(f, SR * 0.45), "lowpass", fs=SR, output="sos"), x, axis=0)


def allpass_chain(x, coefs=(0.62, -0.31, 0.47, -0.55, 0.23)):
    y = x
    for a in coefs:
        y = lfilter([a, 1.0], [1.0, a], y)
    return y


# ---------------------------------------------------------------- nonlinear / stereo

def saturate(x, drive_db=6.0, asym=0.0, os=2, mix=1.0):
    """Oversampled tanh waveshaper; output peak ~ input peak for full-scale input."""
    g = 10 ** (drive_db / 20)
    up = resample_poly(x, os, 1, axis=0) if os > 1 else x
    y = (np.tanh(g * up + asym) - math.tanh(asym)) / math.tanh(g)
    if os > 1:
        y = resample_poly(y, 1, os, axis=0)[: len(x)]
    return mix * y + (1 - mix) * x


def bitcrush(x, bits=8, hold=1):
    q = 2 ** (bits - 1)
    y = np.round(x * q) / q
    if hold > 1:
        idx = (np.arange(len(y)) // hold) * hold
        y = y[idx]
    return y


def pan(x, p=0.0):
    """Equal-power pan of a mono signal (centre = unity on both channels)."""
    p = _farr(p, len(x)) if not np.isscalar(p) else p
    th = (np.clip(p, -1, 1) + 1) * np.pi / 4
    return np.stack([x * np.cos(th), x * np.sin(th)], 1) * np.sqrt(2)


def balance(xs, p=0.0):
    if p == 0:
        return xs
    y = xs.copy()
    if p > 0:
        y[:, 0] *= 1 - p
    else:
        y[:, 1] *= 1 + p
    return y


def width(xs, w=1.0):
    """M/S width: 0 = mono, 1 = unchanged, >1 wider."""
    xs = st(xs)
    m = (xs[:, 0] + xs[:, 1]) / 2
    s = (xs[:, 0] - xs[:, 1]) / 2 * w
    return np.stack([m + s, m - s], 1)


def stereoize(x, amount=0.5, low=250.0):
    """Mono-compatible pseudo-stereo: side = allpassed, high-passed copy of the mono signal."""
    x = mono(x)
    side = hpf(allpass_chain(x), low) * amount
    return np.stack([x + side, x - side], 1)


def mono_below(xs, f=120.0):
    """Collapse content under f to mono (tight low end)."""
    xs = st(xs)
    lo = lpf(xs, f, 4)
    lom = mono(lo)
    return xs - lo + st(lom)


# ---------------------------------------------------------------- reverb

REVERBS = {
    "room": dict(t60=0.75, predelay=0.006, damp=0.55, er=0.55, highcut=12000),
    "plate": dict(t60=1.6, predelay=0.012, damp=0.3, er=0.15, highcut=14000),
    "hall": dict(t60=2.5, predelay=0.022, damp=0.5, er=0.35, highcut=11000),
    "hall_dark": dict(t60=2.9, predelay=0.02, damp=0.85, er=0.3, highcut=6500),
    "huge": dict(t60=5.5, predelay=0.04, damp=0.7, er=0.25, highcut=8000),
    "industrial": dict(t60=3.4, predelay=0.03, damp=0.35, er=0.7, highcut=10000),
}
_IR_CACHE: dict = {}


def make_ir(t60=2.5, predelay=0.02, damp=0.5, er=0.35, highcut=11000, lowcut=90, seed=7, length=None):
    """Stereo decaying-noise IR, 5 bands with their own T60 (highs die faster), early reflections."""
    key = (t60, predelay, damp, er, highcut, lowcut, seed, length)
    if key in _IR_CACHE:
        return _IR_CACHE[key]
    rng = _rng(seed)
    length = length or min(10.0, t60 * 1.1 + predelay + 0.1)
    n = _n(length)
    t = _t(n)
    edges = [(None, 220), (220, 900), (900, 3000), (3000, 7000), (7000, None)]
    mul = [1.25, 1.0, 0.85, 0.7 - 0.35 * damp, 0.5 - 0.3 * damp]
    ir = np.zeros((n, 2))
    pd = _n(predelay)
    for ch in range(2):
        w = rng.standard_normal(n)
        acc = np.zeros(n)
        for (lo, hi), m in zip(edges, mul):
            if lo is None:
                sos = butter(4, hi, "lowpass", fs=SR, output="sos")
            elif hi is None:
                sos = butter(4, lo, "highpass", fs=SR, output="sos")
            else:
                sos = butter(2, [lo, hi], "bandpass", fs=SR, output="sos")
            acc += sosfilt(sos, w) * np.exp(-6.9078 * t / (t60 * max(m, 0.12)))
        acc *= 1 - np.exp(-t / 0.015)  # diffuse build-up
        tail = np.zeros(n)
        tail[pd:] = acc[: n - pd]
        # early reflections
        if er > 0:
            taps = np.sort(rng.uniform(0.004, 0.075, 12))
            for tp in taps:
                i = pd + _n(tp)
                if i < n:
                    tail[i] += er * rng.choice([-1, 1]) * (1.0 - tp / 0.09) * 6.0 / math.sqrt(SR * 0.01)
        ir[:, ch] = tail
    ir = hpf(ir, lowcut, 2)
    ir = lpf(ir, highcut, 2)
    ir /= np.sqrt(np.sum(ir ** 2, axis=0, keepdims=True)) + 1e-12
    _IR_CACHE[key] = ir
    return ir


def reverb(x, preset="hall", **override):
    """Full wet convolution (length n + IR - 1), stereo in/out."""
    p = dict(REVERBS[preset])
    p.update(override)
    ir = make_ir(**p)
    xs = st(x)
    return np.stack([oaconvolve(xs[:, c], ir[:, c]) for c in range(2)], 1)


def with_reverb(dry, preset="hall", wet=0.3, n=None, **override):
    """dry + wet*reverb(dry), cropped/padded to n (default len(dry)), with a short fade at the crop."""
    dry = st(dry)
    n = n or len(dry)
    w = reverb(dry, preset, **override)
    out = np.zeros((n, 2))
    m = min(n, len(dry))
    out[:m] += dry[:m]
    k = min(n, len(w))
    out[:k] += wet * w[:k]
    return fade(out, 0, min(0.05, n / SR * 0.1))


def fade(x, fin=0.0, fout=0.0, shape=2.0):
    y = np.array(x, float, copy=True)
    n = len(y)
    if fin > 0:
        k = min(n, _n(fin))
        r = np.linspace(0, 1, k) ** shape
        y[:k] *= r[:, None] if y.ndim == 2 else r
    if fout > 0:
        k = min(n, _n(fout))
        r = np.linspace(1, 0, k) ** shape
        y[n - k:] *= r[:, None] if y.ndim == 2 else r
    return y


# ---------------------------------------------------------------- dynamics

@njit(cache=True)
def _gr_core(level_db, thresh, ratio, knee, att, rel):
    n = level_db.shape[0]
    out = np.empty(n)
    s = 0.0
    slope = 1.0 / ratio - 1.0
    for i in range(n):
        over = level_db[i] - thresh
        if 2.0 * over < -knee:
            g = 0.0
        elif knee > 0 and 2.0 * abs(over) <= knee:
            z = over + knee / 2.0
            g = slope * z * z / (2.0 * knee)
        else:
            g = slope * over
        if g < s:
            s = att * s + (1.0 - att) * g
        else:
            s = rel * s + (1.0 - rel) * g
        out[i] = s
    return out


@njit(cache=True)
def _ar_follow(x, att, rel):
    n = x.shape[0]
    y = np.empty(n)
    s = x[0] if n else 0.0
    for i in range(n):
        c = att if x[i] > s else rel
        s = c * s + (1.0 - c) * x[i]
        y[i] = s
    return y


@njit(cache=True)
def _release_min(target, rc):
    n = target.shape[0]
    g = np.empty(n)
    s = 1.0
    for i in range(n):
        s = s + (1.0 - s) * (1.0 - rc)
        if target[i] < s:
            s = target[i]
        g[i] = s
    return g


def compress(x, threshold=-18.0, ratio=2.0, attack=0.01, release=0.2, knee=6.0, makeup=0.0,
             key=None, rms_ms=10.0):
    """Feed-forward stereo-linked compressor. Returns (y, gain_reduction_db)."""
    k2 = st(x if key is None else key)
    p = np.max(k2 ** 2, axis=1)
    if rms_ms > 0:
        c = math.exp(-1.0 / (rms_ms * 1e-3 * SR))
        p = lfilter([1 - c], [1, -c], p)
    lvl = 10 * np.log10(p + 1e-12) + 3.01  # sine peak 1 -> 0 dB
    gr = _gr_core(np.ascontiguousarray(lvl), float(threshold), float(ratio), float(knee),
                  math.exp(-1 / (attack * SR)), math.exp(-1 / (release * SR)))
    g = 10 ** ((gr + makeup) / 20)
    return (x * g[:, None] if x.ndim == 2 else x * g), gr


def _tp_detect(x2, os=4):
    n = len(x2)
    up = resample_poly(x2, os, 1, axis=0)
    a = np.abs(up).max(axis=1)
    need = n * os
    if len(a) < need:
        a = np.pad(a, (0, need - len(a)))
    return a[:need].reshape(n, os).max(axis=1)


def limit(x, ceiling_db=-1.0, lookahead=0.004, release=0.08, passes=3):
    """True-peak lookahead brickwall limiter (4x oversampled detection). Returns (y, gain)."""
    x2 = st(x).copy()
    ceil = 10 ** (ceiling_db / 20)
    L = max(2, _n(lookahead)) // 2 * 2
    rc = math.exp(-1.0 / (release * SR))
    gtot = np.ones(len(x2))
    c_eff = ceil
    for _ in range(passes):
        pk = _tp_detect(x2)
        pk = np.maximum(pk, np.roll(pk, 1))
        need = np.minimum(1.0, c_eff / np.maximum(pk, 1e-12))
        if need.min() >= 1.0:
            break
        held = minimum_filter1d(need, size=L + 1, mode="nearest")
        held = np.concatenate([held[L // 2:], np.full(L // 2, held[-1])])
        box = np.convolve(np.concatenate([np.full(L, held[0]), held]), np.ones(L + 1) / (L + 1), "valid")[: len(held)]
        g = _release_min(np.ascontiguousarray(np.minimum(box, need)), rc)
        x2 *= g[:, None]
        gtot *= g
        tp = _tp_detect(x2).max()
        if tp <= ceil * 1.0001:
            break
        c_eff *= ceil / tp
    tp = _tp_detect(x2).max()
    if tp > ceil:
        x2 *= ceil / tp
        gtot *= ceil / tp
    return x2, gtot


def lufs(x) -> float:
    import pyloudnorm as pyln
    x2 = st(x)
    if len(x2) < _n(0.41):
        x2 = np.pad(x2, ((0, _n(0.41) - len(x2)), (0, 0)))
    with np.errstate(divide="ignore"):
        return float(pyln.Meter(SR).integrated_loudness(x2))


def true_peak_db(x) -> float:
    return 20 * math.log10(max(_tp_detect(st(x)).max(), 1e-12))


def normalize_peak(x, peak_db=-1.0, true_peak=True):
    """Normalise to peak_db (true peak, 4x oversampled, by default)."""
    pk = (_tp_detect(st(x)).max() if true_peak else np.max(np.abs(x))) + 1e-12
    return x * (10 ** (peak_db / 20) / pk)


def finish(y, peak_db=-1.0, tail_fade=0.03, hp=18.0):
    """One-shot finishing: DC/subsonic high-pass, end fade, peak normalise, sanitise."""
    y = st(np.nan_to_num(y))
    y = hpf(y, hp, 2)
    y = fade(y, 0.0, tail_fade)
    y = normalize_peak(y, peak_db)
    y[np.abs(y) < 1e-30] = 0.0
    return y


# =============================================================================
# shared building blocks
# =============================================================================

def _modal(t, freqs, t60s, amps, rng=None, phases=None):
    y = np.zeros_like(t)
    rng = rng or _rng(0)
    for i, (f, d, a) in enumerate(zip(freqs, t60s, amps)):
        if f >= SR * 0.45:
            continue
        ph = rng.uniform(0, TAU) if phases is None else phases[i]
        y += a * np.sin(TAU * f * t + ph) * np.exp(-6.9078 * t / d)
    return y


def _place(buf, x, start):
    """Add x into buf at sample index start (cropping), both (n,2)."""
    if start >= len(buf) or start + len(x) <= 0:
        return
    s0 = max(0, start)
    x0 = s0 - start
    k = min(len(buf) - s0, len(x) - x0)
    buf[s0:s0 + k] += x[x0:x0 + k]


def _chord_stab(dur, chord="Dm", rng=None, low=50, bright=2500.0):
    rng = rng or _rng(0)
    n = _n(dur)
    t = _t(n)
    y = np.zeros((n, 2))
    for m in voice_chord(chord, low) + [voice_chord(chord, low)[0] + 12]:
        y += supersaw(mtof(m), n, 3, 10, 0.7, rng)
    y = svf(y, bright * np.exp(-t / 0.3) + 300, 0.8, "lp", 2) * ad(t, 0.003, dur * 0.8)[:, None]
    return y


# =============================================================================
# ONE-SHOTS
# =============================================================================

@gen("oneshot")
def impact(length=3.0, sub_hz=48.0, punch=1.0, brightness=0.6, size=1.0, seed=1):
    """Cinematic hit: pitched sub thump + transient crack + falling noise tail + dark hall."""
    rng = _rng(seed)
    n = _n(length)
    t = _t(n)
    f = sub_hz * (1 + 2.8 * np.exp(-t / 0.028))
    sub = saturate(sine(f, n) * ad(t, 0.0008, 1.0 * size), 7 * punch)
    body = svf(white(n, rng), 120, 1.3, "bp") * np.exp(-t / 0.07) * 2.2
    crack = svf(white(n, rng), 2600 + 2600 * brightness, 0.8, "bp") * np.exp(-t / 0.011)
    click = hpf(white(n, rng) * np.exp(-t / 0.0012), 2500)
    fc = 280 + (2200 + 6000 * brightness) * np.exp(-t / (0.16 * size))
    tail = np.stack([svf(pink(n, rng), fc, 0.7, "lp", 2) for _ in range(2)], 1) * ad(t, 0.004, 1.7 * size)[:, None]
    dry = st(sub + 0.5 * punch * body) + st(0.5 * brightness * crack + 0.3 * punch * click) * [1.0, 0.9] + 0.2 * tail
    return finish(with_reverb(dry, "hall_dark", 0.28 * size, n))


@gen("oneshot")
def boom(length=6.0, hz=34.0, size=1.4, seed=2):
    """Deep distant boom: long sub with harmonics, brown-noise rumble, huge dark space."""
    rng = _rng(seed)
    n = _n(length)
    t = _t(n)
    f = hz * (1 + 1.1 * np.exp(-t / 0.12))
    sub = saturate(sine(f, n) * ad(t, 0.004, 3.2 * size), 9)
    fc = 85 + 500 * np.exp(-t / 0.25)
    rumble = np.stack([svf(brown(n, rng), fc, 0.8, "lp", 2) for _ in range(2)], 1) * ad(t, 0.012, 3.8 * size)[:, None]
    thump = svf(white(n, rng), 70, 1.0, "bp") * np.exp(-t / 0.15)
    air = svf(pink(n, rng), 650, 0.9, "bp") * np.exp(-t / 0.25)
    dry = st(sub + 0.9 * thump) + 0.55 * rumble + stereoize(air, 0.6) * 0.25
    return finish(with_reverb(dry, "huge", 0.45, n))


@gen("oneshot")
def braam(length=4.0, root="D2", chord="m", brightness=1.0, open_time=0.45, detune=14.0, seed=3):
    """Detuned saw/brass stack with an opening 24 dB filter, scoop, growl, formants and drive."""
    rng = _rng(seed)
    n = _n(length)
    t = _t(n)
    r = midi(root)
    ivs = {"5": [0, 7, 12], "m": [0, 7, 12, 15], "": [0, 7, 12, 16], "sus": [0, 7, 12, 17]}.get(chord, [0, 7, 12, 15])
    scoop = 2 ** ((-45 * np.exp(-t / 0.05)) / 1200)
    stack = np.zeros((n, 2))
    for iv in ivs:
        stack += supersaw(mtof(r + iv) * scoop, n, 5, detune, 0.9, rng) / len(ivs) ** 0.5
    stack += st(square(mtof(r - 12) * scoop, n, 0.42)) * 0.25
    peak = 300 + 2600 * brightness
    xr = np.clip(t / open_time, 0, 1)
    rise = xr * xr * (3 - 2 * xr)  # smoothstep: the filter is fully open at open_time
    fall = 0.4 + 0.6 * np.exp(-np.maximum(0, t - open_time) / 1.2)
    fc = 110 + (peak - 110) * rise * fall
    growl = 1 + 0.2 * np.exp(-t / 0.45) * np.sin(TAU * 27 * t)
    stack = saturate(stack * growl[:, None], 9)
    y = svf(stack, fc, 1.25, "lp", 2)
    y = eq(eq(y, "peak", 540, 1.3, 6.0), "peak", 1250, 1.6, 3.5)
    y = saturate(y * 1.3, 4)
    y = lpf(y, 7000, 2)
    a = adsr(n, 0.035, 0.6, 0.8, length * 0.45, curve=3.0)
    sub = sine(mtof(r - 12), n) * a * 0.45
    y = y * a[:, None] + st(sub)
    return finish(with_reverb(y, "hall", 0.3, n))


@gen("oneshot", hit="end")
def riser(length=4.0, f0=180.0, f1=4200.0, tonal=0.5, curve=2.0, root="D3", seed=4):
    """Noise + pitched rising sweep with accelerating tremolo and widening; ends hard on the hit."""
    rng = _rng(seed)
    n = _n(length)
    t = _t(n)
    x = t / length
    s = x ** curve
    fc = f0 * (f1 / f0) ** s
    nz = np.stack([svf(pink(n, rng), fc, 2.2, "bp") + 0.35 * svf(white(n, rng), fc * 2.2, 0.8, "lp", 2) for _ in range(2)], 1)
    ton = np.zeros((n, 2))
    r = midi(root)
    for iv in (0, 7, 12):
        ton += supersaw(mtof(r + iv) * 2 ** (s * 1.0), n, 3, 9, 0.8, rng)
    ton = svf(ton, fc * 1.5 + 200, 0.9, "lp", 2)
    rate = 3 + 15 * s
    trem = 1 - 0.35 * s * (0.5 + 0.5 * np.sin(TAU * np.cumsum(rate) / SR))
    amp = x ** 2.2 * trem
    y = (nz * 0.8 + ton * tonal) * amp[:, None]
    y = width(y, 1.0)
    side_gain = 0.4 + 1.2 * s
    m = (y[:, 0] + y[:, 1]) / 2
    sd = (y[:, 0] - y[:, 1]) / 2 * side_gain
    y = np.stack([m + sd, m - sd], 1)
    y = with_reverb(y, "plate", 0.18, n)
    y = finish(y, tail_fade=0.004)
    return y, n


@gen("oneshot", hit="end")
def reverse_swell(length=2.5, chord="Dm", brightness=0.6, seed=5):
    """Reversed chord-stab reverb swell that sucks into the downbeat (hit = end)."""
    rng = _rng(seed)
    n = _n(length)
    src = _chord_stab(0.6, chord, rng, bright=1500 + 3000 * brightness)
    src = np.concatenate([src, st(svf(white(_n(0.6), rng), 2500, 0.7, "bp") * np.exp(-_t(_n(0.6)) / 0.05) * 0.4)], 0)[: _n(0.6)]
    wet = reverb(src, "huge", t60=max(3.0, length * 1.4))
    full = np.zeros((max(len(wet), n + _n(0.1)), 2))
    full[: len(wet)] += wet
    full[: len(src)] += 0.35 * src
    rev = full[::-1]
    # keep the last `length` seconds of the reversed signal (ends on the reversed attack)
    y = rev[-n:]
    y = fade(y, length * 0.35, 0.0, 2.5)
    y = finish(y, tail_fade=0.003)
    return y, n


@gen("oneshot")
def whoosh(length=1.2, direction=1.0, peak=0.55, pitch=1.0, weight=0.5, seed=6):
    """Filtered-noise pass-by: bell envelope, doppler-ish filter drop, pan sweep (direction +1 = L->R)."""
    rng = _rng(seed)
    n = _n(length)
    t = _t(n)
    x = t / length
    bell = np.where(x < peak, np.exp(-((x - peak) / (peak * 0.5)) ** 2), np.exp(-((x - peak) / ((1 - peak) * 0.42)) ** 2))
    dop = 1.0 + 0.4 * np.tanh((peak - x) * 8)
    fc = (260 + 3000 * pitch * bell) * dop
    src = pink(n, rng)
    band = svf(src, fc, 1.7, "bp")
    body = svf(src, fc * 0.55, 0.7, "lp") * weight
    air = svf(white(n, rng), np.minimum(fc * 2.6, 16000), 2.2, "bp") * 0.22
    sig = (band + body + air) * bell ** 1.4
    sig = hpf(sig, 70, 2)
    p = 0.9 * np.tanh((x - peak) * 5) * direction
    y = pan(sig, p)
    return finish(with_reverb(y, "room", 0.12, n))


@gen("oneshot")
def ui_blip(kind="blip", freq=1760.0, length=0.3, seed=7):
    """Interface sounds. kind: blip | tick | confirm | deny | select | type."""
    rng = _rng(seed)
    n = _n(length)
    t = _t(n)

    def blip(f, d=0.09, wave="sine"):
        ff = f * (1 + 0.22 * np.exp(-t / 0.006))
        o = sine(ff, n) * 0.8 + sine(2 * ff, n) * 0.15 if wave == "sine" else tri(ff, n) * 0.9
        return o * ad(t, 0.0008, d)

    if kind == "tick":
        y = svf(white(n, rng), 4200, 3.0, "bp") * np.exp(-t / 0.0025) * 2 + sine(freq * 2, n) * np.exp(-t / 0.004) * 0.3
    elif kind == "confirm":
        y = blip(freq) + np.roll(blip(freq * 1.4983), _n(0.07))
    elif kind == "deny":
        y = blip(freq * 0.75, 0.12, "tri") + np.roll(blip(freq * 0.5, 0.15, "tri"), _n(0.09))
    elif kind == "select":
        idx = 2.5 * np.exp(-t / 0.03)
        y = np.sin(TAU * freq * t + idx * np.sin(TAU * freq * 3.5 * t)) * ad(t, 0.001, 0.25)
    elif kind == "type":
        y = svf(white(n, rng), 2400, 1.5, "bp") * np.exp(-t / 0.004) + sine(freq * 0.5, n) * np.exp(-t / 0.006) * 0.4
    else:
        y = blip(freq)
    y = y + 0.25 * hpf(white(n, rng) * np.exp(-t / 0.0006), 3000)
    return finish(with_reverb(stereoize(y, 0.2), "room", 0.12, n), tail_fade=0.01)


@gen("oneshot")
def typing(length=2.0, rate=9.0, seed=8):
    """Keyboard typing: click + thock + bottom-out + release per key, irregular rhythm."""
    rng = _rng(seed)
    n = _n(length)
    y = np.zeros((n, 2))
    m = _n(0.12)
    tt = _t(m)
    tk = 0.02
    while tk < length - 0.12:
        g = 10 ** (rng.uniform(-3, 1.5) / 20)
        space = rng.random() < 0.08
        click = hpf(white(m, rng) * np.exp(-tt / 0.0015), 3000) * 0.6
        thock = svf(white(m, rng), rng.uniform(380, 520) if space else rng.uniform(550, 950), 1.8, "bp") * np.exp(-tt / 0.012)
        bottom = sine(rng.uniform(160, 260), m) * np.exp(-tt / 0.01) * (0.6 if space else 0.3)
        key = click + thock * 1.3 + bottom
        rel = np.roll(key * 0.3, _n(rng.uniform(0.055, 0.09)))
        rel[: _n(0.05)] = 0
        _place(y, pan((key + rel) * g, rng.uniform(-0.35, 0.35)), _n(tk))
        tk += rng.gamma(2.0, 1 / (2 * rate))
        if rng.random() < 0.07:
            tk += rng.uniform(0.15, 0.35)
    return finish(with_reverb(y, "room", 0.1, n), tail_fade=0.02)


@gen("oneshot")
def data_chatter(length=2.0, density=20.0, bits=6, seed=9):
    """Computer data chatter: bit-crushed pentatonic square blips and fast arpeggio bursts."""
    rng = _rng(seed)
    n = _n(length)
    y = np.zeros((n, 2))
    scale = [74, 77, 79, 81, 84, 86, 89, 91, 93, 96, 98]
    tk = 0.0
    while True:
        tk += rng.exponential(1 / density)
        if tk > length - 0.08:
            break
        if rng.random() < 0.25:
            k = rng.integers(5, 10)
            dur = rng.uniform(0.022, 0.034)
            start = rng.integers(0, len(scale) - 3)
            notes = [scale[min(len(scale) - 1, start + (j % 4))] for j in range(k)]
        else:
            dur = rng.uniform(0.015, 0.06)
            notes = [scale[rng.integers(0, len(scale))]]
        for j, mn in enumerate(notes):
            m = _n(dur)
            tt = _t(m)
            o = square(mtof(mn), m, rng.uniform(0.25, 0.5)) * ad(tt, 0.001, dur * 2.5)
            _place(y, pan(o * 10 ** (rng.uniform(-8, 0) / 20) * 0.5, rng.uniform(-0.6, 0.6)), _n(tk + j * dur))
    y = np.stack([bitcrush(y[:, c], bits, 3) for c in range(2)], 1)
    y = svf(svf(y, 9000, 0.7, "lp"), 500, 0.7, "hp")
    return finish(with_reverb(y, "room", 0.12, n), tail_fade=0.02)


@gen("oneshot")
def glitch(length=0.8, character=0.5, seed=10):
    """Digital glitch stutter: sliced/repeated/pitch-jumped/crushed fragments, rolling faster."""
    rng = _rng(seed)
    n = _n(length)
    src_n = _n(0.5)
    tt = _t(src_n)
    src = mono(_chord_stab(0.5, "Dm", rng, low=62, bright=4000)) * 1.5
    src += svf(white(src_n, rng), 3000, 0.8, "bp") * np.exp(-tt / 0.15) * 0.6
    src += square(rng.choice([55.0, 73.4, 110.0]), src_n, 0.3) * 0.25
    y = np.zeros((n, 2))
    pos = 0
    roll_from = int(n * (0.55 + 0.2 * (1 - character)))
    while pos < n:
        if pos > roll_from:
            sl = max(_n(0.006), int(_n(0.05) * (1 - (pos - roll_from) / (n - roll_from + 1)) ** 1.5))
            reps = 1
        else:
            sl = _n(rng.choice([0.02, 0.03, 0.045, 0.06, 0.09]))
            reps = int(rng.integers(1, 5))
        off = int(rng.integers(0, src_n - sl))
        ratio = rng.choice([0.5, 0.75, 1, 1, 1, 1.5, 2])
        idx = off + np.arange(sl) * ratio
        piece = np.interp(idx, np.arange(src_n), src, right=0)
        piece = bitcrush(piece, int(rng.integers(4, 9)), int(rng.integers(1, 4)))
        piece = fade(piece, 0.0006, 0.0006, 1)
        if rng.random() < 0.15 * character:
            piece *= 0
        p = rng.uniform(-0.7, 0.7) * character
        for _ in range(reps):
            if pos >= n:
                break
            _place(y, pan(piece, p), pos)
            pos += sl
    y = hpf(lpf(y, 14000, 2), 70, 2)
    return finish(y, tail_fade=0.004)


@gen("oneshot")
def sub_drop(length=2.5, f0=100.0, f1=27.0, seed=11):
    """Falling sine sub (808-style downer) with a little harmonic drive for small speakers."""
    n = _n(length)
    t = _t(n)
    f = f1 + (f0 - f1) * np.exp(-t / (length * 0.22))
    a = ad(t, 0.002, length * 0.85)
    y = saturate(sine(f, n) * a, 6) + 0.12 * sine(2 * f, n) * a
    return finish(st(y))


def _tick_hit(tone=1.0, rng=None, accent=1.0, bright=1.0):
    rng = rng or _rng(0)
    m = _n(0.07)
    tt = _t(m)
    freqs = np.array([1850, 3150, 4720, 6900, 760]) * tone
    dec = [0.018, 0.010, 0.006, 0.004, 0.022]
    amps = [1.0, 0.6 * bright, 0.35 * bright, 0.2 * bright, 0.45]
    y = _modal(tt, freqs, dec, amps, rng, phases=[0, 0, 0, 0, 0])
    y += 0.35 * hpf(white(m, rng) * np.exp(-tt / 0.0008), 2500)
    return y * ad(tt, 0.0003, 0.06) * accent


@gen("oneshot")
def tick(length=4.0, bpm=120.0, subdiv=2, accent_every=4, accel=1.0, tone=1.0, tock=0.88, seed=12):
    """Sharp woody clock-tick ostinato (Dunkirk-style). accel>1 speeds up to accel x tempo at the end."""
    rng = _rng(seed)
    n = _n(length)
    y = np.zeros((n, 2))
    t = _t(n)
    rate = bpm * subdiv / 60.0 * (1 + (accel - 1) * (t / length) ** 2)
    ph = np.cumsum(rate) / SR
    idx = np.where(np.diff(np.floor(ph), prepend=-1) > 0)[0]
    for k, i in enumerate(idx):
        acc = 1.0 if k % accent_every == 0 else 0.62
        acc *= 10 ** (rng.uniform(-0.6, 0.6) / 20)
        h = _tick_hit(tone * (1 if k % 2 == 0 else tock), rng, acc)
        _place(y, pan(h, -0.15 if k % 2 == 0 else 0.15), int(i))
    return finish(with_reverb(y, "room", 0.08, n), tail_fade=0.01)


@gen("oneshot")
def heartbeat(length=4.0, bpm=60.0, seed=13):
    """Low 'lub-dub' pulse: two pitched sine thumps per beat with a soft noise thud."""
    rng = _rng(seed)
    n = _n(length)
    y = np.zeros(n)
    m = _n(0.4)
    tt = _t(m)

    def thump(f0, a):
        f = f0 * (1 + 0.6 * np.exp(-tt / 0.02))
        s = sine(f, m) * ad(tt, 0.004, 0.2) + svf(white(m, rng), 90, 0.8, "lp") * np.exp(-tt / 0.03) * 0.5
        return saturate(s, 6) * a

    beat = 60.0 / bpm
    tb = 0.0
    while tb < length - 0.3:
        i = _n(tb)
        k = min(m, n - i)
        y[i:i + k] += thump(52, 1.0)[:k]
        j = i + _n(min(0.24, beat * 0.33))
        k = min(m, n - j)
        if k > 0:
            y[j:j + k] += thump(61, 0.7)[:k]
        tb += beat
    y = lpf(y, 260, 2)
    return finish(st(y))


@gen("oneshot")
def gate_clank(length=3.0, size=1.0, pitch=1.0, rattle=0.6, latch=True, seed=14):
    """Heavy metallic floodgate clank: inharmonic beating modes, thud, chain rattle, latch, industrial space."""
    rng = _rng(seed)
    n = _n(length)
    t = _t(n)
    base = 160 * pitch * rng.uniform(0.97, 1.03)
    ratios = [1.0, 1.47, 2.09, 2.56, 2.98, 3.6, 4.22, 5.0, 5.82, 6.73, 7.9, 9.3, 11.1, 13.4]
    chans = []
    for ch in range(2):
        fr, dc, am = [], [], []
        for k, r in enumerate(ratios):
            f = base * r * (1 + rng.uniform(-0.012, 0.012))
            d = 2.6 * size / (1 + 0.42 * k)
            a = rng.uniform(0.6, 1.0) / (1 + 0.3 * k)
            fr += [f, f + rng.uniform(0.7, 2.6)]
            dc += [d, d * 0.9]
            am += [a, a * 0.7]
        chans.append(_modal(t, fr, dc, am, rng))
    metal = np.stack(chans, 1) * ad(t, 0.0015, 10)[:, None]
    hit = hpf(white(n, rng) * np.exp(-t / 0.003), 1500) * 0.8
    thud = svf(white(n, rng), 95, 1.2, "bp") * np.exp(-t / 0.06) * 2.0 + sine(58 * (1 + np.exp(-t / 0.02)), n) * ad(t, 0.001, 0.4)
    y = metal * 1.0 + st(hit * 0.8 + thud * 0.55)
    for _ in range(int(3 + 3 * rattle)):
        tr = rng.uniform(0.03, 0.25)
        m = _n(0.4)
        tt = _t(m)
        b2 = base * rng.uniform(2.0, 3.2)
        sm = _modal(tt, [b2 * r for r in ratios[:8]], [0.15 / (1 + 0.3 * k) for k in range(8)], [1 / (1 + k) for k in range(8)], rng)
        _place(y, pan(sm * 0.25 * rattle * (1 - tr * 2), rng.uniform(-0.5, 0.5)), _n(tr))
    if latch:
        m = _n(0.8)
        tt = _t(m)
        lt = svf(white(m, rng), 140, 1.0, "bp") * np.exp(-tt / 0.05) * 1.2
        lt += _modal(tt, [base * 1.9 * r for r in ratios[:10]], [0.35 / (1 + 0.4 * k) for k in range(10)], [0.5 / (1 + 0.3 * k) for k in range(10)], rng)
        _place(y, st(lt * 0.55), _n(0.34))
    return finish(with_reverb(y, "industrial", 0.35 * size, n))


@gen("oneshot")
def water_rush(length=5.0, intensity=0.7, bubbles=1.0, seed=15):
    """River / floodgate water: modulated brown-pink bed, gurgle, hiss and Van den Doel bubbles."""
    rng = _rng(seed)
    n = _n(length)
    chans = []
    for ch in range(2):
        bed = 0.6 * brown(n, rng) + 0.4 * pink(n, rng)
        fc = (650 + 1500 * intensity) * (1 + 0.35 * smooth_random(n, rng, 0.7))
        bed = hpf(svf(bed, fc, 0.6, "lp", 2), 45)
        gur = svf(pink(n, rng), 380 * (1 + 0.4 * smooth_random(n, rng, 3)), 2.5, "bp") * (0.6 + 0.4 * smooth_random(n, rng, 9))
        hiss = svf(white(n, rng), 5000, 0.7, "hp") * 0.12 * intensity * (0.7 + 0.3 * smooth_random(n, rng, 6))
        chans.append(bed + 0.5 * gur + hiss)
    y = np.stack(chans, 1) * 0.35
    rate = 40 * bubbles * intensity
    tk = 0.0
    while True:
        tk += rng.exponential(1 / max(rate, 1e-3))
        if tk > length - 0.1:
            break
        f0 = math.exp(rng.uniform(math.log(300), math.log(1600)))
        d = 0.043 * f0 + 0.0014 * f0 ** 1.5
        m = min(_n(6.0 / d), _n(0.12))
        tt = _t(m)
        b = np.sin(TAU * np.cumsum(f0 * (1 + 0.1 * d * tt)) / SR) * np.exp(-d * tt) * rng.uniform(0, 1) ** 2 * 0.35
        _place(y, pan(b, rng.uniform(-0.8, 0.8)), _n(tk))
    y = fade(y, 0.4, 0.6)
    return finish(with_reverb(y, "room", 0.15, n), tail_fade=0.0)


@gen("oneshot")
def crowd(length=5.0, voices=32, excitement=0.3, distance=0.6, seed=16):
    """Crowd-murmur texture: many formant-filtered 'voices' with syllabic envelopes, distant and wide."""
    rng = _rng(seed)
    n = _n(length)
    vowels = [(730, 1090), (530, 1840), (270, 2290), (570, 840), (300, 870), (660, 1720), (440, 1020)]
    y = np.zeros((n, 2))
    for v in range(voices):
        srate = rng.uniform(3.5, 6.0) * (1 + 0.3 * excitement)
        # intonation: phrase contour + per-syllable pitch movement + jitter (no steady harmonic lines)
        f0 = (rng.uniform(95, 230) * (1 + excitement * 0.2)
              * (1 + 0.10 * smooth_random(n, rng, 0.6) + 0.07 * smooth_random(n, rng, srate, 0.3)
                 + 0.01 * smooth_random(n, rng, 40, 0.2)))
        src = saw(f0, n, rng.random()) * 0.55 + pink(n, rng) * 0.22
        e = np.clip(smooth_random(n, rng, srate, 0.3), 0, 1) ** 1.5
        e *= np.clip(smooth_random(n, rng, 0.35, 0.5) + 0.4, 0, 1)
        k = int(length * srate) + 2
        tgt = [vowels[i] for i in rng.integers(0, len(vowels), k)]
        knots = np.linspace(0, n - 1, k)
        F1 = np.interp(np.arange(n), knots, [a for a, _ in tgt])
        F2 = np.interp(np.arange(n), knots, [b for _, b in tgt])
        vo = svf(src, F1, 5.0, "bp") + 0.6 * svf(src, F2, 7.0, "bp")
        y += pan(vo * e, rng.uniform(-0.9, 0.9))
    y = lpf(y, 3600 - 2000 * distance, 2)
    return finish(with_reverb(y, "hall", 0.3 + 0.4 * distance, n), tail_fade=0.3)


@gen("oneshot", hit="end")
def reverse_cymbal(length=2.5, brightness=0.7, seed=17):
    """Metallic 6-oscillator cymbal + noise, reverbed, reversed: swells up into the hit (hit = end)."""
    rng = _rng(seed)
    n = _n(length)
    m = _n(length + 0.4)
    tt = _t(m)
    met = sum(square(f * 1.7, m, 0.5, rng.random()) for f in (205.3, 304.4, 369.6, 522.7, 540.0, 800.0)) / 6
    met = svf(svf(met, 7500 + 2500 * brightness, 0.9, "bp"), 4500, 0.7, "hp")
    nz = svf(white(m, rng), 6000, 0.7, "hp") * 0.5
    cym = (met * 1.4 + nz) * ad(tt, 0.001, 2.4)
    w = with_reverb(stereoize(cym, 0.6), "hall", 0.3, m)
    y = w[::-1][-n:]
    y = fade(y, length * 0.25, 0.0, 2.0)
    return finish(y, tail_fade=0.003), n


@gen("oneshot", hit="end")
def sub_swell(length=2.0, hz=41.0, rise=0.15, seed=18):
    """Low sub swell rising into a moment (hit = end)."""
    rng = _rng(seed)
    n = _n(length)
    t = _t(n)
    x = t / length
    y = sine(hz * (1 + rise * x), n) * x ** 2.5 + svf(brown(n, rng), 120, 0.7, "lp") * 0.35 * x ** 3
    y = saturate(y, 5)
    return finish(st(y), tail_fade=0.006), n


@gen("oneshot")
def alert(length=1.0, f_hi=1174.66, f_lo=880.0, reps=2, seed=19):
    """Tactical two-tone alert (D6/A5), soft square tone, not harsh."""
    rng = _rng(seed)
    n = _n(length)
    y = np.zeros(n)
    m = _n(0.11)
    tt = _t(m)
    pos = 0.0
    for r in range(reps):
        for f in (f_hi, f_lo):
            o = (tri(f, m) * 0.7 + square(f, m, 0.5) * 0.15 + sine(2 * f, m) * 0.1) * adsr(m, 0.004, 0.03, 0.8, 0.03)
            i = _n(pos)
            k = min(m, n - i)
            if k > 0:
                y[i:i + k] += o[:k]
            pos += 0.13
        pos += 0.06
    y = lpf(y, 4500, 2)
    return finish(with_reverb(stereoize(y, 0.25), "room", 0.15, n), tail_fade=0.02)


@gen("oneshot")
def tape_scrub(length=1.2, direction=-1.0, seed=20):
    """Tape rewind / scrub: variable-speed playback of a data + chord bed with hiss (direction -1 = back)."""
    rng = _rng(seed)
    n = _n(length)
    src = mono(data_chatter(3.0, 28, 8, seed + 1)) + mono(_chord_stab(3.0, "Dm", rng, 50, 2000)) * 0.6
    t = _t(n)
    v = direction * (0.4 + 2.6 * np.sin(np.pi * t / length) ** 1.2) * (1 + 0.15 * smooth_random(n, rng, 8))
    pos = np.cumsum(v)
    pos = pos - pos.min() + 10
    pos = np.mod(pos, len(src) - 1)
    y = np.interp(pos, np.arange(len(src)), src)
    y = svf(y, 600 + 5000 * np.clip(np.abs(v) / 3, 0, 1), 0.8, "lp")
    y += svf(white(n, rng), 3000, 0.8, "bp") * 0.08 * np.abs(v) / 3
    y = saturate(y * np.sqrt(np.abs(v) / 3), 6)
    return finish(stereoize(fade(y, 0.02, 0.05), 0.3))


@gen("oneshot")
def stamp(length=1.2, weight=1.0, seed=21):
    """Heavy stamp/slam for type that stamps in: low thud, rubber slap, paper texture, small room."""
    rng = _rng(seed)
    n = _n(length)
    t = _t(n)
    thud = sine(55 * (1 + 0.7 * np.exp(-t / 0.02)), n) * ad(t, 0.001, 0.35) * weight
    slap = svf(white(n, rng), 1800, 0.7, "bp") * np.exp(-t / 0.018) * 0.9
    paper = svf(white(n, rng), 5000, 0.7, "hp") * np.exp(-t / 0.05) * 0.25
    y = saturate(thud + slap + paper, 4)
    return finish(with_reverb(stereoize(y, 0.15), "room", 0.2, n))


@gen("oneshot")
def tick_one(tone=1.0, length=0.15, seed=22):
    """A single woody tick."""
    y = np.zeros(_n(length))
    h = _tick_hit(tone, _rng(seed))
    y[: min(len(y), len(h))] = h[: len(y)]
    return finish(with_reverb(st(y), "room", 0.08), tail_fade=0.01)


# =============================================================================
# MUSICAL LAYERS (tempo grid; 16 steps per bar; return audio from the layer's first downbeat)
# =============================================================================

def _bar(bpm):
    return 240.0 / bpm


def _ramp(spec, x, bars):
    """intensity: number | [start, end] | [[bar, value], ...] evaluated at x (bars from layer start)."""
    if isinstance(spec, (int, float)):
        return np.full_like(np.asarray(x, float), float(spec)) if np.ndim(x) else float(spec)
    spec = list(spec)
    if len(spec) == 2 and all(isinstance(v, (int, float)) for v in spec):
        pts = [(0.0, spec[0]), (float(bars), spec[1])]
    else:
        pts = [(float(a), float(b)) for a, b in spec]
    xs, ys = zip(*pts)
    return np.interp(x, xs, ys)


def _chord_at(chords, bar):
    if isinstance(chords, str):
        chords = [chords]
    return chords[int(bar) % len(chords)]


def _steps(pattern, bars):
    p = pattern.replace(" ", "").replace("|", "")
    if not p:
        return []
    out = []
    for b in range(bars):
        for s in range(16):
            ch = p[(b * 16 + s) % len(p)]
            if ch != ".":
                out.append((b, s, ch))
    return out


LAYER_LEVEL = {}  # filled by calibration constants below (dB applied at the end of each layer)


@gen("layer")
def bass_ostinato(bars=4, bpm=120.0, chords=("Dm",), intensity=0.7, pattern="RrrRrrRrRrrRrrRr", drive=6.0, seed=30):
    """16th-note pulsing bass: polyBLEP saw + sine sub, per-note 24 dB filter envelope, 3-3-2 accents.
    pattern chars per 16th: r root, o octave, f fifth, upper case = accent, . rest."""
    rng = _rng(seed)
    bl = _bar(bpm)
    step = bl / 16
    n = _n(bars * bl + 0.5)
    y = np.zeros(n)
    for b, s, ch in _steps(pattern, bars):
        I = float(_ramp(intensity, b + s / 16, bars))
        m0 = bass_note(_chord_at(chords, b)) + {"o": 12, "f": 7}.get(ch.lower(), 0)
        acc = ch.isupper()
        dur = step * 0.88
        m = _n(dur + 0.03)
        tt = _t(m)
        f = mtof(m0)
        o = 0.75 * saw(f, m, rng.random()) + 0.55 * sine(f, m)
        fenv = np.exp(-tt / 0.05)
        fc = (90 + 520 * I) * (1 + (2.5 + 4 * I + 2.5 * acc) * fenv)
        o = svf(o, fc, 1.15, "lp", 2)
        a = adsr(m, 0.002, 0.08, 0.7, 0.03, gate=dur)
        vel = (0.78 + 0.22 * acc) * 10 ** (rng.uniform(-0.4, 0.4) / 20)
        i = _n(b * bl + s * step)
        k = min(m, n - i)
        y[i:i + k] += (o * a * vel)[:k]
    I_avg = float(np.mean(_ramp(intensity, np.linspace(0, bars, 32), bars)))
    y = saturate(y * 0.7, drive * (0.5 + I_avg))
    ys = mono_below(stereoize(y, 0.25, 180), 150)
    gain = _ramp(intensity, _t(n) / bl, bars)
    return ys * (0.35 + 0.65 * gain)[:, None] * 10 ** (LAYER_LEVEL.get("bass_ostinato", 0) / 20)


@gen("layer")
def pad(bars=4, bpm=120.0, chords=("Dm",), intensity=0.6, attack=1.5, release=2.5, motion=0.08, brightness=0.6, seed=31):
    """Sustained supersaw/strings pad, voice-led chords, vibrato, slow LFO'd 24 dB filter, hall."""
    rng = _rng(seed)
    bl = _bar(bpm)
    n = _n(bars * bl + release + 0.5)
    y = np.zeros((n, 2))
    segs = []
    for b in range(bars):
        c = _chord_at(chords, b)
        if segs and segs[-1][0] == c:
            segs[-1][2] += 1
        else:
            segs.append([c, b, 1])
    for c, b0, nb in segs:
        dur = nb * bl
        m = _n(dur + release)
        tt = _t(m)
        notes = voice_chord(c, 50) + [bass_note(c, 38)]
        vib = 2 ** ((6 * np.minimum(1, tt / 1.2) * np.sin(TAU * 5.1 * tt + rng.uniform(0, TAU))) / 1200)
        seg_y = np.zeros((m, 2))
        for mn in notes:
            seg_y += supersaw(mtof(mn), m, 5, 9, 0.85, rng, vib)
        seg_y += st(sine(mtof(bass_note(c, 38) - 12), m)) * 0.5
        a = adsr(m, attack if b0 == 0 else min(attack, 0.6), 0.5, 0.9, release, gate=dur)
        _place(y, seg_y * a[:, None] / len(notes) ** 0.5, _n(b0 * bl))
    t = _t(n)
    I = _ramp(intensity, t / bl, bars)
    lfo = 0.65 + 0.35 * np.sin(TAU * motion * t - np.pi / 2)
    fc = 250 + 3600 * brightness * I * lfo
    y = svf(y, fc, 0.8, "lp", 2)
    y = with_reverb(y, "hall", 0.4, n)
    return y * (0.3 + 0.7 * I)[:, None] * 10 ** (LAYER_LEVEL.get("pad", 0) / 20)


@gen("layer")
def plucks(bars=4, bpm=120.0, chords=("Dm",), intensity=0.6, pattern="0121012101210121", octave_low=62, decay=0.09, seed=32):
    """Staccato strings-like plucks (spiccato ostinato). pattern digits index chord tones; 'x' = top+octave."""
    rng = _rng(seed)
    bl = _bar(bpm)
    step = bl / 16
    n = _n(bars * bl + 1.0)
    y = np.zeros((n, 2))
    k = 0
    for b, s, ch in _steps(pattern, bars):
        I = float(_ramp(intensity, b + s / 16, bars))
        tones = voice_chord(_chord_at(chords, b), octave_low)
        mn = tones[-1] + 12 if ch == "x" else tones[int(ch) % len(tones)] + 12 * (int(ch) // len(tones))
        m = _n(0.4)
        tt = _t(m)
        f = mtof(mn)
        o = saw(f * 1.003, m, rng.random()) + saw(f * 0.997, m, rng.random())
        o = svf(o, 700 + 3800 * I * np.exp(-tt / 0.05), 0.9, "lp", 2)
        o = svf(o, 180, 0.7, "hp")
        o += svf(white(m, rng), 3000, 1.0, "bp") * np.exp(-tt / 0.008) * 0.25
        o *= ad(tt, 0.003, decay * (2.5 + 2 * I))
        vel = 10 ** (rng.uniform(-2, 0.5) / 20) * (1.0 if s % 4 == 0 else 0.8)
        jit = rng.uniform(-0.003, 0.003)
        _place(y, pan(o * vel, 0.25 if k % 2 else -0.25), _n(max(0, b * bl + s * step + jit)))
        k += 1
    y = with_reverb(y, "room", 0.18, n)
    y = with_reverb(y, "hall", 0.15, n)
    gain = _ramp(intensity, _t(n) / bl, bars)
    return y * (0.3 + 0.7 * gain)[:, None] * 10 ** (LAYER_LEVEL.get("plucks", 0) / 20)


def _taiko_hit(vel, p, rng):
    m = _n(1.4)
    tt = _t(m)
    f = 62 * p * (1 + 1.3 * np.exp(-tt / 0.035))
    body = sine(f, m) * ad(tt, 0.002, 1.0)
    skin = svf(white(m, rng), 520 * p, 0.9, "bp") * np.exp(-tt / 0.045) * 0.7
    slap = hpf(white(m, rng) * np.exp(-tt / 0.002), 1500) * 0.25
    shell = sine(f * 1.58, m) * np.exp(-tt / 0.15) * 0.2
    return saturate((body + skin + slap + shell) * vel, 4)


@gen("layer")
def taiko(bars=4, bpm=120.0, intensity=0.7, pattern=None, pitch=1.0, ensemble=3, seed=33):
    """Taiko-style ensemble drums. pattern per 16th: X accent, x normal, o ghost, . rest (default by intensity)."""
    rng = _rng(seed)
    bl = _bar(bpm)
    step = bl / 16
    I0 = float(np.mean(_ramp(intensity, np.linspace(0, bars, 16), bars)))
    if pattern is None:
        pattern = "X..............." if I0 < 0.35 else ("X.......X...x..." if I0 < 0.7 else "X..x..x.X...X.x.")
    n = _n(bars * bl + 2.5)
    y = np.zeros((n, 2))
    for b, s, ch in _steps(pattern, bars):
        I = float(_ramp(intensity, b + s / 16, bars))
        vel = {"X": 1.0, "x": 0.6, "o": 0.3}.get(ch, 0.6) * (0.5 + 0.5 * I)
        for e in range(ensemble):
            off = 0 if e == 0 else rng.uniform(-0.008, 0.012)
            p = pitch * (1 + (e - (ensemble - 1) / 2) * 0.06 + rng.uniform(-0.01, 0.01))
            pn = 0 if ensemble == 1 else (e / (ensemble - 1) * 2 - 1) * 0.45
            _place(y, pan(_taiko_hit(vel * (1 if e == 0 else 0.7), p, rng), pn), _n(max(0, b * bl + s * step + off)))
    y = with_reverb(y, "hall", 0.3, n)
    return y * 10 ** (LAYER_LEVEL.get("taiko", 0) / 20)


def _kick(m, rng):
    tt = _t(m)
    f = 48 * (1 + 2.3 * np.exp(-tt / 0.03))
    return saturate(sine(f, m) * ad(tt, 0.001, 0.5) + hpf(white(m, rng) * np.exp(-tt / 0.001), 1500) * 0.3, 6)


def _snare(m, rng):
    tt = _t(m)
    tone = sine(190 * (1 + 0.15 * np.exp(-tt / 0.01)), m) * np.exp(-tt / 0.06) * 0.6 + sine(330, m) * np.exp(-tt / 0.04) * 0.3
    nz = svf(white(m, rng), 3500, 0.6, "bp") * np.exp(-tt / 0.13) * 0.8 + svf(white(m, rng), 7000, 0.7, "hp") * np.exp(-tt / 0.07) * 0.3
    return saturate(tone + nz, 4)


def _clap(m, rng):
    tt = _t(m)
    y = np.zeros(m)
    for k, d in enumerate((0.0, 0.009, 0.018, 0.028)):
        i = _n(d) if d else 0
        x = np.zeros(m)
        x[i:] = np.exp(-tt[: m - i] / (0.004 if k < 3 else 0.12))
        y += x
    return svf(white(m, rng), 1200, 1.1, "bp") * y


def _hat(m, rng, open_=False):
    tt = _t(m)
    met = sum(square(f * 2.2, m, 0.5, rng.random()) for f in (205.3, 304.4, 369.6, 522.7, 540.0, 800.0)) / 6
    s = svf(met * 0.6 + white(m, rng) * 0.5, 7500, 0.7, "hp")
    return s * np.exp(-tt / (0.25 if open_ else 0.035))


@gen("layer")
def drums(bars=4, bpm=120.0, intensity=0.8, kick="X...X...X...X...", snare="....X.......X...", clap="", hats="", seed=34):
    """Kick / snare / clap / hats from 16-step patterns (X accent, x normal, o ghost, O open hat), glued."""
    rng = _rng(seed)
    bl = _bar(bpm)
    step = bl / 16
    n = _n(bars * bl + 1.5)
    y = np.zeros((n, 2))
    m = _n(0.9)
    voices = {"kick": (kick, lambda: st(_kick(m, rng)), 1.0),
              "snare": (snare, lambda: stereoize(_snare(m, rng), 0.3), 0.55),
              "clap": (clap, lambda: stereoize(_clap(m, rng), 0.5), 0.5),
              "hats": (hats, None, 0.18)}
    verb = np.zeros((n, 2))
    for name, (pat, mk, lvl) in voices.items():
        for b, s, ch in _steps(pat, bars):
            I = float(_ramp(intensity, b + s / 16, bars))
            vel = {"X": 1.0, "x": 0.7, "o": 0.35, "O": 0.8}.get(ch, 0.7) * lvl * (0.6 + 0.4 * I)
            hit = pan(_hat(m, rng, ch == "O"), 0.3) if name == "hats" else mk()
            i = _n(b * bl + s * step)
            _place(y, hit * vel, i)
            if name in ("snare", "clap"):
                _place(verb, hit * vel, i)
    y += 0.25 * with_reverb(verb, "plate", 1.0, n) - 0.25 * verb
    y, _ = compress(y, -16, 3, 0.005, 0.12, 6, 0, rms_ms=3)
    gain = 0.45 + 0.55 * _ramp(intensity, _t(n) / bl, bars)
    return saturate(y, 3) * gain[:, None] * 10 ** (LAYER_LEVEL.get("drums", 0) / 20)


@gen("layer")
def shepard(bars=4, bpm=120.0, intensity=0.6, rate=0.12, partials=8, f_low=40.0, direction=1, pulse=0.0, seed=35):
    """Endless rising Shepard-Risset glissando tension bed (rate in octaves/s); optional 16th pulse."""
    bl = _bar(bpm)
    n = _n(bars * bl + 1.0)
    t = _t(n)
    chans = []
    for c, det in enumerate((-4.0, 4.0)):
        acc = np.zeros(n)
        for k in range(partials):
            pos = (k + direction * rate * t) % partials
            f = f_low * 2 ** pos * 2 ** (det / 1200)
            amp = 0.5 - 0.5 * np.cos(TAU * pos / partials)
            acc += (sine(f, n, k / partials) + 0.25 * tri(f, n, 0.3)) * amp ** 1.5
        chans.append(acc)
    y = np.stack(chans, 1) / partials ** 0.5
    I = _ramp(intensity, t / bl, bars)
    y = svf(y, 600 + 5000 * I, 0.7, "lp")
    if pulse > 0:
        ph = (t / (bl / 16)) % 1.0
        y *= (1 - pulse * (1 - np.exp(-ph * 6)))[:, None]
    y = with_reverb(y, "hall", 0.3, n)
    return y * (0.2 + 0.8 * I)[:, None] * 10 ** (LAYER_LEVEL.get("shepard", 0) / 20)


@gen("layer")
def resolve_swell(bars=3, bpm=120.0, chords=("D",), intensity=1.0, swell=0.45, seed=36):
    """Final resolving chord swell: strings + brass + 'ah' choir + sub, crescendo then long hall release."""
    rng = _rng(seed)
    bl = _bar(bpm)
    L = bars * bl
    n = _n(L + 3.0)
    t = _t(n)
    c = _chord_at(chords, 0)
    root = bass_note(c, 38)
    tones = voice_chord(c, 50)
    vib = 2 ** ((5 * np.sin(TAU * 5.0 * t)) / 1200)
    strings = np.zeros((n, 2))
    for mn in tones + [x + 12 for x in tones] + [tones[0] + 24]:
        strings += supersaw(mtof(mn), n, 5, 10, 0.9, rng, vib)
    ts = swell * L
    open_ = np.clip(t / ts, 0, 1) ** 1.5
    strings = svf(strings, 400 + 4500 * intensity * open_, 0.8, "lp", 2) / 4
    brass = np.zeros((n, 2))
    for mn in (root + 12, root + 19, root + 24):
        brass += supersaw(mtof(mn), n, 3, 8, 0.6, rng)
    brass = svf(brass, 200 + 2200 * intensity * open_ ** 2, 1.1, "lp", 2)
    brass = saturate(eq(brass, "peak", 540, 1.3, 5), 8) * 0.5
    choir = np.zeros((n, 2))
    for mn in [x + 12 for x in tones]:
        src = supersaw(mtof(mn), n, 3, 14, 0.9, rng, vib)
        choir += svf(src, 730, 6, "bp") + 0.6 * svf(src, 1090, 8, "bp") + 0.3 * svf(src, 2440, 10, "bp")
    sub = st(sine(mtof(root - 12), n) * 0.6 + sine(mtof(root), n) * 0.3)
    amp = np.clip(t / ts, 0, 1) ** 2
    rel_start = L * 0.65
    amp *= np.where(t < rel_start, 1.0, np.exp(-6.9078 * (t - rel_start) / (L - rel_start + 3.0)))
    y = (strings + brass + choir * 0.5 + sub) * amp[:, None]
    y = with_reverb(y, "huge", 0.35, n)
    return y * (0.4 + 0.6 * float(_ramp(intensity, 0.0, bars))) * 10 ** (LAYER_LEVEL.get("resolve_swell", 0) / 20)


@gen("layer")
def ticks(bars=4, bpm=120.0, subdiv=2, accent_every=4, accel=1.0, tone=1.0, intensity=1.0, seed=37):
    """Grid-locked woody tick ostinato (wraps `tick`)."""
    y = tick(bars * _bar(bpm), bpm, subdiv, accent_every, accel, tone, seed=seed)
    return y * float(np.mean(_ramp(intensity, np.linspace(0, bars, 8), bars))) * 10 ** (LAYER_LEVEL.get("ticks", 0) / 20)


@gen("layer")
def drone(bars=4, bpm=120.0, note="D1", intensity=0.6, brightness=0.4, seed=38):
    """Low sustained drone: saw + sine + filtered noise breath, slow movement."""
    rng = _rng(seed)
    bl = _bar(bpm)
    n = _n(bars * bl + 1.5)
    t = _t(n)
    f = mtof(midi(note))
    y = supersaw(f, n, 3, 6, 0.5, rng) * 0.6 + st(sine(f, n)) * 0.8 + st(sine(2 * f, n)) * 0.2
    I = _ramp(intensity, t / bl, bars)
    y = svf(y, 120 + 900 * brightness * I * (0.7 + 0.3 * smooth_random(n, rng, 0.2)), 0.9, "lp", 2)
    y += stereoize(svf(pink(n, rng), 300, 1.0, "bp"), 0.6) * 0.08 * I[:, None]
    y = fade(y, 1.0, 1.2)
    return y * (0.2 + 0.8 * I)[:, None] * 10 ** (LAYER_LEVEL.get("drone", 0) / 20)


# calibration: dB trims so every layer at intensity 1 lands near -18 LUFS on its own
# (measured with audio/calibrate in the README: 4 bars, intensity 1, Dm-Bb-Gm-A). ticks are transient
# (crest ~27 dB) so they sit at about -24 LUFS to keep their peaks out of the master limiter.
LAYER_LEVEL.update({"bass_ostinato": -12.3, "pad": -17.1, "plucks": -11.9, "taiko": -14.8, "drums": -3.5,
                    "shepard": -15.1, "resolve_swell": -16.1, "ticks": 4.5, "drone": -12.1})


# =============================================================================
# rendering + mixer
# =============================================================================

def render(name: str, **params):
    """Render a generator by name -> (n, 2). Use render_hit() to also get the sync sample."""
    return render_hit(name, **params)[0]


def render_hit(name: str, **params):
    g = GENERATORS[name]
    sig = inspect.signature(g["fn"])
    kw = {k: v for k, v in params.items() if k in sig.parameters}
    unknown = set(params) - set(kw)
    if unknown:
        print(f"  [warn] {name}: ignoring unknown params {sorted(unknown)}", file=sys.stderr)
    for k, v in list(kw.items()):
        if isinstance(v, list) and k in ("chords",):
            kw[k] = tuple(v)
    out = g["fn"](**kw)
    if isinstance(out, tuple):
        y, hit = out
    else:
        y, hit = out, 0
    y = st(np.nan_to_num(np.asarray(y, float)))
    if g["kind"] == "layer":
        y = hpf(y, 18, 2)  # pitched-envelope drums/bass carry DC per hit; block it at the source
    return y, int(hit)


def vo_chain(x):
    """Voice bus: HPF 80, de-mud 280 Hz, presence 3.5 kHz, air shelf, 3:1 compressor."""
    y = hpf(x, 80, 2)
    y = eq(y, "peak", 280, 1.0, -2.0)
    y = eq(y, "peak", 3500, 0.8, 2.5)
    y = eq(y, "highshelf", 10000, 0.7, 1.5)
    y, _ = compress(y, -20, 3.0, 0.004, 0.12, 6, 0, rms_ms=5)
    return y


FX = {
    "radio": lambda y: saturate(svf(svf(y, 3200, 0.7, "lp", 2), 380, 0.7, "hp", 2), 9),
    "reverse": lambda y: y[::-1].copy(),
    "lofi": lambda y: np.stack([bitcrush(y[:, c], 8, 2) for c in range(2)], 1),
}


def _cue_time(cue, bpm):
    bl = _bar(bpm)
    if "at" in cue:
        return float(cue["at"])
    if "bar" in cue:
        return float(cue["bar"]) * bl + float(cue.get("beat", 0)) * bl / 4
    if "hit_at" in cue:
        return float(cue["hit_at"])
    if "hit_bar" in cue:
        return float(cue["hit_bar"]) * bl + float(cue.get("beat", 0)) * bl / 4
    return 0.0


RESERVED = {"type", "at", "bar", "beat", "hit_at", "hit_bar", "gain_db", "pan", "width", "bus", "fade_in",
            "fade_out", "trim", "verb", "fx", "params", "label", "path", "mute", "comment", "hpf"}


def duck_gain(key, depth_db=9.0, attack=0.06, release=0.45, hold=0.25, rel_thresh=-26.0):
    """Gain curve (linear) that drops by depth_db while the key (VO) bus is active."""
    k = mono(key)
    c = math.exp(-1.0 / (0.02 * SR))
    p = lfilter([1 - c], [1, -c], k * k)
    lvl = 10 * np.log10(p + 1e-12)
    active = lvl[lvl > -70]
    if active.size == 0:
        return np.ones(len(k)), np.zeros(len(k))
    thr = np.percentile(active, 95) + rel_thresh
    pres = np.clip((lvl - thr) / 6 + 0.5, 0, 1)
    pres = maximum_filter1d(pres, size=max(1, _n(hold * 2)))
    pres = _ar_follow(np.ascontiguousarray(pres), math.exp(-1 / (attack * SR)), math.exp(-1 / (release * SR)))
    gdb = -depth_db * pres
    return 10 ** (gdb / 20), pres


def render_sheet(sheet: dict, base: Path | None = None, verbose=True):
    """Render a cue sheet dict. Returns dict(mix, buses, report, gain_curves)."""
    base = base or ROOT
    bpm = float(sheet.get("bpm", 120))
    bl = _bar(bpm)
    chords = sheet.get("chords", ["Dm"])
    dur = float(sheet.get("duration", 30))
    n = _n(dur)
    bus_cfg = {"music": {}, "sfx": {}, "vo": {"chain": "vo"}}
    for k, v in (sheet.get("buses") or {}).items():
        bus_cfg.setdefault(k, {}).update(v)
    buses = {k: np.zeros((n, 2)) for k in bus_cfg}
    sends: dict[tuple[str, str], np.ndarray] = {}
    log = []
    for ci, cue in enumerate(sheet.get("cues", [])):
        typ = cue["type"]
        params = dict(cue.get("params", {}))
        params.update({k: v for k, v in cue.items() if k not in RESERVED})
        if typ == "file":
            p = Path(cue["path"])
            p = p if p.is_absolute() else base / p
            if not p.exists():
                print(f"  [warn] cue {ci}: missing file {p}, skipped", file=sys.stderr)
                continue
            y, sr = sf.read(str(p), dtype="float64", always_2d=True)
            if sr != SR:
                g = math.gcd(sr, SR)
                y = resample_poly(y, SR // g, sr // g, axis=0)
            y = st(y[:, 0]) if y.shape[1] == 1 else y[:, :2]
            hit = 0
            default_bus = "vo"
        else:
            if typ not in GENERATORS:
                raise SystemExit(f"cue {ci}: unknown type {typ!r}")
            g = GENERATORS[typ]
            if g["kind"] == "layer":
                params.setdefault("bpm", bpm)
                if "chords" in inspect.signature(g["fn"]).parameters and "chords" not in params:
                    b0 = int(round(float(cue.get("bar", _cue_time(cue, bpm) / bl))))
                    nb = int(params.get("bars", 4))
                    params["chords"] = [_chord_at(chords, b0 + i) for i in range(nb)]
            y, hit = render_hit(typ, **params)
            default_bus = "music" if g["kind"] == "layer" else "sfx"
        for fx in cue.get("fx", []):
            y = FX[fx](y)
        if cue.get("hpf"):
            y = hpf(y, float(cue["hpf"]), 4)  # per-cue high-pass (e.g. keep a swell's sub out of the tail)
        if cue.get("trim"):
            y = fade(y[: _n(float(cue["trim"]))], 0, 0.02)
        y = fade(y, float(cue.get("fade_in", 0)), float(cue.get("fade_out", 0)))
        if "width" in cue:
            y = width(y, float(cue["width"]))
        if cue.get("pan", 0):
            p = float(cue["pan"])
            y = pan(mono(y), p) if np.allclose(y[:, 0], y[:, 1]) else balance(y, p)
        y = y * 10 ** (float(cue.get("gain_db", 0)) / 20)
        t0 = _cue_time(cue, bpm)
        if "hit_at" in cue or "hit_bar" in cue:
            t0 -= hit / SR
        bus = cue.get("bus", default_bus)
        if bus not in buses:
            buses[bus] = np.zeros((n, 2))
            bus_cfg[bus] = {}
        _place(buses[bus], y, _n(t0) if t0 > 0 else int(round(t0 * SR)))
        verb = cue.get("verb")
        if verb:
            verb = {"hall": verb} if isinstance(verb, (int, float)) else verb
            for rv, amt in verb.items():
                key = (bus, rv)
                if key not in sends:
                    sends[key] = np.zeros((n, 2))
                _place(sends[key], y * float(amt), _n(t0) if t0 > 0 else int(round(t0 * SR)))
        log.append({"cue": ci, "type": typ, "label": cue.get("label", ""), "start": round(t0, 3),
                    "end": round(t0 + len(y) / SR, 3), "bus": bus})
        if verbose:
            print(f"  cue {ci:02d} {typ:16s} {t0:7.3f}s -> {bus}")
    for (bus, rv), s in sends.items():
        w = reverb(s, rv)
        buses[bus] += w[:n]
    for name, cfg in bus_cfg.items():
        if cfg.get("chain") == "vo" and np.any(buses[name]):
            buses[name] = vo_chain(buses[name])
        if cfg.get("gain_db"):
            buses[name] *= 10 ** (cfg["gain_db"] / 20)
    gains = {}
    for name, cfg in bus_cfg.items():
        d = cfg.get("duck")
        if d and d.get("key") in buses and np.any(buses[d["key"]]):
            g, pres = duck_gain(buses[d["key"]], float(d.get("depth_db", 9)), float(d.get("attack", 0.06)),
                                float(d.get("release", 0.45)), float(d.get("hold", 0.25)))
            buses[name] *= g[:, None]
            gains[name] = g
    # optional auto VO level: put each VO-keyed bus `over_bed_lu` LU above everything else while it speaks
    auto = {}
    for name, cfg in bus_cfg.items():
        tgt = cfg.get("over_bed_lu")
        if tgt is None or not np.any(buses[name]):
            continue
        _, pres = duck_gain(buses[name], 1.0)
        mask = pres > 0.5
        if mask.sum() < _n(0.5):
            continue
        bed = sum(v for k, v in buses.items() if k != name)
        lv, lb = lufs(buses[name][mask]), lufs(bed[mask])
        if np.isfinite(lv) and np.isfinite(lb):
            gdb = float(np.clip(tgt - (lv - lb), -24, 24))
            buses[name] *= 10 ** (gdb / 20)
            auto[name] = {"gain_db": round(gdb, 2), "before_lu": round(lv - lb, 2), "target_lu": tgt}
    for mt in sheet.get("mutes", []):
        a, b = _n(float(mt["from"])), _n(float(mt["to"]))
        f = _n(float(mt.get("fade", 0.01)))
        mask = np.ones(n)
        mask[a:b] = 0
        if f > 1:
            mask[max(0, a - f):a] = np.linspace(1, 0, a - max(0, a - f))
            mask[b:min(n, b + f)] = np.linspace(0, 1, min(n, b + f) - b)
        for bn in mt.get("buses", list(buses)):
            if bn in buses:
                buses[bn] *= mask[:, None]
    if sheet.get("fade_out") or sheet.get("fade_in"):
        for k in buses:
            buses[k] = fade(buses[k], float(sheet.get("fade_in", 0)), float(sheet.get("fade_out", 0)), 1.5)
    mix = sum(buses.values())
    mcfg = {"lufs": -14.0, "true_peak": -1.0, "glue": True}
    mcfg.update(sheet.get("master", {}))
    mix, master_gain, glue_gr = master(mix, mcfg["lufs"], mcfg["true_peak"], mcfg["glue"])
    rep = {"lufs_i": round(lufs(mix), 2), "true_peak_dbtp": round(true_peak_db(mix), 2),
           "master_gain_db": round(20 * math.log10(master_gain), 2),
           "glue_max_gr_db": round(float(-glue_gr.min()), 2) if glue_gr is not None else 0.0,
           "cues": log}
    for name, g in gains.items():
        rep[f"duck_{name}_min_db"] = round(20 * math.log10(g.min()), 2)
    if auto:
        rep["auto_vo_level"] = auto
    return {"mix": mix, "buses": {k: v * master_gain for k, v in buses.items()}, "report": rep, "gains": gains}


def master(x, target_lufs=-14.0, ceiling=-1.0, glue=True):
    """Pre-gain to -18 LUFS, gentle glue compression (2:1, slow), true-peak limiting, LUFS loop.
    Returns (y, total_linear_gain_before_limiter, glue_gr_db)."""
    L0 = lufs(x)
    if not np.isfinite(L0):
        return x, 1.0, None
    g0 = 10 ** ((-18.0 - L0) / 20)
    y = hpf(x, 22, 2) * g0  # DC / subsonic blocker (nothing useful lives below ~25 Hz)
    gr = None
    if glue:
        gcfg = glue if isinstance(glue, dict) else {}
        y, gr = compress(y, gcfg.get("threshold", -12.0), gcfg.get("ratio", 2.0), gcfg.get("attack", 0.03),
                         gcfg.get("release", 0.25), gcfg.get("knee", 6.0), 0.0, rms_ms=25)
    g = 1.0
    out = y
    for _ in range(6):
        out, _ = limit(y * g, ceiling)
        L = lufs(out)
        if abs(L - target_lufs) < 0.05:
            break
        g *= 10 ** ((target_lufs - L) / 20)
    return out, g0 * g, gr


def write_wav(path, x, subtype="PCM_24"):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    y = st(x).astype(np.float32)
    if subtype != "FLOAT":
        y = np.clip(y, -1, 1)
    sf.write(str(path), y, SR, subtype=subtype)


# =============================================================================
# CLI
# =============================================================================

def _parse_val(v: str):
    try:
        return json.loads(v)
    except json.JSONDecodeError:
        return v


def cmd_list(_a):
    for kind in ("oneshot", "layer"):
        print(f"\n{kind.upper()}S")
        for name, g in GENERATORS.items():
            if g["kind"] != kind:
                continue
            sig = inspect.signature(g["fn"])
            ps = ", ".join(f"{k}={v.default!r}" for k, v in sig.parameters.items())
            print(f"  {name}{' [hit=end]' if g['hit'] == 'end' else ''}: {g['doc']}\n      {ps}")


def cmd_one(a):
    params = dict(kv.split("=", 1) for kv in a.p or [])
    params = {k: _parse_val(v) for k, v in params.items()}
    y = render(a.name, **params)
    write_wav(a.o, y)
    import measure
    print(json.dumps(measure.report(y, SR), indent=1))
    if a.png:
        measure.spectrogram_png(y, SR, a.png, title=a.name)


def cmd_render(a):
    sheet = json.loads(Path(a.sheet).read_text())
    res = render_sheet(sheet)
    write_wav(a.o, res["mix"])
    if a.stems:
        for k, v in res["buses"].items():  # float WAV: pre-limiter stems may exceed 0 dBFS
            write_wav(Path(a.stems) / f"{k}.wav", v, subtype="FLOAT")
    import measure
    rep = res["report"]
    rep.update({k: v for k, v in measure.report(res["mix"], SR).items() if k not in rep})
    rep["short_term_lufs_max"] = round(float(np.max(measure.short_term_lufs(res["mix"], SR))), 2)
    print(json.dumps({k: v for k, v in rep.items() if k != "cues"}, indent=1))
    Path(a.report or (str(Path(a.o).with_suffix("")) + "_report.json")).write_text(json.dumps(rep, indent=1))
    if a.png:
        marks = [(c["start"], c["type"]) for c in rep["cues"] if GENERATORS.get(c["type"], {}).get("kind") != "layer"]
        measure.spectrogram_png(res["mix"], SR, a.png, title=Path(a.o).name, markers=marks, width=22)


def _vo_text(path: Path) -> str | None:
    for man in [path.parent / "vo_manifest.json", path.parent / "manifest.json"]:
        if man.exists():
            for e in json.loads(man.read_text()).values():
                if isinstance(e, dict) and Path(e.get("file", "")).resolve() == path.resolve():
                    return e.get("text")
    return None


def check_mix(sheet: dict, mix_path, stems_dir=None, base: Path | None = None) -> list[dict]:
    """Per VO cue: Whisper WER of the finished mix in the VO window, and VO-to-bed loudness ratio."""
    import measure
    import tts
    base = base or ROOT
    mix, sr = sf.read(str(mix_path), dtype="float64", always_2d=True)
    stems = {}
    if stems_dir:
        for p in Path(stems_dir).glob("*.wav"):
            stems[p.stem] = sf.read(str(p), dtype="float64", always_2d=True)[0]
    bpm = float(sheet.get("bpm", 120))
    out = []
    for cue in sheet.get("cues", []):
        if cue.get("type") != "file" or cue.get("bus", "vo") != "vo":
            continue
        p = Path(cue["path"])
        p = p if p.is_absolute() else base / p
        text = cue.get("text") or _vo_text(p)
        if not p.exists():
            continue
        d = sf.info(str(p)).duration
        t0 = _cue_time(cue, bpm)
        a, b = max(0, int((t0 - 0.15) * sr)), min(len(mix), int((t0 + d + 0.25) * sr))
        row = {"file": p.name, "at": t0, "dur": round(d, 2)}
        if text:
            tmp = WORK / "audio" / "_check.wav"
            tmp.parent.mkdir(parents=True, exist_ok=True)
            sf.write(str(tmp), mix[a:b].astype(np.float32), sr)
            r = tts.align(tmp, text)
            row.update({"text": text, "heard": r["transcript"], "wer_in_mix": r["wer"]})
        if "vo" in stems:
            others = sum(v for k, v in stems.items() if k != "vo")
            lv = measure.integrated_lufs(stems["vo"][a:b], sr)
            lo = measure.integrated_lufs(others[a:b], sr) if not np.isscalar(others) else float("-inf")
            row.update({"vo_lufs": round(lv, 1), "bed_lufs": round(lo, 1), "vo_over_bed_lu": round(lv - lo, 1)})
        out.append(row)
    return out


def cmd_check(a):
    sheet = json.loads(Path(a.sheet).read_text())
    rows = check_mix(sheet, a.mix, a.stems)
    print(json.dumps(rows, indent=1))


def cmd_pack(a):
    import measure
    names = [k for k, g in GENERATORS.items() if g["kind"] == "oneshot"]
    out_dir = Path(a.dir) if a.dir else None
    parts, marks, rows = [], [], []
    pos = 0.0
    gap = np.zeros((_n(a.gap), 2))
    for name in names:
        y = render(name)
        if out_dir:
            write_wav(out_dir / f"{name}.wav", y)
        r = measure.report(y, SR)
        r["spectral_flatness"] = round(measure.spectral_flatness(y, SR), 4)
        r["bands"] = measure.band_energy(y, SR)
        rows.append({"name": name, "start": round(pos, 3), **r})
        marks.append((pos, name))
        parts += [y, gap]
        pos += len(y) / SR + a.gap
        print(f"  {name:16s} {r['duration_s']:5.2f}s LUFS {r['lufs_i']:7.2f} TP {r['true_peak_dbtp']:6.2f} "
              f"centroid {r['spectral_centroid_hz']:7.0f} Hz flat {r['spectral_flatness']:.3f}")
        if out_dir and a.png:
            measure.spectrogram_png(y, SR, out_dir / f"{name}.png", title=name, width=10)
    pack = np.concatenate(parts, 0)
    write_wav(a.o, pack)
    Path(str(Path(a.o).with_suffix("")) + "_report.json").write_text(json.dumps(rows, indent=1))
    if a.png:
        measure.spectrogram_png(pack, SR, str(Path(a.o).with_suffix(".png")), title="sfx pack", markers=marks, width=30)


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("list").set_defaults(fn=cmd_list)
    p = sub.add_parser("one")
    p.add_argument("name")
    p.add_argument("-p", action="append", help="param=value (JSON values ok)")
    p.add_argument("-o", required=True)
    p.add_argument("--png")
    p.set_defaults(fn=cmd_one)
    p = sub.add_parser("render")
    p.add_argument("sheet")
    p.add_argument("-o", required=True)
    p.add_argument("--stems")
    p.add_argument("--report")
    p.add_argument("--png")
    p.set_defaults(fn=cmd_render)
    p = sub.add_parser("check", help="VO intelligibility in a finished mix (Whisper WER + VO/bed loudness)")
    p.add_argument("sheet")
    p.add_argument("mix")
    p.add_argument("--stems")
    p.set_defaults(fn=cmd_check)
    p = sub.add_parser("pack")
    p.add_argument("-o", required=True)
    p.add_argument("--gap", type=float, default=1.0)
    p.add_argument("--dir")
    p.add_argument("--png", action="store_true")
    p.set_defaults(fn=cmd_pack)
    a = ap.parse_args(argv)
    sys.path.insert(0, str(HERE))
    a.fn(a)


if __name__ == "__main__":
    main()
