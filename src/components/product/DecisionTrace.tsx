import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/** Native vector evidence field; it illustrates reasoning without inventing a product screenshot. */
export default function DecisionTrace({ variant = "network" }: { variant?: "network" | "evidence" }) {
  const reduce = useReducedMotion();
  const branches = variant === "network" ? [85, 185, 285, 385] : [115, 235, 355];
  return <div className={`decision-trace trace-${variant}`} aria-hidden="true">
    <svg viewBox="0 0 700 470" fill="none">
      <defs><pattern id={`trace-grid-${variant}`} width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".8" fill="#798b82" opacity=".25" /></pattern></defs>
      <rect width="700" height="470" fill={`url(#trace-grid-${variant})`} />
      {branches.map((y, i) => <g key={y}>
        <path d={`M100 235C240 235 220 ${y} 340 ${y}S480 235 600 235`} stroke="#c4ed6c" opacity=".35" />
        <motion.path d={`M100 235C240 235 220 ${y} 340 ${y}S480 235 600 235`} stroke="#d7f5a2" strokeWidth="2" strokeDasharray="12 480" initial={false} animate={reduce ? undefined : {strokeDashoffset:[480,0]}} transition={{duration:5+i,repeat:Infinity,ease:"linear",delay:i*.7}} />
        <rect x="307" y={y-24} width="68" height="48" rx="7" fill="#15201b" stroke="#314335" />
        <path d={`M322 ${y}l10 8 17-17`} stroke="#c4ed6c" strokeWidth="2" strokeLinecap="round" />
        <circle cx="365" cy={y-14} r="2" fill="#c4ed6c" />
      </g>)}
      <circle cx="100" cy="235" r="30" fill="#121c18" stroke="#c4ed6c" />
      <circle cx="100" cy="235" r="8" fill="#c4ed6c" />
      <rect x="572" y="207" width="56" height="56" rx="14" fill="#c4ed6c" />
      <path d="M587 235l9 9 17-20" stroke="#162314" strokeWidth="2.5" />
      <circle cx="100" cy="235" r="54" stroke="#c4ed6c" strokeDasharray="2 7" opacity=".4" />
      <circle cx="600" cy="235" r="60" stroke="#c4ed6c" opacity=".15" />
    </svg>
  </div>;
}
