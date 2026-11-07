// Draws the two symbol scenes for the Competitive history section.
// Unlike the illustrated scenes (scripts/abstract-competitive-history.py), these are not
// derived from pixels: every shape is drawn here, with the reference only guiding the pose.
// Flat fills, no outlines, no faces, no frame: the leader in amber, everyone else in bronze.
// Deterministic: the same seed always produces the same files.
// Usage: node scripts/generate-competitive-symbols.mjs
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = (name) => resolve(root, "public/assets/realms", name);

const C = {
  far: "#4a3d2f", crowd: "#5a4a38", crowdLit: "#6e5a44", body: "#3a3024", near: "#2a231b", nearest: "#211c16",
  amberDeep: "#8a5a26", amberDark: "#a8742f", amber: "#c48f48", amberMid: "#d9a75c", amberLight: "#efbd70", cream: "#fff0d2",
  line: "#6b5130",
};

function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (n) => Math.round(n * 10) / 10;
const pt = ([x, y]) => `${r1(x)} ${r1(y)}`;

/** Closed Catmull-Rom spline through the points, as cubic Béziers. */
function smooth(points, tension = 1) {
  const n = points.length;
  let d = `M${pt(points[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n], p1 = points[i], p2 = points[(i + 1) % n], p3 = points[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6 * tension, p1[1] + (p2[1] - p0[1]) / 6 * tension];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6 * tension, p2[1] - (p3[1] - p1[1]) / 6 * tension];
    d += `C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return d + "Z";
}
const poly = (points) => `M${points.map(pt).join("L")}Z`;
const path = (d, fill, extra = "") => `<path d="${d}" fill="${fill}"${extra}/>`;
const ellipse = (cx, cy, rx, ry, fill, rot = 0) => `<ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="${r1(rx)}" ry="${r1(ry)}" fill="${fill}"${rot ? ` transform="rotate(${rot} ${r1(cx)} ${r1(cy)})"` : ""}/>`;
const line = (x1, y1, x2, y2, stroke, width, extra = "") => `<path d="M${r1(x1)} ${r1(y1)}L${r1(x2)} ${r1(y2)}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round"${extra}/>`;

/** An open stroke with a width that changes along its length, as one filled shape. */
function taper(points, w0, w1, samples = 40) {
  const n = points.length;
  const at = (t) => {
    const seg = Math.min(n - 2, Math.floor(t * (n - 1)));
    const u = t * (n - 1) - seg;
    const p0 = points[Math.max(0, seg - 1)], p1 = points[seg], p2 = points[seg + 1], p3 = points[Math.min(n - 1, seg + 2)];
    const f = (a, b, c, d2) => 0.5 * ((2 * b) + (-a + c) * u + (2 * a - 5 * b + 4 * c - d2) * u * u + (-a + 3 * b - 3 * c + d2) * u * u * u);
    return [f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])];
  };
  const left = [], right = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples, a = at(Math.max(0, t - .01)), b = at(Math.min(1, t + .01));
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const w = (w0 + (w1 - w0) * t) / 2, c = at(t);
    left.push([c[0] - dy / len * w, c[1] + dx / len * w]);
    right.push([c[0] + dy / len * w, c[1] - dx / len * w]);
  }
  return poly([...left, ...right.reverse()]);
}

function svg(viewBox, defs, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${defs ? `<defs>${defs}</defs>` : ""}${body}</svg>\n`;
}

/** A ground line that fades out at both ends instead of stopping at an edge. */
function groundLine(id, x1, x2, y, colour, width, opacity = 1) {
  return {
    defs: `<linearGradient id="${id}" x1="${x1}" x2="${x2}" y1="0" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${colour}" stop-opacity="0"/><stop offset=".22" stop-color="${colour}" stop-opacity="${opacity}"/><stop offset=".78" stop-color="${colour}" stop-opacity="${opacity}"/><stop offset="1" stop-color="${colour}" stop-opacity="0"/></linearGradient>`,
    body: `<path d="M${x1} ${y}H${x2}" stroke="url(#${id})" stroke-width="${width}"/>`,
  };
}

// ---------- Leadership: the commander pours the only water onto the sand, in front of his army ----------

function walker(x, base, s, fill, rand, opts = {}) {
  const h = (17 + rand() * 4) * s, head = 3.1 * s, lean = (rand() - .5) * 2 * s;
  const top = base - h;
  let g = "";
  if (opts.spear) g += line(x + 3 * s, base - 2 * s, x + 4.5 * s + lean, top - 13 * s, fill, Math.max(.8, .9 * s));
  g += path(smooth([[x - 2.6 * s, top + 6 * s], [x + 2.6 * s + lean * .3, top + 6 * s], [x + 3.2 * s, base - 7 * s], [x + 2 * s, base], [x - 2 * s, base], [x - 3.4 * s, base - 7 * s]], .6), fill);
  g += ellipse(x + lean * .4, top + 2.4 * s, head, head * 1.1, fill);
  return g;
}

function packAnimal(x, base, s, fill) {
  const body = smooth([[x - 9 * s, base - 11 * s], [x + 7 * s, base - 12 * s], [x + 11 * s, base - 8 * s], [x + 6 * s, base - 5 * s], [x - 8 * s, base - 5 * s], [x - 11 * s, base - 8 * s]], .8);
  const neck = poly([[x + 7 * s, base - 11 * s], [x + 12 * s, base - 19 * s], [x + 15 * s, base - 18 * s], [x + 11 * s, base - 9 * s]]);
  let legs = "";
  for (const lx of [-8, -4, 4, 8]) legs += line(x + lx * s, base - 6 * s, x + lx * s, base, fill, 1.2 * s);
  const pack = smooth([[x - 7 * s, base - 11 * s], [x + 4 * s, base - 12 * s], [x + 3 * s, base - 17 * s], [x - 6 * s, base - 16 * s]], .7);
  return path(body, fill) + path(neck, fill) + legs + path(pack, fill);
}

function leadership() {
  const rand = mulberry32(331);
  let body = "";
  const defs = [];

  // Horizon, with the army's column winding back to it.
  const horizon = groundLine("horizon", 0, 600, 200, C.line, 1, .55);
  defs.push(horizon.defs); body += horizon.body;
  const ground = groundLine("ground", 40, 600, 444, C.line, 1.2, .9);
  defs.push(ground.defs);

  // Far column, winding back toward the horizon.
  for (let x = 132; x < 330; x += 7 + rand() * 3) {
    const base = 150 + (x - 132) * .04 + rand() * 1.5;
    if (rand() < .18) { body += packAnimal(x, base, .55, C.far); x += 7; continue; }
    body += walker(x, base, .58, C.far, rand, { spear: rand() < .35 });
  }
  // Near column along the horizon: a long line of people, pack animals and raised spears.
  for (let x = 118; x < 396; x += 10 + rand() * 5) {
    const base = 203 + rand() * 2;
    if (rand() < .16) { body += packAnimal(x, base, 1.25, C.crowd); x += 16; continue; }
    body += walker(x, base, 1.2 + rand() * .2, rand() < .55 ? C.crowd : C.crowdLit, rand, { spear: rand() < .45 });
  }
  // The scouts on the left: one standing with spear and round shield, one kneeling on his pack.
  body += line(70, 216, 80, 96, C.crowdLit, 2.4);
  body += path(smooth([[44, 140], [58, 132], [70, 140], [74, 176], [70, 214], [60, 216], [52, 214], [42, 178]], .7), C.crowd);
  body += ellipse(58, 120, 9, 10, C.crowd);
  body += ellipse(44, 170, 14, 17, C.crowdLit, -10);
  body += path(smooth([[64, 248], [66, 226], [78, 210], [94, 212], [104, 228], [106, 248]], .8), C.crowd);
  body += ellipse(88, 202, 8.5, 9.5, C.crowd);
  body += path(smooth([[44, 250], [56, 240], [100, 243], [108, 252], [62, 254]], .7), C.far);

  // Water: the only share there was, poured out onto the sand.
  const stream = [[236, 106], [237, 150], [234, 200], [229, 260], [223, 330], [217, 400], [214, 441]];
  body += path(taper(stream, 7, 2.6), C.cream, ` opacity=".92"`);
  body += ellipse(214, 442, 20, 3.4, C.cream, 0).replace("/>", ` opacity=".55"/>`);
  for (const [dx, dy, r] of [[-17, -9, 2.2], [-9, -15, 1.7], [10, -13, 1.9], [19, -7, 1.5], [3, -21, 1.3]]) body += ellipse(214 + dx, 442 + dy, r, r, C.cream);

  // The soldiers beside him, looking on.
  const spearTip = (x1, y1, x2, y2, fill) => {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
    const m = [x2 - ux * 13, y2 - uy * 13];
    return line(x1, y1, x2 - ux * 18, y2 - uy * 18, fill, 2.4) + path(`M${pt([x2 - ux * 24, y2 - uy * 24])}Q${pt([m[0] - uy * 6, m[1] + ux * 6])} ${pt([x2, y2])}Q${pt([m[0] + uy * 6, m[1] - ux * 6])} ${pt([x2 - ux * 24, y2 - uy * 24])}Z`, fill);
  };
  body += spearTip(546, 330, 577, 44, C.body);
  body += spearTip(560, 330, 592, 50, C.body);
  body += path(smooth([[486, 120], [506, 114], [526, 124], [546, 126], [562, 116], [584, 118], [600, 132], [608, 170], [608, 330], [592, 336], [580, 444], [554, 444], [550, 360], [534, 356], [530, 444], [506, 444], [502, 356], [492, 300], [486, 240], [482, 180], [480, 140]], .55), C.body);
  body += ellipse(566, 108, 13, 15, C.body);
  body += path(smooth([[553, 102], [560, 86], [572, 84], [580, 98]], .8), C.near);
  body += ellipse(503, 108, 15, 17, C.near);
  body += ellipse(510, 92, 36, 9, C.near, -6);
  body += path(smooth([[490, 112], [497, 128], [508, 136], [514, 120]], .8), C.near);
  body += spearTip(512, 444, 527, 44, C.near);

  // The commander. Robe first, then arm, head and the helmet he empties.
  // Skirt of the robe, blown back by the desert wind.
  body += path(smooth([[380, 226], [360, 250], [336, 276], [312, 304], [294, 330], [298, 344], [320, 356], [344, 370], [366, 392], [392, 402], [440, 404], [478, 400], [482, 350], [480, 290], [476, 230]], .6), C.amberLight);
  // Its folds, and the windward panel in shade.
  body += path(smooth([[390, 238], [398, 240], [384, 320], [372, 392], [362, 386], [372, 316]], .5), C.amberMid);
  body += path(smooth([[420, 240], [428, 240], [424, 330], [420, 402], [410, 402], [414, 322]], .5), C.amberMid);
  body += path(smooth([[300, 334], [320, 318], [346, 332], [366, 362], [380, 396], [366, 392], [344, 370], [320, 356]], .6), C.amberMid);
  body += path(smooth([[450, 238], [478, 238], [482, 330], [478, 400], [452, 402], [458, 320]], .5), C.amberMid);
  // Torso under the cloak, and the belt.
  body += path(smooth([[400, 122], [384, 132], [372, 150], [370, 176], [374, 206], [378, 232], [474, 234], [477, 190], [474, 150], [470, 126], [456, 112], [436, 114], [422, 112]], .6), C.amberLight);
  body += path(poly([[377, 224], [475, 226], [475, 238], [378, 236]]), C.amberDark);
  body += path(smooth([[448, 120], [466, 122], [474, 160], [476, 200], [474, 224], [452, 224], [456, 180], [452, 140]], .6), C.amberMid);
  // The cloth from his head, hanging down his back.
  body += path(smooth([[440, 56], [456, 56], [470, 72], [478, 100], [484, 140], [486, 190], [482, 222], [474, 222], [472, 170], [466, 120], [460, 92], [452, 70]], .7), C.cream);
  // Sleeve and legs.
  body += path(smooth([[400, 122], [384, 132], [372, 150], [378, 166], [394, 156], [404, 138]], .8), C.amberDark);
  body += path(poly([[376, 402], [390, 402], [388, 444], [373, 444]]), C.amber);
  body += path(poly([[446, 402], [461, 402], [459, 444], [447, 444]]), C.amber);
  // Arm, outstretched to the helmet.
  body += path(smooth([[280, 80], [305, 84], [330, 93], [355, 103], [376, 112], [402, 121], [398, 138], [372, 129], [350, 119], [330, 108], [305, 100], [281, 97]], .5), C.amber);
  // Head, tipped back to the sky: brow, nose, lips, chin.
  body += path(smooth([[414, 62], [410, 72], [404, 80], [401, 84], [407, 87], [405, 93], [410, 97], [409, 103], [414, 108], [424, 112], [438, 116], [452, 116], [466, 110], [470, 96], [468, 78], [462, 64], [450, 55], [434, 52], [422, 55]], .7), C.amber);
  body += path(smooth([[414, 62], [422, 54], [436, 50], [452, 54], [442, 60], [428, 61], [418, 68]], .8), C.amberDark);
  // Helmet tipped over: crest, bowl, the open rim the water leaves from, and his hand on it.
  body += path(smooth([[216, 48], [204, 60], [200, 78], [206, 94], [218, 104], [230, 108], [232, 100], [222, 92], [214, 78], [214, 62], [222, 52]], .7), C.amberLight);
  body += ellipse(252, 84, 25, 20, C.amberDeep, -32);
  body += ellipse(240, 101, 17, 6, C.amberDark, -32);
  body += path(smooth([[262, 68], [272, 63], [284, 68], [288, 80], [286, 94], [276, 99], [266, 94], [262, 82]], .8), C.amber);

  body += ground.body;
  return svg("-6 36 630 410", defs.join(""), body);
}

// ---------- Accountability: one person at the table, answering for the work, in front of everyone ----------

function bust(x, y, r, head, shoulders) {
  const s = path(`M${pt([x - 2.3 * r, y + 3.6 * r])}C${pt([x - 2.3 * r, y + 1.7 * r])} ${pt([x - 1.4 * r, y + 1.25 * r])} ${pt([x, y + 1.25 * r])}C${pt([x + 1.4 * r, y + 1.25 * r])} ${pt([x + 2.3 * r, y + 1.7 * r])} ${pt([x + 2.3 * r, y + 3.6 * r])}Z`, shoulders);
  return s + ellipse(x, y, r * .86, r, head);
}

function microphone(x, top, base, fill, head = fill, size = 1) {
  return line(x, top + 14 * size, x, base, fill, 2.2 * size)
    + ellipse(x, base + 1, 15 * size, 4 * size, fill)
    + path(smooth([[x - 8 * size, top + 4 * size], [x, top - 3 * size], [x + 8 * size, top + 4 * size], [x + 8 * size, top + 16 * size], [x, top + 21 * size], [x - 8 * size, top + 16 * size]], .7), head);
}

function accountability() {
  const rand = mulberry32(1954);
  let body = "";
  const defs = [];

  // The room, reduced to its signs: a flag on its pole and a bust on a plinth.
  body += line(569, 22, 569, 128, C.far, 2.4) + ellipse(569, 19, 4, 4, C.far);
  for (let i = 0; i < 5; i++) body += path(poly([[555 + i * 5.2, 28], [560.2 + i * 5.2, 28], [560.2 + i * 5.2, 112 - i * 2], [555 + i * 5.2, 114 - i * 2]]), i % 2 ? C.far : C.crowd);
  body += ellipse(420, 70, 11, 13, C.far);
  body += path(poly([[402, 108], [406, 88], [434, 88], [438, 108]]), C.far);
  body += path(poly([[408, 108], [432, 108], [432, 116], [408, 116]]), C.far);

  // The gallery: rows of people, every one of them watching the table.
  const rows = [{ y: 138, r: 9.5, gap: 31 }, { y: 172, r: 10.5, gap: 35 }, { y: 210, r: 12, gap: 40 }, { y: 252, r: 13.5, gap: 46 }, { y: 298, r: 15, gap: 54 }];
  rows.forEach((row, ri) => {
    // The gallery narrows toward the back, so the crowd has its own shape instead of running off the edges.
    const lo = 52 + (4 - ri) * 26, hi = 972 - (4 - ri) * 26;
    for (let x = lo + (ri % 2) * row.gap / 2 + rand() * 8; x < hi; x += row.gap * (.85 + rand() * .3)) {
      const y = row.y + (rand() - .5) * 6;
      // Leave a clearing around the witness so he reads on his own.
      if (((x - 612) / 120) ** 2 + ((y - 250) / 105) ** 2 < 1) continue;
      if (ri < 2 && x > 545 && x < 595) continue;
      const lit = rand() < .35;
      body += bust(x, y, row.r * (.92 + rand() * .16), lit ? C.crowdLit : C.crowd, ri > 2 ? C.body : C.far);
    }
  });

  // The witness table.
  body += path(poly([[150, 371], [726, 371], [742, 394], [134, 394]]), C.crowdLit);
  body += path(poly([[134, 394], [742, 394], [742, 446], [134, 446]]), C.body);
  body += microphone(446, 338, 370, C.crowd, C.crowdLit, .9);
  body += microphone(516, 332, 370, C.crowd, C.crowdLit, .9);

  // The witness: amber, alone, hands on the table.
  body += path(smooth([[516, 380], [514, 334], [530, 302], [560, 290], [588, 282], [632, 282], [664, 290], [692, 304], [708, 334], [712, 380]], .6), C.amber);
  body += path(smooth([[584, 284], [598, 284], [607, 346], [588, 330], [568, 300]], .6), C.amberLight);
  body += path(smooth([[624, 284], [638, 284], [656, 300], [633, 330], [615, 346]], .6), C.amberLight);
  body += path(poly([[598, 282], [624, 282], [611, 334]]), C.cream);
  body += path(poly([[606, 290], [616, 290], [619, 326], [611, 346], [603, 326]]), C.amberDeep);
  body += path(poly([[597, 260], [625, 260], [624, 286], [598, 286]]), C.amberMid);
  body += ellipse(611, 232, 27, 35, C.amberLight);
  body += path(smooth([[611, 232], [638, 228], [637, 252], [626, 266], [611, 268]], .7), C.amberMid);
  body += path(smooth([[584, 230], [584, 210], [596, 198], [612, 196], [630, 200], [639, 214], [638, 228], [626, 214], [606, 214], [592, 220]], .8), C.amberDeep);
  body += path(smooth([[590, 368], [604, 364], [618, 368], [616, 380], [592, 380]], .8), C.amberLight);
  body += path(smooth([[622, 368], [638, 364], [650, 370], [646, 382], [624, 381]], .8), C.amberLight);
  body += microphone(572, 290, 382, C.amberDark, C.cream);

  // The questioners, seen from behind at the near desk, sitting on the same floor line.
  const floor = groundLine("floor", 20, 1004, 640, C.line, 1.2, .9);
  defs.push(floor.defs);
  body += path(smooth([[70, 484], [520, 486], [954, 494], [960, 506], [520, 510], [64, 504]], .3), C.body);
  body += microphone(266, 380, 488, C.crowd, C.crowdLit, 1.1);
  body += microphone(920, 432, 496, C.crowd, C.crowdLit, 1.1);
  body += path("M250 640L258 492C262 448 322 416 382 414H486C548 416 594 450 598 492L604 640Z", C.near);
  body += ellipse(433, 368, 50, 58, C.nearest);
  body += path("M624 640L632 518C638 476 690 456 748 454H808C872 458 922 484 930 524L938 640Z", C.near);
  body += ellipse(778, 398, 48, 56, C.nearest);
  // Chair backs, with their row of studs.
  for (const [x0, x1, y0] of [[192, 470, 524], [606, 908, 558]]) {
    body += path(`M${x0} 640L${x0} ${y0 + 24}Q${x0} ${y0} ${x0 + 24} ${y0}H${x1 - 24}Q${x1} ${y0} ${x1} ${y0 + 24}L${x1} 640Z`, C.nearest);
    for (let x = x0 + 22; x <= x1 - 22; x += 13) body += ellipse(x, y0 + 14, 2.1, 2.1, C.far);
    for (let y = y0 + 30; y < 632; y += 13) body += ellipse(x0 + 14, y, 2.1, 2.1, C.far) + ellipse(x1 - 14, y, 2.1, 2.1, C.far);
  }
  body += floor.body;

  return svg("0 0 1024 642", defs.join(""), body);
}

writeFileSync(out("competitive-symbol-leadership.svg"), leadership());
writeFileSync(out("competitive-symbol-accountability.svg"), accountability());
console.log("wrote competitive-symbol-leadership.svg, competitive-symbol-accountability.svg");
