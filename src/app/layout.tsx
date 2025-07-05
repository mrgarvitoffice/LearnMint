/**
 * LearnMint: Your AI-Powered Learning Assistant
 * @author MrGarvit
 * 
 * This is the root layout component that wraps all pages in the application.
 * It is responsible for setting up global styles, fonts, and context providers
 * that are shared across all routes.
 */

import type { Metadata, Viewport } from 'next';
import { Orbitron } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/components/providers/AppProviders';
import { Toaster } from "@/components/ui/toaster";
import { TopProgressBar } from '@/components/layout/TopProgressBar';
import { Suspense } from 'react';

// Initialize Orbitron font with a CSS variable for easy use in Tailwind.
const orbitron = Orbitron({
  variable: '--font-orbitron',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
});

// --- Application Metadata ---
// Defines metadata for SEO and Progressive Web App (PWA) features.
export const metadata: Metadata = {
  title: 'LearnMint - AI Powered Learning',
  description: 'AI-powered learning assistant for notes, quizzes, flashcards, and more. A project by MrGarvit.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icons/icon-512x512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: '/icons/icon-192x192.png',
    shortcut: '/icons/icon-192x192.png',
  },
};

// --- Viewport Configuration ---
// Defines viewport settings, including the theme color for the browser UI.
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'hsl(0 0% 100%)' }, // Light theme (white)
    { media: '(prefers-color-scheme: dark)', color: 'hsl(222 47% 11%)' }  // Dark theme (deep midnight blue)
  ],
};

/**
 * The top-level layout component for the entire application.
 * It wraps all page content with necessary providers and global elements.
 * @param {Readonly<{children: React.ReactNode}>} props - The component's props.
 * @returns {JSX.Element} The rendered root layout.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={`${orbitron.variable} font-sans antialiased`}>
        {/* AppProviders wraps children with all necessary context providers */}
        <AppProviders>
            {/* Suspense allows TopProgressBar to use client-side hooks without delaying the initial render */}
            <Suspense fallback={null}>
              <TopProgressBar />
            </Suspense>
            {children}
            <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}

    