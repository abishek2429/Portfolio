import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProjectsShowcase } from './components/ProjectsShowcase';
import { Identity } from './components/Identity';
import { Footer } from './components/Footer';
import { CustomCursor } from './components/CustomCursor';

export const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('home');

  useEffect(() => {
    const sections = ['home', 'projects', 'identity', 'contact'];

    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observerOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: '-20% 0px -55% 0px',
      threshold: 0,
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 80) {
        setActiveSection('contact');
      } else if (window.scrollY < 150) {
        setActiveSection('home');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="bg-cream text-espresso min-h-screen flex flex-col selection:bg-caramel/25 selection:text-espresso relative">
      {/* Custom Magnetic Cursor */}
      <CustomCursor />

      {/* Accessible Skip Link */}
      <a
        href="#projects"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-espresso focus:text-cream focus:rounded-full focus:font-mono focus:text-xs focus:shadow-lg focus:ring-2 focus:ring-caramel"
      >
        Skip to Projects
      </a>

      {/* Floating Dynamic Island Navigation */}
      <Navbar activeSection={activeSection} />

      {/* Main Exhibition Stream */}
      <main id="main-content" className="flex-grow">
        {/* 1. Creative Hero: Who I am, what I create, and direct project access */}
        <Hero />

        {/* 2. Main Project Showcase: Visual Exhibition of RepSI, CodeXcape, and EduVault */}
        <ProjectsShowcase />

        {/* 3. Concise Identity & Craft: Core disciplines & PSG Tech credentials */}
        <Identity />
      </main>

      {/* 4. Grand Editorial Footer & Direct Connect */}
      <Footer />
    </div>
  );
};

export default App;
