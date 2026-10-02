import { lazy, Suspense, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
const KineticValueScene = lazy(() => import("./KineticValueScene"));

type Value = { title:string; copy:string; alt:string };
const kinds = ["steps", "clarity", "evidence"] as const;

function Transformation({ value, index }: { value:Value; index:number }) {
  const sceneRef=useRef<HTMLDivElement>(null);
  const reduce=useReducedMotion();
  // Finish while the sculpture is still just below the viewport center, on every layout.
  const {scrollYProgress}=useScroll({target:sceneRef,offset:["start 95%","center 60%"]});
  const line=useTransform(scrollYProgress,[0,1],[0,1]);
  const entry=reduce?false:{opacity:0,transform:"translateY(28px)"};
  return <article className={`value-transformation transformation-${kinds[index]}`}>
    <div className="transformation-guide" aria-hidden="true">
      <div className="transformation-rule"><motion.i style={{scaleX:reduce?1:line}} /></div>
      <div className="transformation-marker">{kinds.map((kind,i)=><i key={kind} data-current={index===i} />)}</div>
    </div>
    <div className="transformation-composition">
      <motion.div className="transformation-copy" initial={entry} whileInView={{opacity:1,transform:"translateY(0px)"}} viewport={{once:true,amount:.4}} transition={{duration:.7,ease:[.23,1,.32,1]}}>
        <h3>{value.title}</h3>
        <p>{value.copy}</p>
      </motion.div>
      <div ref={sceneRef} className="transformation-apparatus">
        <div className="apparatus-grid" aria-hidden="true" />
        <div className="apparatus-aura" aria-hidden="true" />
        <Suspense fallback={null}><KineticValueScene kind={kinds[index]} progress={scrollYProgress} label={value.alt} /></Suspense>
        <div className="apparatus-brackets" aria-hidden="true"><i /><i /><i /><i /></div>
      </div>
    </div>
  </article>;
}

export default function ValueTransformations({ values }:{values:Value[]}) {
  return <div id="learning-transformations" className="value-transformations">
    {values.map((value,index)=><Transformation key={value.title} value={value} index={index} />)}
  </div>;
}
