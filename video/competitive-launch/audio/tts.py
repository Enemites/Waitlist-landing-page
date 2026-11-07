#!/usr/bin/env python3
"""Voice-over renderer (Kokoro-82M via kokoro-onnx, local CPU).

Input: a JSON list of lines
  [{"id": "vo01", "text": "One world. Opposing plans.", "voice": "am_michael", "speed": 0.95}, ...]
Optional per-line keys:
  lang            "en-us" | "en-gb" (default: from voice prefix, a*=en-us, b*=en-gb)
  sentence_pause  seconds between sentences (default 0.32)
  clause_pause    seconds at commas (default 0.12)
  gain_db         extra gain after peak normalisation (default 0, never above the peak target)
  phonemes        raw IPA/misaki phoneme string to speak instead of the text (text stays for checks)
  phoneme_replace {"from": "to"} substitutions on the phonemised text, e.g. stress fixes:
                  {"hˌuːz": "hˈuːz"} makes "whose" stressed ("see WHOSE strategy holds")
Voice may be a blend: "am_michael:0.7+bm_george:0.3" (style vectors are mixed linearly).

Output per line: OUT/<id>.wav, 48 kHz mono 24-bit, leading/trailing silence trimmed (with short
natural pads), 70 Hz high-pass, sample peak normalised to -3 dBFS. A manifest JSON
(OUT/vo_manifest.json by default) lists duration, measured loudness and settings per id.
--align additionally transcribes each file with faster-whisper (small.en) and stores word
timestamps + WER against the script (use it to sync on-screen type to the VO).

Usage:
  python3 audio/tts.py lines.json [--out DIR] [--manifest PATH] [--align] [--force]
  python3 audio/tts.py --list-voices
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, resample_poly, sosfiltfilt

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
WORK = ROOT / ".work"
MODELS = WORK / "models"
KOKORO_MODEL = MODELS / "kokoro" / "kokoro-v1.0.onnx"
KOKORO_VOICES = MODELS / "kokoro" / "voices-v1.0.bin"
WHISPER_DIR = MODELS / "whisper-small.en"
DEFAULT_OUT = WORK / "audio" / "vo"
SR_OUT = 48000
PEAK_DBFS = -3.0

sys.path.insert(0, str(HERE))
import measure  # noqa: E402

_kokoro = None
_whisper = None


def kokoro():
    global _kokoro
    if _kokoro is None:
        from kokoro_onnx import Kokoro
        if not KOKORO_MODEL.exists():
            raise SystemExit(
                f"Missing {KOKORO_MODEL}. Download from HF:\n"
                "  curl -L -o .work/models/kokoro/kokoro-v1.0.onnx https://huggingface.co/fastrtc/kokoro-onnx/resolve/main/kokoro-v1.0.onnx\n"
                "  curl -L -o .work/models/kokoro/voices-v1.0.bin https://huggingface.co/fastrtc/kokoro-onnx/resolve/main/voices-v1.0.bin")
        _kokoro = Kokoro(str(KOKORO_MODEL), str(KOKORO_VOICES))
    return _kokoro


def whisper():
    global _whisper
    if _whisper is None:
        from faster_whisper import WhisperModel
        _whisper = WhisperModel(str(WHISPER_DIR), device="cpu", compute_type="int8", cpu_threads=4)
    return _whisper


def resolve_voice(spec: str):
    """'am_michael' or 'am_michael:0.7+bm_george:0.3' -> name or blended style array."""
    k = kokoro()
    if "+" not in spec and ":" not in spec:
        return spec
    parts = []
    for p in spec.split("+"):
        name, _, w = p.partition(":")
        parts.append((name.strip(), float(w or 1.0)))
    tot = sum(w for _, w in parts)
    return sum(k.get_voice_style(n) * (w / tot) for n, w in parts).astype(np.float32)


def lang_for(voice: str) -> str:
    first = voice.split("+")[0].strip()
    return "en-gb" if first.startswith("b") else "en-us"


def trim_silence(x: np.ndarray, sr: int, rel_db: float = -42.0, abs_db: float = -55.0,
                 pre: float = 0.025, post: float = 0.12) -> np.ndarray:
    """Trim leading/trailing silence on a 10 ms RMS envelope; keep short pads and fade the edges."""
    hop = int(0.01 * sr)
    n = len(x) // hop
    if n < 3:
        return x
    rms = np.sqrt(np.mean(x[:n * hop].reshape(n, hop) ** 2, axis=1) + 1e-20)
    rdb = 20 * np.log10(rms)
    thr = max(rdb.max() + rel_db, abs_db)
    on = np.where(rdb > thr)[0]
    if on.size == 0:
        return x
    s = max(0, on[0] * hop - int(pre * sr))
    e = min(len(x), (on[-1] + 1) * hop + int(post * sr))
    y = x[s:e].copy()
    fi, fo = int(0.004 * sr), int(0.04 * sr)
    y[:fi] *= np.linspace(0, 1, fi)
    y[-fo:] *= np.linspace(1, 0, fo) ** 2
    return y


def process(audio: np.ndarray, sr_in: int, gain_db: float = 0.0) -> np.ndarray:
    x = audio.astype(np.float64)
    if sr_in != SR_OUT:
        from math import gcd
        g = gcd(sr_in, SR_OUT)
        x = resample_poly(x, SR_OUT // g, sr_in // g)
    x = x - x.mean()
    x = sosfiltfilt(butter(2, 70, "highpass", fs=SR_OUT, output="sos"), x)
    x = trim_silence(x, SR_OUT)
    pk = np.max(np.abs(x)) + 1e-12
    target = 10 ** (min(PEAK_DBFS, PEAK_DBFS + gain_db) / 20)
    return x * (target / pk)


def line_hash(line: dict) -> str:
    keys = ("text", "voice", "speed", "lang", "sentence_pause", "clause_pause", "gain_db", "phonemes",
            "phoneme_replace")
    blob = json.dumps({k: line.get(k) for k in keys}, sort_keys=True) + "|v3"
    return hashlib.sha1(blob.encode()).hexdigest()[:12]


def phonemes_for(line: dict) -> str:
    voice = line.get("voice", "am_michael")
    ph = line.get("phonemes") or kokoro().tokenizer.phonemize(line["text"], line.get("lang") or lang_for(voice))
    for a, b in (line.get("phoneme_replace") or {}).items():
        ph = ph.replace(a, b)
    return ph


def synth_line(line: dict) -> np.ndarray:
    voice = line.get("voice", "am_michael")
    audio, sr = kokoro().create(
        phonemes_for(line),
        is_phonemes=True,
        voice=resolve_voice(voice),
        speed=float(line.get("speed", 1.0)),
        lang=line.get("lang") or lang_for(voice),
        sentence_pause=float(line.get("sentence_pause", 0.32)),
        clause_pause=float(line.get("clause_pause", 0.12)),
    )
    return process(audio, sr, float(line.get("gain_db", 0.0)))


def align(path: Path, text: str) -> dict:
    # pass a 16 kHz float array: faster-whisper's own decoder breaks with PyAV >= 15
    y, sr = sf.read(str(path), dtype="float64")
    if y.ndim > 1:
        y = y.mean(axis=1)
    from math import gcd
    g = gcd(sr, 16000)
    y16 = resample_poly(y, 16000 // g, sr // g).astype(np.float32)
    segs, _ = whisper().transcribe(y16, language="en", beam_size=5, word_timestamps=True,
                                   condition_on_previous_text=False, vad_filter=False,
                                   initial_prompt=None)
    words, hyp = [], []
    for s in segs:
        hyp.append(s.text)
        for w in s.words or []:
            words.append({"w": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3),
                          "p": round(w.probability, 3)})
    hyp_text = " ".join(h.strip() for h in hyp)
    return {"transcript": hyp_text, **measure.wer(text, hyp_text), "words": words}


def render(lines: list[dict], out: Path, manifest: Path, do_align: bool, force: bool) -> dict:
    out.mkdir(parents=True, exist_ok=True)
    old = {}
    if manifest.exists():
        try:
            old = json.loads(manifest.read_text())
        except Exception:
            old = {}
    res = dict(old) if isinstance(old, dict) else {}
    for line in lines:
        lid = str(line["id"])
        path = out / f"{lid}.wav"
        h = line_hash(line)
        cached = res.get(lid, {})
        if not force and path.exists() and cached.get("hash") == h and (not do_align or "words" in cached):
            print(f"[cached] {lid}")
            continue
        if force or not path.exists() or cached.get("hash") != h:
            y = synth_line(line)
            sf.write(str(path), y.astype(np.float32), SR_OUT, subtype="PCM_24")
        y, _ = sf.read(str(path), dtype="float64")
        dur = len(y) / SR_OUT
        entry = {
            "file": str(path),
            "text": line["text"],
            "voice": line.get("voice", "am_michael"),
            "speed": float(line.get("speed", 1.0)),
            "duration": round(dur, 3),
            "wpm": measure.speech_rate(line["text"], dur),
            "lufs_i": round(measure.integrated_lufs(y, SR_OUT), 2),
            "peak_dbfs": round(measure.db(measure.sample_peak(y)), 2),
            "true_peak_dbtp": round(measure.db(measure.true_peak(y, SR_OUT)), 2),
            "hash": h,
        }
        if do_align:
            entry.update(align(path, line["text"]))
        res[lid] = entry
        print(f"[ok] {lid}: {dur:.2f}s  {entry['wpm']} wpm" + (f"  WER {entry['wer']}" if do_align else ""))
    manifest.write_text(json.dumps(res, indent=2))
    return res


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("lines", nargs="?", help="JSON list of {id, text, voice, speed}")
    ap.add_argument("--out", default=str(DEFAULT_OUT))
    ap.add_argument("--manifest", help="default: OUT/vo_manifest.json")
    ap.add_argument("--align", action="store_true", help="faster-whisper word timestamps + WER")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--list-voices", action="store_true")
    a = ap.parse_args(argv)
    if a.list_voices:
        print(" ".join(sorted(kokoro().voices.files)))
        return 0
    if not a.lines:
        ap.error("lines JSON required")
    lines = json.loads(Path(a.lines).read_text())
    out = Path(a.out)
    manifest = Path(a.manifest) if a.manifest else out / "vo_manifest.json"
    render(lines, out, manifest, a.align, a.force)
    print(f"manifest: {manifest}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
