
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
    // If auth is not loading and we have a NON-GUEST user,
    // they should be on the dashboard, not the sign-in/up page.
    if (!loading && user && !user.isAnonymous) {
      router.replace('/');
    }
  }, [user, loading, router]);

  // While loading, or if a non-guest user is being redirected, show a loader.
  // This prevents the sign-in page from flashing before redirecting.
  if (loading || (!loading && user && !user.isAnonymous)) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background/95">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg">Verifying Session...</p>
      </div>
    );
  }
  
  // If not loading, and there's no user OR the user is a guest, show the auth pages.
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
