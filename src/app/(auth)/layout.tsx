
/**
 * LearnMint: Your AI-Powered Learning Assistant
 * @author MrGarvit
 * 
 * This layout component is for the authentication pages (sign-in, sign-up).
 * It ensures that already logged-in (non-guest) users are redirected away from
 * these pages to the main application dashboard, preventing redundant logins.
 */

"use client";

import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { t, isReady: i18nReady } = useTranslation();

  const isLoading = authLoading || !i18nReady;

  useEffect(() => {
    // If auth state is determined and a permanent (non-anonymous) user exists,
    // they should be on the main app, not the auth pages.
    if (!authLoading && user && !user.isAnonymous) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  // While loading auth/i18n, or if a permanent user exists and is about to be redirected, show a loader.
  if (isLoading || (user && !user.isAnonymous)) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background/95">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg">{i18nReady ? t('auth.verifying') : 'Verifying authentication...'}</p>
      </div>
    );
  }
  
  // If not loading and there's no user OR the user is a guest, show the auth pages.
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
