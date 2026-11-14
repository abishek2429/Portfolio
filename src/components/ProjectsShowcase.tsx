import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Github, FolderGit2, Cpu } from 'lucide-react';
import { projectsData, Project } from '../data/projectsData';

interface ProjectsShowcaseProps {
  onSelectProject: (project: Project) => void;
}

export const ProjectsShowcase: React.FC<ProjectsShowcaseProps> = ({ onSelectProject }) => {
  const handleProjectClick = (project: Project) => {
    if (project.project_url && project.project_url.trim().length > 0) {
      window.open(project.project_url, '_blank', 'noopener,noreferrer');
    } else {
      onSelectProject(project);
    }
  };

  return (
    <section id="projects" className="py-28 border-t border-deepBrown/15 relative">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 pb-8 border-b border-deepBrown/15 gap-6">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-caramel font-semibold mb-3">
              <FolderGit2 className="w-4 h-4" />
              <span>§ 01 / Curated Architectural Works</span>
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-espresso font-normal tracking-tight">
              Selected Software Projects
            </h2>
          </div>

          <div className="space-y-1 md:text-right">
            <span className="font-mono text-xs text-caramel font-bold block">
              03 PRODUCTION ARCHITECTURES
            </span>
            <p className="font-sans text-sm text-mutedBrown max-w-sm">
              Each project demonstrates scalable backend design, real-time synchronization, or automated assessment.
            </p>
          </div>
        </div>

        {/* Project Exhibit Stack */}
        <div className="space-y-24 md:space-y-32">
          {projectsData.map((project, index) => {
            const isEven = index % 2 === 1;

            return (
              <motion.article
                key={project.id}
                id={`project-${project.id}`}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="group relative scroll-mt-28"
              >
                <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center ${
                  isEven ? 'lg:grid-flow-dense' : ''
                }`}>
                  
                  {/* Visual Preview Exhibit Card */}
                  <div
                    onClick={() => handleProjectClick(project)}
                    className={`lg:col-span-7 cursor-pointer relative overflow-hidden rounded-xl border border-deepBrown/20 bg-beige/40 shadow-editorial group-hover:shadow-editorial-hover group-hover:border-deepBrown/40 transition-all duration-500 ${
                      isEven ? 'lg:col-start-6' : ''
                    }`}
                  >
                    {/* Aspect Frame */}
                    <div className="aspect-[16/10] w-full overflow-hidden relative">
                      <img
                        src={project.image}
                        alt={`${project.title} Architectural Blueprint`}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                        loading="lazy"
                      />

                      {/* Glass Overlay Pill on Hover */}
                      <div className="absolute inset-0 bg-espresso/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                        <div className="px-4 py-2 rounded-full bg-cream/95 backdrop-blur-md border border-deepBrown/20 text-espresso text-xs font-mono font-medium shadow-sm inline-flex items-center gap-2">
                          <span>{project.project_url ? 'Visit Live Deployment' : 'Examine Architecture Monograph'}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-caramel" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Project Intelligence & Context */}
                  <div className={`lg:col-span-5 flex flex-col justify-between space-y-6 ${
                    isEven ? 'lg:col-start-1' : ''
                  }`}>
                    
                    {/* Top Identity Meta */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-3 border-b border-deepBrown/15 font-mono text-xs">
                        <span className="font-bold text-caramel tracking-widest">
                          PROJECT // 0{index + 1}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-beige border border-deepBrown/15 text-deepBrown text-[11px] font-medium">
                          {project.year || '2024'}
                        </span>
                      </div>

                      <span className="font-mono text-xs text-mutedBrown uppercase tracking-wider block">
                        {project.category}
                      </span>

                      <h3
                        onClick={() => handleProjectClick(project)}
                        className="font-serif text-3xl sm:text-4xl text-espresso hover:text-deepBrown transition-colors cursor-pointer font-medium leading-tight"
                      >
                        {project.title}
                      </h3>

                      <p className="font-sans text-sm sm:text-base text-mutedBrown font-light leading-relaxed">
                        {project.description}
                      </p>
                    </div>

                    {/* Key Architectural Highlights / Metrics */}
                    <div className="p-4 rounded-lg bg-beige/35 border border-deepBrown/10 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-mono text-espresso font-semibold">
                        <Cpu className="w-3.5 h-3.5 text-caramel" />
                        <span>Core Engineering Focus:</span>
                      </div>
                      <p className="font-mono text-xs text-deepBrown/90">
                        {project.stats || project.detailed_description.proposed_solution.slice(0, 110) + '...'}
                      </p>
                    </div>

                    {/* Technology Badges */}
                    <div className="space-y-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-mutedBrown block font-semibold">
                        System Technologies
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {project.technologies.map((tech, tIdx) => (
                          <span
                            key={tIdx}
                            className="px-3 py-1 rounded text-xs font-mono bg-cream border border-deepBrown/15 text-espresso shadow-xs"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Interactive CTAs */}
                    <div className="pt-4 flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => handleProjectClick(project)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-espresso hover:bg-deepBrown text-cream text-xs font-mono uppercase tracking-wider font-semibold transition-all shadow-sm active:scale-95 group/btn"
                      >
                        <span>{project.project_url ? 'Launch Website' : 'Examine Monograph'}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-caramel group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                      </button>

                      {project.github_url && (
                        <a
                          href={project.github_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-beige/60 hover:bg-beige border border-deepBrown/15 hover:border-caramel text-xs font-mono text-espresso transition-all shadow-sm active:scale-95"
                          aria-label={`View ${project.title} on GitHub`}
                        >
                          <Github className="w-4 h-4 text-caramel" />
                          <span>Source Code</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
