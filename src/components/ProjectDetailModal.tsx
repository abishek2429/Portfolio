import React, { useEffect } from 'react';
import { X, Github, ExternalLink, Cpu, AlertCircle, Lightbulb, CheckCircle2, Layers } from 'lucide-react';
import { Project } from '../data/projectsData';

interface ProjectDetailModalProps {
  project: Project | null;
  onClose: () => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({ project, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (project) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [project, onClose]);

  if (!project) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-project-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-espresso/65 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-cream rounded-sm border border-deepBrown/25 shadow-2xl p-6 sm:p-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dismiss Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-mutedBrown hover:text-espresso bg-beige rounded-sm border border-deepBrown/15 transition-colors"
          aria-label="Close project modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="border-b border-deepBrown/15 pb-6 mb-6">
          <div className="flex items-center gap-3 font-mono text-xs text-caramel uppercase tracking-widest font-semibold mb-2">
            <span>{project.category}</span>
            <span className="text-deepBrown/30">•</span>
            <span>Case Monograph</span>
          </div>

          <h3 id="modal-project-title" className="font-serif text-3xl sm:text-4xl text-espresso font-normal">
            {project.title}
          </h3>

          <p className="font-sans text-sm sm:text-base text-mutedBrown font-light mt-2 leading-relaxed">
            {project.description}
          </p>
        </div>

        {/* Modal Content Sections */}
        <div className="space-y-6">
          {/* Project Overview */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-deepBrown font-semibold mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-caramel" />
              <span>Project Overview</span>
            </h4>
            <p className="text-sm sm:text-base text-espresso/90 leading-relaxed font-light">
              {project.detailed_description.overview}
            </p>
          </div>

          {/* Problem Statement Callout */}
          <div className="p-5 bg-beige/60 rounded-sm border border-deepBrown/20">
            <h4 className="font-mono text-xs uppercase tracking-wider text-deepBrown font-semibold mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-caramel" />
              <span>Problem Statement</span>
            </h4>
            <p className="text-sm text-espresso/90 leading-relaxed font-light">
              {project.detailed_description.problem_statement}
            </p>
          </div>

          {/* Proposed Solution */}
          <div className="p-5 bg-cream rounded-sm border border-deepBrown/20">
            <h4 className="font-mono text-xs uppercase tracking-wider text-deepBrown font-semibold mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-caramel" />
              <span>Proposed Solution &amp; Architecture</span>
            </h4>
            <p className="text-sm text-espresso/90 leading-relaxed font-light">
              {project.detailed_description.proposed_solution}
            </p>
          </div>

          {/* Technologies Used */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-mutedBrown font-semibold mb-2.5">
              Technologies &amp; Tools Used
            </h4>
            <div className="flex flex-wrap gap-2">
              {project.technologies.map((t, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 text-xs font-mono text-espresso bg-beige border border-deepBrown/15 rounded"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Main Features */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-deepBrown font-semibold mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-caramel" />
              <span>Key Engineered Features</span>
            </h4>
            <ul className="space-y-2.5">
              {project.detailed_description.main_features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-espresso/90">
                  <CheckCircle2 className="w-4 h-4 text-caramel shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="pt-8 mt-8 border-t border-deepBrown/15 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {project.github_url && (
              <a
                href={project.github_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-espresso text-cream hover:bg-deepBrown rounded text-xs font-mono transition-colors"
              >
                <Github className="w-4 h-4 text-caramel" />
                <span>GitHub Repository</span>
              </a>
            )}

            {project.project_url && (
              <a
                href={project.project_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-beige hover:bg-beige-dark text-espresso border border-deepBrown/20 rounded text-xs font-mono transition-colors"
              >
                <span>Live Project</span>
                <ExternalLink className="w-3.5 h-3.5 text-caramel" />
              </a>
            )}
          </div>

          <button
            onClick={onClose}
            className="text-xs font-mono text-mutedBrown hover:text-espresso underline underline-offset-4"
          >
            Close Monograph
          </button>
        </div>
      </div>
    </div>
  );
};

