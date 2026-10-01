import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

export default function ProductReveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return <motion.div className={className} initial={reduce ? false : {opacity:0,transform:"translateY(28px)"}} whileInView={{opacity:1,transform:"translateY(0px)"}} viewport={{once:true,amount:0.12}} transition={{duration:0.65,delay,ease:[0.23,1,0.32,1]}}>{children}</motion.div>;
}
