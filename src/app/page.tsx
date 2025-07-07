
"use client";

/**
 * LearnMint: Your AI-Powered Learning Assistant
 * @author MrGarvit
 * 
 * Root Page Component
 * This component acts as the main entry point for the application's root URL ('/').
 * It uses a client-side effect to immediately redirect the user to the dashboard.
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function RootPage() {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    // Immediately replace the current history entry with the dashboard route.
    router.replace('/dashboard');
  }, [router]);

  // Display a full-screen loader to provide visual feedback while the redirect occurs.
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background/95">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="mt-3 text-lg">{t('dashboard.loading')}</p>
    </div>
  );
}
