"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Logo from './Logo';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
      
      // Update active section based on scroll position
      const sections = ['hero', 'about', 'how-it-works', 'team'];
      const currentSection = sections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });
      
      if (currentSection) {
        setActiveSection(currentSection);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Call once to set initial state
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const smoothScroll = (targetId: string) => {
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
    setIsMenuOpen(false);
  };

  const navigationItems = [
    { id: 'about', label: 'About' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'team', label: 'Team' },
    { id: 'faq', label: 'FAQ' }
  ];

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-lg shadow-lg border-b border-gray-200/50' 
        : 'bg-white/80 backdrop-blur-md border-b border-white/20'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center space-x-3 group">
            <Logo className="w-12 h-12 transition-transform group-hover:scale-105" />
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-900 tracking-tight group-hover:text-yellow-600 transition-colors">
                STEPTION PROTOCOL
              </span>
              <span className="text-xs text-gray-500 -mt-1">by Decenzio</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => smoothScroll(item.id)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 relative ${
                  activeSection === item.id
                    ? 'text-yellow-600 bg-yellow-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {item.label}
                {activeSection === item.id && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-yellow-500 rounded-full"></div>
                )}
              </button>
            ))}
          </nav>

          {/* Desktop CTA Section */}
          <div className="hidden md:flex items-center space-x-3">
            <Link href="/app">
              <button className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:from-yellow-600 hover:to-yellow-700 transform hover:-translate-y-0.5 transition-all shadow-lg hover:shadow-xl">
                Launch App
              </button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden transition-all duration-300 ease-in-out ${
          isMenuOpen 
            ? 'max-h-96 opacity-100 pb-6' 
            : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          <div className="pt-4 space-y-3 border-t border-gray-200/50">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => smoothScroll(item.id)}
                className={`block w-full text-left px-4 py-3 rounded-lg font-medium transition-all ${
                  activeSection === item.id
                    ? 'text-yellow-600 bg-yellow-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className="pt-3 border-t border-gray-200/50 space-y-3">
              <Link href="/app" onClick={() => setIsMenuOpen(false)}>
                <button className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-yellow-600 hover:to-yellow-700 transition-all shadow-lg">
                  Launch App
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}