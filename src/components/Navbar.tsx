import React, { useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Menu, X, ArrowUpRight, Sparkles } from 'lucide-react';
import { portfolioData } from '../data/portfolioData';

interface NavbarProps {
  activeSection: string;
}

export const Navbar: React.FC<NavbarProps> = ({ activeSection }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { profile } = portfolioData;

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const navLinks = [
    { id: 'projects', label: 'Selected Works', num: '01' },
    { id: 'index-table', label: 'Archive / Index', num: '02' },
    { id: 'identity', label: 'Identity & Craft', num: '03' },
    { id: 'contact', label: 'Connect', num: '04' },
  ];

  return (
    <>
      {/* Top Reading Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2.5px] bg-caramel origin-left z-50 shadow-glow-caramel"
        style={{ scaleX }}
      />

      {/* Floating Island Navigation */}
      <header className="fixed top-4 inset-x-0 z-40 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto pointer-events-none">
        <div className="flex items-center justify-between pointer-events-auto bg-cream/85 backdrop-blur-md border border-deepBrown/15 rounded-full px-5 py-2.5 shadow-editorial transition-all duration-300 hover:border-deepBrown/30">
          
          {/* Brand Logo / Identity */}
          <a
            href="#home"
            className="flex items-center gap-3 group focus:outline-none"
            aria-label="Abishek S Home"
          >
            <div className="w-8 h-8 rounded-full bg-espresso text-cream flex items-center justify-center font-serif text-sm font-bold tracking-tight shadow-sm group-hover:bg-deepBrown transition-colors">
              AS
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-sm font-semibold text-espresso tracking-tight group-hover:text-deepBrown transition-colors leading-tight">
                {profile.name}
              </span>
              <span className="font-mono text-[10px] text-mutedBrown flex items-center gap-1.5 leading-tight">
                <span className="w-1.5 h-1.5 rounded-full bg-caramel animate-pulse" />
                <span>Software Developer</span>
              </span>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 font-mono text-xs" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  className={`relative px-4 py-1.5 rounded-full transition-colors duration-200 flex items-center gap-1.5 ${
                    isActive
                      ? 'text-espresso font-semibold bg-beige/60'
                      : 'text-mutedBrown hover:text-espresso hover:bg-beige/35'
                  }`}
                >
                  <span className="text-[10px] text-caramel opacity-80">{link.num}</span>
                  <span>{link.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activePill"
                      className="absolute inset-0 rounded-full border border-deepBrown/20 -z-10 bg-beige/40"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Right Action: Contact Pill & Mobile Toggle */}
          <div className="flex items-center gap-2">
            <a
              href="#contact"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-espresso text-cream hover:bg-deepBrown text-xs font-mono font-medium transition-all shadow-sm group"
            >
              <span>Get in Touch</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-caramel group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-full hover:bg-beige/60 text-espresso transition-colors focus:outline-none"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-espresso" /> : <Menu className="w-5 h-5 text-espresso" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="md:hidden pointer-events-auto mt-2 p-5 bg-cream/95 backdrop-blur-lg border border-deepBrown/20 rounded-2xl shadow-editorial space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-deepBrown/10 font-mono text-xs text-mutedBrown">
              <span>Navigation Menu</span>
              <span className="flex items-center gap-1 text-[11px] text-caramel font-semibold">
                <Sparkles className="w-3 h-3" />
                abishek.app
              </span>
            </div>

            <nav className="flex flex-col space-y-1 font-mono text-sm">
              {navLinks.map((link) => (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                    activeSection === link.id
                      ? 'bg-beige text-espresso font-semibold'
                      : 'text-mutedBrown hover:text-espresso hover:bg-beige/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-caramel">{link.num}</span>
                    <span>{link.label}</span>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-50" />
                </a>
              ))}
            </nav>

            <div className="pt-2">
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-espresso text-cream hover:bg-deepBrown text-xs font-mono font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <span>Direct Contact</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-caramel" />
              </a>
            </div>
          </motion.div>
        )}
      </header>
    </>
  );
};
