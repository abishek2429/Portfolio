import React, { useState } from 'react';
import { GraduationCap, ArrowUpRight, Copy, Check, Github, Globe, Target, Sparkles, Terminal } from 'lucide-react';
import { portfolioData } from '../data/portfolioData';

export const Identity: React.FC = () => {
  const { profile, education } = portfolioData;
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(profile.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const currentInterests = [
    "Backend Engineering",
    "Application Development",
    "Algorithms",
    "System Design",
    "Cloud Technologies"
  ];

  const careerDirections = [
    "Backend Engineering",
    "Cloud Computing",
    "Distributed Systems",
    "DevOps & Automation",
    "Building Meaningful Software Products"
  ];

  return (
    <section id="identity" className="py-24 md:py-32 border-t border-deepBrown/15 bg-beige/20 relative">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        
        {/* Compact Editorial Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-6 border-b border-deepBrown/15 gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-caramel font-semibold mb-2">
              <Terminal className="w-4 h-4" />
              <span>§ 02 // Identity &amp; Trajectory</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-espresso font-normal tracking-tight">
              About &amp; Direction
            </h2>
          </div>
          <p className="font-mono text-xs text-mutedBrown uppercase tracking-wider max-w-sm md:text-right">
            Secondary profile context • PSG College of Technology, Coimbatore
          </p>
        </div>

        {/* Compact 2-Column Editorial Monograph Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          
          {/* Left Column (7 cols): Introduction, Current Interests & Career Direction */}
          <div className="lg:col-span-7 space-y-10">
            
            {/* Short Introduction */}
            <div className="space-y-4">
              <span className="font-mono text-[11px] uppercase tracking-wider text-caramel font-semibold block">
                Introduction
              </span>
              <p className="font-sans text-base sm:text-lg text-espresso/90 font-light leading-relaxed">
                I am <strong className="font-medium text-espresso">{profile.name}</strong>, a software developer
                based in <strong className="font-medium text-espresso">{profile.location}</strong>.
              </p>
              <p className="font-sans text-sm sm:text-base text-mutedBrown font-light leading-relaxed">
                {profile.intro} My engineering focus centers on constructing resilient backend architectures,
                structuring clean domain boundaries, analyzing algorithmic efficiency, and building reliable digital software.
              </p>
            </div>

            {/* Split Minimal Layout: Interests & Direction */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 border-t border-deepBrown/15">
              
              {/* Current Interests */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 font-mono text-xs text-espresso font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-caramel" />
                  <span>Current Interests</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentInterests.map((interest, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-full text-xs font-mono bg-cream border border-deepBrown/15 text-espresso shadow-xs"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>

              {/* Career Direction */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 font-mono text-xs text-espresso font-semibold">
                  <Target className="w-3.5 h-3.5 text-caramel" />
                  <span>Career Direction</span>
                </div>
                <ul className="space-y-2 font-sans text-xs sm:text-sm text-mutedBrown font-light">
                  {careerDirections.map((dir, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-caramel shrink-0" />
                      <span>{dir}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Education & Compact Contact */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Education Card (PSG College of Technology) */}
            <div className="bg-cream p-7 sm:p-8 rounded-2xl border border-deepBrown/15 shadow-editorial space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-deepBrown/15">
                <div className="flex items-center gap-2.5 font-mono text-xs text-espresso font-semibold">
                  <GraduationCap className="w-4 h-4 text-caramel" />
                  <span>Education</span>
                </div>
                <span className="font-mono text-[10px] text-mutedBrown">PSG TECH</span>
              </div>

              {/* Program 1: MCA */}
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-serif text-lg sm:text-xl text-espresso font-medium leading-snug">
                    {education[0].degree}
                  </h4>
                  {education[0].cgpa && (
                    <span className="px-2.5 py-0.5 rounded-full bg-beige border border-deepBrown/15 font-mono text-xs text-deepBrown font-semibold shrink-0">
                      CGPA: {education[0].cgpa}
                    </span>
                  )}
                </div>
                <p className="font-sans text-xs text-mutedBrown">
                  {education[0].institution}, Coimbatore
                </p>
                <div className="flex items-center gap-2 font-mono text-[11px] text-caramel pt-0.5 font-medium">
                  <span>{education[0].period}</span>
                  <span>•</span>
                  <span>{education[0].status}</span>
                </div>
              </div>

              <div className="h-px bg-deepBrown/10" />

              {/* Program 2: BSc CS */}
              <div className="space-y-1.5">
                <h4 className="font-serif text-lg sm:text-xl text-espresso font-medium leading-snug">
                  {education[1].degree}
                </h4>
                <p className="font-sans text-xs text-mutedBrown">
                  {education[1].institution}, Coimbatore
                </p>
                <div className="flex items-center gap-2 font-mono text-[11px] text-mutedBrown pt-0.5">
                  <span>{education[1].period}</span>
                  <span>•</span>
                  <span>Completed</span>
                </div>
              </div>
            </div>

            {/* Direct Contact & Coordinates Card */}
            <div className="bg-cream p-6 sm:p-7 rounded-2xl border border-deepBrown/15 shadow-editorial space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-deepBrown/15 font-mono text-xs">
                <span className="font-semibold text-espresso">Direct Coordinates</span>
                <span className="text-mutedBrown text-[11px]">Coimbatore, IN</span>
              </div>

              {/* Email Transmission Row */}
              <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-beige/40 border border-deepBrown/10">
                <a
                  href={`mailto:${profile.email}`}
                  className="font-mono text-xs sm:text-sm text-espresso font-semibold hover:text-deepBrown transition-colors break-all"
                  aria-label="Send email"
                >
                  {profile.email}
                </a>
                <button
                  onClick={handleCopyEmail}
                  className="p-2 rounded-lg bg-cream hover:bg-beige border border-deepBrown/15 text-espresso transition-all shrink-0 focus:outline-none"
                  title="Copy email address"
                  aria-label="Copy email address"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-caramel" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-mutedBrown" />
                  )}
                </button>
              </div>

              {/* Relays */}
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                <a
                  href={profile.github}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-beige/30 hover:bg-beige/70 border border-deepBrown/10 transition-colors group"
                >
                  <div className="flex items-center gap-2 text-espresso">
                    <Github className="w-3.5 h-3.5 text-caramel" />
                    <span>GitHub</span>
                  </div>
                  <ArrowUpRight className="w-3 h-3 text-mutedBrown group-hover:text-espresso group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>

                <a
                  href={profile.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-beige/30 hover:bg-beige/70 border border-deepBrown/10 transition-colors group"
                >
                  <div className="flex items-center gap-2 text-espresso">
                    <Globe className="w-3.5 h-3.5 text-caramel" />
                    <span>abishek.app</span>
                  </div>
                  <ArrowUpRight className="w-3 h-3 text-mutedBrown group-hover:text-espresso group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
