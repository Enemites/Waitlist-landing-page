import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ResponsiveHeader from "@/components/ResponsiveHeader";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const studentSquad = [
  {
    role: "Founder",
    name: "Nafis",
    tagline: "Are we able to discover a god-level learning method that also creates unfalsified credentials?",
    focus: "Learning systems, brain research, capability proof, product direction, human behavior",
    photo: "/assets/senku.jpg",
  },
  {
    role: "Secondary Founder",
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
      "The question turned into R&D and experiments: developing the idea, researching it, running surveys, and searching for a learning loop that felt serious without becoming lifeless.",
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
    title: "The concept became testable",
    description:
      "The idea moved from frustration into a prototype: problem-based learning, world simulation, mentor reflection, and capability evidence in one short run.",
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

  return (
    <div className="min-h-screen overflow-hidden bg-[#E8E4D9] text-[#0F1117]">
      <ResponsiveHeader className="rounded-[18px] border-white/10 bg-[rgb(15_17_23/0.76)] shadow-[0_24px_80px_rgba(15,17,23,0.24)]" />

      <main className="relative">
        <section className="px-4 pt-32 pb-16 sm:px-6 sm:pb-20 lg:px-8">
          <div
            className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]"
            data-scroll="fade-up"
          >
            <div className="max-w-3xl">
              <p className="mb-4 text-xs font-medium uppercase text-[#555D6D]">About NovaX</p>
              <h1 className="nova-display text-4xl font-semibold leading-[1.05] text-[#0F1117] sm:text-5xl md:text-6xl">
                Built by students who needed a{" "}
                <span className="nova-gradient-text nova-gradient-technical">better arena</span>.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-[1.6] text-[#343945] sm:text-lg">
                NovaX began from a student fear: AI makes knowledge feel cheap, while learning still feels heavy. We
                are building the arena we wanted, where effort becomes visible capability.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  className="h-12 rounded-lg bg-[#0F1117] px-6 text-[15px] font-medium text-[#E8E4D9] hover:bg-[#1C2030]"
                >
                  <Link to="/how-it-works">See how it works</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-12 rounded-lg border border-[#1C2030] bg-[#E8E4D9] px-6 text-[15px] font-medium text-[#0F1117] hover:bg-[#dcd7cb] hover:text-[#0F1117]"
                >
                  <a href="mailto:novaniansupp@gmail.com">Contact the team</a>
                </Button>
              </div>
            </div>

            <aside className="overflow-hidden rounded-[12px] border border-[#0F1117]/15 bg-[#0F1117] text-[#E8E4D9]">
              <div className="relative min-h-[240px]">
                <img
                  src="/assets/cosmic-planet-background.jpg"
                  alt="Dark spatial NovaX arena atmosphere"
                  className="absolute inset-0 h-full w-full object-cover opacity-85"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(15,17,23,0.96),rgba(15,17,23,0.18))]" />
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                  <p className="nova-mono text-xs text-[#9DA3B4]">ORIGIN SIGNAL</p>
                  <h2 className="nova-display mt-2 text-2xl font-medium text-white">
                    Serious learning with the feedback loop of a game.
                  </h2>
                </div>
              </div>
              <div className="grid grid-cols-3 border-t border-[#333849]">
                {["student-led", "scenario-first", "proof-ready"].map((item) => (
                  <div key={item} className="border-r border-[#333849] p-4 last:border-r-0">
                    <p className="text-sm text-[#E8E4D9]">{item}</p>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section
          id="our-mission"
          className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
          data-scroll="fade-up"
        >
          <div className="mx-auto max-w-4xl text-center">
            <p className="nova-display mb-5 text-lg font-medium uppercase text-[#0F1117] sm:text-xl">
              One Mission
            </p>
            <h2 className="nova-display text-3xl font-medium leading-[1.15] text-[#0F1117] sm:text-4xl md:text-5xl">
              Train the human abilities AI has not replaced.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-[1.6] text-[#343945] sm:text-lg">
              Our mission is to help humans stay valuable longer in a world where AI keeps making knowledge cheaper.
            </p>
            <Button
              asChild
              className="mt-8 h-12 rounded-lg bg-[#0F1117] px-6 text-[15px] font-medium text-[#E8E4D9] hover:bg-[#1C2030]"
            >
              <a href="https://research.novaxarena.tech" target="_blank" rel="noreferrer">
                Read our research
              </a>
            </Button>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8" data-scroll="fade-up">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 max-w-2xl">
              <p className="mb-2 text-xs font-medium uppercase text-[#555D6D]">Student squad</p>
              <h2 className="nova-display text-3xl font-medium leading-[1.15] sm:text-4xl">
                The people shaping the first arena.
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {studentSquad.map((member) => (
                <article
                  key={member.name}
                  className="flex h-full flex-col rounded-[12px] border border-[#333849] bg-[#1C2030] p-5 text-[#E8E4D9]"
                >
                  <div className="aspect-square overflow-hidden rounded-[10px] border border-[#333849] bg-[#E8E4D9]">
                    <img
                      src={member.photo}
                      alt={`${member.name} profile`}
                      className="h-full w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  <div className="mt-5 flex flex-1 flex-col">
                    <p className="nova-gradient-text nova-gradient-process text-xs font-semibold">{member.role}</p>
                    <h3 className="mt-2 text-2xl font-medium text-white">{member.name}</h3>
                    <p className="mt-3 text-sm leading-[1.6] text-[#E8E4D9]/74">{member.tagline}</p>
                    <p className="nova-mono mt-auto border-t border-[#333849] pt-4 text-xs text-[#9DA3B4]">
                      {member.focus}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8" data-scroll="fade-up">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 max-w-2xl">
              <p className="mb-2 text-xs font-medium uppercase text-[#555D6D]">Season 0</p>
              <h2 className="nova-display text-3xl font-medium leading-[1.15] sm:text-4xl">
                How a study problem became a product mission.
              </h2>
            </div>

            <div className="relative">
              <div className="absolute left-0 top-0 hidden h-full w-px bg-[#0F1117]/20 md:block" />
              <div className="space-y-5 md:pl-10">
                {questTimeline.map((quest) => (
                  <article
                    key={quest.title}
                    className="grid grid-cols-1 gap-4 border-t border-[#0F1117]/18 py-6 md:grid-cols-[180px_1fr]"
                  >
                    <div>
                      <p className="nova-mono text-xs text-[#555D6D]">{quest.label}</p>
                      <p className="nova-mono mt-2 text-sm text-[#0F1117]">{quest.period}</p>
                    </div>
                    <div>
                      <h3 className="text-xl font-medium text-[#0F1117]">{quest.title}</h3>
                      <p className="mt-3 max-w-3xl text-sm leading-[1.6] text-[#343945] sm:text-base">
                        {quest.description}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8" data-scroll="fade-up">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 max-w-2xl">
              <p className="mb-2 text-xs font-medium uppercase text-[#555D6D]">Operating principles</p>
              <h2 className="nova-display text-3xl font-medium leading-[1.15] sm:text-4xl">
                The rules behind the experience.
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {values.map((value) => (
                <article key={value.title} className="rounded-[12px] border border-[#333849] bg-[#1C2030] p-5 text-[#E8E4D9]">
                  <h3 className="text-xl font-medium text-white">{value.title}</h3>
                  <p className="mt-3 text-sm leading-[1.6] text-[#E8E4D9]/74">{value.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8" data-scroll="fade-up">
          <div className="mx-auto max-w-5xl rounded-[12px] border border-[#333849] bg-[#0F1117] p-6 text-[#E8E4D9] sm:p-8 lg:p-10">
            <p className="mb-3 text-xs font-medium uppercase text-[#9DA3B4]">Still building</p>
            <h2 className="nova-display max-w-3xl text-3xl font-medium leading-[1.15] text-white sm:text-4xl">
              NovaX is not a finished monument. It is an arena being tested with real students.
            </h2>
            <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-2xl text-sm leading-[1.6] text-[#E8E4D9]/74 sm:text-base">
                If you care about capability, simulation, or better learning loops, this is the moment to help shape the
                early product.
              </p>
              <Button
                asChild
                className="h-12 shrink-0 rounded-lg bg-[#0F1117] px-6 text-[15px] font-medium text-[#E8E4D9] ring-1 ring-[#1C2030] hover:bg-[#1C2030]"
              >
                <a href="mailto:novaniansupp@gmail.com">Write to us</a>
              </Button>
            </div>
          </div>
        </section>

        <footer className="px-4 pb-12 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 border-t border-[#0F1117]/18 pt-6 text-sm text-[#343945] sm:flex-row sm:items-center sm:justify-between">
            <p>Copyright 2025 NovaX. All rights reserved.</p>
            <div className="flex flex-wrap gap-4">
              <Link to="/how-it-works" className="hover:text-[#0F1117]">
                How it works
              </Link>
              <Link to="/privacy-policy" className="hover:text-[#0F1117]">
                Privacy Policy
              </Link>
              <Link to="/terms-of-service" className="hover:text-[#0F1117]">
                Terms of Service
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default AboutUsPage;
