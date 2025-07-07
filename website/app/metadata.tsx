// This file contains the static metadata for the app
// It must be a server component, so no 'use client' directive

import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://chat.vercel.ai'),
  title: 'findr-ai - AI-Powered Hiring Platform',
  description: 'Replace hiring spreadsheets with AI. Post jobs, get AI-scored candidates from resumes, LinkedIn, and GitHub. Smart shortlisting and live metrics.',
  openGraph: {
    title: 'findr-ai - AI-Powered Hiring Platform',
    description: 'Replace hiring spreadsheets with AI. Post jobs, get AI-scored candidates from resumes, LinkedIn, and GitHub. Smart shortlisting and live metrics.',
    url: 'https://findr.ai',
    siteName: 'findr-ai',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'findr-ai - AI-Powered Hiring Platform',
    description: 'Replace hiring spreadsheets with AI. Post jobs, get AI-scored candidates from resumes, LinkedIn, and GitHub. Smart shortlisting and live metrics.',
  },
};

export const viewport: Viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
}; 