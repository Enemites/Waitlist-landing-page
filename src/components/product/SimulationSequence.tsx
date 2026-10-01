import { useRef, useState, useEffect } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";

type Feature = { title: string; copy: string; video: string };
const compactViewport = () => window.matchMedia("(max-height: 680px), (max-width: 767px) and (max-height: 740px)").matches;
export default function SimulationSequence({ features }: { features: Feature[] }) {
  const ref = useRef<HTMLElement>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const progress = useTransform(scrollYProgress, [0, 1], [0.04, 1]);
  useMotionValueEvent(scrollYProgress, "change", p => {
    if (reduce || compactViewport()) return;
    const next = Math.min(features.length - 1, Math.floor(p * features.length));
    setActive(previous => previous === next ? previous : next);
  });
  useEffect(() => {
    videos.current.forEach((video, index) => {
      if (!video) return;
      if (index === active && !reduce) void video.play().catch(() => {});
      else video.pause();
    });
  }, [active, reduce]);
  const jump = (index: number) => {
    if (reduce || compactViewport()) { setActive(index); return; }
    const node = ref.current;
    if (!node) return;
    const top = node.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + (node.offsetHeight - window.innerHeight) * ((index + 0.1) / features.length), behavior: reduce ? "instant" : "smooth" });
  };
  return <section ref={ref} className="simulation-sequence product-section" aria-label="Simulation features">
    <div className="sequence-sticky">
      <div className="sequence-heading">
        <h2>Transform your mind<br />in 10 <span>minutes</span>.</h2>
        <p>Experience learning from a dynamic world simulation with adaptive AI.</p>
      </div>
      <div className="sequence-layout">
        <div className="sequence-phases">
          {features.map((feature, index) => <button type="button" key={feature.title} className={`sequence-phase ${active === index ? "is-active" : ""}`} onClick={() => jump(index)} aria-pressed={active === index}>
            <span className="sequence-index"><span>0{index + 1}</span><span>Phase</span></span>
            <span className="sequence-phase-content"><strong>{feature.title}</strong><span>{feature.copy}</span></span>
          </button>)}
        </div>
        <div className="sequence-screen">
          <div className="screen-chrome" aria-hidden="true"><i /><i /><i /><span /><b /></div>
          <div className="sequence-videos">
            {features.map((feature, index) => <motion.div key={feature.video} className="sequence-video" data-active={active === index} initial={false} animate={{ opacity: active === index ? 1 : 0, transform: active === index || reduce ? "translateY(0px)" : "translateY(16px)" }} transition={{duration:0.3,ease:[0.23,1,0.32,1]}}>
              <video ref={el => { videos.current[index] = el; }} muted loop playsInline preload="metadata" poster="/assets/introduction-arena-bg.jpg" aria-label={feature.title}>
                <source src={feature.video} type="video/mp4" />
              </video>
            </motion.div>)}
          </div>
          <div className="sequence-progress" aria-hidden="true"><motion.div style={{scaleX: reduce ? 1 : progress}} /></div>
        </div>
      </div>
    </div>
  </section>;
}
