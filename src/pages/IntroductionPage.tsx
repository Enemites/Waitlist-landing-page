import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ResponsiveHeader, { novaGlobalNavItems } from "@/components/ResponsiveHeader";
import { useRef } from "react";
import ScrollExpandMedia from "@/components/ui/scroll-expansion-hero";
import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import WaitlistForm from "@/components/WaitlistForm";
import ArenaScene from "@/components/product/ArenaScene";
import SimulationSequence from "@/components/product/SimulationSequence";
import DecisionTrace from "@/components/product/DecisionTrace";
import ProductReveal from "@/components/product/ProductReveal";
import ValueTransformations from "@/components/product/ValueTransformations";
import { ArrowUpRight, Play } from "lucide-react";

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
    copy: "Enemites measures your problem-solving abilities. We accurately record every experience you have. No empty claims.",
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
    href: "https://tiktok.com/@enemites",
    label: "TikTok",
    path: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
  },
  {
    href: "https://www.youtube.com/@enemites",
    label: "YouTube",
    path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  },
  {
    href: "https://x.com/enemites",
    label: "X",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  {
    href: "https://linkedin.com/company/enemites",
    label: "LinkedIn",
    path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.047-1.852-3.047-1.853 0-2.136 1.445-2.136 2.939v5.677H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  },
  {
    href: "https://instagram.com/enemites",
    label: "Instagram",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
  },
];

const IntroductionPage = () => {
  const reduce = useReducedMotion();
  const videoDemoRef = useRef<HTMLDivElement>(null);
  const scrollToVideoDemo = () => videoDemoRef.current?.scrollIntoView({behavior: reduce ? "instant" : "smooth", block:"start"});

  return (
    <div className="product-site arena-product">
      <ResponsiveHeader theme="dark" desktopItems={introDesktopNavItems} mobileItems={novaGlobalNavItems} />
      <main>
        <section className="product-hero">
          <ArenaScene />
          <div className="product-hero-vignette" aria-hidden="true" />
          <div className="product-container hero-content">
            <motion.p className="hero-eyebrow" initial={reduce ? false : {opacity:0}} animate={{opacity:1}} transition={{duration:.7}}>
              Problem-based learning, rebuilt as simulation
            </motion.p>
            <motion.h1 className="product-wordmark" initial={reduce ? false : {opacity:0,transform:"translateY(42px)",clipPath:"inset(0 0 100% 0)"}} animate={{opacity:1,transform:"translateY(0px)",clipPath:"inset(0 0 0% 0)"}} transition={{duration:1.1,ease:[.23,1,.32,1]}}>
              Enem<span>ites</span>
            </motion.h1>
            <ProductReveal className="hero-bottom" delay={.12}>
              <p>The first problem-based learning environment built on world simulations and a superhuman mentor.</p>
              <div className="hero-actions">
                <Button asChild className="product-cta">
                  <a href="#join-waitlist" onClick={e=>{e.preventDefault();document.getElementById('join-waitlist')?.scrollIntoView({behavior:reduce?"instant":"smooth",block:"center"});}}>
                    Join Waitlist <ArrowUpRight aria-hidden="true" size={18} />
                  </a>
                </Button>
                <div className="beta-status"><i aria-hidden="true" />Private beta</div>
              </div>
            </ProductReveal>
            <div className="hero-links">
              <Link to="/arena/about-us#our-mission">Our mission</Link>
              <a href="https://research.enemites.com" target="_blank" rel="noreferrer">Our research</a>
            </div>
          </div>
        </section>

        <section className="product-values product-section">
          <div className="product-container">
            <div className="values-opening">
              <ProductReveal><h2>Fun like a game.<br /><span>Effective like work.</span></h2></ProductReveal>
              <ProductReveal className="intro-preview">
                <button type="button" onClick={scrollToVideoDemo} className="intro-preview-trigger">
                  <img src="/assets/work-1280.webp" srcSet="/assets/work-640.webp 640w, /assets/work-1280.webp 1280w, /assets/work-1920.webp 1920w" sizes="(max-width:767px) 100vw, 52vw" width="1920" height="1080" alt="Enemites experience preview" loading="lazy" decoding="async" />
                  <span className="intro-play"><Play aria-hidden="true" size={22} fill="currentColor" /><span>Watch Intro Video</span></span>
                </button>
              </ProductReveal>
            </div>
            <ValueTransformations values={valueCards} />
          </div>
        </section>

        <SimulationSequence features={simulationFeatures} />

        <section className="product-market product-section">
          <div className="product-container">
            <ProductReveal className="market-heading"><h2>The market has <br /><span>spoken.</span></h2><p>The era of automation and AI orchestration demands a new baseline.</p></ProductReveal>
            <div className="market-quotes">
              {problemSignals.map((signal,index)=><ProductReveal className="market-quote" key={signal.title} delay={index*.08}>
                <div className="market-source"><span>0{index+1}</span><h3>{signal.title}</h3></div>
                <p>"{signal.copy}"</p>
              </ProductReveal>)}
            </div>
          </div>
        </section>

        <section className="product-proof product-section">
          <div className="product-container">
            <ProductReveal className="proof-heading"><h2>A new way to prove your abilities.</h2><p>We're reinventing proof of ability: real evidence of what you can solve, not just what you memorized.</p></ProductReveal>
            <ProductReveal className="proof-network">
              <div className="proof-copy"><span className="proof-number">01</span><h3>{proofFeatures[0].title}</h3><p>{proofFeatures[0].copy}</p></div>
              <DecisionTrace />
            </ProductReveal>
            <ProductReveal className="proof-evidence">
              <div className="proof-evidence-art"><img src={proofFeatures[1].image} alt={proofFeatures[1].alt} loading="lazy" /><div className="evidence-scan" aria-hidden="true" /></div>
              <div className="proof-copy"><span className="proof-number">02</span><h3>{proofFeatures[1].title}</h3><p>{proofFeatures[1].copy}</p></div>
            </ProductReveal>
            <div ref={videoDemoRef} className="product-demo">
              <ScrollExpandMedia mediaType="video" mediaSrc={`https://www.youtube.com/embed/${YOUTUBE_DEMO_VIDEO_ID}`} />
            </div>
          </div>
        </section>

        <section id="join-waitlist" className="product-registration product-section">
          <div className="product-container registration-layout">
            <ProductReveal className="registration-copy">
              <span className="registration-eyebrow">Early Access Registration</span>
              <h2>Ready to <span>join</span>?</h2>
              <p>Join thousands of learners and problem solvers in the next generation Enemites Arena simulation.</p>
              <div className="registration-art registration-threshold" aria-hidden="true"><img src="/assets/waitlist-threshold.webp" alt="" loading="lazy" /></div>
            </ProductReveal>
            <WaitlistForm />
          </div>
        </section>
        <section className="product-endmark" aria-hidden="true"><img src="/assets/logo-384.webp" width="384" height="282" alt="" /></section>
      </main>

      <footer
        id="about-us"
        className="product-footer px-4 py-12 text-[#EDF1EF] sm:px-6 sm:py-20 border-t border-[#23312D]"
      >
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
            <div className="lg:col-span-2">
              <div className="mb-6">
                <h3 className="nova-display mb-3 sm:mb-4 text-xl sm:text-2xl font-medium tracking-normal text-[#EDF1EF] flex items-center gap-2.5">
                  <img src="/assets/logo-128.webp" width="128" height="94" alt="" className="h-6 sm:h-7 w-auto invert" />
                  <span>Enemites</span>
                </h3>
                <p className="max-w-md text-xs sm:text-sm md:text-[15px] font-normal leading-relaxed text-[#EDF1EF]/72">
                  Empowering the next generation of problem solvers and truth
                  seekers with AI-powered learning experiences that adapt to your
                  unique thought.
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5 sm:gap-3">
                {socialLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    aria-label={link.label}
                    className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-white/5 text-[#EDF1EF] transition-colors hover:bg-white/10 hover:text-[#EDF1EF]"
                  >
                    <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d={link.path} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="nova-display mb-3 sm:mb-4 text-base sm:text-lg font-medium tracking-normal text-[#EDF1EF]">
                Quick Links
              </h4>
              <ul className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm md:text-[15px] text-[#EDF1EF]/72">
                <li>
                  <Link to="/arena/about-us" className="transition-colors hover:text-[#EDF1EF]">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/arena/how-it-works" className="transition-colors hover:text-[#EDF1EF]">
                    How It Works
                  </Link>
                </li>
                <li>
                  <a href="mailto:support@enemites.com" className="transition-colors hover:text-[#EDF1EF]">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="nova-display mb-3 sm:mb-4 text-base sm:text-lg font-medium tracking-normal text-[#EDF1EF]">
                Support
              </h4>
              <ul className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm md:text-[15px] text-[#EDF1EF]/72">
                <li>
                  <Link to="/arena/privacy-policy" className="transition-colors hover:text-[#EDF1EF]">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/arena/terms-of-service" className="transition-colors hover:text-[#EDF1EF]">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 sm:mt-12 border-t border-[#23312D] pt-6 sm:pt-8">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <p className="text-xs sm:text-[13px] text-[#9AA6A4]">
                (c) 2025 Enemites. All rights reserved.
              </p>
              <div className="flex gap-6 text-xs sm:text-[13px]">
                <Link to="/arena/privacy-policy" className="text-[#9AA6A4] transition-colors hover:text-[#EDF1EF]">
                  Privacy Policy
                </Link>
                <Link to="/arena/terms-of-service" className="text-[#9AA6A4] transition-colors hover:text-[#EDF1EF]">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default IntroductionPage;
