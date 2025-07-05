"use client";

import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If the initial auth check is done AND a non-guest user exists,
    // redirect them away from the auth pages (sign-in, sign-up) to the dashboard.
    if (!loading && user && !user.isAnonymous) {
      router.replace('/');
    }
  }, [user, loading, router]);

  // While the initial authentication state is loading, display a spinner.
  // This is crucial to prevent a flash of the login page for an already-logged-in user.
  if (loading || (user && !user.isAnonymous)) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg">Loading Session...</p>
      </div>
    );
  }

  // If loading is complete and there's no user (or the user is a guest), render the sign-in/sign-up page.
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
