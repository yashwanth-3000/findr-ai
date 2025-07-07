'use client'

import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import Script from 'next/script';
import { AuthProvider } from '@/contexts/auth-context';

import './globals.css';

const LIGHT_THEME_COLOR = 'hsl(0 0% 100%)';
const DARK_THEME_COLOR = 'hsl(240deg 10% 3.92%)';
const THEME_COLOR_SCRIPT = `\
(function() {
  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    var isDark = html.classList.contains('dark');
    meta.setAttribute('content', isDark ? '${DARK_THEME_COLOR}' : '${LIGHT_THEME_COLOR}');
  }
  var observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();`;

// Add script to enforce lowercase text even on dynamically loaded content
const LOWERCASE_SCRIPT = `
(function() {
  // Apply initial lowercase transformation
  function applyLowercase() {
    document.querySelectorAll('*:not(code):not(pre):not(.preserve-case)').forEach(function(el) {
      if (el.textContent && !el.hasAttribute('data-lowercase-applied')) {
        el.style.textTransform = 'lowercase';
        el.setAttribute('data-lowercase-applied', 'true');
      }
    });
  }
  
  // Watch for DOM changes to apply lowercase to new elements
  const observer = new MutationObserver(function(mutations) {
    applyLowercase();
  });
  
  // Start observing the document
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Initial application
  applyLowercase();
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      // `next-themes` injects an extra classname to the body element to avoid
      // visual flicker before hydration. Hence the `suppressHydrationWarning`
      // prop is necessary to avoid the React hydration mismatch warning.
      // https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app
      suppressHydrationWarning
      className="apple-style light"
    >
      <head>
        <title>findr-ai - Hire Better with AI-Powered Screening</title>
        <meta name="description" content="Replace hiring spreadsheets with AI. Post jobs, get AI-scored candidates from resumes, LinkedIn, and GitHub. Smart shortlisting and live metrics." />
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_COLOR_SCRIPT,
          }}
        />
        <style dangerouslySetInnerHTML={{
          __html: `
            .apple-style {
              font-feature-settings: "cv02", "cv03", "cv04", "cv11";
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              text-rendering: optimizeLegibility;
            }
            
            /* Ensuring everything is lowercase */
            input, button, a, p, h1, h2, h3, h4, h5, h6, span, div, label, textarea, select {
              text-transform: lowercase !important;
            }
          `
        }} />
        <script dangerouslySetInnerHTML={{ __html: LOWERCASE_SCRIPT }} />
        <meta
          name="viewport"
          content="width=device-width, height=device-height, initial-scale=1.0, user-scalable=yes"
        />
        <Script
          async
          defer
          strategy="lazyOnload"
          src="https://analytics.us.umami.is/script.js"
          data-website-id="b95a4fe5-29b7-41a1-a7f8-eb7bdc0621e8"
        />
      </head>
      <body className="antialiased lowercase-text" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Toaster />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
