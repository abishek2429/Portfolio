import React, { useState, useEffect } from 'react';
import { Copy, Check, Github, Linkedin, Globe, ArrowUpRight, ArrowUp, Clock, Sparkles } from 'lucide-react';
import { portfolioData } from '../data/portfolioData';

export const Footer: React.FC = () => {
  const { profile } = portfolioData;
  const [copied, setCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format time in Indian Standard Time (Coimbatore)
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      };
      setCurrentTime(new Intl.DateTimeFormat('en-IN', options).format(now));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(profile.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="contact" className="pt-28 pb-12 bg-espresso text-cream relative overflow-hidden">
      {/* Background Ambient Warm Glow */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-caramel/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-10">
        
        {/* Massive Call To Action */}
        <div className="border-b border-cream/15 pb-16 mb-16 space-y-8">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-caramel font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>§ 03 / Direct Transmission</span>
          </div>

          <h2 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-normal leading-[1.05] tracking-tight">
            Let's engineer <br />
            <span className="italic font-light text-caramel">deliberate software</span> together.
          </h2>

          <p className="font-sans text-base sm:text-lg text-cream/70 font-light max-w-xl leading-relaxed">
            Open for software engineering opportunities, backend architecture discussions, and meaningful collaborations.
          </p>

          {/* Large Interactive Email Pill Capsule */}
          <div className="pt-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <a
              href={`mailto:${profile.email}`}
              className="inline-flex items-center justify-between gap-4 px-8 py-5 rounded-full bg-cream text-espresso hover:bg-beige transition-all shadow-editorial font-mono text-base sm:text-xl font-semibold group"
            >
              <span>{profile.email}</span>
              <ArrowUpRight className="w-5 h-5 text-caramel group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </a>

            <button
              onClick={handleCopyEmail}
              className="inline-flex items-center justify-center gap-2 px-6 py-5 rounded-full bg-cream/10 hover:bg-cream/20 text-cream border border-cream/20 font-mono text-sm transition-all focus:outline-none"
              title="Copy email to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-caramel" />
                  <span className="font-semibold text-caramel">Copied to Clipboard</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-cream/60" />
                  <span>Copy Address</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Relays & Telemetry Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-16 border-b border-cream/15">
          {/* Column 1: Coordinates & Local Clock */}
          <div className="md:col-span-4 space-y-3 font-mono text-xs">
            <span className="text-[10px] uppercase tracking-wider text-caramel font-semibold block">
              Coimbatore Base Station
            </span>
            <div className="flex items-center gap-2 text-cream/90 text-sm">
              <Clock className="w-4 h-4 text-caramel" />
              <span>{currentTime || '11:06 AM IST'}</span>
              <span className="text-cream/40">(IST / UTC+5:30)</span>
            </div>
            <p className="text-cream/60 text-[11px]">
              PSG College of Technology • Tamil Nadu, India
            </p>
          </div>

          {/* Column 2: External Profiles */}
          <div className="md:col-span-4 space-y-3 font-mono text-xs">
            <span className="text-[10px] uppercase tracking-wider text-caramel font-semibold block">
              Direct Relays
            </span>
            <div className="space-y-2">
              <a
                href={profile.github}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-cream/80 hover:text-caramel transition-colors group"
              >
                <Github className="w-4 h-4 text-caramel" />
                <span>github.com/{profile.githubUsername}</span>
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>

              <a
                href={profile.linkedin}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-cream/80 hover:text-caramel transition-colors group"
              >
                <Linkedin className="w-4 h-4 text-caramel" />
                <span>linkedin.com/in/{profile.linkedinUsername}</span>
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>

              <a
                href={profile.website}
                className="flex items-center gap-2 text-cream/80 hover:text-caramel transition-colors group"
              >
                <Globe className="w-4 h-4 text-caramel" />
                <span>{profile.domain}</span>
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          </div>

          {/* Column 3: Return to Summit */}
          <div className="md:col-span-4 flex flex-col justify-between items-start md:items-end">
            <span className="font-mono text-[10px] uppercase tracking-wider text-caramel font-semibold block">
              Orientation
            </span>
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-cream/10 hover:bg-cream/20 border border-cream/20 text-cream font-mono text-xs transition-all mt-4 md:mt-0"
              aria-label="Scroll back to top"
            >
              <span>Back to Summit</span>
              <ArrowUp className="w-3.5 h-3.5 text-caramel" />
            </button>
          </div>
        </div>

        {/* Bottom Editorial Colophon */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-cream/50">
          <p>© {new Date().getFullYear()} Abishek S. All rights reserved.</p>
          <div className="flex items-center gap-3 text-[11px]">
            <span>Editorial Palette: Cream, Espresso &amp; Caramel</span>
            <span>•</span>
            <span>abishek.app</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
