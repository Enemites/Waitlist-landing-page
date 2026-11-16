import { useEffect, useRef } from "react";

import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * The hero is a dive into another world. On load the camera rushes through a lime gate, then keeps
 * travelling down a tunnel of playful forms (glossy orbs, spinning rings, tumbling cubes, pills,
 * squiggles, sparks and small ringed worlds) toward the light at its far end, passing a new gate
 * every so often. Pointer input steers the view a little; it never changes page state.
 */

const TAU = Math.PI * 2;
const FAR = 66;
const NEAR = 0.9;
const COUNT = 46;
const GATE_GAP = 96;
const GATE_RADIUS = 8.5;
const GATE_REACH = 150;
const CRUISE = 0.0042; // world units per millisecond
const INTRO_MS = 2600;
const INTRO_RUSH = 46;
const START_Z = -34;
const STREAKS = 40;

type Kind = "orb" | "ring" | "pill" | "cube" | "spark" | "squiggle" | "planet";
type Tone = "lime" | "white" | "dark";
type Shape = {
  kind: Kind; tone: Tone; x: number; y: number; z: number; size: number;
  angle: number; spin: number; tilt: number; tiltSpin: number; phase: number;
};

const KINDS: Kind[] = ["orb", "orb", "orb", "ring", "ring", "pill", "pill", "cube", "cube", "spark", "spark", "squiggle", "planet"];
const TONES: Tone[] = ["lime", "lime", "lime", "white", "dark"];

// Colour ramps for lit forms, from shadow to highlight.
const RAMPS: Record<Tone, readonly [number[], number[]]> = {
  lime: [[62, 96, 10], [242, 255, 172]],
  white: [[104, 116, 110], [255, 255, 255]],
  dark: [[7, 11, 12], [58, 74, 52]],
};
const ORB_STOPS: Record<Tone, [number, string][]> = {
  lime: [[0, "#f8ffdc"], [0.25, "#e0ff70"], [0.68, "#b4e335"], [1, "#4f7a0c"]],
  white: [[0, "#ffffff"], [0.45, "#e6ece4"], [1, "#7a877f"]],
  dark: [[0, "#3c4b37"], [0.4, "#141c19"], [1, "#05090a"]],
};

const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
const smooth = (edge0: number, edge1: number, x: number) => {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};
const rgb = (c: number[], alpha = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${alpha.toFixed(3)})`;
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t);

function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A unit cube: corners, and faces as corner indices with their outward normals.
const CORNERS = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
const FACES: [number[], number[]][] = [
  [[0, 1, 2, 3], [0, 0, -1]], [[5, 4, 7, 6], [0, 0, 1]], [[4, 0, 3, 7], [-1, 0, 0]],
  [[1, 5, 6, 2], [1, 0, 0]], [[3, 2, 6, 7], [0, 1, 0]], [[4, 5, 1, 0], [0, -1, 0]],
];
const LIGHT = (() => { const v = [-0.5, 0.7, -0.6]; const m = Math.hypot(...v); return v.map((n) => n / m); })();

const readVar = (style: CSSStyleDeclaration, name: string, fallback: number) => {
  const value = parseFloat(style.getPropertyValue(name));
  return Number.isFinite(value) ? value : fallback;
};

export default function ArenaScene({ className = "" }: { className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const host = root.current;
    const surface = canvas.current;
    if (!host || !surface) return;
    const context = surface.getContext("2d");
    if (!context) return;
    const ctx = context;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const animate = !reduce;

    const random = seeded(1729);
    const pick = <T,>(list: T[]) => list[Math.floor(random() * list.length)];
    const shapes: Shape[] = [];
    const spawn = (shape: Partial<Shape>, z: number) => {
      const theta = random() * TAU;
      let dx = Math.cos(theta);
      const dy = Math.sin(theta);
      if (dx < -0.2 && random() < 0.6) dx = -dx; // keep the copy's side quieter
      const radius = 2.6 + random() * 7.4;
      const kind = pick(KINDS);
      Object.assign(shape, {
        kind,
        tone: kind === "planet" ? "dark" : kind === "spark" ? (random() < 0.6 ? "lime" : "white") : pick(TONES),
        x: dx * radius * 1.15,
        y: dy * radius * 0.85,
        z,
        size: (kind === "spark" ? 0.4 : kind === "ring" ? 0.95 : kind === "planet" ? 0.75 : 0.7) * (0.7 + random() * 0.75),
        angle: random() * TAU,
        spin: (random() - 0.5) * 0.0018,
        tilt: random() * TAU,
        tiltSpin: (random() - 0.5) * 0.0014,
        phase: random() * TAU,
      });
      return shape as Shape;
    };
    for (let n = 0; n < COUNT; n++) shapes.push(spawn({}, START_Z + INTRO_RUSH * 0.35 + 3 + (n / COUNT) * FAR));
    const streaks = Array.from({ length: STREAKS }, () => ({ x: 0, y: 0, z: 0, length: 0 }));
    const placeStreak = (streak: (typeof streaks)[number], z: number) => {
      const theta = random() * TAU, radius = 4 + random() * 12;
      streak.x = Math.cos(theta) * radius; streak.y = Math.sin(theta) * radius * 0.8;
      streak.z = z; streak.length = 3 + random() * 6;
    };
    streaks.forEach((streak) => placeStreak(streak, START_Z + random() * FAR));

    let width = 0, height = 0, ratio = 1, focal = 1, vpX = 0, vpY = 0, quietX = 0, quietY = 0;
    let frame = 0, visible = true, last = 0, start = 0, spent = 0, drawn = 0, reduced = false;
    let targetX = 0, targetY = 0, px = 0, py = 0;

    const measure = () => {
      const style = getComputedStyle(host);
      focal = Math.hypot(width, height) * readVar(style, "--realm-focal", 0.5);
      vpX = width * readVar(style, "--realm-x", 0.68);
      vpY = height * readVar(style, "--realm-y", 0.5);
      // Forms passing over the copy (left of quietX, or above quietY) are dimmed.
      quietX = width * readVar(style, "--realm-quiet-x", 0.5);
      quietY = height * readVar(style, "--realm-quiet-y", 0);
    };

    // Forms are drawn in screen space at their projected centre and size.
    const orb = (x: number, y: number, r: number, tone: Tone, squash: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1 + squash, 1 - squash);
      const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.05, 0, 0, r);
      if (tone === "lime") {
        const halo = ctx.createRadialGradient(0, 0, r * 0.9, 0, 0, r * 1.6);
        halo.addColorStop(0, "rgba(214,255,90,0.28)");
        halo.addColorStop(1, "rgba(214,255,90,0)");
        ctx.fillStyle = halo;
        ctx.beginPath(); ctx.arc(0, 0, r * 1.6, 0, TAU); ctx.fill();
      }
      for (const [at, color] of ORB_STOPS[tone]) g.addColorStop(at, color);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
      if (tone === "dark") {
        ctx.strokeStyle = "rgba(214,250,128,0.85)";
        ctx.lineWidth = Math.max(1, r * 0.06);
        ctx.beginPath(); ctx.arc(0, 0, r * 0.96, -0.15, 1.5); ctx.stroke();
      }
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.beginPath(); ctx.ellipse(-r * 0.38, -r * 0.44, r * 0.2, r * 0.1, -0.6, 0, TAU); ctx.fill();
      ctx.restore();
    };

    const ring = (x: number, y: number, r: number, tone: Tone, angle: number, tilt: number) => {
      const ry = Math.max(0.14, Math.abs(Math.cos(tilt))) * r;
      const band = r * 0.3;
      const [low, high] = RAMPS[tone];
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.lineWidth = band;
      ctx.strokeStyle = rgb(mix(low, high, 0.25));
      ctx.beginPath(); ctx.ellipse(0, 0, r, ry, 0, Math.PI, TAU); ctx.stroke();
      const g = ctx.createLinearGradient(0, -ry - band, 0, ry + band);
      g.addColorStop(0, rgb(mix(low, high, 0.55)));
      g.addColorStop(0.55, rgb(high));
      g.addColorStop(1, rgb(mix(low, high, 0.4)));
      ctx.strokeStyle = g;
      ctx.beginPath(); ctx.ellipse(0, 0, r, ry, 0, 0, Math.PI); ctx.stroke();
      ctx.lineWidth = band * 0.2;
      ctx.lineCap = "round";
      ctx.strokeStyle = tone === "dark" ? "rgba(214,250,128,0.8)" : "rgba(255,255,255,0.55)";
      ctx.beginPath(); ctx.ellipse(0, -band * 0.18, r, ry, 0, Math.PI * 0.18, Math.PI * 0.82); ctx.stroke();
      ctx.restore();
    };

    const pill = (x: number, y: number, r: number, tone: Tone, angle: number) => {
      const length = r * 2.5, thick = r * 0.95, half = length / 2 - thick / 2;
      const [low, high] = RAMPS[tone];
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      const g = ctx.createLinearGradient(0, -thick / 2, 0, thick / 2);
      g.addColorStop(0, rgb(mix(low, high, 0.75)));
      g.addColorStop(0.3, rgb(high));
      g.addColorStop(1, rgb(low));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-half, -thick / 2);
      ctx.lineTo(half, -thick / 2);
      ctx.arc(half, 0, thick / 2, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(-half, thick / 2);
      ctx.arc(-half, 0, thick / 2, Math.PI / 2, Math.PI * 1.5);
      ctx.fill();
      ctx.lineCap = "round";
      ctx.lineWidth = thick * 0.13;
      ctx.strokeStyle = tone === "dark" ? "rgba(214,250,128,0.75)" : "rgba(255,255,255,0.6)";
      ctx.beginPath(); ctx.moveTo(-half, -thick * 0.24); ctx.lineTo(half * 0.7, -thick * 0.24); ctx.stroke();
      ctx.restore();
    };

    const corner = [0, 0, 0];
    const cubePoints = new Float32Array(16);
    const cube = (x: number, y: number, r: number, tone: Tone, a: number, b: number) => {
      const s = r * 0.62;
      const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
      const turn = (v: number[], out: number[]) => {
        const x1 = v[0] * ca + v[2] * sa, z1 = -v[0] * sa + v[2] * ca;
        out[0] = x1; out[1] = v[1] * cb - z1 * sb; out[2] = v[1] * sb + z1 * cb;
      };
      CORNERS.forEach((c, i) => { turn(c, corner); cubePoints[i * 2] = x + corner[0] * s; cubePoints[i * 2 + 1] = y - corner[1] * s; });
      const [low, high] = RAMPS[tone];
      ctx.lineJoin = "round";
      for (const [face, normal] of FACES) {
        turn(normal, corner);
        if (corner[2] >= 0) continue; // facing away
        const lit = Math.max(0, corner[0] * LIGHT[0] + corner[1] * LIGHT[1] + corner[2] * LIGHT[2]);
        const color = rgb(mix(low, high, 0.22 + 0.78 * lit));
        ctx.fillStyle = color;
        ctx.strokeStyle = tone === "dark" ? "rgba(214,250,128,0.7)" : color;
        ctx.lineWidth = tone === "dark" ? Math.max(1, r * 0.03) : 1;
        ctx.beginPath();
        face.forEach((index, n) => (n ? ctx.lineTo : ctx.moveTo).call(ctx, cubePoints[index * 2], cubePoints[index * 2 + 1]));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    };

    const spark = (x: number, y: number, r: number, tone: Tone, angle: number, twinkle: number) => {
      const size = r * (0.75 + 0.25 * twinkle);
      ctx.save();
      ctx.translate(x, y);
      const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 1.8);
      halo.addColorStop(0, "rgba(214,250,128,0.35)");
      halo.addColorStop(1, "rgba(214,250,128,0)");
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(0, 0, size * 1.8, 0, TAU); ctx.fill();
      ctx.rotate(angle);
      ctx.fillStyle = tone === "white" ? "#ffffff" : "#ddfb84";
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.quadraticCurveTo(0, 0, size, 0);
      ctx.quadraticCurveTo(0, 0, 0, size);
      ctx.quadraticCurveTo(0, 0, -size, 0);
      ctx.quadraticCurveTo(0, 0, 0, -size);
      ctx.fill();
      ctx.restore();
    };

    const squiggle = (x: number, y: number, r: number, tone: Tone, angle: number, wave: number) => {
      const [low, high] = RAMPS[tone === "dark" ? "lime" : tone];
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const trace = (offset: number) => {
        ctx.beginPath();
        for (let i = 0; i <= 28; i++) {
          const u = i / 28 * 2 - 1;
          const px_ = u * r * 1.7, py_ = Math.sin(u * Math.PI * 2.5 + wave) * r * 0.34 + offset;
          (i ? ctx.lineTo : ctx.moveTo).call(ctx, px_, py_);
        }
      };
      ctx.lineWidth = r * 0.3;
      ctx.strokeStyle = rgb(low);
      trace(r * 0.09); ctx.stroke();
      ctx.strokeStyle = rgb(high);
      ctx.lineWidth = r * 0.24;
      trace(0); ctx.stroke();
      ctx.restore();
    };

    const planet = (x: number, y: number, r: number, angle: number, spin: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle * 0.15 - 0.35);
      const ringStroke = (from: number, to: number) => {
        ctx.lineWidth = Math.max(1.2, r * 0.1);
        ctx.strokeStyle = "rgba(214,250,128,0.9)";
        ctx.beginPath(); ctx.ellipse(0, 0, r * 1.75, r * 0.42, 0, from, to); ctx.stroke();
      };
      ringStroke(Math.PI, TAU);
      const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.05, 0, 0, r);
      for (const [at, color] of ORB_STOPS.dark) g.addColorStop(at, color);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
      // Contour bands, the page's way of drawing land, sliding round the little world.
      ctx.save();
      ctx.clip();
      ctx.lineWidth = Math.max(0.8, r * 0.05);
      ctx.strokeStyle = "rgba(214,250,128,0.8)";
      for (let k = -3; k <= 3; k++) {
        ctx.beginPath();
        for (let i = 0; i <= 20; i++) {
          const u = i / 20 * 2 - 1;
          const py_ = k * r * 0.27 + Math.sin(u * 3 + k * 1.3 + spin) * r * 0.07;
          (i ? ctx.lineTo : ctx.moveTo).call(ctx, u * r, py_);
        }
        ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = "rgba(214,250,128,0.9)";
      ctx.lineWidth = Math.max(1, r * 0.05);
      ctx.beginPath(); ctx.arc(0, 0, r * 0.97, -0.2, 1.6); ctx.stroke();
      ringStroke(0, Math.PI);
      ctx.restore();
    };

    const gate = (x: number, y: number, r: number, alpha: number, turn: number) => {
      ctx.save();
      ctx.lineCap = "round";
      ctx.strokeStyle = `rgba(214,250,128,${(0.14 * alpha).toFixed(3)})`;
      ctx.lineWidth = Math.max(4, r * 0.16);
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
      ctx.strokeStyle = `rgba(206,246,112,${(0.95 * alpha).toFixed(3)})`;
      ctx.lineWidth = Math.max(1.5, r * 0.045);
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
      ctx.strokeStyle = `rgba(250,255,232,${(0.85 * alpha).toFixed(3)})`;
      ctx.lineWidth = Math.max(0.8, r * 0.012);
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
      // Lights travelling round the rim.
      ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
      for (let n = 0; n < 14; n++) {
        const a = turn + (n / 14) * TAU;
        ctx.beginPath(); ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, Math.max(1, r * 0.022), 0, TAU); ctx.fill();
      }
      ctx.restore();
    };

    type Drawable = { depth: number; draw: () => void };
    const queue: Drawable[] = [];

    const draw = (time: number) => {
      if (!start) start = time;
      const elapsed = animate ? time - start : 0;
      const intro = animate ? clamp01(elapsed / INTRO_MS) : 1;
      const ease = 1 - Math.pow(1 - intro, 3);
      px += (targetX - px) * 0.05;
      py += (targetY - py) * 0.05;

      const camZ = START_Z + elapsed * CRUISE + INTRO_RUSH * ease;
      const camX = px * 1.6 + Math.sin(elapsed * 0.00017) * 0.8;
      const camY = -py * 1.2 + Math.cos(elapsed * 0.00013) * 0.6;
      const roll = (animate ? Math.sin(elapsed * 0.00021) * 0.05 : 0) + px * 0.04;
      const f = focal;
      const reach = Math.max(width, height);

      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.fillStyle = "#080e10";
      ctx.fillRect(0, 0, width, height);
      ctx.translate(vpX, vpY);
      ctx.rotate(roll);
      ctx.translate(-vpX, -vpY);

      // The other world's light at the end of the tunnel.
      const glow = ctx.createRadialGradient(vpX, vpY, 0, vpX, vpY, reach * 0.55);
      glow.addColorStop(0, "rgba(248,255,222,0.95)");
      glow.addColorStop(0.035, "rgba(222,252,140,0.75)");
      glow.addColorStop(0.12, "rgba(196,237,108,0.28)");
      glow.addColorStop(0.45, "rgba(196,237,108,0.06)");
      glow.addColorStop(1, "rgba(196,237,108,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(vpX - reach * 0.6, vpY - reach * 0.6, reach * 1.2, reach * 1.2);

      // Speed lines streaming out of the light.
      ctx.lineCap = "round";
      ctx.lineWidth = 1;
      for (const streak of streaks) {
        if (streak.z + streak.length < camZ + NEAR) placeStreak(streak, camZ + FAR * (0.7 + random() * 0.4));
        const z0 = Math.max(camZ + NEAR, streak.z), z1 = streak.z + streak.length;
        const a = smooth(FAR, FAR * 0.6, z0 - camZ) * 0.4;
        if (a < 0.01) continue;
        ctx.strokeStyle = `rgba(222,252,150,${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(vpX + (f * (streak.x - camX)) / (z1 - camZ), vpY - (f * (streak.y - camY)) / (z1 - camZ));
        ctx.lineTo(vpX + (f * (streak.x - camX)) / (z0 - camZ), vpY - (f * (streak.y - camY)) / (z0 - camZ));
        ctx.stroke();
      }

      queue.length = 0;
      for (let g = Math.floor((camZ + NEAR) / GATE_GAP) * GATE_GAP; g < camZ + GATE_REACH; g += GATE_GAP) {
        const rz = g - camZ;
        if (rz < NEAR) continue;
        const r = (f * GATE_RADIUS) / rz;
        if (r > reach * 2.5) continue;
        const gx = vpX + (f * -camX) / rz, gy = vpY - (f * -camY) / rz;
        const alpha = smooth(GATE_REACH, GATE_REACH * 0.55, rz) * smooth(NEAR, NEAR + 2, rz);
        const turn = elapsed * 0.0004 + g;
        queue.push({ depth: rz, draw: () => gate(gx, gy, r, alpha, turn) });
      }
      for (const shape of shapes) {
        if (shape.z - camZ < NEAR) spawn(shape, camZ + FAR + random() * 8);
        const rz = shape.z - camZ;
        const t = elapsed;
        const bob = Math.sin(t * 0.0011 + shape.phase) * 0.25;
        const sx = vpX + (f * (shape.x - camX)) / rz;
        const sy = vpY - (f * (shape.y + bob - camY)) / rz;
        const r = (f * shape.size) / rz;
        if (sx < -r * 3 || sx > width + r * 3 || sy < -r * 3 || sy > height + r * 3) continue;
        const appear = smooth(FAR + 6, FAR - 12, rz);
        const depthFade = 0.35 + 0.65 * (1 - clamp01((rz - 8) / (FAR - 8)));
        const quiet = Math.min(
          quietX > 0 ? 0.22 + 0.78 * smooth(quietX * 0.55, quietX * 1.1, sx) : 1,
          quietY > 0 ? 0.22 + 0.78 * smooth(quietY * 0.6, quietY * 1.15, sy) : 1,
        );
        const alpha = appear * depthFade * quiet;
        const angle = shape.angle + t * shape.spin;
        const tilt = shape.tilt + t * shape.tiltSpin;
        queue.push({
          depth: rz,
          draw: () => {
            ctx.globalAlpha = alpha;
            switch (shape.kind) {
              case "orb": orb(sx, sy, r, shape.tone, Math.sin(t * 0.004 + shape.phase) * 0.05); break;
              case "ring": ring(sx, sy, r, shape.tone, angle, tilt); break;
              case "pill": pill(sx, sy, r, shape.tone, angle); break;
              case "cube": cube(sx, sy, r, shape.tone, angle, tilt); break;
              case "spark": spark(sx, sy, r, shape.tone, angle, Math.sin(t * 0.005 + shape.phase)); break;
              case "squiggle": squiggle(sx, sy, r, shape.tone, angle, t * 0.004 + shape.phase); break;
              case "planet": planet(sx, sy, r, angle, t * 0.0015 + shape.phase); break;
            }
            ctx.globalAlpha = 1;
          },
        });
      }
      queue.sort((a, b) => b.depth - a.depth);
      for (const item of queue) item.draw();

      // Arrival: the dive starts from darkness.
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const veil = animate ? 1 - clamp01(elapsed / (INTRO_MS * 0.32)) : 0;
      if (veil > 0) {
        ctx.fillStyle = `rgba(8,14,16,${veil.toFixed(3)})`;
        ctx.fillRect(0, 0, width, height);
      }
    };

    const applySize = () => {
      ratio = Math.min(window.devicePixelRatio || 1, reduced ? 1 : 1.5);
      surface.width = Math.max(1, Math.round(width * ratio));
      surface.height = Math.max(1, Math.round(height * ratio));
    };
    const resize = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width;
      height = entry.contentRect.height;
      measure();
      applySize();
      if (!animate) draw(0);
    });
    const tick = (time: number) => {
      if (visible && !document.hidden && time - last > 30) {
        // Drop to one canvas pixel per CSS pixel on machines that cannot hold ~20 frames a second.
        if (last && time - last < 250) { spent += time - last; drawn++; }
        if (drawn === 40) {
          if (spent / drawn > 50 && ratio > 1) { reduced = true; applySize(); }
          spent = 0; drawn = 0;
        }
        draw(time);
        last = time;
      }
      frame = requestAnimationFrame(tick);
    };
    const pointerZone = host.parentElement ?? host;
    const move = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    const leave = () => { targetX = 0; targetY = 0; };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { rootMargin: "80px" });
    resize.observe(host);
    observer.observe(host);
    if (animate && finePointer) {
      pointerZone.addEventListener("pointermove", move, { passive: true });
      pointerZone.addEventListener("pointerleave", leave);
    }
    if (animate) frame = requestAnimationFrame(tick);
    return () => {
      resize.disconnect();
      observer.disconnect();
      cancelAnimationFrame(frame);
      pointerZone.removeEventListener("pointermove", move);
      pointerZone.removeEventListener("pointerleave", leave);
    };
  }, [reduce]);

  return (
    <div ref={root} className={`arena-scene ${className}`} aria-hidden="true">
      <canvas ref={canvas} className="arena-scene-field" />
    </div>
  );
}
