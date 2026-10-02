import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { Pause, Play } from "lucide-react";
import ProductReveal from "./ProductReveal";

const events = [
  { label: "1. Your Decision", text: "Prioritize the supplier risk before discount pressure." },
  { label: "2. World Reaction", text: "Cash flow stabilizes, but customer trust drops for 2 turns." },
  { label: "3. Mentor Insight", text: "You protected operations while under-explaining the customer cost." },
];
const signals = [
  { label: "Risk Level", value: "82", fill: 82 },
  { label: "Clarity", value: "71", fill: 71 },
  { label: "Pace", value: "4.2s", fill: 42 },
];

/** The existing scenario, illustrated as a causal world rather than a dashboard. */
export default function ScenarioTheatre() {
  const root = useRef<HTMLDivElement>(null);
  const visible = useInView(root, { amount: 0.2 });
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState(0);
  const [paused, setPaused] = useState(false);
  const [foreground, setForeground] = useState(!document.hidden);
  const running = visible && foreground && !paused && !reduce;

  useEffect(() => {
    const update = () => setForeground(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setPhase(current => (current + 1) % 3), 3200);
    return () => window.clearInterval(timer);
  }, [running]);

  return <ProductReveal className="scenario-theatre" delay={0.12}>
    <div ref={root} className="scenario-theatre-inner" data-phase={phase} data-running={running}>
      <div className="scenario-theatre-header">
        <div><p className="scenario-live"><i aria-hidden="true" />Live Scenario</p><h2>Market Crash</h2></div>
        <div className="scenario-clock"><p>Elapsed</p><strong>03:42</strong></div>
        {!reduce && <button type="button" className="scenario-motion-control" aria-label={paused ? "Play scenario animation" : "Pause scenario animation"} onClick={() => setPaused(current => !current)}>
          {paused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}
        </button>}
      </div>

      <div className="scenario-causal-world">
        <div className="scenario-sculpture" aria-hidden="true">
          <img src="/assets/market-crash-world-384.webp" srcSet="/assets/market-crash-world-384.webp 384w, /assets/market-crash-world-576.webp 576w, /assets/market-crash-world.webp 768w" sizes="(max-width:767px) 160px, (max-width:1100px) 220px, 290px" alt="" width="768" height="1152" />
          <div className="scenario-world-ring scenario-world-ring-0" />
          <div className="scenario-world-ring scenario-world-ring-1" />
          <div className="scenario-world-ring scenario-world-ring-2" />
          <div className="scenario-world-signal"><i /></div>
        </div>
        <div className="scenario-reading">
          {events.map((event, index) => <button type="button" key={event.label} className={`scenario-causal-event scenario-causal-event-${index}`} aria-pressed={phase === index} onClick={() => { setPhase(index); setPaused(true); }}>
            <span className="scenario-event-node" aria-hidden="true"><i /></span>
            <span className="scenario-event-label">{event.label}</span>
            <span className="scenario-event-copy">{event.text}</span>
            <span className="scenario-event-progress" aria-hidden="true"><i /></span>
          </button>)}
        </div>
      </div>

      <div className="scenario-instruments">
        {signals.map((signal, index) => <div className={`scenario-instrument scenario-instrument-${index}`} key={signal.label}>
          <div className="scenario-instrument-dial" aria-hidden="true" style={{ background: `conic-gradient(from 220deg, #c4ed6c ${signal.fill * 2.8}deg, #263b34 0deg, #263b34 280deg, transparent 280deg)` }}><i /></div>
          <div><span>{signal.label}</span><strong>{signal.value}</strong></div>
        </div>)}
      </div>
    </div>
  </ProductReveal>;
}
