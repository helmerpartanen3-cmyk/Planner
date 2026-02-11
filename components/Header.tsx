import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Header: React.FC = () => {
  const [isDark, setIsDark] = useState(false);

  // Initialize theme based on system or local storage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 mix-blend-exclusion text-white py-6 px-6 md:px-12 flex justify-between items-center pointer-events-none">
      <Link to="/" className="font-grotesk text-2xl font-bold tracking-tighter pointer-events-auto hover:opacity-70 transition-opacity">
        MONOKROMI
      </Link>

      <div className="flex items-center gap-6 pointer-events-auto">
        <nav className="hidden md:flex gap-6 font-sans text-sm font-medium backdrop-blur-md bg-white/10 dark:bg-black/10 px-6 py-2 rounded-full border border-white/10">
          <Link to="/" className="hover:opacity-70 transition-opacity">Työt</Link>
          <a href="#about" className="hover:opacity-70 transition-opacity">Info</a>
        </nav>
        
        <button 
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full border border-white/30 backdrop-blur-sm flex items-center justify-center hover:bg-white hover:text-black transition-all active:scale-95"
          aria-label="Vaihda teemaa"
        >
          {isDark ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>
          ) : (
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;