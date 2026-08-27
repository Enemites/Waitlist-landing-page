import { Link } from "react-router-dom";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { motion, useReducedMotion } from "motion/react";
import { useState, useEffect } from "react";

// --- CUSTOM LAB HEADER ---
const LabHeader = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#F7F5F0]/90 backdrop-blur-md border-b border-[#E2DCD0] py-4' : 'bg-transparent py-6'}`}>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link to="/home" className="nova-display text-xl font-medium tracking-tight text-[#111317] flex items-center gap-2.5">
          <img src="/assets/logo.png" alt="" className="h-7 w-auto" />
          <span>Enemites</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium tracking-wide text-[#4A4F5E]">
          <a href="#research" className="hover:text-[#111317] transition-colors">Research</a>
          <a href="#news" onClick={(e) => { e.preventDefault(); alert("News is not available yet in English."); }} className="hover:text-[#111317] transition-colors">News</a>
          <a href="mailto:support@enemites.com" className="hover:text-[#111317] transition-colors">Contact</a>
          <Link 
            to="/arena" 
            className="bg-[#111317] text-white px-5 py-2 rounded-lg hover:bg-[#2A2E3D] hover:-translate-y-[1px] transition-transform active:scale-[0.98]"
          >
            Try Arena
          </Link>
        </nav>
      </div>
    </header>
  );
};

const projects = [
  {
    id: "01",
    title: "Arena Infrastructure",
    description: "Developing the core infrastructure and interactive environments where complex learning takes place. We build responsive, adaptive systems designed to provide real-time, grounded feedback rather than static curriculum.",
    link: "/arena",
    image: "/assets/arena-infrastructure.jpg"
  },
  {
    id: "02",
    title: "World Model for Simulation",
    description: "Engineering simulation engines that understand user context deeply. This world model guides scenarios, ensuring every interaction possesses logical depth, realistic consequences, and continuous adaptation.",
    link: null,
    image: "/assets/world-model.jpg"
  }
];

const HomePage = () => {
  useScrollAnimation();
  const reduce = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.15 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { 
      opacity: 1, y: 0, 
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
    }
  } as any;

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#4A4F5E] selection:bg-[#D97757]/20 selection:text-[#111317]">
      <LabHeader />

      <main className="relative pt-32 pb-32" id="research">
        {/* HERO SECTION - Minimalist Research Lab vibe */}
        <section className="px-4 sm:px-6 lg:px-8 pt-12 lg:pt-24 pb-24 max-w-[1400px] mx-auto min-h-[70vh] flex items-center border-b border-[#E2DCD0]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start w-full">
            <motion.div 
              initial={reduce ? false : "hidden"} 
              animate="visible" 
              variants={containerVariants}
              className="lg:col-span-8"
            >
              <motion.p variants={itemVariants} className="nova-mono mb-8 text-[11.5px] font-medium uppercase tracking-[0.2em] text-[#D97757]">
                Enemites Independent Research
              </motion.p>
              <motion.h1 variants={itemVariants} className="nova-display text-5xl font-medium leading-[1.05] tracking-tight text-[#111317] md:text-6xl lg:text-[84px]">
                We shape the future by seeking the <span className="text-[#D97757]">ground truth</span>.
              </motion.h1>
            </motion.div>
            
            <motion.div 
              initial={reduce ? false : "hidden"} 
              animate="visible" 
              variants={containerVariants}
              className="lg:col-span-4 lg:pt-20"
            >
              <motion.p variants={itemVariants} className="text-lg md:text-[19px] leading-[1.6] text-[#4A4F5E]">
                We are a research-driven collective focused on the next generation of tech and cognitive infrastructure. Our work spans from foundational world models to applied educational environments.
              </motion.p>
              <motion.div variants={itemVariants} className="mt-10">
                <a 
                  href="#projects" 
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="inline-flex items-center text-[13px] font-medium tracking-wide uppercase text-[#111317] hover:text-[#D97757] transition-colors group"
                >
                  <span className="border-b border-[#111317] group-hover:border-[#D97757] pb-1">View our work</span>
                  <svg className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </motion.div>
            </motion.div>
          </div>
        </section>



        {/* ONGOING PROJECTS SECTION - Clean Academic/Editorial Grid */}
        <section id="projects" className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-[1400px] mx-auto pt-24 lg:pt-32">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={itemVariants} className="mb-16 lg:mb-24 max-w-4xl">
              <h2 className="nova-display text-xl font-medium leading-[1.1] text-[#788094] md:text-2xl mb-6">
                Active Initiatives
              </h2>
              <p className="nova-display text-4xl md:text-5xl lg:text-[56px] font-medium leading-[1.05] text-[#111317] tracking-tight">
                We build intelligent environments for <span className="text-[#8c93a3]">human capability</span>.
              </p>
            </motion.div>

            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={containerVariants}
              className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16"
            >
              {projects.map((project) => (
                <motion.article 
                  key={project.id} 
                  variants={itemVariants} 
                  className="group relative flex flex-col"
                >
                  <div className="w-full aspect-[4/3] bg-[#E2DCD0] mb-8 overflow-hidden rounded-sm">
                    <img 
                      src={project.image} 
                      alt={project.title} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  
                  <div className="flex flex-col flex-1">
                    <div className="mb-4">
                      <p className="nova-mono text-[11px] uppercase tracking-wider font-medium text-[#D97757]">{project.id}</p>
                    </div>
                    
                    <h3 className="nova-display text-2xl lg:text-3xl font-medium text-[#111317] mb-4 group-hover:text-[#D97757] transition-colors">
                      {project.link ? (
                        <Link to={project.link}>{project.title}</Link>
                      ) : (
                        project.title
                      )}
                    </h3>
                    
                    <p className="text-base leading-[1.65] text-[#4A4F5E] max-w-xl">
                      {project.description}
                    </p>
                    
                    {project.link && (
                      <div className="mt-8">
                        <Link to={project.link} className="inline-flex items-center text-[13px] font-medium text-[#111317] border-b border-[#E2DCD0] pb-1 hover:border-[#111317] transition-colors">
                          Explore applied product
                          <svg className="ml-1.5 w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </Link>
                      </div>
                    )}
                  </div>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="px-4 pb-12 pt-24 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-8 text-[12px] text-[#788094] sm:flex-row sm:items-end sm:justify-between border-t border-[#E2DCD0] pt-8">
          <div>
            <Link to="/home" className="nova-display text-lg font-medium tracking-tight text-[#111317] mb-3 flex items-center gap-2">
              <img src="/assets/logo.png" alt="" className="h-5 w-auto" />
              <span>Enemites</span>
            </Link>
            <p>© {new Date().getFullYear()} Enemites. All rights reserved.</p>
          </div>
          <div className="flex flex-wrap gap-8 font-medium">
            <a href="#research" className="hover:text-[#111317] transition-colors">
              Research
            </a>
            <a href="#news" onClick={(e) => { e.preventDefault(); alert("News is not available yet in English."); }} className="hover:text-[#111317] transition-colors">
              News
            </a>
            <a href="mailto:support@enemites.com" className="hover:text-[#111317] transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
