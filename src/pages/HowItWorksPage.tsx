import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ResponsiveHeader from "@/components/ResponsiveHeader";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { motion, useReducedMotion } from "motion/react";


const steps = [
  {
    label: "Step 01",
    title: "Enter a living arena",
    description:
      "NovaX starts with a short mission brief, then shapes the simulation around your field, level, and decision context.",
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
    bg: "bg-[#111111]",
  },
  {
    label: "Step 03",
    title: "Reflect with the mentor",
    description:
      "The AI mentor reads your reasoning pattern and follows up with pointed questions instead of generic right-or-wrong feedback.",
    metric: "1:1",
    metricLabel: "review",
    span: "col-span-1",
    bg: "bg-[#111111]",
  },
  {
    label: "Step 04",
    title: "Leave with proof",
    description:
      "Every run becomes a capability artifact: decision traces, before-after growth, and evidence of what you can actually solve.",
    metric: "4",
    metricLabel: "signals",
    span: "col-span-1",
    bg: "bg-[#000000] border border-[#222222]",
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
      "NovaX turns the run into a map of choices, missed paths, and capability growth that can be discussed or shared.",
    items: ["Decision map", "Growth summary", "Reusable capability artifact"],
  },
];

const feedbackRows = [
  ["Input", "Prioritize the supplier risk before discount pressure"],
  ["World", "Cash flow stabilizes, but customer trust drops for 2 turns"],
  ["Mentor", "You protected operations while under-explaining the customer cost"],
];

const HowItWorksPage = () => {
  useScrollAnimation();
  const reduce = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.1 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { 
      opacity: 1, y: 0, 
      transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } 
    }
  } as any;

  return (
    <div className="min-h-screen overflow-hidden bg-[#000000] text-[#E8E4D9]">
      <ResponsiveHeader className="rounded-[18px] border-white/10 bg-[rgb(15_17_23/0.66)] shadow-[0_24px_80px_rgba(0,0,0,0.35)]" />

      <main className="relative">
        {/* HERO SECTION */}
        <section className="relative min-h-[100dvh] overflow-hidden px-4 pt-24 sm:px-6 lg:px-8 flex items-center">
          <div className="absolute inset-0 z-0">
            <img
              src="/assets/simulation-bg.jpg"
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-screen"
              aria-hidden
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/50 via-[#050505]/80 to-[#050505]" />
            <div className="absolute left-1/2 top-0 h-[600px] w-[1000px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(217,119,87,0.15)_0%,transparent_70%)] blur-[80px]" />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(to_bottom,rgba(0,0,0,0),#000000)]" />

          <div className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 pb-16 lg:grid-cols-[1.05fr_0.95fr]">
            <motion.div 
              className="max-w-3xl"
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="mb-4 text-[11.5px] font-medium uppercase tracking-[0.18em] text-[#9DA3B4]">How NovaX works</p>
              <h1 className="nova-display text-5xl font-semibold leading-[1.05] text-[#E8E4D9] md:text-6xl lg:text-[4rem]">
                From confusion to <span className="nova-gradient-text nova-gradient-process">capability</span> in one run.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-[1.6] text-[#E8E4D9]/78 sm:text-lg">
                NovaX turns problem-based learning into a responsive world. You enter a scenario, make decisions,
                observe consequences, then leave with a readable trace of how you think.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  className="h-12 rounded-lg bg-[#D97757] px-6 text-[15px] font-medium text-[#E8E4D9] hover:bg-[#D97757]/90 hover:-translate-y-[1px] transition-transform active:scale-[0.98]"
                >
                  <Link to="/arena#join-waitlist">
                    Join waitlist
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-12 rounded-lg border border-[#222222] bg-transparent px-6 text-[15px] font-medium text-[#E8E4D9] hover:bg-[#111111] hover:text-white hover:-translate-y-[1px] transition-transform active:scale-[0.98]"
                >
                  <Link to="/arena">Back to intro</Link>
                </Button>
              </div>
            </motion.div>

            <motion.aside 
              className="relative w-full rounded-[24px] bg-[rgba(28,32,48,0.4)] p-2 backdrop-blur-xl shadow-2xl mt-12 lg:mt-0 border border-white/5"
              initial={reduce ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="absolute inset-0 rounded-[24px] bg-gradient-to-b from-[#D97757]/10 to-transparent pointer-events-none" />
              
              <div className="relative rounded-[20px] bg-[#000000]/90 px-5 py-6 sm:px-8 sm:py-8 border border-white/5 overflow-hidden flex flex-col h-full">
                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="h-2 w-2 rounded-full bg-[#D97757] animate-pulse shadow-[0_0_8px_#D97757]" />
                      <p className="nova-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[#D97757]">Live Scenario</p>
                    </div>
                    <h2 className="nova-display text-2xl font-medium text-white">Market Crash</h2>
                  </div>
                  <div className="text-right">
                    <p className="nova-mono text-[10px] text-[#9DA3B4] mb-1">Elapsed</p>
                    <p className="nova-mono text-lg text-white">03:42</p>
                  </div>
                </div>

                {/* Event Feed */}
                <div className="space-y-4 mb-8">
                  <div className="rounded-xl bg-[#111111] p-4 sm:p-5 border border-[#222222]/60 shadow-lg mr-4 sm:mr-8 relative group hover:border-[#222222] transition-colors">
                    <p className="nova-mono text-[10px] uppercase tracking-wider text-[#9DA3B4] mb-2">1. Your Decision</p>
                    <p className="text-[14px] sm:text-[15px] leading-[1.5] text-white">Prioritize the supplier risk before discount pressure.</p>
                  </div>

                  <div className="rounded-xl bg-[#050505] p-4 sm:p-5 border border-[#222222]/60 shadow-lg ml-4 sm:ml-8 relative group hover:border-[#222222] transition-colors">
                    <div className="absolute -left-[17px] top-1/2 -translate-y-1/2 w-4 h-[2px] bg-[#222222]/50 hidden sm:block group-hover:bg-[#D97757] transition-colors" />
                    <p className="nova-mono text-[10px] uppercase tracking-wider text-[#D97757]/80 mb-2">2. World Reaction</p>
                    <p className="text-[14px] sm:text-[15px] leading-[1.5] text-[#E8E4D9]/80">Cash flow stabilizes, but customer trust drops for 2 turns.</p>
                  </div>

                  <div className="rounded-xl bg-gradient-to-br from-[#D97757]/10 to-[#111111]/20 p-4 sm:p-5 border border-[#D97757]/30 shadow-[0_0_20px_rgba(217,119,87,0.05)] hover:border-[#D97757]/60 transition-colors">
                    <p className="nova-mono text-[10px] uppercase tracking-wider text-[#D97757] mb-2">3. Mentor Insight</p>
                    <p className="text-[14px] sm:text-[15px] leading-[1.5] text-white font-medium">You protected operations while under-explaining the customer cost.</p>
                  </div>
                </div>

                {/* Metrics */}
                <div className="mt-auto grid grid-cols-3 gap-2 border-t border-white/10 pt-6">
                  {["Risk Level", "Clarity", "Pace"].map((signal, index) => (
                    <div key={signal} className="flex flex-col">
                      <p className="nova-mono text-[10px] uppercase tracking-wider text-[#555D6D] mb-1">{signal}</p>
                      <p className="nova-mono text-xl sm:text-2xl text-white">
                        {index === 0 ? "82" : index === 1 ? "71" : "4.2s"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.aside>
          </div>
        </section>

        {/* DYNAMIC ARENA PROGRESSION */}
        <section className="relative overflow-hidden bg-[#000000] px-4 py-32 sm:px-6 lg:px-8 border-t border-[#111111]">
          {/* Background grid for arena feel */}
          <div 
            className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" 
            style={{ maskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, #000 10%, transparent 100%)", WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, #000 10%, transparent 100%)" }}
          />

          <div className="mx-auto max-w-6xl relative z-10">
            <div className="mb-12 max-w-2xl">
              <p className="nova-mono mb-4 text-[11.5px] font-medium uppercase tracking-[0.18em] text-[#D97757]">The Core Loop</p>
              <h2 className="nova-display text-4xl font-medium leading-[1.1] text-white sm:text-5xl lg:text-6xl">
                Four moves, one capability signal.
              </h2>
            </div>

            <div className="relative mt-24">
              {/* Horizontal laser line on desktop */}
              <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D97757]/80 to-transparent shadow-[0_0_20px_rgba(217,119,87,0.8)] -translate-y-1/2" />
              
              {/* Vertical laser line on mobile */}
              <div className="block lg:hidden absolute top-4 bottom-4 left-[27px] w-[2px] bg-gradient-to-b from-transparent via-[#D97757]/80 to-transparent shadow-[0_0_20px_rgba(217,119,87,0.8)]" />

              <motion.div 
                className="grid grid-cols-1 lg:grid-cols-4 gap-12 lg:gap-6 relative z-10"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
              >
                {steps.map((step, index) => {
                  const isTop = index % 2 === 0;
                  return (
                    <motion.article 
                      key={step.title} 
                      variants={itemVariants}
                      className="group relative flex flex-col pl-16 lg:pl-0 lg:h-[480px]"
                    >
                      {/* Node circle mobile */}
                      <div className="lg:hidden absolute left-[21px] top-6 h-3 w-3 rounded-full bg-[#D97757] shadow-[0_0_15px_#D97757] group-hover:scale-150 transition-transform duration-500" />
                      
                      {/* Node circle desktop */}
                      <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-[#000000] border-2 border-[#D97757] items-center justify-center shadow-[0_0_20px_#D97757] group-hover:bg-[#D97757] group-hover:scale-[1.7] transition-all duration-500 z-20">
                         <div className="h-1.5 w-1.5 rounded-full bg-[#D97757] group-hover:bg-white transition-colors" />
                      </div>

                      {/* Content Mobile */}
                      <div className="block lg:hidden">
                        <p className="nova-mono text-[3.5rem] leading-[0.8] font-bold text-[#111111] group-hover:text-[#D97757]/30 transition-colors duration-500 mb-6">
                          0{index + 1}
                        </p>
                        <h3 className="nova-display text-2xl font-medium text-white mb-3">
                          {step.title}
                        </h3>
                        <p className="text-[15px] leading-[1.6] text-[#E8E4D9]/60 group-hover:text-[#E8E4D9]/90 transition-colors duration-500">
                          {step.description}
                        </p>
                        <div className="mt-6 flex items-baseline gap-2 border-l-2 border-[#D97757]/30 pl-4 group-hover:border-[#D97757] transition-colors duration-500">
                          <span className="nova-mono text-2xl text-white">{step.metric}</span>
                          <span className="text-[11px] uppercase tracking-widest text-[#D97757]">{step.metricLabel}</span>
                        </div>
                      </div>

                      {/* Content Desktop */}
                      <div className={`hidden lg:flex flex-col w-full h-[50%] px-2 transition-transform duration-500 group-hover:-translate-y-3 ${isTop ? 'justify-end pb-12' : 'mt-auto justify-start pt-12'}`}>
                        <div className="relative z-10">
                          <p className={`nova-mono text-[6rem] leading-[0.75] font-bold text-[#111111] group-hover:text-[#D97757]/20 transition-colors duration-500 absolute -z-10 ${isTop ? '-bottom-4 -left-4' : '-top-12 -left-4'}`}>
                            0{index + 1}
                          </p>
                          <h3 className="nova-display text-2xl font-medium text-white mb-3 mt-4">
                            {step.title}
                          </h3>
                          <p className="text-[15px] leading-[1.6] text-[#E8E4D9]/60 group-hover:text-[#E8E4D9]/90 transition-colors duration-500 relative z-10">
                            {step.description}
                          </p>
                          <div className="mt-6 flex items-baseline gap-2 border-l-2 border-[#D97757]/30 pl-4 group-hover:border-[#D97757] transition-colors duration-500 relative z-10">
                            <span className="nova-mono text-2xl text-white">{step.metric}</span>
                            <span className="text-[11px] uppercase tracking-widest text-[#D97757]">{step.metricLabel}</span>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </motion.div>
            </div>
          </div>
        </section>

        {/* SESSION JOURNEY - STICKY SCROLL */}
        <section className="px-4 py-24 sm:px-6 lg:px-8 border-y border-[#111111] bg-[#050505]">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-12 lg:gap-24">
              <div className="lg:sticky lg:top-32 h-fit">
                <h2 className="nova-display text-4xl font-medium leading-[1.1] text-white sm:text-5xl">
                  Before, during, and after the arena.
                </h2>
                <p className="mt-6 text-lg leading-[1.6] text-[#E8E4D9]/72">
                  The session doesn't end when the simulation stops. The real value is the reflection loop that follows.
                </p>
              </div>

              <motion.div 
                className="space-y-16"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
              >
                {journey.map((item, index) => (
                  <motion.article key={item.phase} variants={itemVariants} className="relative group">
                    <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-10">
                      
                      {/* The Hub Node */}
                      <div className="relative shrink-0 flex items-center justify-center h-16 w-16 rounded-[12px] border border-[#222222] bg-[#111111] z-10 group-hover:border-[#D97757] transition-colors duration-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                        {/* Glow Core */}
                        <div className="h-3 w-3 rounded-sm bg-[#D97757] shadow-[0_0_15px_#D97757] group-hover:shadow-[0_0_25px_#D97757] transition-shadow duration-500" />
                        
                        {/* Vertical connection to next node */}
                        {index !== journey.length - 1 && (
                          <div className="absolute top-[63px] -bottom-[4rem] sm:-bottom-[6rem] left-1/2 -translate-x-1/2 w-px bg-[linear-gradient(to_bottom,#D97757_0%,#222222_30%,#222222_70%,#D97757_100%)] opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                        )}
                        
                        {/* Horizontal trace to content */}
                        <div className="hidden sm:block absolute left-[63px] top-1/2 -translate-y-1/2 w-10 h-[1px] bg-gradient-to-r from-[#D97757]/50 to-transparent group-hover:from-[#D97757] transition-colors duration-500" />
                      </div>
                      
                      {/* Interactive Panel Content */}
                      <div className="flex-1 sm:pt-2">
                        <div className="flex items-center gap-4 mb-4">
                           <p className="nova-mono text-[13px] font-medium uppercase tracking-wider text-[#D97757]">{item.phase}</p>
                           <div className="h-px flex-1 bg-gradient-to-r from-[#222222] to-transparent group-hover:from-[#D97757]/30 transition-colors duration-500" />
                        </div>
                        <h3 className="text-2xl font-medium text-white">{item.title}</h3>
                        <p className="mt-4 text-[15px] leading-[1.6] text-[#E8E4D9]/72 max-w-[55ch]">{item.description}</p>
                        
                        <div className="mt-8 flex flex-wrap gap-3">
                          {item.items.map((line) => (
                            <div key={line} className="flex items-center gap-2 rounded-[8px] border border-[#222222] bg-[#111111] px-4 py-2.5 transition-colors duration-500 group-hover:border-[#D97757]/40">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#D97757]/60 group-hover:bg-[#D97757] transition-colors duration-500" />
                              <span className="text-[13px] font-medium text-[#E8E4D9]">{line}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* WHAT YOU KEEP - SPLIT */}
        <section className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl grid-cols-1 overflow-hidden rounded-[20px] border border-[#222222] bg-[#111111] lg:grid-cols-[1fr_1.2fr]">
            <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
              <h2 className="nova-display text-3xl font-medium leading-[1.1] text-white sm:text-4xl">
                Proof that explains the path, not only the score.
              </h2>
              <p className="mt-6 text-[15px] leading-[1.6] text-[#E8E4D9]/72">
                After each run, NovaX records the moments that matter: what you chose, how you acted, what changed, how you explained
                it, and which capability improved.
              </p>
              <div className="mt-10">
                <Button
                  asChild
                  className="h-12 rounded-lg bg-white px-6 text-[15px] font-medium text-[#000000] hover:bg-white/90 hover:-translate-y-[1px] transition-transform active:scale-[0.98]"
                >
                  <Link to="/arena/about-us">Meet the builders</Link>
                </Button>
              </div>
            </div>
            <div className="relative min-h-[300px] lg:min-h-[450px] bg-[#000000] border-t lg:border-t-0 lg:border-l border-[#222222]">
              <img
                src="/assets/capability-proof-abstract.png"
                alt="Abstract NovaX capability path in a dark spatial environment"
                className="absolute inset-0 h-full w-full object-cover mix-blend-screen opacity-60"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-transparent to-[#111111]/20" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HowItWorksPage;

