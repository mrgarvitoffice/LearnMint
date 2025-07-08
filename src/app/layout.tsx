/**
 * @fileoverview Root layout for the entire application.
 * This component wraps all pages and is responsible for setting up global providers (like theme and auth),
 * defining metadata for SEO and PWA functionality, and including global styles and fonts.
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
  title: {
    default: "LearnMint – Smarter Way to Study",
    template: "%s | LearnMint",
  },
  description: "LearnMint is a powerful, all-in-one learning platform with flashcards, quizzes, AI chatbot, notes, news, and more. Master concepts the smart way!",
  keywords: ["LearnMint", "LearnMint AI", "study app", "flashcards", "quiz", "chatbot", "ai learning", "smart education platform", "learning tools"],
  authors: [{ name: "MrGarvit" }],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "LearnMint – Smarter Way to Study",
    description: "Smarter flashcards, quizzes, AI chatbot, notes, and news — all in one powerful learning app.",
    images: [{
      url: "https://learnmint-ai.vercel.app/preview.jpg",
      width: 1200,
      height: 630,
      alt: "LearnMint Application Preview"
    }],
    url: "https://learnmint-ai.vercel.app",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LearnMint – Smarter Way to Study",
    description: "Flashcards, AI chatbot, notes, quizzes, and more – all in one AI-powered learning app.",
    images: ["https://learnmint-ai.vercel.app/preview.jpg"],
  },
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
