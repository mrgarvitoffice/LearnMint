"use client";

import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

export default function MainAppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // This effect handles redirecting unauthenticated users.
    if (!loading && !user) {
      router.replace('/sign-in');
    }
  }, [user, loading, router]);

  // While loading, show a spinner to prevent flicker or premature redirects.
  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg">Verifying your session...</p>
      </div>
    );
  }

  // If loading is done and we have a user, render the main app layout.
  // If no user, the useEffect above will have already started the redirect,
  // so rendering null here prevents showing the app layout for a split second.
  if (user) {
    return <AppLayout>{children}</AppLayout>;
  }

  // Render a loader while the redirect is in flight.
  return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg">Redirecting...</p>
      </div>
  );
}
