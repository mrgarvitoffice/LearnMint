
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
    // Wait until the authentication check is complete.
    if (loading) {
      return; 
    }
    // If the check is done and there is no user, redirect to the sign-in page.
    if (!user) {
      router.replace('/sign-in');
    }
  }, [user, loading, router]);

  // While the authentication state is loading, display a full-page spinner.
  // This is crucial to prevent a flash of content or a premature redirect.
  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg">Verifying your session...</p>
      </div>
    );
  }

  // If loading is complete and a user object exists, render the main application layout.
  if (user) {
    return <AppLayout>{children}</AppLayout>;
  }

  // If loading is complete and there is no user, the redirect is in flight.
  // Return a loader to provide a smooth transition instead of a blank page.
  return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg">Redirecting...</p>
      </div>
  );
}
