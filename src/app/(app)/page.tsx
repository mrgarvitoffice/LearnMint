
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// This component redirects any traffic from the root of the (app) group to the dashboard.
// This resolves a build conflict with the root src/app/page.tsx file.
export default function AppRootRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  // Render a loader as a fallback while redirecting
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background/95">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="mt-3 text-lg">Redirecting...</p>
    </div>
  );
}
