#!/usr/bin/env python3
"""Render the test line in candidate voices/speeds and rank them by objective measures.

  python3 audio/voice_test.py [--voices am_michael,bm_george,...] [--speeds 0.9,1.0] [--script-top 4]

Writes .work/audio/voice-tests/<voice>_<speed>.wav, report.json and report.md.
Per clip: faster-whisper (small.en) WER vs the script on the clean clip AND mixed into a trailer
music masker (synth bass ostinato + pad + drums + taiko) at 0 dB and -6 dB speech-to-music RMS
(the VO will sit over a score, so robustness in music is what separates voices), mean word
probability (ASR confidence), duration, words per minute, F0 median and 5-95% range in
semitones (intonation), clipping, true peak, Kokoro's published grade (VOICES.md).
Composite score (higher = better):
  25*(1-WER_clean) + 20*(1-WER_0dB) + 20*(1-WER_-6dB) + 10*conf + grade(0-10) + pace(0-10, 135-160 wpm) + pitch(0-5, 4-10 st)
--script-voices renders the whole 60-word draft VO script with the listed voice:speed pairs and reports
WER/CER clean and in music at -6 and -10 dB (CER ignores spacing, e.g. 'wait list' vs 'waitlist').
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

HERE = Path(__file__).resolve().parent
sys.dont_write_bytecode = True
sys.path.insert(0, str(HERE))
import measure  # noqa: E402
import tts  # noqa: E402

TEXT = ("Every great plan needed a team. One world. Opposing plans. "
        "Bring your team, and see whose strategy holds.")
SCRIPT = ("Every great plan needed a team. Many minds. One problem. One world. Opposing plans. "
          "Bring your friends. Or join a team. Face another team. Same challenge. Another approach. "
          "Divide the roles. Make the call together. Every move they make changes what happens next. "
          "Every move, on the record. Bring your team. See whose strategy holds. "
          "Realms Competitive. Join the waitlist.")
VOICES = ["am_michael", "am_fenrir", "am_onyx", "am_puck", "bm_george", "bm_fable", "af_heart", "bf_emma",
          "am_michael:0.6+am_fenrir:0.4"]
SPEEDS = [0.9, 1.0]
# hexgrad/Kokoro-82M VOICES.md overall grades
GRADES = {"af_heart": "A", "af_bella": "A-", "af_nicole": "B-", "bf_emma": "B-", "am_fenrir": "C+",
          "am_michael": "C+", "am_puck": "C+", "bm_fable": "C", "bm_george": "C", "am_onyx": "D",
          "bm_lewis": "D+", "bm_daniel": "D", "am_echo": "D", "am_eric": "D", "am_liam": "D",
          "am_adam": "F+"}
GRADE_PTS = {"A": 10, "A-": 9, "B+": 8, "B": 7, "B-": 6, "C+": 5, "C": 4, "C-": 3, "D+": 2, "D": 1, "D-": 0.5, "F+": 0}
OUT = tts.WORK / "audio" / "voice-tests"
SNRS = (0.0, -6.0)


def grade_of(v: str) -> str:
    if "+" in v:
        names = [p.split(":")[0] for p in v.split("+")]
        pts = [GRADE_PTS.get(GRADES.get(n, "D"), 1) for n in names]
        inv = {p: g for g, p in GRADE_PTS.items()}
        return inv.get(min(pts), "D") + " (blend)"
    return GRADES.get(v, "?")


def slug(v: str, s: float) -> str:
    return f"{v.replace(':', '').replace('+', '_').replace('.', '')}_{s:.2f}".replace(".", "")


def masker(seconds: float) -> np.ndarray:
    """Trailer-like music bed (mono, 48 kHz) used to stress intelligibility."""
    path = OUT / "masker.wav"
    if path.exists():
        m, _ = sf.read(str(path), dtype="float64")
        if len(m) >= seconds * 48000:
            return m
    import synth
    bars = int(seconds / 2) + 2
    ch = ("Dm", "Bb", "Gm", "A")
    y = (synth.render("bass_ostinato", bars=bars, chords=ch, intensity=0.9)[: bars * 96000]
         + synth.render("pad", bars=bars, chords=ch, intensity=0.8)[: bars * 96000]
         + synth.render("drums", bars=bars, intensity=0.8, clap="....X.......X...")[: bars * 96000]
         + synth.render("taiko", bars=bars, intensity=0.8)[: bars * 96000])
    m = y.mean(axis=1)
    sf.write(str(path), m.astype(np.float32), 48000, subtype="FLOAT")
    return m


def speech_rms(x: np.ndarray, sr: int) -> float:
    hop = int(0.02 * sr)
    k = len(x) // hop
    r = np.sqrt(np.mean(x[: k * hop].reshape(k, hop) ** 2, axis=1))
    act = r[r > r.max() * 0.1]
    return float(np.sqrt(np.mean(act ** 2)))


def in_music(path: str, snr_db: float, text: str) -> dict:
    x, sr = sf.read(path, dtype="float64")
    m = masker(len(x) / sr + 1)[: len(x)]
    g = speech_rms(x, sr) / (np.sqrt(np.mean(m ** 2)) + 1e-12) * 10 ** (-snr_db / 20)
    mix = x + m * g
    mix /= np.max(np.abs(mix)) / 0.9
    tmp = OUT / "_mix.wav"
    sf.write(str(tmp), mix.astype(np.float32), sr)
    r = tts.align(tmp, text)
    return {"wer": r["wer"], "transcript": r["transcript"]}


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--voices", default=",".join(VOICES))
    ap.add_argument("--speeds", default=",".join(map(str, SPEEDS)))
    ap.add_argument("--text", default=TEXT)
    ap.add_argument("--script-voices", default="af_heart:0.9,bf_emma:0.9,am_michael:0.9,am_michael:1.0,"
                    "bm_george:1.0,am_fenrir:1.0,am_puck:0.9")
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args(argv)
    voices = a.voices.split(",")
    speeds = [float(s) for s in a.speeds.split(",")]
    lines = [{"id": slug(v, s), "text": a.text, "voice": v, "speed": s} for v in voices for s in speeds]
    man = tts.render(lines, OUT, OUT / "manifest.json", do_align=True, force=a.force)
    rows = []
    for ln in lines:
        e = man[ln["id"]]
        x, sr = measure.read(e["file"])
        f0 = measure.f0_stats(x, sr)
        conf = sum(w["p"] for w in e["words"]) / max(1, len(e["words"]))
        noisy = {snr: in_music(e["file"], snr, a.text) for snr in SNRS}
        g = grade_of(ln["voice"])
        gp = GRADE_PTS.get(g.split()[0], 1)
        wpm = e["wpm"]
        pace = 10 - min(10, max(0, 135 - wpm, wpm - 160) * 0.5)
        stv = f0["f0_range_st"] or 0
        pitch = 5 - min(5, max(0, 4 - stv, stv - 10) * 1.5)
        clip = measure.clipping_runs(x)
        score = (25 * (1 - min(1, e["wer"])) + 20 * (1 - min(1, noisy[0.0]["wer"]))
                 + 20 * (1 - min(1, noisy[-6.0]["wer"])) + 10 * conf + gp + pace + pitch - 10 * (clip > 0))
        rows.append({"id": ln["id"], "voice": ln["voice"], "speed": ln["speed"], "grade": g,
                     "wer": e["wer"], "wer_music_0db": noisy[0.0]["wer"], "wer_music_-6db": noisy[-6.0]["wer"],
                     "asr_conf": round(conf, 3), "duration": e["duration"], "wpm": wpm, **f0,
                     "clip_runs": clip, "true_peak_dbtp": e["true_peak_dbtp"], "lufs_i": e["lufs_i"],
                     "transcript": e["transcript"], "transcript_-6db": noisy[-6.0]["transcript"],
                     "score": round(score, 2), "file": e["file"]})
        print(f"  {ln['id']:32s} WER {e['wer']:.3f} / 0dB {noisy[0.0]['wer']:.3f} / -6dB {noisy[-6.0]['wer']:.3f}")
    rows.sort(key=lambda r: -r["score"])
    script_rows = []
    if a.script_voices:
        picks = [(p.rsplit(":", 1)[0], float(p.rsplit(":", 1)[1])) for p in a.script_voices.split(",")]
        sl = [{"id": "script_" + slug(v, sp), "text": SCRIPT, "voice": v, "speed": sp} for v, sp in picks]
        sman = tts.render(sl, OUT, OUT / "manifest.json", do_align=True, force=a.force)
        for s_ in sl:
            e = sman[s_["id"]]
            n6, n10 = in_music(e["file"], -6.0, SCRIPT), in_music(e["file"], -10.0, SCRIPT)
            script_rows.append({"id": s_["id"], "voice": s_["voice"], "speed": s_["speed"], "wer": e["wer"],
                                "cer": measure.cer(SCRIPT, e["transcript"]),
                                "cer_music_-6db": measure.cer(SCRIPT, n6["transcript"]),
                                "cer_music_-10db": measure.cer(SCRIPT, n10["transcript"]),
                                "duration": e["duration"], "wpm": e["wpm"],
                                "transcript": e["transcript"], "transcript_-10db": n10["transcript"]})
            print(f"  {s_['id']:32s} CER {script_rows[-1]['cer']:.3f} / -6dB {script_rows[-1]['cer_music_-6db']:.3f} / -10dB {script_rows[-1]['cer_music_-10db']:.3f}")
    (OUT / "report.json").write_text(json.dumps({"test_line": rows, "full_script": script_rows}, indent=2))
    md = ["# Voice test report", "", f"Test line: \"{a.text}\"", "",
          "| # | voice | speed | Kokoro grade | WER clean | WER music 0 dB | WER music -6 dB | ASR conf | dur s | wpm | F0 med Hz | F0 range st | clip | score |",
          "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|"]
    for i, r in enumerate(rows, 1):
        md.append(f"| {i} | {r['voice']} | {r['speed']} | {r['grade']} | {r['wer']:.3f} | {r['wer_music_0db']:.3f} | "
                  f"{r['wer_music_-6db']:.3f} | {r['asr_conf']:.3f} | {r['duration']:.2f} | {r['wpm']} | "
                  f"{r['f0_median_hz']} | {r['f0_range_st']} | {r['clip_runs']} | {r['score']} |")
    if script_rows:
        md += ["", f"Full draft script ({len(measure.normalize_words(SCRIPT))} words):", "",
               "| voice | speed | WER clean | CER clean | CER music -6 dB | CER music -10 dB | dur s | wpm |",
               "|---|---|---|---|---|---|---|---|"]
        for r in sorted(script_rows, key=lambda r: r["cer_music_-10db"]):
            md.append(f"| {r['voice']} | {r['speed']} | {r['wer']:.3f} | {r['cer']:.3f} | {r['cer_music_-6db']:.3f} | "
                      f"{r['cer_music_-10db']:.3f} | {r['duration']:.2f} | {r['wpm']} |")
    md += ["", "Transcripts (clean / music -6 dB):", ""]
    md += [f"- {r['id']}: {r['transcript']} / {r['transcript_-6db']}" for r in rows]
    md += [f"- {r['id']}: {r['transcript']} / -10 dB: {r['transcript_-10db']}" for r in script_rows]
    (OUT / "report.md").write_text("\n".join(md) + "\n")
    print("\n".join(md))


if __name__ == "__main__":
    sys.exit(main())
