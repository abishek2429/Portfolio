import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Github, ArrowUpRight, FolderGit2 } from 'lucide-react';
import { projectsData, Project } from '../data/projectsData';
import { ProjectDetailModal } from './ProjectDetailModal';

export const Projects: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalProject, setModalProject] = useState<Project | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartXRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalProjects = projectsData.length;

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? totalProjects - 1 : prev - 1));
  }, [totalProjects]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === totalProjects - 1 ? 0 : prev + 1));
  }, [totalProjects]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (modalProject) return;
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext, modalProject]);

  // Mouse Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    setDragOffset(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const diff = e.clientX - dragStartXRef.current;
    setDragOffset(diff);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    if (dragOffset > 50) {
      goToPrevious();
    } else if (dragOffset < -50) {
      goToNext();
    }
    setIsDragging(false);
    setDragOffset(0);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      if (dragOffset > 50) {
        goToPrevious();
      } else if (dragOffset < -50) {
        goToNext();
      }
      setIsDragging(false);
      setDragOffset(0);
    }
  };

  // Touch Swipe Handlers for Mobile
  const touchStartXRef = useRef<number>(0);
  const touchDeltaRef = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchDeltaRef.current = 0;
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const diff = e.touches[0].clientX - touchStartXRef.current;
    touchDeltaRef.current = diff;
    setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    const diff = touchDeltaRef.current;
    if (diff > 50) {
      goToPrevious();
    } else if (diff < -50) {
      goToNext();
    }
    setDragOffset(0);
  };

  // Project Click Behaviour:
  // If project_url has valid URL -> open in new browser tab.
  // If project_url is null or empty -> open internal details modal.
  const handleProjectClick = (project: Project) => {
    if (Math.abs(dragOffset) > 10) return;

    if (project.project_url && project.project_url.trim().length > 0) {
      window.open(project.project_url, '_blank', 'noopener,noreferrer');
    } else {
      setModalProject(project);
    }
  };

  const activeProject = projectsData[currentIndex];
  const activePositionStr = `${(currentIndex + 1).toString().padStart(2, '0')} / ${totalProjects.toString().padStart(2, '0')}`;

  return (
    <section id="projects" className="py-24 border-t border-deepBrown/15 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6 border-b border-deepBrown/15 gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-caramel font-semibold mb-2">
              <FolderGit2 className="w-4 h-4" />
              <span>§ 03 / Project Showcase</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-espresso font-normal">
              Featured Architectures
            </h2>
          </div>

          {/* Navigation Controls & Position Indicator */}
          <div className="flex items-center gap-4">
            <span className="font-mono text-sm tracking-wider text-mutedBrown font-semibold">
              {activePositionStr}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevious}
                className="p-2.5 rounded bg-cream hover:bg-beige border border-deepBrown/20 text-espresso transition-all hover:border-caramel focus:outline-none focus:ring-1 focus:ring-caramel active:scale-95 shadow-sm"
                aria-label="Previous project"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goToNext}
                className="p-2.5 rounded bg-cream hover:bg-beige border border-deepBrown/20 text-espresso transition-all hover:border-caramel focus:outline-none focus:ring-1 focus:ring-caramel active:scale-95 shadow-sm"
                aria-label="Next project"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Sliding Showcase Stage Container */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            transform: isDragging ? `translateX(${dragOffset * 0.35}px)` : 'translateX(0px)',
            transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          className="relative select-none cursor-grab active:cursor-grabbing"
          tabIndex={0}
          aria-roledescription="carousel"
          aria-label="Project showcase carousel"
        >
          {/* Main Slide Card with subtle cross-fade on index change */}
          <div
            key={activeProject.id}
            className="bg-cream rounded-sm border border-deepBrown/20 shadow-editorial p-6 sm:p-10 md:p-12 transition-all duration-300 animate-editorial-fade"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column: Large Project Preview Visual */}
              <div
                onClick={() => handleProjectClick(activeProject)}
                className="lg:col-span-7 group/img cursor-pointer relative overflow-hidden rounded bg-beige border border-deepBrown/15 shadow-sm"
              >
                <div className="aspect-[16/10] w-full flex items-center justify-center overflow-hidden">
                  <img
                    src={activeProject.image}
                    alt={`${activeProject.title} architectural blueprint`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-[1.02]"
                    draggable={false}
                  />
                </div>

                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-espresso/10 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end p-4">
                  <span className="text-xs font-mono px-3 py-1 bg-cream/90 text-espresso rounded border border-deepBrown/15 shadow-sm inline-flex items-center gap-1.5">
                    <span>{activeProject.project_url ? 'Visit Website' : 'Examine Monograph'}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-caramel" />
                  </span>
                </div>
              </div>

              {/* Right Column: Project Information */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                <div>
                  {/* Top Meta Bar */}
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-deepBrown/15 font-mono text-xs">
                    <span className="font-bold text-caramel tracking-wider">
                      PROJECT #{(currentIndex + 1).toString().padStart(2, '0')}
                    </span>
                    <span className="px-2.5 py-0.5 rounded bg-beige border border-deepBrown/15 text-deepBrown text-[11px]">
                      {activeProject.category}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    onClick={() => handleProjectClick(activeProject)}
                    className="font-serif text-3xl sm:text-4xl text-espresso font-normal cursor-pointer hover:text-deepBrown transition-colors leading-tight"
                  >
                    {activeProject.title}
                  </h3>

                  {/* Description */}
                  <p className="font-sans text-sm sm:text-base text-mutedBrown font-light leading-relaxed mt-3">
                    {activeProject.description}
                  </p>

                  {/* Technologies Used */}
                  <div className="pt-6">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-mutedBrown block mb-2 font-semibold">
                      Technologies &amp; Architecture
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeProject.technologies.map((tech, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 text-xs font-mono text-espresso bg-beige/60 border border-deepBrown/15 rounded"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Slide Action Buttons */}
                <div className="pt-6 border-t border-deepBrown/15 flex flex-wrap items-center justify-between gap-4">
                  {/* Primary Trigger (Click Behavior) */}
                  <button
                    onClick={() => handleProjectClick(activeProject)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-espresso hover:bg-deepBrown text-cream text-xs font-mono uppercase tracking-wider font-semibold rounded-sm transition-colors shadow-sm group/btn"
                  >
                    <span>{activeProject.project_url ? 'Launch Website' : 'Explore Architecture'}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-caramel group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </button>

                  {/* GitHub Repository Link */}
                  {activeProject.github_url && (
                    <a
                      href={activeProject.github_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-beige/60 hover:bg-beige border border-deepBrown/15 text-xs font-mono text-espresso transition-colors"
                      aria-label="View source repository on GitHub"
                    >
                      <Github className="w-4 h-4 text-caramel" />
                      <span>Source</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Slide Thumbnails / Indicators */}
        <div className="mt-8 flex items-center justify-between flex-wrap gap-4 font-mono text-xs text-mutedBrown">
          <div className="flex items-center gap-2">
            {projectsData.map((proj, idx) => (
              <button
                key={proj.id}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 transition-all duration-300 rounded-full ${
                  currentIndex === idx
                    ? 'w-10 bg-espresso'
                    : 'w-3 bg-deepBrown/25 hover:bg-deepBrown/50'
                }`}
                aria-label={`Go to project ${idx + 1}`}
              />
            ))}
          </div>

          <span className="text-[11px] text-mutedBrown hidden sm:inline">
            Drag, swipe, or use keyboard ← → arrows to navigate
          </span>
        </div>

        {/* Modal for In-Depth Architectural Details */}
        <ProjectDetailModal
          project={modalProject}
          onClose={() => setModalProject(null)}
        />
      </div>
    </section>
  );
};
