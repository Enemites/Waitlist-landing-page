import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ResponsiveHeader from "@/components/ResponsiveHeader";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { motion, useReducedMotion } from "motion/react";

const studentSquad = [
  {
    name: "Nafis",
    tagline: "Are we able to discover a god-level learning method that also creates unfalsified credentials?",
    focus: "Learning systems, brain research, capability proof, product direction, human behavior",
    photo: "/assets/senku.jpg",
  },
  {
    name: "Enosh",
    tagline: "How can we shape the next generation of learner communities through NovaX?",
    focus: "Early adopters, feedback loops, learner communities, student participation",
    photo: "/assets/enosh.png",
  },
];

const questTimeline = [
  {
    label: "Quest 01",
    title: "From anxiety to questions",
    description:
      "Nafis studied machine learning and felt the pressure of knowledge becoming cheaper. The first question was simple: if AI makes learning effortless, what is left for students to prove?",
    period: "May 2025",
  },
  {
    label: "Quest 02",
    title: "Turning the question into research",
    description:
      "The question turned into research: experimenting, developing the idea, running surveys, and looking for a learning loop that felt serious without becoming lifeless.",
    period: "June 2025",
  },
  {
    label: "Quest 03",
    title: "Meeting a collaborator",
    description:
      "I needed a few people to help, and I met Enosh, who happened to want to spend his free time contributing to certain projects voluntarily for the experience.",
    period: "July 2025",
  },
  {
    label: "Quest 04",
    title: "The concept found its shape",
    description:
      "Through prototyping and experimentation, the idea crystallized into a clear concept: problem-based learning, world simulation, mentor reflection, and capability evidence in one short run.",
    period: "October 2025",
  },
  {
    label: "Quest 05",
    title: "Building an arena for everyone",
    description:
      "The next step is a deeper prototype and a broader beta. NovaX is being shaped with students who want learning to feel responsive, visible, and worth returning to.",
    period: "December 2025",
  },
];

const values = [
  {
    title: "Built by students, for students",
    description:
      "We design for the exact moment when static courses, dashboards, and certificates stop feeling convincing.",
  },
  {
    title: "Game energy, real stakes",
    description:
      "Progression, feedback, and story matter, but only when they reveal real problem-solving capability.",
  },
  {
    title: "Proof over performance theater",
    description:
      "NovaX should show how a person thinks under constraint, not just decorate a profile with empty activity.",
  },
];

const AboutUsPage = () => {
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
    <div className="min-h-screen bg-[#F7F5F0] text-[#4A4F5E]">
      <style>{`
        @keyframes novaXGradientMorph {
          0%, 100% { color: #D97757; -webkit-text-fill-color: #D97757; }
          50% { color: #111317; -webkit-text-fill-color: #111317; }
        }
        .nova-gradient-x {
          display: inline-block;
          color: #D97757;
          -webkit-text-fill-color: #D97757;
          animation: novaXGradientMorph 4.8s ease-in-out infinite;
          will-change: color;
        }
      `}</style>

      <ResponsiveHeader theme="light" />

      <main className="relative">
        {/* HERO SECTION */}
        <section className="relative min-h-[90dvh] flex items-center pt-24 px-4 sm:px-6 lg:px-8 border-b border-[#E2DCD0]">
          <div className="absolute inset-0 bg-[#F7F5F0]" />
          
          <div className="relative z-10 mx-auto max-w-6xl w-full grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
            <motion.div 
               initial={reduce ? false : "hidden"} 
               animate="visible" 
               variants={containerVariants}
               className="max-w-3xl py-12"
            >
              <motion.p variants={itemVariants} className="nova-mono mb-6 text-[11.5px] font-medium uppercase tracking-[0.18em] text-[#788094]">
                About NovaX
              </motion.p>
              <motion.h1 variants={itemVariants} className="nova-display text-5xl font-semibold leading-[1.05] tracking-tight text-[#111317] md:text-6xl lg:text-7xl">
                Built by students who needed a <span className="nova-gradient-x">better arena</span>.
              </motion.h1>
              <motion.p variants={itemVariants} className="mt-8 text-lg font-normal leading-[1.6] text-[#4A4F5E] sm:text-xl max-w-xl">
                NovaX began from a student fear: AI makes knowledge feel cheap, while learning still feels heavy. We are building the arena we wanted, where effort becomes visible capability.
              </motion.p>

              <motion.div variants={itemVariants} className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Button asChild className="h-12 rounded-lg bg-[#D97757] px-8 text-[15px] font-medium text-white hover:bg-[#D97757]/90 hover:-translate-y-[1px] transition-transform active:scale-[0.98]">
                  <Link to="/arena/how-it-works">See how it works</Link>
                </Button>
                <Button asChild variant="outline" className="h-12 rounded-lg border border-[#E2DCD0] bg-transparent px-8 text-[15px] font-medium text-[#111317] hover:bg-white hover:-translate-y-[1px] transition-transform active:scale-[0.98]">
                  <a href="mailto:novaniansupp@gmail.com">Contact the team</a>
                </Button>
              </motion.div>
            </motion.div>

            <motion.aside 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden rounded-[24px] border border-[#E2DCD0] bg-white shadow-[0_24px_40px_rgba(0,0,0,0.05)] hidden lg:block"
            >
              <div className="relative min-h-[400px]">
                <img
                  src="/assets/feedback-loop-sculpture.jpg"
                  alt="Abstract continuous feedback loop sculpture representing learning"
                  className="absolute inset-0 h-full w-full object-cover mix-blend-multiply opacity-95 transition-transform duration-1000 hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <p className="nova-mono text-[11px] uppercase tracking-wider text-[#D97757]">ORIGIN SIGNAL</p>
                  <h2 className="nova-display mt-3 text-3xl font-medium leading-[1.15] text-[#111317]">
                    Serious learning with the feedback loop of a game.
                  </h2>
                </div>
              </div>
              <div className="grid grid-cols-3 border-t border-[#E2DCD0] bg-white/50 backdrop-blur-md">
                {["student-led", "scenario-first", "proof-ready"].map((item) => (
                  <div key={item} className="border-r border-[#E2DCD0] p-5 last:border-r-0 text-center">
                    <p className="nova-mono text-[11px] font-medium uppercase tracking-wider text-[#788094]">{item}</p>
                  </div>
                ))}
              </div>
            </motion.aside>
          </div>
        </section>

        {/* ONE MISSION */}
        <section id="our-mission" className="px-4 py-32 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={containerVariants}>
              <motion.p variants={itemVariants} className="nova-mono mb-6 text-[12px] font-medium uppercase tracking-[0.18em] text-[#D97757]">
                One Mission
              </motion.p>
              <motion.h2 variants={itemVariants} className="nova-display text-4xl font-medium leading-[1.1] text-[#111317] sm:text-5xl md:text-6xl">
                Train the human abilities AI has not replaced.
              </motion.h2>
              <motion.p variants={itemVariants} className="mx-auto mt-8 max-w-2xl text-lg leading-[1.6] text-[#4A4F5E] sm:text-xl">
                Our mission is to help humans stay valuable longer in a world where AI keeps making knowledge cheaper.
              </motion.p>
              <motion.div variants={itemVariants} className="mt-12">
                <Button asChild className="h-12 rounded-lg bg-[#111317] px-8 text-[15px] font-medium text-white hover:bg-[#2A2E3D] hover:-translate-y-[1px] transition-transform active:scale-[0.98]">
                  <a href="https://research.novaxarena.tech" target="_blank" rel="noreferrer">
                    Read our research
                  </a>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* STUDENT SQUAD */}
        <section className="bg-white px-4 py-32 sm:px-6 lg:px-8 border-y border-[#E2DCD0]">
          <div className="mx-auto max-w-6xl">
            <motion.div className="mb-16 max-w-2xl" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={itemVariants}>
              <p className="nova-mono mb-4 text-[11.5px] font-medium uppercase tracking-wider text-[#788094]">Student squad</p>
              <h2 className="nova-display text-4xl font-medium leading-[1.1] text-[#111317] sm:text-5xl">
                The people shaping the first arena.
              </h2>
            </motion.div>

            <motion.div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-8" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={containerVariants}>
              {studentSquad.map((member) => (
                <motion.article key={member.name} variants={itemVariants} className="flex flex-col rounded-[24px] border border-[#E2DCD0] bg-[#F7F5F0] overflow-hidden group shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                  <div className="aspect-[4/3] overflow-hidden bg-white">
                    <img
                      src={member.photo}
                      alt={`${member.name} profile`}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out grayscale mix-blend-multiply opacity-90"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-8 sm:p-10">
                    <h3 className="nova-display text-3xl font-medium text-[#111317]">{member.name}</h3>
                    <p className="mt-4 text-base leading-[1.6] text-[#4A4F5E] italic">"{member.tagline}"</p>
                    <div className="mt-auto pt-8">
                      <p className="nova-mono text-[11px] uppercase tracking-wider text-[#D97757] mb-2">Focus Area</p>
                      <p className="text-sm leading-[1.6] text-[#788094]">
                        {member.focus}
                      </p>
                    </div>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </section>

        {/* TIMELINE */}
        <section className="bg-[#F7F5F0] px-4 py-32 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <motion.div className="mb-20" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={itemVariants}>
              <p className="nova-mono mb-4 text-[11.5px] font-medium uppercase tracking-wider text-[#D97757]">Season 0</p>
              <h2 className="nova-display text-4xl font-medium leading-[1.1] text-[#111317] sm:text-5xl">
                How a study problem became a product mission.
              </h2>
            </motion.div>

            <div className="relative">
              <div className="absolute left-[15px] top-0 bottom-0 w-px bg-gradient-to-b from-[#D97757] via-[#E2DCD0] to-transparent md:left-[180px]" />
              
              <div className="space-y-12">
                {questTimeline.map((quest) => (
                  <motion.article
                    key={quest.title}
                    initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={itemVariants}
                    className="relative grid grid-cols-1 gap-6 pl-12 md:grid-cols-[160px_1fr] md:pl-0"
                  >
                    <div className="absolute left-[11px] top-1.5 h-[9px] w-[9px] rounded-full bg-white ring-2 ring-[#D97757] md:left-[176px]" />
                    
                    <div className="md:text-right md:pr-12">
                      <p className="nova-mono text-[11px] font-medium uppercase tracking-wider text-[#788094]">{quest.label}</p>
                      <p className="mt-1 text-sm font-medium text-[#111317]">{quest.period}</p>
                    </div>
                    
                    <div className="md:pl-12">
                      <h3 className="nova-display text-2xl font-medium text-[#111317]">{quest.title}</h3>
                      <p className="mt-4 text-base leading-[1.6] text-[#4A4F5E]">
                        {quest.description}
                      </p>
                    </div>
                  </motion.article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* OPERATING PRINCIPLES */}
        <section className="bg-white px-4 py-32 sm:px-6 lg:px-8 border-t border-[#E2DCD0]">
          <div className="mx-auto max-w-6xl">
            <motion.div className="mb-20 max-w-2xl" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={itemVariants}>
              <p className="nova-mono mb-4 text-[11.5px] font-medium uppercase tracking-wider text-[#D97757]">Operating principles</p>
              <h2 className="nova-display text-4xl font-medium leading-[1.1] text-[#111317] sm:text-5xl lg:text-6xl">
                The rules behind the experience.
              </h2>
            </motion.div>

            <motion.div className="flex flex-col border-b border-[#E2DCD0]" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={containerVariants}>
              {values.map((value, index) => (
                <motion.article 
                  key={value.title} 
                  variants={itemVariants} 
                  className="group flex flex-col md:flex-row md:items-start gap-4 md:gap-12 border-t border-[#E2DCD0] py-10 md:py-14"
                >
                  <div className="md:w-[12%] shrink-0">
                    <p className="nova-mono text-3xl font-medium text-[#E2DCD0] transition-colors duration-500 group-hover:text-[#D97757]">
                      0{index + 1}
                    </p>
                  </div>
                  <div className="md:w-[43%] shrink-0">
                    <h3 className="nova-display text-3xl md:text-4xl font-medium leading-[1.15] text-[#111317] transition-transform duration-500 group-hover:translate-x-2">
                      {value.title}
                    </h3>
                  </div>
                  <div className="md:w-[45%]">
                    <p className="text-lg md:text-[19px] leading-[1.5] text-[#4A4F5E] transition-colors duration-500 group-hover:text-[#111317] mt-2 md:mt-1">
                      {value.description}
                    </p>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </section>

        {/* STILL BUILDING */}
        <section className="bg-[#F7F5F0] px-4 py-32 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={itemVariants}
            className="mx-auto max-w-5xl rounded-[32px] border border-[#E2DCD0] bg-white p-10 text-[#4A4F5E] sm:p-16 relative overflow-hidden shadow-[0_24px_40px_rgba(0,0,0,0.03)]"
          >
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#D97757] rounded-full mix-blend-multiply filter blur-[120px] opacity-10 pointer-events-none" />
            
            <div className="relative z-10">
              <p className="nova-mono mb-6 text-[11.5px] font-medium uppercase tracking-wider text-[#D97757]">Still building</p>
              <h2 className="nova-display max-w-3xl text-4xl font-medium leading-[1.15] text-[#111317] sm:text-5xl">
                NovaX is not a finished monument. It is an arena being tested with real students.
              </h2>
              <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-t border-[#E2DCD0] pt-10">
                <p className="max-w-xl text-base leading-[1.6] text-[#4A4F5E]">
                  If you care about capability, simulation, or better learning loops, this is the moment to help shape the early product.
                </p>
                <Button asChild className="h-12 shrink-0 rounded-lg bg-[#111317] px-8 text-[15px] font-medium text-white hover:bg-[#2A2E3D] hover:-translate-y-[1px] transition-transform">
                  <a href="mailto:novaniansupp@gmail.com">Write to us</a>
                </Button>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="bg-white px-4 pb-12 pt-12 sm:px-6 lg:px-8 border-t border-[#E2DCD0]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 text-[13px] text-[#788094] sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright 2025 NovaX. All rights reserved.</p>
          <div className="flex flex-wrap gap-6">
            <Link to="/arena/how-it-works" className="hover:text-[#111317] transition-colors">
              How it works
            </Link>
            <Link to="/arena/privacy-policy" className="hover:text-[#111317] transition-colors">
              Privacy Policy
            </Link>
            <Link to="/arena/terms-of-service" className="hover:text-[#111317] transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AboutUsPage;
