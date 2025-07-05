
"use client";

import type { ReactNode } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function MainAppLayout({ children }: { children: ReactNode }) {
  const { loading } = useAuth();
  
  if (loading) {
     return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background/95">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg">Verifying your session...</p>
      </div>
    );
  }

  // Once loading is false, the AuthProvider has determined the user state.
  // We can safely render the AppLayout which contains the application UI.
  // Internal components will handle UI differences between signed-in and guest users.
  return <AppLayout>{children}</AppLayout>;
}
