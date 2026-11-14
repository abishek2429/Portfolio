import React from 'react';
import { motion } from 'framer-motion';
import { Server, Wifi, Cpu, ShieldCheck, GraduationCap, Terminal } from 'lucide-react';
import { portfolioData } from '../data/portfolioData';

export const Identity: React.FC = () => {
  const { profile } = portfolioData;

  const disciplines = [
    {
      icon: <Server className="w-5 h-5 text-caramel" />,
      title: "Backend Engineering",
      desc: "FastAPI, Spring Boot, asynchronous service pipelines, and tenant-isolated relational database modeling."
    },
    {
      icon: <Wifi className="w-5 h-5 text-caramel" />,
      title: "Real-Time Telemetry",
      desc: "Low-latency WebSocket synchronization, bidirectional socket events, and cooperative multiplayer states."
    },
    {
      icon: <Cpu className="w-5 h-5 text-caramel" />,
      title: "Applied Algorithms",
      desc: "Data structure optimizations, computational complexity analysis, and semantic similarity assessment."
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-caramel" />,
      title: "System Integrity",
      desc: "Type-safe contracts, atomic financial transactions, Docker containerization, and clean architectural boundaries."
    }
  ];

  return (
    <section id="identity" className="py-28 border-t border-deepBrown/15 bg-beige/20 relative">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-6 border-b border-deepBrown/15 gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-caramel font-semibold mb-2">
              <Terminal className="w-4 h-4" />
              <span>§ 03 / Identity &amp; Engineering Craft</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-espresso font-normal">
              Who I Am &amp; What I Create
            </h2>
          </div>
          <p className="font-mono text-xs text-mutedBrown uppercase tracking-wider max-w-sm md:text-right">
            Master of Computer Applications candidate at PSG College of Technology, Coimbatore.
          </p>
        </div>

        {/* 2-Column Editorial Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Bold Editorial Manifesto */}
          <div className="lg:col-span-5 space-y-6">
            <blockquote className="font-serif text-2xl sm:text-3xl text-espresso leading-snug font-normal italic border-l-2 border-caramel pl-6 py-2">
              "Deliberate software architectures built for high concurrency, clear domain boundaries, and lasting maintainability."
            </blockquote>

            <p className="font-sans text-sm sm:text-base text-mutedBrown font-light leading-relaxed">
              I am <strong className="font-medium text-espresso">{profile.name}</strong>, a software developer
              focused on backend systems, scalable cloud services, and interactive web technologies. I believe
              the strongest software is born from clear data models, rigorous algorithms, and clean abstractions.
            </p>

            {/* Academic Pedigree Capsule */}
            <div className="p-5 rounded-xl bg-cream border border-deepBrown/15 shadow-sm space-y-3">
              <div className="flex items-center gap-2 font-mono text-xs text-espresso font-semibold">
                <GraduationCap className="w-4 h-4 text-caramel" />
                <span>Academic Foundations</span>
              </div>
              <div className="space-y-1.5 font-mono text-xs text-mutedBrown">
                <div className="flex justify-between">
                  <span className="text-espresso font-medium">PSG College of Technology</span>
                  <span className="text-caramel font-semibold">MCA (2025–Present)</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>BSc Computer Science (2022–2025)</span>
                  <span>Coimbatore, India</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 4 Disciplines Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {disciplines.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="p-6 rounded-xl bg-cream border border-deepBrown/15 shadow-editorial hover:border-deepBrown/30 transition-all duration-300 space-y-3"
              >
                <div className="w-10 h-10 rounded-lg bg-beige/60 flex items-center justify-center">
                  {item.icon}
                </div>
                <h3 className="font-serif text-xl text-espresso font-medium">
                  {item.title}
                </h3>
                <p className="font-sans text-xs sm:text-sm text-mutedBrown leading-relaxed font-light">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
