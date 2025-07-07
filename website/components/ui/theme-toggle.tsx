'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Only show the component after hydration to avoid mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = theme === 'dark';

  const handleToggle = () => {
    // Set animating state to trigger effects
    setIsAnimating(true);
    
    // Add a transition class to the html element for full-screen effect
    document.documentElement.classList.add('theme-transition');
    
    // Set the new theme
    setTheme(isDark ? 'light' : 'dark');
    
    // Remove animation classes after transition completes
    setTimeout(() => {
      setIsAnimating(false);
      document.documentElement.classList.remove('theme-transition');
    }, 800);
  };

  return (
    <>
      {/* Global style for screen transition */}
      <style jsx global>{`
        .theme-transition {
          transition: background-color 0.7s ease, color 0.7s ease, border-color 0.7s ease;
        }
        
        .theme-transition * {
          transition: background-color 0.7s ease, color 0.7s ease, border-color 0.7s ease, opacity 0.7s ease, transform 0.7s ease !important;
        }
        
        @keyframes ripple {
          0% {
            transform: scale(1);
            opacity: 0.4;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }
        
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes twinkle {
          0%, 100% {
            opacity: 0.4;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
      
      <button
        onClick={handleToggle}
        className={`
          relative w-14 h-7 rounded-full p-1 transition-all duration-500
          ${isDark ? 'bg-indigo-600' : 'bg-amber-400'}
          ${isAnimating ? 'animate-pulse' : ''}
          hover:ring-2 hover:ring-opacity-50
          ${isDark ? 'hover:ring-indigo-300' : 'hover:ring-amber-200'}
          focus:outline-none focus:ring-2 focus:ring-opacity-70
          ${isDark ? 'focus:ring-indigo-300' : 'focus:ring-amber-300'}
        `}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {/* Ripple effect container */}
        {isAnimating && (
          <div className={`
            absolute inset-0 rounded-full pointer-events-none
            ${isDark ? 'bg-indigo-400' : 'bg-amber-300'}
          `} style={{ animation: 'ripple 0.8s ease-out forwards' }} />
        )}
      
        {/* Track background with stars and sun rays */}
        <div className="absolute inset-0 w-full h-full rounded-full overflow-hidden">
          {/* Stars in background - visible in dark mode */}
          <div className={`absolute transition-opacity duration-500 ${isDark ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute top-1 left-2 w-1 h-1 bg-white rounded-full" style={{ animation: 'twinkle 2s infinite 0.5s' }}></div>
            <div className="absolute top-3 left-4 w-0.5 h-0.5 bg-white rounded-full" style={{ animation: 'twinkle 3s infinite 0.2s' }}></div>
            <div className="absolute top-4 left-1 w-0.5 h-0.5 bg-white rounded-full" style={{ animation: 'twinkle 2.5s infinite 1s' }}></div>
            <div className="absolute top-2 right-3 w-1 h-1 bg-white rounded-full" style={{ animation: 'twinkle 3s infinite 0.7s' }}></div>
            <div className="absolute bottom-2 left-3 w-0.5 h-0.5 bg-white rounded-full" style={{ animation: 'twinkle 2s infinite 1.5s' }}></div>
          </div>
          
          {/* Sun rays - visible in light mode */}
          <div 
            className={`absolute transition-opacity duration-500 ${isDark ? 'opacity-0' : 'opacity-100'}`}
            style={{ animation: isDark ? '' : 'rotate 15s linear infinite' }}
          >
            <div className="absolute right-3 top-1 w-4 h-0.5 bg-amber-200 rounded-full"></div>
            <div className="absolute right-1 bottom-1 w-3 h-0.5 bg-amber-200 rounded-full rotate-45"></div>
            <div className="absolute right-2 top-3 w-3 h-0.5 bg-amber-200 rounded-full -rotate-45"></div>
          </div>
        </div>

        {/* Sliding indicator */}
        <div 
          className={`
            w-5 h-5 rounded-full shadow-lg transform transition-all duration-500 z-10 relative
            ${isDark ? 'translate-x-7 bg-indigo-300' : 'translate-x-0 bg-white'}
            ${isAnimating ? 'scale-110' : ''}
          `}
        >
          {/* Moon details */}
          <div 
            className={`
              absolute inset-0 flex items-center justify-center transition-all duration-500
              ${isDark ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'}
            `}
          >
            <div className="absolute top-1 right-1.5 w-1.5 h-1.5 bg-indigo-600 rounded-full opacity-80"></div>
          </div>

          {/* Sun center with rays */}
          <div 
            className={`
              absolute inset-0 flex items-center justify-center transition-all duration-500
              ${isDark ? 'opacity-0 rotate-90' : 'opacity-100 rotate-0'}
            `}
          >
            <div className="w-2.5 h-2.5 bg-amber-500 rounded-full"></div>
          </div>
        </div>

        <span className="sr-only">
          {isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        </span>
      </button>
    </>
  );
} 