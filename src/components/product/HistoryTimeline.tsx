import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll } from "motion/react";

export default function HistoryTimeline({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 65%"] });

  return <div ref={ref} className="company-history-timeline relative">
    <div className="company-history-rail" aria-hidden="true">
      <motion.div style={{ scaleY: reduce ? 1 : scrollYProgress }} />
    </div>
    {children}
  </div>;
}
