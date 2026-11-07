#!/usr/bin/env python3
"""Objective audio measurements shared by the audio toolkit.

Nobody on the crew can listen, so every rendered file is checked by numbers:
loudness (ITU-R BS.1770-4 integrated LUFS via pyloudnorm), true peak (4x oversampled),
sample peak, clipping, DC offset, NaN/Inf/denormals, spectral centroid, rough F0 range,
word error rate, plus spectrogram PNGs.

CLI:
  python3 audio/measure.py FILE.wav [FILE2.wav ...] [--png OUT.png] [--json]
"""
from __future__ import annotations

import argparse
import json
import math
import re
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

try:
    import pyloudnorm as pyln
except ImportError:  # pragma: no cover
    pyln = None


# ---------------------------------------------------------------------------
# basic I/O
# ---------------------------------------------------------------------------

def read(path: str | Path) -> tuple[np.ndarray, int]:
    """Read a file as float64, shape (n,) for mono or (n, ch)."""
    x, sr = sf.read(str(path), dtype="float64", always_2d=False)
    return x, sr


def as2d(x: np.ndarray) -> np.ndarray:
    return x[:, None] if x.ndim == 1 else x


def mono(x: np.ndarray) -> np.ndarray:
    return x if x.ndim == 1 else x.mean(axis=1)


def db(v: float, floor: float = -200.0) -> float:
    return 20.0 * math.log10(v) if v > 0 else floor


# ---------------------------------------------------------------------------
# loudness / peak
# ---------------------------------------------------------------------------

def integrated_lufs(x: np.ndarray, sr: int) -> float:
    """BS.1770-4 integrated loudness (gated). -inf for silence or < 400 ms."""
    if pyln is None:
        raise RuntimeError("pip install pyloudnorm")
    x2 = as2d(x)
    if x2.shape[0] < int(0.4 * sr):
        # pad short one-shots so the 400 ms block exists; gating removes the silence
        x2 = np.concatenate([x2, np.zeros((int(0.4 * sr) - x2.shape[0] + 1, x2.shape[1]))])
    meter = pyln.Meter(sr)
    with np.errstate(divide="ignore"):
        return float(meter.integrated_loudness(x2))


def short_term_lufs(x: np.ndarray, sr: int, win: float = 3.0, hop: float = 0.5) -> np.ndarray:
    """Ungated short-term loudness curve (3 s window) in LUFS."""
    x2 = as2d(x)
    meter = pyln.Meter(sr)
    n, h = int(win * sr), int(hop * sr)
    out = []
    for s in range(0, max(1, x2.shape[0] - n + 1), h):
        seg = x2[s:s + n]
        with np.errstate(divide="ignore"):
            out.append(meter.integrated_loudness(seg) if seg.shape[0] >= int(0.4 * sr) else -np.inf)
    return np.array(out)


def true_peak(x: np.ndarray, sr: int, os: int = 4) -> float:
    """True peak (linear) by 4x polyphase oversampling, per BS.1770 Annex 2 spirit."""
    x2 = as2d(x)
    if sr >= 176400:
        os = 1
    up = resample_poly(x2, os, 1, axis=0) if os > 1 else x2
    return float(np.max(np.abs(up))) if up.size else 0.0


def sample_peak(x: np.ndarray) -> float:
    return float(np.max(np.abs(x))) if x.size else 0.0


def clipping_runs(x: np.ndarray, thresh: float = 0.9999, min_run: int = 3) -> int:
    """Number of runs of >= min_run consecutive samples at/over full scale."""
    hits = 0
    for ch in as2d(x).T:
        over = np.abs(ch) >= thresh
        if not over.any():
            continue
        d = np.diff(np.concatenate([[0], over.astype(np.int8), [0]]))
        starts, ends = np.where(d == 1)[0], np.where(d == -1)[0]
        hits += int(np.sum((ends - starts) >= min_run))
    return hits


def health(x: np.ndarray) -> dict:
    """NaN/Inf/denormal/DC checks."""
    finite = np.isfinite(x)
    tiny = (np.abs(x) > 0) & (np.abs(x) < np.finfo(np.float32).tiny)
    dc = [float(c.mean()) for c in as2d(np.where(finite, x, 0)).T]
    return {
        "nan_or_inf": int((~finite).sum()),
        "denormals_f32": int(tiny.sum()),
        "dc_offset": max((abs(d) for d in dc), default=0.0),
    }


def spectral_centroid(x: np.ndarray, sr: int) -> float:
    """Energy-weighted spectral centroid in Hz over the whole file."""
    m = mono(x)
    if not np.any(m):
        return 0.0
    n = 4096
    hop = 2048
    win = np.hanning(n)
    acc = np.zeros(n // 2 + 1)
    for s in range(0, max(1, len(m) - n), hop):
        seg = m[s:s + n]
        if len(seg) < n:
            seg = np.pad(seg, (0, n - len(seg)))
        acc += np.abs(np.fft.rfft(seg * win)) ** 2
    f = np.fft.rfftfreq(n, 1 / sr)
    return float((f * acc).sum() / max(acc.sum(), 1e-30))


def band_energy(x: np.ndarray, sr: int, bands=((20, 60), (60, 250), (250, 2000), (2000, 6000), (6000, 20000))) -> dict:
    """Share of energy per band (sums to 1)."""
    m = mono(x)
    spec = np.abs(np.fft.rfft(m * np.hanning(len(m)))) ** 2 if len(m) else np.zeros(1)
    f = np.fft.rfftfreq(len(m), 1 / sr) if len(m) else np.zeros(1)
    tot = spec.sum() + 1e-30
    return {f"{lo}-{hi}": round(float(spec[(f >= lo) & (f < hi)].sum() / tot), 4) for lo, hi in bands}


def centroid_curve(x: np.ndarray, sr: int, hop_s: float = 0.05) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """(times, centroid Hz, frame rms dBFS) on 2048-sample frames every hop_s seconds."""
    m = mono(x)
    n, hop = 2048, int(hop_s * sr)
    win = np.hanning(n)
    f = np.fft.rfftfreq(n, 1 / sr)
    ts, cs, rs = [], [], []
    for s in range(0, max(1, len(m) - n), hop):
        seg = m[s:s + n]
        p = np.abs(np.fft.rfft(seg * win)) ** 2
        ts.append((s + n / 2) / sr)
        cs.append(float((f * p).sum() / (p.sum() + 1e-30)))
        rs.append(db(float(np.sqrt(np.mean(seg ** 2)))))
    return np.array(ts), np.array(cs), np.array(rs)


def spectral_flatness(x: np.ndarray, sr: int) -> float:
    """Wiener entropy (0 = tonal, 1 = white noise), median over frames with energy."""
    m = mono(x)
    n, hop = 2048, 1024
    win = np.hanning(n)
    vals = []
    peak = np.max(np.abs(m)) if len(m) else 0
    for s in range(0, max(1, len(m) - n), hop):
        seg = m[s:s + n]
        if len(seg) < n or np.max(np.abs(seg)) < 0.05 * peak:
            continue
        p = np.abs(np.fft.rfft(seg * win)) ** 2 + 1e-20
        vals.append(np.exp(np.mean(np.log(p))) / np.mean(p))
    return float(np.median(vals)) if vals else float("nan")


# ---------------------------------------------------------------------------
# speech
# ---------------------------------------------------------------------------

def f0_track(x: np.ndarray, sr: int, fmin: float = 60.0, fmax: float = 400.0,
             frame: float = 0.04, hop: float = 0.01, vthresh: float = 0.5) -> np.ndarray:
    """Rough F0 per frame by normalised autocorrelation; 0 where unvoiced."""
    m = mono(x)
    # analyse at 16 kHz with a gentle lowpass (speech F0 lives low)
    if sr != 16000:
        g = math.gcd(sr, 16000)
        m = resample_poly(m, 16000 // g, sr // g)
        sr = 16000
    n, h = int(frame * sr), int(hop * sr)
    lag_min, lag_max = int(sr / fmax), int(sr / fmin)
    rms_all = np.sqrt(np.mean(m ** 2)) + 1e-12
    out = []
    for s in range(0, len(m) - n, h):
        seg = m[s:s + n] - m[s:s + n].mean()
        if np.sqrt(np.mean(seg ** 2)) < 0.3 * rms_all:
            out.append(0.0)
            continue
        ac = np.correlate(seg, seg, "full")[n - 1:]
        if ac[0] <= 0:
            out.append(0.0)
            continue
        ac = ac / ac[0]
        seg_ac = ac[lag_min:lag_max]
        i = int(np.argmax(seg_ac))
        if seg_ac[i] < vthresh:
            out.append(0.0)
            continue
        lag = lag_min + i
        # parabolic interpolation
        if 0 < lag < len(ac) - 1:
            a, b, c = ac[lag - 1], ac[lag], ac[lag + 1]
            den = a - 2 * b + c
            if den != 0:
                lag = lag + 0.5 * (a - c) / den
        out.append(sr / lag)
    return np.array(out)


def f0_stats(x: np.ndarray, sr: int) -> dict:
    f0 = f0_track(x, sr)
    v = f0[f0 > 0]
    if v.size < 5:
        return {"f0_median_hz": None, "f0_p5_hz": None, "f0_p95_hz": None, "f0_range_st": None, "voiced_frac": 0.0}
    p5, p50, p95 = np.percentile(v, [5, 50, 95])
    return {
        "f0_median_hz": round(float(p50), 1),
        "f0_p5_hz": round(float(p5), 1),
        "f0_p95_hz": round(float(p95), 1),
        "f0_range_st": round(float(12 * math.log2(p95 / p5)), 2),
        "voiced_frac": round(float(v.size / f0.size), 3),
    }


_NUM = {"0": "zero", "1": "one", "2": "two", "3": "three", "4": "four", "5": "five",
        "6": "six", "7": "seven", "8": "eight", "9": "nine", "10": "ten"}


def normalize_words(text: str) -> list[str]:
    t = text.lower().replace("’", "'")
    t = re.sub(r"[^a-z0-9' ]+", " ", t)
    words = [w.strip("'") for w in t.split()]
    return [_NUM.get(w, w) for w in words if w]


def wer(ref: str, hyp: str) -> dict:
    r, h = normalize_words(ref), normalize_words(hyp)
    d = np.zeros((len(r) + 1, len(h) + 1), dtype=int)
    d[:, 0] = np.arange(len(r) + 1)
    d[0, :] = np.arange(len(h) + 1)
    for i in range(1, len(r) + 1):
        for j in range(1, len(h) + 1):
            d[i, j] = min(d[i - 1, j] + 1, d[i, j - 1] + 1, d[i - 1, j - 1] + (r[i - 1] != h[j - 1]))
    return {"wer": round(d[-1, -1] / max(1, len(r)), 4), "errors": int(d[-1, -1]), "ref_words": len(r),
            "cer": cer(ref, hyp)}


def cer(ref: str, hyp: str) -> float:
    """Character error rate on letters/digits only (ignores spacing, so 'wait list' == 'waitlist')."""
    r = "".join(normalize_words(ref)).replace("'", "")
    h = "".join(normalize_words(hyp)).replace("'", "")
    prev = list(range(len(h) + 1))
    for i in range(1, len(r) + 1):
        cur = [i] + [0] * len(h)
        for j in range(1, len(h) + 1):
            cur[j] = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (r[i - 1] != h[j - 1]))
        prev = cur
    return round(prev[-1] / max(1, len(r)), 4)


def speech_rate(text: str, seconds: float) -> float:
    return round(len(normalize_words(text)) / max(seconds, 1e-6) * 60.0, 1)


# ---------------------------------------------------------------------------
# reports
# ---------------------------------------------------------------------------

def report(x: np.ndarray, sr: int, loud: bool = True) -> dict:
    tp = true_peak(x, sr)
    sp = sample_peak(x)
    out = {
        "duration_s": round(as2d(x).shape[0] / sr, 3),
        "channels": as2d(x).shape[1],
        "sample_rate": sr,
        "sample_peak_dbfs": round(db(sp), 2),
        "true_peak_dbtp": round(db(tp), 2),
        "rms_dbfs": round(db(float(np.sqrt(np.mean(np.square(x)))) if x.size else 0), 2),
        "clip_runs": clipping_runs(x),
        "spectral_centroid_hz": round(spectral_centroid(x, sr), 1),
        **health(x),
    }
    if loud:
        out["lufs_i"] = round(integrated_lufs(x, sr), 2)
    if as2d(x).shape[1] == 2:
        l, r = x[:, 0], x[:, 1]
        den = math.sqrt(float(np.sum(l * l) * np.sum(r * r))) + 1e-30
        out["lr_correlation"] = round(float(np.sum(l * r) / den), 3)
    return out


def spectrogram_png(x: np.ndarray, sr: int, out: str | Path, title: str = "",
                    markers: list[tuple[float, str]] | None = None, fmax: float = 20000.0,
                    width: float = 16.0) -> None:
    """Log-frequency spectrogram + waveform envelope, saved as PNG."""
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    m = mono(x)
    n, hop = 2048, 256
    win = np.hanning(n)
    frames = max(1, (len(m) - n) // hop)
    S = np.empty((n // 2 + 1, frames), dtype=np.float32)
    for i in range(frames):
        S[:, i] = np.abs(np.fft.rfft(m[i * hop:i * hop + n] * win))
    S = 20 * np.log10(S + 1e-9)
    S -= S.max()
    f = np.fft.rfftfreq(n, 1 / sr)
    t = np.arange(frames) * hop / sr
    fig, (ax0, ax1) = plt.subplots(2, 1, figsize=(width, 7), sharex=True,
                                   gridspec_kw={"height_ratios": [1, 3]})
    env_hop = 480
    nn = len(m) // env_hop
    if nn:
        blk = np.abs(m[:nn * env_hop]).reshape(nn, env_hop).max(axis=1)
        ax0.fill_between(np.arange(nn) * env_hop / sr, -blk, blk, color="#efbd70", lw=0)
    ax0.set_ylim(-1, 1)
    ax0.set_ylabel("peak")
    ax0.set_facecolor("#101012")
    ax0.set_title(title)
    sel = (f >= 20) & (f <= fmax)
    ax1.pcolormesh(t, f[sel], S[sel], shading="auto", cmap="magma", vmin=-80, vmax=0)
    ax1.set_yscale("log")
    ax1.set_ylim(20, fmax)
    ax1.set_ylabel("Hz")
    ax1.set_xlabel("seconds")
    ax1.set_xlim(0, len(m) / sr)
    for tm, label in markers or []:
        for ax in (ax0, ax1):
            ax.axvline(tm, color="#5ad", lw=0.6, alpha=0.6)
        ax1.text(tm + 0.02, 25, label, color="white", fontsize=7, rotation=90, va="bottom")
    fig.tight_layout()
    fig.savefig(str(out), dpi=90)
    plt.close(fig)


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("files", nargs="+")
    ap.add_argument("--png", help="write a spectrogram PNG (single file only)")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args(argv)
    res = {}
    for p in a.files:
        x, sr = read(p)
        res[p] = report(x, sr)
        if a.png:
            spectrogram_png(x, sr, a.png, title=Path(p).name)
    if a.json:
        print(json.dumps(res, indent=2))
    else:
        for p, r in res.items():
            print(p)
            for k, v in r.items():
                print(f"  {k:22s} {v}")


if __name__ == "__main__":
    sys.exit(main())
