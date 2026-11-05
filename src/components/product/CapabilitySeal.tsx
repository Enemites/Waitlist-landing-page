import { useRef } from "react";
import { motion, useInView, useMotionValue, useSpring, useTransform } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * A capability record drawn as a seal. Each ring is a run of decisions: arc length is
 * how long a problem was worked, lit arcs are problems solved. Deterministic, so the
 * prerendered markup and the hydrated markup match.
 */

function seeded(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CX = 300, CY = 170;
const arc = (r: number, a0: number, a1: number) => {
  const p = (a: number) => `${(CX + Math.cos(a) * r).toFixed(1)} ${(CY + Math.sin(a) * r).toFixed(1)}`;
  return `M${p(a0)}A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${p(a1)}`;
};

const rings = (() => {
  const rand = seeded(2025);
  return Array.from({ length: 7 }, (_, k) => {
    const r = 46 + k * 17;
    const arcs: { d: string; lit: boolean }[] = [];
    let a = rand() * Math.PI * 2;
    const end = a + Math.PI * 2 - 0.12;
    while (a < end - 0.1) {
      const len = Math.min(end - a, 0.18 + rand() * (0.9 - k * 0.06));
      arcs.push({ d: arc(r, a, a + len), lit: rand() < 0.12 + (6 - k) * 0.025 });
      a += len + 0.07 + rand() * 0.1;
    }
    return { r, arcs, dir: k % 2 ? -1 : 1 };
  });
})();

const ticks = Array.from({ length: 96 }, (_, i) => {
  const a = (i / 96) * Math.PI * 2;
  const long = i % 8 === 0;
  const r0 = 157, r1 = long ? 167 : 161;
  return { x1: CX + Math.cos(a) * r0, y1: CY + Math.sin(a) * r0, x2: CX + Math.cos(a) * r1, y2: CY + Math.sin(a) * r1, long };
});

export default function CapabilitySeal({ label }: { label: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });
  const px = useMotionValue(0), py = useMotionValue(0);
  const rx = useSpring(useTransform(py, [-1, 1], [9, -9]), { stiffness: 120, damping: 18 });
  const ry = useSpring(useTransform(px, [-1, 1], [-12, 12]), { stiffness: 120, damping: 18 });
  const show = inView || reduce;

  return (
    <div
      ref={ref}
      className="capability-seal"
      role="img"
      aria-label={label}
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        px.set(((e.clientX - r.left) / r.width - 0.5) * 2);
        py.set(((e.clientY - r.top) / r.height - 0.5) * 2);
      }}
      onPointerLeave={() => { px.set(0); py.set(0); }}
    >
      <motion.svg viewBox="0 0 600 340" fill="none" style={reduce ? undefined : { rotateX: rx, rotateY: ry, transformPerspective: 900 }}>
        <defs>
          <radialGradient id="seal-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#c4ed6c" stopOpacity=".22" />
            <stop offset="1" stopColor="#c4ed6c" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={CX} cy={CY} r="150" fill="url(#seal-glow)" />
        <g className="seal-ticks">
          {ticks.map((t, i) => (
            <motion.line
              key={i}
              x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
              stroke={t.long ? "#c4ed6c" : "#4d6152"}
              strokeOpacity={t.long ? 0.8 : 0.6}
              initial={reduce ? false : { opacity: 0 }}
              animate={show ? { opacity: 1 } : undefined}
              transition={{ duration: 0.2, delay: reduce ? 0 : 0.2 + i * 0.008 }}
            />
          ))}
        </g>
        {rings.map((ring, k) => (
          <g key={k} className={reduce ? undefined : `seal-ring seal-ring-${ring.dir > 0 ? "cw" : "ccw"}`} style={{ animationDuration: `${90 + k * 22}s` }}>
            {ring.arcs.map((a, i) => (
              <motion.path
                key={i}
                d={a.d}
                stroke={a.lit ? "#c4ed6c" : "#3c5143"}
                strokeWidth={a.lit ? 4 : 3}
                strokeLinecap="round"
                initial={reduce ? false : { pathLength: 0 }}
                animate={show ? { pathLength: 1 } : undefined}
                transition={{ duration: 0.5, delay: reduce ? 0 : 0.5 + k * 0.16 + i * 0.03, ease: [0.23, 1, 0.32, 1] }}
              />
            ))}
          </g>
        ))}
        <motion.g
          initial={reduce ? false : { opacity: 0, scale: 0.6 }}
          animate={show ? { opacity: 1, scale: 1 } : undefined}
          transition={{ duration: 0.6, delay: reduce ? 0 : 1.7, ease: [0.23, 1, 0.32, 1] }}
          style={{ transformOrigin: `${CX}px ${CY}px`, transformBox: "view-box" }}
        >
          <circle cx={CX} cy={CY} r="30" fill="#c4ed6c" />
          <image href="/assets/logo-128.webp" x={CX - 15} y={CY - 11} width="30" height="22" />
        </motion.g>
      </motion.svg>
    </div>
  );
}
