import React from 'react';
import { GraduationCap, Calendar, MapPin, Sparkles } from 'lucide-react';
import { portfolioData } from '../data/portfolioData';

export const Education: React.FC = () => {
  const { education } = portfolioData;

  return (
    <section id="education" className="py-24 bg-beige/35 border-t border-deepBrown/15">
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-6 border-b border-deepBrown/15 gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-caramel font-semibold mb-2">
              <GraduationCap className="w-4 h-4" />
              <span>§ 02 / Academic Foundations</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-espresso font-normal">
              Education &amp; Qualifications
            </h2>
          </div>
          <p className="font-mono text-xs text-mutedBrown uppercase tracking-wider max-w-xs md:text-right">
            PSG College of Technology, Coimbatore
          </p>
        </div>

        {/* Academic Timeline */}
        <div className="relative space-y-12 before:absolute before:left-3.5 sm:before:left-6 before:top-4 before:bottom-4 before:w-px before:bg-deepBrown/20">
          {education.map((item, index) => {
            const isPresent = item.period.toLowerCase().includes('present');
            return (
              <div
                key={item.id || index}
                className="relative pl-10 sm:pl-16 group"
              >
                {/* Timeline Node Marker */}
                <div
                  className={`absolute left-1.5 sm:left-4 top-6 -translate-x-1/2 w-4 h-4 rounded-full bg-cream border-2 transition-colors ${
                    isPresent
                      ? 'border-caramel ring-4 ring-caramel/20'
                      : 'border-deepBrown/40 group-hover:border-caramel'
                  }`}
                >
                  {isPresent && (
                    <span className="absolute inset-1 rounded-full bg-caramel animate-pulse" />
                  )}
                </div>

                {/* Editorial Academic Card */}
                <div className="bg-cream p-7 sm:p-10 rounded-sm border border-deepBrown/15 group-hover:border-deepBrown/30 transition-all duration-300 shadow-editorial">
                  {/* Top Meta Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-deepBrown/15 font-mono text-xs">
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-3.5 h-3.5 text-caramel shrink-0" />
                      <span className="text-espresso font-semibold tracking-wide">
                        {item.period}
                      </span>
                      <span className="text-deepBrown/30">•</span>
                      <span className="text-mutedBrown uppercase text-[11px]">
                        {item.status}
                      </span>
                    </div>

                    {/* CGPA Badge */}
                    {item.cgpa && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-beige border border-deepBrown/15 text-espresso font-semibold text-xs font-mono">
                        <Sparkles className="w-3 h-3 text-caramel" />
                        <span>CGPA: {item.cgpa}</span>
                      </div>
                    )}
                  </div>

                  {/* Degree & Institution */}
                  <div className="space-y-1.5 mb-5">
                    <h3 className="font-serif text-2xl sm:text-3xl text-espresso font-medium leading-snug">
                      {item.degree}
                    </h3>
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-sm font-sans">
                      <span className="font-serif italic text-base sm:text-lg text-deepBrown">
                        {item.institution}
                      </span>
                      <span className="text-deepBrown/30 hidden sm:inline">•</span>
                      <span className="flex items-center gap-1 font-mono text-xs text-mutedBrown">
                        <MapPin className="w-3 h-3 text-caramel shrink-0" />
                        {item.location}
                      </span>
                    </div>
                  </div>

                  {/* Factual Academic Narrative */}
                  <p className="text-sm text-espresso/90 font-light leading-relaxed mb-6">
                    {item.description}
                  </p>

                  {/* Curriculum & Focus Areas */}
                  {item.focusAreas && item.focusAreas.length > 0 && (
                    <div className="pt-5 border-t border-deepBrown/10">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-mutedBrown block mb-3 font-semibold">
                        Core Academic Focus
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {item.focusAreas.map((area, aIdx) => (
                          <div
                            key={aIdx}
                            className="flex items-center gap-2 p-2 rounded bg-beige/40 border border-deepBrown/10 text-xs text-espresso"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-caramel shrink-0" />
                            <span className="font-medium">{area}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
