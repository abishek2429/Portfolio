import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowUpRight, Clock, Sparkles } from 'lucide-react';
import { projectsData, ProjectItem, getProjectAction } from '../data/projectsData';

// Interactive 3D Tilt Preview Card Component
interface ProjectPreviewCardProps {
  project: ProjectItem;
  action: ReturnType<typeof getProjectAction>;
  onExplore: () => void;
}

const ProjectPreviewCard: React.FC<ProjectPreviewCardProps> = ({ project, action, onExplore }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  // Motion values for smooth 3D tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 200 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [7, -7]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-7, 7]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(xPct);
    mouseY.set(yPct);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      style={{ perspective: 1000 }}
      className={`relative w-full ${action.isAvailable ? 'cursor-pointer' : 'cursor-default'}`}
      onClick={() => action.isAvailable && onExplore()}
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative overflow-hidden rounded-2xl border border-deepBrown/15 bg-beige/35 shadow-editorial hover:shadow-editorial-hover transition-shadow duration-500"
      >
        <div className="aspect-[16/10] w-full overflow-hidden relative">
          <img
            src={project.previewImage}
            alt={`${project.name} Visual Composition`}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            loading="lazy"
          />

          {/* Interactive Floating Pill Overlay */}
          {action.isAvailable ? (
            <div className="absolute inset-0 bg-espresso/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
              <div className="px-5 py-2.5 rounded-full bg-cream/95 backdrop-blur-md border border-deepBrown/20 text-espresso text-xs font-mono font-medium shadow-sm inline-flex items-center gap-2 group-hover:scale-105 transition-transform">
                <span>{action.label}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-caramel" />
              </div>
            </div>
          ) : (
            <div className="absolute top-5 right-5">
              <span className="px-3.5 py-1.5 rounded-full bg-cream/90 backdrop-blur-md border border-deepBrown/20 font-mono text-[11px] text-mutedBrown flex items-center gap-1.5 shadow-sm">
                <Clock className="w-3 h-3 text-caramel" />
                <span>Coming Soon</span>
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export const ProjectsShowcase: React.FC = () => {
  const handleExploreClick = (project: ProjectItem) => {
    const action = getProjectAction(project);
    if (action.url) {
      window.open(action.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <section id="projects" className="py-28 md:py-36 border-t border-deepBrown/15 relative overflow-hidden">
      {/* Background Subtle Ambiance */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 right-0 w-[600px] h-[500px] bg-caramel/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 left-0 w-[500px] h-[400px] bg-beige/40 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-10">
        
        {/* Exhibition Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 pb-8 border-b border-deepBrown/15 gap-6">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-caramel font-semibold mb-3">
              <Sparkles className="w-4 h-4" />
              <span>Selected Works // Visual Exhibition</span>
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-espresso font-normal tracking-tight">
              Featured Projects
            </h2>
          </div>

          <div className="font-mono text-xs text-mutedBrown space-y-1 md:text-right">
            <span className="text-caramel font-bold tracking-wider block">
              03 CURATED EXHIBITS
            </span>
            <p className="font-sans text-sm text-mutedBrown max-w-xs font-light">
              Visual compositions and systems built by Abishek S.
            </p>
          </div>
        </div>

        {/* Exhibition Projects Stack */}
        <div className="space-y-32 md:space-y-44">
          {projectsData.map((project, index) => {
            const isEven = index % 2 === 1;
            const action = getProjectAction(project);

            return (
              <motion.article
                key={project.id}
                id={`project-${project.id}`}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="group relative scroll-mt-28"
              >
                <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center ${
                  isEven ? 'lg:grid-flow-dense' : ''
                }`}>
                  
                  {/* Large Visual Preview Canvas with 3D Tilt */}
                  <div className={`lg:col-span-7 ${isEven ? 'lg:col-start-6' : ''}`}>
                    <ProjectPreviewCard
                      project={project}
                      action={action}
                      onExplore={() => handleExploreClick(project)}
                    />
                  </div>

                  {/* Project Exhibition Info (Name, One Short Sentence, Subtle Explore Interaction) */}
                  <div className={`lg:col-span-5 flex flex-col justify-between space-y-7 ${
                    isEven ? 'lg:col-start-1' : ''
                  }`}>
                    
                    {/* Index & Category */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-3 border-b border-deepBrown/15 font-mono text-xs">
                        <span className="font-bold text-caramel tracking-widest text-sm">
                          0{index + 1}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-beige/80 border border-deepBrown/15 text-deepBrown text-[11px] font-medium">
                          {project.category}
                        </span>
                      </div>

                      {/* 1. Project Name */}
                      <h3
                        onClick={() => action.isAvailable && handleExploreClick(project)}
                        className={`font-serif text-4xl sm:text-5xl md:text-6xl text-espresso transition-colors font-medium leading-none tracking-tight ${
                          action.isAvailable ? 'hover:text-deepBrown cursor-pointer' : ''
                        }`}
                      >
                        {project.name}
                      </h3>

                      {/* 3. One Short Sentence Describing the Project */}
                      <p className="font-sans text-base sm:text-lg text-mutedBrown font-light leading-relaxed pt-2">
                        {project.oneLiner}
                      </p>
                    </div>

                    {/* 4. Subtle Explore Project Interaction */}
                    <div className="pt-2">
                      {action.isAvailable ? (
                        <button
                          onClick={() => handleExploreClick(project)}
                          className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-espresso hover:bg-deepBrown text-cream text-xs font-mono uppercase tracking-wider font-semibold transition-all shadow-sm hover:shadow-editorial active:scale-95 group/btn"
                        >
                          <span>{action.label}</span>
                          <ArrowUpRight className="w-4 h-4 text-caramel group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                        </button>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-beige/60 border border-deepBrown/20 text-mutedBrown text-xs font-mono">
                          <span className="w-2 h-2 rounded-full bg-caramel animate-pulse" />
                          <span className="font-medium text-deepBrown">Coming Soon</span>
                          <span className="text-[10px] text-mutedBrown/70">• In Active Development</span>
                        </div>
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
