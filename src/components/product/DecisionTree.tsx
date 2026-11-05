import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * A decision tree being read. One route is traced at a time, the branches not taken
 * stay visible but quiet. Hovering or focusing an outcome traces its route.
 */

type Node = { id: string; x: number; y: number; parent?: string; depth: number };

const nodes: Node[] = (() => {
  const list: Node[] = [{ id: "r", x: 70, y: 235, depth: 0 }];
  const first = [100, 235, 370];
  const second = [[52, 128], [196, 274], [342, 418]];
  const third = [[30, 74], [112, 146], [182, 216], [258, 292], [334, 362], [404, 440]];
  first.forEach((y, a) => list.push({ id: `a${a}`, x: 235, y, parent: "r", depth: 1 }));
  second.forEach((pair, a) => pair.forEach((y, b) => list.push({ id: `b${a}${b}`, x: 420, y, parent: `a${a}`, depth: 2 })));
  third.forEach((pair, k) => pair.forEach((y, c) => {
    const a = Math.floor(k / 2), b = k % 2;
    list.push({ id: `c${a}${b}${c}`, x: 610, y, parent: `b${a}${b}`, depth: 3 });
  }));
  return list;
})();

const byId = new Map(nodes.map((n) => [n.id, n]));
const leaves = nodes.filter((n) => n.depth === 3);
const curve = (p: Node, c: Node) => `M${p.x} ${p.y}C${p.x + (c.x - p.x) * 0.55} ${p.y} ${c.x - (c.x - p.x) * 0.55} ${c.y} ${c.x} ${c.y}`;
const routeOf = (leaf: string) => {
  const ids = new Set<string>();
  let n = byId.get(leaf);
  while (n) { ids.add(n.id); n = n.parent ? byId.get(n.parent) : undefined; }
  return ids;
};
// A fixed order through the outcomes, so the reading looks deliberate rather than random.
const tour = ["c101", "c210", "c001", "c111", "c200", "c010"];

export default function DecisionTree() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const [step, setStep] = useState(0);
  const [pinned, setPinned] = useState<string | null>(null);
  const active = pinned ?? tour[step % tour.length];
  const route = useMemo(() => routeOf(active), [active]);

  useEffect(() => {
    if (reduce || !inView || pinned) return;
    const t = window.setInterval(() => setStep((s) => s + 1), 3400);
    return () => window.clearInterval(t);
  }, [reduce, inView, pinned]);

  return (
    <div ref={ref} className="decision-tree" aria-hidden="true">
      <svg viewBox="0 0 700 470" fill="none">
        {nodes.filter((n) => n.parent).map((n) => {
          const p = byId.get(n.parent!)!;
          const on = route.has(n.id);
          return (
            <g key={n.id}>
              <motion.path
                d={curve(p, n)}
                stroke={on ? "#c4ed6c" : "#2f4136"}
                strokeWidth={on ? 2 : 1.2}
                strokeDasharray={on ? undefined : "3 5"}
                initial={reduce ? false : { pathLength: 0 }}
                animate={inView || reduce ? { pathLength: 1 } : undefined}
                transition={{ duration: 0.7, delay: reduce ? 0 : n.depth * 0.28, ease: [0.23, 1, 0.32, 1] }}
                style={{ transition: "stroke 420ms ease, stroke-width 420ms ease" }}
              />
              {on && !reduce && (
                <motion.path
                  key={`${active}-${n.id}`}
                  d={curve(p, n)}
                  stroke="#eefcd2"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, pathOffset: 0, opacity: 1 }}
                  animate={{ pathLength: [0, 0.35, 0], pathOffset: [0, 0.3, 1], opacity: [1, 1, 0] }}
                  transition={{ duration: 0.9, delay: (n.depth - 1) * 0.32, ease: "easeInOut" }}
                />
              )}
            </g>
          );
        })}
        {nodes.map((n) => {
          const on = route.has(n.id);
          const leaf = n.depth === 3;
          return (
            <motion.g
              key={n.id}
              initial={reduce ? false : { opacity: 0, scale: 0.4 }}
              animate={inView || reduce ? { opacity: 1, scale: 1 } : undefined}
              transition={{ duration: 0.4, delay: reduce ? 0 : n.depth * 0.28 + 0.35 }}
              style={{ transformOrigin: `${n.x}px ${n.y}px`, transformBox: "view-box" }}
              onPointerEnter={leaf ? () => setPinned(n.id) : undefined}
              onPointerLeave={leaf ? () => setPinned(null) : undefined}
              className={leaf ? "decision-tree-leaf" : undefined}
            >
              {leaf && <circle cx={n.x} cy={n.y} r="16" fill="transparent" />}
              {n.depth === 0 ? (
                <>
                  <circle cx={n.x} cy={n.y} r="26" fill="#0f1a16" stroke="#c4ed6c" strokeOpacity=".5" />
                  <circle cx={n.x} cy={n.y} r="7" fill="#c4ed6c" />
                </>
              ) : (
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={leaf ? 5 : 6.5}
                  fill={on ? "#c4ed6c" : "#0f1a16"}
                  stroke={on ? "#c4ed6c" : "#3a4f40"}
                  style={{ transition: "fill 420ms ease, stroke 420ms ease" }}
                />
              )}
              {leaf && on && (
                <motion.circle
                  key={active}
                  cx={n.x}
                  cy={n.y}
                  r="5"
                  stroke="#c4ed6c"
                  initial={{ r: 5, opacity: 0.9 }}
                  animate={reduce ? { r: 14, opacity: 0.5 } : { r: [5, 26], opacity: [0.9, 0] }}
                  transition={{ duration: 1.4, delay: reduce ? 0 : 0.95, repeat: reduce ? 0 : Infinity, repeatDelay: 0.6 }}
                />
              )}
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}
