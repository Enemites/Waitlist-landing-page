"""Abstract artwork for the Competitive path's history section (Strategy / Teamwork).

Method: tonal reduction + vector tracing, like a screen print.
  1. Crop the reference and flatten texture with mean-shift filtering (lighter
     smoothing inside the detail ellipses, so faces stay legible).
  2. Remove what is not the subject (mosaic plaster and sky, outside polygons).
  3. Split luminance into five tone bands and map them to the Competitive amber
     palette; in the photograph the leader alone gets the amber bands.
  4. Trace each band with potrace into smooth paths and stack them into an SVG.

References (public domain, downloaded to .cache/competitive-history on first run):
  - Strategy: the Alexander Mosaic, House of the Faun, Pompeii (c. 100 BC),
    Wikimedia Commons "Alexander_the_Great_mosaic.jpg" (1280 px rendition).
  - Teamwork: Trinity site, September 1945, U.S. government photograph,
    Wikimedia Commons "Trinity_Test_-_Oppenheimer_and_Groves_at_Ground_Zero_001.jpg".

Requires: pip install potracer opencv-python-headless numpy
Usage:    python3 scripts/abstract-competitive-history.py [strategy|teamwork] [--preview]
"""
import hashlib
import sys
import urllib.parse
import urllib.request
from pathlib import Path

import cv2
import numpy as np
import potrace

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / ".cache" / "competitive-history"
OUT = ROOT / "public" / "assets" / "realms"


def source(cfg):
    path = CACHE / cfg["src"]
    if not path.exists():
        CACHE.mkdir(parents=True, exist_ok=True)
        digest = hashlib.md5(cfg["src"].encode()).hexdigest()
        url = cfg["url"].format(f"{digest[0]}/{digest[:2]}/{urllib.parse.quote(cfg['src'])}")
        request = urllib.request.Request(url, headers={"User-Agent": "enemites-realms-artwork/1.0"})
        path.write_bytes(urllib.request.urlopen(request).read())
    return path


def hexrgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.uint8)


def smooth(img, passes, sp, sr, median):
    out = img
    for _ in range(passes):
        out = cv2.pyrMeanShiftFiltering(out, sp, sr)
    if median:
        out = cv2.medianBlur(out, median)
    return out


def clean(mask, k):
    if k <= 0:
        return mask
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))
    m = cv2.morphologyEx(mask.astype(np.uint8), cv2.MORPH_OPEN, kernel)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, kernel)
    return m.astype(bool)


def trace(mask, turd, alpha):
    if not mask.any():
        return ""
    bm = potrace.Bitmap(~mask)  # potracer fills False pixels
    plist = bm.trace(turdsize=turd, turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY, alphamax=alpha, opticurve=True, opttolerance=0.4)
    f = lambda p: f"{round(p.x)} {round(p.y)}"
    parts = []
    for curve in plist:
        d = [f"M{f(curve.start_point)}"]
        for seg in curve.segments:
            if seg.is_corner:
                d.append(f"L{f(seg.c)}L{f(seg.end_point)}")
            else:
                d.append(f"C{f(seg.c1)} {f(seg.c2)} {f(seg.end_point)}")
        d.append("Z")
        parts.append("".join(d))
    return "".join(parts)


def build(cfg):
    img = cv2.imread(str(source(cfg)))
    x0, y0, x1, y1 = cfg["crop"]
    img = img[y0:y1, x0:x1]
    scale = cfg["width"] / img.shape[1]
    img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
    h, w = img.shape[:2]
    sm = smooth(img, **cfg["smooth"])
    if "detail" in cfg:
        # Keep the face sharp; flatten everything else into larger shapes.
        heavy = smooth(img, **cfg["heavy"])
        dm = np.zeros((h, w), np.float32)
        for (cx, cy), (rx, ry) in cfg["detail"]:
            cv2.ellipse(dm, (int((cx - x0) * scale), int((cy - y0) * scale)), (int(rx * scale), int(ry * scale)), 0, 0, 360, 1, -1)
        dm = cv2.GaussianBlur(dm, (0, 0), 18)[..., None]
        sm = (sm * dm + heavy * (1 - dm)).astype(np.uint8)
    lum = cv2.cvtColor(sm, cv2.COLOR_BGR2GRAY)
    if "clahe" in cfg:
        clip, tiles = cfg["clahe"]
        lum = cv2.createCLAHE(clipLimit=clip, tileGridSize=(tiles, tiles)).apply(lum)
    lum = lum.astype(np.float32)
    lum = cv2.GaussianBlur(lum, (0, 0), cfg.get("blur", 1.2))
    def polymask(points):
        poly = (np.array(points, np.float32) - [x0, y0]) * scale
        pm = np.zeros((h, w), np.uint8)
        cv2.fillPoly(pm, [poly.round().astype(np.int32)], 1)
        return pm.astype(bool)

    background = np.zeros((h, w), bool)
    if "background" in cfg:
        background = cfg["background"](img, sm, scale)
    if "figure" in cfg:
        fm = polymask(cfg["figure"]).astype(np.float32)
        if "rough" in cfg:
            # Break the polygon edge like a lifted fragment of mosaic.
            sigma, amp, cell, seed = cfg["rough"]
            rng = np.random.default_rng(seed)
            noise = np.clip(cv2.resize(rng.random((h // cell + 2, w // cell + 2)).astype(np.float32), (w, h), interpolation=cv2.INTER_CUBIC), 0, 1)
            fm = (cv2.GaussianBlur(fm, (0, 0), sigma) + (noise - .5) * amp) > .5
        background |= ~fm.astype(bool)
    if "sky_zones" in cfg:
        # Pale, unsaturated tesserae inside the given zones are sky, not figure.
        hsv = cv2.cvtColor(smooth(img, 2, 10, 30, 9), cv2.COLOR_BGR2HSV)
        pale = (hsv[..., 1] < cfg.get("sky_sat", 70)) & (hsv[..., 2] > cfg.get("sky_val", 140))
        zones = np.zeros((h, w), bool)
        for zone in cfg["sky_zones"]:
            zones |= polymask(zone)
        sky = (pale & zones).astype(np.uint8)
        sky = cv2.morphologyEx(sky, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11)))
        sky = cv2.morphologyEx(sky, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
        background |= sky.astype(bool)
    if cfg.get("single_fragment"):
        n, labels, stats, _ = cv2.connectedComponentsWithStats((~background).astype(np.uint8))
        if n > 1:
            biggest = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
            background = labels != biggest
    leader = np.zeros((h, w), bool)
    if "leader" in cfg:
        leader = polymask(cfg["leader"])
        if "leader_bright_cut" in cfg:
            cut, keep_above = cfg["leader_bright_cut"]
            rows = np.arange(h)[:, None] < (keep_above - y0) * scale
            leader &= (lum < cut) | rows
    if "percentiles" in cfg:
        cfg["thresholds"] = list(np.percentile(lum[~background], cfg["percentiles"]))
    if "falloff" in cfg:
        # Light falls off away from the subject, so the eye lands where the story is.
        (fy0, fy1, fyk), (fx0, fx1, fxk) = cfg["falloff"]
        ys = (np.arange(h)[:, None] / scale) + y0
        xs = (np.arange(w)[None, :] / scale) + x0
        sstep = lambda a, b, v: np.clip((v - a) / (b - a), 0, 1) ** 2 * (3 - 2 * np.clip((v - a) / (b - a), 0, 1))
        lum = lum * (1 - fyk * sstep(fy0, fy1, ys)) * (1 - fxk * sstep(fx0, fx1, xs))


    layers = []  # (mask, colour)
    groups = [(~leader & ~background, cfg["palette"])]
    if leader.any():
        groups.append((leader & ~background, cfg["leader_palette"]))
    for gi, (region, palette) in enumerate(groups):
        thresholds = cfg["thresholds"]
        if gi == 1 and "leader_percentiles" in cfg:
            thresholds = list(np.percentile(lum[region], cfg["leader_percentiles"]))
        for t, colour in zip(thresholds, palette[1:]):
            m = clean((lum >= t) & region, cfg.get("clean", 3))
            layers.append((m, colour))
        base = clean(region, cfg.get("clean", 3))
        layers.insert(len(layers) - len(thresholds), (base, palette[0]))
    return w, h, lum, background, leader, layers


def preview(cfg, out):
    w, h, lum, bg, leader, layers = build(cfg)
    canvas = np.zeros((h, w, 3), np.uint8)
    canvas[:] = hexrgb(cfg["bg"])[::-1]
    for m, colour in layers:
        canvas[m] = hexrgb(colour)[::-1]
    cv2.imwrite(out, canvas)


def svg(cfg, out):
    w, h, lum, bg, leader, layers = build(cfg)
    body = [f'<rect width="{w}" height="{h}" fill="{cfg["bg"]}"/>']
    if "overlay" in cfg:
        body.append(cfg["overlay"](w, h))
    for m, colour in layers:
        d = trace(m, cfg.get("turd", 30), cfg.get("alpha", 1.1))
        if d:
            body.append(f'<path fill="{colour}" fill-rule="evenodd" d="{d}"/>')
    doc = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}">{"".join(body)}</svg>'
    open(out, "w").write(doc)
    print(out, w, h, len(doc))


def mosaic_background(img, sm, scale):
    """The plaster where tesserae are missing: smooth, olive-beige, low local variance."""
    hsv = cv2.cvtColor(sm, cv2.COLOR_BGR2HSV).astype(np.float32)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
    mean = cv2.blur(gray, (9, 9))
    var = cv2.blur(gray * gray, (9, 9)) - mean * mean
    hue, sat, val = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    plaster = (hue > 16) & (hue < 32) & (sat > 55) & (val > 120) & (var < 260)
    plaster = cv2.morphologyEx(plaster.astype(np.uint8), cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    plaster = cv2.morphologyEx(plaster, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))
    n, labels, stats, _ = cv2.connectedComponentsWithStats(plaster)
    keep = np.zeros_like(plaster)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] > 2500:
            keep[labels == i] = 1
    return keep.astype(bool)


def sarissas(w, h):
    """A forest of raised pikes behind the rider: the army the leader is ahead of."""
    rng = np.random.default_rng(11)
    shafts, tips = [], []
    for i, xb in enumerate(range(-240, 980, 62)):
        xb += int(rng.integers(-16, 16))
        top = int(rng.integers(18, 120))
        angle = np.radians(66 + rng.uniform(-3, 3))
        ux, uy = np.cos(angle), -np.sin(angle)
        length = (h + 30 - top) / np.sin(angle)
        x_top, y_top = xb + ux * length, h + 30 - length * np.sin(angle)
        colour = "#7a5c36" if i % 4 == 0 else "#4e3d29"
        shafts.append(f'<path d="M{xb} {h + 30}L{x_top:.0f} {y_top:.0f}" stroke="{colour}" stroke-width="{2.4 if i % 4 else 2.8}"/>')
        # Leaf-shaped head, as on a sarissa.
        nx, ny = -uy, ux
        a = (x_top, y_top)
        b = (x_top + ux * 30, y_top + uy * 30)
        m = (x_top + ux * 12, y_top + uy * 12)
        tips.append(f'<path d="M{a[0]:.0f} {a[1]:.0f}Q{m[0] + nx * 7:.0f} {m[1] + ny * 7:.0f} {b[0]:.0f} {b[1]:.0f}Q{m[0] - nx * 7:.0f} {m[1] - ny * 7:.0f} {a[0]:.0f} {a[1]:.0f}Z" fill="{colour}"/>')
    return f'<g stroke-linecap="round" opacity=".9">{"".join(shafts)}{"".join(tips)}</g>'


CONFIGS = {
    "strategy": {
        "src": "Alexander_the_Great_mosaic.jpg",
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/{}/1280px-Alexander_the_Great_mosaic.jpg",
        "crop": (230, 0, 1200, 647),
        "width": 960,
        "smooth": {"passes": 1, "sp": 7, "sr": 22, "median": 5},
        "heavy": {"passes": 2, "sp": 10, "sr": 30, "median": 9},
        "detail": [((470, 170), (95, 120)), ((960, 270), (150, 90))],
        "blur": 1.3,
        "background": mosaic_background,
        "figure": [(230, 330), (300, 262), (340, 150), (362, 60), (420, 26), (470, 18), (530, 28), (560, 90), (540, 205), (530, 230), (520, 270), (546, 278), (620, 270), (672, 262), (680, 140), (720, 100), (800, 80), (850, 84), (885, 92), (910, 122), (960, 165), (1040, 205), (1110, 250), (1170, 285), (1200, 300), (1190, 352), (1146, 362), (1051, 362), (967, 366), (904, 402), (883, 484), (904, 590), (925, 700), (230, 700)],
        "sky_zones": [[(520, 0), (700, 0), (700, 110), (690, 280), (520, 290)], [(700, 0), (1200, 0), (1200, 60), (900, 80), (860, 100), (790, 114), (700, 130)], [(230, 0), (520, 0), (430, 30), (340, 140), (300, 250), (230, 300)]],
        "falloff": ((360, 647, .42), (470, 230, .25)),
        "single_fragment": True,
        "rough": (7, .9, 26, 3),
        "overlay": sarissas,
        "clahe": (1.4, 6),
        "bg": "#13110e",
        "palette": ["#3b2817", "#7a5228", "#b47a3c", "#efbd70", "#f7e2bb"],
        "percentiles": [22, 45, 68, 88],
        "clean": 3,
        "turd": 25,
    },
    "teamwork": {
        "src": "Trinity_Test_-_Oppenheimer_and_Groves_at_Ground_Zero_001.jpg",
        "url": "https://upload.wikimedia.org/wikipedia/commons/{}",
        "crop": (130, 95, 880, 595),
        "width": 960,
        "smooth": {"passes": 1, "sp": 7, "sr": 22, "median": 5},
        "blur": 1.4,
        "bg": "#13110e",
        "palette": ["#0a0908", "#1c1813", "#2c251c", "#3a3024", "#1c1914"],  # brightest band (sky, open ground) falls back to dark
        "leader_bright_cut": (185, 212),
        "leader_palette": ["#1f150b", "#5e3d1c", "#b07a38", "#efbd70", "#fff0d2"],
        "leader_percentiles": [45, 66, 82, 93],
        "thresholds": [60, 105, 150, 200],
        "leader": [(405, 200), (410, 185), (425, 172), (450, 170), (468, 178), (472, 192), (462, 205), (458, 215), (468, 232), (478, 250), (482, 300), (478, 330), (476, 356), (466, 362), (470, 375), (482, 380), (478, 410), (468, 460), (452, 470), (440, 440), (430, 400), (410, 385), (372, 390), (360, 450), (356, 520), (339, 524), (341, 380), (343, 310), (351, 266), (363, 236), (386, 218), (400, 207)],
        "clean": 3,
        "turd": 70,
    },
}

if __name__ == "__main__":
    names = [arg for arg in sys.argv[1:] if not arg.startswith("--")] or list(CONFIGS)
    for name in names:
        if "--preview" in sys.argv:
            preview(CONFIGS[name], str(CACHE / f"{name}-preview.png"))
        else:
            svg(CONFIGS[name], str(OUT / f"competitive-history-{name}.svg"))
