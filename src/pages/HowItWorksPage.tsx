import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ResponsiveHeader from "@/components/ResponsiveHeader";
import ProductReveal from "@/components/product/ProductReveal";
import LearningLoop from "@/components/product/LearningLoop";
import ScenarioTheatre from "@/components/product/ScenarioTheatre";
import { Check } from "lucide-react";


const steps = [
  {
    label: "Step 01",
    title: "Enter a living arena",
    description:
      "Enemites starts with a short mission brief, then shapes the simulation around your field, level, and decision context.",
    metric: "03 min",
    metricLabel: "briefing",
    span: "col-span-1 md:col-span-2 md:row-span-2",
    bg: "bg-[linear-gradient(135deg,rgba(217,119,87,0.12)_0%,rgba(28,32,48,0.5)_100%)]",
  },
  {
    label: "Step 02",
    title: "Make real decisions",
    description:
      "You choose actions under pressure. The world responds to timing, trade-offs, priorities, and how clearly you explain the move.",
    metric: "12+",
    metricLabel: "branches",
    span: "col-span-1 md:col-span-2",
    bg: "bg-[#E8E3D8]",
  },
  {
    label: "Step 03",
    title: "Reflect with the mentor",
    description:
      "The AI mentor reads your reasoning pattern and follows up with pointed questions instead of generic right-or-wrong feedback.",
    metric: "1:1",
    metricLabel: "review",
    span: "col-span-1",
    bg: "bg-[#E8E3D8]",
  },
  {
    label: "Step 04",
    title: "Leave with proof",
    description:
      "Every run becomes a capability artifact: decision traces, before-after growth, and evidence of what you can actually solve.",
    metric: "4",
    metricLabel: "signals",
    span: "col-span-1",
    bg: "bg-[#F5F2EB] border border-[#D5D0C4]",
  },
];

const journey = [
  {
    phase: "Before",
    title: "A quest replaces the chapter",
    description:
      "You choose a challenge with constraints, stakes, and a reason to care. The session opens with enough context to act fast.",
    items: ["Personalized arena difficulty", "Skill signals made visible", "Short mission brief"],
  },
  {
    phase: "During",
    title: "The world reacts to your moves",
    description:
      "Each screen asks for action. Consequences stack into a scenario that tests how you reason when the answer is not obvious.",
    items: ["Branching micro-decisions", "Contextual mentor prompts", "Scenario state that changes"],
  },
  {
    phase: "After",
    title: "Your thinking becomes readable",
    description:
      "Enemites turns the run into a map of choices, missed paths, and capability growth that can be discussed or shared.",
    items: ["Decision map", "Growth summary", "Reusable capability artifact"],
  },
];

const HowItWorksPage = () => {
  return <div className="product-site how-product">
    <ResponsiveHeader theme="dark" />
    <main>
      <section className="how-product-hero product-section">
        <div className="product-container how-hero-layout">
          <ProductReveal className="how-hero-copy">
            <p className="product-eyebrow">How Enemites works</p>
            <h1>From confusion to <span>capability</span> in one run.</h1>
            <p>Enemites turns problem-based learning into a responsive world. You enter a scenario, make decisions, observe consequences, then leave with a readable trace of how you think.</p>
            <div className="how-hero-actions">
              <Button asChild className="product-cta"><Link to="/arena#join-waitlist">Join waitlist</Link></Button>
              <Button asChild variant="outline" className="product-secondary"><Link to="/arena">Back to intro</Link></Button>
            </div>
          </ProductReveal>
          <ScenarioTheatre />
        </div>
      </section>
      <section className="product-core product-section">
        <div className="product-container">
          <ProductReveal className="core-heading"><p className="product-eyebrow">The Core Loop</p><h2>Four moves, one capability signal.</h2></ProductReveal>
          <LearningLoop steps={steps} />
        </div>
      </section>
      <section className="product-journey product-section">
        <div className="product-container journey-layout">
          <ProductReveal className="journey-heading"><h2>Before, during, and after the arena.</h2><p>The session doesn't end when the simulation stops. The real value is the reflection loop that follows.</p><div className="journey-orbits" aria-hidden="true"><i /><i /><i /><b /></div></ProductReveal>
          <div className="journey-stages">{journey.map((item,index)=><ProductReveal className="journey-stage" key={item.phase} delay={index*.06}>
            <span>{item.phase}</span><h3>{item.title}</h3><p>{item.description}</p><ul>{item.items.map(line=><li key={line}><Check size={15} aria-hidden="true" />{line}</li>)}</ul>
          </ProductReveal>)}</div>
        </div>
      </section>
      <section className="product-keep product-section">
        <div className="product-container keep-layout">
          <ProductReveal className="keep-copy"><h2>Proof that explains the path, not only the score.</h2><p>After each run, Enemites records the moments that matter: what you chose, how you acted, what changed, how you explained it, and which capability improved.</p><Button asChild className="product-cta"><Link to="/arena/about-us">Meet the builders</Link></Button></ProductReveal>
          <ProductReveal className="keep-art"><img src="/assets/capability-proof-abstract.png" alt="Abstract Enemites capability path in a dark spatial environment" loading="lazy" /></ProductReveal>
        </div>
      </section>
    </main>
  </div>;
};
export default HowItWorksPage;
