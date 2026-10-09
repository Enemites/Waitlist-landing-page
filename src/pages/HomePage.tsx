import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useState, useEffect } from "react";
import BrandVisual from "@/components/BrandVisual";

// --- CUSTOM LAB HEADER ---
const LabHeader = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`lab-header fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#F5F2EB]/90 backdrop-blur-md border-b border-[#DAD6CB] py-4' : 'bg-transparent py-6'}`}>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link to="/home" className="nova-display text-xl font-medium tracking-tight text-[#272C27] flex items-center gap-2.5">
          <img src="/assets/logo-128.webp" width="128" height="94" alt="" className="h-7 w-auto" />
          <span>Enemites</span>
        </Link>
        
        <nav className="lab-nav flex items-center gap-8 text-[13px] font-medium tracking-wide text-[#62675E]">
          <a href="https://research.enemites.com" className="hover:text-[#272C27] transition-colors">Research</a>
          <a href="https://news.enemites.com" className="hover:text-[#272C27] transition-colors">News</a>
          <a href="mailto:support@enemites.com" className="hover:text-[#272C27] transition-colors">Contact</a>
          <Link 
            to="/arena" 
            className="bg-[#272C27] text-white px-5 py-2 rounded-lg hover:bg-[#2A2E3D] hover:-translate-y-[1px] transition-transform active:scale-[0.98]"
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
    image: "/assets/arena-infrastructure-960.webp"
  },
  {
    id: "02",
    title: "World Model for Simulation",
    description: "Engineering simulation engines that understand user context deeply. This world model guides scenarios, ensuring every interaction possesses logical depth, realistic consequences, and continuous adaptation.",
    link: null,
    image: "/assets/world-model-960.webp"
  }
];

const HomePage = () => {
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
    <div className="design-site lab-page min-h-screen bg-[#F5F2EB] text-[#62675E] selection:bg-[#A64B31]/20 selection:text-[#272C27]">
      <LabHeader />

      <main className="relative pt-32 pb-32" id="research">
        {/* HERO SECTION - Minimalist Research Lab vibe */}
        <section className="lab-hero px-4 sm:px-6 lg:px-8 pt-12 lg:pt-24 pb-24 max-w-[1400px] mx-auto min-h-[70vh] flex items-center border-b border-[#DAD6CB]">
          <div className="lab-hero-grid grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start w-full">
            <motion.div 
              initial={reduce ? false : "hidden"} 
              animate="visible" 
              variants={containerVariants}
              className="lab-hero-heading lg:col-span-8"
            >
              <motion.p variants={itemVariants} className="nova-mono mb-6 sm:mb-8 text-[11px] sm:text-[11.5px] font-medium uppercase tracking-[0.2em] text-[#A64B31]">
                Enemites Research Lab
              </motion.p>
              <motion.h1 variants={itemVariants} className="nova-display text-3xl sm:text-4xl md:text-6xl lg:text-[84px] font-medium leading-[1.1] sm:leading-[1.05] tracking-tight text-[#272C27]">
                We shape the future by seeking the <span className="text-[#A64B31]">ground truth</span>.
              </motion.h1>
            </motion.div>
            
            <motion.div 
              initial={reduce ? false : "hidden"} 
              animate="visible" 
              variants={containerVariants}
              className="lab-hero-description lg:col-span-4 lg:pt-20"
            >
              <motion.p variants={itemVariants} className="text-sm sm:text-base md:text-[19px] leading-relaxed text-[#62675E]">
                We are a research-driven collective focused on the next generation of tech and cognitive infrastructure. Our work spans from foundational world models to applied educational environments.
              </motion.p>
              <motion.div variants={itemVariants} className="mt-8 sm:mt-10">
                <a 
                  href="#projects" 
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="inline-flex items-center text-xs sm:text-[13px] font-medium tracking-wide uppercase text-[#272C27] hover:text-[#A64B31] transition-colors group"
                >
                  <span className="border-b border-[#272C27] group-hover:border-[#A64B31] pb-1">View our work</span>
                  <svg className="ml-2 w-3.5 sm:w-4 h-3.5 sm:h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </motion.div>
            </motion.div>
            <BrandVisual className="lab-hero-art" />
          </div>
        </section>



        {/* ONGOING PROJECTS SECTION - Clean Academic/Editorial Grid */}
        <section id="projects" className="lab-projects px-4 sm:px-6 lg:px-8">
          <div className="max-w-[1400px] mx-auto pt-16 sm:pt-24 lg:pt-32">
            <motion.div initial={reduce ? false : "hidden"} whileInView="visible" viewport={{ once: true }} variants={itemVariants} className="mb-12 sm:mb-16 lg:mb-24 max-w-4xl">
              <h2 className="nova-display text-base sm:text-xl md:text-2xl font-medium leading-[1.1] text-[#62675E] mb-3 sm:mb-6">
                Active Initiatives
              </h2>
              <p className="nova-display text-2xl sm:text-4xl md:text-5xl lg:text-[56px] font-medium leading-[1.15] sm:leading-[1.05] text-[#272C27] tracking-tight">
                We build intelligent environments for <span className="text-[#62675E]">human capability</span>.
              </p>
            </motion.div>

            <motion.div 
              initial={reduce ? false : "hidden"} whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={containerVariants}
              className="lab-project-grid grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-12 lg:gap-16"
            >
              {projects.map((project) => (
                <motion.article 
                  key={project.id} 
                  variants={itemVariants} 
                  className="group relative flex flex-col"
                >
                  <div className="w-full aspect-[4/3] bg-[#DAD6CB] mb-6 sm:mb-8 overflow-hidden rounded-sm">
                    <img 
                      src={project.image} 
                      alt={project.title} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  
                  <div className="flex flex-col flex-1">
                    <div className="mb-3 sm:mb-4">
                      <p className="nova-mono text-[10px] sm:text-[11px] uppercase tracking-wider font-medium text-[#A64B31]">{project.id}</p>
                    </div>
                    
                    <h3 className="nova-display text-xl sm:text-2xl lg:text-3xl font-medium text-[#272C27] mb-3 sm:mb-4 group-hover:text-[#A64B31] transition-colors">
                      {project.link ? (
                        <Link to={project.link}>{project.title}</Link>
                      ) : (
                        project.title
                      )}
                    </h3>
                    
                    <p className="text-xs sm:text-sm md:text-base leading-relaxed sm:leading-[1.65] text-[#62675E] max-w-xl">
                      {project.description}
                    </p>
                    
                    {project.link && (
                      <div className="mt-6 sm:mt-8">
                        <Link to={project.link} className="inline-flex items-center text-xs sm:text-[13px] font-medium text-[#272C27] border-b border-[#DAD6CB] pb-1 hover:border-[#272C27] transition-colors">
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
        <div className="mx-auto flex max-w-[1400px] flex-col gap-8 text-[12px] text-[#62675E] sm:flex-row sm:items-end sm:justify-between border-t border-[#DAD6CB] pt-8">
          <div>
            <Link to="/home" className="nova-display text-lg font-medium tracking-tight text-[#272C27] mb-3 flex items-center gap-2">
              <img src="/assets/logo-128.webp" width="128" height="94" alt="" className="h-5 w-auto" />
              <span>Enemites</span>
            </Link>
            <p>© {new Date().getFullYear()} Enemites. All rights reserved.</p>
          </div>
          <div className="flex flex-wrap gap-8 font-medium">
            <a href="https://research.enemites.com" className="hover:text-[#272C27] transition-colors">
              Research
            </a>
            <a href="https://news.enemites.com" className="hover:text-[#272C27] transition-colors">
              News
            </a>
            <a href="mailto:support@enemites.com" className="hover:text-[#272C27] transition-colors">
              Contact
            </a>
            <Link to="/arena/about-us" className="hover:text-[#272C27] transition-colors">About us</Link>
            <Link to="/arena/privacy-policy" className="hover:text-[#272C27] transition-colors">Privacy</Link>
            <Link to="/arena/terms-of-service" className="hover:text-[#272C27] transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
