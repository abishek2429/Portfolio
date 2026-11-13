import React from 'react';
import { Compass, Sparkles, ArrowRight, Target } from 'lucide-react';
import { portfolioData } from '../data/portfolioData';

export const Goals: React.FC = () => {
  const { goals } = portfolioData;
  const currentFocus = goals.find((g) => g.id === 'current-focus') || goals[0];
  const longTerm = goals.find((g) => g.id === 'long-term') || goals[1];

  return (
    <section id="goals" className="py-24 border-t border-deepBrown/15">
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-6 border-b border-deepBrown/15 gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-caramel font-semibold mb-2">
              <Compass className="w-4 h-4" />
              <span>§ 05 / Trajectory &amp; Horizons</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-espresso font-normal">
              Goals &amp; Direction
            </h2>
          </div>
          <p className="font-mono text-xs text-mutedBrown uppercase tracking-wider max-w-xs md:text-right">
            Active technical focus and long-term engineering ambitions
          </p>
        </div>

        {/* 2-Column Editorial Grid: Current Focus vs Long-Term Direction */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Card 1: Current Focus */}
          <div className="bg-cream p-8 sm:p-10 rounded-sm border border-deepBrown/20 shadow-editorial flex flex-col justify-between hover:border-deepBrown/35 transition-all duration-300">
            <div>
              {/* Card Meta Bar */}
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-deepBrown/15 font-mono text-xs">
                <span className="text-mutedBrown uppercase tracking-wider text-[11px]">
                  {currentFocus.phase}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-beige border border-deepBrown/15 text-espresso font-semibold text-xs">
                  <span className="w-2 h-2 rounded-full bg-caramel animate-pulse" />
                  {currentFocus.badge}
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-2 mb-8">
                <h3 className="font-serif text-2xl sm:text-3xl font-medium text-espresso leading-snug">
                  {currentFocus.title}
                </h3>
                <p className="font-sans text-xs sm:text-sm text-mutedBrown font-light leading-relaxed">
                  {currentFocus.description}
                </p>
              </div>

              {/* Focus List */}
              <div className="space-y-3">
                {currentFocus.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="group p-3.5 rounded bg-beige/45 hover:bg-beige/80 border border-deepBrown/10 hover:border-caramel transition-all duration-200"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-caramel mt-1.5 shrink-0" />
                      <div className="space-y-1">
                        <span className="text-sm font-semibold text-espresso block group-hover:text-deepBrown transition-colors leading-snug">
                          {item.title}
                        </span>
                        <span className="font-mono text-[11px] text-mutedBrown block">
                          {item.area}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Status */}
            <div className="pt-6 mt-8 border-t border-deepBrown/15 flex items-center justify-between font-mono text-xs text-mutedBrown">
              <span>Status</span>
              <span className="text-deepBrown font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-caramel" />
                In Active Practice
              </span>
            </div>
          </div>

          {/* Card 2: Long-Term Goals */}
          <div className="bg-beige/45 p-8 sm:p-10 rounded-sm border border-deepBrown/20 shadow-editorial flex flex-col justify-between hover:border-deepBrown/35 transition-all duration-300">
            <div>
              {/* Card Meta Bar */}
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-deepBrown/15 font-mono text-xs">
                <span className="text-mutedBrown uppercase tracking-wider text-[11px]">
                  {longTerm.phase}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cream border border-deepBrown/15 text-espresso font-semibold text-xs">
                  <Target className="w-3.5 h-3.5 text-caramel" />
                  {longTerm.badge}
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-2 mb-8">
                <h3 className="font-serif text-2xl sm:text-3xl font-medium text-espresso leading-snug">
                  {longTerm.title}
                </h3>
                <p className="font-sans text-xs sm:text-sm text-mutedBrown font-light leading-relaxed">
                  {longTerm.description}
                </p>
              </div>

              {/* Long-Term Goals List */}
              <div className="space-y-3">
                {longTerm.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="group p-3.5 rounded bg-cream/70 hover:bg-cream border border-deepBrown/10 hover:border-caramel transition-all duration-200"
                  >
                    <div className="flex items-start gap-3">
                      <ArrowRight className="w-3.5 h-3.5 text-caramel mt-1 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      <div className="space-y-1">
                        <span className="text-sm font-semibold text-espresso block group-hover:text-deepBrown transition-colors leading-snug">
                          {item.title}
                        </span>
                        <span className="font-mono text-[11px] text-mutedBrown block">
                          {item.area}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Status */}
            <div className="pt-6 mt-8 border-t border-deepBrown/15 flex items-center justify-between font-mono text-xs text-mutedBrown">
              <span>Trajectory</span>
              <span className="text-deepBrown font-semibold flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-caramel" />
                Continuous Horizon
              </span>
            </div>
          </div>
        </div>

        {/* Transitional Trajectory Banner */}
        <div className="mt-12 p-6 rounded-sm bg-cream border border-deepBrown/15 shadow-editorial flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs text-mutedBrown">
          <div className="flex items-center gap-2 text-espresso">
            <span className="w-2 h-2 rounded-full bg-caramel" />
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Trajectory Vector:
            </span>
            <span className="font-serif italic text-sm text-deepBrown">
              "Mastering core fundamentals today; architecting resilient distributed systems tomorrow."
            </span>
          </div>

          <span className="text-[11px] text-mutedBrown/80 font-mono shrink-0">
            Coimbatore, IN • 2026
          </span>
        </div>
      </div>
    </section>
  );
};
