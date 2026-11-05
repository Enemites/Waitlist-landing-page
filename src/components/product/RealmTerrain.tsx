import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * A small isometric realm. Each choice sends a consequence wave across the terrain:
 * land rises and falls around the decision and the route of earlier choices stays lit.
 * Purely illustrative. It changes no page state.
 */

type Cell = { h: number; target: number; from: number; changeAt: number; lit: number; litAt: number };

const N = 20;
const LEVELS = 7;
const WAVE_SPEED = 0.014; // cells per millisecond
const SETTLE_MS = 900;

function hash(x: number, y: number, seed: number) {
  let h = (x * 374761393 + y * 668265263 + seed * 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function valueNoise(x: number, y: number, seed: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const s = (t: number) => t * t * (3 - 2 * t);
  const a = hash(xi, yi, seed), b = hash(xi + 1, yi, seed), c = hash(xi, yi + 1, seed), d = hash(xi + 1, yi + 1, seed);
  const u = s(xf), v = s(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function heightAt(i: number, j: number, seed: number) {
  let v = 0, amp = 0.6, f = 0.16, norm = 0;
  for (let o = 0; o < 3; o++) { v += valueNoise(i * f, j * f, seed + o * 17) * amp; norm += amp; amp *= 0.5; f *= 2.1; }
  v /= norm;
  // Island falloff, so the realm reads as one bounded world.
  const dx = (i - (N - 1) / 2) / (N / 2), dy = (j - (N - 1) / 2) / (N / 2);
  const edge = Math.max(0, 1 - Math.pow(Math.max(Math.abs(dx), Math.abs(dy)), 3.2));
  const stretched = Math.min(1, Math.max(0, (v - 0.3) / 0.42));
  return Math.pow(stretched, 1.25) * (0.25 + edge * 0.75);
}

const mix = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t);
const rgb = (c: number[], k = 1, alpha = 1) => `rgba(${Math.round(c[0] * k)},${Math.round(c[1] * k)},${Math.round(c[2] * k)},${alpha})`;
const WATER_LEVEL = 0.12;
const WATER = [13, 31, 34], SHORE = [34, 52, 42], MID = [46, 70, 52], HIGH = [96, 118, 86], PEAK = [168, 186, 146], LIME = [196, 237, 108];

function groundColor(h: number) {
  if (h <= WATER_LEVEL) return WATER;
  if (h < 0.4) return mix(SHORE, MID, (h - WATER_LEVEL) / (0.4 - WATER_LEVEL));
  if (h < 0.78) return mix(MID, HIGH, (h - 0.4) / 0.38);
  return mix(HIGH, PEAK, Math.min(1, (h - 0.78) / 0.22));
}

export default function RealmTerrain({ className = "" }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const root = host.current, surface = canvas.current;
    if (!root || !surface) return;
    const ctx = surface.getContext("2d");
    if (!ctx) return;

    let seed = 7;
    const cells: Cell[] = [];
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const h = heightAt(i, j, seed);
      cells.push({ h, target: h, from: h, changeAt: Infinity, lit: 0, litAt: Infinity });
    }
    const at = (i: number, j: number) => cells[i * N + j];

    let width = 0, height = 0, tileW = 0, tileH = 0, lift = 0, originX = 0, originY = 0;
    let frame = 0, visible = false, running = false, last = 0;
    let hover: [number, number] | null = null;
    let wave: { i: number; j: number; start: number } | null = null;
    const decisions: [number, number][] = [];
    let idleTimer = 0;

    const layout = () => {
      const rect = root.getBoundingClientRect();
      width = rect.width; height = rect.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      surface.width = Math.round(width * ratio);
      surface.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      tileW = Math.min(width / (N + 1), (height * 2) / (N + 6));
      tileH = tileW / 2;
      lift = tileW * 3.1;
      originX = width / 2;
      originY = (height - N * tileH) / 2 + lift * 0.42;
    };

    const project = (i: number, j: number, h: number) => ({
      x: originX + (i - j) * (tileW / 2),
      y: originY + (i + j) * (tileH / 2) - h * lift,
    });

    const routeBetween = (a: [number, number], b: [number, number]) => {
      const route: [number, number][] = [];
      let [i, j] = a;
      while (i !== b[0] || j !== b[1]) {
        // Alternate axes so the trail bends across the land instead of drawing an L.
        if (i !== b[0] && (j === b[1] || (i + j) % 2 === 0)) i += Math.sign(b[0] - i);
        else j += Math.sign(b[1] - j);
        route.push([i, j]);
      }
      return route;
    };

    const decide = (i: number, j: number, now: number) => {
      i = Math.max(1, Math.min(N - 2, i)); j = Math.max(1, Math.min(N - 2, j));
      seed += 1;
      const prev = decisions[decisions.length - 1];
      decisions.push([i, j]);
      if (decisions.length > 5) decisions.shift();
      const instant = reduce;
      // Reshape: land near the decision follows the new field most strongly.
      for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) {
        const c = at(a, b);
        const d = Math.hypot(a - i, b - j);
        const influence = Math.max(0.25, 1 - d / (N * 0.75));
        const next = heightAt(a, b, seed);
        c.from = c.h;
        c.target = c.h + (next - c.h) * influence;
        c.changeAt = instant ? now : now + d / WAVE_SPEED;
        if (instant) { c.h = c.target; c.changeAt = Infinity; }
      }
      // The decision lifts its own ground a little: a choice leaves a mark.
      const self = at(i, j);
      self.target = Math.min(1, Math.max(self.target, 0.55));
      if (instant) self.h = self.target;
      // Fade the oldest trail, light the new segment.
      cells.forEach((c) => { c.lit *= 0.55; });
      const route = prev ? routeBetween(prev, [i, j]) : [[i, j] as [number, number]];
      route.forEach(([a, b], k) => { const c = at(a, b); c.litAt = instant ? now : now + 260 + k * 45; if (instant) c.lit = 1; });
      wave = instant ? null : { i, j, start: now };
      start();
    };

    const draw = (now: number) => {
      ctx.clearRect(0, 0, width, height);
      let active = false;

      for (const c of cells) {
        if (now >= c.changeAt) {
          const t = Math.min(1, (now - c.changeAt) / SETTLE_MS);
          const e = 1 - Math.pow(1 - t, 3);
          // A brief overshoot reads as the land being pushed, not faded.
          c.h = c.from + (c.target - c.from) * e + Math.sin(t * Math.PI) * 0.06 * Math.sign(c.target - c.from || 1);
          if (t >= 1) { c.h = c.target; c.changeAt = Infinity; } else active = true;
        } else if (c.changeAt !== Infinity) active = true;
        if (now >= c.litAt) {
          c.lit = Math.min(1, c.lit + 0.08);
          if (c.lit >= 1) c.litAt = Infinity; else active = true;
        } else if (c.litAt !== Infinity) active = true;
      }

      const level = (h: number) => Math.min(LEVELS - 1, Math.floor(h * LEVELS));
      const base = 0; // columns stand on a shared floor so the realm reads as one slab
      for (let s = 0; s < N * 2 - 1; s++) {
        for (let i = Math.max(0, s - N + 1); i <= Math.min(s, N - 1); i++) {
          const j = s - i;
          const c = at(i, j);
          const raw = Math.max(c.h, WATER_LEVEL); // low ground floods into a flat sea
          const h = raw <= WATER_LEVEL ? WATER_LEVEL : Math.round(raw * LEVELS * 2) / (LEVELS * 2); // gentle terracing
          const top = project(i, j, h);
          const floor = project(i, j, base - 0.12);
          const lit = c.lit;
          // Light from the upper left: faces climbing toward it brighten, faces falling away darken.
          const behind = i > 0 ? Math.max(at(i - 1, j).h, WATER_LEVEL) : h;
          const shade = h <= WATER_LEVEL ? 1 : Math.min(1.35, Math.max(0.72, 1 + (h - behind) * 2.2));
          const color = groundColor(h).map((v) => v * shade);
          const surfaceColor = lit > 0 ? mix(color, LIME, lit * 0.82) : color;
          const hw = tileW / 2, hh = tileH / 2;

          // Left face
          ctx.fillStyle = rgb(surfaceColor, 0.62);
          ctx.beginPath();
          ctx.moveTo(top.x - hw, top.y); ctx.lineTo(top.x, top.y + hh); ctx.lineTo(top.x, floor.y + hh); ctx.lineTo(top.x - hw, floor.y);
          ctx.closePath(); ctx.fill();
          // Right face
          ctx.fillStyle = rgb(surfaceColor, 0.42);
          ctx.beginPath();
          ctx.moveTo(top.x + hw, top.y); ctx.lineTo(top.x, top.y + hh); ctx.lineTo(top.x, floor.y + hh); ctx.lineTo(top.x + hw, floor.y);
          ctx.closePath(); ctx.fill();
          // Top
          ctx.fillStyle = rgb(surfaceColor, 1);
          ctx.beginPath();
          ctx.moveTo(top.x, top.y - hh); ctx.lineTo(top.x + hw, top.y); ctx.lineTo(top.x, top.y + hh); ctx.lineTo(top.x - hw, top.y);
          ctx.closePath(); ctx.fill();

          // Contour edges: wherever the land steps down to a lower band.
          const mine = level(c.h);
          const edges: [number, number, [number, number], [number, number]][] = [
            [i - 1, j, [-hw, 0], [0, -hh]],
            [i, j - 1, [0, -hh], [hw, 0]],
            [i + 1, j, [hw, 0], [0, hh]],
            [i, j + 1, [0, hh], [-hw, 0]],
          ];
          ctx.strokeStyle = lit > 0.3 ? "rgba(20,32,21,.55)" : "rgba(196,237,108,.26)";
          ctx.lineWidth = 1;
          for (const [a, b, p, q] of edges) {
            const n = a < 0 || b < 0 || a >= N || b >= N ? -1 : level(at(a, b).h);
            if (n < mine) { ctx.beginPath(); ctx.moveTo(top.x + p[0], top.y + p[1]); ctx.lineTo(top.x + q[0], top.y + q[1]); ctx.stroke(); }
          }

          if (hover && hover[0] === i && hover[1] === j) {
            ctx.strokeStyle = "rgba(196,237,108,.95)"; ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(top.x, top.y - hh); ctx.lineTo(top.x + hw, top.y); ctx.lineTo(top.x, top.y + hh); ctx.lineTo(top.x - hw, top.y);
            ctx.closePath(); ctx.stroke();
          }

          // Decision beacons rise out of the cell they were made on.
          const di = decisions.findIndex(([a, b]) => a === i && b === j);
          if (di !== -1) {
            const age = (decisions.length - 1 - di) / Math.max(1, decisions.length);
            const beam = lift * (0.9 - age * 0.5);
            const g = ctx.createLinearGradient(0, top.y - beam, 0, top.y);
            g.addColorStop(0, "rgba(196,237,108,0)"); g.addColorStop(1, `rgba(214,245,160,${0.9 - age * 0.6})`);
            ctx.fillStyle = g;
            ctx.fillRect(top.x - 1.2, top.y - beam, 2.4, beam);
            ctx.fillStyle = `rgba(232,252,196,${1 - age * 0.6})`;
            ctx.beginPath(); ctx.arc(top.x, top.y, 2.6, 0, Math.PI * 2); ctx.fill();
          }
        }
      }

      // Consequence wave: an isometric ring that travels outward from the latest choice.
      if (wave) {
        const r = (now - wave.start) * WAVE_SPEED;
        const maxR = N * 1.5;
        if (r > maxR) wave = null;
        else {
          active = true;
          const centre = project(wave.i, wave.j, at(wave.i, wave.j).h);
          const fade = 1 - r / maxR;
          ctx.save();
          ctx.translate(centre.x, centre.y);
          ctx.scale(1, 0.5);
          ctx.rotate(Math.PI / 4);
          ctx.strokeStyle = `rgba(196,237,108,${0.55 * fade})`;
          ctx.lineWidth = 1.4;
          const side = r * tileW * 0.7071;
          ctx.strokeRect(-side, -side, side * 2, side * 2);
          ctx.restore();
        }
      }
      return active;
    };

    const tick = (now: number) => {
      if (!visible || document.hidden) { running = false; return; }
      if (now - last >= 30) {
        last = now;
        if (!draw(now)) { running = false; scheduleIdle(); return; }
      }
      frame = requestAnimationFrame(tick);
    };
    function start() {
      if (reduce) { draw(performance.now()); return; }
      if (running) return;
      running = true;
      frame = requestAnimationFrame(tick);
    }
    // When nobody is choosing, the world keeps making small choices of its own.
    function scheduleIdle() {
      window.clearTimeout(idleTimer);
      if (reduce || !visible) return;
      idleTimer = window.setTimeout(() => {
        if (!visible || document.hidden) return;
        const last = decisions[decisions.length - 1] ?? [N / 2, N / 2];
        const angle = Math.random() * Math.PI * 2, step = 4 + Math.random() * 5;
        decide(Math.round(last[0] + Math.cos(angle) * step), Math.round(last[1] + Math.sin(angle) * step), performance.now());
      }, 4200);
    }

    const pick = (clientX: number, clientY: number): [number, number] | null => {
      const rect = surface.getBoundingClientRect();
      const mx = clientX - rect.left, my = clientY - rect.top + lift * 0.4;
      const a = (mx - originX) / (tileW / 2), b = (my - originY) / (tileH / 2);
      const i = Math.round((a + b) / 2), j = Math.round((b - a) / 2);
      return i >= 0 && j >= 0 && i < N && j < N ? [i, j] : null;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const next = pick(e.clientX, e.clientY);
      if (next?.[0] === hover?.[0] && next?.[1] === hover?.[1]) return;
      hover = next;
      root.style.cursor = hover ? "pointer" : "default";
      if (!running) draw(performance.now());
    };
    const onLeave = () => { hover = null; if (!running) draw(performance.now()); };
    const onClick = (e: PointerEvent) => {
      const cell = pick(e.clientX, e.clientY);
      if (!cell) return;
      window.clearTimeout(idleTimer);
      decide(cell[0], cell[1], performance.now());
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      window.clearTimeout(idleTimer);
      decide(3 + Math.floor(Math.random() * (N - 6)), 3 + Math.floor(Math.random() * (N - 6)), performance.now());
    };

    const resize = new ResizeObserver(() => { layout(); draw(performance.now()); });
    const io = new IntersectionObserver(([entry]) => {
      const was = visible;
      visible = entry.isIntersecting;
      if (visible && !was) {
        // The first time the realm is seen, it makes an opening choice so the idea is visible at once.
        if (!decisions.length) decide(Math.round(N * 0.32), Math.round(N * 0.6), performance.now());
        else start();
      }
      if (!visible) window.clearTimeout(idleTimer);
    }, { threshold: 0.25 });
    const onVisibility = () => { if (!document.hidden && visible) start(); };

    layout();
    draw(0);
    resize.observe(root);
    io.observe(root);
    root.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("pointerup", onClick);
    root.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(idleTimer);
      resize.disconnect(); io.disconnect();
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("pointerup", onClick);
      root.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduce]);

  return (
    <figure className={`realm-terrain ${className}`}>
      <div
        ref={host}
        className="realm-terrain-stage"
        role="button"
        tabIndex={0}
        aria-label="Illustration of a realm. Press Enter to make a choice and the terrain reshapes around it."
      >
        <canvas ref={canvas} aria-hidden="true" />
      </div>
      <figcaption>Choose any spot on the land. The world reshapes around your choice, and earlier choices stay on the map.</figcaption>
    </figure>
  );
}
