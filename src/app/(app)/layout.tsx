
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
    // Don't do anything until loading is false
    if (loading) return; 

    // If loading is done and there's no user, redirect to sign-in
    if (!user) {
      router.replace('/sign-in');
    }
  }, [user, loading, router]);

  // While loading, show a spinner. This prevents the redirect logic from firing prematurely.
  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg">Verifying your session...</p>
      </div>
    );
  }

  // If loading is done and we have a user, render the app layout.
  // The useEffect above ensures !user is handled, so this check is safe.
  if (user) {
    return <AppLayout>{children}</AppLayout>;
  }

  // If loading is done and there's no user, the redirect is in-flight. 
  // Return a loader to avoid a flash of content.
  return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg">Redirecting...</p>
      </div>
  );
}
