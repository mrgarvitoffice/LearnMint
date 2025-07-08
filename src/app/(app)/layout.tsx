/**
 * @fileoverview Layout for authenticated application routes.
 * This component wraps all pages that require a user to be logged in.
 * It uses the `useAuth` hook to verify the user's session. If no user is authenticated,
 * it redirects them to the sign-in page, effectively protecting these routes.
 */

"use client";

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function MainAppLayout({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { t, isReady: i18nReady } = useTranslation();

  const isLoading = authLoading || !i18nReady;

  useEffect(() => {
    // If auth state has been checked and there is no user, redirect to the sign-in page.
    if (!authLoading && !user) {
      router.replace('/sign-in');
    }
  }, [user, authLoading, router]);

  // While checking auth state or loading translations, show a full-screen loader.
  if (isLoading) {
     return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background/95">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        {/* Use a safe fallback text before i18n is ready */}
        <p className="mt-3 text-lg">{i18nReady ? t('auth.verifying') : 'Verifying authentication...'}</p>
      </div>
    );
  }

  // If loading is complete and a user exists, render the main application layout.
  if (user) {
    return <AppLayout>{children}</AppLayout>;
  }

  // Fallback loader to show while the redirect is in progress.
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background/95">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="mt-3 text-lg">{i18nReady ? t('auth.redirecting') : 'Redirecting...'}</p>
    </div>
  );
}
