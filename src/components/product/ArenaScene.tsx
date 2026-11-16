import { useEffect, useRef } from "react";

import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * The hero is a way into another world: a black hole of lime light, rendered on the GPU. Arms of gas
 * spiral in and keep changing shape, bend around the horizon and feed a thin photon ring with a bright
 * spot travelling round it. On load the camera pushes in from far away while the vortex spins up.
 * Pointer input shifts the view a little; it never changes page state. Without WebGL, the CSS
 * background behind the canvas stands in.
 */

const VERT = `attribute vec2 a; void main() { gl_Position = vec4(a, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform vec2 uFocus;
uniform float uTime;
uniform float uIntro;

const vec3 INK = vec3(0.031, 0.055, 0.063);
const vec3 DEEP = vec3(0.045, 0.105, 0.03);
const vec3 NEON = vec3(0.83, 1.0, 0.26);
const vec3 HOT = vec3(0.97, 1.0, 0.82);
const float HORIZON = 0.1;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float noise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(
    mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
    f.z);
}
float fbm4(vec3 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; }
  return s;
}
float fbm5(vec3 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { s += a * noise(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; }
  return s;
}

// The gas: spiral arms of domain-warped noise, turning and drifting inward without end.
float gas(float r, float a, float t) {
  float lr = log(r);
  float s = a - lr * 1.25 + t * 0.21;
  vec3 q = vec3(cos(s) * 1.15, sin(s) * 1.15, lr * 1.3 - t * 0.6);
  vec2 w = vec2(fbm4(q + vec3(1.3, 4.1, t * 0.06)), fbm4(q + vec3(7.2, 2.4, 1.7 - t * 0.05)));
  return fbm5(q * 1.5 + vec3(w * 2.4, 0.0));
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  float ease = 1.0 - pow(1.0 - uIntro, 3.0);
  vec2 p = (frag - uFocus) / uRes.y * mix(2.6, 1.0, ease);
  float r = length(p);
  float a = atan(p.y, p.x);
  float t = uTime + ease * 5.0;
  // Light bends round the hole: space near the horizon is drawn in toward it.
  float rl = sqrt(max(r * r - HORIZON * HORIZON * 0.45, 1e-5));
  float f = gas(rl, a, t);

  float heat = smoothstep(0.55, HORIZON * 1.2, r);
  float bright = smoothstep(0.45, 0.85, f);
  vec3 col = mix(INK * 0.45, DEEP, smoothstep(0.25, 0.7, f));
  col += NEON * pow(bright, 2.0) * (1.55 + heat * 0.9);
  col += HOT * pow(bright, 5.0) * (0.75 + heat * 0.8);
  col *= smoothstep(HORIZON * 0.75, HORIZON * 1.2, r);
  col *= mix(0.22, 1.0, smoothstep(1.55, 0.25, r));

  // The photon ring: a bright spot travels round it, and a faint lensed echo sits just outside.
  float d = abs(r - HORIZON);
  float beam = 0.72 + 0.42 * cos(a - 2.5 - t * 0.55);
  col += mix(NEON, vec3(1.0), 0.5) * exp(-d * 70.0) * 1.3 * beam;
  col += HOT * exp(-d * 190.0) * 0.6 * beam;
  col += NEON * exp(-abs(r - HORIZON * 1.6) * 80.0) * 0.06;

  col *= smoothstep(0.0, 0.4, uIntro);
  col = 1.0 - exp(-col * 1.3);
  gl_FragColor = vec4(max(col, INK), 1.0);
}`;

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
    const gl = surface.getContext("webgl", { antialias: false, alpha: false, depth: false, powerPreference: "high-performance" });
    if (!gl) return;
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };
    const vertex = compile(gl.VERTEX_SHADER, VERT), fragment = compile(gl.FRAGMENT_SHADER, FRAG);
    const program = gl.createProgram()!;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const attribute = gl.getAttribLocation(program, "a");
    gl.enableVertexAttribArray(attribute);
    gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(program, "uRes");
    const uFocus = gl.getUniformLocation(program, "uFocus");
    const uTime = gl.getUniformLocation(program, "uTime");
    const uIntro = gl.getUniformLocation(program, "uIntro");

    const animate = !reduce;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    // The gas is soft, so it is rendered below CSS resolution and scaled up; slow GPUs go lower still.
    let quality = 0.8;
    let width = 0, height = 0, fx = 0.68, fy = 0.5;
    let frame = 0, visible = true, start = 0, last = 0, spent = 0, drawn = 0, gap = 0;
    let targetX = 0, targetY = 0, px = 0, py = 0;

    const applySize = () => {
      const scale = Math.min(1, (window.devicePixelRatio || 1) * quality);
      surface.width = Math.max(1, Math.round(width * scale));
      surface.height = Math.max(1, Math.round(height * scale));
      gl.viewport(0, 0, surface.width, surface.height);
    };
    const draw = (time: number) => {
      if (!start) start = time;
      const elapsed = animate ? (time - start) / 1000 : 0;
      px += (targetX - px) * 0.04;
      py += (targetY - py) * 0.04;
      const w = surface.width, h = surface.height;
      gl.uniform2f(uRes, w, h);
      gl.uniform2f(uFocus, w * fx + px * h * 0.025, h * (1 - fy) - py * h * 0.025);
      gl.uniform1f(uTime, elapsed);
      gl.uniform1f(uIntro, animate ? Math.min(1, elapsed / 2.8) : 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const resize = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width;
      height = entry.contentRect.height;
      const style = getComputedStyle(host);
      fx = readVar(style, "--realm-x", 0.68);
      fy = readVar(style, "--realm-y", 0.5);
      applySize();
      if (!animate) draw(0);
    });
    const tick = (time: number) => {
      if (visible && !document.hidden && time - last >= gap) {
        // Frames slower than ~40 a second step the resolution down until they are not.
        if (last && time - last < 1000) { spent += time - last; drawn++; }
        if (drawn === 20) {
          if (spent / drawn > 24 && quality > 0.35) { quality = Math.max(0.35, quality * 0.75); applySize(); }
          // Without a usable GPU, hold each frame for a while rather than tie up the page.
          else if (spent / drawn > 70) gap = 400;
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
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, [reduce]);

  return (
    <div ref={root} className={`arena-scene ${className}`} aria-hidden="true">
      <canvas ref={canvas} className="arena-scene-field" />
    </div>
  );
}
