import { useEffect, useRef } from "react";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { createNoise3D, fbm } from "@/lib/terrain-noise";

/**
 * The hero world: a single realm drawn the way the rest of the page draws terrain, as contour lines.
 * Coastlines are the brightest isoline, every fourth land contour is an index contour, and the
 * sea floor is only hinted at. Pointer input turns the globe; it never changes page state.
 */

const LAT_STEPS = 96;
const LON_STEPS = 192;
const LAT_MAX = (86 * Math.PI) / 180;
const LAND_STEP = 0.042;
const SEA_LEVELS = [-0.075, -0.15];
const RELIEF = 0.075;
const BUCKETS = 6;

// sea, coast, land, index land
const STYLES = [
  { alpha: 0.2, width: 0.6 },
  { alpha: 1, width: 1.2 },
  { alpha: 0.62, width: 0.7 },
  { alpha: 0.9, width: 1 },
] as const;

type World = Float32Array[];

let cachedWorld: World | null = null;

function buildWorld(): World {
  if (cachedWorld) return cachedWorld;
  const noise = createNoise3D(1729);
  const cols = LON_STEPS;
  const rows = LAT_STEPS + 1;
  const dLat = (LAT_MAX * 2) / LAT_STEPS;
  const dLon = (Math.PI * 2) / LON_STEPS;
  const field = new Float32Array(rows * cols);
  let peak = 0;
  for (let i = 0; i < rows; i++) {
    const lat = -LAT_MAX + i * dLat;
    for (let j = 0; j < cols; j++) {
      const lon = j * dLon;
      const x = Math.cos(lat) * Math.cos(lon), y = Math.sin(lat), z = Math.cos(lat) * Math.sin(lon);
      const warp = fbm(noise, x * 1.1 + 11.3, y * 1.1 - 4.1, z * 1.1 + 7.7, 3);
      const h = fbm(noise, x * 1.45 + warp * 0.95, y * 1.45 + warp * 0.6, z * 1.45 - warp * 0.8, 5) + 0.035;
      field[i * cols + j] = h;
      peak = Math.max(peak, h);
    }
  }

  const levels: { value: number; style: number }[] = SEA_LEVELS.map((value) => ({ value, style: 0 }));
  for (let k = 0, value = 0; value < peak; k++, value = k * LAND_STEP) {
    levels.push({ value, style: k === 0 ? 1 : k % 4 === 0 ? 3 : 2 });
  }

  const out: number[][] = STYLES.map(() => []);
  const vertex = (fi: number, fj: number, level: number, target: number[]) => {
    const lat = -LAT_MAX + fi * dLat;
    const lon = fj * dLon;
    const r = 1 + Math.max(level, 0) * RELIEF;
    target.push(Math.cos(lat) * Math.cos(lon) * r, Math.sin(lat) * r, Math.cos(lat) * Math.sin(lon) * r);
  };

  const cross = new Float32Array(8);
  for (const { value: level, style } of levels) {
    const target = out[style];
    for (let i = 0; i < LAT_STEPS; i++) {
      for (let j = 0; j < cols; j++) {
        const j1 = (j + 1) % cols;
        const a = field[i * cols + j], b = field[i * cols + j1];
        const c = field[(i + 1) * cols + j1], d = field[(i + 1) * cols + j];
        const sa = a >= level, sb = b >= level, sc = c >= level, sd = d >= level;
        if (sa === sb && sb === sc && sc === sd) continue;
        // Edge crossings in grid space: e0 a-b, e1 b-c, e2 c-d, e3 d-a.
        const hits: number[] = [];
        if (sa !== sb) { const t = (level - a) / (b - a); cross[0] = i; cross[1] = j + t; hits.push(0); }
        if (sb !== sc) { const t = (level - b) / (c - b); cross[2] = i + t; cross[3] = j + 1; hits.push(1); }
        if (sc !== sd) { const t = (level - c) / (d - c); cross[4] = i + 1; cross[5] = j + 1 - t; hits.push(2); }
        if (sd !== sa) { const t = (level - d) / (a - d); cross[6] = i + 1 - t; cross[7] = j; hits.push(3); }
        const pairs: [number, number][] = [];
        if (hits.length === 2) pairs.push([hits[0], hits[1]]);
        else if (hits.length === 4) {
          const centerAbove = (a + b + c + d) / 4 >= level;
          if (centerAbove === sa) pairs.push([0, 1], [2, 3]);
          else pairs.push([3, 0], [1, 2]);
        }
        for (const [p, q] of pairs) {
          vertex(cross[p * 2], cross[p * 2 + 1], level, target);
          vertex(cross[q * 2], cross[q * 2 + 1], level, target);
        }
      }
    }
  }
  cachedWorld = out.map((segments) => new Float32Array(segments));
  return cachedWorld;
}

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

    const world = buildWorld();
    const screens = world.map((segments) => new Float32Array((segments.length / 6) * 4));
    const buckets = world.map((segments) => new Int8Array(segments.length / 6));
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const animate = !reduce;
    const light = (() => { const v = [-0.5, 0.55, 0.68]; const m = Math.hypot(...v); return v.map((n) => n / m); })();

    let width = 0, height = 0, cx = 0, cy = 0, radius = 0, boxX = 0, boxY = 0, boxW = 0, boxH = 0;
    let frame = 0, visible = true, last = 0, start = 0;
    let targetX = 0, targetY = 0, px = 0, py = 0;

    const measure = () => {
      const style = getComputedStyle(host);
      cx = width * readVar(style, "--globe-x", 0.68);
      cy = height * readVar(style, "--globe-y", 0.5);
      radius = Math.min(width * readVar(style, "--globe-rw", 0.25), height * readVar(style, "--globe-rh", 0.4));
    };

    const draw = (time: number) => {
      if (!start) start = time;
      const intro = animate ? Math.min(1, (time - start) / 1600) : 1;
      const ease = 1 - Math.pow(1 - intro, 3);
      px += (targetX - px) * 0.05;
      py += (targetY - py) * 0.05;
      const yaw = 2.2 + (animate ? time * 0.000032 : 0) + px * 0.35 + (1 - ease) * 0.5;
      const tilt = -0.38 + py * 0.14;
      const r = radius * (0.965 + 0.035 * ease);
      const cosY = Math.cos(yaw), sinY = Math.sin(yaw), cosT = Math.cos(tilt), sinT = Math.sin(tilt);

      context.clearRect(boxX, boxY, boxW, boxH);
      context.globalAlpha = ease;

      // Atmosphere and body: a lit sphere, never a glow.
      const halo = context.createRadialGradient(cx, cy, r * 0.96, cx, cy, r * 1.18);
      halo.addColorStop(0, "rgba(196,237,108,0.075)");
      halo.addColorStop(1, "rgba(196,237,108,0)");
      context.fillStyle = halo;
      context.beginPath(); context.arc(cx, cy, r * 1.18, 0, Math.PI * 2); context.fill();
      const body = context.createRadialGradient(cx - r * 0.42, cy - r * 0.48, r * 0.1, cx, cy, r * 1.02);
      body.addColorStop(0, "#15231c");
      body.addColorStop(0.55, "#0d1714");
      body.addColorStop(1, "#080e10");
      context.fillStyle = body;
      context.beginPath(); context.arc(cx, cy, r, 0, Math.PI * 2); context.fill();
      context.strokeStyle = "rgba(196,237,108,0.16)";
      context.lineWidth = 1;
      context.stroke();

      context.lineCap = "round";
      for (let s = 0; s < world.length; s++) {
        const segments = world[s], screen = screens[s], bucket = buckets[s];
        const count = bucket.length;
        for (let n = 0; n < count; n++) {
          const o = n * 6;
          const x1 = segments[o] * cosY + segments[o + 2] * sinY;
          const z1r = -segments[o] * sinY + segments[o + 2] * cosY;
          const y1 = segments[o + 1] * cosT - z1r * sinT;
          const z1 = segments[o + 1] * sinT + z1r * cosT;
          if (z1 <= 0) { bucket[n] = -1; continue; }
          const x2 = segments[o + 3] * cosY + segments[o + 5] * sinY;
          const z2r = -segments[o + 3] * sinY + segments[o + 5] * cosY;
          const y2 = segments[o + 4] * cosT - z2r * sinT;
          const z2 = segments[o + 4] * sinT + z2r * cosT;
          if (z2 <= 0) { bucket[n] = -1; continue; }
          const lambert = Math.max(0, x1 * light[0] + y1 * light[1] + z1 * light[2]);
          const limb = Math.min(1, z1 / 0.24);
          const shade = (0.16 + 0.84 * lambert) * limb;
          bucket[n] = Math.min(BUCKETS - 1, Math.floor(shade * BUCKETS));
          const p = n * 4;
          screen[p] = cx + x1 * r; screen[p + 1] = cy - y1 * r;
          screen[p + 2] = cx + x2 * r; screen[p + 3] = cy - y2 * r;
        }
        context.lineWidth = STYLES[s].width;
        for (let b = 0; b < BUCKETS; b++) {
          context.beginPath();
          let any = false;
          for (let n = 0; n < count; n++) {
            if (bucket[n] !== b) continue;
            const p = n * 4;
            context.moveTo(screen[p], screen[p + 1]);
            context.lineTo(screen[p + 2], screen[p + 3]);
            any = true;
          }
          if (!any) continue;
          context.strokeStyle = `rgba(196,237,108,${(STYLES[s].alpha * (b + 0.5)) / BUCKETS})`;
          context.stroke();
        }
      }
      context.globalAlpha = 1;
    };

    const resize = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width;
      height = entry.contentRect.height;
      measure();
      // The canvas only covers the globe and its halo: rasterizing the whole hero is the real cost.
      const reach = radius * 1.2;
      boxX = Math.max(0, Math.floor(cx - reach));
      boxY = Math.max(0, Math.floor(cy - reach));
      boxW = Math.max(1, Math.min(width, Math.ceil(cx + reach)) - boxX);
      boxH = Math.max(1, Math.min(height, Math.ceil(cy + reach)) - boxY);
      Object.assign(surface.style, { left: `${boxX}px`, top: `${boxY}px`, width: `${boxW}px`, height: `${boxH}px` });
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      surface.width = Math.round(boxW * ratio);
      surface.height = Math.round(boxH * ratio);
      context.setTransform(ratio, 0, 0, ratio, -boxX * ratio, -boxY * ratio);
      if (!animate) draw(0);
    });
    const tick = (time: number) => {
      if (visible && !document.hidden && time - last > 24) { draw(time); last = time; }
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
