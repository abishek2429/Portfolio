import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { portfolioData } from '../data/portfolioData';

interface NavbarProps {
  activeSection: string;
}

export const Navbar: React.FC<NavbarProps> = ({ activeSection }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on Escape key press or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  // All 7 navigation items as required
  const navItems = [
    { label: 'Home', href: '#home', id: 'home' },
    { label: 'About', href: '#about', id: 'about' },
    { label: 'Education', href: '#education', id: 'education' },
    { label: 'Projects', href: '#projects', id: 'projects' },
    { label: 'Skills', href: '#skills', id: 'skills' },
    { label: 'Goals', href: '#goals', id: 'goals' },
    { label: 'Contact', href: '#contact', id: 'contact' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-cream/95 backdrop-blur-md border-b border-deepBrown/15 py-3 shadow-editorial'
          : 'bg-cream/70 backdrop-blur-sm py-4 md:py-5 border-b border-deepBrown/10'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-10 flex items-center justify-between">
        {/* Brand Monogram & Domain */}
        <a
          href="#home"
          onClick={(e) => handleNavClick(e, '#home')}
          className="group flex items-baseline gap-2 text-espresso hover:text-deepBrown transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-caramel rounded-sm"
          aria-label="Abishek S Home"
        >
          <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight">
            {portfolioData.profile.name}
          </span>
          <span className="hidden sm:inline font-mono text-[11px] text-mutedBrown tracking-wider uppercase">
            / {portfolioData.profile.domain}
          </span>
        </a>

        {/* Desktop Navigation Bar (All 7 Sections) */}
        <nav
          role="navigation"
          aria-label="Main Navigation"
          className="hidden md:flex items-center space-x-1 lg:space-x-1.5"
        >
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative px-3 py-1.5 text-xs lg:text-sm font-medium transition-all duration-200 rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-caramel ${
                  isActive
                    ? 'text-espresso font-semibold'
                    : 'text-mutedBrown hover:text-espresso'
                }`}
              >
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-caramel rounded-full transition-all duration-300" />
                )}
              </a>
            );
          })}
        </nav>

        {/* Action Button: Direct Contact Relay */}
        <div className="hidden md:flex items-center space-x-4">
          <a
            href="#contact"
            onClick={(e) => handleNavClick(e, '#contact')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider text-espresso bg-beige hover:bg-beige-dark border border-deepBrown/20 hover:border-caramel rounded transition-all duration-200 active:scale-[0.98] shadow-sm"
          >
            <span>Relay</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-caramel" />
          </a>
        </div>

        {/* Responsive Mobile Navigation Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded text-espresso hover:text-deepBrown hover:bg-beige/60 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-caramel"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav-menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Responsive Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-menu"
          className="md:hidden bg-cream border-b border-deepBrown/20 px-6 py-6 shadow-xl animate-editorial-fade"
        >
          <nav role="navigation" aria-label="Mobile Navigation" className="flex flex-col space-y-2">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center justify-between py-2.5 px-3 rounded text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-beige/70 text-espresso font-semibold border-l-2 border-caramel'
                      : 'text-mutedBrown hover:text-espresso hover:bg-beige/40'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="text-[11px] font-mono text-caramel uppercase tracking-wider">
                      • Active
                    </span>
                  )}
                </a>
              );
            })}

            <div className="pt-4 mt-2 border-t border-deepBrown/15">
              <a
                href="#contact"
                onClick={(e) => handleNavClick(e, '#contact')}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-espresso bg-beige hover:bg-beige-dark border border-deepBrown/20 rounded shadow-sm active:scale-[0.98] transition-all"
              >
                <span>Initiate Correspondence</span>
                <ArrowUpRight className="w-4 h-4 text-caramel" />
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
