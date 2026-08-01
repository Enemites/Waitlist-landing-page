import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ResponsiveHeader, { novaGlobalNavItems } from "@/components/ResponsiveHeader";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useRef } from "react";
import ScrollExpandMedia from "@/components/ui/scroll-expansion-hero";

const WAITLIST_FORM_URL = "https://tally.so/r/zxDAyZ";
const YOUTUBE_DEMO_VIDEO_ID = "sga8QDniKls";

const introDesktopNavItems = novaGlobalNavItems.filter((item) => item.label !== "Home");

const valueCards = [
  {
    image: "/assets/fun.png",
    alt: "When effectiveness meets fun",
    title: "when effectiveness meets fun",
    copy:
      "PBL has proven to be effective, but tedious. We make it short, fast, and addictive by cutting it down to many steps, but it's still effective by making you reflect on the experience, like a game.",
  },
  {
    image: "/assets/complex.png",
    alt: "When complexity becomes intuitive",
    title: "when complexity becomes intuitive",
    copy:
      "Complex concepts are broken down into clear micro-steps. You're guided from confusion to understanding through examples, instant feedback, decision impacts, and exercises that feel natural: one screen, one simple step.",
    reverse: true,
  },
  {
    image: "/assets/degrees.png",
    alt: "When degrees lose to capability",
    title: "when degrees lose to capability",
    copy:
      "NovaX measures your problem-solving abilities, regardless of your unique approach. We accurately record every experience you have. No empty claims.",
  },
];

const simulationFeatures = [
  {
    title: "Adaptive Dynamic Simulation",
    copy: "Dynamic simulation flow personalized for you-realtime.",
    video: "/assets/scene/dynamic%20arena.mp4",
    delay: "0.2s",
  },
  {
    title: "Personalized Arena",
    copy: "Arena environments and challenges personalized to your capabilities.",
    video: "/assets/scene/arena%20gen.mp4",
    delay: "0.3s",
  },
  {
    title: "Smartest Superhuman",
    copy:
      "AI that analyzes and adapts to your responses, how you act, and who you are in real time.",
    video: "/assets/scene/ai%20analyze%20behavior.mp4",
    delay: "0.4s",
  },
];

const problemSignals = [
  {
    title: "WORLD ECONOMIC FORUM",
    copy:
      "Problem-solving is the #1 skill needed in the era of automation and AI orchestrations.",
  },
  {
    title: "TOP LINKEDIN SKILL",
    copy: "Most sought-after skill by employers across all industries.",
  },
];

const proofFeatures = [
  {
    title: "AI TRANSCENDENT",
    copy:
      "AI that accesses and analyzes thinking patterns, behavior patterns, decision trees, and capability levels.",
    image: "/assets/AI%20transcendent.png",
    alt: "AI transcendent: thinking, behavior, and decision patterns feeding an AI brain",
    delay: "0.4s",
  },
  {
    title: "GET REAL PROOF OF YOUR CAPABILITIES",
    copy:
      "Credentials that show what problems you solve, how you solve them, and every decision you make, not paper exam degrees.",
    image: "/assets/real-proof-capability-abstract.svg",
    alt: "Abstract capability proof map with connected evidence blocks",
    delay: "0.55s",
  },
];

const socialLinks = [
  {
    href: "https://tiktok.com/@novax_arena",
    label: "TikTok",
    path:
      "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
  },
  {
    href: "https://www.youtube.com/@novax-arena",
    label: "YouTube",
    path:
      "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  },
  {
    href: "https://x.com/novax_arena",
    label: "X",
    path:
      "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  {
    href: "https://linkedin.com/company/scientiax-novax",
    label: "LinkedIn",
    path:
      "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.047-1.852-3.047-1.853 0-2.136 1.445-2.136 2.939v5.677H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  },
  {
    href: "https://instagram.com/novaxarena",
    label: "Instagram",
    path:
      "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
  },
];

const IntroductionPage = () => {
  useScrollAnimation();

  const videoDemoRef = useRef<HTMLDivElement>(null);

  const scrollToVideoDemo = () => {
    videoDemoRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleUnavailable = () => {
    alert("Not available yet");
  };

  return (
    <div className="bg-[var(--nova-void)] text-[var(--nova-bone)]">
      <style>{`
        @keyframes novaXGradientMorph {
          0%, 100% {
            color: var(--nova-brand);
            -webkit-text-fill-color: var(--nova-brand);
          }
          50% {
            color: var(--nova-bone);
            -webkit-text-fill-color: var(--nova-bone);
          }
        }

        .nova-landing-gradient {
          --nova-gradient-from: var(--nova-brand);
          --nova-gradient-to: var(--nova-bone);
          background-image: linear-gradient(
            45deg,
            var(--nova-gradient-from) 0%,
            var(--nova-gradient-to) 24%,
            var(--nova-gradient-from) 50%,
            var(--nova-gradient-to) 76%,
            var(--nova-gradient-from) 100%
          );
          background-size: 240% 100%;
          background-repeat: no-repeat;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: nova-gradient-shift 10s ease-in-out infinite;
          will-change: background-position;
        }

        .nova-brand-button {
          background: var(--nova-brand);
          color: var(--nova-bone);
          border: none;
          border-radius: 8px;
          padding: 12px 24px;
          font-family: Inter, system-ui, sans-serif;
          font-weight: 500;
          font-size: 15px;
          line-height: 1.3;
        }

        .nova-void-button {
          background: var(--nova-void);
          color: var(--nova-bone);
          border: 0.5px solid var(--nova-surface);
          border-radius: 8px;
          padding: 12px 24px;
          font-family: Inter, system-ui, sans-serif;
          font-weight: 500;
          font-size: 15px;
          line-height: 1.3;
        }

        .nova-card {
          background: var(--nova-surface);
          border: 0.5px solid var(--nova-divider);
          border-radius: 12px;
        }

        .nova-gradient-brand-void {
          --nova-gradient-from: var(--nova-brand);
          --nova-gradient-to: var(--nova-void);
        }

        .nova-gradient-x {
          display: inline-block;
          color: var(--nova-brand);
          -webkit-text-fill-color: var(--nova-brand);
          animation: novaXGradientMorph 4.8s ease-in-out infinite;
          will-change: color;
        }

        .nova-media {
          border: 0.5px solid var(--nova-divider);
          border-radius: 12px;
          overflow: hidden;
        }
      `}</style>

      <ResponsiveHeader
        className="border-b border-white/[0.08] bg-[rgba(15,17,23,0.6)] shadow-none"
        desktopItems={introDesktopNavItems}
        mobileItems={novaGlobalNavItems}
      />

      <section className="relative min-h-screen overflow-hidden bg-[var(--nova-void)]">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-90 [filter:saturate(0.74)_sepia(0.06)_hue-rotate(5deg)_brightness(1.02)_contrast(1.18)]"
          style={{
            backgroundImage: "url(/assets/cosmic-planet-background.jpg)",
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(15,17,23,0.44),rgba(15,17,23,0.12),rgba(15,17,23,0.44))]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(104,67,45,0.08),rgba(15,17,23,0.14)_44%,rgba(15,17,23,0.42)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(15,17,23,0.62)_0%,rgba(15,17,23,0.14)_44%,rgba(15,17,23,0.46)_100%)]" />

        <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-28 sm:px-6">
          <div className="mx-auto max-w-4xl text-center [text-shadow:0_2px_18px_rgba(0,0,0,0.72)]">
            <p className="nova-display mb-4 text-sm font-medium tracking-normal text-[var(--nova-muted)]">
              Problem-based learning, rebuilt as simulation
            </p>
            <h1
              className="nova-display font-semibold leading-[1.05] tracking-normal"
              style={{ fontSize: "clamp(2.5rem, 8vw, 3.5rem)" }}
            >
              <span className="text-[var(--nova-bone)]">Nova</span>
              <span className="nova-gradient-x">
                X
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-base font-normal leading-[1.6] text-[var(--nova-bone)]/90 sm:text-lg">
              First problem-based learning environment with world simulations and
              a superhuman mentor.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={WAITLIST_FORM_URL}
                className="nova-brand-button inline-flex min-h-[44px] w-full max-w-xs items-center justify-center transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nova-bone)]/70 sm:w-auto"
              >
                Join Waitlist
              </a>

              <div
                className="inline-flex min-h-[44px] w-full max-w-xs items-center justify-center gap-2.5 rounded-lg border border-white/[0.15] bg-white/[0.08] px-5 py-2.5 text-sm font-medium text-[var(--nova-bone)]/90 backdrop-blur-md sm:w-auto"
                aria-label="Product status: private beta"
              >
                <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--nova-green)]/45" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--nova-green)]" />
                </span>
                Private beta
              </div>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-7 z-20 px-4 sm:bottom-10">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-normal text-[rgba(157,163,180,0.62)] [text-shadow:0_2px_14px_rgba(0,0,0,0.82)] sm:text-sm">
            <Link
              to="/about-us#our-mission"
              className="underline decoration-[rgba(157,163,180,0.36)] underline-offset-[3px] transition-colors hover:text-[rgba(157,163,180,0.9)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[rgba(157,163,180,0.6)]"
            >
              our mission
            </Link>
            <a
              href="https://research.novaxarena.tech"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-[rgba(157,163,180,0.36)] underline-offset-[3px] transition-colors hover:text-[rgba(157,163,180,0.9)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[rgba(157,163,180,0.6)]"
            >
              our research
            </a>
          </div>
        </div>
      </section>

      <section className="bg-[var(--nova-void)] px-4 py-20 text-[var(--nova-bone)] sm:px-6 sm:py-28">
        <div className="mx-auto max-w-6xl text-center">
          <h2
            className="nova-display mx-auto max-w-4xl font-medium leading-[1.15] tracking-normal"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            fun like a game.{" "} effective {" "}
            <span className="nova-landing-gradient nova-gradient-brand-void font-semibold">
              like work.
            </span>
          </h2>

          <div className="nova-media mx-auto mt-10 aspect-video w-full max-w-5xl bg-[var(--nova-surface)] sm:mt-12">
            <img
              src="/assets/work.png"
              alt="NovaX experience preview"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>

          <div className="mt-10 overflow-hidden rounded-xl border border-black/10 bg-[var(--nova-white)] text-[var(--nova-void)] sm:mt-12">
            {valueCards.map((card, index) => (
              <div key={card.title}>
                <div className="grid grid-cols-1 items-center md:grid-cols-2">
                  <div
                    className={`p-6 sm:p-10 ${
                      card.reverse ? "md:order-2" : ""
                    }`}
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-[var(--nova-white)]">
                      <img
                        src={card.image}
                        alt={card.alt}
                        className="h-full w-full object-contain"
                        loading="lazy"
                      />
                    </div>
                  </div>

                  <div
                    className={`p-6 text-left sm:p-10 ${
                      card.reverse ? "md:order-1" : ""
                    }`}
                  >
                    <h3 className="nova-display text-2xl font-medium leading-[1.15] tracking-normal sm:text-3xl md:text-4xl">
                      {card.title}
                    </h3>
                    <p className="mt-4 max-w-xl text-sm font-normal leading-[1.6] text-[#464B58] sm:text-base">
                      {card.copy}
                    </p>
                  </div>
                </div>
                {index < valueCards.length - 1 && (
                  <div className="mx-6 h-px bg-black/10 sm:mx-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--nova-void)] px-4 py-20 text-[var(--nova-bone)] sm:px-6 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div
            className="opacity-0 transform translate-y-8 transition-all duration-1000 ease-out"
            data-scroll="fade-up"
          >
            <div className="mb-16 max-w-3xl">
              <h2
                className="nova-display font-medium leading-[1.1] tracking-normal"
                style={{ fontSize: "clamp(2rem, 7vw, 3.5rem)" }}
              >
                Transform Your Mind{" "}
                In 10{" "}
                <span className="nova-landing-gradient nova-gradient-urgent font-semibold">
                  Minutes
                </span>
              </h2>
              <p className="mt-5 max-w-2xl text-base font-normal leading-[1.6] text-[var(--nova-muted)] sm:text-lg">
                Experience learning from a dynamic world simulation with adaptive
                AI.
              </p>
              <a
                href={WAITLIST_FORM_URL}
                className="nova-void-button mt-8 inline-flex min-h-[44px] w-full max-w-xs items-center justify-center transition-colors hover:bg-[#252A3A] sm:w-auto"
              >
                Join Waitlist
              </a>
            </div>

            <div className="space-y-16 sm:space-y-20">
              {simulationFeatures.map((feature, index) => (
                <div
                  key={feature.title}
                  className="grid grid-cols-1 items-center gap-6 lg:grid-cols-2 lg:gap-12"
                >
                  <div
                    className="opacity-0 transform translate-y-8 transition-all duration-1000 ease-out"
                    data-scroll="fade-up"
                    style={{ animationDelay: feature.delay }}
                  >
                    <p className="nova-mono mb-3 text-sm font-medium text-[var(--nova-muted)]">
                      0{index + 1}
                    </p>
                    <h3 className="nova-display text-xl font-medium leading-[1.3] tracking-normal text-[var(--nova-bone)] sm:text-2xl">
                      {feature.title}
                    </h3>
                    <p className="mt-3 max-w-xl text-sm font-normal leading-[1.6] text-[var(--nova-muted)] sm:text-base">
                      {feature.copy}
                    </p>
                  </div>

                  <div
                    className="nova-media aspect-video w-full bg-[var(--nova-surface)] opacity-0 transform translate-y-8 transition-all duration-1000 ease-out"
                    data-scroll="fade-up"
                    style={{ animationDelay: feature.delay }}
                  >
                    <video
                      className="h-full w-full object-cover"
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="auto"
                      poster="/assets/cosmic-planet-background.jpg"
                    >
                      <source src={feature.video} type="video/mp4" />
                    </video>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="mt-24 text-center opacity-0 transform translate-y-8 transition-all duration-1000 ease-out"
              data-scroll="fade-up"
            >
              <h2 className="nova-display text-2xl font-medium leading-[1.2] tracking-normal text-[var(--nova-bone)] sm:text-3xl md:text-4xl">
                Problem Solving{" "}
                <span className="nova-landing-gradient nova-gradient-technical font-semibold">
                  Matters
                </span>
              </h2>

              <div className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-2">
                {problemSignals.map((signal) => (
                  <div
                    key={signal.title}
                    className="nova-card p-6 text-left opacity-0 transform translate-y-8 transition-all duration-1000 ease-out md:p-8"
                    data-scroll="fade-up"
                  >
                    <h3 className="text-lg font-semibold leading-[1.3] tracking-normal text-[var(--nova-brand)] sm:text-xl">
                      {signal.title}
                    </h3>
                    <p className="mt-4 text-sm font-normal leading-[1.6] text-[var(--nova-muted)] sm:text-base">
                      {signal.copy}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="mt-24 text-center opacity-0 transform translate-y-8 transition-all duration-1000 ease-out"
              data-scroll="fade-up"
            >
              <h2 className="nova-display text-2xl font-medium leading-[1.2] tracking-normal text-[var(--nova-bone)] sm:text-3xl md:text-4xl">
                Ready to{" "}
                <span className="nova-landing-gradient nova-gradient-process font-semibold">
                  Join Waitlist
                </span>
                ?
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base font-normal leading-[1.6] text-[var(--nova-muted)]">
                Join thousands of students and train your problem solving skills
                collaboratively.
              </p>
              <button
                className="nova-void-button mt-8 inline-flex min-h-[44px] w-full max-w-xs items-center justify-center transition-colors hover:bg-[#252A3A] sm:w-auto"
                onClick={scrollToVideoDemo}
              >
                Watch The Introduction Video
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--nova-bone)] px-4 py-20 text-[var(--nova-void)] sm:px-6 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <div
            className="opacity-0 transform translate-y-8 transition-all duration-1000 ease-out"
            data-scroll="fade-up"
          >
            <div className="mb-16 max-w-3xl">
              <h2
                className="nova-display font-medium leading-[1.1] tracking-normal"
                style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)" }}
              >
                A new way to prove your abilities
              </h2>
              <p className="mt-5 max-w-2xl text-base font-normal leading-[1.6] text-[#464B58] sm:text-lg">
                We're reinventing proof of ability: real evidence of what you can
                solve.
              </p>
            </div>

            <div className="space-y-16 sm:space-y-24">
              {proofFeatures.map((feature) => (
                <div
                  key={feature.title}
                  className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[minmax(0,_0.62fr)_minmax(0,_1.38fr)] lg:gap-8"
                  data-scroll="fade-up"
                  style={{ animationDelay: feature.delay }}
                >
                  <div className="text-left">
                    <h3 className="nova-display text-2xl font-medium leading-[1.15] tracking-normal sm:text-3xl md:text-4xl">
                      {feature.title}
                    </h3>
                    <p className="mt-4 max-w-[34ch] text-sm font-normal leading-[1.6] text-[#464B58] sm:text-base">
                      {feature.copy}
                    </p>
                  </div>

                  <div className="nova-media min-h-[200px] bg-[var(--nova-void)] sm:min-h-[240px] lg:h-[min(52vw,_420px)]">
                    <img
                      src={feature.image}
                      alt={feature.alt}
                      className="h-full w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div
              ref={videoDemoRef}
              className="opacity-0 transform translate-y-8 transition-all duration-1000 ease-out"
              data-scroll="fade-up"
            >
              <ScrollExpandMedia
                mediaType="video"
                mediaSrc={`https://www.youtube.com/embed/${YOUTUBE_DEMO_VIDEO_ID}`}
              />
            </div>
          </div>
        </div>
      </section>

      <footer
        id="about-us"
        className="bg-[var(--nova-void)] px-4 py-16 text-[var(--nova-bone)] opacity-0 transform translate-y-8 transition-all duration-1000 ease-out sm:px-6 sm:py-20"
        data-scroll="fade-up"
      >
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
            <div
              className="lg:col-span-2 opacity-0 transform translate-y-8 transition-all duration-1000 ease-out"
              data-scroll="fade-up"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="mb-6">
                <h3 className="nova-display mb-4 text-2xl font-medium tracking-normal">
                  NovaX
                </h3>
                <p className="max-w-md text-sm font-normal leading-[1.6] text-[var(--nova-muted)] sm:text-base">
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
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--nova-surface)] text-[var(--nova-bone)] transition-colors hover:bg-[#252A3A]"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d={link.path} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            <div
              className="opacity-0 transform translate-y-8 transition-all duration-1000 ease-out"
              data-scroll="fade-up"
              style={{ animationDelay: "0.4s" }}
            >
              <h4 className="nova-display mb-4 text-lg font-medium tracking-normal">
                Quick Links
              </h4>
              <ul className="space-y-3 text-sm text-[var(--nova-muted)]">
                <li>
                  <Link
                    to="/about-us"
                    className="transition-colors hover:text-[var(--nova-bone)]"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/how-it-works"
                    className="transition-colors hover:text-[var(--nova-bone)]"
                  >
                    How It Works
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:novaniansupp@gmail.com"
                    className="transition-colors hover:text-[var(--nova-bone)]"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div
              className="opacity-0 transform translate-y-8 transition-all duration-1000 ease-out"
              data-scroll="fade-up"
              style={{ animationDelay: "0.6s" }}
            >
              <h4 className="nova-display mb-4 text-lg font-medium tracking-normal">
                Support
              </h4>
              <ul className="space-y-3 text-sm text-[var(--nova-muted)]">
                <li>
                  <button
                    type="button"
                    onClick={handleUnavailable}
                    className="transition-colors hover:text-[var(--nova-bone)]"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={handleUnavailable}
                    className="transition-colors hover:text-[var(--nova-bone)]"
                  >
                    Terms of Service
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div
            className="mt-12 border-t border-[var(--nova-divider)] pt-8 opacity-0 transform translate-y-8 transition-all duration-1000 ease-out"
            data-scroll="fade-up"
            style={{ animationDelay: "0.8s" }}
          >
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <p className="text-sm text-[var(--nova-muted)]">
                (c) 2025 NovaX. All rights reserved.
              </p>
              <div className="flex gap-6">
                <button
                  type="button"
                  onClick={handleUnavailable}
                  className="text-sm text-[var(--nova-muted)] transition-colors hover:text-[var(--nova-bone)]"
                >
                  Privacy Policy
                </button>
                <button
                  type="button"
                  onClick={handleUnavailable}
                  className="text-sm text-[var(--nova-muted)] transition-colors hover:text-[var(--nova-bone)]"
                >
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
