import React from 'react';
import {
  Code2,
  Server,
  Layout,
  Database,
  Cloud,
  Terminal,
  Cpu,
  Layers,
  Sparkles,
  GitBranch,
  Github,
  Box,
  Flame,
  Globe,
  Monitor
} from 'lucide-react';
import { portfolioData } from '../data/portfolioData';

export const Skills: React.FC = () => {
  const { skills } = portfolioData;

  // Category Icon Mapping
  const categoryIconMap: Record<string, React.ReactNode> = {
    programming: <Code2 className="w-4 h-4 text-caramel" />,
    backend: <Server className="w-4 h-4 text-caramel" />,
    frontend: <Layout className="w-4 h-4 text-caramel" />,
    database: <Database className="w-4 h-4 text-caramel" />,
    'devops-cloud': <Cloud className="w-4 h-4 text-caramel" />,
    tools: <Terminal className="w-4 h-4 text-caramel" />
  };

  // Technology Subtle Icon Mapping
  const techIconMap: Record<string, React.ReactNode> = {
    Java: <CoffeeCupIcon />,
    Python: <Code2 className="w-3.5 h-3.5 text-deepBrown/70" />,
    C: <Cpu className="w-3.5 h-3.5 text-deepBrown/70" />,
    Kotlin: <Layers className="w-3.5 h-3.5 text-deepBrown/70" />,
    'Spring Boot': <Flame className="w-3.5 h-3.5 text-deepBrown/70" />,
    'REST APIs': <Globe className="w-3.5 h-3.5 text-deepBrown/70" />,
    React: <AtomIcon />,
    HTML: <Code2 className="w-3.5 h-3.5 text-deepBrown/70" />,
    CSS: <Layout className="w-3.5 h-3.5 text-deepBrown/70" />,
    JavaScript: <ScriptIcon />,
    PostgreSQL: <Database className="w-3.5 h-3.5 text-deepBrown/70" />,
    MongoDB: <Database className="w-3.5 h-3.5 text-deepBrown/70" />,
    MySQL: <Database className="w-3.5 h-3.5 text-deepBrown/70" />,
    Docker: <Box className="w-3.5 h-3.5 text-deepBrown/70" />,
    Jenkins: <Server className="w-3.5 h-3.5 text-deepBrown/70" />,
    Ansible: <Cloud className="w-3.5 h-3.5 text-deepBrown/70" />,
    AWS: <Cloud className="w-3.5 h-3.5 text-deepBrown/70" />,
    Git: <GitBranch className="w-3.5 h-3.5 text-deepBrown/70" />,
    GitHub: <Github className="w-3.5 h-3.5 text-deepBrown/70" />,
    Linux: <Terminal className="w-3.5 h-3.5 text-deepBrown/70" />,
    'IntelliJ IDEA': <Monitor className="w-3.5 h-3.5 text-deepBrown/70" />,
    'Visual Studio Code': <Code2 className="w-3.5 h-3.5 text-deepBrown/70" />
  };

  return (
    <section id="skills" className="py-24 bg-beige/30 border-t border-deepBrown/15">
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-6 border-b border-deepBrown/15 gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-caramel font-semibold mb-2">
              <Cpu className="w-4 h-4" />
              <span>§ 04 / Technical Arsenal</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-espresso font-normal">
              Skills &amp; Technologies
            </h2>
          </div>
          <p className="font-mono text-xs text-mutedBrown uppercase tracking-wider max-w-xs md:text-right">
            Practiced proficiencies across systems, data, and developer tooling
          </p>
        </div>

        {/* 6 Visually Distinct Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map((category, idx) => (
            <div
              key={category.id || idx}
              className="bg-cream p-7 rounded-sm border border-deepBrown/15 shadow-editorial flex flex-col justify-between hover:border-deepBrown/30 transition-all duration-300"
            >
              <div>
                {/* Category Header */}
                <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-deepBrown/15">
                  <div className="flex items-center gap-2.5">
                    {categoryIconMap[category.id] || <Code2 className="w-4 h-4 text-caramel" />}
                    <h3 className="font-serif text-xl text-espresso font-medium tracking-tight">
                      {category.title}
                    </h3>
                  </div>
                  <span className="font-mono text-xs text-caramel font-bold">
                    0{idx + 1}
                  </span>
                </div>

                {/* Category Description */}
                <p className="text-xs text-mutedBrown font-light mb-5 leading-relaxed min-h-[32px]">
                  {category.description}
                </p>

                {/* Skills Tiles List */}
                <div className="space-y-2">
                  {category.skills.map((skill, sIdx) => (
                    <div
                      key={sIdx}
                      className="group flex items-center justify-between px-3.5 py-2.5 rounded bg-beige/45 hover:bg-beige/85 border border-deepBrown/10 hover:border-caramel transition-all duration-200"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-deepBrown/70 group-hover:text-caramel transition-colors">
                          {techIconMap[skill.name] || (
                            <span className="w-1.5 h-1.5 rounded-full bg-caramel inline-block" />
                          )}
                        </span>
                        <span className="text-sm font-medium text-espresso group-hover:text-deepBrown transition-colors">
                          {skill.name}
                        </span>
                      </div>

                      {/* Subtle status dot on hover */}
                      <span className="w-1.5 h-1.5 rounded-full bg-caramel opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Technical Philosophy Note */}
        <div className="mt-12 p-8 bg-cream rounded-sm border border-deepBrown/15 shadow-editorial flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <h4 className="font-serif text-lg font-medium text-espresso flex items-center gap-2">
              <Terminal className="w-4 h-4 text-caramel" />
              <span>Engineering Stance: Grounded Fundamentals</span>
            </h4>
            <p className="text-xs sm:text-sm text-mutedBrown leading-relaxed font-light">
              Rather than claiming exhaustive omniscience, I focus on strong computational principles—solid object-oriented design, deterministic data schemas, algorithmic efficiency, and repeatable build environments. Tools evolve, but architectural clarity remains constant.
            </p>
          </div>

          <div className="font-mono text-xs text-espresso shrink-0">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-beige border border-deepBrown/15">
              <Sparkles className="w-3.5 h-3.5 text-caramel" />
              <span>6 Technology Disciplines</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

// Subtle Micro Icons
function CoffeeCupIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-deepBrown/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <line x1="6" y1="2" x2="6" y2="4" />
      <line x1="10" y1="2" x2="10" y2="4" />
      <line x1="14" y1="2" x2="14" y2="4" />
    </svg>
  );
}

function AtomIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-deepBrown/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <path d="M20.2 20.2c2.4-2.4 2.4-6.3 0-8.7-2.4-2.4-6.3-2.4-8.7 0s-2.4 6.3 0 8.7c2.4 2.4 6.3 2.4 8.7 0Z" />
      <path d="M3.8 20.2c-2.4-2.4-2.4-6.3 0-8.7 2.4-2.4 6.3-2.4 8.7 0s2.4 6.3 0 8.7c-2.4 2.4-6.3 2.4-8.7 0Z" />
    </svg>
  );
}

function ScriptIcon() {
  return (
    <span className="font-mono text-[10px] font-bold text-deepBrown/70 leading-none">
      JS
    </span>
  );
}
