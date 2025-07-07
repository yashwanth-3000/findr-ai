'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes/dist/types';
import { useEffect, useState } from 'react';

// ThemeScript component to prevent theme flickering
function ThemeScript() {
  // This script runs before the rest of the app hydrates
  // It reads theme preference from localStorage and applies it immediately
  const themeScript = `
    (function() {
      try {
        const storedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(storedTheme);
      } catch (e) {
        console.error('Theme initialization failed:', e);
      }
    })();
  `;

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: themeScript,
      }}
    />
  );
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Only render children after mounting to prevent hydration issues
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <ThemeScript />
      <NextThemesProvider {...props}>
        {mounted ? children : null}
      </NextThemesProvider>
    </>
  );
}
