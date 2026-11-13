import React from 'react';
import { ArrowDown, ArrowUpRight, MapPin, Github, Linkedin, Terminal } from 'lucide-react';
import { portfolioData } from '../data/portfolioData';

export const Hero: React.FC = () => {
  const { profile } = portfolioData;

  return (
    <section id="home" className="relative min-h-[92vh] pt-28 md:pt-36 pb-16 flex flex-col justify-between">
      <div className="max-w-6xl mx-auto w-full px-6 md:px-10">
        {/* Subtle Editorial Masthead */}
        <div className="border-b border-deepBrown/15 pb-4 mb-10 flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-mutedBrown uppercase tracking-wider animate-editorial-fade">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-deepBrown font-medium">
              <span className="w-2 h-2 rounded-full bg-caramel animate-pulse" />
              {profile.domain}
            </span>
            <span className="text-deepBrown/30">•</span>
            <span>Folio 2026</span>
          </div>

          {/* Subtle Location Indicator */}
          <div className="flex items-center gap-2.5 text-deepBrown">
            <MapPin className="w-3.5 h-3.5 text-caramel shrink-0" />
            <span className="font-medium tracking-normal text-xs">{profile.location}</span>
            <span className="text-deepBrown/30 hidden sm:inline">•</span>
            <span className="font-mono text-[11px] text-mutedBrown hidden sm:inline">{profile.coordinates}</span>
          </div>
        </div>

        {/* Hero Identity & Prominent Typography */}
        <div className="space-y-6 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-beige border border-deepBrown/15 text-deepBrown text-xs font-mono tracking-wide animate-editorial-fade">
            <Terminal className="w-3.5 h-3.5 text-caramel" />
            <span>{profile.title}</span>
          </div>

          {/* Prominent Name */}
          <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-normal tracking-tight text-espresso leading-[0.95] uppercase animate-editorial-fade animation-delay-150">
            {profile.name}
          </h1>

          {/* Short Professional Introduction */}
          <p className="font-sans text-xl sm:text-2xl md:text-3xl text-deepBrown font-light leading-relaxed max-w-3xl pt-2 animate-editorial-fade animation-delay-300">
            {profile.intro}
          </p>
        </div>

        {/* Buttons & Social Relays */}
        <div className="pt-10 flex flex-wrap items-center gap-4 sm:gap-6 animate-editorial-fade animation-delay-450">
          {/* View Projects Button */}
          <a
            href="#projects"
            className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-espresso text-cream hover:bg-deepBrown transition-all duration-200 text-sm font-medium rounded-sm shadow-editorial group active:scale-[0.98]"
          >
            <span>View Projects</span>
            <ArrowUpRight className="w-4 h-4 text-caramel group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>

          {/* Contact Me Button */}
          <a
            href="#contact"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-beige hover:bg-beige-dark text-espresso border border-deepBrown/20 hover:border-caramel transition-all duration-200 text-sm font-medium rounded-sm active:scale-[0.98]"
          >
            <span>Contact Me</span>
          </a>

          {/* Direct GitHub & LinkedIn Links */}
          <div className="flex items-center gap-3 sm:ml-4 sm:pl-6 sm:border-l sm:border-deepBrown/20">
            <a
              href={profile.github}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded bg-cream hover:bg-beige border border-deepBrown/15 text-espresso text-xs font-mono transition-colors group active:scale-[0.98]"
              aria-label="View GitHub Profile"
            >
              <Github className="w-4 h-4 text-caramel group-hover:text-espresso transition-colors" />
              <span className="hidden sm:inline">GitHub</span>
            </a>

            <a
              href={profile.linkedin}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded bg-cream hover:bg-beige border border-deepBrown/15 text-espresso text-xs font-mono transition-colors group active:scale-[0.98]"
              aria-label="View LinkedIn Profile"
            >
              <Linkedin className="w-4 h-4 text-caramel group-hover:text-espresso transition-colors" />
              <span className="hidden sm:inline">LinkedIn</span>
            </a>
          </div>
        </div>
      </div>

      {/* Editorial Bottom Navigation Index Ribbon */}
      <div className="max-w-6xl mx-auto w-full px-6 md:px-10 mt-16 pt-8 border-t border-deepBrown/15">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 font-mono text-xs">
          {[
            { num: '§ 01', label: 'About', href: '#about' },
            { num: '§ 02', label: 'Education', href: '#education' },
            { num: '§ 03', label: 'Projects', href: '#projects' },
            { num: '§ 04', label: 'Skills', href: '#skills' },
            { num: '§ 05', label: 'Goals', href: '#goals' },
            { num: '§ 06', label: 'Contact', href: '#contact' },
          ].map((item) => (
            <a
              key={item.num}
              href={item.href}
              className="group flex flex-col p-2.5 rounded bg-cream hover:bg-beige transition-colors border border-transparent hover:border-deepBrown/15"
            >
              <span className="text-caramel font-semibold group-hover:text-espresso transition-colors">
                {item.num}
              </span>
              <span className="text-mutedBrown group-hover:text-espresso transition-colors text-[11px] uppercase tracking-wider mt-0.5">
                {item.label}
              </span>
            </a>
          ))}
        </div>

        <div className="flex justify-center mt-8">
          <a
            href="#about"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-mutedBrown hover:text-espresso transition-colors"
            aria-label="Proceed to About section"
          >
            <span>Proceed to About</span>
            <ArrowDown className="w-3.5 h-3.5 text-caramel animate-bounce" />
          </a>
        </div>
      </div>
    </section>
  );
};
