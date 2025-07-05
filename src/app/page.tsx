
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Root Page Component
 *
 * This component acts as the main entry point for the application's root URL ('/').
 * Its sole purpose is to immediately redirect the user to the main dashboard at '/dashboard'.
 * The authentication status and further routing are handled by the layouts for the '/dashboard' route.
 * This resolves any ambiguity about which page should handle the root path.
 */
export default function RootPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Immediately replace the current history entry with the dashboard route.
    router.replace('/dashboard');
  }, [router]);

  // Display a full-screen loader to provide visual feedback while the redirect occurs.
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background/95">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="mt-3 text-lg">Loading LearnMint...</p>
    </div>
  );
}
