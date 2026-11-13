import React from 'react';
import { ArrowUp, Palette, Type, ShieldCheck } from 'lucide-react';
import { portfolioData } from '../data/portfolioData';

export const Footer: React.FC = () => {
  const { profile, siteMetadata } = portfolioData;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-cream border-t border-deepBrown/20 py-16 text-espresso">
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        {/* Colophon & Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-deepBrown/15">
          {/* Identity & Masthead Summary */}
          <div className="md:col-span-5 space-y-3">
            <span className="font-serif text-2xl font-bold tracking-tight text-espresso block">
              {profile.name}
            </span>
            <p className="font-sans text-xs text-mutedBrown font-light leading-relaxed max-w-sm">
              An editorial software portfolio engineered for clarity, structural precision, and durable digital craftsmanship.
            </p>
            <div className="font-mono text-[11px] text-mutedBrown pt-2">
              <span>Domain: </span>
              <a href="#home" className="text-espresso font-semibold hover:text-deepBrown transition-colors">
                {profile.domain}
              </a>
              <span className="mx-2 text-deepBrown/30">•</span>
              <span>{profile.location}</span>
            </div>
          </div>

          {/* Colophon Details */}
          <div className="md:col-span-4 space-y-2 font-mono text-xs">
            <span className="text-[10px] uppercase tracking-wider text-mutedBrown block font-semibold mb-2">
              Colophon &amp; Design Notes
            </span>
            <div className="flex items-start gap-2 text-mutedBrown text-[11px]">
              <Type className="w-3.5 h-3.5 text-caramel shrink-0 mt-0.5" />
              <span>Typeset in Newsreader, Playfair Display &amp; Plus Jakarta Sans</span>
            </div>
            <div className="flex items-start gap-2 text-mutedBrown text-[11px]">
              <Palette className="w-3.5 h-3.5 text-caramel shrink-0 mt-0.5" />
              <span>Palette: Warm Cream, Soft Beige, Muted Brown, Deep Brown, Espresso, Caramel</span>
            </div>
            <div className="flex items-start gap-2 text-mutedBrown text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-caramel shrink-0 mt-0.5" />
              <span>Accessible semantic architecture • Zero runtime bloat</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-3 flex flex-col justify-between items-start md:items-end">
            <div className="space-y-1 font-mono text-xs text-right">
              <span className="text-[10px] uppercase tracking-wider text-mutedBrown block font-semibold mb-2">
                Section Index
              </span>
              <div className="flex flex-col space-y-1 text-mutedBrown">
                <a href="#home" className="hover:text-espresso transition-colors">§ 00 Home</a>
                <a href="#about" className="hover:text-espresso transition-colors">§ 01 About</a>
                <a href="#education" className="hover:text-espresso transition-colors">§ 02 Education</a>
                <a href="#projects" className="hover:text-espresso transition-colors">§ 03 Projects</a>
                <a href="#skills" className="hover:text-espresso transition-colors">§ 04 Skills</a>
                <a href="#goals" className="hover:text-espresso transition-colors">§ 05 Goals</a>
                <a href="#contact" className="hover:text-espresso transition-colors">§ 06 Contact</a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Scroll to Top */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-mutedBrown">
          <div>
            <span>&copy; {siteMetadata.established} {profile.name}. All rights reserved.</span>
          </div>

          <button
            onClick={scrollToTop}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-beige/60 hover:bg-beige border border-deepBrown/15 text-espresso transition-all active:scale-95 text-xs shadow-sm"
            aria-label="Scroll back to top"
          >
            <span>Return to Summit</span>
            <ArrowUp className="w-3.5 h-3.5 text-caramel" />
          </button>
        </div>
      </div>
    </footer>
  );
};
