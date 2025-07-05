
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
    // If auth state is determined and a user exists, they should be on the main app,
    // not the auth pages. This handles both guests and permanent users.
    if (!loading && user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  // While loading OR if a user exists (and is about to be redirected), show a loader.
  // This prevents the sign-in page from flashing for any logged-in user.
  if (loading || user) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background/95">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg">Verifying Session...</p>
      </div>
    );
  }
  
  // If not loading and there's no user, show the auth pages (sign-in, sign-up).
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
