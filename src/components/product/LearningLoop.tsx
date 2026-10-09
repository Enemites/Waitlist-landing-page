import { useRef } from "react";
import { motion, useScroll } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import ProductReveal from "./ProductReveal";

type Step = { title: string; description: string; metric: string; metricLabel: string };
export default function LearningLoop({ steps }: { steps: Step[] }) {
  const root = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const {scrollYProgress} = useScroll({target:root,offset:["start 75%","end 65%"]});
  return <div ref={root} className="learning-loop">
    <div className="loop-rail" aria-hidden="true"><motion.div style={{scaleY:reduce?1:scrollYProgress}} /></div>
    {steps.map((step,index)=><ProductReveal className="loop-step" key={step.title}>
      <div className="loop-index">0{index+1}</div>
      <h3>{step.title}</h3>
      <p>{step.description}</p>
      <div className="loop-metric"><strong>{step.metric}</strong><span>{step.metricLabel}</span></div>
    </ProductReveal>)}
  </div>;
}
