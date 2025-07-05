
"use client";

import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If auth state is determined and there IS a user,
    // they shouldn't be on an auth page. Redirect them to the dashboard.
    if (!loading && user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  // While the auth context is loading its initial state, show a loader.
  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background/95">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg">Loading Session...</p>
      </div>
    );
  }
  
  // If auth is loaded and there is no user, it's safe to show the sign-in/up page.
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background/95 p-4"
          style={{
              backgroundImage: `
              radial-gradient(at 0% 0%, hsla(180, 100%, 50%, 0.15) 0px, transparent 50%),
              radial-gradient(at 98% 98%, hsla(170, 100%, 50%, 0.1) 0px, transparent 50%),
              linear-gradient(160deg, #00030a, #071a2d)
              `,
              backgroundRepeat: 'no-repeat',
              backgroundAttachment: 'fixed',
          }}
      >
        {children}
      </div>
    );
  }

  // If we reach here, it means !loading && user is true,
  // so the useEffect is about to redirect. Show a loader to prevent flashing the auth page.
  return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background/95">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg">Redirecting to dashboard...</p>
      </div>
  );
}
