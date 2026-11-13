import React, { useState } from 'react';
import { Mail, Copy, Check, Github, Globe, MapPin, ArrowUpRight, Sparkles } from 'lucide-react';
import { portfolioData } from '../data/portfolioData';

export const Contact: React.FC = () => {
  const { profile } = portfolioData;
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(profile.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section id="contact" className="py-24 bg-beige/35 border-t border-deepBrown/15">
      <div className="max-w-5xl mx-auto px-6 md:px-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-6 border-b border-deepBrown/15 gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-caramel font-semibold mb-2">
              <Mail className="w-4 h-4" />
              <span>§ 06 / Direct Correspondence</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-espresso font-normal">
              Contact &amp; Connect
            </h2>
          </div>
          <p className="font-mono text-xs text-mutedBrown uppercase tracking-wider max-w-xs md:text-right">
            Open for software engineering opportunities and collaborations
          </p>
        </div>

        {/* Minimal Editorial Contact Card */}
        <div className="bg-cream p-8 sm:p-12 rounded-sm border border-deepBrown/20 shadow-editorial space-y-10">
          {/* Professional Introduction & Invitation */}
          <div className="max-w-2xl space-y-3">
            <h3 className="font-serif text-2xl sm:text-3xl text-espresso font-medium leading-snug">
              Let's connect and discuss software engineering.
            </h3>
            <p className="font-sans text-sm sm:text-base text-mutedBrown font-light leading-relaxed">
              I am actively seeking software development and backend engineering roles. If you have an engineering opening, a project to discuss, or wish to connect, feel free to reach out directly through any of the channels below.
            </p>
          </div>

          {/* Primary Email Banner & One-Click Copy */}
          <div className="p-6 rounded bg-beige/50 border border-deepBrown/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-mutedBrown block font-semibold">
                Direct Email Transmission
              </span>
              <a
                href={`mailto:${profile.email}`}
                className="font-mono text-base sm:text-lg text-espresso font-semibold hover:text-deepBrown transition-colors break-all inline-flex items-center gap-2"
                aria-label={`Send email to ${profile.email}`}
              >
                <span>{profile.email}</span>
                <ArrowUpRight className="w-4 h-4 text-caramel shrink-0" />
              </a>
            </div>

            <button
              onClick={handleCopyEmail}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded bg-cream hover:bg-beige border border-deepBrown/20 hover:border-caramel text-xs font-mono text-espresso font-medium transition-all shadow-sm shrink-0"
              title="Copy email to clipboard"
              aria-label="Copy email address"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-caramel" />
                  <span className="text-deepBrown font-bold">Email Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-mutedBrown" />
                  <span>Copy Email</span>
                </>
              )}
            </button>
          </div>

          {/* Verified Relays Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {/* Website Link */}
            <a
              href={profile.website}
              target="_blank"
              rel="noreferrer"
              className="p-4 rounded bg-beige/35 hover:bg-beige/70 border border-deepBrown/15 hover:border-caramel transition-all duration-200 group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <Globe className="w-4 h-4 text-caramel" />
                <ArrowUpRight className="w-3.5 h-3.5 text-mutedBrown group-hover:text-espresso group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-mutedBrown block mb-0.5">
                  Portfolio Website
                </span>
                <span className="font-mono text-xs font-semibold text-espresso">
                  {profile.domain}
                </span>
              </div>
            </a>

            {/* GitHub Link */}
            <a
              href={profile.github}
              target="_blank"
              rel="noreferrer"
              className="p-4 rounded bg-beige/35 hover:bg-beige/70 border border-deepBrown/15 hover:border-caramel transition-all duration-200 group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <Github className="w-4 h-4 text-caramel" />
                <ArrowUpRight className="w-3.5 h-3.5 text-mutedBrown group-hover:text-espresso group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-mutedBrown block mb-0.5">
                  Code Repositories
                </span>
                <span className="font-mono text-xs font-semibold text-espresso">
                  github.com/{profile.githubUsername}
                </span>
              </div>
            </a>

            {/* Location */}
            <div className="p-4 rounded bg-beige/35 border border-deepBrown/15 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <MapPin className="w-4 h-4 text-caramel" />
                <span className="font-mono text-[10px] text-mutedBrown">{profile.coordinates}</span>
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-mutedBrown block mb-0.5">
                  Base of Operations
                </span>
                <span className="font-mono text-xs font-semibold text-espresso">
                  {profile.location}
                </span>
              </div>
            </div>
          </div>

          {/* Simple Professional Closing Statement */}
          <div className="pt-8 border-t border-deepBrown/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs text-mutedBrown">
            <p className="font-serif italic text-sm text-espresso font-normal">
              "Thank you for reviewing my portfolio. Deliberate software begins with clear communication."
            </p>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-beige/60 border border-deepBrown/15 text-espresso text-[11px] shrink-0">
              <Sparkles className="w-3 h-3 text-caramel" />
              <span>Available for Engagements</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
