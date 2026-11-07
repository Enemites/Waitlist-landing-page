/*
 * Drawing helpers shared by the Casual worlds: a seeded random source (so prerender and hydration
 * match), layered horizon lines, scattered particles, and pictogram figures posed by their joints.
 * Every world is drawn on a 1200 x 1000 canvas and shown with "slice"; keep subjects inside
 * x 330-870, y 170-830 so a 9:16 reel, a 4:3 card and a wide portal all frame them.
 */
import type { ReactNode } from "react";

export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Ridge = { d: string; at: (x: number) => number };

/** A horizon line from layered sines. "peaks" folds them for sharp summits. */
export function ridge(seed: number, base: number, amp: number, kind: "soft" | "peaks" = "soft", wave = 1): Ridge {
  const random = seeded(seed);
  const parts = [0, 1, 2].map(i => ({ f: (0.004 + random() * 0.003) * (i + 1) * wave, p: random() * Math.PI * 2, w: [0.55, 0.3, 0.15][i] }));
  const at = (x: number) => {
    let v = 0;
    for (const part of parts) {
      const s = Math.sin(x * part.f + part.p);
      v += part.w * (kind === "peaks" ? 1 - Math.abs(s) * 2 : s);
    }
    return base - amp * v;
  };
  let d = "M-20 1000";
  for (let x = -20; x <= 1220; x += 12) d += `L${x} ${at(x).toFixed(1)}`;
  return { d: `${d}L1220 1000Z`, at };
}

export function particles(seed: number, count: number, box: [number, number, number, number]) {
  const random = seeded(seed);
  return Array.from({ length: count }, () => ({
    x: Math.round(box[0] + random() * (box[2] - box[0])),
    y: Math.round(box[1] + random() * (box[3] - box[1])),
    r: +(0.8 + random() * 2.2).toFixed(2),
    o: +(0.35 + random() * 0.6).toFixed(2),
    delay: -Math.round(random() * 9000),
    dur: Math.round(7000 + random() * 8000),
  }));
}

type P = [number, number];
export type Pose = { head: P; neck: P; hip: P; elbowL: P; handL: P; elbowR: P; handR: P; kneeL: P; footL: P; kneeR: P; footR: P };

/** Poses in figure space: the hip is the origin, up is negative y, a standing figure is about 120 tall. */
export const poses = {
  stand: { head: [0, -70], neck: [0, -48], hip: [0, 0], elbowL: [-12, -28], handL: [-14, -8], elbowR: [12, -28], handR: [14, -8], kneeL: [-6, 25], footL: [-9, 52], kneeR: [6, 25], footR: [9, 52] },
  ready: { head: [10, -60], neck: [6, -40], hip: [0, 0], elbowL: [-10, -24], handL: [4, -12], elbowR: [22, -26], handR: [30, -10], kneeL: [-14, 20], footL: [-26, 46], kneeR: [16, 18], footR: [14, 46] },
  leap: { head: [16, -64], neck: [8, -44], hip: [0, 0], elbowL: [26, -40], handL: [42, -58], elbowR: [-18, -30], handR: [-36, -22], kneeL: [28, 8], footL: [54, 14], kneeR: [-16, 22], footR: [-38, 10] },
  hang: { head: [0, -70], neck: [0, -48], hip: [2, 0], elbowL: [-10, -74], handL: [-6, -96], elbowR: [12, -74], handR: [8, -96], kneeL: [-4, 24], footL: [6, 46], kneeR: [10, 22], footR: [22, 40] },
  pull: { head: [0, -70], neck: [0, -48], hip: [0, 0], elbowL: [-12, -30], handL: [-14, -10], elbowR: [14, -64], handR: [24, -84], kneeL: [-7, 25], footL: [-12, 52], kneeR: [7, 25], footR: [13, 52] },
  cheer: { head: [0, -70], neck: [0, -50], hip: [0, 0], elbowL: [-16, -66], handL: [-26, -86], elbowR: [16, -66], handR: [26, -86], kneeL: [-10, 18], footL: [-18, 34], kneeR: [12, 16], footR: [22, 32] },
  throw: { head: [-8, -66], neck: [-6, -46], hip: [0, 0], elbowL: [16, -40], handL: [32, -46], elbowR: [-24, -58], handR: [-38, -72], kneeL: [-14, 22], footL: [-28, 48], kneeR: [14, 24], footR: [28, 48] },
  crouch: { head: [16, -48], neck: [8, -32], hip: [0, 0], elbowL: [20, -20], handL: [32, -28], elbowR: [14, -14], handR: [26, -18], kneeL: [20, 8], footL: [8, 26], kneeR: [-4, 16], footR: [-18, 26] },
  walk: { head: [4, -70], neck: [2, -48], hip: [0, 0], elbowL: [-12, -28], handL: [-18, -10], elbowR: [12, -30], handR: [20, -14], kneeL: [-10, 24], footL: [-18, 50], kneeR: [12, 24], footR: [14, 50] },
  swim: { head: [-70, -8], neck: [-48, -4], hip: [0, 0], elbowL: [-72, 10], handL: [-94, 6], elbowR: [-66, -16], handR: [-88, -22], kneeL: [26, 4], footL: [52, -4], kneeR: [24, 10], footR: [50, 16] },
} satisfies Record<string, Pose>;

/** A pictogram person: round-capped strokes and a round head. */
export function Figure({ pose, x, y, s = 1, color, width = 13, flip = false, className, children }: { pose: Pose; x: number; y: number; s?: number; color: string; width?: number; flip?: boolean; className?: string; children?: ReactNode }) {
  const p = (pt: P) => `${pt[0]} ${pt[1]}`;
  const d = `M${p(pose.neck)}L${p(pose.hip)}M${p(pose.neck)}L${p(pose.elbowL)}L${p(pose.handL)}M${p(pose.neck)}L${p(pose.elbowR)}L${p(pose.handR)}M${p(pose.hip)}L${p(pose.kneeL)}L${p(pose.footL)}M${p(pose.hip)}L${p(pose.kneeR)}L${p(pose.footR)}`;
  return <g className={className} transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
    <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
    <circle cx={pose.head[0]} cy={pose.head[1]} r={width * 0.95} fill={color} />
    {children}
  </g>;
}
