import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowUpRight, Github, Linkedin, MapPin, Sparkles } from 'lucide-react';
import { portfolioData } from '../data/portfolioData';
import { projectsData } from '../data/projectsData';

export const Hero: React.FC = () => {
  const { profile } = portfolioData;

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="relative min-h-[92vh] pt-32 pb-20 flex flex-col justify-between overflow-hidden">
      {/* Subtle Background Architectural Elements */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        {/* Ambient Warm Gradient Spotlight */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-beige/40 rounded-full blur-[120px] opacity-70" />
        <div className="absolute top-1/3 right-10 w-[350px] h-[250px] bg-caramel/15 rounded-full blur-[90px] opacity-50" />
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-10 w-full flex-grow flex flex-col justify-between">
        
        {/* Top Masthead Telemetry */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-deepBrown/15 font-mono text-xs text-mutedBrown"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-caramel animate-ping" />
            <span className="text-espresso font-semibold tracking-wider">PROJECT-CENTRIC FOLIO</span>
            <span className="text-deepBrown/30">•</span>
            <span className="text-mutedBrown">EDITION 2024–2025</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-espresso">
              <MapPin className="w-3.5 h-3.5 text-caramel" />
              <span>{profile.location}</span>
            </span>
            <span className="text-deepBrown/30 hidden sm:inline">•</span>
            <span className="hidden sm:inline text-mutedBrown">PSG TECH • MCA</span>
          </div>
        </motion.div>

        {/* Massive Editorial Headline */}
        <div className="my-auto py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-beige/60 border border-deepBrown/15 text-deepBrown text-xs font-mono">
              <Sparkles className="w-3 h-3 text-caramel" />
              <span>Identity &amp; Portfolio of Abishek S</span>
            </div>

            <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-espresso tracking-tight leading-[1.04] font-normal">
              Software Developer <br className="hidden sm:inline" />
              <span className="italic font-light text-deepBrown">Crafting Resilient</span> Systems.
            </h1>

            <p className="max-w-2xl font-sans text-base sm:text-lg md:text-xl text-mutedBrown font-light leading-relaxed pt-2">
              Focused on <strong className="font-medium text-espresso">backend engineering</strong>,{' '}
              <strong className="font-medium text-espresso">multi-tenant SaaS architectures</strong>,{' '}
              and <strong className="font-medium text-espresso">real-time applications</strong>. Built with
              correctness, scalability, and clean domain abstractions.
            </p>
          </motion.div>

          {/* Quick Interactive Project Access Chips (What I Have Built) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="pt-8 flex flex-wrap items-center gap-3"
          >
            <span className="font-mono text-xs uppercase tracking-wider text-mutedBrown block mr-1">
              Direct Showcase:
            </span>
            {projectsData.map((project, idx) => (
              <a
                key={project.id}
                href={`#project-${project.id}`}
                className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cream hover:bg-beige border border-deepBrown/15 hover:border-caramel text-xs font-mono text-espresso transition-all shadow-sm active:scale-95"
              >
                <span className="text-caramel font-bold">0{idx + 1}</span>
                <span className="font-semibold">{project.name}</span>
                <span className="text-[10px] text-mutedBrown hidden sm:inline">
                  [{project.category.split(' ')[0]}]
                </span>
                <ArrowDown className="w-3 h-3 text-mutedBrown group-hover:text-espresso group-hover:translate-y-0.5 transition-all" />
              </a>
            ))}
          </motion.div>

          {/* Action Triggers & Social Coordinates */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="pt-10 flex flex-wrap items-center gap-4 sm:gap-6"
          >
            <button
              onClick={() => scrollToSection('projects')}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-espresso hover:bg-deepBrown text-cream text-xs font-mono uppercase tracking-wider font-semibold transition-all shadow-editorial hover:shadow-editorial-hover active:scale-[0.98] group"
            >
              <span>Explore Selected Works</span>
              <ArrowDown className="w-4 h-4 text-caramel group-hover:translate-y-0.5 transition-transform" />
            </button>

            <a
              href={profile.github}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full bg-beige/60 hover:bg-beige border border-deepBrown/15 hover:border-caramel text-xs font-mono text-espresso font-medium transition-all shadow-sm"
              aria-label="GitHub Profile"
            >
              <Github className="w-4 h-4 text-caramel" />
              <span>github.com/{profile.githubUsername}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-mutedBrown" />
            </a>

            <a
              href={profile.linkedin}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full bg-beige/60 hover:bg-beige border border-deepBrown/15 hover:border-caramel text-xs font-mono text-espresso font-medium transition-all shadow-sm"
              aria-label="LinkedIn Profile"
            >
              <Linkedin className="w-4 h-4 text-caramel" />
              <span>LinkedIn</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-mutedBrown" />
            </a>
          </motion.div>
        </div>

        {/* Bottom Hero Anchor Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="pt-6 border-t border-deepBrown/10 flex items-center justify-between text-xs font-mono text-mutedBrown"
        >
          <div className="flex items-center gap-3">
            <span className="text-espresso font-semibold">03 Core Architectures</span>
            <span>•</span>
            <span>FastAPI, Next.js, Socket.io, Java, ASAG NLP</span>
          </div>

          <button
            onClick={() => scrollToSection('projects')}
            className="hidden md:inline-flex items-center gap-1.5 hover:text-espresso transition-colors"
          >
            <span>Scroll to Discover</span>
            <ArrowDown className="w-3.5 h-3.5 text-caramel animate-bounce" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};
