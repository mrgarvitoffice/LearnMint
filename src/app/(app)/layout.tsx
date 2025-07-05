/**
 * LearnMint: Your AI-Powered Learning Assistant
 * @author MrGarvit
 * 
 * This layout component handles the main application view. It wraps all pages
 * that require user authentication. It verifies the user's session and redirects
 * to the sign-in page if no user is found, ensuring protected routes.
 */

"use client";

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function MainAppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If auth state has been checked and there is no user, redirect to the sign-in page.
    if (!loading && !user) {
      router.replace('/sign-in');
    }
  }, [user, loading, router]);

  // While checking the auth state, show a full-screen loader to prevent content
  // flashing and ensure we know the user's status before rendering anything.
  if (loading) {
     return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background/95">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg">Verifying your session...</p>
      </div>
    );
  }

  // If loading is complete and a user exists, render the main application layout.
  // The useEffect hook above handles the redirect case, preventing this from rendering
  // for a logged-out user.
  if (user) {
    return <AppLayout>{children}</AppLayout>;
  }

  // Fallback loader to show while the redirect is in progress.
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background/95">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="mt-3 text-lg">Redirecting...</p>
    </div>
  );
}

    