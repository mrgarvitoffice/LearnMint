
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
    // If auth has been checked and there is no user, redirect to sign-in page.
    if (!loading && !user) {
      router.replace('/sign-in');
    }
  }, [user, loading, router]);

  // While checking the auth state, show a full-screen loader.
  // This prevents content flash and ensures we know the user's status before rendering.
  if (loading) {
     return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background/95">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg">Verifying your session...</p>
      </div>
    );
  }

  // If loading is complete and we have a user, render the application layout.
  // The useEffect hook above will have already initiated a redirect if no user was found.
  // This prevents rendering the children for a logged-out user.
  if (user) {
    return <AppLayout>{children}</AppLayout>;
  }

  // Fallback while redirecting. This also shows the loader to prevent flashes.
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background/95">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="mt-3 text-lg">Redirecting...</p>
    </div>
  );
}
