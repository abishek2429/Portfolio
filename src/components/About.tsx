import React from 'react';
import { BookOpen, MapPin, Server, Code2, Cpu, Cloud, Layers, Terminal } from 'lucide-react';
import { portfolioData } from '../data/portfolioData';

export const About: React.FC = () => {
  const { profile } = portfolioData;

  const iconMap: Record<string, React.ReactNode> = {
    Server: <Server className="w-4 h-4 text-caramel" />,
    Code2: <Code2 className="w-4 h-4 text-caramel" />,
    Cpu: <Cpu className="w-4 h-4 text-caramel" />,
    Cloud: <Cloud className="w-4 h-4 text-caramel" />,
  };

  return (
    <section id="about" className="py-24 border-t border-deepBrown/15">
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-6 border-b border-deepBrown/15 gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-caramel font-semibold mb-2">
              <BookOpen className="w-4 h-4" />
              <span>§ 01 / Monograph</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-espresso font-normal">
              About &amp; Focus
            </h2>
          </div>
          <p className="font-mono text-xs text-mutedBrown uppercase tracking-wider max-w-xs md:text-right">
            Engineering deliberate backend systems and purposeful software
          </p>
        </div>

        {/* 2-Column Editorial Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Identity Specification & Technical Focus Cards */}
          <div className="lg:col-span-5 space-y-6">
            {/* Identity Card */}
            <div className="bg-beige p-7 rounded-sm border border-deepBrown/15 shadow-editorial">
              <div className="flex items-center justify-between pb-5 mb-5 border-b border-deepBrown/15 font-mono text-xs">
                <span className="font-serif text-lg font-bold text-espresso tracking-tight">
                  {profile.name}
                </span>
                <span className="text-mutedBrown uppercase">
                  {profile.title}
                </span>
              </div>

              <div className="space-y-3.5 font-mono text-xs">
                <div className="flex items-start gap-2.5 text-espresso">
                  <MapPin className="w-4 h-4 text-caramel shrink-0 mt-0.5" />
                  <div>
                    <span className="text-mutedBrown block text-[10px] uppercase">Base</span>
                    <span>{profile.location}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-espresso">
                  <Terminal className="w-4 h-4 text-caramel shrink-0 mt-0.5" />
                  <div>
                    <span className="text-mutedBrown block text-[10px] uppercase">Focus Areas</span>
                    <span>Backend, Systems, Algorithms, Cloud</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-espresso">
                  <Layers className="w-4 h-4 text-caramel shrink-0 mt-0.5" />
                  <div>
                    <span className="text-mutedBrown block text-[10px] uppercase">Status</span>
                    <span>{profile.availability}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Core Technical Interest Pillars */}
            <div className="space-y-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-mutedBrown block font-semibold">
                Technical Focus &amp; Interests
              </span>

              {profile.technicalInterests.map((interest, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-sm bg-beige/50 hover:bg-beige border border-deepBrown/15 transition-all duration-200"
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    {iconMap[interest.icon] || <Cpu className="w-4 h-4 text-caramel" />}
                    <h3 className="font-serif text-base font-medium text-espresso">
                      {interest.title}
                    </h3>
                  </div>
                  <p className="text-xs text-mutedBrown leading-relaxed pl-6">
                    {interest.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Concise Narrative */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-5 text-espresso/90 text-base sm:text-lg leading-relaxed font-light">
              {profile.aboutNarrative.map((paragraph, idx) => (
                <p
                  key={idx}
                  className={
                    idx === 0
                      ? 'first-letter:font-serif first-letter:text-5xl first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:leading-none first-letter:text-espresso'
                      : ''
                  }
                >
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Core Engineering Tenets */}
            <div className="pt-6 border-t border-deepBrown/15 space-y-4">
              <h3 className="font-serif text-2xl text-espresso font-normal">
                Engineering Approach
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-beige/40 rounded-sm border border-deepBrown/15">
                  <span className="font-mono text-xs font-semibold text-caramel block mb-1">
                    01 / Determinism &amp; Clarity
                  </span>
                  <p className="text-xs text-mutedBrown leading-relaxed">
                    Prioritizing predictable state, explicit error boundaries, and self-documenting data schemas.
                  </p>
                </div>

                <div className="p-4 bg-beige/40 rounded-sm border border-deepBrown/15">
                  <span className="font-mono text-xs font-semibold text-caramel block mb-1">
                    02 / Algorithmic Rigor
                  </span>
                  <p className="text-xs text-mutedBrown leading-relaxed">
                    Evaluating time and space complexities to ensure operations stay lean under dataset expansion.
                  </p>
                </div>

                <div className="p-4 bg-beige/40 rounded-sm border border-deepBrown/15">
                  <span className="font-mono text-xs font-semibold text-caramel block mb-1">
                    03 / Practical Utility
                  </span>
                  <p className="text-xs text-mutedBrown leading-relaxed">
                    Eliminating architectural excess to build durable tools that solve genuine user and operational needs.
                  </p>
                </div>

                <div className="p-4 bg-beige/40 rounded-sm border border-deepBrown/15">
                  <span className="font-mono text-xs font-semibold text-caramel block mb-1">
                    04 / Continuous Evolution
                  </span>
                  <p className="text-xs text-mutedBrown leading-relaxed">
                    Actively investigating cloud infrastructure, distributed telemetry, and modern developer systems.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
