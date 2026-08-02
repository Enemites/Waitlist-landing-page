import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ResponsiveHeader, { novaGlobalNavItems } from "@/components/ResponsiveHeader";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useRef } from "react";
import ScrollExpandMedia from "@/components/ui/scroll-expansion-hero";
import { motion, useReducedMotion } from "motion/react";

const WAITLIST_FORM_URL = "https://tally.so/r/zxDAyZ";
const YOUTUBE_DEMO_VIDEO_ID = "sga8QDniKls";

const introDesktopNavItems = novaGlobalNavItems.filter((item) => item.label !== "Home");

const valueCards = [
  {
    image: "/assets/fun.png",
    alt: "When effectiveness meets fun",
    title: "Effectiveness meets fun",
    copy: "PBL is effective, but tedious. We make it short, fast, and addictive by cutting it into micro-steps, while forcing reflection like a game.",
  },
  {
    image: "/assets/complex.png",
    alt: "When complexity becomes intuitive",
    title: "Complexity becomes intuitive",
    copy: "Complex concepts broken down. You're guided from confusion to understanding through instant feedback and decision impacts.",
  },
  {
    image: "/assets/degrees.png",
    alt: "When degrees lose to capability",
    title: "Degrees lose to capability",
    copy: "NovaX measures your problem-solving abilities. We accurately record every experience you have. No empty claims.",
  },
];

const simulationFeatures = [
  {
    title: "Adaptive Dynamic Simulation",
    copy: "Dynamic simulation flow personalized for you in real-time.",
    video: "/assets/scene/dynamic%20arena.mp4",
  },
  {
    title: "Personalized Arena",
    copy: "Arena environments and challenges tailored to your capabilities.",
    video: "/assets/scene/arena%20gen.mp4",
  },
  {
    title: "Smartest Superhuman",
    copy: "AI that analyzes and adapts to your responses, actions, and behavior.",
    video: "/assets/scene/ai%20analyze%20behavior.mp4",
  },
];

const problemSignals = [
  {
    title: "World Economic Forum",
    copy: "Problem-solving is the #1 skill needed in the era of automation and AI orchestration.",
  },
  {
    title: "Top LinkedIn Skill",
    copy: "Most sought-after skill by employers across all major industries.",
  },
];

const proofFeatures = [
  {
    title: "AI Transcendent",
    copy: "AI that accesses and analyzes thinking patterns, behavior patterns, decision trees, and capability levels.",
    image: "/assets/AI%20transcendent.png",
    alt: "AI transcendent: thinking, behavior, and decision patterns feeding an AI brain",
  },
  {
    title: "Real Proof Of Capability",
    copy: "Credentials that show what problems you solve, how you solve them, and every decision you make—not paper exam degrees.",
    image: "/assets/real-proof-capability-abstract.svg",
    alt: "Abstract capability proof map with connected evidence blocks",
  },
];

const socialLinks = [
  {
    href: "https://tiktok.com/@novax_arena",
    label: "TikTok",
    path: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
  },
  {
    href: "https://www.youtube.com/@novax-arena",
    label: "YouTube",
    path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  },
  {
    href: "https://x.com/novax_arena",
    label: "X",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  {
    href: "https://linkedin.com/company/scientiax-novax",
    label: "LinkedIn",
    path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.047-1.852-3.047-1.853 0-2.136 1.445-2.136 2.939v5.677H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  },
  {
    href: "https://instagram.com/novaxarena",
    label: "Instagram",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
  },
];

const IntroductionPage = () => {
  useScrollAnimation();
  const reduce = useReducedMotion();
  const videoDemoRef = useRef<HTMLDivElement>(null);

  const scrollToVideoDemo = () => {
    videoDemoRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleUnavailable = () => {
    alert("Not available yet");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.1 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  } as any;

  return (
    <div className="bg-[#0F1117] text-[#E8E4D9]">
      <style>{`
        @keyframes novaXGradientMorph {
          0%, 100% { color: #D97757; -webkit-text-fill-color: #D97757; }
          50% { color: #E8E4D9; -webkit-text-fill-color: #E8E4D9; }
        }
        .nova-gradient-x {
          display: inline-block;
          color: #D97757;
          -webkit-text-fill-color: #D97757;
          animation: novaXGradientMorph 4.8s ease-in-out infinite;
          will-change: color;
        }
      `}</style>

      <ResponsiveHeader
        className="border-b border-white/10 bg-[rgba(15,17,23,0.8)] backdrop-blur-md shadow-none"
        desktopItems={introDesktopNavItems}
        mobileItems={novaGlobalNavItems}
      />

      <main className="relative">
        {/* HERO SECTION */}
        <section className="relative min-h-[100dvh] overflow-hidden bg-[#0F1117] flex items-center pt-24 px-4 sm:px-6 lg:px-8">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.85] mix-blend-screen"
            style={{ backgroundImage: "url(/assets/introduction-arena-bg.jpg)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F1117] via-[#0F1117]/80 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#0F1117] to-transparent" />

          <motion.div 
            className="relative z-10 mx-auto w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="max-w-2xl py-12">
              <p className="nova-mono mb-6 text-[11.5px] font-medium uppercase tracking-[0.18em] text-[#9DA3B4]">
                Problem-based learning, rebuilt as simulation
              </p>
              <h1 className="nova-display text-6xl font-semibold leading-[1.05] tracking-tight text-white md:text-7xl lg:text-[6rem]">
                Nova<span className="nova-gradient-x">X</span>
              </h1>
              
              <p className="mt-8 text-lg font-normal leading-[1.6] text-[#E8E4D9]/80 sm:text-xl max-w-xl">
                The first problem-based learning environment built on world simulations and a superhuman mentor.
              </p>

              <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Button
                  asChild
                  className="h-12 rounded-lg bg-[#D97757] px-8 text-[15px] font-medium text-white hover:bg-[#D97757]/90 hover:-translate-y-[1px] transition-transform active:scale-[0.98]"
                >
                  <a href={WAITLIST_FORM_URL} target="_blank" rel="noreferrer">
                    Join Waitlist
                  </a>
                </Button>
                
                <div className="inline-flex h-12 items-center justify-center gap-2.5 rounded-lg border border-white/10 bg-[rgba(255,255,255,0.06)] px-6 text-sm font-medium text-[#E8E4D9]/90 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10B981]/50" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#10B981]" />
                  </span>
                  Private beta
                </div>
              </div>
              
              <div className="mt-12 flex items-center gap-6 text-[13px] font-medium text-[#9DA3B4]">
                <Link to="/arena/about-us#our-mission" className="hover:text-white transition-colors underline underline-offset-4 decoration-white/20">
                  Our mission
                </Link>
                <a href="https://research.novaxarena.tech" target="_blank" rel="noreferrer" className="hover:text-white transition-colors underline underline-offset-4 decoration-white/20">
                  Our research
                </a>
              </div>
            </div>
          </motion.div>
        </section>

        {/* FUN LIKE A GAME SECTION - BENTO GRID */}
        <section className="bg-[#0F1117] px-4 py-24 sm:px-6 lg:px-8 border-t border-[#1C2030]">
          <div className="mx-auto max-w-6xl">
            <motion.div 
              className="mb-16 text-center max-w-3xl mx-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={itemVariants}
            >
              <h2 className="nova-display text-4xl font-medium leading-[1.1] text-white sm:text-5xl lg:text-6xl">
                Fun like a game.<br/>
                <span className="text-[#D97757]">Effective like work.</span>
              </h2>
            </motion.div>

            <motion.div 
              className="relative nova-media mx-auto aspect-video md:aspect-[21/9] w-full bg-[#1C2030] overflow-hidden rounded-[20px] border border-[#333849] group cursor-pointer"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={itemVariants}
              onClick={scrollToVideoDemo}
            >
              <img
                src="/assets/work.png"
                alt="NovaX experience preview"
                className="h-full w-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-1000 ease-out"
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  variant="outline"
                  onClick={(e) => { e.stopPropagation(); scrollToVideoDemo(); }}
                  className="h-14 rounded-full border border-white/20 bg-black/50 px-8 text-[15px] font-medium text-white backdrop-blur-md hover:bg-[#D97757] hover:border-[#D97757] hover:scale-105 transition-all shadow-2xl flex items-center gap-2"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Watch Intro Video
                </Button>
              </div>
            </motion.div>

            <motion.div 
              className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
            >
              {valueCards.map((card, index) => (
                <motion.div 
                  key={card.title} 
                  variants={itemVariants}
                  className={`flex flex-col overflow-hidden rounded-[20px] border border-[#333849] bg-[#1C2030] ${index === 0 ? 'md:col-span-3 lg:col-span-1' : ''}`}
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-[#0A0B0E] border-b border-[#333849]">
                    <img src={card.image} alt={card.alt} className="h-full w-full object-cover opacity-80 mix-blend-screen" loading="lazy" />
                  </div>
                  <div className="flex flex-col justify-between p-6 sm:p-8 flex-grow">
                    <h3 className="nova-display text-2xl font-medium leading-[1.2] text-white">{card.title}</h3>
                    <p className="mt-4 text-[15px] font-normal leading-[1.6] text-[#E8E4D9]/72">{card.copy}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* SIMULATION FEATURES - STICKY STACK */}
        <section className="bg-[#0A0B0E] px-4 py-24 sm:px-6 lg:px-8 border-y border-[#1C2030]">
          <div className="mx-auto max-w-6xl">
            <motion.div 
              className="mb-20 max-w-2xl"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={itemVariants}
            >
              <h2 className="nova-display text-4xl font-medium leading-[1.1] text-white sm:text-5xl lg:text-6xl">
                Transform your mind<br/>
                in 10 <span className="text-[#D97757]">minutes</span>.
              </h2>
              <p className="mt-6 text-lg font-normal leading-[1.6] text-[#E8E4D9]/72">
                Experience learning from a dynamic world simulation with adaptive AI.
              </p>
            </motion.div>

            <div className="relative">
              {simulationFeatures.map((feature, index) => (
                <div 
                  key={feature.title}
                  className="sticky top-24 flex min-h-[60vh] md:min-h-[70vh] items-center pt-8 pb-16"
                  style={{ zIndex: index }}
                >
                  <div className="w-full rounded-[24px] border border-white/10 bg-[rgba(28,32,48,0.95)] p-6 md:p-12 backdrop-blur-xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8 lg:gap-16 items-center">
                    <div>
                      <p className="nova-mono mb-4 text-[13px] font-medium text-[#D97757]">0{index + 1}</p>
                      <h3 className="nova-display text-3xl md:text-4xl font-medium leading-[1.1] text-white">
                        {feature.title}
                      </h3>
                      <p className="mt-6 text-[15px] md:text-base leading-[1.6] text-[#E8E4D9]/80 max-w-[40ch]">
                        {feature.copy}
                      </p>
                    </div>
                    <div className="aspect-[16/10] overflow-hidden rounded-[16px] border border-white/10 bg-[#0F1117] shadow-inner">
                      <video
                        className="h-full w-full object-cover"
                        autoPlay loop muted playsInline
                        poster="/assets/introduction-arena-bg.jpg"
                      >
                        <source src={feature.video} type="video/mp4" />
                      </video>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PROBLEM SOLVING MATTERS */}
        <section className="bg-[#0F1117] px-4 py-32 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={itemVariants}
            >
              <h2 className="nova-display text-3xl font-medium leading-[1.1] text-white sm:text-4xl md:text-5xl">
                Problem solving <span className="text-[#D97757]">matters</span>.
              </h2>
            </motion.div>

            <motion.div 
              className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-4"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              {problemSignals.map((signal) => (
                <motion.div
                  key={signal.title}
                  variants={itemVariants}
                  className="rounded-[20px] border border-[#333849] bg-[#1C2030] p-8 md:p-10 text-left"
                >
                  <h3 className="nova-display text-xl font-medium text-white">{signal.title}</h3>
                  <p className="mt-4 text-[15px] leading-[1.6] text-[#E8E4D9]/72">
                    {signal.copy}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* PROOF FEATURES - EDITORIAL LAYOUT */}
        <section className="bg-[#0A0B0E] px-4 py-32 sm:px-6 lg:px-8 border-t border-[#1C2030]">
          <div className="mx-auto max-w-[1400px]">
            <motion.div 
              className="mb-32 text-center max-w-3xl mx-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={itemVariants}
            >
              <h2 className="nova-display text-4xl font-medium leading-[1.1] text-white sm:text-5xl lg:text-6xl tracking-tight">
                A new way to prove your abilities.
              </h2>
              <p className="mt-8 text-xl font-normal leading-relaxed text-[#E8E4D9]/60 max-w-2xl mx-auto">
                We're reinventing proof of ability: real evidence of what you can solve, not just what you memorized.
              </p>
            </motion.div>

            <div className="space-y-40">
              {/* Feature 1: AI Transcendent (Left text, Right floating image) */}
              <motion.div
                className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={itemVariants}
              >
                <div className="lg:col-span-5 lg:col-start-2">
                  <div className="inline-flex items-center gap-3 mb-8">
                    <span className="h-[1px] w-8 bg-[#D97757]"></span>
                    <span className="text-sm font-medium tracking-widest text-[#D97757] uppercase">01</span>
                  </div>
                  <h3 className="nova-display text-4xl sm:text-5xl font-medium leading-[1.1] text-white tracking-tight">
                    {proofFeatures[0].title}
                  </h3>
                  <p className="mt-6 text-lg leading-relaxed text-[#E8E4D9]/70 max-w-[36ch]">
                    {proofFeatures[0].copy}
                  </p>
                </div>
                <div className="lg:col-span-5 lg:col-start-7 flex justify-center">
                  <div className="relative w-full max-w-md aspect-[5/4] rounded-[24px] overflow-hidden border border-white/5 bg-[#0A0B0E] shadow-2xl drop-shadow-[0_0_40px_rgba(217,119,87,0.1)] hover:scale-105 hover:shadow-[0_0_60px_rgba(217,119,87,0.15)] transition-all duration-700 ease-out">
                    <img
                      src={proofFeatures[0].image}
                      alt={proofFeatures[0].alt}
                      className="absolute inset-0 w-full h-full object-cover object-[52%_50%] opacity-90 hover:opacity-100 transition-opacity duration-700"
                      loading="lazy"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Feature 2: Real Proof (Center text, massive image below) */}
              <motion.div
                className="flex flex-col items-center text-center pt-12"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={itemVariants}
              >
                <div className="max-w-2xl mb-16">
                  <div className="inline-flex items-center justify-center gap-3 mb-8 w-full">
                    <span className="h-[1px] w-8 bg-[#10B981]"></span>
                    <span className="text-sm font-medium tracking-widest text-[#10B981] uppercase">02</span>
                    <span className="h-[1px] w-8 bg-[#10B981]"></span>
                  </div>
                  <h3 className="nova-display text-4xl sm:text-5xl font-medium leading-[1.1] text-white tracking-tight">
                    {proofFeatures[1].title}
                  </h3>
                  <p className="mt-6 text-lg leading-relaxed text-[#E8E4D9]/70 mx-auto max-w-[42ch]">
                    {proofFeatures[1].copy}
                  </p>
                </div>
                <div className="w-full max-w-5xl relative px-4">
                  <img
                    src={proofFeatures[1].image}
                    alt={proofFeatures[1].alt}
                    className="w-full h-auto max-h-[70vh] object-contain mix-blend-screen opacity-80 hover:opacity-100 transition-opacity duration-700"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0E] via-transparent to-transparent z-10 pointer-events-none" />
                </div>
              </motion.div>
            </div>

            <motion.div
              ref={videoDemoRef}
              className="mt-24"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={itemVariants}
            >
              <ScrollExpandMedia
                mediaType="video"
                mediaSrc={`https://www.youtube.com/embed/${YOUTUBE_DEMO_VIDEO_ID}`}
              />
            </motion.div>

            <motion.div
              className="mt-32 text-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={itemVariants}
            >
              <h2 className="nova-display text-3xl font-medium leading-[1.1] text-white sm:text-4xl md:text-5xl">
                Ready to <span className="text-[#D97757]">join</span>?
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-base font-normal leading-[1.6] text-[#E8E4D9]/72">
                Join thousands of students and train your problem-solving skills
                collaboratively.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button
                  asChild
                  className="h-12 rounded-lg bg-[#D97757] px-8 text-[15px] font-medium text-white hover:bg-[#D97757]/90 hover:-translate-y-[1px] transition-transform active:scale-[0.98]"
                >
                  <a href={WAITLIST_FORM_URL} target="_blank" rel="noreferrer">
                    Join Waitlist
                  </a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer
        id="about-us"
        className="bg-[#0F1117] px-4 py-16 text-[#E8E4D9] sm:px-6 sm:py-20 border-t border-[#1C2030]"
      >
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
            <div className="lg:col-span-2">
              <div className="mb-6">
                <h3 className="nova-display mb-4 text-2xl font-medium tracking-normal text-white">
                  NovaX
                </h3>
                <p className="max-w-md text-[15px] font-normal leading-[1.6] text-[#E8E4D9]/72">
                  Empowering the next generation of problem solvers and truth
                  seekers with AI-powered learning experiences that adapt to your
                  unique thought.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {socialLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    aria-label={link.label}
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1C2030] text-[#E8E4D9] transition-colors hover:bg-[#333849] hover:text-white"
                  >
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d={link.path} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="nova-display mb-4 text-lg font-medium tracking-normal text-white">
                Quick Links
              </h4>
              <ul className="space-y-3 text-[15px] text-[#E8E4D9]/72">
                <li>
                  <Link to="/arena/about-us" className="transition-colors hover:text-white">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/arena/how-it-works" className="transition-colors hover:text-white">
                    How It Works
                  </Link>
                </li>
                <li>
                  <a href="mailto:novaniansupp@gmail.com" className="transition-colors hover:text-white">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="nova-display mb-4 text-lg font-medium tracking-normal text-white">
                Support
              </h4>
              <ul className="space-y-3 text-[15px] text-[#E8E4D9]/72">
                <li>
                  <button type="button" onClick={handleUnavailable} className="transition-colors hover:text-white">
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button type="button" onClick={handleUnavailable} className="transition-colors hover:text-white">
                    Terms of Service
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-[#1C2030] pt-8">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <p className="text-[13px] text-[#9DA3B4]">
                (c) 2025 NovaX. All rights reserved.
              </p>
              <div className="flex gap-6 text-[13px]">
                <button type="button" onClick={handleUnavailable} className="text-[#9DA3B4] transition-colors hover:text-white">
                  Privacy Policy
                </button>
                <button type="button" onClick={handleUnavailable} className="text-[#9DA3B4] transition-colors hover:text-white">
                  Terms of Service
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default IntroductionPage;
