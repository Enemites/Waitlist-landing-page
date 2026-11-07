"""Illustrated artwork for the Competitive path's history section (Strategy / Teamwork).

Method: flat fills + ink lines, like a printed graphic-novel panel.
  1. Fills: L0 gradient minimisation flattens the reference into a few large,
     evenly toned regions with crisp edges; luminance is split into five tones
     and a median pass merges leftover slivers.
  2. Ink: XDoG (extended difference of Gaussians) draws clean contour lines;
     specks below a minimum area are dropped.
  3. Colour: the leader alone takes the amber palette, everyone else the dark
     bronze palette, so the scene reads as one person ahead of a group.
  4. Every tone and the ink are traced with potrace into smooth SVG paths.

References (public domain, downloaded to .cache/competitive-history on first run):
  - Strategy: André Castaigne, "Alexander addresses his officers before the battle of
    Issus" (1898-1899), Wikimedia Commons, 960 px rendition.
  - Teamwork: Trinity site, September 1945, U.S. government photograph,
    Wikimedia Commons "Trinity_Test_-_Oppenheimer_and_Groves_at_Ground_Zero_001.jpg".

Requires: pip install potracer opencv-contrib-python-headless numpy
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

TEAM = ["#16130f", "#231e17", "#33291e", "#45382a", "#57483a"]
LEAD = ["#3a2410", "#7a4f22", "#c48f48", "#efbd70", "#ffe6b3"]
INK = {"team": "#0b0a08", "lead": "#2a1708"}

CONFIGS = {
    "strategy": {
        "src": "Alexander_addresses_his_officers_before_the_battle_of_Issus_by_Andre_Castaigne_(1898-1899).jpg",
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/{path}/960px-{name}",
        "crop": (16, 290, 944, 909),
        "lam": .06,
        "percentiles": [12, 30, 55, 80],
        "xdog": {"sigma": 1.5, "k": 1.6, "p": 18, "eps": .6, "phi": 12},
        "ink_min": 140,
        "leader": [(124, 318), (150, 312), (170, 334), (168, 362), (200, 400), (240, 440), (256, 452), (262, 420), (258, 392), (262, 350), (284, 326), (330, 330), (366, 358), (370, 372), (366, 392), (374, 412), (364, 440), (358, 462), (398, 484), (420, 524), (428, 600), (434, 656), (438, 728), (434, 840), (432, 940), (256, 940), (248, 792), (204, 722), (164, 650), (146, 560), (150, 480), (182, 440), (150, 384), (126, 330)],
    },
    "teamwork": {
        "src": "Trinity_Test_-_Oppenheimer_and_Groves_at_Ground_Zero_001.jpg",
        "url": "https://upload.wikimedia.org/wikipedia/commons/{path}",
        "crop": (130, 95, 880, 595),
        "lam": .03,
        "percentiles": [20, 40, 60, 80],
        "xdog": {"sigma": 1.2, "k": 1.6, "p": 20, "eps": .55, "phi": 10},
        "leader_percentiles": [38, 60, 78, 92],
        "ink_min": 60,
        "leader": [(405, 200), (410, 185), (425, 172), (450, 170), (468, 178), (472, 192), (462, 205), (458, 215), (468, 232), (478, 250), (482, 300), (478, 330), (476, 356), (466, 362), (470, 375), (482, 380), (478, 410), (468, 460), (452, 470), (440, 440), (430, 400), (410, 385), (372, 390), (360, 450), (356, 520), (339, 524), (341, 380), (343, 310), (351, 266), (363, 236), (386, 218), (400, 207)],
    },
}
SIZE = (960, 640)


def source(cfg):
    path = CACHE / cfg["src"]
    if not path.exists():
        CACHE.mkdir(parents=True, exist_ok=True)
        digest = hashlib.md5(cfg["src"].encode()).hexdigest()
        name = urllib.parse.quote(cfg["src"])
        url = cfg["url"].format(path=f"{digest[0]}/{digest[:2]}/{name}", name=name)
        request = urllib.request.Request(url, headers={"User-Agent": "enemites-realms-artwork/1.0"})
        path.write_bytes(urllib.request.urlopen(request).read())
    return path


def xdog(gray, sigma, k, p, eps, phi):
    g = gray.astype(np.float32) / 255
    a = cv2.GaussianBlur(g, (0, 0), sigma)
    b = cv2.GaussianBlur(g, (0, 0), sigma * k)
    d = (1 + p) * a - p * b
    return np.where(d >= eps, 1.0, 1 + np.tanh(phi * (d - eps)))


def drop_specks(mask, min_area):
    n, labels, stats, _ = cv2.connectedComponentsWithStats(mask.astype(np.uint8), connectivity=8)
    keep = np.zeros(n, bool)
    keep[1:] = stats[1:, cv2.CC_STAT_AREA] >= min_area
    return keep[labels]


def build(cfg):
    img = cv2.imread(str(source(cfg)), cv2.IMREAD_COLOR)
    x0, y0, x1, y1 = cfg["crop"]
    img = cv2.resize(img[y0:y1, x0:x1], SIZE, interpolation=cv2.INTER_AREA)
    scale = SIZE[0] / (x1 - x0)

    flat = cv2.ximgproc.l0Smooth(img, None, cfg["lam"], 2.0)
    lum = cv2.cvtColor(flat, cv2.COLOR_BGR2GRAY).astype(np.float32)
    tones = np.digitize(lum, np.percentile(lum, cfg["percentiles"])).astype(np.uint8)
    for k in (5, 5):
        tones = cv2.medianBlur(tones, k)

    gray = cv2.cvtColor(cv2.bilateralFilter(img, 7, 30, 7), cv2.COLOR_BGR2GRAY)
    ink = drop_specks(xdog(gray, **cfg["xdog"]) < .5, cfg["ink_min"])
    ink = cv2.morphologyEx(ink.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((2, 2), np.uint8)).astype(bool)

    poly = ((np.array(cfg["leader"], np.float32) - [x0, y0]) * scale).round().astype(np.int32)
    leader = np.zeros(tones.shape, np.uint8)
    cv2.fillPoly(leader, [poly], 1)
    leader = leader.astype(bool)
    if "leader_percentiles" in cfg:
        # The leader gets its own tonal range, so a face in shadow still reads against a dark suit.
        own = np.digitize(lum, np.percentile(lum[leader], cfg["leader_percentiles"])).astype(np.uint8)
        own = cv2.medianBlur(own, 5)
        tones = np.where(leader, own, tones)
    return tones, ink, leader


def compact(numbers):
    return " ".join(str(n) for n in numbers).replace(" -", "-")


def trace(mask, turd=12, tolerance=.35):
    """Potrace the mask; emit relative, integer path data (deltas taken between rounded points, so nothing drifts)."""
    if not mask.any():
        return ""
    plist = potrace.Bitmap(~mask).trace(turdsize=turd, turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY, alphamax=1.0, opticurve=True, opttolerance=tolerance)
    pt = lambda p: (round(p.x), round(p.y))
    parts = []
    for curve in plist:
        cx, cy = pt(curve.start_point)
        d = [f"M{cx} {cy}"]
        for seg in curve.segments:
            if seg.is_corner:
                (ax, ay), (bx, by) = pt(seg.c), pt(seg.end_point)
                d.append("l" + compact((ax - cx, ay - cy, bx - ax, by - ay)))
            else:
                (ax, ay), (bx, by), (ex, ey) = pt(seg.c1), pt(seg.c2), pt(seg.end_point)
                d.append("c" + compact((ax - cx, ay - cy, bx - cx, by - cy, ex - cx, ey - cy)))
                bx, by = ex, ey
            cx, cy = bx, by
        parts.append("".join(d) + "z")
    return "".join(parts)


def layers(tones, ink, leader):
    """Stacked so neighbouring shapes never leave hairline seams. Ink layers are flagged for a looser fit."""
    out = []
    for region, palette, ink_colour, base in ((~leader, TEAM, INK["team"], None), (leader, LEAD, INK["lead"], leader)):
        if base is not None:
            out.append((base, palette[0], False))
        for level in range(1, len(palette)):
            out.append(((tones >= level) & region, palette[level], False))
        out.append((ink & region, ink_colour, True))
    return out
def svg(name):
    tones, ink, leader = build(CONFIGS[name])
    w, h = SIZE
    body = [f'<rect width="{w}" height="{h}" fill="{TEAM[0]}"/>']
    for mask, colour, is_ink in layers(tones, ink, leader):
        d = trace(mask, tolerance=.8 if is_ink else .35)
        if d:
            body.append(f'<path fill="{colour}" fill-rule="evenodd" d="{d}"/>')
    doc = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}">{"".join(body)}</svg>'
    out = OUT / f"competitive-history-{name}.svg"
    out.write_text(doc)
    print(out, len(doc))


def preview(name):
    tones, ink, leader = build(CONFIGS[name])
    canvas = np.zeros(tones.shape + (3,), np.uint8)
    for mask, colour, _ in layers(tones, ink, leader):
        canvas[mask] = [int(colour[i:i + 2], 16) for i in (5, 3, 1)]
    out = CACHE / f"{name}-preview.png"
    cv2.imwrite(str(out), canvas)
    print(out)


if __name__ == "__main__":
    names = [arg for arg in sys.argv[1:] if not arg.startswith("--")] or list(CONFIGS)
    for name in names:
        (preview if "--preview" in sys.argv else svg)(name)
