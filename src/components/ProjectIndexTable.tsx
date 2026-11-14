import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, Github, Layers, Sparkles } from 'lucide-react';
import { projectsData, Project } from '../data/projectsData';

interface ProjectIndexTableProps {
  onSelectProject: (project: Project) => void;
}

export const ProjectIndexTable: React.FC<ProjectIndexTableProps> = ({ onSelectProject }) => {
  const [hoveredProject, setHoveredProject] = useState<Project | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleRowClick = (project: Project) => {
    if (project.project_url && project.project_url.trim().length > 0) {
      window.open(project.project_url, '_blank', 'noopener,noreferrer');
    } else {
      onSelectProject(project);
    }
  };

  return (
    <section id="index-table" className="py-24 border-t border-deepBrown/15 relative overflow-hidden bg-beige/25">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6 border-b border-deepBrown/15 gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-caramel font-semibold mb-2">
              <Layers className="w-4 h-4" />
              <span>§ 02 / Archive &amp; Index</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-espresso font-normal">
              Project Index Directory
            </h2>
          </div>
          <p className="font-mono text-xs text-mutedBrown uppercase tracking-wider max-w-sm md:text-right">
            Hover each row to preview architecture schematics. Click to inspect or open source.
          </p>
        </div>

        {/* Interactive Table Container */}
        <div
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredProject(null)}
          className="relative rounded-sm border border-deepBrown/15 bg-cream shadow-editorial divide-y divide-deepBrown/15"
        >
          {/* Table Header Row */}
          <div className="hidden sm:grid grid-cols-12 px-6 py-3.5 bg-beige/40 font-mono text-xs uppercase tracking-wider text-mutedBrown font-semibold">
            <span className="col-span-1">No.</span>
            <span className="col-span-4">Project &amp; Identity</span>
            <span className="col-span-3">Role &amp; Domain</span>
            <span className="col-span-3">Technologies</span>
            <span className="col-span-1 text-right">Action</span>
          </div>

          {/* Table Body Rows */}
          {projectsData.map((project, idx) => (
            <div
              key={project.id}
              onMouseEnter={() => setHoveredProject(project)}
              onClick={() => handleRowClick(project)}
              className="grid grid-cols-1 sm:grid-cols-12 px-6 py-6 sm:py-5 items-center gap-3 sm:gap-0 cursor-pointer group hover:bg-beige/50 transition-colors"
            >
              {/* Number */}
              <div className="sm:col-span-1 font-mono text-xs text-caramel font-bold">
                0{idx + 1}
              </div>

              {/* Title & Category */}
              <div className="sm:col-span-4 space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-xl sm:text-2xl text-espresso group-hover:text-deepBrown transition-colors font-medium">
                    {project.title}
                  </h3>
                  <ArrowUpRight className="w-4 h-4 text-caramel opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <span className="font-mono text-[11px] text-mutedBrown block">
                  {project.category}
                </span>
              </div>

              {/* Role & Domain */}
              <div className="sm:col-span-3 font-mono text-xs text-espresso/80">
                <span>{project.role || 'Full-Stack Developer'}</span>
                <span className="block text-[11px] text-mutedBrown">{project.year || '2024'}</span>
              </div>

              {/* Technologies */}
              <div className="sm:col-span-3 flex flex-wrap gap-1.5">
                {project.technologies.slice(0, 3).map((tech, tIdx) => (
                  <span
                    key={tIdx}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-beige/80 border border-deepBrown/15 text-espresso"
                  >
                    {tech}
                  </span>
                ))}
                {project.technologies.length > 3 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-mutedBrown">
                    +{project.technologies.length - 3}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="sm:col-span-1 flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                {project.github_url ? (
                  <a
                    href={project.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded bg-beige/60 hover:bg-beige border border-deepBrown/15 text-espresso transition-colors"
                    title="Open GitHub Repository"
                    aria-label={`Open GitHub for ${project.title}`}
                  >
                    <Github className="w-4 h-4 text-caramel" />
                  </a>
                ) : (
                  <button
                    onClick={() => onSelectProject(project)}
                    className="p-2 rounded bg-beige/60 hover:bg-beige border border-deepBrown/15 text-espresso transition-colors text-[10px] font-mono"
                    title="Examine Architecture"
                  >
                    <Sparkles className="w-4 h-4 text-caramel" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Floating Cursor Hover Preview Card (Awwwards Creative Studio signature) */}
          <AnimatePresence>
            {hoveredProject && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: mousePos.x + 24,
                  y: mousePos.y - 120,
                }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350, mass: 0.3 }}
                className="pointer-events-none hidden lg:block absolute top-0 left-0 z-30 w-80 rounded-lg overflow-hidden border border-deepBrown/25 bg-cream shadow-editorial-hover"
              >
                <div className="aspect-[16/10] w-full overflow-hidden bg-beige">
                  <img
                    src={hoveredProject.image}
                    alt={hoveredProject.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3 bg-cream border-t border-deepBrown/15 flex items-center justify-between">
                  <div>
                    <span className="font-serif font-semibold text-sm text-espresso block">
                      {hoveredProject.title}
                    </span>
                    <span className="font-mono text-[10px] text-mutedBrown block">
                      {hoveredProject.stats || hoveredProject.category}
                    </span>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-espresso text-cream">
                    Click to Open
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
